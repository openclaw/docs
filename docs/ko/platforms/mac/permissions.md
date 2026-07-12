---
read_when:
    - macOS 권한 메시지가 표시되지 않거나 멈추는 문제 디버깅
    - Node 또는 CLI 런타임에 손쉬운 사용 권한을 부여할지 결정하기
    - macOS 앱 패키징 또는 서명
    - 번들 ID 또는 앱 설치 경로 변경
summary: macOS 권한 지속성(TCC) 및 서명 요구 사항
title: macOS 권한
x-i18n:
    generated_at: "2026-07-12T00:57:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c8431a1d5a27aed00c50c5d6c8c36554cf766051dfdccea677d0523bbc4189d4
    source_path: platforms/mac/permissions.md
    workflow: 16
---

macOS 권한 부여는 쉽게 불안정해질 수 있습니다. TCC는 권한 부여를 앱의 코드 서명, 번들 식별자 및 디스크상의 경로와 연결합니다. 이 중 하나라도 변경되면 macOS는 앱을 새로운 앱으로 간주하며 권한 요청을 삭제하거나 숨길 수 있습니다.

## 안정적인 권한을 위한 요구 사항

- 동일한 경로: 고정된 위치에서 앱을 실행합니다(OpenClaw의 경우 `dist/OpenClaw.app`).
- 동일한 번들 식별자: OpenClaw의 번들 ID는 `ai.openclaw.mac`입니다. 이를 변경하면 새로운 권한 ID가 생성됩니다.
- 서명된 앱: 서명되지 않았거나 임시 서명된 빌드에서는 권한이 유지되지 않습니다.
- 일관된 서명: 재빌드 후에도 서명이 안정적으로 유지되도록 실제 Apple Development 또는 Developer ID 인증서를 사용합니다.

임시 서명은 빌드할 때마다 새로운 ID를 생성합니다. macOS는 이전에 부여한 권한을 잊으며, 오래된 항목을 지울 때까지 권한 요청이 완전히 사라질 수도 있습니다.

## Node 및 CLI 런타임의 손쉬운 사용 권한

일반 `node` 바이너리 대신 자체 번들 식별자를 사용하는 OpenClaw.app, Peekaboo.app 또는 서명된 다른 도우미에 손쉬운 사용 권한을 부여하는 것이 좋습니다.

macOS TCC는 자신이 확인한 프로세스의 코드 ID에 손쉬운 사용 권한을 부여합니다. Homebrew, nvm, pnpm 또는 npm 워크플로로 인해 공유 `node` 실행 파일에 손쉬운 사용 권한이 부여되면, 동일한 실행 파일을 통해 실행되는 모든 JavaScript 패키지가 GUI 자동화 권한을 상속할 수 있습니다.

시스템 설정의 `node` 항목은 하나의 npm 패키지에 대한 권한이 아니라 해당 Node 런타임 전체에 대한 광범위한 권한으로 간주해야 합니다. 해당 Node 설치를 통해 실행되는 모든 스크립트와 패키지를 신뢰하지 않는 한 `node`에 손쉬운 사용 권한을 부여하지 마십시오.

실수로 `node`에 손쉬운 사용 권한을 부여했다면 System Settings -> Privacy & Security -> Accessibility에서 해당 항목을 제거합니다. 그런 다음 UI 자동화를 담당해야 하는 서명된 앱이나 도우미에 권한을 부여합니다.

## 권한 요청이 사라졌을 때의 복구 점검 목록

1. 앱을 종료합니다.
2. System Settings -> Privacy & Security에서 앱 항목을 제거합니다.
3. 동일한 경로에서 앱을 다시 실행하고 권한을 다시 부여합니다.
4. 권한 요청이 여전히 나타나지 않으면 `tccutil`로 TCC 항목을 재설정한 후 다시 시도합니다.
5. 일부 권한 요청은 macOS를 완전히 재시작한 후에만 다시 나타납니다.

재설정 예시(OpenClaw의 번들 ID `ai.openclaw.mac` 사용):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## 파일 및 폴더 권한(데스크탑/문서/다운로드)

macOS는 터미널 또는 백그라운드 프로세스의 데스크탑, 문서 및 다운로드 폴더 접근도 제한할 수 있습니다. 파일 읽기나 디렉터리 목록 조회가 멈추면 파일 작업을 수행하는 동일한 프로세스 컨텍스트에 접근 권한을 부여합니다(예: Terminal/iTerm, LaunchAgent가 실행한 앱 또는 SSH 프로세스).

해결 방법: 폴더별 권한 부여를 피하려면 파일을 OpenClaw 작업 공간(`~/.openclaw/workspace`)으로 이동합니다.

권한을 테스트할 때는 항상 실제 인증서로 서명하십시오. 임시 빌드는 권한이 중요하지 않은 빠른 로컬 실행에만 사용할 수 있습니다.

## 관련 문서

- [macOS 앱](/ko/platforms/macos)
- [macOS 서명](/ko/platforms/mac/signing)
