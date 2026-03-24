import { getPool } from "../db.js";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchZillowByUrl,
  ZillowByUrlResponse,
  ZillowMiniCardListing,
} from "../services/zillowClient.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const repoRoot = path.resolve(currentDir, "..", "..");

loadEnv(); // backend/.env
loadEnv({ path: path.join(repoRoot, ".env"), override: false }); // root .env

function parseArgs(): { url: string; maxListings: number } {
  const args = process.argv.slice(2);
  let url = "";
  let maxListings = 40;

  for (const arg of args) {
    const [key, value] = arg.split("=");
    if (!value) continue;
    if (key === "--url") url = value;
    if (key === "--max") {
      const n = Number(value);
      if (Number.isInteger(n) && n > 0 && n <= 200) {
        maxListings = n;
      }
    }
  }

  if (!url) {
    console.error(
      "[import-zillow] Missing --url argument (Zillow listing URL is required).",
    );
    process.exit(1);
  }

  return { url, maxListings };
}

type NormalizedListing = {
  externalId: string;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  status: string;
  image: string;
  imageUrls: string[];
  raw: unknown;
  zillowUrl?: string;
};

function collectRootPhotos(details: ZillowByUrlResponse): string[] {
  const urls = new Set<string>();

  if (details.hiResImageLink) urls.add(details.hiResImageLink);
  if (details.desktopWebHdpImageLink)
    urls.add(details.desktopWebHdpImageLink);

  if (Array.isArray(details.thumb)) {
    for (const t of details.thumb) {
      if (t?.url) urls.add(t.url);
    }
  }

  if (Array.isArray(details.neighborhoodMapThumb)) {
    for (const t of details.neighborhoodMapThumb) {
      if (t?.url) urls.add(t.url);
    }
  }

  if (Array.isArray(details.originalPhotos)) {
    for (const p of details.originalPhotos) {
      const jpeg = p.mixedSources?.jpeg ?? [];
      const webp = p.mixedSources?.webp ?? [];
      for (const s of [...jpeg, ...webp]) {
        if (s?.url) urls.add(s.url);
      }
    }
  }

  if (Array.isArray(details.webp)) {
    for (const s of details.webp) {
      if (s?.url) urls.add(s.url);
    }
  }

  return Array.from(urls);
}

function normalizeRoot(details: ZillowByUrlResponse): NormalizedListing | null {
  if (!details.zpid || !details.address) return null;

  const addr = details.address;
  const imageUrls = collectRootPhotos(details);
  const image = imageUrls[0] ?? "/images/listing-1.jpg";

  const statusRaw = (details.homeStatus ?? "OTHER").toUpperCase();
  const status =
    statusRaw === "FOR_SALE" || statusRaw === "ACTIVE"
      ? "active"
      : statusRaw === "PENDING"
      ? "pending"
      : statusRaw === "SOLD"
      ? "sold"
      : "active";

  return {
    externalId: String(details.zpid),
    addressLine1: addr.streetAddress ?? "Unknown address",
    city: addr.city ?? "",
    state: addr.state ?? "",
    zip: addr.zipcode ?? "",
    price:
      typeof details.price === "number"
        ? details.price
        : typeof details.zestimate === "number"
        ? details.zestimate
        : 0,
    beds: typeof details.bedrooms === "number" ? details.bedrooms : 0,
    baths: typeof details.bathrooms === "number" ? details.bathrooms : 0,
    sqft:
      typeof details.livingAreaValue === "number"
        ? details.livingAreaValue
        : 0,
    status,
    image,
    imageUrls,
    raw: details,
    zillowUrl: undefined,
  };
}

function normalizeMiniCard(
  card: ZillowMiniCardListing,
): NormalizedListing | null {
  if (!card.zpid || !card.address) return null;

  const addr = card.address;
  const photos = Array.isArray(card.miniCardPhotos)
    ? card.miniCardPhotos
    : [];
  const urls = photos
    .map((p) => p?.url)
    .filter((u): u is string => typeof u === "string" && u.length > 0);

  const image = urls[0] ?? "/images/listing-1.jpg";

  return {
    externalId: String(card.zpid),
    addressLine1: addr.streetAddress ?? "Unknown address",
    city: addr.city ?? "",
    state: addr.state ?? "",
    zip: addr.zipcode ?? "",
    price: typeof card.price === "number" ? card.price : 0,
    beds: typeof card.bedrooms === "number" ? card.bedrooms : 0,
    baths: typeof card.bathrooms === "number" ? card.bathrooms : 0,
    sqft:
      typeof card.livingAreaValue === "number" ? card.livingAreaValue : 0,
    status: "active",
    image,
    imageUrls: urls,
    raw: card,
    zillowUrl: undefined,
  };
}

function guessZillowUrlFromRaw(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const hdpUrl = typeof r.hdpUrl === "string" ? r.hdpUrl : undefined;
  const zpid = typeof r.zpid === "number" ? r.zpid : undefined;

  if (hdpUrl && hdpUrl.startsWith("/")) {
    return `https://www.zillow.com${hdpUrl}`;
  }
  if (zpid) {
    return `https://www.zillow.com/homedetails/${zpid}_zpid/`;
  }
  return undefined;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  const workers = new Array(Math.max(1, concurrency)).fill(null).map(async () => {
    while (true) {
      const idx = next++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx], idx);
    }
  });

  await Promise.all(workers);
  return results;
}

async function main() {
  const pool = getPool();
  if (!pool) {
    console.error("[import-zillow] Database unavailable (no pool).");
    process.exit(1);
  }

  const { url, maxListings } = parseArgs();

  console.log(
    `[import-zillow] Importing listings from Zillow starting at ${url} (max ${maxListings})...`,
  );

  try {
    const details = await fetchZillowByUrl(url);

    const byId = new Map<string, NormalizedListing>();

    const root = normalizeRoot(details);
    if (root) {
      byId.set(root.externalId, root);
    }

    const modules = details.collections?.modules ?? [];
    for (const mod of modules) {
      const cards = mod.propertyDetails ?? [];
      for (const card of cards) {
        const norm = normalizeMiniCard(card);
        if (!norm) continue;
        if (!byId.has(norm.externalId)) {
          byId.set(norm.externalId, norm);
        }
        if (byId.size >= maxListings) break;
      }
      if (byId.size >= maxListings) break;
    }

    const listings = Array.from(byId.values());

    console.log(
      `[import-zillow] Normalized ${listings.length} unique listings from Zillow payload.`,
    );

    if (listings.length === 0) {
      console.warn("[import-zillow] No listings to import, exiting.");
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      let inserted = 0;
      let updated = 0;

      for (const item of Array.from(byId.values())) {
        const description = `${item.beds || "?"} bed, ${
          item.baths || "?"
        } bath home in ${item.city}`;

        const {
          rows,
        } = await client.query(
          `
          INSERT INTO listing (
            external_id,
            address_line1,
            city,
            state,
            zip,
            price,
            beds,
            baths,
            sqft,
            description,
            image,
            image_urls,
            status,
            raw_payload,
            updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11, $12,
            $13, $14, NOW()
          )
          ON CONFLICT (external_id) DO UPDATE SET
            address_line1 = EXCLUDED.address_line1,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            zip = EXCLUDED.zip,
            price = EXCLUDED.price,
            beds = EXCLUDED.beds,
            baths = EXCLUDED.baths,
            sqft = EXCLUDED.sqft,
            description = EXCLUDED.description,
            image = EXCLUDED.image,
            image_urls = EXCLUDED.image_urls,
            status = EXCLUDED.status,
            raw_payload = EXCLUDED.raw_payload,
            updated_at = NOW()
          RETURNING xmax = 0 AS inserted
        `,
          [
            item.externalId,
            item.addressLine1,
            item.city,
            item.state,
            item.zip,
            item.price,
            item.beds,
            item.baths,
            item.sqft,
            description,
            item.image,
            item.imageUrls.length > 0
              ? JSON.stringify(item.imageUrls)
              : null,
            item.status,
            JSON.stringify(item.raw),
          ],
        );

        if (rows[0]?.inserted) {
          inserted += 1;
        } else {
          updated += 1;
        }
      }

      await client.query("COMMIT");
      console.log(
        `[import-zillow] Completed. Inserted ${inserted} listings, updated ${updated} listings.`,
      );
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("[import-zillow] Error during import, rolled back.", error);
      process.exitCode = 1;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[import-zillow] Failed to fetch listings from Zillow:", error);
    process.exitCode = 1;
  }
}

// Run only when invoked directly via Node
main().catch((err) => {
  console.error("[import-zillow] Unexpected error:", err);
  process.exit(1);
});

