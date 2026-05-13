'use client';

import React from 'react'
import { usePathname } from 'next/navigation';
import Link from 'next/link';


const links = [
  { label: 'Dashboard', value: '/' },
  { label: 'Signature', value: '/signature/' },
  { label: 'Insurance', value: '/insurance/' },
  { label: 'Eligibility', value: '/eligibility/' },
  { label: 'Diagnosis', value: '/diagnosis/' },
  { label: 'Documents', value: '/documents/' },
  { label: 'Compliance', value: '/compliance/' },
  { label: 'Client Ledger', value: '/client-ledger/' },
  { label: 'Medication Management', value: '/medication-management/' },
  { label: 'Electronic Prescription', value: '/electronic-prescription/' },
  { label: 'Vitals', value: '/vitals/' },
  { label: 'Billing Claims', value: '/billing-claims/' },
  { label: 'Services', value: '/services/' },
  { label: 'Treatment Plan', value: '/treatment-plan/' },
  { label: 'Authorization', value: '/authorization/' },
  { label: 'Assigned Staff', value: '/assigned-staff/' },
  { label: 'Questionnaire', value: '/questionnaire/' },
  { label: 'Physician', value: '/physician/' },
  { label: 'Background', value: '/background/' },
  { label: 'Contact & Relations', value: '/contact-relations/' },
  { label: 'Contact Notes', value: '/contact-notes/' },
  { label: 'Immunization', value: '/immunization/' },
  { label: 'File', value: '/file/' },
  { label: 'Discharge', value: '/discharge/' }
]
const AdminUserProfileNavigation = ({ id }: { id: string }) => {
  const pathname = usePathname() + "/";
  console.log('pathname: ', pathname)

  const isActiveFullPath = (path: string) => {
    const currentPath = pathname.split(`/admin/clients/${id}`)[1];
    console.log('currentPath: ', currentPath)
    return currentPath === path ? 'bg-gray-200' : '';
  }

  return (
    <div className='border-2 rounded-lg p-4 bg-white'>
      <p className='font-bold text-lg border-b pb-3'>Client</p>
      <ul className='flex flex-row md:flex-col flex-wrap gap-1 mt-2'>
        {links.map((link, index) => (
          <Link key={index} href={`/admin/clients/${id}${link.value}`}>
            <li className={`p-2 cursor-pointer rounded-md hover:bg-gray-200 ${isActiveFullPath(link.value)}`}>
              {link.label}
            </li>
          </Link>
        ))}
      </ul>
    </div>
  )
}

export default AdminUserProfileNavigation