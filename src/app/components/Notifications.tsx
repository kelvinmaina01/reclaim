import { useState, useEffect } from 'react';
import { ChevronLeft, Bell, Check, X, Shield, Zap } from 'lucide-react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

interface NotificationsProps {
    onBack: () => void;
}

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    time: string;
    type: 'streak' | 'limit' | 'system';
    read: boolean;
}

export function Notifications({ onBack }: NotificationsProps) {
    const [enabled, setEnabled] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([
        {
            id: '1',
            title: 'Streak at Risk!',
            message: 'You haven\'t focused yet today. 2 hours left to keep your 3-day streak!',
            time: '2h ago',
            type: 'streak',
            read: false
        },
        {
            id: '2',
            title: 'Weekly Report',
            message: 'You reclaimed 12 hours last week. Great job!',
            time: '1d ago',
            type: 'system',
            read: true
        },
        {
            id: '3',
            title: 'Limit Reached',
            message: 'You\'ve hit your 15min limit for Instagram. Time to focus?',
            time: '2d ago',
            type: 'limit',
            read: true
        }
    ]);

    useEffect(() => {
        checkPermission();
    }, []);

    const checkPermission = async () => {
        if (Capacitor.isNativePlatform()) {
            const permission = await PushNotifications.checkPermissions();
            setEnabled(permission.receive === 'granted');
        } else {
            // Web notification permission check
            if ('Notification' in window) {
                setEnabled(Notification.permission === 'granted');
            }
        }
    };

    const requestPermission = async () => {
        if (Capacitor.isNativePlatform()) {
            const result = await PushNotifications.requestPermissions();
            if (result.receive === 'granted') {
                await PushNotifications.register();
                setEnabled(true);
            }
        } else if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setEnabled(permission === 'granted');
        }
    };

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header */}
            <div className="px-6 pt-8 pb-6 bg-white shadow-sm z-10">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={markAllRead}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 bg-blue-50 rounded-lg"
                        >
                            Mark all read
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
                    <div className="relative">
                        <Bell className="w-6 h-6 text-slate-400" />
                        {notifications.some(n => !n.read) && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                        )}
                    </div>
                </div>
            </div>

            {/* Permission Banner */}
            {!enabled && (
                <div className="px-6 py-4">
                    <div className="bg-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-200">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold mb-1">Enable Notifications</h3>
                                <p className="text-sm text-blue-100 mb-3">
                                    Don't lose your streak! Get timed reminders and weekly reports.
                                </p>
                                <button
                                    onClick={requestPermission}
                                    className="bg-white text-blue-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all"
                                >
                                    Turn On
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
                {notifications.length > 0 ? (
                    <div className="space-y-3">
                        {notifications.map((item) => (
                            <div
                                key={item.id}
                                className={`flex gap-4 p-4 rounded-2xl border transition-all ${item.read ? 'bg-white border-slate-100' : 'bg-blue-50/50 border-blue-100'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${item.type === 'streak' ? 'bg-orange-100 text-orange-600' :
                                        item.type === 'limit' ? 'bg-red-100 text-red-600' :
                                            'bg-blue-100 text-blue-600'
                                    }`}>
                                    {item.type === 'streak' && <Zap className="w-5 h-5" />}
                                    {item.type === 'limit' && <Shield className="w-5 h-5" />}
                                    {item.type === 'system' && <Bell className="w-5 h-5" />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-semibold ${item.read ? 'text-slate-700' : 'text-slate-900'}`}>
                                            {item.title}
                                        </h4>
                                        <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{item.time}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        {item.message}
                                    </p>
                                </div>

                                <div className="flex flex-col justify-between items-end">
                                    {!item.read && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mb-auto" />
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNotification(item.id);
                                        }}
                                        className="text-slate-300 hover:text-slate-500 p-1 -mr-2 -mb-2"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
                        <Bell className="w-12 h-12 mb-3 opacity-20" />
                        <p>No new notifications</p>
                    </div>
                )}
            </div>
        </div>
    );
}
