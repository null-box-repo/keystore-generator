// .. HTTP server and keytool executor
import { exec } from 'node:child_process';
import { createServer } from 'node:http';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const publicDir = root;
const port = Number(process.env.PORT || 3000);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function sendJson(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', (c) => chunks.push(c));
    request.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch { reject(new Error('Invalid JSON')); }
    });
    request.on('error', reject);
  });
}

function escapeShell(val) {
  return String(val).replace(/[^a-zA-Z0-9._\-\/@ ]/g, '');
}

async function generateKeyStore(request, response) {
  try {
    const body = await readBody(request);
    const ksFile = escapeShell(body.ksFile || 'keystore.jks');
    const ksAlias = escapeShell(body.ksAlias || 'mykey');
    const ksAlg = escapeShell(body.ksAlg || 'RSA');
    const ksSize = escapeShell(body.ksSize || '2048');
    const ksValidity = escapeShell(body.ksValidity || '3650');
    const ksStorepass = escapeShell(body.ksStorepass || 'mypassword');
    const ksKeypass = escapeShell(body.ksKeypass || 'mypassword');
    const ksCn = escapeShell(body.ksCn || 'My Project');
    const ksOu = escapeShell(body.ksOu || 'IT');
    const ksO = escapeShell(body.ksO || 'MyCompany');
    const ksL = escapeShell(body.ksL || 'Riyadh');
    const ksSt = escapeShell(body.ksSt || 'Riyadh');
    const ksC = escapeShell(body.ksC || 'SA');
    const ksPath = escapeShell(body.ksPath || '/sdcard/Download');

    const outputPath = join(ksPath, ksFile);
    const dname = `CN=${ksCn}, OU=${ksOu}, O=${ksO}, L=${ksL}, ST=${ksSt}, C=${ksC}`;

    const cmd = [
      'keytool -genkeypair',
      `-keystore "${outputPath}"`,
      `-alias ${ksAlias}`,
      `-keyalg ${ksAlg}`,
      `-keysize ${ksSize}`,
      `-validity ${ksValidity}`,
      `-storepass ${ksStorepass}`,
      `-keypass ${ksKeypass}`,
      `-dname "${dname}"`,
      `-noprompt`
    ].join(' ');

    exec(cmd, { cwd: root, timeout: 30000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        return sendJson(response, 500, { success: false, output: stderr || stdout || error.message });
      }
      sendJson(response, 200, { success: true, output: stdout || 'Done', file: ksFile, password: ksStorepass });
    });
  } catch (err) {
    sendJson(response, 400, { success: false, output: err.message });
  }
}

async function serveFile(requestPath, response) {
  const cleanPath = requestPath === '/' ? '/index.html' : requestPath;
  const filePath = normalize(join(publicDir, cleanPath));
  if (!filePath.startsWith(publicDir)) return sendJson(response, 404, { error: 'Not found' });
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'content-type': types[extname(filePath)] || 'application/octet-stream' });
    createReadStream(filePath).pipe(response);
  } catch {
    if (requestPath !== '/') return serveFile('/', response);
    sendJson(response, 404, { error: 'Not found' });
  }
}

createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  if (url.pathname === '/api/generate' && request.method === 'POST') return generateKeyStore(request, response);
  return serveFile(url.pathname, response);
}).listen(port, () => console.log(`KeyStore Generator running at http://localhost:${port}`));
