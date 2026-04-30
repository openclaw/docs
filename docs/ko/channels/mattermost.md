---
read_when:
    - Mattermost 설정하기
    - Mattermost 라우팅 디버깅
sidebarTitle: Mattermost
summary: Mattermost 봇 설정 및 OpenClaw 구성
title: Mattermost
x-i18n:
    generated_at: "2026-04-30T06:18:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1926a1d7347ff35ed60f8d5c3e0b26a064863ada213ad0e171776af5a84d8475
    source_path: channels/mattermost.md
    workflow: 16
---

상태: 번들 Plugin(봇 토큰 + WebSocket 이벤트). 채널, 그룹, DM을 지원합니다. Mattermost는 자체 호스팅 가능한 팀 메시징 플랫폼입니다. 제품 세부 정보와 다운로드는 공식 사이트 [mattermost.com](https://mattermost.com)을 참조하세요.

## 번들 Plugin

<Note>
Mattermost는 현재 OpenClaw 릴리스에서 번들 Plugin으로 제공되므로, 일반 패키지 빌드에는 별도 설치가 필요 없습니다.
</Note>

이전 빌드이거나 Mattermost를 제외한 사용자 지정 설치를 사용 중이라면, 패키지가 게시되었을 때 최신 npm 패키지를 설치하세요.

<Tabs>
  <Tab title="npm 레지스트리">
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

npm에서 OpenClaw 소유 패키지가 사용 중단되었다고 보고하면, 더 최신 npm 패키지가 게시될 때까지 현재 패키지된 OpenClaw 빌드나 로컬 체크아웃 경로를 사용하세요.

세부 정보: [Plugins](/ko/tools/plugin)

## 빠른 설정

<Steps>
  <Step title="Plugin을 사용할 수 있는지 확인">
    현재 패키지된 OpenClaw 릴리스에는 이미 포함되어 있습니다. 이전/사용자 지정 설치에서는 위 명령으로 수동 추가할 수 있습니다.
  </Step>
  <Step title="Mattermost 봇 만들기">
    Mattermost 봇 계정을 만들고 **봇 토큰**을 복사합니다.
  </Step>
  <Step title="기본 URL 복사">
    Mattermost **기본 URL**(예: `https://chat.example.com`)을 복사합니다.
  </Step>
  <Step title="OpenClaw를 구성하고 gateway 시작">
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

네이티브 슬래시 명령은 선택적으로 활성화합니다. 활성화하면 OpenClaw가 Mattermost API를 통해 `oc_*` 슬래시 명령을 등록하고 Gateway HTTP 서버에서 콜백 POST를 수신합니다.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Mattermost가 Gateway에 직접 접근할 수 없을 때 사용합니다(리버스 프록시/공개 URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="동작 참고 사항">
    - `native: "auto"`는 Mattermost에서 기본적으로 비활성화됩니다. 활성화하려면 `native: true`를 설정하세요.
    - `callbackUrl`을 생략하면 OpenClaw가 Gateway 호스트/포트 + `callbackPath`에서 값을 도출합니다.
    - 다중 계정 설정에서는 `commands`를 최상위 수준이나 `channels.mattermost.accounts.<id>.commands` 아래에 설정할 수 있습니다(계정 값이 최상위 필드를 재정의함).
    - 명령 콜백은 OpenClaw가 `oc_*` 명령을 등록할 때 Mattermost가 반환한 명령별 토큰으로 검증됩니다.
    - 등록에 실패했거나, 시작이 부분적으로만 완료되었거나, 콜백 토큰이 등록된 명령 중 하나와 일치하지 않으면 슬래시 콜백은 닫힌 상태로 실패합니다.

  </Accordion>
  <Accordion title="접근 가능성 요구 사항">
    콜백 엔드포인트는 Mattermost 서버에서 접근 가능해야 합니다.

    - Mattermost가 OpenClaw와 같은 호스트/네트워크 네임스페이스에서 실행되지 않는 한 `callbackUrl`을 `localhost`로 설정하지 마세요.
    - 해당 URL이 `/api/channels/mattermost/command`를 OpenClaw로 리버스 프록시하지 않는 한 `callbackUrl`을 Mattermost 기본 URL로 설정하지 마세요.
    - 빠른 확인 방법은 `curl https://<gateway-host>/api/channels/mattermost/command`입니다. GET은 `404`가 아니라 OpenClaw의 `405 Method Not Allowed`를 반환해야 합니다.

  </Accordion>
  <Accordion title="Mattermost 송신 허용 목록">
    콜백 대상이 비공개/tailnet/내부 주소라면 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`에 콜백 호스트/도메인을 포함하도록 설정하세요.

    전체 URL이 아니라 호스트/도메인 항목을 사용하세요.

    - 좋음: `gateway.tailnet-name.ts.net`
    - 나쁨: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 환경 변수(기본 계정)

환경 변수를 선호한다면 Gateway 호스트에 다음을 설정하세요.

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
환경 변수는 **기본** 계정(`default`)에만 적용됩니다. 다른 계정은 구성 값을 사용해야 합니다.

`MATTERMOST_URL`은 워크스페이스 `.env`에서 설정할 수 없습니다. [워크스페이스 `.env` 파일](/ko/gateway/security)을 참조하세요.
</Note>

## 채팅 모드

Mattermost는 DM에 자동으로 응답합니다. 채널 동작은 `chatmode`로 제어됩니다.

<Tabs>
  <Tab title="oncall (기본값)">
    채널에서 @멘션된 경우에만 응답합니다.
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

- `onchar`는 명시적인 @멘션에도 여전히 응답합니다.
- `channels.mattermost.requireMention`은 레거시 구성에서 존중되지만 `chatmode`를 권장합니다.

## 스레드와 세션

`channels.mattermost.replyToMode`를 사용해 채널 및 그룹 답장이 기본 채널에 남을지, 트리거한 게시물 아래에 스레드를 시작할지 제어합니다.

- `off`(기본값): 들어온 게시물이 이미 스레드 안에 있을 때만 스레드에서 답장합니다.
- `first`: 최상위 채널/그룹 게시물의 경우 해당 게시물 아래에 스레드를 시작하고 대화를 스레드 범위 세션으로 라우팅합니다.
- `all`: 현재 Mattermost에서는 `first`와 동일하게 동작합니다.
- 직접 메시지는 이 설정을 무시하고 스레드 없이 유지됩니다.

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
- Mattermost에 스레드 루트가 생기면 후속 청크와 미디어가 같은 스레드에서 계속되므로 현재 `first`와 `all`은 동일합니다.

## 접근 제어(DM)

- 기본값: `channels.mattermost.dmPolicy = "pairing"`(알 수 없는 발신자는 페어링 코드를 받음).
- 승인 방법:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 공개 DM: `channels.mattermost.dmPolicy="open"` 및 `channels.mattermost.allowFrom=["*"]`.

## 채널(그룹)

- 기본값: `channels.mattermost.groupPolicy = "allowlist"`(멘션 게이트 적용).
- `channels.mattermost.groupAllowFrom`으로 발신자를 허용 목록에 추가합니다(사용자 ID 권장).
- 채널별 멘션 재정의는 `channels.mattermost.groups.<channelId>.requireMention` 아래에 두거나 기본값은 `channels.mattermost.groups["*"].requireMention` 아래에 둡니다.
- `@username` 매칭은 변경 가능하며 `channels.mattermost.dangerouslyAllowNameMatching: true`일 때만 활성화됩니다.
- 열린 채널: `channels.mattermost.groupPolicy="open"`(멘션 게이트 적용).
- 런타임 참고: `channels.mattermost`가 완전히 없으면 런타임은 그룹 검사에서 `groupPolicy="allowlist"`로 폴백합니다(`channels.defaults.groupPolicy`가 설정되어 있어도 동일).

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

`openclaw message send` 또는 cron/webhook에서 다음 대상 형식을 사용하세요.

- 채널에는 `channel:<id>`
- DM에는 `user:<id>`
- DM에는 `@username`(Mattermost API를 통해 확인됨)

<Warning>
그 자체로 불투명한 ID(예: `64ifufp...`)는 Mattermost에서 **모호합니다**(사용자 ID인지 채널 ID인지).

OpenClaw는 이를 **사용자 우선**으로 확인합니다.

- ID가 사용자로 존재하면(`GET /api/v4/users/<id>` 성공), OpenClaw는 `/api/v4/channels/direct`로 직접 채널을 확인해 **DM**을 보냅니다.
- 그렇지 않으면 ID는 **채널 ID**로 처리됩니다.

결정적인 동작이 필요하다면 항상 명시적 접두사(`user:<id>` / `channel:<id>`)를 사용하세요.
</Warning>

## DM 채널 재시도

OpenClaw가 Mattermost DM 대상으로 보낼 때 먼저 직접 채널을 확인해야 하는 경우, 기본적으로 일시적인 직접 채널 생성 실패를 재시도합니다.

Mattermost Plugin 전체에 대해 이 동작을 조정하려면 `channels.mattermost.dmChannelRetry`를 사용하고, 특정 계정 하나에 대해서는 `channels.mattermost.accounts.<id>.dmChannelRetry`를 사용하세요.

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
- `429` 이외의 4xx 클라이언트 오류는 영구 오류로 처리되어 재시도하지 않습니다.

## 미리보기 스트리밍

Mattermost는 사고 과정, 도구 활동, 부분 답장 텍스트를 하나의 **초안 미리보기 게시물**로 스트리밍하고, 최종 답변을 보내도 안전해지면 그 자리에서 최종화합니다. 미리보기는 청크마다 메시지를 보내 채널을 도배하는 대신 같은 게시물 ID에서 업데이트됩니다. 미디어/오류 최종 결과는 대기 중인 미리보기 편집을 취소하고 일회성 미리보기 게시물을 flush하지 않고 일반 전달을 사용합니다.

`channels.mattermost.streaming`으로 활성화합니다.

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
    - `partial`은 일반적인 선택지입니다. 답장이 늘어날수록 편집되는 하나의 미리보기 게시물을 사용한 뒤, 완전한 답변으로 최종화합니다.
    - `block`은 미리보기 게시물 안에서 추가 방식의 초안 청크를 사용합니다.
    - `progress`는 생성 중 상태 미리보기를 표시하고 완료 시에만 최종 답변을 게시합니다.
    - `off`는 미리보기 스트리밍을 비활성화합니다.

  </Accordion>
  <Accordion title="스트리밍 동작 참고 사항">
    - 스트림을 그 자리에서 최종화할 수 없는 경우(예: 스트림 도중 게시물이 삭제됨), OpenClaw는 새 최종 게시물을 보내는 방식으로 폴백하여 답장이 손실되지 않게 합니다.
    - Reasoning 전용 페이로드는 `> Reasoning:` 인용문으로 도착하는 텍스트를 포함해 채널 게시물에서 억제됩니다. 다른 표면에서 사고 과정을 보려면 `/reasoning on`을 설정하세요. Mattermost 최종 게시물에는 답변만 유지됩니다.
    - 채널 매핑 행렬은 [Streaming](/ko/concepts/streaming#preview-streaming-modes)을 참조하세요.

  </Accordion>
</AccordionGroup>

## 반응(메시지 도구)

- `channel=mattermost`와 함께 `message action=react`를 사용합니다.
- `messageId`는 Mattermost 게시물 ID입니다.
- `emoji`는 `thumbsup` 또는 `:+1:` 같은 이름을 허용합니다(콜론은 선택 사항).
- 반응을 제거하려면 `remove=true`(불리언)를 설정합니다.
- 반응 추가/제거 이벤트는 라우팅된 에이전트 세션에 시스템 이벤트로 전달됩니다.

예시:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

구성:

- `channels.mattermost.actions.reactions`: 반응 액션 활성화/비활성화(기본값 true).
- 계정별 재정의: `channels.mattermost.accounts.<id>.actions.reactions`.

## 대화형 버튼(메시지 도구)

클릭 가능한 버튼이 있는 메시지를 보냅니다. 사용자가 버튼을 클릭하면 에이전트가 선택 내용을 받고 응답할 수 있습니다.

채널 기능에 `inlineButtons`를 추가해 버튼을 활성화합니다.

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

`buttons` 매개변수와 함께 `message action=send`를 사용합니다. 버튼은 2D 배열(버튼 행)입니다.

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

버튼 필드:

<ParamField path="text" type="string" required>
  표시 레이블.
</ParamField>
<ParamField path="callback_data" type="string" required>
  클릭 시 다시 전송되는 값(액션 ID로 사용됨).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  버튼 스타일.
</ParamField>

사용자가 버튼을 클릭하면:

<Steps>
  <Step title="버튼이 확인으로 대체됨">
    모든 버튼은 확인 줄로 대체됩니다(예: "✓ **예** @user님이 선택함").
  </Step>
  <Step title="에이전트가 선택을 수신함">
    에이전트는 선택을 인바운드 메시지로 수신하고 응답합니다.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="구현 참고 사항">
    - 버튼 콜백은 HMAC-SHA256 검증을 사용합니다(자동, 구성 필요 없음).
    - Mattermost는 API 응답에서 콜백 데이터를 제거하므로(보안 기능), 클릭 시 모든 버튼이 제거됩니다. 부분 제거는 불가능합니다.
    - 하이픈이나 밑줄이 포함된 액션 ID는 자동으로 정리됩니다(Mattermost 라우팅 제한).

  </Accordion>
  <Accordion title="구성 및 도달 가능성">
    - `channels.mattermost.capabilities`: 기능 문자열 배열입니다. 에이전트 시스템 프롬프트에서 버튼 도구 설명을 활성화하려면 `"inlineButtons"`를 추가하세요.
    - `channels.mattermost.interactions.callbackBaseUrl`: 버튼 콜백을 위한 선택적 외부 기본 URL입니다(예: `https://gateway.example.com`). Mattermost가 바인드 호스트에서 Gateway에 직접 도달할 수 없을 때 사용하세요.
    - 다중 계정 설정에서는 `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 아래에도 같은 필드를 설정할 수 있습니다.
    - `interactions.callbackBaseUrl`이 생략되면 OpenClaw는 `gateway.customBindHost` + `gateway.port`에서 콜백 URL을 파생한 다음, `http://localhost:<port>`로 폴백합니다.
    - 도달 가능성 규칙: 버튼 콜백 URL은 Mattermost 서버에서 도달 가능해야 합니다. `localhost`는 Mattermost와 OpenClaw가 같은 호스트/네트워크 네임스페이스에서 실행될 때만 작동합니다.
    - 콜백 대상이 비공개/tailnet/내부인 경우, 해당 호스트/도메인을 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`에 추가하세요.

  </Accordion>
</AccordionGroup>

### 직접 API 통합(외부 스크립트)

외부 스크립트와 Webhook은 에이전트의 `message` 도구를 거치지 않고 Mattermost REST API를 통해 버튼을 직접 게시할 수 있습니다. 가능하면 Plugin의 `buildButtonAttachments()`를 사용하세요. 원시 JSON을 게시하는 경우 다음 규칙을 따르세요.

**페이로드 구조:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only — see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id (for name lookup)
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
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

1. 첨부 파일은 최상위 `attachments`가 아니라 `props.attachments`에 넣어야 합니다(조용히 무시됨).
2. 모든 액션에는 `type: "button"`이 필요합니다. 없으면 클릭이 조용히 삼켜집니다.
3. 모든 액션에는 `id` 필드가 필요합니다. Mattermost는 ID가 없는 액션을 무시합니다.
4. 액션 `id`는 **영숫자만**이어야 합니다(`[a-zA-Z0-9]`). 하이픈과 밑줄은 Mattermost의 서버 측 액션 라우팅을 깨뜨립니다(404 반환). 사용하기 전에 제거하세요.
5. `context.action_id`는 원시 ID 대신 버튼 이름(예: "Approve")이 확인 메시지에 표시되도록 버튼의 `id`와 일치해야 합니다.
6. `context.action_id`는 필수입니다. 없으면 상호작용 핸들러가 400을 반환합니다.

</Warning>

**HMAC 토큰 생성**

Gateway는 HMAC-SHA256으로 버튼 클릭을 검증합니다. 외부 스크립트는 Gateway의 검증 로직과 일치하는 토큰을 생성해야 합니다.

<Steps>
  <Step title="봇 토큰에서 시크릿 파생">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="컨텍스트 객체 빌드">
    `_token`을 **제외한** 모든 필드로 컨텍스트 객체를 빌드하세요.
  </Step>
  <Step title="정렬된 키로 직렬화">
    **정렬된 키**와 **공백 없이** 직렬화하세요(Gateway는 정렬된 키로 `JSON.stringify`를 사용하며, 이는 압축된 출력을 생성합니다).
  </Step>
  <Step title="페이로드 서명">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="토큰 추가">
    결과 hex digest를 컨텍스트의 `_token`으로 추가하세요.
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
  <Accordion title="흔한 HMAC 함정">
    - Python의 `json.dumps`는 기본적으로 공백을 추가합니다(`{"key": "val"}`). JavaScript의 압축 출력(`{"key":"val"}`)과 일치시키려면 `separators=(",", ":")`를 사용하세요.
    - 항상 `_token`을 뺀 **모든** 컨텍스트 필드에 서명하세요. Gateway는 `_token`을 제거한 다음 남은 모든 항목에 서명합니다. 일부만 서명하면 검증이 조용히 실패합니다.
    - `sort_keys=True`를 사용하세요. Gateway는 서명 전에 키를 정렬하며, Mattermost가 페이로드를 저장할 때 컨텍스트 필드 순서를 바꿀 수 있습니다.
    - 랜덤 바이트가 아니라 봇 토큰에서 시크릿을 파생하세요(결정적). 시크릿은 버튼을 생성하는 프로세스와 검증하는 Gateway에서 동일해야 합니다.

  </Accordion>
</AccordionGroup>

## 디렉터리 어댑터

Mattermost Plugin에는 Mattermost API를 통해 채널과 사용자 이름을 확인하는 디렉터리 어댑터가 포함되어 있습니다. 이를 통해 `openclaw message send` 및 Cron/Webhook 전달에서 `#channel-name` 및 `@username` 대상을 사용할 수 있습니다.

구성은 필요 없습니다. 어댑터는 계정 구성의 봇 토큰을 사용합니다.

## 다중 계정

Mattermost는 `channels.mattermost.accounts` 아래에서 여러 계정을 지원합니다.

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
  <Accordion title="채널에 응답이 없음">
    봇이 채널에 있는지 확인하고 멘션하거나(oncall), 트리거 접두사를 사용하거나(onchar), `chatmode: "onmessage"`를 설정하세요.
  </Accordion>
  <Accordion title="인증 또는 다중 계정 오류">
    - 봇 토큰, 기본 URL, 계정 활성화 여부를 확인하세요.
    - 다중 계정 문제: env var는 `default` 계정에만 적용됩니다.

  </Accordion>
  <Accordion title="네이티브 슬래시 명령 실패">
    - `Unauthorized: invalid command token.`: OpenClaw가 콜백 토큰을 수락하지 않았습니다. 일반적인 원인:
      - 시작 시 슬래시 명령 등록이 실패했거나 부분적으로만 완료됨
      - 콜백이 잘못된 Gateway/계정에 도달함
      - Mattermost에 이전 콜백 대상을 가리키는 오래된 명령이 남아 있음
      - Gateway가 슬래시 명령을 다시 활성화하지 않고 재시작됨
    - 네이티브 슬래시 명령이 작동을 멈추면 로그에서 `mattermost: failed to register slash commands` 또는 `mattermost: native slash commands enabled but no commands could be registered`를 확인하세요.
    - `callbackUrl`이 생략되었고 로그에서 콜백이 `http://127.0.0.1:18789/...`로 해석되었다고 경고하는 경우, 해당 URL은 Mattermost가 OpenClaw와 같은 호스트/네트워크 네임스페이스에서 실행될 때만 도달 가능할 가능성이 큽니다. 대신 명시적으로 외부에서 도달 가능한 `commands.callbackUrl`을 설정하세요.

  </Accordion>
  <Accordion title="버튼 문제">
    - 버튼이 흰색 상자로 표시됨: 에이전트가 잘못된 형식의 버튼 데이터를 보내고 있을 수 있습니다. 각 버튼에 `text`와 `callback_data` 필드가 모두 있는지 확인하세요.
    - 버튼이 렌더링되지만 클릭해도 아무 일도 일어나지 않음: Mattermost 서버 구성의 `AllowedUntrustedInternalConnections`에 `127.0.0.1 localhost`가 포함되어 있고, ServiceSettings에서 `EnablePostActionIntegration`이 `true`인지 확인하세요.
    - 클릭 시 버튼이 404를 반환함: 버튼 `id`에 하이픈이나 밑줄이 포함되었을 가능성이 큽니다. Mattermost의 액션 라우터는 영숫자가 아닌 ID에서 깨집니다. `[a-zA-Z0-9]`만 사용하세요.
    - Gateway 로그에 `invalid _token`이 표시됨: HMAC 불일치입니다. 모든 컨텍스트 필드(일부가 아님)에 서명하고, 정렬된 키를 사용하며, 압축 JSON(공백 없음)을 사용하는지 확인하세요. 위의 HMAC 섹션을 참조하세요.
    - Gateway 로그에 `missing _token in context`가 표시됨: `_token` 필드가 버튼 컨텍스트에 없습니다. 통합 페이로드를 빌드할 때 포함되었는지 확인하세요.
    - 확인 메시지에 버튼 이름 대신 원시 ID가 표시됨: `context.action_id`가 버튼의 `id`와 일치하지 않습니다. 둘 다 동일한 정리된 값으로 설정하세요.
    - 에이전트가 버튼을 알지 못함: Mattermost 채널 구성에 `capabilities: ["inlineButtons"]`를 추가하세요.

  </Accordion>
</AccordionGroup>

## 관련 항목

- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [보안](/ko/gateway/security) — 액세스 모델 및 강화
