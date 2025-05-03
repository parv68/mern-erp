import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';

const BookSearch = () => {
    const { user } = useAuth();
    const [books, setBooks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchParams, setSearchParams] = useState({
        query: '',
        category: '',
        available_only: false
    });
    const [membership, setMembership] = useState(null);

    useEffect(() => {
        fetchCategories();
        fetchMembership();
    }, []);

    useEffect(() => {
        handleSearch();
    }, [searchParams.category, searchParams.available_only]);

    const fetchCategories = async () => {
        try {
            const response = await axios.get('/api/library/categories');
            setCategories(response.data);
        } catch (error) {
            toast.error('Failed to fetch categories');
        }
    };

    const fetchMembership = async () => {
        try {
            const response = await axios.get('/api/library/memberships/my');
            setMembership(response.data);
        } catch (error) {
            console.error('Failed to fetch membership');
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/library/books/search', { params: searchParams });
            setBooks(response.data);
        } catch (error) {
            toast.error('Failed to search books');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSearchParams(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleReserve = async (bookId) => {
        if (!membership) {
            toast.error('You need a library membership to reserve books');
            return;
        }

        setLoading(true);
        try {
            await axios.post('/api/library/reservations', {
                book_id: bookId,
                membership_id: membership.id,
                valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
            toast.success('Book reserved successfully');
            handleSearch();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to reserve book');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Book Search</h2>

            {/* Search Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Search</label>
                        <input
                            type="text"
                            name="query"
                            value={searchParams.query}
                            onChange={handleInputChange}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search by title, author, or ISBN"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                            name="category"
                            value={searchParams.category}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                            <option value="">All Categories</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.name}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center mt-8">
                        <input
                            type="checkbox"
                            name="available_only"
                            checked={searchParams.available_only}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                            Show only available books
                        </label>
                    </div>
                    <div className="md:col-span-3">
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Results */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {books.map((book) => (
                        <div key={book.id} className="border rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900">{book.title}</h3>
                            <p className="text-sm text-gray-500">by {book.author}</p>
                            <p className="text-sm text-gray-500 mt-2">ISBN: {book.isbn}</p>
                            <div className="mt-2">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    book.available_copies > 0
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {book.available_copies} copies available
                                </span>
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={() => handleReserve(book.id)}
                                    disabled={loading || book.available_copies === 0}
                                    className={`w-full py-2 px-4 rounded-md ${
                                        book.available_copies > 0
                                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                                            : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    {book.available_copies > 0 ? 'Reserve' : 'Not Available'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                {books.length === 0 && !loading && (
                    <div className="text-center py-12 text-gray-500">
                        No books found matching your search criteria
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookSearch; 