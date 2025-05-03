import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { timetableService } from '../../services/timetableService';

export default function SubstitutionForm({ isOpen, onClose, slot }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      substitute_teacher_id: '',
      substitution_date: new Date().toISOString().split('T')[0],
      reason: '',
    },
  });

  // Fetch teachers
  const { data: teachers } = useQuery('teachers', () =>
    fetch('/api/teachers').then((res) => res.json())
  );

  // Request substitution mutation
  const requestSubstitutionMutation = useMutation(
    timetableService.requestSubstitution,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('substitutions');
        onClose();
        toast.success('Substitution request sent successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to request substitution');
      },
    }
  );

  const onSubmitHandler = (data) => {
    requestSubstitutionMutation.mutate({
      timetable_slot_id: slot.id,
      original_teacher_id: slot.teacher_id,
      substitute_teacher_id: Number(data.substitute_teacher_id),
      substitution_date: data.substitution_date,
      reason: data.reason,
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
                      Request Substitution
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {slot?.subject_name} - {slot?.teacher_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {slot?.class_name} {slot?.section_name}
                      </p>
                    </div>
                    <form
                      onSubmit={handleSubmit(onSubmitHandler)}
                      className="mt-6 space-y-6"
                    >
                      <div>
                        <label
                          htmlFor="substitute_teacher_id"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Substitute Teacher
                        </label>
                        <select
                          id="substitute_teacher_id"
                          {...register('substitute_teacher_id', {
                            required: 'Substitute teacher is required',
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="">Select a teacher</option>
                          {teachers?.map((teacher) => (
                            <option
                              key={teacher.id}
                              value={teacher.id}
                              disabled={teacher.id === slot?.teacher_id}
                            >
                              {teacher.first_name} {teacher.last_name}
                            </option>
                          ))}
                        </select>
                        {errors.substitute_teacher_id && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.substitute_teacher_id.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="substitution_date"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Date
                        </label>
                        <input
                          type="date"
                          id="substitution_date"
                          {...register('substitution_date', {
                            required: 'Date is required',
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          min={new Date().toISOString().split('T')[0]}
                        />
                        {errors.substitution_date && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.substitution_date.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="reason"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Reason
                        </label>
                        <textarea
                          id="reason"
                          rows={3}
                          {...register('reason', { required: 'Reason is required' })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        {errors.reason && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.reason.message}
                          </p>
                        )}
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 sm:ml-3 sm:w-auto"
                        >
                          Request
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