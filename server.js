const http = require('http');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

// 네이버 메일 SMTP 설정 (비밀번호 등 민감 정보는 환경변수로만 관리)
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.naver.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = (process.env.SMTP_USER || '').trim();
const SMTP_PASS = (process.env.SMTP_PASS || '').trim();
const RECIPIENT_EMAIL = (process.env.RECIPIENT_EMAIL || '809b000@sgica.co.kr').trim();

// 허용할 프론트엔드 출처(Origin)
const ALLOWED_ORIGINS = [
    'https://1028.co.kr',
    'https://www.1028.co.kr',
    'https://yongthecool.github.io',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

// 간단한 스팸 방지용 IP별 요청 제한 (1분당 최대 5회, 메모리에만 임시 유지)
const rateLimitMap = new Map();
function isRateLimited(ip) {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 5;
    const timestamps = (rateLimitMap.get(ip) || []).filter((t) => now - t < windowMs);
    if (timestamps.length >= maxRequests) {
        rateLimitMap.set(ip, timestamps);
        return true;
    }
    timestamps.push(now);
    rateLimitMap.set(ip, timestamps);
    return false;
}

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

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getSenderAddress() {
    if (!SMTP_USER) return '';
    return SMTP_USER.includes('@') ? SMTP_USER : `${SMTP_USER}@naver.com`;
}

function createTransporter() {
    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    });
}

async function sendConsultEmail(data) {
    if (!SMTP_USER || !SMTP_PASS) {
        throw new Error('SMTP 환경변수(SMTP_USER, SMTP_PASS)가 설정되지 않았습니다.');
    }

    const name = String(data.name || '').trim().slice(0, 100);
    const phone = String(data.phone || '').trim().slice(0, 40);
    const product = String(data.product || '').trim().slice(0, 100);
    const amount = String(data.amount || '미입력').trim().slice(0, 100);
    const details = String(data.details || '상세 문의내용 없음').trim().slice(0, 2000);
    const submittedAt = String(data.submittedAt || new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })).slice(0, 60);

    if (!name || !phone || !product) {
        throw new Error('필수 항목(성함/기업명, 연락처, 보증종목)이 누락되었습니다.');
    }

    const senderEmail = getSenderAddress();
    const subject = `[SGI서울보증 행복대리점 상담신청] ${name} - ${product}`;

    const textBody = [
        '[SGI서울보증 행복대리점 온라인 상담신청]',
        `• 접수일시: ${submittedAt}`,
        `• 성함/기업명: ${name}`,
        `• 연락처: ${phone}`,
        `• 보증종목: ${product}`,
        `• 예상 보증(세액)금액: ${amount}`,
        `• 문의상세내용:\n${details}`,
        '• 개인정보취급방침 동의: 동의함'
    ].join('\n');

    const htmlBody = `
        <div style="font-family: 'Malgun Gothic', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background: #003894; color: #ffffff; padding: 20px 24px;">
                <h2 style="margin: 0; font-size: 18px;">SGI서울보증 행복대리점 온라인 상담신청</h2>
                <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">홈페이지(1028.co.kr)에서 새로운 상담신청이 접수되었습니다.</p>
            </div>
            <div style="padding: 24px; background: #ffffff;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                        <th style="text-align: left; padding: 10px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; width: 140px; color: #334155;">접수일시</th>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${escapeHtml(submittedAt)}</td>
                    </tr>
                    <tr>
                        <th style="text-align: left; padding: 10px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #334155;">성함 / 기업명</th>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 700;">${escapeHtml(name)}</td>
                    </tr>
                    <tr>
                        <th style="text-align: left; padding: 10px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #334155;">연락처</th>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #003894; font-weight: 700;">${escapeHtml(phone)}</td>
                    </tr>
                    <tr>
                        <th style="text-align: left; padding: 10px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #334155;">보증종목</th>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${escapeHtml(product)}</td>
                    </tr>
                    <tr>
                        <th style="text-align: left; padding: 10px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #334155;">예상 보증금액</th>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${escapeHtml(amount)}</td>
                    </tr>
                    <tr>
                        <th style="text-align: left; padding: 10px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #334155; vertical-align: top;">문의상세내용</th>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(details)}</td>
                    </tr>
                    <tr>
                        <th style="text-align: left; padding: 10px 12px; background: #f8fafc; color: #334155;">개인정보 동의</th>
                        <td style="padding: 10px 12px; color: #0f172a;">동의함</td>
                    </tr>
                </table>
            </div>
            <div style="padding: 14px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
                본 메일은 자체 SMTP 서버를 통해 DB 저장 없이 즉시 발송되었습니다.
            </div>
        </div>
    `;

    const transporter = createTransporter();
    await transporter.sendMail({
        from: `"SGI서울보증 행복대리점 홈페이지" <${senderEmail}>`,
        to: RECIPIENT_EMAIL,
        subject,
        text: textBody,
        html: htmlBody
    });
}

function setCorsHeaders(req, res) {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
}

const server = http.createServer((req, res) => {
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const reqPath = req.url.split('?')[0];

    // 헬스체크 엔드포인트
    if (req.method === 'GET' && reqPath === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            ok: true,
            smtpConfigured: Boolean(SMTP_USER && SMTP_PASS),
            recipient: RECIPIENT_EMAIL
        }));
        return;
    }

    // 온라인 상담신청 네이버 SMTP 직접 발송 API (DB 저장 없음)
    if (req.method === 'POST' && reqPath === '/api/consult') {
        const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
        if (isRateLimited(clientIp)) {
            res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, message: '잠시 후 다시 시도해 주세요.' }));
            return;
        }

        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 1e5) req.socket.destroy();
        });
        req.on('end', async () => {
            try {
                const parsed = JSON.parse(body || '{}');
                await sendConsultEmail(parsed);
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: true, message: '상담신청이 정상적으로 접수되었습니다.' }));
            } catch (err) {
                console.error('[SMTP 발송 오류]', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: false, message: '메일 발송 중 오류가 발생했습니다.' }));
            }
        });
        return;
    }

    // 정적 파일 서빙
    const safeUrl = decodeURIComponent(reqPath);
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
    console.log(`SGI서울보증 행복대리점 SMTP 백엔드 서버 실행 중: http://localhost:${PORT}`);
});
