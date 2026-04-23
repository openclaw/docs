---
read_when:
    - OpenClaw を初めて設定する
    - 一般的な設定パターンを探す
    - 特定の config セクションへ移動する
summary: '設定の概要: 一般的なタスク、クイックセットアップ、および完全なリファレンスへのリンク'
title: 設定
x-i18n:
    generated_at: "2026-04-23T14:03:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: d76b40c25f98de791e0d8012b2bc5b80e3e38dde99bb9105539e800ddac3f362
    source_path: gateway/configuration.md
    workflow: 15
---

# 設定

OpenClaw は `~/.openclaw/openclaw.json` から任意の <Tooltip tip="JSON5 はコメントと末尾カンマをサポートします">**JSON5**</Tooltip> config を読み取ります。
有効な config path は通常ファイルである必要があります。symlink された `openclaw.json`
レイアウトは OpenClaw が所有する書き込みではサポートされません。atomic write により、
symlink を維持せずに path が置き換えられる場合があります。config をデフォルトの
state directory の外に置く場合は、`OPENCLAW_CONFIG_PATH` を実ファイルに直接向けてください。

ファイルが存在しない場合、OpenClaw は安全なデフォルトを使用します。config を追加する一般的な理由:

- channels を接続し、誰が bot にメッセージを送れるかを制御する
- models、tools、sandboxing、または automation（Cron、hooks）を設定する
- sessions、media、networking、または UI を調整する

利用可能なすべてのフィールドについては [完全なリファレンス](/ja-JP/gateway/configuration-reference) を参照してください。

<Tip>
**設定が初めてですか？** 対話型セットアップには `openclaw onboard` から始めるか、完全にコピー&ペーストできる config を掲載した [Configuration Examples](/ja-JP/gateway/configuration-examples) ガイドを確認してください。
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
    openclaw onboard       # 完全なオンボーディングフロー
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
    [http://127.0.0.1:18789](http://127.0.0.1:18789) を開き、**Config** タブを使用します。
    Control UI は、利用可能な場合は field の
    `title` / `description` ドキュメントメタデータに加えて plugin と channel schema も含めた、
    live config schema からフォームを描画し、escape hatch として **Raw JSON**
    エディタも提供します。ドリルダウン
    UI やその他のツール向けに、gateway は `config.schema.lookup` も公開しており、
    1 つの path スコープ schema node と、その直下の child summary を取得できます。
  </Tab>
  <Tab title="直接編集">
    `~/.openclaw/openclaw.json` を直接編集します。Gateway はファイルを監視し、自動で変更を適用します（[hot reload](#config-hot-reload) を参照）。
  </Tab>
</Tabs>

## 厳格な検証

<Warning>
OpenClaw は schema に完全一致する設定のみ受け入れます。不明な key、不正な型、または無効な値があると、Gateway は**起動を拒否**します。唯一の root-level 例外は `$schema`（string）で、これによりエディタが JSON Schema メタデータを付与できます。
</Warning>

`openclaw config schema` は、Control UI
と検証で使われる canonical JSON Schema を出力します。`config.schema.lookup` は、
ドリルダウンツール向けに 1 つの path スコープ node と
child summary を取得します。field の `title`/`description` ドキュメントメタデータは、
ネストした object、wildcard（`*`）、array-item（`[]`）、および `anyOf`/
`oneOf`/`allOf` の branch にも引き継がれます。runtime の plugin と channel schema は、
manifest registry が読み込まれるとマージされます。

検証に失敗した場合:

- Gateway は起動しません
- 診断コマンドのみ動作します（`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`）
- 正確な問題を確認するには `openclaw doctor` を実行してください
- 修復を適用するには `openclaw doctor --fix`（または `--yes`）を実行してください

Gateway は、起動に成功するたびに信頼できる last-known-good のコピーを保持します。
その後 `openclaw.json` が検証に失敗した場合（または `gateway.mode` が消えた、
大きく縮んだ、または先頭に余計なログ行が追加された場合）、OpenClaw は壊れたファイルを
`.clobbered.*` として保存し、last-known-good のコピーを復元し、
復旧理由をログに記録します。次のエージェントターンでも system-event の警告が送られるため、
メインエージェントが復元された config を無造作に書き換えることはありません。
候補に `***` のような redact 済み secret placeholder が含まれる場合、last-known-good への昇格は
スキップされます。

## 一般的なタスク

<AccordionGroup>
  <Accordion title="チャネルを設定する（WhatsApp、Telegram、Discord など）">
    各 channel には `channels.<provider>` の下にそれぞれ独自の config section があります。セットアップ手順は専用の channel ページを参照してください:

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

    すべての channels は同じ DM ポリシーパターンを共有します:

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

  <Accordion title="model を選択して設定する">
    主 model と任意の fallback を設定します:

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

    - `agents.defaults.models` は model catalog を定義し、`/model` の allowlist としても機能します。
    - 既存 model を削除せずに allowlist 項目を追加するには `openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使用してください。項目を削除してしまう通常の置換は、`--replace` を渡さない限り拒否されます。
    - model ref は `provider/model` 形式を使用します（例: `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` は transcript/tool image の縮小サイズを制御します（デフォルト `1200`）。値を低くすると、通常は screenshot の多い実行で vision-token 使用量を削減できます。
    - チャット中の model 切り替えについては [Models CLI](/ja-JP/concepts/models)、auth rotation と fallback 動作については [Model Failover](/ja-JP/concepts/model-failover) を参照してください。
    - カスタム/セルフホスト provider については、リファレンスの [Custom providers](/ja-JP/gateway/configuration-reference#custom-providers-and-base-urls) を参照してください。

  </Accordion>

  <Accordion title="誰が bot にメッセージを送れるかを制御する">
    DM アクセスは channel ごとに `dmPolicy` で制御されます:

    - `"pairing"`（デフォルト）: 未知の送信者には承認用のワンタイム pairing code が送られます
    - `"allowlist"`: `allowFrom` 内の送信者のみ（または paired allow store）
    - `"open"`: すべての受信 DM を許可します（`allowFrom: ["*"]` が必要）
    - `"disabled"`: すべての DM を無視します

    group については、`groupPolicy` + `groupAllowFrom` または channel 固有の allowlist を使用してください。

    channel ごとの詳細は [完全なリファレンス](/ja-JP/gateway/configuration-reference#dm-and-group-access) を参照してください。

  </Accordion>

  <Accordion title="グループチャットのメンションゲーティングを設定する">
    グループメッセージはデフォルトで**メンション必須**です。agent ごとにパターンを設定します:

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

    - **メタデータメンション**: ネイティブの @-mention（WhatsApp の tap-to-mention、Telegram の @bot など）
    - **テキストパターン**: `mentionPatterns` 内の安全な regex pattern
    - channel ごとの override と self-chat mode については [完全なリファレンス](/ja-JP/gateway/configuration-reference#group-chat-mention-gating) を参照してください。

  </Accordion>

  <Accordion title="agent ごとに Skills を制限する">
    共有ベースラインには `agents.defaults.skills` を使い、その後、
    特定 agent は `agents.list[].skills` で override します:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // github, weather を継承
          { id: "docs", skills: ["docs-search"] }, // defaults を置換
          { id: "locked-down", skills: [] }, // skills なし
        ],
      },
    }
    ```

    - デフォルトで Skills を無制限にするには `agents.defaults.skills` を省略してください。
    - defaults を継承するには `agents.list[].skills` を省略してください。
    - Skills なしにするには `agents.list[].skills: []` を設定してください。
    - [Skills](/ja-JP/tools/skills)、[Skills config](/ja-JP/tools/skills-config)、および
      [Configuration Reference](/ja-JP/gateway/configuration-reference#agents-defaults-skills) を参照してください。

  </Accordion>

  <Accordion title="gateway の channel health monitoring を調整する">
    古くなったように見える channel を gateway がどれだけ積極的に再起動するかを制御します:

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

    - health monitor の再起動を全体で無効化するには `gateway.channelHealthCheckMinutes: 0` を設定してください。
    - `channelStaleEventThresholdMinutes` はチェック間隔以上である必要があります。
    - グローバル monitor を無効にせず、1 つの channel または account だけで自動再起動を無効にするには、`channels.<provider>.healthMonitor.enabled` または `channels.<provider>.accounts.<id>.healthMonitor.enabled` を使用してください。
    - 運用デバッグについては [Health Checks](/ja-JP/gateway/health)、すべての field については [完全なリファレンス](/ja-JP/gateway/configuration-reference#gateway) を参照してください。

  </Accordion>

  <Accordion title="sessions とリセットを設定する">
    sessions は会話の継続性と分離を制御します:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // multi-user に推奨
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
    - `threadBindings`: thread に束縛された session routing のグローバルデフォルト（Discord は `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` をサポート）。
    - スコープ、identity links、send policy については [Session Management](/ja-JP/concepts/session) を参照してください。
    - すべての field については [完全なリファレンス](/ja-JP/gateway/configuration-reference#session) を参照してください。

  </Accordion>

  <Accordion title="sandboxing を有効にする">
    分離された sandbox runtime で agent session を実行します:

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

    先に image をビルドしてください: `scripts/sandbox-setup.sh`

    完全なガイドについては [Sandboxing](/ja-JP/gateway/sandboxing)、すべてのオプションについては [完全なリファレンス](/ja-JP/gateway/configuration-reference#agentsdefaultssandbox) を参照してください。

  </Accordion>

  <Accordion title="公式 iOS ビルド向けに relay-backed push を有効にする">
    relay-backed push は `openclaw.json` で設定します。

    gateway config には次を設定します:

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

    CLI 相当:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    これが行うこと:

    - Gateway が外部 relay 経由で `push.test`、wake nudge、および reconnect wake を送信できるようにします。
- ペアリング済み iOS app から転送される registration スコープの send grant を使用します。gateway にデプロイ全体共通の relay token は不要です。
- 各 relay-backed registration は、iOS app がペアリングした gateway identity に紐付けられるため、別の gateway が保存済み registration を再利用することはできません。
- ローカル/手動の iOS ビルドは direct APNs のままです。relay-backed 送信は、relay を通じて登録した公式配布ビルドにのみ適用されます。
- registration と送信トラフィックが同じ relay deployment に到達するよう、公式/TestFlight iOS ビルドに埋め込まれた relay base URL と一致している必要があります。

エンドツーエンドのフロー:

1. 同じ relay base URL でコンパイルされた公式/TestFlight iOS ビルドをインストールします。
2. gateway で `gateway.push.apns.relay.baseUrl` を設定します。
3. iOS app を gateway にペアリングし、node と operator の両セッションを接続します。
4. iOS app は gateway identity を取得し、App Attest と app receipt を使用して relay に登録し、その後 relay-backed の `push.apns.register` payload をペアリング済み gateway に公開します。
5. gateway は relay handle と send grant を保存し、それらを `push.test`、wake nudge、および reconnect wake に使用します。

運用上の注記:

- iOS app を別の gateway に切り替える場合は、app を再接続して、その gateway に紐付いた新しい relay registration を公開できるようにしてください。
- 別の relay deployment を指す新しい iOS ビルドを配布した場合、app は古い relay origin を再利用せず、キャッシュ済み relay registration を更新します。

互換性に関する注記:

- `OPENCLAW_APNS_RELAY_BASE_URL` と `OPENCLAW_APNS_RELAY_TIMEOUT_MS` は、一時的な env override として引き続き機能します。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` は loopback 専用の開発用 escape hatch のままです。config に HTTP relay URL を永続化しないでください。

エンドツーエンドのフローについては [iOS App](/ja-JP/platforms/ios#relay-backed-push-for-official-builds)、relay のセキュリティモデルについては [Authentication and trust flow](/ja-JP/platforms/ios#authentication-and-trust-flow) を参照してください。

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

    - `every`: duration 文字列（`30m`、`2h`）。無効にするには `0m` を設定します。
    - `target`: `last` | `none` | `<channel-id>`（例: `discord`、`matrix`、`telegram`、または `whatsapp`）
    - `directPolicy`: DM 形式の heartbeat target に対して `allow`（デフォルト）または `block`
    - 完全なガイドは [Heartbeat](/ja-JP/gateway/heartbeat) を参照してください。

  </Accordion>

  <Accordion title="Cron ジョブを設定する">
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
    - `runLog`: `cron/runs/<jobId>.jsonl` をサイズと保持行数で削除します。
    - 機能概要と CLI 例については [Cron jobs](/ja-JP/automation/cron-jobs) を参照してください。

  </Accordion>

  <Accordion title="Webhook（hooks）を設定する">
    Gateway で HTTP Webhook endpoint を有効にします:

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

    セキュリティに関する注記:
    - すべての hook/Webhook payload 内容は信頼できない入力として扱ってください。
    - 専用の `hooks.token` を使用してください。共有 Gateway token を再利用しないでください。
    - Hook auth はヘッダーのみです（`Authorization: Bearer ...` または `x-openclaw-token`）。query-string token は拒否されます。
    - `hooks.path` は `/` にできません。Webhook ingress は `/hooks` のような専用サブパスにしてください。
    - 厳密に範囲を限定したデバッグを行う場合を除き、安全でない content のバイパスフラグ（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`）は無効のままにしてください。
    - `hooks.allowRequestSessionKey` を有効にする場合は、呼び出し元が選択できる session key を制限するため、`hooks.allowedSessionKeyPrefixes` も設定してください。
    - hook 駆動の agent では、強力で現代的な model tier と厳格な tool ポリシー（たとえば、可能なら messaging のみ + sandboxing）を推奨します。

    すべての mapping オプションと Gmail 統合については [完全なリファレンス](/ja-JP/gateway/configuration-reference#hooks) を参照してください。

  </Accordion>

  <Accordion title="マルチエージェントルーティングを設定する">
    別々の workspace と session を持つ複数の分離 agent を実行します:

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

    バインディングルールと agent ごとのアクセスプロファイルについては [Multi-Agent](/ja-JP/concepts/multi-agent) と [完全なリファレンス](/ja-JP/gateway/configuration-reference#multi-agent-routing) を参照してください。

  </Accordion>

  <Accordion title="config を複数ファイルに分割する（$include）">
    大きな config を整理するには `$include` を使います:

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

    - **単一ファイル**: その object 全体を置き換えます
    - **ファイル配列**: 順番に deep merge されます（後勝ち）
    - **兄弟 key**: include 後に merge されます（include された値を上書き）
    - **ネストした include**: 最大 10 階層までサポート
    - **相対 path**: include 元ファイル基準で解決
    - **OpenClaw 所有の書き込み**: `plugins: { $include: "./plugins.json5" }` のように単一ファイル include によって支えられた 1 つのトップレベル section だけが変更される場合、
      OpenClaw はその include 先ファイルを更新し、`openclaw.json` はそのままにします
    - **サポートされない write-through**: root include、include 配列、および兄弟 override を持つ include は、config をフラット化する代わりに OpenClaw 所有の書き込みで fail closed します
    - **エラー処理**: ファイル欠落、parse エラー、循環 include に対して明確なエラーを返します

  </Accordion>
</AccordionGroup>

## config の hot reload

Gateway は `~/.openclaw/openclaw.json` を監視し、自動的に変更を適用します。ほとんどの設定では手動再起動は不要です。

直接のファイル編集は、検証に通るまで信頼されないものとして扱われます。watcher は
エディタの一時書き込み/rename の揺れが落ち着くのを待ち、
最終ファイルを読み取り、last-known-good config を復元することで
無効な外部編集を拒否します。OpenClaw 所有の
config 書き込みも、書き込む前に同じ schema gate を使います。`gateway.mode` を落とす、
ファイルサイズを半分超縮小する、といった破壊的 clobber は拒否され、
確認用に `.rejected.*` として保存されます。

ログに `Config auto-restored from last-known-good` または
`config reload restored last-known-good config` が表示された場合は、
`openclaw.json` の隣にある対応する `.clobbered.*` ファイルを確認し、
拒否された payload を修正してから `openclaw config validate` を実行してください。
復旧チェックリストについては [Gateway troubleshooting](/ja-JP/gateway/troubleshooting#gateway-restored-last-known-good-config)
を参照してください。

### reload モード

| モード                 | 動作                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| **`hybrid`**（デフォルト） | 安全な変更は即時に hot-apply します。重要な変更では自動的に再起動します。                 |
| **`hot`**              | 安全な変更のみ hot-apply します。再起動が必要な場合は警告をログに出し、対応は手動です。   |
| **`restart`**          | 安全かどうかに関係なく、あらゆる config 変更で Gateway を再起動します。                   |
| **`off`**              | ファイル監視を無効化します。変更は次回の手動再起動時に反映されます。                      |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### hot-apply されるものと再起動が必要なもの

ほとんどの field はダウンタイムなしで hot-apply されます。`hybrid` モードでは、再起動が必要な変更は自動的に処理されます。

| カテゴリ              | フィールド                                                        | 再起動が必要? |
| --------------------- | ----------------------------------------------------------------- | ------------- |
| Channels              | `channels.*`、`web`（WhatsApp）— すべての built-in と plugin channels | 不要          |
| Agent と models       | `agent`、`agents`、`models`、`routing`                            | 不要          |
| Automation            | `hooks`、`cron`、`agent.heartbeat`                                | 不要          |
| Sessions と messages  | `session`、`messages`                                             | 不要          |
| Tools と media        | `tools`、`browser`、`skills`、`audio`、`talk`                     | 不要          |
| UI とその他           | `ui`、`logging`、`identity`、`bindings`                           | 不要          |
| Gateway サーバー      | `gateway.*`（port、bind、auth、Tailscale、TLS、HTTP）             | **必要**      |
| Infrastructure        | `discovery`、`canvasHost`、`plugins`                              | **必要**      |

<Note>
`gateway.reload` と `gateway.remote` は例外です。これらを変更しても**再起動はトリガーされません**。
</Note>

### reload 計画

`$include` を通じて参照されているソースファイルを編集すると、OpenClaw は
フラット化されたインメモリ view ではなく、ソースで記述されたレイアウトから
reload を計画します。これにより、`plugins: { $include: "./plugins.json5" }` のように
単一のトップレベル section が専用の include ファイルに入っている場合でも、
hot-reload の判断（hot-apply か再起動か）が予測可能になります。
ソースレイアウトが曖昧な場合、reload 計画は fail closed します。

## Config RPC（プログラムによる更新）

gateway API 経由で config を書き込むツールでは、次のフローを推奨します:

- 1 つの subtree を調べるには `config.schema.lookup`（浅い schema node + child
  summary）
- 現在の snapshot と `hash` を取得するには `config.get`
- 部分更新には `config.patch`（JSON merge patch: object は merge、`null`
  は削除、array は置換）
- config 全体を置き換える意図がある場合のみ `config.apply`
- 明示的な self-update + 再起動には `update.run`

<Note>
コントロールプレーン書き込み（`config.apply`、`config.patch`、`update.run`）は、
`deviceId+clientIp` ごとに 60 秒あたり 3 リクエストにレート制限されています。
再起動リクエストは集約された上で、再起動サイクル間に 30 秒のクールダウンを強制します。
</Note>

部分 patch の例:

```bash
openclaw gateway call config.get --params '{}'  # payload.hash を取得
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` と `config.patch` はどちらも `raw`、`baseHash`、`sessionKey`、
`note`、`restartDelayMs` を受け付けます。config がすでに存在する場合、
両メソッドとも `baseHash` が必須です。

## 環境変数

OpenClaw は親プロセスに加えて、次の env vars を読み取ります:

- 現在の作業ディレクトリにある `.env`（存在する場合）
- `~/.openclaw/.env`（グローバル fallback）

どちらのファイルも既存の env vars を上書きしません。config にインライン env vars を設定することもできます:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell env のインポート（任意）">
  有効で、期待される key が未設定の場合、OpenClaw はログイン shell を実行し、不足している key のみをインポートします:

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
  任意の config 文字列値内で `${VAR_NAME}` を使って env vars を参照できます:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

ルール:

- 一致するのは大文字の名前のみ: `[A-Z_][A-Z0-9_]*`
- 存在しない/空の vars は読み込み時エラーになります
- リテラル出力にするには `$${VAR}` でエスケープします
- `$include` ファイル内でも動作します
- インライン置換: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRef（env、file、exec）">
  SecretRef object をサポートする field では、次を使用できます:

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

SecretRef の詳細（`env`/`file`/`exec` 用の `secrets.providers` を含む）は [Secrets Management](/ja-JP/gateway/secrets) にあります。
サポートされる認証情報 path は [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface) に一覧があります。
</Accordion>

優先順位と参照元の完全な説明については [Environment](/ja-JP/help/environment) を参照してください。

## 完全なリファレンス

完全なフィールド別リファレンスについては、**[Configuration Reference](/ja-JP/gateway/configuration-reference)** を参照してください。

---

_関連: [Configuration Examples](/ja-JP/gateway/configuration-examples) · [Configuration Reference](/ja-JP/gateway/configuration-reference) · [Doctor](/ja-JP/gateway/doctor)_
