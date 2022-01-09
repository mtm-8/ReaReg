import {Component} from '@angular/core';
import {AuthService} from '../../service/auth.service';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {TranslateService} from '@ngx-translate/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {AppComponent} from '../../app.component';
import * as hf from '../../functions/functions';
import {MiddlewareURL} from '../../variables/variables';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
/**
 * Settings page component. Change language.
 */
export class SettingsComponent {
  // Declare variables.
  language: string;

  /**
   * Constructor.
   */
  constructor(private messageViewer: MatSnackBar, public translate: TranslateService, private authService: AuthService, private router: Router, private http: HttpClient, private lang: AppComponent) {
    // Get language from localStorage.
    this.language = localStorage.getItem('language') as string;
    // Check accessToken on server.
    this.http.get(MiddlewareURL + '/token', {headers: hf.getHeader()}).subscribe(data => {
        // Set accessToken.
        this.authService.setAccessToken(data);
      },
      error => {
        // Handle errors of http get request.
        hf.handleErrors(error, this.authService, this.translate, this.messageViewer, this.router);
      });
  }

  /**
   * Change language.
   * @returns void
   */
  changeLanguage(): void {
    // Check whether the language is available.
    if (this.translate.getLangs().includes(this.language)) {
      // Set language and notify user with snackBar.
      this.lang.setTranslationLanguage(this.language);
      localStorage.setItem('language', this.language);
      hf.successNotification(this.translate.instant('settingsPage.info.language'), this.translate, this.messageViewer);
    } else {
      // Notify user with snackBar.
      hf.errorNotification(this.translate.instant('settingsPage.error.language'), this.translate, this.messageViewer);
    }
  }
}
