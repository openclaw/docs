---
read_when:
    - エージェント実行で OpenClaw コードモードを有効にしたい
    - Codex Code モードとコードモードが異なる理由を説明する必要があります
    - exec/wait 契約、QuickJS-WASI サンドボックス、TypeScript 変換、または非表示のツールカタログブリッジをレビューしている
    - 内部 code-mode 名前空間レジストリ統合を追加またはレビューしている
sidebarTitle: Code mode
summary: 'OpenClaw コードモード: QuickJS-WASI と非表示の実行スコープ付きツールカタログに支えられた、オプトインの exec/wait ツールサーフェス'
title: コードモード
x-i18n:
    generated_at: "2026-07-05T11:43:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: da4803ad63634fd0f58adf09d143032fc6740331dab4e0769fae32461812f08c
    source_path: reference/code-mode.md
    workflow: 16
---

コードモードは、実験的なオプトインの OpenClaw エージェントランタイム機能です。有効にすると、モデルは有効化されたすべてのツールスキーマを見るのではなく、その実行では `exec` と `wait` の 2 つのツールだけを見ます。モデルは、隠されたツールカタログを検索、記述、呼び出す小さな JavaScript または TypeScript プログラムを書きます。

このページでは、Codex Code Mode ではなく OpenClaw コードモードについて説明します。この 2 つの機能は名前と、モデルから見える同じツール名（`exec`、`wait`）を共有していますが、別々の実装です。

- Codex Code Mode は Codex コーディングハーネス内で実行されます。その `exec` ツールは freeform-grammar ツールです。モデルは生の JavaScript ソース（任意で実行オプション用の `// @exec: {...}` プラグマ行を前置）を書き、それが Deno/V8 ランタイムで実行されます。
- OpenClaw コードモードは汎用 OpenClaw エージェントランタイムで実行され、`tools.codeMode.enabled: true` が設定されていない限り無効です。その `exec` ツールは JSON の `{ code, language }` ペイロードを受け取り、QuickJS-WASI ワーカーで実行されます。

どちらもシェルコマンドのサーフェスではなく、JavaScript 実行サーフェスです。同じ名前の `exec`/`wait` ツールを公開しているだけの、独立した異なる実装の機能として扱ってください。

## 何をするか

- モデルから見えるツール一覧は、正確に `exec` と `wait` になります。
- `exec` は、モデルが生成した JavaScript または TypeScript を、隔離された QuickJS-WASI ワーカースレッド内で評価します。
- それ以外の有効化されたすべてのツール（OpenClaw コア、Plugin、MCP、クライアント）はモデルプロンプトから隠され、ゲストプログラム内では `ALL_TOOLS` と `tools` を通じて公開されます。
- ゲストコードは隠されたカタログを検索し、ツールのスキーマを記述し、通常のエージェントターンで使われるものと同じ実行経路（ポリシー、承認、フック、テレメトリはすべて引き続き適用）を通じてツールを呼び出します。
- MCP ツールは `MCP` 名前空間の下にグループ化されます。コードモードでは、これがそれらを呼び出す唯一のサポートされた方法です。
- ネストされたツール呼び出しがまだ保留中の場合、`wait` は一時停止されたコードモード実行を再開します。

コードモードが変更するのは、モデル向けのオーケストレーションサーフェスだけです。ツール、Plugin ツール、MCP ツール、認証、承認ポリシー、チャネル動作、モデル選択を置き換えるものではありません。

## 使用する理由

- 小さなプロンプトサーフェス: プロバイダーは、数十または数百の完全なツールスキーマではなく、2 つの制御ツールを受け取ります。
- よりよいオーケストレーション: モデルは 1 つのコードセル内で、ループ、結合、小さな変換、条件ロジック、並列のネストされたツール呼び出しを使用できます。
- プロバイダー中立: プロバイダー固有のコード実行に依存せず、OpenClaw、Plugin、MCP、クライアントツールで動作します。
- フェイルクローズ: コードモードが有効でも QuickJS-WASI ランタイムを利用できない場合、広い直接ツール公開へ暗黙にフォールバックするのではなく、実行は失敗します。

有効化されたツールカタログが大きいエージェント、または回答前にモデルが複数のツールを検索、結合、呼び出す必要があるワークフローで最も有用です。

## 有効化する

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

省略形:

```json5
{
  tools: {
    codeMode: true,
  },
}
```

`tools.codeMode` が省略されている場合、`false` の場合、または `enabled: true` のないオブジェクトの場合、コードモードはオフのままです。

設定済みの MCP サーバーを持つサンドボックス化エージェントを使用する場合は、サンドボックスツールポリシーでバンドルされた MCP Plugin も許可してください。例: `tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`。[設定 - ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy)を参照してください。

より厳密な境界には明示的な制限を設定します。

```json5
{
  tools: {
    codeMode: {
      enabled: true,
      timeoutMs: 10000,
      memoryLimitBytes: 67108864,
      maxOutputBytes: 65536,
      maxSnapshotBytes: 10485760,
      maxPendingToolCalls: 16,
      snapshotTtlSeconds: 900,
      searchDefaultLimit: 8,
      maxSearchLimit: 50,
    },
  },
}
```

デバッグ中にモデルペイロードの形を確認するには、対象を絞ったログを使って Gateway を実行します。

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

コードモードが有効な場合、ログに記録されるモデル向けツール名は `exec` と `wait` である必要があります。短いデバッグセッションで完全な編集済みプロバイダーペイロードを確認するには、`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` を追加します。

## 技術ツアー

このページの残りでは、メンテナー、ツール公開をデバッグする Plugin 作者、高リスクのデプロイを検証する運用者向けに、ランタイム契約と実装の詳細を扱います。

## ランタイム状態

|                     |                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------- |
| ランタイム          | [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi)                               |
| デフォルト状態      | 無効                                                                                        |
| 安定性              | 実験的な OpenClaw サーフェス（Codex Code Mode は別個の安定した Codex ハーネスサーフェス） |
| ターゲットサーフェス | 汎用 OpenClaw エージェント実行                                                              |
| セキュリティ姿勢    | モデルコードは敵対的                                                                        |
| ユーザー向けの約束  | コードモードを有効にしても、広い直接ツール公開へ暗黙にフォールバックすることはありません  |

## スコープ

コードモードは、準備済み実行に対するモデル向けオーケストレーション形状を所有します。モデル選択、チャネル動作、認証、ツールポリシー、ツール実装は所有しません。

スコープ内: モデルから見える `exec`/`wait` 定義、隠されたツールカタログの構築、JavaScript/TypeScript ゲスト実行、QuickJS-WASI ワーカーランタイム、検索/記述/呼び出し用のホストコールバック、一時停止されたゲストプログラムの再開可能状態、出力/タイムアウト/メモリ/保留呼び出し/スナップショット制限、ネストされたツール呼び出しのテレメトリ/軌跡投影。

スコープ外: プロバイダー固有のリモートコード実行、シェル実行セマンティクス、既存のツール認可の変更、永続的なユーザー作成スクリプト、ゲストコード内でのパッケージマネージャー/ファイル/ネットワーク/モジュールアクセス、Codex Code Mode 内部の直接再利用。

リモート Python サンドボックスなどのプロバイダー所有ツールは別のツールです。[コード実行](/ja-JP/tools/code-execution)を参照してください。

## 用語

- **コードモード**: 通常のモデルツールを隠し、`exec` と `wait` だけを公開する OpenClaw ランタイムモード。
- **ゲストランタイム**: モデルコードを評価する QuickJS-WASI JavaScript VM。
- **ホストブリッジ**: ゲストコードから OpenClaw へ戻る、狭い JSON 互換のコールバックサーフェス。
- **カタログ**: 通常のツールポリシー、Plugin、MCP、クライアントツールの解決後に有効となる、実行スコープのツール一覧。
- **ネストされたツール呼び出し**: ホストブリッジを通じてゲストコードから行われるツール呼び出し。
- **スナップショット**: `wait` が一時停止されたコードモード実行を継続できるように保存された、シリアライズ済み QuickJS-WASI VM 状態。

## 設定

`tools.codeMode.enabled` は有効化ゲートです。他のフィールドを設定しても、それだけでは機能は有効になりません。

| フィールド              | デフォルト                     | クランプ                                        |
| ---------------------- | ------------------------------ | ----------------------------------------------- |
| `enabled`              | `false`                        | boolean。`true` のみがコードモードを有効化      |
| `runtime`              | `"quickjs-wasi"`               | サポートされる唯一の値                          |
| `mode`                 | `"only"`                       | `exec`/`wait` を公開し、通常のモデルツールを隠す |
| `languages`            | `["javascript", "typescript"]` | 2 つの任意のサブセット                          |
| `timeoutMs`            | `10000`                        | `100`-`60000`                                   |
| `memoryLimitBytes`     | `67108864`                     | `1048576`-`1073741824`                          |
| `maxOutputBytes`       | `65536`                        | `1024`-`10485760`                               |
| `maxSnapshotBytes`     | `10485760`                     | `1024`-`268435456`                              |
| `maxPendingToolCalls`  | `16`                           | `1`-`128`                                       |
| `snapshotTtlSeconds`   | `900`                          | `1`-`86400`                                     |
| `searchDefaultLimit`   | `8`                            | `maxSearchLimit` にクランプ                     |
| `maxSearchLimit`       | `50`                           | `1`-`50`                                        |

コードモードが有効でも QuickJS-WASI をロードできない場合、OpenClaw はその実行についてフェイルクローズします。フォールバックとして通常のツールを暗黙に公開することはありません。

## アクティベーション

コードモードは、有効なツールポリシーが判明した後、最終的なモデルリクエストが組み立てられる前に評価されます。

1. エージェント、モデル、プロバイダー、サンドボックス、チャネル、送信者、実行ポリシーを解決します。
2. 対象となる Plugin、MCP、クライアントツールを追加して、有効な OpenClaw ツール一覧を構築します。
3. 許可/拒否ポリシーを適用します。
4. `tools.codeMode.enabled` が false の場合、通常のツール公開を続行します。
5. 有効で、実行でツールがアクティブな場合、有効なツールをコードモードカタログに登録します。
6. モデルから見える一覧からすべての通常ツールを削除し、`exec` と `wait` を追加します。

意図的にツールを持たない実行（生のモデル呼び出し、`disableTools: true`、または空の `tools.allow` 一覧）は、`tools.codeMode.enabled: true` が設定されていてもコードモードサーフェスを有効化しません。コードモードと OpenClaw Tool Search は、1 つの実行では相互排他的です。コードモードが有効化されると、Tool Search の Compaction は行われません。

コードモードカタログは実行スコープであり、別のエージェント、セッション、送信者、実行からツールが漏れてはなりません。

## モデルから見えるツール

コードモードが有効な場合、モデルは正確に `exec` と `wait` を見ます。それ以外のすべての有効化されたツールは、モデル向けツール一覧から隠され、コードモードカタログに登録されます。

ツールオーケストレーション、データ結合、ループ、並列のネストされた呼び出し、構造化変換には `exec` を使用します。`wait` は、`exec` が再開可能な `waiting` 結果を返した場合にのみ使用します。

## `exec`

`exec` はコードモードセルを開始し、1 つの結果を返します。入力コードはモデルが生成したものであり、敵対的なものとして扱う必要があります。

入力:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

ルール:

- `code` または `command` のどちらか一方は空でない必要があります。
- `code` はドキュメント化されたモデル向けフィールドです。
- `command` は、フックポリシーと信頼済みの書き換え用に exec 互換のエイリアスとして受け入れられます（通常の OpenClaw シェル exec ツールも `command` フィールドを使用します）。両方が存在する場合、値は一致している必要があります。
- `language` のデフォルトは `"javascript"` です。一部のプロバイダーはそれらの形状を拒否するため、スキーマでは `oneOf`/`anyOf` ユニオンではなく、フラットな文字列 enum（`"javascript" | "typescript"`）として公開されます。
- `language` が `"typescript"` の場合、OpenClaw は評価前にトランスパイルします。
- `exec` は `import`、`require`、動的 import、モジュールローダーパターンを拒否します。
- `exec` は通常のシェル `exec` 実装を再帰的に公開することはありません。
- 外側のコードモード `exec` フックイベントは `toolKind: "code_mode_exec"` と `toolInputKind: "javascript" | "typescript"`（既知の場合）を持つため、ポリシーは同じツール名を共有するシェル形式の `exec` 呼び出しとコードモードセルを区別できます。

結果:

```typescript
type CodeModeResult = CodeModeCompletedResult | CodeModeWaitingResult | CodeModeFailedResult;

type CodeModeCompletedResult = {
  status: "completed";
  value: unknown;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeWaitingResult = {
  status: "waiting";
  runId: string;
  reason: "pending_tools" | "yield";
  pendingToolCalls?: CodeModePendingToolCall[];
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeFailedResult = {
  status: "failed";
  error: string;
  code?: CodeModeErrorCode;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};
```

`exec` は、QuickJS VM が再開可能な状態で中断し、モデルに見える継続がまだ必要な場合に `waiting` を返します。結果には `wait` 用の `runId` が含まれます。MCP 名前空間呼び出しを含む名前空間ブリッジ呼び出しは、準備ができている間、同じ `exec`/`wait` 呼び出し内で自動的にドレインされるため、コンパクトなコードブロックは、名前空間の await ごとにモデルツール呼び出しを 1 回強制することなく MCP ツールを呼び出せます。

`exec` は、ゲスト VM に保留中の作業がなく、OpenClaw の出力アダプターが実行された後の最終値が JSON 互換である場合にのみ `completed` を返します。

## `wait`

`wait` は、中断されたコードモード VM を継続します。

入力:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

出力は `exec` が返す同じ `CodeModeResult` ユニオンです。

`wait` が存在するのは、ネストされた OpenClaw ツールが低速、対話式、承認ゲート付き、または部分的な更新をストリームする可能性があり、ホストが外部作業を待つ間、モデルが 1 つの長い `exec` 呼び出しを開いたままにする必要がないようにするためです。

QuickJS-WASI のスナップショット/復元が再開メカニズムです。

1. `exec` は、完了、失敗、または中断までコードを評価します。
2. 中断時に、OpenClaw は QuickJS VM のスナップショットを取得し、保留中のホスト作業を記録します。
3. 保留中の作業が確定すると、`wait` は VM スナップショットを復元し、安定した名前でホストコールバックを再登録します。
4. OpenClaw はネストされたツール結果を復元された VM に届け、QuickJS の保留中ジョブをドレインします。
5. `wait` は `completed`、`failed`、または別の `waiting` 結果を返します。

スナップショットはランタイム状態であり、ユーザーの成果物ではありません。プロセス内マップにのみ存在し (データベースやディスクへの書き込みはありません)、サイズ制限があり、期限切れになり、作成元の実行とセッションにスコープされます。

`wait` は次の場合に (`failed` 結果として) 失敗します。

- `runId` が不明、またはそのスナップショットがすでに期限切れである。
- 呼び出し元が、中断された実行と同じ実行/セッションスコープ内にいない。
- その `runId` に対して `wait` がすでに実行中である。
- QuickJS-WASI の復元に失敗する。
- 再開すると `maxOutputBytes` または `maxSnapshotBytes` を超える。

## ゲストランタイム API

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` は、実行スコープのカタログ用のコンパクトなメタデータです。デフォルトでは完全なスキーマを含みません。

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "mcp" | "client";
  sourceName?: string;
};
```

Plugin ツールは `source: "openclaw"` を使用し、所有する Plugin id を `sourceName` に設定します。別個の `"plugin"` ソース値はありません。`source: "mcp"` は、`sourceName`/`mcp` メタデータ内の MCP エントリにのみ使用されます (また、`ALL_TOOLS`/`tools.*` からフィルターされます。以下を参照)。

完全なスキーマは必要時にのみ読み込まれます。

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
};
```

カタログヘルパー:

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

便利なツール関数は、曖昧さのない安全な名前に対してのみインストールされます。

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// If the hidden catalog has an unambiguous `web_search` entry:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

MCP カタログエントリは、コードモードでは `tools.call(...)` や便利関数から呼び出すことはできません。生成された `MCP` 名前空間を通じてのみ公開されます。TypeScript 形式の宣言ファイルは読み取り専用の `API` 仮想ファイルサーフェスから利用できるため、エージェントは MCP スキーマをプロンプトに追加せずに MCP シグネチャを調べられます。

```typescript
const files = await API.list("mcp");
const githubApi = await API.read("mcp/github.d.ts");

const issue = await MCP.github.createIssue({
  owner: "openclaw",
  repo: "openclaw",
  title: "Investigate gateway logs",
});

const snapshot = await MCP.chromeDevtools.takeSnapshot({ output: "markdown" });
const resource = await MCP.docs.resources.read({ uri: "memo://one" });
const prompt = await MCP.docs.prompts.get({
  name: "brief",
  arguments: { topic: "release" },
});
```

`API.read("mcp/<server>.d.ts")` は、MCP ツールメタデータから推論されたコンパクトな宣言を返します。

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** Return this TypeScript-style API header. */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * Create a GitHub issue.
   * @param owner Repository owner
   * @param repo Repository name
   * @param title Issue title
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

宣言ファイルは仮想であり、ワークスペースや状態ディレクトリには書き込まれません。コードモードの各 `exec` 呼び出しについて、OpenClaw は実行スコープのツールカタログを構築し、表示可能な MCP エントリを保持し、表示可能なサーバーごとに `mcp/index.d.ts` と 1 つの `mcp/<server>.d.ts` をレンダーし、その小さな読み取り専用テーブルを QuickJS ワーカーに注入します。ゲストコードに見えるのは `API` オブジェクトのみです。`API.list(prefix?)` はファイルメタデータを返し、`API.read(path)` は選択された宣言コンテンツを返します。不明なパスおよび `.`/`..` セグメントは拒否されます。

これにより、大きな MCP スキーマをモデルプロンプトから除外できます。エージェントは `exec` ツールの説明から仮想 API が存在することを知り、必要な宣言ファイルだけを読み取り、その後 1 つのオブジェクト引数で `MCP.<server>.<tool>()` を呼び出します。`MCP.<server>.$api()` は、プログラム内で単一ツールのスキーマ応答を得るためのインラインフォールバックとして引き続き利用できます。

ゲストランタイムがホストオブジェクトを直接見ることはありません。入力と出力は、明示的なサイズ上限付きの JSON 互換値としてブリッジを越えます。

## 内部名前空間

内部名前空間は、モデルに見えるツールを増やさずに、コードモードへ簡潔なドメイン API を提供します。ローダー所有のインテグレーションが `Issues` や `Calendar` などの名前空間を登録します。その後ゲストコードは QuickJS プログラム内でその名前空間を呼び出し、モデルには引き続き `exec` と `wait` だけが見えます。

名前空間は現時点では内部用です。公開 Plugin SDK 名前空間 API はありません。外部 Plugin 名前空間には、Plugin のアイデンティティ、インストール済みマニフェスト、認証状態、キャッシュされたカタログ記述子が、その名前空間を支える Plugin ツールからずれないようにするため、ローダー所有の契約が必要です。コアコードモードが所有するのは、サンドボックス、シリアライズ、カタログゲート、ブリッジディスパッチのみです。

ゲストコードは、直接のグローバルまたは `namespaces` マップのどちらも使用できます。

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### レジストリライフサイクル

名前空間レジストリはプロセスローカルで、名前空間 id をキーにします。

1. 信頼済みローダーが `registerCodeModeNamespaceForPlugin(pluginId, registration)` を呼び出します。
2. コードモードは、実行用の隠し `ToolSearchRuntime` を作成し、その実行スコープのカタログを読み取ります。
3. `createCodeModeNamespaceRuntime(ctx, catalog)` は、`requiredToolNames` がすべて表示可能で、同じ `pluginId` に所有されている登録だけを保持します。
4. 表示可能な各名前空間は、現在の実行に対して `createScope(ctx)` を呼び出し、`agentId`、`sessionKey`、`sessionId`、`runId`、config、中止状態などの実行コンテキストを受け取ります。
5. スコープデータはプレーンな記述子にシリアライズされ、直接のグローバルおよび `namespaces.<globalName>` として QuickJS に注入されます。
6. ゲスト呼び出しはワーカーブリッジを通じて中断し、ホスト上で名前空間パスを解決し、その呼び出しを宣言済みの Plugin 所有カタログツールにマップし、`ToolSearchRuntime.callExactId` を通じてそのツールを実行します。
7. 準備ができている名前空間ブリッジ呼び出しは、アクティブな `exec`/`wait` 呼び出し内で自動的にドレインされます。タイムアウト時に名前空間作業がまだ保留中の場合、またはゲストが明示的に yield した場合、`wait` が後で同じ名前空間ランタイムを再開します。
8. Plugin のロールバックまたはアンインストールは `clearCodeModeNamespacesForPlugin(pluginId)` を呼び出し、失敗した Plugin ロード後に古いグローバルが残らないようにします。

名前空間呼び出しはカタログツール呼び出しです。`tools.call(...)` と同じポリシーフック、承認、中止処理、テレメトリ、トランスクリプト投影、中断/再開動作を使用します。

### 登録形状

バッキングツールを所有するインテグレーションから名前空間を登録します。スコープは小さく保ち、宣言済みカタログツールにマップするドメイン動詞だけを公開してください。

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "GitHub issue helpers for the current repository.",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "Use Issues.list(params) and Issues.update(number, patch).",
  createScope: (ctx) => ({
    repository: ctx.config,
    list: createCodeModeNamespaceTool("github_list_issues", ([params]) => params ?? {}),
    update: createCodeModeNamespaceTool("github_update_issue", ([number, patch]) => ({
      number,
      patch,
    })),
  }),
});
```

`createCodeModeNamespaceTool(toolName, inputMapper)` は、スコープメンバーを呼び出し可能な名前空間関数としてマークします。任意の `inputMapper` はゲスト引数を受け取り、バッキングカタログツール用の入力オブジェクトを返します。指定しない場合は、最初のゲスト引数が使用され、未指定時は `{}` になります。

生のホスト関数は、ゲストコードが実行される前に拒否されます。

```typescript
createScope: () => ({
  // Wrong: this bypasses the catalog tool lifecycle and will be rejected.
  list: async () => githubClient.listIssues(),
});
```

### 所有権と可視性

名前空間の所有権は、登録呼び出し元の `pluginId` に結び付けられます。`requiredToolNames` は可視性ゲートであると同時に所有権チェックでもあります。

- 必須ツールはすべて実行カタログ内に存在しなければならない
- 必須ツールはすべて `sourceName === pluginId` でなければならない
- 必須ツールが存在しない、または別の Plugin に所有されている場合、名前空間は非表示になる
- 各呼び出し可能パスは、`requiredToolNames` に含まれる名前のツールのみを対象にできる

これにより、別の Plugin が同名ツールを登録して名前空間を公開することを防ぎ、名前空間を通常のエージェントポリシーと整合させます。実行がバッキングツールを見られない場合、その名前空間も見られません。

たとえば、GitHub 名前空間は、GitHub 認証、REST/GraphQL クライアント、レート制限、書き込み承認、テストを所有する GitHub 所有の Plugin の背後に置くべきです。コアコードモードは、GitHub 固有の API、トークン処理、プロバイダーポリシーを埋め込むべきではありません。

### スコープシリアライズルール

`createScope(ctx)` は、JSON 互換値、配列、ネストされたオブジェクト、`createCodeModeNamespaceTool(...)` 呼び出しマーカーを含むプレーンオブジェクトを返せます。ホストオブジェクトが QuickJS に直接入ることはありません。

シリアライザーは次を拒否します。

- 生の関数
- 循環オブジェクトグラフ
- 安全でないパスセグメント: `__proto__`、`constructor`、`prototype`、空キー、または内部パス区切り文字を含むキー
- JavaScript 識別子ではない `globalName` 値
- `tools`、`namespaces`、`text`、`json`、`yield_control`、`MCP`、`API`、`ALL_TOOLS`、`__openclaw*` などの組み込みコードモードグローバルとの `globalName` 衝突

JSON にシリアライズできない値は、ブリッジを越える前に JSON セーフなフォールバック値へ変換されます。バイナリデータ、ハンドル、ソケット、クライアント、クラスインスタンスは、通常のカタログツールの背後に留めてください。

### プロンプト

名前空間の `description` と任意の `prompt` は、その実行で名前空間が表示される場合にのみ、モデルに表示される `exec` スキーマへ追加されます。最小限で有用なサーフェスを教えるために使います。

```typescript
{
  description: "Fiction production service helpers.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status), and Fictions.unpaidOver(amount).",
}
```

プロンプトは、認証セットアップ、実装履歴、無関係なPlugin動作ではなく、名前空間の契約に関するものにしてください。

### クリーンアップ

名前空間はプロセスローカルな登録です。所有元のPluginが無効化、アンインストール、またはロールバックされたら削除します。

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

コードモードのクリーンアップはPluginが所有します。名前空間ごとのティアダウンハンドルを保持するのではなく、ライフサイクルが終了したときにそのPluginの名前空間登録をクリアしてください。テストでは `clearCodeModeNamespacesForTest()` を呼び出して、ケース間で登録が漏れるのを避けられます。

### テストチェックリスト

名前空間の変更では、セキュリティ境界とゲストの動作をカバーする必要があります。

- 名前空間のプロンプトテキストは、裏付けとなるツールが表示されている場合にのみ現れる
- 別の `sourceName` にある同名ツールは名前空間を公開しない
- 生のスコープ関数は拒否される
- 偽造された名前空間 ID と偽造されたパスは拒否される
- 呼び出し可能なパスは未宣言のツールを対象にできない
- ネストされたオブジェクトと共有参照が正しくシリアライズされる
- 名前空間呼び出しはカタログツールを通じて実行され、JSON セーフな詳細を返す
- 失敗はゲストコードで捕捉できる
- 中断された名前空間呼び出しは `wait` を通じて再開される
- Pluginのロールバックは所有元の名前空間登録をクリアする

名前空間は汎用の `tools.search`/`tools.call` カタログを補完します。任意の有効化済みOpenClaw、Plugin、クライアントツールにはカタログを使い、MCP ツールには `MCP` を使い、繰り返しスキーマを検索するより簡潔なコードのほうが信頼できる、Plugin所有の文書化されたドメイン API には他の名前空間を使います。

## 出力 API

- `text(value)` は人間が読める出力を `output` 配列に追加します。
- `json(value)` は JSON 互換のシリアライズ後に構造化された出力項目を追加します。
- ゲストコードの最終戻り値は、`completed` 結果内の `value` になります。

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

ルール: 出力順はゲストの呼び出しと一致します。出力は `maxOutputBytes` で上限設定されます。シリアライズできない値はプレーン文字列またはエラーに変換されます。バイナリ値はサポートされません。画像とファイルは通常のOpenClawツールを通じて渡され、コードモードブリッジは通りません。

## ツールカタログ

隠しカタログには、有効なポリシーフィルタリング後のツールが次の順序で含まれます。OpenClawコアツール、バンドルPluginツール、外部Pluginツール、MCP ツール、その後に現在の実行向けのクライアント提供ツールです。

カタログ ID は 1 回の実行内で安定しており、可能な場合は同等のツールセット間で決定的です。実際の形状:

```text
<source>:<owner>:<tool-name>
```

ここで `<source>` は `openclaw`、`mcp`、または `client` です（Pluginツールは `<owner>` としてPlugin ID を持つ `openclaw` を使い、コアツールは `openclaw:core:*` を使います）。例:

```text
openclaw:core:message
openclaw:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

カタログはコードモード制御ツールを省略します: `exec`、`wait`、`tool_search_code`、`tool_search`、`tool_describe`、`tool_call`。これにより再帰を防ぎ、モデル向けの契約を狭く保ちます。

MCP エントリは実行スコープのカタログに残るため、ポリシー、承認、フック、テレメトリ、トランスクリプト投影、正確なツール ID が通常のツール実行と共有されます。ゲスト向けの `ALL_TOOLS`、`tools.search(...)`、`tools.describe(...)`、`tools.call(...)` ビューでは MCP エントリを省略します。生成された `MCP.<server>.<tool>({ ...input })` 名前空間は正確なカタログ ID に解決され、同じエグゼキュータパスを通じてディスパッチされます。

## ツール検索との相互作用

コードモードは、有効な実行ではOpenClawのツール検索モデルサーフェスに取って代わります。

`tools.codeMode.enabled` が true でコードモードがアクティブ化されると:

- OpenClaw は `tool_search_code`、`tool_search`、`tool_describe`、または `tool_call` をモデルに表示されるツールとして公開しない。
- 同じカタログ化の考え方がゲストランタイム内へ移る。
- ゲストランタイムは、非 MCP ツール向けにコンパクトな `ALL_TOOLS` メタデータと検索/説明/呼び出しヘルパーを受け取る。
- MCP 呼び出しは、`tools.call(...)` ではなく、生成された `MCP` 名前空間とその `$api()` ヘッダーを使う。
- ネストされた呼び出しは、ツール検索が使うのと同じOpenClawエグゼキュータパスを通じてディスパッチされる。

有効な実行でコードモードが取って代わるOpenClawのコンパクトカタログブリッジについては、[ツール検索](/ja-JP/tools/tool-search)を参照してください。

## ツール名と衝突

モデルに表示される `exec` ツールはコードモードツールです。通常のOpenClawシェル `exec` ツールが有効な場合、それはモデルから隠され、他のツールと同様にカタログ化されます。

ゲストランタイム内では:

- ポリシーで許可されていれば、`tools.call("openclaw:core:exec", input)` はシェル exec ツールを呼び出せる。
- `tools.exec(...)` は、シェル exec カタログエントリに曖昧でない安全な名前がある場合にのみインストールされる。
- コードモードの `exec` ツールは、`tools` を通じて再帰的に利用できない。

2 つのツールが同じ安全な利便名に正規化される場合、OpenClaw は利便関数を省略し、`tools.call(id, input)` を要求します。

## ネストされたツール実行

すべてのネストされたツール呼び出しはホストブリッジを越えてOpenClawに再入し、次を保持します: アクティブなエージェント ID、セッション ID とキー、送信者とチャネルのコンテキスト、サンドボックスポリシー、承認ポリシー、Plugin `before_tool_call` フック、中止シグナル、利用可能な場合のストリーミング更新、軌跡/監査イベント。

ネストされた呼び出しは実際のツール呼び出しとしてトランスクリプトに投影されるため、サポートバンドルは何が起きたかを示せます。この投影では、親のコードモードツール呼び出しとネストされたツール ID が識別されます。

並列のネストされた呼び出しは、`maxPendingToolCalls` まで許可されます。

## 実行とスナップショットのライフサイクル

各コードモード実行は、`runId` をキーとするプロセス内マップで追跡されます（ディスクやデータベースには永続化されません）。`exec`/`wait` は、`completed`、`waiting`、`failed` の 3 つの結果ステータスのいずれかを返します。

- `waiting` 結果は、`wait` が再開するか期限切れになるまで、QuickJS スナップショット、保留中のブリッジリクエスト、スコープメタデータ（エージェント実行 ID、セッション ID/キー）を保存する。
- 期限切れ、セッション違い、実行違い、不明/すでに再開中の `runId` 値は、個別の終端ステータスを生成しない。`code mode run is unavailable or expired.` や `code mode run belongs to a different session.` のようなメッセージを伴う `failed` 結果（`code: "invalid_input"`）として表面化する。
- 実行のスナップショットは、`completed` または `failed` に落ち着いた時点でマップから削除されるか、Gateway シャットダウン時に破棄される（再起動後には設計上何も残らない。これは一時的なランタイム状態）。
- OpenClaw はプロセスごとの同時中断実行数を 64 に制限し、その上限を超える新しい中断を `too many suspended code mode runs.` で拒否する。

スナップショットストレージは、実行ごとの `maxSnapshotBytes`、上記のプロセスごとの中断実行数上限、`snapshotTtlSeconds` によって制限されます。

## QuickJS-WASI ランタイム

OpenClaw は所有パッケージの直接依存関係として `quickjs-wasi` を読み込みます。無関係な依存関係のためにインストールされた推移的コピーには依存しません。

ランタイムの責務: QuickJS-WASI WebAssembly モジュールをコンパイル/読み込みする。コードモード実行または再開ごとに 1 つの分離 VM を作成する。安定した名前でホストコールバックを登録する。メモリ制限と割り込み制限を設定する。JavaScript を評価する。保留中のジョブを排出する。中断された VM 状態をスナップショット化する。`wait` 用にスナップショットを復元する。終端状態後に VM ハンドルとスナップショットを破棄する。

ランタイムはOpenClawのメインイベントループの外側、Node.js ワーカースレッド内で実行されます。ゲストの無限ループが Gateway プロセスを無期限にブロックしてはなりません。ワーカーの割り込みハンドラーは、ゲストコードの協調とは独立して、実時間タイムアウトを強制します。

## TypeScript

TypeScript サポートはソース変換のみです。受け付ける入力は 1 つのTypeScriptコード文字列で、出力は QuickJS-WASI によって評価されるJavaScript文字列です。型チェック、モジュール解決、`import`/`require` はありません。診断は `failed` 結果として返されます。

TypeScript コンパイラはTypeScriptセルに対してのみ遅延読み込みされます。プレーンJavaScriptセルと無効化されたコードモードでは読み込まれません。

## セキュリティ境界

モデルコードは敵対的です。ランタイムは多層防御を使います。

- メインイベントループの外側、ワーカースレッド内で QuickJS-WASI を実行する
- Codex や推移的パッケージ経由ではなく、直接依存関係として `quickjs-wasi` を読み込む
- ゲスト内にファイルシステム、ネットワーク、サブプロセス、モジュール import、環境変数、ホストグローバルオブジェクトはない
- QuickJS のメモリ制限と割り込み制限に加え、親プロセスの実時間タイムアウトを使う
- 出力、スナップショット、ログ、保留中呼び出しの上限を強制する
- 狭い JSON アダプターを通じてホストブリッジ値をシリアライズする
- ホストエラーをプレーンなゲストエラーに変換し、ホストレルムのオブジェクトは渡さない
- タイムアウト、中止、セッション終了、期限切れ時にスナップショットを破棄する
- `exec`、`wait`、ツール検索制御ツールへの再帰アクセスを拒否する
- 利便名の衝突がカタログヘルパーをシャドーイングするのを防ぐ

サンドボックスは 1 つのセキュリティ層です。高リスクのデプロイでは、運用者が OS レベルの強化を必要とする場合があります。

## エラーコード

```typescript
type CodeModeErrorCode =
  | "invalid_input"
  | "runtime_unavailable"
  | "timeout"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "internal_error";
```

`invalid_input` は、不正な `exec`/`wait` 引数、無効化された言語、拒否されたモジュールアクセス、TypeScript 変換失敗、不明/期限切れ/スコープ違いの `runId` 値、過剰な中断実行をカバーします。`runtime_unavailable` は、QuickJS ワーカーが起動に失敗するか、非ゼロで終了する場合をカバーします。

ゲストに返されるエラーはプレーンデータです。ホストの `Error` インスタンス、スタックオブジェクト、プロトタイプ、ホスト関数は QuickJS に入りません。

## テレメトリ

各結果の `telemetry` フィールドは、隠しカタログサイズとソース別内訳（`openclaw`/`mcp`/`client` の件数）、実行カタログに対する累積の検索/説明/呼び出し件数、モデルに表示されるツール名（`exec`、`wait`）を報告します。

テレメトリには、既存のOpenClaw軌跡ポリシーを超える秘密情報、生の環境値、未編集のツール入力を含めてはなりません。

## デバッグ

コードモードが通常のツール実行と異なる動作をする場合は、対象を絞ったモデル転送ログを使います。

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

ペイロード形状のデバッグには、`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` を使います。これは、モデルリクエストの上限付きで編集済みの JSON スナップショットをログに記録します。プロンプトやメッセージテキストがまだ現れる可能性があるため、デバッグ中のみ使ってください。

ストリームのデバッグには、`OPENCLAW_DEBUG_SSE=peek` を使って最初の 5 件の編集済み SSE イベントをログに記録します。コードモードのサーフェスがアクティブ化された後、最終的なプロバイダーペイロードに `exec` と `wait` が正確に含まれていない場合、コードモードもフェイルクローズします。

## 実装レイアウト

- config 契約: `tools.codeMode`
- カタログビルダー: 有効なツールをコンパクトエントリと ID マップへ
- モデルサーフェスアダプター: 表示ツールを `exec` と `wait` に置き換える
- QuickJS-WASI ランタイムアダプター: 読み込み、eval、スナップショット、復元、破棄
- ワーカースーパーバイザー: タイムアウト、中止、クラッシュ分離
- ブリッジアダプター: JSON セーフなホストコールバックと結果配信
- TypeScript 変換アダプター
- スナップショットストア: TTL、サイズ上限、実行/セッションスコープ
- ネストされたツール呼び出しの軌跡投影
- テレメトリカウンターと診断

実装はツール検索のカタログとエグゼキュータの概念を再利用しますが、サンドボックスとして `node:vm` 子プロセスは使いません。

## 検証チェックリスト

コードモードのカバレッジでは、次を証明する必要があります。

- 無効な設定では、既存のツール公開は変更されない
- `enabled: true` のないオブジェクト設定では、コードモードは無効のままになる
- 有効な設定では、実行中にツールがアクティブな場合、モデルには `exec` と `wait` のみが公開される
- 生のツールなし実行、`disableTools`、空の許可リストは、コードモードのペイロード強制をトリガーしない
- 有効な非 MCP ツールはすべて `ALL_TOOLS` に表示される
- 拒否されたツールは `ALL_TOOLS` に表示されない
- `tools.search`、`tools.describe`、`tools.call` は OpenClaw ツールで動作する
- `API.list("mcp")` と `API.read("mcp/<server>.d.ts")` は、ブリッジやツール呼び出しなしで TypeScript 形式の MCP 宣言を公開する
- MCP 名前空間 `$api()` は、スキーマ用のインラインフォールバックとして引き続き利用できる
- MCP 名前空間呼び出しは、1 つのオブジェクト入力を持つ可視 MCP ツールで動作する一方、直接の MCP カタログエントリは `tools.*` には存在しない
- ツール検索の制御ツールは、モデルサーフェスと非表示カタログの両方から隠される
- ネストされた呼び出しは承認とフックの動作を保持する
- シェル `exec` はモデルからは隠されるが、許可されている場合はカタログ ID で呼び出せる
- 再帰的なコードモードの `exec` と `wait` はゲストコードから呼び出せない
- TypeScript 入力は、無効なパスまたは JavaScript のみのパスで TypeScript を読み込まずに変換および評価される
- `import`、`require`、ファイルシステム、ネットワーク、環境へのアクセスは失敗する
- 無限ループはタイムアウトし、Gateway をブロックできない
- メモリ上限の失敗はゲスト VM を終了する
- 完了した呼び出しと一時停止された呼び出しの両方で、出力とスナップショットの上限が強制される
- `wait` は一時停止されたスナップショットを再開し、最終値を返す
- 期限切れ、中止済み、セッション違い、不明な `runId` 値は失敗する
- トランスクリプトのリプレイと永続化は、コードモードの制御呼び出しを保持する
- トランスクリプトとテレメトリには、ネストされたツール呼び出しが明確に表示される

## E2E テスト計画

ランタイムを変更するときは、これらを統合テストまたはエンドツーエンドテストとして実行する:

1. `tools.codeMode.enabled: false` で Gateway を起動する。
2. 小さな直接ツールセットを含むエージェントターンを送信する。
3. モデルに表示されるツールが変更されていないことをアサートする。
4. `tools.codeMode.enabled: true` で再起動する。
5. OpenClaw、Plugin、MCP、クライアントテストツールを含むエージェントターンを送信する。
6. モデルに表示されるツールリストが正確に `exec`、`wait` であることをアサートする。
7. `exec` 内で `ALL_TOOLS` を読み取り、有効なテストツールが存在することをアサートする。
8. `exec` 内で、`tools.search`、`tools.describe`、`tools.call` を通じて OpenClaw/Plugin/クライアントツールを呼び出す。
9. `exec` 内で `API.list("mcp")` と `API.read("mcp/<server>.d.ts")` を呼び出し、宣言ファイルが可視 MCP ツールを記述していることをアサートする。
10. `exec` 内で `MCP.<server>.<tool>({ ...input })` を通じて MCP ツールを呼び出し、直接の MCP カタログエントリが `ALL_TOOLS` と `tools.*` に存在しないことをアサートする。
11. 拒否されたツールが存在せず、推測した ID では呼び出せないことをアサートする。
12. `exec` が `waiting` を返した後に解決されるネストされたツール呼び出しを開始する。
13. `wait` を呼び出し、復元された VM がツール結果を受け取ることをアサートする。
14. 最終回答に、復元後に生成された出力が含まれることをアサートする。
15. タイムアウト、中止、スナップショット期限切れがランタイム状態をクリーンアップすることをアサートする。
16. 軌跡をエクスポートし、ネストされた呼び出しが親のコードモード呼び出しの下に表示されることをアサートする。

このページへのドキュメントのみの変更でも、`pnpm check:docs` を実行する必要がある。

## 関連

- [ツール検索](/ja-JP/tools/tool-search)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [Exec ツール](/ja-JP/tools/exec)
- [コード実行](/ja-JP/tools/code-execution)
