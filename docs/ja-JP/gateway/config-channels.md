---
read_when:
    - チャネルPluginの設定（認証、アクセス制御、複数アカウント）
    - チャネルごとの設定キーのトラブルシューティング
    - DM ポリシー、グループポリシー、またはメンション制御の監査
summary: 'チャネル設定: Slack、Discord、Telegram、WhatsApp、Matrix、iMessage などにわたるアクセス制御、ペアリング、チャネルごとのキー'
title: 設定 — チャンネル
x-i18n:
    generated_at: "2026-05-04T04:59:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57dcc0b5148324ea6fdee51b7b6e97ec7bd7dc3ca89518ab0816fe4172feefbc
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` 配下のチャンネルごとの設定キー。Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、およびその他のバンドル済みチャンネル Plugin に対する、DM とグループアクセス、複数アカウント構成、メンション制御、チャンネルごとのキーを扱います。

エージェント、ツール、Gateway ランタイム、その他のトップレベルキーについては、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## チャンネル

各チャンネルは、その設定セクションが存在すると自動的に起動します（`enabled: false` の場合を除く）。

### DM とグループアクセス

すべてのチャンネルは DM ポリシーとグループポリシーをサポートします。

| DM ポリシー          | 動作                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (default) | 未知の送信者には 1 回限りのペアリングコードが渡され、所有者の承認が必要 |
| `allowlist`         | `allowFrom` 内の送信者（またはペアリング済み許可ストア）のみ     |
| `open`              | すべての受信 DM を許可（`allowFrom: ["*"]` が必要）             |
| `disabled`          | すべての受信 DM を無視                                          |

| グループポリシー     | 動作                                                     |
| --------------------- | -------------------------------------------------------- |
| `allowlist` (default) | 設定された許可リストに一致するグループのみ               |
| `open`                | グループ許可リストをバイパス（メンション制御は引き続き適用） |
| `disabled`            | すべてのグループ/ルームメッセージをブロック              |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が未設定の場合のデフォルトを設定します。
ペアリングコードは 1 時間後に期限切れになります。保留中の DM ペアリングリクエストは **チャンネルごとに 3 件**までに制限されます。
プロバイダーブロック全体が存在しない場合（`channels.<provider>` がない場合）、ランタイムのグループポリシーは起動時の警告とともに `allowlist`（fail-closed）へフォールバックします。
</Note>

### チャンネルモデルのオーバーライド

`channels.modelByChannel` を使用して、特定のチャンネル ID をモデルに固定します。値には `provider/model` または設定済みモデルエイリアスを指定できます。このチャンネルマッピングは、セッションにモデルのオーバーライドがまだない場合（たとえば `/model` で設定されている場合など）に適用されます。

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

`channels.defaults` を使用して、プロバイダー間で共有されるグループポリシーと Heartbeat の動作を設定します。

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

- `channels.defaults.groupPolicy`: プロバイダーレベルの `groupPolicy` が未設定の場合のフォールバック用グループポリシー。
- `channels.defaults.contextVisibility`: すべてのチャンネルのデフォルト補足コンテキスト表示モード。値: `all`（デフォルト、引用/スレッド/履歴コンテキストをすべて含める）、`allowlist`（許可リストに含まれる送信者からのコンテキストのみ含める）、`allowlist_quote`（allowlist と同じだが、明示的な引用/返信コンテキストは保持）。チャンネルごとのオーバーライド: `channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`: Heartbeat 出力に正常なチャンネルステータスを含めます。
- `channels.defaults.heartbeat.showAlerts`: Heartbeat 出力に劣化/エラーステータスを含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケーター形式の Heartbeat 出力を表示します。

### WhatsApp

WhatsApp は Gateway の Web チャンネル（Baileys Web）経由で実行されます。リンク済みセッションが存在すると自動的に起動します。

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

- 送信コマンドは、存在する場合はアカウント `default` に既定で送られます。存在しない場合は、設定済みアカウント ID のうち最初のもの（ソート済み）が使われます。
- 任意の `channels.whatsapp.defaultAccount` は、設定済みアカウント ID と一致する場合に、そのフォールバックのデフォルトアカウント選択を上書きします。
- 従来の単一アカウント Baileys auth dir は、`openclaw doctor` によって `whatsapp/default` へ移行されます。
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
- `apiRoot` は Telegram Bot API ルートのみです。`https://api.telegram.org/bot<TOKEN>` ではなく、`https://api.telegram.org` またはセルフホスト/プロキシルートを使用してください。`openclaw doctor --fix` は誤って付いた末尾の `/bot<TOKEN>` サフィックスを削除します。
- 任意の `channels.telegram.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- 複数アカウント構成（2 つ以上のアカウント ID）では、フォールバックルーティングを避けるため明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定します。これがないか無効な場合、`openclaw doctor` が警告します。
- `configWrites: false` は、Telegram から開始される設定書き込み（スーパーグループ ID の移行、`/config set|unset`）をブロックします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、フォーラムトピック用の永続 ACP バインディングを設定します（`match.peer.id` では正規の `chatId:topic:topicId` を使用）。フィールドの意味は [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)で共有されています。
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
      streaming: "off", // off | partial | block | progress
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
- 明示的な Discord `token` を指定する直接の送信呼び出しは、その呼び出しにそのトークンを使用します。アカウントの再試行/ポリシー設定は、引き続きアクティブなランタイムスナップショット内の選択されたアカウントから取得されます。
- 任意の `channels.discord.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- 配信先には `user:<id>` (DM) または `channel:<id>` (ギルドチャンネル) を使用します。裸の数値 ID は拒否されます。
- ギルドスラッグは小文字で、スペースは `-` に置き換えられます。チャンネルキーはスラッグ化された名前を使用します (`#` なし)。ギルド ID を推奨します。
- ボットが作成したメッセージはデフォルトで無視されます。`allowBots: true` で有効にできます。ボットにメンションしているボットメッセージのみを受け付けるには `allowBots: "mentions"` を使用します (自身のメッセージは引き続きフィルターされます)。
- `channels.discord.guilds.<id>.ignoreOtherMentions` (およびチャンネル上書き) は、ボットではなく別のユーザーまたはロールにメンションしているメッセージを破棄します (@everyone/@here は除外)。
- `channels.discord.mentionAliases` は、送信前に安定した送信用の `@handle` テキストを Discord ユーザー ID にマッピングします。これにより、一時的なディレクトリキャッシュが空の場合でも、既知のチームメイトを決定的にメンションできます。アカウントごとの上書きは `channels.discord.accounts.<accountId>.mentionAliases` の下にあります。
- `maxLinesPerMessage` (デフォルト 17) は、2000 文字未満でも縦に長いメッセージを分割します。
- `channels.discord.threadBindings` は Discord のスレッドバインドされたルーティングを制御します:
  - `enabled`: スレッドバインドされたセッション機能 (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびバインドされた配信/ルーティング) の Discord 上書き
  - `idleHours`: 非アクティブによる自動アンフォーカスの Discord 上書き (時間単位、`0` で無効)
  - `maxAgeHours`: 強制的な最大経過時間の Discord 上書き (時間単位、`0` で無効)
  - `spawnSessions`: `sessions_spawn({ thread: true })` と ACP スレッドスポーンによる自動スレッド作成/バインドのスイッチ (デフォルト: `true`)
  - `defaultSpawnContext`: スレッドバインドされたスポーンのネイティブサブエージェントコンテキスト (デフォルトは `"fork"`)
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、チャンネルとスレッドの永続 ACP バインディングを設定します (`match.peer.id` にはチャンネル/スレッド ID を使用)。フィールドのセマンティクスは [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings) で共有されています。
- `channels.discord.ui.components.accentColor` は、Discord components v2 コンテナーのアクセントカラーを設定します。
- `channels.discord.voice` は Discord 音声チャンネル会話と、任意の自動参加 + LLM + TTS 上書きを有効にします。テキストのみの Discord 設定では、デフォルトで音声はオフのままです。参加するには `channels.discord.voice.enabled=true` を設定します。
- `channels.discord.voice.model` は、Discord 音声チャンネル応答に使用する LLM モデルを任意で上書きします。
- `channels.discord.voice.daveEncryption` と `channels.discord.voice.decryptionFailureTolerance` は、`@discordjs/voice` の DAVE オプションにそのまま渡されます (デフォルトは `true` と `24`)。
- `channels.discord.voice.connectTimeoutMs` は、`/vc join` と自動参加試行の初期 `@discordjs/voice` Ready 待機を制御します (デフォルトは `30000`)。
- `channels.discord.voice.reconnectGraceMs` は、切断された音声セッションが再接続シグナリングに入るまで OpenClaw が待機する時間を制御します (デフォルトは `15000`)。
- OpenClaw はさらに、復号失敗が繰り返された後に音声セッションから退出/再参加することで、音声受信の復旧を試みます。
- `channels.discord.streaming` は正規のストリームモードキーです。レガシーの `streamMode` とブール値の `streaming` 値は自動移行されます。
- `channels.discord.autoPresence` はランタイムの可用性をボットのプレゼンスにマッピングし (healthy => online、degraded => idle、exhausted => dnd)、任意のステータステキスト上書きを許可します。
- `channels.discord.dangerouslyAllowNameMatching` は、可変の名前/タグ照合を再有効化します (非常時の互換モード)。
- `channels.discord.execApprovals`: Discord ネイティブの exec 承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"` (デフォルト)。auto モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効になります。
  - `approvers`: exec リクエストを承認できる Discord ユーザー ID。省略時は `commands.ownerAllowFrom` にフォールバックします。
  - `agentFilter`: 任意のエージェント ID 許可リスト。すべてのエージェントの承認を転送するには省略します。
  - `sessionFilter`: 任意のセッションキーパターン (部分文字列または正規表現)。
  - `target`: 承認プロンプトの送信先。`"dm"` (デフォルト) は承認者の DM に送信し、`"channel"` は発信元チャンネルに送信し、`"both"` は両方に送信します。target に `"channel"` が含まれる場合、ボタンは解決済みの承認者のみが使用できます。
  - `cleanupAfterResolve`: `true` の場合、承認、拒否、またはタイムアウト後に承認 DM を削除します。

**リアクション通知モード:** `off` (なし)、`own` (ボットのメッセージ、デフォルト)、`all` (すべてのメッセージ)、`allowlist` (すべてのメッセージで `guilds.<id>.users` から)。

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
- 配信先には `spaces/<spaceId>` または `users/<userId>` を使用します。
- `channels.googlechat.dangerouslyAllowNameMatching` は、可変のメールプリンシパル照合を再有効化します (非常時の互換モード)。

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

- **ソケットモード**には `botToken` と `appToken` の両方が必要です (デフォルトアカウントの環境変数フォールバックには `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`)。
- **HTTP モード**には `botToken` と `signingSecret` (ルートまたはアカウントごと) が必要です。
- `socketMode` は Slack SDK Socket Mode トランスポート調整を公開 Bolt レシーバー API にそのまま渡します。ping/pong タイムアウトや古い WebSocket の挙動を調査する場合にのみ使用してください。
- `botToken`、`appToken`、`signingSecret`、`userToken` はプレーンテキスト文字列または SecretRef オブジェクトを受け付けます。
- Slack アカウントスナップショットは、`botTokenSource`、`botTokenStatus`、`appTokenStatus`、および HTTP モードの `signingSecretStatus` など、認証情報ごとの source/status フィールドを公開します。`configured_unavailable` は、アカウントが SecretRef 経由で設定されているものの、現在のコマンド/ランタイムパスでシークレット値を解決できなかったことを意味します。
- `configWrites: false` は、Slack から開始された設定書き込みをブロックします。
- 任意の `channels.slack.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- `channels.slack.streaming.mode` は正規の Slack ストリームモードキーです。`channels.slack.streaming.nativeTransport` は Slack のネイティブストリーミングトランスポートを制御します。レガシーの `streamMode`、ブール値の `streaming`、および `nativeStreaming` 値は自動移行されます。
- 配信先には `user:<id>` (DM) または `channel:<id>` を使用します。

**リアクション通知モード:** `off`、`own` (デフォルト)、`all`、`allowlist` (`reactionAllowlist` から)。

**スレッドセッション分離:** `thread.historyScope` はスレッドごと (デフォルト) またはチャンネル全体で共有です。`thread.inheritParent` は親チャンネルのトランスクリプトを新しいスレッドにコピーします。

- Slack ネイティブストリーミングと Slack アシスタント形式の「入力中...」スレッドステータスには、返信スレッドターゲットが必要です。トップレベルの DM はデフォルトでスレッド外のままなので、スレッド形式のネイティブストリーム/ステータスプレビューを表示する代わりに、Slack のドラフト投稿と編集プレビューを通じて引き続きストリーミングできます。
- `typingReaction` は、返信の実行中に受信 Slack メッセージへ一時的なリアクションを追加し、完了時に削除します。`"hourglass_flowing_sand"` のような Slack 絵文字ショートコードを使用します。
- `channels.slack.execApprovals`: Slack ネイティブの exec 承認配信と承認者認可。Discord と同じスキーマです: `enabled` (`true`/`false`/`"auto"`)、`approvers` (Slack ユーザー ID)、`agentFilter`、`sessionFilter`、および `target` (`"dm"`、`"channel"`、または `"both"`)。

| アクショングループ | デフォルト | メモ                  |
| ------------ | ------- | ---------------------- |
| reactions    | 有効 | リアクション + リアクション一覧 |
| messages     | 有効 | 読み取り/送信/編集/削除  |
| pins         | 有効 | ピン留め/ピン留め解除/一覧         |
| memberInfo   | 有効 | メンバー情報            |
| emojiList    | 有効 | カスタム絵文字一覧      |

### Mattermost

Mattermost は現在の OpenClaw リリースではバンドルされた Plugin として同梱されています。古いビルドまたはカスタムビルドでは、`openclaw plugins install @openclaw/mattermost` で現在の npm パッケージをインストールできます。バージョンを固定する前に、現在の dist-tag を [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) で確認してください。

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

チャットモード: `oncall` (@メンションに応答、デフォルト)、`onmessage` (すべてのメッセージ)、`onchar` (トリガープレフィックスで始まるメッセージ)。

Mattermost ネイティブコマンドが有効な場合:

- `commands.callbackPath` は完全な URL ではなく、パス（例: `/api/channels/mattermost/command`）である必要があります。
- `commands.callbackUrl` は OpenClaw gateway エンドポイントに解決され、Mattermost サーバーから到達可能である必要があります。
- ネイティブのスラッシュコールバックは、スラッシュコマンド登録時に Mattermost から返されるコマンドごとのトークンで認証されます。登録に失敗した場合、または有効化されたコマンドがない場合、OpenClaw はコールバックを `Unauthorized: invalid command token.` で拒否します。
- プライベート/tailnet/内部のコールバックホストでは、Mattermost が `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックホスト/ドメインを含めることを要求する場合があります。完全な URL ではなく、ホスト/ドメインの値を使用してください。
- `channels.mattermost.configWrites`: Mattermost が開始する設定書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャンネルで返信する前に `@mention` を必須にします。
- `channels.mattermost.groups.<channelId>.requireMention`: チャンネルごとのメンションゲートの上書き（デフォルトは `"*"`）。
- 任意の `channels.mattermost.defaultAccount` は、設定済みのアカウント ID と一致する場合にデフォルトのアカウント選択を上書きします。

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
- `channels.signal.configWrites`: Signal が開始する設定書き込みを許可または拒否します。
- 任意の `channels.signal.defaultAccount` は、設定済みのアカウント ID と一致する場合にデフォルトのアカウント選択を上書きします。

### BlueBubbles

BlueBubbles は推奨される iMessage 経路です（Plugin によって支えられ、`channels.bluebubbles` 配下で設定します）。

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
- 任意の `channels.bluebubbles.defaultAccount` は、設定済みのアカウント ID と一致する場合にデフォルトのアカウント選択を上書きします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、BlueBubbles の会話を永続 ACP セッションにバインドできます。`match.peer.id` には BlueBubbles ハンドルまたはターゲット文字列（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共有フィールドの意味: [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)。
- BlueBubbles チャンネル設定全体は [BlueBubbles](/ja-JP/channels/bluebubbles) に記載されています。

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

- 任意の `channels.imessage.defaultAccount` は、設定済みのアカウント ID と一致する場合にデフォルトのアカウント選択を上書きします。

- Messages DB へのフルディスクアクセスが必要です。
- `chat_id:<id>` ターゲットを推奨します。チャットを一覧表示するには `imsg chats --limit 20` を使用してください。
- `cliPath` は SSH ラッパーを指すことができます。SCP で添付ファイルを取得するには `remoteHost`（`host` または `user@host`）を設定します。
- `attachmentRoots` と `remoteAttachmentRoots` は受信添付ファイルのパスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCP は厳格なホストキー確認を使用するため、リレーホストキーがすでに `~/.ssh/known_hosts` に存在することを確認してください。
- `channels.imessage.configWrites`: iMessage が開始する設定書き込みを許可または拒否します。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、iMessage の会話を永続 ACP セッションにバインドできます。`match.peer.id` には正規化されたハンドルまたは明示的なチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共有フィールドの意味: [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)。

<Accordion title="iMessage SSH ラッパー例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix は Plugin によって支えられ、`channels.matrix` 配下で設定します。

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
- `channels.matrix.proxy` は Matrix の HTTP トラフィックを明示的な HTTP(S) プロキシ経由でルーティングします。名前付きアカウントは `channels.matrix.accounts.<id>.proxy` で上書きできます。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` はプライベート/内部ホームサーバーを許可します。`proxy` とこのネットワークのオプトインは独立した制御です。
- `channels.matrix.defaultAccount` は複数アカウント設定で優先アカウントを選択します。
- `channels.matrix.autoJoin` のデフォルトは `off` なので、招待されたルームや新しい DM 形式の招待は、`autoJoin: "allowlist"` と `autoJoinAllowlist`、または `autoJoin: "always"` を設定するまで無視されます。
- `channels.matrix.execApprovals`: Matrix ネイティブの exec 承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。自動モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効になります。
  - `approvers`: exec リクエストの承認を許可された Matrix ユーザー ID（例: `@owner:example.org`）。
  - `agentFilter`: 任意のエージェント ID 許可リスト。省略すると、すべてのエージェントの承認を転送します。
  - `sessionFilter`: 任意のセッションキーのパターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）、`"channel"`（発信元ルーム）、または `"both"`。
  - アカウントごとの上書き: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` は Matrix DM をセッションにグループ化する方法を制御します。`per-user`（デフォルト）はルーティングされたピアごとに共有し、`per-room` は各 DM ルームを分離します。
- Matrix のステータスプローブとライブディレクトリ検索は、ランタイムトラフィックと同じプロキシポリシーを使用します。
- Matrix の完全な設定、ターゲティング規則、セットアップ例は [Matrix](/ja-JP/channels/matrix) に記載されています。

### Microsoft Teams

Microsoft Teams は Plugin によって支えられ、`channels.msteams` 配下で設定します。

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

IRC は Plugin によって支えられ、`channels.irc` 配下で設定します。

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
- 任意の `channels.irc.defaultAccount` は、設定済みのアカウント ID と一致する場合にデフォルトのアカウント選択を上書きします。
- IRC チャンネルの完全な設定（host/port/TLS/channels/許可リスト/メンションゲート）は [IRC](/ja-JP/channels/irc) に記載されています。

### 複数アカウント（すべてのチャンネル）

チャンネルごとに複数のアカウント（それぞれ独自の `accountId` を持つ）を実行します。

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
- 単一アカウントのトップレベルチャンネル設定のまま、`openclaw channels add`（またはチャンネルのオンボーディング）で非デフォルトアカウントを追加すると、OpenClaw はまずアカウントスコープのトップレベル単一アカウント値をチャンネルアカウントマップに昇格し、元のアカウントが動作し続けるようにします。ほとんどのチャンネルではそれらを `channels.<channel>.accounts.default` に移動します。Matrix では、既存の一致する名前付き/デフォルトターゲットを保持できる場合があります。
- 既存のチャンネルのみのバインディング（`accountId` なし）は、引き続きデフォルトアカウントに一致します。アカウントスコープのバインディングは任意のままです。
- `openclaw doctor --fix` も、アカウントスコープのトップレベル単一アカウント値を、そのチャンネル用に選択された昇格先アカウントへ移動することで、混在した形状を修復します。ほとんどのチャンネルでは `accounts.default` を使用します。Matrix では、既存の一致する名前付き/デフォルトターゲットを保持できる場合があります。

### その他の Plugin チャンネル

多くの Plugin チャンネルは `channels.<id>` として設定され、それぞれ専用のチャンネルページに記載されています（例: Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch）。
完全なチャンネル索引を参照してください: [チャンネル](/ja-JP/channels)。

### グループチャットのメンションゲート

グループメッセージはデフォルトで **メンション必須** です（メタデータメンションまたは安全な正規表現パターン）。WhatsApp、Telegram、Discord、Google Chat、iMessage のグループチャットに適用されます。

表示される返信は別途制御されます。グループ/チャンネルルームのデフォルトは `messages.groupChat.visibleReplies: "message_tool"` です。OpenClaw は引き続きターンを処理しますが、通常の最終返信は非公開のままとなり、ルームに表示される出力には `message(action=send)` が必要です。通常の返信をルームへ投稿する従来の動作が必要な場合にのみ、`"automatic"` を設定してください。同じツール専用の表示返信動作をダイレクトチャットにも適用するには、`messages.visibleReplies: "message_tool"` を設定します。Codex ハーネスも、未設定のダイレクトチャットのデフォルトとしてこのツール専用動作を使用します。

ツール専用の表示返信には、ツールを確実に呼び出すモデル/ランタイムが必要です。セッションログに `didSendViaMessagingTool: false` を伴うアシスタントテキストが表示される場合、そのモデルはメッセージツールを呼び出す代わりに非公開の最終回答を生成しています。そのチャンネルでは、より強力なツール呼び出しモデルに切り替えるか、従来の表示される最終返信を復元するために `messages.groupChat.visibleReplies: "automatic"` を設定してください。

アクティブなツールポリシー下でメッセージツールを使用できない場合、OpenClaw は応答を黙って抑制するのではなく、自動の表示返信にフォールバックします。`openclaw doctor` はこの不一致について警告します。

Gateway はファイル保存後に `messages` 設定をホットリロードします。ファイル監視または設定リロードがデプロイで無効化されている場合にのみ再起動してください。

**メンションの種類:**

- **メタデータメンション**: ネイティブプラットフォームの@メンション。WhatsApp自己チャットモードでは無視されます。
- **テキストパターン**: `agents.list[].groupChat.mentionPatterns` 内の安全な正規表現パターン。無効なパターンと安全でないネストした繰り返しは無視されます。
- メンションゲートは、検出が可能な場合のみ適用されます (ネイティブメンション、または少なくとも1つのパターン)。

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

`messages.groupChat.historyLimit` はグローバル既定値を設定します。チャンネルは `channels.<channel>.historyLimit` (またはアカウントごと) で上書きできます。無効にするには `0` を設定します。

`messages.visibleReplies` はグローバルなソースターンの既定値です。`messages.groupChat.visibleReplies` はグループ/チャンネルのソースターンでそれを上書きします。`messages.visibleReplies` が未設定の場合、ハーネスは独自のダイレクト/ソース既定値を提供できます。Codexハーネスの既定値は `message_tool` です。チャンネル許可リストとメンションゲートは、ターンを処理するかどうかを引き続き決定します。

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

解決順序: DMごとの上書き → プロバイダー既定値 → 制限なし (すべて保持)。

対応: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`。

#### 自己チャットモード

自己チャットモードを有効にするには、自分の番号を `allowFrom` に含めます (ネイティブ@メンションを無視し、テキストパターンにのみ応答します)。

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

### コマンド (チャットコマンド処理)

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

- このブロックはコマンドサーフェスを設定します。現在の組み込み+バンドル済みコマンドカタログについては、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。
- このページは**設定キーリファレンス**であり、完全なコマンドカタログではありません。QQ Bot `/bot-ping` `/bot-help` `/bot-logs`、LINE `/card`、デバイスペアリング `/pair`、メモリ `/dreaming`、電話制御 `/phone`、Talk `/voice` などのチャンネル/Plugin所有コマンドは、それぞれのチャンネル/Pluginページと[スラッシュコマンド](/ja-JP/tools/slash-commands)に記載されています。
- テキストコマンドは、先頭に `/` が付いた**単独の**メッセージである必要があります。
- `native: "auto"` は Discord/Telegram のネイティブコマンドを有効にし、Slack は無効のままにします。
- `nativeSkills: "auto"` は Discord/Telegram のネイティブSkillsコマンドを有効にし、Slack は無効のままにします。
- チャンネルごとの上書き: `channels.discord.commands.native` (真偽値または `"auto"`)。Discordでは、`false` にすると起動時のネイティブコマンド登録とクリーンアップをスキップします。
- チャンネルごとのネイティブSkills登録は `channels.<provider>.commands.nativeSkills` で上書きします。
- `channels.telegram.customCommands` は追加のTelegramボットメニュー項目を追加します。
- `bash: true` はホストシェル向けの `! <cmd>` を有効にします。`tools.elevated.enabled` と、送信者が `tools.elevated.allowFrom.<channel>` に含まれていることが必要です。
- `config: true` は `/config` (`openclaw.json` の読み書き) を有効にします。Gateway `chat.send` クライアントでは、永続的な `/config set|unset` の書き込みにも `operator.admin` が必要です。読み取り専用の `/config show` は、通常の書き込みスコープ付きoperatorクライアントでも引き続き利用できます。
- `mcp: true` は、`mcp.servers` 配下のOpenClaw管理MCPサーバー設定向けに `/mcp` を有効にします。
- `plugins: true` は、Pluginの検出、インストール、有効化/無効化コントロール向けに `/plugins` を有効にします。
- `channels.<provider>.configWrites` は、チャンネルごとの設定変更を制御します (既定値: true)。
- 複数アカウントチャンネルでは、`channels.<provider>.accounts.<id>.configWrites` も、そのアカウントを対象にする書き込みを制御します (例: `/allowlist --config --account <id>` または `/config set channels.<provider>.accounts.<id>...`)。
- `restart: false` は `/restart` とGateway再起動ツールアクションを無効にします。既定値: `true`。
- `ownerAllowFrom` は、オーナー専用コマンド/ツールの明示的なオーナー許可リストです。`allowFrom` とは別です。
- `ownerDisplay: "hash"` は、システムプロンプト内のオーナーIDをハッシュ化します。ハッシュ化を制御するには `ownerDisplaySecret` を設定します。
- `allowFrom` はプロバイダーごとの設定です。設定されている場合、それが**唯一の**認可ソースになります (チャンネル許可リスト/ペアリングと `useAccessGroups` は無視されます)。
- `useAccessGroups: false` は、`allowFrom` が設定されていない場合に、コマンドがアクセスグループポリシーをバイパスすることを許可します。
- コマンドドキュメントの対応:
  - 組み込み+バンドル済みカタログ: [スラッシュコマンド](/ja-JP/tools/slash-commands)
  - チャンネル固有のコマンドサーフェス: [チャンネル](/ja-JP/channels)
  - QQ Botコマンド: [QQ Bot](/ja-JP/channels/qqbot)
  - ペアリングコマンド: [ペアリング](/ja-JP/channels/pairing)
  - LINEカードコマンド: [LINE](/ja-JP/channels/line)
  - メモリDreaming: [Dreaming](/ja-JP/concepts/dreaming)

</Accordion>

---

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference) — トップレベルキー
- [設定 — エージェント](/ja-JP/gateway/config-agents)
- [チャンネル概要](/ja-JP/channels)
