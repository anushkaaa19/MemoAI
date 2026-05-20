import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../uploads/documents');
if(!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, uploadsDir);   
    },
    filename:(req, file, cb)=>{
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null,`${uniqueSuffix}-${file.originalname}`);
    }
});
const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'application/pdf'){
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize:parseInt(process.env.MAX_FILE_SIZE)||10485760 }, // 10MB limit
});
export default upload;
