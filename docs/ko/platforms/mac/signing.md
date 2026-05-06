---
read_when:
    - mac 디버그 빌드를 빌드하거나 서명하기
summary: 패키징 스크립트가 생성한 macOS 디버그 빌드의 서명 단계
title: macOS 서명
x-i18n:
    generated_at: "2026-05-06T06:33:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08a2f18f0f813c0bb7352b393531ad69d24da55de2e6ec6446febe0661eb4598
    source_path: platforms/mac/signing.md
    workflow: 16
---

# mac 서명(디버그 빌드)

이 앱은 보통 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)에서 빌드되며, 현재 이 스크립트는 다음을 수행합니다.

- 안정적인 디버그 번들 식별자를 설정합니다: `ai.openclaw.mac.debug`
- 해당 번들 ID로 Info.plist를 작성합니다(`BUNDLE_ID=...`로 재정의 가능).
- [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh)를 호출해 메인 바이너리와 앱 번들에 서명하여, macOS가 각 재빌드를 동일한 서명된 번들로 취급하고 TCC 권한(알림, 손쉬운 사용, 화면 기록, 마이크, 말하기)을 유지하도록 합니다. 안정적인 권한을 위해서는 실제 서명 ID를 사용하세요. 애드혹은 명시적으로 선택해야 하며 취약합니다([macOS 권한](/ko/platforms/mac/permissions) 참조).
- 기본적으로 `CODESIGN_TIMESTAMP=auto`를 사용합니다. 이는 Developer ID 서명에 신뢰된 타임스탬프를 활성화합니다. 타임스탬프를 건너뛰려면 `CODESIGN_TIMESTAMP=off`를 설정하세요(오프라인 디버그 빌드).
- 빌드 메타데이터를 Info.plist에 주입합니다: `OpenClawBuildTimestamp`(UTC) 및 `OpenClawGitCommit`(짧은 해시). 이를 통해 정보 창에서 빌드, git, 디버그/릴리스 채널을 표시할 수 있습니다.
- **패키징은 기본적으로 Node 24를 사용합니다**: 스크립트는 TS 빌드와 Control UI 빌드를 실행합니다. 호환성을 위해 Node 22 LTS(현재 `22.14+`)도 계속 지원됩니다.
- 환경에서 `SIGN_IDENTITY`를 읽습니다. 항상 자신의 인증서로 서명하려면 셸 rc에 `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`(또는 Developer ID Application 인증서)를 추가하세요. 애드혹 서명은 `ALLOW_ADHOC_SIGNING=1` 또는 `SIGN_IDENTITY="-"`를 통해 명시적으로 선택해야 합니다(권한 테스트에는 권장하지 않음).
- 서명 후 Team ID 감사를 실행하며, 앱 번들 내부의 Mach-O 중 다른 Team ID로 서명된 항목이 있으면 실패합니다. 우회하려면 `SKIP_TEAM_ID_CHECK=1`을 설정하세요.

## 사용법

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### 애드혹 서명 참고

`SIGN_IDENTITY="-"`(애드혹)로 서명할 때, 스크립트는 자동으로 **Hardened Runtime**(`--options runtime`)을 비활성화합니다. 이는 앱이 동일한 Team ID를 공유하지 않는 임베디드 프레임워크(예: Sparkle)를 로드하려고 할 때 발생하는 충돌을 방지하기 위해 필요합니다. 애드혹 서명은 TCC 권한 지속성도 깨뜨립니다. 복구 단계는 [macOS 권한](/ko/platforms/mac/permissions)을 참조하세요.

## 정보 창용 빌드 메타데이터

`package-mac-app.sh`는 번들에 다음 값을 찍습니다.

- `OpenClawBuildTimestamp`: 패키징 시점의 ISO8601 UTC
- `OpenClawGitCommit`: 짧은 git 해시(사용할 수 없는 경우 `unknown`)

정보 탭은 이 키를 읽어 버전, 빌드 날짜, git 커밋, 그리고 디버그 빌드 여부(`#if DEBUG`를 통해)를 표시합니다. 코드 변경 후에는 패키저를 실행해 이 값들을 새로 고치세요.

## 이유

TCC 권한은 번들 식별자 _및_ 코드 서명에 연결됩니다. UUID가 바뀌는 서명되지 않은 디버그 빌드는 macOS가 각 재빌드 후 허용 권한을 잊어버리게 만들었습니다. 바이너리에 서명하고(기본값은 애드혹) 고정된 번들 ID/경로(`dist/OpenClaw.app`)를 유지하면 VibeTunnel 방식과 동일하게 빌드 간 허용 권한이 보존됩니다.

## 관련 항목

- [macOS 앱](/ko/platforms/macos)
- [macOS 권한](/ko/platforms/mac/permissions)
