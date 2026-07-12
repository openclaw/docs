---
read_when:
    - Railway에 OpenClaw 배포하기
    - 브라우저 기반 제어 UI를 갖춘 원클릭 클라우드 배포를 원하는 경우
summary: 원클릭 템플릿으로 Railway에 OpenClaw 배포하기
title: Railway
x-i18n:
    generated_at: "2026-07-12T00:55:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbef00b8de61545e9971b18164472c2f47fe607f69ec36f83a27a11b65ea863f
    source_path: install/railway.mdx
    workflow: 16
---

Railway에서 원클릭 템플릿으로 OpenClaw를 배포하고 웹 제어 UI를 통해 접속하세요. 서버에서 터미널을 사용할 필요가 없는 가장 간편한 방법입니다. Railway가 Gateway를 대신 실행합니다.

## 원클릭 배포

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Railway에 배포
</a>

<Steps>
  <Step title="템플릿 배포">
    위의 **Deploy on Railway**를 클릭합니다.
  </Step>

<Step title="볼륨 추가">
  `/data`에 마운트된 볼륨을 연결합니다(상태를 영구적으로 저장하려면 필수).
</Step>

  <Step title="변수 설정">
    서비스에 필요한 **Variables**를 설정합니다.

    - `OPENCLAW_GATEWAY_PORT=8080` (필수 -- Public Networking의 포트와 일치해야 함)
    - `OPENCLAW_GATEWAY_TOKEN` (필수, 관리자 비밀 정보로 취급)
    - `OPENCLAW_STATE_DIR=/data/.openclaw` (권장)
    - `OPENCLAW_WORKSPACE_DIR=/data/workspace` (권장)

  </Step>

<Step title="공용 네트워킹 활성화">
  **Public Networking**에서 포트 `8080`을 사용하는 서비스의 **HTTP Proxy**를 활성화합니다.
</Step>

  <Step title="연결">
    **Railway -> your service -> Settings -> Domains**에서 공개 URL을 찾습니다. 자동 생성된 도메인(일반적으로 `https://<something>.up.railway.app`) 또는 연결한 사용자 지정 도메인을 사용할 수 있습니다.

    `https://<your-railway-domain>/openclaw`을 열고 구성한 공유 비밀 정보를 사용하여 연결합니다. 템플릿은 기본적으로 `OPENCLAW_GATEWAY_TOKEN`을 사용합니다. 이를 비밀번호 인증으로 교체했다면 해당 비밀번호를 대신 사용합니다.

  </Step>
</Steps>

## 제공되는 기능

- 호스팅된 OpenClaw Gateway 및 제어 UI
- Railway 볼륨(`/data`)을 통한 영구 저장소. 따라서 `openclaw.json`, 에이전트별 `auth-profiles.json`, 채널/공급자 상태, 세션, 작업 공간이 재배포 후에도 유지됩니다.

## 채널 연결

`/openclaw`의 제어 UI를 사용하거나 Railway 셸에서 `openclaw onboard`를 실행하여 채널 설정 지침을 확인하세요.

- [Discord](/ko/channels/discord)
- [Telegram](/ko/channels/telegram) (가장 빠름 -- 봇 토큰만 필요)
- [모든 채널](/ko/channels)

## 백업 및 마이그레이션

상태, 구성, 인증 프로필, 작업 공간을 내보냅니다.

```bash
openclaw backup create
```

이 명령은 OpenClaw 상태와 구성된 모든 작업 공간을 포함하는 이동 가능한 백업 아카이브를 생성합니다. 자세한 내용은 [백업](/ko/cli/backup)을 참조하세요.

## 다음 단계

- 메시징 채널 설정: [채널](/ko/channels)
- Gateway 구성: [Gateway 구성](/ko/gateway/configuration)
- OpenClaw를 최신 상태로 유지: [업데이트](/ko/install/updating)
