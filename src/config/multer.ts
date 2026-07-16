import multer from "multer";

const storage = multer.memoryStorage();

const tiposPermitidos = [

    "application/pdf",

    "image/jpeg",

    "image/png",

    "application/vnd.ms-excel",

    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    "text/plain"

];

export const upload = multer({

    storage,

    limits: {

        fileSize: 10 * 1024 * 1024

    },

    fileFilter(req, file, cb) {

        if (tiposPermitidos.includes(file.mimetype)) {
            return cb(null, true);
        }

        return cb(new Error(`Tipo recibido: ${file.mimetype}`));
    }

});