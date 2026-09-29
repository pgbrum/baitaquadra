import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink], // Necessário para o botão funcionar
  templateUrl: './login.component.html'
})
export class LoginComponent {}