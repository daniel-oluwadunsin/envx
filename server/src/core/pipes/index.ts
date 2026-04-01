import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { isMongoId } from 'class-validator';
import DEFAULT_MATCHERS from 'src/shared/constants/regex.const';

export class Base64Pipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const isValid = DEFAULT_MATCHERS.base64.test(value);

    if (!isValid) {
      throw new BadRequestException('parse a valid base64 string');
    }

    return value;
  }
}

export class IntPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('parse a valid integer');
    }
    return val;
  }
}

export class MongoIdPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const val = value.toString();

    if (!isMongoId(val)) {
      throw new BadRequestException('parse a valid MongoDB ObjectId');
    }

    return val;
  }
}
