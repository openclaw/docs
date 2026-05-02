---
read_when:
    - OpenClawを初めてセットアップする
    - 一般的な設定パターンを探しています
    - 特定の設定セクションへの移動
summary: '設定の概要: 一般的なタスク、簡単なセットアップ、完全なリファレンスへのリンク'
title: 設定
x-i18n:
    generated_at: "2026-05-02T04:54:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: d5ad1685170923f26166fb2f74891468d16c6f86af5cc5f5f1da7a6dce65eb98
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw は、任意の <Tooltip tip="JSON5 はコメントと末尾のカンマをサポートします">**JSON5**</Tooltip> config を `~/.openclaw/openclaw.json` から読み込みます。
有効な config パスは通常ファイルである必要があります。シンボリックリンクされた `openclaw.json`
レイアウトは、OpenClaw が所有する書き込みではサポートされません。アトミック書き込みにより、
シンボリックリンクを保持する代わりにそのパスが置き換えられる場合があります。config を
既定の state ディレクトリ外に置く場合は、`OPENCLAW_CONFIG_PATH` が実ファイルを直接指すようにしてください。

ファイルがない場合、OpenClaw は安全な既定値を使用します。config を追加する一般的な理由:

- チャンネルを接続し、誰が bot にメッセージを送れるかを制御する
- モデル、ツール、sandboxing、または自動化 (cron、hooks) を設定する
- sessions、メディア、ネットワーク、または UI を調整する

利用可能なすべてのフィールドについては、[完全なリファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

Agents と自動化は、config を編集する前に正確なフィールド単位の
docs として `config.schema.lookup` を使用してください。このページはタスク指向のガイダンスに、
[Configuration reference](/ja-JP/gateway/configuration-reference) はより広範な
フィールドマップと既定値に使用してください。

<Tip>
**configuration が初めてですか?** 対話式セットアップには `openclaw onboard` から始めるか、完全にコピーして貼り付けられる config については [Configuration Examples](/ja-JP/gateway/configuration-examples) ガイドを確認してください。
</Tip>

## 最小 config

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## config の編集

<Tabs>
  <Tab title="対話式ウィザード">
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
    [http://127.0.0.1:18789](http://127.0.0.1:18789) を開き、**Config** タブを使用します。
    Control UI は live config schema からフォームをレンダリングします。フィールド
    `title` / `description` docs metadata に加え、利用可能な場合は plugin と channel schemas も含まれ、
    escape hatch として **Raw JSON** editor が用意されています。ドリルダウン
    UI やその他の tooling 向けに、gateway は `config.schema.lookup` も公開し、
    1 つのパススコープ schema node と直下の child summaries を取得できます。
  </Tab>
  <Tab title="直接編集">
    `~/.openclaw/openclaw.json` を直接編集します。Gateway はファイルを監視し、変更を自動的に適用します ([hot reload](#config-hot-reload) を参照)。
  </Tab>
</Tabs>

## 厳密な検証

<Warning>
OpenClaw は schema に完全に一致する configurations のみを受け入れます。不明な key、不正な type、または無効な値があると、Gateway は**起動を拒否**します。唯一の root-level 例外は `$schema` (string) で、editors が JSON Schema metadata を付与できるようにするためです。
</Warning>

`openclaw config schema` は、Control UI と検証で使用される正規の JSON Schema を出力します。
`config.schema.lookup` は、ドリルダウン tooling 向けに、1 つのパススコープ node と
child summaries を取得します。フィールド `title`/`description` docs metadata は、
ネストした objects、wildcard (`*`)、array-item (`[]`)、および `anyOf`/
`oneOf`/`allOf` branches を通じて引き継がれます。manifest registry が読み込まれると、
runtime plugin と channel schemas が merge されます。

検証に失敗した場合:

- Gateway は boot しない
- diagnostic commands のみ動作する (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- 正確な問題を確認するには `openclaw doctor` を実行する
- repairs を適用するには `openclaw doctor --fix` (または `--yes`) を実行する

Gateway は、起動に成功するたびに信頼済みの last-known-good copy を保持します。
その後 `openclaw.json` が検証に失敗した場合 (または `gateway.mode` が削除されたり、急激に縮小したり、
先頭に stray log line が付いた場合)、OpenClaw は壊れたファイルを
`.clobbered.*` として保持し、last-known-good copy を復元し、recovery
reason をログに記録します。次の agent turn でも system-event warning を受け取り、main
agent が復元された config を盲目的に書き換えないようにします。候補に `***` などの redacted secret placeholders が含まれる場合、
last-known-good への promotion はスキップされます。
すべての validation issue が `plugins.entries.<id>...` に scoped されている場合、OpenClaw は
whole-file recovery を実行しません。現在の config を active に保ち、
plugin-local failure を表面化するため、plugin schema または host-version mismatch によって
無関係な user settings が roll back されることはありません。

## 一般的なタスク

<AccordionGroup>
  <Accordion title="チャンネルを設定する (WhatsApp、Telegram、Discord など)">
    各チャンネルには、`channels.<provider>` の下に独自の config section があります。セットアップ手順については、専用のチャンネルページを参照してください:

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

    すべてのチャンネルは同じ DM policy pattern を共有します:

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
    primary model と任意の fallbacks を設定します:

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

    - `agents.defaults.models` は model catalog を定義し、`/model` の allowlist として機能します。
    - 既存の models を削除せずに allowlist entries を追加するには、`openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使用します。entries を削除することになる単純な置き換えは、`--replace` を渡さない限り拒否されます。
    - Model refs は `provider/model` 形式を使用します (例: `anthropic/claude-opus-4-6`)。
    - `agents.defaults.imageMaxDimensionPx` は transcript/tool image の downscaling を制御します (既定値 `1200`)。低い値は通常、screenshot-heavy runs で vision-token 使用量を減らします。
    - chat で models を切り替える方法については [Models CLI](/ja-JP/concepts/models) を、auth rotation と fallback behavior については [Model Failover](/ja-JP/concepts/model-failover) を参照してください。
    - custom/self-hosted providers については、reference の [Custom providers](/ja-JP/gateway/config-tools#custom-providers-and-base-urls) を参照してください。

  </Accordion>

  <Accordion title="誰が bot にメッセージを送れるかを制御する">
    DM access は channel ごとに `dmPolicy` で制御されます:

    - `"pairing"` (既定): 不明な送信者は承認用の one-time pairing code を受け取る
    - `"allowlist"`: `allowFrom` (または paired allow store) 内の送信者のみ
    - `"open"`: すべての inbound DMs を許可する (`allowFrom: ["*"]` が必要)
    - `"disabled"`: すべての DMs を無視する

    groups には、`groupPolicy` + `groupAllowFrom` または channel-specific allowlists を使用します。

    channel ごとの詳細については、[完全なリファレンス](/ja-JP/gateway/config-channels#dm-and-group-access)を参照してください。

  </Accordion>

  <Accordion title="group chat mention gating を設定する">
    Group messages は既定で **require mention** です。agent ごとに trigger patterns を設定し、legacy automatic final replies を意図的に使いたい場合を除き、visible room replies は既定の message-tool path のままにします:

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

    - **Metadata mentions**: native @-mentions (WhatsApp tap-to-mention、Telegram @bot など)
    - **Text patterns**: `mentionPatterns` 内の安全な regex patterns
    - **Visible replies**: `messages.visibleReplies` は globally に message-tool sends を必須にできます。`messages.groupChat.visibleReplies` は groups/channels でそれを override します。
    - visible reply modes、channel ごとの overrides、self-chat mode については、[完全なリファレンス](/ja-JP/gateway/config-channels#group-chat-mention-gating)を参照してください。

  </Accordion>

  <Accordion title="agent ごとに Skills を制限する">
    shared baseline には `agents.defaults.skills` を使用し、その後 specific
    agents を `agents.list[].skills` で override します:

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

    - 既定で unrestricted skills にするには、`agents.defaults.skills` を省略します。
    - defaults を継承するには、`agents.list[].skills` を省略します。
    - skills なしにするには、`agents.list[].skills: []` を設定します。
    - [Skills](/ja-JP/tools/skills)、[Skills config](/ja-JP/tools/skills-config)、および
      [Configuration Reference](/ja-JP/gateway/config-agents#agents-defaults-skills) を参照してください。

  </Accordion>

  <Accordion title="gateway channel health monitoring を調整する">
    stale に見えるチャンネルを gateway がどれだけ積極的に再起動するかを制御します:

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

    - health-monitor restarts を globally に無効化するには、`gateway.channelHealthCheckMinutes: 0` を設定します。
    - `channelStaleEventThresholdMinutes` は check interval 以上にする必要があります。
    - global monitor を無効化せずに 1 つの channel または account の auto-restarts を無効化するには、`channels.<provider>.healthMonitor.enabled` または `channels.<provider>.accounts.<id>.healthMonitor.enabled` を使用します。
    - operational debugging については [Health Checks](/ja-JP/gateway/health) を、すべての fields については [完全なリファレンス](/ja-JP/gateway/configuration-reference#gateway) を参照してください。

  </Accordion>

  <Accordion title="gateway WebSocket handshake timeout を調整する">
    負荷が高い host や low-powered hosts で、pre-auth WebSocket handshake を完了する時間を
    local clients により長く与えます:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - 既定値は `15000` milliseconds です。
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` は、one-off service または shell overrides に引き続き優先されます。
    - まず startup/event-loop stalls の修正を優先してください。この knob は、healthy だが warmup 中に遅い hosts 向けです。

  </Accordion>

  <Accordion title="sessions と resets を設定する">
    Sessions は conversation continuity と isolation を制御します:

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
    - `threadBindings`: スレッドにバインドされたセッションルーティングのグローバルデフォルト (Discord は `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` をサポートします)。
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

  <Accordion title="公式 iOS ビルド向けのリレーバックアップ Push を有効にする">
    リレーバックアップ Push は `openclaw.json` で設定します。

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

    CLI での同等設定:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    これにより行われること:

    - Gateway が `push.test`、ウェイクのナッジ、再接続ウェイクを外部リレー経由で送信できるようにします。
    - ペアリングされた iOS アプリによって転送される、登録スコープの送信許可を使用します。Gateway はデプロイ全体のリレートークンを必要としません。
    - 各リレーバックアップ登録を、iOS アプリがペアリングした Gateway ID にバインドするため、別の Gateway が保存済みの登録を再利用することはできません。
    - ローカル/手動の iOS ビルドは直接 APNs のままにします。リレーバックアップ送信は、リレー経由で登録された公式配布ビルドにのみ適用されます。
    - 登録トラフィックと送信トラフィックが同じリレーデプロイメントに到達するよう、公式/TestFlight iOS ビルドに組み込まれたリレーのベース URL と一致している必要があります。

    エンドツーエンドのフロー:

    1. 同じリレーのベース URL でコンパイルされた公式/TestFlight iOS ビルドをインストールします。
    2. Gateway で `gateway.push.apns.relay.baseUrl` を設定します。
    3. iOS アプリを Gateway にペアリングし、ノードセッションとオペレーターセッションの両方を接続させます。
    4. iOS アプリは Gateway ID を取得し、App Attest とアプリレシートを使用してリレーに登録し、その後リレーバックアップ `push.apns.register` ペイロードをペアリング済み Gateway に公開します。
    5. Gateway はリレーハンドルと送信許可を保存し、それらを `push.test`、ウェイクのナッジ、再接続ウェイクに使用します。

    運用上の注意:

    - iOS アプリを別の Gateway に切り替える場合は、その Gateway にバインドされた新しいリレー登録を公開できるようにアプリを再接続してください。
    - 別のリレーデプロイメントを指す新しい iOS ビルドを出荷する場合、アプリは古いリレーオリジンを再利用せず、キャッシュされたリレー登録を更新します。

    互換性に関する注意:

    - `OPENCLAW_APNS_RELAY_BASE_URL` と `OPENCLAW_APNS_RELAY_TIMEOUT_MS` は一時的な環境変数オーバーライドとして引き続き機能します。
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

    - `every`: duration 文字列 (`30m`、`2h`)。無効にするには `0m` を設定します。
    - `target`: `last` | `none` | `<channel-id>` (例: `discord`、`matrix`、`telegram`、`whatsapp`)
    - `directPolicy`: DM スタイルの Heartbeat ターゲットに対して `allow` (デフォルト) または `block`
    - 完全なガイドについては [Heartbeat](/ja-JP/gateway/heartbeat) を参照してください。

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

    - `sessionRetention`: 完了した分離実行セッションを `sessions.json` から削除します (デフォルトは `24h`。無効にするには `false` を設定します)。
    - `runLog`: `cron/runs/<jobId>.jsonl` をサイズと保持行数で削除します。
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
    - すべてのフック/Webhook ペイロード内容を信頼できない入力として扱ってください。
    - 専用の `hooks.token` を使用し、共有 Gateway トークンを再利用しないでください。
    - フック認証はヘッダーのみです (`Authorization: Bearer ...` または `x-openclaw-token`)。クエリ文字列トークンは拒否されます。
    - `hooks.path` を `/` にすることはできません。Webhook の入口は `/hooks` のような専用サブパスにしてください。
    - 厳密にスコープを絞ったデバッグを行う場合を除き、安全でないコンテンツのバイパスフラグ (`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`) は無効のままにしてください。
    - `hooks.allowRequestSessionKey` を有効にする場合は、呼び出し元が選択するセッションキーを制限するために `hooks.allowedSessionKeyPrefixes` も設定してください。
    - フック駆動のエージェントでは、強力な最新モデル階層と厳格なツールポリシー (たとえばメッセージングのみ、可能な場合はサンドボックス化も併用) を推奨します。

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

    - **単一ファイル**: 含んでいるオブジェクトを置き換えます
    - **ファイルの配列**: 順番にディープマージされます (後のものが優先)
    - **兄弟キー**: include の後にマージされます (include された値を上書き)
    - **ネストされた include**: 最大 10 レベルまでサポートされます
    - **相対パス**: include しているファイルを基準に解決されます
    - **OpenClaw 所有の書き込み**: `plugins: { $include: "./plugins.json5" }` のように、単一ファイル include によって裏付けられたトップレベルセクション 1 つだけを変更する書き込みの場合、OpenClaw はその include されたファイルを更新し、`openclaw.json` はそのままにします
    - **サポートされない書き込みスルー**: ルート include、include 配列、兄弟上書きを伴う include は、設定をフラット化する代わりに、OpenClaw 所有の書き込みでは安全側に倒して失敗します
    - **閉じ込め**: `$include` パスは `openclaw.json` を含むディレクトリ配下に解決される必要があります。マシン間またはユーザー間でツリーを共有するには、include が参照できる追加ディレクトリのパスリスト (POSIX では `:`、Windows では `;`) を `OPENCLAW_INCLUDE_ROOTS` に設定します。シンボリックリンクは解決されて再チェックされるため、字句上は設定ディレクトリ内にあるが実際のターゲットが許可されたすべてのルート外へ抜けるパスは、引き続き拒否されます。
    - **エラー処理**: 欠落ファイル、解析エラー、循環 include に対して明確なエラーを出します

  </Accordion>
</AccordionGroup>

## 設定のホットリロード

Gateway は `~/.openclaw/openclaw.json` を監視し、変更を自動的に適用します。ほとんどの設定では手動再起動は不要です。

直接のファイル編集は、検証に通るまで信頼されないものとして扱われます。ウォッチャーはエディターの一時書き込み/リネームの揺れが落ち着くのを待ち、最終ファイルを読み取り、最後に確認された正常な設定を復元することで無効な外部編集を拒否します。OpenClaw 所有の設定書き込みは、書き込み前に同じスキーマゲートを使用します。`gateway.mode` の削除やファイルサイズを半分未満に縮小するような破壊的な上書きは拒否され、検査用に `.rejected.*` として保存されます。

Plugin ローカルの検証失敗は例外です。すべての問題が `plugins.entries.<id>...` 配下にある場合、リロードは現在の設定を維持し、`.last-good` を復元する代わりに Plugin の問題を報告します。

ログに `Config auto-restored from last-known-good` または `config reload restored last-known-good config` が表示された場合は、`openclaw.json` の隣にある対応する `.clobbered.*` ファイルを調べ、拒否されたペイロードを修正してから `openclaw config validate` を実行してください。復旧チェックリストについては [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-restored-last-known-good-config) を参照してください。

### リロードモード

| モード                 | 動作                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (デフォルト) | 安全な変更を即座にホット適用します。重要な変更では自動的に再起動します。              |
| **`hot`**              | 安全な変更のみをホット適用します。再起動が必要な場合は警告をログに記録します。対応は利用者が行います。 |
| **`restart`**          | 安全かどうかに関係なく、設定変更があるたびに Gateway を再起動します。                 |
| **`off`**              | ファイル監視を無効にします。変更は次回の手動再起動時に有効になります。               |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ホット適用されるものと再起動が必要なもの

ほとんどのフィールドはダウンタイムなしでホット適用されます。`hybrid` モードでは、再起動が必要な変更は自動的に処理されます。

| カテゴリ            | フィールド                                                            | 再起動は必要? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| チャンネル            | `channels.*`, `web` (WhatsApp) — すべての組み込みおよび Plugin チャンネル | いいえ              |
| エージェントとモデル      | `agent`, `agents`, `models`, `routing`                            | いいえ              |
| 自動化          | `hooks`, `cron`, `agent.heartbeat`                                | いいえ              |
| セッションとメッセージ | `session`, `messages`                                             | いいえ              |
| ツールとメディア       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | いいえ              |
| UI とその他           | `ui`, `logging`, `identity`, `bindings`                           | いいえ              |
| Gateway サーバー      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **はい**         |
| インフラストラクチャ      | `discovery`, `canvasHost`, `plugins`                              | **はい**         |

<Note>
`gateway.reload` と `gateway.remote` は例外です — これらを変更しても再起動はトリガーされません。
</Note>

### リロード計画

`$include` 経由で参照されているソースファイルを編集すると、OpenClaw は
フラット化されたメモリ内ビューではなく、ソースで記述されたレイアウトからリロードを計画します。
これにより、`plugins: { $include: "./plugins.json5" }` のように
単一のトップレベルセクションが独自のインクルードファイルにある場合でも、
ホットリロードの判断（ホット適用か再起動か）が予測しやすくなります。ソースレイアウトが曖昧な場合、リロード計画は安全側に倒して失敗します。

## Config RPC（プログラムによる更新）

Gateway API 経由で設定を書き込むツールでは、次のフローを推奨します。

- `config.schema.lookup` で 1 つのサブツリーを調べる（浅いスキーマノード + 子の
  サマリー）
- `config.get` で現在のスナップショットと `hash` を取得する
- `config.patch` で部分更新する（JSON マージパッチ: オブジェクトはマージ、`null`
  は削除、配列は置換）
- 設定全体を置き換える意図がある場合のみ `config.apply` を使う
- 明示的な自己更新と再起動には `update.run` を使う
- 最新の更新再起動センチネルを確認し、再起動後に実行中のバージョンを検証するには `update.status` を使う

エージェントは、正確なフィールド単位のドキュメントと制約を確認する最初の場所として
`config.schema.lookup` を扱うべきです。より広範な設定マップ、デフォルト、または専用サブシステム参照へのリンクが必要な場合は、[設定リファレンス](/ja-JP/gateway/configuration-reference)
を使用してください。

<Note>
コントロールプレーン書き込み（`config.apply`, `config.patch`, `update.run`）は、
`deviceId+clientIp` ごとに 60 秒あたり 3 リクエストにレート制限されます。再起動リクエストは
まとめられた後、再起動サイクル間に 30 秒のクールダウンを適用します。
`update.status` は読み取り専用ですが、再起動センチネルに
更新手順のサマリーやコマンド出力の末尾が含まれる可能性があるため、管理者スコープです。
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
`note`, `restartDelayMs` を受け付けます。設定がすでに存在する場合、両方のメソッドで
`baseHash` が必須です。

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

<Accordion title="シェル環境変数のインポート（任意）">
  有効になっていて、期待されるキーが設定されていない場合、OpenClaw はログインシェルを実行し、不足しているキーだけをインポートします。

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
  `${VAR_NAME}` を使って、任意の設定文字列値で環境変数を参照できます。

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

ルール:

- 一致するのは大文字名のみ: `[A-Z_][A-Z0-9_]*`
- 変数が存在しない、または空の場合、読み込み時にエラーをスローする
- リテラル出力には `$${VAR}` でエスケープする
- `$include` ファイル内でも動作する
- インライン置換: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs（env, file, exec）">
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

完全なフィールド別リファレンスについては、**[設定リファレンス](/ja-JP/gateway/configuration-reference)** を参照してください。

---

_関連: [設定例](/ja-JP/gateway/configuration-examples) · [設定リファレンス](/ja-JP/gateway/configuration-reference) · [Doctor](/ja-JP/gateway/doctor)_

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [設定例](/ja-JP/gateway/configuration-examples)
- [Gateway ランブック](/ja-JP/gateway)
