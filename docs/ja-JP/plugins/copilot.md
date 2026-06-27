---
read_when:
    - エージェントに GitHub Copilot SDK ハーネスを使用したい
    - '`copilot` ランタイム用の構成例が必要です'
    - エージェントをサブスクリプション版Copilot（github / openclaw / copilot）に接続し、Copilot CLI経由で実行したい場合
summary: 外部の GitHub Copilot SDK ハーネスを通じて OpenClaw の組み込みエージェントターンを実行する
title: Copilot SDK ハーネス
x-i18n:
    generated_at: "2026-06-27T12:14:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a052cc21130b680f6af9ae32bc1dbaeaa15be5092939f0c236515a3233ab9b
    source_path: plugins/copilot.md
    workflow: 16
---

外部 `@openclaw/copilot` プラグインにより、OpenClaw は組み込み PI ハーネスの代わりに GitHub Copilot CLI (`@github/copilot-sdk`) を通じて、サブスクリプションに組み込まれた Copilot エージェントターンを実行できます。

低レベルのエージェントループ、つまりネイティブツール実行、ネイティブ Compaction (`infiniteSessions`)、および `copilotHome` 配下の CLI 管理スレッド状態を Copilot CLI セッションに所有させたい場合は、Copilot SDK ハーネスを使用します。
OpenClaw は引き続き、チャットチャネル、セッションファイル、モデル選択、OpenClaw 動的ツール（ブリッジ）、承認、メディア配信、可視トランスクリプトミラー、`/btw` の横質問（ツリー内 PI フォールバックで処理されます。[横質問 (`/btw`)](#side-questions-btw) を参照）、および `openclaw doctor` を所有します。

より広いモデル、プロバイダー、ランタイムの分離については、[エージェントランタイム](/ja-JP/concepts/agent-runtimes) から始めてください。

## 要件

- `@openclaw/copilot` プラグインがインストールされた OpenClaw。
- 設定で `plugins.allow` を使用している場合は、`copilot`（プラグインが宣言するマニフェスト id）を含めてください。npm 形式の `@openclaw/copilot` パッケージ名を使う制限的な許可リストでは、`agentRuntime.id: "copilot"` があってもプラグインはブロックされたままとなり、ランタイムは読み込まれません。
- Copilot CLI を駆動できる GitHub Copilot サブスクリプション（またはヘッドレス / cron 実行用の `gitHubToken` env / 認証プロファイルエントリ）。
- 書き込み可能な `copilotHome` ディレクトリ。OpenClaw がエージェントディレクトリを提供する場合、ハーネスのデフォルトは `<agentDir>/copilot` です。それ以外の場合は、エージェントごとの完全な分離のために `~/.openclaw/agents/<agentId>/copilot` になります。

`openclaw doctor` は、宣言的なセッション状態所有権と将来の互換性マイグレーションのために、プラグインの [doctor コントラクト](#doctor) を実行します。Copilot CLI 環境プローブは実行しません。

## プラグインのインストール

Copilot ランタイムは外部プラグインであるため、コアの `openclaw` パッケージは `@github/copilot-sdk` 依存関係や、プラットフォーム固有の `@github/copilot-<platform>-<arch>` CLI バイナリを含みません。これらを合わせると約 260 MB になるため、このランタイムを選択するエージェントにのみインストールしてください。

```bash
openclaw plugins install @openclaw/copilot
```

ウィザードは、`github-copilot/*` モデルを初めて選択し、かつ設定がそのモデル（またはそのプロバイダー）を `agentRuntime: { id: "copilot" }` によって Copilot エージェントランタイムに明示的に割り当てている場合に、プラグインをインストールします（下記の [クイックスタート](#quickstart) を参照）。明示的な割り当てがない場合、openclaw は組み込みの GitHub Copilot プロバイダーを使用し、ランタイムプラグインをインストールしません。

ランタイムは次の順序で SDK を解決します。

1. インストール済みの `@openclaw/copilot` パッケージから `import("@github/copilot-sdk")`。
2. よく知られたフォールバックディレクトリ `~/.openclaw/npm-runtime/copilot/`（従来のオンデマンドインストール先）。

SDK が見つからない場合、コード `COPILOT_SDK_MISSING` と上記のプラグイン再インストールコマンドを含む単一のエラーが表示されます。

## クイックスタート

1 つのモデル（または 1 つのプロバイダー）をハーネスに固定します。

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/auto",
      models: {
        "github-copilot/auto": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

どちらのルートも同等です。そのモデルだけをハーネス経由にしたい場合は、単一のモデルエントリで `agentRuntime.id` を使用します。そのプロバイダー配下のすべてのモデルで使う場合は、プロバイダーに `agentRuntime.id` を設定します。

`github-copilot/auto` はポータブルな開始点です。名前付き Copilot モデルはアカウントおよび組織ポリシーに依存するため、認証済み Copilot CLI がそれを公開していることを確認してから固定してください。

## サポートされるプロバイダー

ハーネスは、正規の `github-copilot` プロバイダー（`extensions/github-copilot` が所有する同じ id）のサポートを公開します。

- `github-copilot`

また、選択されたモデルに空でない `baseUrl` があり、次のいずれかの API 形状である場合、カスタム `models.providers` エントリもサポートします。

- `openai-responses`
- `openai-completions`
- `ollama`（OpenAI 互換 completions）
- `azure-openai-responses`
- `anthropic-messages`

`openai`、`anthropic`、`google`、`ollama` などのネイティブプロバイダー id は、引き続きそれぞれのネイティブランタイムが所有します。Copilot BYOK 経由でエンドポイントをルーティングする場合は、個別のカスタムプロバイダー id を使用してください。

Copilot BYOK エンドポイントは、パブリックネットワーク HTTPS URL である必要があります。ハーネスは Copilot SDK に試行ごとのループバックプロキシ URL を渡し、その後プロバイダートラフィックを OpenClaw の保護された fetch パス経由で転送するため、DNS ピン留めと SSRF ポリシーは OpenClaw が所有し続けます。ローカル Ollama、LM Studio、または LAN モデルサーバーには、ネイティブ OpenClaw ランタイムを使用してください。

## BYOK

Copilot BYOK は SDK のセッションレベルのカスタムプロバイダーコントラクトを使用します。OpenClaw は、解決されたモデルエンドポイント、API キー、ベアラートークンモード、ヘッダー、モデル id、コンテキスト / 出力制限を渡しますが、プロバイダートランスポートロジックをコアには移動しません。

例:

```json5
{
  agents: {
    defaults: {
      model: "custom-proxy/llama-3.1-8b",
      models: {
        "custom-proxy/llama-3.1-8b": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_PROXY_API_KEY}",
        api: "openai-responses",
        authHeader: true,
        models: [{ id: "llama-3.1-8b", name: "Llama 3.1 8B" }],
      },
    },
  },
}
```

BYOK セッションは、サブスクリプションセッションや他のエンドポイントまたは認証情報フィンガープリントとは別にキー付けされます。キー、ヘッダー、モデル、またはエンドポイントをローテーションすると、互換性のない状態を再開するのではなく、新しい Copilot SDK セッションが作成されます。

## 認証

`runCopilotAttempt` 中に適用されるエージェントごとの優先順位:

1. 試行入力での **明示的な `useLoggedInUser: true`**。エージェントの `copilotHome` 配下で解決された Copilot CLI のログインユーザーを使用します。
2. 試行入力での **明示的な `gitHubToken`**（`profileId` + `profileVersion` 付き）。呼び出し元が認証プロファイル解決をバイパスしたい直接 CLI 呼び出しやテストに有用です。
3. `EmbeddedRunAttemptParams` 形状からの **コントラクト解決済み `resolvedApiKey` + `authProfileId`**。これは **本番のメインパス** です。コアは、ハーネスを呼び出す前に、エージェントに設定された `github-copilot` 認証プロファイルを（`src/infra/provider-usage.auth.ts:resolveProviderAuths` 経由で）解決し、ハーネスは両方のフィールドを直接消費します。これにより、env vars なしで、`github-copilot:<profile>` 認証プロファイルがヘッドレス / cron / 複数プロファイル構成でエンドツーエンドに機能します。
4. 認証プロファイルが設定されていない直接 CLI / dogfood 実行向けの **Env-var フォールバック**。ランタイムは、出荷済みの `github-copilot` プロバイダー（`extensions/github-copilot/auth.ts`）と文書化された Copilot SDK セットアップを反映して、次の変数を優先順に確認します。
   1. `OPENCLAW_GITHUB_TOKEN` -- ハーネス固有のオーバーライド。システム全体の `gh` / Copilot CLI 設定に影響を与えずに OpenClaw ハーネス用のトークンを固定するには、これを設定します。
   2. `COPILOT_GITHUB_TOKEN` -- 標準の Copilot SDK / CLI env var。
   3. `GH_TOKEN` -- 標準の `gh` CLI env var（既存の `github-copilot` プロバイダーの優先順位と一致）。
   4. `GITHUB_TOKEN` -- 汎用 GitHub トークンフォールバック。

   最初の空でない値が採用されます。空文字列は存在しないものとして扱われます。合成されるプールプロファイル id は `env:<NAME>` で、profileVersion はトークンの非可逆 sha256 フィンガープリントであるため、env 値をローテーションするとクライアントプールがきれいに無効化されます。

5. トークンシグナルが利用できない場合の **デフォルト `useLoggedInUser`**。

各エージェントには専用の `copilotHome` が割り当てられるため、Copilot CLI トークン、セッション、設定が同じマシン上のエージェント間で漏れません。ホストがハーネスにエージェントディレクトリを渡す場合、デフォルトは `<agentDir>/copilot`（同じディレクトリ内の OpenClaw の `models.json` / `auth-profiles.json` から SDK 状態を分離）です。それ以外の場合は `~/.openclaw/agents/<agentId>/copilot` です。カスタム場所（たとえば、マイグレーション用の共有マウント）が必要な場合は、試行入力で `copilotHome: <path>` を指定して上書きします。

ライブハーネステストで直接トークンが必要な場合は `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` を使用します。共有ライブテストセットアップは、実際の認証プロファイルを分離されたテストホームにステージングした後、意図的に `COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、`GITHUB_TOKEN` を消去します。そのため、専用のライブテスト変数経由で `gh auth token` 値を渡すと、無関係なスイートにトークンを公開せずに誤ったスキップを避けられます。

## 設定サーフェス

ハーネスは、試行ごとの入力（`runCopilotAttempt({...})`）と、`extensions/copilot/src/` 内の小さな env デフォルト群から設定を読み取ります。

- `copilotHome` — エージェントごとの CLI 状態ディレクトリ（デフォルトは上記に記載）。
- `model` — 文字列、または `{ provider, id, api?, baseUrl?, headers?, authHeader? }`。省略時、OpenClaw はエージェントの通常のモデル選択を使用し、ハーネスは解決されたプロバイダーがサポート対象であることを検証します。
- `reasoningEffort` — `"low" | "medium" | "high" | "xhigh"`。`auto-reply/thinking.ts` での OpenClaw の `ThinkLevel` / `ReasoningLevel` 解決からマップされます。
- `infiniteSessionConfig` — `harness.compact` によって駆動される SDK `infiniteSessions` ブロックの任意の上書き。デフォルトはそのままで安全です。
- `hooksConfig` — ツール / MCP、ユーザープロンプト、セッション、エラーコールバック用の任意のネイティブ Copilot SDK `SessionHooks` 互換設定。OpenClaw のポータブルライフサイクルフックとは別です。
- `permissionPolicy` — 組み込み SDK ツール種別（`shell`、`write`、`read`、`url`、`mcp`、`memory`、`hook`）に使用される SDK の `onPermissionRequest` ハンドラーの任意の上書き。安全網としてデフォルトは `rejectAllPolicy` です。実際には、ブリッジされたすべての OpenClaw ツールが `overridesBuiltInTool: true` および `skipPermission: true` で登録されるため、SDK がそれらの種別を呼び出すことはなく、ツール呼び出しの 100% が OpenClaw のラップされた `execute()` を通ります。[権限と ask_user](#permissions-and-ask_user) を参照してください。
- `enableSessionTelemetry` — 任意の SDK セッションテレメトリフラグ。

OpenClaw プラグインフックには、Copilot 固有の試行設定は不要です。ハーネスは標準ハーネスヘルパーを通じて、`before_prompt_build`（および従来の `before_agent_start` 互換フック）、`llm_input`、`llm_output`、`agent_end` を実行します。成功した SDK Compaction では、`before_compaction` と `after_compaction` も実行されます。ブリッジされた OpenClaw ツールは引き続き `before_tool_call` を実行し、`after_tool_call` を報告します。`hooksConfig` は、ポータブルな同等機能がないネイティブ SDK 専用コールバックのために残ります。

OpenClaw の他の部分がこれらのフィールドについて知る必要はありません。他のプラグイン、チャネル、コアコードは、標準の `AgentHarnessAttemptParams` / `AgentHarnessAttemptResult` 形状だけを見ます。

## Compaction

`harness.compact` が実行されると、Copilot SDK ハーネスは次を行います。

1. 保留中の作業を継続せずに、追跡対象の SDK セッションを再開します。
2. SDK のセッションスコープの履歴 Compaction RPC を呼び出します。
3. ワークスペース配下に互換性マーカーファイルを書き込まずに、SDK Compaction 結果を返します。

OpenClaw 側のトランスクリプトミラー（下記参照）は Compaction 後のメッセージを引き続き受け取るため、ユーザー向けのチャット履歴は一貫したままです。

## トランスクリプトミラーリング

`runCopilotAttempt` は、各ターンのミラー可能なメッセージを `extensions/copilot/src/dual-write-transcripts.ts` 経由で OpenClaw 監査トランスクリプトに二重書き込みします。ミラーはセッションごとのスコープ（`copilot:${sessionId}`）で、メッセージごとの ID（`${role}:${sha256_16(role,content)}`）を使用します。そのため、過去ターンのエントリが再送信されても既存のオンディスクキーと衝突し、重複しません。

ミラーは、トランスクリプト書き込み失敗が試行を失敗させないよう、2 層の失敗封じ込めでラップされています。内部のベストエフォートラッパーと、試行レベルの防御的な `.catch(...)` です。失敗はログに記録されますが、表面化しません。

## 横質問 (`/btw`)

`/btw` はこのハーネスでは**ネイティブ**ではありません。`createCopilotAgentHarness()`
は意図的に `harness.runSideQuestion` を未定義のままにするため、OpenClaw の `/btw`
ディスパッチャー（`src/agents/btw.ts`）は、すべての非 Codex ランタイムで使うのと同じツリー内 PI フォールバック
パスにフォールスルーします。設定済みのモデルプロバイダーが
短いサイド質問プロンプトで直接呼び出され、`streamSimple` 経由でストリーミングされます
（CLI セッションなし、追加のプールスロットなし）。

これにより、Copilot CLI セッションはエージェントのメインターンループ用に確保され、
`/btw` の動作は他の PI バックエンドのランタイムと同一に保たれます。この契約は
[`extensions/copilot/harness.test.ts`](https://github.com/openclaw/openclaw/blob/main/extensions/copilot/harness.test.ts)
の `describe("runSideQuestion")` でアサートされています。

## Doctor

`extensions/copilot/doctor-contract-api.ts` は
`src/plugins/doctor-contract-registry.ts` によって自動ロードされます。これは次を提供します。

- 空の `legacyConfigRules`（MVP では廃止フィールドなし）。
- no-op の `normalizeCompatibilityConfig`（将来のフィールド廃止に備えて、
  安定したツリー内の置き場所を確保するため）。
- プロバイダー `github-copilot`、ランタイム `copilot`、CLI セッションキー `copilot`、認証プロファイル
  プレフィックス `github-copilot:` を主張する 1 つの `sessionRouteStateOwners` エントリ。

## 制限事項

- ハーネスは `github-copilot` と、所有者のいないカスタム BYOK プロバイダー ID を主張します。
  マニフェスト所有のネイティブプロバイダー ID は、`agentRuntime.id` が `copilot` に強制されても、
  所有元のランタイムに残ります。
- ハーネスは TUI を提供しません。PI の TUI は影響を受けず、ピアサーフェスを持たない
  あらゆるランタイムのフォールバックとして残ります。
- エージェントが `copilot` に切り替わるとき、PI セッション状態は移行されません。
  選択は試行ごとです。既存の PI セッションは有効なままです。
- `ask_user` は Codex ハーネスと同じ OpenClaw のプロンプトおよび返信パスを使います。
  Copilot SDK がユーザー入力を求めると、OpenClaw はアクティブなチャンネル/TUI に
  ブロッキングプロンプトを投稿し、次にキューに入ったユーザーメッセージが SDK リクエストを解決します。

## 権限と ask_user

ブリッジされた OpenClaw ツールの権限適用は、SDK の `onPermissionRequest` コールバック経由ではなく、
**ツールラッパーの内部**で行われます。PI が使うものと同じ `wrapToolWithBeforeToolCallHook`
（`src/agents/pi-tools.before-tool-call.ts`）が、
`createOpenClawCodingTools` によってすべてのコーディングツールに適用されます。ループ検出、
信頼済み Plugin ポリシー、before-tool-call フック、Gateway 経由の二段階 Plugin
承認（`plugin.approval.request`）はすべて、ネイティブ PI 試行とまったく同じコードパスで実行されます。

そのラッパーが判断を所有できるように、`convertOpenClawToolToSdkTool` が返す SDK Tool には次が設定されます。

- `overridesBuiltInTool: true` — 同名の Copilot CLI 組み込み
  ツール（edit、read、write、bash、…）を置き換え、すべてのツール
  呼び出しを OpenClaw に戻します。
- `skipPermission: true` — ツール呼び出し前に
  `onPermissionRequest({kind: "custom-tool"})` を発火しないよう SDK に伝えます。
  ラップされた `execute()` は、よりリッチな OpenClaw ポリシーチェックを
  内部で実行します。SDK レベルのプロンプトは、（すべて許可する場合）OpenClaw の
  適用を短絡するか、（すべて拒否する場合）すべてのツール呼び出しをブロックします。
  どちらも PI との同等性に一致しません。

ツリー内の codex ハーネスも同じ分割を使います。ブリッジされた OpenClaw ツールは
ラップされ（`extensions/codex/src/app-server/dynamic-tools.ts`）、
codex-app-server **自身**のネイティブ承認種別
（`item/commandExecution/requestApproval`、
`item/fileChange/requestApproval`、
`item/permissions/requestApproval`）は
`plugin.approval.request`
（`extensions/codex/src/app-server/approval-bridge.ts`）経由でルーティングされます。Copilot SDK
での同等物、つまり `onPermissionRequest` に到達する非 `custom-tool`
種別すべてに対する fail-closed の `rejectAllPolicy` は、同じ安全網です。
実際には `overridesBuiltInTool: true` がすべての組み込みを置き換えるため、発火しません。

ラップ済みツール層が PI と同等のポリシー判断を行えるように、ハーネスは完全な PI の試行ツールコンテキストを
`createOpenClawCodingTools` に転送します。ID（`senderIsOwner`、
`memberRoleIds`、`ownerOnlyToolAllowlist`、…）、チャンネル/ルーティング
（`groupId`、`currentChannelId`、`replyToMode`、message-tool トグル）、
認証（`authProfileStore`）、実行 ID
（`sandboxSessionKey` から派生した `sessionKey`/`runSessionKey`、
`runId`）、モデルコンテキスト（`modelApi`、`modelContextWindowTokens`、
`modelCompat`、`modelHasVision`）、実行フック（`onToolOutcome`、
`onYield`）です。これらのフィールドがないと、owner-only allowlist は黙って
deny-by-default として動作し、Plugin 信頼ポリシーは正しいスコープに解決できず、
`session_status: "current"` は古いサンドボックスキーに解決されます。ブリッジビルダーは
`extensions/copilot/src/tool-bridge.ts` にあり、
`src/agents/pi-embedded-runner/run/attempt.ts:1029-1117` の PI の
権威ある呼び出しを反映しています。`runAttempt` はすでに共有の
`resolveSandboxContext` シームを通じてサンドボックスコンテキストを解決し、
有効な作業ディレクトリを SDK に渡し、`sandbox` とサブエージェント生成ワークスペースを
ツールブリッジへ転送します。ブリッジはまた、SDK 境界で適用できる
境界付きツール構築制御、つまり `includeCoreTools`、ランタイムツール allowlist、
`toolConstructionPlan` も転送します。

ブリッジは PI との同等性のために、
`openclaw/plugin-sdk/agent-harness-tool-runtime` の共有ハーネスツールサーフェスヘルパーも使います。
tool-search が有効な場合、SDK にはすべての OpenClaw ツールスキーマの代わりに、
コンパクトな制御ツールと非表示のカタログ実行器が見えます。code mode が有効な場合、
ヘルパーは他のエージェントハーネスで使われるものと同じ code-mode 制御サーフェスと
カタログライフサイクルを構築します。ローカルモデル向けの軽量デフォルト、
ランタイム互換のスキーマフィルタリング、ディレクトリハイドレーション、カタログクリーンアップは
すべて共有ヘルパー内に留まり、Copilot と Codex 隣接のハーネスが乖離しないようにします。

### セッションレベルの GitHub トークン

Copilot SDK の契約は、**クライアントレベル**の GitHub
トークン（`CopilotClientOptions.gitHubToken`、CLI プロセス自体の認証に使用）と、
**セッションレベル**のトークン（`SessionConfig.gitHubToken`、
そのセッションのコンテンツ除外、モデルルーティング、クォータを決定し、
`createSession` と `resumeSession` の両方で尊重される）を区別します。ハーネスは
`resolveCopilotAuth` 経由で認証を一度解決し、認証モードが
`gitHubToken`（明示的な `auth.gitHubToken`、または設定済みの `github-copilot`
認証プロファイルから契約に基づき解決された `resolvedApiKey`）の場合、両方のフィールドを設定します。
解決されたモードが `useLoggedInUser` の場合、SDK がログイン済み ID から
ID を導出し続けるように、セッションレベルのフィールドは省略されます。

`ask_user` は `SessionConfig.onUserInputRequest` を使います。ブリッジは
固定選択肢リクエストに対して選択肢のインデックスまたはラベルを受け入れ、
SDK リクエストが許可する場合は自由形式の回答を受け入れ、
OpenClaw の試行が中止されたときは保留中のリクエストをキャンセルします。

## 関連

- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [エージェントハーネス Plugin（SDK リファレンス）](/ja-JP/plugins/sdk-agent-harness)
