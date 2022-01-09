import {Component} from '@angular/core';
import {MiddlewareURL, REDCapURLExport} from '../../variables/variables';
import {DomSanitizer} from '@angular/platform-browser';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {AuthService} from '../../service/auth.service';
import * as hf from '../../functions/functions';
import {TranslateService} from '@ngx-translate/core';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-export',
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.scss']
})
/**
 * Export page component. Show export page of REDCap.
 */
export class ExportComponent {
  // Declare variables.
  redcapURLExport: any;

  /**
   * Constructor.
   */
  constructor(private sanitizer: DomSanitizer, public authService: AuthService, private router: Router, private http: HttpClient, private translate: TranslateService, private messageViewer: MatSnackBar) {
    // Check accessToken on server.
    this.http.get<any>(MiddlewareURL + '/token', {headers: hf.getHeader()}).subscribe(data => {
        if (authService.isAuthorizedLvl2()) {
          // Set REDCap export link and do not check link.
          this.redcapURLExport = this.sanitizer.bypassSecurityTrustResourceUrl(REDCapURLExport);
        }
        this.authService.setAccessToken(data);
      },
      error => {
        // Handle errors of http get request.
        hf.handleErrors(error, this.authService, this.translate, this.messageViewer, this.router);
      });
  }
}
