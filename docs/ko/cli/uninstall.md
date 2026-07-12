---
read_when:
    - Gateway 서비스 및/또는 로컬 상태를 제거하려는 경우
    - 먼저 시험 실행을 수행하려는 경우
summary: '`openclaw uninstall`의 CLI 참조(게이트웨이 서비스 + 로컬 데이터 제거)'
title: 제거
x-i18n:
    generated_at: "2026-07-12T00:43:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Gateway 서비스 및/또는 로컬 데이터를 제거합니다. CLI 자체는
제거되지 않으므로 npm/pnpm을 통해 별도로 제거하세요.

## 옵션

| 플래그              | 기본값  | 설명                                                 |
| ------------------- | ------- | ---------------------------------------------------- |
| `--service`         | `false` | Gateway 서비스를 제거합니다.                         |
| `--state`           | `false` | 상태 및 구성을 제거합니다.                           |
| `--workspace`       | `false` | 작업 공간 디렉터리를 제거합니다.                     |
| `--app`             | `false` | macOS 앱을 제거합니다.                               |
| `--all`             | `false` | `--service --state --workspace --app`의 단축 옵션입니다. |
| `--yes`             | `false` | 확인 프롬프트를 건너뜁니다.                           |
| `--non-interactive` | `false` | 프롬프트를 비활성화합니다. `--yes`가 필요합니다.     |
| `--dry-run`         | `false` | 파일을 제거하지 않고 예정된 작업을 출력합니다.       |

범위 플래그를 지정하지 않으면 제거할 구성 요소를 선택하는 대화형 다중 선택
프롬프트가 표시됩니다(기본적으로 서비스, 상태, 작업 공간이 미리 선택됨).

## 예시

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

## 참고

- 상태 또는 작업 공간을 제거하기 전에 복원 가능한 스냅샷을 만들려면 먼저
  `openclaw backup create`를 실행하세요.
- `--state`는 `--workspace`도 함께 선택하지 않는 한 구성된 작업 공간
  디렉터리를 보존합니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [제거](/ko/install/uninstall)
