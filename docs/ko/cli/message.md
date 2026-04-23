---
read_when:
    - message CLI 작업을 추가하거나 수정하는 중입니다
    - 아웃바운드 채널 동작을 변경하는 중입니다
summary: '`openclaw message`에 대한 CLI 참조(send + 채널 작업)'
title: message
x-i18n:
    generated_at: "2026-04-23T14:02:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37b6f40b435326aee186dad1e6e060c24f2ef6d44b07fd85d4ce5cfd7f350b91
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

메시지 전송 및 채널 작업을 위한 단일 아웃바운드 명령입니다
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## 사용법

```
openclaw message <subcommand> [flags]
```

채널 선택:

- 두 개 이상의 채널이 구성된 경우 `--channel`이 필요합니다.
- 정확히 하나의 채널만 구성된 경우 해당 채널이 기본값이 됩니다.
- 값: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost는 Plugin 필요)

대상 형식(`--target`):

- WhatsApp: E.164 또는 그룹 JID
- Telegram: 채팅 ID 또는 `@username`
- Discord: `channel:<id>` 또는 `user:<id>` (`<@id>` 멘션도 가능, 원시 숫자 ID는 채널로 처리됨)
- Google Chat: `spaces/<spaceId>` 또는 `users/<userId>`
- Slack: `channel:<id>` 또는 `user:<id>` (원시 채널 ID 허용)
- Mattermost (Plugin): `channel:<id>`, `user:<id>`, 또는 `@username` (bare ID는 채널로 처리됨)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>`, 또는 `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>`, 또는 `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server`, 또는 `#alias:server`
- Microsoft Teams: 대화 ID(`19:...@thread.tacv2`) 또는 `conversation:<id>` 또는 `user:<aad-object-id>`

이름 조회:

- 지원되는 제공자(Discord/Slack 등)의 경우 `Help` 또는 `#help` 같은 채널 이름은 디렉터리 캐시를 통해 확인됩니다.
- 캐시 미스 시, 제공자가 지원하면 OpenClaw가 라이브 디렉터리 조회를 시도합니다.

## 공통 플래그

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (send/poll/read 등에 대한 대상 채널 또는 사용자)
- `--targets <name>` (반복 가능, broadcast 전용)
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef 동작

- `openclaw message`는 선택한 작업을 실행하기 전에 지원되는 채널 SecretRef를 해석합니다.
- 가능하면 해석 범위는 활성 작업 대상에 한정됩니다:
  - `--channel`이 설정된 경우 채널 범위(`discord:...` 같은 접두사 대상에서 유추된 경우 포함)
  - `--account`가 설정된 경우 계정 범위(채널 전역 + 선택한 계정 표면)
  - `--account`를 생략하면 OpenClaw는 `default` 계정 SecretRef 범위를 강제하지 않습니다
- 관련 없는 채널의 해석되지 않은 SecretRef는 대상 지정된 메시지 작업을 막지 않습니다.
- 선택한 채널/계정 SecretRef를 해석할 수 없으면 명령은 해당 작업에 대해 fail-closed합니다.

## 작업

### Core

- `send`
  - 채널: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - 필수: `--target` 및 `--message`, `--media`, 또는 `--presentation`
  - 선택 사항: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - 공통 presentation payload: `--presentation`은 semantic block(`text`, `context`, `divider`, `buttons`, `select`)을 전송하며, core가 선택된 채널의 선언된 capability를 통해 렌더링합니다. [Message Presentation](/ko/plugins/message-presentation)을 참조하세요.
  - 일반 delivery 기본 설정: `--delivery`는 `{ "pin": true }` 같은 delivery 힌트를 받습니다. `--pin`은 채널이 지원할 경우 고정 전송의 shorthand입니다.
  - Telegram 전용: `--force-document` (Telegram 압축을 피하기 위해 이미지와 GIF를 문서로 전송)
  - Telegram 전용: `--thread-id` (포럼 topic ID)
  - Slack 전용: `--thread-id` (스레드 타임스탬프, `--reply-to`는 동일한 필드를 사용)
  - Telegram + Discord: `--silent`
  - WhatsApp 전용: `--gif-playback`

- `poll`
  - 채널: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - 필수: `--target`, `--poll-question`, `--poll-option` (반복)
  - 선택 사항: `--poll-multi`
  - Discord 전용: `--poll-duration-hours`, `--silent`, `--message`
  - Telegram 전용: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - 채널: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - 필수: `--message-id`, `--target`
  - 선택 사항: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - 참고: `--remove`에는 `--emoji`가 필요합니다(`--emoji`를 생략하면 지원되는 경우 자신의 반응을 지웁니다. /tools/reactions 참조)
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

- `pins` (목록)
  - 채널: Discord/Slack/Matrix
  - 필수: `--target`

- `permissions`
  - 채널: Discord/Matrix
  - 필수: `--target`
  - Matrix 전용: Matrix 암호화가 활성화되어 있고 검증 작업이 허용된 경우 사용 가능

- `search`
  - 채널: Discord
  - 필수: `--guild-id`, `--query`
  - 선택 사항: `--channel-id`, `--channel-ids` (반복), `--author-id`, `--author-ids` (반복), `--limit`

### 스레드

- `thread create`
  - 채널: Discord
  - 필수: `--thread-name`, `--target` (채널 ID)
  - 선택 사항: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - 채널: Discord
  - 필수: `--guild-id`
  - 선택 사항: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - 채널: Discord
  - 필수: `--target` (스레드 ID), `--message`
  - 선택 사항: `--media`, `--reply-to`

### 이모지

- `emoji list`
  - Discord: `--guild-id`
  - Slack: 추가 플래그 없음

- `emoji upload`
  - 채널: Discord
  - 필수: `--guild-id`, `--emoji-name`, `--media`
  - 선택 사항: `--role-ids` (반복)

### 스티커

- `sticker send`
  - 채널: Discord
  - 필수: `--target`, `--sticker-id` (반복)
  - 선택 사항: `--message`

- `sticker upload`
  - 채널: Discord
  - 필수: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### 역할 / 채널 / 멤버 / 음성

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ Discord의 경우 `--guild-id`)
- `voice status` (Discord): `--guild-id`, `--user-id`

### 이벤트

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - 선택 사항: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### 중재(Discord)

- `timeout`: `--guild-id`, `--user-id` (선택적으로 `--duration-min` 또는 `--until`, 둘 다 생략하면 timeout 해제)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout`도 `--reason`을 지원합니다

### 브로드캐스트

- `broadcast`
  - 채널: 구성된 모든 채널, 모든 제공자를 대상으로 하려면 `--channel all` 사용
  - 필수: `--targets <target...>`
  - 선택 사항: `--message`, `--media`, `--dry-run`

## 예시

Discord 답글 보내기:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

semantic button이 포함된 메시지 보내기:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

core는 동일한 `presentation` payload를 채널 capability에 따라 Discord 컴포넌트, Slack block, Telegram inline button, Mattermost props, 또는 Teams/Feishu 카드로 렌더링합니다. 전체 계약 및 fallback 규칙은 [Message Presentation](/ko/plugins/message-presentation)을 참조하세요.

더 풍부한 presentation payload 보내기:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Discord poll 생성:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Telegram poll 생성(2분 후 자동 종료):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Teams 선제 메시지 보내기:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Teams poll 생성:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Slack에서 반응 추가:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Signal 그룹에서 반응 추가:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

generic presentation을 통해 Telegram inline button 보내기:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

generic presentation을 통해 Teams 카드 보내기:

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
