---
read_when:
    - チャネル Plugin の設定 (認証、アクセス制御、マルチアカウント)
    - チャネルごとの設定キーのトラブルシューティング
    - DM ポリシー、グループポリシー、またはメンションゲーティングの監査
summary: 'チャネル設定: Slack、Discord、Telegram、WhatsApp、Matrix、iMessage などにわたるアクセス制御、ペアリング、チャネル別キー'
title: 設定 — チャンネル
x-i18n:
    generated_at: "2026-06-27T11:22:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bdc9c0b3c55f2ad6a7d6874022cdac6abbe8d0219feda3c8c9710c08e4d8fb7
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` 配下のチャンネル別設定キー。DM とグループのアクセス、
複数アカウント構成、メンションゲート、Slack、Discord、
Telegram、WhatsApp、Matrix、iMessage、およびその他のバンドル済みチャンネル Plugin 向けのチャンネル別キーを扱います。

エージェント、ツール、Gateway ランタイム、その他のトップレベルキーについては、
[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## チャンネル

各チャンネルは、その設定セクションが存在すると自動的に起動します（`enabled: false` の場合を除く）。

### DM とグループのアクセス

すべてのチャンネルは DM ポリシーとグループポリシーをサポートします。

| DM ポリシー         | 動作                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (default) | 不明な送信者には 1 回限りのペアリングコードが送られ、所有者の承認が必要 |
| `allowlist`         | `allowFrom`（またはペアリング済み許可ストア）内の送信者のみ     |
| `open`              | すべての受信 DM を許可（`allowFrom: ["*"]` が必要）             |
| `disabled`          | すべての受信 DM を無視                                          |

| グループポリシー    | 動作                                                   |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (default) | 設定済みの許可リストに一致するグループのみ             |
| `open`                | グループ許可リストをバイパス（メンションゲートは引き続き適用） |
| `disabled`            | すべてのグループ/ルームメッセージをブロック            |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が未設定の場合のデフォルトを設定します。
ペアリングコードは 1 時間後に期限切れになります。保留中の DM ペアリングリクエストは **チャンネルごとに 3 件** に制限されます。
プロバイダーブロックが完全に存在しない場合（`channels.<provider>` がない場合）、ランタイムのグループポリシーは起動時の警告付きで `allowlist`（フェイルクローズ）にフォールバックします。
</Note>

### チャンネルモデルのオーバーライド

`channels.modelByChannel` を使用して、特定のチャンネル ID またはダイレクトメッセージの相手をモデルに固定します。値には `provider/model` または設定済みモデルエイリアスを指定できます。このチャンネルマッピングは、セッションにモデルオーバーライドがまだない場合（たとえば `/model` で設定された場合）に適用されます。

グループ/スレッド会話では、キーはチャンネル固有のグループ ID、トピック ID、またはチャンネル名です。ダイレクトメッセージ（DM）会話では、キーはチャンネルの送信者 ID（`nativeDirectUserId`、`origin.from`、`origin.to`、`OriginatingTo`、`From`、または `SenderId`）から派生したピア識別子です。正確なキー形式はチャンネルによって異なります。

| チャンネル | DM キー形式        | 例                                           |
| -------- | ------------------- | -------------------------------------------- |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | 生のユーザー ID     | `123456789`                                  |
| Discord  | 生のユーザー ID     | `987654321`                                  |
| WhatsApp | 電話番号または JID  | `15551234567`                                |
| Matrix   | Matrix ユーザー ID  | `@user:matrix.org`                           |
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

### チャンネルデフォルトと Heartbeat

プロバイダー全体で共有されるグループポリシーと Heartbeat の動作には `channels.defaults` を使用します。

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
- `channels.defaults.contextVisibility`: すべてのチャンネルのデフォルト補足コンテキスト可視性モード。値: `all`（デフォルト、引用/スレッド/履歴コンテキストをすべて含める）、`allowlist`（許可リスト内の送信者からのコンテキストのみ含める）、`allowlist_quote`（allowlist と同じだが、明示的な引用/返信コンテキストは保持）。チャンネル別オーバーライド: `channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`: Heartbeat 出力に正常なチャンネルステータスを含める。
- `channels.defaults.heartbeat.showAlerts`: Heartbeat 出力に低下/エラー状態を含める。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケータースタイルの Heartbeat 出力を描画する。

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

- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、WhatsApp の DM とグループ向けの永続 ACP バインディングを設定します。`match.peer.id` には E.164 形式の直接番号または WhatsApp グループ JID を使用します。フィールドの意味は [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)で共有されています。

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

- 送信コマンドは、存在する場合はアカウント `default` をデフォルトにします。存在しない場合は、設定済みアカウント ID のうち最初のもの（ソート済み）を使用します。
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

- ボットトークン: `channels.telegram.botToken` または `channels.telegram.tokenFile`（通常ファイルのみ。シンボリックリンクは拒否）、デフォルトアカウントのフォールバックとして `TELEGRAM_BOT_TOKEN`。
- `apiRoot` は Telegram Bot API のルートのみです。`https://api.telegram.org/bot<TOKEN>` ではなく、`https://api.telegram.org` またはセルフホスト/プロキシのルートを使用してください。`openclaw doctor --fix` は、誤って末尾に付いた `/bot<TOKEN>` サフィックスを削除します。
- 任意の `channels.telegram.defaultAccount` は、設定済みアカウント ID と一致する場合、デフォルトアカウント選択をオーバーライドします。
- 複数アカウント構成（2 個以上のアカウント ID）では、フォールバックルーティングを避けるために明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定します。これが存在しない、または無効な場合、`openclaw doctor` が警告します。
- `configWrites: false` は、Telegram から開始される設定書き込み（スーパーグループ ID 移行、`/config set|unset`）をブロックします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、フォーラムトピック向けの永続 ACP バインディングを設定します（`match.peer.id` には正規の `chatId:topic:topicId` を使用）。フィールドの意味は [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)で共有されています。
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
- 明示的な Discord `token` を指定する直接のアウトバウンド呼び出しは、その呼び出しにそのトークンを使用します。アカウントのリトライ/ポリシー設定は、アクティブなランタイムスナップショットで選択されたアカウントから引き続き取得されます。
- 任意の `channels.discord.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウントの選択を上書きします。
- 配信ターゲットには `user:<id>`（DM）または `channel:<id>`（ギルドチャンネル）を使用します。裸の数値 ID は拒否されます。
- ギルドスラッグは小文字で、スペースは `-` に置換されます。チャンネルキーはスラッグ化された名前（`#` なし）を使用します。ギルド ID を優先してください。
- ボットが作成したメッセージはデフォルトで無視されます。`allowBots: true` で有効化できます。ボットにメンションしているボットメッセージだけを受け入れるには `allowBots: "mentions"` を使用します（自身のメッセージは引き続きフィルターされます）。
- ボット作成のインバウンドメッセージをサポートするチャンネルは、共有の [ボットループ保護](/ja-JP/channels/bot-loop-protection) を使用できます。ベースラインのペア予算には `channels.defaults.botLoopProtection` を設定し、特定のサーフェスで異なる制限が必要な場合だけチャンネルまたはアカウントを上書きします。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（およびチャンネル上書き）は、ボットではなく別のユーザーまたはロールにメンションしているメッセージを破棄します（@everyone/@here は除く）。
- `channels.discord.mentionAliases` は、送信前に安定したアウトバウンドの `@handle` テキストを Discord ユーザー ID にマップします。これにより、一時的なディレクトリキャッシュが空でも既知のチームメイトに決定的にメンションできます。アカウントごとの上書きは `channels.discord.accounts.<accountId>.mentionAliases` 配下にあります。
- `maxLinesPerMessage`（デフォルト 17）は、2000 文字未満でも縦に長いメッセージを分割します。
- `channels.discord.suppressEmbeds` のデフォルトは `true` なので、無効化しない限りアウトバウンド URL は Discord リンクプレビューに展開されません。明示的な `embeds` ペイロードは通常どおり送信されます。メッセージごとのツール呼び出しでは `suppressEmbeds` で上書きできます。
- `channels.discord.threadBindings` は Discord のスレッドバインド型ルーティングを制御します。
  - `enabled`: スレッドバインド型セッション機能（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびバインド済み配信/ルーティング）に対する Discord 上書き
  - `idleHours`: 非アクティブ時の自動フォーカス解除時間に対する Discord 上書き（時間単位、`0` で無効）
  - `maxAgeHours`: 強制最大有効期間に対する Discord 上書き（時間単位、`0` で無効）
  - `spawnSessions`: `sessions_spawn({ thread: true })` と ACP スレッド生成時の自動スレッド作成/バインドのスイッチ（デフォルト: `true`）
  - `defaultSpawnContext`: スレッドバインド型生成のネイティブサブエージェントコンテキスト（デフォルトは `"fork"`）
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、チャンネルとスレッドの永続 ACP バインドを設定します（`match.peer.id` にはチャンネル/スレッド ID を使用）。フィールドの意味は [ACP Agents](/ja-JP/tools/acp-agents#persistent-channel-bindings) で共有されています。
- `channels.discord.ui.components.accentColor` は Discord components v2 コンテナのアクセントカラーを設定します。
- `channels.discord.agentComponents.ttlMs` は、送信済み Discord コンポーネントコールバックの登録を保持する時間を制御します。デフォルトは `1800000`（30 分）、最大値は `86400000`（24 時間）で、アカウントごとの上書きは `channels.discord.accounts.<accountId>.agentComponents.ttlMs` 配下にあります。値を長くすると古いボタン/セレクト/フォームをより長く使用できるため、ワークフローに合う最短の TTL を優先してください。
- `channels.discord.voice` は Discord ボイスチャンネル会話と、任意の自動参加 + LLM + TTS 上書きを有効化します。テキストのみの Discord 設定では、デフォルトで音声はオフのままです。オプトインするには `channels.discord.voice.enabled=true` を設定します。
- `channels.discord.voice.model` は、Discord ボイスチャンネル応答に使用する LLM モデルを任意で上書きします。
- `channels.discord.voice.daveEncryption` と `channels.discord.voice.decryptionFailureTolerance` は `@discordjs/voice` DAVE オプションにそのまま渡されます（デフォルトは `true` と `24`）。
- `channels.discord.voice.connectTimeoutMs` は、`/vc join` と自動参加試行に対する初回の `@discordjs/voice` Ready 待機を制御します（デフォルトは `30000`）。
- `channels.discord.voice.reconnectGraceMs` は、切断された音声セッションが再接続シグナリングに入るまで OpenClaw が待つ時間を制御します（デフォルトは `15000`）。
- Discord 音声再生は、別ユーザーの発話開始イベントによって中断されません。フィードバックループを避けるため、OpenClaw は TTS 再生中の新しい音声キャプチャを無視します。
- OpenClaw はさらに、復号失敗が繰り返された後に音声セッションから退出/再参加することで、音声受信の復旧を試みます。
- `channels.discord.streaming` は正規のストリームモードキーです。Discord のデフォルトは `streaming.mode: "progress"` なので、ツール/作業の進捗は編集済みの 1 つのプレビューメッセージに表示されます。無効化するには `streaming.mode: "off"` を設定します。レガシーの `streamMode` と boolean の `streaming` 値はランタイムエイリアスとして残っています。永続化された設定を書き換えるには `openclaw doctor --fix` を実行してください。
- `channels.discord.autoPresence` はランタイム可用性をボットプレゼンスにマップし（healthy => online、degraded => idle、exhausted => dnd）、任意のステータステキスト上書きを許可します。
- `channels.discord.dangerouslyAllowNameMatching` は、可変の名前/タグ照合を再有効化します（緊急互換モード）。
- `channels.discord.execApprovals`: Discord ネイティブの exec 承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。auto モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効化されます。
  - `approvers`: exec リクエストの承認を許可された Discord ユーザー ID。省略時は `commands.ownerAllowFrom` にフォールバックします。
  - `agentFilter`: 任意のエージェント ID 許可リスト。省略するとすべてのエージェントの承認を転送します。
  - `sessionFilter`: 任意のセッションキーのパターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）は承認者の DM に送信し、`"channel"` は元のチャンネルに送信し、`"both"` は両方に送信します。ターゲットに `"channel"` が含まれる場合、ボタンは解決済み承認者だけが使用できます。
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
- 配信ターゲットには `spaces/<spaceId>` または `users/<userId>` を使用します。
- `channels.googlechat.dangerouslyAllowNameMatching` は、可変のメールプリンシパル照合を再有効化します（緊急互換モード）。

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

- **ソケットモード**には `botToken` と `appToken` の両方が必要です（デフォルトアカウントの env フォールバックでは `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP モード**には `botToken` に加えて `signingSecret`（ルートまたはアカウントごと）が必要です。
- `socketMode` は Slack SDK Socket Mode トランスポートのチューニングを公開 Bolt receiver API に渡します。ping/pong タイムアウトや古い websocket の挙動を調査するときだけ使用してください。`clientPingTimeout` のデフォルトは `15000` です。`serverPingTimeout` と `pingPongLoggingEnabled` は設定されている場合だけ渡されます。
- `botToken`、`appToken`、`signingSecret`、`userToken` はプレーンテキスト
  文字列または SecretRef オブジェクトを受け付けます。
- Slack アカウントスナップショットは、`botTokenSource`、`botTokenStatus`、`appTokenStatus`、HTTP モードでは
  `signingSecretStatus` など、認証情報ごとのソース/ステータスフィールドを公開します。`configured_unavailable` は、アカウントが
  SecretRef 経由で設定されているものの、現在のコマンド/ランタイムパスで
  シークレット値を解決できなかったことを意味します。
- `configWrites: false` は Slack 起点の設定書き込みをブロックします。
- 任意の `channels.slack.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- `channels.slack.streaming.mode` は正規の Slack ストリームモードキーです。`channels.slack.streaming.nativeTransport` は Slack のネイティブストリーミングトランスポートを制御します。従来の `streamMode`、boolean の `streaming`、`nativeStreaming` 値はランタイムエイリアスとして残っています。永続化された設定を書き換えるには `openclaw doctor --fix` を実行してください。
- `unfurlLinks` と `unfurlMedia` は、ボット返信用に Slack の `chat.postMessage` のリンクおよびメディア unfurl boolean を渡します。`unfurlLinks` のデフォルトは `false` で、有効化しない限り送信ボットリンクはインライン展開されません。`unfurlMedia` は設定されていない限り省略されます。1 つのアカウントでトップレベル値を上書きするには、いずれかの値を `channels.slack.accounts.<accountId>` に設定します。
- 配信ターゲットには `user:<id>`（DM）または `channel:<id>` を使用します。

**リアクション通知モード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` 由来）。

**スレッドセッション分離:** `thread.historyScope` はスレッドごと（デフォルト）またはチャンネル全体で共有です。`thread.inheritParent` は親チャンネルのトランスクリプトを新しいスレッドにコピーします。

- Slack ネイティブストリーミングと Slack アシスタント形式の「is typing...」スレッドステータスには、返信スレッドターゲットが必要です。トップレベル DM はデフォルトでスレッド外のままなので、スレッド形式のネイティブストリーム/ステータスプレビューを表示する代わりに、Slack のドラフト投稿および編集プレビュー経由でストリーミングできます。
- `typingReaction` は、返信の実行中に受信 Slack メッセージへ一時的なリアクションを追加し、完了時に削除します。`"hourglass_flowing_sand"` のような Slack 絵文字ショートコードを使用してください。
- `channels.slack.execApprovals`: Slack ネイティブの承認クライアント配信と exec 承認者認可。Discord と同じスキーマです: `enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack ユーザー ID）、`agentFilter`、`sessionFilter`、`target`（`"dm"`、`"channel"`、または `"both"`）。Slack Plugin 承認者が解決される場合、Plugin 承認は Slack 起点リクエストにこのネイティブクライアントパスを使用できます。Slack ネイティブの Plugin 承認配信は、Slack 起点セッションまたは Slack ターゲット向けに `approvals.plugin` から有効化することもできます。Plugin 承認は `allowFrom` とデフォルトルーティングの Slack Plugin 承認者を使用し、exec 承認者は使用しません。

| アクショングループ | デフォルト | メモ                   |
| ------------ | ------- | ---------------------- |
| reactions    | 有効 | リアクションを付ける + リアクションを一覧表示 |
| messages     | 有効 | 読み取り/送信/編集/削除  |
| pins         | 有効 | ピン留め/ピン解除/一覧表示         |
| memberInfo   | 有効 | メンバー情報            |
| emojiList    | 有効 | カスタム絵文字一覧      |

### Mattermost

Mattermost は現在の OpenClaw リリースではバンドル Plugin として同梱されています。古いビルドや
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
- `commands.callbackUrl` は OpenClaw gateway エンドポイントに解決され、Mattermost サーバーから到達可能である必要があります。
- ネイティブ slash コールバックは、slash コマンド登録時に Mattermost から返されるコマンドごとのトークンで認証されます。登録に失敗した場合、または
  コマンドがアクティブ化されていない場合、OpenClaw は
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

OpenClaw は `imsg rpc`（stdio 経由の JSON-RPC）を起動します。デーモンやポートは不要です。ホストが Messages データベースと Automation の権限を付与できる場合、新しい OpenClaw iMessage セットアップではこれが推奨パスです。

BlueBubbles サポートは削除されました。現在の OpenClaw では、`channels.bluebubbles` はサポート対象のランタイム設定サーフェスではありません。古い設定は `channels.imessage` に移行してください。短い説明は [BlueBubbles removal and the imsg iMessage path](/ja-JP/announcements/bluebubbles-imessage) を、完全な変換表は [Coming from BlueBubbles](/ja-JP/channels/imessage-from-bluebubbles) を参照してください。

Gateway がサインイン済みの Messages Mac 上で実行されていない場合は、`channels.imessage.enabled=true` のままにし、`channels.imessage.cliPath` をその Mac 上で `imsg "$@"` を実行する SSH ラッパーに設定します。デフォルトのローカル `imsg` パスは macOS 専用です。

本番送信で SSH ラッパーに依存する前に、その正確なラッパー経由で送信 `imsg send` を検証してください。一部の macOS TCC 状態では Messages Automation が `/usr/libexec/sshd-keygen-wrapper` に割り当てられ、読み取りやプローブは機能しても、送信が AppleEvents `-1743` で失敗する場合があります。詳しくは [SSH wrapper sends fail with AppleEvents -1743](/ja-JP/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743) を参照してください。

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
- `cliPath` は SSH ラッパーを指せます。SCP 添付ファイル取得には `remoteHost`（`host` または `user@host`）を設定します。
- `attachmentRoots` と `remoteAttachmentRoots` は受信添付ファイルパスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCP は厳格なホストキー確認を使用するため、リレーホストキーがすでに `~/.ssh/known_hosts` に存在することを確認してください。
- `channels.imessage.configWrites`: iMessage 起点の設定書き込みを許可または拒否します。
- `channels.imessage.sendTransport`: 通常の送信返信に使う優先 `imsg` RPC 送信トランスポート。`auto`（デフォルト）は、既存チャットについて IMCore ブリッジが実行中ならそれを使用し、その後 AppleScript にフォールバックします。`bridge` は private-API 配信を要求します。`applescript` は公開 Messages automation パスを強制します。
- `channels.imessage.actions.*`: `imsg status` / `openclaw channels status --probe` によってもゲートされる private API アクションを有効化します。
- `channels.imessage.includeAttachments` はデフォルトでオフです。エージェントターンで受信メディアを期待する前に `true` に設定してください。
- ブリッジ/gateway 再起動後の受信復旧は自動です（GUID 重複排除に加えて古いバックログ年齢フェンス）。既存の `channels.imessage.catchup.enabled: true` 設定は、非推奨の互換プロファイルとして引き続き尊重されます。
- `channels.imessage.groups`: グループレジストリとグループごとの設定。`groupPolicy: "allowlist"` では、グループメッセージがレジストリゲートを通過できるように、明示的な `chat_id` キーまたは `"*"` ワイルドカードエントリのいずれかを設定します。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、iMessage 会話を永続 ACP セッションにバインドできます。`match.peer.id` には正規化済みハンドルまたは明示的なチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共有フィールドのセマンティクス: [ACP Agents](/ja-JP/tools/acp-agents#persistent-channel-bindings)。

<Accordion title="iMessage SSH ラッパー例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix は Plugin バックで、`channels.matrix` 配下に設定します。

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
- `channels.matrix.proxy` は Matrix HTTP トラフィックを明示的な HTTP(S) プロキシ経由でルーティングします。名前付きアカウントは `channels.matrix.accounts.<id>.proxy` でこれを上書きできます。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` はプライベート/内部 homeserver を許可します。`proxy` とこのネットワークのオプトインは独立した制御です。
- `channels.matrix.defaultAccount` はマルチアカウント構成で優先アカウントを選択します。
- `channels.matrix.autoJoin` のデフォルトは `off` なので、`autoJoinAllowlist` とともに `autoJoin: "allowlist"` を設定するか、`autoJoin: "always"` を設定するまで、招待されたルームや新しい DM 形式の招待は無視されます。
- `channels.matrix.execApprovals`: Matrix ネイティブの exec 承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。自動モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効になります。
  - `approvers`: exec リクエストの承認を許可された Matrix ユーザー ID（例: `@owner:example.org`）。
  - `agentFilter`: 任意のエージェント ID allowlist。省略すると、すべてのエージェントの承認を転送します。
  - `sessionFilter`: 任意のセッションキーパターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）、`"channel"`（送信元ルーム）、または `"both"`。
  - アカウントごとの上書き: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` は Matrix DM をどのようにセッションへグループ化するかを制御します。`per-user`（デフォルト）はルーティングされた相手ごとに共有し、`per-room` は各 DM ルームを分離します。
- Matrix ステータスプローブとライブディレクトリ検索は、ランタイムトラフィックと同じプロキシポリシーを使用します。
- Matrix の完全な設定、ターゲット指定ルール、セットアップ例は [Matrix](/ja-JP/channels/matrix) に記載されています。

### Microsoft Teams

Microsoft Teams は Plugin によって支えられ、`channels.msteams` 配下で設定されます。

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
- Teams の完全な設定（認証情報、webhook、DM/グループポリシー、チームごと/チャンネルごとの上書き）は [Microsoft Teams](/ja-JP/channels/msteams) に記載されています。

### IRC

IRC は Plugin によって支えられ、`channels.irc` 配下で設定されます。

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
- 任意の `channels.irc.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- IRC チャンネルの完全な設定（host/port/TLS/channels/allowlists/mention gating）は [IRC](/ja-JP/channels/irc) に記載されています。

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

- `accountId` が省略された場合（CLI + ルーティング）、`default` が使用されます。
- 環境変数トークンは **デフォルト** アカウントにのみ適用されます。
- ベースチャンネル設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- 各アカウントを別のエージェントにルーティングするには、`bindings[].match.accountId` を使用します。
- 単一アカウントのトップレベルチャンネル設定のまま、`openclaw channels add`（またはチャンネルオンボーディング）で非デフォルトアカウントを追加すると、OpenClaw はまずアカウントスコープのトップレベル単一アカウント値をチャンネルアカウントマップへ昇格させるため、元のアカウントは動作し続けます。ほとんどのチャンネルではそれらを `channels.<channel>.accounts.default` に移動します。Matrix は代わりに既存の一致する名前付き/デフォルトターゲットを保持できます。
- 既存のチャンネルのみのバインディング（`accountId` なし）はデフォルトアカウントに引き続き一致します。アカウントスコープのバインディングは任意のままです。
- `openclaw doctor --fix` も、そのチャンネルで選択された昇格先アカウントへアカウントスコープのトップレベル単一アカウント値を移動することで、混在した形状を修復します。ほとんどのチャンネルは `accounts.default` を使用します。Matrix は代わりに既存の一致する名前付き/デフォルトターゲットを保持できます。

### その他の Plugin チャンネル

多くの Plugin チャンネルは `channels.<id>` として設定され、専用のチャンネルページに記載されています（例: Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch）。
完全なチャンネル一覧を参照してください: [チャンネル](/ja-JP/channels)。

### グループチャットのメンション制御

グループメッセージのデフォルトは **メンション必須**（メタデータメンションまたは安全な正規表現パターン）です。WhatsApp、Telegram、Discord、Google Chat、iMessage のグループチャットに適用されます。

表示される返信は別に制御されます。通常のグループ、チャンネル、内部 WebChat の直接リクエストは、デフォルトで最終応答の自動配信になります。最終的なアシスタントテキストは従来の表示返信パスを通じて投稿されます。エージェントが `message(action=send)` を呼び出した後にのみ表示出力を投稿したい場合は、`messages.visibleReplies: "message_tool"` または `messages.groupChat.visibleReplies: "message_tool"` にオプトインします。オプトインしたツール専用モードで、モデルが message ツールを呼び出さずに最終テキストを返した場合、その最終テキストは非公開のままとなり、gateway 詳細ログには抑制されたペイロードのメタデータが記録されます。

ツール専用の表示返信には、ツールを確実に呼び出すモデル/ランタイムが必要であり、GPT 5.5 などの最新世代モデルを使う共有の周辺ルームに推奨されます。一部の弱いモデルは最終テキストで回答できますが、ソースに表示される出力を `message(action=send)` で送信する必要があることを理解できない場合があります。そうしたモデルでは、最終アシスタントターンを表示返信パスにするために `"automatic"` を使用します。セッションログに `didSendViaMessagingTool: false` のアシスタントテキストが表示される場合、モデルは message ツールを呼び出す代わりに非公開の最終テキストを生成しています。そのチャンネルにはより強力なツール呼び出しモデルへ切り替えるか、抑制されたペイロードの要約を gateway 詳細ログで確認するか、すべてのグループ/チャンネルリクエストで表示される最終返信を使用するために `messages.groupChat.visibleReplies: "automatic"` を設定します。

有効なツールポリシーの下で message ツールを利用できない場合、OpenClaw は応答を黙って抑制するのではなく、自動の表示返信へフォールバックします。`openclaw doctor` はこの不一致について警告します。

このルールは通常のエージェント最終テキストに適用されます。Plugin 所有の会話バインディングでは、所有 Plugin が返した返信を、クレームされたバインドスレッドターンの表示応答として使用します。その Plugin はそれらのバインディング返信のために `message(action=send)` を呼び出す必要はありません。

**トラブルシューティング: グループの @mention が入力中表示の後に無音になる（エラーなし）**

症状: グループ/チャンネルの @mention で入力中インジケーターが表示され、gateway ログに `dispatch complete (queuedFinal=false, replies=0)` と報告されるが、ルームにメッセージが届かない。同じエージェントへの DM は通常どおり返信する。

原因: グループ/チャンネルの表示返信モードが `"message_tool"` に解決されるため、OpenClaw はターンを実行しますが、エージェントが `message(action=send)` を呼び出さない限り、最終アシスタントテキストを抑制します。このモードには `NO_REPLY` 契約はありません。message ツール呼び出しがないことは、ソースへの返信がないことを意味します。抑制は設定された動作なので、エラーはありません。通常のグループおよびチャンネルターンのデフォルトは `"automatic"` なので、この症状は `messages.groupChat.visibleReplies`（またはグローバルの `messages.visibleReplies`）が明示的に `"message_tool"` に設定されている場合にのみ発生します。ハーネスの `defaultVisibleReplies` はここには適用されません。グループ/チャンネルのリゾルバーはこれを無視します。これは直接/ソースチャットにのみ影響します（Codex ハーネスはこの方法で直接チャットの最終応答を抑制します）。

修正: より強力なツール呼び出しモデルを選ぶか、明示的な `"message_tool"` 上書きを削除して `"automatic"` デフォルトへ戻すか、すべてのグループ/チャンネルリクエストで表示返信を強制するために `messages.groupChat.visibleReplies: "automatic"` を設定します。gateway はファイル保存後に `messages` 設定をホットリロードします。デプロイでファイル監視または設定リロードが無効になっている場合にのみ、gateway を再起動してください。

**メンションの種類:**

- **メタデータメンション**: ネイティブプラットフォームの @-mentions。WhatsApp のセルフチャットモードでは無視されます。
- **テキストパターン**: `agents.list[].groupChat.mentionPatterns` の安全な正規表現パターン。無効なパターンと安全でない入れ子の繰り返しは無視されます。
- メンション制御は、検出が可能な場合（ネイティブメンションまたは少なくとも 1 つのパターン）にのみ適用されます。

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

`messages.groupChat.historyLimit` はグローバルデフォルトを設定します。チャンネルは `channels.<channel>.historyLimit`（またはアカウントごと）で上書きできます。無効にするには `0` を設定します。

`messages.groupChat.unmentionedInbound: "room_event"` は、対応チャンネルで、メンションされていない常時オンのグループ/チャンネルメッセージを静かなルームコンテキストとして送信します。メンションされたメッセージ、コマンド、直接メッセージはユーザーリクエストのままです。Discord、Slack、Telegram の完全な例については [周辺ルームイベント](/ja-JP/channels/ambient-room-events) を参照してください。

`messages.visibleReplies` はグローバルなソースイベントのデフォルトです。`messages.groupChat.visibleReplies` はグループ/チャンネルのソースイベントでこれを上書きします。`messages.visibleReplies` が未設定の場合、直接/ソースチャットは選択されたランタイムまたはハーネスのデフォルトを使用しますが、内部 WebChat の直接ターンは Pi/Codex のプロンプト互換性のために自動最終配信を使用します。表示出力に `message(action=send)` を意図的に要求するには、`messages.visibleReplies: "message_tool"` を設定します。チャンネル allowlist とメンション制御は、イベントを処理するかどうかを引き続き決定します。

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

解決順序: DM ごとの上書き → プロバイダーのデフォルト → 制限なし（すべて保持）。

対応: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### セルフチャットモード

セルフチャットモードを有効にするには、自分の番号を `allowFrom` に含めます（ネイティブ @-mentions は無視し、テキストパターンにのみ応答します）。

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

<Accordion title="Command details">

- このブロックはコマンドサーフェスを設定します。現在の組み込み + バンドル済みコマンドカタログについては、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。
- このページは**設定キーリファレンス**であり、完全なコマンドカタログではありません。QQ Bot `/bot-ping` `/bot-help` `/bot-logs`、LINE `/card`、device-pair `/pair`、memory `/dreaming`、phone-control `/phone`、Talk `/voice` などのチャンネル/Plugin 所有コマンドは、それぞれのチャンネル/Plugin ページと[スラッシュコマンド](/ja-JP/tools/slash-commands)に記載されています。
- テキストコマンドは、先頭に `/` を付けた**単独の**メッセージである必要があります。
- `native: "auto"` は Discord/Telegram のネイティブコマンドを有効にし、Slack はオフのままにします。
- `nativeSkills: "auto"` は Discord/Telegram のネイティブ Skills コマンドを有効にし、Slack はオフのままにします。
- チャンネルごとに上書きできます: `channels.discord.commands.native` (bool または `"auto"`)。Discord では、`false` にすると起動中のネイティブコマンド登録とクリーンアップをスキップします。
- チャンネルごとのネイティブ Skills 登録は `channels.<provider>.commands.nativeSkills` で上書きします。
- `channels.telegram.customCommands` は追加の Telegram ボットメニュー項目を追加します。
- `bash: true` はホストシェル用の `! <cmd>` を有効にします。`tools.elevated.enabled` と、`tools.elevated.allowFrom.<channel>` 内の送信者が必要です。
- `config: true` は `/config` (`openclaw.json` の読み書き) を有効にします。Gateway `chat.send` クライアントでは、永続的な `/config set|unset` 書き込みには `operator.admin` も必要です。読み取り専用の `/config show` は、通常の書き込みスコープを持つ operator クライアントでも引き続き利用できます。
- `mcp: true` は、`mcp.servers` 配下の OpenClaw 管理 MCP サーバー設定用に `/mcp` を有効にします。
- `plugins: true` は、Plugin の検出、インストール、有効化/無効化コントロール用に `/plugins` を有効にします。
- `channels.<provider>.configWrites` はチャンネルごとの設定変更をゲートします (デフォルト: true)。
- マルチアカウントチャンネルでは、`channels.<provider>.accounts.<id>.configWrites` も、そのアカウントを対象とする書き込みをゲートします (例: `/allowlist --config --account <id>` または `/config set channels.<provider>.accounts.<id>...`)。
- `restart: false` は `/restart` と Gateway 再起動ツールアクションを無効にします。デフォルト: `true`。
- `ownerAllowFrom` は、owner 専用コマンドと owner ゲート付きチャンネルアクション用の明示的な owner 許可リストです。`allowFrom` とは別です。
- `ownerDisplay: "hash"` はシステムプロンプト内の owner ID をハッシュ化します。ハッシュ化を制御するには `ownerDisplaySecret` を設定します。
- `allowFrom` はプロバイダーごとです。設定されている場合、それが**唯一の**認可ソースになります (チャンネル許可リスト/ペアリングと `useAccessGroups` は無視されます)。
- `useAccessGroups: false` は、`allowFrom` が設定されていない場合に、コマンドがアクセスグループポリシーをバイパスできるようにします。
- コマンドドキュメントの対応表:
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
- [設定 — エージェント](/ja-JP/gateway/config-agents)
- [チャンネル概要](/ja-JP/channels)
