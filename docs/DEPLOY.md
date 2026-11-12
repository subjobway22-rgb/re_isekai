# 배포 & 저장 서버 설정

## 1. 웹 URL로 플레이 (GitHub Pages)
1. 저장소 **Settings → Pages → Build and deployment → Source: `GitHub Actions`** 선택
2. `.github/workflows/pages.yml`이 푸시마다 배포합니다. 완료 후 주소:
   `https://subjobway22-rgb.github.io/re_isekai/`
3. 배포가 "branch not allowed"로 막히면: **Settings → Environments → github-pages → Deployment branches**에
   배포할 브랜치를 추가하거나, 코드를 `main`에 머지하세요.

## 2. 로그인 + GitHub 암호화 저장
브라우저 JS에는 GitHub 토큰을 넣을 수 없습니다(소스에서 누구나 꺼내 저장소를 지우거나 남의 기록을 덮어쓸 수 있음).
그래서 **토큰은 작은 서버(Cloudflare Worker, 무료)에만** 두고, 브라우저는 그 서버와만 통신합니다.

흐름: `이름+비번 → (브라우저) AES-GCM 암호화 → Worker가 서버 키로 한 번 더 암호화 → GitHub 저장소 saves 브랜치에 커밋`

### 설정 순서
1. 저장 전용 브랜치 생성: 저장소에 빈 `saves` 브랜치를 만듭니다.
2. GitHub **fine-grained 토큰** 발급: 이 저장소 하나만, 권한 `Contents: Read and write`
3. 키 생성
   ```bash
   openssl rand -base64 32   # → SERVER_KEY
   openssl rand -hex 16      # → PEPPER
   ```
4. Worker 배포 (`server/worker.js`)
   ```bash
   npm i -g wrangler && wrangler login
   cd server && wrangler init reisekai-save --no-git   # 진입 파일을 worker.js로
   wrangler secret put GH_TOKEN
   wrangler secret put SERVER_KEY
   wrangler secret put PEPPER
   wrangler secret put GH_REPO        # subjobway22-rgb/re_isekai
   wrangler secret put ALLOW_ORIGIN   # https://subjobway22-rgb.github.io
   wrangler deploy
   ```
5. `js/config.js`의 `API`에 Worker 주소 입력 → 커밋/푸시
   ```js
   const CONFIG={API:'https://reisekai-save.<계정>.workers.dev'};
   ```

### 보안 설계와 한계
- 저장소에는 **이중 암호문**만 있습니다(브라우저 암호화 → 서버 키 암호화). 서버 키 없이는 4자리 비번을 무차별 대입해도 풀 수 없습니다.
- 비밀번호 확인은 서버에서만: 5회 틀리면 10분 잠금 (`authH = SHA256(auth + PEPPER)`).
- 4자리 숫자는 본질적으로 약합니다. 방치형 게임 기록용 수준이며, 개인정보·결제 정보는 저장하지 마세요.
- 비밀번호를 잊으면 복구할 수 없습니다(서버도 복호화 불가).
- `API`가 비어 있으면 같은 로그인 화면이 동작하지만 기록은 **그 브라우저에만** 암호화 저장됩니다.
