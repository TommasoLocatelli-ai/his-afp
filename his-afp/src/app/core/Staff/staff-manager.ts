import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { APIResponse } from '../models/APIResponse.model';
import { environment } from '../../../environments/environment';
import { StaffCreationRequest, StaffMember, StaffRole, UsernameAvailabilityDto } from './staff.model';

interface StaffUpdateRequest {
  username: string;
  role: StaffRole;
}

@Injectable({
  providedIn: 'root',
})
export class StaffManager {
  readonly #http = inject(HttpClient);
  readonly #staff = signal<StaffMember[]>([]);
  staff = this.#staff.asReadonly();
  readonly #isLoading = signal(false);
  isLoading = this.#isLoading.asReadonly();

  public fetchStaff() {
    this.#isLoading.set(true);
    this.#http.get<APIResponse<StaffMember[]>>(`${environment.apiUrl}/users`).subscribe({
      next: (response) => {
        this.#staff.set(response.data);
      },
      error: (error) => {
        console.error('Errore durante il fetch dello staff:', error);
      },
      complete: () => {
        this.#isLoading.set(false);
      },
    });
  }

  public checkUsernameAvailability(username: string) {
    return this.#http.get<APIResponse<UsernameAvailabilityDto>>(
      `${environment.apiUrl}/users/check/${encodeURIComponent(username)}`,
    );
  }

  public createStaff(staff: StaffCreationRequest) {
    this.#http.post<APIResponse<StaffMember>>(`${environment.apiUrl}/users`, staff).subscribe({
      next: () => {
        this.fetchStaff();
      },
      error: (error) => {
        console.error("Errore durante la creazione dell'operatore:", error);
      },
    });
  }

  public updateStaffRole(id: number, role: StaffRole) {
    this.#http
      .patch<APIResponse<StaffMember>>(`${environment.apiUrl}/users/${id}/editrole`, { role })
      .subscribe({
        next: () => {
          this.fetchStaff();
        },
        error: (error) => {
          console.error("Errore durante l'aggiornamento del ruolo:", error);
        },
      });
  }

  public updateStaff(id: number, staff: StaffUpdateRequest) {
    this.#http.patch<APIResponse<StaffMember>>(`${environment.apiUrl}/users/${id}`, staff).subscribe({
      next: () => {
        this.fetchStaff();
      },
      error: (error) => {
        console.error("Errore durante la modifica dell'operatore:", error);
      },
    });
  }

  public deleteStaff(id: number) {
    this.#http.delete<APIResponse<null>>(`${environment.apiUrl}/users/${id}`).subscribe({
      next: () => {
        this.fetchStaff();
      },
      error: (error) => {
        console.error("Errore durante l'eliminazione dell'operatore:", error);
      },
    });
  }
}
