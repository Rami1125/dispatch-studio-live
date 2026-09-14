import type { DriveMediaItem } from "@/types/screensaver";
import { getAccessToken } from "./googleAuthService";

export const DEFAULT_DRIVE_FOLDER_ID = "1SZdhFhiCx1X3FdXF7Rr4lQ3-7Tc0xSDr";

// High-fidelity curated fallback media for Saban logistics in case folder is empty or not yet populated
export const FALLBACK_MEDIA_ITEMS: DriveMediaItem[] = [
  {
    id: "saban-safety-video-1",
    name: "סרטון הדרכה 01: בטיחות בהפעלת מנוף וקשירת משטחים — ח. סבן",
    mimeType: "video/mp4",
    type: "video",
    embedUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    downloadUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailLink:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
    durationSeconds: 15,
    createdTime: "2026-09-14T08:00:00.000Z",
  },
  {
    id: "saban-safety-video-2",
    name: "סרטון תדריך נהגים 02: בדיקת מטען לפני יציאה לכביש 1 ו-431",
    mimeType: "video/mp4",
    type: "video",
    embedUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    downloadUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailLink:
      "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=600&q=80",
    durationSeconds: 15,
    createdTime: "2026-09-14T08:30:00.000Z",
  },
  {
    id: "saban-presentation-1",
    name: "מצגת תפעולית: נוהלי קבלת סחורה וניפוק בלות במגרש 4 החרש",
    mimeType: "application/vnd.google-apps.presentation",
    type: "presentation",
    embedUrl:
      "https://docs.google.com/presentation/d/e/2PACX-1vT2Nq_0QOaB5qVb9d1b-placeholder/embed?start=true&loop=true&delayms=5000",
    webViewLink: "https://docs.google.com/presentation/",
    thumbnailLink:
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=600&q=80",
    createdTime: "2026-09-14T07:15:00.000Z",
  },
  {
    id: "saban-presentation-2",
    name: "מצגת בטיחות חורף: נהיגה בגשם ושמירת מרחק עם משאיות פול-טריילר",
    mimeType: "application/vnd.google-apps.presentation",
    type: "presentation",
    embedUrl:
      "https://docs.google.com/presentation/d/e/2PACX-1vS7-winter-safety-placeholder/embed?start=true&loop=true&delayms=5000",
    webViewLink: "https://docs.google.com/presentation/",
    thumbnailLink:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80",
    createdTime: "2026-09-14T06:00:00.000Z",
  },
];

export interface DriveFolderContentResponse {
  items: DriveMediaItem[];
  fromGoogleDrive: boolean;
  folderId: string;
  error?: string;
  totalVideos: number;
  totalPresentations: number;
}

/**
 * Fetches media files from the specified Google Drive folder.
 * If authenticated via Google OAuth, queries the live Google Drive API.
 * Returns parsed video and presentation media items.
 */
export async function fetchGoogleDriveFolderMedia(
  folderId: string = DEFAULT_DRIVE_FOLDER_ID,
): Promise<DriveFolderContentResponse> {
  const token = await getAccessToken();

  if (!token) {
    // Return curated Saban items with note that live Drive sync is waiting for Google Auth
    const videos = FALLBACK_MEDIA_ITEMS.filter((i) => i.type === "video");
    const pres = FALLBACK_MEDIA_ITEMS.filter((i) => i.type === "presentation");
    return {
      items: FALLBACK_MEDIA_ITEMS,
      fromGoogleDrive: false,
      folderId,
      totalVideos: videos.length,
      totalPresentations: pres.length,
      error: "נדרשת התחברות עם חשבון Google לסנכרון חי מהתיקייה",
    };
  }

  try {
    const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const fields = encodeURIComponent(
      "files(id, name, mimeType, description, webViewLink, webContentLink, thumbnailLink, createdTime, size, videoMediaMetadata)",
    );
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=50&orderBy=createdTime desc`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Drive API error: ${res.status}`);
    }

    const data = await res.json();
    const driveFiles = data.files || [];

    const mappedItems: DriveMediaItem[] = driveFiles.map(
      (f: {
        id: string;
        name: string;
        mimeType: string;
        webViewLink?: string;
        webContentLink?: string;
        thumbnailLink?: string;
        createdTime?: string;
        size?: string;
        videoMediaMetadata?: { durationMillis?: string };
      }) => {
        const isVideo =
          f.mimeType.startsWith("video/") || /\.(mp4|mov|webm|m4v|mkv|avi)$/i.test(f.name);
        const isPresentation =
          f.mimeType === "application/vnd.google-apps.presentation" ||
          /\.(ppt|pptx)$/i.test(f.name);

        let embedUrl = "";
        if (isPresentation) {
          embedUrl = `https://docs.google.com/presentation/d/${f.id}/embed?start=true&loop=true&delayms=5000`;
        } else if (isVideo) {
          embedUrl = `https://drive.google.com/file/d/${f.id}/preview`;
        } else {
          embedUrl = f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`;
        }

        const durationMillis = f.videoMediaMetadata?.durationMillis;
        const durationSeconds = durationMillis
          ? Math.round(parseInt(durationMillis, 10) / 1000)
          : undefined;

        return {
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          type: isVideo ? "video" : isPresentation ? "presentation" : "other",
          webViewLink: f.webViewLink,
          webContentLink: f.webContentLink,
          thumbnailLink: f.thumbnailLink,
          embedUrl,
          downloadUrl: f.webContentLink,
          durationSeconds,
          sizeBytes: f.size ? parseInt(f.size, 10) : undefined,
          createdTime: f.createdTime,
        };
      },
    );

    // If folder currently has no files uploaded, supply the ready fallback files
    const finalItems = mappedItems.length > 0 ? mappedItems : FALLBACK_MEDIA_ITEMS;
    const videos = finalItems.filter((i) => i.type === "video");
    const pres = finalItems.filter((i) => i.type === "presentation");

    return {
      items: finalItems,
      fromGoogleDrive: mappedItems.length > 0,
      folderId,
      totalVideos: videos.length,
      totalPresentations: pres.length,
    };
  } catch (err: unknown) {
    console.warn("Drive sync failed, utilizing fallback media:", err);
    const videos = FALLBACK_MEDIA_ITEMS.filter((i) => i.type === "video");
    const pres = FALLBACK_MEDIA_ITEMS.filter((i) => i.type === "presentation");
    return {
      items: FALLBACK_MEDIA_ITEMS,
      fromGoogleDrive: false,
      folderId,
      totalVideos: videos.length,
      totalPresentations: pres.length,
      error: err instanceof Error ? err.message : "שגיאה בגישה לתיקייה ב-Google Drive",
    };
  }
}
