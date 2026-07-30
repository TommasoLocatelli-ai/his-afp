import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { PazienteAnagrafica } from '../../core/Pazienti/Pazienti.model';
import { FormAccettazionePz } from './components/form-accettazione-pz/form-accettazione-pz';
import { RicercaPaziente } from './components/ricerca-paziente/ricerca-paziente';

@Component({
  selector: 'his-accettazione-pz',
  imports: [Button, FormAccettazionePz, Message, RicercaPaziente],
  templateUrl: './accettazione-pz.html',
  styleUrl: './accettazione-pz.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccettazionePz {
  readonly showForm = signal(false);
  readonly selectedPatient = signal<PazienteAnagrafica | null>(null);

  onPatientSelected(patient: PazienteAnagrafica): void {
    this.selectedPatient.set(patient);
    this.showForm.set(true);
  }

  onNoPatientFound(): void {
    this.selectedPatient.set(null);
    this.showForm.set(false);
  }

  onNewPatientRequest(): void {
    this.selectedPatient.set(null);
    this.showForm.set(true);
  }

  onBackToSearch(): void {
    this.selectedPatient.set(null);
    this.showForm.set(false);
  }
}
