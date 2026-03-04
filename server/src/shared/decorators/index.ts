import { applyDecorators } from '@nestjs/common';
import {
  IsString as _IsString,
  IsNumber as _IsNumber,
  IsEmail as _IsEmail,
  IsBoolean as _IsBoolean,
  IsEnum as _IsEnum,
  IsUrl as _IsUrl,
  IsDate as _IsDate,
  IsBase64 as _IsBase64,
  IsOptional,
  IsDateString,
  IsNumberString,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { EnumAllowedTypes } from '@nestjs/swagger/dist/interfaces/schema-object-metadata.interface';

export const IsString = (isOptional: boolean, options?: ValidationOptions) => {
  const decorators = [_IsString(options)];

  if (isOptional) {
    decorators.push(ApiPropertyOptional());
    decorators.push(IsOptional());
  } else {
    decorators.push(ApiProperty());
  }

  return applyDecorators(...decorators);
};

export const IsNumber = (isOptional: boolean) => {
  const decorators = [_IsNumber(), Transform((v) => Number(v.value))];

  if (isOptional) {
    decorators.push(ApiPropertyOptional({ example: 0 }));
    decorators.push(IsOptional());
  } else {
    decorators.push(ApiProperty({ example: 0 }));
  }

  return applyDecorators(...decorators);
};

export const IsEmail = (isOptional: boolean) => {
  const decorators = [_IsEmail()];

  if (isOptional) {
    decorators.push(ApiPropertyOptional({ example: 'example@gmail.com' }));
    decorators.push(IsOptional());
  } else {
    decorators.push(ApiProperty({ example: 'example@gmail.com' }));
  }

  return applyDecorators(...decorators);
};

export const IsBoolean = (isOptional: boolean) => {
  const decorators = [
    _IsBoolean(),
    Transform((v) =>
      v.value === 'true' ? true : v.value === 'false' ? false : v.value,
    ),
  ];

  if (isOptional) {
    decorators.push(ApiPropertyOptional());
    decorators.push(IsOptional());
  } else {
    decorators.push(ApiProperty());
  }

  return applyDecorators(...decorators);
};

export const IsEnum = <T extends EnumAllowedTypes>(
  _enum: T,
  isOptional: boolean,
) => {
  const decorators = [_IsEnum(_enum as object)];

  if (isOptional) {
    decorators.push(ApiPropertyOptional({ enum: _enum }));
    decorators.push(IsOptional());
  } else {
    decorators.push(ApiProperty({ enum: _enum }));
  }

  return applyDecorators(...decorators);
};

export const IsDate = (isOptional: boolean) => {
  const decorators = [
    _IsDate(),
    Transform(({ value }) => (value ? new Date(value) : value)),
  ];

  if (isOptional) {
    decorators.push(ApiPropertyOptional());
    decorators.push(IsOptional());
  } else {
    decorators.push(ApiProperty());
  }

  return applyDecorators(...decorators);
};

export const IsUrl = (isOptional: boolean) => {
  const decorators = [_IsUrl()];

  if (isOptional) {
    decorators.push(ApiPropertyOptional());
    decorators.push(IsOptional());
  } else {
    decorators.push(ApiProperty());
  }

  return applyDecorators(...decorators);
};

export const IsBase64 = (isOptional: boolean) => {
  const decorators = [_IsString()];

  if (isOptional) {
    decorators.push(ApiPropertyOptional({ example: 'base64' }));
    decorators.push(IsOptional());
  } else {
    decorators.push(ApiProperty({ example: 'base64' }));
  }

  return applyDecorators(...decorators);
};

@ValidatorConstraint({ async: false })
export class IsBase64MediaConstraint implements ValidatorConstraintInterface {
  private readonly regex =
    /^data:(image\/(png|jpeg|jpg|gif|webp|svg\+xml)|video\/(mp4|webm|ogg|quicktime));base64,[A-Za-z0-9+/=\s]+$/;

  validate(base64: string): boolean {
    return typeof base64 === 'string' && this.regex.test(base64);
  }

  defaultMessage(): string {
    return 'Each media file must be a valid base64-encoded image or video string (with MIME type)';
  }
}

export function IsBase64MediaArray(validationOptions?: ValidationOptions) {
  const validatorInstance = new IsBase64MediaConstraint();

  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isBase64MediaArray',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(mediaArray: string[]): boolean {
          if (!Array.isArray(mediaArray)) return false;
          return mediaArray.every((media) => validatorInstance.validate(media));
        },
        defaultMessage(): string {
          return 'All items must be valid base64-encoded image or video strings';
        },
      },
    });
  };
}
