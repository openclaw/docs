---
read_when:
    - OpenClaw.app 패키징
    - macOS Gateway launchd 서비스 디버깅
    - macOS용 Gateway CLI 설치
summary: macOS의 Gateway 런타임(외부 launchd 서비스)
title: macOS의 Gateway
x-i18n:
    generated_at: "2026-07-04T06:27:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8b646f4cae43cb66acbf3527ef2af9ccaf4b6f2678a464586a110e5e9b3662
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app은 더 이상 Node/Bun 또는 Gateway 런타임을 번들로 제공하지 않습니다. macOS 앱은 **외부** `openclaw` CLI 설치를 기대하며, Gateway를 자식 프로세스로 생성하지 않고, 사용자별 launchd 서비스를 관리하여 Gateway가 계속 실행되도록 합니다(또는 이미 실행 중인 기존 로컬 Gateway가 있으면 여기에 연결합니다).

## 자동 설정

새 Mac에서는 온보딩 중 **이 Mac**을 선택하세요. 앱은 Gateway 마법사 전에 서명된 번들 설치 프로그램을 실행하고, 사용자 공간 Node 런타임과 일치하는 `openclaw` CLI를 `~/.openclaw` 아래에 설치한 다음, 사용자별 launchd 서비스를 설치하고 시작합니다. 이 경로에는 Terminal, Homebrew 또는 관리자 권한이 필요하지 않습니다.

앱은 Node 또는 Gateway 페이로드가 아니라 설치 프로그램 스크립트를 번들로 제공합니다. 따라서 설정에는 런타임과 일치하는 OpenClaw 패키지를 다운로드하기 위한 인터넷 연결이 필요합니다.

## 수동 복구

수동 설치에는 Node 24를 권장합니다. 현재 `22.19+`인 Node 22 LTS도 작동합니다. 그런 다음 `openclaw`를 전역으로 설치하세요.

```bash
npm install -g openclaw@<version>
```

자동 설정에 실패한 후에는 **설정 재시도**를 사용하세요. 그래도 실패하면 위 명령으로 CLI를 수동 설치한 다음, 온보딩에서 **다시 확인**을 선택하세요. Node는 계속 권장 Gateway 런타임입니다.

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
- 앱을 종료해도 Gateway는 중지되지 않습니다(launchd가 계속 실행 상태를 유지합니다).
- 구성된 포트에서 Gateway가 이미 실행 중이면 앱은 새 Gateway를 시작하는 대신 여기에 연결합니다.

로깅:

- launchd stdout: `~/Library/Logs/openclaw/gateway.log`(프로필은 `gateway-<profile>.log` 사용)
- launchd stderr: 억제됨

## 버전 호환성

macOS 앱은 Gateway 버전을 자체 버전과 대조해 확인합니다. 기존 CLI가 없거나 호환되지 않으면 온보딩에서 관리형 설정을 자동으로 실행합니다. 설치를 반복하려면 **설정 재시도**를 사용하고, 외부 CLI를 복구한 후에는 **다시 확인**을 사용하세요.

## macOS의 상태 디렉터리

OpenClaw 상태는 로컬의 동기화되지 않는 디스크에 보관하세요. iCloud Drive 및 기타 클라우드 동기화 폴더는 동기화 지연과 파일 잠금이 세션, 자격 증명, Gateway 상태에 영향을 줄 수 있으므로 피하세요.

재정의가 필요한 경우에만 `OPENCLAW_STATE_DIR`을 로컬 경로로 설정하세요. `openclaw doctor`는 일반적인 클라우드 동기화 상태 경로에 대해 경고하고 로컬 저장소로 다시 이동할 것을 권장합니다. [환경 변수](/ko/help/environment#path-related-env-vars) 및 [Doctor](/ko/gateway/doctor)를 참조하세요.

## 앱 연결 디버그

소스 체크아웃에서 macOS 디버그 CLI를 사용해 앱이 사용하는 것과 동일한 Gateway WebSocket 핸드셰이크 및 검색 로직을 실행하세요.

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect`는 `--url`, `--token`, `--timeout`, `--json`을 받습니다. `discover`는 `--timeout`, `--json`, `--include-local`을 받습니다. CLI 검색과 앱 측 연결 문제를 분리해야 할 때 검색 출력을 `openclaw gateway discover --json`과 비교하세요.

## Smoke check

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
