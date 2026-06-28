// src/components/NotificationDropdown.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import {
  FaBell,
  FaCalendarAlt,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa";

const NotificationDropdown = ({ classes }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState(new Set());
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Derive notifications from classes (no setState in effect)
  const notifications = useMemo(() => {
    const result = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    classes.forEach((cls) => {
      (cls.quizzes || []).forEach((quiz) => {
        if (!quiz.date) return;

        const quizDate = new Date(quiz.date);
        quizDate.setHours(0, 0, 0, 0);

        const totalStudents = cls.students?.length || 0;
        const checkedStudents = quiz.checkedStudents?.length || 0;
        const ungradedStudents = totalStudents - checkedStudents;

        if (quizDate.getTime() === tomorrow.getTime()) {
          result.push({
            id: `upcoming-${quiz.id}`,
            type: "upcoming",
            title: `Quiz tomorrow: "${quiz.title}"`,
            description: `Scheduled for tomorrow in ${cls.name}`,
            quizId: quiz.id,
            classId: cls.id,
            className: cls.name,
            date: quiz.date,
          });
        } else if (
          quizDate.getTime() === today.getTime() &&
          ungradedStudents > 0
        ) {
          result.push({
            id: `today-${quiz.id}`,
            type: "today",
            title: `Quiz today: "${quiz.title}"`,
            description: `${ungradedStudents} student${ungradedStudents > 1 ? "s" : ""} ${ungradedStudents > 1 ? "are" : "is"} not graded yet`,
            quizId: quiz.id,
            classId: cls.id,
            className: cls.name,
            date: quiz.date,
          });
        } else if (quizDate < today && ungradedStudents > 0) {
          result.push({
            id: `overdue-${quiz.id}`,
            type: "overdue",
            title: `Overdue quiz: "${quiz.title}"`,
            description: `${ungradedStudents} student${ungradedStudents > 1 ? "s" : ""} ${ungradedStudents > 1 ? "are" : "is"} still not graded`,
            quizId: quiz.id,
            classId: cls.id,
            className: cls.name,
            date: quiz.date,
          });
        }
      });
    });

    return result;
  }, [classes]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readIds.has(n.id)).length,
    [notifications, readIds],
  );

  const handleNotificationClick = (notification) => {
    setReadIds((prev) => new Set([...prev, notification.id]));

    if (notification.quizId && notification.classId) {
      const classData = classes.find((c) => c.id === notification.classId);
      const quiz = classData?.quizzes?.find(
        (q) => q.id === notification.quizId,
      );
      if (quiz && window.handleViewQuizFromNotification) {
        window.handleViewQuizFromNotification(quiz);
      }
      setIsOpen(false);
    }
  };

  const markAllAsRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "upcoming":
        return <FaCalendarAlt className="text-blue-500" />;
      case "today":
        return <FaClock className="text-amber-500" />;
      case "overdue":
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "upcoming":
        return "border-l-4 border-blue-500";
      case "today":
        return "border-l-4 border-amber-500";
      case "overdue":
        return "border-l-4 border-red-500";
      default:
        return "border-l-4 border-gray-300";
    }
  };

  const panelContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <FaBell className="text-emerald-600" />
          <h3 className="font-semibold text-gray-800">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-emerald-600 hover:text-emerald-800 font-medium">
            Mark all read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ?
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <FaBell className="text-4xl text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No notifications</p>
            <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
          </div>
        : notifications.map((notification) => {
            const isRead = readIds.has(notification.id);
            return (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-b-0 flex items-start gap-3 ${
                  !isRead ? "bg-emerald-50/30" : ""
                } ${getNotificationColor(notification.type)}`}>
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm font-medium ${!isRead ? "text-gray-800" : "text-gray-600"}`}>
                      {notification.title}
                    </p>
                    {!isRead && (
                      <span className="flex-shrink-0 w-2 h-2 bg-emerald-500 rounded-full" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {notification.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {notification.className} • {notification.date}
                  </p>
                </div>
              </button>
            );
          })
        }
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => {
              if (window.setActiveTabFromNotification) {
                window.setActiveTabFromNotification("quizzes");
              }
              setIsOpen(false);
            }}
            className="text-xs text-emerald-600 hover:text-emerald-800 font-medium w-full text-center">
            View all quizzes
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
        aria-label="Notifications">
        <FaBell className="text-base sm:text-lg" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Mobile: fixed full-viewport overlay, panel centered in it.
              A button anchored near the top-right of a narrow screen can't
              fit a 320-384px wide absolutely-positioned dropdown without
              clipping off-screen, so below the `sm` breakpoint we render a
              centered fixed panel instead of an anchored one. */}
          <div className="sm:hidden fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl border border-emerald-100/50 overflow-hidden">
              {panelContent}
            </div>
          </div>

          {/* Desktop/tablet (sm and up): original anchored dropdown,
              positioned relative to the bell button. */}
          <div className="hidden sm:block absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-emerald-100/50 overflow-hidden z-50">
            {panelContent}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;
