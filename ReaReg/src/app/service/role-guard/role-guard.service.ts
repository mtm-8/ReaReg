import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router} from '@angular/router';
import {AuthService} from '../auth.service';

@Injectable({
  providedIn: 'root'
})
/**
 * The class checks whether the user has the correct authorisation level to view the page.
 * Function: canActivate | Expected data: role
 */
export class RoleGuardService implements CanActivate {
  constructor(public auth: AuthService, public router: Router) {
  }

  /**
   * Check whether the user is authenticated and the authorisation level of the user is greater than or equal to the expected authorisation level.
   * @param authenticationLevel - Expected authentication level for the page
   * @returns boolean - True is returned if the user is logged in and the authorization level is correct, otherwise false is returned.
   */
  canActivate(authenticationLevel: ActivatedRouteSnapshot): boolean {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['login']);
      return false;
    } else if (authenticationLevel.data.role > this.auth.getUserAuthorization()) {
      this.router.navigate(['no-auth']);
      return false;
    }
    return true;
  }
}
