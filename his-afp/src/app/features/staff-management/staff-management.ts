import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Button } from 'primeng/button';
import { Fieldset } from 'primeng/fieldset';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { StaffManager } from '../../core/Staff/staff-manager';
import { StaffMember, StaffRole } from '../../core/Staff/staff.model';
import { catchError, map, Observable, of, switchMap, timer } from 'rxjs';

interface SelectChangeEvent {
  value: StaffRole;
}

@Component({
  selector: 'his-staff-management',
  imports: [Button, Fieldset, FormsModule, InputText, Message, ReactiveFormsModule, SelectModule],
  templateUrl: './staff-management.html',
  styleUrl: './staff-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffManagement {
  readonly staffManager = inject(StaffManager);
  readonly roles = [
    { code: 'DOC' as StaffRole, label: 'Medico' },
    { code: 'INF' as StaffRole, label: 'Infermiere' },
    { code: 'AMM' as StaffRole, label: 'Amministrativo' },
  ];

  readonly roleSelection: Record<string, StaffRole> = {};
  readonly usernameSelection: Record<string, string> = {};
  readonly rowEditMode: Record<string, boolean> = {};
  readonly #fb = inject(FormBuilder);
  readonly staffForm = this.#fb.group({
    username: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(30)],
      [this.usernameAvailabilityValidator.bind(this)],
    ],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['', [Validators.required]],
  });

  constructor() {
    this.staffManager.fetchStaff();

    effect(() => {
      this.staffManager.staff().forEach((member) => {
        const key = member.id.toString();
        if (this.roleSelection[key] === undefined) {
          this.roleSelection[key] = member.role;
        }
        if (this.usernameSelection[key] === undefined) {
          this.usernameSelection[key] = member.username;
        }
      });
    });
  }

  get usernameControl() {
    return this.staffForm.get('username');
  }

  getPasswordControl() {
    return this.staffForm.get('password');
  }

  getRoleControl() {
    return this.staffForm.get('role');
  }

  private usernameAvailabilityValidator(
    control: AbstractControl<string | null>,
  ): Observable<ValidationErrors | null> {
    const username = control.value?.trim();

    if (!username) {
      return of(null);
    }

    return timer(300).pipe(
      switchMap(() => this.staffManager.checkUsernameAvailability(username)),
      map((response) => {
        return response.data.available ? null : { usernameTaken: true };
      }),
      catchError(() => of(null)),
    );
  }

  isRoleModified(staff: StaffMember) {
    return this.getSelectedRole(staff) !== staff.role;
  }

  updateRole(staff: StaffMember) {
    const selectedRole = this.getSelectedRole(staff);
    if (selectedRole && selectedRole !== staff.role) {
      this.staffManager.updateStaffRole(staff.id, selectedRole);
    }
  }

  getSelectedRole(staff: StaffMember): StaffRole {
    return this.roleSelection[staff.id.toString()] ?? staff.role;
  }

  onRoleChange(staff: StaffMember, event: SelectChangeEvent) {
    this.roleSelection[staff.id.toString()] = event.value;
  }

  isRowEditing(staff: StaffMember) {
    return this.rowEditMode[staff.id.toString()] === true;
  }

  startRowEdit(staff: StaffMember) {
    const key = staff.id.toString();
    this.rowEditMode[key] = true;
    this.roleSelection[key] = staff.role;
    this.usernameSelection[key] = staff.username;
  }

  cancelRowEdit(staff: StaffMember) {
    const key = staff.id.toString();
    this.rowEditMode[key] = false;
    this.roleSelection[key] = staff.role;
    this.usernameSelection[key] = staff.username;
  }

  onUsernameChange(staff: StaffMember, value: string) {
    this.usernameSelection[staff.id.toString()] = value;
  }

  saveRowEdit(staff: StaffMember) {
    const key = staff.id.toString();
    const username = (this.usernameSelection[key] ?? '').trim();
    const role = this.getSelectedRole(staff);

    if (!username || username.length < 3 || username.length > 30) {
      return;
    }

    this.staffManager.updateStaff(staff.id, { username, role });
    this.rowEditMode[key] = false;
  }

  deleteUser(staff: StaffMember) {
    this.staffManager.deleteStaff(staff.id);
  }

  roleLabel(role: StaffRole) {
    return this.roles.find((item) => item.code === role)?.label ?? role;
  }

  onSubmitNewStaff() {
    if (this.staffForm.valid) {
      const value = this.staffForm.value as {
        username: string;
        password: string;
        role: StaffRole;
      };

      this.staffManager.createStaff({
        username: value.username.trim(),
        password: value.password,
        role: value.role,
      });
      this.staffForm.reset();
    } else {
      this.staffForm.markAllAsTouched();
    }
  }
}
