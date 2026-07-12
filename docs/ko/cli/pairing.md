---
read_when:
    - 페어링 모드 DM을 사용 중이며 발신자를 승인해야 합니다
summary: '`openclaw pairing`용 CLI 참조(페어링 요청 승인/목록 조회)'
title: 페어링
x-i18n:
    generated_at: "2026-07-12T00:38:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca83ad9d9e55cfffd49301cb529b28df370c2dcff03484880f7cfc85ec2d6440
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

페어링을 지원하는 채널의 DM 페어링 요청을 승인하거나 확인합니다(채팅 DM만 해당하며, Node/기기 페어링에는 `openclaw devices`를 사용합니다).

관련 문서: [페어링 흐름](/ko/channels/pairing)

## 명령어

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

| 옵션                    | 설명                              |
| ----------------------- | --------------------------------- |
| `[channel]`             | 위치 인수로 지정하는 채널 ID      |
| `--channel <channel>`   | 명시적으로 지정하는 채널 ID       |
| `--account <accountId>` | 다중 계정 채널의 계정 ID          |
| `--json`                | 기계가 읽을 수 있는 형식으로 출력 |

페어링을 지원하는 채널이 여러 개 구성되어 있으면 채널을 위치 인수 또는 `--channel`로 전달합니다. 채널 ID가 유효하면 확장 채널에서도 사용할 수 있습니다.

## `pairing approve`

대기 중인 페어링 코드를 승인하고 해당 발신자를 허용합니다.

사용법:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- 페어링을 지원하는 채널이 정확히 하나 구성된 경우 `openclaw pairing approve <code>`

옵션: `--channel <channel>`, `--account <accountId>`, `--notify`(동일한 채널에서 요청자에게 확인 메시지를 보냅니다).

### 소유자 초기 설정

페어링 코드를 승인할 때 `commands.ownerAllowFrom`이 비어 있으면 OpenClaw는 승인된 발신자를 명령 소유자로도 기록하며, `telegram:123456789`와 같은 채널 범위 항목을 사용합니다. 이 동작은 첫 번째 소유자만 초기 설정합니다. 이후의 페어링 승인은 `commands.ownerAllowFrom`을 대체하거나 확장하지 않습니다.

명령 소유자는 소유자 전용 명령을 실행하고 `/diagnostics`, `/export-trajectory`, `/config`, 실행 승인과 같은 위험한 작업을 승인할 수 있는 인간 운영자 계정입니다. 페어링은 발신자가 에이전트와 대화할 수 있게 할 뿐이며, 이 일회성 초기 설정 외에는 그 자체로 소유자 권한을 부여하지 않습니다.

이 초기 설정 기능이 도입되기 전에 발신자를 승인했다면 `openclaw doctor`를 실행하세요. 명령 소유자가 구성되지 않은 경우 경고하고, 이를 수정하기 위한 정확한 `openclaw config set commands.ownerAllowFrom ...` 명령을 표시합니다.

## 관련 문서

- [CLI 참조](/ko/cli)
- [채널 페어링](/ko/channels/pairing)
