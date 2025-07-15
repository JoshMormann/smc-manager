import { supabase } from './supabase';
import { Database } from '../types/database';
import { captureException } from './sentry';

// Type definitions based on our database schema
export type SREFCode = Database['public']['Tables']['sref_codes']['Row'] & {
  images: Database['public']['Tables']['code_images']['Row'][];
  tags: string[];
};

export type SREFCodeInsert = Database['public']['Tables']['sref_codes']['Insert'] & {
  images: string[];
  tags: string[];
};

export type SREFCodeUpdate = Database['public']['Tables']['sref_codes']['Update'] & {
  images?: string[];
  tags?: string[];
};

export type Folder = Database['public']['Tables']['folders']['Row'];
export type FolderInsert = Database['public']['Tables']['folders']['Insert'];
export type FolderUpdate = Database['public']['Tables']['folders']['Update'];

// SREF Codes Operations
export class SREFCodeService {
  // Get all SREF codes for the current user with images and tags
  static async getUserSREFCodes(userId: string): Promise<{ data: SREFCode[] | null; error: Error | null }> {
    try {
      const { data: codes, error } = await supabase
        .from('sref_codes')
        .select(`
          *,
          code_images (
            id,
            image_url,
            position
          ),
          code_tags (
            tag
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        captureException(error, { tags: { operation: 'get_user_sref_codes' } });
        return { data: null, error };
      }

      // Transform the data to match our expected format
      const transformedCodes: SREFCode[] = codes?.map(code => ({
        ...code,
        images: code.code_images?.sort((a, b) => a.position - b.position) || [],
        tags: code.code_tags?.map(tag => tag.tag) || []
      })) || [];

      return { data: transformedCodes, error: null };
    } catch (error) {
      captureException(error, { tags: { operation: 'get_user_sref_codes' } });
      return { data: null, error };
    }
  }

  // Get a single SREF code by ID
  static async getSREFCodeById(codeId: string): Promise<{ data: SREFCode | null; error: Error | null }> {
    try {
      const { data: code, error } = await supabase
        .from('sref_codes')
        .select(`
          *,
          code_images (
            id,
            image_url,
            position
          ),
          code_tags (
            tag
          )
        `)
        .eq('id', codeId)
        .single();

      if (error) {
        captureException(error, { tags: { operation: 'get_sref_code_by_id' } });
        return { data: null, error };
      }

      const transformedCode: SREFCode = {
        ...code,
        images: code.code_images?.sort((a, b) => a.position - b.position) || [],
        tags: code.code_tags?.map(tag => tag.tag) || []
      };

      return { data: transformedCode, error: null };
    } catch (error) {
      captureException(error, { tags: { operation: 'get_sref_code_by_id' } });
      return { data: null, error };
    }
  }

  // Create a new SREF code
  static async createSREFCode(srefCode: SREFCodeInsert): Promise<{ data: SREFCode | null; error: Error | null }> {
    try {
      // Start a transaction-like operation
      const { data: newCode, error: codeError } = await supabase
        .from('sref_codes')
        .insert({
          user_id: srefCode.user_id,
          code_value: srefCode.code_value,
          sv_version: srefCode.sv_version,
          title: srefCode.title
        })
        .select()
        .single();

      if (codeError || !newCode) {
        captureException(codeError, { tags: { operation: 'create_sref_code' } });
        return { data: null, error: codeError };
      }

      // Add images if provided
      if (srefCode.images && srefCode.images.length > 0) {
        const imageInserts = srefCode.images.map((imageUrl, index) => ({
          code_id: newCode.id,
          image_url: imageUrl,
          position: index
        }));

        const { error: imagesError } = await supabase
          .from('code_images')
          .insert(imageInserts);

        if (imagesError) {
          captureException(imagesError, { tags: { operation: 'create_sref_code_images' } });
          // Don't return error, just log it
        }
      }

      // Add tags if provided
      if (srefCode.tags && srefCode.tags.length > 0) {
        const tagInserts = srefCode.tags.map(tag => ({
          code_id: newCode.id,
          tag: tag
        }));

        const { error: tagsError } = await supabase
          .from('code_tags')
          .insert(tagInserts);

        if (tagsError) {
          captureException(tagsError, { tags: { operation: 'create_sref_code_tags' } });
          // Don't return error, just log it
        }
      }

      // Fetch the complete record with images and tags
      return await this.getSREFCodeById(newCode.id);
    } catch (error) {
      captureException(error, { tags: { operation: 'create_sref_code' } });
      return { data: null, error };
    }
  }

  // Update an existing SREF code
  static async updateSREFCode(codeId: string, updates: SREFCodeUpdate): Promise<{ data: SREFCode | null; error: Error | null }> {
    try {
      // Update the main record
      const { data: updatedCode, error: codeError } = await supabase
        .from('sref_codes')
        .update({
          code_value: updates.code_value,
          sv_version: updates.sv_version,
          title: updates.title,
          updated_at: new Date().toISOString()
        })
        .eq('id', codeId)
        .select()
        .single();

      if (codeError || !updatedCode) {
        captureException(codeError, { tags: { operation: 'update_sref_code' } });
        return { data: null, error: codeError };
      }

      // Update images if provided
      if (updates.images !== undefined) {
        // Delete existing images
        await supabase
          .from('code_images')
          .delete()
          .eq('code_id', codeId);

        // Insert new images
        if (updates.images.length > 0) {
          const imageInserts = updates.images.map((imageUrl, index) => ({
            code_id: codeId,
            image_url: imageUrl,
            position: index
          }));

          const { error: imagesError } = await supabase
            .from('code_images')
            .insert(imageInserts);

          if (imagesError) {
            captureException(imagesError, { tags: { operation: 'update_sref_code_images' } });
          }
        }
      }

      // Update tags if provided
      if (updates.tags !== undefined) {
        // Delete existing tags
        await supabase
          .from('code_tags')
          .delete()
          .eq('code_id', codeId);

        // Insert new tags
        if (updates.tags.length > 0) {
          const tagInserts = updates.tags.map(tag => ({
            code_id: codeId,
            tag: tag
          }));

          const { error: tagsError } = await supabase
            .from('code_tags')
            .insert(tagInserts);

          if (tagsError) {
            captureException(tagsError, { tags: { operation: 'update_sref_code_tags' } });
          }
        }
      }

      // Fetch the updated complete record
      return await this.getSREFCodeById(codeId);
    } catch (error) {
      captureException(error, { tags: { operation: 'update_sref_code' } });
      return { data: null, error };
    }
  }

  // Delete an SREF code
  static async deleteSREFCode(codeId: string): Promise<{ error: Error | null }> {
    try {
      // The foreign key constraints will handle deleting related images and tags
      const { error } = await supabase
        .from('sref_codes')
        .delete()
        .eq('id', codeId);

      if (error) {
        captureException(error, { tags: { operation: 'delete_sref_code' } });
      }

      return { error };
    } catch (error) {
      captureException(error, { tags: { operation: 'delete_sref_code' } });
      return { error };
    }
  }

  // Search SREF codes
  static async searchSREFCodes(userId: string, query: string, tags: string[] = []): Promise<{ data: SREFCode[] | null; error: Error | null }> {
    try {
      let queryBuilder = supabase
        .from('sref_codes')
        .select(`
          *,
          code_images (
            id,
            image_url,
            position
          ),
          code_tags (
            tag
          )
        `)
        .eq('user_id', userId);

      // Add text search
      if (query.trim()) {
        queryBuilder = queryBuilder.or(`title.ilike.%${query}%,code_value.ilike.%${query}%`);
      }

      const { data: codes, error } = await queryBuilder
        .order('created_at', { ascending: false });

      if (error) {
        captureException(error, { tags: { operation: 'search_sref_codes' } });
        return { data: null, error };
      }

      // Transform and filter by tags
      let transformedCodes: SREFCode[] = codes?.map(code => ({
        ...code,
        images: code.code_images?.sort((a, b) => a.position - b.position) || [],
        tags: code.code_tags?.map(tag => tag.tag) || []
      })) || [];

      // Filter by tags if provided
      if (tags.length > 0) {
        transformedCodes = transformedCodes.filter(code =>
          tags.some(tag => code.tags.includes(tag))
        );
      }

      return { data: transformedCodes, error: null };
    } catch (error) {
      captureException(error, { tags: { operation: 'search_sref_codes' } });
      return { data: null, error };
    }
  }

  // Get all unique tags for a user
  static async getUserTags(userId: string): Promise<{ data: string[] | null; error: Error | null }> {
    try {
      // Get code IDs first
      const { data: codeIds, error: codeError } = await supabase
        .from('sref_codes')
        .select('id')
        .eq('user_id', userId);

      if (codeError) {
        captureException(codeError, { tags: { operation: 'get_user_tags_codes' } });
        return { data: null, error: codeError };
      }

      const codeIdsList = codeIds?.map(c => c.id) || [];
      
      if (codeIdsList.length === 0) {
        return { data: [], error: null };
      }

      const { data: tags, error } = await supabase
        .from('code_tags')
        .select('tag')
        .in('code_id', codeIdsList);

      if (error) {
        captureException(error, { tags: { operation: 'get_user_tags' } });
        return { data: null, error };
      }

      // Get unique tags
      const uniqueTags = [...new Set(tags?.map(t => t.tag) || [])].sort();
      return { data: uniqueTags, error: null };
    } catch (error) {
      captureException(error, { tags: { operation: 'get_user_tags' } });
      return { data: null, error };
    }
  }
}

// Folder Operations
export class FolderService {
  // Get all folders for a user
  static async getUserFolders(userId: string): Promise<{ data: Folder[] | null; error: Error | null }> {
    try {
      const { data: folders, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        captureException(error, { tags: { operation: 'get_user_folders' } });
        return { data: null, error };
      }

      return { data: folders, error: null };
    } catch (error) {
      captureException(error, { tags: { operation: 'get_user_folders' } });
      return { data: null, error };
    }
  }

  // Create a new folder
  static async createFolder(folder: FolderInsert): Promise<{ data: Folder | null; error: Error | null }> {
    try {
      const { data: newFolder, error } = await supabase
        .from('folders')
        .insert(folder)
        .select()
        .single();

      if (error) {
        captureException(error, { tags: { operation: 'create_folder' } });
        return { data: null, error };
      }

      return { data: newFolder, error: null };
    } catch (error) {
      captureException(error, { tags: { operation: 'create_folder' } });
      return { data: null, error };
    }
  }

  // Update a folder
  static async updateFolder(folderId: string, updates: FolderUpdate): Promise<{ data: Folder | null; error: Error | null }> {
    try {
      const { data: updatedFolder, error } = await supabase
        .from('folders')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', folderId)
        .select()
        .single();

      if (error) {
        captureException(error, { tags: { operation: 'update_folder' } });
        return { data: null, error };
      }

      return { data: updatedFolder, error: null };
    } catch (error) {
      captureException(error, { tags: { operation: 'update_folder' } });
      return { data: null, error };
    }
  }

  // Delete a folder
  static async deleteFolder(folderId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) {
        captureException(error, { tags: { operation: 'delete_folder' } });
      }

      return { error };
    } catch (error) {
      captureException(error, { tags: { operation: 'delete_folder' } });
      return { error };
    }
  }
}