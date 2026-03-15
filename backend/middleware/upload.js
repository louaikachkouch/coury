const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
	if (file.mimetype !== 'application/pdf') {
		return cb(new Error('Only PDF files are allowed'));
	}

	cb(null, true);
};

const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 15 * 1024 * 1024
	}
});

module.exports = upload;
