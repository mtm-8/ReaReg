import {Component} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {AuthService} from '../../service/auth.service';
import {Router} from '@angular/router';
import {MiddlewareURL} from '../../variables/variables';
import * as hf from '../../functions/functions';
import {TranslateService} from '@ngx-translate/core';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-legal',
  templateUrl: './legal.component.html',
  styleUrls: ['./legal.component.scss']
})
/**
 * Legal page component. Show legal information.
 */
export class LegalComponent {
  /**
   * Constructor.
     */
  constructor(private http: HttpClient, private authService: AuthService, private router: Router, private translate: TranslateService, private messageViewer: MatSnackBar) {
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
}
