import { DatePipe, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { Fieldset } from 'primeng/fieldset';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { PatientManager } from '../../../../core/Pazienti/patient-manager';
import {
  PazienteAnagrafica,
  RicercaPerAnagrafica,
} from '../../../../core/Pazienti/Pazienti.model';

type SearchMode = 'cf' | 'anagrafica';

@Component({
  selector: 'his-ricerca-paziente',
  imports: [Button, DatePipe, DatePicker, Fieldset, InputText, Message, ReactiveFormsModule],
  templateUrl: './ricerca-paziente.html',
  styleUrl: './ricerca-paziente.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RicercaPaziente {
  readonly patientSelected = output<PazienteAnagrafica>();
  readonly noPatientFound = output<void>();
  readonly newPatientRequested = output<void>();

  readonly maxDate = new Date();
  readonly mode = signal<SearchMode>('cf');
  readonly isLoading = signal(false);
  readonly searchPerformed = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly searchResults = signal<PazienteAnagrafica[]>([]);

  readonly #patientManager = inject(PatientManager);
  readonly #fb = inject(FormBuilder);

  readonly searchByCfForm = this.#fb.group({
    codiceFiscale: [
      '',
      [Validators.required, Validators.pattern('[A-Z]{6}\\d{2}[A-Z]\\d{2}[A-Z]\\d{3}[A-Z]')],
    ],
  });

  readonly searchByIdentityForm = this.#fb.group({
    nome: ['', [Validators.required]],
    cognome: ['', [Validators.required]],
    dataNascita: [null as Date | null, [Validators.required]],
  });

  setMode(mode: SearchMode): void {
    this.mode.set(mode);
    this.searchResults.set([]);
    this.searchPerformed.set(false);
    this.errorMessage.set(null);
  }

  startSearch(): void {
    if (this.mode() === 'cf') {
      this.searchWithCodiceFiscale();
      return;
    }

    this.searchWithAnagrafica();
  }

  selectPatient(patient: PazienteAnagrafica): void {
    this.patientSelected.emit(patient);
  }

  requestNewPatient(): void {
    this.newPatientRequested.emit();
    this.searchResults.set([]);
    this.searchPerformed.set(false);
    this.errorMessage.set(null);
  }

  private searchWithCodiceFiscale(): void {
    if (this.searchByCfForm.invalid) {
      this.searchByCfForm.markAllAsTouched();
      return;
    }

    const codiceFiscale = this.searchByCfForm.controls.codiceFiscale.value;
    if (codiceFiscale === null) {
      this.searchByCfForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.#patientManager
      .searchByCodiceFiscale(codiceFiscale)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (patients) => {
          this.updateSearchState(patients);
        },
        error: () => {
          this.errorMessage.set('Errore durante la ricerca per codice fiscale.');
          this.searchPerformed.set(true);
          this.searchResults.set([]);
        },
      });
  }

  private searchWithAnagrafica(): void {
    if (this.searchByIdentityForm.invalid) {
      this.searchByIdentityForm.markAllAsTouched();
      return;
    }

    const nome = this.searchByIdentityForm.controls.nome.value;
    const cognome = this.searchByIdentityForm.controls.cognome.value;
    const dataNascitaValue = this.searchByIdentityForm.controls.dataNascita.value;

    if (nome === null || cognome === null || dataNascitaValue === null) {
      this.searchByIdentityForm.markAllAsTouched();
      return;
    }

    const params: RicercaPerAnagrafica = {
      nome,
      cognome,
      dataNascita: formatDate(dataNascitaValue, 'yyyy-MM-dd', 'en-US'),
    };

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.#patientManager
      .searchByAnagrafica(params)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (patients) => {
          this.updateSearchState(patients);
        },
        error: () => {
          this.errorMessage.set('Errore durante la ricerca per nome/cognome/data di nascita.');
          this.searchPerformed.set(true);
          this.searchResults.set([]);
        },
      });
  }

  private updateSearchState(patients: PazienteAnagrafica[]): void {
    this.searchPerformed.set(true);
    this.searchResults.set(patients);

    if (patients.length === 0) {
      this.noPatientFound.emit();
    }
  }
}
