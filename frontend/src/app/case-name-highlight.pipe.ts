import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'caseNameHighlight',
  standalone: true,
})
export class CaseNameHighlightPipe implements PipeTransform {
  transform(value: string, maxWords: number): string {
    if (!value) return value;

    const words = value.split(' ');
    let result = '';
    let wordCount = 0;

    for (let i = 0; i < words.length; i++) {
      result += words[i] + ' ';
      wordCount++;

      // Insert a line break after every `maxWords` words, but not at the end
      if (wordCount === maxWords && i < words.length - 1) {
        result += '<br>';
        wordCount = 0;
      }
    }

    return result.trim();
  }
}