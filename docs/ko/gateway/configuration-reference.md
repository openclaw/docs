---
read_when:
    - 정확한 필드 수준의 config 의미 또는 기본값이 필요한 경우
    - 채널, 모델, Gateway 또는 도구 config 블록을 검증하는 경우
summary: 핵심 OpenClaw 키, 기본값, 및 전용 하위 시스템 참조로의 링크를 위한 Gateway config 참조
title: 구성 참조
x-i18n:
    generated_at: "2026-04-23T14:03:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75c7e0d88ea6eacb8a2dd41f83033da853130dc2a689950c1a188d7c4ca8f977
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# 구성 참조

`~/.openclaw/openclaw.json`용 핵심 config 참조입니다. 작업 중심 개요는 [구성](/ko/gateway/configuration)을 참조하세요.

이 페이지는 주요 OpenClaw config 표면을 다루며, 하위 시스템에 자체적인 더 깊은 참조가 있는 경우 해당 링크를 제공합니다. 이 페이지는 모든 채널/plugin 소유 명령 카탈로그나 모든 깊은 메모리/QMD 조정 항목을 한 페이지에 인라인으로 넣으려 하지 않습니다.

코드 기준 정보:

- `openclaw config schema`는 검증 및 Control UI에 사용되는 live JSON Schema를 출력하며, 사용 가능한 경우 번들/plugin/channel 메타데이터가 병합됩니다
- `config.schema.lookup`는 드릴다운 도구용으로 경로 범위가 지정된 단일 스키마 노드를 반환합니다
- `pnpm config:docs:check` / `pnpm config:docs:gen`은 현재 스키마 표면과 config 문서 기준 해시를 검증합니다

전용 심화 참조:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, 그리고 `plugins.entries.memory-core.config.dreaming` 아래의 dreaming config는 [메모리 구성 참조](/ko/reference/memory-config)
- 현재 내장 + 번들 명령 카탈로그는 [슬래시 명령](/ko/tools/slash-commands)
- 채널별 명령 표면은 각 채널/plugin 페이지

Config 형식은 **JSON5**입니다(주석 + 후행 쉼표 허용). 모든 필드는 선택 사항이며, 생략되면 OpenClaw는 안전한 기본값을 사용합니다.

---

## 채널

각 채널은 해당 config 섹션이 존재하면 자동으로 시작됩니다(`enabled: false`인 경우 제외).

### DM 및 그룹 액세스

모든 채널은 DM 정책과 그룹 정책을 지원합니다:

| DM 정책             | 동작                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing`(기본값)   | 알 수 없는 발신자는 일회성 페어링 코드를 받으며, 소유자가 승인해야 함 |
| `allowlist`         | `allowFrom`(또는 페어링된 허용 저장소)에 있는 발신자만 허용      |
| `open`              | 모든 인바운드 DM 허용(`allowFrom: ["*"]` 필요)                  |
| `disabled`          | 모든 인바운드 DM 무시                                           |

| 그룹 정책             | 동작                                                         |
| --------------------- | ------------------------------------------------------------ |
| `allowlist`(기본값)   | 구성된 allowlist와 일치하는 그룹만 허용                      |
| `open`                | 그룹 allowlist 우회(멘션 게이팅은 여전히 적용됨)             |
| `disabled`            | 모든 그룹/룸 메시지 차단                                     |

<Note>
`channels.defaults.groupPolicy`는 provider의 `groupPolicy`가 설정되지 않았을 때 기본값을 설정합니다.
페어링 코드는 1시간 후 만료됩니다. 대기 중인 DM 페어링 요청은 **채널당 3개**로 제한됩니다.
provider 블록 전체가 없으면(`channels.<provider>` 부재), 런타임 그룹 정책은 시작 경고와 함께 `allowlist`(fail-closed)로 fallback합니다.
</Note>

### 채널 모델 재정의

특정 채널 ID를 모델에 고정하려면 `channels.modelByChannel`을 사용하세요. 값에는 `provider/model` 또는 구성된 모델 별칭을 사용할 수 있습니다. 이 채널 매핑은 세션에 이미 모델 재정의(예: `/model`로 설정)가 없는 경우에 적용됩니다.

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### 채널 기본값 및 Heartbeat

provider 전반에서 공유되는 그룹 정책 및 Heartbeat 동작에는 `channels.defaults`를 사용하세요:

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

- `channels.defaults.groupPolicy`: provider 수준 `groupPolicy`가 설정되지 않았을 때의 fallback 그룹 정책.
- `channels.defaults.contextVisibility`: 모든 채널의 기본 보조 컨텍스트 가시성 모드. 값: `all`(기본값, 모든 인용/스레드/기록 컨텍스트 포함), `allowlist`(allowlist에 있는 발신자의 컨텍스트만 포함), `allowlist_quote`(allowlist와 같지만 명시적 인용/응답 컨텍스트는 유지). 채널별 재정의: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: Heartbeat 출력에 정상 채널 상태 포함.
- `channels.defaults.heartbeat.showAlerts`: Heartbeat 출력에 저하/오류 상태 포함.
- `channels.defaults.heartbeat.useIndicator`: 간결한 indicator 스타일 Heartbeat 출력 렌더링.

### WhatsApp

WhatsApp은 gateway의 웹 채널(Baileys Web)을 통해 실행됩니다. 연결된 세션이 존재하면 자동으로 시작됩니다.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // 파란 체크 표시(self-chat 모드에서는 false)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

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

- 아웃바운드 명령은 `default` 계정이 있으면 이를 기본으로 사용하고, 없으면 첫 번째 구성된 계정 id(정렬 기준)를 사용합니다.
- 선택적 `channels.whatsapp.defaultAccount`는 구성된 계정 id와 일치할 때 해당 fallback 기본 계정 선택을 재정의합니다.
- 레거시 단일 계정 Baileys 인증 디렉터리는 `openclaw doctor`에 의해 `whatsapp/default`로 마이그레이션됩니다.
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
      streaming: "partial", // off | partial | block | progress (기본값: off, preview-edit 속도 제한을 피하려면 명시적으로 opt in)
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
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- 봇 토큰: `channels.telegram.botToken` 또는 `channels.telegram.tokenFile`(일반 파일만 허용, 심볼릭 링크는 거부됨), 기본 계정에 대해서는 `TELEGRAM_BOT_TOKEN`을 fallback으로 사용.
- 선택적 `channels.telegram.defaultAccount`는 구성된 계정 id와 일치할 때 기본 계정 선택을 재정의합니다.
- 다중 계정 설정(계정 id 2개 이상)에서는 fallback 라우팅을 피하려면 명시적인 기본값(`channels.telegram.defaultAccount` 또는 `channels.telegram.accounts.default`)을 설정하세요. 이것이 없거나 잘못되면 `openclaw doctor`가 경고합니다.
- `configWrites: false`는 Telegram 시작 config 쓰기(supergroup ID 마이그레이션, `/config set|unset`)를 차단합니다.
- `type: "acp"`를 가진 최상위 `bindings[]` 항목은 포럼 토픽용 영구 ACP 바인딩을 구성합니다(`match.peer.id`에 정식 `chatId:topic:topicId` 사용). 필드 의미는 [ACP Agents](/ko/tools/acp-agents#channel-specific-settings)에서 공유됩니다.
- Telegram 스트림 미리보기는 `sendMessage` + `editMessageText`를 사용합니다(다이렉트 및 그룹 채팅에서 동작).
- 재시도 정책: [재시도 정책](/ko/concepts/retry) 참조.

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
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress는 Discord에서 partial로 매핑됨)
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
        spawnSubagentSessions: false, // sessions_spawn({ thread: true })용 opt-in
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

- 토큰: `channels.discord.token`, 기본 계정에 대해서는 `DISCORD_BOT_TOKEN`을 fallback으로 사용합니다.
- 명시적인 Discord `token`을 제공하는 직접 아웃바운드 호출은 그 호출에 해당 토큰을 사용합니다. 계정 재시도/정책 설정은 여전히 활성 런타임 스냅샷에서 선택된 계정에서 가져옵니다.
- 선택적 `channels.discord.defaultAccount`는 구성된 계정 id와 일치할 때 기본 계정 선택을 재정의합니다.
- 전달 대상에는 `user:<id>`(DM) 또는 `channel:<id>`(guild 채널)를 사용하세요. 숫자만 있는 ID는 거부됩니다.
- Guild slug는 소문자이며 공백은 `-`로 대체됩니다. 채널 키는 slug 처리된 이름을 사용합니다(`#` 없음). guild ID 사용을 권장합니다.
- 봇이 작성한 메시지는 기본적으로 무시됩니다. `allowBots: true`는 이를 활성화합니다. `allowBots: "mentions"`를 사용하면 봇을 멘션한 봇 메시지만 수락합니다(자신의 메시지는 여전히 필터링됨).
- `channels.discord.guilds.<id>.ignoreOtherMentions`(및 채널 재정의)는 봇을 멘션하지 않고 다른 사용자나 역할을 멘션한 메시지를 삭제합니다(`@everyone`/`@here` 제외).
- `maxLinesPerMessage`(기본값 17)는 2000자 미만이어도 긴 메시지를 분할합니다.
- `channels.discord.threadBindings`는 Discord 스레드 바운드 라우팅을 제어합니다:
  - `enabled`: 스레드 바운드 세션 기능(`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, 그리고 바운드 전달/라우팅)에 대한 Discord 재정의
  - `idleHours`: 비활성 자동 unfocus 시간(시간 단위)에 대한 Discord 재정의(`0`이면 비활성화)
  - `maxAgeHours`: 하드 최대 수명 시간(시간 단위)에 대한 Discord 재정의(`0`이면 비활성화)
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` 자동 스레드 생성/바인딩용 opt-in 스위치
- `type: "acp"`를 가진 최상위 `bindings[]` 항목은 채널 및 스레드용 영구 ACP 바인딩을 구성합니다(`match.peer.id`에 채널/스레드 id 사용). 필드 의미는 [ACP Agents](/ko/tools/acp-agents#channel-specific-settings)에서 공유됩니다.
- `channels.discord.ui.components.accentColor`는 Discord components v2 컨테이너의 강조 색상을 설정합니다.
- `channels.discord.voice`는 Discord 음성 채널 대화와 선택적 자동 참여 + TTS 재정의를 활성화합니다.
- `channels.discord.voice.daveEncryption` 및 `channels.discord.voice.decryptionFailureTolerance`는 `@discordjs/voice` DAVE 옵션에 그대로 전달됩니다(기본값은 각각 `true` 및 `24`).
- OpenClaw는 추가로 반복적인 복호화 실패 후 음성 세션을 나갔다가 다시 참여하는 방식으로 음성 수신 복구를 시도합니다.
- `channels.discord.streaming`은 정식 스트림 모드 키입니다. 레거시 `streamMode`와 불리언 `streaming` 값은 자동 마이그레이션됩니다.
- `channels.discord.autoPresence`는 런타임 가용성을 봇 presence에 매핑합니다(정상 => online, 저하 => idle, 소진 => dnd). 선택적 상태 텍스트 재정의도 허용합니다.
- `channels.discord.dangerouslyAllowNameMatching`은 변경 가능한 이름/태그 매칭을 다시 활성화합니다(비상 호환성 모드).
- `channels.discord.execApprovals`: Discord 기본 exec 승인 전달 및 승인자 인증.
  - `enabled`: `true`, `false`, 또는 `"auto"`(기본값). auto 모드에서는 `approvers` 또는 `commands.ownerAllowFrom`에서 승인자를 확인할 수 있을 때 exec 승인이 활성화됩니다.
  - `approvers`: exec 요청을 승인할 수 있는 Discord 사용자 ID. 생략 시 `commands.ownerAllowFrom`으로 fallback합니다.
  - `agentFilter`: 선택적 에이전트 ID allowlist. 생략하면 모든 에이전트에 대한 승인을 전달합니다.
  - `sessionFilter`: 선택적 세션 키 패턴(부분 문자열 또는 정규식).
  - `target`: 승인 프롬프트를 보낼 위치. `"dm"`(기본값)은 승인자 DM으로 보냅니다. `"channel"`은 원래 채널로 보냅니다. `"both"`는 둘 다로 보냅니다. 대상에 `"channel"`이 포함되면 버튼은 확인된 승인자만 사용할 수 있습니다.
  - `cleanupAfterResolve`: `true`이면 승인, 거부 또는 시간 초과 후 승인 DM을 삭제합니다.

**반응 알림 모드:** `off`(없음), `own`(봇의 메시지, 기본값), `all`(모든 메시지), `allowlist`(`guilds.<id>.users`의 모든 메시지에서).

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

- 서비스 계정 JSON: 인라인(`serviceAccount`) 또는 파일 기반(`serviceAccountFile`).
- 서비스 계정 SecretRef(`serviceAccountRef`)도 지원됩니다.
- 환경 변수 fallback: `GOOGLE_CHAT_SERVICE_ACCOUNT` 또는 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- 전달 대상에는 `spaces/<spaceId>` 또는 `users/<userId>`를 사용하세요.
- `channels.googlechat.dangerouslyAllowNameMatching`은 변경 가능한 이메일 principal 매칭을 다시 활성화합니다(비상 호환성 모드).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
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
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // mode=partial일 때 Slack 기본 스트리밍 API 사용
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

- **Socket mode**에는 `botToken`과 `appToken`이 모두 필요합니다(기본 계정 env fallback에는 `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`).
- **HTTP mode**에는 `botToken`과 `signingSecret`(루트 또는 계정별)이 필요합니다.
- `botToken`, `appToken`, `signingSecret`, `userToken`은 일반 텍스트 문자열 또는 SecretRef 객체를 받을 수 있습니다.
- Slack 계정 스냅샷은 `botTokenSource`, `botTokenStatus`, `appTokenStatus`, 그리고 HTTP 모드에서는 `signingSecretStatus` 같은 자격 증명별 source/status 필드를 노출합니다. `configured_unavailable`은 계정이 SecretRef를 통해 구성되었지만 현재 명령/런타임 경로에서 secret 값을 확인할 수 없음을 의미합니다.
- `configWrites: false`는 Slack 시작 config 쓰기를 차단합니다.
- 선택적 `channels.slack.defaultAccount`는 구성된 계정 id와 일치할 때 기본 계정 선택을 재정의합니다.
- `channels.slack.streaming.mode`는 정식 Slack 스트림 모드 키입니다. `channels.slack.streaming.nativeTransport`는 Slack의 기본 스트리밍 전송을 제어합니다. 레거시 `streamMode`, 불리언 `streaming`, `nativeStreaming` 값은 자동 마이그레이션됩니다.
- 전달 대상에는 `user:<id>`(DM) 또는 `channel:<id>`를 사용하세요.

**반응 알림 모드:** `off`, `own`(기본값), `all`, `allowlist`(`reactionAllowlist` 기준).

**스레드 세션 격리:** `thread.historyScope`는 스레드별(기본값) 또는 채널 전체 공유입니다. `thread.inheritParent`는 부모 채널 transcript를 새 스레드에 복사합니다.

- Slack 기본 스트리밍과 Slack assistant 스타일의 "is typing..." 스레드 상태는 응답 스레드 대상을 필요로 합니다. 최상위 DM은 기본적으로 스레드 밖에 있으므로, 스레드 스타일 미리보기 대신 `typingReaction` 또는 일반 전달을 사용합니다.
- `typingReaction`은 응답이 실행되는 동안 인바운드 Slack 메시지에 임시 반응을 추가하고, 완료 시 제거합니다. `"hourglass_flowing_sand"` 같은 Slack 이모지 shortcode를 사용하세요.
- `channels.slack.execApprovals`: Slack 기본 exec 승인 전달 및 승인자 인증. Discord와 동일한 스키마: `enabled`(`true`/`false`/`"auto"`), `approvers`(Slack 사용자 ID), `agentFilter`, `sessionFilter`, `target`(`"dm"`, `"channel"`, 또는 `"both"`).

| 작업 그룹  | 기본값   | 참고                    |
| ---------- | -------- | ----------------------- |
| reactions  | 활성화   | 반응 + 반응 목록        |
| messages   | 활성화   | 읽기/전송/편집/삭제     |
| pins       | 활성화   | 고정/고정 해제/목록     |
| memberInfo | 활성화   | 멤버 정보               |
| emojiList  | 활성화   | 사용자 지정 이모지 목록 |

### Mattermost

Mattermost는 plugin으로 제공됩니다: `openclaw plugins install @openclaw/mattermost`.

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
        // 리버스 프록시/공개 배포용 선택적 명시 URL
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

채팅 모드: `oncall`(@-멘션에 응답, 기본값), `onmessage`(모든 메시지), `onchar`(트리거 접두사로 시작하는 메시지).

Mattermost 기본 명령이 활성화된 경우:

- `commands.callbackPath`는 전체 URL이 아니라 경로여야 합니다(예: `/api/channels/mattermost/command`).
- `commands.callbackUrl`은 OpenClaw gateway 엔드포인트로 해석되어야 하며 Mattermost 서버에서 접근 가능해야 합니다.
- 기본 slash 콜백은 Mattermost가 slash 명령 등록 중 반환한 명령별 토큰으로 인증됩니다. 등록이 실패하거나 활성화된 명령이 없으면 OpenClaw는 다음과 함께 콜백을 거부합니다:
  `Unauthorized: invalid command token.`
- 비공개/tailnet/internal 콜백 호스트의 경우, Mattermost는 `ServiceSettings.AllowedUntrustedInternalConnections`에 콜백 호스트/도메드가 포함되기를 요구할 수 있습니다.
  전체 URL이 아니라 호스트/도메인 값을 사용하세요.
- `channels.mattermost.configWrites`: Mattermost 시작 config 쓰기 허용 또는 거부.
- `channels.mattermost.requireMention`: 채널에서 응답하기 전에 `@mention` 요구.
- `channels.mattermost.groups.<channelId>.requireMention`: 채널별 멘션 게이팅 재정의(기본값에는 `"*"` 사용).
- 선택적 `channels.mattermost.defaultAccount`는 구성된 계정 id와 일치할 때 기본 계정 선택을 재정의합니다.

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

**반응 알림 모드:** `off`, `own`(기본값), `all`, `allowlist`(`reactionAllowlist` 기준).

- `channels.signal.account`: 채널 시작을 특정 Signal 계정 ID로 고정합니다.
- `channels.signal.configWrites`: Signal 시작 config 쓰기를 허용 또는 거부합니다.
- 선택적 `channels.signal.defaultAccount`는 구성된 계정 id와 일치할 때 기본 계정 선택을 재정의합니다.

### BlueBubbles

BlueBubbles는 권장되는 iMessage 경로입니다(plugin 기반, `channels.bluebubbles` 아래에서 구성).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, 그룹 제어, 고급 작업:
      // /channels/bluebubbles 참조
    },
  },
}
```

- 여기서 다루는 핵심 키 경로: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- 선택적 `channels.bluebubbles.defaultAccount`는 구성된 계정 id와 일치할 때 기본 계정 선택을 재정의합니다.
- `type: "acp"`를 가진 최상위 `bindings[]` 항목은 BlueBubbles 대화를 영구 ACP 세션에 바인딩할 수 있습니다. `match.peer.id`에는 BlueBubbles handle 또는 대상 문자열(`chat_id:*`, `chat_guid:*`, `chat_identifier:*`)을 사용하세요. 공유 필드 의미: [ACP Agents](/ko/tools/acp-agents#channel-specific-settings).
- 전체 BlueBubbles 채널 구성은 [BlueBubbles](/ko/channels/bluebubbles)에 문서화되어 있습니다.

### iMessage

OpenClaw는 `imsg rpc`(stdio를 통한 JSON-RPC)를 실행합니다. 데몬이나 포트는 필요 없습니다.

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
      region: "US",
    },
  },
}
```

- 선택적 `channels.imessage.defaultAccount`는 구성된 계정 id와 일치할 때 기본 계정 선택을 재정의합니다.

- Messages DB에 대한 전체 디스크 접근 권한이 필요합니다.
- `chat_id:<id>` 대상을 사용하는 것이 좋습니다. 채팅 목록은 `imsg chats --limit 20`으로 확인하세요.
- `cliPath`는 SSH 래퍼를 가리킬 수 있습니다. SCP 첨부 파일 가져오기를 위해 `remoteHost`(`host` 또는 `user@host`)를 설정하세요.
- `attachmentRoots` 및 `remoteAttachmentRoots`는 인바운드 첨부 파일 경로를 제한합니다(기본값: `/Users/*/Library/Messages/Attachments`).
- SCP는 엄격한 호스트 키 검사를 사용하므로, 릴레이 호스트 키가 이미 `~/.ssh/known_hosts`에 있어야 합니다.
- `channels.imessage.configWrites`: iMessage 시작 config 쓰기를 허용 또는 거부합니다.
- `type: "acp"`를 가진 최상위 `bindings[]` 항목은 iMessage 대화를 영구 ACP 세션에 바인딩할 수 있습니다. `match.peer.id`에는 정규화된 handle 또는 명시적 채팅 대상(`chat_id:*`, `chat_guid:*`, `chat_identifier:*`)을 사용하세요. 공유 필드 의미: [ACP Agents](/ko/tools/acp-agents#channel-specific-settings).

<Accordion title="iMessage SSH 래퍼 예제">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix는 plugin 기반이며 `channels.matrix` 아래에서 구성됩니다.

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
- `channels.matrix.proxy`는 Matrix HTTP 트래픽을 명시적인 HTTP(S) 프록시로 라우팅합니다. 이름이 있는 계정은 `channels.matrix.accounts.<id>.proxy`로 이를 재정의할 수 있습니다.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork`는 private/internal homeserver를 허용합니다. `proxy`와 이 네트워크 opt-in은 서로 독립적인 제어입니다.
- `channels.matrix.defaultAccount`는 다중 계정 설정에서 선호 계정을 선택합니다.
- `channels.matrix.autoJoin`의 기본값은 `off`이므로, `autoJoin: "allowlist"`와 `autoJoinAllowlist` 또는 `autoJoin: "always"`를 설정하기 전까지 초대된 룸과 새로운 DM 스타일 초대는 무시됩니다.
- `channels.matrix.execApprovals`: Matrix 기본 exec 승인 전달 및 승인자 인증.
  - `enabled`: `true`, `false`, 또는 `"auto"`(기본값). auto 모드에서는 `approvers` 또는 `commands.ownerAllowFrom`에서 승인자를 확인할 수 있을 때 exec 승인이 활성화됩니다.
  - `approvers`: exec 요청을 승인할 수 있는 Matrix 사용자 ID(예: `@owner:example.org`).
  - `agentFilter`: 선택적 에이전트 ID allowlist. 생략하면 모든 에이전트에 대한 승인을 전달합니다.
  - `sessionFilter`: 선택적 세션 키 패턴(부분 문자열 또는 정규식).
  - `target`: 승인 프롬프트를 보낼 위치. `"dm"`(기본값), `"channel"`(원래 룸), 또는 `"both"`.
  - 계정별 재정의: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope`는 Matrix DM이 세션으로 묶이는 방식을 제어합니다: `per-user`(기본값)는 라우팅된 피어 기준으로 공유하고, `per-room`은 각 DM 룸을 격리합니다.
- Matrix 상태 프로브와 live 디렉터리 조회는 런타임 트래픽과 동일한 프록시 정책을 사용합니다.
- 전체 Matrix 구성, 대상 지정 규칙, 설정 예제는 [Matrix](/ko/channels/matrix)에 문서화되어 있습니다.

### Microsoft Teams

Microsoft Teams는 plugin 기반이며 `channels.msteams` 아래에서 구성됩니다.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel 정책:
      // /channels/msteams 참조
    },
  },
}
```

- 여기서 다루는 핵심 키 경로: `channels.msteams`, `channels.msteams.configWrites`.
- 전체 Teams config(자격 증명, webhook, DM/그룹 정책, 팀별/채널별 재정의)는 [Microsoft Teams](/ko/channels/msteams)에 문서화되어 있습니다.

### IRC

IRC는 plugin 기반이며 `channels.irc` 아래에서 구성됩니다.

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

- 여기서 다루는 핵심 키 경로: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- 선택적 `channels.irc.defaultAccount`는 구성된 계정 id와 일치할 때 기본 계정 선택을 재정의합니다.
- 전체 IRC 채널 구성(host/port/TLS/channels/allowlists/mention gating)은 [IRC](/ko/channels/irc)에 문서화되어 있습니다.

### 다중 계정(모든 채널)

채널별로 여러 계정을 실행할 수 있습니다(각각 자체 `accountId` 사용):

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

- `default`는 `accountId`가 생략되었을 때 사용됩니다(CLI + 라우팅).
- 환경 변수 토큰은 **기본** 계정에만 적용됩니다.
- 기본 채널 설정은 계정별로 재정의되지 않는 한 모든 계정에 적용됩니다.
- 각 계정을 다른 에이전트로 라우팅하려면 `bindings[].match.accountId`를 사용하세요.
- 단일 계정 최상위 채널 config를 여전히 사용 중인 상태에서 `openclaw channels add`(또는 채널 온보딩)를 통해 non-default 계정을 추가하면, OpenClaw는 먼저 계정 범위의 최상위 단일 계정 값을 채널 계정 맵으로 승격시켜 원래 계정이 계속 동작하도록 합니다. 대부분의 채널은 이를 `channels.<channel>.accounts.default`로 옮기며, Matrix는 기존의 일치하는 이름 있는/default 대상을 대신 유지할 수 있습니다.
- 기존의 채널 전용 바인딩(`accountId` 없음)은 계속 기본 계정과 일치합니다. 계정 범위 바인딩은 계속 선택 사항입니다.
- `openclaw doctor --fix`도 혼합된 형태를 복구하여, 계정 범위 최상위 단일 계정 값을 해당 채널에서 선택된 승격 계정으로 이동합니다. 대부분의 채널은 `accounts.default`를 사용하며, Matrix는 기존의 일치하는 이름 있는/default 대상을 대신 유지할 수 있습니다.

### 기타 plugin 채널

많은 plugin 채널은 `channels.<id>`로 구성되며 해당 전용 채널 페이지에 문서화되어 있습니다(예: Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat, Twitch).
전체 채널 색인은 [채널](/ko/channels)을 참조하세요.

### 그룹 채팅 멘션 게이팅

그룹 메시지는 기본적으로 **멘션 필요**입니다(메타데이터 멘션 또는 안전한 정규식 패턴). WhatsApp, Telegram, Discord, Google Chat, iMessage 그룹 채팅에 적용됩니다.

**멘션 유형:**

- **메타데이터 멘션**: 기본 플랫폼 @-멘션. WhatsApp self-chat 모드에서는 무시됩니다.
- **텍스트 패턴**: `agents.list[].groupChat.mentionPatterns`의 안전한 정규식 패턴. 유효하지 않은 패턴과 안전하지 않은 중첩 반복은 무시됩니다.
- 멘션 게이팅은 감지가 가능한 경우에만 적용됩니다(기본 멘션 또는 최소 하나의 패턴 존재).

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit`는 전역 기본값을 설정합니다. 채널은 `channels.<channel>.historyLimit`(또는 계정별)로 이를 재정의할 수 있습니다. 비활성화하려면 `0`으로 설정하세요.

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

확인 순서: DM별 재정의 → provider 기본값 → 제한 없음(모두 유지).

지원됨: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Self-chat 모드

자신의 번호를 `allowFrom`에 포함하면 self-chat 모드가 활성화됩니다(기본 @-멘션 무시, 텍스트 패턴에만 응답):

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
    native: "auto", // 지원되는 경우 기본 명령 등록
    nativeSkills: "auto", // 지원되는 경우 기본 Skills 명령 등록
    text: true, // 채팅 메시지에서 /commands 파싱
    bash: false, // ! 허용(별칭: /bash)
    bashForegroundMs: 2000,
    config: false, // /config 허용
    mcp: false, // /mcp 허용
    plugins: false, // /plugins 허용
    debug: false, // /debug 허용
    restart: true, // /restart + gateway restart 도구 허용
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

- 이 블록은 명령 표면을 구성합니다. 현재 내장 + 번들 명령 카탈로그는 [슬래시 명령](/ko/tools/slash-commands)을 참조하세요.
- 이 페이지는 전체 명령 카탈로그가 아니라 **config 키 참조**입니다. QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone`, Talk `/voice` 같은 채널/plugin 소유 명령은 해당 채널/plugin 페이지와 [슬래시 명령](/ko/tools/slash-commands)에 문서화되어 있습니다.
- 텍스트 명령은 앞에 `/`가 붙은 **독립형** 메시지여야 합니다.
- `native: "auto"`는 Discord/Telegram의 기본 명령을 켜고, Slack은 끕니다.
- `nativeSkills: "auto"`는 Discord/Telegram의 기본 Skills 명령을 켜고, Slack은 끕니다.
- 채널별 재정의: `channels.discord.commands.native`(bool 또는 `"auto"`). `false`이면 이전에 등록된 명령을 제거합니다.
- `channels.<provider>.commands.nativeSkills`로 채널별 기본 skill 등록을 재정의합니다.
- `channels.telegram.customCommands`는 추가 Telegram 봇 메뉴 항목을 추가합니다.
- `bash: true`는 호스트 셸용 `! <cmd>`를 활성화합니다. `tools.elevated.enabled`가 필요하며, 발신자가 `tools.elevated.allowFrom.<channel>`에 있어야 합니다.
- `config: true`는 `/config`를 활성화합니다(`openclaw.json` 읽기/쓰기). gateway `chat.send` 클라이언트의 경우 영구적인 `/config set|unset` 쓰기에는 `operator.admin`도 필요합니다. 읽기 전용 `/config show`는 일반 쓰기 범위 operator 클라이언트에도 계속 제공됩니다.
- `mcp: true`는 `mcp.servers` 아래의 OpenClaw 관리 MCP 서버 config에 대한 `/mcp`를 활성화합니다.
- `plugins: true`는 plugin 검색, 설치, 활성화/비활성화 제어를 위한 `/plugins`를 활성화합니다.
- `channels.<provider>.configWrites`는 채널별 config 변경을 게이트합니다(기본값: true).
- 다중 계정 채널의 경우 `channels.<provider>.accounts.<id>.configWrites`도 해당 계정을 대상으로 하는 쓰기(예: `/allowlist --config --account <id>` 또는 `/config set channels.<provider>.accounts.<id>...`)를 게이트합니다.
- `restart: false`는 `/restart`와 gateway restart 도구 작업을 비활성화합니다. 기본값: `true`.
- `ownerAllowFrom`은 소유자 전용 명령/도구를 위한 명시적 소유자 allowlist입니다. 이는 `allowFrom`과 별개입니다.
- `ownerDisplay: "hash"`는 시스템 프롬프트에서 소유자 id를 해시합니다. 해시를 제어하려면 `ownerDisplaySecret`을 설정하세요.
- `allowFrom`은 provider별입니다. 설정되면 이것이 **유일한** 인증 소스가 됩니다(채널 allowlist/페어링 및 `useAccessGroups`는 무시됨).
- `useAccessGroups: false`는 `allowFrom`이 설정되지 않은 경우 명령이 액세스 그룹 정책을 우회할 수 있게 합니다.
- 명령 문서 맵:
  - 내장 + 번들 카탈로그: [슬래시 명령](/ko/tools/slash-commands)
  - 채널별 명령 표면: [채널](/ko/channels)
  - QQ Bot 명령: [QQ Bot](/ko/channels/qqbot)
  - 페어링 명령: [페어링](/ko/channels/pairing)
  - LINE 카드 명령: [LINE](/ko/channels/line)
  - memory dreaming: [Dreaming](/ko/concepts/dreaming)

</Accordion>

---

## 에이전트 기본값

### `agents.defaults.workspace`

기본값: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

시스템 프롬프트의 Runtime 줄에 표시되는 선택적 저장소 루트입니다. 설정되지 않으면 OpenClaw는 workspace에서 위로 올라가며 자동 감지합니다.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills`를 설정하지 않은 에이전트에 대한 선택적 기본 skill allowlist입니다.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather 상속
      { id: "docs", skills: ["docs-search"] }, // 기본값 대체
      { id: "locked-down", skills: [] }, // skill 없음
    ],
  },
}
```

- 기본적으로 Skills를 제한 없이 사용하려면 `agents.defaults.skills`를 생략하세요.
- 기본값을 상속하려면 `agents.list[].skills`를 생략하세요.
- Skills를 사용하지 않으려면 `agents.list[].skills: []`로 설정하세요.
- 비어 있지 않은 `agents.list[].skills` 목록은 해당 에이전트의 최종 집합이며, 기본값과 병합되지 않습니다.

### `agents.defaults.skipBootstrap`

workspace bootstrap 파일(`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)의 자동 생성을 비활성화합니다.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

workspace bootstrap 파일이 시스템 프롬프트에 주입되는 시점을 제어합니다. 기본값: `"always"`.

- `"continuation-skip"`: 안전한 이어쓰기 턴(완료된 assistant 응답 이후)에서는 workspace bootstrap 재주입을 건너뛰어 프롬프트 크기를 줄입니다. Heartbeat 실행과 post-compaction 재시도는 여전히 컨텍스트를 다시 빌드합니다.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

잘리기 전 각 workspace bootstrap 파일당 최대 문자 수입니다. 기본값: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

모든 workspace bootstrap 파일에 걸쳐 주입되는 총 최대 문자 수입니다. 기본값: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

bootstrap 컨텍스트가 잘릴 때 에이전트에게 보이는 경고 텍스트를 제어합니다.
기본값: `"once"`.

- `"off"`: 시스템 프롬프트에 경고 텍스트를 절대 주입하지 않습니다.
- `"once"`: 고유한 잘림 시그니처마다 한 번만 경고를 주입합니다(권장).
- `"always"`: 잘림이 있을 때마다 모든 실행에 경고를 주입합니다.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### 컨텍스트 예산 소유권 맵

OpenClaw에는 대용량 프롬프트/컨텍스트 예산이 여러 개 있으며, 모두 하나의 일반적인 설정으로 흐르지 않도록 의도적으로 하위 시스템별로 분리되어 있습니다.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  일반적인 workspace bootstrap 주입.
- `agents.defaults.startupContext.*`:
  최근 일일 `memory/*.md` 파일을 포함한 일회성 `/new` 및 `/reset` 시작 prelude.
- `skills.limits.*`:
  시스템 프롬프트에 주입되는 압축된 Skills 목록.
- `agents.defaults.contextLimits.*`:
  제한된 런타임 발췌문과 런타임 소유 블록 주입.
- `memory.qmd.limits.*`:
  인덱싱된 메모리 검색 스니펫 및 주입 크기 조정.

특정 에이전트에만 다른 예산이 필요할 때만 해당하는 에이전트별 재정의를 사용하세요:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

빈 `/new` 및 `/reset` 실행에서 주입되는 첫 턴 시작 prelude를 제어합니다.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

제한된 런타임 컨텍스트 표면에 대한 공유 기본값입니다.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: 잘림 메타데이터와 이어서 보기 알림이 추가되기 전의 기본 `memory_get` 발췌문 상한입니다.
- `memoryGetDefaultLines`: `lines`가 생략될 때 기본 `memory_get` 줄 범위입니다.
- `toolResultMaxChars`: 영속 결과와 overflow 복구에 사용되는 live 도구 결과 상한입니다.
- `postCompactionMaxChars`: post-compaction 새로 고침 주입 중 사용되는 AGENTS.md 발췌문 상한입니다.

#### `agents.list[].contextLimits`

공유 `contextLimits` 설정에 대한 에이전트별 재정의입니다. 생략된 필드는 `agents.defaults.contextLimits`에서 상속됩니다.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

시스템 프롬프트에 주입되는 압축된 Skills 목록의 전역 상한입니다. 이는 필요 시 `SKILL.md` 파일을 읽는 동작에는 영향을 주지 않습니다.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Skills 프롬프트 예산에 대한 에이전트별 재정의입니다.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

provider 호출 전에 transcript/tool 이미지 블록에서 가장 긴 이미지 변의 최대 픽셀 크기입니다.
기본값: `1200`.

낮은 값은 보통 스크린샷이 많은 실행에서 vision 토큰 사용량과 요청 페이로드 크기를 줄입니다.
높은 값은 더 많은 시각적 세부 정보를 보존합니다.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

시스템 프롬프트 컨텍스트용 시간대입니다(메시지 타임스탬프용 아님). 호스트 시간대로 fallback합니다.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

시스템 프롬프트의 시간 형식입니다. 기본값: `auto`(OS 기본 설정).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // 전역 기본 provider params
      embeddedHarness: {
        runtime: "auto", // auto | pi | registered harness id, 예: codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - 문자열 형식은 기본 모델만 설정합니다.
  - 객체 형식은 기본 모델과 순서가 있는 장애 조치 모델을 설정합니다.
- `imageModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - `image` 도구 경로에서 vision 모델 config로 사용됩니다.
  - 선택된/기본 모델이 이미지 입력을 받을 수 없을 때 fallback 라우팅에도 사용됩니다.
- `imageGenerationModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - 공유 이미지 생성 기능과 향후 이미지를 생성하는 모든 도구/plugin 표면에서 사용됩니다.
  - 일반적인 값: Gemini 기본 이미지 생성용 `google/gemini-3.1-flash-image-preview`, fal용 `fal/fal-ai/flux/dev`, OpenAI Images용 `openai/gpt-image-2`.
  - provider/model을 직접 선택하는 경우 해당 provider 인증/API 키도 함께 구성하세요(예: `google/*`에는 `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`, `openai/*`에는 `OPENAI_API_KEY`, `fal/*`에는 `FAL_KEY`).
  - 생략하더라도 `image_generate`는 인증된 provider 기본값을 추론할 수 있습니다. 먼저 현재 기본 provider를 시도한 뒤, 나머지 등록된 이미지 생성 provider를 provider-id 순서대로 시도합니다.
- `musicGenerationModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - 공유 음악 생성 기능과 내장 `music_generate` 도구에서 사용됩니다.
  - 일반적인 값: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, 또는 `minimax/music-2.5+`.
  - 생략하더라도 `music_generate`는 인증된 provider 기본값을 추론할 수 있습니다. 먼저 현재 기본 provider를 시도한 뒤, 나머지 등록된 음악 생성 provider를 provider-id 순서대로 시도합니다.
  - provider/model을 직접 선택하는 경우 해당 provider 인증/API 키도 함께 구성하세요.
- `videoGenerationModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - 공유 비디오 생성 기능과 내장 `video_generate` 도구에서 사용됩니다.
  - 일반적인 값: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, 또는 `qwen/wan2.7-r2v`.
  - 생략하더라도 `video_generate`는 인증된 provider 기본값을 추론할 수 있습니다. 먼저 현재 기본 provider를 시도한 뒤, 나머지 등록된 비디오 생성 provider를 provider-id 순서대로 시도합니다.
  - provider/model을 직접 선택하는 경우 해당 provider 인증/API 키도 함께 구성하세요.
  - 번들된 Qwen 비디오 생성 provider는 최대 출력 비디오 1개, 입력 이미지 1개, 입력 비디오 4개, 길이 10초, 그리고 provider 수준의 `size`, `aspectRatio`, `resolution`, `audio`, `watermark` 옵션을 지원합니다.
- `pdfModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - `pdf` 도구의 모델 라우팅에 사용됩니다.
  - 생략되면 PDF 도구는 `imageModel`로 fallback한 뒤, 해결된 세션/기본 모델로 fallback합니다.
- `pdfMaxBytesMb`: 호출 시점에 `maxBytesMb`가 전달되지 않았을 때 `pdf` 도구의 기본 PDF 크기 제한입니다.
- `pdfMaxPages`: `pdf` 도구의 추출 fallback 모드에서 고려하는 기본 최대 페이지 수입니다.
- `verboseDefault`: 에이전트의 기본 verbose 수준. 값: `"off"`, `"on"`, `"full"`. 기본값: `"off"`.
- `elevatedDefault`: 에이전트의 기본 elevated 출력 수준. 값: `"off"`, `"on"`, `"ask"`, `"full"`. 기본값: `"on"`.
- `model.primary`: 형식은 `provider/model`(예: `openai/gpt-5.4`)입니다. provider를 생략하면 OpenClaw는 먼저 별칭을 시도하고, 그다음 정확한 모델 id에 대한 유일한 구성된 provider 일치를 시도한 뒤, 마지막으로 구성된 기본 provider로 fallback합니다(더 이상 권장되지 않는 호환 동작이므로 명시적인 `provider/model`을 권장합니다). 해당 provider가 더 이상 구성된 기본 모델을 노출하지 않으면, OpenClaw는 오래된 제거된-provider 기본값을 표시하는 대신 첫 번째 구성된 provider/model로 fallback합니다.
- `models`: `/model`용 구성된 모델 카탈로그 및 allowlist입니다. 각 항목에는 `alias`(단축 이름)와 `params`(provider별 설정, 예: `temperature`, `maxTokens`, `cacheRetention`, `context1m`)를 포함할 수 있습니다.
  - 안전한 편집: 항목을 추가하려면 `openclaw config set agents.defaults.models '<json>' --strict-json --merge`를 사용하세요. `config set`은 `--replace`를 전달하지 않으면 기존 allowlist 항목을 제거하는 교체를 거부합니다.
  - provider 범위 configure/onboarding 흐름은 선택된 provider 모델을 이 맵에 병합하고, 이미 구성된 관련 없는 provider는 보존합니다.
- `params`: 모든 모델에 적용되는 전역 기본 provider 매개변수입니다. `agents.defaults.params`에 설정합니다(예: `{ cacheRetention: "long" }`).
- `params` 병합 우선순위(config): `agents.defaults.params`(전역 기본값)는 `agents.defaults.models["provider/model"].params`(모델별)로 재정의되고, 그다음 `agents.list[].params`(일치하는 에이전트 id)가 키별로 이를 재정의합니다. 자세한 내용은 [프롬프트 캐싱](/ko/reference/prompt-caching)을 참조하세요.
- `embeddedHarness`: 기본 저수준 내장 에이전트 런타임 정책입니다. `runtime: "auto"`를 사용하면 등록된 plugin harness가 지원되는 모델을 가져가게 하고, `runtime: "pi"`를 사용하면 내장 Pi harness를 강제하며, `runtime: "codex"` 같은 등록된 harness id도 사용할 수 있습니다. 자동 Pi fallback을 비활성화하려면 `fallback: "none"`으로 설정하세요.
- 이러한 필드를 변경하는 config 작성기(예: `/models set`, `/models set-image`, fallback 추가/제거 명령)는 정식 객체 형식으로 저장하고 가능한 경우 기존 fallback 목록을 보존합니다.
- `maxConcurrent`: 세션 전체에서 병렬 에이전트 실행의 최대 수입니다(각 세션은 여전히 직렬화됨). 기본값: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness`는 내장 에이전트 턴을 실행할 저수준 실행기를 제어합니다.
대부분의 배포는 기본값 `{ runtime: "auto", fallback: "pi" }`를 유지해야 합니다.
번들 Codex 앱 서버 harness처럼 신뢰할 수 있는 plugin이 기본 harness를 제공할 때 사용하세요.

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"`, 또는 등록된 plugin harness id. 번들 Codex plugin은 `codex`를 등록합니다.
- `fallback`: `"pi"` 또는 `"none"`. `"pi"`는 plugin harness가 선택되지 않았을 때 내장 Pi harness를 호환 fallback으로 유지합니다. `"none"`은 누락되었거나 지원되지 않는 plugin harness 선택이 조용히 Pi를 사용하는 대신 실패하도록 합니다. 선택된 plugin harness 실패는 항상 직접 표시됩니다.
- 환경 변수 재정의: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>`는 `runtime`을 재정의하고, `OPENCLAW_AGENT_HARNESS_FALLBACK=none`은 해당 프로세스에서 Pi fallback을 비활성화합니다.
- Codex 전용 배포의 경우 `model: "codex/gpt-5.4"`, `embeddedHarness.runtime: "codex"`, `embeddedHarness.fallback: "none"`을 설정하세요.
- 이는 내장 채팅 harness만 제어합니다. 미디어 생성, vision, PDF, 음악, 비디오, TTS는 여전히 해당 provider/model 설정을 사용합니다.

**내장 별칭 단축 이름**(`agents.defaults.models`에 모델이 있을 때만 적용):

| 별칭                | 모델                                   |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

사용자가 구성한 별칭은 항상 기본값보다 우선합니다.

Z.AI GLM-4.x 모델은 `--thinking off`를 설정하거나 `agents.defaults.models["zai/<model>"].params.thinking`을 직접 정의하지 않는 한 자동으로 thinking 모드를 활성화합니다.
Z.AI 모델은 도구 호출 스트리밍을 위해 기본적으로 `tool_stream`을 활성화합니다. 비활성화하려면 `agents.defaults.models["zai/<model>"].params.tool_stream`을 `false`로 설정하세요.
Anthropic Claude 4.6 모델은 명시적인 thinking 수준이 설정되지 않았을 때 기본적으로 `adaptive` thinking을 사용합니다.

### `agents.defaults.cliBackends`

텍스트 전용 fallback 실행(도구 호출 없음)을 위한 선택적 CLI 백엔드입니다. API provider가 실패할 때 백업으로 유용합니다.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI 백엔드는 텍스트 우선이며, 도구는 항상 비활성화됩니다.
- `sessionArg`가 설정되어 있으면 세션이 지원됩니다.
- `imageArg`가 파일 경로를 받는 경우 이미지 전달이 지원됩니다.

### `agents.defaults.systemPromptOverride`

OpenClaw가 조합한 전체 시스템 프롬프트를 고정 문자열로 대체합니다. 기본 수준(`agents.defaults.systemPromptOverride`) 또는 에이전트별(`agents.list[].systemPromptOverride`)로 설정합니다. 에이전트별 값이 우선하며, 비어 있거나 공백만 있는 값은 무시됩니다. 제어된 프롬프트 실험에 유용합니다.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

모델 계열별로 적용되는 provider 독립적 프롬프트 오버레이입니다. GPT-5 계열 모델 id는 provider 전반에서 공유되는 동작 계약을 받으며, `personality`는 친근한 상호작용 스타일 레이어만 제어합니다.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"`(기본값)와 `"on"`은 친근한 상호작용 스타일 레이어를 활성화합니다.
- `"off"`는 친근한 레이어만 비활성화하며, 태그가 붙은 GPT-5 동작 계약은 계속 활성화됩니다.
- 레거시 `plugins.entries.openai.config.personality`는 이 공유 설정이 없을 때 여전히 읽힙니다.

### `agents.defaults.heartbeat`

주기적 Heartbeat 실행입니다.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m이면 비활성화
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // 기본값: true, false이면 시스템 프롬프트에서 Heartbeat 섹션 생략
        lightContext: false, // 기본값: false, true이면 workspace bootstrap 파일 중 HEARTBEAT.md만 유지
        isolatedSession: false, // 기본값: false, true이면 각 Heartbeat를 새 세션에서 실행(대화 기록 없음)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (기본값) | block
        target: "none", // 기본값: none | 옵션: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: 기간 문자열(ms/s/m/h)입니다. 기본값: `30m`(API 키 인증) 또는 `1h`(OAuth 인증). 비활성화하려면 `0m`으로 설정하세요.
- `includeSystemPromptSection`: false이면 시스템 프롬프트에서 Heartbeat 섹션을 생략하고 bootstrap 컨텍스트에 `HEARTBEAT.md`를 주입하지 않습니다. 기본값: `true`.
- `suppressToolErrorWarnings`: true이면 Heartbeat 실행 중 도구 오류 경고 페이로드를 억제합니다.
- `timeoutSeconds`: 중단되기 전 Heartbeat 에이전트 턴에 허용되는 최대 시간(초)입니다. 설정하지 않으면 `agents.defaults.timeoutSeconds`를 사용합니다.
- `directPolicy`: 직접/DM 전달 정책입니다. `allow`(기본값)은 직접 대상 전달을 허용합니다. `block`은 직접 대상 전달을 억제하고 `reason=dm-blocked`를 출력합니다.
- `lightContext`: true이면 Heartbeat 실행은 경량 bootstrap 컨텍스트를 사용하고 workspace bootstrap 파일 중 `HEARTBEAT.md`만 유지합니다.
- `isolatedSession`: true이면 각 Heartbeat는 이전 대화 기록이 없는 새 세션에서 실행됩니다. cron의 `sessionTarget: "isolated"`와 동일한 격리 패턴입니다. Heartbeat당 토큰 비용을 약 100K에서 약 2-5K 토큰으로 줄입니다.
- 에이전트별: `agents.list[].heartbeat`를 설정합니다. 어떤 에이전트라도 `heartbeat`를 정의하면 **그 에이전트들만** Heartbeat를 실행합니다.
- Heartbeat는 전체 에이전트 턴을 실행하므로, 간격이 짧을수록 더 많은 토큰을 소모합니다.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 등록된 Compaction provider plugin의 id(선택 사항)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // identifierPolicy=custom일 때 사용
        postCompactionSections: ["Session Startup", "Red Lines"], // []이면 재주입 비활성화
        model: "openrouter/anthropic/claude-sonnet-4-6", // 선택적 Compaction 전용 모델 재정의
        notifyUser: true, // Compaction 시작/완료 시 짧은 알림 전송(기본값: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` 또는 `safeguard`(긴 기록용 청크 기반 요약). [Compaction](/ko/concepts/compaction) 참조.
- `provider`: 등록된 Compaction provider plugin의 id입니다. 설정되면 내장 LLM 요약 대신 provider의 `summarize()`가 호출됩니다. 실패 시 내장 방식으로 fallback합니다. provider를 설정하면 `mode: "safeguard"`가 강제됩니다. [Compaction](/ko/concepts/compaction) 참조.
- `timeoutSeconds`: OpenClaw가 중단하기 전 단일 Compaction 작업에 허용되는 최대 시간(초)입니다. 기본값: `900`.
- `identifierPolicy`: `strict`(기본값), `off`, 또는 `custom`. `strict`는 Compaction 요약 중 기본 제공되는 불투명 식별자 보존 지침을 앞에 추가합니다.
- `identifierInstructions`: `identifierPolicy=custom`일 때 사용되는 선택적 사용자 지정 식별자 보존 텍스트입니다.
- `postCompactionSections`: Compaction 후 재주입할 선택적 AGENTS.md H2/H3 섹션 이름입니다. 기본값은 `["Session Startup", "Red Lines"]`이며, 재주입을 비활성화하려면 `[]`로 설정하세요. 설정되지 않았거나 이 기본 쌍으로 명시적으로 설정된 경우, 이전 `Every Session`/`Safety` 제목도 레거시 fallback으로 허용됩니다.
- `model`: Compaction 요약 전용의 선택적 `provider/model-id` 재정의입니다. 메인 세션은 한 모델을 유지하면서 Compaction 요약은 다른 모델에서 실행해야 할 때 사용합니다. 설정되지 않으면 Compaction은 세션의 기본 모델을 사용합니다.
- `notifyUser`: `true`이면 Compaction 시작과 완료 시 사용자에게 짧은 알림을 보냅니다(예: "Compacting context..." 및 "Compaction complete"). 기본적으로는 Compaction을 조용히 유지하기 위해 비활성화되어 있습니다.
- `memoryFlush`: durable 메모리를 저장하기 위해 자동 Compaction 전에 실행되는 무음 에이전트 턴입니다. workspace가 읽기 전용이면 건너뜁니다.

### `agents.defaults.contextPruning`

LLM에 보내기 전에 메모리 내 컨텍스트에서 **오래된 도구 결과**를 정리합니다. 디스크의 세션 기록은 **수정하지 않습니다**.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // 기간(ms/s/m/h), 기본 단위: 분
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl 모드 동작">

- `mode: "cache-ttl"`은 정리 패스를 활성화합니다.
- `ttl`은 마지막 캐시 터치 이후 언제 다시 정리를 실행할 수 있는지 제어합니다.
- 정리는 먼저 큰 도구 결과를 soft-trim하고, 필요하면 더 오래된 도구 결과를 hard-clear합니다.

**Soft-trim**은 앞부분과 끝부분을 유지하고 중간에 `...`를 삽입합니다.

**Hard-clear**는 전체 도구 결과를 플레이스홀더로 대체합니다.

참고:

- 이미지 블록은 절대 trim/clear되지 않습니다.
- 비율은 정확한 토큰 수가 아니라 문자 수 기준(대략적)입니다.
- `keepLastAssistants`보다 적은 assistant 메시지만 존재하면 정리는 건너뜁니다.

</Accordion>

동작 세부 정보는 [세션 정리](/ko/concepts/session-pruning)를 참조하세요.

### 블록 스트리밍

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (minMs/maxMs 사용)
    },
  },
}
```

- Telegram이 아닌 채널에서는 블록 응답을 활성화하려면 명시적으로 `*.blockStreaming: true`가 필요합니다.
- 채널 재정의: `channels.<channel>.blockStreamingCoalesce`(및 계정별 변형). Signal/Slack/Discord/Google Chat 기본값은 `minChars: 1500`입니다.
- `humanDelay`: 블록 응답 사이의 무작위 지연입니다. `natural` = 800–2500ms. 에이전트별 재정의: `agents.list[].humanDelay`.

동작 및 청크 세부 정보는 [스트리밍](/ko/concepts/streaming)을 참조하세요.

### 타이핑 표시기

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- 기본값: 다이렉트 채팅/멘션에는 `instant`, 멘션되지 않은 그룹 채팅에는 `message`.
- 세션별 재정의: `session.typingMode`, `session.typingIntervalSeconds`.

[타이핑 표시기](/ko/concepts/typing-indicators)를 참조하세요.

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

내장 에이전트용 선택적 샌드박싱입니다. 전체 가이드는 [샌드박싱](/ko/gateway/sandboxing)을 참조하세요.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRef / 인라인 내용도 지원:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="샌드박스 세부 정보">

**백엔드:**

- `docker`: 로컬 Docker 런타임(기본값)
- `ssh`: 일반 SSH 기반 원격 런타임
- `openshell`: OpenShell 런타임

`backend: "openshell"`이 선택되면, 런타임별 설정은
`plugins.entries.openshell.config`로 이동합니다.

**SSH 백엔드 config:**

- `target`: `user@host[:port]` 형식의 SSH 대상
- `command`: SSH 클라이언트 명령(기본값: `ssh`)
- `workspaceRoot`: 범위별 workspace에 사용되는 절대 원격 루트
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH에 전달되는 기존 로컬 파일
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw가 런타임에 임시 파일로 구체화하는 인라인 내용 또는 SecretRef
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH 호스트 키 정책 설정

**SSH 인증 우선순위:**

- `identityData`가 `identityFile`보다 우선
- `certificateData`가 `certificateFile`보다 우선
- `knownHostsData`가 `knownHostsFile`보다 우선
- SecretRef 기반 `*Data` 값은 샌드박스 세션이 시작되기 전에 활성 secrets 런타임 스냅샷에서 확인됩니다

**SSH 백엔드 동작:**

- 생성 또는 재생성 후 원격 workspace를 한 번 시드합니다
- 이후 원격 SSH workspace를 정식 기준으로 유지합니다
- `exec`, 파일 도구, 미디어 경로를 SSH를 통해 라우팅합니다
- 원격 변경 사항을 호스트로 자동 동기화하지 않습니다
- 샌드박스 브라우저 컨테이너를 지원하지 않습니다

**Workspace 접근:**

- `none`: `~/.openclaw/sandboxes` 아래의 범위별 샌드박스 workspace
- `ro`: `/workspace`에 샌드박스 workspace, `/agent`에 읽기 전용으로 마운트된 에이전트 workspace
- `rw`: 에이전트 workspace를 `/workspace`에 읽기/쓰기 가능하게 마운트

**범위:**

- `session`: 세션별 컨테이너 + workspace
- `agent`: 에이전트별 하나의 컨테이너 + workspace(기본값)
- `shared`: 공유 컨테이너 및 workspace(세션 간 격리 없음)

**OpenShell plugin config:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // 선택 사항
          gatewayEndpoint: "https://lab.example", // 선택 사항
          policy: "strict", // 선택적 OpenShell policy id
          providers: ["openai"], // 선택 사항
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell 모드:**

- `mirror`: exec 전에 로컬에서 원격으로 시드하고, exec 후 다시 동기화합니다. 로컬 workspace가 정식 기준으로 유지됩니다
- `remote`: 샌드박스가 생성될 때 원격을 한 번 시드한 뒤, 이후에는 원격 workspace를 정식 기준으로 유지합니다

`remote` 모드에서는 시드 단계 이후 OpenClaw 외부에서 이루어진 호스트 로컬 편집이 샌드박스로 자동 동기화되지 않습니다.
전송은 OpenShell 샌드박스로의 SSH를 사용하지만, plugin이 샌드박스 수명주기와 선택적 mirror 동기화를 소유합니다.

**`setupCommand`**는 컨테이너 생성 후 한 번 실행됩니다(`sh -lc`를 통해). 네트워크 이그레스, 쓰기 가능한 루트, root 사용자가 필요합니다.

**컨테이너 기본값은 `network: "none"`**입니다. 에이전트에 아웃바운드 접근이 필요하면 `"bridge"`(또는 사용자 지정 브리지 네트워크)로 설정하세요.
`"host"`는 차단됩니다. `"container:<id>"`도 기본적으로 차단되며,
명시적으로 `sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`를 설정한 경우에만 허용됩니다(비상 모드).

**인바운드 첨부 파일**은 활성 workspace의 `media/inbound/*`에 임시 저장됩니다.

**`docker.binds`**는 추가 호스트 디렉터리를 마운트하며, 전역 및 에이전트별 bind는 병합됩니다.

**샌드박스 브라우저**(`sandbox.browser.enabled`): 컨테이너 안의 Chromium + CDP입니다. noVNC URL이 시스템 프롬프트에 주입됩니다. `openclaw.json`에서 `browser.enabled`는 필요하지 않습니다.
noVNC 관찰자 접근은 기본적으로 VNC 인증을 사용하며, OpenClaw는 공유 URL에 비밀번호를 노출하는 대신 수명이 짧은 토큰 URL을 출력합니다.

- `allowHostControl: false`(기본값)는 샌드박스 세션이 호스트 브라우저를 대상으로 하는 것을 차단합니다.
- `network` 기본값은 `openclaw-sandbox-browser`(전용 브리지 네트워크)입니다. 전역 브리지 연결이 명시적으로 필요한 경우에만 `bridge`로 설정하세요.
- `cdpSourceRange`는 선택적으로 컨테이너 경계에서 CDP 인그레스를 CIDR 범위(예: `172.21.0.1/32`)로 제한합니다.
- `sandbox.browser.binds`는 추가 호스트 디렉터리를 샌드박스 브라우저 컨테이너에만 마운트합니다. 설정되면(`[]` 포함) 브라우저 컨테이너에서는 `docker.binds`를 대체합니다.
- 시작 기본값은 `scripts/sandbox-browser-entrypoint.sh`에 정의되어 있으며 컨테이너 호스트에 맞게 조정되어 있습니다:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<OPENCLAW_BROWSER_CDP_PORT에서 파생>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions`(기본적으로 활성화됨)
  - `--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`는 기본적으로 활성화되어 있으며, WebGL/3D 사용이 필요하면 `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`으로 비활성화할 수 있습니다.
  - 워크플로가 확장 기능에 의존하는 경우 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`으로 확장 기능을 다시 활성화할 수 있습니다.
  - `--renderer-process-limit=2`는 `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`으로 변경할 수 있으며, Chromium 기본 프로세스 제한을 사용하려면 `0`으로 설정하세요.
  - `noSandbox`가 활성화되면 `--no-sandbox`와 `--disable-setuid-sandbox`도 추가됩니다.
  - 기본값은 컨테이너 이미지 기준선입니다. 컨테이너 기본값을 변경하려면 사용자 지정 엔트리포인트가 포함된 사용자 지정 브라우저 이미지를 사용하세요.

</Accordion>

브라우저 샌드박싱과 `sandbox.docker.binds`는 Docker 전용입니다.

이미지 빌드:

```bash
scripts/sandbox-setup.sh           # 메인 샌드박스 이미지
scripts/sandbox-browser-setup.sh   # 선택적 브라우저 이미지
```

### `agents.list`(에이전트별 재정의)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // 또는 { primary, fallbacks }
        thinkingDefault: "high", // 에이전트별 thinking 수준 재정의
        reasoningDefault: "on", // 에이전트별 reasoning 가시성 재정의
        fastModeDefault: false, // 에이전트별 빠른 모드 재정의
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // 일치하는 defaults.models params를 키별로 재정의
        skills: ["docs-search"], // 설정되면 agents.defaults.skills를 대체
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: 안정적인 에이전트 id(필수).
- `default`: 여러 개가 설정되면 첫 번째가 우선합니다(경고 로그 기록). 아무것도 설정되지 않으면 목록의 첫 번째 항목이 기본값입니다.
- `model`: 문자열 형식은 `primary`만 재정의하고, 객체 형식 `{ primary, fallbacks }`는 둘 다 재정의합니다(`[]`는 전역 fallback 비활성화). `primary`만 재정의하는 cron 작업도 `fallbacks: []`를 설정하지 않으면 기본 fallback을 계속 상속합니다.
- `params`: `agents.defaults.models`의 선택된 모델 항목 위에 병합되는 에이전트별 스트림 params입니다. 전체 모델 카탈로그를 중복하지 않고 `cacheRetention`, `temperature`, `maxTokens` 같은 에이전트별 재정의에 사용하세요.
- `skills`: 선택적 에이전트별 skill allowlist입니다. 생략되면 설정된 경우 에이전트는 `agents.defaults.skills`를 상속합니다. 명시적 목록은 기본값을 병합하지 않고 대체하며, `[]`는 skill 없음입니다.
- `thinkingDefault`: 선택적 에이전트별 기본 thinking 수준(`off | minimal | low | medium | high | xhigh | adaptive | max`)입니다. 메시지별 또는 세션 재정의가 없을 때 이 에이전트의 `agents.defaults.thinkingDefault`를 재정의합니다.
- `reasoningDefault`: 선택적 에이전트별 기본 reasoning 가시성(`on | off | stream`)입니다. 메시지별 또는 세션 reasoning 재정의가 없을 때 적용됩니다.
- `fastModeDefault`: 선택적 에이전트별 기본 빠른 모드 값(`true | false`)입니다. 메시지별 또는 세션 fast-mode 재정의가 없을 때 적용됩니다.
- `embeddedHarness`: 선택적 에이전트별 저수준 harness 정책 재정의입니다. 한 에이전트를 Codex 전용으로 만들고 다른 에이전트는 기본 Pi fallback을 유지하려면 `{ runtime: "codex", fallback: "none" }`를 사용하세요.
- `runtime`: 선택적 에이전트별 런타임 설명자입니다. 에이전트가 기본적으로 ACP harness 세션을 사용해야 하는 경우 `runtime.acp` 기본값(`agent`, `backend`, `mode`, `cwd`)과 함께 `type: "acp"`를 사용하세요.
- `identity.avatar`: workspace 기준 상대 경로, `http(s)` URL, 또는 `data:` URI입니다.
- `identity`는 기본값을 파생합니다: `ackReaction`은 `emoji`에서, `mentionPatterns`는 `name`/`emoji`에서 파생됩니다.
- `subagents.allowAgents`: `sessions_spawn`용 에이전트 id allowlist입니다(`["*"]` = 모두 허용, 기본값: 같은 에이전트만).
- 샌드박스 상속 보호: 요청자 세션이 샌드박스 안에 있으면, `sessions_spawn`은 샌드박스 없이 실행될 대상을 거부합니다.
- `subagents.requireAgentId`: true이면 `agentId`를 생략한 `sessions_spawn` 호출을 차단합니다(명시적인 프로필 선택 강제, 기본값: false).

---

## 멀티 에이전트 라우팅

하나의 Gateway 안에서 여러 개의 격리된 에이전트를 실행합니다. [멀티 에이전트](/ko/concepts/multi-agent)를 참조하세요.

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### 바인딩 match 필드

- `type`(선택 사항): 일반 라우팅은 `route`(`type`이 없으면 기본적으로 route), 영구 ACP 대화 바인딩은 `acp`.
- `match.channel`(필수)
- `match.accountId`(선택 사항; `*` = 모든 계정, 생략 = 기본 계정)
- `match.peer`(선택 사항; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId`(선택 사항; 채널별)
- `acp`(선택 사항; `type: "acp"`일 때만): `{ mode, label, cwd, backend }`

**결정적 match 순서:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`(정확 일치, peer/guild/team 없음)
5. `match.accountId: "*"`(채널 전체)
6. 기본 에이전트

같은 단계 내에서는 첫 번째로 일치하는 `bindings` 항목이 우선합니다.

`type: "acp"` 항목의 경우, OpenClaw는 정확한 대화 ID(`match.channel` + account + `match.peer.id`)로 해석하며 위의 route 바인딩 단계 순서를 사용하지 않습니다.

### 에이전트별 액세스 프로필

<Accordion title="전체 액세스(샌드박스 없음)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="읽기 전용 도구 + workspace">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="파일시스템 액세스 없음(메시징 전용)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

우선순위 세부 정보는 [멀티 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools)를 참조하세요.

---

## 세션

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // 이 토큰 수를 넘으면 부모 스레드 포크 건너뜀(0이면 비활성화)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // 기간 또는 false
      maxDiskBytes: "500mb", // 선택적 하드 예산
      highWaterBytes: "400mb", // 선택적 정리 목표
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // 기본 비활성 자동 unfocus 시간(시간 단위, `0`이면 비활성화)
      maxAgeHours: 0, // 기본 하드 최대 수명 시간(시간 단위, `0`이면 비활성화)
    },
    mainKey: "main", // 레거시(런타임은 항상 "main" 사용)
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="세션 필드 세부 정보">

- **`scope`**: 그룹 채팅 컨텍스트용 기본 세션 그룹화 전략입니다.
  - `per-sender`(기본값): 채널 컨텍스트 내에서 각 발신자가 격리된 세션을 가집니다.
  - `global`: 채널 컨텍스트의 모든 참여자가 하나의 세션을 공유합니다(공유 컨텍스트가 의도된 경우에만 사용).
- **`dmScope`**: DM 그룹화 방식입니다.
  - `main`: 모든 DM이 메인 세션을 공유합니다.
  - `per-peer`: 채널 전반에서 발신자 id 기준으로 격리합니다.
  - `per-channel-peer`: 채널 + 발신자별로 격리합니다(다중 사용자 수신함에 권장).
  - `per-account-channel-peer`: 계정 + 채널 + 발신자별로 격리합니다(다중 계정에 권장).
- **`identityLinks`**: 채널 간 세션 공유를 위해 정식 id를 provider 접두사가 있는 피어에 매핑합니다.
- **`reset`**: 기본 리셋 정책입니다. `daily`는 로컬 시간 `atHour`에 리셋되고, `idle`은 `idleMinutes` 후 리셋됩니다. 둘 다 설정되면 먼저 만료되는 쪽이 우선합니다.
- **`resetByType`**: 유형별 재정의(`direct`, `group`, `thread`). 레거시 `dm`은 `direct`의 별칭으로 허용됩니다.
- **`parentForkMaxTokens`**: 포크된 스레드 세션을 만들 때 허용되는 최대 부모 세션 `totalTokens`입니다(기본값 `100000`).
  - 부모 `totalTokens`가 이 값을 넘으면, OpenClaw는 부모 transcript 기록을 상속하는 대신 새 스레드 세션을 시작합니다.
  - 이 보호 장치를 비활성화하고 항상 부모 포크를 허용하려면 `0`으로 설정하세요.
- **`mainKey`**: 레거시 필드입니다. 런타임은 메인 다이렉트 채팅 버킷에 항상 `"main"`을 사용합니다.
- **`agentToAgent.maxPingPongTurns`**: 에이전트 간 교환 중 최대 상호 응답 턴 수입니다(정수, 범위: `0`–`5`). `0`이면 ping-pong 체이닝이 비활성화됩니다.
- **`sendPolicy`**: `channel`, `chatType`(`direct|group|channel`, 레거시 `dm` 별칭 포함), `keyPrefix`, 또는 `rawKeyPrefix`로 매칭합니다. 첫 번째 deny가 우선합니다.
- **`maintenance`**: 세션 저장소 정리 + 보존 제어입니다.
  - `mode`: `warn`은 경고만 출력하고, `enforce`는 정리를 적용합니다.
  - `pruneAfter`: 오래된 항목의 만료 기준 기간입니다(기본값 `30d`).
  - `maxEntries`: `sessions.json`의 최대 항목 수입니다(기본값 `500`).
  - `rotateBytes`: `sessions.json`이 이 크기를 넘으면 회전시킵니다(기본값 `10mb`).
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcript 아카이브의 보존 기간입니다. 기본적으로 `pruneAfter`를 따르며, 비활성화하려면 `false`로 설정하세요.
  - `maxDiskBytes`: 선택적 세션 디렉터리 디스크 예산입니다. `warn` 모드에서는 경고를 기록하고, `enforce` 모드에서는 가장 오래된 아티팩트/세션부터 제거합니다.
  - `highWaterBytes`: 예산 정리 후 선택적 목표값입니다. 기본값은 `maxDiskBytes`의 `80%`입니다.
- **`threadBindings`**: 스레드 바운드 세션 기능의 전역 기본값입니다.
  - `enabled`: 마스터 기본 스위치(provider가 재정의 가능, Discord는 `channels.discord.threadBindings.enabled` 사용)
  - `idleHours`: 기본 비활성 자동 unfocus 시간(시간 단위, `0`이면 비활성화, provider가 재정의 가능)
  - `maxAgeHours`: 기본 하드 최대 수명 시간(시간 단위, `0`이면 비활성화, provider가 재정의 가능)

</Accordion>

---

## 메시지

```json5
{
  messages: {
    responsePrefix: "🦞", // 또는 "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0이면 비활성화
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 응답 접두사

채널별/계정별 재정의: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

확인 순서(가장 구체적인 값이 우선): 계정 → 채널 → 전역. `""`는 비활성화하며 상위 전파도 중단합니다. `"auto"`는 `[{identity.name}]`를 파생합니다.

**템플릿 변수:**

| 변수              | 설명                 | 예시                        |
| ----------------- | -------------------- | --------------------------- |
| `{model}`         | 짧은 모델 이름       | `claude-opus-4-6`           |
| `{modelFull}`     | 전체 모델 식별자     | `anthropic/claude-opus-4-6` |
| `{provider}`      | provider 이름        | `anthropic`                 |
| `{thinkingLevel}` | 현재 thinking 수준   | `high`, `low`, `off`        |
| `{identity.name}` | 에이전트 identity 이름 | (`"auto"`와 동일)         |

변수는 대소문자를 구분하지 않습니다. `{think}`는 `{thinkingLevel}`의 별칭입니다.

### 확인 반응

- 기본값은 활성 에이전트의 `identity.emoji`, 없으면 `"👀"`입니다. 비활성화하려면 `""`로 설정하세요.
- 채널별 재정의: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- 확인 순서: 계정 → 채널 → `messages.ackReaction` → identity fallback.
- 범위: `group-mentions`(기본값), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: Slack, Discord, Telegram에서 응답 후 확인 반응을 제거합니다.
- `messages.statusReactions.enabled`: Slack, Discord, Telegram에서 수명 주기 상태 반응을 활성화합니다.
  Slack과 Discord에서는 설정하지 않으면 ack 반응이 활성화된 경우 상태 반응도 활성화된 상태를 유지합니다.
  Telegram에서는 수명 주기 상태 반응을 활성화하려면 명시적으로 `true`로 설정하세요.

### 인바운드 디바운스

같은 발신자가 빠르게 보낸 텍스트 전용 메시지를 하나의 에이전트 턴으로 묶습니다. 미디어/첨부 파일은 즉시 플러시됩니다. 제어 명령은 디바운스를 우회합니다.

### TTS(text-to-speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto`는 기본 자동 TTS 모드를 제어합니다: `off`, `always`, `inbound`, 또는 `tagged`. `/tts on|off`는 로컬 설정을 재정의할 수 있고, `/tts status`는 실제 상태를 표시합니다.
- `summaryModel`은 자동 요약용으로 `agents.defaults.model.primary`를 재정의합니다.
- `modelOverrides`는 기본적으로 활성화되어 있으며, `modelOverrides.allowProvider`의 기본값은 `false`(opt-in)입니다.
- API 키는 `ELEVENLABS_API_KEY`/`XI_API_KEY` 및 `OPENAI_API_KEY`로 fallback합니다.
- `openai.baseUrl`은 OpenAI TTS 엔드포인트를 재정의합니다. 확인 순서는 config, 그다음 `OPENAI_TTS_BASE_URL`, 그다음 `https://api.openai.com/v1`입니다.
- `openai.baseUrl`이 OpenAI가 아닌 엔드포인트를 가리키면, OpenClaw는 이를 OpenAI 호환 TTS 서버로 간주하고 모델/음성 검증을 완화합니다.

---

## Talk

Talk 모드용 기본값(macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider`는 여러 Talk provider가 구성된 경우 `talk.providers`의 키와 일치해야 합니다.
- 레거시 평면 Talk 키(`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`)는 호환성 전용이며 `talk.providers.<provider>`로 자동 마이그레이션됩니다.
- 음성 ID는 `ELEVENLABS_VOICE_ID` 또는 `SAG_VOICE_ID`로 fallback합니다.
- `providers.*.apiKey`는 일반 텍스트 문자열 또는 SecretRef 객체를 받을 수 있습니다.
- `ELEVENLABS_API_KEY` fallback은 Talk API 키가 구성되지 않은 경우에만 적용됩니다.
- `providers.*.voiceAliases`를 사용하면 Talk 지시문에서 친숙한 이름을 사용할 수 있습니다.
- `silenceTimeoutMs`는 사용자가 침묵한 후 Talk 모드가 transcript를 보내기까지 기다리는 시간을 제어합니다. 설정하지 않으면 플랫폼 기본 일시정지 창을 유지합니다(`macOS와 Android는 700 ms, iOS는 900 ms`).

---

## 도구

### 도구 프로필

`tools.profile`은 `tools.allow`/`tools.deny`보다 먼저 기본 allowlist를 설정합니다:

로컬 온보딩은 설정되지 않은 새 로컬 config에 기본적으로 `tools.profile: "coding"`을 설정합니다(기존의 명시적 프로필은 보존됨).

| 프로필      | 포함 항목                                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status`만                                                                                                               |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | 제한 없음(설정하지 않은 것과 동일)                                                                                               |

### 도구 그룹

| 그룹               | 도구                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash`는 `exec`의 별칭으로 허용됨)                                                 |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                 |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                          |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                  |
| `group:ui`         | `browser`, `canvas`                                                                                                    |
| `group:automation` | `cron`, `gateway`                                                                                                      |
| `group:messaging`  | `message`                                                                                                              |
| `group:nodes`      | `nodes`                                                                                                                |
| `group:agents`     | `agents_list`                                                                                                          |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                     |
| `group:openclaw`   | 모든 내장 도구(provider plugin 제외)                                                                                   |

### `tools.allow` / `tools.deny`

전역 도구 허용/거부 정책입니다(거부가 우선). 대소문자를 구분하지 않으며 `*` 와일드카드를 지원합니다. Docker 샌드박스가 꺼져 있어도 적용됩니다.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

특정 provider 또는 모델에 대해 도구를 추가로 제한합니다. 순서: 기본 프로필 → provider 프로필 → allow/deny.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

샌드박스 외부의 elevated exec 접근을 제어합니다:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- 에이전트별 재정의(`agents.list[].tools.elevated`)는 추가 제한만 할 수 있습니다.
- `/elevated on|off|ask|full`은 상태를 세션별로 저장하며, 인라인 지시문은 단일 메시지에만 적용됩니다.
- Elevated `exec`는 샌드박싱을 우회하고 구성된 탈출 경로를 사용합니다(기본값은 `gateway`, exec 대상이 `node`일 때는 `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.4"],
      },
    },
  },
}
```

### `tools.loopDetection`

도구 루프 안전성 검사는 기본적으로 **비활성화**되어 있습니다. 감지를 활성화하려면 `enabled: true`를 설정하세요.
설정은 전역 `tools.loopDetection`에 정의할 수 있으며, 에이전트별로 `agents.list[].tools.loopDetection`에서 재정의할 수 있습니다.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: 루프 분석을 위해 유지하는 최대 도구 호출 기록 수입니다.
- `warningThreshold`: 경고를 발생시키는 반복 무진행 패턴 임계값입니다.
- `criticalThreshold`: 치명적 루프를 차단하기 위한 더 높은 반복 임계값입니다.
- `globalCircuitBreakerThreshold`: 어떤 무진행 실행에도 적용되는 하드 중단 임계값입니다.
- `detectors.genericRepeat`: 같은 도구/같은 인수의 반복 호출에 대해 경고합니다.
- `detectors.knownPollNoProgress`: 알려진 poll 도구(`process.poll`, `command_status` 등)의 무진행에 대해 경고/차단합니다.
- `detectors.pingPong`: 번갈아 나타나는 무진행 쌍 패턴에 대해 경고/차단합니다.
- `warningThreshold >= criticalThreshold` 또는 `criticalThreshold >= globalCircuitBreakerThreshold`이면 검증이 실패합니다.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // 또는 BRAVE_API_KEY 환경 변수
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // 선택 사항, 자동 감지를 원하면 생략
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

인바운드 미디어 이해(이미지/오디오/비디오)를 구성합니다:

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: 완료된 비동기 음악/비디오를 채널로 직접 전송
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="미디어 모델 항목 필드">

**Provider 항목**(`type: "provider"` 또는 생략):

- `provider`: API provider id(`openai`, `anthropic`, `google`/`gemini`, `groq` 등)
- `model`: 모델 id 재정의
- `profile` / `preferredProfile`: `auth-profiles.json` 프로필 선택

**CLI 항목**(`type: "cli"`):

- `command`: 실행할 실행 파일
- `args`: 템플릿 인수(`{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` 등 지원)

**공통 필드:**

- `capabilities`: 선택적 목록(`image`, `audio`, `video`). 기본값: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: 항목별 재정의.
- 실패 시 다음 항목으로 fallback합니다.

Provider 인증은 표준 순서를 따릅니다: `auth-profiles.json` → 환경 변수 → `models.providers.*.apiKey`.

**비동기 완료 필드:**

- `asyncCompletion.directSend`: `true`이면 완료된 비동기 `music_generate`
  및 `video_generate` 작업은 먼저 채널 직접 전달을 시도합니다. 기본값:
  `false`(레거시 요청자 세션 깨우기/모델 전달 경로).

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

세션 도구(`sessions_list`, `sessions_history`, `sessions_send`)가 어떤 세션을 대상으로 할 수 있는지 제어합니다.

기본값: `tree`(현재 세션 + 해당 세션이 생성한 세션, 예: 하위 에이전트).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

참고:

- `self`: 현재 세션 키만.
- `tree`: 현재 세션 + 현재 세션이 생성한 세션(하위 에이전트).
- `agent`: 현재 에이전트 id에 속한 모든 세션(같은 에이전트 id 아래에서 발신자별 세션을 실행하는 경우 다른 사용자도 포함될 수 있음).
- `all`: 모든 세션. 에이전트 간 대상 지정에는 여전히 `tools.agentToAgent`가 필요합니다.
- 샌드박스 clamp: 현재 세션이 샌드박스 상태이고 `agents.defaults.sandbox.sessionToolsVisibility="spawned"`이면, `tools.sessions.visibility="all"`이어도 visibility는 강제로 `tree`가 됩니다.

### `tools.sessions_spawn`

`sessions_spawn`의 인라인 첨부 파일 지원을 제어합니다.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: true로 설정하면 인라인 파일 첨부 허용
        maxTotalBytes: 5242880, // 모든 파일 합계 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // 파일당 1 MB
        retainOnSessionKeep: false, // cleanup="keep"일 때 첨부 파일 유지
      },
    },
  },
}
```

참고:

- 첨부 파일은 `runtime: "subagent"`에서만 지원됩니다. ACP 런타임은 이를 거부합니다.
- 파일은 자식 workspace의 `.openclaw/attachments/<uuid>/`에 `.manifest.json`과 함께 구체화됩니다.
- 첨부 파일 내용은 transcript 저장에서 자동으로 비식별화됩니다.
- Base64 입력은 엄격한 알파벳/패딩 검사와 디코딩 전 크기 보호 검사를 거칩니다.
- 파일 권한은 디렉터리 `0700`, 파일 `0600`입니다.
- 정리는 `cleanup` 정책을 따릅니다: `delete`는 항상 첨부 파일을 제거하고, `keep`은 `retainOnSessionKeep: true`일 때만 이를 유지합니다.

<a id="toolsexperimental"></a>

### `tools.experimental`

실험적 내장 도구 플래그입니다. strict-agentic GPT-5 자동 활성화 규칙이 적용되지 않는 한 기본값은 비활성화입니다.

```json5
{
  tools: {
    experimental: {
      planTool: true, // 실험적 update_plan 활성화
    },
  },
}
```

참고:

- `planTool`: 사소하지 않은 다단계 작업 추적을 위한 구조화된 `update_plan` 도구를 활성화합니다.
- 기본값: `agents.defaults.embeddedPi.executionContract`(또는 에이전트별 재정의)가 OpenAI 또는 OpenAI Codex GPT-5 계열 실행에서 `"strict-agentic"`으로 설정된 경우가 아니면 `false`입니다. 이 범위 밖에서도 도구를 강제로 켜려면 `true`로, strict-agentic GPT-5 실행에서도 계속 꺼 두려면 `false`로 설정하세요.
- 활성화되면 시스템 프롬프트에도 사용 지침이 추가되어, 모델이 이를 실질적인 작업에만 사용하고 동시에 최대 하나의 단계만 `in_progress`로 유지하도록 합니다.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: 생성되는 하위 에이전트의 기본 모델입니다. 생략하면 하위 에이전트는 호출자의 모델을 상속합니다.
- `allowAgents`: 요청 에이전트가 자체 `subagents.allowAgents`를 설정하지 않았을 때 `sessions_spawn`용 대상 에이전트 id의 기본 allowlist입니다(`["*"]` = 모두 허용, 기본값: 같은 에이전트만).
- `runTimeoutSeconds`: 도구 호출에서 `runTimeoutSeconds`를 생략했을 때 `sessions_spawn`의 기본 타임아웃(초)입니다. `0`은 타임아웃 없음입니다.
- 하위 에이전트별 도구 정책: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## 사용자 지정 provider 및 base URL

OpenClaw는 내장 모델 카탈로그를 사용합니다. 사용자 지정 provider는 config의 `models.providers` 또는 `~/.openclaw/agents/<agentId>/agent/models.json`을 통해 추가하세요.

```json5
{
  models: {
    mode: "merge", // merge (기본값) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- 사용자 지정 인증이 필요하면 `authHeader: true` + `headers`를 사용하세요.
- 에이전트 config 루트는 `OPENCLAW_AGENT_DIR`(또는 레거시 환경 변수 별칭인 `PI_CODING_AGENT_DIR`)로 재정의할 수 있습니다.
- 일치하는 provider ID에 대한 병합 우선순위:
  - 비어 있지 않은 에이전트 `models.json`의 `baseUrl` 값이 우선합니다.
  - 비어 있지 않은 에이전트 `apiKey` 값은 현재 config/auth-profile 컨텍스트에서 해당 provider가 SecretRef 관리 중이 아닐 때만 우선합니다.
  - SecretRef 관리형 provider `apiKey` 값은 해결된 secret을 저장하지 않고 소스 마커(`env` 참조는 `ENV_VAR_NAME`, 파일/exec 참조는 `secretref-managed`)에서 새로 고쳐집니다.
  - SecretRef 관리형 provider header 값은 소스 마커(`env` 참조는 `secretref-env:ENV_VAR_NAME`, 파일/exec 참조는 `secretref-managed`)에서 새로 고쳐집니다.
  - 비어 있거나 누락된 에이전트 `apiKey`/`baseUrl`은 config의 `models.providers`로 fallback합니다.
  - 일치하는 모델의 `contextWindow`/`maxTokens`는 명시적 config 값과 암시적 카탈로그 값 중 더 큰 값을 사용합니다.
  - 일치하는 모델의 `contextTokens`는 명시적인 런타임 상한이 있으면 이를 보존합니다. 기본 모델 메타데이터를 바꾸지 않고 유효 컨텍스트를 제한하려면 이를 사용하세요.
  - config가 `models.json`을 완전히 덮어쓰게 하려면 `models.mode: "replace"`를 사용하세요.
  - 마커 저장은 소스 권위적입니다. 마커는 해결된 런타임 secret 값이 아니라 활성 소스 config 스냅샷(해결 전)에서 기록됩니다.

### Provider 필드 세부 정보

- `models.mode`: provider 카탈로그 동작(`merge` 또는 `replace`).
- `models.providers`: provider id를 키로 하는 사용자 지정 provider 맵입니다.
  - 안전한 편집: 추가 업데이트에는 `openclaw config set models.providers.<id> '<json>' --strict-json --merge` 또는 `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge`를 사용하세요. `config set`은 `--replace`를 전달하지 않으면 파괴적 교체를 거부합니다.
- `models.providers.*.api`: 요청 어댑터(`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` 등).
- `models.providers.*.apiKey`: provider 자격 증명(SecretRef/환경 변수 치환 권장).
- `models.providers.*.auth`: 인증 전략(`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` 조합에서 요청에 `options.num_ctx`를 주입합니다(기본값: `true`).
- `models.providers.*.authHeader`: 필요할 때 `Authorization` 헤더로 자격 증명을 강제 전송합니다.
- `models.providers.*.baseUrl`: 업스트림 API base URL.
- `models.providers.*.headers`: 프록시/테넌트 라우팅용 추가 정적 헤더.
- `models.providers.*.request`: 모델 provider HTTP 요청의 전송 재정의입니다.
  - `request.headers`: 추가 헤더(provider 기본값과 병합). 값은 SecretRef를 받을 수 있습니다.
  - `request.auth`: 인증 전략 재정의. 모드: `"provider-default"`(provider의 기본 인증 사용), `"authorization-bearer"`(`token`과 함께 사용), `"header"`(`headerName`, `value`, 선택적 `prefix`와 함께 사용).
  - `request.proxy`: HTTP 프록시 재정의. 모드: `"env-proxy"`(`HTTP_PROXY`/`HTTPS_PROXY` 환경 변수 사용), `"explicit-proxy"`(`url`과 함께 사용). 두 모드 모두 선택적 `tls` 하위 객체를 받을 수 있습니다.
  - `request.tls`: 직접 연결용 TLS 재정의. 필드: `ca`, `cert`, `key`, `passphrase`(모두 SecretRef 허용), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: `true`이면 DNS가 private, CGNAT 또는 유사 범위로 해석될 때 `baseUrl`에 대한 HTTPS를 허용합니다. 이는 provider HTTP fetch 가드를 통해 적용되며, 신뢰할 수 있는 자체 호스팅 OpenAI 호환 엔드포인트용 운영자 opt-in입니다. WebSocket은 동일한 `request`를 헤더/TLS에 사용하지만 이 fetch SSRF 게이트는 적용되지 않습니다. 기본값 `false`.
- `models.providers.*.models`: 명시적인 provider 모델 카탈로그 항목.
- `models.providers.*.models.*.contextWindow`: 기본 모델 컨텍스트 창 메타데이터.
- `models.providers.*.models.*.contextTokens`: 선택적 런타임 컨텍스트 상한입니다. 모델의 기본 `contextWindow`보다 더 작은 유효 컨텍스트 예산을 원할 때 사용하세요.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: 선택적 호환성 힌트입니다. `api: "openai-completions"`와 비어 있지 않은 비기본 `baseUrl`(`api.openai.com`이 아닌 호스트) 조합에서는 OpenClaw가 런타임에 이를 강제로 `false`로 설정합니다. 비어 있거나 생략된 `baseUrl`은 기본 OpenAI 동작을 유지합니다.
- `models.providers.*.models.*.compat.requiresStringContent`: 문자열 전용 OpenAI 호환 채팅 엔드포인트를 위한 선택적 호환성 힌트입니다. `true`이면 OpenClaw는 요청 전 순수 텍스트 `messages[].content` 배열을 일반 문자열로 평탄화합니다.
- `plugins.entries.amazon-bedrock.config.discovery`: Bedrock 자동 검색 설정 루트.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: 암시적 검색 켜기/끄기.
- `plugins.entries.amazon-bedrock.config.discovery.region`: 검색용 AWS 리전.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: 대상 검색용 선택적 provider-id 필터.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: 검색 새로 고침 폴링 간격.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: 검색된 모델의 fallback 컨텍스트 창.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: 검색된 모델의 fallback 최대 출력 토큰 수.

### Provider 예제

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Cerebras에는 `cerebras/zai-glm-4.7`을 사용하고, Z.AI 직접 연결에는 `zai/glm-4.7`을 사용하세요.

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

`OPENCODE_API_KEY`(또는 `OPENCODE_ZEN_API_KEY`)를 설정하세요. Zen 카탈로그에는 `opencode/...` 참조를, Go 카탈로그에는 `opencode-go/...` 참조를 사용하세요. 단축 명령: `openclaw onboard --auth-choice opencode-zen` 또는 `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

`ZAI_API_KEY`를 설정하세요. `z.ai/*`와 `z-ai/*`는 허용되는 별칭입니다. 단축 명령: `openclaw onboard --auth-choice zai-api-key`.

- 일반 엔드포인트: `https://api.z.ai/api/paas/v4`
- 코딩 엔드포인트(기본값): `https://api.z.ai/api/coding/paas/v4`
- 일반 엔드포인트를 사용하려면 base URL 재정의가 있는 사용자 지정 provider를 정의하세요.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.6" },
      models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.6",
            name: "Kimi K2.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

중국 엔드포인트용: `baseUrl: "https://api.moonshot.cn/v1"` 또는 `openclaw onboard --auth-choice moonshot-api-key-cn`.

기본 Moonshot 엔드포인트는 공유 `openai-completions` 전송에서 스트리밍 사용량 호환성을 광고하며, OpenClaw는 이를 내장 provider id만이 아니라 엔드포인트 기능 기준으로 판단합니다.

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Anthropic 호환 내장 provider입니다. 단축 명령: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (Anthropic-compatible)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Base URL에는 `/v1`을 포함하지 마세요(Anthropic 클라이언트가 이를 추가합니다). 단축 명령: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (direct)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

`MINIMAX_API_KEY`를 설정하세요. 단축 명령:
`openclaw onboard --auth-choice minimax-global-api` 또는
`openclaw onboard --auth-choice minimax-cn-api`.
모델 카탈로그 기본값은 M2.7만 포함합니다.
Anthropic 호환 스트리밍 경로에서 OpenClaw는 사용자가 명시적으로 `thinking`을 설정하지 않으면 기본적으로 MiniMax thinking을 비활성화합니다. `/fast on` 또는 `params.fastMode: true`는 `MiniMax-M2.7`을 `MiniMax-M2.7-highspeed`로 다시 씁니다.

</Accordion>

<Accordion title="로컬 모델 (LM Studio)">

[로컬 모델](/ko/gateway/local-models)을 참조하세요. 요약: 충분한 하드웨어에서 LM Studio Responses API를 통해 큰 로컬 모델을 실행하고, fallback용으로 호스팅 모델은 병합 상태로 유지하세요.

</Accordion>

---

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 또는 일반 텍스트 문자열
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: 번들된 skills에만 적용되는 선택적 allowlist입니다(관리형/workspace skill에는 영향 없음).
- `load.extraDirs`: 추가 공유 skill 루트(가장 낮은 우선순위).
- `install.preferBrew`: `brew`를 사용할 수 있을 때 다른 설치 방식으로 fallback하기 전에 Homebrew 설치를 우선합니다.
- `install.nodeManager`: `metadata.openclaw.install` 명세용 node 설치 관리자 선호도(`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false`는 번들/설치되어 있어도 해당 skill을 비활성화합니다.
- `entries.<skillKey>.apiKey`: 기본 환경 변수를 선언하는 skill용 편의 필드입니다(일반 텍스트 문자열 또는 SecretRef 객체).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, 그리고 `plugins.load.paths`에서 로드됩니다.
- 검색은 기본 OpenClaw plugin뿐 아니라 호환되는 Codex 번들 및 Claude 번들도 허용하며, 매니페스트가 없는 Claude 기본 레이아웃 번들도 포함합니다.
- **Config 변경에는 gateway 재시작이 필요합니다.**
- `allow`: 선택적 allowlist(목록에 있는 plugin만 로드). `deny`가 우선합니다.
- `plugins.entries.<id>.apiKey`: plugin 수준 API 키 편의 필드(plugin이 지원하는 경우).
- `plugins.entries.<id>.env`: plugin 범위 환경 변수 맵.
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false`이면 core가 `before_prompt_build`를 차단하고 레거시 `before_agent_start`의 프롬프트 변경 필드를 무시하며, 레거시 `modelOverride`와 `providerOverride`는 유지합니다. 기본 plugin hook과 지원되는 번들 제공 hook 디렉터리에 적용됩니다.
- `plugins.entries.<id>.subagent.allowModelOverride`: 이 plugin이 백그라운드 하위 에이전트 실행에 대해 작업별 `provider` 및 `model` 재정의를 요청하도록 명시적으로 신뢰합니다.
- `plugins.entries.<id>.subagent.allowedModels`: 신뢰된 하위 에이전트 재정의를 위한 정식 `provider/model` 대상의 선택적 allowlist입니다. 어떤 모델이든 의도적으로 허용하려는 경우에만 `"*"`를 사용하세요.
- `plugins.entries.<id>.config`: plugin이 정의한 config 객체입니다(가능한 경우 기본 OpenClaw plugin 스키마로 검증됨).
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl 웹 fetch provider 설정.
  - `apiKey`: Firecrawl API 키(SecretRef 허용). `plugins.entries.firecrawl.config.webSearch.apiKey`, 레거시 `tools.web.fetch.firecrawl.apiKey`, 또는 `FIRECRAWL_API_KEY` 환경 변수로 fallback합니다.
  - `baseUrl`: Firecrawl API base URL(기본값: `https://api.firecrawl.dev`).
  - `onlyMainContent`: 페이지의 메인 콘텐츠만 추출합니다(기본값: `true`).
  - `maxAgeMs`: 최대 캐시 보존 시간(밀리초, 기본값: `172800000` / 2일).
  - `timeoutSeconds`: 스크레이프 요청 타임아웃(초, 기본값: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search(Grok 웹 검색) 설정.
  - `enabled`: X Search provider를 활성화합니다.
  - `model`: 검색에 사용할 Grok 모델(예: `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: memory Dreaming 설정. 단계 및 임계값은 [Dreaming](/ko/concepts/dreaming)을 참조하세요.
  - `enabled`: 마스터 Dreaming 스위치(기본값 `false`).
  - `frequency`: 각 전체 Dreaming 스윕의 Cron 주기(기본값 `"0 3 * * *"`).
  - 단계 정책과 임계값은 구현 세부 사항입니다(사용자용 config 키 아님).
- 전체 memory config는 [메모리 구성 참조](/ko/reference/memory-config)에 있습니다:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 활성화된 Claude 번들 plugin은 `settings.json`에서 내장 Pi 기본값도 제공할 수 있습니다. OpenClaw는 이를 원시 OpenClaw config 패치가 아니라 정제된 에이전트 설정으로 적용합니다.
- `plugins.slots.memory`: 활성 memory plugin id를 선택하거나, memory plugin을 비활성화하려면 `"none"`을 설정합니다.
- `plugins.slots.contextEngine`: 활성 context engine plugin id를 선택합니다. 다른 엔진을 설치하고 선택하지 않으면 기본값은 `"legacy"`입니다.
- `plugins.installs`: `openclaw plugins update`가 사용하는 CLI 관리 설치 메타데이터입니다.
  - `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`를 포함합니다.
  - `plugins.installs.*`는 관리형 상태로 취급하세요. 수동 편집보다 CLI 명령 사용을 권장합니다.

[Plugins](/ko/tools/plugin)을 참조하세요.

---

## 브라우저

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 신뢰할 수 있는 private-network 접근에만 opt-in
      // allowPrivateNetwork: true, // 레거시 별칭
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false`는 `act:evaluate`와 `wait --fn`을 비활성화합니다.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork`는 설정하지 않으면 비활성화되므로, 브라우저 탐색은 기본적으로 엄격하게 유지됩니다.
- private-network 브라우저 탐색을 의도적으로 신뢰하는 경우에만 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`를 설정하세요.
- 엄격 모드에서는 원격 CDP 프로필 엔드포인트(`profiles.*.cdpUrl`)도 도달 가능성/검색 검사 중 동일한 private-network 차단의 대상이 됩니다.
- `ssrfPolicy.allowPrivateNetwork`는 레거시 별칭으로 계속 지원됩니다.
- 엄격 모드에서는 명시적 예외에 `ssrfPolicy.hostnameAllowlist` 및 `ssrfPolicy.allowedHostnames`를 사용하세요.
- 원격 프로필은 attach-only입니다(시작/중지/리셋 비활성화).
- `profiles.*.cdpUrl`은 `http://`, `https://`, `ws://`, `wss://`를 받을 수 있습니다.
  OpenClaw가 `/json/version`을 검색하길 원하면 HTTP(S)를 사용하세요.
  provider가 직접 DevTools WebSocket URL을 제공하면 WS(S)를 사용하세요.
- `existing-session` 프로필은 CDP 대신 Chrome MCP를 사용하며, 선택된 호스트 또는 연결된 브라우저 node를 통해 연결할 수 있습니다.
- `existing-session` 프로필은 특정 Chromium 기반 브라우저 프로필(예: Brave 또는 Edge)을 대상으로 하도록 `userDataDir`를 설정할 수 있습니다.
- `existing-session` 프로필은 현재 Chrome MCP 경로 제한을 유지합니다: CSS 선택자 대상 지정 대신 snapshot/ref 기반 작업, 단일 파일 업로드 hook, 대화상자 타임아웃 재정의 없음, `wait --load networkidle` 없음, 그리고 `responsebody`, PDF 내보내기, 다운로드 가로채기, 일괄 작업 없음.
- 로컬 관리형 `openclaw` 프로필은 `cdpPort`와 `cdpUrl`을 자동 할당합니다. 원격 CDP인 경우에만 `cdpUrl`을 명시적으로 설정하세요.
- 자동 감지 순서: 기본 브라우저가 Chromium 기반이면 그것부터 → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Control 서비스: loopback 전용(`gateway.port`에서 파생되는 포트, 기본값 `18791`).
- `extraArgs`는 로컬 Chromium 시작 시 추가 실행 플래그를 덧붙입니다(예: `--disable-gpu`, 창 크기, 디버그 플래그).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // 이모지, 짧은 텍스트, 이미지 URL 또는 data URI
    },
  },
}
```

- `seamColor`: 기본 앱 UI 크롬의 강조 색상입니다(Talk Mode 말풍선 색조 등).
- `assistant`: Control UI identity 재정의입니다. 활성 에이전트 identity로 fallback합니다.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // 또는 OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // mode=trusted-proxy용, /gateway/trusted-proxy-auth 참조
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // 위험: 절대 외부 http(s) embed URL 허용
      // allowedOrigins: ["https://control.example.com"], // non-loopback Control UI에 필요
      // dangerouslyAllowHostHeaderOriginFallback: false, // 위험한 Host-header origin fallback 모드
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // 선택 사항. 기본값 false.
    allowRealIpFallback: false,
    tools: {
      // 추가 /tools/invoke HTTP deny
      deny: ["browser"],
      // 기본 HTTP deny 목록에서 도구 제거
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway 필드 세부 정보">

- `mode`: `local`(gateway 실행) 또는 `remote`(원격 gateway 연결)입니다. `local`이 아니면 gateway는 시작을 거부합니다.
- `port`: WS + HTTP를 위한 단일 멀티플렉스 포트입니다. 우선순위: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback`(기본값), `lan`(`0.0.0.0`), `tailnet`(Tailscale IP 전용), 또는 `custom`.
- **레거시 bind 별칭**: `gateway.bind`에는 호스트 별칭(`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`)이 아니라 bind 모드 값(`auto`, `loopback`, `lan`, `tailnet`, `custom`)을 사용하세요.
- **Docker 참고**: 기본 `loopback` bind는 컨테이너 내부에서 `127.0.0.1`에 바인딩됩니다. Docker 브리지 네트워킹(`-p 18789:18789`)에서는 트래픽이 `eth0`로 들어오므로 gateway에 도달할 수 없습니다. `--network host`를 사용하거나, 모든 인터페이스에서 수신하려면 `bind: "lan"`(또는 `bind: "custom"`과 `customBindHost: "0.0.0.0"`)으로 설정하세요.
- **인증**: 기본적으로 필수입니다. loopback이 아닌 bind에는 gateway 인증이 필요합니다. 실제로는 공유 token/password 또는 `gateway.auth.mode: "trusted-proxy"`를 사용하는 ID 인식 리버스 프록시를 의미합니다. 온보딩 마법사는 기본적으로 token을 생성합니다.
- `gateway.auth.token`과 `gateway.auth.password`가 둘 다 구성된 경우(SecretRef 포함), `gateway.auth.mode`를 `token` 또는 `password`로 명시적으로 설정하세요. 둘 다 구성되어 있고 mode가 설정되지 않으면 시작 및 서비스 설치/복구 흐름이 실패합니다.
- `gateway.auth.mode: "none"`: 명시적 무인증 모드입니다. 신뢰할 수 있는 로컬 loopback 설정에서만 사용하세요. 이는 의도적으로 온보딩 프롬프트에 제공되지 않습니다.
- `gateway.auth.mode: "trusted-proxy"`: ID 인식 리버스 프록시에 인증을 위임하고 `gateway.trustedProxies`의 ID 헤더를 신뢰합니다([Trusted Proxy 인증](/ko/gateway/trusted-proxy-auth) 참조). 이 모드는 **loopback이 아닌** 프록시 소스를 기대합니다. 같은 호스트의 loopback 리버스 프록시는 trusted-proxy 인증을 만족하지 않습니다.
- `gateway.auth.allowTailscale`: `true`이면 Tailscale Serve ID 헤더가 Control UI/WebSocket 인증을 만족시킬 수 있습니다(`tailscale whois`로 검증). HTTP API 엔드포인트는 이 Tailscale 헤더 인증을 사용하지 않으며, 대신 gateway의 일반 HTTP 인증 모드를 따릅니다. 이 tokenless 흐름은 gateway 호스트가 신뢰된다고 가정합니다. `tailscale.mode = "serve"`일 때 기본값은 `true`입니다.
- `gateway.auth.rateLimit`: 선택적 인증 실패 제한기입니다. 클라이언트 IP별, 인증 범위별로 적용됩니다(공유 secret와 device token은 독립적으로 추적됨). 차단된 시도는 `429` + `Retry-After`를 반환합니다.
  - 비동기 Tailscale Serve Control UI 경로에서는 같은 `{scope, clientIp}`에 대한 실패 시도가 실패 기록 전에 직렬화됩니다. 따라서 동일 클라이언트의 동시 잘못된 시도는 둘 다 단순 불일치로 지나가는 대신 두 번째 요청에서 제한기에 걸릴 수 있습니다.
  - `gateway.auth.rateLimit.exemptLoopback`의 기본값은 `true`입니다. 테스트 설정이나 엄격한 프록시 배포처럼 localhost 트래픽에도 rate limit을 적용하려면 `false`로 설정하세요.
- 브라우저 원본 WS 인증 시도는 항상 loopback 예외 비활성화 상태로 제한됩니다(브라우저 기반 localhost brute force에 대한 방어 심층화).
- loopback에서는 이러한 브라우저 원본 lockout이 정규화된 `Origin` 값별로 격리되므로, 한 localhost origin에서의 반복 실패가 자동으로 다른 origin을 잠그지는 않습니다.
- `tailscale.mode`: `serve`(tailnet 전용, loopback bind) 또는 `funnel`(공개, 인증 필요).
- `controlUi.allowedOrigins`: Gateway WebSocket 연결용 명시적 브라우저 origin allowlist입니다. non-loopback origin에서 브라우저 클라이언트를 예상하는 경우 필수입니다.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host-header origin 정책에 의도적으로 의존하는 배포를 위한 위험한 모드로, Host-header origin fallback을 활성화합니다.
- `remote.transport`: `ssh`(기본값) 또는 `direct`(ws/wss). `direct`의 경우 `remote.url`은 `ws://` 또는 `wss://`여야 합니다.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 신뢰된 private-network IP에 대한 평문 `ws://`를 허용하는 클라이언트 측 비상 재정의입니다. 기본값은 여전히 loopback 전용 평문 허용입니다.
- `gateway.remote.token` / `.password`는 원격 클라이언트 자격 증명 필드입니다. 이것만으로 gateway 인증을 구성하지는 않습니다.
- `gateway.push.apns.relay.baseUrl`: 공식/TestFlight iOS 빌드가 relay 기반 등록을 gateway에 게시한 후 사용하는 외부 APNs relay의 base HTTPS URL입니다. 이 URL은 iOS 빌드에 컴파일된 relay URL과 일치해야 합니다.
- `gateway.push.apns.relay.timeoutMs`: gateway에서 relay로 전송할 때의 타임아웃(밀리초)입니다. 기본값은 `10000`입니다.
- relay 기반 등록은 특정 gateway identity에 위임됩니다. 페어링된 iOS 앱은 `gateway.identity.get`을 가져오고, 해당 identity를 relay 등록에 포함하며, registration 범위의 전송 권한을 gateway에 전달합니다. 다른 gateway는 저장된 이 등록을 재사용할 수 없습니다.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 위 relay config의 임시 환경 변수 재정의입니다.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL용 개발 전용 탈출 장치입니다. 운영 relay URL은 HTTPS를 유지해야 합니다.
- `gateway.channelHealthCheckMinutes`: 채널 상태 모니터 간격(분)입니다. 전역적으로 상태 모니터 재시작을 비활성화하려면 `0`으로 설정하세요. 기본값: `5`.
- `gateway.channelStaleEventThresholdMinutes`: 오래된 소켓 임계값(분)입니다. `gateway.channelHealthCheckMinutes`보다 크거나 같게 유지하세요. 기본값: `30`.
- `gateway.channelMaxRestartsPerHour`: 채널/계정별 1시간 롤링 창에서 허용되는 상태 모니터 재시작 최대 횟수입니다. 기본값: `10`.
- `channels.<provider>.healthMonitor.enabled`: 전역 모니터를 유지한 채 채널별로 상태 모니터 재시작을 opt-out합니다.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 다중 계정 채널의 계정별 재정의입니다. 설정되면 채널 수준 재정의보다 우선합니다.
- 로컬 gateway 호출 경로는 `gateway.auth.*`가 설정되지 않은 경우에만 `gateway.remote.*`를 fallback으로 사용할 수 있습니다.
- `gateway.auth.token` / `gateway.auth.password`가 SecretRef를 통해 명시적으로 구성되었는데 해결되지 않으면, 해결은 fail-closed로 처리됩니다(원격 fallback으로 가려지지 않음).
- `trustedProxies`: TLS를 종료하거나 전달된 클라이언트 헤더를 주입하는 리버스 프록시 IP입니다. 사용자가 제어하는 프록시만 나열하세요. loopback 항목도 같은 호스트 프록시/로컬 감지 설정(예: Tailscale Serve 또는 로컬 리버스 프록시)에는 여전히 유효하지만, loopback 요청이 `gateway.auth.mode: "trusted-proxy"` 대상이 되도록 만들지는 않습니다.
- `allowRealIpFallback`: `true`이면 `X-Forwarded-For`가 없을 때 gateway가 `X-Real-IP`를 받아들입니다. 기본값은 fail-closed 동작을 위한 `false`입니다.
- `gateway.tools.deny`: HTTP `POST /tools/invoke`에 대해 차단할 추가 도구 이름입니다(기본 deny 목록 확장).
- `gateway.tools.allow`: 기본 HTTP deny 목록에서 도구 이름을 제거합니다.

</Accordion>

### OpenAI 호환 엔드포인트

- Chat Completions: 기본적으로 비활성화. `gateway.http.endpoints.chatCompletions.enabled: true`로 활성화합니다.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL 입력 강화:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    빈 allowlist는 미설정으로 처리됩니다. URL 가져오기를 비활성화하려면 `gateway.http.endpoints.responses.files.allowUrl=false`
    및/또는 `gateway.http.endpoints.responses.images.allowUrl=false`를 사용하세요.
- 선택적 응답 강화 헤더:
  - `gateway.http.securityHeaders.strictTransportSecurity`(사용자가 제어하는 HTTPS origin에 대해서만 설정, [Trusted Proxy 인증](/ko/gateway/trusted-proxy-auth#tls-termination-and-hsts) 참조)

### 다중 인스턴스 격리

고유한 포트와 상태 디렉터리로 한 호스트에서 여러 gateway를 실행합니다:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

편의 플래그: `--dev`(`~/.openclaw-dev` + 포트 `19001` 사용), `--profile <name>`(`~/.openclaw-<name>` 사용).

[여러 Gateway](/ko/gateway/multiple-gateways)를 참조하세요.

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: gateway 리스너에서 TLS 종료(HTTPS/WSS)를 활성화합니다(기본값: `false`).
- `autoGenerate`: 명시적 파일이 구성되지 않았을 때 로컬 자체 서명 cert/key 쌍을 자동 생성합니다. 로컬/개발용 전용입니다.
- `certPath`: TLS 인증서 파일의 파일시스템 경로입니다.
- `keyPath`: TLS 비공개 키 파일의 파일시스템 경로입니다. 권한을 제한해 두세요.
- `caPath`: 클라이언트 검증 또는 사용자 지정 신뢰 체인용 선택적 CA 번들 경로입니다.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: 런타임에 config 편집을 적용하는 방식을 제어합니다.
  - `"off"`: live 편집을 무시합니다. 변경에는 명시적 재시작이 필요합니다.
  - `"restart"`: config 변경 시 항상 gateway 프로세스를 재시작합니다.
  - `"hot"`: 재시작 없이 프로세스 내에서 변경을 적용합니다.
  - `"hybrid"`(기본값): 먼저 hot reload를 시도하고, 필요하면 재시작으로 fallback합니다.
- `debounceMs`: config 변경 적용 전의 디바운스 창(밀리초, 음수가 아닌 정수)입니다.
- `deferralTimeoutMs`: 진행 중 작업을 기다리다가 재시작을 강제하기 전까지의 최대 시간(밀리초, 기본값: `300000` = 5분)입니다.

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

인증: `Authorization: Bearer <token>` 또는 `x-openclaw-token: <token>`.
쿼리 문자열 hook 토큰은 거부됩니다.

검증 및 안전성 참고:

- `hooks.enabled=true`에는 비어 있지 않은 `hooks.token`이 필요합니다.
- `hooks.token`은 `gateway.auth.token`과 **달라야** 합니다. Gateway 토큰 재사용은 거부됩니다.
- `hooks.path`는 `/`가 될 수 없습니다. `/hooks` 같은 전용 하위 경로를 사용하세요.
- `hooks.allowRequestSessionKey=true`인 경우 `hooks.allowedSessionKeyPrefixes`를 제한하세요(예: `["hook:"]`).
- 매핑이나 프리셋이 템플릿 기반 `sessionKey`를 사용하는 경우 `hooks.allowedSessionKeyPrefixes`와 `hooks.allowRequestSessionKey=true`를 설정하세요. 정적 매핑 키에는 이 opt-in이 필요하지 않습니다.

**엔드포인트:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 요청 페이로드의 `sessionKey`는 `hooks.allowRequestSessionKey=true`일 때만 허용됩니다(기본값: `false`).
- `POST /hooks/<name>` → `hooks.mappings`를 통해 해석됨
  - 템플릿 렌더링된 매핑 `sessionKey` 값도 외부에서 제공된 것으로 취급되며 `hooks.allowRequestSessionKey=true`가 필요합니다.

<Accordion title="매핑 세부 정보">

- `match.path`는 `/hooks` 이후의 하위 경로와 매칭합니다(예: `/hooks/gmail` → `gmail`).
- `match.source`는 일반 경로용 페이로드 필드와 매칭합니다.
- `{{messages[0].subject}}` 같은 템플릿은 페이로드에서 값을 읽습니다.
- `transform`은 hook 작업을 반환하는 JS/TS 모듈을 가리킬 수 있습니다.
  - `transform.module`은 상대 경로여야 하며 `hooks.transformsDir` 내부에만 머물러야 합니다(절대 경로와 상위 경로 탐색은 거부됨).
- `agentId`는 특정 에이전트로 라우팅합니다. 알 수 없는 ID는 기본값으로 fallback합니다.
- `allowedAgentIds`: 명시적 라우팅을 제한합니다(`*` 또는 생략 = 모두 허용, `[]` = 모두 거부).
- `defaultSessionKey`: 명시적 `sessionKey`가 없는 hook 에이전트 실행용 선택적 고정 세션 키입니다.
- `allowRequestSessionKey`: `/hooks/agent` 호출자와 템플릿 기반 매핑 세션 키가 `sessionKey`를 설정할 수 있게 합니다(기본값: `false`).
- `allowedSessionKeyPrefixes`: 명시적 `sessionKey` 값(요청 + 매핑)에 대한 선택적 접두사 allowlist입니다(예: `["hook:"]`). 어떤 매핑이나 프리셋이라도 템플릿 기반 `sessionKey`를 사용할 경우 필수가 됩니다.
- `deliver: true`는 최종 응답을 채널로 전송하며, `channel`의 기본값은 `last`입니다.
- `model`은 이 hook 실행의 LLM을 재정의합니다(모델 카탈로그가 설정된 경우 허용된 모델이어야 함).

</Accordion>

### Gmail 통합

- 내장 Gmail 프리셋은 `sessionKey: "hook:gmail:{{messages[0].id}}"`를 사용합니다.
- 이 메시지별 라우팅을 유지하려면 `hooks.allowRequestSessionKey: true`를 설정하고 `hooks.allowedSessionKeyPrefixes`를 Gmail 네임스페이스에 맞게 제한하세요. 예: `["hook:", "hook:gmail:"]`.
- `hooks.allowRequestSessionKey: false`가 필요하다면, 템플릿 기본값 대신 정적 `sessionKey`로 프리셋을 재정의하세요.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- 구성되어 있으면 Gateway는 부팅 시 `gog gmail watch serve`를 자동 시작합니다. 비활성화하려면 `OPENCLAW_SKIP_GMAIL_WATCHER=1`을 설정하세요.
- Gateway와 함께 별도의 `gog gmail watch serve`를 실행하지 마세요.

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // 또는 OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Gateway 포트 아래의 HTTP를 통해 에이전트가 편집 가능한 HTML/CSS/JS와 A2UI를 제공합니다:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 로컬 전용: `gateway.bind: "loopback"`(기본값)을 유지하세요.
- loopback이 아닌 bind: canvas 경로는 다른 Gateway HTTP 표면과 마찬가지로 Gateway 인증(token/password/trusted-proxy)이 필요합니다.
- Node WebView는 보통 인증 헤더를 보내지 않습니다. node가 페어링되어 연결되면 Gateway는 canvas/A2UI 접근용 node 범위 capability URL을 알립니다.
- Capability URL은 활성 node WS 세션에 바인딩되며 빠르게 만료됩니다. IP 기반 fallback은 사용되지 않습니다.
- 제공되는 HTML에 live-reload 클라이언트를 주입합니다.
- 비어 있으면 시작용 `index.html`을 자동 생성합니다.
- A2UI도 `/__openclaw__/a2ui/`에서 제공합니다.
- 변경 사항에는 gateway 재시작이 필요합니다.
- 큰 디렉터리나 `EMFILE` 오류가 발생하면 live reload를 비활성화하세요.

---

## Discovery

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal`(기본값): TXT 레코드에서 `cliPath` + `sshPort`를 생략합니다.
- `full`: `cliPath` + `sshPort`를 포함합니다.
- 호스트 이름 기본값은 `openclaw`입니다. `OPENCLAW_MDNS_HOSTNAME`으로 재정의하세요.

### 광역(Wide-area, DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 아래에 유니캐스트 DNS-SD 영역을 씁니다. 네트워크 간 검색에는 DNS 서버(CoreDNS 권장) + Tailscale 분할 DNS와 함께 사용하세요.

설정: `openclaw dns setup --apply`.

---

## 환경

### `env`(인라인 환경 변수)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- 인라인 환경 변수는 프로세스 환경에 해당 키가 없을 때만 적용됩니다.
- `.env` 파일: 현재 작업 디렉터리의 `.env` + `~/.openclaw/.env`(둘 다 기존 변수를 덮어쓰지 않음).
- `shellEnv`: 로그인 셸 프로필에서 누락된 예상 키를 가져옵니다.
- 전체 우선순위는 [환경](/ko/help/environment)을 참조하세요.

### 환경 변수 치환

어떤 config 문자열에서든 `${VAR_NAME}`으로 환경 변수를 참조할 수 있습니다:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 대문자 이름만 매칭됩니다: `[A-Z_][A-Z0-9_]*`.
- 누락되거나 빈 변수는 config 로드 시 오류를 발생시킵니다.
- 리터럴 `${VAR}`가 필요하면 `$${VAR}`로 이스케이프하세요.
- `$include`와 함께 동작합니다.

---

## Secrets

Secret ref는 추가형입니다. 일반 텍스트 값도 계속 동작합니다.

### `SecretRef`

하나의 객체 형태를 사용하세요:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

검증:

- `provider` 패턴: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id 패턴: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: 절대 JSON 포인터(예: `"/providers/openai/apiKey"`)
- `source: "exec"` id 패턴: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` id에는 슬래시로 구분된 `.` 또는 `..` 경로 세그먼트가 포함되면 안 됩니다(예: `a/../b`는 거부됨)

### 지원되는 자격 증명 표면

- 정식 매트릭스: [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)
- `secrets apply`는 지원되는 `openclaw.json` 자격 증명 경로를 대상으로 합니다.
- `auth-profiles.json` ref는 런타임 확인 및 감사 범위에도 포함됩니다.

### Secret provider config

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // 선택적 명시적 env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

참고:

- `file` provider는 `mode: "json"`과 `mode: "singleValue"`를 지원합니다(`singleValue` 모드에서는 `id`가 `"value"`여야 함).
- `exec` provider는 절대 `command` 경로가 필요하며 stdin/stdout의 프로토콜 페이로드를 사용합니다.
- 기본적으로 심볼릭 링크 command 경로는 거부됩니다. 해결된 대상 경로를 검증하면서 심볼릭 링크 경로를 허용하려면 `allowSymlinkCommand: true`를 설정하세요.
- `trustedDirs`가 구성된 경우, 신뢰된 디렉터리 검사는 해결된 대상 경로에 적용됩니다.
- `exec` 자식 환경은 기본적으로 최소 구성입니다. 필요한 변수는 `passEnv`로 명시적으로 전달하세요.
- Secret ref는 활성화 시점에 메모리 내 스냅샷으로 해결되며, 이후 요청 경로는 이 스냅샷만 읽습니다.
- 활성 표면 필터링은 활성화 중에 적용됩니다: 활성 표면의 해결되지 않은 ref는 시작/리로드를 실패시키고, 비활성 표면은 진단과 함께 건너뜁니다.

---

## 인증 저장소

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- 에이전트별 프로필은 `<agentDir>/auth-profiles.json`에 저장됩니다.
- `auth-profiles.json`은 정적 자격 증명 모드용 값 수준 ref(`api_key`용 `keyRef`, `token`용 `tokenRef`)를 지원합니다.
- OAuth 모드 프로필(`auth.profiles.<id>.mode = "oauth"`)은 SecretRef 기반 auth-profile 자격 증명을 지원하지 않습니다.
- 정적 런타임 자격 증명은 메모리 내 해결된 스냅샷에서 오며, 레거시 정적 `auth.json` 항목은 발견 시 정리됩니다.
- 레거시 OAuth 가져오기는 `~/.openclaw/credentials/oauth.json`에서 수행됩니다.
- [OAuth](/ko/concepts/oauth)를 참조하세요.
- Secrets 런타임 동작 및 `audit/configure/apply` 도구: [Secrets Management](/ko/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: 실제 청구/잔액 부족 오류로 프로필이 실패했을 때의 기본 백오프 시간(시간 단위, 기본값: `5`). 명시적인 청구 관련 텍스트는 `401`/`403` 응답에서도 여기에 해당할 수 있지만, provider별 텍스트 매처는 해당 provider 범위 안에서만 적용됩니다(예: OpenRouter `Key limit exceeded`). 재시도 가능한 HTTP `402` 사용량 창 또는 조직/워크스페이스 지출 한도 메시지는 대신 `rate_limit` 경로에 남습니다.
- `billingBackoffHoursByProvider`: 청구 백오프 시간에 대한 선택적 provider별 재정의입니다.
- `billingMaxHours`: 청구 백오프 지수 증가의 최대 한도(시간 단위, 기본값: `24`).
- `authPermanentBackoffMinutes`: 신뢰도 높은 `auth_permanent` 실패에 대한 기본 백오프 시간(분 단위, 기본값: `10`).
- `authPermanentMaxMinutes`: `auth_permanent` 백오프 증가의 최대 한도(분 단위, 기본값: `60`).
- `failureWindowHours`: 백오프 카운터에 사용되는 롤링 창(시간 단위, 기본값: `24`).
- `overloadedProfileRotations`: 모델 fallback으로 전환하기 전 overloaded 오류에 대해 같은 provider auth-profile을 회전할 수 있는 최대 횟수입니다(기본값: `1`). `ModelNotReadyException` 같은 provider-busy 형태가 여기에 해당합니다.
- `overloadedBackoffMs`: overloaded provider/profile 회전을 재시도하기 전의 고정 지연 시간(기본값: `0`).
- `rateLimitedProfileRotations`: 모델 fallback으로 전환하기 전 rate-limit 오류에 대해 같은 provider auth-profile을 회전할 수 있는 최대 횟수입니다(기본값: `1`). 이 rate-limit 버킷에는 `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `resource exhausted` 같은 provider 형태의 텍스트가 포함됩니다.

---

## 로깅

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- 기본 로그 파일: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- 안정적인 경로를 원하면 `logging.file`을 설정하세요.
- `consoleLevel`은 `--verbose`일 때 `debug`로 올라갑니다.
- `maxFileBytes`: 쓰기 억제 전 최대 로그 파일 크기(바이트 단위, 양의 정수, 기본값: `524288000` = 500 MB). 운영 배포에서는 외부 로그 회전을 사용하세요.

---

## 진단

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: 계측 출력의 마스터 토글입니다(기본값: `true`).
- `flags`: 대상 로그 출력을 활성화하는 플래그 문자열 배열입니다(`"telegram.*"` 또는 `"*"` 같은 와일드카드 지원).
- `stuckSessionWarnMs`: 세션이 처리 상태로 남아 있는 동안 stuck-session 경고를 출력하는 기준 시간(밀리초)입니다.
- `otel.enabled`: OpenTelemetry 내보내기 파이프라인을 활성화합니다(기본값: `false`).
- `otel.endpoint`: OTel 내보내기용 collector URL입니다.
- `otel.protocol`: `"http/protobuf"`(기본값) 또는 `"grpc"`.
- `otel.headers`: OTel 내보내기 요청과 함께 전송되는 추가 HTTP/gRPC 메타데이터 헤더입니다.
- `otel.serviceName`: 리소스 속성용 서비스 이름입니다.
- `otel.traces` / `otel.metrics` / `otel.logs`: trace, metrics, log 내보내기를 활성화합니다.
- `otel.sampleRate`: trace 샘플링 비율 `0`–`1`.
- `otel.flushIntervalMs`: 주기적 텔레메트리 플러시 간격(밀리초)입니다.
- `cacheTrace.enabled`: 내장 실행용 캐시 trace 스냅샷을 기록합니다(기본값: `false`).
- `cacheTrace.filePath`: 캐시 trace JSONL 출력 경로입니다(기본값: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: 캐시 trace 출력에 무엇을 포함할지 제어합니다(모두 기본값: `true`).

---

## 업데이트

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: npm/git 설치용 릴리스 채널 — `"stable"`, `"beta"`, 또는 `"dev"`.
- `checkOnStart`: gateway 시작 시 npm 업데이트를 확인합니다(기본값: `true`).
- `auto.enabled`: 패키지 설치용 백그라운드 자동 업데이트를 활성화합니다(기본값: `false`).
- `auto.stableDelayHours`: 안정 채널 자동 적용 전 최소 지연 시간(시간 단위, 기본값: `6`, 최대: `168`).
- `auto.stableJitterHours`: 안정 채널 롤아웃 분산 창의 추가 시간(시간 단위, 기본값: `12`, 최대: `168`).
- `auto.betaCheckIntervalHours`: 베타 채널 확인 주기(시간 단위, 기본값: `1`, 최대: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: 전역 ACP 기능 게이트입니다(기본값: `false`).
- `dispatch.enabled`: ACP 세션 턴 디스패치의 독립 게이트입니다(기본값: `true`). ACP 명령은 유지하면서 실행만 차단하려면 `false`로 설정하세요.
- `backend`: 기본 ACP 런타임 backend id입니다(등록된 ACP 런타임 plugin과 일치해야 함).
- `defaultAgent`: spawn에서 명시적 대상을 지정하지 않았을 때의 fallback ACP 대상 에이전트 id입니다.
- `allowedAgents`: ACP 런타임 세션에 허용되는 에이전트 id의 allowlist입니다. 비어 있으면 추가 제한이 없습니다.
- `maxConcurrentSessions`: 동시에 활성화될 수 있는 ACP 세션의 최대 수입니다.
- `stream.coalesceIdleMs`: 스트리밍 텍스트의 idle flush 창(밀리초)입니다.
- `stream.maxChunkChars`: 스트리밍 블록 투영을 분할하기 전 최대 청크 크기입니다.
- `stream.repeatSuppression`: 턴별로 반복되는 상태/도구 줄을 억제합니다(기본값: `true`).
- `stream.deliveryMode`: `"live"`는 점진적으로 스트리밍하고, `"final_only"`는 턴 종료 이벤트까지 버퍼링합니다.
- `stream.hiddenBoundarySeparator`: 숨겨진 도구 이벤트 뒤에 보이는 텍스트 앞에 넣는 구분자입니다(기본값: `"paragraph"`).
- `stream.maxOutputChars`: ACP 턴당 투영되는 최대 assistant 출력 문자 수입니다.
- `stream.maxSessionUpdateChars`: 투영되는 ACP 상태/업데이트 줄의 최대 문자 수입니다.
- `stream.tagVisibility`: 스트리밍 이벤트에 대한 태그 이름별 불리언 가시성 재정의 기록입니다.
- `runtime.ttlMinutes`: 정리 대상이 되기 전 ACP 세션 워커의 유휴 TTL(분)입니다.
- `runtime.installCommand`: ACP 런타임 환경 부트스트랩 시 실행할 선택적 설치 명령입니다.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode`는 배너 태그라인 스타일을 제어합니다:
  - `"random"`(기본값): 순환하는 재미있는/계절성 태그라인.
  - `"default"`: 고정된 중립 태그라인(`All your chats, one OpenClaw.`).
  - `"off"`: 태그라인 텍스트 없음(배너 제목/버전은 계속 표시됨).
- 태그라인뿐 아니라 전체 배너를 숨기려면 환경 변수 `OPENCLAW_HIDE_BANNER=1`을 설정하세요.

---

## Wizard

CLI 안내 설정 흐름(`onboard`, `configure`, `doctor`)에서 기록하는 메타데이터:

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identity

[에이전트 기본값](#agent-defaults)의 `agents.list` identity 필드를 참조하세요.

---

## Bridge (레거시, 제거됨)

현재 빌드에는 더 이상 TCP bridge가 포함되지 않습니다. node는 Gateway WebSocket을 통해 연결됩니다. `bridge.*` 키는 더 이상 config 스키마의 일부가 아니며(제거 전까지 검증 실패, `openclaw doctor --fix`로 알 수 없는 키 제거 가능).

<Accordion title="레거시 bridge config(역사적 참고)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // 아웃바운드 Webhook 인증용 선택적 bearer 토큰
    sessionRetention: "24h", // 기간 문자열 또는 false
    runLog: {
      maxBytes: "2mb", // 기본값 2_000_000 bytes
      keepLines: 2000, // 기본값 2000
    },
  },
}
```

- `sessionRetention`: 완료된 격리 cron 실행 세션을 `sessions.json`에서 제거하기 전까지 유지하는 기간입니다. 삭제된 cron transcript 아카이브 정리도 함께 제어합니다. 기본값: `24h`; 비활성화하려면 `false`로 설정하세요.
- `runLog.maxBytes`: 정리 전 각 실행 로그 파일(`cron/runs/<jobId>.jsonl`)의 최대 크기입니다. 기본값: `2_000_000` bytes.
- `runLog.keepLines`: 실행 로그 정리가 트리거될 때 유지되는 최신 줄 수입니다. 기본값: `2000`.
- `webhookToken`: cron Webhook POST 전달(`delivery.mode = "webhook"`)에 사용되는 bearer 토큰입니다. 생략하면 인증 헤더가 전송되지 않습니다.
- `webhook`: 저장된 `notify: true` 작업에만 사용되는 deprecated 레거시 fallback Webhook URL(http/https)입니다.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: 일시적 오류 시 일회성 작업에 대한 최대 재시도 횟수입니다(기본값: `3`, 범위: `0`–`10`).
- `backoffMs`: 각 재시도 시도에 대한 백오프 지연 시간 배열(밀리초, 기본값: `[30000, 60000, 300000]`, 1–10개 항목).
- `retryOn`: 재시도를 유발하는 오류 유형 — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. 생략하면 모든 일시적 유형에 대해 재시도합니다.

일회성 cron 작업에만 적용됩니다. 반복 작업은 별도의 실패 처리 방식을 사용합니다.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: cron 작업의 실패 알림을 활성화합니다(기본값: `false`).
- `after`: 알림이 발생하기 전 연속 실패 횟수입니다(양의 정수, 최소: `1`).
- `cooldownMs`: 같은 작업에 대해 반복 알림 사이의 최소 시간(밀리초, 음수가 아닌 정수)입니다.
- `mode`: 전달 모드 — `"announce"`는 채널 메시지로 전송하고, `"webhook"`은 구성된 webhook으로 POST합니다.
- `accountId`: 알림 전달 범위를 제한하는 선택적 계정 또는 채널 id입니다.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- 모든 작업에 대한 cron 실패 알림의 기본 대상입니다.
- `mode`: `"announce"` 또는 `"webhook"`이며, 충분한 대상 정보가 있으면 기본값은 `"announce"`입니다.
- `channel`: announce 전달용 채널 재정의입니다. `"last"`는 마지막으로 알려진 전달 채널을 재사용합니다.
- `to`: 명시적 announce 대상 또는 webhook URL입니다. webhook 모드에서는 필수입니다.
- `accountId`: 전달용 선택적 계정 재정의입니다.
- 작업별 `delivery.failureDestination`이 이 전역 기본값을 재정의합니다.
- 전역 또는 작업별 실패 대상이 모두 설정되지 않은 경우, 이미 `announce`로 전달하는 작업은 실패 시 해당 기본 announce 대상으로 fallback합니다.
- `delivery.failureDestination`은 작업의 기본 `delivery.mode`가 `"webhook"`인 경우를 제외하면 `sessionTarget="isolated"` 작업에서만 지원됩니다.

[cron 작업](/ko/automation/cron-jobs)을 참조하세요. 격리된 cron 실행은 [백그라운드 작업](/ko/automation/tasks)으로 추적됩니다.

---

## 미디어 모델 템플릿 변수

`tools.media.models[].args`에서 확장되는 템플릿 플레이스홀더:

| 변수               | 설명                                        |
| ------------------ | ------------------------------------------- |
| `{{Body}}`         | 전체 인바운드 메시지 본문                   |
| `{{RawBody}}`      | 원시 본문(기록/발신자 래퍼 없음)            |
| `{{BodyStripped}}` | 그룹 멘션이 제거된 본문                     |
| `{{From}}`         | 발신자 식별자                               |
| `{{To}}`           | 대상 식별자                                 |
| `{{MessageSid}}`   | 채널 메시지 id                              |
| `{{SessionId}}`    | 현재 세션 UUID                              |
| `{{IsNewSession}}` | 새 세션이 생성되면 `"true"`                 |
| `{{MediaUrl}}`     | 인바운드 미디어 pseudo-URL                  |
| `{{MediaPath}}`    | 로컬 미디어 경로                            |
| `{{MediaType}}`    | 미디어 유형(image/audio/document/…)         |
| `{{Transcript}}`   | 오디오 transcript                           |
| `{{Prompt}}`       | CLI 항목용 해결된 미디어 프롬프트           |
| `{{MaxChars}}`     | CLI 항목용 해결된 최대 출력 문자 수         |
| `{{ChatType}}`     | `"direct"` 또는 `"group"`                   |
| `{{GroupSubject}}` | 그룹 제목(가능한 범위 내 최선의 노력)       |
| `{{GroupMembers}}` | 그룹 구성원 미리보기(가능한 범위 내 최선의 노력) |
| `{{SenderName}}`   | 발신자 표시 이름(가능한 범위 내 최선의 노력) |
| `{{SenderE164}}`   | 발신자 전화번호(가능한 범위 내 최선의 노력) |
| `{{Provider}}`     | provider 힌트(whatsapp, telegram, discord 등) |

---

## Config includes (`$include`)

config를 여러 파일로 분리합니다:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**병합 동작:**

- 단일 파일: 포함하는 객체를 대체합니다.
- 파일 배열: 순서대로 깊은 병합이 이루어집니다(뒤의 항목이 앞의 항목을 재정의).
- 형제 키: include 뒤에 병합됩니다(포함된 값을 재정의).
- 중첩 include: 최대 10단계 깊이까지 허용됩니다.
- 경로: 포함하는 파일을 기준으로 상대 경로로 해석되지만, 최상위 config 디렉터리(`openclaw.json`의 `dirname`) 안에 머물러야 합니다. 절대 경로/`../` 형식도 최종적으로 그 경계 안으로 해석되는 경우에만 허용됩니다.
- 하나의 최상위 섹션만 변경하는 OpenClaw 소유 쓰기 중, 해당 섹션이 단일 파일 include로 연결되어 있으면 그 포함 파일에 직접 기록됩니다. 예를 들어 `plugins install`은 `plugins: { $include: "./plugins.json5" }`의 경우 `plugins.json5`를 업데이트하고 `openclaw.json`은 그대로 둡니다.
- 루트 include, include 배열, 형제 재정의가 있는 include는 OpenClaw 소유 쓰기에 대해 읽기 전용입니다. 이러한 쓰기는 config를 평탄화하지 않고 fail-closed로 처리됩니다.
- 오류: 누락된 파일, 파싱 오류, 순환 include에 대해 명확한 메시지를 제공합니다.

---

_관련 항목: [구성](/ko/gateway/configuration) · [구성 예제](/ko/gateway/configuration-examples) · [Doctor](/ko/gateway/doctor)_
