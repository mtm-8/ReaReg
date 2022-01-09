import {Component} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {TranslateService} from '@ngx-translate/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../../../../service/auth.service';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {MiddlewareURL} from '../../../../variables/variables';
import {CustomValidators} from '../../../../interface/custom-validators';
import {DialogConfirmComponent} from '../../../../component/dialog-confirm/dialog-confirm.component';
import * as hf from '../../../../functions/functions';
import {ErrorStateMatcher} from '@angular/material/core';
import {CustomErrorStateMatcher} from '../../../../interface/custom-error-state-matcher';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
  providers: [{provide: ErrorStateMatcher, useClass: CustomErrorStateMatcher}]
})

/**
 * Edit user page component. Change user credentials.
 */
export class EditComponent {
  // Declare variables.
  data: any;
  userForm: FormGroup;
  loading = false;
  authorization = 0;
  users: any;
  submitCheck = false;
  id: any;
  userId: any;
  userName: any;

  /**
   * Constructor.
     */
  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer, private messageViewer: MatSnackBar, public dialog: MatDialog, public translate: TranslateService, private fb: FormBuilder, private authService: AuthService, private router: Router, private http: HttpClient) {
    this.id = this.route.snapshot.paramMap.get('id');
    this.userId = authService.getUserId();
    this.authorization = authService.getUserAuthorization();
    // Create form with validators.
    this.userForm = fb.group({
      authorization: ['', [Validators.required]],
      username: [''],
      password: ['', [Validators.minLength(8), Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*[\\d$@$!%*?&]).*$')]],
      confirmPassword: ['', [Validators.minLength(8), Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*[\\d$@$!%*?&]).*$')]],
      token: ['']
    }, {validators: CustomValidators.passwordMatchValidator});
    // Get all users from server.
    this.http.get<any>(MiddlewareURL + '/administration/user/' + this.id, {headers: hf.getHeader()}).subscribe(data => {
        // Set token and variable.
        this.authService.setAccessToken(data);
        this.users = data.users;
        this.userForm.controls.username.setValue(data.user[0].userName);
        this.userName = data.user[0].userName;
        this.userForm.controls.username.setValidators([Validators.minLength(3), Validators.maxLength(75), Validators.required, CustomValidators.userAlreadyExistsValidator(this.users, this.userName)]);
        this.userForm.controls.authorization.setValue(data.user[0].userAuthorization.toString());
      },
      error => {
        // Handle errors of http get request.
        hf.handleErrors(error, this.authService, this.translate, this.messageViewer, this.router);
      });
  }

  /**
   * Edit user.
   * @returns void
   */
  editUser(): void {
    this.loading = true;
    this.submitCheck = true;
    // If form is valid.
    if (this.userForm.valid) {
      // Send form and header to server.
      this.http.put<any>(MiddlewareURL + '/administration/user/' + this.id, {username: this.userForm.value.username, password: this.userForm.value.password, confirmPassword: this.userForm.value.confirmPassword, token: this.userForm.value.token, authorization: this.userForm.value.authorization}, {headers: hf.getHeader()}).subscribe(data => {
          // Notify user and navigate to administration page.
          this.authService.setAccessToken(data);
          hf.successNotification(this.translate.instant('administrationPage.user.edit.success.changed', {username: this.userForm.value.username}), this.translate, this.messageViewer);
          this.router.navigate(['/administration']);
        },
        error => {
          this.loading = false;
          this.submitCheck = false;
          // Handle error of http put request.
          hf.handleErrors(error, this.authService, this.translate, this.messageViewer, this.router);
        });
    } else {
      this.loading = false;
    }
  }

  /**
   * Delete user.
   * @returns void
   */
  delete(): void {
    // Open the dialog to confirm the deletion.
    const title = this.translate.instant('administrationPage.user.edit.confirmTitle', {username: this.userForm.value.username});
    const dialogRef = this.dialog.open(DialogConfirmComponent, {width: '300px', data: {title}});
    dialogRef.afterClosed().subscribe(result => {
      // If delete button is pressed in the dialog, the user is deleted.
      if (result) {
        this.http.delete<any>(MiddlewareURL + '/administration/user/' + this.id, {headers: hf.getHeader()}).subscribe(data => {
            // Refresh Token, notify user and navigate to administration page.
            this.authService.setAccessToken(data);
            hf.successNotification(this.translate.instant('administrationPage.user.edit.success.deleted', {username: this.userForm.value.username}), this.translate, this.messageViewer);
            this.router.navigate(['/administration']);
          },
          error => {
            // Handle error of http delete request.
            hf.handleErrors(error, this.authService, this.translate, this.messageViewer, this.router);
          });
      }
    });
  }
}
