---
read_when:
    - 메시지 CLI 액션 추가 또는 수정
    - 발신 채널 동작 변경
summary: '`openclaw message`용 CLI 참조(전송 + 채널 작업)'
title: 메시지
x-i18n:
    generated_at: "2026-04-30T06:23:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43f14b3815d89c92a7503e620e2424f41a3f6b92e20e089504017305b19bace4
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

메시지와 채널 작업을 보내기 위한 단일 아웃바운드 명령
(Discord/Google Chat/iMessage/Matrix/Mattermost(Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## 사용법

```
openclaw message <subcommand> [flags]
```

채널 선택:

- 구성된 채널이 둘 이상이면 `--channel`이 필요합니다.
- 정확히 하나의 채널만 구성되어 있으면 해당 채널이 기본값이 됩니다.
- 값: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`(Mattermost에는 Plugin이 필요함)
- `openclaw message`는 `--channel` 또는 채널 접두사가 붙은 대상이 있으면 선택된 채널을 해당 소유 Plugin으로 해석합니다. 그렇지 않으면 기본 채널 추론을 위해 구성된 채널 Plugin을 로드합니다.

대상 형식(`--target`):

- WhatsApp: E.164 또는 그룹 JID
- Telegram: 채팅 ID 또는 `@username`
- Discord: `channel:<id>` 또는 `user:<id>`(또는 `<@id>` 멘션; 원시 숫자 ID는 채널로 처리됨)
- Google Chat: `spaces/<spaceId>` 또는 `users/<userId>`
- Slack: `channel:<id>` 또는 `user:<id>`(원시 채널 ID도 허용됨)
- Mattermost(Plugin): `channel:<id>`, `user:<id>` 또는 `@username`(접두사 없는 ID는 채널로 처리됨)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` 또는 `username:<name>`/`u:<name>`
- iMessage: 핸들, `chat_id:<id>`, `chat_guid:<guid>` 또는 `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` 또는 `#alias:server`
- Microsoft Teams: 대화 ID(`19:...@thread.tacv2`) 또는 `conversation:<id>` 또는 `user:<aad-object-id>`

이름 조회:

- 지원되는 제공자(Discord/Slack 등)의 경우 `Help` 또는 `#help` 같은 채널 이름은 디렉터리 캐시를 통해 해석됩니다.
- 캐시에 없으면 제공자가 지원하는 경우 OpenClaw가 라이브 디렉터리 조회를 시도합니다.

## 일반 플래그

- `--channel <name>`
- `--account <id>`
- `--target <dest>`(send/poll/read 등의 대상 채널 또는 사용자)
- `--targets <name>`(반복 가능; 브로드캐스트 전용)
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef 동작

- `openclaw message`는 선택된 작업을 실행하기 전에 지원되는 채널 SecretRef를 해석합니다.
- 해석은 가능하면 활성 작업 대상 범위로 제한됩니다.
  - `--channel`이 설정된 경우(또는 `discord:...` 같은 접두사 대상에서 추론된 경우) 채널 범위
  - `--account`가 설정된 경우 계정 범위(채널 전역 + 선택된 계정 표면)
  - `--account`가 생략된 경우 OpenClaw는 `default` 계정 SecretRef 범위를 강제하지 않습니다.
- 관련 없는 채널의 미해결 SecretRef는 대상이 지정된 메시지 작업을 차단하지 않습니다.
- 선택된 채널/계정 SecretRef가 해석되지 않으면 해당 작업에 대해 명령은 닫힌 상태로 실패합니다.

## 작업

### Core

- `send`
  - 채널: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost(Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - 필수: `--target`, 그리고 `--message`, `--media` 또는 `--presentation`
  - 선택 사항: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - 공유 프레젠테이션 페이로드: `--presentation`은 Core가 선택된 채널의 선언된 기능을 통해 렌더링하는 의미론적 블록(`text`, `context`, `divider`, `buttons`, `select`)을 보냅니다. [메시지 프레젠테이션](/ko/plugins/message-presentation)을 참조하세요.
  - 일반 전달 기본 설정: `--delivery`는 `{ "pin": true }` 같은 전달 힌트를 받습니다. `--pin`은 채널이 지원하는 경우 고정 전달의 축약형입니다.
  - Telegram 전용: `--force-document`(Telegram 압축을 피하기 위해 이미지와 GIF를 문서로 전송)
  - Telegram 전용: `--thread-id`(포럼 주제 ID)
  - Slack 전용: `--thread-id`(스레드 타임스탬프; `--reply-to`는 같은 필드를 사용)
  - Telegram + Discord: `--silent`
  - WhatsApp 전용: `--gif-playback`

- `poll`
  - 채널: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - 필수: `--target`, `--poll-question`, `--poll-option`(반복 가능)
  - 선택 사항: `--poll-multi`
  - Discord 전용: `--poll-duration-hours`, `--silent`, `--message`
  - Telegram 전용: `--poll-duration-seconds`(5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - 채널: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - 필수: `--message-id`, `--target`
  - 선택 사항: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - 참고: `--remove`에는 `--emoji`가 필요합니다(지원되는 경우 자신의 반응을 지우려면 `--emoji`를 생략하세요. /tools/reactions 참조).
  - WhatsApp 전용: `--participant`, `--from-me`
  - Signal 그룹 반응: `--target-author` 또는 `--target-author-uuid` 필요

- `reactions`
  - 채널: Discord/Google Chat/Slack/Matrix
  - 필수: `--message-id`, `--target`
  - 선택 사항: `--limit`

- `read`
  - 채널: Discord/Slack/Matrix
  - 필수: `--target`
  - 선택 사항: `--limit`, `--before`, `--after`
  - Discord 전용: `--around`

- `edit`
  - 채널: Discord/Slack/Matrix
  - 필수: `--message-id`, `--message`, `--target`

- `delete`
  - 채널: Discord/Slack/Telegram/Matrix
  - 필수: `--message-id`, `--target`

- `pin` / `unpin`
  - 채널: Discord/Slack/Matrix
  - 필수: `--message-id`, `--target`

- `pins`(목록)
  - 채널: Discord/Slack/Matrix
  - 필수: `--target`

- `permissions`
  - 채널: Discord/Matrix
  - 필수: `--target`
  - Matrix 전용: Matrix 암호화가 활성화되어 있고 검증 작업이 허용될 때 사용 가능

- `search`
  - 채널: Discord
  - 필수: `--guild-id`, `--query`
  - 선택 사항: `--channel-id`, `--channel-ids`(반복 가능), `--author-id`, `--author-ids`(반복 가능), `--limit`

### 스레드

- `thread create`
  - 채널: Discord
  - 필수: `--thread-name`, `--target`(채널 ID)
  - 선택 사항: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - 채널: Discord
  - 필수: `--guild-id`
  - 선택 사항: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - 채널: Discord
  - 필수: `--target`(스레드 ID), `--message`
  - 선택 사항: `--media`, `--reply-to`

### 이모지

- `emoji list`
  - Discord: `--guild-id`
  - Slack: 추가 플래그 없음

- `emoji upload`
  - 채널: Discord
  - 필수: `--guild-id`, `--emoji-name`, `--media`
  - 선택 사항: `--role-ids`(반복 가능)

### 스티커

- `sticker send`
  - 채널: Discord
  - 필수: `--target`, `--sticker-id`(반복 가능)
  - 선택 사항: `--message`

- `sticker upload`
  - 채널: Discord
  - 필수: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### 역할 / 채널 / 멤버 / 음성

- `role info`(Discord): `--guild-id`
- `role add` / `role remove`(Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info`(Discord): `--target`
- `channel list`(Discord): `--guild-id`
- `member info`(Discord/Slack): `--user-id`(Discord의 경우 `--guild-id` 추가)
- `voice status`(Discord): `--guild-id`, `--user-id`

### 이벤트

- `event list`(Discord): `--guild-id`
- `event create`(Discord): `--guild-id`, `--event-name`, `--start-time`
  - 선택 사항: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### 모더레이션(Discord)

- `timeout`: `--guild-id`, `--user-id`(선택 사항 `--duration-min` 또는 `--until`; 타임아웃을 지우려면 둘 다 생략)
- `kick`: `--guild-id`, `--user-id`(+ `--reason`)
- `ban`: `--guild-id`, `--user-id`(+ `--delete-days`, `--reason`)
  - `timeout`은 `--reason`도 지원합니다.

### 브로드캐스트

- `broadcast`
  - 채널: 구성된 모든 채널. 모든 제공자를 대상으로 하려면 `--channel all` 사용
  - 필수: `--targets <target...>`
  - 선택 사항: `--message`, `--media`, `--dry-run`

## 예제

Discord 답장 보내기:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

의미론적 버튼이 있는 메시지 보내기:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

Core는 채널 기능에 따라 동일한 `presentation` 페이로드를 Discord 구성 요소, Slack 블록, Telegram 인라인 버튼, Mattermost props 또는 Teams/Feishu 카드로 렌더링합니다. 전체 계약과 폴백 규칙은 [메시지 프레젠테이션](/ko/plugins/message-presentation)을 참조하세요.

더 풍부한 프레젠테이션 페이로드 보내기:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Discord 투표 만들기:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Telegram 투표 만들기(2분 후 자동 종료):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Teams 사전 메시지 보내기:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Teams 투표 만들기:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Slack에서 반응하기:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Signal 그룹에서 반응하기:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

일반 프레젠테이션을 통해 Telegram 인라인 버튼 보내기:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

일반 프레젠테이션을 통해 Teams 카드 보내기:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

압축을 피하기 위해 Telegram 이미지를 문서로 보내기:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## 관련 문서

- [CLI 참조](/ko/cli)
- [Agent 전송](/ko/tools/agent-send)
