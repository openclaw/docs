---
read_when:
    - 소스 체크아웃을 비교적 안전하게 업데이트하려는 경우
    - '`--update` 축약 동작을 이해해야 하는 경우'
summary: '`openclaw update`용 CLI 참조 (비교적 안전한 소스 업데이트 + Gateway 자동 재시작)'
title: 업데이트
x-i18n:
    generated_at: "2026-04-26T11:26:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: e86e7f8ffbf3f4ccd0787ba06aead35cb96e8db98c5d32c99b18ef9fda62efd6
    source_path: cli/update.md
    workflow: 15
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

- `--no-restart`: 업데이트가 성공한 뒤 Gateway 서비스를 재시작하지 않습니다. Gateway를 재시작하는 패키지 관리자 업데이트의 경우, 명령이 성공하기 전에 재시작된 서비스가 예상된 업데이트 버전을 보고하는지 확인합니다.
- `--channel <stable|beta|dev>`: 업데이트 채널을 설정합니다(git + npm, config에 유지됨).
- `--tag <dist-tag|version|spec>`: 이번 업데이트에만 패키지 대상을 재정의합니다. 패키지 설치의 경우 `main`은 `github:openclaw/openclaw#main`에 매핑됩니다.
- `--dry-run`: config 쓰기, 설치, Plugin 동기화, 재시작 없이 계획된 업데이트 작업(채널/태그/대상/재시작 흐름)을 미리 봅니다.
- `--json`: 기계가 읽을 수 있는 `UpdateRunResult` JSON을 출력하며, 업데이트 후 Plugin 동기화 중 npm Plugin 아티팩트 드리프트가 감지되면 `postUpdate.plugins.integrityDrifts`도 포함합니다.
- `--timeout <seconds>`: 단계별 타임아웃(기본값 1800초).
- `--yes`: 확인 프롬프트를 건너뜁니다(예: 다운그레이드 확인)

참고: 이전 버전은 구성을 망가뜨릴 수 있으므로 다운그레이드에는 확인이 필요합니다.

## `update status`

활성 업데이트 채널 + git 태그/브랜치/SHA(소스 체크아웃용)와 업데이트 가능 여부를 표시합니다.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

옵션:

- `--json`: 기계가 읽을 수 있는 상태 JSON을 출력합니다.
- `--timeout <seconds>`: 확인용 타임아웃(기본값 3초).

## `update wizard`

업데이트 채널을 선택하고 업데이트 후 Gateway를 재시작할지 확인하는 대화형 흐름입니다
(기본값은 재시작). git 체크아웃 없이 `dev`를 선택하면
생성할지 제안합니다.

옵션:

- `--timeout <seconds>`: 각 업데이트 단계의 타임아웃(기본값 `1800`)

## 수행 작업

채널을 명시적으로 전환할 때(`--channel ...`), OpenClaw는 설치 방식도
함께 맞춥니다:

- `dev` → git 체크아웃을 보장하고(기본값: `~/openclaw`, `OPENCLAW_GIT_DIR`로 재정의),
  이를 업데이트한 뒤 해당 체크아웃에서 전역 CLI를 설치합니다.
- `stable` → npm의 `latest`로 설치합니다.
- `beta` → npm dist-tag `beta`를 우선 사용하지만, beta가 없거나 현재 stable 릴리스보다
  오래된 경우 `latest`로 대체합니다.

Gateway 코어 자동 업데이트기(config를 통해 활성화된 경우)는 이와 동일한 업데이트 경로를 재사용합니다.

패키지 관리자 설치의 경우, `openclaw update`는 패키지 관리자를 호출하기 전에
대상 패키지 버전을 확인합니다. 설치된 버전이 이미 대상과 일치하더라도,
이 명령은 전역 패키지 설치를 새로 고친 뒤 Plugin 동기화, completion 새로고침,
재시작 작업을 수행합니다. 이렇게 하면 패키지된 사이드카와 채널 소유 Plugin 기록이
설치된 OpenClaw 빌드와 일치하게 유지됩니다.

## Git 체크아웃 흐름

채널:

- `stable`: 최신 비-beta 태그를 체크아웃한 뒤 빌드 + doctor를 실행합니다.
- `beta`: 최신 `-beta` 태그를 우선 사용하지만, beta가 없거나 더 오래된 경우
  최신 stable 태그로 대체합니다.
- `dev`: `main`을 체크아웃한 뒤 fetch + rebase를 수행합니다.

상위 수준 흐름:

1. 깨끗한 워크트리가 필요합니다(커밋되지 않은 변경 사항 없음).
2. 선택한 채널(태그 또는 브랜치)로 전환합니다.
3. 업스트림을 fetch합니다(dev 전용).
4. dev 전용: 임시 워크트리에서 사전 점검 lint + TypeScript 빌드를 수행하고, tip이 실패하면 최신 정상 빌드를 찾기 위해 최대 10개 커밋까지 거슬러 올라갑니다.
5. 선택한 커밋으로 rebase합니다(dev 전용).
6. 리포지토리 패키지 관리자로 의존성을 설치합니다. pnpm 체크아웃의 경우, 업데이트기는 pnpm 워크스페이스 안에서 `npm run build`를 실행하는 대신 필요 시 `pnpm`을 부트스트랩합니다(`corepack` 우선, 이후 임시 `npm install pnpm@10` 대체 경로).
7. 빌드 + Control UI 빌드를 수행합니다.
8. 최종 “안전한 업데이트” 점검으로 `openclaw doctor`를 실행합니다.
9. 활성 채널에 맞게 Plugin을 동기화하고(dev는 번들 Plugin 사용, stable/beta는 npm 사용), npm으로 설치된 Plugin을 업데이트합니다.

정확히 고정된 npm Plugin 업데이트가 저장된 설치 기록과 무결성이 다른 아티팩트로
해결되면, `openclaw update`는 해당 Plugin 아티팩트 업데이트를 설치하지 않고
중단합니다. 새 아티팩트를 신뢰할 수 있는지 확인한 뒤에만 Plugin을 명시적으로
재설치하거나 업데이트하세요.

업데이트 후 Plugin 동기화 실패는 업데이트 결과를 실패로 처리하고 재시작 후속
작업을 중단합니다. Plugin 설치/업데이트 오류를 수정한 다음
`openclaw update`를 다시 실행하세요.

pnpm 부트스트랩이 여전히 실패하면, 업데이트기는 이제 체크아웃 내부에서 `npm run build`를 시도하는 대신 패키지 관리자별 오류와 함께 조기에 중단합니다.

## `--update` 축약형

`openclaw --update`는 `openclaw update`로 다시 작성됩니다(셸과 런처 스크립트에 유용).

## 관련 문서

- `openclaw doctor` (git 체크아웃에서 먼저 update를 실행할지 제안함)
- [개발 채널](/ko/install/development-channels)
- [업데이트](/ko/install/updating)
- [CLI 참조](/ko/cli)
