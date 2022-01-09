import {Component, EventEmitter, Output} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {DateAdapter} from '@angular/material/core';
import {FormBuilder} from '@angular/forms';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
})

/**
 * Filter component.
 */
export class FilterComponent {
  // Declare variables.
  dateVal = false;
  filterForm: any;

  // Prepare variables: search, dateName, dateTo, dateFrom, ch1 and ch2.
  @Output() searchEvent = new EventEmitter<{ search: string, dateName: string, dateTo: string, dateFrom: string, ch1: boolean, ch2: boolean }>();

  /**
   * Constructor.
   */
  constructor(public translate: TranslateService, private dateAdapter: DateAdapter<Date>, private fb: FormBuilder) {
    this.dateAdapter.setLocale(localStorage.getItem('language'));
    this.filterForm = this.fb.group({
      dateName: [''],
      dateFrom: [''],
      dateTo: [''],
      search: [''],
      ch1: [''],
      ch2: ['']
    });
  }

  /**
   * Reset form and submit filter settings.
   * @returns void
   */
  reset(): void {
    // Reset form.
    this.filterForm.controls.dateName.setValue("");
    this.filterForm.controls.dateFrom.setValue("");
    this.filterForm.controls.dateTo.setValue("");
    this.filterForm.controls.search.setValue("");
    this.filterForm.controls.ch1.setValue("");
    this.filterForm.controls.ch2.setValue("");
    // Submit filter settings.
    this.submit();
  }

  /**
   * Submit filter settings.
   * @returns void
   */
  submit(): void {
    // Check if form input of date is valid.
    if (this.filterForm.controls.dateFrom.value > this.filterForm.controls.dateTo.value && !!this.filterForm.controls.dateTo.value && !!this.filterForm.controls.dateFrom.value) {
      this.dateVal = true;
    } else {
      this.dateVal = false;
      // Emit data to overview page.
      this.searchEvent.emit({
        search: this.filterForm.controls.search.value,
        dateName: this.filterForm.controls.dateName.value ,
        dateTo: this.filterForm.controls.dateTo.value,
        dateFrom: this.filterForm.controls.dateFrom.value,
        ch1: this.filterForm.controls.ch1.value,
        ch2: this.filterForm.controls.ch2.value
      });
    }
  }
}
