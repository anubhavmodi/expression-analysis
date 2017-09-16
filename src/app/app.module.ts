import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { Routing } from './app.routing';

import { AppComponent } from './app.component';
import { MainComponent } from './main/main.component';
import { CognitiveApiService } from './common/cognitive-api/cognitive-api.service';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    Routing
  ],
  providers: [CognitiveApiService],
  bootstrap: [AppComponent]
})
export class AppModule { }
