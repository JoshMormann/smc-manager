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
  imageDiff?: {
    imagesToDelete: string[];
    imagesToAdd: string[];
  };
  tagDiff?: {
    tagsToDelete: string[];
    tagsToAdd: string[];
  };
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
      return { data: null, error: error as Error };
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
      return { data: null, error: error as Error };
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
      return { data: null, error: error as Error };
    }
  }

  // Update an existing SREF code
  static async updateSREFCode(codeId: string, updates: SREFCodeUpdate): Promise<{ data: SREFCode | null; error: Error | null }> {
    try {
      // Build selective update payload for main record
      const mainRecordUpdate: any = {
        updated_at: new Date().toISOString()
      };
      
      // Only include fields that were actually provided
      if (updates.title !== undefined) mainRecordUpdate.title = updates.title;
      if (updates.code_value !== undefined) mainRecordUpdate.code_value = updates.code_value;
      if (updates.sv_version !== undefined) mainRecordUpdate.sv_version = updates.sv_version;
      
      console.log('🔍 Updating main record with:', mainRecordUpdate);
      
      // Update the main record
      const { data: updatedCode, error: codeError } = await supabase
        .from('sref_codes')
        .update(mainRecordUpdate)
        .eq('id', codeId)
        .select()
        .single();

      if (codeError || !updatedCode) {
        captureException(codeError, { tags: { operation: 'update_sref_code' } });
        return { data: null, error: codeError };
      }

      // TODO: CRITICAL - Replace with UUID-based granular image operations
      // CURRENT PROBLEM: "Delete all, re-insert all" approach causing duplications
      // Delete operation returns count: 0 (failing silently) but inserts work
      // Result: Original images stay + new images inserted = duplicates
      //
      // TOMORROW'S IMPLEMENTATION:
      // 1. Change SREFCodeUpdate interface to include:
      //    - imagesToDelete: string[] (UUIDs or image_urls to remove)
      //    - imagesToAdd: string[] (new image URLs to insert)
      // 2. Delete only specific images by UUID: DELETE WHERE id IN (uuid1, uuid2)
      // 3. Insert only new images
      // 4. Investigate why current delete returns count 0 (RLS policies?)
      
      // Handle images with granular diffing or full replacement
      if (updates.imageDiff) {
        // NEW: Granular image update approach
        const { imagesToDelete, imagesToAdd } = updates.imageDiff;
        
        console.log('🔍 Granular image update:', { imagesToDelete, imagesToAdd });
        
        // Delete specific images by URL
        if (imagesToDelete.length > 0) {
          const { error: deleteError, count: deletedCount } = await supabase
            .from('code_images')
            .delete({ count: 'exact' })
            .eq('code_id', codeId)
            .in('image_url', imagesToDelete);

          if (deleteError) {
            captureException(deleteError, { 
              tags: { 
                operation: 'granular_delete_images',
                code_id: codeId 
              } 
            });
            console.error('🚨 Granular DELETE FAILED:', deleteError);
          } else {
            console.log(`✅ Granular delete: removed ${deletedCount} specific images`);
          }
        }
        
        // Insert only new images
        if (imagesToAdd.length > 0) {
          // Get current max position to maintain order
          const { data: maxPositionData } = await supabase
            .from('code_images')
            .select('position')
            .eq('code_id', codeId)
            .order('position', { ascending: false })
            .limit(1);
            
          const startPosition = (maxPositionData?.[0]?.position ?? -1) + 1;
          
          const imageInserts = imagesToAdd.map((imageUrl, index) => ({
            code_id: codeId,
            image_url: imageUrl,
            position: startPosition + index
          }));

          const { error: imagesError, count: insertedCount } = await supabase
            .from('code_images')
            .insert(imageInserts, { count: 'exact' });

          if (imagesError) {
            captureException(imagesError, { 
              tags: { 
                operation: 'granular_insert_images',
                code_id: codeId 
              } 
            });
            console.error('Granular INSERT FAILED:', imagesError);
          } else {
            console.log(`✅ Granular insert: added ${insertedCount} new images`);
          }
        }
      } else if (updates.images !== undefined) {
        // FALLBACK: Full replacement for new creations or legacy calls
        console.log('🔄 Full image replacement (legacy mode)');
        
        // Delete ALL existing images
        const { error: deleteError } = await supabase
          .from('code_images')
          .delete()
          .eq('code_id', codeId);

        if (deleteError) {
          captureException(deleteError, { 
            tags: { 
              operation: 'legacy_delete_all_images',
              code_id: codeId 
            } 
          });
        }

        // Insert all new images
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
            captureException(imagesError, { 
              tags: { 
                operation: 'legacy_insert_images',
                code_id: codeId 
              } 
            });
          }
        }
      }

      // Handle tags with granular diffing or full replacement
      if (updates.tagDiff) {
        // NEW: Granular tag update approach
        const { tagsToDelete, tagsToAdd } = updates.tagDiff;
        
        console.log('🔍 Granular tag update:', { tagsToDelete, tagsToAdd });
        
        // Delete specific tags by tag name
        if (tagsToDelete.length > 0) {
          const { error: deleteError, count: deletedCount } = await supabase
            .from('code_tags')
            .delete({ count: 'exact' })
            .eq('code_id', codeId)
            .in('tag', tagsToDelete);

          if (deleteError) {
            captureException(deleteError, { 
              tags: { 
                operation: 'granular_delete_tags',
                code_id: codeId 
              } 
            });
            console.error('🚨 Granular tag DELETE FAILED:', deleteError);
          } else {
            console.log(`✅ Granular delete: removed ${deletedCount} specific tags`);
          }
        }
        
        // Insert only new tags
        if (tagsToAdd.length > 0) {
          const tagInserts = tagsToAdd.map(tag => ({
            code_id: codeId,
            tag: tag
          }));

          const { error: tagsError, count: insertedCount } = await supabase
            .from('code_tags')
            .insert(tagInserts, { count: 'exact' });

          if (tagsError) {
            captureException(tagsError, { 
              tags: { 
                operation: 'granular_insert_tags',
                code_id: codeId 
              } 
            });
            console.error('Granular tag INSERT FAILED:', tagsError);
          } else {
            console.log(`✅ Granular insert: added ${insertedCount} new tags`);
          }
        }
      } else if (updates.tags !== undefined) {
        // FALLBACK: Full replacement for new creations or legacy calls
        console.log('🔄 Full tag replacement (legacy mode)');
        
        // Delete ALL existing tags
        const { error: deleteTagsError } = await supabase
          .from('code_tags')
          .delete()
          .eq('code_id', codeId);

        if (deleteTagsError) {
          captureException(deleteTagsError, { 
            tags: { 
              operation: 'legacy_delete_all_tags',
              code_id: codeId 
            } 
          });
        }

        // Insert all new tags
        if (updates.tags.length > 0) {
          const tagInserts = updates.tags.map(tag => ({
            code_id: codeId,
            tag: tag
          }));

          const { error: tagsError } = await supabase
            .from('code_tags')
            .insert(tagInserts);

          if (tagsError) {
            captureException(tagsError, { 
              tags: { 
                operation: 'legacy_insert_tags',
                code_id: codeId 
              } 
            });
          }
        }
      }

      // Fetch the updated complete record
      return await this.getSREFCodeById(codeId);
    } catch (error) {
      captureException(error, { tags: { operation: 'update_sref_code' } });
      return { data: null, error: error as Error };
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
      return { error: error as Error };
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
      return { data: null, error: error as Error };
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
      return { data: null, error: error as Error };
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
      return { data: null, error: error as Error };
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
      return { data: null, error: error as Error };
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
      return { data: null, error: error as Error };
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
      return { error: error as Error };
    }
  }
}