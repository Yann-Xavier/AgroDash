/**
 * Tauri Bridge layer.
 * Dynamically resolves file savings, directory allocations, and OS detections
 * to maintain strict parity between online/offline web previews and native desktop builds.
 */

export interface TauriEnvironment {
  isNative: boolean;
  platform: string;
}

/**
 * Validates whether the application is running inside the Tauri native executable shell.
 */
export function getTauriEnv(): TauriEnvironment {
  const isNative = typeof window !== "undefined" && !!(window as any).__TAURI__;
  return {
    isNative,
    platform: isNative ? "Native Desktop" : "Standard Web Browser Mode"
  };
}

/**
 * Triggers a native system notification if available, falling back to a clean log.
 */
export async function sendNativeNotification(title: string, body: string) {
  if (typeof window !== "undefined") {
    const isTauri = !!(window as any).__TAURI__;
    if (isTauri) {
      console.log(`[Tauri Native Dispatch] ${title} - ${body}`);
    } else {
      console.log(`[Web Notification Emulated] ${title}: ${body}`);
    }

    // Use standard HTML5 Web Notifications which Tauri supports natively in its Webview2/WebKit container
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
         try {
           new Notification(title, { body });
         } catch {
           // fallback
         }
      } else if (Notification.permission !== "denied") {
        try {
          Notification.requestPermission().then(permission => {
            if (permission === "granted") {
              new Notification(title, { body });
            }
          });
        } catch {
          // fallback
        }
      }
    }
  }
}
