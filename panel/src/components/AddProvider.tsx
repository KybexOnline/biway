import {
  Modal,
  Button,
  TextField,
  Label,
  Input,
  ColorField,
  ColorSwatchPicker,
  Alert
} from '@heroui/react';
import { Plus, Palette } from 'lucide-react';
import { useState } from 'react';
import { createDataProvider } from '../api/dataProvider';

interface AddProviderModalProp {
  onSuccess?: () => void
}


export default function AddProviderModal({ onSuccess }: AddProviderModalProp) {
  const [isOpen, setIsOpen] = useState(false);

  const [alert, setAlert] = useState<string | undefined>();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    color: '#D946EF' as string,
  });

  const colors = ["#F43F5E", "#D946EF", "#8B5CF6", "#3B82F6", "#06B6D4", "#10B981", "#84CC16"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(undefined);
    const providerDataProvider = createDataProvider("settings/providers");
    const resp = await providerDataProvider.create(formData);
    if (resp.success === true) {
      onSuccess?.()
      setFormData({ name: '', code: '', color: colors[0] });
      setIsOpen(false);
    } else {
      setAlert(resp.errorMessage);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button className="flex items-center px-4 py-2 bg-primary text-on-primary rounded-md text-sm font-medium hover:brightness-110 transition-colors" onPress={() => setIsOpen(true)}>
        <Plus className="size-4" />
        Add Provider
      </Button>

      <Modal.Backdrop>
        <Modal.Container placement="center">
          <Modal.Dialog className="sm:max-w-lg w-full">
            <Modal.CloseTrigger />

            <Modal.Header>
              <Modal.Icon className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Palette className="size-5" />
              </Modal.Icon>
              <div>
                <Modal.Heading>Add New Provider</Modal.Heading>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure a new cloud or service provider
                </p>
              </div>
            </Modal.Header>

            <Modal.Body className="p-6 space-y-6">
              {alert && 
                <Alert status="danger">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Unable to create new Provider</Alert.Title>
                    <Alert.Description>
                      {alert}
                    </Alert.Description>
                  </Alert.Content>
                </Alert>
              }

              <form onSubmit={handleSubmit} className="space-y-5" id="add-provider-form">

                <TextField isRequired>
                  <Label>Provider Name</Label>
                  <Input
                    placeholder="e.g. Amazon Web Services"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </TextField>

                <TextField isRequired>
                  <Label>Provider Code</Label>
                  <Input
                    placeholder="e.g. aws, azure, gcp"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toLowerCase().trim()
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Short identifier (lowercase recommended)
                  </p>
                </TextField>

                <ColorField>
                  <Label>Color</Label>
                  <ColorSwatchPicker value={formData.color} onChange={(color) => {
                    setFormData({
                      ...formData,
                      color: color.toString("hex")
                    })
                  }}>
                    {colors.map((color) => (
                      <ColorSwatchPicker.Item key={color} color={color}>
                        <ColorSwatchPicker.Swatch />
                        <ColorSwatchPicker.Indicator />
                      </ColorSwatchPicker.Item>
                    ))}
                  </ColorSwatchPicker>
                </ColorField>

              </form>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="secondary" onPress={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="add-provider-form" variant="primary">
                Add Provider
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}