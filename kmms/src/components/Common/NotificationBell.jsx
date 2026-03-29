import React, { useState, useEffect } from 'react';
import { fetchNotifications } from '../../api/NotificationApi';
import NotificationDropdown from './NotificationDropdown';
import { initSocket, getSocket } from '../../utils/socketClient';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    load();

    // initialize socket connection
    const socket = initSocket();

    // handler: prepend incoming notification
    const onNotification = (n) => {
      // Some backends send plain object; ensure consistent shape
      setNotifications(prev => {
        // avoid duplicates
        if (prev.some(p => String(p._id) === String(n._id))) return prev;
        return [n, ...prev];
      });
    };

    socket.on('notification', onNotification);

    return () => {
      socket.off('notification', onNotification);
      // optionally: socket.disconnect(); // keep shared socket alive across components
    };
  }, []);

  async function load() {
    try {
      const res = await fetchNotifications();
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="p-2 rounded-full hover:bg-brand-bg transition relative">
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5">{unreadCount}</span>}
      </button>
      {open && <NotificationDropdown notifications={notifications} refresh={load} />}
    </div>
  );
}
