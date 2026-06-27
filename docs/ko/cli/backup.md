---
read_when:
    - 로컬 OpenClaw 상태를 위한 일급 백업 아카이브가 필요합니다
    - 재설정 또는 제거하기 전에 어떤 경로가 포함될지 미리 확인하려는 경우
summary: '`openclaw backup`에 대한 CLI 참조(로컬 백업 아카이브 생성)'
title: 백업
x-i18n:
    generated_at: "2026-06-27T17:16:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ac7d8e4babd24f1c46ac48dca6c413e12361173df83cfe485dd3945ccd30c3e
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

OpenClaw 상태, 구성, 인증 프로필, 채널/공급자 자격 증명, 세션, 그리고 선택적으로 워크스페이스에 대한 로컬 백업 아카이브를 생성합니다.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
```

## 참고

- 아카이브에는 해석된 소스 경로와 아카이브 레이아웃이 포함된 `manifest.json` 파일이 들어 있습니다.
- 기본 출력은 현재 작업 디렉터리에 생성되는 타임스탬프가 붙은 `.tar.gz` 아카이브입니다.
- 타임스탬프가 붙은 백업 파일 이름은 사용 중인 머신의 로컬 시간대를 사용하며 UTC 오프셋을 포함합니다.
- 현재 작업 디렉터리가 백업되는 소스 트리 안에 있으면 OpenClaw는 기본 아카이브 위치로 홈 디렉터리를 사용합니다.
- 기존 아카이브 파일은 절대 덮어쓰지 않습니다.
- 자기 자신을 포함하지 않도록 소스 상태/워크스페이스 트리 안의 출력 경로는 거부됩니다.
- `openclaw backup verify <archive>`는 아카이브에 루트 매니페스트가 정확히 하나만 있는지 검증하고, 탐색 스타일의 아카이브 경로를 거부하며, 매니페스트에 선언된 모든 페이로드가 tarball 안에 있는지 확인합니다.
- `openclaw backup create --verify`는 아카이브를 쓴 직후 해당 검증을 실행합니다.
- `openclaw backup create --only-config`는 활성 JSON 구성 파일만 백업합니다.

## 백업되는 항목

`openclaw backup create`는 로컬 OpenClaw 설치에서 백업 소스를 계획합니다.

- OpenClaw의 로컬 상태 리졸버가 반환하는 상태 디렉터리, 일반적으로 `~/.openclaw`
- 활성 구성 파일 경로
- 상태 디렉터리 밖에 존재하는 경우 해석된 `credentials/` 디렉터리
- `--no-include-workspace`를 전달하지 않는 한, 현재 구성에서 발견된 워크스페이스 디렉터리

모델 인증 프로필은 이미 상태 디렉터리의
`agents/<agentId>/agent/auth-profiles.json` 아래에 포함되어 있으므로, 일반적으로 상태 백업 항목에 포함됩니다.

`--only-config`를 사용하면 OpenClaw는 상태, 자격 증명 디렉터리, 워크스페이스 탐색을 건너뛰고 활성 구성 파일 경로만 아카이브합니다.

OpenClaw는 아카이브를 만들기 전에 경로를 정규화합니다. 구성, 자격 증명 디렉터리 또는 워크스페이스가 이미 상태 디렉터리 안에 있으면 별도의 최상위 백업 소스로 중복되지 않습니다. 누락된 경로는 건너뜁니다.

아카이브 페이로드는 해당 소스 트리의 파일 내용을 저장하며, 포함된 `manifest.json`은 각 자산에 사용된 아카이브 레이아웃과 해석된 절대 소스 경로를 기록합니다.

아카이브 생성 중 OpenClaw는 복원 가치가 없는 알려진 실시간 변경 파일을 건너뜁니다. 여기에는 활성 에이전트 세션 트랜스크립트, Cron 실행 로그, 롤링 로그, 전달 큐, 상태 디렉터리 아래의 소켓/pid/임시 파일, 관련 지속 큐 임시 파일이 포함됩니다. JSON 결과에는 자동화가 의도적으로 생략된 파일 수를 확인할 수 있도록 `skippedVolatileCount`가 포함됩니다.

상태 디렉터리의 `extensions/` 트리 아래에 설치된 Plugin 소스와 매니페스트 파일은 포함되지만, 그 안에 중첩된 `node_modules/` 의존성 트리는 건너뜁니다. 이러한 의존성은 다시 빌드할 수 있는 설치 산출물입니다. 아카이브를 복원한 뒤 복원된 Plugin이 누락된 의존성을 보고하면 `openclaw plugins update <id>`를 사용하거나 `openclaw plugins install <spec> --force`로 Plugin을 다시 설치하세요.

## 잘못된 구성 동작

`openclaw backup`은 복구 중에도 도움을 줄 수 있도록 일반 구성 사전 검사를 의도적으로 우회합니다. 워크스페이스 탐색은 유효한 구성에 의존하므로, 이제 `openclaw backup create`는 구성 파일이 존재하지만 잘못되었고 워크스페이스 백업이 여전히 활성화되어 있으면 빠르게 실패합니다.

그 상황에서도 부분 백업을 원하면 다음을 다시 실행하세요.

```bash
openclaw backup create --no-include-workspace
```

이렇게 하면 워크스페이스 탐색을 완전히 건너뛰면서 상태, 구성, 외부 자격 증명 디렉터리는 범위에 유지됩니다.

구성 파일 자체의 복사본만 필요하다면, `--only-config`도 워크스페이스 탐색을 위해 구성을 파싱하는 데 의존하지 않으므로 구성 형식이 잘못된 경우에도 작동합니다.

## 크기 및 성능

OpenClaw는 내장된 최대 백업 크기나 파일별 크기 제한을 강제하지 않습니다.

실질적인 제한은 로컬 머신과 대상 파일시스템에서 비롯됩니다.

- 임시 아카이브 쓰기와 최종 아카이브에 필요한 사용 가능 공간
- 큰 워크스페이스 트리를 순회하고 `.tar.gz`로 압축하는 데 걸리는 시간
- `openclaw backup create --verify`를 사용하거나 `openclaw backup verify`를 실행하는 경우 아카이브를 다시 스캔하는 데 걸리는 시간
- 대상 경로의 파일시스템 동작. OpenClaw는 덮어쓰기 없는 하드 링크 게시 단계를 선호하며, 하드 링크가 지원되지 않으면 독점 복사로 대체합니다.

대형 워크스페이스는 일반적으로 아카이브 크기를 좌우하는 주요 요인입니다. 더 작거나 더 빠른 백업을 원하면 `--no-include-workspace`를 사용하세요.

가장 작은 아카이브에는 `--only-config`를 사용하세요.

## 관련 항목

- [CLI 참조](/ko/cli)
