import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safe',
  standalone: true, // keep if you're using standalone components
})
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: unknown): SafeResourceUrl | null {
    if (typeof value === 'string') {
      return this.sanitizer.bypassSecurityTrustResourceUrl(value);
    }
    return null;
  }
}
