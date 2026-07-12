---
read_when:
    - エージェント実行で OpenClaw コードモードを有効にしたい場合
    - コードモードが Codex Code mode と異なる理由を説明する必要があります
    - コンパクトなツールコントラクト、QuickJS-WASI サンドボックス、TypeScript 変換、または非表示のツールカタログブリッジをレビューしています
    - 内部のコードモード名前空間レジストリ統合を追加またはレビューしています
sidebarTitle: Code mode
summary: OpenClaw コードモード：QuickJS-WASI と非表示の実行スコープ付きツールカタログを基盤とする、オプトイン方式のコンパクトなツールサーフェス
title: コードモード
x-i18n:
    generated_at: "2026-07-12T14:48:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eb69afba5b1b204a78de0ccaf5f93922588db22ff8ee3faf40cc65af6c22f6be
    source_path: reference/code-mode.md
    workflow: 16
---

コードモードは、実験的なオプトイン式の OpenClaw エージェントランタイム機能です。有効にすると、
モデルには有効なすべてのツールスキーマが表示されなくなり、代わりに
`exec`、`wait`、および構造化された結果を JSON 専用のゲストブリッジ経由で渡せない
direct-only ツールのみが表示されます。モデルは、非表示のツールカタログを検索し、説明し、
呼び出す小さな JavaScript または TypeScript プログラムを記述します。

このページでは、Codex Code Mode ではなく OpenClaw コードモードについて説明します。2 つの機能は
同じ名前と同じ制御ツール名（`exec`、`wait`）を共有しますが、
実装は別々です。

- Codex Code Mode は Codex コーディングハーネス内で動作します。その `exec` ツールは
  自由形式文法のツールです。モデルが生の JavaScript ソースを記述し（必要に応じて
  実行オプション用の `// @exec: {...}` プラグマ行を先頭に付加）、それが
  Deno/V8 ランタイムで実行されます。
- OpenClaw コードモードは汎用 OpenClaw エージェントランタイムで動作し、
  `tools.codeMode.enabled: true` が設定されていない限り無効です。その `exec`
  ツールは JSON の `{ code, language }` ペイロードを受け取り、QuickJS-WASI
  ワーカーで実行します。

どちらも JavaScript 実行サーフェスであり、シェルコマンド実行サーフェスではありません。これらは、
たまたま同じ名前の `exec`/`wait` ツールを公開している、
独立した異なる実装の機能として扱ってください。

## 機能

- モデルに表示されるツールリストは `exec`、`wait`、および画像結果をゲストブリッジ経由で
  渡せない `computer` などの direct-only ツールになります。
- `exec` は、分離された QuickJS-WASI ワーカースレッド内で、モデルが生成した JavaScript または TypeScript を
  評価します。
- カタログ対象となる有効なすべてのツール（OpenClaw コア、Plugin、MCP、クライアント）は
  モデルプロンプトから非表示になり、ゲストプログラム内で `ALL_TOOLS`
  および `tools` を通じて公開されます。
- ゲストコードは非表示のカタログを検索し、ツールのスキーマを説明し、通常のエージェントターンと
  同じ実行パスを通じてツールを呼び出します（ポリシー、
  承認、フック、テレメトリはすべて引き続き適用されます）。
- MCP ツールは `MCP` 名前空間の下にグループ化されます。コードモードでは、
  これが MCP ツールを呼び出す唯一のサポート対象の方法です。
- ネストされたツール呼び出しがまだ保留中の場合、`wait` は中断されたコードモード実行を
  再開します。

コードモードが変更するのは、モデル向けのオーケストレーションサーフェスのみです。ツール、
Plugin ツール、MCP ツール、認証、承認ポリシー、チャネルの
動作、モデル選択を置き換えるものではありません。

## 使用する理由

- プロンプトサーフェスの縮小：プロバイダーには、数十または数百の完全なツールスキーマではなく、
  2 つの制御ツールと、必要な少数の直接ツールのみが渡されます。
- オーケストレーションの向上：モデルは 1 つのコードセル内で、ループ、結合、小規模な変換、
  条件ロジック、並列のネストされたツール呼び出しを使用できます。
- プロバイダー非依存：プロバイダー固有のコード実行に依存せず、
  OpenClaw、Plugin、MCP、クライアントツールで動作します。
- フェイルクローズ：コードモードが有効でも QuickJS-WASI ランタイムを
  利用できない場合、広範な直接ツール公開へ暗黙的にフォールバックせず、
  実行は失敗します。

有効なツールカタログが大規模なエージェントや、モデルが回答前に
複数のツールを検索、組み合わせ、呼び出す必要があるワークフローで最も有用です。

## 有効化

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

省略記法：

```json5
{
  tools: {
    codeMode: true,
  },
}
```

`tools.codeMode` が省略されている場合、`false` の場合、または
`enabled: true` のないオブジェクトである場合、コードモードは無効のままです。

MCP サーバーを設定したサンドボックス化エージェントを使用する場合は、
サンドボックスのツールポリシーでバンドル済み MCP Plugin も許可してください。たとえば、
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]` を指定します。
[設定 - ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy)
を参照してください。

境界をより厳密にするには、明示的な制限を設定します。

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

デバッグ中にモデルペイロードの形状を確認するには、対象を絞ったログを有効にして
Gateway を実行します。

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

コードモードが有効な場合、ログに記録されるモデル向けツール名は `exec` と
`wait` になります。完全な秘匿化済みプロバイダーペイロードを確認するには、短時間のデバッグセッションで
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` を追加します。

## 技術ツアー

このページの残りでは、メンテナー、ツール公開をデバッグする Plugin 作成者、
高リスクなデプロイを検証する運用担当者向けに、ランタイム契約と実装の詳細を説明します。

## ランタイムの状態

|                     |                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------- |
| ランタイム          | [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi)                               |
| デフォルト状態      | 無効                                                                                        |
| 安定性              | 実験的な OpenClaw サーフェス（Codex Code Mode は独立した安定版 Codex ハーネスサーフェス）   |
| 対象サーフェス      | 汎用 OpenClaw エージェント実行                                                             |
| セキュリティ方針    | モデルコードは悪意があるものとして扱う                                                    |
| ユーザー向けの保証  | コードモードを有効にしても、広範な直接ツール公開へ暗黙的にフォールバックすることはない      |

## スコープ

コードモードは、準備済み実行におけるモデル向けのオーケストレーション形状を所有します。
モデル選択、チャネルの動作、認証、ツールポリシー、ツール実装は
所有しません。

スコープ内：モデルに表示される制御ツールと直接ツールの定義、非表示ツールカタログの
構築、JavaScript/TypeScript ゲスト実行、QuickJS-WASI ワーカー
ランタイム、検索・説明・呼び出し用のホストコールバック、中断されたゲストプログラム用の
再開可能な状態、出力・タイムアウト・メモリ・保留中呼び出し・スナップショットの制限、
およびネストされたツール呼び出しのテレメトリと軌跡への投影。

スコープ外：プロバイダー固有のリモートコード実行、シェル実行の
セマンティクス、既存のツール認可の変更、ユーザーが作成する永続的な
スクリプト、ゲストコード内のパッケージマネージャー・ファイル・ネットワーク・モジュールへのアクセス、
および Codex Code Mode 内部実装の直接再利用。

リモート Python サンドボックスなどのプロバイダー所有ツールは別個のツールです。
[コード実行](/ja-JP/tools/code-execution)を参照してください。

## 用語

- **コードモード**：カタログ互換のモデルツールを非表示にし、`exec`、`wait`、
  および必要な direct-only ツールを公開する OpenClaw ランタイムモード。
- **ゲストランタイム**：モデルコードを評価する QuickJS-WASI JavaScript VM。
- **ホストブリッジ**：ゲストコードから OpenClaw に戻る、限定された JSON 互換の
  コールバックサーフェス。
- **カタログ**：通常のツールポリシー、Plugin、MCP、クライアントツールの
  解決後に得られる、実行スコープの有効なツール一覧。
- **ネストされたツール呼び出し**：ゲストコードからホストブリッジを通じて行われる
  ツール呼び出し。
- **スナップショット**：`wait` が中断されたコードモード実行を継続できるように
  保存される、シリアル化済み QuickJS-WASI VM 状態。

## 設定

`tools.codeMode.enabled` は有効化ゲートです。他のフィールドを設定しても、
それだけではこの機能は有効になりません。

| フィールド            | デフォルト                     | クランプ                                        |
| --------------------- | ------------------------------ | ----------------------------------------------- |
| `enabled`             | `false`                        | ブール値。`true` の場合のみコードモードを有効化 |
| `runtime`             | `"quickjs-wasi"`               | サポートされる唯一の値                          |
| `mode`                | `"only"`                       | 制御ツールと直接ツールを公開し、残りをカタログ化 |
| `languages`           | `["javascript", "typescript"]` | 2 つの任意のサブセット                          |
| `timeoutMs`           | `10000`                        | `100`-`60000`                                   |
| `memoryLimitBytes`    | `67108864`                     | `1048576`-`1073741824`                          |
| `maxOutputBytes`      | `65536`                        | `1024`-`10485760`                               |
| `maxSnapshotBytes`    | `10485760`                     | `1024`-`268435456`                              |
| `maxPendingToolCalls` | `16`                           | `1`-`128`                                       |
| `snapshotTtlSeconds`  | `900`                          | `1`-`86400`                                     |
| `searchDefaultLimit`  | `8`                            | `maxSearchLimit` にクランプ                      |
| `maxSearchLimit`      | `50`                           | `1`-`50`                                        |

コードモードが有効でも QuickJS-WASI を読み込めない場合、OpenClaw は
その実行をフェイルクローズします。フォールバックとして通常のツールを暗黙的に公開することはありません。

## 有効化処理

コードモードは、有効なツールポリシーが確定した後、最終的な
モデルリクエストが組み立てられる前に評価されます。

1. エージェント、モデル、プロバイダー、サンドボックス、チャネル、送信者、実行
   ポリシーを解決します。
2. 対象となる Plugin、MCP、クライアントツールを追加して、有効な OpenClaw ツールリストを
   構築します。
3. 許可/拒否ポリシーを適用します。
4. `tools.codeMode.enabled` が false の場合は、通常のツール公開を続行します。
5. 有効で、実行でツールがアクティブな場合は、必要な direct-only
   ツールを保持し、カタログ対象となるすべての有効なツールをコードモード
   カタログに登録します。
6. カタログ化されたツールをモデルに表示されるリストから削除し、保持した direct-only ツールとともに
   `exec` と `wait` を追加します。

意図的にツールがない実行（生のモデル呼び出し、`disableTools: true`、
または空の `tools.allow` リスト）では、`tools.codeMode.enabled: true` が設定されていても、
コードモードサーフェスは有効になりません。コードモードと OpenClaw Tool
Search は 1 回の実行で相互排他的です。コードモードが有効になると、Tool Search の
Compaction は行われません。

コードモードカタログは実行スコープであり、別の
エージェント、セッション、送信者、実行からツールが漏れてはなりません。

## モデルに表示されるツール

コードモードが有効な場合、モデルには `exec`、`wait`、および必要な
direct-only ツールが表示されます。その他の有効なツールはすべて、モデル向け
ツールリストから非表示になり、コードモードカタログに登録されます。

ツールのオーケストレーション、データ結合、ループ、並列のネストされた呼び出し、
構造化変換には `exec` を使用します。`wait` は、`exec` が再開可能な
`waiting` 結果を返した場合にのみ使用します。

## `exec`

`exec` はコードモードセルを開始し、1 つの結果を返します。入力コードはモデルが
生成したものであり、悪意があるものとして扱う必要があります。

入力：

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

ルール：

- `code` または `command` のいずれか一方は空でない必要があります。
- `code` は、ドキュメント化されたモデル向けフィールドです。
- `command` は、フックポリシーおよび信頼済みの書き換えのために、exec 互換の別名として
  受け入れられます（通常の OpenClaw シェル exec ツールも `command`
  フィールドを使用します）。両方が存在する場合、値は一致する必要があります。
- `language` のデフォルトは `"javascript"` です。一部のプロバイダーは
  `oneOf`/`anyOf` の形状を拒否するため、スキーマではこれを
  フラットな文字列列挙型（`"javascript" | "typescript"`）として公開します。
- `language` が `"typescript"` の場合、OpenClaw は評価前にトランスパイルします。
- `exec` は `import`、`require`、動的 import、モジュールローダーの
  パターンを拒否します。
- `exec` が通常のシェル `exec` 実装を再帰的に公開することはありません。
- 外側のコードモード `exec` フックイベントは `toolKind: "code_mode_exec"` と
  `toolInputKind: "javascript" | "typescript"`（判明している場合）を保持するため、
  ポリシーは同じツール名を共有するシェル形式の `exec` 呼び出しと
  コードモードセルを区別できます。

結果：

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

QuickJS VM が再開可能な状態で一時停止し、モデルから見える継続処理がまだ必要な場合、`exec` は `waiting` を返します。結果には `wait` で使用する `runId` が含まれます。MCP 名前空間の呼び出しを含む名前空間ブリッジ呼び出しは、準備が整っている間、同じ `exec`/`wait` 呼び出し内で自動的に処理されます。そのため、コンパクトなコードブロックから、名前空間ごとの await ごとにモデルツール呼び出しを強制することなく MCP ツールを呼び出せます。

`exec` が `completed` を返すのは、ゲスト VM に保留中の処理がなく、OpenClaw の出力アダプターの実行後に最終値が JSON 互換である場合のみです。

## `wait`

`wait` は一時停止中のコードモード VM を継続します。

入力:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

出力は、`exec` が返すものと同じ `CodeModeResult` ユニオンです。

ネストされた OpenClaw ツールは、低速、対話型、承認必須、または部分的な更新をストリーミングする場合があるため、`wait` が存在します。ホストが外部処理を待つ間、モデルが長時間にわたって単一の `exec` 呼び出しを開いたままにする必要はありません。

再開メカニズムには QuickJS-WASI のスナップショット/復元を使用します。

1. `exec` は、完了、失敗、または一時停止するまでコードを評価します。
2. 一時停止すると、OpenClaw は QuickJS VM のスナップショットを作成し、保留中のホスト処理を記録します。
3. 保留中の処理が完了すると、`wait` は VM スナップショットを復元し、安定した名前を使用してホストコールバックを再登録します。
4. OpenClaw はネストされたツールの結果を復元された VM に渡し、QuickJS の保留中のジョブを処理します。
5. `wait` は `completed`、`failed`、または別の `waiting` 結果を返します。

スナップショットはユーザー成果物ではなくランタイム状態です。プロセス内のマップにのみ保存され（データベースやディスクへの書き込みはありません）、サイズ制限と有効期限があり、作成元の実行とセッションに限定されます。

次の場合、`wait` は（`failed` 結果として）失敗します。

- `runId` が不明であるか、そのスナップショットがすでに期限切れになっている。
- 呼び出し元が、一時停止中の実行と同じ実行／セッションスコープに属していない。
- その `runId` に対する `wait` がすでに進行中である。
- QuickJS-WASI の復元に失敗する。
- 再開すると `maxOutputBytes` または `maxSnapshotBytes` を超過する。

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

`ALL_TOOLS` は実行スコープのカタログ用の簡潔なメタデータであり、デフォルトでは完全なスキーマを
含みません。

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

Plugin ツールでは `source: "openclaw"` を使用し、`sourceName` には所有元の
Plugin ID が設定されます。独立した `"plugin"` というソース値はありません。`source: "mcp"` は
`sourceName`／`mcp` メタデータ内の MCP エントリにのみ使用されます（また、
`ALL_TOOLS`／`tools.*` からは除外されます。以下を参照してください）。

完全なスキーマは、必要な場合にのみ読み込まれます。

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
};
```

カタログヘルパー：

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

// 非表示のカタログに曖昧さのない `web_search` エントリがある場合：
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

コードモードでは、MCP カタログエントリを `tools.call(...)` や便利な
関数から呼び出すことはできません。生成された `MCP`
名前空間を通じてのみ公開されます。TypeScript 形式の宣言ファイルは、
読み取り専用の `API` 仮想ファイルサーフェスから利用できるため、エージェントは MCP スキーマを
プロンプトに追加せずに MCP シグネチャを確認できます。

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

`API.read("mcp/<server>.d.ts")` は、MCP ツールのメタデータから推論された簡潔な宣言を返します。

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** この TypeScript 形式の API ヘッダーを返します。 */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * GitHub issue を作成します。
   * @param owner リポジトリの所有者
   * @param repo リポジトリ名
   * @param title issue のタイトル
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

宣言ファイルは仮想的なものであり、ワークスペースや状態ディレクトリには書き込まれません。コードモードの `exec` 呼び出しごとに、OpenClaw は実行スコープのツールカタログを構築し、表示可能な MCP エントリを保持して、`mcp/index.d.ts` と表示可能なサーバーごとの `mcp/<server>.d.ts` をレンダリングし、その小さな読み取り専用テーブルを QuickJS ワーカーに注入します。ゲストコードから見えるのは `API` オブジェクトだけです。`API.list(prefix?)` はファイルのメタデータを返し、`API.read(path)` は選択した宣言の内容を返します。不明なパスと `.`/`..` セグメントは拒否されます。

これにより、大きな MCP スキーマをモデルプロンプトに含めずに済みます。エージェントは `exec` ツールの説明から仮想 API の存在を把握し、必要な宣言ファイルだけを読み取ったうえで、1 つのオブジェクト引数を指定して `MCP.<server>.<tool>()` を呼び出します。プログラム内で単一ツールのスキーマ応答を取得するインラインのフォールバックとして、`MCP.<server>.$api()` も引き続き利用できます。

ゲストランタイムがホストオブジェクトを直接参照することはありません。入力と出力は、明示的なサイズ上限を持つ JSON 互換値としてブリッジを通過します。

## 内部名前空間

内部名前空間により、モデルに表示されるツールを増やすことなく、コードモードに簡潔なドメイン API を提供できます。ローダーが所有する統合が `Issues` や `Calendar` などの名前空間を登録すると、モデルには引き続き簡潔な制御用の直接サーフェスだけが表示される一方で、ゲストコードは QuickJS プログラム内からその名前空間を呼び出せます。

現時点では、名前空間は内部用です。公開 Plugin SDK の名前空間 API はありません。外部 Plugin の名前空間には、Plugin の識別情報、インストール済みマニフェスト、認証状態、キャッシュされたカタログ記述子が、名前空間を支える Plugin ツールとずれないようにする、ローダー所有の契約が必要です。コアのコードモードが所有するのは、サンドボックス、シリアライズ、カタログのゲーティング、ブリッジのディスパッチだけです。

ゲストコードは、直接グローバルまたは `namespaces` マップのどちらでも使用できます。

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### レジストリのライフサイクル

名前空間レジストリはプロセスローカルであり、名前空間 ID をキーとします。

1. 信頼済みローダーが `registerCodeModeNamespaceForPlugin(pluginId, registration)` を呼び出します。
2. コードモードは実行用の非表示の `ToolSearchRuntime` を作成し、その実行スコープのカタログを読み取ります。
3. `createCodeModeNamespaceRuntime(ctx, catalog)` は、`requiredToolNames` がすべて表示可能で、同じ `pluginId` によって所有されている登録だけを保持します。
4. 表示可能な各名前空間は現在の実行用に `createScope(ctx)` を呼び出し、`agentId`、`sessionKey`、`sessionId`、`runId`、設定、中止状態などの実行コンテキストを受け取ります。
5. スコープデータはプレーンな記述子にシリアライズされ、直接グローバルおよび `namespaces.<globalName>` として QuickJS に注入されます。
6. ゲスト呼び出しはワーカーブリッジを介して中断され、ホスト上で名前空間のパスを解決し、呼び出しを宣言済みの Plugin 所有カタログツールにマッピングして、`ToolSearchRuntime.callExactId` を介してそのツールを実行します。
7. 準備ができた名前空間ブリッジ呼び出しは、アクティブな `exec`/`wait` 呼び出し内で自動的に処理されます。タイムアウト時に名前空間の処理がまだ保留中である場合、またはゲストが明示的に処理を譲る場合、`wait` は後で同じ名前空間ランタイムを再開します。
8. Plugin のロールバックまたはアンインストール時に `clearCodeModeNamespacesForPlugin(pluginId)` を呼び出し、失敗した Plugin の読み込み後に古いグローバルが残らないようにします。

名前空間呼び出しはカタログツール呼び出しです。`tools.call(...)` と同じポリシーフック、承認、中止処理、テレメトリ、トランスクリプトへの投影、中断と再開の動作を使用します。

### 登録形式

基盤となるツールを所有する統合から名前空間を登録します。スコープを小さく保ち、宣言済みのカタログツールにマッピングされるドメイン動詞だけを公開してください。

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "現在のリポジトリ用の GitHub issue ヘルパー。",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "Issues.list(params) と Issues.update(number, patch) を使用してください。",
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

`createCodeModeNamespaceTool(toolName, inputMapper)` は、スコープメンバーを呼び出し可能な名前空間関数としてマークします。省略可能な `inputMapper` はゲスト引数を受け取り、基盤となるカタログツール用の入力オブジェクトを返します。指定しない場合は最初のゲスト引数が使用され、省略時は `{}` が使用されます。

未加工のホスト関数は、ゲストコードの実行前に拒否されます。

```typescript
createScope: () => ({
  // 誤り: これはカタログツールのライフサイクルを迂回するため、拒否されます。
  list: async () => githubClient.listIssues(),
});
```

### 所有権と可視性

名前空間の所有権は、登録呼び出し元の `pluginId` に結び付けられます。`requiredToolNames` は可視性ゲートと所有権チェックの両方として機能します。

- 必須ツールはすべて実行カタログに存在する必要があります
- 必須ツールはすべて `sourceName === pluginId` である必要があります
- 必須ツールが存在しない場合、または別の Plugin が所有している場合、名前空間は非表示になります
- 呼び出し可能な各パスが対象にできるのは、`requiredToolNames` に指定されたツールだけです

これにより、別の Plugin が同名のツールを登録して名前空間を公開することを防ぎ、名前空間を通常のエージェントポリシーと整合させます。実行から基盤となるツールが見えない場合、名前空間も見えません。

たとえば、GitHub 名前空間は、GitHub の認証、REST/GraphQL クライアント、レート制限、書き込み承認、テストを所有する GitHub 所有の Plugin の背後に配置する必要があります。コアのコードモードに GitHub 固有の API、トークン処理、プロバイダーポリシーを埋め込むべきではありません。

### スコープのシリアライズ規則

`createScope(ctx)` は、JSON 互換値、配列、ネストされたオブジェクト、`createCodeModeNamespaceTool(...)` 呼び出しマーカーを含むプレーンオブジェクトを返せます。ホストオブジェクトが QuickJS に直接渡されることはありません。

シリアライザーは以下を拒否します。

- 生の関数
- 循環オブジェクトグラフ
- 安全でないパスセグメント: `__proto__`、`constructor`、`prototype`、空のキー、
  または内部パス区切り文字を含むキー
- JavaScript 識別子ではない `globalName` 値
- `tools`、`namespaces`、`text`、`json`、`yield_control`、`MCP`、`API`、`ALL_TOOLS`、
  `__openclaw*` など、組み込みのコードモードグローバルと競合する `globalName`

JSON にシリアライズできない値は、ブリッジを通過する前に JSON セーフなフォールバック
値へ変換されます。バイナリデータ、ハンドル、ソケット、クライアント、クラスインスタンスは、
通常のカタログツール内に留めてください。

### プロンプト

名前空間の `description` とオプションの `prompt` は、その名前空間が該当実行で可視の場合にのみ、
モデルに表示される `exec` スキーマへ追加されます。最小限の有用なサーフェスを教えるために
使用してください。

```typescript
{
  description: "フィクション制作サービスのヘルパー。",
  prompt:
    "Fictions.riskAudit()、Fictions.promoteIfReady(id, status)、Fictions.unpaidOver(amount) を使用してください。",
}
```

プロンプトには名前空間の契約を記述し、認証設定、実装履歴、無関係な Plugin の動作は
含めないでください。

### クリーンアップ

名前空間はプロセスローカルな登録です。所有する Plugin が無効化、アンインストール、
またはロールバックされたときに削除してください。

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

コードモードのクリーンアップは Plugin が所有します。名前空間ごとの破棄ハンドルを保持するのではなく、
Plugin のライフサイクル終了時に、その Plugin の名前空間登録を消去してください。
テストでは、ケース間で登録が漏れないように `clearCodeModeNamespacesForTest()` を呼び出せます。

### テストチェックリスト

名前空間の変更では、セキュリティ境界とゲストの動作を確認する必要があります。

- 名前空間のプロンプトテキストは、基盤となるツールが可視の場合にのみ表示される
- 別の `sourceName` にある同名ツールは名前空間を公開しない
- 生のスコープ関数は拒否される
- 偽造された名前空間 ID と偽造されたパスは拒否される
- 呼び出し可能なパスは未宣言のツールを対象にできない
- ネストされたオブジェクトと共有参照が正しくシリアライズされる
- 名前空間の呼び出しはカタログツールを経由して実行され、JSON セーフな詳細を返す
- ゲストコードで失敗を捕捉できる
- 一時停止された名前空間呼び出しが `wait` を通じて再開する
- Plugin のロールバックによって所有する名前空間登録が消去される

名前空間は汎用の `tools.search`/`tools.call` カタログを補完します。任意の有効な OpenClaw、
Plugin、クライアントツールにはカタログを使用し、MCP ツールには `MCP` を使用してください。
その他の名前空間は、スキーマ検索の繰り返しより簡潔なコードの方が信頼できる、
Plugin 所有の文書化されたドメイン API に使用してください。

## 出力 API

- `text(value)` は、人間が読める出力を `output` 配列へ追加します。
- `json(value)` は、JSON 互換のシリアライズ後に構造化出力項目を追加します。
- ゲストコードが最後に返した値は、`completed` 結果の `value` になります。

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

ルール: 出力順序はゲストの呼び出し順と一致します。出力は `maxOutputBytes` で制限されます。
シリアライズできない値はプレーン文字列またはエラーへ変換されます。バイナリ値はサポートされません。
画像とファイルはコードモードブリッジではなく、通常の OpenClaw ツールを通じて転送されます。

## ツールカタログ

非表示のカタログには、実効ポリシーによるフィルタリング後のツールが次の順序で含まれます。
OpenClaw コアツール、バンドルされた Plugin ツール、外部 Plugin ツール、MCP ツール、
そして現在の実行でクライアントから提供されたツールです。

カタログ ID は 1 回の実行内で安定しており、可能な場合は同等のツールセット間で決定的です。
実際の形式:

```text
<source>:<owner>:<tool-name>
```

ここで `<source>` は `openclaw`、`mcp`、または `client` です（Plugin ツールでは
Plugin ID を `<owner>` として `openclaw` を使用し、コアツールでは `openclaw:core:*` を使用します）。
例:

```text
openclaw:core:message
openclaw:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

カタログには、コードモード制御ツール（`exec`、`wait`、`tool_search_code`、
`tool_search`、`tool_describe`、`tool_call`）および直接呼び出し専用ツールは含まれません。
制御ツールはカタログを通じて再帰呼び出しできません。直接呼び出し専用ツールは、その構造化結果を
QuickJS ブリッジで渡せないため、引き続きモデルから可視です。

MCP エントリは実行スコープのカタログに残るため、ポリシー、承認、フック、
テレメトリ、トランスクリプト投影、正確なツール ID は通常のツール実行と共有されます。
ゲスト向けの `ALL_TOOLS`、`tools.search(...)`、`tools.describe(...)`、
`tools.call(...)` ビューには MCP エントリが含まれません。生成された
`MCP.<server>.<tool>({ ...input })` 名前空間は正確なカタログ ID に解決され、
同じエグゼキューターパスを通じてディスパッチされます。

## Tool Search との相互作用

コードモードが有効な実行では、OpenClaw Tool Search のモデルサーフェスよりコードモードが優先されます。

`tools.codeMode.enabled` が true でコードモードが有効化される場合:

- OpenClaw は `tool_search_code`、`tool_search`、`tool_describe`、
  `tool_call` をモデル可視のツールとして公開しません。
- 同じカタログ化の考え方がゲストランタイム内へ移動します。
- ゲストランタイムは、MCP 以外のツール向けのコンパクトな `ALL_TOOLS` メタデータと、
  検索/説明/呼び出しヘルパーを受け取ります。
- MCP 呼び出しでは、`tools.call(...)` の代わりに、生成された `MCP` 名前空間と
  その `$api()` ヘッダーを使用します。
- ネストされた呼び出しは、Tool Search が使用するものと同じ OpenClaw エグゼキューターパスを通じて
  ディスパッチされます。

コードモードが有効な実行で置き換える OpenClaw のコンパクトカタログブリッジについては、
[Tool Search](/ja-JP/tools/tool-search) を参照してください。

## ツール名と競合

モデルから可視の `exec` ツールはコードモードツールです。通常の OpenClaw シェル `exec` ツールが
有効な場合、そのツールはモデルから非表示になり、他のツールと同様にカタログ化されます。

ゲストランタイム内では:

- ポリシーで許可されている場合、`tools.call("openclaw:core:exec", input)` でシェル exec ツールを
  呼び出せます。
- `tools.exec(...)` は、シェル exec のカタログエントリに曖昧さのない安全な名前がある場合にのみ
  インストールされます。
- コードモードの `exec` ツールを `tools` を通じて再帰的に利用することはできません。

2 つのツールが同じ安全な簡易名に正規化される場合、OpenClaw は簡易関数を省略し、
`tools.call(id, input)` の使用を必須とします。

## ネストされたツール実行

ネストされた各ツール呼び出しはホストブリッジを渡って OpenClaw に再入し、次の情報を保持します。
アクティブなエージェント ID、セッション ID とキー、送信者とチャンネルのコンテキスト、
サンドボックスポリシー、承認ポリシー、Plugin の `before_tool_call` フック、中断シグナル、
利用可能な場合のストリーミング更新、軌跡/監査イベント。

ネストされた呼び出しは実際のツール呼び出しとしてトランスクリプトへ投影されるため、
サポートバンドルで発生内容を確認できます。投影には、親のコードモードツール呼び出しと
ネストされたツール ID が示されます。

並列のネスト呼び出しは `maxPendingToolCalls` まで許可されます。

## 実行とスナップショットのライフサイクル

各コードモード実行は、`runId` をキーとするプロセス内マップで追跡されます
（ディスクやデータベースには永続化されません）。`exec`/`wait` は、
`completed`、`waiting`、`failed` の 3 つの結果ステータスのいずれかを返します。

- `waiting` の結果は、`wait` が再開するか期限切れになるまで、QuickJS スナップショット、
  保留中のブリッジリクエスト、スコープメタデータ（エージェント実行 ID、セッション ID/キー）を保存します。
- 期限切れ、セッション不一致、実行不一致、不明/すでに再開中の `runId` 値では、
  個別の終了ステータスは生成されません。代わりに、`code mode
run is unavailable or expired.` や `code mode run belongs to a different
session.` などのメッセージを伴う `failed` 結果（`code: "invalid_input"`）として表面化します。
- 実行のスナップショットは、`completed` または `failed` に確定すると直ちにマップから削除されるか、
  Gateway のシャットダウン時に破棄されます（再起動後には何も残りません。これは一時的なランタイム状態です）。
- 読み取り専用の作業では、`exec` に `restartSafe: true` を設定できます。その場合 OpenClaw は、
  副作用のあるカタログ呼び出しと Plugin 名前空間を実行前に拒否し、一時停止された結果を
  リプレイセーフとしてマークします。再起動によって `wait` が中断された場合、
  [再起動リカバリ](/ja-JP/gateway/restart-recovery) はプロセスローカルのスナップショットを復元する代わりに、
  トランスクリプトからターンを再構築します。リカバリターン自体は、監査済みの読み取り専用コアツールと、
  明示的にリプレイセーフな Plugin ツールに引き続き制限されます。
- OpenClaw は、プロセスごとに同時に一時停止できる実行数を制限し（64）、
  その上限を超える新たな一時停止を `too many suspended code mode
runs.` で拒否します。

スナップショットストレージは、実行ごとの `maxSnapshotBytes`、上記のプロセスごとの一時停止実行上限、
および `snapshotTtlSeconds` によって制限されます。

## QuickJS-WASI ランタイム

OpenClaw は、所有パッケージの直接依存関係として `quickjs-wasi` を読み込みます。
無関係な依存関係のためにインストールされた推移的なコピーには依存しません。

ランタイムの責務: QuickJS-WASI WebAssembly モジュールのコンパイル/読み込み、
コードモード実行または再開ごとの分離 VM の作成、安定した名前によるホストコールバックの登録、
メモリ制限と割り込み制限の設定、JavaScript の評価、保留中ジョブの処理、
一時停止された VM 状態のスナップショット、`wait` 用のスナップショット復元、
終了状態後の VM ハンドルとスナップショットの破棄。

ランタイムは OpenClaw のメインイベントループ外にある Node.js ワーカースレッドで実行されます。
ゲストの無限ループによって Gateway プロセスが無期限にブロックされてはなりません。
ワーカーの割り込みハンドラーは、ゲストコードの協調とは無関係に実時間タイムアウトを適用します。

## TypeScript

TypeScript サポートはソース変換のみです。受け付ける入力は 1 つの TypeScript コード文字列で、
出力は QuickJS-WASI が評価する JavaScript 文字列です。型チェック、モジュール解決、
`import`/`require` はありません。診断は `failed` 結果として返されます。

TypeScript コンパイラは TypeScript セルでのみ遅延読み込みされます。プレーン JavaScript セルと、
無効化されたコードモードでは読み込まれません。

## セキュリティ境界

モデルコードは敵対的です。ランタイムは多層防御を使用します。

- QuickJS-WASI をメインイベントループ外のワーカースレッドで実行する
- `quickjs-wasi` を Codex や推移的パッケージ経由ではなく、直接依存関係として読み込む
- ゲスト内にはファイルシステム、ネットワーク、サブプロセス、モジュールインポート、環境変数、
  ホストグローバルオブジェクトが存在しない
- QuickJS のメモリ制限と割り込み制限に加えて、親プロセスの実時間タイムアウトを使用する
- 出力、スナップショット、ログ、保留中呼び出しの上限を適用する
- 狭い JSON アダプターを通じてホストブリッジ値をシリアライズする
- ホストエラーをプレーンなゲストエラーへ変換し、ホストレルムのオブジェクトは決して渡さない
- タイムアウト、中断、セッション終了、期限切れ時にスナップショットを破棄する
- `exec`、`wait`、Tool Search 制御ツールへの再帰アクセスを拒否する
- 簡易名の競合によってカタログヘルパーが隠されることを防止する

サンドボックスはセキュリティレイヤーの 1 つです。高リスクなデプロイでは、オペレーターが
OS レベルのハードニングを追加で必要とする場合があります。

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

`invalid_input` は、不正な `exec`/`wait` 引数、無効化された言語、拒否されたモジュールアクセス、
TypeScript 変換の失敗、不明/期限切れ/スコープ不一致の `runId` 値、一時停止実行数の超過を対象とします。
`runtime_unavailable` は、QuickJS ワーカーが起動に失敗した場合、またはゼロ以外で終了した場合を対象とします。

ゲストへ返されるエラーはプレーンデータです。ホストの `Error` インスタンス、スタックオブジェクト、
プロトタイプ、ホスト関数は QuickJS に渡されません。

## テレメトリ

各結果の `telemetry` フィールドは、非表示カタログのサイズとソース別内訳
（`openclaw`/`mcp`/`client` の件数）、実行のカタログに対する累積検索/説明/呼び出し回数、
モデルから可視のツール名（`exec`、`wait`、保持された直接呼び出し専用ツール）を報告します。

テレメトリには、既存の OpenClaw 軌跡ポリシーで許可される範囲を超えて、シークレット、
生の環境値、未編集のツール入力を含めてはなりません。

## デバッグ

コードモードが通常のツール実行と異なる動作をする場合は、対象を絞ったモデル転送ログを使用してください。

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

ペイロード形式のデバッグには `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` を使用してください。
これは、モデルリクエストのサイズ制限付きで編集済みの JSON スナップショットをログに記録します。
プロンプトやメッセージテキストが引き続き含まれる可能性があるため、デバッグ中にのみ使用してください。

ストリームのデバッグには、`OPENCLAW_DEBUG_SSE=peek` を使用して、秘匿化された最初の 5 件の SSE イベントをログに記録します。コードモードのサーフェスが有効化された後、最終的なプロバイダーのペイロードに `exec` が正確に 1 つ、`wait` が正確に 1 つ、および承認済みの direct-only ツールのみが含まれていない場合も、コードモードはフェイルクローズします。

## 実装の構成

- 設定コントラクト: `tools.codeMode`
- カタログビルダー: 有効なツールからコンパクトなエントリと ID マップを生成
- モデルサーフェスアダプター: 可視ツールを制御ツールおよび直接ツールに置換
- QuickJS-WASI ランタイムアダプター: 読み込み、評価、スナップショット、復元、破棄
- ワーカースーパーバイザー: タイムアウト、中断、クラッシュの分離
- ブリッジアダプター: JSON セーフなホストコールバックと結果の受け渡し
- TypeScript 変換アダプター
- スナップショットストア: TTL、サイズ上限、実行/セッションのスコープ
- ネストされたツール呼び出しの軌跡プロジェクション
- テレメトリカウンターと診断

実装では Tool Search のカタログとエグゼキューターの概念を再利用しますが、サンドボックスとして `node:vm` の子プロセスは使用しません。

## 検証チェックリスト

コードモードのカバレッジでは、以下を実証する必要があります。

- 無効化された設定では、既存のツール公開が変更されない
- `enabled: true` のないオブジェクト設定では、コードモードが無効のままになる
- 有効化された設定では、実行時にツールが有効な場合、`exec`、`wait`、および必要な direct-only ツールのみがモデルに公開される
- ツールを使用しない未加工の実行、`disableTools`、および空の許可リストでは、コードモードのペイロード検証が開始されない
- カタログ対象となるすべての有効な非 MCP ツールが `ALL_TOOLS` に表示される
- direct-only ツールはモデルに表示されたままで、`ALL_TOOLS` には表示されない
- 拒否されたツールは `ALL_TOOLS` に表示されない
- `tools.search`、`tools.describe`、および `tools.call` が OpenClaw ツールで動作する
- `API.list("mcp")` および `API.read("mcp/<server>.d.ts")` が、ブリッジ/ツール呼び出しなしで TypeScript 形式の MCP 宣言を公開する
- MCP 名前空間の `$api()` がスキーマのインラインフォールバックとして引き続き利用できる
- MCP 名前空間呼び出しが、1 つのオブジェクト入力を持つ可視 MCP ツールで動作し、MCP の直接カタログエントリは `tools.*` に存在しない
- Tool Search の制御ツールが、モデルサーフェスと非表示カタログの両方から非表示になる
- ネストされた呼び出しで、承認およびフックの動作が維持される
- シェルの `exec` はモデルから非表示になるが、許可されている場合はカタログ ID で呼び出せる
- コードモードの再帰的な `exec` および `wait` は、ゲストコードから呼び出せない
- 無効化されたパスまたは JavaScript のみのパスでは TypeScript を読み込まずに、TypeScript 入力が変換および評価される
- `import`、`require`、ファイルシステム、ネットワーク、および環境へのアクセスが失敗する
- 無限ループがタイムアウトし、Gateway をブロックできない
- メモリ上限の超過によってゲスト VM が終了する
- 完了した呼び出しと中断された呼び出しの両方で、出力およびスナップショットの上限が適用される
- `wait` が中断されたスナップショットを再開し、最終値を返す
- 期限切れ、中断済み、誤ったセッション、および不明な `runId` の値が失敗する
- トランスクリプトの再生および永続化で、コードモードの制御呼び出しが維持される
- トランスクリプトおよびテレメトリに、ネストされたツール呼び出しが明確に表示される

## E2E テスト計画

ランタイムを変更する場合は、以下を統合テストまたはエンドツーエンドテストとして実行します。

1. `tools.codeMode.enabled: false` を設定して Gateway を起動します。
2. 小規模な直接ツールセットを使用してエージェントターンを送信します。
3. モデルに表示されるツールが変更されていないことを確認します。
4. `tools.codeMode.enabled: true` を設定して再起動します。
5. OpenClaw、Plugin、MCP、およびクライアントのテストツールを使用してエージェントターンを送信します。
6. モデルに表示されるツールリストが `exec`、`wait`、および設定された direct-only ツールのみであることを確認します。
7. `exec` 内で `ALL_TOOLS` を読み取り、カタログ対象となる有効なテストツールが存在し、direct-only ツールが存在しないことを確認します。
8. `exec` 内で、`tools.search`、`tools.describe`、および `tools.call` を介して OpenClaw/Plugin/クライアントツールを呼び出します。
9. `exec` 内で `API.list("mcp")` および `API.read("mcp/<server>.d.ts")` を呼び出し、宣言ファイルが可視 MCP ツールを記述していることを確認します。
10. `exec` 内で `MCP.<server>.<tool>({ ...input })` を介して MCP ツールを呼び出し、MCP の直接カタログエントリが `ALL_TOOLS` および `tools.*` に存在しないことを確認します。
11. 拒否されたツールが存在せず、推測した ID でも呼び出せないことを確認します。
12. `exec` が `waiting` を返した後に解決される、ネストされたツール呼び出しを開始します。
13. `wait` を呼び出し、復元された VM がツールの結果を受け取ることを確認します。
14. 最終回答に復元後に生成された出力が含まれることを確認します。
15. タイムアウト、中断、およびスナップショットの期限切れによって、ランタイム状態がクリーンアップされることを確認します。
16. 軌跡をエクスポートし、ネストされた呼び出しが親コードモード呼び出しの配下に表示されることを確認します。

このページのみを変更した場合でも、`pnpm check:docs` を実行する必要があります。

## 関連項目

- [Tool Search](/ja-JP/tools/tool-search)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [Exec ツール](/ja-JP/tools/exec)
- [コード実行](/ja-JP/tools/code-execution)
