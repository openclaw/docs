---
read_when:
    - OpenClaw を初めてセットアップする
    - 一般的な設定パターンを探す
    - 特定の設定セクションへの移動
summary: 設定の概要：一般的なタスク、クイックセットアップ、完全なリファレンスへのリンク
title: 設定
x-i18n:
    generated_at: "2026-07-12T14:27:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 18717d03bb923d90725b263e064f932ac30006d21f4b1b1bd98a4e39f1c92cff
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw は、`~/.openclaw/openclaw.json` から任意の <Tooltip tip="JSON5 はコメントと末尾のカンマをサポートします">**JSON5**</Tooltip> 設定を読み取ります。ファイルが存在しない場合、OpenClaw は安全なデフォルト値を使用します。

有効な設定パスは通常のファイルである必要があります。OpenClaw による書き込みでは、ファイルがアトミックに置換される（パス上にリネームされる）ため、シンボリックリンクされた `openclaw.json` では、リンク先への書き込みではなくリンク先自体の置換が行われます。シンボリックリンクを使用した設定レイアウトは避けてください。設定をデフォルトの状態ディレクトリ外に保持する場合は、`OPENCLAW_CONFIG_PATH` が実ファイルを直接指すようにしてください。

設定を追加する一般的な理由は次のとおりです。

- チャンネルを接続し、ボットにメッセージを送信できるユーザーを制御する
- モデル、ツール、サンドボックス化、または自動化（cron、フック）を設定する
- セッション、メディア、ネットワーク、または UI を調整する

利用可能なすべてのフィールドについては、[完全なリファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

エージェントと自動化では、設定を編集する前に、フィールド単位の正確な
ドキュメントを確認するため `config.schema.lookup` を使用してください。このページはタスク指向のガイダンスに使用し、
より広範なフィールド一覧とデフォルト値については
[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

<Tip>
**設定を初めて行いますか？** 対話形式でセットアップするには `openclaw onboard` から始めるか、完全なコピー＆ペースト可能な設定について[設定例](/ja-JP/gateway/configuration-examples)ガイドを確認してください。
</Tip>

## 最小構成

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## 設定の編集

<Tabs>
  <Tab title="対話形式のウィザード">
    ```bash
    openclaw onboard       # 完全なオンボーディングフロー
    openclaw configure     # 設定ウィザード
    ```
  </Tab>
  <Tab title="CLI（ワンライナー）">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="コントロール UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) を開き、**設定**タブを使用します。
    コントロール UI は、ライブ設定スキーマからフォームをレンダリングします。利用可能な場合は、
    フィールドの `title` / `description` ドキュメントメタデータ、Plugin、およびチャンネルのスキーマも含まれ、
    非常手段として **Raw JSON** エディターも用意されています。詳細表示
    UI やその他のツール向けに、Gateway は `config.schema.lookup` も公開しており、
    1 つのパススコープのスキーマノードと、その直下の子の概要を取得できます。
  </Tab>
  <Tab title="直接編集">
    `~/.openclaw/openclaw.json` を直接編集します。Gateway はファイルを監視し、変更を自動的に適用します（[ホットリロード](#config-hot-reload)を参照）。
  </Tab>
</Tabs>

## 厳格な検証

<Warning>
OpenClaw は、スキーマに完全に一致する設定のみを受け入れます。不明なキー、不正な型、または無効な値があると、Gateway は**起動を拒否します**。ルートレベルで唯一の例外は `$schema`（文字列）であり、エディターが JSON Schema メタデータを付加できるようにするためのものです。
</Warning>

`openclaw config schema` は、コントロール UI と検証で使用される正規の JSON Schema を出力します。
`config.schema.lookup` は、詳細表示ツール向けに、パススコープの単一ノードと
その子の概要を取得します。フィールドの `title`/`description` ドキュメントメタデータは、
ネストされたオブジェクト、ワイルドカード（`*`）、配列項目（`[]`）、および `anyOf`/
`oneOf`/`allOf` の分岐にも引き継がれます。マニフェストレジストリが読み込まれると、
実行時の Plugin とチャンネルのスキーマが統合されます。

検証に失敗した場合:

- Gateway は起動しません
- 診断コマンドのみ動作します（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 正確な問題を確認するには `openclaw doctor` を実行します
- 修復を適用するには `openclaw doctor --fix`（`--repair` は同じフラグです。`--yes` はプロンプトをスキップします）を実行します

Gateway は起動に成功するたびに、信頼済みの最終正常設定のコピーを保持しますが、
起動時およびホットリロード時には自動復元されません。復元するのは `openclaw doctor --fix`
のみです。`openclaw.json` の検証に失敗した場合（Plugin 内の検証を含む）、Gateway の
起動は失敗するか、リロードがスキップされ、現在のランタイムは最後に受け入れられた
設定を維持します。拒否された書き込みも、確認用に `<path>.rejected.<timestamp>` として保存されます。
Gateway は、誤って上書きしたように見える書き込みをブロックします。具体的には、`gateway.mode` の削除、
`meta` ブロックの欠落、またはファイルサイズが半分未満に縮小する場合です。ただし、書き込みで
破壊的な変更が明示的に許可されている場合を除きます。候補に `***` や `[redacted]` などの
秘匿化されたシークレットのプレースホルダーが含まれる場合、最終正常設定への昇格はスキップされます。

## 一般的なタスク

<AccordionGroup>
  <Accordion title="チャンネル（WhatsApp、Telegram、Discord など）をセットアップする">
    各チャンネルには、`channels.<provider>` の下に独自の設定セクションがあります。セットアップ手順については、各チャンネル専用ページを参照してください。

    - [Discord](/ja-JP/channels/discord) - `channels.discord`
    - [Feishu](/ja-JP/channels/feishu) - `channels.feishu`
    - [Google Chat](/ja-JP/channels/googlechat) - `channels.googlechat`
    - [iMessage](/ja-JP/channels/imessage) - `channels.imessage`
    - [Mattermost](/ja-JP/channels/mattermost) - `channels.mattermost`
    - [Microsoft Teams](/ja-JP/channels/msteams) - `channels.msteams`
    - [Signal](/ja-JP/channels/signal) - `channels.signal`
    - [Slack](/ja-JP/channels/slack) - `channels.slack`
    - [Telegram](/ja-JP/channels/telegram) - `channels.telegram`
    - [WhatsApp](/ja-JP/channels/whatsapp) - `channels.whatsapp`

    すべてのチャンネルは、同じ DM ポリシーのパターンを共有します。

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // ペアリング | 許可リスト | オープン | 無効
          allowFrom: ["tg:123"], // 許可リスト/オープンの場合のみ
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="モデルを選択して設定する">
    プライマリモデルと任意のフォールバックを設定します。

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` はモデルカタログを定義し、`/model` の許可リストとして機能します。`provider/*` エントリは、動的なモデル検出を引き続き使用しながら、`/model`、`/models`、およびモデル選択 UI を選択したプロバイダーに絞り込みます。
    - 既存のモデルを削除せずに許可リストのエントリを追加するには、`openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使用します。エントリを削除することになる単純な置換は、`--replace` を指定しない限り拒否されます。
    - モデル参照では `provider/model` 形式を使用します（例: `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` は、トランスクリプト/ツール画像の縮小を制御します（デフォルトは `1200`）。値を小さくすると、通常、スクリーンショットが多い実行でのビジョントークン使用量が減少します。
    - チャット内でモデルを切り替える方法については[モデル CLI](/ja-JP/concepts/models)を、認証のローテーションとフォールバック動作については[モデルのフェイルオーバー](/ja-JP/concepts/model-failover)を参照してください。
    - カスタム/セルフホスト型プロバイダーについては、リファレンスの[カスタムプロバイダー](/ja-JP/gateway/config-tools#custom-providers-and-base-urls)を参照してください。

  </Accordion>

  <Accordion title="ボットにメッセージを送信できるユーザーを制御する">
    DM アクセスは、チャンネルごとに `dmPolicy`（デフォルトは `"pairing"`）で制御します。

    - `"pairing"`: 不明な送信者には、承認用のワンタイムペアリングコードが送られます
    - `"allowlist"`: `allowFrom`（またはペアリング済み許可ストア）に含まれる送信者のみ
    - `"open"`: 受信するすべての DM を許可します（`allowFrom: ["*"]` が必要）
    - `"disabled"`: すべての DM を無視します

    グループには、`groupPolicy`（`"allowlist" | "open" | "disabled"`）と、`groupAllowFrom` またはチャンネル固有の許可リストを使用します。

    チャンネルごとの詳細については、[完全なリファレンス](/ja-JP/gateway/config-channels#dm-and-group-access)を参照してください。

  </Accordion>

  <Accordion title="グループチャットのメンションゲーティングをセットアップする">
    グループメッセージでは、デフォルトで**メンションが必須**です。エージェントごとにトリガーパターンを設定します。通常のグループ/チャンネルへの返信は自動的に投稿されます。エージェントが発言するタイミングを判断すべき共有ルームでは、メッセージツール経由の処理を有効にします。

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // すべての場所でメッセージツールによる送信を必須にするには "message_tool" を設定
        groupChat: {
          visibleReplies: "message_tool", // オプトイン。可視出力には message(action=send) が必要
          unmentionedInbound: "room_event", // メンションなしの常時グループ会話は、発言しないコンテキストとして扱う
        },
      },
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **メタデータメンション**: ネイティブの @メンション（WhatsApp のタップによるメンション、Telegram の @bot など）
    - **テキストパターン**: `mentionPatterns` 内の安全な正規表現パターン
    - **可視返信**: `messages.visibleReplies` でメッセージツールによる送信をグローバルに必須にできます。`messages.groupChat.visibleReplies` は、グループ/チャンネルに対してその設定を上書きします。
    - 可視返信モード、チャンネルごとの上書き、および自分自身とのチャットモードについては、[完全なリファレンス](/ja-JP/gateway/config-channels#group-chat-mention-gating)を参照してください。

  </Accordion>

  <Accordion title="エージェントごとに Skills を制限する">
    共有ベースラインには `agents.defaults.skills` を使用し、特定の
    エージェントについては `agents.list[].skills` で上書きします。

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // github、weather を継承
          { id: "docs", skills: ["docs-search"] }, // デフォルトを置換
          { id: "locked-down", skills: [] }, // Skills なし
        ],
      },
    }
    ```

    - デフォルトで Skills を制限しない場合は、`agents.defaults.skills` を省略します。
    - デフォルトを継承するには、`agents.list[].skills` を省略します。
    - Skills を使用しない場合は、`agents.list[].skills: []` を設定します。
    - [Skills](/ja-JP/tools/skills)、[Skills の設定](/ja-JP/tools/skills-config)、および
      [設定リファレンス](/ja-JP/gateway/config-agents#agents-defaults-skills)を参照してください。

  </Accordion>

  <Accordion title="Gateway のチャンネル健全性監視を調整する">
    古くなったように見えるチャンネルを Gateway が再起動する積極度を制御します。

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - 表示されている値はデフォルトです。健全性監視による再起動をグローバルに無効にするには、`gateway.channelHealthCheckMinutes: 0` を設定します。
    - `channelStaleEventThresholdMinutes` は、チェック間隔以上にする必要があります。
    - グローバル監視を無効にせず、1 つのチャンネルまたはアカウントの自動再起動を無効にするには、`channels.<provider>.healthMonitor.enabled` または `channels.<provider>.accounts.<id>.healthMonitor.enabled` を使用します。
    - 運用上のデバッグについては[健全性チェック](/ja-JP/gateway/health)を、すべてのフィールドについては[完全なリファレンス](/ja-JP/gateway/configuration-reference#gateway)を参照してください。

  </Accordion>

  <Accordion title="Gateway の WebSocket ハンドシェイクタイムアウトを調整する">
    負荷が高い、または低性能なホスト上で、ローカルクライアントが認証前の WebSocket ハンドシェイクを
    完了するための時間を延長します。

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - デフォルトは `15000` ミリ秒です。
    - 一時的なサービスまたはシェルの上書きでは、引き続き `OPENCLAW_HANDSHAKE_TIMEOUT_MS` が優先されます。
    - まず起動時またはイベントループの停止を修正することを推奨します。この設定は、正常ではあるもののウォームアップ中に遅いホスト向けです。

  </Accordion>

  <Accordion title="セッションとリセットを設定する">
    セッションは会話の継続性と分離を制御します。

    ```json5
    {
      session: {
    ```
    ```json5
        dmScope: "per-channel-peer",  // 複数ユーザー向けに推奨
    ```
    ```json5
        threadBindings: {
    ```
    ```json5
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
    ```
    ```json5
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```
    - `dmScope`: `main`（共有）| `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: スレッドに紐づくセッションルーティングのグローバルデフォルトです。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`を使用して、セッションごとに紐づけ、紐づけ解除、一覧表示、調整を行います（Discordはスレッド、Telegramはトピック/会話を紐づけます）。
    - スコープ、IDリンク、送信ポリシーについては、[セッション管理](/ja-JP/concepts/session)を参照してください。
    - すべてのフィールドについては、[完全なリファレンス](/ja-JP/gateway/config-agents#session)を参照してください。

  </Accordion>

  <Accordion title="サンドボックス化を有効にする">
    エージェントセッションを分離されたサンドボックスランタイムで実行します。

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    まずイメージをビルドします。ソースチェックアウトからは`scripts/sandbox-setup.sh`を実行し、npmインストールからは[サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup)に記載されたインラインの`docker build`コマンドを参照してください。

    すべてのオプションについては、完全なガイドである[サンドボックス化](/ja-JP/gateway/sandboxing)と[完全なリファレンス](/ja-JP/gateway/config-agents#agentsdefaultssandbox)を参照してください。

  </Accordion>

  <Accordion title="公式 iOS ビルドでリレー経由のプッシュを有効にする">
    公開 App Store ビルドのリレー経由プッシュでは、ホストされている OpenClaw リレー `https://ios-push-relay.openclaw.ai` を使用します。

    カスタムリレーをデプロイするには、リレー URL が Gateway のリレー URL と一致する、意図的に分離された iOS ビルド／デプロイパスが必要です。カスタムリレービルドを使用している場合は、Gateway 設定で次のように指定します。

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // 任意。デフォルト: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    CLI での同等の設定:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    この設定の動作:

    - Gateway が外部リレー経由で `push.test`、ウェイクナッジ、再接続ウェイクを送信できるようにします。
    - ペアリングされた iOS アプリから転送される、登録単位の送信権限を使用します。Gateway にデプロイ全体で共有するリレートークンは必要ありません。
    - リレーを使用する各登録を、iOS アプリがペアリングした Gateway の ID に紐付けるため、別の Gateway は保存済みの登録を再利用できません。
    - ローカルまたは手動の iOS ビルドでは、引き続き APNs に直接送信します。リレー経由の送信は、リレーを通じて登録された公式配布ビルドにのみ適用されます。
    - 登録トラフィックと送信トラフィックが同じリレーデプロイに到達するように、iOS ビルドに組み込まれたリレーのベース URL と一致している必要があります。

    エンドツーエンドのフロー:

    1. 公式 iOS アプリをインストールします。
    2. 任意: 意図的に別のカスタムリレービルドを使用する場合に限り、Gateway で `gateway.push.apns.relay.baseUrl` を設定します。
    3. iOS アプリを Gateway とペアリングし、Node セッションとオペレーターセッションの両方を接続します。
    4. iOS アプリは Gateway の ID を取得し、App Attest とアプリのレシートを使用してリレーに登録してから、リレーを使用する `push.apns.register` ペイロードをペアリング済みの Gateway に公開します。
    5. Gateway はリレーハンドルと送信権限を保存し、それらを `push.test`、ウェイクナッジ、再接続ウェイクに使用します。

    運用上の注意:

    - iOS アプリを別の Gateway に切り替えた場合は、その Gateway に紐付けられた新しいリレー登録を公開できるよう、アプリを再接続してください。
    - 別のリレーデプロイを参照する新しい iOS ビルドを配布すると、アプリは古いリレーオリジンを再利用せず、キャッシュ済みのリレー登録を更新します。

    互換性に関する注意:

    - `OPENCLAW_APNS_RELAY_BASE_URL` と `OPENCLAW_APNS_RELAY_TIMEOUT_MS` は、一時的な環境変数によるオーバーライドとして引き続き機能します。
    - カスタム Gateway リレー URL は、iOS ビルドに組み込まれたリレーのベース URL と一致する必要があります。公開 App Store リリースレーンでは、カスタム iOS リレー URL のオーバーライドは拒否されます。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` は引き続き、ループバック限定の開発用エスケープハッチです。HTTP リレー URL を設定に永続化しないでください。

    エンドツーエンドのフローについては [iOS アプリ](/ja-JP/platforms/ios#relay-backed-push-for-official-builds) を、リレーのセキュリティモデルについては [認証と信頼のフロー](/ja-JP/platforms/ios#authentication-and-trust-flow) を参照してください。

  </Accordion>

  <Accordion title="Heartbeat（定期チェックイン）を設定する">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: 期間を表す文字列（`30m`、`2h`）。無効にするには `0m` を設定します。デフォルト: `30m`。
    - `target`: `last` | `none` | `<channel-id>`（例: `discord`、`matrix`、`telegram`、`whatsapp`）
    - `directPolicy`: DM 形式の Heartbeat ターゲットに対して `allow`（デフォルト）または `block`
    - 詳細なガイドについては [Heartbeat](/ja-JP/gateway/heartbeat) を参照してください。

  </Accordion>

  <Accordion title="Cron ジョブを設定する">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // デフォルト。cron のディスパッチ + 分離された cron エージェントターンの実行
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: 完了した分離実行セッションを SQLite のセッション行から削除します（デフォルトは `24h`。無効にするには `false` を設定）。
    - `runLog`: ジョブごとに保持される cron 実行履歴行を削除します。履歴は SQLite に保存されます。`maxBytes`（デフォルトは `2_000_000`）は以前のファイルベースの実行ログとの互換性のために保持されており、`keepLines` のデフォルトは `2000` です。
    - 機能の概要と CLI の例については、[Cron ジョブ](/ja-JP/automation/cron-jobs)を参照してください。

  </Accordion>

  <Accordion title="Webhook（フック）を設定する">
    Gateway で HTTP Webhook エンドポイントを有効にします。

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    セキュリティ上の注意:
    - すべてのフック/Webhook ペイロードの内容を信頼できない入力として扱ってください。
    - 専用の `hooks.token` を使用し、有効な Gateway 認証シークレット（`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`）を再利用しないでください。
    - フック認証はヘッダーのみです（`Authorization: Bearer ...` または `x-openclaw-token`）。クエリ文字列のトークンは拒否されます。
    - `hooks.path` に `/` は指定できません。Webhook の受信には `/hooks` などの専用サブパスを使用してください。
    - 厳密に範囲を限定したデバッグを行う場合を除き、安全でないコンテンツのバイパスフラグ（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`）は無効のままにしてください。
    - `hooks.allowRequestSessionKey` を有効にする場合は、呼び出し元が選択できるセッションキーを制限するため、`hooks.allowedSessionKeyPrefixes` も設定してください。
    - フック駆動のエージェントには、強力で最新のモデル階層と厳格なツールポリシー（たとえば、可能な場合はメッセージングのみに制限し、サンドボックス化を併用）を推奨します。

    すべてのマッピングオプションと Gmail 連携については、[完全なリファレンス](/ja-JP/gateway/configuration-reference#hooks)を参照してください。

  </Accordion>

  <Accordion title="マルチエージェントルーティングを設定する">
    個別のワークスペースとセッションを持つ、複数の分離されたエージェントを実行します。

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

    バインディングルールとエージェントごとのアクセスプロファイルについては、[マルチエージェント](/ja-JP/concepts/multi-agent)と[完全なリファレンス](/ja-JP/gateway/config-agents#multi-agent-routing)を参照してください。

  </Accordion>

  <Accordion title="設定を複数のファイルに分割する（$include）">
    `$include` を使用して大規模な設定を整理します。

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **単一ファイル**: それを含むオブジェクトを置き換えます
    - **ファイルの配列**: 順番にディープマージされます（後の値が優先）。ネストは最大 10 階層です
    - **兄弟キー**: include の後にマージされます（include された値を上書き）
    - **相対パス**: include 元ファイルを基準に解決されます
    - **パス形式**: include パスに null バイトを含めることはできず、解決前と解決後の両方で 4096 文字未満である必要があります
    - **OpenClaw による書き込み**: `plugins: { $include: "./plugins.json5" }` のように、
      単一ファイルの include に対応する最上位セクションを 1 つだけ変更する書き込みの場合、
      OpenClaw はその include されたファイルを更新し、`openclaw.json` は変更しません
    - **サポートされていない書き込みの透過処理**: ルート include、include 配列、および
      兄弟による上書きがある include については、OpenClaw による書き込み時に設定を
      フラット化せず、フェイルクローズします
    - **制限**: `$include` パスは、`openclaw.json` を保持するディレクトリの配下に
      解決される必要があります。複数のマシンまたはユーザー間でツリーを共有するには、
      include が参照できる追加ディレクトリのパスリスト（POSIX では `:`、Windows では `;`）を
      `OPENCLAW_INCLUDE_ROOTS` に設定します。シンボリックリンクは解決後に再確認されるため、
      字句上は設定ディレクトリ内にあるパスでも、実際の参照先が許可されたすべてのルートの
      外部にある場合は拒否されます。
    - **エラー処理**: ファイルの欠落、解析エラー、循環 include、無効なパス形式、長さ超過に対して明確なエラーを示します

  </Accordion>
</AccordionGroup>

## 設定のホットリロード

Gateway は `~/.openclaw/openclaw.json` を監視し、変更を自動的に適用します。ほとんどの設定では手動で再起動する必要はありません。

ファイルを直接編集した場合、検証が完了するまでは信頼できないものとして扱われます。ウォッチャーは、
エディターによる一時ファイルへの書き込みや名前変更が収まるのを待ってから最終的なファイルを読み取り、
無効な外部編集を `openclaw.json` に書き戻すことなく拒否します。OpenClaw による設定の
書き込みも、書き込み前に同じスキーマゲートを使用します（すべての書き込みに適用される上書き/ロールバックの
ルールについては、[厳格な検証](#strict-validation)を参照してください）。

`config reload skipped (invalid config)` が表示される場合、または起動時に `Invalid
config` と報告される場合は、設定を確認し、`openclaw config validate` を実行してから、修復のために `openclaw
doctor --fix` を実行してください。チェックリストについては、[Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-rejected-invalid-config)
を参照してください。

### リロードモード

| モード                 | 動作                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| **`hybrid`**（デフォルト） | 安全な変更を即座にホット適用します。重要な変更では自動的に再起動します。                       |
| **`hot`**              | 安全な変更のみをホット適用します。再起動が必要な場合は警告をログに記録します。再起動は手動で行います。 |
| **`restart`**          | 安全かどうかにかかわらず、設定が変更されるたびに Gateway を再起動します。                    |
| **`off`**              | ファイル監視を無効にします。変更は次回の手動再起動時に反映されます。                           |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ホット適用される変更と再起動が必要な変更

ほとんどのフィールドはダウンタイムなしでホット適用されます。一部のホット適用対象セクションでは、Gateway 全体ではなく、そのサブシステム（チャンネル、Cron、Heartbeat、ヘルスモニター）のみが再起動されます。`hybrid` モードでは、Gateway の再起動が必要な変更は自動的に処理されます。

| カテゴリ            | フィールド                                                                  | Gateway の再起動が必要か？      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| チャンネル            | `channels.*`、`web`（WhatsApp）- すべての組み込みチャンネルおよび Plugin チャンネル       | いいえ（該当チャンネルを再起動）   |
| エージェントとモデル      | `agent`、`agents`、`models`、`routing`                                  | いいえ                           |
| 自動化          | `hooks`、`cron`、`agent.heartbeat`                                      | いいえ（該当サブシステムを再起動） |
| セッションとメッセージ | `session`、`messages`                                                   | いいえ                           |
| ツールとメディア       | `tools`、`skills`、`mcp`、`audio`、`talk`                               | いいえ                           |
| Plugin 設定       | `plugins.entries.*`、`plugins.allow`、`plugins.deny`、`plugins.enabled` | いいえ（Plugin ランタイムを再読み込み）  |
| UI とその他           | `ui`、`logging`、`identity`、`bindings`                                 | いいえ                           |
| Gateway サーバー      | `gateway.*`（ポート、バインド、認証、Tailscale、TLS、HTTP、プッシュ）              | **はい**                      |
| インフラストラクチャ      | `discovery`、`browser`、`plugins.load`、`plugins.installs`              | **はい**                      |

<Note>
`gateway.reload` と `gateway.remote` は `gateway.*` 配下の例外であり、これらを変更しても再起動は**トリガーされません**。個々の Plugin もこの表を上書きできます。読み込まれた Plugin は、独自の再起動をトリガーする設定プレフィックスを宣言できます（たとえば、同梱の Canvas Plugin は、自身の `plugins.entries.canvas` だけでなく、`plugins.enabled`、`plugins.allow`、`plugins.deny` に対しても Gateway を再起動します）。そのため、実際の動作は有効な Plugin によって異なります。
</Note>

### 再読み込みの計画

`$include` を通じて参照されるソースファイルを編集すると、OpenClaw は平坦化されたメモリ内ビューではなく、ソースで記述されたレイアウトに基づいて再読み込みを計画します。これにより、`plugins: { $include: "./plugins.json5" }` のように、単一の最上位セクションが独自のインクルードファイルに存在する場合でも、ホットリロードの判断（ホット適用か再起動か）が予測可能に保たれます。ソースレイアウトが曖昧な場合、再読み込みの計画は安全側に倒して失敗します。

## 設定 RPC（プログラムによる更新）

Gateway API 経由で設定を書き込むツールでは、次のフローを推奨します。

- `config.schema.lookup` で単一のサブツリーを調査（浅いスキーマノードと子要素の概要）
- `config.get` で現在のスナップショットと `hash` を取得
- `config.patch` で部分更新（JSON マージパッチ：オブジェクトはマージ、`null` は削除。配列は、要素が削除される場合に `replacePaths` で明示的に確認されていれば置換）
- 設定全体を置き換える場合にのみ `config.apply`
- 明示的な自己更新と再起動には `update.run`。再起動後のセッションで追加の 1 ターンを実行する必要がある場合は `continuationMessage` を含める
- `update.status` で最新の更新再起動センチネルを調査し、再起動後に実行中のバージョンを検証

エージェントは、フィールドレベルの正確なドキュメントと制約を確認する最初の手段として `config.schema.lookup` を使用する必要があります。より広範な設定マップ、デフォルト値、または専用サブシステムリファレンスへのリンクが必要な場合は、[設定リファレンス](/ja-JP/gateway/configuration-reference)を使用してください。

<Note>
コントロールプレーンの書き込み（`config.apply`、`config.patch`、`update.run`）は、`deviceId+clientIp` ごとに 60 秒あたり 3 リクエストにレート制限されます。再起動リクエストは統合された後、再起動サイクル間に 30 秒のクールダウンが適用されます。`update.status` は読み取り専用ですが、再起動センチネルに更新手順の概要やコマンド出力の末尾が含まれる可能性があるため、管理者スコープに限定されています。
</Note>

部分パッチの例：

```bash
openclaw gateway call config.get --params '{}'  # payload.hash を取得
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` と `config.patch` はどちらも、`raw`、`baseHash`、`sessionKey`、`note`、`restartDelayMs` を受け付けます。設定ファイルがすでに存在する場合、両方のメソッドで `baseHash` が必須です（既存の設定がない初回書き込みでは、このチェックは省略されます）。

`config.patch` は、配列の置換を意図している設定パスの配列である `replacePaths` も受け付けます。パッチによって既存の配列がより少ない要素で置換または削除される場合、Gateway は、その正確なパスが `replacePaths` に含まれていない限り書き込みを拒否します。配列要素配下のネストされた配列には、`agents.list[].skills` のように `[]` を使用します。これにより、切り詰められた `config.get` スナップショットが、ルーティング配列や許可リスト配列を暗黙に上書きすることを防ぎます。設定全体を置き換える場合は `config.apply` を使用してください。

## 環境変数

OpenClaw は、親プロセスに加えて次の場所から環境変数を読み取ります。

- 現在の作業ディレクトリの `.env`（存在する場合）
- `~/.openclaw/.env`（グローバルフォールバック）

どちらのファイルも既存の環境変数を上書きしません。設定内でインライン環境変数を設定することもできます。

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="シェル環境変数のインポート（任意）">
  有効にした場合、期待されるキーが設定されていなければ、OpenClaw はログインシェルを実行し、不足しているキーのみをインポートします。

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

同等の環境変数：`OPENCLAW_LOAD_SHELL_ENV=1`。デフォルトの `timeoutMs`：`15000`。
</Accordion>

<Accordion title="設定値内での環境変数置換">
  任意の設定文字列値内で `${VAR_NAME}` を使用して環境変数を参照します。

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

ルール：

- 一致するのは大文字の名前のみ：`[A-Z_][A-Z0-9_]*`
- 変数が存在しない、または空の場合、読み込み時にエラーが発生
- リテラルとして出力するには `$${VAR}` でエスケープ
- `$include` ファイル内でも動作
- インライン置換：`"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="シークレット参照（環境変数、ファイル、実行）">
  SecretRef オブジェクトをサポートするフィールドでは、次のように使用できます。

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

SecretRef の詳細（`env`/`file`/`exec` 用の `secrets.providers` を含む）は、[シークレット管理](/ja-JP/gateway/secrets)に記載されています。
サポートされる認証情報パスは、[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)に一覧されています。
</Accordion>

完全な優先順位とソースについては、[環境](/ja-JP/help/environment)を参照してください。

## 完全なリファレンス

フィールドごとの完全なリファレンスについては、**[設定リファレンス](/ja-JP/gateway/configuration-reference)**を参照してください。

---

_関連：[設定例](/ja-JP/gateway/configuration-examples) · [設定リファレンス](/ja-JP/gateway/configuration-reference) · [Doctor](/ja-JP/gateway/doctor)_

## 関連項目

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [設定例](/ja-JP/gateway/configuration-examples)
- [Gateway 運用手順書](/ja-JP/gateway)
