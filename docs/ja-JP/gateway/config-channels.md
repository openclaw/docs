---
read_when:
    - チャネル Plugin の設定（認証、アクセス制御、マルチアカウント）
    - チャネルごとの設定キーのトラブルシューティング
    - ダイレクトメッセージポリシー、グループポリシー、またはメンション制御の監査
summary: 'チャネル設定: Slack、Discord、Telegram、WhatsApp、Matrix、iMessage などにわたるアクセス制御、ペアリング、チャネルごとのキー'
title: 設定 — チャンネル
x-i18n:
    generated_at: "2026-05-03T04:58:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5ec4aad94a844f6e2f936b2e0d208343ea264c9a4c74f7fc610c516e0353b53b
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` 配下のチャンネル別設定キー。DM とグループアクセス、
複数アカウント構成、メンションゲート、Slack、Discord、
Telegram、WhatsApp、Matrix、iMessage、およびその他のバンドル済みチャンネル Plugin 向けのチャンネル別キーを扱います。

エージェント、ツール、Gateway ランタイム、その他のトップレベルキーについては、
[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## チャンネル

各チャンネルは、その設定セクションが存在すると自動的に起動します（`enabled: false` の場合を除く）。

### DM とグループアクセス

すべてのチャンネルは DM ポリシーとグループポリシーをサポートします。

| DM ポリシー        | 動作                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (デフォルト) | 不明な送信者に 1 回限りのペアリングコードを発行し、所有者の承認が必要 |
| `allowlist`         | `allowFrom`（またはペアリング済み許可ストア）内の送信者のみ     |
| `open`              | すべての受信 DM を許可（`allowFrom: ["*"]` が必要）             |
| `disabled`          | すべての受信 DM を無視                                          |

| グループポリシー    | 動作                                                   |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (デフォルト) | 設定済みの許可リストに一致するグループのみ             |
| `open`                | グループ許可リストをバイパス（メンションゲートは引き続き適用） |
| `disabled`            | すべてのグループ/ルームメッセージをブロック            |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が未設定の場合のデフォルトを設定します。
ペアリングコードは 1 時間後に期限切れになります。保留中の DM ペアリング要求は **チャンネルあたり 3 件** に制限されます。
プロバイダーブロック全体が存在しない場合（`channels.<provider>` がない場合）、ランタイムのグループポリシーは起動時警告とともに `allowlist`（フェイルクローズ）にフォールバックします。
</Note>

### チャンネルモデルの上書き

`channels.modelByChannel` を使用して、特定のチャンネル ID をモデルに固定します。値には `provider/model` または設定済みモデルエイリアスを指定できます。このチャンネルマッピングは、セッションにモデル上書きがまだない場合（たとえば `/model` で設定されていない場合）に適用されます。

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
- `channels.defaults.contextVisibility`: すべてのチャンネルに対する補足コンテキスト可視性モードのデフォルト。値: `all`（デフォルト。引用/スレッド/履歴コンテキストをすべて含める）、`allowlist`（許可リスト内の送信者からのコンテキストのみ含める）、`allowlist_quote`（allowlist と同じだが、明示的な引用/返信コンテキストは保持）。チャンネル別上書き: `channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`: Heartbeat 出力に正常なチャンネルステータスを含めます。
- `channels.defaults.heartbeat.showAlerts`: Heartbeat 出力に低下/エラーステータスを含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケーター形式の Heartbeat 出力をレンダリングします。

### WhatsApp

WhatsApp は Gateway の Web チャンネル（Baileys Web）経由で実行されます。リンク済みセッションが存在すると自動的に起動します。

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

<Accordion title="複数アカウント WhatsApp">

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
- オプションの `channels.whatsapp.defaultAccount` は、設定済みアカウント ID と一致する場合、そのフォールバックのデフォルトアカウント選択を上書きします。
- レガシーの単一アカウント Baileys 認証ディレクトリは、`openclaw doctor` によって `whatsapp/default` に移行されます。
- アカウント別上書き: `channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

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
- オプションの `channels.telegram.defaultAccount` は、設定済みアカウント ID と一致する場合、デフォルトアカウント選択を上書きします。
- 複数アカウント構成（2 個以上のアカウント ID）では、フォールバックルーティングを避けるために明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定します。これが欠落しているか無効な場合、`openclaw doctor` が警告します。
- `configWrites: false` は、Telegram 起点の設定書き込み（スーパーグループ ID 移行、`/config set|unset`）をブロックします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、フォーラムトピック向けの永続 ACP バインディングを設定します（`match.peer.id` では正規形式の `chatId:topic:topicId` を使用）。フィールドの意味は [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)で共有されています。
- Telegram ストリームプレビューは `sendMessage` + `editMessageText` を使用します（ダイレクトチャットとグループチャットで動作します）。
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

- トークン: `channels.discord.token`。デフォルトアカウントのフォールバックは `DISCORD_BOT_TOKEN`。
- 明示的な Discord `token` を指定する直接アウトバウンド呼び出しでは、その呼び出しにそのトークンを使用する。アカウントの再試行/ポリシー設定は、引き続きアクティブなランタイムスナップショットで選択されたアカウントから取得される。
- 任意の `channels.discord.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウントの選択を上書きする。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` (ギルドチャンネル) を使用する。裸の数値 ID は拒否される。
- ギルドスラッグは小文字で、スペースは `-` に置換される。チャンネルキーはスラッグ化した名前を使用する (`#` なし)。ギルド ID を推奨する。
- ボットが作成したメッセージはデフォルトで無視される。`allowBots: true` で有効化できる。ボットにメンションしているボットメッセージのみを受け入れるには `allowBots: "mentions"` を使用する (自身のメッセージは引き続きフィルタされる)。
- `channels.discord.guilds.<id>.ignoreOtherMentions` (およびチャンネルの上書き) は、別のユーザーまたはロールにメンションしているがボットにはメンションしていないメッセージを破棄する (@everyone/@here は除く)。
- `channels.discord.mentionAliases` は、送信前に安定したアウトバウンド `@handle` テキストを Discord ユーザー ID にマッピングする。これにより、一時ディレクトリキャッシュが空でも、既知のチームメイトに決定的にメンションできる。アカウントごとの上書きは `channels.discord.accounts.<accountId>.mentionAliases` の下に置く。
- `maxLinesPerMessage` (デフォルト 17) は、2000 文字未満でも縦に長いメッセージを分割する。
- `channels.discord.threadBindings` は Discord のスレッドバインド型ルーティングを制御する:
  - `enabled`: スレッドバインド型セッション機能 (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびバインドされた配信/ルーティング) の Discord 上書き
  - `idleHours`: 非アクティブ時の自動フォーカス解除までの時間を時間単位で指定する Discord 上書き (`0` で無効)
  - `maxAgeHours`: 強制最大経過時間を時間単位で指定する Discord 上書き (`0` で無効)
  - `spawnSessions`: `sessions_spawn({ thread: true })` および ACP スレッド生成時の自動スレッド作成/バインドのスイッチ (デフォルト: `true`)
  - `defaultSpawnContext`: スレッドバインド型生成でのネイティブサブエージェントコンテキスト (デフォルトは `"fork"`)
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、チャンネルおよびスレッドの永続 ACP バインドを設定する (`match.peer.id` にはチャンネル/スレッド ID を使用)。フィールドの意味は [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings) で共有されている。
- `channels.discord.ui.components.accentColor` は Discord components v2 コンテナのアクセントカラーを設定する。
- `channels.discord.voice` は Discord 音声チャンネル会話と、任意の自動参加 + LLM + TTS 上書きを有効化する。テキストのみの Discord 設定では、デフォルトで音声はオフのままになる。参加するには `channels.discord.voice.enabled=true` を設定する。
- `channels.discord.voice.model` は、Discord 音声チャンネル応答に使用する LLM モデルを任意で上書きする。
- `channels.discord.voice.daveEncryption` と `channels.discord.voice.decryptionFailureTolerance` は、`@discordjs/voice` の DAVE オプションにそのまま渡される (デフォルトは `true` と `24`)。
- `channels.discord.voice.connectTimeoutMs` は、`/vc join` と自動参加試行での初期 `@discordjs/voice` Ready 待機を制御する (デフォルトは `30000`)。
- `channels.discord.voice.reconnectGraceMs` は、切断された音声セッションが再接続シグナリングに入るまでに許容される時間を制御する。超過すると OpenClaw が破棄する (デフォルトは `15000`)。
- OpenClaw はさらに、復号失敗の繰り返し後に音声セッションから退出/再参加することで、音声受信の復旧を試みる。
- `channels.discord.streaming` は正規のストリームモードキー。レガシーの `streamMode` と真偽値の `streaming` は自動移行される。
- `channels.discord.autoPresence` はランタイム可用性をボットプレゼンスにマッピングし (healthy => online、degraded => idle、exhausted => dnd)、任意のステータステキスト上書きを許可する。
- `channels.discord.dangerouslyAllowNameMatching` は、可変の名前/タグ照合を再有効化する (緊急回避用互換モード)。
- `channels.discord.execApprovals`: Discord ネイティブの exec 承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"` (デフォルト)。自動モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効化される。
  - `approvers`: exec リクエストの承認を許可された Discord ユーザー ID。省略時は `commands.ownerAllowFrom` にフォールバックする。
  - `agentFilter`: 任意のエージェント ID 許可リスト。省略するとすべてのエージェントの承認を転送する。
  - `sessionFilter`: 任意のセッションキー パターン (部分文字列または正規表現)。
  - `target`: 承認プロンプトの送信先。`"dm"` (デフォルト) は承認者の DM に送信し、`"channel"` は送信元チャンネルに送信し、`"both"` は両方に送信する。ターゲットに `"channel"` が含まれる場合、ボタンは解決済み承認者のみが使用できる。
  - `cleanupAfterResolve`: `true` の場合、承認、拒否、またはタイムアウト後に承認 DM を削除する。

**リアクション通知モード:** `off` (なし)、`own` (ボットのメッセージ、デフォルト)、`all` (すべてのメッセージ)、`allowlist` (`guilds.<id>.users` 由来、すべてのメッセージ)。

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
- サービスアカウント SecretRef もサポートされる (`serviceAccountRef`)。
- 環境変数フォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信ターゲットには `spaces/<spaceId>` または `users/<userId>` を使用する。
- `channels.googlechat.dangerouslyAllowNameMatching` は、可変のメールプリンシパル照合を再有効化する (緊急回避用互換モード)。

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

- **ソケットモード** には `botToken` と `appToken` の両方が必要 (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` はデフォルトアカウントの環境変数フォールバック)。
- **HTTP モード** には `botToken` に加えて `signingSecret` が必要 (ルートまたはアカウントごと)。
- `socketMode` は Slack SDK Socket Mode トランスポートのチューニングを、公開 Bolt レシーバー API にそのまま渡す。ping/pong タイムアウトまたは古い websocket 動作を調査するときにのみ使用する。
- `botToken`、`appToken`、`signingSecret`、`userToken` はプレーンテキスト
  文字列または SecretRef オブジェクトを受け入れる。
- Slack アカウントスナップショットは、`botTokenSource`、`botTokenStatus`、`appTokenStatus`、および HTTP モードでの
  `signingSecretStatus` など、認証情報ごとのソース/ステータスフィールドを公開する。`configured_unavailable` は、そのアカウントが
  SecretRef 経由で設定されているが、現在のコマンド/ランタイムパスでは
  シークレット値を解決できなかったことを意味する。
- `configWrites: false` は Slack 起点の設定書き込みをブロックする。
- 任意の `channels.slack.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウントの選択を上書きする。
- `channels.slack.streaming.mode` は正規の Slack ストリームモードキー。`channels.slack.streaming.nativeTransport` は Slack のネイティブストリーミングトランスポートを制御する。レガシーの `streamMode`、真偽値の `streaming`、および `nativeStreaming` の値は自動移行される。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` を使用する。

**リアクション通知モード:** `off`、`own` (デフォルト)、`all`、`allowlist` (`reactionAllowlist` 由来)。

**スレッドセッション分離:** `thread.historyScope` はスレッドごと (デフォルト)、またはチャンネル全体で共有。`thread.inheritParent` は親チャンネルのトランスクリプトを新しいスレッドにコピーする。

- Slack ネイティブストリーミングと Slack アシスタント風の「入力中...」スレッドステータスには、返信スレッドターゲットが必要。トップレベルの DM はデフォルトでスレッド外のままなので、スレッド形式のネイティブストリーム/ステータスプレビューを表示する代わりに、Slack のドラフト投稿および編集プレビューを通じてストリーミングできる。
- `typingReaction` は、返信の実行中に受信 Slack メッセージへ一時的なリアクションを追加し、完了時に削除する。`"hourglass_flowing_sand"` のような Slack 絵文字ショートコードを使用する。
- `channels.slack.execApprovals`: Slack ネイティブの exec 承認配信と承認者認可。Discord と同じスキーマ: `enabled` (`true`/`false`/`"auto"`)、`approvers` (Slack ユーザー ID)、`agentFilter`、`sessionFilter`、および `target` (`"dm"`、`"channel"`、または `"both"`)。

| アクショングループ | デフォルト | 注記                   |
| ------------ | ------- | ---------------------- |
| reactions    | enabled | リアクションを追加 + 一覧表示 |
| messages     | enabled | 読み取り/送信/編集/削除 |
| pins         | enabled | ピン留め/ピン解除/一覧表示 |
| memberInfo   | enabled | メンバー情報           |
| emojiList    | enabled | カスタム絵文字一覧     |

### Mattermost

Mattermost は現在の OpenClaw リリースではバンドル Plugin として提供される。古いビルドまたは
カスタムビルドでは、`openclaw plugins install @openclaw/mattermost` で現在の npm パッケージをインストールできる。バージョンを固定する前に
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
で現在の dist-tag を確認する。

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

チャットモード: `oncall` (@メンション時に応答、デフォルト)、`onmessage` (すべてのメッセージ)、`onchar` (トリガープレフィックスで始まるメッセージ)。

Mattermost ネイティブコマンドが有効な場合:

- `commands.callbackPath` は完全な URL ではなく、パス（例: `/api/channels/mattermost/command`）でなければなりません。
- `commands.callbackUrl` は OpenClaw Gateway エンドポイントに解決され、Mattermost サーバーから到達可能でなければなりません。
- ネイティブのスラッシュコールバックは、スラッシュコマンド登録時に Mattermost から返されるコマンドごとのトークンで認証されます。登録に失敗した場合、または有効化されたコマンドがない場合、OpenClaw はコールバックを `Unauthorized: invalid command token.` で拒否します。
- プライベート/tailnet/内部コールバックホストでは、Mattermost の `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックホスト/ドメインを含める必要がある場合があります。完全な URL ではなく、ホスト/ドメイン値を使用してください。
- `channels.mattermost.configWrites`: Mattermost が開始した設定書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャンネルで返信する前に `@mention` を必須にします。
- `channels.mattermost.groups.<channelId>.requireMention`: チャンネルごとのメンションゲート上書き（デフォルトは `"*"`）。
- 任意の `channels.mattermost.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトのアカウント選択を上書きします。

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

**リアクション通知モード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` 由来）。

- `channels.signal.account`: チャンネル起動を特定の Signal アカウント ID に固定します。
- `channels.signal.configWrites`: Signal が開始した設定書き込みを許可または拒否します。
- 任意の `channels.signal.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトのアカウント選択を上書きします。

### BlueBubbles

BlueBubbles は推奨される iMessage 経路です（Plugin 裏付けで、`channels.bluebubbles` の下に設定します）。

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
- 任意の `channels.bluebubbles.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトのアカウント選択を上書きします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、BlueBubbles の会話を永続 ACP セッションにバインドできます。`match.peer.id` には BlueBubbles ハンドルまたはターゲット文字列（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共有フィールドのセマンティクス: [ACP Agents](/ja-JP/tools/acp-agents#persistent-channel-bindings)。
- BlueBubbles チャンネルの完全な設定は [BlueBubbles](/ja-JP/channels/bluebubbles) に記載されています。

### iMessage

OpenClaw は `imsg rpc`（stdio 経由の JSON-RPC）を起動します。デーモンやポートは不要です。

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

- 任意の `channels.imessage.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトのアカウント選択を上書きします。

- Messages DB へのフルディスクアクセスが必要です。
- `chat_id:<id>` ターゲットを優先してください。チャット一覧を表示するには `imsg chats --limit 20` を使用します。
- `cliPath` は SSH ラッパーを指すことができます。SCP 添付ファイル取得用に `remoteHost`（`host` または `user@host`）を設定します。
- `attachmentRoots` と `remoteAttachmentRoots` は、受信添付ファイルのパスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCP は厳密なホストキー検証を使用するため、リレーホストキーがすでに `~/.ssh/known_hosts` に存在することを確認してください。
- `channels.imessage.configWrites`: iMessage が開始した設定書き込みを許可または拒否します。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、iMessage の会話を永続 ACP セッションにバインドできます。`match.peer.id` には正規化済みハンドルまたは明示的なチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共有フィールドのセマンティクス: [ACP Agents](/ja-JP/tools/acp-agents#persistent-channel-bindings)。

<Accordion title="iMessage SSH wrapper example">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix は Plugin 裏付けで、`channels.matrix` の下に設定します。

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
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` はプライベート/内部 homeserver を許可します。`proxy` とこのネットワークのオプトインは独立した制御です。
- `channels.matrix.defaultAccount` は、複数アカウント構成で優先アカウントを選択します。
- `channels.matrix.autoJoin` のデフォルトは `off` です。そのため、招待されたルームや新しい DM 形式の招待は、`autoJoinAllowlist` 付きの `autoJoin: "allowlist"` または `autoJoin: "always"` を設定するまで無視されます。
- `channels.matrix.execApprovals`: Matrix ネイティブの exec 承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。auto モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効になります。
  - `approvers`: exec リクエストの承認を許可された Matrix ユーザー ID（例: `@owner:example.org`）。
  - `agentFilter`: 任意のエージェント ID 許可リスト。省略すると、すべてのエージェントの承認を転送します。
  - `sessionFilter`: 任意のセッションキーパターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）、`"channel"`（発信元ルーム）、または `"both"`。
  - アカウントごとの上書き: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` は、Matrix DM をセッションにグループ化する方法を制御します。`per-user`（デフォルト）はルーティングされたピアで共有し、`per-room` は各 DM ルームを分離します。
- Matrix ステータスプローブとライブディレクトリ検索は、ランタイムトラフィックと同じプロキシポリシーを使用します。
- Matrix の完全な設定、ターゲティングルール、セットアップ例は [Matrix](/ja-JP/channels/matrix) に記載されています。

### Microsoft Teams

Microsoft Teams は Plugin 裏付けで、`channels.msteams` の下に設定します。

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
- Teams の完全な設定（認証情報、Webhook、DM/グループポリシー、チームごと/チャンネルごとの上書き）は [Microsoft Teams](/ja-JP/channels/msteams) に記載されています。

### IRC

IRC は Plugin 裏付けで、`channels.irc` の下に設定します。

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
- 任意の `channels.irc.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトのアカウント選択を上書きします。
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
- 各アカウントを別のエージェントにルーティングするには `bindings[].match.accountId` を使用します。
- 単一アカウントのトップレベルチャンネル設定のまま `openclaw channels add`（またはチャンネルのオンボーディング）で非デフォルトアカウントを追加すると、OpenClaw はまずアカウントスコープのトップレベル単一アカウント値をチャンネルアカウントマップに昇格し、元のアカウントが引き続き動作するようにします。ほとんどのチャンネルでは、それらを `channels.<channel>.accounts.default` に移動します。Matrix は、既存の一致する名前付き/デフォルトターゲットを代わりに保持できます。
- 既存のチャンネルのみのバインディング（`accountId` なし）は、引き続きデフォルトアカウントに一致します。アカウントスコープのバインディングは引き続き任意です。
- `openclaw doctor --fix` も、アカウントスコープのトップレベル単一アカウント値を、そのチャンネル用に選択された昇格済みアカウントへ移動することで混在した形を修復します。ほとんどのチャンネルでは `accounts.default` を使用します。Matrix は、既存の一致する名前付き/デフォルトターゲットを代わりに保持できます。

### その他の Plugin チャンネル

多くの Plugin チャンネルは `channels.<id>` として設定され、それぞれ専用のチャンネルページに記載されています（例: Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch）。
完全なチャンネル一覧を参照してください: [チャンネル](/ja-JP/channels)。

### グループチャットのメンションゲート

グループメッセージのデフォルトは **メンション必須**（メタデータメンションまたは安全な正規表現パターン）です。WhatsApp、Telegram、Discord、Google Chat、iMessage のグループチャットに適用されます。

表示される返信は別に制御されます。グループ/チャンネルルームのデフォルトは `messages.groupChat.visibleReplies: "message_tool"` です。OpenClaw は引き続きターンを処理しますが、通常の最終返信はプライベートのままで、ルームに表示される出力には `message(action=send)` が必要です。通常の返信をルームへ投稿する従来の動作が必要な場合にのみ `"automatic"` を設定してください。同じツールのみの表示返信動作を直接チャットにも適用するには、`messages.visibleReplies: "message_tool"` を設定します。Codex ハーネスも、未設定の直接チャットのデフォルトとしてこのツールのみの動作を使用します。

アクティブなツールポリシーの下で message tool が利用できない場合、OpenClaw は応答を黙って抑制する代わりに、自動の表示返信にフォールバックします。`openclaw doctor` はこの不一致について警告します。

Gateway は、ファイル保存後に `messages` 設定をホットリロードします。デプロイでファイル監視または設定リロードが無効な場合にのみ再起動してください。

**メンションタイプ:**

- **メタデータメンション**: ネイティブプラットフォームの @-mention。WhatsApp のセルフチャットモードでは無視されます。
- **テキストパターン**: `agents.list[].groupChat.mentionPatterns` 内の安全な正規表現パターン。無効なパターンと安全でない入れ子反復は無視されます。
- メンションゲートは、検出が可能な場合（ネイティブメンション、または少なくとも 1 つのパターン）にのみ適用されます。

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

`messages.visibleReplies` はグローバルなソースターンのデフォルトです。`messages.groupChat.visibleReplies` はグループ/チャンネルのソースターンでこれを上書きします。`messages.visibleReplies` が未設定の場合、ハーネスは独自のダイレクト/ソースのデフォルトを提供できます。Codex ハーネスのデフォルトは `message_tool` です。チャンネル許可リストとメンションゲートは、ターンを処理するかどうかを引き続き決定します。

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

対応: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### セルフチャットモード

セルフチャットモードを有効にするには、自分の番号を `allowFrom` に含めます（ネイティブの @メンションを無視し、テキストパターンのみに応答します）。

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

- このブロックはコマンドサーフェスを設定します。現在の組み込み + 同梱コマンドカタログについては、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。
- このページは**設定キーのリファレンス**であり、完全なコマンドカタログではありません。QQ Bot `/bot-ping` `/bot-help` `/bot-logs`、LINE `/card`、デバイスペアリング `/pair`、メモリ `/dreaming`、電話制御 `/phone`、Talk `/voice` など、チャンネル/Plugin が所有するコマンドは、それぞれのチャンネル/Plugin ページと[スラッシュコマンド](/ja-JP/tools/slash-commands)で説明されています。
- テキストコマンドは、先頭に `/` が付いた**単独の**メッセージである必要があります。
- `native: "auto"` は Discord/Telegram のネイティブコマンドを有効にし、Slack はオフのままにします。
- `nativeSkills: "auto"` は Discord/Telegram のネイティブ Skills コマンドを有効にし、Slack はオフのままにします。
- チャンネル単位で上書き: `channels.discord.commands.native`（bool または `"auto"`）。`false` は以前に登録されたコマンドを消去します。
- ネイティブ Skills 登録をチャンネル単位で上書きするには、`channels.<provider>.commands.nativeSkills` を使用します。
- `channels.telegram.customCommands` は追加の Telegram bot メニュー項目を追加します。
- `bash: true` はホストシェル用に `! <cmd>` を有効にします。`tools.elevated.enabled` と、送信者が `tools.elevated.allowFrom.<channel>` に含まれていることが必要です。
- `config: true` は `/config`（`openclaw.json` の読み取り/書き込み）を有効にします。Gateway `chat.send` クライアントの場合、永続的な `/config set|unset` 書き込みには `operator.admin` も必要です。読み取り専用の `/config show` は、通常の書き込みスコープ付き operator クライアントでも引き続き利用できます。
- `mcp: true` は、`mcp.servers` 配下の OpenClaw 管理 MCP サーバー設定用に `/mcp` を有効にします。
- `plugins: true` は、Plugin の検出、インストール、有効化/無効化コントロール用に `/plugins` を有効にします。
- `channels.<provider>.configWrites` はチャンネル単位で設定変更を制御します（デフォルト: true）。
- 複数アカウントのチャンネルでは、`channels.<provider>.accounts.<id>.configWrites` も、そのアカウントを対象とする書き込みを制御します（例: `/allowlist --config --account <id>` または `/config set channels.<provider>.accounts.<id>...`）。
- `restart: false` は `/restart` と Gateway 再起動ツールアクションを無効にします。デフォルト: `true`。
- `ownerAllowFrom` は owner 専用コマンド/ツール向けの明示的な owner 許可リストです。`allowFrom` とは別です。
- `ownerDisplay: "hash"` はシステムプロンプト内の owner ID をハッシュ化します。ハッシュ化を制御するには `ownerDisplaySecret` を設定します。
- `allowFrom` はプロバイダー単位です。設定すると、これが**唯一の**認可ソースになります（チャンネル許可リスト/ペアリングと `useAccessGroups` は無視されます）。
- `useAccessGroups: false` は、`allowFrom` が設定されていない場合に、コマンドがアクセスグループポリシーをバイパスできるようにします。
- コマンドドキュメントマップ:
  - 組み込み + 同梱カタログ: [スラッシュコマンド](/ja-JP/tools/slash-commands)
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
