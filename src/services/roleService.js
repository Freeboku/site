
import { supabase } from '@/lib/supabaseClient';

export const getCustomRoles = async () => {
  const { data, error } = await supabase
    .from('roles')
    .select('id, name, description, created_at, updated_at')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching custom roles:', error.message);
    throw error;
  }
  return data;
};

export const createCustomRole = async (name, description) => {
  if (!name || name.trim() === '') {
    throw new Error("Le nom du rôle ne peut pas être vide.");
  }
  if (name.toLowerCase() === 'admin' || name.toLowerCase() === 'user') {
    throw new Error("Les rôles 'admin' et 'user' sont réservés et ne peuvent pas être créés.");
  }

  const { data, error } = await supabase
    .from('roles')
    .insert([{ name: name.trim(), description: description?.trim() || null }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { 
      throw new Error(`Le rôle "${name.trim()}" existe déjà.`);
    }
    console.error('Error creating custom role:', error.message);
    throw error;
  }
  return data;
};

export const updateCustomRole = async (id, name, description) => {
  if (!name || name.trim() === '') {
    throw new Error("Le nom du rôle ne peut pas être vide.");
  }
  if (name.toLowerCase() === 'admin' || name.toLowerCase() === 'user') {
    throw new Error("Les rôles 'admin' et 'user' sont réservés et ne peuvent pas être modifiés via cette interface.");
  }

  const { data, error } = await supabase
    .from('roles')
    .update({ name: name.trim(), description: description?.trim() || null })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { 
      throw new Error(`Un autre rôle avec le nom "${name.trim()}" existe déjà.`);
    }
    console.error('Error updating custom role:', error.message);
    throw error;
  }
  return data;
};

export const deleteCustomRole = async (id) => {
  const { data: roleToDelete, error: fetchError } = await supabase
    .from('roles')
    .select('name')
    .eq('id', id)
    .single();

  if (fetchError || !roleToDelete) {
    console.error('Error fetching role for deletion or role not found:', fetchError?.message);
    throw new Error("Rôle non trouvé ou erreur lors de la récupération.");
  }

  if (roleToDelete.name.toLowerCase() === 'admin' || roleToDelete.name.toLowerCase() === 'user') {
    throw new Error("Les rôles 'admin' et 'user' sont réservés et ne peuvent pas être supprimés.");
  }

  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting custom role:', error.message);
    throw error;
  }
  return true;
};
