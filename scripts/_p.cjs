const fs=require('fs');let L=fs.readFileSync('scripts/build.mjs','utf8').split('\n');
const i=L.findIndex(l=>l.startsWith('const ROOTS'));
L[i]=String.raw`const ROOTS = "(?:img|video|assets|du-an|en|projects|favicon\.svg|404\.html|sitemap\.xml)";`;
L[i+1]=String.raw`const rebase = (html) => (BASE ? html.replace(new RegExp(` + '`' + String.raw`([\s"'(,])/(?=${ROOTS}\b|["'])` + '`' + String.raw`, "g"), ` + '`' + '$1${BASE}/' + '`' + String.raw`) : html);`;
fs.writeFileSync('scripts/build.mjs',L.join('\n'));
