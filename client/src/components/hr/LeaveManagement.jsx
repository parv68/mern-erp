import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import axios from '../../utils/axios';
import { toast } from 'react-hot-toast';
import {
    Table, Button, Modal, Form, Input, Select,
    DatePicker, Tabs, Badge, Tag
} from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

const LeaveManagement = () => {
    const { user } = useAuth();
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [leaveApplications, setLeaveApplications] = useState([]);
    const [leaveBalance, setLeaveBalance] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchLeaveTypes();
        fetchLeaveApplications();
        if (user.role === 'teacher') {
            fetchLeaveBalance();
        }
    }, [user.role]);

    const fetchLeaveTypes = async () => {
        try {
            const response = await axios.get('/api/hr/leave-types');
            setLeaveTypes(response.data);
        } catch (error) {
            toast.error('Failed to fetch leave types');
        }
    };

    const fetchLeaveApplications = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/hr/leave-applications');
            setLeaveApplications(response.data);
        } catch (error) {
            toast.error('Failed to fetch leave applications');
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaveBalance = async () => {
        try {
            const response = await axios.get(`/api/hr/staff/${user.staff_id}/leave-balance`);
            setLeaveBalance(response.data);
        } catch (error) {
            toast.error('Failed to fetch leave balance');
        }
    };

    const handleSubmit = async (values) => {
        try {
            const { leave_dates, ...rest } = values;
            const payload = {
                ...rest,
                start_date: leave_dates[0].format('YYYY-MM-DD'),
                end_date: leave_dates[1].format('YYYY-MM-DD'),
                staff_id: user.staff_id
            };

            await axios.post('/api/hr/leave-applications', payload);
            toast.success('Leave application submitted successfully');
            setModalVisible(false);
            form.resetFields();
            fetchLeaveApplications();
            if (user.role === 'teacher') {
                fetchLeaveBalance();
            }
        } catch (error) {
            toast.error('Failed to submit leave application');
        }
    };

    const handleProcessLeave = async (leaveId, status) => {
        try {
            await axios.put(`/api/hr/leave-applications/${leaveId}`, {
                status,
                approved_by: user.id
            });
            toast.success(`Leave application ${status}`);
            fetchLeaveApplications();
        } catch (error) {
            toast.error('Failed to process leave application');
        }
    };

    const columns = [
        {
            title: 'Employee',
            dataIndex: 'staff_name',
            key: 'staff_name',
        },
        {
            title: 'Leave Type',
            dataIndex: 'leave_type',
            key: 'leave_type',
        },
        {
            title: 'Duration',
            key: 'duration',
            render: (_, record) => (
                <span>
                    {new Date(record.start_date).toLocaleDateString()} - 
                    {new Date(record.end_date).toLocaleDateString()}
                    <br />
                    ({record.days_requested} days)
                </span>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={
                    status === 'approved' ? 'green' :
                    status === 'rejected' ? 'red' : 'gold'
                }>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                user.role === 'admin' || user.role === 'hr' ? (
                    record.status === 'pending' && (
                        <div className="space-x-2">
                            <Button
                                type="primary"
                                icon={<CheckOutlined />}
                                onClick={() => handleProcessLeave(record.id, 'approved')}
                            >
                                Approve
                            </Button>
                            <Button
                                danger
                                icon={<CloseOutlined />}
                                onClick={() => handleProcessLeave(record.id, 'rejected')}
                            >
                                Reject
                            </Button>
                        </div>
                    )
                ) : null
            ),
        },
    ];

    const LeaveBalanceCard = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {leaveBalance.map(leave => (
                <div
                    key={leave.id}
                    className="bg-white p-4 rounded-lg shadow"
                >
                    <h3 className="font-semibold">{leave.name}</h3>
                    <div className="mt-2">
                        <p>Total: {leave.days_allowed} days</p>
                        <p>Used: {leave.days_used} days</p>
                        <p className="font-medium">
                            Remaining: {leave.days_remaining} days
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Leave Management</h1>
                {(user.role === 'teacher') && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setModalVisible(true)}
                    >
                        Apply for Leave
                    </Button>
                )}
            </div>

            {user.role === 'teacher' && <LeaveBalanceCard />}

            <Table
                columns={columns}
                dataSource={leaveApplications}
                loading={loading}
                rowKey="id"
            />

            <Modal
                title="Apply for Leave"
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
                        name="leave_type_id"
                        label="Leave Type"
                        rules={[{ required: true }]}
                    >
                        <Select>
                            {leaveTypes.map(type => (
                                <Select.Option key={type.id} value={type.id}>
                                    {type.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="leave_dates"
                        label="Leave Duration"
                        rules={[{ required: true }]}
                    >
                        <RangePicker className="w-full" />
                    </Form.Item>

                    <Form.Item
                        name="reason"
                        label="Reason"
                        rules={[{ required: true }]}
                    >
                        <Input.TextArea rows={4} />
                    </Form.Item>

                    <div className="flex justify-end space-x-4">
                        <Button onClick={() => setModalVisible(false)}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit">
                            Submit
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default LeaveManagement; 