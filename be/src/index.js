import express from 'express';
import multer from 'multer'; // Import thư viện multer để xử lý upload file
import UploadCloudinary from './configs/cloud/cloudinary.config';
import pool from './configs/database/database.config';
const app = express();
require("dotenv").config();

const port = process.env.PORT || 3000;

// Middleware để xử lý JSON và đường dẫn tĩnh
app.use(express.json());
app.use(express.static('public'));
import morgan from 'morgan';
// Sử dụng Morgan middleware để ghi lại các yêu cầu HTTP
app.use(morgan('dev'));
import cors from 'cors';
app.use(cors()); // Middleware CORS

// Khởi tạo multer để xử lý file upload
const upload = multer();

// API endpoint để upload ảnh và cập nhật thông tin vào cơ sở dữ liệu
app.post('/upload', upload.single('image_file'), async (req, res) => {
    try {
        // Kiểm tra xem có tồn tại file ảnh được gửi từ client không
        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded.' });
        }

        // Lấy file từ trường "image_file"
        const imageFile = req.file;

        // Gọi hàm UploadCloudinary để upload ảnh lên Cloudinary
        const result = await UploadCloudinary(imageFile);

        // Kiểm tra kết quả từ Cloudinary
        if (!result) {
            return res.status(500).json({ message: 'Error uploading image to Cloudinary.' });
        }

        // Lưu thông tin vào cơ sở dữ liệu
        const { user_id, user_name, image_number } = req.body;
        await pool.query('INSERT INTO user_images (user_id, user_name, image_number, image_path) VALUES (?, ?, ?, ?)', [user_id, user_name, image_number, result.secure_url]);

        // Nếu upload thành công, gửi kết quả về cho client
        res.status(200).json({ message: 'Image uploaded and information saved successfully.', imageUrl: result.secure_url });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// API endpoint để lấy tất cả các ảnh từ cơ sở dữ liệu
app.get('/images', async (req, res) => {
    try {
        const [images] = await pool.query('SELECT * FROM user_images');
        res.status(200).json(images);
    } catch (error) {
        console.error('Error getting images:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
