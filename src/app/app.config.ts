import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { authInterceptor } from './core/auth/auth.interceptor';
import { mockInterceptor } from './core/mock/mock.interceptor';
import { USE_MOCK } from './core/api.config';

// Datas e valores no padrão brasileiro (R$ 1.440,00)
registerLocaleData(localePt);

// O mock fica depois do authInterceptor para receber o token e o tratamento de 401 igual à API real
const interceptors = USE_MOCK ? [authInterceptor, mockInterceptor] : [authInterceptor];

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideClientHydration(withEventReplay()), provideHttpClient(withFetch(), withInterceptors(interceptors)), { provide: LOCALE_ID, useValue: 'pt-BR' }]
};
