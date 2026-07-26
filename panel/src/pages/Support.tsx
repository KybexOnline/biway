import { Icon } from "@iconify/react";
import { LifeBuoy, Mail, ExternalLink } from "lucide-react";

const SUPPORT_EMAIL = "support@kybex.online";
const CONTACT_URL = "https://kybex.online/contact";
const GITHUB_URL = "https://github.com/KybexOnline/biway";

function LinkButton({
  href,
  children,
  external = true,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="w-full h-10 px-4 inline-flex items-center justify-center rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:scale-[0.98] transition-all duration-150"
    >
      {children}
    </a>
  );
}

export default function SupportPage() {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 space-y-8 min-h-screen text-slate-900 dark:text-slate-100">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <LifeBuoy className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          Support
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Need help with Biway? Here's how to reach us.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact form / website */}
        <div className="rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
              <ExternalLink className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold">Contact Kybex</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1">
            Enterprise support and general inquiries through our official contact page.
          </p>
          <LinkButton href={CONTACT_URL}>Visit kybex.online/contact</LinkButton>
        </div>

        {/* Email support */}
        <div className="rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
              <Mail className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold">Email Support</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1">
            Prefer email? Send us the details directly and we'll get back to you.
          </p>
          <LinkButton href={`mailto:${SUPPORT_EMAIL}`} external={false}>
            {SUPPORT_EMAIL}
          </LinkButton>
        </div>

        {/* GitHub issues */}
        <div className="rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
              <Icon icon="mdi:github" className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold">GitHub Issues</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1">
            Found a bug or have a feature request? Open an issue on our repository.
          </p>
          <LinkButton href={GITHUB_URL}>KybexOnline/biway</LinkButton>
        </div>
      </div>
    </div>
  );
}