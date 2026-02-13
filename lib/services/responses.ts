/**
 * Response CRUD service
 *
 * Handles creation and retrieval of user responses to prompts.
 * Orchestrates image upload before database insertion.
 */

import { supabase } from '@/lib/supabase';
import { Response, CreateResponseInput } from '@/lib/schemas/response';
import { uploadResponseImages } from './imageUpload';

/**
 * Create a new response
 * Uploads images to Storage, then inserts response record to database
 * @param userId - User ID creating the response
 * @param input - Response data with local image URIs
 * @returns Created response record
 */
export async function createResponse(
  userId: string,
  input: CreateResponseInput
): Promise<Response> {
  try {
    // Generate response ID upfront (needed for Storage file naming)
    const responseId = crypto.randomUUID();

    // Upload images to Supabase Storage and get public URLs
    const imageUrls = await uploadResponseImages(
      input.image_uris,
      userId,
      responseId
    );

    // Insert response to database
    const { data, error } = await supabase
      .from('responses')
      .insert({
        id: responseId,
        user_id: userId,
        prompt_id: input.prompt_id,
        image_urls: imageUrls,
        notes: input.notes,
        tags: input.tags,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database insert failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('Insert succeeded but no data returned');
    }

    return data as Response;
  } catch (error) {
    console.error('Error creating response:', error);
    throw new Error(`Failed to create response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all responses for a specific prompt
 * @param userId - User ID to filter by
 * @param promptId - Prompt ID to filter by
 * @returns Array of responses (empty if none)
 */
export async function getResponsesForPrompt(
  userId: string,
  promptId: string
): Promise<Response[]> {
  const { data, error } = await supabase
    .from('responses')
    .select('*')
    .eq('user_id', userId)
    .eq('prompt_id', promptId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch responses: ${error.message}`);
  }

  return (data as Response[]) || [];
}

/**
 * Get all responses for a specific prompt with signed image URLs
 * This version generates signed URLs for all images so they can be displayed
 * @param userId - User ID to filter by
 * @param promptId - Prompt ID to filter by
 * @returns Array of responses with signed image URLs (empty if none)
 */
export async function getResponsesForPromptWithImages(
  userId: string,
  promptId: string
): Promise<Response[]> {
  // Dev mode fallback when no userId
  if (!userId && __DEV__) {
    return [
      {
        id: 'dev-response-1',
        user_id: 'dev',
        prompt_id: promptId,
        image_urls: [
          'https://via.placeholder.com/400x400.png?text=Sample+Image+1',
          'https://via.placeholder.com/400x400.png?text=Sample+Image+2',
        ],
        notes: 'Sample response notes for development',
        tags: ['dev', 'sample'],
        created_at: new Date().toISOString(),
      },
    ];
  }

  const { data, error } = await supabase
    .from('responses')
    .select('*')
    .eq('user_id', userId)
    .eq('prompt_id', promptId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch responses: ${error.message}`);
  }

  const responses = (data as Response[]) || [];

  // Generate signed URLs for all images
  const responsesWithSignedUrls = await Promise.all(
    responses.map(async (response) => {
      const signedUrls = await Promise.all(
        response.image_urls.map(async (url) => {
          try {
            const { data: signedData, error: signError } = await supabase.storage
              .from('responses')
              .createSignedUrl(url, 3600); // 1 hour expiry

            if (signError) {
              console.error('Error generating signed URL:', signError);
              return url; // Return original URL if signing fails
            }

            return signedData.signedUrl;
          } catch (err) {
            console.error('Error in createSignedUrl:', err);
            return url; // Return original URL if signing fails
          }
        })
      );

      return {
        ...response,
        image_urls: signedUrls,
      };
    })
  );

  return responsesWithSignedUrls;
}
