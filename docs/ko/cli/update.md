---
read_when:
    - 소스 체크아웃을 안전하게 업데이트하려고 합니다.
    - '`--update` 단축 동작을 이해해야 합니다.'
summary: '`openclaw update`용 CLI 참조(safe-ish source update + Gateway 자동 재시작)'
title: 업데이트
x-i18n:
    generated_at: "2026-04-23T14:02:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: abcfbd2fb66f560f2c6e9d78d37355510d78946eaeafa17d67fe36bc158ad5cd
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

OpenClaw를 안전하게 업데이트하고 stable/beta/dev 채널 간 전환합니다.

**npm/pnpm/bun**(전역 설치, git 메타데이터 없음)으로 설치한 경우,
업데이트는 [Updating](/ko/install/updating)의 패키지 관리자 흐름을 통해 수행됩니다.

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

- `--no-restart`: 업데이트가 성공한 후 Gateway 서비스 재시작을 건너뜁니다.
- `--channel <stable|beta|dev>`: 업데이트 채널을 설정합니다(git + npm, config에 저장됨).
- `--tag <dist-tag|version|spec>`: 이번 업데이트에만 패키지 대상을 재정의합니다. 패키지 설치에서는 `main`이 `github:openclaw/openclaw#main`에 매핑됩니다.
- `--dry-run`: config 기록, 설치, plugin 동기화, 재시작 없이 계획된 업데이트 작업(채널/태그/대상/재시작 흐름)을 미리 봅니다.
- `--json`: 기계 판독 가능한 `UpdateRunResult` JSON을 출력합니다. 여기에는
  post-update plugin 동기화 중 npm plugin 아티팩트 드리프트가 감지되면
  `postUpdate.plugins.integrityDrifts`도 포함됩니다.
- `--timeout <seconds>`: 단계별 타임아웃(기본값 1200초).
- `--yes`: 확인 프롬프트를 건너뜁니다(예: 다운그레이드 확인).

참고: 이전 버전이 구성을 깨뜨릴 수 있으므로 다운그레이드에는 확인이 필요합니다.

## `update status`

활성 업데이트 채널과 git 태그/브랜치/SHA(소스 체크아웃의 경우), 그리고 업데이트 가능 여부를 표시합니다.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

옵션:

- `--json`: 기계 판독 가능한 상태 JSON을 출력합니다.
- `--timeout <seconds>`: 검사 타임아웃(기본값 3초).

## `update wizard`

대화형 흐름으로 업데이트 채널을 선택하고 업데이트 후 Gateway를
재시작할지 확인합니다(기본값은 재시작). git 체크아웃 없이 `dev`를 선택하면
체크아웃 생성을 제안합니다.

옵션:

- `--timeout <seconds>`: 각 업데이트 단계의 타임아웃(기본값 `1200`)

## 수행 내용

명시적으로 채널을 전환할 때(`--channel ...`), OpenClaw는 설치 방식도 함께 맞춥니다:

- `dev` → git 체크아웃을 보장하고(기본값: `~/openclaw`, `OPENCLAW_GIT_DIR`로 재정의),
  이를 업데이트한 뒤 그 체크아웃에서 전역 CLI를 설치합니다.
- `stable` → `latest`를 사용해 npm에서 설치합니다.
- `beta` → npm dist-tag `beta`를 우선 사용하지만, beta가 없거나 현재 stable 릴리스보다 오래된 경우 `latest`로 폴백합니다.

Gateway 코어 자동 업데이트기(config로 활성화한 경우)는 동일한 업데이트 경로를 재사용합니다.

패키지 관리자 설치의 경우 `openclaw update`는 패키지 관리자를 호출하기 전에
대상 패키지 버전을 확인합니다. 설치된 버전이 대상과 정확히 일치하고
저장해야 할 업데이트 채널 변경도 없으면, 이 명령은 패키지 설치,
plugin 동기화, completion 새로고침, Gateway 재시작 작업 전에
건너뜀으로 종료됩니다.

## Git 체크아웃 흐름

채널:

- `stable`: 최신 non-beta 태그를 체크아웃한 다음 build + doctor를 실행합니다.
- `beta`: 최신 `-beta` 태그를 우선 사용하지만, beta가 없거나 더 오래된 경우 최신 stable 태그로 폴백합니다.
- `dev`: `main`을 체크아웃한 다음 fetch + rebase를 수행합니다.

상위 수준 흐름:

1. 깨끗한 worktree가 필요합니다(커밋되지 않은 변경 없음).
2. 선택한 채널(태그 또는 브랜치)로 전환합니다.
3. upstream을 fetch합니다(dev만).
4. dev만: 임시 worktree에서 preflight lint + TypeScript build를 실행합니다. tip이 실패하면 최신 clean build를 찾기 위해 최대 10개 커밋까지 뒤로 이동합니다.
5. 선택한 커밋 위로 rebase합니다(dev만).
6. 저장소 패키지 관리자로 dependency를 설치합니다. pnpm 체크아웃의 경우 updater는 pnpm workspace 안에서 `npm run build`를 실행하는 대신 필요 시 `pnpm`을 부트스트랩합니다(`corepack` 우선, 그다음 임시 `npm install pnpm@10` 폴백).
7. build + Control UI build를 실행합니다.
8. 최종 “안전한 업데이트” 검사로 `openclaw doctor`를 실행합니다.
9. 활성 채널에 plugin을 동기화하고(dev는 번들된 plugin 사용, stable/beta는 npm 사용), npm 설치 plugin을 업데이트합니다.

정확히 고정된 npm plugin 업데이트가 저장된 설치 기록과 무결성이 다른
아티팩트로 확인되면, `openclaw update`는 해당 plugin 아티팩트 업데이트를
설치하지 않고 중단합니다. 새 아티팩트를 신뢰할 수 있는지 확인한 후에만
plugin을 명시적으로 재설치하거나 업데이트하세요.

pnpm 부트스트랩이 여전히 실패하면 updater는 이제 체크아웃 내부에서 `npm run build`를 시도하는 대신 패키지 관리자별 오류와 함께 조기에 중단합니다.

## `--update` 단축

`openclaw --update`는 `openclaw update`로 다시 작성됩니다(shell 및 launcher script에 유용).

## 함께 보기

- `openclaw doctor`(git 체크아웃에서는 먼저 update 실행을 제안함)
- [Development channels](/ko/install/development-channels)
- [Updating](/ko/install/updating)
- [CLI reference](/ko/cli)
