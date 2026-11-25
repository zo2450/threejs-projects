import {
  siBootstrap,
  siC,
  siClaude,
  siConfluence,
  siCplusplus,
  siCss,
  siDocker,
  siDotnet,
  siFastapi,
  siFigma,
  siFlask,
  siFramer,
  siGit,
  siGoogleanalytics,
  siHtml5,
  siJavascript,
  siJira,
  siMeta,
  siMui,
  siNextdotjs,
  siNodedotjs,
  siOpenjdk,
  siPostgresql,
  siPython,
  siReact,
  siThreedotjs,
  siTypescript,
  siWordpress,
  type SimpleIcon,
} from "simple-icons";
// Open-source symbols (Heroicons, MIT) for tools simple-icons has no logo for.
import chartBar from "heroicons/24/solid/chart-bar.svg?raw";
import tableCells from "heroicons/24/solid/table-cells.svg?raw";
import cloud from "heroicons/24/solid/cloud.svg?raw";
import bolt from "heroicons/24/solid/bolt.svg?raw";
import sparkles from "heroicons/24/solid/sparkles.svg?raw";
import share from "heroicons/24/solid/share.svg?raw";
import codeBracket from "heroicons/24/solid/code-bracket.svg?raw";
import codeBracketSquare from "heroicons/24/solid/code-bracket-square.svg?raw";
import variable from "heroicons/24/solid/variable.svg?raw";

export type Category = "Language" | "Framework" | "Tool" | "AI";

export interface Skill {
  name: string;
  category: Category;
  /** Logo from simple-icons */
  icon?: SimpleIcon;
  /** Without a logo: a generic symbol (SVG markup) shown in the brand colour */
  symbol?: string;
  /** Brand colour for symbol tiles */
  colour?: string;
}

/**
 * Everything from my resume's Technical Skills section, plus tools named in my roles and
 * projects. Logos come from simple-icons (CC0 paths; each logo is its owner's trademark).
 * Microsoft tools and VBA aren't in simple-icons, so they get a generic symbol in their brand colour.
 */
export const SKILLS: Skill[] = [
  // Languages
  { name: "Python", category: "Language", icon: siPython },
  { name: "TypeScript", category: "Language", icon: siTypescript },
  { name: "JavaScript", category: "Language", icon: siJavascript },
  { name: "Java", category: "Language", icon: siOpenjdk },
  { name: "C++", category: "Language", icon: siCplusplus },
  { name: "C", category: "Language", icon: siC },
  { name: "SQL (Postgres)", category: "Language", icon: siPostgresql },
  { name: "HTML", category: "Language", icon: siHtml5 },
  { name: "CSS", category: "Language", icon: siCss },
  { name: "VBA", category: "Language", symbol: variable, colour: "#217346" },
  // Frameworks
  { name: "React", category: "Framework", icon: siReact },
  { name: "Next.js", category: "Framework", icon: siNextdotjs },
  { name: "Node.js", category: "Framework", icon: siNodedotjs },
  { name: "Three.js", category: "Framework", icon: siThreedotjs },
  { name: "FastAPI", category: "Framework", icon: siFastapi },
  { name: "Flask", category: "Framework", icon: siFlask },
  { name: ".NET", category: "Framework", icon: siDotnet },
  { name: "Material UI", category: "Framework", icon: siMui },
  { name: "Bootstrap", category: "Framework", icon: siBootstrap },
  { name: "WordPress", category: "Framework", icon: siWordpress },
  // AI and automation
  { name: "Claude", category: "AI", icon: siClaude },
  { name: "Copilot Studio", category: "AI", symbol: sparkles, colour: "#7f5af0" },
  { name: "Power Automate", category: "AI", symbol: bolt, colour: "#0066ff" },
  { name: "Microsoft Graph", category: "AI", symbol: share, colour: "#0078d4" },
  // Tools
  { name: "Figma", category: "Tool", icon: siFigma },
  { name: "Framer", category: "Tool", icon: siFramer },
  { name: "Power BI", category: "Tool", symbol: chartBar, colour: "#f2c811" },
  { name: "Excel", category: "Tool", symbol: tableCells, colour: "#217346" },
  { name: "Azure", category: "Tool", symbol: cloud, colour: "#0078d4" },
  { name: "Git", category: "Tool", icon: siGit },
  { name: "Docker", category: "Tool", icon: siDocker },
  { name: "VS Code", category: "Tool", symbol: codeBracket, colour: "#007acc" },
  { name: "Visual Studio", category: "Tool", symbol: codeBracketSquare, colour: "#5c2d91" },
  { name: "Jira", category: "Tool", icon: siJira },
  { name: "Confluence", category: "Tool", icon: siConfluence },
  { name: "Google Analytics", category: "Tool", icon: siGoogleanalytics },
  { name: "Meta Business Suite", category: "Tool", icon: siMeta },
];
