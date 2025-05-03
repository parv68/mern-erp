import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { classService } from '../../services/classService';
import { useAuth } from '../../hooks/useAuth';
import ClassForm from './ClassForm';
import SectionForm from './SectionForm';

export default function Classes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  // Fetch classes
  const { data: classes, isLoading } = useQuery('classes', classService.getClasses);

  // Mutations
  const createClassMutation = useMutation(classService.createClass, {
    onSuccess: () => {
      queryClient.invalidateQueries('classes');
      setIsClassModalOpen(false);
      toast.success('Class created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create class');
    },
  });

  const updateClassMutation = useMutation(
    ({ id, data }) => classService.updateClass(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('classes');
        setIsClassModalOpen(false);
        setSelectedClass(null);
        toast.success('Class updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update class');
      },
    }
  );

  const deleteClassMutation = useMutation(classService.deleteClass, {
    onSuccess: () => {
      queryClient.invalidateQueries('classes');
      toast.success('Class deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete class');
    },
  });

  const createSectionMutation = useMutation(
    ({ classId, data }) => classService.createSection(classId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('classes');
        setIsSectionModalOpen(false);
        toast.success('Section created successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create section');
      },
    }
  );

  const handleCreateClass = (data) => {
    createClassMutation.mutate(data);
  };

  const handleUpdateClass = (data) => {
    updateClassMutation.mutate({ id: selectedClass.id, data });
  };

  const handleDeleteClass = (id) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      deleteClassMutation.mutate(id);
    }
  };

  const handleCreateSection = (data) => {
    createSectionMutation.mutate({ classId: selectedClass.id, data });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Classes</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all classes and their sections in the school.
          </p>
        </div>
        {user?.role === 'admin' && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={() => {
                setSelectedClass(null);
                setIsClassModalOpen(true);
              }}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Class
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {classes?.map((classItem) => (
          <div
            key={classItem.id}
            className="bg-white shadow rounded-lg overflow-hidden"
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {classItem.name}
                </h3>
                {user?.role === 'admin' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedClass(classItem);
                        setIsClassModalOpen(true);
                      }}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClass(classItem.id)}
                      className="text-red-400 hover:text-red-500"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {classItem.description || 'No description'}
              </p>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">Sections</h4>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        setSelectedClass(classItem);
                        setIsSectionModalOpen(true);
                      }}
                      className="text-sm text-primary-600 hover:text-primary-500"
                    >
                      Add Section
                    </button>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {classItem.sections?.map((section) => (
                    <div
                      key={section.id}
                      className="px-2 py-1 text-sm bg-gray-100 rounded"
                    >
                      {section.name}
                      <span className="ml-1 text-xs text-gray-500">
                        ({section.student_count})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Class Modal */}
      <ClassForm
        isOpen={isClassModalOpen}
        onClose={() => {
          setIsClassModalOpen(false);
          setSelectedClass(null);
        }}
        onSubmit={selectedClass ? handleUpdateClass : handleCreateClass}
        initialData={selectedClass}
      />

      {/* Section Modal */}
      <SectionForm
        isOpen={isSectionModalOpen}
        onClose={() => {
          setIsSectionModalOpen(false);
          setSelectedClass(null);
        }}
        onSubmit={handleCreateSection}
        className={selectedClass?.name}
      />
    </div>
  );
} 