import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { PlusSquare, Info, Server, Tag, Lock, Globe, AlertCircle, X, Rocket, Check } from 'lucide-react';
import clsx from 'clsx';
import { createDataProvider } from '../api/dataProvider';
import { Tooltip } from '@heroui/react';
import type { IServerNode } from '../models/servers';
import AgentInstallationCard from './AgentInstallationCard'; 
import { readProvidersCache, writeProvidersCache, type IProvider } from '../utils/providers';

type CreateNodeFormData = {
  name: string;
  provider: string;
  tags: string[];
  private_ip: string;
  public_ip: string;
};

const nodeProvider = createDataProvider("servers");
const settingProvider = createDataProvider("settings");

// A non-cloud option that isn't part of the "providers" setting, always
// appended at the end of the list.
const ONPREM_OPTION: IProvider = { code: "onprem", name: "On-Premises / Bare Metal", color: "888888" };

// Shown while the real list is loading, or if the fetch/cache both fail.
const FALLBACK_PROVIDERS: IProvider[] = [
  { code: "aws", name: "Amazon Web Services (AWS)", color: "FF9900" },
  { code: "gcp", name: "Google Cloud Platform", color: "4285F4" },
  { code: "azure", name: "Microsoft Azure", color: "0089D6" },
  { code: "digitalocean", name: "DigitalOcean", color: "0080FF" },
  { code: "hetzner", name: "Hetzner", color: "D50C2D" },
];

export default function CreateNodeModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void ; onSuccess?: () => void}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  
  const [apiToken, setApiToken] = useState<string | null>(null);

  const [providers, setProviders] = useState<IProvider[]>(FALLBACK_PROVIDERS);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
    watch,
    reset,
  } = useForm<CreateNodeFormData>({
    defaultValues: {
      name: "",
      provider: "aws",
      tags: [],
      private_ip: "",
      public_ip: "",
    },
  });

  const tags = watch("tags");

  useEffect(() => {
    const cached = readProvidersCache();
    if (cached) {
      setProviders(cached);
      return;
    }

    (async () => {
      try {
        const response = await settingProvider.customGet("/providers");
        const items: IProvider[] = response.items ?? [];
        if (items.length > 0) {
          writeProvidersCache(items);
          setProviders(items);
        }
      } catch (error) {
        console.log(error);
        // keep FALLBACK_PROVIDERS on failure
      }
    })();
  }, []);

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setValue("tags", [...tags, trimmed], { shouldValidate: true });
    }
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setValue("tags", tags.filter(tag => tag !== tagToRemove), { shouldValidate: true });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const onSubmit = async (data: CreateNodeFormData) => {
    setIsSubmitting(true);
    const resp = await nodeProvider.create<IServerNode>(data);
    
    if (resp.success === true) {
      reset();
      setTagInput("");
      setIsSubmitting(false);
      
      if (resp.data?.api_key) {
        setApiToken(resp.data.api_key);
      }
      
      onSuccess?.();
    } else {
      if (resp.errorCode === "VALIDATION_FAILED") {
        resp.errorDetails.map((error: any) => {
          const key = error.field;
          const msg = error.message;
          setError(key, {
            type: "server",
            message: msg
          });
        })
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    setApiToken(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container border border-outline-variant rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full max-w-2xl flex flex-col overflow-hidden relative transition-all">

        {/* Dynamic Header */}
        <div className="px-6 py-5 border-b border-outline-variant/50 flex justify-between items-center bg-surface-container/50">
          <div className="flex items-center gap-3">
            <div className={clsx(
              "w-8 h-8 rounded-md border flex items-center justify-center",
              apiToken 
                ? "bg-success/10 border-success/20 text-success" 
                : "bg-primary/10 border-primary/20 text-primary"
            )}>
              {apiToken ? <Check className="w-5 h-5" /> : <PlusSquare className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-lg font-sans font-semibold text-on-surface tracking-tight">
                {apiToken ? "Server Provisioned Successfully" : "Create Server"}
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {apiToken ? "Your node is ready. Follow the instructions to link it." : "Provision a new node in the mesh network."}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high p-1.5 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="bg-surface-container overflow-y-auto max-h-[70vh]">
          {!apiToken ? (
            <form id="create-node-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              {/* Server Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-on-surface mb-1.5">
                  Server Name <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <Server className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-4 h-4 pointer-events-none" />
                  <input
                    id="name"
                    {...register("name", { required: "Server name is required" })}
                    placeholder="e.g., prod-db-01"
                    className={clsx(
                      "w-full bg-surface-container-lowest border text-on-surface text-sm rounded-md py-2 pl-9 pr-3 font-mono",
                      errors.name ? "border-error focus:ring-error" : "border-primary focus:ring-primary"
                    )}
                  />
                </div>
                {errors.name && <p className="text-error text-xs mt-1.5">{errors.name.message}</p>}
              </div>

              {/* Provider */}
              <div>
                <label htmlFor="provider" className="block text-sm font-medium text-on-surface-variant mb-1.5">
                  Infrastructure Provider
                </label>
                <select
                  id="provider"
                  {...register("provider")}
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm rounded-md py-2 pl-3 pr-10 focus:border-primary focus:ring-primary"
                >
                  {providers.map((p) => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                  <option value={ONPREM_OPTION.code}>{ONPREM_OPTION.name}</option>
                </select>
              </div>

              {/* Tags (Multiple) */}
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Tags</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 text-on-surface-variant w-4 h-4 pointer-events-none" />

                  <div className="min-h-[42px] w-full bg-surface-container-lowest border border-outline-variant rounded-md focus-within:border-primary focus-within:ring-1 focus-within:ring-primary p-1 pl-9 flex flex-wrap gap-1.5 items-center">
                    {tags.map((tag, index) => (
                      <div
                        key={index}
                        className="bg-surface-container-high text-on-surface text-xs px-2.5 py-1 rounded-md flex items-center gap-1 border border-outline-variant"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-on-surface-variant hover:text-error transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onBlur={addTag}
                      placeholder={tags.length === 0 ? "e.g. production, database (press Enter)" : ""}
                      className="flex-1 bg-transparent text-sm outline-none min-w-[120px] py-1 placeholder:text-on-surface-variant/50"
                    />
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">Type and press Enter or comma to add tags</p>
              </div>

              {/* Private IP */}
              <div>
                <label 
                  htmlFor="private_ip" 
                  className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant mb-1.5"
                >
                  Private IP
                  
                  <Tooltip delay={0}>
                    <Tooltip.Trigger>
                      <button
                        type="button"
                        aria-label="More information about Private IP"
                        className="text-on-surface-variant/60 hover:text-on-surface-variant transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full p-0.5 -mr-0.5"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip.Trigger>

                    <Tooltip.Content placement="bottom" showArrow>
                      <p className="text-sm">
                        If left blank, Biway will automatically select and assign an available private IP address.
                      </p>
                    </Tooltip.Content>
                  </Tooltip>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4 pointer-events-none" />
                  <input
                    id="private_ip"
                    type="text"
                    {...register("private_ip")}
                    placeholder="10.0.0.5"
                    className={clsx(
                      "w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm rounded-md py-2 pl-9 pr-3 font-mono placeholder:text-on-surface-variant/40",
                      errors.private_ip ? "border-error focus:ring-error" : "border-primary focus:ring-primary"
                    )}
                  />
                </div>
                {errors.private_ip && (
                  <p className="text-error text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.private_ip.message}
                  </p>
                )}
              </div>

              {/* Public IP */}
              <div>
                <label htmlFor="public_ip" className="block text-sm font-medium text-on-surface mb-1.5">
                  Public IPv4 Address <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                  <input
                    id="public_ip"
                    type="text"
                    {...register("public_ip", {
                      required: "A valid public IP is required",
                      pattern: {
                        value: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
                        message: "Please enter a valid IPv4 address",
                      },
                    })}
                    placeholder="0.0.0.0"
                    className={clsx(
                      "w-full bg-surface-container-lowest border text-on-surface text-sm rounded-md py-2 pl-9 pr-10 font-mono",
                      errors.public_ip ? "border-error focus:ring-error" : "border-primary focus:ring-primary"
                    )}
                  />
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                </div>
                {errors.public_ip && (
                  <p className="text-error text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.public_ip.message}
                  </p>
                )}
              </div>
            </form>
          ) : (
            <div className="p-6 flex justify-center bg-content2/30">
              {/* Show the card when we have an API token */}
              <AgentInstallationCard apiKey={apiToken} />
            </div>
          )}
        </div>

        {/* Dynamic Footer */}
        <div className="px-6 py-4 border-t border-outline-variant/50 bg-surface-container-low flex justify-end gap-3 rounded-b-xl">
          {!apiToken ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-on-surface-variant bg-transparent border border-outline hover:border-outline-variant hover:bg-surface-container hover:text-on-surface rounded-md transition-all"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="create-node-form"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-on-surface bg-surface-container-highest border border-outline-variant hover:bg-primary hover:text-on-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-all flex items-center gap-2"
              >
                <Rocket className="w-4 h-4" />
                {isSubmitting ? "Deploying..." : "Deploy Server"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-sm font-medium bg-primary text-on-primary hover:bg-primary-fixed-dim rounded-md transition-all flex items-center gap-2"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}