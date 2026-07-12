---
read_when:
    - チャンネルPluginの設定（認証、アクセス制御、複数アカウント）
    - チャンネルごとの設定キーのトラブルシューティング
    - DMポリシー、グループポリシー、またはメンションゲーティングの監査
summary: チャンネル設定：Slack、Discord、Telegram、WhatsApp、Matrix、iMessage などにおけるアクセス制御、ペアリング、チャンネルごとのキー
title: 設定 — チャンネル
x-i18n:
    generated_at: "2026-07-12T14:27:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: af161d396b2dc40e3ccb5f00ca4815fc1ad782f96f98dc4a74d65be958530da6
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` 配下のチャネル別設定キー：DM とグループへのアクセス、複数アカウント構成、メンションによるゲーティング、Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、およびその他のチャネル Plugin 用のチャネル別キー。

エージェント、ツール、Gateway ランタイム、およびその他のトップレベルキーについては、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## チャネル

各チャネルは、その設定セクションが存在すると自動的に起動します（`enabled: false` の場合を除く）。Telegram と iMessage はコアの `openclaw` パッケージに含まれています。その他の公式チャネル（Discord、Slack、WhatsApp、Matrix、Microsoft Teams、IRC、Google Chat、Signal、Mattermost など）は、`openclaw plugins install <spec>` を使用して個別の Plugin としてインストールします。完全な一覧とインストール仕様については、[チャネル](/ja-JP/channels)を参照してください。

### DM とグループへのアクセス

すべてのチャネルで DM ポリシーとグループポリシーがサポートされています。

| DM ポリシー         | 動作                                                                  |
| ------------------- | --------------------------------------------------------------------- |
| `pairing`（既定）   | 不明な送信者には一度限りのペアリングコードが発行され、所有者の承認が必要 |
| `allowlist`         | `allowFrom`（またはペアリング済み許可ストア）内の送信者のみ             |
| `open`              | すべての受信 DM を許可（`allowFrom: ["*"]` が必要）                    |
| `disabled`          | すべての受信 DM を無視                                                |

| グループポリシー      | 動作                                                           |
| --------------------- | -------------------------------------------------------------- |
| `allowlist`（既定）   | 設定された許可リストに一致するグループのみ                     |
| `open`                | グループ許可リストを迂回（メンションによるゲーティングは引き続き適用） |
| `disabled`            | すべてのグループ／ルームメッセージをブロック                   |

<Note>
プロバイダーの `groupPolicy` が未設定の場合、`channels.defaults.groupPolicy` が既定値を設定します。
ペアリングコードは 1 時間後に期限切れになります。保留中のペアリング要求は、**アカウントごとに 3 件**までに制限されます（チャネルとアカウント ID 単位）。
プロバイダーブロック自体が存在しない場合（`channels.<provider>` がない場合）、ランタイムのグループポリシーは起動時に警告を表示し、`allowlist` にフォールバックします（フェイルクローズ）。
</Note>

### チャネルのモデルオーバーライド

`channels.modelByChannel` を使用すると、特定のチャネル ID またはダイレクトメッセージの相手をモデルに固定できます。値には `provider/model` または設定済みのモデルエイリアスを指定できます。チャネルマッピングは、セッションに有効なモデルオーバーライドがまだ存在しない場合にのみ適用されます（たとえば、`/model` で設定されたもの）。

グループ／スレッド会話では、キーはチャネル固有のグループ ID、トピック ID、またはチャネル名です。ダイレクトメッセージ（DM）会話では、キーはチャネルの送信者 ID（`nativeDirectUserId`、`origin.from`、`origin.to`、`OriginatingTo`、`From`、または `SenderId`）から導出される相手の識別子です。正確なキー形式はチャネルによって異なります。

| チャネル | DM キー形式       | 例                                           |
| -------- | ----------------- | -------------------------------------------- |
| Discord  | 生のユーザー ID   | `987654321`                                  |
| Feishu   | `feishu:ou_...`   | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | Matrix ユーザー ID | `@user:matrix.org`                           |
| Slack    | `user:U...`       | `user:U12345`                                |
| Telegram | 生のユーザー ID   | `123456789`                                  |
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

### チャネルの既定値と Heartbeat

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
- `channels.defaults.contextVisibility`：すべてのチャネルに対する補足コンテキストの既定の可視性モード。値：`all`（既定、引用／スレッド／履歴コンテキストをすべて含める）、`allowlist`（許可リスト内の送信者からのコンテキストのみを含める）、`allowlist_quote`（許可リストと同じだが、明示的な引用／返信コンテキストは保持）。チャネル別のオーバーライド：`channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`：正常なチャネルステータスを Heartbeat 出力に含めます（既定は `false`）。
- `channels.defaults.heartbeat.showAlerts`：機能低下／エラーのステータスを Heartbeat 出力に含めます（既定は `true`）。
- `channels.defaults.heartbeat.useIndicator`：コンパクトなインジケータ形式で Heartbeat 出力を表示します（既定は `true`）。

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
      maxMs: 30000,
      factor: 1.8,
      jitter: 0.25,
      maxAttempts: 12, // 0 = 永久に再試行
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

- `web.whatsapp.keepAliveIntervalMs`（既定は `25000`）、`connectTimeoutMs`（既定は `60000`）、および `defaultQueryTimeoutMs`（既定は `60000`）で Baileys ソケットを調整します。
- `web.reconnect` の既定値：`initialMs: 2000`、`maxMs: 30000`、`factor: 1.8`、`jitter: 0.25`、`maxAttempts: 12`。`maxAttempts: 0` は断念せず永久に再試行します。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、WhatsApp の DM とグループ用に永続的な ACP バインディングを設定します。`match.peer.id` には E.164 形式の直接番号または WhatsApp グループ JID を使用します。フィールドのセマンティクスは [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)で共通化されています。

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

- 送信コマンドでは、アカウント `default` が存在する場合はそれを既定で使用し、存在しない場合は設定済みの最初のアカウント ID（ソート順）を使用します。
- オプションの `channels.whatsapp.defaultAccount` が設定済みのアカウント ID と一致する場合、そのフォールバックの既定アカウント選択をオーバーライドします。
- 従来の単一アカウント用 Baileys 認証ディレクトリは、`openclaw doctor` によって `whatsapp/default` に移行されます。
- アカウント別のオーバーライド：`channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

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
          systemPrompt: "回答は簡潔にしてください。",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "トピックから逸れないでください。",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git バックアップ" },
        { command: "generate", description: "画像を作成" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress（既定：partial）
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

- Bot トークン：`channels.telegram.botToken` または `channels.telegram.tokenFile`（通常ファイルのみ。シンボリックリンクは拒否）を使用し、既定アカウントでは `TELEGRAM_BOT_TOKEN` をフォールバックとして使用します。
- `apiRoot` は Telegram Bot API のルート専用です。`https://api.telegram.org` またはセルフホスト／プロキシのルートを使用し、`https://api.telegram.org/bot<TOKEN>` は使用しないでください。`openclaw doctor --fix` は誤って付加された末尾の `/bot<TOKEN>` サフィックスを削除します。
- `--local` モードのセルフホスト Bot API サーバーでは、`trustedLocalFileRoots` に OpenClaw が読み取り可能なホストパスを列挙します。サーバーのデータボリュームを OpenClaw ホストにマウントし、そのデータルートまたはトークン別ディレクトリのいずれかを設定してください。`/var/lib/telegram-bot-api` 配下のコンテナパスは、これらのルートにマッピングされます。その他の絶対パスは引き続き拒否されます。
- オプションの `channels.telegram.defaultAccount` が設定済みのアカウント ID と一致する場合、既定のアカウント選択をオーバーライドします。
- 複数アカウント構成（2 個以上のアカウント ID）では、フォールバックルーティングを避けるため、明示的な既定値（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定してください。これがないか無効な場合、`openclaw doctor` が警告します。
- `configWrites: false` は、Telegram から開始される設定の書き込み（スーパーグループ ID の移行、`/config set|unset`）をブロックします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、フォーラムトピック用に永続的な ACP バインディングを設定します（`match.peer.id` では正規形式の `chatId:topic:topicId` を使用）。フィールドのセマンティクスは [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)で共通化されています。
- Telegram のストリームプレビューは `sendMessage` + `editMessageText` を使用します（ダイレクトチャットとグループチャットの両方で動作）。
- `network.dnsResultOrder` の既定値は `"ipv4first"` で、一般的な IPv6 のフェッチ失敗を回避します。
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
        mode: "progress", // off | partial | block | progress（Discord のデフォルト: progress）
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

- トークン: `channels.discord.token`。デフォルトアカウントでは `DISCORD_BOT_TOKEN` がフォールバックとして使用されます。
- 明示的な Discord `token` を指定する直接送信呼び出しでは、その呼び出しに指定されたトークンが使用されます。アカウントの再試行およびポリシー設定は、引き続きアクティブなランタイムスナップショットで選択されたアカウントから取得されます。
- オプションの `channels.discord.defaultAccount` は、設定済みのアカウント ID と一致する場合、デフォルトのアカウント選択を上書きします。
- 配信先には `user:<id>`（DM）または `channel:<id>`（ギルドチャンネル）を使用します。数字のみの ID は拒否されます。
- ギルドのスラッグは小文字で、スペースは `-` に置き換えられます。チャンネルキーにはスラッグ化された名前（`#` なし）を使用します。ギルド ID を優先してください。
- ボットが作成したメッセージはデフォルトで無視されます。`allowBots: true` で有効になります。ボットにメンションしているボットメッセージのみを受け入れるには `allowBots: "mentions"` を使用します（自身のメッセージは引き続き除外されます）。
- ボットが作成した受信メッセージをサポートするチャンネルでは、共通の[ボットループ保護](/ja-JP/channels/bot-loop-protection)を使用できます。ペア単位の基本予算を `channels.defaults.botLoopProtection` で設定し、異なる制限が必要なサーフェスがある場合にのみチャンネルまたはアカウントで上書きします。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（およびチャンネルごとの上書き）は、ボット以外のユーザーまたはロールにメンションしているメッセージを除外します（@everyone/@here は除く）。
- `channels.discord.mentionAliases` は、送信前に固定の送信 `@handle` テキストを Discord ユーザー ID にマッピングします。これにより、一時的なディレクトリキャッシュが空の場合でも、既知のチームメイトを確実にメンションできます。アカウントごとの上書きは `channels.discord.accounts.<accountId>.mentionAliases` に配置します。
- `maxLinesPerMessage`（デフォルト `17`）は、2000 文字未満であっても縦に長いメッセージを分割します。
- `channels.discord.suppressEmbeds` のデフォルトは `true` であるため、無効にしない限り送信 URL は Discord のリンクプレビューとして展開されません。明示的な `embeds` ペイロードは通常どおり送信されます。メッセージ単位のツール呼び出しでは `suppressEmbeds` を指定して上書きできます。
- `channels.discord.threadBindings` は、Discord のスレッドに紐づくルーティングを制御します。
  - `enabled`: スレッドに紐づくセッション機能（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、および紐づけられた配信/ルーティング）に対する Discord の上書き
  - `idleHours`: 非アクティブ状態による自動フォーカス解除までの時間単位の Discord 上書き（`0` で無効）
  - `maxAgeHours`: ハード上限期間に対する時間単位の Discord 上書き（`0` で無効）
  - `spawnSessions`: `sessions_spawn({ thread: true })` および ACP のスレッド生成時における自動スレッド作成/紐づけのスイッチ（デフォルト: `true`）
  - `defaultSpawnContext`: スレッドに紐づく生成で使用するネイティブサブエージェントコンテキスト（デフォルトは `"fork"`）
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、チャンネルおよびスレッドの永続的な ACP 紐づけを設定します（`match.peer.id` にチャンネル/スレッド ID を使用します）。フィールドのセマンティクスについては、[ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)を参照してください。
- `channels.discord.ui.components.accentColor` は、Discord components v2 コンテナのアクセントカラーを設定します。
- `channels.discord.agentComponents.ttlMs` は、送信した Discord コンポーネントのコールバックを登録状態に保つ期間を制御します。デフォルトは `1800000`（30 分）、最大は `86400000`（24 時間）です。アカウントごとの上書きは `channels.discord.accounts.<accountId>.agentComponents.ttlMs` に配置します。ワークフローに適合する最短の TTL を推奨します。
- `channels.discord.voice` は、Discord ボイスチャンネルでの会話、およびオプションの自動参加、LLM、TTS の上書きを有効にします。テキストのみの Discord 設定では、ボイス機能はデフォルトで無効です。オプトインするには `channels.discord.voice.enabled=true` を設定します。
- `channels.discord.voice.model` は、Discord ボイスチャンネルの応答に使用する LLM モデルをオプションで上書きします。
- `channels.discord.voice.daveEncryption`（デフォルト `true`）および `channels.discord.voice.decryptionFailureTolerance`（デフォルト `24`）は、`@discordjs/voice` の DAVE オプションにそのまま渡されます。
- `channels.discord.voice.connectTimeoutMs` は、`/vc join` および自動参加の試行時における最初の `@discordjs/voice` Ready 待機時間を制御します（デフォルト `30000`）。
- `channels.discord.voice.reconnectGraceMs` は、切断されたボイスセッションが再接続シグナリングに移行するまでに許容される時間を制御します。この時間を超えると OpenClaw がセッションを破棄します（デフォルト `15000`）。
- Discord の音声再生は、別のユーザーの発話開始イベントによって中断されません。フィードバックループを避けるため、OpenClaw は TTS の再生中、新しい音声キャプチャを無視します。
- OpenClaw はさらに、復号失敗が繰り返された場合、ボイスセッションから退出して再参加することで音声受信の復旧を試みます。
- `channels.discord.streaming` は正規のストリームモードキーです。Discord のデフォルトは `streaming.mode: "progress"` で、ツールや作業の進捗が編集される 1 件のプレビューメッセージに表示されます。無効にするには `streaming.mode: "off"` を設定します。従来のフラットキー（`streamMode`、`chunkMode`、`blockStreaming`、`draftChunk`、`blockStreamingCoalesce`）はランタイムで読み込まれなくなりました。永続化された設定を移行するには `openclaw doctor --fix` を実行してください。
- `channels.discord.autoPresence` は、ランタイムの可用性をボットのプレゼンス（正常 => オンライン、劣化 => アイドル、枯渇 => dnd）にマッピングし、オプションのステータステキスト上書きを許可します。
- `channels.discord.dangerouslyAllowNameMatching` は、変更可能な名前/タグの照合を再度有効にします（緊急時用の互換モード）。
- `channels.discord.execApprovals`: Discord ネイティブの実行承認配信と承認者の認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。auto モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に実行承認が有効になります。
  - `approvers`: 実行リクエストを承認できる Discord ユーザー ID。省略した場合は `commands.ownerAllowFrom` にフォールバックします。
  - `agentFilter`: オプションのエージェント ID 許可リスト。すべてのエージェントの承認を転送する場合は省略します。
  - `sessionFilter`: オプションのセッションキーパターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）は承認者の DM に、`"channel"` は送信元チャンネルに、`"both"` は両方に送信します。対象に `"channel"` が含まれる場合、ボタンを使用できるのは解決済みの承認者のみです。
  - `cleanupAfterResolve`: `true` の場合、承認、拒否、またはタイムアウト後に承認 DM を削除します。

**リアクション通知モード:** `off`（なし）、`own`（ボットのメッセージ、デフォルト）、`all`（すべてのメッセージ）、`allowlist`（すべてのメッセージについて `guilds.<id>.users` のユーザー）。

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
- 環境変数のフォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`（デフォルトアカウントのみ）。
- 配信先には `spaces/<spaceId>` または `users/<userId>` を使用します。
- `channels.googlechat.dangerouslyAllowNameMatching` は、変更可能なメールプリンシパルの照合を再度有効にします（緊急時用の互換モード）。

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
        nativeTransport: true, // mode=partial の場合に Slack ネイティブのストリーミング API を使用
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

- **Socket mode** には、`botToken` と `appToken` の両方が必要です（デフォルトアカウントの環境変数フォールバックには `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP mode** には、`botToken` と `signingSecret`（ルートまたはアカウントごと）が必要です。
- `enterpriseOrgInstall: true` は、アカウントを Slack Enterprise Grid の
  組織全体イベントパスにオプトインします。起動時に `auth.test` でボットトークンを検証し、
  設定されたモードが Slack のインストール ID と一致しない場合は失敗します。
  Enterprise の DM は無効にするか、有効な
  `allowFrom: ["*"]` とともに `dmPolicy: "open"` を使用する必要があります。チャンネルおよびユーザーポリシーでは安定した Slack ID を使用する必要があり、
  変更可能な名前やサポートされていないチャンネルプレフィックスがあると起動に失敗します。V1 が処理するのは、
  即時返信を伴う直接の Socket Mode または HTTP の `message` および `app_mention` イベントのみです。
  リレー、コマンド、インタラクション、App Home、リアクションイベントリスナー、
  ピン、アクションツール、ネイティブ承認、バインディング、遅延配信、
  プロアクティブ送信は利用できません。リスナーが管理する確認応答、入力中表示、
  ステータスリアクションは `reactions:write` があれば引き続き利用できますが、受信リアクション
  通知およびリアクションアクションツールは利用できません。最小権限のマニフェスト、
  セットアップワークフロー、完全な制限事項については、
  [Enterprise Grid の組織全体インストール](/ja-JP/channels/slack#enterprise-grid-org-wide-installs)
  を参照してください。
- `socketMode` は、Slack SDK Socket Mode のトランスポート調整設定を公開 Bolt レシーバー API に渡します。ping/pong タイムアウトまたは古い WebSocket の動作を調査する場合にのみ使用してください。`clientPingTimeout` のデフォルトは `15000` です。`serverPingTimeout` と `pingPongLoggingEnabled` は、設定されている場合にのみ渡されます。
- `botToken`、`appToken`、`signingSecret`、`userToken` は、プレーンテキスト
  文字列または SecretRef オブジェクトを受け付けます。
- Slack アカウントスナップショットは、`botTokenSource`、`botTokenStatus`、
  `appTokenStatus`、HTTP モードでは `signingSecretStatus` など、
  認証情報ごとのソース／ステータスフィールドを公開します。`configured_unavailable` は、
  アカウントが SecretRef を通じて設定されているものの、現在のコマンド／ランタイムパスでは
  シークレット値を解決できなかったことを意味します。
- `configWrites: false` は、Slack によって開始される設定書き込みをブロックします。
- オプションの `channels.slack.defaultAccount` は、設定済みのアカウント ID と一致する場合、デフォルトアカウントの選択を上書きします。
- `channels.slack.streaming.mode` は、正規の Slack ストリームモードキーです（デフォルトは `"partial"`）。`channels.slack.streaming.nativeTransport` は Slack のネイティブストリーミングトランスポートを制御します（デフォルトは `true`）。従来の `streamMode`、ブール値の `streaming`、`chunkMode`、`blockStreaming`、`blockStreamingCoalesce`、`nativeStreaming` の値はランタイムで読み込まれなくなりました。永続化された設定を `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}` に移行するには、`openclaw doctor --fix` を実行してください。
- `unfurlLinks` と `unfurlMedia` は、ボットの返信について Slack の `chat.postMessage` のリンクおよびメディア展開ブール値を渡します。`unfurlLinks` のデフォルトは `false` であるため、有効にしない限り、送信ボットのリンクはインライン展開されません。`unfurlMedia` は、設定されていない場合は省略されます。1 つのアカウントでトップレベルの値を上書きするには、いずれかの値を `channels.slack.accounts.<accountId>` に設定します。
- 配信先には `user:<id>`（DM）または `channel:<id>` を使用します。

**リアクション通知モード：** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` から）。

**スレッドセッションの分離：** `thread.historyScope` はスレッドごと（デフォルト）、またはチャンネル全体で共有です。`thread.inheritParent` は、親チャンネルのトランスクリプトを新しいスレッドにコピーします。`thread.initialHistoryLimit`（デフォルトは `20`）は、新しいスレッドセッションの開始時に取得する既存スレッドメッセージ数の上限です。`0` にするとスレッド履歴の取得が無効になります。

- Slack ネイティブストリーミングと、Slack アシスタント形式の「入力中...」スレッドステータスには、返信スレッドの宛先が必要です。トップレベルの DM はデフォルトでスレッド外のままなので、スレッド形式のネイティブストリーム／ステータスプレビューを表示する代わりに、Slack の下書き投稿・編集プレビューを通じて引き続きストリーミングできます。
- `typingReaction` は、返信の実行中に受信した Slack メッセージへ一時的なリアクションを追加し、完了時に削除します。`"hourglass_flowing_sand"` のような Slack 絵文字ショートコードを使用してください。
- `channels.slack.execApprovals`：Slack ネイティブの承認クライアント配信と実行承認者の認可です。スキーマは Discord と同じで、`enabled`（`true`／`false`／`"auto"`）、`approvers`（Slack ユーザー ID）、`agentFilter`、`sessionFilter`、`target`（`"dm"`、`"channel"`、`"both"`）です。Slack Plugin の承認者を解決できる場合、Plugin 承認では Slack 発のリクエストにこのネイティブクライアントパスを使用できます。Slack ネイティブの Plugin 承認配信は、Slack 発のセッションまたは Slack の宛先に対して `approvals.plugin` を通じて有効にすることもできます。Plugin 承認では、実行承認者ではなく、`allowFrom` とデフォルトルーティングに基づく Slack Plugin の承認者を使用します。

| アクショングループ | デフォルト | 注記                         |
| ------------------ | ---------- | ---------------------------- |
| reactions          | 有効       | リアクションの追加と一覧表示 |
| messages           | 有効       | 読み取り／送信／編集／削除   |
| pins               | 有効       | ピン留め／解除／一覧表示      |
| memberInfo         | 有効       | メンバー情報                 |
| emojiList          | 有効       | カスタム絵文字一覧           |

### Mattermost

Mattermost は、Discord、Slack、WhatsApp と同様に、別個の Plugin としてインストールします。

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
        native: true, // オプトイン
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // リバースプロキシ／公開デプロイ用の明示的な URL（オプション）
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

チャットモード：`oncall`（@メンション時に応答、デフォルト）、`onmessage`（すべてのメッセージ）、`onchar`（トリガープレフィックスで始まるメッセージ）。

Mattermost のネイティブコマンドを有効にする場合：

- `commands.callbackPath` は完全な URL ではなく、パス（例：`/api/channels/mattermost/command`）である必要があります。
- `commands.callbackUrl` は OpenClaw Gateway エンドポイントに解決され、Mattermost サーバーから到達可能である必要があります。
- ネイティブスラッシュコマンドのコールバックは、スラッシュコマンド登録時に Mattermost から返される
  コマンドごとのトークンで認証されます。登録に失敗した場合、または有効化された
  コマンドがない場合、OpenClaw は
  `Unauthorized: invalid command token.` でコールバックを拒否します。
- プライベート／tailnet／内部のコールバックホストでは、Mattermost の
  `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックのホスト／ドメインを含める必要がある場合があります。
  完全な URL ではなく、ホスト／ドメイン値を使用してください。
- `channels.mattermost.configWrites`：Mattermost によって開始される設定書き込みを許可または拒否します。
- `channels.mattermost.requireMention`：チャンネルで返信する前に `@mention` を必須にします。
- `channels.mattermost.groups.<channelId>.requireMention`：チャンネルごとのメンションゲート上書き（デフォルトには `"*"`）。
- オプションの `channels.mattermost.defaultAccount` は、設定済みのアカウント ID と一致する場合、デフォルトアカウントの選択を上書きします。

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // オプションのアカウントバインディング
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
- `channels.signal.configWrites`：Signal によって開始される設定書き込みを許可または拒否します。
- オプションの `channels.signal.defaultAccount` は、設定済みのアカウント ID と一致する場合、デフォルトアカウントの選択を上書きします。

### iMessage

OpenClaw は `imsg rpc`（stdio 経由の JSON-RPC）を生成します。デーモンやポートは不要です。ホストに Messages データベースと Automation の権限を付与できる場合、新しい OpenClaw iMessage セットアップではこの方法が推奨されます。

BlueBubbles のサポートは削除されました。現在の OpenClaw では、`channels.bluebubbles` はサポート対象のランタイム設定サーフェスではありません。古い設定は `channels.imessage` に移行してください。簡潔な説明については [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage)、完全な変換表については [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles) を参照してください。

Gateway が Messages にサインインしている Mac 上で実行されていない場合は、`channels.imessage.enabled=true` のままにし、`channels.imessage.cliPath` を、その Mac 上で `imsg "$@"` を実行する SSH ラッパーに設定します。デフォルトのローカル `imsg` パスは macOS 専用です。

本番送信で SSH ラッパーを使用する前に、その正確なラッパーを通じて送信 `imsg send` を検証してください。一部の macOS TCC 状態では、Messages Automation が `/usr/libexec/sshd-keygen-wrapper` に割り当てられるため、読み取りやプローブは動作しても、送信が AppleEvents `-1743` で失敗する場合があります。[iMessage](/ja-JP/channels/imessage) の SSH ラッパーに関するトラブルシューティングセクションを参照してください。

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

- オプションの `channels.imessage.defaultAccount` は、設定済みアカウント ID と一致する場合、デフォルトのアカウント選択を上書きします。
- Messages DB へのフルディスクアクセスが必要です。
- `chat_id:<id>` ターゲットを推奨します。チャットを一覧表示するには `imsg chats --limit 20` を使用します。
- `cliPath` には SSH ラッパーを指定できます。SCP で添付ファイルを取得するには `remoteHost`（`host` または `user@host`）を設定します。
- `attachmentRoots` と `remoteAttachmentRoots` は、受信添付ファイルのパスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCP は厳格なホストキー検証を使用するため、リレーホストのキーが `~/.ssh/known_hosts` にすでに存在することを確認してください。
- `channels.imessage.configWrites`: iMessage から開始された設定書き込みを許可または拒否します。
- `channels.imessage.sendTransport`: 通常の送信返信に使用する優先 `imsg` RPC 送信トランスポートです。`auto`（デフォルト）は、IMCore ブリッジが実行中の場合、既存のチャットにはそれを使用し、その後 AppleScript にフォールバックします。`bridge` はプライベート API による配信を必要とし、`applescript` は公開 Messages 自動化パスを強制します。
- `channels.imessage.actions.*`: `imsg status` / `openclaw channels status --probe` によっても制限されるプライベート API アクションを有効にします。
- `channels.imessage.includeAttachments` はデフォルトでオフです。エージェントターンで受信メディアを利用するには、事前に `true` に設定してください。
- ブリッジ/Gateway の再起動後の受信復旧は自動です（GUID 重複排除と古いバックログに対する経過時間制限）。既存の `channels.imessage.catchup.enabled: true` 設定は、非推奨の互換性プロファイルとして引き続き尊重されます。`catchup` はデフォルトで無効です。
- `channels.imessage.groups`: グループレジストリとグループごとの設定です。`groupPolicy: "allowlist"` の場合、グループメッセージがレジストリゲートを通過できるように、明示的な `chat_id` キーまたは `"*"` ワイルドカードエントリを設定します。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリでは、iMessage の会話を永続 ACP セッションにバインドできます。`match.peer.id` には、正規化されたハンドルまたは明示的なチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共有フィールドのセマンティクス: [ACP エージェント](/ja-JP/tools/acp-agents#persistent-channel-bindings)。

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
- `channels.matrix.proxy` は、Matrix の HTTP トラフィックを明示的な HTTP(S) プロキシ経由でルーティングします。名前付きアカウントでは、`channels.matrix.accounts.<id>.proxy` で上書きできます。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` は、プライベート/内部ホームサーバーを許可します。`proxy` とこのネットワークのオプトインは独立した制御です。
- `channels.matrix.defaultAccount` は、複数アカウント設定で優先するアカウントを選択します。
- `channels.matrix.autoJoin` のデフォルトは `"off"` です。そのため、`autoJoinAllowlist` とともに `autoJoin: "allowlist"` を設定するか、`autoJoin: "always"` を設定するまで、招待されたルームと新しい DM 形式の招待は無視されます。
- `channels.matrix.execApprovals`: Matrix ネイティブの exec 承認配信と承認者の認可です。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。auto モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効になります。
  - `approvers`: exec リクエストの承認を許可された Matrix ユーザー ID（例: `@owner:example.org`）。
  - `agentFilter`: オプションのエージェント ID 許可リスト。すべてのエージェントの承認を転送する場合は省略します。
  - `sessionFilter`: オプションのセッションキーパターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）、`"channel"`（発信元ルーム）、または `"both"`。
  - アカウントごとの上書き: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` は、Matrix の DM をセッションにグループ化する方法を制御します。`per-user`（デフォルト）はルーティングされた相手ごとに共有し、`per-room` は各 DM ルームを分離します。
- Matrix のステータスプローブとライブディレクトリ検索では、ランタイムトラフィックと同じプロキシポリシーを使用します。
- Matrix の完全な設定、ターゲット指定ルール、セットアップ例については、[Matrix](/ja-JP/channels/matrix) を参照してください。

### Microsoft Teams

Microsoft Teams は Plugin によって提供され、`channels.msteams` で設定します。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId、appPassword、tenantId、webhook、チーム/チャネルポリシー:
      // /channels/msteams を参照
    },
  },
}
```

- ここで扱うコアキーパス: `channels.msteams`、`channels.msteams.configWrites`。
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

- ここで扱うコアキーパス: `channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- オプションの `channels.irc.defaultAccount` は、設定済みアカウント ID と一致する場合、デフォルトのアカウント選択を上書きします。
- IRC チャネルの完全な設定（ホスト/ポート/TLS/チャネル/許可リスト/メンションゲート）については、[IRC](/ja-JP/channels/irc) を参照してください。

### 複数アカウント（すべてのチャネル）

チャネルごとに複数のアカウントを実行します（それぞれ固有の `accountId` を持ちます）。

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
- 環境変数のトークンは **デフォルト** アカウントにのみ適用されます。
- 基本チャネル設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- 各アカウントを別のエージェントにルーティングするには、`bindings[].match.accountId` を使用します。
- 単一アカウントのトップレベルチャネル設定を使用中に、`openclaw channels add`（またはチャネルのオンボーディング）でデフォルト以外のアカウントを追加すると、OpenClaw はまずアカウントスコープのトップレベル単一アカウント値をチャネルのアカウントマップに昇格させ、元のアカウントが引き続き動作するようにします。ほとんどのチャネルでは、それらを `channels.<channel>.accounts.default` に移動します。Matrix では、既存の一致する名前付き/デフォルトターゲットを代わりに維持できます。
- 既存のチャネルのみのバインディング（`accountId` なし）は引き続きデフォルトアカウントに一致します。アカウントスコープのバインディングは引き続きオプションです。
- `openclaw doctor --fix` も、アカウントスコープのトップレベル単一アカウント値を、そのチャネル用に選択された昇格先アカウントへ移動することで、混在した構造を修復します。ほとんどのチャネルでは `accounts.default` を使用します。Matrix では、既存の一致する名前付き/デフォルトターゲットを代わりに維持できます。

### その他の Plugin チャネル

多くの Plugin チャネルは `channels.<id>` として設定され、それぞれ専用のチャネルページで説明されています（例: Feishu、LINE、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Twitch、Zalo）。
チャネルの完全な一覧については、[チャネル](/ja-JP/channels) を参照してください。

### グループチャットのメンションゲート

グループメッセージはデフォルトで **メンション必須** です（メタデータのメンションまたは安全な正規表現パターン）。WhatsApp、Telegram、Discord、Google Chat、iMessage のグループチャットに適用されます。

表示される返信は別途制御されます。通常のグループ、チャネル、内部 WebChat の直接リクエストでは、デフォルトで最終応答が自動配信されます。つまり、アシスタントの最終テキストが従来の表示返信パスを通じて投稿されます。表示出力をエージェントが `message(action=send)` を呼び出した後にのみ投稿する場合は、`messages.visibleReplies: "message_tool"` または `messages.groupChat.visibleReplies: "message_tool"` をオプトインします。オプトインしたツール専用モードで、モデルがメッセージツールを呼び出さずに実質的な最終回答を返した場合、その最終テキストは非公開のままとなり、Gateway の詳細ログには抑制されたペイロードのメタデータが記録され、OpenClaw は同じ返信を `message(action=send)` 経由で配信するようモデルに求める復旧再試行を 1 回キューに追加します。

ツール専用の表示返信には、ツールを確実に呼び出すモデル/ランタイムが必要であり、GPT-5.6 Sol などの最新世代モデルを使用する共有アンビエントルームに推奨されます。一部の能力が低いモデルは最終テキストでは回答できますが、送信元に表示される出力を `message(action=send)` で送信する必要があることを理解できない場合があります。OpenClaw は、最終応答が実質的であり、送信元ターンがルームイベントではなく、送信ポリシーが配信を拒否しておらず、送信元への返信がまだ送信されていない場合に限り、一般的な取り残された最終応答をデフォルトで復旧します。復旧は 1 回の再試行に制限されます。合成された再試行プロンプトの永続化を抑制し、その再試行を収集バッチ処理の対象外にすることで、無関係なキュー済みプロンプトとの統合を防ぎます。再試行でも取り残されるか、キューに追加できない場合、OpenClaw は「返信を生成しましたが、このチャットに配信できませんでした。もう一度お試しください。」などのサニタイズ済み診断のみを配信します。元の非公開の最終テキストが、送信元への自動配信対象としてマークされることはありません。繰り返し返信を取り残すモデルでは、`"automatic"` を使用してアシスタントの最終ターンを表示返信パスにするか、より強力なツール呼び出しモデルに切り替えるか、Gateway の詳細ログで抑制されたペイロードの概要を確認するか、`messages.groupChat.visibleReplies: "automatic"` を設定してすべてのグループ/チャネルリクエストで表示される最終返信を使用してください。

アクティブなツールポリシーでメッセージツールが利用できない場合、OpenClaw は応答を暗黙に抑制するのではなく、表示返信の自動配信にフォールバックします。`openclaw doctor` はこの不一致について警告します。

このルールは、通常のエージェントの最終テキストに適用されます。Plugin が所有する会話バインディングでは、要求されたバインド済みスレッドのターンに対し、所有 Plugin が返した返信を表示応答として使用します。こうしたバインディング返信では、Plugin が `message(action=send)` を呼び出す必要はありません。

**トラブルシューティング: グループの @メンションで入力中表示の後に沈黙する（エラーなし）**

症状: グループ/チャネルでの @メンションにより入力中インジケーターが表示され、Gateway ログには `dispatch complete (queuedFinal=false, replies=0)` と記録されますが、ルームにはメッセージが届きません。同じエージェントへの DM には通常どおり返信されます。

原因: グループ/チャネルの表示返信モードが `"message_tool"` に解決されるため、OpenClaw はターンを実行しますが、エージェントが `message(action=send)` を呼び出さない限り、アシスタントの最終テキストを抑制します。このモードに `NO_REPLY` 契約はありません。メッセージツールの呼び出しがなければ、元の最終テキストは非公開になります。実質的な送信元ターンに対して、OpenClaw は現在、ガード付きの復旧再試行を 1 回試みます。短いメモ、明示的な沈黙、ルームイベント、送信ポリシーで拒否されたターン、すでに配信済みのターンは再試行されません。通常のグループおよびチャネルターンのデフォルトは `"automatic"` であるため、この症状は `messages.groupChat.visibleReplies`（またはグローバルの `messages.visibleReplies`）が明示的に `"message_tool"` に設定されている場合にのみ発生します。ハーネスの `defaultVisibleReplies` はここには適用されません。グループ/チャネルのリゾルバーはこれを無視し、直接/送信元チャットにのみ影響します（Codex ハーネスはこの方法で直接チャットの最終応答を抑制します）。

修正方法: より強力なツール呼び出し対応モデルを選択するか、明示的な `"message_tool"` オーバーライドを削除して `"automatic"` のデフォルトにフォールバックするか、`messages.groupChat.visibleReplies: "automatic"` を設定して、すべてのグループ/チャンネルリクエストで可視返信を強制します。内容のある未配信の最終応答が、サイレント成功として終了することはなくなりました。1 回の `message(action=send)` 再試行で復旧するか、サニタイズされた配信失敗診断を表示します。ファイルの保存後、Gateway は `messages` 設定をホットリロードします。デプロイ環境でファイル監視または設定リロードが無効になっている場合にのみ、Gateway を再起動してください。

**メンションの種類:**

- **メタデータメンション**: プラットフォームネイティブの @メンション。WhatsApp のセルフチャットモードでは無視されます。
- **テキストパターン**: `agents.list[].groupChat.mentionPatterns` 内の安全な正規表現パターン。無効なパターンと安全でないネストされた繰り返しは無視されます。
- メンションゲーティングは、検出が可能な場合（ネイティブメンション、または少なくとも 1 つのパターンがある場合）にのみ適用されます。

```json5
{
  messages: {
    visibleReplies: "automatic", // ダイレクト/送信元チャットで従来の自動最終返信を強制
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // 常時有効な、メンションなしのルーム内会話を静かなコンテキストにする
      visibleReplies: "message_tool", // オプトイン。可視のルーム返信には message(action=send) を必須にする
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` はグローバルデフォルトを設定します。チャンネルでは `channels.<channel>.historyLimit`（またはアカウント単位）でオーバーライドできます。無効にするには `0` を設定します。

`messages.groupChat.unmentionedInbound: "room_event"` は、対応チャンネルにおいて、メンションなしの常時有効なグループ/チャンネルメッセージを静かなルームコンテキストとして送信します。メンション付きメッセージ、コマンド、ダイレクトメッセージは引き続きユーザーリクエストとして扱われます。Discord、Slack、Telegram の完全な例については、[アンビエントルームイベント](/ja-JP/channels/ambient-room-events)を参照してください。

`messages.visibleReplies` は送信元イベントのグローバルデフォルトです。`messages.groupChat.visibleReplies` は、グループ/チャンネルの送信元イベントについてこれをオーバーライドします。`messages.visibleReplies` が未設定の場合、ダイレクト/送信元チャットでは選択されたランタイムまたはハーネスのデフォルトが使用されますが、内部 WebChat のダイレクトターンでは、Pi/Codex のプロンプト整合性のために自動最終配信が使用されます。可視出力に `message(action=send)` を意図的に必須とするには、`messages.visibleReplies: "message_tool"` を設定します。イベントを処理するかどうかは、引き続きチャンネルの許可リストとメンションゲーティングによって決まります。

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

解決順序: DM 単位のオーバーライド → プロバイダーのデフォルト → 上限なし（すべて保持）。

このリゾルバーは、セッションキーが標準の `provider:direct:<id>`（または旧形式の `provider:dm:<id>`）に従う任意のチャンネルについて、`channels.<provider>.dmHistoryLimit` と `channels.<provider>.dms.<id>.historyLimit` を読み取ります。そのため、固定されたチャンネル一覧だけでなく、バンドル済みチャンネルと Plugin チャンネルの両方で機能します。

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
    nativeSkills: "auto", // 対応している場合にネイティブ Skills コマンドを登録
    text: true, // チャットメッセージ内の /commands を解析
    bash: false, // ! を許可（エイリアス: /bash）
    bashForegroundMs: 2000,
    config: false, // /config を許可
    mcp: false, // /mcp を許可
    plugins: false, // /plugins を許可
    debug: false, // /debug を許可
    restart: true, // /restart と Gateway 再起動ツールを許可
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

- このブロックはコマンドサーフェスを設定します。現在の組み込みおよびバンドル済みコマンドのカタログについては、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。
- このページは完全なコマンドカタログではなく、**設定キーのリファレンス**です。QQ Bot の `/bot-ping`、`/bot-help`、`/bot-logs`、LINE の `/card`、デバイスペアリングの `/pair`、メモリの `/dreaming`、電話制御の `/phone`、Talk の `/voice` など、チャンネル/Plugin が所有するコマンドについては、各チャンネル/Plugin のページと[スラッシュコマンド](/ja-JP/tools/slash-commands)で説明しています。
- テキストコマンドは、先頭が `/` の**単独の**メッセージである必要があります。
- `native: "auto"` は Discord/Telegram のネイティブコマンドを有効にし、Slack では無効のままにします。
- `nativeSkills: "auto"` は Discord/Telegram のネイティブ Skills コマンドを有効にし、Slack では無効のままにします。
- チャンネルごとにオーバーライドするには、`channels.discord.commands.native`（真偽値または `"auto"`）を使用します。Discord では、`false` にすると起動時のネイティブコマンドの登録とクリーンアップをスキップします。
- チャンネルごとのネイティブ Skills 登録は、`channels.<provider>.commands.nativeSkills` でオーバーライドします。
- `channels.telegram.customCommands` は、Telegram ボットのメニューエントリを追加します。
- `bash: true` は、ホストシェル用の `! <cmd>` を有効にします。`tools.elevated.enabled` が有効であり、送信者が `tools.elevated.allowFrom.<channel>` に含まれている必要があります。
- `config: true` は `/config`（`openclaw.json` の読み取り/書き込み）を有効にします。Gateway の `chat.send` クライアントでは、永続的な `/config set|unset` の書き込みには `operator.admin` も必要です。読み取り専用の `/config show` は、通常の書き込みスコープを持つオペレータークライアントでも引き続き使用できます。
- `mcp: true` は、`mcp.servers` 配下の OpenClaw 管理 MCP サーバー設定用の `/mcp` を有効にします。
- `plugins: true` は、Plugin の検出、インストール、有効化/無効化の制御用の `/plugins` を有効にします。
- `channels.<provider>.configWrites` は、チャンネルごとの設定変更を制御します（デフォルト: true）。
- マルチアカウントチャンネルでは、`channels.<provider>.accounts.<id>.configWrites` も、そのアカウントを対象とする書き込み（例: `/allowlist --config --account <id>` または `/config set channels.<provider>.accounts.<id>...`）を制御します。
- `restart: false` は `/restart` と Gateway 再起動ツールのアクションを無効にします。デフォルト: `true`。
- `ownerAllowFrom` は、所有者専用コマンドと所有者によって制限されるチャンネルアクションの明示的な所有者許可リストです。これは `allowFrom` とは別です。
- `ownerDisplay: "hash"` は、システムプロンプト内の所有者 ID をハッシュ化します。ハッシュ化を制御するには `ownerDisplaySecret` を設定します。
- `allowFrom` はプロバイダーごとに設定します。設定されている場合、これが**唯一の**認可ソースになります（チャンネルの許可リスト/ペアリングと `useAccessGroups` は無視されます）。
- `useAccessGroups: false` は、`allowFrom` が設定されていない場合に、コマンドがアクセスグループポリシーを迂回できるようにします。
- コマンドドキュメントの対応表:
  - 組み込みおよびバンドル済みカタログ: [スラッシュコマンド](/ja-JP/tools/slash-commands)
  - チャンネル固有のコマンドサーフェス: [チャンネル](/ja-JP/channels)
  - QQ Bot コマンド: [QQ Bot](/ja-JP/channels/qqbot)
  - ペアリングコマンド: [ペアリング](/ja-JP/channels/pairing)
  - LINE カードコマンド: [LINE](/ja-JP/channels/line)
  - メモリの Dreaming: [Dreaming](/ja-JP/concepts/dreaming)

</Accordion>

---

## 関連項目

- [設定リファレンス](/ja-JP/gateway/configuration-reference) — トップレベルキー
- [設定 — エージェント](/ja-JP/gateway/config-agents)
- [チャンネルの概要](/ja-JP/channels)
