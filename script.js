/**
 * SGI서울보증 행복대리점 정적 웹사이트 스크립트
 */

const RECIPIENT_EMAIL = '8470005@naver.com';
const AGENCY_ADDRESS = '경기 구리시 경춘로 158 한화생명빌딩 2층';

/**
 * 1. 상품안내 링크 이동 (주소창·툴바 제외 팝업 창으로 열기)
 * @param {string} url 이동할 SGI서울보증 상품 상세 URL
 * @param {string} productName 상품명
 */
function openProductWindow(url, productName) {
    const width = 1220;
    const height = 860;
    const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
    const top = Math.max(0, Math.floor((window.screen.height - height) / 2));

    const windowFeatures = [
        `width=${width}`,
        `height=${height}`,
        `left=${left}`,
        `top=${top}`,
        'toolbar=no',
        'location=no',
        'directories=no',
        'status=no',
        'menubar=no',
        'scrollbars=yes',
        'resizable=yes'
    ].join(',');

    const popup = window.open(url, `SGI_${productName || 'Product'}`, windowFeatures);
    if (popup) {
        popup.focus();
    } else {
        // 팝업 차단 시 새 탭으로 안전하게 열기
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}

/**
 * 1-2. 사업자등록증 전용 팝업 창 열기 (주소창·툴바 제외)
 */
function openBusinessLicensePopup() {
    const width = 760;
    const height = 920;
    const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
    const top = Math.max(0, Math.floor((window.screen.height - height) / 2));

    const windowFeatures = [
        `width=${width}`,
        `height=${height}`,
        `left=${left}`,
        `top=${top}`,
        'toolbar=no',
        'location=no',
        'directories=no',
        'status=no',
        'menubar=no',
        'scrollbars=yes',
        'resizable=yes'
    ].join(',');

    const popup = window.open('', 'SGI_Business_License', windowFeatures);
    if (popup) {
        const imgUrl = new URL('assets/business-license.jpg', window.location.href).href;
        popup.document.open();
        popup.document.write(`<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>SGI서울보증 행복대리점 - 사업자등록증 (132-91-45205)</title>
    <style>
        body {
            margin: 0;
            padding: 24px;
            background-color: #F4F7FB;
            font-family: -apple-system, BlinkMacSystemFont, 'Malgun Gothic', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .header-bar {
            width: 100%;
            max-width: 680px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        .header-bar h1 {
            font-size: 1.1rem;
            color: #001B54;
            margin: 0;
        }
        .btn-close {
            background: #003894;
            color: #fff;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 700;
            cursor: pointer;
        }
        .license-frame {
            background: #fff;
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 27, 84, 0.1);
            max-width: 680px;
            width: 100%;
            box-sizing: border-box;
        }
        .license-frame img {
            width: 100%;
            height: auto;
            display: block;
            border: 1px solid #E2E8F0;
        }
    </style>
</head>
<body>
    <div class="header-bar">
        <h1>📄 SGI서울보증 행복대리점 사업자등록증</h1>
        <button class="btn-close" onclick="window.close()">창 닫기 ✕</button>
    </div>
    <div class="license-frame">
        <img src="${imgUrl}" alt="행복대리점 사업자등록증 (132-91-45205)">
    </div>
</body>
</html>`);
        popup.document.close();
        popup.focus();
    } else {
        window.open('assets/business-license.jpg', '_blank', 'noopener,noreferrer');
    }
}

/**
 * 2. 토스트 알림 표시
 * @param {string} message 표시할 안내 문구
 */
function showToast(message) {
    const toast = document.getElementById('toastMessage');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * 3. 사업장 주소 클립보드 복사
 */
async function copyAgencyAddress() {
    try {
        await navigator.clipboard.writeText(AGENCY_ADDRESS);
        showToast('📍 사업장 주소가 복사되었습니다: ' + AGENCY_ADDRESS);
    } catch (err) {
        const tempInput = document.createElement('textarea');
        tempInput.value = AGENCY_ADDRESS;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showToast('📍 사업장 주소가 복사되었습니다: ' + AGENCY_ADDRESS);
    }
}

/**
 * 4. 연락처 입력 시 자동 하이픈 포맷팅 및 금액 천단위 쉼표(,) 자동 포맷팅
 */
function formatPhoneNumber(value) {
    const digits = value.replace(/[^0-9]/g, '');
    if (digits.startsWith('02')) {
        if (digits.length <= 2) return digits;
        if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
        if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
        return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
    }
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

function formatAmountWithCommas(value) {
    if (!value) return '';
    const withoutCommas = value.replace(/,/g, '');
    return withoutCommas.replace(/\d+/g, (match) => {
        const cleaned = match.replace(/^0+(?=\d)/, '');
        return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    });
}

/**
 * 5. 온라인 상담신청 폼 전송 처리 (8470005@naver.com)
 */
document.addEventListener('DOMContentLoaded', () => {
    // 모바일 메뉴 토글
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mainNav = document.getElementById('mainNav');
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mainNav.classList.toggle('open');
        });
        mainNav.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => mainNav.classList.remove('open'));
        });
    }

    // 연락처 하이픈 자동 적용
    const phoneInput = document.getElementById('applicantPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            e.target.value = formatPhoneNumber(e.target.value);
        });
    }

    // 예상 보증(세액) 금액 입력 시 천단위 쉼표(,) 실시간 자동 적용
    const amountInput = document.getElementById('expectedAmount');
    if (amountInput) {
        amountInput.addEventListener('input', (e) => {
            e.target.value = formatAmountWithCommas(e.target.value);
        });
    }

    // 개인정보 약관 접기/펼치기
    const privacyToggleBtn = document.getElementById('privacyToggleBtn');
    const privacyTermsBox = document.getElementById('privacyTermsBox');
    if (privacyToggleBtn && privacyTermsBox) {
        privacyToggleBtn.addEventListener('click', () => {
            const isHidden = privacyTermsBox.style.display === 'none';
            privacyTermsBox.style.display = isHidden ? 'block' : 'none';
            privacyToggleBtn.textContent = isHidden ? '내용 접기 ▲' : '전문 보기 ▼';
        });
    }

    // 상담신청 폼 제출 이벤트
    const consultForm = document.getElementById('consultForm');
    const submitBtn = document.getElementById('submitConsultBtn');
    const modalBackdrop = document.getElementById('resultModal');
    const modalSummary = document.getElementById('modalSummaryText');
    const modalStatusDesc = document.getElementById('modalStatusDesc');
    const directMailtoBtn = document.getElementById('directMailtoBtn');
    const copySummaryBtn = document.getElementById('copySummaryBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');

    if (consultForm) {
        consultForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const name = document.getElementById('applicantName').value.trim();
            const phone = document.getElementById('applicantPhone').value.trim();
            const product = document.getElementById('guaranteeType').value;
            const rawAmount = formatAmountWithCommas(document.getElementById('expectedAmount').value.trim());
            const amount = rawAmount
                ? (/^[0-9,]+$/.test(rawAmount) ? `${rawAmount}원` : rawAmount)
                : '미입력';
            const details = document.getElementById('inquiryDetails').value.trim() || '상세 문의내용 없음';
            const consent = document.getElementById('privacyConsent').checked;

            if (!name) {
                showToast('⚠️ 성함 또는 기업명을 입력해 주세요.');
                document.getElementById('applicantName').focus();
                return;
            }
            if (!phone) {
                showToast('⚠️ 연락처를 입력해 주세요.');
                document.getElementById('applicantPhone').focus();
                return;
            }
            if (!product) {
                showToast('⚠️ 보증종목을 선택해 주세요.');
                document.getElementById('guaranteeType').focus();
                return;
            }
            if (!consent) {
                showToast('⚠️ 개인정보취급방침에 동의해 주세요.');
                document.getElementById('privacyConsent').focus();
                return;
            }

            const submittedAt = new Date().toLocaleString('ko-KR');
            const summaryText = [
                `[SGI서울보증 행복대리점 온라인 상담신청]`,
                `• 접수일시: ${submittedAt}`,
                `• 성함/기업명: ${name}`,
                `• 연락처: ${phone}`,
                `• 보증종목: ${product}`,
                `• 예상 보증(세액)금액: ${amount}`,
                `• 문의상세내용:\n${details}`,
                `• 개인정보취급방침 동의: 동의함`
            ].join('\n');

            const mailSubject = encodeURIComponent(`[SGI서울보증 행복대리점 상담신청] ${name} (${product})`);
            const mailBody = encodeURIComponent(summaryText);
            const mailtoUrl = `mailto:${RECIPIENT_EMAIL}?subject=${mailSubject}&body=${mailBody}`;

            if (directMailtoBtn) {
                directMailtoBtn.setAttribute('href', mailtoUrl);
            }

            if (copySummaryBtn) {
                copySummaryBtn.onclick = async () => {
                    await navigator.clipboard.writeText(summaryText);
                    showToast('📋 상담신청 내용이 복사되었습니다.');
                };
            }

            // 버튼 로딩 상태
            const originalBtnHtml = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>전송 중입니다... 잠시만 기다려 주세요</span>';

            const payload = {
                _subject: `[SGI서울보증 행복대리점 상담신청] ${name} - ${product}`,
                _template: 'table',
                _captcha: 'false',
                '성함_기업명': name,
                '연락처': phone,
                '보증종목': product,
                '예상보증금액': amount,
                '문의상세내용': details,
                '개인정보수집동의': '동의함',
                '접수일시': submittedAt
            };

            // GitHub Pages / 정식 도메인에서는 FormSubmit으로 직접 즉시 전송, 로컬(file://, localhost)에서는 로컬 중계 서버 우선 사용
            const isLocal = window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiEndpoints = isLocal
                ? ['http://localhost:3000/api/consult', `https://formsubmit.co/ajax/${RECIPIENT_EMAIL}`]
                : [`https://formsubmit.co/ajax/${RECIPIENT_EMAIL}`, '/api/consult'];

            let sentSuccess = false;
            let needsActivation = false;

            try {
                for (const endpoint of apiEndpoints) {
                    try {
                        const response = await fetch(endpoint, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            body: JSON.stringify(payload)
                        });
                        const result = await response.json();
                        if (response.ok && (result.success === 'true' || result.success === true)) {
                            sentSuccess = true;
                            break;
                        }
                        if (result && typeof result.message === 'string' && result.message.toLowerCase().includes('activation')) {
                            needsActivation = true;
                            break;
                        }
                    } catch (innerErr) {
                        // 다음 엔드포인트로 폴백 시도
                    }
                }

                if (sentSuccess) {
                    modalStatusDesc.textContent = '상담신청 정보가 담당 전문가에게 성공적으로 전송되었습니다. 확인 후 신속히 연락드리겠습니다.';
                } else if (needsActivation) {
                    modalStatusDesc.textContent = '최초 1회 이메일 수신 승인 대기 중입니다. 수신 메일함(또는 스팸함)으로 발송된 FormSubmit의 [Activate Form] 버튼만 1회 눌러주시면 이후 모든 상담신청이 즉시 메일로 도착합니다.';
                } else {
                    modalStatusDesc.textContent = '상담신청 내역이 접수되었습니다. 급하신 용무는 대표전화(1566-1028)로 연락 주시면 즉시 상담을 도와드립니다.';
                }
            } catch (error) {
                modalStatusDesc.textContent = '상담신청 내역이 준비되었습니다. 신청 내용을 복사하시거나 대표전화(1566-1028)로 문의해 주시면 신속히 상담을 도와드립니다.';
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
                if (modalSummary) modalSummary.textContent = summaryText;
                if (modalBackdrop) modalBackdrop.classList.add('active');
                consultForm.reset();
            }
        });
    }

    if (closeModalBtn && modalBackdrop) {
        closeModalBtn.addEventListener('click', () => {
            modalBackdrop.classList.remove('active');
        });
        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) {
                modalBackdrop.classList.remove('active');
            }
        });
    }

    // 6. 네이버 지도 스타일 인터랙티브 맵 초기화 (경기 구리시 경춘로 158 한화생명 구리사옥 2층)
    const mapContainer = document.getElementById('naverStyleMap');
    if (mapContainer && typeof L !== 'undefined') {
        // 한화생명 구리사옥 (경기도 구리시 경춘로 158 / 교문동 205-3, 한양대학교 구리병원 맞은편) 정확 좌표
        const agencyCoords = [37.600458, 127.132695];
        const viewCenterCoords = [37.60082, 127.132695];
        const naverMapUrl = 'https://map.naver.com/p/search/%EA%B2%BD%EA%B8%B0%20%EA%B5%AC%EB%A6%AC%EC%8B%9C%20%EA%B2%BD%EC%B6%98%EB%A1%9C%20158%20%ED%95%9C%ED%99%94%EC%83%9D%EB%AA%85%EB%B9%8C%EB%94%A9';

        const map = L.map(mapContainer, {
            center: viewCenterCoords,
            zoom: 17,
            zoomControl: false,
            attributionControl: false
        });

        const normalLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            className: 'naver-tile-filter'
        }).addTo(map);

        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19
        });

        // 한화생명 구리사옥 건물 위치 강조 원형 표시
        L.circleMarker(agencyCoords, {
            radius: 16,
            color: '#03C75A',
            weight: 2,
            fillColor: '#03C75A',
            fillOpacity: 0.18
        }).addTo(map);

        // 네이버 지도 스타일 초록색 핀 + 상단 장소 말풍선 마커 (핀 끝점이 정확히 한화생명 구리사옥 위에 위치)
        const naverPinHtml = `
            <div class="naver-custom-pin-wrap">
                <div class="naver-info-bubble">
                    <div class="naver-bubble-title">
                        <span class="naver-bubble-badge">N</span>
                        <span>SGI서울보증 행복대리점 (한화생명 2층)</span>
                    </div>
                    <div class="naver-bubble-addr">경기 구리시 경춘로 158 한화생명 구리사옥 2층</div>
                    <div class="naver-bubble-actions">
                        <a href="${naverMapUrl}" target="_blank" rel="noopener noreferrer" class="naver-bubble-link primary">네이버 길찾기 ↗</a>
                        <a href="tel:1566-1028" class="naver-bubble-link">📞 1566-1028</a>
                    </div>
                </div>
                <svg width="36" height="46" viewBox="0 0 38 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.28)); display: block;">
                    <path d="M19 0C8.507 0 0 8.507 0 19C0 32.25 19 48 19 48C19 48 38 32.25 38 19C38 8.507 29.493 0 19 0Z" fill="#03C75A"/>
                    <circle cx="19" cy="18.5" r="8.5" fill="#FFFFFF"/>
                    <path d="M15.8 14.5H18.1L20.3 18.2V14.5H22.2V22.5H19.9L17.7 18.8V22.5H15.8V14.5Z" fill="#03C75A"/>
                </svg>
            </div>
        `;

        const naverIcon = L.divIcon({
            html: naverPinHtml,
            className: 'naver-custom-div-icon',
            iconSize: [276, 160],
            iconAnchor: [138, 160]
        });

        L.marker(agencyCoords, { icon: naverIcon }).addTo(map);

        // 커스텀 컨트롤 버튼 이벤트
        const btnZoomIn = document.getElementById('nmapZoomIn');
        const btnZoomOut = document.getElementById('nmapZoomOut');
        const btnReset = document.getElementById('nmapResetCenter');
        const btnNormal = document.getElementById('nmapBtnNormal');
        const btnSatellite = document.getElementById('nmapBtnSatellite');

        if (btnZoomIn) btnZoomIn.addEventListener('click', () => map.zoomIn());
        if (btnZoomOut) btnZoomOut.addEventListener('click', () => map.zoomOut());
        if (btnReset) btnReset.addEventListener('click', () => map.setView(viewCenterCoords, 17, { animate: true }));

        if (btnNormal && btnSatellite) {
            btnNormal.addEventListener('click', () => {
                btnNormal.classList.add('active');
                btnSatellite.classList.remove('active');
                if (map.hasLayer(satelliteLayer)) map.removeLayer(satelliteLayer);
                if (!map.hasLayer(normalLayer)) normalLayer.addTo(map);
            });
            btnSatellite.addEventListener('click', () => {
                btnSatellite.classList.add('active');
                btnNormal.classList.remove('active');
                if (map.hasLayer(normalLayer)) map.removeLayer(normalLayer);
                if (!map.hasLayer(satelliteLayer)) satelliteLayer.addTo(map);
            });
        }
    }
});

