import { getApiUrl } from './api';

export async function subscribeToPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported');
    return;
  }

  try {
    // Register Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered');

    // Request Notification Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return;
    }

    // Fetch VAPID Public Key from the server
    const res = await fetch(getApiUrl('/api/vapidPublicKey'));
    const { publicKey } = await res.json();

    // Convert VAPID key for use with PushManager
    const convertedVapidKey = urlBase64ToUint8Array(publicKey);

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });

    // Send the subscription to the backend
    await fetch(getApiUrl('/api/notifications/subscribe'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });

    console.log('Push notification subscription successful');
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
  }
}

// Utility to convert Base64 string to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
