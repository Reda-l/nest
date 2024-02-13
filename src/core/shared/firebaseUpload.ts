import * as admin from 'firebase-admin';
export async function uploadFirebaseFile(file, destination : string): Promise<any> {
  if (!file) return null;
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  const bucket = admin.storage().bucket(bucketName);
  const folder = destination
  const options = {
      public: true,
      destination: folder + '/' + file.filename,
  };
  
  await bucket.upload(file.path, options);
  const fileUrl = `https://storage.googleapis.com/${bucketName}/${folder}/${file.filename}`;
  console.log(`File uploaded successfully: ${fileUrl}`);

  return fileUrl;
}

export async function deleteFile(filePath: string): Promise<any> {
    if (!filePath) return null;
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    const fileName = filePath.split('/').pop();
    const file = await admin
        .storage()
        .bucket(bucketName)
        .file("images" + '/' + fileName);
    file
        .exists()
        .then((exists) => {
            if (!exists[0]) {
                console.error('File does not exist');
                return;
            }
            // Delete the file
            file
                .delete()
                .then(() => {
                    console.log('File deleted successfully');
                })
                .catch((error) => {
                    console.error('Error deleting file:', error);
                });
        })
        .catch((error) => {
            console.error('Error checking file existence:', error);
        });
}