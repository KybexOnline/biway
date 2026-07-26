import { useState, useEffect } from 'react';
import { Server, X, MonitorCog, Cpu, GitCommit, KeyRound, Globe, Terminal } from 'lucide-react';
import { Modal, Chip } from "@heroui/react";
import clsx from 'clsx';
import { createDataProvider } from '../api/dataProvider';
import type { IServerNode } from '../models/servers';
import { formatDistanceToNow } from 'date-fns';
import AgentInstallationCard from './AgentInstallationCard';

interface NodeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverId?: string | number;
  server?: IServerNode;
}

export interface IServerInfo {
  id: string;
  server_id: string;

  os: string;
  distro: string;
  version: string;
  arch: string;
  kernel: string;

  agent_commit: string;
  agent_version: string;

  raw: Record<string, any> | null;

  created_at: string | Date;
  updated_at: string | Date;
}

const nodeProvider = createDataProvider('servers');

function InfoRow({
  icon: Icon,
  label,
  value,
  mono = true,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-center px-4 py-3 text-sm">
      <span className="flex items-center gap-2 text-on-surface-variant">
        <Icon className="w-4 h-4 opacity-70" />
        {label}
      </span>
      {value ? (
        <span className={clsx('text-on-background', mono && 'font-mono text-[13px]')}>
          {value}
        </span>
      ) : (
        <span className="h-3 w-20 rounded bg-surface-container-highest animate-pulse" />
      )}
    </div>
  );
}

export default function NodeDetailsModal({ isOpen, onClose, serverId, server }: NodeDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'setup'>('overview');
  const [currentServer, setCurrentServer] = useState<IServerNode>();
  const [nodeInfo, setNodeInfo] = useState<IServerInfo>();

  function TimeAgo({ dateString }: { dateString: string }) {
    const timeAgo = formatDistanceToNow(new Date(dateString), {
      addSuffix: true,        // adds "ago"
      includeSeconds: true,   // more precision
    });

    return <Chip color="accent">{timeAgo}</Chip>;
  }

  useEffect(() => {
    const getNodeInfo = async () => {
      const info = await nodeProvider.customGet<IServerInfo>(`/${serverId}/info`);
      setNodeInfo(info);
    }
    if (serverId !== "" && serverId !== undefined) {
      getNodeInfo();
    }
  }, [serverId])

  useEffect(() => {
    const fetchServerData = async () => {
      if (serverId === undefined) return;
      const serverInfo = await nodeProvider.getOne<IServerNode>(serverId!);
      setCurrentServer(serverInfo);
    }

    if (currentServer === undefined) {
      if (server !== undefined) {
        setCurrentServer(server);
      } else {
        fetchServerData();
      }
    }
  }, [server, serverId]);

  if (currentServer === undefined) {
    return (<></>);
  }

  const osLabel = nodeInfo ? `${nodeInfo.distro || nodeInfo.os} ${nodeInfo.version}`.trim() : undefined;

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop variant="blur" className="bg-background/80">
        <Modal.Container size="md" placement="center">
          <Modal.Dialog className="bg-surface-container border border-outline-variant rounded-xl shadow-2xl p-0 overflow-hidden w-full max-w-3xl">
              <div className="w-full flex flex-col">

                {}
                <div className="flex justify-between items-start p-6 pb-4 border-b border-outline-variant bg-surface">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-highest border border-outline-variant flex items-center justify-center text-primary">
                      <Server className="w-6 h-6 fill-current text-primary/20" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="font-sans font-bold text-xl tracking-tight text-on-background leading-none">
                          {currentServer?.name}
                        </h2>

                        {currentServer?.status === 'online' ? (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase border border-tertiary/30 text-tertiary bg-tertiary/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
                            Online
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase border border-error/30 text-error bg-error/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                            Offline
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant font-mono">
                        ID: <Chip color='success'>{currentServer?.id.split('-')[0]}</Chip> • Created <TimeAgo dateString={currentServer?.CreatedAt}/>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-on-surface-variant hover:text-on-background transition-colors p-1 rounded-md hover:bg-surface-container-highest"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {}
                <div className="flex gap-6 px-6 bg-surface border-b border-outline-variant">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={clsx(
                      "py-3 border-b-2 font-medium text-sm transition-colors",
                      activeTab === 'overview' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-background"
                    )}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('setup')}
                    className={clsx(
                      "py-3 border-b-2 font-medium text-sm transition-colors",
                      activeTab === 'setup' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-background"
                    )}
                  >
                    Setup
                  </button>
                </div>

                {}
                <div className="p-6 bg-surface-container flex-1 overflow-y-auto max-h-[614px]">
                  {activeTab === 'overview' ? (
                    <div className="space-y-6">

                      {}
                      <div>
                        <h3 className="text-sm font-bold text-on-background mb-3">Network</h3>
                        <div className="bg-surface border border-outline-variant rounded-lg divide-y divide-outline-variant">
                          <InfoRow icon={Globe} label="Public IP" value={currentServer?.public_ip} />
                          <InfoRow icon={Globe} label="Private IP" value={currentServer?.private_ip} />
                          <InfoRow icon={KeyRound} label="Public Key" value={currentServer?.public_key} />
                        </div>
                      </div>

                      {}
                      <div>
                        <h3 className="text-sm font-bold text-on-background mb-3">System Information</h3>
                        <div className="bg-surface border border-outline-variant rounded-lg divide-y divide-outline-variant">
                          <InfoRow icon={MonitorCog} label="Operating System" value={osLabel} mono={false} />
                          <InfoRow icon={Cpu} label="Architecture" value={nodeInfo?.arch} />
                          <InfoRow icon={Terminal} label="Kernel" value={nodeInfo?.kernel} />
                        </div>
                      </div>

                      {}
                      <div>
                        <h3 className="text-sm font-bold text-on-background mb-3">Agent</h3>
                        <div className="bg-surface border border-outline-variant rounded-lg divide-y divide-outline-variant">
                          <div className="flex justify-between items-center px-4 py-3 text-sm">
                            <span className="flex items-center gap-2 text-on-surface-variant">
                              <Server className="w-4 h-4 opacity-70" />
                              Agent Version
                            </span>
                            {nodeInfo ? (
                              <span className="font-mono text-[13px] text-on-background">
                                {nodeInfo.agent_version}
                              </span>
                            ) : (
                              <span className="h-3 w-20 rounded bg-surface-container-highest animate-pulse" />
                            )}
                          </div>
                          <InfoRow icon={GitCommit} label="Agent Commit" value={nodeInfo?.agent_commit?.slice(0, 12)} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <AgentInstallationCard apiKey={currentServer.api_key}/>
                    </div>
                  )}
                </div>

              </div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}