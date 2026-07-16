---
read_when:
    - Mac 디버그 빌드 생성 또는 서명하기
summary: 패키징 스크립트로 생성된 macOS 디버그 빌드의 서명 단계
title: macOS 서명
x-i18n:
    generated_at: "2026-07-16T12:49:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 406211dadc9293cf7983e75ae7dd98234f9088351234cf06c33df2f63d1b9b97
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Mac 서명(디버그 빌드)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)은 앱을 고정 경로(`dist/OpenClaw.app`)에 빌드하고 패키징한 다음, [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh)을 호출하여 서명합니다. TCC 권한은 번들 ID 및 코드 서명에 연결되어 있습니다. 다시 빌드할 때도 두 항목을 안정적으로 유지하고 앱을 고정 경로에 두면 macOS가 TCC 권한 부여(알림, 손쉬운 사용, 화면 기록, 마이크, 음성)를 잊지 않습니다.

- 디버그 번들 식별자의 기본값은 `ai.openclaw.mac.debug`입니다(`BUNDLE_ID=...`로 재정의).
- Node: `>=22.22.3 <23`, `>=24.15.0 <25` 또는 `>=25.9.0`(저장소 `package.json` `engines`). 패키저는 Control UI(`pnpm ui:build`)도 빌드합니다.
- 기본적으로 실제 서명 ID가 필요합니다. ID를 찾을 수 없고 `ALLOW_ADHOC_SIGNING`이 설정되지 않은 경우 코드 서명 스크립트가 오류와 함께 종료됩니다. 임시 서명(`SIGN_IDENTITY="-"`)은 명시적으로 선택해야 하며, 다시 빌드할 때 TCC 권한이 유지되지 않습니다. [macOS 권한](/ko/platforms/mac/permissions)을 참조하십시오.
- 환경에서 `SIGN_IDENTITY`을 읽습니다(예: `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` 또는 Developer ID Application 인증서). 이 값이 없으면 `codesign-mac-app.sh`이 Developer ID Application, Apple Distribution, Apple Development, 발견된 첫 번째 유효한 코드 서명 ID 순서로 ID를 자동 선택합니다.
- `CODESIGN_TIMESTAMP=auto`(기본값)은 Developer ID Application 서명에만 신뢰할 수 있는 타임스탬프를 활성화합니다. 어느 한쪽으로 강제하려면 `on`/`off`을 설정하십시오.
- 정보 탭에 빌드, Git 및 디버그/릴리스 채널을 표시할 수 있도록 Info.plist에 `OpenClawBuildTimestamp`(ISO8601 UTC) 및 `OpenClawGitCommit`(짧은 해시, 사용할 수 없는 경우 `unknown`)을 기록합니다.
- 서명 후 Team ID 감사를 실행하며, 번들 내부의 Mach-O 중 Team ID가 다른 항목이 있으면 실패합니다. 우회하려면 `SKIP_TEAM_ID_CHECK=1`을 설정하십시오.

## 사용법

```bash
# 저장소 루트에서
scripts/package-mac-app.sh                                                      # ID 자동 선택, 찾을 수 없으면 오류 발생
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # 실제 인증서
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # 임시 서명(권한이 유지되지 않음)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # 명시적 임시 서명(동일한 주의 사항 적용)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # 개발 전용 Sparkle Team ID 불일치 해결 방법
```

### 임시 서명 참고 사항

`SIGN_IDENTITY="-"`은 앱이 동일한 Team ID를 공유하지 않는 내장 프레임워크(예: Sparkle)를 로드할 때 충돌하는 것을 방지하기 위해 Hardened Runtime(`--options runtime`)을 비활성화합니다. 임시 서명은 TCC 권한 유지 기능도 중단시킵니다. 복구 단계는 [macOS 권한](/ko/platforms/mac/permissions)을 참조하십시오.

## 정보 탭의 빌드 메타데이터

정보 탭은 Info.plist에서 `OpenClawBuildTimestamp` 및 `OpenClawGitCommit`을 읽어 버전, 빌드 날짜, Git 커밋 및 빌드가 DEBUG인지 여부(`#if DEBUG` 사용)를 표시합니다. 코드 변경 후 이러한 값을 새로 고치려면 패키저를 다시 실행하십시오.

## 관련 문서

- [macOS 앱](/ko/platforms/macos)
- [macOS 권한](/ko/platforms/mac/permissions)
