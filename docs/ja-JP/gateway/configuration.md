---
read_when:
    - OpenClawの初回セットアップ
    - 一般的な設定パターンを探す
    - 特定の設定セクションに移動する
summary: '設定概要: 一般的なタスク、クイックセットアップ、および完全なリファレンスへのリンク'
title: 設定
x-i18n:
    generated_at: "2026-04-21T04:45:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 479e59fb8b57c5228ef1c6076cf80a4ce6064d3f6fad5f38ea9d75eeb92811dc
    source_path: gateway/configuration.md
    workflow: 15
---

# 設定

OpenClawは、`~/.openclaw/openclaw.json` から任意の <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> 設定を読み込みます。

ファイルが存在しない場合、OpenClawは安全なデフォルト値を使用します。設定を追加する一般的な理由は次のとおりです:

- チャンネルを接続し、誰がbotにメッセージを送れるかを制御する
- モデル、ツール、サンドボックス化、または自動化（Cron、hooks）を設定する
- セッション、メディア、ネットワーク、またはUIを調整する

利用可能なすべてのフィールドについては、[完全なリファレンス](/ja-JP/gateway/configuration-reference) を参照してください。

<Tip>
**設定が初めてですか？** 対話式セットアップには `openclaw onboard` から始めるか、完全なコピー＆ペースト可能な設定を掲載した [設定例](/ja-JP/gateway/configuration-examples) ガイドを確認してください。
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
  <Tab title="対話式ウィザード">
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
  <Tab title="Control UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) を開き、**Config** タブを使用します。
    Control UIは、利用可能な場合はpluginおよびチャンネルのschemaに加え、
    フィールドの `title` / `description` のdocsメタデータを含む、
    実際の設定schemaからフォームを描画し、必要に応じて使える
    **Raw JSON** エディターも提供します。ドリルダウンUIやその他の
    ツール向けに、gatewayは `config.schema.lookup` も公開しており、
    1つのパス範囲のschemaノードとその直下の子要約を取得できます。
  </Tab>
  <Tab title="直接編集">
    `~/.openclaw/openclaw.json` を直接編集します。Gatewayはこのファイルを監視しており、変更を自動的に適用します（[ホットリロード](#config-hot-reload) を参照）。
  </Tab>
</Tabs>

## 厳格な検証

<Warning>
OpenClawは、schemaに完全に一致する設定のみを受け付けます。不明なキー、不正な型、無効な値があると、Gatewayは**起動を拒否**します。ルートレベルでの唯一の例外は `$schema`（文字列）で、これはエディターがJSON Schemaメタデータを関連付けるためのものです。
</Warning>

schemaツールに関する注意:

- `openclaw config schema` は、Control UIと設定検証で使われているのと同じJSON Schemaファミリーを出力します。
- そのschema出力は、`openclaw.json` の機械可読な正式契約として扱ってください。この概要と設定リファレンスはそれを要約したものです。
- フィールドの `title` と `description` の値は、エディターやフォームツール向けにschema出力へ引き継がれます。
- ネストされたオブジェクト、ワイルドカード（`*`）、配列項目（`[]`）の各エントリーも、一致するフィールド文書がある場合は同じdocsメタデータを継承します。
- `anyOf` / `oneOf` / `allOf` の合成分岐も同じdocsメタデータを継承するため、union/intersectionの各バリアントでも同じフィールドヘルプが維持されます。
- `config.schema.lookup` は、正規化された1つの設定パスについて、浅いschemaノード（`title`、`description`、`type`、`enum`、`const`、一般的な境界、および類似の検証フィールド）、一致したUIヒントメタデータ、そしてドリルダウン用の直下の子要約を返します。
- gatewayが現在のmanifest registryを読み込める場合、実行時plugin/チャンネルschemaもマージされます。
- `pnpm config:docs:check` は、docs向け設定ベースライン成果物と現在のschema表面とのずれを検出します。

検証に失敗した場合:

- Gatewayは起動しません
- 診断コマンドのみ動作します（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 正確な問題を確認するには `openclaw doctor` を実行してください
- 修復を適用するには `openclaw doctor --fix`（または `--yes`）を実行してください

Gatewayは、正常に起動した後の信頼できる最後の正常なコピーも保持します。その後
`openclaw.json` がOpenClaw外部で変更されて検証に失敗するようになると、起動時
およびホットリロード時に壊れたファイルはタイムスタンプ付き `.clobbered.*` スナップショット
として保持され、最後の正常なコピーが復元され、復旧理由付きの目立つ警告がログに
記録されます。次のメインagentターンでも、設定が復元されたことと、それを盲目的に
再書き換えしてはならないことを伝えるシステムイベント警告が渡されます。最後の正常な
コピーへの昇格は、検証済み起動後、および受理されたホットリロード後に更新されます。
これには、永続化ファイルハッシュが受理済み書き込みと引き続き一致している
OpenClaw所有の設定書き込みも含まれます。候補に `***` や短縮されたトークン値のような
秘匿されたシークレットプレースホルダーが含まれる場合、昇格はスキップされます。

## 一般的なタスク

<AccordionGroup>
  <Accordion title="チャンネルをセットアップする（WhatsApp、Telegram、Discordなど）">
    各チャンネルには `channels.<provider>` 配下に専用の設定セクションがあります。セットアップ手順は各チャンネルの専用ページを参照してください:

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

    すべてのチャンネルは同じDMポリシーパターンを共有します:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // allowlist/open の場合のみ
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="モデルを選んで設定する">
    主モデルと任意のフォールバックを設定します:

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

    - `agents.defaults.models` はモデルカタログを定義し、`/model` の許可リストとしても機能します。
    - モデル参照は `provider/model` 形式を使います（例: `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` は、トランスクリプト/ツール画像の縮小サイズを制御します（デフォルト `1200`）。通常、値を下げるとスクリーンショットが多い実行でvision-token使用量を削減できます。
    - チャット中のモデル切り替えは [Models CLI](/ja-JP/concepts/models) を、認証ローテーションとフォールバック動作は [Model Failover](/ja-JP/concepts/model-failover) を参照してください。
    - カスタム/セルフホスト型プロバイダーについては、リファレンス内の [Custom providers](/ja-JP/gateway/configuration-reference#custom-providers-and-base-urls) を参照してください。

  </Accordion>

  <Accordion title="誰がbotにメッセージできるかを制御する">
    DMアクセスは `dmPolicy` によりチャンネルごとに制御されます:

    - `"pairing"`（デフォルト）: 未知の送信者には承認用のワンタイムペアリングコードが返されます
    - `"allowlist"`: `allowFrom` 内の送信者のみ（またはペア済みallowストア）
    - `"open"`: すべての受信DMを許可します（`allowFrom: ["*"]` が必要）
    - `"disabled"`: すべてのDMを無視します

    グループでは、`groupPolicy` + `groupAllowFrom` またはチャンネル固有の許可リストを使用してください。

    チャンネルごとの詳細は [完全なリファレンス](/ja-JP/gateway/configuration-reference#dm-and-group-access) を参照してください。

  </Accordion>

  <Accordion title="グループチャットのmentionゲーティングを設定する">
    グループメッセージはデフォルトで**mention必須**です。agentごとにパターンを設定します:

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

    - **メタデータmention**: ネイティブの@-mention（WhatsAppのタップでmention、Telegramの@botなど）
    - **テキストパターン**: `mentionPatterns` 内の安全な正規表現パターン
    - チャンネルごとの上書きやself-chatモードについては [完全なリファレンス](/ja-JP/gateway/configuration-reference#group-chat-mention-gating) を参照してください。

  </Accordion>

  <Accordion title="agentごとにSkillsを制限する">
    共有ベースラインには `agents.defaults.skills` を使い、その後
    特定agentで `agents.list[].skills` を使って上書きします:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // github, weather を継承
          { id: "docs", skills: ["docs-search"] }, // デフォルトを置き換え
          { id: "locked-down", skills: [] }, // Skillsなし
        ],
      },
    }
    ```

    - デフォルトでSkillsを無制限にするには `agents.defaults.skills` を省略します。
    - デフォルトを継承するには `agents.list[].skills` を省略します。
    - Skillsなしにするには `agents.list[].skills: []` を設定します。
    - [Skills](/ja-JP/tools/skills)、[Skills config](/ja-JP/tools/skills-config)、および
      [設定リファレンス](/ja-JP/gateway/configuration-reference#agents-defaults-skills) を参照してください。

  </Accordion>

  <Accordion title="gatewayのチャンネルヘルス監視を調整する">
    停滞しているように見えるチャンネルをgatewayがどの程度積極的に再起動するかを制御します:

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

    - ヘルス監視による再起動をグローバルに無効にするには `gateway.channelHealthCheckMinutes: 0` を設定します。
    - `channelStaleEventThresholdMinutes` は、チェック間隔以上にする必要があります。
    - グローバル監視を無効にせずに、1つのチャンネルまたはアカウントの自動再起動だけを無効にするには、`channels.<provider>.healthMonitor.enabled` または `channels.<provider>.accounts.<id>.healthMonitor.enabled` を使ってください。
    - 運用デバッグには [ヘルスチェック](/ja-JP/gateway/health) を、すべてのフィールドについては [完全なリファレンス](/ja-JP/gateway/configuration-reference#gateway) を参照してください。

  </Accordion>

  <Accordion title="セッションとリセットを設定する">
    セッションは会話の継続性と分離を制御します:

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
    - `threadBindings`: スレッドに束縛されたセッションルーティングのグローバルデフォルト（Discordは `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` をサポート）。
    - スコープ、identity links、送信ポリシーについては [セッション管理](/ja-JP/concepts/session) を参照してください。
    - すべてのフィールドについては [完全なリファレンス](/ja-JP/gateway/configuration-reference#session) を参照してください。

  </Accordion>

  <Accordion title="サンドボックス化を有効にする">
    agentセッションを分離されたサンドボックスランタイムで実行します:

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

    先にイメージをビルドしてください: `scripts/sandbox-setup.sh`

    完全なガイドは [サンドボックス化](/ja-JP/gateway/sandboxing)、すべてのオプションは [完全なリファレンス](/ja-JP/gateway/configuration-reference#agentsdefaultssandbox) を参照してください。

  </Accordion>

  <Accordion title="公式iOSビルド向けのrelayベースpushを有効にする">
    relayベースpushは `openclaw.json` で設定します。

    gateway設定に次を設定します:

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

    CLIでの同等操作:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    これで行われること:

    - gatewayが `push.test`、wake nudges、reconnect wakes を外部relay経由で送信できるようになります。
    - ペアリング済みiOSアプリから転送された、登録スコープのsend grantを使用します。gatewayにデプロイ全体用のrelay tokenは不要です。
    - 各relay対応登録は、そのiOSアプリがペアリングしたgateway identityに結び付けられるため、別のgatewayが保存済み登録を再利用することはできません。
    - ローカル/手動のiOSビルドは引き続き直接APNsを使用します。relay経由送信が適用されるのは、relay経由で登録された公式配布ビルドのみです。
    - 公式/TestFlight iOSビルドに埋め込まれたrelay base URLと一致している必要があります。これにより、登録トラフィックと送信トラフィックが同じrelayデプロイ先へ到達します。

    エンドツーエンドのフロー:

    1. 同じrelay base URLでコンパイルされた公式/TestFlight iOSビルドをインストールします。
    2. gatewayで `gateway.push.apns.relay.baseUrl` を設定します。
    3. iOSアプリをgatewayにペアリングし、nodeセッションとoperatorセッションの両方を接続します。
    4. iOSアプリはgateway identityを取得し、App Attestとアプリreceiptを使用してrelayへ登録し、その後relay対応の `push.apns.register` payloadをペアリング済みgatewayへ公開します。
    5. gatewayはrelay handleとsend grantを保存し、それらを `push.test`、wake nudges、reconnect wakes に使用します。

    運用上の注意:

    - iOSアプリを別のgatewayへ切り替える場合、そのgatewayに結び付いた新しいrelay登録を公開できるよう、アプリを再接続してください。
    - 別のrelayデプロイ先を指す新しいiOSビルドを配布した場合、アプリは古いrelay originを再利用せず、キャッシュ済みrelay登録を更新します。

    互換性に関する注意:

    - `OPENCLAW_APNS_RELAY_BASE_URL` と `OPENCLAW_APNS_RELAY_TIMEOUT_MS` は、暫定的な環境変数上書きとして引き続き使えます。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` は引き続きloopback専用の開発用エスケープハッチです。HTTP relay URLを設定に永続化しないでください。

    エンドツーエンドの流れについては [iOS App](/ja-JP/platforms/ios#relay-backed-push-for-official-builds)、relayのセキュリティモデルについては [Authentication and trust flow](/ja-JP/platforms/ios#authentication-and-trust-flow) を参照してください。

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

    - `every`: 期間文字列（`30m`、`2h`）。無効化するには `0m` を設定します。
    - `target`: `last` | `none` | `<channel-id>`（例: `discord`、`matrix`、`telegram`、`whatsapp`）
    - `directPolicy`: DM形式のHeartbeatターゲットに対して `allow`（デフォルト）または `block`
    - 完全なガイドは [Heartbeat](/ja-JP/gateway/heartbeat) を参照してください。

  </Accordion>

  <Accordion title="Cronジョブを設定する">
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

    - `sessionRetention`: 完了した分離実行セッションを `sessions.json` から削除します（デフォルト `24h`。無効にするには `false` を設定）。
    - `runLog`: `cron/runs/<jobId>.jsonl` をサイズと保持行数で整理します。
    - 機能概要とCLI例については [Cron jobs](/ja-JP/automation/cron-jobs) を参照してください。

  </Accordion>

  <Accordion title="Webhook（hooks）を設定する">
    GatewayでHTTP Webhookエンドポイントを有効にします:

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
    - すべてのhook/Webhook payload内容は信頼できない入力として扱ってください。
    - 専用の `hooks.token` を使用してください。共有Gateway tokenを再利用しないでください。
    - Hook認証はヘッダーのみです（`Authorization: Bearer ...` または `x-openclaw-token`）。クエリ文字列のtokenは拒否されます。
    - `hooks.path` は `/` にできません。Webhook受信は `/hooks` のような専用サブパスにしてください。
    - 安全でないコンテンツのバイパスフラグ（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`）は、厳密に限定したデバッグを行う場合を除き無効のままにしてください。
    - `hooks.allowRequestSessionKey` を有効にする場合は、呼び出し側が選択できるsession keyを制限するために `hooks.allowedSessionKeyPrefixes` も設定してください。
    - hook駆動agentでは、可能なら強力な最新モデル層と厳格なツールポリシー（たとえばメッセージング専用 + サンドボックス化）を推奨します。

    すべてのmappingオプションとGmail連携については [完全なリファレンス](/ja-JP/gateway/configuration-reference#hooks) を参照してください。

  </Accordion>

  <Accordion title="マルチagentルーティングを設定する">
    別々のworkspaceとセッションを持つ複数の分離agentを実行します:

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

    バインディングルールとagentごとのアクセスプロファイルについては [Multi-Agent](/ja-JP/concepts/multi-agent) と [完全なリファレンス](/ja-JP/gateway/configuration-reference#multi-agent-routing) を参照してください。

  </Accordion>

  <Accordion title="設定を複数ファイルに分割する（$include）">
    大きな設定を整理するには `$include` を使用します:

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

    - **単一ファイル**: そのオブジェクト全体を置き換えます
    - **ファイル配列**: 順番にdeep-mergeされます（後勝ち）
    - **同階層キー**: include後にマージされます（includeされた値を上書き）
    - **ネストしたinclude**: 最大10階層までサポート
    - **相対パス**: include元ファイルからの相対で解決
    - **エラー処理**: ファイル欠落、解析エラー、循環includeに対して明確なエラーを返します

  </Accordion>
</AccordionGroup>

## 設定のホットリロード

Gatewayは `~/.openclaw/openclaw.json` を監視し、変更を自動適用します。ほとんどの設定では手動再起動は不要です。

直接のファイル編集は、検証を通過するまで信頼されないものとして扱われます。watcherは
エディターの一時書き込み/リネームの揺れが落ち着くのを待ち、最終ファイルを読み取り、
無効な外部編集は最後の正常な設定を復元して拒否します。OpenClaw自身による設定書き込みも、
書き込む前に同じschemaゲートを通ります。`gateway.mode` を落とす、ファイルを半分以上
縮小する、といった破壊的な上書きは拒否され、確認用に `.rejected.*` として保存されます。

ログに `Config auto-restored from last-known-good` または
`config reload restored last-known-good config` が表示された場合は、
`openclaw.json` の隣にある対応する `.clobbered.*` ファイルを確認し、
拒否されたpayloadを修正してから `openclaw config validate` を実行してください。
復旧チェックリストは [Gateway troubleshooting](/ja-JP/gateway/troubleshooting#gateway-restored-last-known-good-config)
を参照してください。

### リロードモード

| モード                 | 挙動                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`**（デフォルト） | 安全な変更は即時ホット適用します。重要な変更は自動的に再起動します。                   |
| **`hot`**              | 安全な変更のみホット適用します。再起動が必要な場合は警告をログに出し、対応は手動です。 |
| **`restart`**          | 安全かどうかに関係なく、あらゆる設定変更でGatewayを再起動します。                       |
| **`off`**              | ファイル監視を無効化します。変更は次回の手動再起動時に反映されます。                    |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ホット適用されるものと再起動が必要なもの

ほとんどのフィールドはダウンタイムなしでホット適用されます。`hybrid` モードでは、再起動が必要な変更も自動処理されます。

| カテゴリ            | フィールド                                                           | 再起動必要? |
| ------------------- | -------------------------------------------------------------------- | ------------ |
| チャンネル          | `channels.*`、`web`（WhatsApp）— すべての組み込みおよび拡張チャンネル | いいえ       |
| Agentとモデル       | `agent`、`agents`、`models`、`routing`                               | いいえ       |
| 自動化              | `hooks`、`cron`、`agent.heartbeat`                                   | いいえ       |
| セッションとメッセージ | `session`、`messages`                                              | いいえ       |
| ツールとメディア    | `tools`、`browser`、`skills`、`audio`、`talk`                        | いいえ       |
| UIとその他          | `ui`、`logging`、`identity`、`bindings`                              | いいえ       |
| Gatewayサーバー     | `gateway.*`（port、bind、auth、tailscale、TLS、HTTP）                | **はい**     |
| インフラ            | `discovery`、`canvasHost`、`plugins`                                 | **はい**     |

<Note>
`gateway.reload` と `gateway.remote` は例外で、これらを変更しても**再起動は発生しません**。
</Note>

## 設定RPC（プログラムによる更新）

<Note>
Control-plane書き込みRPC（`config.apply`、`config.patch`、`update.run`）は、`deviceId+clientIp` ごとに**60秒あたり3リクエスト**にレート制限されています。制限時、RPCは `UNAVAILABLE` を `retryAfterMs` とともに返します。
</Note>

安全/デフォルトのフロー:

- `config.schema.lookup`: パス範囲の設定サブツリー1つを、浅い
  schemaノード、一致したヒントメタデータ、直下の子要約とともに確認
- `config.get`: 現在のスナップショット + hashを取得
- `config.patch`: 推奨される部分更新パス
- `config.apply`: 完全設定の置き換え時のみ
- `update.run`: 明示的な自己更新 + 再起動

設定全体を置き換えるのでない場合は、`config.schema.lookup`
の後に `config.patch` を使うことを推奨します。

<AccordionGroup>
  <Accordion title="config.apply（完全置換）">
    完全な設定を検証して書き込み、1ステップでGatewayを再起動します。

    <Warning>
    `config.apply` は**設定全体**を置き換えます。部分更新には `config.patch`、単一キーには `openclaw config set` を使用してください。
    </Warning>

    パラメータ:

    - `raw`（string）— 設定全体のJSON5 payload
    - `baseHash`（任意）— `config.get` の設定hash（設定が存在する場合は必須）
    - `sessionKey`（任意）— 再起動後のウェイクアップping用session key
    - `note`（任意）— restart sentinel用メモ
    - `restartDelayMs`（任意）— 再起動前の遅延（デフォルト 2000）

    再起動要求は、すでに保留中/進行中のものがある間は統合され、再起動サイクル間には30秒のクールダウンが適用されます。

    ```bash
    openclaw gateway call config.get --params '{}'  # payload.hash を取得
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch（部分更新）">
    既存の設定に部分更新をマージします（JSON merge patchのセマンティクス）:

    - オブジェクトは再帰的にマージされます
    - `null` はキーを削除します
    - 配列は置き換えられます

    パラメータ:

    - `raw`（string）— 変更するキーだけを含むJSON5
    - `baseHash`（必須）— `config.get` の設定hash
    - `sessionKey`、`note`、`restartDelayMs` — `config.apply` と同じ

    再起動動作は `config.apply` と同じです: 保留中の再起動は統合され、再起動サイクル間には30秒のクールダウンがあります。

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## 環境変数

OpenClawは親プロセスに加えて、次のenv varを読み込みます:

- 現在の作業ディレクトリにある `.env`（存在する場合）
- `~/.openclaw/.env`（グローバルフォールバック）

どちらのファイルも既存のenv varを上書きしません。設定内でインラインenv varを設定することもできます:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="shell env import（任意）">
  有効な場合、想定されるキーが設定されていなければ、OpenClawはログインshellを実行し、不足しているキーだけをインポートします:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

env varでの同等設定: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="設定値内でのenv var置換">
  任意の設定文字列値で `${VAR_NAME}` を使ってenv varを参照できます:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

ルール:

- 一致するのは大文字名のみ: `[A-Z_][A-Z0-9_]*`
- 存在しない/空の変数は読み込み時エラーになります
- リテラル出力には `$${VAR}` でエスケープします
- `$include` ファイル内でも動作します
- インライン置換: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs（env、file、exec）">
  SecretRefオブジェクトをサポートするフィールドでは、次のように使用できます:

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

SecretRefの詳細（`env`/`file`/`exec` 用の `secrets.providers` を含む）は [Secrets Management](/ja-JP/gateway/secrets) にあります。
サポートされる認証情報パスは [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface) に一覧があります。
</Accordion>

優先順位とソースの完全な説明は [Environment](/ja-JP/help/environment) を参照してください。

## 完全なリファレンス

完全なフィールドごとのリファレンスについては、**[設定リファレンス](/ja-JP/gateway/configuration-reference)** を参照してください。

---

_関連: [設定例](/ja-JP/gateway/configuration-examples) · [設定リファレンス](/ja-JP/gateway/configuration-reference) · [Doctor](/ja-JP/gateway/doctor)_
