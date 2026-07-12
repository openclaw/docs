---
read_when:
    - macOS 개발 환경 설정하기
summary: OpenClaw macOS 앱에서 작업하는 개발자를 위한 설정 가이드
title: macOS 개발 환경 설정
x-i18n:
    generated_at: "2026-07-12T00:56:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd7d556af92892d3deea3f5d8238a33cd413e10b0b377468396221e174ace8fe
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS 개발자 설정

소스에서 OpenClaw macOS 애플리케이션을 빌드하고 실행합니다.

## 사전 요구 사항

- **Xcode 26.2+**(Swift 6.2 도구 체인), Software Update에서 제공하는 최신 macOS.
- Gateway, CLI 및 패키징 스크립트용 **Node.js 24 및 pnpm**. Node 22.19+도 사용할 수 있습니다.

## 1. 종속성 설치

```bash
pnpm install
```

## 2. 앱 빌드 및 패키징

```bash
./scripts/package-mac-app.sh
```

`dist/OpenClaw.app`을 생성합니다. Apple Developer ID 인증서가 없으면 스크립트가 임시 서명으로 대체합니다.

개발 실행 모드, 서명 플래그 및 Team ID 문제 해결 방법은 [apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)를 참조하세요.
저장소 루트에서 빠르게 개발을 반복하려면 `scripts/restart-mac.sh`를 사용하세요(임시 서명에는 `--no-sign`을 추가하세요. `--no-sign`을 사용하면 TCC 권한이 유지되지 않습니다).

<Note>
임시 서명된 앱은 보안 메시지를 표시할 수 있습니다. 앱이 "Abort trap 6"과 함께 즉시 충돌하면 [문제 해결](#troubleshooting)을 참조하세요.
</Note>

## 3. CLI 및 Gateway 설치

패키징된 앱에는 표준 `scripts/install-cli.sh` 설치 프로그램이 포함되어 있습니다. 새 프로필에서는 온보딩 중 **This Mac**을 선택하세요. 앱이 Gateway 마법사를 시작하기 전에 일치하는 사용자 공간 CLI와 런타임을 설치합니다.

수동으로 개발 환경을 복구하려면 일치하는 CLI를 직접 설치하세요.

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` 및 `bun add -g openclaw@<version>`도 사용할 수 있습니다. Gateway 자체에는 Node가 여전히 권장 런타임입니다.

## 문제 해결

### 빌드 실패: 도구 체인 또는 SDK 불일치

macOS 앱 빌드에는 최신 macOS SDK와 Swift 6.2 도구 체인(Xcode 26.2+)이 필요합니다.

```bash
xcodebuild -version
xcrun swift --version
```

버전이 일치하지 않으면 macOS/Xcode를 업데이트하고 빌드를 다시 실행하세요.

### 권한 허용 시 앱 충돌

**Speech Recognition** 또는 **Microphone** 접근을 허용하려 할 때 앱이 충돌하면 TCC 캐시 손상 또는 서명 불일치가 원인일 수 있습니다.

1. 디버그 번들 ID의 TCC 권한을 재설정합니다.

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. 그래도 해결되지 않으면 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)의 `BUNDLE_ID`를 임시로 변경하여 macOS에서 초기 상태로 다시 시작하도록 합니다.

### Gateway가 "Starting..." 상태로 무기한 멈춤

좀비 프로세스가 포트를 점유하고 있는지 확인합니다.

```bash
openclaw gateway status
openclaw gateway stop

# LaunchAgent를 사용하지 않는 경우(개발 모드/수동 실행) 리스너를 찾습니다.
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

수동 실행 프로세스가 포트를 점유하고 있으면 해당 프로세스를 중지하거나(Ctrl+C), 최후의 수단으로 위에서 찾은 PID를 종료하세요.

## 관련 문서

- [macOS 앱](/ko/platforms/macos)
- [설치 개요](/ko/install)
