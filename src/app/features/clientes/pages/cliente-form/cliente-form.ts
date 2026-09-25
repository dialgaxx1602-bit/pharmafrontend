import { Component, inject, input, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ClienteRequest } from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente-service';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';

@Component({
  selector: 'app-cliente-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cliente-form.html',
  styleUrl: './cliente-form.css',
})
export class ClienteForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly clienteService = inject(ClienteService);
  private readonly router = inject(Router);

  readonly id = input<string>();

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly erroresServidor = signal<Record<string, string>>({});

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    tipoDoc: ['DNI', [Validators.required]],
    numDoc: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(15)]],
    telefono: ['', [Validators.maxLength(20)]],
    email: ['', [Validators.email, Validators.maxLength(100)]],
    estado: [true],
  });

  protected esEdicion(): boolean {
    return !!this.id();
  }

  ngOnInit(): void {
    const id = this.id();
    if (id) {
      this.clienteService.obtener(Number(id)).subscribe({
        next: c => this.form.setValue({
          nombre: c.nombre,
          tipoDoc: c.tipoDoc,
          numDoc: c.numDoc,
          telefono: c.telefono ?? '',
          email: c.email ?? '',
          estado: c.estado,
        }),
        error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
      });
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    const dto: ClienteRequest = {
      nombre: valores.nombre.trim(),
      tipoDoc: valores.tipoDoc.trim(),
      numDoc: valores.numDoc.trim(),
      telefono: valores.telefono.trim() || null,
      email: valores.email.trim() || null,
      estado: valores.estado,
    };
    const id = this.id();
    const peticion = id
      ? this.clienteService.actualizar(Number(id), dto)
      : this.clienteService.crear(dto);

    this.guardando.set(true);
    peticion.subscribe({
      next: () => this.router.navigate(['/clientes']),
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(mensajeError(err));
        this.erroresServidor.set(erroresDeValidacion(err));
      },
    });
  }
}
