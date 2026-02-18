export type Site = {
  id: string;
  name: string;
  url: string;
  pinned?: boolean;
  order?: number;
};

export const storageKey = "voicehub.sites";

export const defaultSites: Site[] = [
  {
    id: "assistant",
    name: "AI Assistant",
    url: "https://gemini-live-voice-companion-109444388728.us-west1.run.app/",
  },
  {
    id: "browser",
    name: "Browser (Google)",
    url: "https://www.google.com",
  },
  {
    id: "socialbuyer",
    name: "Social Buyer Finder",
    url: "https://socialbuyer-ai-facebook-buyer-finder-109444388728.us-west1.run.app/",
  },
  {
    id: "commandone",
    name: "Command One",
    url: "https://commandone.vercel.app/",
  },
  {
    id: "facebook",
    name: "Facebook",
    url: "https://www.facebook.com/",
  },
  {
    id: "youtube",
    name: "YouTube",
    url: "https://www.youtube.com/",
  },
  {
    id: "instagram",
    name: "Instagram",
    url: "https://www.instagram.com/",
  },
  {
    id: "x",
    name: "X (Twitter)",
    url: "https://x.com/",
  },
  {
    id: "threads",
    name: "Threads",
    url: "https://www.threads.net/",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    url: "https://www.linkedin.com/",
  },
  {
    id: "gmail",
    name: "Gmail",
    url: "https://mail.google.com/",
  },
  {
    id: "grok",
    name: "Grok",
    url: "https://grok.com/",
  },
  {
    id: "gemini",
    name: "Gemini",
    url: "https://gemini.google.com/app",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    url: "https://chatgpt.com/",
  },
  {
    id: "aistudio",
    name: "AI Studio",
    url: "https://aistudio.google.com/",
  },
  {
    id: "gpt-viral-post-igniter",
    name: "Viral Post Igniter 2.0",
    url: "https://chatgpt.com/g/g-68e5e6c9d7688191b918e3269ac8d940-viral-post-igniter-2-0-metamasters-ryan-basford",
  },
  {
    id: "gpt-4-part-method",
    name: "The 4-Part Method",
    url: "https://chatgpt.com/g/g-Qnkq43Lph-the-4-part-method-metamasters-by-ryan-jordan",
  },
  {
    id: "gpt-viral-loop-ladder",
    name: "Viral Loop / Ladder",
    url: "https://chatgpt.com/g/g-6827e7779f548191af94372d10a58b0b-viral-loop-viral-ladder-metamasters",
  },
  {
    id: "viral-loop-thread",
    name: "Viral Loop Thread Creator",
    url: "https://viral-loop-thread-creator-109444388728.us-west1.run.app/",
  },
  {
    id: "search",
    name: "Search",
    url: "https://www.perplexity.ai",
  },
  {
    id: "docs",
    name: "Docs",
    url: "https://docs.electronjs.org",
  },
  {
    id: "notion",
    name: "Notes",
    url: "https://www.notion.so",
  },
];

export const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const removedIds = new Set(["tiktok"]);

export const mergeDefaults = (stored: Site[]) => {
  const filtered = stored.filter((site) => !removedIds.has(site.id));
  const seen = new Set(filtered.map((site) => site.id));
  const merged = [...filtered];
  for (const site of defaultSites) {
    if (!seen.has(site.id)) {
      merged.push(site);
    }
  }
  return merged;
};
