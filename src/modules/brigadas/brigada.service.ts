import { AppError } from "../../utils/app-error";
import { brigadaRepository } from "./brigada.repository";
import { brigadaValidator } from "./brigada.validator";
import prisma from "../../config/prisma";
import { ROLE_IDS } from "../../utils/role-ids";

const ROL_PRL_CONTRATISTA = ROLE_IDS.PRL_CONTRATISTA;
const ROL_RESPONSABLE_PROCESO = 4;

type BrigadaData = {
  id_region?: number | null;
};

const validateRelations = async (data: BrigadaData) => {
  if (data.id_region) {
    const region = await brigadaRepository.findRegionById(data.id_region);
    if (!region || region.activo === false) throw new AppError("La region indicada no existe o esta inactiva");
  }
};

const validateRolesAsignacion = async (id_usuario_prl: number | null, id_usuario_responsable: number | null) => {
  if (id_usuario_prl) {
    const tieneRolPrl = await prisma.usuario_roles.findFirst({
      where: { id_usuario: id_usuario_prl, id_rol: ROL_PRL_CONTRATISTA },
    });
    if (!tieneRolPrl) throw new AppError("El usuario indicado no tiene el rol de PRL Contratista", 400);
  }

  if (id_usuario_responsable) {
    const tieneRolResponsable = await prisma.usuario_roles.findFirst({
      where: { id_usuario: id_usuario_responsable, id_rol: ROL_RESPONSABLE_PROCESO },
    });
    if (!tieneRolResponsable) throw new AppError("El usuario indicado no tiene el rol de Responsable del Proceso", 400);
  }
};

export const brigadaService = {
  getAll(search?: string, id_usuario?: number, id_rol?: number) {
    return brigadaRepository.findAll({ search, take: search ? 20 : undefined, id_usuario_prl: id_rol === ROL_PRL_CONTRATISTA ? id_usuario : undefined });
  },
  getCatalogos() {
    return brigadaRepository.findCatalogos();
  },
  async getById(id: number) {
    const id_brigada = brigadaValidator.validateId(id);
    const brigada = await brigadaRepository.findById(id_brigada);
    if (!brigada) throw new AppError("Brigada no encontrada", 404);
    return brigada;
  },
  async create(data: unknown) {
    const validatedData = brigadaValidator.validateCreate(data as any);
    await validateRelations(validatedData);
    await validateRolesAsignacion(validatedData.id_usuario_prl, validatedData.id_usuario_responsable);

    const brigada = await brigadaRepository.create({
      nombre: validatedData.nombre,
      id_region: validatedData.id_region,
      activo: validatedData.activo,
    });

    if (validatedData.id_usuario_prl || validatedData.id_usuario_responsable) {
      await brigadaRepository.setAsignacion(brigada.id_brigada, {
        id_usuario_prl: validatedData.id_usuario_prl,
        id_usuario_responsable: validatedData.id_usuario_responsable,
      });
    }

    return brigadaRepository.findById(brigada.id_brigada);
  },
  async update(id: number, data: unknown) {
    const id_brigada = brigadaValidator.validateId(id);
    const validatedData = brigadaValidator.validateUpdate(data as any);
    const brigada = await brigadaRepository.findById(id_brigada);
    if (!brigada) throw new AppError("Brigada no encontrada", 404);
    await validateRelations(validatedData);

    const tieneAsignacion =
      validatedData.id_usuario_prl !== undefined || validatedData.id_usuario_responsable !== undefined;

    if (tieneAsignacion) {
      const actual = brigada.brigada_asignacion?.[0];
      const id_usuario_prl =
        validatedData.id_usuario_prl !== undefined ? validatedData.id_usuario_prl : actual?.id_usuario_prl ?? null;
      const id_usuario_responsable =
        validatedData.id_usuario_responsable !== undefined
          ? validatedData.id_usuario_responsable
          : actual?.id_usuario_responsable ?? null;

      await validateRolesAsignacion(id_usuario_prl, id_usuario_responsable);
      await brigadaRepository.setAsignacion(id_brigada, { id_usuario_prl, id_usuario_responsable });
    }

    const { id_usuario_prl, id_usuario_responsable, ...datosBrigada } = validatedData;
    if (Object.keys(datosBrigada).length > 0) {
      await brigadaRepository.update(id_brigada, datosBrigada);
    }

    return brigadaRepository.findById(id_brigada);
  },
  async remove(id: number) {
    const id_brigada = brigadaValidator.validateId(id);
    const brigada = await brigadaRepository.findById(id_brigada);
    if (!brigada) throw new AppError("Brigada no encontrada", 404);
    return brigadaRepository.softDelete(id_brigada);
  },
};
