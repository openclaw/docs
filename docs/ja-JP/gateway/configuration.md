---
read_when:
    - OpenClaw を初めてセットアップする
    - 一般的な設定パターンを探しています
    - 特定の設定セクションへの移動
summary: '設定の概要: 一般的なタスク、簡単なセットアップ、完全なリファレンスへのリンク'
title: 設定
x-i18n:
    generated_at: "2026-05-03T21:32:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: e27ef442d6375d8c22715f20194fb9ce50130204377c9ba4652c2949de28967c
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw は、任意の <Tooltip tip="JSON5 はコメントと末尾のカンマをサポートします">**JSON5**</Tooltip> 設定を `~/.openclaw/openclaw.json` から読み取ります。
有効な設定パスは通常ファイルである必要があります。シンボリックリンクされた `openclaw.json`
レイアウトは、OpenClaw が所有する書き込みではサポートされません。アトミック書き込みにより、シンボリックリンクを保持する代わりに
そのパスが置き換えられる場合があります。設定をデフォルトの状態ディレクトリ外に置く場合は、
`OPENCLAW_CONFIG_PATH` を実ファイルに直接向けてください。

ファイルが存在しない場合、OpenClaw は安全なデフォルトを使用します。設定を追加する一般的な理由:

- チャンネルを接続し、誰がボットにメッセージを送れるかを制御する
- モデル、ツール、サンドボックス化、自動化 (cron、フック) を設定する
- セッション、メディア、ネットワーク、UI を調整する

利用可能なすべてのフィールドについては、[完全なリファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

エージェントと自動化は、設定を編集する前に正確なフィールド単位の
ドキュメントを確認するために `config.schema.lookup` を使用してください。このページはタスク指向のガイダンスとして、
より広範なフィールドマップとデフォルトについては
[設定リファレンス](/ja-JP/gateway/configuration-reference)を使用してください。

<Tip>
**設定が初めてですか?** 対話的なセットアップには `openclaw onboard` から始めるか、完全なコピーペースト用設定については[設定例](/ja-JP/gateway/configuration-examples)ガイドを参照してください。
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
  <Tab title="対話型ウィザード">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (ワンライナー)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) を開き、**設定**タブを使用します。
    Control UI は、ライブ設定スキーマからフォームをレンダリングします。これには、フィールドの
    `title` / `description` ドキュメントメタデータに加えて、利用可能な場合は Plugin とチャンネルのスキーマが含まれ、
    退避手段として**生 JSON**エディターもあります。ドリルダウン
    UI やその他のツール向けに、Gateway は `config.schema.lookup` も公開しており、
    1 つのパス範囲スキーマノードと直下の子要約を取得できます。
  </Tab>
  <Tab title="直接編集">
    `~/.openclaw/openclaw.json` を直接編集します。Gateway はファイルを監視し、変更を自動的に適用します ([ホットリロード](#config-hot-reload)を参照)。
  </Tab>
</Tabs>

## 厳格な検証

<Warning>
OpenClaw は、スキーマに完全に一致する設定のみを受け入れます。不明なキー、不正な型、無効な値があると、Gateway は**起動を拒否**します。ルートレベルで唯一の例外は `$schema` (文字列) で、エディターが JSON Schema メタデータを付与できるようにするためのものです。
</Warning>

`openclaw config schema` は、Control UI と検証で使用される正規の JSON Schema を出力します。
`config.schema.lookup` は、ドリルダウンツール向けに、単一のパス範囲ノードと
子要約を取得します。フィールドの `title`/`description` ドキュメントメタデータは、
ネストされたオブジェクト、ワイルドカード (`*`)、配列アイテム (`[]`)、および `anyOf`/
`oneOf`/`allOf` 分岐を通じて引き継がれます。マニフェストレジストリが読み込まれている場合、
ランタイム Plugin とチャンネルのスキーマがマージされます。

検証に失敗した場合:

- Gateway は起動しません
- 診断コマンドのみが動作します (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- 正確な問題を確認するには `openclaw doctor` を実行します
- 修復を適用するには `openclaw doctor --fix` (または `--yes`) を実行します

Gateway は、起動に成功するたびに信頼済みの直近正常コピーを保持しますが、
起動時とホットリロード時に自動で復元することはありません。`openclaw.json` が
検証に失敗した場合 (Plugin ローカル検証を含む)、Gateway の起動は失敗するか、
リロードはスキップされ、現在のランタイムは最後に受け入れた設定を保持します。
プレフィックス付きまたは上書きされた設定を修復するか、直近正常コピーを
復元するには、`openclaw doctor --fix` (または `--yes`) を実行します。
候補に `***` のような秘匿済みシークレットプレースホルダーが含まれている場合、
直近正常コピーへの昇格はスキップされます。

## 一般的なタスク

<AccordionGroup>
  <Accordion title="チャンネルをセットアップする (WhatsApp、Telegram、Discord など)">
    各チャンネルには `channels.<provider>` 配下に独自の設定セクションがあります。セットアップ手順については、専用のチャンネルページを参照してください:

    - [WhatsApp](/ja-JP/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/ja-JP/channels/telegram) — `channels.telegram`
    - [Discord](/ja-JP/channels/discord) — `channels.discord`
    - [Feishu](/ja-JP/channels/feishu) — `channels.feishu`
    - [Google Chat](/ja-JP/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/ja-JP/channels/msteams) — `channels.msteams`
    - [Slack](/ja-JP/channels/slack) — `channels.slack`
    - [Signal](/ja-JP/channels/signal) — `channels.signal`
    - [iMessage](/ja-JP/channels/imessage) — `channels.imessage`
    - [Mattermost](/ja-JP/channels/mattermost) — `channels.mattermost`

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

  <Accordion title="モデルを選択して設定する">
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

    - `agents.defaults.models` はモデルカタログを定義し、`/model` の許可リストとして機能します。
    - 既存のモデルを削除せずに許可リストのエントリを追加するには、`openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使用します。エントリを削除する通常の置換は、`--replace` を渡さない限り拒否されます。
    - モデル参照は `provider/model` 形式を使用します (例: `anthropic/claude-opus-4-6`)。
    - `agents.defaults.imageMaxDimensionPx` は、トランスクリプト/ツール画像の縮小を制御します (デフォルト `1200`)。値を下げると、スクリーンショットの多い実行で通常は vision-token 使用量を削減できます。
    - チャットでのモデル切り替えについては[モデル CLI](/ja-JP/concepts/models)を、認証ローテーションとフォールバック動作については[モデルフェイルオーバー](/ja-JP/concepts/model-failover)を参照してください。
    - カスタム/セルフホストプロバイダーについては、リファレンスの[カスタムプロバイダー](/ja-JP/gateway/config-tools#custom-providers-and-base-urls)を参照してください。

  </Accordion>

  <Accordion title="誰がボットにメッセージを送れるかを制御する">
    DM アクセスは、チャンネルごとに `dmPolicy` で制御されます:

    - `"pairing"` (デフォルト): 不明な送信者には承認用のワンタイムペアリングコードが届きます
    - `"allowlist"`: `allowFrom` (またはペアリング済み許可ストア) 内の送信者のみ
    - `"open"`: すべての受信 DM を許可します (`allowFrom: ["*"]` が必要)
    - `"disabled"`: すべての DM を無視します

    グループには、`groupPolicy` + `groupAllowFrom` またはチャンネル固有の許可リストを使用します。

    チャンネルごとの詳細については、[完全なリファレンス](/ja-JP/gateway/config-channels#dm-and-group-access)を参照してください。

  </Accordion>

  <Accordion title="グループチャットのメンションゲーティングをセットアップする">
    グループメッセージはデフォルトで**メンションを要求**します。エージェントごとにトリガーパターンを設定し、従来の自動的な最終返信を意図的に使いたい場合を除き、表示されるルーム返信はデフォルトのメッセージツール経路に維持してください:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // default; use "automatic" for legacy room replies
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

    - **メタデータメンション**: ネイティブ @メンション (WhatsApp のタップしてメンション、Telegram @bot など)
    - **テキストパターン**: `mentionPatterns` 内の安全な正規表現パターン
    - **表示される返信**: `messages.visibleReplies` はグローバルにメッセージツール送信を要求できます。`messages.groupChat.visibleReplies` はグループ/チャンネル向けにそれを上書きします。
    - 表示返信モード、チャンネルごとの上書き、セルフチャットモードについては、[完全なリファレンス](/ja-JP/gateway/config-channels#group-chat-mention-gating)を参照してください。

  </Accordion>

  <Accordion title="エージェントごとに Skills を制限する">
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

    - デフォルトで Skills を無制限にするには、`agents.defaults.skills` を省略します。
    - デフォルトを継承するには、`agents.list[].skills` を省略します。
    - Skills なしにするには、`agents.list[].skills: []` を設定します。
    - [Skills](/ja-JP/tools/skills)、[Skills 設定](/ja-JP/tools/skills-config)、および
      [設定リファレンス](/ja-JP/gateway/config-agents#agents-defaults-skills)を参照してください。

  </Accordion>

  <Accordion title="Gateway チャンネルのヘルス監視を調整する">
    古くなったように見えるチャンネルを Gateway がどの程度積極的に再起動するかを制御します:

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

    - ヘルス監視による再起動をグローバルに無効化するには、`gateway.channelHealthCheckMinutes: 0` を設定します。
    - `channelStaleEventThresholdMinutes` はチェック間隔以上にする必要があります。
    - グローバル監視を無効化せずに 1 つのチャンネルまたはアカウントの自動再起動を無効化するには、`channels.<provider>.healthMonitor.enabled` または `channels.<provider>.accounts.<id>.healthMonitor.enabled` を使用します。
    - 運用デバッグについては[ヘルスチェック](/ja-JP/gateway/health)を、すべてのフィールドについては[完全なリファレンス](/ja-JP/gateway/configuration-reference#gateway)を参照してください。

  </Accordion>

  <Accordion title="Gateway WebSocket ハンドシェイクタイムアウトを調整する">
    負荷の高いホストや低性能ホストで、ローカルクライアントが認証前の WebSocket ハンドシェイクを完了する時間を長くします:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - デフォルトは `15000` ミリ秒です。
    - 一時的なサービスまたはシェルの上書きでは、`OPENCLAW_HANDSHAKE_TIMEOUT_MS` が引き続き優先されます。
    - まず起動時/イベントループの停止を修正することを優先してください。このノブは、正常だがウォームアップ中に遅いホスト向けです。

  </Accordion>

  <Accordion title="セッションとリセットを設定する">
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
    - `threadBindings`: スレッド紐付けセッションルーティングのグローバルデフォルト (Discord は `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` をサポートします)。
    - スコープ、ID リンク、送信ポリシーについては[セッション管理](/ja-JP/concepts/session)を参照してください。
    - すべてのフィールドについては[完全なリファレンス](/ja-JP/gateway/config-agents#session)を参照してください。

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

    まずイメージをビルドします。ソースチェックアウトからは `scripts/sandbox-setup.sh` を実行し、npm インストールからは [サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup) にあるインラインの `docker build` コマンドを参照してください。

    完全なガイドは [サンドボックス化](/ja-JP/gateway/sandboxing) を、すべてのオプションは [完全なリファレンス](/ja-JP/gateway/config-agents#agentsdefaultssandbox) を参照してください。

  </Accordion>

  <Accordion title="公式 iOS ビルド向けのリレー支援プッシュを有効にする">
    リレー支援プッシュは `openclaw.json` で設定します。

    Gateway 設定でこれを設定します。

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

    これが行うこと:

    - Gateway が外部リレー経由で `push.test`、ウェイク通知、再接続ウェイクを送信できるようにします。
    - ペアリング済み iOS アプリから転送される登録スコープの送信権限を使用します。Gateway はデプロイ全体のリレートークンを必要としません。
    - 各リレー支援登録を iOS アプリがペアリングした Gateway ID にバインドするため、別の Gateway は保存済み登録を再利用できません。
    - ローカルまたは手動の iOS ビルドでは直接 APNs を使い続けます。リレー支援送信は、リレー経由で登録された公式配布ビルドにのみ適用されます。
    - 公式/TestFlight iOS ビルドに組み込まれたリレーベース URL と一致している必要があります。これにより、登録トラフィックと送信トラフィックが同じリレーデプロイメントに到達します。

    エンドツーエンドの流れ:

    1. 同じリレーベース URL でコンパイルされた公式/TestFlight iOS ビルドをインストールします。
    2. Gateway で `gateway.push.apns.relay.baseUrl` を設定します。
    3. iOS アプリを Gateway にペアリングし、ノードセッションとオペレーターセッションの両方を接続させます。
    4. iOS アプリが Gateway ID を取得し、App Attest とアプリレシートを使ってリレーに登録し、その後、リレー支援の `push.apns.register` ペイロードをペアリング済み Gateway に公開します。
    5. Gateway はリレーハンドルと送信権限を保存し、それらを `push.test`、ウェイク通知、再接続ウェイクに使用します。

    運用上の注意:

    - iOS アプリを別の Gateway に切り替える場合は、その Gateway にバインドされた新しいリレー登録を公開できるようにアプリを再接続してください。
    - 別のリレーデプロイメントを指す新しい iOS ビルドを配布する場合、アプリは古いリレーオリジンを再利用せず、キャッシュ済みのリレー登録を更新します。

    互換性に関する注意:

    - `OPENCLAW_APNS_RELAY_BASE_URL` と `OPENCLAW_APNS_RELAY_TIMEOUT_MS` は、一時的な環境変数オーバーライドとして引き続き機能します。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` は、local loopback 専用の開発用退避手段のままです。HTTP リレー URL を設定に永続化しないでください。

    エンドツーエンドの流れについては [iOS アプリ](/ja-JP/platforms/ios#relay-backed-push-for-official-builds) を、リレーのセキュリティモデルについては [認証と信頼フロー](/ja-JP/platforms/ios#authentication-and-trust-flow) を参照してください。

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

    - `every`: 期間文字列（`30m`、`2h`）。無効にするには `0m` を設定します。
    - `target`: `last` | `none` | `<channel-id>`（例: `discord`、`matrix`、`telegram`、`whatsapp`）
    - `directPolicy`: DM 形式の Heartbeat ターゲットでは `allow`（デフォルト）または `block`
    - 完全なガイドは [Heartbeat](/ja-JP/gateway/heartbeat) を参照してください。

  </Accordion>

  <Accordion title="Cron ジョブを設定する">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: 完了した分離実行セッションを `sessions.json` から削除します（デフォルトは `24h`。無効にするには `false` を設定）。
    - `runLog`: サイズと保持行数に基づいて `cron/runs/<jobId>.jsonl` を削除します。
    - 機能概要と CLI 例については [Cron ジョブ](/ja-JP/automation/cron-jobs) を参照してください。

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

    セキュリティに関する注意:
    - すべてのフック/Webhook ペイロード内容を信頼できない入力として扱ってください。
    - 専用の `hooks.token` を使用し、共有 Gateway トークンを再利用しないでください。
    - フック認証はヘッダーのみです（`Authorization: Bearer ...` または `x-openclaw-token`）。クエリ文字列トークンは拒否されます。
    - `hooks.path` は `/` にできません。Webhook の受信は `/hooks` などの専用サブパスに保ってください。
    - 厳密に範囲を限定したデバッグを行う場合を除き、安全でないコンテンツのバイパスフラグ（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`）は無効のままにしてください。
    - `hooks.allowRequestSessionKey` を有効にする場合は、呼び出し元が選択するセッションキーを制限するために `hooks.allowedSessionKeyPrefixes` も設定してください。
    - フック駆動のエージェントでは、強力な最新モデル層と厳格なツールポリシーを推奨します（例: 可能であればメッセージングのみとサンドボックス化）。

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

    バインディングルールとエージェントごとのアクセスプロファイルについては [マルチエージェント](/ja-JP/concepts/multi-agent) と [完全なリファレンス](/ja-JP/gateway/config-agents#multi-agent-routing) を参照してください。

  </Accordion>

  <Accordion title="設定を複数ファイルに分割する（$include）">
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
    - **ファイル配列**: 順番にディープマージされます（後勝ち）
    - **兄弟キー**: include の後にマージされます（含まれた値をオーバーライド）
    - **ネストされた include**: 最大 10 階層までサポートされます
    - **相対パス**: include しているファイルからの相対で解決されます
    - **OpenClaw 所有の書き込み**: `plugins: { $include: "./plugins.json5" }` のような単一ファイル include に裏付けられたトップレベルセクションが 1 つだけ変更される書き込みでは、OpenClaw はその include されたファイルを更新し、`openclaw.json` はそのまま残します
    - **サポートされない書き込みスルー**: ルート include、include 配列、兄弟オーバーライドを伴う include は、設定をフラット化する代わりに、OpenClaw 所有の書き込みとしては失敗クローズになります
    - **閉じ込め**: `$include` パスは `openclaw.json` を保持するディレクトリ配下に解決される必要があります。マシン間またはユーザー間でツリーを共有するには、include が参照できる追加ディレクトリのパスリスト（POSIX では `:`、Windows では `;`）を `OPENCLAW_INCLUDE_ROOTS` に設定します。シンボリックリンクは解決されて再チェックされるため、字句上は設定ディレクトリ内にあっても、実際のターゲットが許可されたすべてのルートから外れるパスは引き続き拒否されます。
    - **エラー処理**: ファイル欠落、解析エラー、循環 include に対して明確なエラーを表示します

  </Accordion>
</AccordionGroup>

## 設定のホットリロード

Gateway は `~/.openclaw/openclaw.json` を監視し、変更を自動的に適用します。ほとんどの設定では手動再起動は不要です。

直接のファイル編集は、検証されるまで信頼できないものとして扱われます。ウォッチャーはエディターの一時書き込み/リネームの変動が落ち着くのを待ち、最終ファイルを読み取り、無効な外部編集は `openclaw.json` を書き換えずに拒否します。OpenClaw 所有の設定書き込みは、書き込み前に同じスキーマゲートを使用します。`gateway.mode` の削除や、ファイルサイズが半分未満に縮小されるような破壊的な上書きは拒否され、検査用に `.rejected.*` として保存されます。

`config reload skipped (invalid config)` が表示される、または起動時に `Invalid
config` が報告される場合は、設定を確認し、`openclaw config validate` を実行してから、修復のために `openclaw
doctor --fix` を実行してください。チェックリストは [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-rejected-invalid-config) を参照してください。

### リロードモード

| モード                   | 動作                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`**（デフォルト） | 安全な変更を即座にホット適用します。重要な変更では自動的に再起動します。           |
| **`hot`**              | 安全な変更のみをホット適用します。再起動が必要な場合は警告をログに記録します。対応は手動です。 |
| **`restart`**          | 安全かどうかに関係なく、設定変更時に Gateway を再起動します。                                 |
| **`off`**              | ファイル監視を無効にします。変更は次回の手動再起動で有効になります。                 |

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
| チャンネル            | `channels.*`, `web`（WhatsApp）— すべての組み込みおよび Plugin チャンネル | いいえ              |
| エージェントとモデル      | `agent`, `agents`, `models`, `routing`                            | いいえ              |
| 自動化          | `hooks`, `cron`, `agent.heartbeat`                                | いいえ              |
| セッションとメッセージ | `session`, `messages`                                             | いいえ              |
| ツールとメディア       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | いいえ              |
| UI とその他           | `ui`, `logging`, `identity`, `bindings`                           | いいえ              |
| Gateway サーバー      | `gateway.*`（ポート、バインド、認証、tailscale、TLS、HTTP）              | **はい**         |
| インフラストラクチャ      | `discovery`, `canvasHost`, `plugins`                              | **はい**         |

<Note>
`gateway.reload` と `gateway.remote` は例外です。これらを変更しても再起動はトリガーされません。
</Note>

### リロード計画

`$include` を通じて参照されているソースファイルを編集すると、OpenClaw はフラット化されたメモリ内ビューではなく、ソースとして記述されたレイアウトからリロードを計画します。これにより、`plugins: { $include: "./plugins.json5" }` のように単一のトップレベルセクションが独自のインクルードファイルにある場合でも、ホットリロードの判断（ホット適用か再起動か）が予測可能になります。ソースレイアウトが曖昧な場合、リロード計画は安全側に倒して失敗します。

## 設定 RPC（プログラムによる更新）

Gateway API 経由で設定を書き込むツールでは、次の流れを推奨します。

- `config.schema.lookup` で 1 つのサブツリーを調べる（浅いスキーマノード + 子の概要）
- `config.get` で現在のスナップショットと `hash` を取得する
- `config.patch` で部分更新を行う（JSON merge patch: オブジェクトはマージ、`null` は削除、配列は置換）
- 設定全体を置き換える意図がある場合にのみ `config.apply` を使う
- 明示的な自己更新と再起動には `update.run` を使う。再起動後のセッションで 1 回の後続ターンを実行する必要がある場合は `continuationMessage` を含める
- 最新の更新再起動センチネルを調べ、再起動後に実行中のバージョンを確認するには `update.status` を使う

エージェントは、正確なフィールドレベルのドキュメントと制約を確認する最初の場所として `config.schema.lookup` を扱うべきです。より広い設定マップ、デフォルト、または専用サブシステムリファレンスへのリンクが必要な場合は、[設定リファレンス](/ja-JP/gateway/configuration-reference)を使用してください。

<Note>
コントロールプレーンの書き込み（`config.apply`、`config.patch`、`update.run`）は、`deviceId+clientIp` ごとに 60 秒あたり 3 リクエストにレート制限されます。再起動リクエストは統合され、その後、再起動サイクル間に 30 秒のクールダウンが適用されます。`update.status` は読み取り専用ですが、再起動センチネルに更新ステップの概要やコマンド出力の末尾が含まれる場合があるため、管理者スコープです。
</Note>

部分パッチの例:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` と `config.patch` はどちらも `raw`、`baseHash`、`sessionKey`、`note`、`restartDelayMs` を受け付けます。設定がすでに存在する場合、両方のメソッドで `baseHash` が必須です。

## 環境変数

OpenClaw は親プロセスに加えて、次から環境変数を読み取ります。

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

<Accordion title="シェル環境のインポート（任意）">
  有効化されており、期待されるキーが設定されていない場合、OpenClaw はログインシェルを実行し、不足しているキーのみをインポートします。

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

環境変数での同等設定: `OPENCLAW_LOAD_SHELL_ENV=1`
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

- 一致するのは大文字の名前のみ: `[A-Z_][A-Z0-9_]*`
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

SecretRef の詳細（`env`/`file`/`exec` 用の `secrets.providers` を含む）は [シークレット管理](/ja-JP/gateway/secrets) にあります。サポートされる認証情報パスは [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface) に一覧化されています。
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
