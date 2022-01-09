import {Component, HostListener} from '@angular/core';
import {MiddlewareURL, REDCapURLAddUser, REDCapURLCreateUser, REDCapURLToken} from '../../../../variables/variables';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {TranslateService} from '@ngx-translate/core';
import {AuthService} from '../../../../service/auth.service';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {CustomValidators} from '../../../../interface/custom-validators';
import {DomSanitizer} from '@angular/platform-browser';
import * as hf from '../../../../functions/functions';
import {ErrorStateMatcher} from '@angular/material/core';
import {CustomErrorStateMatcher} from '../../../../interface/custom-error-state-matcher';

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.scss'],
  providers: [{provide: ErrorStateMatcher, useClass: CustomErrorStateMatcher}]
})

/**
 * Add user component. Allow user creation.
 */
export class AddComponent {
  // Declare variables.
  data: any;
  userForm: any;
  tokenForm: any;
  loading = false;
  authorization = 0;
  redcapURLCreateUser: any;
  redcapURLAddUser: any;
  redcapURLToken: any;
  users: any;
  submitCheck = false;
  creation = 0;
  iframeSize = 0;

  /**
   * Constructor.
     */
  constructor(private sanitizer: DomSanitizer, private messageViewer: MatSnackBar, public dialog: MatDialog, public translate: TranslateService, private fb: FormBuilder, private authService: AuthService, private router: Router, private http: HttpClient) {
    // Get authorization from token.
    this.authorization = authService.getUserAuthorization();
    // Get all users from server.
    this.http.get<any>(MiddlewareURL + '/administration/adduser', {headers: hf.getHeader()}).subscribe(data => {
        // Set token and users.
        this.authService.setAccessToken(data);
        this.users = data.users;
        if (this.authorization === 3) {
          // Set global links and prevent security check.
          this.redcapURLCreateUser = this.sanitizer.bypassSecurityTrustResourceUrl(REDCapURLCreateUser);
          this.redcapURLAddUser = this.sanitizer.bypassSecurityTrustResourceUrl('');
          this.redcapURLToken = this.sanitizer.bypassSecurityTrustResourceUrl('');
          this.creation = data.management[0].hospCreateUser;
          // Create form with validators.
          this.userForm = fb.group({
            authorization: ['', [Validators.required]],
            username: ['', [Validators.minLength(3), Validators.maxLength(75), Validators.required, CustomValidators.userAlreadyExistsValidator(this.users)]],
            password: ['', [Validators.required, Validators.minLength(8), Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*[\\d$@$!%*?&]).*$')]],
            confirmPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*[\\d$@$!%*?&]).*$')]]
          }, {validators: CustomValidators.passwordMatchValidator});
          this.tokenForm = fb.group({token: ['', [Validators.required]]});
        }
      },
      error => {
        // Call handleErrors function to handle different types of errors.
        hf.handleErrors(error, this.authService, this.translate, this.messageViewer, this.router);
      });
    this.iframeSize = window.innerHeight - 333;
  }

  /**
   * Set the iframe height.
   * @param event - Get event
   * @returns void
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.iframeSize = window.innerHeight - 333;
  }

  /**
   * Create user.
   * @returns void
   */
  createUser(): void {
    this.loading = true;
    this.submitCheck = true;
    // If form is valid.
    if (this.userForm.valid && this.tokenForm.valid) {
      // Send form and header to server.
      this.http.post<any>(MiddlewareURL + '/administration/user', {username: this.userForm.value.username, password: this.userForm.value.password, confirmPassword: this.userForm.value.confirmPassword, token: this.tokenForm.value.token, authorization: this.userForm.value.authorization}, {headers: hf.getHeader()}).subscribe(data => {
          // Refresh Token, notify user and navigate to administration page.
          this.authService.setAccessToken(data);
          hf.successNotification(this.translate.instant('administrationPage.user.add.success'), this.translate, this.messageViewer);
          this.router.navigate(['/administration']);
        },
        error => {
          this.loading = false;
          this.submitCheck = false;
          // Handle error of http post request.
          hf.handleErrors(error, this.authService, this.translate, this.messageViewer, this.router);
        });
    } else {
      this.loading = false;
    }
  }

  /**
   * Load links after login to REDCap.
   * @returns void
   */
  loadLinks(): void {
    this.redcapURLAddUser = this.sanitizer.bypassSecurityTrustResourceUrl(REDCapURLAddUser);
    this.redcapURLToken = this.sanitizer.bypassSecurityTrustResourceUrl(REDCapURLToken);
  }
}
