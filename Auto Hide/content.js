console.log("✅ Recruiter Requirements Filter Started (TOP PRIORITY + RANK + NORMALIZED 5 SCALE)");

// ================= RUNNING FLAG =================
let running = true;

// ================= KEYWORDS =================
const requirementKeywords = [
  "requirement","job opening","job opportunity","looking for","position",
  "hiring","hire","c2c","corp to corp","contract","immediate join",
  "urgent requirement","looking to hire","talent acquisition","c2cjobs",
  "us contract","united states","remote","h1b","h1 b"
];

const blockedKeywords = [
  "bench sales","bench recruiter","hotlist","marketing",
  "fulltime","full time","full-time",
  "usc","gc","intern",
  "canada","mexico","germany","egypt","lahore","faisalabad","₹",
  "w2","w-2","only on w2","w2 only","w-2 only",
  "on w2","on w-2","w2 basis","w-2 basis",
  "w2 role","w2 position","w2 contract","w2 opportunity",
  "no c2c","c2c not allowed","c2c not accepted",
  "no corp to corp","no corp-to-corp",
  "corp to corp not allowed","corp-to-corp not allowed",
  "no vendors","no third party","no 3rd party",
  "no staffing firms","consultants","consultants available"
];

const jobSeekerKeywords = [
  "open to work","opentowork","i’m seeking","i am seeking",
  "seeking a new role","looking for opportunities",
  "available for new opportunities","actively looking",
  "job search","dm me for referrals"
];

const blockedLocations = [
  "india","bangalore","bengaluru","hyderabad","chennai","pune","mumbai",
  "delhi","noida","gurgaon","kolkata","ahmedabad","kochi","trivandrum","ist"
];

const usStates = [
  "alabama","alaska","arizona","arkansas","california","colorado","connecticut",
  "delaware","florida","georgia","hawaii","idaho","illinois","indiana","iowa",
  "kansas","kentucky","louisiana","maine","maryland","massachusetts","michigan",
  "minnesota","mississippi","missouri","montana","nebraska","nevada",
  "new york","new jersey","texas","washington","virginia","ohio",
  "nc","sc","tx","ca","ny","nj","va","wa","il","fl"
];

const urgentKeywords = ["urgent","immediate","asap","immediately"];
const recruiterKeywords = [
  "recruiter","talent acquisition","staffing","consultant",
  "headhunter","sourcer","hiring manager","recruitment"
];

// ================= HELPERS =================
const hasAny = (text, list) => list.some(k => text.includes(k));
const countMatches = (text, list) => list.filter(k => text.includes(k)).length;
const hasUSZip = text => /\b\d{5}\b/.test(text);

function isUSPost(text) {
  return (
    hasAny(text, usStates) ||
    hasUSZip(text) ||
    text.includes("united states") ||
    text.includes("usa") ||
    text.includes("us ") ||
    text.includes("remote us") ||
    text.includes("remote - us")
  );
}

function isLikelyRecruiter(post) {
  return hasAny(post.innerText.toLowerCase(), recruiterKeywords);
}

// ================= SCORING =================
function calculateRawScore(post) {
  let text = post.innerText.toLowerCase();
  let score = 0;
  score += countMatches(text, requirementKeywords) * 2;  // requirement match
  score += countMatches(text, urgentKeywords) * 3;       // urgent
  if (text.includes("c2c") || text.includes("corp to corp")) score += 3;
  if (isUSPost(text)) score += 2;
  if (isLikelyRecruiter(post)) score += 5;              // recruiter boost
  return score;
}

// Normalize to 1–5 scale
function normalizeScore(rawScore) {
  const maxRawScore = 20; // approximate maximum possible
  let norm = Math.ceil((rawScore / maxRawScore) * 5);
  if (norm > 5) norm = 5;
  if (norm < 1) norm = 1;
  return norm;
}

// ================= PROCESS POSTS =================
function processPost(post) {
  if (!running || post.dataset.scored) return;
  post.dataset.scored = "true";

  const text = post.innerText.toLowerCase();

  // HARD BLOCKS
  if (
    hasAny(text, blockedKeywords) ||
    hasAny(text, blockedLocations) ||
    hasAny(text, jobSeekerKeywords) ||
    !isUSPost(text)
  ) {
    post.style.display = "none";
    return;
  }

  if (!hasAny(text, requirementKeywords)) {
    post.style.display = "none";
    return;
  }

  // Calculate raw score and normalize
  const rawScore = calculateRawScore(post);
  const score = normalizeScore(rawScore);
  post.dataset.score = score;

  post.style.display = "block";

  // Styling by score
  if (score === 5) {
    post.style.border = "3px solid red";
    post.style.background = "#fff1f1";
  } else if (score === 4) {
    post.style.border = "3px solid #ff9800";
    post.style.background = "#fff3e0";
  } else if (score === 3) {
    post.style.border = "2px solid #1f7aed";
    post.style.background = "#e0f2ff";
  } else if (score === 2) {
    post.style.border = "2px solid #2196f3";
    post.style.background = "#f0f8ff";
  } else {
    post.style.border = "1px solid #90caf9";
    post.style.background = "#f5f9ff";
  }

  // Badge
  const badge = document.createElement("div");
  badge.innerText = `🔥 SCORE ${score}${isLikelyRecruiter(post) ? " (Recruiter)" : ""}`;
  badge.style.cssText =
    "position:absolute;top:8px;right:8px;background:#000;color:#fff;padding:3px 6px;font-size:11px;border-radius:4px;z-index:999";
  post.style.position = "relative";
  post.appendChild(badge);

  // Rank feed
  rankFeed();
}

// ================= RANK FEED =================
function rankFeed() {
  const posts = [...document.querySelectorAll("div.feed-shared-update-v2")]
    .filter(p => p.dataset.score)
    .sort((a, b) => b.dataset.score - a.dataset.score); // 5→1

  posts.forEach(p => p.parentElement.prepend(p));
}

// ================= EXPAND / LOAD MORE =================
function expandPostOnce() {
  const btn = document.querySelector(
    'button.feed-shared-inline-show-more-text__see-more-less-toggle:not([data-clicked])'
  );
  if (btn) {
    btn.dataset.clicked = "true";
    btn.click();
  }
}

function clickLoadMoreOnce() {
  const btn = document.querySelector(
    'button[aria-label*="more"]:not([data-clicked])'
  );
  if (btn && btn.offsetParent !== null) {
    btn.dataset.clicked = "true";
    btn.click();
  }
}

// ================= OBSERVER =================
const observer = new MutationObserver(() => {
  document.querySelectorAll("div.feed-shared-update-v2").forEach(processPost);
  expandPostOnce();
  clickLoadMoreOnce();
});

observer.observe(document.body, { childList: true, subtree: true });

console.log("🚀 TOP-PRIORITY + NORMALIZED 5 SCALE + RANKED US Recruiter Filter Running");
