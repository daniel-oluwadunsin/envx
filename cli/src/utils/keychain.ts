import keytar from "keytar";

class KeychainService {
  private readonly serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  async setValue(key: string, value: string): Promise<void> {
    await keytar.setPassword(this.serviceName, key, value);
  }

  async getValue(key: string): Promise<string | null> {
    return await keytar.getPassword(this.serviceName, key);
  }

  async deleteValue(key: string): Promise<void> {
    await keytar.deletePassword(this.serviceName, key);
  }
}

export const keychainService = new KeychainService("envx-cli");
