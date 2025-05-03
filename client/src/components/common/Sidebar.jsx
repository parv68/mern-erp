import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'

const Sidebar = () => {
  const user = { role: 'admin' } // Replace with actual user role

  const navigationItems = [
    {
      title: 'Examination',
      icon: <ClipboardDocumentListIcon className="h-6 w-6" />,
      path: user.role === 'admin' ? '/admin/exams' : 
            user.role === 'teacher' ? '/teacher/assessments' : 
            '/exams',
      roles: ['admin', 'teacher', 'student', 'parent']
    },
    // ... other navigation items ...
  ]

  return (
    <div>
      {/* Render your navigation items here */}
    </div>
  )
}

export default Sidebar 