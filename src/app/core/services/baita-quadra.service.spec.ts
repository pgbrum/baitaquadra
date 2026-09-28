import { TestBed } from '@angular/core/testing';

import { BaitaQuadraService } from './baita-quadra.service';

describe('BaitaQuadraService', () => {
  let service: BaitaQuadraService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BaitaQuadraService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
