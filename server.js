const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;
const RECIPIENT_EMAIL = process.env.CONSULT_EMAIL || '8470005@naver.com';

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp'
};

function forwardToFormSubmit(payload) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(payload);
        const req = https.request(
            {
                hostname: 'formsubmit.co',
                port: 443,
                path: `/ajax/${RECIPIENT_EMAIL}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Origin': 'https://1028.co.kr',
                    'Referer': 'https://1028.co.kr/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Content-Length': Buffer.byteLength(postData)
                }
            },
            (res) => {
                let raw = '';
                res.on('data', (chunk) => { raw += chunk; });
                res.on('end', () => {
                    try {
                        resolve({ statusCode: res.statusCode, data: JSON.parse(raw) });
                    } catch (e) {
                        resolve({ statusCode: res.statusCode, data: { success: false, message: raw } });
                    }
                });
            }
        );
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

const server = http.createServer(async (req, res) => {
    // CORS 허용 (로컬 file:// 또는 외부 도메인에서 호출 시에도 정상 작동하도록 설정)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // 온라인 상담신청 메일 발송 API 엔드포인트
    if (req.method === 'POST' && req.url.split('?')[0] === '/api/consult') {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 1e6) req.socket.destroy();
        });
        req.on('end', async () => {
            try {
                const parsed = JSON.parse(body || '{}');
                const result = await forwardToFormSubmit(parsed);
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(result.data));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: false, message: err.message }));
            }
        });
        return;
    }

    const safeUrl = decodeURIComponent(req.url.split('?')[0]);
    const relativePath = safeUrl === '/' ? 'index.html' : safeUrl.replace(/^\/+/, '');
    const filePath = path.join(PUBLIC_DIR, relativePath);

    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (fallbackErr, fallbackContent) => {
                if (fallbackErr) {
                    res.writeHead(404);
                    res.end('Not Found');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(fallbackContent);
            });
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(content);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`SGI서울보증 행복대리점 웹사이트 서버 실행 중: http://localhost:${PORT}`);
});
