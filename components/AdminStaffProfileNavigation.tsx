'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const links = [
  { label: 'Dashboard', value: '' },
  { label: 'Signature', value: '/signature' },
  { label: 'Positions/Credentials', value: '/positions' },
  { label: 'Caseload', value: '/caseload' },
  { label: 'Sites', value: '/sites' },
  { label: 'Certifications', value: '/certifications' },
  { label: 'Files', value: '/files' },
  { label: 'Templates', value: '/templates' },
  { label: 'Staff Team', value: '/staff-team' },
];

const AdminStaffProfileNavigation = ({ id }: { id: string }) => {
  const pathname = usePathname();

  const isActiveFullPath = (path: string) => {
    const fullPath = `/admin/staff/${id}${path}`;
    console.log("full:", fullPath);
    console.log("name:", pathname);
    return pathname === fullPath ? 'bg-gray-200 font-semibold' : '';
  };

  return (
    <div className='border-2 rounded-lg p-4 bg-white'>
      <p className='font-bold text-lg border-b pb-3'>Client</p>
      <ul className='flex flex-row md:flex-col flex-wrap gap-1 mt-2'>
        {links.map((link, index) => (
          <Link key={index} href={`/admin/staff/${id}${link.value}`}>
            <li
              className={`p-2 cursor-pointer rounded-md hover:bg-gray-200 transition-colors ${isActiveFullPath(
                link.value
              )}`}
            >
              {link.label}
            </li>
          </Link>
        ))}
      </ul>
    </div>
  );
};

export default AdminStaffProfileNavigation;
