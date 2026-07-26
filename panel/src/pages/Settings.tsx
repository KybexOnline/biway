
import { Accordion } from "@heroui/react";
import { ProviderList } from "../components/settings/ProviderList";
import { ChevronDown } from "lucide-react";


export default function SettingsPage() {

  const parts = [
    {
      items: [
        {
          content: <ProviderList />,
          title: "Manage providers list",
        },
      ],
      title: "General",
    },
  ];


  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="flex flex-col gap-2">
        {parts.map((part) => (
        <div key={part.title}>
          <p className="text-md mb-2 font-medium text-muted">{part.title}</p>
          <Accordion className="w-full" variant="surface">
            {part.items.map((item, index) => (
              <Accordion.Item key={index}>
                <Accordion.Heading>
                  <Accordion.Trigger>
                    {item.title}
                    <Accordion.Indicator>
                      <ChevronDown />
                    </Accordion.Indicator>
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body>{item.content}</Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      ))}
      </div>
      {/* <Tabs className="w-full max-w-md" variant="secondary">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Options">
            <Tabs.Tab id="general">
              <Settings size={18}/>
                General
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="security">
              <Shield size={18} />
              Analytics
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel className="pt-4" id="general">
          <p>View your project overview and recent activity.</p>
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="security">
          <p>Track your metrics and analyze performance data.</p>
        </Tabs.Panel>
      </Tabs> */}
    </div>
  );
}
