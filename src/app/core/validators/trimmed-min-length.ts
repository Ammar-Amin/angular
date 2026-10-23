import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Like Validators.minLength, but ignores leading/trailing spaces so "   " is not a valid title. */
export function trimmedMinLength(min: number): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const actual = (control.value ?? '').trim().length;
    return actual < min ? { minlength: { requiredLength: min, actualLength: actual } } : null;
  };
}
