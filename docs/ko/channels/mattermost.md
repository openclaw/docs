---
read_when:
    - Mattermost 설정하기
    - Mattermost 라우팅 디버깅하기
sidebarTitle: Mattermost
summary: Mattermost 봇 설정 및 OpenClaw 구성
title: Mattermost
x-i18n:
    generated_at: "2026-04-26T11:23:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22916fcff2eeccf53055f2ebf60fc621d595991d0ca4cd148015b61cce09c52f
    source_path: channels/mattermost.md
    workflow: 15
---

상태: 번들된 Plugin(bot token + WebSocket 이벤트). 채널, 그룹, DM이 지원됩니다. Mattermost는 자체 호스팅 가능한 팀 메시징 플랫폼입니다. 제품 세부 정보와 다운로드는 공식 사이트 [mattermost.com](https://mattermost.com)을 참조하세요.

## 번들된 Plugin

<Note>
Mattermost는 현재 OpenClaw 릴리스에 번들된 Plugin으로 제공되므로, 일반적인 패키지 빌드에서는 별도 설치가 필요하지 않습니다.
</Note>

오래된 빌드 또는 Mattermost가 제외된 사용자 지정 설치를 사용하는 경우에는 수동으로 설치하세요:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="로컬 체크아웃">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

자세한 내용: [Plugins](/ko/tools/plugin)

## 빠른 설정

<Steps>
  <Step title="Plugin 사용 가능 여부 확인">
    현재 패키지된 OpenClaw 릴리스에는 이미 번들되어 있습니다. 오래되었거나 사용자 지정 설치의 경우 위 명령으로 수동 추가할 수 있습니다.
  </Step>
  <Step title="Mattermost 봇 생성">
    Mattermost 봇 계정을 만들고 **bot token**을 복사합니다.
  </Step>
  <Step title="base URL 복사">
    Mattermost **base URL**을 복사합니다(예: `https://chat.example.com`).
  </Step>
  <Step title="OpenClaw를 구성하고 Gateway 시작">
    최소 구성:

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

  </Step>
</Steps>

## 네이티브 슬래시 명령

네이티브 슬래시 명령은 옵트인입니다. 활성화하면 OpenClaw가 Mattermost API를 통해 `oc_*` 슬래시 명령을 등록하고, Gateway HTTP 서버에서 콜백 POST를 수신합니다.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Mattermost가 Gateway에 직접 도달할 수 없는 경우에 사용합니다(리버스 프록시/공개 URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="동작 참고 사항">
    - `native: "auto"`는 Mattermost에서 기본적으로 비활성화됩니다. 활성화하려면 `native: true`로 설정하세요.
    - `callbackUrl`을 생략하면 OpenClaw가 Gateway host/port와 `callbackPath`를 기반으로 URL을 파생합니다.
    - 다중 계정 설정에서는 `commands`를 최상위 수준이나 `channels.mattermost.accounts.<id>.commands` 아래에 설정할 수 있습니다(계정 값이 최상위 필드를 재정의함).
    - 명령 콜백은 OpenClaw가 `oc_*` 명령을 등록할 때 Mattermost가 반환한 명령별 토큰으로 검증됩니다.
    - 슬래시 콜백은 등록 실패, 부분 시작, 또는 콜백 토큰이 등록된 명령 중 하나와 일치하지 않는 경우 fail closed 방식으로 동작합니다.
  </Accordion>
  <Accordion title="도달 가능성 요구 사항">
    콜백 엔드포인트는 Mattermost 서버에서 도달 가능해야 합니다.

    - Mattermost가 OpenClaw와 동일한 호스트/네트워크 네임스페이스에서 실행되지 않는 한 `callbackUrl`을 `localhost`로 설정하지 마세요.
    - 해당 URL이 `/api/channels/mattermost/command`를 OpenClaw로 리버스 프록시하지 않는 한 `callbackUrl`을 Mattermost base URL로 설정하지 마세요.
    - 빠른 확인 방법은 `curl https://<gateway-host>/api/channels/mattermost/command`입니다. GET 요청은 `404`가 아니라 OpenClaw에서 `405 Method Not Allowed`를 반환해야 합니다.

  </Accordion>
  <Accordion title="Mattermost 송신 allowlist">
    콜백 대상이 private/tailnet/internal 주소인 경우 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`를 설정해 콜백 host/domain을 포함하세요.

    전체 URL이 아니라 host/domain 항목을 사용하세요.

    - 좋음: `gateway.tailnet-name.ts.net`
    - 나쁨: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 환경 변수(기본 계정)

환경 변수를 선호한다면 Gateway 호스트에서 다음을 설정하세요:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
환경 변수는 **기본** 계정(`default`)에만 적용됩니다. 다른 계정은 반드시 구성 값을 사용해야 합니다.

`MATTERMOST_URL`은 워크스페이스 `.env`에서 설정할 수 없습니다. [Workspace `.env` files](/ko/gateway/security)을 참조하세요.
</Note>

## 채팅 모드

Mattermost는 DM에 자동으로 응답합니다. 채널 동작은 `chatmode`로 제어합니다:

<Tabs>
  <Tab title="oncall (기본값)">
    채널에서 @멘션될 때만 응답합니다.
  </Tab>
  <Tab title="onmessage">
    모든 채널 메시지에 응답합니다.
  </Tab>
  <Tab title="onchar">
    메시지가 트리거 접두사로 시작할 때 응답합니다.
  </Tab>
</Tabs>

구성 예시:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

참고:

- `onchar`는 명시적인 @멘션에도 계속 응답합니다.
- `channels.mattermost.requireMention`은 레거시 구성에서 존중되지만 `chatmode` 사용이 권장됩니다.

## 스레딩 및 세션

`channels.mattermost.replyToMode`를 사용해 채널 및 그룹 응답이 메인 채널에 유지될지, 트리거한 게시물 아래의 스레드로 시작될지를 제어합니다.

- `off`(기본값): 수신 게시물이 이미 스레드에 있는 경우에만 스레드로 응답합니다.
- `first`: 최상위 채널/그룹 게시물의 경우 해당 게시물 아래에 스레드를 시작하고, 대화를 스레드 범위 세션으로 라우팅합니다.
- `all`: 현재 Mattermost에서는 `first`와 동일하게 동작합니다.
- DM은 이 설정을 무시하고 비스레드 상태로 유지됩니다.

구성 예시:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

참고:

- 스레드 범위 세션은 트리거한 게시물 ID를 스레드 루트로 사용합니다.
- Mattermost에 스레드 루트가 생기면 후속 청크와 미디어가 동일한 스레드에서 계속되므로 현재는 `first`와 `all`이 동일합니다.

## 접근 제어(DM)

- 기본값: `channels.mattermost.dmPolicy = "pairing"`(알 수 없는 발신자는 pairing 코드를 받음)
- 승인 방법:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 공개 DM: `channels.mattermost.dmPolicy="open"` 및 `channels.mattermost.allowFrom=["*"]`.

## 채널(그룹)

- 기본값: `channels.mattermost.groupPolicy = "allowlist"`(멘션 게이트 적용).
- `channels.mattermost.groupAllowFrom`으로 발신자를 allowlist에 추가하세요(사용자 ID 권장).
- 채널별 멘션 재정의는 `channels.mattermost.groups.<channelId>.requireMention` 또는 기본값용 `channels.mattermost.groups["*"].requireMention` 아래에 있습니다.
- `@username` 매칭은 변경 가능하며 `channels.mattermost.dangerouslyAllowNameMatching: true`일 때만 활성화됩니다.
- 공개 채널: `channels.mattermost.groupPolicy="open"`(멘션 게이트 적용).
- 런타임 참고: `channels.mattermost`가 완전히 없으면 런타임은 그룹 검사에 대해 `groupPolicy="allowlist"`로 폴백합니다(`channels.defaults.groupPolicy`가 설정되어 있어도 마찬가지).

예시:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## 아웃바운드 전달 대상

`openclaw message send` 또는 Cron/Webhook과 함께 다음 대상 형식을 사용하세요:

- 채널에는 `channel:<id>`
- DM에는 `user:<id>`
- DM에는 `@username`(Mattermost API를 통해 확인됨)

<Warning>
접두사 없는 불투명 ID(예: `64ifufp...`)는 Mattermost에서 **모호**합니다(사용자 ID인지 채널 ID인지 구분되지 않음).

OpenClaw는 이를 **사용자 우선**으로 확인합니다:

- ID가 사용자로 존재하면(`GET /api/v4/users/<id>` 성공), OpenClaw는 `/api/v4/channels/direct`를 통해 직접 채널을 확인하여 **DM**을 보냅니다.
- 그렇지 않으면 해당 ID는 **채널 ID**로 처리됩니다.

결정적인 동작이 필요하다면 항상 명시적 접두사(`user:<id>` / `channel:<id>`)를 사용하세요.
</Warning>

## DM 채널 재시도

OpenClaw가 Mattermost DM 대상으로 전송할 때 먼저 직접 채널을 확인해야 하는 경우, 기본적으로 일시적인 직접 채널 생성 실패를 재시도합니다.

Mattermost Plugin 전체에 대해 전역으로 동작을 조정하려면 `channels.mattermost.dmChannelRetry`를 사용하고, 특정 계정 하나에 대해서는 `channels.mattermost.accounts.<id>.dmChannelRetry`를 사용하세요.

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

참고:

- 이는 모든 Mattermost API 호출이 아니라 DM 채널 생성(`/api/v4/channels/direct`)에만 적용됩니다.
- 재시도는 속도 제한, 5xx 응답, 네트워크 또는 타임아웃 오류 같은 일시적 실패에 적용됩니다.
- `429`를 제외한 4xx 클라이언트 오류는 영구 오류로 처리되며 재시도하지 않습니다.

## 미리보기 스트리밍

Mattermost는 생각 과정, 도구 활동, 부분 응답 텍스트를 하나의 **초안 미리보기 게시물**로 스트리밍하고, 최종 답변을 안전하게 보낼 수 있을 때 해당 위치에서 마무리합니다. 미리보기는 청크마다 새 메시지를 채널에 쏟아내는 대신 동일한 게시물 ID에서 업데이트됩니다. 미디어/오류 최종 응답은 대기 중인 미리보기 편집을 취소하고, 일회성 미리보기 게시물을 플러시하는 대신 일반 전달을 사용합니다.

`channels.mattermost.streaming`으로 활성화하세요:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="스트리밍 모드">
    - `partial`이 일반적인 선택입니다. 하나의 미리보기 게시물이 응답이 늘어남에 따라 편집되고, 이후 전체 답변으로 마무리됩니다.
    - `block`은 미리보기 게시물 안에서 추가형 초안 청크를 사용합니다.
    - `progress`는 생성 중 상태 미리보기를 표시하고 완료 시 최종 답변만 게시합니다.
    - `off`는 미리보기 스트리밍을 비활성화합니다.
  </Accordion>
  <Accordion title="스트리밍 동작 참고 사항">
    - 스트림을 해당 위치에서 마무리할 수 없으면(예: 스트리밍 도중 게시물이 삭제된 경우) OpenClaw는 새 최종 게시물을 보내는 방식으로 폴백하므로 응답이 유실되지 않습니다.
    - 추론 전용 페이로드는 채널 게시물에서 숨겨지며, `> Reasoning:` 블록 인용문으로 도착하는 텍스트도 포함됩니다. 다른 표면에서 생각 과정을 보려면 `/reasoning on`을 설정하세요. Mattermost 최종 게시물에는 답변만 유지됩니다.
    - 채널 매핑 매트릭스는 [Streaming](/ko/concepts/streaming#preview-streaming-modes)을 참조하세요.
  </Accordion>
</AccordionGroup>

## 리액션(message 도구)

- `channel=mattermost`와 함께 `message action=react`를 사용하세요.
- `messageId`는 Mattermost 게시물 ID입니다.
- `emoji`는 `thumbsup` 또는 `:+1:` 같은 이름을 받습니다(콜론은 선택 사항).
- 리액션을 제거하려면 `remove=true`(boolean)를 설정하세요.
- 리액션 추가/제거 이벤트는 라우팅된 에이전트 세션으로 시스템 이벤트로 전달됩니다.

예시:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

구성:

- `channels.mattermost.actions.reactions`: 리액션 작업 활성화/비활성화(기본값 true)
- 계정별 재정의: `channels.mattermost.accounts.<id>.actions.reactions`.

## 대화형 버튼(message 도구)

클릭 가능한 버튼이 포함된 메시지를 보냅니다. 사용자가 버튼을 클릭하면 에이전트가 선택값을 받아 응답할 수 있습니다.

채널 기능에 `inlineButtons`를 추가하여 버튼을 활성화하세요:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

`buttons` 매개변수와 함께 `message action=send`를 사용하세요. 버튼은 2차원 배열입니다(버튼 행들):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

버튼 필드:

<ParamField path="text" type="string" required>
  표시 레이블.
</ParamField>
<ParamField path="callback_data" type="string" required>
  클릭 시 다시 전송되는 값입니다(작업 ID로 사용됨).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  버튼 스타일.
</ParamField>

사용자가 버튼을 클릭하면:

<Steps>
  <Step title="확인 메시지로 버튼 대체">
    모든 버튼이 확인 문구로 대체됩니다(예: "✓ **Yes** selected by @user").
  </Step>
  <Step title="에이전트가 선택값 수신">
    에이전트가 선택값을 인바운드 메시지로 받아 응답합니다.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="구현 참고 사항">
    - 버튼 콜백은 HMAC-SHA256 검증을 사용합니다(자동, 별도 구성 불필요).
    - Mattermost는 API 응답에서 callback data를 제거합니다(보안 기능). 따라서 버튼 클릭 시 모든 버튼이 제거되며, 일부만 제거하는 것은 불가능합니다.
    - 하이픈 또는 밑줄이 포함된 작업 ID는 자동으로 정리됩니다(Mattermost 라우팅 제한).
  </Accordion>
  <Accordion title="구성 및 도달 가능성">
    - `channels.mattermost.capabilities`: 기능 문자열 배열입니다. 에이전트 시스템 프롬프트에서 버튼 도구 설명을 활성화하려면 `"inlineButtons"`를 추가하세요.
    - `channels.mattermost.interactions.callbackBaseUrl`: 버튼 콜백용 선택적 외부 base URL입니다(예: `https://gateway.example.com`). Mattermost가 bind host에서 Gateway에 직접 도달할 수 없을 때 사용합니다.
    - 다중 계정 설정에서는 동일한 필드를 `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 아래에도 설정할 수 있습니다.
    - `interactions.callbackBaseUrl`이 생략되면 OpenClaw는 `gateway.customBindHost` + `gateway.port`에서 콜백 URL을 파생하고, 그다음 `http://localhost:<port>`로 폴백합니다.
    - 도달 가능성 규칙: 버튼 콜백 URL은 Mattermost 서버에서 도달 가능해야 합니다. `localhost`는 Mattermost와 OpenClaw가 동일한 호스트/네트워크 네임스페이스에서 실행될 때만 작동합니다.
    - 콜백 대상이 private/tailnet/internal인 경우 해당 host/domain을 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`에 추가하세요.
  </Accordion>
</AccordionGroup>

### 직접 API 통합(외부 스크립트)

외부 스크립트와 Webhook은 에이전트의 `message` 도구를 거치지 않고 Mattermost REST API를 통해 직접 버튼을 게시할 수 있습니다. 가능하면 Plugin의 `buildButtonAttachments()`를 사용하세요. 원시 JSON을 직접 게시하는 경우 다음 규칙을 따르세요:

**페이로드 구조:**

```json5
{
  channel_id: "<channelId>",
  message: "옵션을 선택하세요:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // 영숫자만 허용 — 아래 참조
            type: "button", // 필수, 없으면 클릭이 조용히 무시됨
            name: "Approve", // 표시 레이블
            style: "primary", // 선택 사항: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // 버튼 id와 일치해야 함(이름 조회용)
                action: "approve",
                // ... 사용자 지정 필드 ...
                _token: "<hmac>", // 아래 HMAC 섹션 참조
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**중요 규칙**

1. 첨부 파일은 최상위 `attachments`가 아니라 `props.attachments`에 들어가야 합니다(그렇지 않으면 조용히 무시됨).
2. 모든 작업에는 `type: "button"`이 필요합니다. 없으면 클릭이 조용히 무시됩니다.
3. 모든 작업에는 `id` 필드가 필요합니다. Mattermost는 ID 없는 작업을 무시합니다.
4. 작업 `id`는 **영숫자만** 허용됩니다(`[a-zA-Z0-9]`). 하이픈과 밑줄은 Mattermost 서버 측 작업 라우팅을 깨뜨립니다(404 반환). 사용 전에 제거하세요.
5. 확인 메시지에 원시 ID 대신 버튼 이름(예: "Approve")이 표시되도록 `context.action_id`는 버튼의 `id`와 일치해야 합니다.
6. `context.action_id`는 필수입니다. 없으면 interaction 핸들러가 400을 반환합니다.
</Warning>

**HMAC 토큰 생성**

Gateway는 HMAC-SHA256으로 버튼 클릭을 검증합니다. 외부 스크립트는 Gateway 검증 로직과 일치하는 토큰을 생성해야 합니다:

<Steps>
  <Step title="bot token에서 secret 파생">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="context 객체 구성">
    `_token`을 제외한 모든 필드로 context 객체를 구성합니다.
  </Step>
  <Step title="정렬된 키로 직렬화">
    **정렬된 키**와 **공백 없음**으로 직렬화합니다(Gateway는 정렬된 키에 `JSON.stringify`를 사용하며, 압축된 출력을 생성함).
  </Step>
  <Step title="페이로드 서명">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="토큰 추가">
    결과 hex digest를 context의 `_token`으로 추가합니다.
  </Step>
</Steps>

Python 예시:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="일반적인 HMAC 함정">
    - Python의 `json.dumps`는 기본적으로 공백을 추가합니다(`{"key": "val"}`). JavaScript의 압축 출력(`{"key":"val"}`)과 맞추려면 `separators=(",", ":")`를 사용하세요.
    - 항상 **모든** context 필드(`_token` 제외)에 서명하세요. Gateway는 `_token`을 제거한 뒤 남은 모든 항목에 서명합니다. 일부만 서명하면 조용한 검증 실패가 발생합니다.
    - `sort_keys=True`를 사용하세요. Gateway는 서명 전에 키를 정렬하며, Mattermost가 페이로드를 저장할 때 context 필드 순서를 바꿀 수 있습니다.
    - 임의의 바이트가 아니라 bot token에서 secret을 파생하세요(결정적 방식). 버튼을 생성하는 프로세스와 이를 검증하는 Gateway에서 동일한 secret을 사용해야 합니다.
  </Accordion>
</AccordionGroup>

## 디렉터리 어댑터

Mattermost Plugin에는 Mattermost API를 통해 채널 및 사용자 이름을 확인하는 디렉터리 어댑터가 포함되어 있습니다. 이를 통해 `openclaw message send` 및 Cron/Webhook 전달에서 `#channel-name` 및 `@username` 대상을 사용할 수 있습니다.

별도 구성은 필요하지 않습니다. 어댑터는 계정 구성의 bot token을 사용합니다.

## 다중 계정

Mattermost는 `channels.mattermost.accounts` 아래에서 여러 계정을 지원합니다:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## 문제 해결

<AccordionGroup>
  <Accordion title="채널에서 응답이 없음">
    봇이 채널에 들어와 있는지 확인하고 멘션하세요(oncall). 또는 트리거 접두사를 사용하거나 `chatmode: "onmessage"`로 설정하세요.
  </Accordion>
  <Accordion title="인증 또는 다중 계정 오류">
    - bot token, base URL, 계정 활성화 여부를 확인하세요.
    - 다중 계정 문제: 환경 변수는 `default` 계정에만 적용됩니다.
  </Accordion>
  <Accordion title="네이티브 슬래시 명령 실패">
    - `Unauthorized: invalid command token.`: OpenClaw가 콜백 토큰을 수락하지 않았습니다. 일반적인 원인:
      - 시작 시 슬래시 명령 등록이 실패했거나 부분적으로만 완료됨
      - 콜백이 잘못된 Gateway/계정으로 전달됨
      - Mattermost에 이전 콜백 대상을 가리키는 오래된 명령이 여전히 남아 있음
      - Gateway가 슬래시 명령을 다시 활성화하지 않은 채 재시작됨
    - 네이티브 슬래시 명령이 작동을 멈췄다면 로그에서 `mattermost: failed to register slash commands` 또는 `mattermost: native slash commands enabled but no commands could be registered`를 확인하세요.
    - `callbackUrl`이 생략되었고 로그에 콜백이 `http://127.0.0.1:18789/...`로 확인되었다는 경고가 있다면, 해당 URL은 Mattermost가 OpenClaw와 동일한 호스트/네트워크 네임스페이스에서 실행될 때만 도달 가능할 가능성이 큽니다. 대신 외부에서 도달 가능한 `commands.callbackUrl`을 명시적으로 설정하세요.
  </Accordion>
  <Accordion title="버튼 관련 문제">
    - 버튼이 흰 상자로 보임: 에이전트가 잘못된 버튼 데이터를 보내고 있을 수 있습니다. 각 버튼에 `text`와 `callback_data` 필드가 모두 있는지 확인하세요.
    - 버튼은 렌더링되지만 클릭해도 아무 반응이 없음: Mattermost 서버 구성에서 `AllowedUntrustedInternalConnections`에 `127.0.0.1 localhost`가 포함되어 있는지, `ServiceSettings`에서 `EnablePostActionIntegration`이 `true`인지 확인하세요.
    - 버튼 클릭 시 404 반환: 버튼 `id`에 하이픈이나 밑줄이 포함되어 있을 가능성이 큽니다. Mattermost의 작업 라우터는 영숫자가 아닌 ID에서 깨집니다. `[a-zA-Z0-9]`만 사용하세요.
    - Gateway 로그에 `invalid _token`: HMAC 불일치입니다. 모든 context 필드(일부가 아닌 전체)에 서명했는지, 키를 정렬했는지, 압축 JSON(공백 없음)을 사용했는지 확인하세요. 위의 HMAC 섹션을 참조하세요.
    - Gateway 로그에 `missing _token in context`: `_token` 필드가 버튼의 context에 없습니다. integration 페이로드를 구성할 때 포함되었는지 확인하세요.
    - 확인 메시지에 버튼 이름 대신 원시 ID가 표시됨: `context.action_id`가 버튼의 `id`와 일치하지 않습니다. 둘 다 동일한 정리된 값으로 설정하세요.
    - 에이전트가 버튼을 인식하지 못함: Mattermost 채널 구성에 `capabilities: ["inlineButtons"]`를 추가하세요.
  </Accordion>
</AccordionGroup>

## 관련

- [채널 라우팅](/ko/channels/channel-routing) — 메시지용 세션 라우팅
- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이트
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [보안](/ko/gateway/security) — 접근 모델 및 하드닝
