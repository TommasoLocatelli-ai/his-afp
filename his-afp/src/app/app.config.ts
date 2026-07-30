import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { PatientManager } from './core/Pazienti/patient-manager';
import { GestioneRisorse } from './core/Risorse/gestione-risorse';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes, withComponentInputBinding()),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          ripple: true,
          darkModeSelector: '.my-app-dark',
        },
      },
    }),
    provideAppInitializer(() => inject(PatientManager).fetchPazienti()),
    provideAppInitializer(() => inject(GestioneRisorse).fetchRisorse()),
  ],
};
