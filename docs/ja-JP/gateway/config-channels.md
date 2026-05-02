---
read_when:
    - チャネル Plugin の設定（認証、アクセス制御、マルチアカウント）
    - チャネルごとの設定キーのトラブルシューティング
    - ダイレクトメッセージのポリシー、グループポリシー、またはメンションゲーティングの監査
summary: 'チャンネル設定: Slack、Discord、Telegram、WhatsApp、Matrix、iMessage などにわたるアクセス制御、ペアリング、チャンネルごとのキー'
title: 設定 — チャンネル
x-i18n:
    generated_at: "2026-05-02T22:18:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5231efba32fab480313c05dfd5dcec12e32020a79001c4a72df4c3844966e65e
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` 配下のチャンネル別設定キー。DM とグループアクセス、
マルチアカウント構成、メンションゲート、Slack、Discord、
Telegram、WhatsApp、Matrix、iMessage、およびその他の同梱チャンネルPlugin向けのチャンネル別キーを扱います。

エージェント、ツール、Gateway ランタイム、その他のトップレベルキーについては、
[設定リファレンス](/ja-JP/gateway/configuration-reference) を参照してください。

## チャンネル

各チャンネルは、その設定セクションが存在すると自動的に起動します（`enabled: false` の場合を除く）。

### DM とグループアクセス

すべてのチャンネルは DM ポリシーとグループポリシーをサポートします。

| DM ポリシー          | 動作                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (default) | 不明な送信者は一度限りのペアリングコードを受け取り、所有者の承認が必要 |
| `allowlist`         | `allowFrom` 内（またはペアリング済み許可ストア内）の送信者のみ |
| `open`              | すべての受信 DM を許可（`allowFrom: ["*"]` が必要）             |
| `disabled`          | すべての受信 DM を無視                                          |

| グループポリシー      | 動作                                                   |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (default) | 設定された許可リストに一致するグループのみ            |
| `open`                | グループ許可リストをバイパス（メンションゲートは引き続き適用） |
| `disabled`            | すべてのグループ/ルームメッセージをブロック           |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が未設定の場合のデフォルトを設定します。
ペアリングコードは 1 時間後に期限切れになります。保留中の DM ペアリングリクエストは **チャンネルごとに 3 件** に制限されます。
プロバイダーブロック全体が存在しない場合（`channels.<provider>` がない場合）、ランタイムのグループポリシーは起動時警告付きで `allowlist`（フェイルクローズ）にフォールバックします。
</Note>

### チャンネルモデルの上書き

特定のチャンネル ID をモデルに固定するには `channels.modelByChannel` を使用します。値には `provider/model` または設定済みのモデルエイリアスを指定できます。チャンネルマッピングは、セッションにモデル上書きがまだない場合（たとえば `/model` で設定された場合など）に適用されます。

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

### チャンネルデフォルトと Heartbeat

プロバイダー間で共有するグループポリシーと Heartbeat の動作には `channels.defaults` を使用します。

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

- `channels.defaults.groupPolicy`: プロバイダーレベルの `groupPolicy` が未設定の場合のフォールバックグループポリシー。
- `channels.defaults.contextVisibility`: すべてのチャンネルに対する補足コンテキスト表示モードのデフォルト。値: `all`（デフォルト、引用/スレッド/履歴コンテキストをすべて含める）、`allowlist`（許可リスト内の送信者からのコンテキストのみ含める）、`allowlist_quote`（allowlist と同じだが、明示的な引用/返信コンテキストは保持）。チャンネル別の上書き: `channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`: Heartbeat 出力に正常なチャンネルステータスを含める。
- `channels.defaults.heartbeat.showAlerts`: Heartbeat 出力に劣化/エラーステータスを含める。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケータースタイルの Heartbeat 出力をレンダリングする。

### WhatsApp

WhatsApp は Gateway の Web チャンネル（Baileys Web）経由で動作します。リンク済みセッションが存在すると自動的に起動します。

```json5
{
  web: {
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
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

<Accordion title="マルチアカウント WhatsApp">

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

- 送信コマンドは、存在する場合はアカウント `default` をデフォルトにします。存在しない場合は、最初に設定されたアカウント ID（ソート済み）を使用します。
- 任意の `channels.whatsapp.defaultAccount` は、設定済みアカウント ID と一致する場合、そのフォールバックのデフォルトアカウント選択を上書きします。
- レガシーの単一アカウント Baileys 認証ディレクトリは、`openclaw doctor` によって `whatsapp/default` に移行されます。
- アカウント別の上書き: `channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

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
      streaming: "partial", // off | partial | block | progress (default: off; opt in explicitly to avoid preview-edit rate limits)
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

- Bot トークン: `channels.telegram.botToken` または `channels.telegram.tokenFile`（通常ファイルのみ。シンボリックリンクは拒否）、デフォルトアカウントのフォールバックとして `TELEGRAM_BOT_TOKEN`。
- `apiRoot` は Telegram Bot API のルートのみです。`https://api.telegram.org/bot<TOKEN>` ではなく、`https://api.telegram.org` またはセルフホスト/プロキシのルートを使用してください。`openclaw doctor --fix` は、誤って末尾に付いた `/bot<TOKEN>` サフィックスを削除します。
- 任意の `channels.telegram.defaultAccount` は、設定済みアカウント ID と一致する場合、デフォルトアカウント選択を上書きします。
- マルチアカウント構成（2 つ以上のアカウント ID）では、フォールバックルーティングを避けるために明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定してください。これがない、または無効な場合、`openclaw doctor` が警告します。
- `configWrites: false` は、Telegram から開始された設定書き込み（スーパーグループ ID 移行、`/config set|unset`）をブロックします。
- `type: "acp"` のトップレベル `bindings[]` エントリは、フォーラムトピック向けの永続 ACP バインディングを設定します（`match.peer.id` では正規の `chatId:topic:topicId` を使用）。フィールドセマンティクスは [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings) で共有されています。
- Telegram ストリームプレビューは `sendMessage` + `editMessageText` を使用します（ダイレクトチャットとグループチャットで動作）。
- リトライポリシー: [リトライポリシー](/ja-JP/concepts/retry) を参照してください。

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
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
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

- トークン: `channels.discord.token`。デフォルトアカウントのフォールバックとして `DISCORD_BOT_TOKEN` を使用します。
- 明示的な Discord `token` を指定する直接の送信呼び出しは、その呼び出しにそのトークンを使用します。アカウントの再試行/ポリシー設定は、active runtime snapshot 内の選択済みアカウントから引き続き取得されます。
- 任意の `channels.discord.defaultAccount` は、設定済みのアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- 配信先には `user:<id>` (DM) または `channel:<id>` (guild channel) を使用します。裸の数値 ID は拒否されます。
- Guild slug は小文字で、スペースは `-` に置換されます。チャンネルキーには slug 化された名前を使用します (`#` なし)。guild ID を優先してください。
- bot が作成したメッセージはデフォルトで無視されます。`allowBots: true` で有効化できます。bot にメンションしている bot メッセージだけを受け入れるには `allowBots: "mentions"` を使用します (自身のメッセージは引き続きフィルタされます)。
- `channels.discord.guilds.<id>.ignoreOtherMentions` (およびチャンネル上書き) は、bot ではなく別のユーザーまたはロールにメンションしているメッセージを破棄します (@everyone/@here を除く)。
- `channels.discord.mentionAliases` は、送信前に安定した送信用の `@handle` テキストを Discord ユーザー ID にマップします。これにより、一時的なディレクトリキャッシュが空でも、既知のチームメイトを決定的にメンションできます。アカウント単位の上書きは `channels.discord.accounts.<accountId>.mentionAliases` 配下にあります。
- `maxLinesPerMessage` (デフォルト 17) は、2000 文字未満でも縦に長いメッセージを分割します。
- `channels.discord.threadBindings` は Discord のスレッド紐付けルーティングを制御します:
  - `enabled`: スレッド紐付けセッション機能 (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、および紐付け配信/ルーティング) に対する Discord 上書き
  - `idleHours`: 非アクティブ時の自動 unfocus の時間単位 Discord 上書き (`0` で無効)
  - `maxAgeHours`: 強制最大存続時間の時間単位 Discord 上書き (`0` で無効)
  - `spawnSessions`: `sessions_spawn({ thread: true })` と ACP thread-spawn の自動スレッド作成/紐付けのスイッチ (デフォルト: `true`)
  - `defaultSpawnContext`: スレッド紐付け spawn 用のネイティブ subagent context (デフォルトは `"fork"`)
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、チャンネルとスレッド用の永続 ACP binding を設定します (`match.peer.id` には channel/thread id を使用)。フィールドの意味は [ACP Agents](/ja-JP/tools/acp-agents#persistent-channel-bindings) で共有されています。
- `channels.discord.ui.components.accentColor` は Discord components v2 コンテナのアクセントカラーを設定します。
- `channels.discord.voice` は Discord 音声チャンネル会話と、任意の auto-join + LLM + TTS 上書きを有効にします。テキスト専用の Discord 設定では、デフォルトで音声はオフのままです。オプトインするには `channels.discord.voice.enabled=true` を設定します。
- `channels.discord.voice.model` は、Discord 音声チャンネル応答に使用される LLM model を任意で上書きします。
- `channels.discord.voice.daveEncryption` と `channels.discord.voice.decryptionFailureTolerance` は `@discordjs/voice` DAVE オプションにそのまま渡されます (デフォルトは `true` と `24`)。
- `channels.discord.voice.connectTimeoutMs` は、`/vc join` と auto-join 試行時の初期 `@discordjs/voice` Ready 待機を制御します (デフォルトは `30000`)。
- `channels.discord.voice.reconnectGraceMs` は、切断された音声セッションが再接続シグナリングに入るまで OpenClaw が待つ時間を制御します (デフォルトは `15000`)。
- OpenClaw はさらに、復号失敗が繰り返された後に音声セッションから退出/再参加することで音声受信の復旧も試みます。
- `channels.discord.streaming` は正規のストリームモードキーです。従来の `streamMode` と真偽値の `streaming` 値は自動移行されます。
- `channels.discord.autoPresence` は runtime availability を bot presence にマップし (healthy => online、degraded => idle、exhausted => dnd)、任意のステータステキスト上書きを許可します。
- `channels.discord.dangerouslyAllowNameMatching` は、可変の名前/タグ照合を再度有効にします (break-glass 互換モード)。
- `channels.discord.execApprovals`: Discord ネイティブの exec approval 配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"` (デフォルト)。auto モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec approval が有効化されます。
  - `approvers`: exec request の承認を許可された Discord ユーザー ID。省略時は `commands.ownerAllowFrom` にフォールバックします。
  - `agentFilter`: 任意の agent ID allowlist。省略すると、すべての agent の approval を転送します。
  - `sessionFilter`: 任意の session key pattern (substring または regex)。
  - `target`: approval prompt の送信先。`"dm"` (デフォルト) は承認者の DM に送信し、`"channel"` は発信元チャンネルに送信し、`"both"` は両方に送信します。target に `"channel"` が含まれる場合、ボタンは解決済み承認者だけが使用できます。
  - `cleanupAfterResolve`: `true` の場合、承認、拒否、またはタイムアウト後に approval DM を削除します。

**リアクション通知モード:** `off` (なし)、`own` (bot のメッセージ、デフォルト)、`all` (すべてのメッセージ)、`allowlist` (すべてのメッセージで `guilds.<id>.users` 由来)。

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

- Service account JSON: インライン (`serviceAccount`) またはファイルベース (`serviceAccountFile`)。
- Service account SecretRef もサポートされています (`serviceAccountRef`)。
- env フォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信先には `spaces/<spaceId>` または `users/<userId>` を使用します。
- `channels.googlechat.dangerouslyAllowNameMatching` は、可変のメールプリンシパル照合を再度有効にします (break-glass 互換モード)。

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

- **Socket mode** には `botToken` と `appToken` の両方が必要です (デフォルトアカウントの env フォールバックには `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`)。
- **HTTP mode** には `botToken` と `signingSecret` (root またはアカウント単位) が必要です。
- `socketMode` は Slack SDK Socket Mode transport tuning を public Bolt receiver API にそのまま渡します。ping/pong timeout や古い websocket 動作を調査する場合にのみ使用してください。
- `botToken`、`appToken`、`signingSecret`、`userToken` は、プレーンテキスト
  文字列または SecretRef オブジェクトを受け入れます。
- Slack account snapshot は、`botTokenSource`、`botTokenStatus`、
  `appTokenStatus`、および HTTP mode では `signingSecretStatus` などの
  credential 単位の source/status フィールドを公開します。`configured_unavailable` は、
  アカウントが SecretRef 経由で設定されているものの、現在の command/runtime パスでは
  secret value を解決できなかったことを意味します。
- `configWrites: false` は Slack 起点の config write をブロックします。
- 任意の `channels.slack.defaultAccount` は、設定済みのアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- `channels.slack.streaming.mode` は正規の Slack stream mode key です。`channels.slack.streaming.nativeTransport` は Slack の native streaming transport を制御します。従来の `streamMode`、真偽値の `streaming`、および `nativeStreaming` 値は自動移行されます。
- 配信先には `user:<id>` (DM) または `channel:<id>` を使用します。

**リアクション通知モード:** `off`、`own` (デフォルト)、`all`、`allowlist` (`reactionAllowlist` 由来)。

**スレッドセッション分離:** `thread.historyScope` はスレッド単位 (デフォルト) またはチャンネル全体で共有です。`thread.inheritParent` は親チャンネルの transcript を新しいスレッドにコピーします。

- Slack native streaming と Slack assistant スタイルの「is typing...」スレッドステータスには、返信スレッドターゲットが必要です。トップレベル DM はデフォルトでスレッド外のままなので、スレッドスタイルのプレビューではなく `typingReaction` または通常配信を使用します。
- `typingReaction` は返信の実行中に受信 Slack メッセージへ一時的なリアクションを追加し、完了時に削除します。`"hourglass_flowing_sand"` のような Slack emoji shortcode を使用してください。
- `channels.slack.execApprovals`: Slack ネイティブの exec approval 配信と承認者認可。Discord と同じスキーマです: `enabled` (`true`/`false`/`"auto"`)、`approvers` (Slack user IDs)、`agentFilter`、`sessionFilter`、および `target` (`"dm"`、`"channel"`、または `"both"`)。

| アクショングループ | デフォルト | 注記 |
| ------------ | ------- | ---------------------- |
| reactions    | 有効 | リアクションの追加 + リアクションの一覧表示 |
| messages     | 有効 | 読み取り/送信/編集/削除  |
| pins         | 有効 | ピン留め/ピン解除/一覧表示 |
| memberInfo   | 有効 | メンバー情報            |
| emojiList    | 有効 | カスタム絵文字リスト      |

### Mattermost

Mattermost は現在の OpenClaw リリースでは bundled Plugin として同梱されています。古いビルドや
カスタムビルドでは、現在の npm package を
`openclaw plugins install @openclaw/mattermost` でインストールできます。バージョンを固定する前に
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
で現在の dist-tags を確認してください。

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

Chat mode: `oncall` (@-mention に応答、デフォルト)、`onmessage` (すべてのメッセージ)、`onchar` (trigger prefix で始まるメッセージ)。

Mattermost native command が有効な場合:

- `commands.callbackPath` はフルURLではなく、パス（例: `/api/channels/mattermost/command`）である必要があります。
- `commands.callbackUrl` は OpenClaw Gatewayエンドポイントに解決され、Mattermostサーバーから到達可能である必要があります。
- ネイティブのスラッシュコールバックは、スラッシュコマンド登録時にMattermostから返される
  コマンドごとのトークンで認証されます。登録に失敗した場合、または
  コマンドが有効化されていない場合、OpenClawは
  `Unauthorized: invalid command token.`
  でコールバックを拒否します。
- プライベート/tailnet/内部のコールバックホストでは、Mattermostで
  `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックのホスト/ドメインを含める必要がある場合があります。
  フルURLではなく、ホスト/ドメイン値を使用してください。
- `channels.mattermost.configWrites`: Mattermost起点の設定書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャンネルで返信する前に `@mention` を要求します。
- `channels.mattermost.groups.<channelId>.requireMention`: チャンネルごとのメンションゲート上書き（デフォルトは `"*"`）。
- 省略可能な `channels.mattermost.defaultAccount` は、設定済みアカウントIDと一致する場合にデフォルトのアカウント選択を上書きします。

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

**リアクション通知モード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` から）。

- `channels.signal.account`: チャンネルの起動を特定のSignalアカウントIDに固定します。
- `channels.signal.configWrites`: Signal起点の設定書き込みを許可または拒否します。
- 省略可能な `channels.signal.defaultAccount` は、設定済みアカウントIDと一致する場合にデフォルトのアカウント選択を上書きします。

### BlueBubbles

BlueBubblesは推奨されるiMessage経路です（Pluginベースで、`channels.bluebubbles` の下に設定します）。

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```

- ここで扱うコアキーパス: `channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- 省略可能な `channels.bluebubbles.defaultAccount` は、設定済みアカウントIDと一致する場合にデフォルトのアカウント選択を上書きします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、BlueBubblesの会話を永続ACPセッションにバインドできます。`match.peer.id` にはBlueBubblesのハンドルまたはターゲット文字列（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用してください。共有フィールドの意味: [ACPエージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)。
- BlueBubblesチャンネルの完全な設定は [BlueBubbles](/ja-JP/channels/bluebubbles) に記載されています。

### iMessage

OpenClawは `imsg rpc`（stdio上のJSON-RPC）を起動します。デーモンやポートは不要です。

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

- 省略可能な `channels.imessage.defaultAccount` は、設定済みアカウントIDと一致する場合にデフォルトのアカウント選択を上書きします。

- Messages DBへのフルディスクアクセスが必要です。
- `chat_id:<id>` ターゲットを推奨します。チャットを一覧表示するには `imsg chats --limit 20` を使用します。
- `cliPath` はSSHラッパーを指すことができます。SCPで添付ファイルを取得するには `remoteHost`（`host` または `user@host`）を設定します。
- `attachmentRoots` と `remoteAttachmentRoots` は、受信添付ファイルのパスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCPは厳格なホストキー確認を使用するため、リレーホストのキーがすでに `~/.ssh/known_hosts` に存在することを確認してください。
- `channels.imessage.configWrites`: iMessage起点の設定書き込みを許可または拒否します。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、iMessageの会話を永続ACPセッションにバインドできます。`match.peer.id` には正規化されたハンドルまたは明示的なチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用してください。共有フィールドの意味: [ACPエージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)。

<Accordion title="iMessage SSHラッパーの例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

MatrixはPluginベースで、`channels.matrix` の下に設定します。

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

- トークン認証は `accessToken` を使用し、パスワード認証は `userId` + `password` を使用します。
- `channels.matrix.proxy` は、MatrixのHTTPトラフィックを明示的なHTTP(S)プロキシ経由でルーティングします。名前付きアカウントでは `channels.matrix.accounts.<id>.proxy` で上書きできます。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` はプライベート/内部homeserverを許可します。`proxy` とこのネットワークのオプトインは独立した制御です。
- `channels.matrix.defaultAccount` は、マルチアカウント構成で優先アカウントを選択します。
- `channels.matrix.autoJoin` のデフォルトは `off` のため、`autoJoinAllowlist` 付きの `autoJoin: "allowlist"` または `autoJoin: "always"` を設定するまで、招待されたルームや新しいDM形式の招待は無視されます。
- `channels.matrix.execApprovals`: Matrixネイティブのexec承認配信と承認者認可です。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。自動モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合にexec承認が有効になります。
  - `approvers`: execリクエストの承認を許可されるMatrixユーザーID（例: `@owner:example.org`）。
  - `agentFilter`: 省略可能なエージェントIDの許可リスト。省略すると、すべてのエージェントの承認を転送します。
  - `sessionFilter`: 省略可能なセッションキーパターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）、`"channel"`（発信元ルーム）、または `"both"`。
  - アカウントごとの上書き: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` は、Matrix DMをどのようにセッションにグループ化するかを制御します。`per-user`（デフォルト）はルーティングされたピアごとに共有し、`per-room` は各DMルームを分離します。
- Matrixステータスプローブとライブディレクトリ検索は、実行時トラフィックと同じプロキシポリシーを使用します。
- Matrixの完全な設定、ターゲット指定ルール、セットアップ例は [Matrix](/ja-JP/channels/matrix) に記載されています。

### Microsoft Teams

Microsoft TeamsはPluginベースで、`channels.msteams` の下に設定します。

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

- ここで扱うコアキーパス: `channels.msteams`、`channels.msteams.configWrites`。
- Teamsの完全な設定（認証情報、webhook、DM/グループポリシー、チームごと/チャンネルごとの上書き）は [Microsoft Teams](/ja-JP/channels/msteams) に記載されています。

### IRC

IRCはPluginベースで、`channels.irc` の下に設定します。

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

- ここで扱うコアキーパス: `channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- 省略可能な `channels.irc.defaultAccount` は、設定済みアカウントIDと一致する場合にデフォルトのアカウント選択を上書きします。
- IRCチャンネルの完全な設定（ホスト/ポート/TLS/チャンネル/許可リスト/メンションゲート）は [IRC](/ja-JP/channels/irc) に記載されています。

### マルチアカウント（すべてのチャンネル）

チャンネルごとに複数のアカウントを実行します（各アカウントに独自の `accountId` があります）。

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

- `accountId` が省略された場合は `default` が使用されます（CLI + ルーティング）。
- 環境変数トークンは **デフォルト** アカウントにのみ適用されます。
- ベースチャンネル設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- 各アカウントを別のエージェントにルーティングするには `bindings[].match.accountId` を使用します。
- 単一アカウントのトップレベルチャンネル設定のまま `openclaw channels add`（またはチャンネルオンボーディング）で非デフォルトアカウントを追加すると、OpenClawはまずアカウントスコープのトップレベル単一アカウント値をチャンネルアカウントマップに昇格し、元のアカウントが引き続き動作するようにします。ほとんどのチャンネルではそれらを `channels.<channel>.accounts.default` に移動します。Matrixでは、既存の一致する名前付き/デフォルトターゲットを保持できる場合があります。
- 既存のチャンネルのみのバインディング（`accountId` なし）は、引き続きデフォルトアカウントに一致します。アカウントスコープのバインディングは引き続き省略可能です。
- `openclaw doctor --fix` も、アカウントスコープのトップレベル単一アカウント値を、そのチャンネル用に選択された昇格先アカウントへ移動することで、混在した形状を修復します。ほとんどのチャンネルでは `accounts.default` を使用します。Matrixでは、既存の一致する名前付き/デフォルトターゲットを保持できる場合があります。

### その他のPluginチャンネル

多くのPluginチャンネルは `channels.<id>` として設定され、それぞれ専用のチャンネルページに記載されています（例: Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch）。
完全なチャンネル索引を参照してください: [チャンネル](/ja-JP/channels)。

### グループチャットのメンションゲート

グループメッセージでは、デフォルトで **メンションが必要** です（メタデータメンションまたは安全な正規表現パターン）。WhatsApp、Telegram、Discord、Google Chat、iMessageのグループチャットに適用されます。

表示される返信は個別に制御されます。グループ/チャンネルルームのデフォルトは `messages.groupChat.visibleReplies: "message_tool"` です。OpenClawはターンの処理を継続しますが、通常の最終返信は非公開のままで、ルームに表示される出力には `message(action=send)` が必要です。通常の返信をルームに投稿し返す従来の動作が必要な場合にのみ、`"automatic"` を設定してください。同じツールのみの表示返信動作をダイレクトチャットにも適用するには、`messages.visibleReplies: "message_tool"` を設定します。Codexハーネスも、未設定のダイレクトチャットのデフォルトとしてそのツールのみの動作を使用します。

アクティブなツールポリシーの下でメッセージツールが利用できない場合、OpenClawは応答を黙って抑制するのではなく、自動表示返信にフォールバックします。`openclaw doctor` はこの不一致について警告します。

Gatewayは、ファイル保存後に `messages` 設定をホットリロードします。デプロイでファイル監視または設定リロードが無効になっている場合にのみ再起動してください。

**メンションの種類:**

- **メタデータメンション**: ネイティブプラットフォームの@メンション。WhatsAppのセルフチャットモードでは無視されます。
- **テキストパターン**: `agents.list[].groupChat.mentionPatterns` 内の安全な正規表現パターン。無効なパターンと安全でない入れ子の反復は無視されます。
- メンションゲートは、検出が可能な場合（ネイティブメンション、または少なくとも1つのパターンがある場合）にのみ適用されます。

```json5
{
  messages: {
    visibleReplies: "automatic", // global default for direct/source chats; Codex harness defaults unset direct chats to message_tool
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // default; use "automatic" for legacy final replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` はグローバルデフォルトを設定します。チャンネルは `channels.<channel>.historyLimit`（またはアカウントごと）で上書きできます。無効化するには `0` を設定します。

`messages.visibleReplies` はグローバルなソースターンのデフォルトです。`messages.groupChat.visibleReplies` はグループ/チャンネルのソースターンでそれを上書きします。`messages.visibleReplies` が未設定の場合、ハーネスは独自の direct/source デフォルトを提供できます。Codex ハーネスのデフォルトは `message_tool` です。チャンネルの allowlist とメンションゲートは、引き続きターンを処理するかどうかを決定します。

#### DM 履歴制限

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

解決順序: DM ごとの上書き → プロバイダーデフォルト → 制限なし（すべて保持）。

対応: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### セルフチャットモード

セルフチャットモードを有効にするには、自分の番号を `allowFrom` に含めます（ネイティブの @ メンションは無視し、テキストパターンにのみ応答します）。

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

### コマンド（チャットコマンド処理）

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

<Accordion title="コマンドの詳細">

- このブロックはコマンドサーフェスを設定します。現在の組み込み + バンドル済みコマンドカタログについては、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。
- このページは**設定キーのリファレンス**であり、完全なコマンドカタログではありません。QQ Bot `/bot-ping` `/bot-help` `/bot-logs`、LINE `/card`、デバイスペアリング `/pair`、メモリ `/dreaming`、電話制御 `/phone`、Talk `/voice` など、チャンネル/Plugin 所有のコマンドは、それぞれのチャンネル/Plugin ページと[スラッシュコマンド](/ja-JP/tools/slash-commands)で説明されています。
- テキストコマンドは、先頭に `/` が付いた**単独の**メッセージである必要があります。
- `native: "auto"` は Discord/Telegram のネイティブコマンドを有効にし、Slack は無効のままにします。
- `nativeSkills: "auto"` は Discord/Telegram のネイティブ Skills コマンドを有効にし、Slack は無効のままにします。
- チャンネルごとの上書き: `channels.discord.commands.native`（bool または `"auto"`）。`false` は以前登録されたコマンドを消去します。
- `channels.<provider>.commands.nativeSkills` で、チャンネルごとのネイティブ Skills 登録を上書きします。
- `channels.telegram.customCommands` は追加の Telegram ボットメニュー項目を追加します。
- `bash: true` はホストシェル用の `! <cmd>` を有効にします。`tools.elevated.enabled` と、送信者が `tools.elevated.allowFrom.<channel>` に含まれていることが必要です。
- `config: true` は `/config`（`openclaw.json` の読み書き）を有効にします。Gateway `chat.send` クライアントでは、永続的な `/config set|unset` 書き込みにも `operator.admin` が必要です。読み取り専用の `/config show` は、通常の書き込みスコープ付き operator クライアントでも引き続き利用できます。
- `mcp: true` は、`mcp.servers` 配下の OpenClaw 管理 MCP サーバー設定用に `/mcp` を有効にします。
- `plugins: true` は、Plugin の検出、インストール、有効化/無効化の制御用に `/plugins` を有効にします。
- `channels.<provider>.configWrites` は、チャンネルごとの設定変更を制御します（デフォルト: true）。
- 複数アカウントのチャンネルでは、`channels.<provider>.accounts.<id>.configWrites` も、そのアカウントを対象とする書き込み（たとえば `/allowlist --config --account <id>` や `/config set channels.<provider>.accounts.<id>...`）を制御します。
- `restart: false` は `/restart` と Gateway 再起動ツールアクションを無効にします。デフォルト: `true`。
- `ownerAllowFrom` は、所有者専用コマンド/ツールの明示的な所有者 allowlist です。`allowFrom` とは別です。
- `ownerDisplay: "hash"` はシステムプロンプト内の所有者 ID をハッシュ化します。ハッシュ化を制御するには `ownerDisplaySecret` を設定します。
- `allowFrom` はプロバイダーごとです。設定されている場合、それが**唯一の**認可ソースです（チャンネル allowlist/ペアリングと `useAccessGroups` は無視されます）。
- `useAccessGroups: false` は、`allowFrom` が設定されていない場合に、コマンドがアクセスグループポリシーをバイパスできるようにします。
- コマンドドキュメントの対応:
  - 組み込み + バンドル済みカタログ: [スラッシュコマンド](/ja-JP/tools/slash-commands)
  - チャンネル固有のコマンドサーフェス: [チャンネル](/ja-JP/channels)
  - QQ Bot コマンド: [QQ Bot](/ja-JP/channels/qqbot)
  - ペアリングコマンド: [ペアリング](/ja-JP/channels/pairing)
  - LINE card コマンド: [LINE](/ja-JP/channels/line)
  - メモリ Dreaming: [Dreaming](/ja-JP/concepts/dreaming)

</Accordion>

---

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference) — トップレベルキー
- [設定 — エージェント](/ja-JP/gateway/config-agents)
- [チャンネル概要](/ja-JP/channels)
