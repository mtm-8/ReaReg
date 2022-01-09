import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {FormBuilder, FormControl, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {DialogComponent} from '../dialog/dialog.component';
import {ErrorStateMatcher} from '@angular/material/core';
import {CustomErrorStateMatcher} from '../../interface/custom-error-state-matcher';

/**
 * DialogData interface that contains information that was provided by the calling component.
 */
export interface DialogData {
  title: string;
  content: string;
}

@Component({
  selector: 'app-dialog-protocol-id',
  templateUrl: './dialog-pat-id.component.html',
  styleUrls: ['./dialog-pat-id.component.scss'],
  providers: [{provide: ErrorStateMatcher, useClass: CustomErrorStateMatcher}]
})

/**
 * Dialog patid component. Dialog to create a new protocol.
 */
export class DialogPatIdComponent {
  // Declare variable
  patidForm: any;

  /**
   * Constructor.
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData, public dialog: MatDialogRef<DialogPatIdComponent>, public fb: FormBuilder, public router: Router, public infoDialog: MatDialog) {
    // Create FormGroup form with FormControl patid and validators.
    this.patidForm = this.fb.group({
      patid: ['', [Validators.required, Validators.pattern('^[0-9]{1,10}$')]],
    });
  }

  /** Get FormControl of field patid.
   * @return FormControl - Return
   */
  getPatId(): FormControl {
    return this.patidForm.get('patid');
  }

  /** Navigate to overview page.
   * @returns void
   */
  back(): void {
    this.router.navigate(['/overview']);
  }

  /** Open context help dialog with help text.
   * @param title - Help text title
   * @param content - Help text content
   * @returns void
   */
  openInfoDialog(title: string, content: string): void {
    this.infoDialog.open(DialogComponent, {data: {title, content}, width: '300px'});
  }

  /**
   * Deletes impossible values according to a pattern.
   * @returns void
   */
  preventRegex($event: any, regex: string): void {
    const pattern = new RegExp(regex);
    if (!pattern.test($event.key)) {
      $event.preventDefault();
    }
  }
}
