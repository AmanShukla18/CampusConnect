import { Platform } from 'react-native';

export type UploadResult = { url: string; publicId?: string };

type UploadMediaOptions = {
  uri: string;
  fileName?: string;
  mimeType?: string;
  mediaType?: 'image' | 'video';
  /** @deprecated kept for backward compatibility */
  name?: string;
  /** @deprecated kept for backward compatibility */
  type?: string;
};

const extensionToMime: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  qt: 'video/quicktime',
};

function inferMimeFromUri(uri: string): string | null {
  const withoutQuery = uri.split('?')[0];
  const extension = withoutQuery.split('.').pop()?.toLowerCase();
  if (!extension) return null;
  return extensionToMime[extension] || null;
}

function fallbackMime(type: 'image' | 'video') {
  return type === 'video' ? 'video/mp4' : 'image/jpeg';
}

function buildFileName(baseType: 'image' | 'video', provided?: string) {
  if (provided) return provided;
  const extension = baseType === 'video' ? 'mp4' : 'jpg';
  return `${baseType}-${Date.now()}.${extension}`;
}

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Failed to read file for upload.');
  }
  return response.blob();
}

export async function uploadMedia(options: UploadMediaOptions): Promise<UploadResult> {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() || 'dpmyeixjt';
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim() || 'CampusConnect';
  const folder = process.env.EXPO_PUBLIC_CLOUDINARY_FOLDER?.trim() || 'campusconnect/uploads';

  const missing: string[] = [];
  if (!cloudName) missing.push('EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME');
  if (!uploadPreset) missing.push('EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
  if (!folder) missing.push('EXPO_PUBLIC_CLOUDINARY_FOLDER');
  if (missing.length) {
    throw new Error(`Cloudinary configuration missing: ${missing.join(', ')}`);
  }

  if (!options?.uri) {
    throw new Error('uploadMedia requires a valid URI.');
  }

  const initialMime = options.mimeType || options.type || inferMimeFromUri(options.uri);
  const mediaType = options.mediaType || (initialMime?.startsWith('video') ? 'video' : 'image');
  const resolvedMime = initialMime || fallbackMime(mediaType);
  const fileName = buildFileName(mediaType, options.fileName || options.name);

  const formData = new FormData();

  if (Platform.OS === 'web') {
    const blob = await uriToBlob(options.uri);
    formData.append('file', blob, fileName);
  } else {
    formData.append('file', {
      uri: options.uri,
      name: fileName,
      type: resolvedMime,
    } as any);
  }

  formData.append('upload_preset', uploadPreset);
  formData.append('cloud_name', cloudName);
  formData.append('folder', folder);

  try {
    console.log('Uploading to Cloudinary', { mediaType, folder });
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    console.log('Cloudinary upload response', data);
    if (!response.ok) {
      throw new Error(data?.error?.message || 'Cloudinary upload failed');
    }
    if (!data?.secure_url) {
      throw new Error('Cloudinary did not return a secure_url');
    }
    return { url: data.secure_url as string, publicId: data.public_id as string };
  } catch (error) {
    console.error('Cloudinary upload error', error);
    throw error;
  }
}
