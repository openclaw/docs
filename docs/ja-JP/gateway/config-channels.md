---
read_when:
    - チャンネルPluginの設定（認証、アクセス制御、マルチアカウント）
    - チャンネルごとの設定キーのトラブルシューティング
    - DMポリシー、グループポリシー、メンション制御の監査
summary: チャンネル設定：Slack、Discord、Telegram、WhatsApp、Matrix、iMessage などにおけるアクセス制御、ペアリング、チャンネルごとのキー
title: 設定 — チャンネル
x-i18n:
    generated_at: "2026-07-16T11:36:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8d2363844e203e0c44ad9fe5d7a6a994fc654517e0488cffb836ddc9d1cdcb29
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` 配下のチャンネルごとの設定キー：DM とグループのアクセス、複数アカウント設定、メンションゲーティング、および Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、その他のチャンネル Plugin 向けのチャンネルごとのキー。

エージェント、ツール、Gateway ランタイム、その他のトップレベルキーについては、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## チャンネル

各チャンネルは、その設定セクションが存在すると自動的に起動します（`enabled: false` の場合を除く）。Telegram と iMessage はコア `openclaw` パッケージに同梱されています。その他の公式チャンネル（Discord、Slack、WhatsApp、Matrix、Microsoft Teams、IRC、Google Chat、Signal、Mattermost など）は、`openclaw plugins install <spec>` を使用して個別の Plugin としてインストールします。完全な一覧とインストール仕様については、[チャンネル](/ja-JP/channels)を参照してください。

### DM とグループのアクセス

すべてのチャンネルは、DM ポリシーとグループポリシーをサポートします。

| DM ポリシー           | 動作                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing`（デフォルト） | 不明な送信者には一度限りのペアリングコードが発行され、所有者の承認が必要 |
| `allowlist`         | `allowFrom`（またはペアリング済み許可ストア）内の送信者のみ             |
| `open`              | すべての受信 DM を許可（`allowFrom: ["*"]` が必要）             |
| `disabled`          | すべての受信 DM を無視                                          |

| グループポリシー          | 動作                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist`（デフォルト） | 設定された許可リストに一致するグループのみ          |
| `open`                | グループ許可リストを迂回（メンションゲーティングは引き続き適用） |
| `disabled`            | すべてのグループ／ルームメッセージをブロック                          |

<Note>
プロバイダーの `groupPolicy` が未設定の場合、`channels.defaults.groupPolicy` がデフォルトを設定します。
ペアリングコードは 1 時間後に期限切れになります。保留中のペアリングリクエストは、**アカウントごとに 3 件**までに制限されます（チャンネルとアカウント ID 単位）。
プロバイダーブロックが完全に欠落している場合（`channels.<provider>` が存在しない場合）、ランタイムのグループポリシーは起動時に警告を出し、`allowlist`（フェイルクローズ）にフォールバックします。
</Note>

### チャンネルのモデルオーバーライド

`channels.modelByChannel` を使用して、特定のチャンネル ID またはダイレクトメッセージの相手をモデルに固定します。値には `provider/model` または設定済みのモデルエイリアスを指定できます。チャンネルマッピングは、セッションに有効なモデルオーバーライドがまだない場合にのみ適用されます（たとえば、`/model` で設定されたもの）。

グループ／スレッド会話の場合、キーにはチャンネル固有のグループ ID、トピック ID、またはチャンネル名を使用します。ダイレクトメッセージ（DM）会話の場合、キーにはチャンネルの送信者 ID から派生した相手識別子（`nativeDirectUserId`、`origin.from`、`origin.to`、`OriginatingTo`、`From`、または `SenderId`）を使用します。正確なキー形式はチャンネルによって異なります。

| チャンネル  | DM キー形式         | 例                                      |
| -------- | ------------------- | -------------------------------------------- |
| Discord  | 未加工のユーザー ID         | `987654321`                                  |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | Matrix ユーザー ID      | `@user:matrix.org`                           |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | 未加工のユーザー ID         | `123456789`                                  |
| WhatsApp | 電話番号または JID | `15551234567`                                |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.6-sol",
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

DM 固有のキーはダイレクトメッセージ会話でのみ一致し、グループ／スレッドのルーティングには影響しません。

### チャンネルのデフォルトと Heartbeat

プロバイダー間で共有するグループポリシーと Heartbeat の動作には、`channels.defaults` を使用します。

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

- `channels.defaults.groupPolicy`：プロバイダーレベルの `groupPolicy` が未設定の場合に使用するフォールバックのグループポリシー。
- `channels.defaults.contextVisibility`：すべてのチャンネルに対する補足コンテキスト可視性のデフォルトモード。値：`all`（デフォルト。引用／スレッド／履歴のすべてのコンテキストを含める）、`allowlist`（許可リストに登録された送信者からのコンテキストのみを含める）、`allowlist_quote`（許可リストと同様だが、明示的な引用／返信コンテキストは保持）。チャンネルごとのオーバーライド：`channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`：Heartbeat 出力に正常なチャンネルステータスを含める（デフォルト `false`）。
- `channels.defaults.heartbeat.showAlerts`：Heartbeat 出力に機能低下／エラーのステータスを含める（デフォルト `true`）。
- `channels.defaults.heartbeat.useIndicator`：コンパクトなインジケータースタイルの Heartbeat 出力を表示する（デフォルト `true`）。

### WhatsApp

WhatsApp は Gateway の Web チャンネル（Baileys Web）を介して動作します。リンク済みセッションが存在すると自動的に起動します。

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
      streaming: { chunkMode: "length" }, // length | newline
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

- `web.whatsapp.keepAliveIntervalMs`（デフォルト `25000`）、`connectTimeoutMs`（デフォルト `60000`）、および `defaultQueryTimeoutMs`（デフォルト `60000`）で Baileys ソケットを調整します。
- `web.reconnect` のデフォルト：`initialMs: 2000`、`maxMs: 30000`、`factor: 1.8`、`jitter: 0.25`、`maxAttempts: 12`。`maxAttempts: 0` は断念せず無期限に再試行します。
- トップレベルの `bindings[]` エントリで `type: "acp"` を指定すると、WhatsApp の DM とグループ向けの永続的な ACP バインディングを設定できます。`match.peer.id` には、E.164 形式の直接番号または WhatsApp グループ JID を使用します。フィールドの意味は [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)で共通です。

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

- 送信コマンドは、アカウント `default` が存在する場合、デフォルトでそれを使用します。存在しない場合は、設定済みのアカウント ID の先頭（ソート順）を使用します。
- オプションの `channels.whatsapp.defaultAccount` が設定済みのアカウント ID と一致する場合、そのフォールバックのデフォルトアカウント選択をオーバーライドします。
- 従来の単一アカウント用 Baileys 認証ディレクトリは、`openclaw doctor` によって `whatsapp/default` に移行されます。
- アカウントごとのオーバーライド：`channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

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
      streaming: { mode: "partial" }, // off | partial | block | progress (default: partial)
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

- ボットトークン：`channels.telegram.botToken` または `channels.telegram.tokenFile`（通常ファイルのみ。シンボリックリンクは拒否）。デフォルトアカウントでは `TELEGRAM_BOT_TOKEN` がフォールバックです。
- `apiRoot` は Telegram Bot API のルート専用です。`https://api.telegram.org/bot<TOKEN>` ではなく、`https://api.telegram.org` またはセルフホスト／プロキシのルートを使用してください。`openclaw doctor --fix` は誤って末尾に付いた `/bot<TOKEN>` サフィックスを削除します。
- `--local` モードのセルフホスト Bot API サーバーでは、`trustedLocalFileRoots` に OpenClaw が読み取り可能なホストパスを列挙します。サーバーのデータボリュームを OpenClaw ホストにマウントし、そのデータルートまたはトークンごとのディレクトリを設定してください。`/var/lib/telegram-bot-api` 配下のコンテナパスは、それらのルートにマッピングされます。その他の絶対パスは引き続き拒否されます。
- オプションの `channels.telegram.defaultAccount` が設定済みのアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 複数アカウント設定（アカウント ID が 2 個以上）では、フォールバックルーティングを避けるため、明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定してください。これが欠落しているか無効な場合、`openclaw doctor` が警告します。
- `configWrites: false` は、Telegram から開始される設定の書き込み（スーパーグループ ID の移行、`/config set|unset`）をブロックします。
- トップレベルの `bindings[]` エントリで `type: "acp"` を指定すると、フォーラムトピック向けの永続的な ACP バインディングを設定できます（`match.peer.id` では正規形式の `chatId:topic:topicId` を使用）。フィールドの意味は [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)で共通です。
- Telegram のストリームプレビューは、`sendMessage` と `editMessageText` を使用します（ダイレクトチャットとグループチャットの両方で動作）。
- `network.dnsResultOrder` のデフォルトは `"ipv4first"` で、一般的な IPv6 取得エラーを回避します。
- 再試行ポリシー：[再試行ポリシー](/ja-JP/concepts/retry)を参照してください。

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
              systemPrompt: "短い回答のみ。",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      suppressEmbeds: true,
      streaming: {
        mode: "progress", // off | partial | block | progress（Discordのデフォルト：progress）
        chunkMode: "length", // length | newline
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

- トークン：`channels.discord.token`。デフォルトアカウントでは、フォールバックとして`DISCORD_BOT_TOKEN`を使用します。
- 明示的なDiscord `token`を指定する直接送信呼び出しでは、その呼び出しに当該トークンが使用されます。アカウントの再試行およびポリシー設定は、引き続きアクティブなランタイムスナップショット内で選択されたアカウントから取得されます。
- オプションの`channels.discord.defaultAccount`が設定済みのアカウントIDと一致する場合、デフォルトのアカウント選択を上書きします。
- 配信先には`user:<id>`（DM）または`channel:<id>`（ギルドチャンネル）を使用してください。数値IDのみの指定は拒否されます。
- ギルドのスラッグは小文字で、スペースは`-`に置換されます。チャンネルキーにはスラッグ化された名前を使用します（`#`は付けません）。ギルドIDの使用を推奨します。
- ボットが作成したメッセージはデフォルトで無視されます。`allowBots: true`で有効にできます。ボットへのメンションを含むボットメッセージのみを受け入れるには`allowBots: "mentions"`を使用します（自身のメッセージは引き続き除外されます）。
- ボットが作成した受信メッセージをサポートするチャンネルでは、共通の[ボットループ保護](/ja-JP/channels/bot-loop-protection)を使用できます。基本のペア予算には`channels.defaults.botLoopProtection`を設定し、異なる制限が必要なサーフェスがある場合にのみ、チャンネルまたはアカウント単位で上書きしてください。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（およびチャンネル単位の上書き）は、ボットにはメンションせず、別のユーザーまたはロールにメンションしているメッセージを破棄します（@everyone/@hereを除く）。
- `channels.discord.mentionAliases`は、送信前に安定した送信`@handle`テキストをDiscordユーザーIDへマッピングします。これにより、一時的なディレクトリキャッシュが空でも、既知のチームメンバーを決定論的にメンションできます。アカウント単位の上書きは`channels.discord.accounts.<accountId>.mentionAliases`に配置します。
- `maxLinesPerMessage`（デフォルトは`17`）は、2000文字未満でも縦に長いメッセージを分割します。
- `channels.discord.suppressEmbeds`のデフォルトは`true`です。そのため、無効化しない限り、送信URLはDiscordのリンクプレビューとして展開されません。明示的な`embeds`ペイロードは通常どおり送信されます。メッセージ単位のツール呼び出しでは、`suppressEmbeds`で上書きできます。
- `channels.discord.threadBindings`は、Discordのスレッドに紐づくルーティングを制御します。
  - `enabled`：スレッドに紐づくセッション機能（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、および紐づけられた配信／ルーティング）に対するDiscordの上書き
  - `idleHours`：非アクティブ状態による自動フォーカス解除までの時間数に対するDiscordの上書き（`0`で無効化）
  - `maxAgeHours`：最大存続時間（時間単位）のハード上限に対するDiscordの上書き（`0`で無効化）
  - `spawnSessions`：`sessions_spawn({ thread: true })`およびACPのスレッド生成で、スレッドの自動作成／紐づけを切り替えるスイッチ（デフォルト：`true`）
  - `defaultSpawnContext`：スレッドに紐づく生成に使用するネイティブサブエージェントコンテキスト（デフォルトは`"fork"`）
- `type: "acp"`を持つトップレベルの`bindings[]`エントリは、チャンネルおよびスレッドに対する永続的なACP紐づけを設定します（`match.peer.id`にはチャンネル／スレッドIDを使用）。フィールドの意味は[ACPエージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)で共通に説明されています。
- `channels.discord.ui.components.accentColor`は、Discord components v2コンテナのアクセントカラーを設定します。
- `channels.discord.agentComponents.ttlMs`は、送信済みDiscordコンポーネントのコールバックを登録状態に保つ期間を制御します。デフォルトは`1800000`（30分）、最大は`86400000`（24時間）です。アカウント単位の上書きは`channels.discord.accounts.<accountId>.agentComponents.ttlMs`に配置します。ワークフローに適合する最短のTTLを推奨します。
- `channels.discord.voice`は、Discordボイスチャンネルでの会話と、オプションの自動参加、LLM、TTSの上書きを有効にします。テキスト専用のDiscord設定では、音声はデフォルトで無効です。有効にするには`channels.discord.voice.enabled=true`を設定してください。
- `channels.discord.voice.model`は、Discordボイスチャンネルの応答に使用するLLMモデルを必要に応じて上書きします。
- `channels.discord.voice.daveEncryption`（デフォルトは`true`）および`channels.discord.voice.decryptionFailureTolerance`（デフォルトは`24`）は、`@discordjs/voice`のDAVEオプションへそのまま渡されます。
- `channels.discord.voice.connectTimeoutMs`は、`/vc join`および自動参加試行で、最初の`@discordjs/voice` Readyを待機する時間を制御します（デフォルトは`30000`）。
- `channels.discord.voice.reconnectGraceMs`は、切断された音声セッションが再接続シグナリングへ移行するまでに許容される時間を制御します。この時間を超えると、OpenClawはセッションを破棄します（デフォルトは`15000`）。
- Discordの音声再生は、別のユーザーの発話開始イベントによって中断されません。フィードバックループを防ぐため、OpenClawはTTSの再生中、新しい音声キャプチャを無視します。
- さらにOpenClawは、復号失敗が繰り返された場合、音声セッションから退出して再参加することで音声受信の復旧を試みます。
- `channels.discord.streaming`は、ストリームモードの正規キーです。Discordのデフォルトは`streaming.mode: "progress"`であるため、ツール／作業の進捗は、編集される1件のプレビューメッセージに表示されます。無効にするには`streaming.mode: "off"`を設定してください。従来のフラットキー（`streamMode`、`chunkMode`、`blockStreaming`、`draftChunk`、`blockStreamingCoalesce`）はランタイムで読み込まれなくなりました。永続化された設定を移行するには`openclaw doctor --fix`を実行してください。
- `channels.discord.autoPresence`は、ランタイムの可用性をボットのプレゼンスへマッピングし（正常 => online、低下 => idle、枯渇 => dnd）、オプションでステータステキストを上書きできます。
- `channels.discord.guilds.<id>.presenceEvents`は、人の在席開始を、設定された1つのDiscordチャンネルへエージェントのシステムイベントとしてルーティングします。対象メンバーには`channelId`を表示する権限が必要です。公開スレッドは親の表示権限を継承し、非公開スレッドではさらにメンバーであるかManage Threads権限が必要です。`users`で対象者をさらに絞り込めます。完全な`GUILD_CREATE`スナップショットから現在オンラインのメンバーを初期登録し、観測されたオフラインからオンラインへの遷移をルーティングします。また、未観測のメンバーから後で初めてオンライン信号を受け取った場合、そのメンバーがスナップショット後にオンラインになったのか参加したのかを断定せず、新たに在席したものとして扱います。Discordの75,000メンバーのスナップショット上限を超えるギルドでは、最初に明示的なオフライン更新が必要です。スロットリング設定：`reconnectSuppressSeconds`（新しいGatewayセッション後、ギルドのプレゼンス状態を再構築している間の抑制時間。デフォルトは300、`0`で無効化）および`burstLimit`/`burstWindowSeconds`（ギルド単位で正常にキュー投入されたイベントのレート制限。デフォルトは60秒のスライディングウィンドウごとに8イベント）。再開されたセッションでは、再接続抑制ウィンドウは開始されません。既存のユーザー単位の再挨拶クールダウンは8時間のままです。これには`channels.discord.intents.presence=true`、DiscordのDeveloper Portalにある特権Presence Intent、および有効なエージェントHeartbeatが必要です。
- `channels.discord.dangerouslyAllowNameMatching`は、変更可能な名前／タグによる照合を再び有効にします（緊急時の互換モード）。
- `channels.discord.execApprovals`：Discordネイティブの実行承認配信および承認者の認可。
  - `enabled`：`true`、`false`、または`"auto"`（デフォルト）。自動モードでは、`approvers`または`commands.ownerAllowFrom`から承認者を解決できる場合に実行承認が有効になります。
  - `approvers`：実行リクエストの承認を許可するDiscordユーザーID。省略した場合は`commands.ownerAllowFrom`へフォールバックします。
  - `agentFilter`：オプションのエージェントID許可リスト。すべてのエージェントの承認を転送する場合は省略します。
  - `sessionFilter`：オプションのセッションキーパターン（部分文字列または正規表現）。
  - `target`：承認プロンプトの送信先。`"dm"`（デフォルト）は承認者のDMへ、`"channel"`は送信元チャンネルへ、`"both"`は両方へ送信します。送信先に`"channel"`が含まれる場合、ボタンを使用できるのは解決された承認者のみです。
  - `cleanupAfterResolve`：`true`の場合、承認、拒否、またはタイムアウトの後に承認DMを削除します。

**リアクション通知モード：** `off`（なし）、`own`（ボットのメッセージ、デフォルト）、`all`（すべてのメッセージ）、`allowlist`（すべてのメッセージで`guilds.<id>.users`から）。

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

- サービスアカウントJSON：インライン（`serviceAccount`）またはファイルベース（`serviceAccountFile`）。
- サービスアカウントのSecretRefもサポートされています（`serviceAccountRef`）。
- 環境変数のフォールバック：`GOOGLE_CHAT_SERVICE_ACCOUNT`または`GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`（デフォルトアカウントのみ）。
- 配信先には`spaces/<spaceId>`または`users/<userId>`を使用してください。
- `channels.googlechat.dangerouslyAllowNameMatching`は、変更可能なメールプリンシパルによる照合を再び有効にします（緊急時の互換モード）。

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
        C123: { enabled: true, requireMention: true, allowBots: false },
        "#general": {
          enabled: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "短い回答のみ。",
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
      streaming: {
        mode: "partial", // off | partial | block | progress
        chunkMode: "length", // length | newline
        nativeTransport: true, // mode=partial の場合に Slack のネイティブストリーミング API を使用
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

- **Socket モード**には、`botToken` と `appToken` の両方が必要です（デフォルトアカウントの環境変数フォールバックには `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP モード**には、`botToken` に加えて `signingSecret`（ルートまたはアカウントごと）が必要です。
- `enterpriseOrgInstall: true` は、アカウントを Slack Enterprise Grid の
  組織全体イベントパスにオプトインします。起動時に `auth.test` を使用してボットトークンを検証し、
  設定されたモードが Slack のインストール ID と一致しない場合は
  失敗します。Enterprise の DM は無効にするか、有効な
  `allowFrom: ["*"]` とともに `dmPolicy: "open"` を使用する必要があります。
  チャンネルおよびユーザーポリシーでは、安定した Slack ID を使用する必要があります。
  変更可能な名前やサポートされていないチャンネルプレフィックスを使用すると、起動に失敗します。V1 が処理するのは、
  直接の Socket Mode または HTTP `message` および `app_mention` イベントと即時応答のみです。
  リレー、コマンド、インタラクション、App Home、リアクションイベントリスナー、
  ピン、アクションツール、ネイティブ承認、バインディング、遅延配信、および
  プロアクティブ送信は利用できません。リスナーが所有する確認応答、入力中表示、および
  ステータスリアクションは `reactions:write` で引き続き利用できますが、受信リアクション
  通知およびリアクションアクションツールは利用できません。最小権限のマニフェスト、
  セットアップワークフロー、および制限事項の全一覧については、
  [Enterprise Grid の組織全体インストール](/ja-JP/channels/slack#enterprise-grid-org-wide-installs)
  を参照してください。
- `socketMode` は、Slack SDK の Socket Mode トランスポート調整設定を公開 Bolt レシーバー API に渡します。ping/pong タイムアウトまたは古い WebSocket の動作を調査する場合にのみ使用してください。`clientPingTimeout` のデフォルトは `15000` です。`serverPingTimeout` と `pingPongLoggingEnabled` は、設定されている場合にのみ渡されます。
- `botToken`、`appToken`、`signingSecret`、および `userToken` は、プレーンテキストの
  文字列または SecretRef オブジェクトを受け付けます。
- Slack アカウントのスナップショットは、
  `botTokenSource`、`botTokenStatus`、`appTokenStatus`、および HTTP モードでは
  `signingSecretStatus` など、認証情報ごとのソース／ステータスフィールドを公開します。
  `configured_unavailable` は、アカウントが SecretRef を通じて
  設定されているものの、現在のコマンド／ランタイムパスでは
  シークレット値を解決できなかったことを意味します。
- `configWrites: false` は、Slack から開始される設定の書き込みをブロックします。
- 省略可能な `channels.slack.defaultAccount` は、設定済みのアカウント ID と一致する場合、デフォルトアカウントの選択を上書きします。
- `channels.slack.streaming.mode` は、Slack の正式なストリームモードキーです（デフォルトは `"partial"`）。`channels.slack.streaming.nativeTransport` は、Slack のネイティブストリーミングトランスポートを制御します（デフォルトは `true`）。従来の `streamMode`、真偽値の `streaming`、`chunkMode`、`blockStreaming`、`blockStreamingCoalesce`、および `nativeStreaming` の値は、ランタイムでは読み込まれなくなりました。永続化された設定を `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}` に移行するには、`openclaw doctor --fix` を実行してください。
- `unfurlLinks` と `unfurlMedia` は、ボットの返信について Slack の `chat.postMessage` リンクおよびメディア展開の真偽値を渡します。`unfurlLinks` のデフォルトは `false` であるため、有効にしない限り、送信ボットリンクはインライン展開されません。`unfurlMedia` は、設定されていない場合は省略されます。1 つのアカウントでトップレベルの値を上書きするには、いずれかの値を `channels.slack.accounts.<accountId>` に設定してください。
- 配信先には `user:<id>`（DM）または `channel:<id>` を使用してください。

**リアクション通知モード：** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` から）。

**スレッドセッションの分離：** `thread.historyScope` はスレッドごと（デフォルト）、またはチャンネル全体で共有されます。`thread.inheritParent` は、親チャンネルのトランスクリプトを新しいスレッドにコピーします。`thread.initialHistoryLimit`（デフォルトは `20`）は、新しいスレッドセッションの開始時に取得する既存のスレッドメッセージ数を制限します。`0` はスレッド履歴の取得を無効にします。

- Slack のネイティブストリーミングと、Slack アシスタント形式の「is typing...」スレッドステータスには、返信スレッドのターゲットが必要です。トップレベルの DM はデフォルトでスレッド外のままなので、スレッド形式のネイティブストリーム／ステータスプレビューを表示する代わりに、Slack の下書き投稿・編集プレビューを通じて引き続きストリーミングできます。
- `typingReaction` は、返信の実行中に受信した Slack メッセージへ一時的なリアクションを追加し、完了時に削除します。`"hourglass_flowing_sand"` のような Slack 絵文字ショートコードを使用してください。
- `channels.slack.execApprovals`：Slack ネイティブ承認クライアントへの配信と、exec 承認者の認可。スキーマは Discord と同じです：`enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack ユーザー ID）、`agentFilter`、`sessionFilter`、および `target`（`"dm"`、`"channel"`、または `"both"`）。Slack Plugin の承認者を解決できる場合、Plugin の承認では Slack 由来のリクエストにこのネイティブクライアントパスを使用できます。Slack ネイティブの Plugin 承認配信は、Slack 由来のセッションまたは Slack ターゲットに対して `approvals.plugin` を通じて有効にすることもできます。Plugin の承認では、exec 承認者ではなく、`allowFrom` の Slack Plugin 承認者とデフォルトルーティングを使用します。

| アクショングループ | デフォルト | 備考                         |
| ------------ | ------- | ---------------------- |
| reactions    | 有効 | リアクションの追加と一覧表示 |
| messages     | 有効 | 読み取り／送信／編集／削除  |
| pins         | 有効 | ピン留め／解除／一覧表示    |
| memberInfo   | 有効 | メンバー情報                |
| emojiList    | 有効 | カスタム絵文字一覧          |

### Mattermost

Mattermost は、Discord、Slack、WhatsApp と同様に、独立した Plugin としてインストールします。

```bash
openclaw plugins install @openclaw/mattermost
```

バージョンを固定する前に、[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) で現在の dist-tags を確認してください。

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
        native: true, // オプトイン
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // リバースプロキシ／公開デプロイ向けの省略可能な明示的 URL
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" },
    },
  },
}
```

チャットモード：`oncall`（@メンションに応答、デフォルト）、`onmessage`（すべてのメッセージ）、`onchar`（トリガープレフィックスで始まるメッセージ）。

Mattermost のネイティブコマンドが有効な場合：

- `commands.callbackPath` は完全な URL ではなく、パス（例：`/api/channels/mattermost/command`）である必要があります。
- `commands.callbackUrl` は OpenClaw Gateway エンドポイントに解決され、Mattermost サーバーから到達可能である必要があります。
- ネイティブスラッシュコールバックは、スラッシュコマンドの登録時に
  Mattermost から返されるコマンドごとのトークンで認証されます。登録に失敗した場合、または
  有効化されたコマンドがない場合、OpenClaw はコールバックを
  `Unauthorized: invalid command token.` で拒否します。
- プライベート／tailnet／内部コールバックホストの場合、Mattermost では
  `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックのホスト／ドメインを含める必要がある場合があります。
  完全な URL ではなく、ホスト／ドメインの値を使用してください。
- `channels.mattermost.configWrites`：Mattermost から開始される設定の書き込みを許可または拒否します。
- `channels.mattermost.requireMention`：チャンネルで返信する前に `@mention` を必須にします。
- `channels.mattermost.groups.<channelId>.requireMention`：チャンネルごとのメンション必須設定の上書き（デフォルトには `"*"`）。
- 省略可能な `channels.mattermost.defaultAccount` は、設定済みのアカウント ID と一致する場合、デフォルトアカウントの選択を上書きします。

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // 省略可能なアカウントのバインド
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

**リアクション通知モード：** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` から）。

- `channels.signal.account`：チャンネルの起動を特定の Signal アカウント ID に固定します。
- `channels.signal.configWrites`：Signal から開始される設定の書き込みを許可または拒否します。
- 省略可能な `channels.signal.defaultAccount` は、設定済みのアカウント ID と一致する場合、デフォルトアカウントの選択を上書きします。

### iMessage

OpenClaw は `imsg rpc`（stdio 経由の JSON-RPC）を起動します。デーモンもポートも不要です。ホストがメッセージデータベースおよびオートメーションの権限を付与できる場合、新しい OpenClaw iMessage セットアップではこれが推奨される方法です。

BlueBubbles のサポートは削除されました。現在の OpenClaw では、`channels.bluebubbles` はサポート対象のランタイム設定サーフェスではありません。古い設定を `channels.imessage` に移行してください。要約版については [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage)、完全な変換表については [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles) を参照してください。

Gateway が Messages にサインインしている Mac 上で実行されていない場合は、`channels.imessage.enabled=true` を維持し、`channels.imessage.cliPath` を、その Mac 上で `imsg "$@"` を実行する SSH ラッパーに設定してください。デフォルトのローカル `imsg` パスは macOS でのみ使用できます。

本番環境の送信で SSH ラッパーを使用する前に、そのラッパーを正確に経由する送信 `imsg send` を検証してください。一部の macOS TCC 状態では、Messages のオートメーション権限が `/usr/libexec/sshd-keygen-wrapper` に割り当てられます。その場合、読み取りやプローブは機能しても、送信は AppleEvents `-1743` で失敗することがあります。[iMessage](/ja-JP/channels/imessage) の SSH ラッパーのトラブルシューティングセクションを参照してください。

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

- 任意指定の `channels.imessage.defaultAccount` は、設定済みのアカウント ID と一致する場合、デフォルトのアカウント選択を上書きします。
- Messages DB へのフルディスクアクセスが必要です。
- `chat_id:<id>` ターゲットを推奨します。チャットの一覧表示には `imsg chats --limit 20` を使用します。
- `cliPath` には SSH ラッパーを指定できます。SCP による添付ファイル取得には `remoteHost`（`host` または `user@host`）を設定します。
- `attachmentRoots` と `remoteAttachmentRoots` は、受信添付ファイルのパスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCP は厳格なホストキー検証を使用するため、リレーホストのキーが `~/.ssh/known_hosts` にすでに存在することを確認してください。
- `channels.imessage.configWrites`: iMessage から開始された設定書き込みを許可または拒否します。
- `channels.imessage.sendTransport`: 通常の送信返信に使用する優先 `imsg` RPC 送信トランスポートです。`auto`（デフォルト）は、IMCore ブリッジが実行中の場合、既存のチャットにそのブリッジを使用し、その後 AppleScript にフォールバックします。`bridge` はプライベート API による配信を必須とし、`applescript` は公開 Messages 自動化パスを強制します。
- `channels.imessage.actions.*`: `imsg status` / `openclaw channels status --probe` によっても制御されるプライベート API アクションを有効にします。
- `channels.imessage.includeAttachments` はデフォルトで無効です。エージェントターンで受信メディアを使用するには、`true` に設定します。
- ブリッジ/Gateway の再起動後の受信復旧は自動です（GUID の重複排除と古いバックログに対する経過時間制限）。既存の `channels.imessage.catchup.enabled: true` 設定は、非推奨の互換性プロファイルとして引き続き尊重されます。`catchup` はデフォルトで無効です。
- `channels.imessage.groups`: グループレジストリとグループごとの設定です。`groupPolicy: "allowlist"` を使用する場合、グループメッセージがレジストリゲートを通過できるように、明示的な `chat_id` キーまたは `"*"` ワイルドカードエントリを設定します。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、iMessage の会話を永続 ACP セッションにバインドできます。`match.peer.id` には、正規化されたハンドルまたは明示的なチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共有フィールドのセマンティクス: [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)。

<Accordion title="iMessage SSH ラッパーの例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix は Plugin によって提供され、`channels.matrix` で設定します。

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

- トークン認証では `accessToken` を使用し、パスワード認証では `userId` + `password` を使用します。
- `channels.matrix.proxy` は、Matrix の HTTP トラフィックを明示的な HTTP(S) プロキシ経由でルーティングします。名前付きアカウントでは `channels.matrix.accounts.<id>.proxy` によって上書きできます。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` は、プライベート/内部ホームサーバーを許可します。`proxy` とこのネットワークのオプトインは独立した制御です。
- `channels.matrix.defaultAccount` は、複数アカウント構成で優先するアカウントを選択します。
- `channels.matrix.autoJoin` のデフォルトは `"off"` です。そのため、`autoJoin: "allowlist"` を `autoJoinAllowlist` または `autoJoin: "always"` とともに設定するまで、招待されたルームと新しい DM 形式の招待は無視されます。
- `channels.matrix.execApprovals`: Matrix ネイティブの実行承認配信と承認者の認可です。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）です。自動モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に実行承認が有効になります。
  - `approvers`: 実行リクエストの承認を許可された Matrix ユーザー ID（例: `@owner:example.org`）です。
  - `agentFilter`: 任意指定のエージェント ID 許可リストです。すべてのエージェントの承認を転送する場合は省略します。
  - `sessionFilter`: 任意指定のセッションキーパターン（部分文字列または正規表現）です。
  - `target`: 承認プロンプトの送信先です。`"dm"`（デフォルト）、`"channel"`（発信元ルーム）、または `"both"` です。
  - アカウントごとの上書き: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` は、Matrix の DM をセッションにグループ化する方法を制御します。`per-user`（デフォルト）はルーティングされた相手ごとに共有し、`per-room` は各 DM ルームを分離します。
- Matrix のステータスプローブとライブディレクトリ検索では、ランタイムトラフィックと同じプロキシポリシーを使用します。
- Matrix の完全な設定、ターゲット指定ルール、およびセットアップ例については、[Matrix](/ja-JP/channels/matrix) を参照してください。

### Microsoft Teams

Microsoft Teams は Plugin によって提供され、`channels.msteams` で設定します。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId、appPassword、tenantId、Webhook、チーム/チャネルのポリシー:
      // /channels/msteams を参照
    },
  },
}
```

- ここで扱う主要なキーパス: `channels.msteams`、`channels.msteams.configWrites`。
- Teams の完全な設定（認証情報、Webhook、DM/グループポリシー、チームごと/チャネルごとの上書き）については、[Microsoft Teams](/ja-JP/channels/msteams) を参照してください。

### IRC

IRC は Plugin によって提供され、`channels.irc` で設定します。

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
- 任意指定の `channels.irc.defaultAccount` は、設定済みのアカウント ID と一致する場合、デフォルトのアカウント選択を上書きします。
- IRC チャネルの完全な設定（ホスト/ポート/TLS/チャネル/許可リスト/メンションゲート）については、[IRC](/ja-JP/channels/irc) を参照してください。

### 複数アカウント（すべてのチャネル）

チャネルごとに複数のアカウントを実行します（各アカウントは固有の `accountId` を持ちます）。

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

- `accountId` が省略された場合、`default` が使用されます（CLI + ルーティング）。
- 環境変数のトークンは、**デフォルト**アカウントにのみ適用されます。
- 基本チャネル設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- 各アカウントを異なるエージェントにルーティングするには、`bindings[].match.accountId` を使用します。
- 単一アカウントのトップレベルチャネル設定を使用している状態で、`openclaw channels add`（またはチャネルのオンボーディング）を介してデフォルト以外のアカウントを追加すると、OpenClaw はまずアカウントスコープのトップレベル単一アカウント値をチャネルのアカウントマップへ昇格させ、元のアカウントが引き続き動作するようにします。ほとんどのチャネルでは、それらを `channels.<channel>.accounts.default` に移動します。Matrix では、既存の一致する名前付き/デフォルトのターゲットを代わりに保持できます。
- 既存のチャネル専用バインディング（`accountId` なし）は、引き続きデフォルトアカウントに一致します。アカウントスコープのバインディングは任意指定のままです。
- `openclaw doctor --fix` は、アカウントスコープのトップレベル単一アカウント値を、そのチャネルに選択された昇格先アカウントへ移動することで、混在した構造も修復します。ほとんどのチャネルでは `accounts.default` を使用します。Matrix では、既存の一致する名前付き/デフォルトのターゲットを代わりに保持できます。

### その他の Plugin チャネル

多くの Plugin チャネルは `channels.<id>` として設定され、専用のチャネルページに記載されています（例: Feishu、LINE、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Twitch、Zalo）。
チャネルの完全な一覧については、[チャネル](/ja-JP/channels)を参照してください。

### グループチャットのメンションゲート

グループメッセージはデフォルトで**メンション必須**です（メタデータのメンションまたは安全な正規表現パターン）。WhatsApp、Telegram、Discord、Google Chat、および iMessage のグループチャットに適用されます。

表示される返信は個別に制御されます。通常のグループ、チャネル、および内部 WebChat の直接リクエストでは、デフォルトで最終応答が自動配信されます。つまり、アシスタントの最終テキストは従来の表示返信パスを通じて投稿されます。エージェントが `message(action=send)` を呼び出した後にのみ表示出力を投稿する場合は、`messages.visibleReplies: "message_tool"` または `messages.groupChat.visibleReplies: "message_tool"` をオプトインします。オプトインしたツール専用モードで、モデルがメッセージツールを呼び出さずに実質的な最終回答を返した場合、その最終テキストは非公開のままとなり、Gateway の詳細ログに抑制されたペイロードのメタデータが記録され、OpenClaw は `message(action=send)` を介して同じ返信を配信するようモデルに求める復旧リトライを 1 回キューに追加します。

ツール専用の表示返信には、確実にツールを呼び出すモデル/ランタイムが必要であり、GPT-5.6 Sol などの最新世代モデルを使用する共有アンビエントルームに推奨されます。一部の性能が低いモデルは最終テキストで回答できても、送信元に表示される出力を `message(action=send)` で送信する必要があることを理解できない場合があります。OpenClaw は、最終応答が実質的であり、送信元のターンがルームイベントではなく、送信ポリシーが配信を拒否しておらず、送信元への返信がまだ送信されていない場合にのみ、デフォルトで一般的な最終応答の取り残しを復旧します。復旧は 1 回のリトライに制限されます。合成されたリトライプロンプトの永続化を抑制し、そのリトライを収集バッチ処理から除外するため、無関係なキュー内プロンプトと統合されることはありません。リトライでも取り残されるか、キューに追加できない場合、OpenClaw は「返信を生成しましたが、このチャットに配信できませんでした。もう一度お試しください。」のようなサニタイズ済みの診断メッセージのみを配信します。元の非公開の最終テキストが、送信元への自動配信対象としてマークされることはありません。返信を繰り返し取り残すモデルでは、アシスタントの最終ターンを表示返信パスにするために `"automatic"` を使用するか、ツール呼び出し能力の高いモデルに切り替えるか、Gateway の詳細ログで抑制されたペイロードの概要を確認するか、すべてのグループ/チャネルリクエストで表示される最終返信を使用するよう `messages.groupChat.visibleReplies: "automatic"` を設定します。

有効なツールポリシーでメッセージツールが利用できない場合、OpenClaw は応答を暗黙に抑制せず、自動表示返信にフォールバックします。`openclaw doctor` はこの不一致について警告します。

このルールは、通常のエージェントの最終テキストに適用されます。Plugin が所有する会話バインディングでは、要求されたバインド済みスレッドのターンに対して、所有 Plugin が返す返信を表示応答として使用します。Plugin は、それらのバインディング返信のために `message(action=send)` を呼び出す必要はありません。

**トラブルシューティング: グループの @メンションで入力中表示が出た後、無応答になる（エラーなし）**

症状: グループ/チャネルの @メンションで入力中インジケーターが表示され、Gateway ログに `dispatch complete (queuedFinal=false, replies=0)` が記録されますが、ルームにメッセージが届きません。同じエージェントへの DM には通常どおり返信されます。

原因: グループ/チャネルの可視返信モードが `"message_tool"` に解決されるため、OpenClaw はターンを実行しますが、エージェントが `message(action=send)` を呼び出さない限り、アシスタントの最終テキストを抑制します。このモードには `NO_REPLY` の契約はありません。メッセージツールが呼び出されなければ、元の最終テキストは非公開になります。実質的な内容を含むソースターンに対して、OpenClaw は現在、ガード付きの復旧再試行を 1 回行います。短いメモ、明示的な無応答、ルームイベント、送信ポリシーで拒否されたターン、すでに配信済みのターンは再試行されません。通常のグループおよびチャネルターンはデフォルトで `"automatic"` になるため、この症状は `messages.groupChat.visibleReplies`（またはグローバルな `messages.visibleReplies`）が明示的に `"message_tool"` に設定されている場合にのみ発生します。ハーネスの `defaultVisibleReplies` はここでは適用されません。グループ/チャネルのリゾルバーはこれを無視し、ダイレクト/ソースチャットにのみ影響します（Codex ハーネスはこの方法でダイレクトチャットの最終出力を抑制します）。

修正: より確実にツールを呼び出すモデルを選択するか、明示的な `"message_tool"` オーバーライドを削除して `"automatic"` のデフォルトにフォールバックするか、`messages.groupChat.visibleReplies: "automatic"` を設定して、すべてのグループ/チャネルリクエストで可視返信を強制します。実質的な内容を含む未配信の最終出力が、無言の成功として終了することはなくなります。`message(action=send)` による 1 回の再試行で復旧するか、サニタイズされた配信失敗の診断が表示されます。ファイルの保存後、Gateway は `messages` の設定をホットリロードします。デプロイ環境でファイル監視または設定のリロードが無効になっている場合にのみ、Gateway を再起動してください。

**メンションの種類:**

- **メタデータメンション**: プラットフォームネイティブの @メンション。WhatsApp のセルフチャットモードでは無視されます。
- **テキストパターン**: `agents.list[].groupChat.mentionPatterns` 内の安全な正規表現パターン。無効なパターンや安全でない入れ子の繰り返しは無視されます。
- メンションゲーティングは、検出が可能な場合（ネイティブメンションまたは少なくとも 1 つのパターンがある場合）にのみ適用されます。

```json5
{
  messages: {
    visibleReplies: "automatic", // ダイレクト/ソースチャットで従来の自動最終返信を強制
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // 常時有効なメンションなしのルーム会話を静かなコンテキストにする
      visibleReplies: "message_tool", // オプトイン。可視のルーム返信には message(action=send) を要求
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` はグローバルデフォルトを設定します。チャネルでは `channels.<channel>.historyLimit`（またはアカウント単位）でオーバーライドできます。無効にするには `0` を設定します。

`messages.groupChat.unmentionedInbound: "room_event"` は、対応するチャネルで、メンションのない常時有効なグループ/チャネルメッセージを静かなルームコンテキストとして送信します。メンションされたメッセージ、コマンド、ダイレクトメッセージは引き続きユーザーリクエストとして扱われます。Discord、Slack、Telegram の完全な例については、[アンビエントルームイベント](/ja-JP/channels/ambient-room-events)を参照してください。

`messages.visibleReplies` はグローバルなソースイベントのデフォルトです。`messages.groupChat.visibleReplies` はグループ/チャネルのソースイベントに対してこれをオーバーライドします。`messages.visibleReplies` が未設定の場合、ダイレクト/ソースチャットでは選択したランタイムまたはハーネスのデフォルトが使用されますが、内部 WebChat のダイレクトターンでは Pi/Codex のプロンプトとの整合性を保つため、最終出力が自動配信されます。可視出力に意図的に `message(action=send)` を必須とするには、`messages.visibleReplies: "message_tool"` を設定します。チャネルの許可リストとメンションゲーティングによって、イベントを処理するかどうかは引き続き決定されます。

#### DM 履歴の上限

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

解決順序: DM 単位のオーバーライド → プロバイダーのデフォルト → 制限なし（すべて保持）。

このリゾルバーは、セッションキーが標準の `provider:direct:<id>`（またはレガシーの `provider:dm:<id>`）形式に従うすべてのチャネルについて、`channels.<provider>.dmHistoryLimit` と `channels.<provider>.dms.<id>.historyLimit` を読み取ります。そのため、固定リストだけでなく、バンドルされたチャネルと Plugin チャネルの両方で機能します。

#### セルフチャットモード

セルフチャットモードを有効にするには、自分の番号を `allowFrom` に含めます（ネイティブの @メンションを無視し、テキストパターンにのみ応答します）。

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
    native: "auto", // 対応している場合にネイティブコマンドを登録
    nativeSkills: "auto", // 対応している場合にネイティブの Skills コマンドを登録
    text: true, // チャットメッセージ内の /commands を解析
    bash: false, // ! を許可（別名: /bash）
    bashForegroundMs: 2000,
    config: false, // /config を許可
    mcp: false, // /mcp を許可
    plugins: false, // /plugins を許可
    debug: false, // /debug を許可
    restart: true, // /restart と外部 SIGUSR1 再起動リクエストを許可
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

- このブロックはコマンドサーフェスを設定します。現在の組み込みおよびバンドルされたコマンドカタログについては、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。
- このページは**設定キーのリファレンス**であり、完全なコマンドカタログではありません。QQ Bot の `/bot-ping` `/bot-help` `/bot-logs`、LINE の `/card`、デバイスペアリングの `/pair`、メモリの `/dreaming`、電話制御の `/phone`、Talk の `/voice` など、チャネル/Plugin が所有するコマンドについては、それぞれのチャネル/Plugin ページと[スラッシュコマンド](/ja-JP/tools/slash-commands)に記載されています。
- テキストコマンドは、先頭に `/` がある**単独の**メッセージでなければなりません。
- `native: "auto"` は Discord/Telegram のネイティブコマンドを有効にし、Slack では無効のままにします。
- `nativeSkills: "auto"` は Discord/Telegram のネイティブ Skills コマンドを有効にし、Slack では無効のままにします。
- チャネルごとのオーバーライド: `channels.discord.commands.native`（真偽値または `"auto"`）。Discord では、`false` により起動時のネイティブコマンドの登録とクリーンアップをスキップします。
- チャネルごとのネイティブ Skills 登録は `channels.<provider>.commands.nativeSkills` でオーバーライドします。
- `channels.telegram.customCommands` は Telegram ボットのメニュー項目を追加します。
- `bash: true` はホストシェル用の `! <cmd>` を有効にします。`tools.elevated.enabled` が必要であり、送信者が `tools.elevated.allowFrom.<channel>` に含まれている必要があります。
- `config: true` は `/config` を有効にします（`openclaw.json` を読み書きします）。Gateway の `chat.send` クライアントでは、永続的な `/config set|unset` の書き込みには `operator.admin` も必要です。読み取り専用の `/config show` は、通常の書き込みスコープを持つオペレータークライアントでも引き続き利用できます。
- `mcp: true` は、`mcp.servers` 配下で OpenClaw が管理する MCP サーバー設定用の `/mcp` を有効にします。
- `plugins: true` は、Plugin の検出、インストール、有効化/無効化を制御する `/plugins` を有効にします。
- `channels.<provider>.configWrites` はチャネルごとの設定変更を制御します（デフォルト: true）。
- 複数アカウント対応チャネルでは、`channels.<provider>.accounts.<id>.configWrites` は、そのアカウントを対象とする書き込み（たとえば `/allowlist --config --account <id>` や `/config set channels.<provider>.accounts.<id>...`）も制御します。
- `restart: false` は `/restart` と外部からの `SIGUSR1` 再起動リクエストを無効にします。デフォルト: `true`。
- `ownerAllowFrom` は、所有者専用コマンドおよび所有者によって制限されるチャネルアクションの明示的な所有者許可リストです。`allowFrom` とは別です。
- `ownerDisplay: "hash"` は、システムプロンプト内の所有者 ID をハッシュ化します。ハッシュ化を制御するには `ownerDisplaySecret` を設定します。
- `allowFrom` はプロバイダーごとに設定します。設定されている場合、これが**唯一の**認可ソースになります（チャネルの許可リスト/ペアリングおよび `useAccessGroups` は無視されます）。
- `useAccessGroups: false` は、`allowFrom` が設定されていない場合に、コマンドがアクセスグループのポリシーを迂回できるようにします。
- コマンドドキュメントの一覧:
  - 組み込みおよびバンドルされたカタログ: [スラッシュコマンド](/ja-JP/tools/slash-commands)
  - チャネル固有のコマンドサーフェス: [チャネル](/ja-JP/channels)
  - QQ Bot のコマンド: [QQ Bot](/ja-JP/channels/qqbot)
  - ペアリングコマンド: [ペアリング](/ja-JP/channels/pairing)
  - LINE カードコマンド: [LINE](/ja-JP/channels/line)
  - メモリの Dreaming: [Dreaming](/ja-JP/concepts/dreaming)

</Accordion>

---

## 関連項目

- [設定リファレンス](/ja-JP/gateway/configuration-reference) — トップレベルキー
- [設定 — エージェント](/ja-JP/gateway/config-agents)
- [チャネルの概要](/ja-JP/channels)
