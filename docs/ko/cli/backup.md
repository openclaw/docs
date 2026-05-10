---
read_when:
    - 로컬 OpenClaw 상태를 위한 일급 백업 아카이브가 필요합니다
    - 재설정 또는 제거 전에 어떤 경로가 포함될지 미리 확인하려는 경우
summary: '`openclaw backup`의 CLI 참조(로컬 백업 아카이브 생성)'
title: 백업
x-i18n:
    generated_at: "2026-05-10T19:27:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c95cf475a563ad4f0a2dbaeda504b265580545c9d3f6f71d2f4d2a183e76a5c
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

OpenClaw 상태, 구성, 인증 프로필, 채널/프로바이더 자격 증명, 세션, 그리고 선택적으로 워크스페이스에 대한 로컬 백업 아카이브를 생성합니다.

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

- 아카이브에는 해석된 소스 경로와 아카이브 레이아웃이 포함된 `manifest.json` 파일이 들어 있습니다.
- 기본 출력은 현재 작업 디렉터리에 생성되는 타임스탬프가 붙은 `.tar.gz` 아카이브입니다.
- 현재 작업 디렉터리가 백업되는 소스 트리 내부에 있으면, OpenClaw는 기본 아카이브 위치로 홈 디렉터리를 사용합니다.
- 기존 아카이브 파일은 절대 덮어쓰지 않습니다.
- 자기 자신이 포함되는 것을 피하기 위해 소스 상태/워크스페이스 트리 내부의 출력 경로는 거부됩니다.
- `openclaw backup verify <archive>`는 아카이브에 루트 매니페스트가 정확히 하나만 포함되어 있는지 검증하고, 탐색 스타일의 아카이브 경로를 거부하며, 매니페스트에 선언된 모든 페이로드가 tarball 안에 존재하는지 확인합니다.
- `openclaw backup create --verify`는 아카이브를 작성한 직후 해당 검증을 실행합니다.
- `openclaw backup create --only-config`는 활성 JSON 구성 파일만 백업합니다.

## 백업되는 항목

`openclaw backup create`는 로컬 OpenClaw 설치에서 백업 소스를 계획합니다.

- OpenClaw의 로컬 상태 해석기가 반환하는 상태 디렉터리, 일반적으로 `~/.openclaw`
- 활성 구성 파일 경로
- 상태 디렉터리 외부에 있을 때 해석된 `credentials/` 디렉터리
- `--no-include-workspace`를 전달하지 않는 한 현재 구성에서 발견된 워크스페이스 디렉터리

모델 인증 프로필은 이미 상태 디렉터리 아래의
`agents/<agentId>/agent/auth-profiles.json`에 포함되어 있으므로, 일반적으로
상태 백업 항목에 의해 포함됩니다.

`--only-config`를 사용하면 OpenClaw는 상태, 자격 증명 디렉터리, 워크스페이스 검색을 건너뛰고 활성 구성 파일 경로만 아카이브합니다.

OpenClaw는 아카이브를 빌드하기 전에 경로를 정규화합니다. 구성, 자격 증명
디렉터리, 또는 워크스페이스가 이미 상태 디렉터리 안에 있으면, 별도의
최상위 백업 소스로 중복되지 않습니다. 누락된 경로는 건너뜁니다.

아카이브 페이로드는 해당 소스 트리의 파일 내용을 저장하며, 내장된 `manifest.json`은 해석된 절대 소스 경로와 각 자산에 사용된 아카이브 레이아웃을 기록합니다.

아카이브 생성 중 OpenClaw는 복원 가치가 없는 것으로 알려진 라이브 변경 파일을 건너뜁니다. 여기에는 활성 에이전트 세션 트랜스크립트, cron 실행 로그, 롤링 로그, 전달 큐, 상태 디렉터리 아래의 소켓/pid/임시 파일, 관련 durable-queue 임시 파일이 포함됩니다. JSON 결과에는 자동화에서 의도적으로 생략된 파일 수를 확인할 수 있도록 `skippedVolatileCount`가 포함됩니다.

상태 디렉터리의 `extensions/` 트리 아래에 설치된 Plugin 소스와 매니페스트 파일은 포함되지만, 그 안에 중첩된 `node_modules/` 의존성
트리는 건너뜁니다. 이러한 의존성은 다시 빌드할 수 있는 설치 아티팩트입니다. 아카이브를 복원한 뒤, 복원된 Plugin에서 의존성이 누락되었다고 보고하면
`openclaw plugins update <id>`를 사용하거나
`openclaw plugins install <spec> --force`로 Plugin을 다시 설치하세요.

## 잘못된 구성 동작

`openclaw backup`은 복구 중에도 계속 도움이 될 수 있도록 일반 구성 사전 점검을 의도적으로 우회합니다. 워크스페이스 검색은 유효한 구성에 의존하기 때문에, 이제 `openclaw backup create`는 구성 파일이 존재하지만 잘못되어 있고 워크스페이스 백업이 여전히 활성화되어 있으면 빠르게 실패합니다.

그 상황에서도 부분 백업을 원하면 다음을 다시 실행하세요.

```bash
openclaw backup create --no-include-workspace
```

그러면 상태, 구성, 외부 자격 증명 디렉터리는 범위에 유지하면서
워크스페이스 검색은 완전히 건너뜁니다.

구성 파일 자체의 사본만 필요하다면, `--only-config`도 구성 형식이 잘못된 경우에 작동합니다. 워크스페이스 검색을 위해 구성을 파싱하지 않기 때문입니다.

## 크기와 성능

OpenClaw는 내장 최대 백업 크기나 파일별 크기 제한을 강제하지 않습니다.

실질적인 제한은 로컬 머신과 대상 파일 시스템에서 비롯됩니다.

- 임시 아카이브 작성과 최종 아카이브를 위한 사용 가능한 공간
- 큰 워크스페이스 트리를 순회하고 `.tar.gz`로 압축하는 데 걸리는 시간
- `openclaw backup create --verify`를 사용하거나 `openclaw backup verify`를 실행할 때 아카이브를 다시 스캔하는 데 걸리는 시간
- 대상 경로의 파일 시스템 동작. OpenClaw는 덮어쓰지 않는 하드 링크 게시 단계를 선호하며, 하드 링크가 지원되지 않으면 배타적 복사로 대체합니다

큰 워크스페이스는 일반적으로 아카이브 크기를 좌우하는 주요 요인입니다. 더 작거나 빠른 백업을 원하면 `--no-include-workspace`를 사용하세요.

가장 작은 아카이브를 만들려면 `--only-config`를 사용하세요.

## 관련 항목

- [CLI 참조](/ko/cli)
