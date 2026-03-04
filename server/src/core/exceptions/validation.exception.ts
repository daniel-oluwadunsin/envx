import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

function _transform(errors: ValidationError[]) {
  return errors
    .map((error) =>
      error?.constraints ? Object.values(error.constraints) : [],
    )
    .flat()[0];
}

export class ValidationException extends BadRequestException {
  constructor(errors: ValidationError[]) {
    super({
      error: 'Validation Error',
      message: _transform(errors),
    });
  }
}
