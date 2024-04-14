import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: 'djknzvm9m',
    api_key: '224916943131337',
    api_secret: '4fONkQrV2KZPDMaaWkzycR3bAVc'
});

export default async function UploadCloudinary(file) {
    try {
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({
                resource_type: 'auto',
                folder: 'dataFaceUser',
                overwrite: true
            }, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }).end(file.buffer);
        });
        
        return result;
    } catch (error) {
        console.error("Lỗi khi tải lên:", error);
        return null;
    }
}
