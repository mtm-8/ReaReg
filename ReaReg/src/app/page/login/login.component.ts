import {Component} from '@angular/core';
import {AuthService} from '../../service/auth.service';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {FormBuilder, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import * as hf from '../../functions/functions';
import {AppComponent} from '../../app.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})

/**
 * Login component. Login user.
 */
export class LoginComponent {
  // Declare variables.
  loginForm: any;
  loading = false;
  loginCheck = false;
  hide = true;

  /**
   * Constructor.
   */
  constructor(private messageViewer: MatSnackBar, private fb: FormBuilder, public translate: TranslateService, private lang: AppComponent, private authService: AuthService, private router: Router, private http: HttpClient, private route: ActivatedRoute) {
    // If status in navigation link is 1 notify user.
    if (this.route.snapshot.paramMap.get('status') === '1') {
      hf.successNotification(this.translate.instant('loginPage.info.logout'), this.translate, this.messageViewer);
      this.router.navigate(['/login']);
    }
    // Setup FormControl for login form.
    this.loginForm = fb.group({
      username: ['', Validators.compose([Validators.minLength(3), Validators.maxLength(75), Validators.required])],
      password: ['', Validators.compose([Validators.minLength(3), Validators.required])],
    });
  }

  /**
   * Check user credentials.
   * @returns void
   */
  login(): void {
    this.loading = true;
    this.loginCheck = true;
    if (this.loginForm.valid) {
      // Check user credentials on server.
      this.authService.validate(this.loginForm.value.username, this.loginForm.value.password)
        .then((response) => {
          // If user successfully logged in then set accessToken to localstorage.
          this.authService.setAccessToken(response);
          // If token successfully saved in local storage redirect to overview and reset variables.
          if (localStorage.getItem('accessToken') != null) {
            this.messageViewer.dismiss();
            this.router.navigate(['/overview']);
            hf.resetForm(this.loginForm);
            this.loading = false;
          }
        }).catch(error => {
        // Handle errors of http get request.
        if (error.status === 403) {
          hf.errorNotification(this.translate.instant('loginPage.error.user'), this.translate, this.messageViewer);
        } else {
          hf.handleErrors(error, this.authService, this.translate, this.messageViewer, this.router);
        }
        this.loading = false;
      });
    } else {
      this.loading = false;
    }
  }

  /**
   *  Change language.
   * @param lang - The language to be changed
   * @returns void
   */
  changeLanguage(lang: string): void {
    // Check if language exists.
    if (this.translate.getLangs().includes(lang)) {
      // Set language and notify user.
      this.lang.setTranslationLanguage(lang);
      localStorage.setItem('language', lang);
      hf.successNotification(this.translate.instant('settingsPage.info.language'), this.translate, this.messageViewer);
    } else {
      // Handle error on language change.
      hf.errorNotification(this.translate.instant('settingsPage.error.language'), this.translate, this.messageViewer);
    }
  }
}
