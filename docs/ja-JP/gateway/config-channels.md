---
read_when:
    - チャンネルPluginの設定（認証、アクセス制御、マルチアカウント）
    - チャネルごとの設定キーのトラブルシューティング
    - ダイレクトメッセージポリシー、グループポリシー、またはメンションゲーティングの監査
summary: 'チャネル設定: Slack、Discord、Telegram、WhatsApp、Matrix、iMessage などにわたるアクセス制御、ペアリング、チャネルごとのキー'
title: 設定 — チャンネル
x-i18n:
    generated_at: "2026-05-11T20:30:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4199725cdf1216f639ee1c02d5f510e1373edfecacf56977ac3a15d63f207f41
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` 配下のチャネルごとの設定キー。DM とグループアクセス、
マルチアカウント構成、メンションゲート、および Slack、Discord、
Telegram、WhatsApp、Matrix、iMessage、その他の同梱チャネル Plugin のチャネルごとのキーを扱います。

エージェント、ツール、Gateway ランタイム、その他のトップレベルキーについては、
[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## チャネル

各チャネルは、設定セクションが存在すると自動的に起動します（`enabled: false` の場合を除く）。

### DM とグループアクセス

すべてのチャネルは DM ポリシーとグループポリシーをサポートします。

| DM ポリシー         | 動作                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (default) | 不明な送信者には 1 回限りのペアリングコードが送られ、所有者の承認が必要 |
| `allowlist`         | `allowFrom`（またはペアリング済み許可ストア）内の送信者のみ     |
| `open`              | すべての受信 DM を許可（`allowFrom: ["*"]` が必要）             |
| `disabled`          | すべての受信 DM を無視                                          |

| グループポリシー    | 動作                                                       |
| ------------------- | ---------------------------------------------------------- |
| `allowlist` (default) | 設定された許可リストに一致するグループのみ               |
| `open`              | グループ許可リストをバイパス（メンションゲートは引き続き適用） |
| `disabled`          | すべてのグループ/ルームメッセージをブロック               |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が未設定の場合のデフォルトを設定します。
ペアリングコードは 1 時間後に期限切れになります。保留中の DM ペアリングリクエストは **チャネルごとに 3 件** までです。
プロバイダーブロックが完全に欠落している場合（`channels.<provider>` が存在しない場合）、ランタイムのグループポリシーは起動時警告とともに `allowlist`（フェイルクローズ）へフォールバックします。
</Note>

### チャネルモデルの上書き

`channels.modelByChannel` を使用して、特定のチャネル ID をモデルに固定します。値には `provider/model` または設定済みのモデルエイリアスを指定できます。セッションにモデル上書きがまだない場合（たとえば `/model` で設定された場合）に、チャネルマッピングが適用されます。

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

### チャネルデフォルトと Heartbeat

プロバイダー全体で共有されるグループポリシーと Heartbeat の動作には、`channels.defaults` を使用します。

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
- `channels.defaults.contextVisibility`: すべてのチャネルのデフォルト補助コンテキスト可視性モード。値: `all`（デフォルト、引用/スレッド/履歴コンテキストをすべて含める）、`allowlist`（許可リスト内の送信者からのコンテキストのみ含める）、`allowlist_quote`（allowlist と同じだが、明示的な引用/返信コンテキストは保持）。チャネルごとの上書き: `channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`: Heartbeat 出力に正常なチャネルステータスを含める。
- `channels.defaults.heartbeat.showAlerts`: Heartbeat 出力に劣化/エラーステータスを含める。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケーター形式の Heartbeat 出力を表示する。

### WhatsApp

WhatsApp は Gateway の Web チャネル（Baileys Web）を通じて実行されます。リンク済みセッションが存在すると自動的に起動します。

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

- 送信コマンドは、存在する場合はアカウント `default` をデフォルトにします。それ以外の場合は、最初の設定済みアカウント ID（ソート済み）を使用します。
- 任意の `channels.whatsapp.defaultAccount` は、設定済みアカウント ID と一致する場合、そのフォールバックのデフォルトアカウント選択を上書きします。
- レガシーの単一アカウント Baileys 認証ディレクトリは、`openclaw doctor` によって `whatsapp/default` に移行されます。
- アカウントごとの上書き: `channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

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

- ボットトークン: `channels.telegram.botToken` または `channels.telegram.tokenFile`（通常ファイルのみ。シンボリックリンクは拒否）。デフォルトアカウントのフォールバックとして `TELEGRAM_BOT_TOKEN` を使用します。
- `apiRoot` は Telegram Bot API のルートのみです。`https://api.telegram.org/bot<TOKEN>` ではなく、`https://api.telegram.org` またはセルフホスト/プロキシのルートを使用してください。`openclaw doctor --fix` は、誤って末尾に付いた `/bot<TOKEN>` サフィックスを削除します。
- 任意の `channels.telegram.defaultAccount` は、設定済みアカウント ID と一致する場合、デフォルトアカウント選択を上書きします。
- マルチアカウント構成（2 個以上のアカウント ID）では、フォールバックルーティングを避けるために明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定します。これが欠落または無効な場合、`openclaw doctor` が警告します。
- `configWrites: false` は、Telegram から開始される設定書き込み（スーパーグループ ID 移行、`/config set|unset`）をブロックします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、フォーラムトピックの永続的な ACP バインディングを設定します（`match.peer.id` では正規形式の `chatId:topic:topicId` を使用）。フィールドの意味は [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings) で共有されています。
- Telegram ストリームプレビューは `sendMessage` + `editMessageText` を使用します（ダイレクトチャットとグループチャットで動作）。
- リトライポリシー: [リトライポリシー](/ja-JP/concepts/retry)を参照してください。

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
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        progress: {
          label: "auto",
          maxLines: 8,
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

- トークン: `channels.discord.token`。デフォルトアカウントのフォールバックとして `DISCORD_BOT_TOKEN` を使用します。
- 明示的な Discord `token` を指定する直接のアウトバウンド呼び出しでは、その呼び出しにそのトークンを使用します。アカウントのリトライ/ポリシー設定は、アクティブなランタイムスナップショット内の選択されたアカウントから引き続き取得されます。
- 任意の `channels.discord.defaultAccount` は、構成済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` (ギルドチャンネル) を使用します。裸の数値 ID は拒否されます。
- ギルドスラッグは小文字で、スペースは `-` に置き換えられます。チャンネルキーはスラッグ化された名前を使用します (`#` なし)。ギルド ID を推奨します。
- ボットが作成したメッセージはデフォルトで無視されます。`allowBots: true` で有効化できます。ボットにメンションしているボットメッセージのみを受け入れるには `allowBots: "mentions"` を使用します (自身のメッセージは引き続きフィルタリングされます)。
- `channels.discord.guilds.<id>.ignoreOtherMentions` (およびチャンネル上書き) は、ボットではない別のユーザーまたはロールにメンションしているメッセージを破棄します (@everyone/@here は除外)。
- `channels.discord.mentionAliases` は、安定したアウトバウンド `@handle` テキストを送信前に Discord ユーザー ID にマップします。これにより、一時的なディレクトリキャッシュが空でも、既知のチームメイトを決定的にメンションできます。アカウントごとの上書きは `channels.discord.accounts.<accountId>.mentionAliases` 配下に置きます。
- `maxLinesPerMessage` (デフォルト 17) は、2000 文字未満でも縦に長いメッセージを分割します。
- `channels.discord.threadBindings` は Discord スレッドバインドのルーティングを制御します:
  - `enabled`: スレッドバインドのセッション機能 (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびバインドされた配信/ルーティング) に対する Discord 上書き
  - `idleHours`: 非アクティブ時の自動フォーカス解除までの時間に対する Discord 上書き (`0` で無効)
  - `maxAgeHours`: ハード最大経過時間に対する Discord 上書き (`0` で無効)
  - `spawnSessions`: `sessions_spawn({ thread: true })` および ACP スレッドスポーンの自動スレッド作成/バインドのスイッチ (デフォルト: `true`)
  - `defaultSpawnContext`: スレッドバインドスポーン用のネイティブサブエージェントコンテキスト (デフォルトは `"fork"`)
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、チャンネルとスレッド向けの永続 ACP バインディングを構成します (`match.peer.id` にはチャンネル/スレッド ID を使用)。フィールドの意味は [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings) で共通です。
- `channels.discord.ui.components.accentColor` は、Discord components v2 コンテナのアクセントカラーを設定します。
- `channels.discord.voice` は Discord ボイスチャンネル会話と、任意の自動参加 + LLM + TTS 上書きを有効にします。テキストのみの Discord 構成では、デフォルトで音声はオフです。オプトインするには `channels.discord.voice.enabled=true` を設定します。
- `channels.discord.voice.model` は、Discord ボイスチャンネル応答に使用される LLM モデルを任意で上書きします。
- `channels.discord.voice.daveEncryption` と `channels.discord.voice.decryptionFailureTolerance` は、`@discordjs/voice` の DAVE オプションにそのまま渡されます (デフォルトは `true` と `24`)。
- `channels.discord.voice.connectTimeoutMs` は、`/vc join` と自動参加試行の初期 `@discordjs/voice` Ready 待機を制御します (デフォルトは `30000`)。
- `channels.discord.voice.reconnectGraceMs` は、切断された音声セッションが再接続シグナリングに入るまでに許容される時間を制御します。この時間を過ぎると OpenClaw はそれを破棄します (デフォルトは `15000`)。
- Discord 音声再生は、別ユーザーの発話開始イベントによって中断されません。フィードバックループを避けるため、OpenClaw は TTS 再生中の新しい音声キャプチャを無視します。
- OpenClaw はさらに、復号失敗が繰り返された後に音声セッションを退出/再参加することで、音声受信の復旧を試みます。
- `channels.discord.streaming` は正規のストリームモードキーです。Discord はデフォルトで `streaming.mode: "progress"` になっているため、ツール/作業の進捗は編集済みの 1 件のプレビューメッセージに表示されます。無効化するには `streaming.mode: "off"` を設定します。レガシーの `streamMode` とブール値の `streaming` はランタイムエイリアスとして残ります。永続化された構成を書き換えるには `openclaw doctor --fix` を実行します。
- `channels.discord.autoPresence` はランタイム可用性をボットプレゼンスにマップし (healthy => online、degraded => idle、exhausted => dnd)、任意のステータステキスト上書きを許可します。
- `channels.discord.dangerouslyAllowNameMatching` は、変更可能な名前/タグ照合を再有効化します (緊急互換モード)。
- `channels.discord.execApprovals`: Discord ネイティブの exec 承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"` (デフォルト)。auto モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効になります。
  - `approvers`: exec リクエストの承認を許可された Discord ユーザー ID。省略時は `commands.ownerAllowFrom` にフォールバックします。
  - `agentFilter`: 任意のエージェント ID 許可リスト。省略すると、すべてのエージェントの承認を転送します。
  - `sessionFilter`: 任意のセッションキーパターン (部分文字列または正規表現)。
  - `target`: 承認プロンプトの送信先。`"dm"` (デフォルト) は承認者の DM に送信し、`"channel"` は発信元チャンネルに送信し、`"both"` は両方に送信します。ターゲットに `"channel"` が含まれる場合、ボタンは解決済み承認者のみが使用できます。
  - `cleanupAfterResolve`: `true` の場合、承認、拒否、またはタイムアウト後に承認 DM を削除します。

**リアクション通知モード:** `off` (なし)、`own` (ボットのメッセージ、デフォルト)、`all` (すべてのメッセージ)、`allowlist` (すべてのメッセージに対して `guilds.<id>.users` から)。

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

- サービスアカウント JSON: インライン (`serviceAccount`) またはファイルベース (`serviceAccountFile`)。
- サービスアカウント SecretRef もサポートされています (`serviceAccountRef`)。
- 環境変数フォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信ターゲットには `spaces/<spaceId>` または `users/<userId>` を使用します。
- `channels.googlechat.dangerouslyAllowNameMatching` は、変更可能なメールプリンシパル照合を再有効化します (緊急互換モード)。

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

- **Socket mode** には `botToken` と `appToken` の両方が必要です (デフォルトアカウントの環境変数フォールバックには `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`)。
- **HTTP mode** には `botToken` と `signingSecret` (ルートまたはアカウントごと) が必要です。
- `socketMode` は Slack SDK Socket Mode トランスポート調整を公開 Bolt レシーバー API にそのまま渡します。ping/pong タイムアウトや古い websocket の挙動を調査するときだけ使用してください。
- `botToken`、`appToken`、`signingSecret`、`userToken` は平文
  文字列または SecretRef オブジェクトを受け入れます。
- Slack アカウントスナップショットは、資格情報ごとのソース/ステータスフィールド、たとえば
  `botTokenSource`、`botTokenStatus`、`appTokenStatus`、および HTTP モードでは
  `signingSecretStatus` を公開します。`configured_unavailable` は、そのアカウントが
  SecretRef を通じて構成されているものの、現在のコマンド/ランタイムパスが
  シークレット値を解決できなかったことを意味します。
- `configWrites: false` は Slack 起点の構成書き込みをブロックします。
- 任意の `channels.slack.defaultAccount` は、構成済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- `channels.slack.streaming.mode` は正規の Slack ストリームモードキーです。`channels.slack.streaming.nativeTransport` は Slack のネイティブストリーミングトランスポートを制御します。レガシーの `streamMode`、ブール値の `streaming`、および `nativeStreaming` はランタイムエイリアスとして残ります。永続化された構成を書き換えるには `openclaw doctor --fix` を実行します。
- `unfurlLinks` と `unfurlMedia` は、ボット返信向けに Slack の `chat.postMessage` のリンクおよびメディア展開ブール値をそのまま渡します。Slack のデフォルト動作を維持するには省略します。1 つのアカウントでトップレベルのデフォルトを上書きするには `channels.slack.accounts.<accountId>` に設定します。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` を使用します。

**リアクション通知モード:** `off`、`own` (デフォルト)、`all`、`allowlist` (`reactionAllowlist` から)。

**スレッドセッション分離:** `thread.historyScope` はスレッドごと (デフォルト) またはチャンネル全体で共有です。`thread.inheritParent` は親チャンネルのトランスクリプトを新しいスレッドにコピーします。

- Slack ネイティブストリーミングと Slack アシスタント形式の「is typing...」スレッドステータスには、返信スレッドターゲットが必要です。トップレベル DM はデフォルトでスレッド外のままなので、スレッド形式のネイティブストリーム/ステータスプレビューを表示する代わりに、Slack のドラフト投稿および編集プレビューを通じて引き続きストリーミングできます。
- `typingReaction` は、返信の実行中に受信 Slack メッセージへ一時的なリアクションを追加し、完了時に削除します。`"hourglass_flowing_sand"` のような Slack 絵文字ショートコードを使用します。
- `channels.slack.execApprovals`: Slack ネイティブの exec 承認配信と承認者認可。Discord と同じスキーマです: `enabled` (`true`/`false`/`"auto"`)、`approvers` (Slack ユーザー ID)、`agentFilter`、`sessionFilter`、および `target` (`"dm"`、`"channel"`、または `"both"`)。

| アクショングループ | デフォルト | メモ                  |
| ------------ | ------- | ---------------------- |
| reactions    | 有効 | リアクション + リアクション一覧 |
| messages     | 有効 | 読み取り/送信/編集/削除  |
| pins         | 有効 | ピン留め/ピン解除/一覧         |
| memberInfo   | 有効 | メンバー情報            |
| emojiList    | 有効 | カスタム絵文字一覧      |

### Mattermost

Mattermost は現在の OpenClaw リリースではバンドル Plugin として提供されます。古いビルドまたは
カスタムビルドでは、現在の npm パッケージを
`openclaw plugins install @openclaw/mattermost` でインストールできます。バージョンを固定する前に、現在の dist-tag を
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
で確認してください。

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

チャットモード: `oncall`（@メンションに応答、デフォルト）、`onmessage`（すべてのメッセージ）、`onchar`（トリガープレフィックスで始まるメッセージ）。

Mattermost ネイティブコマンドを有効にした場合:

- `commands.callbackPath` はフル URL ではなく、パス（例: `/api/channels/mattermost/command`）である必要があります。
- `commands.callbackUrl` は OpenClaw Gateway エンドポイントに解決され、Mattermost サーバーから到達可能である必要があります。
- ネイティブスラッシュコールバックは、スラッシュコマンド登録時に Mattermost から返されるコマンドごとのトークンで認証されます。登録に失敗した場合、または有効化されたコマンドがない場合、OpenClaw は `Unauthorized: invalid command token.` でコールバックを拒否します。
- プライベート/tailnet/内部コールバックホストでは、Mattermost が `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックホスト/ドメインを含めることを要求する場合があります。フル URL ではなく、ホスト/ドメイン値を使用してください。
- `channels.mattermost.configWrites`: Mattermost 起点の設定書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャンネル内で返信する前に `@mention` を要求します。
- `channels.mattermost.groups.<channelId>.requireMention`: チャンネルごとのメンションゲート上書き（デフォルトは `"*"`）。
- 任意の `channels.mattermost.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。

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

- `channels.signal.account`: チャンネル起動を特定の Signal アカウント ID に固定します。
- `channels.signal.configWrites`: Signal 起点の設定書き込みを許可または拒否します。
- 任意の `channels.signal.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。

### iMessage

OpenClaw は `imsg rpc`（stdio 上の JSON-RPC）を起動します。デーモンやポートは不要です。これは、ホストが Messages データベースと Automation 権限を付与できる場合の、新しい OpenClaw iMessage セットアップで推奨されるパスです。

BlueBubbles サポートは削除されました。現在の OpenClaw では、`channels.bluebubbles` はサポート対象のランタイム設定サーフェスではありません。古い設定は `channels.imessage` に移行してください。短い概要は [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage) を、完全な変換表は [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles) を参照してください。

Gateway がサインイン済みの Messages Mac で実行されていない場合は、`channels.imessage.enabled=true` のままにし、`channels.imessage.cliPath` をその Mac で `imsg "$@"` を実行する SSH ラッパーに設定します。デフォルトのローカル `imsg` パスは macOS 専用です。

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
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
      catchup: {
        enabled: false,
      },
    },
  },
}
```

- 任意の `channels.imessage.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。

- Messages DB へのフルディスクアクセスが必要です。
- `chat_id:<id>` ターゲットを推奨します。チャット一覧を表示するには `imsg chats --limit 20` を使用します。
- `cliPath` は SSH ラッパーを指せます。SCP 添付ファイル取得用に `remoteHost`（`host` または `user@host`）を設定します。
- `attachmentRoots` と `remoteAttachmentRoots` は受信添付ファイルパスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCP は厳格なホストキー確認を使用するため、リレーホストキーがすでに `~/.ssh/known_hosts` に存在することを確認してください。
- `channels.imessage.configWrites`: iMessage 起点の設定書き込みを許可または拒否します。
- `channels.imessage.actions.*`: `imsg status` / `openclaw channels status --probe` でもゲートされるプライベート API アクションを有効にします。
- `channels.imessage.includeAttachments` はデフォルトでオフです。エージェントターンで受信メディアを期待する前に `true` に設定してください。
- `channels.imessage.catchup.enabled`: Gateway が停止していた間に到着した受信メッセージの再生にオプトインします。
- `channels.imessage.groups`: グループレジストリとグループごとの設定です。`groupPolicy: "allowlist"` では、グループメッセージがレジストリゲートを通過できるよう、明示的な `chat_id` キーまたは `"*"` ワイルドカードエントリのいずれかを設定します。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、iMessage 会話を永続 ACP セッションにバインドできます。`match.peer.id` には正規化されたハンドル、または明示的なチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共有フィールドの意味: [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)。

<Accordion title="iMessage SSH ラッパー例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix は Plugin ベースで、`channels.matrix` 配下で設定されます。

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
- `channels.matrix.proxy` は Matrix HTTP トラフィックを明示的な HTTP(S) プロキシ経由でルーティングします。名前付きアカウントは `channels.matrix.accounts.<id>.proxy` で上書きできます。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` はプライベート/内部ホームサーバーを許可します。`proxy` とこのネットワークオプトインは独立した制御です。
- `channels.matrix.defaultAccount` は、複数アカウント設定で優先アカウントを選択します。
- `channels.matrix.autoJoin` はデフォルトで `off` のため、招待されたルームと新しい DM 形式の招待は、`autoJoin: "allowlist"` と `autoJoinAllowlist`、または `autoJoin: "always"` を設定するまで無視されます。
- `channels.matrix.execApprovals`: Matrix ネイティブの exec 承認配信と承認者認可です。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。自動モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効化されます。
  - `approvers`: exec リクエストの承認を許可された Matrix ユーザー ID（例: `@owner:example.org`）。
  - `agentFilter`: 任意のエージェント ID 許可リスト。省略するとすべてのエージェントの承認を転送します。
  - `sessionFilter`: 任意のセッションキーパターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）、`"channel"`（発信元ルーム）、または `"both"`。
  - アカウントごとの上書き: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` は Matrix DM をセッションにグループ化する方法を制御します。`per-user`（デフォルト）はルーティングされたピアで共有し、`per-room` は各 DM ルームを分離します。
- Matrix ステータスプローブとライブディレクトリ検索は、ランタイムトラフィックと同じプロキシポリシーを使用します。
- Matrix の完全な設定、ターゲット指定ルール、セットアップ例は [Matrix](/ja-JP/channels/matrix) に記載されています。

### Microsoft Teams

Microsoft Teams は Plugin ベースで、`channels.msteams` 配下で設定されます。

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
- Teams の完全な設定（認証情報、webhook、DM/グループポリシー、チームごと/チャンネルごとの上書き）は [Microsoft Teams](/ja-JP/channels/msteams) に記載されています。

### IRC

IRC は Plugin ベースで、`channels.irc` 配下で設定されます。

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
- 任意の `channels.irc.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- IRC チャンネルの完全な設定（ホスト/ポート/TLS/チャンネル/許可リスト/メンションゲート）は [IRC](/ja-JP/channels/irc) に記載されています。

### 複数アカウント（すべてのチャンネル）

チャンネルごとに複数のアカウントを実行します（それぞれ独自の `accountId` を持ちます）。

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

- `accountId` が省略された場合、`default` が使用されます（CLI + ルーティング）。
- 環境変数トークンは **デフォルト** アカウントにのみ適用されます。
- ベースチャンネル設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- 各アカウントを別のエージェントにルーティングするには、`bindings[].match.accountId` を使用します。
- 単一アカウントのトップレベルチャンネル設定のまま、`openclaw channels add`（またはチャンネルオンボーディング）で非デフォルトアカウントを追加した場合、OpenClaw は元のアカウントが引き続き動作するよう、まずアカウントスコープのトップレベル単一アカウント値をチャンネルアカウントマップに昇格します。ほとんどのチャンネルではそれらを `channels.<channel>.accounts.default` に移動します。Matrix では既存の一致する名前付き/デフォルトターゲットを代わりに保持できます。
- 既存のチャンネルのみのバインディング（`accountId` なし）はデフォルトアカウントとのマッチを維持します。アカウントスコープのバインディングは引き続き任意です。
- `openclaw doctor --fix` も、そのチャンネルで選択された昇格済みアカウントへ、アカウントスコープのトップレベル単一アカウント値を移動することで混在形状を修復します。ほとんどのチャンネルでは `accounts.default` を使用します。Matrix では既存の一致する名前付き/デフォルトターゲットを代わりに保持できます。

### その他の Plugin チャンネル

多くの Plugin チャンネルは `channels.<id>` として設定され、それぞれ専用のチャンネルページに記載されています（例: Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch）。
完全なチャンネル索引を参照してください: [チャンネル](/ja-JP/channels)。

### グループチャットのメンションゲート

グループメッセージはデフォルトで **メンション必須**（メタデータメンションまたは安全な正規表現パターン）です。WhatsApp、Telegram、Discord、Google Chat、iMessage のグループチャットに適用されます。

表示される返信は別に制御されます。グループ/チャンネルルームのデフォルトは `messages.groupChat.visibleReplies: "message_tool"` です。OpenClaw は引き続きターンを処理しますが、通常の最終返信は非公開のままで、ルームに表示される出力には `message(action=send)` が必要です。通常の返信をルームへ投稿し返す従来の挙動が必要な場合のみ `"automatic"` を設定してください。同じツール専用の表示返信挙動をダイレクトチャットにも適用するには、`messages.visibleReplies: "message_tool"` を設定します。Codex ハーネスも、未設定のダイレクトチャットのデフォルトとしてこのツール専用挙動を使用します。

ツール専用の表示返信には、確実にツールを呼び出すモデル/ランタイムが必要です。セッションログに `didSendViaMessagingTool: false` の assistant テキストが表示される場合、そのモデルはメッセージツールを呼び出す代わりに非公開の最終回答を生成しています。そのチャンネルでは、より強力なツール呼び出し対応モデルに切り替えるか、`messages.groupChat.visibleReplies: "automatic"` を設定して従来の表示される最終返信を復元してください。

アクティブなツールポリシーでメッセージツールが利用できない場合、OpenClaw は応答を静かに抑制するのではなく、自動の表示返信にフォールバックします。`openclaw doctor` はこの不一致について警告します。

Gateway は、ファイルの保存後に `messages` 設定をホットリロードします。デプロイでファイル監視または設定リロードが無効になっている場合のみ再起動してください。

**メンションの種類:**

- **メタデータメンション**: ネイティブプラットフォームの @ メンション。WhatsApp のセルフチャットモードでは無視されます。
- **テキストパターン**: `agents.list[].groupChat.mentionPatterns` 内の安全な正規表現パターン。無効なパターンと安全でないネストされた繰り返しは無視されます。
- メンションゲーティングは、検出が可能な場合（ネイティブメンション、または少なくとも 1 つのパターン）にのみ適用されます。

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

`messages.groupChat.historyLimit` はグローバルデフォルトを設定します。チャンネルは `channels.<channel>.historyLimit`（またはアカウント単位）で上書きできます。無効にするには `0` を設定します。

`messages.visibleReplies` はグローバルなソースターンのデフォルトです。`messages.groupChat.visibleReplies` は、グループ/チャンネルのソースターンについてそれを上書きします。`messages.visibleReplies` が未設定の場合、ハーネスは独自のダイレクト/ソースのデフォルトを提供できます。Codex ハーネスのデフォルトは `message_tool` です。チャンネル許可リストとメンションゲーティングは、ターンを処理するかどうかを引き続き決定します。

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

解決順序: DM 単位の上書き → プロバイダーのデフォルト → 制限なし（すべて保持）。

対応: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`。

#### セルフチャットモード

セルフチャットモードを有効にするには、自分の番号を `allowFrom` に含めます（ネイティブ @ メンションを無視し、テキストパターンにのみ応答します）。

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

- このブロックはコマンドサーフェスを設定します。現在の組み込み + バンドル済みコマンドカタログについては、[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。
- このページは**設定キーのリファレンス**であり、完全なコマンドカタログではありません。QQ Bot の `/bot-ping` `/bot-help` `/bot-logs`、LINE の `/card`、デバイスペアリングの `/pair`、メモリの `/dreaming`、電話制御の `/phone`、Talk の `/voice` など、チャンネル/Plugin が所有するコマンドは、それぞれのチャンネル/Plugin ページと [スラッシュコマンド](/ja-JP/tools/slash-commands) に記載されています。
- テキストコマンドは、先頭に `/` が付いた**単独の**メッセージである必要があります。
- `native: "auto"` は Discord/Telegram のネイティブコマンドを有効にし、Slack はオフのままにします。
- `nativeSkills: "auto"` は Discord/Telegram のネイティブ Skills コマンドを有効にし、Slack はオフのままにします。
- チャンネル単位で上書きします: `channels.discord.commands.native`（真偽値または `"auto"`）。Discord では、`false` にすると起動時のネイティブコマンド登録とクリーンアップをスキップします。
- `channels.<provider>.commands.nativeSkills` でチャンネル単位のネイティブ Skills 登録を上書きします。
- `channels.telegram.customCommands` は追加の Telegram ボットメニュー項目を追加します。
- `bash: true` はホストシェル用の `! <cmd>` を有効にします。`tools.elevated.enabled` と、送信者が `tools.elevated.allowFrom.<channel>` に含まれていることが必要です。
- `config: true` は `/config`（`openclaw.json` の読み取り/書き込み）を有効にします。Gateway の `chat.send` クライアントでは、永続的な `/config set|unset` 書き込みにも `operator.admin` が必要です。読み取り専用の `/config show` は、通常の書き込みスコープを持つ operator クライアントでも引き続き利用できます。
- `mcp: true` は `mcp.servers` 配下の OpenClaw 管理 MCP サーバー設定向けに `/mcp` を有効にします。
- `plugins: true` は Plugin の検出、インストール、有効化/無効化制御向けに `/plugins` を有効にします。
- `channels.<provider>.configWrites` は、チャンネル単位で設定変更をゲートします（デフォルト: true）。
- マルチアカウントチャンネルでは、`channels.<provider>.accounts.<id>.configWrites` も、そのアカウントを対象とする書き込み（例: `/allowlist --config --account <id>` または `/config set channels.<provider>.accounts.<id>...`）をゲートします。
- `restart: false` は `/restart` と Gateway 再起動ツールアクションを無効にします。デフォルト: `true`。
- `ownerAllowFrom` は、owner 専用コマンド/ツール向けの明示的な owner 許可リストです。`allowFrom` とは別です。
- `ownerDisplay: "hash"` はシステムプロンプト内の owner ID をハッシュ化します。ハッシュ化を制御するには `ownerDisplaySecret` を設定します。
- `allowFrom` はプロバイダー単位です。設定されている場合、それが**唯一の**認可ソースです（チャンネル許可リスト/ペアリングと `useAccessGroups` は無視されます）。
- `useAccessGroups: false` は、`allowFrom` が設定されていない場合に、コマンドがアクセスグループポリシーをバイパスできるようにします。
- コマンドドキュメントマップ:
  - 組み込み + バンドル済みカタログ: [スラッシュコマンド](/ja-JP/tools/slash-commands)
  - チャンネル固有のコマンドサーフェス: [チャンネル](/ja-JP/channels)
  - QQ Bot コマンド: [QQ Bot](/ja-JP/channels/qqbot)
  - ペアリングコマンド: [ペアリング](/ja-JP/channels/pairing)
  - LINE カードコマンド: [LINE](/ja-JP/channels/line)
  - メモリ Dreaming: [Dreaming](/ja-JP/concepts/dreaming)

</Accordion>

---

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference) — トップレベルキー
- [設定 — agents](/ja-JP/gateway/config-agents)
- [チャンネル概要](/ja-JP/channels)
