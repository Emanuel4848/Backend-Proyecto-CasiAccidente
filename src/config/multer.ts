import multer from "multer";

const storage = multer.memoryStorage();

const tiposPermitidos = new Map([
    [".pdf", "application/pdf"],
    [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"],
    [".png", "image/png"],
    [".xls", "application/vnd.ms-excel"],
    [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    [".txt", "text/plain"],
]);

export const upload = multer({

    storage,

    limits: {

        fileSize: 10 * 1024 * 1024

    },

    fileFilter(req, file, cb) {

        const extension = file.originalname.slice(file.originalname.lastIndexOf(".")).toLowerCase();
        if (tiposPermitidos.get(extension) === file.mimetype) {
            return cb(null, true);
        }

        const error = new Error("Tipo de archivo no permitido o extensión no coincide con su contenido");
        Object.assign(error, { status: 400 });
        return cb(error);
    }

});
