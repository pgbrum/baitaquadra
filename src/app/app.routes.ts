import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AgendaComponent } from './pages/agenda/agenda.component';
import { QuadrasComponent } from './pages/quadras/quadras.component';
import { ClientesComponent } from './pages/clientes/clientes.component';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  // Rota Pública (Sem o menu lateral)
  { path: 'login', component: LoginComponent },
  
  // Rotas Privadas (Dentro do Layout)
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'agenda', component: AgendaComponent },
      { path: 'quadras', component: QuadrasComponent },
      { path: 'clientes', component: ClientesComponent },
    ]
  },

  // Rota de fallback (Se digitar uma URL que não existe, vai pro login)
  { path: '**', redirectTo: 'login' }
];