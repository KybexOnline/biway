import { useState } from "react";
import {
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  useModalForm,
  useTable,
} from "@refinedev/antd";
import { GetListResponse, type BaseRecord } from "@refinedev/core";
import {
  Space,
  Form,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  Row,
  Col,
  Typography,
  Divider,
} from "antd";
import {
  CloudServerOutlined,
  GlobalOutlined,
  LockOutlined,
  TagOutlined,
} from "@ant-design/icons";

import { ServerShowModal, IServer } from "./show";

const { Text } = Typography;

interface ApiResponse {
  data: {
    items?: IServer[];
    total?: number;
    count?: number;
  } | IServer[];
}

export const ServerList = () => {
  const { tableProps } = useTable<IServer>({
    syncWithLocation: true,
    queryOptions: {
      select: (rawData: ApiResponse): GetListResponse<IServer> => {
        const responseData = rawData.data;

        const dataArray = Array.isArray(responseData)
          ? responseData
          : responseData?.items || [];

        const totalCount =
          Array.isArray(responseData)
            ? responseData.length
            : responseData?.total ?? responseData?.count ?? dataArray.length;

        return {
          data: dataArray,
          total: totalCount,
        };
      },
    },
  });

  const {
    modalProps: createModalProps,
    formProps: createFormProps,
    show: createModalShow,
  } = useModalForm<IServer>({
    action: "create",
  });

  const [showServerId, setShowServerId] = useState<number | null>(null);

  return (
    <List
      title="Servers"
      createButtonProps={{ onClick: () => createModalShow() }}
    >
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="id"
          title="ID"
          render={(id: string) => <Text code>{id.split("-")[0]}</Text>}
        />
        <Table.Column dataIndex="name" title="Name" />
        <Table.Column
          dataIndex="provider"
          title="Provider"
          render={(provider) => (
            <Tag color="blue" icon={<CloudServerOutlined />}>
              {provider?.toUpperCase()}
            </Tag>
          )}
        />
        <Table.Column
          dataIndex="public_ip"
          title="Public IP"
          render={(ip) => (
            <Space>
              <GlobalOutlined />
              <Text code>{ip}</Text>
            </Space>
          )}
        />
        <Table.Column
          dataIndex="private_ip"
          title="Private IP"
          render={(ip) => ip && <Text code>{ip}</Text>}
        />
        <Table.Column
          dataIndex="tags"
          title="Tags"
          render={(tags: string[]) =>
            tags?.map((tag) => (
              <Tag key={tag} color="geekblue">
                {tag}
              </Tag>
            ))
          }
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          render={(_, record: BaseRecord) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              <ShowButton
                hideText
                size="small"
                recordItemId={record.id}
                onClick={() => setShowServerId(record.id as number)}
              />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>

      {/* Show Modal */}
      <ServerShowModal
        id={showServerId}
        onClose={() => setShowServerId(null)}
      />

      {/* Create Modal */}
      <Modal
        {...createModalProps}
        width={650}
        centered
        destroyOnClose
        title={
          <Space align="center" style={{ marginBottom: 8 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: "8px",
                backgroundColor: "#e6f4ff",
                color: "#1677ff",
              }}
            >
              <CloudServerOutlined />
            </div>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Add New Server
            </Typography.Title>
          </Space>
        }
      >
        <Form {...createFormProps} layout="vertical" style={{ marginTop: 24 }}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Server Name"
                name="name"
                rules={[{ required: true, message: "Please enter a server name" }]}
              >
                <Input
                  prefix={<CloudServerOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                  placeholder="e.g., prod-web-server-01"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Public IP Address"
                name="public_ip"
                rules={[
                  { required: true, message: "Public IP is required" },
                  {
                    pattern: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
                    message: "Please enter a valid IPv4 address",
                  },
                ]}
              >
                <Input
                  prefix={<GlobalOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                  placeholder="e.g., 203.0.113.50"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Private IP Address" name="private_ip">
                <Input
                  prefix={<LockOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                  placeholder="e.g., 10.0.0.5"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider dashed style={{ margin: "12px 0 24px 0" }} />

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Infrastructure Provider" name="provider">
                <Select
                  size="large"
                  placeholder="Select a provider"
                  options={[
                    { label: "Amazon Web Services (AWS)", value: "aws" },
                    { label: "Google Cloud Platform (GCP)", value: "gcp" },
                    { label: "Microsoft Azure", value: "azure" },
                    { label: "DigitalOcean", value: "digitalocean" },
                    { label: "Hetzner", value: "hetzner" },
                    { label: "Linode", value: "linode" },
                    { label: "On-Premise", value: "on-premise" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Tags" name="tags">
                <Select
                  mode="tags"
                  size="large"
                  placeholder="e.g., production, frontend"
                  maxTagCount="responsive"
                  suffixIcon={<TagOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </List>
  );
};