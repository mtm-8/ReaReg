import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from '../../service/auth.service';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.scss']
})

/**
 * Page not found page component. Display error page not found.
 */
export class PageNotFoundComponent {
  // Countdown variable
  countdown = 100;

  /**
   * Constructor.
   */
  constructor(public router: Router, public authService: AuthService) {
    // After every second, a check is made to see whether the countdown is still running. if it has expired, the user is redirected.
    const downloadTimer = setInterval(() => {
      if (this.countdown <= 0) {
        clearInterval(downloadTimer);
        if (this.authService.isAuthenticated()) {
          this.overview();
        } else {
          this.login();
        }
      }
      this.countdown--;
    }, 100);
  }

  /** Redirect to overview page.
   * @returns void
   */
  overview(): void {
    this.router.navigate(['/overview']);
  }

  /** Redirect to login page.
   * @returns void
   */
  login(): void {
    this.router.navigate(['/login']);
  }
}
