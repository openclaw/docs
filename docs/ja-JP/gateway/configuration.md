---
read_when:
    - OpenClaw を初めて設定する場合
    - 一般的な設定パターンを探している場合
    - 特定の設定セクションへ移動する場合
summary: '設定概要: 一般的なタスク、クイックセットアップ、および完全なリファレンスへのリンク'
title: 設定
x-i18n:
    generated_at: "2026-04-24T04:56:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a47a2c02c37b012a8d8222d3f160634343090b633be722393bac2ebd6adc91c
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw は、`~/.openclaw/openclaw.json` から任意の <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> config を読み込みます。
有効な config パスは通常ファイルである必要があります。symlink された `openclaw.json`
レイアウトは、OpenClaw 管理の書き込みではサポートされません。アトミック書き込みにより、
symlink を保持せずにそのパスが置き換えられることがあります。config をデフォルトの
状態ディレクトリ外に置く場合は、`OPENCLAW_CONFIG_PATH` を実体ファイルへ直接向けてください。

ファイルがない場合、OpenClaw は安全なデフォルトを使います。config を追加する一般的な理由は次のとおりです。

- チャンネルを接続し、誰がボットにメッセージできるかを制御する
- モデル、tools、sandboxing、自動化（Cron、hooks）を設定する
- セッション、メディア、ネットワーク、UI を調整する

利用可能なすべてのフィールドについては、[完全なリファレンス](/ja-JP/gateway/configuration-reference) を参照してください。

<Tip>
**設定が初めてですか？** 対話型セットアップには `openclaw onboard` から始めるか、完全なコピー＆ペースト可能 config を載せた [Configuration Examples](/ja-JP/gateway/configuration-examples) ガイドを確認してください。
</Tip>

## 最小構成

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## config の編集

<Tabs>
  <Tab title="対話型ウィザード">
    ```bash
    openclaw onboard       # フルオンボーディングフロー
    openclaw configure     # config ウィザード
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
    [http://127.0.0.1:18789](http://127.0.0.1:18789) を開き、**Config** タブを使います。
    Control UI はライブ config schema からフォームを描画し、利用可能な場合は
    フィールドの `title` / `description` ドキュメントメタデータに加え、Plugin とチャンネルの schema も含めます。必要なら **Raw JSON** エディターを回避手段として使えます。ドリルダウン UI
    やその他の tooling 向けに、gateway は `config.schema.lookup` も公開しており、
    1 つの path スコープ schema ノードと、その直下の子要約を取得できます。
  </Tab>
  <Tab title="直接編集">
    `~/.openclaw/openclaw.json` を直接編集します。Gateway はファイルを監視し、自動的に変更を適用します（[ホットリロード](#config-hot-reload) を参照）。
  </Tab>
</Tabs>

## 厳格な検証

<Warning>
OpenClaw は schema に完全一致する設定のみを受け付けます。不明なキー、不正な型、無効な値があると、Gateway は**起動を拒否**します。唯一のルートレベル例外は `$schema`（文字列）で、エディターが JSON Schema メタデータを付加できるようにするためのものです。
</Warning>

`openclaw config schema` は、Control UI
と検証で使われる正規の JSON Schema を出力します。`config.schema.lookup` は、ドリルダウン tooling 用に
単一の path スコープノードと子要約を取得します。フィールド `title`/`description` のドキュメントメタデータは、
ネストしたオブジェクト、ワイルドカード（`*`）、配列項目（`[]`）、`anyOf`/
`oneOf`/`allOf` 分岐にも引き継がれます。ランタイムの Plugin とチャンネル schema は、
manifest レジストリが読み込まれるとマージされます。

検証に失敗した場合:

- Gateway は起動しない
- 診断コマンドのみ動作する（`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`）
- 正確な問題を確認するには `openclaw doctor` を実行する
- 修復を適用するには `openclaw doctor --fix`（または `--yes`）を実行する

Gateway は、起動が成功するたびに信頼済みの last-known-good コピーを保持します。
後で `openclaw.json` が検証に失敗した場合（または `gateway.mode` が消えた、急激に
縮小した、あるいは stray なログ行が先頭に付加された場合）、OpenClaw は壊れたファイルを
`.clobbered.*` として保持し、last-known-good コピーを復元して、その復旧理由をログに出します。
次のエージェントターンでも system-event 警告が送られ、メインエージェントが復元済み config を
盲目的に再書き換えしないようにします。候補に `***` のようなマスク済みシークレットプレースホルダーが含まれる場合、
last-known-good への昇格はスキップされます。

## 一般的なタスク

<AccordionGroup>
  <Accordion title="チャンネルを設定する（WhatsApp、Telegram、Discord など）">
    各チャンネルには `channels.<provider>` 配下に独自の config セクションがあります。セットアップ手順は専用チャンネルページを参照してください。

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
          allowFrom: ["tg:123"], // allowlist/open のみ
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="モデルを選択して設定する">
    primary モデルと任意のフォールバックを設定します。

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

    - `agents.defaults.models` はモデルカタログを定義し、`/model` の allowlist として機能します。
    - 既存モデルを削除せずに allowlist エントリーを追加するには、`openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使ってください。エントリーを削除してしまう通常の置換は、`--replace` を渡さない限り拒否されます。
    - モデル ref は `provider/model` 形式を使います（例: `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` は transcript/tool 画像の縮小サイズを制御します（デフォルト `1200`）。値を下げると通常、スクリーンショットの多い実行で vision-token 使用量が減ります。
    - チャット内でのモデル切り替えについては [Models CLI](/ja-JP/concepts/models)、認証ローテーションとフォールバック動作については [Model Failover](/ja-JP/concepts/model-failover) を参照してください。
    - カスタム/セルフホスト型プロバイダーについては、リファレンス内の [Custom providers](/ja-JP/gateway/config-tools#custom-providers-and-base-urls) を参照してください。

  </Accordion>

  <Accordion title="誰がボットにメッセージできるかを制御する">
    DM アクセスはチャンネルごとに `dmPolicy` で制御されます。

    - `"pairing"`（デフォルト）: 未知の送信者には承認用のワンタイムペアリングコードが送られる
    - `"allowlist"`: `allowFrom`（または paired allow store）にいる送信者のみ
    - `"open"`: すべての受信 DM を許可する（`allowFrom: ["*"]` が必要）
    - `"disabled"`: すべての DM を無視する

    グループでは、`groupPolicy` + `groupAllowFrom` またはチャンネル固有の allowlist を使ってください。

    チャンネルごとの詳細は [完全なリファレンス](/ja-JP/gateway/config-channels#dm-and-group-access) を参照してください。

  </Accordion>

  <Accordion title="グループチャットの mention ゲーティングを設定する">
    グループメッセージはデフォルトで **mention 必須** です。エージェントごとにパターンを設定します。

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

    - **メタデータ mention**: ネイティブな @-mention（WhatsApp の tap-to-mention、Telegram の @bot など）
    - **テキストパターン**: `mentionPatterns` 内の安全な regex パターン
    - チャンネルごとの上書きや self-chat mode については [完全なリファレンス](/ja-JP/gateway/config-channels#group-chat-mention-gating) を参照してください。

  </Accordion>

  <Accordion title="エージェントごとに Skills を制限する">
    共有ベースラインには `agents.defaults.skills` を使い、特定の
    エージェントは `agents.list[].skills` で上書きします。

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // github, weather を継承
          { id: "docs", skills: ["docs-search"] }, // defaults を置換
          { id: "locked-down", skills: [] }, // Skills なし
        ],
      },
    }
    ```

    - デフォルトで Skills を無制限にするには `agents.defaults.skills` を省略します。
    - defaults を継承するには `agents.list[].skills` を省略します。
    - Skills なしにするには `agents.list[].skills: []` を設定します。
    - [Skills](/ja-JP/tools/skills)、[Skills config](/ja-JP/tools/skills-config)、および
      [Configuration Reference](/ja-JP/gateway/config-agents#agents-defaults-skills) を参照してください。

  </Accordion>

  <Accordion title="gateway チャンネル健全性監視を調整する">
    stale に見えるチャンネルを gateway がどの程度積極的に再起動するかを制御します。

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

    - 健全性監視による再起動をグローバルに無効にするには `gateway.channelHealthCheckMinutes: 0` を設定します。
    - `channelStaleEventThresholdMinutes` はチェック間隔以上であるべきです。
    - グローバルモニターを無効にせずに 1 つのチャンネルまたはアカウントだけ自動再起動を無効にするには、`channels.<provider>.healthMonitor.enabled` または `channels.<provider>.accounts.<id>.healthMonitor.enabled` を使います。
    - 運用デバッグには [Health Checks](/ja-JP/gateway/health)、すべてのフィールドについては [完全なリファレンス](/ja-JP/gateway/configuration-reference#gateway) を参照してください。

  </Accordion>

  <Accordion title="セッションとリセットを設定する">
    セッションは会話の継続性と分離を制御します。

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // マルチユーザー向け推奨
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

    - `dmScope`: `main`（共有） | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: スレッド紐付けセッションルーティングのグローバルデフォルト（Discord は `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` をサポート）。
    - スコープ、identity link、送信ポリシーについては [Session Management](/ja-JP/concepts/session) を参照してください。
    - すべてのフィールドについては [完全なリファレンス](/ja-JP/gateway/config-agents#session) を参照してください。

  </Accordion>

  <Accordion title="sandboxing を有効にする">
    分離された sandbox ランタイムでエージェントセッションを実行します。

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

    まずイメージをビルドしてください: `scripts/sandbox-setup.sh`

    完全なガイドは [Sandboxing](/ja-JP/gateway/sandboxing)、すべてのオプションは [完全なリファレンス](/ja-JP/gateway/config-agents#agentsdefaultssandbox) を参照してください。

  </Accordion>

  <Accordion title="公式 iOS ビルド向けに relay ベース push を有効にする">
    relay ベース push は `openclaw.json` で設定します。

    gateway config に次を設定します。

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

    CLI での同等操作:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    これにより何が起こるか:

    - gateway が `push.test`、wake nudges、reconnect wakes を外部 relay 経由で送信できるようにします。
    - ペアリング済み iOS アプリから転送された registration スコープの送信 grant を使用します。gateway にデプロイメント全体の relay token は不要です。
    - 各 relay ベース registration を、iOS アプリがペアリングした gateway identity に紐付けるため、別の gateway が保存済み registration を再利用することはできません。
    - ローカル/手動の iOS ビルドは直接 APNs のままです。relay ベース送信は、relay 経由で登録した公式配布ビルドにのみ適用されます。
    - 公式/TestFlight iOS ビルドに埋め込まれた relay base URL と一致している必要があります。これにより、registration と送信トラフィックが同じ relay デプロイ先に到達します。

    end-to-end フロー:

    1. 同じ relay base URL でコンパイルされた公式/TestFlight iOS ビルドをインストールする。
    2. gateway で `gateway.push.apns.relay.baseUrl` を設定する。
    3. iOS アプリを gateway にペアリングし、node セッションと operator セッションの両方を接続させる。
    4. iOS アプリが gateway identity を取得し、App Attest とアプリ receipt を使って relay に登録した後、relay ベースの `push.apns.register` payload をペアリング済み gateway に公開する。
    5. gateway が relay handle と send grant を保存し、それらを `push.test`、wake nudges、reconnect wakes に使う。

    運用上の注記:

    - iOS アプリを別の gateway に切り替える場合は、アプリを再接続して、その gateway に紐付いた新しい relay registration を公開できるようにしてください。
    - 別の relay デプロイ先を指す新しい iOS ビルドを配布した場合、アプリは古い relay origin を再利用するのではなく、キャッシュされた relay registration を更新します。

    互換性注記:

    - `OPENCLAW_APNS_RELAY_BASE_URL` と `OPENCLAW_APNS_RELAY_TIMEOUT_MS` は、一時的な env 上書きとして引き続き使えます。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` は loopback 専用の開発用 escape hatch のままです。HTTP relay URL を config に永続化しないでください。

    end-to-end フローについては [iOS App](/ja-JP/platforms/ios#relay-backed-push-for-official-builds)、relay のセキュリティモデルについては [Authentication and trust flow](/ja-JP/platforms/ios#authentication-and-trust-flow) を参照してください。

  </Accordion>

  <Accordion title="Heartbeat を設定する（定期チェックイン）">
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

    - `every`: 期間文字列（`30m`, `2h`）。無効にするには `0m` を設定。
    - `target`: `last` | `none` | `<channel-id>`（たとえば `discord`, `matrix`, `telegram`, `whatsapp`）
    - `directPolicy`: DM 形式の Heartbeat ターゲットに対して `allow`（デフォルト）または `block`
    - 完全なガイドは [Heartbeat](/ja-JP/gateway/heartbeat) を参照してください。

  </Accordion>

  <Accordion title="Cron jobs を設定する">
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

    - `sessionRetention`: 完了済みの分離 run セッションを `sessions.json` から剪定します（デフォルト `24h`。無効にするには `false` を設定）。
    - `runLog`: `cron/runs/<jobId>.jsonl` をサイズと保持行数で剪定します。
    - 機能概要と CLI 例については [Cron jobs](/ja-JP/automation/cron-jobs) を参照してください。

  </Accordion>

  <Accordion title="Webhooks（hooks）を設定する">
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

    セキュリティ注記:
    - すべての hook/Webhook payload 内容は信頼できない入力として扱ってください。
    - 専用の `hooks.token` を使ってください。共有 Gateway token を再利用しないでください。
    - hook 認証はヘッダーのみです（`Authorization: Bearer ...` または `x-openclaw-token`）。クエリ文字列 token は拒否されます。
    - `hooks.path` を `/` にすることはできません。Webhook 受信は `/hooks` のような専用サブパスに置いてください。
    - 厳密に限定したデバッグ以外では、安全でないコンテンツのバイパスフラグ（`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`）は無効のままにしてください。
    - `hooks.allowRequestSessionKey` を有効にする場合は、呼び出し側が選べる session key を制限するため、`hooks.allowedSessionKeyPrefixes` も設定してください。
    - hook 駆動エージェントでは、強力で最新のモデル階層と厳格な tool ポリシー（たとえば、可能ならメッセージング専用 + sandboxing）を推奨します。

    すべての mapping オプションと Gmail 統合については [完全なリファレンス](/ja-JP/gateway/configuration-reference#hooks) を参照してください。

  </Accordion>

  <Accordion title="マルチエージェントルーティングを設定する">
    別々のワークスペースとセッションを持つ複数の分離エージェントを実行します。

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

    binding ルールとエージェントごとのアクセスプロファイルについては [Multi-Agent](/ja-JP/concepts/multi-agent) と [完全なリファレンス](/ja-JP/gateway/config-agents#multi-agent-routing) を参照してください。

  </Accordion>

  <Accordion title="config を複数ファイルに分割する（$include）">
    大きな config を整理するには `$include` を使います。

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

    - **単一ファイル**: 含まれているオブジェクトを置き換える
    - **ファイル配列**: 順番にディープマージされる（後勝ち）
    - **兄弟キー**: include の後にマージされる（含まれた値を上書き）
    - **ネストした include**: 最大 10 階層までサポート
    - **相対パス**: include 元ファイル基準で解決
    - **OpenClaw 管理の書き込み**: `plugins: { $include: "./plugins.json5" }` のような単一ファイル include に支えられたトップレベルセクションが 1 つだけ変更された場合、OpenClaw はその include 先ファイルを更新し、`openclaw.json` はそのままにします
    - **未対応の write-through**: root include、include 配列、兄弟上書きを伴う include は、config をフラット化する代わりに、OpenClaw 管理の書き込みでは fail closed します
    - **エラー処理**: ファイル欠如、解析エラー、循環 include に対して明確なエラーを出します

  </Accordion>
</AccordionGroup>

## config ホットリロード

Gateway は `~/.openclaw/openclaw.json` を監視し、変更を自動適用します。ほとんどの設定で手動再起動は不要です。

直接のファイル編集は、検証を通るまで信頼されないものとして扱われます。watcher は
エディターの一時書き込み/rename の揺れが収まるのを待ち、最終ファイルを読み取り、
無効な外部編集は last-known-good config を復元することで拒否します。OpenClaw 管理の
config 書き込みも、書き込む前に同じ schema gate を使います。`gateway.mode` を消す、
ファイルサイズを半分以上縮小するなどの破壊的 clobber は拒否され、調査用に `.rejected.*`
として保存されます。

ログに `Config auto-restored from last-known-good` または
`config reload restored last-known-good config` が表示された場合は、
`openclaw.json` の隣にある対応する `.clobbered.*` ファイルを調べ、拒否された payload を修正してから
`openclaw config validate` を実行してください。復旧チェックリストは [Gateway troubleshooting](/ja-JP/gateway/troubleshooting#gateway-restored-last-known-good-config)
を参照してください。

### リロードモード

| Mode | 動作 |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`**（デフォルト） | 安全な変更は即座にホット適用。重大な変更は自動で再起動。 |
| **`hot`** | 安全な変更のみホット適用。再起動が必要な場合は警告を記録し、対応は自分で行う。 |
| **`restart`** | 安全かどうかに関係なく、すべての config 変更で Gateway を再起動。 |
| **`off`** | ファイル監視を無効化。変更は次回の手動再起動で反映。 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ホット適用されるものと再起動が必要なもの

ほとんどのフィールドはダウンタイムなしでホット適用されます。`hybrid` モードでは、再起動が必要な変更も自動処理されます。

| Category | フィールド | 再起動が必要? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| チャンネル | `channels.*`, `web`（WhatsApp）— すべての組み込み/Plugin チャンネル | いいえ |
| エージェントとモデル | `agent`, `agents`, `models`, `routing` | いいえ |
| 自動化 | `hooks`, `cron`, `agent.heartbeat` | いいえ |
| セッションとメッセージ | `session`, `messages` | いいえ |
| Tools とメディア | `tools`, `browser`, `skills`, `audio`, `talk` | いいえ |
| UI とその他 | `ui`, `logging`, `identity`, `bindings` | いいえ |
| Gateway サーバー | `gateway.*`（port, bind, auth, tailscale, TLS, HTTP） | **はい** |
| インフラ | `discovery`, `canvasHost`, `plugins` | **はい** |

<Note>
`gateway.reload` と `gateway.remote` は例外で、これらを変更しても**再起動はトリガーされません**。
</Note>

### リロード計画

`$include` を通じて参照されているソースファイルを編集すると、OpenClaw は
フラット化されたインメモリビューではなく、ソース作成レイアウトからリロード計画を立てます。
これにより、`plugins: { $include: "./plugins.json5" }` のように
単一のトップレベルセクションが独自の include ファイルにある場合でも、
ホットリロードの判断（ホット適用か再起動か）が予測可能になります。ソースレイアウトが曖昧な場合、
リロード計画は fail closed します。

## Config RPC（プログラムによる更新）

gateway API 経由で config を書き込む tooling では、次のフローを推奨します。

- `config.schema.lookup` で 1 つのサブツリーを調べる（浅い schema ノード + 子要約）
- `config.get` で現在のスナップショットと `hash` を取得する
- 部分更新には `config.patch` を使う（JSON merge patch: オブジェクトはマージ、`null` は削除、配列は置換）
- config 全体を置き換える意図がある場合にのみ `config.apply` を使う
- 明示的な self-update + 再起動には `update.run` を使う

<Note>
コントロールプレーンの書き込み（`config.apply`, `config.patch`, `update.run`）は、
`deviceId+clientIp` ごとに 60 秒あたり 3 リクエストにレート制限されます。
再起動リクエストはまとめられ、その後、再起動サイクル間に 30 秒のクールダウンが適用されます。
</Note>

部分パッチの例:

```bash
openclaw gateway call config.get --params '{}'  # payload.hash を取得
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` と `config.patch` はどちらも `raw`, `baseHash`, `sessionKey`,
`note`, `restartDelayMs` を受け付けます。config がすでに存在する場合、`baseHash` は両メソッドで必須です。

## 環境変数

OpenClaw は親プロセスからの env var に加えて、次も読み込みます。

- 現在の作業ディレクトリにある `.env`（存在する場合）
- `~/.openclaw/.env`（グローバルフォールバック）

どちらのファイルも既存の env var を上書きしません。config 内でインライン env var を設定することもできます。

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell env インポート（任意）">
  有効にすると、期待されるキーが設定されていない場合に、OpenClaw はログインシェルを実行し、不足しているキーだけをインポートします。

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

対応する env var: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="config 値での env var 置換">
  任意の config 文字列値で `${VAR_NAME}` を使って env var を参照できます。

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

ルール:

- 一致するのは大文字名のみ: `[A-Z_][A-Z0-9_]*`
- 不足または空の var は読み込み時にエラーになります
- リテラル出力には `$${VAR}` でエスケープします
- `$include` ファイル内でも動作します
- インライン置換: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs（env, file, exec）">
  SecretRef オブジェクトをサポートするフィールドでは、次のように使えます。

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

SecretRef の詳細（`env`/`file`/`exec` 向け `secrets.providers` を含む）は [Secrets Management](/ja-JP/gateway/secrets) にあります。
サポートされる認証情報パスは [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface) に一覧があります。
</Accordion>

優先順位とソースの完全な説明は [Environment](/ja-JP/help/environment) を参照してください。

## 完全なリファレンス

完全なフィールド別リファレンスについては、**[Configuration Reference](/ja-JP/gateway/configuration-reference)** を参照してください。

---

_関連: [Configuration Examples](/ja-JP/gateway/configuration-examples) · [Configuration Reference](/ja-JP/gateway/configuration-reference) · [Doctor](/ja-JP/gateway/doctor)_

## 関連

- [Configuration reference](/ja-JP/gateway/configuration-reference)
- [Configuration examples](/ja-JP/gateway/configuration-examples)
- [Gateway runbook](/ja-JP/gateway)
