import fetch from "node-fetch";
import { getConfig } from "../config.js";

// Minimal shapes for the parts of the Zillow payload we care about.
export interface ZillowAddress {
  streetAddress?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}

export interface ZillowMiniCardPhoto {
  url?: string;
}

export interface ZillowMiniCardListing {
  zpid?: number;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  livingAreaValue?: number;
  address?: ZillowAddress;
  miniCardPhotos?: ZillowMiniCardPhoto[];
}

export interface ZillowOriginalPhotoSource {
  url?: string;
  width?: number;
}

export interface ZillowOriginalPhoto {
  mixedSources?: {
    jpeg?: ZillowOriginalPhotoSource[];
    webp?: ZillowOriginalPhotoSource[];
  };
}

export interface ZillowPropImagesResponse {
  propertyURL?: string;
  hiResImageLink?: string;
  streetViewImageUrl?: string;
  originalPhotos?: ZillowOriginalPhoto[];
}

export interface ZillowByUrlResponse {
  zpid?: number;
  price?: number;
  zestimate?: number;
  bedrooms?: number;
  bathrooms?: number;
  livingAreaValue?: number;
  address?: ZillowAddress;
  homeStatus?: string;
  hiResImageLink?: string;
  desktopWebHdpImageLink?: string;
  originalPhotos?: ZillowOriginalPhoto[];
  webp?: ZillowOriginalPhotoSource[];
  thumb?: { url?: string }[];
  neighborhoodMapThumb?: { url?: string }[];
  collections?: {
    modules?: {
      propertyDetails?: ZillowMiniCardListing[];
    }[];
  };
}

export async function fetchZillowByUrl(
  url: string,
): Promise<ZillowByUrlResponse> {
  const config = getConfig();
  if (!config.zillow) {
    throw new Error(
      "[zillow] ZILLOW_API_KEY / ZILLOW_API_HOST are not configured.",
    );
  }

  const { apiKey, host } = config.zillow;

  const endpoint = new URL(
    "https://private-zillow.p.rapidapi.com/pro/byurl",
  );
  endpoint.searchParams.set("url", url);

  const response = await fetch(endpoint.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": host,
    },
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    console.error(
      "[zillow] Non-200 response",
      response.status,
      response.statusText,
    );
    if (bodyText) {
      console.error("[zillow] Response body (truncated):", bodyText.slice(0, 500));
    }
    throw new Error("[zillow] Failed to fetch listing from Zillow API.");
  }

  const payload = (await response.json()) as {
    propertyDetails?: ZillowByUrlResponse;
  };

  const details = payload.propertyDetails ?? ({} as ZillowByUrlResponse);

  console.log(
    "[zillow] Fetched Zillow property by URL",
    url,
    "zpid:",
    details.zpid,
  );

  return details;
}

export async function fetchZillowPropImages(args: {
  zpid?: string | number;
  url?: string;
  address?: string;
}): Promise<ZillowPropImagesResponse> {
  const config = getConfig();
  if (!config.zillow) {
    throw new Error(
      "[zillow] ZILLOW_API_KEY / ZILLOW_API_HOST are not configured.",
    );
  }

  const { apiKey, host } = config.zillow;

  const endpoint = new URL("https://private-zillow.p.rapidapi.com/propimages");
  if (args.zpid !== undefined) endpoint.searchParams.set("byzpid", String(args.zpid));
  if (args.url) endpoint.searchParams.set("byurl", args.url);
  if (args.address) endpoint.searchParams.set("byaddress", args.address);

  const response = await fetch(endpoint.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": host,
    },
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    console.error(
      "[zillow] Non-200 response (propimages)",
      response.status,
      response.statusText,
    );
    if (bodyText) {
      console.error(
        "[zillow] Response body (truncated):",
        bodyText.slice(0, 500),
      );
    }
    throw new Error("[zillow] Failed to fetch property images from Zillow API.");
  }

  const payload = (await response.json()) as {
    propertyDetails?: ZillowPropImagesResponse;
  } & ZillowPropImagesResponse;  // Some RapidAPI proxies wrap in `propertyDetails`; others return directly.
  const details = payload.propertyDetails ?? payload;
  return details;
}
