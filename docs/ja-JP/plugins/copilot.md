---
read_when:
    - エージェントで GitHub Copilot SDK ハーネスを使用したい場合
    - '`copilot` ランタイムの設定例が必要です'
    - サブスクリプション版 Copilot（github / openclaw / copilot）にエージェントを接続し、Copilot CLI 経由で実行したい場合。
summary: 外部の GitHub Copilot SDK ハーネスを介して OpenClaw の組み込みエージェントターンを実行する
title: Copilot SDK ハーネス
x-i18n:
    generated_at: "2026-07-11T22:26:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a9b75a038540af6a8306f3e80c87d6085dde29d128adf85b930713209fc5
    source_path: plugins/copilot.md
    workflow: 16
---

外部の `@openclaw/copilot` Plugin は、OpenClaw の組み込みハーネスの代わりに GitHub Copilot CLI（`@github/copilot-sdk`）を介して、埋め込み型のサブスクリプション Copilot エージェントターンを実行します。Copilot CLI セッションは、ネイティブツールの実行、ネイティブ Compaction（`infiniteSessions`）、`copilotHome` 配下の CLI 管理スレッド状態という、低レベルのエージェントループを所有します。OpenClaw は引き続き、チャットチャンネル、セッションファイル、モデル選択、動的ツール（ブリッジ経由）、承認、メディア配信、表示用トランスクリプトミラー、`/btw` による補足質問（[補足質問（`/btw`）](#side-questions-btw)を参照）、および `openclaw doctor` を所有します。

モデル、プロバイダー、ランタイムのより広範な分担については、[エージェントランタイム](/ja-JP/concepts/agent-runtimes)から確認してください。

## 要件

- `@openclaw/copilot` Plugin がインストールされた OpenClaw。
- 設定で `plugins.allow` を使用している場合は、`copilot`（Plugin が宣言するマニフェスト ID）を含めてください。npm パッケージ名 `@openclaw/copilot` の許可リストエントリは一致しないため、`agentRuntime.id: "copilot"` が設定されていても Plugin はブロックされたままになります。
- Copilot CLI を駆動できる GitHub Copilot サブスクリプション、またはヘッドレス実行や Cron 実行用の `gitHubToken` 環境変数／認証プロファイルエントリ。
- 書き込み可能な `copilotHome` ディレクトリ。OpenClaw がエージェントディレクトリを提供する場合のデフォルトは `<agentDir>/copilot`、それ以外の場合は `~/.openclaw/agents/<agentId>/copilot` です。

`openclaw doctor` は、セッション状態の所有権と将来の設定移行のために、Plugin の [doctor コントラクト](#doctor)を実行します。Copilot CLI 環境の検査は行いません。

## インストール

Copilot ランタイムは外部 Plugin として提供されるため、コアの `openclaw` パッケージには `@github/copilot-sdk` や、プラットフォーム固有の `@github/copilot-<platform>-<arch>` CLI バイナリ（合計約 260 MB）は含まれません。このランタイムを明示的に使用するエージェントにのみインストールしてください。

```bash
openclaw plugins install @openclaw/copilot
```

セットアップウィザードは、`github-copilot/*` モデルを初めて選択し、**かつ**設定でそのモデル（またはそのプロバイダー）が `agentRuntime: { id: "copilot" }` によって Copilot ランタイムへルーティングされている場合に、Plugin を自動的にインストールします。[クイックスタート](#quickstart)を参照してください。この明示的な選択がない場合、OpenClaw は組み込みの GitHub Copilot プロバイダーを使用し、この Plugin をインストールすることはありません。

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

単一のモデルエントリに `agentRuntime.id` を設定すると、そのモデルだけがハーネスを経由します。プロバイダーに設定すると、そのプロバイダー配下のすべてのモデルがハーネスを経由します。

`github-copilot/auto` は移植性の高い出発点です。名前付き Copilot モデルはアカウントや組織のポリシーに依存するため、固定する前に、認証済みの Copilot CLI でそのモデルが実際に公開されていることを確認してください。

## 対応プロバイダー

ハーネスは、正式な `github-copilot` プロバイダー（`extensions/github-copilot` が所有）に加えて、モデルに空でない `baseUrl` があり、次のいずれかの `api` 形式を持つ場合に、カスタム `models.providers` エントリをサポートします。

- `anthropic-messages`
- `azure-openai-responses`
- `ollama`（OpenAI 互換の補完）
- `openai-completions`
- `openai-responses`

ネイティブプロバイダー ID（`openai`、`anthropic`、`google`、`ollama`）は、それぞれのネイティブランタイムが引き続き所有します。代わりに Copilot BYOK を介してエンドポイントをルーティングするには、別のカスタムプロバイダー ID を使用してください。

Copilot BYOK エンドポイントは、公開 HTTPS URL である必要があります。ハーネスは試行ごとのループバックプロキシを Copilot SDK に提供し、その後、プロバイダーのトラフィックを OpenClaw の保護されたフェッチ経路へ転送します。これにより、DNS ピンニングと SSRF ポリシーの所有権は OpenClaw に維持されます。ローカルの Ollama、LM Studio、または LAN モデルサーバーには、OpenClaw のネイティブランタイムを使用してください。

## BYOK

Copilot BYOK は、SDK のセッションレベルのカスタムプロバイダーコントラクトを使用します。OpenClaw は、解決済みのモデルエンドポイント、API キー、Bearer トークンモード、ヘッダー、モデル ID、コンテキスト／出力上限を渡します。プロバイダーの転送ロジックはコアではなく SDK に残ります。

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

BYOK セッションは、サブスクリプションセッション、および他の BYOK エンドポイントや認証情報とは別のキーで管理されます。キー、ヘッダー、モデル、またはエンドポイントをローテーションすると、互換性のない状態を再開せず、新しい Copilot SDK セッションが開始されます。

## 認証

`runCopilotAttempt` 中にエージェントごとに適用される優先順位は次のとおりです。

1. 試行入力での明示的な **`useLoggedInUser: true`** — エージェントの `copilotHome` 配下にある Copilot CLI のログイン済みユーザーを使用します。
2. 試行入力での明示的な **`gitHubToken`**（`profileId` と `profileVersion` が必要）。認証プロファイルの解決を迂回する必要がある、直接の CLI 呼び出しやテスト向けです。
3. **コントラクトで解決された `resolvedApiKey` と `authProfileId`** — 本番環境の主要経路です。コアは、ハーネスを呼び出す前に、エージェントに設定された `github-copilot` 認証プロファイル（`src/infra/provider-usage.auth.ts:resolveProviderAuths`）を解決します。そのため、`github-copilot:<profile>` 認証プロファイルは、環境変数なしでも、ヘッドレス、Cron、または複数プロファイル構成でエンドツーエンドに機能します。
4. **環境変数によるフォールバック**。次の順序で確認されます（最初の空でない値が優先され、空文字列は未設定として扱われます。`extensions/github-copilot/auth.ts` で提供されている `github-copilot` プロバイダーの優先順位と同じです）。
   1. `OPENCLAW_GITHUB_TOKEN` — ハーネス固有の上書きです。システム全体の `gh`／Copilot CLI 設定に影響を与えずに、OpenClaw ハーネス用のトークンを固定できます。
   2. `COPILOT_GITHUB_TOKEN` — 標準の Copilot SDK／CLI 環境変数。
   3. `GH_TOKEN` — 標準の `gh` CLI 環境変数。
   4. `GITHUB_TOKEN` — 汎用 GitHub トークンのフォールバック。

   合成されるプールプロファイル ID は `env:<NAME>` です。プロファイルバージョンはトークンの不可逆な sha256 フィンガープリントであるため、環境変数の値をローテーションすると、クライアントプールが確実に更新されます。

5. トークンの手掛かりがない場合のデフォルトの **`useLoggedInUser`**。

各エージェントには個別の `copilotHome` が割り当てられるため、同じマシン上のエージェント間で Copilot CLI のトークン、セッション、設定が漏れることはありません。デフォルトは `<agentDir>/copilot`（SDK の状態を OpenClaw の `models.json`／`auth-profiles.json` と同じディレクトリに置かないため）、またはエージェントディレクトリが指定されていない場合は `~/.openclaw/agents/<agentId>/copilot` です。独自の場所（たとえば移行用の共有マウント）を使用するには、試行入力で `copilotHome: <path>` を指定して上書きします。

ライブハーネステストでは、直接指定するトークンとして `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` を使用します。共有ライブテストのセットアップでは、実際の認証プロファイルを隔離されたテストホームに配置した後、`COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、`GITHUB_TOKEN` を消去します。そのため、専用変数を通じて渡された `gh auth token` の値は、無関係なテストスイートへ漏れることなく、誤ったスキップを回避できます。

## 設定項目

ハーネスは、試行ごとの入力（`runCopilotAttempt({...})`）と、`extensions/copilot/src/` 内の少数の環境変数デフォルトから設定を読み取ります。

| フィールド               | 目的                                                                                                                                                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `copilotHome`            | エージェントごとの CLI 状態ディレクトリ（デフォルトは上記を参照）。                                                                                                                                                                                                                                                                   |
| `model`                  | 文字列または `{ provider, id, api?, baseUrl?, headers?, authHeader? }`。省略するとエージェントの通常のモデル選択を使用し、ハーネスは解決されたプロバイダーがサポート対象であることを検証します。                                                                                                                                            |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`。`auto-reply/thinking.ts` における OpenClaw の `ThinkLevel`／`ReasoningLevel` 解決結果から対応付けられます。                                                                                                                                                                                     |
| `infiniteSessionConfig`  | `harness.compact` によって駆動される SDK の `infiniteSessions` ブロックに対する任意の上書き。そのままにしても安全です。                                                                                                                                                                                                                 |
| `hooksConfig`            | ツール／MCP、ユーザープロンプト、セッション、エラーの各コールバックに対する、任意のネイティブ Copilot SDK `SessionHooks` 設定。OpenClaw の移植可能なライフサイクルフックとは別のものです。                                                                                                                                                |
| `permissionPolicy`       | SDK 組み込みツール種別（`shell`、`write`、`read`、`url`、`mcp`、`memory`、`hook`）に対する SDK の `onPermissionRequest` ハンドラーの任意の上書き。安全策としてデフォルトは `rejectAllPolicy` です。実際には呼び出されない理由については、[権限と ask_user](#permissions-and-ask_user)を参照してください。 |
| `enableSessionTelemetry` | 任意の SDK セッションテレメトリフラグ。                                                                                                                                                                                                                                                                                               |

OpenClaw の Plugin フックには、Copilot 固有の試行設定は必要ありません。ハーネスは標準のハーネスヘルパーを介して、`before_prompt_build`（および従来の `before_agent_start` 互換フック）、`llm_input`、`llm_output`、`agent_end` を実行します。SDK の Compaction が成功した場合は、`before_compaction` と `after_compaction` も実行されます。ブリッジされた OpenClaw ツールは `before_tool_call` を実行し、`after_tool_call` を報告します。`hooksConfig` は、移植可能な同等機能がない、SDK ネイティブ専用のコールバック向けに残されています。

OpenClaw 内の他の部分が、これらのフィールドを認識する必要はありません。他の Plugin、チャンネル、コアコードから見えるのは、標準の `AgentHarnessAttemptParams`／`AgentHarnessAttemptResult` 形式だけです。

## Compaction

`harness.compact` の実行時、Copilot SDK ハーネスは次の処理を行います。

1. 保留中の作業を続行せずに、追跡対象の SDK セッションを再開します。
2. SDK のセッションスコープの履歴 Compaction RPC を呼び出します。
3. ワークスペース配下に互換性マーカーファイルを書き込まず、SDK の Compaction 結果を返します。

OpenClaw 側のトランスクリプトミラー（後述）は Compaction 後のメッセージも引き続き受信するため、ユーザー向けのチャット履歴は一貫した状態に保たれます。

## トランスクリプトのミラーリング

`runCopilotAttempt` は、各ターンでミラーリング可能なメッセージを `extensions/copilot/src/dual-write-transcripts.ts` を介して OpenClaw の監査トランスクリプトにも書き込みます。ミラーはセッションごとにスコープ化され（`copilot:${sessionId}`）、メッセージごとのキー（`${role}:${sha256_16(role,content)}`）で管理されます。そのため、以前のターンのエントリが再度出力されても、重複するのではなく、ディスク上の既存キーと一致します。

2 層の障害封じ込めによってミラーをラップし、トランスクリプト書き込みの失敗が試行を失敗させないようにしています。内部のベストエフォートラッパーに加え、試行レベルで多層防御の `.catch(...)` を使用します。障害はログに記録されますが、表面化しません。

## サイド質問（`/btw`）

このハーネスでは、`/btw` はネイティブでは**ありません**。`createCopilotAgentHarness()` は意図的に `harness.runSideQuestion` を未定義のままにしています（`extensions/copilot/harness.test.ts` の `describe("runSideQuestion")` でアサートされています）。そのため、OpenClaw の `/btw` ディスパッチャー（`src/agents/btw.ts`）は、Codex 以外のすべてのランタイムで使用するものと同じパスにフォールスルーします。設定済みのモデルプロバイダーが短いサイド質問用プロンプトで直接呼び出され、`streamSimple` 経由でストリーミングされます（CLI セッションも追加のプールスロットも使用しません）。

これにより、Copilot CLI セッションはエージェントのメインターンループ用に確保され、`/btw` の動作は Codex 以外の他のランタイムと同一に保たれます。

## Doctor

`extensions/copilot/doctor-contract-api.ts` は `src/plugins/doctor-contract-registry.ts` によって自動的に読み込まれます。以下を提供します。

- 空の `legacyConfigRules`（廃止されたフィールドはまだありません）。
- 何もしない `normalizeCompatibilityConfig`（将来フィールドを廃止する際に、ツリー内の安定した配置先を確保するために維持されています）。
- 1 件の `sessionRouteStateOwners` エントリ：プロバイダー `github-copilot`、ランタイム `copilot`、CLI セッションキー `copilot`、認証プロファイルのプレフィックス `github-copilot:`。

## 制限事項

- ハーネスは `github-copilot` と、所有者が設定されていないカスタム BYOK プロバイダー ID を受け持ちます。マニフェスト所有のネイティブプロバイダー ID は、`agentRuntime.id` が `copilot` に強制されている場合でも、それを所有するランタイムに残ります。
- TUI サーフェスはありません。ピアサーフェスを持たないランタイムでは、PI の TUI が引き続きフォールバックになります。
- エージェントが `copilot` に切り替えても、PI セッションの状態は移行されません。選択は試行ごとに行われ、既存の PI セッションは引き続き有効です。
- `ask_user` は Codex ハーネスと同じ OpenClaw のプロンプト応答パスを使用します。Copilot SDK がユーザー入力を要求すると、OpenClaw はアクティブなチャンネルまたは TUI にブロッキングプロンプトを投稿し、次にキューへ追加されたユーザーメッセージが SDK リクエストを解決します。

## 権限と ask_user

ブリッジされた OpenClaw ツールの権限適用は、SDK の `onPermissionRequest` コールバック経由ではなく、**ツールラッパー内**で行われます。PI が使用するものと同じ `wrapToolWithBeforeToolCallHook`（`src/agents/agent-tools.before-tool-call.ts`）が、`createOpenClawCodingTools` によってすべてのコーディングツールに適用されます。ループ検出、信頼済み Plugin のポリシー、ツール呼び出し前フック、Gateway 経由の 2 段階 Plugin 承認（`plugin.approval.request`）はすべて、ネイティブ PI 試行とまったく同じコードパスを通ります。

`convertOpenClawToolToSdkTool` が返す SDK ツールには、以下が設定されます。

- `overridesBuiltInTool: true` — 同名の Copilot CLI 組み込みツール（edit、read、write、bash、...）を置き換え、すべてのツール呼び出しが OpenClaw に戻るようルーティングします。
- `skipPermission: true` — ツールを呼び出す前に `onPermissionRequest({kind: "custom-tool"})` を発火しないよう SDK に指示します。ラップされた `execute()` は、より高度な OpenClaw ポリシーチェックをすでに実行します。SDK レベルのプロンプトを使用すると、OpenClaw の適用をショートサーキットする（すべて許可）か、すべてのツール呼び出しをブロックする（すべて拒否）ことになり、どちらも PI との同等性を満たしません。

ツリー内の Codex ハーネスも同じ分担を使用します。ブリッジされた OpenClaw ツールはラップされ（`extensions/codex/src/app-server/dynamic-tools.ts`）、codex-app-server 独自のネイティブ承認種別（`item/commandExecution/requestApproval`、`item/fileChange/requestApproval`、`item/permissions/requestApproval`）は、`plugin.approval.request`（`extensions/codex/src/app-server/approval-bridge.ts`）を経由します。Copilot SDK における同等の仕組み、つまり `onPermissionRequest` に到達する `custom-tool` 以外の種別をフェイルクローズで扱う `rejectAllPolicy` は、同じセーフティネットです。実際には、`overridesBuiltInTool: true` によってすべての組み込みツールが置き換えられるため、発火することはありません。

ラップされたツール層が PI と同等のポリシー判断を行えるように、ハーネスは PI の完全な試行ツールコンテキストを `createOpenClawCodingTools` に転送します。これには、アイデンティティ（`senderIsOwner`、`memberRoleIds`、`ownerOnlyToolAllowlist`、...）、チャンネルとルーティング（`groupId`、`currentChannelId`、`replyToMode`、メッセージツールの切り替え）、認証（`authProfileStore`）、実行アイデンティティ（`sandboxSessionKey` から導出される `sessionKey` / `runSessionKey`、`runId`）、モデルコンテキスト（`modelApi`、`modelContextWindowTokens`、`modelCompat`、`modelHasVision`）、実行フック（`onToolOutcome`、`onYield`）が含まれます。これらのフィールドがない場合、所有者専用の許可リストはデフォルトで暗黙的に拒否し、Plugin 信頼ポリシーは正しいスコープを解決できず、`session_status: "current"` は古いサンドボックスキーに解決されます。ブリッジビルダーは `extensions/copilot/src/tool-bridge.ts` にあり、`src/agents/embedded-agent-runner/run/attempt.ts:1262` にある PI の正規呼び出しを反映しています。`runAttempt` は共有の `resolveSandboxContext` シームを通じてサンドボックスコンテキストを解決し、有効な作業ディレクトリを SDK に渡し、`sandbox` とサブエージェント生成用ワークスペースをツールブリッジへ転送します。また、ブリッジは SDK 境界で適用可能な、範囲の限定されたツール構築制御も転送します。具体的には、`includeCoreTools`、ランタイムツール許可リスト、`toolConstructionPlan` です。

また、ブリッジは PI との同等性を保つため、`openclaw/plugin-sdk/agent-harness-tool-runtime` の共有ハーネスツールサーフェスヘルパーを使用します。ツール検索が有効な場合、SDK にはすべての OpenClaw ツールスキーマではなく、コンパクトな制御ツールと非表示のカタログ実行ツールが公開されます。コードモードが有効な場合、ヘルパーは他のエージェントハーネスで使用されるものと同じコードモード制御サーフェスとカタログライフサイクルを構築します。ローカルモデル向けの軽量なデフォルト、ランタイム互換のスキーマフィルタリング、ディレクトリのハイドレーション、カタログのクリーンアップはすべて共有ヘルパー内に留められるため、Copilot と Codex 隣接のハーネス間で差異が生じません。

### セッションレベルの GitHub トークン

Copilot SDK の契約では、**クライアントレベル**の GitHub トークン（`CopilotClientOptions.gitHubToken`、CLI プロセス自体を認証）と、**セッションレベル**のトークン（`SessionConfig.gitHubToken`、そのセッションのコンテンツ除外、モデルルーティング、クォータを決定し、`createSession` と `resumeSession` の両方で使用）を区別しています。ハーネスは `resolveCopilotAuth` を介して認証を一度解決し、認証モードが `gitHubToken` の場合、両方のフィールドを設定します（明示的な `auth.gitHubToken`、または設定済みの `github-copilot` 認証プロファイルから契約に基づいて解決された `resolvedApiKey`）。解決されたモードが `useLoggedInUser` の場合、SDK がログイン済みアイデンティティから引き続きアイデンティティを導出できるよう、セッションレベルのフィールドは省略されます。

`ask_user` は `SessionConfig.onUserInputRequest` を使用します。ブリッジは、固定選択肢のリクエストでは選択肢のインデックスまたはラベルを受け付け、SDK リクエストで許可されている場合は自由形式の回答を受け付けます。また、OpenClaw の試行が中止された場合は、保留中のリクエストをキャンセルします。

## 関連項目

- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [エージェントハーネス Plugin（SDK リファレンス）](/ja-JP/plugins/sdk-agent-harness)
