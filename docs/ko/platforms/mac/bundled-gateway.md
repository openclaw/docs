---
read_when:
    - OpenClaw.app 패키징
    - macOS Gateway launchd 서비스 디버깅
    - macOS용 Gateway CLI 설치
summary: macOS의 Gateway 런타임(외부 launchd 서비스)
title: macOS에서의 Gateway
x-i18n:
    generated_at: "2026-05-07T13:21:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf129918c46f8f54026e9db04e8ad5a033148899d3029fe1a362bb14c7f25f8
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app은 더 이상 Node/Bun이나 Gateway 런타임을 번들로 제공하지 않습니다. macOS 앱은 **외부** `openclaw` CLI 설치를 기대하며, Gateway를 자식 프로세스로 생성하지 않고, Gateway가 계속 실행되도록 사용자별 launchd 서비스를 관리합니다(또는 기존 로컬 Gateway가 이미 실행 중이면 여기에 연결합니다).

## CLI 설치(로컬 모드에 필요)

Mac에서는 Node 24가 기본 런타임입니다. Node 22 LTS, 현재 `22.16+`도 호환성을 위해 계속 작동합니다. 그런 다음 `openclaw`를 전역으로 설치합니다.

```bash
npm install -g openclaw@<version>
```

macOS 앱의 **CLI 설치** 버튼은 앱이 내부적으로 사용하는 것과 동일한 전역 설치 흐름을 실행합니다. 먼저 npm을 선호하고, 그다음 pnpm, 감지된 패키지 관리자가 그것뿐이면 bun을 사용합니다. Node는 계속 권장 Gateway 런타임입니다.

## Launchd(Gateway를 LaunchAgent로 실행)

레이블:

- `ai.openclaw.gateway`(또는 `ai.openclaw.<profile>`; 레거시 `com.openclaw.*`가 남아 있을 수 있음)

Plist 위치(사용자별):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (또는 `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

관리자:

- macOS 앱은 로컬 모드에서 LaunchAgent 설치/업데이트를 소유합니다.
- CLI도 이를 설치할 수 있습니다: `openclaw gateway install`.

동작:

- "OpenClaw 활성"은 LaunchAgent를 활성화/비활성화합니다.
- 앱을 종료해도 Gateway는 중지되지 않습니다(launchd가 계속 실행 상태로 유지합니다).
- 구성된 포트에서 Gateway가 이미 실행 중이면, 앱은 새 Gateway를 시작하는 대신 해당 Gateway에 연결합니다.

로깅:

- launchd stdout/err: `/tmp/openclaw/openclaw-gateway.log`

## 버전 호환성

macOS 앱은 Gateway 버전을 자체 버전과 비교해 확인합니다. 호환되지 않으면 전역 CLI를 앱 버전에 맞게 업데이트하세요.

## 스모크 확인

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

그런 다음:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## 관련 항목

- [macOS 앱](/ko/platforms/macos)
- [Gateway 런북](/ko/gateway)
