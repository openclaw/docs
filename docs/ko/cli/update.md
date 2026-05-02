---
read_when:
    - 소스 체크아웃을 안전하게 업데이트하려는 경우
    - '`--update` 축약 동작을 이해해야 합니다'
summary: '`openclaw update`용 CLI 참조(비교적 안전한 소스 업데이트 + Gateway 자동 재시작)'
title: 업데이트
x-i18n:
    generated_at: "2026-05-02T20:47:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35df8c6d8b1adb9597377f6e2b4844352577992c12636a88b3f3c1854dc0666b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw을 안전하게 업데이트하고 stable/beta/dev 채널 간에 전환합니다.

**npm/pnpm/bun**으로 설치한 경우(전역 설치, git 메타데이터 없음),
업데이트는 [업데이트](/ko/install/updating)의 패키지 관리자 흐름을 통해 수행됩니다.

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

- `--no-restart`: 업데이트가 성공한 뒤 Gateway 서비스를 다시 시작하지 않습니다. Gateway를 다시 시작하는 패키지 관리자 업데이트는 명령이 성공하기 전에 다시 시작된 서비스가 예상 업데이트 버전을 보고하는지 확인합니다.
- `--channel <stable|beta|dev>`: 업데이트 채널을 설정합니다(git + npm; 설정에 유지됨).
- `--tag <dist-tag|version|spec>`: 이번 업데이트에만 사용할 패키지 대상을 재정의합니다. 패키지 설치의 경우 `main`은 `github:openclaw/openclaw#main`에 매핑됩니다.
- `--dry-run`: 설정 작성, 설치, Plugin 동기화 또는 다시 시작 없이 계획된 업데이트 작업(채널/태그/대상/다시 시작 흐름)을 미리 봅니다.
- `--json`: 업데이트 후 Plugin 동기화 중 npm Plugin 아티팩트 드리프트가
  감지되면 `postUpdate.plugins.integrityDrifts`를 포함하여
  기계가 읽을 수 있는 `UpdateRunResult` JSON을 출력합니다.
- `--timeout <seconds>`: 단계별 시간 제한입니다(기본값은 1800초).
- `--yes`: 확인 프롬프트를 건너뜁니다(예: 다운그레이드 확인).

<Warning>
이전 버전은 설정을 손상시킬 수 있으므로 다운그레이드에는 확인이 필요합니다.
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
- `--timeout <seconds>`: 확인 시간 제한입니다(기본값은 3초).

## `update wizard`

업데이트 채널을 선택하고 업데이트 후 Gateway를 다시 시작할지 확인하는 대화형 흐름입니다
(기본값은 다시 시작). git 체크아웃 없이 `dev`를 선택하면 체크아웃 생성을 제안합니다.

옵션:

- `--timeout <seconds>`: 각 업데이트 단계의 시간 제한입니다(기본값 `1800`)

## 수행하는 작업

명시적으로 채널을 전환하면(`--channel ...`) OpenClaw은 설치 방법도
일치하도록 유지합니다.

- `dev` → git 체크아웃을 보장하고(기본값: `~/openclaw`, `OPENCLAW_GIT_DIR`로 재정의),
  업데이트한 뒤 해당 체크아웃에서 전역 CLI를 설치합니다.
- `stable` → `latest`를 사용하여 npm에서 설치합니다.
- `beta` → npm dist-tag `beta`를 선호하지만, beta가 없거나 현재 stable 릴리스보다
  오래된 경우 `latest`로 대체합니다.

Gateway 코어 자동 업데이트 기능은(설정에서 활성화된 경우) 실시간 Gateway 요청 핸들러
외부에서 CLI 업데이트 경로를 실행합니다. 컨트롤 플레인 `update.run` 패키지 관리자
업데이트는 패키지 교체 후 지연 없는, 쿨다운 없는 업데이트 다시 시작을 강제합니다.
이전 Gateway 프로세스가 새 패키지에서 제거된 파일을 가리키는 인메모리 청크를
아직 보유하고 있을 수 있기 때문입니다.

패키지 관리자 설치의 경우 `openclaw update`는 패키지 관리자를 호출하기 전에 대상 패키지
버전을 해석합니다. npm 전역 설치는 단계적 설치를 사용합니다. OpenClaw은 새 패키지를
임시 npm prefix에 설치하고, 그곳에서 패키지된 `dist` 인벤토리를 확인한 다음,
검증된 깨끗한 패키지 트리를 실제 전역 prefix로 교체합니다. 검증에 실패하면 업데이트 후
doctor, Plugin 동기화 및 다시 시작 작업은 의심스러운 트리에서 실행되지 않습니다.
설치된 버전이 이미 대상과 일치하더라도 명령은 전역 패키지 설치를 새로 고친 다음
Plugin 동기화, 코어 명령 완료 새로 고침 및 다시 시작 작업을 실행합니다. 이렇게 하면
패키지된 보조 구성 요소와 채널 소유 Plugin 레코드가 설치된 OpenClaw 빌드와 일치하게
유지되며, 전체 Plugin 명령 완료 재빌드는 명시적인 `openclaw completion --write-state`
실행에 맡깁니다.

로컬 관리형 Gateway 서비스가 설치되어 있고 다시 시작이 활성화된 경우,
패키지 관리자 업데이트는 패키지 트리를 교체하기 전에 실행 중인 서비스를 중지한 다음,
업데이트된 설치에서 서비스 메타데이터를 새로 고치고, 서비스를 다시 시작하며,
다시 시작된 Gateway가 예상 버전을 보고하는지 확인합니다. `--no-restart`를 사용하면
패키지 교체는 여전히 실행되지만 관리형 서비스는 중지되거나 다시 시작되지 않으므로,
실행 중인 Gateway는 수동으로 다시 시작할 때까지 이전 코드를 계속 사용할 수 있습니다.

## Git 체크아웃 흐름

### 채널 선택

- `stable`: 최신 비베타 태그를 체크아웃한 다음 빌드와 doctor를 실행합니다.
- `beta`: 최신 `-beta` 태그를 선호하지만, beta가 없거나 오래된 경우 최신 stable 태그로 대체합니다.
- `dev`: `main`을 체크아웃한 다음 fetch 및 rebase를 수행합니다.

### 업데이트 단계

<Steps>
  <Step title="깨끗한 작업 트리 확인">
    커밋되지 않은 변경 사항이 없어야 합니다.
  </Step>
  <Step title="채널 전환">
    선택한 채널(태그 또는 브랜치)로 전환합니다.
  </Step>
  <Step title="업스트림 가져오기">
    dev 전용입니다.
  </Step>
  <Step title="사전 빌드(dev 전용)">
    임시 작업 트리에서 lint와 TypeScript 빌드를 실행합니다. tip이 실패하면 최대 10개 커밋까지 거슬러 올라가 가장 최신의 깨끗한 빌드를 찾습니다.
  </Step>
  <Step title="Rebase">
    선택한 커밋 위로 rebase합니다(dev 전용).
  </Step>
  <Step title="종속성 설치">
    저장소 패키지 관리자를 사용합니다. pnpm 체크아웃의 경우 업데이트 프로그램은 pnpm 워크스페이스 안에서 `npm run build`를 실행하는 대신 필요 시 `pnpm`을 부트스트랩합니다(먼저 `corepack`을 사용하고, 그다음 임시 `npm install pnpm@10` 대체 경로를 사용).
  </Step>
  <Step title="Control UI 빌드">
    Gateway와 Control UI를 빌드합니다.
  </Step>
  <Step title="doctor 실행">
    `openclaw doctor`가 마지막 안전 업데이트 확인으로 실행됩니다.
  </Step>
  <Step title="Plugin 동기화">
    Plugin을 활성 채널에 동기화합니다. dev는 번들 Plugin을 사용하고, stable 및 beta는 npm을 사용합니다. 추적 중인 Plugin 설치를 업데이트합니다.
  </Step>
</Steps>

beta 업데이트 채널에서 기본/latest 라인을 따르는 추적된 npm 및 ClawHub Plugin 설치는
먼저 Plugin `@beta` 릴리스를 시도합니다. Plugin에 beta 릴리스가 없으면 OpenClaw은
기록된 기본/latest spec으로 대체합니다. 정확한 버전과 명시적 태그는 다시 작성되지
않습니다.

<Warning>
정확히 고정된 npm Plugin 업데이트가 저장된 설치 레코드와 무결성이 다른 아티팩트로 해석되면, `openclaw update`는 해당 Plugin 아티팩트 업데이트를 설치하는 대신 중단합니다. 새 아티팩트를 신뢰할 수 있음을 확인한 뒤에만 Plugin을 명시적으로 다시 설치하거나 업데이트하세요.
</Warning>

<Note>
업데이트 후 Plugin 동기화 실패는 업데이트 결과를 실패로 만들고 이후 다시 시작 작업을 중지합니다. Plugin 설치 또는 업데이트 오류를 수정한 다음 `openclaw update`를 다시 실행하세요.

업데이트된 Gateway가 시작될 때 Plugin 로딩은 검증 전용입니다. 시작 과정에서 패키지 관리자를 실행하거나 종속성 트리를 변경하지 않습니다. 패키지 관리자 `update.run` 다시 시작은 패키지 트리가 교체된 후 일반적인 유휴 지연 및 다시 시작 쿨다운을 우회하므로, 이전 프로세스가 제거된 청크를 지연 로딩한 채 유지될 수 없습니다.

pnpm 부트스트랩이 여전히 실패하면, 업데이트 프로그램은 체크아웃 안에서 `npm run build`를 시도하는 대신 패키지 관리자별 오류와 함께 조기에 중지합니다.
</Note>

## `--update` 축약형

`openclaw --update`는 `openclaw update`로 다시 작성됩니다(셸 및 실행 스크립트에 유용).

## 관련 항목

- `openclaw doctor`(git 체크아웃에서 먼저 업데이트 실행을 제안)
- [개발 채널](/ko/install/development-channels)
- [업데이트](/ko/install/updating)
- [CLI 참조](/ko/cli)
