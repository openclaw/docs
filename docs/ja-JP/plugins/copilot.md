---
read_when:
    - エージェントに GitHub Copilot SDK ハーネスを使用する場合
    - '`copilot` ランタイムの設定例が必要です'
    - サブスクリプション版 Copilot（github / openclaw / copilot）にエージェントを接続し、Copilot CLI 経由で実行したいと考えています
summary: 外部の GitHub Copilot SDK ハーネスを通じて OpenClaw の組み込みエージェントターンを実行する
title: Copilot SDK ハーネス
x-i18n:
    generated_at: "2026-07-16T11:51:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb4a0a3bf1123c1c3cbbed2630476afb5df73bc61d47e8a3987a5d0d7f01f83a
    source_path: plugins/copilot.md
    workflow: 16
---

外部の `@openclaw/copilot` plugin は、OpenClaw の組み込みハーネスの代わりに GitHub Copilot CLI（`@github/copilot-sdk`）を介して、埋め込みサブスクリプションの Copilot
エージェントターンを実行します。Copilot CLI セッションは、ネイティブツールの実行、ネイティブ Compaction（`infiniteSessions`）、
および `copilotHome` 配下の CLI 管理スレッド状態という低レベルの
エージェントループを所有します。OpenClaw は引き続き、チャット
チャネル、セッションファイル、モデル選択、動的ツール（ブリッジ経由）、承認、
メディア配信、表示されるトランスクリプトのミラー、`/btw` の補足質問（
[補足質問（`/btw`）](#side-questions-btw)を参照）、および `openclaw doctor` を所有します。

モデル、プロバイダー、ランタイムのより広範な役割分担については、
[エージェントランタイム](/ja-JP/concepts/agent-runtimes)から始めてください。

## 要件

- `@openclaw/copilot` plugin がインストールされた OpenClaw。
- 設定で `plugins.allow` を使用している場合は、`copilot`（plugin が
  宣言するマニフェスト ID）を含めます。npm パッケージ名
  `@openclaw/copilot` の許可リストエントリは一致せず、`agentRuntime.id: "copilot"` が設定されていても
  plugin はブロックされたままになります。
- Copilot CLI を駆動できる GitHub Copilot サブスクリプション、または
  ヘッドレス実行や Cron 実行用の `gitHubToken` 環境変数／認証プロファイルエントリ。
- 書き込み可能な `copilotHome` ディレクトリ。OpenClaw がエージェントディレクトリを
  提供する場合はデフォルトで `<agentDir>/copilot`、それ以外は
  `~/.openclaw/agents/<agentId>/copilot` です。

`openclaw doctor` は、セッション状態の所有権と将来の設定移行のために、
plugin の [doctor コントラクト](#doctor)を実行します。Copilot CLI 環境の
検査は行いません。

## インストール

Copilot ランタイムは外部 plugin として提供されるため、コアの `openclaw`
パッケージには `@github/copilot-sdk` も、そのプラットフォーム固有の
`@github/copilot-<platform>-<arch>` CLI バイナリも含まれません（合計約 260 MB）。
このランタイムを使用するエージェントにのみインストールしてください。

```bash
openclaw plugins install @openclaw/copilot
```

セットアップウィザードは、初めて `github-copilot/*` モデルを選択し、**かつ**
設定で `agentRuntime: { id: "copilot" }` を介してそのモデル（またはプロバイダー）を
Copilot ランタイムにルーティングしている場合に、plugin を自動的にインストールします。
[クイックスタート](#quickstart)を参照してください。この明示的な選択がない場合、OpenClaw は組み込みの
GitHub Copilot プロバイダーを使用し、この plugin をインストールしません。

ランタイムは次の順序で SDK を解決します。

1. インストール済みの `@openclaw/copilot`
   パッケージに含まれる `import("@github/copilot-sdk")`。
2. フォールバックディレクトリ `~/.openclaw/npm-runtime/copilot/`（従来のオンデマンド
   インストール先）。

SDK が見つからない場合は、コード `COPILOT_SDK_MISSING` と上記の再インストールコマンドを含む
単一のエラーが表示されます。

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

単一のモデルエントリに `agentRuntime.id` を設定すると、そのモデルのみがハーネスを経由します。
プロバイダーに設定すると、そのプロバイダー配下のすべてのモデルが経由します。

`github-copilot/auto` は移植可能な出発点です。名前付きの Copilot モデルは
アカウントおよび組織のポリシーに依存します。固定する前に、認証済みの
Copilot CLI が実際にそのモデルを公開していることを確認してください。

## サポート対象プロバイダー

ハーネスは、`extensions/github-copilot` が所有する正規の `github-copilot` プロバイダーに加えて、
モデルの `baseUrl` が空でなく、次のいずれかの `api` 形式である場合に、
カスタム `models.providers` エントリをサポートします。

- `anthropic-messages`
- `azure-openai-responses`
- `ollama`（OpenAI 互換 completions）
- `openai-completions`
- `openai-responses`

ネイティブプロバイダー ID（`openai`、`anthropic`、`google`、`ollama`）は、
引き続きそれぞれのネイティブランタイムが所有します。代わりに Copilot BYOK を介してエンドポイントを
ルーティングするには、別のカスタムプロバイダー ID を使用してください。

Copilot BYOK エンドポイントは、公開 HTTPS URL である必要があります。ハーネスは
試行ごとに loopback プロキシを Copilot SDK に提供し、その後プロバイダーのトラフィックを
OpenClaw の保護された fetch 経路に転送します。これにより、DNS ピンニングと SSRF ポリシーは
引き続き OpenClaw が所有します。ローカルの Ollama、LM Studio、または LAN モデルサーバーには、
ネイティブの OpenClaw ランタイムを使用してください。

## BYOK

Copilot BYOK は、SDK のセッションレベルのカスタムプロバイダーコントラクトを使用します。OpenClaw は
解決済みのモデルエンドポイント、API キー、ベアラートークンモード、ヘッダー、モデル
ID、およびコンテキスト／出力上限を渡します。プロバイダーのトランスポートロジックはコアではなく
SDK に残ります。

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

BYOK セッションは、サブスクリプションセッション、および他の
BYOK エンドポイントや認証情報とは別にキー付けされます。キー、ヘッダー、モデル、またはエンドポイントを
ローテーションすると、互換性のない状態を再開する代わりに、新しい Copilot SDK セッションが開始されます。

## 認証

`runCopilotAttempt` 中にエージェントごとに適用される優先順位は次のとおりです。

1. 試行入力の **明示的な `useLoggedInUser: true`** — エージェントの `copilotHome`
   配下で、Copilot CLI にログインしているユーザーを使用します。
2. 試行入力の **明示的な `gitHubToken`**（`profileId` +
   `profileVersion` が必要）。認証プロファイルの解決を
   バイパスする必要がある直接の CLI 呼び出しおよびテスト用です。
3. **コントラクトによって解決された `resolvedApiKey` + `authProfileId`** — 本番環境の
   主要経路です。コアはハーネスを呼び出す前に、エージェントに設定された `github-copilot` 認証
   プロファイル（`src/infra/provider-usage.auth.ts:resolveProviderAuths`）を解決します。そのため、`github-copilot:<profile>` 認証プロファイルは
   環境変数なしでも、ヘッドレス、Cron、または複数プロファイルの構成で
   エンドツーエンドに機能します。
4. **環境変数のフォールバック**。次の順序で確認します（最初の空でない値が使用され、
   空文字列は未指定として扱われます。`extensions/github-copilot/auth.ts` にある、リリース済みの `github-copilot`
   プロバイダーの優先順位を反映しています）。
   1. `OPENCLAW_GITHUB_TOKEN` — ハーネス固有のオーバーライド。システム全体の `gh` /
      Copilot CLI 設定に影響を与えずに、OpenClaw ハーネス用の
      トークンを固定できます。
   2. `COPILOT_GITHUB_TOKEN` — 標準の Copilot SDK / CLI 環境変数。
   3. `GH_TOKEN` — 標準の `gh` CLI 環境変数。
   4. `GITHUB_TOKEN` — 汎用 GitHub トークンのフォールバック。

   合成されたプールプロファイル ID は `env:<NAME>` です。プロファイルバージョンは
   トークンの不可逆な sha256 フィンガープリントであるため、環境変数の値をローテーションすると
   クライアントプールが確実に無効化されます。

5. トークンを示す情報がない場合の **デフォルトの `useLoggedInUser`**。

各エージェントには固有の `copilotHome` が割り当てられるため、同じマシン上のエージェント間で
Copilot CLI のトークン、セッション、設定が漏れることはありません。デフォルトは
`<agentDir>/copilot`（SDK の状態を OpenClaw の
`models.json` / `auth-profiles.json` と同じディレクトリに置かないため）です。
エージェントディレクトリが指定されていない場合は `~/.openclaw/agents/<agentId>/copilot` です。
カスタムの場所（たとえば、移行用の共有マウント）を使用するには、試行入力の
`copilotHome: <path>` でオーバーライドします。

ライブハーネステストでは、直接トークンとして `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` を使用します。
共有ライブテストのセットアップは、実際の認証プロファイルを分離されたテスト用ホームに配置した後、
`COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、および `GITHUB_TOKEN` を消去します。
そのため、専用変数を介して渡された `gh auth token` の値により、無関係なスイートに漏洩させることなく
誤ったスキップを回避できます。

## 設定項目

ハーネスは、試行ごとの入力（`runCopilotAttempt({...})`）に加え、
`extensions/copilot/src/` 内の少数の環境変数デフォルトから設定を読み取ります。

| フィールド                    | 用途                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | エージェントごとの CLI 状態ディレクトリ（デフォルトは前述のとおり）。                                                                                                                                                                                                                                                 |
| `model`                  | 文字列または `{ provider, id, api?, baseUrl?, headers?, authHeader? }`。エージェントの通常のモデル選択を使用する場合は省略します。ハーネスは、解決されたプロバイダーがサポート対象であることを検証します。                                                                                                                   |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`。`auto-reply/thinking.ts` にある OpenClaw の `ThinkLevel` / `ReasoningLevel` の解決からマッピングされます。                                                                                                                                                          |
| `infiniteSessionConfig`  | `harness.compact` によって駆動される SDK の `infiniteSessions` ブロックに対する任意のオーバーライド。そのままにしておいても安全です。                                                                                                                                                                                        |
| `hooksConfig`            | ツール／MCP、ユーザープロンプト、セッション、およびエラーコールバック用の、任意のネイティブ Copilot SDK `SessionHooks` 設定。OpenClaw の移植可能なライフサイクルフックとは別です。                                                                                                                                   |
| `permissionPolicy`       | SDK 組み込みツール種別（`shell`、`write`、`read`、`url`、`mcp`、`memory`、`hook`）用の SDK `onPermissionRequest` ハンドラーに対する任意のオーバーライド。安全策としてデフォルトは `rejectAllPolicy` です。実際には決して発火しない理由については、[権限と ask_user](#permissions-and-ask_user)を参照してください。 |
| `enableSessionTelemetry` | 任意の SDK セッションテレメトリフラグ。                                                                                                                                                                                                                                                            |

OpenClaw plugin フックに Copilot 固有の試行設定は不要です。ハーネスは
標準のハーネスヘルパーを介して、`before_prompt_build`（および従来の `before_agent_start`
互換性フック）、`llm_input`、`llm_output`、および `agent_end` を実行します。
SDK の Compaction が成功した場合は、`before_compaction` と `after_compaction` も実行されます。
ブリッジされた OpenClaw ツールは `before_tool_call` を実行し、`after_tool_call` を報告します。
`hooksConfig` は、移植可能な同等機能がないネイティブ SDK 専用コールバック用として残ります。

OpenClaw 内の他の部分は、これらのフィールドを認識する必要はありません。他の plugin、
チャネル、およびコアコードから見えるのは、標準の `AgentHarnessAttemptParams` /
`AgentHarnessAttemptResult` 形式だけです。

## Compaction

`harness.compact` の実行時、Copilot SDK ハーネスは次を行います。

1. 保留中の作業を続行せずに、追跡対象の SDK セッションを再開します。
2. SDK のセッションスコープの履歴 Compaction RPC を呼び出します。
3. ワークスペース配下に互換性マーカーファイルを書き込まずに、
   SDK の Compaction 結果を返します。

OpenClaw 側のトランスクリプトミラー（後述）は Compaction 後のメッセージも
引き続き受信するため、ユーザー向けのチャット履歴は一貫性を保ちます。

## トランスクリプトのミラーリング

`runCopilotAttempt` は各ターンのミラー可能なメッセージを、
`extensions/copilot/src/dual-write-transcripts.ts` を介して OpenClaw の監査トランスクリプトへ
二重書き込みします。ミラーのスコープはセッション単位
（`copilot:${sessionId}`）で、キーはメッセージ単位
（`${role}:${sha256_16(role,content)}`）であるため、再送出された以前のターンのエントリは
重複せず、ディスク上の既存キーと衝突します。

トランスクリプトの書き込み失敗によって試行が失敗することがないよう、
ミラーは 2 層の障害封じ込めでラップされています。内部のベストエフォート型
ラッパーに加え、試行レベルで多層防御の `.catch(...)` が適用されます。障害はログに
記録され、表面化しません。

## 補助的な質問（`/btw`）

`/btw` はこのハーネスではネイティブでは**ありません**。`createCopilotAgentHarness()` は
意図的に `harness.runSideQuestion` を未定義のままにするため
（`extensions/copilot/harness.test.ts`、`describe("runSideQuestion")` でアサート）、
OpenClaw の `/btw` ディスパッチャー（`src/agents/btw.ts`）は、
Codex 以外のすべてのランタイムで使用するものと同じパスへフォールスルーします。設定されたモデルプロバイダーが
短い補助質問プロンプトで直接呼び出され、その応答が
`streamSimple` を介してストリーミングされます（CLI セッションも追加のプールスロットも使用しません）。

これにより、Copilot CLI セッションはエージェントのメインターンループ用に確保され、
`/btw` の動作は Codex 以外の他のランタイムと同一に保たれます。

## Doctor

`extensions/copilot/doctor-contract-api.ts` は
`src/plugins/doctor-contract-registry.ts` によって自動的に読み込まれます。次の項目を提供します。

- 空の `legacyConfigRules`（廃止済みフィールドはまだありません）。
- 何もしない `normalizeCompatibilityConfig`（今後のフィールド廃止時に
  ツリー内の安定した配置先を確保するために維持）。
- `sessionRouteStateOwners` エントリ 1 件：プロバイダー `github-copilot`、ランタイム
  `copilot`、CLI セッションキー `copilot`、認証プロファイルのプレフィックス `github-copilot:`。

## 制限事項

- このハーネスは `github-copilot` と、所有者のないカスタム BYOK プロバイダー ID を対象とします。
  マニフェスト所有のネイティブプロバイダー ID は、
  `agentRuntime.id` が `copilot` に強制された場合でも、それを所有するランタイムに残ります。
- TUI サーフェスはありません。ピアサーフェスを持たないランタイムでは、PI の TUI が引き続き
  フォールバックになります。
- エージェントが `copilot` に切り替えても、PI のセッション状態は移行されません。
  選択は試行単位です。既存の PI セッションは引き続き有効です。
- `ask_user` は Codex
  ハーネスと同じ OpenClaw のプロンプト応答パスを使用します。Copilot SDK がユーザー入力を要求すると、OpenClaw は
  アクティブなチャンネルまたは TUI にブロッキングプロンプトを投稿し、次にキューへ追加されたユーザー
  メッセージによって SDK のリクエストが解決されます。

## 権限と ask_user

ブリッジされた OpenClaw ツールの権限適用は、SDK の
`onPermissionRequest` コールバック経由ではなく、**ツールラッパー内**で行われます。PI が使用するものと同じ
`wrapToolWithBeforeToolCallHook`
（`src/agents/agent-tools.before-tool-call.ts`）が
`createOpenClawCodingTools` によってすべてのコーディングツールに適用されます。ループ検出、信頼済み
Plugin ポリシー、ツール呼び出し前フック、および Gateway
（`plugin.approval.request`）を介した 2 段階の Plugin 承認は、すべてネイティブ PI 試行とまったく同じコード
パスを通ります。

Copilot ツールブリッジによって返される各 SDK ツールには、次のマークが付けられます。

- `overridesBuiltInTool: true` — 同名の Copilot CLI 組み込みツール
  （edit、read、write、bash など）を置き換え、すべてのツール呼び出しを OpenClaw に戻します。
- `skipPermission: true` — ツールを呼び出す前に
  `onPermissionRequest({kind: "custom-tool"})` を発火しないよう SDK に指示します。
  ラップされた `execute()` が、より高度な OpenClaw ポリシーチェックをすでに実行します。SDK レベルのプロンプトを使用すると、
  OpenClaw の適用を迂回する（すべて許可）か、すべてのツール呼び出しをブロックする
  （すべて拒否）ことになり、どちらも PI との同等性に一致しません。

ツリー内の Codex ハーネスも同じ分離方式を使用します。ブリッジされた OpenClaw ツールは
ラップされ（`extensions/codex/src/app-server/dynamic-tools.ts`）、
codex-app-server 自体のネイティブ承認種別
（`item/commandExecution/requestApproval`、`item/fileChange/requestApproval`、
`item/permissions/requestApproval`）は `plugin.approval.request`
（`extensions/codex/src/app-server/approval-bridge.ts`）を経由します。Copilot SDK における
同等の仕組み、つまり `onPermissionRequest` に到達した非 `custom-tool` 種別に対してフェイルクローズする `rejectAllPolicy` は、
同じ安全網です。`overridesBuiltInTool: true` がすべての
組み込みツールを置き換えるため、実際には発火しません。

ラップされたツール層が PI と同等のポリシー判断を行えるように、ハーネスは
PI の試行ツールコンテキスト全体を
`createOpenClawCodingTools` に転送します。これには、アイデンティティ（`senderIsOwner`、`memberRoleIds`、
`ownerOnlyToolAllowlist` など）、チャンネルおよびルーティング（`groupId`、
`currentChannelId`、`replyToMode`、メッセージツールの切り替え）、認証
（`authProfileStore`）、実行アイデンティティ（`sandboxSessionKey`、`runId` から派生する
`sessionKey` / `runSessionKey`）、モデルコンテキスト（`modelApi`、
`modelContextWindowTokens`、`modelCompat`、`modelHasVision`）、実行フック
（`onToolOutcome`、`onYield`）が含まれます。これらのフィールドがない場合、所有者限定の許可リストは
デフォルトで暗黙的に拒否され、Plugin 信頼ポリシーは正しい
スコープを解決できず、`session_status: "current"` は古いサンドボックスキーに解決されます。
ブリッジビルダーは `extensions/copilot/src/tool-bridge.ts` であり、
`src/agents/embedded-agent-runner/run/attempt.ts:1262` にある PI の正式な呼び出しを反映しています。
`runAttempt` は共有
`resolveSandboxContext` シームを介してサンドボックスコンテキストを解決し、SDK に有効な作業ディレクトリを渡し、
`sandbox` とサブエージェント生成ワークスペースをツール
ブリッジへ転送します。また、ブリッジは SDK 境界で適用可能な制限付きツール構築制御、
すなわち `includeCoreTools`、ランタイムツールの
許可リスト、`toolConstructionPlan` も転送します。

ブリッジは PI との同等性を確保するため、
`openclaw/plugin-sdk/agent-harness-tool-runtime` の共有ハーネスツールサーフェスヘルパーも使用します。
ツール検索が有効な場合、SDK には OpenClaw のすべてのツールスキーマではなく、コンパクトな制御ツールと非表示の
カタログエグゼキューターが提示されます。コードモードが有効な場合、このヘルパーは、他のエージェントハーネスで使用されるものと同じ
コードモード制御サーフェスとカタログライフサイクルを構築します。ローカルモデル向けの軽量なデフォルト、
ランタイム互換のスキーマフィルタリング、ディレクトリのハイドレーション、カタログの
クリーンアップはすべて共有ヘルパー内に維持されるため、Copilot と Codex 系
ハーネスの動作が乖離しません。

### セッションレベルの GitHub トークン

Copilot SDK の契約では、**クライアントレベル**の GitHub トークン
（`CopilotClientOptions.gitHubToken`、CLI プロセス自体を認証）と、
**セッションレベル**のトークン（`SessionConfig.gitHubToken`、そのセッションの
コンテンツ除外、モデルルーティング、クォータを決定し、`createSession` と `resumeSession` の両方で適用）
を区別します。ハーネスは `resolveCopilotAuth` を介して認証を一度解決し、
認証モードが `gitHubToken` の場合は両方のフィールドを設定します
（明示的な `auth.gitHubToken`、または設定された `github-copilot` 認証プロファイルから契約に基づいて解決された `resolvedApiKey`）。
解決されたモードが
`useLoggedInUser` の場合、セッションレベルのフィールドは省略されるため、SDK はログイン済みアイデンティティから
引き続きアイデンティティを導出します。

`ask_user` は `SessionConfig.onUserInputRequest` を使用します。ブリッジは固定選択式リクエストに対して、選択肢の
インデックスまたはラベルを受け付け、SDK リクエストで許可されている場合は自由記述の回答を受け付けます。また、OpenClaw の
試行が中止された場合は、保留中のリクエストをキャンセルします。

## 関連項目

- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [エージェントハーネス Plugin（SDK リファレンス）](/ja-JP/plugins/sdk-agent-harness)
