---
read_when:
    - エージェントに GitHub Copilot SDK ハーネスを使用する場合
    - '`copilot` ランタイムの設定例が必要です'
    - エージェントをサブスクリプション版 Copilot（github / openclaw / copilot）に接続し、Copilot CLI 経由で実行したい場合
summary: 外部の GitHub Copilot SDK ハーネスを介して OpenClaw の組み込みエージェントターンを実行する
title: Copilot SDK ハーネス
x-i18n:
    generated_at: "2026-07-12T14:44:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4270a9b75a038540af6a8306f3e80c87d6085dde29d128adf85b930713209fc5
    source_path: plugins/copilot.md
    workflow: 16
---

外部の `@openclaw/copilot` Plugin は、OpenClaw の組み込みハーネスの代わりに GitHub Copilot CLI（`@github/copilot-sdk`）を使用して、サブスクリプションに組み込まれた Copilot エージェントターンを実行します。Copilot CLI セッションは、低レベルのエージェントループ（ネイティブツールの実行、ネイティブ Compaction（`infiniteSessions`）、および `copilotHome` 配下の CLI 管理スレッド状態）を所有します。OpenClaw は引き続き、チャットチャネル、セッションファイル、モデル選択、動的ツール（ブリッジ経由）、承認、メディア配信、表示されるトランスクリプトのミラー、`/btw` による補足質問（[補足質問（`/btw`）](#side-questions-btw)を参照）、および `openclaw doctor` を所有します。

モデル、プロバイダー、ランタイムのより広範な分担については、[エージェントランタイム](/ja-JP/concepts/agent-runtimes)から確認してください。

## 要件

- `@openclaw/copilot` Plugin がインストールされた OpenClaw。
- 設定で `plugins.allow` を使用している場合は、`copilot`（Plugin が宣言するマニフェスト ID）を含めます。npm パッケージ名 `@openclaw/copilot` の許可リストエントリは一致しないため、`agentRuntime.id: "copilot"` が設定されていても Plugin はブロックされたままになります。
- Copilot CLI を実行できる GitHub Copilot サブスクリプション、またはヘッドレス実行や Cron 実行用の `gitHubToken` 環境変数／認証プロファイルエントリ。
- 書き込み可能な `copilotHome` ディレクトリ。OpenClaw がエージェントディレクトリを提供する場合、デフォルトは `<agentDir>/copilot`、それ以外の場合は `~/.openclaw/agents/<agentId>/copilot` です。

`openclaw doctor` は、セッション状態の所有権と将来の設定移行のために Plugin の [doctor コントラクト](#doctor)を実行します。Copilot CLI 環境のプローブは行いません。

## インストール

Copilot ランタイムは外部 Plugin として提供されるため、コアの `openclaw` パッケージには `@github/copilot-sdk` や、プラットフォーム固有の `@github/copilot-<platform>-<arch>` CLI バイナリ（合計約 260 MB）は含まれません。このランタイムを選択するエージェントにのみインストールしてください。

```bash
openclaw plugins install @openclaw/copilot
```

セットアップウィザードは、`github-copilot/*` モデルを初めて選択し、**かつ**設定が `agentRuntime: { id: "copilot" }` によってそのモデル（またはプロバイダー）を Copilot ランタイムへルーティングしている場合に、Plugin を自動的にインストールします。[クイックスタート](#quickstart)を参照してください。このオプトインがない場合、OpenClaw は組み込みの GitHub Copilot プロバイダーを使用し、この Plugin をインストールしません。

ランタイムは次の順序で SDK を解決します。

1. インストール済みの `@openclaw/copilot` パッケージから `import("@github/copilot-sdk")`。
2. フォールバックディレクトリ `~/.openclaw/npm-runtime/copilot/`（従来のオンデマンドインストール先）。

SDK が見つからない場合は、コード `COPILOT_SDK_MISSING` と上記の再インストールコマンドを含む単一のエラーが表示されます。

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

単一のモデルエントリに `agentRuntime.id` を設定すると、そのモデルのみがハーネス経由でルーティングされます。プロバイダーに設定すると、そのプロバイダー配下のすべてのモデルがルーティングされます。

`github-copilot/auto` は移植性のある開始点です。名前付き Copilot モデルは、アカウントおよび組織のポリシーに依存します。固定する前に、認証済みの Copilot CLI が実際にそのモデルを公開していることを確認してください。

## 対応プロバイダー

ハーネスは、正規の `github-copilot` プロバイダー（`extensions/github-copilot` が所有）に加え、モデルの `baseUrl` が空でなく、次のいずれかの `api` 形式を持つ場合に、カスタムの `models.providers` エントリをサポートします。

- `anthropic-messages`
- `azure-openai-responses`
- `ollama`（OpenAI 互換の補完）
- `openai-completions`
- `openai-responses`

ネイティブプロバイダー ID（`openai`、`anthropic`、`google`、`ollama`）は、それぞれのネイティブランタイムが引き続き所有します。代わりに、Copilot BYOK 経由でエンドポイントをルーティングするには、別個のカスタムプロバイダー ID を使用してください。

Copilot BYOK エンドポイントは、公開 HTTPS URL である必要があります。ハーネスは試行ごとに local loopback プロキシを Copilot SDK に提供し、その後、プロバイダーのトラフィックを OpenClaw の保護された fetch パス経由で転送します。これにより、DNS ピンニングと SSRF ポリシーは OpenClaw の所有下に維持されます。ローカルの Ollama、LM Studio、または LAN モデルサーバーには、OpenClaw のネイティブランタイムを使用してください。

## BYOK

Copilot BYOK は、SDK のセッションレベルのカスタムプロバイダーコントラクトを使用します。OpenClaw は、解決済みのモデルエンドポイント、API キー、Bearer トークンモード、ヘッダー、モデル ID、およびコンテキスト／出力制限を渡します。プロバイダーのトランスポートロジックはコアではなく SDK に残ります。

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

BYOK セッションは、サブスクリプションセッションや、他の BYOK エンドポイントまたは認証情報とは別にキー付けされます。キー、ヘッダー、モデル、またはエンドポイントをローテーションすると、互換性のない状態を再開する代わりに、新しい Copilot SDK セッションが開始されます。

## 認証

`runCopilotAttempt` 中にエージェントごとに適用される優先順位は次のとおりです。

1. 試行入力での**明示的な `useLoggedInUser: true`** — エージェントの `copilotHome` 配下にある Copilot CLI のログイン済みユーザーを使用します。
2. 試行入力での**明示的な `gitHubToken`**（`profileId` と `profileVersion` が必要）。認証プロファイルの解決をバイパスする必要がある、直接の CLI 呼び出しとテスト向けです。
3. **コントラクトによって解決された `resolvedApiKey` と `authProfileId`** — 本番環境の主要パスです。コアはハーネスを呼び出す前に、エージェントに設定された `github-copilot` 認証プロファイル（`src/infra/provider-usage.auth.ts:resolveProviderAuths`）を解決します。そのため、`github-copilot:<profile>` 認証プロファイルは、環境変数なしでヘッドレス、Cron、または複数プロファイルの構成においてエンドツーエンドで機能します。
4. **環境変数へのフォールバック**。次の順序で確認されます（最初の空でない値が使用され、空文字列は未指定として扱われます。`extensions/github-copilot/auth.ts` で提供される `github-copilot` プロバイダーの優先順位と同じです）。
   1. `OPENCLAW_GITHUB_TOKEN` — ハーネス固有のオーバーライド。システム全体の `gh`／Copilot CLI 設定に影響を与えずに、OpenClaw ハーネス用のトークンを固定できます。
   2. `COPILOT_GITHUB_TOKEN` — 標準の Copilot SDK／CLI 環境変数。
   3. `GH_TOKEN` — 標準の `gh` CLI 環境変数。
   4. `GITHUB_TOKEN` — 汎用の GitHub トークンフォールバック。

   合成されるプールプロファイル ID は `env:<NAME>` です。プロファイルバージョンはトークンの不可逆な sha256 フィンガープリントであるため、環境変数の値をローテーションすると、クライアントプールが確実に無効化されます。

5. トークンのシグナルが利用できない場合は、**デフォルトの `useLoggedInUser`**。

各エージェントは独自の `copilotHome` を持つため、Copilot CLI のトークン、セッション、設定が同じマシン上のエージェント間で漏洩することはありません。デフォルトは `<agentDir>/copilot`（SDK の状態を OpenClaw の `models.json`／`auth-profiles.json` と同じディレクトリに置かないようにします）、またはエージェントディレクトリが指定されていない場合は `~/.openclaw/agents/<agentId>/copilot` です。カスタムの場所（たとえば、移行用の共有マウント）を使用するには、試行入力で `copilotHome: <path>` を指定してオーバーライドします。

ライブハーネステストは、直接トークンとして `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` を使用します。共有ライブテストセットアップは、実際の認証プロファイルを隔離されたテストホームに配置した後、`COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、および `GITHUB_TOKEN` を消去します。そのため、専用変数を介して渡された `gh auth token` の値は、無関係なスイートに漏洩することなく、誤ったスキップを回避できます。

## 設定サーフェス

ハーネスは、試行ごとの入力（`runCopilotAttempt({...})`）と、`extensions/copilot/src/` 内の少数の環境変数デフォルトから設定を読み取ります。

| フィールド                   | 用途                                                                                                                                                                                                                                                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | エージェントごとの CLI 状態ディレクトリ（デフォルトは上記のとおり）。                                                                                                                                                                                                                                                                        |
| `model`                  | 文字列または `{ provider, id, api?, baseUrl?, headers?, authHeader? }`。省略すると、エージェントの通常のモデル選択が使用されます。ハーネスは、解決されたプロバイダーがサポート対象であることを検証します。                                                                                                                                            |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`。`auto-reply/thinking.ts` で解決される OpenClaw の `ThinkLevel`／`ReasoningLevel` からマッピングされます。                                                                                                                                                                       |
| `infiniteSessionConfig`  | `harness.compact` によって駆動される SDK の `infiniteSessions` ブロックに対する任意のオーバーライド。そのままにしても安全です。                                                                                                                                                                                                            |
| `hooksConfig`            | ツール／MCP、ユーザープロンプト、セッション、およびエラーコールバック向けの、任意のネイティブ Copilot SDK `SessionHooks` 設定。OpenClaw の移植可能なライフサイクルフックとは別です。                                                                                                                                                    |
| `permissionPolicy`       | 組み込み SDK ツール種別（`shell`、`write`、`read`、`url`、`mcp`、`memory`、`hook`）向けの SDK `onPermissionRequest` ハンドラーに対する任意のオーバーライド。安全策としてデフォルトは `rejectAllPolicy` です。実際には決して発火しない理由については、[権限と ask_user](#permissions-and-ask_user)を参照してください。 |
| `enableSessionTelemetry` | 任意の SDK セッションテレメトリフラグ。                                                                                                                                                                                                                                                                                              |

OpenClaw Plugin フックには、Copilot 固有の試行設定は不要です。ハーネスは、標準ハーネスヘルパーを介して、`before_prompt_build`（および従来の `before_agent_start` 互換性フック）、`llm_input`、`llm_output`、`agent_end` を実行します。SDK の Compaction が成功すると、`before_compaction` と `after_compaction` も実行されます。ブリッジされた OpenClaw ツールは `before_tool_call` を実行し、`after_tool_call` を報告します。`hooksConfig` は、移植可能な同等機能がないネイティブ SDK 専用コールバック用として維持されます。

OpenClaw の他の部分が、これらのフィールドについて知る必要はありません。他の Plugin、チャネル、コアコードから見えるのは、標準の `AgentHarnessAttemptParams`／`AgentHarnessAttemptResult` 形式だけです。

## Compaction

`harness.compact` の実行時に、Copilot SDK ハーネスは次の処理を行います。

1. 保留中の作業を続行せずに、追跡対象の SDK セッションを再開します。
2. SDK のセッションスコープの履歴 Compaction RPC を呼び出します。
3. ワークスペース配下に互換性マーカーファイルを書き込まず、SDK の Compaction 結果を返します。

OpenClaw 側のトランスクリプトミラー（後述）は Compaction 後のメッセージも引き続き受信するため、ユーザー向けのチャット履歴は一貫性を保ちます。

## トランスクリプトのミラーリング

`runCopilotAttempt` は、各ターンのミラー可能なメッセージを `extensions/copilot/src/dual-write-transcripts.ts` を介して OpenClaw の監査トランスクリプトにも書き込みます。ミラーはセッションごとにスコープされ（`copilot:${sessionId}`）、メッセージごとにキー付けされる（`${role}:${sha256_16(role,content)}`）ため、再送信された以前のターンのエントリは、重複するのではなく、ディスク上の既存キーと衝突します。

ミラーは2層の障害封じ込めでラップされているため、トランスクリプトの書き込みに失敗しても試行が失敗することはありません。内部のベストエフォートラッパーに加え、試行レベルで多層防御の `.catch(...)` を使用します。失敗はログに記録されますが、表面化はしません。

## 補足質問（`/btw`）

このハーネスでは、`/btw` はネイティブでは**ありません**。`createCopilotAgentHarness()` は意図的に `harness.runSideQuestion` を未定義のままにしています（`extensions/copilot/harness.test.ts` の `describe("runSideQuestion")` で表明されています）。そのため、OpenClaw の `/btw` ディスパッチャー（`src/agents/btw.ts`）は、Codex 以外のすべてのランタイムで使用するものと同じパスにフォールスルーします。設定されたモデルプロバイダーを、短い補足質問プロンプトで直接呼び出し、`streamSimple` を介してストリーミングで返します（CLI セッションも、追加のプールスロットも使用しません）。

これにより、Copilot CLI セッションはエージェントのメインターンループ用に確保され、`/btw` の動作は Codex 以外の他のランタイムと同一に保たれます。

## Doctor

`extensions/copilot/doctor-contract-api.ts` は、`src/plugins/doctor-contract-registry.ts` によって自動的に読み込まれます。次の項目を提供します。

- 空の `legacyConfigRules`（廃止済みフィールドはまだありません）。
- 何もしない `normalizeCompatibilityConfig`（将来のフィールド廃止に備え、ツリー内に安定した配置先を確保するために残されています）。
- 1つの `sessionRouteStateOwners` エントリ：プロバイダー `github-copilot`、ランタイム `copilot`、CLI セッションキー `copilot`、認証プロファイルのプレフィックス `github-copilot:`。

## 制限事項

- ハーネスは、`github-copilot` に加えて、所有者のないカスタム BYOK プロバイダー ID を担当します。マニフェスト所有のネイティブプロバイダー ID は、`agentRuntime.id` が `copilot` に強制されている場合でも、それを所有するランタイムに残ります。
- TUI サーフェスはありません。PI の TUI は、対応するサーフェスを持たないランタイムのフォールバックとして引き続き使用されます。
- エージェントが `copilot` に切り替わっても、PI のセッション状態は移行されません。選択は試行ごとに行われ、既存の PI セッションは引き続き有効です。
- `ask_user` は Codex ハーネスと同じ OpenClaw のプロンプト応答パスを使用します。Copilot SDK がユーザー入力を要求すると、OpenClaw はアクティブなチャンネル/TUI にブロッキングプロンプトを投稿し、次にキューに入ったユーザーメッセージによって SDK リクエストが解決されます。

## 権限と ask_user

ブリッジされた OpenClaw ツールの権限適用は、SDK の `onPermissionRequest` コールバックではなく、**ツールラッパー内**で行われます。PI が使用するものと同じ `wrapToolWithBeforeToolCallHook`（`src/agents/agent-tools.before-tool-call.ts`）が、`createOpenClawCodingTools` によってすべてのコーディングツールに適用されます。ループ検出、信頼済み Plugin ポリシー、ツール呼び出し前フック、Gateway（`plugin.approval.request`）を介した2段階の Plugin 承認は、すべてネイティブ PI 試行とまったく同じコードパスを通じて実行されます。

`convertOpenClawToolToSdkTool` が返す SDK Tool には、次のマークが付けられます。

- `overridesBuiltInTool: true` — 同名の Copilot CLI 組み込みツール（edit、read、write、bash など）を置き換え、すべてのツール呼び出しを OpenClaw に戻します。
- `skipPermission: true` — ツールを呼び出す前に `onPermissionRequest({kind: "custom-tool"})` を発火しないよう SDK に指示します。ラップされた `execute()` は、すでにより高度な OpenClaw ポリシーチェックを実行しています。SDK レベルのプロンプトを使用すると、OpenClaw の適用を迂回する（すべて許可）か、すべてのツール呼び出しをブロックする（すべて拒否）ことになり、どちらも PI との同等性を満たしません。

ツリー内の Codex ハーネスも同じ分割を使用します。ブリッジされた OpenClaw ツールはラップされ（`extensions/codex/src/app-server/dynamic-tools.ts`）、codex-app-server 独自のネイティブ承認種別（`item/commandExecution/requestApproval`、`item/fileChange/requestApproval`、`item/permissions/requestApproval`）は、`plugin.approval.request`（`extensions/codex/src/app-server/approval-bridge.ts`）を経由します。Copilot SDK で同等の仕組み、つまり `onPermissionRequest` に到達した `custom-tool` 以外の種別に対してフェイルクローズする `rejectAllPolicy` は、同じセーフティネットです。また、`overridesBuiltInTool: true` がすべての組み込みツールを置き換えるため、実際には発火しません。

ラップされたツール層が PI と同等のポリシー判断を行えるようにするため、ハーネスは PI の試行ツールコンテキスト全体を `createOpenClawCodingTools` に転送します。これには、アイデンティティ（`senderIsOwner`、`memberRoleIds`、`ownerOnlyToolAllowlist` など）、チャンネル/ルーティング（`groupId`、`currentChannelId`、`replyToMode`、メッセージツールの切り替え）、認証（`authProfileStore`）、実行アイデンティティ（`sandboxSessionKey` から導出される `sessionKey` / `runSessionKey`、`runId`）、モデルコンテキスト（`modelApi`、`modelContextWindowTokens`、`modelCompat`、`modelHasVision`）、実行フック（`onToolOutcome`、`onYield`）が含まれます。これらのフィールドがない場合、所有者専用許可リストはデフォルトで暗黙的に拒否し、Plugin 信頼ポリシーは正しいスコープに解決できず、`session_status: "current"` は古いサンドボックスキーに解決されます。ブリッジビルダーは `extensions/copilot/src/tool-bridge.ts` にあり、`src/agents/embedded-agent-runner/run/attempt.ts:1262` にある PI の正規呼び出しを踏襲しています。`runAttempt` は共有の `resolveSandboxContext` シームを通じてサンドボックスコンテキストを解決し、有効な作業ディレクトリを SDK に渡し、`sandbox` とサブエージェント生成ワークスペースをツールブリッジに転送します。また、ブリッジは SDK 境界で適用できる、範囲が限定されたツール構築制御も転送します。具体的には、`includeCoreTools`、ランタイムツール許可リスト、`toolConstructionPlan` です。

また、ブリッジは PI との同等性を保つため、`openclaw/plugin-sdk/agent-harness-tool-runtime` の共有ハーネスツールサーフェスヘルパーを使用します。ツール検索が有効な場合、SDK にはすべての OpenClaw ツールスキーマではなく、コンパクトな制御ツールと非表示のカタログ実行ツールが公開されます。コードモードが有効な場合、ヘルパーは他のエージェントハーネスで使用されるものと同じコードモード制御サーフェスとカタログライフサイクルを構築します。ローカルモデル向けの軽量なデフォルト、ランタイム互換のスキーマフィルタリング、ディレクトリのハイドレーション、カタログのクリーンアップは、すべて共有ヘルパー内に維持されるため、Copilot と Codex に隣接するハーネス間で差異が生じません。

### セッションレベルの GitHub トークン

Copilot SDK の契約では、**クライアントレベル**の GitHub トークン（`CopilotClientOptions.gitHubToken`、CLI プロセス自体を認証）と、**セッションレベル**のトークン（`SessionConfig.gitHubToken`、そのセッションのコンテンツ除外、モデルルーティング、クォータを決定し、`createSession` と `resumeSession` の両方で使用）を区別します。ハーネスは `resolveCopilotAuth` を介して認証を一度解決し、認証モードが `gitHubToken` の場合、両方のフィールドを設定します（明示的な `auth.gitHubToken`、または設定済みの `github-copilot` 認証プロファイルから契約に基づいて解決された `resolvedApiKey`）。解決されたモードが `useLoggedInUser` の場合、セッションレベルのフィールドは省略され、SDK はログイン済みアイデンティティから引き続きアイデンティティを導出します。

`ask_user` は `SessionConfig.onUserInputRequest` を使用します。ブリッジは、固定選択肢リクエストでは選択肢のインデックスまたはラベルを受け入れ、SDK リクエストで許可されている場合は自由形式の回答を受け入れます。また、OpenClaw の試行が中止されると、保留中のリクエストをキャンセルします。

## 関連項目

- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [エージェントハーネス Plugin（SDK リファレンス）](/ja-JP/plugins/sdk-agent-harness)
