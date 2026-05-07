---
read_when:
    - mac 디버그 빌드 생성 또는 서명
summary: 패키징 스크립트에서 생성한 macOS 디버그 빌드의 서명 단계
title: macOS 서명
x-i18n:
    generated_at: "2026-05-07T13:21:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58a4edd3d0df0d06c6e60251345a8e4a658bc4a3fceb4c01a21a9e98aeabfb6f
    source_path: platforms/mac/signing.md
    workflow: 16
---

# mac 서명(디버그 빌드)

이 앱은 일반적으로 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)에서 빌드되며, 현재 다음을 수행합니다.

- 안정적인 디버그 번들 식별자를 설정합니다: `ai.openclaw.mac.debug`
- 해당 번들 ID로 Info.plist를 작성합니다(`BUNDLE_ID=...`로 재정의 가능).
- [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh)를 호출하여 메인 바이너리와 앱 번들에 서명합니다. 이렇게 하면 macOS가 각 재빌드를 동일한 서명된 번들로 취급하고 TCC 권한(알림, 손쉬운 사용, 화면 기록, 마이크, 음성)을 유지합니다. 안정적인 권한을 위해 실제 서명 ID를 사용하세요. ad-hoc은 명시적으로 선택해야 하며 취약합니다([macOS 권한](/ko/platforms/mac/permissions) 참조).
- 기본적으로 `CODESIGN_TIMESTAMP=auto`를 사용합니다. Developer ID 서명에 신뢰할 수 있는 타임스탬프를 활성화합니다. 타임스탬프를 건너뛰려면 `CODESIGN_TIMESTAMP=off`를 설정하세요(오프라인 디버그 빌드).
- 빌드 메타데이터를 Info.plist에 주입합니다: `OpenClawBuildTimestamp`(UTC) 및 `OpenClawGitCommit`(짧은 해시). About 창에서 빌드, git, 디버그/릴리스 채널을 표시할 수 있습니다.
- **패키징은 기본적으로 Node 24를 사용합니다**: 이 스크립트는 TS 빌드와 Control UI 빌드를 실행합니다. 현재 `22.16+`인 Node 22 LTS는 호환성을 위해 계속 지원됩니다.
- 환경에서 `SIGN_IDENTITY`를 읽습니다. 항상 인증서로 서명하려면 셸 rc에 `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`(또는 Developer ID Application 인증서)를 추가하세요. ad-hoc 서명은 `ALLOW_ADHOC_SIGNING=1` 또는 `SIGN_IDENTITY="-"`를 통해 명시적으로 선택해야 합니다(권한 테스트에는 권장하지 않음).
- 서명 후 Team ID 감사를 실행하고, 앱 번들 내부의 Mach-O가 다른 Team ID로 서명되어 있으면 실패합니다. 우회하려면 `SKIP_TEAM_ID_CHECK=1`을 설정하세요.

## 사용법

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### ad-hoc 서명 참고

`SIGN_IDENTITY="-"`(ad-hoc)로 서명할 때, 스크립트는 **Hardened Runtime**(`--options runtime`)을 자동으로 비활성화합니다. 이는 앱이 동일한 Team ID를 공유하지 않는 내장 프레임워크(예: Sparkle)를 로드하려고 할 때 발생하는 충돌을 방지하는 데 필요합니다. ad-hoc 서명은 TCC 권한 지속성도 깨뜨립니다. 복구 단계는 [macOS 권한](/ko/platforms/mac/permissions)을 참조하세요.

## About용 빌드 메타데이터

`package-mac-app.sh`는 번들에 다음을 기록합니다.

- `OpenClawBuildTimestamp`: 패키징 시점의 ISO8601 UTC
- `OpenClawGitCommit`: 짧은 git 해시(사용할 수 없으면 `unknown`)

About 탭은 이 키를 읽어 버전, 빌드 날짜, git 커밋, 그리고 디버그 빌드 여부(`#if DEBUG`를 통해)를 표시합니다. 코드 변경 후 이러한 값을 새로 고치려면 패키저를 실행하세요.

## 이유

TCC 권한은 번들 식별자 _및_ 코드 서명에 연결됩니다. UUID가 바뀌는 서명되지 않은 디버그 빌드 때문에 macOS가 재빌드할 때마다 부여된 권한을 잊어버렸습니다. 바이너리에 서명하고(기본적으로 ad-hoc) 고정 번들 ID/경로(`dist/OpenClaw.app`)를 유지하면 빌드 간 권한이 보존되며, 이는 VibeTunnel 접근 방식과 일치합니다.

## 관련 항목

- [macOS 앱](/ko/platforms/macos)
- [macOS 권한](/ko/platforms/mac/permissions)
