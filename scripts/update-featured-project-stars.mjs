import { mkdir, writeFile } from "node:fs/promises";

const username = "zhiwuyazhe-fjr";
const contributionRepos = [
  "HKUDS/CLI-Anything",
  "rtk-ai/rtk",
];

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "zhiwuyazhe-fjr-profile-readme",
  ...(process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {}),
};

async function getJson(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`${response.status} while fetching ${url}`);
  }
  return response.json();
}

async function getOwnedProjectStars() {
  let page = 1;
  let total = 0;

  while (true) {
    const repos = await getJson(
      `https://api.github.com/users/${username}/repos?type=owner&per_page=100&page=${page}`,
    );
    if (repos.length === 0) break;

    // Forks inherit another project's stars, so they are intentionally excluded.
    total += repos
      .filter((repo) => !repo.fork)
      .reduce((sum, repo) => sum + repo.stargazers_count, 0);
    page += 1;
  }

  return total;
}

function createBadge(total) {
  const label = "PROJECT STARS";
  const value = String(total);
  const labelWidth = 150;
  const valueWidth = Math.max(58, 24 + value.length * 18);
  const width = labelWidth + valueWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="40" viewBox="0 0 ${width} 40" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <rect width="${labelWidth}" height="40" rx="6" fill="#1f2428"/>
  <path d="M${labelWidth - 6} 0h6v40h-6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6z" fill="#1f2428"/>
  <path d="M${labelWidth} 0h${valueWidth - 6}a6 6 0 0 1 6 6v28a6 6 0 0 1-6 6h-${valueWidth - 6}z" fill="#2bbc8a"/>
  <path d="M18 12l3.1 6.3 7 1-5 4.8 1.2 6.9-6.3-3.3-6.3 3.3 1.2-6.9-5-4.8 7-1z" fill="#fff"/>
  <text x="35" y="26" fill="#fff" font-family="Verdana,DejaVu Sans,sans-serif" font-size="12" font-weight="700" letter-spacing=".8">${label}</text>
  <text x="${labelWidth + valueWidth / 2}" y="27" text-anchor="middle" fill="#fff" font-family="Verdana,DejaVu Sans,sans-serif" font-size="17" font-weight="700">${value}</text>
</svg>`;
}

const [ownedProjectStars, contributionProjectData] = await Promise.all([
  getOwnedProjectStars(),
  Promise.all(
    contributionRepos.map((repo) => getJson(`https://api.github.com/repos/${repo}`)),
  ),
]);

const contributionProjectStars = contributionProjectData.reduce(
  (sum, repo) => sum + repo.stargazers_count,
  0,
);
const total = ownedProjectStars + contributionProjectStars;

await mkdir("assets", { recursive: true });
await writeFile("assets/featured-project-stars.svg", createBadge(total));
console.log(
  `Updated featured project stars: ${ownedProjectStars} owned + ${contributionProjectStars} contributed = ${total}`,
);
