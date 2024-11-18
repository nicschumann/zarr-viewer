// build.js
const esbuild = require("esbuild");
const postcss = require("postcss");
const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");
const fs = require("fs");

// Function to process CSS with Tailwind
async function processTailwind() {
  const css = fs.readFileSync("src/css/style.css", "utf8");
  const result = await postcss([tailwindcss, autoprefixer]).process(css, {
    from: "src/css/style.css",
    to: "dist/style.css",
  });

  fs.mkdirSync("dist", { recursive: true });
  fs.writeFileSync("dist/style.css", result.css);
}

// Function to copy and inject live reload into HTML
function processHTML() {
  // Read the source HTML file
  let html = fs.readFileSync("src/index.html", "utf8");

  // Prepare the live reload script
  const liveReloadScript = `
    <script>
      new EventSource('/esbuild').addEventListener('change', () => location.reload());
    </script>
  `;

  // Inject the live reload script before the closing body tag
  if (html.includes("</body>")) {
    html = html.replace("</body>", `${liveReloadScript}</body>`);
  } else {
    html += liveReloadScript;
  }

  // Write the modified HTML to the dist folder
  fs.writeFileSync("dist/index.html", html);
  return html;
}

// esbuild context for watch mode
async function buildAndWatch() {
  // Initial Tailwind build
  await processTailwind();

  // Initial HTML processing
  processHTML();

  // esbuild context for watch mode
  const ctx = await esbuild.context({
    entryPoints: ["src/index.tsx", "src/index.html"],
    bundle: true,
    outdir: "dist",
    sourcemap: true,
    loader: {
      ".ts": "tsx",
      ".tsx": "tsx",
      ".html": "copy",
      ".frag": "text",
      ".vert": "text",
    },
    plugins: [
      {
        name: "html-and-tailwind-handler",
        setup(build) {
          console.log("handler");
          // Watch the HTML file
          build.onLoad({ filter: /index\.html$/ }, () => {
            return {
              contents: processHTML(),
              loader: "copy",
            };
          });
          // Handle build completion
          build.onEnd(async () => {
            console.log("Build completed");
            try {
              // Rebuild Tailwind CSS to catch any new classes used in HTML or JS
              await processTailwind();
              // Process HTML after Tailwind rebuild
              // processHTML();
            } catch (err) {
              console.error("Error processing Tailwind or HTML:", err);
            }
          });
        },
      },
    ],
    // Add HTML file to watched entryPoints
    absWorkingDir: process.cwd(),
    entryPoints: ["src/index.tsx", "src/index.html"],
  });

  // Watch Tailwind config
  fs.watch("tailwind.config.js", async () => {
    console.log("Tailwind config change detected. Rebuilding...");
    try {
      await processTailwind();
      // Trigger a rebuild to send live reload event
      await ctx.rebuild();
    } catch (err) {
      console.error("Error rebuilding after config change:", err);
    }
  });

  // Start esbuild server
  await ctx.serve({
    servedir: "dist",
    port: 3000,
  });

  // Start watching
  await ctx.watch();

  console.log("Development server running on http://localhost:3000");
}

buildAndWatch().catch((err) => {
  console.error(err);
  process.exit(1);
});
