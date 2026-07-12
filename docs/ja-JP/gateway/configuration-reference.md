---
read_when:
    - フィールド単位の正確な設定セマンティクスまたはデフォルト値が必要な場合
    - チャンネル、モデル、Gateway、またはツールの設定ブロックを検証している場合
summary: OpenClaw コアのキー、デフォルト、および各サブシステム専用リファレンスへのリンクをまとめた Gateway 設定リファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-07-12T21:29:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f0388cacfc5eb2b33f7a55775e4c7d289e0955409fc9b1e3f84199371fe4d1c4
    source_path: gateway/configuration-reference.md
    workflow: 16
---

`~/.openclaw/openclaw.json` のフィールド単位のリファレンス：キー、デフォルト値、各サブシステムの詳細ページへのリンクを掲載しています。タスク指向のセットアップガイダンスについては、[設定](/ja-JP/gateway/configuration)を参照してください。チャンネルおよびPluginが所有するコマンドカタログと、メモリ/QMDの詳細な調整項目は、ここではなくそれぞれのページに記載されています。

設定形式は **JSON5** です（コメントと末尾のカンマを使用できます）。すべてのフィールドは任意です。省略した場合、OpenClawは安全なデフォルト値を使用します。

コード上の事実がこのページより優先されます：

- `openclaw config schema` は、検証とControl UIに使用される最新のJSON Schemaを、バンドル済みPlugin、チャンネルのメタデータを統合した状態で出力します。
- エージェントは設定を編集する前に、`gateway` ツールのアクション `config.schema.lookup` を呼び出し、パスでスコープされた正確なスキーマノードを1つ取得する必要があります。
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、このドキュメントのベースラインハッシュを現在のスキーマサーフェスに照らして検証します。

詳細な専用リファレンス：

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および `plugins.entries.memory-core.config.dreaming` 配下のDreaming設定については、[メモリ設定リファレンス](/ja-JP/reference/memory-config)を参照してください。
- 現在の組み込みコマンドとバンドル済みコマンドのカタログについては、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。
- チャンネル固有のコマンドサーフェスについては、それを所有するチャンネルまたはPluginのページを参照してください。

---

## チャンネル

チャンネルごとの設定キーについては、[設定 - チャンネル](/ja-JP/gateway/config-channels)を参照してください。Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、およびその他の同梱チャンネルでは `channels.*` を使用します（認証、アクセス制御、複数アカウント、メンション制御）。

## エージェントのデフォルト、マルチエージェント、セッション、メッセージ

以下については、[設定 - エージェント](/ja-JP/gateway/config-agents)を参照してください。

- `agents.defaults.*`（ワークスペース、モデル、思考、Heartbeat、メモリ、メディア、Skills、サンドボックス）
- `multiAgent.*`（マルチエージェントのルーティングとバインディング）
- `session.*`（セッションのライフサイクル、Compaction、プルーニング）
- `messages.*`（メッセージ配信、TTS、Markdown レンダリング）
- `talk.*`（トークモード）
  - `talk.consultThinkingLevel`: Control UI Talk のリアルタイム相談の背後で実行される OpenClaw エージェント全体に対する thinking level のオーバーライド
  - `talk.consultFastMode`: Control UI Talk のリアルタイム相談用ワンショット高速モード上書き
  - `talk.speechLocale`: iOS/macOS での Talk 音声認識用の省略可能な BCP 47 ロケール ID
  - `talk.silenceTimeoutMs`: 未設定の場合、Talk は文字起こしを送信する前の一時停止時間としてプラットフォームのデフォルト値を維持します（`700 ms on macOS and Android, 900 ms on iOS`）
  - `talk.realtime.consultRouting`: `openclaw_agent_consult` をスキップする確定済みリアルタイム Talk 文字起こし向けの Gateway リレーフォールバック

## ツールとカスタムプロバイダー

ツールポリシー、実験的な切り替え設定、プロバイダーを利用するツールの設定、およびカスタム
プロバイダー / ベース URL の設定については、
[設定 - ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)を参照してください。

## モデル

プロバイダー定義、モデル許可リスト、カスタムプロバイダーの設定については、
[設定 - ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools#custom-providers-and-base-urls)を参照してください。
ルートの`models`は、グローバルなモデルカタログの動作も管理します。

```json5
{
  models: {
    // 任意。デフォルト: true。変更時はGatewayの再起動が必要です。
    pricing: { enabled: false },
  },
}
```

- `models.mode`: プロバイダーカタログの動作（`merge`または`replace`）。
- `models.providers`: プロバイダーIDをキーとするカスタムプロバイダーのマップ。
- `models.providers.*.localService`: ローカルモデルサーバー用の任意のオンデマンドプロセスマネージャー。OpenClawは設定されたヘルスエンドポイントをプローブし、必要に応じて絶対パスの`command`を起動して、準備完了を待ってからモデルリクエストを送信します。[ローカルモデルサービス](/ja-JP/gateway/local-model-services)を参照してください。
- `models.pricing.enabled`: サイドカーとチャンネルがGatewayの準備完了パスに到達した後に開始する、バックグラウンドの価格情報ブートストラップを制御します。`false`の場合、GatewayはOpenRouterおよびLiteLLMの価格カタログ取得をスキップします。設定された`models.providers.*.models[].cost`の値は、ローカルのコスト見積もりで引き続き機能します。

## MCP

OpenClawが管理するMCPサーバー定義は`mcp.servers`配下にあり、組み込みのOpenClawやその他のランタイムアダプターによって使用されます。`openclaw mcp list`、`show`、`set`、`unset`コマンドは、設定編集時に対象サーバーへ接続せずにこのブロックを管理します。

```json5
{
  mcp: {
    // 任意。デフォルト: 600000 ms（10分）。アイドル時の削除を無効にするには0を設定します。
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
        // 任意のCodex app-serverプロジェクション制御。
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: 設定済みのMCPツールを公開するランタイム向けの、名前付きstdioまたはリモートMCPサーバー定義。リモートエントリでは`transport: "streamable-http"`または`transport: "sse"`を使用します。`type: "http"`はCLIネイティブのエイリアスであり、`openclaw mcp set`および`openclaw doctor --fix`によって正規の`transport`フィールドへ正規化されます。
- `mcp.servers.<name>.enabled`: 保存済みのサーバー定義を維持しつつ、組み込みのOpenClaw MCP検出およびツールプロジェクションから除外するには`false`を設定します。
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: サーバーごとのMCPリクエストタイムアウト（秒またはミリ秒）。
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: サーバーごとの接続タイムアウト（秒またはミリ秒）。
- `mcp.servers.<name>.supportsParallelToolCalls`: MCPツール呼び出しを並列に実行するかどうかを選択できるアダプター向けの、任意の並行性ヒント。
- `mcp.servers.<name>.auth`: OAuthが必要なHTTP MCPサーバーには`"oauth"`を設定します。OpenClawの状態領域にトークンを保存するには、`openclaw mcp login <name>`を実行します。
- `mcp.servers.<name>.oauth`: 任意のOAuthスコープ、リダイレクトURL、およびクライアントメタデータURLの上書き。
- `mcp.servers.<name>.sslVerify`、`clientCert`、`clientKey`: プライベートエンドポイントおよび相互TLS向けのHTTP TLS制御。
- `mcp.servers.<name>.toolFilter`: サーバーごとの任意のツール選択。`include`は検出されたMCPツールを一致する名前に限定し、`exclude`は一致する名前を非表示にします。エントリには、MCPツールの完全な名前または単純な`*`グロブを指定します。リソースまたはプロンプトを持つサーバーでは、ユーティリティツール名（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`）も生成され、それらの名前にも同じフィルターが適用されます。
- `mcp.servers.<name>.codex`: 任意のCodex app-serverプロジェクション制御。このブロックはCodex app-serverスレッド専用のOpenClawメタデータであり、ACPセッション、汎用Codexハーネス設定、その他のランタイムアダプターには影響しません。空でない`codex.agents`を指定すると、サーバーは列挙されたOpenClawエージェントIDに限定されます。空、空白、または無効なスコープ付きエージェントリストは、グローバル扱いになるのではなく、設定検証で拒否され、ランタイムのプロジェクションパスから省略されます。`codex.defaultToolsApprovalMode`は、そのサーバー向けにCodexネイティブの`default_tools_approval_mode`を出力します。OpenClawはCodexへネイティブの`mcp_servers`設定を渡す前に`codex`ブロックを除去します。このブロックを省略すると、CodexのデフォルトのMCP承認動作を使用し、すべてのCodex app-serverエージェントにサーバーがプロジェクションされます。
- `mcp.sessionIdleTtlMs`: セッションスコープの同梱MCPランタイムに対するアイドルTTL。単発の組み込み実行は実行終了時のクリーンアップを要求します。このTTLは、長時間存続するセッションおよび将来の呼び出し元に対する最終的な保護策です。
- `mcp.*`配下の変更は、キャッシュ済みのセッションMCPランタイムを破棄することでホット適用されます。次回のツール検出または使用時に新しい設定から再作成されるため、削除された`mcp.servers`エントリはアイドルTTLを待たずに直ちに回収されます。
- ランタイム検出では、MCPツールリスト変更通知も尊重し、そのセッションのキャッシュ済みカタログを破棄します。リソースまたはプロンプトを公開するサーバーには、リソースの一覧表示と読み取り、およびプロンプトの一覧表示と取得を行うユーティリティツールが追加されます。ツール呼び出しが繰り返し失敗した場合、影響を受けたサーバーは、次の呼び出しを試行する前に短時間一時停止します。

ランタイムの動作については、[MCP](/ja-JP/cli/mcp#openclaw-as-an-mcp-client-registry)および
[CLIバックエンド](/ja-JP/gateway/cli-backends#bundle-mcp-overlays)を参照してください。

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // または平文文字列
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: 同梱Skills専用の任意の許可リスト（管理対象およびワークスペースのSkillsには影響しません）。
- `load.extraDirs`: 追加の共有Skillsルート（優先順位は最低）。
- `load.allowSymlinkTargets`: Skillsのシンボリックリンクが設定済みのソースルート外にある場合に、解決先として許可される信頼済みの実体ターゲットルート。
- `workshop.allowSymlinkTargetWrites`: Skill Workshopの適用処理が、すでに信頼されているシンボリックリンク先を通じて書き込むことを許可します（デフォルト: false）。
- `install.preferBrew`: trueの場合、`brew`が利用可能なら、他の種類のインストーラーへフォールバックする前にHomebrewインストーラーを優先します。
- `install.nodeManager`: `metadata.openclaw.install`仕様に対するNodeインストーラーの優先設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `install.allowUploadedArchives`: 信頼済みの`operator.admin` Gatewayクライアントが、`skills.upload.*`を通じてステージされたプライベートzipアーカイブをインストールできるようにします（デフォルト: false）。これはアップロード済みアーカイブの経路のみを有効にします。通常のClawHubインストールには必要ありません。
- `entries.<skillKey>.enabled: false`は、同梱またはインストール済みであってもSkillsを無効にします。
- `entries.<skillKey>.apiKey`: プライマリ環境変数を宣言するSkills向けの簡易設定（平文文字列またはSecretRefオブジェクト）。
- `limits.maxCandidatesPerRoot`、`limits.maxSkillsLoadedPerSource`、`limits.maxSkillsInPrompt`、`limits.maxSkillsPromptChars`、`limits.maxSkillFileBytes`: Skillsの検出およびモデル向けSkillsプロンプトの上限を設定します。
- Skill Workshopの自律性および承認設定（`workshop.autonomous.enabled`、`workshop.approvalPolicy`、`workshop.maxPending`、`workshop.maxSkillBytes`）については、[Skillsの設定](/ja-JP/tools/skills-config)を参照してください。

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
- スタンドアロンのプラグインファイルは `plugins.load.paths` に配置してください。自動検出される拡張機能ルートでは、トップレベルの `.js`、`.mjs`、`.ts` ファイルは無視されるため、それらのルートにあるヘルパースクリプトが起動を妨げることはありません。
- 検出では、ネイティブ OpenClaw プラグインに加え、互換性のある Codex バンドルと Claude バンドル（マニフェストのない Claude デフォルトレイアウトバンドルを含む）を受け入れます。
- **設定変更には Gateway の再起動が必要です。**
- `allow`: オプションの許可リストです（列挙されたプラグインのみ読み込まれます）。`deny` が優先されます。
- `plugins.entries.<id>.apiKey`: プラグインレベルの API キー用簡易フィールドです（プラグインが対応している場合）。
- `plugins.entries.<id>.env`: プラグインスコープの環境変数マップです。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、コアは `before_prompt_build` をブロックし、従来の `before_agent_start` にあるプロンプト変更フィールドを無視しますが、従来の `modelOverride` と `providerOverride` は維持します。ネイティブプラグインのフックおよび対応するバンドル提供のフックディレクトリに適用されます。
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` の場合、信頼された非バンドルプラグインは、`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end` などの型付きフックから未加工の会話内容を読み取れます。
- `plugins.entries.<id>.subagent.allowModelOverride`: このプラグインがバックグラウンドのサブエージェント実行ごとに `provider` と `model` のオーバーライドを要求することを明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼されたサブエージェントのオーバーライドで使用できる正規の `provider/model` ターゲットを指定するオプションの許可リストです。任意のモデルを意図的に許可する場合にのみ `"*"` を使用してください。
- `plugins.entries.<id>.llm.allowModelOverride`: このプラグインが `api.runtime.llm.complete` のモデルオーバーライドを要求することを明示的に信頼します。
- `plugins.entries.<id>.llm.allowedModels`: 信頼されたプラグインの LLM 補完オーバーライドで使用できる正規の `provider/model` ターゲットを指定するオプションの許可リストです。任意のモデルを意図的に許可する場合にのみ `"*"` を使用してください。
- `plugins.entries.<id>.llm.allowAgentIdOverride`: このプラグインがデフォルト以外のエージェント ID に対して `api.runtime.llm.complete` を実行することを明示的に信頼します。
- `plugins.entries.<id>.config`: プラグイン定義の設定オブジェクトです（利用可能な場合は、ネイティブ OpenClaw プラグインスキーマによって検証されます）。
- チャンネルプラグインのアカウントおよびランタイム設定は `channels.<id>` 配下に置かれ、中央の OpenClaw オプションレジストリではなく、所有プラグインのマニフェストにある `channelConfigs` メタデータで記述する必要があります。

### Codex ハーネスのプラグイン設定

同梱の `codex` プラグインは、`plugins.entries.codex.config` 配下のネイティブ Codex app-server ハーネス設定を所有します。設定項目全体については
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を、ランタイムモデルについては
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

- `plugins.entries.codex.config.codexPlugins.enabled`: Codex ハーネスのネイティブ Codex
  プラグイン／アプリ対応を有効にします。デフォルト: `false`。
- `plugins.entries.codex.config.codexPlugins.allow_all_plugins`: 認証済み Codex アカウントに接続され、現在アクセス可能なすべてのアプリを、
  新しい各ネイティブ Codex スレッドに公開します。デフォルト: `false`。
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  設定されたプラグインアプリの確認要求に対する、破壊的アクションのデフォルトポリシーです。
  `true` を使用すると安全な Codex 承認スキーマを確認なしで受け入れ、`false`
  を使用すると拒否し、`"auto"` を使用すると Codex が要求する承認を OpenClaw
  プラグイン承認経由で処理し、`"ask"` を使用すると永続的な承認なしで、プラグインによるすべての書き込み／破壊的
  アクションについて確認します。`"ask"` モードでは、対象アプリに対する Codex の永続的な
  ツール単位の承認オーバーライドを消去し、Codex スレッドの開始前に、そのアプリの人間による
  承認レビュアーを選択します。
  デフォルト: `true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: グローバルな `codexPlugins.enabled` も true の場合に、
  設定されたプラグインエントリを有効にします。
  デフォルト: 明示的なエントリでは `true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  安定したマーケットプレイス識別子です。解決されるすべてのエントリで `pluginName` とともに必須です。
  `"openai-curated"` と `"workspace-directory"` に対応します。いずれかの識別フィールドが
  欠けているエントリは無視されます。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: 安定した
  Codex プラグイン識別子です。`marketplaceName` とともに必須です。
  `workspace-directory` エントリでは、`plugin/list` が返すマーケットプレイス修飾付きの
  `summary.id` を正確に使用する必要があります。例:
  `"example-plugin@workspace-directory"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  プラグイン単位の破壊的アクションオーバーライドです。省略した場合は、グローバルな
  `allow_destructive_actions` 値が使用されます。プラグイン単位の値には、同じ
  `true`、`false`、`"auto"`、または `"ask"` ポリシーを指定できます。

`"ask"` を使用する許可済みの各プラグインアプリでは、そのアプリの承認要求が
人間のレビュアーに送られます。他のアプリおよびアプリ以外のスレッド承認では、
設定済みのレビュアーが維持されるため、複数のプラグインポリシーが混在していても `"ask"` の動作は継承されません。

`codexPlugins.enabled` はグローバルな有効化ディレクティブです。移行によって書き込まれた明示的なプラグイン
エントリは、永続的に精選されたインストールおよび修復対象セットです。手動設定された
`workspace-directory` エントリは、すでにインストールされ有効になっており、その所有アプリに
アクセスできる必要があります。OpenClaw はそれらのインストールや認証を行いません。Codex が明示的なワークスペース
カタログ要求を拒否した場合、有効なワークスペースエントリは
`marketplace_missing` でフェイルクローズしますが、デフォルトカタログの精選済みエントリは引き続き
利用できます。`plugins["*"]` はサポートされず、`install` スイッチもありません。また、
ローカルの `marketplacePath` 値はホスト固有であるため、意図的に設定フィールドとして提供されていません。
app-server のバージョンおよび準備要件については、
[ネイティブ Codex プラグイン](/ja-JP/plugins/codex-native-plugins)を参照してください。

`app/list` の準備確認は 1 時間キャッシュされ、古くなった場合は
非同期で更新されます。Codex スレッドのアプリ設定は、毎ターンではなく Codex ハーネスの
セッション確立時に計算されます。ネイティブプラグイン設定を変更した後は、`/new`、`/reset`、または Gateway の
再起動を使用してください。

`codexPlugins.allow_all_plugins` は、現在アクセス可能なすべてのアカウント
アプリのスナップショットを、新しい各ネイティブ Codex スレッドに取り込みます。プラグインやアプリをインストールするものではなく、
アクセスできないアプリは除外されたままです。アカウントアプリにはグローバルな
`codexPlugins.allow_destructive_actions` ポリシーが適用されます。同じアプリが両方の経路に存在する場合は、
明示的なプラグインエントリが優先されます。`app/list` を読み取れない場合、
アカウント全体への公開はフェイルクローズします。

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl Web 取得プロバイダーの設定です。
  - `apiKey`: 上限を引き上げるためのオプションの Firecrawl API キーです（SecretRef を受け入れます）。`plugins.entries.firecrawl.config.webSearch.apiKey`、従来の `tools.web.fetch.firecrawl.apiKey`、または `FIRECRAWL_API_KEY` 環境変数にフォールバックします。
  - `baseUrl`: Firecrawl API のベース URL です（デフォルト: `https://api.firecrawl.dev`。セルフホストのオーバーライドはプライベート／内部エンドポイントを対象にする必要があります）。
  - `onlyMainContent`: ページから主要コンテンツのみを抽出します（デフォルト: `true`）。
  - `maxAgeMs`: キャッシュの最大有効期間（ミリ秒）です（デフォルト: `172800000` / 2 日）。
  - `timeoutSeconds`: スクレイプ要求のタイムアウト（秒）です（デフォルト: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok Web 検索）の設定です。
  - `enabled`: X Search プロバイダーを有効にします。
  - `model`: 検索に使用する Grok モデルです（例: `"grok-4.3"`）。
- `plugins.entries.memory-core.config.dreaming`: メモリの Dreaming 設定です。フェーズとしきい値については [Dreaming](/ja-JP/concepts/dreaming) を参照してください。
  - `enabled`: Dreaming のマスタースイッチです（デフォルト `false`）。
  - `frequency`: Dreaming の完全な各スイープを実行する Cron 間隔です（デフォルトは `"0 3 * * *"`）。
  - `model`: オプションの Dream Diary サブエージェントモデルオーバーライドです。`plugins.entries.memory-core.subagent.allowModelOverride: true` が必要です。対象を制限するには `allowedModels` と組み合わせてください。モデルが利用できないエラーでは、セッションのデフォルトモデルを使用して 1 回再試行します。信頼または許可リストの失敗では、暗黙にフォールバックしません。
  - フェーズポリシーとしきい値は実装の詳細です（ユーザー向けの設定キーではありません）。
- メモリ設定全体については、[メモリ設定リファレンス](/ja-JP/reference/memory-config)を参照してください。
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効な Claude バンドルプラグインは、`settings.json` から埋め込み OpenClaw デフォルトを提供することもできます。OpenClaw はそれらを未加工の OpenClaw 設定パッチとしてではなく、サニタイズされたエージェント設定として適用します。
- `plugins.slots.memory`: アクティブなメモリプラグイン ID を選択します。メモリプラグインを無効にするには `"none"` を指定します。
- `plugins.slots.contextEngine`: アクティブなコンテキストエンジンプラグイン ID を選択します。別のエンジンをインストールして選択しない限り、デフォルトは `"legacy"` です。

[プラグイン](/ja-JP/tools/plugin)を参照してください。

---

## コミットメント

`commitments` は、推論されたフォローアップメモリを制御します。OpenClaw は会話ターンから確認事項を検出し、Heartbeat 実行を通じて配信できます。

- `commitments.enabled`: 推論されたフォローアップコミットメントに対する非表示の LLM 抽出、保存、および Heartbeat 配信を有効にします。デフォルト: `false`。
- `commitments.maxPerDay`: 1 日のローリング期間中に、エージェントセッションごとに配信される推論済みフォローアップコミットメントの最大数です。デフォルト: `3`。

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
      // dangerouslyAllowPrivateNetwork: true, // 信頼されたプライベートネットワークアクセスの場合にのみオプトイン
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定の場合は無効になるため、ブラウザナビゲーションはデフォルトで厳格に保たれます。
- プライベートネットワークへのブラウザナビゲーションを意図的に信頼する場合にのみ、`ssrfPolicy.dangerouslyAllowPrivateNetwork: true` を設定してください。
- 厳格モードでは、リモート CDP プロファイルのエンドポイント（`profiles.*.cdpUrl`）にも、到達可能性／検出チェック時に同じプライベートネットワークのブロックが適用されます。
- `ssrfPolicy.allowPrivateNetwork` は、レガシーエイリアスとして引き続きサポートされます。
- 厳格モードでは、明示的な例外に `ssrfPolicy.hostnameAllowlist` と `ssrfPolicy.allowedHostnames` を使用してください。
- リモートプロファイルはアタッチ専用です（開始／停止／リセットは無効）。
- `profiles.*.cdpUrl` は `http://`、`https://`、`ws://`、`wss://` を受け付けます。
  OpenClaw に `/json/version` を検出させる場合は HTTP(S) を使用し、プロバイダーから DevTools WebSocket の直接 URL が提供される場合は WS(S) を使用してください。
- `remoteCdpTimeoutMs` と `remoteCdpHandshakeTimeoutMs` は、リモートおよび `attachOnly` の CDP 到達可能性とタブを開くリクエストに適用されます。管理対象の loopback プロファイルでは、ローカル CDP のデフォルト値が維持されます。永続的なリモート Playwright タブの列挙では、大きい方の値が処理期限として使用されます。
- 外部管理の CDP サービスに loopback 経由で到達できる場合は、そのプロファイルに `attachOnly: true` を設定してください。設定しない場合、OpenClaw は loopback ポートをローカル管理対象ブラウザプロファイルとして扱い、ローカルポートの所有権エラーを報告することがあります。
- `existing-session` プロファイルは CDP の代わりに Chrome MCP を使用し、選択したホスト上、または接続済みのブラウザ Node 経由でアタッチできます。
- `existing-session` プロファイルでは `userDataDir` を設定して、Brave や Edge など、Chromium ベースの特定のブラウザプロファイルを対象にできます。
- Chrome が DevTools HTTP(S) 検出エンドポイントまたは直接 WS(S) エンドポイントの背後ですでに実行されている場合、`existing-session` プロファイルに `cdpUrl` を設定できます。このモードでは、OpenClaw は自動接続を使用せず、エンドポイントを Chrome MCP に渡します。Chrome MCP の起動引数では `userDataDir` は無視されます。
- `existing-session` プロファイルでは、現在の Chrome MCP ルートの制限が維持されます。つまり、CSS セレクターによる対象指定ではなくスナップショット／参照駆動のアクション、単一ファイルのアップロードフック、ダイアログのタイムアウト上書きなし、`wait --load networkidle` なし、さらに `responsebody`、PDF エクスポート、ダウンロードのインターセプト、バッチアクションもありません。
- ローカル管理対象の `openclaw` プロファイルでは、`cdpPort` と `cdpUrl` が自動的に割り当てられます。`cdpUrl` を明示的に設定するのは、リモート CDP プロファイルまたは existing-session エンドポイントへのアタッチの場合のみです。
- ローカル管理対象プロファイルでは `executablePath` を設定して、そのプロファイルでグローバルな `browser.executablePath` を上書きできます。これにより、あるプロファイルを Chrome で、別のプロファイルを Brave で実行できます。
- ローカル管理対象プロファイルでは、プロセス開始後の Chrome CDP HTTP 検出に `browser.localLaunchTimeoutMs` を使用し、起動後の CDP WebSocket 準備完了待ちに `browser.localCdpReadyTimeoutMs` を使用します。Chrome は正常に起動するものの、準備完了チェックが起動処理と競合する低速なホストでは、これらの値を引き上げてください。どちらの値も `120000` ms 以下の正の整数である必要があり、無効な設定値は拒否されます。
- 自動検出順序：Chromium ベースの場合はデフォルトブラウザ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` と `browser.profiles.<name>.executablePath` はどちらも、Chromium の起動前に OS のホームディレクトリを表す `~` と `~/...` を受け付けます。`existing-session` プロファイルのプロファイルごとの `userDataDir` でも、チルダが展開されます。
- 制御サービス：loopback のみ（ポートは `gateway.port` から算出、デフォルトは `18791`）。
- `extraArgs` は、ローカル Chromium の起動時に追加の起動フラグ（例：`--disable-gpu`、ウィンドウサイズ指定、デバッグフラグ）を付加します。

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

- `seamColor`：ネイティブアプリの UI クロームに使用するアクセントカラー（トークモードのバブルの色合いなど）。
- `assistant`：Control UI のアイデンティティの上書き。アクティブなエージェントのアイデンティティにフォールバックします。

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
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
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // toolTitles: false, // ツール呼び出し向けの AI による目的タイトルをオプトインで有効化（ユーティリティモデルのトークンを消費）
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // 危険：絶対パスの外部 http(s) 埋め込み URL を許可
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
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // 任意。デフォルトは false。
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // 任意。デフォルトは未設定／無効。
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
        // SSH で検証された自動承認。デフォルト：有効（true）。
        // SSH 検証のみを無効にするには false を設定します。これは上記の
        // autoApproveCidrs には影響しません。Node のペアリングを手動のみにするには、false を設定し、
        // かつ autoApproveCidrs を未設定にします。調整するにはオブジェクトを渡します：{ user, identity,
        // timeoutMs, cidrs }。
        sshVerify: true,
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // 追加の /tools/invoke HTTP 拒否項目
      deny: ["browser"],
      // 所有者／管理者の呼び出し元向けに、デフォルトの HTTP 拒否リストからツールを削除
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
- `bind`: `auto`、`loopback`（デフォルト）、`lan`（`0.0.0.0`）、`tailnet`（利用可能な場合は Tailscale IPv4、それ以外は loopback）、または `custom`（1 つの IPv4 アドレス）。解決された `tailnet` アドレス、および `127.0.0.1` または `0.0.0.0` 以外の `custom` アドレスでは、同一ホストのクライアント用に同じポート上の `127.0.0.1` が必要です。いずれかのリスナーがバインドできない場合、起動は失敗します。loopback 以外への公開範囲は、選択したインターフェースに限定されたままです。
- **レガシーなバインドエイリアス**: ホストエイリアス（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）ではなく、`gateway.bind` でバインドモード値（`auto`、`loopback`、`lan`、`tailnet`、`custom`）を使用してください。
- **Docker に関する注意**: デフォルトの `loopback` バインドは、コンテナ内の `127.0.0.1` で待ち受けます。Docker ブリッジネットワーク（`-p 18789:18789`）では、トラフィックが `eth0` に到着するため、Gateway に到達できません。すべてのインターフェースで待ち受けるには、`--network host` を使用するか、`bind: "lan"`（または `customBindHost: "0.0.0.0"` を指定した `bind: "custom"`）を設定してください。
- **認証**: デフォルトで必須です。loopback 以外のバインドには Gateway 認証が必要です。実際には、共有トークン/パスワード、または `gateway.auth.mode: "trusted-proxy"` を使用する ID 対応リバースプロキシが必要です。オンボーディングウィザードはデフォルトでトークンを生成します。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されている場合（SecretRef を含む）、`gateway.auth.mode` を `token` または `password` に明示的に設定してください。両方が設定され、モードが未設定の場合、起動およびサービスのインストール/修復フローは失敗します。
- `gateway.auth.mode: "none"`: 明示的な認証なしモード。信頼できるローカル loopback 構成でのみ使用してください。これは意図的にオンボーディングプロンプトでは提供されません。
- `gateway.auth.mode: "trusted-proxy"`: ブラウザー/ユーザー認証を ID 対応リバースプロキシに委任し、`gateway.trustedProxies` からの ID ヘッダーを信頼します（[信頼できるプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照）。このモードはデフォルトで **loopback 以外** のプロキシソースを想定しています。同一ホストの loopback リバースプロキシには、明示的な `gateway.auth.trustedProxy.allowLoopback = true` が必要です。内部の同一ホスト呼び出し元は、ローカルでの直接フォールバックとして `gateway.auth.password` を使用できます。`gateway.auth.token` は trusted-proxy モードとは引き続き排他的です。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve の ID ヘッダーで Control UI/WebSocket 認証を満たせます（`tailscale whois` で検証）。HTTP API エンドポイントは、この Tailscale ヘッダー認証を使用**しません**。代わりに Gateway の通常の HTTP 認証モードに従います。このトークンなしフローでは、Gateway ホストが信頼されていることを前提とします。`tailscale.mode = "serve"` の場合、デフォルトは `true` です。
- `gateway.auth.rateLimit`: オプションの認証失敗リミッター。クライアント IP ごと、かつ認証スコープごとに適用されます（共有シークレットとデバイストークンは個別に追跡されます）。ブロックされた試行は `429` + `Retry-After` を返します。
  - 非同期の Tailscale Serve Control UI パスでは、同じ `{scope, clientIp}` に対する失敗試行は、失敗の書き込み前に直列化されます。そのため、同じクライアントから同時に行われた不正な試行では、両方が単なる不一致として競合通過するのではなく、2 番目のリクエストでリミッターが作動する可能性があります。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。localhost トラフィックも意図的にレート制限する場合（テスト構成や厳格なプロキシ配備など）は、`false` に設定してください。
- ブラウザーオリジンからの WS 認証試行は、loopback の除外を無効にした状態で常にスロットリングされます（ブラウザーベースの localhost ブルートフォースに対する多層防御）。
- loopback では、これらのブラウザーオリジンのロックアウトは正規化された `Origin`
  値ごとに分離されるため、ある localhost オリジンから失敗が繰り返されても、
  別のオリジンが自動的にロックアウトされることはありません。
- `tailscale.mode`: `serve`（tailnet のみ、loopback バインド）または `funnel`（公開、認証が必要）。
- `tailscale.serviceName`: Serve モード用のオプションの Tailscale Service 名。たとえば
  `svc:openclaw`。設定すると、OpenClaw はこれを `tailscale serve
--service` に渡し、デバイスのホスト名ではなく名前付き Service を介して
  Control UI を公開できるようにします。値は Tailscale の `svc:<dns-label>`
  Service 名形式を使用する必要があります。起動時に、導出された Service URL が報告されます。
- `tailscale.preserveFunnel`: `true` かつ `tailscale.mode = "serve"` の場合、OpenClaw は
  起動時に Serve を再適用する前に `tailscale funnel status` を確認し、外部で設定された
  Funnel ルートがすでに Gateway ポートを対象としていれば、再適用をスキップします。
  デフォルトは `false`。
- `controlUi.allowedOrigins`: Gateway WebSocket 接続用の明示的なブラウザーオリジン許可リスト。公開された loopback 以外のブラウザーオリジンでは必須です。loopback、RFC1918/link-local、`.local`、`.ts.net`、または Tailscale CGNAT ホストから読み込まれる、同一オリジンのプライベート LAN/Tailnet UI は、Host ヘッダーフォールバックを有効にしなくても受け入れられます。
- `controlUi.toolTitles`: Control UI チャット内のツール呼び出しに、AI 生成の目的タイトルを使用するようオプトインします。デフォルト: `false`（ツールのレンダリングはバックグラウンドのモデル呼び出しなしで完全に決定論的なままです）。有効にすると、`chat.toolTitles` メソッドは標準のユーティリティモデルルーティング（エージェントの `utilityModel`（他のすべてのユーティリティタスクと同様に、限定されたツール引数を選択したプロバイダーに送信する可能性があるオペレーター判断）、またはセッションプロバイダーが宣言した小規模モデルのデフォルト（OpenAI → `gpt-5.6-luna`、Anthropic → `claude-haiku-4-5`））を介して複雑な呼び出しにラベルを付け、結果をエージェント単位の状態データベースにキャッシュするため、同じ表示で再課金されることはありません。`utilityModel: \"\"` は、他のすべてのユーティリティタスクと同様にタイトルを無効にします。タイトルがプライマリモデルへフォールバックすることはありません。
- `controlUi.chatMessageMaxWidth`: 中央配置された Control UI チャットトランスクリプトのオプションの最大幅。`960px`、`82%`、`min(1280px, 82%)`、`calc(100% - 2rem)` など、制約された CSS 幅値を受け入れます。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host ヘッダーのオリジンポリシーに意図的に依存する配備向けに、Host ヘッダーのオリジンフォールバックを有効にする危険なモード。
- `terminal.enabled`: 管理者スコープのオペレーター端末を使用するようオプトインします。デフォルト: `false`。端末は、選択したエージェントワークスペース内でホスト PTY を起動し、Gateway プロセスの環境を継承します。`sandbox.mode: "all"` のエージェントでは拒否されます。信頼できるオペレーター配備でのみ有効にしてください。変更すると Gateway が再起動され、Control UI のコンテンツセキュリティポリシーが更新されます。
- `terminal.shell`: オプションのシェル実行ファイル。未設定の場合、OpenClaw は Unix では `$SHELL`、Windows では `%ComSpec%` を使用します。
- `terminal.detachedSessionTimeoutSeconds`: 接続が切れた後（ページの再読み込み、ノートパソコンのスリープ）に端末セッションが存続する時間。最近の出力を再生しながら `terminal.attach` で再接続可能な状態を維持します。デフォルト: `300`。接続が切れた瞬間にセッションを終了するには `0` に設定します。切断されたセッションでもコマンドは実行され続けるため、共有ホストや公開ホストではこの値を短くしてください。
- `remote.transport`: `ssh`（デフォルト）または `direct`（ws/wss）。`direct` の場合、公開ホストでは `remote.url` を `wss://` にする必要があります。平文の `ws://` は、loopback、LAN、link-local、`.local`、`.ts.net`、および Tailscale CGNAT ホストでのみ受け入れられます。
- `remote.remotePort`: リモート SSH ホスト上の Gateway ポート。デフォルトは `18789`。ローカルトンネルポートがリモート Gateway ポートと異なる場合に使用します。
- `remote.sshHostKeyPolicy`: macOS SSH トンネルのホストキーポリシー。`strict` がデフォルトで、すでに信頼されているキーが必要です。`openssh` は、管理対象エイリアスに対して有効な OpenSSH 構成を使用するための明示的なオプトインです。使用前に、一致するユーザーおよびシステムの SSH 設定を確認してください。macOS アプリと `configure-remote` は、ターゲット変更時に再度明示的にオプトインしない限り、このポリシーを `strict` にリセットします。
- `gateway.remote.token` / `.password` はリモートクライアントの認証情報フィールドです。これら自体で Gateway 認証が設定されるわけではありません。
- `gateway.push.apns.relay.baseUrl`: リレー対応 iOS ビルドが登録情報を Gateway に公開した後に使用される、外部 APNs リレーのベース HTTPS URL。公開 App Store ビルドは、ホストされている OpenClaw リレーを使用します。カスタムリレー URL は、リレー URL がそのリレーを指すよう意図的に分離された iOS ビルド/配備パスと一致する必要があります。
- `gateway.push.apns.relay.timeoutMs`: Gateway からリレーへの送信タイムアウト（ミリ秒）。デフォルトは `10000`。
- リレー対応の登録は、特定の Gateway ID に委任されます。ペアリングされた iOS アプリは `gateway.identity.get` を取得し、その ID をリレー登録に含め、登録スコープの送信権限を Gateway に転送します。別の Gateway は、保存されたその登録を再利用できません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記のリレー設定に対する一時的な環境変数オーバーライド。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP リレー URL 用の、開発時のみ使用する回避手段。本番環境のリレー URL は HTTPS のままにしてください。
- `gateway.handshakeTimeoutMs`: 認証前の Gateway WebSocket ハンドシェイクタイムアウト（ミリ秒）。デフォルト: `15000`。設定されている場合、`OPENCLAW_HANDSHAKE_TIMEOUT_MS` が優先されます。起動時のウォームアップがまだ安定していなくてもローカルクライアントが接続できる、高負荷または低性能のホストでは、この値を増やしてください。
- `gateway.channelHealthCheckMinutes`: チャネルヘルスモニターの間隔（分）。ヘルスモニターによる再起動をグローバルに無効にするには `0` に設定します。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: 古いソケットと見なすしきい値（分）。この値は `gateway.channelHealthCheckMinutes` 以上にしてください。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: 直近 1 時間における、チャネル/アカウントごとのヘルスモニターによる最大再起動回数。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバルモニターを有効にしたまま、チャネルごとにヘルスモニターによる再起動をオプトアウトします。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 複数アカウント対応チャネルのアカウントごとのオーバーライド。設定すると、チャネルレベルのオーバーライドより優先されます。
- ローカル Gateway の呼び出しパスは、`gateway.auth.*` が未設定の場合にのみ、フォールバックとして `gateway.remote.*` を使用できます。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef を介して明示的に設定され、解決できない場合、解決はフェイルクローズします（リモートフォールバックによる隠蔽はありません）。
- `trustedProxies`: TLS を終端する、または転送クライアントヘッダーを挿入するリバースプロキシの IP。管理下にあるプロキシのみを列挙してください。loopback エントリは、同一ホストのプロキシ/ローカル検出構成（Tailscale Serve やローカルリバースプロキシなど）でも引き続き有効ですが、loopback リクエストが `gateway.auth.mode: "trusted-proxy"` の対象になるわけでは**ありません**。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` がないときに Gateway は `X-Real-IP` を受け入れます。フェイルクローズ動作のため、デフォルトは `false`。
- `gateway.nodes.pairing.autoApproveCidrs`: スコープが要求されていない初回 Node デバイスのペアリングを自動承認するための、オプションの CIDR/IP 許可リスト。未設定の場合は無効です。オペレーター/ブラウザー/Control UI/WebChat のペアリングは自動承認されず、ロール、スコープ、メタデータ、公開キーのアップグレードも自動承認されません。
- `gateway.nodes.pairing.sshVerify`: 初回 Node デバイスペアリングの SSH 検証済み自動承認（デフォルト: 有効）。Gateway はペアリングホストへ SSH で接続し直し（BatchMode、厳格なホストキー）、`openclaw node identity` のデバイスキーが完全に一致する場合にのみ承認します。適格性の最低条件は `autoApproveCidrs` と同じです。`cidrs` で上書きしない限り、プローブはプライベート/CGNAT の送信元アドレスに限定されます。無効にするには `false`、調整するには `{ user, identity, timeoutMs, cidrs }` を設定します。[Node のペアリング](/ja-JP/gateway/pairing#ssh-verified-device-auto-approval-default)を参照してください。
  - `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: ペアリングおよびプラットフォームの許可リスト評価後に、宣言されたNodeコマンドをグローバルに許可または拒否するための設定。`allowCommands`を使用すると、`camera.snap`、`camera.clip`、`screen.record`、`health.summary`、`sms.search`、`sms.send`などの危険なNodeコマンドを明示的に有効化できます。`denyCommands`は、プラットフォームのデフォルト設定または明示的な許可によって対象となる場合でも、コマンドを除外します。iOSのヘルスケア権限、AndroidのSMS権限、Gatewayのコマンド認可はそれぞれ独立しています。Nodeが宣言済みコマンドのリストを変更した後は、そのデバイスのペアリングを拒否してから再承認し、Gatewayに更新されたコマンドのスナップショットを保存させてください。
  - `gateway.tools.deny`: HTTP `POST /tools/invoke`でブロックする追加のツール名（デフォルトの拒否リストを拡張）。
  - `gateway.tools.allow`: owner/adminの呼び出し元に対して、デフォルトのHTTP拒否リストからツール名を
  除外します。これは、アイデンティティ情報を持つ`operator.write`の
  呼び出し元をowner/adminアクセスへ昇格させるものではありません。`cron`、`gateway`、`nodes`は、
  許可リストに追加されている場合でも、owner以外の呼び出し元は引き続き利用できません。

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
    および／または `gateway.http.endpoints.responses.images.allowUrl=false` を使用します。
- オプションのレスポンス強化ヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity`（管理下にある HTTPS オリジンに対してのみ設定してください。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts)を参照してください）

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
- `autoGenerate`: 明示的なファイルが設定されていない場合、ローカルの自己署名証明書／鍵ペアを自動生成します。ローカル／開発用途専用です。
- `certPath`: TLS 証明書ファイルへのファイルシステムパス。
- `keyPath`: TLS 秘密鍵ファイルへのファイルシステムパス。アクセス権限を制限してください。
- `caPath`: クライアント検証またはカスタム信頼チェーン用の、オプションの CA バンドルパス。

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

- `mode`: 実行時に設定の編集を適用する方法を制御します。
  - `"off"`: ライブ編集を無視します。変更には明示的な再起動が必要です。
  - `"restart"`: 設定変更時に常に Gateway プロセスを再起動します。
  - `"hot"`: 再起動せずにプロセス内で変更を適用します。
  - `"hybrid"`（デフォルト）: 最初にホットリロードを試行し、必要な場合は再起動にフォールバックします。
- `debounceMs`: 設定変更を適用するまでのデバウンス期間（ミリ秒）（非負の整数、デフォルト: `300`）。
- `deferralTimeoutMs`: 再起動またはチャンネルのホットリロードを強制する前に、処理中の操作を待機するオプションの最大時間（ミリ秒）。省略すると、デフォルトの上限付き待機時間（`300000`）を使用します。`0` に設定すると無期限に待機し、未完了状態が続いていることを示す警告を定期的にログへ記録します。

---

## クラウドワーカー環境

クラウドワーカーはオプトインです。`cloudWorkers` が存在しない場合、または `profiles` が空の場合、OpenClaw は新しいワーカーの作成を受け付けません。以前に作成された永続レコードは引き続き整合され、表示されたままになります。既存の Gateway／Node プロジェクションは変更されません。

すべてのワーカープロバイダーは、信頼済みのプロビジョニング出力から SSH `hostKey` を、ホスト名やコメントを含めず、厳密に `algorithm base64` の形式で返す必要があります。ブートストラップはその鍵を分離された `known_hosts` ファイルへ書き込み、`StrictHostKeyChecking=yes` を使用し、プロバイダーが鍵を省略した場合は接続を開始する前に失敗します。初回使用時に信頼するフォールバックはありません。

トンネルのセットアップはプロビジョニングの一部ではなく、オンデマンドで行われます。開始すると、Gateway はワーカーのローカル Unix ソケットを、その local loopback WebSocket エンドポイントへリバースフォワードします。ソケットはランダムに割り当てられた所有者専用のリモートディレクトリ内に配置されます。local loopback TCP ポートとは異なり、マルチユーザーワーカー上の他のアカウントからはアクセスできず、別の環境のポートと競合することもありません。SSH キープアライブと上限付きの再接続バックオフは、トンネル所有者が現行の所有者である間だけ動作します。トンネルを停止すると、SSH プロセスを閉じる前に再接続を遮断します。

制御トラフィックとワークスペース転送は、別々の SSH 接続を使用します。どちらも同じ解決済み ID と分離された固定済み `known_hosts` ファイルを再利用しますが、ワークスペース転送は長時間存続するトンネルと SSH 接続の多重化を共有しないため、rsync が制御トラフィックをブロックすることはありません。

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
          // オプションの絶対パス。デフォルト: 隣接する ../crabbox/bin/crabbox、その後 PATH。
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

- `settings.provider`（必須）: `--provider` に渡される Crabbox バックエンド。inspect の出力に SSH エンドポイントが含まれるバックエンドを使用してください。`aws` は直接 AWS バックエンドを選択します。
- `settings.class`（必須）: `--class` に渡される Crabbox マシンクラス。
- `settings.ttl` および `settings.idleTimeout`（必須）: `--ttl` および `--idle-timeout` に渡される、正の Go duration 文字列。これらのプロバイダー側のフェイルセーフは、後述する OpenClaw に保存された `lifetime` ポリシーとは別です。
- `settings.binary`: オプションの Crabbox 実行ファイルの絶対パス。指定しない場合、OpenClaw は隣接する Crabbox チェックアウト、次に `PATH` 上の実行可能エントリを確認し、最後に `crabbox` を呼び出します。これにより、CLI が見つからない場合もプロバイダーエラーとして明示されます。

不明な設定は拒否されます。Crabbox の認証情報およびバックエンド固有のアカウント設定は、引き続き Crabbox が所有します。これらを `settings` に配置しないでください。OpenClaw はローカル CLI のみを呼び出し、この Plugin からプロバイダーへのネットワーク呼び出しは行いません。プロビジョニングでは常に `--keep=true` を渡します。外部ライフサイクルは OpenClaw が所有し、`crabbox stop` でリースを破棄します。

<Warning>
  OpenClaw は、Crabbox のリースローカルな `sshKey` パスを、プロバイダー所有のシークレットリゾルバーを介して解決します。現在の `crabbox inspect --json` 出力ではプロビジョニングされた `sshHostKey` が公開されないため、Crabbox を使用するワーカーは、ブートストラップまたはトンネルのセットアップ前に引き続きフェイルクローズします。Crabbox はリースごとに権威あるホスト鍵をプロビジョニングし、ホスト名やコメントを含めず、厳密に `algorithm base64` の形式で `sshHostKey` を返す必要があります。現在のリースローカルな `known_hosts` キャッシュは、プロビジョニングの信頼材料ではありません。
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

- `profiles`: 空ではなく、前後の空白が除去された ID を持つ名前付きワーカープロファイル。各プロファイルは Plugin によって登録されたプロバイダーを選択します。
- `provider`: 空ではないワーカープロバイダー ID。この例では、同梱の `crabbox` プロバイダーと QA Lab の `static-ssh` プロバイダーを使用しています。
- `install`: ワーカーのインストール方法。`"bundle"`（デフォルト）は、Gateway にインストールされているビルドのコンテンツハッシュ付きバンドルを転送し、リリース済み、開発中、未リリースの各バージョンをサポートします。`"npm"` は、変更されていないパッケージ版リリース向けのオプトイン最適化です。公開 npm レジストリから `openclaw@<exact gateway version>` をインストールし、`latest` は決してインストールしません。
- 同梱のプロバイダー Plugin は、設定されている場合に自動的に選択されますが、明示的な無効化と `plugins.allow` は引き続き適用されます。許可リストが設定されている場合は、プロバイダー ID（例: `crabbox`）を含めてください。外部プロバイダー Plugin も、インストールして明示的に有効にする必要があります。
- `settings`: プロバイダー所有の、サイズが制限された JSON。選択された Plugin がキーを定義および検証します。シークレットを含む値には、[SecretRef オブジェクト](/ja-JP/gateway/secrets)を使用してください。静的 SSH プロバイダーには `host`、`user`、`hostKey`、`keyRef` が必要です。`port` のデフォルトは `22` です。`hostKey` は、既知のホストまたは別の信頼済みチャンネルから取得した OpenSSH 公開ホスト鍵の 1 行（`algorithm base64`）でなければならず、オプションのプレフィックスを含めてはいけません。
- `lifetime.idleTimeoutMinutes`: 後のアイドル回収ポリシー用に保存される、正の整数の分数。
- `lifetime.maxLifetimeMinutes`: 後のライフサイクルポリシー用に保存される、正の整数の分数。

サポート対象の Node ランタイム（22.19+、23.11+、または 24+）が、ワーカーにあらかじめインストールされている必要があります。オプトインの `"npm"` メソッドでは、`npm` と公開 npm レジストリへの送信 HTTPS アクセスも必要です。ネットワークを使用するツールチェーンのセットアップはプロバイダーポリシーです。ブートストラップはツールチェーン自体をインストールせず、対処可能なエラーを報告します。

この基盤は Gateway ビルドをインストールして検証し、トンネルの開始／停止ライフサイクルを提供しますが、汎用の OpenClaw CLI は起動しません。自己完結型のワーカーエントリとループは、次のクラウドワーカーのマイルストーンで導入されます。

各永続環境レコードは、検証済みのプロバイダー設定、解決済みのインストール方法、ライフタイムポリシーを、作成時点のプロファイルスナップショットに保持します。名前付きプロファイルを変更または削除すると新規作成に影響します。既存のレコードは、所有する Plugin が引き続き利用可能である限り、そのスナップショットを使用してライフサイクルの整合を継続します。

最初のクラウドワーカーリリースでは、ライフタイム値はデータとしてのみ扱われます。自動適用は、後続のライフサイクル対応で導入されます。プロファイルを変更した場合は、Gateway の再起動が必要です。

<Warning>
  `static-ssh` プロバイダーはソースツリーの QA Lab 開発ハーネスであり、パッケージ配布物には含まれません。共有ホスト上で動作するワーカーは、ホスト上の無関係なデータを読み取れるため、このプロバイダーを本番環境の分離境界として使用しないでください。
  オペレーターは期待される `hostKey` を指定する必要があります。OpenClaw は初回接続から鍵を学習したり、受け入れたりしません。
  リースを破棄しても OpenClaw の論理レコードが解放されるだけで、ホストの停止やクリーンアップは行われません。
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
- `hooks.token` は、有効な Gateway 共有シークレット認証（`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`）とは別のものにする必要があります。再利用を検出した場合、起動時に致命的ではないセキュリティ警告がログに記録されます。
- `openclaw security audit` は、フックと Gateway の認証情報の再利用を重大な検出事項として報告します。これには、監査時にのみ指定された Gateway パスワード認証（`--auth password --password <password>`）も含まれます。`openclaw doctor --fix` を実行して、永続化されている再利用済みの `hooks.token` をローテーションしてから、外部のフック送信元を更新し、新しいフックトークンを使用するようにしてください。
- `hooks.path` に `/` は指定できません。`/hooks` などの専用サブパスを使用してください。
- `hooks.allowRequestSessionKey=true` の場合は、`hooks.allowedSessionKeyPrefixes` を制限してください（例：`["hook:"]`）。
- マッピングまたはプリセットでテンプレート化された `sessionKey` を使用する場合は、`hooks.allowedSessionKeyPrefixes` と `hooks.allowRequestSessionKey=true` を設定してください。静的なマッピングキーには、この明示的な有効化は不要です。

**エンドポイント：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエストペイロードの `sessionKey` は、`hooks.allowRequestSessionKey=true` の場合にのみ受け入れられます（デフォルト：`false`）。
- `POST /hooks/<name>` → `hooks.mappings` によって解決されます
  - テンプレートでレンダリングされたマッピングの `sessionKey` 値は外部から提供されたものとして扱われ、同様に `hooks.allowRequestSessionKey=true` が必要です。

<Accordion title="マッピングの詳細">

- `match.path` は、`/hooks` の後のサブパスに一致します（例：`/hooks/gmail` → `gmail`）。
- `match.source` は、汎用パスのペイロードフィールドに一致します。
- `{{messages[0].subject}}` のようなテンプレートは、ペイロードから値を読み取ります。
- `transform` には、フックアクションを返す JS/TS モジュールを指定できます。
  - `transform.module` は相対パスでなければならず、`hooks.transformsDir` 内に収まる必要があります（絶対パスとディレクトリトラバーサルは拒否されます）。
  - `hooks.transformsDir` は `~/.openclaw/hooks/transforms` 配下に配置してください。ワークスペースの Skills ディレクトリは拒否されます。`openclaw doctor` がこのパスを無効と報告した場合は、変換モジュールをフックの変換ディレクトリに移動するか、`hooks.transformsDir` を削除してください。
- `agentId` は特定のエージェントにルーティングします。不明な ID の場合はデフォルトのエージェントにフォールバックします。
- `allowedAgentIds`：有効なエージェントルーティングを制限します。これには、`agentId` が省略された場合のデフォルトエージェントへの経路も含まれます（`*` または省略 = すべて許可、`[]` = すべて拒否）。
- `defaultSessionKey`：明示的な `sessionKey` がないフックエージェント実行に使用する、任意の固定セッションキーです。
- `allowRequestSessionKey`：`/hooks/agent` の呼び出し元と、テンプレート駆動のマッピングセッションキーによる `sessionKey` の設定を許可します（デフォルト：`false`）。
- `allowedSessionKeyPrefixes`：明示的な `sessionKey` 値（リクエスト + マッピング）に対する任意のプレフィックス許可リストです。例：`["hook:"]`。いずれかのマッピングまたはプリセットでテンプレート化された `sessionKey` を使用する場合は必須です。
- `deliver: true` は最終応答をチャンネルに送信します。`channel` のデフォルトは `last` です。
- `model` は、このフック実行に使用する LLM を上書きします（モデルカタログが設定されている場合は、許可されている必要があります）。

</Accordion>

### Gmail 連携

- 組み込みの Gmail プリセットは `sessionKey: "hook:gmail:{{messages[0].id}}"` を使用します。
- メッセージ単位のルーティングを維持する場合は、`hooks.allowRequestSessionKey: true` を設定し、`hooks.allowedSessionKeyPrefixes` を Gmail 名前空間に一致するよう制限してください。例：`["hook:", "hook:gmail:"]`。
- `hooks.allowRequestSessionKey: false` が必要な場合は、テンプレート化されたデフォルトの代わりに、静的な `sessionKey` でプリセットを上書きしてください。

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
- Gateway と並行して、別の `gog gmail watch serve` を実行しないでください。

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

- エージェントが編集可能な HTML/CSS/JS と A2UI を、Gateway ポート配下で HTTP 経由で提供します。
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカル専用：`gateway.bind: "loopback"`（デフォルト）を維持してください。
- ループバック以外へのバインド：Canvas ルートには、ほかの Gateway HTTP サーフェスと同様に Gateway 認証（トークン／パスワード／信頼済みプロキシ）が必要です。
- Node WebView は通常、認証ヘッダーを送信しません。Node がペアリングされ接続された後、Gateway は Canvas/A2UI アクセス用の Node スコープのケイパビリティ URL を通知します。
- ケイパビリティ URL は有効な Node WS セッションに紐付けられ、短時間で期限切れになります。IP ベースのフォールバックは使用されません。
- 提供する HTML にライブリロードクライアントを挿入します。
- 空の場合は初期 `index.html` を自動作成します。
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

- `minimal`（デフォルト）：TXT レコードから `cliPath` と `sshPort` を省略します。
- `full`：`cliPath` と `sshPort` を含めます。LAN マルチキャスト広告には、引き続き同梱の `bonjour` Plugin が有効である必要があります。
- `off`：Plugin の有効化状態を変更せずに、LAN マルチキャスト広告を抑止します。
- 同梱の `bonjour` Plugin は macOS ホストでは自動起動し、Linux、Windows、およびコンテナ化された Gateway デプロイでは明示的な有効化が必要です。
- ホスト名が有効な DNS ラベルである場合は、デフォルトでシステムのホスト名が使用され、それ以外の場合は `openclaw` にフォールバックします。`OPENCLAW_MDNS_HOSTNAME` で上書きできます。
- `OPENCLAW_DISABLE_BONJOUR=1` は `discovery.mdns.mode` を上書きし、mDNS 広告を完全に無効にします。

### 広域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 配下にユニキャスト DNS-SD ゾーンを書き込みます。ネットワークをまたぐ検出には、DNS サーバー（CoreDNS 推奨）と Tailscale スプリット DNS を組み合わせてください。

セットアップ：`openclaw dns setup --apply`。

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

- インライン環境変数は、プロセス環境にそのキーがない場合にのみ適用されます。
- `.env` ファイル：CWD の `.env` + `~/.openclaw/.env`（どちらも既存の変数を上書きしません）。
- `shellEnv`：ログインシェルのプロファイルから、未設定の想定キーをインポートします。
- 完全な優先順位については、[環境](/ja-JP/help/environment)を参照してください。

### 環境変数の置換

任意の設定文字列で `${VAR_NAME}` を使用して環境変数を参照できます。

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 一致するのは大文字の名前のみです：`[A-Z_][A-Z0-9_]*`。
- 変数が未設定または空の場合、設定の読み込み時にエラーが発生します。
- リテラルの `${VAR}` には `$${VAR}` でエスケープしてください。
- `$include` と併用できます。

---

## シークレット

シークレット参照は追加的な機能です。平文の値も引き続き使用できます。

### `SecretRef`

次のいずれかのオブジェクト形式を使用します。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証：

- `provider` のパターン：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` の ID パターン：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` の ID：絶対 JSON ポインター（例：`"/providers/openai/apiKey"`）
- `source: "exec"` の ID パターン：`^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`（AWS 形式の `secret#json_key` セレクターをサポート）
- `source: "exec"` の ID に、スラッシュで区切られた `.` または `..` のパスセグメントを含めることはできません（例：`a/../b` は拒否されます）

### サポート対象の認証情報サーフェス

- 正規マトリクス：[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)
- `secrets apply` は、サポート対象の `openclaw.json` 認証情報パスを対象とします。
- `auth-profiles.json` の参照は、ランタイム解決と監査の対象範囲に含まれます。

### シークレットプロバイダーの設定

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // オプションの明示的な env プロバイダー
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

注：

- `file` プロバイダーは `mode: "json"` と `mode: "singleValue"` をサポートします（singleValue モードでは `id` は `"value"` でなければなりません）。
- Windows ACL の検証を利用できない場合、file および exec プロバイダーのパスは安全側に倒して失敗します。検証できない信頼済みパスに限り、`allowInsecurePath: true` を設定してください。
- `exec` プロバイダーには絶対 `command` パスが必要で、stdin/stdout でプロトコルペイロードを使用します。
- デフォルトでは、シンボリックリンクのコマンドパスは拒否されます。解決後の対象パスを検証しつつシンボリックリンクのパスを許可するには、`allowSymlinkCommand: true` を設定してください。
- `trustedDirs` が設定されている場合、信頼済みディレクトリのチェックは解決後の対象パスに適用されます。
- `exec` 子プロセスの環境はデフォルトで最小限です。必要な変数は `passEnv` で明示的に渡してください。
- シークレット参照は有効化時にメモリ内スナップショットへ解決され、その後のリクエスト処理ではスナップショットのみが読み取られます。
- 有効化時には、有効なサーフェスのフィルタリングが適用されます。有効なサーフェス上の未解決参照は起動／再読み込みを失敗させますが、無効なサーフェスは診断情報とともにスキップされます。

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

- エージェント単位のプロファイルは `<agentDir>/auth-profiles.json` に保存されます。
- `auth-profiles.json` は、静的認証情報モード向けに値レベルの参照（`api_key` の `keyRef`、`token` の `tokenRef`）をサポートします。
- `{ "provider": { "apiKey": "..." } }` のような従来のフラット形式の `auth-profiles.json` マップはランタイム形式ではありません。`openclaw doctor --fix` は、`.legacy-flat.*.bak` バックアップを作成し、正規の `provider:default` API キープロファイルに書き換えます。
- OAuth モードのプロファイル（`auth.profiles.<id>.mode = "oauth"`）は、SecretRef を使用する認証プロファイルの認証情報をサポートしません。
- 静的なランタイム認証情報は、メモリ内の解決済みスナップショットから取得されます。従来の静的な `auth.json` エントリは、検出時に消去されます。
- 従来の OAuth インポート元は `~/.openclaw/credentials/oauth.json` です。
- [OAuth](/ja-JP/concepts/oauth)を参照してください。
- シークレットのランタイム動作と `audit/configure/apply` ツールについては、[シークレット管理](/ja-JP/gateway/secrets)を参照してください。

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

- `billingBackoffHours`: プロファイルが実際の請求／クレジット不足エラーにより失敗した場合の、時間単位の基本バックオフ（デフォルト: `5`）。明示的な請求関連テキストは、`401`/`403` レスポンスでもここに分類される場合がありますが、プロバイダー固有のテキストマッチャーは、それを所有するプロバイダーに限定されます（たとえば OpenRouter の `Key limit exceeded`）。再試行可能な HTTP `402` の使用期間、または組織／ワークスペースの支出上限に関するメッセージは、代わりに `rate_limit` パスに分類されます。
- `billingBackoffHoursByProvider`: プロバイダーごとに請求バックオフ時間を上書きするためのオプション設定。
- `billingMaxHours`: 請求バックオフの指数的増加に対する時間単位の上限（デフォルト: `24`）。
- `authPermanentBackoffMinutes`: 確度の高い `auth_permanent` 失敗に対する分単位の基本バックオフ（デフォルト: `10`）。
- `authPermanentMaxMinutes`: `auth_permanent` バックオフの増加に対する分単位の上限（デフォルト: `60`）。
- `failureWindowHours`: バックオフカウンターに使用する時間単位のローリングウィンドウ（デフォルト: `24`）。
- `overloadedProfileRotations`: モデルフォールバックに切り替える前に、過負荷エラーに対して実行する同一プロバイダー内の認証プロファイルローテーションの最大回数（デフォルト: `1`）。`ModelNotReadyException` など、プロバイダーがビジー状態であることを示す形式はここに分類されます。
- `overloadedBackoffMs`: 過負荷状態のプロバイダー／プロファイルローテーションを再試行する前の固定遅延（デフォルト: `0`）。
- `rateLimitedProfileRotations`: モデルフォールバックに切り替える前に、レート制限エラーに対して実行する同一プロバイダー内の認証プロファイルローテーションの最大回数（デフォルト: `1`）。このレート制限バケットには、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted` など、プロバイダー固有の形式のテキストが含まれます。

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

Gateway は、エージェント実行とツール操作に関する**メタデータのみ**の監査イベントを共有状態データベースに記録します。メッセージのライフサイクルメタデータは、別途オプトインする必要があります。台帳には ID、タイミング、ツール名、正規化された結果が保存されますが、プロンプト、メッセージ本文、ツール引数、結果、生のエラーテキストは一切保存されません。メッセージ行には、プラットフォームの生のアカウント ID、会話 ID、メッセージ ID、ターゲット ID は保存されません。実行／ツールのセッションキーは相関付けに引き続き利用でき、それ自体にプラットフォームのアカウント ID やピア ID が含まれる場合があります。レコードは 30 日後に期限切れになり、台帳の上限は 100,000 行です。[`openclaw audit`](/ja-JP/cli/audit) または [`audit.activity.list`](/ja-JP/gateway/protocol#audit-ledger-rpc) Gateway RPC で照会できます。完全なデータモデル、プライバシーの意味論、対象範囲の制限については、[監査履歴](/ja-JP/gateway/audit)を参照してください。

- `enabled`: 新しい監査イベントを記録します（デフォルト: `true`）。インシデント発生後にのみ有効化された監査証跡では、そのインシデントを説明できないため、台帳はデフォルトで有効です。`false` に設定すると、Gateway の再起動後に新しいイベントの挿入が停止します。既存のレコードは期限切れになるまで読み取り可能なままです。再度有効にすると、その時点から記録が再開されます。空白期間は埋め戻されません。
- `messages`: メッセージメタデータの対象範囲（デフォルト: `"off"`）。`"direct"` は既知の直接会話のみを記録します。`"all"` はグループ、チャンネル、不明な種類の会話も記録します。どちらのモードでも内容は記録されず、相関付けが可能な場合、生の識別子はインストール環境ローカルの鍵付き仮名に置き換えられます。これは匿名化ではなく相関付けを補助するものです。状態データベースには導出キーが保存されますが、RPC および CLI のエクスポートには含まれません。

実行中の Gateway は、起動時に `audit.enabled` と `audit.messages` を取得します。いずれかの設定を変更した後は再起動してください。現在のメッセージ対象範囲には、コアのディスパッチに到達した受信メッセージと、共有の永続配信に到達した元の論理的な送信返信ペイロードごとの 1 つの終端行が含まれます。これらの共有境界を迂回する Plugin ローカルおよび直接送信パスは、まだ対象外です。容量制限付きのバックグラウンドライターはベストエフォート方式であり、損失のないコンプライアンスアーカイブではありません。

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
- `maxFileBytes`: ローテーション前のアクティブなログファイルの最大サイズ（バイト単位、正の整数、デフォルト: `104857600` = 100 MB）。OpenClaw はアクティブファイルの隣に、番号付きアーカイブを最大 5 個保持します。
- `redactSensitive` / `redactPatterns`: コンソール出力、ファイルログ、OTLP ログレコード、永続化されたセッショントランスクリプトテキストに対するベストエフォート方式のマスキング。`redactSensitive: "off"` は、この一般的なログ／トランスクリプトポリシーのみを無効にします。UI／ツール／診断の安全性に関わる出力では、引き続き出力前にシークレットが秘匿化されます。

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
- `flags`: 対象を絞ったログ出力を有効にするフラグ文字列の配列（`"telegram.*"` や `"*"` などのワイルドカードをサポート）。
- `stuckSessionWarnMs`: 長時間実行中の処理セッションを `session.long_running`、`session.stalled`、または `session.stuck` と分類するための、進行がない状態の経過時間しきい値（ミリ秒単位、デフォルト: `120000`）。返信、ツール、ステータス、ブロック、ACP の進行によってタイマーはリセットされます。状態に変化がない間、繰り返される `session.stuck` 診断にはバックオフが適用されます。
- `stuckSessionAbortMs`: 回復のために、対象となる停止中のアクティブ作業を中止してドレインできるようになるまでの、進行がない状態の経過時間しきい値（ミリ秒単位）。未設定の場合、OpenClaw は少なくとも 5 分かつ `stuckSessionWarnMs` の 3 倍となる、より安全な拡張組み込み実行ウィンドウを使用します。
- `memoryPressureSnapshot`: メモリ負荷が `critical` に達したとき、秘匿化済みの OOM 発生前安定性スナップショットを取得します（デフォルト: `false`）。通常のメモリ負荷イベントを維持したまま、安定性バンドルのファイルスキャン／書き込みを追加するには `true` に設定します。
- `otel.enabled`: OpenTelemetry エクスポートパイプラインを有効にします（デフォルト: `false`）。完全な設定、シグナルカタログ、プライバシーモデルについては、[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)を参照してください。
- `otel.endpoint`: OTel エクスポート用のコレクター URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: シグナル固有のオプションの OTLP エンドポイント。設定した場合、そのシグナルに限り `otel.endpoint` を上書きします。
- `otel.protocol`: `"http/protobuf"`（デフォルト）または `"grpc"`。
- `otel.headers`: OTel エクスポートリクエストとともに送信する追加の HTTP/gRPC メタデータヘッダー。
- `otel.serviceName`: リソース属性に使用するサービス名。
- `otel.traces` / `otel.metrics` / `otel.logs`: トレース、メトリクス、またはログのエクスポートを有効にします。
- `otel.logsExporter`: ログのエクスポート先: `"otlp"`（デフォルト）、標準出力の各行に 1 つの JSON オブジェクトを出力する `"stdout"`、または `"both"`。
- `otel.sampleRate`: トレースのサンプリングレート `0`-`1`。
- `otel.flushIntervalMs`: 定期的なテレメトリのフラッシュ間隔（ミリ秒単位）。
- `otel.captureContent`: OTEL スパン属性に生の内容を取得するためのオプトイン設定。デフォルトでは無効です。真偽値 `true` を指定すると、システム以外のメッセージ／ツール内容を取得します。オブジェクト形式では、`inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt`、`toolDefinitions` を個別に有効化できます。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: `{gen_ai.operation.name} {gen_ai.request.model}` 形式のスパン名、`CLIENT` スパン種別、従来の `gen_ai.system` の代わりとなる `gen_ai.provider.name` を含む、最新の試験的な GenAI 推論スパン形式を有効にする環境トグル。デフォルトでは、互換性のためにスパンは `openclaw.model.call` と `gen_ai.system` を維持します。GenAI メトリクスでは、有界のセマンティック属性を使用します。
- `OPENCLAW_OTEL_PRELOADED=1`: グローバル OpenTelemetry SDK をすでに登録しているホスト向けの環境トグル。OpenClaw は診断リスナーをアクティブに保ったまま、Plugin が所有する SDK の起動／シャットダウンを省略します。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`、`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: 対応する設定キーが未設定の場合に使用される、シグナル固有のエンドポイント環境変数。
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

- `channel`: リリースチャンネル — `"stable"`、`"extended-stable"`、`"beta"`、または `"dev"`。Extended-stable はパッケージ専用です。フォアグラウンドコマンドがインストールを担い、Gateway は読み取り専用の更新ヒントを出力する場合があります。
- `checkOnStart`: Gateway の起動時に npm の更新を確認します（デフォルト: `true`）。保存された extended-stable の選択では、同じ読み取り専用ヒントと 24 時間ごとのヒントスケジュールが使用されます。
- `auto.enabled`: stable および beta のパッケージインストールに対するバックグラウンド自動更新を有効にします（デフォルト: `false`）。Extended-stable には自動適用されません。
- `auto.stableDelayHours`: stable チャンネルの自動適用前の最小遅延時間（デフォルト: `6`、最大: `168`）。
- `auto.stableJitterHours`: stable チャンネルのロールアウトを分散させる追加ウィンドウ（時間単位、デフォルト: `12`、最大: `168`）。
- `auto.betaCheckIntervalHours`: beta チャンネルの確認を実行する間隔（時間単位、デフォルト: `1`、最大: `24`）。stable の遅延／ジッターおよび beta のポーリング設定は extended-stable には適用されません。

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

- `enabled`: ACP のグローバル機能ゲート（デフォルト: `true`。ACP のディスパッチおよび生成機能を非表示にするには `false` に設定）。
- `dispatch.enabled`: ACP セッションのターンディスパッチ用の独立したゲート（デフォルト: `true`）。ACP コマンドを利用可能なまま実行をブロックするには `false` に設定します。
- `backend`: デフォルトの ACP ランタイムバックエンド ID（登録済みの ACP ランタイム Plugin と一致する必要があります）。
  最初にバックエンド Plugin をインストールし、`plugins.allow` が設定されている場合は、バックエンド Plugin ID（例: `acpx`）を含めてください。含めないと ACP バックエンドは読み込まれません。
- `fallbacks`: プライマリバックエンドが出力を生成する前に、一時的と思われるエラー（利用不可、レート制限、クォータ枯渇、または過負荷）で早期に失敗した場合に試行される、フォールバック ACP バックエンド ID の順序付きリスト。各エントリは、登録済みの ACP ランタイム Plugin バックエンドと一致する必要があります。
- `defaultAgent`: 生成時に明示的なターゲットが指定されていない場合の、フォールバック ACP ターゲットエージェント ID。
- `allowedAgents`: ACP ランタイムセッションに許可されるエージェント ID の許可リスト。空の場合、追加の制限はありません。
- `maxConcurrentSessions`: 同時にアクティブにできる ACP セッションの最大数。
- `stream.coalesceIdleMs`: ストリーミングテキストをフラッシュするまでのアイドル待機時間（ms）。
- `stream.maxChunkChars`: ストリーミングされるブロック投影を分割する前の最大チャンクサイズ。
- `stream.repeatSuppression`: ターンごとに繰り返されるステータス行およびツール行を抑制します（デフォルト: `true`）。
- `stream.deliveryMode`: `"live"` は逐次ストリーミングし、`"final_only"` はターンの終了イベントまでバッファリングします。
- `stream.hiddenBoundarySeparator`: 非表示のツールイベント後、表示テキストの前に挿入する区切り（デフォルト: `"paragraph"`）。
- `stream.maxOutputChars`: ACP ターンごとに投影されるアシスタント出力の最大文字数。
- `stream.maxSessionUpdateChars`: 投影される ACP ステータス行および更新行の最大文字数。
- `stream.tagVisibility`: ストリーミングイベントのタグ名から、可視性を上書きするブール値へのレコード。
- `runtime.ttlMinutes`: ACP セッションワーカーがクリーンアップ対象になるまでの、分単位のアイドル TTL。
- `runtime.installCommand`: ACP ランタイム環境のブートストラップ時に実行する、オプションのインストールコマンド。

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

- `cli.banner.taglineMode` はバナーのタグライン形式を制御します。
  - `"random"`（デフォルト）：ユーモラスな季節のタグラインを順番に表示します。
  - `"default"`：固定されたニュートラルなタグライン（`All your chats, one OpenClaw.`）を表示します。
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

[エージェントのデフォルト](/ja-JP/gateway/config-agents#agent-defaults)にある `agents.list` の識別情報フィールドを参照してください。

---

## ブリッジ（レガシー、削除済み）

現在のビルドには TCP ブリッジが含まれなくなりました。Node は Gateway WebSocket 経由で接続します。`bridge.*` キーは設定スキーマに含まれなくなっています（削除するまで検証は失敗します。`openclaw doctor --fix` で不明なキーを除去できます）。

<Accordion title="レガシーブリッジ設定（過去の参考資料）">

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
    maxConcurrentRuns: 8, // デフォルト。Cron のディスパッチと分離された Cron エージェントターンの実行
    webhook: "https://example.invalid/legacy", // 保存済みの notify:true ジョブ向けの非推奨フォールバック
    webhookToken: "replace-with-dedicated-token", // 送信 Webhook 認証用の任意のベアラートークン
    sessionRetention: "24h", // 期間文字列または false
    runLog: {
      maxBytes: "2mb", // デフォルトは 2_000_000 バイト
      keepLines: 2000, // デフォルトは 2000
    },
  },
}
```

- `sessionRetention`: 完了した分離 Cron 実行セッションを、SQLite のセッション行から削除するまで保持する期間。アーカイブされた削除済み Cron トランスクリプトのクリーンアップも制御します。デフォルト: `24h`。無効にするには `false` を設定します。
- `runLog.maxBytes`: 以前のファイルベースの Cron 実行ログとの互換性のために受け付けられます。デフォルト: `2_000_000` バイト。
- `runLog.keepLines`: ジョブごとに保持される最新の SQLite 実行履歴行。デフォルト: `2000`。
- `webhookToken`: Cron Webhook の POST 配信（`delivery.mode = "webhook"`）に使用されるベアラートークン。省略した場合、認証ヘッダーは送信されません。
- `webhook`: `notify: true` が残っている保存済みジョブを `openclaw doctor --fix` で移行するために使用される、非推奨のレガシーフォールバック Webhook URL（http/https）。ランタイム配信では、ジョブごとの `delivery.mode="webhook"` と `delivery.to`、またはアナウンス配信を維持する場合は `delivery.completionDestination` を使用します。

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

- `maxAttempts`: 一時的なエラーが発生した Cron ジョブの最大再試行回数（デフォルト: `3`、範囲: `0`～`10`）。
- `backoffMs`: 各再試行のバックオフ遅延（ミリ秒）の配列（デフォルト: `[30000, 60000, 300000]`、1～10 エントリ）。
- `retryOn`: 再試行をトリガーするエラー種別 - `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。すべての一時的なエラー種別を再試行する場合は省略します。

単発ジョブは再試行回数を使い切るまで有効なままで、その後、最終的なエラー状態を保持したまま無効になります。定期実行ジョブは同じ一時的エラー再試行ポリシーを使用し、次にスケジュールされた実行枠より前に、バックオフ後に再実行します。恒久的なエラーが発生した場合や一時的エラーの再試行を使い切った場合は、エラーバックオフ付きの通常の定期実行スケジュールにフォールバックします。

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
- `cooldownMs`: 同じジョブでアラートを繰り返す際の最小間隔（ミリ秒、非負整数）。
- `includeSkipped`: 連続してスキップされた実行をアラートしきい値に含めます（デフォルト: `false`）。スキップされた実行は個別に追跡され、実行エラーのバックオフには影響しません。
- `mode`: 配信モード - `"announce"` はチャンネルメッセージ経由で送信し、`"webhook"` は設定済みの Webhook に送信します。
- `accountId`: アラート配信のスコープを指定する任意のアカウント ID またはチャンネル ID。

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

- すべてのジョブに共通する Cron 失敗通知のデフォルト送信先。
- `mode`: `"announce"` または `"webhook"`。十分な送信先データがある場合、デフォルトは `"announce"` です。
- `channel`: announce 配信のチャンネルを上書きします。`"last"` は最後に使用した既知の配信チャンネルを再利用します。
- `to`: 明示的な announce 送信先または Webhook URL。Webhook モードでは必須です。
- `accountId`: 配信に使用するアカウントを任意で上書きします。
- ジョブごとの `delivery.failureDestination` は、このグローバルデフォルトを上書きします。
- グローバルにもジョブごとにも失敗時の送信先が設定されていない場合、すでに `announce` で配信しているジョブは、失敗時にその主要な announce 送信先へフォールバックします。
- `delivery.failureDestination` は、ジョブの主要な `delivery.mode` が `"webhook"` である場合を除き、`sessionTarget="isolated"` のジョブでのみサポートされます。

[Cron ジョブ](/ja-JP/automation/cron-jobs)を参照してください。分離された Cron 実行は[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

---

## メディアモデルのテンプレート変数

`tools.media.models[].args` 内で展開されるテンプレートプレースホルダー:

| 変数               | 説明                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 受信メッセージの本文全体                          |
| `{{RawBody}}`      | 生の本文（履歴や送信者のラッパーなし）            |
| `{{BodyStripped}}` | グループメンションを除去した本文                  |
| `{{From}}`         | 送信者識別子                                      |
| `{{To}}`           | 送信先識別子                                      |
| `{{MessageSid}}`   | チャンネルメッセージ ID                           |
| `{{SessionId}}`    | 現在のセッション UUID                             |
| `{{IsNewSession}}` | 新しいセッションが作成された場合は `"true"`      |
| `{{MediaUrl}}`     | 受信メディアの疑似 URL                            |
| `{{MediaPath}}`    | ローカルメディアのパス                            |
| `{{MediaType}}`    | メディア種別（画像／音声／ドキュメント／…）      |
| `{{Transcript}}`   | 音声の文字起こし                                  |
| `{{Prompt}}`       | CLI エントリ用に解決されたメディアプロンプト      |
| `{{MaxChars}}`     | CLI エントリ用に解決された最大出力文字数          |
| `{{ChatType}}`     | `"direct"` または `"group"`                       |
| `{{GroupSubject}}` | グループの件名（可能な範囲で取得）                |
| `{{GroupMembers}}` | グループメンバーのプレビュー（可能な範囲で取得）  |
| `{{SenderName}}`   | 送信者の表示名（可能な範囲で取得）                |
| `{{SenderE164}}`   | 送信者の電話番号（可能な範囲で取得）              |
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
- ファイルの配列: 順番にディープマージされます（後の値が前の値を上書きします）。
- 兄弟キー: インクルード後にマージされます（インクルードされた値を上書きします）。
- ネストされたインクルード: 最大 10 階層。
- パス: インクルード元ファイルからの相対パスとして解決されますが、最上位の設定ディレクトリ（`openclaw.json` の `dirname`）内に収まる必要があります。絶対パスや `../` 形式は、解決後もその境界内に収まる場合にのみ許可されます。設定ディレクトリ外のルートを追加で許可するには、`OPENCLAW_INCLUDE_ROOTS`（絶対パス）を設定します。
- 制限: パスに null バイトを含めることはできず、解決前と解決後の両方で 4096 文字未満でなければなりません。インクルードされる各ファイルの上限は 2 MB です。
- 単一ファイルのインクルードに対応する最上位セクションを 1 つだけ変更する OpenClaw による書き込みは、そのインクルード先ファイルへ直接書き込まれます。たとえば、`plugins install` は `plugins: { $include: "./plugins.json5" }` を `plugins.json5` 内で更新し、`openclaw.json` は変更しません。
- ルートインクルード、インクルード配列、および兄弟キーによる上書きを含むインクルードは、OpenClaw による書き込みでは読み取り専用です。これらの書き込みは設定をフラット化せず、フェイルクローズします。
- エラー: ファイルの欠落、解析エラー、循環インクルード、無効なパス形式、長さ超過に対して明確なメッセージを表示します。

---

## 関連項目

- [設定](/ja-JP/gateway/configuration)
- [設定例](/ja-JP/gateway/configuration-examples)
- [Doctor](/ja-JP/gateway/doctor)
