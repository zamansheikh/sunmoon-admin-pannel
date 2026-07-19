export type NavItem = {
  title: string;
  href?: string;
  icon?: string;
  badge?: { text: string; cls: string };
  children?: NavItem[];
  id?: string;
};

export type NavSection = {
  sectionTitle: string;
};

export type NavEntry = NavItem | NavSection;

export function isSection(entry: NavEntry): entry is NavSection {
  return "sectionTitle" in entry;
}

export const navigation: NavEntry[] = [

  // Dashboard
  { title: "Dashboard", icon: "ri-dashboard-line", href: "/dashboard", badge: { text: "9+", cls: "bg-danger" } },

  // ─── Admin Panel ────────────────────────────────────────────────────────────
  { sectionTitle: "Admin Panel" },

  // User Management
  {
    title: "User Management", icon: "ri-group-line", id: "sidebarUsers",
    children: [
      { title: "App User",         href: "/admin/users/all" },
      { title: "Active App User",  href: "/admin/users/online" },
      { title: "Banned Users",     href: "/admin/users/banned" },
      { title: "Medals",           href: "/admin/users/medals" },
    ],
  },

  // Room Management
  {
    title: "Room Management", icon: "ri-mic-line", id: "sidebarRooms",
    children: [
      { title: "All Rooms",     href: "/admin/rooms/all" },
      { title: "Active Rooms",  href: "/admin/rooms/active" },
      { title: "Locked Rooms",  href: "/admin/rooms/locked" },
      { title: "Room Support",  href: "/admin/rooms/support" },
      { title: "Rocket Setup",  href: "/admin/rooms/rocket" },
    ],
  },

  // Gift Management
  {
    title: "Gift Management", icon: "ri-gift-line", id: "sidebarGifts",
    children: [
      { title: "All Gifts", href: "/admin/gifts/all" },
    ],
  },

  // Event Management
  {
    title: "Event Management", icon: "ri-calendar-event-line", id: "sidebarEvents",
    children: [
      { title: "All Events",    href: "/admin/events/all" },
      { title: "Create Event",  href: "/admin/events/create" },
      { title: "Active Events", href: "/admin/events/active" },
    ],
  },

  // Store Management — create item / category are reached via buttons
  // (modals) on the All Item page, not their own menu.
  {
    title: "Store Management", icon: "ri-store-2-line", id: "sidebarStore",
    children: [
      { title: "All Item", href: "/admin/store/manage" },
    ],
  },

  // Premium Membership
  {
    title: "Premium Membership", icon: "ri-vip-crown-line", id: "sidebarPremium",
    children: [
      { title: "SVIP", href: "/admin/svip/manage" },
      { title: "VIP",  href: "/admin/svip/vip" },
    ],
  },

  // XP & Levels
  {
    title: "XP & Levels", icon: "ri-medal-line", id: "sidebarXp",
    children: [
      { title: "XP Configuration", href: "/admin/xp/config" },
      { title: "Medals",           href: "/admin/medals/manage" },
    ],
  },

  // Wallet & Finance
  {
    title: "Wallet & Finance", icon: "ri-wallet-3-line", id: "sidebarWallet",
    children: [
      { title: "Recharge History",    href: "/admin/finance/recharge" },
      { title: "Transaction History", href: "/admin/finance/transactions" },
      { title: "Coin Exchange",       href: "/admin/finance/coin-exchange" },
      { title: "Coin Packages",       href: "/admin/finance/coin-packages" },
    ],
  },

  // Revenue Management
  {
    title: "Revenue Management", icon: "ri-line-chart-line", id: "sidebarRevenue",
    children: [
      { title: "Recharge Profit", href: "/admin/revenue/recharge" },
      { title: "Game Profit",     href: "/admin/games/revenue" },
    ],
  },

  // Moderation
  {
    title: "Moderation", icon: "ri-shield-check-line", id: "sidebarMod",
    children: [
      { title: "Reported Users",  href: "/admin/mod/users" },
      { title: "Reported Rooms",  href: "/admin/mod/rooms" },
      { title: "IP Ban List",     href: "/admin/mod/ipban" },
      { title: "Device Ban List", href: "/admin/mod/deviceban" },
    ],
  },

  // Staff Management — "Create Role" is reached via a button on the
  // All Roles page, not its own menu item.
  {
    title: "Staff Management", icon: "ri-admin-line", id: "sidebarStaff",
    children: [
      { title: "All Roles",    href: "/admin/roles/all" },
      { title: "App Reseller", href: "/admin/reseller" },
    ],
  },

  // Banner Upload
  {
    title: "Banner Upload", icon: "ri-image-line", id: "sidebarBanners",
    children: [
      { title: "Slider Banner",    href: "/admin/banners/slider" },
      { title: "Splash Banner",    href: "/admin/banners/splash" },
      { title: "Popup Banner",     href: "/admin/notifications/popup" },
      { title: "Announcement Bar", href: "/admin/notifications/announcement" },
    ],
  },

  // ─── System ─────────────────────────────────────────────────────────────────
  { sectionTitle: "System" },

  // Agora Server
  {
    title: "Agora Server", icon: "ri-broadcast-line", id: "sidebarAgora",
    children: [
      { title: "Overview",      href: "/agora" },
      { title: "Configuration", href: "/agora/config" },
      { title: "Analytics",     href: "/agora/analytics" },
      { title: "Token Tester",  href: "/agora/test" },
    ],
  },

  // Notifications
  {
    title: "Notifications", icon: "ri-notification-3-line", id: "sidebarNotif",
    children: [
      { title: "Send Push",    href: "/admin/notifications/push" },
      { title: "Bulk Message", href: "/admin/notifications/bulk" },
      { title: "Schedule",     href: "/admin/notifications/schedule" },
    ],
  },

  // CMS
  {
    title: "CMS", icon: "ri-pages-line", id: "sidebarCms",
    children: [
      { title: "Privacy Policy",     href: "/admin/cms/privacy" },
      { title: "Terms & Conditions", href: "/admin/cms/terms" },
      { title: "About Us",           href: "/admin/cms/about" },
      { title: "FAQ",                href: "/admin/cms/faq" },
      { title: "Maintenance Mode",   href: "/admin/cms/maintenance" },
    ],
  },

  // System Settings
  {
    title: "System Settings", icon: "ri-settings-3-line", id: "sidebarSettings",
    children: [
      { title: "App Config",       href: "/admin/settings/app" },
      { title: "Coin Rate Setup",  href: "/admin/settings/coins" },
      { title: "Referral Bonus",   href: "/admin/settings/referral" },
      { title: "Signup Bonus",     href: "/admin/settings/signup" },
      { title: "API Keys",         href: "/admin/settings/api" },
      { title: "Backup & Restore", href: "/admin/settings/backup" },
    ],
  },
];
