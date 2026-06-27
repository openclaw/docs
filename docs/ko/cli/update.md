---
read_when:
    - 소스 체크아웃을 안전하게 업데이트하려는 경우
    - '`openclaw update` 출력 또는 옵션을 디버깅 중입니다'
    - '`--update` 축약 동작을 이해해야 합니다'
summary: '`openclaw update`의 CLI 참조(비교적 안전한 소스 업데이트 + Gateway 자동 재시작)'
title: 업데이트
x-i18n:
    generated_at: "2026-06-27T17:20:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3503e1cd15baa4d4f6c26734b37556831c612f1da0da5ccfe7bcde35b9be64b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw를 안전하게 업데이트하고 stable/beta/dev 채널 간에 전환합니다.

**npm/pnpm/bun**으로 설치한 경우(전역 설치, git 메타데이터 없음),
업데이트는 [업데이트](/ko/install/updating)의 패키지 관리자 흐름을 통해 이루어집니다.

## 사용법

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

## 옵션

- `--no-restart`: 업데이트가 성공한 뒤 Gateway 서비스를 다시 시작하지 않습니다. Gateway를 다시 시작하는 패키지 관리자 업데이트는 명령이 성공하기 전에 다시 시작된 서비스가 예상된 업데이트 버전을 보고하는지 확인합니다.
- `--channel <stable|beta|dev>`: 업데이트 채널을 설정합니다(git + npm; 구성에 유지됨).
- `--tag <dist-tag|version|spec>`: 이 업데이트에 한해 패키지 대상을 재정의합니다. 패키지 설치의 경우 `main`은 `github:openclaw/openclaw#main`에 매핑됩니다. GitHub/git 소스 사양은 단계적 전역 npm 설치 전에 임시 tarball로 패키징됩니다.
- `--dry-run`: 구성을 쓰거나, 설치하거나, Plugin을 동기화하거나, 다시 시작하지 않고 계획된 업데이트 작업(채널/태그/대상/재시작 흐름)을 미리 봅니다.
- `--json`: 기계가 읽을 수 있는 `UpdateRunResult` JSON을 출력합니다. 여기에는
  코어 업데이트가 성공한 뒤 손상되었거나 로드할 수 없는 관리형 Plugin을
  복구해야 할 때의 `postUpdate.plugins.warnings`, Plugin에 beta 릴리스가 없을 때의
  beta 채널 Plugin 폴백 세부 정보, 그리고 업데이트 후 Plugin 동기화 중 npm Plugin
  아티팩트 드리프트가 감지될 때의 `postUpdate.plugins.integrityDrifts`가 포함됩니다.
- `--timeout <seconds>`: 단계별 제한 시간입니다(기본값은 1800초).
- `--yes`: 확인 프롬프트를 건너뜁니다(예: 다운그레이드 확인).
- `--acknowledge-clawhub-risk`: 커뮤니티 ClawHub 신뢰
  경고를 검토한 뒤, 대화형 프롬프트 없이 업데이트 후 Plugin 동기화를 계속하도록 허용합니다.
  이 옵션이 없으면 OpenClaw가 프롬프트를 표시할 수 없을 때 위험한 커뮤니티 ClawHub Plugin 릴리스는 건너뛰고
  변경하지 않습니다. 공식 ClawHub 패키지와
  번들 OpenClaw Plugin 소스는 이 릴리스 신뢰 프롬프트를 우회합니다.

`openclaw update`에는 `--verbose` 플래그가 없습니다. 계획된
채널/태그/설치/재시작 작업을 미리 보려면 `--dry-run`을 사용하고, 기계가 읽을 수 있는
결과가 필요하면 `--json`을 사용하며, 채널과
사용 가능 여부 세부 정보만 필요하면 `openclaw update status --json`을 사용하세요. 업데이트와 관련해 Gateway 로그를 디버깅하는 경우,
콘솔 상세도와 파일 로그 수준은 별개입니다. Gateway `--verbose`는
터미널/WebSocket 출력에 영향을 주며, 파일 로그에는 구성의 `logging.level: "debug"` 또는
`"trace"`가 필요합니다. [Gateway 로깅](/ko/gateway/logging)을 참조하세요.

<Note>
Nix 모드(`OPENCLAW_NIX_MODE=1`)에서는 상태를 변경하는 `openclaw update` 실행이 비활성화됩니다. 대신 이 설치의 Nix 소스 또는 flake 입력을 업데이트하세요. nix-openclaw의 경우 agent-first [빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start)을 사용하세요. `openclaw update status`와 `openclaw update --dry-run`은 읽기 전용으로 유지됩니다.
</Note>

<Warning>
이전 버전은 구성을 손상시킬 수 있으므로 다운그레이드에는 확인이 필요합니다.
</Warning>

## `update status`

활성 업데이트 채널 + git 태그/브랜치/SHA(소스 checkout의 경우)와 업데이트 사용 가능 여부를 표시합니다.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

옵션:

- `--json`: 기계가 읽을 수 있는 상태 JSON을 출력합니다.
- `--timeout <seconds>`: 확인 제한 시간입니다(기본값은 3초).

## `update repair`

코어 패키지는 이미 변경되었지만 이후의 복구 작업이 깔끔하게 완료되지 않은 경우
업데이트 마무리를 다시 실행합니다. 이는
`openclaw update`가 새 코어 패키지를 설치했지만 코어 이후 Plugin 동기화,
관리형 npm Plugin 메타데이터, 레지스트리 새로 고침 또는 doctor 복구가 아직
수렴해야 할 때 지원되는 복구 경로입니다.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

옵션:

- `--channel <stable|beta|dev>`: 복구 전에 업데이트 채널을 유지하고
  해당 채널을 기준으로 Plugin 수렴을 실행합니다.
- `--json`: 기계가 읽을 수 있는 마무리 JSON을 출력합니다.
- `--timeout <seconds>`: 복구 단계 제한 시간입니다(기본값 `1800`).
- `--yes`: 확인 프롬프트를 건너뜁니다.
- `--acknowledge-clawhub-risk`: 커뮤니티 ClawHub 신뢰
  경고를 검토한 뒤, 대화형 프롬프트 없이 복구 시점 Plugin 수렴을 계속하도록
  허용합니다. 공식 ClawHub 패키지와 번들 OpenClaw Plugin
  소스는 이 릴리스 신뢰 프롬프트를 우회합니다.
- `--no-restart`: update 명령과의 호환성을 위해 허용됩니다. repair는
  Gateway를 다시 시작하지 않습니다.

`openclaw update repair`는 `openclaw doctor --fix`를 실행하고, 복구된
구성과 설치 기록을 다시 로드하며, 활성 업데이트 채널의 추적 대상 Plugin을 동기화하고,
관리형 npm Plugin 설치를 업데이트하며, 누락된 구성된 Plugin 페이로드를 복구하고,
Plugin 레지스트리를 새로 고친 뒤 수렴된 설치 기록 메타데이터를 기록합니다.
새 코어 패키지를 설치하지 않으며 Gateway를 다시 시작하지 않습니다.

## `update wizard`

업데이트 채널을 선택하고 업데이트 후 Gateway를 다시 시작할지 확인하는 대화형 흐름입니다
(기본값은 다시 시작). git checkout 없이 `dev`를 선택하면
checkout 생성을 제안합니다.

옵션:

- `--timeout <seconds>`: 각 업데이트 단계의 제한 시간입니다(기본값 `1800`)

## 수행 내용

명시적으로 채널을 전환하면(`--channel ...`) OpenClaw는
설치 방법도 일치하도록 유지합니다.

- `dev` → git checkout을 보장합니다(기본값: `~/openclaw`, 또는
  `OPENCLAW_HOME`이 설정된 경우 `$OPENCLAW_HOME/openclaw`;
  `OPENCLAW_GIT_DIR`로 재정의 가능).
  이를 업데이트하고 해당 checkout에서 전역 CLI를 설치합니다.
- `stable` → `latest`를 사용해 npm에서 설치합니다.
- `beta` → npm dist-tag `beta`를 우선하지만, beta가 없거나 현재 stable 릴리스보다
  오래된 경우 `latest`로 폴백합니다.

Gateway 코어 자동 업데이트(구성을 통해 활성화된 경우)는 라이브 Gateway 요청 핸들러
밖에서 CLI 업데이트 경로를 실행합니다. 컨트롤 플레인 `update.run`
패키지 관리자 업데이트와 감독되는 git-checkout 업데이트도 라이브 Gateway 프로세스 안에서
패키지 트리를 교체하거나 `dist/`를 다시 빌드하는 대신
관리형 서비스 handoff를 사용합니다. Gateway는 분리된 helper를 시작하고,
종료한 뒤, helper가 Gateway 프로세스 트리 밖에서 일반 `openclaw update --yes --json` CLI 경로를
실행합니다. 해당 handoff를 사용할 수 없으면
`update.run`은 수동으로 실행할 안전한 shell 명령이 포함된 구조화된 응답을 반환합니다.

패키지 관리자 설치의 경우 `openclaw update`는 패키지 관리자를 호출하기 전에
대상 패키지 버전을 확인합니다. npm 전역 설치는 단계적
설치를 사용합니다. OpenClaw는 새 패키지를 임시 npm prefix에 설치하고,
그곳에서 패키징된 `dist` 인벤토리를 확인한 다음, 그 깨끗한 패키지 트리를
실제 전역 prefix로 교체합니다. 확인이 실패하면 업데이트 후 doctor, Plugin 동기화, 그리고
재시작 작업은 의심스러운 트리에서 실행되지 않습니다. 설치된 버전이
이미 대상과 일치하더라도, 명령은 전역 패키지 설치를 새로 고친 다음
Plugin 동기화, 코어 명령 completion 새로 고침, 재시작 작업을 실행합니다. 이렇게 하면
패키징된 sidecar와 채널 소유 Plugin 기록이 설치된
OpenClaw 빌드와 정렬되며, 전체 Plugin 명령 completion 재빌드는
명시적인 `openclaw completion --write-state` 실행에 맡깁니다.

로컬 관리형 Gateway 서비스가 설치되어 있고 재시작이 활성화된 경우,
패키지 관리자 및 git-checkout 업데이트는 패키지 트리를 교체하거나
checkout/build 출력을 변경하기 전에 실행 중인 서비스를 중지합니다. 그런 다음 updater는
업데이트된 설치에서 서비스 메타데이터를 새로 고치고, 서비스를 다시 시작하며,
보고하기 전에 다시 시작된 Gateway를 확인합니다
`Gateway: restarted and verified.`. 패키지 관리자 업데이트는 추가로
다시 시작된 Gateway가 예상된 패키지 버전을 보고하는지 확인합니다. git-checkout 업데이트는
재빌드 후 gateway 상태와 서비스 준비 상태를 확인합니다. macOS에서는
업데이트 후 확인이 활성
프로필에 대해 LaunchAgent가 로드/실행 중인지와 구성된 loopback 포트가 정상인지도 확인합니다. plist가 설치되어 있지만
launchd가 이를 감독하지 않는 경우 OpenClaw는 LaunchAgent를
자동으로 다시 부트스트랩한 다음 상태/버전/채널 준비 확인을 다시 실행합니다. 새
부트스트랩은 RunAtLoad 작업을 직접 로드하므로 업데이트 복구는
새로 생성된 Gateway에 즉시 `kickstart -k`를 실행하지 않습니다. Gateway가 여전히
정상 상태가 되지 않으면 명령은 0이 아닌 코드로 종료하고 재시작 로그 경로와 함께
명시적인 재시작, 재설치, 패키지 롤백 지침을 출력합니다. 재시작을
실행할 수 없으면 명령은 `Gateway: restart skipped (...)` 또는
`Gateway: restart failed: ...`와 수동 `openclaw gateway restart` 힌트를 출력합니다.
`--no-restart`를 사용하면 패키지 교체 또는 git 재빌드는 계속 실행되지만
관리형 서비스는 중지되거나 다시 시작되지 않으므로, 수동으로 다시 시작할 때까지 실행 중인 Gateway가 이전
코드를 계속 사용할 수 있습니다.

### 컨트롤 플레인 응답 형태

패키지 관리자 설치 또는 감독되는 git checkout에서 Gateway 컨트롤 플레인을 통해
`update.run`이 호출되면, 핸들러는 Gateway가 종료된 뒤 계속되는
CLI 업데이트와 handoff 시작을 별도로 보고합니다.

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"`, 그리고
  `handoff.status: "started"`는 Gateway가 관리형 서비스
  handoff를 생성하고 자체 재시작을 예약했으므로 분리된 helper가
  라이브 서비스 프로세스 밖에서 `openclaw update --yes --json`을 실행할 수 있음을 의미합니다.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"`, 그리고
  `handoff.status: "unavailable"`는 OpenClaw가 안전한 handoff를 위한 감독
  서비스 경계와 내구성 있는 서비스 ID를 찾지 못했음을 의미합니다. 예를
  들어 systemd handoff에는 주변 systemd 프로세스 마커만이 아니라 OpenClaw unit ID
  (`OPENCLAW_SYSTEMD_UNIT`)가 필요합니다. 응답에는 Gateway 밖에서 실행할
  shell 명령인 `handoff.command`가 포함됩니다.
- `ok: false`, `result.reason: "managed-service-handoff-failed"`는
  Gateway가 handoff 생성을 시도했지만 분리된 helper를 시작하지 못했음을 의미합니다.

`sentinel` 페이로드는 Gateway가 종료되기 전에 계속 기록되며, CLI
handoff는 관리형 서비스 재시작 상태 확인이 완료된 뒤 같은 재시작 sentinel을
업데이트합니다. handoff 중에는 sentinel이 성공 continuation 없이
`stats.reason: "restart-health-pending"`을 포함할 수 있습니다. 다시 시작된
Gateway는 이를 계속 polling하고, CLI가 서비스 상태를 확인하고 최종 `ok`
결과로 sentinel을 다시 쓴 뒤에만 continuation을 실행합니다.
`openclaw status`와 `openclaw status --all`은 해당 sentinel이 pending 또는 failed 상태일 때
`Update restart` 행을 표시하며, `update.status`는 최신 sentinel을 새로 고쳐
반환합니다.

## Git checkout 흐름

### 채널 선택

- `stable`: 최신 non-beta 태그를 checkout한 다음 build와 doctor를 실행합니다.
- `beta`: 최신 `-beta` 태그를 우선하지만, beta가 없거나 더 오래된 경우 최신 stable 태그로 폴백합니다.
- `dev`: `main`을 checkout한 다음 fetch와 rebase를 실행합니다.

### 업데이트 단계

<Steps>
  <Step title="깨끗한 작업 트리 확인">
    커밋되지 않은 변경 사항이 없어야 합니다.
  </Step>
  <Step title="채널 전환">
    선택한 채널(태그 또는 브랜치)로 전환합니다.
  </Step>
  <Step title="업스트림 가져오기">
    개발 전용입니다.
  </Step>
  <Step title="사전 빌드 검사(개발 전용)">
    임시 작업 트리에서 TypeScript 빌드를 실행합니다. 팁이 실패하면 최신 빌드 가능한 커밋을 찾기 위해 최대 10개 커밋까지 되돌아갑니다. 이 사전 검사 중 lint도 실행하려면 `OPENCLAW_UPDATE_PREFLIGHT_LINT=1`을 설정하세요. 사용자 업데이트 호스트는 CI 러너보다 작은 경우가 많으므로 lint는 제한된 직렬 모드로 실행됩니다.
  </Step>
  <Step title="리베이스">
    선택한 커밋 위로 리베이스합니다(개발 전용).
  </Step>
  <Step title="의존성 설치">
    저장소 패키지 관리자를 사용합니다. pnpm 체크아웃의 경우 업데이트 프로그램은 pnpm 워크스페이스 안에서 `npm run build`를 실행하는 대신 필요할 때 `pnpm`을 부트스트랩합니다(먼저 `corepack`을 사용하고, 그다음 임시 `npm install pnpm@11` 대체 경로를 사용).
  </Step>
  <Step title="Control UI 빌드">
    Gateway와 Control UI를 빌드합니다.
  </Step>
  <Step title="doctor 실행">
    `openclaw doctor`가 최종 안전 업데이트 검사로 실행됩니다.
  </Step>
  <Step title="Plugin 동기화">
    Plugin을 활성 채널에 동기화합니다. 개발 채널은 번들 Plugin을 사용하고, stable 및 beta는 npm을 사용합니다. 추적 중인 Plugin 설치를 업데이트합니다.
  </Step>
</Steps>

beta 업데이트 채널에서는 기본/latest 라인을 따르는 추적 중인 npm 및 ClawHub Plugin 설치가 먼저 Plugin `@beta` 릴리스를 시도합니다. Plugin에 beta 릴리스가 없으면 OpenClaw는 기록된 기본/latest 사양으로 대체하고 이를 경고로 보고합니다. npm Plugin의 경우 beta 패키지가 존재하지만 설치 검증에 실패해도 OpenClaw가 대체 경로로 전환합니다. 이러한 Plugin 대체 경고는 core 업데이트를 실패하게 만들지 않습니다. 정확한 버전과 명시적 태그는 다시 작성되지 않습니다.

<Warning>
정확히 고정된 npm Plugin 업데이트가 저장된 설치 기록과 무결성이 다른 아티팩트로 해석되면, `openclaw update`는 해당 Plugin 아티팩트 업데이트를 설치하지 않고 중단합니다. 새 아티팩트를 신뢰할 수 있음을 확인한 뒤에만 Plugin을 명시적으로 다시 설치하거나 업데이트하세요.
</Warning>

<Note>
관리되는 Plugin에 한정되고 동기화 경로가 우회할 수 있는 업데이트 후 Plugin 동기화 실패(예: 필수적이지 않은 Plugin에 대해 접근할 수 없는 npm 레지스트리)는 core 업데이트가 성공한 뒤 경고로 보고됩니다. JSON 결과는 최상위 업데이트 `status: "ok"`를 유지하고 `openclaw update repair` 및 `openclaw plugins inspect <id> --runtime --json` 안내와 함께 `postUpdate.plugins.status: "warning"`을 보고합니다. 예상치 못한 업데이트 프로그램 또는 동기화 예외는 여전히 업데이트 결과를 실패시킵니다. Plugin 설치 또는 업데이트 오류를 수정한 다음 `openclaw update repair`를 다시 실행하세요.

Plugin별 동기화 단계가 끝난 뒤, `openclaw update`는 Gateway를 다시 시작하기 전에 필수 **post-core convergence** 패스를 실행합니다. 이 패스는 누락된 구성된 Plugin 페이로드를 복구하고, 디스크에 있는 각 _활성_ 추적 설치 기록을 검증하며, 해당 `package.json`을 파싱할 수 있는지(그리고 명시적으로 선언된 `main`이 있으면 존재하는지) 정적으로 확인합니다. 이 패스의 실패와 유효하지 않은 OpenClaw config 스냅샷은 `postUpdate.plugins.status: "error"`를 반환하고 최상위 업데이트 `status`를 `"error"`로 전환하므로, `openclaw update`는 0이 아닌 코드로 종료되고 검증되지 않은 Plugin 집합으로 Gateway가 다시 시작되지 않습니다. 오류에는 후속 조치를 위해 `openclaw update repair` 및 `openclaw plugins inspect <id> --runtime --json`을 가리키는 구조화된 `postUpdate.plugins.warnings[].guidance` 줄이 포함됩니다. 비활성화된 Plugin 항목과 신뢰할 수 있는 소스에 연결된 공식 동기화 대상이 아닌 기록은 여기서 건너뜁니다. 이는 누락된 페이로드 검사에서 사용하는 `skipDisabledPlugins` 정책과 동일하므로, 오래된 비활성화 Plugin 기록이 그 외에는 유효한 업데이트를 차단할 수 없습니다.

업데이트된 Gateway가 시작되면 Plugin 로딩은 검증 전용입니다. 시작 과정은 패키지 관리자를 실행하거나 의존성 트리를 변경하지 않습니다. 패키지 관리자 `update.run` 재시작은 CLI 관리 서비스 경로에 넘겨지므로, 패키지 교체는 이전 Gateway 프로세스 밖에서 이루어지고 서비스 상태 검사가 업데이트를 완료로 보고할 수 있는지 결정합니다.

pnpm 부트스트랩이 여전히 실패하면 업데이트 프로그램은 체크아웃 안에서 `npm run build`를 시도하는 대신 패키지 관리자별 오류와 함께 일찍 중단됩니다.
</Note>

## `--update` 축약형

`openclaw --update`는 `openclaw update`로 다시 작성됩니다(셸 및 런처 스크립트에 유용).

## 관련 항목

- `openclaw doctor`(git 체크아웃에서 먼저 업데이트 실행을 제안)
- [개발 채널](/ko/install/development-channels)
- [업데이트](/ko/install/updating)
- [CLI 참조](/ko/cli)
