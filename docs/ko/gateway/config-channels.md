---
read_when:
    - 채널 Plugin 구성(인증, 접근 제어, 다중 계정)
    - 채널별 구성 키 문제 해결
    - DM 정책, 그룹 정책 또는 멘션 게이팅 감사하기
summary: '채널 구성: Slack, Discord, Telegram, WhatsApp, Matrix, iMessage 등에서의 액세스 제어, 페어링 및 채널별 키'
title: 구성 — 채널
x-i18n:
    generated_at: "2026-07-12T15:11:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: af161d396b2dc40e3ccb5f00ca4815fc1ad782f96f98dc4a74d65be958530da6
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` 아래의 채널별 구성 키: DM 및 그룹 접근, 다중 계정 설정, 멘션 게이팅, Slack, Discord, Telegram, WhatsApp, Matrix, iMessage 및 기타 채널 Plugin용 채널별 키입니다.

에이전트, 도구, Gateway 런타임 및 기타 최상위 키는 [구성 참조](/ko/gateway/configuration-reference)를 참조하십시오.

## 채널

각 채널은 해당 구성 섹션이 존재하면 자동으로 시작됩니다(`enabled: false`인 경우 제외). Telegram과 iMessage는 핵심 `openclaw` 패키지에 포함되어 제공됩니다. 그 밖의 공식 채널(Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost 등)은 `openclaw plugins install <spec>`을 사용하여 별도의 Plugin으로 설치합니다. 전체 목록과 설치 사양은 [채널](/ko/channels)을 참조하십시오.

### DM 및 그룹 접근

모든 채널은 DM 정책과 그룹 정책을 지원합니다.

| DM 정책            | 동작                                                                    |
| ------------------- | ----------------------------------------------------------------------- |
| `pairing` (기본값)  | 알 수 없는 발신자에게 일회용 페어링 코드가 제공되며 소유자가 승인해야 함 |
| `allowlist`         | `allowFrom`에 있거나 페어링된 허용 저장소에 있는 발신자만 허용           |
| `open`              | 모든 수신 DM 허용(`allowFrom: ["*"]` 필요)                              |
| `disabled`          | 모든 수신 DM 무시                                                       |

| 그룹 정책             | 동작                                                   |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (기본값)  | 구성된 허용 목록과 일치하는 그룹만 허용                |
| `open`                | 그룹 허용 목록을 우회함(멘션 게이팅은 계속 적용됨)     |
| `disabled`            | 모든 그룹/대화방 메시지 차단                           |

<Note>
`channels.defaults.groupPolicy`는 제공자의 `groupPolicy`가 설정되지 않았을 때의 기본값을 지정합니다.
페어링 코드는 1시간 후 만료됩니다. 대기 중인 페어링 요청은 **계정당 3개**로 제한됩니다(채널 및 계정 ID 기준).
제공자 블록이 완전히 누락된 경우(`channels.<provider>` 없음), 런타임 그룹 정책은 시작 경고와 함께 `allowlist`로 대체됩니다(실패 시 차단).
</Note>

### 채널 모델 재정의

`channels.modelByChannel`을 사용하여 특정 채널 ID 또는 DM 상대를 모델에 고정합니다. 값에는 `provider/model` 또는 구성된 모델 별칭을 사용할 수 있습니다. 채널 매핑은 세션에 활성 모델 재정의가 아직 없는 경우에만 적용됩니다(예: `/model`을 통해 설정한 재정의).

그룹/스레드 대화에서는 채널별 그룹 ID, 주제 ID 또는 채널 이름을 키로 사용합니다. DM 대화에서는 채널의 발신자 ID에서 파생된 상대 식별자(`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` 또는 `SenderId`)를 키로 사용합니다. 정확한 키 형식은 채널에 따라 다릅니다.

| 채널     | DM 키 형식          | 예시                                         |
| -------- | ------------------- | -------------------------------------------- |
| Discord  | 원시 사용자 ID      | `987654321`                                  |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | Matrix 사용자 ID    | `@user:matrix.org`                           |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | 원시 사용자 ID      | `123456789`                                  |
| WhatsApp | 전화번호 또는 JID   | `15551234567`                                |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.6-sol",
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

DM 전용 키는 DM 대화에서만 일치하며 그룹/스레드 라우팅에는 영향을 주지 않습니다.

### 채널 기본값 및 Heartbeat

여러 제공자에서 공유할 그룹 정책 및 Heartbeat 동작에는 `channels.defaults`를 사용합니다.

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

- `channels.defaults.groupPolicy`: 제공자 수준의 `groupPolicy`가 설정되지 않았을 때 사용할 대체 그룹 정책입니다.
- `channels.defaults.contextVisibility`: 모든 채널의 기본 보충 컨텍스트 표시 모드입니다. 값: `all`(기본값, 인용문/스레드/기록 컨텍스트를 모두 포함), `allowlist`(허용 목록에 있는 발신자의 컨텍스트만 포함), `allowlist_quote`(허용 목록과 같지만 명시적인 인용/답글 컨텍스트는 유지). 채널별 재정의: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: Heartbeat 출력에 정상 채널 상태를 포함합니다(기본값 `false`).
- `channels.defaults.heartbeat.showAlerts`: Heartbeat 출력에 성능 저하/오류 상태를 포함합니다(기본값 `true`).
- `channels.defaults.heartbeat.useIndicator`: 간결한 표시기 형식의 Heartbeat 출력을 렌더링합니다(기본값 `true`).

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
      maxMs: 30000,
      factor: 1.8,
      jitter: 0.25,
      maxAttempts: 12, // 0 = 무한 재시도
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // 파란색 확인 표시(자기 자신과의 채팅 모드에서는 false)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

- `web.whatsapp.keepAliveIntervalMs`(기본값 `25000`), `connectTimeoutMs`(기본값 `60000`) 및 `defaultQueryTimeoutMs`(기본값 `60000`)로 Baileys 소켓을 조정합니다.
- `web.reconnect` 기본값: `initialMs: 2000`, `maxMs: 30000`, `factor: 1.8`, `jitter: 0.25`, `maxAttempts: 12`. `maxAttempts: 0`은 중단하지 않고 무한히 재시도합니다.
- `type: "acp"`인 최상위 `bindings[]` 항목은 WhatsApp DM 및 그룹의 영구 ACP 바인딩을 구성합니다. `match.peer.id`에 E.164 직접 전화번호 또는 WhatsApp 그룹 JID를 사용하십시오. 필드 의미는 [ACP 에이전트](/ko/tools/acp-agents#persistent-channel-bindings)에 공통으로 설명되어 있습니다.

<Accordion title="다중 계정 WhatsApp">

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

- 발신 명령은 계정 `default`가 있으면 기본적으로 해당 계정을 사용하고, 없으면 구성된 계정 ID 중 정렬상 첫 번째 계정을 사용합니다.
- 선택적 `channels.whatsapp.defaultAccount`는 구성된 계정 ID와 일치할 때 이러한 대체 기본 계정 선택을 재정의합니다.
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
          systemPrompt: "답변을 간결하게 유지하십시오.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "주제에서 벗어나지 마십시오.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git 백업" },
        { command: "generate", description: "이미지 생성" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (기본값: partial)
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
      trustedLocalFileRoots: ["/srv/telegram-bot-api-data"],
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- 봇 토큰: `channels.telegram.botToken` 또는 `channels.telegram.tokenFile`(일반 파일만 허용되며 심볼릭 링크는 거부됨)을 사용하며, 기본 계정의 대체 값으로 `TELEGRAM_BOT_TOKEN`을 사용합니다.
- `apiRoot`는 Telegram Bot API 루트만 나타냅니다. `https://api.telegram.org/bot<TOKEN>`이 아니라 `https://api.telegram.org` 또는 자체 호스팅/프록시 루트를 사용하십시오. `openclaw doctor --fix`는 실수로 추가된 후행 `/bot<TOKEN>` 접미사를 제거합니다.
- `--local` 모드의 자체 호스팅 Bot API 서버에서는 `trustedLocalFileRoots`에 OpenClaw가 읽을 수 있는 호스트 경로를 나열합니다. 서버 데이터 볼륨을 OpenClaw 호스트에 마운트하고 데이터 루트 또는 토큰별 디렉터리를 구성하십시오. `/var/lib/telegram-bot-api` 아래의 컨테이너 경로는 해당 루트에 매핑됩니다. 그 밖의 절대 경로는 계속 거부됩니다.
- 선택적 `channels.telegram.defaultAccount`는 구성된 계정 ID와 일치할 때 기본 계정 선택을 재정의합니다.
- 다중 계정 설정(계정 ID 2개 이상)에서는 대체 라우팅을 방지하기 위해 명시적인 기본값(`channels.telegram.defaultAccount` 또는 `channels.telegram.accounts.default`)을 설정하십시오. 이 값이 누락되거나 유효하지 않으면 `openclaw doctor`가 경고합니다.
- `configWrites: false`는 Telegram에서 시작된 구성 쓰기(슈퍼그룹 ID 마이그레이션, `/config set|unset`)를 차단합니다.
- `type: "acp"`인 최상위 `bindings[]` 항목은 포럼 주제의 영구 ACP 바인딩을 구성합니다(`match.peer.id`에 표준 `chatId:topic:topicId` 사용). 필드 의미는 [ACP 에이전트](/ko/tools/acp-agents#persistent-channel-bindings)에 공통으로 설명되어 있습니다.
- Telegram 스트림 미리보기는 `sendMessage` + `editMessageText`를 사용합니다(DM 및 그룹 채팅에서 작동).
- `network.dnsResultOrder`의 기본값은 일반적인 IPv6 가져오기 실패를 방지하기 위한 `"ipv4first"`입니다.
- 재시도 정책은 [재시도 정책](/ko/concepts/retry)을 참조하십시오.

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
              systemPrompt: "짧게만 답변하십시오.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      suppressEmbeds: true,
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord 기본값: progress)
        chunkMode: "length", // length | newline
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

- 토큰: `channels.discord.token`이며, 기본 계정에서는 `DISCORD_BOT_TOKEN`을 대체 값으로 사용합니다.
- 명시적인 Discord `token`을 제공하는 직접 아웃바운드 호출은 해당 호출에 그 토큰을 사용합니다. 계정 재시도/정책 설정은 계속 활성 런타임 스냅샷에서 선택된 계정의 값을 사용합니다.
- 선택 사항인 `channels.discord.defaultAccount`는 구성된 계정 ID와 일치할 때 기본 계정 선택을 재정의합니다.
- 전송 대상에는 `user:<id>`(DM) 또는 `channel:<id>`(길드 채널)를 사용합니다. 숫자로만 된 ID는 거부됩니다.
- 길드 슬러그는 소문자이며 공백은 `-`로 대체됩니다. 채널 키는 슬러그로 변환된 이름을 사용합니다(`#` 제외). 길드 ID 사용을 권장합니다.
- 봇이 작성한 메시지는 기본적으로 무시됩니다. `allowBots: true`로 활성화할 수 있으며, 봇을 멘션한 봇 메시지만 허용하려면 `allowBots: "mentions"`를 사용합니다(자체 메시지는 계속 필터링됩니다).
- 봇이 작성한 인바운드 메시지를 지원하는 채널은 공통 [봇 루프 방지](/ko/channels/bot-loop-protection)를 사용할 수 있습니다. 기본 쌍별 예산은 `channels.defaults.botLoopProtection`에서 설정한 다음, 특정 표면에 다른 제한이 필요할 때만 채널 또는 계정에서 재정의합니다.
- `channels.discord.guilds.<id>.ignoreOtherMentions`와 채널별 재정의는 봇이 아닌 다른 사용자나 역할을 멘션한 메시지를 제외합니다(@everyone/@here 제외).
- `channels.discord.mentionAliases`는 전송 전에 안정적인 아웃바운드 `@handle` 텍스트를 Discord 사용자 ID에 매핑하므로, 일시적인 디렉터리 캐시가 비어 있어도 알려진 팀원을 결정적으로 멘션할 수 있습니다. 계정별 재정의는 `channels.discord.accounts.<accountId>.mentionAliases` 아래에 있습니다.
- `maxLinesPerMessage`(기본값 `17`)는 메시지가 2000자 미만이어도 세로로 긴 메시지를 분할합니다.
- `channels.discord.suppressEmbeds`의 기본값은 `true`이므로, 비활성화하지 않는 한 아웃바운드 URL이 Discord 링크 미리 보기로 확장되지 않습니다. 명시적인 `embeds` 페이로드는 계속 정상적으로 전송되며, 메시지별 도구 호출에서 `suppressEmbeds`로 재정의할 수 있습니다.
- `channels.discord.threadBindings`는 Discord 스레드 바인딩 라우팅을 제어합니다.
  - `enabled`: 스레드 바인딩 세션 기능(`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, 바인딩된 전송/라우팅)에 대한 Discord 재정의
  - `idleHours`: 비활성 상태 자동 포커스 해제 시간에 대한 Discord 재정의(시간 단위, `0`은 비활성화)
  - `maxAgeHours`: 최대 유지 시간에 대한 Discord 재정의(시간 단위, `0`은 비활성화)
  - `spawnSessions`: `sessions_spawn({ thread: true })` 및 ACP 스레드 생성 시 자동 스레드 생성/바인딩을 위한 스위치(기본값: `true`)
  - `defaultSpawnContext`: 스레드 바인딩 생성에 사용하는 네이티브 하위 에이전트 컨텍스트(기본값 `"fork"`)
- `type: "acp"`인 최상위 `bindings[]` 항목은 채널과 스레드의 영구 ACP 바인딩을 구성합니다(`match.peer.id`에 채널/스레드 ID 사용). 필드 의미는 [ACP 에이전트](/ko/tools/acp-agents#persistent-channel-bindings)에 공통으로 설명되어 있습니다.
- `channels.discord.ui.components.accentColor`는 Discord components v2 컨테이너의 강조색을 설정합니다.
- `channels.discord.agentComponents.ttlMs`는 전송된 Discord 컴포넌트 콜백이 등록된 상태로 유지되는 시간을 제어합니다. 기본값은 `1800000`(30분), 최댓값은 `86400000`(24시간)입니다. 계정별 재정의는 `channels.discord.accounts.<accountId>.agentComponents.ttlMs` 아래에 있습니다. 워크플로에 맞는 가장 짧은 TTL을 사용하는 것이 좋습니다.
- `channels.discord.voice`는 Discord 음성 채널 대화와 선택적 자동 참여 + LLM + TTS 재정의를 활성화합니다. 텍스트 전용 Discord 구성에서는 음성이 기본적으로 꺼져 있습니다. 사용하려면 `channels.discord.voice.enabled=true`로 설정합니다.
- `channels.discord.voice.model`은 선택적으로 Discord 음성 채널 응답에 사용하는 LLM 모델을 재정의합니다.
- `channels.discord.voice.daveEncryption`(기본값 `true`)과 `channels.discord.voice.decryptionFailureTolerance`(기본값 `24`)는 `@discordjs/voice` DAVE 옵션으로 전달됩니다.
- `channels.discord.voice.connectTimeoutMs`는 `/vc join` 및 자동 참여 시도에서 초기 `@discordjs/voice` Ready 대기 시간을 제어합니다(기본값 `30000`).
- `channels.discord.voice.reconnectGraceMs`는 연결이 끊긴 음성 세션이 재연결 신호 상태로 진입할 때까지 OpenClaw가 기다리는 시간을 제어합니다. 이 시간이 지나면 세션을 폐기합니다(기본값 `15000`).
- 다른 사용자의 발화 시작 이벤트는 Discord 음성 재생을 중단하지 않습니다. 피드백 루프를 방지하기 위해 OpenClaw는 TTS 재생 중 새로운 음성 캡처를 무시합니다.
- 또한 OpenClaw는 암호 해독 실패가 반복되면 음성 세션에서 나갔다가 다시 참여하여 음성 수신 복구를 시도합니다.
- `channels.discord.streaming`은 표준 스트림 모드 키입니다. Discord의 기본값은 `streaming.mode: "progress"`이므로 도구/작업 진행 상황이 편집되는 하나의 미리 보기 메시지에 표시됩니다. 비활성화하려면 `streaming.mode: "off"`로 설정합니다. 기존의 평면 키(`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`)는 더 이상 런타임에서 읽지 않습니다. 저장된 구성을 마이그레이션하려면 `openclaw doctor --fix`를 실행합니다.
- `channels.discord.autoPresence`는 런타임 가용성을 봇 상태로 매핑하고(정상 => 온라인, 성능 저하 => 자리 비움, 소진 => 방해 금지), 선택적 상태 텍스트 재정의를 허용합니다.
- `channels.discord.dangerouslyAllowNameMatching`은 변경 가능한 이름/태그 일치를 다시 활성화합니다(비상용 호환 모드).
- `channels.discord.execApprovals`: Discord 네이티브 실행 승인 전송 및 승인자 권한 부여입니다.
  - `enabled`: `true`, `false` 또는 `"auto"`(기본값)입니다. 자동 모드에서는 `approvers` 또는 `commands.ownerAllowFrom`에서 승인자를 확인할 수 있을 때 실행 승인이 활성화됩니다.
  - `approvers`: 실행 요청을 승인할 수 있는 Discord 사용자 ID입니다. 생략하면 `commands.ownerAllowFrom`을 대체 값으로 사용합니다.
  - `agentFilter`: 선택적 에이전트 ID 허용 목록입니다. 모든 에이전트의 승인을 전달하려면 생략합니다.
  - `sessionFilter`: 선택적 세션 키 패턴입니다(부분 문자열 또는 정규식).
  - `target`: 승인 프롬프트를 보낼 위치입니다. `"dm"`(기본값)은 승인자의 DM으로 보내고, `"channel"`은 요청이 시작된 채널로 보내며, `"both"`는 두 곳 모두로 보냅니다. 대상에 `"channel"`이 포함되면 확인된 승인자만 버튼을 사용할 수 있습니다.
  - `cleanupAfterResolve`: `true`이면 승인, 거부 또는 시간 초과 후 승인 DM을 삭제합니다.

**반응 알림 모드:** `off`(없음), `own`(봇의 메시지, 기본값), `all`(모든 메시지), `allowlist`(모든 메시지에서 `guilds.<id>.users`에 포함된 사용자).

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
- 서비스 계정 SecretRef도 지원합니다(`serviceAccountRef`).
- 환경 변수 대체 값: `GOOGLE_CHAT_SERVICE_ACCOUNT` 또는 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`(기본 계정만 해당)입니다.
- 전송 대상에는 `spaces/<spaceId>` 또는 `users/<userId>`를 사용합니다.
- `channels.googlechat.dangerouslyAllowNameMatching`은 변경 가능한 이메일 주체 일치를 다시 활성화합니다(비상용 호환 모드).

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
        C123: { enabled: true, requireMention: true, allowBots: false },
        "#general": {
          enabled: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "짧게만 답변하십시오.",
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
        initialHistoryLimit: 20,
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
      streaming: {
        mode: "partial", // off | partial | block | progress
        chunkMode: "length", // length | newline
        nativeTransport: true, // mode=partial일 때 Slack 네이티브 스트리밍 API 사용
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

- **소켓 모드**에는 `botToken`과 `appToken`이 모두 필요합니다(기본 계정 환경 변수 폴백에는 `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`).
- **HTTP 모드**에는 `botToken`과 `signingSecret`이 필요합니다(루트 또는 계정별).
- `enterpriseOrgInstall: true`로 설정하면 계정이 Slack Enterprise Grid의
  조직 전체 이벤트 경로를 사용합니다. 시작 시 `auth.test`로 봇 토큰을 검증하며,
  구성된 모드가 Slack의 설치 ID와 일치하지 않으면 실패합니다.
  엔터프라이즈 DM은 비활성화하거나, 유효한 `allowFrom: ["*"]`와 함께
  `dmPolicy: "open"`을 사용해야 합니다. 채널 및 사용자 정책에는 안정적인 Slack ID를
  사용해야 하며, 변경 가능한 이름과 지원되지 않는 채널 접두사는 시작 실패를 유발합니다.
  V1은 직접 소켓 모드 또는 HTTP `message` 및 `app_mention` 이벤트와 즉시 응답만
  처리합니다. 릴레이, 명령, 상호작용, App Home, 반응 이벤트 리스너, 고정,
  작업 도구, 네이티브 승인, 바인딩, 지연 전달 및 선제적 전송은 사용할 수 없습니다.
  리스너가 소유하는 확인 응답, 입력 중 표시 및 상태 반응은 `reactions:write`로 계속
  사용할 수 있지만, 인바운드 반응 알림과 반응 작업 도구는 사용할 수 없습니다.
  최소 권한 매니페스트, 설정 워크플로 및 전체 제한 사항은
  [Enterprise Grid 조직 전체 설치](/ko/channels/slack#enterprise-grid-org-wide-installs)를
  참조하십시오.
- `socketMode`는 Slack SDK 소켓 모드 전송 조정 설정을 공개 Bolt 수신기 API로 전달합니다. ping/pong 시간 초과 또는 오래된 웹소켓 동작을 조사할 때만 사용하십시오. `clientPingTimeout`의 기본값은 `15000`이며, `serverPingTimeout`과 `pingPongLoggingEnabled`는 구성된 경우에만 전달됩니다.
- `botToken`, `appToken`, `signingSecret`, `userToken`에는 일반 텍스트
  문자열 또는 SecretRef 객체를 사용할 수 있습니다.
- Slack 계정 스냅샷은 `botTokenSource`, `botTokenStatus`,
  `appTokenStatus`, HTTP 모드의 `signingSecretStatus`와 같은
  자격 증명별 소스/상태 필드를 노출합니다. `configured_unavailable`은 계정이
  SecretRef를 통해 구성되었지만 현재 명령/런타임 경로에서 비밀 값을
  확인할 수 없음을 의미합니다.
- `configWrites: false`는 Slack에서 시작된 구성 쓰기를 차단합니다.
- 선택적 `channels.slack.defaultAccount`는 구성된 계정 ID와 일치할 때 기본 계정 선택을 재정의합니다.
- `channels.slack.streaming.mode`는 정식 Slack 스트림 모드 키입니다(기본값 `"partial"`). `channels.slack.streaming.nativeTransport`는 Slack의 네이티브 스트리밍 전송을 제어합니다(기본값 `true`). 레거시 `streamMode`, 불리언 `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce`, `nativeStreaming` 값은 더 이상 런타임에서 읽지 않습니다. `openclaw doctor --fix`를 실행하여 지속 구성 설정을 `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`로 마이그레이션하십시오.
- `unfurlLinks`와 `unfurlMedia`는 봇 응답에 대해 Slack의 `chat.postMessage` 링크 및 미디어 펼치기 불리언을 전달합니다. `unfurlLinks`의 기본값은 `false`이므로 활성화하지 않는 한 아웃바운드 봇 링크가 인라인으로 확장되지 않습니다. `unfurlMedia`는 구성하지 않으면 생략됩니다. 계정 하나에 대해 최상위 값을 재정의하려면 `channels.slack.accounts.<accountId>`에서 해당 값을 설정하십시오.
- 전달 대상에는 `user:<id>`(DM) 또는 `channel:<id>`를 사용하십시오.

**반응 알림 모드:** `off`, `own`(기본값), `all`, `allowlist`(`reactionAllowlist`에서 가져옴).

**스레드 세션 격리:** `thread.historyScope`는 스레드별(기본값)이거나 채널 전체에서 공유됩니다. `thread.inheritParent`는 상위 채널 대화 기록을 새 스레드에 복사합니다. `thread.initialHistoryLimit`(기본값 `20`)은 새 스레드 세션이 시작될 때 가져오는 기존 스레드 메시지 수를 제한하며, `0`은 스레드 기록 가져오기를 비활성화합니다.

- Slack 네이티브 스트리밍과 Slack 어시스턴트 스타일의 "입력 중..." 스레드 상태에는 응답 스레드 대상이 필요합니다. 최상위 DM은 기본적으로 스레드 외부에 유지되므로, 스레드 스타일의 네이티브 스트림/상태 미리보기를 표시하는 대신 Slack 초안 게시 후 편집 미리보기를 통해 계속 스트리밍할 수 있습니다.
- `typingReaction`은 응답이 실행되는 동안 인바운드 Slack 메시지에 임시 반응을 추가하고 완료되면 제거합니다. `"hourglass_flowing_sand"`와 같은 Slack 이모지 단축 코드를 사용하십시오.
- `channels.slack.execApprovals`: Slack 네이티브 승인 클라이언트 전달 및 실행 승인자 권한 부여입니다. 스키마는 Discord와 동일하며 `enabled`(`true`/`false`/`"auto"`), `approvers`(Slack 사용자 ID), `agentFilter`, `sessionFilter`, `target`(`"dm"`, `"channel"` 또는 `"both"`)을 사용합니다. Slack Plugin 승인자를 확인할 수 있으면 Plugin 승인은 Slack에서 시작된 요청에 이 네이티브 클라이언트 경로를 사용할 수 있습니다. Slack 네이티브 Plugin 승인 전달은 Slack에서 시작된 세션 또는 Slack 대상에 대해 `approvals.plugin`을 통해 활성화할 수도 있습니다. Plugin 승인은 실행 승인자가 아니라 `allowFrom`과 기본 라우팅의 Slack Plugin 승인자를 사용합니다.

| 작업 그룹 | 기본값 | 참고                  |
| ------------ | ------- | ---------------------- |
| reactions    | 활성화됨 | 반응 추가 + 반응 목록 |
| messages     | 활성화됨 | 읽기/전송/편집/삭제  |
| pins         | 활성화됨 | 고정/고정 해제/목록         |
| memberInfo   | 활성화됨 | 구성원 정보            |
| emojiList    | 활성화됨 | 사용자 지정 이모지 목록      |

### Mattermost

Mattermost는 Discord, Slack, WhatsApp과 동일한 방식으로 별도의 Plugin으로 설치합니다.

```bash
openclaw plugins install @openclaw/mattermost
```

버전을 고정하기 전에 현재 dist-tag는 [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)에서 확인하십시오.

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
        native: true, // 선택 사항
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // 리버스 프록시/공개 배포를 위한 선택적 명시 URL
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

채팅 모드: `oncall`(@멘션 시 응답, 기본값), `onmessage`(모든 메시지), `onchar`(트리거 접두사로 시작하는 메시지).

Mattermost 네이티브 명령이 활성화된 경우:

- `commands.callbackPath`는 전체 URL이 아니라 경로여야 합니다(예: `/api/channels/mattermost/command`).
- `commands.callbackUrl`은 OpenClaw Gateway 엔드포인트로 확인되어야 하며 Mattermost 서버에서 접근할 수 있어야 합니다.
- 네이티브 슬래시 콜백은 슬래시 명령 등록 중 Mattermost가 반환한
  명령별 토큰으로 인증됩니다. 등록에 실패하거나 활성화된 명령이 없으면
  OpenClaw는 `Unauthorized: invalid command token.`으로
  콜백을 거부합니다.
- 비공개/tailnet/내부 콜백 호스트의 경우 Mattermost에서
  `ServiceSettings.AllowedUntrustedInternalConnections`에 콜백 호스트/도메인을 포함해야 할 수 있습니다.
  전체 URL이 아닌 호스트/도메인 값을 사용하십시오.
- `channels.mattermost.configWrites`: Mattermost에서 시작된 구성 쓰기를 허용하거나 거부합니다.
- `channels.mattermost.requireMention`: 채널에서 응답하기 전에 `@mention`을 요구합니다.
- `channels.mattermost.groups.<channelId>.requireMention`: 채널별 멘션 게이트 재정의입니다(기본값에는 `"*"` 사용).
- 선택적 `channels.mattermost.defaultAccount`는 구성된 계정 ID와 일치할 때 기본 계정 선택을 재정의합니다.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // 선택적 계정 바인딩
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

**반응 알림 모드:** `off`, `own`(기본값), `all`, `allowlist`(`reactionAllowlist`에서 가져옴).

- `channels.signal.account`: 채널 시작을 특정 Signal 계정 ID에 고정합니다.
- `channels.signal.configWrites`: Signal에서 시작된 구성 쓰기를 허용하거나 거부합니다.
- 선택적 `channels.signal.defaultAccount`는 구성된 계정 ID와 일치할 때 기본 계정 선택을 재정의합니다.

### iMessage

OpenClaw는 `imsg rpc`를 실행합니다(stdio를 통한 JSON-RPC). 데몬이나 포트는 필요하지 않습니다. 호스트에서 메시지 데이터베이스 및 자동화 권한을 부여할 수 있는 경우 새로운 OpenClaw iMessage 설정에 권장되는 경로입니다.

BlueBubbles 지원은 제거되었습니다. 현재 OpenClaw에서는 `channels.bluebubbles`가 지원되는 런타임 구성 표면이 아닙니다. 이전 구성을 `channels.imessage`로 마이그레이션하십시오. 간략한 내용은 [BlueBubbles 제거 및 imsg iMessage 경로](/ko/announcements/bluebubbles-imessage)를, 전체 변환표는 [BlueBubbles에서 이전하기](/ko/channels/imessage-from-bluebubbles)를 참조하십시오.

Gateway가 로그인된 메시지 Mac에서 실행되고 있지 않으면 `channels.imessage.enabled=true`를 유지하고 `channels.imessage.cliPath`를 해당 Mac에서 `imsg "$@"`를 실행하는 SSH 래퍼로 설정하십시오. 기본 로컬 `imsg` 경로는 macOS에서만 사용할 수 있습니다.

프로덕션 전송에 SSH 래퍼를 사용하기 전에 정확히 해당 래퍼를 통한 아웃바운드 `imsg send`를 검증하십시오. 일부 macOS TCC 상태에서는 메시지 자동화 권한이 `/usr/libexec/sshd-keygen-wrapper`에 할당되어 읽기와 프로브는 작동하지만 전송은 AppleEvents `-1743` 오류로 실패할 수 있습니다. [iMessage](/ko/channels/imessage)의 SSH 래퍼 문제 해결 섹션을 참조하십시오.

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

- 선택적 `channels.imessage.defaultAccount`는 구성된 계정 ID와 일치할 때 기본 계정 선택을 재정의합니다.
- Messages DB에 대한 Full Disk Access가 필요합니다.
- `chat_id:<id>` 대상을 권장합니다. 채팅 목록을 표시하려면 `imsg chats --limit 20`을 사용하십시오.
- `cliPath`는 SSH 래퍼를 가리킬 수 있습니다. SCP 첨부 파일 가져오기를 위해 `remoteHost`(`host` 또는 `user@host`)를 설정하십시오.
- `attachmentRoots`와 `remoteAttachmentRoots`는 인바운드 첨부 파일 경로를 제한합니다(기본값: `/Users/*/Library/Messages/Attachments`).
- SCP는 엄격한 호스트 키 검사를 사용하므로 릴레이 호스트 키가 이미 `~/.ssh/known_hosts`에 있는지 확인하십시오.
- `channels.imessage.configWrites`: iMessage에서 시작된 구성 쓰기를 허용하거나 거부합니다.
- `channels.imessage.sendTransport`: 일반 아웃바운드 응답에 사용할 기본 `imsg` RPC 전송 방식입니다. `auto`(기본값)는 IMCore 브리지가 실행 중일 때 기존 채팅에 이를 사용한 후 AppleScript로 대체합니다. `bridge`는 비공개 API를 통한 전송이 필요하며, `applescript`는 공개 Messages 자동화 경로를 강제합니다.
- `channels.imessage.actions.*`: `imsg status` / `openclaw channels status --probe`에 의해서도 제한되는 비공개 API 작업을 활성화합니다.
- `channels.imessage.includeAttachments`는 기본적으로 꺼져 있습니다. 에이전트 턴에서 인바운드 미디어를 받으려면 먼저 `true`로 설정하십시오.
- 브리지/Gateway 재시작 후의 인바운드 복구는 자동입니다(GUID 중복 제거 및 오래된 백로그의 기간 제한). 기존 `channels.imessage.catchup.enabled: true` 구성은 더 이상 권장되지 않는 호환성 프로필로 계속 적용됩니다. `catchup`은 기본적으로 비활성화되어 있습니다.
- `channels.imessage.groups`: 그룹 레지스트리 및 그룹별 설정입니다. `groupPolicy: "allowlist"`를 사용할 경우 그룹 메시지가 레지스트리 게이트를 통과할 수 있도록 명시적인 `chat_id` 키 또는 `"*"` 와일드카드 항목을 구성하십시오.
- `type: "acp"`인 최상위 `bindings[]` 항목은 iMessage 대화를 영구 ACP 세션에 바인딩할 수 있습니다. `match.peer.id`에 정규화된 핸들 또는 명시적인 채팅 대상(`chat_id:*`, `chat_guid:*`, `chat_identifier:*`)을 사용하십시오. 공유 필드의 의미는 [ACP 에이전트](/ko/tools/acp-agents#persistent-channel-bindings)를 참조하십시오.

<Accordion title="iMessage SSH 래퍼 예시">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix는 Plugin 기반이며 `channels.matrix`에서 구성합니다.

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
- `channels.matrix.proxy`는 명시적인 HTTP(S) 프록시를 통해 Matrix HTTP 트래픽을 라우팅합니다. 명명된 계정은 `channels.matrix.accounts.<id>.proxy`로 이를 재정의할 수 있습니다.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork`는 비공개/내부 홈서버를 허용합니다. `proxy`와 이 네트워크 옵트인은 서로 독립적인 제어 항목입니다.
- `channels.matrix.defaultAccount`는 다중 계정 설정에서 기본 계정을 선택합니다.
- `channels.matrix.autoJoin`의 기본값은 `"off"`이므로, `autoJoinAllowlist`와 함께 `autoJoin: "allowlist"`를 설정하거나 `autoJoin: "always"`를 설정하기 전까지 초대된 방과 새로운 DM 형식의 초대는 무시됩니다.
- `channels.matrix.execApprovals`: Matrix 네이티브 실행 승인 전달 및 승인자 권한 부여입니다.
  - `enabled`: `true`, `false` 또는 `"auto"`(기본값)입니다. 자동 모드에서는 `approvers` 또는 `commands.ownerAllowFrom`에서 승인자를 확인할 수 있을 때 실행 승인이 활성화됩니다.
  - `approvers`: 실행 요청을 승인할 수 있는 Matrix 사용자 ID(예: `@owner:example.org`)입니다.
  - `agentFilter`: 선택적 에이전트 ID 허용 목록입니다. 모든 에이전트의 승인을 전달하려면 생략하십시오.
  - `sessionFilter`: 선택적 세션 키 패턴(부분 문자열 또는 정규식)입니다.
  - `target`: 승인 프롬프트를 보낼 위치입니다. `"dm"`(기본값), `"channel"`(요청이 시작된 방) 또는 `"both"`입니다.
  - 계정별 재정의: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope`는 Matrix DM을 세션으로 그룹화하는 방식을 제어합니다. `per-user`(기본값)는 라우팅된 상대별로 공유하며, `per-room`은 각 DM 방을 분리합니다.
- Matrix 상태 프로브와 실시간 디렉터리 조회는 런타임 트래픽과 동일한 프록시 정책을 사용합니다.
- 전체 Matrix 구성, 대상 지정 규칙 및 설정 예시는 [Matrix](/ko/channels/matrix)에 문서화되어 있습니다.

### Microsoft Teams

Microsoft Teams는 Plugin 기반이며 `channels.msteams`에서 구성합니다.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, 팀/채널 정책:
      // /channels/msteams 참조
    },
  },
}
```

- 여기에서 다루는 핵심 키 경로: `channels.msteams`, `channels.msteams.configWrites`.
- 전체 Teams 구성(자격 증명, webhook, DM/그룹 정책, 팀별/채널별 재정의)은 [Microsoft Teams](/ko/channels/msteams)에 문서화되어 있습니다.

### IRC

IRC는 Plugin 기반이며 `channels.irc`에서 구성합니다.

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
- 전체 IRC 채널 구성(호스트/포트/TLS/채널/허용 목록/멘션 게이트)은 [IRC](/ko/channels/irc)에 문서화되어 있습니다.

### 다중 계정(모든 채널)

채널별로 여러 계정을 실행합니다(각 계정은 자체 `accountId` 사용).

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
- 환경 변수 토큰은 **기본** 계정에만 적용됩니다.
- 기본 채널 설정은 계정별로 재정의하지 않는 한 모든 계정에 적용됩니다.
- 각 계정을 서로 다른 에이전트로 라우팅하려면 `bindings[].match.accountId`를 사용하십시오.
- 단일 계정용 최상위 채널 구성을 계속 사용하는 동안 `openclaw channels add`(또는 채널 온보딩)를 통해 기본 계정이 아닌 계정을 추가하면, OpenClaw는 먼저 계정 범위의 최상위 단일 계정 값을 채널 계정 맵으로 승격하여 기존 계정이 계속 작동하도록 합니다. 대부분의 채널은 해당 값을 `channels.<channel>.accounts.default`로 이동합니다. Matrix는 기존에 일치하는 명명된/기본 대상을 대신 유지할 수 있습니다.
- 기존의 채널 전용 바인딩(`accountId` 없음)은 계속 기본 계정과 일치합니다. 계정 범위 바인딩은 선택 사항으로 유지됩니다.
- `openclaw doctor --fix`도 계정 범위의 최상위 단일 계정 값을 해당 채널에 선택된 승격 계정으로 이동하여 혼합된 구조를 복구합니다. 대부분의 채널은 `accounts.default`를 사용합니다. Matrix는 기존에 일치하는 명명된/기본 대상을 대신 유지할 수 있습니다.

### 기타 Plugin 채널

많은 Plugin 채널은 `channels.<id>`로 구성되며 전용 채널 페이지에 문서화되어 있습니다(예: Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch, Zalo).
전체 채널 색인은 [채널](/ko/channels)을 참조하십시오.

### 그룹 채팅 멘션 게이트

그룹 메시지는 기본적으로 **멘션 필수**입니다(메타데이터 멘션 또는 안전한 정규식 패턴). WhatsApp, Telegram, Discord, Google Chat 및 iMessage 그룹 채팅에 적용됩니다.

표시되는 응답은 별도로 제어됩니다. 일반 그룹, 채널 및 내부 WebChat 직접 요청은 기본적으로 최종 응답을 자동 전달합니다. 즉, 최종 어시스턴트 텍스트가 기존의 표시 응답 경로를 통해 게시됩니다. 에이전트가 `message(action=send)`를 호출한 후에만 표시되는 출력을 게시해야 한다면 `messages.visibleReplies: "message_tool"` 또는 `messages.groupChat.visibleReplies: "message_tool"`을 사용하십시오. 도구 전용 모드를 선택한 상태에서 모델이 메시지 도구를 호출하지 않고 실질적인 최종 답변을 반환하면 해당 최종 텍스트는 비공개로 유지되고, Gateway 상세 로그에 억제된 페이로드 메타데이터가 기록되며, OpenClaw는 동일한 응답을 `message(action=send)`로 전달하도록 모델에 요청하는 복구 재시도를 한 번 큐에 추가합니다.

도구 전용 표시 응답에는 도구를 안정적으로 호출하는 모델/런타임이 필요하며, GPT-5.6 Sol과 같은 최신 세대 모델을 사용하는 공유 상시 대화방에 권장됩니다. 일부 성능이 낮은 모델은 최종 텍스트로 답변할 수 있지만 소스에 표시되는 출력은 `message(action=send)`로 보내야 한다는 점을 이해하지 못할 수 있습니다. OpenClaw는 최종 응답이 실질적이고, 소스 턴이 방 이벤트가 아니며, 전송 정책이 전달을 거부하지 않았고, 소스 응답이 아직 전송되지 않은 경우에만 기본적으로 흔히 발생하는 최종 응답 고립 상황을 복구합니다. 복구는 한 번의 재시도로 제한됩니다. 합성 재시도 프롬프트는 영구 저장되지 않으며 해당 재시도는 수집 배치에서 제외되므로 관련 없는 대기 중 프롬프트와 병합될 수 없습니다. 재시도도 고립되거나 큐에 추가할 수 없으면 OpenClaw는 "응답을 생성했지만 이 채팅에 전달할 수 없습니다. 다시 시도해 주세요."와 같이 정제된 진단 메시지만 전달합니다. 원래의 비공개 최종 텍스트는 자동 소스 전달 대상으로 표시되지 않습니다. 반복적으로 응답을 고립시키는 모델의 경우 `"automatic"`을 사용하여 최종 어시스턴트 턴을 표시 응답 경로로 사용하거나, 도구 호출 성능이 더 뛰어난 모델로 전환하거나, Gateway 상세 로그에서 억제된 페이로드 요약을 확인하거나, 모든 그룹/채널 요청에 표시되는 최종 응답을 사용하도록 `messages.groupChat.visibleReplies: "automatic"`을 설정하십시오.

활성 도구 정책에서 메시지 도구를 사용할 수 없으면 OpenClaw는 응답을 조용히 억제하는 대신 표시 응답을 자동으로 전달하는 방식으로 대체합니다. `openclaw doctor`는 이러한 불일치를 경고합니다.

이 규칙은 일반적인 에이전트 최종 텍스트에 적용됩니다. Plugin 소유 대화 바인딩은 소유 Plugin이 반환한 응답을 점유된 바인딩 스레드 턴의 표시 응답으로 사용합니다. Plugin은 이러한 바인딩 응답을 위해 `message(action=send)`를 호출할 필요가 없습니다.

**문제 해결: 그룹 @멘션 후 입력 중 표시만 나타나고 응답 없음(오류 없음)**

증상: 그룹/채널의 @멘션에 입력 중 표시가 나타나고 Gateway 로그에 `dispatch complete (queuedFinal=false, replies=0)`이 보고되지만 방에는 메시지가 게시되지 않습니다. 동일한 에이전트에 대한 DM은 정상적으로 응답합니다.

원인: 그룹/채널 표시 응답 모드가 `"message_tool"`로 결정되므로 OpenClaw는 턴을 실행하지만 에이전트가 `message(action=send)`를 호출하지 않으면 최종 어시스턴트 텍스트를 억제합니다. 이 모드에는 `NO_REPLY` 계약이 없습니다. 메시지 도구 호출이 없으면 원래의 최종 텍스트는 비공개입니다. 이제 OpenClaw는 실질적인 소스 턴에 대해 보호된 복구 재시도를 한 번 시도합니다. 짧은 메모, 명시적인 무응답, 방 이벤트, 전송 정책에 의해 거부된 턴 및 이미 전달된 턴은 재시도하지 않습니다. 일반 그룹 및 채널 턴의 기본값은 `"automatic"`이므로 이 증상은 `messages.groupChat.visibleReplies`(또는 전역 `messages.visibleReplies`)가 명시적으로 `"message_tool"`로 설정된 경우에만 발생합니다. 하네스의 `defaultVisibleReplies`는 여기에 적용되지 않습니다. 그룹/채널 결정기는 이를 무시하며 직접/소스 채팅에만 영향을 줍니다(Codex 하네스는 이 방식으로 직접 채팅의 최종 응답을 억제합니다).

수정 방법: 더 강력한 도구 호출 모델을 선택하거나, 명시적인 `"message_tool"` 재정의를 제거하여 `"automatic"` 기본값으로 대체하거나, 모든 그룹/채널 요청에서 표시되는 답장을 강제하도록 `messages.groupChat.visibleReplies: "automatic"`을 설정하십시오. 전달되지 못한 실질적인 최종 응답이 더 이상 아무 표시 없이 성공으로 끝나서는 안 됩니다. 한 번의 `message(action=send)` 재시도를 통해 복구하거나, 민감 정보가 제거된 전달 실패 진단을 표시해야 합니다. 파일을 저장하면 Gateway가 `messages` 구성을 핫 리로드합니다. 배포에서 파일 감시 또는 구성 리로드가 비활성화된 경우에만 Gateway를 다시 시작하십시오.

**멘션 유형:**

- **메타데이터 멘션**: 플랫폼 네이티브 @-멘션입니다. WhatsApp 셀프 채팅 모드에서는 무시됩니다.
- **텍스트 패턴**: `agents.list[].groupChat.mentionPatterns`의 안전한 정규식 패턴입니다. 유효하지 않은 패턴과 안전하지 않은 중첩 반복은 무시됩니다.
- 멘션 게이팅은 감지가 가능한 경우에만 적용됩니다(네이티브 멘션 또는 하나 이상의 패턴).

```json5
{
  messages: {
    visibleReplies: "automatic", // 직접/소스 채팅에서 기존 자동 최종 답장을 강제합니다
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // 항상 활성화된 멘션 없는 대화방 잡담이 조용한 컨텍스트가 됩니다
      visibleReplies: "message_tool", // 옵트인입니다. 표시되는 대화방 답장에는 message(action=send)가 필요합니다
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit`는 전역 기본값을 설정합니다. 채널은 `channels.<channel>.historyLimit`로 재정의할 수 있습니다(또는 계정별로 재정의할 수 있습니다). 비활성화하려면 `0`으로 설정하십시오.

`messages.groupChat.unmentionedInbound: "room_event"`는 지원되는 채널에서 항상 활성화된 그룹/채널의 멘션 없는 메시지를 조용한 대화방 컨텍스트로 제출합니다. 멘션된 메시지, 명령, 직접 메시지는 계속 사용자 요청으로 처리됩니다. Discord, Slack, Telegram의 전체 예시는 [주변 대화방 이벤트](/ko/channels/ambient-room-events)를 참조하십시오.

`messages.visibleReplies`는 전역 소스 이벤트 기본값이며, `messages.groupChat.visibleReplies`는 그룹/채널 소스 이벤트에서 이를 재정의합니다. `messages.visibleReplies`가 설정되지 않은 경우 직접/소스 채팅은 선택한 런타임 또는 하네스 기본값을 사용하지만, 내부 WebChat 직접 턴은 Pi/Codex 프롬프트 동등성을 위해 자동 최종 전달을 사용합니다. 표시되는 출력을 의도적으로 `message(action=send)`로만 보내도록 하려면 `messages.visibleReplies: "message_tool"`을 설정하십시오. 채널 허용 목록과 멘션 게이팅은 여전히 이벤트의 처리 여부를 결정합니다.

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

결정 순서: DM별 재정의 → 제공자 기본값 → 제한 없음(모두 유지).

이 해석기는 세션 키가 표준 `provider:direct:<id>`(또는 레거시 `provider:dm:<id>`) 형식을 따르는 모든 채널에서 `channels.<provider>.dmHistoryLimit`와 `channels.<provider>.dms.<id>.historyLimit`를 읽습니다. 따라서 고정된 채널 목록뿐 아니라 번들 채널과 Plugin 채널 모두에서 작동합니다.

#### 셀프 채팅 모드

셀프 채팅 모드를 활성화하려면 자신의 번호를 `allowFrom`에 포함하십시오(네이티브 @-멘션은 무시하고 텍스트 패턴에만 응답합니다).

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
    native: "auto", // 지원되는 경우 네이티브 명령을 등록합니다
    nativeSkills: "auto", // 지원되는 경우 네이티브 스킬 명령을 등록합니다
    text: true, // 채팅 메시지에서 /commands를 파싱합니다
    bash: false, // !를 허용합니다(별칭: /bash)
    bashForegroundMs: 2000,
    config: false, // /config를 허용합니다
    mcp: false, // /mcp를 허용합니다
    plugins: false, // /plugins를 허용합니다
    debug: false, // /debug를 허용합니다
    restart: true, // /restart 및 Gateway 재시작 도구를 허용합니다
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

<Accordion title="명령 세부 정보">

- 이 블록은 명령 표면을 구성합니다. 현재 기본 제공 및 번들 명령 카탈로그는 [슬래시 명령](/ko/tools/slash-commands)을 참조하십시오.
- 이 페이지는 전체 명령 카탈로그가 아니라 **구성 키 참조**입니다. QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, 기기 페어링 `/pair`, 메모리 `/dreaming`, 전화 제어 `/phone`, Talk `/voice`와 같이 채널/Plugin이 소유하는 명령은 해당 채널/Plugin 페이지와 [슬래시 명령](/ko/tools/slash-commands)에 문서화되어 있습니다.
- 텍스트 명령은 선행 `/`가 있는 **독립된** 메시지여야 합니다.
- `native: "auto"`는 Discord/Telegram의 네이티브 명령을 활성화하고 Slack에서는 비활성 상태로 둡니다.
- `nativeSkills: "auto"`는 Discord/Telegram의 네이티브 스킬 명령을 활성화하고 Slack에서는 비활성 상태로 둡니다.
- 채널별 재정의: `channels.discord.commands.native`(불리언 또는 `"auto"`). Discord에서 `false`로 설정하면 시작 중 네이티브 명령 등록 및 정리를 건너뜁니다.
- `channels.<provider>.commands.nativeSkills`를 사용하여 채널별 네이티브 스킬 등록을 재정의하십시오.
- `channels.telegram.customCommands`는 Telegram 봇 메뉴 항목을 추가합니다.
- `bash: true`는 호스트 셸에서 `! <cmd>`를 활성화합니다. `tools.elevated.enabled`가 필요하며 발신자가 `tools.elevated.allowFrom.<channel>`에 있어야 합니다.
- `config: true`는 `/config`를 활성화합니다(`openclaw.json` 읽기/쓰기). Gateway `chat.send` 클라이언트의 경우 영구적인 `/config set|unset` 쓰기에도 `operator.admin`이 필요합니다. 읽기 전용 `/config show`는 일반 쓰기 범위 운영자 클라이언트에서도 계속 사용할 수 있습니다.
- `mcp: true`는 `mcp.servers` 아래에서 OpenClaw가 관리하는 MCP 서버 구성용 `/mcp`를 활성화합니다.
- `plugins: true`는 Plugin 검색, 설치 및 활성화/비활성화 제어용 `/plugins`를 활성화합니다.
- `channels.<provider>.configWrites`는 채널별 구성 변경을 게이팅합니다(기본값: true).
- 다중 계정 채널에서는 `channels.<provider>.accounts.<id>.configWrites`가 해당 계정을 대상으로 하는 쓰기도 게이팅합니다(예: `/allowlist --config --account <id>` 또는 `/config set channels.<provider>.accounts.<id>...`).
- `restart: false`는 `/restart` 및 Gateway 재시작 도구 작업을 비활성화합니다. 기본값: `true`.
- `ownerAllowFrom`은 소유자 전용 명령 및 소유자 게이팅 채널 작업에 대한 명시적 소유자 허용 목록입니다. `allowFrom`과는 별개입니다.
- `ownerDisplay: "hash"`는 시스템 프롬프트에서 소유자 ID를 해시합니다. 해싱을 제어하려면 `ownerDisplaySecret`을 설정하십시오.
- `allowFrom`은 제공자별로 적용됩니다. 설정하면 **유일한** 권한 부여 소스가 됩니다(채널 허용 목록/페어링 및 `useAccessGroups`는 무시됩니다).
- `useAccessGroups: false`는 `allowFrom`이 설정되지 않은 경우 명령이 액세스 그룹 정책을 우회하도록 허용합니다.
- 명령 문서 안내:
  - 기본 제공 및 번들 카탈로그: [슬래시 명령](/ko/tools/slash-commands)
  - 채널별 명령 표면: [채널](/ko/channels)
  - QQ Bot 명령: [QQ Bot](/ko/channels/qqbot)
  - 페어링 명령: [페어링](/ko/channels/pairing)
  - LINE 카드 명령: [LINE](/ko/channels/line)
  - 메모리 Dreaming: [Dreaming](/ko/concepts/dreaming)

</Accordion>

---

## 관련 문서

- [구성 참조](/ko/gateway/configuration-reference) — 최상위 키
- [구성 — 에이전트](/ko/gateway/config-agents)
- [채널 개요](/ko/channels)
