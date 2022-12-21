import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from './home/home.component';
import {ScrapComponent} from './scrap/scrap.component';


const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'scraps',
    component: ScrapComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
