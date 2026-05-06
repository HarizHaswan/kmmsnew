import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, User as UserIcon, Loader2 } from "lucide-react";
import { getMessages, createMessage, getUsersForMessaging, markMessagesAsRead } from "../../api/messages";

export default function Messages({ user }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages();
      if (selectedUser.unreadCount > 0 && user.role !== "admin") {
        markAsRead(selectedUser._id);
      }
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const markAsRead = async (senderId) => {
    try {
      await markMessagesAsRead(senderId);
      // update local state to remove red dot
      setUsers(prevUsers => prevUsers.map(u => u._id === senderId ? { ...u, unreadCount: 0 } : u));
      setSelectedUser(prev => prev && prev._id === senderId ? { ...prev, unreadCount: 0 } : prev);
    } catch (err) {
      console.error("Failed to mark messages as read:", err);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsersForMessaging();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users for messaging:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedUser) return;
    try {
      let data = [];
      if (user.role === "admin") {
        // Admin fetches all messages for the selected user
        const sent = await getMessages({ senderId: selectedUser._id });
        const received = await getMessages({ receiverId: selectedUser._id });
        // combine and sort
        const combined = [...sent, ...received];
        // remove duplicates if any (though unlikely if sender != receiver)
        const unique = Array.from(new Set(combined.map(a => a._id)))
          .map(id => combined.find(a => a._id === id));
        data = unique.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else {
        const userId = user._id || user.id;
        // Teacher/Parent fetches conversation with selected user
        const sent = await getMessages({ senderId: userId, receiverId: selectedUser._id });
        const received = await getMessages({ senderId: selectedUser._id, receiverId: userId });
        data = [...sent, ...received].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }
      setMessages(data);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      setSending(true);
      const userId = user._id || user.id;
      await createMessage({
        senderId: userId,
        receiverId: selectedUser._id,
        content: newMessage.trim(),
      });
      setNewMessage("");
      loadMessages(); // reload to get new message
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading && !users.length) {
    return (
      <div className="flex items-center justify-center h-full pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* LEFT SIDEBAR: USER LIST */}
      <div className="w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            {user.role === "admin" ? "Monitor Chats" : "Messages"}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {user.role === "admin" ? "Select a user to view their history" : "Select someone to chat with"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {users.length === 0 ? (
            <p className="text-center text-sm text-gray-500 mt-10">No users found.</p>
          ) : (
            users.map((u) => (
              <button
                key={u._id}
                onClick={() => setSelectedUser(u)}
                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors ${
                  selectedUser?._id === u._id ? "bg-purple-100 ring-1 ring-purple-300" : "hover:bg-gray-100"
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center font-bold">
                    {u.profileImage ? (
                      <img src={u.profileImage} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <UserIcon className="w-5 h-5" />
                    )}
                  </div>
                  {u.unreadCount > 0 && user.role !== "admin" && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                      {u.unreadCount}
                    </span>
                  )}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                  <p className="text-[11px] text-gray-500 capitalize truncate flex items-center gap-1">
                    <span className="font-medium text-purple-700">{u.role}</span> 
                    {u.classAssigned && `• Class ${u.classAssigned}`}
                  </p>
                  {u.studentNames && (
                    <p className="text-[10px] text-gray-400 truncate font-medium mt-0.5">
                      Parent of: <span className="text-gray-600">{u.studentNames}</span>
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT SIDE: CHAT AREA */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedUser ? (
          <>
            {/* CHAT HEADER */}
            <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center font-bold shrink-0">
                 {selectedUser.profileImage ? (
                    <img src={selectedUser.profileImage} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5" />
                  )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{selectedUser.name}</h3>
                <p className="text-xs text-gray-500 capitalize">
                  {selectedUser.role} {selectedUser.classAssigned && `• Class ${selectedUser.classAssigned}`}
                </p>
                {selectedUser.studentNames && (
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Parent of: {selectedUser.studentNames}
                  </p>
                )}
              </div>
              {user.role === "admin" && (
                <span className="ml-auto px-3 py-1 bg-red-100 text-red-700 text-xs font-bold uppercase rounded-full tracking-wider">
                  Read Only
                </span>
              )}
            </div>

            {/* MESSAGES LIST */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                  <p>No messages yet.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId?._id === (user._id || user.id);
                  // For admin, we show name labels on all messages so they know who is talking
                  const showName = user.role === "admin";

                  return (
                    <div key={msg._id} className={`flex flex-col ${isMine && user.role !== "admin" ? "items-end" : "items-start"}`}>
                      {showName && (
                         <span className="text-[10px] text-gray-500 mb-1 ml-1 font-medium">
                           {msg.senderId?.name}
                         </span>
                      )}
                      <div
                        className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${
                          isMine && user.role !== "admin"
                            ? "bg-purple-600 text-white rounded-tr-sm"
                            : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 mx-1">
                        {new Date(msg.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* MESSAGE INPUT FORM (Hidden for Admin) */}
            {user.role !== "admin" && (
              <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 p-3 bg-gray-100 border-transparent focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium text-gray-500">Select a conversation</p>
            <p className="text-sm">Choose a user from the left to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
