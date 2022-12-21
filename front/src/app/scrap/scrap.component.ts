import {Component} from '@angular/core';
import {PageEvent} from '@angular/material/paginator';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ScrapService} from '../services/scrap.service';

type Scrap = {
  url: string;
  startPage: number;
  totalPages: number;
}

@Component({
  selector: 'app-scrap',
  templateUrl: './scrap.component.html',
  styleUrls: ['./scrap.component.scss']
})
export class ScrapComponent {

  scrap: Scrap = {
    url: '',
    startPage: 0,
    totalPages: 10
  }
  sort = {sortField: 'date', sortDirection: -1};
  length = 50;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50, 100];

  hidePageSize = false;
  showPageSizeOptions = true;
  showFirstLastButtons = true;
  disabled = false;

  items: any[] = [];
  labels: number[] = [];
  interval: any;

  constructor(private scrapService: ScrapService, private _snackBar: MatSnackBar) {
    this.searchScraps();
  }

  private searchScraps() {
    this.scrapService.search({
      page: this.pageIndex,
      pageSize: this.pageSize
    }).subscribe((data) => {
      this.items = data?.content
      this.length = data?.totalItems;
      this.pageIndex = data?.page;
      this.pageSize = data?.pageSize;
      const containsRunning = this.items.some(item => item.status === 'RUNNING');
      if (containsRunning) {
        if (!this.interval) {
          this.interval = setInterval(() => {
            this.searchScraps();
          }, 10000);
        }
      } else {
        if (this.interval) {
          clearInterval(this.interval);
        }
      }
    });
  }

  handlePageEvent(e: PageEvent) {
    this.length = e.length;
    this.pageSize = e.pageSize;
    this.pageIndex = e.pageIndex;
    this.searchScraps();
  }


  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action);
  }

  submitScrap() {
    this.scrapService.requestScrap(this.scrap).subscribe((data) => {
      this.openSnackBar(`Scrap Requested: ${data.uuid}`, 'Close');
      this.searchScraps();
    });

  }

  getProgress(scrap: any) {
    scrap.totalPages/100
    return undefined;
  }
}
