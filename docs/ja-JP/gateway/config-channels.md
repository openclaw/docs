---
read_when:
    - チャンネルPluginの設定（認証、アクセス制御、複数アカウント）
    - チャネルごとの設定キーのトラブルシューティング
    - DMポリシー、グループポリシー、またはメンションゲーティングの監査
summary: 'チャネル設定: Slack、Discord、Telegram、WhatsApp、Matrix、iMessage などにわたるアクセス制御、ペアリング、チャネルごとのキー'
title: 設定 — チャンネル
x-i18n:
    generated_at: "2026-04-30T16:28:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: aba14cb43e1fe914cc7c03f41bed1b5915cc6b2ad8e0f1d47f58b7e98c1b3915
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` 配下のチャンネル別設定キー。DM とグループアクセス、
マルチアカウント構成、メンション制御、Slack、Discord、
Telegram、WhatsApp、Matrix、iMessage、およびその他の同梱チャンネル Plugin のチャンネル別キーを扱います。

エージェント、ツール、Gateway ランタイム、およびその他のトップレベルキーについては、
[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## チャンネル

各チャンネルは、その設定セクションが存在すると自動的に起動します（`enabled: false` の場合を除く）。

### DM とグループアクセス

すべてのチャンネルは DM ポリシーとグループポリシーに対応しています。

| DM ポリシー           | 挙動                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (デフォルト) | 未知の送信者は一度限りのペアリングコードを受け取り、所有者の承認が必要 |
| `allowlist`         | `allowFrom` 内（またはペアリング済みの許可ストア内）の送信者のみ             |
| `open`              | すべての受信 DM を許可（`allowFrom: ["*"]` が必要）             |
| `disabled`          | すべての受信 DM を無視                                          |

| グループポリシー          | 挙動                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (デフォルト) | 設定済みの許可リストに一致するグループのみ          |
| `open`                | グループ許可リストをバイパス（メンション制御は引き続き適用） |
| `disabled`            | すべてのグループ/ルームメッセージをブロック                          |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が未設定の場合のデフォルトを設定します。
ペアリングコードは 1 時間後に期限切れになります。保留中の DM ペアリングリクエストは **チャンネルごとに 3 件**に制限されます。
プロバイダーブロックが完全に存在しない場合（`channels.<provider>` がない場合）、ランタイムのグループポリシーは起動時の警告付きで `allowlist`（フェイルクローズ）にフォールバックします。
</Note>

### チャンネルモデルの上書き

`channels.modelByChannel` を使用して、特定のチャンネル ID をモデルに固定します。値には `provider/model` または設定済みのモデルエイリアスを指定できます。チャンネルマッピングは、セッションにモデルの上書きがまだない場合（たとえば `/model` で設定された場合）に適用されます。

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

プロバイダー間で共有するグループポリシーと Heartbeat の挙動には `channels.defaults` を使用します。

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
- `channels.defaults.contextVisibility`: すべてのチャンネルに対する補足コンテキスト表示モードのデフォルト。値: `all`（デフォルト、引用/スレッド/履歴コンテキストをすべて含める）、`allowlist`（許可リストに含まれる送信者からのコンテキストのみ含める）、`allowlist_quote`（allowlist と同じだが、明示的な引用/返信コンテキストは保持する）。チャンネル別の上書き: `channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`: Heartbeat 出力に正常なチャンネルステータスを含める。
- `channels.defaults.heartbeat.showAlerts`: Heartbeat 出力に劣化/エラーステータスを含める。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケータースタイルの Heartbeat 出力を描画する。

### WhatsApp

WhatsApp は Gateway の Web チャンネル（Baileys Web）経由で動作します。リンク済みセッションが存在すると自動的に起動します。

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

- 送信コマンドは、存在する場合はアカウント `default` にデフォルトで送られます。存在しない場合は、設定済みアカウント ID の先頭（ソート済み）が使われます。
- 任意の `channels.whatsapp.defaultAccount` は、設定済みアカウント ID と一致する場合に、そのフォールバックのデフォルトアカウント選択を上書きします。
- 従来の単一アカウント Baileys 認証ディレクトリは、`openclaw doctor` によって `whatsapp/default` へ移行されます。
- アカウント別の上書き: `channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

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

- Bot トークン: `channels.telegram.botToken` または `channels.telegram.tokenFile`（通常ファイルのみ。シンボリックリンクは拒否）、デフォルトアカウントのフォールバックとして `TELEGRAM_BOT_TOKEN` を使用します。
- `apiRoot` は Telegram Bot API のルートのみです。`https://api.telegram.org/bot<TOKEN>` ではなく、`https://api.telegram.org` または自己ホスト/プロキシのルートを使用してください。`openclaw doctor --fix` は、誤って末尾に付いた `/bot<TOKEN>` サフィックスを削除します。
- 任意の `channels.telegram.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- マルチアカウント構成（2 つ以上のアカウント ID）では、フォールバックルーティングを避けるために明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定してください。これがない、または無効な場合、`openclaw doctor` が警告します。
- `configWrites: false` は、Telegram 起点の設定書き込み（スーパーグループ ID 移行、`/config set|unset`）をブロックします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、フォーラムトピック用の永続的な ACP バインディングを設定します（`match.peer.id` では正規形式の `chatId:topic:topicId` を使用）。フィールドの意味は [ACP エージェント](/ja-JP/tools/acp-agents#channel-specific-settings)で共有されています。
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

- トークン: `channels.discord.token`。デフォルトアカウントのフォールバックとして `DISCORD_BOT_TOKEN` を使用します。
- 明示的な Discord `token` を提供する直接の送信呼び出しは、その呼び出しにそのトークンを使用します。アカウントの再試行/ポリシー設定は、引き続きアクティブなランタイムスナップショット内で選択されたアカウントから取得されます。
- 任意の `channels.discord.defaultAccount` は、構成済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` (ギルドチャンネル) を使用します。裸の数値 ID は拒否されます。
- ギルドスラッグは小文字で、空白は `-` に置換されます。チャンネルキーにはスラッグ化された名前を使用します (`#` なし)。ギルド ID を推奨します。
- ボットが作成したメッセージはデフォルトで無視されます。`allowBots: true` で有効化します。ボットにメンションしているボットメッセージのみを受け付けるには `allowBots: "mentions"` を使用します (自身のメッセージは引き続きフィルターされます)。
- `channels.discord.guilds.<id>.ignoreOtherMentions` (およびチャンネル上書き) は、ボットではなく別のユーザーまたはロールにメンションしているメッセージを破棄します (@everyone/@here を除く)。
- `maxLinesPerMessage` (デフォルト 17) は、2000 文字未満でも縦に長いメッセージを分割します。
- `channels.discord.threadBindings` は Discord のスレッドバインド型ルーティングを制御します。
  - `enabled`: スレッドバインド型セッション機能 (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびバインドされた配信/ルーティング) に対する Discord 上書き
  - `idleHours`: 非アクティブ時の自動アンフォーカスまでの時間 (時間単位) に対する Discord 上書き (`0` で無効)
  - `maxAgeHours`: ハード最大有効期間 (時間単位) に対する Discord 上書き (`0` で無効)
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` の自動スレッド作成/バインド用のオプトインスイッチ
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、チャンネルとスレッド用の永続 ACP バインディングを構成します (`match.peer.id` にはチャンネル/スレッド ID を使用)。フィールドの意味は [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) で共有されています。
- `channels.discord.ui.components.accentColor` は、Discord components v2 コンテナのアクセントカラーを設定します。
- `channels.discord.voice` は、Discord ボイスチャンネル会話と、任意の自動参加 + LLM + TTS 上書きを有効化します。
- `channels.discord.voice.model` は、Discord ボイスチャンネル応答に使用する LLM モデルを任意で上書きします。
- `channels.discord.voice.daveEncryption` と `channels.discord.voice.decryptionFailureTolerance` は、`@discordjs/voice` の DAVE オプションにそのまま渡されます (デフォルトは `true` と `24`)。
- OpenClaw はさらに、復号失敗が繰り返された後にボイスセッションを退出/再参加することで、ボイス受信の回復を試みます。
- `channels.discord.streaming` は正規のストリームモードキーです。レガシーの `streamMode` と真偽値の `streaming` 値は自動移行されます。
- `channels.discord.autoPresence` はランタイム可用性をボットプレゼンスにマップし (healthy => online, degraded => idle, exhausted => dnd)、任意のステータステキスト上書きを許可します。
- `channels.discord.dangerouslyAllowNameMatching` は、可変の名前/タグ照合を再有効化します (緊急互換モード)。
- `channels.discord.execApprovals`: Discord ネイティブの exec 承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"` (デフォルト)。自動モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効化されます。
  - `approvers`: exec リクエストの承認を許可された Discord ユーザー ID。省略時は `commands.ownerAllowFrom` にフォールバックします。
  - `agentFilter`: 任意のエージェント ID 許可リスト。すべてのエージェントの承認を転送するには省略します。
  - `sessionFilter`: 任意のセッションキーパターン (部分文字列または正規表現)。
  - `target`: 承認プロンプトの送信先。`"dm"` (デフォルト) は承認者 DM に送信し、`"channel"` は発信元チャンネルに送信し、`"both"` は両方に送信します。ターゲットに `"channel"` が含まれる場合、ボタンは解決済みの承認者のみが使用できます。
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
- 配信ターゲットには `spaces/<spaceId>` または `users/<userId>` を使用します。
- `channels.googlechat.dangerouslyAllowNameMatching` は、可変のメールプリンシパル照合を再有効化します (緊急互換モード)。

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
- `socketMode` は、Slack SDK Socket Mode トランスポート調整を公開 Bolt receiver API にそのまま渡します。ping/pong タイムアウトまたは古い websocket 動作を調査する場合にのみ使用してください。
- `botToken`、`appToken`、`signingSecret`、`userToken` はプレーンテキスト文字列または SecretRef オブジェクトを受け付けます。
- Slack アカウントスナップショットは、`botTokenSource`、`botTokenStatus`、`appTokenStatus`、および HTTP mode の `signingSecretStatus` など、認証情報ごとのソース/ステータスフィールドを公開します。`configured_unavailable` は、アカウントが SecretRef 経由で構成されているものの、現在のコマンド/ランタイムパスでシークレット値を解決できなかったことを意味します。
- `configWrites: false` は、Slack から開始される構成書き込みをブロックします。
- 任意の `channels.slack.defaultAccount` は、構成済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- `channels.slack.streaming.mode` は正規の Slack ストリームモードキーです。`channels.slack.streaming.nativeTransport` は Slack のネイティブストリーミングトランスポートを制御します。レガシーの `streamMode`、真偽値の `streaming`、および `nativeStreaming` 値は自動移行されます。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` を使用します。

**リアクション通知モード:** `off`、`own` (デフォルト)、`all`、`allowlist` (`reactionAllowlist` から)。

**スレッドセッション分離:** `thread.historyScope` はスレッドごと (デフォルト) またはチャンネル全体で共有です。`thread.inheritParent` は親チャンネルのトランスクリプトを新しいスレッドにコピーします。

- Slack ネイティブストリーミングと Slack アシスタント風の「is typing...」スレッドステータスには、返信スレッドターゲットが必要です。トップレベル DM はデフォルトでスレッド外のままなので、スレッド形式のプレビューではなく `typingReaction` または通常配信を使用します。
- `typingReaction` は、返信の実行中に受信 Slack メッセージへ一時的なリアクションを追加し、完了時に削除します。`"hourglass_flowing_sand"` のような Slack 絵文字ショートコードを使用してください。
- `channels.slack.execApprovals`: Slack ネイティブの exec 承認配信と承認者認可。Discord と同じスキーマです: `enabled` (`true`/`false`/`"auto"`)、`approvers` (Slack ユーザー ID)、`agentFilter`、`sessionFilter`、および `target` (`"dm"`、`"channel"`、または `"both"`)。

| アクショングループ | デフォルト | 注記                       |
| ------------ | ------- | ---------------------- |
| reactions    | 有効 | リアクション + リアクション一覧 |
| messages     | 有効 | 読み取り/送信/編集/削除      |
| pins         | 有効 | ピン留め/ピン解除/一覧       |
| memberInfo   | 有効 | メンバー情報               |
| emojiList    | 有効 | カスタム絵文字一覧           |

### Mattermost

Mattermost は現在の OpenClaw リリースではバンドルされた Plugin として提供されています。古いビルドまたはカスタムビルドでは、`openclaw plugins install @openclaw/mattermost` で現在の npm パッケージをインストールできます。npm が OpenClaw 所有のパッケージを非推奨として報告する場合は、新しい npm パッケージが公開されるまで、バンドルされた Plugin またはローカルチェックアウトを使用してください。

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

チャットモード: `oncall` (@メンションで応答、デフォルト)、`onmessage` (すべてのメッセージ)、`onchar` (トリガープレフィックスで始まるメッセージ)。

Mattermost ネイティブコマンドが有効な場合:

- `commands.callbackPath` はフル URL ではなく、パス (例: `/api/channels/mattermost/command`) でなければなりません。
- `commands.callbackUrl` は OpenClaw Gateway エンドポイントに解決され、Mattermost サーバーから到達可能でなければなりません。
- ネイティブスラッシュコールバックは、スラッシュコマンド登録中に Mattermost から返されるコマンドごとのトークンで認証されます。登録に失敗した場合、または有効化されたコマンドがない場合、OpenClaw は `Unauthorized: invalid command token.` でコールバックを拒否します。
- private/tailnet/internal コールバックホストでは、Mattermost が `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックホスト/ドメインを含めることを要求する場合があります。フル URL ではなく、ホスト/ドメイン値を使用してください。
- `channels.mattermost.configWrites`: Mattermost から開始される構成書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャンネルで返信する前に `@mention` を要求します。
- `channels.mattermost.groups.<channelId>.requireMention`: チャンネルごとのメンションゲート上書き (デフォルトには `"*"` )。
- 任意の `channels.mattermost.defaultAccount` は、構成済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。

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

- `channels.signal.account`: チャンネル起動を特定の Signal アカウント ID に固定します。
- `channels.signal.configWrites`: Signal から開始された設定の書き込みを許可または拒否します。
- 任意の `channels.signal.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトのアカウント選択を上書きします。

### BlueBubbles

BlueBubbles は推奨される iMessage 経路です (Plugin ベースで、`channels.bluebubbles` の下で設定します)。

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

- ここで扱うコアキーのパス: `channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- 任意の `channels.bluebubbles.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトのアカウント選択を上書きします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、BlueBubbles の会話を永続的な ACP セッションにバインドできます。`match.peer.id` では BlueBubbles ハンドルまたはターゲット文字列 (`chat_id:*`、`chat_guid:*`、`chat_identifier:*`) を使用します。共有フィールドのセマンティクス: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。
- 完全な BlueBubbles チャンネル設定は [BlueBubbles](/ja-JP/channels/bluebubbles) に記載されています。

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

- 任意の `channels.imessage.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトのアカウント選択を上書きします。

- Messages DB へのフルディスクアクセスが必要です。
- `chat_id:<id>` ターゲットを推奨します。チャットの一覧表示には `imsg chats --limit 20` を使用します。
- `cliPath` は SSH ラッパーを指すことができます。SCP による添付ファイル取得には `remoteHost` (`host` または `user@host`) を設定します。
- `attachmentRoots` と `remoteAttachmentRoots` は受信添付ファイルのパスを制限します (デフォルト: `/Users/*/Library/Messages/Attachments`)。
- SCP は厳格なホストキー確認を使用するため、リレーホストのキーがすでに `~/.ssh/known_hosts` に存在することを確認してください。
- `channels.imessage.configWrites`: iMessage から開始された設定の書き込みを許可または拒否します。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、iMessage の会話を永続的な ACP セッションにバインドできます。`match.peer.id` では正規化済みハンドルまたは明示的なチャットターゲット (`chat_id:*`、`chat_guid:*`、`chat_identifier:*`) を使用します。共有フィールドのセマンティクス: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。

<Accordion title="iMessage SSH ラッパーの例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix は Plugin ベースで、`channels.matrix` の下で設定します。

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
- `channels.matrix.proxy` は Matrix の HTTP トラフィックを明示的な HTTP(S) プロキシ経由でルーティングします。名前付きアカウントでは `channels.matrix.accounts.<id>.proxy` で上書きできます。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` はプライベート/内部 homeserver を許可します。`proxy` とこのネットワークのオプトインは独立した制御です。
- `channels.matrix.defaultAccount` は、マルチアカウント設定で優先アカウントを選択します。
- `channels.matrix.autoJoin` のデフォルトは `off` なので、招待されたルームと新しい DM 形式の招待は、`autoJoinAllowlist` を指定して `autoJoin: "allowlist"` を設定するか、`autoJoin: "always"` を設定するまで無視されます。
- `channels.matrix.execApprovals`: Matrix ネイティブの exec 承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"` (デフォルト)。auto モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効になります。
  - `approvers`: exec リクエストの承認を許可された Matrix ユーザー ID (例: `@owner:example.org`)。
  - `agentFilter`: 任意のエージェント ID 許可リスト。省略すると、すべてのエージェントの承認を転送します。
  - `sessionFilter`: 任意のセッションキーパターン (部分文字列または正規表現)。
  - `target`: 承認プロンプトの送信先。`"dm"` (デフォルト)、`"channel"` (送信元ルーム)、または `"both"`。
  - アカウント単位の上書き: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` は、Matrix DM をセッションにグループ化する方法を制御します。`per-user` (デフォルト) はルーティングされたピアごとに共有し、`per-room` は各 DM ルームを分離します。
- Matrix のステータスプローブとライブディレクトリ検索は、ランタイムトラフィックと同じプロキシポリシーを使用します。
- 完全な Matrix 設定、ターゲット指定ルール、セットアップ例は [Matrix](/ja-JP/channels/matrix) に記載されています。

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

- ここで扱うコアキーのパス: `channels.msteams`、`channels.msteams.configWrites`。
- 完全な Teams 設定 (認証情報、Webhook、DM/グループポリシー、チーム単位/チャンネル単位の上書き) は [Microsoft Teams](/ja-JP/channels/msteams) に記載されています。

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

- ここで扱うコアキーのパス: `channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- 任意の `channels.irc.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトのアカウント選択を上書きします。
- 完全な IRC チャンネル設定 (ホスト/ポート/TLS/チャンネル/許可リスト/メンションゲート) は [IRC](/ja-JP/channels/irc) に記載されています。

### マルチアカウント (すべてのチャンネル)

チャンネルごとに複数のアカウントを実行します (各アカウントは独自の `accountId` を持ちます)。

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

- `accountId` が省略された場合は `default` が使用されます (CLI + ルーティング)。
- 環境変数トークンは **デフォルト** アカウントにのみ適用されます。
- ベースチャンネル設定は、アカウント単位で上書きされない限り、すべてのアカウントに適用されます。
- 各アカウントを別のエージェントにルーティングするには `bindings[].match.accountId` を使用します。
- 単一アカウントのトップレベルチャンネル設定のまま `openclaw channels add` (またはチャンネルのオンボーディング) で非デフォルトアカウントを追加した場合、OpenClaw はまず、アカウントスコープのトップレベル単一アカウント値をそのチャンネルのアカウントマップに昇格させ、元のアカウントが引き続き動作するようにします。ほとんどのチャンネルではそれらを `channels.<channel>.accounts.default` に移動します。Matrix では、代わりに既存の一致する名前付き/デフォルトターゲットを保持できます。
- 既存のチャンネルのみのバインディング (`accountId` なし) はデフォルトアカウントとの照合を継続します。アカウントスコープのバインディングは引き続き任意です。
- `openclaw doctor --fix` も、アカウントスコープのトップレベル単一アカウント値を、そのチャンネルで選択された昇格先アカウントへ移動することで混在形状を修復します。ほとんどのチャンネルでは `accounts.default` を使用します。Matrix では、代わりに既存の一致する名前付き/デフォルトターゲットを保持できます。

### その他の Plugin チャンネル

多くの Plugin チャンネルは `channels.<id>` として設定され、専用のチャンネルページに記載されています (例: Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch)。
完全なチャンネルインデックスを参照してください: [チャンネル](/ja-JP/channels)。

### グループチャットのメンションゲート

グループメッセージのデフォルトは **メンション必須** (メタデータメンションまたは安全な正規表現パターン) です。WhatsApp、Telegram、Discord、Google Chat、iMessage のグループチャットに適用されます。

表示される返信は別に制御されます。グループ/チャンネルルームのデフォルトは `messages.groupChat.visibleReplies: "message_tool"` です。OpenClaw は引き続きターンを処理しますが、通常の最終返信は非公開のままで、ルームに表示される出力には `message(action=send)` が必要です。通常の返信をルームに投稿する従来の挙動が必要な場合にのみ `"automatic"` を設定します。同じツールのみの表示返信の挙動を直接チャットにも適用するには、`messages.visibleReplies: "message_tool"` を設定します。

Gateway は、ファイル保存後に `messages` 設定をホットリロードします。デプロイでファイル監視または設定リロードが無効化されている場合にのみ再起動してください。

**メンションタイプ:**

- **メタデータメンション**: ネイティブプラットフォームの @メンション。WhatsApp のセルフチャットモードでは無視されます。
- **テキストパターン**: `agents.list[].groupChat.mentionPatterns` 内の安全な正規表現パターン。無効なパターンと安全でない入れ子の繰り返しは無視されます。
- メンションゲートは、検出が可能な場合 (ネイティブメンションまたは少なくとも 1 つのパターン) にのみ適用されます。

```json5
{
  messages: {
    visibleReplies: "automatic", // global default for direct/source chats
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

`messages.groupChat.historyLimit` はグローバルデフォルトを設定します。チャンネルは `channels.<channel>.historyLimit` (またはアカウント単位) で上書きできます。無効化するには `0` を設定します。

`messages.visibleReplies` はグローバルなソースターンのデフォルトです。`messages.groupChat.visibleReplies` は、グループ/チャンネルのソースターンでこれを上書きします。チャンネル許可リストとメンションゲートは、ターンを処理するかどうかを引き続き決定します。

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

解決順序: DM 単位の上書き → プロバイダーのデフォルト → 制限なし (すべて保持)。

対応: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### セルフチャットモード

セルフチャットモードを有効にするには、自分の電話番号を `allowFrom` に含めます (ネイティブ @メンションを無視し、テキストパターンにのみ応答します)。

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

- このブロックはコマンドサーフェスを設定します。現在の組み込み + バンドル済みコマンドカタログについては、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。
- このページは**設定キーのリファレンス**であり、完全なコマンドカタログではありません。QQ Bot `/bot-ping` `/bot-help` `/bot-logs`、LINE `/card`、デバイスペアリング `/pair`、メモリ `/dreaming`、電話操作 `/phone`、Talk `/voice` など、チャンネル/Plugin 所有のコマンドは、それぞれのチャンネル/Plugin ページおよび[スラッシュコマンド](/ja-JP/tools/slash-commands)に記載されています。
- テキストコマンドは、先頭に `/` が付いた**単独の**メッセージである必要があります。
- `native: "auto"` は Discord/Telegram のネイティブコマンドを有効にし、Slack は無効のままにします。
- `nativeSkills: "auto"` は Discord/Telegram のネイティブ Skills コマンドを有効にし、Slack は無効のままにします。
- チャンネルごとの上書き: `channels.discord.commands.native`（bool または `"auto"`）。`false` は以前に登録されたコマンドを消去します。
- `channels.<provider>.commands.nativeSkills` でチャンネルごとのネイティブ Skills 登録を上書きします。
- `channels.telegram.customCommands` は追加の Telegram bot メニューエントリを追加します。
- `bash: true` はホストシェル向けの `! <cmd>` を有効にします。`tools.elevated.enabled` と、送信者が `tools.elevated.allowFrom.<channel>` に含まれていることが必要です。
- `config: true` は `/config`（`openclaw.json` の読み書き）を有効にします。Gateway `chat.send` クライアントでは、永続的な `/config set|unset` の書き込みにも `operator.admin` が必要です。読み取り専用の `/config show` は、通常の書き込みスコープを持つ operator クライアントでも引き続き利用できます。
- `mcp: true` は、`mcp.servers` 配下の OpenClaw 管理 MCP サーバー設定向けに `/mcp` を有効にします。
- `plugins: true` は、Plugin の検出、インストール、有効化/無効化の制御向けに `/plugins` を有効にします。
- `channels.<provider>.configWrites` はチャンネルごとの設定変更を制御します（デフォルト: true）。
- 複数アカウントのチャンネルでは、`channels.<provider>.accounts.<id>.configWrites` も、そのアカウントを対象にする書き込みを制御します（例: `/allowlist --config --account <id>` または `/config set channels.<provider>.accounts.<id>...`）。
- `restart: false` は `/restart` と Gateway 再起動ツールのアクションを無効にします。デフォルト: `true`。
- `ownerAllowFrom` は、所有者専用のコマンド/ツール向けの明示的な所有者 allowlist です。`allowFrom` とは別です。
- `ownerDisplay: "hash"` はシステムプロンプト内の所有者 ID をハッシュ化します。ハッシュ化を制御するには `ownerDisplaySecret` を設定します。
- `allowFrom` はプロバイダーごとの設定です。設定されている場合、それが**唯一の**認可ソースになります（チャンネルの allowlist/ペアリングと `useAccessGroups` は無視されます）。
- `useAccessGroups: false` は、`allowFrom` が設定されていない場合に、コマンドがアクセスグループポリシーをバイパスすることを許可します。
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
