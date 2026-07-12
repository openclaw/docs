---
read_when:
    - 正確なフィールドレベルの設定セマンティクスまたはデフォルト値が必要な場合
    - チャネル、モデル、Gateway、またはツールの設定ブロックを検証している場合
summary: OpenClaw コアのキー、デフォルト、および各サブシステム専用リファレンスへのリンクに関する Gateway 設定リファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-07-12T14:32:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c8a9141db733a6513778a7218933ee5989c62db11472ec6e1e70bd8bf3fcbac8
    source_path: gateway/configuration-reference.md
    workflow: 16
---

`~/.openclaw/openclaw.json` のフィールドレベルのリファレンス：キー、デフォルト値、および各サブシステムの詳細ページへのリンク。タスク指向のセットアップガイダンスについては、[設定](/ja-JP/gateway/configuration)を参照してください。チャンネルおよびPluginが所有するコマンドカタログと、メモリ/QMDの詳細な調整項目は、ここではなくそれぞれのページに記載されています。

設定形式は **JSON5**（コメントおよび末尾のカンマを使用可能）です。すべてのフィールドは任意です。省略した場合、OpenClawは安全なデフォルト値を使用します。

コード上の実装がこのページより優先されます：

- `openclaw config schema` は、検証とControl UIで使用される最新のJSON Schemaを、バンドル済みPlugin/チャンネルのメタデータを統合した状態で出力します。
- エージェントは、設定を編集する前に、`gateway` ツールのアクション `config.schema.lookup` を呼び出し、パスでスコープされた単一の正確なスキーマノードを取得する必要があります。
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、このドキュメントのベースラインハッシュを現在のスキーマサーフェスと照合して検証します。

専用の詳細リファレンス：

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および `plugins.entries.memory-core.config.dreaming` 配下のDreaming設定については、[メモリ設定リファレンス](/ja-JP/reference/memory-config)を参照してください。
- 現在の組み込みおよびバンドル済みコマンドカタログについては、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。
- チャンネル固有のコマンドサーフェスについては、それを所有するチャンネル/Pluginのページを参照してください。

---

## チャンネル

チャンネルごとの設定キーについては、[設定 - チャンネル](/ja-JP/gateway/config-channels)を参照してください。Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、およびその他の同梱チャンネル（認証、アクセス制御、マルチアカウント、メンション制御）には `channels.*` を使用します。

## エージェントのデフォルト、マルチエージェント、セッション、メッセージ

以下については、[設定 - エージェント](/ja-JP/gateway/config-agents)を参照してください。

- `agents.defaults.*`（ワークスペース、モデル、思考、Heartbeat、メモリ、メディア、Skills、サンドボックス）
- `multiAgent.*`（マルチエージェントのルーティングとバインディング）
- `session.*`（セッションのライフサイクル、Compaction、プルーニング）
- `messages.*`（メッセージ配信、TTS、Markdown レンダリング）
- `talk.*`（トークモード）
  - `talk.consultThinkingLevel`: Control UI Talk のリアルタイム相談の背後で実行される OpenClaw エージェント全体に適用する思考レベルのオーバーライド
  - `talk.consultFastMode`: Control UIのTalkリアルタイム相談向けワンショット高速モード上書き
  - `talk.speechLocale`: iOS/macOSでのTalk音声認識用の任意のBCP 47ロケールID
  - `talk.silenceTimeoutMs`: 未設定の場合、Talkは文字起こしを送信する前の一時停止時間としてプラットフォームのデフォルト値を維持します（`700 ms on macOS and Android, 900 ms on iOS`）
  - `talk.realtime.consultRouting`: `openclaw_agent_consult`をスキップする確定済みリアルタイムTalk文字起こし向けのGatewayリレーフォールバック

## ツールとカスタムプロバイダー

ツールポリシー、実験的な切り替え設定、プロバイダーを利用するツール設定、およびカスタム
プロバイダー / ベース URL の設定については、
[設定 - ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)を参照してください。

## モデル

プロバイダー定義、モデル許可リスト、カスタムプロバイダーの設定については、
[設定 - ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools#custom-providers-and-base-urls)を参照してください。
`models` ルートは、グローバルなモデルカタログの動作も管理します。

```json5
{
  models: {
    // 任意。デフォルト: true。変更時は Gateway の再起動が必要です。
    pricing: { enabled: false },
  },
}
```

- `models.mode`: プロバイダーカタログの動作（`merge` または `replace`）。
- `models.providers`: プロバイダー ID をキーとするカスタムプロバイダーのマップ。
- `models.providers.*.localService`: ローカルモデルサーバー用の任意のオンデマンドプロセスマネージャー。OpenClaw は設定されたヘルスエンドポイントをプローブし、必要に応じて絶対パスの `command` を起動し、準備完了まで待機してからモデルリクエストを送信します。[ローカルモデルサービス](/ja-JP/gateway/local-model-services)を参照してください。
- `models.pricing.enabled`: サイドカーとチャネルが Gateway の準備完了パスに到達した後に開始される、バックグラウンドの料金情報ブートストラップを制御します。`false` の場合、Gateway は OpenRouter と LiteLLM の料金カタログ取得をスキップします。設定された `models.providers.*.models[].cost` の値は、ローカルでのコスト見積もりに引き続き使用できます。

## MCP

OpenClaw が管理する MCP サーバー定義は `mcp.servers` 配下にあり、組み込みの OpenClaw やその他のランタイムアダプターによって使用されます。`openclaw mcp list`、`show`、`set`、`unset` コマンドは、設定編集時に対象サーバーへ接続せずにこのブロックを管理します。

```json5
{
  mcp: {
    // 任意。デフォルト: 600000 ms（10 分）。アイドル時の破棄を無効にするには 0 を設定します。
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        timeout: 20,
        connectTimeout: 5,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // 任意の Codex app-server 投影制御。
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: 設定済みの MCP ツールを公開するランタイム向けの、名前付き stdio またはリモート MCP サーバー定義。
  リモートエントリでは `transport: "streamable-http"` または `transport: "sse"` を使用します。`type: "http"` は CLI ネイティブのエイリアスであり、`openclaw mcp set` と `openclaw doctor --fix` によって正規の `transport` フィールドへ正規化されます。
- `mcp.servers.<name>.enabled`: 保存済みのサーバー定義を維持しながら、組み込み OpenClaw の MCP 検出とツール投影から除外するには `false` を設定します。
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: サーバーごとの MCP リクエストタイムアウト（秒またはミリ秒）。
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: サーバーごとの接続タイムアウト（秒またはミリ秒）。
- `mcp.servers.<name>.supportsParallelToolCalls`: MCP ツール呼び出しを並列で行うかどうかを選択できるアダプター向けの、任意の並行実行ヒント。
- `mcp.servers.<name>.auth`: OAuth を必要とする HTTP MCP サーバーには `"oauth"` を設定します。OpenClaw の状態領域にトークンを保存するには、`openclaw mcp login <name>` を実行します。
- `mcp.servers.<name>.oauth`: 任意の OAuth スコープ、リダイレクト URL、クライアントメタデータ URL のオーバーライド。
- `mcp.servers.<name>.sslVerify`、`clientCert`、`clientKey`: プライベートエンドポイントおよび相互 TLS 用の HTTP TLS 制御。
- `mcp.servers.<name>.toolFilter`: サーバーごとの任意のツール選択。`include` は検出される MCP ツールを一致する名前に限定し、`exclude` は一致する名前を非表示にします。エントリには MCP ツールの完全名または単純な `*` グロブを指定します。リソースまたはプロンプトを持つサーバーでは、ユーティリティツール名（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`）も生成され、それらの名前にも同じフィルターが適用されます。
- `mcp.servers.<name>.codex`: 任意の Codex app-server 投影制御。
  このブロックは Codex app-server スレッド専用の OpenClaw メタデータであり、ACP セッション、汎用 Codex ハーネス設定、その他のランタイムアダプターには影響しません。
  空でない `codex.agents` は、サーバーを列挙された OpenClaw エージェント ID に限定します。
  空、空白、または無効なスコープ付きエージェントリストは、グローバルとして扱われるのではなく、設定検証で拒否され、ランタイム投影パスから省略されます。
  `codex.defaultToolsApprovalMode` は、そのサーバー用に Codex ネイティブの `default_tools_approval_mode` を出力します。OpenClaw は、ネイティブの `mcp_servers` 設定を Codex に渡す前に `codex` ブロックを取り除きます。このブロックを省略すると、Codex のデフォルトの MCP 承認動作を使用して、すべての Codex app-server エージェントにサーバーが投影されます。
- `mcp.sessionIdleTtlMs`: セッションスコープのバンドル済み MCP ランタイムに対するアイドル TTL。
  1 回限りの組み込み実行では実行終了時のクリーンアップを要求します。この TTL は、長時間存続するセッションと将来の呼び出し元に対する安全策です。
- `mcp.*` 配下の変更は、キャッシュされたセッション MCP ランタイムを破棄することで即時適用されます。
  次回のツール検出または使用時に新しい設定から再作成されるため、削除された `mcp.servers` エントリは、アイドル TTL を待たずに即座に回収されます。
- ランタイム検出では、MCP ツールリストの変更通知も考慮し、そのセッションのキャッシュ済みカタログを破棄します。リソースまたはプロンプトを公開するサーバーには、リソースの一覧表示と読み取り、およびプロンプトの一覧表示と取得を行うユーティリティツールが追加されます。ツール呼び出しが繰り返し失敗すると、影響を受けたサーバーは次回の呼び出しを試行する前に短時間停止します。

ランタイムの動作については、[MCP](/ja-JP/cli/mcp#openclaw-as-an-mcp-client-registry)および
[CLI バックエンド](/ja-JP/gateway/cli-backends#bundle-mcp-overlays)を参照してください。

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    workshop: {
      allowSymlinkTargetWrites: false,
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // またはプレーンテキスト文字列
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: バンドル済み Skills のみを対象とする任意の許可リスト（管理対象またはワークスペースの Skills には影響しません）。
- `load.extraDirs`: 追加の共有 Skill ルート（優先順位は最低）。
- `load.allowSymlinkTargets`: Skill のシンボリックリンクが設定済みのソースルート外にある場合に、リンクの解決先として許可される信頼済みの実ターゲットルート。
- `workshop.allowSymlinkTargetWrites`: Skill Workshop の適用処理が、すでに信頼されているシンボリックリンクのターゲットを通じて書き込むことを許可します（デフォルト: false）。
- `install.preferBrew`: true の場合、`brew` が利用可能であれば、他の種類のインストーラーへフォールバックする前に Homebrew インストーラーを優先します。
- `install.nodeManager`: `metadata.openclaw.install` 仕様に対する Node インストーラーの優先設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `install.allowUploadedArchives`: 信頼済みの `operator.admin` Gateway クライアントが、`skills.upload.*` を通じてステージングされた非公開 zip アーカイブをインストールできるようにします（デフォルト: false）。これはアップロード済みアーカイブのパスのみを有効にします。通常の ClawHub インストールでは必要ありません。
- `entries.<skillKey>.enabled: false` は、バンドル済みまたはインストール済みであっても Skill を無効にします。
- `entries.<skillKey>.apiKey`: プライマリ環境変数を宣言する Skills 向けの簡易設定（プレーンテキスト文字列または SecretRef オブジェクト）。
- `limits.maxCandidatesPerRoot`、`limits.maxSkillsLoadedPerSource`、`limits.maxSkillsInPrompt`、`limits.maxSkillsPromptChars`、`limits.maxSkillFileBytes`: Skill の検出とモデル向け Skills プロンプトに上限を設定します。
- Skill Workshop の自律性と承認の設定（`workshop.autonomous.enabled`、`workshop.approvalPolicy`、`workshop.maxPending`、`workshop.maxSkillBytes`）については、[Skills の設定](/ja-JP/tools/skills-config)を参照してください。

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- `~/.openclaw/extensions` および `<workspace>/.openclaw/extensions` 配下のパッケージまたはバンドルディレクトリに加え、`plugins.load.paths` に列挙されたファイルまたはディレクトリから読み込まれます。
- スタンドアロンのプラグインファイルは `plugins.load.paths` に配置してください。自動検出される拡張機能ルートでは、ルート内のヘルパースクリプトが起動を妨げないよう、トップレベルの `.js`、`.mjs`、`.ts` ファイルは無視されます。
- 検出では、ネイティブ OpenClaw プラグインに加え、互換性のある Codex バンドルと Claude バンドル（マニフェストのない Claude デフォルトレイアウトのバンドルを含む）を受け入れます。
- **設定変更後は Gateway の再起動が必要です。**
- `allow`: オプションの許可リスト（列挙されたプラグインのみ読み込まれます）。`deny` が優先されます。
- `plugins.entries.<id>.apiKey`: プラグインレベルの API キー用簡易フィールド（プラグインが対応している場合）。
- `plugins.entries.<id>.env`: プラグインスコープの環境変数マップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、コアは `before_prompt_build` をブロックし、従来の `before_agent_start` に含まれるプロンプト変更フィールドを無視しますが、従来の `modelOverride` と `providerOverride` は保持します。ネイティブプラグインのフックと、対応するバンドル提供のフックディレクトリに適用されます。
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` の場合、信頼された非バンドルプラグインは、`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end` などの型付きフックから未加工の会話内容を読み取れます。
- `plugins.entries.<id>.subagent.allowModelOverride`: バックグラウンドのサブエージェント実行ごとに `provider` と `model` のオーバーライドを要求することを、このプラグインに明示的に許可します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼されたサブエージェントのオーバーライドに使用できる正規の `provider/model` ターゲットのオプション許可リスト。意図的に任意のモデルを許可する場合にのみ `"*"` を使用してください。
- `plugins.entries.<id>.llm.allowModelOverride`: `api.runtime.llm.complete` のモデルオーバーライドを要求することを、このプラグインに明示的に許可します。
- `plugins.entries.<id>.llm.allowedModels`: 信頼されたプラグインの LLM 補完オーバーライドに使用できる正規の `provider/model` ターゲットのオプション許可リスト。意図的に任意のモデルを許可する場合にのみ `"*"` を使用してください。
- `plugins.entries.<id>.llm.allowAgentIdOverride`: デフォルト以外のエージェント ID に対して `api.runtime.llm.complete` を実行することを、このプラグインに明示的に許可します。
- `plugins.entries.<id>.config`: プラグイン定義の設定オブジェクト（利用可能な場合はネイティブ OpenClaw プラグインスキーマで検証されます）。
- チャネルプラグインのアカウント／ランタイム設定は `channels.<id>` 配下に置かれ、中央の OpenClaw オプションレジストリではなく、所有プラグインのマニフェストにある `channelConfigs` メタデータで記述する必要があります。

### Codex ハーネスのプラグイン設定

バンドルされた `codex` プラグインは、ネイティブ Codex app-server ハーネスの設定を
`plugins.entries.codex.config` 配下で所有します。完全な設定項目については
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)、ランタイムモデルについては
[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。

`codexPlugins` は、ネイティブ Codex ハーネスを選択したセッションにのみ適用されます。
OpenClaw プロバイダーの実行、ACP
会話バインディング、または Codex 以外のハーネスで Codex プラグインを有効にするものではありません。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled`: Codex ハーネスでネイティブ Codex
  プラグイン／アプリのサポートを有効にします。デフォルト: `false`。
- `plugins.entries.codex.config.codexPlugins.allow_all_plugins`: 認証済み Codex アカウントに接続され、現在アクセス可能なすべてのアプリを、
  新しいネイティブ Codex スレッドごとに公開します。デフォルト: `false`。
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  設定済みプラグインアプリの要求に対する、破壊的アクションのデフォルトポリシーです。
  安全な Codex 承認スキーマを確認なしで受け入れるには `true`、拒否するには `false`、
  Codex が必要とする承認を OpenClaw プラグイン承認経由で処理するには `"auto"`、
  永続的な承認を行わず、プラグインによる書き込み／破壊的アクションのたびに確認するには `"ask"` を使用します。
  `"ask"` モードでは、対象アプリに対する Codex のツール単位の永続的な承認オーバーライドを消去し、
  Codex スレッドの開始前に、そのアプリの承認レビュー担当として人間を選択します。
  デフォルト: `true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: グローバルな `codexPlugins.enabled` も true の場合に、
  設定済みプラグインエントリを有効にします。
  明示的なエントリのデフォルト: `true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  安定したマーケットプレイス識別子です。解決されるすべてのエントリで `pluginName` とともに必須です。
  `"openai-curated"` と `"workspace-directory"` に対応します。いずれかの識別フィールドが
  欠けているエントリは無視されます。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: 安定した
  Codex プラグイン識別子です。`marketplaceName` とともに必須です。
  `workspace-directory` エントリでは、`plugin/list` が返すマーケットプレイス修飾済みの
  `summary.id` をそのまま使用する必要があります。例:
  `"example-plugin@workspace-directory"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  プラグイン単位の破壊的アクションのオーバーライドです。省略した場合は、グローバルな
  `allow_destructive_actions` 値が使用されます。プラグイン単位の値には、同じ
  `true`、`false`、`"auto"`、`"ask"` ポリシーを指定できます。

`"ask"` を使用する許可済みの各プラグインアプリは、そのアプリの承認要求を
人間のレビュー担当者に送ります。その他のアプリおよびアプリ以外のスレッド承認では、
設定済みのレビュー担当者が維持されるため、プラグインポリシーが混在していても `"ask"` の動作は継承されません。

`codexPlugins.enabled` はグローバルな有効化ディレクティブです。移行によって書き込まれた明示的なプラグイン
エントリは、永続的にキュレーションされたインストールおよび修復の対象セットです。手動設定された
`workspace-directory` エントリは、すでにインストールおよび有効化され、その所有アプリに
アクセス可能である必要があります。OpenClaw はそれらをインストールまたは認証しません。Codex が明示的なワークスペース
カタログ要求を拒否した場合、有効なワークスペースエントリは
`marketplace_missing` でフェイルクローズしますが、デフォルトカタログのキュレーション済みエントリは引き続き
利用できます。`plugins["*"]` はサポートされず、`install` スイッチもありません。また、
ローカルの `marketplacePath` 値はホスト固有であるため、意図的に設定フィールドには含まれていません。
app-server のバージョンと準備要件については、
[ネイティブ Codex プラグイン](/ja-JP/plugins/codex-native-plugins)を参照してください。

`app/list` の準備状況チェックは 1 時間キャッシュされ、古くなると
非同期で更新されます。Codex スレッドのアプリ設定は、ターンごとではなく Codex ハーネスの
セッション確立時に算出されます。ネイティブプラグイン設定を変更した後は、`/new`、`/reset`、または Gateway の
再起動を使用してください。

`codexPlugins.allow_all_plugins` は、現在アクセス可能なすべてのアカウント
アプリを、新しいネイティブ Codex スレッドごとにスナップショットとして取り込みます。プラグインやアプリをインストールするものではなく、
アクセスできないアプリは除外されたままです。アカウントアプリには、グローバルな
`codexPlugins.allow_destructive_actions` ポリシーが適用されます。同じアプリが両方の経路に存在する場合は、
明示的なプラグインエントリが優先されます。`app/list` を読み取れない場合、
アカウント全体への公開はフェイルクローズします。

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl のウェブ取得プロバイダー設定。
  - `apiKey`: 上限を引き上げるためのオプションの Firecrawl API キー（SecretRef を指定可能）。`plugins.entries.firecrawl.config.webSearch.apiKey`、従来の `tools.web.fetch.firecrawl.apiKey`、または環境変数 `FIRECRAWL_API_KEY` にフォールバックします。
  - `baseUrl`: Firecrawl API のベース URL（デフォルト: `https://api.firecrawl.dev`。セルフホストのオーバーライドはプライベート／内部エンドポイントを指す必要があります）。
  - `onlyMainContent`: ページからメインコンテンツのみを抽出します（デフォルト: `true`）。
  - `maxAgeMs`: キャッシュの最大有効期間（ミリ秒）（デフォルト: `172800000` / 2 日）。
  - `timeoutSeconds`: スクレイプ要求のタイムアウト（秒）（デフォルト: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok ウェブ検索）の設定。
  - `enabled`: X Search プロバイダーを有効にします。
  - `model`: 検索に使用する Grok モデル（例: `"grok-4.3"`）。
- `plugins.entries.memory-core.config.dreaming`: メモリ Dreaming の設定。フェーズとしきい値については [Dreaming](/ja-JP/concepts/dreaming) を参照してください。
  - `enabled`: Dreaming のマスタースイッチ（デフォルト `false`）。
  - `frequency`: Dreaming の完全な各巡回を実行する Cron 間隔（デフォルトは `"0 3 * * *"`）。
  - `model`: オプションの Dream Diary サブエージェントモデルのオーバーライド。`plugins.entries.memory-core.subagent.allowModelOverride: true` が必要です。ターゲットを制限するには `allowedModels` と組み合わせてください。モデル利用不可エラーの場合は、セッションのデフォルトモデルで 1 回再試行します。信頼または許可リストの失敗では、暗黙的にフォールバックしません。
  - フェーズポリシーとしきい値は実装詳細です（ユーザー向けの設定キーではありません）。
- 完全なメモリ設定については、[メモリ設定リファレンス](/ja-JP/reference/memory-config)を参照してください。
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効な Claude バンドルプラグインは、`settings.json` から埋め込みの OpenClaw デフォルト値を提供することもできます。OpenClaw は、それらを未加工の OpenClaw 設定パッチではなく、サニタイズ済みのエージェント設定として適用します。
- `plugins.slots.memory`: アクティブなメモリプラグイン ID を選択します。メモリプラグインを無効にするには `"none"` を指定します。
- `plugins.slots.contextEngine`: アクティブなコンテキストエンジンプラグイン ID を選択します。別のエンジンをインストールして選択しない限り、デフォルトは `"legacy"` です。

[プラグイン](/ja-JP/tools/plugin)を参照してください。

---

## コミットメント

`commitments` は、推論されたフォローアップメモリを制御します。OpenClaw は会話ターンから確認予定を検出し、Heartbeat の実行を通じて配信できます。

- `commitments.enabled`: 推論されたフォローアップコミットメントについて、非表示の LLM 抽出、保存、Heartbeat 配信を有効にします。デフォルト: `false`。
- `commitments.maxPerDay`: エージェントセッションごとに、連続する 1 日の期間内で配信される推論済みフォローアップコミットメントの最大数。デフォルト: `3`。

[推論されたコミットメント](/ja-JP/concepts/commitments)を参照してください。

---

## ブラウザー

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 信頼されたプライベートネットワークアクセスに限り明示的に有効化
      // allowPrivateNetwork: true, // 従来のエイリアス
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` は `act:evaluate` と `wait --fn` を無効にします。
- `tabCleanup` は、アイドル時間の経過後、またはセッションが上限を超えたときに、追跡対象のプライマリエージェントのタブを回収します。個々のクリーンアップモードを無効にするには、`idleMinutes: 0` または `maxTabsPerSession: 0` を設定します。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定の場合に無効となるため、ブラウザナビゲーションはデフォルトで厳格に保たれます。
- プライベートネットワークでのブラウザナビゲーションを意図的に信頼する場合にのみ、`ssrfPolicy.dangerouslyAllowPrivateNetwork: true` を設定してください。
- 厳格モードでは、リモート CDP プロファイルのエンドポイント（`profiles.*.cdpUrl`）にも、到達可能性チェックおよび検出チェック中に同じプライベートネットワークのブロックが適用されます。
- `ssrfPolicy.allowPrivateNetwork` は、レガシーエイリアスとして引き続きサポートされます。
- 厳格モードでは、明示的な例外として `ssrfPolicy.hostnameAllowlist` と `ssrfPolicy.allowedHostnames` を使用します。
- リモートプロファイルはアタッチ専用です（開始、停止、リセットは無効）。
- `profiles.*.cdpUrl` は `http://`、`https://`、`ws://`、`wss://` を受け付けます。
  OpenClaw に `/json/version` を検出させる場合は HTTP(S) を使用し、プロバイダーから DevTools WebSocket の直接 URL が提供される場合は WS(S) を使用します。
- `remoteCdpTimeoutMs` と `remoteCdpHandshakeTimeoutMs` は、リモートおよび
  `attachOnly` の CDP 到達可能性とタブを開くリクエストに適用されます。管理対象の loopback
  プロファイルではローカル CDP のデフォルト値が維持されます。永続的なリモート Playwright タブの
  列挙では、より大きい値が操作の期限として使用されます。
- 外部管理の CDP サービスに loopback 経由で到達できる場合は、その
  プロファイルの `attachOnly: true` を設定します。設定しない場合、OpenClaw は loopback ポートを
  ローカル管理のブラウザプロファイルとして扱い、ローカルポートの所有権エラーを報告することがあります。
- `existing-session` プロファイルは CDP の代わりに Chrome MCP を使用し、
  選択したホストまたは接続済みのブラウザ Node 経由でアタッチできます。
- `existing-session` プロファイルでは `userDataDir` を設定して、Brave や Edge などの
  特定の Chromium ベースのブラウザプロファイルを対象にできます。
- Chrome が DevTools HTTP(S) 検出エンドポイントまたは直接 WS(S) エンドポイントの背後ですでに実行されている場合、
  `existing-session` プロファイルに `cdpUrl` を設定できます。この
  モードでは、OpenClaw は自動接続を使用せず、エンドポイントを Chrome MCP に渡します。
  Chrome MCP の起動引数では `userDataDir` は無視されます。
- `existing-session` プロファイルでは、現在の Chrome MCP ルートの制限が維持されます。
  CSS セレクターによる対象指定の代わりにスナップショット/ref ベースのアクション、単一ファイルのアップロード
  フック、ダイアログのタイムアウト上書き不可、`wait --load networkidle` 不可、および
  `responsebody`、PDF エクスポート、ダウンロードのインターセプト、バッチアクションは使用できません。
- ローカル管理の `openclaw` プロファイルでは `cdpPort` と `cdpUrl` が自動的に割り当てられます。
  `cdpUrl` を明示的に設定するのは、リモート CDP プロファイルまたは existing-session エンドポイントへの
  アタッチの場合のみです。
- ローカル管理プロファイルでは `executablePath` を設定して、そのプロファイルのグローバルな
  `browser.executablePath` を上書きできます。これにより、あるプロファイルを
  Chrome で、別のプロファイルを Brave で実行できます。
- ローカル管理プロファイルでは、プロセス開始後の Chrome CDP HTTP
  検出に `browser.localLaunchTimeoutMs` を使用し、起動後の CDP WebSocket の準備完了確認に
  `browser.localCdpReadyTimeoutMs` を使用します。Chrome は正常に
  起動するものの、準備完了チェックが起動処理と競合する低速なホストでは、これらの値を増やしてください。どちらの値も
  `120000` ms 以下の正の整数である必要があります。無効な設定値は拒否されます。
- 自動検出順序: Chromium ベースの場合はデフォルトブラウザ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` と `browser.profiles.<name>.executablePath` はどちらも、
  Chromium の起動前に、OS のホームディレクトリを表す `~` と `~/...` を
  受け付けます。`existing-session` プロファイルごとの `userDataDir` でもチルダが展開されます。
- 制御サービス: loopback のみ（ポートは `gateway.port` から導出、デフォルトは `18791`）。
- `extraArgs` は、ローカル Chromium の起動時に追加の起動フラグ（たとえば
  `--disable-gpu`、ウィンドウサイズ指定、デバッグフラグ）を追加します。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // 絵文字、短いテキスト、画像 URL、またはデータ URI
    },
  },
}
```

- `seamColor`: ネイティブアプリの UI クロームに使用するアクセントカラー（トークモードのバブルの色合いなど）。
- `assistant`: Control UI のアイデンティティの上書き。アクティブなエージェントのアイデンティティにフォールバックします。

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // ローカル | リモート
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // なし | トークン | パスワード | 信頼済みプロキシ
      token: "your-token",
      // password: "your-password", // または OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // mode=trusted-proxy 用。/gateway/trusted-proxy-auth を参照
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // オフ | サーブ | ファネル
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // toolTitles: false, // ツール呼び出し用の AI 目的タイトルをオプトイン（ユーティリティモデルのトークンを消費）
      // embedSandbox: "scripts", // 厳格 | スクリプト | 信頼済み
      // allowExternalEmbedUrls: false, // 危険: 絶対外部 http(s) 埋め込み URL を許可
      // chatMessageMaxWidth: "min(1280px, 82%)", // 中央揃えされたチャットトランスクリプトの最大幅（任意）
      // allowedOrigins: ["https://control.example.com"], // loopback 以外の Control UI では必須
      // dangerouslyAllowHostHeaderOriginFallback: false, // 危険な Host ヘッダーのオリジンフォールバックモード
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    terminal: {
      enabled: false,
      // shell: "/bin/zsh",
    },
    remote: {
      url: "ws://127.0.0.1:18789",
      transport: "ssh", // ssh | 直接
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // 任意。デフォルトは false。
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // 任意。デフォルトでは未設定/無効。
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
        // SSH 検証済みの自動承認。デフォルト: 有効（true）。
        // SSH 検証のみを無効にするには false を設定します。これは上記の
        // autoApproveCidrs には影響しません。Node のペアリングを手動のみにするには、false を設定し、
        // かつ autoApproveCidrs を未設定にします。調整するにはオブジェクトを渡します: { user, identity,
        // timeoutMs, cidrs }。
        sshVerify: true,
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // 追加の /tools/invoke HTTP 拒否設定
      deny: ["browser"],
      // 所有者/管理者の呼び出し元について、デフォルトの HTTP 拒否リストからツールを削除
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway フィールドの詳細">

- `mode`: `local`（Gateway を実行）または `remote`（リモート Gateway に接続）。`local` でない場合、Gateway は起動を拒否します。
- `port`: WS + HTTP 用の単一多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（デフォルト）、`lan`（`0.0.0.0`）、`tailnet`（利用可能な場合は Tailscale IPv4、それ以外は loopback）、または `custom`（1 つの IPv4 アドレス）。解決された `tailnet` アドレス、および `127.0.0.1` または `0.0.0.0` 以外の `custom` アドレスでは、同一ホスト上のクライアント向けに同じポートの `127.0.0.1` が必要です。いずれかのリスナーがバインドできない場合、起動は失敗します。loopback 以外への公開範囲は、選択したインターフェースに引き続き限定されます。
- **レガシーなバインドエイリアス**: ホストエイリアス（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）ではなく、`gateway.bind` のバインドモード値（`auto`、`loopback`、`lan`、`tailnet`、`custom`）を使用してください。
- **Docker に関する注意**: デフォルトの `loopback` バインドは、コンテナ内の `127.0.0.1` でリッスンします。Docker ブリッジネットワーク（`-p 18789:18789`）ではトラフィックが `eth0` に到達するため、Gateway に接続できません。すべてのインターフェースでリッスンするには、`--network host` を使用するか、`bind: "lan"`（または `customBindHost: "0.0.0.0"` を指定した `bind: "custom"`）を設定してください。
- **認証**: デフォルトで必須です。loopback 以外へのバインドには Gateway 認証が必要です。実際には、共有トークン/パスワード、または `gateway.auth.mode: "trusted-proxy"` を指定した ID 対応リバースプロキシが必要です。オンボーディングウィザードはデフォルトでトークンを生成します。
- `gateway.auth.token` と `gateway.auth.password` の両方（SecretRef を含む）が設定されている場合は、`gateway.auth.mode` を `token` または `password` に明示的に設定してください。両方が設定され、モードが未設定の場合、起動およびサービスのインストール/修復フローは失敗します。
- `gateway.auth.mode: "none"`: 明示的な認証なしモード。信頼できるローカル loopback 構成でのみ使用してください。オンボーディングのプロンプトでは意図的に提供されません。
- `gateway.auth.mode: "trusted-proxy"`: ブラウザ/ユーザー認証を ID 対応リバースプロキシに委任し、`gateway.trustedProxies` からの ID ヘッダーを信頼します（[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照）。このモードはデフォルトで **loopback 以外**のプロキシ送信元を想定します。同一ホストの loopback リバースプロキシでは、`gateway.auth.trustedProxy.allowLoopback = true` を明示的に指定する必要があります。同一ホスト内の内部呼び出し元は、ローカル直接フォールバックとして `gateway.auth.password` を使用できます。`gateway.auth.token` は trusted-proxy モードとは引き続き相互排他的です。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve の ID ヘッダーで Control UI/WebSocket 認証を満たせます（`tailscale whois` で検証）。HTTP API エンドポイントは、その Tailscale ヘッダー認証を使用**しません**。代わりに、Gateway の通常の HTTP 認証モードに従います。このトークンなしフローでは、Gateway ホストが信頼されていることを前提とします。`tailscale.mode = "serve"` の場合、デフォルトは `true` です。
- `gateway.auth.rateLimit`: オプションの認証失敗リミッター。クライアント IP ごと、および認証スコープごとに適用されます（共有シークレットとデバイストークンは個別に追跡されます）。ブロックされた試行は `429` + `Retry-After` を返します。
  - 非同期の Tailscale Serve Control UI パスでは、同じ `{scope, clientIp}` に対する失敗した試行は、失敗の書き込み前に直列化されます。そのため、同じクライアントからの不正な同時試行は、両方が単なる不一致として競合通過するのではなく、2 番目のリクエストでリミッターに達する可能性があります。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。localhost トラフィックも意図的にレート制限する場合（テスト構成や厳格なプロキシデプロイなど）は、`false` に設定してください。
- ブラウザオリジンからの WS 認証試行は、常に loopback 除外を無効にした状態でスロットリングされます（ブラウザを利用した localhost への総当たり攻撃に対する多層防御）。
- loopback では、これらのブラウザオリジンのロックアウトは、正規化された `Origin`
  値ごとに分離されるため、ある localhost オリジンから繰り返し失敗しても、
  別のオリジンが自動的にロックアウトされることはありません。
- `tailscale.mode`: `serve`（tailnet のみ、loopback バインド）または `funnel`（公開、認証が必要）。
- `tailscale.serviceName`: Serve モード用のオプションの Tailscale Service 名。たとえば
  `svc:openclaw`。設定すると、OpenClaw はこれを `tailscale serve
--service` に渡すため、Control UI をデバイスのホスト名ではなく
  名前付き Service を通じて公開できます。値には Tailscale の `svc:<dns-label>`
  Service 名形式を使用する必要があります。起動時に、導出された Service URL が報告されます。
- `tailscale.preserveFunnel`: `true` かつ `tailscale.mode = "serve"` の場合、OpenClaw は
  起動時に Serve を再適用する前に `tailscale funnel status` を確認し、外部で構成された
  Funnel ルートがすでに Gateway ポートをカバーしている場合は再適用をスキップします。
  デフォルトは `false`。
- `controlUi.allowedOrigins`: Gateway WebSocket 接続用の明示的なブラウザオリジン許可リスト。公開された loopback 以外のブラウザオリジンでは必須です。loopback、RFC1918/link-local、`.local`、`.ts.net`、または Tailscale CGNAT ホストから読み込まれる、同一オリジンのプライベート LAN/Tailnet UI は、Host ヘッダーフォールバックを有効にしなくても許可されます。
- `controlUi.toolTitles`: Control UI チャットのツール呼び出しに対して、AI が生成する目的タイトルをオプトインで有効にします。デフォルト: `false`（バックグラウンドでモデルを呼び出さず、ツールのレンダリングは完全に決定論的なままです）。有効にすると、`chat.toolTitles` メソッドは標準のユーティリティモデルルーティング（エージェントの `utilityModel`〔他のすべてのユーティリティタスクと同様に、限定されたツール引数を選択したプロバイダーへ送信する可能性があるオペレーターの決定〕、またはセッションプロバイダーが宣言した小規模モデルのデフォルト〔OpenAI → `gpt-5.6-luna`、Anthropic → `claude-haiku-4-5`〕）を通じて複雑な呼び出しにラベルを付け、結果をエージェントごとの状態データベースにキャッシュするため、同じ表示で再度課金されることはありません。`utilityModel: \"\"` は、他のすべてのユーティリティタスクと同様にタイトルを無効にします。タイトルがプライマリモデルへフォールバックすることはありません。
- `controlUi.chatMessageMaxWidth`: 中央寄せされた Control UI チャットトランスクリプトのオプションの最大幅。`960px`、`82%`、`min(1280px, 82%)`、`calc(100% - 2rem)` など、制約された CSS 幅値を受け付けます。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host ヘッダーのオリジンポリシーに意図的に依存するデプロイ向けに、Host ヘッダーのオリジンフォールバックを有効にする危険なモード。
- `terminal.enabled`: 管理者スコープのオペレーターターミナルをオプトインで有効にします。デフォルト: `false`。ターミナルは選択されたエージェントワークスペース内でホスト PTY を起動し、Gateway プロセスの環境を継承します。`sandbox.mode: "all"` のエージェントでは拒否されます。信頼できるオペレーターデプロイでのみ有効にしてください。この設定を変更すると Gateway が再起動し、Control UI のコンテンツセキュリティポリシーが更新されます。
- `terminal.shell`: オプションのシェル実行ファイル。未設定の場合、OpenClaw は Unix では `$SHELL`、Windows では `%ComSpec%` を使用します。
- `terminal.detachedSessionTimeoutSeconds`: 接続切断（ページの再読み込み、ノート PC のスリープ）後にターミナルセッションが存続する時間。直近の出力を再生しながら `terminal.attach` で再接続可能な状態を維持します。デフォルト: `300`。接続が切断された瞬間にセッションを終了するには `0` を設定します。切断されたセッションでもコマンドは実行され続けるため、共有ホストや公開ホストではこの値を短くしてください。
- `remote.transport`: `ssh`（デフォルト）または `direct`（ws/wss）。`direct` の場合、公開ホストでは `remote.url` が `wss://` である必要があります。平文の `ws://` は、loopback、LAN、link-local、`.local`、`.ts.net`、および Tailscale CGNAT ホストでのみ許可されます。
- `remote.remotePort`: リモート SSH ホスト上の Gateway ポート。デフォルトは `18789`。ローカルトンネルポートがリモート Gateway ポートと異なる場合に使用してください。
- `remote.sshHostKeyPolicy`: macOS SSH トンネルのホストキーポリシー。`strict` がデフォルトで、すでに信頼されているキーが必要です。`openssh` は、管理対象エイリアスに対して有効な OpenSSH 構成を明示的にオプトインするものです。使用前に、一致するユーザーおよびシステムの SSH 設定を確認してください。macOS アプリと `configure-remote` は、明示的に再度オプトインしない限り、ターゲット変更時にこのポリシーを `strict` にリセットします。
- `gateway.remote.token` / `.password` はリモートクライアントの認証情報フィールドです。それ自体で Gateway 認証を構成するものではありません。
- `gateway.push.apns.relay.baseUrl`: リレー対応の iOS ビルドが登録情報を Gateway に公開した後に使用される、外部 APNs リレーのベース HTTPS URL。公開 App Store ビルドでは、ホストされた OpenClaw リレーを使用します。カスタムリレー URL は、リレー URL がそのリレーを指す、意図的に分離された iOS ビルド/デプロイパスと一致する必要があります。
- `gateway.push.apns.relay.timeoutMs`: Gateway からリレーへの送信タイムアウト（ミリ秒）。デフォルトは `10000`。
- リレー対応の登録は、特定の Gateway ID に委任されます。ペアリングされた iOS アプリは `gateway.identity.get` を取得し、その ID をリレー登録に含め、登録スコープの送信権限を Gateway に転送します。別の Gateway が、その保存済み登録を再利用することはできません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記のリレー構成に対する一時的な環境変数オーバーライド。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP リレー URL 用の開発専用エスケープハッチ。本番環境のリレー URL では HTTPS を維持してください。
- `gateway.handshakeTimeoutMs`: 認証前の Gateway WebSocket ハンドシェイクタイムアウト（ミリ秒）。デフォルト: `15000`。設定されている場合、`OPENCLAW_HANDSHAKE_TIMEOUT_MS` が優先されます。負荷が高いホストや低性能ホストで、起動時のウォームアップが安定する前にローカルクライアントが接続できる場合は、この値を増やしてください。
- `gateway.channelHealthCheckMinutes`: チャネルヘルスモニターの間隔（分）。ヘルスモニターによる再起動をグローバルに無効化するには `0` を設定します。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: 古いソケットと判定するしきい値（分）。この値は `gateway.channelHealthCheckMinutes` 以上にしてください。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: 直近 1 時間における、チャネル/アカウントごとのヘルスモニターによる最大再起動回数。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバルモニターを有効に保ったまま、チャネルごとにヘルスモニターによる再起動をオプトアウトします。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 複数アカウント対応チャネルのアカウントごとのオーバーライド。設定されている場合、チャネルレベルのオーバーライドより優先されます。
- ローカル Gateway の呼び出しパスで `gateway.remote.*` をフォールバックとして使用できるのは、`gateway.auth.*` が未設定の場合のみです。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef により明示的に設定され、解決できない場合、解決はフェイルクローズします（リモートフォールバックで隠蔽されません）。
- `trustedProxies`: TLS を終端するか、転送されたクライアントヘッダーを挿入するリバースプロキシの IP。管理下にあるプロキシのみを列挙してください。loopback のエントリは、同一ホストのプロキシ/ローカル検出構成（Tailscale Serve やローカルリバースプロキシなど）でも引き続き有効ですが、loopback リクエストを `gateway.auth.mode: "trusted-proxy"` の対象にするものでは**ありません**。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` がないときに Gateway は `X-Real-IP` を受け入れます。フェイルクローズ動作のため、デフォルトは `false` です。
- `gateway.nodes.pairing.autoApproveCidrs`: 要求スコープがない初回 Node デバイスのペアリングを自動承認するための、オプションの CIDR/IP 許可リスト。未設定の場合は無効です。オペレーター/ブラウザ/Control UI/WebChat のペアリングは自動承認されず、ロール、スコープ、メタデータ、または公開キーのアップグレードも自動承認されません。
- `gateway.nodes.pairing.sshVerify`: 初回 Node デバイスのペアリングに対する SSH 検証済み自動承認（デフォルト: 有効）。Gateway はペアリングホストへ SSH で接続し直し（BatchMode、厳格なホストキー）、`openclaw node identity` のデバイスキーが完全に一致する場合のみ承認します。適格性の最低条件は `autoApproveCidrs` と同じです。`cidrs` で上書きしない限り、プローブはプライベート/CGNAT 送信元アドレスに限定されます。無効化するには `false`、調整するには `{ user, identity, timeoutMs, cidrs }` を設定してください。[Node のペアリング](/ja-JP/gateway/pairing#ssh-verified-device-auto-approval-default)を参照してください。
  - `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: ペアリングおよびプラットフォームの許可リスト評価後に、宣言されたノードコマンドへ適用するグローバルな許可/拒否設定。`camera.snap`、`camera.clip`、`screen.record`、`sms.search`、`sms.send` などの危険なノードコマンドを明示的に有効化するには、`allowCommands` を使用します。`denyCommands` は、プラットフォームのデフォルト設定または明示的な許可により対象となるコマンドであっても除外します。Android の SMS 権限と Gateway のコマンド認可は独立しています。ノードが宣言済みコマンドリストを変更した後は、そのデバイスのペアリングを拒否してから再承認し、Gateway が更新されたコマンドスナップショットを保存するようにしてください。
  - `gateway.tools.deny`: HTTP `POST /tools/invoke` でブロックする追加のツール名（デフォルトの拒否リストを拡張）。
  - `gateway.tools.allow`: owner/admin 呼び出し元について、デフォルトの HTTP 拒否リストからツール名を削除します。これによって、ID を持つ `operator.write`
  呼び出し元が owner/admin アクセスへ昇格することはありません。許可リストに登録されていても、`cron`、`gateway`、`nodes` は引き続き
  owner 以外の呼び出し元からは利用できません。

</Accordion>

### OpenAI 互換エンドポイント

- 管理 HTTP RPC: `admin-http-rpc` Plugin としてデフォルトでは無効です。Plugin を有効にすると、`POST /api/v1/admin/rpc` が登録されます。[管理 HTTP RPC](/ja-JP/plugins/admin-http-rpc)を参照してください。
- Chat Completions: デフォルトでは無効です。`gateway.http.endpoints.chatCompletions.enabled: true` で有効にします。
- Responses API: `gateway.http.endpoints.responses.enabled`。
- Responses の URL 入力強化:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空の許可リストは未設定として扱われます。URL 取得を無効にするには、`gateway.http.endpoints.responses.files.allowUrl=false`
    または `gateway.http.endpoints.responses.images.allowUrl=false`、あるいはその両方を使用します。
- オプションのレスポンス強化ヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity`（管理下にある HTTPS オリジンにのみ設定してください。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts)を参照してください）

### 複数インスタンスの分離

一意のポートと状態ディレクトリを使用して、1 台のホスト上で複数の Gateway を実行します。

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利なフラグ: `--dev`（`~/.openclaw-dev` とポート `19001` を使用）、`--profile <name>`（`~/.openclaw-<name>` を使用）。

[複数の Gateway](/ja-JP/gateway/multiple-gateways)を参照してください。

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: Gateway リスナー（HTTPS/WSS）で TLS 終端を有効にします（デフォルト: `false`）。
- `autoGenerate`: 明示的なファイルが設定されていない場合に、ローカルの自己署名証明書と鍵のペアを自動生成します。ローカル環境または開発環境でのみ使用してください。
- `certPath`: TLS 証明書ファイルへのファイルシステムパス。
- `keyPath`: TLS 秘密鍵ファイルへのファイルシステムパス。アクセス権を制限してください。
- `caPath`: クライアント検証またはカスタム信頼チェーン用のオプションの CA バンドルパス。

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: 設定の編集を実行時に適用する方法を制御します。
  - `"off"`: 実行中の編集を無視します。変更には明示的な再起動が必要です。
  - `"restart"`: 設定変更時に常に Gateway プロセスを再起動します。
  - `"hot"`: 再起動せずにプロセス内で変更を適用します。
  - `"hybrid"`（デフォルト）: まずホットリロードを試行し、必要な場合は再起動にフォールバックします。
- `debounceMs`: 設定変更が適用されるまでのデバウンス時間（ms）（0 以上の整数、デフォルト: `300`）。
- `deferralTimeoutMs`: 再起動またはチャンネルのホットリロードを強制する前に、実行中の処理を待機するオプションの最大時間（ms）。省略するとデフォルトの上限付き待機時間（`300000`）を使用します。無期限に待機し、未完了状態が続いていることを定期的に警告ログへ記録するには `0` を設定します。

---

## クラウドワーカー環境

クラウドワーカーはオプトインです。`cloudWorkers` が存在しない場合、または `profiles` が空の場合、OpenClaw は新しいワーカーの作成を受け付けません。以前に作成された永続レコードは引き続き調整され、表示されたままです。既存の Gateway/Node プロジェクションは変更されません。

すべてのワーカープロバイダーは、信頼済みのプロビジョニング出力から SSH `hostKey` を、ホスト名やコメントを含まない正確な `algorithm base64` 形式で返す必要があります。ブートストラップはその鍵を分離された `known_hosts` ファイルに書き込み、`StrictHostKeyChecking=yes` を使用します。プロバイダーが鍵を省略した場合は、接続を開始する前に失敗します。初回使用時に信頼するフォールバックはありません。

トンネルのセットアップはプロビジョニングの一部ではなく、オンデマンドで行われます。開始すると、Gateway はワーカーのローカル Unix ソケットを、その local loopback WebSocket エンドポイントへリバースフォワードします。このソケットはランダムに割り当てられた所有者専用のリモートディレクトリ内に配置されます。local loopback TCP ポートとは異なり、マルチユーザーワーカー上の他のアカウントからアクセスできず、別の環境のポートと衝突することもありません。SSH キープアライブと上限付きの再接続バックオフは、トンネル所有者が現在の所有者である間のみ実行されます。トンネルを停止すると、SSH プロセスを閉じる前に再接続が遮断されます。

制御トラフィックとワークスペース転送には、別々の SSH 接続を使用します。どちらも同じ解決済みのアイデンティティと、分離され固定された `known_hosts` ファイルを再利用しますが、ワークスペース転送は長時間稼働するトンネルと SSH 接続の多重化を共有しないため、rsync が制御トラフィックをブロックすることはありません。

### Crabbox プロファイル

同梱の `crabbox` プロバイダーは、ローカルの Crabbox CLI を介して SSH 対応のリースをプロビジョニングします。内側の `settings.provider` は Crabbox バックエンドを選択します。これは外側の OpenClaw プロバイダー ID とは別です。

```json5
{
  cloudWorkers: {
    profiles: {
      production: {
        provider: "crabbox",
        install: "bundle", // デフォルト。リリース済みの Gateway バージョンにのみ "npm" を使用します。
        settings: {
          provider: "aws",
          class: "standard",
          ttl: "24h",
          idleTimeout: "60m",
          // オプションの絶対パス。デフォルト: sibling ../crabbox/bin/crabbox, then PATH.
          binary: "/usr/local/bin/crabbox",
        },
        lifetime: {
          idleTimeoutMinutes: 60,
          maxLifetimeMinutes: 1440,
        },
      },
    },
  },
}
```

- `settings.provider`（必須）: `--provider` に渡される Crabbox バックエンド。inspect 出力に SSH エンドポイントが含まれるバックエンドを使用してください。`aws` は直接 AWS バックエンドを選択します。
- `settings.class`（必須）: `--class` に渡される Crabbox マシンクラス。
- `settings.ttl` と `settings.idleTimeout`（必須）: `--ttl` と `--idle-timeout` に渡される、正の Go duration 文字列。これらのプロバイダー側のフェイルセーフは、後述する OpenClaw の保存済み `lifetime` ポリシーとは別です。
- `settings.binary`: オプションの Crabbox 実行ファイルの絶対パス。指定しない場合、OpenClaw は同階層の Crabbox チェックアウトを確認し、次に `PATH` 上の実行可能なエントリを確認し、最後に `crabbox` を呼び出します。これにより、CLI がない場合も明示的なプロバイダーエラーとして表示されます。

未知の設定は拒否されます。Crabbox の認証情報とバックエンド固有のアカウント設定は、引き続き Crabbox が所有します。これらを `settings` に配置しないでください。OpenClaw はローカル CLI のみを呼び出し、この Plugin からプロバイダーへのネットワーク呼び出しは行いません。プロビジョニングでは常に `--keep=true` が渡されます。OpenClaw が外部ライフサイクルを所有し、`crabbox stop` でリースを破棄します。

<Warning>
  OpenClaw は、Crabbox のリースローカルな `sshKey` パスを、プロバイダー所有のシークレットリゾルバーを介して解決します。現在の `crabbox inspect --json` 出力は、プロビジョニングされた `sshHostKey` を公開しないため、Crabbox バックエンドのワーカーはブートストラップまたはトンネルのセットアップ前に引き続きフェイルクローズします。Crabbox は、リースごとの信頼できるホスト鍵をプロビジョニングし、ホスト名やコメントを含まない正確な `algorithm base64` 形式で `sshHostKey` を返す必要があります。現在のリースローカルな `known_hosts` キャッシュは、プロビジョニングの信頼マテリアルではありません。
</Warning>

### 静的 SSH 開発プロファイル

```json5
{
  cloudWorkers: {
    profiles: {
      development: {
        provider: "static-ssh",
        settings: {
          host: "worker.example.test",
          port: 22,
          user: "openclaw",
          hostKey: "ssh-ed25519 <base64-public-host-key>",
          keyRef: {
            source: "env",
            provider: "default",
            id: "OPENCLAW_WORKER_SSH_KEY",
          },
        },
        lifetime: {
          idleTimeoutMinutes: 60,
          maxLifetimeMinutes: 1440,
        },
      },
    },
  },
}
```

- `profiles`: 空ではなく、前後の空白を除去した ID を持つ、名前付きワーカープロファイル。各プロファイルは、Plugin によって登録されたプロバイダーを選択します。
- `provider`: 空ではないワーカープロバイダー ID。例では、同梱の `crabbox` プロバイダーと QA Lab の `static-ssh` プロバイダーを使用しています。
- `install`: ワーカーのインストール方法。`"bundle"`（デフォルト）は、Gateway にインストール済みのビルドをコンテンツハッシュ付きバンドルとして転送し、リリース済み、開発中、未リリースのバージョンをサポートします。`"npm"` は、変更されていないパッケージ版リリース向けのオプトイン最適化です。公開 npm レジストリから `openclaw@<exact gateway version>` をインストールし、`latest` は決してインストールしません。
- 同梱のプロバイダー Plugin は、設定されると自動的に選択されますが、明示的な無効化と `plugins.allow` は引き続き適用されます。許可リストが設定されている場合は、プロバイダー ID（例: `crabbox`）を含めてください。外部プロバイダー Plugin は、インストールして明示的に有効にする必要もあります。
- `settings`: プロバイダー所有の、サイズが制限された JSON。選択された Plugin がキーを定義して検証します。シークレットを含む値には、[SecretRef オブジェクト](/ja-JP/gateway/secrets)を使用してください。静的 SSH プロバイダーでは、`host`、`user`、`hostKey`、`keyRef` が必須です。`port` のデフォルトは `22` です。`hostKey` は、既知のホストまたは別の信頼済みチャネルから取得した、オプションのプレフィックスを含まない OpenSSH 公開ホスト鍵の 1 行（`algorithm base64`）である必要があります。
- `lifetime.idleTimeoutMinutes`: 後のアイドル再利用ポリシー用に保存される、分単位の正の整数。
- `lifetime.maxLifetimeMinutes`: 後のライフサイクルポリシー用に保存される、分単位の正の整数。

サポート対象の Node ランタイム（22.19+、23.11+、または 24+）が、ワーカーに事前にインストールされている必要があります。オプトインの `"npm"` 方式では、`npm` と公開 npm レジストリへの送信 HTTPS アクセスも必要です。ネットワークを使用するツールチェーンのセットアップはプロバイダーポリシーです。ブートストラップはツールチェーン自体をインストールする代わりに、対処可能なエラーを報告します。

この基盤は Gateway ビルドをインストールして検証し、トンネルの開始/停止ライフサイクルを提供しますが、汎用 OpenClaw CLI は起動しません。自己完結型のワーカーエントリとループは、次のクラウドワーカーのマイルストーンで導入されます。

各永続環境レコードは、検証済みのプロバイダー設定、解決済みのインストール方法、ライフタイムポリシーを、作成時のプロファイルスナップショットに保持します。名前付きプロファイルの変更または削除は新規作成に影響します。既存レコードは、所有する Plugin が引き続き利用可能である限り、そのスナップショットを使用してライフサイクル調整を継続します。

最初のクラウドワーカーリリースでは、ライフタイム値はデータとしてのみ扱われます。自動適用は、後続のライフサイクル作業で導入されます。プロファイルの変更には Gateway の再起動が必要です。

<Warning>
  `static-ssh` プロバイダーは、ソースツリーの QA Lab 開発ハーネスであり、パッケージ化された配布物には含まれません。共有ホスト上で実行されるワーカーは、ホスト上の無関係なデータを読み取れるため、このプロバイダーを本番環境の分離境界として使用しないでください。
  オペレーターは期待される `hostKey` を指定する必要があります。OpenClaw は最初の接続から鍵を学習したり、受け入れたりしません。
  リースを破棄しても、OpenClaw の論理レコードが解放されるだけです。ホストの停止やクリーンアップは行われません。
</Warning>

---

## フック

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "送信元: {{messages[0].from}}\n件名: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

認証: `Authorization: Bearer <token>` または `x-openclaw-token: <token>`。
クエリ文字列のフックトークンは拒否されます。

検証と安全性に関する注意事項:

- `hooks.enabled=true` には、空でない `hooks.token` が必要です。
- `hooks.token` は、有効な Gateway 共有シークレット認証（`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`）とは異なるものにしてください。再利用を検出すると、起動時に致命的でないセキュリティ警告がログに記録されます。
- `openclaw security audit` は、フックと Gateway の認証情報の再利用を、監査時にのみ指定された Gateway パスワード認証（`--auth password --password <password>`）も含め、重大な検出事項として報告します。`openclaw doctor --fix` を実行して、永続化されている再利用済みの `hooks.token` をローテーションし、その後、外部のフック送信元を更新して新しいフックトークンを使用するようにしてください。
- `hooks.path` に `/` は指定できません。`/hooks` などの専用サブパスを使用してください。
- `hooks.allowRequestSessionKey=true` の場合は、`hooks.allowedSessionKeyPrefixes` を制限してください（例: `["hook:"]`）。
- マッピングまたはプリセットでテンプレート化された `sessionKey` を使用する場合は、`hooks.allowedSessionKeyPrefixes` と `hooks.allowRequestSessionKey=true` を設定してください。静的なマッピングキーには、この明示的な有効化は不要です。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエストペイロードの `sessionKey` は、`hooks.allowRequestSessionKey=true` の場合にのみ受け入れられます（デフォルト: `false`）。
- `POST /hooks/<name>` → `hooks.mappings` によって解決されます
  - テンプレートでレンダリングされたマッピングの `sessionKey` 値は、外部から指定されたものとして扱われ、同様に `hooks.allowRequestSessionKey=true` が必要です。

<Accordion title="マッピングの詳細">

- `match.path` は、`/hooks` より後のサブパスと一致します（例: `/hooks/gmail` → `gmail`）。
- `match.source` は、汎用パスのペイロードフィールドと一致します。
- `{{messages[0].subject}}` のようなテンプレートは、ペイロードから値を読み取ります。
- `transform` には、フックアクションを返す JS/TS モジュールを指定できます。
  - `transform.module` は相対パスである必要があり、`hooks.transformsDir` 内に限定されます（絶対パスおよびパストラバーサルは拒否されます）。
  - `hooks.transformsDir` は `~/.openclaw/hooks/transforms` 配下に置いてください。ワークスペースの Skills ディレクトリは拒否されます。`openclaw doctor` がこのパスを無効と報告した場合は、変換モジュールをフック変換ディレクトリへ移動するか、`hooks.transformsDir` を削除してください。
- `agentId` は特定のエージェントへルーティングします。不明な ID はデフォルトのエージェントへフォールバックします。
- `allowedAgentIds`: `agentId` が省略された場合のデフォルトエージェント経路を含め、有効なエージェントルーティングを制限します（`*` または省略 = すべて許可、`[]` = すべて拒否）。
- `defaultSessionKey`: 明示的な `sessionKey` がないフックのエージェント実行に使用する、オプションの固定セッションキーです。
- `allowRequestSessionKey`: `/hooks/agent` の呼び出し元およびテンプレート駆動のマッピングセッションキーによる `sessionKey` の設定を許可します（デフォルト: `false`）。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値（リクエスト + マッピング）に対する、オプションの許可プレフィックスリストです（例: `["hook:"]`）。マッピングまたはプリセットのいずれかでテンプレート化された `sessionKey` を使用する場合は必須になります。
- `deliver: true` は最終応答をチャンネルへ送信します。`channel` のデフォルトは `last` です。
- `model` は、このフック実行で使用する LLM を上書きします（モデルカタログが設定されている場合は、許可されたモデルである必要があります）。

</Accordion>

### Gmail 連携

- 組み込みの Gmail プリセットは `sessionKey: "hook:gmail:{{messages[0].id}}"` を使用します。
- このメッセージ単位のルーティングを維持する場合は、`hooks.allowRequestSessionKey: true` を設定し、`hooks.allowedSessionKeyPrefixes` を Gmail の名前空間に一致するよう制限してください（例: `["hook:", "hook:gmail:"]`）。
- `hooks.allowRequestSessionKey: false` が必要な場合は、テンプレート化されたデフォルトの代わりに静的な `sessionKey` でプリセットを上書きしてください。

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- 設定されている場合、Gateway は起動時に `gog gmail watch serve` を自動起動します。無効にするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。
- Gateway と並行して別の `gog gmail watch serve` を実行しないでください。

---

## Canvas Plugin ホスト

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // または OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- エージェントが編集可能な HTML/CSS/JS と A2UI を、Gateway ポート配下の HTTP で提供します。
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカル専用: `gateway.bind: "loopback"`（デフォルト）を維持してください。
- loopback 以外へのバインド: Canvas のルートには、他の Gateway HTTP サーフェスと同様に Gateway 認証（トークン/パスワード/trusted-proxy）が必要です。
- Node WebView は通常、認証ヘッダーを送信しません。Node がペアリングされ接続されると、Gateway は Canvas/A2UI へのアクセス用に Node スコープのケイパビリティ URL を通知します。
- ケイパビリティ URL は有効な Node WS セッションに紐付けられ、短時間で期限切れになります。IP ベースのフォールバックは使用されません。
- 提供する HTML にライブリロードクライアントを挿入します。
- 空の場合は、初期 `index.html` を自動作成します。
- `/__openclaw__/a2ui/` でも A2UI を提供します。
- 変更を反映するには Gateway の再起動が必要です。
- 大規模なディレクトリまたは `EMFILE` エラーが発生する場合は、ライブリロードを無効にしてください。

---

## 検出

### mDNS（Bonjour）

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal`（デフォルト）: TXT レコードから `cliPath` + `sshPort` を省略します。
- `full`: `cliPath` + `sshPort` を含めます。LAN マルチキャスト広告を行うには、引き続き同梱の `bonjour` Plugin が有効である必要があります。
- `off`: Plugin の有効状態を変更せずに、LAN マルチキャスト広告を抑制します。
- 同梱の `bonjour` Plugin は macOS ホストでは自動起動し、Linux、Windows、およびコンテナ化された Gateway デプロイメントでは明示的な有効化が必要です。
- システムのホスト名が有効な DNS ラベルである場合は、そのホスト名がデフォルトになり、それ以外の場合は `openclaw` にフォールバックします。`OPENCLAW_MDNS_HOSTNAME` で上書きできます。
- `OPENCLAW_DISABLE_BONJOUR=1` は `discovery.mdns.mode` を上書きし、mDNS 広告を完全に無効化します。

### 広域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 配下にユニキャスト DNS-SD ゾーンを書き込みます。ネットワークをまたぐ検出には、DNS サーバー（CoreDNS 推奨）と Tailscale スプリット DNS を組み合わせてください。

セットアップ: `openclaw dns setup --apply`。

---

## 環境

### `env`（インライン環境変数）

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- インライン環境変数は、プロセス環境にそのキーが存在しない場合にのみ適用されます。
- `.env` ファイル: CWD の `.env` + `~/.openclaw/.env`（どちらも既存の変数を上書きしません）。
- `shellEnv`: ログインシェルのプロファイルから、存在しない想定キーをインポートします。
- 完全な優先順位については、[環境](/ja-JP/help/environment)を参照してください。

### 環境変数の置換

任意の設定文字列内で `${VAR_NAME}` を使用して環境変数を参照できます。

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 一致するのは大文字の名前のみです: `[A-Z_][A-Z0-9_]*`。
- 存在しない、または空の変数があると、設定の読み込み時にエラーが発生します。
- リテラルの `${VAR}` には `$${VAR}` を使用してエスケープしてください。
- `$include` と併用できます。

---

## シークレット

シークレット参照は追加的な機能です。プレーンテキスト値も引き続き使用できます。

### `SecretRef`

次のいずれかのオブジェクト形式を使用します。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` のパターン: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` の id パターン: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` の id: 絶対 JSON ポインター（例: `"/providers/openai/apiKey"`）
- `source: "exec"` の id パターン: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`（AWS 形式の `secret#json_key` セレクターをサポート）
- `source: "exec"` の id には、スラッシュで区切られた `.` または `..` のパスセグメントを含めることはできません（例: `a/../b` は拒否されます）

### サポートされる認証情報サーフェス

- 正規マトリクス: [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)
- `secrets apply` は、サポートされる `openclaw.json` の認証情報パスを対象とします。
- `auth-profiles.json` の参照は、ランタイム解決および監査の対象範囲に含まれます。

### シークレットプロバイダーの設定

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // オプションの明示的な環境プロバイダー
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

注:

- `file` プロバイダーは `mode: "json"` と `mode: "singleValue"` をサポートします（singleValue モードでは `id` は `"value"` である必要があります）。
- Windows ACL の検証を利用できない場合、file および exec プロバイダーのパスはフェイルクローズします。検証できない信頼済みパスに限り、`allowInsecurePath: true` を設定してください。
- `exec` プロバイダーには絶対 `command` パスが必要で、標準入力/標準出力でプロトコルペイロードを使用します。
- デフォルトでは、シンボリックリンクのコマンドパスは拒否されます。解決後の対象パスを検証しつつシンボリックリンクパスを許可するには、`allowSymlinkCommand: true` を設定してください。
- `trustedDirs` が設定されている場合、信頼済みディレクトリの検査は解決後の対象パスに適用されます。
- `exec` の子プロセス環境はデフォルトで最小限です。必要な変数は `passEnv` で明示的に渡してください。
- シークレット参照はアクティベーション時にメモリ内スナップショットへ解決され、その後、リクエスト処理パスはスナップショットのみを読み取ります。
- アクティベーション中は、有効なサーフェスのフィルタリングが適用されます。有効なサーフェス上で未解決の参照があると起動または再読み込みに失敗し、無効なサーフェスは診断情報とともにスキップされます。

---

## 認証ストレージ

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- エージェントごとのプロファイルは `<agentDir>/auth-profiles.json` に保存されます。
- `auth-profiles.json` は、静的な認証情報モードについて値単位の参照（`api_key` では `keyRef`、`token` では `tokenRef`）をサポートします。
- `{ "provider": { "apiKey": "..." } }` のような従来のフラット形式の `auth-profiles.json` マップは、ランタイム形式ではありません。`openclaw doctor --fix` は、`.legacy-flat.*.bak` バックアップを作成したうえで、正規の `provider:default` API キープロファイルへ書き換えます。
- OAuth モードのプロファイル（`auth.profiles.<id>.mode = "oauth"`）は、SecretRef を利用した認証プロファイルの認証情報をサポートしません。
- 静的なランタイム認証情報は、メモリ内の解決済みスナップショットから取得されます。従来の静的な `auth.json` エントリは、検出されると消去されます。
- 従来の OAuth インポート元は `~/.openclaw/credentials/oauth.json` です。
- [OAuth](/ja-JP/concepts/oauth)を参照してください。
- シークレットのランタイム動作および `audit/configure/apply` ツール: [シークレット管理](/ja-JP/gateway/secrets)。

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: プロファイルが実際の請求/クレジット不足エラーによって失敗した場合の、時間単位の基本バックオフ（デフォルト: `5`）。明示的な請求関連テキストは、`401`/`403` レスポンスでもここに分類されることがありますが、プロバイダー固有のテキストマッチャーは、それを所有するプロバイダーのスコープ内に限定されます（例: OpenRouter の `Key limit exceeded`）。再試行可能な HTTP `402` の使用期間、または組織/ワークスペースの支出上限に関するメッセージは、代わりに `rate_limit` パスに分類されます。
- `billingBackoffHoursByProvider`: プロバイダーごとに請求バックオフ時間を上書きするオプション設定。
- `billingMaxHours`: 請求バックオフの指数関数的増加に対する時間単位の上限（デフォルト: `24`）。
- `authPermanentBackoffMinutes`: 確度の高い `auth_permanent` 失敗に対する、分単位の基本バックオフ（デフォルト: `10`）。
- `authPermanentMaxMinutes`: `auth_permanent` バックオフの増加に対する分単位の上限（デフォルト: `60`）。
- `failureWindowHours`: バックオフカウンターに使用する時間単位のローリングウィンドウ（デフォルト: `24`）。
- `overloadedProfileRotations`: オーバーロードエラーでモデルフォールバックに切り替える前に行う、同一プロバイダー内での認証プロファイルローテーションの最大回数（デフォルト: `1`）。`ModelNotReadyException` のようなプロバイダーのビジー状態を示す形式はここに分類されます。
- `overloadedBackoffMs`: オーバーロード状態のプロバイダー/プロファイルローテーションを再試行する前の固定遅延（デフォルト: `0`）。
- `rateLimitedProfileRotations`: レート制限エラーでモデルフォールバックに切り替える前に行う、同一プロバイダー内での認証プロファイルローテーションの最大回数（デフォルト: `1`）。このレート制限バケットには、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted` など、プロバイダー固有の形式のテキストが含まれます。

---

## 監査

```json5
{
  audit: {
    enabled: true,
    messages: "off", // off | direct | all
  },
}
```

Gateway は、エージェント実行およびツールアクションの**メタデータのみ**の監査イベントを共有状態データベースに記録します。メッセージのライフサイクルメタデータは、別途オプトインが必要です。台帳には、ID、タイミング、ツール名、正規化された結果が保存されますが、プロンプト、メッセージ本文、ツール引数、結果、生のエラーテキストは一切保存されません。メッセージ行には、プラットフォームのアカウント、会話、メッセージ、送信先の生の ID は保存されません。実行/ツールのセッションキーは相関のために引き続き利用でき、それ自体にプラットフォームのアカウント ID またはピア ID が含まれる場合があります。レコードは30日後に期限切れとなり、台帳の上限は100,000行です。[`openclaw audit`](/ja-JP/cli/audit) または [`audit.activity.list`](/ja-JP/gateway/protocol#audit-ledger-rpc) Gateway RPC を使用して照会できます。完全なデータモデル、プライバシーのセマンティクス、対象範囲の制限については、[監査履歴](/ja-JP/gateway/audit)を参照してください。

- `enabled`: 新しい監査イベントを記録します（デフォルト: `true`）。インシデント発生後にのみ有効化された監査証跡では、そのインシデントを説明できないため、台帳はデフォルトで有効です。`false` に設定すると、Gateway の再起動後に新しいイベントの挿入が停止します。既存のレコードは期限切れになるまで読み取り可能なままです。再度有効にすると、その時点から記録が再開されます。空白期間が後から補完されることはありません。
- `messages`: メッセージメタデータのスコープ（デフォルト: `"off"`）。`"direct"` は既知のダイレクト会話のみを記録します。`"all"` はグループ、チャンネル、不明な会話種別も記録します。どちらのモードでもコンテンツは保存されず、相関が可能な場合は、生の識別子がインストール環境ローカルのキー付き仮名に置き換えられます。これらは匿名化ではなく相関を支援するためのものです。状態データベースには導出キーが保存されますが、RPC および CLI のエクスポートには含まれません。

実行中の Gateway は起動時に `audit.enabled` と `audit.messages` を取り込みます。いずれかの設定を変更した後は再起動してください。現在のメッセージ対象範囲には、コアディスパッチに到達した受理済み受信メッセージと、共有の永続配信に到達した元の論理送信返信ペイロードごとの1つの終端行が含まれます。これらの共有境界を迂回する Plugin ローカルおよび直接送信パスは、まだ対象外です。上限付きのバックグラウンドライターはベストエフォートであり、損失のないコンプライアンスアーカイブではありません。

---

## ロギング

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- デフォルトのログファイル: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`。
- 固定パスを使用するには `logging.file` を設定します。
- `--verbose` の場合、`consoleLevel` は `debug` に引き上げられます。
- `maxFileBytes`: ローテーション前のアクティブなログファイルの最大サイズ（バイト単位、正の整数、デフォルト: `104857600` = 100 MB）。OpenClaw は、アクティブファイルと同じ場所に、番号付きアーカイブを最大5つ保持します。
- `redactSensitive` / `redactPatterns`: コンソール出力、ファイルログ、OTLP ログレコード、永続化されたセッショントランスクリプトテキストに対するベストエフォートのマスキング。`redactSensitive: "off"` は、この一般的なログ/トランスクリプトポリシーのみを無効にします。UI、ツール、診断の安全性を確保するサーフェスでは、出力前に引き続きシークレットが秘匿化されます。

---

## 診断

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: 計装出力のマスタートグル（デフォルト: `true`）。
- `flags`: 対象を限定したログ出力を有効にするフラグ文字列の配列（`"telegram.*"` や `"*"` などのワイルドカードをサポート）。
- `stuckSessionWarnMs`: 長時間実行されている処理セッションを `session.long_running`、`session.stalled`、または `session.stuck` として分類するための、進行がない期間のしきい値（ミリ秒単位、デフォルト: `120000`）。返信、ツール、ステータス、ブロック、ACP の進行によってタイマーはリセットされます。状態に変化がない間、繰り返される `session.stuck` 診断にはバックオフが適用されます。
- `stuckSessionAbortMs`: 回復のために、中断状態にある対象のアクティブな作業を中止して排出できるようになるまでの、進行がない期間のしきい値（ミリ秒単位）。未設定の場合、OpenClaw は少なくとも5分かつ `stuckSessionWarnMs` の3倍となる、より安全な延長組み込み実行ウィンドウを使用します。
- `memoryPressureSnapshot`: メモリ負荷が `critical` に達したときに、秘匿化済みの OOM 発生前安定性スナップショットを取得します（デフォルト: `false`）。通常のメモリ負荷イベントを維持しながら、安定性バンドルのファイルスキャン/書き込みを追加するには `true` に設定します。
- `otel.enabled`: OpenTelemetry エクスポートパイプラインを有効にします（デフォルト: `false`）。完全な設定、シグナルカタログ、プライバシーモデルについては、[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)を参照してください。
- `otel.endpoint`: OTel エクスポート用のコレクター URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: オプションのシグナル別 OTLP エンドポイント。設定すると、そのシグナルに対してのみ `otel.endpoint` を上書きします。
- `otel.protocol`: `"http/protobuf"`（デフォルト）または `"grpc"`。
- `otel.headers`: OTel エクスポートリクエストとともに送信する追加の HTTP/gRPC メタデータヘッダー。
- `otel.serviceName`: リソース属性に使用するサービス名。
- `otel.traces` / `otel.metrics` / `otel.logs`: トレース、メトリクス、またはログのエクスポートを有効にします。
- `otel.logsExporter`: ログのエクスポート先: `"otlp"`（デフォルト）、標準出力の各行に1つの JSON オブジェクトを出力する `"stdout"`、または `"both"`。
- `otel.sampleRate`: トレースのサンプリング率 `0`-`1`。
- `otel.flushIntervalMs`: 定期的にテレメトリをフラッシュする間隔（ミリ秒単位）。
- `otel.captureContent`: OTEL スパン属性に生のコンテンツを取り込むためのオプトイン設定。デフォルトでは無効です。ブール値 `true` を指定すると、システム以外のメッセージ/ツールコンテンツが取り込まれます。オブジェクト形式では、`inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt`、`toolDefinitions` を明示的に有効化できます。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: `{gen_ai.operation.name} {gen_ai.request.model}` 形式のスパン名、`CLIENT` スパン種別、従来の `gen_ai.system` の代わりとなる `gen_ai.provider.name` を含む、最新の試験的な GenAI 推論スパン形式を使用するための環境変数トグル。デフォルトでは、互換性のためにスパンで `openclaw.model.call` と `gen_ai.system` が維持されます。GenAI メトリクスでは、境界が設定されたセマンティック属性が使用されます。
- `OPENCLAW_OTEL_PRELOADED=1`: グローバル OpenTelemetry SDK がすでに登録されているホスト向けの環境変数トグル。その場合、OpenClaw は診断リスナーをアクティブに保ちながら、Plugin 所有の SDK の起動/シャットダウンをスキップします。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`、`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: 対応する設定キーが未設定の場合に使用される、シグナル別エンドポイントの環境変数。
- `cacheTrace.enabled`: 組み込み実行のキャッシュトレーススナップショットをログに記録します（デフォルト: `false`）。
- `cacheTrace.filePath`: キャッシュトレース JSONL の出力パス（デフォルト: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: キャッシュトレース出力に含める内容を制御します（すべてデフォルト: `true`）。

---

## 更新

```json5
{
  update: {
    channel: "stable", // stable | extended-stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: リリースチャンネル - `"stable"`、`"extended-stable"`、`"beta"`、または `"dev"`。Extended-stable はパッケージ専用です。フォアグラウンドコマンドがインストールを担当し、Gateway は読み取り専用の更新通知を出す場合があります。
- `checkOnStart`: Gateway の起動時に npm の更新を確認します（デフォルト: `true`）。保存された extended-stable の選択では、同じ読み取り専用の通知と24時間間隔の通知スケジュールが使用されます。
- `auto.enabled`: stable および beta のパッケージインストールに対するバックグラウンド自動更新を有効にします（デフォルト: `false`）。Extended-stable が自動的に適用されることはありません。
- `auto.stableDelayHours`: stable チャンネルを自動適用するまでの最小遅延時間（デフォルト: `6`、最大: `168`）。
- `auto.stableJitterHours`: stable チャンネルのロールアウトを分散する追加の時間枠（デフォルト: `12`、最大: `168`）。
- `auto.betaCheckIntervalHours`: beta チャンネルの確認を実行する時間間隔（デフォルト: `1`、最大: `24`）。Stable の遅延/ジッターおよび beta のポーリング設定は extended-stable には適用されません。

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    fallbacks: ["acpx-secondary"],
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: ACP 機能全体のゲート（デフォルト: `true`。ACP のディスパッチおよび生成機能を非表示にするには `false` に設定）。
- `dispatch.enabled`: ACP セッションのターンディスパッチ用の独立したゲート（デフォルト: `true`）。ACP コマンドを利用可能なまま実行をブロックするには `false` に設定します。
- `backend`: デフォルトの ACP ランタイムバックエンド ID（登録済みの ACP ランタイム Plugin と一致する必要があります）。
  先にバックエンド Plugin をインストールし、`plugins.allow` が設定されている場合はバックエンド Plugin ID（例: `acpx`）を含めてください。含めないと、ACP バックエンドは読み込まれません。
- `fallbacks`: プライマリバックエンドが出力を生成する前に、一時的と思われるエラー（利用不可、レート制限、クォータ枯渇、または過負荷）で早期に失敗した場合に試行する、フォールバック ACP バックエンド ID の順序付きリスト。各エントリは、登録済みの ACP ランタイム Plugin バックエンドと一致する必要があります。
- `defaultAgent`: 生成時に明示的なターゲットを指定しない場合のフォールバック ACP ターゲットエージェント ID。
- `allowedAgents`: ACP ランタイムセッションで許可されるエージェント ID の許可リスト。空の場合、追加の制限はありません。
- `maxConcurrentSessions`: 同時にアクティブにできる ACP セッションの最大数。
- `stream.coalesceIdleMs`: ストリーミングテキストをフラッシュするまでのアイドル時間（ミリ秒）。
- `stream.maxChunkChars`: ストリーミングされるブロック投影を分割する前の最大チャンクサイズ。
- `stream.repeatSuppression`: ターンごとに繰り返されるステータス行およびツール行を抑制します（デフォルト: `true`）。
- `stream.deliveryMode`: `"live"` は逐次ストリーミングし、`"final_only"` はターン終了イベントまでバッファリングします。
- `stream.hiddenBoundarySeparator`: 非表示のツールイベント後に続く表示テキストの前に挿入する区切り（デフォルト: `"paragraph"`）。
- `stream.maxOutputChars`: ACP ターンごとに投影されるアシスタント出力の最大文字数。
- `stream.maxSessionUpdateChars`: 投影される ACP ステータス行および更新行の最大文字数。
- `stream.tagVisibility`: ストリーミングイベントのタグ名から真偽値の表示設定上書きへのレコード。
- `runtime.ttlMinutes`: クリーンアップ対象となるまでの ACP セッションワーカーのアイドル TTL（分）。
- `runtime.installCommand`: ACP ランタイム環境のブートストラップ時に実行する任意のインストールコマンド。

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` はバナーのタグラインのスタイルを制御します。
  - `"random"`（デフォルト）：ユーモラスまたは季節に合わせたタグラインを順番に表示します。
  - `"default"`：固定された中立的なタグライン（`All your chats, one OpenClaw.`）を表示します。
  - `"off"`：タグラインのテキストを表示しません（バナーのタイトルとバージョンは引き続き表示されます）。
- タグラインだけでなくバナー全体を非表示にするには、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定します。

---

## ウィザード

CLI のガイド付きセットアップフロー（`onboard`、`configure`、`doctor`）によって書き込まれるメタデータ：

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## アイデンティティ

[エージェントのデフォルト](/ja-JP/gateway/config-agents#agent-defaults)にある`agents.list`のアイデンティティフィールドを参照してください。

---

## ブリッジ（レガシー、削除済み）

現在のビルドにはTCPブリッジが含まれなくなりました。NodeはGateway WebSocket経由で接続します。`bridge.*`キーは設定スキーマに含まれなくなりました（削除するまで検証は失敗します。`openclaw doctor --fix`で不明なキーを除去できます）。

<Accordion title="レガシーブリッジ設定（過去の参照用）">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 8, // デフォルト。Cronディスパッチ＋分離されたCronエージェントターンの実行
    webhook: "https://example.invalid/legacy", // 保存済みのnotify:trueジョブ向けの非推奨フォールバック
    webhookToken: "replace-with-dedicated-token", // 送信Webhook認証用の任意のBearerトークン
    sessionRetention: "24h", // 期間文字列またはfalse
    runLog: {
      maxBytes: "2mb", // デフォルトは2_000_000バイト
      keepLines: 2000, // デフォルトは2000
    },
  },
}
```

- `sessionRetention`: 完了した分離Cron実行セッションについて、SQLiteセッション行を削除するまで保持する期間。アーカイブされた削除済みCronトランスクリプトのクリーンアップも制御します。デフォルト: `24h`。無効にするには`false`を設定します。
- `runLog.maxBytes`: 以前のファイルベースのCron実行ログとの互換性のために受け付けられます。デフォルト: `2_000_000`バイト。
- `runLog.keepLines`: ジョブごとに保持される最新のSQLite実行履歴行。デフォルト: `2000`。
- `webhookToken`: Cron WebhookのPOST配信（`delivery.mode = "webhook"`）に使用するBearerトークン。省略した場合、認証ヘッダーは送信されません。
- `webhook`: `openclaw doctor --fix`が、まだ`notify: true`を持つ保存済みジョブを移行するために使用する、非推奨のレガシーフォールバックWebhook URL（http/https）。ランタイム配信では、ジョブごとの`delivery.mode="webhook"`と`delivery.to`を使用します。announce配信を維持する場合は`delivery.completionDestination`を使用します。

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: 一時的なエラーが発生した Cron ジョブの最大再試行回数（デフォルト: `3`、範囲: `0`〜`10`）。
- `backoffMs`: 各再試行のバックオフ遅延（ミリ秒）の配列（デフォルト: `[30000, 60000, 300000]`、1〜10 エントリ）。
- `retryOn`: 再試行をトリガーするエラー種別 - `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。すべての一時的なエラー種別を再試行するには省略します。

単発ジョブは再試行回数を使い切るまで有効なままとなり、その後、最終的なエラー状態を保持したまま無効になります。定期実行ジョブは、同じ一時的エラーの再試行ポリシーを使用して、次のスケジュール枠より前にバックオフ後の再実行を行います。永続的なエラーまたは一時的エラーの再試行回数を使い切った場合は、エラーバックオフ付きの通常の定期実行スケジュールに戻ります。

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: Cron ジョブの失敗アラートを有効にします（デフォルト: `false`）。
- `after`: アラートが発生するまでの連続失敗回数（正の整数、最小値: `1`）。
- `cooldownMs`: 同じジョブについてアラートを繰り返す際の最小間隔（ミリ秒、非負整数）。
- `includeSkipped`: 連続してスキップされた実行をアラートしきい値に加算します（デフォルト: `false`）。スキップされた実行は別に追跡され、実行エラーのバックオフには影響しません。
- `mode`: 配信モード - `"announce"` はチャンネルメッセージで送信し、`"webhook"` は設定済みの Webhook に送信します。
- `accountId`: アラート配信の対象範囲を限定する、任意のアカウント ID またはチャンネル ID。

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- すべてのジョブに適用される Cron 失敗通知のデフォルト送信先。
- `mode`: `"announce"` または `"webhook"`。十分な送信先データがある場合、デフォルトは `"announce"` です。
- `channel`: announce 配信のチャンネル上書き。`"last"` は最後に確認された配信チャンネルを再利用します。
- `to`: 明示的な announce 送信先または Webhook URL。Webhook モードでは必須です。
- `accountId`: 配信用の任意のアカウント上書き。
- ジョブ単位の `delivery.failureDestination` は、このグローバルデフォルトを上書きします。
- グローバルにもジョブ単位にも失敗時の送信先が設定されていない場合、すでに `announce` で配信しているジョブは、失敗時にその主要な announce 送信先へフォールバックします。
- `delivery.failureDestination` は、ジョブの主要な `delivery.mode` が `"webhook"` の場合を除き、`sessionTarget="isolated"` のジョブでのみサポートされます。

[Cron ジョブ](/ja-JP/automation/cron-jobs)を参照してください。分離された Cron 実行は[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

---

## メディアモデルのテンプレート変数

`tools.media.models[].args` 内で展開されるテンプレートプレースホルダー:

| 変数               | 説明                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 受信メッセージ本文全体                            |
| `{{RawBody}}`      | 未加工の本文（履歴や送信者のラッパーなし）        |
| `{{BodyStripped}}` | グループメンションを除去した本文                  |
| `{{From}}`         | 送信者識別子                                      |
| `{{To}}`           | 送信先識別子                                      |
| `{{MessageSid}}`   | チャンネルメッセージ ID                           |
| `{{SessionId}}`    | 現在のセッション UUID                             |
| `{{IsNewSession}}` | 新しいセッションが作成された場合は `"true"`      |
| `{{MediaUrl}}`     | 受信メディアの疑似 URL                            |
| `{{MediaPath}}`    | ローカルメディアパス                              |
| `{{MediaType}}`    | メディア種別（画像/音声/ドキュメント/…）          |
| `{{Transcript}}`   | 音声の文字起こし                                  |
| `{{Prompt}}`       | CLI エントリ用に解決されたメディアプロンプト      |
| `{{MaxChars}}`     | CLI エントリ用に解決された最大出力文字数          |
| `{{ChatType}}`     | `"direct"` または `"group"`                       |
| `{{GroupSubject}}` | グループの件名（ベストエフォート）                |
| `{{GroupMembers}}` | グループメンバーのプレビュー（ベストエフォート）  |
| `{{SenderName}}`   | 送信者の表示名（ベストエフォート）                |
| `{{SenderE164}}`   | 送信者の電話番号（ベストエフォート）              |
| `{{Provider}}`     | プロバイダーのヒント（whatsapp、telegram、discord など） |

---

## 設定のインクルード（`$include`）

設定を複数のファイルに分割します:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**マージ動作:**

- 単一ファイル: それを含むオブジェクトを置き換えます。
- ファイルの配列: 順番にディープマージします（後のファイルが前のファイルを上書きします）。
- 兄弟キー: インクルード後にマージされます（インクルードされた値を上書きします）。
- ネストされたインクルード: 最大 10 階層まで。
- パス: インクルード元ファイルを基準に解決されますが、最上位の設定ディレクトリ（`openclaw.json` の `dirname`）内に収まる必要があります。絶対パスや `../` 形式は、解決後もその境界内に収まる場合にのみ許可されます。設定ディレクトリ外の追加ルートを許可するには、`OPENCLAW_INCLUDE_ROOTS`（絶対パス）を設定します。
- 制限: パスに null バイトを含めることはできず、解決前後の長さは厳密に 4096 文字未満である必要があります。インクルードされる各ファイルの上限は 2 MB です。
- 単一ファイルのインクルードを使用する最上位セクションのみを変更する OpenClaw 所有の書き込みは、そのインクルード先ファイルに直接書き込まれます。たとえば、`plugins install` は `plugins: { $include: "./plugins.json5" }` を `plugins.json5` 内で更新し、`openclaw.json` は変更しません。
- ルートインクルード、インクルード配列、および兄弟による上書きを伴うインクルードは、OpenClaw 所有の書き込みに対して読み取り専用です。これらの書き込みは、設定をフラット化せずにフェイルクローズします。
- エラー: ファイルの欠落、解析エラー、循環インクルード、無効なパス形式、長さ超過について明確なメッセージを表示します。

---

## 関連項目

- [設定](/ja-JP/gateway/configuration)
- [設定例](/ja-JP/gateway/configuration-examples)
- [Doctor](/ja-JP/gateway/doctor)
