import React from 'react'

const SubjectCard = (props) => {
  return (
    <div className='relative min-h-28 w-full bg-gradient-to-b from-green-400 to-green-300 m-auto my-4 rounded text-sm flex flex-col overflow-hidden text-slate-50 hover:scale-105 transition-all cursor-pointer hover:shadow-xl'>

      {/* Top Section: Subject Code, Name, and LTP */}
      <div className='w-full p-3 bg-gradient-to-r from-slate-700 to-slate-600 flex justify-between items-center'>
        <div className='flex-1'>
          <p className='font-bold text-base text-green-300'>{props.code}</p>
          <p className='text-xs text-slate-200 mt-1'>{props.name}</p>
        </div>
        <div className='flex flex-col items-end gap-1'>
          <span className='bg-green-400 text-slate-800 px-3 py-1 rounded text-xs font-semibold'>
            {props.llt}
          </span>
          <span className='bg-green-300 text-slate-800 px-3 py-1 rounded text-xs font-semibold'>
            {props.credits} Credits
          </span>
        </div>
      </div>

      {/* Middle Section: Teacher and Slot */}
      <div className='w-full px-3 py-2 bg-green-400 flex justify-between items-center text-slate-800'>
        <div className='flex-1'>
          <p className='text-xs font-semibold text-slate-700'>Teacher:</p>
          <p className='text-xs mt-1 line-clamp-2'>{props.teacher || "TBA"}</p>
        </div>
        <div className='ml-3 bg-slate-700 text-green-300 px-3 py-2 rounded font-semibold text-sm'>
          Slot: {props.slot}
        </div>
      </div>

      {/* Bottom Section: Prerequisites */}
      <div className='w-full px-3 py-2 bg-gradient-to-r from-green-300 to-green-200 flex items-center gap-2 text-slate-800'>
        <p className='text-xs font-semibold text-slate-700 whitespace-nowrap'>Prerequisite:</p>
        <span className='bg-slate-600 text-green-200 px-2 py-1 rounded text-xs'>
          {props.pre1 || "None"}
        </span>
      </div>
    </div>
  )
}

export default SubjectCard