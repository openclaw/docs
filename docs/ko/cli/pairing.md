---
read_when:
    - 페어링 모드 다이렉트 메시지를 사용 중이며 발신자를 승인해야 합니다
summary: '`openclaw pairing`의 CLI 참조(페어링 요청 승인/목록 조회)'
title: 페어링
x-i18n:
    generated_at: "2026-05-06T17:54:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 022018239ab1134b18986be42b8e019f412a1a730a9671f422979909c4a31dc5
    source_path: cli/pairing.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw pairing`

DM 페어링 요청을 승인하거나 확인합니다(페어링을 지원하는 채널용).

관련 항목:

- 페어링 흐름: [페어링](/ko/channels/pairing)

## 명령

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

한 채널의 대기 중인 페어링 요청을 나열합니다.

옵션:

- `[channel]`: 위치 인수 채널 ID
- `--channel <channel>`: 명시적 채널 ID
- `--account <accountId>`: 다중 계정 채널용 계정 ID
- `--json`: 기계가 읽을 수 있는 출력

참고:

- 페어링을 지원하는 채널이 여러 개 구성된 경우, 위치 인수로 또는 `--channel`을 사용해 채널을 제공해야 합니다.
- 채널 ID가 유효하면 확장 채널도 허용됩니다.

## `pairing approve`

대기 중인 페어링 코드를 승인하고 해당 발신자를 허용합니다.

사용법:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- 페어링을 지원하는 채널이 정확히 하나만 구성된 경우 `openclaw pairing approve <code>`

옵션:

- `--channel <channel>`: 명시적 채널 ID
- `--account <accountId>`: 다중 계정 채널용 계정 ID
- `--notify`: 같은 채널에서 요청자에게 확인 메시지 보내기

소유자 부트스트랩:

- 페어링 코드를 승인할 때 `commands.ownerAllowFrom`이 비어 있으면, OpenClaw는 승인된 발신자도 `telegram:123456789` 같은 채널 범위 항목을 사용해 명령 소유자로 기록합니다.
- 이는 첫 번째 소유자만 부트스트랩합니다. 이후의 페어링 승인은 `commands.ownerAllowFrom`을 대체하거나 확장하지 않습니다.
- 명령 소유자는 소유자 전용 명령을 실행하고 `/diagnostics`, `/export-trajectory`, `/config`, 실행 승인 같은 위험한 작업을 승인할 수 있는 인간 운영자 계정입니다.

## 참고

- 채널 입력: 위치 인수로 전달하거나(`pairing list telegram`) `--channel <channel>`을 사용합니다.
- `pairing list`는 다중 계정 채널용 `--account <accountId>`를 지원합니다.
- `pairing approve`는 `--account <accountId>`와 `--notify`를 지원합니다.
- 페어링을 지원하는 채널이 하나만 구성된 경우 `pairing approve <code>`가 허용됩니다.
- 이 부트스트랩이 생기기 전에 발신자를 승인했다면 `openclaw doctor`를 실행하세요. 명령 소유자가 구성되지 않았을 때 경고하고 이를 수정할 `openclaw config set commands.ownerAllowFrom ...` 명령을 표시합니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [채널 페어링](/ko/channels/pairing)
