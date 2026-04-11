---
read_when:
    - 正確なフィールドレベルの設定セマンティクスまたはデフォルト値が必要です
    - channel、model、gateway、またはtoolの設定ブロックを検証しています
summary: コアのOpenClawキー、デフォルト値、および専用サブシステムリファレンスへのリンクのためのGateway設定リファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-04-11T15:16:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 351a245bed59d852ea8582e4e9fec5017a5c623cd6f0034766cdea1b5330be3c
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# 設定リファレンス

`~/.openclaw/openclaw.json` のコア設定リファレンスです。タスク指向の概要については、[Configuration](/ja-JP/gateway/configuration) を参照してください。

このページでは、主要なOpenClaw設定サーフェスを扱い、サブシステムに独自のより詳細なリファレンスがある場合はそこへのリンクを示します。1ページですべてのchannel/plugin所有のコマンドカタログや、memory/QMDの深いノブをすべてインラインで載せようとはしていません。

コード上の真実:

- `openclaw config schema` は、検証とControl UIに使われるライブJSON Schemaを出力します。利用可能な場合は、bundled/plugin/channelメタデータがマージされます
- `config.schema.lookup` は、ドリルダウン用ツール向けに、1つのパススコープ付きスキーマノードを返します
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、config-docベースラインハッシュを現在のスキーマサーフェスに対して検証します

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および `plugins.entries.memory-core.config.dreaming` 配下のdreaming設定については [Memory configuration reference](/ja-JP/reference/memory-config)
- 現在の組み込み + bundledコマンドカタログについては [Slash Commands](/ja-JP/tools/slash-commands)
- channel固有のコマンドサーフェスについては、各channel/pluginページ

設定形式は **JSON5** です（コメント + 末尾カンマを許可）。すべてのフィールドは省略可能です。省略された場合、OpenClawは安全なデフォルトを使います。

---

## Channels

各channelは、その設定セクションが存在する場合に自動的に開始されます（`enabled: false` でない限り）。

### DMおよびグループアクセス

すべてのchannelはDMポリシーとグループポリシーをサポートします。

| DM policy           | 動作                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (default) | 不明な送信者には1回限りのペアリングコードが送られ、ownerが承認する必要があります |
| `allowlist`         | `allowFrom` 内の送信者のみ（またはペアリング済み許可ストア）     |
| `open`              | すべての受信DMを許可します（`allowFrom: ["*"]` が必要）          |
| `disabled`          | すべての受信DMを無視します                                      |

| Group policy          | 動作                                                         |
| --------------------- | ------------------------------------------------------------ |
| `allowlist` (default) | 設定された許可リストに一致するグループのみ                  |
| `open`                | グループ許可リストをバイパスします（mention-gatingは引き続き適用されます） |
| `disabled`            | すべてのグループ/ルームメッセージをブロックします           |

<Note>
`channels.defaults.groupPolicy` は、providerの `groupPolicy` が未設定のときのデフォルトを設定します。
ペアリングコードは1時間後に期限切れになります。保留中のDMペアリング要求は **channelごとに3件** までに制限されます。
providerブロックが完全に欠落している場合（`channels.<provider>` が存在しない場合）、実行時のグループポリシーは起動時警告付きで `allowlist`（フェイルクローズド）にフォールバックします。
</Note>

### チャンネルモデルのオーバーライド

特定のchannel IDをモデルに固定するには `channels.modelByChannel` を使います。値には `provider/model` または設定済みモデルエイリアスを指定できます。channelマッピングは、セッションにすでにモデルオーバーライドがない場合（たとえば `/model` で設定された場合）に適用されます。

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

### チャンネルのデフォルトとheartbeat

provider間で共有されるグループポリシーとheartbeat動作には `channels.defaults` を使います。

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

- `channels.defaults.groupPolicy`: providerレベルの `groupPolicy` が未設定のときのフォールバックグループポリシーです。
- `channels.defaults.contextVisibility`: すべてのchannelに対する補足コンテキスト表示モードのデフォルトです。値: `all`（デフォルト、引用/スレッド/履歴コンテキストをすべて含む）、`allowlist`（許可リストに載った送信者からのコンテキストのみを含む）、`allowlist_quote`（allowlistと同じですが、明示的な引用/返信コンテキストを保持します）。channelごとのオーバーライド: `channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`: heartbeat出力に正常なchannelステータスを含めます。
- `channels.defaults.heartbeat.showAlerts`: heartbeat出力に劣化/エラーステータスを含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケータースタイルのheartbeat出力を表示します。

### WhatsApp

WhatsAppはGatewayのweb channel（Baileys Web）経由で動作します。リンク済みセッションが存在する場合、自動的に開始されます。

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

- 送信コマンドは、`default` アカウントが存在する場合はそれを、存在しない場合は最初に設定されたアカウントID（ソート順）をデフォルトとして使います。
- オプションの `channels.whatsapp.defaultAccount` は、設定済みアカウントIDに一致する場合、このフォールバックのデフォルトアカウント選択を上書きします。
- レガシーな単一アカウントBaileys認証ディレクトリは、`openclaw doctor` により `whatsapp/default` に移行されます。
- アカウントごとのオーバーライド: `channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

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

- Botトークン: `channels.telegram.botToken` または `channels.telegram.tokenFile`（通常ファイルのみ。symlinkは拒否されます）。デフォルトアカウントのフォールバックとして `TELEGRAM_BOT_TOKEN` も使えます。
- オプションの `channels.telegram.defaultAccount` は、設定済みアカウントIDに一致する場合、デフォルトアカウント選択を上書きします。
- 複数アカウント構成（2個以上のアカウントID）では、フォールバックルーティングを避けるため、明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定してください。これが欠落または無効な場合、`openclaw doctor` が警告します。
- `configWrites: false` は、Telegram起点の設定書き込み（supergroup ID移行、`/config set|unset`）をブロックします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、forum topic向けの永続的ACPバインディングを設定します（`match.peer.id` には正規の `chatId:topic:topicId` を使ってください）。フィールドの意味は [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) と共通です。
- Telegramのストリームプレビューは `sendMessage` + `editMessageText` を使います（ダイレクトチャットでもグループチャットでも動作します）。
- retryポリシー: [Retry policy](/ja-JP/concepts/retry) を参照してください。

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

- Token: `channels.discord.token`。デフォルトアカウントのフォールバックとして `DISCORD_BOT_TOKEN` を使えます。
- 明示的なDiscord `token` を指定する直接の送信呼び出しでは、その呼び出しにそのトークンを使います。アカウントのretry/ポリシー設定は、アクティブなランタイムスナップショットで選択されたアカウントから引き続き取得されます。
- オプションの `channels.discord.defaultAccount` は、設定済みアカウントIDに一致する場合、デフォルトアカウント選択を上書きします。
- 配信ターゲットには `user:<id>`（DM）または `channel:<id>`（guild channel）を使ってください。数字だけのIDは拒否されます。
- Guild slugは小文字で、空白は `-` に置き換えられます。channelキーにはslug化された名前（`#` なし）を使います。guild IDの使用を推奨します。
- bot自身が投稿したメッセージは、デフォルトでは無視されます。`allowBots: true` で有効化されます。botにメンションしたbotメッセージだけを受け入れるには `allowBots: "mentions"` を使ってください（bot自身のメッセージは引き続き除外されます）。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（およびchannelオーバーライド）は、botにはメンションせず他のユーザーまたはロールにメンションしているメッセージを破棄します（@everyone/@hereは除く）。
- `maxLinesPerMessage`（デフォルト17）は、2000文字未満でも行数の多いメッセージを分割します。
- `channels.discord.threadBindings` は、Discordのスレッド束縛ルーティングを制御します。
  - `enabled`: スレッド束縛セッション機能（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、および束縛された配信/ルーティング）に対するDiscordオーバーライド
  - `idleHours`: 非アクティブ時の自動unfocusを時間単位で指定するDiscordオーバーライド（`0` で無効）
  - `maxAgeHours`: ハード最大経過時間を時間単位で指定するDiscordオーバーライド（`0` で無効）
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` の自動スレッド作成/束縛を有効にするオプトインスイッチ
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、channelおよびスレッド向けの永続的ACPバインディングを設定します（`match.peer.id` にはchannel/thread idを使ってください）。フィールドの意味は [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) と共通です。
- `channels.discord.ui.components.accentColor` は、Discord components v2コンテナのアクセントカラーを設定します。
- `channels.discord.voice` は、Discordボイスchannel会話と、オプションの自動参加 + TTSオーバーライドを有効にします。
- `channels.discord.voice.daveEncryption` と `channels.discord.voice.decryptionFailureTolerance` は、`@discordjs/voice` のDAVEオプションにそのまま渡されます（デフォルトは `true` と `24`）。
- OpenClawはさらに、復号失敗が繰り返された後にボイスセッションから退出して再参加することで、音声受信の回復も試みます。
- `channels.discord.streaming` が正規のストリームモードキーです。レガシーな `streamMode` と真偽値の `streaming` は自動移行されます。
- `channels.discord.autoPresence` は、ランタイム可用性をbotのpresenceにマッピングします（healthy => online、degraded => idle、exhausted => dnd）。さらにオプションのステータステキストオーバーライドも可能です。
- `channels.discord.dangerouslyAllowNameMatching` は、変更可能なname/tagマッチングを再有効化します（緊急用の互換モード）。
- `channels.discord.execApprovals`: Discordネイティブのexec承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。autoモードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合にexec承認が有効化されます。
  - `approvers`: exec要求の承認を許可するDiscordユーザーID。省略時は `commands.ownerAllowFrom` にフォールバックします。
  - `agentFilter`: オプションのagent ID許可リスト。省略すると、すべてのagentの承認を転送します。
  - `sessionFilter`: オプションのsessionキーパターン（部分文字列またはregex）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）は承認者のDMに送信し、`"channel"` は送信元channelに送信し、`"both"` は両方に送信します。targetに `"channel"` が含まれる場合、ボタンを使えるのは解決済みの承認者のみです。
  - `cleanupAfterResolve`: `true` の場合、承認、拒否、またはタイムアウト後に承認DMを削除します。

**リアクション通知モード:** `off`（なし）、`own`（bot自身のメッセージ、デフォルト）、`all`（すべてのメッセージ）、`allowlist`（すべてのメッセージに対して `guilds.<id>.users` から）。

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
- サービスアカウントSecretRef（`serviceAccountRef`）にも対応しています。
- 環境変数フォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信ターゲットには `spaces/<spaceId>` または `users/<userId>` を使ってください。
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
- **HTTP mode** では `botToken` と `signingSecret`（ルートまたはアカウントごと）の両方が必要です。
- `botToken`、`appToken`、`signingSecret`、`userToken` は、プレーンテキスト文字列またはSecretRefオブジェクトを受け付けます。
- Slackアカウントスナップショットは、`botTokenSource`、`botTokenStatus`、`appTokenStatus`、HTTP modeでは `signingSecretStatus` などの、認証情報ごとのソース/ステータスフィールドを公開します。`configured_unavailable` は、そのアカウントがSecretRef経由で設定されているものの、現在のコマンド/ランタイム経路では秘密値を解決できなかったことを意味します。
- `configWrites: false` は、Slack起点の設定書き込みをブロックします。
- オプションの `channels.slack.defaultAccount` は、設定済みアカウントIDに一致する場合、デフォルトアカウント選択を上書きします。
- `channels.slack.streaming.mode` が正規のSlackストリームモードキーです。`channels.slack.streaming.nativeTransport` はSlackのネイティブストリーミング転送を制御します。レガシーな `streamMode`、真偽値の `streaming`、および `nativeStreaming` は自動移行されます。
- 配信ターゲットには `user:<id>`（DM）または `channel:<id>` を使ってください。

**リアクション通知モード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` から）。

**スレッドセッション分離:** `thread.historyScope` はスレッド単位（デフォルト）またはchannel全体で共有です。`thread.inheritParent` は親channelのトランスクリプトを新しいスレッドにコピーします。

- SlackのネイティブストリーミングとSlackアシスタント風の「入力中...」スレッドステータスには、返信スレッドターゲットが必要です。トップレベルDMはデフォルトでスレッド外のままなので、スレッド形式のプレビューではなく `typingReaction` または通常配信を使います。
- `typingReaction` は、返信の実行中に受信したSlackメッセージへ一時的なリアクションを追加し、完了時に削除します。`"hourglass_flowing_sand"` のようなSlack絵文字ショートコードを使ってください。
- `channels.slack.execApprovals`: Slackネイティブのexec承認配信と承認者認可。スキーマはDiscordと同じです: `enabled`（`true`/`false`/`"auto"`）、`approvers`（SlackユーザーID）、`agentFilter`、`sessionFilter`、`target`（`"dm"`、`"channel"`、または `"both"`）。

| Action group | デフォルト | 注記                   |
| ------------ | ---------- | ---------------------- |
| reactions    | 有効       | リアクション + リアクション一覧 |
| messages     | 有効       | 読み取り/送信/編集/削除 |
| pins         | 有効       | ピン留め/解除/一覧     |
| memberInfo   | 有効       | メンバー情報           |
| emojiList    | 有効       | カスタム絵文字一覧     |

### Mattermost

Mattermostはpluginとして提供されます: `openclaw plugins install @openclaw/mattermost`。

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

チャットモード: `oncall`（@メンション時に応答、デフォルト）、`onmessage`（すべてのメッセージ）、`onchar`（トリガープレフィックスで始まるメッセージ）。

Mattermostネイティブコマンドが有効な場合:

- `commands.callbackPath` はフルURLではなくパスである必要があります（例: `/api/channels/mattermost/command`）。
- `commands.callbackUrl` はOpenClaw Gatewayエンドポイントを指し、Mattermostサーバーから到達可能である必要があります。
- ネイティブslashコールバックは、slashコマンド登録時にMattermostが返すコマンドごとのトークンで認証されます。登録に失敗した場合、または有効化されたコマンドがない場合、OpenClawはコールバックを `Unauthorized: invalid command token.` で拒否します。
- プライベート/tailnet/internalなコールバックホストでは、Mattermostで `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックホスト/ドメインを含める必要がある場合があります。フルURLではなくホスト/ドメイン値を使ってください。
- `channels.mattermost.configWrites`: Mattermost起点の設定書き込みを許可または禁止します。
- `channels.mattermost.requireMention`: channelで返信する前に `@mention` を必須にします。
- `channels.mattermost.groups.<channelId>.requireMention`: channelごとのmention-gatingオーバーライド（デフォルトには `"*"`）。
- オプションの `channels.mattermost.defaultAccount` は、設定済みアカウントIDに一致する場合、デフォルトアカウント選択を上書きします。

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

- `channels.signal.account`: channelの起動を特定のSignalアカウントIDに固定します。
- `channels.signal.configWrites`: Signal起点の設定書き込みを許可または禁止します。
- オプションの `channels.signal.defaultAccount` は、設定済みアカウントIDに一致する場合、デフォルトアカウント選択を上書きします。

### BlueBubbles

BlueBubblesは推奨されるiMessage経路です（pluginベースで、`channels.bluebubbles` 配下に設定します）。

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
- オプションの `channels.bluebubbles.defaultAccount` は、設定済みアカウントIDに一致する場合、デフォルトアカウント選択を上書きします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、BlueBubbles会話を永続的ACPセッションにバインドできます。`match.peer.id` にはBlueBubbles handleまたはターゲット文字列（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使ってください。共通のフィールドの意味: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。
- 完全なBlueBubbles channel設定は [BlueBubbles](/ja-JP/channels/bluebubbles) に記載されています。

### iMessage

OpenClawは `imsg rpc`（stdio経由のJSON-RPC）を起動します。daemonやポートは不要です。

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

- オプションの `channels.imessage.defaultAccount` は、設定済みアカウントIDに一致する場合、デフォルトアカウント選択を上書きします。

- Messages DBへのフルディスクアクセスが必要です。
- `chat_id:<id>` ターゲットの使用を推奨します。チャット一覧は `imsg chats --limit 20` を使ってください。
- `cliPath` はSSHラッパーを指すこともできます。添付ファイル取得にSCPを使う場合は `remoteHost`（`host` または `user@host`）を設定してください。
- `attachmentRoots` と `remoteAttachmentRoots` は受信添付ファイルのパスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCPは厳格なhost-key検証を使うため、リレーホストキーがすでに `~/.ssh/known_hosts` に存在していることを確認してください。
- `channels.imessage.configWrites`: iMessage起点の設定書き込みを許可または禁止します。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、iMessage会話を永続的ACPセッションにバインドできます。`match.peer.id` には正規化されたhandleまたは明示的なチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使ってください。共通のフィールドの意味: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。

<Accordion title="iMessage SSHラッパーの例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrixはextensionベースで、`channels.matrix` 配下に設定します。

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

- トークン認証は `accessToken` を使います。パスワード認証は `userId` + `password` を使います。
- `channels.matrix.proxy` はMatrixのHTTPトラフィックを明示的なHTTP(S)プロキシ経由にします。名前付きアカウントでは `channels.matrix.accounts.<id>.proxy` で上書きできます。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` は、プライベート/内部homeserverを許可します。`proxy` とこのネットワークオプトインは独立した制御です。
- `channels.matrix.defaultAccount` は、複数アカウント構成で優先アカウントを選択します。
- `channels.matrix.autoJoin` のデフォルトは `off` です。そのため、招待されたルームや新しいDM形式の招待は、`autoJoin: "allowlist"` と `autoJoinAllowlist`、または `autoJoin: "always"` を設定するまで無視されます。
- `channels.matrix.execApprovals`: Matrixネイティブのexec承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。autoモードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合にexec承認が有効化されます。
  - `approvers`: exec要求の承認を許可するMatrixユーザーID（例: `@owner:example.org`）。
  - `agentFilter`: オプションのagent ID許可リスト。省略すると、すべてのagentの承認を転送します。
  - `sessionFilter`: オプションのsessionキーパターン（部分文字列またはregex）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）、`"channel"`（送信元ルーム）、または `"both"`。
  - アカウントごとのオーバーライド: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` は、Matrix DMをどのようにセッションへグループ化するかを制御します。`per-user`（デフォルト）はルーティングされたpeer単位で共有し、`per-room` は各DMルームを分離します。
- Matrixのstatus probeとライブディレクトリ参照は、実行時トラフィックと同じプロキシポリシーを使います。
- 完全なMatrix設定、ターゲティングルール、およびセットアップ例は [Matrix](/ja-JP/channels/matrix) に記載されています。

### Microsoft Teams

Microsoft Teamsはextensionベースで、`channels.msteams` 配下に設定します。

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
- 完全なTeams設定（認証情報、webhook、DM/グループポリシー、team/channelごとのオーバーライド）は [Microsoft Teams](/ja-JP/channels/msteams) に記載されています。

### IRC

IRCはextensionベースで、`channels.irc` 配下に設定します。

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
- オプションの `channels.irc.defaultAccount` は、設定済みアカウントIDに一致する場合、デフォルトアカウント選択を上書きします。
- 完全なIRC channel設定（host/port/TLS/channels/allowlists/mention gating）は [IRC](/ja-JP/channels/irc) に記載されています。

### 複数アカウント（全channels共通）

channelごとに複数アカウント（それぞれ独自の `accountId`）を実行できます。

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

- `accountId` を省略した場合は `default` が使われます（CLI + ルーティング）。
- 環境変数トークンは **default** アカウントにのみ適用されます。
- ベースchannel設定は、アカウントごとに上書きしない限りすべてのアカウントに適用されます。
- 各アカウントを別のagentにルーティングするには `bindings[].match.accountId` を使います。
- 単一アカウントのトップレベルchannel設定のまま `openclaw channels add`（またはchannelオンボーディング）で非defaultアカウントを追加すると、OpenClawはまずアカウントスコープのトップレベル単一アカウント値をchannelアカウントマップへ昇格させるため、元のアカウントは引き続き動作します。ほとんどのchannelではそれらを `channels.<channel>.accounts.default` に移します。Matrixでは代わりに既存の一致する名前付き/defaultターゲットを保持できます。
- 既存のchannel専用バインディング（`accountId` なし）は引き続きdefaultアカウントに一致します。アカウントスコープのバインディングは任意のままです。
- `openclaw doctor --fix` も、アカウントスコープのトップレベル単一アカウント値をそのchannel向けに選ばれた昇格アカウントへ移動することで、混在した形状を修復します。ほとんどのchannelでは `accounts.default` を使います。Matrixでは代わりに既存の一致する名前付き/defaultターゲットを保持できます。

### その他のextension channel

多くのextension channelは `channels.<id>` として設定され、専用のchannelページに記載されています（たとえば Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch など）。
完全なchannel一覧は [Channels](/ja-JP/channels) を参照してください。

### グループチャットのmention gating

グループメッセージはデフォルトで **メンション必須** です（メタデータのメンションまたは安全なregexパターン）。WhatsApp、Telegram、Discord、Google Chat、およびiMessageのグループチャットに適用されます。

**メンションの種類:**

- **メタデータメンション**: ネイティブのプラットフォーム @-mentions。WhatsAppのセルフチャットモードでは無視されます。
- **テキストパターン**: `agents.list[].groupChat.mentionPatterns` 内の安全なregexパターン。無効なパターンや安全でないネストした繰り返しは無視されます。
- mention gatingは、検出可能な場合にのみ適用されます（ネイティブメンションまたは少なくとも1つのパターンがある場合）。

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

`messages.groupChat.historyLimit` はグローバルデフォルトを設定します。channel側では `channels.<channel>.historyLimit`（またはアカウントごと）で上書きできます。無効化するには `0` を設定してください。

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

解決順序: DMごとのオーバーライド → providerデフォルト → 制限なし（すべて保持）。

対応: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### セルフチャットモード

自分の番号を `allowFrom` に含めると、セルフチャットモードが有効になります（ネイティブ @-mentions を無視し、テキストパターンにのみ応答します）。

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

<Accordion title="コマンドの詳細">

- このブロックはコマンドサーフェスを設定します。現在の組み込み + bundledコマンドカタログについては、[Slash Commands](/ja-JP/tools/slash-commands) を参照してください。
- このページは **設定キーのリファレンス** であり、完全なコマンドカタログではありません。QQ Botの `/bot-ping` `/bot-help` `/bot-logs`、LINEの `/card`、device-pairの `/pair`、memoryの `/dreaming`、phone-controlの `/phone`、Talkの `/voice` などのchannel/plugin所有コマンドは、それぞれのchannel/pluginページと [Slash Commands](/ja-JP/tools/slash-commands) に記載されています。
- テキストコマンドは、先頭に `/` が付いた **単独の** メッセージである必要があります。
- `native: "auto"` はDiscord/Telegramでネイティブコマンドを有効にし、Slackでは無効のままにします。
- `nativeSkills: "auto"` はDiscord/TelegramでネイティブSkillsコマンドを有効にし、Slackでは無効のままにします。
- channelごとのオーバーライド: `channels.discord.commands.native`（bool または `"auto"`）。`false` は以前に登録されたコマンドを消去します。
- ネイティブSkills登録は `channels.<provider>.commands.nativeSkills` でchannelごとにオーバーライドできます。
- `channels.telegram.customCommands` は、追加のTelegram botメニューエントリを追加します。
- `bash: true` は、ホストシェル向けに `! <cmd>` を有効にします（エイリアス: `/bash`）。`tools.elevated.enabled` と、送信者が `tools.elevated.allowFrom.<channel>` に含まれていることが必要です。
- `config: true` は `/config` を有効にします（`openclaw.json` の読み書き）。Gatewayの `chat.send` クライアントでは、永続的な `/config set|unset` 書き込みには `operator.admin` も必要です。読み取り専用の `/config show` は通常の書き込みスコープを持つoperatorクライアントでも利用できます。
- `mcp: true` は、`mcp.servers` 配下のOpenClaw管理MCPサーバー設定向けに `/mcp` を有効にします。
- `plugins: true` は、pluginの検出、インストール、有効化/無効化制御向けに `/plugins` を有効にします。
- `channels.<provider>.configWrites` は、channelごとの設定変更を制御します（デフォルト: true）。
- 複数アカウントchannelでは、`channels.<provider>.accounts.<id>.configWrites` も、そのアカウントを対象とする書き込み（たとえば `/allowlist --config --account <id>` や `/config set channels.<provider>.accounts.<id>...`）を制御します。
- `restart: false` は `/restart` とGateway再起動toolアクションを無効にします。デフォルト: `true`。
- `ownerAllowFrom` は、owner専用コマンド/tool向けの明示的なowner許可リストです。`allowFrom` とは別です。
- `ownerDisplay: "hash"` は、システムプロンプト内のowner IDをハッシュ化します。ハッシュ化を制御するには `ownerDisplaySecret` を設定してください。
- `allowFrom` はproviderごとです。設定されている場合、これが **唯一の** 認可ソースになります（channelのallowlist/pairing と `useAccessGroups` は無視されます）。
- `useAccessGroups: false` は、`allowFrom` が設定されていない場合に、コマンドがaccess-groupポリシーをバイパスできるようにします。
- コマンドドキュメント対応表:
  - 組み込み + bundledカタログ: [Slash Commands](/ja-JP/tools/slash-commands)
  - channel固有のコマンドサーフェス: [Channels](/ja-JP/channels)
  - QQ Botコマンド: [QQ Bot](/ja-JP/channels/qqbot)
  - pairingコマンド: [Pairing](/ja-JP/channels/pairing)
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

システムプロンプトのRuntime行に表示されるオプションのリポジトリルートです。未設定の場合、OpenClawはworkspaceから上位にたどって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` を設定していないagent向けの、オプションのデフォルトSkills許可リストです。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather を継承
      { id: "docs", skills: ["docs-search"] }, // defaults を置き換える
      { id: "locked-down", skills: [] }, // Skills なし
    ],
  },
}
```

- デフォルトでSkillsを無制限にするには `agents.defaults.skills` を省略します。
- デフォルトを継承するには `agents.list[].skills` を省略します。
- Skillsなしにするには `agents.list[].skills: []` を設定します。
- 空でない `agents.list[].skills` リストは、そのagentの最終セットです。defaultsとはマージされません。

### `agents.defaults.skipBootstrap`

workspaceブートストラップファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）の自動作成を無効にします。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

workspaceブートストラップファイルをシステムプロンプトに注入するタイミングを制御します。デフォルト: `"always"`。

- `"continuation-skip"`: 安全な継続ターン（assistantの応答完了後）ではworkspaceブートストラップの再注入をスキップし、プロンプトサイズを削減します。heartbeat実行と圧縮後の再試行では、引き続きコンテキストを再構築します。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰め前のworkspaceブートストラップファイルごとの最大文字数です。デフォルト: `20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべてのworkspaceブートストラップファイルにまたがって注入される合計最大文字数です。デフォルト: `150000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ブートストラップコンテキストが切り詰められたときにagentへ見える警告テキストを制御します。
デフォルト: `"once"`。

- `"off"`: 警告テキストをシステムプロンプトにまったく注入しません。
- `"once"`: 一意の切り詰めシグネチャごとに一度だけ警告を注入します（推奨）。
- `"always"`: 切り詰めが存在する場合、毎回警告を注入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

provider呼び出し前に、transcript/tool画像ブロックで画像の長辺に適用される最大ピクセルサイズです。
デフォルト: `1200`。

値を低くすると、通常はvision token使用量とスクリーンショットが多い実行でのリクエストペイロードサイズを減らせます。
値を高くすると、より多くの視覚的詳細を保持できます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

システムプロンプトコンテキスト用のタイムゾーンです（メッセージタイムスタンプではありません）。未設定時はホストのタイムゾーンにフォールバックします。

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
  - オブジェクト形式はprimaryに加えて、順序付きのfailover modelも設定します。
- `imageModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - `image` toolパスで、そのvision-model設定として使われます。
  - 選択された/デフォルトのmodelが画像入力を受け付けられない場合のフォールバックルーティングにも使われます。
- `imageGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - 共通の画像生成capabilityと、今後画像を生成するtool/pluginサーフェスでも使われます。
  - 典型的な値: ネイティブGemini画像生成には `google/gemini-3.1-flash-image-preview`、falには `fal/fal-ai/flux/dev`、OpenAI Imagesには `openai/gpt-image-1`。
  - provider/modelを直接選ぶ場合は、対応するprovider認証/APIキーも設定してください（たとえば `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/*` には `OPENAI_API_KEY`、`fal/*` には `FAL_KEY`）。
  - 省略した場合でも、`image_generate` は認証済みproviderデフォルトを推論できます。まず現在のデフォルトproviderを試し、その後、残りの登録済み画像生成providerをprovider-id順に試します。
- `musicGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - 共通の音楽生成capabilityと、組み込みの `music_generate` toolで使われます。
  - 典型的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、または `minimax/music-2.5+`。
  - 省略した場合でも、`music_generate` は認証済みproviderデフォルトを推論できます。まず現在のデフォルトproviderを試し、その後、残りの登録済み音楽生成providerをprovider-id順に試します。
  - provider/modelを直接選ぶ場合は、対応するprovider認証/APIキーも設定してください。
- `videoGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - 共通の動画生成capabilityと、組み込みの `video_generate` toolで使われます。
  - 典型的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、または `qwen/wan2.7-r2v`。
  - 省略した場合でも、`video_generate` は認証済みproviderデフォルトを推論できます。まず現在のデフォルトproviderを試し、その後、残りの登録済み動画生成providerをprovider-id順に試します。
  - provider/modelを直接選ぶ場合は、対応するprovider認証/APIキーも設定してください。
  - bundledのQwen動画生成providerは、最大1本の出力動画、1枚の入力画像、4本の入力動画、10秒の長さ、およびproviderレベルの `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートします。
- `pdfModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - `pdf` toolのmodelルーティングに使われます。
  - 省略した場合、PDF toolは `imageModel` にフォールバックし、その後、解決済みのsession/default modelにフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の、`pdf` tool向けデフォルトPDFサイズ制限です。
- `pdfMaxPages`: `pdf` toolの抽出フォールバックモードで考慮するデフォルト最大ページ数です。
- `verboseDefault`: agentのデフォルトverboseレベルです。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `elevatedDefault`: agentのデフォルトelevated-outputレベルです。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は `provider/model`（例: `openai/gpt-5.4`）。providerを省略した場合、OpenClawはまずaliasを試し、次にその正確なmodel idに一致する一意のconfigured-provider一致を試し、それでもだめならconfigured default providerにフォールバックします（非推奨の互換動作なので、明示的な `provider/model` を推奨します）。そのproviderが設定されたデフォルトmodelをもはや提供していない場合、OpenClawは古くなった削除済みproviderのデフォルトを表示する代わりに、最初のconfigured provider/modelにフォールバックします。
- `models`: `/model` 向けの設定済みmodelカタログ兼allowlistです。各エントリには `alias`（ショートカット）と `params`（provider固有、たとえば `temperature`、`maxTokens`、`cacheRetention`、`context1m`）を含められます。
- `params`: すべてのmodelに適用されるグローバルデフォルトproviderパラメータです。`agents.defaults.params` に設定します（例: `{ cacheRetention: "long" }`）。
- `params` のマージ優先順位（config）: `agents.defaults.params`（グローバルベース）は、`agents.defaults.models["provider/model"].params`（modelごと）で上書きされ、次に `agents.list[].params`（一致するagent id）がキーごとに上書きします。詳細は [Prompt Caching](/ja-JP/reference/prompt-caching) を参照してください。
- `embeddedHarness`: デフォルトの低レベル埋め込みagent runtimeポリシーです。`runtime: "auto"` を使うと、登録済みplugin harnessがサポート対象modelを引き受けられます。`runtime: "pi"` で組み込みPI harnessを強制し、`runtime: "codex"` のように登録済みharness idも指定できます。自動PIフォールバックを無効にするには `fallback: "none"` を設定してください。
- これらのフィールドを変更するconfig writer（たとえば `/models set`、`/models set-image`、フォールバック追加/削除コマンド）は、正規のオブジェクト形式で保存し、可能な限り既存のフォールバックリストを保持します。
- `maxConcurrent`: sessionをまたいだ並列agent実行の最大数です（各session自体は引き続き直列化されます）。デフォルト: 4。

### `agents.defaults.embeddedHarness`

`embeddedHarness` は、埋め込みagentターンをどの低レベルexecutorで実行するかを制御します。
ほとんどのデプロイでは、デフォルトの `{ runtime: "auto", fallback: "pi" }` のままで問題ありません。
bundledのCodex app-server harnessのように、信頼できるpluginがネイティブharnessを提供する場合に使います。

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

- `runtime`: `"auto"`、`"pi"`、または登録済みplugin harness id。bundledのCodex pluginは `codex` を登録します。
- `fallback`: `"pi"` または `"none"`。`"pi"` は互換性フォールバックとして組み込みPI harnessを維持します。`"none"` は、plugin harnessの選択が欠落または未対応の場合に、黙ってPIを使う代わりに失敗させます。
- 環境変数オーバーライド: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` は `runtime` を上書きします。`OPENCLAW_AGENT_HARNESS_FALLBACK=none` は、そのプロセスでPIフォールバックを無効にします。
- Codex専用デプロイでは、`model: "codex/gpt-5.4"`、`embeddedHarness.runtime: "codex"`、`embeddedHarness.fallback: "none"` を設定してください。
- これは埋め込みchat harnessのみを制御します。メディア生成、vision、PDF、音楽、動画、TTSは引き続きそれぞれのprovider/model設定を使います。

**組み込みalias短縮形**（modelが `agents.defaults.models` にある場合にのみ適用されます）:

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

設定済みのaliasは常にデフォルトより優先されます。

Z.AI GLM-4.x modelは、`--thinking off` を設定するか、自分で `agents.defaults.models["zai/<model>"].params.thinking` を定義しない限り、自動的にthinking modeを有効にします。
Z.AI modelは、tool callストリーミングのためにデフォルトで `tool_stream` を有効にします。無効にするには `agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定してください。
Anthropic Claude 4.6 modelは、明示的なthinkingレベルが設定されていない場合、デフォルトで `adaptive` thinkingになります。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行向けのオプションのCLI backendです（tool callなし）。API providerが失敗したときのバックアップとして便利です。

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
- `sessionArg` が設定されている場合、sessionに対応します。
- `imageArg` がファイルパスを受け付ける場合、画像パススルーに対応します。

### `agents.defaults.systemPromptOverride`

OpenClawが組み立てたシステムプロンプト全体を固定文字列で置き換えます。デフォルトレベル（`agents.defaults.systemPromptOverride`）またはagentごと（`agents.list[].systemPromptOverride`）で設定します。agentごとの値が優先され、空文字または空白のみの値は無視されます。制御されたプロンプト実験に便利です。

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

定期的なheartbeat実行です。

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

- `every`: 期間文字列（ms/s/m/h）。デフォルト: `30m`（API-key認証）または `1h`（OAuth認証）。無効化するには `0m` を設定します。
- `includeSystemPromptSection`: falseの場合、システムプロンプトからHeartbeatセクションを省略し、ブートストラップコンテキストへの `HEARTBEAT.md` 注入もスキップします。デフォルト: `true`。
- `suppressToolErrorWarnings`: trueの場合、heartbeat実行中のtool error warningペイロードを抑制します。
- `timeoutSeconds`: heartbeatのagentターンが中断されるまでに許可される最大時間（秒）です。未設定のままにすると `agents.defaults.timeoutSeconds` を使います。
- `directPolicy`: direct/DM配信ポリシー。`allow`（デフォルト）はdirect-target配信を許可します。`block` はdirect-target配信を抑止し、`reason=dm-blocked` を出力します。
- `lightContext`: trueの場合、heartbeat実行は軽量ブートストラップコンテキストを使い、workspaceブートストラップファイルから `HEARTBEAT.md` のみを保持します。
- `isolatedSession`: trueの場合、各heartbeatは事前の会話履歴のない新しいsessionで実行されます。cronの `sessionTarget: "isolated"` と同じ分離パターンです。heartbeatごとのtokenコストを約100Kから約2〜5K tokenへ削減します。
- agentごと: `agents.list[].heartbeat` を設定します。いずれかのagentが `heartbeat` を定義すると、heartbeatを実行するのは **それらのagentのみ** になります。
- heartbeatは完全なagentターンを実行するため、間隔を短くするとより多くのtokenを消費します。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 登録済みcompaction provider pluginのid（オプション）
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "デプロイID、チケットID、host:portペアを正確に保持してください。", // identifierPolicy=custom のときに使用
        postCompactionSections: ["Session Startup", "Red Lines"], // [] で再注入を無効化
        model: "openrouter/anthropic/claude-sonnet-4-6", // compaction専用のmodelオーバーライド（オプション）
        notifyUser: true, // compaction開始時に短い通知を送信（デフォルト: false）
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "セッションがcompactionに近づいています。永続メモリを今すぐ保存してください。",
          prompt: "永続的なメモがあれば memory/YYYY-MM-DD.md に書き込んでください。保存するものがなければ、正確なサイレントトークン NO_REPLY で返信してください。",
        },
      },
    },
  },
}
```

- `mode`: `default` または `safeguard`（長い履歴向けのチャンク化要約）。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `provider`: 登録済みcompaction provider pluginのidです。設定されている場合、組み込みLLM要約の代わりにそのproviderの `summarize()` が呼び出されます。失敗時は組み込み方式にフォールバックします。providerを設定すると `mode: "safeguard"` が強制されます。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `timeoutSeconds`: OpenClawが中断するまでに、単一のcompaction処理に許可される最大秒数です。デフォルト: `900`。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` は、compaction要約中に組み込みの不透明識別子保持ガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` のときに使われる、オプションのカスタム識別子保持テキストです。
- `postCompactionSections`: compaction後に再注入するオプションのAGENTS.md H2/H3セクション名です。デフォルトは `["Session Startup", "Red Lines"]` で、`[]` にすると再注入を無効化します。未設定の場合、または明示的にそのデフォルトの組を設定した場合、古い `Every Session` / `Safety` 見出しもレガシーフォールバックとして受け入れられます。
- `model`: compaction要約専用のオプションの `provider/model-id` オーバーライドです。メインsessionでは1つのmodelを維持しつつ、compaction要約は別のmodelで実行したい場合に使います。未設定の場合、compactionはsessionのprimary modelを使います。
- `notifyUser`: `true` の場合、compaction開始時にユーザーへ短い通知を送信します（たとえば「Compacting context...」）。デフォルトでは無効で、compactionをサイレントに保ちます。
- `memoryFlush`: 自動compaction前に永続メモリを保存するためのサイレントなagentターンです。workspaceが読み取り専用のときはスキップされます。

### `agents.defaults.contextPruning`

LLMへ送信する前に、インメモリコンテキストから **古いtool結果** を削減します。ディスク上のsession履歴は変更しません。

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
        hardClear: { enabled: true, placeholder: "[古いtool結果コンテンツは削除されました]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttlモードの動作">

- `mode: "cache-ttl"` は削減パスを有効にします。
- `ttl` は、最後のキャッシュタッチ後に再度削減を実行できる頻度を制御します。
- 削減ではまず大きすぎるtool結果をsoft-trimし、必要なら古いtool結果をhard-clearします。

**Soft-trim** は先頭 + 末尾を残し、中間に `...` を挿入します。

**Hard-clear** はtool結果全体をプレースホルダーに置き換えます。

注意:

- 画像ブロックは切り詰め/削除されません。
- ratioは文字数ベース（概算）であり、正確なtoken数ではありません。
- `keepLastAssistants` 個未満しかassistantメッセージが存在しない場合、削減はスキップされます。

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
- channelオーバーライド: `channels.<channel>.blockStreamingCoalesce`（およびアカウントごとの変種）。Signal/Slack/Discord/Google Chatのデフォルトは `minChars: 1500` です。
- `humanDelay`: ブロック返信間のランダムな待機。`natural` = 800〜2500ms。agentごとのオーバーライド: `agents.list[].humanDelay`。

動作とチャンク分割の詳細は [Streaming](/ja-JP/concepts/streaming) を参照してください。

### タイピングインジケーター

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

- デフォルト: ダイレクトチャット/メンションでは `instant`、メンションなしのグループチャットでは `message`。
- sessionごとのオーバーライド: `session.typingMode`、`session.typingIntervalSeconds`。

[Typing Indicators](/ja-JP/concepts/typing-indicators) を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

埋め込みagent向けのオプションのsandbox化です。完全なガイドは [Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。

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
          // SecretRef / インライン内容にも対応:
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

<Accordion title="Sandboxの詳細">

**Backend:**

- `docker`: ローカルDocker runtime（デフォルト）
- `ssh`: 汎用SSHベースのリモートruntime
- `openshell`: OpenShell runtime

`backend: "openshell"` を選択した場合、runtime固有の設定は
`plugins.entries.openshell.config` に移動します。

**SSH backend設定:**

- `target`: `user@host[:port]` 形式のSSHターゲット
- `command`: SSHクライアントコマンド（デフォルト: `ssh`）
- `workspaceRoot`: スコープごとのworkspaceに使う絶対リモートルート
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSHに渡される既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: OpenClawが実行時に一時ファイルへ実体化するインライン内容またはSecretRef
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSHのhost-keyポリシーノブ

**SSH認証の優先順位:**

- `identityData` は `identityFile` より優先されます
- `certificateData` は `certificateFile` より優先されます
- `knownHostsData` は `knownHostsFile` より優先されます
- SecretRefベースの `*Data` 値は、sandbox session開始前にアクティブなsecrets runtime snapshotから解決されます

**SSH backendの動作:**

- 作成または再作成後に、リモートworkspaceを一度だけシードします
- その後は、リモートSSH workspaceを正規の状態として維持します
- `exec`、file tools、メディアパスをSSH経由でルーティングします
- リモート変更を自動的にホストへ同期しません
- sandbox browserコンテナはサポートしません

**Workspace access:**

- `none`: `~/.openclaw/sandboxes` 配下のスコープごとのsandbox workspace
- `ro`: `/workspace` にsandbox workspace、`/agent` にagent workspaceを読み取り専用でマウント
- `rw`: agent workspaceを `/workspace` に読み書きでマウント

**Scope:**

- `session`: sessionごとのcontainer + workspace
- `agent`: agentごとに1つのcontainer + workspace（デフォルト）
- `shared`: 共有containerとworkspace（session間分離なし）

**OpenShell plugin設定:**

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

- `mirror`: 実行前にローカルからリモートへシードし、実行後に同期し戻します。ローカルworkspaceが正規の状態のままです
- `remote`: sandbox作成時に一度だけリモートへシードし、その後はリモートworkspaceを正規の状態として維持します

`remote` モードでは、OpenClaw外で行われたホスト側ローカル編集は、シードステップ後にsandboxへ自動同期されません。
転送にはOpenShell sandboxへのSSHを使いますが、sandboxのライフサイクルとオプションのmirror同期はpluginが管理します。

**`setupCommand`** はcontainer作成後に一度だけ実行されます（`sh -lc` 経由）。ネットワークegress、書き込み可能なroot、rootユーザーが必要です。

**コンテナはデフォルトで `network: "none"`** です。agentに外向きアクセスが必要な場合は `"bridge"`（またはカスタムbridge network）に設定してください。
`"host"` はブロックされます。`"container:<id>"` も、明示的に
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（緊急用）を設定しない限り、デフォルトでブロックされます。

**受信添付ファイル** は、アクティブworkspace内の `media/inbound/*` にステージされます。

**`docker.binds`** は追加のホストディレクトリをマウントします。グローバルおよびagentごとのbindはマージされます。

**Sandbox化されたbrowser**（`sandbox.browser.enabled`）: コンテナ内のChromium + CDP。noVNC URLがシステムプロンプトへ注入されます。`openclaw.json` で `browser.enabled` は不要です。
noVNCのオブザーバーアクセスはデフォルトでVNC認証を使い、OpenClawは共有URLにパスワードを露出する代わりに短命のトークンURLを発行します。

- `allowHostControl: false`（デフォルト）は、sandbox化されたsessionがホストbrowserをターゲットにすることをブロックします。
- `network` のデフォルトは `openclaw-sandbox-browser`（専用bridge network）です。グローバルbridge接続を明示的に望む場合にのみ `bridge` を設定してください。
- `cdpSourceRange` は、オプションでCDP ingressをコンテナ境界でCIDR範囲に制限します（例: `172.21.0.1/32`）。
- `sandbox.browser.binds` は、追加のホストディレクトリをbrowser sandboxコンテナのみにマウントします。設定されている場合（`[]` を含む）、browserコンテナでは `docker.binds` を置き換えます。
- 起動時のデフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義されており、コンテナホスト向けに調整されています:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<OPENCLAW_BROWSER_CDP_PORT から導出>`
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
  - ワークフローで必要な場合は `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で
    extensionsを再有効化できます。
  - `--renderer-process-limit=2` は
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で変更できます。Chromiumの
    デフォルトのprocess制限を使うには `0` を設定してください。
  - `noSandbox` が有効な場合は、さらに `--no-sandbox` と `--disable-setuid-sandbox` が追加されます。
  - これらのデフォルトはコンテナイメージのベースラインです。コンテナのデフォルトを変更するには、
    カスタムbrowserイメージとカスタムentrypointを使ってください。

</Accordion>

browser sandbox化と `sandbox.docker.binds` はDocker専用です。

イメージをビルド:

```bash
scripts/sandbox-setup.sh           # メインsandboxイメージ
scripts/sandbox-browser-setup.sh   # オプションのbrowserイメージ
```

### `agents.list`（agentごとのオーバーライド）

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
        thinkingDefault: "high", // agentごとのthinkingレベルオーバーライド
        reasoningDefault: "on", // agentごとのreasoning表示オーバーライド
        fastModeDefault: false, // agentごとのfast modeオーバーライド
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // 一致する defaults.models params をキーごとに上書き
        skills: ["docs-search"], // 設定されている場合は agents.defaults.skills を置き換える
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
- `default`: 複数設定されている場合は最初のものが優先されます（警告がログに出ます）。1つも設定されていない場合は、最初のリスト項目がデフォルトです。
- `model`: 文字列形式は `primary` のみを上書きします。オブジェクト形式 `{ primary, fallbacks }` は両方を上書きします（`[]` でグローバルfallbackを無効化）。`primary` のみを上書きするcron jobは、`fallbacks: []` を設定しない限り、引き続きデフォルトfallbackを継承します。
- `params`: 選択された `agents.defaults.models` のmodelエントリに対してマージされるagentごとのstream paramsです。`cacheRetention`、`temperature`、`maxTokens` などのagent固有オーバーライドを、modelカタログ全体を複製せずに設定するために使います。
- `skills`: オプションのagentごとのSkills許可リストです。省略すると、設定されていればagentは `agents.defaults.skills` を継承します。明示的なリストはdefaultsをマージせずに置き換え、`[]` はSkillsなしを意味します。
- `thinkingDefault`: オプションのagentごとのデフォルトthinkingレベル（`off | minimal | low | medium | high | xhigh | adaptive`）。メッセージごとまたはsessionごとのオーバーライドが設定されていない場合、このagentでは `agents.defaults.thinkingDefault` を上書きします。
- `reasoningDefault`: オプションのagentごとのデフォルトreasoning表示（`on | off | stream`）。メッセージごとまたはsessionごとのreasoningオーバーライドが設定されていない場合に適用されます。
- `fastModeDefault`: オプションのagentごとのfast modeデフォルト（`true | false`）。メッセージごとまたはsessionごとのfast-modeオーバーライドが設定されていない場合に適用されます。
- `embeddedHarness`: オプションのagentごとの低レベルharnessポリシーオーバーライドです。1つのagentだけをCodex専用にし、他のagentはデフォルトのPIフォールバックを維持するには `{ runtime: "codex", fallback: "none" }` を使います。
- `runtime`: オプションのagentごとのruntime記述子です。agentがデフォルトでACP harness sessionを使うべき場合は、`type: "acp"` と `runtime.acp` のデフォルト（`agent`、`backend`、`mode`、`cwd`）を使います。
- `identity.avatar`: workspace相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを導出します: `emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns`。
- `subagents.allowAgents`: `sessions_spawn` 向けのagent id許可リスト（`["*"]` = 任意、デフォルト: 同じagentのみ）。
- Sandbox継承ガード: 要求元sessionがsandbox化されている場合、`sessions_spawn` はsandboxなしで実行されるターゲットを拒否します。
- `subagents.requireAgentId`: trueの場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制。デフォルト: false）。

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

### Bindingのmatchフィールド

- `type`（オプション）: 通常ルーティング用の `route`（type未指定時のデフォルトはroute）、永続ACP会話バインディング用の `acp`
- `match.channel`（必須）
- `match.accountId`（オプション。`*` = 任意のアカウント、省略 = デフォルトアカウント）
- `match.peer`（オプション。`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（オプション。channel固有）
- `acp`（オプション。`type: "acp"` のみ）: `{ mode, label, cwd, backend }`

**決定的なmatch順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（正確一致、peer/guild/teamなし）
5. `match.accountId: "*"`（channel全体）
6. デフォルトagent

各tier内では、最初に一致した `bindings` エントリが優先されます。

`type: "acp"` エントリについては、OpenClawは厳密な会話ID（`match.channel` + account + `match.peer.id`）で解決し、上記のroute binding tier順序は使いません。

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
    parentForkMaxTokens: 100000, // このtoken数を超える親スレッドforkはスキップ（0で無効）
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
      idleHours: 24, // デフォルトの非アクティブ時自動unfocus時間（`0` で無効）
      maxAgeHours: 0, // デフォルトのハード最大経過時間（`0` で無効）
    },
    mainKey: "main", // legacy（ランタイムは常に "main" を使用）
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Sessionフィールドの詳細">

- **`scope`**: グループチャットコンテキスト向けのベースsessionグループ化戦略です。
  - `per-sender`（デフォルト）: channelコンテキスト内で、各送信者が分離されたsessionを持ちます。
  - `global`: channelコンテキスト内のすべての参加者が単一のsessionを共有します（共有コンテキストを意図する場合にのみ使ってください）。
- **`dmScope`**: DMをどのようにグループ化するかです。
  - `main`: すべてのDMがmain sessionを共有します。
  - `per-peer`: channelをまたいで送信者idごとに分離します。
  - `per-channel-peer`: channel + 送信者ごとに分離します（複数ユーザーの受信箱に推奨）。
  - `per-account-channel-peer`: account + channel + 送信者ごとに分離します（複数アカウントに推奨）。
- **`identityLinks`**: channelをまたいだsession共有のために、正規idをproviderプレフィックス付きpeerへマップします。
- **`reset`**: 主なresetポリシーです。`daily` はローカル時刻の `atHour` にresetし、`idle` は `idleMinutes` 後にresetします。両方が設定されている場合、先に期限が来た方が優先されます。
- **`resetByType`**: タイプごとのオーバーライド（`direct`、`group`、`thread`）。レガシーな `dm` も `direct` のエイリアスとして受け付けられます。
- **`parentForkMaxTokens`**: forkされたスレッドsessionを作成するときに許可される親sessionの最大 `totalTokens` です（デフォルト `100000`）。
  - 親の `totalTokens` がこの値を超えている場合、OpenClawは親transcript履歴を継承する代わりに、新しいスレッドsessionを開始します。
  - このガードを無効にして常に親forkを許可するには `0` を設定してください。
- **`mainKey`**: レガシーフィールドです。ランタイムはメインのdirect-chatバケットに常に `"main"` を使います。
- **`agentToAgent.maxPingPongTurns`**: agent間やり取りの間に、agent同士で返信を返し合う最大ターン数です（整数、範囲: `0`–`5`）。`0` でping-pong連鎖を無効にします。
- **`sendPolicy`**: `channel`、`chatType`（`direct|group|channel`。レガシーな `dm` エイリアスあり）、`keyPrefix`、または `rawKeyPrefix` でmatchします。最初のdenyが優先されます。
- **`maintenance`**: session-storeのクリーンアップと保持制御です。
  - `mode`: `warn` は警告のみを出し、`enforce` はクリーンアップを適用します。
  - `pruneAfter`: 古いエントリの経過時間しきい値です（デフォルト `30d`）。
  - `maxEntries`: `sessions.json` 内の最大エントリ数です（デフォルト `500`）。
  - `rotateBytes`: `sessions.json` がこのサイズを超えたらローテーションします（デフォルト `10mb`）。
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcriptアーカイブの保持期間です。デフォルトでは `pruneAfter` を使います。無効にするには `false` を設定してください。
  - `maxDiskBytes`: オプションのsessionsディレクトリディスク予算です。`warn` モードでは警告をログ出力し、`enforce` モードでは最も古いartifact/sessionから削除します。
  - `highWaterBytes`: 予算クリーンアップ後のオプションの目標値です。デフォルトは `maxDiskBytes` の `80%` です。
- **`threadBindings`**: スレッド束縛session機能のグローバルデフォルトです。
  - `enabled`: マスターデフォルトスイッチ（providerごとにオーバーライド可能。Discordは `channels.discord.threadBindings.enabled` を使用）
  - `idleHours`: 非アクティブ時のデフォルト自動unfocus時間（時間単位。`0` で無効。providerごとにオーバーライド可能）
  - `maxAgeHours`: デフォルトのハード最大経過時間（時間単位。`0` で無効。providerごとにオーバーライド可能）

</Accordion>

---

## Messages

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
      debounceMs: 2000, // 0 で無効
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 応答プレフィックス

channel/accountごとのオーバーライド: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決順序（より具体的なものが優先）: account → channel → global。`""` は無効化し、カスケードも停止します。`"auto"` は `[{identity.name}]` を導出します。

**テンプレート変数:**

| Variable          | 説明                   | Example                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | 短いmodel名            | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なmodel識別子      | `anthropic/claude-opus-4-6` |
| `{provider}`      | provider名             | `anthropic`                 |
| `{thinkingLevel}` | 現在のthinkingレベル   | `high`, `low`, `off`        |
| `{identity.name}` | agent identity名       | （`"auto"` と同じ）         |

変数は大文字小文字を区別しません。`{think}` は `{thinkingLevel}` のエイリアスです。

### Ackリアクション

- デフォルトではアクティブagentの `identity.emoji` を使い、なければ `"👀"` を使います。無効にするには `""` を設定してください。
- channelごとのオーバーライド: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: account → channel → `messages.ackReaction` → identityフォールバック。
- スコープ: `group-mentions`（デフォルト）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: Slack、Discord、Telegramで返信後にackを削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Telegramでライフサイクルstatusリアクションを有効にします。
  SlackとDiscordでは、未設定だとackリアクションが有効なときにstatusリアクションも有効のままになります。
  Telegramでは、ライフサイクルstatusリアクションを有効にするには明示的に `true` を設定してください。

### 受信debounce

同じ送信者からの短時間のテキストのみメッセージを1つのagentターンにまとめます。メディア/添付ファイルは即時にflushされます。制御コマンドはdebouncingをバイパスします。

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

- `auto` はデフォルトの自動TTSモードを制御します: `off`、`always`、`inbound`、または `tagged`。`/tts on|off` はローカル設定をオーバーライドでき、`/tts status` は有効な状態を表示します。
- `summaryModel` は、自動要約向けに `agents.defaults.model.primary` を上書きします。
- `modelOverrides` はデフォルトで有効です。`modelOverrides.allowProvider` のデフォルトは `false`（オプトイン）です。
- APIキーは `ELEVENLABS_API_KEY`/`XI_API_KEY` および `OPENAI_API_KEY` にフォールバックします。
- `openai.baseUrl` はOpenAI TTSエンドポイントを上書きします。解決順序は、config、次に `OPENAI_TTS_BASE_URL`、最後に `https://api.openai.com/v1` です。
- `openai.baseUrl` がOpenAI以外のエンドポイントを指す場合、OpenClawはそれをOpenAI互換TTSサーバーとして扱い、model/voice検証を緩和します。

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

- 複数のTalk providerを設定している場合、`talk.provider` は `talk.providers` 内のキーに一致している必要があります。
- レガシーなフラットTalkキー（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）は互換性専用であり、自動的に `talk.providers.<provider>` へ移行されます。
- Voice IDは `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `providers.*.apiKey` はプレーンテキスト文字列またはSecretRefオブジェクトを受け付けます。
- `ELEVENLABS_API_KEY` フォールバックは、Talk APIキーが設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases` により、Talkディレクティブで親しみやすい名前を使えます。
- `silenceTimeoutMs` は、Talk modeがユーザーの無音後にtranscriptを送信するまで待機する時間を制御します。未設定の場合はプラットフォームデフォルトの待機時間を維持します（`macOSとAndroidでは700 ms、iOSでは900 ms`）。

---

## Tools

### Toolプロファイル

`tools.profile` は、`tools.allow`/`tools.deny` より前にベースallowlistを設定します。

ローカルオンボーディングでは、未設定の場合に新しいローカル設定のデフォルトを `tools.profile: "coding"` にします（既存の明示的なプロファイルは保持されます）。

| Profile     | 含まれるもの                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` のみ                                                                                                     |
| `coding`    | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`image`、`image_generate`、`video_generate` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`                                 |
| `full`      | 制限なし（未設定と同じ）                                                                                                  |

### Toolグループ

| Group              | Tools                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec`、`process`、`code_execution`（`bash` は `exec` のエイリアスとして受け付けられます）                              |
| `group:fs`         | `read`、`write`、`edit`、`apply_patch`                                                                                   |
| `group:sessions`   | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status` |
| `group:memory`     | `memory_search`、`memory_get`                                                                                            |
| `group:web`        | `web_search`、`x_search`、`web_fetch`                                                                                    |
| `group:ui`         | `browser`、`canvas`                                                                                                      |
| `group:automation` | `cron`、`gateway`                                                                                                        |
| `group:messaging`  | `message`                                                                                                                |
| `group:nodes`      | `nodes`                                                                                                                  |
| `group:agents`     | `agents_list`                                                                                                            |
| `group:media`      | `image`、`image_generate`、`video_generate`、`tts`                                                                       |
| `group:openclaw`   | すべての組み込みtool（provider pluginは除く）                                                                            |

### `tools.allow` / `tools.deny`

グローバルなtool許可/拒否ポリシーです（denyが優先）。大文字小文字を区別せず、`*` ワイルドカードをサポートします。Docker sandboxがoffでも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

特定のproviderまたはmodel向けにtoolをさらに制限します。順序: ベースprofile → provider profile → allow/deny。

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

- agentごとのオーバーライド（`agents.list[].tools.elevated`）は、さらに制限することしかできません。
- `/elevated on|off|ask|full` は状態をsessionごとに保存します。インラインディレクティブは単一メッセージに適用されます。
- Elevated `exec` はsandbox化をバイパスし、設定されたescape pathを使います（デフォルトでは `gateway`、execターゲットが `node` の場合は `node`）。

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

toolループ安全チェックは、デフォルトでは **無効** です。有効化するには `enabled: true` を設定してください。
設定はグローバルに `tools.loopDetection` で定義でき、agentごとに `agents.list[].tools.loopDetection` でオーバーライドできます。

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

- `historySize`: ループ解析のために保持される最大tool call履歴です。
- `warningThreshold`: 警告用の、進捗なし反復パターンしきい値です。
- `criticalThreshold`: 重大ループをブロックするための、より高い反復しきい値です。
- `globalCircuitBreakerThreshold`: あらゆる進捗なし実行に対するハード停止しきい値です。
- `detectors.genericRepeat`: 同じtool/同じ引数の繰り返しcallで警告します。
- `detectors.knownPollNoProgress`: 既知のpoll tool（`process.poll`、`command_status` など）での進捗なしを警告/ブロックします。
- `detectors.pingPong`: 進捗なしの交互ペアパターンで警告/ブロックします。
- `warningThreshold >= criticalThreshold` または `criticalThreshold >= globalCircuitBreakerThreshold` の場合、検証は失敗します。

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // または BRAVE_API_KEY 環境変数
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // オプション。自動検出するには省略
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
        directSend: false, // オプトイン: 完了した非同期music/videoをchannelへ直接送信
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

<Accordion title="メディアmodelエントリのフィールド">

**Providerエントリ**（`type: "provider"` または省略）:

- `provider`: API provider id（`openai`、`anthropic`、`google`/`gemini`、`groq` など）
- `model`: model idオーバーライド
- `profile` / `preferredProfile`: `auth-profiles.json` のprofile選択

**CLIエントリ**（`type: "cli"`）:

- `command`: 実行する実行可能ファイル
- `args`: テンプレート化された引数（`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポート）

**共通フィールド:**

- `capabilities`: オプションのリスト（`image`、`audio`、`video`）。デフォルト: `openai`/`anthropic`/`minimax` → image、`google` → image+audio+video、`groq` → audio。
- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: エントリごとのオーバーライド。
- 失敗時は次のエントリにフォールバックします。

provider認証は標準順序に従います: `auth-profiles.json` → 環境変数 → `models.providers.*.apiKey`。

**非同期完了フィールド:**

- `asyncCompletion.directSend`: `true` の場合、完了した非同期 `music_generate`
  と `video_generate` タスクは、まずchannelへの直接配信を試みます。デフォルト: `false`
  （レガシーのrequester-session wake/model-deliveryパス）。

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

デフォルト: `tree`（現在のsession + そこからspawnされたsession。subagentなど）。

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
- `agent`: 現在のagent idに属する任意のsession（同じagent idの下で送信者ごとのsessionを実行している場合、他ユーザーを含むことがあります）。
- `all`: 任意のsession。agentをまたぐターゲティングには引き続き `tools.agentToAgent` が必要です。
- Sandbox clamp: 現在のsessionがsandbox化されており、`agents.defaults.sandbox.sessionToolsVisibility="spawned"` の場合、`tools.sessions.visibility="all"` であっても、visibilityは `tree` に強制されます。

### `tools.sessions_spawn`

`sessions_spawn` のインライン添付ファイル対応を制御します。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // オプトイン: true にするとインラインファイル添付を許可
        maxTotalBytes: 5242880, // 全ファイル合計で 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // ファイルごとに 1 MB
        retainOnSessionKeep: false, // cleanup="keep" のときに添付ファイルを保持
      },
    },
  },
}
```

注意:

- 添付ファイルは `runtime: "subagent"` でのみサポートされます。ACP runtimeでは拒否されます。
- ファイルは子workspace内の `.openclaw/attachments/<uuid>/` に `.manifest.json` とともに実体化されます。
- 添付ファイル内容はtranscript永続化から自動的にredactされます。
- Base64入力は、厳格なアルファベット/パディング検査とデコード前サイズガードで検証されます。
- ファイル権限は、ディレクトリが `0700`、ファイルが `0600` です。
- クリーンアップは `cleanup` ポリシーに従います: `delete` は常に添付ファイルを削除し、`keep` は `retainOnSessionKeep: true` の場合のみ保持します。

### `tools.experimental`

実験的な組み込みtoolフラグです。strict-agentic GPT-5の自動有効化ルールが適用される場合を除き、デフォルトではoffです。

```json5
{
  tools: {
    experimental: {
      planTool: true, // 実験的な update_plan を有効化
    },
  },
}
```

注意:

- `planTool`: 非自明な複数ステップ作業の追跡向けに、構造化された `update_plan` toolを有効にします。
- デフォルト: `false`。ただし、`agents.defaults.embeddedPi.executionContract`（またはagentごとのオーバーライド）がOpenAIまたはOpenAI CodexのGPT-5ファミリー実行で `"strict-agentic"` に設定されている場合を除きます。その範囲外でもtoolを強制的に有効にするには `true` を設定し、strict-agentic GPT-5実行でも無効のままにするには `false` を設定してください。
- 有効時は、システムプロンプトにも使用ガイダンスが追加され、modelがこれを実質的な作業にのみ使い、`in_progress` のステップを最大1つに保つようにします。

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

- `model`: spawnされるsub-agent向けのデフォルトmodelです。省略した場合、sub-agentは呼び出し元のmodelを継承します。
- `allowAgents`: 要求元agentが独自の `subagents.allowAgents` を設定していない場合に、`sessions_spawn` 向けターゲットagent idのデフォルト許可リストです（`["*"]` = 任意。デフォルト: 同じagentのみ）。
- `runTimeoutSeconds`: tool callで `runTimeoutSeconds` が省略された場合の、`sessions_spawn` 向けデフォルトタイムアウト（秒）です。`0` はタイムアウトなしを意味します。
- subagentごとのtoolポリシー: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタムproviderとbase URL

OpenClawは組み込みのmodelカタログを使います。カスタムproviderは、config内の `models.providers` または `~/.openclaw/agents/<agentId>/agent/models.json` で追加できます。

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

- カスタム認証が必要な場合は `authHeader: true` + `headers` を使ってください。
- agent設定ルートは `OPENCLAW_AGENT_DIR`（またはレガシー環境変数エイリアス `PI_CODING_AGENT_DIR`）で上書きできます。
- 一致するprovider IDに対するマージ優先順位:
  - 空でないagent `models.json` の `baseUrl` 値が優先されます。
  - 空でないagentの `apiKey` 値は、そのproviderが現在のconfig/auth-profileコンテキストでSecretRef管理されていない場合にのみ優先されます。
  - SecretRef管理されたproviderの `apiKey` 値は、解決済みのsecretを永続化する代わりに、ソースマーカー（env参照では `ENV_VAR_NAME`、file/exec参照では `secretref-managed`）から更新されます。
  - SecretRef管理されたproviderヘッダー値は、ソースマーカー（env参照では `secretref-env:ENV_VAR_NAME`、file/exec参照では `secretref-managed`）から更新されます。
  - 空または欠落したagentの `apiKey`/`baseUrl` は、config内の `models.providers` にフォールバックします。
  - 一致するmodelの `contextWindow`/`maxTokens` には、明示的config値と暗黙のカタログ値のうち高い方が使われます。
  - 一致するmodelの `contextTokens` は、明示的なruntime capが存在する場合はそれを保持します。ネイティブmodelメタデータを変えずに有効コンテキストを制限するにはこれを使ってください。
  - configで `models.json` を完全に書き換えたい場合は `models.mode: "replace"` を使ってください。
  - マーカーの永続化はソース権威型です。マーカーは、解決済みruntime secret値からではなく、アクティブなソースconfig snapshot（解決前）から書き込まれます。

### Providerフィールドの詳細

- `models.mode`: providerカタログの動作です（`merge` または `replace`）。
- `models.providers`: provider idをキーにしたカスタムproviderマップです。
- `models.providers.*.api`: リクエストアダプターです（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` など）。
- `models.providers.*.apiKey`: provider認証情報です（SecretRef/環境変数置換の使用を推奨）。
- `models.providers.*.auth`: 認証戦略です（`api-key`、`token`、`oauth`、`aws-sdk`）。
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` 向けに、リクエストへ `options.num_ctx` を注入します（デフォルト: `true`）。
- `models.providers.*.authHeader`: 必要な場合に、認証情報を `Authorization` ヘッダーで送るよう強制します。
- `models.providers.*.baseUrl`: 上流APIのbase URLです。
- `models.providers.*.headers`: proxy/tenantルーティング用の追加の静的ヘッダーです。
- `models.providers.*.request`: model-provider HTTPリクエスト向けの転送オーバーライドです。
  - `request.headers`: 追加ヘッダーです（providerデフォルトとマージされます）。値はSecretRefを受け付けます。
  - `request.auth`: 認証戦略オーバーライドです。モード: `"provider-default"`（provider組み込み認証を使用）、`"authorization-bearer"`（`token` 付き）、`"header"`（`headerName`、`value`、オプションの `prefix` 付き）。
  - `request.proxy`: HTTP proxyオーバーライドです。モード: `"env-proxy"`（`HTTP_PROXY`/`HTTPS_PROXY` 環境変数を使用）、`"explicit-proxy"`（`url` 付き）。両モードともオプションの `tls` サブオブジェクトを受け付けます。
  - `request.tls`: 直接接続向けのTLSオーバーライドです。フィールド: `ca`、`cert`、`key`、`passphrase`（すべてSecretRefを受け付けます）、`serverName`、`insecureSkipVerify`。
  - `request.allowPrivateNetwork`: `true` の場合、DNSがprivate、CGNAT、または類似レンジへ解決されるときでも、provider HTTP fetch guard経由で `baseUrl` へのHTTPSを許可します（信頼できるセルフホストOpenAI互換エンドポイント向けのoperatorオプトイン）。WebSocketはヘッダー/TLSに同じ `request` を使いますが、そのfetch SSRF gateは使いません。デフォルトは `false`。
- `models.providers.*.models`: 明示的なprovider modelカタログエントリです。
- `models.providers.*.models.*.contextWindow`: ネイティブmodelコンテキストウィンドウのメタデータです。
- `models.providers.*.models.*.contextTokens`: オプションのruntimeコンテキスト上限です。modelのネイティブ `contextWindow` より小さい有効コンテキスト予算にしたい場合に使います。
- `models.providers.*.models.*.compat.supportsDeveloperRole`: オプションの互換性ヒントです。`api: "openai-completions"` で、空でない非ネイティブの `baseUrl`（ホストが `api.openai.com` でない）の場合、OpenClawは実行時にこれを `false` に強制します。空または省略された `baseUrl` はデフォルトのOpenAI動作を維持します。
- `models.providers.*.models.*.compat.requiresStringContent`: 文字列のみを受け付けるOpenAI互換chatエンドポイント向けのオプションの互換性ヒントです。`true` の場合、OpenClawはリクエスト送信前に、純粋なテキストの `messages[].content` 配列をプレーン文字列へフラット化します。
- `plugins.entries.amazon-bedrock.config.discovery`: Bedrock自動検出設定のルートです。
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: 暗黙の検出をオン/オフします。
- `plugins.entries.amazon-bedrock.config.discovery.region`: 検出に使うAWSリージョンです。
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: 対象を絞るためのオプションのprovider-idフィルターです。
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: 検出更新のpoll間隔です。
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: 検出されたmodel向けのフォールバックcontext windowです。
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: 検出されたmodel向けのフォールバック最大出力token数です。

### Providerの例

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

Cerebrasには `cerebras/zai-glm-4.7` を使ってください。Z.AI直接接続には `zai/glm-4.7` を使います。

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

`OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）を設定してください。Zenカタログには `opencode/...`、Goカタログには `opencode-go/...` を使います。ショートカット: `openclaw onboard --auth-choice opencode-zen` または `openclaw onboard --auth-choice opencode-go`。

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

- 一般エンドポイント: `https://api.z.ai/api/paas/v4`
- コーディングエンドポイント（デフォルト）: `https://api.z.ai/api/coding/paas/v4`
- 一般エンドポイントを使う場合は、base URLオーバーライド付きのカスタムproviderを定義してください。

</Accordion>

<Accordion title="Moonshot AI（Kimi）">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
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
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

Chinaエンドポイントには `baseUrl: "https://api.moonshot.cn/v1"` または `openclaw onboard --auth-choice moonshot-api-key-cn` を使ってください。

ネイティブMoonshotエンドポイントは共有の
`openai-completions` 転送上でストリーミング利用互換性を通知しており、
OpenClawは組み込みprovider id単独ではなく、そのエンドポイント機能に基づいて
これを判断します。

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

Base URLには `/v1` を含めないでください（Anthropicクライアントが付加します）。ショートカット: `openclaw onboard --auth-choice synthetic-api-key`。

</Accordion>

<Accordion title="MiniMax M2.7（直接接続）">

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
Anthropic互換のストリーミングパスでは、OpenClawは明示的に `thinking` を設定しない限り、
デフォルトでMiniMax thinkingを無効にします。`/fast on` または
`params.fastMode: true` は `MiniMax-M2.7` を
`MiniMax-M2.7-highspeed` に書き換えます。

</Accordion>

<Accordion title="ローカルmodel（LM Studio）">

[Local Models](/ja-JP/gateway/local-models) を参照してください。要点: 十分な性能のハードウェア上でLM Studio Responses API経由の大きなローカルmodelを実行し、フォールバック用にホスト型modelはマージしたままにしてください。

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

- `allowBundled`: bundled Skillsのみを対象とするオプションの許可リストです（managed/workspace Skillsには影響しません）。
- `load.extraDirs`: 追加の共有skillルートです（最も低い優先順位）。
- `install.preferBrew`: `true` の場合、`brew` が
  利用可能なら、他のinstaller種別へフォールバックする前にHomebrew installerを優先します。
- `install.nodeManager`: `metadata.openclaw.install`
  spec向けのnode installer優先設定です（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false` は、bundled/インストール済みであってもそのskillを無効にします。
- `entries.<skillKey>.apiKey`: 主な環境変数を宣言するskill向けの簡易設定です（プレーンテキスト文字列またはSecretRefオブジェクト）。

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

- `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions`、および `plugins.load.paths` から読み込まれます。
- 検出では、ネイティブOpenClaw pluginに加え、互換性のあるCodex bundleとClaude bundleも受け付けます。manifestのないClaudeデフォルトレイアウトbundleも含まれます。
- **設定変更にはGatewayの再起動が必要です。**
- `allow`: オプションの許可リストです（リストされたpluginのみ読み込まれます）。`deny` が優先されます。
- `plugins.entries.<id>.apiKey`: pluginレベルのAPIキー簡易フィールドです（pluginがサポートしている場合）。
- `plugins.entries.<id>.env`: pluginスコープの環境変数マップです。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、coreは `before_prompt_build` をブロックし、レガシー `before_agent_start` からのprompt変更フィールドを無視します。一方で、レガシーな `modelOverride` と `providerOverride` は保持されます。ネイティブplugin hookと、サポート対象のbundle提供hookディレクトリに適用されます。
- `plugins.entries.<id>.subagent.allowModelOverride`: このpluginがバックグラウンドsubagent実行向けに、実行ごとの `provider` および `model` オーバーライドを要求することを明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼されたsubagentオーバーライド向けの、オプションの正規 `provider/model` ターゲット許可リストです。任意のmodelを許可したいと意図している場合にのみ `"*"` を使ってください。
- `plugins.entries.<id>.config`: plugin定義の設定オブジェクトです（利用可能な場合はネイティブOpenClaw plugin schemaで検証されます）。
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch provider設定です。
  - `apiKey`: Firecrawl APIキーです（SecretRefを受け付けます）。`plugins.entries.firecrawl.config.webSearch.apiKey`、レガシーな `tools.web.fetch.firecrawl.apiKey`、または `FIRECRAWL_API_KEY` 環境変数にフォールバックします。
  - `baseUrl`: Firecrawl API base URLです（デフォルト: `https://api.firecrawl.dev`）。
  - `onlyMainContent`: ページから本文のみを抽出します（デフォルト: `true`）。
  - `maxAgeMs`: 最大キャッシュ有効期間（ミリ秒）です（デフォルト: `172800000` / 2日）。
  - `timeoutSeconds`: スクレイプリクエストのタイムアウト秒数です（デフォルト: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok web search）設定です。
  - `enabled`: X Search providerを有効にします。
  - `model`: 検索に使うGrok modelです（例: `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`: memory dreaming（実験的）設定です。フェーズとしきい値については [Dreaming](/ja-JP/concepts/dreaming) を参照してください。
  - `enabled`: dreamingのマスタースイッチです（デフォルト `false`）。
  - `frequency`: 各完全dreaming sweepのcron cadenceです（デフォルト `"0 3 * * *"`）。
  - フェーズポリシーとしきい値は実装詳細であり、ユーザー向け設定キーではありません。
- 完全なmemory設定は [Memory configuration reference](/ja-JP/reference/memory-config) にあります:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効なClaude bundle pluginは、`settings.json` から埋め込みPiデフォルトも提供できます。OpenClawはそれらを、生のOpenClaw config patchとしてではなく、サニタイズ済みagent設定として適用します。
- `plugins.slots.memory`: アクティブなmemory plugin idを選択します。memory pluginを無効にするには `"none"` を指定します。
- `plugins.slots.contextEngine`: アクティブなcontext engine plugin idを選択します。別のengineをインストールして選択しない限り、デフォルトは `"legacy"` です。
- `plugins.installs`: `openclaw plugins update` に使われるCLI管理のインストールメタデータです。
  - `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、`resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt` を含みます。
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
      // dangerouslyAllowPrivateNetwork: true, // 信頼できるプライベートネットワークアクセスでのみオプトイン
      // allowPrivateNetwork: true, // レガシーエイリアス
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定時には無効なので、browserナビゲーションはデフォルトで厳格なままです。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` は、プライベートネットワークbrowserナビゲーションを意図的に信頼する場合にのみ設定してください。
- 厳格モードでは、リモートCDP profileエンドポイント（`profiles.*.cdpUrl`）も、到達性/検出チェック時に同じプライベートネットワークブロックの対象になります。
- `ssrfPolicy.allowPrivateNetwork` は引き続きレガシーエイリアスとしてサポートされます。
- 厳格モードでは、明示的な例外には `ssrfPolicy.hostnameAllowlist` と `ssrfPolicy.allowedHostnames` を使ってください。
- リモートprofileはattach-onlyです（start/stop/resetは無効）。
- `profiles.*.cdpUrl` は `http://`、`https://`、`ws://`、`wss://` を受け付けます。
  OpenClawに `/json/version` を検出させたい場合はHTTP(S)を使い、
  providerから直接DevTools WebSocket URLが与えられている場合はWS(S)を使ってください。
- `existing-session` profileはホスト専用で、CDPの代わりにChrome MCPを使います。
- `existing-session` profileでは、特定の
  Chromiumベースbrowser profile（BraveやEdgeなど）を対象にするために `userDataDir` を設定できます。
- `existing-session` profileは、現在のChrome MCPルート制限を維持します:
  CSSセレクター指定ではなくsnapshot/refベースのアクション、単一ファイルアップロード
  hook、ダイアログタイムアウトオーバーライドなし、`wait --load networkidle` なし、
  `responsebody`、PDFエクスポート、ダウンロード割り込み、バッチアクションなし。
- ローカル管理の `openclaw` profileは `cdpPort` と `cdpUrl` を自動割り当てします。明示的に
  `cdpUrl` を設定するのはリモートCDPの場合だけにしてください。
- 自動検出順序: デフォルトbrowserがChromiumベースならそれ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- Control service: loopbackのみ（ポートは `gateway.port` から導出され、デフォルト `18791`）。
- `extraArgs` は追加の起動フラグをローカルChromium起動に付加します（たとえば
  `--disable-gpu`、ウィンドウサイズ指定、デバッグフラグなど）。

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

- `seamColor`: ネイティブアプリUI chromeのアクセントカラーです（Talk Modeバブルの色合いなど）。
- `assistant`: Control UIのidentityオーバーライドです。アクティブagent identityにフォールバックします。

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
      // trustedProxy: { userHeader: "x-forwarded-user" }, // mode=trusted-proxy 向け。/gateway/trusted-proxy-auth を参照
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
      // allowExternalEmbedUrls: false, // 危険: 絶対外部http(s)埋め込みURLを許可
      // allowedOrigins: ["https://control.example.com"], // 非loopback Control UIに必須
      // dangerouslyAllowHostHeaderOriginFallback: false, // 危険なHostヘッダーoriginフォールバックモード
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
    // オプション。デフォルトは false。
    allowRealIpFallback: false,
    tools: {
      // 追加の /tools/invoke HTTP deny
      deny: ["browser"],
      // デフォルトのHTTP denyリストからtoolを除外
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

<Accordion title="Gatewayフィールドの詳細">

- `mode`: `local`（Gatewayを実行）または `remote`（リモートGatewayへ接続）です。Gatewayは `local` でない限り起動を拒否します。
- `port`: WS + HTTP用の単一の多重化ポートです。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（デフォルト）、`lan`（`0.0.0.0`）、`tailnet`（Tailscale IPのみ）、または `custom`。
- **レガシーbindエイリアス**: `gateway.bind` ではホストエイリアス（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）ではなく、bind mode値（`auto`、`loopback`、`lan`、`tailnet`、`custom`）を使ってください。
- **Dockerに関する注意**: デフォルトの `loopback` bind は、コンテナ内の `127.0.0.1` でlistenします。Docker bridgeネットワーク（`-p 18789:18789`）では、トラフィックは `eth0` に到達するため、Gatewayには到達できません。`--network host` を使うか、すべてのインターフェイスでlistenするために `bind: "lan"`（または `bind: "custom"` と `customBindHost: "0.0.0.0"`）を設定してください。
- **Auth**: デフォルトで必須です。loopback以外のbindにはGateway authが必要です。実際には、共有token/password、または `gateway.auth.mode: "trusted-proxy"` を使うID認識リバースプロキシを意味します。オンボーディングウィザードはデフォルトでtokenを生成します。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されている場合（SecretRefを含む）、`gateway.auth.mode` を `token` または `password` に明示的に設定してください。両方が設定されていてmodeが未設定の場合、起動およびサービスのインストール/修復フローは失敗します。
- `gateway.auth.mode: "none"`: 明示的な認証なしモードです。信頼できるローカルloopback構成でのみ使ってください。これは意図的にオンボーディングプロンプトでは提供されません。
- `gateway.auth.mode: "trusted-proxy"`: 認証をID認識リバースプロキシへ委譲し、`gateway.trustedProxies` からのIDヘッダーを信頼します（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。このモードは **非loopback** のプロキシソースを前提とします。同一ホストのloopbackリバースプロキシはtrusted-proxy authの条件を満たしません。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale ServeのidentityヘッダーでControl UI/WebSocket authを満たせます（`tailscale whois` で検証）。HTTP APIエンドポイントはそのTailscaleヘッダーauthを使わず、通常のGateway HTTP auth modeに従います。このtokenレスフローはGatewayホストが信頼されている前提です。`tailscale.mode = "serve"` の場合のデフォルトは `true` です。
- `gateway.auth.rateLimit`: オプションの認証失敗制限です。クライアントIPごと、かつ認証スコープごとに適用されます（shared-secretとdevice-tokenは独立して追跡されます）。ブロックされた試行は `429` + `Retry-After` を返します。
  - 非同期Tailscale Serve Control UIパスでは、同じ `{scope, clientIp}` に対する失敗試行は、失敗書き込み前に直列化されます。そのため、同じクライアントからの同時の不正試行は、両方が通常の不一致として通る代わりに、2番目のリクエストで制限に達することがあります。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。localhostトラフィックにも意図的にレート制限を適用したい場合（テスト構成や厳格なプロキシデプロイなど）は `false` に設定してください。
- browser起点のWS auth試行は、loopback除外を無効にした状態で常にスロットルされます（browserベースのlocalhost総当たりに対する多層防御）。
- loopbackでは、それらのbrowser起点lockoutは正規化された `Origin`
  値ごとに分離されるため、あるlocalhost originからの繰り返し失敗が
  別のoriginを自動的にlockoutすることはありません。
- `tailscale.mode`: `serve`（tailnetのみ、loopback bind）または `funnel`（公開、auth必須）。
- `controlUi.allowedOrigins`: Gateway WebSocket接続向けの明示的なbrowser-origin許可リストです。browserクライアントを非loopback originから受け入れる場合に必須です。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Hostヘッダーoriginポリシーに意図的に依存するデプロイ向けに、Hostヘッダーoriginフォールバックを有効にする危険なモードです。
- `remote.transport`: `ssh`（デフォルト）または `direct`（ws/wss）。`direct` の場合、`remote.url` は `ws://` または `wss://` である必要があります。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 信頼できるプライベートネットワークIPへの平文 `ws://` を許可するクライアント側の緊急オーバーライドです。平文のデフォルトは引き続きloopbackのみです。
- `gateway.remote.token` / `.password` はリモートクライアントの認証情報フィールドです。これ自体ではGateway authを設定しません。
- `gateway.push.apns.relay.baseUrl`: 公式/TestFlight iOSビルドがrelayバック登録をGatewayへ公開した後に使う、外部APNs relayのベースHTTPS URLです。このURLはiOSビルドにコンパイルされたrelay URLと一致している必要があります。
- `gateway.push.apns.relay.timeoutMs`: Gatewayからrelayへの送信タイムアウト（ミリ秒）です。デフォルトは `10000` です。
- relayバック登録は特定のGateway identityへ委譲されます。ペアリングされたiOSアプリは `gateway.identity.get` を取得し、そのidentityをrelay登録に含め、登録スコープのsend grantをGatewayへ転送します。別のGatewayはその保存済み登録を再利用できません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記relay設定向けの一時的な環境変数オーバーライドです。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL向けの開発専用エスケープハッチです。本番relay URLはHTTPSのままにしてください。
- `gateway.channelHealthCheckMinutes`: channel health-monitor間隔（分）です。health-monitor再起動をグローバルに無効化するには `0` を設定してください。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: stale-socketしきい値（分）です。これは `gateway.channelHealthCheckMinutes` 以上に保ってください。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: 1時間のローリングウィンドウ内で、channel/accountごとに許可されるhealth-monitor再起動の最大数です。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバルmonitorを有効に保ったまま、health-monitor再起動をchannelごとにオプトアウトする設定です。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 複数アカウントchannel向けのアカウントごとのオーバーライドです。設定されている場合、channelレベルのオーバーライドより優先されます。
- ローカルGateway call pathでは、`gateway.auth.*` が未設定の場合にのみ `gateway.remote.*` をフォールバックとして使えます。
- `gateway.auth.token` / `gateway.auth.password` がSecretRef経由で明示的に設定され、未解決の場合、解決はフェイルクローズドになります（remoteフォールバックで隠されません）。
- `trustedProxies`: TLS終端または転送クライアントヘッダー注入を行うリバースプロキシのIPです。自分で管理しているプロキシだけを列挙してください。loopbackエントリも同一ホストのプロキシ/ローカル検出構成（たとえばTailscale Serveやローカルリバースプロキシ）では有効ですが、loopbackリクエストが `gateway.auth.mode: "trusted-proxy"` の対象になるわけでは **ありません**。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` がないときにGatewayが `X-Real-IP` を受け入れます。デフォルトはフェイルクローズド動作のため `false` です。
- `gateway.tools.deny`: HTTP `POST /tools/invoke` 向けに追加でブロックするtool名です（デフォルトdenyリストを拡張）。
- `gateway.tools.allow`: デフォルトのHTTP denyリストからtool名を除外します。

</Accordion>

### OpenAI互換エンドポイント

- Chat Completions: デフォルトでは無効です。`gateway.http.endpoints.chatCompletions.enabled: true` で有効化します。
- Responses API: `gateway.http.endpoints.responses.enabled`。
- Responses URL入力ハードニング:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空のallowlistは未設定として扱われます。URL取得を無効化するには
    `gateway.http.endpoints.responses.files.allowUrl=false`
    および/または `gateway.http.endpoints.responses.images.allowUrl=false` を使ってください。
- オプションのresponseハードニングヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity`（自分で管理するHTTPS originにのみ設定してください。詳細は [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts) を参照）

### 複数インスタンスの分離

1台のホストで、ポートとstate dirを一意にして複数のGatewayを実行します。

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利なフラグ: `--dev`（`~/.openclaw-dev` + ポート `19001` を使用）、`--profile <name>`（`~/.openclaw-<name>` を使用）。

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
- `autoGenerate`: 明示的なファイルが設定されていない場合に、ローカルの自己署名cert/keyペアを自動生成します。ローカル/開発用途専用です。
- `certPath`: TLS証明書ファイルへのファイルシステムパスです。
- `keyPath`: TLS秘密鍵ファイルへのファイルシステムパスです。権限を制限して保管してください。
- `caPath`: クライアント検証またはカスタム信頼チェーン向けのオプションのCA bundleパスです。

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

- `mode`: config編集を実行時にどのように適用するかを制御します。
  - `"off"`: ライブ編集を無視します。変更には明示的な再起動が必要です。
  - `"restart"`: config変更時に常にGatewayプロセスを再起動します。
  - `"hot"`: 再起動せずにプロセス内で変更を適用します。
  - `"hybrid"`（デフォルト）: まずhot reloadを試し、必要な場合は再起動にフォールバックします。
- `debounceMs`: config変更を適用する前のdebounceウィンドウ（ミリ秒）です（0以上の整数）。
- `deferralTimeoutMs`: 進行中の操作を待ってから再起動を強制するまでの最大待機時間（ミリ秒）です（デフォルト: `300000` = 5分）。

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
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
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
- `hooks.token` は `gateway.auth.token` と **異なっている必要があります**。Gateway tokenの再利用は拒否されます。
- `hooks.path` には `/` を指定できません。`/hooks` のような専用サブパスを使ってください。
- `hooks.allowRequestSessionKey=true` の場合、`hooks.allowedSessionKeyPrefixes` を制限してください（例: `["hook:"]`）。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエストペイロードの `sessionKey` は、`hooks.allowRequestSessionKey=true` の場合にのみ受け付けられます（デフォルト: `false`）。
- `POST /hooks/<name>` → `hooks.mappings` 経由で解決されます

<Accordion title="Mappingの詳細">

- `match.path` は `/hooks` の後ろのサブパスに一致します（例: `/hooks/gmail` → `gmail`）。
- `match.source` は汎用パス向けのペイロードフィールドに一致します。
- `{{messages[0].subject}}` のようなテンプレートは、ペイロードから読み取ります。
- `transform` は、hook actionを返すJS/TSモジュールを指せます。
  - `transform.module` は相対パスである必要があり、`hooks.transformsDir` 内にとどまらなければなりません（絶対パスやトラバーサルは拒否されます）。
- `agentId` は特定のagentへルーティングします。不明なIDはデフォルトにフォールバックします。
- `allowedAgentIds`: 明示的ルーティングを制限します（`*` または省略 = すべて許可、`[]` = すべて拒否）。
- `defaultSessionKey`: 明示的な `sessionKey` のないhook agent実行向けのオプションの固定session keyです。
- `allowRequestSessionKey`: `/hooks/agent` 呼び出し元が `sessionKey` を設定できるようにします（デフォルト: `false`）。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値（リクエスト + mapping）向けのオプションのプレフィックス許可リストです。例: `["hook:"]`。
- `deliver: true` は最終返信をchannelへ送信します。`channel` のデフォルトは `last` です。
- `model` はこのhook実行向けのLLMを上書きします（modelカタログが設定されている場合、許可されている必要があります）。

</Accordion>

### Gmail連携

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

- 設定されている場合、Gatewayは起動時に `gog gmail watch serve` を自動起動します。無効にするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。
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

- agentが編集可能なHTML/CSS/JSとA2UIを、Gatewayポート配下のHTTPで配信します:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカル専用: `gateway.bind: "loopback"`（デフォルト）のままにしてください。
- 非loopback bindでは、canvasルートは他のGateway HTTPサーフェスと同様にGateway auth（token/password/trusted-proxy）が必要です。
- Node WebViewは通常authヘッダーを送信しません。nodeがペアリングされ接続されると、Gatewayはcanvas/A2UIアクセス用のnodeスコープcapability URLを通知します。
- Capability URLはアクティブなnode WS sessionに束縛され、短時間で期限切れになります。IPベースのフォールバックは使われません。
- 配信されるHTMLにlive-reloadクライアントを注入します。
- 空の場合はスターター `index.html` を自動作成します。
- A2UIも `/__openclaw__/a2ui/` で配信します。
- 変更にはGatewayの再起動が必要です。
- ディレクトリが大きい場合や `EMFILE` エラー時はlive reloadを無効にしてください。

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
- ホスト名のデフォルトは `openclaw` です。`OPENCLAW_MDNS_HOSTNAME` で上書きできます。

### 広域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 配下にユニキャストDNS-SDゾーンを書き込みます。ネットワーク間discoveryには、DNSサーバー（CoreDNS推奨）+ Tailscale split DNSと組み合わせてください。

セットアップ: `openclaw dns setup --apply`。

---

## Environment

### `env`（インライン環境変数）

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

- インライン環境変数は、プロセス環境にそのキーがない場合にのみ適用されます。
- `.env` ファイル: CWDの `.env` + `~/.openclaw/.env`（どちらも既存変数を上書きしません）。
- `shellEnv`: ログインシェルprofileから、期待される不足キーを取り込みます。
- 完全な優先順位は [Environment](/ja-JP/help/environment) を参照してください。

### 環境変数置換

任意のconfig文字列内で `${VAR_NAME}` によって環境変数を参照できます。

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 一致するのは大文字名のみです: `[A-Z_][A-Z0-9_]*`。
- 欠落または空の変数は、config読み込み時にエラーになります。
- リテラルの `${VAR}` にするには `$${VAR}` でエスケープしてください。
- `$include` でも動作します。

---

## Secrets

SecretRefは追加的です。プレーンテキスト値も引き続き使えます。

### `SecretRef`

1つのオブジェクト形を使います。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` パターン: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` のidパターン: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` のid: 絶対JSONポインター（例: `"/providers/openai/apiKey"`）
- `source: "exec"` のidパターン: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` のidには `.` または `..` のスラッシュ区切りパスセグメントを含めてはいけません（例: `a/../b` は拒否されます）

### 対応する認証情報サーフェス

- 正規マトリクス: [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface)
- `secrets apply` は、対応する `openclaw.json` 認証情報パスを対象にします。
- `auth-profiles.json` のrefも、runtime解決と監査対象に含まれます。

### Secret provider設定

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // オプションの明示的env provider
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

- `file` providerは `mode: "json"` と `mode: "singleValue"` をサポートします（singleValue modeでは `id` は `"value"` である必要があります）。
- `exec` providerは絶対 `command` パスを必要とし、stdin/stdout上のプロトコルペイロードを使います。
- デフォルトではsymlink command pathは拒否されます。symlink pathを許可しつつ解決後ターゲットパスを検証するには `allowSymlinkCommand: true` を設定してください。
- `trustedDirs` が設定されている場合、trusted-dirチェックは解決後ターゲットパスに適用されます。
- `exec` 子プロセス環境はデフォルトで最小限です。必要な変数は `passEnv` で明示的に渡してください。
- Secret refは有効化時にインメモリsnapshotへ解決され、その後のリクエストパスはそのsnapshotのみを読み取ります。
- 有効サーフェスフィルタリングは有効化中に適用されます。enabledなサーフェス上の未解決refは起動/リロードを失敗させ、inactiveなサーフェスは診断付きでスキップされます。

---

## Auth storage

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
- `auth-profiles.json` は、静的認証情報モード向けに値レベルref（`api_key` には `keyRef`、`token` には `tokenRef`）をサポートします。
- OAuth modeのprofile（`auth.profiles.<id>.mode = "oauth"`）は、SecretRefベースのauth-profile認証情報をサポートしません。
- 静的runtime認証情報は、インメモリ解決snapshotから取得されます。レガシーな静的 `auth.json` エントリは、見つかった場合に除去されます。
- レガシーOAuthは `~/.openclaw/credentials/oauth.json` からインポートされます。
- [OAuth](/ja-JP/concepts/oauth) を参照してください。
- Secrets runtime動作と `audit/configure/apply` ツール: [Secrets Management](/ja-JP/gateway/secrets)。

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
  billing/クレジット不足エラーによりprofileが失敗したときの、時間単位の基本backoffです（デフォルト: `5`）。明示的なbilling文言は
  `401`/`403` 応答でもここに入ることがありますが、provider固有の文言
  matcherは、それを所有するproviderに限定されたままです（たとえばOpenRouterの
  `Key limit exceeded`）。再試行可能なHTTP `402` のusage-windowや
  organization/workspace spend-limitメッセージは、代わりに `rate_limit` パスに残ります。
- `billingBackoffHoursByProvider`: billing backoff時間のオプションのproviderごとのオーバーライドです。
- `billingMaxHours`: billing backoffの指数的増加の上限時間です（デフォルト: `24`）。
- `authPermanentBackoffMinutes`: 高信頼の `auth_permanent` 失敗向けの基本backoff分数です（デフォルト: `10`）。
- `authPermanentMaxMinutes`: `auth_permanent` backoff増加の上限分数です（デフォルト: `60`）。
- `failureWindowHours`: backoffカウンターに使うローリングウィンドウ（時間）です（デフォルト: `24`）。
- `overloadedProfileRotations`: model fallbackへ切り替える前に、overloadedエラーで同一provider内で行う最大auth-profileローテーション数です（デフォルト: `1`）。`ModelNotReadyException` のようなprovider-busy形状はここに入ります。
- `overloadedBackoffMs`: overloadedなprovider/profileローテーションを再試行する前の固定遅延です（デフォルト: `0`）。
- `rateLimitedProfileRotations`: model fallbackへ切り替える前に、rate-limitエラーで同一provider内で行う最大auth-profileローテーション数です（デフォルト: `1`）。このrate-limitバケットには、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted` などのprovider形状の文言も含まれます。

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

- デフォルトのログファイル: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`。
- 安定したパスには `logging.file` を設定してください。
- `consoleLevel` は `--verbose` のとき `debug` に上がります。
- `maxFileBytes`: 書き込みが抑制される前の最大ログファイルサイズ（バイト）です（正の整数。デフォルト: `524288000` = 500 MB）。本番デプロイでは外部ログローテーションを使ってください。

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

- `enabled`: インストルメンテーション出力のマスタースイッチです（デフォルト: `true`）。
- `flags`: 対象を絞ったログ出力を有効にするフラグ文字列の配列です（`"telegram.*"` や `"*"` のようなワイルドカードをサポート）。
- `stuckSessionWarnMs`: sessionが処理状態のままの間にstuck-session警告を出すまでの経過時間しきい値（ミリ秒）です。
- `otel.enabled`: OpenTelemetryエクスポートパイプラインを有効にします（デフォルト: `false`）。
- `otel.endpoint`: OTelエクスポート用のcollector URLです。
- `otel.protocol`: `"http/protobuf"`（デフォルト）または `"grpc"`。
- `otel.headers`: OTelエクスポートリクエストとともに送信される追加のHTTP/gRPCメタデータヘッダーです。
- `otel.serviceName`: resource属性向けのservice名です。
- `otel.traces` / `otel.metrics` / `otel.logs`: trace、metrics、またはlogエクスポートを有効にします。
- `otel.sampleRate`: traceサンプリング率 `0`–`1`。
- `otel.flushIntervalMs`: 定期telemetry flush間隔（ミリ秒）です。
- `cacheTrace.enabled`: 埋め込み実行向けにcache trace snapshotをログ出力します（デフォルト: `false`）。
- `cacheTrace.filePath`: cache trace JSONLの出力パスです（デフォルト: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
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

- `channel`: npm/gitインストール向けのリリースchannelです — `"stable"`、`"beta"`、または `"dev"`。
- `checkOnStart`: Gateway起動時にnpm更新を確認します（デフォルト: `true`）。
- `auto.enabled`: packageインストール向けのバックグラウンド自動更新を有効にします（デフォルト: `false`）。
- `auto.stableDelayHours`: stable-channel自動適用までの最小遅延時間です（デフォルト: `6`、最大: `168`）。
- `auto.stableJitterHours`: stable-channelロールアウトを分散させる追加ウィンドウ時間です（デフォルト: `12`、最大: `168`）。
- `auto.betaCheckIntervalHours`: beta-channel確認の実行間隔（時間）です（デフォルト: `1`、最大: `24`）。

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

- `enabled`: グローバルACP機能ゲートです（デフォルト: `false`）。
- `dispatch.enabled`: ACP sessionターンディスパッチ向けの独立したゲートです（デフォルト: `true`）。ACPコマンドを利用可能なまま実行をブロックするには `false` を設定してください。
- `backend`: デフォルトのACP runtime backend idです（登録済みACP runtime pluginに一致している必要があります）。
- `defaultAgent`: spawn時に明示的ターゲットが指定されていない場合のフォールバックACPターゲットagent idです。
- `allowedAgents`: ACP runtime sessionで許可されるagent idの許可リストです。空は追加制限なしを意味します。
- `maxConcurrentSessions`: 同時にアクティブにできるACP sessionの最大数です。
- `stream.coalesceIdleMs`: ストリームされたテキスト向けのアイドルflushウィンドウ（ミリ秒）です。
- `stream.maxChunkChars`: ストリームされたブロック投影を分割する前の最大チャンクサイズです。
- `stream.repeatSuppression`: ターンごとの重複status/tool行を抑制します（デフォルト: `true`）。
- `stream.deliveryMode`: `"live"` は段階的にストリーミングし、`"final_only"` はターン終端イベントまでバッファします。
- `stream.hiddenBoundarySeparator`: 非表示toolイベント後の可視テキスト前に入れる区切りです（デフォルト: `"paragraph"`）。
- `stream.maxOutputChars`: ACPターンごとに投影されるassistant出力の最大文字数です。
- `stream.maxSessionUpdateChars`: 投影されるACP status/update行の最大文字数です。
- `stream.tagVisibility`: ストリームイベント向けのタグ名から真偽値の表示オーバーライドへの記録です。
- `runtime.ttlMinutes`: ACP session workerがクリーンアップ対象になるまでのアイドルTTL（分）です。
- `runtime.installCommand`: ACP runtime環境のブートストラップ時に実行するオプションのインストールコマンドです。

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
  - `"random"`（デフォルト）: ローテーションする面白い/季節もののtagline。
  - `"default"`: 固定の中立的tagline（`All your chats, one OpenClaw.`）。
  - `"off"`: taglineテキストなし（バナーのタイトル/バージョンは引き続き表示）。
- バナー全体を非表示にするには（taglineだけでなく）、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定してください。

---

## ウィザード

CLIガイド付きセットアップフロー（`onboard`、`configure`、`doctor`）によって書き込まれるメタデータです。

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

現在のビルドにはTCP bridgeは含まれていません。nodeはGateway WebSocket経由で接続します。`bridge.*` キーはもはやconfig schemaの一部ではありません（削除するまで検証は失敗します。`openclaw doctor --fix` で未知キーを取り除けます）。

<Accordion title="レガシーbridge設定（歴史的参考）">

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
    webhook: "https://example.invalid/legacy", // 保存済み notify:true ジョブ向けの非推奨フォールバック
    webhookToken: "replace-with-dedicated-token", // 送信webhook認証向けのオプションのbearer token
    sessionRetention: "24h", // duration string または false
    runLog: {
      maxBytes: "2mb", // デフォルト 2_000_000 bytes
      keepLines: 2000, // デフォルト 2000
    },
  },
}
```

- `sessionRetention`: 完了した分離cron実行sessionを `sessions.json` から削除するまで保持する期間です。アーカイブされた削除済みcron transcriptのクリーンアップも制御します。デフォルト: `24h`。無効にするには `false` を設定してください。
- `runLog.maxBytes`: 削除前の実行ログファイルごとの最大サイズです（`cron/runs/<jobId>.jsonl`）。デフォルト: `2_000_000` bytes。
- `runLog.keepLines`: 実行ログ削減が発生したときに保持される最新行数です。デフォルト: `2000`。
- `webhookToken`: cron webhook POST配信（`delivery.mode = "webhook"`）に使うbearer tokenです。省略時は認証ヘッダーは送信されません。
- `webhook`: 非推奨のレガシーフォールバックwebhook URL（http/https）で、`notify: true` をまだ持つ保存済みジョブにのみ使われます。

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

- `maxAttempts`: 一時的エラー時のワンショットジョブ向け最大再試行回数です（デフォルト: `3`、範囲: `0`–`10`）。
- `backoffMs`: 各再試行で使うbackoff遅延（ミリ秒）の配列です（デフォルト: `[30000, 60000, 300000]`、1〜10エントリ）。
- `retryOn`: 再試行を引き起こすエラー種別 — `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略すると、すべての一時的種別を再試行します。

ワンショットcronジョブにのみ適用されます。定期ジョブでは別の失敗処理を使います。

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

- `enabled`: cronジョブ向け失敗アラートを有効にします（デフォルト: `false`）。
- `after`: アラート発火前の連続失敗回数です（正の整数、最小: `1`）。
- `cooldownMs`: 同じジョブに対する繰り返しアラート間の最小ミリ秒数です（0以上の整数）。
- `mode`: 配信モード — `"announce"` はchannelメッセージで送信し、`"webhook"` は設定済みwebhookへPOSTします。
- `accountId`: アラート配信のスコープを定めるオプションのaccountまたはchannel idです。

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

- すべてのジョブに共通するcron失敗通知のデフォルト送信先です。
- `mode`: `"announce"` または `"webhook"`。十分なターゲット情報がある場合、デフォルトは `"announce"` です。
- `channel`: announce配信向けのchannelオーバーライドです。`"last"` は最後にわかっている配信channelを再利用します。
- `to`: 明示的なannounceターゲットまたはwebhook URLです。webhook modeでは必須です。
- `accountId`: 配信向けのオプションのaccountオーバーライドです。
- ジョブごとの `delivery.failureDestination` は、このグローバルデフォルトを上書きします。
- グローバルにもジョブごとにもfailure destinationが設定されていない場合、すでに `announce` で配信するジョブは、失敗時にその主announceターゲットへフォールバックします。
- `delivery.failureDestination` は、ジョブの主 `delivery.mode` が `"webhook"` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。

[Cron Jobs](/ja-JP/automation/cron-jobs) を参照してください。分離されたcron実行は [background tasks](/ja-JP/automation/tasks) として追跡されます。

---

## メディアmodelテンプレート変数

`tools.media.models[].args` で展開されるテンプレートプレースホルダー:

| Variable           | 説明                                             |
| ------------------ | ------------------------------------------------ |
| `{{Body}}`         | 完全な受信メッセージ本文                         |
| `{{RawBody}}`      | 生の本文（履歴/送信者ラッパーなし）              |
| `{{BodyStripped}}` | グループメンションを除去した本文                 |
| `{{From}}`         | 送信者識別子                                     |
| `{{To}}`           | 宛先識別子                                       |
| `{{MessageSid}}`   | channelメッセージid                              |
| `{{SessionId}}`    | 現在のsession UUID                               |
| `{{IsNewSession}}` | 新しいsessionが作成された場合は `"true"`         |
| `{{MediaUrl}}`     | 受信メディアの疑似URL                            |
| `{{MediaPath}}`    | ローカルメディアパス                             |
| `{{MediaType}}`    | メディア種別（image/audio/document/…）           |
| `{{Transcript}}`   | 音声transcript                                   |
| `{{Prompt}}`       | CLIエントリ向けに解決されたメディアprompt        |
| `{{MaxChars}}`     | CLIエントリ向けに解決された最大出力文字数        |
| `{{ChatType}}`     | `"direct"` または `"group"`                      |
| `{{GroupSubject}}` | グループ件名（ベストエフォート）                 |
| `{{GroupMembers}}` | グループメンバープレビュー（ベストエフォート）   |
| `{{SenderName}}`   | 送信者表示名（ベストエフォート）                 |
| `{{SenderE164}}`   | 送信者電話番号（ベストエフォート）               |
| `{{Provider}}`     | providerヒント（whatsapp、telegram、discordなど） |

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

- 単一ファイル: そのオブジェクト全体を置き換えます。
- ファイル配列: 順にdeep mergeされます（後のものが前のものを上書き）。
- 同階層キー: include後にマージされます（includeされた値を上書き）。
- ネストしたinclude: 最大10階層まで。
- パス: include元ファイルを基準に解決されますが、トップレベルconfigディレクトリ（`openclaw.json` の `dirname`）内にとどまる必要があります。絶対パス/`../` 形式も、その境界内に解決される場合にのみ許可されます。
- エラー: 欠落ファイル、parseエラー、循環includeに対して明確なメッセージを出します。

---

_関連: [Configuration](/ja-JP/gateway/configuration) · [Configuration Examples](/ja-JP/gateway/configuration-examples) · [Doctor](/ja-JP/gateway/doctor)_
