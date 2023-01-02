import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';

const BASE_ACC_URL = environment.SERVER_BASE_URL + 'scrap';

@Injectable({
  providedIn: 'root'
})
export class ScrapService {

  constructor(private http: HttpClient) {
  }

  requestScrap(scrap: any): Observable<any> {
    return this.http.post(BASE_ACC_URL + '/scrap-url', scrap);
  }

  getScrap(id: string): Observable<any> {
    return this.http.get(`${BASE_ACC_URL}/get-status/${id}`);
  }

  deleteScrap(id: string): Observable<any> {
    return this.http.delete(`${BASE_ACC_URL}/delete/${id}`);
  }

  search(filter: any): Observable<any> {
    return this.http.get(`${BASE_ACC_URL}/search`, {params: filter});
  }

}
