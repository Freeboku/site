
import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { Home, BookOpen, Users, MessageCircle, Settings, LogOut, Shield, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const AdminLayout = () => {
  const { signOut } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: Home },
    { name: 'Webtoons', path: '/admin/webtoons', icon: BookOpen },
    { name: 'Utilisateurs', path: '/admin/users', icon: Users },
    { name: 'Rôles (Simplifié)', path: '/admin/roles', icon: Shield },
    { name: 'Commentaires', path: '/admin/comments', icon: MessageCircle },
    { name: 'Pop-ups', path: '/admin/popups', icon: Bell },
  ];

  return (
    <div className="min-h-screen flex bg-muted/40">
      <aside className="w-64 bg-background border-r p-6 space-y-6 hidden md:flex flex-col">
        <div>
          <Link to="/" className="flex items-center space-x-2 mb-8 text-primary">
            <Settings className="h-8 w-8" />
            <span className="text-2xl font-bold">Panel Admin</span>
          </Link>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`
                }
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mt-auto">
            <Button variant="ghost" onClick={signOut} className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <LogOut className="h-5 w-5 mr-3" />
                Déconnexion
            </Button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="bg-background border-b p-4 md:hidden">
            <Link to="/" className="flex items-center space-x-2 text-primary">
                <Settings className="h-6 w-6" />
                <span className="text-xl font-bold">Panel Admin</span>
            </Link>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
        <nav className="md:hidden bg-background border-t grid grid-cols-5 gap-1 p-1 sticky bottom-0">
            {navItems.map((item) => (
              <NavLink
                key={item.name + "-mobile"}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center p-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  }`
                }
              >
                <item.icon className="h-5 w-5 mb-0.5" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            ))}
        </nav>
      </div>
    </div>
  );
};

export default AdminLayout;
