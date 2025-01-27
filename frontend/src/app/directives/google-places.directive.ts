import {
  Directive,
  ElementRef,
  EventEmitter,
  NgZone,
  OnInit,
  Output,
} from '@angular/core';

@Directive({
  selector: '[appGooglePlaces]',
  standalone: true,
})
export class GooglePlacesDirective implements OnInit {
  @Output() addressChange: EventEmitter<any> = new EventEmitter();

  private element: HTMLInputElement;

  constructor(private elRef: ElementRef, private ngZone: NgZone) {
    this.element = this.elRef.nativeElement;
  }

  ngOnInit() {
    const autocomplete = new google.maps.places.Autocomplete(this.element);
    autocomplete.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place: google.maps.places.PlaceResult = autocomplete.getPlace();
        if (place.geometry) {
          const address = {
            address_components: place.address_components,
            formatted_address: place.formatted_address,
            geometry: {
              location: {
                lat: place.geometry?.location?.lat(),
                lng: place.geometry?.location?.lng(),
              },
              viewport: place.geometry.viewport,
            },
            icon: place.icon,

            name: place.name,
            place_id: place.place_id,
            plus_code: place.plus_code,
            types: place.types,
            url: place.url,
            utc_offset_minutes: place.utc_offset_minutes,
            vicinity: place.vicinity,
            website: place.website,
          };
          console.log('Address selected:', address); // Logging the address object
          this.addressChange.emit(address);
        }
      });
    });
  }
}
