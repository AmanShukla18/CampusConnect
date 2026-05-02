# CampusConnect Feature Inventory

## 1. Authentication & Onboarding
- **GetStartedScreen / OnboardingScreen**: Slideshow introduction. Role selection (Student/Teacher).
- **LoginScreen**: Handles user login, parses credentials, and manages initial Firebase/MongoDB session handshakes. Wait states are handled via custom loading indicators.
- **SignupScreen**: Role-based registration form. Captures photo uploads and designation tokens for initial admin provisioning.
- **PendingScreen / RejectedScreen**: Gatekeeper screens for accounts pending global admin approval.

## 2. Core Dashboard & Navigation
- **Home / Dashboard Navigation**: The central hub routing to all major modules.
- **Global Search (`SearchScreen`)**: A universal search engine scanning Users, Events, and Resources with dynamic tab views.

## 3. Communication & Collaboration 
- **Study Groups (`StudyGroupsScreen`)**: Dedicated spaces for students and teachers to create module-specific rooms.
  - Features: Create Group, Join Group, View Members, Invite Links.
- **Group Chat (`GroupChatScreen`)**: Complex real-time WebSocket communication space inside a group.
  - Sub-features: Realtime text messaging, Image/File uploads, Notes tab, Sessions Tab, Polls tab, Admin Member Management.

## 4. Academic Resources
- **Events Hub (`EventsScreen`)**: Universal calendar view displaying offline fallbacks, approval flows, RSVP features, and flyer image attachments.
- **Study Resources (`ResourcesScreen`)**: A repository of notes, assignments, and links filtering by school or global network. Access restricted uploads (teachers only).
- **Notices / Announcements (`NoticesScreen`)**: School-wide broadcast system with filtering by Year/Department. Supports pull-to-refresh and socket event synchronization.

## 5. Community utilities
- **Lost & Found (`LostFoundScreen`)**: Real-time Firebase-bound tracking of lost items with image uploads and "Claimed" status markers.
  
## 6. Administration
- **Admin Dashboard (`AdminDashboardScreen`)**: The nexus for Global Admins. Contains real-time numerical arrays mapping growth across schools.
- **Teacher/User Management (`AdminTeacherListScreen`)**: Approve or reject educator credentials.

## 7. Configuration
- **Settings & Profile (`SettingsScreen`, `ProfileEditScreen`)**: Local user customizations including Dark/Light themes, credential edits, and logout mechanics.
