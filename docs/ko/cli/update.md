---
read_when:
    - 소스 체크아웃을 안전하게 업데이트하려고 합니다
    - '`openclaw update` 출력 또는 옵션을 디버깅하고 있습니다'
    - '`--update` 축약 동작을 이해해야 합니다'
summary: '`openclaw update`의 CLI 참조(비교적 안전한 소스 업데이트 + Gateway 자동 재시작)'
title: 업데이트
x-i18n:
    generated_at: "2026-07-12T15:08:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2db7b636b68e693824cb49ada2c176a4e394a3100ce33fff1c96ee20ae8427ee
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw을 업데이트하고 stable/extended-stable/beta/dev 채널 간에 전환합니다.

**npm/pnpm/bun**을 통해 설치한 경우(전역 설치, git 메타데이터 없음),
업데이트는 [업데이트](/ko/install/updating)에 설명된 패키지 관리자 흐름을
통해 진행됩니다.

## 사용법

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel extended-stable
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

`openclaw --update`는 `openclaw update`로 재작성됩니다(셸 및
런처 스크립트에 유용합니다).

## 옵션

| 플래그                                           | 설명                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | 업데이트 성공 후 Gateway 서비스 재시작을 건너뜁니다. 재시작을 수행하는 패키지 관리자 업데이트는 명령이 성공하기 전에 재시작된 서비스가 예상 버전을 보고하는지 확인합니다.                                                                                                                                                                              |
| `--channel <stable\|extended-stable\|beta\|dev>` | 업데이트 채널을 설정하고 코어 업데이트가 성공한 후 이를 영구 저장합니다. Extended-stable은 패키지 설치에서만 사용할 수 있습니다.                                                                                                                                                                                                                      |
| `--tag <dist-tag\|version\|spec>`                | 이 업데이트에만 사용할 패키지 대상을 재정의합니다. 검증된 정확한 대상이 필수인 유효 `extended-stable` 채널과 함께 사용할 수 없습니다. 다른 패키지 설치에서는 `main`이 `github:openclaw/openclaw#main`에 매핑되며, GitHub/git 소스 명세는 단계적 전역 npm 설치 전에 임시 tarball로 패키징됩니다. |
| `--dry-run`                                      | 구성을 작성하거나 설치, Plugin 동기화 또는 재시작을 수행하지 않고 계획된 작업(채널/태그/대상/재시작 흐름)을 미리 확인합니다.                                                                                                                                                                                                                           |
| `--json`                                         | 머신 판독 가능한 `UpdateRunResult` JSON을 출력합니다. 관리형 Plugin에 복구가 필요할 때의 `postUpdate.plugins.warnings`, beta 채널 Plugin 대체 세부 정보, 업데이트 후 동기화 중 npm Plugin 아티팩트 드리프트가 감지될 때의 `postUpdate.plugins.integrityDrifts`를 포함합니다.                                                                           |
| `--timeout <seconds>`                            | 단계별 제한 시간입니다. 기본값은 `1800`입니다.                                                                                                                                                                                                                                                                                                       |
| `--yes`                                          | 확인 프롬프트(예: 다운그레이드 확인)를 건너뜁니다.                                                                                                                                                                                                                                                                                                   |
| `--acknowledge-clawhub-risk`                     | 대화형 프롬프트 없이 커뮤니티 ClawHub 신뢰 경고를 지나 업데이트 후 Plugin 동기화를 계속하도록 허용합니다. 이 옵션이 없고 OpenClaw이 프롬프트를 표시할 수 없는 경우, 위험한 커뮤니티 릴리스는 건너뛰고 변경하지 않습니다. 공식 ClawHub 패키지와 번들 Plugin 소스에는 이 프롬프트가 적용되지 않습니다.                                                   |

`--verbose` 플래그는 없습니다. 계획된 작업을 미리 확인하려면 `--dry-run`,
머신 판독 가능한 결과를 얻으려면 `--json`, 채널/사용 가능 여부만 확인하려면
`openclaw update status --json`을 사용하십시오. Gateway 콘솔 상세 출력
(`--verbose`)과 파일 로그 수준(`logging.level: "debug"`/`"trace"`)은 서로
독립적인 설정입니다. [Gateway 로깅](/ko/gateway/logging)을 참조하십시오.

<Note>
Nix 모드(`OPENCLAW_NIX_MODE=1`)에서는 상태를 변경하는 `openclaw update` 실행이 비활성화됩니다. 대신 이 설치의 Nix 소스 또는 flake 입력을 업데이트하십시오. nix-openclaw의 경우 에이전트 우선 [빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start)을 사용하십시오. `openclaw update status`와 `openclaw update --dry-run`은 계속 읽기 전용으로 동작합니다.
</Note>

<Warning>
이전 버전은 구성을 손상시킬 수 있으므로 다운그레이드하려면 확인이 필요합니다.
설치에서 세션을 이미 SQLite로 마이그레이션했다면, 이전 파일 기반 버전을 시작하기
전에 보관된 레거시 트랜스크립트 아티팩트를 복원하십시오.
[Doctor: 세션 SQLite 마이그레이션 후 다운그레이드](/ko/cli/doctor#downgrading-after-session-sqlite-migration)를
참조하십시오.
</Warning>

## `update status`

활성 업데이트 채널, git 태그/브랜치/SHA(소스 체크아웃만 해당),
업데이트 사용 가능 여부를 표시합니다.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| 플래그                | 기본값  | 설명                                  |
| --------------------- | ------- | ------------------------------------- |
| `--json`              | `false` | 머신 판독 가능한 상태 JSON을 출력합니다. |
| `--timeout <seconds>` | `3`     | 확인 제한 시간입니다.                 |

Extended-stable 패키지 설치의 경우 상태 확인은 포그라운드 업데이트와 동일한
공개 선택자 및 정확한 패키지 검증을 수행합니다. 설치된 버전이 더 최신이면
`ahead of extended-stable`을 보고할 수 있습니다. JSON 실패에는
`registry.reason`(`selector_missing`, `selector_query_failed`,
`exact_package_mismatch` 또는 `unsupported_git_channel`)이 포함됩니다.

## `update repair`

코어 패키지는 이미 변경되었지만 이후 복구 작업이 정상적으로 완료되지 않은 경우
업데이트 마무리 작업을 다시 실행합니다. `openclaw update`가 새 코어 패키지를
설치했지만 코어 이후의 Plugin 동기화, 관리형 npm Plugin 메타데이터,
레지스트리 새로 고침 또는 Doctor 복구가 수렴하지 못한 경우 지원되는 복구
경로입니다.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| 플래그                                           | 설명                                                                                                                                                                                                                                                                        |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | 복구 전에 코어 업데이트 채널을 영구 저장합니다. Extended-stable의 경우 bare/default 또는 `latest` 의도를 따르는 적격 공식 npm Plugin은 설치된 정확한 코어 버전을 대상으로 합니다. Git 체크아웃에서는 구성을 변경하지 않고 Extended-stable 복구가 거부됩니다. |
| `--json`                                         | 머신 판독 가능한 마무리 JSON을 출력합니다.                                                                                                                                                                                                                                  |
| `--timeout <seconds>`                            | 복구 단계의 제한 시간입니다. 기본값은 `1800`입니다.                                                                                                                                                                                                                         |
| `--yes`                                          | 확인 프롬프트를 건너뜁니다.                                                                                                                                                                                                                                                  |
| `--acknowledge-clawhub-risk`                     | `openclaw update`에서와 동일하게 동작합니다.                                                                                                                                                                                                                                 |
| `--no-restart`                                   | 일관성을 위해 허용되지만, 복구는 Gateway를 재시작하지 않습니다.                                                                                                                                                                                                              |

`update repair`는 `openclaw doctor --fix`를 실행하고, 복구된 구성과
설치 레코드를 다시 로드하며, 활성 업데이트 채널의 추적 대상 Plugin을 동기화하고,
관리형 npm Plugin 설치를 업데이트하며, 구성되었지만 누락된 Plugin 페이로드를
복구하고, Plugin 레지스트리를 새로 고친 다음, 수렴된 설치 레코드 메타데이터를
작성합니다. 새 코어 패키지는 설치하지 않으며 Gateway도 재시작하지 않습니다.

## `update wizard`

업데이트 채널을 선택하고 이후 Gateway를 재시작할지 확인하는 대화형 흐름입니다
(기본값은 재시작). git 체크아웃이 없는 상태에서 `dev`를 선택하면 체크아웃 생성을
제안합니다.

| 플래그                | 기본값 | 설명                             |
| --------------------- | ------ | -------------------------------- |
| `--timeout <seconds>` | `1800` | 각 업데이트 단계의 제한 시간입니다. |

## 수행 작업

채널을 명시적으로 전환하면(`--channel ...`) 설치 방식도 이에 맞게 유지됩니다.

- `dev` -> git 체크아웃(기본값 `~/openclaw`, 또는 `OPENCLAW_HOME`이 설정된
  경우 `$OPENCLAW_HOME/openclaw`; `OPENCLAW_GIT_DIR`로 재정의)을 확보하고,
  이를 업데이트한 다음 해당 체크아웃에서 전역 CLI를 설치합니다.
- `stable` -> `latest`를 사용하여 npm에서 설치합니다.
- `extended-stable` -> 공개 npm `extended-stable` 선택자를 해석하고,
  선택된 정확한 패키지를 검증한 후 해당 정확한 버전을 설치합니다. 다른 선택자로
  대체하지 않으며 Git 체크아웃에서는 거부됩니다.
- `beta` -> npm dist-tag `beta`를 우선 사용하며, beta가 없거나 현재 stable
  릴리스보다 오래된 경우 `latest`로 대체합니다.

### 재시작 인계

Gateway 코어 자동 업데이트 도구(구성을 통해 활성화된 경우)는 실행 중인 Gateway
요청 핸들러 외부에서 CLI 업데이트 경로를 시작합니다. 제어 영역의 `update.run`
패키지 관리자 업데이트와 감독되는 git 체크아웃 업데이트는 실행 중인 Gateway
프로세스 안에서 패키지 트리를 교체하거나 `dist/`를 다시 빌드하는 대신 동일한
관리형 서비스 인계를 사용합니다. Gateway는 분리된 헬퍼를 시작한 뒤 종료하며,
해당 헬퍼는 Gateway 프로세스 트리 외부에서 `openclaw update --yes --json`을
실행합니다. 인계를 사용할 수 없는 경우 `update.run`은 수동으로 실행할 안전한
셸 명령이 포함된 구조화된 응답을 반환합니다.

저장된 extended-stable 선택은 `update.checkOnStart`가 활성화되어 있으면 읽기 전용 시작 및 24시간 업데이트
힌트를 받습니다. 이러한 검사는 업데이트를 적용하거나,
인계 작업을 시작하거나, Gateway를 다시 시작하거나, stable 지연/지터를 사용하거나, beta
폴링 주기를 사용하지 않습니다. 명시적인 포그라운드 업데이트, 저장된
`update.channel: "extended-stable"`을 사용하는 옵션 없는 포그라운드 업데이트, 온디맨드 상태 확인 및 관리형
Gateway 인계는 계속 지원됩니다.

로컬 관리형 Gateway 서비스가 설치되어 있고 재시작이 활성화된 경우,
패키지 관리자 및 Git 체크아웃 업데이트는 패키지 트리를 교체하거나
체크아웃/빌드 출력을 변경하기 전에 실행 중인 서비스를 중지합니다. 그런 다음 업데이터는
서비스 메타데이터를 새로 고치고, 서비스를 다시 시작하며,
재시작된 Gateway를 검증한 후 `Gateway: restarted and verified.`를 보고합니다.
패키지 관리자 업데이트는 재시작된 Gateway가 예상 패키지 버전을 보고하는지도
추가로 검증하며, Git 체크아웃 업데이트는 재빌드 후 Gateway 상태와
서비스 준비 상태를 검증합니다.

macOS에서는 업데이트 후 검사에서 활성 프로필에 대해 LaunchAgent가
로드되어 실행 중인지, 구성된 루프백 포트가 정상인지도 검증합니다.
plist가 설치되어 있지만 launchd가 이를 감독하지 않는 경우 OpenClaw는
LaunchAgent를 자동으로 다시 부트스트랩하고 상태/버전/
채널 준비 상태 검사를 다시 실행합니다(새 부트스트랩은 `RunAtLoad` 작업을 직접 로드하므로,
복구 과정에서 새로 생성된 Gateway에 즉시 `kickstart -k`를 실행하지 않습니다). 이후에도
Gateway가 정상 상태가 되지 않으면 명령은 0이 아닌 값으로 종료되고
재시작 로그 경로와 재시작, 재설치 및 패키지 롤백
지침을 출력합니다.

재시작을 실행할 수 없으면 명령은 `Gateway: restart skipped (...)` 또는
`Gateway: restart failed: ...`와 함께 수동 `openclaw gateway restart` 힌트를 출력합니다.
`--no-restart`를 사용해도 패키지 교체 또는 Git 재빌드는 실행되지만,
관리형 서비스는 중지되거나 다시 시작되지 않으므로 실행 중인 Gateway는
사용자가 수동으로 다시 시작할 때까지 이전 코드를 계속 사용합니다.

### 제어 플레인 응답 형식

패키지 관리자 설치 또는 감독되는 Git 체크아웃에서 `update.run`이 Gateway
제어 플레인을 통해 실행되면, 핸들러는 Gateway 종료 후에도 계속되는 CLI 업데이트와
인계 시작을 별도로 보고합니다.

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"`, 그리고
  `handoff.status: "started"`: Gateway가 관리형 서비스 인계를 생성하고
  자체 재시작을 예약하여 분리된 헬퍼가 실행 중인 서비스 프로세스 외부에서
  `openclaw update --yes --json`을 실행할 수 있게 했습니다.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"`, 그리고
  `handoff.status: "unavailable"`: OpenClaw가 안전한 인계에 필요한 감독
  서비스 경계 및 영구 서비스 식별자를 찾지 못했습니다(예:
  systemd 인계에는 단순한 주변 systemd 프로세스 마커가 아니라
  `OPENCLAW_SYSTEMD_UNIT` 유닛 식별자가 필요합니다). 응답에는
  Gateway 외부에서 실행할 셸 명령인 `handoff.command`가 포함됩니다.
- `ok: false`, `result.reason: "managed-service-handoff-failed"`: Gateway가
  인계를 생성하려 했지만 분리된 헬퍼를 생성하지 못했습니다.

`sentinel` 페이로드는 Gateway가 종료되기 전에 기록되며, CLI
인계는 관리형 서비스 재시작 상태 검사가 완료된 후 동일한 재시작 sentinel을
업데이트합니다. 인계 중에는 sentinel이 성공 후속 작업 없이
`stats.reason: "restart-health-pending"`를 포함할 수 있습니다. 재시작된
Gateway는 이를 폴링하며, CLI가 서비스 상태를 검증하고 최종 `ok` 결과로
sentinel을 다시 기록한 후에만 후속 작업을 실행합니다.
`openclaw status` 및 `openclaw status --all`은 해당 sentinel이 보류 중이거나 실패한 동안
`Update restart` 행을 표시하며, `update.status`는 최신 sentinel을 새로 고쳐
반환합니다.

## Git 체크아웃 흐름

### 채널 선택

- `stable`: 최신 비-beta 태그를 체크아웃한 후 빌드하고 doctor를 실행합니다.
- `beta`: 최신 `-beta` 태그를 우선 사용하며, beta가 없거나 더 오래된 경우
  최신 stable 태그로 대체합니다.
- `dev`: `main`을 체크아웃한 후 가져오기 및 리베이스를 수행합니다.
- `extended-stable`: Git 체크아웃에서는 지원되지 않으며 체크아웃 변경이
  발생하지 않습니다.

### 업데이트 단계

<Steps>
  <Step title="깨끗한 작업 트리 확인">
    커밋되지 않은 변경 사항이 없어야 합니다.
  </Step>
  <Step title="채널 전환">
    선택한 채널(태그 또는 브랜치)로 전환합니다.
  </Step>
  <Step title="업스트림 가져오기">
    Dev에서만 실행합니다.
  </Step>
  <Step title="사전 빌드 검사(dev 전용)">
    임시 작업 트리에서 TypeScript 빌드를 실행합니다. 최신 커밋이 실패하면 최대 10개 커밋을 거슬러 올라가 빌드 가능한 최신 커밋을 찾습니다. 이 사전 검사 중 lint도 실행하려면 `OPENCLAW_UPDATE_PREFLIGHT_LINT=1`을 설정하십시오. 사용자 업데이트 호스트는 CI 러너보다 작은 경우가 많으므로 lint는 제한된 직렬 모드로 실행됩니다.
  </Step>
  <Step title="리베이스">
    선택한 커밋 위로 리베이스합니다(dev 전용).
  </Step>
  <Step title="종속성 설치">
    저장소 패키지 관리자를 사용합니다. pnpm 체크아웃의 경우 업데이터는 pnpm 워크스페이스 내부에서 `npm run build`를 실행하는 대신 필요할 때 `pnpm`을 부트스트랩합니다(먼저 `corepack`을 사용한 다음 임시 `npm install pnpm@11` 대체 경로를 사용합니다). pnpm 부트스트랩이 계속 실패하면 업데이터는 체크아웃에서 `npm run build`를 시도하지 않고 패키지 관리자별 오류와 함께 일찍 중지됩니다.
  </Step>
  <Step title="Control UI 빌드">
    Gateway와 Control UI를 빌드합니다.
  </Step>
  <Step title="doctor 실행">
    최종 안전 업데이트 검사로 `openclaw doctor`를 실행합니다.
  </Step>
  <Step title="Plugin 동기화">
    Plugin을 활성 채널에 동기화합니다. Dev는 번들 Plugin을 사용하고 stable과 beta는 npm을 사용합니다. 추적 중인 Plugin 설치를 업데이트합니다.
  </Step>
</Steps>

### Plugin 동기화 세부 정보

beta 채널에서는 기본/최신 라인을 따르는 추적된 npm 및 ClawHub Plugin 설치가
먼저 Plugin `@beta` 릴리스를 시도합니다. Plugin에 beta 릴리스가 없으면
OpenClaw는 기록된 기본/최신 사양으로 대체하고 경고를 보고합니다.
npm Plugin의 경우 beta 패키지가 존재하지만 설치 검증에 실패할 때도
OpenClaw가 대체 경로를 사용합니다. 이러한 대체 경고로 인해 핵심 업데이트가
실패하지는 않습니다. 정확한 버전과 명시적 태그는 절대 다시 작성되지 않습니다.

<Warning>
정확하게 고정된 npm Plugin 업데이트가 저장된 설치 레코드와 무결성이 다른 아티팩트로 확인되면, `openclaw update`는 해당 아티팩트를 설치하지 않고 Plugin 아티팩트 업데이트를 중단합니다. 새 아티팩트를 신뢰할 수 있음을 확인한 후에만 Plugin을 명시적으로 다시 설치하거나 업데이트하십시오.
</Warning>

<Note>
관리형 Plugin으로 범위가 한정되고 동기화 경로가 우회할 수 있는 업데이트 후 Plugin 동기화 실패(예: 필수적이지 않은 Plugin의 npm 레지스트리에 연결할 수 없는 경우)는 핵심 업데이트가 성공한 후 경고로 보고됩니다. JSON 결과는 최상위 업데이트 `status: "ok"`를 유지하고 `openclaw update repair` 및 `openclaw plugins inspect <id> --runtime --json` 지침과 함께 `postUpdate.plugins.status: "warning"`을 보고합니다. 예기치 않은 업데이터 또는 동기화 예외는 여전히 업데이트 결과를 실패로 처리합니다. Plugin 설치 또는 업데이트 오류를 수정한 다음 `openclaw update repair`를 다시 실행하십시오.

Plugin별 동기화 단계 후 `openclaw update`는 Gateway가 재시작되기 전에 필수 **핵심 업데이트 후 수렴** 단계를 실행합니다. 이 단계는 누락된 구성 Plugin 페이로드를 복구하고, 디스크에서 각 _활성_ 추적 설치 레코드를 검증하며, 해당 `package.json`이 구문 분석 가능한지 정적으로 확인합니다(명시적으로 선언된 `main`이 있으면 그 존재 여부도 확인합니다). 이 단계의 실패와 유효하지 않은 구성 스냅샷은 `postUpdate.plugins.status: "error"`를 반환하고 최상위 업데이트 `status`를 `"error"`로 변경합니다. 따라서 `openclaw update`는 0이 아닌 값으로 종료되며, 검증되지 않은 Plugin 집합으로 Gateway를 다시 시작하지 않습니다. 오류에는 `openclaw update repair` 및 `openclaw plugins inspect <id> --runtime --json`을 가리키는 구조화된 `postUpdate.plugins.warnings[].guidance` 줄이 포함됩니다. 비활성화된 Plugin 항목 및 신뢰할 수 있는 소스에 연결된 공식 동기화 대상이 아닌 레코드는 여기에서 건너뜁니다(누락된 페이로드 검사에서 사용하는 `skipDisabledPlugins` 정책과 동일함). 따라서 오래된 비활성화 Plugin 레코드는 그 외에는 유효한 업데이트를 차단할 수 없습니다.

업데이트된 Gateway가 시작될 때 Plugin 로딩은 검증만 수행합니다. 시작 시 패키지 관리자를 실행하거나 종속성 트리를 변경하지 않습니다. 패키지 관리자 `update.run` 재시작은 CLI 관리형 서비스 경로로 인계되므로 패키지 교체는 이전 Gateway 프로세스 외부에서 이루어지고, 서비스 상태 검사를 통해 업데이트 완료 여부를 보고할 수 있는지 결정합니다.
</Note>

extended-stable 핵심 업데이트가 성공한 후, 핵심 업데이트 후 Plugin 무결성 및
수렴은 설치된 정확한 핵심 버전의 적격 공식 npm Plugin을 대상으로 합니다.
기본/`latest` 의도의 경우 OpenClaw는 Plugin `@extended-stable`을 조회하거나
npm `latest`로 대체하지 않고 설치된 핵심에서 패키지 버전을 파생합니다.
명시적 버전 고정, 명시적 비-`latest` 태그, 서드 파티 패키지 및 npm이 아닌
소스는 기존 의도를 유지합니다.

패키지 관리자 설치의 경우 `openclaw update`는 패키지 관리자를 호출하기 전에
대상 패키지 버전을 확인합니다. npm 전역 설치는 단계적 설치를 사용합니다.
OpenClaw는 새 패키지를 임시 npm 접두사에 설치하고, 그곳에서 패키징된 `dist`
인벤토리를 검증한 다음, 깨끗한 패키지 트리를 실제 전역 접두사로 교체합니다.
검증에 실패하면 의심스러운 트리에서 업데이트 후 doctor, Plugin 동기화 및
재시작 작업을 실행하지 않습니다. 설치된 버전이 이미 대상과 일치하는 경우에도
명령은 전역 패키지 설치를 새로 고친 다음 Plugin 동기화, 핵심 명령 완성 데이터
새로 고침 및 재시작 작업을 실행합니다. 이를 통해 패키징된 사이드카와 채널 소유
Plugin 레코드를 설치된 OpenClaw 빌드에 맞게 유지하는 한편, 전체 Plugin 명령
완성 데이터 재빌드는 명시적인 `openclaw completion --write-state` 실행에서만
수행합니다.

## 관련 항목

- `openclaw doctor`(Git 체크아웃에서 먼저 업데이트 실행을 제안함)
- [개발 채널](/ko/install/development-channels)
- [업데이트](/ko/install/updating)
- [CLI 참조](/ko/cli)
