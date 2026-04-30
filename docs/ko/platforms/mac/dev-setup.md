---
read_when:
    - macOS 개발 환경 설정하기
summary: OpenClaw macOS 앱 작업 개발자를 위한 설정 가이드
title: macOS 개발 환경 설정
x-i18n:
    generated_at: "2026-04-30T06:40:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0c494b7a214b6db2880ba02c512653c35dbcdf80805bee9777ec946412668e1
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS 개발자 설정

소스에서 OpenClaw macOS 애플리케이션을 빌드하고 실행합니다.

## 필수 조건

앱을 빌드하기 전에 다음이 설치되어 있는지 확인하세요.

1. **Xcode 26.2+**: Swift 개발에 필요합니다.
2. **Node.js 24 및 pnpm**: Gateway, CLI, 패키징 스크립트에 권장됩니다. Node 22 LTS, 현재 `22.14+`, 는 호환성을 위해 계속 지원됩니다.

## 1. 종속성 설치

프로젝트 전체 종속성을 설치합니다.

```bash
pnpm install
```

## 2. 앱 빌드 및 패키징

macOS 앱을 빌드하고 `dist/OpenClaw.app`으로 패키징하려면 다음을 실행하세요.

```bash
./scripts/package-mac-app.sh
```

Apple Developer ID 인증서가 없으면 스크립트가 자동으로 **ad-hoc 서명**(`-`)을 사용합니다.

개발 실행 모드, 서명 플래그, Team ID 문제 해결은 macOS 앱 README를 참조하세요.
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **참고**: ad-hoc 서명된 앱은 보안 프롬프트를 표시할 수 있습니다. 앱이 "Abort trap 6"과 함께 즉시 충돌하면 [문제 해결](#troubleshooting) 섹션을 참조하세요.

## 3. CLI 설치

macOS 앱은 백그라운드 작업을 관리하기 위해 전역 `openclaw` CLI 설치를 기대합니다.

**설치 방법(권장):**

1. OpenClaw 앱을 엽니다.
2. **General** 설정 탭으로 이동합니다.
3. **"Install CLI"**를 클릭합니다.

또는 수동으로 설치하세요.

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` 및 `bun add -g openclaw@<version>`도 작동합니다.
Gateway 런타임에는 Node가 계속 권장되는 경로입니다.

## 문제 해결

### 빌드 실패: 도구 체인 또는 SDK 불일치

macOS 앱 빌드에는 최신 macOS SDK와 Swift 6.2 도구 체인이 필요합니다.

**시스템 종속성(필수):**

- **소프트웨어 업데이트에서 제공되는 최신 macOS 버전**(Xcode 26.2 SDK에 필요)
- **Xcode 26.2**(Swift 6.2 도구 체인)

**확인:**

```bash
xcodebuild -version
xcrun swift --version
```

버전이 일치하지 않으면 macOS/Xcode를 업데이트하고 빌드를 다시 실행하세요.

### 권한 부여 시 앱 충돌

**Speech Recognition** 또는 **Microphone** 접근을 허용하려고 할 때 앱이 충돌하면, 손상된 TCC 캐시 또는 서명 불일치 때문일 수 있습니다.

**수정:**

1. TCC 권한을 재설정합니다.

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. 실패하면 macOS에서 "깨끗한 상태"를 강제하도록 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)의 `BUNDLE_ID`를 임시로 변경하세요.

### Gateway가 "Starting..." 상태로 무기한 유지됨

Gateway 상태가 "Starting..."에 머물러 있으면 좀비 프로세스가 포트를 점유하고 있는지 확인하세요.

```bash
openclaw gateway status
openclaw gateway stop

# LaunchAgent를 사용하지 않는 경우(개발 모드 / 수동 실행), 리스너를 찾으세요.
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

수동 실행이 포트를 점유하고 있으면 해당 프로세스를 중지하세요(Ctrl+C). 최후의 수단으로 위에서 찾은 PID를 종료하세요.

## 관련 항목

- [macOS 앱](/ko/platforms/macos)
- [설치 개요](/ko/install)
