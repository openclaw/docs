---
read_when:
    - チャンネルPluginの設定（認証、アクセス制御、マルチアカウント）
    - チャンネルごとの設定キーのトラブルシューティング
    - DM ポリシー、グループポリシー、またはメンション制御の監査
summary: 'チャンネル設定: Slack、Discord、Telegram、WhatsApp、Matrix、iMessage などにわたるアクセス制御、ペアリング、チャンネルごとのキー'
title: 設定 — チャンネル
x-i18n:
    generated_at: "2026-05-02T04:54:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc790f19aed583b4c52988c170c8883bf56282cfbf3eae26f655f7a4660bd4ed
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` 配下のチャンネル別設定キー。DM とグループアクセス、
複数アカウント構成、メンションゲート、Slack、Discord、
Telegram、WhatsApp、Matrix、iMessage、その他の同梱チャンネル Plugin 向けのチャンネル別キーを扱います。

エージェント、ツール、Gateway ランタイム、その他のトップレベルキーについては、
[設定リファレンス](/ja-JP/gateway/configuration-reference) を参照してください。

## チャンネル

各チャンネルは、その設定セクションが存在すると自動的に開始されます（`enabled: false` の場合を除く）。

### DM とグループアクセス

すべてのチャンネルは DM ポリシーとグループポリシーをサポートします。

| DM ポリシー        | 動作                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (default) | 不明な送信者には 1 回限りのペアリングコードが送られ、所有者の承認が必要 |
| `allowlist`         | `allowFrom` 内（またはペアリング済み許可ストア内）の送信者のみ |
| `open`              | すべての受信 DM を許可（`allowFrom: ["*"]` が必要）             |
| `disabled`          | すべての受信 DM を無視                                          |

| グループポリシー    | 動作                                                   |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (default) | 設定された許可リストに一致するグループのみ             |
| `open`                | グループ許可リストをバイパス（メンションゲートは引き続き適用） |
| `disabled`            | すべてのグループ/ルームメッセージをブロック            |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が未設定の場合のデフォルトを設定します。
ペアリングコードは 1 時間後に期限切れになります。保留中の DM ペアリングリクエストは **チャンネルごとに 3 件** に制限されます。
プロバイダーブロック全体が存在しない場合（`channels.<provider>` がない場合）、ランタイムのグループポリシーは起動時警告付きで `allowlist`（フェイルクローズ）にフォールバックします。
</Note>

### チャンネルモデルのオーバーライド

`channels.modelByChannel` を使用して、特定のチャンネル ID をモデルに固定します。値には `provider/model` または設定済みのモデルエイリアスを指定できます。このチャンネルマッピングは、セッションにモデルオーバーライドがまだない場合（たとえば `/model` で設定された場合など）に適用されます。

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

### チャンネルのデフォルトと Heartbeat

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
- `channels.defaults.contextVisibility`: すべてのチャンネルのデフォルト補足コンテキスト表示モード。値: `all`（デフォルト、すべての引用/スレッド/履歴コンテキストを含める）、`allowlist`（許可リスト内の送信者からのコンテキストのみ含める）、`allowlist_quote`（allowlist と同じだが、明示的な引用/返信コンテキストを保持）。チャンネル別オーバーライド: `channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`: 正常なチャンネルステータスを Heartbeat 出力に含めます。
- `channels.defaults.heartbeat.showAlerts`: 劣化/エラーステータスを Heartbeat 出力に含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケーター形式の Heartbeat 出力を表示します。

### WhatsApp

WhatsApp は Gateway の Web チャンネル（Baileys Web）経由で動作します。リンク済みセッションが存在すると自動的に開始されます。

```json5
{
  web: {
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
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

- 送信コマンドは、存在する場合はアカウント `default` をデフォルトにします。それ以外の場合は、最初に設定されたアカウント ID（ソート済み）を使用します。
- 任意の `channels.whatsapp.defaultAccount` は、設定済みアカウント ID と一致する場合、そのフォールバックのデフォルトアカウント選択をオーバーライドします。
- 従来の単一アカウント Baileys 認証ディレクトリは、`openclaw doctor` により `whatsapp/default` に移行されます。
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

- Bot トークン: `channels.telegram.botToken` または `channels.telegram.tokenFile`（通常ファイルのみ。シンボリックリンクは拒否）、デフォルトアカウントのフォールバックとして `TELEGRAM_BOT_TOKEN`。
- `apiRoot` は Telegram Bot API のルートのみです。`https://api.telegram.org/bot<TOKEN>` ではなく、`https://api.telegram.org` またはセルフホスト/プロキシのルートを使用してください。`openclaw doctor --fix` は、誤って付いた末尾の `/bot<TOKEN>` サフィックスを削除します。
- 任意の `channels.telegram.defaultAccount` は、設定済みアカウント ID と一致する場合、デフォルトアカウント選択をオーバーライドします。
- 複数アカウント構成（2 個以上のアカウント ID）では、フォールバックルーティングを避けるために明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定してください。これがない場合や無効な場合、`openclaw doctor` が警告します。
- `configWrites: false` は、Telegram 起点の設定書き込み（スーパーグループ ID 移行、`/config set|unset`）をブロックします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、フォーラムトピック向けの永続 ACP バインディングを設定します（`match.peer.id` では正規形式の `chatId:topic:topicId` を使用）。フィールドの意味は [ACP エージェント](/ja-JP/tools/acp-agents#channel-specific-settings) で共有されています。
- Telegram ストリームプレビューは `sendMessage` + `editMessageText` を使用します（ダイレクトチャットとグループチャットで動作します）。
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
- 明示的な Discord `token` を指定する直接のアウトバウンド呼び出しでは、その呼び出しにそのトークンを使用します。アカウントのリトライ/ポリシー設定は、アクティブなランタイムスナップショットで選択されているアカウントから引き続き取得されます。
- 任意の `channels.discord.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` (ギルドチャンネル) を使用します。数字だけの ID は拒否されます。
- ギルドのスラッグは小文字で、スペースは `-` に置き換えられます。チャンネルキーにはスラッグ化された名前 (`#` なし) を使用します。ギルド ID を優先してください。
- ボット作成のメッセージはデフォルトで無視されます。`allowBots: true` で有効化します。ボットにメンションしているボットメッセージだけを受け入れるには `allowBots: "mentions"` を使用します (自身のメッセージは引き続きフィルターされます)。
- `channels.discord.guilds.<id>.ignoreOtherMentions` (およびチャンネル上書き) は、別のユーザーまたはロールにメンションしているがボットにはメンションしていないメッセージを破棄します (@everyone/@here は除外)。
- `channels.discord.mentionAliases` は、送信前に安定したアウトバウンド `@handle` テキストを Discord ユーザー ID にマッピングします。これにより、一時的なディレクトリキャッシュが空でも、既知のチームメイトを決定的にメンションできます。アカウントごとの上書きは `channels.discord.accounts.<accountId>.mentionAliases` の下に置きます。
- `maxLinesPerMessage` (デフォルト 17) は、2000 文字未満であっても縦に長いメッセージを分割します。
- `channels.discord.threadBindings` は Discord スレッドバインドのルーティングを制御します:
  - `enabled`: スレッドバインドのセッション機能 (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`、およびバインドされた配信/ルーティング) に対する Discord 上書き
  - `idleHours`: 非アクティブ時の自動フォーカス解除の Discord 上書き。単位は時間 (`0` で無効)
  - `maxAgeHours`: 強制最大経過時間の Discord 上書き。単位は時間 (`0` で無効)
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` の自動スレッド作成/バインド用オプトインスイッチ
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、チャンネルとスレッド向けの永続 ACP バインドを設定します (`match.peer.id` にはチャンネル/スレッド ID を使用)。フィールドの意味は [ACP エージェント](/ja-JP/tools/acp-agents#channel-specific-settings) で共有されています。
- `channels.discord.ui.components.accentColor` は、Discord コンポーネント v2 コンテナのアクセントカラーを設定します。
- `channels.discord.voice` は、Discord ボイスチャンネル会話と任意の自動参加 + LLM + TTS 上書きを有効にします。テキストのみの Discord 設定では、デフォルトで音声はオフのままです。オプトインするには `channels.discord.voice.enabled=true` を設定します。
- `channels.discord.voice.model` は、Discord ボイスチャンネル応答に使用する LLM モデルを任意で上書きします。
- `channels.discord.voice.daveEncryption` と `channels.discord.voice.decryptionFailureTolerance` は、`@discordjs/voice` の DAVE オプションにそのまま渡されます (デフォルトは `true` と `24`)。
- `channels.discord.voice.connectTimeoutMs` は、`/vc join` と自動参加試行に対する初期の `@discordjs/voice` Ready 待機を制御します (デフォルトは `30000`)。
- `channels.discord.voice.reconnectGraceMs` は、切断された音声セッションが再接続シグナリングに入るまで OpenClaw が待つ時間を制御します (デフォルトは `15000`)。
- OpenClaw はさらに、復号失敗が繰り返された後に音声セッションから退出/再参加することで、音声受信の復旧を試みます。
- `channels.discord.streaming` は正規のストリームモードキーです。従来の `streamMode` と真偽値の `streaming` 値は自動移行されます。
- `channels.discord.autoPresence` はランタイム可用性をボットのプレゼンスにマッピングし (healthy => online, degraded => idle, exhausted => dnd)、任意のステータステキスト上書きを許可します。
- `channels.discord.dangerouslyAllowNameMatching` は、可変の名前/タグ照合を再度有効にします (緊急互換モード)。
- `channels.discord.execApprovals`: Discord ネイティブの exec 承認配信と承認者の認可。
  - `enabled`: `true`, `false`, または `"auto"` (デフォルト)。自動モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効になります。
  - `approvers`: exec リクエストを承認できる Discord ユーザー ID。省略時は `commands.ownerAllowFrom` にフォールバックします。
  - `agentFilter`: 任意のエージェント ID 許可リスト。省略すると、すべてのエージェントの承認を転送します。
  - `sessionFilter`: 任意のセッションキーパターン (部分文字列または正規表現)。
  - `target`: 承認プロンプトの送信先。`"dm"` (デフォルト) は承認者 DM に送信し、`"channel"` は発信元チャンネルに送信し、`"both"` は両方に送信します。target に `"channel"` が含まれる場合、ボタンは解決済み承認者だけが使用できます。
  - `cleanupAfterResolve`: `true` の場合、承認、拒否、またはタイムアウト後に承認 DM を削除します。

**リアクション通知モード:** `off` (なし)、`own` (ボットのメッセージ、デフォルト)、`all` (すべてのメッセージ)、`allowlist` (すべてのメッセージに対する `guilds.<id>.users` から)。

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
- 配信ターゲットには `spaces/<spaceId>` または `users/<userId>` を使用します。
- `channels.googlechat.dangerouslyAllowNameMatching` は、可変のメールプリンシパル照合を再度有効にします (緊急互換モード)。

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

- **Socket mode** には `botToken` と `appToken` の両方が必要です (デフォルトアカウントの環境変数フォールバックには `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`)。
- **HTTP mode** には `botToken` と `signingSecret` (ルートまたはアカウントごと) が必要です。
- `socketMode` は、Slack SDK Socket Mode のトランスポート調整を公開 Bolt receiver API にそのまま渡します。ping/pong タイムアウトや古い websocket 動作を調査する場合にのみ使用してください。
- `botToken`, `appToken`, `signingSecret`, `userToken` は、プレーンテキスト文字列または SecretRef オブジェクトを受け付けます。
- Slack アカウントスナップショットは、`botTokenSource`, `botTokenStatus`, `appTokenStatus`、および HTTP モードでは `signingSecretStatus` など、資格情報ごとのソース/ステータスフィールドを公開します。`configured_unavailable` は、そのアカウントが SecretRef 経由で設定されているものの、現在のコマンド/ランタイムパスではシークレット値を解決できなかったことを意味します。
- `configWrites: false` は Slack 起点の設定書き込みをブロックします。
- 任意の `channels.slack.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- `channels.slack.streaming.mode` は正規の Slack ストリームモードキーです。`channels.slack.streaming.nativeTransport` は Slack のネイティブストリーミングトランスポートを制御します。従来の `streamMode`、真偽値の `streaming`、および `nativeStreaming` 値は自動移行されます。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` を使用します。

**リアクション通知モード:** `off`, `own` (デフォルト), `all`, `allowlist` (`reactionAllowlist` から)。

**スレッドセッション分離:** `thread.historyScope` はスレッドごと (デフォルト)、またはチャンネル全体で共有です。`thread.inheritParent` は親チャンネルのトランスクリプトを新しいスレッドにコピーします。

- Slack ネイティブストリーミングと、Slack アシスタント風の「is typing...」スレッドステータスには、返信スレッドターゲットが必要です。トップレベルの DM はデフォルトでスレッド外のままなので、スレッド風プレビューの代わりに `typingReaction` または通常の配信を使用します。
- `typingReaction` は、返信の実行中に受信 Slack メッセージへ一時的なリアクションを追加し、完了時に削除します。`"hourglass_flowing_sand"` のような Slack 絵文字ショートコードを使用します。
- `channels.slack.execApprovals`: Slack ネイティブの exec 承認配信と承認者の認可。Discord と同じスキーマです: `enabled` (`true`/`false`/`"auto"`)、`approvers` (Slack ユーザー ID)、`agentFilter`、`sessionFilter`、および `target` (`"dm"`, `"channel"`, または `"both"`)。

| アクショングループ | デフォルト | 注記                   |
| ------------ | ------- | ---------------------- |
| reactions    | enabled | リアクション + リアクション一覧 |
| messages     | enabled | 読み取り/送信/編集/削除 |
| pins         | enabled | ピン留め/ピン留め解除/一覧 |
| memberInfo   | enabled | メンバー情報           |
| emojiList    | enabled | カスタム絵文字一覧     |

### Mattermost

Mattermost は現在の OpenClaw リリースではバンドル済み Plugin として提供されます。古いビルドまたはカスタムビルドでは、現在の npm パッケージを `openclaw plugins install @openclaw/mattermost` でインストールできます。npm が OpenClaw 所有のパッケージを非推奨として報告する場合は、新しい npm パッケージが公開されるまで、バンドル済み Plugin またはローカルチェックアウトを使用してください。

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

- `commands.callbackPath` は完全な URL ではなく、パス (例: `/api/channels/mattermost/command`) である必要があります。
- `commands.callbackUrl` は OpenClaw Gateway エンドポイントに解決され、Mattermost サーバーから到達可能である必要があります。
- ネイティブのスラッシュコールバックは、スラッシュコマンド登録時に Mattermost から返されるコマンドごとのトークンで認証されます。登録に失敗した場合、または有効化されたコマンドがない場合、OpenClaw は `Unauthorized: invalid command token.` でコールバックを拒否します。
- private/tailnet/internal コールバックホストでは、Mattermost が `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックホスト/ドメインを含めることを要求する場合があります。完全な URL ではなく、ホスト/ドメイン値を使用してください。
- `channels.mattermost.configWrites`: Mattermost から開始される config 書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャネルで返信する前に `@mention` を要求します。
- `channels.mattermost.groups.<channelId>.requireMention`: チャネルごとのメンションゲート上書き (`"*"` はデフォルト)。
- 任意の `channels.mattermost.defaultAccount` は、構成済みアカウント id と一致する場合にデフォルトアカウント選択を上書きします。

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

**リアクション通知モード:** `off`、`own` (デフォルト)、`all`、`allowlist` (`reactionAllowlist` から)。

- `channels.signal.account`: チャネル起動を特定の Signal アカウント ID に固定します。
- `channels.signal.configWrites`: Signal から開始される config 書き込みを許可または拒否します。
- 任意の `channels.signal.defaultAccount` は、構成済みアカウント id と一致する場合にデフォルトアカウント選択を上書きします。

### BlueBubbles

BlueBubbles は推奨される iMessage 経路です (Plugin を基盤とし、`channels.bluebubbles` で構成されます)。

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
- 任意の `channels.bluebubbles.defaultAccount` は、構成済みアカウント id と一致する場合にデフォルトアカウント選択を上書きします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、BlueBubbles の会話を永続 ACP セッションにバインドできます。`match.peer.id` で BlueBubbles ハンドルまたはターゲット文字列 (`chat_id:*`、`chat_guid:*`、`chat_identifier:*`) を使用してください。共有フィールドの意味: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。
- BlueBubbles チャネル構成全体は [BlueBubbles](/ja-JP/channels/bluebubbles) に記載されています。

### iMessage

OpenClaw は `imsg rpc` (stdio 上の JSON-RPC) を起動します。デーモンやポートは不要です。

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

- 任意の `channels.imessage.defaultAccount` は、構成済みアカウント id と一致する場合にデフォルトアカウント選択を上書きします。

- Messages DB への Full Disk Access が必要です。
- `chat_id:<id>` ターゲットを推奨します。チャットを一覧表示するには `imsg chats --limit 20` を使用してください。
- `cliPath` は SSH ラッパーを指すことができます。SCP で添付ファイルを取得するには `remoteHost` (`host` または `user@host`) を設定してください。
- `attachmentRoots` と `remoteAttachmentRoots` は受信添付ファイルのパスを制限します (デフォルト: `/Users/*/Library/Messages/Attachments`)。
- SCP は厳密なホストキー確認を使用するため、リレーホストキーが `~/.ssh/known_hosts` にすでに存在することを確認してください。
- `channels.imessage.configWrites`: iMessage から開始される config 書き込みを許可または拒否します。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、iMessage の会話を永続 ACP セッションにバインドできます。`match.peer.id` で正規化済みハンドルまたは明示的なチャットターゲット (`chat_id:*`、`chat_guid:*`、`chat_identifier:*`) を使用してください。共有フィールドの意味: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。

<Accordion title="iMessage SSH ラッパーの例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix は Plugin を基盤とし、`channels.matrix` で構成されます。

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
- `channels.matrix.proxy` は、Matrix HTTP トラフィックを明示的な HTTP(S) プロキシ経由でルーティングします。名前付きアカウントは `channels.matrix.accounts.<id>.proxy` で上書きできます。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` は private/internal ホームサーバーを許可します。`proxy` とこのネットワーク opt-in は独立した制御です。
- `channels.matrix.defaultAccount` は、マルチアカウント構成で優先アカウントを選択します。
- `channels.matrix.autoJoin` のデフォルトは `off` であるため、招待された部屋と新しい DM 形式の招待は、`autoJoin: "allowlist"` と `autoJoinAllowlist`、または `autoJoin: "always"` を設定するまで無視されます。
- `channels.matrix.execApprovals`: Matrix ネイティブの exec 承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"` (デフォルト)。auto モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効になります。
  - `approvers`: exec リクエストの承認を許可された Matrix ユーザー ID (例: `@owner:example.org`)。
  - `agentFilter`: 任意のエージェント ID allowlist。省略すると、すべてのエージェントの承認を転送します。
  - `sessionFilter`: 任意のセッションキー pattern (substring または regex)。
  - `target`: 承認プロンプトの送信先。`"dm"` (デフォルト)、`"channel"` (発信元の部屋)、または `"both"`。
  - アカウントごとの上書き: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` は、Matrix DM をセッションにグループ化する方法を制御します。`per-user` (デフォルト) はルーティングされた peer ごとに共有し、`per-room` は各 DM 部屋を分離します。
- Matrix ステータスプローブとライブディレクトリ検索は、ランタイムトラフィックと同じプロキシポリシーを使用します。
- Matrix の完全な構成、ターゲット指定ルール、セットアップ例は [Matrix](/ja-JP/channels/matrix) に記載されています。

### Microsoft Teams

Microsoft Teams は Plugin を基盤とし、`channels.msteams` で構成されます。

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
- Teams の完全な config (credentials、Webhook、DM/group policy、team ごと/channel ごとの上書き) は [Microsoft Teams](/ja-JP/channels/msteams) に記載されています。

### IRC

IRC は Plugin を基盤とし、`channels.irc` で構成されます。

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
- 任意の `channels.irc.defaultAccount` は、構成済みアカウント id と一致する場合にデフォルトアカウント選択を上書きします。
- IRC チャネルの完全な構成 (host/port/TLS/channels/allowlists/mention gating) は [IRC](/ja-JP/channels/irc) に記載されています。

### マルチアカウント (すべてのチャネル)

チャネルごとに複数のアカウントを実行します (それぞれに独自の `accountId` があります):

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

- `accountId` が省略された場合、`default` が使用されます (CLI + ルーティング)。
- env トークンは **default** アカウントにのみ適用されます。
- ベースチャネル設定は、アカウントごとに上書きされない限りすべてのアカウントに適用されます。
- 各アカウントを別のエージェントにルーティングするには `bindings[].match.accountId` を使用してください。
- 単一アカウントのトップレベルチャネル config のまま、`openclaw channels add` (またはチャネルのオンボーディング) で default 以外のアカウントを追加すると、OpenClaw はまずアカウントスコープのトップレベル単一アカウント値をチャネルのアカウントマップに昇格させ、元のアカウントが動作し続けるようにします。ほとんどのチャネルではそれらを `channels.<channel>.accounts.default` に移動します。Matrix では、既存の一致する named/default ターゲットを代わりに保持できます。
- 既存のチャネル専用バインディング (`accountId` なし) は default アカウントに引き続き一致します。アカウントスコープのバインディングは任意のままです。
- `openclaw doctor --fix` も、アカウントスコープのトップレベル単一アカウント値をそのチャネル用に選択された昇格先アカウントに移動することで、混在した形状を修復します。ほとんどのチャネルでは `accounts.default` を使用します。Matrix では、既存の一致する named/default ターゲットを代わりに保持できます。

### その他の Plugin チャネル

多くの Plugin チャネルは `channels.<id>` として構成され、専用のチャネルページに記載されています (例: Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch)。
完全なチャネル索引を参照してください: [Channels](/ja-JP/channels)。

### グループチャットのメンションゲート

グループメッセージはデフォルトで **メンションを要求** します (metadata mention または安全な regex patterns)。WhatsApp、Telegram、Discord、Google Chat、iMessage のグループチャットに適用されます。

表示される返信は別途制御されます。グループ/チャネルルームのデフォルトは `messages.groupChat.visibleReplies: "message_tool"` です。OpenClaw はターンを引き続き処理しますが、通常の最終返信は非公開のままで、表示されるルーム出力には `message(action=send)` が必要です。通常の返信をルームへ投稿する従来の動作が必要な場合にのみ `"automatic"` を設定してください。同じ tool-only の表示返信動作をダイレクトチャットにも適用するには、`messages.visibleReplies: "message_tool"` を設定してください。Codex harness も、未設定のダイレクトチャットのデフォルトとしてその tool-only 動作を使用します。

アクティブなツールポリシーで message tool が利用できない場合、OpenClaw はレスポンスを黙って抑制するのではなく、自動の表示返信にフォールバックします。`openclaw doctor` はこの不一致を警告します。

Gateway は、ファイルが保存された後に `messages` config をホットリロードします。デプロイでファイル監視または config reload が無効になっている場合にのみ再起動してください。

**メンションの種類:**

- **Metadata mentions**: ネイティブプラットフォームの @-mentions。WhatsApp self-chat mode では無視されます。
- **Text patterns**: `agents.list[].groupChat.mentionPatterns` の安全な regex patterns。無効な pattern と安全でない nested repetition は無視されます。
- メンションゲートは、検出が可能な場合 (native mentions または少なくとも 1 つの pattern) にのみ強制されます。

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

`messages.groupChat.historyLimit` はグローバル既定値を設定します。チャネルは `channels.<channel>.historyLimit`（またはアカウント単位）で上書きできます。無効にするには `0` を設定します。

`messages.visibleReplies` はグローバルなソースターンの既定値です。`messages.groupChat.visibleReplies` はグループ/チャネルのソースターンでそれを上書きします。`messages.visibleReplies` が未設定の場合、ハーネスは独自のダイレクト/ソース既定値を提供できます。Codex ハーネスの既定値は `message_tool` です。チャネルの許可リストとメンションゲートは、ターンを処理するかどうかを引き続き決定します。

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

解決順序: DM 単位の上書き → プロバイダー既定値 → 制限なし（すべて保持）。

対応: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### セルフチャットモード

セルフチャットモードを有効にするには、自分の番号を `allowFrom` に含めます（ネイティブの @-メンションを無視し、テキストパターンにのみ応答します）。

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

### コマンド（チャットコマンドの処理）

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
- このページは**設定キーのリファレンス**であり、完全なコマンドカタログではありません。QQ Bot `/bot-ping` `/bot-help` `/bot-logs`、LINE `/card`、デバイスペアリング `/pair`、メモリ `/dreaming`、電話操作 `/phone`、Talk `/voice` など、チャネル/Plugin 所有のコマンドは、それぞれのチャネル/Plugin ページと[スラッシュコマンド](/ja-JP/tools/slash-commands)で説明されています。
- テキストコマンドは、先頭に `/` が付いた**単独の**メッセージである必要があります。
- `native: "auto"` は Discord/Telegram のネイティブコマンドを有効にし、Slack は無効のままにします。
- `nativeSkills: "auto"` は Discord/Telegram のネイティブ Skills コマンドを有効にし、Slack は無効のままにします。
- チャネル単位で上書きできます: `channels.discord.commands.native`（bool または `"auto"`）。`false` は以前に登録されたコマンドを消去します。
- チャネル単位のネイティブ Skills 登録は `channels.<provider>.commands.nativeSkills` で上書きします。
- `channels.telegram.customCommands` は追加の Telegram bot メニュー項目を追加します。
- `bash: true` はホストシェル向けに `! <cmd>` を有効にします。`tools.elevated.enabled` と、送信者が `tools.elevated.allowFrom.<channel>` に含まれていることが必要です。
- `config: true` は `/config`（`openclaw.json` の読み書き）を有効にします。Gateway `chat.send` クライアントでは、永続的な `/config set|unset` の書き込みにも `operator.admin` が必要です。読み取り専用の `/config show` は、通常の書き込みスコープを持つオペレータークライアントでも引き続き利用できます。
- `mcp: true` は、`mcp.servers` 配下の OpenClaw 管理 MCP サーバー設定向けに `/mcp` を有効にします。
- `plugins: true` は、Plugin の検出、インストール、有効化/無効化の制御向けに `/plugins` を有効にします。
- `channels.<provider>.configWrites` は、チャネル単位で設定変更を制御します（既定値: true）。
- 複数アカウントのチャネルでは、`channels.<provider>.accounts.<id>.configWrites` も、そのアカウントを対象にした書き込み（例: `/allowlist --config --account <id>` または `/config set channels.<provider>.accounts.<id>...`）を制御します。
- `restart: false` は `/restart` と Gateway 再起動ツールのアクションを無効にします。既定値: `true`。
- `ownerAllowFrom` は、所有者専用コマンド/ツール向けの明示的な所有者許可リストです。`allowFrom` とは別です。
- `ownerDisplay: "hash"` は、システムプロンプト内の所有者 ID をハッシュ化します。ハッシュ化を制御するには `ownerDisplaySecret` を設定します。
- `allowFrom` はプロバイダー単位です。設定されている場合、それが**唯一の**認可ソースになります（チャネル許可リスト/ペアリングと `useAccessGroups` は無視されます）。
- `useAccessGroups: false` は、`allowFrom` が未設定の場合に、コマンドがアクセスグループポリシーをバイパスすることを許可します。
- コマンドドキュメントマップ:
  - 組み込み + バンドル済みカタログ: [スラッシュコマンド](/ja-JP/tools/slash-commands)
  - チャネル固有のコマンドサーフェス: [チャネル](/ja-JP/channels)
  - QQ Bot コマンド: [QQ Bot](/ja-JP/channels/qqbot)
  - ペアリングコマンド: [ペアリング](/ja-JP/channels/pairing)
  - LINE カードコマンド: [LINE](/ja-JP/channels/line)
  - メモリ Dreaming: [Dreaming](/ja-JP/concepts/dreaming)

</Accordion>

---

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference) — トップレベルキー
- [設定 — エージェント](/ja-JP/gateway/config-agents)
- [チャネル概要](/ja-JP/channels)
