import React, { useEffect, useState } from "react";
import { Calendar, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import TimetableGrid from "../Timetable/TimetableGrid"; // Reuse the fixed Grid
import { getTeacherTimetable } from "../../api/timetables"; // Ensure this API exists

export default function TeacherTimetable() {
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyTimetable() {
      try {
        const data = await getTeacherTimetable();
        
        // Transform the data for the Grid
        // The Grid expects: { id, day, startTime, endTime, subject, teacher }
        // For a teacher view, instead of showing "Teacher Name" (which is themselves),
        // we should show the "Class Name" (e.g., 4A, 5B) in the secondary text spot.
        const formattedData = (data || []).map((slot) => ({
          ...slot,
          id: slot._id, // Ensure ID matches
          // Map the Class Name to the 'teacher' prop so it shows up in the grid card
          teacher: slot.classId?.className || slot.classId?.name || "Unknown Class", 
        }));

        setTimetableData(formattedData);
      } catch (err) {
        console.error("Failed to load teacher timetable", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMyTimetable();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading your schedule...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Timetable</h2>
          <p className="text-sm text-gray-500">
            View your weekly teaching schedule
          </p>
        </div>
      </div>

      <Card className="min-h-[600px]">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center text-lg">
            <Calendar className="w-5 h-5 mr-2 text-accent" />
            Weekly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {/* Reuse the polished TimetableGrid */}
          {timetableData.length > 0 ? (
            <TimetableGrid 
              slots={timetableData} 
              // No onDeleteSlot prop, so the delete buttons won't appear (Read Only)
            />
          ) : (
            <div className="p-8 text-center text-gray-500">
              No classes scheduled for this week.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}