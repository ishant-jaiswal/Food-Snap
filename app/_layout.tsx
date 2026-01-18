import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationProvider } from "@/hooks/useNotifications";
import { Slot } from "expo-router";

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <SubscriptionProvider>
          <Slot />
        </SubscriptionProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
