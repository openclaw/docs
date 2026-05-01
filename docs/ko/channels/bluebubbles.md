---
read_when:
    - BlueBubbles 채널 설정
    - Webhook 페어링 문제 해결
    - macOS에서 iMessage 구성하기
sidebarTitle: BlueBubbles
summary: BlueBubbles macOS 서버를 통한 iMessage(REST 송수신, 입력 중 표시, 반응, 페어링, 고급 작업).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-01T06:23:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 499cc2a46db6e0eddfb897e96ec4b3e4a39ba9f2f6da8e7485c1c46562de4145
    source_path: channels/bluebubbles.md
    workflow: 16
---

상태: HTTP를 통해 BlueBubbles macOS 서버와 통신하는 번들 Plugin입니다. 기존 imsg 채널보다 API가 더 풍부하고 설정이 더 쉬워서 **iMessage 통합에 권장됩니다**.

<Note>
현재 OpenClaw 릴리스에는 BlueBubbles가 번들로 포함되어 있으므로, 일반 패키지 빌드에서는 별도의 `openclaw plugins install` 단계가 필요하지 않습니다.
</Note>

## 개요

- BlueBubbles 헬퍼 앱([bluebubbles.app](https://bluebubbles.app))을 통해 macOS에서 실행됩니다.
- 권장/테스트됨: macOS Sequoia (15). macOS Tahoe (26)도 동작하지만, 현재 Tahoe에서는 편집 기능이 깨져 있으며 그룹 아이콘 업데이트가 성공으로 보고되더라도 동기화되지 않을 수 있습니다.
- OpenClaw는 REST API(`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`)를 통해 BlueBubbles와 통신합니다.
- 수신 메시지는 Webhook으로 도착하며, 발신 답장, 입력 표시, 읽음 확인, 탭백은 REST 호출입니다.
- 첨부 파일과 스티커는 인바운드 미디어로 수집됩니다(가능한 경우 에이전트에 표시됨).
- MP3 또는 CAF 오디오를 합성하는 자동 TTS 답장은 일반 파일 첨부 대신 iMessage 음성 메모 말풍선으로 전달됩니다.
- 페어링/허용 목록은 다른 채널(`/channels/pairing` 등)과 동일하게 `channels.bluebubbles.allowFrom` + 페어링 코드로 동작합니다.
- 반응은 Slack/Telegram과 동일하게 시스템 이벤트로 표시되므로 에이전트가 답장하기 전에 이를 "언급"할 수 있습니다.
- 고급 기능: 편집, 보내기 취소, 답장 스레딩, 메시지 효과, 그룹 관리.

## 빠른 시작

<Steps>
  <Step title="BlueBubbles 설치">
    Mac에 BlueBubbles 서버를 설치합니다([bluebubbles.app/install](https://bluebubbles.app/install)의 안내를 따르세요).
  </Step>
  <Step title="웹 API 활성화">
    BlueBubbles 설정에서 웹 API를 활성화하고 비밀번호를 설정합니다.
  </Step>
  <Step title="OpenClaw 설정">
    `openclaw onboard`를 실행하고 BlueBubbles를 선택하거나, 수동으로 설정합니다.

    ```json5
    {
      channels: {
        bluebubbles: {
          enabled: true,
          serverUrl: "http://192.168.1.100:1234",
          password: "example-password",
          webhookPath: "/bluebubbles-webhook",
        },
      },
    }
    ```

  </Step>
  <Step title="Webhook을 Gateway로 지정">
    BlueBubbles Webhook이 Gateway를 가리키도록 설정합니다(예: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Gateway 시작">
    Gateway를 시작합니다. Webhook 핸들러를 등록하고 페어링을 시작합니다.
  </Step>
</Steps>

<Warning>
**보안**

- 항상 Webhook 비밀번호를 설정하세요.
- Webhook 인증은 항상 필요합니다. OpenClaw는 local loopback/프록시 토폴로지와 관계없이 `channels.bluebubbles.password`와 일치하는 비밀번호/guid(예: `?password=<password>` 또는 `x-password`)가 포함되지 않은 BlueBubbles Webhook 요청을 거부합니다.
- 비밀번호 인증은 전체 Webhook 본문을 읽거나 파싱하기 전에 확인됩니다.

</Warning>

## Messages.app을 계속 활성 상태로 유지하기(VM / 헤드리스 설정)

일부 macOS VM / 상시 실행 설정에서는 Messages.app이 "유휴" 상태가 되어 앱을 열거나 포그라운드로 가져올 때까지 수신 이벤트가 멈출 수 있습니다. 간단한 해결 방법은 AppleScript + LaunchAgent를 사용해 **5분마다 Messages를 깨우는 것**입니다.

<Steps>
  <Step title="AppleScript 저장">
    다음 내용을 `~/Scripts/poke-messages.scpt`로 저장합니다.

    ```applescript
    try
      tell application "Messages"
        if not running then
          launch
        end if

        -- Touch the scripting interface to keep the process responsive.
        set _chatCount to (count of chats)
      end tell
    on error
      -- Ignore transient failures (first-run prompts, locked session, etc).
    end try
    ```

  </Step>
  <Step title="LaunchAgent 설치">
    다음 내용을 `~/Library/LaunchAgents/com.user.poke-messages.plist`로 저장합니다.

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
      <dict>
        <key>Label</key>
        <string>com.user.poke-messages</string>

        <key>ProgramArguments</key>
        <array>
          <string>/bin/bash</string>
          <string>-lc</string>
          <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
        </array>

        <key>RunAtLoad</key>
        <true/>

        <key>StartInterval</key>
        <integer>300</integer>

        <key>StandardOutPath</key>
        <string>/tmp/poke-messages.log</string>
        <key>StandardErrorPath</key>
        <string>/tmp/poke-messages.err</string>
      </dict>
    </plist>
    ```

    이는 **300초마다** 그리고 **로그인 시** 실행됩니다. 첫 실행 시 macOS **자동화** 프롬프트(`osascript` → Messages)가 표시될 수 있습니다. LaunchAgent를 실행하는 동일한 사용자 세션에서 승인하세요.

  </Step>
  <Step title="로드">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## 온보딩

BlueBubbles는 대화형 온보딩에서 사용할 수 있습니다.

```
openclaw onboard
```

마법사는 다음 항목을 입력하라고 안내합니다.

<ParamField path="Server URL" type="string" required>
  BlueBubbles 서버 주소(예: `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  BlueBubbles Server 설정의 API 비밀번호.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Webhook 엔드포인트 경로.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open` 또는 `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  전화번호, 이메일 또는 채팅 대상.
</ParamField>

CLI로 BlueBubbles를 추가할 수도 있습니다.

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## 접근 제어(DM + 그룹)

<Tabs>
  <Tab title="DM">
    - 기본값: `channels.bluebubbles.dmPolicy = "pairing"`.
    - 알 수 없는 발신자는 페어링 코드를 받으며, 승인될 때까지 메시지가 무시됩니다(코드는 1시간 후 만료).
    - 승인 방법:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - 페어링은 기본 토큰 교환 방식입니다. 자세한 내용: [페어링](/ko/channels/pairing)

  </Tab>
  <Tab title="그룹">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled`(기본값: `allowlist`).
    - `allowlist`가 설정된 경우 `channels.bluebubbles.groupAllowFrom`은 그룹에서 누가 트리거할 수 있는지 제어합니다.

  </Tab>
</Tabs>

### 연락처 이름 보강(macOS, 선택 사항)

BlueBubbles 그룹 Webhook에는 원시 참가자 주소만 포함되는 경우가 많습니다. `GroupMembers` 컨텍스트에 로컬 연락처 이름을 대신 표시하려면 macOS에서 로컬 연락처 보강을 선택할 수 있습니다.

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true`는 조회를 활성화합니다. 기본값: `false`.
- 조회는 그룹 접근, 명령 승인, 멘션 게이팅이 메시지를 통과시킨 후에만 실행됩니다.
- 이름이 없는 전화 참가자만 보강됩니다.
- 로컬 일치 항목이 없으면 원시 전화번호가 대체값으로 유지됩니다.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### 멘션 게이팅(그룹)

BlueBubbles는 iMessage/WhatsApp 동작과 일치하는 그룹 채팅 멘션 게이팅을 지원합니다.

- 멘션을 감지하기 위해 `agents.list[].groupChat.mentionPatterns`(또는 `messages.groupChat.mentionPatterns`)를 사용합니다.
- 그룹에 `requireMention`이 활성화된 경우, 에이전트는 멘션되었을 때만 응답합니다.
- 승인된 발신자의 제어 명령은 멘션 게이팅을 우회합니다.

그룹별 설정:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default for all groups
        "iMessage;-;chat123": { requireMention: false }, // override for specific group
      },
    },
  },
}
```

### 명령 게이팅

- 제어 명령(예: `/config`, `/model`)에는 승인이 필요합니다.
- 명령 승인을 결정하기 위해 `allowFrom` 및 `groupAllowFrom`을 사용합니다.
- 승인된 발신자는 그룹에서 멘션하지 않아도 제어 명령을 실행할 수 있습니다.

### 그룹별 시스템 프롬프트

`channels.bluebubbles.groups.*` 아래의 각 항목은 선택적 `systemPrompt` 문자열을 허용합니다. 이 값은 해당 그룹의 메시지를 처리하는 모든 턴에서 에이전트의 시스템 프롬프트에 삽입되므로, 에이전트 프롬프트를 편집하지 않고도 그룹별 페르소나 또는 동작 규칙을 설정할 수 있습니다.

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Keep responses under 3 sentences. Mirror the group's casual tone.",
        },
      },
    },
  },
}
```

키는 BlueBubbles가 그룹에 대해 보고하는 `chatGuid` / `chatIdentifier` / 숫자 `chatId`와 일치하며, `"*"` 와일드카드 항목은 정확히 일치하는 항목이 없는 모든 그룹의 기본값을 제공합니다(`requireMention` 및 그룹별 도구 정책과 동일한 패턴 사용). 정확히 일치하는 항목은 항상 와일드카드보다 우선합니다. DM은 이 필드를 무시합니다. 대신 에이전트 수준 또는 계정 수준 프롬프트 사용자 지정을 사용하세요.

#### 작업 예시: 스레드 답장과 탭백 반응(Private API)

BlueBubbles Private API가 활성화되어 있으면 인바운드 메시지는 짧은 메시지 ID(예: `[[reply_to:5]]`)와 함께 도착하며, 에이전트는 `action=reply`를 호출해 특정 메시지에 스레드로 답하거나 `action=react`를 호출해 탭백을 남길 수 있습니다. 그룹별 `systemPrompt`는 에이전트가 올바른 도구를 선택하도록 유지하는 신뢰할 수 있는 방법입니다.

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "When replying in this group, always call action=reply with the",
            "[[reply_to:N]] messageId from context so your response threads",
            "under the triggering message. Never send a new unlinked message.",
            "",
            "For short acknowledgements ('ok', 'got it', 'on it'), use",
            "action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓)",
            "instead of sending a text reply.",
          ].join(" "),
        },
      },
    },
  },
}
```

탭백 반응과 스레드 답장 모두 BlueBubbles Private API가 필요합니다. 기본 메커니즘은 [고급 작업](#advanced-actions) 및 [메시지 ID](#message-ids-short-vs-full)를 참조하세요.

## ACP 대화 바인딩

BlueBubbles 채팅은 전송 계층을 변경하지 않고도 지속적인 ACP 작업 영역으로 전환할 수 있습니다.

빠른 운영자 흐름:

- DM 또는 허용된 그룹 채팅 안에서 `/acp spawn codex --bind here`를 실행합니다.
- 이후 동일한 BlueBubbles 대화의 메시지는 생성된 ACP 세션으로 라우팅됩니다.
- `/new` 및 `/reset`은 동일한 바인딩된 ACP 세션을 제자리에서 재설정합니다.
- `/acp close`는 ACP 세션을 닫고 바인딩을 제거합니다.

구성된 영구 바인딩은 `type: "acp"` 및 `match.channel: "bluebubbles"`가 있는 최상위 `bindings[]` 항목을 통해서도 지원됩니다.

`match.peer.id`는 지원되는 모든 BlueBubbles 대상 형식을 사용할 수 있습니다.

- `+15555550123` 또는 `user@example.com` 같은 정규화된 DM 핸들
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

안정적인 그룹 바인딩에는 `chat_id:*` 또는 `chat_identifier:*`를 선호하세요.

예:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

공유 ACP 바인딩 동작은 [ACP 에이전트](/ko/tools/acp-agents)를 참조하세요.

## 입력 표시 + 읽음 확인

- **입력 표시기**: 응답 생성 전과 생성 중에 자동으로 전송됩니다.
- **읽음 확인**: `channels.bluebubbles.sendReadReceipts`로 제어됩니다(기본값: `true`).
- **입력 표시기**: OpenClaw는 입력 시작 이벤트를 전송합니다. BlueBubbles는 전송 또는 시간 초과 시 입력 상태를 자동으로 지웁니다(DELETE를 통한 수동 중지는 신뢰할 수 없습니다).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
    },
  },
}
```

## 고급 동작

BlueBubbles는 설정에서 활성화된 경우 고급 메시지 동작을 지원합니다.

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Available actions">
    - **react**: Tapback 반응을 추가/제거합니다(`messageId`, `emoji`, `remove`). iMessage의 기본 tapback 세트는 `love`, `like`, `dislike`, `laugh`, `emphasize`, `question`입니다. 에이전트가 해당 세트 밖의 이모지(예: `👀`)를 선택하면, 반응 도구는 전체 요청을 실패시키지 않고 tapback이 계속 렌더링되도록 `love`로 폴백합니다. 구성된 확인 반응은 여전히 엄격하게 검증되며 알 수 없는 값에서는 오류가 발생합니다.
    - **edit**: 보낸 메시지를 편집합니다(`messageId`, `text`).
    - **unsend**: 메시지 전송을 취소합니다(`messageId`).
    - **reply**: 특정 메시지에 답장합니다(`messageId`, `text`, `to`).
    - **sendWithEffect**: iMessage 효과와 함께 보냅니다(`text`, `to`, `effectId`).
    - **renameGroup**: 그룹 채팅 이름을 변경합니다(`chatGuid`, `displayName`).
    - **setGroupIcon**: 그룹 채팅의 아이콘/사진을 설정합니다(`chatGuid`, `media`). macOS 26 Tahoe에서는 불안정합니다(API가 성공을 반환해도 아이콘이 동기화되지 않을 수 있음).
    - **addParticipant**: 그룹에 사람을 추가합니다(`chatGuid`, `address`).
    - **removeParticipant**: 그룹에서 사람을 제거합니다(`chatGuid`, `address`).
    - **leaveGroup**: 그룹 채팅에서 나갑니다(`chatGuid`).
    - **upload-file**: 미디어/파일을 보냅니다(`to`, `buffer`, `filename`, `asVoice`).
      - 음성 메모: **MP3** 또는 **CAF** 오디오와 함께 `asVoice: true`를 설정하면 iMessage 음성 메시지로 보낼 수 있습니다. BlueBubbles는 음성 메모를 보낼 때 MP3 → CAF로 변환합니다.
    - 레거시 별칭: `sendAttachment`도 여전히 동작하지만, 정식 동작 이름은 `upload-file`입니다.

  </Accordion>
</AccordionGroup>

### 메시지 ID(짧은 형식 vs 전체 형식)

OpenClaw는 토큰을 절약하기 위해 _짧은_ 메시지 ID(예: `1`, `2`)를 노출할 수 있습니다.

- `MessageSid` / `ReplyToId`는 짧은 ID일 수 있습니다.
- `MessageSidFull` / `ReplyToIdFull`에는 제공자의 전체 ID가 들어 있습니다.
- 짧은 ID는 메모리 내에만 있으며, 재시작 또는 캐시 제거 시 만료될 수 있습니다.
- 동작은 짧은 `messageId` 또는 전체 `messageId`를 허용하지만, 짧은 ID를 더 이상 사용할 수 없으면 오류가 발생합니다.

내구성 있는 자동화와 저장에는 전체 ID를 사용하세요.

- 템플릿: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- 컨텍스트: 인바운드 페이로드의 `MessageSidFull` / `ReplyToIdFull`

템플릿 변수는 [설정](/ko/gateway/configuration)을 참고하세요.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 분할 전송 DM 병합(한 번의 작성에 명령 + URL)

사용자가 iMessage에서 명령과 URL을 함께 입력하면(예: `Dump https://example.com/article`) Apple은 전송을 **두 개의 별도 Webhook 전달**로 분할합니다.

1. 텍스트 메시지(`"Dump"`).
2. OG 미리보기 이미지가 첨부된 URL 미리보기 말풍선(`"https://..."`).

대부분의 설정에서 두 Webhook은 약 0.8~2.0초 간격으로 OpenClaw에 도착합니다. 병합이 없으면 에이전트는 1턴에서 명령만 받고 응답하며(흔히 "URL을 보내 달라"는 식), 2턴에서야 URL을 보게 됩니다. 이때는 이미 명령 컨텍스트가 사라진 상태입니다.

`channels.bluebubbles.coalesceSameSenderDms`는 DM에서 같은 발신자의 연속 Webhook을 단일 에이전트 턴으로 병합하도록 선택합니다. 그룹 채팅은 다중 사용자 턴 구조를 보존하기 위해 계속 메시지별로 키를 지정합니다.

<Tabs>
  <Tab title="When to enable">
    다음 경우 활성화하세요.

    - 한 메시지에서 `command + payload`를 기대하는 skills를 배포합니다(dump, paste, save, queue 등).
    - 사용자가 명령과 함께 URL, 이미지 또는 긴 콘텐츠를 붙여 넣습니다.
    - 추가되는 DM 턴 지연 시간을 허용할 수 있습니다(아래 참고).

    다음 경우 비활성화된 상태로 두세요.

    - 한 단어 DM 트리거에 최소 명령 지연 시간이 필요합니다.
    - 모든 흐름이 후속 페이로드 없는 일회성 명령입니다.

  </Tab>
  <Tab title="Enabling">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    플래그가 켜져 있고 명시적인 `messages.inbound.byChannel.bluebubbles`가 없으면 디바운스 창이 **2500 ms**로 넓어집니다(병합하지 않을 때의 기본값은 500 ms). 더 넓은 창이 필요합니다. Apple의 분할 전송 간격인 0.8~2.0초는 더 좁은 기본값에 맞지 않습니다.

    창을 직접 조정하려면:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is slow
            // or under memory pressure (observed gap can stretch past 2 s then).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-offs">
    - **DM 제어 명령에 추가 지연이 발생합니다.** 플래그가 켜져 있으면 DM 제어 명령 메시지(예: `Dump`, `Save` 등)는 페이로드 Webhook이 올 수 있으므로 디스패치 전에 최대 디바운스 창만큼 기다립니다. 그룹 채팅 명령은 즉시 디스패치됩니다.
    - **병합된 출력은 제한됩니다.** 병합된 텍스트는 명시적인 `…[truncated]` 표시와 함께 4000자로 제한됩니다. 첨부 파일은 20개로 제한됩니다. 소스 항목은 10개로 제한됩니다(그 이상은 첫 항목과 최신 항목을 유지). 모든 소스 `messageId`는 여전히 인바운드 중복 제거에 도달하므로, 나중에 MessagePoller가 개별 이벤트를 재생해도 중복으로 인식됩니다.
    - **채널별 옵트인입니다.** 다른 채널(Telegram, WhatsApp, Slack, …)에는 영향을 주지 않습니다.

  </Tab>
</Tabs>

### 시나리오와 에이전트가 보는 내용

| 사용자가 작성한 내용                                              | Apple 전달 방식           | 플래그 꺼짐(기본값)                    | 플래그 켜짐 + 2500 ms 창                                               |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`(한 번 전송)                             | 약 1초 간격의 Webhook 2개 | 두 에이전트 턴: "Dump"만, 그다음 URL   | 한 턴: 병합된 텍스트 `Dump https://example.com`                         |
| `Save this 📎image.jpg caption`(첨부 파일 + 텍스트)                | Webhook 2개               | 두 턴                                  | 한 턴: 텍스트 + 이미지                                                 |
| `/status`(독립 명령)                                               | Webhook 1개               | 즉시 디스패치                         | **최대 창만큼 기다린 뒤 디스패치**                                     |
| URL만 붙여 넣음                                                    | Webhook 1개               | 즉시 디스패치                         | 즉시 디스패치(버킷에 항목이 하나뿐임)                                  |
| 텍스트 + URL을 몇 분 간격으로 의도적으로 별도 메시지 2개로 전송    | 창 밖의 Webhook 2개       | 두 턴                                  | 두 턴(그 사이에 창 만료)                                               |
| 빠른 폭주(창 안에 작은 DM 10개 초과)                               | Webhook N개               | N턴                                    | 한 턴, 제한된 출력(첫 항목 + 최신 항목, 텍스트/첨부 파일 제한 적용)   |

### 분할 전송 병합 문제 해결

플래그가 켜져 있는데도 분할 전송이 여전히 두 턴으로 도착하면 각 계층을 확인하세요.

<AccordionGroup>
  <Accordion title="Config actually loaded">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    그런 다음 `openclaw gateway restart`를 실행합니다. 플래그는 디바운서 레지스트리 생성 시 읽힙니다.

  </Accordion>
  <Accordion title="Debounce window wide enough for your setup">
    `~/Library/Logs/bluebubbles-server/main.log` 아래의 BlueBubbles 서버 로그를 확인하세요.

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    `"Dump"` 스타일 텍스트 디스패치와 그 뒤에 오는 `"https://..."; Attachments:` 디스패치 사이의 간격을 측정합니다. `messages.inbound.byChannel.bluebubbles`를 해당 간격을 충분히 덮도록 올리세요.

  </Accordion>
  <Accordion title="Session JSONL timestamps ≠ webhook arrival">
    세션 이벤트 타임스탬프(`~/.openclaw/agents/<id>/sessions/*.jsonl`)는 Webhook이 도착한 시점이 아니라 Gateway가 메시지를 에이전트에 넘긴 시점을 반영합니다. `[Queued messages while agent was busy]`로 태그된 대기 중인 두 번째 메시지는 두 번째 Webhook이 도착했을 때 첫 번째 턴이 아직 실행 중이었다는 뜻입니다. 병합 버킷은 이미 플러시된 상태였습니다. 세션 로그가 아니라 BB 서버 로그를 기준으로 창을 조정하세요.
  </Accordion>
  <Accordion title="Memory pressure slowing reply dispatch">
    더 작은 머신(8 GB)에서는 에이전트 턴이 충분히 오래 걸려 응답이 완료되기 전에 병합 버킷이 플러시되고, URL이 대기 중인 두 번째 턴으로 들어갈 수 있습니다. `memory_pressure`와 `ps -o rss -p $(pgrep openclaw-gateway)`를 확인하세요. Gateway가 약 500 MB RSS를 넘고 압축기가 활성 상태라면 다른 무거운 프로세스를 닫거나 더 큰 호스트로 올리세요.
  </Accordion>
  <Accordion title="Reply-quote sends are a different path">
    사용자가 기존 URL 말풍선에 대한 **답장**으로 `Dump`를 탭했다면(iMessage가 Dump 말풍선에 "1 Reply" 배지를 표시), URL은 두 번째 Webhook이 아니라 `replyToBody`에 있습니다. 병합은 적용되지 않습니다. 이는 디바운서 문제가 아니라 skill/프롬프트 문제입니다.
  </Accordion>
</AccordionGroup>

## 블록 스트리밍

응답을 단일 메시지로 보낼지 블록 단위로 스트리밍할지 제어합니다.

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## 미디어 + 제한

- 인바운드 첨부 파일은 다운로드되어 미디어 캐시에 저장됩니다.
- 인바운드 및 아웃바운드 미디어의 미디어 한도는 `channels.bluebubbles.mediaMaxMb`를 통해 설정합니다(기본값: 8 MB).
- 아웃바운드 텍스트는 `channels.bluebubbles.textChunkLimit`에 따라 청크로 나뉩니다(기본값: 4000자).

## 설정 참조

전체 설정: [설정](/ko/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connection and webhook">
    - `channels.bluebubbles.enabled`: 채널을 활성화/비활성화합니다.
    - `channels.bluebubbles.serverUrl`: BlueBubbles REST API 기본 URL입니다.
    - `channels.bluebubbles.password`: API 비밀번호입니다.
    - `channels.bluebubbles.webhookPath`: Webhook 엔드포인트 경로입니다(기본값: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Access policy">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled`(기본값: `pairing`).
    - `channels.bluebubbles.allowFrom`: DM 허용 목록입니다(핸들, 이메일, E.164 번호, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled`(기본값: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: 그룹 발신자 허용 목록입니다.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOS에서 게이트 통과 후 이름 없는 그룹 참여자를 로컬 연락처에서 선택적으로 보강합니다. 기본값: `false`.
    - `channels.bluebubbles.groups`: 그룹별 설정입니다(`requireMention` 등).

  </Accordion>
  <Accordion title="전송 및 청크 처리">
    - `channels.bluebubbles.sendReadReceipts`: 읽음 확인을 보냅니다(기본값: `true`).
    - `channels.bluebubbles.blockStreaming`: 블록 스트리밍을 활성화합니다(기본값: `false`; 스트리밍 답장에 필요).
    - `channels.bluebubbles.textChunkLimit`: 발신 청크 크기(문자 수, 기본값: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: `/api/v1/message/text`를 통한 발신 텍스트 전송의 요청당 제한 시간(ms, 기본값: 30000). Private API iMessage 전송이 iMessage 프레임워크 안에서 60초 이상 멈출 수 있는 macOS 26 설정에서는 값을 높이세요. 예: `45000` 또는 `60000`. 프로브, 채팅 조회, 반응, 편집, 상태 확인은 현재 더 짧은 10초 기본값을 유지합니다. 반응과 편집까지 적용 범위를 넓히는 작업은 후속으로 계획되어 있습니다. 계정별 재정의: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length`(기본값)는 `textChunkLimit`를 초과할 때만 분할합니다. `newline`은 길이 기반 청크 처리 전에 빈 줄(문단 경계)에서 분할합니다.

  </Accordion>
  <Accordion title="미디어 및 기록">
    - `channels.bluebubbles.mediaMaxMb`: 수신/발신 미디어 상한(MB, 기본값: 8).
    - `channels.bluebubbles.mediaLocalRoots`: 발신 로컬 미디어 경로에 허용되는 절대 로컬 디렉터리의 명시적 허용 목록입니다. 이를 구성하지 않으면 로컬 경로 전송은 기본적으로 거부됩니다. 계정별 재정의: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: 같은 발신자가 연속으로 보낸 DM Webhook을 하나의 에이전트 턴으로 병합하여 Apple의 텍스트+URL 분할 전송이 단일 메시지로 도착하게 합니다(기본값: `false`). 시나리오, 창 조정, 트레이드오프는 [분할 전송 DM 병합](#coalescing-split-send-dms-command--url-in-one-composition)을 참고하세요. 명시적인 `messages.inbound.byChannel.bluebubbles` 없이 활성화하면 기본 수신 디바운스 창이 500 ms에서 2500 ms로 넓어집니다.
    - `channels.bluebubbles.historyLimit`: 컨텍스트용 최대 그룹 메시지 수(0은 비활성화).
    - `channels.bluebubbles.dmHistoryLimit`: DM 기록 제한.
    - `channels.bluebubbles.replyContextApiFallback`: 수신 답장에 `replyToBody`/`replyToSender`가 없고 메모리 내 답장 컨텍스트 캐시도 빗나간 경우, 최선형 폴백으로 BlueBubbles HTTP API에서 원본 메시지를 가져옵니다(기본값: `false`). 하나의 BlueBubbles 계정을 공유하는 다중 인스턴스 배포, 프로세스 재시작 후, 또는 장기 TTL/LRU 캐시 축출 후에 유용합니다. 가져오기는 다른 모든 BlueBubbles 클라이언트 요청과 동일한 정책으로 SSRF 보호되며, 절대 예외를 던지지 않고, 이후 답장이 분산 처리되도록 캐시를 채웁니다. 계정별 재정의: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. 채널 수준 설정은 해당 플래그를 생략한 계정으로 전파됩니다.

  </Accordion>
  <Accordion title="작업 및 계정">
    - `channels.bluebubbles.actions`: 특정 작업을 활성화/비활성화합니다.
    - `channels.bluebubbles.accounts`: 다중 계정 구성.

  </Accordion>
</AccordionGroup>

관련 전역 옵션:

- `agents.list[].groupChat.mentionPatterns`(또는 `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## 주소 지정 / 전송 대상

안정적인 라우팅에는 `chat_guid`를 선호하세요.

- `chat_guid:iMessage;-;+15555550123`(그룹에 권장)
- `chat_id:123`
- `chat_identifier:...`
- 직접 핸들: `+15555550123`, `user@example.com`
  - 직접 핸들에 기존 DM 채팅이 없으면 OpenClaw가 `POST /api/v1/chat/new`를 통해 하나를 생성합니다. 이를 위해서는 BlueBubbles Private API가 활성화되어 있어야 합니다.

### iMessage와 SMS 라우팅

동일한 핸들이 Mac에서 iMessage 채팅과 SMS 채팅을 모두 가지고 있는 경우(예: iMessage에 등록되어 있지만 초록 말풍선 폴백도 수신한 전화번호), OpenClaw는 iMessage 채팅을 선호하며 자동으로 SMS로 다운그레이드하지 않습니다. SMS 채팅을 강제로 사용하려면 명시적인 `sms:` 대상 접두사를 사용하세요(예: `sms:+15555550123`). 일치하는 iMessage 채팅이 없는 핸들은 BlueBubbles가 보고하는 채팅을 통해 그대로 전송됩니다.

## 보안

- Webhook 요청은 `guid`/`password` 쿼리 매개변수 또는 헤더를 `channels.bluebubbles.password`와 비교하여 인증됩니다.
- API 비밀번호와 Webhook 엔드포인트를 비밀로 유지하세요(자격 증명처럼 취급하세요).
- BlueBubbles Webhook 인증에는 localhost 우회가 없습니다. Webhook 트래픽을 프록시하는 경우 요청의 처음부터 끝까지 BlueBubbles 비밀번호를 유지하세요. 여기서 `gateway.trustedProxies`는 `channels.bluebubbles.password`를 대체하지 않습니다. [Gateway 보안](/ko/gateway/security#reverse-proxy-configuration)을 참고하세요.
- LAN 외부에 노출하는 경우 BlueBubbles 서버에서 HTTPS와 방화벽 규칙을 활성화하세요.

## 문제 해결

- 입력/읽음 이벤트가 작동을 멈추면 BlueBubbles Webhook 로그를 확인하고 Gateway 경로가 `channels.bluebubbles.webhookPath`와 일치하는지 검증하세요.
- 페어링 코드는 한 시간 후 만료됩니다. `openclaw pairing list bluebubbles` 및 `openclaw pairing approve bluebubbles <code>`를 사용하세요.
- 반응에는 BlueBubbles private API(`POST /api/v1/message/react`)가 필요합니다. 서버 버전이 이를 노출하는지 확인하세요.
- 편집/전송 취소에는 macOS 13+와 호환되는 BlueBubbles 서버 버전이 필요합니다. macOS 26(Tahoe)에서는 private API 변경으로 인해 현재 편집이 깨져 있습니다.
- 그룹 아이콘 업데이트는 macOS 26(Tahoe)에서 불안정할 수 있습니다. API가 성공을 반환하더라도 새 아이콘이 동기화되지 않을 수 있습니다.
- OpenClaw는 BlueBubbles 서버의 macOS 버전에 따라 깨진 것으로 알려진 작업을 자동으로 숨깁니다. macOS 26(Tahoe)에서도 편집이 계속 표시되면 `channels.bluebubbles.actions.edit=false`로 수동 비활성화하세요.
- `coalesceSameSenderDms`가 활성화되었지만 분할 전송(예: `Dump` + URL)이 여전히 두 턴으로 도착하는 경우: [분할 전송 병합 문제 해결](#split-send-coalescing-troubleshooting) 체크리스트를 참고하세요. 일반적인 원인은 너무 짧은 디바운스 창, Webhook 도착 시간으로 잘못 해석한 세션 로그 타임스탬프, 또는 답장 인용 전송(`replyToBody`를 사용하며 두 번째 Webhook이 아님)입니다.
- 상태/헬스 정보: `openclaw status --all` 또는 `openclaw status --deep`.

일반 채널 워크플로 참고 자료는 [채널](/ko/channels) 및 [Plugins](/ko/tools/plugin) 가이드를 참고하세요.

## 관련 항목

- [채널 라우팅](/ko/channels/channel-routing) — 메시지용 세션 라우팅
- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이트
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [보안](/ko/gateway/security) — 액세스 모델 및 강화
