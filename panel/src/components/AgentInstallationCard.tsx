import { useState } from "react";
import { Card, Button, Accordion, cn } from "@heroui/react";
import { Info, Terminal, Settings, ChevronDown } from "lucide-react";

interface AgentInstallationProps {
    apiKey: string;
}

export default function AgentInstallationCard({ apiKey }: AgentInstallationProps) {
    const [copiedCommand, setCopiedCommand] = useState(false);
    const [copiedToken, setCopiedToken] = useState(false);
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const command = `curl -sL ${baseUrl}/install.sh | sudo bash -s -- --token=${apiKey}`;

    const handleCopyCommand = () => {
        if (!apiKey) return;
        navigator.clipboard.writeText(command);
        setCopiedCommand(true);
        setTimeout(() => setCopiedCommand(false), 2000);
    };

    const handleCopyToken = () => {
        if (!apiKey) return;
        navigator.clipboard.writeText(apiKey);
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
    };

    return (
        <Card className="w-full max-w-3xl bg-content1 shadow-sm border border-default-200">
            <Card.Header className="flex flex-col items-start px-6 pt-6 pb-2">
                <Card.Title className="text-lg font-semibold text-foreground">
                    Agent Initialization
                </Card.Title>
                <Card.Description className="text-sm text-default-500 mt-1">
                    Choose how you want to deploy or update the Biway Mesh agent on your target machine.
                </Card.Description>
            </Card.Header>

            <Card.Content className="px-6 py-4">
                <Accordion 
                    variant="surface"
                    allowsMultipleExpanded 
                    defaultExpandedKeys={["quick-install"]}
                    className="bg-default-100/50 w-full rounded-2xl p-0"
                >
                    {/* Method 1: Automated Script */}
                    <Accordion.Item
                        defaultExpanded={true}
                        isExpanded
                        key="quick-install" 
                        className={cn(
                            "group/item",
                            "first:[&_[data-slot=accordion-trigger]]:rounded-t-2xl",
                            "last:[&:not(:has([data-slot=accordion-trigger][aria-expanded='true']))_[data-slot=accordion-trigger]]:rounded-b-2xl"
                        )}
                    >
                        <Accordion.Heading>
                            <Accordion.Trigger className="hover:bg-default-200/50 group flex items-center gap-3 transition-none px-4 py-3">
                                <div className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl bg-primary/10 text-primary transition-[scale,rotate] duration-300 ease-out group-hover/item:scale-110 group-hover/item:-rotate-6 group-hover/item:shadow-md">
                                    <Terminal className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col gap-0 text-left flex-1">
                                    <span className="leading-5 font-medium text-foreground">Quick Install Command</span>
                                    <span className="leading-6 font-normal text-default-500">Run the automated script to install and link the agent</span>
                                </div>
                                <Accordion.Indicator className="text-default-400 [&>svg]:size-5">
                                    <ChevronDown />
                                </Accordion.Indicator>
                            </Accordion.Trigger>
                        </Accordion.Heading>

                        <Accordion.Panel>
                            <Accordion.Body className="px-4 pb-4 pt-1">
                                <div className="relative rounded-lg bg-content2 border border-default-200 overflow-hidden flex flex-col">
                                    <div className="flex justify-between items-center px-4 py-2 bg-default-100/50 border-b border-default-200">
                                        <span className="text-xs font-mono text-default-500">bash</span>
                                        <Button
                                            size="sm"
                                            variant={copiedCommand ? "danger" : "primary"}
                                            onPress={handleCopyCommand}
                                            className="h-7 text-xs font-medium"
                                        >
                                            {copiedCommand ? 'Copied!' : 'Copy'}
                                        </Button>
                                    </div>
                                    <div className="p-4 overflow-x-auto">
                                        <code className="font-mono text-sm whitespace-nowrap text-foreground">
                                            <span className="text-primary">curl</span> -sL {baseUrl}/install.sh | <span className="text-primary">sudo</span> bash -s -- --token=<span className="text-warning">{apiKey}</span>
                                        </code>
                                    </div>
                                </div>
                            </Accordion.Body>
                        </Accordion.Panel>
                    </Accordion.Item>

                    {/* Method 2: Manual Update */}
                    <Accordion.Item 
                        key="manual-update" 
                        className={cn(
                            "group/item",
                            "first:[&_[data-slot=accordion-trigger]]:rounded-t-2xl",
                            "last:[&:not(:has([data-slot=accordion-trigger][aria-expanded='true']))_[data-slot=accordion-trigger]]:rounded-b-2xl"
                        )}
                    >
                        <Accordion.Heading>
                            <Accordion.Trigger className="hover:bg-default-200/50 group flex items-center gap-3 transition-none px-4 py-3">
                                <div className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl bg-secondary/10 text-secondary transition-[scale,rotate] duration-300 ease-out group-hover/item:scale-110 group-hover/item:rotate-6 group-hover/item:shadow-md">
                                    <Settings className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col gap-0 text-left flex-1">
                                    <span className="leading-5 font-medium text-foreground">Manual Configuration Update</span>
                                    <span className="leading-6 font-normal text-default-500">Update existing agent token and restart service</span>
                                </div>
                                <Accordion.Indicator className="text-default-400 [&>svg]:size-5">
                                    <ChevronDown />
                                </Accordion.Indicator>
                            </Accordion.Trigger>
                        </Accordion.Heading>

                        <Accordion.Panel>
                            <Accordion.Body className="px-4 pb-4 pt-1 space-y-4">
                                <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-default-200 bg-content2">
                                    <div className="flex flex-col truncate">
                                        <span className="text-xs text-default-500 mb-1">API Token</span>
                                        <code className="font-mono text-sm text-warning truncate">{apiKey}</code>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={copiedToken ? "danger" : "primary"}
                                        onPress={handleCopyToken}
                                        className="h-8 shrink-0 font-medium text-xs"
                                    >
                                        {copiedToken ? 'Copied!' : 'Copy'}
                                    </Button>
                                </div>

                                <div className="flex gap-3 w-full p-4 rounded-lg bg-default-50 text-default-600 border border-default-200">
                                    <Terminal className="w-5 h-5 shrink-0 mt-0.5 text-default-500" />
                                    <div className="text-sm leading-relaxed">
                                        <p>
                                            Replace the API token in your agent config file and restart the systemd service to apply changes:
                                        </p>
                                        <code className="block mt-2 font-mono text-xs bg-default-200 p-2 rounded border border-default-300 text-foreground">
                                            sudo systemctl restart biway-agent
                                        </code>
                                    </div>
                                </div>
                            </Accordion.Body>
                        </Accordion.Panel>
                    </Accordion.Item>
                </Accordion>
            </Card.Content>

            <Card.Footer className="px-6 pb-6 pt-0">
                <div className="flex gap-3 w-full p-4 rounded-lg bg-warning/10 border border-warning/20 text-warning-600">
                    <Info className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                        This token is valid for 24 hours. Keep it secure, as it provides direct registration access to your mesh network infrastructure.
                    </p>
                </div>
            </Card.Footer>
        </Card>
    );
}