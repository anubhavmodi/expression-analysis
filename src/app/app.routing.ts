import { Routes, RouterModule } from '@angular/router';

import { MainComponent }  from './main/main.component';

const appRoutes: Routes = [
  	{
  		path: '',
  		redirectTo: "/main",
  		pathMatch:"full"
    },{
      path: 'main',
      component: MainComponent
    }
];

export const Routing = RouterModule.forRoot(appRoutes);