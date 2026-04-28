---
read_when:
    - macOS 개발 환경을 설정하는 중입니다.
summary: OpenClaw macOS 앱 작업 개발자용 설정 가이드
title: macOS 개발 설정
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T06:24:23Z"
  model: gpt-5.4
  provider: openai
  source_hash: 30f98b3249096fa1e125a7beb77562b7bd36e2c17f524f30a1c58de61bd04da0
  source_path: platforms/mac/dev-setup.md
  workflow: 15
---

# macOS 개발자 설정

이 가이드는 OpenClaw macOS 애플리케이션을 소스에서 빌드하고 실행하는 데 필요한 단계를 설명합니다.

## 사전 요구 사항

앱을 빌드하기 전에 다음이 설치되어 있어야 합니다.

1. **Xcode 26.2+**: Swift 개발에 필요
2. **Node.js 24 & pnpm**: gateway, CLI, 패키징 스크립트에 권장. 호환성을 위해 Node 22 LTS(현재 `22.14+`)도 계속 지원됩니다.

## 1. 의존성 설치

프로젝트 전체 의존성을 설치하세요.

```bash
pnpm install
```

## 2. 앱 빌드 및 패키징

macOS 앱을 빌드하여 `dist/OpenClaw.app`으로 패키징하려면 다음을 실행하세요.

```bash
./scripts/package-mac-app.sh
```

Apple Developer ID 인증서가 없으면 스크립트가 자동으로 **ad-hoc signing**(`-`)을 사용합니다.

개발 실행 모드, signing 플래그, Team ID 문제 해결은 macOS 앱 README를 참조하세요:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **참고**: ad-hoc 서명된 앱은 보안 프롬프트를 유발할 수 있습니다. 앱이 "Abort trap 6"과 함께 즉시 충돌하면 아래 [문제 해결](#troubleshooting) 섹션을 참조하세요.

## 3. CLI 설치

macOS 앱은 백그라운드 작업 관리를 위해 전역 `openclaw` CLI 설치를 기대합니다.

**설치 방법(권장):**

1. OpenClaw 앱을 엽니다.
2. **General** 설정 탭으로 이동합니다.
3. **"Install CLI"**를 클릭합니다.

또는 수동으로 설치하세요.

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` 및 `bun add -g openclaw@<version>`도 동작합니다.
Gateway 런타임에는 여전히 Node 경로를 권장합니다.

## 문제 해결

### 빌드 실패: 툴체인 또는 SDK 불일치

macOS 앱 빌드는 최신 macOS SDK와 Swift 6.2 툴체인을 기대합니다.

**시스템 의존성(필수):**

- **Software Update에서 제공되는 최신 macOS 버전** (Xcode 26.2 SDK에 필요)
- **Xcode 26.2** (Swift 6.2 툴체인)

**확인 명령:**

```bash
xcodebuild -version
xcrun swift --version
```

버전이 맞지 않으면 macOS/Xcode를 업데이트한 뒤 다시 빌드하세요.

### 권한 허용 시 앱 충돌

**Speech Recognition** 또는 **Microphone** 접근을 허용하려 할 때 앱이 충돌한다면, 손상된 TCC 캐시 또는 서명 불일치 때문일 수 있습니다.

**해결 방법:**

1. TCC 권한 재설정:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. 그래도 안 되면 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)의 `BUNDLE_ID`를 일시적으로 변경해 macOS가 "깨끗한 상태"로 다시 인식하게 하세요.

### Gateway가 "Starting..." 상태에서 멈춤

gateway 상태가 계속 "Starting..."으로 남아 있다면, 좀비 프로세스가 포트를 점유하고 있는지 확인하세요.

```bash
openclaw gateway status
openclaw gateway stop

# LaunchAgent를 사용하지 않는 경우(dev 모드 / 수동 실행), 리스너 확인:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

수동 실행이 포트를 점유하고 있다면 해당 프로세스를 중지하세요(Ctrl+C). 최후 수단으로는 위에서 찾은 PID를 종료하세요.

## 관련 항목

- [macOS 앱](/ko/platforms/macos)
- [설치 개요](/ko/install)
