import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ImageProcessorService } from '../../services/image-processor.service';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="upload-container">
      <div class="requirements-info">
        <h3>Image Requirements:</h3>
        <ul>
          <li>Icon: minimum 1024x1024 pixels</li>
          <li>Splash screen: minimum 2732x2732 pixels</li>
          <li>Format: PNG or JPG</li>
        </ul>
      </div>

      <div class="image-upload-grid">
        <div class="upload-box" *ngFor="let type of imageTypes; let i = index">
          <div class="upload-area" 
               [class.dragging]="isDragging === type"
               [class.has-image]="!!uploadedFiles[type]"
               (dragover)="onDragOver($event, type)" 
               (dragleave)="onDragLeave($event)"
               (drop)="onDrop($event, type)">
            
            <div class="upload-content">
              <i class="upload-icon">{{ uploadedFiles[type] ? '✓' : '📁' }}</i>
              <p>{{ type }}</p>
              <input type="file" 
                     [id]="'file-' + i"
                     (change)="onFileSelected($event, type)" 
                     accept="image/*" 
                     style="display: none">
              <button (click)="triggerFileInput(i)" 
                      class="upload-button">
                {{ uploadedFiles[type] ? 'Change' : 'Select' }}
              </button>
            </div>

            <div class="preview" *ngIf="previewUrls[type]">
              <img [src]="previewUrls[type]" [alt]="type">
            </div>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="generate-button" 
                (click)="generateAssets()"
                [disabled]="!isReadyToGenerate()">
          Generate Assets
        </button>
      </div>

      <div class="error-message" *ngIf="errorMessage">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .upload-container {
      width: 100%;
      padding: 20px;
      box-sizing: border-box;
    }

    .requirements-info {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .requirements-info ul {
      list-style-type: none;
      padding-left: 0;
      margin-top: 10px;
    }

    .requirements-info li {
      margin-bottom: 5px;
      color: #666;
    }

    .image-upload-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .upload-box {
      width: 100%;
    }

    .upload-area {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      transition: all 0.3s ease;
      background-color: #f8f9fa;
      min-height: 200px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    .upload-area.dragging {
      background-color: #e9ecef;
      border-color: #007bff;
    }

    .upload-area.has-image {
      border-style: solid;
      border-color: #28a745;
    }

    .upload-icon {
      font-size: 48px;
      margin-bottom: 15px;
      display: block;
    }

    .upload-button {
      background-color: #007bff;
      color: white;
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .upload-button:hover {
      background-color: #0056b3;
    }

    .preview {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px;
    }

    .preview img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .actions {
      text-align: center;
      margin-top: 30px;
    }

    .generate-button {
      background-color: #28a745;
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .generate-button:hover {
      background-color: #218838;
    }

    .generate-button:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }

    .error-message {
      color: #dc3545;
      text-align: center;
      margin-top: 15px;
    }
  `]
})
export class ImageUploadComponent {
  imageTypes = ['icon', 'splash'];

  isDragging: string | null = null;
  uploadedFiles: { [key: string]: File } = {};
  previewUrls: { [key: string]: SafeUrl } = {};
  errorMessage = '';

  constructor(
    private imageProcessor: ImageProcessorService,
    private sanitizer: DomSanitizer,
    @Inject(DOCUMENT) private document: Document
  ) {}

  triggerFileInput(index: number): void {
    const fileInput = this.document.getElementById('file-' + index) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onDragOver(event: DragEvent, type: string) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = type;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = null;
  }

  onDrop(event: DragEvent, type: string) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = null;

    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.handleFile(files[0], type);
    }
  }

  onFileSelected(event: Event, type: string) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.handleFile(input.files[0], type);
    }
  }

  private handleFile(file: File, type: string) {
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file.';
      return;
    }

    this.uploadedFiles[type] = file;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        this.previewUrls[type] = this.sanitizer.bypassSecurityTrustUrl(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  }

  isReadyToGenerate(): boolean {
    return this.imageTypes.every(type => !!this.uploadedFiles[type]);
  }

  async generateAssets() {
    try {
      this.errorMessage = '';
      const zipBlob = await this.imageProcessor.processImages({
        icon: this.uploadedFiles['icon'],
        splash: this.uploadedFiles['splash']
      });
      
      // Create and download ZIP file
      const url = URL.createObjectURL(zipBlob);
      const a = this.document.createElement('a');
      a.href = url;
      a.download = 'capacitor-assets.zip';
      this.document.body.appendChild(a);
      a.click();
      this.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Error generating assets';
    }
  }
}
