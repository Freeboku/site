
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import WebtoonDetailPage from '@/pages/WebtoonDetailPage';
import ReaderPage from '@/pages/ReaderPage'; 
import AuthPage from '@/pages/AuthPage';
import ProfilePage from '@/pages/ProfilePage';
import AllWebtoonsPage from '@/pages/AllWebtoonsPage';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminWebtoonList from '@/pages/admin/AdminWebtoonList';
import AdminWebtoonForm from '@/pages/admin/AdminWebtoonForm';
import AdminChapterUpload from '@/pages/admin/AdminChapterUpload';
import AdminChapterEdit from '@/pages/admin/AdminChapterEdit';
import AdminUserList from '@/pages/admin/AdminUserList'; 
import AdminCommentList from '@/pages/admin/AdminCommentList';
import AdminRoleList from '@/pages/admin/AdminRoleList'; 
import AdminPopupManager from '@/pages/admin/AdminPopupManager';
import NotFoundPage from '@/pages/NotFoundPage';
import ProtectedRoute from '@/components/ProtectedRoute'; 
import AllNotificationsPage from '@/pages/AllNotificationsPage';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="webtoons" element={<AllWebtoonsPage />} />
          <Route path="webtoon/:webtoonId" element={<WebtoonDetailPage />} />
          <Route path="webtoon/:webtoonId/chapter/:chapterId" element={<ReaderPage />} /> 
          <Route path="auth" element={<AuthPage />} />
          <Route element={<ProtectedRoute />}>
             <Route path="profile" element={<ProfilePage />} />
             <Route path="profile/notifications" element={<AllNotificationsPage />} />
          </Route>
        </Route>
        
        <Route path="/admin" element={<ProtectedRoute adminOnly={true} />}>
           <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="webtoons" element={<AdminWebtoonList />} />
              <Route path="webtoons/new" element={<AdminWebtoonForm />} />
              <Route path="webtoons/edit/:webtoonId" element={<AdminWebtoonForm />} />
              <Route path="webtoons/:webtoonId/upload" element={<AdminChapterUpload />} />
              <Route path="webtoons/:webtoonId/chapters/:chapterId/edit" element={<AdminChapterEdit />} />
              <Route path="users" element={<AdminUserList />} /> 
              <Route path="roles" element={<AdminRoleList />} /> 
              <Route path="comments" element={<AdminCommentList />} />
              <Route path="popups" element={<AdminPopupManager />} />
           </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
