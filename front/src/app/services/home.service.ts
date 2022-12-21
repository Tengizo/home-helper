import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';

const BASE_URL = environment.SERVER_BASE_URL + 'property';

@Injectable({
  providedIn: 'root'
})
export class HomeService {

  constructor(private http: HttpClient) {
  }

  search(filter: any): Observable<any> {
    return this.http.get(BASE_URL + '/search', {params: filter});
  }

  updateStatus(id: string, status: string): Observable<any> {
    return this.http.post(`${BASE_URL}/update-status`, {id, status});
  }


}
