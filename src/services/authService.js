
import { supabase } from '@/lib/supabaseClient';

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    "/": '&#x2F;',
  };
  const reg = /[&<>"'/]/ig;
  return input.replace(reg, (match)=>(map[match]));
};

export const signIn = async ({ email, password }) => {
  const sanitizedEmail = sanitizeInput(email);
  const { data, error } = await supabase.auth.signInWithPassword({ email: sanitizedEmail, password });
  if (error) throw error;
  return data;
};

export const signUp = async ({ email, password, username }) => {
  const sanitizedEmail = sanitizeInput(email);
  const sanitizedUsername = sanitizeInput(username);

  if (!sanitizedUsername || sanitizedUsername.length < 3) {
    throw new Error("Le pseudo doit contenir au moins 3 caractères.");
  }
  if (sanitizedUsername.length > 50) {
    throw new Error("Le pseudo ne doit pas dépasser 50 caractères.");
  }
  if (!/^[a-zA-Z0-9_]+$/.test(sanitizedUsername)) {
    throw new Error("Le pseudo ne peut contenir que des lettres, des chiffres et des underscores (_).");
  }


  const { count, error: countError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('username', sanitizedUsername);

  if (countError) {
    console.error("Error checking username:", countError);
    throw new Error("Une erreur s'est produite lors de la vérification du pseudo.");
  }

  if (count > 0) {
    throw new Error("Ce pseudo est déjà pris.");
  }

  const { data, error } = await supabase.auth.signUp({
    email: sanitizedEmail,
    password,
    options: {
      data: {
        username: sanitizedUsername,
      },
    },
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
   const { data: { user } } = await supabase.auth.getUser();
   return user;
 };

export const getSession = async () => {
   const { data: { session } } = await supabase.auth.getSession();
   return session;
 };
