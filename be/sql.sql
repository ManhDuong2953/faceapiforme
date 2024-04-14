CREATE DATABASE faceapi;
use faceapi;

CREATE TABLE user_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    image_number INT NOT NULL,
    image_path VARCHAR(255) NOT NULL
);