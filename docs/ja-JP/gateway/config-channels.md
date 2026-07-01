---
read_when:
    - チャネルPluginの設定（認証、アクセス制御、複数アカウント）
    - チャンネル別設定キーのトラブルシューティング
    - DM ポリシー、グループポリシー、またはメンションゲートの監査
summary: 'チャネル設定: Slack、Discord、Telegram、WhatsApp、Matrix、iMessage などにわたるアクセス制御、ペアリング、チャネルごとのキー'
title: 設定 — チャンネル
x-i18n:
    generated_at: "2026-07-01T10:57:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba84406a296db7a37ce44381b5a1ebccd7f4d3c32375b116f6da3da5def9340b
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` 配下のチャンネル別設定キー。DM とグループアクセス、複数アカウント構成、メンションゲーティング、Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、その他の同梱チャンネル Plugin 向けのチャンネル別キーを扱います。

エージェント、ツール、Gateway ランタイム、その他のトップレベルキーについては、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## チャンネル

各チャンネルは、その設定セクションが存在すると自動的に起動します（`enabled: false` の場合を除く）。

### DM とグループアクセス

すべてのチャンネルは DM ポリシーとグループポリシーに対応しています。

| DM ポリシー         | 動作                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (デフォルト) | 不明な送信者には一回限りのペアリングコードが送られ、所有者の承認が必要 |
| `allowlist`         | `allowFrom` 内（またはペアリング済み許可ストア）の送信者のみ     |
| `open`              | すべての受信 DM を許可（`allowFrom: ["*"]` が必要）              |
| `disabled`          | すべての受信 DM を無視                                          |

| グループポリシー       | 動作                                                   |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (デフォルト) | 設定済みの許可リストに一致するグループのみ             |
| `open`                | グループ許可リストをバイパス（メンションゲーティングは引き続き適用） |
| `disabled`            | すべてのグループ/ルームメッセージをブロック            |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が未設定の場合のデフォルトを設定します。
ペアリングコードは 1 時間後に期限切れになります。保留中の DM ペアリング要求は **チャンネルあたり 3 件** に制限されます。
プロバイダーブロックが完全に存在しない場合（`channels.<provider>` がない場合）、ランタイムのグループポリシーは起動時警告付きで `allowlist`（フェイルクローズ）にフォールバックします。
</Note>

### チャンネルモデルのオーバーライド

`channels.modelByChannel` を使用して、特定のチャンネル ID またはダイレクトメッセージのピアをモデルに固定します。値には `provider/model` または設定済みのモデルエイリアスを指定できます。チャンネルマッピングは、セッションにモデルオーバーライドがまだない場合（たとえば `/model` で設定された場合など）に適用されます。

グループ/スレッド会話の場合、キーはチャンネル固有のグループ ID、トピック ID、またはチャンネル名です。ダイレクトメッセージ（DM）会話の場合、キーはチャンネルの送信者 ID（`nativeDirectUserId`、`origin.from`、`origin.to`、`OriginatingTo`、`From`、または `SenderId`）から派生したピア識別子です。正確なキー形式はチャンネルによって異なります。

| チャンネル  | DM キー形式         | 例                                           |
| -------- | ------------------- | -------------------------------------------- |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | 生のユーザー ID      | `123456789`                                  |
| Discord  | 生のユーザー ID      | `987654321`                                  |
| WhatsApp | 電話番号または JID   | `15551234567`                                |
| Matrix   | Matrix ユーザー ID   | `@user:matrix.org`                           |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.5",
        "user:U12345": "openai/gpt-5.4-mini",
      },
      telegram: {
        "-1001234567890": "openai/gpt-5.4-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
        "123456789": "openai/gpt-4.1",
      },
    },
  },
}
```

DM 固有のキーはダイレクトメッセージ会話でのみ一致し、グループ/スレッドのルーティングには影響しません。

### チャンネルのデフォルトと Heartbeat

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

- `channels.defaults.groupPolicy`: プロバイダーレベルの `groupPolicy` が未設定の場合のフォールバックグループポリシー。
- `channels.defaults.contextVisibility`: すべてのチャンネルに対する補足コンテキスト可視性モードのデフォルト。値: `all`（デフォルト、引用/スレッド/履歴のすべてのコンテキストを含める）、`allowlist`（許可リスト内の送信者からのコンテキストのみを含める）、`allowlist_quote`（allowlist と同じだが、明示的な引用/返信コンテキストは保持）。チャンネル別オーバーライド: `channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`: Heartbeat 出力に正常なチャンネルステータスを含めます。
- `channels.defaults.heartbeat.showAlerts`: Heartbeat 出力に低下/エラーステータスを含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケータースタイルの Heartbeat 出力をレンダリングします。

### WhatsApp

WhatsApp は Gateway の Web チャンネル（Baileys Web）を通じて動作します。リンク済みセッションが存在すると自動的に起動します。

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
      sendReadReceipts: true, // 青いチェックマーク（セルフチャットモードでは false）
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、WhatsApp の DM とグループ向けの永続 ACP バインディングを設定します。`match.peer.id` には E.164 形式の直接番号または WhatsApp グループ JID を使用します。フィールドの意味は [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)で共通です。

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

- 送信コマンドは、存在する場合はアカウント `default` にデフォルト設定されます。それ以外の場合は、最初の設定済みアカウント ID（ソート済み）になります。
- 任意の `channels.whatsapp.defaultAccount` は、設定済みアカウント ID と一致する場合、そのフォールバックのデフォルトアカウント選択をオーバーライドします。
- レガシーの単一アカウント Baileys 認証ディレクトリは、`openclaw doctor` によって `whatsapp/default` に移行されます。
- アカウント別オーバーライド: `channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

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
      streaming: "partial", // off | partial | block | progress (default: partial)
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
- `apiRoot` は Telegram Bot API のルートのみです。`https://api.telegram.org/bot<TOKEN>` ではなく、`https://api.telegram.org` またはセルフホスト/プロキシルートを使用してください。`openclaw doctor --fix` は、誤って付いた末尾の `/bot<TOKEN>` サフィックスを削除します。
- 任意の `channels.telegram.defaultAccount` は、設定済みアカウント ID と一致する場合、デフォルトアカウント選択をオーバーライドします。
- 複数アカウント構成（2 個以上のアカウント ID）では、フォールバックルーティングを避けるために明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定します。これが存在しない、または無効な場合、`openclaw doctor` が警告します。
- `configWrites: false` は、Telegram 起点の設定書き込み（スーパーグループ ID 移行、`/config set|unset`）をブロックします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、フォーラムトピック向けの永続 ACP バインディングを設定します（`match.peer.id` には正規の `chatId:topic:topicId` を使用）。フィールドの意味は [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)で共通です。
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
      suppressEmbeds: true,
      chunkMode: "length", // length | newline
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
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
- 明示的な Discord `token` を指定する直接の送信呼び出しは、その呼び出しにそのトークンを使用します。アカウントの再試行/ポリシー設定は、引き続きアクティブなランタイムスナップショット内の選択済みアカウントから取得されます。
- 任意の `channels.discord.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウントの選択を上書きします。
- 配信先には `user:<id>`（DM）または `channel:<id>`（ギルドチャンネル）を使用します。裸の数値 ID は拒否されます。
- ギルドスラッグは小文字で、スペースは `-` に置換されます。チャンネルキーはスラッグ化された名前（`#` なし）を使用します。ギルド ID を優先してください。
- ボットが作成したメッセージはデフォルトで無視されます。`allowBots: true` で有効になります。ボットにメンションしているボットメッセージだけを受け入れるには `allowBots: "mentions"` を使用します（自分自身のメッセージは引き続きフィルタされます）。
- ボット作成の受信メッセージをサポートするチャンネルでは、共有の[ボットループ保護](/ja-JP/channels/bot-loop-protection)を使用できます。基準となるペア予算は `channels.defaults.botLoopProtection` に設定し、特定のサーフェスで異なる制限が必要な場合にのみチャンネルまたはアカウントを上書きします。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（およびチャンネル上書き）は、別のユーザーまたはロールにメンションしているがボットにはメンションしていないメッセージを破棄します（@everyone/@here を除く）。
- `channels.discord.mentionAliases` は、送信前に安定した送信用の `@handle` テキストを Discord ユーザー ID にマッピングします。これにより、一時的なディレクトリキャッシュが空でも、既知のチームメイトを決定的にメンションできます。アカウントごとの上書きは `channels.discord.accounts.<accountId>.mentionAliases` の下にあります。
- `maxLinesPerMessage`（デフォルト 17）は、2000 文字未満でも縦に長いメッセージを分割します。
- `channels.discord.suppressEmbeds` はデフォルトで `true` です。そのため、無効化しない限り、送信 URL は Discord のリンクプレビューとして展開されません。明示的な `embeds` ペイロードは通常どおり送信されます。メッセージごとのツール呼び出しでは `suppressEmbeds` で上書きできます。
- `channels.discord.threadBindings` は Discord のスレッド紐付けルーティングを制御します。
  - `enabled`: スレッド紐付けセッション機能（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、および紐付け済みの配信/ルーティング）に対する Discord 上書き
  - `idleHours`: 非アクティブ時の自動フォーカス解除を時間単位で指定する Discord 上書き（`0` で無効化）
  - `maxAgeHours`: 強制最大期間を時間単位で指定する Discord 上書き（`0` で無効化）
  - `spawnSessions`: `sessions_spawn({ thread: true })` と ACP スレッド生成による自動スレッド作成/紐付けのスイッチ（デフォルト: `true`）
  - `defaultSpawnContext`: スレッド紐付け生成に使うネイティブサブエージェントコンテキスト（デフォルトは `"fork"`）
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、チャンネルとスレッドの永続 ACP 紐付けを設定します（`match.peer.id` にはチャンネル/スレッド ID を使用）。フィールドの意味は [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)で共有されています。
- `channels.discord.ui.components.accentColor` は Discord コンポーネント v2 コンテナのアクセントカラーを設定します。
- `channels.discord.agentComponents.ttlMs` は、送信済み Discord コンポーネントコールバックを登録済みのままにする時間を制御します。デフォルトは `1800000`（30 分）、最大値は `86400000`（24 時間）で、アカウントごとの上書きは `channels.discord.accounts.<accountId>.agentComponents.ttlMs` の下にあります。値を長くすると古いボタン/選択/フォームをより長く使用できるため、ワークフローに合う最短の TTL を優先してください。
- `channels.discord.voice` は Discord ボイスチャンネル会話と、任意の自動参加 + LLM + TTS 上書きを有効にします。テキストのみの Discord 設定では、デフォルトで音声はオフのままです。オプトインするには `channels.discord.voice.enabled=true` を設定します。
- `channels.discord.voice.model` は、Discord ボイスチャンネル応答に使う LLM モデルを任意で上書きします。
- `channels.discord.voice.daveEncryption` と `channels.discord.voice.decryptionFailureTolerance` は、`@discordjs/voice` の DAVE オプションにそのまま渡されます（デフォルトは `true` と `24`）。
- `channels.discord.voice.connectTimeoutMs` は、`/vc join` と自動参加試行時の初期 `@discordjs/voice` Ready 待機を制御します（デフォルトは `30000`）。
- `channels.discord.voice.reconnectGraceMs` は、切断された音声セッションが再接続シグナリングに入るまでに許容される時間を制御します。この時間を超えると OpenClaw が破棄します（デフォルトは `15000`）。
- Discord 音声再生は、別ユーザーの発話開始イベントによって中断されません。フィードバックループを避けるため、OpenClaw は TTS 再生中の新しい音声キャプチャを無視します。
- OpenClaw はさらに、復号失敗が繰り返された後に音声セッションから退出して再参加することで、音声受信の回復を試みます。
- `channels.discord.streaming` は正規のストリームモードキーです。Discord のデフォルトは `streaming.mode: "progress"` で、ツール/作業の進捗が 1 つの編集済みプレビューメッセージに表示されます。無効化するには `streaming.mode: "off"` を設定します。従来の `streamMode` と真偽値の `streaming` 値はランタイムエイリアスとして残っています。永続化済み設定を書き換えるには `openclaw doctor --fix` を実行してください。
- `channels.discord.autoPresence` はランタイム可用性をボットのプレゼンスにマッピングし（healthy => online、degraded => idle、exhausted => dnd）、任意のステータステキスト上書きを許可します。
- `channels.discord.dangerouslyAllowNameMatching` は、変更可能な名前/タグ一致を再有効化します（緊急時用の互換モード）。
- `channels.discord.execApprovals`: Discord ネイティブの exec 承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。自動モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効になります。
  - `approvers`: exec リクエストの承認を許可された Discord ユーザー ID。省略時は `commands.ownerAllowFrom` にフォールバックします。
  - `agentFilter`: 任意のエージェント ID 許可リスト。省略すると、すべてのエージェントの承認を転送します。
  - `sessionFilter`: 任意のセッションキーパターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）は承認者の DM に送信し、`"channel"` は発信元チャンネルに送信し、`"both"` は両方に送信します。ターゲットに `"channel"` が含まれる場合、ボタンを使用できるのは解決済み承認者だけです。
  - `cleanupAfterResolve`: `true` の場合、承認、拒否、またはタイムアウト後に承認 DM を削除します。

**リアクション通知モード:** `off`（なし）、`own`（ボットのメッセージ、デフォルト）、`all`（すべてのメッセージ）、`allowlist`（すべてのメッセージで `guilds.<id>.users` から）。

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

- サービスアカウント JSON: インライン（`serviceAccount`）またはファイルベース（`serviceAccountFile`）。
- サービスアカウント SecretRef もサポートされています（`serviceAccountRef`）。
- 環境変数フォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信先には `spaces/<spaceId>` または `users/<userId>` を使用します。
- `channels.googlechat.dangerouslyAllowNameMatching` は、変更可能なメールプリンシパル一致を再有効化します（緊急時用の互換モード）。

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

- **Socket mode** には `botToken` と `appToken` の両方が必要です（デフォルトアカウントの環境変数フォールバックでは `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP mode** には `botToken` に加えて `signingSecret`（ルートまたはアカウントごと）が必要です。
- `socketMode` は Slack SDK Socket Mode のトランスポート調整を公開 Bolt レシーバー API に渡します。ping/pong タイムアウトや古い websocket 動作を調査する場合にのみ使用してください。`clientPingTimeout` のデフォルトは `15000` です。`serverPingTimeout` と `pingPongLoggingEnabled` は設定されている場合にのみ渡されます。
- `botToken`、`appToken`、`signingSecret`、`userToken` はプレーンテキスト
  文字列または SecretRef オブジェクトを受け入れます。
- Slack アカウントスナップショットは、`botTokenSource`、`botTokenStatus`、`appTokenStatus`、HTTP mode では
  `signingSecretStatus` など、認証情報ごとのソース/ステータスフィールドを公開します。`configured_unavailable` は、そのアカウントが
  SecretRef で設定されているものの、現在のコマンド/ランタイムパスが
  シークレット値を解決できなかったことを意味します。
- `configWrites: false` は Slack 起点の設定書き込みをブロックします。
- 任意の `channels.slack.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- `channels.slack.streaming.mode` は正規の Slack ストリームモードキーです。`channels.slack.streaming.nativeTransport` は Slack のネイティブストリーミングトランスポートを制御します。レガシーの `streamMode`、ブール値の `streaming`、`nativeStreaming` 値はランタイムエイリアスとして残っています。永続化された設定を書き換えるには `openclaw doctor --fix` を実行してください。
- `unfurlLinks` と `unfurlMedia` は、ボット返信に対して Slack の `chat.postMessage` のリンクとメディアのアンフールブール値を渡します。`unfurlLinks` のデフォルトは `false` なので、有効化しない限り送信ボットリンクはインライン展開されません。`unfurlMedia` は設定されていない限り省略されます。1 つのアカウントでトップレベル値を上書きするには、どちらかの値を `channels.slack.accounts.<accountId>` に設定します。
- 配信ターゲットには `user:<id>`（DM）または `channel:<id>` を使用します。

**リアクション通知モード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` 由来）。

**スレッドセッション分離:** `thread.historyScope` はスレッドごと（デフォルト）またはチャンネル全体で共有です。`thread.inheritParent` は親チャンネルのトランスクリプトを新しいスレッドにコピーします。

- Slack ネイティブストリーミングと Slack アシスタント風の「入力中...」スレッドステータスには、返信スレッドターゲットが必要です。トップレベル DM はデフォルトでスレッド外のままなので、スレッド形式のネイティブストリーム/ステータスプレビューを表示する代わりに、Slack の下書き投稿と編集プレビューを通じてストリーミングできます。
- `typingReaction` は返信の実行中に受信 Slack メッセージへ一時的なリアクションを追加し、完了時に削除します。`"hourglass_flowing_sand"` のような Slack 絵文字ショートコードを使用してください。
- `channels.slack.execApprovals`: Slack ネイティブの承認クライアント配信と exec 承認者認可。スキーマは Discord と同じです: `enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack ユーザー ID）、`agentFilter`、`sessionFilter`、`target`（`"dm"`、`"channel"`、または `"both"`）。Plugin 承認は、Slack plugin 承認者が解決される場合、Slack 起点リクエストにこのネイティブクライアントパスを使用できます。Slack ネイティブの Plugin 承認配信は、Slack 起点セッションまたは Slack ターゲットに対して `approvals.plugin` からも有効化できます。Plugin 承認は、exec 承認者ではなく、`allowFrom` とデフォルトルーティングの Slack plugin 承認者を使用します。

| アクショングループ | デフォルト | 備考                   |
| ------------ | ------- | ---------------------- |
| reactions    | enabled | リアクションの追加 + 一覧 |
| messages     | enabled | 読み取り/送信/編集/削除 |
| pins         | enabled | ピン留め/ピン解除/一覧 |
| memberInfo   | enabled | メンバー情報            |
| emojiList    | enabled | カスタム絵文字一覧      |

### Mattermost

Mattermost は現在の OpenClaw リリースではバンドル Plugin として提供されています。古いビルドや
カスタムビルドでは、現在の npm パッケージを
`openclaw plugins install @openclaw/mattermost` でインストールできます。バージョンを固定する前に、現在の dist-tags を
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

Mattermost ネイティブコマンドが有効な場合:

- `commands.callbackPath` は完全な URL ではなく、パス（例: `/api/channels/mattermost/command`）である必要があります。
- `commands.callbackUrl` は OpenClaw Gateway エンドポイントに解決され、Mattermost サーバーから到達可能である必要があります。
- ネイティブスラッシュコールバックは、スラッシュコマンド登録中に Mattermost から返されるコマンドごとのトークンで認証されます。登録に失敗した場合や
  有効化されたコマンドがない場合、OpenClaw は
  `Unauthorized: invalid command token.` でコールバックを拒否します。
- プライベート/tailnet/内部コールバックホストでは、Mattermost が
  `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックホスト/ドメインを含めることを要求する場合があります。
  完全な URL ではなく、ホスト/ドメイン値を使用してください。
- `channels.mattermost.configWrites`: Mattermost 起点の設定書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャンネルで返信する前に `@mention` を要求します。
- `channels.mattermost.groups.<channelId>.requireMention`: チャンネルごとのメンションゲート上書き（デフォルトには `"*"`）。
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

**リアクション通知モード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` 由来）。

- `channels.signal.account`: チャンネル起動を特定の Signal アカウント ID に固定します。
- `channels.signal.configWrites`: Signal 起点の設定書き込みを許可または拒否します。
- 任意の `channels.signal.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。

### iMessage

OpenClaw は `imsg rpc`（stdio 経由の JSON-RPC）を起動します。デーモンやポートは不要です。これは、ホストが Messages データベースと Automation 権限を付与できる場合、新しい OpenClaw iMessage セットアップで推奨されるパスです。

BlueBubbles サポートは削除されました。現在の OpenClaw では `channels.bluebubbles` はサポートされるランタイム設定サーフェスではありません。古い設定は `channels.imessage` に移行してください。短い説明は [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage)、完全な対応表は [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles) を参照してください。

Gateway がサインイン済み Messages Mac 上で実行されていない場合は、`channels.imessage.enabled=true` を維持し、`channels.imessage.cliPath` をその Mac 上で `imsg "$@"` を実行する SSH ラッパーに設定します。デフォルトのローカル `imsg` パスは macOS 専用です。

本番送信で SSH ラッパーに依存する前に、その正確なラッパーを通じて送信 `imsg send` を検証してください。一部の macOS TCC 状態では Messages Automation が `/usr/libexec/sshd-keygen-wrapper` に割り当てられ、読み取りやプローブは機能しても送信が AppleEvents `-1743` で失敗することがあります。詳しくは [SSH ラッパーの送信が AppleEvents -1743 で失敗する](/ja-JP/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743) を参照してください。

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
      sendTransport: "auto",
      region: "US",
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
    },
  },
}
```

- 任意の `channels.imessage.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。

- Messages DB へのフルディスクアクセスが必要です。
- `chat_id:<id>` ターゲットを推奨します。チャットを一覧表示するには `imsg chats --limit 20` を使用します。
- `cliPath` は SSH ラッパーを指すことができます。SCP 添付ファイル取得には `remoteHost`（`host` または `user@host`）を設定します。
- `attachmentRoots` と `remoteAttachmentRoots` は受信添付ファイルパスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCP は厳密なホストキー確認を使用するため、リレーホストキーが `~/.ssh/known_hosts` にすでに存在することを確認してください。
- `channels.imessage.configWrites`: iMessage 起点の設定書き込みを許可または拒否します。
- `channels.imessage.sendTransport`: 通常の送信返信に使用する推奨 `imsg` RPC 送信トランスポート。`auto`（デフォルト）は、実行中であれば既存チャットに IMCore ブリッジを使用し、その後 AppleScript にフォールバックします。`bridge` はプライベート API 配信を要求します。`applescript` は公開 Messages automation パスを強制します。
- `channels.imessage.actions.*`: `imsg status` / `openclaw channels status --probe` によってもゲートされるプライベート API アクションを有効化します。
- `channels.imessage.includeAttachments` はデフォルトでオフです。エージェントターンで受信メディアを期待する前に `true` に設定してください。
- ブリッジ/Gateway 再起動後の受信復旧は自動です（GUID 重複排除に加え、古いバックログの年齢フェンス）。既存の `channels.imessage.catchup.enabled: true` 設定は、非推奨の互換プロファイルとして引き続き尊重されます。
- `channels.imessage.groups`: グループレジストリとグループごとの設定。`groupPolicy: "allowlist"` では、グループメッセージがレジストリゲートを通過できるように、明示的な `chat_id` キーまたは `"*"` ワイルドカードエントリのどちらかを設定します。
- `type: "acp"` を持つトップレベル `bindings[]` エントリは、iMessage 会話を永続 ACP セッションにバインドできます。`match.peer.id` には正規化されたハンドルまたは明示的なチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共有フィールドの意味: [ACP Agents](/ja-JP/tools/acp-agents#persistent-channel-bindings)。

<Accordion title="iMessage SSH ラッパー例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix は Plugin によって支えられており、`channels.matrix` 配下で設定します。

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

- トークン認証は `accessToken` を使用します。パスワード認証は `userId` + `password` を使用します。
- `channels.matrix.proxy` は Matrix HTTP トラフィックを明示的な HTTP(S) プロキシ経由でルーティングします。名前付きアカウントは `channels.matrix.accounts.<id>.proxy` でこれを上書きできます。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` はプライベート/内部ホームサーバーを許可します。`proxy` とこのネットワークのオプトインは独立した制御です。
- `channels.matrix.defaultAccount` はマルチアカウント構成で優先アカウントを選択します。
- `channels.matrix.autoJoin` のデフォルトは `off` のため、招待されたルームと新しい DM 形式の招待は、`autoJoinAllowlist` とともに `autoJoin: "allowlist"` を設定するか、`autoJoin: "always"` を設定するまで無視されます。
- `channels.matrix.execApprovals`: Matrix ネイティブの exec 承認配信と承認者の認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。auto モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効になります。
  - `approvers`: exec リクエストの承認を許可された Matrix ユーザー ID（例: `@owner:example.org`）。
  - `agentFilter`: 任意のエージェント ID 許可リスト。省略すると、すべてのエージェントの承認を転送します。
  - `sessionFilter`: 任意のセッションキーパターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）、`"channel"`（発信元ルーム）、または `"both"`。
  - アカウントごとの上書き: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` は Matrix DM をセッションにどのようにまとめるかを制御します。`per-user`（デフォルト）はルーティングされた相手ごとに共有し、`per-room` は各 DM ルームを分離します。
- Matrix のステータスプローブとライブディレクトリ検索は、ランタイムトラフィックと同じプロキシポリシーを使用します。
- Matrix の完全な設定、ターゲティングルール、セットアップ例は [Matrix](/ja-JP/channels/matrix) に記載されています。

### Microsoft Teams

Microsoft Teams は Plugin ベースで、`channels.msteams` の下で設定します。

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

IRC は Plugin ベースで、`channels.irc` の下で設定します。

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

### マルチアカウント（すべてのチャンネル）

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

- `accountId` が省略された場合（CLI + ルーティング）は `default` が使用されます。
- 環境変数トークンは **デフォルト** アカウントにのみ適用されます。
- ベースチャンネル設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- 各アカウントを別のエージェントにルーティングするには `bindings[].match.accountId` を使用します。
- 単一アカウントのトップレベルチャンネル設定のまま `openclaw channels add`（またはチャンネルのオンボーディング）で非デフォルトアカウントを追加した場合、OpenClaw はまずアカウントスコープのトップレベル単一アカウント値をチャンネルアカウントマップへ昇格し、元のアカウントが引き続き動作するようにします。ほとんどのチャンネルではそれらを `channels.<channel>.accounts.default` に移動します。Matrix では、既存の一致する名前付き/デフォルトターゲットを代わりに保持できます。
- 既存のチャンネルのみのバインディング（`accountId` なし）は、引き続きデフォルトアカウントに一致します。アカウントスコープのバインディングは任意のままです。
- `openclaw doctor --fix` も、アカウントスコープのトップレベル単一アカウント値を、そのチャンネルに選ばれた昇格済みアカウントへ移動することで混在した形を修復します。ほとんどのチャンネルでは `accounts.default` を使用します。Matrix では、既存の一致する名前付き/デフォルトターゲットを代わりに保持できます。

### その他の Plugin チャンネル

多くの Plugin チャンネルは `channels.<id>` として設定され、専用のチャンネルページ（例: Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch）に記載されています。
完全なチャンネルインデックスを参照してください: [チャンネル](/ja-JP/channels)。

### グループチャットのメンションゲート

グループメッセージはデフォルトで **メンション必須**（メタデータメンションまたは安全な正規表現パターン）です。WhatsApp、Telegram、Discord、Google Chat、iMessage のグループチャットに適用されます。

表示される返信は別に制御されます。通常のグループ、チャンネル、内部 WebChat のダイレクトリクエストは、デフォルトで最終応答の自動配信になります。最終アシスタントテキストは、従来の表示返信パスを通じて投稿されます。エージェントが `message(action=send)` を呼び出した後にのみ表示出力を投稿したい場合は、`messages.visibleReplies: "message_tool"` または `messages.groupChat.visibleReplies: "message_tool"` を選択します。オプトインされたツール専用モードで、モデルがメッセージツールを呼び出さずに最終テキストを返した場合、その最終テキストは非公開のままになり、Gateway の詳細ログに抑制されたペイロードのメタデータが記録されます。

ツール専用の表示返信には、確実にツールを呼び出すモデル/ランタイムが必要で、GPT 5.5 など最新世代のモデルを使う共有の常駐ルームに推奨されます。一部の弱いモデルは最終テキストで回答できますが、ソースに表示される出力は `message(action=send)` で送信する必要があることを理解できない場合があります。そのようなモデルでは、最終アシスタントターンを表示返信パスにするために `"automatic"` を使用します。セッションログに `didSendViaMessagingTool: false` のアシスタントテキストが表示される場合、モデルはメッセージツールを呼び出す代わりに非公開の最終テキストを生成しています。そのチャンネルにはより強力なツール呼び出しモデルへ切り替えるか、抑制されたペイロード概要を Gateway の詳細ログで確認するか、すべてのグループ/チャンネルリクエストで表示される最終返信を使うために `messages.groupChat.visibleReplies: "automatic"` を設定します。

アクティブなツールポリシーの下でメッセージツールが利用できない場合、OpenClaw は応答を黙って抑制する代わりに、自動の表示返信へフォールバックします。`openclaw doctor` はこの不一致について警告します。

このルールは通常のエージェント最終テキストに適用されます。Plugin 所有の会話バインディングでは、所有 Plugin が返した返信が、要求されたバインド済みスレッドターンの表示応答として使用されます。Plugin はそれらのバインディング返信で `message(action=send)` を呼び出す必要はありません。

**トラブルシューティング: グループ @mention が入力中表示の後に無音になる（エラーなし）**

症状: グループ/チャンネルの @mention で入力中インジケーターが表示され、Gateway ログに `dispatch complete (queuedFinal=false, replies=0)` と報告されるが、ルームにメッセージが届かない。同じエージェントへの DM は通常どおり返信される。

原因: グループ/チャンネルの表示返信モードが `"message_tool"` に解決されているため、OpenClaw はターンを実行しますが、エージェントが `message(action=send)` を呼び出さない限り、最終アシスタントテキストを抑制します。このモードには `NO_REPLY` コントラクトはありません。メッセージツール呼び出しがないことは、ソース返信がないことを意味します。抑制は設定された動作であるため、エラーはありません。通常のグループとチャンネルのターンはデフォルトで `"automatic"` になるため、この症状は `messages.groupChat.visibleReplies`（またはグローバルの `messages.visibleReplies`）が明示的に `"message_tool"` に設定されている場合にのみ発生します。ハーネスの `defaultVisibleReplies` はここには適用されません — グループ/チャンネルのリゾルバーはそれを無視します。これはダイレクト/ソースチャットにのみ影響します（Codex ハーネスはその方法でダイレクトチャットの最終応答を抑制します）。

修正: より強力なツール呼び出しモデルを選ぶか、明示的な `"message_tool"` 上書きを削除して `"automatic"` デフォルトへ戻すか、すべてのグループ/チャンネルリクエストで表示返信を強制するために `messages.groupChat.visibleReplies: "automatic"` を設定します。Gateway はファイル保存後に `messages` 設定をホットリロードします。デプロイでファイル監視または設定リロードが無効化されている場合にのみ、Gateway を再起動してください。

**メンションの種類:**

- **メタデータメンション**: ネイティブプラットフォームの @-mentions。WhatsApp のセルフチャットモードでは無視されます。
- **テキストパターン**: `agents.list[].groupChat.mentionPatterns` 内の安全な正規表現パターン。無効なパターンと安全でない入れ子の繰り返しは無視されます。
- メンションゲートは、検出が可能な場合（ネイティブメンション、または少なくとも 1 つのパターンがある場合）にのみ適用されます。

```json5
{
  messages: {
    visibleReplies: "automatic", // force old automatic final replies for direct/source chats
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // always-on unmentioned room chatter becomes quiet context
      visibleReplies: "message_tool", // opt-in; require message(action=send) for visible room replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` はグローバルデフォルトを設定します。チャンネルは `channels.<channel>.historyLimit`（またはアカウントごと）で上書きできます。無効化するには `0` を設定します。

`messages.groupChat.unmentionedInbound: "room_event"` は、対応チャンネル上で、メンションされていない常時オンのグループ/チャンネルメッセージを静かなルームコンテキストとして送信します。メンションされたメッセージ、コマンド、ダイレクトメッセージはユーザーリクエストのままです。Discord、Slack、Telegram の完全な例は [常駐ルームイベント](/ja-JP/channels/ambient-room-events) を参照してください。

`messages.visibleReplies` はグローバルなソースイベントのデフォルトです。`messages.groupChat.visibleReplies` はグループ/チャンネルのソースイベントに対してこれを上書きします。`messages.visibleReplies` が未設定の場合、ダイレクト/ソースチャットは選択されたランタイムまたはハーネスのデフォルトを使用しますが、内部 WebChat のダイレクトターンは Pi/Codex のプロンプト互換性のために自動の最終配信を使用します。表示出力に `message(action=send)` を意図的に要求するには `messages.visibleReplies: "message_tool"` を設定します。チャンネル許可リストとメンションゲートは、イベントを処理するかどうかを引き続き決定します。

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

自分の番号を `allowFrom` に含めるとセルフチャットモードが有効になります（ネイティブ @-mentions を無視し、テキストパターンにのみ応答します）。

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
- このページは**設定キーリファレンス**であり、完全なコマンドカタログではありません。QQ Bot `/bot-ping` `/bot-help` `/bot-logs`、LINE `/card`、デバイスペアリング `/pair`、メモリ `/dreaming`、電話制御 `/phone`、Talk `/voice` など、チャネル/プラグインが所有するコマンドは、それぞれのチャネル/プラグインページと[スラッシュコマンド](/ja-JP/tools/slash-commands)に記載されています。
- テキストコマンドは、先頭に `/` が付いた**単独の**メッセージである必要があります。
- `native: "auto"` は Discord/Telegram のネイティブコマンドを有効にし、Slack は無効のままにします。
- `nativeSkills: "auto"` は Discord/Telegram のネイティブスキルコマンドを有効にし、Slack は無効のままにします。
- チャネルごとに上書きします: `channels.discord.commands.native`（ブール値または `"auto"`）。Discord では、`false` にすると起動時のネイティブコマンド登録とクリーンアップをスキップします。
- `channels.<provider>.commands.nativeSkills` で、チャネルごとのネイティブスキル登録を上書きします。
- `channels.telegram.customCommands` は Telegram ボットメニュー項目を追加します。
- `bash: true` はホストシェル用の `! <cmd>` を有効にします。`tools.elevated.enabled` と、`tools.elevated.allowFrom.<channel>` 内の送信者が必要です。
- `config: true` は `/config`（`openclaw.json` の読み取り/書き込み）を有効にします。Gateway `chat.send` クライアントでは、永続的な `/config set|unset` 書き込みには `operator.admin` も必要です。読み取り専用の `/config show` は、通常の書き込みスコープ付き operator クライアントでも引き続き利用できます。
- `mcp: true` は、`mcp.servers` 配下の OpenClaw 管理 MCP サーバー設定向けに `/mcp` を有効にします。
- `plugins: true` は、プラグインの検出、インストール、有効化/無効化コントロール向けに `/plugins` を有効にします。
- `channels.<provider>.configWrites` は、チャネルごとの設定変更を制御します（デフォルト: true）。
- 複数アカウントのチャネルでは、`channels.<provider>.accounts.<id>.configWrites` も、そのアカウントを対象とする書き込みを制御します（例: `/allowlist --config --account <id>` または `/config set channels.<provider>.accounts.<id>...`）。
- `restart: false` は `/restart` と Gateway 再起動ツールアクションを無効にします。デフォルト: `true`。
- `ownerAllowFrom` は、所有者専用コマンドと所有者制御のチャネルアクション向けの明示的な所有者許可リストです。これは `allowFrom` とは別です。
- `ownerDisplay: "hash"` は、システムプロンプト内の所有者 ID をハッシュ化します。ハッシュ化を制御するには `ownerDisplaySecret` を設定します。
- `allowFrom` はプロバイダーごとです。設定されている場合、それが**唯一の**認可ソースになります（チャネル許可リスト/ペアリングと `useAccessGroups` は無視されます）。
- `useAccessGroups: false` は、`allowFrom` が設定されていない場合に、コマンドがアクセスグループポリシーをバイパスできるようにします。
- コマンドドキュメントの対応:
  - 組み込み + バンドル済みカタログ: [スラッシュコマンド](/ja-JP/tools/slash-commands)
  - チャネル固有のコマンドサーフェス: [チャネル](/ja-JP/channels)
  - QQ Bot コマンド: [QQ Bot](/ja-JP/channels/qqbot)
  - ペアリングコマンド: [ペアリング](/ja-JP/channels/pairing)
  - LINE カードコマンド: [LINE](/ja-JP/channels/line)
  - メモリの Dreaming: [Dreaming](/ja-JP/concepts/dreaming)

</Accordion>

---

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference) — トップレベルキー
- [設定 — エージェント](/ja-JP/gateway/config-agents)
- [チャネル概要](/ja-JP/channels)
