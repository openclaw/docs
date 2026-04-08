---
read_when:
    - OpenClaw を初めて設定するとき
    - 一般的な設定パターンを探しているとき
    - 特定の設定セクションに移動したいとき
summary: 設定の概要：一般的なタスク、クイックセットアップ、完全なリファレンスへのリンク
title: 設定
x-i18n:
    generated_at: "2026-04-08T06:02:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 199a1e515bd4003319e71593a2659bb883299a76ff67e273d92583df03c96604
    source_path: gateway/configuration.md
    workflow: 15
---

# 設定

OpenClaw は `~/.openclaw/openclaw.json` から任意の <Tooltip tip="JSON5 はコメントと末尾カンマをサポートします">**JSON5**</Tooltip> 設定を読み込みます。

ファイルが存在しない場合、OpenClaw は安全なデフォルト設定を使用します。設定を追加する一般的な理由は次のとおりです。

- チャンネルを接続し、誰がボットにメッセージを送れるかを制御する
- モデル、ツール、サンドボックス化、または自動化（cron、hooks）を設定する
- セッション、メディア、ネットワーク、または UI を調整する

利用可能なすべてのフィールドについては、[完全なリファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

<Tip>
**設定が初めてですか？** 対話形式のセットアップには `openclaw onboard` から始めるか、完全なコピーペースト用設定を掲載した[設定例](/ja-JP/gateway/configuration-examples)ガイドを確認してください。
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
  <Tab title="CLI（ワンライナー）">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) を開き、**Config** タブを使用します。
    Control UI は、利用可能な場合はフィールドの
    `title` / `description` ドキュメントメタデータに加えて、プラグインとチャンネルのスキーマも含めて、
    ライブ設定スキーマからフォームをレンダリングし、
    逃げ道として **Raw JSON** エディターも提供します。詳細確認用の
    UI やその他のツール向けに、gateway は `config.schema.lookup` も公開しており、
    1 つのパス範囲のスキーマノードと、その直下の子サマリーを取得できます。
  </Tab>
  <Tab title="直接編集">
    `~/.openclaw/openclaw.json` を直接編集します。Gateway はファイルを監視し、自動的に変更を適用します（[ホットリロード](#config-hot-reload)を参照）。
  </Tab>
</Tabs>

## 厳格な検証

<Warning>
OpenClaw は、スキーマに完全に一致する設定のみを受け付けます。不明なキー、不正な型、または無効な値があると、Gateway は**起動を拒否**します。唯一のルートレベル例外は `$schema`（文字列）で、エディターが JSON Schema メタデータを付与できるようにするためのものです。
</Warning>

スキーマツールに関する注意：

- `openclaw config schema` は、Control UI と
  設定検証で使用されるのと同じ JSON Schema ファミリーを出力します。
- そのスキーマ出力は、`openclaw.json` の
  正式な機械可読コントラクトとして扱ってください。この概要と設定リファレンスはそれを要約したものです。
- フィールドの `title` と `description` の値は、
  エディターやフォームツール向けにスキーマ出力へ引き継がれます。
- ネストされたオブジェクト、ワイルドカード（`*`）、配列項目（`[]`）のエントリーは、
  一致するフィールドドキュメントが存在する場合、同じ
  ドキュメントメタデータを継承します。
- `anyOf` / `oneOf` / `allOf` の合成ブランチも同じドキュメント
  メタデータを継承するため、union / intersection の各バリアントでも同じフィールドヘルプが維持されます。
- `config.schema.lookup` は、正規化された 1 つの設定パスと、
  浅いスキーマノード（`title`、`description`、`type`、`enum`、`const`、一般的な境界、
  および類似の検証フィールド）、一致した UI ヒントメタデータ、および
  詳細確認ツール向けの直下の子サマリーを返します。
- 実行時のプラグイン / チャンネルスキーマは、gateway が
  現在のマニフェストレジストリを読み込める場合にマージされます。
- `pnpm config:docs:check` は、ドキュメント向け設定ベースライン
  アーティファクトと現在のスキーマサーフェスのずれを検出します。

検証に失敗した場合：

- Gateway は起動しません
- 診断コマンドのみ動作します（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 正確な問題を確認するには `openclaw doctor` を実行します
- 修復を適用するには `openclaw doctor --fix`（または `--yes`）を実行します

## 一般的なタスク

<AccordionGroup>
  <Accordion title="チャンネルを設定する（WhatsApp、Telegram、Discord など）">
    各チャンネルには、`channels.<provider>` の下に独自の設定セクションがあります。設定手順については、各チャンネル専用ページを参照してください。

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

    すべてのチャンネルは同じ DM ポリシーパターンを共有します。

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

    - `agents.defaults.models` はモデルカタログを定義し、`/model` の許可リストとして機能します。
    - モデル参照には `provider/model` 形式を使用します（例：`anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` は transcript / tool 画像の縮小を制御します（デフォルトは `1200`）。値を小さくすると、スクリーンショットが多い実行で vision-token の使用量が通常は減ります。
    - チャット内でのモデル切り替えについては[Models CLI](/ja-JP/concepts/models)を、認証ローテーションとフォールバック動作については[Model Failover](/ja-JP/concepts/model-failover)を参照してください。
    - カスタム / セルフホスト型プロバイダーについては、リファレンス内の[Custom providers](/ja-JP/gateway/configuration-reference#custom-providers-and-base-urls)を参照してください。

  </Accordion>

  <Accordion title="誰がボットにメッセージを送れるかを制御する">
    DM アクセスは、チャンネルごとに `dmPolicy` で制御されます。

    - `"pairing"`（デフォルト）：未知の送信者は承認用のワンタイムペアリングコードを受け取る
    - `"allowlist"`：`allowFrom` 内の送信者（またはペア済み許可ストア）のみ
    - `"open"`：すべての受信 DM を許可する（`allowFrom: ["*"]` が必要）
    - `"disabled"`：すべての DM を無視する

    グループについては、`groupPolicy` + `groupAllowFrom` またはチャンネル固有の許可リストを使用します。

    チャンネルごとの詳細は、[完全なリファレンス](/ja-JP/gateway/configuration-reference#dm-and-group-access)を参照してください。

  </Accordion>

  <Accordion title="グループチャットのメンション制御を設定する">
    グループメッセージはデフォルトで**メンション必須**です。エージェントごとにパターンを設定します。

    ```json5
    {
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

    - **メタデータメンション**：ネイティブの @-mention（WhatsApp のタップしてメンション、Telegram の @bot など）
    - **テキストパターン**：`mentionPatterns` 内の安全な regex パターン
    - チャンネルごとの上書きと self-chat モードについては、[完全なリファレンス](/ja-JP/gateway/configuration-reference#group-chat-mention-gating)を参照してください。

  </Accordion>

  <Accordion title="エージェントごとに Skills を制限する">
    共通のベースラインには `agents.defaults.skills` を使い、その後
    `agents.list[].skills` で特定の
    エージェントを上書きします。

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
    - Skills をなしにするには、`agents.list[].skills: []` を設定します。
    - [Skills](/ja-JP/tools/skills)、[Skills 設定](/ja-JP/tools/skills-config)、および
      [設定リファレンス](/ja-JP/gateway/configuration-reference#agentsdefaultsskills)を参照してください。

  </Accordion>

  <Accordion title="gateway のチャンネルヘルス監視を調整する">
    停滞しているように見えるチャンネルを gateway がどの程度積極的に再起動するかを制御します。

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
    - `channelStaleEventThresholdMinutes` は、チェック間隔以上にする必要があります。
    - グローバル監視を無効にせずに特定のチャンネルまたはアカウントの自動再起動を無効にするには、`channels.<provider>.healthMonitor.enabled` または `channels.<provider>.accounts.<id>.healthMonitor.enabled` を使用します。
    - 運用上のデバッグについては[Health Checks](/ja-JP/gateway/health)を、すべてのフィールドについては[完全なリファレンス](/ja-JP/gateway/configuration-reference#gateway)を参照してください。

  </Accordion>

  <Accordion title="セッションとリセットを設定する">
    セッションは、会話の継続性と分離を制御します。

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
    - `threadBindings`: スレッドに紐づくセッションルーティングのグローバルデフォルト（Discord は `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` をサポート）
    - スコープ、ID リンク、送信ポリシーについては[セッション管理](/ja-JP/concepts/session)を参照してください。
    - すべてのフィールドについては[完全なリファレンス](/ja-JP/gateway/configuration-reference#session)を参照してください。

  </Accordion>

  <Accordion title="サンドボックス化を有効にする">
    エージェントセッションを分離された Docker コンテナで実行します。

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

    最初にイメージをビルドします：`scripts/sandbox-setup.sh`

    完全なガイドについては[サンドボックス化](/ja-JP/gateway/sandboxing)を、すべてのオプションについては[完全なリファレンス](/ja-JP/gateway/configuration-reference#agentsdefaultssandbox)を参照してください。

  </Accordion>

  <Accordion title="公式 iOS ビルド向けの relay-backed push を有効にする">
    relay-backed push は `openclaw.json` で設定します。

    gateway 設定に次を指定します。

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

    CLI の同等コマンド：

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    これで行われること：

    - gateway が外部 relay を通じて `push.test`、wake nudges、reconnect wakes を送信できるようになります。
    - ペアリング済み iOS アプリから転送される、登録単位の send grant を使用します。gateway にデプロイ全体用の relay トークンは不要です。
    - 各 relay-backed 登録を、iOS アプリがペアリングした gateway identity に紐づけるため、別の gateway は保存済み登録を再利用できません。
    - ローカル / 手動 iOS ビルドは direct APNs のままです。relay-backed 送信は、relay 経由で登録した公式配布ビルドにのみ適用されます。
    - 公式 / TestFlight iOS ビルドに埋め込まれた relay base URL と一致している必要があります。これにより、登録トラフィックと送信トラフィックが同じ relay デプロイ先に到達します。

    エンドツーエンドのフロー：

    1. 同じ relay base URL でコンパイルされた公式 / TestFlight iOS ビルドをインストールします。
    2. gateway で `gateway.push.apns.relay.baseUrl` を設定します。
    3. iOS アプリを gateway とペアリングし、node セッションと operator セッションの両方を接続します。
    4. iOS アプリは gateway identity を取得し、App Attest とアプリレシートを使って relay に登録した後、relay-backed の `push.apns.register` ペイロードをペアリング済み gateway に公開します。
    5. gateway は relay handle と send grant を保存し、それらを `push.test`、wake nudges、reconnect wakes に使用します。

    運用上の注意：

    - iOS アプリを別の gateway に切り替える場合は、アプリを再接続して、その gateway に紐づいた新しい relay 登録を公開できるようにしてください。
    - 別の relay デプロイ先を指す新しい iOS ビルドを出荷した場合、アプリは古い relay origin を再利用せず、キャッシュされた relay 登録を更新します。

    互換性に関する注意：

    - `OPENCLAW_APNS_RELAY_BASE_URL` と `OPENCLAW_APNS_RELAY_TIMEOUT_MS` は、一時的な env 上書きとして引き続き動作します。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` は loopback 専用の開発用エスケープハッチのままです。HTTP の relay URL を設定に永続化しないでください。

    エンドツーエンドのフローについては[iOS App](/ja-JP/platforms/ios#relay-backed-push-for-official-builds)を、relay のセキュリティモデルについては[Authentication and trust flow](/ja-JP/platforms/ios#authentication-and-trust-flow)を参照してください。

  </Accordion>

  <Accordion title="heartbeat（定期チェックイン）を設定する">
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
    - `target`: `last` | `none` | `<channel-id>`（例：`discord`、`matrix`、`telegram`、または `whatsapp`）
    - `directPolicy`: DM 形式の heartbeat ターゲット向けの `allow`（デフォルト）または `block`
    - 完全なガイドについては[Heartbeat](/ja-JP/gateway/heartbeat)を参照してください。

  </Accordion>

  <Accordion title="cron ジョブを設定する">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: 完了した分離実行セッションを `sessions.json` から削除します（デフォルトは `24h`、無効にするには `false` を設定）。
    - `runLog`: `cron/runs/<jobId>.jsonl` をサイズと保持行数で削除します。
    - 機能概要と CLI の例については[Cron jobs](/ja-JP/automation/cron-jobs)を参照してください。

  </Accordion>

  <Accordion title="webhook（hooks）を設定する">
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

    セキュリティ上の注意：
    - hook / webhook のペイロード内容はすべて信頼できない入力として扱ってください。
    - 専用の `hooks.token` を使用し、共有の Gateway トークンを再利用しないでください。
    - hook 認証はヘッダーのみです（`Authorization: Bearer ...` または `x-openclaw-token`）。クエリ文字列トークンは拒否されます。
    - `hooks.path` を `/` にすることはできません。webhook 受信は `/hooks` のような専用サブパスにしてください。
    - 危険なコンテンツのバイパスフラグ（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`）は、厳密に限定したデバッグを行う場合を除き無効のままにしてください。
    - `hooks.allowRequestSessionKey` を有効にする場合は、呼び出し元が選択できるセッションキーを制限するため、`hooks.allowedSessionKeyPrefixes` も設定してください。
    - hook 駆動エージェントには、強力で現代的なモデル階層と厳格なツールポリシー（たとえば可能であればメッセージング専用 + サンドボックス化）を推奨します。

    すべてのマッピングオプションと Gmail 統合については、[完全なリファレンス](/ja-JP/gateway/configuration-reference#hooks)を参照してください。

  </Accordion>

  <Accordion title="マルチエージェントルーティングを設定する">
    ワークスペースとセッションを分離して、複数の独立したエージェントを実行します。

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

    バインディングルールとエージェントごとのアクセスプロファイルについては、[Multi-Agent](/ja-JP/concepts/multi-agent)と[完全なリファレンス](/ja-JP/gateway/configuration-reference#multi-agent-routing)を参照してください。

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

    - **単一ファイル**：含まれているオブジェクトを置き換えます
    - **ファイル配列**：順番にディープマージされます（後勝ち）
    - **兄弟キー**：include の後にマージされます（含まれた値を上書き）
    - **ネストされた include**：最大 10 階層までサポート
    - **相対パス**：include 元ファイルを基準に解決されます
    - **エラー処理**：ファイル欠落、解析エラー、循環 include に対して明確なエラーを表示します

  </Accordion>
</AccordionGroup>

## 設定ホットリロード

Gateway は `~/.openclaw/openclaw.json` を監視し、自動的に変更を適用します。ほとんどの設定では手動再起動は不要です。

### リロードモード

| モード | 動作 |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`**（デフォルト） | 安全な変更は即座にホット適用します。重要な変更では自動的に再起動します。 |
| **`hot`** | 安全な変更のみをホット適用します。再起動が必要な場合は警告を記録し、対応は自分で行います。 |
| **`restart`** | 安全かどうかにかかわらず、任意の設定変更で Gateway を再起動します。 |
| **`off`** | ファイル監視を無効にします。変更は次回の手動再起動時に反映されます。 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ホット適用されるものと再起動が必要なもの

ほとんどのフィールドは、ダウンタイムなしでホット適用されます。`hybrid` モードでは、再起動が必要な変更は自動的に処理されます。

| カテゴリー | フィールド | 再起動が必要？ |
| ------------------- | -------------------------------------------------------------------- | --------------- |
| Channels | `channels.*`, `web` (WhatsApp) — すべての組み込みチャンネルと拡張チャンネル | いいえ |
| エージェントとモデル | `agent`, `agents`, `models`, `routing` | いいえ |
| 自動化 | `hooks`, `cron`, `agent.heartbeat` | いいえ |
| セッションとメッセージ | `session`, `messages` | いいえ |
| ツールとメディア | `tools`, `browser`, `skills`, `audio`, `talk` | いいえ |
| UI とその他 | `ui`, `logging`, `identity`, `bindings` | いいえ |
| Gateway サーバー | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP) | **はい** |
| インフラ | `discovery`, `canvasHost`, `plugins` | **はい** |

<Note>
`gateway.reload` と `gateway.remote` は例外で、これらを変更しても**再起動は発生しません**。
</Note>

## 設定 RPC（プログラムによる更新）

<Note>
コントロールプレーン書き込み RPC（`config.apply`、`config.patch`、`update.run`）は、`deviceId+clientIp` ごとに **60 秒あたり 3 リクエスト** にレート制限されています。制限されると、RPC は `UNAVAILABLE` を `retryAfterMs` とともに返します。
</Note>

安全な / デフォルトのフロー：

- `config.schema.lookup`: 1 つのパス範囲の設定サブツリーを、浅い
  スキーマノード、一致したヒントメタデータ、および直下の子サマリー付きで確認
- `config.get`: 現在のスナップショット + ハッシュを取得
- `config.patch`: 推奨される部分更新パス
- `config.apply`: 設定全体を置き換える場合のみ
- `update.run`: 明示的な自己更新 + 再起動

設定全体を置き換えない場合は、`config.schema.lookup`
の後に `config.patch` を使うことを推奨します。

<AccordionGroup>
  <Accordion title="config.apply（完全置換）">
    設定全体を検証して書き込み、1 ステップで Gateway を再起動します。

    <Warning>
    `config.apply` は**設定全体**を置き換えます。部分更新には `config.patch` を、単一キーには `openclaw config set` を使用してください。
    </Warning>

    パラメータ：

    - `raw`（文字列）— 設定全体の JSON5 ペイロード
    - `baseHash`（任意）— `config.get` の設定ハッシュ（設定が存在する場合は必須）
    - `sessionKey`（任意）— 再起動後のウェイクアップ ping 用セッションキー
    - `note`（任意）— 再起動センチネル用メモ
    - `restartDelayMs`（任意）— 再起動までの遅延（デフォルトは 2000）

    再起動リクエストは、すでに保留中 / 進行中のものがある場合はまとめられ、再起動サイクル間には 30 秒のクールダウンが適用されます。

    ```bash
    openclaw gateway call config.get --params '{}'  # capture payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch（部分更新）">
    部分更新を既存の設定へマージします（JSON merge patch セマンティクス）。

    - オブジェクトは再帰的にマージ
    - `null` はキーを削除
    - 配列は置換

    パラメータ：

    - `raw`（文字列）— 変更するキーだけを含む JSON5
    - `baseHash`（必須）— `config.get` の設定ハッシュ
    - `sessionKey`、`note`、`restartDelayMs` — `config.apply` と同じ

    再起動動作は `config.apply` と同じです。保留中の再起動はまとめられ、再起動サイクル間には 30 秒のクールダウンがあります。

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## 環境変数

OpenClaw は親プロセスに加えて、以下から env vars を読み込みます。

- 現在の作業ディレクトリにある `.env`（存在する場合）
- `~/.openclaw/.env`（グローバルフォールバック）

どちらのファイルも、既存の env vars を上書きしません。設定内にインライン env vars を指定することもできます。

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="シェル env のインポート（任意）">
  有効な場合で、想定されるキーが設定されていないと、OpenClaw はログインシェルを実行して不足しているキーのみをインポートします。

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Env var の同等設定：`OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="設定値での env var 置換">
  任意の設定文字列値で `${VAR_NAME}` を使って env vars を参照できます。

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

ルール：

- 一致するのは大文字の名前のみです：`[A-Z_][A-Z0-9_]*`
- 不足している / 空の変数は、読み込み時にエラーになります
- リテラル出力には `$${VAR}` でエスケープします
- `$include` ファイル内でも動作します
- インライン置換：`"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs（env、file、exec）">
  SecretRef オブジェクトをサポートするフィールドでは、以下を使用できます。

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

SecretRef の詳細（`env` / `file` / `exec` 用の `secrets.providers` を含む）は、[Secrets Management](/ja-JP/gateway/secrets)にあります。
サポートされる認証情報パスは、[SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface)に一覧があります。
</Accordion>

完全な優先順位とソースについては、[Environment](/ja-JP/help/environment)を参照してください。

## 完全なリファレンス

フィールドごとの完全なリファレンスについては、**[Configuration Reference](/ja-JP/gateway/configuration-reference)** を参照してください。

---

_関連: [設定例](/ja-JP/gateway/configuration-examples) · [Configuration Reference](/ja-JP/gateway/configuration-reference) · [Doctor](/ja-JP/gateway/doctor)_
