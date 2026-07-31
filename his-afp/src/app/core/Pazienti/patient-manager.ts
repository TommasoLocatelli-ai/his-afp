import { inject, Injectable, signal } from '@angular/core';
import {
  PatientAdmission,
  PatientAdmissionRes,
  Paziente,
  PazienteAnagrafica,
  PazienteDTO,
  PazienteSearchDTO,
  RicercaPerAnagrafica,
} from './Pazienti.model';
import { HttpClient } from '@angular/common/http';
import { APIResponse } from '../models/APIResponse.model';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PatientManager {
  timer_id = signal<number>(-1);
  #http = inject(HttpClient);
  readonly #router = inject(Router);
  #listaPZ = signal<Paziente[]>([]);
  #listaPZFiltered = signal<Paziente[]>(this.#listaPZ());
  listaPZ = this.#listaPZFiltered.asReadonly();

  // constructor() {
  //   this.fetchPazienti();
  // }

  /**
   * Creazione timer di t secondi
   */
  public refreshPazienti() {
    if (this.timer_id() >= 0) return;
    let id = setInterval(() => this.fetchPazienti(), 1000);
    this.timer_id.set(id);
  }

  public stopRefreshPazienti() {
    clearInterval(this.timer_id());
    this.timer_id.set(-1);
  }

  public fetchPazienti() {
    this.#http.get<APIResponse<PazienteDTO[]>>(`/api/admissions`).subscribe({
      next: (res) => {
        const pz = res.data.map((p) => this.mapPazienteDTOToPaziente(p));
        this.#listaPZ.set(pz);
      },
      error: (err) => {
        console.error('Errore durante il fetch dei pazienti:', err);
      },
    });
  }

  public admitPatient(pz: PatientAdmission) {
    this.#http
      .post<APIResponse<PatientAdmissionRes>>(`${environment.apiUrl}/admissions`, pz)
      .subscribe({
        next: (res) => {
          this.#router.navigate([`/modifica-pz/${res.data.id}`]);
        },
        error: (err) => {
          console.error("Errore durante l'ammissione del paziente:", err);
        },
      });
  }

  public updatePatientInfo(pzId: number, residenza: Pick<PatientAdmission, 'residenza'>) {
    this.#http
      .patch<APIResponse<PatientAdmissionRes>>(`${environment.apiUrl}/patients/${pzId}`, residenza)
      .subscribe({
        next: (res) => {
          this.#router.navigate([`/lista-pz`]);
        },
        error: (err) => {
          console.error("Errore durante l'aggiornamento delle informazioni del paziente:", err);
        },
      });
  }

  public mapPazienteDTOToPaziente(pz: PazienteDTO): Paziente {
    return {
      id: pz.id.toString(),
      nome: pz.nome,
      cognome: pz.cognome,
      braccialetto: pz.braccialetto,
      codiceColore: pz.coloreCode,
      note: pz.noteTriage,
      patologia: pz.patologiaCode,
      eta: this.calcolaEta(pz.dataNascita),
    };
  }

  public calcolaEta(dataNascita: string): number {
    const today = new Date();
    const birthDate = new Date(dataNascita);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  public filterByName(name: string) {
    const filtered = this.#listaPZ().filter((p) => {
      const fullName = `${p.nome} ${p.cognome}`.toLowerCase();
      return fullName.includes(name.toLowerCase());
    });
    this.#listaPZFiltered.set(filtered);
  }

  public searchByCodiceFiscale(codiceFiscale: string): Observable<PazienteAnagrafica[]> {
    const normalizedCf = codiceFiscale.trim().toUpperCase();

    return this.#http
      .get<APIResponse<PazienteSearchDTO[]>>(`/api/patients/search?cf=${encodeURIComponent(normalizedCf)}`)
      .pipe(map((res) => res.data.map((pz) => this.mapSearchDTOToAnagrafica(pz))));
  }

  public searchByAnagrafica(params: RicercaPerAnagrafica): Observable<PazienteAnagrafica[]> {
    const normalizedNome = params.nome.trim();
    const normalizedCognome = params.cognome.trim();
    const normalizedDataNascita = params.dataNascita.trim();

    const queryString =
      `nome=${encodeURIComponent(normalizedNome)}` +
      `&cognome=${encodeURIComponent(normalizedCognome)}` +
      `&data_nascita=${encodeURIComponent(normalizedDataNascita)}`;

    return this.#http
      .get<APIResponse<PazienteSearchDTO[]>>(`/api/patients/search?${queryString}`)
      .pipe(map((res) => res.data.map((pz) => this.mapSearchDTOToAnagrafica(pz))));
  }

  private mapSearchDTOToAnagrafica(pz: PazienteSearchDTO): PazienteAnagrafica {
    return {
      id: pz.id,
      nome: pz.nome,
      cognome: pz.cognome,
      dataNascita: pz.data_nascita,
      codiceFiscale: pz.codice_fiscale,
      sesso: pz.sex,
    };
  }
}
