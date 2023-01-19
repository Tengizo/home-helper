const puppeteer = require('puppeteer');

async function scrapeData() {
    // Launch a headless Chrome browser
    const browser = await puppeteer.launch();

    // Open a new page in the browser
    const page = await browser.newPage();

    // Navigate to the website
    await page.goto("https://www.myhome.ge/en/search?search_text=tbilisi");

    // Wait for the page to load
    await page.waitForSelector(".card-title");

    // Extract the data from the page
    const data = await page.evaluate(() => {
        // Find all the elements with the class "card-item"
        const elements = document.querySelectorAll(".card-item");

        // Extract the data from each element
        return Array.from(elements).map(element => {
            // Extract the date from the element
            const date = element.querySelector(".item-date").innerText;

            // Extract the ID from the element
            const id = element.querySelector(".item-id").innerText;

            // Extract the area from the element
            const area = element.querySelector(".item-area").innerText;

            // Extract the price from the element
            const price = element.querySelector(".item-price").innerText;

            // Extract the number of total floors in the building from the element
            const totalFloors = element.querySelector(".item-floors").innerText;

            // Extract the floor of the apartment from the element
            const floor = element.querySelector(".item-apartment-floor").innerText;

            // Extract the number of rooms from the element
            const rooms = element.querySelector(".item-rooms").innerText;

            return {
                date: date,
                id: id,
                area: area,
                price: price,
                totalFloors: totalFloors,
                floor: floor,
                rooms: rooms
            };
        });
    });

    // Print the data
    console.log(data);

    // Close the browser
    await browser.close();
}

scrapeData();