This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Environment Variables

Create a `.env.local` file in the `client` directory and add the following variables:

```bash
# VWorld API 설정
VWORLD_KEY=your_vworld_api_key_here
VWORLD_DOMAIN=localhost:3000
```

**VWorld API 키 발급 방법:**
1. [VWorld 국토정보플랫폼](https://www.vworld.kr)에 접속
2. 회원가입 후 로그인
3. 오픈API → API 신청 메뉴에서 "2D 지도 API" 신청
4. 발급받은 API 키를 `VWORLD_KEY`에 입력
5. **중요**: API 키 신청 시 사용할 도메인 등록 필요 (예: `localhost:3000`, `your-app.vercel.app`)

### Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Vercel 환경변수 설정 (중요!)

배포 후 반드시 환경변수를 설정해야 합니다:

1. Vercel 대시보드에서 프로젝트 선택
2. **Settings** → **Environment Variables** 메뉴로 이동
3. 다음 환경변수들을 추가:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VWORLD_KEY` | VWorld API 키 | Production, Preview, Development |
| `VWORLD_DOMAIN` | `your-app.vercel.app` | Production, Preview |

4. **중요**: 환경변수 추가 후 반드시 **Redeploy** 필요
   - Settings → Deployments → 최신 배포 선택 → "Redeploy" 버튼 클릭
   - 또는 새로운 커밋을 푸시하여 자동 재배포

5. **VWorld API 도메인 등록**: VWorld 사이트에서 Vercel 도메인(`your-app.vercel.app`)을 허용 도메인으로 등록해야 합니다.

**환경변수 설정 후 확인:**
- 배포 로그에서 에러 확인
- 브라우저 개발자 도구의 Network 탭에서 `/api/sigungu/by-point` 응답 확인
- 500 에러 → `VWORLD_KEY` 누락
- 502 에러 → VWorld API 인증 실패 (도메인 미등록 가능성)

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
