---
read_when:
    - 채널 계정(WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost(Plugin)/Signal/iMessage/Matrix)을 추가/제거하려는 경우
    - 채널 상태를 확인하거나 채널 로그를 실시간으로 확인하려는 경우
summary: '`openclaw channels`의 CLI 참조(accounts, status, login/logout, logs)'
title: 채널
x-i18n:
    generated_at: "2026-05-10T19:27:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: e860f2863e148a46b9beb7f855eb9f30addc1b012f1430bf33c544c5e321821d
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gateway에서 채팅 채널 계정과 해당 런타임 상태를 관리합니다.

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
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list`는 채팅 채널만 표시합니다. 기본적으로 구성된 계정을 표시하며, 계정별로 `installed`, `configured`, `enabled` 상태 태그를 함께 보여 줍니다. 아직 구성된 계정이 없는 번들 채널과 아직 디스크에 없는 설치 가능한 카탈로그 채널도 표시하려면 `--all`을 전달하세요. 인증 제공자(OAuth + API 키)와 모델 제공자 사용량/할당량 스냅샷은 더 이상 여기에 출력되지 않습니다. 제공자 인증 프로필은 `openclaw models auth list`를 사용하고, 사용량은 `openclaw status` 또는 `openclaw models list`를 사용하세요.

## 상태 / 기능 / 확인 / 로그

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>`(`--channel`과 함께만 사용), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe`는 라이브 경로입니다. 연결 가능한 Gateway에서는 계정별
`probeAccount`와 선택적 `auditAccount` 검사를 실행하므로 출력에는 전송
상태와 함께 `works`, `probe failed`, `audit ok`, `audit failed` 같은 프로브 결과가 포함될 수 있습니다.
Gateway에 연결할 수 없으면 `channels status`는 라이브 프로브 출력 대신 구성 전용 요약으로 대체됩니다.

채널 소켓 상태 신호로 `openclaw sessions`, Gateway `sessions.list`, 또는 에이전트
`sessions_list` 도구를 사용하지 마세요. 이러한 표면은 제공자 런타임 상태가 아니라
저장된 대화 행을 보고합니다. Discord 제공자를 다시 시작한 뒤에는, 연결되어 있지만 조용한 계정이 정상일 수 있으며 다음 수신 또는 발신 대화 이벤트가 발생하기 전까지 Discord 세션
행이 나타나지 않을 수 있습니다.

## 계정 추가 / 제거

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help`는 채널별 플래그(토큰, 비공개 키, 앱 토큰, signal-cli 경로 등)를 보여 줍니다.
</Tip>

`channels remove`는 설치/구성된 채널 Plugin에만 작동합니다. 설치 가능한 카탈로그 채널에는 먼저 `channels add`를 사용하세요.
런타임 기반 채널 Plugin의 경우, `channels remove`는 구성을 업데이트하기 전에 실행 중인 Gateway에 선택한 계정을 중지하도록 요청하므로 계정을 비활성화하거나 삭제해도 다시 시작할 때까지 이전 리스너가 활성 상태로 남지 않습니다.

일반적인 비대화형 추가 표면은 다음과 같습니다.

- bot-token 채널: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage 전송 필드: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat 필드: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix 필드: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr 필드: `--private-key`, `--relay-urls`
- Tlon 필드: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- 지원되는 경우 기본 계정 env 기반 인증을 위한 `--use-env`

플래그 기반 추가 명령 중에 채널 Plugin을 설치해야 하는 경우, OpenClaw는 대화형 Plugin 설치 프롬프트를 열지 않고 채널의 기본 설치 소스를 사용합니다.

플래그 없이 `openclaw channels add`를 실행하면 대화형 마법사가 다음을 묻습니다.

- 선택한 채널별 계정 ID
- 해당 계정의 선택적 표시 이름
- `Route these channel accounts to agents now?`

지금 바인딩하도록 확인하면 마법사는 구성된 각 채널 계정을 어떤 에이전트가 소유해야 하는지 묻고, 계정 범위 라우팅 바인딩을 작성합니다.

나중에 `openclaw agents bindings`, `openclaw agents bind`, `openclaw agents unbind`로도 동일한 라우팅 규칙을 관리할 수 있습니다([agents](/ko/cli/agents) 참조).

아직 단일 계정 최상위 설정을 사용하는 채널에 기본값이 아닌 계정을 추가하면, OpenClaw는 새 계정을 쓰기 전에 계정 범위 최상위 값을 채널의 계정 맵으로 승격합니다. 대부분의 채널은 해당 값을 `channels.<channel>.accounts.default`에 배치하지만, 번들 채널은 기존에 일치하는 승격 계정을 대신 보존할 수 있습니다. 현재 예시는 Matrix입니다. 이름이 있는 계정이 이미 하나 있거나 `defaultAccount`가 기존의 이름 있는 계정을 가리키는 경우, 승격은 새 `accounts.default`를 만들지 않고 해당 계정을 보존합니다.

라우팅 동작은 일관되게 유지됩니다.

- 기존 채널 전용 바인딩(`accountId` 없음)은 계속 기본 계정과 일치합니다.
- `channels add`는 비대화형 모드에서 바인딩을 자동 생성하거나 다시 쓰지 않습니다.
- 대화형 설정은 선택적으로 계정 범위 바인딩을 추가할 수 있습니다.

구성이 이미 혼합 상태(이름 있는 계정이 있고 최상위 단일 계정 값도 설정됨)였다면, `openclaw doctor --fix`를 실행하여 계정 범위 값을 해당 채널에 대해 선택된 승격 계정으로 이동하세요. 대부분의 채널은 `accounts.default`로 승격합니다. Matrix는 기존의 이름 있는/기본 대상을 대신 보존할 수 있습니다.

## 로그인 및 로그아웃(대화형)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login`은 `--verbose`를 지원합니다.
- `channels login`과 `logout`은 구성된 지원 로그인 대상이 하나뿐인 경우 채널을 추론할 수 있습니다.
- `channels logout`은 연결 가능한 경우 라이브 Gateway 경로를 선호하므로, 채널 인증 상태를 지우기 전에 활성 리스너를 중지합니다. 로컬 Gateway에 연결할 수 없으면 로컬 인증 정리로 대체됩니다.
- Gateway 호스트의 터미널에서 `channels login`을 실행하세요. 에이전트 `exec`는 이 대화형 로그인 흐름을 차단합니다. 사용 가능한 경우 채팅에서는 `whatsapp_login` 같은 채널 네이티브 에이전트 로그인 도구를 사용해야 합니다.

## 문제 해결

- 광범위한 프로브에는 `openclaw status --deep`를 실행하세요.
- 안내식 수정에는 `openclaw doctor`를 사용하세요.
- `openclaw channels list`는 더 이상 모델 제공자 사용량/할당량 스냅샷을 출력하지 않습니다. 해당 정보에는 `openclaw status`(개요) 또는 `openclaw models list`(제공자별)를 사용하세요.
- Gateway에 연결할 수 없으면 `openclaw channels status`는 구성 전용 요약으로 대체됩니다. 지원되는 채널 자격 증명이 SecretRef를 통해 구성되었지만 현재 명령 경로에서 사용할 수 없는 경우, 해당 계정을 구성되지 않은 것으로 표시하는 대신 저하 메모와 함께 구성된 것으로 보고합니다.

## 기능 프로브

정적 기능 지원과 함께 제공자 기능 힌트(사용 가능한 경우 intents/scopes)를 가져옵니다.

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

참고:

- `--channel`은 선택 사항입니다. 모든 채널(확장 포함)을 나열하려면 생략하세요.
- `--account`는 `--channel`과 함께만 유효합니다.
- `--target`은 `channel:<id>` 또는 원시 숫자 채널 ID를 허용하며 Discord에만 적용됩니다. Discord 음성 채널의 경우 권한 검사는 누락된 `ViewChannel`, `Connect`, `Speak`, `SendMessages`, `ReadMessageHistory`를 플래그로 표시합니다.
- 프로브는 제공자별입니다. Discord intents + 선택적 채널 권한, Slack 봇 + 사용자 scopes, Telegram 봇 플래그 + Webhook, Signal 데몬 버전, Microsoft Teams 앱 토큰 + Graph 역할/scopes(알려진 경우 주석 표시). 프로브가 없는 채널은 `Probe: unavailable`을 보고합니다.

## 이름을 ID로 확인

제공자 디렉터리를 사용하여 채널/사용자 이름을 ID로 확인합니다.

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

참고:

- 대상 유형을 강제하려면 `--kind user|group|auto`를 사용하세요.
- 여러 항목이 같은 이름을 공유하는 경우 확인은 활성 일치를 선호합니다.
- `channels resolve`는 읽기 전용입니다. 선택한 계정이 SecretRef를 통해 구성되었지만 해당 자격 증명을 현재 명령 경로에서 사용할 수 없는 경우, 명령은 전체 실행을 중단하는 대신 메모가 포함된 저하된 미확인 결과를 반환합니다.
- `channels resolve`는 채널 Plugin을 설치하지 않습니다. 설치 가능한 카탈로그 채널의 이름을 확인하기 전에 `channels add --channel <name>`을 사용하세요.

## 관련

- [CLI 참조](/ko/cli)
- [채널 개요](/ko/channels)
