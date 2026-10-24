import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  senha = '';
  lembrar = false;
  carregando = signal(false);
  erro = signal<string | null>(null);

  async entrar() {
    if (!this.email || !this.senha) {
      this.erro.set('Informe e-mail e senha.');
      return;
    }
    this.carregando.set(true);
    this.erro.set(null);
    try {
      await this.auth.login(this.email.trim(), this.senha, this.lembrar);
      // Volta para a página que o usuário tentou abrir antes do login
      const retorno = this.route.snapshot.queryParamMap.get('retorno');
      await this.router.navigateByUrl(retorno && retorno.startsWith('/') && !retorno.startsWith('/login') ? retorno : '/dashboard');
    } catch (e) {
      const status = (e as HttpErrorResponse).status;
      this.erro.set(status === 401 || status === 400
        ? 'E-mail ou senha inválidos.'
        : 'Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      this.carregando.set(false);
    }
  }
}
