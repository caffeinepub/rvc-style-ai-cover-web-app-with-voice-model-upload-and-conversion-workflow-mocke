import { ExternalBlob } from '../backend';

export async function downloadExternalBlob(blob: ExternalBlob, filename: string): Promise<void> {
  try {
    const bytes = await blob.getBytes();
    const blobObj = new Blob([bytes], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blobObj);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error('Failed to download blob:', error);
    throw new Error('Failed to download file. Please try again.');
  }
}
