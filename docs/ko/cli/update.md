---
read_when:
    - 소스 체크아웃을 안전하게 업데이트하려는 경우
    - '`openclaw update` 출력 또는 옵션을 디버깅하는 경우'
    - '`--update` 축약 동작을 이해해야 합니다'
summary: '`openclaw update`의 CLI 참조(비교적 안전한 소스 업데이트 + Gateway 자동 재시작)'
title: 업데이트
x-i18n:
    generated_at: "2026-05-12T08:45:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93244af800aaa53c55a52f9593a7727910aa91acac9d1e34e89c39a95b133461
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw를 안전하게 업데이트하고 stable/beta/dev 채널 간에 전환합니다.

**npm/pnpm/bun**으로 설치한 경우(전역 설치, git 메타데이터 없음),
업데이트는 [업데이트](/ko/install/updating)의 패키지 관리자 흐름을 통해 진행됩니다.

## 사용법

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## 옵션

- `--no-restart`: 업데이트가 성공한 뒤 Gateway 서비스를 다시 시작하지 않습니다. Gateway를 다시 시작하는 패키지 관리자 업데이트는 명령이 성공하기 전에 다시 시작된 서비스가 예상된 업데이트 버전을 보고하는지 확인합니다.
- `--channel <stable|beta|dev>`: 업데이트 채널을 설정합니다(git + npm; 설정에 유지됨).
- `--tag <dist-tag|version|spec>`: 이 업데이트에 한해서만 패키지 대상을 재정의합니다. 패키지 설치의 경우 `main`은 `github:openclaw/openclaw#main`에 매핑됩니다.
- `--dry-run`: 설정 쓰기, 설치, Plugin 동기화 또는 재시작 없이 계획된 업데이트 작업(채널/태그/대상/재시작 흐름)을 미리 봅니다.
- `--json`: 손상되었거나 로드할 수 없는 관리형 Plugin이 코어 업데이트 성공 후 복구가 필요할 때의 `postUpdate.plugins.warnings`, Plugin에 beta 릴리스가 없을 때의 beta 채널 Plugin 폴백 세부 정보, 업데이트 후 Plugin 동기화 중 npm Plugin 아티팩트 드리프트가 감지될 때의 `postUpdate.plugins.integrityDrifts`를 포함한, 기계가 읽을 수 있는 `UpdateRunResult` JSON을 출력합니다.
- `--timeout <seconds>`: 단계별 제한 시간입니다(기본값은 1800초).
- `--yes`: 확인 프롬프트를 건너뜁니다(예: 다운그레이드 확인).

`openclaw update`에는 `--verbose` 플래그가 없습니다. 계획된 채널/태그/설치/재시작 작업을 미리 보려면 `--dry-run`을, 기계가 읽을 수 있는 결과에는 `--json`을, 채널과 사용 가능 여부 세부 정보만 필요할 때는 `openclaw update status --json`을 사용하세요. 업데이트 전후의 Gateway 로그를 디버깅하는 경우, 콘솔 상세도와 파일 로그 수준은 별개입니다. Gateway `--verbose`는 터미널/WebSocket 출력에 영향을 주며, 파일 로그에는 설정의 `logging.level: "debug"` 또는 `"trace"`가 필요합니다. [Gateway 로깅](/ko/gateway/logging)을 참고하세요.

<Note>
Nix 모드(`OPENCLAW_NIX_MODE=1`)에서는 변경을 수행하는 `openclaw update` 실행이 비활성화됩니다. 대신 이 설치의 Nix 소스나 flake 입력을 업데이트하세요. nix-openclaw의 경우 에이전트 우선 [빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start)을 사용하세요. `openclaw update status`와 `openclaw update --dry-run`은 읽기 전용으로 유지됩니다.
</Note>

<Warning>
이전 버전은 설정을 깨뜨릴 수 있으므로 다운그레이드에는 확인이 필요합니다.
</Warning>

## `update status`

활성 업데이트 채널 + git 태그/브랜치/SHA(소스 체크아웃의 경우)와 업데이트 사용 가능 여부를 표시합니다.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

옵션:

- `--json`: 기계가 읽을 수 있는 상태 JSON을 출력합니다.
- `--timeout <seconds>`: 검사 제한 시간입니다(기본값은 3초).

## `update wizard`

업데이트 채널을 선택하고 업데이트 후 Gateway를 다시 시작할지 확인하는 대화형 흐름입니다(기본값은 재시작). git 체크아웃 없이 `dev`를 선택하면 체크아웃 생성을 제안합니다.

옵션:

- `--timeout <seconds>`: 각 업데이트 단계의 제한 시간입니다(기본값 `1800`)

## 동작 방식

명시적으로 채널을 전환하면(`--channel ...`) OpenClaw는 설치 방식도 맞춰 유지합니다.

- `dev` → git 체크아웃을 보장하고(기본값: `~/openclaw`, `OPENCLAW_GIT_DIR`로 재정의), 이를 업데이트한 뒤 해당 체크아웃에서 전역 CLI를 설치합니다.
- `stable` → `latest`를 사용해 npm에서 설치합니다.
- `beta` → npm dist-tag `beta`를 선호하지만, beta가 없거나 현재 stable 릴리스보다 오래된 경우 `latest`로 폴백합니다.

Gateway 코어 자동 업데이트 기능은(설정으로 활성화된 경우) 라이브 Gateway 요청 핸들러 밖에서 CLI 업데이트 경로를 실행합니다. 제어 평면 `update.run` 패키지 관리자 업데이트는 패키지 교체 후 지연 없는, 쿨다운 없는 업데이트 재시작을 강제합니다. 이전 Gateway 프로세스가 새 패키지에서 제거된 파일을 가리키는 메모리 내 청크를 아직 가지고 있을 수 있기 때문입니다.

패키지 관리자 설치의 경우, `openclaw update`는 패키지 관리자를 호출하기 전에 대상 패키지 버전을 해석합니다. npm 전역 설치는 단계적 설치를 사용합니다. OpenClaw는 새 패키지를 임시 npm prefix에 설치하고, 그곳에서 패키징된 `dist` 인벤토리를 검증한 다음, 해당 깨끗한 패키지 트리를 실제 전역 prefix로 교체합니다. 검증이 실패하면 업데이트 후 doctor, Plugin 동기화, 재시작 작업은 의심스러운 트리에서 실행되지 않습니다. 설치된 버전이 이미 대상과 일치하더라도 명령은 전역 패키지 설치를 새로고침한 뒤 Plugin 동기화, 코어 명령 완성 새로고침, 재시작 작업을 실행합니다. 이렇게 하면 패키징된 사이드카와 채널 소유 Plugin 레코드가 설치된 OpenClaw 빌드와 정렬되며, 전체 Plugin 명령 완성 재빌드는 명시적인 `openclaw completion --write-state` 실행에 맡깁니다.

로컬 관리형 Gateway 서비스가 설치되어 있고 재시작이 활성화된 경우, 패키지 관리자 업데이트는 패키지 트리를 교체하기 전에 실행 중인 서비스를 중지한 다음, 업데이트된 설치에서 서비스 메타데이터를 새로고침하고, 서비스를 다시 시작하며, 다시 시작된 Gateway가 성공을 보고하기 전에 예상 버전을 보고하는지 확인합니다. macOS에서는 업데이트 후 검사에서 활성 프로필의 LaunchAgent가 로드/실행 중인지, 그리고 구성된 loopback 포트가 정상인지도 확인합니다. plist가 설치되어 있지만 launchd가 이를 감독하지 않는 경우, OpenClaw는 LaunchAgent를 자동으로 다시 부트스트랩한 다음 상태/버전/채널 준비 상태 검사를 다시 실행합니다. 새 부트스트랩은 RunAtLoad 작업을 직접 로드하므로, 업데이트 복구는 새로 생성된 Gateway에 즉시 `kickstart -k`를 실행하지 않습니다. Gateway가 여전히 정상 상태가 되지 않으면 명령은 0이 아닌 값으로 종료하고 재시작 로그 경로와 명시적인 재시작, 재설치, 패키지 롤백 지침을 출력합니다. `--no-restart`를 사용하면 패키지 교체는 계속 실행되지만 관리형 서비스는 중지되거나 다시 시작되지 않으므로, 실행 중인 Gateway는 수동으로 다시 시작할 때까지 이전 코드를 계속 사용할 수 있습니다.

## Git 체크아웃 흐름

### 채널 선택

- `stable`: 최신 non-beta 태그를 체크아웃한 다음 빌드하고 doctor를 실행합니다.
- `beta`: 최신 `-beta` 태그를 선호하지만, beta가 없거나 더 오래된 경우 최신 stable 태그로 폴백합니다.
- `dev`: `main`을 체크아웃한 다음 fetch하고 rebase합니다.

### 업데이트 단계

<Steps>
  <Step title="깨끗한 작업 트리 확인">
    커밋되지 않은 변경 사항이 없어야 합니다.
  </Step>
  <Step title="채널 전환">
    선택한 채널(태그 또는 브랜치)로 전환합니다.
  </Step>
  <Step title="업스트림 가져오기">
    Dev 전용입니다.
  </Step>
  <Step title="사전 빌드 검사(dev 전용)">
    임시 작업 트리에서 TypeScript 빌드를 실행합니다. tip이 실패하면 최대 10개 커밋까지 거슬러 올라가 빌드 가능한 최신 커밋을 찾습니다. 이 사전 검사 중 lint도 실행하려면 `OPENCLAW_UPDATE_PREFLIGHT_LINT=1`을 설정하세요. 사용자 업데이트 호스트는 CI 러너보다 작은 경우가 많으므로 lint는 제한된 직렬 모드로 실행됩니다.
  </Step>
  <Step title="Rebase">
    선택한 커밋 위로 rebase합니다(dev 전용).
  </Step>
  <Step title="의존성 설치">
    저장소 패키지 관리자를 사용합니다. pnpm 체크아웃의 경우, 업데이트 프로그램은 pnpm 워크스페이스 안에서 `npm run build`를 실행하는 대신 필요할 때 `pnpm`을 부트스트랩합니다(`corepack`을 먼저 사용한 다음 임시 `npm install pnpm@11` 폴백 사용).
  </Step>
  <Step title="Control UI 빌드">
    Gateway와 Control UI를 빌드합니다.
  </Step>
  <Step title="doctor 실행">
    최종 안전 업데이트 검사로 `openclaw doctor`를 실행합니다.
  </Step>
  <Step title="Plugin 동기화">
    Plugin을 활성 채널에 동기화합니다. Dev는 번들 Plugin을 사용하고, stable과 beta는 npm을 사용합니다. 추적되는 Plugin 설치를 업데이트합니다.
  </Step>
</Steps>

beta 업데이트 채널에서는 기본/latest 라인을 따르는 추적된 npm 및 ClawHub Plugin 설치가 먼저 Plugin `@beta` 릴리스를 시도합니다. Plugin에 beta 릴리스가 없으면 OpenClaw는 기록된 기본/latest spec으로 폴백하고 이를 경고로 보고합니다. npm Plugin의 경우 beta 패키지가 존재하지만 설치 검증에 실패할 때도 OpenClaw가 폴백합니다. 이러한 Plugin 폴백 경고는 코어 업데이트를 실패하게 하지 않습니다. 정확한 버전과 명시적 태그는 다시 작성되지 않습니다.

<Warning>
정확히 고정된 npm Plugin 업데이트가 저장된 설치 레코드와 무결성이 다른 아티팩트로 해석되면, `openclaw update`는 이를 설치하는 대신 해당 Plugin 아티팩트 업데이트를 중단합니다. 새 아티팩트를 신뢰할 수 있다고 확인한 뒤에만 Plugin을 명시적으로 다시 설치하거나 업데이트하세요.
</Warning>

<Note>
관리형 Plugin에 한정되고 동기화 경로가 우회할 수 있는 업데이트 후 Plugin 동기화 실패(예: 필수적이지 않은 Plugin의 npm 레지스트리에 도달할 수 없음)는 코어 업데이트가 성공한 뒤 경고로 보고됩니다. JSON 결과는 최상위 업데이트 `status: "ok"`를 유지하고, `openclaw doctor --fix` 및 `openclaw plugins inspect <id> --runtime --json` 안내와 함께 `postUpdate.plugins.status: "warning"`을 보고합니다. 예상치 못한 업데이트 프로그램 또는 동기화 예외는 여전히 업데이트 결과를 실패로 만듭니다. Plugin 설치 또는 업데이트 오류를 고친 뒤 `openclaw doctor --fix` 또는 `openclaw update`를 다시 실행하세요.

Plugin별 동기화 단계 후, `openclaw update`는 Gateway를 다시 시작하기 전에 필수 **post-core convergence** 패스를 실행합니다. 누락된 구성된 Plugin 페이로드를 복구하고, 디스크의 각 _활성_ 추적 설치 레코드를 검증하며, 해당 `package.json`이 파싱 가능한지(그리고 명시적으로 선언된 `main`이 있다면 존재하는지) 정적으로 확인합니다. 이 패스의 실패와 유효하지 않은 OpenClaw 설정 스냅샷은 `postUpdate.plugins.status: "error"`를 반환하고 최상위 업데이트 `status`를 `"error"`로 바꾸므로, `openclaw update`는 0이 아닌 값으로 종료되며 Gateway는 검증되지 않은 Plugin 집합으로 다시 시작되지 않습니다. 오류에는 후속 조치를 위해 `openclaw doctor --fix` 및 `openclaw plugins inspect <id> --runtime --json`를 가리키는 구조화된 `postUpdate.plugins.warnings[].guidance` 줄이 포함됩니다. 비활성화된 Plugin 항목과 신뢰할 수 있는 소스에 연결된 공식 동기화 대상이 아닌 레코드는 여기서 건너뜁니다. 이는 누락 페이로드 검사에서 사용하는 `skipDisabledPlugins` 정책과 동일하므로, 오래된 비활성화 Plugin 레코드가 그 외에는 유효한 업데이트를 차단할 수 없습니다.

업데이트된 Gateway가 시작되면 Plugin 로딩은 검증 전용입니다. 시작 시 패키지 관리자를 실행하거나 의존성 트리를 변경하지 않습니다. 패키지 관리자 `update.run` 재시작은 패키지 트리가 교체된 후 일반적인 유휴 지연과 재시작 쿨다운을 우회하므로, 이전 프로세스가 제거된 청크를 계속 지연 로드할 수 없습니다.

pnpm 부트스트랩이 여전히 실패하면, 업데이트 프로그램은 체크아웃 안에서 `npm run build`를 시도하는 대신 패키지 관리자별 오류와 함께 일찍 중지합니다.
</Note>

## `--update` 축약형

`openclaw --update`는 `openclaw update`로 다시 작성됩니다(셸과 런처 스크립트에 유용함).

## 관련 항목

- `openclaw doctor` (git 체크아웃에서 먼저 업데이트 실행을 제안함)
- [개발 채널](/ko/install/development-channels)
- [업데이트](/ko/install/updating)
- [CLI 참조](/ko/cli)
