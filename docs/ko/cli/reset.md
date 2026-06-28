---
read_when:
    - CLI를 설치한 상태로 유지하면서 로컬 상태를 지우려는 경우
    - 무엇이 제거될지 dry-run으로 확인하려는 경우
summary: '``openclaw reset``에 대한 CLI 참조(로컬 상태/설정 초기화)'
title: 초기화
x-i18n:
    generated_at: "2026-04-24T06:08:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4a4aba32fb44905d079bf2a22e582a3affbe9809eac9af237ce3e48da72b42c
    source_path: cli/reset.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# `openclaw reset`

로컬 설정/상태를 초기화합니다(CLI는 설치된 상태로 유지됨).

옵션:

- `--scope <scope>`: `config`, `config+creds+sessions`, 또는 `full`
- `--yes`: 확인 프롬프트 건너뛰기
- `--non-interactive`: 프롬프트 비활성화, `--scope`와 `--yes` 필요
- `--dry-run`: 파일을 제거하지 않고 수행 작업만 출력

예시:

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

참고:

- 로컬 상태를 제거하기 전에 복원 가능한 스냅샷을 원한다면 먼저 `openclaw backup create`를 실행하세요.
- `--scope`를 생략하면 `openclaw reset`은 무엇을 제거할지 선택하는 대화형 프롬프트를 사용합니다.
- `--non-interactive`는 `--scope`와 `--yes`가 모두 설정된 경우에만 유효합니다.

## 관련 항목

- [CLI reference](/ko/cli)
