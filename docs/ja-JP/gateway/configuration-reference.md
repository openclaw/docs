---
read_when:
    - 正確なフィールドレベルの設定セマンティクスまたはデフォルト値が必要です
    - channel、model、gateway、またはtoolの設定ブロックを検証しています
summary: コアのOpenClawキー、デフォルト値、および専用サブシステムリファレンスへのリンクのためのGateway設定リファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-04-21T13:35:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: f82a9a150a862c20863c187ac5c118b74aeac624e99849cf4c6e3fb56629423e
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# 設定リファレンス

`~/.openclaw/openclaw.json` のコア設定リファレンスです。タスク指向の概要については、[Configuration](/ja-JP/gateway/configuration) を参照してください。

このページでは、主要なOpenClawの設定サーフェスを扱い、サブシステムに独自のより詳細なリファレンスがある場合はそちらへリンクします。このページでは、すべてのchannel/plugin所有のコマンドカタログや、深いmemory/QMDノブを1ページにインライン展開することは**しません**。

コード上の真実:

- `openclaw config schema` は、検証とControl UIで使用されるライブJSON Schemaを出力し、利用可能な場合は bundled/plugin/channel メタデータもマージします
- `config.schema.lookup` は、ドリルダウン用ツール向けに、パス単位でスコープされた単一のスキーマノードを返します
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、現在のスキーマサーフェスに対して設定ドキュメントのベースラインハッシュを検証します

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および `plugins.entries.memory-core.config.dreaming` 配下の dreaming 設定については [Memory configuration reference](/ja-JP/reference/memory-config)
- 現在の組み込み + bundled コマンドカタログについては [Slash Commands](/ja-JP/tools/slash-commands)
- channel 固有のコマンドサーフェスについては各channel/pluginページ

設定形式は **JSON5** です（コメントと末尾カンマを許可）。すべてのフィールドは任意です — 省略した場合、OpenClawは安全なデフォルトを使用します。

---

## Channels

各channelは、その設定セクションが存在すると自動的に開始されます（`enabled: false` でない限り）。

### DMとグループアクセス

すべてのchannelはDMポリシーとグループポリシーをサポートします:

| DMポリシー          | 動作                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (デフォルト) | 未知の送信者には1回限りのペアリングコードが送られ、所有者の承認が必要です |
| `allowlist`         | `allowFrom` 内の送信者のみ（またはペア済みallowストア）             |
| `open`              | すべての受信DMを許可（`allowFrom: ["*"]` が必要）                  |
| `disabled`          | すべての受信DMを無視                                             |

| グループポリシー       | 動作                                                   |
| ---------------------- | ------------------------------------------------------ |
| `allowlist` (デフォルト) | 設定されたallowlistに一致するグループのみ                |
| `open`                 | グループallowlistをバイパス（mentionゲーティングは引き続き適用） |
| `disabled`             | すべてのグループ/ルームメッセージをブロック              |

<Note>
`channels.defaults.groupPolicy` は、providerの `groupPolicy` が未設定のときのデフォルトを設定します。
ペアリングコードの有効期限は1時間です。保留中のDMペアリングリクエストは **channelごとに3件まで** に制限されます。
providerブロック自体が完全に欠落している場合（`channels.<provider>` が存在しない場合）、ランタイムのグループポリシーは起動時警告つきで `allowlist`（fail-closed）にフォールバックします。
</Note>

### Channelモデルのオーバーライド

`channels.modelByChannel` を使用すると、特定のchannel IDをモデルに固定できます。値には `provider/model` または設定済みモデルエイリアスを指定できます。channelマッピングは、セッションにすでにモデルオーバーライドがない場合（たとえば `/model` で設定された場合など）に適用されます。

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

### ChannelデフォルトとHeartbeat

provider間で共有するグループポリシーとHeartbeat動作には `channels.defaults` を使用します:

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

- `channels.defaults.groupPolicy`: providerレベルの `groupPolicy` が未設定のときのフォールバックグループポリシー。
- `channels.defaults.contextVisibility`: すべてのchannelに対するデフォルトの補足コンテキスト可視性モード。値: `all`（デフォルト、引用/スレッド/履歴コンテキストをすべて含む）、`allowlist`（allowlistされた送信者からのコンテキストのみ含む）、`allowlist_quote`（allowlistと同じだが、明示的な引用/返信コンテキストは保持）。channel単位のオーバーライド: `channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`: 健全なchannelステータスをHeartbeat出力に含めます。
- `channels.defaults.heartbeat.showAlerts`: 劣化/エラーステータスをHeartbeat出力に含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケータ形式のHeartbeat出力をレンダリングします。

### WhatsApp

WhatsAppはGatewayのweb channel（Baileys Web）を通じて動作します。リンク済みセッションが存在すると自動的に開始されます。

```json5
{
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

<Accordion title="マルチアカウントWhatsApp">

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

- 送信コマンドは、`default` アカウントが存在する場合はそのアカウント、そうでなければ最初に設定されたアカウントid（ソート順）をデフォルトで使用します。
- 任意の `channels.whatsapp.defaultAccount` は、設定済みのアカウントidと一致する場合、このフォールバックデフォルトアカウント選択を上書きします。
- レガシーな単一アカウントBaileys auth dirは、`openclaw doctor` によって `whatsapp/default` に移行されます。
- アカウント単位のオーバーライド: `channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

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
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Botトークン: `channels.telegram.botToken` または `channels.telegram.tokenFile`（通常ファイルのみ。symlinkは拒否）、デフォルトアカウントのフォールバックとして `TELEGRAM_BOT_TOKEN` も使用可能です。
- 任意の `channels.telegram.defaultAccount` は、設定済みのアカウントidと一致する場合、デフォルトアカウント選択を上書きします。
- マルチアカウント構成（2個以上のアカウントid）では、フォールバックルーティングを避けるために明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定してください。これが欠落または無効な場合、`openclaw doctor` が警告します。
- `configWrites: false` は、Telegram起点の設定書き込み（supergroup ID移行、`/config set|unset`）をブロックします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、フォーラムトピック用の永続的なACPバインディングを設定します（`match.peer.id` には正規形の `chatId:topic:topicId` を使用）。フィールドの意味は [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) と共有されています。
- Telegramのストリームプレビューは `sendMessage` + `editMessageText` を使用します（ダイレクトチャットとグループチャットの両方で動作）。
- Retryポリシー: [Retry policy](/ja-JP/concepts/retry) を参照してください。

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
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
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

- Token: `channels.discord.token`。デフォルトアカウントのフォールバックとして `DISCORD_BOT_TOKEN` も使用されます。
- 明示的なDiscord `token` を指定する直接送信呼び出しでは、その呼び出しにそのtokenを使用します。アカウントのretry/ポリシー設定は、引き続きアクティブなランタイムスナップショット内で選択されたアカウントから取得されます。
- 任意の `channels.discord.defaultAccount` は、設定済みのアカウントidと一致する場合、デフォルトアカウント選択を上書きします。
- 配信ターゲットには `user:<id>`（DM）または `channel:<id>`（guild channel）を使用してください。数値IDのみは拒否されます。
- Guild slugは小文字で、スペースは `-` に置き換えられます。channelキーにはslug化された名前を使用します（`#` なし）。guild IDの使用を推奨します。
- Bot自身が作成したメッセージはデフォルトで無視されます。`allowBots: true` で有効になります。botへのメンションを含むbotメッセージのみを受け入れるには `allowBots: "mentions"` を使用してください（自分自身のメッセージは引き続き除外されます）。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（およびchannelオーバーライド）は、botではなく別のユーザーまたはロールにメンションしているメッセージを破棄します（@everyone/@here を除く）。
- `maxLinesPerMessage`（デフォルト17）は、2000文字未満であっても行数の多いメッセージを分割します。
- `channels.discord.threadBindings` は、Discordのスレッドバインド型ルーティングを制御します:
  - `enabled`: スレッドバインド型セッション機能（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびバインドされた配信/ルーティング）に対するDiscordオーバーライド
  - `idleHours`: 非アクティブ時の自動unfocusを時間単位で指定するDiscordオーバーライド（`0` で無効）
  - `maxAgeHours`: ハード最大経過時間を時間単位で指定するDiscordオーバーライド（`0` で無効）
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` の自動スレッド作成/バインドのオプトインスイッチ
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、channelとスレッド用の永続的なACPバインディングを設定します（`match.peer.id` にはchannel/thread idを使用）。フィールドの意味は [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) と共有されています。
- `channels.discord.ui.components.accentColor` は、Discord components v2コンテナのアクセントカラーを設定します。
- `channels.discord.voice` は、Discordボイスchannelでの会話と、任意の自動参加 + TTSオーバーライドを有効にします。
- `channels.discord.voice.daveEncryption` と `channels.discord.voice.decryptionFailureTolerance` は、`@discordjs/voice` のDAVEオプションにそのまま渡されます（デフォルトは `true` と `24`）。
- OpenClawはさらに、復号失敗が繰り返された後にボイスセッションから退出して再参加することで、音声受信の復旧も試みます。
- `channels.discord.streaming` は正規のストリームモードキーです。レガシーな `streamMode` と真偽値の `streaming` は自動的に移行されます。
- `channels.discord.autoPresence` は、ランタイムの可用性をbotのpresenceにマッピングします（healthy => online、degraded => idle、exhausted => dnd）。任意のステータステキスト上書きも可能です。
- `channels.discord.dangerouslyAllowNameMatching` は、変更可能な名前/tagマッチングを再有効化します（緊急用の互換モード）。
- `channels.discord.execApprovals`: Discordネイティブのexec承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。autoモードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合にexec承認が有効化されます。
  - `approvers`: execリクエストを承認できるDiscordユーザーID。省略時は `commands.ownerAllowFrom` にフォールバックします。
  - `agentFilter`: 任意のagent ID allowlist。省略するとすべてのagentの承認を転送します。
  - `sessionFilter`: 任意のセッションキーパターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）は承認者のDMに送信し、`"channel"` は発生元channelに送信し、`"both"` は両方に送信します。targetに `"channel"` が含まれる場合、ボタンを使用できるのは解決済みの承認者のみです。
  - `cleanupAfterResolve`: `true` の場合、承認、拒否、またはタイムアウト後に承認DMを削除します。

**リアクション通知モード:** `off`（なし）、`own`（botのメッセージ、デフォルト）、`all`（すべてのメッセージ）、`allowlist`（すべてのメッセージのうち `guilds.<id>.users` からのもの）。

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

- サービスアカウントJSON: インライン（`serviceAccount`）またはファイルベース（`serviceAccountFile`）。
- サービスアカウントSecretRef（`serviceAccountRef`）もサポートされます。
- 環境変数フォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信ターゲットには `spaces/<spaceId>` または `users/<userId>` を使用してください。
- `channels.googlechat.dangerouslyAllowNameMatching` は、変更可能なメールprincipalマッチングを再有効化します（緊急用の互換モード）。

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

- **Socket mode** では `botToken` と `appToken` の両方が必要です（デフォルトアカウントの環境変数フォールバックは `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP mode** では `botToken` に加えて `signingSecret`（ルートまたはアカウント単位）が必要です。
- `botToken`、`appToken`、`signingSecret`、`userToken` は平文文字列またはSecretRefオブジェクトを受け付けます。
- Slackアカウントスナップショットは、`botTokenSource`、`botTokenStatus`、`appTokenStatus`、およびHTTP modeでは `signingSecretStatus` のような、認証情報ごとのsource/statusフィールドを公開します。`configured_unavailable` は、そのアカウントがSecretRef経由で設定されているが、現在のコマンド/ランタイム経路では秘密値を解決できなかったことを意味します。
- `configWrites: false` は、Slack起点の設定書き込みをブロックします。
- 任意の `channels.slack.defaultAccount` は、設定済みのアカウントidと一致する場合、デフォルトアカウント選択を上書きします。
- `channels.slack.streaming.mode` は正規のSlackストリームモードキーです。`channels.slack.streaming.nativeTransport` はSlackのネイティブストリーミング転送を制御します。レガシーな `streamMode`、真偽値の `streaming`、および `nativeStreaming` は自動的に移行されます。
- 配信ターゲットには `user:<id>`（DM）または `channel:<id>` を使用してください。

**リアクション通知モード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` から）。

**スレッドセッション分離:** `thread.historyScope` はスレッド単位（デフォルト）またはchannel共有です。`thread.inheritParent` は親channelのトランスクリプトを新しいスレッドにコピーします。

- Slackネイティブストリーミングと、Slackのアシスタントスタイルの「入力中...」スレッドステータスには、返信スレッドターゲットが必要です。トップレベルDMはデフォルトでスレッド外のままなので、スレッドスタイルのプレビューではなく `typingReaction` または通常配信を使用します。
- `typingReaction` は、返信の実行中に受信したSlackメッセージへ一時的なリアクションを追加し、完了時に削除します。`"hourglass_flowing_sand"` のようなSlack絵文字ショートコードを使用してください。
- `channels.slack.execApprovals`: Slackネイティブのexec承認配信と承認者認可。スキーマはDiscordと同じです: `enabled`（`true`/`false`/`"auto"`）、`approvers`（SlackユーザーID）、`agentFilter`、`sessionFilter`、`target`（`"dm"`、`"channel"`、または `"both"`）。

| アクショングループ | デフォルト | メモ                     |
| ------------------ | ---------- | ------------------------ |
| reactions          | enabled    | リアクト + リアクション一覧 |
| messages           | enabled    | 読み取り/送信/編集/削除     |
| pins               | enabled    | ピン留め/解除/一覧         |
| memberInfo         | enabled    | メンバー情報               |
| emojiList          | enabled    | カスタム絵文字一覧         |

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
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

チャットモード: `oncall`（@メンションで応答、デフォルト）、`onmessage`（すべてのメッセージ）、`onchar`（トリガープレフィックスで始まるメッセージ）。

Mattermostネイティブコマンドが有効な場合:

- `commands.callbackPath` はフルURLではなく、パスでなければなりません（例: `/api/channels/mattermost/command`）。
- `commands.callbackUrl` はOpenClaw Gatewayエンドポイントに解決され、Mattermostサーバーから到達可能である必要があります。
- ネイティブslashコールバックは、slashコマンド登録時にMattermostから返されるコマンド単位のtokenで認証されます。登録に失敗した場合、または有効化されたコマンドがない場合、OpenClawは次のエラーでコールバックを拒否します:
  `Unauthorized: invalid command token.`
- 非公開/tailnet/内部コールバックホストでは、Mattermostが `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックホスト/ドメインを含めることを要求する場合があります。
  フルURLではなく、ホスト/ドメイン値を使用してください。
- `channels.mattermost.configWrites`: Mattermost起点の設定書き込みを許可または禁止します。
- `channels.mattermost.requireMention`: channelで返信する前に `@mention` を必須にします。
- `channels.mattermost.groups.<channelId>.requireMention`: channel単位のmentionゲーティングオーバーライド（デフォルトには `"*"`）。
- 任意の `channels.mattermost.defaultAccount` は、設定済みのアカウントidと一致する場合、デフォルトアカウント選択を上書きします。

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

- `channels.signal.account`: channel起動を特定のSignalアカウントIDに固定します。
- `channels.signal.configWrites`: Signal起点の設定書き込みを許可または禁止します。
- 任意の `channels.signal.defaultAccount` は、設定済みのアカウントidと一致する場合、デフォルトアカウント選択を上書きします。

### BlueBubbles

BlueBubblesは推奨される iMessage 経路です（Pluginバックエンド、`channels.bluebubbles` 配下で設定）。

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

- ここで扱うコアのキーパス: `channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- 任意の `channels.bluebubbles.defaultAccount` は、設定済みのアカウントidと一致する場合、デフォルトアカウント選択を上書きします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、BlueBubblesの会話を永続的なACPセッションにバインドできます。`match.peer.id` にはBlueBubblesハンドルまたはターゲット文字列（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共有されるフィールドの意味: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。
- 完全なBlueBubbles channel設定は [BlueBubbles](/ja-JP/channels/bluebubbles) に記載されています。

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

- 任意の `channels.imessage.defaultAccount` は、設定済みのアカウントidと一致する場合、デフォルトアカウント選択を上書きします。

- Messages DBへのフルディスクアクセスが必要です。
- `chat_id:<id>` ターゲットの使用を推奨します。チャット一覧の表示には `imsg chats --limit 20` を使用してください。
- `cliPath` はSSHラッパーを指すこともできます。添付ファイルをSCPで取得するには `remoteHost`（`host` または `user@host`）を設定してください。
- `attachmentRoots` と `remoteAttachmentRoots` は受信添付ファイルのパスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCPは厳格なhost-keyチェックを使用するため、リレーホストのキーがすでに `~/.ssh/known_hosts` に存在していることを確認してください。
- `channels.imessage.configWrites`: iMessage起点の設定書き込みを許可または禁止します。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、iMessageの会話を永続的なACPセッションにバインドできます。`match.peer.id` には正規化済みハンドルまたは明示的なチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共有されるフィールドの意味: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。

<Accordion title="iMessage SSHラッパーの例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrixは拡張機能バックエンドで、`channels.matrix` 配下で設定します。

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

- token認証は `accessToken` を使用します。パスワード認証は `userId` + `password` を使用します。
- `channels.matrix.proxy` は、Matrix HTTPトラフィックを明示的なHTTP(S)プロキシ経由にします。名前付きアカウントでは `channels.matrix.accounts.<id>.proxy` で上書きできます。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` は、private/internal homeserverを許可します。`proxy` とこのネットワークのオプトインは独立した制御です。
- `channels.matrix.defaultAccount` は、マルチアカウント構成で優先アカウントを選択します。
- `channels.matrix.autoJoin` のデフォルトは `off` なので、`autoJoin: "allowlist"` と `autoJoinAllowlist`、または `autoJoin: "always"` を設定するまで、招待されたルームや新しいDM形式の招待は無視されます。
- `channels.matrix.execApprovals`: Matrixネイティブのexec承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。autoモードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合にexec承認が有効化されます。
  - `approvers`: execリクエストを承認できるMatrixユーザーID（例: `@owner:example.org`）。
  - `agentFilter`: 任意のagent ID allowlist。省略するとすべてのagentの承認を転送します。
  - `sessionFilter`: 任意のセッションキーパターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）、`"channel"`（発生元ルーム）、または `"both"`。
  - アカウント単位のオーバーライド: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` は、Matrix DMをどのようにセッションへグループ化するかを制御します: `per-user`（デフォルト）はルーティング先peer単位で共有し、`per-room` は各DMルームを分離します。
- Matrixステータスプローブとライブディレクトリ参照は、ランタイムトラフィックと同じプロキシポリシーを使用します。
- 完全なMatrix設定、ターゲティングルール、セットアップ例は [Matrix](/ja-JP/channels/matrix) に記載されています。

### Microsoft Teams

Microsoft Teamsは拡張機能バックエンドで、`channels.msteams` 配下で設定します。

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

- ここで扱うコアのキーパス: `channels.msteams`、`channels.msteams.configWrites`。
- 完全なTeams設定（認証情報、webhook、DM/グループポリシー、team/channel単位のオーバーライド）は [Microsoft Teams](/ja-JP/channels/msteams) に記載されています。

### IRC

IRCは拡張機能バックエンドで、`channels.irc` 配下で設定します。

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

- ここで扱うコアのキーパス: `channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- 任意の `channels.irc.defaultAccount` は、設定済みのアカウントidと一致する場合、デフォルトアカウント選択を上書きします。
- 完全なIRC channel設定（host/port/TLS/channels/allowlist/mentionゲーティング）は [IRC](/ja-JP/channels/irc) に記載されています。

### マルチアカウント（全channels）

channelごとに複数アカウントを実行できます（各アカウントは独自の `accountId` を持ちます）:

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
- ベースとなるchannel設定は、アカウント単位で上書きしない限りすべてのアカウントに適用されます。
- `bindings[].match.accountId` を使用すると、各アカウントを異なるagentにルーティングできます。
- 単一アカウントのトップレベルchannel設定のまま `openclaw channels add`（またはchannelオンボーディング）で非defaultアカウントを追加すると、OpenClawはまずアカウントスコープのトップレベル単一アカウント値をchannelアカウントマップへ昇格させ、元のアカウントが引き続き動作するようにします。ほとんどのchannelではそれらを `channels.<channel>.accounts.default` に移動しますが、Matrixでは既存の一致する名前付き/defaultターゲットを代わりに保持できます。
- 既存のchannel専用バインディング（`accountId` なし）は引き続きdefaultアカウントにマッチします。アカウントスコープのバインディングは引き続き任意です。
- `openclaw doctor --fix` も混在した形状を修復し、そのchannel用に選ばれた昇格先アカウントへアカウントスコープのトップレベル単一アカウント値を移動します。ほとんどのchannelは `accounts.default` を使用しますが、Matrixでは既存の一致する名前付き/defaultターゲットを代わりに保持できます。

### その他の拡張channel

多くの拡張channelは `channels.<id>` として設定され、専用のchannelページに記載されています（たとえば Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch など）。
完全なchannel索引は [Channels](/ja-JP/channels) を参照してください。

### グループチャットのmentionゲーティング

グループメッセージはデフォルトで **mention必須** です（メタデータmention または安全な正規表現パターン）。WhatsApp、Telegram、Discord、Google Chat、iMessageのグループチャットに適用されます。

**mentionタイプ:**

- **メタデータmention**: ネイティブプラットフォームの@-mention。WhatsAppのセルフチャットモードでは無視されます。
- **テキストパターン**: `agents.list[].groupChat.mentionPatterns` 内の安全な正規表現パターン。無効なパターンや危険なネスト反復は無視されます。
- mentionゲーティングは、検出が可能な場合にのみ適用されます（ネイティブmentionまたは少なくとも1つのパターン）。

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

`messages.groupChat.historyLimit` はグローバルデフォルトを設定します。channelsは `channels.<channel>.historyLimit`（またはアカウント単位）で上書きできます。無効にするには `0` を設定してください。

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

解決順: DM単位のオーバーライド → providerデフォルト → 制限なし（すべて保持）。

対応: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### セルフチャットモード

自分の番号を `allowFrom` に含めると、セルフチャットモードが有効になります（ネイティブな@-mentionを無視し、テキストパターンにのみ応答）:

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

### Commands（チャットコマンド処理）

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

<Accordion title="コマンド詳細">

- このブロックはコマンドサーフェスを設定します。現在の組み込み + bundled コマンドカタログについては [Slash Commands](/ja-JP/tools/slash-commands) を参照してください。
- このページは**設定キーリファレンス**であり、完全なコマンドカタログではありません。QQ Bot の `/bot-ping` `/bot-help` `/bot-logs`、LINE の `/card`、device-pair の `/pair`、memory の `/dreaming`、phone-control の `/phone`、Talk の `/voice` などのchannel/plugin所有コマンドは、それぞれのchannel/pluginページと [Slash Commands](/ja-JP/tools/slash-commands) に記載されています。
- テキストコマンドは先頭が `/` の**単独メッセージ**でなければなりません。
- `native: "auto"` は Discord/Telegram でネイティブコマンドを有効にし、Slack では無効のままにします。
- `nativeSkills: "auto"` は Discord/Telegram でネイティブSkillsコマンドを有効にし、Slack では無効のままにします。
- channel単位のオーバーライド: `channels.discord.commands.native`（bool または `"auto"`）。`false` は以前に登録されたコマンドをクリアします。
- ネイティブSkills登録は `channels.<provider>.commands.nativeSkills` でchannel単位にオーバーライドできます。
- `channels.telegram.customCommands` は追加のTelegram botメニューエントリを追加します。
- `bash: true` はホストshell用の `! <cmd>` を有効にします。`tools.elevated.enabled` が必要で、送信者が `tools.elevated.allowFrom.<channel>` に含まれている必要があります。
- `config: true` は `/config` を有効にします（`openclaw.json` の読み書き）。Gateway `chat.send` クライアントでは、永続的な `/config set|unset` 書き込みには `operator.admin` も必要です。読み取り専用の `/config show` は通常の書き込みスコープを持つoperatorクライアントでも利用可能です。
- `mcp: true` は `mcp.servers` 配下のOpenClaw管理MCPサーバー設定用に `/mcp` を有効にします。
- `plugins: true` はPluginの検出、インストール、有効化/無効化制御用に `/plugins` を有効にします。
- `channels.<provider>.configWrites` は、channelごとの設定変更を制御します（デフォルト: true）。
- マルチアカウントchannelでは、`channels.<provider>.accounts.<id>.configWrites` も、そのアカウントを対象とする書き込み（たとえば `/allowlist --config --account <id>` や `/config set channels.<provider>.accounts.<id>...`）を制御します。
- `restart: false` は `/restart` と Gateway restart tool アクションを無効にします。デフォルト: `true`。
- `ownerAllowFrom` は、owner専用コマンド/tool用の明示的なowner allowlistです。`allowFrom` とは別です。
- `ownerDisplay: "hash"` は、システムプロンプト内のowner idをハッシュ化します。ハッシュを制御するには `ownerDisplaySecret` を設定してください。
- `allowFrom` はprovider単位です。設定されている場合、それが**唯一の**認可ソースになります（channel allowlist/ペアリング と `useAccessGroups` は無視されます）。
- `useAccessGroups: false` は、`allowFrom` が設定されていない場合に、コマンドがaccess-groupポリシーをバイパスできるようにします。
- コマンドドキュメント対応表:
  - 組み込み + bundled カタログ: [Slash Commands](/ja-JP/tools/slash-commands)
  - channel固有のコマンドサーフェス: [Channels](/ja-JP/channels)
  - QQ Botコマンド: [QQ Bot](/ja-JP/channels/qqbot)
  - ペアリングコマンド: [Pairing](/ja-JP/channels/pairing)
  - LINE cardコマンド: [LINE](/ja-JP/channels/line)
  - memory dreaming: [Dreaming](/ja-JP/concepts/dreaming)

</Accordion>

---

## Agentのデフォルト

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

システムプロンプトのRuntime行に表示される任意のリポジトリルートです。未設定の場合、OpenClawはworkspaceから上方向にたどって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` を設定していないagent用の、任意のデフォルトSkills allowlistです。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather を継承
      { id: "docs", skills: ["docs-search"] }, // デフォルトを置き換え
      { id: "locked-down", skills: [] }, // Skillsなし
    ],
  },
}
```

- デフォルトでSkillsを無制限にするには `agents.defaults.skills` を省略します。
- デフォルトを継承するには `agents.list[].skills` を省略します。
- Skillsなしにするには `agents.list[].skills: []` を設定します。
- 空でない `agents.list[].skills` リストは、そのagentの最終セットです。
  デフォルトとはマージされません。

### `agents.defaults.skipBootstrap`

workspace bootstrapファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）の自動作成を無効にします。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

workspace bootstrapファイルをいつシステムプロンプトへ注入するかを制御します。デフォルト: `"always"`。

- `"continuation-skip"`: 安全な継続ターン（assistantの応答完了後）ではworkspace bootstrapの再注入をスキップし、プロンプトサイズを削減します。Heartbeat実行とCompaction後の再試行では引き続きコンテキストを再構築します。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰め前のworkspace bootstrapファイル1件あたりの最大文字数です。デフォルト: `12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべてのworkspace bootstrapファイルにわたって注入される合計最大文字数です。デフォルト: `60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

bootstrapコンテキストが切り詰められたときの、agentに見える警告テキストを制御します。
デフォルト: `"once"`。

- `"off"`: システムプロンプトに警告テキストを決して注入しません。
- `"once"`: 一意の切り詰めシグネチャごとに1回だけ警告を注入します（推奨）。
- `"always"`: 切り詰めがあるたびに毎回警告を注入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### コンテキスト予算の所有マップ

OpenClawには大容量のプロンプト/コンテキスト予算が複数あり、
それらは1つの汎用ノブにまとめるのではなく、意図的にサブシステムごとに分割されています。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  通常のworkspace bootstrap注入。
- `agents.defaults.startupContext.*`:
  最近の毎日 `memory/*.md` ファイルを含む、
  単発の `/new` と `/reset` の起動プレリュード。
- `skills.limits.*`:
  システムプロンプトに注入されるコンパクトなSkills一覧。
- `agents.defaults.contextLimits.*`:
  制限付きのランタイム抜粋と、ランタイム所有ブロックの注入。
- `memory.qmd.limits.*`:
  インデックス化されたmemory検索スニペットと注入サイズ。

あるagentだけ別の
予算が必要な場合にのみ、対応するagent単位のオーバーライドを使用してください:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

素の `/new` と `/reset` 実行時に注入される最初のターンの起動プレリュードを制御します。

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
  メタデータと継続通知が追加される前の、デフォルト `memory_get` 抜粋上限。
- `memoryGetDefaultLines`: `lines` が
  省略されたときのデフォルト `memory_get` 行ウィンドウ。
- `toolResultMaxChars`: 永続化された結果と
  オーバーフロー回復に使われるライブtool結果上限。
- `postCompactionMaxChars`: Compaction後の
  再更新注入で使われる AGENTS.md 抜粋上限。

#### `agents.list[].contextLimits`

共有 `contextLimits` ノブのagent単位オーバーライドです。省略されたフィールドは
`agents.defaults.contextLimits` を継承します。

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

システムプロンプトに注入されるコンパクトなSkills一覧のグローバル上限です。これは必要に応じた `SKILL.md` ファイルの読み込みには影響しません。

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

Skillsプロンプト予算のagent単位オーバーライドです。

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

provider呼び出し前に、transcript/tool画像ブロック内の画像の最長辺に適用される最大ピクセルサイズです。
デフォルト: `1200`。

低い値では通常、スクリーンショットの多い実行におけるvision token使用量とリクエストpayloadサイズが減少します。
高い値では、より多くの視覚的詳細を保持できます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

システムプロンプトコンテキスト用のタイムゾーンです（メッセージタイムスタンプではありません）。ホストのタイムゾーンにフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

システムプロンプト内の時刻形式です。デフォルト: `auto`（OS設定）。

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
        primary: "openai/gpt-image-1",
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
      params: { cacheRetention: "long" }, // グローバルデフォルトprovider params
      embeddedHarness: {
        runtime: "auto", // auto | pi | registered harness id, e.g. codex
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

- `model`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - 文字列形式はprimary modelのみを設定します。
  - オブジェクト形式はprimaryに加えて、順序付きのfailover modelを設定します。
- `imageModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - `image` tool経路で、そのvision-model設定として使用されます。
  - 選択された/デフォルトのmodelが画像入力を受け付けられない場合のフォールバックルーティングにも使用されます。
- `imageGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - 共通の画像生成機能と、将来画像を生成するtool/pluginサーフェスで使用されます。
  - 一般的な値: Geminiネイティブ画像生成には `google/gemini-3.1-flash-image-preview`、falには `fal/fal-ai/flux/dev`、OpenAI Imagesには `openai/gpt-image-1`。
  - provider/modelを直接選択する場合は、対応するproviderの認証/APIキーも設定してください（例: `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/*` には `OPENAI_API_KEY`、`fal/*` には `FAL_KEY`）。
  - 省略しても、`image_generate` は認証済みproviderデフォルトを推論できます。まず現在のデフォルトproviderを試し、その後、残りの登録済み画像生成providerをprovider-id順で試します。
- `musicGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - 共通の音楽生成機能と、組み込みの `music_generate` toolで使用されます。
  - 一般的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、または `minimax/music-2.5+`。
  - 省略しても、`music_generate` は認証済みproviderデフォルトを推論できます。まず現在のデフォルトproviderを試し、その後、残りの登録済み音楽生成providerをprovider-id順で試します。
  - provider/modelを直接選択する場合は、対応するproviderの認証/APIキーも設定してください。
- `videoGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - 共通の動画生成機能と、組み込みの `video_generate` toolで使用されます。
  - 一般的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、または `qwen/wan2.7-r2v`。
  - 省略しても、`video_generate` は認証済みproviderデフォルトを推論できます。まず現在のデフォルトproviderを試し、その後、残りの登録済み動画生成providerをprovider-id順で試します。
  - provider/modelを直接選択する場合は、対応するproviderの認証/APIキーも設定してください。
  - bundled Qwen動画生成providerは、最大1本の出力動画、1枚の入力画像、4本の入力動画、10秒の長さ、およびproviderレベルの `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートします。
- `pdfModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - `pdf` toolのmodelルーティングに使用されます。
  - 省略時、PDF toolは `imageModel` にフォールバックし、その後解決済みのセッション/デフォルトmodelにフォールバックします。
- `pdfMaxBytesMb`: `pdf` toolで呼び出し時に `maxBytesMb` が渡されない場合の、デフォルトPDFサイズ上限。
- `pdfMaxPages`: `pdf` toolの抽出フォールバックモードで考慮するデフォルト最大ページ数。
- `verboseDefault`: agentのデフォルトverboseレベル。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `elevatedDefault`: agentのデフォルトelevated-outputレベル。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は `provider/model`（例: `openai/gpt-5.4`）。providerを省略した場合、OpenClawはまずaliasを試し、次にその正確なmodel idに一致する一意のconfigured-providerを試し、それでもだめなら設定されたデフォルトproviderにフォールバックします（非推奨の互換動作のため、明示的な `provider/model` を推奨します）。そのproviderが設定済みのデフォルトmodelをもう提供していない場合、OpenClawは古い削除済みproviderデフォルトを表示する代わりに、最初のconfigured provider/modelにフォールバックします。
- `models`: `/model` 用のconfigured modelカタログ兼allowlistです。各エントリには `alias`（短縮名）と `params`（provider固有。例: `temperature`、`maxTokens`、`cacheRetention`、`context1m`）を含められます。
- `params`: すべてのmodelに適用されるグローバルデフォルトproviderパラメータ。`agents.defaults.params` で設定します（例: `{ cacheRetention: "long" }`）。
- `params` のマージ優先順位（設定）: `agents.defaults.params`（グローバルベース）は、`agents.defaults.models["provider/model"].params`（model単位）で上書きされ、その後 `agents.list[].params`（一致するagent id）がキー単位で上書きします。詳細は [Prompt Caching](/ja-JP/reference/prompt-caching) を参照してください。
- `embeddedHarness`: デフォルトの低レベル組み込みagentランタイムポリシー。`runtime: "auto"` を使うと、登録済みplugin harnessがサポート対象modelを引き受けられるようになります。`runtime: "pi"` は組み込みのPi harnessを強制します。登録済みharness id（例: `runtime: "codex"`）も指定できます。`fallback: "none"` を設定すると、自動Piフォールバックを無効にします。
- これらのフィールドを変更する設定ライター（例: `/models set`、`/models set-image`、およびfallback add/removeコマンド）は、正規のオブジェクト形式で保存し、可能な限り既存のfallbackリストを保持します。
- `maxConcurrent`: セッションをまたいだagent実行の最大並列数です（各セッション自体は引き続き直列化されます）。デフォルト: 4。

### `agents.defaults.embeddedHarness`

`embeddedHarness` は、組み込みagentターンを実行する低レベルexecutorを制御します。
ほとんどのデプロイでは、デフォルトの `{ runtime: "auto", fallback: "pi" }` のままにしてください。
bundled
Codex app-server harnessのように、信頼できるpluginがネイティブharnessを提供する場合に使用します。

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

- `runtime`: `"auto"`、`"pi"`、または登録済みplugin harness id。bundled Codex Plugin は `codex` を登録します。
- `fallback`: `"pi"` または `"none"`。`"pi"` は組み込みのPi harnessを互換用フォールバックとして維持します。`"none"` は、plugin harnessの選択が欠落または未対応のとき、黙ってPiを使う代わりに失敗させます。
- 環境変数オーバーライド: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` は `runtime` を上書きします。`OPENCLAW_AGENT_HARNESS_FALLBACK=none` は、そのプロセスでPiフォールバックを無効にします。
- Codex専用デプロイでは、`model: "codex/gpt-5.4"`、`embeddedHarness.runtime: "codex"`、`embeddedHarness.fallback: "none"` を設定してください。
- これは組み込みchat harnessのみを制御します。メディア生成、vision、PDF、音楽、動画、TTSは引き続きそれぞれのprovider/model設定を使用します。

**組み込みalias短縮名**（modelが `agents.defaults.models` にある場合にのみ適用）:

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

設定済みaliasは常にデフォルトより優先されます。

Z.AI GLM-4.x modelは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、自動的にthinking modeを有効にします。
Z.AI modelは、tool callストリーミング用にデフォルトで `tool_stream` を有効にします。無効にするには `agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定してください。
Anthropic Claude 4.6 modelは、明示的なthinkingレベルが設定されていない場合、デフォルトで `adaptive` thinkingになります。

### `agents.defaults.cliBackends`

テキスト専用のフォールバック実行用の任意のCLI backendです（tool callなし）。API providerが失敗したときのバックアップとして有用です。

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

- CLI backendはテキスト優先です。toolは常に無効です。
- `sessionArg` が設定されている場合、セッションをサポートします。
- `imageArg` がファイルパスを受け付ける場合、画像パススルーをサポートします。

### `agents.defaults.systemPromptOverride`

OpenClawが組み立てたシステムプロンプト全体を固定文字列で置き換えます。デフォルトレベル（`agents.defaults.systemPromptOverride`）またはagent単位（`agents.list[].systemPromptOverride`）で設定します。agent単位の値が優先されます。空または空白だけの値は無視されます。制御されたプロンプト実験に有用です。

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.heartbeat`

定期的なHeartbeat実行。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: 期間文字列（ms/s/m/h）。デフォルト: `30m`（API-key認証）または `1h`（OAuth認証）。無効にするには `0m` を設定してください。
- `includeSystemPromptSection`: false の場合、システムプロンプトからHeartbeatセクションを省略し、bootstrapコンテキストへの `HEARTBEAT.md` 注入もスキップします。デフォルト: `true`。
- `suppressToolErrorWarnings`: true の場合、Heartbeat実行中のtool error warning payloadを抑制します。
- `timeoutSeconds`: 中断されるまでにHeartbeat agentターンへ許可される最大秒数。未設定のままにすると `agents.defaults.timeoutSeconds` を使用します。
- `directPolicy`: direct/DM配信ポリシー。`allow`（デフォルト）はdirect-target配信を許可します。`block` はdirect-target配信を抑制し、`reason=dm-blocked` を出力します。
- `lightContext`: true の場合、Heartbeat実行は軽量なbootstrapコンテキストを使用し、workspace bootstrapファイルから `HEARTBEAT.md` のみを保持します。
- `isolatedSession`: true の場合、各Heartbeatは以前の会話履歴なしの新規セッションで実行されます。Cron の `sessionTarget: "isolated"` と同じ分離パターンです。Heartbeatあたりのtokenコストを約100Kから約2-5K tokenへ削減します。
- agent単位: `agents.list[].heartbeat` を設定してください。いずれかのagentが `heartbeat` を定義すると、Heartbeatを実行するのは**それらのagentのみ**になります。
- Heartbeatは完全なagentターンを実行します — 間隔を短くするほど消費tokenは増えます。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
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

- `mode`: `default` または `safeguard`（長い履歴に対するチャンク化要約）。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `provider`: 登録済みCompaction provider Plugin のid。設定されている場合、組み込みLLM要約の代わりにそのproviderの `summarize()` が呼び出されます。失敗時は組み込みにフォールバックします。providerを設定すると `mode: "safeguard"` が強制されます。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `timeoutSeconds`: OpenClawが中断するまでに、単一のCompaction処理に許可される最大秒数。デフォルト: `900`。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` は、Compaction要約時に組み込みの不透明な識別子保持ガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` のときに使われる、任意のカスタム識別子保持テキスト。
- `postCompactionSections`: Compaction後に再注入する、任意の AGENTS.md H2/H3 セクション名。デフォルトは `["Session Startup", "Red Lines"]` です。再注入を無効にするには `[]` を設定してください。未設定、または明示的にそのデフォルトの組を設定した場合、古い `Every Session` / `Safety` 見出しもレガシーフォールバックとして受け付けられます。
- `model`: Compaction要約専用の任意の `provider/model-id` オーバーライド。メインセッションでは1つのmodelを使い、Compaction要約は別のmodelで実行したい場合に使用します。未設定の場合、Compactionはセッションのprimary modelを使います。
- `notifyUser`: `true` の場合、Compaction開始時と完了時にユーザーへ短い通知を送信します（たとえば「Compacting context...」や「Compaction complete」）。デフォルトでは、Compactionを無言に保つため無効です。
- `memoryFlush`: 自動Compaction前に永続memoryを保存する、無言のagenticターン。workspaceが読み取り専用の場合はスキップされます。

### `agents.defaults.contextPruning`

LLMへ送信する前に、メモリ内コンテキストから**古いtool結果**を刈り込みます。ディスク上のセッション履歴は**変更しません**。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
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

<Accordion title="cache-ttl モードの動作">

- `mode: "cache-ttl"` は刈り込みパスを有効にします。
- `ttl` は、次に再度刈り込みを実行できる頻度を制御します（最後のキャッシュタッチ後）。
- 刈り込みは、まず大きすぎるtool結果をsoft-trimし、その後必要であれば古いtool結果をhard-clearします。

**Soft-trim** は先頭 + 末尾を保持し、中間に `...` を挿入します。

**Hard-clear** はtool結果全体をプレースホルダーで置き換えます。

注意:

- 画像ブロックは決してtrim/clearされません。
- 比率は文字数ベース（概算）であり、正確なtoken数ではありません。
- `keepLastAssistants` 個未満のassistantメッセージしか存在しない場合、刈り込みはスキップされます。

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
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Telegram以外のchannelでは、ブロック返信を有効にするには明示的な `*.blockStreaming: true` が必要です。
- channelオーバーライド: `channels.<channel>.blockStreamingCoalesce`（およびアカウント単位の亜種）。Signal/Slack/Discord/Google Chat のデフォルトは `minChars: 1500` です。
- `humanDelay`: ブロック返信間のランダム化された待機。`natural` = 800–2500ms。agent単位のオーバーライド: `agents.list[].humanDelay`。

動作とチャンク化の詳細は [Streaming](/ja-JP/concepts/streaming) を参照してください。

### 入力中インジケーター

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

- デフォルト: ダイレクトチャット/メンションでは `instant`、メンションされていないグループチャットでは `message`。
- セッション単位のオーバーライド: `session.typingMode`、`session.typingIntervalSeconds`。

[Typing Indicators](/ja-JP/concepts/typing-indicators) を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

組み込みagent用の任意のsandbox化です。完全なガイドについては [Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。

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
          // SecretRefs / inline contents also supported:
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

<Accordion title="Sandbox詳細">

**Backend:**

- `docker`: ローカルDockerランタイム（デフォルト）
- `ssh`: 汎用SSHバックエンドのリモートランタイム
- `openshell`: OpenShellランタイム

`backend: "openshell"` が選択されている場合、ランタイム固有の設定は
`plugins.entries.openshell.config` に移動します。

**SSH backend設定:**

- `target`: `user@host[:port]` 形式のSSHターゲット
- `command`: SSHクライアントコマンド（デフォルト: `ssh`）
- `workspaceRoot`: スコープごとのworkspaceに使用される絶対リモートルート
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSHに渡される既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: OpenClawが実行時に一時ファイルへ実体化する、インライン内容またはSecretRef
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSHのhost-keyポリシーノブ

**SSH認証の優先順位:**

- `identityData` は `identityFile` より優先
- `certificateData` は `certificateFile` より優先
- `knownHostsData` は `knownHostsFile` より優先
- SecretRefバックエンドの `*Data` 値は、sandboxセッション開始前にアクティブなsecretsランタイムスナップショットから解決されます

**SSH backendの動作:**

- 作成または再作成後にリモートworkspaceを1回シードします
- その後、リモートSSH workspaceを正規として維持します
- `exec`、ファイルtool、メディアパスをSSH経由でルーティングします
- リモート変更は自動ではホストへ同期されません
- sandbox browserコンテナはサポートしません

**Workspaceアクセス:**

- `none`: `~/.openclaw/sandboxes` 配下のスコープごとのsandbox workspace
- `ro`: `/workspace` にsandbox workspace、`/agent` にagent workspaceを読み取り専用マウント
- `rw`: `/workspace` にagent workspaceを読み書きマウント

**Scope:**

- `session`: セッションごとのコンテナ + workspace
- `agent`: agentごとに1つのコンテナ + workspace（デフォルト）
- `shared`: 共有コンテナとworkspace（セッション間分離なし）

**OpenShell Plugin 設定:**

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
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShellモード:**

- `mirror`: exec前にローカルからリモートへシードし、exec後に同期し戻す。ローカルworkspaceが正規のままです
- `remote`: sandbox作成時にリモートへ1回シードし、その後はリモートworkspaceを正規として維持します

`remote` モードでは、OpenClaw外で行われたホストローカルの編集は、シード後にsandboxへ自動同期されません。
転送はOpenShell sandboxへのSSHですが、sandboxライフサイクルと任意のmirror同期はPluginが管理します。

**`setupCommand`** はコンテナ作成後に1回実行されます（`sh -lc` 経由）。ネットワークegress、書き込み可能なroot、rootユーザーが必要です。

**コンテナのデフォルトは `network: "none"`** です — agentに外向きアクセスが必要な場合は `"bridge"`（またはカスタムbridgeネットワーク）に設定してください。
`"host"` はブロックされます。`"container:<id>"` も、明示的に
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` を設定しない限り（緊急用）デフォルトでブロックされます。

**受信添付ファイル** は、アクティブなworkspace内の `media/inbound/*` にステージされます。

**`docker.binds`** は追加のホストディレクトリをマウントします。グローバルとagent単位のbindはマージされます。

**Sandbox化されたbrowser**（`sandbox.browser.enabled`）: コンテナ内のChromium + CDP。noVNC URLはシステムプロンプトに注入されます。`openclaw.json` で `browser.enabled` は必要ありません。
noVNCのオブザーバーアクセスはデフォルトでVNC認証を使用し、OpenClawは共有URLにパスワードを露出する代わりに短命token URLを発行します。

- `allowHostControl: false`（デフォルト）は、sandbox化されたセッションがホストbrowserを対象にすることをブロックします。
- `network` のデフォルトは `openclaw-sandbox-browser`（専用bridgeネットワーク）です。グローバルなbridge接続を明示的に望む場合にのみ `bridge` に設定してください。
- `cdpSourceRange` は、CDPの受信をコンテナ境界でCIDR範囲に制限できます（例: `172.21.0.1/32`）。
- `sandbox.browser.binds` は、追加のホストディレクトリをsandbox browserコンテナのみにマウントします。設定されている場合（`[]` を含む）、browserコンテナでは `docker.binds` を置き換えます。
- 起動デフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義されており、コンテナホスト向けに調整されています:
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
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` は、ワークフローが拡張機能に
    依存している場合、拡張機能を再有効化します。
  - `--renderer-process-limit=2` は
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で変更できます。Chromiumの
    デフォルトプロセス上限を使うには `0` を設定してください。
  - さらに、`noSandbox` が有効な場合は `--no-sandbox` と `--disable-setuid-sandbox`。
  - デフォルトはコンテナイメージのベースラインです。コンテナデフォルトを変更するには、カスタム
    entrypointを持つカスタムbrowserイメージを使用してください。

</Accordion>

browserのsandbox化と `sandbox.docker.binds` はDocker専用です。

イメージをビルド:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list`（agent単位のオーバーライド）

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
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        skills: ["docs-search"], // replaces agents.defaults.skills when set
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
- `default`: 複数設定されている場合、最初のものが優先されます（警告を記録）。何も設定されていない場合、リストの最初のエントリがデフォルトです。
- `model`: 文字列形式は `primary` のみをオーバーライドし、オブジェクト形式 `{ primary, fallbacks }` は両方をオーバーライドします（`[]` でグローバルfallbackを無効化）。`primary` のみをオーバーライドするCron jobは、`fallbacks: []` を設定しない限り引き続きデフォルトfallbackを継承します。
- `params`: 選択された `agents.defaults.models` 内のmodelエントリにマージされる、agent単位のstream paramsです。modelカタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` のようなagent固有オーバーライドに使用してください。
- `skills`: 任意のagent単位Skills allowlist。省略した場合、`agents.defaults.skills` が設定されていればagentはそれを継承します。明示的なリストはデフォルトをマージではなく置き換え、`[]` はSkillsなしを意味します。
- `thinkingDefault`: 任意のagent単位デフォルトthinkingレベル（`off | minimal | low | medium | high | xhigh | adaptive | max`）。メッセージ単位またはセッション単位のオーバーライドがない場合、このagentでは `agents.defaults.thinkingDefault` を上書きします。
- `reasoningDefault`: 任意のagent単位デフォルトreasoning可視性（`on | off | stream`）。メッセージ単位またはセッション単位のreasoningオーバーライドがない場合に適用されます。
- `fastModeDefault`: 任意のagent単位のfast modeデフォルト（`true | false`）。メッセージ単位またはセッション単位のfast-modeオーバーライドがない場合に適用されます。
- `embeddedHarness`: 任意のagent単位低レベルharnessポリシーオーバーライド。1つのagentのみをCodex専用にし、他のagentはデフォルトのPiフォールバックを維持するには `{ runtime: "codex", fallback: "none" }` を使用してください。
- `runtime`: 任意のagent単位ランタイム記述子。agentがデフォルトでACP harnessセッションを使うべき場合は、`type: "acp"` と `runtime.acp` デフォルト（`agent`、`backend`、`mode`、`cwd`）を使用してください。
- `identity.avatar`: workspace相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを導出します: `emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns`。
- `subagents.allowAgents`: `sessions_spawn` 用のagent id allowlist（`["*"]` = 任意。デフォルト: 同一agentのみ）。
- Sandbox継承ガード: 要求元セッションがsandbox化されている場合、`sessions_spawn` はsandbox化されないターゲットを拒否します。
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

### バインディングの一致フィールド

- `type`（任意）: 通常ルーティングには `route`（type省略時はrouteがデフォルト）、永続ACP会話バインディングには `acp`
- `match.channel`（必須）
- `match.accountId`（任意。`*` = 任意のアカウント、省略 = デフォルトアカウント）
- `match.peer`（任意。`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（任意。channel固有）
- `acp`（任意。`type: "acp"` のみ）: `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（完全一致、peer/guild/teamなし）
5. `match.accountId: "*"`（channel全体）
6. デフォルトagent

各tier内では、最初に一致した `bindings` エントリが優先されます。

`type: "acp"` エントリでは、OpenClawは厳密な会話ID（`match.channel` + account + `match.peer.id`）で解決し、上記のrouteバインディングtier順序は使用しません。

### agent単位アクセスプロファイル

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

## Session

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
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Sessionフィールド詳細">

- **`scope`**: グループチャットコンテキスト用の基本セッショングループ化戦略。
  - `per-sender`（デフォルト）: channelコンテキスト内で、各送信者が分離されたセッションを持ちます。
  - `global`: channelコンテキスト内のすべての参加者が1つのセッションを共有します（共有コンテキストを意図する場合にのみ使用してください）。
- **`dmScope`**: DMをどのようにグループ化するか。
  - `main`: すべてのDMがmainセッションを共有します。
  - `per-peer`: channelをまたいで送信者idごとに分離します。
  - `per-channel-peer`: channel + 送信者ごとに分離します（マルチユーザー受信箱に推奨）。
  - `per-account-channel-peer`: account + channel + 送信者ごとに分離します（マルチアカウントに推奨）。
- **`identityLinks`**: channel間でセッションを共有するために、正規idをprovider接頭辞付きpeerへマップします。
- **`reset`**: 主resetポリシー。`daily` はローカル時刻の `atHour` にresetし、`idle` は `idleMinutes` 後にresetします。両方設定されている場合は、先に期限切れになる方が優先されます。
- **`resetByType`**: typeごとのオーバーライド（`direct`、`group`、`thread`）。レガシーの `dm` は `direct` のエイリアスとして受け付けられます。
- **`parentForkMaxTokens`**: 分岐したスレッドセッションを作成する際に許可される、親セッションの最大 `totalTokens`（デフォルト `100000`）。
  - 親の `totalTokens` がこの値を超える場合、OpenClawは親のトランスクリプト履歴を継承せず、新しいスレッドセッションを開始します。
  - このガードを無効にして常に親forkを許可するには `0` を設定してください。
- **`mainKey`**: レガシーフィールドです。ランタイムはメインのダイレクトチャットバケットに常に `"main"` を使用します。
- **`agentToAgent.maxPingPongTurns`**: agent間やり取り中のagent間返信ターンの最大数（整数、範囲: `0`–`5`）。`0` でping-pong連鎖を無効にします。
- **`sendPolicy`**: `channel`、`chatType`（`direct|group|channel`、レガシーの `dm` エイリアスあり）、`keyPrefix`、または `rawKeyPrefix` で一致させます。最初のdenyが優先されます。
- **`maintenance`**: セッションストアのクリーンアップ + 保持制御。
  - `mode`: `warn` は警告のみを出し、`enforce` はクリーンアップを適用します。
  - `pruneAfter`: 古いエントリの経過期間しきい値（デフォルト `30d`）。
  - `maxEntries`: `sessions.json` 内の最大エントリ数（デフォルト `500`）。
  - `rotateBytes`: `sessions.json` がこのサイズを超えたらローテーションします（デフォルト `10mb`）。
  - `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間。デフォルトは `pruneAfter`。無効にするには `false` を設定してください。
  - `maxDiskBytes`: 任意のsessionsディレクトリのディスク予算。`warn` モードでは警告を記録し、`enforce` モードでは最も古い成果物/セッションから先に削除します。
  - `highWaterBytes`: 予算クリーンアップ後の任意の目標値。デフォルトは `maxDiskBytes` の `80%`。
- **`threadBindings`**: スレッドバインド型セッション機能のグローバルデフォルト。
  - `enabled`: マスターのデフォルトスイッチ（providerでオーバーライド可能。Discordは `channels.discord.threadBindings.enabled` を使用）
  - `idleHours`: 非アクティブ時の自動unfocusを時間単位で指定するデフォルト（`0` で無効。providerでオーバーライド可能）
  - `maxAgeHours`: ハード最大経過時間を時間単位で指定するデフォルト（`0` で無効。providerでオーバーライド可能）

</Accordion>

---

## Messages

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
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
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 応答プレフィックス

channel/account単位のオーバーライド: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決順（最も具体的なものが優先）: account → channel → グローバル。`""` は無効化し、連鎖も停止します。`"auto"` は `[{identity.name}]` を導出します。

**テンプレート変数:**

| Variable          | 説明                   | 例                          |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | 短いmodel名            | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なmodel識別子      | `anthropic/claude-opus-4-6` |
| `{provider}`      | provider名             | `anthropic`                 |
| `{thinkingLevel}` | 現在のthinkingレベル   | `high`, `low`, `off`        |
| `{identity.name}` | agent identity名       | （`"auto"` と同じ）         |

変数は大文字小文字を区別しません。`{think}` は `{thinkingLevel}` のエイリアスです。

### ackリアクション

- デフォルトはアクティブagentの `identity.emoji`、それ以外は `"👀"` です。無効にするには `""` を設定してください。
- channel単位のオーバーライド: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順: account → channel → `messages.ackReaction` → identityフォールバック。
- スコープ: `group-mentions`（デフォルト）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: Slack、Discord、Telegramで返信後にackを削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Telegramでライフサイクルステータスリアクションを有効にします。
  SlackとDiscordでは、未設定時はackリアクションが有効な場合にステータスリアクションも有効のままです。
  Telegramでは、ライフサイクルステータスリアクションを有効にするには明示的に `true` を設定してください。

### 受信debounce

同じ送信者からの連続するテキストのみのメッセージを、1回のagentターンにまとめます。メディア/添付ファイルは即座にフラッシュされます。制御コマンドはdebouncingをバイパスします。

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

- `auto` はデフォルトの自動TTSモードを制御します: `off`、`always`、`inbound`、または `tagged`。`/tts on|off` はローカル設定をオーバーライドでき、`/tts status` は実効状態を表示します。
- `summaryModel` は、自動要約用に `agents.defaults.model.primary` をオーバーライドします。
- `modelOverrides` はデフォルトで有効です。`modelOverrides.allowProvider` のデフォルトは `false`（オプトイン）です。
- APIキーは `ELEVENLABS_API_KEY` / `XI_API_KEY` および `OPENAI_API_KEY` にフォールバックします。
- `openai.baseUrl` はOpenAI TTSエンドポイントを上書きします。解決順は設定、次に `OPENAI_TTS_BASE_URL`、最後に `https://api.openai.com/v1` です。
- `openai.baseUrl` が非OpenAIエンドポイントを指している場合、OpenClawはそれをOpenAI互換TTSサーバーとして扱い、model/voice検証を緩和します。

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
- レガシーなフラットTalkキー（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）は互換性専用であり、自動的に `talk.providers.<provider>` へ移行されます。
- Voice IDは `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `providers.*.apiKey` は平文文字列またはSecretRefオブジェクトを受け付けます。
- `ELEVENLABS_API_KEY` フォールバックは、Talk APIキーが設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases` により、Talkディレクティブでフレンドリー名を使えます。
- `silenceTimeoutMs` は、ユーザーが無音になってからTalk modeがtranscriptを送信するまで待機する時間を制御します。未設定の場合はプラットフォームのデフォルト一時停止ウィンドウ（`macOS と Android では700 ms、iOS では900 ms`）が使われます。

---

## Tools

### toolプロファイル

`tools.profile` は、`tools.allow` / `tools.deny` より前にベースallowlistを設定します:

ローカルオンボーディングでは、未設定の新しいローカル設定に対して `tools.profile: "coding"` をデフォルト設定します（既存の明示的なプロファイルは保持されます）。

| Profile     | 含まれるもの                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` のみ                                                                                                     |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                 |
| `full`      | 制限なし（未設定と同じ）                                                                                                   |

### toolグループ

| Group              | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` （`bash` は `exec` のエイリアスとして受け付けられます）                              |
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
| `group:openclaw`   | すべての組み込みtool（provider Plugin を除く）                                                                           |

### `tools.allow` / `tools.deny`

グローバルなtool許可/拒否ポリシーです（denyが優先）。大文字小文字を区別せず、`*` ワイルドカードをサポートします。Docker sandboxがオフでも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

特定のproviderまたはmodelに対してtoolをさらに制限します。順序: ベースprofile → provider profile → allow/deny。

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

sandbox外のelevated execアクセスを制御します:

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

- agent単位のオーバーライド（`agents.list[].tools.elevated`）は、さらに制限することしかできません。
- `/elevated on|off|ask|full` は状態をセッション単位で保存します。インラインディレクティブは単一メッセージにのみ適用されます。
- Elevated `exec` はsandbox化をバイパスし、設定済みのescape path（デフォルトは `gateway`、execターゲットが `node` の場合は `node`）を使用します。

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

toolループ安全性チェックは**デフォルトで無効**です。有効化するには `enabled: true` を設定してください。
設定はグローバルに `tools.loopDetection` で定義でき、agent単位で `agents.list[].tools.loopDetection` によりオーバーライドできます。

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

- `historySize`: ループ分析のために保持するtool呼び出し履歴の最大数。
- `warningThreshold`: 警告の対象となる、進捗のない繰り返しパターンのしきい値。
- `criticalThreshold`: 重大なループをブロックするための、より高い繰り返ししきい値。
- `globalCircuitBreakerThreshold`: 進捗のない実行に対するハードストップしきい値。
- `detectors.genericRepeat`: 同一tool/同一引数の繰り返し呼び出しに対して警告します。
- `detectors.knownPollNoProgress`: 既知のpoll tool（`process.poll`、`command_status` など）で進捗がない場合に警告/ブロックします。
- `detectors.pingPong`: 進捗のない交互ペアパターンに対して警告/ブロックします。
- `warningThreshold >= criticalThreshold` または `criticalThreshold >= globalCircuitBreakerThreshold` の場合、検証は失敗します。

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
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

受信メディア理解（画像/音声/動画）を設定します:

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: send finished async music/video directly to the channel
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

**Providerエントリ**（`type: "provider"` または省略時）:

- `provider`: API provider id（`openai`、`anthropic`、`google`/`gemini`、`groq` など）
- `model`: model idオーバーライド
- `profile` / `preferredProfile`: `auth-profiles.json` のprofile選択

**CLIエントリ**（`type: "cli"`）:

- `command`: 実行する実行ファイル
- `args`: テンプレート化された引数（`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポート）

**共通フィールド:**

- `capabilities`: 任意のリスト（`image`、`audio`、`video`）。デフォルト: `openai`/`anthropic`/`minimax` → image、`google` → image+audio+video、`groq` → audio。
- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: エントリ単位のオーバーライド。
- 失敗時は次のエントリへフォールバックします。

provider認証は標準順序に従います: `auth-profiles.json` → 環境変数 → `models.providers.*.apiKey`。

**非同期完了フィールド:**

- `asyncCompletion.directSend`: `true` の場合、完了した非同期 `music_generate`
  と `video_generate` タスクは、まず直接channel配信を試みます。デフォルト: `false`
  （レガシーのrequester-session wake/model-delivery経路）。

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

session tool（`sessions_list`、`sessions_history`、`sessions_send`）でどのsessionを対象にできるかを制御します。

デフォルト: `tree`（現在のsession + そこからspawnされたsession、たとえばsubagent）。

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

注意:

- `self`: 現在のsession keyのみ。
- `tree`: 現在のsession + 現在のsessionからspawnされたsession（subagent）。
- `agent`: 現在のagent idに属する任意のsession（同じagent idの下で送信者単位sessionを実行している場合、他のユーザーを含むことがあります）。
- `all`: 任意のsession。agentをまたぐターゲティングには引き続き `tools.agentToAgent` が必要です。
- Sandboxクランプ: 現在のsessionがsandbox化されていて、`agents.defaults.sandbox.sessionToolsVisibility="spawned"` の場合、`tools.sessions.visibility="all"` であっても可視性は `tree` に強制されます。

### `tools.sessions_spawn`

`sessions_spawn` のインライン添付ファイルサポートを制御します。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

注意:

- 添付ファイルは `runtime: "subagent"` でのみサポートされます。ACP runtimeはそれらを拒否します。
- ファイルは子workspace内の `.openclaw/attachments/<uuid>/` に `.manifest.json` とともに実体化されます。
- 添付ファイル内容はtranscript永続化から自動的にredactされます。
- Base64入力は、厳格なアルファベット/パディングチェックとデコード前サイズガードで検証されます。
- ファイル権限はディレクトリが `0700`、ファイルが `0600` です。
- クリーンアップは `cleanup` ポリシーに従います: `delete` は常に添付ファイルを削除し、`keep` は `retainOnSessionKeep: true` の場合にのみ保持します。

### `tools.experimental`

実験的な組み込みtoolフラグです。厳格なagentic GPT-5自動有効化ルールが適用されない限り、デフォルトはオフです。

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

注意:

- `planTool`: 非自明な複数ステップ作業の追跡用に、構造化された `update_plan` toolを有効にします。
- デフォルト: `agents.defaults.embeddedPi.executionContract`（またはagent単位オーバーライド）がOpenAIまたはOpenAI CodexのGPT-5系実行で `"strict-agentic"` に設定されている場合を除き `false`。この範囲外で強制的に有効化するには `true` を設定し、strict-agentic GPT-5実行でも無効のままにするには `false` を設定してください。
- 有効時は、system promptにも使用ガイダンスが追加され、modelがそれを実質的な作業にのみ使用し、`in_progress` のステップを最大1つまでに保つようになります。

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

- `model`: spawnされるsub-agentのデフォルトmodel。省略時、sub-agentは呼び出し元のmodelを継承します。
- `allowAgents`: 要求元agentが独自の `subagents.allowAgents` を設定していない場合の、`sessions_spawn` 用ターゲットagent idのデフォルトallowlist（`["*"]` = 任意。デフォルト: 同一agentのみ）。
- `runTimeoutSeconds`: tool呼び出しで `runTimeoutSeconds` が省略された場合の、`sessions_spawn` のデフォルトタイムアウト（秒）。`0` はタイムアウトなしを意味します。
- subagent単位のtoolポリシー: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタムproviderとbase URL

OpenClawは組み込みmodelカタログを使用します。カスタムproviderは、設定内の `models.providers` または `~/.openclaw/agents/<agentId>/agent/models.json` で追加します。

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
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

- カスタム認証が必要な場合は `authHeader: true` + `headers` を使用してください。
- agent設定ルートは `OPENCLAW_AGENT_DIR`（またはレガシー環境変数エイリアスの `PI_CODING_AGENT_DIR`）で上書きできます。
- 一致するprovider IDに対するマージ優先順位:
  - 空でないagent `models.json` の `baseUrl` 値が優先されます。
  - 空でないagent `apiKey` 値は、そのproviderが現在のconfig/auth-profileコンテキストでSecretRef管理されていない場合にのみ優先されます。
  - SecretRef管理のprovider `apiKey` 値は、解決済みsecretを永続化する代わりに、ソースマーカー（env refでは `ENV_VAR_NAME`、file/exec refでは `secretref-managed`）から更新されます。
  - SecretRef管理のprovider header値は、ソースマーカー（env refでは `secretref-env:ENV_VAR_NAME`、file/exec refでは `secretref-managed`）から更新されます。
  - agentの `apiKey` / `baseUrl` が空または欠落している場合は、設定内の `models.providers` にフォールバックします。
  - 一致するmodelの `contextWindow` / `maxTokens` は、明示的な設定値と暗黙のカタログ値のうち高い方を使用します。
  - 一致するmodelの `contextTokens` は、明示的なランタイム上限が存在する場合それを保持します。ネイティブmodelメタデータを変更せずに有効コンテキストを制限するために使用してください。
  - 設定で `models.json` を完全に書き換えたい場合は `models.mode: "replace"` を使用してください。
  - マーカーの永続化はソース権威です: マーカーは、解決済みランタイムsecret値からではなく、アクティブなソース設定スナップショット（解決前）から書き込まれます。

### providerフィールド詳細

- `models.mode`: providerカタログの動作（`merge` または `replace`）。
- `models.providers`: provider idをキーとするカスタムproviderマップ。
- `models.providers.*.api`: リクエストアダプター（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` など）。
- `models.providers.*.apiKey`: provider認証情報（SecretRef/env置換を推奨）。
- `models.providers.*.auth`: 認証戦略（`api-key`、`token`、`oauth`、`aws-sdk`）。
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` 用に、リクエストへ `options.num_ctx` を注入します（デフォルト: `true`）。
- `models.providers.*.authHeader`: 必要な場合に、`Authorization` ヘッダーでの認証情報送信を強制します。
- `models.providers.*.baseUrl`: 上流APIのbase URL。
- `models.providers.*.headers`: proxy/tenantルーティング用の追加静的ヘッダー。
- `models.providers.*.request`: model-provider HTTPリクエストの転送オーバーライド。
  - `request.headers`: 追加ヘッダー（providerデフォルトとマージ）。値はSecretRefを受け付けます。
  - `request.auth`: 認証戦略オーバーライド。モード: `"provider-default"`（provider組み込み認証を使用）、`"authorization-bearer"`（`token` と組み合わせて使用）、`"header"`（`headerName`、`value`、任意で `prefix`）。
  - `request.proxy`: HTTPプロキシオーバーライド。モード: `"env-proxy"`（`HTTP_PROXY` / `HTTPS_PROXY` 環境変数を使用）、`"explicit-proxy"`（`url` と組み合わせて使用）。両モードとも任意の `tls` サブオブジェクトを受け付けます。
  - `request.tls`: 直接接続用のTLSオーバーライド。フィールド: `ca`、`cert`、`key`、`passphrase`（すべてSecretRefを受け付けます）、`serverName`、`insecureSkipVerify`。
  - `request.allowPrivateNetwork`: `true` の場合、DNSがprivate、CGNAT、または類似レンジへ解決されるときでも、provider HTTP fetchガード経由で `baseUrl` へのHTTPSを許可します（信頼できるセルフホストOpenAI互換エンドポイント向けのoperatorオプトイン）。WebSocketはヘッダー/TLSには同じ `request` を使いますが、そのfetch SSRFガードには従いません。デフォルトは `false`。
- `models.providers.*.models`: 明示的なprovider modelカタログエントリ。
- `models.providers.*.models.*.contextWindow`: ネイティブmodelのコンテキストウィンドウメタデータ。
- `models.providers.*.models.*.contextTokens`: 任意のランタイムコンテキスト上限。modelのネイティブ `contextWindow` より小さい有効コンテキスト予算にしたい場合に使います。
- `models.providers.*.models.*.compat.supportsDeveloperRole`: 任意の互換性ヒント。`api: "openai-completions"` で、空でない非ネイティブ `baseUrl`（hostが `api.openai.com` ではない）の場合、OpenClawは実行時にこれを `false` に強制します。`baseUrl` が空または省略されている場合は、デフォルトのOpenAI動作を維持します。
- `models.providers.*.models.*.compat.requiresStringContent`: 文字列のみのOpenAI互換chatエンドポイント用の任意の互換性ヒント。`true` の場合、OpenClawはリクエスト送信前に純粋なテキスト `messages[].content` 配列をプレーン文字列へフラット化します。
- `plugins.entries.amazon-bedrock.config.discovery`: Bedrock自動検出設定のルート。
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: 暗黙の検出をオン/オフします。
- `plugins.entries.amazon-bedrock.config.discovery.region`: 検出用のAWSリージョン。
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: 対象を絞った検出用の任意のprovider-idフィルター。
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: 検出更新のポーリング間隔。
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: 検出されたmodel用のフォールバックコンテキストウィンドウ。
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: 検出されたmodel用のフォールバック最大出力token数。

### provider例

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

Cerebrasには `cerebras/zai-glm-4.7` を使用してください。Z.AI 直結には `zai/glm-4.7` を使用します。

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

`OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）を設定してください。Zenカタログには `opencode/...` 参照、Goカタログには `opencode-go/...` 参照を使用します。ショートカット: `openclaw onboard --auth-choice opencode-zen` または `openclaw onboard --auth-choice opencode-go`。

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

`ZAI_API_KEY` を設定してください。`z.ai/*` と `z-ai/*` は受け付けられるエイリアスです。ショートカット: `openclaw onboard --auth-choice zai-api-key`。

- 汎用エンドポイント: `https://api.z.ai/api/paas/v4`
- コーディングエンドポイント（デフォルト）: `https://api.z.ai/api/coding/paas/v4`
- 汎用エンドポイントを使う場合は、base URLオーバーライド付きのカスタムproviderを定義してください。

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

中国エンドポイント用: `baseUrl: "https://api.moonshot.cn/v1"` または `openclaw onboard --auth-choice moonshot-api-key-cn`。

ネイティブMoonshotエンドポイントは共有
`openai-completions` 転送上でストリーミング使用互換性を公開しており、OpenClawは組み込みprovider id単独ではなく、そのエンドポイント機能に基づいてこれを判定します。

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

<Accordion title="MiniMax M2.7（直結）">

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
Anthropic互換ストリーミング経路では、明示的に `thinking` を設定しない限り、OpenClawはデフォルトでMiniMax thinking
を無効にします。`/fast on` または
`params.fastMode: true` は `MiniMax-M2.7` を
`MiniMax-M2.7-highspeed` に書き換えます。

</Accordion>

<Accordion title="ローカルmodel（LM Studio）">

[Local Models](/ja-JP/gateway/local-models) を参照してください。要点: 本格的なハードウェア上でLM Studio Responses API経由の大規模ローカルmodelを実行し、フォールバック用にホストmodelもマージしたままにしてください。

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: bundled Skills専用の任意のallowlistです（managed/workspace Skillsには影響しません）。
- `load.extraDirs`: 追加の共有Skillルート（最も低い優先順位）。
- `install.preferBrew`: `true` の場合、`brew` が
  利用可能なら他のinstaller種別へフォールバックする前にHomebrew installerを優先します。
- `install.nodeManager`: `metadata.openclaw.install`
  仕様用のnode installer優先設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false` は、bundled/installedであってもSkillを無効にします。
- `entries.<skillKey>.apiKey`: 主要env varを宣言するSkill用の簡易設定（平文文字列またはSecretRefオブジェクト）。

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
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

- 読み込み元: `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions`、および `plugins.load.paths`。
- 検出では、ネイティブOpenClaw Plugin に加え、互換性のあるCodex bundleとClaude bundleも受け付けます。manifestのないClaudeデフォルトレイアウトbundleも含まれます。
- **設定変更には Gateway の再起動が必要です。**
- `allow`: 任意のallowlistです（一覧にあるPluginのみ読み込み）。`deny` が優先されます。
- `plugins.entries.<id>.apiKey`: PluginレベルのAPIキー簡易フィールド（Pluginがサポートしている場合）。
- `plugins.entries.<id>.env`: Pluginスコープのenv varマップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、コアは `before_prompt_build` をブロックし、レガシーな `before_agent_start` のプロンプト変更フィールドを無視します。一方で、レガシーな `modelOverride` と `providerOverride` は保持します。ネイティブPlugin hookと、サポートされるbundle提供hookディレクトリに適用されます。
- `plugins.entries.<id>.subagent.allowModelOverride`: このPluginがバックグラウンドsubagent実行に対して実行単位の `provider` および `model` オーバーライドを要求することを明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼されたsubagentオーバーライド用の、正規 `provider/model` ターゲットの任意allowlist。意図的に任意modelを許可したい場合にのみ `"*"` を使ってください。
- `plugins.entries.<id>.config`: Plugin定義の設定オブジェクト（利用可能な場合はネイティブOpenClaw Plugin schemaで検証されます）。
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch provider設定。
  - `apiKey`: Firecrawl APIキー（SecretRefを受け付けます）。`plugins.entries.firecrawl.config.webSearch.apiKey`、レガシーな `tools.web.fetch.firecrawl.apiKey`、または `FIRECRAWL_API_KEY` env var にフォールバックします。
  - `baseUrl`: Firecrawl API base URL（デフォルト: `https://api.firecrawl.dev`）。
  - `onlyMainContent`: ページからメインコンテンツのみ抽出します（デフォルト: `true`）。
  - `maxAgeMs`: 最大キャッシュ経過時間（ミリ秒）（デフォルト: `172800000` / 2日）。
  - `timeoutSeconds`: スクレイプリクエストのタイムアウト秒数（デフォルト: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok web search）設定。
  - `enabled`: X Search providerを有効にします。
  - `model`: 検索に使用するGrok model（例: `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`: memory dreaming設定。フェーズとしきい値については [Dreaming](/ja-JP/concepts/dreaming) を参照してください。
  - `enabled`: dreamingのマスタースイッチ（デフォルト `false`）。
  - `frequency`: 各完全dreaming sweepのCron頻度（デフォルトでは `"0 3 * * *"`）。
  - フェーズポリシーとしきい値は実装詳細です（ユーザー向け設定キーではありません）。
- 完全なmemory設定は [Memory configuration reference](/ja-JP/reference/memory-config) にあります:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効化されたClaude bundle Plugin は、`settings.json` から組み込みPiデフォルトを提供することもできます。OpenClawはそれらを生のOpenClaw設定パッチとしてではなく、サニタイズ済みagent設定として適用します。
- `plugins.slots.memory`: アクティブなmemory Plugin idを選択します。memory Plugin を無効にするには `"none"`。
- `plugins.slots.contextEngine`: アクティブなcontext engine Plugin idを選択します。別のengineをインストールして選択しない限り、デフォルトは `"legacy"` です。
- `plugins.installs`: `openclaw plugins update` によって使用されるCLI管理のインストールメタデータ。
  - `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、`resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt` を含みます。
  - `plugins.installs.*` は管理状態として扱い、手動編集よりCLIコマンドを優先してください。

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
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定時は無効なので、browserナビゲーションはデフォルトで厳格なままです。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` は、private-network browserナビゲーションを意図的に信頼する場合にのみ設定してください。
- 厳格モードでは、リモートCDP profileエンドポイント（`profiles.*.cdpUrl`）も、到達性/検出チェック時に同じprivate-networkブロックの対象になります。
- `ssrfPolicy.allowPrivateNetwork` はレガシーエイリアスとして引き続きサポートされます。
- 厳格モードでは、明示的な例外に `ssrfPolicy.hostnameAllowlist` と `ssrfPolicy.allowedHostnames` を使用してください。
- リモートprofileはattach-onlyです（start/stop/resetは無効）。
- `profiles.*.cdpUrl` は `http://`、`https://`、`ws://`、`wss://` を受け付けます。
  OpenClawに `/json/version` を検出させたい場合はHTTP(S)を使用し、
  providerが直接のDevTools WebSocket URLを提供する場合はWS(S)
  を使用してください。
- `existing-session` profileはCDPの代わりにChrome MCPを使い、
  選択されたホスト上、または接続されたbrowser node経由でattachできます。
- `existing-session` profileは、特定の
  BraveやEdgeなどのChromium系browser profileを対象にするため `userDataDir` を設定できます。
- `existing-session` profileは現在のChrome MCPルート制限を維持します:
  CSSセレクター指定の代わりにsnapshot/refベースのアクション、単一ファイルupload
  hook、dialogタイムアウトのオーバーライドなし、`wait --load networkidle` なし、
  `responsebody`、PDFエクスポート、ダウンロード傍受、バッチアクションなし。
- ローカル管理の `openclaw` profileは `cdpPort` と `cdpUrl` を自動割り当てします。リモートCDPでは
  `cdpUrl` を明示設定する場合のみ指定してください。
- 自動検出順: デフォルトbrowserがChromium系ならそれ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- Control service: loopbackのみ（portは `gateway.port` から導出、デフォルト `18791`）。
- `extraArgs` は追加の起動フラグをローカルChromium起動に付加します（例:
  `--disable-gpu`、ウィンドウサイズ指定、デバッグフラグ）。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: ネイティブアプリUIクローム用のアクセントカラー（Talk Modeバブルの色合いなど）。
- `assistant`: Control UIのidentityオーバーライド。アクティブagent identityにフォールバックします。

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
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
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
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
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
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
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

- `mode`: `local`（gatewayを実行）または `remote`（リモートgatewayへ接続）。Gatewayは `local` でない限り起動を拒否します。
- `port`: WS + HTTP 用の単一多重化port。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（デフォルト）、`lan`（`0.0.0.0`）、`tailnet`（Tailscale IPのみ）、または `custom`。
- **レガシーbindエイリアス**: `gateway.bind` には、hostエイリアス（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）ではなく、bind mode値（`auto`、`loopback`、`lan`、`tailnet`、`custom`）を使用してください。
- **Docker注意**: デフォルトの `loopback` bind はコンテナ内の `127.0.0.1` で待ち受けます。Docker bridgeネットワーク（`-p 18789:18789`）では、トラフィックは `eth0` に到着するため、gatewayに到達できません。`--network host` を使うか、全インターフェイスで待ち受けるために `bind: "lan"`（または `customBindHost: "0.0.0.0"` を指定した `bind: "custom"`）を設定してください。
- **認証**: デフォルトで必須です。loopback以外のbindにはgateway認証が必要です。実際には、共有token/password、または `gateway.auth.mode: "trusted-proxy"` を指定したidentity-aware reverse proxyを意味します。オンボーディングwizardはデフォルトでtokenを生成します。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されている場合（SecretRefを含む）、`gateway.auth.mode` を `token` または `password` に明示設定してください。両方が設定されていてmodeが未設定の場合、起動およびサービスのインストール/修復フローは失敗します。
- `gateway.auth.mode: "none"`: 明示的な認証なしモード。信頼できるlocal loopback構成でのみ使用してください。これは意図的にオンボーディングプロンプトでは提供されません。
- `gateway.auth.mode: "trusted-proxy"`: 認証をidentity-aware reverse proxyへ委譲し、`gateway.trustedProxies` からのidentityヘッダーを信頼します（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。このモードは**非loopback**のproxyソースを想定しています。同一ホストのloopback reverse proxyはtrusted-proxy認証の条件を満たしません。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve identityヘッダーによりControl UI/WebSocket認証を満たせます（`tailscale whois` で検証）。HTTP APIエンドポイントはそのTailscaleヘッダー認証を**使用しません**。代わりにgatewayの通常のHTTP認証モードに従います。このtoken不要フローはgatewayホストが信頼されている前提です。`tailscale.mode = "serve"` の場合、デフォルトは `true` です。
- `gateway.auth.rateLimit`: 任意の認証失敗レート制限です。クライアントIPごと、かつ認証スコープごとに適用されます（共有secretとdevice-tokenは独立して追跡されます）。ブロックされた試行には `429` + `Retry-After` が返されます。
  - 非同期Tailscale Serve Control UI経路では、同じ `{scope, clientIp}` に対する失敗試行は、失敗書き込み前に直列化されます。そのため、同一クライアントからの同時な不正試行は、両方が単なる不一致として競合通過するのではなく、2回目のリクエストで制限に達する場合があります。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。localhostトラフィックもレート制限したい場合（テスト構成や厳格なproxyデプロイなど）は `false` に設定してください。
- browser起点のWS認証試行は、loopback除外を無効化した状態で常にスロットリングされます（browserベースのlocalhost総当たり攻撃に対する多層防御）。
- loopback上では、これらのbrowser起点ロックアウトは正規化された `Origin`
  値ごとに分離されるため、1つのlocalhost originからの繰り返し失敗が別originを
  自動的にロックアウトすることはありません。
- `tailscale.mode`: `serve`（tailnetのみ、loopback bind）または `funnel`（公開、認証必須）。
- `controlUi.allowedOrigins`: Gateway WebSocket接続用の明示的browser-origin allowlist。browserクライアントが非loopback originから接続する想定なら必須です。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Hostヘッダーoriginポリシーに意図的に依存するデプロイ向けに、Hostヘッダーoriginフォールバックを有効にする危険なモード。
- `remote.transport`: `ssh`（デフォルト）または `direct`（ws/wss）。`direct` の場合、`remote.url` は `ws://` または `wss://` でなければなりません。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 信頼されたprivate-network IPへの平文 `ws://` を許可するクライアント側の緊急オーバーライドです。平文のデフォルトは引き続きloopback専用です。
- `gateway.remote.token` / `.password` はリモートクライアント認証情報フィールドです。これら自体はgateway認証を設定しません。
- `gateway.push.apns.relay.baseUrl`: 公式/TestFlight iOSビルドがrelayバックエンド登録をgatewayへ公開した後に使う、外部APNs relayのbase HTTPS URL。このURLはiOSビルドへコンパイルされたrelay URLと一致している必要があります。
- `gateway.push.apns.relay.timeoutMs`: gatewayからrelayへの送信タイムアウト（ミリ秒）。デフォルトは `10000`。
- relayバックエンド登録は特定のgateway identityへ委譲されます。ペア済みiOSアプリは `gateway.identity.get` を取得し、そのidentityをrelay登録に含め、登録スコープのsend grantをgatewayへ転送します。別のgatewayは、その保存済み登録を再利用できません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記relay設定用の一時的なenvオーバーライド。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL用の開発専用escape hatch。本番relay URLはHTTPSのままにしてください。
- `gateway.channelHealthCheckMinutes`: channelヘルスモニター間隔（分）。ヘルスモニター再起動をグローバルに無効にするには `0` を設定してください。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: stale-socketしきい値（分）。これは `gateway.channelHealthCheckMinutes` 以上に保ってください。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: ローリング1時間あたりの、channel/accountごとのヘルスモニター再起動最大数。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバルmonitorを有効なままにしつつ、channel単位でヘルスモニター再起動をオプトアウトします。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: マルチアカウントchannel用のアカウント単位オーバーライド。設定されている場合、channelレベルオーバーライドより優先されます。
- ローカルgateway呼び出し経路では、`gateway.auth.*` が未設定のときに限り、`gateway.remote.*` をフォールバックとして使用できます。
- `gateway.auth.token` / `gateway.auth.password` がSecretRef経由で明示設定されていて未解決の場合、解決はfail-closedになります（remoteフォールバックでマスクされません）。
- `trustedProxies`: TLS終端または転送済みクライアントヘッダーを注入するreverse proxyのIP。自分が管理するproxyのみを列挙してください。loopbackエントリは同一ホストのproxy/ローカル検出構成（例: Tailscale Serveやローカルreverse proxy）には引き続き有効ですが、loopbackリクエストを `gateway.auth.mode: "trusted-proxy"` の対象には**しません**。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` が欠落していればgatewayは `X-Real-IP` を受け付けます。fail-closed動作のためデフォルトは `false`。
- `gateway.tools.deny`: HTTP `POST /tools/invoke` 用に追加でブロックするtool名（デフォルトdenyリストを拡張）。
- `gateway.tools.allow`: デフォルトHTTP denyリストからtool名を除外します。

</Accordion>

### OpenAI互換エンドポイント

- Chat Completions: デフォルトで無効です。`gateway.http.endpoints.chatCompletions.enabled: true` で有効にします。
- Responses API: `gateway.http.endpoints.responses.enabled`。
- Responses URL入力ハードニング:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空のallowlistは未設定として扱われます。URLフェッチを無効にするには `gateway.http.endpoints.responses.files.allowUrl=false`
    および/または `gateway.http.endpoints.responses.images.allowUrl=false` を使用してください。
- 任意のレスポンスハードニングヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity`（自分が管理するHTTPS originに対してのみ設定してください。 [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts) を参照）

### マルチインスタンス分離

1台のホストで、固有のportとstate dirを持つ複数Gatewayを実行します:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利なフラグ: `--dev`（`~/.openclaw-dev` + port `19001` を使用）、`--profile <name>`（`~/.openclaw-<name>` を使用）。

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

- `enabled`: gateway listenerでTLS終端（HTTPS/WSS）を有効にします（デフォルト: `false`）。
- `autoGenerate`: 明示ファイルが設定されていない場合に、ローカルの自己署名cert/keyペアを自動生成します。ローカル/開発用途専用です。
- `certPath`: TLS証明書ファイルへのファイルシステムパス。
- `keyPath`: TLS秘密鍵ファイルへのファイルシステムパス。権限制限を保ってください。
- `caPath`: クライアント検証またはカスタム信頼チェーン用の任意のCA bundleパス。

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

- `mode`: 実行時に設定編集をどう適用するかを制御します。
  - `"off"`: ライブ編集を無視します。変更には明示的な再起動が必要です。
  - `"restart"`: 設定変更時に常にgatewayプロセスを再起動します。
  - `"hot"`: 再起動せずにプロセス内で変更を適用します。
  - `"hybrid"`（デフォルト）: まずhot reloadを試み、必要なら再起動へフォールバックします。
- `debounceMs`: 設定変更を適用する前のdebounceウィンドウ（ms）（非負整数）。
- `deferralTimeoutMs`: 実行中操作を待機してから強制再起動するまでの最大時間（ms）（デフォルト: `300000` = 5分）。

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

認証: `Authorization: Bearer <token>` または `x-openclaw-token: <token>`。
クエリ文字列のhook tokenは拒否されます。

検証と安全性に関する注意:

- `hooks.enabled=true` には空でない `hooks.token` が必要です。
- `hooks.token` は `gateway.auth.token` と**異なっていなければなりません**。Gateway tokenの再利用は拒否されます。
- `hooks.path` は `/` にできません。`/hooks` のような専用サブパスを使用してください。
- `hooks.allowRequestSessionKey=true` の場合は、`hooks.allowedSessionKeyPrefixes` を制限してください（例: `["hook:"]`）。
- mappingまたはpresetがテンプレート化された `sessionKey` を使用する場合は、`hooks.allowedSessionKeyPrefixes` と `hooks.allowRequestSessionKey=true` を設定してください。静的なmapping keyにはそのオプトインは不要です。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエストpayload由来の `sessionKey` は、`hooks.allowRequestSessionKey=true` の場合にのみ受け付けられます（デフォルト: `false`）。
- `POST /hooks/<name>` → `hooks.mappings` により解決
  - テンプレートレンダリングされたmapping `sessionKey` 値は外部供給として扱われ、これも `hooks.allowRequestSessionKey=true` を必要とします。

<Accordion title="Mapping詳細">

- `match.path` は `/hooks` の後ろのサブパスに一致します（例: `/hooks/gmail` → `gmail`）。
- `match.source` は汎用パス用のpayloadフィールドに一致します。
- `{{messages[0].subject}}` のようなテンプレートはpayloadから読み取ります。
- `transform` はhook actionを返すJS/TS moduleを指せます。
  - `transform.module` は相対パスでなければならず、`hooks.transformsDir` 内に留まる必要があります（絶対パスとトラバーサルは拒否されます）。
- `agentId` は特定のagentへルーティングします。不明なIDはデフォルトにフォールバックします。
- `allowedAgentIds`: 明示ルーティングを制限します（`*` または省略 = すべて許可、`[]` = すべて拒否）。
- `defaultSessionKey`: 明示的な `sessionKey` がないhook agent実行用の任意の固定session key。
- `allowRequestSessionKey`: `/hooks/agent` 呼び出し元およびテンプレート駆動mapping session keyに `sessionKey` 設定を許可します（デフォルト: `false`）。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値（リクエスト + mapping）用の任意の接頭辞allowlist。例: `["hook:"]`。いずれかのmappingまたはpresetがテンプレート化された `sessionKey` を使う場合は必須になります。
- `deliver: true` は最終返信をchannelへ送信します。`channel` のデフォルトは `last` です。
- `model` はこのhook実行用のLLMをオーバーライドします（modelカタログが設定されている場合、許可されている必要があります）。

</Accordion>

### Gmail統合

- 組み込みGmail presetは `sessionKey: "hook:gmail:{{messages[0].id}}"` を使用します。
- このメッセージ単位ルーティングを維持する場合は、`hooks.allowRequestSessionKey: true` を設定し、`hooks.allowedSessionKeyPrefixes` をGmail名前空間に一致するよう制限してください。たとえば `["hook:", "hook:gmail:"]`。
- `hooks.allowRequestSessionKey: false` が必要な場合は、テンプレート化されたデフォルトの代わりに静的 `sessionKey` でpresetをオーバーライドしてください。

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

- Gatewayは、設定されている場合、起動時に自動で `gog gmail watch serve` を開始します。無効にするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。
- Gatewayと並行して別の `gog gmail watch serve` を実行しないでください。

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- agentが編集可能なHTML/CSS/JSとA2UIを、Gateway port配下のHTTPで配信します:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカル専用: `gateway.bind: "loopback"`（デフォルト）のままにしてください。
- 非loopback bind: canvasルートには、他のGateway HTTPサーフェスと同様にGateway認証（token/password/trusted-proxy）が必要です。
- Node WebViewは通常authヘッダーを送信しません。nodeがペアリングされ接続されると、Gatewayはcanvas/A2UIアクセス用のnodeスコープcapability URLを通知します。
- Capability URLはアクティブなnode WSセッションに紐づき、すぐ失効します。IPベースのフォールバックは使用されません。
- 配信するHTMLへlive-reloadクライアントを注入します。
- 空の場合はstarter `index.html` を自動作成します。
- A2UIも `/__openclaw__/a2ui/` で配信します。
- 変更にはgateway再起動が必要です。
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

- `minimal`（デフォルト）: TXTレコードから `cliPath` + `sshPort` を省略します。
- `full`: `cliPath` + `sshPort` を含めます。
- hostnameのデフォルトは `openclaw` です。`OPENCLAW_MDNS_HOSTNAME` で上書きできます。

### 広域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 配下にユニキャストDNS-SD zoneを書き込みます。ネットワーク間Discoveryには、DNSサーバー（CoreDNS推奨）+ Tailscale split DNS と組み合わせてください。

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

- インラインenv varは、プロセスenvにそのキーが存在しない場合にのみ適用されます。
- `.env` ファイル: CWD の `.env` + `~/.openclaw/.env`（どちらも既存varを上書きしません）。
- `shellEnv`: ログインshell profileから、欠けている期待キーを取り込みます。
- 優先順位の詳細は [Environment](/ja-JP/help/environment) を参照してください。

### env var置換

任意の設定文字列内で `${VAR_NAME}` を使ってenv varを参照できます:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 一致するのは大文字名のみです: `[A-Z_][A-Z0-9_]*`。
- 欠落/空のvarは設定読み込み時にエラーになります。
- リテラルな `${VAR}` にするには `$${VAR}` でエスケープします。
- `$include` と一緒にも使えます。

---

## Secrets

SecretRefは加法的です: 平文値も引き続き機能します。

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

### 対応認証情報サーフェス

- 正規マトリクス: [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface)
- `secrets apply` は、サポートされた `openclaw.json` 認証情報パスを対象にします。
- `auth-profiles.json` refもランタイム解決と監査対象に含まれます。

### Secret provider設定

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
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

注意:

- `file` providerは `mode: "json"` と `mode: "singleValue"` をサポートします（singleValueモードでは `id` は `"value"` でなければなりません）。
- `exec` providerは絶対 `command` パスが必要で、stdin/stdout上のプロトコルpayloadを使用します。
- デフォルトでは、symlink command pathは拒否されます。解決後ターゲットパスを検証しつつsymlink pathを許可するには `allowSymlinkCommand: true` を設定してください。
- `trustedDirs` が設定されている場合、trusted-dirチェックは解決後ターゲットパスに適用されます。
- `exec` 子プロセス環境はデフォルトで最小限です。必要な変数は `passEnv` で明示的に渡してください。
- SecretRefはアクティベーション時にメモリ内スナップショットへ解決され、その後のリクエスト経路はそのスナップショットのみを読み取ります。
- アクティブサーフェスフィルタリングはアクティベーション中に適用されます: 有効なサーフェス上の未解決refは起動/リロードを失敗させ、非アクティブサーフェスは診断つきでスキップされます。

---

## Auth保存

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

- agent単位profileは `<agentDir>/auth-profiles.json` に保存されます。
- `auth-profiles.json` は、静的認証情報モード用の値レベルref（`api_key` 用 `keyRef`、`token` 用 `tokenRef`）をサポートします。
- OAuthモードprofile（`auth.profiles.<id>.mode = "oauth"`）は、SecretRefバックエンドのauth-profile認証情報をサポートしません。
- 静的ランタイム認証情報は、解決済みメモリ内スナップショットから取得されます。レガシーな静的 `auth.json` エントリは発見時に消去されます。
- レガシーOAuthは `~/.openclaw/credentials/oauth.json` から取り込みます。
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

- `billingBackoffHours`: profileが真の
  billing/クレジット不足エラーで失敗したときのベースバックオフ時間（時間）（デフォルト: `5`）。明示的なbilling文言は
  `401`/`403` 応答でもここに分類されることがありますが、provider固有テキスト
  matcherはそれを所有するproviderにスコープされたままです（例: OpenRouter の
  `Key limit exceeded`）。再試行可能なHTTP `402` の使用量ウィンドウまたは
  organization/workspace支出上限メッセージは、代わりに `rate_limit` 経路に留まります。
- `billingBackoffHoursByProvider`: billingバックオフ時間の任意のprovider単位オーバーライド。
- `billingMaxHours`: billingバックオフの指数成長に対する上限時間（デフォルト: `24`）。
- `authPermanentBackoffMinutes`: 高信頼の `auth_permanent` 失敗に対するベースバックオフ分数（デフォルト: `10`）。
- `authPermanentMaxMinutes`: `auth_permanent` バックオフ成長の上限分数（デフォルト: `60`）。
- `failureWindowHours`: バックオフカウンタに使うローリングウィンドウ時間（デフォルト: `24`）。
- `overloadedProfileRotations`: overloadedエラー時にmodelフォールバックへ切り替える前の、同一provider auth-profileローテーション最大数（デフォルト: `1`）。`ModelNotReadyException` のようなprovider-busy形状はここに分類されます。
- `overloadedBackoffMs`: overloadedなprovider/profileローテーションを再試行する前の固定遅延（デフォルト: `0`）。
- `rateLimitedProfileRotations`: rate-limitエラー時にmodelフォールバックへ切り替える前の、同一provider auth-profileローテーション最大数（デフォルト: `1`）。そのrate-limitバケットには、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted` のようなprovider形状テキストも含まれます。

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

- デフォルトログファイル: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`。
- 安定したパスにするには `logging.file` を設定してください。
- `consoleLevel` は `--verbose` で `debug` に上がります。
- `maxFileBytes`: 書き込み抑止前の最大ログファイルサイズ（bytes）（正の整数。デフォルト: `524288000` = 500 MB）。本番デプロイでは外部ログローテーションを使用してください。

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

- `enabled`: 計測出力のマスタートグル（デフォルト: `true`）。
- `flags`: 対象を絞ったログ出力を有効にするフラグ文字列配列です（`"telegram.*"` や `"*"` のようなワイルドカードをサポート）。
- `stuckSessionWarnMs`: セッションが処理中状態のままの間にstuck-session警告を出すための経過時間しきい値（ms）。
- `otel.enabled`: OpenTelemetryエクスポートパイプラインを有効にします（デフォルト: `false`）。
- `otel.endpoint`: OTelエクスポート用のcollector URL。
- `otel.protocol`: `"http/protobuf"`（デフォルト）または `"grpc"`。
- `otel.headers`: OTelエクスポートリクエストとともに送信される追加HTTP/gRPCメタデータヘッダー。
- `otel.serviceName`: resource属性用のservice名。
- `otel.traces` / `otel.metrics` / `otel.logs`: trace、metrics、またはlogエクスポートを有効にします。
- `otel.sampleRate`: traceサンプリング率 `0`–`1`。
- `otel.flushIntervalMs`: 定期telemetry flush間隔（ms）。
- `cacheTrace.enabled`: 組み込み実行用のcache traceスナップショットを記録します（デフォルト: `false`）。
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

- `channel`: npm/gitインストール用のリリースchannel — `"stable"`、`"beta"`、または `"dev"`。
- `checkOnStart`: gateway起動時にnpm更新を確認します（デフォルト: `true`）。
- `auto.enabled`: packageインストール用のバックグラウンド自動更新を有効にします（デフォルト: `false`）。
- `auto.stableDelayHours`: stable channel自動適用までの最小遅延時間（デフォルト: `6`、最大: `168`）。
- `auto.stableJitterHours`: stable channelロールアウトの追加分散ウィンドウ（時間）（デフォルト: `12`、最大: `168`）。
- `auto.betaCheckIntervalHours`: beta channel確認の実行間隔（時間）（デフォルト: `1`、最大: `24`）。

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
- `dispatch.enabled`: ACPセッションターンdispatch用の独立ゲート（デフォルト: `true`）。ACPコマンドは利用可能なまま実行をブロックしたい場合は `false` に設定してください。
- `backend`: デフォルトACPランタイムbackend id（登録済みACPランタイムPlugin と一致している必要があります）。
- `defaultAgent`: spawnで明示的なターゲットを指定しない場合のフォールバックACPターゲットagent id。
- `allowedAgents`: ACPランタイムセッションに許可されるagent idのallowlist。空は追加制限なしを意味します。
- `maxConcurrentSessions`: 同時にアクティブにできるACPセッションの最大数。
- `stream.coalesceIdleMs`: ストリーミングテキスト用のアイドルflushウィンドウ（ms）。
- `stream.maxChunkChars`: ストリーミングブロック投影を分割する前の最大チャンクサイズ。
- `stream.repeatSuppression`: ターンごとの繰り返しstatus/tool行を抑制します（デフォルト: `true`）。
- `stream.deliveryMode`: `"live"` は段階的にストリームし、`"final_only"` はターン終端イベントまでバッファします。
- `stream.hiddenBoundarySeparator`: 非表示toolイベント後、可視テキストの前に入れる区切り文字（デフォルト: `"paragraph"`）。
- `stream.maxOutputChars`: ACPターンごとに投影されるassistant出力文字数の最大値。
- `stream.maxSessionUpdateChars`: 投影されるACP status/update行の最大文字数。
- `stream.tagVisibility`: ストリーミングイベント用の、タグ名から真偽値の可視性オーバーライドへの記録。
- `runtime.ttlMinutes`: ACPセッションworkerがクリーンアップ対象になるまでの、アイドルTTL（分）。
- `runtime.installCommand`: ACPランタイム環境のブートストラップ時に実行する任意のインストールコマンド。

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

- `cli.banner.taglineMode` はバナーのtaglineスタイルを制御します:
  - `"random"`（デフォルト）: 回転する面白い/季節のtagline。
  - `"default"`: 固定の中立tagline（`All your chats, one OpenClaw.`）。
  - `"off"`: taglineテキストなし（バナーのタイトル/バージョンは引き続き表示）。
- バナー全体を隠すには（taglineだけでなく）、env `OPENCLAW_HIDE_BANNER=1` を設定してください。

---

## wizard

CLIガイド付きセットアップフロー（`onboard`、`configure`、`doctor`）によって書き込まれるメタデータ:

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

[Agentのデフォルト](#agent-defaults) の `agents.list` identityフィールドを参照してください。

---

## Bridge（レガシー、削除済み）

現在のビルドにはTCP bridgeは含まれていません。NodeはGateway WebSocket経由で接続します。`bridge.*` キーはもはや設定schemaの一部ではありません（削除するまで検証は失敗します。`openclaw doctor --fix` で不明キーを取り除けます）。

<Accordion title="レガシーbridge設定（参考用の履歴情報）">

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
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: 完了済みの分離Cron実行sessionを `sessions.json` から刈り込むまでどれだけ保持するか。アーカイブされた削除済みCron transcriptのクリーンアップも制御します。デフォルト: `24h`。無効にするには `false` を設定してください。
- `runLog.maxBytes`: 刈り込み前の実行ログファイルごとの最大サイズ（`cron/runs/<jobId>.jsonl`）。デフォルト: `2_000_000` bytes。
- `runLog.keepLines`: 実行ログ刈り込みが発生したときに保持する最新行数。デフォルト: `2000`。
- `webhookToken`: Cron Webhook POST配信（`delivery.mode = "webhook"`）に使用するbearer token。省略時は認証ヘッダーを送信しません。
- `webhook`: 非推奨のレガシーフォールバックWebhook URL（http/https）。まだ `notify: true` を持つ保存済みjobにのみ使用されます。

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

- `maxAttempts`: 一時エラー時にone-shot jobへ行う最大再試行回数（デフォルト: `3`、範囲: `0`–`10`）。
- `backoffMs`: 各再試行で使うbackoff遅延のms配列（デフォルト: `[30000, 60000, 300000]`、1–10エントリ）。
- `retryOn`: 再試行を引き起こすエラー型 — `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略時はすべての一時型を再試行します。

one-shot Cron jobにのみ適用されます。繰り返しjobは別の失敗処理を使用します。

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
- `after`: アラート発火前の連続失敗回数（正の整数、最小: `1`）。
- `cooldownMs`: 同じjobに対する繰り返しアラート間の最小ミリ秒数（非負整数）。
- `mode`: 配信モード — `"announce"` はchannelメッセージで送信し、`"webhook"` は設定済みWebhookへPOSTします。
- `accountId`: アラート配信のスコープを絞る任意のaccountまたはchannel id。

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

- すべてのjobに対するCron失敗通知のデフォルト送信先です。
- `mode`: `"announce"` または `"webhook"`。十分なターゲットデータがある場合のデフォルトは `"announce"` です。
- `channel`: announce配信用のchannelオーバーライド。`"last"` は最後に分かっている配信channelを再利用します。
- `to`: 明示的なannounceターゲットまたはWebhook URL。Webhook modeでは必須です。
- `accountId`: 配信用の任意のaccountオーバーライド。
- job単位の `delivery.failureDestination` はこのグローバルデフォルトを上書きします。
- グローバルにもjob単位にも失敗送信先が設定されていない場合、すでに `announce` で配信するjobは、失敗時にそのprimary announceターゲットへフォールバックします。
- `delivery.failureDestination` は、jobのprimary `delivery.mode` が `"webhook"` でない限り、`sessionTarget="isolated"` jobでのみサポートされます。

[Cron Jobs](/ja-JP/automation/cron-jobs) を参照してください。分離されたCron実行は [background tasks](/ja-JP/automation/tasks) として追跡されます。

---

## メディアmodelテンプレート変数

`tools.media.models[].args` で展開されるテンプレートプレースホルダー:

| Variable           | 説明                                       |
| ------------------ | ------------------------------------------ |
| `{{Body}}`         | 完全な受信メッセージ本文                   |
| `{{RawBody}}`      | 生の本文（履歴/送信者ラッパーなし）        |
| `{{BodyStripped}}` | グループmentionを除去した本文              |
| `{{From}}`         | 送信者識別子                               |
| `{{To}}`           | 宛先識別子                                 |
| `{{MessageSid}}`   | channelメッセージid                        |
| `{{SessionId}}`    | 現在のsession UUID                         |
| `{{IsNewSession}}` | 新しいsessionが作成されたとき `"true"`     |
| `{{MediaUrl}}`     | 受信メディアの疑似URL                      |
| `{{MediaPath}}`    | ローカルメディアパス                       |
| `{{MediaType}}`    | メディア種別（image/audio/document/…）     |
| `{{Transcript}}`   | 音声transcript                             |
| `{{Prompt}}`       | CLIエントリ用に解決されたメディアprompt    |
| `{{MaxChars}}`     | CLIエントリ用に解決された最大出力文字数    |
| `{{ChatType}}`     | `"direct"` または `"group"`                |
| `{{GroupSubject}}` | グループ件名（best effort）                |
| `{{GroupMembers}}` | グループメンバーのプレビュー（best effort） |
| `{{SenderName}}`   | 送信者表示名（best effort）                |
| `{{SenderE164}}`   | 送信者電話番号（best effort）              |
| `{{Provider}}`     | providerヒント（whatsapp、telegram、discord など） |

---

## Config includes（`$include`）

設定を複数ファイルへ分割します:

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

- 単一ファイル: その包含オブジェクトを置き換えます。
- ファイル配列: 順にdeep-mergeされます（後のものが前のものを上書き）。
- 兄弟キー: includeの後でマージされます（includeされた値を上書き）。
- ネストされたinclude: 最大10レベルまで。
- パス: include元ファイルからの相対で解決されますが、トップレベル設定ディレクトリ（`openclaw.json` の `dirname`）内に留まる必要があります。絶対/`../` 形式も、その境界内に解決される場合にのみ許可されます。
- エラー: ファイル欠落、構文解析エラー、循環includeに対して明確なメッセージが出ます。

---

_関連: [Configuration](/ja-JP/gateway/configuration) · [Configuration Examples](/ja-JP/gateway/configuration-examples) · [Doctor](/ja-JP/gateway/doctor)_
