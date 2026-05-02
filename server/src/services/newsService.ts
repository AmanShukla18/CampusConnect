import { NewsArchive, NewsRefreshLog } from '../models/News';

export type UnifiedNewsItem = {
  id: string; // Internal id (e.g., hn_123, devto_456)
  title: string;
  description: string;
  url: string;
  image: string | null;
  author: string;
  authorAvatar?: string;
  source: string;
  sourceLabel: string;
  sourceColor: string;
  publishedAt: string;
  score?: number | undefined;
  comments?: number | undefined;
  tags: string[];
  readTime?: string | undefined;
};

// In-memory cache for live feed
let liveNewsCache: UnifiedNewsItem[] = [];
let lastFetchTime = 0;

// Helper to fetch from Hacker News
async function fetchHackerNews(): Promise<UnifiedNewsItem[]> {
  try {
    const res = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30');
    if (!res.ok) throw new Error('Failed to fetch HN');
    const data = await res.json();
    if (!data?.hits) return [];
    
    return data.hits
      .filter((hit: any) => hit.url)
      .map((hit: any) => ({
        id: `hn_${hit.objectID}`,
        title: hit.title,
        description: "Trending on Hacker News",
        url: hit.url,
        image: null,
        author: hit.author,
        source: "Hacker News",
        sourceLabel: "🔥 Hacker News",
        sourceColor: "#ff6600",
        publishedAt: hit.created_at,
        score: hit.points || 0,
        comments: hit.num_comments || 0,
        tags: ["tech", "hacker-news"]
      }));
  } catch (error) {
    console.error('HN fetch error:', error);
    return [];
  }
}

// Helper to fetch from Dev.to
async function fetchDevToNews(): Promise<UnifiedNewsItem[]> {
  try {
    const tags = ['programming', 'webdev', 'ai', 'javascript', 'opensource'];
    const requests = tags.map(tag => 
      fetch(`https://dev.to/api/articles?tag=${tag}&per_page=10`)
    );
    
    const responses = await Promise.allSettled(requests);
    const items: UnifiedNewsItem[] = [];
    
    for (const res of responses) {
      if (res.status === 'fulfilled' && res.value.ok) {
        const data = await res.value.json();
        data.forEach((article: any) => {
          if (!items.find(i => i.id === `devto_${article.id}`)) {
            items.push({
              id: `devto_${article.id}`,
              title: article.title,
              description: article.description,
              url: article.url,
              image: article.cover_image || article.social_image || null,
              author: article.user?.name || 'Dev.to User',
              authorAvatar: article.user?.profile_image,
              source: "Dev.to",
              sourceLabel: "💻 Dev.to",
              sourceColor: "#0a0a0a",
              publishedAt: article.published_at,
              score: article.positive_reactions_count || 0,
              comments: article.comments_count || 0,
              tags: article.tag_list || [],
              ...(article.reading_time_minutes ? { readTime: `${article.reading_time_minutes} min read` } : {})
            });
          }
        });
      }
    }
    return items;
  } catch (error) {
    console.error('Dev.to fetch error:', error);
    return [];
  }
}

// Core Fetching Logic
export async function fetchAllNews(forceRefresh = false): Promise<{ 
  newArticles: UnifiedNewsItem[], 
  updatedArticles: UnifiedNewsItem[], 
  allLive: UnifiedNewsItem[], 
  sourcesActive: string[] 
}> {
  const startTime = Date.now();
  
  const [hnNews, devNews] = await Promise.all([
    fetchHackerNews(),
    fetchDevToNews(),
  ]);

  const fetchedItems = [...hnNews, ...devNews];
  const sourcesActive = [];
  if (hnNews.length > 0) sourcesActive.push('Hacker News');
  if (devNews.length > 0) sourcesActive.push('Dev.to');

  // Deduplicate incoming
  const uniqueFetched = new Map<string, UnifiedNewsItem>();
  for (const item of fetchedItems) {
    if (!uniqueFetched.has(item.url)) {
      uniqueFetched.set(item.url, item);
    }
  }

  const newArticles: UnifiedNewsItem[] = [];
  const updatedArticles: UnifiedNewsItem[] = [];
  const currentCacheMap = new Map(liveNewsCache.map(i => [i.url, i]));

  for (const [url, incoming] of uniqueFetched.entries()) {
    const existing = currentCacheMap.get(url);
    if (!existing) {
      newArticles.push(incoming);
      currentCacheMap.set(url, incoming);
    } else {
      // Update stats
      if (existing.score !== incoming.score || existing.comments !== incoming.comments) {
        if (incoming.score !== undefined) existing.score = incoming.score;
        if (incoming.comments !== undefined) existing.comments = incoming.comments;
        updatedArticles.push(existing);
      }
    }
  }

  liveNewsCache = Array.from(currentCacheMap.values());
  
  // Sort by publishedAt DESC
  liveNewsCache.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  
  // Keep only articles from the last 24 hours in the live feed
  const ONE_DAY = 24 * 60 * 60 * 1000;
  liveNewsCache = liveNewsCache.filter(item => {
    return (Date.now() - new Date(item.publishedAt).getTime()) <= ONE_DAY;
  });

  lastFetchTime = Date.now();

  // Log the refresh
  await NewsRefreshLog.create({
    refreshed_at: new Date(),
    new_count: newArticles.length,
    updated_count: updatedArticles.length,
    sources_used: sourcesActive,
    duration_ms: Date.now() - startTime,
    status: sourcesActive.length > 0 ? 'success' : 'failed'
  }).catch(e => console.error('Failed to log NewsRefreshLog', e));

  return { newArticles, updatedArticles, allLive: liveNewsCache, sourcesActive };
}

// Check Breaking News
export function getBreakingNews(articles: UnifiedNewsItem[]) {
  const breakingKeywords = [
    "breaking", "critical", "urgent", "major", "acquired", "merger", "bankrupt", 
    "shuts down", "launches", "breakthrough", "vulnerability", "breach", "hack", 
    "outage", "down", "gpt", "openai", "google", "apple", "microsoft", "meta", 
    "funding", "ipo", "layoffs"
  ];
  
  for (const article of articles) {
    const lowerTitle = article.title.toLowerCase();
    const match = breakingKeywords.find(kw => lowerTitle.includes(kw));
    if (match) {
      return { article, keyword: match };
    }
  }
  return null;
}

// Force the cache
export function getLiveCache() {
  return liveNewsCache;
}
export function getLastFetchTime() {
  return lastFetchTime;
}

// Archive Save Loop Function
export async function saveLiveCacheToArchive() {
  if (liveNewsCache.length === 0) return 0;
  
  const bulkOps = liveNewsCache.map(article => ({
    updateOne: {
      filter: { url: article.url },
      update: {
        $set: {
          article_id: article.id,
          source: article.source,
          source_label: article.sourceLabel,
          source_color: article.sourceColor,
          title: article.title,
          description: article.description,
          image_url: article.image,
          author: article.author,
          author_avatar: article.authorAvatar,
          tags: article.tags,
          read_time: article.readTime,
          score: article.score || 0,
          comments_count: article.comments || 0,
          published_at: new Date(article.publishedAt),
          last_updated_at: new Date()
        },
        $setOnInsert: {
          first_fetched_at: new Date(),
          archive_category: 'live'
        },
        $inc: { fetch_count: 1 }
      },
      upsert: true
    }
  }));

  try {
    const result = await NewsArchive.bulkWrite(bulkOps);
    console.log(`[Archive] Saved ${result.modifiedCount + result.upsertedCount} items to DB.`);
    return result.modifiedCount + result.upsertedCount;
  } catch (error) {
    console.error('[Archive] failed to bulk write:', error);
    return 0;
  }
}

// Cleanup Loop Function
export async function runArchiveCleanup() {
  try {
    const now = Date.now();
    const MSEC_PER_DAY = 24 * 60 * 60 * 1000;
    
    // recent: 1-7 days
    await NewsArchive.updateMany(
      { 
        published_at: { $lte: new Date(now - MSEC_PER_DAY), $gt: new Date(now - 7 * MSEC_PER_DAY) },
        archive_category: { $ne: 'recent' }
      },
      { $set: { archive_category: 'recent' } }
    );
    
    // weekly: 7-30 days
    await NewsArchive.updateMany(
      { 
        published_at: { $lte: new Date(now - 7 * MSEC_PER_DAY), $gt: new Date(now - 30 * MSEC_PER_DAY) },
        archive_category: { $ne: 'weekly' }
      },
      { $set: { archive_category: 'weekly' } }
    );
    
    // deep_archive: >30 days
    await NewsArchive.updateMany(
      { 
        published_at: { $lte: new Date(now - 30 * MSEC_PER_DAY) },
        archive_category: { $ne: 'deep_archive' }
      },
      { $set: { archive_category: 'deep_archive' } }
    );

    const total = await NewsArchive.countDocuments();
    console.log(`[Cleanup] Organized archive. Total records: ${total}`);
  } catch (err) {
    console.error('[Cleanup] failed:', err);
  }
}
