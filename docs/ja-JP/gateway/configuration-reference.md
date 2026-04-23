---
read_when:
    - 正確なフィールド単位のconfigの意味やデフォルトが必要です
    - チャネル、model、Gateway、またはtoolのconfigブロックを検証しています
summary: core OpenClawキー、デフォルト、および各サブシステム専用リファレンスへのリンクのためのGateway設定リファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-04-23T14:03:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75c7e0d88ea6eacb8a2dd41f83033da853130dc2a689950c1a188d7c4ca8f977
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# 設定リファレンス

`~/.openclaw/openclaw.json` のcore configリファレンスです。タスク指向の概要については [Configuration](/ja-JP/gateway/configuration) を参照してください。

このページでは、主要なOpenClaw configサーフェスを扱い、各サブシステムにより深い専用リファレンスがある場合はそこへリンクします。1ページの中に、チャネル/Plugin所有のすべてのコマンドカタログや、memory/QMDのすべての細かなノブを**無理にインライン化することはしません**。

コード上の信頼できる情報源:

- `openclaw config schema` は、検証とControl UIで使われるライブJSON Schemaを出力します。利用可能な場合はバンドル/Plugin/チャネルのメタデータもマージされます
- `config.schema.lookup` は、ドリルダウンツール向けに1つのpathスコープschema nodeを返します
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、現在のschema surfaceに対してconfig-doc baseline hashを検証します

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および `plugins.entries.memory-core.config.dreaming` 配下のDreaming configについては [Memory configuration reference](/ja-JP/reference/memory-config)
- 現在の組み込み + バンドル済みコマンドカタログについては [Slash Commands](/ja-JP/tools/slash-commands)
- チャネル固有のコマンドサーフェスについては各チャネル/Pluginページ

config形式は **JSON5** です（コメント + 末尾カンマを許可）。すべてのフィールドは任意で、省略時はOpenClawが安全なデフォルトを使用します。

---

## チャネル

各チャネルは、そのconfigセクションが存在すれば自動的に開始されます（`enabled: false` の場合を除く）。

### DMとグループアクセス

すべてのチャネルはDMポリシーとグループポリシーをサポートします。

| DM policy           | 動作 |
| ------------------- | ---- |
| `pairing`（デフォルト） | 不明な送信者にワンタイムのペアリングコードを送信し、オーナーが承認する必要があります |
| `allowlist`         | `allowFrom` 内の送信者のみ許可されます（またはペアリング許可ストア） |
| `open`              | すべての受信DMを許可します（`allowFrom: ["*"]` が必要） |
| `disabled`          | すべての受信DMを無視します |

| Group policy          | 動作 |
| --------------------- | ---- |
| `allowlist`（デフォルト） | 設定済みallowlistに一致するグループのみ許可します |
| `open`                | グループallowlistをバイパスします（メンションゲーティングは引き続き適用） |
| `disabled`            | すべてのグループ/ルームメッセージをブロックします |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が未設定のときのデフォルトを設定します。
ペアリングコードは1時間で期限切れになります。保留中のDMペアリングリクエストは **チャネルごとに3件まで** です。
プロバイダーブロックが完全に存在しない場合（`channels.<provider>` がない場合）、ランタイムのグループポリシーは起動時警告付きで `allowlist` にフォールバックします（fail-closed）。
</Note>

### チャネルごとのmodel上書き

特定のチャネルIDをmodelに固定するには `channels.modelByChannel` を使用します。値には `provider/model` または設定済みmodel aliasを指定できます。チャネルマッピングは、セッションにすでにmodel上書きがない場合（たとえば `/model` で設定された場合など）に適用されます。

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

### チャネルデフォルトとHeartbeat

プロバイダー間で共有するグループポリシーとHeartbeat動作には `channels.defaults` を使用します。

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

- `channels.defaults.groupPolicy`: プロバイダーレベルの `groupPolicy` が未設定のときのフォールバックグループポリシー。
- `channels.defaults.contextVisibility`: 全チャネル共通の補足コンテキスト可視性モードのデフォルト。値: `all`（デフォルト。引用/スレッド/履歴コンテキストをすべて含む）、`allowlist`（allowlist済み送信者からのコンテキストのみ含む）、`allowlist_quote`（allowlistと同じだが明示的な引用/返信コンテキストは保持）。チャネルごとの上書き: `channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`: 正常なチャネルステータスをHeartbeat出力に含めます。
- `channels.defaults.heartbeat.showAlerts`: 劣化/エラーステータスをHeartbeat出力に含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケータ形式のHeartbeat出力を表示します。

### WhatsApp

WhatsAppはGatewayのwebチャネル（Baileys Web）経由で動作します。リンク済みセッションが存在すると自動的に開始されます。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // 既読マーク（self-chat modeではfalse）
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

<Accordion title="複数アカウントのWhatsApp">

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

- 送信コマンドは、`default` アカウントが存在すればそれを使い、なければ最初に設定されたアカウントid（ソート順）を使います。
- 任意の `channels.whatsapp.defaultAccount` は、設定済みアカウントidに一致する場合、このフォールバックのデフォルトアカウント選択を上書きします。
- 旧式の単一アカウントBaileys auth dirは `openclaw doctor` により `whatsapp/default` に移行されます。
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
      streaming: "partial", // off | partial | block | progress（デフォルト: off。プレビュー編集のレート制限を避けるため明示的にopt in）
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

- Bot token: `channels.telegram.botToken` または `channels.telegram.tokenFile`（通常ファイルのみ。シンボリックリンクは拒否）、defaultアカウントでは `TELEGRAM_BOT_TOKEN` がフォールバックです。
- 任意の `channels.telegram.defaultAccount` は、設定済みアカウントidに一致する場合、デフォルトアカウント選択を上書きします。
- 複数アカウント構成（2個以上のアカウントid）では、フォールバックルーティングを避けるために明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定してください。これが欠けているか無効な場合、`openclaw doctor` が警告します。
- `configWrites: false` は、Telegram起点のconfig書き込み（supergroup ID移行、`/config set|unset`）をブロックします。
- `type: "acp"` を持つトップレベル `bindings[]` エントリは、forum topic用の永続ACPバインディングを設定します（`match.peer.id` には正規化された `chatId:topic:topicId` を使用）。フィールドの意味は [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) と共通です。
- Telegramのストリームプレビューは `sendMessage` + `editMessageText` を使用します（DMとグループチャットの両方で動作）。
- Retry policy: [Retry policy](/ja-JP/concepts/retry) を参照。

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
      streaming: "off", // off | partial | block | progress（progressはDiscordではpartialにマップされます）
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
        spawnSubagentSessions: false, // sessions_spawn({ thread: true }) のopt-in
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

- Token: `channels.discord.token`。defaultアカウントのフォールバックとして `DISCORD_BOT_TOKEN` を使用します。
- 明示的なDiscord `token` を指定した直接送信呼び出しは、その呼び出しにそのtokenを使用します。アカウントのretry/policy設定は、アクティブなランタイムスナップショットで選択されたアカウントから引き続き取得されます。
- 任意の `channels.discord.defaultAccount` は、設定済みアカウントidに一致する場合、デフォルトアカウント選択を上書きします。
- 配信ターゲットには `user:<id>`（DM）または `channel:<id>`（guildチャネル）を使用します。数値IDのみの指定は拒否されます。
- guild slugは小文字で、スペースは `-` に置き換えられます。チャネルキーはslug化された名前（`#` なし）を使用します。guild IDを優先してください。
- bot作成メッセージはデフォルトで無視されます。`allowBots: true` で有効になります。botにメンションしたbotメッセージのみを受け入れるには `allowBots: "mentions"` を使用してください（自分自身のメッセージは引き続き除外されます）。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（およびチャネル上書き）は、他のユーザーまたはロールにメンションしていてbotにはメンションしていないメッセージを破棄します（@everyone/@here は除く）。
- `maxLinesPerMessage`（デフォルト 17）は、2000文字未満でも行数が多いメッセージを分割します。
- `channels.discord.threadBindings` は、Discordのスレッドバインド済みルーティングを制御します:
  - `enabled`: スレッドバインド済みセッション機能（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびバインド済み配信/ルーティング）のDiscord上書き
  - `idleHours`: 非アクティブ時の自動unfocusまでの時間のDiscord上書き（時間単位、`0` で無効）
  - `maxAgeHours`: 強制最大有効期間のDiscord上書き（時間単位、`0` で無効）
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` による自動スレッド作成/バインドのopt-inスイッチ
- `type: "acp"` を持つトップレベル `bindings[]` エントリは、チャネルとスレッドの永続ACPバインディングを設定します（`match.peer.id` にチャネル/スレッドidを使用）。フィールドの意味は [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) と共通です。
- `channels.discord.ui.components.accentColor` は、Discord components v2コンテナーのアクセントカラーを設定します。
- `channels.discord.voice` は、Discord voiceチャネル会話と、任意の自動参加 + TTS上書きを有効にします。
- `channels.discord.voice.daveEncryption` と `channels.discord.voice.decryptionFailureTolerance` は、`@discordjs/voice` のDAVEオプションにそのまま渡されます（デフォルトは `true` と `24`）。
- OpenClawはさらに、復号失敗が繰り返された後にvoiceセッションから退出/再参加することで、voice受信の回復も試みます。
- `channels.discord.streaming` は正規のストリームモードキーです。旧式の `streamMode` と真偽値の `streaming` は自動移行されます。
- `channels.discord.autoPresence` はランタイム可用性をbot presenceにマップします（正常 => online、劣化 => idle、exhausted => dnd）。任意のステータステキスト上書きも可能です。
- `channels.discord.dangerouslyAllowNameMatching` は、可変な名前/tag一致を再有効化します（緊急用互換モード）。
- `channels.discord.execApprovals`: Discordネイティブのexec承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。autoモードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合にexec承認が有効になります。
  - `approvers`: execリクエストを承認できるDiscord user ID。省略時は `commands.ownerAllowFrom` にフォールバックします。
  - `agentFilter`: 任意のagent ID許可リスト。すべてのagentの承認を転送する場合は省略します。
  - `sessionFilter`: 任意のセッションキーのパターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）は承認者のDMへ送信し、`"channel"` は元のチャネルへ送信し、`"both"` は両方へ送信します。targetに `"channel"` が含まれる場合、ボタンを使えるのは解決済み承認者のみです。
  - `cleanupAfterResolve`: `true` の場合、承認・拒否・タイムアウト後に承認DMを削除します。

**Reaction notificationモード:** `off`（なし）、`own`（bot自身のメッセージ、デフォルト）、`all`（すべてのメッセージ）、`allowlist`（全メッセージ中の `guilds.<id>.users` から）。

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

- Service account JSON: インライン（`serviceAccount`）またはファイルベース（`serviceAccountFile`）。
- Service account SecretRef（`serviceAccountRef`）もサポートされます。
- 環境変数フォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信ターゲットには `spaces/<spaceId>` または `users/<userId>` を使用します。
- `channels.googlechat.dangerouslyAllowNameMatching` は、可変なemail principal一致を再有効化します（緊急用互換モード）。

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
        nativeTransport: true, // mode=partial のときSlackネイティブストリーミングAPIを使う
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

- **Socket mode** には `botToken` と `appToken` の両方が必要です（defaultアカウントの環境変数フォールバックは `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP mode** には `botToken` に加えて `signingSecret` が必要です（ルートまたはアカウントごと）。
- `botToken`、`appToken`、`signingSecret`、`userToken` はプレーンテキスト
  文字列またはSecretRefオブジェクトを受け付けます。
- Slackアカウントスナップショットは、認証情報ごとのsource/statusフィールド
  （`botTokenSource`、`botTokenStatus`、`appTokenStatus`、HTTP modeでは
  `signingSecretStatus` など）を公開します。`configured_unavailable` は、そのアカウントが
  SecretRef経由で設定されているが、現在のコマンド/ランタイム経路では
  シークレット値を解決できなかったことを意味します。
- `configWrites: false` はSlack起点のconfig書き込みをブロックします。
- 任意の `channels.slack.defaultAccount` は、設定済みアカウントidに一致する場合、デフォルトアカウント選択を上書きします。
- `channels.slack.streaming.mode` は正規のSlackストリームモードキーです。`channels.slack.streaming.nativeTransport` はSlackのネイティブストリーミング転送を制御します。旧式の `streamMode`、真偽値の `streaming`、および `nativeStreaming` は自動移行されます。
- 配信ターゲットには `user:<id>`（DM）または `channel:<id>` を使用します。

**Reaction notificationモード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` から）。

**スレッドセッション分離:** `thread.historyScope` はスレッド単位（デフォルト）またはチャネル共有です。`thread.inheritParent` は親チャネルのtranscriptを新しいスレッドにコピーします。

- Slackネイティブストリーミングと、Slack assistant形式の「is typing...」スレッドステータスには返信スレッドターゲットが必要です。最上位DMはデフォルトでスレッド外のままなので、スレッド形式のプレビューの代わりに `typingReaction` または通常配信を使用します。
- `typingReaction` は、返信実行中に受信したSlackメッセージへ一時的なリアクションを追加し、完了時に削除します。`"hourglass_flowing_sand"` のようなSlack絵文字ショートコードを使ってください。
- `channels.slack.execApprovals`: Slackネイティブのexec承認配信と承認者認可。スキーマはDiscordと同じです: `enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack user ID）、`agentFilter`、`sessionFilter`、`target`（`"dm"`、`"channel"`、または `"both"`）。

| Action group | Default | 注記 |
| ------------ | ------- | ---- |
| reactions    | enabled | リアクション + リアクション一覧 |
| messages     | enabled | 読み取り/送信/編集/削除 |
| pins         | enabled | ピン留め/解除/一覧 |
| memberInfo   | enabled | メンバー情報 |
| emojiList    | enabled | カスタム絵文字一覧 |

### Mattermost

MattermostはPluginとして提供されます: `openclaw plugins install @openclaw/mattermost`。

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
        // リバースプロキシ/公開デプロイ向けの任意の明示URL
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

チャットモード: `oncall`（@メンションで応答、デフォルト）、`onmessage`（すべてのメッセージ）、`onchar`（トリガー接頭辞で始まるメッセージ）。

Mattermostネイティブコマンドが有効な場合:

- `commands.callbackPath` はフルURLではなくパスである必要があります（例: `/api/channels/mattermost/command`）。
- `commands.callbackUrl` はOpenClaw Gatewayエンドポイントに解決され、Mattermostサーバーから到達可能である必要があります。
- ネイティブスラッシュcallbackは、Mattermostがスラッシュコマンド登録時に返すコマンド単位のtokenで認証されます。登録に失敗した場合、またはコマンドが1つも有効化されなかった場合、OpenClawはcallbackを
  `Unauthorized: invalid command token.` で拒否します。
- プライベート/tailnet/internalのcallback hostでは、Mattermost側で
  `ServiceSettings.AllowedUntrustedInternalConnections` にcallback host/domainを含める必要がある場合があります。
  フルURLではなくhost/domain値を使用してください。
- `channels.mattermost.configWrites`: Mattermost起点のconfig書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャネルで返信する前に `@mention` を必須にします。
- `channels.mattermost.groups.<channelId>.requireMention`: チャネルごとのメンションゲーティング上書き（デフォルトには `"*"`）。
- 任意の `channels.mattermost.defaultAccount` は、設定済みアカウントidに一致する場合、デフォルトアカウント選択を上書きします。

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // 任意のアカウントバインディング
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

**Reaction notificationモード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` から）。

- `channels.signal.account`: チャネル起動を特定のSignalアカウントIDに固定します。
- `channels.signal.configWrites`: Signal起点のconfig書き込みを許可または拒否します。
- 任意の `channels.signal.defaultAccount` は、設定済みアカウントidに一致する場合、デフォルトアカウント選択を上書きします。

### BlueBubbles

BlueBubblesは推奨されるiMessage経路です（Pluginバックで、`channels.bluebubbles` 配下に設定します）。

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

- ここで扱うcoreキーのパス: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`。
- 任意の `channels.bluebubbles.defaultAccount` は、設定済みアカウントidに一致する場合、デフォルトアカウント選択を上書きします。
- `type: "acp"` を持つトップレベル `bindings[]` エントリは、BlueBubbles会話を永続ACPセッションにバインドできます。`match.peer.id` にはBlueBubbles handleまたはtarget文字列（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共通フィールドの意味: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。
- 完全なBlueBubblesチャネル設定は [BlueBubbles](/ja-JP/channels/bluebubbles) に記載されています。

### iMessage

OpenClawは `imsg rpc`（stdio経由のJSON-RPC）を起動します。daemonやportは不要です。

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

- 任意の `channels.imessage.defaultAccount` は、設定済みアカウントidに一致する場合、デフォルトアカウント選択を上書きします。

- Messages DBへのフルディスクアクセスが必要です。
- `chat_id:<id>` ターゲットを優先してください。チャット一覧は `imsg chats --limit 20` を使用します。
- `cliPath` はSSHラッパーを指すことができます。SCPで添付ファイルを取得するには `remoteHost`（`host` または `user@host`）を設定してください。
- `attachmentRoots` と `remoteAttachmentRoots` は受信添付ファイルのパスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCPは厳格なhost-key checkingを使用するため、relay host keyがすでに `~/.ssh/known_hosts` に存在していることを確認してください。
- `channels.imessage.configWrites`: iMessage起点のconfig書き込みを許可または拒否します。
- `type: "acp"` を持つトップレベル `bindings[]` エントリは、iMessage会話を永続ACPセッションにバインドできます。`match.peer.id` には正規化されたhandleまたは明示的なチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共通フィールドの意味: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。

<Accordion title="iMessage SSHラッパーの例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

MatrixはPluginバックで、`channels.matrix` 配下に設定します。

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

- token認証は `accessToken` を使用し、password認証は `userId` + `password` を使用します。
- `channels.matrix.proxy` はMatrix HTTPトラフィックを明示的なHTTP(S) proxy経由にします。名前付きアカウントでは `channels.matrix.accounts.<id>.proxy` で上書きできます。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` は、プライベート/内部homeserverを許可します。`proxy` とこのnetwork opt-inは独立した制御です。
- `channels.matrix.defaultAccount` は、複数アカウント構成で優先アカウントを選択します。
- `channels.matrix.autoJoin` のデフォルトは `off` なので、招待されたroomや新しいDM形式の招待は、`autoJoin: "allowlist"` と `autoJoinAllowlist`、または `autoJoin: "always"` を設定するまで無視されます。
- `channels.matrix.execApprovals`: Matrixネイティブのexec承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。autoモードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合にexec承認が有効になります。
  - `approvers`: execリクエストを承認できるMatrix user ID（例: `@owner:example.org`）。
  - `agentFilter`: 任意のagent ID許可リスト。すべてのagentの承認を転送する場合は省略します。
  - `sessionFilter`: 任意のセッションキーのパターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）、`"channel"`（元のroom）、または `"both"`。
  - アカウントごとの上書き: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` は、Matrix DMをどのようにセッションへまとめるかを制御します: `per-user`（デフォルト）はルーティング先peerごとに共有し、`per-room` は各DM roomを分離します。
- Matrixのstatus probeとライブdirectory lookupは、ランタイムトラフィックと同じproxyポリシーを使用します。
- 完全なMatrix設定、ターゲット指定ルール、セットアップ例は [Matrix](/ja-JP/channels/matrix) に記載されています。

### Microsoft Teams

Microsoft TeamsはPluginバックで、`channels.msteams` 配下に設定します。

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

- ここで扱うcoreキーのパス: `channels.msteams`, `channels.msteams.configWrites`。
- 完全なTeams設定（認証情報、Webhook、DM/groupポリシー、team/チャネルごとの上書き）は [Microsoft Teams](/ja-JP/channels/msteams) に記載されています。

### IRC

IRCはPluginバックで、`channels.irc` 配下に設定します。

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

- ここで扱うcoreキーのパス: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`。
- 任意の `channels.irc.defaultAccount` は、設定済みアカウントidに一致する場合、デフォルトアカウント選択を上書きします。
- 完全なIRCチャネル設定（host/port/TLS/channels/allowlists/mention gating）は [IRC](/ja-JP/channels/irc) に記載されています。

### 複数アカウント（全チャネル）

チャネルごとに複数アカウントを実行できます（それぞれ独自の `accountId` を持ちます）。

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

- `accountId` を省略した場合は `default` が使用されます（CLI + ルーティング）。
- 環境変数tokenは **default** アカウントにのみ適用されます。
- ベースのチャネル設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- 各アカウントを異なるagentにルーティングするには `bindings[].match.accountId` を使用します。
- 単一アカウントのトップレベルチャネルconfigのまま `openclaw channels add`（またはチャネルオンボーディング）で非defaultアカウントを追加すると、OpenClawはまずアカウントスコープのトップレベル単一アカウント値をチャネルのaccount mapへ昇格させ、元のアカウントが引き続き動作するようにします。多くのチャネルではそれらを `channels.<channel>.accounts.default` に移動します。Matrixでは、既存の一致する名前付き/defaultターゲットを代わりに保持できます。
- 既存のチャネルのみのバインディング（`accountId` なし）は、引き続きdefaultアカウントに一致します。アカウントスコープのバインディングは任意のままです。
- `openclaw doctor --fix` も、アカウントスコープのトップレベル単一アカウント値を、そのチャネル用に選ばれた昇格先アカウントへ移動することで、混在した形状を修復します。多くのチャネルでは `accounts.default` を使用し、Matrixでは既存の一致する名前付き/defaultターゲットを保持できます。

### その他のPluginチャネル

多くのPluginチャネルは `channels.<id>` として設定され、それぞれ専用のチャネルページに記載されています（例: Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch）。
完全なチャネル一覧は [Channels](/ja-JP/channels) を参照してください。

### グループチャットのメンションゲーティング

グループメッセージはデフォルトで **メンション必須** です（メタデータメンションまたは安全な正規表現パターン）。WhatsApp、Telegram、Discord、Google Chat、iMessageのグループチャットに適用されます。

**メンション種別:**

- **メタデータメンション**: ネイティブプラットフォームの@メンション。WhatsAppのself-chat modeでは無視されます。
- **テキストパターン**: `agents.list[].groupChat.mentionPatterns` 内の安全な正規表現パターン。無効なパターンや危険なネスト反復は無視されます。
- メンションゲーティングは、検出可能な場合にのみ適用されます（ネイティブメンション、または少なくとも1つのパターンがある場合）。

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

`messages.groupChat.historyLimit` はグローバルデフォルトを設定します。チャネルは `channels.<channel>.historyLimit`（またはアカウントごと）で上書きできます。無効にするには `0` を設定します。

#### DM履歴制限

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

解決順序: DMごとの上書き → プロバイダーデフォルト → 制限なし（すべて保持）。

対応: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`。

#### Self-chat mode

自分の番号を `allowFrom` に含めるとself-chat modeが有効になり（ネイティブ@メンションを無視し、テキストパターンにのみ応答します）:

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
    native: "auto", // サポート時にネイティブコマンドを登録
    nativeSkills: "auto", // サポート時にネイティブskillコマンドを登録
    text: true, // チャットメッセージ内の /commands を解析
    bash: false, // ! を許可（別名: /bash）
    bashForegroundMs: 2000,
    config: false, // /config を許可
    mcp: false, // /mcp を許可
    plugins: false, // /plugins を許可
    debug: false, // /debug を許可
    restart: true, // /restart + gateway restart tool を許可
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

<Accordion title="コマンド詳細">

- このブロックはコマンドサーフェスを設定します。現在の組み込み + バンドル済みコマンドカタログについては [Slash Commands](/ja-JP/tools/slash-commands) を参照してください。
- このページは**configキーのリファレンス**であり、完全なコマンドカタログではありません。QQ Botの `/bot-ping` `/bot-help` `/bot-logs`、LINEの `/card`、device-pairの `/pair`、memoryの `/dreaming`、phone-controlの `/phone`、Talkの `/voice` のようなチャネル/Plugin所有コマンドは、それぞれのチャネル/Pluginページと [Slash Commands](/ja-JP/tools/slash-commands) に記載されています。
- テキストコマンドは、先頭に `/` が付いた**単独の**メッセージである必要があります。
- `native: "auto"` はDiscord/Telegramでネイティブコマンドを有効にし、Slackでは無効のままにします。
- `nativeSkills: "auto"` はDiscord/Telegramでネイティブskillコマンドを有効にし、Slackでは無効のままにします。
- チャネルごとの上書き: `channels.discord.commands.native`（bool または `"auto"`）。`false` は以前に登録されたコマンドをクリアします。
- ネイティブskill登録は `channels.<provider>.commands.nativeSkills` でチャネルごとに上書きできます。
- `channels.telegram.customCommands` は、追加のTelegram botメニュー項目を加えます。
- `bash: true` は、ホストshell向けの `! <cmd>` を有効にします。`tools.elevated.enabled` が必要で、送信者が `tools.elevated.allowFrom.<channel>` に含まれている必要があります。
- `config: true` は `/config`（`openclaw.json` の読み取り/書き込み）を有効にします。Gatewayの `chat.send` クライアントでは、永続的な `/config set|unset` 書き込みには `operator.admin` も必要です。読み取り専用の `/config show` は通常の書き込みスコープoperatorクライアントでも引き続き利用できます。
- `mcp: true` は、`mcp.servers` 配下のOpenClaw管理MCPサーバーconfig用 `/mcp` を有効にします。
- `plugins: true` は、Pluginの検出、インストール、有効化/無効化制御のための `/plugins` を有効にします。
- `channels.<provider>.configWrites` は、チャネルごとのconfig変更をゲートします（デフォルト: true）。
- 複数アカウントのチャネルでは、`channels.<provider>.accounts.<id>.configWrites` も、そのアカウントを対象とする書き込み（例: `/allowlist --config --account <id>` や `/config set channels.<provider>.accounts.<id>...`）をゲートします。
- `restart: false` は `/restart` とgateway restart toolアクションを無効にします。デフォルト: `true`。
- `ownerAllowFrom` は、owner専用コマンド/tool向けの明示的なowner allowlistです。`allowFrom` とは別です。
- `ownerDisplay: "hash"` は、system prompt内のowner IDをハッシュ化します。ハッシュ化を制御するには `ownerDisplaySecret` を設定してください。
- `allowFrom` はプロバイダーごとです。設定されている場合、それが**唯一の**認可ソースになります（チャネルallowlist/pairing および `useAccessGroups` は無視されます）。
- `useAccessGroups: false` は、`allowFrom` が設定されていない場合に、コマンドがaccess-groupポリシーをバイパスできるようにします。
- コマンドドキュメントの対応表:
  - 組み込み + バンドル済みカタログ: [Slash Commands](/ja-JP/tools/slash-commands)
  - チャネル固有のコマンドサーフェス: [Channels](/ja-JP/channels)
  - QQ Botコマンド: [QQ Bot](/ja-JP/channels/qqbot)
  - pairingコマンド: [Pairing](/ja-JP/channels/pairing)
  - LINE cardコマンド: [LINE](/ja-JP/channels/line)
  - Dreaming: [Dreaming](/ja-JP/concepts/dreaming)

</Accordion>

---

## agentのデフォルト

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

system promptのRuntime行に表示される任意のリポジトリルートです。未設定の場合、OpenClawはworkspaceから上位へたどって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` を設定していないagent向けの任意のデフォルトskill allowlistです。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather を継承
      { id: "docs", skills: ["docs-search"] }, // defaultsを置き換える
      { id: "locked-down", skills: [] }, // skillsなし
    ],
  },
}
```

- デフォルトでskillsを無制限にするには `agents.defaults.skills` を省略します。
- defaultsを継承するには `agents.list[].skills` を省略します。
- skillsなしにするには `agents.list[].skills: []` を設定します。
- 空でない `agents.list[].skills` リストは、そのagentの最終セットです。defaultsとはマージされません。

### `agents.defaults.skipBootstrap`

workspace bootstrapファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）の自動作成を無効にします。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

workspace bootstrapファイルをsystem promptにいつ注入するかを制御します。デフォルト: `"always"`。

- `"continuation-skip"`: 安全な継続ターン（assistantの応答完了後）ではworkspace bootstrapの再注入をスキップし、promptサイズを削減します。Heartbeat実行とCompaction後の再試行では引き続きコンテキストを再構築します。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰め前の、workspace bootstrapファイルごとの最大文字数です。デフォルト: `12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

全workspace bootstrapファイルにわたって注入される合計最大文字数です。デフォルト: `60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

bootstrapコンテキストが切り詰められたときの、agentに見える警告テキストを制御します。
デフォルト: `"once"`。

- `"off"`: 警告テキストをsystem promptに一切注入しません。
- `"once"`: 一意の切り詰めシグネチャごとに1回だけ警告を注入します（推奨）。
- `"always"`: 切り詰めが存在する場合、毎回の実行で警告を注入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### コンテキスト予算の所有マップ

OpenClawには高ボリュームのprompt/コンテキスト予算が複数あり、
それらはすべてを1つの汎用ノブに流し込むのではなく、
サブシステムごとに意図的に分割されています。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  通常のworkspace bootstrap注入。
- `agents.defaults.startupContext.*`:
  recentなdaily
  `memory/*.md` ファイルを含む、1回限りの `/new` と `/reset` の起動前置き。
- `skills.limits.*`:
  system promptに注入されるコンパクトなSkillsリスト。
- `agents.defaults.contextLimits.*`:
  制限付きのランタイム抜粋と、ランタイム所有ブロックの注入。
- `memory.qmd.limits.*`:
  インデックスされたmemory searchスニペットと注入サイズ。

1つのagentだけ別の
予算が必要な場合にのみ、対応するagentごとの上書きを使用してください。

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

素の `/new` と `/reset`
実行時に注入される初回ターン用の起動前置きを制御します。

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

制限付きランタイムコンテキストサーフェスの共有デフォルトです。

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

- `memoryGetMaxChars`: 切り詰め
  メタデータと継続通知が追加される前の、デフォルトの `memory_get` 抜粋上限。
- `memoryGetDefaultLines`: `lines` が
  省略された場合の、デフォルトの `memory_get` 行ウィンドウ。
- `toolResultMaxChars`: 永続化された結果と
  オーバーフロー回復で使われるライブtool結果上限。
- `postCompactionMaxChars`: Compaction後の
  再注入更新で使用されるAGENTS.md抜粋上限。

#### `agents.list[].contextLimits`

共有 `contextLimits` ノブのagentごとの上書きです。省略されたフィールドは
`agents.defaults.contextLimits` から継承されます。

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

system promptに注入されるコンパクトなSkillsリストのグローバル上限です。これは
必要に応じて `SKILL.md` ファイルを読み込む動作には影響しません。

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

skills prompt予算のagentごとの上書きです。

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

プロバイダー呼び出し前に、transcript/toolの画像ブロック内で長辺に適用される最大ピクセルサイズです。
デフォルト: `1200`。

通常、値を小さくすると、スクリーンショットの多い実行でvision token使用量とリクエストペイロードサイズを減らせます。
値を大きくすると、より多くの視覚的詳細を保持できます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

system promptコンテキスト用のtimezoneです（メッセージのtimestampではありません）。host timezoneにフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

system prompt内の時刻形式です。デフォルト: `auto`（OSの設定）。

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
      params: { cacheRetention: "long" }, // グローバルデフォルトのプロバイダーparams
      embeddedHarness: {
        runtime: "auto", // auto | pi | 登録済みharness id（例: codex）
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

- `model`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のどちらでも指定できます。
  - 文字列形式はprimary modelのみを設定します。
  - オブジェクト形式はprimaryと順序付きfailover modelを設定します。
- `imageModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のどちらでも指定できます。
  - `image` tool経路で、そのvision-model configとして使用されます。
  - 選択中/デフォルトのmodelが画像入力を受け取れない場合のフォールバックルーティングにも使われます。
- `imageGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のどちらでも指定できます。
  - 共有の画像生成capabilityと、今後画像を生成するtool/Pluginサーフェスで使用されます。
  - 典型的な値: ネイティブGemini画像生成用の `google/gemini-3.1-flash-image-preview`、fal用の `fal/fal-ai/flux/dev`、またはOpenAI Images用の `openai/gpt-image-2`。
  - provider/modelを直接選ぶ場合は、対応するprovider認証/API keyも設定してください（例: `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/*` には `OPENAI_API_KEY`、`fal/*` には `FAL_KEY`）。
  - 省略しても、`image_generate` は認証済みproviderのデフォルトを推論できます。まず現在のデフォルトproviderを試し、その後、残りの登録済み画像生成providerをprovider-id順に試します。
- `musicGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のどちらでも指定できます。
  - 共有の音楽生成capabilityと組み込みの `music_generate` toolで使用されます。
  - 典型的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、または `minimax/music-2.5+`。
  - 省略しても、`music_generate` は認証済みproviderのデフォルトを推論できます。まず現在のデフォルトproviderを試し、その後、残りの登録済み音楽生成providerをprovider-id順に試します。
  - provider/modelを直接選ぶ場合は、対応するprovider認証/API keyも設定してください。
- `videoGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のどちらでも指定できます。
  - 共有の動画生成capabilityと組み込みの `video_generate` toolで使用されます。
  - 典型的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、または `qwen/wan2.7-r2v`。
  - 省略しても、`video_generate` は認証済みproviderのデフォルトを推論できます。まず現在のデフォルトproviderを試し、その後、残りの登録済み動画生成providerをprovider-id順に試します。
  - provider/modelを直接選ぶ場合は、対応するprovider認証/API keyも設定してください。
  - バンドルされたQwen動画生成providerは、最大1本の出力動画、1枚の入力画像、4本の入力動画、10秒の長さ、およびproviderレベルの `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートします。
- `pdfModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のどちらでも指定できます。
  - `pdf` toolのmodelルーティングに使用されます。
  - 省略した場合、PDF toolはまず `imageModel` にフォールバックし、その後解決済みのセッション/デフォルトmodelにフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の、`pdf` toolのデフォルトPDFサイズ上限。
- `pdfMaxPages`: `pdf` toolの抽出フォールバックモードで考慮するデフォルト最大ページ数。
- `verboseDefault`: agentのデフォルトverboseレベル。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `elevatedDefault`: agentのデフォルトelevated-outputレベル。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は `provider/model`（例: `openai/gpt-5.4`）。providerを省略すると、OpenClawはまずaliasを試し、その次にその正確なmodel idに一致する一意のconfigured-providerを試し、最後にconfigured default providerへフォールバックします（これは非推奨の互換動作なので、明示的な `provider/model` を推奨します）。そのproviderが設定済みのデフォルトmodelをもう公開していない場合、OpenClawは古い削除済みproviderのデフォルトを表示する代わりに、最初のconfigured provider/modelへフォールバックします。
- `models`: `/model` 用のconfigured modelカタログおよびallowlistです。各エントリには `alias`（ショートカット）と `params`（provider固有。例: `temperature`、`maxTokens`、`cacheRetention`、`context1m`）を含められます。
  - 安全な編集: エントリ追加には `openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使用してください。`config set` は、`--replace` を渡さない限り、既存allowlistエントリを削除する置換を拒否します。
  - providerスコープのconfigure/onboardingフローは、選択したprovider modelをこのmapにマージし、すでに設定済みの無関係なproviderは保持します。
- `params`: すべてのmodelに適用されるグローバルなデフォルトproviderパラメータです。`agents.defaults.params` に設定します（例: `{ cacheRetention: "long" }`）。
- `params` のマージ優先順位（config）: `agents.defaults.params`（グローバルベース）は、`agents.defaults.models["provider/model"].params`（modelごと）で上書きされ、さらに `agents.list[].params`（一致するagent id）がキーごとに上書きします。詳細は [Prompt Caching](/ja-JP/reference/prompt-caching) を参照してください。
- `embeddedHarness`: デフォルトの低レベル埋め込みagentランタイムポリシーです。`runtime: "auto"` を使うと、登録済みPlugin harnessがサポート対象modelを引き受けられるようになります。`runtime: "pi"` は組み込みPI harnessを強制し、`runtime: "codex"` のように登録済みharness idも指定できます。自動PIフォールバックを無効にするには `fallback: "none"` を設定します。
- これらのフィールドを変更するconfig writer（例: `/models set`、`/models set-image`、fallbackの追加/削除コマンド）は、正規のオブジェクト形式で保存し、可能な限り既存のfallbackリストを保持します。
- `maxConcurrent`: セッションをまたいだ並列agent実行の最大数です（各セッション自体は引き続き直列化されます）。デフォルト: 4。

### `agents.defaults.embeddedHarness`

`embeddedHarness` は、埋め込みagentターンをどの低レベルexecutorで実行するかを制御します。
ほとんどのデプロイでは、デフォルトの `{ runtime: "auto", fallback: "pi" }` のままで問題ありません。
これは、バンドルされた
Codex app-server harnessのように、信頼できるPluginがネイティブharnessを提供する場合に使用します。

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

- `runtime`: `"auto"`、`"pi"`、または登録済みPlugin harness id。バンドルされたCodex Pluginは `codex` を登録します。
- `fallback`: `"pi"` または `"none"`。`"pi"` は、Plugin harnessが選択されない場合の互換フォールバックとして、組み込みPI harnessを保持します。`"none"` は、不足または未対応のPlugin harness選択時に、黙ってPIを使うのではなく失敗させます。選択されたPlugin harnessの失敗は常にそのまま表示されます。
- 環境変数による上書き: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` は `runtime` を上書きし、`OPENCLAW_AGENT_HARNESS_FALLBACK=none` はそのプロセスでPIフォールバックを無効にします。
- Codex専用デプロイでは、`model: "codex/gpt-5.4"`、`embeddedHarness.runtime: "codex"`、`embeddedHarness.fallback: "none"` を設定してください。
- これは埋め込みchat harnessのみを制御します。メディア生成、vision、PDF、音楽、動画、TTSは引き続きそれぞれのprovider/model設定を使います。

**組み込みaliasショートハンド**（modelが `agents.defaults.models` にある場合のみ適用）:

| Alias               | Model                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

設定したaliasは常にデフォルトより優先されます。

Z.AIのGLM-4.x modelは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、自動的にthinking modeを有効にします。
Z.AI modelは、tool callストリーミングのためにデフォルトで `tool_stream` を有効にします。無効にするには `agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定してください。
Anthropic Claude 4.6 modelは、明示的なthinkingレベルが設定されていない場合、デフォルトで `adaptive` thinkingを使用します。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行用の任意のCLIバックエンドです（tool callなし）。API providerが失敗したときのバックアップとして便利です。

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

- CLIバックエンドはテキスト優先です。toolは常に無効です。
- `sessionArg` が設定されている場合はセッションをサポートします。
- `imageArg` がファイルパスを受け付ける場合は画像の透過渡しをサポートします。

### `agents.defaults.systemPromptOverride`

OpenClawが組み立てたsystem prompt全体を固定文字列で置き換えます。デフォルトレベル（`agents.defaults.systemPromptOverride`）またはagentごと（`agents.list[].systemPromptOverride`）で設定します。agentごとの値が優先され、空文字または空白のみの値は無視されます。制御されたprompt実験に便利です。

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

modelファミリーごとに適用されるprovider非依存のprompt overlayです。GPT-5系のmodel idは、providerをまたいで共有の動作契約を受け取り、`personality` はフレンドリーな対話スタイル層のみを制御します。

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

- `"friendly"`（デフォルト）と `"on"` は、フレンドリーな対話スタイル層を有効にします。
- `"off"` はフレンドリー層のみを無効にし、タグ付きGPT-5動作契約は有効のままです。
- 旧式の `plugins.entries.openai.config.personality` も、この共有設定が未設定なら引き続き読み取られます。

### `agents.defaults.heartbeat`

定期的なHeartbeat実行です。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m で無効
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // デフォルト: true; false にするとsystem promptからHeartbeatセクションを省略
        lightContext: false, // デフォルト: false; true にするとworkspace bootstrapファイルのうち HEARTBEAT.md のみを保持
        isolatedSession: false, // デフォルト: false; true にすると各Heartbeatを新しいセッションで実行（会話履歴なし）
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow（デフォルト） | block
        target: "none", // デフォルト: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: 期間文字列（ms/s/m/h）。デフォルト: `30m`（API-key認証）または `1h`（OAuth認証）。無効にするには `0m` に設定します。
- `includeSystemPromptSection`: false の場合、system promptからHeartbeatセクションを省略し、bootstrapコンテキストへの `HEARTBEAT.md` 注入もスキップします。デフォルト: `true`。
- `suppressToolErrorWarnings`: true の場合、Heartbeat実行中のtoolエラー警告ペイロードを抑制します。
- `timeoutSeconds`: 中断される前にHeartbeat agentターンに許可される最大時間（秒）。未設定の場合は `agents.defaults.timeoutSeconds` を使用します。
- `directPolicy`: direct/DM配信ポリシー。`allow`（デフォルト）はdirect targetへの配信を許可します。`block` はdirect targetへの配信を抑止し、`reason=dm-blocked` を出力します。
- `lightContext`: true の場合、Heartbeat実行は軽量なbootstrapコンテキストを使用し、workspace bootstrapファイルから `HEARTBEAT.md` のみを保持します。
- `isolatedSession`: true の場合、各Heartbeatは以前の会話履歴がない新しいセッションで実行されます。Cronの `sessionTarget: "isolated"` と同じ分離パターンです。Heartbeatごとのtokenコストを約100Kから約2〜5K tokenへ削減します。
- agentごと: `agents.list[].heartbeat` を設定します。いずれかのagentが `heartbeat` を定義した場合、Heartbeatを実行するのは**それらのagentだけ**です。
- Heartbeatは完全なagentターンを実行します。間隔を短くすると、それだけ多くのtokenを消費します。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 登録済みCompaction provider Pluginのid（任意）
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // identifierPolicy=custom のときに使用
        postCompactionSections: ["Session Startup", "Red Lines"], // [] で再注入を無効化
        model: "openrouter/anthropic/claude-sonnet-4-6", // Compaction専用の任意のmodel上書き
        notifyUser: true, // Compaction開始時と完了時に短い通知を送信（デフォルト: false）
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

- `mode`: `default` または `safeguard`（長い履歴向けのチャンク化要約）。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `provider`: 登録済みCompaction provider Pluginのid。設定されている場合、組み込みLLM要約の代わりに、そのproviderの `summarize()` が呼ばれます。失敗時は組み込みにフォールバックします。providerを設定すると `mode: "safeguard"` が強制されます。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `timeoutSeconds`: OpenClawが単一のCompaction操作を中断するまでに許可する最大秒数。デフォルト: `900`。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` は、Compaction要約時に組み込みの不透明ID保持ガイダンスを先頭に付加します。
- `identifierInstructions`: `identifierPolicy=custom` のときに使う任意のカスタムID保持テキスト。
- `postCompactionSections`: Compaction後に再注入する任意のAGENTS.md H2/H3セクション名。デフォルトは `["Session Startup", "Red Lines"]` です。無効化するには `[]` を設定します。未設定、またはそのデフォルトの組を明示設定した場合は、旧式の `Every Session`/`Safety` 見出しもレガシーフォールバックとして受け入れます。
- `model`: Compaction要約専用の任意の `provider/model-id` 上書き。メインセッションではあるmodelを維持しつつ、Compaction要約は別のmodelで実行したい場合に使います。未設定の場合、Compactionはセッションのprimary modelを使用します。
- `notifyUser`: `true` の場合、Compaction開始時と完了時にユーザーへ短い通知を送信します（例: 「Compacting context...」「Compaction complete」）。Compactionを無言に保つため、デフォルトでは無効です。
- `memoryFlush`: 自動Compaction前に永続memoryを保存する、サイレントなagentターンです。workspaceが読み取り専用の場合はスキップされます。

### `agents.defaults.contextPruning`

LLMへ送信する前に、メモリ上のコンテキストから**古いtool結果**を削減します。ディスク上のセッション履歴は**変更しません**。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration（ms/s/m/h）、デフォルト単位: 分
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

<Accordion title="cache-ttlモードの動作">

- `mode: "cache-ttl"` は削減パスを有効にします。
- `ttl` は、最後のcache touch後に、削減を再実行できるまでの頻度を制御します。
- 削減では、まず大きすぎるtool結果をsoft-trimし、その後必要であれば古いtool結果をhard-clearします。

**Soft-trim** は先頭 + 末尾を残し、中間に `...` を挿入します。

**Hard-clear** は、tool結果全体をplaceholderで置き換えます。

注記:

- 画像ブロックは切り詰め/消去されません。
- 比率は文字数ベース（概算）であり、正確なtoken数ではありません。
- `keepLastAssistants` 個未満のassistantメッセージしか存在しない場合、削減はスキップされます。

</Accordion>

動作の詳細は [Session Pruning](/ja-JP/concepts/session-pruning) を参照してください。

### ブロックストリーミング

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom（minMs/maxMsを使用）
    },
  },
}
```

- Telegram以外のチャネルでは、ブロック返信を有効にするには明示的な `*.blockStreaming: true` が必要です。
- チャネル上書き: `channels.<channel>.blockStreamingCoalesce`（およびアカウントごとの変種）。Signal/Slack/Discord/Google Chatのデフォルトは `minChars: 1500` です。
- `humanDelay`: ブロック返信間のランダムな待機時間。`natural` = 800〜2500ms。agentごとの上書き: `agents.list[].humanDelay`。

動作とチャンク化の詳細は [Streaming](/ja-JP/concepts/streaming) を参照してください。

### typing indicator

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

- デフォルト: direct chat/メンションでは `instant`、メンションなしのグループチャットでは `message`。
- セッションごとの上書き: `session.typingMode`, `session.typingIntervalSeconds`。

[Typing Indicators](/ja-JP/concepts/typing-indicators) を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

埋め込みagent向けの任意のsandbox化です。完全なガイドは [Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。

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
          // SecretRef / インライン内容もサポート:
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

<Accordion title="sandbox詳細">

**Backend:**

- `docker`: ローカルDockerランタイム（デフォルト）
- `ssh`: 汎用SSHバックのリモートランタイム
- `openshell`: OpenShellランタイム

`backend: "openshell"` を選択した場合、ランタイム固有の設定は
`plugins.entries.openshell.config` に移動します。

**SSH backend config:**

- `target`: `user@host[:port]` 形式のSSHターゲット
- `command`: SSHクライアントコマンド（デフォルト: `ssh`）
- `workspaceRoot`: スコープごとのworkspaceに使う絶対リモートルート
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSHへ渡される既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: OpenClawがランタイム時に一時ファイルへ実体化する、インライン内容またはSecretRef
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSHのhost-keyポリシーノブ

**SSH認証の優先順位:**

- `identityData` は `identityFile` より優先
- `certificateData` は `certificateFile` より優先
- `knownHostsData` は `knownHostsFile` より優先
- SecretRefバックの `*Data` 値は、sandboxセッション開始前に、アクティブなsecretsランタイムスナップショットから解決されます

**SSH backendの動作:**

- 作成または再作成後、一度だけリモートworkspaceをseedします
- その後、リモートSSH workspaceを正規状態として維持します
- `exec`、file tools、media pathをSSH経由でルーティングします
- リモート変更を自動的にhostへ同期しません
- sandbox browserコンテナーはサポートしません

**Workspace access:**

- `none`: `~/.openclaw/sandboxes` 配下のスコープごとのsandbox workspace
- `ro`: `/workspace` にsandbox workspace、`/agent` に読み取り専用でagent workspaceをマウント
- `rw`: `/workspace` にagent workspaceを読み書き可能でマウント

**Scope:**

- `session`: セッションごとのコンテナー + workspace
- `agent`: agentごとに1つのコンテナー + workspace（デフォルト）
- `shared`: 共有コンテナーとworkspace（セッション間分離なし）

**OpenShell Plugin config:**

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
          gateway: "lab", // 任意
          gatewayEndpoint: "https://lab.example", // 任意
          policy: "strict", // 任意のOpenShell policy id
          providers: ["openai"], // 任意
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell mode:**

- `mirror`: exec前にローカルからリモートへseedし、exec後に同期し戻します。ローカルworkspaceが正規状態のままです
- `remote`: sandbox作成時に一度だけリモートをseedし、その後はリモートworkspaceを正規状態として維持します

`remote` modeでは、seedステップ後にOpenClawの外で行われたhostローカル編集は、自動的にはsandboxへ同期されません。
転送はOpenShell sandboxへのSSHですが、sandboxライフサイクルと任意のmirror同期はPluginが管理します。

**`setupCommand`** はコンテナー作成後に一度だけ実行されます（`sh -lc` 経由）。network egress、書き込み可能なroot、rootユーザーが必要です。

**コンテナーはデフォルトで `network: "none"`** です。agentに外向きアクセスが必要な場合は `"bridge"`（またはカスタムbridge network）に設定してください。
`"host"` はブロックされます。`"container:<id>"` もデフォルトではブロックされ、明示的に
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` を設定した場合のみ有効になります（緊急用）。

**受信添付ファイル** は、アクティブworkspace内の `media/inbound/*` に段階配置されます。

**`docker.binds`** は追加のhostディレクトリをマウントします。グローバルとagentごとのbindはマージされます。

**sandboxed browser**（`sandbox.browser.enabled`）: コンテナー内のChromium + CDP。noVNC URLはsystem promptに注入されます。`openclaw.json` 内の `browser.enabled` は不要です。
noVNCのオブザーバーアクセスはデフォルトでVNC認証を使用し、OpenClawは共有URLにパスワードを露出する代わりに、有効期限付きの短いtoken URLを出力します。

- `allowHostControl: false`（デフォルト）は、sandbox化されたセッションがhost browserを対象にすることをブロックします。
- `network` のデフォルトは `openclaw-sandbox-browser`（専用bridge network）です。グローバルbridge接続が明示的に必要な場合にのみ `bridge` を設定してください。
- `cdpSourceRange` は、コンテナー境界でのCDP ingressをCIDR範囲に任意で制限します（例: `172.21.0.1/32`）。
- `sandbox.browser.binds` は、追加のhostディレクトリをsandbox browserコンテナーにのみマウントします。設定した場合（`[]` を含む）、browserコンテナーでは `docker.binds` を置き換えます。
- 起動デフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義され、コンテナーホスト向けに調整されています:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
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
  - `--disable-extensions`（デフォルトで有効）
  - `--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu` は
    デフォルトで有効で、WebGL/3D利用で必要な場合は
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効化できます。
  - workflowが拡張機能に依存する場合は、
    `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で拡張機能を再有効化できます。
  - `--renderer-process-limit=2` は
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で変更できます。Chromiumの
    デフォルトのプロセス制限を使うには `0` に設定してください。
  - さらに、`noSandbox` が有効な場合は `--no-sandbox` と `--disable-setuid-sandbox`。
  - デフォルトはコンテナーimageのベースラインです。コンテナーのデフォルトを変えるには、
    カスタムentrypoint付きのカスタムbrowser imageを使用してください。

</Accordion>

browser sandboxingと `sandbox.docker.binds` はDocker専用です。

imageをビルドする:

```bash
scripts/sandbox-setup.sh           # メインsandbox image
scripts/sandbox-browser-setup.sh   # 任意のbrowser image
```

### `agents.list`（agentごとの上書き）

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
        model: "anthropic/claude-opus-4-6", // または { primary, fallbacks }
        thinkingDefault: "high", // agentごとのthinkingレベル上書き
        reasoningDefault: "on", // agentごとのreasoning可視性上書き
        fastModeDefault: false, // agentごとのfast mode上書き
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // 一致する defaults.models params をキー単位で上書き
        skills: ["docs-search"], // 設定時は agents.defaults.skills を置き換える
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

- `id`: 安定したagent id（必須）。
- `default`: 複数設定された場合、最初のものが勝ちます（警告をログ出力）。1つも設定されていない場合、最初のlistエントリがデフォルトです。
- `model`: 文字列形式は `primary` のみを上書きし、オブジェクト形式 `{ primary, fallbacks }` は両方を上書きします（`[]` はグローバルfallbackを無効化）。`primary` のみを上書きするCron jobは、`fallbacks: []` を設定しない限り、デフォルトfallbackを引き続き継承します。
- `params`: agentごとのstream paramsで、`agents.defaults.models` 内の選択されたmodelエントリにマージされます。`cacheRetention`、`temperature`、`maxTokens` のようなagent固有上書きを、modelカタログ全体を複製せずに行うために使います。
- `skills`: 任意のagentごとのskill allowlist。省略すると、設定されている場合は `agents.defaults.skills` を継承します。明示的なlistはdefaultsをマージせずに置き換え、`[]` はskillsなしを意味します。
- `thinkingDefault`: 任意のagentごとのデフォルトthinkingレベル（`off | minimal | low | medium | high | xhigh | adaptive | max`）。メッセージごとやセッション上書きが設定されていない場合、このagentでは `agents.defaults.thinkingDefault` を上書きします。
- `reasoningDefault`: 任意のagentごとのデフォルトreasoning可視性（`on | off | stream`）。メッセージごとやセッションのreasoning上書きが設定されていない場合に適用されます。
- `fastModeDefault`: 任意のagentごとのfast modeデフォルト（`true | false`）。メッセージごとやセッションのfast-mode上書きが設定されていない場合に適用されます。
- `embeddedHarness`: 任意のagentごとの低レベルharnessポリシー上書き。1つのagentだけをCodex専用にし、他のagentではデフォルトのPIフォールバックを維持するには `{ runtime: "codex", fallback: "none" }` を使用します。
- `runtime`: 任意のagentごとのランタイム記述子。agentをデフォルトでACP harnessセッションにしたい場合は、`type: "acp"` と `runtime.acp` のデフォルト（`agent`, `backend`, `mode`, `cwd`）を使います。
- `identity.avatar`: workspace相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを導出します: `emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns`。
- `subagents.allowAgents`: `sessions_spawn` 用のagent id allowlist（`["*"]` = 任意、デフォルト: 同じagentのみ）。
- sandbox継承ガード: 要求元セッションがsandbox化されている場合、`sessions_spawn` はsandbox化されずに実行されるターゲットを拒否します。
- `subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制。デフォルト: false）。

---

## マルチagentルーティング

1つのGateway内で複数の分離されたagentを実行します。[Multi-Agent](/ja-JP/concepts/multi-agent) を参照してください。

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

### バインディング一致フィールド

- `type`（任意）: 通常ルーティングには `route`（type未指定もroute扱い）、永続ACP会話バインディングには `acp`
- `match.channel`（必須）
- `match.accountId`（任意。`*` = 任意のアカウント、未指定 = デフォルトアカウント）
- `match.peer`（任意。`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（任意。チャネル固有）
- `acp`（任意。`type: "acp"` のときのみ）: `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（peer/guild/teamなしの完全一致）
5. `match.accountId: "*"`（チャネル全体）
6. デフォルトagent

各tier内では、最初に一致した `bindings` エントリが勝ちます。

`type: "acp"` エントリでは、OpenClawは正確な会話ID（`match.channel` + account + `match.peer.id`）で解決し、上記のroute binding tier順序は使用しません。

### agentごとのアクセスプロファイル

<Accordion title="フルアクセス（sandboxなし）">

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

<Accordion title="読み取り専用tool + workspace">

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

<Accordion title="ファイルシステムアクセスなし（メッセージングのみ）">

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

優先順位の詳細は [Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

---

## セッション

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
    parentForkMaxTokens: 100000, // このtoken数を超えると親スレッドforkをスキップ（0で無効）
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration または false
      maxDiskBytes: "500mb", // 任意のハード予算
      highWaterBytes: "400mb", // 任意のクリーンアップ目標
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // デフォルトの非アクティブ時自動unfocusまでの時間（0で無効）
      maxAgeHours: 0, // デフォルトの強制最大有効期間（0で無効）
    },
    mainKey: "main", // 旧式（ランタイムは常に "main" を使用）
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Sessionフィールド詳細">

- **`scope`**: グループチャットコンテキスト向けの基本セッショングループ化戦略。
  - `per-sender`（デフォルト）: 各送信者はチャネルコンテキスト内で分離されたセッションを持ちます。
  - `global`: チャネルコンテキスト内の全参加者が1つのセッションを共有します（共有コンテキストを意図する場合のみ使用）。
- **`dmScope`**: DMをどのようにグループ化するか。
  - `main`: すべてのDMがmainセッションを共有します。
  - `per-peer`: チャネルをまたいで送信者idごとに分離します。
  - `per-channel-peer`: チャネル + 送信者ごとに分離します（複数ユーザーの受信箱に推奨）。
  - `per-account-channel-peer`: アカウント + チャネル + 送信者ごとに分離します（複数アカウントに推奨）。
- **`identityLinks`**: チャネル横断のセッション共有用に、正規idをprovider接頭辞付きpeerへマップします。
- **`reset`**: 主要なリセットポリシー。`daily` はローカル時刻の `atHour` でリセットし、`idle` は `idleMinutes` 後にリセットします。両方設定されている場合は、先に期限切れになった方が優先されます。
- **`resetByType`**: タイプごとの上書き（`direct`、`group`、`thread`）。旧式の `dm` も `direct` の別名として受け付けます。
- **`parentForkMaxTokens`**: forkされたスレッドセッションを作成するときに許可される親セッション `totalTokens` の最大値（デフォルト `100000`）。
  - 親の `totalTokens` がこの値を超える場合、OpenClawは親transcript履歴を継承せず、新しいスレッドセッションを開始します。
  - このガードを無効にして常に親forkを許可するには `0` を設定します。
- **`mainKey`**: 旧式フィールドです。ランタイムはmain direct chatバケットに常に `"main"` を使います。
- **`agentToAgent.maxPingPongTurns`**: agent間やり取り中に許可される、agent同士の返信往復ターン数の最大値（整数、範囲: `0`–`5`）。`0` はping-pong連鎖を無効にします。
- **`sendPolicy`**: `channel`、`chatType`（`direct|group|channel`、旧式の `dm` 別名あり）、`keyPrefix`、または `rawKeyPrefix` で一致します。最初のdenyが勝ちます。
- **`maintenance`**: セッションストアのクリーンアップ + 保持制御。
  - `mode`: `warn` は警告のみ出力し、`enforce` はクリーンアップを適用します。
  - `pruneAfter`: 古いエントリの期限切れ基準（デフォルト `30d`）。
  - `maxEntries`: `sessions.json` 内のエントリ最大数（デフォルト `500`）。
  - `rotateBytes`: `sessions.json` がこのサイズを超えたときにローテーションします（デフォルト `10mb`）。
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcript archiveの保持期間。デフォルトは `pruneAfter`。無効にするには `false` を設定します。
  - `maxDiskBytes`: 任意のsessionsディレクトリのディスク予算。`warn` モードでは警告を出し、`enforce` モードでは最も古いartifact/sessionから削除します。
  - `highWaterBytes`: 予算クリーンアップ後の任意の目標値。デフォルトは `maxDiskBytes` の `80%` です。
- **`threadBindings`**: スレッドバインド済みセッション機能のグローバルデフォルト。
  - `enabled`: マスターのデフォルトスイッチ（providerは上書き可能。Discordは `channels.discord.threadBindings.enabled` を使用）
  - `idleHours`: 非アクティブ時の自動unfocusまでのデフォルト時間（`0` で無効。providerごとに上書き可能）
  - `maxAgeHours`: 強制最大有効期間のデフォルト時間（`0` で無効。providerごとに上書き可能）

</Accordion>

---

## メッセージ

```json5
{
  messages: {
    responsePrefix: "🦞", // または "auto"
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
      debounceMs: 2000, // 0で無効
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 応答接頭辞

チャネル/アカウントごとの上書き: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`。

解決順序（最も具体的なものが優先）: account → channel → global。`""` は無効化し、カスケードを停止します。`"auto"` は `[{identity.name}]` を導出します。

**テンプレート変数:**

| Variable          | 説明 | Example                     |
| ----------------- | ---- | --------------------------- |
| `{model}`         | 短いmodel名 | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なmodel identifier | `anthropic/claude-opus-4-6` |
| `{provider}`      | provider名 | `anthropic`                 |
| `{thinkingLevel}` | 現在のthinkingレベル | `high`, `low`, `off`        |
| `{identity.name}` | agent ID名 | （`"auto"` と同じ）          |

変数は大文字小文字を区別しません。`{think}` は `{thinkingLevel}` の別名です。

### 確認リアクション

- デフォルトはアクティブagentの `identity.emoji`、なければ `"👀"` です。無効にするには `""` を設定します。
- チャネルごとの上書き: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: account → channel → `messages.ackReaction` → identityフォールバック。
- スコープ: `group-mentions`（デフォルト）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: Slack、Discord、Telegramで返信後にackを削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Telegramでライフサイクルステータスリアクションを有効にします。
  SlackとDiscordでは、未設定のままだとackリアクションが有効なときにステータスリアクションも有効のままになります。
  Telegramでは、ライフサイクルステータスリアクションを有効にするには、これを明示的に `true` に設定してください。

### 受信debounce

同一送信者からの短時間のテキストのみメッセージを、1回のagentターンにまとめます。メディア/添付ファイルは即時フラッシュされます。制御コマンドはdebouncingをバイパスします。

### TTS（text-to-speech）

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

- `auto` はデフォルトの自動TTSモードを制御します: `off`、`always`、`inbound`、または `tagged`。`/tts on|off` はローカル設定を上書きでき、`/tts status` は有効状態を表示します。
- `summaryModel` は、自動要約用に `agents.defaults.model.primary` を上書きします。
- `modelOverrides` はデフォルトで有効です。`modelOverrides.allowProvider` のデフォルトは `false`（opt-in）です。
- API keyは `ELEVENLABS_API_KEY`/`XI_API_KEY` と `OPENAI_API_KEY` にフォールバックします。
- `openai.baseUrl` はOpenAI TTS endpointを上書きします。解決順序はconfig、次に `OPENAI_TTS_BASE_URL`、その後 `https://api.openai.com/v1` です。
- `openai.baseUrl` がOpenAI以外のendpointを指している場合、OpenClawはそれをOpenAI互換TTSサーバーとして扱い、model/voice検証を緩和します。

---

## Talk

Talk mode（macOS/iOS/Android）のデフォルトです。

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

- `talk.provider` は、複数のTalk providerが設定されている場合、`talk.providers` 内のキーと一致している必要があります。
- 旧式のフラットなTalkキー（`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`）は互換専用で、`talk.providers.<provider>` に自動移行されます。
- Voice IDは `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `providers.*.apiKey` はプレーンテキスト文字列またはSecretRefオブジェクトを受け付けます。
- `ELEVENLABS_API_KEY` のフォールバックは、Talk API keyが1つも設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases` により、Talkディレクティブでフレンドリーな名前を使えます。
- `silenceTimeoutMs` は、ユーザーの無音後にTalk modeがtranscriptを送信するまで待機する時間を制御します。未設定の場合はプラットフォームデフォルトの無音ウィンドウを維持します（`macOSとAndroidでは700 ms、iOSでは900 ms`）。

---

## Tools

### toolプロファイル

`tools.profile` は `tools.allow`/`tools.deny` より前にベースallowlistを設定します。

ローカルオンボーディングでは、未設定の新規ローカルconfigに対してデフォルトで `tools.profile: "coding"` を設定します（既存の明示的なプロファイルは保持されます）。

| Profile     | Includes                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` のみ                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | 制限なし（未設定と同じ）                                                                                                         |

### toolグループ

| Group              | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution`（`bash` は `exec` の別名として受け付けられます）                                      |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | すべての組み込みtool（provider Pluginは除く）                                                                            |

### `tools.allow` / `tools.deny`

グローバルなtool許可/拒否ポリシーです（denyが優先）。大文字小文字を区別せず、`*` ワイルドカードをサポートします。Docker sandboxがoffでも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

特定のproviderまたはmodelに対して、さらにtoolを制限します。順序: ベースprofile → provider profile → allow/deny。

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

sandbox外でのelevated execアクセスを制御します。

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

- agentごとの上書き（`agents.list[].tools.elevated`）は、さらに制限することしかできません。
- `/elevated on|off|ask|full` は状態をセッションごとに保存します。インラインディレクティブは単一メッセージに適用されます。
- Elevated `exec` はsandboxをバイパスし、設定されたescape path（デフォルトは `gateway`、exec targetが `node` の場合は `node`）を使用します。

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

toolループ安全チェックはデフォルトで**無効**です。有効にするには `enabled: true` を設定します。
設定はグローバルの `tools.loopDetection` に定義でき、agentごとに `agents.list[].tools.loopDetection` で上書きできます。

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

- `historySize`: ループ解析のために保持するtool call履歴の最大数。
- `warningThreshold`: 進展のない繰り返しパターンに対する警告閾値。
- `criticalThreshold`: 深刻なループをブロックするための、より高い繰り返し閾値。
- `globalCircuitBreakerThreshold`: 進展のない実行に対するハード停止閾値。
- `detectors.genericRepeat`: 同一tool/同一引数の繰り返しcallに警告します。
- `detectors.knownPollNoProgress`: 既知のpoll tool（`process.poll`, `command_status` など）の進展なしを警告/ブロックします。
- `detectors.pingPong`: 進展のない交互ペアパターンを警告/ブロックします。
- `warningThreshold >= criticalThreshold` または `criticalThreshold >= globalCircuitBreakerThreshold` の場合、検証は失敗します。

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // または BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // 任意。自動検出するなら省略
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

受信メディア理解（画像/音声/動画）を設定します。

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: 完了した非同期音楽/動画をチャネルへ直接送信
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

<Accordion title="メディアmodelエントリフィールド">

**Providerエントリ**（`type: "provider"` または省略）:

- `provider`: API provider id（`openai`, `anthropic`, `google`/`gemini`, `groq` など）
- `model`: model id上書き
- `profile` / `preferredProfile`: `auth-profiles.json` のprofile選択

**CLIエントリ**（`type: "cli"`）:

- `command`: 実行する実行ファイル
- `args`: テンプレート化された引数（`{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` などをサポート）

**共通フィールド:**

- `capabilities`: 任意のリスト（`image`, `audio`, `video`）。デフォルト: `openai`/`anthropic`/`minimax` → image、`google` → image+audio+video、`groq` → audio。
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: エントリごとの上書き。
- 失敗すると次のエントリへフォールバックします。

provider認証は標準順序に従います: `auth-profiles.json` → 環境変数 → `models.providers.*.apiKey`。

**非同期完了フィールド:**

- `asyncCompletion.directSend`: `true` の場合、完了した非同期の `music_generate`
  および `video_generate` タスクは、まずチャネルへの直接配信を試みます。デフォルト: `false`
  （旧来のリクエスターセッション復帰/model配信経路）。

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

session tool（`sessions_list`, `sessions_history`, `sessions_send`）でどのセッションを対象にできるかを制御します。

デフォルト: `tree`（現在のセッション + そこからspawnされたセッション、たとえばsubagent）。

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

注記:

- `self`: 現在のsession keyのみ。
- `tree`: 現在のセッション + 現在のセッションからspawnされたセッション（subagent）。
- `agent`: 現在のagent idに属する任意のセッション（同じagent idの下でper-senderセッションを実行している場合、他のユーザーも含まれることがあります）。
- `all`: 任意のセッション。チャネル横断のagent targetingには、引き続き `tools.agentToAgent` が必要です。
- sandbox clamp: 現在のセッションがsandbox化されていて、`agents.defaults.sandbox.sessionToolsVisibility="spawned"` の場合、`tools.sessions.visibility="all"` であっても visibilityは `tree` に強制されます。

### `tools.sessions_spawn`

`sessions_spawn` のインライン添付サポートを制御します。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: インラインファイル添付を許可するには true に設定
        maxTotalBytes: 5242880, // 全ファイル合計で 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // 1ファイルあたり 1 MB
        retainOnSessionKeep: false, // cleanup="keep" のとき添付を保持
      },
    },
  },
}
```

注記:

- 添付は `runtime: "subagent"` の場合にのみサポートされます。ACPランタイムでは拒否されます。
- ファイルは子workspace内の `.openclaw/attachments/<uuid>/` に `.manifest.json` とともに実体化されます。
- 添付内容はtranscript永続化から自動的にredactされます。
- Base64入力は、厳格な文字種/パディングチェックと、デコード前のサイズガードで検証されます。
- ファイル権限は、ディレクトリが `0700`、ファイルが `0600` です。
- クリーンアップは `cleanup` ポリシーに従います: `delete` は常に添付を削除し、`keep` は `retainOnSessionKeep: true` の場合のみ保持します。

<a id="toolsexperimental"></a>

### `tools.experimental`

実験的な組み込みtoolフラグです。strict-agentic GPT-5の自動有効化ルールが適用される場合を除き、デフォルトはoffです。

```json5
{
  tools: {
    experimental: {
      planTool: true, // 実験的な update_plan を有効化
    },
  },
}
```

注記:

- `planTool`: 自明でない複数ステップ作業の追跡用に、構造化された `update_plan` toolを有効にします。
- デフォルト: `agents.defaults.embeddedPi.executionContract`（またはagentごとの上書き）が、OpenAIまたはOpenAI CodexのGPT-5系実行に対して `"strict-agentic"` に設定されている場合を除き `false`。その範囲外でもtoolを強制的に有効にするには `true` を設定し、strict-agentic GPT-5実行でもoffのままにするには `false` を設定します。
- 有効時は、system promptにも使用ガイダンスが追加され、modelがこれを実質的な作業にのみ使い、`in_progress` のステップを最大1つだけ保つようにします。

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

- `model`: spawnされたsub-agentのデフォルトmodel。省略時は、sub-agentは呼び出し元のmodelを継承します。
- `allowAgents`: リクエスターagentが自身の `subagents.allowAgents` を設定していない場合の、`sessions_spawn` 用のターゲットagent idデフォルトallowlist（`["*"]` = 任意、デフォルト: 同じagentのみ）。
- `runTimeoutSeconds`: tool callで `runTimeoutSeconds` が省略された場合の、`sessions_spawn` のデフォルトタイムアウト（秒）。`0` はタイムアウトなしを意味します。
- subagentごとのtoolポリシー: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## Custom Providerとbase URL

OpenClawは組み込みmodelカタログを使用します。Custom Providerはconfig内の `models.providers` または `~/.openclaw/agents/<agentId>/agent/models.json` から追加します。

```json5
{
  models: {
    mode: "merge", // merge（デフォルト） | replace
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

- Custom認証が必要な場合は、`authHeader: true` + `headers` を使用します。
- agent configルートは `OPENCLAW_AGENT_DIR` で上書きします（または旧式の環境変数エイリアス `PI_CODING_AGENT_DIR`）。
- 一致するprovider IDに対するマージ優先順位:
  - 空でないagentの `models.json` `baseUrl` が優先されます。
  - 空でないagentの `apiKey` は、そのproviderが現在のconfig/auth-profileコンテキストでSecretRef管理されていない場合にのみ優先されます。
  - SecretRef管理されたproviderの `apiKey` 値は、解決済みシークレットを永続化する代わりに、ソースマーカー（env ref用の `ENV_VAR_NAME`、file/exec ref用の `secretref-managed`）から更新されます。
  - SecretRef管理されたprovider header値は、ソースマーカー（env ref用の `secretref-env:ENV_VAR_NAME`、file/exec ref用の `secretref-managed`）から更新されます。
  - 空または未設定のagent `apiKey`/`baseUrl` は、config内の `models.providers` にフォールバックします。
  - 一致するmodelの `contextWindow`/`maxTokens` には、明示config値と暗黙カタログ値のうち高い方が使われます。
  - 一致するmodelの `contextTokens` は、存在する場合、明示的なランタイム上限を保持します。ネイティブmodelメタデータを変えずに有効コンテキストを制限したい場合に使ってください。
  - configで `models.json` を完全に書き換えたい場合は `models.mode: "replace"` を使用します。
  - マーカーの永続化はソース主導です: マーカーは解決済みランタイムシークレット値からではなく、アクティブなソースconfigスナップショット（解決前）から書き込まれます。

### providerフィールド詳細

- `models.mode`: providerカタログ動作（`merge` または `replace`）。
- `models.providers`: provider idをキーにしたCustom Providerマップ。
  - 安全な編集: 追加的な更新には `openclaw config set models.providers.<id> '<json>' --strict-json --merge` または `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` を使用します。`config set` は、`--replace` を渡さない限り破壊的な置換を拒否します。
- `models.providers.*.api`: リクエストアダプター（`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` など）。
- `models.providers.*.apiKey`: provider認証情報（SecretRef/env置換を推奨）。
- `models.providers.*.auth`: 認証戦略（`api-key`, `token`, `oauth`, `aws-sdk`）。
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` 用に、リクエストへ `options.num_ctx` を注入します（デフォルト: `true`）。
- `models.providers.*.authHeader`: 必要な場合に、`Authorization` headerでの認証情報転送を強制します。
- `models.providers.*.baseUrl`: 上流APIのbase URL。
- `models.providers.*.headers`: proxy/tenantルーティング用の追加の静的header。
- `models.providers.*.request`: model-provider HTTPリクエストの転送上書き。
  - `request.headers`: 追加header（providerデフォルトとマージ）。値はSecretRefを受け付けます。
  - `request.auth`: 認証戦略上書き。モード: `"provider-default"`（provider組み込み認証を使用）、`"authorization-bearer"`（`token` と併用）、`"header"`（`headerName`, `value`, 任意の `prefix` と併用）。
  - `request.proxy`: HTTP proxy上書き。モード: `"env-proxy"`（`HTTP_PROXY`/`HTTPS_PROXY` 環境変数を使用）、`"explicit-proxy"`（`url` と併用）。両モードとも任意の `tls` サブオブジェクトを受け付けます。
  - `request.tls`: 直接接続用のTLS上書き。フィールド: `ca`, `cert`, `key`, `passphrase`（すべてSecretRefを受け付けます）、`serverName`, `insecureSkipVerify`。
  - `request.allowPrivateNetwork`: `true` の場合、DNSがプライベート、CGNAT、または類似レンジへ解決されるときに、provider HTTP fetchガード経由で `baseUrl` へのHTTPSを許可します（信頼できるセルフホストOpenAI互換endpoint用のoperator opt-in）。WebSocketはheader/TLSに同じ `request` を使用しますが、そのfetch SSRFガードは使いません。デフォルト `false`。
- `models.providers.*.models`: 明示的なprovider modelカタログエントリ。
- `models.providers.*.models.*.contextWindow`: ネイティブmodelコンテキストウィンドウメタデータ。
- `models.providers.*.models.*.contextTokens`: 任意のランタイムコンテキスト上限。modelのネイティブ `contextWindow` より小さい有効コンテキスト予算にしたい場合に使用します。
- `models.providers.*.models.*.compat.supportsDeveloperRole`: 任意の互換ヒント。`api: "openai-completions"` で非空の非ネイティブ `baseUrl`（hostが `api.openai.com` ではない）の場合、OpenClawはランタイムでこれを強制的に `false` にします。空または省略された `baseUrl` では、デフォルトのOpenAI動作を維持します。
- `models.providers.*.models.*.compat.requiresStringContent`: 文字列のみのOpenAI互換chat endpoint向けの任意の互換ヒント。`true` の場合、OpenClawはリクエスト送信前に、純粋なテキスト `messages[].content` 配列をプレーン文字列へフラット化します。
- `plugins.entries.amazon-bedrock.config.discovery`: Bedrock自動検出設定のルート。
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: 暗黙的な検出のオン/オフ。
- `plugins.entries.amazon-bedrock.config.discovery.region`: 検出用のAWSリージョン。
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: 対象を絞った検出用の任意のprovider-idフィルター。
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: 検出更新のポーリング間隔。
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: 検出されたmodel用のフォールバックコンテキストウィンドウ。
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: 検出されたmodel用のフォールバック最大出力token数。

### providerの例

<Accordion title="Cerebras（GLM 4.6 / 4.7）">

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

Cerebrasには `cerebras/zai-glm-4.7` を使用し、Z.AI直通には `zai/glm-4.7` を使用します。

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

`OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）を設定してください。Zenカタログには `opencode/...` 参照を使い、Goカタログには `opencode-go/...` 参照を使います。ショートカット: `openclaw onboard --auth-choice opencode-zen` または `openclaw onboard --auth-choice opencode-go`。

</Accordion>

<Accordion title="Z.AI（GLM-4.7）">

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

`ZAI_API_KEY` を設定してください。`z.ai/*` と `z-ai/*` は受け付けられるaliasです。ショートカット: `openclaw onboard --auth-choice zai-api-key`。

- 一般endpoint: `https://api.z.ai/api/paas/v4`
- Coding endpoint（デフォルト）: `https://api.z.ai/api/coding/paas/v4`
- 一般endpoint用には、base URL上書き付きのCustom Providerを定義してください。

</Accordion>

<Accordion title="Moonshot AI（Kimi）">

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

中国endpointには `baseUrl: "https://api.moonshot.cn/v1"` または `openclaw onboard --auth-choice moonshot-api-key-cn` を使用します。

ネイティブMoonshot endpointは、共有
`openai-completions` 転送上でのストリーミング使用互換性を広告しており、OpenClawは
組み込みprovider id単独ではなく、そのendpoint capabilityに基づいて動作を決定します。

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

Anthropic互換の組み込みproviderです。ショートカット: `openclaw onboard --auth-choice kimi-code-api-key`。

</Accordion>

<Accordion title="Synthetic（Anthropic互換）">

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

base URLには `/v1` を含めないでください（Anthropicクライアントが追加します）。ショートカット: `openclaw onboard --auth-choice synthetic-api-key`。

</Accordion>

<Accordion title="MiniMax M2.7（直通）">

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

`MINIMAX_API_KEY` を設定してください。ショートカット:
`openclaw onboard --auth-choice minimax-global-api` または
`openclaw onboard --auth-choice minimax-cn-api`。
modelカタログのデフォルトはM2.7のみです。
Anthropic互換ストリーミング経路では、OpenClawは明示的に `thinking` を設定しない限り、
デフォルトでMiniMax thinkingを無効にします。`/fast on` または
`params.fastMode: true` は `MiniMax-M2.7` を
`MiniMax-M2.7-highspeed` に書き換えます。

</Accordion>

<Accordion title="ローカルmodel（LM Studio）">

[Local Models](/ja-JP/gateway/local-models) を参照してください。要点: 十分なハードウェア上で、LM Studio Responses API経由の大規模ローカルmodelを実行し、フォールバック用にホスト型modelをマージしたままにします。

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // またはプレーンテキスト文字列
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: バンドル済みSkills専用の任意allowlistです（managed/workspace Skillsには影響しません）。
- `load.extraDirs`: 追加の共有skillルートです（最も低い優先順位）。
- `install.preferBrew`: true の場合、`brew` が利用可能なら、
  他のインストーラー種別へフォールバックする前にHomebrewインストーラーを優先します。
- `install.nodeManager`: `metadata.openclaw.install`
  spec用のnodeインストーラー優先設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false` は、skillがバンドル済み/インストール済みでも無効化します。
- `entries.<skillKey>.apiKey`: プライマリenv varを宣言するskill向けの簡易設定です（プレーンテキスト文字列またはSecretRefオブジェクト）。

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

- `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions`、および `plugins.load.paths` から読み込まれます。
- 検出は、ネイティブOpenClaw Pluginに加えて、互換性のあるCodex bundleとClaude bundle、manifestなしのClaudeデフォルトレイアウトbundleも受け付けます。
- **config変更にはGateway再起動が必要です。**
- `allow`: 任意allowlist（列挙されたPluginのみ読み込み）。`deny` が優先されます。
- `plugins.entries.<id>.apiKey`: PluginレベルのAPI key簡易フィールド（Pluginがサポートしている場合）。
- `plugins.entries.<id>.env`: Pluginスコープのenv varマップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、coreは `before_prompt_build` をブロックし、旧式 `before_agent_start` のprompt変更フィールドを無視します。一方で旧式の `modelOverride` と `providerOverride` は保持します。ネイティブPlugin hookと、サポートされたbundle提供hookディレクトリに適用されます。
- `plugins.entries.<id>.subagent.allowModelOverride`: このPluginがバックグラウンドsubagent実行に対して、実行ごとの `provider` および `model` 上書きを要求することを明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼されたsubagent上書き用の、正規 `provider/model` ターゲット任意allowlist。任意のmodelを許可したい場合にのみ `"*"` を使用してください。
- `plugins.entries.<id>.config`: Plugin定義のconfigオブジェクト（利用可能な場合はネイティブOpenClaw Plugin schemaで検証されます）。
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch provider設定。
  - `apiKey`: Firecrawl API key（SecretRefを受け付けます）。`plugins.entries.firecrawl.config.webSearch.apiKey`、旧式 `tools.web.fetch.firecrawl.apiKey`、または `FIRECRAWL_API_KEY` env var にフォールバックします。
  - `baseUrl`: Firecrawl API base URL（デフォルト: `https://api.firecrawl.dev`）。
  - `onlyMainContent`: ページからメインコンテンツのみを抽出します（デフォルト: `true`）。
  - `maxAgeMs`: キャッシュの最大経過時間（ミリ秒、デフォルト: `172800000` / 2日）。
  - `timeoutSeconds`: scrapeリクエストのタイムアウト秒数（デフォルト: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok web search）設定。
  - `enabled`: X Search providerを有効にします。
  - `model`: 検索に使うGrok model（例: `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`: Dreaming設定。[Dreaming](/ja-JP/concepts/dreaming) でフェーズと閾値を参照してください。
  - `enabled`: Dreamingのマスタースイッチ（デフォルト `false`）。
  - `frequency`: 各フルDreaming sweepのCron周期（デフォルト `"0 3 * * *"`）。
  - フェーズポリシーと閾値は実装詳細です（ユーザー向けconfigキーではありません）。
- 完全なmemory configは [Memory configuration reference](/ja-JP/reference/memory-config) にあります:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効なClaude bundle Pluginは、`settings.json` から埋め込みPiデフォルトも提供できます。OpenClawはそれらを生のOpenClaw config patchとしてではなく、サニタイズ済みagent設定として適用します。
- `plugins.slots.memory`: アクティブなmemory Plugin idを選択します。memory Pluginを無効にするには `"none"`。
- `plugins.slots.contextEngine`: アクティブなcontext engine Plugin idを選択します。別のengineをインストールして選択しない限り、デフォルトは `"legacy"` です。
- `plugins.installs`: `openclaw plugins update` が使うCLI管理のインストールメタデータ。
  - `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt` を含みます。
  - `plugins.installs.*` は管理状態として扱ってください。手動編集よりCLIコマンドを優先してください。

[Plugins](/ja-JP/tools/plugin) を参照してください。

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 信頼できるプライベートネットワークアクセス時のみopt in
      // allowPrivateNetwork: true, // 旧式の別名
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

- `evaluateEnabled: false` は `act:evaluate` と `wait --fn` を無効にします。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定時に無効なので、browserナビゲーションはデフォルトで厳格なままです。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` は、プライベートネットワークbrowserナビゲーションを意図的に信頼する場合にのみ設定してください。
- 厳格モードでは、リモートCDPプロファイルendpoint（`profiles.*.cdpUrl`）も、到達性/検出チェック中に同じプライベートネットワークブロックの対象になります。
- `ssrfPolicy.allowPrivateNetwork` は旧式の別名として引き続きサポートされます。
- 厳格モードでは、明示的な例外に `ssrfPolicy.hostnameAllowlist` と `ssrfPolicy.allowedHostnames` を使用します。
- リモートプロファイルはattach-onlyです（start/stop/resetは無効）。
- `profiles.*.cdpUrl` は `http://`, `https://`, `ws://`, `wss://` を受け付けます。
  OpenClawに `/json/version` を検出させたい場合はHTTP(S)を使い、
  providerが直接のDevTools WebSocket URLを提供する場合はWS(S)
  を使ってください。
- `existing-session` プロファイルはCDPの代わりにChrome MCPを使用し、
  選択したhost上、または接続済みbrowser Node経由でattachできます。
- `existing-session` プロファイルは `userDataDir` を設定することで、
  BraveやEdgeのような特定のChromium系browserプロファイルを対象にできます。
- `existing-session` プロファイルは、現在のChrome MCPルート制限を維持します:
  CSSセレクター指定ではなくsnapshot/refベースのアクション、単一ファイルupload
  hook、dialog timeout上書きなし、`wait --load networkidle` なし、
  `responsebody`、PDF export、download interception、batch actionもなし。
- ローカル管理の `openclaw` プロファイルは `cdpPort` と `cdpUrl` を自動割り当てします。リモートCDPには
  `cdpUrl` を明示設定する場合のみ指定してください。
- 自動検出順序: デフォルトbrowserがChromium系ならそれ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- Control service: loopbackのみ（portは `gateway.port` から導出、デフォルト `18791`）。
- `extraArgs` は、ローカルChromium起動へ追加のlaunchフラグを付加します（例:
  `--disable-gpu`、windowサイズ指定、debugフラグ）。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, 短いテキスト, image URL, または data URI
    },
  },
}
```

- `seamColor`: ネイティブapp UIクローム用のアクセントカラーです（Talk Modeバブルの色合いなど）。
- `assistant`: Control UI ID上書き。アクティブagent IDにフォールバックします。

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
      // password: "your-password", // または OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // mode=trusted-proxy 用。/gateway/trusted-proxy-auth を参照
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
      // allowExternalEmbedUrls: false, // 危険: 絶対外部 http(s) embed URL を許可
      // allowedOrigins: ["https://control.example.com"], // 非loopback Control UIに必要
      // dangerouslyAllowHostHeaderOriginFallback: false, // 危険なHost-header originフォールバックモード
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
    // 任意。デフォルトは false。
    allowRealIpFallback: false,
    tools: {
      // 追加の /tools/invoke HTTP deny
      deny: ["browser"],
      // デフォルトのHTTP denyリストからtoolを外す
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

<Accordion title="Gatewayフィールド詳細">

- `mode`: `local`（Gatewayを実行）または `remote`（リモートGatewayへ接続）。`local` でない限りGatewayは起動を拒否します。
- `port`: WS + HTTP用の単一多重化port。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`, `loopback`（デフォルト）, `lan`（`0.0.0.0`）, `tailnet`（Tailscale IPのみ）, または `custom`。
- **旧式bind alias**: `gateway.bind` にはhost alias（`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`）ではなく、bind mode値（`auto`, `loopback`, `lan`, `tailnet`, `custom`）を使用してください。
- **Docker注記**: デフォルトの `loopback` bindはコンテナー内の `127.0.0.1` で待ち受けます。Docker bridge networking（`-p 18789:18789`）では、トラフィックは `eth0` に到達するため、Gatewayへ到達できません。`--network host` を使用するか、全インターフェースで待ち受けるように `bind: "lan"`（または `customBindHost: "0.0.0.0"` を伴う `bind: "custom"`）を設定してください。
- **Auth**: デフォルトで必須です。loopback以外のbindではGateway authが必要です。実際には、共有token/password、または `gateway.auth.mode: "trusted-proxy"` を使うID認識リバースプロキシを意味します。オンボーディングウィザードはデフォルトでtokenを生成します。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されている場合（SecretRefを含む）、`gateway.auth.mode` を `token` または `password` に明示設定してください。両方が設定されていてmodeが未設定の場合、起動およびサービスのインストール/修復フローは失敗します。
- `gateway.auth.mode: "none"`: 明示的なno-auth mode。信頼できるlocal loopback構成でのみ使用してください。これは意図的にオンボーディングプロンプトでは提供されません。
- `gateway.auth.mode: "trusted-proxy"`: authをID認識リバースプロキシに委譲し、`gateway.trustedProxies` からのID headerを信頼します（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。このmodeは**非loopback**のproxy sourceを想定します。同一hostのloopbackリバースプロキシはtrusted-proxy authの条件を満たしません。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale ServeのID headerがControl UI/WebSocket authを満たせます（`tailscale whois` で検証）。HTTP API endpointはそのTailscale header authを**使いません**。代わりに通常のGateway HTTP auth modeに従います。このtoken不要フローはGateway hostが信頼されていることを前提とします。`tailscale.mode = "serve"` のときデフォルトは `true` です。
- `gateway.auth.rateLimit`: 任意の認証失敗リミッター。client IPごと、およびauth scopeごとに適用されます（共有シークレットとdevice-tokenは独立して追跡されます）。ブロックされた試行は `429` + `Retry-After` を返します。
  - 非同期のTailscale Serve Control UI経路では、同じ `{scope, clientIp}` に対する失敗試行は、失敗書き込み前に直列化されます。そのため、同じclientからの並行した不正試行は、両方が単なる不一致として通過してしまうのではなく、2回目のリクエストでリミッターに達することがあります。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。localhostトラフィックにもrate-limitを意図的に適用したい場合（テスト構成や厳格なproxyデプロイ）には `false` を設定してください。
- browser由来のWS auth試行は、loopback免除を無効化した状態で常にスロットルされます（browserベースのlocalhost総当たりへの多重防御）。
- loopback上では、それらのbrowser由来lockoutは正規化された `Origin`
  値ごとに分離されるため、あるlocalhost originからの繰り返し失敗が、
  別のoriginを自動的にlock outすることはありません。
- `tailscale.mode`: `serve`（tailnetのみ、loopback bind）または `funnel`（公開、auth必須）。
- `controlUi.allowedOrigins`: Gateway WebSocket接続用の明示的なbrowser origin allowlist。browser clientが非loopback originから来る想定の場合に必要です。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host-header originポリシーに意図的に依存するデプロイ向けに、Host-header originフォールバックを有効にする危険なmodeです。
- `remote.transport`: `ssh`（デフォルト）または `direct`（ws/wss）。`direct` の場合、`remote.url` は `ws://` または `wss://` である必要があります。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 信頼できるプライベートネットワークIPへの平文 `ws://` を許可するクライアント側の緊急用上書きです。デフォルトでは平文はloopback専用のままです。
- `gateway.remote.token` / `.password` はリモートclient認証情報フィールドです。これ自体でGateway authを設定するわけではありません。
- `gateway.push.apns.relay.baseUrl`: 公式/TestFlight iOSビルドがrelayバックの登録をGatewayへ公開した後に使用する、外部APNs relayのベースHTTPS URLです。このURLはiOSビルドに組み込まれたrelay URLと一致している必要があります。
- `gateway.push.apns.relay.timeoutMs`: Gatewayからrelayへの送信タイムアウト（ミリ秒）。デフォルトは `10000`。
- relayバックの登録は特定のGateway IDに委譲されます。ペアリング済みiOS appは `gateway.identity.get` を取得し、そのIDをrelay登録に含め、登録スコープの送信権限をGatewayへ転送します。別のGatewayはその保存済み登録を再利用できません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記relay config用の一時的なenv上書きです。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL向けの開発専用エスケープハッチです。本番relay URLはHTTPSのままにすべきです。
- `gateway.channelHealthCheckMinutes`: チャネルhealth monitor間隔（分）。health-monitor再起動をグローバルに無効化するには `0` を設定します。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: stale-socket閾値（分）。これは `gateway.channelHealthCheckMinutes` 以上にしてください。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: 1時間のローリング期間内に、チャネル/アカウントごとに許可されるhealth-monitor再起動の最大数。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバルmonitorを有効に保ったまま、チャネルごとにhealth-monitor再起動をopt-outする設定。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 複数アカウントチャネル向けのアカウントごとの上書き。設定されている場合、チャネルレベル上書きより優先されます。
- ローカルGateway call pathは、`gateway.auth.*` が未設定の場合にのみ `gateway.remote.*` をフォールバックとして使用できます。
- `gateway.auth.token` / `gateway.auth.password` がSecretRef経由で明示設定されていて未解決の場合、解決はクローズドフェイルします（リモートフォールバックで隠蔽されません）。
- `trustedProxies`: TLS終端または転送client headerを注入するリバースプロキシのIPです。自分で管理するproxyのみを列挙してください。loopbackエントリは、同一host proxy/ローカル検出構成（たとえばTailscale Serveやローカルリバースプロキシ）では依然として有効ですが、loopbackリクエストが `gateway.auth.mode: "trusted-proxy"` の対象になるわけでは**ありません**。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` がないときに `X-Real-IP` を受け入れます。fail-closed動作のためデフォルトは `false`。
- `gateway.tools.deny`: HTTP `POST /tools/invoke` 用に追加でブロックするtool名（デフォルトdenyリストを拡張）。
- `gateway.tools.allow`: デフォルトHTTP denyリストからtool名を取り除きます。

</Accordion>

### OpenAI互換endpoint

- Chat Completions: デフォルトでは無効。`gateway.http.endpoints.chatCompletions.enabled: true` で有効化します。
- Responses API: `gateway.http.endpoints.responses.enabled`。
- Responses URL入力の強化:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空のallowlistは未設定として扱われます。URL取得を無効にするには
    `gateway.http.endpoints.responses.files.allowUrl=false`
    および/または `gateway.http.endpoints.responses.images.allowUrl=false` を使用してください。
- 任意のresponse強化header:
  - `gateway.http.securityHeaders.strictTransportSecurity`（自分で管理するHTTPS originに対してのみ設定してください。[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts) を参照）

### 複数インスタンスの分離

1台のhost上で、固有のportとstate dirを持つ複数のGatewayを実行します。

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利フラグ: `--dev`（`~/.openclaw-dev` + port `19001` を使用）、`--profile <name>`（`~/.openclaw-<name>` を使用）。

[Multiple Gateways](/ja-JP/gateway/multiple-gateways) を参照してください。

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

- `enabled`: Gateway listenerでTLS終端（HTTPS/WSS）を有効にします（デフォルト: `false`）。
- `autoGenerate`: 明示的なファイルが設定されていない場合に、ローカル自己署名cert/keyペアを自動生成します。ローカル/開発用途専用です。
- `certPath`: TLS certificateファイルのファイルシステムパス。
- `keyPath`: TLS private keyファイルのファイルシステムパス。権限制限をかけてください。
- `caPath`: client検証またはカスタムtrust chain用の任意CA bundleパス。

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

- `mode`: config編集をランタイムへどう適用するかを制御します。
  - `"off"`: ライブ編集を無視します。変更には明示的な再起動が必要です。
  - `"restart"`: config変更時に常にGatewayプロセスを再起動します。
  - `"hot"`: 再起動せずにプロセス内で変更を適用します。
  - `"hybrid"`（デフォルト）: まずhot reloadを試し、必要なら再起動へフォールバックします。
- `debounceMs`: config変更を適用する前のdebounceウィンドウ（ミリ秒、非負整数）。
- `deferralTimeoutMs`: 実行中の処理を待つ最大時間（ミリ秒）で、超えると再起動を強制します（デフォルト: `300000` = 5分）。

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

Auth: `Authorization: Bearer <token>` または `x-openclaw-token: <token>`。
クエリ文字列のhook tokenは拒否されます。

検証と安全性に関する注記:

- `hooks.enabled=true` には空でない `hooks.token` が必要です。
- `hooks.token` は `gateway.auth.token` と**異なる**必要があります。Gateway tokenの再利用は拒否されます。
- `hooks.path` は `/` にできません。`/hooks` のような専用サブパスを使用してください。
- `hooks.allowRequestSessionKey=true` の場合、`hooks.allowedSessionKeyPrefixes` を制限してください（例: `["hook:"]`）。
- mappingまたはpresetがテンプレート化された `sessionKey` を使う場合は、`hooks.allowedSessionKeyPrefixes` と `hooks.allowRequestSessionKey=true` を設定してください。静的mapping keyにはそのopt-inは不要です。

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエストペイロード内の `sessionKey` は、`hooks.allowRequestSessionKey=true` の場合にのみ受け付けられます（デフォルト: `false`）。
- `POST /hooks/<name>` → `hooks.mappings` 経由で解決
  - テンプレートレンダリングされたmapping `sessionKey` 値は外部供給として扱われ、これも `hooks.allowRequestSessionKey=true` が必要です。

<Accordion title="mapping詳細">

- `match.path` は `/hooks` の後のサブパスに一致します（例: `/hooks/gmail` → `gmail`）。
- `match.source` は汎用パス向けにペイロードフィールドへ一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取ります。
- `transform` は、hook actionを返すJS/TS moduleを指せます。
  - `transform.module` は相対パスでなければならず、`hooks.transformsDir` 内に留まります（絶対パスとトラバーサルは拒否されます）。
- `agentId` は特定のagentへルーティングします。不明なIDはデフォルトへフォールバックします。
- `allowedAgentIds`: 明示ルーティングを制限します（`*` または省略 = すべて許可、`[]` = すべて拒否）。
- `defaultSessionKey`: 明示的な `sessionKey` がないhook agent実行向けの任意の固定session key。
- `allowRequestSessionKey`: `/hooks/agent` 呼び出し元およびテンプレート駆動のmapping session keyに `sessionKey` を設定することを許可します（デフォルト: `false`）。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値（request + mapping）向けの任意プレフィックスallowlist。例: `["hook:"]`。いずれかのmappingまたはpresetがテンプレート化 `sessionKey` を使う場合は必須になります。
- `deliver: true` は最終返信をチャネルへ送信します。`channel` のデフォルトは `last` です。
- `model` はこのhook実行のLLMを上書きします（modelカタログが設定されている場合は、その許可対象である必要があります）。

</Accordion>

### Gmail連携

- 組み込みのGmail presetは `sessionKey: "hook:gmail:{{messages[0].id}}"` を使用します。
- そのメッセージごとのルーティングを維持する場合は、`hooks.allowRequestSessionKey: true` を設定し、`hooks.allowedSessionKeyPrefixes` をGmail名前空間に一致するよう制限してください。たとえば `["hook:", "hook:gmail:"]`。
- `hooks.allowRequestSessionKey: false` が必要な場合は、テンプレート化されたデフォルトの代わりに静的な `sessionKey` でpresetを上書きしてください。

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

- 設定されている場合、Gatewayは起動時に自動で `gog gmail watch serve` を開始します。無効にするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。
- Gatewayと並行して別の `gog gmail watch serve` を実行しないでください。

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // または OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- agentが編集可能なHTML/CSS/JSとA2UIを、Gateway port配下のHTTPで提供します:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカル専用: `gateway.bind: "loopback"`（デフォルト）のままにしてください。
- 非loopback bind: canvasルートには、他のGateway HTTPサーフェスと同様にGateway auth（token/password/trusted-proxy）が必要です。
- Node WebViewは通常auth headerを送信しません。Nodeがペアリングされ接続されると、Gatewayはcanvas/A2UIアクセス用のNodeスコープcapability URLを公開します。
- Capability URLはアクティブなNode WSセッションに紐づき、短時間で失効します。IPベースのフォールバックは使われません。
- 配信されるHTMLにlive-reload clientを注入します。
- 空の場合はstarter `index.html` を自動作成します。
- A2UIも `/__openclaw__/a2ui/` で配信します。
- 変更にはGateway再起動が必要です。
- 大きなディレクトリや `EMFILE` エラーではlive reloadを無効にしてください。

---

## Discovery

### mDNS（Bonjour）

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal`（デフォルト）: TXT recordから `cliPath` + `sshPort` を省略します。
- `full`: `cliPath` + `sshPort` を含めます。
- hostnameのデフォルトは `openclaw`。`OPENCLAW_MDNS_HOSTNAME` で上書きします。

### 広域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 配下にunicast DNS-SD zoneを書き込みます。ネットワークをまたぐ検出には、DNSサーバー（推奨: CoreDNS）+ Tailscale split DNS と組み合わせてください。

セットアップ: `openclaw dns setup --apply`。

---

## 環境

### `env`（インラインenv var）

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

- インラインenv varは、プロセスenvにそのキーがない場合にのみ適用されます。
- `.env` ファイル: CWDの `.env` + `~/.openclaw/.env`（どちらも既存varを上書きしません）。
- `shellEnv`: ログインshell profileから、必要な欠落キーを取り込みます。
- 完全な優先順位は [Environment](/ja-JP/help/environment) を参照してください。

### env var置換

任意のconfig文字列内で `${VAR_NAME}` によりenv varを参照できます。

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 一致するのは大文字名のみ: `[A-Z_][A-Z0-9_]*`。
- 欠落または空のvarは、config読み込み時にエラーになります。
- リテラルの `${VAR}` には `$${VAR}` でエスケープします。
- `$include` でも動作します。

---

## Secrets

SecretRefは追加的です。平文値も引き続き使えます。

### `SecretRef`

1つのオブジェクト形状を使用します:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` パターン: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` のidパターン: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` のid: 絶対JSON pointer（例: `"/providers/openai/apiKey"`）
- `source: "exec"` のidパターン: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` のidには、`.` または `..` のスラッシュ区切りパスセグメントを含めてはいけません（例: `a/../b` は拒否されます）

### サポートされる認証情報サーフェス

- 正規マトリクス: [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface)
- `secrets apply` はサポートされている `openclaw.json` 認証情報パスを対象にします。
- `auth-profiles.json` のrefも、ランタイム解決とaudit対象に含まれます。

### Secret provider設定

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // 任意の明示env provider
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

注記:

- `file` providerは `mode: "json"` と `mode: "singleValue"` をサポートします（singleValue modeでは `id` は `"value"` でなければなりません）。
- `exec` providerには絶対 `command` パスが必要で、stdin/stdout上のprotocol payloadを使用します。
- デフォルトでは、symlink commandパスは拒否されます。解決後のターゲットパスを検証しつつsymlinkパスを許可するには `allowSymlinkCommand: true` を設定してください。
- `trustedDirs` が設定されている場合、trusted-dirチェックは解決後のターゲットパスに適用されます。
- `exec` 子環境はデフォルトで最小限です。必要な変数は `passEnv` で明示的に渡してください。
- Secret refはアクティベーション時にメモリ内スナップショットへ解決され、その後のリクエストパスはそのスナップショットのみを読み取ります。
- 有効サーフェスフィルタリングはアクティベーション中に適用されます: 有効なサーフェス上の未解決refは起動/リロードを失敗させ、非アクティブサーフェスは診断付きでスキップされます。

---

## Authストレージ

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

- agentごとのprofileは `<agentDir>/auth-profiles.json` に保存されます。
- `auth-profiles.json` は、静的認証モード向けに値レベルref（`api_key` には `keyRef`、`token` には `tokenRef`）をサポートします。
- OAuth modeのprofile（`auth.profiles.<id>.mode = "oauth"`）は、SecretRefバックのauth-profile認証情報をサポートしません。
- 静的ランタイム認証情報はメモリ内の解決済みスナップショットから取得され、旧式の静的 `auth.json` エントリは見つかった時点で除去されます。
- 旧式OAuthのimport元は `~/.openclaw/credentials/oauth.json` です。
- [OAuth](/ja-JP/concepts/oauth) を参照してください。
- Secretsランタイム動作と `audit/configure/apply` ツール: [Secrets Management](/ja-JP/gateway/secrets)。

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

- `billingBackoffHours`: 真の
  billing/クレジット不足エラーによりprofileが失敗したときの、ベースbackoff時間（時間単位、デフォルト: `5`）。明示的なbillingテキストは
  `401`/`403` 応答でもここに入ることがありますが、provider固有のテキスト
  matcherはそのproviderに限定されたままです（例: OpenRouterの
  `Key limit exceeded`）。再試行可能なHTTP `402` のusage-windowまたは
  organization/workspaceの利用上限メッセージは、代わりに `rate_limit` 経路に残ります。
- `billingBackoffHoursByProvider`: billing backoff時間の任意providerごとの上書き。
- `billingMaxHours`: billing backoffの指数的増加に対する上限時間（デフォルト: `24`）。
- `authPermanentBackoffMinutes`: 高信頼度の `auth_permanent` 失敗に対するベースbackoff（分単位、デフォルト: `10`）。
- `authPermanentMaxMinutes`: `auth_permanent` backoff増加に対する上限分数（デフォルト: `60`）。
- `failureWindowHours`: backoffカウンターに使うローリングウィンドウ時間（デフォルト: `24`）。
- `overloadedProfileRotations`: overloadedエラー時に、model fallbackへ切り替える前に許可する同一provider auth-profileローテーションの最大数（デフォルト: `1`）。`ModelNotReadyException` のようなprovider-busy形状はここに入ります。
- `overloadedBackoffMs`: overloaded provider/profileローテーションを再試行する前の固定待機時間（デフォルト: `0`）。
- `rateLimitedProfileRotations`: rate-limitエラー時に、model fallbackへ切り替える前に許可する同一provider auth-profileローテーションの最大数（デフォルト: `1`）。そのrate-limitバケットには、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted` のようなprovider形状テキストが含まれます。

---

## Logging

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

- デフォルトlogファイル: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`。
- 固定パスにするには `logging.file` を設定してください。
- `consoleLevel` は `--verbose` のとき `debug` に上がります。
- `maxFileBytes`: 書き込み抑止前の最大logファイルサイズ（バイト、正の整数。デフォルト: `524288000` = 500 MB）。本番デプロイでは外部log rotationを使用してください。

---

## Diagnostics

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

- `enabled`: 計測出力のマスタートグルです（デフォルト: `true`）。
- `flags`: 対象を絞ったlog出力を有効にするflag文字列配列です（`"telegram.*"` や `"*"` のようなワイルドカードをサポート）。
- `stuckSessionWarnMs`: セッションが処理中状態のままのときに、stuck-session警告を出すまでの経過時間閾値（ミリ秒）。
- `otel.enabled`: OpenTelemetry exportパイプラインを有効にします（デフォルト: `false`）。
- `otel.endpoint`: OTel export用collector URL。
- `otel.protocol`: `"http/protobuf"`（デフォルト）または `"grpc"`。
- `otel.headers`: OTel exportリクエストとともに送信する追加のHTTP/gRPCメタデータheader。
- `otel.serviceName`: resource attribute用のservice name。
- `otel.traces` / `otel.metrics` / `otel.logs`: trace、metrics、またはlog exportを有効にします。
- `otel.sampleRate`: traceサンプリング率 `0`–`1`。
- `otel.flushIntervalMs`: 定期telemetry flush間隔（ミリ秒）。
- `cacheTrace.enabled`: 埋め込み実行用のcache traceスナップショットをlogします（デフォルト: `false`）。
- `cacheTrace.filePath`: cache trace JSONLの出力パス（デフォルト: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: cache trace出力に何を含めるかを制御します（すべてデフォルト: `true`）。

---

## Update

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

- `channel`: npm/gitインストール向けのrelease channel — `"stable"`、`"beta"`、または `"dev"`。
- `checkOnStart`: Gateway起動時にnpm updateを確認します（デフォルト: `true`）。
- `auto.enabled`: packageインストール向けのバックグラウンドauto-updateを有効にします（デフォルト: `false`）。
- `auto.stableDelayHours`: stable channelの自動適用までの最小待機時間（時間、デフォルト: `6`; 最大: `168`）。
- `auto.stableJitterHours`: stable channelロールアウトの追加分散ウィンドウ（時間、デフォルト: `12`; 最大: `168`）。
- `auto.betaCheckIntervalHours`: beta channelの確認実行間隔（時間、デフォルト: `1`; 最大: `24`）。

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

- `enabled`: グローバルACP機能ゲート（デフォルト: `false`）。
- `dispatch.enabled`: ACPセッションターンdispatch用の独立ゲート（デフォルト: `true`）。ACPコマンドを利用可能なまま実行だけブロックしたい場合は `false` に設定します。
- `backend`: デフォルトACPランタイムbackend id（登録済みACPランタイムPluginと一致している必要があります）。
- `defaultAgent`: spawn時に明示ターゲットが指定されない場合のフォールバックACPターゲットagent id。
- `allowedAgents`: ACPランタイムセッションで許可されるagent idのallowlist。空は追加制限なしを意味します。
- `maxConcurrentSessions`: 同時にアクティブにできるACPセッションの最大数。
- `stream.coalesceIdleMs`: ストリームされたテキストのアイドルflushウィンドウ（ミリ秒）。
- `stream.maxChunkChars`: ストリームされたブロック投影を分割する前の最大chunkサイズ。
- `stream.repeatSuppression`: ターンごとの繰り返しstatus/tool行を抑制します（デフォルト: `true`）。
- `stream.deliveryMode`: `"live"` は増分でストリームし、`"final_only"` はターンの終端イベントまでバッファします。
- `stream.hiddenBoundarySeparator`: 非表示toolイベントの後で可視テキストの前に入れる区切り（デフォルト: `"paragraph"`）。
- `stream.maxOutputChars`: ACPターンごとに投影されるassistant出力文字数の最大値。
- `stream.maxSessionUpdateChars`: 投影されるACP status/update行の最大文字数。
- `stream.tagVisibility`: ストリームイベント用tag名から可視性上書きbooleanへの記録。
- `runtime.ttlMinutes`: ACPセッションworkerがクリーンアップ対象になるまでのアイドルTTL（分）。
- `runtime.installCommand`: ACPランタイム環境のブートストラップ時に実行する任意のinstallコマンド。

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

- `cli.banner.taglineMode` はbannerのtaglineスタイルを制御します:
  - `"random"`（デフォルト）: ローテーションする面白い/季節のtagline。
  - `"default"`: 固定の中立tagline（`All your chats, one OpenClaw.`）。
  - `"off"`: taglineテキストなし（bannerのタイトル/バージョンは引き続き表示）。
- banner全体を隠すには（taglineだけでなく）、env `OPENCLAW_HIDE_BANNER=1` を設定してください。

---

## Wizard

CLIのガイド付きセットアップフロー（`onboard`, `configure`, `doctor`）によって書き込まれるメタデータ:

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

[Agent defaults](#agent-defaults) 配下の `agents.list` identityフィールドを参照してください。

---

## Bridge（旧式、削除済み）

現在のビルドにはTCP bridgeは含まれていません。NodeはGateway WebSocket経由で接続します。`bridge.*` キーはもはやconfig schemaの一部ではありません（削除するまで検証は失敗します。`openclaw doctor --fix` で未知キーを除去できます）。

<Accordion title="旧式bridge config（履歴用リファレンス）">

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
    webhook: "https://example.invalid/legacy", // 保存済み notify:true job用の非推奨フォールバック
    webhookToken: "replace-with-dedicated-token", // 送信Webhook auth用の任意bearer token
    sessionRetention: "24h", // duration文字列または false
    runLog: {
      maxBytes: "2mb", // デフォルト 2_000_000 bytes
      keepLines: 2000, // デフォルト 2000
    },
  },
}
```

- `sessionRetention`: 完了した分離Cron実行セッションを `sessions.json` から削除するまで保持する期間です。削除済みCron transcriptのarchiveクリーンアップも制御します。デフォルト: `24h`; 無効にするには `false` を設定します。
- `runLog.maxBytes`: 実行logファイルごとの最大サイズ（`cron/runs/<jobId>.jsonl`）で、超えると削減します。デフォルト: `2_000_000` bytes。
- `runLog.keepLines`: run-log削減が発生したときに保持される最新行数。デフォルト: `2000`。
- `webhookToken`: Cron Webhook POST配信（`delivery.mode = "webhook"`）に使うbearer token。省略時はauth headerを送信しません。
- `webhook`: 非推奨の旧式フォールバックWebhook URL（http/https）。`notify: true` がまだ残っている保存済みjobに対してのみ使われます。

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

- `maxAttempts`: 一時的エラー時のワンショットjobの最大再試行回数（デフォルト: `3`; 範囲: `0`–`10`）。
- `backoffMs`: 各再試行試行に使うbackoff待機時間の配列（ミリ秒、デフォルト: `[30000, 60000, 300000]`; 1〜10エントリ）。
- `retryOn`: 再試行を引き起こすエラー種別 — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`。省略すると全一時的種別を再試行します。

これはワンショットCron jobにのみ適用されます。繰り返しjobは別の失敗処理を使います。

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

- `enabled`: Cron jobの失敗アラートを有効にします（デフォルト: `false`）。
- `after`: アラート発火までの連続失敗回数（正の整数、最小: `1`）。
- `cooldownMs`: 同じjobに対する繰り返しアラート間の最小ミリ秒。
- `mode`: 配信モード — `"announce"` はチャネルメッセージで送信し、`"webhook"` は設定済みWebhookへPOSTします。
- `accountId`: アラート配信をスコープする任意のaccountまたはchannel id。

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

- すべてのjobにまたがるCron失敗通知のデフォルト送信先。
- `mode`: `"announce"` または `"webhook"`; 十分なターゲット情報が存在する場合、デフォルトは `"announce"`。
- `channel`: announce配信用のチャネル上書き。`"last"` は最後にわかっている配信チャネルを再利用します。
- `to`: 明示的なannounceターゲットまたはWebhook URL。Webhookモードでは必須です。
- `accountId`: 配信用の任意account上書き。
- jobごとの `delivery.failureDestination` は、このグローバルデフォルトを上書きします。
- グローバルにもjobごとにもfailure destinationが設定されていない場合、すでに `announce` で配信しているjobは、失敗時にそのprimary announce targetへフォールバックします。
- `delivery.failureDestination` は、jobのprimary `delivery.mode` が `"webhook"` でない限り、`sessionTarget="isolated"` のjobでのみサポートされます。

[Cron Jobs](/ja-JP/automation/cron-jobs) を参照してください。分離されたCron実行は [background tasks](/ja-JP/automation/tasks) として追跡されます。

---

## メディアmodelテンプレート変数

`tools.media.models[].args` で展開されるテンプレートプレースホルダー:

| Variable           | 説明 |
| ------------------ | ---- |
| `{{Body}}`         | 完全な受信メッセージ本文 |
| `{{RawBody}}`      | 生本文（履歴/送信者ラッパーなし） |
| `{{BodyStripped}}` | グループメンションを除去した本文 |
| `{{From}}`         | 送信者ID |
| `{{To}}`           | 送信先ID |
| `{{MessageSid}}`   | チャネルメッセージid |
| `{{SessionId}}`    | 現在のセッションUUID |
| `{{IsNewSession}}` | 新しいセッションが作成された場合は `"true"` |
| `{{MediaUrl}}`     | 受信メディア擬似URL |
| `{{MediaPath}}`    | ローカルメディアパス |
| `{{MediaType}}`    | メディア種別（image/audio/document/…） |
| `{{Transcript}}`   | 音声transcript |
| `{{Prompt}}`       | CLIエントリ向けに解決されたメディアprompt |
| `{{MaxChars}}`     | CLIエントリ向けに解決された最大出力文字数 |
| `{{ChatType}}`     | `"direct"` または `"group"` |
| `{{GroupSubject}}` | グループsubject（ベストエフォート） |
| `{{GroupMembers}}` | グループメンバープレビュー（ベストエフォート） |
| `{{SenderName}}`   | 送信者表示名（ベストエフォート） |
| `{{SenderE164}}`   | 送信者電話番号（ベストエフォート） |
| `{{Provider}}`     | providerヒント（whatsapp, telegram, discord など） |

---

## Config include（`$include`）

configを複数ファイルに分割します。

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

**マージ動作:**

- 単一ファイル: 含んでいるオブジェクトを置き換えます。
- ファイル配列: 順番にdeep-mergeされます（後のものが前のものを上書き）。
- 兄弟キー: includeの後にマージされます（includeされた値を上書き）。
- ネストしたinclude: 最大10階層まで。
- パス: include元ファイルからの相対で解決されますが、トップレベルconfigディレクトリ（`openclaw.json` の `dirname`）内に留まる必要があります。絶対パス/`../` 形式は、その境界内に解決される場合にのみ許可されます。
- 単一ファイルincludeに支えられたトップレベルsectionだけを変更するOpenClaw管理下の書き込みは、そのinclude先ファイルへ書き込みます。たとえば、`plugins install` は `plugins: { $include: "./plugins.json5" }` を `plugins.json5` 内で更新し、`openclaw.json` はそのままにします。
- ルートinclude、include配列、兄弟キー上書きを伴うincludeは、OpenClaw管理下の書き込みに対しては読み取り専用です。そのような書き込みはconfigをフラット化する代わりにクローズドフェイルします。
- エラー: 欠落ファイル、解析エラー、循環includeに対して明確なメッセージを出します。

---

_関連: [Configuration](/ja-JP/gateway/configuration) · [Configuration Examples](/ja-JP/gateway/configuration-examples) · [Doctor](/ja-JP/gateway/doctor)_
