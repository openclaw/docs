---
read_when:
    - 로컬 OpenClaw 상태를 위한 일급 백업 아카이브가 필요합니다
    - 재설정 또는 제거 전에 포함될 경로를 미리 확인하려는 경우
summary: '`openclaw backup`의 CLI 참조(로컬 백업 아카이브 생성)'
title: 백업
x-i18n:
    generated_at: "2026-04-30T06:21:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c16f953bb32a1613181448f0e4c6ba8777383bce95bddc856dc7e1c3afe8550
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

OpenClaw 상태, 설정, 인증 프로필, 채널/공급자 자격 증명, 세션, 그리고 선택적으로 작업공간에 대한 로컬 백업 아카이브를 만듭니다.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## 참고

- 아카이브에는 확인된 소스 경로와 아카이브 레이아웃이 담긴 `manifest.json` 파일이 포함됩니다.
- 기본 출력은 현재 작업 디렉터리에 생성되는 타임스탬프가 붙은 `.tar.gz` 아카이브입니다.
- 현재 작업 디렉터리가 백업되는 소스 트리 안에 있으면 OpenClaw는 기본 아카이브 위치로 홈 디렉터리를 대신 사용합니다.
- 기존 아카이브 파일은 절대 덮어쓰지 않습니다.
- 자기 포함을 피하기 위해 소스 상태/작업공간 트리 안의 출력 경로는 거부됩니다.
- `openclaw backup verify <archive>`는 아카이브에 루트 매니페스트가 정확히 하나만 있는지 검증하고, 순회 스타일의 아카이브 경로를 거부하며, 매니페스트에 선언된 모든 페이로드가 tarball 안에 있는지 확인합니다.
- `openclaw backup create --verify`는 아카이브를 쓴 직후 해당 검증을 실행합니다.
- `openclaw backup create --only-config`는 활성 JSON 설정 파일만 백업합니다.

## 백업되는 항목

`openclaw backup create`는 로컬 OpenClaw 설치에서 백업 소스를 계획합니다.

- OpenClaw의 로컬 상태 해석기가 반환하는 상태 디렉터리, 일반적으로 `~/.openclaw`
- 활성 설정 파일 경로
- 상태 디렉터리 밖에 있을 때 확인된 `credentials/` 디렉터리
- `--no-include-workspace`를 전달하지 않은 경우 현재 설정에서 발견된 작업공간 디렉터리

모델 인증 프로필은 이미 상태 디렉터리 아래의
`agents/<agentId>/agent/auth-profiles.json`에 포함되어 있으므로, 일반적으로
상태 백업 항목에 포함됩니다.

`--only-config`를 사용하면 OpenClaw는 상태, 자격 증명 디렉터리, 작업공간 발견을 건너뛰고 활성 설정 파일 경로만 아카이브합니다.

OpenClaw는 아카이브를 만들기 전에 경로를 정규화합니다. 설정, 자격 증명
디렉터리 또는 작업공간이 이미 상태 디렉터리 안에 있으면, 별도의 최상위
백업 소스로 중복되지 않습니다. 누락된 경로는 건너뜁니다.

아카이브 페이로드는 해당 소스 트리의 파일 내용을 저장하며, 포함된 `manifest.json`은 확인된 절대 소스 경로와 각 자산에 사용된 아카이브 레이아웃을 기록합니다.

상태 디렉터리의 `extensions/` 트리 아래에 설치된 Plugin 소스와 매니페스트
파일은 포함되지만, 중첩된 `node_modules/` 의존성 트리는 건너뜁니다. 이러한
의존성은 다시 빌드할 수 있는 설치 아티팩트입니다. 아카이브를 복원한 뒤
복원된 Plugin이 누락된 의존성을 보고하면 `openclaw plugins update <id>`를
사용하거나 `openclaw plugins install <spec> --force`로 Plugin을 다시 설치하세요.

## 잘못된 설정 동작

`openclaw backup`은 복구 중에도 도움을 줄 수 있도록 일반 설정 사전 검사를 의도적으로 우회합니다. 작업공간 발견은 유효한 설정에 의존하므로, 이제 `openclaw backup create`는 설정 파일이 존재하지만 잘못되었고 작업공간 백업이 여전히 활성화되어 있으면 빠르게 실패합니다.

그 상황에서도 부분 백업을 원한다면 다음을 다시 실행하세요.

```bash
openclaw backup create --no-include-workspace
```

그러면 작업공간 발견을 완전히 건너뛰면서 상태, 설정, 외부 자격 증명
디렉터리를 범위에 유지합니다.

설정 파일 자체의 복사본만 필요하다면, `--only-config`도 작업공간 발견을 위해 설정 파싱에 의존하지 않으므로 설정 형식이 잘못된 경우에도 작동합니다.

## 크기 및 성능

OpenClaw는 내장된 최대 백업 크기나 파일별 크기 제한을 강제하지 않습니다.

실질적인 제한은 로컬 머신과 대상 파일시스템에서 비롯됩니다.

- 임시 아카이브 쓰기와 최종 아카이브를 위한 사용 가능한 공간
- 큰 작업공간 트리를 순회하고 `.tar.gz`로 압축하는 데 걸리는 시간
- `openclaw backup create --verify`를 사용하거나 `openclaw backup verify`를 실행할 때 아카이브를 다시 스캔하는 데 걸리는 시간
- 대상 경로의 파일시스템 동작. OpenClaw는 덮어쓰기 없는 하드 링크 게시 단계를 선호하며, 하드 링크가 지원되지 않으면 배타적 복사로 대체합니다

큰 작업공간은 보통 아카이브 크기를 좌우하는 주요 요인입니다. 더 작거나 더 빠른 백업을 원한다면 `--no-include-workspace`를 사용하세요.

가장 작은 아카이브에는 `--only-config`를 사용하세요.

## 관련 항목

- [CLI 참조](/ko/cli)
