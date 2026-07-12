---
read_when:
    - 채널 계정(Discord, Google Chat, iMessage, Matrix, Signal, Slack, Telegram, WhatsApp 등)을 추가하거나 제거하려는 경우
    - 채널 상태를 확인하거나 채널 로그를 실시간으로 확인하려는 경우
summary: '`openclaw channels` CLI 참조(계정, 상태, 기능, 확인, 로그, 로그인/로그아웃)'
title: 채널
x-i18n:
    generated_at: "2026-07-12T00:37:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41220535917d645e87dca82bc5c27319eff0035fe14a8cb18f001192b3aad5bd
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gateway에서 채팅 채널 계정과 해당 계정의 런타임 상태를 관리합니다.

관련 문서:

- 채널 가이드: [채널](/ko/channels)
- Gateway 구성: [구성](/ko/gateway/configuration)

## 일반 명령

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list`는 채팅 채널만 표시합니다. 기본적으로 구성된 계정을 표시하며, 계정별로 `installed`, `configured`, `enabled` 상태 태그가 함께 표시됩니다. 머신용 출력에는 `--json`을 사용합니다. 아직 구성된 계정이 없는 번들 채널과 아직 디스크에 설치되지 않은 카탈로그의 설치 가능 채널도 표시하려면 `--all`을 전달합니다. 제공자 인증과 모델 사용량은 다른 곳에서 확인합니다. 제공자 인증 프로필에는 `openclaw models auth list`를, 사용량/할당량에는 `openclaw status` 또는 `openclaw models list`를 사용합니다.

## 상태 / 기능 / 확인 / 로그

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>`(기본값 `10000`), `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>`(`--channel` 필요), `--target <dest>`(`--channel` 필요), `--timeout <ms>`(기본값 `10000`, 최대 `30000`), `--json`
- `channels resolve <entries...>`: `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`(기본값 `auto`), `--json`
- `channels logs`: `--channel <name|all>`(기본값 `all`), `--lines <n>`(기본값 `200`), `--json`

`channels status --probe`는 라이브 경로입니다. 연결 가능한 Gateway에서는 계정별로
`probeAccount`와 선택적 `auditAccount` 검사를 실행하므로, 출력에 전송 계층
상태와 함께 `works`, `probe failed`, `audit ok`, `audit failed` 같은 검사 결과가
포함될 수 있습니다. Gateway에 연결할 수 없으면 `channels status`는 라이브 검사
출력 대신 구성만을 기반으로 한 요약으로 대체합니다.

채널 소켓 상태 신호로 `openclaw sessions`, Gateway `sessions.list` 또는 에이전트
`sessions_list` 도구를 사용하지 마세요. 이러한 기능은 제공자 런타임 상태가 아니라
저장된 대화 행을 보고합니다. Discord 제공자를 다시 시작한 후 연결되어 있지만
활동이 없는 계정은 정상일 수 있으며, 다음 수신 또는 발신 대화 이벤트가 발생할
때까지 Discord 세션 행이 나타나지 않을 수 있습니다.

## 계정 추가 / 제거

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help`는 채널별 플래그(토큰, 비공개 키, 앱 토큰, signal-cli 경로 등)를 표시합니다.
</Tip>

`channels remove`는 설치되거나 구성된 채널 Plugin에만 작동합니다. 설치 가능한 카탈로그 채널에는 먼저 `channels add`를 사용하세요. `--delete`를 지정하지 않으면 계정을 비활성화할지 묻고 해당 구성을 유지합니다. `--delete`는 확인 없이 구성 항목을 제거합니다.
런타임 기반 채널 Plugin의 경우 `channels remove`는 구성을 업데이트하기 전에 실행 중인 Gateway에 선택한 계정을 중지하도록 요청합니다. 따라서 계정을 비활성화하거나 삭제해도 재시작할 때까지 이전 리스너가 활성 상태로 남지 않습니다.

채널 전반에서 공유하는 비대화형 추가 플래그는 `--account <id>`, `--name <name>`, `--token`, `--token-file`, `--bot-token`, `--app-token`, `--secret`, `--secret-file`, `--password`, `--cli-path`, `--url`, `--base-url`, `--http-url`, `--auth-dir`, `--use-env`(환경 변수 기반 인증, 지원되는 경우 기본 계정에만 적용)입니다. 채널별 플래그는 다음과 같습니다.

| 채널        | 플래그                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

플래그 기반 추가 명령 중에 채널 Plugin을 설치해야 하는 경우 OpenClaw는 대화형 Plugin 설치 프롬프트를 열지 않고 해당 채널의 기본 설치 소스를 사용합니다.

플래그 없이 `openclaw channels add`를 실행하면 대화형 마법사에서 다음 항목을 입력하라는 메시지가 표시될 수 있습니다.

- 선택한 채널별 계정 ID
- 해당 계정의 선택적 표시 이름
- `Route these channel accounts to agents now?`

지금 바인딩하는 것을 확인하면 마법사는 구성된 각 채널 계정을 소유할 에이전트를 묻고 계정 범위 라우팅 바인딩을 기록합니다.

나중에 `openclaw agents bindings`, `openclaw agents bind`, `openclaw agents unbind`를 사용하여 동일한 라우팅 규칙을 관리할 수도 있습니다([에이전트](/ko/cli/agents) 참조).

아직 단일 계정 최상위 설정을 사용하는 채널에 기본 계정이 아닌 계정을 추가하면 OpenClaw는 새 계정을 기록하기 전에 해당 최상위 값을 채널의 계정 맵으로 승격합니다. 채널에 명명된 계정이 정확히 하나 있거나 `defaultAccount`가 계정 하나를 가리키면 승격 시 해당 기존 계정을 재사용합니다. 그렇지 않으면 값은 `channels.<channel>.accounts.default`에 저장됩니다.

라우팅 동작은 일관되게 유지됩니다.

- 기존 채널 전용 바인딩(`accountId` 없음)은 계속 기본 계정과 일치합니다.
- `channels add`는 비대화형 모드에서 바인딩을 자동으로 생성하거나 다시 작성하지 않습니다.
- 대화형 설정에서는 선택적으로 계정 범위 바인딩을 추가할 수 있습니다.

구성이 이미 혼합 상태(명명된 계정이 존재하면서 최상위 단일 계정 값도 계속 설정된 상태)라면 `openclaw doctor --fix`를 실행하여 계정 범위 값을 해당 채널에 대해 선택된 승격 계정으로 이동하세요.

## 로그인 및 로그아웃(대화형)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login`은 `--account <id>`와 `--verbose`를 지원하며, `channels logout`은 `--account <id>`를 지원합니다.
- 구성된 채널 중 이 작업을 지원하는 채널이 하나뿐이면 `channels login`과 `logout`이 채널을 추론할 수 있습니다. 여러 개라면 `--channel`을 전달하세요.
- `channels logout`은 연결 가능할 때 라이브 Gateway 경로를 우선 사용하므로, 채널 인증 상태를 지우기 전에 로그아웃으로 활성 리스너가 중지됩니다. 로컬 Gateway에 연결할 수 없으면 로컬 인증 정리로 대체합니다. `gateway.mode: "remote"`에서는 대신 Gateway 오류로 명령이 실패합니다.
- 로그인에 성공하면 CLI는 연결 가능한 로컬 Gateway에 계정을 시작하도록 요청합니다. 원격 모드에서는 인증을 로컬에 저장하고 원격 런타임이 다시 시작되지 않았음을 알립니다.
- Gateway 호스트의 터미널에서 `channels login`을 실행하세요. 에이전트 `exec`는 이 대화형 로그인 흐름을 차단합니다. 사용할 수 있다면 채팅에서는 `whatsapp_login` 같은 채널 네이티브 에이전트 로그인 도구를 사용해야 합니다.

## 문제 해결

- 광범위한 검사를 실행하려면 `openclaw status --deep`을 실행하세요.
- 안내에 따른 수정에는 `openclaw doctor`를 사용하세요.
- Gateway에 연결할 수 없으면 `openclaw channels status`는 구성만을 기반으로 한 요약으로 대체합니다. 지원되는 채널 자격 증명이 SecretRef를 통해 구성되었지만 현재 명령 경로에서 사용할 수 없는 경우, 해당 계정을 구성되지 않은 것으로 표시하는 대신 성능 저하 관련 참고 사항과 함께 구성된 계정으로 보고합니다.

## 기능 검사

제공자 기능 힌트(사용 가능한 경우 인텐트/범위)와 정적 기능 지원 정보를 가져옵니다.

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

참고:

- `--channel`은 선택 사항입니다. 생략하면 Plugin에서 제공하는 채널을 포함한 모든 채널을 나열합니다.
- `--account`는 `--channel`과 함께 사용할 때만 유효합니다.
- `--target`은 `channel:<id>` 또는 원시 숫자 채널 ID를 허용하며 Discord에만 적용됩니다. Discord 음성 채널의 경우 권한 검사에서 누락된 `ViewChannel`, `Connect`, `Speak`, `SendMessages`, `ReadMessageHistory`를 표시합니다.
- 검사는 제공자별로 다릅니다. Discord 봇 ID 및 인텐트와 선택적 채널 권한, Slack 봇 및 사용자 범위, Telegram 봇 플래그 및 Webhook, Signal 데몬 버전, Microsoft Teams 앱 토큰 및 Graph 역할/범위(알려진 경우 주석 표시)를 확인합니다. 검사 기능이 없는 채널은 `Probe: unavailable`을 보고합니다.

## 이름을 ID로 확인

제공자 디렉터리를 사용하여 채널/사용자 이름을 ID로 확인합니다.

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

참고:

- 대상 유형을 강제하려면 `--kind user|group|auto`를 사용하세요.
- 여러 항목이 같은 이름을 공유하면 확인 과정에서 활성 항목을 우선합니다.
- `channels resolve`는 읽기 전용입니다. 선택한 계정이 SecretRef를 통해 구성되었지만 해당 자격 증명을 현재 명령 경로에서 사용할 수 없는 경우, 전체 실행을 중단하는 대신 참고 사항이 포함된 성능 저하 상태의 미확인 결과를 반환합니다.
- `channels resolve`는 채널 Plugin을 설치하지 않습니다. 설치 가능한 카탈로그 채널의 이름을 확인하기 전에 `channels add --channel <name>`을 사용하세요.

## 관련 문서

- [CLI 참조](/ko/cli)
- [채널 개요](/ko/channels)
