import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilsService {
  generateRandomCode(length: number, { digitsOnly = false } = {}): string {
    const characters = digitsOnly
      ? '0123456789'
      : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }

    console.log('Generated code:', result); // Log the generated code for debugging
    return result;
  }
}
