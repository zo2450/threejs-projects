/** What each landmark says when you hover or tap it. Facts only. */
export interface LandmarkInfo {
  id: "toronto" | "laurier" | "camp" | "work" | "games";
  title: string;
  line: string;
}

export const LANDMARKS: LandmarkInfo[] = [
  { id: "toronto", title: "Toronto", line: "Born and raised. Still my home base." },
  { id: "laurier", title: "Wilfrid Laurier", line: "Computer Science, class of 2027." },
  { id: "camp", title: "GameCraft Camp", line: "Co-founded in 2023. 1,500+ kids have built their first game here." },
  { id: "work", title: "Work", line: "Software PM intern at AMD. Before that, Microsoft and IBM." },
  { id: "games", title: "Off the clock", line: "Gaming and movies." },
];
