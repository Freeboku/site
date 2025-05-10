import React, { useCallback, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
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
import { supabase } from '@/lib/supabaseClient';
import { useParams } from 'react-router-dom';

const incrementWebtoonView = async (webtoonId) => {
  if (!webtoonId) {
    console.error("Webtoon ID is undefined");
    return;
  }

  try {
    const { error } = await supabase.rpc('increment_webtoon_view', { webtoon_id: webtoonId });
    if (error) {
      console.error('Error incrementing webtoon view:', error.message);
    }
  } catch (err) {
    console.error('Failed to call increment_webtoon_view:', err);
  }
};

const fetchWebtoonDetails = async (slug) => {
  if (!slug) {
    console.error("Webtoon slug is undefined");
    return;
  }

  try {
    const { data: webtoonData, error } = await supabase
      .from('webtoons')
      .select('*, chapters(id, number, created_at, views)')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching webtoon details:', error.message);
    }

    return webtoonData;
  } catch (err) {
    console.error('Failed to fetch webtoon details:', err);
  }
};

const WebtoonDetailPage = () => {
  const { slug } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      const webtoon = await fetchWebtoonDetails(slug);
      if (webtoon) {
        await incrementWebtoonView(webtoon.id);
      }
    };

    fetchData();
  }, [slug]);

  return <div>Webtoon Details</div>;
};

import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const ReaderPage = () => {
  const { slug, chapterNumber } = useParams();
  const [chapter, setChapter] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChapterDetails = async () => {
      try {
        const { data: webtoon } = await supabase
          .from('webtoons')
          .select('id, title')
          .eq('slug', slug)
          .single();

        if (!webtoon) {
          setError("Webtoon non trouvé.");
          return;
        }

        const { data: chapter } = await supabase
          .from('chapters')
          .select('*')
          .eq('webtoon_id', webtoon.id)
          .eq('number', chapterNumber)
          .single();

        if (!chapter) {
          setError("Chapitre non trouvé.");
          return;
        }

        setChapter(chapter);
      } catch (err) {
        console.error("Erreur :", err);
        setError("Impossible de charger le chapitre.");
      }
    };

    fetchChapterDetails();
  }, [slug, chapterNumber]);

  if (error) return <div>{error}</div>;
  if (!chapter) return <div>Chargement...</div>;

  return <div>Lecture du chapitre {chapter.number}</div>;
};

export default ReaderPage;

const fetchChapterDetails = async (slug, chapterNumber) => {
  try {
    // Récupérer le webtoon par son slug
    const { data: webtoon } = await supabase
      .from('webtoons')
      .select('id, title')
      .eq('slug', slug)
      .single();

    if (!webtoon) {
      console.error("Webtoon non trouvé.");
      return;
    }

    // Récupérer le chapitre par le numéro et l'ID du webtoon
    const { data: chapter } = await supabase
      .from('chapters')
      .select('*')
      .eq('webtoon_id', webtoon.id)
      .eq('number', chapterNumber)
      .single();

    if (!chapter) {
      console.error("Chapitre non trouvé.");
      return;
    }

    console.log("Webtoon et chapitre récupérés :", webtoon, chapter);
  } catch (err) {
    console.error("Erreur lors de la récupération des détails :", err);
  }
};

function App() {
  const [webtoon, setWebtoon] = useState(null);
  const [chapter, setChapter] = useState(null);

  const fetchChapterDetails = useCallback(async (slug, chapterNumber) => {
    setLoading(true);
    setError(null);

    try {
      const { data: webtoon } = await supabase
        .from('webtoons')
        .select('id, title')
        .eq('slug', slug)
        .single();

      if (!webtoon) {
        setError("Webtoon non trouvé.");
        return;
      }

      const { data: chapter } = await supabase
        .from('chapters')
        .select('*')
        .eq('slug', webtoon.slug)
        .eq('number', chapterNumber)
        .single();

      if (!chapter) {
        setError("Chapitre non trouvé.");
        return;
      }

      setChapterData({
        webtoonInfo: { id: webtoon.slug, title: webtoon.title },
        currentChapter: chapter,
        // Ajoutez les autres données nécessaires ici
      });
    } catch (err) {
      console.error("Erreur lors du chargement des données :", err);
      setError("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  }, []);

  const navigateToChapterBySlugAndNumber = (slug, chapterNumber) => {
    navigate(`/webtoon/${slug}/chapter/${chapterNumber}`);
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="webtoons" element={<AllWebtoonsPage />} />
          <Route path="webtoon/:slug" element={<WebtoonDetailPage />} />
          <Route path="/webtoon/:slug/chapitre/:chapterNumber" element={<ReaderPage />} />
          <Route path="/webtoon/:slug/chapter/:chapterNumber" element={<ReaderPage />} />
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
              <Route path="webtoons/edit/:slug" element={<AdminWebtoonForm />} />
              <Route path="webtoons/:slug/upload" element={<AdminChapterUpload />} />
              <Route path="webtoons/:slug/chapters/:chapterNumber/edit" element={<AdminChapterEdit />} />
              <Route path="webtoon/:slug/chapter/:chapterNumber" element={<ReaderPage />} />
              <Route path="users" element={<AdminUserList />} /> 
              <Route path="roles" element={<AdminRoleList />} /> 
              <Route path="comments" element={<AdminCommentList />} />
              <Route path="popups" element={<AdminPopupManager />} />
           </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
      {webtoon && chapter ? (
        <Link to={`/webtoon/${webtoon.slug}/chapter/${chapter.number}`}>
          Lire Chapitre {chapter.number}
        </Link>
      ) : (
        <p>Chargement des données...</p>
      )}
    </>
  );
}

export default App;
