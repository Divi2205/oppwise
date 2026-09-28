// One shared skill dictionary. The parser, the eligibility check and "Prep for this"
// all use these ids, so "SQL", "Databases" and "DBMS" always mean the same thing.

export const SKILLS = [
  { id: "dsa", name: "Data Structures & Algorithms", aliases: ["dsa", "data structures", "algorithms", "problem solving", "competitive programming", "leetcode"], effortDays: 4,
    resources: [{ title: "NeetCode roadmap", url: "https://neetcode.io/roadmap" }, { title: "LeetCode Top Interview 150", url: "https://leetcode.com/studyplan/top-interview-150/" }] },
  { id: "java", name: "Java", aliases: ["java", "core java"], effortDays: 3,
    resources: [{ title: "Learn Java (dev.java)", url: "https://dev.java/learn/" }] },
  { id: "python", name: "Python", aliases: ["python"], effortDays: 2,
    resources: [{ title: "Official Python tutorial", url: "https://docs.python.org/3/tutorial/" }] },
  { id: "cpp", name: "C++", aliases: ["c++", "cpp"], effortDays: 3,
    resources: [{ title: "LearnCpp.com", url: "https://www.learncpp.com/" }] },
  { id: "javascript", name: "JavaScript", aliases: ["javascript", "js", "es6"], effortDays: 2,
    resources: [{ title: "The Modern JavaScript Tutorial", url: "https://javascript.info/" }] },
  { id: "html-css", name: "HTML & CSS", aliases: ["html", "css", "html/css", "web basics"], effortDays: 1,
    resources: [{ title: "MDN Learn web development", url: "https://developer.mozilla.org/en-US/docs/Learn" }] },
  { id: "react", name: "React", aliases: ["react", "reactjs", "react.js", "next.js", "nextjs"], effortDays: 3,
    resources: [{ title: "react.dev — Learn React", url: "https://react.dev/learn" }] },
  { id: "node", name: "Node.js", aliases: ["node", "nodejs", "node.js", "express", "expressjs"], effortDays: 2,
    resources: [{ title: "Node.js — Learn", url: "https://nodejs.org/en/learn" }] },
  { id: "spring", name: "Spring Boot", aliases: ["spring boot", "springboot", "spring"], effortDays: 3,
    resources: [{ title: "Spring guides", url: "https://spring.io/guides" }] },
  { id: "dbms", name: "DBMS & SQL", aliases: ["dbms", "sql", "mysql", "postgresql", "database", "databases", "database management"], effortDays: 2,
    resources: [{ title: "SQLBolt interactive lessons", url: "https://sqlbolt.com/" }, { title: "W3Schools SQL", url: "https://www.w3schools.com/sql/" }] },
  { id: "oops", name: "Object-Oriented Programming", aliases: ["oop", "oops", "object oriented", "object-oriented"], effortDays: 1,
    resources: [{ title: "Java OOP concepts (Oracle)", url: "https://docs.oracle.com/javase/tutorial/java/concepts/" }] },
  { id: "os", name: "Operating Systems", aliases: ["operating systems", "operating system"], effortDays: 2,
    resources: [{ title: "OSTEP (free book)", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/" }] },
  { id: "cn", name: "Computer Networks", aliases: ["computer networks", "networking", "computer networking"], effortDays: 2,
    resources: [{ title: "Cloudflare Learning Center", url: "https://www.cloudflare.com/learning/" }] },
  { id: "git", name: "Git & GitHub", aliases: ["git", "github", "version control"], effortDays: 1,
    resources: [{ title: "Pro Git book", url: "https://git-scm.com/book/en/v2" }] },
  { id: "ml", name: "Machine Learning", aliases: ["machine learning", "ml", "ai/ml", "deep learning"], effortDays: 4,
    resources: [{ title: "Google ML Crash Course", url: "https://developers.google.com/machine-learning/crash-course" }] },
  { id: "data", name: "Data Analysis", aliases: ["data analysis", "data analytics", "pandas", "excel", "power bi", "tableau"], effortDays: 2,
    resources: [{ title: "Kaggle Learn", url: "https://www.kaggle.com/learn" }] },
  { id: "uiux", name: "UI/UX & Figma", aliases: ["ui/ux", "uiux", "ux", "ui design", "figma"], effortDays: 2,
    resources: [{ title: "Figma Help Center", url: "https://help.figma.com/" }] },
  { id: "cloud", name: "Cloud (AWS)", aliases: ["cloud", "aws", "azure", "gcp", "cloud computing"], effortDays: 3,
    resources: [{ title: "AWS Skill Builder", url: "https://skillbuilder.aws/" }] },
  { id: "docker", name: "Docker", aliases: ["docker", "containers", "kubernetes"], effortDays: 2,
    resources: [{ title: "Docker — Get started", url: "https://docs.docker.com/get-started/" }] },
  { id: "android", name: "Android / Kotlin", aliases: ["android", "kotlin", "flutter", "app development"], effortDays: 3,
    resources: [{ title: "Android Developers courses", url: "https://developer.android.com/courses" }] },
  { id: "aptitude", name: "Aptitude", aliases: ["aptitude", "quantitative", "logical reasoning", "reasoning"], effortDays: 2,
    resources: [{ title: "IndiaBIX aptitude practice", url: "https://www.indiabix.com/" }] },
];

export const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

// Pre-compiled alias matchers. Word boundaries stop "java" matching inside "javascript".
const MATCHERS = SKILLS.map((s) => ({
  id: s.id,
  res: s.aliases.map((a) => new RegExp(`(^|[^a-z0-9+#])${escapeRe(a)}(?![a-z0-9+#])`, "i")),
}));

export function extractSkills(text) {
  const found = [];
  for (const m of MATCHERS) if (m.res.some((re) => re.test(text))) found.push(m.id);
  return found;
}

export function skillName(id) {
  return SKILL_BY_ID[id]?.name || id;
}
