---
read_when:
    - Gateway 서비스 및/또는 로컬 상태를 제거하려는 경우
    - 먼저 시험 실행을 원합니다
summary: '`openclaw uninstall`에 대한 CLI 참조(Gateway 서비스 + 로컬 데이터 제거)'
title: 제거
x-i18n:
    generated_at: "2026-06-27T17:20:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f90fa8cf513e2e8cd422c3b8a880e7fd20fb71131a3ec88260e765daa2ace543
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Gateway 서비스와 로컬 데이터를 제거합니다(CLI는 남음).

옵션:

- `--service`: Gateway 서비스 제거
- `--state`: 상태 및 구성 제거
- `--workspace`: 워크스페이스 디렉터리 제거
- `--app`: macOS 앱 제거
- `--all`: 서비스, 상태, 워크스페이스, 앱 제거
- `--yes`: 확인 프롬프트 건너뛰기
- `--non-interactive`: 프롬프트 비활성화; `--yes` 필요
- `--dry-run`: 파일을 제거하지 않고 수행할 작업 출력

예시:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

참고:

- 상태 또는 워크스페이스를 제거하기 전에 복원 가능한 스냅샷을 원하면 먼저 `openclaw backup create`를 실행하세요.
- `--state`는 `--workspace`도 선택하지 않는 한 구성된 워크스페이스 디렉터리를 보존합니다.
- `--all`은 서비스, 상태, 워크스페이스, 앱을 함께 제거하는 축약 옵션입니다.
- `--non-interactive`에는 `--yes`가 필요합니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [제거](/ko/install/uninstall)
