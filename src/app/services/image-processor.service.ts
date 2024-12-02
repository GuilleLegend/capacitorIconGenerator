import { Injectable } from '@angular/core';
import JSZip from 'jszip';

@Injectable({
  providedIn: 'root'
})
export class ImageProcessorService {
  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  private async resizeImage(file: File, targetWidth: number, targetHeight: number, maintainAspectRatio = true): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Make background transparent
          ctx.clearRect(0, 0, targetWidth, targetHeight);

          if (maintainAspectRatio) {
            // Calculate dimensions maintaining aspect ratio
            const scale = Math.max(
              targetWidth / img.width,
              targetHeight / img.height
            );

            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;

            // Center the image
            const x = (targetWidth - scaledWidth) / 2;
            const y = (targetHeight - scaledHeight) / 2;

            // Draw the image centered and scaled
            ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          } else {
            // Stretch to fill
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          }

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not create image blob'));
            }
          }, 'image/png');
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
      } catch (error) {
        reject(error);
      }
    });
  }

  async processImages(files: { icon: File; splash: File }): Promise<Blob> {
    const zip = new JSZip();
    const assetsFolder = zip.folder('assets');
    
    if (!assetsFolder) {
      throw new Error('Could not create assets folder');
    }

    // Process icon
    const iconDims = await this.getImageDimensions(files.icon);
    const iconBlob = await this.resizeImage(
      files.icon,
      Math.max(1024, iconDims.width),
      Math.max(1024, iconDims.height)
    );
    
    // Generate icon variations
    assetsFolder.file('icon-only.png', iconBlob);
    assetsFolder.file('icon-foreground.png', iconBlob);
    
    // Create a white background for icon-background
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1024, 1024);
      const backgroundBlob = await new Promise<Blob>((resolve) => 
        canvas.toBlob((blob) => resolve(blob as Blob), 'image/png')
      );
      assetsFolder.file('icon-background.png', backgroundBlob);
    }

    // Process splash screen
    const splashDims = await this.getImageDimensions(files.splash);
    const splashBlob = await this.resizeImage(
      files.splash,
      Math.max(2732, splashDims.width),
      Math.max(2732, splashDims.height)
    );
    
    // Generate splash variations
    assetsFolder.file('splash.png', splashBlob);
    assetsFolder.file('splash-dark.png', splashBlob);

    // Generate README with instructions and information about processing
    const readme = `# Capacitor Assets
This folder contains the necessary assets for your Capacitor app.

## Files Generated
- icon-only.png (${Math.max(1024, iconDims.width)}x${Math.max(1024, iconDims.height)}) - Generated from your icon
- icon-foreground.png (${Math.max(1024, iconDims.width)}x${Math.max(1024, iconDims.height)}) - Generated from your icon
- icon-background.png (1024x1024) - White background
- splash.png (${Math.max(2732, splashDims.width)}x${Math.max(2732, splashDims.height)}) - Generated from your splash screen
- splash-dark.png (${Math.max(2732, splashDims.width)}x${Math.max(2732, splashDims.height)}) - Generated from your splash screen

## Image Processing Notes
${iconDims.width < 1024 || iconDims.height < 1024 ? 
  `- Original icon (${iconDims.width}x${iconDims.height}) was smaller than required. Image has been scaled up maintaining aspect ratio.\n` : ''}
${splashDims.width < 2732 || splashDims.height < 2732 ? 
  `- Original splash (${splashDims.width}x${splashDims.height}) was smaller than required. Image has been scaled up maintaining aspect ratio.\n` : ''}

## Usage
1. Extract these files to your project's assets folder
2. Run: npx capacitor-assets generate
3. The assets will be generated for iOS, Android, and PWA

Note: For Android 12+, the splash screen will use a smaller icon with a colored background.

Generated by Artemis Code (www.artemiscode.es)`;

    assetsFolder.file('README.md', readme);

    return await zip.generateAsync({ type: 'blob' });
  }
}
