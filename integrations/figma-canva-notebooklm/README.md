# Figma + Canva + NotebookLM integration (demo)

이 디렉터리는 Figma 웹훅, Canva OAuth/임베드, NotebookLM(요약/QA) 호출을 위한 간단한 Node.js/TypeScript 템플릿입니다.

빠른 시작

1. 환경설정
   - 복사: `cp .env.example .env`
   - `.env`에 다음 값을 채우세요:
     - FIGMA_WEBHOOK_SECRET, FIGMA_PERSONAL_ACCESS_TOKEN
     - CANVA_CLIENT_ID, CANVA_CLIENT_SECRET, CANVA_REDIRECT_URI, CANVA_AUTHORIZE_URL, CANVA_TOKEN_URL, CANVA_EMBED_SCRIPT_URL
     - NOTEBOOKLM_API_URL, NOTEBOOKLM_API_KEY
   - 민감정보(토큰/비밀)는 절대 리포지토리에 커밋하지 마세요.

2. 의존성 설치
   - `npm install`

3. 로컬 실행
   - `npm run dev`
   - 서버는 기본적으로 `http://localhost:3000`을 리슨합니다.

4. 로컬 웹훅 테스트
   - ngrok 사용 예: `ngrok http 3000` → ngrok가 발급한 HTTPS URL을 Figma의 웹훅 대상(URL)로 등록
   - Figma 웹훅에서 secret을 설정하면 `.env`의 `FIGMA_WEBHOOK_SECRET`과 동일하게 설정하세요.

5. 저장된 토큰
   - OAuth로 발급받은 토큰은 로컬 `.data/tokens.json`에 저장됩니다 (개발용).
   - `.data/`는 `.gitignore`에 추가되어 있어 커밋되지 않습니다.

핵심 파일

- src/routes/figma.ts: Figma 웹훅 수신 및 처리 (요약 후 파일에 코멘트 작성 시도)
- src/routes/canva.ts: Canva OAuth 시작/콜백, 임베드 데모
- src/services/notebooklm.ts: NotebookLM 호출 래퍼
- src/lib/tokenStore.ts: 로컬 토큰 저장소(.data/tokens.json)

보안 및 운영

- 프로덕션에서는 로컬 파일 대신 안전한 비밀 저장소(예: HashiCorp Vault, AWS Secrets Manager, 데이터베이스)를 사용하세요.
- OAuth 토큰은 refresh 로직을 구현하고 만료 처리를 하세요.
- 웹훅 엔드포인트는 HTTPS로 노출해야 하며 시그니처 검증을 반드시 사용하세요.

