import {Component} from '@angular/core';
import {AuthService} from '../../service/auth.service';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {CustomValidators} from '../../interface/custom-validators';
import * as hf from '../../functions/functions';
import {MiddlewareURL} from '../../variables/variables';
import {ErrorStateMatcher} from '@angular/material/core';
import {CustomErrorStateMatcher} from '../../interface/custom-error-state-matcher';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  providers: [{provide: ErrorStateMatcher, useClass: CustomErrorStateMatcher}]
})
/**
 * User page component. Change password of own user.
 */
export class UserComponent {
  // Declare variables.
  loading = false;
  userForm: FormGroup;
  submitCheck = false;

  /**
   * Constructor.
   */
  constructor(private messageViewer: MatSnackBar, public translate: TranslateService, private fb: FormBuilder, private authService: AuthService, private router: Router, private http: HttpClient) {
    // Setup FormControl for user form.
    this.userForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*[\\d$@$!%*?&]).*$')]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*[\\d$@$!%*?&]).*$')]]
    }, {validators: CustomValidators.passwordMatchValidator});
    // Check accessToken  on server.
    this.http.get<any>(MiddlewareURL + '/token', {headers: hf.getHeader()}).subscribe(data => {
        // Set accessToken.
        this.authService.setAccessToken(data);
      },
      error => {
        // Handle errors of http get request.
        hf.handleErrors(error, this.authService, this.translate, this.messageViewer, this.router);
      });
  }

  /**
   * Change user password on server.
   * @returns void
   */
  changeUserPassword(): void {
    this.loading = true;
    this.submitCheck = true;
    if (this.userForm.valid) {
      // Send form and header to server.
      this.http.put<any>(MiddlewareURL + '/user', {password: this.userForm.value.password, confirmPassword: this.userForm.value.confirmPassword}, {headers: hf.getHeader()}).subscribe(data => {
          // Get data from server, reset form and display notification with snackBar.
          this.authService.setAccessToken(data);
          this.submitCheck = false;
          this.loading = false;
          hf.resetForm(this.userForm);
          hf.successNotification(this.translate.instant('userPage.success.passwordChanged'), this.translate, this.messageViewer);
        },
        error => {
          this.submitCheck = this.loading = false;
          // Handle error of http put request.
          hf.handleErrors(error, this.authService, this.translate, this.messageViewer, this.router);
        });
    } else {
      this.loading = false;
    }
  }
}
