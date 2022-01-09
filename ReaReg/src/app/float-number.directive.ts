import {Directive, HostListener, Input} from '@angular/core';
import {NgControl} from '@angular/forms';

@Directive({
  selector: '[rearegFloatNumber]'
})

/**
 * Check input of input field.
 */
export class FloatNumberDirective {
  // Element step of input field as input.
  @Input() public step: any;

  constructor(private field: NgControl) {
  }

  /**
   * Check value of field with Regular Expressions.
   * @param event - Event
   * @returns void
   */
  @HostListener('keyup', ['$event']) onKeyUp(event: any) {
    // Get content of element step input field.
    let stepLength = this.step.split('.');
    // Get length of steps after the dot.
    stepLength = stepLength[1].length;
    // Create Regular Expression.
    const pattern = new RegExp('^[-]{0,1}[0-9]*[.]{0,1}[0-9]{1,' + stepLength + '}$');
    if (event.target.value) {
      if (!pattern.test(event.target.value)) {
        // Split value of input field.
        let length = event.target.value.split('.');
        // Set length.
        length = length[1].length - stepLength;
        // Prevent the entry of too many decimal digits.
        // @ts-ignore
        this.field.control.setValue(event.target.value.slice(0, -Math.abs(length)));
      }
    }
  }
}
