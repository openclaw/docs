---
read_when:
    - チャネルPluginの設定（認証、アクセス制御、マルチアカウント）
    - チャネルごとの設定キーのトラブルシューティング
    - DM ポリシー、グループポリシー、またはメンションゲーティングの監査
summary: 'チャネル設定: Slack、Discord、Telegram、WhatsApp、Matrix、iMessage などにまたがるアクセス制御、ペアリング、チャネルごとのキー'
title: Configuration — チャネル
x-i18n:
    generated_at: "2026-07-05T01:55:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edf2cb0c4a5fad102a15119d7d4711f8be8aba2bed6c16c1ecd3daefb2731aef
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` 配下のチャネル別設定キー。DM とグループアクセス、
マルチアカウント設定、メンションゲート、Slack、Discord、
Telegram、WhatsApp、Matrix、iMessage、その他の同梱チャネル Plugin 向けのチャネル別キーを扱います。

エージェント、ツール、Gateway ランタイム、その他のトップレベルキーについては、
[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## チャネル

各チャネルは、その設定セクションが存在すると自動的に起動します（`enabled: false` の場合を除く）。

### DM とグループアクセス

すべてのチャネルは DM ポリシーとグループポリシーをサポートします。

| DM ポリシー        | 動作                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (デフォルト) | 不明な送信者には一度限りのペアリングコードが送られ、所有者の承認が必要 |
| `allowlist`         | `allowFrom`（またはペアリング済み許可ストア）内の送信者のみ             |
| `open`              | すべての受信 DM を許可（`allowFrom: ["*"]` が必要）             |
| `disabled`          | すべての受信 DM を無視                                          |

| グループポリシー      | 動作                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (デフォルト) | 設定済みの許可リストに一致するグループのみ          |
| `open`                | グループ許可リストをバイパス（メンションゲートは引き続き適用） |
| `disabled`            | すべてのグループ/ルームメッセージをブロック                          |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が未設定の場合のデフォルトを設定します。
ペアリングコードは 1 時間後に期限切れになります。保留中の DM ペアリングリクエストは、**チャネルごとに 3 件**までです。
プロバイダーブロック全体が存在しない場合（`channels.<provider>` がない場合）、ランタイムのグループポリシーは起動時警告付きで `allowlist`（フェイルクローズ）にフォールバックします。
</Note>

### チャネルモデルのオーバーライド

特定のチャネル ID またはダイレクトメッセージの相手をモデルに固定するには、`channels.modelByChannel` を使用します。値には `provider/model` または設定済みのモデルエイリアスを指定できます。このチャネルマッピングは、セッションにモデルオーバーライドがまだない場合（たとえば `/model` で設定されていない場合）に適用されます。

グループ/スレッド会話では、キーはチャネル固有のグループ ID、トピック ID、またはチャネル名です。ダイレクトメッセージ（DM）会話では、キーはチャネルの送信者 ID（`nativeDirectUserId`、`origin.from`、`origin.to`、`OriginatingTo`、`From`、または `SenderId`）から派生したピア識別子です。正確なキー形式はチャネルによって異なります。

| チャネル  | DM キー形式         | 例                                      |
| -------- | ------------------- | -------------------------------------------- |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | 生のユーザー ID         | `123456789`                                  |
| Discord  | 生のユーザー ID         | `987654321`                                  |
| WhatsApp | 電話番号または JID | `15551234567`                                |
| Matrix   | Matrix ユーザー ID      | `@user:matrix.org`                           |
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

DM 固有のキーはダイレクトメッセージ会話でのみ一致します。グループ/スレッドのルーティングには影響しません。

### チャネルデフォルトと Heartbeat

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
- `channels.defaults.contextVisibility`: すべてのチャネルのデフォルト補足コンテキスト表示モード。値: `all`（デフォルト、引用/スレッド/履歴コンテキストをすべて含める）、`allowlist`（許可リスト内の送信者からのコンテキストのみ含める）、`allowlist_quote`（allowlist と同じだが、明示的な引用/返信コンテキストは保持）。チャネル別オーバーライド: `channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`: Heartbeat 出力に正常なチャネルステータスを含めます。
- `channels.defaults.heartbeat.showAlerts`: Heartbeat 出力に低下/エラーステータスを含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケーター形式の Heartbeat 出力をレンダリングします。

### WhatsApp

WhatsApp は Gateway の Web チャネル（Baileys Web）を通じて動作します。リンク済みセッションが存在すると自動的に起動します。

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

- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、WhatsApp DM とグループ向けの永続 ACP バインディングを設定します。`match.peer.id` には E.164 の直接番号または WhatsApp グループ JID を使用します。フィールドの意味は [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)で共通です。

<Accordion title="マルチアカウント WhatsApp">

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

- 送信コマンドは、存在する場合はアカウント `default` をデフォルトにします。それ以外の場合は、最初に設定されたアカウント ID（ソート済み）を使用します。
- オプションの `channels.whatsapp.defaultAccount` は、設定済みアカウント ID と一致する場合に、そのフォールバックデフォルトアカウント選択をオーバーライドします。
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
      trustedLocalFileRoots: ["/srv/telegram-bot-api-data"],
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot トークン: `channels.telegram.botToken` または `channels.telegram.tokenFile`（通常ファイルのみ。シンボリックリンクは拒否）。デフォルトアカウントのフォールバックとして `TELEGRAM_BOT_TOKEN` を使用します。
- `apiRoot` は Telegram Bot API のルートのみです。`https://api.telegram.org/bot<TOKEN>` ではなく、`https://api.telegram.org` またはセルフホスト/プロキシのルートを使用してください。`openclaw doctor --fix` は、誤って末尾に付いた `/bot<TOKEN>` サフィックスを削除します。
- `--local` モードのセルフホスト Bot API サーバーでは、`trustedLocalFileRoots` に OpenClaw が読み取れるホストパスを列挙します。サーバーデータボリュームを OpenClaw ホストにマウントし、そのデータルートまたはトークン別ディレクトリのいずれかを設定します。`/var/lib/telegram-bot-api` 配下のコンテナパスは、それらのルートにマッピングされます。その他の絶対パスは引き続き拒否されます。
- オプションの `channels.telegram.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択をオーバーライドします。
- マルチアカウント設定（2 つ以上のアカウント ID）では、フォールバックルーティングを避けるために明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定してください。これがないか無効な場合、`openclaw doctor` が警告します。
- `configWrites: false` は、Telegram から開始された設定書き込み（スーパーグループ ID 移行、`/config set|unset`）をブロックします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、フォーラムトピック向けの永続 ACP バインディングを設定します（`match.peer.id` には正規形式の `chatId:topic:topicId` を使用）。フィールドの意味は [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)で共通です。
- Telegram ストリームプレビューは `sendMessage` + `editMessageText` を使用します（ダイレクトチャットとグループチャットで動作します）。
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

- トークン: `channels.discord.token`。デフォルトアカウントのフォールバックとして `DISCORD_BOT_TOKEN` を使用します。
- 明示的な Discord `token` を指定する直接のアウトバウンド呼び出しは、その呼び出しにそのトークンを使用します。アカウントのリトライ/ポリシー設定は、引き続きアクティブなランタイムスナップショット内の選択済みアカウントから取得されます。
- 任意の `channels.discord.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- 配信ターゲットには `user:<id>`（DM）または `channel:<id>`（ギルドチャンネル）を使用します。裸の数値 ID は拒否されます。
- ギルド slug は小文字で、スペースは `-` に置き換えられます。チャンネルキーは slug 化された名前（`#` なし）を使用します。ギルド ID を推奨します。
- Bot が作成したメッセージはデフォルトで無視されます。`allowBots: true` で有効になります。Bot にメンションしている Bot メッセージのみを受け付けるには `allowBots: "mentions"` を使用します（自身のメッセージは引き続きフィルタリングされます）。
- Bot 作成のインバウンドメッセージをサポートするチャンネルでは、共有の [Bot ループ保護](/ja-JP/channels/bot-loop-protection)を使用できます。基準となるペア予算には `channels.defaults.botLoopProtection` を設定し、特定のサーフェスだけ異なる制限が必要な場合にのみチャンネルまたはアカウントで上書きします。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（およびチャンネル上書き）は、別のユーザーまたはロールにメンションしているが Bot にはメンションしていないメッセージを破棄します（@everyone/@here は除く）。
- `channels.discord.mentionAliases` は、送信前に安定したアウトバウンドの `@handle` テキストを Discord ユーザー ID にマッピングします。これにより、一時的なディレクトリキャッシュが空の場合でも、既知のチームメイトに決定論的にメンションできます。アカウントごとの上書きは `channels.discord.accounts.<accountId>.mentionAliases` 配下にあります。
- `maxLinesPerMessage`（デフォルト 17）は、2000 文字未満でも縦に長いメッセージを分割します。
- `channels.discord.suppressEmbeds` はデフォルトで `true` のため、無効化しない限り、アウトバウンド URL は Discord のリンクプレビューに展開されません。明示的な `embeds` ペイロードは通常どおり送信されます。メッセージ単位のツール呼び出しでは `suppressEmbeds` で上書きできます。
- `channels.discord.threadBindings` は Discord のスレッド紐付けルーティングを制御します。
  - `enabled`: スレッド紐付けセッション機能（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、および紐付け配信/ルーティング）の Discord 上書き
  - `idleHours`: 非アクティブ時の自動 unfocus までの時間に対する Discord 上書き（`0` で無効）
  - `maxAgeHours`: 厳格な最大経過時間に対する Discord 上書き（`0` で無効）
  - `spawnSessions`: `sessions_spawn({ thread: true })` と ACP スレッド生成時の自動スレッド作成/紐付けのスイッチ（デフォルト: `true`）
  - `defaultSpawnContext`: スレッド紐付け生成に使用するネイティブ subagent コンテキスト（デフォルトは `"fork"`）
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、チャンネルとスレッド向けの永続 ACP 紐付けを設定します（`match.peer.id` にチャンネル/スレッド ID を使用）。フィールドの意味は [ACP Agents](/ja-JP/tools/acp-agents#persistent-channel-bindings) で共有されています。
- `channels.discord.ui.components.accentColor` は Discord components v2 コンテナのアクセントカラーを設定します。
- `channels.discord.agentComponents.ttlMs` は、送信済み Discord コンポーネントコールバックが登録されたまま残る時間を制御します。デフォルトは `1800000`（30 分）、最大は `86400000`（24 時間）で、アカウントごとの上書きは `channels.discord.accounts.<accountId>.agentComponents.ttlMs` 配下にあります。長い値にすると古いボタン/選択/フォームをより長く利用できるため、ワークフローに合う最短の TTL を推奨します。
- `channels.discord.voice` は Discord 音声チャンネル会話と、任意の自動参加 + LLM + TTS 上書きを有効にします。テキストのみの Discord 設定では、デフォルトで音声はオフのままです。オプトインするには `channels.discord.voice.enabled=true` を設定します。
- `channels.discord.voice.model` は、Discord 音声チャンネル応答に使用する LLM モデルを任意で上書きします。
- `channels.discord.voice.daveEncryption` と `channels.discord.voice.decryptionFailureTolerance` は、`@discordjs/voice` の DAVE オプションにそのまま渡されます（デフォルトは `true` と `24`）。
- `channels.discord.voice.connectTimeoutMs` は、`/vc join` と自動参加試行における初期 `@discordjs/voice` Ready 待機を制御します（デフォルトは `30000`）。
- `channels.discord.voice.reconnectGraceMs` は、切断された音声セッションが再接続シグナル状態に入るまで OpenClaw が待つ時間を制御します（デフォルトは `15000`）。
- Discord 音声再生は、別ユーザーの発話開始イベントによって中断されません。フィードバックループを避けるため、OpenClaw は TTS 再生中の新しい音声キャプチャを無視します。
- OpenClaw はさらに、復号失敗が繰り返された後に音声セッションから退出/再参加することで、音声受信の復旧を試みます。
- `channels.discord.streaming` は標準のストリームモードキーです。Discord はデフォルトで `streaming.mode: "progress"` となり、ツール/作業の進捗が 1 つの編集済みプレビューメッセージに表示されます。無効にするには `streaming.mode: "off"` を設定します。レガシーの `streamMode` とブール値の `streaming` はランタイムエイリアスとして残ります。永続化された設定を書き換えるには `openclaw doctor --fix` を実行してください。
- `channels.discord.autoPresence` はランタイムの可用性を Bot プレゼンスにマッピングし（healthy => online、degraded => idle、exhausted => dnd）、任意のステータステキスト上書きを許可します。
- `channels.discord.dangerouslyAllowNameMatching` は、変更可能な名前/タグ照合を再度有効にします（緊急互換モード）。
- `channels.discord.execApprovals`: Discord ネイティブの exec 承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。自動モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効になります。
  - `approvers`: exec リクエストを承認できる Discord ユーザー ID。省略時は `commands.ownerAllowFrom` にフォールバックします。
  - `agentFilter`: 任意のエージェント ID allowlist。省略するとすべてのエージェントの承認を転送します。
  - `sessionFilter`: 任意のセッションキー パターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）は承認者の DM に送信し、`"channel"` は発信元チャンネルに送信し、`"both"` は両方に送信します。ターゲットに `"channel"` が含まれる場合、ボタンは解決済み承認者のみ使用できます。
  - `cleanupAfterResolve`: `true` の場合、承認、拒否、またはタイムアウト後に承認 DM を削除します。

**リアクション通知モード:** `off`（なし）、`own`（Bot のメッセージ、デフォルト）、`all`（すべてのメッセージ）、`allowlist`（すべてのメッセージで `guilds.<id>.users` から）。

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
- `channels.googlechat.dangerouslyAllowNameMatching` は、変更可能なメールプリンシパル照合を再度有効にします（緊急互換モード）。

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

- **Socket mode** には `botToken` と `appToken` の両方が必要です（デフォルトアカウントの env フォールバックでは `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP mode** には `botToken` に加えて `signingSecret`（ルートまたはアカウント単位）が必要です。
- `socketMode` は Slack SDK Socket Mode のトランスポート調整を公開 Bolt receiver API に渡します。ping/pong タイムアウトや古い websocket の挙動を調査するときだけ使用してください。`clientPingTimeout` のデフォルトは `15000` です。`serverPingTimeout` と `pingPongLoggingEnabled` は設定されている場合にのみ渡されます。
- `botToken`、`appToken`、`signingSecret`、`userToken` はプレーンテキストの
  文字列または SecretRef オブジェクトを受け付けます。
- Slack アカウントのスナップショットは、認証情報ごとの source/status フィールドを公開します。例として
  `botTokenSource`、`botTokenStatus`、`appTokenStatus`、HTTP mode では
  `signingSecretStatus` があります。`configured_unavailable` は、そのアカウントが
  SecretRef 経由で設定されているものの、現在のコマンドまたはランタイムパスで
  シークレット値を解決できなかったことを意味します。
- `configWrites: false` は Slack 起点の設定書き込みをブロックします。
- 任意の `channels.slack.defaultAccount` は、設定済みアカウント ID に一致する場合にデフォルトアカウント選択を上書きします。
- `channels.slack.streaming.mode` は標準の Slack ストリームモードキーです。`channels.slack.streaming.nativeTransport` は Slack のネイティブストリーミングトランスポートを制御します。従来の `streamMode`、boolean の `streaming`、`nativeStreaming` 値はランタイムエイリアスとして残っています。永続化された設定を書き換えるには `openclaw doctor --fix` を実行してください。
- `unfurlLinks` と `unfurlMedia` は、ボット返信向けに Slack の `chat.postMessage` のリンクおよびメディアの unfurl boolean を渡します。`unfurlLinks` のデフォルトは `false` のため、有効にしない限り送信ボットリンクはインライン展開されません。`unfurlMedia` は設定されていない限り省略されます。1 つのアカウントでトップレベル値を上書きするには、どちらかの値を `channels.slack.accounts.<accountId>` に設定してください。
- 配信ターゲットには `user:<id>`（DM）または `channel:<id>` を使用します。

**リアクション通知モード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` から）。

**スレッドセッション分離:** `thread.historyScope` はスレッド単位（デフォルト）またはチャンネル全体で共有です。`thread.inheritParent` は親チャンネルのトランスクリプトを新しいスレッドへコピーします。

- Slack ネイティブストリーミングと Slack アシスタント風の「入力中...」スレッドステータスには、返信スレッドターゲットが必要です。トップレベル DM はデフォルトでスレッド外のままなので、スレッド形式のネイティブストリーム/ステータスプレビューを表示する代わりに、Slack のドラフト投稿および編集プレビューを通じてストリーミングできます。
- `typingReaction` は返信の実行中に受信 Slack メッセージへ一時的なリアクションを追加し、完了時に削除します。`"hourglass_flowing_sand"` のような Slack emoji shortcode を使用してください。
- `channels.slack.execApprovals`: Slack ネイティブの承認クライアント配信と exec 承認者認可です。スキーマは Discord と同じで、`enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack ユーザー ID）、`agentFilter`、`sessionFilter`、`target`（`"dm"`、`"channel"`、または `"both"`）です。Slack plugin の承認者が解決できる場合、Plugin 承認は Slack 起点リクエストにこのネイティブクライアントパスを使用できます。Slack ネイティブの Plugin 承認配信は、Slack 起点セッションまたは Slack ターゲット向けに `approvals.plugin` からも有効化できます。Plugin 承認は `allowFrom` とデフォルトルーティングから Slack plugin 承認者を使用し、exec 承認者は使用しません。

| アクショングループ | デフォルト | 注記                         |
| ------------------ | ---------- | ---------------------------- |
| reactions          | 有効       | リアクション追加 + 一覧表示  |
| messages           | 有効       | 読み取り/送信/編集/削除      |
| pins               | 有効       | ピン留め/解除/一覧表示       |
| memberInfo         | 有効       | メンバー情報                 |
| emojiList          | 有効       | カスタム emoji 一覧          |

### Mattermost

Mattermost は現在の OpenClaw リリースではバンドル Plugin として提供されます。古いビルドや
カスタムビルドでは、現在の npm パッケージを
`openclaw plugins install @openclaw/mattermost` でインストールできます。バージョンを固定する前に、現在の dist-tag を
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

チャットモード: `oncall`（@-mention で応答、デフォルト）、`onmessage`（すべてのメッセージ）、`onchar`（トリガープレフィックスで始まるメッセージ）。

Mattermost ネイティブコマンドが有効な場合:

- `commands.callbackPath` は完全な URL ではなく、パス（例: `/api/channels/mattermost/command`）である必要があります。
- `commands.callbackUrl` は OpenClaw Gateway エンドポイントに解決され、Mattermost サーバーから到達可能である必要があります。
- ネイティブ slash コールバックは、slash コマンド登録時に Mattermost から返されるコマンド単位のトークンで
  認証されます。登録が失敗した場合、または
  コマンドが有効化されていない場合、OpenClaw はコールバックを
  `Unauthorized: invalid command token.`
  で拒否します。
- private/tailnet/internal コールバックホストでは、Mattermost が
  `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックホスト/ドメインを含めることを要求する場合があります。
  完全な URL ではなく、ホスト/ドメイン値を使用してください。
- `channels.mattermost.configWrites`: Mattermost 起点の設定書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャンネルで返信する前に `@mention` を要求します。
- `channels.mattermost.groups.<channelId>.requireMention`: チャンネル単位のメンションゲート上書き（デフォルトは `"*"`）。
- 任意の `channels.mattermost.defaultAccount` は、設定済みアカウント ID に一致する場合にデフォルトアカウント選択を上書きします。

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
- `channels.signal.configWrites`: Signal 起点の設定書き込みを許可または拒否します。
- 任意の `channels.signal.defaultAccount` は、設定済みアカウント ID に一致する場合にデフォルトアカウント選択を上書きします。

### iMessage

OpenClaw は `imsg rpc`（stdio 経由の JSON-RPC）を起動します。daemon やポートは不要です。これは、ホストが Messages データベースと Automation 権限を付与できる場合の新しい OpenClaw iMessage セットアップで推奨されるパスです。

BlueBubbles サポートは削除されました。現在の OpenClaw では、`channels.bluebubbles` はサポートされるランタイム設定サーフェスではありません。古い設定は `channels.imessage` に移行してください。短い説明は [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage) を、完全な変換表は [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles) を参照してください。

Gateway がサインイン済みの Messages Mac 上で実行されていない場合は、`channels.imessage.enabled=true` を維持し、`channels.imessage.cliPath` をその Mac 上で `imsg "$@"` を実行する SSH ラッパーに設定します。デフォルトのローカル `imsg` パスは macOS 専用です。

本番送信で SSH ラッパーに依存する前に、その正確なラッパー経由で外向きの `imsg send` を検証してください。一部の macOS TCC 状態では Messages Automation が `/usr/libexec/sshd-keygen-wrapper` に割り当てられ、読み取りやプローブは動作しても送信が AppleEvents `-1743` で失敗することがあります。詳しくは [SSH ラッパー送信が AppleEvents -1743 で失敗する](/ja-JP/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743) を参照してください。

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

- 任意の `channels.imessage.defaultAccount` は、設定済みアカウント ID に一致する場合にデフォルトアカウント選択を上書きします。

- Messages DB への Full Disk Access が必要です。
- `chat_id:<id>` ターゲットを推奨します。チャット一覧を表示するには `imsg chats --limit 20` を使用してください。
- `cliPath` は SSH ラッパーを指すことができます。SCP 添付ファイル取得用に `remoteHost`（`host` または `user@host`）を設定してください。
- `attachmentRoots` と `remoteAttachmentRoots` は受信添付ファイルのパスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCP は厳密なホストキー確認を使用するため、リレーホストキーがすでに `~/.ssh/known_hosts` に存在することを確認してください。
- `channels.imessage.configWrites`: iMessage 起点の設定書き込みを許可または拒否します。
- `channels.imessage.sendTransport`: 通常の外向き返信に使用する、推奨される `imsg` RPC 送信トランスポートです。`auto`（デフォルト）は IMCore ブリッジが実行中の場合に既存チャットへ使用し、その後 AppleScript にフォールバックします。`bridge` は private-API 配信を要求します。`applescript` は公開 Messages automation パスを強制します。
- `channels.imessage.actions.*`: `imsg status` / `openclaw channels status --probe` によってもゲートされる private API アクションを有効化します。
- `channels.imessage.includeAttachments` はデフォルトでオフです。エージェントターンで受信メディアを期待する前に `true` に設定してください。
- bridge/gateway 再起動後の受信復旧は自動です（GUID dedupe と stale-backlog age fence）。既存の `channels.imessage.catchup.enabled: true` 設定は非推奨の互換プロファイルとして引き続き尊重されます。
- `channels.imessage.groups`: グループレジストリとグループ単位の設定です。`groupPolicy: "allowlist"` では、グループメッセージがレジストリゲートを通過できるように、明示的な `chat_id` キーまたは `"*"` ワイルドカードエントリを設定してください。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、iMessage 会話を永続 ACP セッションにバインドできます。`match.peer.id` には正規化されたハンドルまたは明示的なチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共有フィールドの意味: [ACP Agents](/ja-JP/tools/acp-agents#persistent-channel-bindings)。

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

- トークン認証は `accessToken` を使用します。パスワード認証は `userId` + `password` を使用します。
- `channels.matrix.proxy` は Matrix HTTP トラフィックを明示的な HTTP(S) プロキシ経由でルーティングします。名前付きアカウントは `channels.matrix.accounts.<id>.proxy` でこれを上書きできます。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` はプライベート/内部 homeserver を許可します。`proxy` とこのネットワークのオプトインは独立した制御です。
- `channels.matrix.defaultAccount` はマルチアカウント設定で優先アカウントを選択します。
- `channels.matrix.autoJoin` のデフォルトは `off` なので、招待されたルームと新しい DM 形式の招待は、`autoJoinAllowlist` を指定して `autoJoin: "allowlist"` を設定するか、`autoJoin: "always"` を設定するまで無視されます。
- `channels.matrix.execApprovals`: Matrix ネイティブの exec 承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"` (デフォルト)。auto モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効になります。
  - `approvers`: exec リクエストの承認を許可された Matrix ユーザー ID (例: `@owner:example.org`)。
  - `agentFilter`: 任意のエージェント ID allowlist。省略すると、すべてのエージェントの承認を転送します。
  - `sessionFilter`: 任意のセッションキー パターン (部分文字列または正規表現)。
  - `target`: 承認プロンプトの送信先。`"dm"` (デフォルト)、`"channel"` (発信元ルーム)、または `"both"`。
  - アカウントごとの上書き: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` は Matrix DM をセッションにグループ化する方法を制御します。`per-user` (デフォルト) はルーティングされた相手ごとに共有し、`per-room` は各 DM ルームを分離します。
- Matrix ステータスプローブとライブディレクトリ検索は、ランタイムトラフィックと同じプロキシポリシーを使用します。
- Matrix の完全な設定、ターゲティングルール、セットアップ例は [Matrix](/ja-JP/channels/matrix) に記載されています。

### Microsoft Teams

Microsoft Teams は Plugin によって支えられ、`channels.msteams` の下で設定されます。

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
- Teams の完全な設定 (認証情報、webhook、DM/グループポリシー、チームごと/チャンネルごとの上書き) は [Microsoft Teams](/ja-JP/channels/msteams) に記載されています。

### IRC

IRC は Plugin によって支えられ、`channels.irc` の下で設定されます。

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
- IRC チャンネルの完全な設定 (host/port/TLS/channels/allowlists/mention gating) は [IRC](/ja-JP/channels/irc) に記載されています。

### マルチアカウント (すべてのチャンネル)

チャンネルごとに複数のアカウントを実行します (それぞれ独自の `accountId` を持ちます)。

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

- `default` は `accountId` が省略された場合に使用されます (CLI + ルーティング)。
- env トークンは **default** アカウントにのみ適用されます。
- 基本チャンネル設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- 各アカウントを別々のエージェントにルーティングするには、`bindings[].match.accountId` を使用します。
- 単一アカウントのトップレベルチャンネル設定のまま、`openclaw channels add` (またはチャンネル オンボーディング) で非 default アカウントを追加した場合、OpenClaw は元のアカウントが動作し続けるように、まずアカウントスコープのトップレベル単一アカウント値をチャンネルのアカウントマップに昇格します。ほとんどのチャンネルではそれらを `channels.<channel>.accounts.default` に移動します。Matrix は代わりに既存の一致する名前付き/default ターゲットを保持できます。
- 既存のチャンネルのみのバインディング (`accountId` なし) は引き続き default アカウントに一致します。アカウントスコープのバインディングは任意のままです。
- `openclaw doctor --fix` も、そのチャンネルに選択された昇格先アカウントへアカウントスコープのトップレベル単一アカウント値を移動することで、混在した形を修復します。ほとんどのチャンネルでは `accounts.default` を使用します。Matrix は代わりに既存の一致する名前付き/default ターゲットを保持できます。

### その他の Plugin チャンネル

多くの Plugin チャンネルは `channels.<id>` として設定され、専用のチャンネルページに記載されています (たとえば Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch)。
完全なチャンネルインデックスを参照してください: [チャンネル](/ja-JP/channels)。

### グループチャットの mention gating

グループメッセージのデフォルトは **メンション必須** (メタデータメンションまたは安全な正規表現パターン) です。WhatsApp、Telegram、Discord、Google Chat、iMessage のグループチャットに適用されます。

表示される返信は別に制御されます。通常のグループ、チャンネル、内部 WebChat の直接リクエストは、自動的な最終配信がデフォルトです。最終的な assistant テキストは従来の可視返信パスを通じて投稿されます。可視出力をエージェントが `message(action=send)` を呼び出した後にのみ投稿する必要がある場合は、`messages.visibleReplies: "message_tool"` または `messages.groupChat.visibleReplies: "message_tool"` にオプトインします。オプトインされたツール専用モードで、モデルが message tool を呼び出さずに最終テキストを返した場合、その最終テキストは非公開のままになり、gateway verbose log に抑制されたペイロードメタデータが記録されます。

ツール専用の可視返信には、ツールを確実に呼び出すモデル/ランタイムが必要であり、GPT 5.5 などの最新世代モデルを使う共有アンビエントルームに推奨されます。一部の弱いモデルは最終テキストで回答できますが、ソースに表示される出力を `message(action=send)` で送信する必要があることを理解できない場合があります。そのようなモデルでは、最終 assistant ターンを可視返信パスにするために `"automatic"` を使用します。セッションログに `didSendViaMessagingTool: false` の assistant テキストが表示される場合、モデルは message tool を呼び出す代わりに非公開の最終テキストを生成しています。そのチャンネルでは、より強力なツール呼び出しモデルに切り替えるか、gateway verbose log で抑制されたペイロード概要を確認するか、すべてのグループ/チャンネル リクエストに可視の最終返信を使用するために `messages.groupChat.visibleReplies: "automatic"` を設定してください。

アクティブなツールポリシー下で message tool が利用できない場合、OpenClaw は応答を黙って抑制する代わりに自動可視返信にフォールバックします。`openclaw doctor` はこの不一致について警告します。

このルールは通常のエージェント最終テキストに適用されます。Plugin 所有の会話バインディングでは、所有 Plugin が返した返信を、要求されたバインド済みスレッドターンの可視応答として使用します。Plugin はそれらのバインディング返信のために `message(action=send)` を呼び出す必要はありません。

**トラブルシューティング: グループ @mention が typing をトリガーした後、無音になる (エラーなし)**

症状: グループ/チャンネルの @mention で typing インジケーターが表示され、gateway log には `dispatch complete (queuedFinal=false, replies=0)` と記録されるが、ルームにメッセージが届かない。同じエージェントへの DM は通常どおり返信される。

原因: グループ/チャンネルの可視返信モードが `"message_tool"` に解決されるため、OpenClaw はターンを実行しますが、エージェントが `message(action=send)` を呼び出さない限り、最終 assistant テキストを抑制します。このモードには `NO_REPLY` 契約はありません。message tool の呼び出しがなければ、ソースへの返信はありません。抑制は設定された動作なのでエラーはありません。通常のグループとチャンネルのターンはデフォルトで `"automatic"` なので、この症状は `messages.groupChat.visibleReplies` (またはグローバル `messages.visibleReplies`) が明示的に `"message_tool"` に設定されている場合にのみ発生します。ハーネスの `defaultVisibleReplies` はここでは適用されません — グループ/チャンネル resolver はそれを無視します。これは direct/source chats にのみ影響します (Codex ハーネスはその方法で direct-chat finals を抑制します)。

修正: より強力なツール呼び出しモデルを選ぶか、明示的な `"message_tool"` 上書きを削除して `"automatic"` デフォルトにフォールバックするか、すべてのグループ/チャンネル リクエストで可視返信を強制するために `messages.groupChat.visibleReplies: "automatic"` を設定します。gateway はファイル保存後に `messages` 設定をホットリロードします。デプロイでファイル監視または設定リロードが無効になっている場合のみ gateway を再起動してください。

**メンションタイプ:**

- **メタデータメンション**: ネイティブプラットフォームの @-mentions。WhatsApp self-chat モードでは無視されます。
- **テキストパターン**: `agents.list[].groupChat.mentionPatterns` の安全な正規表現パターン。無効なパターンと安全でないネスト反復は無視されます。
- Mention gating は、検出が可能な場合 (ネイティブメンションまたは少なくとも 1 つのパターン) にのみ適用されます。

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

`messages.groupChat.historyLimit` はグローバルデフォルトを設定します。チャンネルは `channels.<channel>.historyLimit` (またはアカウントごと) で上書きできます。無効にするには `0` を設定します。

`messages.groupChat.unmentionedInbound: "room_event"` は、サポートされているチャンネルで、メンションされていない常時オンのグループ/チャンネル メッセージを静かなルームコンテキストとして送信します。メンションされたメッセージ、コマンド、直接メッセージは引き続きユーザーリクエストです。Discord、Slack、Telegram の完全な例については [Ambient room events](/ja-JP/channels/ambient-room-events) を参照してください。

`messages.visibleReplies` はグローバルな source-event デフォルトです。`messages.groupChat.visibleReplies` はグループ/チャンネル source events に対してこれを上書きします。`messages.visibleReplies` が未設定の場合、direct/source chats は選択されたランタイムまたはハーネスのデフォルトを使用しますが、内部 WebChat の direct turns は Pi/Codex prompt parity のために自動最終配信を使用します。可視出力に `message(action=send)` を意図的に必須にするには、`messages.visibleReplies: "message_tool"` を設定します。チャンネル allowlist と mention gating は引き続きイベントを処理するかどうかを決定します。

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

解決順: DM ごとの上書き → provider デフォルト → 制限なし (すべて保持)。

サポート対象: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### Self-chat モード

self-chat モードを有効にするには、`allowFrom` に自分の番号を含めます (ネイティブ @-mentions を無視し、テキストパターンにのみ応答します)。

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

<Accordion title="コマンド詳細">

- このブロックはコマンドサーフェスを設定します。現在の組み込み + 同梱コマンドカタログについては、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。
- このページは完全なコマンドカタログではなく、**設定キーリファレンス**です。QQ Bot `/bot-ping` `/bot-help` `/bot-logs`、LINE `/card`、device-pair `/pair`、memory `/dreaming`、phone-control `/phone`、Talk `/voice` など、チャンネル/Plugin が所有するコマンドは、それぞれのチャンネル/Plugin ページと[スラッシュコマンド](/ja-JP/tools/slash-commands)に記載されています。
- テキストコマンドは先頭に `/` を付けた**単独の**メッセージである必要があります。
- `native: "auto"` は Discord/Telegram のネイティブコマンドを有効にし、Slack はオフのままにします。
- `nativeSkills: "auto"` は Discord/Telegram のネイティブ Skills コマンドを有効にし、Slack はオフのままにします。
- チャンネルごとに上書きします: `channels.discord.commands.native`（bool または `"auto"`）。Discord では、`false` にすると起動時のネイティブコマンド登録とクリーンアップをスキップします。
- チャンネルごとのネイティブ Skills 登録は `channels.<provider>.commands.nativeSkills` で上書きします。
- `channels.telegram.customCommands` は追加の Telegram ボットメニュー項目を追加します。
- `bash: true` はホストシェルで `! <cmd>` を有効にします。`tools.elevated.enabled` と、送信者が `tools.elevated.allowFrom.<channel>` に含まれていることが必要です。
- `config: true` は `/config`（`openclaw.json` の読み取り/書き込み）を有効にします。Gateway `chat.send` クライアントでは、永続的な `/config set|unset` の書き込みには `operator.admin` も必要です。読み取り専用の `/config show` は、通常の書き込みスコープを持つ operator クライアントでも引き続き利用できます。
- `mcp: true` は `mcp.servers` 配下の OpenClaw 管理 MCP サーバー設定に対して `/mcp` を有効にします。
- `plugins: true` は Plugin の検出、インストール、有効化/無効化コントロール用に `/plugins` を有効にします。
- `channels.<provider>.configWrites` はチャンネルごとの設定変更を制御します（デフォルト: true）。
- 複数アカウント対応チャンネルでは、`channels.<provider>.accounts.<id>.configWrites` も、そのアカウントを対象にする書き込みを制御します（例: `/allowlist --config --account <id>` または `/config set channels.<provider>.accounts.<id>...`）。
- `restart: false` は `/restart` と Gateway 再起動ツールアクションを無効にします。デフォルト: `true`。
- `ownerAllowFrom` は、owner 専用コマンドと owner で制御されたチャンネルアクションの明示的な owner 許可リストです。`allowFrom` とは別です。
- `ownerDisplay: "hash"` はシステムプロンプト内の owner ID をハッシュ化します。ハッシュ化を制御するには `ownerDisplaySecret` を設定します。
- `allowFrom` は provider ごとの設定です。設定されている場合、それが**唯一の**認可ソースになります（チャンネル許可リスト/ペアリングおよび `useAccessGroups` は無視されます）。
- `useAccessGroups: false` は、`allowFrom` が設定されていない場合に、コマンドがアクセスグループポリシーをバイパスすることを許可します。
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
