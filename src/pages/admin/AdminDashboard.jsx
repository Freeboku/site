
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookCopy, PlusCircle, Users, Loader2, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient'; 

const AdminDashboard = () => {
  const [webtoonCount, setWebtoonCount] = useState(0);
  const [chapterCount, setChapterCount] = useState(0);
  const [totalWebtoonViews, setTotalWebtoonViews] = useState(0);
  const [totalChapterViews, setTotalChapterViews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      setError(null);
      try {
        const { count: wtCount, error: wtError } = await supabase
          .from('webtoons')
          .select('*', { count: 'exact', head: true });
        if (wtError) throw wtError;

        const { count: chCount, error: chError } = await supabase
          .from('chapters')
          .select('*', { count: 'exact', head: true });
        if (chError) throw chError;

        const { data: webtoonViewsData, error: webtoonViewsError } = await supabase
          .from('webtoons')
          .select('views');
        if (webtoonViewsError) throw webtoonViewsError;
        const totalWtViews = webtoonViewsData.reduce((sum, wt) => sum + (wt.views || 0), 0);

        const { data: chapterViewsData, error: chapterViewsError } = await supabase
          .from('chapters')
          .select('views');
        if (chapterViewsError) throw chapterViewsError;
        const totalChViews = chapterViewsData.reduce((sum, ch) => sum + (ch.views || 0), 0);
        
        setWebtoonCount(wtCount || 0);
        setChapterCount(chCount || 0);
        setTotalWebtoonViews(totalWtViews);
        setTotalChapterViews(totalChViews);

      } catch (err) {
        console.error("Failed to fetch dashboard counts:", err);
        setError("Impossible de charger les statistiques.");
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const StatCard = ({ title, value, icon: Icon, isLoading }) => (
     <motion.div variants={cardVariants}>
       <Card className="bg-card/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
           <CardTitle className="text-sm font-medium">{title}</CardTitle>
           {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
         </CardHeader>
         <CardContent>
           {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
           ) : (
             <div className="text-2xl font-bold">{value}</div>
           )}
         </CardContent>
       </Card>
     </motion.div>
  );


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold">Tableau de Bord Admin</h1>

       {error && (
         <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>
       )}

      <motion.div
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
         <StatCard title="Webtoons Gérés" value={webtoonCount} icon={BookCopy} isLoading={loading} />
         <StatCard title="Chapitres Uploadés" value={chapterCount} icon={BookCopy} isLoading={loading} />
         <StatCard title="Total Vues Webtoons" value={totalWebtoonViews.toLocaleString()} icon={Eye} isLoading={loading} />
         <StatCard title="Total Vues Chapitres" value={totalChapterViews.toLocaleString()} icon={Eye} isLoading={loading} />

        <motion.div variants={cardVariants} className="lg:col-span-2">
           <Card className="bg-card/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow opacity-50">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
               <Users className="h-5 w-5 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">N/A</div>
               <p className="text-xs text-muted-foreground">Fonctionnalité à venir</p>
             </CardContent>
           </Card>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="pt-6 border-t border-border"
      >
        <h2 className="text-xl font-semibold mb-4">Actions Rapides</h2>
        <div className="flex flex-wrap gap-4">
          <Button asChild>
            <Link to="/admin/webtoons/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un Webtoon
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/webtoons">
              <BookCopy className="mr-2 h-4 w-4" /> Voir tous les Webtoons
            </Link>
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;
