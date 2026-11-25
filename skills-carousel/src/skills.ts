import {
  siBootstrap,
  siClaude,
  siCplusplus,
  siDotnet,
  siFigma,
  siFramer,
  siGoogleanalytics,
  siHtml5,
  siJavascript,
  siJira,
  siNextdotjs,
  siOpenjdk,
  siPython,
  siReact,
  siThreedotjs,
  siTypescript,
  type SimpleIcon,
} from "simple-icons";

export interface Skill {
  name: string;
  icon: SimpleIcon;
}

/**
 * Tools from my resume and projects. Logos come from simple-icons (CC0 paths; each logo is its
 * owner's trademark). Microsoft tools I use (Azure, Power BI, Power Automate) aren't in
 * simple-icons, so they're not shown yet.
 */
export const SKILLS: Skill[] = [
  { name: "Python", icon: siPython },
  { name: "TypeScript", icon: siTypescript },
  { name: "React", icon: siReact },
  { name: "Next.js", icon: siNextdotjs },
  { name: "Three.js", icon: siThreedotjs },
  { name: "Figma", icon: siFigma },
  { name: "Claude", icon: siClaude },
  { name: "JavaScript", icon: siJavascript },
  { name: "C++", icon: siCplusplus },
  { name: "Java", icon: siOpenjdk },
  { name: ".NET", icon: siDotnet },
  { name: "Bootstrap", icon: siBootstrap },
  { name: "Jira", icon: siJira },
  { name: "Framer", icon: siFramer },
  { name: "Google Analytics", icon: siGoogleanalytics },
  { name: "HTML", icon: siHtml5 },
];
