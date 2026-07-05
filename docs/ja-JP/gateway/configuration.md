---
read_when:
    - OpenClaw を初めて設定する
    - よく使われる設定パターンを探す
    - 特定の設定セクションへの移動
summary: '設定の概要: 一般的なタスク、クイックセットアップ、完全なリファレンスへのリンク'
title: 設定
x-i18n:
    generated_at: "2026-07-05T11:20:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eec71e09e4600c6d8016a376bdb190818dfffaaf7eebb9d181ef71b5e95eb2c8
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw は、任意の <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> 設定を `~/.openclaw/openclaw.json` から読み込みます。ファイルがない場合、OpenClaw は安全なデフォルトを使用します。

アクティブな設定パスは通常ファイルでなければなりません。OpenClaw が所有する書き込みはそれをアトミックに置き換えるため（そのパスへリネーム）、シンボリックリンクされた `openclaw.json` はリンク先に書き込まれるのではなく、リンク先が置き換えられます - シンボリックリンクされた設定レイアウトは避けてください。デフォルトの状態ディレクトリ外に設定を保持する場合は、`OPENCLAW_CONFIG_PATH` を実際のファイルに直接向けてください。

設定を追加する一般的な理由:

- チャンネルを接続し、誰が bot にメッセージを送れるかを制御する
- モデル、ツール、サンドボックス化、または自動化（Cron、hooks）を設定する
- セッション、メディア、ネットワーク、または UI を調整する

利用可能なすべてのフィールドについては、[完全なリファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

エージェントと自動化は、設定を編集する前に正確なフィールドレベルの
ドキュメントを得るために `config.schema.lookup` を使用してください。このページはタスク指向のガイダンスに使用し、
より広範なフィールドマップとデフォルトについては
[設定リファレンス](/ja-JP/gateway/configuration-reference)を使用してください。

<Tip>
**設定が初めてですか?** 対話式セットアップには `openclaw onboard` から始めるか、完全なコピー＆ペースト可能な設定については [設定例](/ja-JP/gateway/configuration-examples)ガイドを確認してください。
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
    Control UI は、ライブ設定スキーマからフォームをレンダリングします。これにはフィールドの
    `title` / `description` ドキュメントメタデータに加え、利用可能な場合は Plugin とチャンネルのスキーマが含まれ、
    退避手段として **Raw JSON** エディターもあります。ドリルダウン
    UI やその他のツール向けに、Gateway は `config.schema.lookup` も公開しており、
    パススコープのスキーマノード 1 つと直下の子サマリーを取得できます。
  </Tab>
  <Tab title="Direct edit">
    `~/.openclaw/openclaw.json` を直接編集します。Gateway はファイルを監視し、変更を自動的に適用します（[ホットリロード](#config-hot-reload)を参照）。
  </Tab>
</Tabs>

## 厳格な検証

<Warning>
OpenClaw はスキーマに完全に一致する設定のみを受け入れます。不明なキー、不正な型、または無効な値があると、Gateway は**起動を拒否**します。ルートレベルで唯一の例外は `$schema`（文字列）で、エディターが JSON Schema メタデータを添付できるようにするためのものです。
</Warning>

`openclaw config schema` は、Control UI と検証で使用される正規の JSON Schema を出力します。
`config.schema.lookup` は、ドリルダウンツール向けに、パススコープのノード 1 つと
子サマリーを取得します。フィールドの `title`/`description` ドキュメントメタデータは、
ネストされたオブジェクト、ワイルドカード（`*`）、配列項目（`[]`）、および `anyOf`/
`oneOf`/`allOf` ブランチを通じて引き継がれます。マニフェストレジストリが読み込まれると、
ランタイム Plugin とチャンネルのスキーマがマージされます。

検証に失敗した場合:

- Gateway は起動しません
- 診断コマンドのみが動作します（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 正確な問題を確認するには `openclaw doctor` を実行します
- 修復を適用するには `openclaw doctor --fix`（`--repair` は同じフラグです。`--yes` はプロンプトをスキップします）を実行します

Gateway は、起動に成功するたびに信頼済みの last-known-good コピーを保持しますが、
起動時およびホットリロード時にそれを自動的に復元することはありません - それを行うのは `openclaw doctor --fix`
だけです。`openclaw.json` が検証に失敗した場合（Plugin ローカルの検証を含む）、Gateway の
起動は失敗するか、リロードがスキップされ、現在のランタイムは最後に受け入れられた
設定を保持します。拒否された書き込みも、確認用に `<path>.rejected.<timestamp>` として保存されます。
Gateway は、偶発的な上書きに見える書き込みをブロックします - `gateway.mode` の削除、
`meta` ブロックの喪失、またはファイルサイズが半分未満に縮小する場合です - ただし、その書き込みが
破壊的な変更を明示的に許可している場合を除きます。候補に `***` や `[redacted]` のような
秘匿済みシークレットプレースホルダーが含まれる場合、last-known-good への昇格はスキップされます。

## よくあるタスク

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    各チャンネルには `channels.<provider>` 配下に独自の設定セクションがあります。セットアップ手順については、専用のチャンネルページを参照してください:

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

    - `agents.defaults.models` はモデルカタログを定義し、`/model` の許可リストとして機能します。`provider/*` エントリは、動的モデル検出を引き続き使用しながら、`/model`、`/models`、およびモデルピッカーを選択したプロバイダーに絞り込みます。
    - 既存のモデルを削除せずに許可リストエントリを追加するには、`openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使用します。エントリを削除する可能性がある通常の置換は、`--replace` を渡さない限り拒否されます。
    - モデル参照は `provider/model` 形式を使用します（例: `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` はトランスクリプト/ツール画像のダウンスケーリングを制御します（デフォルトは `1200`）。値を下げると、スクリーンショットの多い実行で vision-token 使用量が通常減ります。
    - チャットでモデルを切り替える方法については [Models CLI](/ja-JP/concepts/models) を、認証ローテーションとフォールバック動作については [Model Failover](/ja-JP/concepts/model-failover) を参照してください。
    - カスタム/セルフホストのプロバイダーについては、リファレンスの [カスタムプロバイダー](/ja-JP/gateway/config-tools#custom-providers-and-base-urls) を参照してください。

  </Accordion>

  <Accordion title="Control who can message the bot">
    DM アクセスはチャンネルごとに `dmPolicy`（デフォルトは `"pairing"`）で制御されます:

    - `"pairing"`: 不明な送信者は承認用の 1 回限りのペアリングコードを受け取ります
    - `"allowlist"`: `allowFrom`（またはペアリング済み許可ストア）内の送信者のみ
    - `"open"`: すべての受信 DM を許可します（`allowFrom: ["*"]` が必要）
    - `"disabled"`: すべての DM を無視します

    グループについては、`groupPolicy`（`"allowlist" | "open" | "disabled"`）に加えて、`groupAllowFrom` またはチャンネル固有の許可リストを使用します。

    チャンネルごとの詳細については、[完全なリファレンス](/ja-JP/gateway/config-channels#dm-and-group-access)を参照してください。

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    グループメッセージはデフォルトで**メンション必須**です。エージェントごとにトリガーパターンを設定します。通常のグループ/チャンネル返信は自動的に投稿されます。共有ルームでエージェントが発言タイミングを判断すべき場合は、message-tool パスを有効にします:

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

    - **メタデータメンション**: ネイティブの @メンション（WhatsApp のタップしてメンション、Telegram の @bot など）
    - **テキストパターン**: `mentionPatterns` 内の安全な regex パターン
    - **可視返信**: `messages.visibleReplies` はグローバルに message-tool 送信を要求できます。`messages.groupChat.visibleReplies` はグループ/チャンネルでそれを上書きします。
    - 可視返信モード、チャンネルごとの上書き、および self-chat モードについては、[完全なリファレンス](/ja-JP/gateway/config-channels#group-chat-mention-gating)を参照してください。

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
    古くなっているように見えるチャンネルを Gateway がどの程度積極的に再起動するかを制御します:

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

    - 表示されている値はデフォルトです。ヘルスモニターによる再起動をグローバルに無効化するには、`gateway.channelHealthCheckMinutes: 0` を設定します。
    - `channelStaleEventThresholdMinutes` はチェック間隔以上である必要があります。
    - グローバルモニターを無効化せずに、1 つのチャンネルまたはアカウントの自動再起動を無効化するには、`channels.<provider>.healthMonitor.enabled` または `channels.<provider>.accounts.<id>.healthMonitor.enabled` を使用します。
    - 運用デバッグについては [ヘルスチェック](/ja-JP/gateway/health) を、すべてのフィールドについては [完全なリファレンス](/ja-JP/gateway/configuration-reference#gateway) を参照してください。

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    負荷が高いホストまたは低性能なホストで、ローカルクライアントが認証前 WebSocket ハンドシェイクを完了するための時間を増やします:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - デフォルトは `15000` ミリ秒です。
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` は、単発のサービスまたはシェル上書きとして引き続き優先されます。
    - まず startup/event-loop の停止を修正することを優先してください。このノブは、健全ではあるがウォームアップ中に遅いホスト向けです。

  </Accordion>

  <Accordion title="Configure sessions and resets">
    セッションは会話の継続性と分離を制御します:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // 複数ユーザーに推奨
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
    - `threadBindings`: スレッドに束縛されたセッションルーティングのグローバル既定値。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` は、セッションごとにこれを束縛、解除、一覧表示、調整します (Discord はスレッドを束縛し、Telegram はトピック/会話を束縛します)。
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

    まずイメージをビルドします。ソースチェックアウトからは `scripts/sandbox-setup.sh` を実行し、npm インストールからは [サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup) 内のインライン `docker build` コマンドを参照してください。

    完全なガイドについては [サンドボックス化](/ja-JP/gateway/sandboxing) を、すべてのオプションについては [完全なリファレンス](/ja-JP/gateway/config-agents#agentsdefaultssandbox) を参照してください。

  </Accordion>

  <Accordion title="公式 iOS ビルド向けのリレー支援プッシュを有効にする">
    公開 App Store ビルド向けのリレー支援プッシュは、ホストされた OpenClaw リレー `https://ios-push-relay.openclaw.ai` を使用します。

    カスタムリレーのデプロイには、リレー URL が Gateway リレー URL と一致する、意図的に分離された iOS ビルド/デプロイパスが必要です。カスタムリレービルドを使用している場合は、Gateway 設定でこれを設定します。

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // 任意。既定値: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    CLI での同等操作:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    これが行うこと:

    - Gateway が外部リレー経由で `push.test`、ウェイク促進、再接続ウェイクを送信できるようにします。
    - ペアリングされた iOS アプリによって転送される、登録スコープの送信許可を使用します。Gateway はデプロイ全体のリレートークンを必要としません。
    - 各リレー支援登録を、iOS アプリがペアリングした Gateway ID に束縛するため、別の Gateway は保存済み登録を再利用できません。
    - ローカル/手動 iOS ビルドは直接 APNs のままにします。リレー支援送信は、リレー経由で登録された公式配布ビルドにのみ適用されます。
    - 登録トラフィックと送信トラフィックが同じリレーデプロイに到達するよう、iOS ビルドに組み込まれたリレーベース URL と一致している必要があります。

    エンドツーエンドのフロー:

    1. 公式 iOS アプリをインストールします。
    2. 任意: 意図的に分離されたカスタムリレービルドを使用する場合にのみ、Gateway で `gateway.push.apns.relay.baseUrl` を設定します。
    3. iOS アプリを Gateway にペアリングし、ノードセッションとオペレーターセッションの両方を接続させます。
    4. iOS アプリが Gateway ID を取得し、App Attest とアプリレシートを使用してリレーに登録してから、リレー支援の `push.apns.register` ペイロードをペアリング済み Gateway に公開します。
    5. Gateway はリレーハンドルと送信許可を保存し、それらを `push.test`、ウェイク促進、再接続ウェイクに使用します。

    運用上の注意:

    - iOS アプリを別の Gateway に切り替える場合は、アプリを再接続して、その Gateway に束縛された新しいリレー登録を公開できるようにします。
    - 別のリレーデプロイを指す新しい iOS ビルドを出荷する場合、アプリは古いリレーオリジンを再利用する代わりに、キャッシュされたリレー登録を更新します。

    互換性に関する注意:

    - `OPENCLAW_APNS_RELAY_BASE_URL` と `OPENCLAW_APNS_RELAY_TIMEOUT_MS` は、一時的な環境変数オーバーライドとして引き続き機能します。
    - カスタム Gateway リレー URL は、iOS ビルドに組み込まれたリレーベース URL と一致している必要があります。公開 App Store リリースレーンは、カスタム iOS リレー URL オーバーライドを拒否します。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` は local loopback 専用の開発用エスケープハッチのままです。HTTP リレー URL を設定に永続化しないでください。

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

    - `every`: 期間文字列 (`30m`、`2h`)。無効にするには `0m` を設定します。既定値: `30m`。
    - `target`: `last` | `none` | `<channel-id>` (例: `discord`、`matrix`、`telegram`、`whatsapp`)
    - `directPolicy`: DM スタイルの heartbeat ターゲットに対する `allow` (既定) または `block`
    - 完全なガイドについては [Heartbeat](/ja-JP/gateway/heartbeat) を参照してください。

  </Accordion>

  <Accordion title="Cron ジョブを設定する">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // 既定値。Cron ディスパッチ + 分離された Cron エージェントターン実行
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: 完了した分離実行セッションを `sessions.json` から削除します (既定値は `24h`; 無効にするには `false` を設定)。
    - `runLog`: ジョブごとに保持される Cron 実行履歴行を削除します。履歴は SQLite に保存されます。`maxBytes` (既定値 `2_000_000`) は古いファイルベース実行ログとの互換性のために保持され、`keepLines` の既定値は `2000` です。
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

    セキュリティ上の注意:
    - すべてのフック/Webhook ペイロード内容を信頼できない入力として扱います。
    - 専用の `hooks.token` を使用し、アクティブな Gateway 認証シークレット (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) を再利用しないでください。
    - フック認証はヘッダーのみです (`Authorization: Bearer ...` または `x-openclaw-token`)。クエリ文字列トークンは拒否されます。
    - `hooks.path` を `/` にすることはできません。Webhook 受信は `/hooks` などの専用サブパスに保ってください。
    - 厳密に範囲を限定したデバッグを行う場合を除き、危険なコンテンツのバイパスフラグ (`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`) は無効のままにしてください。
    - `hooks.allowRequestSessionKey` を有効にする場合は、呼び出し元が選択するセッションキーを制限するために `hooks.allowedSessionKeyPrefixes` も設定してください。
    - フック駆動のエージェントでは、強力な最新モデル階層と厳格なツールポリシー (たとえばメッセージングのみ、可能ならサンドボックス化も併用) を優先してください。

    すべてのマッピングオプションと Gmail 連携については [完全なリファレンス](/ja-JP/gateway/configuration-reference#hooks) を参照してください。

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

    束縛ルールとエージェントごとのアクセスプロファイルについては [Multi-Agent](/ja-JP/concepts/multi-agent) と [完全なリファレンス](/ja-JP/gateway/config-agents#multi-agent-routing) を参照してください。

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

    - **単一ファイル**: 含んでいるオブジェクトを置き換えます
    - **ファイルの配列**: 最大 10 階層のネストまで、順番にディープマージされます (後のものが優先)
    - **兄弟キー**: include 後にマージされます (include された値を上書き)
    - **相対パス**: include 元ファイルからの相対パスとして解決されます
    - **パス形式**: include パスに null バイトを含めてはならず、解決前後のどちらでも 4096 文字未満でなければなりません
    - **OpenClaw 所有の書き込み**: 書き込みが `plugins: { $include: "./plugins.json5" }` のような単一ファイル include によって裏付けられた最上位セクション 1 つだけを変更する場合、OpenClaw はその include されたファイルを更新し、`openclaw.json` はそのまま残します
    - **サポートされない書き込みスルー**: ルート include、include 配列、兄弟オーバーライドを伴う include は、設定をフラット化する代わりに、OpenClaw 所有の書き込みでフェイルクローズします
    - **閉じ込め**: `$include` パスは `openclaw.json` を保持するディレクトリ配下に解決される必要があります。マシン間またはユーザー間でツリーを共有するには、`OPENCLAW_INCLUDE_ROOTS` を、include が参照できる追加ディレクトリのパスリスト (POSIX では `:`、Windows では `;`) に設定します。シンボリックリンクは解決されて再チェックされるため、字句上は設定ディレクトリ内にあるパスでも、実際のターゲットが許可されたすべてのルートから外れる場合は引き続き拒否されます。
    - **エラー処理**: ファイル欠落、解析エラー、循環 include、無効なパス形式、過度な長さに対して明確なエラーを出します

  </Accordion>
</AccordionGroup>

## 設定のホットリロード

Gateway は `~/.openclaw/openclaw.json` を監視し、変更を自動的に適用します。ほとんどの設定では手動再起動は不要です。

直接のファイル編集は、検証が通るまで信頼できないものとして扱われます。ウォッチャーはエディターの一時書き込み/リネームの揺れが収まるのを待ち、最終ファイルを読み取り、無効な外部編集を `openclaw.json` を書き換えずに拒否します。OpenClaw 所有の設定書き込みは、書き込み前に同じスキーマゲートを使用します (すべての書き込みに適用される clobber/rollback ルールについては [厳格な検証](#strict-validation) を参照してください)。

`config reload skipped (invalid config)` が表示される場合、または起動時に `Invalid
config` が報告される場合は、設定を確認し、`openclaw config validate` を実行してから、修復のために `openclaw
doctor --fix` を実行してください。チェックリストについては [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-rejected-invalid-config) を参照してください。

### リロードモード

| モード                 | 動作                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (既定)    | 安全な変更を即座にホット適用します。重要な変更では自動的に再起動します。              |
| **`hot`**              | 安全な変更のみをホット適用します。再起動が必要な場合は警告をログに出します。対応はユーザーが行います。 |
| **`restart`**          | 安全かどうかにかかわらず、設定変更時に Gateway を再起動します。                       |
| **`off`**              | ファイル監視を無効にします。変更は次回の手動再起動で有効になります。                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ホット適用されるものと再起動が必要なもの

ほとんどのフィールドはダウンタイムなしでホット適用されます。一部のホット適用されるセクションは、Gateway 全体ではなく、そのサブシステム（チャネル、Cron、Heartbeat、ヘルスモニター）だけを再起動します。`hybrid` モードでは、Gateway の再起動が必要な変更は自動的に処理されます。

| カテゴリ            | フィールド                                                                  | Gateway の再起動は必要?      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| チャネル            | `channels.*`, `web` (WhatsApp) - すべての組み込みおよびプラグインチャネル       | いいえ（そのチャネルを再起動）   |
| エージェントとモデル      | `agent`, `agents`, `models`, `routing`                                  | いいえ                           |
| 自動化          | `hooks`, `cron`, `agent.heartbeat`                                      | いいえ（そのサブシステムを再起動） |
| セッションとメッセージ | `session`, `messages`                                                   | いいえ                           |
| ツールとメディア       | `tools`, `skills`, `mcp`, `audio`, `talk`                               | いいえ                           |
| Plugin 設定       | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | いいえ（プラグインランタイムを再読み込み）  |
| UI とその他           | `ui`, `logging`, `identity`, `bindings`                                 | いいえ                           |
| Gateway サーバー      | `gateway.*` (ポート、バインド、認証、Tailscale、TLS、HTTP、プッシュ)              | **はい**                      |
| インフラストラクチャ      | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **はい**                      |

<Note>
`gateway.reload` と `gateway.remote` は `gateway.*` 配下の例外で、これらを変更しても再起動はトリガーされません。個別のプラグインもこの表を上書きできます。読み込まれたプラグインは、独自の再起動トリガー設定プレフィックスを宣言できます（たとえば、バンドルされた Canvas プラグインは、自身の `plugins.entries.canvas` だけでなく、`plugins.enabled`、`plugins.allow`、`plugins.deny` でも Gateway を再起動します）。そのため、実際の動作は有効なプラグインによって異なります。
</Note>

### 再読み込み計画

`$include` を通じて参照されるソースファイルを編集すると、OpenClaw はフラット化されたインメモリビューではなく、ソースで記述されたレイアウトから再読み込みを計画します。これにより、`plugins: { $include: "./plugins.json5" }` のように単一のトップレベルセクションが独自のインクルードファイルに存在する場合でも、ホットリロードの判断（ホット適用か再起動か）が予測しやすくなります。ソースレイアウトがあいまいな場合、再読み込み計画は安全側に倒して失敗します。

## 設定 RPC（プログラムによる更新）

Gateway API 経由で設定を書き込むツールでは、次のフローを推奨します。

- `config.schema.lookup` で 1 つのサブツリーを調べる（浅いスキーマノード + 子の概要）
- `config.get` で現在のスナップショットと `hash` を取得する
- `config.patch` で部分更新を行う（JSON マージパッチ: オブジェクトはマージ、`null` は削除、配列はエントリが削除される場合に `replacePaths` で明示的に確認されたときのみ置換）
- 設定全体を置き換える意図がある場合のみ `config.apply` を使う
- 明示的な自己更新と再起動には `update.run` を使う。再起動後のセッションで 1 回の後続ターンを実行する必要がある場合は `continuationMessage` を含める
- `update.status` で最新の更新再起動センチネルを調べ、再起動後に実行中のバージョンを確認する

エージェントは、正確なフィールドレベルのドキュメントと制約を確認する最初の場所として `config.schema.lookup` を扱うべきです。より広い設定マップ、デフォルト、または専用サブシステム参照へのリンクが必要な場合は、[設定リファレンス](/ja-JP/gateway/configuration-reference)を使用してください。

<Note>
コントロールプレーン書き込み（`config.apply`、`config.patch`、`update.run`）は、`deviceId+clientIp` ごとに 60 秒あたり 3 リクエストにレート制限されます。再起動リクエストは結合され、その後、再起動サイクル間に 30 秒のクールダウンを適用します。`update.status` は読み取り専用ですが、再起動センチネルに更新ステップの概要やコマンド出力の末尾が含まれる場合があるため、管理者スコープです。
</Note>

部分パッチの例:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` と `config.patch` はどちらも `raw`、`baseHash`、`sessionKey`、`note`、`restartDelayMs` を受け付けます。設定ファイルがすでに存在する場合、`baseHash` は両方のメソッドで必須です（既存の設定がない初回書き込みではチェックをスキップします）。

`config.patch` は、配列置換が意図的である設定パスの配列である `replacePaths` も受け付けます。パッチが既存の配列をより少ないエントリで置換または削除しようとする場合、その正確なパスが `replacePaths` に含まれていない限り、Gateway は書き込みを拒否します。配列エントリ配下のネストされた配列には、`agents.list[].skills` のように `[]` を使用します。これにより、切り詰められた `config.get` スナップショットがルーティングや許可リスト配列を暗黙に上書きすることを防ぎます。設定全体を置き換える意図がある場合は `config.apply` を使用してください。

## 環境変数

OpenClaw は親プロセスに加えて、次から環境変数を読み込みます。

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
  有効で、期待されるキーが設定されていない場合、OpenClaw はログインシェルを実行し、不足しているキーだけをインポートします。

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

環境変数での同等指定: `OPENCLAW_LOAD_SHELL_ENV=1`。デフォルトの `timeoutMs`: `15000`。
</Accordion>

<Accordion title="設定値内の環境変数置換">
  任意の設定文字列値で `${VAR_NAME}` を使って環境変数を参照します。

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

ルール:

- 一致するのは大文字名のみ: `[A-Z_][A-Z0-9_]*`
- 未設定または空の変数は読み込み時にエラーを投げる
- リテラル出力には `$${VAR}` でエスケープする
- `$include` ファイル内でも機能する
- インライン置換: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="シークレット参照（env、file、exec）">
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

SecretRef の詳細（`env`/`file`/`exec` 用の `secrets.providers` を含む）は [シークレット管理](/ja-JP/gateway/secrets)にあります。サポートされる認証情報パスは [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)に一覧化されています。
</Accordion>

完全な優先順位とソースについては、[環境](/ja-JP/help/environment)を参照してください。

## 完全なリファレンス

フィールドごとの完全なリファレンスについては、**[設定リファレンス](/ja-JP/gateway/configuration-reference)** を参照してください。

---

_関連: [設定例](/ja-JP/gateway/configuration-examples) · [設定リファレンス](/ja-JP/gateway/configuration-reference) · [Doctor](/ja-JP/gateway/doctor)_

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [設定例](/ja-JP/gateway/configuration-examples)
- [Gateway ランブック](/ja-JP/gateway)
