import React from 'react';
import RequireRole from '../components/RequireRole';

/**
 * SuperAdmin page – only rendered for users with the SUPER_ADMIN role.
 * The RequireRole wrapper ensures that the component is omitted from the DOM
 * for any other role, effectively making the page invisible.
 */
const SuperAdminContent = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-4">Super Admin Dashboard</h1>
    <p className="text-muted-foreground">
      This area contains privileged controls and system‑wide settings.
    </p>
    {/* Add exclusive admin widgets, audit logs, user management, etc. */}
  </div>
);

const SuperAdmin = () => (
  <RequireRole roles={["SUPER_ADMIN"]}>
    <SuperAdminContent />
  </RequireRole>
);

export default SuperAdmin;
