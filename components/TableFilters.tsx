import { PlusCircle, XIcon } from 'lucide-react'
import React from 'react'
import { Input } from './ui/input'
import { Table } from '@tanstack/react-table';

export interface Filter {
  label: string;
  value: string;
}

interface TableFiltersProps<TData> {
  filters: Filter[];
  table: Table<TData>;
}

const TableFilters = <TData,>({ filters, table }: TableFiltersProps<TData>) => {

  return (
    <div className='flex flex-col gap-4 border-2 border-gray-200 p-5 rounded-md'>
      <div className='flex justify-between items-center gap-4'>
        <Input
          type="text"
          className="border-2 border-dashed border-gray-400 rounded-full max-w-xs"
          placeholder="Type min.3 chars to find by Name or ID"
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
        />
        <button className="text-red-500 hover:text-red-700 text-sm inline-flex items-center">
          <XIcon size={16} /> Clear Filters
        </button>
      </div>
      <div className='flex flex-row gap-4 flex-wrap'>
        {filters.map((option, index) => {
          return (
            <div key={index} className='inline-flex items-center gap-1 border-2 border-gray-400 text-gray-400 border-dashed rounded-full py-1 px-2 text-sm cursor-pointer hover:border-primary hover:text-primary'>
              <PlusCircle />
              {option.label}
            </div>
          )
        })}
      </div>

    </div>
  )
}

export default TableFilters