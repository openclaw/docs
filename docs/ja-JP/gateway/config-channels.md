---
read_when:
    - チャネルPluginの設定（認証、アクセス制御、複数アカウント）
    - チャネルごとの設定キーをトラブルシューティングする
    - DMポリシー、グループポリシー、またはメンションゲーティングを監査する
summary: 'チャネル設定: Slack、Discord、Telegram、WhatsApp、Matrix、iMessage などにわたるアクセス制御、ペアリング、チャネルごとのキー'
title: 設定 — チャネル
x-i18n:
    generated_at: "2026-04-24T04:56:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 449275b8eef0ae841157f57baa9e04d35d9e62605726de8ee4ec098c18eb62e2
    source_path: gateway/config-channels.md
    workflow: 15
---

`channels.*` 配下のチャネルごとの設定キーです。DMとグループアクセス、複数アカウント構成、メンションゲーティング、Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、その他のバンドル済みチャネルPlugin向けのチャネルごとのキーを扱います。

エージェント、ツール、Gatewayランタイム、その他のトップレベルキーについては、[設定リファレンス](/ja-JP/gateway/configuration-reference) を参照してください。

## チャネル

各チャネルは、その設定セクションが存在すれば自動的に起動します（`enabled: false` の場合を除く）。

### DMとグループアクセス

すべてのチャネルはDMポリシーとグループポリシーをサポートします。

| DMポリシー | 動作 |
| ------------------- | --------------------------------------------------------------- |
| `pairing`（デフォルト） | 未知の送信者は1回限りのペアリングコードを受け取り、オーナーが承認する必要があります |
| `allowlist`         | `allowFrom`（またはペアリングallowストア）内の送信者のみ |
| `open`              | すべての受信DMを許可します（`allowFrom: ["*"]` が必要） |
| `disabled`          | すべての受信DMを無視します |

| グループポリシー | 動作 |
| --------------------- | ------------------------------------------------------ |
| `allowlist`（デフォルト） | 設定されたallowlistに一致するグループのみ |
| `open`                | グループallowlistをバイパスします（メンションゲーティングは引き続き適用されます） |
| `disabled`            | すべてのグループ/ルームメッセージをブロックします |

<Note>
`channels.defaults.groupPolicy` は、プロバイダの `groupPolicy` が未設定の場合のデフォルトを設定します。
ペアリングコードは1時間で期限切れになります。保留中のDMペアリング要求は**チャネルごとに3件**までに制限されます。
プロバイダブロック全体が欠落している場合（`channels.<provider>` が存在しない場合）、実行時のグループポリシーは起動警告とともに `allowlist`（フェイルクローズド）にフォールバックします。
</Note>

### チャネルごとのモデル上書き

`channels.modelByChannel` を使うと、特定のチャネルIDを特定のモデルに固定できます。値には `provider/model` または設定済みのモデルエイリアスを指定できます。このチャネルマッピングは、セッションにすでにモデル上書き（たとえば `/model` で設定） が存在しない場合に適用されます。

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

`channels.defaults` を使うと、プロバイダ間で共有されるグループポリシーとHeartbeat動作を設定できます。

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

- `channels.defaults.groupPolicy`: プロバイダレベルの `groupPolicy` が未設定の場合のフォールバックグループポリシー。
- `channels.defaults.contextVisibility`: すべてのチャネルに対する補足コンテキスト可視性モードのデフォルト。値: `all`（デフォルト。すべての引用/スレッド/履歴コンテキストを含む）、`allowlist`（allowlistに登録された送信者からのコンテキストのみ含む）、`allowlist_quote`（`allowlist` と同じだが明示的な引用/返信コンテキストは保持）。チャネルごとの上書き: `channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`: 正常なチャネルステータスをHeartbeat出力に含めます。
- `channels.defaults.heartbeat.showAlerts`: 劣化/エラー状態をHeartbeat出力に含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケータ形式のHeartbeat出力を表示します。

### WhatsApp

WhatsAppはGatewayのweb channel（Baileys Web）経由で動作します。リンク済みセッションがあれば自動的に起動します。

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

<Accordion title="複数アカウントWhatsApp">

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

- 送信コマンドは、`default` アカウントが存在すればデフォルトでそれを使います。なければ最初に設定されたアカウントid（ソート順）を使います。
- 任意の `channels.whatsapp.defaultAccount` は、設定済みアカウントidと一致する場合、このフォールバックのデフォルトアカウント選択を上書きします。
- 従来の単一アカウントBaileys auth dirは、`openclaw doctor` により `whatsapp/default` へ移行されます。
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
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- ボットトークン: `channels.telegram.botToken` または `channels.telegram.tokenFile`（通常ファイルのみ。シンボリックリンクは拒否）、デフォルトアカウント向けフォールバックとして `TELEGRAM_BOT_TOKEN` を使用可能。
- 任意の `channels.telegram.defaultAccount` は、設定済みアカウントidと一致する場合、デフォルトアカウント選択を上書きします。
- 複数アカウント構成（2つ以上のaccount id）では、フォールバックルーティングを避けるために明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定してください。これが欠落または不正な場合、`openclaw doctor` が警告します。
- `configWrites: false` は、Telegram起点の設定書き込み（supergroup ID移行、`/config set|unset`）をブロックします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、フォーラムトピック向けの永続的なACP bindingsを設定します（`match.peer.id` では標準形式の `chatId:topic:topicId` を使用）。フィールドの意味は [ACPエージェント](/ja-JP/tools/acp-agents#channel-specific-settings) で共通です。
- Telegramのストリームプレビューは `sendMessage` + `editMessageText` を使います（ダイレクトチャットとグループチャットの両方で動作）。
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

- トークン: `channels.discord.token`。デフォルトアカウント向けのフォールバックとして `DISCORD_BOT_TOKEN` を使用できます。
- 明示的なDiscord `token` を提供するダイレクト送信呼び出しでは、その呼び出しにそのトークンが使われます。アカウントのリトライ/ポリシー設定は、引き続きアクティブなランタイムスナップショット内の選択アカウントから取得されます。
- 任意の `channels.discord.defaultAccount` は、設定済みアカウントidと一致する場合、デフォルトアカウント選択を上書きします。
- 配信ターゲットには `user:<id>`（DM）または `channel:<id>`（guildチャネル）を使います。プレフィックスなしの数値IDは拒否されます。
- guild slugは小文字で、空白は `-` に置き換えられます。チャネルキーはslug化された名前（`#` なし）を使います。guild IDの使用を推奨します。
- ボット自身が作成したメッセージはデフォルトで無視されます。`allowBots: true` で有効になります。ボットへのメンションがあるボットメッセージのみ受け入れたい場合は `allowBots: "mentions"` を使います（自分自身のメッセージは引き続きフィルタされます）。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（およびチャネル上書き）は、別のユーザーまたはroleにメンションしていてボットにはメンションしていないメッセージを破棄します（@everyone/@hereを除く）。
- `maxLinesPerMessage`（デフォルト17）は、2000文字未満であっても縦に長いメッセージを分割します。
- `channels.discord.threadBindings` は、Discordのスレッド束縛ルーティングを制御します:
  - `enabled`: スレッド束縛セッション機能（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、および束縛された配信/ルーティング）に対するDiscord上書き
  - `idleHours`: 非アクティブ時の自動unfocusまでの時間（時間単位、`0` で無効）
  - `maxAgeHours`: 強制的な最大有効期間のDiscord上書き（時間単位、`0` で無効）
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` による自動スレッド作成/束縛のオプトインスイッチ
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、チャネルとスレッド向けの永続的なACP bindingsを設定します（`match.peer.id` にはチャネル/スレッドidを使用）。フィールドの意味は [ACPエージェント](/ja-JP/tools/acp-agents#channel-specific-settings) で共通です。
- `channels.discord.ui.components.accentColor` は、Discord components v2コンテナのアクセントカラーを設定します。
- `channels.discord.voice` は、Discord音声チャネル会話と、任意の自動参加 + TTS上書きを有効にします。
- `channels.discord.voice.daveEncryption` と `channels.discord.voice.decryptionFailureTolerance` は、`@discordjs/voice` のDAVEオプションにそのまま渡されます（デフォルトは `true` と `24`）。
- OpenClawは追加で、繰り返し復号失敗が起きた後に音声セッションから退出して再参加することで、音声受信の復旧を試みます。
- `channels.discord.streaming` は正規のストリームモードキーです。従来の `streamMode` と真偽値の `streaming` 値は自動移行されます。
- `channels.discord.autoPresence` はランタイム可用性をボットpresenceにマッピングし（healthy => online、degraded => idle、exhausted => dnd）、任意のステータステキスト上書きを可能にします。
- `channels.discord.dangerouslyAllowNameMatching` は、可変の名前/tag一致を再有効化します（緊急用の互換モード）。
- `channels.discord.execApprovals`: Discordネイティブのexec承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。autoモードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できるとexec承認が有効になります。
  - `approvers`: exec要求を承認できるDiscordユーザーID。省略時は `commands.ownerAllowFrom` にフォールバックします。
  - `agentFilter`: 任意のagent ID allowlist。省略すると、すべてのエージェントの承認を転送します。
  - `sessionFilter`: 任意のsession keyパターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）は承認者DMへ、`"channel"` は元チャネルへ、`"both"` は両方へ送信します。targetに `"channel"` が含まれる場合、ボタンを使えるのは解決済み承認者のみです。
  - `cleanupAfterResolve`: `true` の場合、承認、拒否、またはタイムアウト後に承認DMを削除します。

**リアクション通知モード:** `off`（なし）、`own`（ボット自身のメッセージ、デフォルト）、`all`（すべてのメッセージ）、`allowlist`（すべてのメッセージに対して `guilds.<id>.users` から）。

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
- サービスアカウントのSecretRef（`serviceAccountRef`）もサポートされます。
- 環境変数フォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信ターゲットには `spaces/<spaceId>` または `users/<userId>` を使います。
- `channels.googlechat.dangerouslyAllowNameMatching` は、可変のメールprincipal一致を再有効化します（緊急用の互換モード）。

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

- **Socket mode** には `botToken` と `appToken` の両方が必要です（デフォルトアカウント向け環境変数フォールバックは `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP mode** には `botToken` と `signingSecret` が必要です（ルートまたはアカウントごと）。
- `botToken`、`appToken`、`signingSecret`、`userToken` は、平文文字列またはSecretRefオブジェクトを受け付けます。
- Slackアカウントスナップショットは、`botTokenSource`、`botTokenStatus`、`appTokenStatus`、HTTP modeでは `signingSecretStatus` のような資格情報ごとのsource/statusフィールドを公開します。`configured_unavailable` は、そのアカウントがSecretRef経由で設定されているが、現在のコマンド/ランタイム経路ではsecret値を解決できなかったことを意味します。
- `configWrites: false` は、Slack起点の設定書き込みをブロックします。
- 任意の `channels.slack.defaultAccount` は、設定済みアカウントidと一致する場合、デフォルトアカウント選択を上書きします。
- `channels.slack.streaming.mode` は正規のSlackストリームモードキーです。`channels.slack.streaming.nativeTransport` はSlackのネイティブストリーミングトランスポートを制御します。従来の `streamMode`、真偽値の `streaming`、`nativeStreaming` 値は自動移行されます。
- 配信ターゲットには `user:<id>`（DM）または `channel:<id>` を使います。

**リアクション通知モード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` から）。

**スレッドセッション分離:** `thread.historyScope` はスレッド単位（デフォルト）またはチャネル共有です。`thread.inheritParent` は親チャネルのトランスクリプトを新しいスレッドへコピーします。

- SlackネイティブストリーミングとSlack assistantスタイルの「入力中...」スレッドステータスには、返信スレッドターゲットが必要です。トップレベルDMはデフォルトではスレッド外のままなので、スレッドスタイルのプレビューではなく `typingReaction` または通常配信を使います。
- `typingReaction` は、返信実行中に受信Slackメッセージへ一時的なリアクションを追加し、完了時に削除します。`"hourglass_flowing_sand"` のようなSlack絵文字ショートコードを使ってください。
- `channels.slack.execApprovals`: Slackネイティブのexec承認配信と承認者認可。スキーマはDiscordと同じです: `enabled`（`true` / `false` / `"auto"`）、`approvers`（SlackユーザーID）、`agentFilter`、`sessionFilter`、`target`（`"dm"`、`"channel"`、または `"both"`）。

| アクショングループ | デフォルト | 注記 |
| ------------ | ------- | ---------------------- |
| reactions    | 有効 | リアクション + リアクション一覧 |
| messages     | 有効 | 読み取り/送信/編集/削除 |
| pins         | 有効 | ピン留め/解除/一覧 |
| memberInfo   | 有効 | メンバー情報 |
| emojiList    | 有効 | カスタム絵文字一覧 |

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

チャットモード: `oncall`（`@mention` で応答、デフォルト）、`onmessage`（すべてのメッセージ）、`onchar`（トリガープレフィックスで始まるメッセージ）。

Mattermostネイティブコマンドが有効な場合:

- `commands.callbackPath` は完全URLではなくパスでなければなりません（例: `/api/channels/mattermost/command`）。
- `commands.callbackUrl` はOpenClaw gateway endpointに解決され、Mattermostサーバーから到達可能である必要があります。
- ネイティブスラッシュコールバックは、スラッシュコマンド登録時にMattermostから返されるコマンドごとのトークンで認証されます。登録に失敗した、または有効化されたコマンドがない場合、OpenClawはコールバックを `Unauthorized: invalid command token.` で拒否します。
- プライベート/tailnet/internalのコールバックホストでは、Mattermostに `ServiceSettings.AllowedUntrustedInternalConnections` でコールバックホスト/ドメインを含める必要がある場合があります。完全URLではなく、ホスト/ドメイン値を使ってください。
- `channels.mattermost.configWrites`: Mattermost起点の設定書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャネルで返信する前に `@mention` を必須にします。
- `channels.mattermost.groups.<channelId>.requireMention`: チャネルごとのメンションゲーティング上書き（デフォルトには `"*"`）。
- 任意の `channels.mattermost.defaultAccount` は、設定済みアカウントidと一致する場合、デフォルトアカウント選択を上書きします。

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

- `channels.signal.account`: チャネル起動を特定のSignalアカウントidentityに固定します。
- `channels.signal.configWrites`: Signal起点の設定書き込みを許可または拒否します。
- 任意の `channels.signal.defaultAccount` は、設定済みアカウントidと一致する場合、デフォルトアカウント選択を上書きします。

### BlueBubbles

BlueBubblesは推奨されるiMessage経路です（Pluginバックエンドで、`channels.bluebubbles` の下に設定します）。

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

- ここで扱う主要なキーパス: `channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- 任意の `channels.bluebubbles.defaultAccount` は、設定済みアカウントidと一致する場合、デフォルトアカウント選択を上書きします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、BlueBubbles会話を永続的なACPセッションにバインドできます。`match.peer.id` にはBlueBubbles handleまたはターゲット文字列（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使います。共通のフィールドセマンティクス: [ACPエージェント](/ja-JP/tools/acp-agents#channel-specific-settings)。
- 完全なBlueBubblesチャネル設定は [BlueBubbles](/ja-JP/channels/bluebubbles) に文書化されています。

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

- 任意の `channels.imessage.defaultAccount` は、設定済みアカウントidと一致する場合、デフォルトアカウント選択を上書きします。

- Messages DBへのフルディスクアクセスが必要です。
- `chat_id:<id>` ターゲットを推奨します。チャット一覧の取得には `imsg chats --limit 20` を使います。
- `cliPath` はSSHラッパーを指せます。SCPで添付ファイルを取得するには `remoteHost`（`host` または `user@host`）を設定してください。
- `attachmentRoots` と `remoteAttachmentRoots` は受信添付ファイルパスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCPは厳格なホストキー検証を使うため、リレーホストキーがすでに `~/.ssh/known_hosts` に存在していることを確認してください。
- `channels.imessage.configWrites`: iMessage起点の設定書き込みを許可または拒否します。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、iMessage会話を永続的なACPセッションにバインドできます。`match.peer.id` には正規化されたhandleまたは明示的なチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使います。共通のフィールドセマンティクス: [ACPエージェント](/ja-JP/tools/acp-agents#channel-specific-settings)。

<Accordion title="iMessage SSHラッパーの例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

MatrixはPluginバックエンドで、`channels.matrix` の下に設定します。

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

- トークン認証では `accessToken` を使い、パスワード認証では `userId` + `password` を使います。
- `channels.matrix.proxy` は、Matrix HTTPトラフィックを明示的なHTTP(S) proxy経由にします。名前付きアカウントでは `channels.matrix.accounts.<id>.proxy` で上書きできます。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` は、private/internal homeserverを許可します。`proxy` とこのネットワークオプトインは独立した制御です。
- `channels.matrix.defaultAccount` は、複数アカウント構成で優先アカウントを選択します。
- `channels.matrix.autoJoin` のデフォルトは `off` なので、`autoJoin: "allowlist"` と `autoJoinAllowlist`、または `autoJoin: "always"` を設定するまで、招待されたルームや新しいDM風の招待は無視されます。
- `channels.matrix.execApprovals`: Matrixネイティブのexec承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。autoモードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できるとexec承認が有効になります。
  - `approvers`: exec要求を承認できるMatrixユーザーID（例 `@owner:example.org`）。
  - `agentFilter`: 任意のagent ID allowlist。省略すると、すべてのエージェントの承認を転送します。
  - `sessionFilter`: 任意のsession keyパターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）、`"channel"`（元のルーム）、または `"both"`。
  - アカウントごとの上書き: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` は、Matrix DMをどのようにセッションへまとめるかを制御します: `per-user`（デフォルト）はルーティングされたpeerごとに共有し、`per-room` は各DMルームを分離します。
- Matrixステータスprobeとライブディレクトリ検索は、ランタイムトラフィックと同じproxyポリシーを使います。
- 完全なMatrix設定、ターゲティングルール、セットアップ例は [Matrix](/ja-JP/channels/matrix) に文書化されています。

### Microsoft Teams

Microsoft TeamsはPluginバックエンドで、`channels.msteams` の下に設定します。

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

- ここで扱う主要なキーパス: `channels.msteams`、`channels.msteams.configWrites`。
- 完全なTeams設定（認証情報、Webhook、DM/グループポリシー、team/channelごとの上書き）は [Microsoft Teams](/ja-JP/channels/msteams) に文書化されています。

### IRC

IRCはPluginバックエンドで、`channels.irc` の下に設定します。

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

- ここで扱う主要なキーパス: `channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- 任意の `channels.irc.defaultAccount` は、設定済みアカウントidと一致する場合、デフォルトアカウント選択を上書きします。
- 完全なIRCチャネル設定（host/port/TLS/channels/allowlists/mention gating）は [IRC](/ja-JP/channels/irc) に文書化されています。

### 複数アカウント（全チャネル）

チャネルごとに複数アカウントを実行できます（各アカウントは独自の `accountId` を持ちます）。

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

- `accountId` が省略された場合は `default` が使われます（CLI + ルーティング）。
- 環境変数トークンは **default** アカウントにのみ適用されます。
- ベースチャネル設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- 各アカウントを異なるエージェントへルーティングするには `bindings[].match.accountId` を使います。
- まだ単一アカウントのトップレベルチャネル設定のまま、`openclaw channels add`（またはチャネルオンボーディング）でdefault以外のアカウントを追加すると、OpenClawはまず、元のアカウントが動作し続けるように、アカウントスコープ付きのトップレベル単一アカウント値をチャネルアカウントマップへ昇格させます。ほとんどのチャネルではそれらを `channels.<channel>.accounts.default` へ移します。Matrixでは、代わりに既存の一致する名前付き/defaultターゲットを保持できます。
- 既存のチャネルのみbinding（`accountId` なし）は引き続きdefaultアカウントに一致します。アカウントスコープ付きbindingは引き続き任意です。
- `openclaw doctor --fix` も、アカウントスコープ付きトップレベル単一アカウント値を、そのチャネル用に選ばれた昇格先アカウントへ移動することで、混在した形状を修復します。ほとんどのチャネルでは `accounts.default` を使います。Matrixでは代わりに既存の一致する名前付き/defaultターゲットを保持できます。

### その他のPluginチャネル

多くのPluginチャネルは `channels.<id>` として設定され、それぞれ専用のチャネルページに文書化されています（たとえば Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch）。
完全なチャネル一覧は [Channels](/ja-JP/channels) を参照してください。

### グループチャットのメンションゲーティング

グループメッセージはデフォルトで**メンション必須**です（メタデータメンションまたは安全な正規表現パターン）。WhatsApp、Telegram、Discord、Google Chat、iMessageのグループチャットに適用されます。

**メンションの種類:**

- **メタデータメンション**: ネイティブなプラットフォームの `@mention`。WhatsApp self-chat modeでは無視されます。
- **テキストパターン**: `agents.list[].groupChat.mentionPatterns` にある安全な正規表現パターン。無効なパターンや安全でないネスト反復は無視されます。
- メンションゲーティングは、検出が可能な場合にのみ適用されます（ネイティブメンションがある、または少なくとも1つのパターンがある場合）。

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

`messages.groupChat.historyLimit` はグローバルデフォルトを設定します。チャネルは `channels.<channel>.historyLimit`（またはアカウントごと）で上書きできます。無効化するには `0` を設定します。

#### DM履歴上限

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

解決順序: DMごとの上書き → プロバイダデフォルト → 上限なし（すべて保持）。

対応: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### self-chat mode

自分自身の番号を `allowFrom` に含めるとself-chat modeを有効にできます（ネイティブの `@mention` を無視し、テキストパターンにのみ応答します）。

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
- このページは**設定キーのリファレンス**であり、完全なコマンドカタログではありません。QQ Bot の `/bot-ping` `/bot-help` `/bot-logs`、LINE の `/card`、device-pair の `/pair`、memory の `/dreaming`、phone-control の `/phone`、Talk の `/voice` のようなチャネル/Plugin所有コマンドは、それぞれのチャネル/Pluginページと [スラッシュコマンド](/ja-JP/tools/slash-commands) に文書化されています。
- テキストコマンドは、先頭に `/` が付いた**単独の**メッセージである必要があります。
- `native: "auto"` はDiscord/Telegramのネイティブコマンドを有効にし、Slackではオフのままにします。
- `nativeSkills: "auto"` はDiscord/TelegramのネイティブSkillsコマンドを有効にし、Slackではオフのままにします。
- チャネルごとの上書き: `channels.discord.commands.native`（bool または `"auto"`）。`false` は以前に登録されたコマンドをクリアします。
- ネイティブskill登録は `channels.<provider>.commands.nativeSkills` でチャネルごとに上書きできます。
- `channels.telegram.customCommands` は、追加のTelegramボットメニュー項目を加えます。
- `bash: true` は、ホストシェル向けの `! <cmd>` を有効にします。`tools.elevated.enabled` と、送信者が `tools.elevated.allowFrom.<channel>` に含まれていることが必要です。
- `config: true` は `/config` を有効にします（`openclaw.json` の読み書き）。gateway `chat.send` クライアントでは、永続的な `/config set|unset` 書き込みには `operator.admin` も必要です。読み取り専用の `/config show` は、通常のwrite-scope付きoperatorクライアントでも引き続き利用できます。
- `mcp: true` は、`mcp.servers` 配下のOpenClaw管理MCPサーバー設定に対する `/mcp` を有効にします。
- `plugins: true` は、Pluginの検出、インストール、有効/無効制御のための `/plugins` を有効にします。
- `channels.<provider>.configWrites` は、チャネルごとの設定変更を制御します（デフォルト: true）。
- 複数アカウントチャネルでは、`channels.<provider>.accounts.<id>.configWrites` も、そのアカウントを対象とする書き込み（たとえば `/allowlist --config --account <id>` や `/config set channels.<provider>.accounts.<id>...`）を制御します。
- `restart: false` は `/restart` とgateway再起動ツールアクションを無効にします。デフォルト: `true`。
- `ownerAllowFrom` は、オーナー専用コマンド/ツール向けの明示的なオーナーallowlistです。`allowFrom` とは別です。
- `ownerDisplay: "hash"` は、システムプロンプト内のオーナーIDをハッシュ化します。ハッシュを制御するには `ownerDisplaySecret` を設定してください。
- `allowFrom` はプロバイダごとです。これが設定されると、それが**唯一の**認可ソースになります（チャネルallowlist/ペアリングと `useAccessGroups` は無視されます）。
- `useAccessGroups: false` は、`allowFrom` が設定されていない場合に、コマンドがaccess-groupポリシーをバイパスできるようにします。
- コマンドドキュメントの対応表:
  - 組み込み + バンドル済みカタログ: [スラッシュコマンド](/ja-JP/tools/slash-commands)
  - チャネル固有のコマンドサーフェス: [Channels](/ja-JP/channels)
  - QQ Botコマンド: [QQ Bot](/ja-JP/channels/qqbot)
  - ペアリングコマンド: [ペアリング](/ja-JP/channels/pairing)
  - LINE cardコマンド: [LINE](/ja-JP/channels/line)
  - memory Dreaming: [Dreaming](/ja-JP/concepts/dreaming)

</Accordion>

---

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference) — トップレベルキー
- [設定 — エージェント](/ja-JP/gateway/config-agents)
- [チャネル概要](/ja-JP/channels)
