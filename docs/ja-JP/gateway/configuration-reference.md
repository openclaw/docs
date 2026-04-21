---
read_when:
    - 正確なフィールドレベルの設定仕様またはデフォルト値が必要な場合
    - チャネル、モデル、Gateway、またはツールの設定ブロックを検証している場合
summary: 主要な OpenClaw キー、デフォルト値、および専用サブシステムリファレンスへのリンクのための Gateway 設定リファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-04-21T04:45:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: e50315811f2ba31d325983397ffbd0f71c6e5e95a58a4412b62ebb969b50a3db
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# 設定リファレンス

`~/.openclaw/openclaw.json` のコア設定リファレンスです。タスク指向の概要については [Configuration](/ja-JP/gateway/configuration) を参照してください。

このページでは OpenClaw の主要な設定サーフェスを扱い、サブシステムごとにより詳細な専用リファレンスがある場合はそこへのリンクを示します。このページでは、各チャネル/Plugin が所有するコマンドカタログ全体や、memory/QMD のすべての詳細なノブを 1 ページにインライン展開することは**しません**。

コード上の正となる情報:

- `openclaw config schema` は、利用可能な場合に bundled/plugin/channel のメタデータをマージした、検証および Control UI 用のライブ JSON Schema を出力します
- `config.schema.lookup` は、ドリルダウン用ツール向けに、パス単位で絞られた 1 つのスキーマノードを返します
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、設定ドキュメントのベースラインハッシュを現在のスキーマサーフェスに対して検証します

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および `plugins.entries.memory-core.config.dreaming` 配下の dreaming 設定については [Memory configuration reference](/ja-JP/reference/memory-config)
- 現在の組み込み + bundled コマンドカタログについては [Slash Commands](/ja-JP/tools/slash-commands)
- チャネル固有のコマンドサーフェスについては各チャネル/Plugin ページ

設定形式は **JSON5** です（コメントと末尾カンマが使用可能）。すべてのフィールドは省略可能で、省略時は OpenClaw が安全なデフォルトを使用します。

---

## チャネル

各チャネルは、その設定セクションが存在すると自動的に起動します（`enabled: false` の場合を除く）。

### DM とグループアクセス

すべてのチャネルは DM ポリシーとグループポリシーをサポートしています。

| DM ポリシー          | 動作                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| `pairing` (デフォルト) | 未知の送信者には一度限りのペアリングコードが送られ、オーナーの承認が必要 |
| `allowlist`          | `allowFrom` 内の送信者（またはペアリング済み allow ストア）のみ         |
| `open`               | すべての受信 DM を許可（`allowFrom: ["*"]` が必要）                    |
| `disabled`           | すべての受信 DM を無視                                                 |

| グループポリシー       | 動作                                                      |
| ---------------------- | --------------------------------------------------------- |
| `allowlist` (デフォルト) | 設定された許可リストに一致するグループのみ                |
| `open`                 | グループ allowlist をバイパス（mention gating は引き続き適用） |
| `disabled`             | すべてのグループ/ルームメッセージをブロック                |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が未設定のときのデフォルトを設定します。
ペアリングコードは 1 時間で失効します。保留中の DM ペアリング要求は**チャネルごとに 3 件**までです。
プロバイダーブロック全体が存在しない場合（`channels.<provider>` がない場合）、ランタイムのグループポリシーは起動時警告付きで `allowlist`（fail-closed）にフォールバックします。
</Note>

### チャネルごとのモデル上書き

`channels.modelByChannel` を使用すると、特定のチャネル ID をモデルに固定できます。値には `provider/model` または設定済みのモデルエイリアスを指定できます。このチャネルマッピングは、セッションにまだモデル上書きがない場合（たとえば `/model` で設定された場合などを除く）に適用されます。

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

### チャネルのデフォルトと Heartbeat

`channels.defaults` を使用すると、プロバイダーをまたいで共有されるグループポリシーと Heartbeat の動作を設定できます。

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
- `channels.defaults.contextVisibility`: すべてのチャネルに対する補足コンテキスト可視性モードのデフォルト。値: `all`（デフォルト。引用/スレッド/履歴のすべてのコンテキストを含む）、`allowlist`（許可リストにある送信者からのコンテキストのみを含む）、`allowlist_quote`（allowlist と同じだが明示的な引用/返信コンテキストは保持）。チャネルごとの上書き: `channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`: 正常なチャネルステータスを Heartbeat 出力に含めます。
- `channels.defaults.heartbeat.showAlerts`: 劣化/エラー状態のステータスを Heartbeat 出力に含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケータ形式の Heartbeat 出力を表示します。

### WhatsApp

WhatsApp は Gateway の web チャネル（Baileys Web）経由で動作します。リンク済みセッションが存在すると自動的に起動します。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // 既読マーク（self-chat モードでは false）
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

- 送信コマンドでは、`default` アカウントが存在すればそれが使われ、存在しない場合は設定済みアカウント ID のうち最初のもの（ソート順）が使われます。
- 任意の `channels.whatsapp.defaultAccount` により、設定済みアカウント ID と一致する場合、そのフォールバック既定アカウント選択を上書きできます。
- 旧式の単一アカウント Baileys 認証ディレクトリは、`openclaw doctor` により `whatsapp/default` へ移行されます。
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
      streaming: "partial", // off | partial | block | progress (デフォルト: off。プレビュー編集のレート制限を避けるには明示的に opt in)
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

- Bot token: `channels.telegram.botToken` または `channels.telegram.tokenFile`（通常ファイルのみ。symlink は拒否）、デフォルトアカウントについては `TELEGRAM_BOT_TOKEN` にフォールバックします。
- 任意の `channels.telegram.defaultAccount` により、設定済みアカウント ID と一致する場合、既定アカウント選択を上書きできます。
- マルチアカウント構成（2 つ以上のアカウント ID）では、フォールバックルーティングを避けるために明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定してください。これがない、または無効な場合、`openclaw doctor` が警告します。
- `configWrites: false` は、Telegram 起点の設定書き込み（supergroup ID 移行、`/config set|unset`）をブロックします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、フォーラムトピック用の永続 ACP バインディングを設定します（`match.peer.id` には正規形の `chatId:topic:topicId` を使用）。フィールド仕様は [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) と共有です。
- Telegram のストリームプレビューは `sendMessage` + `editMessageText` を使用します（ダイレクトチャットとグループチャットの両方で動作）。
- retry ポリシー: [Retry policy](/ja-JP/concepts/retry) を参照してください。

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
      streaming: "off", // off | partial | block | progress (progress は Discord では partial に対応)
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
        spawnSubagentSessions: false, // sessions_spawn({ thread: true }) で opt-in
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

- トークン: `channels.discord.token`。デフォルトアカウントのフォールバックとして `DISCORD_BOT_TOKEN` を使用します。
- 明示的な Discord `token` を指定する直接送信呼び出しでは、その呼び出しにそのトークンが使用されます。アカウントの再試行/ポリシー設定は、アクティブなランタイムスナップショット内で選択されたアカウントから引き続き取得されます。
- 任意の `channels.discord.defaultAccount` により、設定済みアカウント ID と一致する場合、既定アカウント選択を上書きできます。
- 配信ターゲットには `user:<id>`（DM）または `channel:<id>`（guild チャネル）を使用します。数値 ID のみの指定は拒否されます。
- Guild slug は小文字で、空白は `-` に置き換えられます。チャネルキーには slug 化された名前（`#` なし）を使用します。Guild ID の使用を推奨します。
- Bot 自身が作成したメッセージはデフォルトで無視されます。`allowBots: true` で有効化できます。bot にメンションした bot メッセージだけを受け入れるには `allowBots: "mentions"` を使用します（自分自身のメッセージは引き続き除外されます）。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（およびチャネル上書き）は、別のユーザーまたはロールにはメンションしているが bot にはメンションしていないメッセージを破棄します（@everyone/@here は除外）。
- `maxLinesPerMessage`（デフォルト 17）は、2000 文字未満でも縦に長いメッセージを分割します。
- `channels.discord.threadBindings` は Discord のスレッドバインド型ルーティングを制御します:
  - `enabled`: スレッドバインド型セッション機能（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびバインドされた配信/ルーティング）に対する Discord 上書き
  - `idleHours`: 非アクティブ時の自動 unfocus を時間単位で指定する Discord 上書き（`0` で無効）
  - `maxAgeHours`: ハード上限年齢を時間単位で指定する Discord 上書き（`0` で無効）
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` の自動スレッド作成/バインドを有効にする opt-in スイッチ
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、チャネルおよびスレッド用の永続 ACP バインディングを設定します（`match.peer.id` にはチャネル/スレッド ID を使用）。フィールド仕様は [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) と共有です。
- `channels.discord.ui.components.accentColor` は、Discord components v2 コンテナのアクセントカラーを設定します。
- `channels.discord.voice` は、Discord 音声チャネル会話と、任意の自動参加 + TTS 上書きを有効にします。
- `channels.discord.voice.daveEncryption` と `channels.discord.voice.decryptionFailureTolerance` は、`@discordjs/voice` の DAVE オプションにそのまま渡されます（デフォルトは `true` と `24`）。
- OpenClaw は加えて、復号失敗が繰り返された後に音声セッションから離脱して再参加することで、音声受信の回復も試みます。
- `channels.discord.streaming` は正規のストリームモードキーです。旧来の `streamMode` および真偽値の `streaming` は自動移行されます。
- `channels.discord.autoPresence` は、ランタイムの可用性を bot プレゼンスにマッピングします（healthy => online、degraded => idle、exhausted => dnd）。任意のステータステキスト上書きも可能です。
- `channels.discord.dangerouslyAllowNameMatching` は、変更可能な name/tag マッチングを再有効化します（緊急互換モード）。
- `channels.discord.execApprovals`: Discord ネイティブの exec 承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。auto モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できると exec 承認が有効になります。
  - `approvers`: exec リクエストを承認できる Discord ユーザー ID。省略時は `commands.ownerAllowFrom` にフォールバックします。
  - `agentFilter`: 任意のエージェント ID allowlist。省略すると、すべてのエージェントの承認を転送します。
  - `sessionFilter`: 任意のセッションキー パターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）は承認者の DM に送信し、`"channel"` は発信元チャネルに送信し、`"both"` は両方に送信します。target に `"channel"` が含まれる場合、ボタンを使用できるのは解決済み承認者のみです。
  - `cleanupAfterResolve`: `true` の場合、承認、拒否、またはタイムアウト後に承認 DM を削除します。

**リアクション通知モード:** `off`（なし）、`own`（bot 自身のメッセージ、デフォルト）、`all`（すべてのメッセージ）、`allowlist`（すべてのメッセージのうち `guilds.<id>.users` からのもの）。

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
- サービスアカウントの SecretRef（`serviceAccountRef`）もサポートされています。
- 環境変数フォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信ターゲットには `spaces/<spaceId>` または `users/<userId>` を使用します。
- `channels.googlechat.dangerouslyAllowNameMatching` は、変更可能なメール principal マッチングを再有効化します（緊急互換モード）。

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
        nativeTransport: true, // mode=partial のとき Slack ネイティブストリーミング API を使用
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
- **HTTP mode** では `botToken` に加えて `signingSecret` が必要です（ルートまたはアカウントごと）。
- `botToken`、`appToken`、`signingSecret`、`userToken` には、平文文字列または SecretRef オブジェクトを指定できます。
- Slack アカウントスナップショットは、`botTokenSource`、`botTokenStatus`、`appTokenStatus`、および HTTP mode では `signingSecretStatus` のような、認証情報ごとのソース/状態フィールドを公開します。`configured_unavailable` は、そのアカウントが SecretRef 経由で設定されているが、現在のコマンド/ランタイム経路では秘密値を解決できなかったことを意味します。
- `configWrites: false` は Slack 起点の設定書き込みをブロックします。
- 任意の `channels.slack.defaultAccount` により、設定済みアカウント ID と一致する場合、既定アカウント選択を上書きできます。
- `channels.slack.streaming.mode` は正規の Slack ストリームモードキーです。`channels.slack.streaming.nativeTransport` は Slack のネイティブストリーミング転送を制御します。旧来の `streamMode`、真偽値の `streaming`、`nativeStreaming` は自動移行されます。
- 配信ターゲットには `user:<id>`（DM）または `channel:<id>` を使用します。

**リアクション通知モード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` から）。

**スレッドセッション分離:** `thread.historyScope` はスレッドごと（デフォルト）またはチャネル共有です。`thread.inheritParent` は親チャネルのトランスクリプトを新しいスレッドにコピーします。

- Slack ネイティブストリーミングと、Slack assistant 風の「入力中...」スレッドステータスには返信スレッドターゲットが必要です。トップレベルの DM はデフォルトでスレッド外のままなので、スレッド形式のプレビューではなく `typingReaction` または通常配信を使用します。
- `typingReaction` は返信実行中に受信した Slack メッセージへ一時的なリアクションを追加し、完了時にそれを削除します。`"hourglass_flowing_sand"` のような Slack 絵文字 shortcode を使用します。
- `channels.slack.execApprovals`: Slack ネイティブの exec 承認配信と承認者認可。スキーマは Discord と同じです: `enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack ユーザー ID）、`agentFilter`、`sessionFilter`、`target`（`"dm"`、`"channel"`、または `"both"`）。

| アクショングループ | デフォルト | 備考                   |
| ------------------ | ---------- | ---------------------- |
| reactions          | enabled    | リアクション + 一覧表示 |
| messages           | enabled    | 読み取り/送信/編集/削除 |
| pins               | enabled    | ピン留め/解除/一覧      |
| memberInfo         | enabled    | メンバー情報            |
| emojiList          | enabled    | カスタム絵文字一覧      |

### Mattermost

Mattermost は Plugin として提供されます: `openclaw plugins install @openclaw/mattermost`。

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
        // リバースプロキシ/公開デプロイ用の任意の明示 URL
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

- `commands.callbackPath` は完全 URL ではなくパスである必要があります（例: `/api/channels/mattermost/command`）。
- `commands.callbackUrl` は OpenClaw Gateway エンドポイントに解決され、Mattermost サーバーから到達可能である必要があります。
- ネイティブ slash callback は、slash コマンド登録時に Mattermost から返されるコマンドごとのトークンで認証されます。登録に失敗した場合や有効なコマンドがない場合、OpenClaw は callback を `Unauthorized: invalid command token.` で拒否します。
- 非公開/tailnet/internal の callback ホストでは、Mattermost に `ServiceSettings.AllowedUntrustedInternalConnections` で callback ホスト/ドメインの許可が必要になることがあります。完全 URL ではなく、ホスト/ドメイン値を使用してください。
- `channels.mattermost.configWrites`: Mattermost 起点の設定書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャネル内で返信する前に `@mention` を必須にします。
- `channels.mattermost.groups.<channelId>.requireMention`: チャネルごとのメンションゲート上書き（デフォルトは `"*"`）。
- 任意の `channels.mattermost.defaultAccount` により、設定済みアカウント ID と一致する場合、既定アカウント選択を上書きできます。

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

**リアクション通知モード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` から）。

- `channels.signal.account`: チャネル起動を特定の Signal アカウント ID に固定します。
- `channels.signal.configWrites`: Signal 起点の設定書き込みを許可または拒否します。
- 任意の `channels.signal.defaultAccount` により、設定済みアカウント ID と一致する場合、既定アカウント選択を上書きできます。

### BlueBubbles

BlueBubbles は推奨される iMessage 経路です（Plugin ベースで、`channels.bluebubbles` 配下に設定します）。

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl、password、webhookPath、グループ制御、および高度なアクション:
      // /channels/bluebubbles を参照
    },
  },
}
```

- ここで扱うコアキーパス: `channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- 任意の `channels.bluebubbles.defaultAccount` により、設定済みアカウント ID と一致する場合、既定アカウント選択を上書きできます。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、BlueBubbles の会話を永続 ACP セッションにバインドできます。`match.peer.id` には BlueBubbles ハンドルまたはターゲット文字列（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共有されるフィールド仕様: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。
- BlueBubbles チャネル設定の完全版は [BlueBubbles](/ja-JP/channels/bluebubbles) に記載されています。

### iMessage

OpenClaw は `imsg rpc`（stdio 上の JSON-RPC）を起動します。デーモンやポートは不要です。

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

- 任意の `channels.imessage.defaultAccount` により、設定済みアカウント ID と一致する場合、既定アカウント選択を上書きできます。

- Messages DB への Full Disk Access が必要です。
- `chat_id:<id>` ターゲットの使用を推奨します。チャット一覧には `imsg chats --limit 20` を使用してください。
- `cliPath` は SSH ラッパーを指すことができます。SCP による添付取得には `remoteHost`（`host` または `user@host`）を設定します。
- `attachmentRoots` と `remoteAttachmentRoots` は受信添付のパスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCP は厳格な host-key 検証を使用するため、リレーホストキーがすでに `~/.ssh/known_hosts` に存在することを確認してください。
- `channels.imessage.configWrites`: iMessage 起点の設定書き込みを許可または拒否します。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、iMessage の会話を永続 ACP セッションにバインドできます。`match.peer.id` には正規化されたハンドルまたは明示的なチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共有されるフィールド仕様: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。

<Accordion title="iMessage SSH ラッパーの例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix は extension ベースで、`channels.matrix` 配下に設定します。

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

- トークン認証では `accessToken` を使用します。パスワード認証では `userId` + `password` を使用します。
- `channels.matrix.proxy` は Matrix HTTP トラフィックを明示的な HTTP(S) プロキシ経由にします。名前付きアカウントは `channels.matrix.accounts.<id>.proxy` で上書きできます。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` は private/internal homeserver を許可します。`proxy` とこのネットワーク opt-in は独立した制御です。
- `channels.matrix.defaultAccount` は、マルチアカウント構成で優先アカウントを選択します。
- `channels.matrix.autoJoin` のデフォルトは `off` のため、招待されたルームや新しい DM 形式の招待は、`autoJoin: "allowlist"` と `autoJoinAllowlist`、または `autoJoin: "always"` を設定するまで無視されます。
- `channels.matrix.execApprovals`: Matrix ネイティブの exec 承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。auto モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できると exec 承認が有効になります。
  - `approvers`: exec リクエストを承認できる Matrix ユーザー ID（例: `@owner:example.org`）。
  - `agentFilter`: 任意のエージェント ID allowlist。省略すると、すべてのエージェントの承認を転送します。
  - `sessionFilter`: 任意のセッションキー パターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）、`"channel"`（発信元ルーム）、または `"both"`。
  - アカウントごとの上書き: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` は Matrix DM をどのようにセッションへグループ化するかを制御します: `per-user`（デフォルト）はルーティングされた peer ごとに共有し、`per-room` は各 DM ルームを分離します。
- Matrix のステータスプローブとライブディレクトリ検索は、ランタイムトラフィックと同じプロキシポリシーを使用します。
- Matrix の完全な設定、ターゲティングルール、およびセットアップ例は [Matrix](/ja-JP/channels/matrix) に記載されています。

### Microsoft Teams

Microsoft Teams は extension ベースで、`channels.msteams` 配下に設定します。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId、appPassword、tenantId、webhook、team/channel ポリシー:
      // /channels/msteams を参照
    },
  },
}
```

- ここで扱うコアキーパス: `channels.msteams`、`channels.msteams.configWrites`。
- Teams の完全な設定（認証情報、webhook、DM/グループポリシー、チームごと/チャネルごとの上書き）は [Microsoft Teams](/ja-JP/channels/msteams) に記載されています。

### IRC

IRC は extension ベースで、`channels.irc` 配下に設定します。

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
- 任意の `channels.irc.defaultAccount` により、設定済みアカウント ID と一致する場合、既定アカウント選択を上書きできます。
- IRC チャネルの完全な設定（host/port/TLS/channels/allowlists/mention gating）は [IRC](/ja-JP/channels/irc) に記載されています。

### マルチアカウント（全チャネル共通）

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

- `accountId` を省略した場合は `default` が使用されます（CLI + ルーティング）。
- 環境変数トークンは **default** アカウントにのみ適用されます。
- ベースのチャネル設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- 各アカウントを別のエージェントへルーティングするには `bindings[].match.accountId` を使用します。
- まだ単一アカウントのトップレベルチャネル設定のまま、`openclaw channels add`（またはチャネルのオンボーディング）で非デフォルトアカウントを追加した場合、OpenClaw はまずアカウントスコープのトップレベル単一アカウント値をチャネルの account map へ昇格させ、元のアカウントが引き続き動作するようにします。ほとんどのチャネルでは `channels.<channel>.accounts.default` へ移動します。Matrix は、既存の一致する named/default ターゲットを代わりに保持できます。
- 既存のチャネル専用バインディング（`accountId` なし）は、引き続きデフォルトアカウントに一致します。アカウントスコープのバインディングは引き続き任意です。
- `openclaw doctor --fix` も、アカウントスコープのトップレベル単一アカウント値を、そのチャネル用に選ばれた昇格先アカウントへ移動することで、混在した形状を修復します。ほとんどのチャネルは `accounts.default` を使用します。Matrix は、既存の一致する named/default ターゲットを代わりに保持できます。

### その他の extension チャネル

多くの extension チャネルは `channels.<id>` として設定され、それぞれ専用のチャネルページに記載されています（たとえば Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch）。
完全なチャネル一覧は [Channels](/ja-JP/channels) を参照してください。

### グループチャットのメンションゲーティング

グループメッセージでは、デフォルトで**メンション必須**です（メタデータメンションまたは安全な regex パターン）。WhatsApp、Telegram、Discord、Google Chat、および iMessage のグループチャットに適用されます。

**メンションの種類:**

- **メタデータメンション**: ネイティブプラットフォームの @-mention。WhatsApp の self-chat モードでは無視されます。
- **テキストパターン**: `agents.list[].groupChat.mentionPatterns` 内の安全な regex パターン。無効なパターンや安全でない入れ子の繰り返しは無視されます。
- メンションゲーティングは、検出が可能な場合にのみ適用されます（ネイティブメンション、または少なくとも 1 つのパターンがある場合）。

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

`messages.groupChat.historyLimit` はグローバルデフォルトを設定します。チャネルごとの上書きには `channels.<channel>.historyLimit`（またはアカウントごと）を使用できます。`0` にすると無効です。

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

#### self-chat モード

自分の番号を `allowFrom` に含めると self-chat モードが有効になります（ネイティブ @-mention を無視し、テキストパターンにのみ応答します）。

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
    native: "auto", // 対応時にネイティブコマンドを登録
    nativeSkills: "auto", // 対応時にネイティブ Skills コマンドを登録
    text: true, // チャットメッセージ内の /commands を解析
    bash: false, // ! を許可（別名: /bash）
    bashForegroundMs: 2000,
    config: false, // /config を許可
    mcp: false, // /mcp を許可
    plugins: false, // /plugins を許可
    debug: false, // /debug を許可
    restart: true, // /restart + gateway restart ツールを許可
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

- このブロックはコマンドサーフェスを設定します。現在の組み込み + bundled コマンドカタログについては [Slash Commands](/ja-JP/tools/slash-commands) を参照してください。
- このページは**設定キーのリファレンス**であり、完全なコマンドカタログではありません。QQ Bot の `/bot-ping` `/bot-help` `/bot-logs`、LINE の `/card`、device-pair の `/pair`、memory の `/dreaming`、phone-control の `/phone`、Talk の `/voice` など、チャネル/Plugin が所有するコマンドは、それぞれのチャネル/Plugin ページおよび [Slash Commands](/ja-JP/tools/slash-commands) に記載されています。
- テキストコマンドは、先頭が `/` の**単独メッセージ**である必要があります。
- `native: "auto"` は Discord/Telegram ではネイティブコマンドを有効にし、Slack では無効のままにします。
- `nativeSkills: "auto"` は Discord/Telegram ではネイティブ Skills コマンドを有効にし、Slack では無効のままにします。
- チャネルごとの上書き: `channels.discord.commands.native`（bool または `"auto"`）。`false` は以前に登録されたコマンドを解除します。
- ネイティブ Skills 登録のチャネルごとの上書きには `channels.<provider>.commands.nativeSkills` を使用します。
- `channels.telegram.customCommands` は Telegram bot メニューに追加エントリを加えます。
- `bash: true` はホストシェル用の `! <cmd>` を有効にします。`tools.elevated.enabled` と、送信者が `tools.elevated.allowFrom.<channel>` に含まれている必要があります。
- `config: true` は `/config` を有効にします（`openclaw.json` の読み書き）。Gateway の `chat.send` クライアントでは、永続的な `/config set|unset` 書き込みには `operator.admin` も必要です。読み取り専用の `/config show` は通常の write スコープを持つ operator クライアントでも引き続き利用できます。
- `mcp: true` は、`mcp.servers` 配下の OpenClaw 管理 MCP サーバー設定用の `/mcp` を有効にします。
- `plugins: true` は、Plugin の検出、インストール、有効化/無効化制御用の `/plugins` を有効にします。
- `channels.<provider>.configWrites` は、チャネルごとの設定変更を制御します（デフォルト: true）。
- マルチアカウントチャネルでは、`channels.<provider>.accounts.<id>.configWrites` も、そのアカウントを対象とする書き込み（たとえば `/allowlist --config --account <id>` や `/config set channels.<provider>.accounts.<id>...`）を制御します。
- `restart: false` は `/restart` と gateway restart ツールアクションを無効にします。デフォルト: `true`。
- `ownerAllowFrom` は、owner 専用コマンド/ツールのための明示的な owner allowlist です。`allowFrom` とは別です。
- `ownerDisplay: "hash"` は、システムプロンプト内で owner ID をハッシュ化します。ハッシュを制御するには `ownerDisplaySecret` を設定します。
- `allowFrom` はプロバイダーごとです。これが設定されている場合、これが**唯一の**認可ソースになり（チャネル allowlist/ペアリングおよび `useAccessGroups` は無視されます）。
- `useAccessGroups: false` は、`allowFrom` が設定されていない場合に、コマンドが access-group ポリシーをバイパスできるようにします。
- コマンドドキュメントの対応表:
  - 組み込み + bundled カタログ: [Slash Commands](/ja-JP/tools/slash-commands)
  - チャネル固有のコマンドサーフェス: [Channels](/ja-JP/channels)
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

システムプロンプトの Runtime 行に表示される任意のリポジトリルートです。未設定の場合、OpenClaw は workspace から上方向にたどって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` を設定していないエージェントに対する、任意のデフォルト Skills allowlist です。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather を継承
      { id: "docs", skills: ["docs-search"] }, // デフォルトを置き換える
      { id: "locked-down", skills: [] }, // Skills なし
    ],
  },
}
```

- デフォルトで Skills を無制限にするには `agents.defaults.skills` を省略します。
- デフォルトを継承するには `agents.list[].skills` を省略します。
- Skills なしにするには `agents.list[].skills: []` を設定します。
- 空でない `agents.list[].skills` リストはそのエージェントの最終セットであり、デフォルトとはマージされません。

### `agents.defaults.skipBootstrap`

workspace bootstrap ファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）の自動作成を無効にします。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

workspace bootstrap ファイルをシステムプロンプトへ注入するタイミングを制御します。デフォルト: `"always"`。

- `"continuation-skip"`: 安全な継続ターン（assistant 応答完了後）では workspace bootstrap の再注入をスキップし、プロンプトサイズを削減します。Heartbeat 実行と compaction 後の再試行では引き続きコンテキストを再構築します。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰め前の workspace bootstrap ファイル 1 つあたりの最大文字数。デフォルト: `12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべての workspace bootstrap ファイルにまたがって注入される総最大文字数。デフォルト: `60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

bootstrap コンテキストが切り詰められたときに、エージェントに見える警告文をどうするかを制御します。
デフォルト: `"once"`。

- `"off"`: 警告文をシステムプロンプトに一切注入しません。
- `"once"`: 一意の切り詰めシグネチャごとに 1 回だけ警告を注入します（推奨）。
- `"always"`: 切り詰めがあるたびに毎回警告を注入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### コンテキスト予算の所有マップ

OpenClaw には大容量のプロンプト/コンテキスト予算が複数あり、
それらは 1 つの汎用ノブにまとめず、意図的にサブシステムごとに分割されています。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  通常の workspace bootstrap 注入。
- `agents.defaults.startupContext.*`:
  最近の `memory/*.md` ファイルを含む、一度きりの `/new` と `/reset`
  の起動前置き。
- `skills.limits.*`:
  システムプロンプトへ注入される compact な Skills リスト。
- `agents.defaults.contextLimits.*`:
  制限付きのランタイム抜粋と、ランタイム所有ブロックの注入。
- `memory.qmd.limits.*`:
  インデックス化された memory 検索スニペットと注入サイズ。

ある 1 つのエージェントだけが異なる予算を必要とする場合にのみ、
対応するエージェントごとの上書きを使用してください。

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

素の `/new` および `/reset` 実行で注入される最初のターンの起動前置きを制御します。

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

制限付きランタイムコンテキストサーフェス用の共有デフォルトです。

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

- `memoryGetMaxChars`: 切り詰めメタデータと継続通知が追加される前の、
  デフォルトの `memory_get` 抜粋上限。
- `memoryGetDefaultLines`: `lines` が省略されたときの、
  デフォルトの `memory_get` 行ウィンドウ。
- `toolResultMaxChars`: 永続化された結果と
  オーバーフロー回復に使用される、ライブなツール結果上限。
- `postCompactionMaxChars`: compaction 後の
  リフレッシュ注入時に使用される `AGENTS.md` 抜粋上限。

#### `agents.list[].contextLimits`

共有 `contextLimits` ノブに対するエージェントごとの上書きです。省略されたフィールドは
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

システムプロンプトへ注入される compact な Skills リストのグローバル上限です。
これは必要に応じて `SKILL.md` ファイルを読む動作には影響しません。

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

Skills プロンプト予算に対するエージェントごとの上書きです。

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

プロバイダー呼び出し前に transcript/tool の画像ブロックで許可される、画像の長辺の最大ピクセルサイズです。
デフォルト: `1200`。

値を下げると、通常はスクリーンショットの多い実行における vision token 使用量とリクエストペイロードサイズを削減できます。
値を上げると、より多くの視覚的詳細を保持できます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

システムプロンプトコンテキスト用のタイムゾーンです（メッセージタイムスタンプ用ではありません）。未設定の場合はホストのタイムゾーンにフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

システムプロンプト内の時刻形式です。デフォルト: `auto`（OS の設定に従う）。

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
      params: { cacheRetention: "long" }, // グローバルデフォルトのプロバイダーパラメータ
      embeddedHarness: {
        runtime: "auto", // auto | pi | 登録済み harness id（例: codex）
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

- `model`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 文字列形式は primary モデルのみを設定します。
  - オブジェクト形式は primary と順序付き failover モデルを設定します。
- `imageModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - `image` ツール経路で、その vision-model 設定として使われます。
  - 選択中/既定のモデルが画像入力を受け付けられない場合のフォールバックルーティングにも使われます。
- `imageGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有の画像生成機能と、今後追加される画像生成を行う任意のツール/Plugin サーフェスで使われます。
  - 典型的な値: Gemini ネイティブ画像生成には `google/gemini-3.1-flash-image-preview`、fal には `fal/fal-ai/flux/dev`、OpenAI Images には `openai/gpt-image-1`。
  - プロバイダー/モデルを直接選ぶ場合は、対応するプロバイダー認証/API キーも設定してください（たとえば `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/*` には `OPENAI_API_KEY`、`fal/*` には `FAL_KEY`）。
  - 省略した場合でも、`image_generate` は認証済みのプロバイダーデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、その後、登録済みの残りの画像生成プロバイダーをプロバイダー ID 順で試します。
- `musicGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有の音楽生成機能と、組み込みの `music_generate` ツールで使われます。
  - 典型的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、または `minimax/music-2.5+`。
  - 省略した場合でも、`music_generate` は認証済みのプロバイダーデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、その後、登録済みの残りの音楽生成プロバイダーをプロバイダー ID 順で試します。
  - プロバイダー/モデルを直接選ぶ場合は、対応するプロバイダー認証/API キーも設定してください。
- `videoGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有の動画生成機能と、組み込みの `video_generate` ツールで使われます。
  - 典型的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、または `qwen/wan2.7-r2v`。
  - 省略した場合でも、`video_generate` は認証済みのプロバイダーデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、その後、登録済みの残りの動画生成プロバイダーをプロバイダー ID 順で試します。
  - プロバイダー/モデルを直接選ぶ場合は、対応するプロバイダー認証/API キーも設定してください。
  - bundled の Qwen 動画生成プロバイダーは、最大 1 本の出力動画、1 枚の入力画像、4 本の入力動画、10 秒の長さ、およびプロバイダーレベルの `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートします。
- `pdfModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - `pdf` ツールのモデルルーティングで使われます。
  - 省略した場合、PDF ツールは `imageModel` にフォールバックし、その後、解決済みのセッション/デフォルトモデルにフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の、`pdf` ツール用デフォルト PDF サイズ上限。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバックモードで考慮されるデフォルトの最大ページ数。
- `verboseDefault`: エージェントのデフォルト verbose レベル。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `elevatedDefault`: エージェントのデフォルト elevated-output レベル。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は `provider/model`（例: `openai/gpt-5.4`）。プロバイダーを省略した場合、OpenClaw はまず alias を試し、その後、その正確な model id に対する一意の configured-provider 一致を試し、それでもだめな場合にのみ configured default provider にフォールバックします（非推奨の互換動作なので、明示的な `provider/model` を推奨します）。そのプロバイダーが設定済みデフォルトモデルをもう提供していない場合、OpenClaw は古い削除済みプロバイダーデフォルトを表面化する代わりに、最初に設定された provider/model にフォールバックします。
- `models`: `/model` 用の設定済みモデルカタログおよび allowlist。各エントリには `alias`（ショートカット）と `params`（プロバイダー固有。たとえば `temperature`、`maxTokens`、`cacheRetention`、`context1m`）を含められます。
- `params`: すべてのモデルに適用されるグローバルデフォルトのプロバイダーパラメータ。`agents.defaults.params` に設定します（例: `{ cacheRetention: "long" }`）。
- `params` のマージ優先順位（設定）: `agents.defaults.params`（グローバルベース）が `agents.defaults.models["provider/model"].params`（モデルごと）で上書きされ、その後 `agents.list[].params`（一致する agent id）がキーごとに上書きします。詳細は [Prompt Caching](/ja-JP/reference/prompt-caching) を参照してください。
- `embeddedHarness`: デフォルトの低レベル埋め込みエージェントランタイムポリシー。`runtime: "auto"` を使うと、登録済み Plugin harness が対応モデルを引き受けられます。`runtime: "pi"` は組み込みの Pi harness を強制します。`runtime: "codex"` のような登録済み harness id も使えます。自動的な Pi フォールバックを無効にするには `fallback: "none"` を設定します。
- これらのフィールドを変更する設定ライター（たとえば `/models set`、`/models set-image`、および fallback の追加/削除コマンド）は、正規のオブジェクト形式で保存し、可能な限り既存の fallback リストを保持します。
- `maxConcurrent`: セッションをまたぐ並列エージェント実行の最大数（各セッション自体は引き続き直列化されます）。デフォルト: 4。

### `agents.defaults.embeddedHarness`

`embeddedHarness` は、どの低レベル executor が埋め込みエージェントターンを実行するかを制御します。
ほとんどのデプロイでは、デフォルトの `{ runtime: "auto", fallback: "pi" }` のままで問題ありません。
bundled の Codex app-server harness のように、信頼できる Plugin がネイティブ harness を提供する場合に使用します。

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

- `runtime`: `"auto"`、`"pi"`、または登録済み Plugin harness id。bundled の Codex Plugin は `codex` を登録します。
- `fallback`: `"pi"` または `"none"`。`"pi"` は組み込みの Pi harness を互換フォールバックとして維持します。`"none"` は、Plugin harness の選択が存在しないか未対応の場合に、黙って Pi を使うのではなく失敗させます。
- 環境変数による上書き: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` は `runtime` を上書きし、`OPENCLAW_AGENT_HARNESS_FALLBACK=none` はそのプロセスで Pi フォールバックを無効にします。
- Codex 専用デプロイでは、`model: "codex/gpt-5.4"`、`embeddedHarness.runtime: "codex"`、`embeddedHarness.fallback: "none"` を設定してください。
- これは埋め込みチャット harness だけを制御します。メディア生成、vision、PDF、音楽、動画、および TTS は、引き続きそれぞれの provider/model 設定を使用します。

**組み込み alias の短縮形**（モデルが `agents.defaults.models` にある場合のみ適用）:

| Alias               | モデル                                 |
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

Z.AI の GLM-4.x モデルは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、自動的に thinking モードを有効にします。
Z.AI モデルは、ツール呼び出しストリーミングのためにデフォルトで `tool_stream` を有効にします。無効にするには `agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定します。
Anthropic Claude 4.6 モデルは、明示的な thinking レベルが設定されていない場合、デフォルトで `adaptive` thinking を使用します。

### `agents.defaults.cliBackends`

テキスト専用フォールバック実行用の任意の CLI バックエンドです（ツール呼び出しなし）。API プロバイダーが失敗したときのバックアップとして便利です。

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

- CLI バックエンドはテキスト優先で、ツールは常に無効です。
- `sessionArg` が設定されている場合はセッションをサポートします。
- `imageArg` がファイルパスを受け付ける場合は画像パススルーをサポートします。

### `agents.defaults.systemPromptOverride`

OpenClaw が組み立てたシステムプロンプト全体を固定文字列で置き換えます。デフォルトレベル（`agents.defaults.systemPromptOverride`）またはエージェントごと（`agents.list[].systemPromptOverride`）で設定します。エージェントごとの値が優先され、空または空白のみの値は無視されます。制御されたプロンプト実験に便利です。

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

定期的な Heartbeat 実行です。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m で無効
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // デフォルト: true。false の場合、システムプロンプトから Heartbeat セクションを省略
        lightContext: false, // デフォルト: false。true の場合、workspace bootstrap ファイルから HEARTBEAT.md のみを保持
        isolatedSession: false, // デフォルト: false。true の場合、各 Heartbeat を新しいセッションで実行（会話履歴なし）
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow（デフォルト）| block
        target: "none", // デフォルト: none | オプション: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: 期間文字列（ms/s/m/h）。デフォルト: `30m`（API-key 認証）または `1h`（OAuth 認証）。無効にするには `0m` を設定します。
- `includeSystemPromptSection`: false の場合、システムプロンプトから Heartbeat セクションを省略し、bootstrap コンテキストへの `HEARTBEAT.md` 注入もスキップします。デフォルト: `true`。
- `suppressToolErrorWarnings`: true の場合、Heartbeat 実行中のツールエラー警告ペイロードを抑制します。
- `timeoutSeconds`: 中断される前に Heartbeat エージェントターンに許可される最大秒数。未設定の場合は `agents.defaults.timeoutSeconds` を使用します。
- `directPolicy`: 直接/DM 配信ポリシー。`allow`（デフォルト）は direct-target 配信を許可します。`block` は direct-target 配信を抑制し、`reason=dm-blocked` を出力します。
- `lightContext`: true の場合、Heartbeat 実行は軽量な bootstrap コンテキストを使用し、workspace bootstrap ファイルから `HEARTBEAT.md` のみを保持します。
- `isolatedSession`: true の場合、各 Heartbeat は過去の会話履歴なしの新しいセッションで実行されます。Cron の `sessionTarget: "isolated"` と同じ分離パターンです。Heartbeat ごとのトークンコストを約 100K から約 2-5K トークンに削減します。
- エージェントごとの設定: `agents.list[].heartbeat` を設定します。いずれかのエージェントが `heartbeat` を定義すると、Heartbeat を実行するのは**それらのエージェントだけ**になります。
- Heartbeat は完全なエージェントターンを実行します — 間隔を短くすると消費トークンは増えます。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 登録済み compaction provider Plugin の id（任意）
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // identifierPolicy=custom のときに使用
        postCompactionSections: ["Session Startup", "Red Lines"], // [] で再注入を無効化
        model: "openrouter/anthropic/claude-sonnet-4-6", // 任意の compaction 専用モデル上書き
        notifyUser: true, // compaction 開始時と完了時に短い通知を送信（デフォルト: false）
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
- `provider`: 登録済み compaction provider Plugin の id。設定すると、組み込みの LLM 要約の代わりにそのプロバイダーの `summarize()` が呼ばれます。失敗時は組み込みへフォールバックします。provider を設定すると `mode: "safeguard"` が強制されます。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `timeoutSeconds`: OpenClaw が中断するまでに、1 回の compaction 操作に許可される最大秒数。デフォルト: `900`。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` は、compaction 要約中に組み込みの不透明識別子保持ガイダンスを前置します。
- `identifierInstructions`: `identifierPolicy=custom` のときに使われる、任意のカスタム識別子保持テキスト。
- `postCompactionSections`: compaction 後に再注入する任意の `AGENTS.md` H2/H3 セクション名。デフォルトは `["Session Startup", "Red Lines"]` です。`[]` を設定すると再注入を無効化します。未設定、または明示的にそのデフォルト組を設定した場合、旧来の `Every Session` / `Safety` 見出しもレガシーフォールバックとして受け入れられます。
- `model`: compaction 要約専用の任意の `provider/model-id` 上書き。メインセッションでは 1 つのモデルを維持しつつ、compaction 要約だけ別のモデルで実行したい場合に使用します。未設定の場合、compaction はセッションのメインモデルを使用します。
- `notifyUser`: `true` の場合、compaction 開始時と完了時に短い通知をユーザーへ送信します（たとえば「Compacting context...」や「Compaction complete」）。デフォルトでは、compaction を静かに保つため無効です。
- `memoryFlush`: 自動 Compaction 前に永続メモリを保存するための silent な agentic turn。workspace が読み取り専用の場合はスキップされます。

### `agents.defaults.contextPruning`

LLM に送信する前に、メモリ内コンテキストから**古い tool result** を削減します。ディスク上のセッション履歴は変更**しません**。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // 期間（ms/s/m/h）、デフォルト単位: 分
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

- `mode: "cache-ttl"` で削減パスが有効になります。
- `ttl` は、最後のキャッシュタッチ後にいつ再び削減を実行できるかを制御します。
- 削減では、まず大きすぎる tool result を soft-trim し、必要に応じて古い tool result を hard-clear します。

**Soft-trim** は先頭 + 末尾を保持し、中間に `...` を挿入します。

**Hard-clear** は tool result 全体を placeholder に置き換えます。

注意:

- 画像ブロックはトリム/クリアされません。
- ratio は文字数ベース（概算）であり、厳密なトークン数ではありません。
- `keepLastAssistants` 未満の assistant メッセージしか存在しない場合、削減はスキップされます。

</Accordion>

動作の詳細は [Session Pruning](/ja-JP/concepts/session-pruning) を参照してください。

### block ストリーミング

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom（minMs/maxMs を使用）
    },
  },
}
```

- Telegram 以外のチャネルでは、block 返信を有効にするには明示的な `*.blockStreaming: true` が必要です。
- チャネルごとの上書き: `channels.<channel>.blockStreamingCoalesce`（およびアカウントごとの派生設定）。Signal/Slack/Discord/Google Chat のデフォルトは `minChars: 1500` です。
- `humanDelay`: block 返信の間に入るランダム化された待機。`natural` = 800–2500ms。エージェントごとの上書き: `agents.list[].humanDelay`。

動作とチャンク分割の詳細は [Streaming](/ja-JP/concepts/streaming) を参照してください。

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
- セッションごとの上書き: `session.typingMode`、`session.typingIntervalSeconds`。

[Typing Indicators](/ja-JP/concepts/typing-indicators) を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

埋め込みエージェント用の任意の sandbox 化です。完全ガイドは [Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。

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

<Accordion title="Sandbox の詳細">

**バックエンド:**

- `docker`: ローカル Docker ランタイム（デフォルト）
- `ssh`: 汎用 SSH ベースのリモートランタイム
- `openshell`: OpenShell ランタイム

`backend: "openshell"` を選択した場合、ランタイム固有の設定は
`plugins.entries.openshell.config` に移動します。

**SSH バックエンド設定:**

- `target`: `user@host[:port]` 形式の SSH ターゲット
- `command`: SSH クライアントコマンド（デフォルト: `ssh`）
- `workspaceRoot`: スコープごとの workspace に使う絶対リモートルート
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH に渡される既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw がランタイム時に一時ファイルへ実体化するインライン内容または SecretRef
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH のホストキー方針ノブ

**SSH 認証の優先順位:**

- `identityData` は `identityFile` より優先
- `certificateData` は `certificateFile` より優先
- `knownHostsData` は `knownHostsFile` より優先
- SecretRef ベースの `*Data` 値は、sandbox セッション開始前にアクティブな secrets ランタイムスナップショットから解決されます

**SSH バックエンドの動作:**

- 作成または再作成後に一度だけリモート workspace をシードする
- その後、リモート SSH workspace を正規の状態として維持する
- `exec`、ファイルツール、メディアパスを SSH 経由でルーティングする
- リモート変更を自動的にホストへ同期しない
- sandbox browser コンテナはサポートしない

**workspace アクセス:**

- `none`: `~/.openclaw/sandboxes` 配下のスコープごとの sandbox workspace
- `ro`: `/workspace` に sandbox workspace、`/agent` に読み取り専用でマウントされた agent workspace
- `rw`: `/workspace` に読み書き可能でマウントされた agent workspace

**スコープ:**

- `session`: セッションごとのコンテナ + workspace
- `agent`: エージェントごとに 1 つのコンテナ + workspace（デフォルト）
- `shared`: 共有コンテナと共有 workspace（セッション間分離なし）

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
          gateway: "lab", // 任意
          gatewayEndpoint: "https://lab.example", // 任意
          policy: "strict", // 任意の OpenShell policy id
          providers: ["openai"], // 任意
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell モード:**

- `mirror`: exec 前にローカルからリモートへシードし、exec 後に同期を戻す。ローカル workspace が正規状態のまま
- `remote`: sandbox 作成時に一度だけリモートへシードし、その後はリモート workspace を正規状態として維持する

`remote` モードでは、シード後に OpenClaw の外で行われたホストローカルの編集は sandbox へ自動同期されません。
転送は OpenShell sandbox への SSH ですが、sandbox のライフサイクルと任意の mirror 同期は Plugin が所有します。

**`setupCommand`** はコンテナ作成後に一度だけ実行されます（`sh -lc` 経由）。ネットワーク外向き接続、書き込み可能な root、root ユーザーが必要です。

**コンテナのデフォルトは `network: "none"`** です — エージェントに外向きアクセスが必要なら `"bridge"`（またはカスタム bridge network）へ設定してください。
`"host"` はブロックされます。`"container:<id>"` もデフォルトではブロックされますが、
明示的に `sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` を設定した場合のみ許可されます（緊急手段）。

**受信添付ファイル** は、アクティブ workspace 内の `media/inbound/*` にステージされます。

**`docker.binds`** は追加のホストディレクトリをマウントします。グローバルおよびエージェントごとの bind はマージされます。

**sandbox 化されたブラウザー**（`sandbox.browser.enabled`）: コンテナ内で動作する Chromium + CDP。noVNC URL はシステムプロンプトに注入されます。`openclaw.json` で `browser.enabled` は不要です。
noVNC のオブザーバーアクセスはデフォルトで VNC 認証を使用し、OpenClaw は共有 URL にパスワードを露出する代わりに、短命トークン URL を発行します。

- `allowHostControl: false`（デフォルト）は、sandbox 化されたセッションがホストブラウザーを対象にすることをブロックします。
- `network` のデフォルトは `openclaw-sandbox-browser`（専用 bridge network）です。グローバルな bridge 接続性が必要な場合にのみ `bridge` に設定してください。
- `cdpSourceRange` は、任意で CDP の受信をコンテナ境界で CIDR 範囲（たとえば `172.21.0.1/32`）に制限します。
- `sandbox.browser.binds` は、追加のホストディレクトリを sandbox browser コンテナにのみマウントします。設定されている場合（`[]` を含む）、browser コンテナについては `docker.binds` を置き換えます。
- 起動時のデフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義され、コンテナホスト向けに調整されています:
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
    デフォルトで有効で、WebGL/3D の利用で必要な場合は
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効化できます。
  - ワークフローが拡張機能に依存する場合は、
    `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で再有効化できます。
  - `--renderer-process-limit=2` は
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で変更できます。Chromium の
    デフォルトのプロセス上限を使うには `0` を設定します。
  - さらに、`noSandbox` が有効な場合は `--no-sandbox` と `--disable-setuid-sandbox`。
  - デフォルトはコンテナイメージのベースラインです。コンテナのデフォルトを変更するには、
    カスタム entrypoint を持つカスタム browser image を使用してください。

</Accordion>

ブラウザー sandbox 化と `sandbox.docker.binds` は Docker 専用です。

イメージをビルドします:

```bash
scripts/sandbox-setup.sh           # メイン sandbox イメージ
scripts/sandbox-browser-setup.sh   # 任意の browser イメージ
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
        model: "anthropic/claude-opus-4-6", // または { primary, fallbacks }
        thinkingDefault: "high", // エージェントごとの thinking レベル上書き
        reasoningDefault: "on", // エージェントごとの reasoning 可視性上書き
        fastModeDefault: false, // エージェントごとの fast mode 上書き
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

- `id`: 安定したエージェント ID（必須）。
- `default`: 複数設定されている場合は最初のものが勝ちます（警告を記録）。1 つも設定されていない場合は、リストの最初のエントリがデフォルトです。
- `model`: 文字列形式は `primary` のみを上書きし、オブジェクト形式 `{ primary, fallbacks }` は両方を上書きします（`[]` でグローバル fallback を無効化）。`primary` だけを上書きする Cron ジョブは、`fallbacks: []` を設定しない限り、デフォルト fallback を引き続き継承します。
- `params`: 選択された `agents.defaults.models` のモデルエントリの上にマージされる、エージェントごとの stream params。モデルカタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` のようなエージェント固有の上書きに使います。
- `skills`: 任意のエージェントごとの Skills allowlist。省略した場合、このエージェントは `agents.defaults.skills` が設定されていればそれを継承します。明示リストはデフォルトをマージせず置き換え、`[]` は Skills なしを意味します。
- `thinkingDefault`: 任意のエージェントごとのデフォルト thinking レベル（`off | minimal | low | medium | high | xhigh | adaptive`）。メッセージ単位またはセッション上書きがない場合、このエージェントでは `agents.defaults.thinkingDefault` を上書きします。
- `reasoningDefault`: 任意のエージェントごとのデフォルト reasoning 可視性（`on | off | stream`）。メッセージ単位またはセッションの reasoning 上書きがない場合に適用されます。
- `fastModeDefault`: 任意のエージェントごとの fast mode デフォルト（`true | false`）。メッセージ単位またはセッションの fast-mode 上書きがない場合に適用されます。
- `embeddedHarness`: 任意のエージェントごとの低レベル harness ポリシー上書き。ある 1 エージェントだけを Codex 専用にし、他のエージェントはデフォルトの Pi フォールバックを維持したい場合は `{ runtime: "codex", fallback: "none" }` を使用します。
- `runtime`: 任意のエージェントごとのランタイム記述子。エージェントがデフォルトで ACP harness セッションを使うべき場合は、`type: "acp"` と `runtime.acp` のデフォルト（`agent`、`backend`、`mode`、`cwd`）を使用します。
- `identity.avatar`: workspace 相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを導出します: `ackReaction` は `emoji` から、`mentionPatterns` は `name` / `emoji` から導出されます。
- `subagents.allowAgents`: `sessions_spawn` 用のエージェント ID allowlist（`["*"]` = 任意。デフォルト: 同一エージェントのみ）。
- sandbox 継承ガード: 要求元セッションが sandbox 化されている場合、`sessions_spawn` は sandbox 化されずに実行されるターゲットを拒否します。
- `subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制。デフォルト: false）。

---

## マルチエージェントルーティング

1 つの Gateway 内で複数の分離されたエージェントを実行します。[Multi-Agent](/ja-JP/concepts/multi-agent) を参照してください。

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

- `type`（任意）: 通常のルーティングは `route`（type 省略時も route）、永続 ACP 会話バインディングは `acp`。
- `match.channel`（必須）
- `match.accountId`（任意。`*` = 任意のアカウント、省略 = デフォルトアカウント）
- `match.peer`（任意。`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（任意。チャネル固有）
- `acp`（任意。`type: "acp"` の場合のみ）: `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（peer/guild/team なしの完全一致）
5. `match.accountId: "*"`（チャネル全体）
6. デフォルトエージェント

各 tier 内では、最初に一致した `bindings` エントリが勝ちます。

`type: "acp"` エントリでは、OpenClaw は正確な会話 ID（`match.channel` + account + `match.peer.id`）で解決し、上記の route バインディング tier 順序は使用しません。

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
    parentForkMaxTokens: 100000, // このトークン数を超える親スレッド fork はスキップ（0 で無効）
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // 期間または false
      maxDiskBytes: "500mb", // 任意のハード予算
      highWaterBytes: "400mb", // 任意のクリーンアップ目標
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // デフォルトの非アクティブ自動 unfocus 時間（`0` で無効）
      maxAgeHours: 0, // デフォルトのハード最大年齢時間（`0` で無効）
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

<Accordion title="セッションフィールドの詳細">

- **`scope`**: グループチャット文脈に対する基本セッショングループ化戦略。
  - `per-sender`（デフォルト）: チャネル文脈内で、各送信者ごとに分離されたセッションを持ちます。
  - `global`: チャネル文脈内のすべての参加者が 1 つのセッションを共有します（共有コンテキストを意図する場合にのみ使用）。
- **`dmScope`**: DM をどのようにグループ化するか。
  - `main`: すべての DM が main セッションを共有します。
  - `per-peer`: チャネルをまたいで送信者 ID ごとに分離します。
  - `per-channel-peer`: チャネル + 送信者ごとに分離します（マルチユーザー受信箱に推奨）。
  - `per-account-channel-peer`: アカウント + チャネル + 送信者ごとに分離します（マルチアカウントに推奨）。
- **`identityLinks`**: チャネル横断のセッション共有のために、正規 ID を provider 接頭辞付き peer にマップします。
- **`reset`**: 主たるリセットポリシー。`daily` はローカル時間の `atHour` にリセットし、`idle` は `idleMinutes` 経過後にリセットします。両方が設定されている場合は、先に期限切れになるほうが勝ちます。
- **`resetByType`**: 種別ごとの上書き（`direct`、`group`、`thread`）。旧来の `dm` も `direct` の別名として受け付けられます。
- **`parentForkMaxTokens`**: fork されたスレッドセッションを作成するときに許可される親セッション `totalTokens` の最大値（デフォルト `100000`）。
  - 親の `totalTokens` がこの値を超える場合、OpenClaw は親トランスクリプト履歴を継承せず、新しいスレッドセッションを開始します。
  - このガードを無効にして常に親 fork を許可するには `0` を設定します。
- **`mainKey`**: legacy フィールド。ランタイムはメインのダイレクトチャットバケットに常に `"main"` を使用します。
- **`agentToAgent.maxPingPongTurns`**: agent-to-agent 交換中にエージェント間で許可される最大 reply-back ターン数（整数、範囲: `0`–`5`）。`0` は ping-pong 連鎖を無効化します。
- **`sendPolicy`**: `channel`、`chatType`（`direct|group|channel`、legacy の `dm` 別名あり）、`keyPrefix`、または `rawKeyPrefix` で一致します。最初の deny が勝ちます。
- **`maintenance`**: セッションストアのクリーンアップ + 保持制御。
  - `mode`: `warn` は警告のみ出し、`enforce` はクリーンアップを適用します。
  - `pruneAfter`: 古いエントリの経過時間しきい値（デフォルト `30d`）。
  - `maxEntries`: `sessions.json` 内の最大エントリ数（デフォルト `500`）。
  - `rotateBytes`: `sessions.json` がこのサイズを超えたらローテーションします（デフォルト `10mb`）。
  - `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間。デフォルトでは `pruneAfter` を使用します。無効にするには `false` を設定します。
  - `maxDiskBytes`: 任意の sessions ディレクトリディスク予算。`warn` モードでは警告を記録し、`enforce` モードでは最も古い artifact/session から先に削除します。
  - `highWaterBytes`: 予算クリーンアップ後の任意の目標値。デフォルトでは `maxDiskBytes` の `80%`。
- **`threadBindings`**: スレッドバインド型セッション機能のグローバルデフォルト。
  - `enabled`: マスターのデフォルトスイッチ（プロバイダー側で上書き可能。Discord は `channels.discord.threadBindings.enabled` を使用）
  - `idleHours`: デフォルトの非アクティブ自動 unfocus 時間（`0` で無効。プロバイダー側で上書き可能）
  - `maxAgeHours`: デフォルトのハード最大年齢時間（`0` で無効。プロバイダー側で上書き可能）

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

チャネル/アカウントごとの上書き: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決順序（最も具体的なものが勝つ）: account → channel → global。`""` は無効化し、カスケードも停止します。`"auto"` は `[{identity.name}]` を導出します。

**テンプレート変数:**

| 変数              | 説明                 | 例                          |
| ----------------- | -------------------- | --------------------------- |
| `{model}`         | 短いモデル名         | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子   | `anthropic/claude-opus-4-6` |
| `{provider}`      | プロバイダー名       | `anthropic`                 |
| `{thinkingLevel}` | 現在の thinking レベル | `high`、`low`、`off`      |
| `{identity.name}` | エージェント ID 名   | （`"auto"` と同じ）         |

変数は大文字小文字を区別しません。`{think}` は `{thinkingLevel}` の別名です。

### ack リアクション

- デフォルトはアクティブなエージェントの `identity.emoji`、それ以外は `"👀"`。無効化するには `""` を設定します。
- チャネルごとの上書き: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: account → channel → `messages.ackReaction` → identity フォールバック。
- スコープ: `group-mentions`（デフォルト）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: Slack、Discord、Telegram では返信後に ack を削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Telegram でライフサイクル status reaction を有効にします。
  Slack と Discord では、未設定の場合、ack reaction が有効なとき status reaction も有効のままです。
  Telegram では、ライフサイクル status reaction を有効にするには明示的に `true` を設定してください。

### 受信 debounce

同じ送信者からの連続したテキストのみのメッセージを、1 回のエージェントターンにまとめます。メディア/添付は即座にフラッシュされます。制御コマンドは debounce をバイパスします。

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

- `auto` はデフォルトの自動 TTS モードを制御します: `off`、`always`、`inbound`、または `tagged`。`/tts on|off` はローカル設定を上書きでき、`/tts status` は有効な状態を表示します。
- `summaryModel` は自動要約用に `agents.defaults.model.primary` を上書きします。
- `modelOverrides` はデフォルトで有効です。`modelOverrides.allowProvider` のデフォルトは `false`（opt-in）です。
- API キーは `ELEVENLABS_API_KEY`/`XI_API_KEY` および `OPENAI_API_KEY` にフォールバックします。
- `openai.baseUrl` は OpenAI TTS エンドポイントを上書きします。解決順序は、設定、次に `OPENAI_TTS_BASE_URL`、最後に `https://api.openai.com/v1` です。
- `openai.baseUrl` が OpenAI 以外のエンドポイントを指している場合、OpenClaw はそれを OpenAI 互換 TTS サーバーとして扱い、model/voice 検証を緩和します。

---

## Talk

Talk モード（macOS/iOS/Android）のデフォルトです。

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

- `talk.provider` は、複数の Talk プロバイダーが設定されている場合、`talk.providers` 内のキーと一致している必要があります。
- legacy のフラットな Talk キー（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）は互換性専用であり、自動的に `talk.providers.<provider>` へ移行されます。
- Voice ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `providers.*.apiKey` は平文文字列または SecretRef オブジェクトを受け付けます。
- `ELEVENLABS_API_KEY` へのフォールバックは、Talk API キーが設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases` により、Talk ディレクティブでわかりやすい名前を使えます。
- `silenceTimeoutMs` は、ユーザーが無音になってから transcript を送信するまで Talk モードが待つ時間を制御します。未設定の場合はプラットフォームのデフォルトの待機時間を使用します（macOS と Android では `700 ms`、iOS では `900 ms`）。

---

## ツール

### ツールプロファイル

`tools.profile` は、`tools.allow`/`tools.deny` の前にベース allowlist を設定します。

ローカルのオンボーディングでは、未設定の新しいローカル設定に対して `tools.profile: "coding"` をデフォルト設定します（既存の明示的なプロファイルは保持されます）。

| プロファイル | 含まれるもの                                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`    | `session_status` のみ                                                                                                            |
| `coding`     | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`image`、`image_generate`、`video_generate` |
| `messaging`  | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`                                       |
| `full`       | 制限なし（未設定と同じ）                                                                                                         |

### ツールグループ

| グループ           | ツール                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`、`process`、`code_execution`（`bash` は `exec` の別名として受け付けられます）                                   |
| `group:fs`         | `read`、`write`、`edit`、`apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status` |
| `group:memory`     | `memory_search`、`memory_get`                                                                                           |
| `group:web`        | `web_search`、`x_search`、`web_fetch`                                                                                   |
| `group:ui`         | `browser`、`canvas`                                                                                                     |
| `group:automation` | `cron`、`gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`、`image_generate`、`video_generate`、`tts`                                                                      |
| `group:openclaw`   | すべての組み込みツール（provider Plugin は除外）                                                                        |

### `tools.allow` / `tools.deny`

グローバルなツール allow/deny ポリシーです（deny が優先）。大文字小文字を区別せず、`*` ワイルドカードをサポートします。Docker sandbox がオフでも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

特定のプロバイダーまたはモデルに対して、ツールをさらに制限します。順序: ベースプロファイル → プロバイダープロファイル → allow/deny。

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

sandbox の外での elevated exec アクセスを制御します。

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

- エージェントごとの上書き（`agents.list[].tools.elevated`）では、さらに制限することしかできません。
- `/elevated on|off|ask|full` は状態をセッションごとに保存します。インラインディレクティブは単一メッセージに適用されます。
- elevated `exec` は sandbox をバイパスし、設定済みの escape path（デフォルトは `gateway`、exec ターゲットが `node` の場合は `node`）を使用します。

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

ツールループの安全チェックは、デフォルトでは**無効**です。有効にするには `enabled: true` を設定します。
設定はグローバルに `tools.loopDetection` で定義でき、エージェントごとに `agents.list[].tools.loopDetection` で上書きできます。

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

- `historySize`: ループ分析のために保持するツール呼び出し履歴の最大数。
- `warningThreshold`: 警告を出す、進捗のない繰り返しパターンのしきい値。
- `criticalThreshold`: 重大なループをブロックするための、より高い繰り返ししきい値。
- `globalCircuitBreakerThreshold`: 進捗のない任意の実行に対するハード停止しきい値。
- `detectors.genericRepeat`: 同じツール/同じ引数の繰り返し呼び出しで警告します。
- `detectors.knownPollNoProgress`: 既知の poll ツール（`process.poll`、`command_status` など）での進捗なしに対して警告/ブロックします。
- `detectors.pingPong`: 交互に現れる進捗なしペアパターンで警告/ブロックします。
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
        directSend: false, // opt-in: 完了した非同期の音楽/動画をチャネルへ直接送信
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

<Accordion title="メディアモデルエントリのフィールド">

**Provider エントリ**（`type: "provider"` または省略時）:

- `provider`: API プロバイダー ID（`openai`、`anthropic`、`google`/`gemini`、`groq` など）
- `model`: モデル ID 上書き
- `profile` / `preferredProfile`: `auth-profiles.json` のプロファイル選択

**CLI エントリ**（`type: "cli"`）:

- `command`: 実行する実行ファイル
- `args`: テンプレート化された引数（`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポート）

**共通フィールド:**

- `capabilities`: 任意のリスト（`image`、`audio`、`video`）。デフォルト: `openai`/`anthropic`/`minimax` → image、`google` → image+audio+video、`groq` → audio。
- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: エントリごとの上書き。
- 失敗時は次のエントリへフォールバックします。

プロバイダー認証は標準順序に従います: `auth-profiles.json` → 環境変数 → `models.providers.*.apiKey`。

**非同期完了フィールド:**

- `asyncCompletion.directSend`: `true` の場合、完了した非同期 `music_generate`
  および `video_generate` タスクは、まずチャネルへの直接配信を試みます。デフォルト: `false`
  （legacy の requester-session wake/model-delivery 経路）。

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

session ツール（`sessions_list`、`sessions_history`、`sessions_send`）でどのセッションを対象にできるかを制御します。

デフォルト: `tree`（現在のセッション + そこから起動されたセッション、たとえば subagent）。

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

- `self`: 現在のセッションキーのみ。
- `tree`: 現在のセッション + 現在のセッションから起動されたセッション（subagent）。
- `agent`: 現在の agent id に属する任意のセッション（同じ agent id のもとで per-sender セッションを動かしている場合、他ユーザーを含むことがあります）。
- `all`: 任意のセッション。agent をまたぐターゲティングには、引き続き `tools.agentToAgent` が必要です。
- sandbox クランプ: 現在のセッションが sandbox 化されていて、`agents.defaults.sandbox.sessionToolsVisibility="spawned"` の場合、`tools.sessions.visibility="all"` であっても visibility は `tree` に強制されます。

### `tools.sessions_spawn`

`sessions_spawn` のインライン添付サポートを制御します。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: true にするとインラインファイル添付を許可
        maxTotalBytes: 5242880, // 全ファイル合計 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // ファイルごと 1 MB
        retainOnSessionKeep: false, // cleanup="keep" のとき添付を保持
      },
    },
  },
}
```

注意:

- 添付は `runtime: "subagent"` でのみサポートされます。ACP ランタイムは拒否します。
- ファイルは子 workspace の `.openclaw/attachments/<uuid>/` に `.manifest.json` とともに実体化されます。
- 添付内容は transcript 永続化から自動的に伏字化されます。
- Base64 入力は、厳格な alphabet/padding チェックとデコード前サイズガードで検証されます。
- ファイル権限はディレクトリが `0700`、ファイルが `0600` です。
- クリーンアップは `cleanup` ポリシーに従います: `delete` は常に添付を削除し、`keep` は `retainOnSessionKeep: true` の場合にのみ保持します。

### `tools.experimental`

実験的な組み込みツールフラグです。strict-agentic GPT-5 の自動有効化ルールが適用される場合を除き、デフォルトはオフです。

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

- `planTool`: 自明でない複数ステップ作業の追跡のための、構造化された `update_plan` ツールを有効にします。
- デフォルト: `false`。ただし `agents.defaults.embeddedPi.executionContract`（またはエージェントごとの上書き）が OpenAI または OpenAI Codex の GPT-5 ファミリー実行に対して `"strict-agentic"` に設定されている場合は除きます。その範囲外でもツールを強制的にオンにするには `true` を、strict-agentic GPT-5 実行でもオフのままにするには `false` を設定します。
- 有効時は、システムプロンプトにも使用ガイダンスが追加され、モデルはそれを実質的な作業にのみ使用し、`in_progress` のステップを最大 1 つだけ保つようになります。

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

- `model`: 起動されたサブエージェント用のデフォルトモデル。省略した場合、サブエージェントは呼び出し元のモデルを継承します。
- `allowAgents`: 要求元エージェントが自身の `subagents.allowAgents` を設定していない場合に、`sessions_spawn` の対象エージェント ID として使うデフォルト allowlist（`["*"]` = 任意。デフォルト: 同一エージェントのみ）。
- `runTimeoutSeconds`: ツール呼び出しで `runTimeoutSeconds` が省略された場合の、`sessions_spawn` 用デフォルトタイムアウト（秒）。`0` はタイムアウトなしを意味します。
- サブエージェントごとのツールポリシー: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタムプロバイダーと base URL

OpenClaw は組み込みモデルカタログを使用します。カスタムプロバイダーは設定の `models.providers`、または `~/.openclaw/agents/<agentId>/agent/models.json` で追加します。

```json5
{
  models: {
    mode: "merge", // merge（デフォルト）| replace
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

- カスタム認証が必要な場合は `authHeader: true` + `headers` を使用します。
- エージェント設定ルートの上書きには `OPENCLAW_AGENT_DIR`（または legacy 環境変数エイリアスの `PI_CODING_AGENT_DIR`）を使用します。
- 一致する provider ID に対するマージ優先順位:
  - 空でない agent `models.json` の `baseUrl` 値が優先されます。
  - 空でない agent `apiKey` 値は、そのプロバイダーが現在の config/auth-profile 文脈で SecretRef 管理されていない場合にのみ優先されます。
  - SecretRef 管理された provider `apiKey` 値は、解決済み secret を永続化する代わりに、ソースマーカー（env ref では `ENV_VAR_NAME`、file/exec ref では `secretref-managed`）から更新されます。
  - SecretRef 管理された provider header 値は、ソースマーカー（env ref では `secretref-env:ENV_VAR_NAME`、file/exec ref では `secretref-managed`）から更新されます。
  - 空または欠落した agent `apiKey`/`baseUrl` は、設定内の `models.providers` にフォールバックします。
  - 一致するモデルの `contextWindow`/`maxTokens` には、明示設定値と暗黙カタログ値のうち高いほうが使われます。
  - 一致するモデルの `contextTokens` には、存在する場合、明示的なランタイム上限が保持されます。ネイティブモデルメタデータを変更せずに有効コンテキストを制限したい場合に使ってください。
  - 設定で `models.json` を完全に書き換えたい場合は `models.mode: "replace"` を使用します。
  - マーカーの永続化はソース権威型です。マーカーは解決済みランタイム secret 値からではなく、アクティブなソース設定スナップショット（解決前）から書き込まれます。

### プロバイダーフィールドの詳細

- `models.mode`: プロバイダーカタログの動作（`merge` または `replace`）。
- `models.providers`: provider id をキーにしたカスタムプロバイダーマップ。
- `models.providers.*.api`: リクエストアダプター（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` など）。
- `models.providers.*.apiKey`: プロバイダー認証情報（SecretRef/環境変数置換を推奨）。
- `models.providers.*.auth`: 認証戦略（`api-key`、`token`、`oauth`、`aws-sdk`）。
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` 用。リクエストに `options.num_ctx` を注入します（デフォルト: `true`）。
- `models.providers.*.authHeader`: 必要な場合に、`Authorization` ヘッダーでの認証情報転送を強制します。
- `models.providers.*.baseUrl`: 上流 API の base URL。
- `models.providers.*.headers`: プロキシ/テナントルーティング用の追加静的ヘッダー。
- `models.providers.*.request`: model-provider HTTP リクエストの転送上書き。
  - `request.headers`: 追加ヘッダー（プロバイダーデフォルトとマージ）。値は SecretRef を受け付けます。
  - `request.auth`: 認証戦略の上書き。モード: `"provider-default"`（プロバイダー組み込み認証を使用）、`"authorization-bearer"`（`token` とともに使用）、`"header"`（`headerName`、`value`、任意の `prefix` とともに使用）。
  - `request.proxy`: HTTP プロキシ上書き。モード: `"env-proxy"`（`HTTP_PROXY`/`HTTPS_PROXY` 環境変数を使用）、`"explicit-proxy"`（`url` とともに使用）。どちらのモードも任意の `tls` サブオブジェクトを受け付けます。
  - `request.tls`: 直接接続用の TLS 上書き。フィールド: `ca`、`cert`、`key`、`passphrase`（すべて SecretRef 可）、`serverName`、`insecureSkipVerify`。
  - `request.allowPrivateNetwork`: `true` の場合、DNS が private、CGNAT、または類似範囲に解決される `baseUrl` への HTTPS を、provider HTTP fetch ガード経由で許可します（信頼済みセルフホスト OpenAI 互換エンドポイント向けの operator opt-in）。WebSocket では、ヘッダー/TLS に同じ `request` を使いますが、その fetch SSRF ガードは使いません。デフォルトは `false`。
- `models.providers.*.models`: 明示的なプロバイダーモデルカタログエントリ。
- `models.providers.*.models.*.contextWindow`: ネイティブモデルのコンテキストウィンドウメタデータ。
- `models.providers.*.models.*.contextTokens`: 任意のランタイムコンテキスト上限。モデルのネイティブ `contextWindow` より小さい有効コンテキスト予算を使いたい場合に使用します。
- `models.providers.*.models.*.compat.supportsDeveloperRole`: 任意の互換性ヒント。`api: "openai-completions"` で、かつ空でない非ネイティブ `baseUrl`（ホストが `api.openai.com` ではない）では、OpenClaw は実行時にこれを `false` に強制します。空または省略された `baseUrl` の場合はデフォルトの OpenAI 動作を維持します。
- `models.providers.*.models.*.compat.requiresStringContent`: 文字列のみ対応の OpenAI 互換チャットエンドポイント向け任意互換性ヒント。`true` の場合、OpenClaw はリクエスト送信前に純粋なテキスト `messages[].content` 配列をプレーン文字列に平坦化します。
- `plugins.entries.amazon-bedrock.config.discovery`: Bedrock 自動検出設定のルート。
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: 暗黙的検出をオン/オフします。
- `plugins.entries.amazon-bedrock.config.discovery.region`: 検出用の AWS リージョン。
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: 対象を絞った検出のための任意の provider-id フィルター。
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: 検出更新のポーリング間隔。
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: 検出されたモデル用のフォールバックコンテキストウィンドウ。
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: 検出されたモデル用のフォールバック最大出力トークン数。

### プロバイダー例

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

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

Cerebras には `cerebras/zai-glm-4.7` を使い、Z.AI 直結には `zai/glm-4.7` を使います。

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

`OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）を設定してください。Zen カタログには `opencode/...` 参照を、Go カタログには `opencode-go/...` 参照を使用します。ショートカット: `openclaw onboard --auth-choice opencode-zen` または `openclaw onboard --auth-choice opencode-go`。

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

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

`ZAI_API_KEY` を設定してください。`z.ai/*` と `z-ai/*` は受け付けられる別名です。ショートカット: `openclaw onboard --auth-choice zai-api-key`。

- 一般エンドポイント: `https://api.z.ai/api/paas/v4`
- Coding エンドポイント（デフォルト）: `https://api.z.ai/api/coding/paas/v4`
- 一般エンドポイントには、base URL 上書きを持つカスタムプロバイダーを定義してください。

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

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

中国向けエンドポイントでは `baseUrl: "https://api.moonshot.cn/v1"` を使うか、`openclaw onboard --auth-choice moonshot-api-key-cn` を使用してください。

ネイティブ Moonshot エンドポイントは、共有の
`openai-completions` 転送上でストリーミング利用互換性を告知しており、OpenClaw は組み込み provider id のみではなく、そのエンドポイント機能に基づいてそれを判断します。

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

Anthropic 互換の組み込みプロバイダーです。ショートカット: `openclaw onboard --auth-choice kimi-code-api-key`。

</Accordion>

<Accordion title="Synthetic (Anthropic-compatible)">

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

base URL には `/v1` を含めないでください（Anthropic クライアントが追加します）。ショートカット: `openclaw onboard --auth-choice synthetic-api-key`。

</Accordion>

<Accordion title="MiniMax M2.7 (direct)">

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
モデルカタログのデフォルトは M2.7 のみです。
Anthropic 互換ストリーミング経路では、明示的に `thinking` を設定しない限り、
OpenClaw はデフォルトで MiniMax の thinking を無効にします。`/fast on` または
`params.fastMode: true` は `MiniMax-M2.7` を
`MiniMax-M2.7-highspeed` に書き換えます。

</Accordion>

<Accordion title="ローカルモデル (LM Studio)">

[Local Models](/ja-JP/gateway/local-models) を参照してください。要点: 十分な性能のハードウェア上で LM Studio Responses API 経由の大きなローカルモデルを使い、フォールバック用にホスト型モデルはマージしたままにしておきます。

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // または平文文字列
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: bundled Skills のみを対象とする任意の allowlist（managed/workspace Skills には影響しません）。
- `load.extraDirs`: 追加の共有 Skills ルート（最も低い優先順位）。
- `install.preferBrew`: `true` の場合、`brew` が使用可能なら、
  他のインストーラー種別へフォールバックする前に Homebrew インストーラーを優先します。
- `install.nodeManager`: `metadata.openclaw.install`
  仕様用の node インストーラー優先設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false` は、その Skills が bundled/インストール済みでも無効化します。
- `entries.<skillKey>.apiKey`: プライマリ環境変数を宣言する Skills 向けの簡易設定（平文文字列または SecretRef オブジェクト）。

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

- 読み込み元は `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions`、および `plugins.load.paths` です。
- 検出はネイティブ OpenClaw Plugin に加え、互換性のある Codex bundle と Claude bundle、manifest を持たない Claude のデフォルトレイアウト bundle も受け付けます。
- **設定変更には Gateway の再起動が必要です。**
- `allow`: 任意の allowlist（列挙された Plugin のみを読み込みます）。`deny` が優先されます。
- `plugins.entries.<id>.apiKey`: Plugin レベルの API キー簡易フィールド（Plugin が対応している場合）。
- `plugins.entries.<id>.env`: Plugin スコープの環境変数マップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、core は `before_prompt_build` をブロックし、legacy の `before_agent_start` からのプロンプト変更フィールドを無視します。一方で、legacy の `modelOverride` と `providerOverride` は保持します。ネイティブ Plugin hook と、対応する bundle 提供 hook ディレクトリに適用されます。
- `plugins.entries.<id>.subagent.allowModelOverride`: この Plugin がバックグラウンド subagent 実行に対して実行ごとの `provider` および `model` 上書きを要求することを明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼済み subagent 上書き用の、正規 `provider/model` ターゲットの任意 allowlist。意図的に任意のモデルを許可したい場合にのみ `"*"` を使用してください。
- `plugins.entries.<id>.config`: Plugin 定義の設定オブジェクト（利用可能な場合はネイティブ OpenClaw Plugin スキーマで検証されます）。
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl の web-fetch プロバイダー設定。
  - `apiKey`: Firecrawl API キー（SecretRef 可）。`plugins.entries.firecrawl.config.webSearch.apiKey`、legacy の `tools.web.fetch.firecrawl.apiKey`、または `FIRECRAWL_API_KEY` 環境変数へフォールバックします。
  - `baseUrl`: Firecrawl API の base URL（デフォルト: `https://api.firecrawl.dev`）。
  - `onlyMainContent`: ページからメインコンテンツのみを抽出します（デフォルト: `true`）。
  - `maxAgeMs`: 最大キャッシュ有効期間（ミリ秒）（デフォルト: `172800000` / 2 日）。
  - `timeoutSeconds`: スクレイプリクエストのタイムアウト秒数（デフォルト: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok web search）設定。
  - `enabled`: X Search プロバイダーを有効にします。
  - `model`: 検索に使用する Grok モデル（例: `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`: memory dreaming 設定。フェーズとしきい値については [Dreaming](/ja-JP/concepts/dreaming) を参照してください。
  - `enabled`: dreaming のマスタースイッチ（デフォルト `false`）。
  - `frequency`: 各完全 dreaming sweep の Cron 間隔（デフォルトは `"0 3 * * *"`）。
  - フェーズポリシーとしきい値は実装詳細であり、ユーザー向け設定キーではありません。
- memory の完全な設定は [Memory configuration reference](/ja-JP/reference/memory-config) にあります:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効化された Claude bundle Plugin は `settings.json` から埋め込み Pi デフォルトを提供することもでき、OpenClaw はそれらを生の OpenClaw 設定パッチとしてではなく、サニタイズ済みエージェント設定として適用します。
- `plugins.slots.memory`: アクティブな memory Plugin id を選択します。memory Plugin を無効にするには `"none"` を指定します。
- `plugins.slots.contextEngine`: アクティブな context engine Plugin id を選択します。別の engine をインストールして選択しない限り、デフォルトは `"legacy"` です。
- `plugins.installs`: `openclaw plugins update` が使用する CLI 管理のインストールメタデータ。
  - `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、`resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt` を含みます。
  - `plugins.installs.*` は管理状態として扱い、手動編集より CLI コマンドを優先してください。

[Plugins](/ja-JP/tools/plugin) を参照してください。

---

## ブラウザー

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 信頼済み private-network アクセスにのみ opt in
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定時は無効なので、ブラウザーナビゲーションはデフォルトで strict のままです。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` は、private-network ブラウザーナビゲーションを意図的に信頼する場合にのみ設定してください。
- strict モードでは、リモート CDP プロファイルエンドポイント（`profiles.*.cdpUrl`）も到達性/検出チェック時に同じ private-network ブロックの対象になります。
- `ssrfPolicy.allowPrivateNetwork` は legacy alias として引き続きサポートされています。
- strict モードでは、明示的な例外に `ssrfPolicy.hostnameAllowlist` と `ssrfPolicy.allowedHostnames` を使用します。
- リモートプロファイルは attach-only です（start/stop/reset は無効）。
- `profiles.*.cdpUrl` は `http://`、`https://`、`ws://`、`wss://` を受け付けます。
  OpenClaw に `/json/version` を検出させたい場合は HTTP(S) を使用し、
  プロバイダーが直接の DevTools WebSocket URL を提供する場合は WS(S)
  を使用してください。
- `existing-session` プロファイルは CDP ではなく Chrome MCP を使用し、
  選択したホスト上、または接続済みブラウザーノード経由でアタッチできます。
- `existing-session` プロファイルでは、Brave や Edge のような特定の
  Chromium ベースブラウザープロファイルを対象にするために `userDataDir`
  を設定できます。
- `existing-session` プロファイルは、現在の Chrome MCP のルート制限を維持します:
  CSS セレクター指定ではなく snapshot/ref ベースのアクション、単一ファイルアップロード
  hook、ダイアログタイムアウト上書きなし、`wait --load networkidle` なし、
  `responsebody`、PDF エクスポート、ダウンロード傍受、バッチアクションなし。
- ローカル管理の `openclaw` プロファイルは `cdpPort` と `cdpUrl` を自動割り当てします。明示的に
  `cdpUrl` を設定するのはリモート CDP の場合だけにしてください。
- 自動検出順序: デフォルトブラウザーが Chromium ベースならそれを優先 → Chrome → Brave → Edge → Chromium → Chrome Canary。
- Control service: loopback のみ（ポートは `gateway.port` から導出、デフォルト `18791`）。
- `extraArgs` は、ローカル Chromium 起動に追加の起動フラグを付加します（たとえば
  `--disable-gpu`、ウィンドウサイズ指定、デバッグフラグなど）。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // 絵文字、短いテキスト、画像 URL、または data URI
    },
  },
}
```

- `seamColor`: ネイティブアプリ UI クローム用のアクセントカラー（Talk Mode のバブル色など）。
- `assistant`: Control UI の ID 上書き。未設定時はアクティブなエージェント ID にフォールバックします。

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
      // allowedOrigins: ["https://control.example.com"], // loopback 以外の Control UI では必須
      // dangerouslyAllowHostHeaderOriginFallback: false, // 危険な Host ヘッダー origin フォールバックモード
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
    // 任意。デフォルト false。
    allowRealIpFallback: false,
    tools: {
      // 追加の /tools/invoke HTTP deny
      deny: ["browser"],
      // デフォルト HTTP deny リストからツールを除外
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

<Accordion title="Gateway フィールドの詳細">

- `mode`: `local`（gateway を実行）または `remote`（リモート gateway に接続）。Gateway は `local` でない限り起動を拒否します。
- `port`: WS + HTTP 用の単一多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（デフォルト）、`lan`（`0.0.0.0`）、`tailnet`（Tailscale IP のみ）、または `custom`。
- **legacy bind alias**: `gateway.bind` にはホスト alias（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）ではなく、bind モード値（`auto`、`loopback`、`lan`、`tailnet`、`custom`）を使用してください。
- **Docker の注意**: デフォルトの `loopback` bind はコンテナ内の `127.0.0.1` で待ち受けます。Docker bridge ネットワーク（`-p 18789:18789`）ではトラフィックは `eth0` に到達するため、gateway へ到達できません。`--network host` を使うか、全インターフェースで待ち受けるために `bind: "lan"`（または `bind: "custom"` と `customBindHost: "0.0.0.0"`）を設定してください。
- **認証**: デフォルトで必須です。loopback 以外の bind では gateway 認証が必要です。実運用では、共有 token/password か、`gateway.auth.mode: "trusted-proxy"` を持つ ID 認識型 reverse proxy を意味します。オンボーディングウィザードはデフォルトで token を生成します。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されている場合（SecretRef を含む）、`gateway.auth.mode` を `token` または `password` に明示設定してください。両方が設定され mode が未設定の場合、起動および service install/repair フローは失敗します。
- `gateway.auth.mode: "none"`: 明示的な no-auth モード。信頼済みの local loopback セットアップでのみ使用してください。これは意図的にオンボーディングプロンプトでは提供されません。
- `gateway.auth.mode: "trusted-proxy"`: 認証を ID 認識型 reverse proxy に委譲し、`gateway.trustedProxies` からの ID ヘッダーを信頼します（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。このモードは **非 loopback** の proxy ソースを前提とします。同一ホストの loopback reverse proxy は trusted-proxy auth の条件を満たしません。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve の ID ヘッダーが Control UI/WebSocket 認証を満たせます（`tailscale whois` で検証）。HTTP API エンドポイントはその Tailscale ヘッダー認証を使用**しません**。代わりに gateway の通常 HTTP 認証モードに従います。この token なしフローは gateway ホストが信頼されていることを前提とします。`tailscale.mode = "serve"` のときのデフォルトは `true` です。
- `gateway.auth.rateLimit`: 任意の認証失敗リミッター。クライアント IP ごと、かつ認証スコープごとに適用されます（shared-secret と device-token は独立して追跡されます）。ブロックされた試行は `429` + `Retry-After` を返します。
  - 非同期の Tailscale Serve Control UI 経路では、同じ `{scope, clientIp}` に対する失敗試行は失敗書き込み前に直列化されます。そのため、同一クライアントからの並行する不正試行は、両方が単なる不一致として通り抜けるのではなく、2 回目のリクエストでリミッターに達することがあります。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。テスト構成や厳格な proxy デプロイで localhost トラフィックも意図的にレート制限したい場合は `false` に設定してください。
- ブラウザー起点の WS 認証試行は、loopback 免除を無効にした状態で常にスロットリングされます（ブラウザーベースの localhost 総当たり攻撃に対する多層防御）。
- loopback 上では、それらの browser-origin lockout は正規化された `Origin`
  値ごとに分離されるため、1 つの localhost origin からの繰り返し失敗が
  別の origin を自動的にロックアウトすることはありません。
- `tailscale.mode`: `serve`（tailnet のみ、loopback bind）または `funnel`（公開、認証必須）。
- `controlUi.allowedOrigins`: Gateway WebSocket 接続用の明示的な browser-origin allowlist。browser クライアントを non-loopback origin から受け入れる場合に必須です。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host ヘッダー origin ポリシーに意図的に依存するデプロイ用の、危険な Host ヘッダー origin フォールバックモードを有効にします。
- `remote.transport`: `ssh`（デフォルト）または `direct`（ws/wss）。`direct` の場合、`remote.url` は `ws://` または `wss://` である必要があります。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 信頼済み private-network IP への平文 `ws://` を許可するクライアント側の緊急上書き。デフォルトでは、平文は引き続き loopback のみです。
- `gateway.remote.token` / `.password` はリモートクライアント用の認証情報フィールドです。これ自体で gateway 認証を設定するものではありません。
- `gateway.push.apns.relay.baseUrl`: relay ベースの登録を gateway に公開した後に、公式/TestFlight iOS ビルドが使う外部 APNs relay の base HTTPS URL。この URL は iOS ビルドにコンパイルされた relay URL と一致している必要があります。
- `gateway.push.apns.relay.timeoutMs`: gateway から relay への送信タイムアウト（ミリ秒）。デフォルトは `10000`。
- relay ベースの登録は特定の gateway ID に委譲されます。ペアリングされた iOS アプリは `gateway.identity.get` を取得し、その ID を relay 登録に含め、登録スコープの送信許可を gateway へ転送します。別の gateway はその保存済み登録を再利用できません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記 relay 設定の一時的な環境変数上書き。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL 用の開発専用 escape hatch。本番 relay URL は HTTPS のままにしてください。
- `gateway.channelHealthCheckMinutes`: チャネル健全性モニター間隔（分）。チャネル健全性モニターによる再起動をグローバルに無効にするには `0` を設定します。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: 古いソケット判定のしきい値（分）。これは `gateway.channelHealthCheckMinutes` 以上にしてください。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: ローリング 1 時間あたりの、チャネル/アカウントごとの健全性モニター再起動最大回数。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバルモニターを有効のまま維持しつつ、チャネルごとの健全性モニター再起動 opt-out。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: マルチアカウントチャネル用のアカウントごとの上書き。設定されている場合、チャネルレベル上書きより優先されます。
- ローカル gateway 呼び出し経路では、`gateway.auth.*` が未設定のときにのみ `gateway.remote.*` をフォールバックとして使用できます。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示設定され、未解決の場合、解決は fail-closed になります（リモートフォールバックで隠されることはありません）。
- `trustedProxies`: TLS を終端する、または転送クライアントヘッダーを注入する reverse proxy の IP。自分が管理する proxy だけを列挙してください。loopback エントリも同一ホスト proxy/ローカル検出セットアップ（たとえば Tailscale Serve やローカル reverse proxy）では有効ですが、loopback リクエストが `gateway.auth.mode: "trusted-proxy"` の対象になるわけでは**ありません**。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` がないときに gateway は `X-Real-IP` を受け付けます。fail-closed 動作のためデフォルトは `false`。
- `gateway.tools.deny`: HTTP `POST /tools/invoke` で追加でブロックするツール名（デフォルト deny リストを拡張）。
- `gateway.tools.allow`: デフォルト HTTP deny リストからツール名を除外します。

</Accordion>

### OpenAI 互換エンドポイント

- Chat Completions: デフォルトでは無効です。`gateway.http.endpoints.chatCompletions.enabled: true` で有効にします。
- Responses API: `gateway.http.endpoints.responses.enabled`。
- Responses URL 入力のハードニング:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空の allowlist は未設定として扱われます。URL 取得を無効にするには
    `gateway.http.endpoints.responses.files.allowUrl=false`
    および/または `gateway.http.endpoints.responses.images.allowUrl=false` を使用してください。
- 任意の応答ハードニングヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity`（自分が管理する HTTPS origin にのみ設定してください。 [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts) を参照）

### マルチインスタンス分離

1 台のホストで複数 gateway を、固有のポートと state dir で実行します。

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

- `enabled`: gateway リスナーで TLS 終端（HTTPS/WSS）を有効にします（デフォルト: `false`）。
- `autoGenerate`: 明示的なファイルが設定されていない場合に、ローカルの自己署名証明書/鍵ペアを自動生成します。ローカル/開発用途のみです。
- `certPath`: TLS 証明書ファイルへのファイルシステムパス。
- `keyPath`: TLS 秘密鍵ファイルへのファイルシステムパス。権限を制限してください。
- `caPath`: クライアント検証またはカスタム信頼チェーン用の任意の CA バンドルパス。

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

- `mode`: 設定編集を実行時にどう適用するかを制御します。
  - `"off"`: ライブ編集を無視します。変更には明示的な再起動が必要です。
  - `"restart"`: 設定変更時に常に gateway プロセスを再起動します。
  - `"hot"`: 再起動せずにプロセス内で変更を適用します。
  - `"hybrid"`（デフォルト）: まず hot reload を試し、必要なら再起動にフォールバックします。
- `debounceMs`: 設定変更適用前の debounce ウィンドウ（ms）（非負整数）。
- `deferralTimeoutMs`: 実行中処理を待った後、再起動を強制するまでの最大待機時間（ms）（デフォルト: `300000` = 5 分）。

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
クエリ文字列の hook token は拒否されます。

検証と安全上の注意:

- `hooks.enabled=true` には空でない `hooks.token` が必要です。
- `hooks.token` は `gateway.auth.token` と**異なっている**必要があります。Gateway token の再利用は拒否されます。
- `hooks.path` は `/` にできません。`/hooks` のような専用サブパスを使ってください。
- `hooks.allowRequestSessionKey=true` の場合は、`hooks.allowedSessionKeyPrefixes` を制限してください（たとえば `["hook:"]`）。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエスト payload の `sessionKey` は、`hooks.allowRequestSessionKey=true` の場合にのみ受け付けられます（デフォルト: `false`）。
- `POST /hooks/<name>` → `hooks.mappings` 経由で解決

<Accordion title="マッピングの詳細">

- `match.path` は `/hooks` の後ろのサブパスに一致します（例: `/hooks/gmail` → `gmail`）。
- `match.source` は汎用パスに対する payload フィールドに一致します。
- `{{messages[0].subject}}` のようなテンプレートは payload から読み取ります。
- `transform` は hook action を返す JS/TS モジュールを指せます。
  - `transform.module` は相対パスである必要があり、`hooks.transformsDir` の内部に留まる必要があります（絶対パスと traversal は拒否されます）。
- `agentId` は特定のエージェントへルーティングします。不明な ID はデフォルトにフォールバックします。
- `allowedAgentIds`: 明示的なルーティングを制限します（`*` または省略 = すべて許可、`[]` = すべて拒否）。
- `defaultSessionKey`: 明示的な `sessionKey` を持たない hook agent 実行用の任意の固定 session key。
- `allowRequestSessionKey`: `/hooks/agent` の呼び出し元が `sessionKey` を設定できるようにします（デフォルト: `false`）。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値（request + mapping）用の任意 prefix allowlist。例: `["hook:"]`。
- `deliver: true` は最終返信をチャネルへ送信します。`channel` のデフォルトは `last` です。
- `model` はこの hook 実行用の LLM を上書きします（モデルカタログが設定されている場合、それで許可されている必要があります）。

</Accordion>

### Gmail 統合

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

- 設定されている場合、Gateway は起動時に自動で `gog gmail watch serve` を開始します。無効化するには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。
- Gateway と並行して別個の `gog gmail watch serve` を実行しないでください。

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

- Gateway ポート配下で、エージェントが編集可能な HTML/CSS/JS と A2UI を HTTP 経由で提供します:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカル専用: `gateway.bind: "loopback"`（デフォルト）のままにしてください。
- 非 loopback bind: canvas ルートには、他の Gateway HTTP サーフェスと同様に Gateway 認証（token/password/trusted-proxy）が必要です。
- Node WebView は通常認証ヘッダーを送信しません。node がペアリングされ接続されると、Gateway は canvas/A2UI アクセス用の node スコープ capability URL を通知します。
- Capability URL はアクティブな node WS セッションに結び付けられ、短時間で失効します。IP ベースのフォールバックは使用されません。
- 提供される HTML に live-reload クライアントを注入します。
- 空の場合はスターター `index.html` を自動作成します。
- A2UI も `/__openclaw__/a2ui/` で提供します。
- 変更には gateway の再起動が必要です。
- 大きなディレクトリや `EMFILE` エラーがある場合は live reload を無効にしてください。

---

## Discovery

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal`（デフォルト）: TXT レコードから `cliPath` + `sshPort` を省略します。
- `full`: `cliPath` + `sshPort` を含めます。
- ホスト名のデフォルトは `openclaw` です。`OPENCLAW_MDNS_HOSTNAME` で上書きできます。

### 広域 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 配下にユニキャスト DNS-SD ゾーンを書き込みます。ネットワーク横断の検出には、DNS サーバー（推奨: CoreDNS）+ Tailscale split DNS と組み合わせてください。

セットアップ: `openclaw dns setup --apply`。

---

## 環境

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

- インライン環境変数は、プロセス環境にそのキーが存在しない場合にのみ適用されます。
- `.env` ファイル: CWD の `.env` + `~/.openclaw/.env`（どちらも既存の変数を上書きしません）。
- `shellEnv`: ログインシェルのプロファイルから、不足している期待キーを取り込みます。
- 完全な優先順位は [Environment](/ja-JP/help/environment) を参照してください。

### 環境変数置換

任意の設定文字列で `${VAR_NAME}` により環境変数を参照できます。

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 一致するのは大文字名のみです: `[A-Z_][A-Z0-9_]*`。
- 変数が存在しない、または空の場合、設定読み込み時にエラーになります。
- リテラルの `${VAR}` にしたい場合は `$${VAR}` でエスケープします。
- `$include` でも動作します。

---

## Secrets

SecretRef は加算的です。平文値も引き続き使えます。

### `SecretRef`

1 つのオブジェクト形を使用します。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` パターン: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` の id パターン: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` の id: 絶対 JSON pointer（例: `"/providers/openai/apiKey"`）
- `source: "exec"` の id パターン: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` の id には `.` または `..` のスラッシュ区切りパスセグメントを含めてはいけません（例: `a/../b` は拒否されます）

### 対応する認証情報サーフェス

- 正規の一覧: [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface)
- `secrets apply` は、対応する `openclaw.json` の認証情報パスを対象にします。
- `auth-profiles.json` の ref も、ランタイム解決と監査対象に含まれます。

### Secret provider 設定

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // 任意の明示 env provider
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

- `file` provider は `mode: "json"` と `mode: "singleValue"` をサポートします（singleValue モードでは `id` は `"value"` でなければなりません）。
- `exec` provider は絶対 `command` パスを必要とし、stdin/stdout 上のプロトコル payload を使用します。
- デフォルトでは、symlink の command パスは拒否されます。解決後ターゲットパスを検証しつつ symlink パスを許可するには `allowSymlinkCommand: true` を設定してください。
- `trustedDirs` が設定されている場合、trusted-dir チェックは解決後ターゲットパスに適用されます。
- `exec` 子プロセス環境はデフォルトで最小限です。必要な変数は `passEnv` で明示的に渡してください。
- Secret ref はアクティベーション時にメモリ内スナップショットへ解決され、その後リクエスト経路はそのスナップショットのみを読み取ります。
- アクティブサーフェスフィルタリングがアクティベーション時に適用されます。有効サーフェス上の未解決 ref は起動/再読み込みを失敗させ、非アクティブサーフェスは診断付きでスキップされます。

---

## 認証保存

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

- エージェントごとのプロファイルは `<agentDir>/auth-profiles.json` に保存されます。
- `auth-profiles.json` は、静的認証モードに対して値レベル ref（`api_key` 用の `keyRef`、`token` 用の `tokenRef`）をサポートします。
- OAuth モードのプロファイル（`auth.profiles.<id>.mode = "oauth"`）は、SecretRef ベースの auth-profile 認証情報をサポートしません。
- 静的ランタイム認証情報は、メモリ内の解決済みスナップショットから取得されます。legacy の静的 `auth.json` エントリは、見つかると削除されます。
- legacy OAuth は `~/.openclaw/credentials/oauth.json` からインポートされます。
- [OAuth](/ja-JP/concepts/oauth) を参照してください。
- secrets ランタイム動作と `audit/configure/apply` ツール: [Secrets Management](/ja-JP/gateway/secrets)。

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
  billing/残高不足エラーによりプロファイルが失敗した場合の、ベースバックオフ時間（時間単位）
  （デフォルト: `5`）。明示的な billing 文言は、たとえ `401`/`403` 応答でも
  ここに分類されますが、プロバイダー固有のテキスト
  マッチャーは、そのプロバイダーに限定されたままです（たとえば OpenRouter の
  `Key limit exceeded`）。再試行可能な HTTP `402` の利用枠や
  organization/workspace の spend-limit メッセージは、代わりに `rate_limit`
  経路に残ります。
- `billingBackoffHoursByProvider`: billing バックオフ時間に対する任意のプロバイダーごとの上書き。
- `billingMaxHours`: billing バックオフ指数成長の上限時間（デフォルト: `24`）。
- `authPermanentBackoffMinutes`: 高信頼度の `auth_permanent` 失敗に対するベースバックオフ分数（デフォルト: `10`）。
- `authPermanentMaxMinutes`: `auth_permanent` バックオフ成長の上限分数（デフォルト: `60`）。
- `failureWindowHours`: バックオフカウンターに使うローリングウィンドウ時間（デフォルト: `24`）。
- `overloadedProfileRotations`: 過負荷エラー時にモデルフォールバックへ切り替える前に許可される、同一プロバイダー内 auth-profile ローテーションの最大数（デフォルト: `1`）。`ModelNotReadyException` のような provider-busy 形状はここに分類されます。
- `overloadedBackoffMs`: 過負荷のプロバイダー/プロファイルローテーションを再試行する前の固定遅延（デフォルト: `0`）。
- `rateLimitedProfileRotations`: レート制限エラー時にモデルフォールバックへ切り替える前に許可される、同一プロバイダー内 auth-profile ローテーションの最大数（デフォルト: `1`）。この rate-limit バケットには、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted` のような provider 由来の文言も含まれます。

---

## ロギング

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
- 固定パスにするには `logging.file` を設定してください。
- `consoleLevel` は `--verbose` で `debug` に上がります。
- `maxFileBytes`: 書き込みを抑制する前の最大ログファイルサイズ（バイト単位）（正の整数。デフォルト: `524288000` = 500 MB）。本番デプロイでは外部ログローテーションを使用してください。

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

- `enabled`: instrumentation 出力のマスタースイッチ（デフォルト: `true`）。
- `flags`: 対象を絞ったログ出力を有効にするフラグ文字列の配列（`"telegram.*"` や `"*"` のようなワイルドカードをサポート）。
- `stuckSessionWarnMs`: セッションが processing 状態のままのときに stuck-session 警告を出すまでの経過時間しきい値（ms）。
- `otel.enabled`: OpenTelemetry エクスポートパイプラインを有効にします（デフォルト: `false`）。
- `otel.endpoint`: OTel エクスポート用コレクター URL。
- `otel.protocol`: `"http/protobuf"`（デフォルト）または `"grpc"`。
- `otel.headers`: OTel エクスポートリクエストとともに送る追加の HTTP/gRPC メタデータヘッダー。
- `otel.serviceName`: resource attribute 用の service name。
- `otel.traces` / `otel.metrics` / `otel.logs`: trace、metrics、または log エクスポートを有効にします。
- `otel.sampleRate`: trace サンプリング率 `0`–`1`。
- `otel.flushIntervalMs`: 定期的な telemetry flush 間隔（ms）。
- `cacheTrace.enabled`: 埋め込み実行の cache trace スナップショットを記録します（デフォルト: `false`）。
- `cacheTrace.filePath`: cache trace JSONL の出力パス（デフォルト: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: cache trace 出力に何を含めるかを制御します（すべてデフォルト: `true`）。

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

- `channel`: npm/git インストール用のリリースチャネル — `"stable"`、`"beta"`、または `"dev"`。
- `checkOnStart`: gateway 起動時に npm 更新を確認します（デフォルト: `true`）。
- `auto.enabled`: package インストール用のバックグラウンド自動更新を有効にします（デフォルト: `false`）。
- `auto.stableDelayHours`: stable チャネルの自動適用前に最低限待つ時間（時間単位）（デフォルト: `6`、最大: `168`）。
- `auto.stableJitterHours`: stable チャネルの追加ロールアウト分散ウィンドウ（時間単位）（デフォルト: `12`、最大: `168`）。
- `auto.betaCheckIntervalHours`: beta チャネルの確認を行う間隔（時間単位）（デフォルト: `1`、最大: `24`）。

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

- `enabled`: グローバル ACP 機能ゲート（デフォルト: `false`）。
- `dispatch.enabled`: ACP セッションターン dispatch 用の独立したゲート（デフォルト: `true`）。`false` にすると、ACP コマンドは利用可能なまま実行だけをブロックします。
- `backend`: デフォルトの ACP ランタイム backend id（登録済み ACP ランタイム Plugin と一致している必要があります）。
- `defaultAgent`: spawn が明示的なターゲットを指定しない場合のフォールバック ACP 対象エージェント ID。
- `allowedAgents`: ACP ランタイムセッションに許可されるエージェント ID の allowlist。空の場合は追加制限なしを意味します。
- `maxConcurrentSessions`: 同時にアクティブにできる ACP セッションの最大数。
- `stream.coalesceIdleMs`: ストリームされたテキストの idle flush ウィンドウ（ms）。
- `stream.maxChunkChars`: ストリームされたブロック投影を分割する前の最大チャンクサイズ。
- `stream.repeatSuppression`: ターンごとの繰り返し status/tool 行を抑制します（デフォルト: `true`）。
- `stream.deliveryMode`: `"live"` は増分ストリーミングし、`"final_only"` はターン終端イベントまでバッファします。
- `stream.hiddenBoundarySeparator`: 非表示ツールイベント後、可視テキストの前に入れる区切り（デフォルト: `"paragraph"`）。
- `stream.maxOutputChars`: ACP ターンごとに投影される assistant 出力文字数の最大値。
- `stream.maxSessionUpdateChars`: 投影される ACP status/update 行の最大文字数。
- `stream.tagVisibility`: ストリームイベントに対するタグ名ごとの真偽可視性上書きの記録。
- `runtime.ttlMinutes`: クリーンアップ対象となるまでの ACP セッションワーカーの idle TTL（分）。
- `runtime.installCommand`: ACP ランタイム環境のブートストラップ時に実行する任意の install コマンド。

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

- `cli.banner.taglineMode` はバナーのタグラインスタイルを制御します:
  - `"random"`（デフォルト）: 回転する面白い/季節物のタグライン。
  - `"default"`: 固定の中立タグライン（`All your chats, one OpenClaw.`）。
  - `"off"`: タグラインテキストなし（バナーのタイトル/バージョンは引き続き表示）。
- バナー全体を隠したい場合（タグラインだけでなく）は、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定してください。

---

## ウィザード

CLI のガイド付きセットアップフロー（`onboard`、`configure`、`doctor`）が書き込むメタデータ:

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

[Agent defaults](#agent-defaults) 配下の `agents.list` identity フィールドを参照してください。

---

## Bridge（legacy、削除済み）

現行ビルドには TCP bridge は含まれていません。Node は Gateway WebSocket 経由で接続します。`bridge.*` キーはもはや設定スキーマの一部ではありません（削除するまで検証は失敗します。`openclaw doctor --fix` で未知のキーを削除できます）。

<Accordion title="legacy bridge 設定（歴史的参考）">

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
    webhook: "https://example.invalid/legacy", // 非推奨。保存済み notify:true ジョブ用のフォールバック
    webhookToken: "replace-with-dedicated-token", // 任意。外向き webhook 認証用の bearer token
    sessionRetention: "24h", // 期間文字列または false
    runLog: {
      maxBytes: "2mb", // デフォルト 2_000_000 バイト
      keepLines: 2000, // デフォルト 2000
    },
  },
}
```

- `sessionRetention`: 完了した分離 Cron 実行セッションを `sessions.json` から削除する前にどれだけ保持するか。削除済み Cron transcript のアーカイブクリーンアップも制御します。デフォルト: `24h`。無効にするには `false` を設定します。
- `runLog.maxBytes`: 削除前の実行ログファイルごとの最大サイズ（`cron/runs/<jobId>.jsonl`）。デフォルト: `2_000_000` バイト。
- `runLog.keepLines`: 実行ログ削除が発動したときに保持される最新行数。デフォルト: `2000`。
- `webhookToken`: Cron webhook POST 配信（`delivery.mode = "webhook"`）に使う bearer token。省略した場合、認証ヘッダーは送信されません。
- `webhook`: 非推奨の legacy フォールバック webhook URL（http/https）。まだ `notify: true` を持つ保存済みジョブに対してのみ使われます。

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

- `maxAttempts`: 一時的エラー時に one-shot ジョブで行う最大再試行回数（デフォルト: `3`、範囲: `0`–`10`）。
- `backoffMs`: 各再試行で使うバックオフ遅延の配列（ms）（デフォルト: `[30000, 60000, 300000]`、1–10 エントリ）。
- `retryOn`: 再試行を引き起こすエラー種別 — `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略した場合はすべての一時的種別を再試行します。

one-shot Cron ジョブにのみ適用されます。定期ジョブは別の失敗処理を使います。

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

- `enabled`: Cron ジョブの失敗アラートを有効にします（デフォルト: `false`）。
- `after`: アラート発火前の連続失敗回数（正の整数、最小: `1`）。
- `cooldownMs`: 同じジョブに対する繰り返しアラート間の最小ミリ秒数（非負整数）。
- `mode`: 配信モード — `"announce"` はチャネルメッセージで送信し、`"webhook"` は設定済み webhook に POST します。
- `accountId`: アラート配信のスコープを限定する任意のアカウントまたはチャネル ID。

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

- すべてのジョブに共通する、Cron 失敗通知のデフォルト送信先です。
- `mode`: `"announce"` または `"webhook"`。十分なターゲットデータがある場合、デフォルトは `"announce"` です。
- `channel`: announce 配信用のチャネル上書き。`"last"` は最後に分かっている配信チャネルを再利用します。
- `to`: 明示的な announce ターゲットまたは webhook URL。webhook モードでは必須です。
- `accountId`: 配信用の任意のアカウント上書き。
- ジョブごとの `delivery.failureDestination` は、このグローバルデフォルトを上書きします。
- グローバルにもジョブごとにも失敗送信先が設定されていない場合、すでに `announce` で配信するジョブは、失敗時にそのプライマリ announce ターゲットへフォールバックします。
- `delivery.failureDestination` は、ジョブのプライマリ `delivery.mode` が `"webhook"` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。

[Cron Jobs](/ja-JP/automation/cron-jobs) を参照してください。分離された Cron 実行は [background tasks](/ja-JP/automation/tasks) として追跡されます。

---

## メディアモデルテンプレート変数

`tools.media.models[].args` で展開されるテンプレートプレースホルダー:

| 変数               | 説明                                            |
| ------------------ | ----------------------------------------------- |
| `{{Body}}`         | 受信メッセージ本文全体                          |
| `{{RawBody}}`      | 生の本文（履歴/送信者ラッパーなし）             |
| `{{BodyStripped}}` | グループメンションを除去した本文                |
| `{{From}}`         | 送信者識別子                                    |
| `{{To}}`           | 送信先識別子                                    |
| `{{MessageSid}}`   | チャネルメッセージ ID                           |
| `{{SessionId}}`    | 現在のセッション UUID                           |
| `{{IsNewSession}}` | 新しいセッションが作成されたとき `"true"`       |
| `{{MediaUrl}}`     | 受信メディアの疑似 URL                          |
| `{{MediaPath}}`    | ローカルメディアパス                            |
| `{{MediaType}}`    | メディア種別（image/audio/document/…）          |
| `{{Transcript}}`   | 音声 transcript                                 |
| `{{Prompt}}`       | CLI エントリ用に解決されたメディアプロンプト     |
| `{{MaxChars}}`     | CLI エントリ用に解決された最大出力文字数         |
| `{{ChatType}}`     | `"direct"` または `"group"`                     |
| `{{GroupSubject}}` | グループ subject（ベストエフォート）            |
| `{{GroupMembers}}` | グループメンバーのプレビュー（ベストエフォート） |
| `{{SenderName}}`   | 送信者表示名（ベストエフォート）                |
| `{{SenderE164}}`   | 送信者電話番号（ベストエフォート）              |
| `{{Provider}}`     | プロバイダーヒント（whatsapp、telegram、discord など） |

---

## 設定 include（`$include`）

設定を複数ファイルに分割できます。

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
- ファイル配列: 順番に deep-merge されます（後のものが前を上書き）。
- 兄弟キー: include の後でマージされます（include 済み値を上書き）。
- ネストされた include: 最大 10 階層まで。
- パス: include 元ファイルを基準に解決されますが、トップレベル設定ディレクトリ（`openclaw.json` の `dirname`）の内側に収まっている必要があります。絶対パスや `../` 形式も、その境界内に解決される場合にのみ許可されます。
- エラー: 存在しないファイル、パースエラー、循環 include に対して明確なメッセージを返します。

---

_関連: [Configuration](/ja-JP/gateway/configuration) · [Configuration Examples](/ja-JP/gateway/configuration-examples) · [Doctor](/ja-JP/gateway/doctor)_
