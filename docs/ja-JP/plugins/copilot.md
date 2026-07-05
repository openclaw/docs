---
read_when:
    - エージェントに GitHub Copilot SDK ハーネスを使用したい
    - '`copilot` ランタイムの設定例が必要です'
    - エージェントをサブスクリプション Copilot (github / openclaw / copilot) に接続し、Copilot CLI を通じて実行したい場合
summary: OpenClaw の埋め込みエージェントターンを外部 GitHub Copilot SDK ハーネス経由で実行する
title: Copilot SDK ハーネス
x-i18n:
    generated_at: "2026-07-05T11:38:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ce0dd8fb69275450b3342a3acd7ec5c1d993a88196c5d0ad2f2fa9a34badf97
    source_path: plugins/copilot.md
    workflow: 16
---

外部の `@openclaw/copilot` Plugin は、OpenClaw 組み込みの PI ハーネスではなく、GitHub Copilot CLI (`@github/copilot-sdk`) を通じて、埋め込みサブスクリプションの Copilot エージェントターンを実行します。Copilot CLI セッションは低レベルのエージェントループを所有します。ネイティブツール実行、ネイティブ Compaction (`infiniteSessions`)、および `copilotHome` 配下の CLI 管理スレッド状態です。OpenClaw は引き続き、チャットチャネル、セッションファイル、モデル選択、動的ツール（ブリッジ）、承認、メディア配信、表示されるトランスクリプトミラー、`/btw` の補足質問（[補足質問 (`/btw`)](#side-questions-btw) を参照）、および `openclaw doctor` を所有します。

より広範なモデル、プロバイダー、ランタイムの分担については、[エージェントランタイム](/ja-JP/concepts/agent-runtimes) から始めてください。

## 要件

- `@openclaw/copilot` Plugin がインストールされた OpenClaw。
- 設定で `plugins.allow` を使っている場合は、`copilot`（Plugin が宣言するマニフェスト ID）を含めてください。npm パッケージ名 `@openclaw/copilot` の許可リストエントリは一致せず、`agentRuntime.id: "copilot"` が設定されていても Plugin はブロックされたままになります。
- Copilot CLI を駆動できる GitHub Copilot サブスクリプション、またはヘッドレス実行や Cron 実行用の `gitHubToken` 環境変数 / 認証プロファイルエントリ。
- 書き込み可能な `copilotHome` ディレクトリ。OpenClaw がエージェントディレクトリを提供する場合の既定値は `<agentDir>/copilot`、それ以外の場合は `~/.openclaw/agents/<agentId>/copilot` です。

`openclaw doctor` は、セッション状態の所有権と将来の設定移行のために、Plugin の [doctor コントラクト](#doctor) を実行します。Copilot CLI 環境のプローブは行いません。

## インストール

Copilot ランタイムは外部 Plugin として提供されるため、コアの `openclaw` パッケージは `@github/copilot-sdk` や、プラットフォーム固有の `@github/copilot-<platform>-<arch>` CLI バイナリ（合計およそ 260 MB）を含みません。このランタイムにオプトインするエージェントにのみインストールしてください。

```bash
openclaw plugins install @openclaw/copilot
```

セットアップウィザードは、`github-copilot/*` モデルを初めて選択し、かつ設定がそのモデル（またはそのプロバイダー）を `agentRuntime: { id: "copilot" }` によって Copilot ランタイムへルーティングしている場合に、Plugin を自動的にインストールします。[クイックスタート](#quickstart) を参照してください。このオプトインがない場合、OpenClaw は組み込みの GitHub Copilot プロバイダーを使用し、この Plugin はインストールしません。

ランタイムは次の順序で SDK を解決します。

1. インストール済みの `@openclaw/copilot` パッケージから `import("@github/copilot-sdk")`。
2. フォールバックディレクトリ `~/.openclaw/npm-runtime/copilot/`（レガシーのオンデマンドインストール先）。

SDK が見つからない場合、コード `COPILOT_SDK_MISSING` と上記の再インストールコマンドを含む 1 つのエラーとして表示されます。

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

1 つのモデルエントリに `agentRuntime.id` を設定するとそのモデルだけをハーネス経由にし、プロバイダーに設定するとそのプロバイダー配下のすべてのモデルをルーティングします。

`github-copilot/auto` はポータブルな開始点です。名前付き Copilot モデルはアカウントと組織ポリシーに依存します。固定する前に、認証済みの Copilot CLI が実際にそのモデルを公開していることを確認してください。

## サポートされるプロバイダー

ハーネスは、正規の `github-copilot` プロバイダー（`extensions/github-copilot` が所有）に加え、モデルが空でない `baseUrl` と次のいずれかの `api` 形状を持つ場合のカスタム `models.providers` エントリをサポートします。

- `anthropic-messages`
- `azure-openai-responses`
- `ollama`（OpenAI 互換 completions）
- `openai-completions`
- `openai-responses`

ネイティブプロバイダー ID（`openai`、`anthropic`、`google`、`ollama`）は、それぞれのネイティブランタイムが所有したままです。代わりに Copilot BYOK 経由でエンドポイントをルーティングするには、別個のカスタムプロバイダー ID を使用してください。

Copilot BYOK エンドポイントは公開 HTTPS URL である必要があります。ハーネスは Copilot SDK に試行ごとのループバックプロキシを渡し、その後 OpenClaw の保護された fetch 経路を通じてプロバイダートラフィックを転送するため、DNS ピニングと SSRF ポリシーは OpenClaw が所有したままになります。ローカルの Ollama、LM Studio、または LAN モデルサーバーには、OpenClaw のネイティブランタイムを使用してください。

## BYOK

Copilot BYOK は、SDK のセッションレベルのカスタムプロバイダーコントラクトを使用します。OpenClaw は、解決済みのモデルエンドポイント、API キー、ベアラートークンモード、ヘッダー、モデル ID、コンテキスト / 出力制限を渡します。プロバイダー転送ロジックはコアではなく SDK に残ります。

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

BYOK セッションは、サブスクリプションセッションや他の BYOK エンドポイントまたは認証情報とは別にキー付けされます。キー、ヘッダー、モデル、またはエンドポイントをローテーションすると、互換性のない状態を再開するのではなく、新しい Copilot SDK セッションが開始されます。

## 認証

`runCopilotAttempt` 中にエージェントごとに適用される優先順位は次のとおりです。

1. 試行入力の **明示的な `useLoggedInUser: true`** — エージェントの `copilotHome` 配下にある Copilot CLI のログイン済みユーザーを使用します。
2. 試行入力の **明示的な `gitHubToken`**（`profileId` + `profileVersion` が必要）。認証プロファイル解決をバイパスする必要がある直接 CLI 呼び出しやテスト用です。
3. **コントラクトで解決された `resolvedApiKey` + `authProfileId`** — 本番のメイン経路です。コアはハーネスを呼び出す前に、エージェントに設定された `github-copilot` 認証プロファイル（`src/infra/provider-usage.auth.ts:resolveProviderAuths`）を解決するため、`github-copilot:<profile>` 認証プロファイルは、環境変数なしでヘッドレス、Cron、またはマルチプロファイル構成でエンドツーエンドに機能します。
4. **環境変数フォールバック**。次の順序で確認されます（最初の空でない値が採用され、空文字列は未指定として扱われます。`extensions/github-copilot/auth.ts` にある出荷済み `github-copilot` プロバイダーの優先順位を反映します）。
   1. `OPENCLAW_GITHUB_TOKEN` — ハーネス固有の上書き。システム全体の `gh` / Copilot CLI 設定を乱さずに、OpenClaw ハーネス用のトークンを固定できます。
   2. `COPILOT_GITHUB_TOKEN` — 標準の Copilot SDK / CLI 環境変数。
   3. `GH_TOKEN` — 標準の `gh` CLI 環境変数。
   4. `GITHUB_TOKEN` — 汎用 GitHub トークンフォールバック。

   合成されるプールプロファイル ID は `env:<NAME>` です。プロファイルバージョンはトークンの不可逆 sha256 フィンガープリントであるため、環境値をローテーションするとクライアントプールがきれいに無効化されます。

5. トークン信号が利用できない場合の **既定の `useLoggedInUser`**。

各エージェントには専用の `copilotHome` が割り当てられるため、同じマシン上のエージェント間で Copilot CLI のトークン、セッション、設定が漏れることはありません。既定値は `<agentDir>/copilot`（SDK 状態を OpenClaw の `models.json` / `auth-profiles.json` と同じディレクトリに置かないため）、またはエージェントディレクトリが指定されていない場合は `~/.openclaw/agents/<agentId>/copilot` です。カスタムの場所（たとえば移行用の共有マウント）には、試行入力の `copilotHome: <path>` で上書きします。

ライブハーネステストは、直接トークン用に `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` を使用します。共有ライブテストセットアップは、実際の認証プロファイルを隔離されたテストホームへステージングした後に、`COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、`GITHUB_TOKEN` を消去します。そのため、専用変数経由で渡された `gh auth token` 値は、無関係なスイートに漏れることなく誤ったスキップを回避できます。

## 設定サーフェス

ハーネスは、試行ごとの入力（`runCopilotAttempt({...})`）と、`extensions/copilot/src/` 内の少数の環境既定値から設定を読み取ります。

| フィールド               | 目的                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | エージェントごとの CLI 状態ディレクトリ（既定値は上記）。                                                                                                                                                                                                                                                                         |
| `model`                  | 文字列または `{ provider, id, api?, baseUrl?, headers?, authHeader? }`。エージェントの通常のモデル選択を使用するには省略します。ハーネスは解決済みプロバイダーがサポート対象であることを検証します。                                                                                                                             |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`。`auto-reply/thinking.ts` の OpenClaw `ThinkLevel` / `ReasoningLevel` 解決からマップされます。                                                                                                                                                                                           |
| `infiniteSessionConfig`  | `harness.compact` によって駆動される SDK `infiniteSessions` ブロックの任意の上書きです。そのままにしておいて問題ありません。                                                                                                                                                                                                      |
| `hooksConfig`            | ツール / MCP、ユーザープロンプト、セッション、エラーコールバック用の任意のネイティブ Copilot SDK `SessionHooks` 設定です。OpenClaw のポータブルライフサイクルフックとは別です。                                                                                                                                                  |
| `permissionPolicy`       | 組み込み SDK ツール種別（`shell`、`write`、`read`、`url`、`mcp`、`memory`、`hook`）に対する SDK の `onPermissionRequest` ハンドラーの任意の上書きです。安全策として既定では `rejectAllPolicy` です。実際には発火しない理由については、[権限と ask_user](#permissions-and-ask_user) を参照してください。 |
| `enableSessionTelemetry` | 任意の SDK セッションテレメトリフラグ。                                                                                                                                                                                                                                                                                           |

OpenClaw Plugin フックに Copilot 固有の試行設定は不要です。ハーネスは標準ハーネスヘルパーを通じて、`before_prompt_build`（およびレガシーの `before_agent_start` 互換フック）、`llm_input`、`llm_output`、`agent_end` を実行します。成功した SDK Compaction では、`before_compaction` と `after_compaction` も実行されます。ブリッジされた OpenClaw ツールは `before_tool_call` を実行し、`after_tool_call` を報告します。`hooksConfig` は、ポータブルな同等物がないネイティブ SDK 専用コールバック用に残ります。

OpenClaw の他の部分がこれらのフィールドを知る必要はありません。他の Plugin、チャネル、コアコードから見えるのは、標準の `AgentHarnessAttemptParams` / `AgentHarnessAttemptResult` 形状だけです。

## Compaction

`harness.compact` が実行されると、Copilot SDK ハーネスは次を行います。

1. 保留中の作業を続行せずに、追跡されている SDK セッションを再開します。
2. SDK のセッションスコープの履歴 Compaction RPC を呼び出します。
3. ワークスペース配下に互換性マーカーファイルを書き込まずに、SDK Compaction の結果を返します。

OpenClaw 側のトランスクリプトミラー（下記）は Compaction 後のメッセージを受け取り続けるため、ユーザー向けのチャット履歴は一貫した状態に保たれます。

## トランスクリプトミラーリング

`runCopilotAttempt` は、各ターンのミラー可能なメッセージを `extensions/copilot/src/dual-write-transcripts.ts` 経由で OpenClaw 監査トランスクリプトへ二重書き込みします。ミラーはセッションごと（`copilot:${sessionId}`）にスコープされ、メッセージごと（`${role}:${sha256_16(role,content)}`）にキー付けされるため、再送信された過去ターンのエントリは重複せず、既存のディスク上のキーと衝突します。

ミラーは2層の失敗封じ込めでラップされているため、トランスクリプト書き込みの失敗で試行が失敗することはありません。内部のベストエフォートラッパーに加えて、試行レベルの防御的な `.catch(...)` があります。失敗はログに記録され、表面化しません。

## サイド質問 (`/btw`)

`/btw` はこのハーネスでは**ネイティブではありません**。`createCopilotAgentHarness()` は意図的に `harness.runSideQuestion` を未定義のままにします（`extensions/copilot/harness.test.ts` の `describe("runSideQuestion")` でアサートされています）。そのため、OpenClaw の `/btw` ディスパッチャー（`src/agents/btw.ts`）は、Codex 以外のすべてのランタイムで使うのと同じパスへフォールスルーします。設定済みモデルプロバイダーが短いサイド質問プロンプトで直接呼び出され、`streamSimple` 経由でストリーム返却されます（CLI セッションなし、追加のプールスロットなし）。

これにより、Copilot CLI セッションはエージェントのメインターンループ用に確保され、`/btw` の動作は他の Codex 以外のランタイムと同一に保たれます。

## Doctor

`extensions/copilot/doctor-contract-api.ts` は `src/plugins/doctor-contract-registry.ts` によって自動ロードされます。これは以下を提供します。

- 空の `legacyConfigRules`（まだ廃止フィールドはありません）。
- 何もしない `normalizeCompatibilityConfig`（将来のフィールド廃止に安定したツリー内の置き場を持たせるために維持されています）。
- 1つの `sessionRouteStateOwners` エントリ: プロバイダー `github-copilot`、ランタイム `copilot`、CLI セッションキー `copilot`、認証プロファイルプレフィックス `github-copilot:`。

## 制限事項

- このハーネスは `github-copilot` と、所有者のいないカスタム BYOK プロバイダー ID を扱うものと主張します。マニフェスト所有のネイティブプロバイダー ID は、`agentRuntime.id` が `copilot` に強制されている場合でも、その所有ランタイムに残ります。
- TUI サーフェスはありません。ピアサーフェスのないランタイムでは、PI の TUI がフォールバックのままです。
- エージェントが `copilot` に切り替わっても、PI セッション状態は移行されません。選択は試行ごとです。既存の PI セッションは引き続き有効です。
- `ask_user` は Codex ハーネスと同じ OpenClaw のプロンプトおよび返信パスを使用します。Copilot SDK がユーザー入力を求めると、OpenClaw はアクティブなチャンネル/TUI にブロッキングプロンプトを投稿し、次にキューに入ったユーザーメッセージが SDK リクエストを解決します。

## 権限と ask_user

ブリッジされた OpenClaw ツールの権限強制は、SDK の `onPermissionRequest` コールバック経由ではなく、**ツールラッパー内**で発生します。PI が使用するものと同じ `wrapToolWithBeforeToolCallHook`（`src/agents/agent-tools.before-tool-call.ts`）が、`createOpenClawCodingTools` によってすべてのコーディングツールに適用されます。ループ検出、信頼済み Plugin ポリシー、ツール呼び出し前フック、Gateway（`plugin.approval.request`）経由の2段階 Plugin 承認は、すべてネイティブ PI 試行とまったく同じコードパスを通ります。

`convertOpenClawToolToSdkTool` が返す SDK Tool には、以下がマークされています。

- `overridesBuiltInTool: true` — 同じ名前（edit、read、write、bash など）の Copilot CLI 組み込みツールを置き換え、すべてのツール呼び出しが OpenClaw に戻るようにします。
- `skipPermission: true` — ツールを呼び出す前に `onPermissionRequest({kind: "custom-tool"})` を発火しないよう SDK に伝えます。ラップされた `execute()` はすでに、より豊かな OpenClaw ポリシーチェックを実行します。SDK レベルのプロンプトは、OpenClaw の強制を短絡する（すべて許可）か、すべてのツール呼び出しをブロックする（すべて拒否）ことになり、どちらも PI との同等性に一致しません。

ツリー内の Codex ハーネスも同じ分割を使用します。ブリッジされた OpenClaw ツールはラップされ（`extensions/codex/src/app-server/dynamic-tools.ts`）、codex-app-server 独自のネイティブ承認種別（`item/commandExecution/requestApproval`、`item/fileChange/requestApproval`、`item/permissions/requestApproval`）は `plugin.approval.request`（`extensions/codex/src/app-server/approval-bridge.ts`）を通ります。Copilot SDK の同等物、つまり `onPermissionRequest` に到達する可能性のある `custom-tool` 以外の種別に対する失敗時クローズの `rejectAllPolicy` は同じセーフティネットであり、`overridesBuiltInTool: true` がすべての組み込みを置き換えるため、実際には発火しません。

ラップ済みツール層が PI と同等のポリシー判断を行うには、ハーネスは完全な PI 試行ツールコンテキストを `createOpenClawCodingTools` に転送します。これには、アイデンティティ（`senderIsOwner`、`memberRoleIds`、`ownerOnlyToolAllowlist` など）、チャンネル/ルーティング（`groupId`、`currentChannelId`、`replyToMode`、メッセージツール切り替え）、認証（`authProfileStore`）、実行アイデンティティ（`sandboxSessionKey`、`runId` から派生した `sessionKey` / `runSessionKey`）、モデルコンテキスト（`modelApi`、`modelContextWindowTokens`、`modelCompat`、`modelHasVision`）、実行フック（`onToolOutcome`、`onYield`）が含まれます。これらのフィールドがないと、所有者限定許可リストはデフォルトで静かに拒否し、Plugin 信頼ポリシーは正しいスコープに解決できず、`session_status: "current"` は古いサンドボックスキーに解決されます。ブリッジビルダーは `extensions/copilot/src/tool-bridge.ts` で、`src/agents/embedded-agent-runner/run/attempt.ts:1262` にある PI の権威ある呼び出しをミラーしています。`runAttempt` は共有の `resolveSandboxContext` シームを通じてサンドボックスコンテキストを解決し、SDK に有効な作業ディレクトリを渡し、`sandbox` とサブエージェント生成ワークスペースをツールブリッジへ転送します。ブリッジは、SDK 境界で強制できる限定されたツール構築コントロールも転送します。`includeCoreTools`、ランタイムツール許可リスト、`toolConstructionPlan` です。

ブリッジは PI との同等性のために、`openclaw/plugin-sdk/agent-harness-tool-runtime` の共有ハーネスツールサーフェスヘルパーも使用します。ツール検索が有効な場合、SDK はすべての OpenClaw ツールスキーマではなく、コンパクトな制御ツールと隠しカタログ実行器を見ます。コードモードが有効な場合、ヘルパーは他のエージェントハーネスで使用されるものと同じコードモード制御サーフェスとカタログライフサイクルを構築します。ローカルモデル向けの軽量なデフォルト、ランタイム互換のスキーマフィルタリング、ディレクトリハイドレーション、カタログクリーンアップはすべて共有ヘルパーに残るため、Copilot と Codex 隣接ハーネスが乖離しません。

### セッションレベルの GitHub トークン

Copilot SDK 契約は、**クライアントレベル**の GitHub トークン（`CopilotClientOptions.gitHubToken`、CLI プロセス自体を認証します）と、**セッションレベル**のトークン（`SessionConfig.gitHubToken`、そのセッションのコンテンツ除外、モデルルーティング、クォータを決定します。`createSession` と `resumeSession` の両方で尊重されます）を区別します。ハーネスは `resolveCopilotAuth` 経由で認証を一度解決し、認証モードが `gitHubToken`（明示的な `auth.gitHubToken`、または設定済み `github-copilot` 認証プロファイルから契約解決された `resolvedApiKey`）である場合、両方のフィールドを設定します。解決されたモードが `useLoggedInUser` の場合、SDK がログイン済みアイデンティティからアイデンティティを引き続き導出するように、セッションレベルのフィールドは省略されます。

`ask_user` は `SessionConfig.onUserInputRequest` を使用します。ブリッジは固定選択リクエストでは選択肢のインデックスまたはラベルを受け入れ、SDK リクエストが許可する場合は自由形式の回答を受け入れ、OpenClaw 試行が中止された場合は保留中のリクエストをキャンセルします。

## 関連

- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [エージェントハーネス Plugin（SDK リファレンス）](/ja-JP/plugins/sdk-agent-harness)
