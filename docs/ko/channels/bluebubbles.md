---
read_when:
    - BlueBubbles 채널 설정하기
    - Webhook 페어링 문제 해결
    - macOS에서 iMessage 구성하기
sidebarTitle: BlueBubbles
summary: BlueBubbles macOS 서버를 통한 iMessage(REST 송수신, 입력 중 표시, 반응, 페어링, 고급 작업).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-26T11:22:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9a9eef02110f9e40f60c0bbd413c7ad7e33c377a7cf9ca2ae43aa170100ff77
    source_path: channels/bluebubbles.md
    workflow: 15
---

상태: HTTP를 통해 BlueBubbles macOS 서버와 통신하는 번들 Plugin입니다. 기존 imsg 채널보다 API가 더 풍부하고 설정이 더 쉬워서 **iMessage 통합에 권장됩니다**.

<Note>
현재 OpenClaw 릴리스에는 BlueBubbles가 번들로 포함되어 있으므로, 일반적인 패키지 빌드에서는 별도의 `openclaw plugins install` 단계가 필요하지 않습니다.
</Note>

## 개요

- macOS에서 BlueBubbles 도우미 앱([bluebubbles.app](https://bluebubbles.app))을 통해 실행됩니다.
- 권장/테스트 환경: macOS Sequoia (15). macOS Tahoe (26)도 작동하지만, 현재 Tahoe에서는 편집 기능이 깨져 있으며 그룹 아이콘 업데이트는 성공으로 표시되더라도 동기화되지 않을 수 있습니다.
- OpenClaw는 REST API(`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`)를 통해 이를 사용합니다.
- 수신 메시지는 Webhook을 통해 도착하며, 발신 답장, 입력 중 표시, 읽음 확인, 탭백은 REST 호출로 처리됩니다.
- 첨부 파일과 스티커는 수신 미디어로 수집되며(가능한 경우 에이전트에 전달됨), 표시됩니다.
- MP3 또는 CAF 오디오를 합성하는 자동 TTS 답장은 일반 파일 첨부 대신 iMessage 음성 메모 버블로 전달됩니다.
- 페어링/허용 목록은 다른 채널과 동일한 방식(`/channels/pairing` 등)으로 작동하며 `channels.bluebubbles.allowFrom` + 페어링 코드를 사용합니다.
- 반응은 Slack/Telegram과 마찬가지로 시스템 이벤트로 노출되므로, 에이전트는 답장 전에 이를 "언급"할 수 있습니다.
- 고급 기능: 편집, 전송 취소, 답장 스레드, 메시지 효과, 그룹 관리.

## 빠른 시작

<Steps>
  <Step title="BlueBubbles 설치">
    Mac에 BlueBubbles 서버를 설치합니다([bluebubbles.app/install](https://bluebubbles.app/install)의 안내를 따르세요).
  </Step>
  <Step title="웹 API 활성화">
    BlueBubbles 설정에서 웹 API를 활성화하고 비밀번호를 설정합니다.
  </Step>
  <Step title="OpenClaw 구성">
    `openclaw onboard`를 실행하고 BlueBubbles를 선택하거나, 수동으로 구성합니다:

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
    Gateway를 시작하면 Webhook 핸들러를 등록하고 페어링을 시작합니다.
  </Step>
</Steps>

<Warning>
**보안**

- 항상 Webhook 비밀번호를 설정하세요.
- Webhook 인증은 항상 필요합니다. OpenClaw는 BlueBubbles Webhook 요청에 `channels.bluebubbles.password`와 일치하는 password/guid가 포함되어 있지 않으면(예: `?password=<password>` 또는 `x-password`) loopback/proxy 토폴로지와 관계없이 요청을 거부합니다.
- 비밀번호 인증은 전체 Webhook 본문을 읽거나 파싱하기 전에 검사됩니다.
</Warning>

## Messages.app 활성 상태 유지하기(VM / 헤드리스 설정)

일부 macOS VM / 상시 실행 환경에서는 Messages.app이 "유휴" 상태가 되어(앱을 열거나 전경으로 가져오기 전까지 수신 이벤트가 중단됨) 버릴 수 있습니다. 간단한 해결 방법은 AppleScript + LaunchAgent를 사용해 **5분마다 Messages를 건드리는 것**입니다.

<Steps>
  <Step title="AppleScript 저장">
    이를 `~/Scripts/poke-messages.scpt`로 저장합니다:

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
    이를 `~/Library/LaunchAgents/com.user.poke-messages.plist`로 저장합니다:

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

    이렇게 하면 **300초마다** 그리고 **로그인 시** 실행됩니다. 처음 실행할 때 macOS **Automation** 프롬프트(`osascript` → Messages)가 표시될 수 있습니다. LaunchAgent를 실행하는 동일한 사용자 세션에서 이를 승인하세요.

  </Step>
  <Step title="로드">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## 온보딩

BlueBubbles는 대화형 온보딩에서 사용할 수 있습니다:

```
openclaw onboard
```

마법사는 다음을 묻습니다:

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

CLI를 통해 BlueBubbles를 추가할 수도 있습니다:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## 액세스 제어(DM + 그룹)

<Tabs>
  <Tab title="DM">
    - 기본값: `channels.bluebubbles.dmPolicy = "pairing"`.
    - 알 수 없는 발신자에게는 페어링 코드가 전송되며 승인될 때까지 메시지는 무시됩니다(코드는 1시간 후 만료됨).
    - 다음을 통해 승인합니다:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - 페어링은 기본 토큰 교환 방식입니다. 자세한 내용: [페어링](/ko/channels/pairing)
  </Tab>
  <Tab title="그룹">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled`(기본값: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`은 `allowlist`가 설정된 경우 그룹에서 누가 트리거할 수 있는지 제어합니다.
  </Tab>
</Tabs>

### 연락처 이름 보강(macOS, 선택 사항)

BlueBubbles 그룹 Webhook에는 종종 원시 참가자 주소만 포함됩니다. `GroupMembers` 컨텍스트에 대신 로컬 연락처 이름이 표시되도록 하려면 macOS에서 로컬 연락처 보강을 선택적으로 사용할 수 있습니다:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true`로 조회를 활성화합니다. 기본값: `false`.
- 조회는 그룹 액세스, 명령 권한 부여, 멘션 게이팅이 메시지 통과를 허용한 후에만 실행됩니다.
- 이름이 지정되지 않은 전화 참가자만 보강됩니다.
- 로컬 일치 항목을 찾지 못한 경우 원시 전화번호가 대체값으로 유지됩니다.

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

BlueBubbles는 iMessage/WhatsApp 동작과 일치하는 그룹 채팅용 멘션 게이팅을 지원합니다:

- 멘션 감지를 위해 `agents.list[].groupChat.mentionPatterns`(또는 `messages.groupChat.mentionPatterns`)를 사용합니다.
- 그룹에 `requireMention`이 활성화되면, 에이전트는 멘션된 경우에만 응답합니다.
- 권한이 있는 발신자의 제어 명령은 멘션 게이팅을 우회합니다.

그룹별 구성:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // 모든 그룹의 기본값
        "iMessage;-;chat123": { requireMention: false }, // 특정 그룹에 대한 재정의
      },
    },
  },
}
```

### 명령 게이팅

- 제어 명령(예: `/config`, `/model`)에는 권한 부여가 필요합니다.
- 명령 권한 부여를 판단하기 위해 `allowFrom` 및 `groupAllowFrom`을 사용합니다.
- 권한이 있는 발신자는 그룹에서 멘션 없이도 제어 명령을 실행할 수 있습니다.

### 그룹별 시스템 프롬프트

`channels.bluebubbles.groups.*` 아래의 각 항목은 선택적 `systemPrompt` 문자열을 받을 수 있습니다. 이 값은 해당 그룹의 메시지를 처리하는 모든 턴에서 에이전트의 시스템 프롬프트에 주입되므로, 에이전트 프롬프트를 편집하지 않고도 그룹별 페르소나나 동작 규칙을 설정할 수 있습니다:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "응답은 3문장 이하로 유지하세요. 그룹의 캐주얼한 톤을 반영하세요.",
        },
      },
    },
  },
}
```

키는 BlueBubbles가 그룹의 `chatGuid` / `chatIdentifier` / 숫자 `chatId`로 보고하는 값과 일치하며, `"*"` 와일드카드 항목은 정확히 일치하는 항목이 없는 모든 그룹에 대한 기본값을 제공합니다(`requireMention` 및 그룹별 도구 정책과 동일한 패턴 사용). 정확히 일치하는 항목은 항상 와일드카드보다 우선합니다. DM은 이 필드를 무시하므로, 대신 에이전트 수준 또는 계정 수준 프롬프트 사용자 지정을 사용하세요.

#### 실제 예시: 스레드 답장과 탭백 반응(Private API)

BlueBubbles Private API가 활성화되면 수신 메시지는 짧은 메시지 ID(예: `[[reply_to:5]]`)와 함께 도착하며, 에이전트는 `action=reply`를 호출해 특정 메시지에 스레드로 답장하거나 `action=react`로 탭백을 남길 수 있습니다. 그룹별 `systemPrompt`는 에이전트가 올바른 도구를 선택하도록 유지하는 신뢰할 수 있는 방법입니다:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "이 그룹에서 답장할 때는 항상 컨텍스트의",
            "[[reply_to:N]] messageId와 함께 action=reply를 호출하여",
            "응답이 트리거한 메시지 아래에 스레드되도록 하세요.",
            "새로운 연결되지 않은 메시지를 보내지 마세요.",
            "",
            "짧은 확인 응답('ok', 'got it', 'on it')에는",
            "텍스트 답장을 보내는 대신 적절한 탭백 이모지(❤️, 👍, 😂, ‼️, ❓)와 함께",
            "action=react를 사용하세요.",
          ].join(" "),
        },
      },
    },
  },
}
```

탭백 반응과 스레드 답장 모두 BlueBubbles Private API가 필요합니다. 기본 동작 메커니즘은 [고급 작업](#advanced-actions) 및 [메시지 ID](#message-ids-short-vs-full)를 참조하세요.

## ACP 대화 바인딩

BlueBubbles 채팅은 전송 계층을 변경하지 않고도 지속적인 ACP 워크스페이스로 전환할 수 있습니다.

빠른 운영자 흐름:

- DM 또는 허용된 그룹 채팅 안에서 `/acp spawn codex --bind here`를 실행합니다.
- 이후 동일한 BlueBubbles 대화의 메시지는 생성된 ACP 세션으로 라우팅됩니다.
- `/new` 및 `/reset`은 동일하게 바인딩된 ACP 세션을 제자리에서 재설정합니다.
- `/acp close`는 ACP 세션을 종료하고 바인딩을 제거합니다.

구성된 지속 바인딩도 최상위 `bindings[]` 항목에서 `type: "acp"`와 `match.channel: "bluebubbles"`를 통해 지원됩니다.

`match.peer.id`에는 지원되는 모든 BlueBubbles 대상 형식을 사용할 수 있습니다:

- `+15555550123` 또는 `user@example.com` 같은 정규화된 DM 핸들
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

안정적인 그룹 바인딩에는 `chat_id:*` 또는 `chat_identifier:*`를 권장합니다.

예시:

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

공통 ACP 바인딩 동작은 [ACP 에이전트](/ko/tools/acp-agents)를 참조하세요.

## 입력 중 표시 + 읽음 확인

- **입력 중 표시**: 응답 생성 전과 생성 중에 자동으로 전송됩니다.
- **읽음 확인**: `channels.bluebubbles.sendReadReceipts`로 제어됩니다(기본값: `true`).
- **입력 중 표시**: OpenClaw는 입력 시작 이벤트를 전송하며, BlueBubbles는 전송 시점 또는 타임아웃 시 입력 중 상태를 자동으로 해제합니다(DELETE를 통한 수동 중지는 신뢰할 수 없습니다).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // 읽음 확인 비활성화
    },
  },
}
```

## 고급 작업

BlueBubbles는 설정에서 활성화하면 고급 메시지 작업을 지원합니다:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // 탭백(기본값: true)
        edit: true, // 보낸 메시지 편집(macOS 13+, macOS 26 Tahoe에서는 깨짐)
        unsend: true, // 메시지 전송 취소(macOS 13+)
        reply: true, // 메시지 GUID 기준 답장 스레드
        sendWithEffect: true, // 메시지 효과(slam, loud 등)
        renameGroup: true, // 그룹 채팅 이름 변경
        setGroupIcon: true, // 그룹 채팅 아이콘/사진 설정(macOS 26 Tahoe에서는 불안정함)
        addParticipant: true, // 그룹에 참가자 추가
        removeParticipant: true, // 그룹에서 참가자 제거
        leaveGroup: true, // 그룹 채팅 나가기
        sendAttachment: true, // 첨부 파일/미디어 전송
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="사용 가능한 작업">
    - **react**: 탭백 반응 추가/제거(`messageId`, `emoji`, `remove`). iMessage의 기본 탭백 세트는 `love`, `like`, `dislike`, `laugh`, `emphasize`, `question`입니다. 에이전트가 이 세트에 없는 이모지(예: `👀`)를 선택하면, 반응 도구는 전체 요청을 실패시키는 대신 탭백이 렌더링되도록 `love`로 대체합니다. 구성된 ack 반응은 여전히 엄격하게 검증되며 알 수 없는 값에서는 오류가 발생합니다.
    - **edit**: 보낸 메시지 편집(`messageId`, `text`).
    - **unsend**: 메시지 전송 취소(`messageId`).
    - **reply**: 특정 메시지에 답장(`messageId`, `text`, `to`).
    - **sendWithEffect**: iMessage 효과와 함께 전송(`text`, `to`, `effectId`).
    - **renameGroup**: 그룹 채팅 이름 변경(`chatGuid`, `displayName`).
    - **setGroupIcon**: 그룹 채팅 아이콘/사진 설정(`chatGuid`, `media`) — macOS 26 Tahoe에서는 불안정함(API는 성공을 반환할 수 있지만 아이콘이 동기화되지 않음).
    - **addParticipant**: 그룹에 사용자 추가(`chatGuid`, `address`).
    - **removeParticipant**: 그룹에서 사용자 제거(`chatGuid`, `address`).
    - **leaveGroup**: 그룹 채팅 나가기(`chatGuid`).
    - **upload-file**: 미디어/파일 전송(`to`, `buffer`, `filename`, `asVoice`).
      - 음성 메모: iMessage 음성 메시지로 보내려면 **MP3** 또는 **CAF** 오디오와 함께 `asVoice: true`를 설정합니다. BlueBubbles는 음성 메모 전송 시 MP3 → CAF로 변환합니다.
    - 레거시 별칭: `sendAttachment`도 계속 동작하지만, 표준 작업 이름은 `upload-file`입니다.
  </Accordion>
</AccordionGroup>

### 메시지 ID(짧은 형식 vs 전체 형식)

OpenClaw는 토큰을 절약하기 위해 _짧은_ 메시지 ID(예: `1`, `2`)를 노출할 수 있습니다.

- `MessageSid` / `ReplyToId`는 짧은 ID일 수 있습니다.
- `MessageSidFull` / `ReplyToIdFull`에는 공급자의 전체 ID가 포함됩니다.
- 짧은 ID는 메모리 내에만 존재하며, 재시작이나 캐시 제거 시 만료될 수 있습니다.
- 작업은 짧은 `messageId`와 전체 `messageId`를 모두 받을 수 있지만, 더 이상 사용할 수 없는 짧은 ID는 오류가 발생합니다.

지속적인 자동화 및 저장에는 전체 ID를 사용하세요:

- 템플릿: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- 컨텍스트: 수신 페이로드의 `MessageSidFull` / `ReplyToIdFull`

템플릿 변수는 [구성](/ko/gateway/configuration)을 참조하세요.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 분할 전송 DM 병합(하나의 작성에서 명령 + URL)

사용자가 iMessage에서 명령과 URL을 함께 입력할 때 — 예: `Dump https://example.com/article` — Apple은 이를 **서로 분리된 두 개의 Webhook 전달**로 나눕니다:

1. 텍스트 메시지(`"Dump"`).
2. OG 미리보기 이미지를 첨부 파일로 포함한 URL 미리보기 풍선(`"https://..."`).

이 두 Webhook은 대부분의 환경에서 약 0.8-2.0초 간격으로 OpenClaw에 도착합니다. 병합이 없으면 에이전트는 첫 번째 턴에서 명령만 받고, 응답하며(대개 "URL을 보내주세요"), 두 번째 턴에서야 URL을 보게 됩니다. 이 시점에는 이미 명령 컨텍스트가 사라진 상태입니다.

`channels.bluebubbles.coalesceSameSenderDms`는 DM에서 같은 발신자가 연속으로 보낸 Webhook을 하나의 에이전트 턴으로 병합하도록 설정합니다. 그룹 채팅은 다중 사용자 턴 구조를 보존하기 위해 계속 메시지별로 키가 지정됩니다.

<Tabs>
  <Tab title="활성화해야 하는 경우">
    다음에 해당하면 활성화하세요:

    - 하나의 메시지에서 `명령 + 페이로드`를 기대하는 Skills를 제공하는 경우(dump, paste, save, queue 등).
    - 사용자가 명령과 함께 URL, 이미지 또는 긴 콘텐츠를 붙여 넣는 경우.
    - DM 턴 지연 증가를 감수할 수 있는 경우(아래 참조).

    다음에 해당하면 비활성화된 상태로 두세요:

    - 단일 단어 DM 트리거에 대해 최소 지연 시간이 필요한 경우.
    - 모든 흐름이 페이로드 후속 입력이 없는 원샷 명령인 경우.

  </Tab>
  <Tab title="활성화">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in(기본값: false)
        },
      },
    }
    ```

    이 플래그가 켜져 있고 명시적인 `messages.inbound.byChannel.bluebubbles`가 없으면 디바운스 창이 **2500ms**로 넓어집니다(병합하지 않는 경우 기본값은 500ms). 더 넓은 창이 필요한 이유는 Apple의 분할 전송 간격 0.8-2.0초가 더 좁은 기본값에 들어맞지 않기 때문입니다.

    직접 창을 조정하려면:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500ms는 대부분의 환경에서 동작합니다. Mac이 느리거나
            // 메모리 압박을 받는 경우(이때 관측된 간격이 2초를 넘길 수 있음)
            // 4000ms까지 높이세요.
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="트레이드오프">
    - **DM 제어 명령의 지연 증가.** 이 플래그가 켜지면 DM 제어 명령 메시지(`Dump`, `Save` 등)는 이제 페이로드 Webhook이 뒤따를 가능성에 대비해 디바운스 창만큼 대기한 뒤 디스패치됩니다. 그룹 채팅 명령은 즉시 디스패치 상태를 유지합니다.
    - **병합된 출력에는 한계가 있습니다** — 병합된 텍스트는 4000자로 제한되며 명시적인 `…[truncated]` 마커가 붙습니다. 첨부 파일은 20개, 소스 항목은 10개로 제한됩니다(이를 초과하면 첫 항목과 최신 항목 유지). 각 소스 `messageId`는 여전히 inbound-dedupe에 전달되므로, 이후 개별 이벤트에 대한 MessagePoller 재생이 발생해도 중복으로 인식됩니다.
    - **채널별 opt-in.** 다른 채널(Telegram, WhatsApp, Slack, …)은 영향을 받지 않습니다.
  </Tab>
</Tabs>

### 시나리오와 에이전트가 보는 내용

| 사용자가 작성한 내용                                               | Apple 전달 방식          | 플래그 꺼짐(기본값)                     | 플래그 켜짐 + 2500ms 창                                                   |
| ------------------------------------------------------------------ | ------------------------ | --------------------------------------- | ------------------------------------------------------------------------- |
| `Dump https://example.com`(한 번에 전송)                           | 약 1초 간격의 2개 Webhook | 에이전트 턴 2개: `"Dump"`만 먼저, затем URL | 한 턴: 병합된 텍스트 `Dump https://example.com`                           |
| `Save this 📎image.jpg caption`(첨부 파일 + 텍스트)                | 2개 Webhook              | 두 턴                                   | 한 턴: 텍스트 + 이미지                                                    |
| `/status`(독립 실행형 명령)                                        | 1개 Webhook              | 즉시 디스패치                           | **창 시간까지 대기 후 디스패치**                                          |
| URL만 붙여 넣음                                                    | 1개 Webhook              | 즉시 디스패치                           | 즉시 디스패치(버킷에 항목 1개뿐임)                                        |
| 텍스트 + URL을 몇 분 간격으로 의도적으로 별도 전송                | 창 밖의 2개 Webhook      | 두 턴                                   | 두 턴(사이에 창이 만료됨)                                                 |
| 빠른 연속 전송(창 안에 10개 초과의 작은 DM)                       | N개 Webhook              | N개 턴                                  | 한 턴, 제한된 출력 적용(첫 항목 + 최신 항목, 텍스트/첨부 파일 상한 적용) |

### 분할 전송 병합 문제 해결

플래그가 켜져 있는데도 분할 전송이 여전히 두 턴으로 도착한다면, 각 계층을 확인하세요:

<AccordionGroup>
  <Accordion title="구성이 실제로 로드되었는지">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    그런 다음 `openclaw gateway restart`를 실행하세요 — 이 플래그는 debouncer-registry 생성 시 읽힙니다.

  </Accordion>
  <Accordion title="환경에 충분한 디바운스 창인지">
    `~/Library/Logs/bluebubbles-server/main.log` 아래의 BlueBubbles 서버 로그를 확인하세요:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    `"Dump"` 스타일 텍스트 디스패치와 뒤이어 오는 `"https://..."; Attachments:` 디스패치 사이의 간격을 측정하세요. 그 간격을 여유 있게 포함하도록 `messages.inbound.byChannel.bluebubbles`를 높이세요.

  </Accordion>
  <Accordion title="세션 JSONL 타임스탬프 ≠ Webhook 도착 시각">
    세션 이벤트 타임스탬프(`~/.openclaw/agents/<id>/sessions/*.jsonl`)는 Webhook이 도착한 시각이 아니라, Gateway가 메시지를 에이전트에 전달한 시각을 반영합니다. `[Queued messages while agent was busy]`가 붙은 대기 중인 두 번째 메시지는 첫 번째 턴이 아직 실행 중일 때 두 번째 Webhook이 도착했다는 뜻입니다 — 병합 버킷은 이미 플러시된 상태입니다. 세션 로그가 아니라 BB 서버 로그를 기준으로 창을 조정하세요.
  </Accordion>
  <Accordion title="응답 디스패치를 늦추는 메모리 압박">
    더 작은 머신(8GB)에서는 에이전트 턴이 오래 걸려 병합 버킷이 응답 완료 전에 플러시되고, URL이 대기 중인 두 번째 턴으로 들어갈 수 있습니다. `memory_pressure`와 `ps -o rss -p $(pgrep openclaw-gateway)`를 확인하세요. Gateway RSS가 약 500MB를 넘고 compressor가 활성 상태라면, 다른 무거운 프로세스를 종료하거나 더 큰 호스트로 옮기세요.
  </Accordion>
  <Accordion title="답장 인용 전송은 다른 경로입니다">
    사용자가 기존 URL 풍선에 대한 **답장**으로 `Dump`를 탭했다면(iMessage에서 Dump 버블에 "1 Reply" 배지가 표시됨), URL은 두 번째 Webhook이 아니라 `replyToBody`에 들어 있습니다. 병합은 적용되지 않습니다 — 이는 debouncer 문제가 아니라 Skill/프롬프트 문제입니다.
  </Accordion>
</AccordionGroup>

## 블록 스트리밍

응답을 단일 메시지로 보낼지, 블록 단위로 스트리밍할지 제어합니다:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // 블록 스트리밍 활성화(기본적으로 꺼짐)
    },
  },
}
```

## 미디어 + 제한

- 수신 첨부 파일은 다운로드되어 미디어 캐시에 저장됩니다.
- 수신 및 발신 미디어의 미디어 상한은 `channels.bluebubbles.mediaMaxMb`로 설정합니다(기본값: 8MB).
- 발신 텍스트는 `channels.bluebubbles.textChunkLimit` 기준으로 분할됩니다(기본값: 4000자).

## 구성 참조

전체 구성: [구성](/ko/gateway/configuration)

<AccordionGroup>
  <Accordion title="연결 및 Webhook">
    - `channels.bluebubbles.enabled`: 채널 활성화/비활성화.
    - `channels.bluebubbles.serverUrl`: BlueBubbles REST API 기본 URL.
    - `channels.bluebubbles.password`: API 비밀번호.
    - `channels.bluebubbles.webhookPath`: Webhook 엔드포인트 경로(기본값: `/bluebubbles-webhook`).
  </Accordion>
  <Accordion title="액세스 정책">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled`(기본값: `pairing`).
    - `channels.bluebubbles.allowFrom`: DM 허용 목록(핸들, 이메일, E.164 번호, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled`(기본값: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: 그룹 발신자 허용 목록.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOS에서 게이팅 통과 후 이름 없는 그룹 참가자를 로컬 연락처 정보로 선택적으로 보강합니다. 기본값: `false`.
    - `channels.bluebubbles.groups`: 그룹별 구성(`requireMention` 등).
  </Accordion>
  <Accordion title="전달 및 청크 분할">
    - `channels.bluebubbles.sendReadReceipts`: 읽음 확인 전송(기본값: `true`).
    - `channels.bluebubbles.blockStreaming`: 블록 스트리밍 활성화(기본값: `false`; 스트리밍 답장에 필요).
    - `channels.bluebubbles.textChunkLimit`: 발신 청크 크기(문자 수 기준, 기본값: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: `/api/v1/message/text`를 통한 발신 텍스트 전송의 요청별 타임아웃(ms 단위, 기본값: 30000). macOS 26 환경에서 Private API iMessage 전송이 iMessage 프레임워크 내부에서 60초 이상 멈출 수 있으므로 이 값을 높이세요. 예: `45000` 또는 `60000`. 프로브, 채팅 조회, 반응, 편집, 상태 확인은 현재 더 짧은 10초 기본값을 유지합니다. 반응과 편집까지 범위를 넓히는 작업은 후속으로 계획되어 있습니다. 계정별 재정의: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length`(기본값)는 `textChunkLimit`를 초과할 때만 분할합니다. `newline`은 길이 기준 분할 전에 빈 줄(문단 경계)에서 분할합니다.
  </Accordion>
  <Accordion title="미디어 및 기록">
    - `channels.bluebubbles.mediaMaxMb`: 수신/발신 미디어 상한(MB 단위, 기본값: 8).
    - `channels.bluebubbles.mediaLocalRoots`: 발신 로컬 미디어 경로에 허용되는 절대 로컬 디렉터리의 명시적 허용 목록입니다. 이를 구성하지 않으면 로컬 경로 전송은 기본적으로 거부됩니다. 계정별 재정의: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: 같은 발신자의 연속된 DM Webhook을 하나의 에이전트 턴으로 병합하여 Apple의 텍스트+URL 분할 전송이 단일 메시지로 도착하도록 합니다(기본값: `false`). 시나리오, 창 조정, 트레이드오프는 [분할 전송 DM 병합](#coalescing-split-send-dms-command--url-in-one-composition)을 참조하세요. 명시적인 `messages.inbound.byChannel.bluebubbles` 없이 활성화하면 기본 수신 디바운스 창이 500ms에서 2500ms로 넓어집니다.
    - `channels.bluebubbles.historyLimit`: 컨텍스트용 최대 그룹 메시지 수(0이면 비활성화).
    - `channels.bluebubbles.dmHistoryLimit`: DM 기록 제한.
  </Accordion>
  <Accordion title="작업 및 계정">
    - `channels.bluebubbles.actions`: 특정 작업 활성화/비활성화.
    - `channels.bluebubbles.accounts`: 다중 계정 구성.
  </Accordion>
</AccordionGroup>

관련 전역 옵션:

- `agents.list[].groupChat.mentionPatterns`(또는 `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## 주소 지정 / 전달 대상

안정적인 라우팅을 위해 `chat_guid` 사용을 권장합니다:

- `chat_guid:iMessage;-;+15555550123`(그룹에 권장)
- `chat_id:123`
- `chat_identifier:...`
- 직접 핸들: `+15555550123`, `user@example.com`
  - 직접 핸들에 기존 DM 채팅이 없으면 OpenClaw는 `POST /api/v1/chat/new`를 통해 새 채팅을 생성합니다. 이를 사용하려면 BlueBubbles Private API가 활성화되어 있어야 합니다.

### iMessage vs SMS 라우팅

같은 핸들에 대해 Mac에 iMessage 채팅과 SMS 채팅이 모두 있는 경우(예: iMessage 등록된 전화번호지만 녹색 버블 대체 전송도 받은 경우), OpenClaw는 iMessage 채팅을 우선 사용하며 절대로 조용히 SMS로 다운그레이드하지 않습니다. SMS 채팅을 강제로 사용하려면 명시적인 `sms:` 대상 접두사를 사용하세요(예: `sms:+15555550123`). 일치하는 iMessage 채팅이 없는 핸들은 BlueBubbles가 보고하는 채팅을 통해 그대로 전송됩니다.

## 보안

- Webhook 요청은 `guid`/`password` 쿼리 매개변수 또는 헤더를 `channels.bluebubbles.password`와 비교하여 인증됩니다.
- API 비밀번호와 Webhook 엔드포인트는 비밀로 유지하세요(자격 증명처럼 취급).
- BlueBubbles Webhook 인증에는 localhost 우회가 없습니다. Webhook 트래픽을 프록시한다면 요청 전체 경로에서 BlueBubbles 비밀번호를 유지하세요. 여기서는 `gateway.trustedProxies`가 `channels.bluebubbles.password`를 대체하지 않습니다. [Gateway 보안](/ko/gateway/security#reverse-proxy-configuration)을 참조하세요.
- LAN 외부에 노출하는 경우 BlueBubbles 서버에서 HTTPS + 방화벽 규칙을 활성화하세요.

## 문제 해결

- 입력 중 표시/읽음 이벤트가 작동하지 않으면 BlueBubbles Webhook 로그를 확인하고 Gateway 경로가 `channels.bluebubbles.webhookPath`와 일치하는지 검증하세요.
- 페어링 코드는 1시간 후 만료됩니다. `openclaw pairing list bluebubbles`와 `openclaw pairing approve bluebubbles <code>`를 사용하세요.
- 반응에는 BlueBubbles Private API(`POST /api/v1/message/react`)가 필요합니다. 서버 버전이 이를 제공하는지 확인하세요.
- 편집/전송 취소에는 macOS 13+와 호환되는 BlueBubbles 서버 버전이 필요합니다. macOS 26(Tahoe)에서는 Private API 변경으로 인해 현재 편집 기능이 깨져 있습니다.
- 그룹 아이콘 업데이트는 macOS 26(Tahoe)에서 불안정할 수 있습니다. API는 성공을 반환하더라도 새 아이콘이 동기화되지 않을 수 있습니다.
- OpenClaw는 BlueBubbles 서버의 macOS 버전을 기준으로 알려진 오작동 작업을 자동으로 숨깁니다. macOS 26(Tahoe)에서 여전히 편집이 표시되면 `channels.bluebubbles.actions.edit=false`로 수동 비활성화하세요.
- `coalesceSameSenderDms`를 활성화했는데도 분할 전송(예: `Dump` + URL)이 여전히 두 턴으로 도착한다면 [분할 전송 병합 문제 해결](#split-send-coalescing-troubleshooting) 체크리스트를 확인하세요. 흔한 원인은 너무 짧은 디바운스 창, 세션 로그 타임스탬프를 Webhook 도착 시각으로 오해한 경우, 또는 답장 인용 전송(`replyToBody`를 사용하며 두 번째 Webhook이 아님)입니다.
- 상태/헬스 정보는 `openclaw status --all` 또는 `openclaw status --deep`를 사용하세요.

일반적인 채널 워크플로 참조는 [채널](/ko/channels) 및 [Plugins](/ko/tools/plugin) 가이드를 확인하세요.

## 관련 항목

- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [보안](/ko/gateway/security) — 액세스 모델 및 강화
