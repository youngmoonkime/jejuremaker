
// utils/imageOptimizer.ts
export const getOptimizedImageUrl = (url: string, width: number = 400, quality: number = 80): string => {
    if (!url) return '';
    // Check if it's a Supabase Storage URL
    if (url.includes('supabase.co/storage/v1/object/public')) {
        // Replace /object/public/ with /render/image/public/ for transformation
        const transformedUrl = url.replace('/object/public/', '/render/image/public/');
        return `${transformedUrl}?width=${width}&quality=${quality}&format=origin`;
    }
    // Return original if not a Supabase URL (e.g., Google user content)
    return url;
};
