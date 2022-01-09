import {Component} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {AuthService} from './service/auth.service';
import * as hf from './functions/functions';
import {JwtHelperService} from '@auth0/angular-jwt';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
/**
 * App component.
 */
export class AppComponent {
  constructor(private translate: TranslateService, private authService: AuthService, private messageViewer: MatSnackBar, public jwtHelper: JwtHelperService) {
    // Set default language to german.
    translate.setDefaultLang('de');
    translate.addLangs(['en', 'fr', 'it']);
    // Check whether the language is stored in the localStorage. if not, it selects the browser language.
    if (localStorage.getItem('language') === null) {
      translate.use(translate.getBrowserLang());
      localStorage.setItem('language', translate.getBrowserLang());
    } else {
      translate.use(localStorage.getItem('language') as string);
    }
    // Check whether the import language is stored in the localStorage.
    if (localStorage.getItem('languageImport') === null) {
      localStorage.setItem('languageImport', translate.getBrowserLang());
    }

    /**
     * Check login status.
     * @returns void
     */
    setInterval(() => {
      if (localStorage.getItem('accessToken') !== null) {
        const dateToken = jwtHelper.getTokenExpirationDate(localStorage.getItem('accessToken') as string) as Date;
        const dateNow = new Date();
        const interval = dateToken.getTime() - dateNow.getTime();
        if (interval <= 5 * 60000 && interval > 4 * 60000) {
          hf.infoNotification(translate.instant('message.infoLogout', {min: Math.round(interval / 60000)}), translate, messageViewer);
        } else if (interval < 60000) {
          authService.logout();
        }
      }
    }, 60000);
  }

  // set translation language
  setTranslationLanguage(lang: string): void {
    this.translate.use(lang);
  }
}
