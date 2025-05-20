const multer = require('multer');
const path = require('path');

// Destination + nom du fichier
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // dossier où seront stockées les images
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // fichier avec nom unique
    }
});

// Filtrer les fichiers (par exemple, que des images)
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
        return cb(new Error('Only images are allowed'), false);
    }
    cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = upload;
