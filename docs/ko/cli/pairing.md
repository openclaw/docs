---
read_when:
    - 페어링 모드 다이렉트 메시지를 사용 중이며 발신자를 승인해야 합니다
summary: '`openclaw pairing`의 CLI 참조(페어링 요청 승인/목록 조회)'
title: 페어링
x-i18n:
    generated_at: "2026-04-30T06:24:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: bffc70a8c08e298f42c8fbc2238fce06993572e72f333e87ad18dea3cf33fab5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

DM 페어링 요청을 승인하거나 검사합니다(페어링을 지원하는 채널용).

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
- `--account <accountId>`: 다중 계정 채널의 계정 ID
- `--json`: 기계 판독 가능 출력

참고:

- 페어링 가능 채널이 여러 개 구성된 경우 위치 인수로든 `--channel`로든 채널을 제공해야 합니다.
- 채널 ID가 유효하기만 하면 확장 채널도 허용됩니다.

## `pairing approve`

대기 중인 페어링 코드를 승인하고 해당 발신자를 허용합니다.

사용법:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- 정확히 하나의 페어링 가능 채널만 구성된 경우 `openclaw pairing approve <code>`

옵션:

- `--channel <channel>`: 명시적 채널 ID
- `--account <accountId>`: 다중 계정 채널의 계정 ID
- `--notify`: 같은 채널에서 요청자에게 확인 메시지를 다시 보냅니다.

소유자 부트스트랩:

- 페어링 코드를 승인할 때 `commands.ownerAllowFrom`이 비어 있으면 OpenClaw는 승인된 발신자도 명령 소유자로 기록하며, `telegram:123456789` 같은 채널 범위 항목을 사용합니다.
- 이는 첫 번째 소유자만 부트스트랩합니다. 이후 페어링 승인은 `commands.ownerAllowFrom`을 대체하거나 확장하지 않습니다.
- 명령 소유자는 `/diagnostics`, `/export-trajectory`, `/config`, exec 승인 같은 소유자 전용 명령을 실행하고 위험한 작업을 승인할 수 있는 사람 운영자 계정입니다.

## 참고

- 채널 입력: 위치 인수(`pairing list telegram`)로 전달하거나 `--channel <channel>`로 전달합니다.
- `pairing list`는 다중 계정 채널에 대해 `--account <accountId>`를 지원합니다.
- `pairing approve`는 `--account <accountId>`와 `--notify`를 지원합니다.
- 페어링 가능 채널이 하나만 구성된 경우 `pairing approve <code>`가 허용됩니다.
- 이 부트스트랩이 생기기 전에 발신자를 승인했다면 `openclaw doctor`를 실행하세요. 명령 소유자가 구성되지 않은 경우 경고하고, 이를 수정하기 위한 `openclaw config set commands.ownerAllowFrom ...` 명령을 보여 줍니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [채널 페어링](/ko/channels/pairing)
