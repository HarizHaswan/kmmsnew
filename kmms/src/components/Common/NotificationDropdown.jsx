import React from 'react';
import { markAsRead, markAllRead } from '../../api/NotificationApi';

export default function NotificationDropdown({ notifications, refresh }) {
  const handleMark = async (id) => {
    await markAsRead(id);
    refresh();
  };

  const handleMarkAll = async () => {
    await markAllRead();
    refresh();
  };

  return (
    <div className="absolute right-0 mt-3 w-80 bg-white shadow-xl rounded-lg border z-50">
      <div className="flex justify-between items-center px-3 py-2 border-b">
        <span className="font-semibold">Notifications</span>
        <button
          onClick={handleMarkAll}
          className="text-sm text-accent hover:underline"
        >
          Mark all
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No notifications</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`px-3 py-2 border-b cursor-pointer ${
                n.isRead ? "bg-white" : "bg-white"
              }`}
              onClick={() => handleMark(n._id)}
            >
              <p className="font-medium">{n.title}</p>
              <p className="text-xs text-gray-600">{n.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
