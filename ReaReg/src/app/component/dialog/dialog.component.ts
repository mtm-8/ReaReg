import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

/**
 * DialogData interface that contains information that was provided by the calling component.
 */
export interface DialogData {
  title: string;
  content: string;
}

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})

/**
 * Dialog component. Displays a dialog.
 */
export class DialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
  }
}
