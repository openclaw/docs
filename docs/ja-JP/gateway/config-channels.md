---
read_when:
    - チャネル Plugin の設定（認証、アクセス制御、マルチアカウント）
    - チャネル別設定キーのトラブルシューティング
    - DM ポリシー、グループポリシー、またはメンションゲートの監査
summary: 'チャネル設定: Slack、Discord、Telegram、WhatsApp、Matrix、iMessage などにわたるアクセス制御、ペアリング、チャネルごとのキー'
title: 設定 — チャンネル
x-i18n:
    generated_at: "2026-07-05T11:23:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26a8920ee55a2e9985425dad6b982a62b61877bde5bb8fcf6ce5e172bf7fb36e
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` 配下のチャンネル別設定キー: DM とグループアクセス、複数アカウント構成、メンションゲート、Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、その他のチャンネル Plugin 向けのチャンネル別キー。

エージェント、ツール、Gateway ランタイム、その他のトップレベルキーについては、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## チャンネル

各チャンネルは、設定セクションが存在すると自動的に起動します（`enabled: false` の場合を除く）。Telegram と iMessage はコアの `openclaw` パッケージ内に同梱されています。その他の公式チャンネル（Discord、Slack、WhatsApp、Matrix、Microsoft Teams、IRC、Google Chat、Signal、Mattermost など）は、`openclaw plugins install <spec>` で個別のプラグインとしてインストールします。完全な一覧とインストール仕様については、[チャンネル](/ja-JP/channels)を参照してください。

### DM とグループアクセス

すべてのチャンネルは DM ポリシーとグループポリシーに対応しています。

| DM ポリシー          | 動作                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (default) | 不明な送信者には一度限りのペアリングコードを返し、所有者の承認が必要 |
| `allowlist`         | `allowFrom` 内の送信者（またはペアリング済み許可ストア）のみ     |
| `open`              | すべての受信 DM を許可（`allowFrom: ["*"]` が必要）              |
| `disabled`          | すべての受信 DM を無視                                          |

| グループポリシー      | 動作                                                     |
| --------------------- | -------------------------------------------------------- |
| `allowlist` (default) | 設定された許可リストに一致するグループのみ               |
| `open`                | グループ許可リストをバイパス（メンションゲートは引き続き適用） |
| `disabled`            | すべてのグループ/ルームメッセージをブロック              |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が未設定の場合のデフォルトを設定します。
ペアリングコードは 1 時間後に期限切れになります。保留中のペアリングリクエストは **アカウントごとに 3 件** までに制限されます（チャンネルとアカウント ID ごとのスコープ）。
プロバイダーブロック全体が欠落している場合（`channels.<provider>` が存在しない場合）、ランタイムのグループポリシーは起動時の警告とともに `allowlist`（フェイルクローズ）へフォールバックします。
</Note>

### チャンネルモデルのオーバーライド

`channels.modelByChannel` を使用して、特定のチャンネル ID またはダイレクトメッセージのピアをモデルに固定します。値には `provider/model` または設定済みのモデルエイリアスを指定できます。チャンネルマッピングは、セッションに有効なモデルオーバーライドがまだ存在しない場合にのみ適用されます（たとえば `/model` で設定されたもの）。

グループ/スレッド会話では、キーはチャンネル固有のグループ ID、トピック ID、またはチャンネル名です。ダイレクトメッセージ（DM）会話では、キーはチャンネルの送信者 ID（`nativeDirectUserId`、`origin.from`、`origin.to`、`OriginatingTo`、`From`、または `SenderId`）から派生したピア識別子です。正確なキー形式はチャンネルによって異なります。

| チャンネル | DM キー形式         | 例                                           |
| -------- | ------------------- | -------------------------------------------- |
| Discord  | 生のユーザー ID     | `987654321`                                  |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | Matrix ユーザー ID  | `@user:matrix.org`                           |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | 生のユーザー ID     | `123456789`                                  |
| WhatsApp | 電話番号または JID  | `15551234567`                                |

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
- `channels.defaults.contextVisibility`: すべてのチャンネルに対する補足コンテキスト表示モードのデフォルト。値: `all`（デフォルト、引用/スレッド/履歴コンテキストをすべて含める）、`allowlist`（許可リスト内の送信者からのコンテキストのみ含める）、`allowlist_quote`（allowlist と同じだが明示的な引用/返信コンテキストは保持）。チャンネル別オーバーライド: `channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`: 正常なチャンネルステータスを Heartbeat 出力に含める（デフォルトは `false`）。
- `channels.defaults.heartbeat.showAlerts`: 劣化/エラーステータスを Heartbeat 出力に含める（デフォルトは `true`）。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケータ形式の Heartbeat 出力をレンダリングする（デフォルトは `true`）。

### WhatsApp

WhatsApp は Gateway の Web チャンネル（Baileys Web）経由で動作します。リンク済みセッションが存在すると自動的に起動します。

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
      maxMs: 30000,
      factor: 1.8,
      jitter: 0.25,
      maxAttempts: 12, // 0 = retry forever
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

- `web.whatsapp.keepAliveIntervalMs`（デフォルト `25000`）、`connectTimeoutMs`（デフォルト `60000`）、`defaultQueryTimeoutMs`（デフォルト `60000`）は Baileys ソケットを調整します。
- `web.reconnect` のデフォルト: `initialMs: 2000`、`maxMs: 30000`、`factor: 1.8`、`jitter: 0.25`、`maxAttempts: 12`。`maxAttempts: 0` は諦める代わりに永続的に再試行します。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、WhatsApp DM とグループ向けの永続的な ACP バインディングを設定します。`match.peer.id` には E.164 の直通番号または WhatsApp グループ JID を使用します。フィールドの意味は [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)で共有されています。

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

- 送信コマンドは、存在する場合はデフォルトでアカウント `default` を使用し、存在しない場合は最初に設定されたアカウント ID（ソート順）を使用します。
- 任意の `channels.whatsapp.defaultAccount` は、設定済みアカウント ID と一致する場合に、そのフォールバックデフォルトアカウント選択をオーバーライドします。
- レガシーな単一アカウント Baileys 認証ディレクトリは、`openclaw doctor` によって `whatsapp/default` に移行されます。
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
      trustedLocalFileRoots: ["/srv/telegram-bot-api-data"],
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot トークン: `channels.telegram.botToken` または `channels.telegram.tokenFile`（通常ファイルのみ。シンボリックリンクは拒否）、デフォルトアカウントのフォールバックとして `TELEGRAM_BOT_TOKEN`。
- `apiRoot` は Telegram Bot API のルートのみです。`https://api.telegram.org/bot<TOKEN>` ではなく、`https://api.telegram.org` またはセルフホスト/プロキシのルートを使用してください。`openclaw doctor --fix` は誤って付いた末尾の `/bot<TOKEN>` サフィックスを削除します。
- `--local` モードのセルフホスト Bot API サーバーでは、`trustedLocalFileRoots` に OpenClaw が読み取れるホストパスを列挙します。サーバーデータボリュームを OpenClaw ホストにマウントし、そのデータルートまたはトークン別ディレクトリのいずれかを設定してください。`/var/lib/telegram-bot-api` 配下のコンテナパスはそれらのルートにマッピングされます。その他の絶対パスは引き続き拒否されます。
- 任意の `channels.telegram.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択をオーバーライドします。
- 複数アカウント構成（2 個以上のアカウント ID）では、フォールバックルーティングを避けるため、明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定します。これが欠落しているか無効な場合、`openclaw doctor` が警告します。
- `configWrites: false` は、Telegram から開始される設定書き込み（スーパーグループ ID 移行、`/config set|unset`）をブロックします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、フォーラムトピック向けの永続的な ACP バインディングを設定します（`match.peer.id` には正規形式の `chatId:topic:topicId` を使用）。フィールドの意味は [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)で共有されています。
- Telegram ストリームプレビューは `sendMessage` + `editMessageText` を使用します（ダイレクトチャットとグループチャットで動作）。
- `network.dnsResultOrder` は、一般的な IPv6 の fetch 失敗を避けるため、デフォルトで `"ipv4first"` になります。
- 再試行ポリシー: [再試行ポリシー](/ja-JP/concepts/retry)を参照してください。

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

- Token: `channels.discord.token`。デフォルトアカウントのフォールバックとして `DISCORD_BOT_TOKEN` を使用します。
- 明示的な Discord `token` を指定する直接アウトバウンド呼び出しでは、その呼び出しにそのトークンを使用します。アカウントのリトライ/ポリシー設定は、アクティブなランタイムスナップショットで選択されたアカウントから引き続き取得されます。
- オプションの `channels.discord.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウントの選択を上書きします。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` (ギルドチャンネル) を使用します。裸の数値 ID は拒否されます。
- ギルドスラッグは小文字で、スペースは `-` に置き換えます。チャンネルキーはスラッグ化した名前 (`#` なし) を使用します。ギルド ID を推奨します。
- ボットが作成したメッセージはデフォルトで無視されます。`allowBots: true` で有効化します。ボットにメンションしているボットメッセージのみを受け入れるには `allowBots: "mentions"` を使用します (自身のメッセージは引き続きフィルターされます)。
- ボット作成のインバウンドメッセージをサポートするチャンネルでは、共有の[ボットループ保護](/ja-JP/channels/bot-loop-protection)を使用できます。基準となるペア予算は `channels.defaults.botLoopProtection` に設定し、別の制限が必要なサーフェスがある場合にのみチャンネルまたはアカウントで上書きします。
- `channels.discord.guilds.<id>.ignoreOtherMentions` (およびチャンネル上書き) は、別のユーザーまたはロールにメンションしているがボットにはメンションしていないメッセージを破棄します (@everyone/@here を除く)。
- `channels.discord.mentionAliases` は、送信前に安定したアウトバウンド `@handle` テキストを Discord ユーザー ID にマップします。これにより、一時的なディレクトリキャッシュが空でも既知のチームメイトに決定論的にメンションできます。アカウントごとの上書きは `channels.discord.accounts.<accountId>.mentionAliases` 配下にあります。
- `maxLinesPerMessage` (デフォルト `17`) は、2000 文字未満でも縦に長いメッセージを分割します。
- `channels.discord.suppressEmbeds` のデフォルトは `true` なので、無効化しない限りアウトバウンド URL は Discord リンクプレビューに展開されません。明示的な `embeds` ペイロードは通常どおり送信されます。メッセージごとのツール呼び出しでは `suppressEmbeds` で上書きできます。
- `channels.discord.threadBindings` は Discord スレッドバインドのルーティングを制御します:
  - `enabled`: スレッドバインドセッション機能 (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびバインドされた配信/ルーティング) の Discord 上書き
  - `idleHours`: 非アクティブ時の自動フォーカス解除時間の Discord 上書き (`0` で無効)
  - `maxAgeHours`: ハード最大経過時間の Discord 上書き (`0` で無効)
  - `spawnSessions`: `sessions_spawn({ thread: true })` および ACP スレッド生成の自動スレッド作成/バインドのスイッチ (デフォルト: `true`)
  - `defaultSpawnContext`: スレッドバインド生成のネイティブサブエージェントコンテキスト (デフォルトは `"fork"`)
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、チャンネルとスレッドの永続 ACP バインドを設定します (`match.peer.id` にはチャンネル/スレッド ID を使用)。フィールドのセマンティクスは [ACP Agents](/ja-JP/tools/acp-agents#persistent-channel-bindings) で共有されています。
- `channels.discord.ui.components.accentColor` は Discord コンポーネント v2 コンテナのアクセントカラーを設定します。
- `channels.discord.agentComponents.ttlMs` は、送信済み Discord コンポーネントのコールバックが登録されたままになる時間を制御します。デフォルトは `1800000` (30 分)、最大は `86400000` (24 時間) です。アカウントごとの上書きは `channels.discord.accounts.<accountId>.agentComponents.ttlMs` 配下にあります。ワークフローに合う最短の TTL を推奨します。
- `channels.discord.voice` は Discord ボイスチャンネル会話と、任意の自動参加 + LLM + TTS 上書きを有効化します。テキスト専用の Discord 設定では、デフォルトで音声はオフです。オプトインするには `channels.discord.voice.enabled=true` を設定します。
- `channels.discord.voice.model` は、Discord ボイスチャンネル応答に使用する LLM モデルを任意で上書きします。
- `channels.discord.voice.daveEncryption` (デフォルト `true`) と `channels.discord.voice.decryptionFailureTolerance` (デフォルト `24`) は、`@discordjs/voice` の DAVE オプションに渡されます。
- `channels.discord.voice.connectTimeoutMs` は、`/vc join` と自動参加試行時の初期 `@discordjs/voice` Ready 待機を制御します (デフォルト `30000`)。
- `channels.discord.voice.reconnectGraceMs` は、切断された音声セッションが再接続シグナリングに入るまでに許容される時間を制御します。超過すると OpenClaw が破棄します (デフォルト `15000`)。
- Discord 音声再生は、別ユーザーの発話開始イベントによって中断されません。フィードバックループを避けるため、OpenClaw は TTS の再生中に新しい音声キャプチャを無視します。
- OpenClaw はさらに、復号失敗が繰り返された後に音声セッションを退出/再参加することで、音声受信の復旧を試みます。
- `channels.discord.streaming` は正規のストリームモードキーです。Discord のデフォルトは `streaming.mode: "progress"` なので、ツール/作業の進行状況は 1 つの編集済みプレビューメッセージに表示されます。無効化するには `streaming.mode: "off"` を設定します。レガシーの `streamMode` と真偽値の `streaming` 値はランタイムエイリアスとして残ります。永続化された設定を書き換えるには `openclaw doctor --fix` を実行してください。
- `channels.discord.autoPresence` はランタイム可用性をボットプレゼンスにマップし (healthy => online、degraded => idle、exhausted => dnd)、任意のステータステキスト上書きを許可します。
- `channels.discord.dangerouslyAllowNameMatching` は、変更可能な名前/タグ照合を再有効化します (緊急互換モード)。
- `channels.discord.execApprovals`: Discord ネイティブの exec 承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"` (デフォルト)。自動モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効化されます。
  - `approvers`: exec リクエストの承認を許可された Discord ユーザー ID。省略時は `commands.ownerAllowFrom` にフォールバックします。
  - `agentFilter`: 任意のエージェント ID allowlist。省略するとすべてのエージェントの承認を転送します。
  - `sessionFilter`: 任意のセッションキーパターン (部分文字列または正規表現)。
  - `target`: 承認プロンプトの送信先。`"dm"` (デフォルト) は承認者 DM に送信し、`"channel"` は発信元チャンネルに送信し、`"both"` は両方に送信します。ターゲットに `"channel"` が含まれる場合、ボタンは解決済み承認者のみ使用できます。
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
- 環境変数フォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (デフォルトアカウントのみ)。
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
        initialHistoryLimit: 20,
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

- **ソケットモード** には `botToken` と `appToken` の両方が必要です（デフォルトアカウントの環境変数フォールバックでは `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP モード** には `botToken` と `signingSecret`（ルートまたはアカウントごと）が必要です。
- `socketMode` は、Slack SDK Socket Mode トランスポート調整を公開 Bolt receiver API に渡します。ping/pong タイムアウトや古い websocket の挙動を調査するときだけ使用してください。`clientPingTimeout` のデフォルトは `15000` です。`serverPingTimeout` と `pingPongLoggingEnabled` は設定されている場合のみ渡されます。
- `botToken`、`appToken`、`signingSecret`、`userToken` はプレーンテキスト
  文字列または SecretRef オブジェクトを受け付けます。
- Slack アカウントスナップショットは、`botTokenSource`、`botTokenStatus`、
  `appTokenStatus`、HTTP モードでの `signingSecretStatus` など、
  認証情報ごとのソース/ステータスフィールドを公開します。`configured_unavailable` は、
  アカウントが SecretRef 経由で設定されているものの、現在のコマンド/ランタイムパスが
  シークレット値を解決できなかったことを意味します。
- `configWrites: false` は Slack から開始される設定書き込みをブロックします。
- 任意の `channels.slack.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- `channels.slack.streaming.mode` は正規の Slack ストリームモードキーです（デフォルトは `"partial"`）。`channels.slack.streaming.nativeTransport` は Slack のネイティブストリーミングトランスポートを制御します（デフォルトは `true`）。レガシーの `streamMode`、ブール値 `streaming`、`chunkMode`、`blockStreaming`、`blockStreamingCoalesce`、`nativeStreaming` の値はランタイムエイリアスとして残っています。永続化済み設定を `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}` に書き換えるには `openclaw doctor --fix` を実行してください。
- `unfurlLinks` と `unfurlMedia` は、bot 返信に対して Slack の `chat.postMessage` リンクおよびメディアの unfurl ブール値を渡します。`unfurlLinks` のデフォルトは `false` のため、有効にしない限り送信 bot リンクはインライン展開されません。`unfurlMedia` は設定されていない限り省略されます。1 つのアカウントについてトップレベル値を上書きするには、どちらかの値を `channels.slack.accounts.<accountId>` に設定します。
- 配信ターゲットには `user:<id>`（DM）または `channel:<id>` を使用します。

**リアクション通知モード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` から）。

**スレッドセッション分離:** `thread.historyScope` はスレッドごと（デフォルト）またはチャンネル全体で共有です。`thread.inheritParent` は親チャンネルのトランスクリプトを新しいスレッドにコピーします。`thread.initialHistoryLimit`（デフォルト `20`）は、新しいスレッドセッション開始時に取得する既存スレッドメッセージ数を制限します。`0` はスレッド履歴の取得を無効にします。

- Slack ネイティブストリーミングと Slack アシスタント形式の「入力中...」スレッドステータスには、返信スレッドターゲットが必要です。トップレベル DM はデフォルトでスレッド外のままなので、スレッド形式のネイティブストリーム/ステータスプレビューを表示する代わりに、Slack の下書き投稿と編集プレビューを通じてストリーミングできます。
- `typingReaction` は、返信の実行中に受信 Slack メッセージへ一時的なリアクションを追加し、完了時に削除します。`"hourglass_flowing_sand"` などの Slack 絵文字ショートコードを使用してください。
- `channels.slack.execApprovals`: Slack ネイティブ承認クライアント配信と exec 承認者認可。Discord と同じスキーマです: `enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack ユーザー ID）、`agentFilter`、`sessionFilter`、`target`（`"dm"`、`"channel"`、または `"both"`）。Slack Plugin 承認者が解決できる場合、Plugin 承認は Slack 発のリクエストにこのネイティブクライアントパスを使用できます。Slack 発セッションまたは Slack ターゲット向けの Slack ネイティブ Plugin 承認配信は、`approvals.plugin` 経由でも有効化できます。Plugin 承認は exec 承認者ではなく、`allowFrom` とデフォルトルーティングからの Slack Plugin 承認者を使用します。

| アクショングループ | デフォルト | 注記                         |
| ------------------ | ---------- | ---------------------------- |
| reactions          | 有効       | リアクション追加 + 一覧取得  |
| messages           | 有効       | 読み取り/送信/編集/削除      |
| pins               | 有効       | ピン留め/ピン解除/一覧取得   |
| memberInfo         | 有効       | メンバー情報                 |
| emojiList          | 有効       | カスタム絵文字一覧           |

### Mattermost

Mattermost は Discord、Slack、WhatsApp と同じ方法で別個の Plugin としてインストールします。

```bash
openclaw plugins install @openclaw/mattermost
```

バージョンを固定する前に、現在の dist-tag を [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) で確認してください。

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

Mattermost ネイティブコマンドが有効な場合:

- `commands.callbackPath` は完全な URL ではなくパス（例: `/api/channels/mattermost/command`）である必要があります。
- `commands.callbackUrl` は OpenClaw Gateway エンドポイントに解決され、Mattermost サーバーから到達可能である必要があります。
- ネイティブスラッシュコールバックは、スラッシュコマンド登録時に Mattermost から返される
  コマンドごとのトークンで認証されます。登録に失敗した場合、または
  有効化されたコマンドがない場合、OpenClaw は
  `Unauthorized: invalid command token.` でコールバックを拒否します。
- プライベート/tailnet/内部コールバックホストでは、Mattermost が
  `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックホスト/ドメインを含めることを要求する場合があります。
  完全な URL ではなく、ホスト/ドメイン値を使用してください。
- `channels.mattermost.configWrites`: Mattermost から開始される設定書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャンネルで返信する前に `@mention` を要求します。
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
- `channels.signal.configWrites`: Signal から開始される設定書き込みを許可または拒否します。
- 任意の `channels.signal.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。

### iMessage

OpenClaw は `imsg rpc`（stdio 上の JSON-RPC）を起動します。デーモンやポートは不要です。ホストが Messages データベースと Automation の権限を付与できる場合、新しい OpenClaw iMessage セットアップではこれが推奨パスです。

BlueBubbles サポートは削除されました。`channels.bluebubbles` は現在の OpenClaw でサポートされるランタイム設定サーフェスではありません。古い設定は `channels.imessage` に移行してください。短い説明は [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage) を、完全な変換表は [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles) を参照してください。

Gateway がサインイン済みの Messages Mac で実行されていない場合は、`channels.imessage.enabled=true` のままにし、`channels.imessage.cliPath` をその Mac 上で `imsg "$@"` を実行する SSH ラッパーに設定します。デフォルトのローカル `imsg` パスは macOS 専用です。

本番送信で SSH ラッパーに依存する前に、その正確なラッパー経由で送信 `imsg send` を検証してください。一部の macOS TCC 状態では Messages Automation が `/usr/libexec/sshd-keygen-wrapper` に割り当てられ、読み取りやプローブは動作しても AppleEvents `-1743` により送信が失敗することがあります。[iMessage](/ja-JP/channels/imessage) の SSH ラッパートラブルシューティングセクションを参照してください。

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
- `chat_id:<id>` ターゲットを優先してください。チャット一覧を表示するには `imsg chats --limit 20` を使用します。
- `cliPath` は SSH ラッパーを指すことができます。SCP 添付ファイル取得用に `remoteHost`（`host` または `user@host`）を設定します。
- `attachmentRoots` と `remoteAttachmentRoots` は受信添付ファイルパスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCP は厳格なホストキー確認を使用するため、リレーホストキーがすでに `~/.ssh/known_hosts` に存在することを確認してください。
- `channels.imessage.configWrites`: iMessage から開始される設定書き込みを許可または拒否します。
- `channels.imessage.sendTransport`: 通常の送信返信に推奨される `imsg` RPC 送信トランスポート。`auto`（デフォルト）は、実行中であれば既存チャットに IMCore ブリッジを使用し、その後 AppleScript にフォールバックします。`bridge` は private-API 配信を要求します。`applescript` は公開 Messages Automation パスを強制します。
- `channels.imessage.actions.*`: `imsg status` / `openclaw channels status --probe` によってもゲートされる private API アクションを有効にします。
- `channels.imessage.includeAttachments` はデフォルトでオフです。agent ターンで受信メディアを期待する前に `true` に設定してください。
- ブリッジ/Gateway 再起動後の受信復旧は自動です（GUID 重複排除に加え、古いバックログ年齢フェンス）。既存の `channels.imessage.catchup.enabled: true` 設定は非推奨の互換性プロファイルとして引き続き尊重されます。`catchup` はデフォルトで無効です。
- `channels.imessage.groups`: グループレジストリとグループごとの設定。`groupPolicy: "allowlist"` の場合、グループメッセージがレジストリゲートを通過できるよう、明示的な `chat_id` キーまたは `"*"` ワイルドカードエントリを設定してください。
- `type: "acp"` のトップレベル `bindings[]` エントリは、iMessage 会話を永続 ACP セッションにバインドできます。`match.peer.id` では正規化済みハンドルまたは明示的なチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共有フィールドセマンティクス: [ACP Agents](/ja-JP/tools/acp-agents#persistent-channel-bindings)。

<Accordion title="iMessage SSH ラッパー例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix は Plugin ベースで、`channels.matrix` の下に設定されます。

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
- `channels.matrix.proxy` は、Matrix HTTP トラフィックを明示的な HTTP(S) プロキシ経由でルーティングします。名前付きアカウントは `channels.matrix.accounts.<id>.proxy` でこれを上書きできます。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` は、プライベート/内部 homeserver を許可します。`proxy` とこのネットワークのオプトインは独立した制御です。
- `channels.matrix.defaultAccount` は、複数アカウント構成で優先アカウントを選択します。
- `channels.matrix.autoJoin` のデフォルトは `"off"` のため、招待されたルームと新規の DM 形式の招待は、`autoJoinAllowlist` とともに `autoJoin: "allowlist"` を設定するか、`autoJoin: "always"` を設定するまで無視されます。
- `channels.matrix.execApprovals`: Matrix ネイティブの exec 承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。自動モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効になります。
  - `approvers`: exec リクエストの承認を許可された Matrix ユーザー ID（例: `@owner:example.org`）。
  - `agentFilter`: 任意のエージェント ID 許可リスト。省略すると、すべてのエージェントの承認を転送します。
  - `sessionFilter`: 任意のセッションキーパターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）、`"channel"`（送信元ルーム）、または `"both"`。
  - アカウントごとの上書き: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` は、Matrix DM をどのようにセッションにグループ化するかを制御します。`per-user`（デフォルト）はルーティングされた相手ごとに共有し、`per-room` は各 DM ルームを分離します。
- Matrix ステータスプローブとライブディレクトリ検索は、ランタイムトラフィックと同じプロキシポリシーを使用します。
- Matrix の完全な構成、ターゲティングルール、セットアップ例は [Matrix](/ja-JP/channels/matrix) に記載されています。

### Microsoft Teams

Microsoft Teams は Plugin によって支えられ、`channels.msteams` 配下で構成されます。

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
- Teams の完全な構成（認証情報、webhook、DM/グループポリシー、チーム別/チャンネル別の上書き）は [Microsoft Teams](/ja-JP/channels/msteams) に記載されています。

### IRC

IRC は Plugin によって支えられ、`channels.irc` 配下で構成されます。

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
- 任意の `channels.irc.defaultAccount` は、構成済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- IRC チャンネルの完全な構成（host/port/TLS/channels/allowlists/mention gating）は [IRC](/ja-JP/channels/irc) に記載されています。

### 複数アカウント（すべてのチャンネル）

チャンネルごとに複数のアカウントを実行します（それぞれが独自の `accountId` を持ちます）。

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

- `default` は `accountId` が省略された場合（CLI + ルーティング）に使用されます。
- 環境変数トークンは **default** アカウントにのみ適用されます。
- ベースのチャンネル設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- 各アカウントを別のエージェントにルーティングするには `bindings[].match.accountId` を使用します。
- まだ単一アカウントのトップレベルチャンネル構成のまま、`openclaw channels add`（またはチャンネルのオンボーディング）で非デフォルトアカウントを追加した場合、OpenClaw はまずアカウントスコープのトップレベル単一アカウント値をチャンネルのアカウントマップに昇格させ、元のアカウントが動作し続けるようにします。ほとんどのチャンネルではそれらを `channels.<channel>.accounts.default` に移動します。Matrix では、既存の一致する名前付き/デフォルトターゲットを代わりに保持できます。
- 既存のチャンネルのみのバインディング（`accountId` なし）は、引き続きデフォルトアカウントに一致します。アカウントスコープのバインディングは引き続き任意です。
- `openclaw doctor --fix` も、アカウントスコープのトップレベル単一アカウント値をそのチャンネルに選択された昇格済みアカウントへ移動して、混在した形状を修復します。ほとんどのチャンネルでは `accounts.default` を使用します。Matrix では、既存の一致する名前付き/デフォルトターゲットを代わりに保持できます。

### その他の Plugin チャンネル

多くの Plugin チャンネルは `channels.<id>` として構成され、それぞれ専用のチャンネルページ（例: Feishu、LINE、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Twitch、Zalo）に記載されています。
完全なチャンネルインデックスを参照してください: [チャンネル](/ja-JP/channels)。

### グループチャットのメンションゲート

グループメッセージのデフォルトは **メンション必須**（メタデータメンションまたは安全な正規表現パターン）です。WhatsApp、Telegram、Discord、Google Chat、iMessage のグループチャットに適用されます。

可視返信は別に制御されます。通常のグループ、チャンネル、内部 WebChat の直接リクエストは、デフォルトで自動的な最終配信になります。最終的なアシスタントテキストは、レガシーの可視返信パスを通じて投稿されます。可視出力をエージェントが `message(action=send)` を呼び出した後にのみ投稿する必要がある場合は、`messages.visibleReplies: "message_tool"` または `messages.groupChat.visibleReplies: "message_tool"` をオプトインしてください。オプトイン済みのツール専用モードで、モデルがメッセージツールを呼び出さずに最終テキストを返した場合、その最終テキストはプライベートのままとなり、gateway の詳細ログに抑制されたペイロードのメタデータが記録されます。

ツール専用の可視返信には、ツールを確実に呼び出すモデル/ランタイムが必要であり、GPT 5.5 などの最新世代モデルを使う共有アンビエントルームに推奨されます。一部の弱いモデルは最終テキストで回答できますが、ソースに可視な出力は `message(action=send)` で送信する必要があることを理解できない場合があります。そのようなモデルでは、最終アシスタントターンが可視返信パスになるように `"automatic"` を使用してください。セッションログに `didSendViaMessagingTool: false` を含むアシスタントテキストが表示される場合、モデルはメッセージツールを呼び出す代わりにプライベートな最終テキストを生成しています。そのチャンネルでは、より強力なツール呼び出し対応モデルに切り替えるか、gateway の詳細ログで抑制されたペイロード要約を確認するか、`messages.groupChat.visibleReplies: "automatic"` を設定してすべてのグループ/チャンネルリクエストで可視の最終返信を使用してください。

アクティブなツールポリシーの下でメッセージツールが利用できない場合、OpenClaw は応答を黙って抑制するのではなく、自動可視返信にフォールバックします。`openclaw doctor` はこの不一致について警告します。

このルールは通常のエージェントの最終テキストに適用されます。Plugin が所有する会話バインディングでは、要求されたバインド済みスレッドターンの可視応答として、所有 Plugin が返した返信を使用します。Plugin はそれらのバインディング返信のために `message(action=send)` を呼び出す必要はありません。

**トラブルシューティング: グループ @mention で入力中表示の後に無音になる（エラーなし）**

症状: グループ/チャンネルの @mention で入力中インジケーターが表示され、gateway ログに `dispatch complete (queuedFinal=false, replies=0)` と報告されるものの、ルームにメッセージが届きません。同じエージェントへの DM は通常どおり返信します。

原因: グループ/チャンネルの可視返信モードが `"message_tool"` に解決されているため、OpenClaw はターンを実行しますが、エージェントが `message(action=send)` を呼び出さない限り最終アシスタントテキストを抑制します。このモードには `NO_REPLY` 契約はありません。メッセージツール呼び出しがないということは、ソース返信がないということです。抑制は構成された動作であるため、エラーはありません。通常のグループとチャンネルのターンはデフォルトで `"automatic"` なので、この症状は `messages.groupChat.visibleReplies`（またはグローバルの `messages.visibleReplies`）が明示的に `"message_tool"` に設定されている場合にのみ現れます。ハーネスの `defaultVisibleReplies` はここには適用されません — グループ/チャンネルリゾルバーはこれを無視します。これは直接/ソースチャットにのみ影響します（Codex ハーネスはその方法で直接チャットの最終応答を抑制します）。

修正: より強力なツール呼び出し対応モデルを選ぶか、明示的な `"message_tool"` 上書きを削除して `"automatic"` デフォルトに戻すか、`messages.groupChat.visibleReplies: "automatic"` を設定してすべてのグループ/チャンネルリクエストで可視返信を強制してください。gateway はファイル保存後に `messages` 構成をホットリロードします。デプロイでファイル監視または構成リロードが無効になっている場合のみ gateway を再起動してください。

**メンションの種類:**

- **メタデータメンション**: ネイティブプラットフォームの @-mentions。WhatsApp の self-chat モードでは無視されます。
- **テキストパターン**: `agents.list[].groupChat.mentionPatterns` 内の安全な正規表現パターン。無効なパターンと安全でない入れ子の反復は無視されます。
- メンションゲートは、検出が可能な場合（ネイティブメンションまたは少なくとも 1 つのパターン）にのみ適用されます。

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

`messages.groupChat.unmentionedInbound: "room_event"` は、対応チャンネルで、メンションされていない常時オンのグループ/チャンネルメッセージを静かなルームコンテキストとして送信します。メンションされたメッセージ、コマンド、直接メッセージは引き続きユーザーリクエストです。Discord、Slack、Telegram の完全な例については [アンビエントルームイベント](/ja-JP/channels/ambient-room-events) を参照してください。

`messages.visibleReplies` はグローバルなソースイベントデフォルトです。`messages.groupChat.visibleReplies` はグループ/チャンネルのソースイベントでそれを上書きします。`messages.visibleReplies` が未設定の場合、直接/ソースチャットは選択されたランタイムまたはハーネスのデフォルトを使用しますが、内部 WebChat の直接ターンは Pi/Codex プロンプトの同等性のため自動最終配信を使用します。可視出力に `message(action=send)` を意図的に必須にするには、`messages.visibleReplies: "message_tool"` を設定します。チャンネル許可リストとメンションゲートは引き続き、イベントを処理するかどうかを決定します。

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

このリゾルバーは、セッションキーが標準の `provider:direct:<id>`（またはレガシーの `provider:dm:<id>`）形式に従う任意のチャンネルについて、`channels.<provider>.dmHistoryLimit` と `channels.<provider>.dms.<id>.historyLimit` を読み取ります。そのため、固定リストだけでなく、バンドル済みチャンネルと Plugin チャンネルの両方で同様に動作します。

#### Self-chat モード

self-chat モードを有効にするには、自分の番号を `allowFrom` に含めます（ネイティブ @-mentions を無視し、テキストパターンにのみ応答します）。

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

- このブロックはコマンドサーフェスを構成します。現在の組み込み + バンドル済みコマンドカタログについては、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。
- このページは**設定キーリファレンス**であり、完全なコマンドカタログではありません。QQ Bot `/bot-ping` `/bot-help` `/bot-logs`、LINE `/card`、device-pair `/pair`、memory `/dreaming`、phone-control `/phone`、Talk `/voice` など、チャンネル/Plugin が所有するコマンドは、それぞれのチャンネル/Plugin ページおよび[スラッシュコマンド](/ja-JP/tools/slash-commands)に記載されています。
- テキストコマンドは、先頭に `/` が付いた**単独の**メッセージでなければなりません。
- `native: "auto"` は Discord/Telegram のネイティブコマンドを有効にし、Slack は無効のままにします。
- `nativeSkills: "auto"` は Discord/Telegram のネイティブ Skills コマンドを有効にし、Slack は無効のままにします。
- チャンネルごとに上書きできます: `channels.discord.commands.native`（bool または `"auto"`）。Discord の場合、`false` は起動時のネイティブコマンド登録とクリーンアップをスキップします。
- `channels.<provider>.commands.nativeSkills` で、チャンネルごとのネイティブ Skills 登録を上書きします。
- `channels.telegram.customCommands` は Telegram ボットメニューに追加エントリを追加します。
- `bash: true` はホストシェル用の `! <cmd>` を有効にします。`tools.elevated.enabled` と、`tools.elevated.allowFrom.<channel>` 内の送信者が必要です。
- `config: true` は `/config`（`openclaw.json` の読み書き）を有効にします。Gateway `chat.send` クライアントの場合、永続的な `/config set|unset` の書き込みには `operator.admin` も必要です。読み取り専用の `/config show` は、通常の書き込みスコープを持つ operator クライアントでも引き続き利用できます。
- `mcp: true` は、`mcp.servers` 配下の OpenClaw 管理 MCP サーバー設定用に `/mcp` を有効にします。
- `plugins: true` は、Plugin の探索、インストール、有効化/無効化コントロール用に `/plugins` を有効にします。
- `channels.<provider>.configWrites` は、チャンネルごとの設定変更を制御します（デフォルト: true）。
- 複数アカウントのチャンネルでは、`channels.<provider>.accounts.<id>.configWrites` も、そのアカウントを対象とする書き込みを制御します（例: `/allowlist --config --account <id>` または `/config set channels.<provider>.accounts.<id>...`）。
- `restart: false` は `/restart` と Gateway 再起動ツールアクションを無効にします。デフォルト: `true`。
- `ownerAllowFrom` は、所有者専用コマンドと所有者ゲート付きチャンネルアクションの明示的な所有者許可リストです。`allowFrom` とは別です。
- `ownerDisplay: "hash"` は、システムプロンプト内の所有者 ID をハッシュ化します。ハッシュを制御するには `ownerDisplaySecret` を設定します。
- `allowFrom` は provider ごとの設定です。設定されている場合、これが**唯一の**認可ソースになります（チャンネル許可リスト/ペアリングと `useAccessGroups` は無視されます）。
- `useAccessGroups: false` は、`allowFrom` が設定されていない場合に、コマンドがアクセスグループポリシーをバイパスできるようにします。
- コマンドドキュメントの対応表:
  - 組み込み + バンドル済みカタログ: [スラッシュコマンド](/ja-JP/tools/slash-commands)
  - チャンネル固有のコマンドサーフェス: [チャンネル](/ja-JP/channels)
  - QQ Bot コマンド: [QQ Bot](/ja-JP/channels/qqbot)
  - ペアリングコマンド: [ペアリング](/ja-JP/channels/pairing)
  - LINE カードコマンド: [LINE](/ja-JP/channels/line)
  - memory dreaming: [Dreaming](/ja-JP/concepts/dreaming)

</Accordion>

---

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference) — トップレベルキー
- [設定 — agents](/ja-JP/gateway/config-agents)
- [チャンネル概要](/ja-JP/channels)
