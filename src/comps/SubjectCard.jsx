import React from 'react'

const SubjectCard = (props) => {
  return (
    <div className='relative h-20 w-full bg-gradient-to-b from-green-400 to-green-300 m-auto my-4 rounded text-sm flex justtify-between overflow-hidden text-slate-50 hover:scale-105 transition-all cursor-pointer hover:shadow-xl'>
      <div className='h-full w-1/6 bg-green-500 text-xs border-r-4 border-green-500'>
      <p className='h-1/3 flex items-center justify-center px-2 bg-gradient-to-r from-slate-600 to-slate-500'>{props.pre1 ? props.pre1 : "None"}</p>
      <p className='h-1/3 flex items-center justify-center px-2 bg-gradient-to-r from-slate-700 to-slate-500'>{props.pre2 ? props.pre2 : "None"}</p>
      <p className='h-1/3 flex items-center justify-center px-2 bg-gradient-to-r from-slate-600 to-slate-500'>{props.pre3 ? props.pre3 : "None"}</p>
      </div>
      <div className='absolute bg-gradient-to-t from-green-400 to-green-300 top-1/4 left-[18%] h-1/2 w-6' style={{borderRadius: "0% 100% 100% 0% / 0% 50% 50% 100%"}}></div>
      <div className='h-full w-4/6 p-2 text-center text-slate-900 z-10 flex flex-col justify-between'>
        <p className='font-semibold text-xs drop-shadow-lg'> {props.name} ({props.llt}) </p>
        <p className='text-slate-800 text-xs flex justify-between w-full'> <span className='font-semibold rounded text-sm' style={{background: 'rgba(190,255,190,.3', padding: '0 6px 0 6px'}}>{props.code}</span><span>- Offered by {props.branch}</span></p>
      </div>
      <div className='h-full w-1/6 bg-green-300 text-xs'>
        <p className='h-1/2 flex items-center justify-center px-2 bg-gradient-to-r from-slate-700 to-slate-600 flex flex-row'>Slot: {props.slot}</p>
        <p className='h-1/2 flex items-center justify-center px-2 bg-gradient-to-b from-slate-700 to-slate-600'>{props.room}</p>
      </div>
    </div>
  )
}

export default SubjectCard