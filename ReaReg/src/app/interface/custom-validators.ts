import {AbstractControl, ValidatorFn} from '@angular/forms';

/**
 * Custom Validators component. Contains all custom validators that can be outsourced.
 */
export class CustomValidators {
  /**
   * Validator to check if password and confirmPassword are equal
   * @returns JSON | null - Returns an error map or null
   */
  static passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    return (control.get('password')?.value !== control.get('confirmPassword')?.value) ? {passwordMatchValidator: true} : null;
  }

  /**
   * Validator to check if user already exists
   * @param users - JSON with all existing username values
   * @param username - Name of the user who is currently being edited
   * @returns JSON | null - Returns an error map or null
   */
  static userAlreadyExistsValidator(users: JSON, username: string = ''): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      for (const user of Object.values(users)) {
        if (user.userName === control.value && control.value !== username) {
          return {userAlreadyExists: true};
        }
      }
      return null;
    };
  }

  /**
   * Validator check if evprotnr already exists
   * @param protocols - JSON with all existing evprotnrs and the record_id
   * @param protid - Id of protocol
   * @returns JSON | null - Returns the error or nothing
   */
  static evprotnrAlreadyExistsValidator(protocols: JSON, protid: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      if (protocols) {
        for (const protocol of Object.values(protocols)) {
          if (protid !== protocol.record_id && ([protocol.protnr_01, protocol.protnr_02, protocol.protnr_03, protocol.protnr_04, protocol.protnr_05].includes(control.value)) && control.value !== '') {
            return {evprotnrAlreadyExists: true};
          }
        }
      }
      return null;
    };
  }
}
