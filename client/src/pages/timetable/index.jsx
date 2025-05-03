import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { timetableService } from '../../services/timetableService';
import { classService } from '../../services/classService';
import { useAuth } from '../../hooks/useAuth';
import TimetableSlotForm from './TimetableSlotForm';
import SubstitutionForm from './SubstitutionForm';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00'
];

export default function Timetable() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isSubstitutionModalOpen, setIsSubstitutionModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  // Fetch classes
  const { data: classes } = useQuery('classes', classService.getClasses);

  // Fetch timetable
  const { data: timetable, isLoading } = useQuery(
    ['timetable', selectedClass?.id, selectedSection?.id],
    () =>
      timetableService.getTimetable({
        class_id: selectedClass?.id,
        section_id: selectedSection?.id,
        academic_year: academicYear,
      }),
    {
      enabled: !!(selectedClass?.id && selectedSection?.id),
    }
  );

  // Mutations
  const createSlotMutation = useMutation(timetableService.createTimetableSlot, {
    onSuccess: () => {
      queryClient.invalidateQueries(['timetable', selectedClass?.id, selectedSection?.id]);
      setIsSlotModalOpen(false);
      toast.success('Timetable slot created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create timetable slot');
    },
  });

  const updateSlotMutation = useMutation(
    ({ id, data }) => timetableService.updateTimetableSlot(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['timetable', selectedClass?.id, selectedSection?.id]);
        setIsSlotModalOpen(false);
        setSelectedSlot(null);
        toast.success('Timetable slot updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update timetable slot');
      },
    }
  );

  const deleteSlotMutation = useMutation(timetableService.deleteTimetableSlot, {
    onSuccess: () => {
      queryClient.invalidateQueries(['timetable', selectedClass?.id, selectedSection?.id]);
      toast.success('Timetable slot deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete timetable slot');
    },
  });

  const handleCreateSlot = (data) => {
    createSlotMutation.mutate({
      ...data,
      class_id: selectedClass.id,
      section_id: selectedSection.id,
      academic_year,
    });
  };

  const handleUpdateSlot = (data) => {
    updateSlotMutation.mutate({
      id: selectedSlot.id,
      data: {
        ...data,
        class_id: selectedClass.id,
        section_id: selectedSection.id,
        academic_year,
      },
    });
  };

  const handleDeleteSlot = (id) => {
    if (window.confirm('Are you sure you want to delete this timetable slot?')) {
      deleteSlotMutation.mutate(id);
    }
  };

  const getSlotsByTime = (day, time) => {
    if (!timetable) return [];
    return timetable.filter(
      (slot) =>
        slot.day_of_week === DAYS.indexOf(day) + 1 &&
        slot.start_time === time
    );
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
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Timetable</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage class schedules and teacher allocations
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-4">
          <select
            className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            value={selectedClass?.id || ''}
            onChange={(e) => {
              const classItem = classes?.find((c) => c.id === Number(e.target.value));
              setSelectedClass(classItem);
              setSelectedSection(null);
            }}
          >
            <option value="">Select Class</option>
            {classes?.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>

          <select
            className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            value={selectedSection?.id || ''}
            onChange={(e) => {
              const section = selectedClass?.sections?.find(
                (s) => s.id === Number(e.target.value)
              );
              setSelectedSection(section);
            }}
            disabled={!selectedClass}
          >
            <option value="">Select Section</option>
            {selectedClass?.sections?.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>

          {user?.role === 'admin' && selectedClass && selectedSection && (
            <button
              type="button"
              onClick={() => {
                setSelectedSlot(null);
                setIsSlotModalOpen(true);
              }}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Slot
            </button>
          )}
        </div>
      </div>

      {selectedClass && selectedSection ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Time
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {TIME_SLOTS.map((time) => (
                <tr key={time}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {time}
                  </td>
                  {DAYS.map((day) => {
                    const slots = getSlotsByTime(day, time);
                    return (
                      <td
                        key={`${day}-${time}`}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {slots.map((slot) => (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div>
                              <div className="font-medium text-gray-900">
                                {slot.subject_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {slot.teacher_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                Room: {slot.room_number}
                              </div>
                            </div>
                            {user?.role === 'admin' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedSlot(slot);
                                    setIsSlotModalOpen(true);
                                  }}
                                  className="text-gray-400 hover:text-gray-500"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSlot(slot.id)}
                                  className="text-red-400 hover:text-red-500"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-12">
          Please select a class and section to view the timetable
        </div>
      )}

      {/* Timetable Slot Modal */}
      <TimetableSlotForm
        isOpen={isSlotModalOpen}
        onClose={() => {
          setIsSlotModalOpen(false);
          setSelectedSlot(null);
        }}
        onSubmit={selectedSlot ? handleUpdateSlot : handleCreateSlot}
        initialData={selectedSlot}
      />

      {/* Substitution Modal */}
      <SubstitutionForm
        isOpen={isSubstitutionModalOpen}
        onClose={() => {
          setIsSubstitutionModalOpen(false);
          setSelectedSlot(null);
        }}
        slot={selectedSlot}
      />
    </div>
  );
} 