import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ImageUploadComponent } from './components/image-upload/image-upload.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ImageUploadComponent],
  template: `
    <div class="app-container">
      <header>
        <h1>Capacitor Icon & Splash Screen Generator</h1>
      </header>
      
      <main>
        <app-image-upload></app-image-upload>
      </main>

      <footer>
        <p>Upload images to generate icons and splash screens for your Capacitor application</p>
        <div class="creator-signature">
          <p>Created by <a href="http://www.artemiscode.es" target="_blank">Artemis Code</a></p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .app-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    header {
      text-align: center;
      margin-bottom: 30px;
    }

    h1 {
      color: #333;
      font-size: 24px;
    }

    main {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 20px;
      flex: 1;
    }

    footer {
      text-align: center;
      margin-top: 20px;
      padding: 20px 0;
      color: #666;
    }

    .creator-signature {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 0.9em;
    }

    .creator-signature a {
      color: #007bff;
      text-decoration: none;
      font-weight: bold;
    }

    .creator-signature a:hover {
      text-decoration: underline;
    }
  `]
})
export class AppComponent {
  title = 'Capacitor Icon Generator';
}
