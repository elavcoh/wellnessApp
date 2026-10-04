/**
 * Keeps meal photos in the app's own folder, so they don't disappear.
 */

import { Directory, File, Paths } from 'expo-file-system';

// The camera/library picker hands back a photo in a temporary cache folder,
// which iOS can empty at any time - older meals would then show a blank
// thumbnail. Saved meals keep their photo here instead: the document
// folder is never cleared by the system.
const MEAL_PHOTOS_FOLDER = 'meal-photos';

// Copies a picked photo into the meal-photos folder and returns the value
// to save in the meals table. That value is a path RELATIVE to the document
// folder (e.g. "meal-photos/meal-1759571234567.jpg"), not a full file://
// address: iOS can move the app's folder when the app is updated, which
// would break a saved full address. resolveMealPhotoUri() turns it back
// into a full address when the photo is shown.
export async function saveMealPhoto(tempUri) {
  const folder = new Directory(Paths.document, MEAL_PHOTOS_FOLDER);
  folder.create({ intermediates: true, idempotent: true }); // no-op if it already exists

  const source = new File(tempUri);
  const fileName = `meal-${Date.now()}${source.extension || '.jpg'}`;
  await source.copy(new File(folder, fileName));
  return `${MEAL_PHOTOS_FOLDER}/${fileName}`;
}

// Turns a saved photo_uri into something <Image> can show. Meals saved
// before this file existed hold a full file:// address (the old temporary
// one), so anything with "://" is returned as is.
export function resolveMealPhotoUri(storedUri) {
  if (!storedUri) return null;
  if (storedUri.includes('://')) return storedUri;
  return new File(Paths.document, storedUri).uri;
}

// Deletes a meal's photo file when the meal itself is deleted. Old
// temporary-folder photos (full addresses) are left alone - they aren't ours.
export function deleteMealPhoto(storedUri) {
  if (!storedUri || storedUri.includes('://')) return;
  try {
    const file = new File(Paths.document, storedUri);
    if (file.exists) file.delete();
  } catch (error) {
    // A leftover photo file isn't worth failing the delete over.
  }
}
