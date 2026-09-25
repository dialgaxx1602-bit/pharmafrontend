export interface Cliente {
  id: number;
  nombre: string;
  numDoc: string;
  tipoDoc: string;
  telefono: string | null;
  email: string | null;
  estado: boolean;
}

export interface ClienteRequest {
  nombre: string;
  numDoc: string;
  tipoDoc: string;
  telefono: string | null;
  email: string | null;
  estado: boolean;
}
