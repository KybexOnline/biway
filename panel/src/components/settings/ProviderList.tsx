import { AlertDialog, Button, ColorSwatch, Description, Table } from "@heroui/react"
import AddProviderModal from "../AddProvider"
import { Icon } from "@iconify/react"
import { createDataProvider } from "../../api/dataProvider";
import { useEffect, useState } from "react";
import type { IProvider } from "../../utils/providers";

const settingProvider = createDataProvider('settings');

export function ProviderList() {

  const [providers, setProviders] = useState<IProvider[]>([]);

  const fetchProviders = async () => {
    try {
      const response = await settingProvider.customGet("/providers");
      const items: IProvider[] = response.items ?? [];
      setProviders(items);
    } catch (error) {
      console.log(error);
    }
  }


  const deleteProvider = async (code: string) => {
    try {
      const providerDataProvider = createDataProvider('settings/providers');
      await providerDataProvider.delete(code);
      fetchProviders();
    } catch (errro) {

    }
  }

  useEffect(() => {
    fetchProviders();
  }, [])


  return (
    <div className="flex min-w-[320px] flex-col gap-3 rounded-3xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">

        <div>
          <h3 className="text-base font-semibold text-foreground">Providers</h3>
          <Description id="password-description">
            Manage providers list
          </Description>
        </div>

        <div className="flex items-center gap-3">
          <AddProviderModal onSuccess={fetchProviders} />
        </div>
      </div>
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Provider list" className="h-[300px] min-w-[600px]">
            <Table.Header>
              <Table.Column isRowHeader>Name</Table.Column>
              <Table.Column>Code</Table.Column>
              <Table.Column>Color</Table.Column>
              <Table.Column>Actions</Table.Column>
            </Table.Header>
            <Table.Body>
              {providers.map((provider) => (
                <Table.Row>
                  <Table.Cell>{provider.name}</Table.Cell>
                  <Table.Cell>{provider.code}</Table.Cell>
                  <Table.Cell>
                    <ColorSwatch color={`${provider.color}`} size="xs" />
                  </Table.Cell>
                  <Table.Cell>

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
                              <AlertDialog.Heading>Delete this provider?</AlertDialog.Heading>
                            </AlertDialog.Header>

                            <AlertDialog.Body>
                              <p className="text-on-surface-variant">
                                Are you sure you want to delete the provider <strong className="text-on-surface">{provider.name}</strong>?
                              </p>
                            </AlertDialog.Body>

                            <AlertDialog.Footer>
                              <Button slot="close" variant="tertiary">
                                Cancel
                              </Button>
                              <Button slot="close" variant="danger" onClick={() => {
                                deleteProvider(provider.code)
                              }}>
                                Delete Provider
                              </Button>
                            </AlertDialog.Footer>
                          </AlertDialog.Dialog>
                        </AlertDialog.Container>
                      </AlertDialog.Backdrop>
                    </AlertDialog>

                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  )
}