import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CalendarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { user, hasRole, logout } = useAuth();

  const navigationItems = [
    {
      title: 'Dashboard',
      icon: <HomeIcon className="h-6 w-6" />,
      path: '/',
      roles: ['admin', 'teacher', 'student', 'parent']
    },
    {
      title: 'Academic',
      icon: <AcademicCapIcon className="h-6 w-6" />,
      path: '#',
      roles: ['admin', 'teacher', 'student', 'parent'],
      submenu: [
        {
          title: 'Classes',
          path: '/academic/classes',
          roles: ['admin', 'teacher']
        },
        {
          title: 'Timetable',
          path: '/academic/timetable',
          roles: ['admin', 'teacher', 'student', 'parent']
        },
        {
          title: 'Study Materials',
          path: '/academic/study-materials',
          roles: ['admin', 'teacher', 'student', 'parent']
        },
        {
          title: 'Activities',
          path: '/academic/activities',
          roles: ['admin', 'teacher', 'student']
        }
      ]
    },
    {
      title: 'Student Management',
      icon: <UserGroupIcon className="h-6 w-6" />,
      path: '#',
      roles: ['admin', 'teacher'],
      submenu: [
        {
          title: 'Admission',
          path: '/students/admission',
          roles: ['admin']
        },
        {
          title: 'Attendance',
          path: '/students/attendance',
          roles: ['admin', 'teacher']
        },
        {
          title: 'Leave Applications',
          path: '/students/leave',
          roles: ['admin', 'teacher']
        }
      ]
    },
    {
      title: 'Examination',
      icon: <ClipboardDocumentListIcon className="h-6 w-6" />,
      path: '#',
      roles: ['admin', 'teacher', 'student', 'parent'],
      submenu: [
        {
          title: 'Manage Exams',
          path: '/exams/manage',
          roles: ['admin']
        },
        {
          title: 'Assessments',
          path: '/exams/assessments',
          roles: ['teacher']
        },
        {
          title: 'Results',
          path: '/exams/results',
          roles: ['student', 'parent']
        }
      ]
    },
    {
      title: 'Library',
      icon: <BookOpenIcon className="h-6 w-6" />,
      path: '#',
      roles: ['admin', 'librarian', 'teacher', 'student'],
      submenu: [
        {
          title: 'Book Management',
          path: '/library/books',
          roles: ['admin', 'librarian']
        },
        {
          title: 'Issue/Return',
          path: '/library/issue-return',
          roles: ['admin', 'librarian']
        },
        {
          title: 'Book Search',
          path: '/library/search',
          roles: ['admin', 'librarian', 'teacher', 'student']
        },
        {
          title: 'My Books',
          path: '/library/my-books',
          roles: ['teacher', 'student']
        }
      ]
    },
    {
      title: 'Finance',
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      path: '#',
      roles: ['admin', 'accountant', 'teacher', 'student', 'parent'],
      submenu: [
        {
          title: 'Fee Management',
          path: '/finance/fees',
          roles: ['admin', 'accountant']
        },
        {
          title: 'Salary Management',
          path: '/finance/salary',
          roles: ['admin', 'accountant']
        },
        {
          title: 'Financial Reports',
          path: '/finance/reports',
          roles: ['admin', 'accountant']
        },
        {
          title: 'My Finances',
          path: '/finance/student',
          roles: ['student', 'parent']
        }
      ]
    },
    {
      title: 'User Management',
      icon: <ShieldCheckIcon className="h-6 w-6" />,
      path: '#',
      roles: ['admin'],
      submenu: [
        {
          title: 'Manage Users',
          path: '/admin/users',
          roles: ['admin']
        },
        {
          title: 'Roles & Permissions',
          path: '/admin/roles',
          roles: ['admin']
        },
        {
          title: 'Audit Logs',
          path: '/admin/audit-logs',
          roles: ['admin']
        }
      ]
    },
    {
      title: 'Settings',
      icon: <Cog6ToothIcon className="h-6 w-6" />,
      path: '/settings',
      roles: ['admin']
    },
    {
      title: 'My Profile',
      icon: <UserIcon className="h-6 w-6" />,
      path: '/profile',
      roles: ['admin', 'teacher', 'student', 'parent', 'librarian', 'accountant']
    }
  ];

  // Filter navigation items based on user role
  const filteredItems = navigationItems.filter(item => {
    // Check if the user has one of the required roles for this item
    return hasRole && item.roles.some(role => hasRole(role));
  });

  const handleLogout = () => {
    logout();
  };

  const closeMobileMenu = () => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="h-full bg-gray-800 text-white">
      <div className="p-4 flex flex-col h-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">School ERP</h2>
        </div>
        
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {filteredItems.map((item, index) => (
              <li key={index}>
                {item.submenu ? (
                  <div className="mb-2">
                    <div className="flex items-center px-3 py-2 text-gray-300 font-medium">
                      <span className="mr-3">{item.icon}</span>
                      <span>{item.title}</span>
                    </div>
                    <ul className="ml-8 space-y-1 mt-1">
                      {item.submenu
                        .filter(subitem => hasRole && subitem.roles.some(role => hasRole(role)))
                        .map((subitem, subindex) => (
                          <li key={subindex}>
                            <NavLink
                              to={subitem.path}
                              className={({ isActive }) =>
                                `block px-3 py-2 rounded-md ${
                                  isActive
                                    ? 'bg-gray-700 text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }`
                              }
                              onClick={closeMobileMenu}
                            >
                              {subitem.title}
                            </NavLink>
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-md ${
                        isActive
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`
                    }
                    onClick={closeMobileMenu}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.title}</span>
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center px-3 py-2 w-full text-gray-300 hover:bg-gray-700 hover:text-white rounded-md"
          >
            <ArrowLeftOnRectangleIcon className="h-6 w-6 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 