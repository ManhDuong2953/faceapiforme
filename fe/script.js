const imageUpload = document.getElementById('imageUpload');
const video = document.getElementById('videoElm');
let labeledFaceDescriptors = []; // Lưu trữ các mô tả khuôn mặt đã được đánh dấu trước

async function loadFaceAPI() {
    await faceapi.nets.faceRecognitionNet.loadFromUri('./models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('./models');
    await faceapi.nets.tinyFaceDetector.loadFromUri('./models');
    await faceapi.nets.faceExpressionNet.loadFromUri('./models');
    await faceapi.nets.ssdMobilenetv1.loadFromUri('./models');

    labeledFaceDescriptors = await loadLabeledImages(); // Load và lưu trữ mô tả khuôn mặt đã được đánh dấu trước
}

function getCameraStream() {
    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
                video.srcObject = stream;
                video.onloadedmetadata = () => {
                    startFaceDetection(); // Bắt đầu nhận diện khuôn mặt sau khi video đã tải
                };
            })
            .catch(function (error) {
                console.error('Error accessing the camera: ', error);
            });
    }
}

async function startFaceDetection() {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    const displaySize = {
        width: video.videoWidth,
        height: video.videoHeight
    };

    setInterval(async () => {
        const detects = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
        const resizeDetects = faceapi.resizeResults(detects, displaySize);
        canvas.getContext('2d').clearRect(0,0, displaySize.width, displaySize.height);
        resizeDetects.forEach(detect => {
            const bestMatch = findBestMatch(detect.descriptor);
            faceapi.draw.drawFaceLandmarks(canvas, detect);
            if (bestMatch) {
                const text = bestMatch.toString();
                const { x, y, width, height } = detect.detection.box;
                console.log("Đã đăng nhập: "+ text );
                drawNameOnCanvas(canvas, text, { x: x, y: y - 5 }); // Vẽ tên lên canvas
            }
        });
    }, 200);
}

async function loadLabeledImages() {
    try {
        // Fetch tất cả các ảnh từ máy chủ
        const response = await fetch('http://localhost:8080/images');
        const data = await response.json();

        // Khởi tạo mảng để lưu trữ mô tả khuôn mặt đã được đánh dấu
        const labeledFaceDescriptors = [];

        // Duyệt qua mỗi bản ghi trong dữ liệu
        for (const record of data) {
            // Tạo đường dẫn đầy đủ đến ảnh
            const imagePath = record.image_path;

            // Tải ảnh từ đường dẫn
            const img = await faceapi.fetchImage(imagePath);

            // Phát hiện khuôn mặt trong ảnh và tạo mô tả khuôn mặt
            const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

            // Kiểm tra xem có phát hiện được khuôn mặt không
            if (detections) {
                // Nếu có, thêm mô tả khuôn mặt đã được đánh dấu vào mảng
                labeledFaceDescriptors.push(new faceapi.LabeledFaceDescriptors(record.user_name, [detections.descriptor]));
            } else {
                console.log(`Không thể phát hiện khuôn mặt trong ảnh: ${imagePath}`);
            }
        }

        return labeledFaceDescriptors;
    } catch (error) {
        console.error('Lỗi khi tải ảnh và phát hiện khuôn mặt:', error);
        return [];
    }
}


function findBestMatch(descriptor) {
    if (labeledFaceDescriptors.length === 0) return null;
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
    const bestMatch = faceMatcher.findBestMatch(descriptor);
    return bestMatch._label === 'unknown' ? null : bestMatch; // Trả về null nếu không có kết quả tốt nhất
}

function drawNameOnCanvas(canvas, name, position) {
    const ctx = canvas.getContext('2d');
    ctx.font = '16px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(name, position.x, position.y);
}

loadFaceAPI().then(getCameraStream);
