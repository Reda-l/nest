import * as admin from 'firebase-admin';
export async function uploadFirebaseFile(
    file,
    destination: string,
  ): Promise<any> {
    if (!file) return null;
    const bucketName = 'spa-epices.appspot.com';
    const bucket = admin.storage().bucket(bucketName);
    const fileName = `${destination}/${file.originalname}`;
    const fileBuffer = file.buffer;
    await bucket.file(fileName).save(fileBuffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });
    const fileUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
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