---
read_when:
    - 채널 Plugin 구성(auth, 접근 제어, 다중 계정)
    - 채널별 구성 키 문제 해결
    - DM 정책, 그룹 정책 또는 멘션 게이팅 감사
summary: '채널 구성: Slack, Discord, Telegram, WhatsApp, Matrix, iMessage 등 전반의 접근 제어, 페어링, 채널별 키'
title: 구성 — 채널
x-i18n:
    generated_at: "2026-07-01T12:54:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba84406a296db7a37ce44381b5a1ebccd7f4d3c32375b116f6da3da5def9340b
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` 아래의 채널별 구성 키입니다. DM 및 그룹 접근,
다중 계정 설정, 멘션 게이팅, 그리고 Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage 및 기타 번들 채널 Plugin의 채널별 키를 다룹니다.

에이전트, 도구, Gateway 런타임 및 기타 최상위 키는
[구성 참조](/ko/gateway/configuration-reference)를 참조하세요.

## 채널

각 채널은 구성 섹션이 존재하면 자동으로 시작됩니다(`enabled: false`가 아닌 경우).

### DM 및 그룹 접근

모든 채널은 DM 정책과 그룹 정책을 지원합니다.

| DM 정책             | 동작                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (기본값)  | 알 수 없는 발신자는 일회성 페어링 코드를 받으며, 소유자가 승인해야 함 |
| `allowlist`         | `allowFrom`에 있거나 페어링된 허용 저장소에 있는 발신자만 허용 |
| `open`              | 모든 인바운드 DM 허용(`allowFrom: ["*"]` 필요)                  |
| `disabled`          | 모든 인바운드 DM 무시                                           |

| 그룹 정책             | 동작                                                     |
| --------------------- | -------------------------------------------------------- |
| `allowlist` (기본값)  | 구성된 허용 목록과 일치하는 그룹만 허용                 |
| `open`                | 그룹 허용 목록을 우회함(멘션 게이팅은 계속 적용됨)      |
| `disabled`            | 모든 그룹/룸 메시지 차단                                |

<Note>
`channels.defaults.groupPolicy`는 제공자의 `groupPolicy`가 설정되지 않았을 때 기본값을 설정합니다.
페어링 코드는 1시간 후 만료됩니다. 대기 중인 DM 페어링 요청은 **채널당 3개**로 제한됩니다.
제공자 블록이 완전히 누락된 경우(`channels.<provider>` 없음), 런타임 그룹 정책은 시작 경고와 함께 `allowlist`로 폴백합니다(닫힌 상태로 실패).
</Note>

### 채널 모델 재정의

`channels.modelByChannel`을 사용해 특정 채널 ID 또는 다이렉트 메시지 피어를 모델에 고정합니다. 값은 `provider/model` 또는 구성된 모델 별칭을 허용합니다. 채널 매핑은 세션에 이미 모델 재정의가 없는 경우 적용됩니다(예: `/model`로 설정된 경우).

그룹/스레드 대화의 경우 키는 채널별 그룹 ID, 토픽 ID 또는 채널 이름입니다. 다이렉트 메시지(DM) 대화의 경우 키는 채널의 발신자 식별 정보(`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` 또는 `SenderId`)에서 파생된 피어 식별자입니다. 정확한 키 형식은 채널에 따라 달라집니다.

| 채널     | DM 키 형식          | 예시                                         |
| -------- | ------------------- | -------------------------------------------- |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | 원시 사용자 ID      | `123456789`                                  |
| Discord  | 원시 사용자 ID      | `987654321`                                  |
| WhatsApp | 전화번호 또는 JID   | `15551234567`                                |
| Matrix   | Matrix 사용자 ID    | `@user:matrix.org`                           |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.5",
        "user:U12345": "openai/gpt-5.4-mini",
      },
      telegram: {
        "-1001234567890": "openai/gpt-5.4-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
        "123456789": "openai/gpt-4.1",
      },
    },
  },
}
```

DM 전용 키는 다이렉트 메시지 대화에서만 일치하며, 그룹/스레드 라우팅에는 영향을 주지 않습니다.

### 채널 기본값 및 Heartbeat

`channels.defaults`를 사용해 제공자 전반에 공유되는 그룹 정책 및 Heartbeat 동작을 설정합니다.

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: 제공자 수준의 `groupPolicy`가 설정되지 않았을 때의 폴백 그룹 정책입니다.
- `channels.defaults.contextVisibility`: 모든 채널의 기본 보조 컨텍스트 표시 모드입니다. 값: `all`(기본값, 모든 인용/스레드/기록 컨텍스트 포함), `allowlist`(허용 목록의 발신자 컨텍스트만 포함), `allowlist_quote`(allowlist와 같지만 명시적 인용/답글 컨텍스트 유지). 채널별 재정의: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: 정상 채널 상태를 Heartbeat 출력에 포함합니다.
- `channels.defaults.heartbeat.showAlerts`: 성능 저하/오류 상태를 Heartbeat 출력에 포함합니다.
- `channels.defaults.heartbeat.useIndicator`: 간결한 표시기 스타일의 Heartbeat 출력을 렌더링합니다.

### WhatsApp

WhatsApp은 Gateway의 웹 채널(Baileys Web)을 통해 실행됩니다. 연결된 세션이 존재하면 자동으로 시작됩니다.

```json5
{
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
    },
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

- `type: "acp"`가 있는 최상위 `bindings[]` 항목은 WhatsApp DM 및 그룹에 대한 영구 ACP 바인딩을 구성합니다. `match.peer.id`에는 E.164 다이렉트 번호 또는 WhatsApp 그룹 JID를 사용하세요. 필드 의미는 [ACP 에이전트](/ko/tools/acp-agents#persistent-channel-bindings)에서 공유됩니다.

<Accordion title="Multi-account WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- 아웃바운드 명령은 계정 `default`가 있으면 이를 기본값으로 사용하며, 그렇지 않으면 첫 번째 구성된 계정 ID(정렬됨)를 사용합니다.
- 선택적 `channels.whatsapp.defaultAccount`는 구성된 계정 ID와 일치할 때 해당 폴백 기본 계정 선택을 재정의합니다.
- 기존 단일 계정 Baileys 인증 디렉터리는 `openclaw doctor`에 의해 `whatsapp/default`로 마이그레이션됩니다.
- 계정별 재정의: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: partial)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      apiRoot: "https://api.telegram.org",
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- 봇 토큰: `channels.telegram.botToken` 또는 `channels.telegram.tokenFile`(일반 파일만 허용, 심볼릭 링크는 거부됨)이며, 기본 계정의 폴백으로 `TELEGRAM_BOT_TOKEN`을 사용합니다.
- `apiRoot`는 Telegram Bot API 루트만 의미합니다. `https://api.telegram.org/bot<TOKEN>`이 아니라 `https://api.telegram.org` 또는 자체 호스팅/프록시 루트를 사용하세요. `openclaw doctor --fix`는 실수로 붙은 후행 `/bot<TOKEN>` 접미사를 제거합니다.
- 선택적 `channels.telegram.defaultAccount`는 구성된 계정 ID와 일치할 때 기본 계정 선택을 재정의합니다.
- 다중 계정 설정(계정 ID 2개 이상)에서는 폴백 라우팅을 피하기 위해 명시적 기본값(`channels.telegram.defaultAccount` 또는 `channels.telegram.accounts.default`)을 설정하세요. 이것이 없거나 유효하지 않으면 `openclaw doctor`가 경고합니다.
- `configWrites: false`는 Telegram에서 시작된 구성 쓰기(슈퍼그룹 ID 마이그레이션, `/config set|unset`)를 차단합니다.
- `type: "acp"`가 있는 최상위 `bindings[]` 항목은 포럼 토픽에 대한 영구 ACP 바인딩을 구성합니다(`match.peer.id`에 정식 `chatId:topic:topicId` 사용). 필드 의미는 [ACP 에이전트](/ko/tools/acp-agents#persistent-channel-bindings)에서 공유됩니다.
- Telegram 스트림 미리보기는 `sendMessage` + `editMessageText`를 사용합니다(다이렉트 및 그룹 채팅에서 작동).
- 재시도 정책: [재시도 정책](/ko/concepts/retry)을 참조하세요.

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 100,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all | batched
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      suppressEmbeds: true,
      chunkMode: "length", // length | newline
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
        },
      },
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- 토큰: `channels.discord.token`, 기본 계정의 대체값으로 `DISCORD_BOT_TOKEN`을 사용합니다.
- 명시적인 Discord `token`을 제공하는 직접 아웃바운드 호출은 해당 호출에 그 토큰을 사용합니다. 계정 재시도/정책 설정은 여전히 활성 런타임 스냅샷에서 선택된 계정에서 가져옵니다.
- 선택 사항인 `channels.discord.defaultAccount`는 구성된 계정 ID와 일치할 때 기본 계정 선택을 재정의합니다.
- 전달 대상에는 `user:<id>`(DM) 또는 `channel:<id>`(길드 채널)를 사용합니다. 숫자 ID만 단독으로 쓰면 거부됩니다.
- 길드 슬러그는 소문자이며 공백은 `-`로 바뀝니다. 채널 키는 슬러그화된 이름을 사용합니다(`#` 없음). 길드 ID 사용을 권장합니다.
- 봇이 작성한 메시지는 기본적으로 무시됩니다. `allowBots: true`로 활성화할 수 있습니다. 봇을 멘션하는 봇 메시지만 허용하려면 `allowBots: "mentions"`를 사용합니다(자체 메시지는 계속 필터링됨).
- 봇 작성 인바운드 메시지를 지원하는 채널은 공유 [봇 루프 보호](/ko/channels/bot-loop-protection)를 사용할 수 있습니다. 기준 쌍 예산에는 `channels.defaults.botLoopProtection`을 설정하고, 한 표면에 다른 제한이 필요할 때만 채널 또는 계정을 재정의합니다.
- `channels.discord.guilds.<id>.ignoreOtherMentions`(및 채널 재정의)는 다른 사용자나 역할을 멘션하지만 봇은 멘션하지 않는 메시지를 드롭합니다(@everyone/@here 제외).
- `channels.discord.mentionAliases`는 전송 전에 안정적인 아웃바운드 `@handle` 텍스트를 Discord 사용자 ID에 매핑하므로, 임시 디렉터리 캐시가 비어 있어도 알려진 팀원을 결정적으로 멘션할 수 있습니다. 계정별 재정의는 `channels.discord.accounts.<accountId>.mentionAliases` 아래에 있습니다.
- `maxLinesPerMessage`(기본값 17)는 2000자 미만이어도 긴 메시지를 분할합니다.
- `channels.discord.suppressEmbeds`의 기본값은 `true`이므로, 비활성화하지 않는 한 아웃바운드 URL은 Discord 링크 미리보기로 확장되지 않습니다. 명시적인 `embeds` 페이로드는 계속 정상적으로 전송됩니다. 메시지별 도구 호출은 `suppressEmbeds`로 재정의할 수 있습니다.
- `channels.discord.threadBindings`는 Discord 스레드 바인딩 라우팅을 제어합니다.
  - `enabled`: 스레드 바인딩 세션 기능(`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, 바인딩된 전달/라우팅)에 대한 Discord 재정의
  - `idleHours`: 비활성 상태 자동 언포커스 시간 단위 Discord 재정의(`0`은 비활성화)
  - `maxAgeHours`: 하드 최대 수명 시간 단위 Discord 재정의(`0`은 비활성화)
  - `spawnSessions`: `sessions_spawn({ thread: true })` 및 ACP 스레드 스폰 자동 스레드 생성/바인딩 스위치(기본값: `true`)
  - `defaultSpawnContext`: 스레드 바인딩 스폰의 네이티브 서브에이전트 컨텍스트(기본값 `"fork"`)
- `type: "acp"`가 있는 최상위 `bindings[]` 항목은 채널과 스레드에 대한 영구 ACP 바인딩을 구성합니다(`match.peer.id`에 채널/스레드 ID 사용). 필드 의미는 [ACP 에이전트](/ko/tools/acp-agents#persistent-channel-bindings)에서 공유됩니다.
- `channels.discord.ui.components.accentColor`는 Discord 컴포넌트 v2 컨테이너의 강조 색상을 설정합니다.
- `channels.discord.agentComponents.ttlMs`는 전송된 Discord 컴포넌트 콜백이 등록 상태로 유지되는 시간을 제어합니다. 기본값은 `1800000`(30분), 최대값은 `86400000`(24시간)이며, 계정별 재정의는 `channels.discord.accounts.<accountId>.agentComponents.ttlMs` 아래에 있습니다. 값이 길수록 오래된 버튼/선택/폼을 더 오래 사용할 수 있으므로, 워크플로에 맞는 가장 짧은 TTL을 권장합니다.
- `channels.discord.voice`는 Discord 음성 채널 대화와 선택적 자동 참여 + LLM + TTS 재정의를 활성화합니다. 텍스트 전용 Discord 구성은 기본적으로 음성을 끕니다. 사용하려면 `channels.discord.voice.enabled=true`를 설정합니다.
- `channels.discord.voice.model`은 Discord 음성 채널 응답에 사용되는 LLM 모델을 선택적으로 재정의합니다.
- `channels.discord.voice.daveEncryption` 및 `channels.discord.voice.decryptionFailureTolerance`는 `@discordjs/voice` DAVE 옵션으로 그대로 전달됩니다(기본값은 `true` 및 `24`).
- `channels.discord.voice.connectTimeoutMs`는 `/vc join` 및 자동 참여 시도에서 초기 `@discordjs/voice` Ready 대기를 제어합니다(기본값 `30000`).
- `channels.discord.voice.reconnectGraceMs`는 연결이 끊긴 음성 세션이 OpenClaw에 의해 파기되기 전 재연결 신호 상태로 진입하는 데 걸릴 수 있는 시간을 제어합니다(기본값 `15000`).
- Discord 음성 재생은 다른 사용자의 말하기 시작 이벤트로 중단되지 않습니다. 피드백 루프를 피하기 위해 OpenClaw는 TTS 재생 중 새 음성 캡처를 무시합니다.
- 또한 OpenClaw는 반복적인 복호화 실패 후 음성 세션을 나갔다가 다시 참여하는 방식으로 음성 수신 복구를 시도합니다.
- `channels.discord.streaming`은 표준 스트림 모드 키입니다. Discord 기본값은 `streaming.mode: "progress"`이므로 도구/작업 진행 상황이 하나의 편집된 미리보기 메시지에 표시됩니다. 비활성화하려면 `streaming.mode: "off"`를 설정합니다. 레거시 `streamMode` 및 불리언 `streaming` 값은 런타임 별칭으로 남아 있습니다. 저장된 구성을 다시 쓰려면 `openclaw doctor --fix`를 실행합니다.
- `channels.discord.autoPresence`는 런타임 가용성을 봇 프레즌스에 매핑하고(healthy => online, degraded => idle, exhausted => dnd) 선택적 상태 텍스트 재정의를 허용합니다.
- `channels.discord.dangerouslyAllowNameMatching`은 변경 가능한 이름/태그 매칭을 다시 활성화합니다(비상 호환성 모드).
- `channels.discord.execApprovals`: Discord 네이티브 exec 승인 전달 및 승인자 권한 부여입니다.
  - `enabled`: `true`, `false` 또는 `"auto"`(기본값). 자동 모드에서는 `approvers` 또는 `commands.ownerAllowFrom`에서 승인자를 해석할 수 있을 때 exec 승인이 활성화됩니다.
  - `approvers`: exec 요청을 승인할 수 있는 Discord 사용자 ID입니다. 생략하면 `commands.ownerAllowFrom`으로 대체됩니다.
  - `agentFilter`: 선택적 에이전트 ID 허용 목록입니다. 생략하면 모든 에이전트의 승인을 전달합니다.
  - `sessionFilter`: 선택적 세션 키 패턴(부분 문자열 또는 정규식)입니다.
  - `target`: 승인 프롬프트를 보낼 위치입니다. `"dm"`(기본값)은 승인자 DM으로 보내고, `"channel"`은 원본 채널로 보내며, `"both"`는 둘 다로 보냅니다. 대상에 `"channel"`이 포함된 경우 버튼은 해석된 승인자만 사용할 수 있습니다.
  - `cleanupAfterResolve`: `true`이면 승인, 거부 또는 시간 초과 후 승인 DM을 삭제합니다.

**반응 알림 모드:** `off`(없음), `own`(봇 메시지, 기본값), `all`(모든 메시지), `allowlist`(모든 메시지에서 `guilds.<id>.users` 기준).

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- 서비스 계정 JSON: 인라인(`serviceAccount`) 또는 파일 기반(`serviceAccountFile`)입니다.
- 서비스 계정 SecretRef도 지원됩니다(`serviceAccountRef`).
- 환경 변수 대체값: `GOOGLE_CHAT_SERVICE_ACCOUNT` 또는 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- 전달 대상에는 `spaces/<spaceId>` 또는 `users/<userId>`를 사용합니다.
- `channels.googlechat.dangerouslyAllowNameMatching`은 변경 가능한 이메일 주체 매칭을 다시 활성화합니다(비상 호환성 모드).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      socketMode: {
        clientPingTimeout: 15000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all | batched
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      unfurlLinks: false,
      unfurlMedia: false,
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // use Slack native streaming API when mode=partial
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **소켓 모드**에는 `botToken`과 `appToken`이 모두 필요합니다(기본 계정 env 폴백의 경우 `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`).
- **HTTP 모드**에는 `botToken`과 `signingSecret`(루트 또는 계정별)이 필요합니다.
- `socketMode`는 Slack SDK Socket Mode 전송 튜닝을 공개 Bolt receiver API로 전달합니다. ping/pong 시간 초과 또는 오래된 websocket 동작을 조사할 때만 사용하세요. `clientPingTimeout`의 기본값은 `15000`이며, `serverPingTimeout`과 `pingPongLoggingEnabled`는 구성된 경우에만 전달됩니다.
- `botToken`, `appToken`, `signingSecret`, `userToken`은 일반 텍스트
  문자열 또는 SecretRef 객체를 허용합니다.
- Slack 계정 스냅샷은 `botTokenSource`, `botTokenStatus`, `appTokenStatus` 및 HTTP 모드의
  `signingSecretStatus`와 같은 자격 증명별 소스/상태 필드를 노출합니다.
  `configured_unavailable`은 계정이 SecretRef를 통해 구성되었지만 현재 명령/runtime 경로가
  secret 값을 확인할 수 없었음을 의미합니다.
- `configWrites: false`는 Slack에서 시작된 config 쓰기를 차단합니다.
- 선택 사항인 `channels.slack.defaultAccount`는 구성된 계정 id와 일치할 때 기본 계정 선택을 재정의합니다.
- `channels.slack.streaming.mode`는 정식 Slack 스트림 모드 키입니다. `channels.slack.streaming.nativeTransport`는 Slack의 native streaming transport를 제어합니다. 레거시 `streamMode`, boolean `streaming`, `nativeStreaming` 값은 runtime alias로 유지됩니다. 저장된 config를 다시 쓰려면 `openclaw doctor --fix`를 실행하세요.
- `unfurlLinks`와 `unfurlMedia`는 봇 응답에 대해 Slack의 `chat.postMessage` 링크 및 미디어 unfurl boolean을 전달합니다. `unfurlLinks`의 기본값은 `false`이므로 활성화하지 않는 한 아웃바운드 봇 링크가 인라인으로 확장되지 않습니다. `unfurlMedia`는 구성하지 않는 한 생략됩니다. 한 계정에 대해 최상위 값을 재정의하려면 `channels.slack.accounts.<accountId>`에서 어느 값이든 설정하세요.
- 전달 대상에는 `user:<id>`(DM) 또는 `channel:<id>`를 사용하세요.

**반응 알림 모드:** `off`, `own`(기본값), `all`, `allowlist`(`reactionAllowlist`에서).

**스레드 세션 격리:** `thread.historyScope`는 스레드별(기본값)이거나 채널 전체에서 공유됩니다. `thread.inheritParent`는 부모 채널 transcript를 새 스레드로 복사합니다.

- Slack native streaming과 Slack assistant 스타일의 "is typing..." 스레드 상태에는 응답 스레드 대상이 필요합니다. 최상위 DM은 기본적으로 스레드 밖에 유지되므로 스레드 스타일의 native stream/status 미리보기를 표시하는 대신 Slack draft post-and-edit 미리보기를 통해 계속 스트리밍할 수 있습니다.
- `typingReaction`은 응답이 실행되는 동안 인바운드 Slack 메시지에 임시 반응을 추가한 뒤 완료 시 제거합니다. `"hourglass_flowing_sand"`와 같은 Slack emoji shortcode를 사용하세요.
- `channels.slack.execApprovals`: Slack native approval-client 전달 및 exec 승인자 권한 부여입니다. Discord와 동일한 schema를 사용합니다. `enabled`(`true`/`false`/`"auto"`), `approvers`(Slack 사용자 ID), `agentFilter`, `sessionFilter`, `target`(`"dm"`, `"channel"` 또는 `"both"`). Plugin approval은 Slack plugin 승인자가 확인되는 경우 Slack-origin 요청에 이 native-client 경로를 사용할 수 있습니다. Slack-native plugin approval 전달은 Slack-origin 세션 또는 Slack 대상에 대해 `approvals.plugin`을 통해서도 활성화할 수 있습니다. Plugin approval은 exec 승인자가 아니라 `allowFrom`의 Slack plugin 승인자와 기본 routing을 사용합니다.

| 작업 그룹 | 기본값 | 참고                  |
| ------------ | ------- | ---------------------- |
| reactions    | 활성화됨 | 반응 추가 + 반응 나열 |
| messages     | 활성화됨 | 읽기/보내기/편집/삭제  |
| pins         | 활성화됨 | 고정/고정 해제/나열         |
| memberInfo   | 활성화됨 | 구성원 정보            |
| emojiList    | 활성화됨 | 사용자 지정 emoji 목록      |

### Mattermost

Mattermost는 현재 OpenClaw 릴리스에서 번들 Plugin으로 제공됩니다. 이전 또는
사용자 지정 빌드는 `openclaw plugins install @openclaw/mattermost`로
현재 npm package를 설치할 수 있습니다. 버전을 고정하기 전에 현재 dist-tag는
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)에서
확인하세요.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

채팅 모드: `oncall`(@-mention 시 응답, 기본값), `onmessage`(모든 메시지), `onchar`(트리거 prefix로 시작하는 메시지).

Mattermost native command가 활성화된 경우:

- `commands.callbackPath`는 전체 URL이 아니라 경로여야 합니다(예: `/api/channels/mattermost/command`).
- `commands.callbackUrl`은 OpenClaw gateway endpoint로 확인되어야 하며 Mattermost 서버에서 접근할 수 있어야 합니다.
- Native slash callback은 slash command 등록 중 Mattermost가 반환한 명령별 토큰으로
  인증됩니다. 등록이 실패하거나 활성화된 명령이 없으면 OpenClaw는
  `Unauthorized: invalid command token.`으로 callback을 거부합니다.
- 비공개/tailnet/internal callback 호스트의 경우 Mattermost는
  `ServiceSettings.AllowedUntrustedInternalConnections`에 callback host/domain을 포함하도록 요구할 수 있습니다.
  전체 URL이 아니라 host/domain 값을 사용하세요.
- `channels.mattermost.configWrites`: Mattermost에서 시작된 config 쓰기를 허용하거나 거부합니다.
- `channels.mattermost.requireMention`: 채널에서 응답하기 전에 `@mention`을 요구합니다.
- `channels.mattermost.groups.<channelId>.requireMention`: 채널별 mention-gating 재정의(기본값은 `"*"`).
- 선택 사항인 `channels.mattermost.defaultAccount`는 구성된 계정 id와 일치할 때 기본 계정 선택을 재정의합니다.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**반응 알림 모드:** `off`, `own`(기본값), `all`, `allowlist`(`reactionAllowlist`에서).

- `channels.signal.account`: 채널 시작을 특정 Signal 계정 ID에 고정합니다.
- `channels.signal.configWrites`: Signal에서 시작된 config 쓰기를 허용하거나 거부합니다.
- 선택 사항인 `channels.signal.defaultAccount`는 구성된 계정 id와 일치할 때 기본 계정 선택을 재정의합니다.

### iMessage

OpenClaw는 `imsg rpc`(stdio를 통한 JSON-RPC)를 실행합니다. daemon이나 port는 필요 없습니다. 호스트가 Messages 데이터베이스 및 Automation 권한을 부여할 수 있는 경우, 새 OpenClaw iMessage 설정에 권장되는 경로입니다.

BlueBubbles 지원은 제거되었습니다. `channels.bluebubbles`는 현재 OpenClaw에서 지원되는 runtime config surface가 아닙니다. 이전 config를 `channels.imessage`로 migration하세요. 요약 버전은 [BlueBubbles 제거 및 imsg iMessage 경로](/ko/announcements/bluebubbles-imessage)를, 전체 변환 표는 [BlueBubbles에서 이전하기](/ko/channels/imessage-from-bluebubbles)를 사용하세요.

Gateway가 로그인된 Messages Mac에서 실행 중이 아니라면 `channels.imessage.enabled=true`를 유지하고 `channels.imessage.cliPath`를 해당 Mac에서 `imsg "$@"`를 실행하는 SSH wrapper로 설정하세요. 기본 local `imsg` 경로는 macOS 전용입니다.

production 전송에 SSH wrapper를 의존하기 전에 해당 정확한 wrapper를 통해 아웃바운드 `imsg send`를 확인하세요. 일부 macOS TCC 상태는 Messages Automation을 `/usr/libexec/sshd-keygen-wrapper`에 할당하여 읽기와 probe는 작동하지만 AppleEvents `-1743`으로 전송은 실패할 수 있습니다. [SSH wrapper 전송이 AppleEvents -1743으로 실패](/ko/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743)를 참조하세요.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      sendTransport: "auto",
      region: "US",
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
    },
  },
}
```

- 선택 사항인 `channels.imessage.defaultAccount`는 구성된 계정 id와 일치할 때 기본 계정 선택을 재정의합니다.

- Messages DB에 대한 전체 디스크 접근 권한이 필요합니다.
- `chat_id:<id>` 대상을 권장합니다. 채팅 목록을 보려면 `imsg chats --limit 20`을 사용하세요.
- `cliPath`는 SSH wrapper를 가리킬 수 있습니다. SCP attachment 가져오기를 위해 `remoteHost`(`host` 또는 `user@host`)를 설정하세요.
- `attachmentRoots`와 `remoteAttachmentRoots`는 인바운드 attachment 경로를 제한합니다(기본값: `/Users/*/Library/Messages/Attachments`).
- SCP는 엄격한 host-key checking을 사용하므로 relay host key가 이미 `~/.ssh/known_hosts`에 있는지 확인하세요.
- `channels.imessage.configWrites`: iMessage에서 시작된 config 쓰기를 허용하거나 거부합니다.
- `channels.imessage.sendTransport`: 일반 아웃바운드 응답에 선호되는 `imsg` RPC 전송 transport입니다. `auto`(기본값)는 실행 중인 경우 기존 채팅에 IMCore bridge를 사용한 다음 AppleScript로 폴백합니다. `bridge`는 private-API 전달이 필요합니다. `applescript`는 공개 Messages automation 경로를 강제합니다.
- `channels.imessage.actions.*`: `imsg status` / `openclaw channels status --probe`로도 제어되는 private API 작업을 활성화합니다.
- `channels.imessage.includeAttachments`는 기본적으로 꺼져 있습니다. agent turn에서 인바운드 media를 기대하기 전에 `true`로 설정하세요.
- bridge/gateway 재시작 후 인바운드 복구는 자동입니다(GUID dedupe와 stale-backlog age fence). 기존 `channels.imessage.catchup.enabled: true` config는 deprecated compatibility profile로 계속 존중됩니다.
- `channels.imessage.groups`: 그룹 registry 및 그룹별 설정입니다. `groupPolicy: "allowlist"`를 사용할 때는 그룹 메시지가 registry gate를 통과할 수 있도록 명시적 `chat_id` 키 또는 `"*"` wildcard entry를 구성하세요.
- `type: "acp"`가 있는 최상위 `bindings[]` entry는 iMessage 대화를 지속 ACP 세션에 bind할 수 있습니다. `match.peer.id`에는 정규화된 handle 또는 명시적 채팅 대상(`chat_id:*`, `chat_guid:*`, `chat_identifier:*`)을 사용하세요. 공유 필드 semantics: [ACP Agents](/ko/tools/acp-agents#persistent-channel-bindings).

<Accordion title="iMessage SSH wrapper 예시">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix는 Plugin 기반이며 `channels.matrix` 아래에서 구성됩니다.

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- 토큰 인증은 `accessToken`을 사용하고, 비밀번호 인증은 `userId` + `password`를 사용합니다.
- `channels.matrix.proxy`는 명시적 HTTP(S) 프록시를 통해 Matrix HTTP 트래픽을 라우팅합니다. 명명된 계정은 `channels.matrix.accounts.<id>.proxy`로 이를 재정의할 수 있습니다.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork`는 비공개/내부 홈서버를 허용합니다. `proxy`와 이 네트워크 옵트인은 서로 독립적인 제어 항목입니다.
- `channels.matrix.defaultAccount`는 다중 계정 설정에서 선호 계정을 선택합니다.
- `channels.matrix.autoJoin`의 기본값은 `off`이므로, `autoJoinAllowlist`와 함께 `autoJoin: "allowlist"`를 설정하거나 `autoJoin: "always"`를 설정하기 전까지 초대된 방과 새 DM 스타일 초대는 무시됩니다.
- `channels.matrix.execApprovals`: Matrix 네이티브 exec 승인 전달 및 승인자 권한 부여.
  - `enabled`: `true`, `false` 또는 `"auto"`(기본값). 자동 모드에서는 `approvers` 또는 `commands.ownerAllowFrom`에서 승인자를 확인할 수 있을 때 exec 승인이 활성화됩니다.
  - `approvers`: exec 요청을 승인할 수 있는 Matrix 사용자 ID(예: `@owner:example.org`).
  - `agentFilter`: 선택적 agent ID 허용 목록. 생략하면 모든 agent의 승인을 전달합니다.
  - `sessionFilter`: 선택적 세션 키 패턴(부분 문자열 또는 정규식).
  - `target`: 승인 프롬프트를 보낼 위치. `"dm"`(기본값), `"channel"`(원본 방) 또는 `"both"`.
  - 계정별 재정의: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope`는 Matrix DM이 세션으로 그룹화되는 방식을 제어합니다. `per-user`(기본값)는 라우팅된 피어 기준으로 공유하고, `per-room`은 각 DM 방을 격리합니다.
- Matrix 상태 프로브와 라이브 디렉터리 조회는 런타임 트래픽과 동일한 프록시 정책을 사용합니다.
- 전체 Matrix 구성, 대상 지정 규칙, 설정 예시는 [Matrix](/ko/channels/matrix)에 문서화되어 있습니다.

### Microsoft Teams

Microsoft Teams는 Plugin 기반이며 `channels.msteams` 아래에서 구성됩니다.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- 여기에서 다루는 핵심 키 경로: `channels.msteams`, `channels.msteams.configWrites`.
- 전체 Teams 구성(자격 증명, Webhook, DM/그룹 정책, 팀별/채널별 재정의)은 [Microsoft Teams](/ko/channels/msteams)에 문서화되어 있습니다.

### IRC

IRC는 Plugin 기반이며 `channels.irc` 아래에서 구성됩니다.

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- 여기에서 다루는 핵심 키 경로: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- 선택적 `channels.irc.defaultAccount`는 구성된 계정 ID와 일치할 때 기본 계정 선택을 재정의합니다.
- 전체 IRC 채널 구성(호스트/포트/TLS/채널/허용 목록/멘션 게이팅)은 [IRC](/ko/channels/irc)에 문서화되어 있습니다.

### 다중 계정(모든 채널)

채널당 여러 계정을 실행합니다(각각 자체 `accountId` 포함).

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `accountId`가 생략되면 `default`가 사용됩니다(CLI + 라우팅).
- Env 토큰은 **기본** 계정에만 적용됩니다.
- 기본 채널 설정은 계정별로 재정의하지 않는 한 모든 계정에 적용됩니다.
- `bindings[].match.accountId`를 사용해 각 계정을 다른 agent로 라우팅합니다.
- 단일 계정 최상위 채널 구성 상태에서 `openclaw channels add`(또는 채널 온보딩)를 통해 기본값이 아닌 계정을 추가하면, OpenClaw는 먼저 계정 범위의 최상위 단일 계정 값을 채널 계정 맵으로 승격하여 원래 계정이 계속 작동하게 합니다. 대부분의 채널은 이를 `channels.<channel>.accounts.default`로 이동합니다. Matrix는 기존의 일치하는 명명/기본 대상을 대신 보존할 수 있습니다.
- 기존 채널 전용 바인딩(`accountId` 없음)은 기본 계정과 계속 일치합니다. 계정 범위 바인딩은 계속 선택 사항입니다.
- `openclaw doctor --fix`도 계정 범위의 최상위 단일 계정 값을 해당 채널에 대해 선택된 승격 계정으로 이동하여 혼합 형태를 복구합니다. 대부분의 채널은 `accounts.default`를 사용합니다. Matrix는 기존의 일치하는 명명/기본 대상을 대신 보존할 수 있습니다.

### 기타 Plugin 채널

많은 Plugin 채널은 `channels.<id>`로 구성되며 전용 채널 페이지에 문서화되어 있습니다(예: Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat, Twitch).
전체 채널 색인은 [채널](/ko/channels)을 참조하세요.

### 그룹 채팅 멘션 게이팅

그룹 메시지는 기본적으로 **멘션 필요**(메타데이터 멘션 또는 안전한 정규식 패턴)입니다. WhatsApp, Telegram, Discord, Google Chat, iMessage 그룹 채팅에 적용됩니다.

표시되는 답장은 별도로 제어됩니다. 일반 그룹, 채널, 내부 WebChat 직접 요청은 기본적으로 자동 최종 전달을 사용합니다. 최종 assistant 텍스트는 레거시 표시 답장 경로를 통해 게시됩니다. agent가 `message(action=send)`를 호출한 뒤에만 표시 출력이 게시되어야 하는 경우 `messages.visibleReplies: "message_tool"` 또는 `messages.groupChat.visibleReplies: "message_tool"`를 선택합니다. 선택된 도구 전용 모드에서 모델이 메시지 도구를 호출하지 않고 최종 텍스트를 반환하면 해당 최종 텍스트는 비공개로 유지되고 Gateway 상세 로그에는 억제된 페이로드 메타데이터가 기록됩니다.

도구 전용 표시 답장은 도구를 안정적으로 호출하는 모델/런타임이 필요하며, GPT 5.5 같은 최신 세대 모델의 공유 주변 방에 권장됩니다. 일부 약한 모델은 최종 텍스트로 답할 수는 있지만 소스에 표시되는 출력은 `message(action=send)`로 보내야 한다는 점을 이해하지 못할 수 있습니다. 이러한 모델에는 `"automatic"`을 사용하여 최종 assistant 턴이 표시 답장 경로가 되도록 하세요. 세션 로그에 `didSendViaMessagingTool: false`인 assistant 텍스트가 표시되면, 모델이 메시지 도구를 호출하는 대신 비공개 최종 텍스트를 생성한 것입니다. 해당 채널에 더 강한 도구 호출 모델로 전환하거나, Gateway 상세 로그에서 억제된 페이로드 요약을 검사하거나, `messages.groupChat.visibleReplies: "automatic"`을 설정하여 모든 그룹/채널 요청에 표시 최종 답장을 사용하세요.

활성 도구 정책에서 메시지 도구를 사용할 수 없는 경우, OpenClaw는 응답을 조용히 억제하는 대신 자동 표시 답장으로 폴백합니다. `openclaw doctor`는 이 불일치에 대해 경고합니다.

이 규칙은 일반 agent 최종 텍스트에 적용됩니다. Plugin 소유 대화 바인딩은 소유 Plugin이 반환한 답장을 클레임된 바인딩 스레드 턴의 표시 응답으로 사용합니다. Plugin은 이러한 바인딩 답장을 위해 `message(action=send)`를 호출할 필요가 없습니다.

**문제 해결: 그룹 @멘션이 입력 중 표시 후 조용해짐(오류 없음)**

증상: 그룹/채널 @멘션에 입력 중 표시기가 나타나고 Gateway 로그에 `dispatch complete (queuedFinal=false, replies=0)`가 보고되지만, 방에 메시지가 도착하지 않습니다. 같은 agent에 대한 DM은 정상적으로 답장합니다.

원인: 그룹/채널 표시 답장 모드가 `"message_tool"`로 해석되어 OpenClaw가 턴을 실행하지만 agent가 `message(action=send)`를 호출하지 않으면 최종 assistant 텍스트를 억제합니다. 이 모드에는 `NO_REPLY` 계약이 없습니다. 메시지 도구 호출이 없으면 소스 답장도 없습니다. 억제는 구성된 동작이므로 오류가 없습니다. 일반 그룹 및 채널 턴은 기본적으로 `"automatic"`이므로, 이 증상은 `messages.groupChat.visibleReplies`(또는 전역 `messages.visibleReplies`)가 명시적으로 `"message_tool"`로 설정된 경우에만 나타납니다. Harness `defaultVisibleReplies`는 여기에 적용되지 않습니다 — 그룹/채널 리졸버는 이를 무시합니다. 이는 직접/소스 채팅에만 영향을 줍니다(Codex Harness는 이런 방식으로 직접 채팅 최종 응답을 억제합니다).

수정: 더 강한 도구 호출 모델을 선택하거나, 명시적 `"message_tool"` 재정의를 제거해 `"automatic"` 기본값으로 돌아가거나, `messages.groupChat.visibleReplies: "automatic"`을 설정하여 모든 그룹/채널 요청에 표시 답장을 강제하세요. Gateway는 파일이 저장된 뒤 `messages` 구성을 핫 리로드합니다. 배포에서 파일 감시 또는 구성 리로드가 비활성화된 경우에만 Gateway를 다시 시작하세요.

**멘션 유형:**

- **메타데이터 멘션**: 네이티브 플랫폼 @-멘션. WhatsApp 셀프 채팅 모드에서는 무시됩니다.
- **텍스트 패턴**: `agents.list[].groupChat.mentionPatterns`의 안전한 정규식 패턴. 잘못된 패턴과 안전하지 않은 중첩 반복은 무시됩니다.
- 멘션 게이팅은 감지가 가능할 때만 적용됩니다(네이티브 멘션 또는 하나 이상의 패턴).

```json5
{
  messages: {
    visibleReplies: "automatic", // force old automatic final replies for direct/source chats
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // always-on unmentioned room chatter becomes quiet context
      visibleReplies: "message_tool", // opt-in; require message(action=send) for visible room replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit`는 전역 기본값을 설정합니다. 채널은 `channels.<channel>.historyLimit`(또는 계정별 설정)로 재정의할 수 있습니다. 비활성화하려면 `0`으로 설정합니다.

`messages.groupChat.unmentionedInbound: "room_event"`는 지원되는 채널에서 멘션되지 않은 상시 그룹/채널 메시지를 조용한 방 컨텍스트로 제출합니다. 멘션된 메시지, 명령, 직접 메시지는 사용자 요청으로 유지됩니다. 전체 Discord, Slack, Telegram 예시는 [주변 방 이벤트](/ko/channels/ambient-room-events)를 참조하세요.

`messages.visibleReplies`는 전역 소스 이벤트 기본값입니다. `messages.groupChat.visibleReplies`는 그룹/채널 소스 이벤트에 대해 이를 재정의합니다. `messages.visibleReplies`가 설정되지 않은 경우 직접/소스 채팅은 선택된 런타임 또는 Harness 기본값을 사용하지만, 내부 WebChat 직접 턴은 Pi/Codex 프롬프트 패리티를 위해 자동 최종 전달을 사용합니다. 표시 출력에 `message(action=send)`를 의도적으로 요구하려면 `messages.visibleReplies: "message_tool"`를 설정하세요. 채널 허용 목록과 멘션 게이팅은 여전히 이벤트 처리 여부를 결정합니다.

#### DM 기록 제한

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

해결 순서: DM별 재정의 → 제공자 기본값 → 제한 없음(모두 보존).

지원됨: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### 셀프 채팅 모드

`allowFrom`에 자신의 번호를 포함하여 셀프 채팅 모드를 활성화합니다(네이티브 @-멘션은 무시하고 텍스트 패턴에만 응답).

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### 명령(채팅 명령 처리)

```json5
{
  commands: {
    native: "auto", // register native commands when supported
    nativeSkills: "auto", // register native skill commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    mcp: false, // allow /mcp
    plugins: false, // allow /plugins
    debug: false, // allow /debug
    restart: true, // allow /restart + gateway restart tool
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // raw | hash
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Command details">

- 이 블록은 명령어 표면을 구성합니다. 현재 내장 + 번들 명령어 카탈로그는 [슬래시 명령어](/ko/tools/slash-commands)를 참조하세요.
- 이 페이지는 전체 명령어 카탈로그가 아니라 **구성 키 참조**입니다. QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, 기기 페어링 `/pair`, 메모리 `/dreaming`, 전화 제어 `/phone`, Talk `/voice`처럼 채널/Plugin이 소유한 명령어는 해당 채널/Plugin 페이지와 [슬래시 명령어](/ko/tools/slash-commands)에 문서화되어 있습니다.
- 텍스트 명령어는 앞에 `/`가 붙은 **독립형** 메시지여야 합니다.
- `native: "auto"`는 Discord/Telegram의 네이티브 명령어를 켜고 Slack은 꺼둡니다.
- `nativeSkills: "auto"`는 Discord/Telegram의 네이티브 Skills 명령어를 켜고 Slack은 꺼둡니다.
- 채널별 재정의: `channels.discord.commands.native`(bool 또는 `"auto"`). Discord의 경우 `false`는 시작 중 네이티브 명령어 등록 및 정리를 건너뜁니다.
- 채널별 네이티브 Skills 등록은 `channels.<provider>.commands.nativeSkills`로 재정의합니다.
- `channels.telegram.customCommands`는 추가 Telegram 봇 메뉴 항목을 추가합니다.
- `bash: true`는 호스트 셸에 대해 `! <cmd>`를 활성화합니다. `tools.elevated.enabled`와 `tools.elevated.allowFrom.<channel>`의 발신자가 필요합니다.
- `config: true`는 `/config`(`openclaw.json` 읽기/쓰기)를 활성화합니다. Gateway `chat.send` 클라이언트의 경우 영구 `/config set|unset` 쓰기에는 `operator.admin`도 필요하며, 읽기 전용 `/config show`는 일반 쓰기 범위 operator 클라이언트에서도 계속 사용할 수 있습니다.
- `mcp: true`는 `mcp.servers` 아래 OpenClaw 관리 MCP 서버 구성을 위한 `/mcp`를 활성화합니다.
- `plugins: true`는 Plugin 탐색, 설치, 활성화/비활성화 제어를 위한 `/plugins`를 활성화합니다.
- `channels.<provider>.configWrites`는 채널별 구성 변경을 제어합니다(기본값: true).
- 다중 계정 채널의 경우 `channels.<provider>.accounts.<id>.configWrites`도 해당 계정을 대상으로 하는 쓰기(예: `/allowlist --config --account <id>` 또는 `/config set channels.<provider>.accounts.<id>...`)를 제어합니다.
- `restart: false`는 `/restart`와 Gateway 재시작 도구 작업을 비활성화합니다. 기본값: `true`.
- `ownerAllowFrom`은 소유자 전용 명령어와 소유자 게이트 채널 작업에 대한 명시적 소유자 허용 목록입니다. `allowFrom`과는 별개입니다.
- `ownerDisplay: "hash"`는 시스템 프롬프트에서 소유자 ID를 해시합니다. 해싱을 제어하려면 `ownerDisplaySecret`을 설정하세요.
- `allowFrom`은 provider별입니다. 설정되면 이것이 **유일한** 권한 부여 소스입니다(채널 허용 목록/페어링 및 `useAccessGroups`는 무시됨).
- `useAccessGroups: false`는 `allowFrom`이 설정되지 않았을 때 명령어가 액세스 그룹 정책을 우회하도록 허용합니다.
- 명령어 문서 맵:
  - 내장 + 번들 카탈로그: [슬래시 명령어](/ko/tools/slash-commands)
  - 채널별 명령어 표면: [채널](/ko/channels)
  - QQ Bot 명령어: [QQ Bot](/ko/channels/qqbot)
  - 페어링 명령어: [페어링](/ko/channels/pairing)
  - LINE 카드 명령어: [LINE](/ko/channels/line)
  - 메모리 Dreaming: [Dreaming](/ko/concepts/dreaming)

</Accordion>

---

## 관련 항목

- [구성 참조](/ko/gateway/configuration-reference) — 최상위 키
- [구성 — 에이전트](/ko/gateway/config-agents)
- [채널 개요](/ko/channels)
