import { supabase } from "../../config/supabase";

export class DocumentoStorage {

    async subirArchivo(

        archivo: Express.Multer.File,

        numeroCaso: string,

        nombreTipoDocumento: string,

        version: number

    ) {

        const extension =
            archivo.originalname
                .split(".")
                .pop()
                ?.toLowerCase();

        const nombreLimpio =
            nombreTipoDocumento

                .replace(/\s+/g, "")

                .replace(/[^\w.-]/g, "");

        const nombreArchivo =

            `${numeroCaso}/${nombreLimpio}/${nombreLimpio}_v${version}.${extension}`;

        const { error } =

            await supabase.storage

                .from("documentos")

                .upload(

                    nombreArchivo,

                    archivo.buffer,

                    {

                        contentType: archivo.mimetype,

                        upsert: false

                    }

                );

        if (error)

            throw error;

        return nombreArchivo;

    }

    async eliminarArchivo(ruta: string) {

        await supabase.storage

            .from("documentos")

            .remove([ruta]);

    }

    async obtenerUrl(ruta: string) {

        const { data, error } =
            await supabase.storage
                .from("documentos")
                .createSignedUrl(ruta, 60);

        if (error) {
            throw error;
        }

        return data.signedUrl;

    }

}