import { useEffect, useState } from 'react';
import { PlusSquare, Server } from 'lucide-react';
import CreateNodeModal from '../components/CreateNodeModal';
import NodeDetailsModal from '../components/NodeDetailsModal';
import { createDataProvider } from '../api/dataProvider';
import { AlertDialog, Button, Pagination, Table, toast } from '@heroui/react';
import { Icon } from '@iconify/react';
import type { IServerNode } from '../models/servers';
import { readProvidersCache, writeProvidersCache, type IProvider } from '../utils/providers';

interface DetailsModal {
  isOpen: boolean;
  server_id?: string | number;
  server?: IServerNode;
}

const nodeProvider = createDataProvider('servers');
const settingProvider = createDataProvider('settings');

// Fallback colors used before the providers setting has loaded (or if it's empty).
const DEFAULT_PROVIDER_COLORS: Record<string, string> = {
  aws: '#FF9900',
  gcp: '#4285F4',
  digitalocean: '#0080FF',
  azure: '#0089D6',
  Default: '#888888'
};

const STATUS_STYLES: Record<string, { bg: string, text: string, dot: string }> = {
  online: { bg: 'bg-tertiary/10', text: 'text-tertiary', dot: 'bg-tertiary' },
  offline: { bg: 'bg-surface-container-highest', text: 'text-secondary', dot: 'bg-secondary' },
  Warning: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', dot: 'bg-yellow-500' }
};

function buildProviderColors(providers: IProvider[]): Record<string, string> {
  const colors: Record<string, string> = { Default: DEFAULT_PROVIDER_COLORS.Default };
  providers.forEach((p) => {
    if (!p.code) return;
    colors[p.code] = p.color ? (p.color.startsWith('#') ? p.color : `#${p.color}`) : colors.Default;
  });
  return colors;
}

export default function Nodes() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<DetailsModal>({
    isOpen: false,
  });

  // Data Provider State
  const [nodes, setNodes] = useState<IServerNode[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Provider colors, built from the (possibly cached) providers list
  const [providerColors, setProviderColors] = useState<Record<string, string>>(DEFAULT_PROVIDER_COLORS);

  // Pagination State
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  const fetchNodes = async () => {
    setError(null);

    try {
      const response = await nodeProvider.getList<IServerNode>({
        page,
        perPage,
      });

      setNodes(response.data);
      setTotal(response.total);
    } catch (err: any) {
      console.error("Failed to fetch nodes:", err);
      setError("Failed to load servers. Please try again.");
    }
  };

  const fetchProviders = async () => {
    const cached = readProvidersCache();
    if (cached) {
      setProviderColors(buildProviderColors(cached));
      return;
    }

    try {
      const response = await settingProvider.customGet("/providers");
      const items: IProvider[] = response.items ?? [];

      writeProvidersCache(items);
      setProviderColors(buildProviderColors(items));
    } catch (error) {
      console.log(error);
    }
  }

  const deleteServer = async (serverId: string | number) => {
    try {
      await nodeProvider.delete(serverId);
      toast.success('Server deleted successfully');
      fetchNodes();
    } catch (error) {
      console.error("Failed to delete server:", error);
      toast.danger('Failed to delete server. Please try again.');
    }
  };

  useEffect(() => {
    fetchProviders();
    fetchNodes();
  }, [page, perPage]);

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    pages.push(1);
    if (page > 3) {
      pages.push("ellipsis");
    }
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) {
      pages.push("ellipsis");
    }
    pages.push(totalPages);
    return pages;
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto min-h-screen bg-background text-on-background">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-sans font-bold text-2xl tracking-tight text-on-surface">Nodes List</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage and monitor active mesh network nodes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center px-4 py-2 bg-primary text-on-primary rounded-md text-sm font-medium hover:brightness-110 transition-colors"
          >
            <PlusSquare className="w-4 h-4 mr-2" />
            Add Server
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="overflow-hidden shadow-sm">
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Table with pagination" className="min-w-[600px]">
              <Table.Header>
                <Table.Column isRowHeader>SERVER NAME</Table.Column>
                <Table.Column>PROVIDER</Table.Column>
                <Table.Column>STATUS</Table.Column>
                <Table.Column>PUBLIC IP</Table.Column>
                <Table.Column>PRIVATE IP</Table.Column>
                <Table.Column>ACTIONS</Table.Column>
              </Table.Header>
              <Table.Body>
                {nodes.map((node) => {
                  const statusStyle = STATUS_STYLES[node.status] || STATUS_STYLES.offline;
                  const providerColor = providerColors[node.provider] || providerColors.Default;
                  return (<Table.Row key={node.id} id={node.id}>
                    <Table.Cell>
                      <div className="flex items-center">
                        <Server className={`${node.status === 'online' ? 'text-primary' : 'text-on-surface-variant'} w-5 h-5 mr-3`} />
                        <span className={`font-medium ${node.status === 'online' ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                          {node.name}
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center text-on-surface-variant">
                        <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: providerColor }}></span>
                        {node.provider || '-'}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-outline-variant/20 ${statusStyle.bg} ${statusStyle.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusStyle.dot}`}></span>
                        {node.status}
                      </span>
                    </Table.Cell>
                    <Table.Cell>{node.public_ip}</Table.Cell>
                    <Table.Cell>{node.private_ip}</Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-1">
                        <Button isIconOnly size="sm" variant="tertiary" onClick={() => {
                          setIsDetailsModalOpen({
                            isOpen: true,
                            server_id: node.id
                          });
                        }}>
                          <Icon className="size-4" icon="gravity-ui:eye" />
                        </Button>
                        <Button isIconOnly size="sm" variant="tertiary">
                          <Icon className="size-4" icon="gravity-ui:pencil" />
                        </Button>
                        <AlertDialog>
                          <AlertDialog.Trigger>
                            <Button isIconOnly size="sm" variant="danger-soft">
                              <Icon className="size-4" icon="gravity-ui:trash-bin" />
                            </Button>
                          </AlertDialog.Trigger>
                          <AlertDialog.Backdrop>
                            <AlertDialog.Container>
                              <AlertDialog.Dialog className="sm:max-w-[400px]">
                                <AlertDialog.CloseTrigger />
                                <AlertDialog.Header>
                                  <AlertDialog.Icon status="danger">
                                    <Icon className="size-5" icon="gravity-ui:trash-bin" />
                                  </AlertDialog.Icon>
                                  <AlertDialog.Heading>Delete this Server?</AlertDialog.Heading>
                                </AlertDialog.Header>

                                <AlertDialog.Body>
                                  <p className="text-on-surface-variant">
                                    Are you sure you want to delete the server <strong className="text-on-surface">{node.name}</strong>?
                                    This action cannot be undone and will permanently remove it from the mesh network.
                                  </p>
                                </AlertDialog.Body>

                                <AlertDialog.Footer>
                                  <Button slot="close" variant="tertiary">
                                    Cancel
                                  </Button>
                                  <Button slot="close" variant="danger" onClick={() => {
                                    deleteServer(node.id)
                                  }}>
                                    Delete Server
                                  </Button>
                                </AlertDialog.Footer>
                              </AlertDialog.Dialog>
                            </AlertDialog.Container>
                          </AlertDialog.Backdrop>
                        </AlertDialog>
                      </div>
                    </Table.Cell>
                  </Table.Row>)
                })}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
          <Table.Footer>
            <Pagination size="sm">
              <Pagination.Summary>
                {page} to {nodes.length} of {total} results
              </Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={page === 1}
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <Pagination.PreviousIcon />
                    Prev
                  </Pagination.Previous>
                </Pagination.Item>
                {getPageNumbers().map((p, i) =>
                  p === "ellipsis" ? (
                    <Pagination.Item key={`ellipsis-${i}`}>
                      <Pagination.Ellipsis />
                    </Pagination.Item>
                  ) : (
                    <Pagination.Item key={p}>
                      <Pagination.Link isActive={p === page} onPress={() => setPage(p)}>
                        {p}
                      </Pagination.Link>
                    </Pagination.Item>
                  ),
                )}
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={page === totalPages}
                    onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </Table.Footer>
        </Table>

      </div>

      <CreateNodeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchNodes();
        }}
      />
      <NodeDetailsModal isOpen={isDetailsModalOpen.isOpen} serverId={isDetailsModalOpen.server_id} onClose={() => setIsDetailsModalOpen({ isOpen: false, server_id: '' })} />
    </div>
  );
}