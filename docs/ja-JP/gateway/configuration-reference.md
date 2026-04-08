---
read_when:
    - フィールド単位の正確な設定セマンティクスやデフォルト値が必要な場合
    - チャネル、モデル、Gateway、またはツールの設定ブロックを検証している場合
summary: コアのOpenClawキー、デフォルト値、専用サブシステムリファレンスへのリンクを含むGateway設定リファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-04-08T06:06:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f9ab34fb56897a77cb038d95bea21e8530d8f0402b66d1ee97c73822a1e8fd4
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# 設定リファレンス

`~/.openclaw/openclaw.json` のコア設定リファレンスです。タスク指向の概要については、[Configuration](/ja-JP/gateway/configuration) を参照してください。

このページでは、主要なOpenClawの設定サーフェスを扱い、サブシステムに専用のより詳細なリファレンスがある場合はそちらへのリンクを示します。このページでは、すべてのチャネル/プラグイン所有のコマンドカタログや、すべての詳細なメモリ/QMDノブを1ページにインラインで載せようとはしていません。

コード上の正確な情報:

- `openclaw config schema` は、検証とControl UIに使われる実際のJSON Schemaを表示し、利用可能な場合は bundled/plugin/channel metadata もマージされます
- `config.schema.lookup` は、ドリルダウン用ツール向けに1つのパススコープ付きスキーマノードを返します
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、config-doc baseline hash を現在のスキーマサーフェスと照合して検証します

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および `plugins.entries.memory-core.config.dreaming` 配下の dreaming 設定については [Memory configuration reference](/ja-JP/reference/memory-config)
- 現在の built-in + bundled コマンドカタログについては [Slash Commands](/ja-JP/tools/slash-commands)
- チャネル固有のコマンドサーフェスについては各チャネル/プラグインのページ

設定形式は **JSON5** です（コメントと末尾カンマを許可）。すべてのフィールドは任意です — OpenClaw は省略時に安全なデフォルト値を使用します。

---

## チャネル

各チャネルは、その設定セクションが存在すると自動で開始されます（`enabled: false` の場合を除く）。

### DM とグループアクセス

すべてのチャネルはDMポリシーとグループポリシーをサポートします:

| DMポリシー         | 動作                                                           |
| ------------------ | -------------------------------------------------------------- |
| `pairing`（デフォルト） | 未知の送信者に1回限りのペアリングコードを発行し、オーナーの承認が必要 |
| `allowlist`        | `allowFrom`（またはペアリング済み許可ストア）内の送信者のみ     |
| `open`             | すべての受信DMを許可（`allowFrom: ["*"]` が必要）               |
| `disabled`         | すべての受信DMを無視                                           |

| グループポリシー         | 動作                                                   |
| ------------------------ | ------------------------------------------------------ |
| `allowlist`（デフォルト） | 設定された許可リストに一致するグループのみ             |
| `open`                   | グループ許可リストをバイパス（メンションゲートは引き続き適用） |
| `disabled`               | すべてのグループ/ルームメッセージをブロック            |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が未設定のときのデフォルトを設定します。
ペアリングコードは1時間で失効します。保留中のDMペアリングリクエストは **チャネルごとに3件** に制限されます。
プロバイダーブロック全体が存在しない場合（`channels.<provider>` が不在）、実行時のグループポリシーは起動時警告付きで `allowlist`（フェイルクローズ）にフォールバックします。
</Note>

### チャネルごとのモデル上書き

特定のチャネルIDをモデルに固定するには `channels.modelByChannel` を使います。値には `provider/model` または設定済みモデルエイリアスを指定できます。このチャネルマッピングは、セッションにすでにモデル上書きがない場合に適用されます（たとえば `/model` で設定された場合など）。

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

### チャネルのデフォルトとハートビート

プロバイダー間で共有するグループポリシーとハートビート動作には `channels.defaults` を使います:

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

- `channels.defaults.groupPolicy`: プロバイダーレベルの `groupPolicy` が未設定のときのフォールバック用グループポリシー。
- `channels.defaults.contextVisibility`: すべてのチャネルに対する補足コンテキスト可視性モードのデフォルト。値: `all`（デフォルト、引用/スレッド/履歴コンテキストをすべて含む）、`allowlist`（許可済み送信者のコンテキストのみ含む）、`allowlist_quote`（allowlist と同じだが明示的な引用/返信コンテキストは保持）。チャネル単位の上書き: `channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`: 健全なチャネル状態をハートビート出力に含めます。
- `channels.defaults.heartbeat.showAlerts`: 劣化/エラー状態をハートビート出力に含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケータ形式のハートビート出力を表示します。

### WhatsApp

WhatsApp は Gateway の web channel（Baileys Web）経由で動作します。リンク済みセッションが存在すると自動で開始されます。

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

<Accordion title="複数アカウントの WhatsApp">

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

- 送信コマンドは、`default` アカウントが存在すればそれを使い、存在しない場合は最初の設定済みアカウントID（ソート順）を使います。
- オプションの `channels.whatsapp.defaultAccount` は、設定済みアカウントIDに一致する場合、このフォールバックのデフォルトアカウント選択を上書きします。
- 旧来の単一アカウント Baileys auth dir は、`openclaw doctor` によって `whatsapp/default` に移行されます。
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

- Bot token: `channels.telegram.botToken` または `channels.telegram.tokenFile`（通常ファイルのみ。symlink は拒否）、デフォルトアカウントのフォールバックとして `TELEGRAM_BOT_TOKEN` も使用可能。
- オプションの `channels.telegram.defaultAccount` は、設定済みアカウントIDに一致する場合、デフォルトアカウント選択を上書きします。
- 複数アカウント構成（2つ以上の account id）では、フォールバックルーティングを避けるため、明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定してください。これがない、または無効な場合は `openclaw doctor` が警告します。
- `configWrites: false` は、Telegram 起点の設定書き込み（supergroup ID migration、`/config set|unset`）をブロックします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、フォーラムトピック向けの永続的な ACP バインディングを設定します（`match.peer.id` には正規の `chatId:topic:topicId` を使用）。フィールドの意味は [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) と共通です。
- Telegram のストリームプレビューは `sendMessage` + `editMessageText` を使用します（ダイレクトチャットとグループチャットの両方で動作）。
- Retry policy については [Retry policy](/ja-JP/concepts/retry) を参照してください。

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

- Token: `channels.discord.token`。デフォルトアカウントのフォールバックとして `DISCORD_BOT_TOKEN` を使用します。
- 明示的な Discord `token` を指定した直接送信呼び出しは、その呼び出しにその token を使用します。アカウントの retry/policy 設定は引き続き、アクティブな runtime snapshot 内で選択されたアカウントから取得されます。
- オプションの `channels.discord.defaultAccount` は、設定済みアカウントIDに一致する場合、デフォルトアカウント選択を上書きします。
- 配信ターゲットには `user:<id>`（DM）または `channel:<id>`（guild channel）を使用します。数値ID単体は拒否されます。
- Guild slug は小文字で、スペースは `-` に置き換えられます。channel key には slug 化された名前（`#` なし）を使います。guild ID の使用を推奨します。
- Bot が投稿したメッセージはデフォルトで無視されます。`allowBots: true` で有効化します。bot へのメンションがある bot メッセージだけを受け付けるには `allowBots: "mentions"` を使用します（自分自身のメッセージは引き続きフィルタリングされます）。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（および channel override）は、bot ではない他ユーザーまたはロールにメンションしていて bot にはメンションしていないメッセージを破棄します（@everyone/@here は除外）。
- `maxLinesPerMessage`（デフォルト17）は、2000文字未満でも行数が多いメッセージを分割します。
- `channels.discord.threadBindings` は Discord のスレッドバインド型ルーティングを制御します:
  - `enabled`: スレッドバインドセッション機能（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびバインドされた配信/ルーティング）に対する Discord 側の上書き
  - `idleHours`: 非アクティブ時の自動 unfocus の Discord 側上書き（時間単位、`0` で無効）
  - `maxAgeHours`: ハード最大寿命の Discord 側上書き（時間単位、`0` で無効）
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` による自動スレッド作成/バインドの opt-in スイッチ
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、チャネルおよびスレッド向けの永続的な ACP バインディングを設定します（`match.peer.id` に channel/thread id を使用）。フィールドの意味は [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) と共通です。
- `channels.discord.ui.components.accentColor` は Discord components v2 containers のアクセントカラーを設定します。
- `channels.discord.voice` は Discord voice channel 会話と、オプションの auto-join + TTS overrides を有効にします。
- `channels.discord.voice.daveEncryption` と `channels.discord.voice.decryptionFailureTolerance` は、`@discordjs/voice` の DAVE オプションにそのまま渡されます（デフォルトは `true` と `24`）。
- OpenClaw はさらに、復号失敗が繰り返された場合に voice session から離脱して再参加することで音声受信の回復も試みます。
- `channels.discord.streaming` は正規の stream mode キーです。旧来の `streamMode` と boolean `streaming` 値は自動移行されます。
- `channels.discord.autoPresence` は runtime availability を bot presence にマップし（healthy => online、degraded => idle、exhausted => dnd）、オプションの status text override も可能です。
- `channels.discord.dangerouslyAllowNameMatching` は、可変な name/tag マッチングを再度有効にします（緊急用の互換モード）。
- `channels.discord.execApprovals`: Discord ネイティブの exec approval 配信と approver 認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。auto モードでは、`approvers` または `commands.ownerAllowFrom` から approver を解決できると exec approval が有効化されます。
  - `approvers`: exec request を承認できる Discord user ID。省略時は `commands.ownerAllowFrom` にフォールバックします。
  - `agentFilter`: オプションの agent ID allowlist。省略するとすべての agent に対する approval を転送します。
  - `sessionFilter`: オプションの session key pattern（部分文字列または regex）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）は approver の DM に送信、`"channel"` は元のチャネルに送信、`"both"` は両方に送信。target に `"channel"` を含む場合、ボタンを使えるのは解決済み approver のみです。
  - `cleanupAfterResolve`: `true` の場合、承認・拒否・タイムアウト後に approval DM を削除します。

**リアクション通知モード:** `off`（なし）、`own`（bot 自身のメッセージ、デフォルト）、`all`（すべてのメッセージ）、`allowlist`（`guilds.<id>.users` に含まれるユーザーからの全メッセージ）。

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
- Service account SecretRef もサポートされます（`serviceAccountRef`）。
- Env フォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信ターゲットには `spaces/<spaceId>` または `users/<userId>` を使用します。
- `channels.googlechat.dangerouslyAllowNameMatching` は、可変な email principal マッチングを再度有効にします（緊急用の互換モード）。

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

- **Socket mode** では `botToken` と `appToken` の両方が必要です（デフォルトアカウントの env フォールバックとして `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP mode** では `botToken` と `signingSecret`（ルートまたはアカウントごと）の両方が必要です。
- `botToken`、`appToken`、`signingSecret`、`userToken` はプレーンテキスト文字列または SecretRef object を受け付けます。
- Slack account snapshot では、`botTokenSource`、`botTokenStatus`、`appTokenStatus`、HTTP mode では `signingSecretStatus` などの認証情報ごとの source/status フィールドが公開されます。`configured_unavailable` は、そのアカウントが SecretRef で設定されているが、現在の command/runtime path では secret 値を解決できなかったことを意味します。
- `configWrites: false` は Slack 起点の設定書き込みをブロックします。
- オプションの `channels.slack.defaultAccount` は、設定済みアカウントIDに一致する場合、デフォルトアカウント選択を上書きします。
- `channels.slack.streaming.mode` は正規の Slack stream mode キーです。`channels.slack.streaming.nativeTransport` は Slack のネイティブストリーミング転送を制御します。旧来の `streamMode`、boolean `streaming`、`nativeStreaming` 値は自動移行されます。
- 配信ターゲットには `user:<id>`（DM）または `channel:<id>` を使用します。

**リアクション通知モード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` から）。

**スレッドセッション分離:** `thread.historyScope` はスレッド単位（デフォルト）またはチャネル共有です。`thread.inheritParent` は親チャネルの transcript を新規スレッドにコピーします。

- Slack ネイティブストリーミングと Slack assistant 風の「入力中...」スレッド状態は、返信先スレッドターゲットを必要とします。トップレベルDMはデフォルトでスレッド外のため、スレッド風プレビューの代わりに `typingReaction` または通常配信を使用します。
- `typingReaction` は、返信処理中に受信した Slack メッセージへ一時的なリアクションを追加し、完了時に削除します。`"hourglass_flowing_sand"` のような Slack emoji shortcode を使用してください。
- `channels.slack.execApprovals`: Slack ネイティブの exec approval 配信と approver 認可。Discord と同じスキーマです: `enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack user ID）、`agentFilter`、`sessionFilter`、`target`（`"dm"`、`"channel"`、または `"both"`）。

| アクショングループ | デフォルト | 備考                     |
| ------------------ | ---------- | ------------------------ |
| reactions          | enabled    | リアクション + リスト表示 |
| messages           | enabled    | 読み取り/送信/編集/削除   |
| pins               | enabled    | ピン留め/解除/一覧        |
| memberInfo         | enabled    | メンバー情報              |
| emojiList          | enabled    | カスタム絵文字一覧        |

### Mattermost

Mattermost はプラグインとして提供されます: `openclaw plugins install @openclaw/mattermost`。

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

Chat mode: `oncall`（@-mention で応答、デフォルト）、`onmessage`（すべてのメッセージ）、`onchar`（トリガープレフィックスで始まるメッセージ）。

Mattermost ネイティブコマンドが有効な場合:

- `commands.callbackPath` はフルURLではなくパスである必要があります（例: `/api/channels/mattermost/command`）。
- `commands.callbackUrl` は OpenClaw Gateway endpoint に解決され、Mattermost サーバーから到達可能である必要があります。
- ネイティブ slash callback は、slash command 登録時に Mattermost が返すコマンドごとのトークンで認証されます。登録に失敗した場合、または有効なコマンドがない場合、OpenClaw は callback を `Unauthorized: invalid command token.` で拒否します。
- private/tailnet/internal callback host の場合、Mattermost では `ServiceSettings.AllowedUntrustedInternalConnections` に callback host/domain を含める必要があることがあります。
  フルURLではなく host/domain 値を使用してください。
- `channels.mattermost.configWrites`: Mattermost 起点の設定書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャネルで返信する前に `@mention` を必須にします。
- `channels.mattermost.groups.<channelId>.requireMention`: チャネル単位のメンションゲート上書き（デフォルトは `"*"`）。
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

- `channels.signal.account`: チャネル起動を特定の Signal account identity に固定します。
- `channels.signal.configWrites`: Signal 起点の設定書き込みを許可または拒否します。
- オプションの `channels.signal.defaultAccount` は、設定済みアカウントIDに一致する場合、デフォルトアカウント選択を上書きします。

### BlueBubbles

BlueBubbles は推奨される iMessage 経路です（plugin-backed で、`channels.bluebubbles` 配下に設定します）。

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
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、BlueBubbles conversation を永続的な ACP session にバインドできます。`match.peer.id` には BlueBubbles handle または target string（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共有フィールドの意味: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。
- BlueBubbles チャネルの完全な設定は [BlueBubbles](/ja-JP/channels/bluebubbles) に記載されています。

### iMessage

OpenClaw は `imsg rpc`（stdio 上の JSON-RPC）を起動します。daemon や port は不要です。

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

- Messages DB への Full Disk Access が必要です。
- `chat_id:<id>` ターゲットの使用を推奨します。チャット一覧は `imsg chats --limit 20` で確認できます。
- `cliPath` は SSH wrapper を指しても構いません。SCP で添付ファイルを取得する場合は `remoteHost`（`host` または `user@host`）を設定してください。
- `attachmentRoots` と `remoteAttachmentRoots` は受信添付ファイルパスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCP は strict host-key checking を使用するため、relay host key がすでに `~/.ssh/known_hosts` に存在している必要があります。
- `channels.imessage.configWrites`: iMessage 起点の設定書き込みを許可または拒否します。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、iMessage conversation を永続的な ACP session にバインドできます。`match.peer.id` には正規化された handle または明示的な chat target（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共有フィールドの意味: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。

<Accordion title="iMessage SSH wrapper の例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix は extension-backed で、`channels.matrix` 配下に設定します。

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

- Token 認証は `accessToken` を使用し、password 認証は `userId` + `password` を使用します。
- `channels.matrix.proxy` は Matrix HTTP traffic を明示的な HTTP(S) proxy 経由にします。名前付きアカウントは `channels.matrix.accounts.<id>.proxy` で上書きできます。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` は private/internal homeserver を許可します。`proxy` とこの network opt-in は独立した制御です。
- `channels.matrix.defaultAccount` は複数アカウント構成で優先アカウントを選択します。
- `channels.matrix.autoJoin` のデフォルトは `off` です。そのため、招待された room や新しい DM 風 invite は、`autoJoin: "allowlist"` と `autoJoinAllowlist`、または `autoJoin: "always"` を設定するまで無視されます。
- `channels.matrix.execApprovals`: Matrix ネイティブの exec approval 配信と approver 認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。auto モードでは、`approvers` または `commands.ownerAllowFrom` から approver を解決できると exec approvals が有効化されます。
  - `approvers`: exec request を承認できる Matrix user ID（例: `@owner:example.org`）。
  - `agentFilter`: オプションの agent ID allowlist。省略するとすべての agent に対する approval を転送します。
  - `sessionFilter`: オプションの session key pattern（部分文字列または regex）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）、`"channel"`（元の room）、または `"both"`。
  - アカウントごとの上書き: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` は Matrix DM をどのように session にまとめるかを制御します: `per-user`（デフォルト）は routed peer 単位で共有し、`per-room` は各 DM room を分離します。
- Matrix の status probe と live directory lookup は、実行時トラフィックと同じ proxy policy を使用します。
- Matrix の完全な設定、ターゲティングルール、セットアップ例は [Matrix](/ja-JP/channels/matrix) に記載されています。

### Microsoft Teams

Microsoft Teams は extension-backed で、`channels.msteams` 配下に設定します。

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
- Teams の完全な設定（credentials、webhook、DM/group policy、team/channel ごとの上書き）は [Microsoft Teams](/ja-JP/channels/msteams) に記載されています。

### IRC

IRC は extension-backed で、`channels.irc` 配下に設定します。

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
- IRC チャネルの完全な設定（host/port/TLS/channels/allowlists/mention gating）は [IRC](/ja-JP/channels/irc) に記載されています。

### 複数アカウント（全チャネル共通）

複数アカウントをチャネルごとに実行できます（それぞれ独自の `accountId` を持ちます）:

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

- `accountId` が省略された場合は `default` が使用されます（CLI + routing）。
- Env token は **default** アカウントにのみ適用されます。
- ベースのチャネル設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- 各アカウントを異なる agent にルーティングするには `bindings[].match.accountId` を使用します。
- まだ単一アカウントのトップレベルチャネル設定である状態で `openclaw channels add`（またはチャネル onboarding）経由で非デフォルトアカウントを追加すると、OpenClaw はまず、元のアカウントが引き続き動作するように、アカウントスコープのトップレベル単一アカウント値をチャネル account map に昇格します。ほとんどのチャネルでは `channels.<channel>.accounts.default` に移動されますが、Matrix は既存の一致する named/default target を保持できます。
- 既存のチャネル専用 binding（`accountId` なし）は引き続き default アカウントに一致します。account-scoped binding は引き続き任意です。
- `openclaw doctor --fix` も mixed shape を修復し、そのチャネル用に選ばれた昇格アカウントへ account-scoped のトップレベル単一アカウント値を移動します。ほとんどのチャネルは `accounts.default` を使用し、Matrix は既存の一致する named/default target を保持できます。

### その他の extension チャネル

多くの extension チャネルは `channels.<id>` として設定され、専用のチャネルページに記載されています（例: Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch）。
完全なチャネル一覧は [Channels](/ja-JP/channels) を参照してください。

### グループチャットのメンションゲート

グループメッセージはデフォルトで **メンション必須** です（metadata mention または safe regex pattern）。WhatsApp、Telegram、Discord、Google Chat、iMessage のグループチャットに適用されます。

**メンションの種類:**

- **Metadata mentions**: ネイティブなプラットフォームの @-mention。WhatsApp self-chat mode では無視されます。
- **Text patterns**: `agents.list[].groupChat.mentionPatterns` に指定する safe regex pattern。無効な pattern と unsafe nested repetition は無視されます。
- メンションゲートは、検出可能な場合（native mention または少なくとも1つの pattern がある場合）にのみ適用されます。

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

`messages.groupChat.historyLimit` はグローバルデフォルトを設定します。チャネル側では `channels.<channel>.historyLimit`（またはアカウントごと）で上書きできます。`0` にすると無効化されます。

#### DM 履歴上限

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

解決順: DM ごとの上書き → プロバイダーデフォルト → 制限なし（すべて保持）。

対応対象: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### セルフチャットモード

自分の番号を `allowFrom` に含めると self-chat mode が有効になります（ネイティブ @-mention は無視し、text pattern のみに応答します）:

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

- このブロックはコマンドサーフェスを設定します。現在の built-in + bundled コマンドカタログについては [Slash Commands](/ja-JP/tools/slash-commands) を参照してください。
- このページは **設定キーのリファレンス** であり、完全なコマンドカタログではありません。QQ Bot の `/bot-ping` `/bot-help` `/bot-logs`、LINE の `/card`、device-pair の `/pair`、memory の `/dreaming`、phone-control の `/phone`、Talk の `/voice` など、channel/plugin-owned のコマンドは、それぞれの channel/plugin ページと [Slash Commands](/ja-JP/tools/slash-commands) に記載されています。
- テキストコマンドは、先頭に `/` を付けた **単独メッセージ** である必要があります。
- `native: "auto"` は Discord/Telegram でネイティブコマンドを有効にし、Slack では無効のままにします。
- `nativeSkills: "auto"` は Discord/Telegram でネイティブ skill command を有効にし、Slack では無効のままにします。
- チャネルごとの上書き: `channels.discord.commands.native`（bool または `"auto"`）。`false` は以前に登録されたコマンドを消去します。
- ネイティブ skill registration は `channels.<provider>.commands.nativeSkills` でも上書きできます。
- `channels.telegram.customCommands` は Telegram bot menu に追加エントリを加えます。
- `bash: true` はホストシェル用の `! <cmd>` を有効にします（別名: `/bash`）。`tools.elevated.enabled` と、送信者が `tools.elevated.allowFrom.<channel>` に含まれている必要があります。
- `config: true` は `/config` を有効にします（`openclaw.json` の読み書き）。gateway `chat.send` client では、永続的な `/config set|unset` 書き込みには `operator.admin` も必要です。読み取り専用の `/config show` は通常の書き込みスコープを持つ operator client でも利用可能です。
- `mcp: true` は `mcp.servers` 配下の OpenClaw 管理 MCP server config 用に `/mcp` を有効にします。
- `plugins: true` は plugin discovery、install、enable/disable 制御用に `/plugins` を有効にします。
- `channels.<provider>.configWrites` はチャネルごとの config mutation を制御します（デフォルト: true）。
- 複数アカウントチャネルでは、`channels.<provider>.accounts.<id>.configWrites` も、そのアカウントを対象にした書き込み（例: `/allowlist --config --account <id>` または `/config set channels.<provider>.accounts.<id>...`）を制御します。
- `restart: false` は `/restart` と gateway restart tool action を無効にします。デフォルト: `true`。
- `ownerAllowFrom` は owner-only command/tool 用の明示的な owner allowlist です。`allowFrom` とは別です。
- `ownerDisplay: "hash"` は system prompt 内の owner id をハッシュ化します。ハッシュ制御には `ownerDisplaySecret` を設定します。
- `allowFrom` はプロバイダーごとの設定です。これが設定されると、**唯一の** 認可ソースになります（channel allowlist/pairing と `useAccessGroups` は無視されます）。
- `useAccessGroups: false` は、`allowFrom` が未設定のときに、コマンドが access-group policy をバイパスできるようにします。
- コマンド文書マップ:
  - built-in + bundled カタログ: [Slash Commands](/ja-JP/tools/slash-commands)
  - channel-specific command surface: [Channels](/ja-JP/channels)
  - QQ Bot コマンド: [QQ Bot](/ja-JP/channels/qqbot)
  - pairing コマンド: [Pairing](/ja-JP/channels/pairing)
  - LINE card コマンド: [LINE](/ja-JP/channels/line)
  - memory dreaming: [Dreaming](/ja-JP/concepts/dreaming)

</Accordion>

---

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

system prompt の Runtime 行に表示する任意の repository root です。未設定の場合、OpenClaw は workspace から上方向にたどって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` を設定していないエージェント向けの、任意のデフォルト skill allowlist です。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather を継承
      { id: "docs", skills: ["docs-search"] }, // defaults を置き換える
      { id: "locked-down", skills: [] }, // skills なし
    ],
  },
}
```

- `agents.defaults.skills` を省略すると、デフォルトでは unrestricted skills になります。
- `agents.list[].skills` を省略すると、defaults を継承します。
- `agents.list[].skills: []` にすると skills なしになります。
- 空でない `agents.list[].skills` のリストは、そのエージェントの最終セットであり、defaults とはマージされません。

### `agents.defaults.skipBootstrap`

workspace bootstrap file（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）の自動作成を無効にします。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

workspace bootstrap file を system prompt にいつ注入するかを制御します。デフォルト: `"always"`。

- `"continuation-skip"`: 完了済みの assistant response 後の安全な継続ターンでは workspace bootstrap の再注入をスキップし、prompt size を削減します。heartbeat run と compaction 後の retry では引き続き context を再構築します。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

各 workspace bootstrap file の切り詰め前の最大文字数。デフォルト: `20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべての workspace bootstrap file にまたがって注入される総最大文字数。デフォルト: `150000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

bootstrap context が切り詰められたときに agent に見える warning text を制御します。
デフォルト: `"once"`。

- `"off"`: system prompt に warning text を挿入しません。
- `"once"`: 一意の truncation signature ごとに1回だけ warning を挿入します（推奨）。
- `"always"`: truncation が存在するたびに毎回 warning を挿入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

provider call 前に transcript/tool image block で許可する最長辺の最大ピクセルサイズ。
デフォルト: `1200`。

値を小さくすると、通常は vision token 使用量と request payload size が減ります。
値を大きくすると、より多くの視覚的詳細が保持されます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

system prompt context 用の timezone（message timestamp ではありません）。ホストの timezone にフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

system prompt 内の時刻形式。デフォルト: `auto`（OS 設定）。

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
      params: { cacheRetention: "long" }, // global default provider params
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

- `model`: 文字列（`"provider/model"`）または object（`{ primary, fallbacks }`）のどちらかを受け付けます。
  - 文字列形式は primary model のみを設定します。
  - object 形式は primary と順序付き failover model の両方を設定します。
- `imageModel`: 文字列（`"provider/model"`）または object（`{ primary, fallbacks }`）のどちらかを受け付けます。
  - `image` tool path で vision-model config として使われます。
  - 選択済み/デフォルトモデルが image input を受け付けられない場合の fallback routing にも使われます。
- `imageGenerationModel`: 文字列（`"provider/model"`）または object（`{ primary, fallbacks }`）のどちらかを受け付けます。
  - 共有 image-generation capability と、今後 image を生成する tool/plugin surface で使われます。
  - 典型的な値: native Gemini image generation 用の `google/gemini-3.1-flash-image-preview`、fal 用の `fal/fal-ai/flux/dev`、または OpenAI Images 用の `openai/gpt-image-1`。
  - provider/model を直接選ぶ場合は、対応する provider auth/API key も設定してください（例: `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/*` には `OPENAI_API_KEY`、`fal/*` には `FAL_KEY`）。
  - 省略しても、`image_generate` は auth-backed provider default を推定できます。まず現在の default provider を試し、その後、残りの登録済み image-generation provider を provider-id 順に試します。
- `musicGenerationModel`: 文字列（`"provider/model"`）または object（`{ primary, fallbacks }`）のどちらかを受け付けます。
  - 共有 music-generation capability と built-in の `music_generate` tool で使われます。
  - 典型的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、または `minimax/music-2.5+`。
  - 省略しても、`music_generate` は auth-backed provider default を推定できます。まず現在の default provider を試し、その後、残りの登録済み music-generation provider を provider-id 順に試します。
  - provider/model を直接選ぶ場合は、対応する provider auth/API key も設定してください。
- `videoGenerationModel`: 文字列（`"provider/model"`）または object（`{ primary, fallbacks }`）のどちらかを受け付けます。
  - 共有 video-generation capability と built-in の `video_generate` tool で使われます。
  - 典型的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、または `qwen/wan2.7-r2v`。
  - 省略しても、`video_generate` は auth-backed provider default を推定できます。まず現在の default provider を試し、その後、残りの登録済み video-generation provider を provider-id 順に試します。
  - provider/model を直接選ぶ場合は、対応する provider auth/API key も設定してください。
  - bundled の Qwen video-generation provider は現在、最大1本の出力動画、1枚の入力画像、4本の入力動画、10秒の duration、および provider-level の `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートします。
- `pdfModel`: 文字列（`"provider/model"`）または object（`{ primary, fallbacks }`）のどちらかを受け付けます。
  - `pdf` tool の model routing に使用されます。
  - 省略時、PDF tool は `imageModel` にフォールバックし、さらに resolved session/default model にフォールバックします。
- `pdfMaxBytesMb`: `pdf` tool で呼び出し時に `maxBytesMb` が渡されない場合のデフォルト PDF size limit。
- `pdfMaxPages`: `pdf` tool の extraction fallback mode で考慮するデフォルト最大ページ数。
- `verboseDefault`: agent のデフォルト verbose level。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `elevatedDefault`: agent のデフォルト elevated-output level。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は `provider/model`（例: `openai/gpt-5.4`）。provider を省略した場合、OpenClaw はまず alias を試し、次にその正確な model id に一致する一意の configured-provider match を試し、それでもなければ configured default provider にフォールバックします（非推奨の互換動作なので、明示的な `provider/model` を推奨）。その provider が設定済み default model をもう提供していない場合、OpenClaw は古くなった削除済み provider default を表面化する代わりに、最初の configured provider/model にフォールバックします。
- `models`: `/model` 用の configured model catalog と allowlist。各エントリには `alias`（shortcut）と `params`（provider 固有。例: `temperature`、`maxTokens`、`cacheRetention`、`context1m`）を含められます。
- `params`: すべての model に適用されるグローバルな default provider parameter。`agents.defaults.params` で設定します（例: `{ cacheRetention: "long" }`）。
- `params` のマージ優先順位（config）: `agents.defaults.params`（グローバルベース）を `agents.defaults.models["provider/model"].params`（model ごと）が上書きし、その後 `agents.list[].params`（一致する agent id）がキー単位で上書きします。詳細は [Prompt Caching](/ja-JP/reference/prompt-caching) を参照してください。
- これらのフィールドを変更する config writer（例: `/models set`、`/models set-image`、fallback add/remove command）は、可能な限り既存の fallback list を保持しつつ、正規の object form で保存します。
- `maxConcurrent`: session 間で並列に実行できる agent run の最大数（各 session は引き続き逐次処理）。デフォルト: 4。

**組み込みの alias shorthand**（model が `agents.defaults.models` にある場合のみ適用）:

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

設定した alias は常にデフォルトより優先されます。

Z.AI GLM-4.x model は、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、自動的に thinking mode を有効にします。
Z.AI model は、tool call streaming 用にデフォルトで `tool_stream` を有効にします。無効化するには `agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定してください。
Anthropic Claude 4.6 model は、明示的な thinking level が設定されていない場合、デフォルトで `adaptive` thinking を使用します。

### `agents.defaults.cliBackends`

テキスト専用の fallback run（tool call なし）向けの任意の CLI backend です。API provider が失敗したときのバックアップとして役立ちます。

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

- CLI backend は text-first で、tools は常に無効です。
- `sessionArg` を設定すると session がサポートされます。
- `imageArg` が file path を受け付ける場合、image pass-through がサポートされます。

### `agents.defaults.heartbeat`

定期的な heartbeat run。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`: duration string（ms/s/m/h）。デフォルト: `30m`（API-key auth）または `1h`（OAuth auth）。`0m` にすると無効化されます。
- `suppressToolErrorWarnings`: true の場合、heartbeat run 中の tool error warning payload を抑制します。
- `directPolicy`: direct/DM 配信ポリシー。`allow`（デフォルト）は direct-target delivery を許可します。`block` は direct-target delivery を抑止し、`reason=dm-blocked` を出力します。
- `lightContext`: true の場合、heartbeat run は軽量 bootstrap context を使い、workspace bootstrap file から `HEARTBEAT.md` のみを保持します。
- `isolatedSession`: true の場合、各 heartbeat run は会話履歴を持たない fresh session で実行されます。cron の `sessionTarget: "isolated"` と同じ isolation pattern です。heartbeat あたりの token cost を約100Kから約2-5K token に削減します。
- エージェント単位では `agents.list[].heartbeat` を設定します。いずれかの agent が `heartbeat` を定義すると、heartbeat を実行するのは **その agent だけ** になります。
- heartbeat は完全な agent turn を実行するため、間隔を短くすると token 消費が増えます。

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
        notifyUser: true, // send a brief notice when compaction starts (default: false)
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

- `mode`: `default` または `safeguard`（長い履歴向けの chunked summarization）。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `provider`: 登録済みの compaction provider plugin の id。設定されている場合、built-in の LLM summarization の代わりに provider の `summarize()` が呼ばれます。失敗時は built-in にフォールバックします。provider を設定すると `mode: "safeguard"` が強制されます。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `timeoutSeconds`: 1回の compaction operation に OpenClaw が許容する最大秒数。デフォルト: `900`。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` は compaction summarization 時に opaque identifier 保持のための組み込みガイダンスを前置します。
- `identifierInstructions`: `identifierPolicy=custom` のときに使用する任意の custom identifier-preservation text。
- `postCompactionSections`: compaction 後に再注入する AGENTS.md の H2/H3 セクション名の任意リスト。デフォルトは `["Session Startup", "Red Lines"]`。`[]` で再注入を無効化します。未設定または明示的にこのデフォルトペアが設定されている場合、旧来の `Every Session`/`Safety` 見出しも legacy fallback として受け入れられます。
- `model`: compaction summarization のみに使う任意の `provider/model-id` override。メイン session では1つの model を維持しつつ、compaction summary は別の model で実行したい場合に使います。未設定の場合、compaction は session の primary model を使います。
- `notifyUser`: `true` の場合、compaction 開始時にユーザーへ短い通知（例: 「Compacting context...」）を送信します。デフォルトでは無効で、compaction を静かに保ちます。
- `memoryFlush`: 自動 compaction 前に durable memory を保存するための silent agentic turn。workspace が read-only の場合はスキップされます。

### `agents.defaults.contextPruning`

LLM に送信する前に、メモリ内 context から **古い tool result** を剪定します。ディスク上の session history は **変更しません**。

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

- `mode: "cache-ttl"` で pruning pass を有効にします。
- `ttl` は、最後の cache touch 後に pruning を再実行できる頻度を制御します。
- Pruning はまず oversized な tool result を soft-trim し、その後必要に応じて古い tool result を hard-clear します。

**Soft-trim** は先頭と末尾を保持し、中間に `...` を挿入します。

**Hard-clear** は tool result 全体を placeholder に置き換えます。

注意:

- image block は一切 trim/clear されません。
- ratio は token 数ではなく文字数ベースの概算です。
- `keepLastAssistants` より少ない assistant message しか存在しない場合、pruning はスキップされます。

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

- Telegram 以外のチャネルでは、ブロック返信を有効にするには明示的な `*.blockStreaming: true` が必要です。
- チャネルごとの上書き: `channels.<channel>.blockStreamingCoalesce`（およびアカウントごとの variants）。Signal/Slack/Discord/Google Chat のデフォルトは `minChars: 1500` です。
- `humanDelay`: ブロック返信間のランダムな待機時間。`natural` = 800–2500ms。エージェント単位の上書き: `agents.list[].humanDelay`。

動作と chunking の詳細は [Streaming](/ja-JP/concepts/streaming) を参照してください。

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

- デフォルト: ダイレクトチャット/メンションでは `instant`、メンションされていないグループチャットでは `message`。
- セッションごとの上書き: `session.typingMode`、`session.typingIntervalSeconds`。

[Typing Indicators](/ja-JP/concepts/typing-indicators) を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

embedded agent 向けの任意の sandboxing。完全なガイドは [Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。

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

<Accordion title="Sandbox の詳細">

**Backend:**

- `docker`: ローカル Docker runtime（デフォルト）
- `ssh`: 汎用 SSH-backed remote runtime
- `openshell`: OpenShell runtime

`backend: "openshell"` を選択した場合、runtime 固有の設定は
`plugins.entries.openshell.config` に移動します。

**SSH backend config:**

- `target`: `user@host[:port]` 形式の SSH target
- `command`: SSH client command（デフォルト: `ssh`）
- `workspaceRoot`: scope ごとの workspace に使う absolute remote root
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH に渡す既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw が runtime 時に temp file に実体化する inline content または SecretRef
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH の host-key policy knob

**SSH auth の優先順位:**

- `identityData` は `identityFile` より優先
- `certificateData` は `certificateFile` より優先
- `knownHostsData` は `knownHostsFile` より優先
- SecretRef-backed の `*Data` 値は、sandbox session 開始前に active secrets runtime snapshot から解決されます

**SSH backend の動作:**

- create または recreate 後に remote workspace を1回 seed する
- その後は remote SSH workspace を正とする
- `exec`、file tool、media path を SSH 経由でルーティングする
- remote change を host に自動同期しない
- sandbox browser container はサポートしない

**Workspace access:**

- `none`: `~/.openclaw/sandboxes` 配下の scope ごとの sandbox workspace
- `ro`: sandbox workspace は `/workspace`、agent workspace は `/agent` に read-only で mount
- `rw`: agent workspace を `/workspace` に read/write で mount

**Scope:**

- `session`: セッションごとの container + workspace
- `agent`: agent ごとに1つの container + workspace（デフォルト）
- `shared`: shared container と workspace（セッション間分離なし）

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

**OpenShell mode:**

- `mirror`: exec 前に local から remote に seed し、exec 後に sync back。local workspace が正になります
- `remote`: sandbox 作成時に一度だけ remote を seed し、その後は remote workspace を正にします

`remote` mode では、seed step 後に OpenClaw 外で行った host-local edit は sandbox に自動同期されません。
転送は OpenShell sandbox への SSH ですが、sandbox lifecycle と任意の mirror sync は plugin が管理します。

**`setupCommand`** は container 作成後に1回だけ実行されます（`sh -lc` 経由）。network egress、writable root、root user が必要です。

**Container のデフォルトは `network: "none"`** です — agent に outbound access が必要な場合は `"bridge"`（または custom bridge network）に設定してください。
`"host"` はブロックされます。`"container:<id>"` もデフォルトではブロックされ、明示的に
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（緊急用）を設定した場合のみ許可されます。

**受信添付ファイル** は、アクティブ workspace の `media/inbound/*` に stage されます。

**`docker.binds`** は追加の host directory を mount します。global と per-agent の bind はマージされます。

**Sandboxed browser**（`sandbox.browser.enabled`）: container 内の Chromium + CDP。noVNC URL が system prompt に注入されます。`openclaw.json` で `browser.enabled` を必要としません。
noVNC observer access はデフォルトで VNC auth を使用し、OpenClaw は共有 URL に password を露出する代わりに短命 token URL を発行します。

- `allowHostControl: false`（デフォルト）は sandboxed session から host browser をターゲットにすることをブロックします。
- `network` のデフォルトは `openclaw-sandbox-browser`（専用 bridge network）です。グローバル bridge connectivity が明示的に必要な場合にのみ `bridge` に設定してください。
- `cdpSourceRange` は、container edge での CDP ingress を CIDR range（例: `172.21.0.1/32`）に制限できます。
- `sandbox.browser.binds` は追加の host directory を sandbox browser container のみに mount します。設定されると（`[]` を含む）、browser container では `docker.binds` を置き換えます。
- 起動デフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義され、container host 向けに調整されています:
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
  - `--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu` はデフォルトで有効で、WebGL/3D 利用で必要な場合は `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効化できます。
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で、workflow が依存する場合に extension を再有効化できます。
  - `--renderer-process-limit=2` は `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で変更できます。Chromium のデフォルト process limit を使うには `0` を指定してください。
  - さらに `noSandbox` が有効な場合は `--no-sandbox` と `--disable-setuid-sandbox`。
  - これらのデフォルトは container image の baseline です。container default を変更するには、custom entrypoint を持つ custom browser image を使用してください。

</Accordion>

browser sandboxing と `sandbox.docker.binds` は現在 Docker 専用です。

image のビルド:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list`（エージェントごとの上書き）

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

- `id`: 安定した agent id（必須）。
- `default`: 複数設定された場合は最初のものが優先されます（warning を出力）。どれも設定されていない場合は、list の先頭エントリが default になります。
- `model`: 文字列形式は `primary` のみを上書きし、object 形式 `{ primary, fallbacks }` は両方を上書きします（`[]` は global fallback を無効化）。`primary` だけを上書きする cron job は、`fallbacks: []` を設定しない限り default fallback を継承します。
- `params`: 選択された `agents.defaults.models` 内の model entry に対してマージされる per-agent stream params。`cacheRetention`、`temperature`、`maxTokens` のような agent 固有の上書きに使い、model catalog 全体を複製しないようにします。
- `skills`: 任意の per-agent skill allowlist。省略すると、設定済みであれば `agents.defaults.skills` を継承します。明示的な list は defaults をマージせず置き換え、`[]` は skills なしを意味します。
- `thinkingDefault`: 任意の per-agent デフォルト thinking level（`off | minimal | low | medium | high | xhigh | adaptive`）。per-message または session override がない場合、この agent に対して `agents.defaults.thinkingDefault` を上書きします。
- `reasoningDefault`: 任意の per-agent デフォルト reasoning visibility（`on | off | stream`）。per-message または session reasoning override がない場合に適用されます。
- `fastModeDefault`: 任意の per-agent デフォルト fast mode（`true | false`）。per-message または session fast-mode override がない場合に適用されます。
- `runtime`: 任意の per-agent runtime descriptor。agent のデフォルトを ACP harness session にしたい場合は、`type: "acp"` と `runtime.acp` default（`agent`、`backend`、`mode`、`cwd`）を使用します。
- `identity.avatar`: workspace-relative path、`http(s)` URL、または `data:` URI。
- `identity` は default を導出します: `emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns`。
- `subagents.allowAgents`: `sessions_spawn` 用の agent id allowlist（`["*"]` = 任意、デフォルト: 同じ agent のみ）。
- Sandbox inheritance guard: リクエスター session が sandboxed の場合、`sessions_spawn` は unsandboxed で実行される target を拒否します。
- `subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` call をブロックします（明示的な profile selection を強制。デフォルト: false）。

---

## 複数エージェントルーティング

1つの Gateway 内で複数の分離された agent を実行します。[Multi-Agent](/ja-JP/concepts/multi-agent) を参照してください。

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

### Binding の match field

- `type`（任意）: 通常ルーティング用の `route`（type がない場合のデフォルト）、永続 ACP conversation binding 用の `acp`
- `match.channel`（必須）
- `match.accountId`（任意。`*` = 任意の account、省略 = default account）
- `match.peer`（任意。`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（任意。チャネル固有）
- `acp`（任意。`type: "acp"` の場合のみ）: `{ mode, label, cwd, backend }`

**決定的な match 順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（完全一致、peer/guild/team なし）
5. `match.accountId: "*"`（チャネル全体）
6. Default agent

同じ tier 内では、最初に一致した `bindings` エントリが優先されます。

`type: "acp"` エントリについては、OpenClaw は正確な conversation identity（`match.channel` + account + `match.peer.id`）で解決し、上記の route binding tier 順序は使用しません。

### エージェントごとのアクセスプロファイル

<Accordion title="フルアクセス（sandbox なし）">

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

<Accordion title="読み取り専用ツール + workspace">

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

<Accordion title="セッションフィールドの詳細">

- **`scope`**: グループチャット context の基本 session grouping strategy。
  - `per-sender`（デフォルト）: チャネル context 内で送信者ごとに分離された session を持ちます。
  - `global`: チャネル context 内の全参加者が1つの session を共有します（shared context を意図する場合のみ使用）。
- **`dmScope`**: DM のグルーピング方法。
  - `main`: すべての DM が main session を共有します。
  - `per-peer`: チャネルをまたいで sender id ごとに分離します。
  - `per-channel-peer`: チャネル + sender ごとに分離します（複数ユーザー inbox に推奨）。
  - `per-account-channel-peer`: account + channel + sender ごとに分離します（複数アカウントに推奨）。
- **`identityLinks`**: cross-channel session 共有のための canonical id から provider-prefixed peer へのマップ。
- **`reset`**: 主 reset policy。`daily` はローカル時刻の `atHour` に reset し、`idle` は `idleMinutes` 経過後に reset します。両方が設定されている場合、先に期限切れになる方が優先されます。
- **`resetByType`**: type ごとの override（`direct`、`group`、`thread`）。旧来の `dm` は `direct` の alias として受け付けます。
- **`parentForkMaxTokens`**: fork された thread session を作成するときに許容する parent session `totalTokens` の最大値（デフォルト `100000`）。
  - parent の `totalTokens` がこの値を超える場合、OpenClaw は parent transcript history を継承せず、新しい thread session を開始します。
  - `0` にするとこのガードを無効化し、常に parent fork を許可します。
- **`mainKey`**: 旧来のフィールド。runtime は現在、main direct-chat bucket に常に `"main"` を使用します。
- **`agentToAgent.maxPingPongTurns`**: agent-to-agent exchange 中の agent 間 reply-back turn 最大数（整数、範囲: `0`–`5`）。`0` は ping-pong chaining を無効にします。
- **`sendPolicy`**: `channel`、`chatType`（`direct|group|channel`、旧来の `dm` alias も可）、`keyPrefix`、または `rawKeyPrefix` で match します。最初の deny が優先されます。
- **`maintenance`**: session-store cleanup + retention control。
  - `mode`: `warn` は warning のみを出し、`enforce` は cleanup を適用します。
  - `pruneAfter`: 古い entry の age cutoff（デフォルト `30d`）。
  - `maxEntries`: `sessions.json` 内の最大 entry 数（デフォルト `500`）。
  - `rotateBytes`: `sessions.json` がこのサイズを超えたときに rotate します（デフォルト `10mb`）。
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcript archive の保持期間。デフォルトは `pruneAfter` です。無効化するには `false` を設定します。
  - `maxDiskBytes`: 任意の sessions-directory disk budget。`warn` mode では warning を記録し、`enforce` mode では最古の artifact/session から先に削除します。
  - `highWaterBytes`: budget cleanup 後の目標値。デフォルトは `maxDiskBytes` の `80%` です。
- **`threadBindings`**: スレッドバインド session 機能のグローバルデフォルト。
  - `enabled`: master default switch（provider 側で上書き可能。Discord は `channels.discord.threadBindings.enabled` を使用）
  - `idleHours`: 非アクティブ時の自動 unfocus のデフォルト時間（`0` で無効。provider 側で上書き可能）
  - `maxAgeHours`: ハード最大寿命のデフォルト時間（`0` で無効。provider 側で上書き可能）

</Accordion>

---

## メッセージ

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

チャネル/アカウントごとの上書き: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決順（より具体的なものが優先）: account → channel → global。`""` は無効化し、cascade も停止します。`"auto"` は `[{identity.name}]` を導出します。

**テンプレート変数:**

| 変数              | 説明                   | 例                          |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | 短いモデル名           | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子     | `anthropic/claude-opus-4-6` |
| `{provider}`      | プロバイダー名         | `anthropic`                 |
| `{thinkingLevel}` | 現在の thinking level  | `high`, `low`, `off`        |
| `{identity.name}` | agent identity 名      | （`"auto"` と同じ）         |

変数は大文字小文字を区別しません。`{think}` は `{thinkingLevel}` の alias です。

### Ack reaction

- デフォルトはアクティブ agent の `identity.emoji`、なければ `"👀"`。`""` にすると無効化されます。
- チャネルごとの上書き: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順: account → channel → `messages.ackReaction` → identity fallback。
- Scope: `group-mentions`（デフォルト）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: Slack、Discord、Telegram で reply 後に ack を削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Telegram で lifecycle status reaction を有効にします。
  Slack と Discord では、未設定の場合、ack reaction が有効なら status reaction も有効のままになります。
  Telegram では、lifecycle status reaction を有効にするには明示的に `true` を設定してください。

### Inbound debounce

同一送信者からの連続する text-only message を1つの agent turn にまとめます。media/attachment は即時 flush されます。control command は debounce をバイパスします。

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

- `auto` はデフォルトの auto-TTS mode を制御します: `off`、`always`、`inbound`、または `tagged`。`/tts on|off` はローカル設定を上書きでき、`/tts status` は実効状態を表示します。
- `summaryModel` は auto-summary 用に `agents.defaults.model.primary` を上書きします。
- `modelOverrides` はデフォルトで有効です。`modelOverrides.allowProvider` のデフォルトは `false`（明示的 opt-in）です。
- API key は `ELEVENLABS_API_KEY`/`XI_API_KEY` および `OPENAI_API_KEY` にフォールバックします。
- `openai.baseUrl` は OpenAI TTS endpoint を上書きします。解決順は config、次に `OPENAI_TTS_BASE_URL`、その後 `https://api.openai.com/v1` です。
- `openai.baseUrl` が OpenAI 以外の endpoint を指す場合、OpenClaw はそれを OpenAI-compatible TTS server として扱い、model/voice validation を緩和します。

---

## Talk

Talk mode（macOS/iOS/Android）のデフォルト。

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

- `talk.provider` は、複数の Talk provider を設定している場合、`talk.providers` 内のキーと一致している必要があります。
- 旧来のフラットな Talk key（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）は互換用のみで、自動的に `talk.providers.<provider>` に移行されます。
- Voice ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `providers.*.apiKey` はプレーンテキスト文字列または SecretRef object を受け付けます。
- `ELEVENLABS_API_KEY` のフォールバックは、Talk API key が設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases` により、Talk directive で friendly name を使用できます。
- `silenceTimeoutMs` は、ユーザーの無音後に transcript を送信するまで Talk mode が待機する時間を制御します。未設定の場合、プラットフォームのデフォルト pause window（`macOS と Android では 700 ms、iOS では 900 ms`）が使われます。

---

## ツール

### Tool profile

`tools.profile` は `tools.allow`/`tools.deny` より前に基礎となる allowlist を設定します:

ローカル onboarding では、未設定の新規ローカル config に対して `tools.profile: "coding"` をデフォルト設定します（既存の明示的 profile は保持されます）。

| Profile     | 含まれるもの                                                                                                                |
| ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` のみ                                                                                                       |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                  |
| `full`      | 制限なし（未設定と同じ）                                                                                                    |

### Tool group

| Group              | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution`（`bash` は `exec` の alias として受け付けられます）                               |
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
| `group:openclaw`   | すべての built-in tool（provider plugin は除く）                                                                        |

### `tools.allow` / `tools.deny`

グローバルな tool allow/deny policy（deny が優先）。大文字小文字を区別せず、`*` wildcard をサポートします。Docker sandbox が off でも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

特定の provider または model に対してさらに tool を制限します。順序: base profile → provider profile → allow/deny。

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

sandbox 外での elevated exec access を制御します:

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

- エージェントごとの上書き（`agents.list[].tools.elevated`）は、さらに制限することしかできません。
- `/elevated on|off|ask|full` は state を session ごとに保存します。inline directive は単一メッセージに適用されます。
- Elevated `exec` は sandboxing をバイパスし、設定された escape path（デフォルトは `gateway`、exec target が `node` の場合は `node`）を使います。

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

tool-loop の安全チェックは **デフォルトで無効** です。有効化するには `enabled: true` を設定します。
設定はグローバルに `tools.loopDetection` で定義でき、agent ごとに `agents.list[].tools.loopDetection` で上書きできます。

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

- `historySize`: loop analysis 用に保持する tool-call history の最大数。
- `warningThreshold`: warning を出す no-progress pattern の繰り返し閾値。
- `criticalThreshold`: critical loop をブロックするための、より高い繰り返し閾値。
- `globalCircuitBreakerThreshold`: あらゆる no-progress run を止める hard stop 閾値。
- `detectors.genericRepeat`: 同じ tool/同じ args の繰り返し call に対して warning。
- `detectors.knownPollNoProgress`: 既知の poll tool（`process.poll`、`command_status` など）の no-progress に対して warning/block。
- `detectors.pingPong`: 交互に繰り返す no-progress pair pattern に対して warning/block。
- `warningThreshold >= criticalThreshold` または `criticalThreshold >= globalCircuitBreakerThreshold` の場合、validation は失敗します。

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

受信メディア理解（image/audio/video）を設定します:

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

<Accordion title="Media model entry field">

**Provider entry**（`type: "provider"` または省略時）:

- `provider`: API provider id（`openai`、`anthropic`、`google`/`gemini`、`groq` など）
- `model`: model id override
- `profile` / `preferredProfile`: `auth-profiles.json` の profile selection

**CLI entry**（`type: "cli"`）:

- `command`: 実行する executable
- `args`: テンプレート化された args（`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポート）

**共通 field:**

- `capabilities`: 任意の list（`image`、`audio`、`video`）。デフォルト: `openai`/`anthropic`/`minimax` → image、`google` → image+audio+video、`groq` → audio。
- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: entry ごとの上書き。
- 失敗した場合は次の entry にフォールバックします。

Provider auth は標準順序に従います: `auth-profiles.json` → env vars → `models.providers.*.apiKey`。

**Async completion field:**

- `asyncCompletion.directSend`: `true` の場合、完了した非同期 `music_generate`
  と `video_generate` task は、まず direct channel delivery を試みます。デフォルト: `false`
  （旧来の requester-session wake/model-delivery path）。

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

session tool（`sessions_list`、`sessions_history`、`sessions_send`）がどの session を対象にできるかを制御します。

デフォルト: `tree`（現在の session + そこから spawn された session、つまり subagent など）。

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

- `self`: 現在の session key のみ。
- `tree`: 現在の session + 現在の session から spawn された session（subagent）。
- `agent`: 現在の agent id に属する任意の session（同じ agent id 配下で per-sender session を運用している場合、他ユーザーも含まれることがあります）。
- `all`: 任意の session。cross-agent targeting には引き続き `tools.agentToAgent` が必要です。
- Sandbox clamp: 現在の session が sandboxed で `agents.defaults.sandbox.sessionToolsVisibility="spawned"` の場合、`tools.sessions.visibility="all"` であっても visibility は `tree` に強制されます。

### `tools.sessions_spawn`

`sessions_spawn` の inline attachment support を制御します。

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

- Attachment は `runtime: "subagent"` でのみサポートされます。ACP runtime では拒否されます。
- File は child workspace の `.openclaw/attachments/<uuid>/` に `.manifest.json` とともに実体化されます。
- Attachment content は transcript persistence から自動的に redact されます。
- Base64 input は strict alphabet/padding check と pre-decode size guard で検証されます。
- File permission は directory が `0700`、file が `0600` です。
- Cleanup は `cleanup` policy に従います: `delete` は常に attachment を削除し、`keep` は `retainOnSessionKeep: true` の場合のみ保持します。

### `tools.experimental`

実験的な built-in tool flag。runtime 固有の auto-enable rule が適用される場合を除き、デフォルトは off です。

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

- `planTool`: 自明でない複数ステップ作業の追跡用に、構造化された `update_plan` tool を有効にします。
- デフォルト: 非 OpenAI provider では `false`。OpenAI と OpenAI Codex run では未設定時に自動で有効になります。自動有効化を無効にするには `false` を設定してください。
- 有効時、system prompt にも usage guidance が追加され、model は substantial work のみにこれを使い、`in_progress` の step は常に1つまでに保つようになります。

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

- `model`: spawn された sub-agent 用のデフォルト model。省略すると、sub-agent は caller の model を継承します。
- `allowAgents`: requester agent が自分の `subagents.allowAgents` を設定していない場合に `sessions_spawn` 用の target agent id に使うデフォルト allowlist（`["*"]` = 任意、デフォルト: 同じ agent のみ）。
- `runTimeoutSeconds`: tool call が `runTimeoutSeconds` を省略したときに `sessions_spawn` へ適用されるデフォルト timeout（秒）。`0` は timeout なしを意味します。
- subagent ごとの tool policy: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタムプロバイダーと base URL

OpenClaw は built-in model catalog を使用します。カスタム provider は config 内の `models.providers`、または `~/.openclaw/agents/<agentId>/agent/models.json` で追加します。

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

- カスタム auth 要件には `authHeader: true` + `headers` を使います。
- agent config root は `OPENCLAW_AGENT_DIR`（または旧来の環境変数 alias である `PI_CODING_AGENT_DIR`）で上書きできます。
- 一致する provider ID のマージ優先順位:
  - 空でない agent `models.json` の `baseUrl` が優先されます。
  - 空でない agent の `apiKey` は、その provider が現在の config/auth-profile context で SecretRef-managed でない場合にのみ優先されます。
  - SecretRef-managed provider の `apiKey` 値は、解決済み secret を永続化するのではなく、source marker（env ref には `ENV_VAR_NAME`、file/exec ref には `secretref-managed`）から再取得されます。
  - SecretRef-managed provider の header 値も source marker（env ref には `secretref-env:ENV_VAR_NAME`、file/exec ref には `secretref-managed`）から再取得されます。
  - agent の `apiKey`/`baseUrl` が空または欠落している場合は、config の `models.providers` にフォールバックします。
  - 一致する model の `contextWindow`/`maxTokens` は、明示的 config と implicit catalog 値のうち大きい方を使用します。
  - 一致する model の `contextTokens` は、明示的な runtime cap がある場合それを保持します。native model metadata を変えずに有効 context を制限したいときに使用してください。
  - config で `models.json` を完全に書き換えたい場合は `models.mode: "replace"` を使用します。
  - marker persistence は source-authoritative です: marker は、解決済み runtime secret 値ではなく、active source config snapshot（pre-resolution）から書き込まれます。

### Provider field の詳細

- `models.mode`: provider catalog behavior（`merge` または `replace`）。
- `models.providers`: provider id をキーにした custom provider map。
- `models.providers.*.api`: request adapter（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` など）。
- `models.providers.*.apiKey`: provider credential（SecretRef/env substitution の使用を推奨）。
- `models.providers.*.auth`: auth strategy（`api-key`、`token`、`oauth`、`aws-sdk`）。
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` 用に、request に `options.num_ctx` を注入します（デフォルト: `true`）。
- `models.providers.*.authHeader`: 必要に応じて credential を `Authorization` header で送るよう強制します。
- `models.providers.*.baseUrl`: upstream API base URL。
- `models.providers.*.headers`: proxy/tenant routing 用の追加 static header。
- `models.providers.*.request`: model-provider HTTP request 用の transport override。
  - `request.headers`: 追加 header（provider default とマージ）。値は SecretRef を受け付けます。
  - `request.auth`: auth strategy override。mode: `"provider-default"`（provider 組み込み auth を使用）、`"authorization-bearer"`（`token` を使用）、`"header"`（`headerName`、`value`、任意の `prefix` を使用）。
  - `request.proxy`: HTTP proxy override。mode: `"env-proxy"`（`HTTP_PROXY`/`HTTPS_PROXY` env var を使用）、`"explicit-proxy"`（`url` を使用）。両 mode とも任意の `tls` sub-object を受け付けます。
  - `request.tls`: direct connection 用の TLS override。field: `ca`、`cert`、`key`、`passphrase`（すべて SecretRef 可）、`serverName`、`insecureSkipVerify`。
- `models.providers.*.models`: 明示的な provider model catalog entry。
- `models.providers.*.models.*.contextWindow`: native model context window metadata。
- `models.providers.*.models.*.contextTokens`: 任意の runtime context cap。model の native `contextWindow` より小さい有効 context budget を使いたいときに使用します。
- `models.providers.*.models.*.compat.supportsDeveloperRole`: 任意の compatibility hint。`api: "openai-completions"` かつ非空の non-native `baseUrl`（host が `api.openai.com` ではない）の場合、OpenClaw は実行時にこれを `false` に強制します。`baseUrl` が空または省略の場合はデフォルトの OpenAI behavior を維持します。
- `models.providers.*.models.*.compat.requiresStringContent`: string-only な OpenAI-compatible chat endpoint 用の任意の compatibility hint。`true` の場合、OpenClaw は request 送信前に、純粋な text の `messages[].content` array を plain string に flatten します。
- `plugins.entries.amazon-bedrock.config.discovery`: Bedrock auto-discovery setting root。
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: implicit discovery のオン/オフ。
- `plugins.entries.amazon-bedrock.config.discovery.region`: discovery 用 AWS region。
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: targeted discovery 用の任意の provider-id filter。
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: discovery refresh の polling interval。
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: discovered model 用の fallback context window。
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: discovered model 用の fallback max output token。

### Provider の例

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

Cerebras には `cerebras/zai-glm-4.7` を使用してください。Z.AI direct には `zai/glm-4.7` を使用します。

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

`OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）を設定します。Zen catalog には `opencode/...` ref、Go catalog には `opencode-go/...` ref を使います。shortcut: `openclaw onboard --auth-choice opencode-zen` または `openclaw onboard --auth-choice opencode-go`。

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

`ZAI_API_KEY` を設定します。`z.ai/*` と `z-ai/*` は受け付けられる alias です。shortcut: `openclaw onboard --auth-choice zai-api-key`。

- General endpoint: `https://api.z.ai/api/paas/v4`
- Coding endpoint（デフォルト）: `https://api.z.ai/api/coding/paas/v4`
- General endpoint を使う場合は、base URL override を持つ custom provider を定義してください。

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

China endpoint 用には `baseUrl: "https://api.moonshot.cn/v1"` または `openclaw onboard --auth-choice moonshot-api-key-cn` を使用してください。

ネイティブ Moonshot endpoint は、共有 `openai-completions` transport 上で streaming usage compatibility をアドバタイズし、OpenClaw は現在、それを built-in provider id 単体ではなく endpoint capability に基づいて判定します。

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

Anthropic-compatible の built-in provider です。shortcut: `openclaw onboard --auth-choice kimi-code-api-key`。

</Accordion>

<Accordion title="Synthetic（Anthropic-compatible）">

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

Base URL には `/v1` を含めないでください（Anthropic client が付加します）。shortcut: `openclaw onboard --auth-choice synthetic-api-key`。

</Accordion>

<Accordion title="MiniMax M2.7（direct）">

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

`MINIMAX_API_KEY` を設定します。shortcut:
`openclaw onboard --auth-choice minimax-global-api` または
`openclaw onboard --auth-choice minimax-cn-api`。
model catalog のデフォルトは現在 M2.7 のみです。
Anthropic-compatible streaming path では、明示的に `thinking` を設定しない限り、OpenClaw はデフォルトで MiniMax thinking を無効にします。`/fast on` または `params.fastMode: true` は
`MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。

</Accordion>

<Accordion title="ローカルモデル（LM Studio）">

[Local Models](/ja-JP/gateway/local-models) を参照してください。要点: 十分なハードウェアで LM Studio Responses API を通じて大規模ローカル model を実行し、fallback 用に hosted model は merged のままにしておきます。

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

- `allowBundled`: bundled skills のみを対象にする任意の allowlist（managed/workspace skills には影響しません）。
- `load.extraDirs`: 追加の shared skill root（最も低い優先順位）。
- `install.preferBrew`: `true` の場合、`brew` が利用可能であれば他の installer kind にフォールバックする前に Homebrew installer を優先します。
- `install.nodeManager`: `metadata.openclaw.install` spec 用の node installer preference（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false` は、bundled/installed されていてもその skill を無効化します。
- `entries.<skillKey>.apiKey`: primary env var を宣言する skill 向けの簡易 API key field（plugin がサポートしている場合）。

---

## プラグイン

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

- `~/.openclaw/extensions`、