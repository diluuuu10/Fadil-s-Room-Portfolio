/* ============================================================
   PORTFOLIO DATA — single source of truth.
   When you update your bio, projects, or contact info, edit
   only this file. Both the desktop UIs and the mobile overlay
   read from here.
============================================================ */

export const PERSON = {
  name: "Fadil Noushad",
  role: "React Developer · 3D Web (Three.js)",
  location: "Adelaide, South Australia",
  remoteOk: true,
  status: "Open to work",
  email: "fadilnoushad@gmail.com",
  github: {
    handle: "diluuuu10",
    url: "https://github.com/diluuuu10",
  },
  linkedin: {
    handle: "fadilnoushad",
    url: "https://www.linkedin.com/in/fadilnoushad/",
  },
  photo: "/tv-ps2/assets/me.jpg",
  bio: [
    "Hi! My name is Fadil Noushad and welcome to my little corner of the World Wide Web!",
    "I'm a React Developer who builds interactive web experiences that blend clean UI with real-time 3D. I work with Three.js and WebGL for the visual side, and MERN when a project needs APIs, auth, or data.",
    "Right now I'm building this portfolio — an interactive 3D room you can click around in. The room you're in contains the TV you're looking at right now!",
  ],
};

export const SKILLS = {
  Frontend:    ["JavaScript", "React", "Next.js", "HTML & CSS"],
  "3D / Graphics": ["Three.js", "WebGL", "GLSL Shaders", "Blender"],
  Backend:     ["Node.js", "Express.js", "MongoDB", "SQL"],
  Tools:       ["Vite", "Git & GitHub", "Blender", "Node Tooling"],
};

export const PROJECTS = [
  {
    id: "star-eats-sin",
    name: "Star Eats Sin",
    icon: "⭐",
    tagline: "Interactive Three.js experience",
    description:
      "An interactive 3D scene exploring cosmic visuals and shader work. Built with Three.js and custom GLSL.",
    tech: ["Three.js", "GLSL", "Vite"],
    url: "", // paste Vercel URL when deployed
    github: "",
    status: "soon",
  },
  {
    id: "wormhole",
    name: "Wormhole",
    icon: "🌀",
    tagline: "Procedural wormhole shader",
    description:
      "A real-time procedural wormhole effect with custom GLSL shaders and post-processing.",
    tech: ["Three.js", "GLSL", "Post-FX"],
    url: "",
    github: "",
    status: "soon",
  },
  {
    id: "this-room",
    name: "This Room",
    icon: "🏠",
    tagline: "The portfolio you're standing in",
    description:
      "An interactive 3D room with a working Win95 PC interface inside it, baked lighting from Blender, and a GeoCities-style TV. The thing you're using right now.",
    tech: ["Three.js", "Blender", "Vite"],
    url: "",
    github: "",
    status: "live",
  },
];

export const RESUME = {
  profile:
    "React Developer focused on 3D web experiences. Comfortable across the stack — UI, scenes, shaders, and a Node backend when needed. Based in Adelaide, open to remote and internship roles globally.",
  building: [
    "This interactive 3D portfolio — Three.js + Blender baked lighting",
    "A working Win95-style PC interface inside the scene",
    "Star Eats Sin — Three.js scene exploring shader work",
    "Wormhole — procedural shader experiment",
  ],
  education: [
    "Self-directed study of interactive web + 3D UI",
    "Three.js Journey (Bruno Simon)",
    "Shader programming (GLSL)",
  ],
  availability:
    "Open to internships, freelance, and full-time roles — remote-friendly worldwide. Usually reply within 24–48 hours.",
};

export const CREDITS = {
  inspiration: [
    { name: "Bruno Simon", what: "Three.js Journey + the room-portfolio idea" },
    { name: "Joan Mursufa", what: "Navigation flow and presentation" },
  ],
  thanks: [
    { name: "Family", what: "Constant support and patience" },
    { name: "Open Source", what: "The libraries that make building fun" },
  ],
  tools: ["Three.js", "WebGL", "Vite", "Blender", "BlenderKit"],
};
