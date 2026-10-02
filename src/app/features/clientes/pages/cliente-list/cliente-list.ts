import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Cliente } from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente-service';
import { mensajeError } from '../../../../core/utils/http-error';
import { PaginaResponse } from '../../../../core/models/pagina-response';

@Component({
  selector: 'app-cliente-list',
  imports: [RouterLink],
  templateUrl: './cliente-list.html',
  styleUrl: './cliente-list.css',
})
export class ClienteList implements OnInit {
  private readonly clienteService = inject(ClienteService);

  // Pagination and sorting signals
  protected readonly pagina = signal(0);
  protected readonly tamanio = signal(10);
  protected readonly ordenarPor = signal('apellidos');
  protected readonly direccion = signal<'asc' | 'desc'>('asc');

  // Response metadata signals
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly totalElementos = signal(0);
  protected readonly totalPaginas = signal(0);
  protected readonly ultima = signal(false);

  // Status signals
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filtro = signal('');

  // Local filter within current page by DNI or Nombres/Apellidos
  protected readonly filtrados = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    if (!texto) return this.clientes();
    return this.clientes().filter(c => {
      const nombreCompleto = `${c.nombres} ${c.apellidos}`.toLowerCase();
      return (
        c.dni.toLowerCase().includes(texto) ||
        c.nombres.toLowerCase().includes(texto) ||
        c.apellidos.toLowerCase().includes(texto) ||
        nombreCompleto.includes(texto)
      );
    });
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.clienteService
      .listar(this.pagina(), this.tamanio(), this.ordenarPor(), this.direccion())
      .subscribe({
        next: (resp: PaginaResponse<Cliente>) => {
          this.clientes.set(resp.contenido);
          this.pagina.set(resp.pagina);
          this.tamanio.set(resp.tamanio);
          this.totalElementos.set(resp.totalElementos);
          this.totalPaginas.set(resp.totalPaginas);
          this.ultima.set(resp.ultima);
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(mensajeError(err));
          this.cargando.set(false);
        },
      });
  }

  cambiarTamanio(nuevoTamanio: number): void {
    this.tamanio.set(nuevoTamanio);
    this.pagina.set(0);
    this.cargar();
  }

  paginaAnterior(): void {
    if (this.pagina() > 0) {
      this.pagina.update(p => p - 1);
      this.cargar();
    }
  }

  paginaSiguiente(): void {
    if (!this.ultima()) {
      this.pagina.update(p => p + 1);
      this.cargar();
    }
  }

  cambiarOrden(campo: string): void {
    if (this.ordenarPor() === campo) {
      this.direccion.update(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.ordenarPor.set(campo);
      this.direccion.set('asc');
    }
    this.cargar();
  }

  eliminar(cliente: Cliente): void {
    if (!confirm(`¿Eliminar al cliente "${cliente.nombres} ${cliente.apellidos}"?`)) {
      return;
    }
    this.clienteService.eliminar(cliente.id).subscribe({
      next: () => {
        // Reload current page after successful soft delete
        this.cargar();
      },
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }
}

