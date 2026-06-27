---
read_when:
    - OpenClaw を初めてセットアップする
    - 一般的な設定パターンを探しています
    - 特定の設定セクションへの移動
summary: '構成の概要: よく使うタスク、クイックセットアップ、完全なリファレンスへのリンク'
title: 設定
x-i18n:
    generated_at: "2026-06-27T11:25:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53ab0299aca69dafd240550bac1407356b0b3f5f35ef0171ea961c36346d3cab
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw は、`~/.openclaw/openclaw.json` から任意の <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> 設定を読み取ります。
有効な設定パスは通常ファイルである必要があります。シンボリックリンクされた `openclaw.json`
レイアウトは、OpenClaw が所有する書き込みではサポートされません。アトミック書き込みでは、
シンボリックリンクを保持する代わりにパスが置き換えられる場合があります。設定を
デフォルトの状態ディレクトリ外に保持する場合は、`OPENCLAW_CONFIG_PATH` を実ファイルに直接向けてください。

ファイルがない場合、OpenClaw は安全なデフォルトを使用します。設定を追加する一般的な理由:

- チャンネルを接続し、誰がボットにメッセージを送れるかを制御する
- モデル、ツール、サンドボックス化、または自動化（cron、フック）を設定する
- セッション、メディア、ネットワーク、または UI を調整する

利用可能なすべてのフィールドについては、[完全なリファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

エージェントと自動化は、設定を編集する前に、正確なフィールド単位の
ドキュメントとして `config.schema.lookup` を使用する必要があります。このページはタスク指向のガイダンスとして使用し、
より広範なフィールドマップとデフォルトについては
[設定リファレンス](/ja-JP/gateway/configuration-reference)を使用してください。

<Tip>
**設定が初めてですか?** 対話型セットアップには `openclaw onboard` から開始するか、完全なコピー&ペースト可能な設定については [設定例](/ja-JP/gateway/configuration-examples)ガイドを確認してください。
</Tip>

## 最小設定

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## 設定の編集

<Tabs>
  <Tab title="Interactive wizard">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) を開き、**Config** タブを使用します。
    Control UI はライブ設定スキーマからフォームをレンダリングします。利用可能な場合は、
    フィールドの `title` / `description` ドキュメントメタデータに加えて Plugin とチャンネルのスキーマも含め、
    退避手段として **Raw JSON** エディターを提供します。ドリルダウン
    UI やその他のツール向けに、Gateway は `config.schema.lookup` も公開しており、
    1 つのパススコープのスキーマノードと直下の子要素サマリーを取得できます。
  </Tab>
  <Tab title="Direct edit">
    `~/.openclaw/openclaw.json` を直接編集します。Gateway はファイルを監視し、変更を自動的に適用します（[ホットリロード](#config-hot-reload)を参照）。
  </Tab>
</Tabs>

## 厳密な検証

<Warning>
OpenClaw は、スキーマに完全に一致する設定のみを受け付けます。不明なキー、不正な形式の型、または無効な値があると、Gateway は**起動を拒否**します。唯一のルートレベル例外は `$schema`（文字列）で、エディターが JSON Schema メタデータを添付できるようにするためのものです。
</Warning>

`openclaw config schema` は、Control UI と検証で使用される正規の JSON Schema を出力します。
`config.schema.lookup` は、ドリルダウンツール向けに、単一のパススコープのノードと
子要素サマリーを取得します。フィールドの `title`/`description` ドキュメントメタデータは、
ネストしたオブジェクト、ワイルドカード（`*`）、配列項目（`[]`）、および `anyOf`/
`oneOf`/`allOf` ブランチを通じて引き継がれます。マニフェストレジストリが読み込まれている場合、
実行時の Plugin とチャンネルのスキーマがマージされます。

検証に失敗した場合:

- Gateway は起動しません
- 診断コマンドのみが動作します（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 正確な問題を確認するには `openclaw doctor` を実行します
- 修復を適用するには `openclaw doctor --fix`（または `--yes`）を実行します

Gateway は、起動に成功するたびに信頼済みの最終正常コピーを保持しますが、
起動時とホットリロード時にそれを自動的に復元することはありません。`openclaw.json`
の検証（Plugin ローカル検証を含む）に失敗した場合、Gateway の起動は失敗するか、
リロードがスキップされ、現在のランタイムは最後に受け入れられた設定を保持します。
接頭辞付きまたは上書きされた設定を修復するか、最終正常コピーを復元するには、
`openclaw doctor --fix`（または `--yes`）を実行します。候補に `***` のような
秘匿済みシークレットプレースホルダーが含まれる場合、最終正常コピーへの昇格はスキップされます。

## 一般的なタスク

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    各チャンネルには、`channels.<provider>` の下に独自の設定セクションがあります。セットアップ手順については、専用のチャンネルページを参照してください:

    - [WhatsApp](/ja-JP/channels/whatsapp) - `channels.whatsapp`
    - [Telegram](/ja-JP/channels/telegram) - `channels.telegram`
    - [Discord](/ja-JP/channels/discord) - `channels.discord`
    - [Feishu](/ja-JP/channels/feishu) - `channels.feishu`
    - [Google Chat](/ja-JP/channels/googlechat) - `channels.googlechat`
    - [Microsoft Teams](/ja-JP/channels/msteams) - `channels.msteams`
    - [Slack](/ja-JP/channels/slack) - `channels.slack`
    - [Signal](/ja-JP/channels/signal) - `channels.signal`
    - [iMessage](/ja-JP/channels/imessage) - `channels.imessage`
    - [Mattermost](/ja-JP/channels/mattermost) - `channels.mattermost`

    すべてのチャンネルは同じ DM ポリシーパターンを共有します:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Choose and configure models">
    プライマリモデルと任意のフォールバックを設定します:

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

    - `agents.defaults.models` はモデルカタログを定義し、`/model` の許可リストとして機能します。`provider/*` エントリは、動的なモデル検出を使用し続けながら、`/model`、`/models`、モデルピッカーを選択したプロバイダーに絞り込みます。
    - 既存のモデルを削除せずに許可リストエントリを追加するには、`openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使用します。エントリを削除する通常の置換は、`--replace` を渡さない限り拒否されます。
    - モデル参照は `provider/model` 形式を使用します（例: `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` は、トランスクリプト/ツール画像の縮小を制御します（デフォルト `1200`）。通常、値を小さくするとスクリーンショットが多い実行でのビジョントークン使用量が減ります。
    - チャット内でモデルを切り替えるには[モデル CLI](/ja-JP/concepts/models)を、認証ローテーションとフォールバック動作については[モデルフェイルオーバー](/ja-JP/concepts/model-failover)を参照してください。
    - カスタム/セルフホストのプロバイダーについては、リファレンスの[カスタムプロバイダー](/ja-JP/gateway/config-tools#custom-providers-and-base-urls)を参照してください。

  </Accordion>

  <Accordion title="Control who can message the bot">
    DM アクセスは、チャンネルごとに `dmPolicy` で制御されます:

    - `"pairing"`（デフォルト）: 不明な送信者には承認用の 1 回限りのペアリングコードが渡されます
    - `"allowlist"`: `allowFrom`（またはペアリング済み許可ストア）内の送信者のみ
    - `"open"`: すべての受信 DM を許可します（`allowFrom: ["*"]` が必要）
    - `"disabled"`: すべての DM を無視します

    グループでは、`groupPolicy` + `groupAllowFrom` またはチャンネル固有の許可リストを使用します。

    チャンネルごとの詳細については、[完全なリファレンス](/ja-JP/gateway/config-channels#dm-and-group-access)を参照してください。

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    グループメッセージはデフォルトで**メンション必須**です。エージェントごとにトリガーパターンを設定します。通常のグループ/チャンネル返信は自動的に投稿されます。共有ルームでエージェントが発言タイミングを判断すべき場合は、メッセージツール経路を有効にします:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // opt-in; visible output requires message(action=send)
          unmentionedInbound: "room_event", // unmentioned always-on group chatter is quiet context
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

    - **メタデータメンション**: ネイティブ @メンション（WhatsApp のタップしてメンション、Telegram @bot など）
    - **テキストパターン**: `mentionPatterns` 内の安全な正規表現パターン
    - **可視返信**: `messages.visibleReplies` はグローバルにメッセージツール送信を要求できます。`messages.groupChat.visibleReplies` はグループ/チャンネルに対してそれを上書きします。
    - 可視返信モード、チャンネルごとの上書き、セルフチャットモードについては、[完全なリファレンス](/ja-JP/gateway/config-channels#group-chat-mention-gating)を参照してください。

  </Accordion>

  <Accordion title="Restrict skills per agent">
    共有ベースラインには `agents.defaults.skills` を使用し、その後、特定の
    エージェントを `agents.list[].skills` で上書きします:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - デフォルトで Skills を制限しない場合は、`agents.defaults.skills` を省略します。
    - デフォルトを継承するには、`agents.list[].skills` を省略します。
    - Skills なしにするには、`agents.list[].skills: []` を設定します。
    - [Skills](/ja-JP/tools/skills)、[Skills 設定](/ja-JP/tools/skills-config)、および
      [設定リファレンス](/ja-JP/gateway/config-agents#agents-defaults-skills)を参照してください。

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
    古くなっているように見えるチャンネルを Gateway がどれだけ積極的に再起動するかを制御します:

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

    - ヘルスモニターによる再起動をグローバルに無効化するには、`gateway.channelHealthCheckMinutes: 0` を設定します。
    - `channelStaleEventThresholdMinutes` はチェック間隔以上である必要があります。
    - グローバルモニターを無効化せずに、1 つのチャンネルまたはアカウントの自動再起動を無効化するには、`channels.<provider>.healthMonitor.enabled` または `channels.<provider>.accounts.<id>.healthMonitor.enabled` を使用します。
    - 運用デバッグについては[ヘルスチェック](/ja-JP/gateway/health)を、すべてのフィールドについては[完全なリファレンス](/ja-JP/gateway/configuration-reference#gateway)を参照してください。

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    負荷が高いホストや低電力ホストで、ローカルクライアントが認証前 WebSocket ハンドシェイクを完了する時間を
    長めに与えます:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - デフォルトは `15000` ミリ秒です。
    - 1 回限りのサービスまたはシェル上書きでは、`OPENCLAW_HANDSHAKE_TIMEOUT_MS` が引き続き優先されます。
    - まず起動時/イベントループの停止を修正することを優先してください。このノブは、正常だがウォームアップ中に遅いホスト向けです。

  </Accordion>

  <Accordion title="Configure sessions and resets">
    セッションは会話の継続性と分離を制御します:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (共有) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: スレッドに紐づくセッションルーティングのグローバル既定値 (Discord は `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` をサポートします)。
    - スコープ、ID リンク、送信ポリシーについては [セッション管理](/ja-JP/concepts/session) を参照してください。
    - すべてのフィールドについては [完全なリファレンス](/ja-JP/gateway/config-agents#session) を参照してください。

  </Accordion>

  <Accordion title="サンドボックス化を有効にする">
    分離されたサンドボックスランタイムでエージェントセッションを実行します。

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

    先にイメージをビルドします - ソースチェックアウトからは `scripts/sandbox-setup.sh` を実行し、npm インストールからは [サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup) 内のインライン `docker build` コマンドを参照してください。

    完全なガイドについては [サンドボックス化](/ja-JP/gateway/sandboxing) を、すべてのオプションについては [完全なリファレンス](/ja-JP/gateway/config-agents#agentsdefaultssandbox) を参照してください。

  </Accordion>

  <Accordion title="公式 iOS ビルド向けのリレー支援プッシュを有効にする">
    公開 App Store/TestFlight ビルド向けのリレー支援プッシュは、ホストされた OpenClaw リレー `https://ios-push-relay.openclaw.ai` を使用します。

    カスタムリレーのデプロイには、リレー URL が Gateway リレー URL と一致する、意図的に分離された iOS ビルド/デプロイパスが必要です。カスタムリレービルドを使用している場合は、Gateway 設定でこれを設定します。

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Default: 10000
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

    これにより行われること:

    - Gateway が外部リレーを通じて `push.test`、ウェイク通知、再接続ウェイクを送信できるようにします。
    - ペアリングされた iOS アプリから転送される、登録スコープの送信許可を使用します。Gateway はデプロイ全体のリレートークンを必要としません。
    - リレー支援登録ごとに、iOS アプリがペアリングした Gateway ID に紐づけるため、別の Gateway が保存済み登録を再利用することはできません。
    - ローカル/手動 iOS ビルドは直接 APNs のままにします。リレー支援送信は、リレー経由で登録された公式配布ビルドにのみ適用されます。
    - iOS ビルドに組み込まれたリレーベース URL と一致している必要があります。これにより、登録トラフィックと送信トラフィックが同じリレーデプロイに到達します。

    エンドツーエンドのフロー:

    1. 公式/TestFlight iOS ビルドをインストールします。
    2. 任意: 意図的に分離されたカスタムリレービルドを使用する場合にのみ、Gateway で `gateway.push.apns.relay.baseUrl` を設定します。
    3. iOS アプリを Gateway にペアリングし、ノードセッションとオペレーターセッションの両方を接続させます。
    4. iOS アプリは Gateway ID を取得し、App Attest とアプリレシートを使ってリレーに登録し、その後、リレー支援の `push.apns.register` ペイロードをペアリング済み Gateway に公開します。
    5. Gateway はリレーハンドルと送信許可を保存し、それらを `push.test`、ウェイク通知、再接続ウェイクに使用します。

    運用上の注意:

    - iOS アプリを別の Gateway に切り替えた場合は、その Gateway に紐づく新しいリレー登録を公開できるようにアプリを再接続してください。
    - 別のリレーデプロイを指す新しい iOS ビルドを出荷した場合、アプリは古いリレーオリジンを再利用せず、キャッシュ済みリレー登録を更新します。

    互換性に関する注意:

    - `OPENCLAW_APNS_RELAY_BASE_URL` と `OPENCLAW_APNS_RELAY_TIMEOUT_MS` は、一時的な環境変数オーバーライドとして引き続き機能します。
    - カスタム Gateway リレー URL は、iOS ビルドに組み込まれたリレーベース URL と一致している必要があります。公開 App Store リリースレーンは、カスタム iOS リレー URL オーバーライドを拒否します。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` は、local loopback 専用の開発用エスケープハッチのままです。HTTP リレー URL を設定に永続化しないでください。

    エンドツーエンドのフローについては [iOS アプリ](/ja-JP/platforms/ios#relay-backed-push-for-official-builds) を、リレーのセキュリティモデルについては [認証と信頼フロー](/ja-JP/platforms/ios#authentication-and-trust-flow) を参照してください。

  </Accordion>

  <Accordion title="Heartbeat (定期チェックイン) を設定する">
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

    - `every`: 期間文字列 (`30m`, `2h`)。無効にするには `0m` を設定します。
    - `target`: `last` | `none` | `<channel-id>` (例: `discord`、`matrix`、`telegram`、`whatsapp`)
    - `directPolicy`: DM 形式の Heartbeat ターゲットに対する `allow` (既定) または `block`
    - 完全なガイドについては [Heartbeat](/ja-JP/gateway/heartbeat) を参照してください。

  </Accordion>

  <Accordion title="Cron ジョブを設定する">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: 完了した分離実行セッションを `sessions.json` から削除します (既定は `24h`; 無効にするには `false` を設定)。
    - `runLog`: ジョブごとに保持された Cron 実行履歴行を削除します。`maxBytes` は古いファイルベースの実行ログ向けに引き続き受け付けられます。
    - 機能概要と CLI 例については [Cron ジョブ](/ja-JP/automation/cron-jobs) を参照してください。

  </Accordion>

  <Accordion title="Webhook (フック) を設定する">
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

    セキュリティに関する注意:
    - すべてのフック/Webhook ペイロード内容を信頼できない入力として扱ってください。
    - 専用の `hooks.token` を使用してください。有効な Gateway 認証シークレット (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) を再利用しないでください。
    - フック認証はヘッダーのみです (`Authorization: Bearer ...` または `x-openclaw-token`)。クエリ文字列トークンは拒否されます。
    - `hooks.path` を `/` にすることはできません。Webhook 受信は `/hooks` などの専用サブパスに保持してください。
    - 厳密にスコープを絞ったデバッグを行う場合を除き、安全でないコンテンツのバイパスフラグ (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) は無効のままにしてください。
    - `hooks.allowRequestSessionKey` を有効にする場合は、呼び出し元が選択するセッションキーを制限するために `hooks.allowedSessionKeyPrefixes` も設定してください。
    - フック駆動のエージェントでは、強力で最新のモデル階層と厳格なツールポリシー (たとえば、可能な場合はメッセージング専用にサンドボックス化を加えたもの) を推奨します。

    すべてのマッピングオプションと Gmail 統合については [完全なリファレンス](/ja-JP/gateway/configuration-reference#hooks) を参照してください。

  </Accordion>

  <Accordion title="マルチエージェントルーティングを設定する">
    個別のワークスペースとセッションを持つ複数の分離エージェントを実行します。

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

    バインドルールとエージェントごとのアクセスプロファイルについては [マルチエージェント](/ja-JP/concepts/multi-agent) と [完全なリファレンス](/ja-JP/gateway/config-agents#multi-agent-routing) を参照してください。

  </Accordion>

  <Accordion title="設定を複数ファイルに分割する ($include)">
    大きな設定を整理するには `$include` を使用します。

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
    - **ファイル配列**: 順番にディープマージされます (後のものが優先)
    - **兄弟キー**: include の後にマージされます (include された値を上書き)
    - **ネストされた include**: 最大 10 階層までサポートされます
    - **相対パス**: include しているファイルからの相対パスとして解決されます
    - **パス形式**: include パスに null バイトを含めることはできず、解決前後のどちらでも 4096 文字未満でなければなりません
    - **OpenClaw 所有の書き込み**: 書き込みがトップレベルセクション 1 つだけを変更し、
      `plugins: { $include: "./plugins.json5" }` のような単一ファイル include によって裏付けられている場合、
      OpenClaw はその include されたファイルを更新し、`openclaw.json` はそのままにします
    - **未対応の書き込みスルー**: ルート include、include 配列、兄弟オーバーライドを持つ include は、
      設定をフラット化する代わりに、OpenClaw 所有の書き込みを fail closed します
    - **閉じ込め**: `$include` パスは
      `openclaw.json` を保持するディレクトリ配下に解決される必要があります。マシンやユーザー間でツリーを共有するには、
      `OPENCLAW_INCLUDE_ROOTS` に、include が参照できる追加ディレクトリのパスリスト (POSIX では `:`、Windows では `;`) を設定します。シンボリックリンクは解決されて
      再チェックされるため、字句的には設定ディレクトリ内にあるパスでも、
      実際のターゲットが許可されたすべてのルートから外れる場合は引き続き拒否されます。
    - **エラー処理**: ファイル欠落、解析エラー、循環 include、無効なパス形式、過剰な長さに対して明確なエラーを出します

  </Accordion>
</AccordionGroup>

## 設定のホットリロード

Gateway は `~/.openclaw/openclaw.json` を監視し、変更を自動的に適用します。ほとんどの設定では手動再起動は不要です。

直接のファイル編集は、検証されるまで信頼されないものとして扱われます。ウォッチャーは
エディタの一時書き込み/リネームの揺れが落ち着くのを待ち、最終ファイルを読み取り、
無効な外部編集を `openclaw.json` に書き戻すことなく拒否します。OpenClaw 所有の設定
書き込みも、書き込み前に同じスキーマゲートを使用します。
`gateway.mode` を削除したり、ファイルを半分未満に縮小したりするような破壊的な上書きは拒否され、
確認用に `.rejected.*` として保存されます。

`config reload skipped (invalid config)` が表示されるか、起動時に `Invalid
config` が報告される場合は、設定を確認し、`openclaw config validate` を実行してから、修復のために `openclaw
doctor --fix` を実行してください。チェックリストについては [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-rejected-invalid-config)
を参照してください。

### リロードモード

| モード                   | 動作                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (既定) | 安全な変更を即座にホット適用します。重要な変更では自動的に再起動します。           |
| **`hot`**              | 安全な変更のみをホット適用します。再起動が必要な場合は警告をログに出します - 対応は利用者が行います。 |
| **`restart`**          | 安全かどうかにかかわらず、設定変更のたびに Gateway を再起動します。                                 |
| **`off`**              | ファイル監視を無効にします。変更は次回の手動再起動時に有効になります。                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ホット適用されるものと再起動が必要なもの

ほとんどのフィールドはダウンタイムなしでホット適用されます。`hybrid` モードでは、再起動が必要な変更は自動的に処理されます。

| カテゴリ            | フィールド                                                            | 再起動が必要? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| チャンネル            | `channels.*`, `web` (WhatsApp) - すべての組み込みチャンネルと plugin チャンネル | いいえ              |
| エージェントとモデル      | `agent`, `agents`, `models`, `routing`                            | いいえ              |
| 自動化          | `hooks`, `cron`, `agent.heartbeat`                                | いいえ              |
| セッションとメッセージ | `session`, `messages`                                             | いいえ              |
| ツールとメディア       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | いいえ              |
| UI とその他           | `ui`, `logging`, `identity`, `bindings`                           | いいえ              |
| Gateway サーバー      | `gateway.*` (ポート、バインド、認証、tailscale、TLS、HTTP)              | **はい**         |
| インフラストラクチャ      | `discovery`, `plugins`                                            | **はい**         |

<Note>
`gateway.reload` と `gateway.remote` は例外です。これらを変更しても再起動はトリガーされ**ません**。
</Note>

### リロード計画

`$include` を通じて参照されるソースファイルを編集すると、OpenClaw は
平坦化されたメモリ内ビューではなく、ソースで記述されたレイアウトから
リロードを計画します。これにより、
`plugins: { $include: "./plugins.json5" }` のように単一のトップレベルセクションが
独自のインクルードファイルにある場合でも、ホットリロードの判断（ホット適用か再起動か）が予測可能になります。
ソースレイアウトが曖昧な場合、リロード計画は安全側に失敗します。

## Config RPC（プログラムによる更新）

Gateway API 経由で設定を書き込むツールでは、このフローを推奨します。

- 1 つのサブツリー（浅いスキーマノード + 子の概要）を調べるための `config.schema.lookup`
- 現在のスナップショットと `hash` を取得するための `config.get`
- 部分更新のための `config.patch`（JSON merge patch: オブジェクトはマージされ、`null`
  は削除され、配列は、エントリが削除される場合に `replacePaths` で明示的に確認されたときだけ置換されます）
- 設定全体を置き換える意図がある場合のみ `config.apply`
- 明示的な自己更新と再起動のための `update.run`。再起動後のセッションで後続の 1 ターンを実行する必要がある場合は `continuationMessage` を含めます
- 最新の更新再起動センチネルを確認し、再起動後に実行中のバージョンを検証するための `update.status`

エージェントは、正確なフィールドレベルのドキュメントと制約を確認する最初の場所として
`config.schema.lookup` を扱うべきです。より広い設定マップ、デフォルト、または専用サブシステム参照へのリンクが必要な場合は
[Configuration reference](/ja-JP/gateway/configuration-reference) を使用してください。

<Note>
コントロールプレーンの書き込み（`config.apply`, `config.patch`, `update.run`）は、
`deviceId+clientIp` ごとに 60 秒あたり 3 リクエストにレート制限されます。再起動
リクエストは集約され、その後、再起動サイクル間に 30 秒のクールダウンを適用します。
`update.status` は読み取り専用ですが、再起動センチネルに
更新ステップの概要やコマンド出力の末尾が含まれる可能性があるため、管理者スコープです。
</Note>

部分パッチの例:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` と `config.patch` はどちらも `raw`, `baseHash`, `sessionKey`,
`note`, `restartDelayMs` を受け付けます。設定がすでに存在する場合、`baseHash` は
どちらのメソッドにも必須です。

`config.patch` は `replacePaths` も受け付けます。これは、配列
置換が意図的である設定パスの配列です。パッチが既存の配列をより少ないエントリで
置換または削除しようとする場合、その正確なパスが
`replacePaths` に含まれていない限り、Gateway は書き込みを拒否します。配列エントリ配下のネストされた配列には、
`agents.list[].skills` のように `[]` を使用します。これにより、切り詰められた `config.get` スナップショットが
ルーティングや許可リスト配列を黙って上書きすることを防ぎます。設定全体を
置き換える意図がある場合は `config.apply` を使用してください。

## 環境変数

OpenClaw は親プロセスに加えて、次から env vars を読み取ります。

- 現在の作業ディレクトリの `.env`（存在する場合）
- `~/.openclaw/.env`（グローバルフォールバック）

どちらのファイルも既存の env vars を上書きしません。設定内でインライン env vars を設定することもできます。

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="シェル env のインポート（任意）">
  有効化され、期待されるキーが設定されていない場合、OpenClaw はログインシェルを実行し、不足しているキーのみをインポートします。

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Env var の同等指定: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="設定値内の env var 置換">
  任意の設定文字列値で `${VAR_NAME}` を使って env vars を参照します。

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

ルール:

- 一致するのは大文字名のみ: `[A-Z_][A-Z0-9_]*`
- 未設定または空の var は読み込み時にエラーを投げます
- リテラル出力には `$${VAR}` でエスケープします
- `$include` ファイル内でも動作します
- インライン置換: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="シークレット参照（env, file, exec）">
  SecretRef オブジェクトをサポートするフィールドでは、次を使用できます。

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

SecretRef の詳細（`env`/`file`/`exec` 向けの `secrets.providers` を含む）は [Secrets Management](/ja-JP/gateway/secrets) にあります。
サポートされる認証情報パスは [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface) に一覧されています。
</Accordion>

完全な優先順位とソースについては [Environment](/ja-JP/help/environment) を参照してください。

## 完全なリファレンス

フィールドごとの完全なリファレンスについては、**[Configuration Reference](/ja-JP/gateway/configuration-reference)** を参照してください。

---

_関連: [Configuration Examples](/ja-JP/gateway/configuration-examples) · [Configuration Reference](/ja-JP/gateway/configuration-reference) · [Doctor](/ja-JP/gateway/doctor)_

## 関連

- [Configuration reference](/ja-JP/gateway/configuration-reference)
- [Configuration examples](/ja-JP/gateway/configuration-examples)
- [Gateway runbook](/ja-JP/gateway)
