import { Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware";
import { casoService } from "./caso.service";
import { AppError } from "../../utils/app-error";
import { Request, NextFunction } from "express";
import prisma from "../../config/prisma";

export const casoController = {
  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user) throw new AppError("No autenticado", 401);
      const caso = await casoService.create(req.body, req.user.id_usuario);
      return res.status(201).json({ message: "Caso registrado exitosamente", data: caso });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async getAll(req: AuthRequest, res: Response) {
    try {
      if (!req.user) throw new AppError("No autenticado", 401);

      const { id_region, id_estado, id_brigada } = req.query;
      const filters = {
        id_region: id_region ? Number(id_region) : undefined,
        id_estado: id_estado ? Number(id_estado) : undefined,
        id_brigada: id_brigada ? Number(id_brigada) : undefined,
      };

      const data = await casoService.getAll(req.user, filters);
      return res.json({ message: "Casos obtenidos exitosamente", data });
    } catch (error) {
      if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const caso = await casoService.getById(Number(req.params.id));
      return res.json({ message: "Caso obtenido exitosamente", data: caso });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const caso = await casoService.update(Number(req.params.id), req.body);
      return res.json({ message: "Caso actualizado exitosamente", data: caso });
    } catch (error) {
      if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async remove(req: AuthRequest, res: Response) {
    try {
      if (!req.user) throw new AppError("No autenticado", 401);
      const motivo = req.body?.motivo ?? null;
      const caso = await casoService.anular(Number(req.params.id), req.user.id_usuario, motivo);
      return res.json({ message: "Caso anulado exitosamente", data: caso });
    } catch (error) {
      if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async reactivar(req: AuthRequest, res: Response) {
    try {
      if (!req.user) throw new AppError("No autenticado", 401);
      const caso = await casoService.reactivar(Number(req.params.id), req.user.id_usuario);
      return res.json({ message: "Caso reactivado exitosamente", data: caso });
    } catch (error) {
      if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async rechazar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      const id_usuario_accion = (req as any).user?.id_usuario || req.body.id_usuario_accion;

      const casoRechazado = await casoService.rechazar(Number(id), Number(id_usuario_accion), motivo);

      return res.status(200).json({
        success: true,
        message: "Caso rechazado exitosamente mediante transacción atómica",
        data: casoRechazado,
      });
    } catch (error) {
      next(error);
    }
  },

  async cerrar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { tipo_cierre, motivo_cierre } = req.body;
      const id_usuario_accion = (req as any).user?.id_usuario || req.body.id_usuario_accion;

      const casoCerrado = await casoService.cerrar(Number(id), Number(id_usuario_accion), tipo_cierre, motivo_cierre);

      return res.status(200).json({
        success: true,
        message: "Caso cerrado exitosamente",
        data: casoCerrado,
      });
    } catch (error) {
      next(error);
    }
  },

  async evaluar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const reqAny = req as any;
      const usuarioLogueado = reqAny.usuario || reqAny.user;
      const id_usuario = usuarioLogueado?.id_usuario || usuarioLogueado?.id;

      if (!id_usuario) {
        throw new AppError("No se encontró el usuario en la sesión", 401);
      }

      const resultado = await casoService.evaluar(Number(id), Number(id_usuario));
      res.json({ message: "Caso evaluado correctamente", data: resultado });
    } catch (error) {
      next(error);
    }
  },

  async getBandeja(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("No autenticado", 401);
      
      const { id_region, id_estado, id_brigada } = req.query;
      const filters = {
        id_region: id_region ? Number(id_region) : undefined,
        id_estado: id_estado ? Number(id_estado) : undefined,
        id_brigada: id_brigada ? Number(id_brigada) : undefined,
      };

      const data = await casoService.getBandeja(req.user, filters);
      return res.json({ message: "Bandeja obtenida exitosamente", data });
    } catch (error) {
      next(error);
    }
  },

  async validarProcedencia(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { procede, motivo } = req.body;
      
      const reqAny = req as any;
      const usuarioLogueado = reqAny.usuario || reqAny.user;
      const id_usuario = usuarioLogueado?.id_usuario || usuarioLogueado?.id || req.body.id_usuario_accion;

      if (!id_usuario) {
        throw new AppError("No se encontró el usuario en la sesión", 401);
      }

      const resultado = await casoService.validarProcedencia(Number(id), Number(id_usuario), procede, motivo);
      res.json({ message: "Validación de procedencia registrada correctamente", data: resultado });
    } catch (error) {
      next(error);
    }
  },

  async contarBandeja(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "No autenticado" });
      }
      const count = await casoService.contarBandeja(req.user);
      res.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  },

  async getRegiones(req: Request, res: Response, next: NextFunction) {
    try {
      const regiones = await prisma.regiones.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' }
      });
      res.json(regiones);
    } catch (error) {
      next(error);
    }
  },
};