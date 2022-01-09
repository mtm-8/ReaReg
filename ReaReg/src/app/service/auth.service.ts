import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {MiddlewareURL} from '../variables/variables';
import {JwtHelperService} from '@auth0/angular-jwt';
import {MatDialog} from '@angular/material/dialog';
import {NgxMaterialTimepickerComponent} from "ngx-material-timepicker";

@Injectable({
  providedIn: 'root'
})

/**
 * Authentication handler class.
 */
export class AuthService {
  constructor(private timePicker: NgxMaterialTimepickerComponent,private http: HttpClient, private router: Router, public jwtHelper: JwtHelperService, private dialog: MatDialog) {
  }

  /**
   * Save accessToken in localStorage.
   * @param token - accessToken
   * @returns void
   */
  public setAccessToken(token: any): void {
    localStorage.setItem('accessToken', JSON.stringify(token.accessToken).replace(/"/g, ''));
  }

  /**
   * On login check username and password.
   * @param username - Name of user
   * @param password - Password of user
   * @returns Promise - Promise of http post request
   */
  public validate(username: string, password: string): Promise<any> {
    return this.http.post(MiddlewareURL + '/login', {username, password}).toPromise();
  }

  /**
   * Check if accessToken of user is valid.
   * @returns boolean - If token is not expired return true.
   */
  public isAuthenticated(): boolean {
    return !this.jwtHelper.isTokenExpired(localStorage.getItem('accessToken') as string);
  }

  /**
   * Check if authorization level is bigger or equals 2.
   * @returns boolean - If the user authentication level is equals or greater than 2, true is returned, otherwise false
   */
  public isAuthorizedLvl2(): boolean {
    return this.jwtHelper.decodeToken(this.jwtHelper.tokenGetter()).authorization >= 2;
  }

  /**
   * Check if authorization level is equals 3.
   * @returns boolean - If the user authentication level is equal to 3, true is returned, otherwise false
   */
  public isAuthorizedLvl3(): boolean {
    return this.jwtHelper.decodeToken(this.jwtHelper.tokenGetter()).authorization === 3;
  }

  /**
   * Get user authentication level from token.
   * @returns number - Returns user Authorisation level (1-3)
   */
  public getUserAuthorization(): number {
    return this.jwtHelper.decodeToken(this.jwtHelper.tokenGetter()).authorization;
  }

  /**
   * Get user id from token.
   * @returns number - Returns user identification number
   */
  public getUserId(): number {
    return this.jwtHelper.decodeToken(this.jwtHelper.tokenGetter()).id;
  }

  /**
   * Logout user.
   * @returns void
   */
  public logout(): void {
    // Redirect to login page
    this.router.navigate(['/login', {status: 1}]);
    // Remove accessToken from localStorage
    localStorage.removeItem('accessToken');
    // Close all open dialogs
    this.dialog.closeAll();
    this.timePicker.close();

  }
}
