---
read_when:
    - 初めて OpenClaw を設定する
    - 一般的な設定パターンを探す
    - 特定の設定セクションへの移動
summary: '設定の概要: よく使うタスク、クイックセットアップ、完全なリファレンスへのリンク'
title: 設定
x-i18n:
    generated_at: "2026-05-06T05:04:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 42de21fc7e113feffe38fe1a748430f7e59e7abaf2c18ef6f388533b1aca5c0e
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw は、任意の <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> 設定を `~/.openclaw/openclaw.json` から読み取ります。
アクティブな設定パスは通常ファイルである必要があります。シンボリックリンクされた `openclaw.json`
レイアウトは、OpenClaw が所有する書き込みではサポートされません。アトミック書き込みにより、
シンボリックリンクを保持する代わりにそのパスが置き換えられる場合があります。設定を
デフォルトの状態ディレクトリ外に置く場合は、`OPENCLAW_CONFIG_PATH` を実ファイルに直接指定してください。

ファイルがない場合、OpenClaw は安全なデフォルトを使用します。設定を追加する一般的な理由:

- チャンネルを接続し、bot にメッセージを送れるユーザーを制御する
- モデル、ツール、サンドボックス化、または自動化（cron、フック）を設定する
- セッション、メディア、ネットワーク、または UI を調整する

利用可能なすべてのフィールドについては、[完全なリファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

エージェントと自動化は、設定を編集する前に `config.schema.lookup` を使ってフィールド単位の
正確なドキュメントを確認してください。このページはタスク指向のガイダンスとして使用し、
より広範なフィールドマップとデフォルトについては
[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

<Tip>
**設定が初めてですか?** 対話型セットアップには `openclaw onboard` から始めるか、完全なコピー&ペースト可能な設定については [設定例](/ja-JP/gateway/configuration-examples)ガイドを確認してください。
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
    [http://127.0.0.1:18789](http://127.0.0.1:18789) を開き、**設定**タブを使用します。
    Control UI はライブ設定スキーマからフォームをレンダリングします。フィールドの
    `title` / `description` ドキュメントメタデータに加え、利用可能な場合は Plugin とチャンネルのスキーマも含まれ、
    退避手段として **Raw JSON** エディタがあります。ドリルダウン
    UI やその他のツール向けに、Gateway は `config.schema.lookup` も公開しており、
    パス単位のスキーマノード 1 つと、その直下の子要素の要約を取得できます。
  </Tab>
  <Tab title="Direct edit">
    `~/.openclaw/openclaw.json` を直接編集します。Gateway はファイルを監視し、変更を自動的に適用します（[ホットリロード](#config-hot-reload)を参照）。
  </Tab>
</Tabs>

## 厳密な検証

<Warning>
OpenClaw は、スキーマに完全に一致する設定のみを受け入れます。不明なキー、不正な型、または無効な値があると、Gateway は**起動を拒否**します。ルートレベルで唯一の例外は `$schema`（文字列）で、エディタが JSON Schema メタデータを添付できるようにするためのものです。
</Warning>

`openclaw config schema` は、Control UI と検証で使用される正規の JSON Schema を出力します。
`config.schema.lookup` は、ドリルダウンツール向けに、パス単位のノード 1 つと
子要素の要約を取得します。フィールドの `title`/`description` ドキュメントメタデータは、
ネストされたオブジェクト、ワイルドカード（`*`）、配列項目（`[]`）、および `anyOf`/
`oneOf`/`allOf` 分岐に引き継がれます。マニフェストレジストリが読み込まれている場合は、
ランタイムの Plugin とチャンネルのスキーマがマージされます。

検証に失敗した場合:

- Gateway は起動しません
- 診断コマンドのみ動作します（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 正確な問題を確認するには `openclaw doctor` を実行します
- 修復を適用するには `openclaw doctor --fix`（または `--yes`）を実行します

Gateway は、起動が成功するたびに信頼済みの直近正常コピーを保持しますが、
起動時とホットリロード時にそれを自動復元することはありません。`openclaw.json` が
検証に失敗した場合（Plugin ローカルの検証を含む）、Gateway の起動は失敗するか、
リロードがスキップされ、現在のランタイムは最後に受け入れられた設定を保持します。
プレフィックス付きまたは上書きされた設定を修復するか、直近正常コピーを復元するには
`openclaw doctor --fix`（または `--yes`）を実行します。候補に `***` のような
秘匿済みシークレットプレースホルダーが含まれている場合、直近正常コピーへの昇格はスキップされます。

## 一般的なタスク

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    各チャンネルには `channels.<provider>` の下に独自の設定セクションがあります。セットアップ手順については、専用のチャンネルページを参照してください:

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

    - `agents.defaults.models` はモデルカタログを定義し、`/model` の許可リストとして機能します。
    - 既存のモデルを削除せずに許可リストのエントリを追加するには、`openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使用します。エントリを削除することになる通常の置換は、`--replace` を渡さない限り拒否されます。
    - モデル参照は `provider/model` 形式を使用します（例: `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` は transcript/tool 画像のダウンスケーリングを制御します（デフォルトは `1200`）。値を下げると、スクリーンショットが多い実行で通常は vision-token 使用量が減ります。
    - チャット内でのモデル切り替えについては [モデル CLI](/ja-JP/concepts/models) を、認証ローテーションとフォールバック動作については [モデルフェイルオーバー](/ja-JP/concepts/model-failover) を参照してください。
    - カスタム/セルフホストプロバイダーについては、リファレンス内の[カスタムプロバイダー](/ja-JP/gateway/config-tools#custom-providers-and-base-urls)を参照してください。

  </Accordion>

  <Accordion title="bot にメッセージを送信できるユーザーを制御する">
    DM アクセスは、`dmPolicy` を使ってチャネルごとに制御します。

    - `"pairing"`（デフォルト）: 不明な送信者には承認用の一回限りのペアリングコードが送られる
    - `"allowlist"`: `allowFrom` 内の送信者（またはペアリング済みの許可ストア）のみ
    - `"open"`: すべての受信 DM を許可する（`allowFrom: ["*"]` が必要）
    - `"disabled"`: すべての DM を無視する

    グループには、`groupPolicy` + `groupAllowFrom`、またはチャネル固有の許可リストを使用します。

    チャネルごとの詳細は[完全なリファレンス](/ja-JP/gateway/config-channels#dm-and-group-access)を参照してください。

  </Accordion>

  <Accordion title="グループチャットのメンションゲートを設定する">
    グループメッセージはデフォルトで**メンション必須**です。agent ごとにトリガーパターンを設定し、従来の自動最終返信を意図的に使いたい場合を除き、表示されるルーム返信はデフォルトの message-tool パスのままにします。

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

    - **メタデータメンション**: ネイティブの @ メンション（WhatsApp のタップでメンション、Telegram の @bot など）
    - **テキストパターン**: `mentionPatterns` 内の安全な正規表現パターン
    - **表示される返信**: `messages.visibleReplies` で message-tool 送信をグローバルに必須にできます。`messages.groupChat.visibleReplies` はグループ/チャネルでそれを上書きします。
    - 表示される返信モード、チャネルごとの上書き、セルフチャットモードについては、[完全なリファレンス](/ja-JP/gateway/config-channels#group-chat-mention-gating)を参照してください。

  </Accordion>

  <Accordion title="agent ごとに Skills を制限する">
    共有ベースラインには `agents.defaults.skills` を使用し、その後、特定の
    agent を `agents.list[].skills` で上書きします。

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

  <Accordion title="Gateway チャネルのヘルス監視を調整する">
    古くなったように見えるチャネルを Gateway がどの程度積極的に再起動するかを制御します。

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

    - ヘルス監視による再起動をグローバルに無効にするには、`gateway.channelHealthCheckMinutes: 0` を設定します。
    - `channelStaleEventThresholdMinutes` はチェック間隔以上にする必要があります。
    - グローバル監視を無効にせずに、1 つのチャネルまたはアカウントの自動再起動を無効にするには、`channels.<provider>.healthMonitor.enabled` または `channels.<provider>.accounts.<id>.healthMonitor.enabled` を使用します。
    - 運用上のデバッグについては[ヘルスチェック](/ja-JP/gateway/health)を、すべてのフィールドについては[完全なリファレンス](/ja-JP/gateway/configuration-reference#gateway)を参照してください。

  </Accordion>

  <Accordion title="Gateway WebSocket ハンドシェイクのタイムアウトを調整する">
    負荷が高いホストや低消費電力ホストで、ローカルクライアントが認証前の WebSocket ハンドシェイクを完了するための時間を増やします。

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - デフォルトは `15000` ミリ秒です。
    - その場限りのサービスまたはシェルでの上書きでは、引き続き `OPENCLAW_HANDSHAKE_TIMEOUT_MS` が優先されます。
    - まず起動時やイベントループの停止を修正することを優先してください。このノブは、正常だがウォームアップ中に遅いホスト向けです。

  </Accordion>

  <Accordion title="セッションとリセットを設定する">
    セッションは会話の継続性と分離を制御します。

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

    - `dmScope`: `main`（共有）| `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: スレッドに紐づくセッションルーティングのグローバルデフォルト（Discord は `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` をサポートします）。
    - スコープ、ID リンク、送信ポリシーについては[セッション管理](/ja-JP/concepts/session)を参照してください。
    - すべてのフィールドについては[完全なリファレンス](/ja-JP/gateway/config-agents#session)を参照してください。

  </Accordion>

  <Accordion title="サンドボックス化を有効化">
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

    まずイメージをビルドします。ソースチェックアウトからは `scripts/sandbox-setup.sh` を実行し、npm インストールからは [サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup) のインライン `docker build` コマンドを参照してください。

    完全なガイドは [サンドボックス化](/ja-JP/gateway/sandboxing)、すべてのオプションは [完全なリファレンス](/ja-JP/gateway/config-agents#agentsdefaultssandbox) を参照してください。

  </Accordion>

  <Accordion title="公式 iOS ビルド向けのリレー経由プッシュを有効化">
    リレー経由プッシュは `openclaw.json` で設定します。

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

    これにより行われること:

    - Gateway が外部リレー経由で `push.test`、ウェイクの促し、再接続ウェイクを送信できるようにします。
    - ペアリング済み iOS アプリによって転送された、登録スコープの送信許可を使用します。Gateway はデプロイメント全体のリレートークンを必要としません。
    - 各リレー経由登録を、iOS アプリがペアリングした Gateway ID にバインドするため、別の Gateway は保存済み登録を再利用できません。
    - ローカル/手動の iOS ビルドは直接 APNs のままにします。リレー経由送信は、リレー経由で登録された公式配布ビルドにのみ適用されます。
    - 登録トラフィックと送信トラフィックが同じリレーデプロイメントに届くように、公式/TestFlight iOS ビルドに組み込まれたリレーベース URL と一致している必要があります。

    エンドツーエンドのフロー:

    1. 同じリレーベース URL でコンパイルされた公式/TestFlight iOS ビルドをインストールします。
    2. Gateway で `gateway.push.apns.relay.baseUrl` を設定します。
    3. iOS アプリを Gateway にペアリングし、node セッションと operator セッションの両方を接続させます。
    4. iOS アプリは Gateway ID を取得し、App Attest とアプリレシートを使ってリレーに登録した後、リレー経由の `push.apns.register` ペイロードをペアリング済み Gateway に公開します。
    5. Gateway はリレーハンドルと送信許可を保存し、それらを `push.test`、ウェイクの促し、再接続ウェイクに使用します。

    運用上の注意:

    - iOS アプリを別の Gateway に切り替える場合は、その Gateway にバインドされた新しいリレー登録を公開できるようにアプリを再接続してください。
    - 別のリレーデプロイメントを指す新しい iOS ビルドを出荷する場合、アプリは古いリレーオリジンを再利用せず、キャッシュ済みリレー登録を更新します。

    互換性に関する注意:

    - `OPENCLAW_APNS_RELAY_BASE_URL` と `OPENCLAW_APNS_RELAY_TIMEOUT_MS` は、一時的な環境変数オーバーライドとして引き続き機能します。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` は local loopback 限定の開発用エスケープハッチのままです。HTTP リレー URL を設定に永続化しないでください。

    エンドツーエンドのフローは [iOS アプリ](/ja-JP/platforms/ios#relay-backed-push-for-official-builds)、リレーのセキュリティモデルは [認証と信頼フロー](/ja-JP/platforms/ios#authentication-and-trust-flow) を参照してください。

  </Accordion>

  <Accordion title="Heartbeat（定期チェックイン）を設定">
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
    - `directPolicy`: DM スタイルの Heartbeat ターゲットに対して `allow`（デフォルト）または `block`
    - 完全なガイドは [Heartbeat](/ja-JP/gateway/heartbeat) を参照してください。

  </Accordion>

  <Accordion title="Cron ジョブを設定">
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
    - `runLog`: `cron/runs/<jobId>.jsonl` をサイズと保持行数で削除します。
    - 機能の概要と CLI 例は [Cron ジョブ](/ja-JP/automation/cron-jobs) を参照してください。

  </Accordion>

  <Accordion title="Webhooks（hooks）を設定">
    Gateway で HTTP webhook エンドポイントを有効にします。

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
    - すべての hook/webhook ペイロード内容を信頼できない入力として扱ってください。
    - 専用の `hooks.token` を使用してください。共有 Gateway トークンを再利用しないでください。
    - Hook 認証はヘッダーのみです（`Authorization: Bearer ...` または `x-openclaw-token`）。クエリ文字列トークンは拒否されます。
    - `hooks.path` は `/` にできません。webhook の受信は `/hooks` などの専用サブパスにしてください。
    - 厳密にスコープを絞ったデバッグを行う場合を除き、安全でないコンテンツのバイパスフラグ（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`）は無効のままにしてください。
    - `hooks.allowRequestSessionKey` を有効にする場合は、呼び出し元が選択するセッションキーを制限するために `hooks.allowedSessionKeyPrefixes` も設定してください。
    - hook 駆動エージェントでは、強力で新しいモデルティアと厳格なツールポリシーを優先してください（例: メッセージングのみ、可能ならサンドボックス化も使用）。

    すべてのマッピングオプションと Gmail 連携については [完全なリファレンス](/ja-JP/gateway/configuration-reference#hooks) を参照してください。

  </Accordion>

  <Accordion title="マルチエージェントルーティングを設定">
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

    バインディングルールとエージェントごとのアクセスプロファイルについては、[マルチエージェント](/ja-JP/concepts/multi-agent) と [完全なリファレンス](/ja-JP/gateway/config-agents#multi-agent-routing) を参照してください。

  </Accordion>

  <Accordion title="設定を複数ファイルに分割（$include）">
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
    - **ファイル配列**: 順番にディープマージされます（後のものが優先）
    - **兄弟キー**: include 後にマージされます（include された値を上書き）
    - **ネストされた include**: 最大 10 レベルの深さまで対応
    - **相対パス**: include しているファイルからの相対パスとして解決されます
    - **OpenClaw 所有の書き込み**: 書き込みが `plugins: { $include: "./plugins.json5" }` のような単一ファイル include によって裏付けられたトップレベルセクション 1 つだけを変更する場合、OpenClaw はその include 先ファイルを更新し、`openclaw.json` はそのままにします
    - **未対応の書き込みスルー**: ルート include、include 配列、兄弟キーによる上書きを持つ include は、OpenClaw 所有の書き込みに対して、設定をフラット化する代わりにフェイルクローズします
    - **閉じ込め**: `$include` パスは `openclaw.json` を保持するディレクトリ配下に解決される必要があります。複数のマシンまたはユーザー間でツリーを共有するには、include が参照できる追加ディレクトリのパスリスト（POSIX では `:`、Windows では `;`）を `OPENCLAW_INCLUDE_ROOTS` に設定します。シンボリックリンクは解決されて再チェックされるため、字句上は設定ディレクトリ内にあるパスでも、実際のターゲットが許可されたすべてのルートから外れる場合は引き続き拒否されます。
    - **エラー処理**: 存在しないファイル、パースエラー、循環 include に対して明確なエラーを出します

  </Accordion>
</AccordionGroup>

## 設定のホットリロード

Gateway は `~/.openclaw/openclaw.json` を監視し、変更を自動的に適用します。ほとんどの設定では手動再起動は不要です。

直接のファイル編集は、検証されるまで信頼できないものとして扱われます。ウォッチャーは、エディターの一時書き込み/リネームの揺れが収まるのを待ち、最終ファイルを読み取り、無効な外部編集を `openclaw.json` に書き戻さずに拒否します。OpenClaw 所有の設定書き込みは、書き込み前に同じスキーマゲートを使用します。`gateway.mode` の削除やファイルサイズを半分未満に縮小するような破壊的な上書きは拒否され、検査用に `.rejected.*` として保存されます。

`config reload skipped (invalid config)` が表示される場合、または起動時に `Invalid config` が報告される場合は、設定を確認し、`openclaw config validate` を実行してから、修復のために `openclaw doctor --fix` を実行してください。チェックリストは [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-rejected-invalid-config) を参照してください。

### リロードモード

| モード                 | 動作                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`**（デフォルト） | 安全な変更を即座にホット適用します。重要な変更では自動的に再起動します。           |
| **`hot`**              | 安全な変更のみをホット適用します。再起動が必要な場合は警告をログに出します。対応は自分で行います。 |
| **`restart`**          | 安全かどうかにかかわらず、設定変更時に Gateway を再起動します。                                 |
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

| カテゴリ            | フィールド                                                        | 再起動が必要? |
| ------------------- | ----------------------------------------------------------------- | ------------- |
| チャンネル          | `channels.*`, `web`（WhatsApp）- すべての組み込みおよび Plugin チャンネル | いいえ        |
| エージェントとモデル | `agent`, `agents`, `models`, `routing`                            | いいえ        |
| 自動化              | `hooks`, `cron`, `agent.heartbeat`                                | いいえ        |
| セッションとメッセージ | `session`, `messages`                                             | いいえ        |
| ツールとメディア    | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | いいえ        |
| UI とその他         | `ui`, `logging`, `identity`, `bindings`                           | いいえ        |
| Gateway サーバー    | `gateway.*`（ポート、バインド、認証、tailscale、TLS、HTTP）       | **はい**      |
| インフラストラクチャ | `discovery`, `canvasHost`, `plugins`                              | **はい**      |

<Note>
`gateway.reload` と `gateway.remote` は例外です。これらを変更しても再起動はトリガーされません。
</Note>

### リロード計画

`$include` を通じて参照されるソースファイルを編集すると、OpenClaw は
フラット化されたメモリ内ビューではなく、ソースで記述されたレイアウトからリロードを計画します。
これにより、`plugins: { $include: "./plugins.json5" }` のように
単一のトップレベルセクションが独自のインクルードファイルにある場合でも、
ホットリロードの判断（ホット適用か再起動か）が予測しやすくなります。
ソースレイアウトが曖昧な場合、リロード計画は安全側に倒れて失敗します。

## 設定 RPC（プログラムによる更新）

Gateway API 経由で設定を書き込むツールでは、次の流れを推奨します。

- `config.schema.lookup` で 1 つのサブツリーを確認する（浅いスキーマノード + 子の
  概要）
- `config.get` で現在のスナップショットと `hash` を取得する
- `config.patch` で部分更新する（JSON merge patch: オブジェクトはマージ、`null`
  は削除、配列は置換）
- 設定全体を置き換える意図がある場合のみ `config.apply` を使う
- 明示的なセルフアップデートと再起動には `update.run` を使う。再起動後のセッションで後続の 1 ターンを実行する必要がある場合は `continuationMessage` を含める
- 最新の更新再起動センチネルを確認し、再起動後に実行中のバージョンを検証するには `update.status` を使う

エージェントは、正確なフィールド単位のドキュメントと制約を確認する最初の場所として
`config.schema.lookup` を扱うべきです。より広い設定マップ、デフォルト、または専用
サブシステム参照へのリンクが必要な場合は、[設定リファレンス](/ja-JP/gateway/configuration-reference)
を使用してください。

<Note>
コントロールプレーンの書き込み（`config.apply`、`config.patch`、`update.run`）は、
`deviceId+clientIp` ごとに 60 秒あたり 3 リクエストにレート制限されます。再起動
リクエストは統合され、その後、再起動サイクル間に 30 秒のクールダウンを適用します。
`update.status` は読み取り専用ですが、再起動センチネルに更新ステップの概要やコマンド出力の末尾が
含まれる可能性があるため、管理者スコープです。
</Note>

部分パッチの例:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` と `config.patch` はどちらも `raw`、`baseHash`、`sessionKey`、
`note`、`restartDelayMs` を受け取ります。設定がすでに存在する場合、`baseHash` は
両方のメソッドで必須です。

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
  有効化されていて、想定されるキーが設定されていない場合、OpenClaw はログインシェルを実行し、不足しているキーのみをインポートします。

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

環境変数での同等指定: `OPENCLAW_LOAD_SHELL_ENV=1`
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
- 欠落または空の変数は読み込み時にエラーを投げる
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

SecretRef の詳細（`env`/`file`/`exec` 用の `secrets.providers` を含む）は [シークレット管理](/ja-JP/gateway/secrets) にあります。
サポートされる認証情報パスは [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface) に一覧されています。
</Accordion>

完全な優先順位とソースについては [環境](/ja-JP/help/environment) を参照してください。

## 完全なリファレンス

フィールドごとの完全なリファレンスについては、**[設定リファレンス](/ja-JP/gateway/configuration-reference)** を参照してください。

---

_関連: [設定例](/ja-JP/gateway/configuration-examples) · [設定リファレンス](/ja-JP/gateway/configuration-reference) · [Doctor](/ja-JP/gateway/doctor)_

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [設定例](/ja-JP/gateway/configuration-examples)
- [Gateway ランブック](/ja-JP/gateway)
