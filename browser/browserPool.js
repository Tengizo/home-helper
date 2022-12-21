const puppeteer = require("puppeteer");
const crypto = require("crypto");
const EventEmitter = require("events");
const Queue = require("./queue");
const eventEmitter = new EventEmitter();
const Log = require("../config/logger").logger("browserPool.js");

class BrowserPool {
  browsers = new Map();
  requests = new Queue();

  constructor({ size = 3, headless = true, handleSIGINT = false }) {
    this.size = size;
    this.headless = headless;
    this.handleSIGINT = handleSIGINT;
    this.#listenToVacatedBrowsers();
    this.#listenToRequests();
    setInterval(() => {
      this.#logBrowsers();
    }, 1000 * 60 * 1);
  }
  #logBrowsers() {
    const values = Array.from(this.browsers.values());
    const obj = values.map((browser) => {
      return { uuid: browser?.browser?.uuid, inUse: browser.inUse };
    });
    const jsonString = JSON.stringify(obj);
    Log.info(`Browsers Map: ${jsonString}`);
  }
  async getBrowser() {
    Log.debug(`Browser requested`);
    return new Promise((resolve, reject) => {
      this.requests.enqueue({ resolve, reject });
      eventEmitter.emit("new-browser-request");
    });
  }

  #vacateBrowser(uuid) {
    let br = this.browsers.get(uuid);
    br.inUse = false;
    this.browsers.set(uuid, br);
  }

  #deleteBrowser(uuid) {
    this.browsers.delete(uuid);
  }

  async #createNewBrowser() {
    if (this.browsers.size >= this.size) {
      return undefined;
    }
    const uuid = crypto.randomUUID();
    this.browsers.set(uuid, { browser: undefined, inUse: true });

    Log.debug(`Creating new browser current size: ${this.browsers.size}`);
    const browser = await puppeteer.launch({ headless: this.headless });
    browser.uuid = uuid;
    this.browsers.set(browser.uuid, { browser, inUse: false });

    const vacateBrowser = this.#vacateBrowser.bind(this);
    const deleteBrowser = this.#deleteBrowser.bind(this);

    Object.getPrototypeOf(browser).close = async function (fully) {
      Log.debug(`Browser with uuid ${this.uuid} closed`);
      if (fully) {
        deleteBrowser(this.uuid);
        await this.close();
      }
      const pages = await this.pages();
      Log.debug(`Browser ${this.uuid} has ${pages.length} pages`);

      for (const page of pages) {
        Log.info(`Closing Browser Page`);
        await page.close();
      }
      vacateBrowser(this.uuid);
      eventEmitter.emit("browser-vacated", this.uuid);
    };

    browser.on("disconnected", () => {
      Log.info(`Browser with uuid ${uuid} disconnected`);
      this.browsers.delete(uuid);
    });
    Log.debug(`Created new browser with uuid ${browser.uuid}`);
    return browser;
  }

  #listenToRequests() {
    eventEmitter.on("new-browser-request", async () => {
      Log.debug(`New browser request`);
      if (!this.requests.isEmpty) {
        // this.#logBrowsers();
        let browser = this.getAvailableBrowser();
        if (!browser) {
          browser = await this.#createNewBrowser();
        }
        if (browser) {
          if (!this.requests.isEmpty) {
            this.requests.dequeue().resolve(browser);
            this.browsers.get(browser.uuid).inUse = true;
          }
        }
      } else Log.debug(`Requests are empty!!!`);
    });
  }

  #listenToVacatedBrowsers() {
    eventEmitter.on("browser-vacated", (uuid) => {
      if (!this.requests.isEmpty) {
        const request = this.requests.dequeue();
        if (request) {
          request.resolve(this.browsers.get(uuid).browser);
        }
      }
      Log.debug(`Browser with uuid ${uuid} vacated`);
    });
  }

  getAvailableBrowser() {
    for (const [uuid, { browser, inUse }] of this.browsers) {
      if (!inUse) {
        return browser;
      }
    }
    return undefined;
  }
}

module.exports = BrowserPool;
