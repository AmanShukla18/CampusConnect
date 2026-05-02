import * as ImagePicker from 'expo-image-picker';

export type PickedMedia = {
  uri: string;
  mimeType: string;
  type: 'image' | 'video';
  fileName: string;
};

export type MediaSource = 'library' | 'camera';

const ANY_MEDIA_TYPES: ImagePicker.MediaType[] =
  ((ImagePicker as any).MediaType?.ALL as ImagePicker.MediaType[]) || ['images', 'videos'];

const pickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ANY_MEDIA_TYPES,
  allowsMultipleSelection: false,
  quality: 0.9,
  videoMaxDuration: 120,
};

function ensureFileName(type: 'image' | 'video', provided?: string | null | undefined) {
  if (provided) return provided;
  const ext = type === 'video' ? 'mp4' : 'jpg';
  return `${type}-${Date.now()}.${ext}`;
}

function fallbackMime(type: 'image' | 'video') {
  return type === 'video' ? 'video/mp4' : 'image/jpeg';
}

async function ensurePermission(source: MediaSource) {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (permission.status !== ImagePicker.PermissionStatus.GRANTED) {
    console.warn(`${source} permission not granted`);
    return false;
  }
  return true;
}

function normalizeAsset(asset: ImagePicker.ImagePickerAsset): PickedMedia | null {
  const uri = asset?.uri;
  if (!uri) return null;
  const type = asset.type === 'video' ? 'video' : 'image';
  return {
    uri,
    mimeType: asset.mimeType || fallbackMime(type),
    type,
    fileName: ensureFileName(type, asset.fileName || undefined),
  };
}

export async function pickMedia(source: MediaSource = 'library'): Promise<PickedMedia | null> {
  const granted = await ensurePermission(source);
  if (!granted) return null;

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(pickerOptions)
      : await ImagePicker.launchImageLibraryAsync(pickerOptions);

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  return normalizeAsset(result.assets[0]);
}
