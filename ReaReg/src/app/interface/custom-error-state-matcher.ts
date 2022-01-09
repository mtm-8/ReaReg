import {FormControl, FormGroupDirective, NgForm} from '@angular/forms';
import {ErrorStateMatcher} from '@angular/material/core';
/**
 * Custom error state matcher component.
 */
export class CustomErrorStateMatcher implements ErrorStateMatcher {
  /**
   * Show Errors only when invalid FormControl is dirty, touched, or submitted
   * @author Angular Material UI - https://material.angular.io/components/input/overview
   * @param control - FormControl to handle error
   * @param form - FormGroup to handle error
   * @returns boolean - Return true if FormControl exists, FormControl is invalid and dirty or touched or the FormGroup is submitted
   */
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return (control && control.invalid && (control.dirty || control.touched || isSubmitted)) as boolean;
  }
}
