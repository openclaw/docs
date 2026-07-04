---
read_when:
    - macOS 개발 환경 설정
summary: OpenClaw macOS 앱에서 작업하는 개발자를 위한 설정 가이드
title: macOS 개발 설정
x-i18n:
    generated_at: "2026-07-04T06:26:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5438de16d6d796f4c3df5d896f288ee3dfaba16471a4abb932d277cd8e8b84f8
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS 개발자 설정

소스에서 OpenClaw macOS 애플리케이션을 빌드하고 실행합니다.

## 사전 요구 사항

앱을 빌드하기 전에 다음 항목이 설치되어 있는지 확인하세요.

1. **Xcode 26.2+**: Swift 개발에 필요합니다.
2. **Node.js 24 및 pnpm**: Gateway, CLI, 패키징 스크립트에 권장됩니다. 현재 `22.19+`인 Node 22 LTS도 호환성을 위해 계속 지원됩니다.

## 1. 의존성 설치

프로젝트 전체 의존성을 설치합니다.

```bash
pnpm install
```

## 2. 앱 빌드 및 패키징

macOS 앱을 빌드하고 `dist/OpenClaw.app`으로 패키징하려면 다음을 실행하세요.

```bash
./scripts/package-mac-app.sh
```

Apple Developer ID 인증서가 없으면 스크립트가 자동으로 **ad-hoc signing**(`-`)을 사용합니다.

개발 실행 모드, 서명 플래그, Team ID 문제 해결은 macOS 앱 README를 참조하세요.
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **참고**: ad-hoc 서명된 앱은 보안 프롬프트를 표시할 수 있습니다. 앱이 "Abort trap 6"과 함께 즉시 충돌하면 [문제 해결](#troubleshooting) 섹션을 참조하세요.

## 3. CLI 및 Gateway 설치

패키징된 앱에는 표준 `scripts/install-cli.sh` 설치 프로그램이 포함되어 있습니다. 새 프로필에서는 온보딩 중 **이 Mac**을 선택하세요. 앱이 Gateway 마법사를 시작하기 전에 일치하는 사용자 공간 CLI와 런타임을 설치합니다.

수동 개발 복구의 경우 일치하는 CLI를 직접 설치하세요.

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` 및 `bun add -g openclaw@<version>`도 작동합니다.
Gateway 런타임에는 Node가 계속 권장 경로입니다.

## 문제 해결

### 빌드 실패: 툴체인 또는 SDK 불일치

macOS 앱 빌드는 최신 macOS SDK와 Swift 6.2 툴체인을 예상합니다.

**시스템 의존성(필수):**

- **소프트웨어 업데이트에서 제공되는 최신 macOS 버전**(Xcode 26.2 SDK에 필요)
- **Xcode 26.2**(Swift 6.2 툴체인)

**확인:**

```bash
xcodebuild -version
xcrun swift --version
```

버전이 일치하지 않으면 macOS/Xcode를 업데이트하고 빌드를 다시 실행하세요.

### 권한 부여 시 앱 충돌

**Speech Recognition** 또는 **Microphone** 접근을 허용하려고 할 때 앱이 충돌하면 손상된 TCC 캐시 또는 서명 불일치가 원인일 수 있습니다.

**수정:**

1. TCC 권한을 재설정합니다.

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. 그래도 실패하면 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)의 `BUNDLE_ID`를 임시로 변경하여 macOS에서 "깨끗한 초기 상태"로 처리하도록 강제하세요.

### Gateway "Starting..."이 무기한 지속됨

Gateway 상태가 "Starting..."에 머물러 있으면 좀비 프로세스가 포트를 점유하고 있는지 확인하세요.

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

수동 실행이 포트를 점유하고 있으면 해당 프로세스를 중지하세요(Ctrl+C). 최후의 수단으로 위에서 찾은 PID를 종료하세요.

## 관련 항목

- [macOS 앱](/ko/platforms/macos)
- [설치 개요](/ko/install)
