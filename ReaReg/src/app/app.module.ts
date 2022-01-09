import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {ServiceWorkerModule} from '@angular/service-worker';
import {environment} from '../environments/environment';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MenuComponent} from './component/menu/menu.component';
import {FilterComponent} from './component/filter/filter.component';
import {ImportComponent} from './page/import/import.component';
import {OverviewComponent} from './page/overview/overview.component';
import {ProtocolComponent} from './page/protocol/protocol.component';
import {SettingsComponent} from './page/settings/settings.component';
import {UserComponent} from './page/user/user.component';
import {LoginComponent} from './page/login/login.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatTabsModule} from '@angular/material/tabs';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatCardModule} from '@angular/material/card';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatMenuModule} from '@angular/material/menu';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatListModule} from '@angular/material/list';
import {MatRadioModule} from '@angular/material/radio';
import {MatDividerModule} from '@angular/material/divider';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSortModule} from '@angular/material/sort';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatSelectModule} from '@angular/material/select';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatMomentDateModule} from '@angular/material-moment-adapter';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {MatStepperModule} from '@angular/material/stepper';
import {AdministrationComponent} from './page/administration/administration.component';
import {AddComponent} from './page/administration/user/add/add.component';
import {EditComponent} from './page/administration/user/edit/edit.component';
import {ExportComponent} from './page/export/export.component';
import {DialogComponent} from './component/dialog/dialog.component';
import {MatDialogModule} from '@angular/material/dialog';
import {DialogConfirmComponent} from './component/dialog-confirm/dialog-confirm.component';
import {AuthorizationComponent} from './component/authorization/authorization.component';
import {JwtModule} from '@auth0/angular-jwt';
import {PageNotFoundComponent} from './component/page-not-found/page-not-found.component';
import {LegalComponent} from './page/legal/legal.component';
import {NgxMaterialTimepickerComponent, NgxMaterialTimepickerModule} from 'ngx-material-timepicker';
import {DialogPatIdComponent} from './component/dialog-pat-id/dialog-pat-id.component';
import {FloatNumberDirective} from './float-number.directive';

/**
 * Loads language using HttpClient
 * @author Olivier Combe - https://github.com/ngx-translate/http-loader
 * @param http - HttpClient to load languages
 * @returns TranslateHttpLoader - Load languages
 */
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http);
}

/**
 * Get accessToken from local storage.
 * @returns: string - Get accessToken
 */
export function tokenGetter(): string {
  return localStorage.getItem('accessToken') as string;
}

@NgModule({
  declarations: [
    // Declare all created components.
    AppComponent,
    MenuComponent,
    FilterComponent,
    LoginComponent,
    ImportComponent,
    OverviewComponent,
    ProtocolComponent,
    SettingsComponent,
    MenuComponent,
    UserComponent,
    AdministrationComponent,
    AddComponent,
    EditComponent,
    ExportComponent,
    DialogComponent,
    DialogConfirmComponent,
    AuthorizationComponent,
    PageNotFoundComponent,
    LegalComponent,
    DialogPatIdComponent,
    FloatNumberDirective,
  ],
  imports: [
    // Standard modules and service worker module.
    BrowserModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', {enabled: environment.production}),
    BrowserAnimationsModule,
    // Material-ui modules.
    MatIconModule,
    MatCardModule,
    MatCardModule,
    MatInputModule,
    MatSnackBarModule,
    MatTabsModule,
    MatButtonModule,
    MatToolbarModule,
    MatProgressBarModule,
    MatMenuModule,
    MatSidenavModule,
    MatListModule,
    MatRadioModule,
    MatExpansionModule,
    MatDividerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatStepperModule,
    MatCheckboxModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatDialogModule,
    MatSlideToggleModule,
    // Date module.
    MatMomentDateModule,
    // Time module.
    NgxMaterialTimepickerModule.setLocale('de-CH'),
    // Forms modules.
    ReactiveFormsModule,
    FormsModule,
    // Http requests module.
    HttpClientModule,
    // Translations module.
    TranslateModule.forRoot({loader: {provide: TranslateLoader, useFactory: HttpLoaderFactory, deps: [HttpClient]}}),
    // JWT Module.
    JwtModule.forRoot({config: {tokenGetter}}),
  ],
  providers: [MenuComponent, NgxMaterialTimepickerComponent],
  bootstrap: [AppComponent]
})
export class AppModule {
}
