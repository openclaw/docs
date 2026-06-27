---
read_when:
    - 누락되었거나 멈춘 macOS 권한 프롬프트 디버깅
    - node 또는 CLI 런타임에 손쉬운 사용 권한을 부여할지 결정하기
    - macOS 앱 패키징 또는 서명
    - 번들 ID 또는 앱 설치 경로 변경
summary: macOS 권한 지속성(TCC) 및 서명 요구 사항
title: macOS 권한
x-i18n:
    generated_at: "2026-06-27T17:40:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b7e21c53bff16c3023e2b6509894717c3d0ef96524951b0d0c5975d2fc91019
    source_path: platforms/mac/permissions.md
    workflow: 16
---

macOS 권한 부여는 취약합니다. TCC는 권한 부여를 앱의 코드 서명, 번들 식별자, 디스크상의 경로와 연결합니다. 이 중 하나라도 변경되면 macOS는 앱을 새 앱으로 취급하며 프롬프트를 삭제하거나 숨길 수 있습니다.

## 안정적인 권한을 위한 요구 사항

- 동일한 경로: 고정된 위치에서 앱을 실행하세요(OpenClaw의 경우 `dist/OpenClaw.app`).
- 동일한 번들 식별자: 번들 ID를 변경하면 새 권한 ID가 생성됩니다.
- 서명된 앱: 서명되지 않았거나 임시 서명된 빌드는 권한을 유지하지 않습니다.
- 일관된 서명: 실제 Apple Development 또는 Developer ID 인증서를 사용하여
  재빌드해도 서명이 안정적으로 유지되도록 하세요.

임시 서명은 빌드할 때마다 새 ID를 생성합니다. macOS는 이전 권한 부여를 잊어버리며, 오래된 항목이 지워질 때까지 프롬프트가 완전히 사라질 수 있습니다.

## Node 및 CLI 런타임의 손쉬운 사용 권한 부여

일반 `node` 바이너리 대신 OpenClaw.app, Peekaboo.app 또는 자체 번들 식별자가 있는 다른 서명된 헬퍼에 손쉬운 사용 권한을 부여하는 것을 권장합니다.

macOS TCC는 자신이 보는 프로세스의 코드 ID에 손쉬운 사용 권한을 부여합니다. Homebrew, nvm, pnpm 또는 npm 워크플로로 인해 공유 `node` 실행 파일이 손쉬운 사용 권한을 받게 되면, 동일한 실행 파일을 통해 실행되는 모든 JavaScript 패키지가 GUI 자동화 권한을 상속할 수 있습니다.

시스템 설정의 `node` 항목은 하나의 npm 패키지에 대한 권한이 아니라 해당 Node 런타임에 대한 광범위한 권한으로 취급하세요. 해당 Node 설치를 통해 실행되는 모든 스크립트와 패키지를 신뢰하지 않는 한 `node`에 손쉬운 사용 권한을 부여하지 마세요.

실수로 `node`에 손쉬운 사용 권한을 부여했다면 시스템 설정 -> 개인정보 보호 및 보안 -> 손쉬운 사용에서 해당 항목을 제거하세요. 그런 다음 UI 자동화를 소유해야 하는 서명된 앱 또는 헬퍼에 권한을 부여하세요.

## 프롬프트가 사라질 때의 복구 체크리스트

1. 앱을 종료합니다.
2. 시스템 설정 -> 개인정보 보호 및 보안에서 앱 항목을 제거합니다.
3. 동일한 경로에서 앱을 다시 실행하고 권한을 다시 부여합니다.
4. 프롬프트가 여전히 나타나지 않으면 `tccutil`로 TCC 항목을 재설정한 뒤 다시 시도합니다.
5. 일부 권한은 macOS를 완전히 재시작한 후에만 다시 나타납니다.

재설정 예시(필요에 따라 번들 ID 교체):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## 파일 및 폴더 권한(Desktop/Documents/Downloads)

macOS는 터미널/백그라운드 프로세스에 대해 Desktop, Documents, Downloads 접근도 제한할 수 있습니다. 파일 읽기나 디렉터리 목록 조회가 멈추면 파일 작업을 수행하는 동일한 프로세스 컨텍스트에 접근 권한을 부여하세요(예: Terminal/iTerm, LaunchAgent로 실행된 앱 또는 SSH 프로세스).

우회 방법: 폴더별 권한 부여를 피하고 싶다면 파일을 OpenClaw 작업 공간(`~/.openclaw/workspace`)으로 이동하세요.

권한을 테스트하는 경우 항상 실제 인증서로 서명하세요. 임시 빌드는 권한이 중요하지 않은 빠른 로컬 실행에만 허용됩니다.

## 관련 항목

- [macOS 앱](/ko/platforms/macos)
- [macOS 서명](/ko/platforms/mac/signing)
