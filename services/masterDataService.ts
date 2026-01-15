import { supabase } from '../lib/supabaseClient';

export interface MasterItem {
  id: string;
  name: string;
  description: string;
  code?: string;
  type: string;
}

export const getMasterDataByType = async (type: string): Promise<MasterItem[]> => {
  const { data, error } = await supabase
    .from('master_data')
    .select('*')
    .eq('type', type)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as MasterItem[];
};

export const createMasterData = async (item: Omit<MasterItem, 'id'>): Promise<MasterItem> => {
  const { data, error } = await supabase
    .from('master_data')
    .insert([item])
    .select()
    .single();

  if (error) throw error;
  return data as MasterItem;
};

export const updateMasterData = async (id: string, updates: Partial<MasterItem>): Promise<MasterItem> => {
  const { data, error } = await supabase
    .from('master_data')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as MasterItem;
};

export const deleteMasterData = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('master_data')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
