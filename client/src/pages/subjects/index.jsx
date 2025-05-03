import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { subjectService } from '../../services/subjectService';
import { useAuth } from '../../hooks/useAuth';
import SubjectForm from './SubjectForm';
import TeacherAllocationForm from './TeacherAllocationForm';

export default function Subjects() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Fetch subjects
  const { data: subjects, isLoading } = useQuery('subjects', subjectService.getSubjects);

  // Mutations
  const createSubjectMutation = useMutation(subjectService.createSubject, {
    onSuccess: () => {
      queryClient.invalidateQueries('subjects');
      setIsSubjectModalOpen(false);
      toast.success('Subject created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create subject');
    },
  });

  const updateSubjectMutation = useMutation(
    ({ id, data }) => subjectService.updateSubject(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('subjects');
        setIsSubjectModalOpen(false);
        setSelectedSubject(null);
        toast.success('Subject updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update subject');
      },
    }
  );

  const deleteSubjectMutation = useMutation(subjectService.deleteSubject, {
    onSuccess: () => {
      queryClient.invalidateQueries('subjects');
      toast.success('Subject deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete subject');
    },
  });

  const allocateTeacherMutation = useMutation(subjectService.allocateTeacher, {
    onSuccess: () => {
      queryClient.invalidateQueries('subjects');
      setIsAllocationModalOpen(false);
      toast.success('Teacher allocated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to allocate teacher');
    },
  });

  const handleCreateSubject = (data) => {
    createSubjectMutation.mutate(data);
  };

  const handleUpdateSubject = (data) => {
    updateSubjectMutation.mutate({ id: selectedSubject.id, data });
  };

  const handleDeleteSubject = (id) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      deleteSubjectMutation.mutate(id);
    }
  };

  const handleAllocateTeacher = (data) => {
    allocateTeacherMutation.mutate({
      ...data,
      subject_id: selectedSubject.id,
    });
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
          <h1 className="text-2xl font-semibold text-gray-900">Subjects</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all subjects and their teacher allocations.
          </p>
        </div>
        {user?.role === 'admin' && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={() => {
                setSelectedSubject(null);
                setIsSubjectModalOpen(true);
              }}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Subject
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {subjects?.map((subject) => (
          <div
            key={subject.id}
            className="bg-white shadow rounded-lg overflow-hidden"
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {subject.name}
                  </h3>
                  <p className="text-sm text-gray-500">{subject.code}</p>
                </div>
                {user?.role === 'admin' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedSubject(subject);
                        setIsSubjectModalOpen(true);
                      }}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(subject.id)}
                      className="text-red-400 hover:text-red-500"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {subject.description || 'No description'}
              </p>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">Teachers</h4>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        setSelectedSubject(subject);
                        setIsAllocationModalOpen(true);
                      }}
                      className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
                    >
                      <UserPlusIcon className="h-4 w-4 mr-1" />
                      Allocate
                    </button>
                  )}
                </div>
                <div className="mt-2">
                  <div className="text-sm text-gray-500">
                    {subject.teacher_count} teacher{subject.teacher_count !== 1 && 's'} allocated
                  </div>
                  <div className="text-sm text-gray-500">
                    Teaching in {subject.class_count} class{subject.class_count !== 1 && 'es'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Subject Modal */}
      <SubjectForm
        isOpen={isSubjectModalOpen}
        onClose={() => {
          setIsSubjectModalOpen(false);
          setSelectedSubject(null);
        }}
        onSubmit={selectedSubject ? handleUpdateSubject : handleCreateSubject}
        initialData={selectedSubject}
      />

      {/* Teacher Allocation Modal */}
      <TeacherAllocationForm
        isOpen={isAllocationModalOpen}
        onClose={() => {
          setIsAllocationModalOpen(false);
          setSelectedSubject(null);
        }}
        onSubmit={handleAllocateTeacher}
        subjectName={selectedSubject?.name}
      />
    </div>
  );
} 