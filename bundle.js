import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

function bundle() {
  console.log('Starting Single HTML Bundle Process...');
  
  const distDir = path.join(process.cwd(), 'dist');
  const assetsDir = path.join(distDir, 'assets');
  
  if (!fs.existsSync(distDir)) {
    console.error('Error: dist directory does not exist! Run npm run build first.');
    process.exit(1);
  }

  // Read index.html from dist
  let htmlContent = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

  // Find JS and CSS files in assets
  const files = fs.readdirSync(assetsDir);
  const jsFile = files.find(f => f.endsWith('.js'));
  const cssFile = files.find(f => f.endsWith('.css'));

  if (!jsFile || !cssFile) {
    console.error('Error: Could not find JS or CSS assets in dist/assets!');
    process.exit(1);
  }

  console.log(`Found assets:\nJS: ${jsFile}\nCSS: ${cssFile}`);

  // Read contents of JS and CSS
  const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf-8');
  const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf-8');

  // Inline them into HTML
  // First, replace the CSS link tag:
  // e.g. <link rel="stylesheet" crossorigin href="/assets/index-xxx.css">
  const cssLinkRegex = /<link\s+rel="stylesheet"[^>]*href="\/assets\/index-[^>]*\.css"[^>]*>/i;
  const inlinedCss = `<style>\n${cssContent}\n</style>`;
  if (cssLinkRegex.test(htmlContent)) {
    htmlContent = htmlContent.replace(cssLinkRegex, inlinedCss);
  } else {
    // Fallback: look for other permutations
    const cssLinkRegexFallback = /<link\s+[^>]*href="\/assets\/[^>]*\.css"[^>]*>/gi;
    htmlContent = htmlContent.replace(cssLinkRegexFallback, inlinedCss);
  }

  // Second, replace the JS script tag:
  // e.g. <script type="module" crossorigin src="/assets/index-xxx.js"></script>
  // We want to make sure it runs correctly without requiring a module context if possible, 
  // but keeping it as a module script is standard. We will use a script tag.
  const jsScriptRegex = /<script\s+type="module"[^>]*src="\/assets\/index-[^>]*\.js"[^>]*><\/script>/i;
  const inlinedJs = `<script type="module">\n${jsContent}\n</script>`;
  if (jsScriptRegex.test(htmlContent)) {
    htmlContent = htmlContent.replace(jsScriptRegex, inlinedJs);
  } else {
    // Fallback
    const jsScriptRegexFallback = /<script\s+[^>]*src="\/assets\/[^>]*\.js"[^>]*><\/script>/gi;
    htmlContent = htmlContent.replace(jsScriptRegexFallback, inlinedJs);
  }

  // Also replace any reference to absolute path icons if any, or just ensure there are no broken links.
  
  // Ensure public directory exists
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Save bundled html as a .txt file inside public/ (so it won't crash HTML parsers)
  const publicTxtPath = path.join(publicDir, 'it-zone.txt');
  fs.writeFileSync(publicTxtPath, htmlContent, 'utf-8');
  console.log(`Successfully generated self-contained plain text HTML at: ${publicTxtPath}`);

  // Also save the base64 encoded HTML content as text to prevent any server mimetype or routing errors
  const htmlBase64 = Buffer.from(htmlContent, 'utf-8').toString('base64');
  const publicHtmlB64Path = path.join(publicDir, 'it-zone-html-base64.txt');
  fs.writeFileSync(publicHtmlB64Path, htmlBase64, 'utf-8');
  console.log(`Successfully generated HTML base64 file`);

  // Create ZIP file containing `it-zone.html` directly from memory buffer
  const zip = new AdmZip();
  zip.addFile('it-zone.html', Buffer.from(htmlContent, 'utf-8'));
  
  const publicZipPath = path.join(publicDir, 'it-zone.zip');
  zip.writeZip(publicZipPath);
  console.log(`Successfully created ZIP archive at: ${publicZipPath}`);

  // Save the base64 encoded ZIP archive as text
  const zipBuffer = zip.toBuffer();
  const zipBase64 = zipBuffer.toString('base64');
  const publicZipB64Path = path.join(publicDir, 'it-zone-zip-base64.txt');
  fs.writeFileSync(publicZipB64Path, zipBase64, 'utf-8');
  console.log(`Successfully generated ZIP base64 file`);
  
  // Also save a copy of all files to static `dist/` directory if it exists as fallback
  if (fs.existsSync(distDir)) {
    const distTxtPath = path.join(distDir, 'it-zone.txt');
    fs.writeFileSync(distTxtPath, htmlContent, 'utf-8');

    const distHtmlB64Path = path.join(distDir, 'it-zone-html-base64.txt');
    fs.writeFileSync(distHtmlB64Path, htmlBase64, 'utf-8');
    
    const distZipPath = path.join(distDir, 'it-zone.zip');
    zip.writeZip(distZipPath);

    const distZipB64Path = path.join(distDir, 'it-zone-zip-base64.txt');
    fs.writeFileSync(distZipB64Path, zipBase64, 'utf-8');
    
    console.log(`Successfully copied built files to static dist directory`);
  }
}

bundle();
