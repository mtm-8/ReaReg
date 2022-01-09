import {Component} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-authorization',
  templateUrl: './authorization.component.html',
  styleUrls: ['./authorization.component.scss']
})

/**
 * Authorization page component. Shows authorization error.
 */
export class AuthorizationComponent {
  // Declare variable.
  countdown = 100;

  /**
   * Constructor.
   */
  constructor(public router: Router) {
    // After every second, a check is made to see whether the countdown is still running. If it has expired, the user is redirected.
    const downloadTimer = setInterval(() => {
      if (this.countdown <= 0) {
        clearInterval(downloadTimer);
        this.previous();
      }
      this.countdown--;
    }, 100);
  }

  /** Goes back two pages in the browsers session history.
   * @returns void
   */
  previous(): void {
    window.history.go(-2);
  }
}
