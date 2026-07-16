---
read_when:
    - 소스 체크아웃을 안전하게 업데이트하려고 합니다
    - '`openclaw update` 출력 또는 옵션을 디버깅하고 있습니다'
    - '`--update` 단축 표기 동작을 이해해야 합니다'
summary: '`openclaw update`용 CLI 참조(비교적 안전한 소스 업데이트 + Gateway 자동 재시작)'
title: 업데이트
x-i18n:
    generated_at: "2026-07-16T12:31:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b46696f6b9cba5c318f870bcb6c5ea8e0652940968da2ad85e86709fe4c11146
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw를 업데이트하고 stable/extended-stable/beta/dev 채널 간에 전환합니다.

**npm/pnpm/bun**을 통해 설치한 경우(git 메타데이터가 없는 전역 설치),
업데이트는 [업데이트](/ko/install/updating)에 설명된 패키지 관리자 흐름을
따릅니다.

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

`openclaw --update`는 `openclaw update`로 다시 작성됩니다(셸 및
런처 스크립트에 유용합니다).

## 옵션

| 플래그                                             | 설명                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | 업데이트에 성공한 후 Gateway 서비스를 다시 시작하지 않습니다. 다시 시작을 수행하는 패키지 관리자 업데이트는 명령이 성공하기 전에 다시 시작된 서비스가 예상 버전을 보고하는지 확인합니다.                                                                                                                                                |
| `--channel <stable\|extended-stable\|beta\|dev>` | 업데이트 채널을 설정하고 코어 업데이트에 성공한 후에도 유지합니다. Extended-stable은 패키지 전용입니다.                                                                                                                                                                                                                                            |
| `--tag <dist-tag\|version\|spec>`                | 이번 업데이트에 한해 패키지 대상을 재정의합니다. 검증된 정확한 대상이 필수인 유효한 `extended-stable` 채널과 함께 사용할 수 없습니다. 다른 패키지 설치에서는 `main`가 `github:openclaw/openclaw#main`에 매핑되며, GitHub/git 소스 사양은 단계별 전역 npm 설치 전에 임시 tarball로 패키징됩니다. |
| `--dry-run`                                      | 설정 작성, 설치, Plugin 동기화 또는 재시작 없이 계획된 작업(채널/태그/대상/재시작 흐름)을 미리 봅니다.                                                                                                                                                                                                                |
| `--json`                                         | 머신 판독 가능한 `UpdateRunResult` JSON을 출력합니다. 관리형 Plugin에 복구가 필요할 때의 `postUpdate.plugins.warnings`, beta 채널 Plugin 대체 세부 정보, 업데이트 후 동기화 중 npm Plugin 아티팩트 드리프트가 감지될 때의 `postUpdate.plugins.integrityDrifts`을 포함합니다.                                                                 |
| `--timeout <seconds>`                            | 단계별 제한 시간입니다. 기본값은 `1800`입니다.                                                                                                                                                                                                                                                                                                            |
| `--yes`                                          | 확인 프롬프트(예: 다운그레이드 확인)를 건너뜁니다.                                                                                                                                                                                                                                                                              |
| `--acknowledge-clawhub-risk`                     | 대화형 프롬프트 없이 업데이트 후 Plugin 동기화가 커뮤니티 ClawHub 신뢰 경고를 무시하고 계속되도록 허용합니다. 이 옵션이 없으면 OpenClaw가 프롬프트를 표시할 수 없을 때 위험한 커뮤니티 릴리스는 건너뛰고 변경하지 않습니다. 공식 ClawHub 패키지와 번들 Plugin 소스에는 이 프롬프트가 적용되지 않습니다.                                                     |

`--verbose` 플래그는 없습니다. 계획된 작업을 미리 보려면 `--dry-run`를,
머신 판독 가능한 결과에는 `--json`을, 채널/가용성만 확인하려면
`openclaw update status --json`을 사용하십시오. Gateway 콘솔 상세도(`--verbose`)와
파일 로그 수준(`logging.level: "debug"`/`"trace"`)은 서로 독립적인 설정입니다.
[Gateway 로깅](/ko/gateway/logging)을 참조하십시오.

<Note>
Nix 모드(`OPENCLAW_NIX_MODE=1`)에서는 상태를 변경하는 `openclaw update` 실행이 비활성화됩니다. 대신 이 설치의 Nix 소스 또는 flake 입력을 업데이트하십시오. nix-openclaw의 경우 에이전트 우선 [빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start)을 사용하십시오. `openclaw update status` 및 `openclaw update --dry-run`은 읽기 전용으로 유지됩니다.
</Note>

<Warning>
이전 버전은 설정을 손상시킬 수 있으므로 다운그레이드하려면 확인이 필요합니다.
설치에서 이미 세션을 SQLite로 마이그레이션했다면 이전 파일 기반 버전을 시작하기
전에 보관된 레거시 트랜스크립트 아티팩트를 복원하십시오.
[Doctor: 세션 SQLite 마이그레이션 후 다운그레이드](/ko/cli/doctor#downgrading-after-session-sqlite-migration)를 참조하십시오.
</Warning>

## `update status`

활성 업데이트 채널, git 태그/브랜치/SHA(소스 체크아웃에만 해당),
업데이트 가용성을 표시합니다.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| 플래그                  | 기본값 | 설명                         |
| --------------------- | ------- | ----------------------------------- |
| `--json`              | `false` | 머신 판독 가능한 상태 JSON을 출력합니다. |
| `--timeout <seconds>` | `3`     | 확인 작업의 제한 시간입니다.                 |

Extended-stable 패키지 설치에서 상태 확인은 포그라운드 업데이트와 동일한 공개 선택기
및 정확한 패키지 검증을 수행합니다. 설치된 버전이 더 최신인 경우
`ahead of extended-stable`을 보고할 수 있습니다. JSON 실패에는
`registry.reason`(`selector_missing`, `selector_query_failed`,
`exact_package_mismatch` 또는 `unsupported_git_channel`)이 포함됩니다.

## `update repair`

코어 패키지는 이미 변경되었지만 이후 복구 작업이 정상적으로 완료되지 않은 경우
업데이트 마무리 작업을 다시 실행합니다. `openclaw update`에서 새 코어 패키지를
설치했지만 코어 이후 Plugin 동기화, 관리형 npm Plugin 메타데이터, 레지스트리 새로 고침
또는 Doctor 복구가 수렴하지 않은 경우 지원되는 복구 경로입니다.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| 플래그                                             | 설명                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | 복구 전에 코어 업데이트 채널을 유지합니다. Extended-stable의 경우 기본/디폴트 또는 `latest` 의도를 따르는 적격 공식 npm Plugin은 정확히 설치된 코어 버전을 대상으로 합니다. Git 체크아웃에서는 설정을 변경하지 않고 Extended-stable 복구가 거부됩니다. |
| `--json`                                         | 머신 판독 가능한 마무리 JSON을 출력합니다.                                                                                                                                                                                                                           |
| `--timeout <seconds>`                            | 복구 단계의 제한 시간입니다. 기본값은 `1800`입니다.                                                                                                                                                                                                                           |
| `--yes`                                          | 확인 프롬프트를 건너뜁니다.                                                                                                                                                                                                                                          |
| `--acknowledge-clawhub-risk`                     | `openclaw update`에서와 동일하게 동작합니다.                                                                                                                                                                                                                              |
| `--no-restart`                                   | 일관성을 위해 허용되지만 복구는 Gateway를 다시 시작하지 않습니다.                                                                                                                                                                                                             |

`update repair`는 `openclaw doctor --fix`를 실행하고, 복구된 설정과
설치 기록을 다시 로드하며, 활성 업데이트 채널에 대해 추적되는 Plugin을 동기화하고,
관리형 npm Plugin 설치를 업데이트하며, 누락된 설정 Plugin 페이로드를 복구하고,
Plugin 레지스트리를 새로 고친 후 수렴된 설치 기록 메타데이터를 작성합니다.
새 코어 패키지를 설치하지 않으며 Gateway를 다시 시작하지 않습니다.

## `update wizard`

업데이트 채널을 선택하고 이후 Gateway를 다시 시작할지 확인하는 대화형
흐름입니다(기본값은 다시 시작). git 체크아웃 없이 `dev`를 선택하면
체크아웃 생성을 제안합니다.

| 플래그                  | 기본값 | 설명                   |
| --------------------- | ------- | ----------------------------- |
| `--timeout <seconds>` | `1800`  | 각 업데이트 단계의 제한 시간입니다. |

## 수행 작업

채널을 명시적으로 전환하면(`--channel ...`) 설치 방식도
일치하도록 유지됩니다.

- `dev` -> git 체크아웃(기본값 `~/openclaw`, 또는
  `OPENCLAW_HOME`이 설정된 경우 `$OPENCLAW_HOME/openclaw`; `OPENCLAW_GIT_DIR`로
  재정의)을 보장하고, 이를 업데이트한 후 해당 체크아웃에서 전역 CLI를
  설치합니다.
- `stable` -> `latest`를 사용하여 npm에서 설치합니다.
- `extended-stable` -> 공개 npm `extended-stable` 선택기를 확인하고,
  선택된 정확한 패키지를 검증한 후 해당 버전을 정확히 설치합니다. 다른 선택기로
  대체하지 않으며 Git 체크아웃에서는 거부됩니다.
- `beta` -> npm dist-tag `beta`을 우선 사용하고, beta가
  없거나 현재 stable 릴리스보다 오래된 경우 `latest`로 대체합니다.

### 재시작 인계

Gateway 코어 자동 업데이터(설정을 통해 활성화된 경우)는 실행 중인 Gateway 요청
핸들러 외부에서 CLI 업데이트 경로를 시작합니다. 제어 영역
`update.run` 패키지 관리자 업데이트와 감독되는 git 체크아웃 업데이트는 실행 중인
Gateway 프로세스 내부에서 패키지 트리를 교체하거나 `dist/`을 다시 빌드하는
대신 동일한 관리형 서비스 인계를 사용합니다. Gateway가 분리된 도우미를 시작하고
종료하면 해당 도우미가 Gateway 프로세스 트리 외부에서 `openclaw update --yes --json`를
실행합니다. 인계를 사용할 수 없으면 `update.run`은 수동으로 실행할 안전한
셸 명령이 포함된 구조화된 응답을 반환합니다.

저장된 확장 안정판 선택 항목은 `update.checkOnStart`이 활성화된 경우 읽기 전용 시작 및 24시간 업데이트
힌트를 받습니다. 이러한 확인은 업데이트를 적용하거나,
핸드오프를 시작하거나, Gateway를 다시 시작하거나, 안정판 지연/지터를 사용하거나, 베타
폴링 주기를 사용하지 않습니다. 명시적인 포그라운드 업데이트, 저장된
`update.channel: "extended-stable"`을 사용하는 인자 없는 포그라운드 업데이트, 요청 시 상태 확인 및 각각의 관리형
Gateway 핸드오프는 계속 지원됩니다.

로컬 관리형 Gateway 서비스가 설치되어 있고 재시작이 활성화된 경우,
패키지 관리자 및 Git 체크아웃 업데이트는 패키지 트리를 교체하거나 체크아웃/빌드 출력을
변경하기 전에 실행 중인 서비스를 중지합니다. 그런 다음 업데이터는
서비스 메타데이터를 새로 고치고, 서비스를 다시 시작하고, 다시 시작된
Gateway를 검증한 후 `Gateway: restarted and verified.`을 보고합니다.
패키지 관리자 업데이트는 다시 시작된 Gateway가 예상 패키지 버전을
보고하는지도 추가로 검증하며, Git 체크아웃 업데이트는 재빌드 후 Gateway 상태와
서비스 준비 상태를 검증합니다.

패키지 관리자 업데이트는 일반적으로 관리형 서비스에 기록된 Node 바이너리를
계속 사용합니다. 해당 Node로 대상 릴리스를 실행할 수 없지만 현재
CLI Node로는 실행할 수 있고 서비스가 업데이트되는 패키지에 속한다는 사실이
입증된 경우, 재시작이 활성화된 업데이트는 마무리 작업에 현재 Node를 사용하고
서비스 메타데이터를 해당 런타임으로 다시 작성합니다. `--no-restart`은 서비스
메타데이터를 복구할 수 없으므로, 동일한 런타임 불일치가 발생하면 패키지를 변경하기
전에 중지됩니다.

macOS에서는 업데이트 후 확인 시 활성 프로필의 LaunchAgent가
로드되어 실행 중인지, 구성된 루프백 포트가 정상인지도 검증합니다.
plist가 설치되어 있지만 launchd가 이를 감독하지 않는 경우 OpenClaw는
LaunchAgent를 자동으로 다시 부트스트랩하고 상태/버전/
채널 준비 상태 확인을 다시 실행합니다(새 부트스트랩은 `RunAtLoad` 작업을 직접 로드하므로,
복구 과정에서 새로 생성된 Gateway를 즉시 `kickstart -k`하지 않습니다). 그래도
Gateway가 정상 상태가 되지 않으면 명령이 0이 아닌 코드로 종료되고
재시작 로그 경로와 재시작, 재설치 및 패키지 롤백
지침을 출력합니다.

재시작을 실행할 수 없는 경우 명령은 수동 `openclaw gateway restart` 힌트와 함께
`Gateway: restart skipped (...)` 또는
`Gateway: restart failed: ...`을 출력합니다.
`--no-restart`을 사용하면 패키지 교체 또는 Git 재빌드는 계속 실행되지만,
관리형 서비스는 중지되거나 다시 시작되지 않으므로 수동으로 다시 시작할 때까지 실행 중인
Gateway는 이전 코드를 계속 사용합니다.

### 제어 영역 응답 형식

패키지 관리자 설치 또는 감독되는 Git 체크아웃에서 `update.run`이 Gateway 제어 영역을 통해
실행되면 핸들러는 Gateway가 종료된 후에도 계속되는 CLI 업데이트와
핸드오프 시작을 별도로 보고합니다.

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"` 및
  `handoff.status: "started"`: Gateway가 관리형 서비스 핸드오프를
  생성하고 자체 재시작을 예약하여 분리된 도우미가 실행 중인 서비스 프로세스
  외부에서 `openclaw update --yes --json`을 실행할 수 있게 했습니다.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` 및
  `handoff.status: "unavailable"`: OpenClaw가 안전한 핸드오프에 필요한 감독
  서비스 경계와 영구적인 서비스 ID를 찾지 못했습니다(예를 들어
  systemd 핸드오프에는 단순한 주변 systemd 프로세스 표시자가 아니라
  `OPENCLAW_SYSTEMD_UNIT` 유닛 ID가 필요합니다). 응답에는
  Gateway 외부에서 실행할 셸 명령인 `handoff.command`이 포함됩니다.
- `ok: false`, `result.reason: "managed-service-handoff-failed"`: Gateway가
  핸드오프 생성을 시도했지만 분리된 도우미를 생성하지 못했습니다.

`sentinel` 페이로드는 Gateway가 종료되기 전에 기록되며, CLI
핸드오프는 관리형 서비스 재시작 상태 확인이 완료된 후 동일한 재시작 센티널을
업데이트합니다. 핸드오프 중에는 센티널에 성공 후속 작업 없이
`stats.reason: "restart-health-pending"`이 포함될 수 있습니다. 다시 시작된
Gateway는 이를 폴링하며, CLI가 서비스 상태를 검증하고 센티널을 최종 `ok` 결과로
다시 작성한 후에만 후속 작업을 실행합니다.
`openclaw status`과 `openclaw status --all`은 해당 센티널이 대기 중이거나 실패한 동안
`Update restart` 행을 표시하며, `update.status`은 새로 고친
최신 센티널을 반환합니다.

## Git 체크아웃 흐름

### 채널 선택

- `stable`: 최신 비베타 태그를 체크아웃한 다음 빌드하고 doctor를 실행합니다.
- `beta`: 최신 `-beta` 태그를 우선 사용하며, 베타가 없거나
  더 오래된 경우 최신 안정판 태그로 대체합니다.
- `dev`: `main`을 체크아웃한 다음 가져와 리베이스합니다.
- `extended-stable`: Git 체크아웃에서는 지원되지 않으며 체크아웃을
  변경하지 않습니다.

### 업데이트 단계

<Steps>
  <Step title="깨끗한 작업 트리 확인">
    커밋되지 않은 변경 사항이 없어야 합니다.
  </Step>
  <Step title="채널 전환">
    선택한 채널(태그 또는 브랜치)로 전환합니다.
  </Step>
  <Step title="업스트림 가져오기">
    개발 채널 전용입니다.
  </Step>
  <Step title="사전 빌드 확인(개발 채널 전용)">
    임시 작업 트리에서 TypeScript 빌드를 실행합니다. 최신 커밋이 실패하면 최대 10개의 커밋을 거슬러 올라가 빌드 가능한 가장 최신 커밋을 찾습니다. 이 사전 확인 중 린트도 실행하려면 `OPENCLAW_UPDATE_PREFLIGHT_LINT=1`을 설정하십시오. 사용자 업데이트 호스트는 대개 CI 러너보다 작으므로 린트는 리소스가 제한된 직렬 모드로 실행됩니다.
  </Step>
  <Step title="리베이스">
    선택한 커밋을 기준으로 리베이스합니다(개발 채널 전용).
  </Step>
  <Step title="의존성 설치">
    저장소의 패키지 관리자를 사용합니다. pnpm 체크아웃의 경우 업데이터는 pnpm 작업 공간 안에서 `npm run build`을 실행하는 대신 필요할 때 `pnpm`을 부트스트랩합니다(먼저 `corepack`을 사용한 다음 임시 `npm install pnpm@11` 대체 경로를 사용합니다). 그래도 pnpm 부트스트랩이 실패하면 업데이터는 체크아웃에서 `npm run build`을 시도하지 않고 패키지 관리자별 오류와 함께 조기에 중지됩니다.
  </Step>
  <Step title="Control UI 빌드">
    Gateway와 Control UI를 빌드합니다.
  </Step>
  <Step title="doctor 실행">
    `openclaw doctor`이 최종 안전 업데이트 확인으로 실행됩니다.
  </Step>
  <Step title="Plugin 동기화">
    Plugin을 활성 채널에 동기화합니다. 개발 채널은 번들 Plugin을 사용하고 안정판과 베타는 npm을 사용합니다. 추적되는 Plugin 설치를 업데이트합니다.
  </Step>
</Steps>

### Plugin 동기화 세부 정보

베타 채널에서는 기본/최신 계열을 따르는 추적 대상 npm 및 ClawHub Plugin 설치가
먼저 Plugin `@beta` 릴리스를 시도합니다. Plugin에
베타 릴리스가 없으면 OpenClaw는 기록된 기본/최신 사양으로 대체하고
경고를 보고합니다. npm Plugin의 경우 베타 패키지가 존재하지만
설치 검증에 실패할 때도 OpenClaw가 대체 경로를 사용합니다. 이러한 대체 경고로 인해
핵심 업데이트가 실패하지는 않습니다. 정확한 버전과 명시적 태그는 절대로 다시 작성되지 않습니다.

<Warning>
정확한 버전으로 고정된 npm Plugin 업데이트가 저장된 설치 기록과 무결성이 다른 아티팩트로 확인되면, `openclaw update`은 해당 Plugin 아티팩트를 설치하지 않고 업데이트를 중단합니다. 새 아티팩트를 신뢰할 수 있는지 검증한 후에만 Plugin을 명시적으로 다시 설치하거나 업데이트하십시오.
</Warning>

<Note>
관리형 Plugin으로 범위가 한정되고 동기화 경로에서 우회할 수 있는 업데이트 후 Plugin 동기화 실패(예: 필수적이지 않은 Plugin의 npm 레지스트리에 연결할 수 없는 경우)는 핵심 업데이트가 성공한 후 경고로 보고됩니다. JSON 결과는 최상위 업데이트 `status: "ok"`을 유지하고 `openclaw update repair` 및 `openclaw plugins inspect <id> --runtime --json` 지침과 함께 `postUpdate.plugins.status: "warning"`을 보고합니다. 예기치 않은 업데이터 또는 동기화 예외가 발생하면 업데이트 결과는 여전히 실패합니다. Plugin 설치 또는 업데이트 오류를 수정한 다음 `openclaw update repair`을 다시 실행하십시오. 실패한 업데이트로 인해 관리형 Plugin을 사용할 수 없게 되면 OpenClaw는 운영자가 작성한 `plugins.allow` 또는 `plugins.deny` 정책을 변경하지 않고 해당 런타임 항목을 비활성화하고 활성 슬롯을 재설정합니다.

Plugin별 동기화 단계 후에는 Gateway가 다시 시작되기 전에 `openclaw update`이 필수 **핵심 업데이트 후 수렴** 단계를 실행합니다. 이 단계에서는 구성되었지만 누락된 Plugin 페이로드를 복구하고, 디스크에 있는 각 _활성_ 추적 설치 기록을 검증하고, 해당 `package.json`을 정적으로 검사하여 구문 분석이 가능한지 확인하며 명시적으로 선언된 `main`이 있으면 그 존재 여부도 확인합니다. 이 단계의 실패와 유효하지 않은 구성 스냅샷은 `postUpdate.plugins.status: "error"`을 반환하고 최상위 업데이트 `status`을 `"error"`로 변경하므로, `openclaw update`은 0이 아닌 코드로 종료되고 검증되지 않은 Plugin 집합으로 Gateway가 다시 시작되지 않습니다. 오류에는 `openclaw update repair` 및 `openclaw plugins inspect <id> --runtime --json`을 가리키는 구조화된 `postUpdate.plugins.warnings[].guidance` 행이 포함됩니다. 비활성화된 Plugin 항목과 신뢰할 수 있는 소스에 연결된 공식 동기화 대상이 아닌 기록은 여기서 건너뜁니다(누락 페이로드 확인에서 사용하는 `skipDisabledPlugins` 정책을 따름). 따라서 오래된 비활성 Plugin 기록이 그 외에는 유효한 업데이트를 차단할 수 없습니다.

업데이트된 Gateway가 시작될 때 Plugin 로딩은 검증만 수행합니다. 시작 과정에서는 패키지 관리자를 실행하거나 의존성 트리를 변경하지 않습니다. 패키지 관리자 `update.run` 재시작은 CLI 관리형 서비스 경로로 전달되므로 패키지 교체는 이전 Gateway 프로세스 외부에서 이루어지고, 서비스 상태 확인을 통해 업데이트 완료 여부를 보고할 수 있는지 결정합니다.
</Note>

확장 안정판 핵심 업데이트가 성공하면 핵심 업데이트 후 Plugin 무결성 및
수렴 작업은 정확히 설치된 핵심 버전에 해당하는 적격 공식 npm Plugin을 대상으로 합니다.
기본/`latest` 의도의 경우 OpenClaw는 Plugin
`@extended-stable`을 조회하거나 npm `latest`으로 대체하지 않고 설치된 핵심에서
패키지 버전을 도출합니다. 명시적 버전 고정, 명시적 비-`latest` 태그,
서드 파티 패키지 및 npm이 아닌 소스는 기존 의도를 유지합니다.

패키지 관리자 설치의 경우 `openclaw update`은 패키지 관리자를
호출하기 전에 대상 패키지 버전을 확인합니다. npm 전역 설치는 단계적
설치를 사용합니다. OpenClaw는 새 패키지를 임시 npm 접두사에 설치하고,
후보 패키지가 `preinstall` 중에 호스트 Node 버전을 검증하도록 한 다음,
그 위치에서 패키징된 `dist` 인벤토리를 검증합니다. 패키징 완료 가드는
`preinstall`이 성공할 때까지 해당 인벤토리 외부에 유지되므로 수명 주기
스크립트를 건너뛰는 패키지 관리자도 활성화 전에 중지됩니다. npm 12 이상에서
업데이터는 후보 OpenClaw 수명 주기만 승인하며, 전이적
의존성 스크립트는 계속 차단됩니다. 그런 다음 OpenClaw는 검증된 패키지 트리를
실제 전역 접두사로 교체합니다. 검증에 실패하면 업데이트 후 doctor, Plugin
동기화 및 재시작 작업은 의심스러운 트리에서 실행되지 않습니다. 설치된 버전이
이미 대상과 일치하더라도 명령은 전역 패키지 설치를 새로 고친 다음
Plugin 동기화, 핵심 명령 완성 새로 고침 및 재시작 작업을 실행합니다.
이를 통해 패키징된 사이드카와 채널 소유 Plugin 기록이 설치된 OpenClaw 빌드와
정렬된 상태로 유지되며, 전체 Plugin 명령 완성 재빌드는 명시적인
`openclaw completion --write-state` 실행에서만 수행됩니다.

## 관련 항목

- `openclaw doctor` (Git 체크아웃에서 먼저 업데이트를 실행하도록 제안)
- [개발 채널](/ko/install/development-channels)
- [업데이트](/ko/install/updating)
- [CLI 참조](/ko/cli)
