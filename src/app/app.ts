import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('ninety-six');

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.navigate(['/intro']);
  }
}
