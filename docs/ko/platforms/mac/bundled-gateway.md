---
read_when:
    - OpenClaw.app 패키징
    - macOS Gateway launchd 서비스 디버깅
    - macOS용 Gateway CLI 설치
summary: macOS에서 Gateway 런타임(외부 launchd 서비스)
title: macOS에서의 Gateway
x-i18n:
    generated_at: "2026-06-28T00:12:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5317e82435ecf179407116339507a666957a8e23a07a49665233b22f22f5b155
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app은 더 이상 Node/Bun 또는 Gateway 런타임을 번들로 제공하지 않습니다. macOS 앱은 **외부** `openclaw` CLI 설치를 기대하며, Gateway를 자식 프로세스로 생성하지 않고, 사용자별 launchd 서비스를 관리하여 Gateway가 계속 실행되도록 합니다(또는 이미 실행 중인 기존 로컬 Gateway에 연결합니다).

## CLI 설치(로컬 모드에 필요)

Mac의 기본 런타임은 Node 24입니다. 현재 `22.19+`인 Node 22 LTS도 호환성을 위해 계속 작동합니다. 그런 다음 `openclaw`를 전역으로 설치합니다.

```bash
npm install -g openclaw@<version>
```

macOS 앱의 **CLI 설치** 버튼은 앱이 내부적으로 사용하는 것과 동일한 전역 설치 흐름을 실행합니다. 먼저 npm을 선호하고, 그다음 pnpm, 감지된 패키지 관리자가 bun뿐인 경우 bun을 사용합니다. Node는 여전히 권장 Gateway 런타임입니다.

## Launchd(Gateway를 LaunchAgent로 사용)

레이블:

- `ai.openclaw.gateway`(또는 `ai.openclaw.<profile>`; 레거시 `com.openclaw.*`가 남아 있을 수 있음)

Plist 위치(사용자별):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (또는 `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

관리자:

- macOS 앱은 로컬 모드에서 LaunchAgent 설치/업데이트를 소유합니다.
- CLI도 이를 설치할 수 있습니다: `openclaw gateway install`.

동작:

- "OpenClaw Active"는 LaunchAgent를 활성화/비활성화합니다.
- 앱 종료는 Gateway를 중지하지 않습니다(launchd가 계속 실행 상태를 유지합니다).
- 구성된 포트에서 Gateway가 이미 실행 중이면 앱은 새 Gateway를 시작하는 대신 해당 Gateway에 연결합니다.

로깅:

- launchd stdout: `~/Library/Logs/openclaw/gateway.log`(프로필은 `gateway-<profile>.log` 사용)
- launchd stderr: 억제됨

## 버전 호환성

macOS 앱은 Gateway 버전을 자체 버전과 대조해 확인합니다. 호환되지 않는 경우 전역 CLI를 앱 버전에 맞게 업데이트하세요.

## macOS의 상태 디렉터리

OpenClaw 상태는 동기화되지 않는 로컬 디스크에 보관하세요. 동기화 지연 및 파일 잠금이 세션, 자격 증명, Gateway 상태에 영향을 줄 수 있으므로 iCloud Drive 및 기타 클라우드 동기화 폴더를 피하세요.

재정의가 필요한 경우에만 `OPENCLAW_STATE_DIR`을 로컬 경로로 설정하세요. `openclaw doctor`는 일반적인 클라우드 동기화 상태 경로에 대해 경고하고 로컬 저장소로 다시 이동할 것을 권장합니다. [환경 변수](/ko/help/environment#path-related-env-vars) 및 [Doctor](/ko/gateway/doctor)를 참조하세요.

## 앱 연결 디버그

소스 체크아웃에서 macOS 디버그 CLI를 사용하여 앱이 사용하는 것과 동일한 Gateway WebSocket 핸드셰이크 및 검색 로직을 실행해 볼 수 있습니다.

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect`는 `--url`, `--token`, `--timeout`, `--json`을 허용합니다. `discover`는 `--timeout`, `--json`, `--include-local`을 허용합니다. CLI 검색과 앱 측 연결 문제를 구분해야 할 때 검색 출력을 `openclaw gateway discover --json`과 비교하세요.

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
