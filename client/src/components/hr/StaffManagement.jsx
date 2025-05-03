import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import axios from '../../utils/axios';
import { toast } from 'react-hot-toast';
import {
    Table, Button, Modal, Form, Input, Select,
    DatePicker, Upload, message
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';

const StaffManagement = () => {
    const { user } = useAuth();
    const [staffRecords, setStaffRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchStaffRecords();
    }, []);

    const fetchStaffRecords = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/hr/staff');
            setStaffRecords(response.data);
        } catch (error) {
            toast.error('Failed to fetch staff records');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            if (editingStaff) {
                await axios.put(`/api/hr/staff/${editingStaff.id}`, values);
                toast.success('Staff record updated successfully');
            } else {
                await axios.post('/api/hr/staff', values);
                toast.success('Staff record created successfully');
            }
            setModalVisible(false);
            form.resetFields();
            fetchStaffRecords();
        } catch (error) {
            toast.error('Failed to save staff record');
        }
    };

    const handleDelete = async (staffId) => {
        try {
            await axios.delete(`/api/hr/staff/${staffId}`);
            toast.success('Staff record deleted successfully');
            fetchStaffRecords();
        } catch (error) {
            toast.error('Failed to delete staff record');
        }
    };

    const columns = [
        {
            title: 'Employee ID',
            dataIndex: 'employee_id',
            key: 'employee_id',
        },
        {
            title: 'Name',
            key: 'name',
            render: (_, record) => `${record.first_name} ${record.last_name}`,
        },
        {
            title: 'Department',
            dataIndex: 'department',
            key: 'department',
        },
        {
            title: 'Designation',
            dataIndex: 'designation',
            key: 'designation',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <div className="space-x-2">
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingStaff(record);
                            form.setFieldsValue(record);
                            setModalVisible(true);
                        }}
                    >
                        Edit
                    </Button>
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id)}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Staff Management</h1>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setEditingStaff(null);
                        form.resetFields();
                        setModalVisible(true);
                    }}
                >
                    Add Staff
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={staffRecords}
                loading={loading}
                rowKey="id"
            />

            <Modal
                title={editingStaff ? 'Edit Staff Record' : 'Add Staff Record'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="employee_id"
                        label="Employee ID"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="department"
                        label="Department"
                        rules={[{ required: true }]}
                    >
                        <Select>
                            <Select.Option value="Academic">Academic</Select.Option>
                            <Select.Option value="Administration">Administration</Select.Option>
                            <Select.Option value="Finance">Finance</Select.Option>
                            <Select.Option value="HR">HR</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="designation"
                        label="Designation"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="joining_date"
                        label="Joining Date"
                        rules={[{ required: true }]}
                    >
                        <DatePicker className="w-full" />
                    </Form.Item>

                    <Form.Item
                        name="contract_type"
                        label="Contract Type"
                        rules={[{ required: true }]}
                    >
                        <Select>
                            <Select.Option value="permanent">Permanent</Select.Option>
                            <Select.Option value="contract">Contract</Select.Option>
                            <Select.Option value="probation">Probation</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="salary"
                        label="Salary"
                        rules={[{ required: true }]}
                    >
                        <Input type="number" />
                    </Form.Item>

                    <Form.Item
                        name="bank_account"
                        label="Bank Account"
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="emergency_contact"
                        label="Emergency Contact"
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="documents"
                        label="Documents"
                    >
                        <Upload
                            action="/api/upload"
                            listType="picture"
                            maxCount={5}
                            onChange={({ file }) => {
                                if (file.status === 'done') {
                                    message.success(`${file.name} uploaded successfully`);
                                } else if (file.status === 'error') {
                                    message.error(`${file.name} upload failed`);
                                }
                            }}
                        >
                            <Button icon={<UploadOutlined />}>Upload Documents</Button>
                        </Upload>
                    </Form.Item>

                    <div className="flex justify-end space-x-4">
                        <Button onClick={() => setModalVisible(false)}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit">
                            {editingStaff ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default StaffManagement; 