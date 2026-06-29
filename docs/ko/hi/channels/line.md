---
read_when:
    - OpenClaw를 LINE에 연결하려고 합니다
    - LINE Webhook + 자격 증명 설정이 필요합니다
    - LINE별 메시지 옵션이 필요합니다
summary: LINE Messaging API Plugin 설정, 구성 및 사용
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE은 LINE Messaging API를 통해 OpenClaw에 연결됩니다. Plugin은 Gateway에서 Webhook
수신기로 실행되며 인증에 channel access token + channel secret을 사용합니다.

상태: 다운로드 가능한 Plugin. 다이렉트 메시지, 그룹 채팅, 미디어, 위치, Flex
메시지, 템플릿 메시지, 빠른 답장을 지원합니다. 리액션과 스레드는
지원하지 않습니다.

## 설치

channel을 구성하기 전에 LINE을 설치하세요.

```bash
openclaw plugins install @openclaw/line
```

로컬 체크아웃(git repo에서 실행하는 경우):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## 설정

1. LINE Developers 계정을 만들고 Console을 엽니다.
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Provider를 만들거나 선택한 뒤 **Messaging API** channel을 추가합니다.
3. channel settings에서 **Channel access token**과 **Channel secret**을 복사합니다.
4. Messaging API settings에서 **Use webhook**을 활성화합니다.
5. Webhook URL을 Gateway endpoint로 설정합니다(HTTPS 필요).

```
https://gateway-host/line/webhook
```

Gateway는 LINE의 Webhook verification(GET)에 응답하고, signature 및 payload validation 직후 signed
inbound events(POST)를 수락합니다. agent
processing은 비동기적으로 계속됩니다.
custom path가 필요하면 `channels.line.webhookPath` 또는
`channels.line.accounts.<id>.webhookPath`를 설정하고 URL을 그에 맞게 업데이트하세요.

보안 참고:

- LINE signature verification은 body-dependent입니다(raw body에 대한 HMAC). 따라서 OpenClaw는 verification 전에 엄격한 pre-auth body limits와 timeout을 적용합니다.
- OpenClaw는 검증된 raw request bytes에서 Webhook events를 process합니다. signature-integrity safety를 위해 upstream middleware-transformed `req.body` values는 무시됩니다.

## 구성

최소 config:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Public DM config:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

Env vars(default account 전용):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Token/secret files:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile`과 `secretFile`은 regular files를 가리켜야 합니다. Symlinks는 거부됩니다.

여러 accounts:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## 접근 제어

Direct messages는 기본적으로 pairing을 사용합니다. 알 수 없는 senders는 pairing code를 받으며, 해당
messages는 approved될 때까지 무시됩니다.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists 및 policies:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DMs용 allowlisted LINE user IDs. `dmPolicy: "open"`에는 `["*"]`가 필요합니다.
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: groups용 allowlisted LINE user IDs
- Per-group overrides: `channels.line.groups.<groupId>.allowFrom`
- Static sender access groups는 `allowFrom`, `groupAllowFrom`, per-group `allowFrom`에서 `accessGroup:<name>`으로 reference할 수 있습니다.
- Runtime 참고: `channels.line`이 완전히 missing이면 runtime은 group checks에 대해 `groupPolicy="allowlist"`로 fallback합니다(`channels.defaults.groupPolicy`가 설정되어 있어도).

LINE IDs는 case-sensitive입니다. Valid IDs는 다음과 같습니다.

- User: `U` + 32 hex chars
- Group: `C` + 32 hex chars
- Room: `R` + 32 hex chars

## 메시지 동작

- Text는 5000 characters 단위의 chunks로 나뉩니다.
- Markdown formatting은 제거됩니다. code blocks와 tables는 가능하면 Flex
  cards로 변환됩니다.
- Streaming responses는 buffered됩니다. agent가 작업하는 동안 LINE은 loading
  animation과 함께 전체 chunks를 받습니다.
- Media downloads는 `channels.line.mediaMaxMb`(default 10)로 capped됩니다.
- Inbound media는 agent에 pass되기 전에 `~/.openclaw/media/inbound/` 아래에 save되며,
  이는 다른 bundled channel
  plugins에서 사용하는 shared media store와 일치합니다.

## Channel data(리치 메시지)

빠른 답장, 위치, Flex cards 또는 템플릿
메시지를 보내려면 `channelData.line`을 사용하세요.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

LINE Plugin은 Flex message presets를 위한 `/card` command도 제공합니다.

```
/card info "Welcome" "Thanks for joining!"
```

## ACP 지원

LINE은 ACP(Agent Communication Protocol) conversation bindings를 지원합니다.

- `/acp spawn <agent> --bind here`는 child thread를 만들지 않고 current LINE chat을 ACP session에 bind합니다.
- Configured ACP bindings와 active conversation-bound ACP sessions는 LINE에서 다른 conversation channels처럼 작동합니다.

자세한 내용은 [ACP agents](/ko/tools/acp-agents)를 참고하세요.

## Outbound media

LINE Plugin은 agent message tool을 통해 images, videos, audio files 전송을 지원합니다. Media는 appropriate preview와 tracking handling을 포함해 LINE-specific delivery path를 통해 전송됩니다.

- **Images**: automatic preview generation과 함께 LINE image messages로 전송됩니다.
- **Videos**: explicit preview와 content-type handling과 함께 전송됩니다.
- **Audio**: LINE audio messages로 전송됩니다.

Outbound media URLs는 public HTTPS URLs여야 합니다. OpenClaw는 URL을 LINE에 넘기기 전에 target hostname을 validate하고 loopback, link-local, private-network targets를 거부합니다.

Generic media sends는 LINE-specific path를 사용할 수 없는 경우 existing image-only route로 fallback합니다.

## 문제 해결

- **Webhook verification fails:** Webhook URL이 HTTPS이고
  `channelSecret`이 LINE console과 일치하는지 확인하세요.
- **No inbound events:** Webhook path가 `channels.line.webhookPath`와 일치하고
  Gateway가 LINE에서 reachable한지 확인하세요.
- **Media download errors:** media가 default limit를 초과하면 `channels.line.mediaMaxMb`를 늘리세요.

## 관련 항목

- [Channels Overview](/ko/channels) — 지원되는 모든 channels
- [Pairing](/ko/channels/pairing) — DM authentication 및 pairing flow
- [Groups](/ko/channels/groups) — group chat behavior 및 mention gating
- [Channel Routing](/ko/channels/channel-routing) — messages의 session routing
- [Security](/ko/gateway/security) — access model 및 hardening
