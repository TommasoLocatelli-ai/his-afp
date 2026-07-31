import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { formatDate } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { Fieldset } from 'primeng/fieldset';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { GestioneRisorse } from '../../../../core/Risorse/gestione-risorse';
import {
  PatientAdmission,
  PazienteAnagrafica,
} from '../../../../core/Pazienti/Pazienti.model';
import { PatientManager } from '../../../../core/Pazienti/patient-manager';

interface LengthValidatorError {
  requiredLength: number;
}

@Component({
  selector: 'his-form-accettazione-pz',
  imports: [
    Button,
    DatePicker,
    Fieldset,
    InputText,
    Message,
    ReactiveFormsModule,
    Select,
    Textarea,
  ],
  templateUrl: './form-accettazione-pz.html',
  styleUrl: './form-accettazione-pz.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormAccettazionePz {
  selectedPatient = input<PazienteAnagrafica | null>(null);

  readonly gestioneRisorse = inject(GestioneRisorse);
  readonly patientManager = inject(PatientManager);
  readonly maxDate = new Date();
  readonly sexOption = [
    {
      code: 'M',
      desc: 'Maschio',
    },
    {
      code: 'F',
      desc: 'Femmina',
    },
  ];

  readonly #fb = inject(FormBuilder);
  readonly paziente = this.#fb.group({
    anagrafica: this.#fb.group({
      nome: ['', [Validators.required]],
      cognome: ['', [Validators.required]],
      dataNascita: [null as Date | null, [Validators.required]],
      codiceFiscale: [
        '',
        [Validators.required, Validators.pattern('[A-Z]{6}\\d{2}[A-Z]\\d{2}[A-Z]\\d{3}[A-Z]')],
      ],
      sesso: ['', [Validators.required]],
    }),
    sanitaria: this.#fb.group({
      patologia: ['', [Validators.required]],
      codiceColore: ['', [Validators.required]],
      modArrivo: ['', [Validators.required]],
      noteTriage: ['', [Validators.required, Validators.maxLength(500)]],
    }),
  });

  constructor() {
    this.ensureResourceOptionsLoaded();

    effect(() => {
      const patient = this.selectedPatient();

      untracked(() => {
        if (patient === null) {
          this.paziente.reset();
          return;
        }

        this.paziente.patchValue({
          anagrafica: {
            nome: patient.nome,
            cognome: patient.cognome,
            dataNascita: new Date(patient.dataNascita),
            codiceFiscale: patient.codiceFiscale,
            sesso: patient.sesso,
          },
        });
      });
    });
  }

  private ensureResourceOptionsLoaded(): void {
    if (
      this.gestioneRisorse.pathologies().length === 0 ||
      this.gestioneRisorse.arrivalModes().length === 0 ||
      this.gestioneRisorse.triageColors().length === 0
    ) {
      this.gestioneRisorse.fetchRisorse();
    }
  }

  checkFormControl(control: string): boolean {
    const fc = this.paziente.get(control);
    return !!fc?.invalid && (fc.touched || fc.dirty);
  }

  checkFormControlError(control: string, err: string): unknown | null {
    const fc = this.paziente.get(control);

    if (fc && fc.hasError(err)) {
      return fc.getError(err);
    }

    return null;
  }

  getRequiredLength(control: string): number | null {
    const error = this.checkFormControlError(control, 'minlength');

    if (this.hasRequiredLength(error)) {
      return error.requiredLength;
    }

    return null;
  }

  getMaxLength(control: string): number | null {
    const error = this.checkFormControlError(control, 'maxlength');

    if (this.hasRequiredLength(error)) {
      return error.requiredLength;
    }

    return null;
  }

  onSubmit(): void {
    if (this.paziente.invalid) {
      this.paziente.markAllAsTouched();
      return;
    }

    const payload = this.buildAdmissionPayload();
    if (payload === null) {
      this.paziente.markAllAsTouched();
      return;
    }

    this.patientManager.admitPatient(payload);
  }

  private buildAdmissionPayload(): PatientAdmission | null {
    const raw = this.paziente.getRawValue();

    const dataNascita = raw.anagrafica.dataNascita;
    const nome = raw.anagrafica.nome;
    const cognome = raw.anagrafica.cognome;
    const codiceFiscale = raw.anagrafica.codiceFiscale;
    const sesso = raw.anagrafica.sesso;

    const patologia = raw.sanitaria.patologia;
    const codiceColore = raw.sanitaria.codiceColore;
    const modArrivo = raw.sanitaria.modArrivo;
    const noteTriage = raw.sanitaria.noteTriage;

    if (
      dataNascita === null ||
      nome === null ||
      cognome === null ||
      codiceFiscale === null ||
      sesso === null ||
      patologia === null ||
      codiceColore === null ||
      modArrivo === null ||
      noteTriage === null
    ) {
      return null;
    }

    return {
      anagrafica: {
        nome,
        cognome,
        dataNascita: formatDate(dataNascita, 'yyyy-MM-dd', 'en-US'),
        codiceFiscale: codiceFiscale.toUpperCase(),
        sesso,
      },
      sanitaria: {
        patologia,
        codiceColore,
        modArrivo,
        noteTriage,
      },
    };
  }

  private hasRequiredLength(error: unknown): error is LengthValidatorError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'requiredLength' in error &&
      typeof error.requiredLength === 'number'
    );
  }
}
