import {Component} from '@angular/core';
import {AuthService} from '../../service/auth.service';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})

/**
 * Menu component.
 */
export class MenuComponent {
  constructor(public translate: TranslateService, public authService: AuthService) {
  }

  /**
   * Call logout function of authService.
   * @returns void
   */
  logout(): void {
    this.authService.logout();
  }
}
