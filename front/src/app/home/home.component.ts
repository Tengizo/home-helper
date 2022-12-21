import {Component} from '@angular/core';
import {PageEvent} from '@angular/material/paginator';
import {MatSnackBar} from '@angular/material/snack-bar';
import {HomeService} from '../services/home.service';


type Filter = {
  keyword: string,
  homeStatus: string;
  selectedLabels: number[];
  priceFrom?: Number;
  priceTo?: Number;
  statuses: string[];
};

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  filter: Filter = {
    keyword: '',
    homeStatus: '',
    statuses: [],
    selectedLabels: []
  };
  dateFilter: { dateFrom?: Date, dateTo?: Date } = {};
  sort = {sortField: 'date', sortDirection: -1};
  length = 50;
  pageSize = 30;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50, 100];

  hidePageSize = false;
  showPageSizeOptions = true;
  showFirstLastButtons = true;
  disabled = false;

  items: any[] = [];
  labels: number[] = [];
  sorts: string[] = ['date', 'label', 'm2Price'];
  statuses: string[] = [
    'ახალი გარემონტებული',
    'მიმდინარე რემონტი',
    'სარემონტო',
    'ძველი გარემონტებული',
    'თეთრი კარკასი',
    'შავი კარკასი',
    'მწვანე კარკასი'
  ];

  constructor(private homeService: HomeService, private _snackBar: MatSnackBar) {
    this.fillLabels();
    this.searchHomes();


  }

  searchHomes() {
    const dateFilter: any = {};
    if (this.dateFilter.dateFrom) {
      dateFilter.dateFrom = this.dateFilter.dateFrom.getTime();
    }
    if (this.dateFilter.dateTo) {
      dateFilter.dateTo = this.dateFilter.dateTo.getTime();
    }
    const fltr = {
      page: this.pageIndex,
      pageSize: this.pageSize,
      ...this.filter,
      ...dateFilter,
      ...this.sort
    };
    if (!fltr.priceFrom) {
      delete fltr.priceFrom;
    }
    if (!fltr.priceTo) {
      delete fltr.priceTo;
    }
    this.homeService.search(fltr).subscribe((data) => {
      this.items = data?.content
      this.length = data?.totalItems;
      this.pageIndex = data?.page;
      this.pageSize = data?.pageSize;
    });
  }

  updateStatus(id: any, status: any) {
    this.homeService.updateStatus(id, status).subscribe((data) => {
      console.log(`status Updated`, data);
      // this.openSnackBar(`Status Updated: ${status}`, 'Close');
      this.searchHomes();
    });
  }

  handlePageEvent(e: PageEvent) {
    this.length = e.length;
    this.pageSize = e.pageSize;
    this.pageIndex = e.pageIndex;
    this.searchHomes();
  }


  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action);
  }

  updateFilter(status: string) {
    this.filter.homeStatus = status;
    this.searchHomes();
  }

  private fillLabels() {
    for (let i = 0; i < 30; i++) {
      this.labels.push(i);
    }
  }

  selectLabel(label: number) {
    if (this.filter.selectedLabels.includes(label)) {
      this.filter.selectedLabels = this.filter.selectedLabels.filter(l => l !== label);
    } else {
      this.filter.selectedLabels.push(label);
    }
    this.searchHomes();
  }

  selectSort(sort: string) {
    if (sort === this.sort.sortField) {
      this.sort.sortDirection = this.sort.sortDirection * -1;
    }
    this.sort.sortField = sort;
    this.searchHomes();
  }

  selectStatus(status: string) {
    if (this.filter?.statuses?.includes(status)) {
      this.filter.statuses = this.filter.statuses.filter(l => l !== status);
    } else {
      this.filter.statuses?.push(status);
    }
    console.log(`this.filter.statuses`, this.filter.statuses);
    this.searchHomes();
  }
}
