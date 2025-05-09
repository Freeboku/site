
import React from 'react';
import { LayoutDashboard, BookCopy, Users, ShieldAlert, MessageSquare, Annoyed } from 'lucide-react';

export const PERMISSIONS_CONFIG = {
  ADMIN_DASHBOARD: {
    id: 'admin:dashboard',
    label: 'Tableau de bord',
    icon: <LayoutDashboard className="h-5 w-5 mr-2" />,
    actions: {
      VIEW: { id: 'admin:dashboard:view', label: 'Voir le tableau de bord' },
    },
    path: '/admin',
  },
  ADMIN_WEBTOONS: {
    id: 'admin:webtoons',
    label: 'Webtoons',
    icon: <BookCopy className="h-5 w-5 mr-2" />,
    actions: {
      VIEW: { id: 'admin:webtoons:view', label: 'Voir la liste des webtoons' },
      CREATE: { id: 'admin:webtoons:create', label: 'Créer un webtoon' },
      EDIT: { id: 'admin:webtoons:edit', label: 'Modifier un webtoon' },
      DELETE: { id: 'admin:webtoons:delete', label: 'Supprimer un webtoon' },
      UPLOAD_CHAPTERS: { id: 'admin:webtoons:chapters:upload', label: 'Uploader des chapitres' },
      EDIT_CHAPTERS: { id: 'admin:webtoons:chapters:edit', label: 'Modifier des chapitres' },
      DELETE_CHAPTERS: { id: 'admin:webtoons:chapters:delete', label: 'Supprimer des chapitres' },
    },
    path: '/admin/webtoons',
  },
  ADMIN_USERS: {
    id: 'admin:users',
    label: 'Utilisateurs',
    icon: <Users className="h-5 w-5 mr-2" />,
    actions: {
      VIEW: { id: 'admin:users:view', label: 'Voir la liste des utilisateurs' },
      EDIT_ROLE: { id: 'admin:users:edit_role', label: 'Modifier le rôle d\'un utilisateur' },
    },
    path: '/admin/users',
  },
  ADMIN_ROLES: {
    id: 'admin:roles',
    label: 'Rôles',
    icon: <ShieldAlert className="h-5 w-5 mr-2" />,
    actions: {
      VIEW: { id: 'admin:roles:view', label: 'Voir la liste des rôles' },
      CREATE: { id: 'admin:roles:create', label: 'Créer un rôle' },
      EDIT: { id: 'admin:roles:edit', label: 'Modifier un rôle (permissions incluses)' },
      DELETE: { id: 'admin:roles:delete', label: 'Supprimer un rôle' },
    },
    path: '/admin/roles',
  },
  ADMIN_COMMENTS: {
    id: 'admin:comments',
    label: 'Commentaires',
    icon: <MessageSquare className="h-5 w-5 mr-2" />,
    actions: {
      VIEW: { id: 'admin:comments:view', label: 'Voir la liste des commentaires' },
      DELETE: { id: 'admin:comments:delete', label: 'Supprimer un commentaire' },
    },
    path: '/admin/comments',
  },
  ADMIN_POPUPS: {
    id: 'admin:popups',
    label: 'Pop-ups',
    icon: <Annoyed className="h-5 w-5 mr-2" />,
    actions: {
      VIEW: { id: 'admin:popups:view', label: 'Voir la liste des pop-ups' },
      CREATE: { id: 'admin:popups:create', label: 'Créer une pop-up' },
      EDIT: { id: 'admin:popups:edit', label: 'Modifier une pop-up' },
      DELETE: { id: 'admin:popups:delete', label: 'Supprimer une pop-up' },
    },
    path: '/admin/popups',
  },
};

export const getAllPermissionIds = () => {
  const ids = [];
  for (const sectionKey in PERMISSIONS_CONFIG) {
    const section = PERMISSIONS_CONFIG[sectionKey];
    for (const actionKey in section.actions) {
      ids.push(section.actions[actionKey].id);
    }
  }
  return ids;
};

export const ADMIN_NAV_ITEMS = [
  PERMISSIONS_CONFIG.ADMIN_DASHBOARD,
  PERMISSIONS_CONFIG.ADMIN_WEBTOONS,
  PERMISSIONS_CONFIG.ADMIN_USERS,
  PERMISSIONS_CONFIG.ADMIN_ROLES,
  PERMISSIONS_CONFIG.ADMIN_COMMENTS,
  PERMISSIONS_CONFIG.ADMIN_POPUPS,
];
