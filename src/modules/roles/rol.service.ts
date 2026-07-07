import { rolRepository } from "./rol.repository";

export const rolService = {
  getAll() {
    return rolRepository.findAll();
  },
};
