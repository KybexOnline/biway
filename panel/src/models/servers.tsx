
export interface IServerNode {
  id: string;
  name: string;
  provider: string;
  status: 'online' | 'offline' | 'Warning';
  tags: string[];
  public_ip: string;
  private_ip: string;
  public_key: string;
  api_key: string;
  CreatedAt: string;
}