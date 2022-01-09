import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateService} from '@ngx-translate/core';
import {FormGroup} from '@angular/forms';
import {MatPaginator} from '@angular/material/paginator';
import {Router} from '@angular/router';
import {AuthService} from '../service/auth.service';

/**
 * Handle http errors (401, 403, 500, 422, 0).
 * @param error - Error message
 * @param authService - AuthorizationService to get user authorization
 * @param translate - TranslationService to translate messages
 * @param messageViewer - MessageViewer to display a snackBar to the user
 * @param router - Router to navigate to a specific page
 * @returns void
 */
export function handleErrors(error: any, authService: AuthService, translate: TranslateService, messageViewer: MatSnackBar, router: Router): void {
  // On 401 logout user (authentication failed).
  if (error.status === 401) {
    authService.logout();
    router.navigate(['/login']);
  }
  // On 403 redirect to page no-auth (wrong authorization).
  else if (error.status === 403) {
    router.navigate(['no-auth']);
  }
  // On 500 show error (internal error shown in console).
  else if (error.status === 500) {
    errorNotification(translate.instant('message.wrong'), translate, messageViewer);
  }
  // On 422 show error (unexpected value).
  else if (error.status === 422) {
    errorNotification(translate.instant('message.unexpected'), translate, messageViewer);
  }
  // On 0 show connection error (timed out).
  else if (error.status === 0) {
    errorNotification(translate.instant('message.connection'), translate, messageViewer);
  }
  // Else show generic error (unexpected error).
  else {
    errorNotification(translate.instant('message.unknown'), translate, messageViewer);
  }
}

/**
 * Filter protocol date according to the data entered in the filter.
 * @param protocolDate - Date in protocol
 * @param val - Filter value
 * @returns boolean - If true is returned, the date corresponds to the filtering.
 */
export function filterDate(protocolDate: any, val: any): boolean {
  // Convert string to Date object.
  const date = new Date(protocolDate);
  date.setHours(0, 0, 0, 0);
  const dateCompareFrom = new Date(val.dateFrom);
  dateCompareFrom.setHours(0, 0, 0, 0);
  const dateCompareTo = new Date(val.dateTo);
  dateCompareTo.setHours(0, 0, 0, 0);
  // Check if only dateFrom is not empty and perform filtering of the date.
  if (protocolDate !== '-' && isNaN(dateCompareTo.getTime()) && !isNaN(dateCompareFrom.getTime())) {
    if (date >= dateCompareFrom) {
      return true;
    }
  }
  // Check if only dateTo is not empty and perform filtering of the date.
  else if (protocolDate !== '-' && isNaN(dateCompareFrom.getTime()) && !isNaN(dateCompareTo.getTime())) {
    if (date <= dateCompareTo) {
      return true;
    }
  }
  // Check if dateFrom and dateTo are not empty and perform filtering of the date.
  else if (protocolDate !== '-' && !isNaN(dateCompareFrom.getTime()) && !isNaN(dateCompareTo.getTime())) {
    if (date <= dateCompareTo && date >= dateCompareFrom) {
      return true;
    }
  } else {
    return protocolDate !== '-';
  }
  return false;
}

/**
 * Translate table Paginator.
 * @param itemNameKey - Key for translation of name of elements in table
 * @param translate - TranslationService to translate messages
 * @param paginator - MatPaginator element
 * @returns void
 */
export function setPaginatorLanguage(itemNameKey: string, translate: TranslateService, paginator: MatPaginator): void {
  // Translate item
  translate.get(paginator._intl.itemsPerPageLabel).subscribe(() => {
    translate.onLangChange.subscribe(() => {
      paginator._intl.itemsPerPageLabel = translate.instant(itemNameKey);
    });
  });
  // Translate value
  paginator._intl.getRangeLabel = (page: number, pageSize: number, length: number): string => {
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return translate.instant('paginator.of', {startIndex: startIndex + 1, endIndex, length});
  };
}

/**
 * Reset form after submit.
 * @param form - Form to reset
 * @returns void
 */
export function resetForm(form: FormGroup): void {
  // Reset Form
  form.reset();
  form.markAsUntouched();
  // Clear errors
  Object.keys(form.controls).forEach((name) => {
    form.controls[name].setErrors(null);
  });
}

/**
 * Get header for http requests.
 * @return JSON - Return accessToken
 */
export function getHeader(): { authorization: string } {
  return {authorization: 'access: ' + localStorage.getItem('accessToken') as string};
}

/**
 * Displays a success message to the user using sackBar.
 * @param message - Message of notification
 * @param translate - TranslationService to translate messages
 * @param snackbar - MessageViewer to display a snackBar to the user
 * @returns void
 */
export function successNotification(message: string, translate: TranslateService, snackbar: MatSnackBar): void {
  snackbar.open(message, translate.instant('message.action'), {duration: 10000, verticalPosition: 'top', panelClass: 'green-snackbar'});
}

/**
 * Displays a error message to the user using sackBar.
 * @param message - Message of notification
 * @param translate - TranslationService to translate messages
 * @param snackbar - MessageViewer to display a snackBar to the user
 * @returns void
 */
export function errorNotification(message: string, translate: TranslateService, snackbar: MatSnackBar): void {
  snackbar.open(message, translate.instant('message.action'), {duration: 10000, verticalPosition: 'top', panelClass: 'red-snackbar'});
}

/**
 * Displays a information message to the user using sackBar.
 * @param message - Message of notification
 * @param translate - TranslationService to translate messages
 * @param snackbar - MessageViewer to display a snackBar to the user
 * @returns void
 */
export function infoNotification(message: string, translate: TranslateService, snackbar: MatSnackBar): void {
  snackbar.open(message, translate.instant('message.action'), {duration: 10000, verticalPosition: 'top', panelClass: 'blue-snackbar'});
}



