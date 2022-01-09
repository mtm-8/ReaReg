import {Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateService} from '@ngx-translate/core';
import {AuthService} from '../../service/auth.service';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {MiddlewareURL} from '../../variables/variables';
import {MatDialog} from '@angular/material/dialog';
import {DialogComponent} from '../../component/dialog/dialog.component';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import * as hf from '../../functions/functions';

/**
 * User interface for the table.
 */
export interface User {
  id: number;
  name: string;
  authorization: number;
}

@Component({
  selector: 'app-administration',
  templateUrl: './administration.component.html',
  styleUrls: ['./administration.component.scss']
})

/**
 * Administration component. Shows users, measuring units and type of user creation.
 */
export class AdministrationComponent implements OnInit {
  // Declare variables.
  data: any;
  unitForm: any;
  managementForm: any;
  loading = false;
  submitCheck = false;
  displayedColumns: string[] = ['action', 'name', 'authorization'];

  // @ts-ignore
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  // @ts-ignore
  @ViewChild(MatSort) sort: MatSort;

  /**
   * Constructor.
     */
  constructor(private messageViewer: MatSnackBar, public dialog: MatDialog, public translate: TranslateService, private fb: FormBuilder, private authService: AuthService, private router: Router, private http: HttpClient) {
    // Create FormGroup unitForm with FormControls and validators.
    this.unitForm = fb.group({
      co2aufn: ['', [Validators.required]],
      lactaufn: ['', [Validators.required]],
      kreaaufn: ['', [Validators.required]],
      ecprlact: ['', [Validators.required]],
      ecprpco2: ['', [Validators.required]],
      ecprpao2: ['', [Validators.required]],
      bzaufn: ['', [Validators.required]],
      hbaufn: ['', [Validators.required]]
    });
    // Create FormGroup managementForm with FormControls and validators.
    this.managementForm = fb.group({
      userCreation: ['', [Validators.required]],
    });
    // Get user credentials and measuring units from server.
    this.http.get<any>(MiddlewareURL + '/administration', {headers: hf.getHeader()}).subscribe(data => {
        // Set value of measuring units.
        for (let i = 0; i <= 7; i++) {
          this.unitForm.controls[data.units[i].measField].setValue(data.units[i].measValue.toString());
        }
        this.managementForm.controls.userCreation.setValue(data.management[0].hospCreateUser.toString());
        // Add content to table, paginator and sorting.
        this.data = new MatTableDataSource<User>(data.users);
        this.data.paginator = this.paginator;
        this.data.sort = this.sort;
        // Set accessToken.
        this.authService.setAccessToken(data);
      },
      error => {
        // Handle errors of http get request.
        hf.handleErrors(error, this.authService, this.translate, this.messageViewer, this.router);
      });
  }

  /**
   * Translate paginator.
   * @returns void
   */
  ngOnInit(): void {
    hf.setPaginatorLanguage('paginator.user', this.translate, this.paginator);
  }

  /**
   * Open popup with field information.
   * @returns void
   * @param title - Help text title
   * @param content - Help text content
   */
  openDialog(title: string, content: string): void {
    this.dialog.open(DialogComponent, {width: '300px', data: {title, content}});
  }

  /**
   * Change measuring units.
   * @returns void
   */
  changeMeasuringUnit(): void {
    this.loading = true;
    this.submitCheck = true;
    if (this.unitForm.valid) {
      // Send form and header to server.
      this.http.post<any>(MiddlewareURL + '/measuringUnit', {co2aufn: this.unitForm.value.co2aufn, lactaufn: this.unitForm.value.lactaufn, kreaaufn: this.unitForm.value.kreaaufn, ecprlact: this.unitForm.value.ecprlact, ecprpco2: this.unitForm.value.ecprpco2, ecprpao2: this.unitForm.value.ecprpao2, bzaufn: this.unitForm.value.bzaufn, hbaufn: this.unitForm.value.hbaufn}, {headers: hf.getHeader()}).subscribe(data => {
          // Get data from server set token and display notification with snackBar.
          this.authService.setAccessToken(data);
          this.submitCheck = false;
          this.loading = false;
          hf.successNotification(this.translate.instant('administrationPage.success.units'), this.translate, this.messageViewer);
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
   * Change management settings.
   * @returns void
   */
  changeManagement(): void {
    this.loading = true;
    this.submitCheck = true;
    if (this.unitForm.valid) {
      // Send form and header to server.
      this.http.post<any>(MiddlewareURL + '/management', {userCreation: this.managementForm.value.userCreation}, {headers: hf.getHeader()}).subscribe(data => {
          // Get data from server set token and display notification with snackBar.
          this.authService.setAccessToken(data);
          this.submitCheck = false;
          this.loading = false;
          hf.successNotification(this.translate.instant('administrationPage.success.management'), this.translate, this.messageViewer);
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
   * Go back one page in the sessions history.
   * @returns void
   */
  back(): void {
    window.history.back();
  }

  /**
   * Redirect to addUser page.
   * @returns void
   */
  goToAddUserPage(): void {
    this.router.navigate(['addUser']);
  }
}
