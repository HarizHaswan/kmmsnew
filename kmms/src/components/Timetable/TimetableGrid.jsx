import React from "react";
import { X } from "lucide-react";

const TimetableGrid = ({ slots = [], onDeleteSlot }) => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  
  // Custom Time Intervals as requested
  const timeIntervals = [
    "08:00", "08:30", "09:00", "09:30", "09:50", 
    "10:20", "10:50", "11:20", "11:50"
  ];

  // Helper: Convert time string to minutes
  const getMinutes = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  // Helper: Get position and width
  const getSlotStyle = (start, end) => {
    const startMin = getMinutes(start);
    const endMin = getMinutes(end);
    const dayStartMin = getMinutes("08:00"); 
    
    // Updated Duration: 8:00 AM to 11:50 AM = 3 hours 50 mins = 230 minutes
    const totalDuration = 230; 
    
    const left = ((startMin - dayStartMin) / totalDuration) * 100;
    const width = ((endMin - startMin) / totalDuration) * 100;

    return {
      left: `${left}%`,
      width: `${width}%`,
    };
  };

  return (
    <div className="min-w-[800px] p-4">
      {/* --- HEADER ROW (TIMES) --- */}
      <div className="flex border-b border-gray-200 mb-2 pb-2 sticky top-0 bg-white z-10 relative">
        <div className="w-24 flex-shrink-0 font-bold text-gray-500 text-sm">Day/Time</div>
        <div className="flex-1 relative h-6">
          {timeIntervals.map((time) => {
            return (
              <div 
                key={time} 
                className="absolute text-xs text-gray-500 font-medium -translate-x-1/2"
                style={{ left: getSlotStyle(time, time).left }}
              >
                {time}
              </div>
            );
          })}
        </div>
      </div>

      {/* --- DAYS ROWS --- */}
      <div className="space-y-4 relative">
        
        {/* FIXED SNACK TIME COLUMN (9:30 - 9:50) */}
        {/* Wrapper: Positions the context exactly over the timeline lane (skipping the 6rem sidebar) */}
        <div className="absolute top-0 bottom-0 left-24 right-0 z-0">
          <div 
            className="absolute top-0 bottom-0 bg-orange-50/80 border-l border-r border-orange-200 flex flex-col items-center justify-center pointer-events-none"
            style={getSlotStyle("09:30", "09:50")} 
          >
            <div className="rotate-90 text-[14px] font-bold text-orange-400 uppercase tracking-widest whitespace-nowrap flex items-center gap-1">
               Snack
            </div>
          </div>
        </div>

        {days.map((day) => (
          <div key={day} className="flex items-center group relative h-16 border-b border-gray-100 last:border-0 hover:bg-white transition-colors z-10">
            
            {/* Day Label */}
            <div className="w-24 flex-shrink-0 font-semibold text-gray-700 text-sm bg-white z-20">
              {day}
            </div>

            {/* Timetable Lane */}
            <div className="flex-1 relative h-full bg-white/50 rounded-lg">
              
              {/* Grid Lines for specified intervals */}
              {timeIntervals.map((time) => (
                  <div
                    key={time}
                    className="absolute top-0 bottom-0 border-l border-gray-200 border-dashed"
                    style={{ left: getSlotStyle(time, time).left }}
                  />
              ))}

              {/* Slots */}
              {slots
                .filter((slot) => slot.day === day)
                .map((slot) => {
                  const style = getSlotStyle(slot.startTime, slot.endTime);
                  
                  return (
                    <div
                      key={slot.id}
                      className="absolute top-1 bottom-1 rounded-md px-2 py-1 text-xs shadow-sm bg-accent-light border-l-4 border-accent text-accent-dark overflow-hidden flex flex-col justify-center hover:z-30 hover:shadow-md transition-all cursor-pointer group/slot"
                      style={style}
                      title={`${slot.startTime} - ${slot.endTime}: ${slot.subject}`}
                    >
                      <div className="font-bold truncate leading-tight">
                        {slot.subject}
                      </div>
                      <div className="text-[10px] opacity-80 truncate">
                        {slot.teacher}
                      </div>
                      
                      {/* Delete Button */}
                      {onDeleteSlot && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSlot(slot.id);
                          }}
                          className="absolute top-1 right-1 hidden group-hover/slot:block text-red-500 hover:text-red-700 bg-white/80 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimetableGrid;