---
read_when:
    - OpenClaw.app 패키징하기
    - macOS Gateway launchd 서비스 디버깅
    - macOS용 Gateway CLI 설치하기
summary: macOS의 Gateway 런타임(외부 launchd 서비스)
title: macOS의 Gateway
x-i18n:
    generated_at: "2026-07-16T12:48:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 30c1ae14d8f8eaab73d0e2b725292d7411c2c8b5e0e0c32ad13989c01340d054
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app에는 Node 또는 Gateway 런타임이 번들로 포함되지 않습니다. macOS 앱은
**외부** `openclaw` CLI 설치를 필요로 하며, Gateway를 하위 프로세스로
실행하지 않고 사용자별 launchd 서비스를 관리하여 Gateway가 계속
실행되도록 합니다(또는 이미 실행 중인 로컬 Gateway에 연결합니다).

## 자동 설정

새 Mac에서는 온보딩 중 **This Mac**을 선택하십시오. 앱은 Gateway 마법사를 시작하기 전에
서명되어 번들로 포함된 설치 프로그램 스크립트를 실행합니다. 이 스크립트는 사용자 공간
Node 런타임과 이에 맞는 `openclaw` CLI를 `~/.openclaw` 아래에 설치한 다음,
사용자별 launchd 서비스를 설치하고 시작합니다. 이 경로에는
Terminal, Homebrew 또는 관리자 권한이 필요하지 않습니다.

앱에는 Node 또는 Gateway 페이로드가 아닌 설치 프로그램 스크립트만 번들로 포함됩니다.
설정 시 런타임과 이에 맞는 OpenClaw 패키지를 다운로드하려면 인터넷 연결이 필요합니다.

## 수동 복구

수동 설치에는 Node 24.15+를 권장하며, Node 22.22.3+도 작동합니다.
`openclaw`을 전역으로 설치하십시오.

```bash
npm install -g openclaw@<version>
```

자동 설정에 실패한 후 **Retry setup**을 사용하십시오. 그래도 실패하면
위 명령으로 CLI를 수동 설치한 다음 온보딩에서 **Check again**을 선택하십시오.

## Launchd(Gateway를 LaunchAgent로 실행)

레이블: `ai.openclaw.gateway`(기본 프로필) 또는 명명된 프로필의 경우
`ai.openclaw.<profile>`.

Plist 위치(사용자별): `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
(또는 `ai.openclaw.<profile>.plist`).

로컬 모드에서 macOS 앱은 기본 프로필의 LaunchAgent 설치/업데이트를 담당합니다.
CLI에서도 직접 설치할 수 있습니다: `openclaw gateway install`
(명명된 프로필은 `OPENCLAW_PROFILE` 환경 변수를 통해 선택합니다).

동작:

- "OpenClaw Active"는 LaunchAgent를 활성화/비활성화합니다.
- 앱을 종료해도 Gateway는 **중지되지 않습니다**(launchd가 계속 실행되도록 유지합니다).
- 구성된 포트에서 Gateway가 이미 실행 중이면 앱은 새 Gateway를 시작하는 대신
  기존 Gateway에 연결합니다.

로깅:

- launchd 표준 출력: `~/Library/Logs/openclaw/gateway.log`(프로필은
  `gateway-<profile>.log` 사용)
- launchd 표준 오류: 표시하지 않음
- 호스트가 반복되는 `EADDRINUSE` 또는 빠른 재시작으로 루프에 빠지면
  중복된 `ai.openclaw.gateway` / `ai.openclaw.node` LaunchAgent와
  [Gateway 문제 해결](/ko/gateway/troubleshooting#macos-launchd-supervisor-loop-with-duplicate-gatewaynode-launchagents)의
  launchd 마커 해결 방법을 확인하십시오.

## 버전 호환성

macOS 앱은 Gateway 버전이 앱 자체 버전과 호환되는지 확인합니다. 기존 CLI가 없거나
호환되지 않으면 온보딩에서 관리형 설정을 자동으로 실행합니다.
설치를 반복하려면 **Retry setup**을 사용하고, 외부 CLI를 복구한 후에는
**Check again**을 사용하십시오.

## macOS의 상태 디렉터리

OpenClaw 상태를 동기화되지 않는 로컬 디스크에 보관하십시오. iCloud Drive 및 기타
클라우드 동기화 폴더는 피하십시오. 동기화 지연과 파일 잠금이 세션,
자격 증명 및 Gateway 상태에 영향을 줄 수 있습니다.

재정의가 필요한 경우에만 `OPENCLAW_STATE_DIR`을 로컬 경로로 설정하십시오.
`openclaw doctor`은 일반적인 클라우드 동기화 상태 경로에 대해 경고하고
로컬 저장소로 다시 이동할 것을 권장합니다.
[환경 변수](/ko/help/environment#path-related-env-vars) 및
[Doctor](/ko/gateway/doctor)를 참조하십시오.

## 앱 연결 디버깅

소스 체크아웃에서 macOS 디버그 CLI를 사용하여 앱과 동일한 Gateway
WebSocket 핸드셰이크 및 검색 로직을 실행하십시오.

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect`은 `--url`, `--token`, `--timeout`, `--probe`, `--json`을
허용합니다(클라이언트 ID 재정의도 허용합니다. 전체 목록을 보려면 `--help`와 함께 실행하십시오).
`discover`은 `--timeout`, `--json`, `--include-local`을 허용합니다.
CLI 검색 문제와 앱 측 연결 문제를 구분해야 할 때는
검색 출력을 `openclaw gateway discover --json`과 비교하십시오.

## 스모크 검사

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

## 관련 문서

- [macOS 앱](/ko/platforms/macos)
- [Gateway 런북](/ko/gateway)
