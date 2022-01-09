import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

/**
 * DialogData interface that contains information that was provided by the calling component.
 */
export interface DialogData {
  title: string;
}

@Component({
  selector: 'app-dialog-confirm',
  templateUrl: './dialog-confirm.component.html',
  styleUrls: ['./dialog-confirm.component.scss']
})
/**
 * Dialog confirm component. Confirms an action.
 */
export class DialogConfirmComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
  }
}
