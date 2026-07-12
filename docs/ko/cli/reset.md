---
read_when:
    - CLI는 설치된 상태로 유지하면서 로컬 상태를 모두 삭제하려고 합니다.
    - 제거될 항목을 미리 확인하려고 합니다
summary: '`openclaw reset`용 CLI 참조(로컬 상태/구성 재설정)'
title: 재설정
x-i18n:
    generated_at: "2026-07-12T15:07:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f18af9c5e187217de4c02f4b55de9a1c94f7246b74056dc660aa172168edcef9
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

로컬 구성/상태를 초기화합니다(CLI는 설치된 상태로 유지됩니다).

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

## 옵션

- `--scope <scope>`: `config`, `config+creds+sessions` 또는 `full`
- `--yes`: 확인 프롬프트를 건너뜁니다
- `--non-interactive`: 프롬프트를 비활성화합니다. `--scope`와 `--yes`가 필요합니다
- `--dry-run`: 파일을 제거하지 않고 수행할 작업을 출력합니다

## 범위

| 범위                    | 제거 대상                                                                                                 | 먼저 Gateway 중지 |
| ----------------------- | --------------------------------------------------------------------------------------------------------- | ----------------- |
| `config`                | 구성 파일만                                                                                               | 아니요            |
| `config+creds+sessions` | 구성 파일, OAuth/자격 증명 디렉터리, 에이전트별 세션 디렉터리                                             | 예                |
| `full`                  | 상태 디렉터리(내부에 중첩된 구성/자격 증명 포함), 작업 공간 디렉터리 및 작업 공간 증명                     | 예                |

`config+creds+sessions` 및 `full`은 상태를 삭제하기 전에 실행 중인 관리형 Gateway 서비스를 중지합니다.

## 참고

- 로컬 상태를 제거하기 전에 복원 가능한 스냅샷을 만들려면 먼저 `openclaw backup create`를 실행하십시오.
- `--scope`를 지정하지 않으면 `openclaw reset`이 제거할 범위를 대화형으로 묻습니다.
- `--non-interactive`는 `--scope`와 `--yes`를 모두 설정한 경우에만 유효합니다.
- `config+creds+sessions` 및 `full`은 완료되면 `Next: openclaw onboard --install-daemon`을 출력합니다.

## 관련 문서

- [CLI 참조](/ko/cli)
