import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';

const MyBooks = () => {
    const { user } = useAuth();
    const [borrowedBooks, setBorrowedBooks] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [membership, setMembership] = useState(null);

    useEffect(() => {
        fetchMembership();
    }, []);

    useEffect(() => {
        if (membership) {
            fetchBorrowedBooks();
            fetchReservations();
        }
    }, [membership]);

    const fetchMembership = async () => {
        try {
            const response = await axios.get('/api/library/memberships/my');
            setMembership(response.data);
        } catch (error) {
            console.error('Failed to fetch membership');
        }
    };

    const fetchBorrowedBooks = async () => {
        try {
            const response = await axios.get(`/api/library/issues/my`);
            setBorrowedBooks(response.data);
        } catch (error) {
            toast.error('Failed to fetch borrowed books');
        }
    };

    const fetchReservations = async () => {
        try {
            const response = await axios.get(`/api/library/reservations/my`);
            setReservations(response.data);
        } catch (error) {
            toast.error('Failed to fetch reservations');
        }
    };

    const cancelReservation = async (reservationId) => {
        setLoading(true);
        try {
            await axios.delete(`/api/library/reservations/${reservationId}`);
            toast.success('Reservation cancelled successfully');
            fetchReservations();
        } catch (error) {
            toast.error('Failed to cancel reservation');
        } finally {
            setLoading(false);
        }
    };

    const getDueStatus = (dueDate) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: 'Overdue', class: 'bg-red-100 text-red-800' };
        if (diffDays <= 2) return { text: 'Due Soon', class: 'bg-yellow-100 text-yellow-800' };
        return { text: 'On Time', class: 'bg-green-100 text-green-800' };
    };

    if (!membership) {
        return (
            <div className="p-6">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                You need a library membership to view your books.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">My Library</h2>

            {/* Membership Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Membership Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Membership Number</p>
                        <p className="text-lg font-medium">{membership.membership_number}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Valid Until</p>
                        <p className="text-lg font-medium">
                            {new Date(membership.valid_until).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Borrowed Books */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Borrowed Books</h3>
                    {borrowedBooks.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {borrowedBooks.map((issue) => {
                                        const status = getDueStatus(issue.due_date);
                                        return (
                                            <tr key={issue.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{issue.book.title}</div>
                                                    <div className="text-sm text-gray-500">by {issue.book.author}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(issue.issued_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(issue.due_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.class}`}>
                                                        {status.text}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500">You have no borrowed books.</p>
                    )}
                </div>
            </div>

            {/* Reservations */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">My Reservations</h3>
                    {reservations.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested At</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reservations.map((reservation) => (
                                        <tr key={reservation.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{reservation.book.title}</div>
                                                <div className="text-sm text-gray-500">by {reservation.book.author}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(reservation.requested_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(reservation.valid_until).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    reservation.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : reservation.status === 'approved'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {reservation.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {reservation.status === 'pending' && (
                                                    <button
                                                        onClick={() => cancelReservation(reservation.id)}
                                                        disabled={loading}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500">You have no active reservations.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyBooks; 