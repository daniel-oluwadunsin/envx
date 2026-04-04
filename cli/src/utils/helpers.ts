import path from "path";
import { CONFIG_FILE_NAME } from "../configs/const";

export const getConfigFilePath = () => {
  return path.join(process.cwd(), CONFIG_FILE_NAME);
};
