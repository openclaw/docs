---
read_when:
    - 메시지 CLI 작업 추가 또는 수정
    - 아웃바운드 채널 동작 변경
summary: '`openclaw message`의 CLI 참조(전송 + 채널 작업)'
title: 메시지
x-i18n:
    generated_at: "2026-07-12T00:38:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2d1cca9be7cfa7625cac3e440ecb5847d9fab9c545c9267a41a2f99c26c514b
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Discord, Google Chat, iMessage, Matrix, Mattermost(Plugin), Microsoft Teams,
Signal, Slack, Telegram, WhatsApp 전반에서 메시지와 채널 작업을 전송하는
단일 아웃바운드 명령입니다.

```bash
openclaw message <subcommand> [flags]
```

## 채널 선택

- 채널이 두 개 이상 구성된 경우 `--channel <name>`이 필수이며, 정확히
  하나의 채널만 구성된 경우 해당 채널이 기본값입니다.
- 값: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  (Mattermost에는 Plugin이 필요합니다).
- 채널 접두사가 붙은 대상(예: `discord:channel:123`)은 명시적인
  `--channel` 없이 소유 Plugin을 확인합니다.

## 대상 형식 (`-t, --target`)

| 채널                | 형식                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| Discord             | `channel:<id>`, `user:<id>`, `<@id>` 멘션 또는 숫자로만 된 ID(채널 ID로 처리)                             |
| Google Chat         | `spaces/<spaceId>` 또는 `users/<userId>`                                                                   |
| iMessage            | 핸들, `chat_id:<id>`, `chat_guid:<guid>` 또는 `chat_identifier:<id>`                                      |
| Mattermost(Plugin)  | `channel:<id>`, `user:<id>`, `@username` 또는 접두사 없는 ID(채널로 처리)                                 |
| Matrix              | `@user:server`, `!room:server` 또는 `#alias:server`                                                        |
| Microsoft Teams     | `conversation:<id>` (`19:...@thread.tacv2`), 접두사 없는 대화 ID 또는 `user:<aad-object-id>`              |
| Signal              | `+E.164`, `group:<id>`, `uuid:<id>`, `username:<name>`/`u:<name>` 또는 이들 중 하나에 `signal:` 접두사 추가 |
| Slack               | `channel:<id>` 또는 `user:<id>`(접두사 없는 ID는 채널로 처리)                                             |
| Telegram            | 채팅 ID, `@username` 또는 포럼 주제 대상: `<chatId>:topic:<topicId>`(또는 `--thread-id <topicId>`)         |
| WhatsApp            | E.164, 그룹 JID(`...@g.us`) 또는 채널/뉴스레터 JID(`...@newsletter`)                                      |

채널 이름 조회: 디렉터리가 있는 제공자(Discord/Slack 등)의 경우 `Help`나
`#help` 같은 이름은 디렉터리 캐시를 통해 확인되며, 캐시에 없고 제공자가
지원하는 경우 실시간 디렉터리 조회로 대체됩니다.

## 공통 플래그

모든 작업은 `--channel <name>`, `--account <id>`, `--json`,
`--dry-run`, `--verbose`를 허용합니다. 대상을 사용하는 작업은
`-t, --target <dest>`도 허용합니다.

## SecretRef 확인

`openclaw message`는 작업을 실행하기 전에 가능한 한 좁은 범위에서
채널 SecretRef를 확인합니다.

- `--channel`이 설정된 경우(또는 접두사가 붙은 대상에서 추론된 경우) 채널 범위
- `--account`도 설정된 경우 계정 범위
- 둘 다 설정되지 않은 경우 구성된 모든 채널

관련 없는 채널에서 확인되지 않은 SecretRef는 대상이 지정된 작업을 절대
차단하지 않습니다. 선택한 채널/계정에서 SecretRef를 확인할 수 없으면
작업은 실패 시 차단됩니다.

## 작업

### 핵심

| 작업            | 채널                                                                                                            | 필수                                                           | 참고                                                                                                                                                                                                                                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `send`          | Discord, Google Chat, iMessage, Matrix, Mattermost(Plugin), Microsoft Teams, Signal, Slack, Telegram, WhatsApp | `--target` 및 `--message`/`--media`/`--presentation` 중 하나   | 아래의 [전송](#send)을 참조하세요.                                                                                                                                                                                                                                                                      |
| `poll`          | Discord, Matrix, Microsoft Teams, Telegram, WhatsApp                                                            | `--target`, `--poll-question`, `--poll-option`(반복 가능)      | 아래의 [투표](#poll)를 참조하세요.                                                                                                                                                                                                                                                                      |
| `react`         | Discord, Matrix, Nextcloud Talk, Signal, Slack, Telegram, WhatsApp                                              | `--message-id`, `--target`                                     | `--emoji`, `--remove`(`--emoji` 필요, 지원되는 경우 자신의 반응을 모두 지우려면 생략. [반응](/ko/tools/reactions) 참조). WhatsApp: `--participant`, `--from-me`. Signal 그룹 반응에는 `--target-author` 또는 `--target-author-uuid`가 필요합니다. Nextcloud Talk은 반응 추가만 지원하며 `--remove`는 오류를 반환합니다. |
| `reactions`     | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `--limit`.                                                                                                                                                                                                                                                                                              |
| `read`          | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`, `--message-id`, `--before`, `--after`. Discord: `--around`, `--include-thread`. Slack: `--message-id`는 특정 타임스탬프를 읽으며, 정확한 스레드 답글을 지정하려면 `--thread-id`와 함께 사용합니다.                                                                                                |
| `edit`          | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--message`, `--target`                        | Telegram 포럼 스레드는 `--thread-id`를 사용합니다.                                                                                                                                                                                                                                                       |
| `delete`        | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--target`                                     |                                                                                                                                                                                                                                                                                                         |
| `pin` / `unpin` | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `unpin`은 `--pinned-message-id`도 허용합니다(Microsoft Teams: 채팅 메시지 ID가 아닌 고정/고정 목록 리소스 ID).                                                                                                                                                                                           |
| `pins`(목록)    | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`.                                                                                                                                                                                                                                                                                              |
| `permissions`   | Discord, Matrix                                                                                                 | `--target`                                                     | Matrix: 암호화가 활성화되고 확인 작업이 허용된 경우에만 사용할 수 있습니다.                                                                                                                                                                                                                             |
| `search`        | Discord                                                                                                         | `--guild-id`, `--query`                                        | `--channel-id`, `--channel-ids`(반복 가능), `--author-id`, `--author-ids`(반복 가능), `--limit`.                                                                                                                                                                                                        |
| `member info`   | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--user-id`                                                    | `--guild-id`(Discord).                                                                                                                                                                                                                                                                                  |

### 전송

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`: 이미지/오디오/동영상/문서(로컬 경로 또는
  URL)를 첨부합니다.
- `--presentation <json>`: `text`, `context`, `divider`, `chart`,
  `table`, `buttons`, `select` 블록을 포함하는 공유 페이로드로, 채널
  기능에 맞게 렌더링됩니다. [메시지 프레젠테이션](/ko/plugins/message-presentation)을 참조하세요.
- `--delivery <json>`: 일반 전송 환경설정입니다. 예:
  `{"pin": true}`. 채널이 지원하는 경우 `--pin`은 고정 전송의
  축약형입니다.
- `--reply-to <id>`, `--thread-id <id>`(Telegram 포럼 주제, Slack
  스레드 타임스탬프이며 `--reply-to`와 동일한 필드).
- `--force-document`(Telegram, WhatsApp): 채널 압축을 피하기 위해
  이미지/GIF/동영상을 문서로 전송합니다.
- `--silent`(Telegram, Discord): 알림 없이 전송합니다.
- `--gif-playback`(WhatsApp만 해당): 동영상 미디어를 GIF 재생으로 처리합니다.

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Slack은 지원되는 차트 블록을 네이티브로 렌더링하며, 다른 채널은 동일한
데이터를 읽을 수 있는 텍스트로 수신합니다.

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"blocks":[{"type":"chart","chartType":"bar","title":"Quarterly revenue","categories":["Q1","Q2"],"series":[{"name":"Revenue","values":[120,145]}],"xLabel":"Quarter"}]}'
```

Slack은 명시적 테이블 블록도 네이티브로 렌더링합니다. 다른 채널에는 캡션과
모든 행이 결정적 텍스트로 전달됩니다.

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"title":"Pipeline report","blocks":[{"type":"table","caption":"Open pipeline","headers":["Account","Stage","ARR"],"rows":[["Acme","Won",125000],["Globex","Review",82000]],"rowHeaderColumnIndex":0}]}'
```

Telegram Mini App 버튼은 `webApp`을 사용하며(레거시 JSON에서는 `web_app`도 계속
파싱됨), 사용자와 봇 간의 비공개 채팅에서만 렌더링됩니다.

```bash
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

### 설문 조사

```bash
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

- `--poll-option <choice>`: 2~12회 반복합니다.
- `--poll-multi`: 여러 항목을 선택할 수 있도록 허용합니다.
- Discord: `--poll-duration-hours`, `--silent`, `--message`.
- Telegram: `--poll-duration-seconds <n>`(5~600), `--silent`,
  `--poll-anonymous` / `--poll-public`, `--thread-id`.

```bash
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

```bash
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

### 스레드

- `thread create`: 지원 채널은 Discord입니다. 필수: `--thread-name`, `--target`
  (채널 ID). 선택 사항: `--message-id`, `--message`, `--auto-archive-min`.
- `thread list`: 지원 채널은 Discord입니다. 필수: `--guild-id`. 선택 사항:
  `--channel-id`, `--include-archived`, `--before`, `--limit`.
- `thread reply`: 지원 채널은 Discord입니다. 필수: `--target`(스레드 ID),
  `--message`. 선택 사항: `--media`, `--reply-to`.

### 이모지

- `emoji list`: Discord(`--guild-id`), Slack(추가 플래그 없음).
- `emoji upload`: Discord. 필수: `--guild-id`, `--emoji-name`, `--media`.
  선택 사항: `--role-ids`(반복 가능).

### 스티커

- `sticker send`: Discord. 필수: `--target`, `--sticker-id`(반복 가능).
  선택 사항: `--message`.
- `sticker upload`: Discord. 필수: `--guild-id`, `--sticker-name`,
  `--sticker-desc`, `--sticker-tags`, `--media`.

### 역할, 채널, 음성, 이벤트(Discord)

- `role info`: `--guild-id`.
- `role add` / `role remove`: `--guild-id`, `--user-id`, `--role-id`.
- `channel info`: `--target`.
- `channel list`: `--guild-id`.
- `voice status`: `--guild-id`, `--user-id`.
- `event list`: `--guild-id`.
- `event create`: 필수 항목은 `--guild-id`, `--event-name`, `--start-time`;
  선택 사항은 `--end-time`, `--desc`, `--channel-id`, `--location`,
  `--event-type`, `--image <url-or-path>`.

### 관리(Discord)

- `timeout`: `--guild-id`, `--user-id`; 선택 사항은 `--duration-min` 또는
  `--until`(타임아웃을 해제하려면 둘 다 생략), `--reason`.
- `kick`: `--guild-id`, `--user-id`, `--reason`.
- `ban`: `--guild-id`, `--user-id`, `--delete-days`, `--reason`.

### 브로드캐스트

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

하나의 페이로드를 여러 대상으로 전송합니다. `--targets`에는 공백으로 구분된
목록을 지정합니다. 구성된 모든 제공자를 대상으로 하려면 `--channel all`을 사용합니다.

## 관련 문서

- [CLI 참조](/ko/cli)
- [에이전트 전송](/ko/tools/agent-send)
- [메시지 프레젠테이션](/ko/plugins/message-presentation)
