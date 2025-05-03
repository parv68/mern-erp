import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useQuery } from 'react-query';
import { subjectService } from '../../services/subjectService';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00'
];

export default function TimetableSlotForm({ isOpen, onClose, onSubmit, initialData }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      day_of_week: '',
      start_time: '',
      end_time: '',
      subject_id: '',
      teacher_id: '',
      room_number: '',
    },
  });

  // Fetch subjects
  const { data: subjects } = useQuery('subjects', subjectService.getSubjects);

  // Fetch teachers
  const { data: teachers } = useQuery('teachers', () =>
    fetch('/api/teachers').then((res) => res.json())
  );

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        day_of_week: initialData.day_of_week.toString(),
        subject_id: initialData.subject_id.toString(),
        teacher_id: initialData.teacher_id.toString(),
      });
    } else {
      reset({
        day_of_week: '',
        start_time: '',
        end_time: '',
        subject_id: '',
        teacher_id: '',
        room_number: '',
      });
    }
  }, [initialData, reset]);

  const onSubmitHandler = (data) => {
    onSubmit({
      ...data,
      day_of_week: Number(data.day_of_week),
      subject_id: Number(data.subject_id),
      teacher_id: Number(data.teacher_id),
    });
    reset();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900"
                    >
                      {initialData ? 'Edit Timetable Slot' : 'Add New Timetable Slot'}
                    </Dialog.Title>
                    <form
                      onSubmit={handleSubmit(onSubmitHandler)}
                      className="mt-6 space-y-6"
                    >
                      <div>
                        <label
                          htmlFor="day_of_week"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Day
                        </label>
                        <select
                          id="day_of_week"
                          {...register('day_of_week', { required: 'Day is required' })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="">Select a day</option>
                          {DAYS.map((day, index) => (
                            <option key={day} value={index + 1}>
                              {day}
                            </option>
                          ))}
                        </select>
                        {errors.day_of_week && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.day_of_week.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="start_time"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Start Time
                        </label>
                        <select
                          id="start_time"
                          {...register('start_time', { required: 'Start time is required' })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="">Select start time</option>
                          {TIME_SLOTS.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                        {errors.start_time && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.start_time.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="end_time"
                          className="block text-sm font-medium text-gray-700"
                        >
                          End Time
                        </label>
                        <select
                          id="end_time"
                          {...register('end_time', { required: 'End time is required' })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="">Select end time</option>
                          {TIME_SLOTS.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                        {errors.end_time && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.end_time.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="subject_id"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Subject
                        </label>
                        <select
                          id="subject_id"
                          {...register('subject_id', { required: 'Subject is required' })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="">Select a subject</option>
                          {subjects?.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name} ({subject.code})
                            </option>
                          ))}
                        </select>
                        {errors.subject_id && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.subject_id.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="teacher_id"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Teacher
                        </label>
                        <select
                          id="teacher_id"
                          {...register('teacher_id', { required: 'Teacher is required' })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="">Select a teacher</option>
                          {teachers?.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.first_name} {teacher.last_name}
                            </option>
                          ))}
                        </select>
                        {errors.teacher_id && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.teacher_id.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="room_number"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Room Number
                        </label>
                        <input
                          type="text"
                          id="room_number"
                          {...register('room_number', { required: 'Room number is required' })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        {errors.room_number && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.room_number.message}
                          </p>
                        )}
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 sm:ml-3 sm:w-auto"
                        >
                          {initialData ? 'Update' : 'Create'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 