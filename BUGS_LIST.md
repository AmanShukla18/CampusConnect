# CampusConnect Bug Classification Matrix

This matrix identifies the vulnerabilities and structural flaws previously present inside the CampusConnect Feature Screen endpoints before the massive cleanup operation.

| Feature Area | Severity | Bug Description | Status |
| --- | --- | --- | --- |
| **Study Groups** | `CRASHING` | `group.members.map` arrays threw Unhandled Promise Rejections when mapping over missing elements dynamically fetched from WebSocket updates. | Fixed |
| **Study Groups** | `BUGGY` | Identical cleanup bindings caused massive CPU-killing infinite Socket event leaks. | Fixed |
| **Study Groups** | `BROKEN` | Admin panels successfully rendered the "Promote to Admin / Remove from Group" buttons, but clicking them crashed since backend routes didn't exist. | Fixed |
| **Group Chat** | `CRASHING` | Notes formatted by DateUtils threw Exceptions if the backend passed `undefined` or null timestamps during the initial `fetchGroupDetails` load. | Fixed |
| **Group Chat** | `UNTESTED` | The Polls subsystem didn't rigorously check `email` lengths or format arrays, allowing vote collisions to go unnoticed. | Fixed |
| **Events Hub** | `CRASHING` | Re-rendering components with stale `fetchEvents` promises after navigation caused Memory Leak warnings and Red Box exceptions. (`Can't update unmounted component`). | Fixed |
| **Admin Dashboard** | `CRASHING` | Loading statistics logic attempted to resolve `.json()` payloads over network loops silently returning string formats or `{}` causing variables to freeze and error out the Home layout. | Fixed |
| **Resources** | `BUGGY` | Cancelling the document picker manually using the standard back-button caused unhandled promise rejection loops on web platforms. | Fixed |
| **Notices** | `BUGGY` | `handleDelete` triggered a direct unauthenticated API request to Drop a Notice without explicitly using `Alert.alert` to prompt the user to confirm. | Fixed |
| **Search** | `CRASHING` | Re-rendering components with stale `performSearch()` promises after unmounting. | Fixed |
| **Server Completeness** | `BROKEN` | `DELETE /api/groups/:id` returned `404 Not Found` allowing global admins to only *view* unused/empty groups but preventing database cleanup routines. | Fixed |
