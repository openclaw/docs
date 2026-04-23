---
read_when:
    - Railway에 OpenClaw 배포하기
    - 브라우저 기반 Control UI가 포함된 원클릭 클라우드 배포를 원합니다.
summary: 원클릭 템플릿으로 Railway에 OpenClaw 배포하기
title: Railway
x-i18n:
    generated_at: "2026-04-23T14:04:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 989c8467ead04b8aa7c94101abd99c936ecd3e451fe728afe8c2f2bd5a78df48
    source_path: install/railway.mdx
    workflow: 15
---

# Railway

원클릭 템플릿으로 Railway에 OpenClaw를 배포하고 웹 Control UI를 통해 액세스합니다.
이 방법은 가장 쉬운 “서버에서 터미널 없음” 경로입니다. Railway가 Gateway를 대신 실행합니다.

## 빠른 체크리스트(신규 사용자)

1. 아래의 **Deploy on Railway**를 클릭합니다.
2. `/data`에 마운트되는 **Volume**을 추가합니다.
3. 필수 **Variables**를 설정합니다(최소 `OPENCLAW_GATEWAY_PORT`와 `OPENCLAW_GATEWAY_TOKEN`).
4. 포트 `8080`에서 **HTTP Proxy**를 활성화합니다.
5. `https://<your-railway-domain>/openclaw`를 열고 구성한 공유 비밀로 연결합니다. 이 템플릿은 기본적으로 `OPENCLAW_GATEWAY_TOKEN`을 사용합니다. 이를 비밀번호 인증으로 바꾼 경우에는 해당 비밀번호를 대신 사용하세요.

## 원클릭 배포

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Deploy on Railway
</a>

배포 후 **Railway → your service → Settings → Domains**에서 공개 URL을 확인하세요.

Railway는 다음 중 하나를 제공합니다:

- 생성된 도메인(대개 `https://<something>.up.railway.app`), 또는
- 연결한 사용자 지정 도메인

그다음 다음을 여세요:

- `https://<your-railway-domain>/openclaw` — Control UI

## 제공 내용

- 호스팅된 OpenClaw Gateway + Control UI
- Railway Volume(`/data`)을 통한 영구 스토리지로 `openclaw.json`,
  agent별 `auth-profiles.json`, 채널/provider 상태, 세션,
  workspace가 재배포 후에도 유지됨

## 필수 Railway 설정

### Public Networking

서비스에 **HTTP Proxy**를 활성화하세요.

- 포트: `8080`

### Volume(필수)

다음 위치에 마운트되는 volume을 연결하세요:

- `/data`

### Variables

서비스에 다음 변수를 설정하세요:

- `OPENCLAW_GATEWAY_PORT=8080` (필수 — Public Networking의 포트와 일치해야 함)
- `OPENCLAW_GATEWAY_TOKEN` (필수, 관리자 비밀로 취급)
- `OPENCLAW_STATE_DIR=/data/.openclaw` (권장)
- `OPENCLAW_WORKSPACE_DIR=/data/workspace` (권장)

## 채널 연결

`/openclaw`의 Control UI를 사용하거나 Railway의 shell에서 `openclaw onboard`를 실행해 채널 설정 지침을 확인하세요:

- [Telegram](/ko/channels/telegram) (가장 빠름 — bot token만 있으면 됨)
- [Discord](/ko/channels/discord)
- [All channels](/ko/channels)

## 백업 및 마이그레이션

상태, config, auth profiles, workspace를 export합니다:

```bash
openclaw backup create
```

이 명령은 OpenClaw 상태와 구성된 workspace를 포함한 휴대 가능한 백업 아카이브를 생성합니다. 자세한 내용은 [Backup](/ko/cli/backup)을 참조하세요.

## 다음 단계

- 메시징 채널 설정: [Channels](/ko/channels)
- Gateway 구성: [Gateway configuration](/ko/gateway/configuration)
- OpenClaw 최신 상태 유지: [Updating](/ko/install/updating)
