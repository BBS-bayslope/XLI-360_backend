import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'caseNameHighlight',
  standalone: true,
})
export class CaseNameHighlightPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  private addLineBreaks(text: string, maxWords: number): string {
    const words = text.split(' ');
    let result = '';
    let wordCount = 0;

    for (let i = 0; i < words.length; i++) {
      result += words[i] + ' ';
      wordCount++;
      if (wordCount === maxWords && i < words.length - 1) {
        result += '<br>';
        wordCount = 0;
      }
    }
    return result.trim();
  }

  transform(value: string, maxWords: number): SafeHtml {
    console.log('Pipe Input:', value);
    if (!value) return value;

    const parts = value.split(/\s*V\.\s*/);
    console.log('Split Parts:', parts);
    if (parts.length !== 2) {
      const formattedText = this.addLineBreaks(value, maxWords);
      return this.sanitizer.bypassSecurityTrustHtml(formattedText);
    }

    const plaintiff = parts[0];
    const defendant = parts[1];

    const formattedPlaintiff = this.addLineBreaks(plaintiff, maxWords);
    const formattedDefendant = this.addLineBreaks(defendant, maxWords);
    console.log('Formatted Plaintiff:', formattedPlaintiff);
    console.log('Formatted Defendant:', formattedDefendant);

    const highlightedText = `<span class="plaintiff">${formattedPlaintiff}</span> V. <span class="defendant">${formattedDefendant}</span>`;
    console.log('Highlighted Text:', highlightedText);
    return this.sanitizer.bypassSecurityTrustHtml(highlightedText);
  }
}
