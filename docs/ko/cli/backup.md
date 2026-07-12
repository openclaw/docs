---
read_when:
    - 로컬 OpenClaw 상태를 위한 완전한 기능의 백업 아카이브가 필요합니다
    - 재설정하거나 제거하기 전에 어떤 경로가 포함되는지 미리 확인하려고 합니다
summary: '`openclaw backup`의 CLI 참조(로컬 백업 아카이브 생성)'
title: 백업
x-i18n:
    generated_at: "2026-07-12T15:02:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b40206e74b43edd6c1d2b00de3cbe9fcfa053bfbb2ffdff0323fb8c1671c28ea
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

OpenClaw 상태, 구성, 인증 프로필, 채널/제공자 자격 증명, 세션 및 선택적으로 워크스페이스를 위한 로컬 백업 아카이브를 생성합니다.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
```

## 참고 사항

- 아카이브에는 확인된 소스 경로와 아카이브 레이아웃이 포함된 `manifest.json`이 내장됩니다.
- 기본 출력은 현재 작업 디렉터리에 생성되는 타임스탬프가 포함된 `.tar.gz` 아카이브입니다. 타임스탬프가 포함된 파일 이름은 머신의 로컬 시간대를 사용하며 UTC 오프셋을 포함합니다. 현재 작업 디렉터리가 백업되는 소스 트리 내부에 있으면 OpenClaw는 기본 아카이브 위치로 홈 디렉터리를 대신 사용합니다.
- 기존 아카이브 파일은 절대 덮어쓰지 않습니다. 자기 자신이 포함되는 것을 방지하기 위해 소스 상태/워크스페이스 트리 내부의 출력 경로는 거부됩니다.
- `openclaw backup verify <archive>`는 아카이브에 루트 매니페스트가 정확히 하나만 포함되어 있는지 확인하고, 디렉터리 순회 형태의 아카이브 경로와 SQLite 사이드카를 거부하며, 매니페스트에 선언된 모든 페이로드가 존재하는지 확인하고, 모든 SQLite 스냅샷의 파일 형태를 검증하며, 표준 OpenClaw 데이터베이스에 대해 전체 무결성 및 역할 검사를 실행합니다. 전용 Plugin 스키마에는 소유자가 정의한 SQLite 기능이 필요할 수 있으므로 불투명한 상태로 유지됩니다. `openclaw backup create --verify`는 아카이브를 작성한 직후 해당 검증을 실행합니다.
- `openclaw backup create --only-config`는 활성 JSON 구성 파일만 백업합니다.

## 백업되는 항목

`openclaw backup create`는 로컬 OpenClaw 설치에서 소스를 계획합니다.

- 상태 디렉터리(일반적으로 `~/.openclaw`)
- 활성 구성 파일 경로
- 상태 디렉터리 외부에 존재하는 경우 확인된 `credentials/` 디렉터리
- `--no-include-workspace`를 전달하지 않는 한 현재 구성에서 검색된 워크스페이스 디렉터리

인증 프로필과 기타 에이전트별 런타임 상태는 상태 디렉터리 아래의 SQLite(`agents/<agentId>/agent/openclaw-agent.sqlite`)에 있으므로 상태 백업 항목에 자동으로 포함됩니다.

`--only-config`는 상태, 자격 증명 디렉터리 및 워크스페이스 검색을 건너뛰고 활성 구성 파일 경로만 아카이브합니다.

OpenClaw는 아카이브를 만들기 전에 경로를 정규화합니다. 구성, 자격 증명 디렉터리 또는 워크스페이스가 이미 상태 디렉터리 내부에 있으면 별도의 최상위 백업 소스로 중복되지 않습니다. 존재하지 않는 경로는 건너뜁니다.

아카이브를 생성하는 동안 OpenClaw는 복원 가치가 없으며 실시간으로 변경되는 것으로 알려진 파일을 건너뜁니다. 여기에는 활성 에이전트 세션 트랜스크립트, Cron 실행 로그, 순환 로그, 전달 대기열, 상태 디렉터리 아래의 소켓/pid/임시 파일 및 관련 영속 대기열 임시 파일이 포함됩니다. JSON 결과의 `skippedVolatileCount`는 의도적으로 생략된 파일 수를 보고합니다. 상태 디렉터리 아래의 SQLite 데이터베이스는 삭제된 페이지의 잔여물이 아카이브에 들어가지 않도록 `VACUUM INTO`로 압축되며, 실시간 WAL/SHM 파일은 복사되지 않습니다. 사용할 수 없는 소유자 정의 SQLite 기능이 필요한 Plugin 소유 데이터베이스는 원시 페이지 복사로 대체하지 않고 실패 시 닫힙니다. 워크스페이스 백업을 통해 포함된 SQLite 파일은 워크스페이스 파일로 복사되며 압축 보장이 적용되지 않습니다.

상태 디렉터리의 `extensions/` 트리 아래에 설치된 Plugin 소스 및 매니페스트 파일은 포함되지만, 중첩된 `node_modules/` 종속성 트리는 다시 빌드할 수 있는 설치 아티팩트이므로 건너뜁니다. 아카이브를 복원한 후 복원된 Plugin에서 누락된 종속성을 보고하면 `openclaw plugins update <id>`를 사용하거나 `openclaw plugins install <spec> --force`로 다시 설치하십시오.

## 잘못된 구성 동작

`openclaw backup`은 복구 중에도 도움을 줄 수 있도록 일반적인 구성 사전 검사를 우회합니다. 워크스페이스 검색은 유효한 구성에 의존하므로 구성 파일이 존재하지만 유효하지 않고 워크스페이스 백업이 여전히 활성화되어 있으면 `openclaw backup create`는 즉시 실패합니다.

이 상황에서 부분 백업을 수행하려면 `--no-include-workspace`를 사용하여 다시 실행하십시오. 워크스페이스 검색은 완전히 건너뛰면서 상태, 구성 및 외부 자격 증명 디렉터리는 범위에 유지합니다.

`--only-config`는 워크스페이스 검색을 위해 구성을 구문 분석하지 않으므로 구성 형식이 잘못된 경우에도 작동합니다.

## 크기 및 성능

OpenClaw는 기본 제공 최대 백업 크기나 파일별 크기 제한을 적용하지 않습니다. 실질적인 제한은 다음 항목에서 발생합니다.

- 임시 아카이브 작성과 최종 아카이브에 필요한 가용 공간
- 대규모 워크스페이스 트리를 순회하여 `.tar.gz`로 압축하는 데 걸리는 시간
- `--verify` 또는 `openclaw backup verify`로 아카이브를 다시 검사하는 데 걸리는 시간
- 대상 파일 시스템의 동작: OpenClaw는 덮어쓰지 않는 하드 링크 게시 단계를 우선 사용하며, 하드 링크가 지원되지 않으면 배타적 복사로 대체합니다.

대규모 워크스페이스가 일반적으로 아카이브 크기에 가장 큰 영향을 줍니다. 더 작고 빠른 백업에는 `--no-include-workspace`를 사용하고, 가장 작은 아카이브에는 `--only-config`를 사용하십시오.

## 관련 항목

- [CLI 참조](/ko/cli)
