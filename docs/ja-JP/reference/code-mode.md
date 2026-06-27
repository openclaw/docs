---
read_when:
    - エージェント実行で OpenClaw コードモードを有効にしたい
    - コードモードが Codex Code mode と異なる理由を説明する必要があります。
    - exec/wait コントラクト、QuickJS-WASI サンドボックス、TypeScript 変換、または隠しツールカタログブリッジをレビューしている
    - 内部コードモードの名前空間レジストリ連携を追加またはレビューしている
sidebarTitle: Code mode
summary: 'OpenClawコードモード: QuickJS-WASIと非表示の実行スコープ付きツールカタログに支えられた、オプトインのexec/waitツールサーフェス'
title: コードモード
x-i18n:
    generated_at: "2026-06-27T12:55:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 859d56eb09e21c9277961ac5178c1458ce669de114e8cc3f2c8d4b104f428a74
    source_path: reference/code-mode.md
    workflow: 16
---

Code mode は実験的な OpenClaw エージェントランタイム機能です。デフォルトでは
オフです。有効にすると、OpenClaw は 1 回の実行でモデルに見える内容を変更します。
有効なすべてのツールスキーマを直接公開する代わりに、モデルには
`exec` と `wait` だけが見えます。

このページでは OpenClaw code mode を説明します。これは Codex Code mode ではありません。2 つの
機能は同じ名前を共有していますが、異なるランタイムで実装されており、
異なる `exec` コントラクトを公開します。

- Codex Code Mode は、ネイティブコードモードを無効にする制限付き
  ツールポリシーがない限り、Codex app-server スレッドで有効です。これは Codex コーディングハーネスで実行され、
  モデルは `exec.command` コントラクトを通じてシェルコマンドを書きます。
- OpenClaw code mode は、`tools.codeMode.enabled: true` が
  設定されていない限り無効です。これは OpenClaw の汎用エージェントランタイムで実行され、
  モデルは `exec.code` コントラクトを通じて JavaScript または TypeScript プログラムを書きます。

Codex Code Mode と Codex ネイティブの動的ツール検索は、安定した Codex ハーネス
サーフェスです。OpenClaw code mode は、汎用 OpenClaw 実行のための OpenClaw 所有の実験的なツールサーフェス
アダプターです。これは `quickjs-wasi`、非表示の OpenClaw
ツールカタログ、通常の OpenClaw ツール実行器を使用します。

## これは何ですか？

OpenClaw code mode では、モデルが長いツール一覧から直接選択する代わりに、
小さな JavaScript または TypeScript プログラムを書けます。

code mode が有効な場合:

- モデルに見えるツール一覧は厳密に `exec` と `wait` です。
- `exec` は、モデルが生成した JavaScript または TypeScript を、制約された
  QuickJS-WASI ワーカー内で評価します。
- 通常の OpenClaw ツールはモデルプロンプトから隠され、ゲストプログラム内で
  `ALL_TOOLS` と `tools` を通じて公開されます。
- ゲストコードは、非表示カタログの検索、ツールの説明取得、通常のエージェントターンで使われるのと同じ
  OpenClaw 実行パスを通じたツール呼び出しができます。
- MCP ツールは `MCP` 名前空間の下にグループ化されます。code mode では、この名前空間が
  MCP ツールを呼び出す唯一のサポートされた方法です。
- ネストされたツール呼び出しがまだ保留中の場合、`wait` は一時停止された code-mode 実行を
  再開します。

重要な違い: code mode はモデル向けのオーケストレーション
サーフェスを変更します。OpenClaw ツール、Plugin ツール、MCP ツール、認証、
承認ポリシー、チャネル動作、モデル選択を置き換えるものではありません。

## なぜ有用ですか？

code mode は、大規模なツールカタログをモデルが使いやすくします。

- より小さなプロンプトサーフェス: プロバイダーは、数十または数百の完全なツールスキーマではなく、
  2 つの制御ツールを受け取ります。
- より良いオーケストレーション: モデルは、ループ、結合、小さな変換、
  条件ロジック、並列のネストされたツール呼び出しを 1 つのコードセル内で使用できます。
- プロバイダーに依存しない: プロバイダーネイティブのコード実行に依存せず、
  OpenClaw、Plugin、MCP、クライアントツールで動作します。
- 既存のポリシーは有効なまま: ネストされたツール呼び出しは引き続き OpenClaw の
  ポリシー、承認、フック、セッションコンテキスト、監査パスを通過します。
- 明確な失敗モード: code mode が明示的に有効化され、ランタイムが
  利用できない場合、OpenClaw は広範な直接ツール公開にフォールバックせず、フェイルクローズします。

code mode は、有効なツールカタログが大きいエージェントや、
回答を生成する前にモデルが繰り返しツールを検索、結合、呼び出す必要がある
ワークフローで特に有用です。

## 有効化する方法

エージェントまたはランタイム設定に `tools.codeMode.enabled: true` を追加します。

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

短縮形も受け付けられます。

```json5
{
  tools: {
    codeMode: true,
  },
}
```

`tools.codeMode` が省略されている場合、`false` の場合、または
`enabled: true` のないオブジェクトの場合、code mode はオフのままです。

設定済みの MCP サーバーを持つサンドボックス化されたエージェントを使用する場合は、
サンドボックスツールポリシーがバンドルされた MCP Plugin を許可していることも確認してください。たとえば
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]` を使用します。詳しくは
[設定 - ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy) を参照してください。

より厳しい境界が必要な場合は、明示的な制限を使用します。

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

デバッグ中にモデルペイロードの形を確認するには、対象を絞ったログを有効にして
Gateway を実行します。

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

code mode が有効な場合、ログに記録されるモデル向けツール名は `exec` と
`wait` になるはずです。編集済みのプロバイダーペイロードが必要な場合は、
短時間のデバッグセッションで `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` を追加します。

## 技術ツアー

このページの残りの部分では、ランタイムコントラクトと実装の詳細を説明します。
これは、メンテナー、ツール公開をデバッグする Plugin 作者、
高リスクなデプロイを検証する運用者を対象としています。

## ランタイム状態

- ランタイム: [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi)。
- デフォルト状態: 無効。
- 安定性: 実験的な OpenClaw サーフェス。Codex Code mode は別個の安定した
  Codex ハーネスサーフェスです。
- 対象サーフェス: 汎用 OpenClaw エージェント実行。
- セキュリティ姿勢: モデルコードは敵対的です。
- ユーザー向けの約束: code mode を有効にしても、広範な直接ツール公開に
  暗黙にフォールバックすることはありません。

## スコープ

code mode は、準備済み実行のモデル向けオーケストレーション形状を所有します。モデル選択、
チャネル動作、認証、ツールポリシー、ツール実装は所有しません。

スコープ内:

- モデルに見える `exec` と `wait` のツール定義
- 非表示ツールカタログの構築
- JavaScript と TypeScript のゲスト実行
- QuickJS-WASI ワーカーランタイム
- カタログ検索、スキーマ説明、ツール呼び出しのためのホストコールバック
- 一時停止されたゲストプログラムの再開可能な状態
- 出力、タイムアウト、メモリ、保留呼び出し、スナップショットの制限
- ネストされたツール呼び出しのテレメトリと軌跡投影

スコープ外:

- プロバイダーネイティブのリモートコード実行
- シェル実行セマンティクス
- 既存のツール認可の変更
- 永続的なユーザー作成スクリプト
- ゲストコード内のパッケージマネージャー、ファイル、ネットワーク、モジュールアクセス
- Codex Code mode 内部の直接再利用

リモート Python サンドボックスなどのプロバイダー所有ツールは、別個のツールのままです。
[コード実行](/ja-JP/tools/code-execution) を参照してください。

## 用語

**Code mode** は、通常のモデルツールを隠し、
`exec` と `wait` だけを公開する OpenClaw ランタイムモードです。

**ゲストランタイム** は、モデルコードを評価する QuickJS-WASI JavaScript VM です。

**ホストブリッジ** は、ゲストコードから OpenClaw へ戻る狭い JSON 互換のコールバックサーフェスです。

**カタログ** は、通常のツールポリシー、Plugin、MCP、クライアントツール解決の後に得られる、
実行スコープの有効なツール一覧です。

**ネストされたツール呼び出し** は、ゲストコードからホストブリッジを通じて行われるツール呼び出しです。

**スナップショット** は、`wait` が一時停止された code-mode 実行を継続できるように保存された、
シリアライズ済み QuickJS-WASI VM 状態です。

## 設定

`tools.codeMode.enabled` は有効化ゲートです。他の code-mode フィールドを設定しても、
この機能は有効になりません。

サポートされるフィールド:

- `enabled`: boolean。デフォルトは `false`。`true` の場合にのみ code mode を有効にします。
- `runtime`: `"quickjs-wasi"`。唯一サポートされるランタイム。
- `mode`: `"only"`。`exec` と `wait` を公開し、通常のモデルツールを隠します。
- `languages`: `"javascript"` と `"typescript"` の配列。デフォルトでは
  両方を含みます。
- `timeoutMs`: 1 回の `exec` または `wait` のウォールクロック上限。デフォルトは `10000`。
  ランタイムのクランプ: `100` から `60000`。
- `memoryLimitBytes`: QuickJS ヒープ上限。デフォルトは `67108864`。ランタイムのクランプ:
  `1048576` から `1073741824`。
- `maxOutputBytes`: 返されるテキスト、JSON、ログの上限。デフォルトは `65536`。
  ランタイムのクランプ: `1024` から `10485760`。
- `maxSnapshotBytes`: シリアライズ済み VM スナップショットの上限。デフォルトは `10485760`。
  ランタイムのクランプ: `1024` から `268435456`。
- `maxPendingToolCalls`: 同時に実行されるネストされたツール呼び出しの上限。デフォルトは `16`。
  ランタイムのクランプ: `1` から `128`。
- `snapshotTtlSeconds`: 一時停止された VM を再開できる期間。デフォルトは `900`。
  ランタイムのクランプ: `1` から `86400`。
- `searchDefaultLimit`: 非表示カタログ検索結果数のデフォルト。デフォルトは `8`。
  ランタイムはこれを `maxSearchLimit` にクランプします。
- `maxSearchLimit`: 非表示カタログ検索結果数の最大値。デフォルトは `50`。
  ランタイムのクランプ: `1` から `50`。

code mode が有効でも QuickJS-WASI を読み込めない場合、OpenClaw はその実行で
フェイルクローズします。フォールバックとして通常のツールを暗黙に公開することはありません。

## 有効化

code mode は、有効なツールポリシーが判明した後、最終的なモデルリクエストが組み立てられる前に
評価されます。

有効化順序:

1. エージェント、モデル、プロバイダー、サンドボックス、チャネル、送信者、実行ポリシーを解決します。
2. 有効な OpenClaw ツール一覧を構築します。
3. 対象となる Plugin、MCP、クライアントツールを追加します。
4. 許可および拒否ポリシーを適用します。
5. `tools.codeMode.enabled` が false の場合、通常のツール公開を続行します。
6. 有効で、実行でツールがアクティブな場合、有効なツールを
   code-mode カタログに登録します。
7. モデルに見えるツール一覧からすべての通常ツールを削除します。
8. code-mode の `exec` と `wait` を追加します。

生のモデル呼び出し、`disableTools`、空の allowlist など、意図的にツールを持たない実行では、
設定に `tools.codeMode.enabled: true` が含まれていても code-mode サーフェスは有効化されません。

code-mode カタログは実行スコープです。別のエージェント、セッション、送信者、実行から
ツールが漏れてはいけません。

## モデルに見えるツール

code mode が有効な場合、モデルには次のトップレベルツールだけが見えます。

- `exec`
- `wait`

その他すべての有効なツールは、モデル向けツール一覧から隠され、
code-mode カタログに登録されます。

モデルは、ツールオーケストレーション、データ結合、ループ、
並列のネストされた呼び出し、構造化変換に `exec` を使用するべきです。モデルは、
`exec` が再開可能な `waiting` 結果を返した場合にのみ `wait` を使用するべきです。

## `exec`

`exec` は code-mode セルを開始し、1 つの結果を返します。入力コードはモデルが
生成したものであり、敵対的として扱う必要があります。

入力:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

入力ルール:

- `code` または `command` のどちらか一方は空であってはなりません。
- `code` は、文書化されたモデル向けフィールドです。
- `command` は、フックポリシーと信頼された書き換えのための exec 互換エイリアスとして受け付けられます。
  両方が存在する場合、値は一致していなければなりません。
- 外側の code-mode `exec` フックイベントには `toolKind: "code_mode_exec"` が含まれ、
  入力言語が分かっている場合は `toolInputKind: "javascript" | "typescript"` も含まれるため、
  ポリシーは同じツール名を共有するシェルスタイルの `exec` 呼び出しと code-mode セルを区別できます。
- `language` のデフォルトは `"javascript"` です。
- `language` が `"typescript"` の場合、OpenClaw は評価前にトランスパイルします。
- `exec` は v1 で `import`、`require`、動的 import、モジュールローダーパターンを拒否します。
- `exec` は通常のシェル `exec` 実装を再帰的に公開しません。

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

QuickJS VM が、モデルに見える継続をまだ必要とする再開可能な状態で一時停止した場合、
`exec` は `waiting` を返します。結果には `wait` 用の `runId` が含まれます。
MCP 名前空間呼び出しを含む名前空間ブリッジ呼び出しは、準備ができている間は
同じ `exec`/`wait` 呼び出し内で自動的にドレインされるため、コンパクトなコードブロックは
`$api()` を調べ、名前空間 await ごとに 1 回のモデルツール呼び出しを強制せずに MCP ツールを呼び出せます。

`exec` は、ゲスト VM に保留中の作業がなく、OpenClaw の出力アダプター実行後の
最終値が JSON 互換である場合にのみ `completed` を返します。

## `wait`

`wait` は、一時停止されたコードモード VM を続行します。

入力:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

出力は、`exec` が返すものと同じ `CodeModeResult` ユニオンです。

`wait` が存在するのは、ネストされた OpenClaw ツールが遅い、対話的である、承認で
ゲートされる、または部分的な更新をストリーミングする場合があるためです。ホストが
外部作業を待つ間、モデルが 1 つの長い `exec` 呼び出しを開いたままにする必要は
ありません。

QuickJS-WASI のスナップショットと復元は、v1 の再開メカニズムです:

1. `exec` は、完了、失敗、または一時停止までコードを評価します。
2. 一時停止時に、OpenClaw は QuickJS VM のスナップショットを作成し、保留中のホスト
   作業を記録します。
3. 保留中の作業が確定すると、`wait` が VM スナップショットを復元します。
4. OpenClaw は安定した名前でホストコールバックを再登録します。
5. OpenClaw は、復元された VM にネストされたツール結果を届けます。
6. OpenClaw は QuickJS の保留中ジョブをドレインします。
7. `wait` は `completed`、`failed`、または別の `waiting` 結果を返します。

スナップショットはランタイム状態であり、ユーザー成果物ではありません。サイズ制限、
有効期限があり、それを作成した実行とセッションにスコープされます。

`wait` は次の場合に失敗します:

- `runId` が不明。
- スナップショットの有効期限が切れた。
- 親実行またはセッションが中止された。
- 呼び出し元が同じ実行/セッションスコープ内にいない。
- QuickJS-WASI の復元に失敗した。
- 復元すると設定された制限を超える。

## ゲストランタイム API

ゲストランタイムは小さなグローバル API を公開します:

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` は、実行スコープのカタログ向けのコンパクトなメタデータです。デフォルトでは
完全なスキーマを含みません。

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "plugin" | "mcp" | "client";
  sourceName?: string;
};
```

完全なスキーマは、必要に応じてのみ読み込まれます:

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

便利なツール関数は、曖昧でない安全な名前に対してのみインストールされます:

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// If the hidden catalog has an unambiguous `web_search` entry:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

MCP カタログエントリは、コードモードでは `tools.call(...)` や便利関数から呼び出せません。
生成された `MCP` 名前空間を通じてのみ公開されます。TypeScript 形式の宣言ファイルは、
読み取り専用の `API` 仮想ファイルサーフェスから利用できるため、エージェントは MCP
スキーマをプロンプトに追加せずに MCP シグネチャを調査できます:

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

`API.read("mcp/<server>.d.ts")` は、MCP ツールメタデータから推論されたコンパクトな宣言を
返します:

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

宣言ファイルは仮想のものであり、ワークスペースや状態ディレクトリ配下に書き込まれる
ファイルではありません。コードモードの各 `exec` 呼び出しごとに、OpenClaw は実行スコープの
ツールカタログを構築し、可視の MCP エントリを保持し、`mcp/index.d.ts` と可視サーバーごとの
`mcp/<server>.d.ts` 宣言をレンダリングし、その小さな読み取り専用テーブルを QuickJS
ワーカーに注入します。ゲストコードから見えるのは `API` オブジェクトだけです:
`API.list(prefix?)` はファイルメタデータを返し、`API.read(path)` は選択された宣言内容を
返します。不明なパスと `.` / `..` セグメントは拒否されます。

これにより、大きな MCP スキーマをモデルプロンプトから排除できます。エージェントは
`exec` ツールの説明から仮想 API の存在を知り、必要な宣言ファイルだけを読み、
`MCP.<server>.<tool>()` を 1 つのオブジェクト引数で呼び出します。
`MCP.<server>.$api()` は、エージェントがプログラム内で単一ツールのスキーマ応答を必要とする
場合のインラインフォールバックとして引き続き利用できます。

ゲストランタイムはホストオブジェクトを直接公開してはなりません。入力と出力は、明示的な
サイズ上限を持つ JSON 互換値としてブリッジを通過します。

## 内部名前空間

内部名前空間は、モデルに可視なツールを増やすことなく、コードモードに簡潔なドメイン API を
提供します。ローダー所有のインテグレーションは `Issues`、`Fictions`、`Calendar` のような
名前空間を登録できます。ゲストコードは QuickJS プログラム内でその名前空間を呼び出しますが、
OpenClaw はモデルに `exec` と `wait` だけを表示し続けます。

名前空間は現時点では内部向けです。公開 Plugin SDK の名前空間 API はありません:
外部 Plugin の名前空間には、Plugin の ID、インストール済みマニフェスト、認証状態、キャッシュ済み
カタログ記述子が、その名前空間を支える Plugin ツールからずれないようにするための
ローダー所有の契約が必要です。コアコードモードが所有するのは、サンドボックス、
シリアライズ、カタログゲート、ブリッジディスパッチのみです。

ゲストコードは、直接グローバルまたは `namespaces` マップのどちらも使用できます:

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### レジストリライフサイクル

名前空間レジストリはプロセスローカルであり、名前空間 ID でキー付けされます。典型的な
実行はこのパスに従います:

1. 信頼されたローダーが `registerCodeModeNamespaceForPlugin(pluginId, registration)` を呼び出します。
2. コードモードはその実行用の隠し `ToolSearchRuntime` を作成し、その実行スコープの
   カタログを読みます。
3. `createCodeModeNamespaceRuntime(ctx, catalog)` は、`requiredToolNames` がすべて可視で、
   同じ `pluginId` によって所有されている登録だけを保持します。
4. 各可視名前空間は、現在の実行に対して `createScope(ctx)` を呼び出します。
   スコープは `agentId`、`sessionKey`、`sessionId`、`runId`、設定、中止状態などの
   実行コンテキストを受け取ります。
5. スコープデータはプレーンな記述子にシリアライズされ、直接グローバルおよび
   `namespaces.<globalName>` として QuickJS に注入されます。
6. ゲスト呼び出しはワーカーブリッジを通じて一時停止し、ホスト上で名前空間パスを解決し、
   呼び出しを宣言済みの Plugin 所有カタログツールにマップし、そのツールを
   `ToolSearchRuntime.call` 経由で実行します。
7. OpenClaw は、アクティブな `exec`/`wait` ツール呼び出し内で準備完了の名前空間ブリッジ呼び出しを
   自動的にドレインします。タイムアウト時に名前空間作業がまだ保留中である場合、またはゲストが
   明示的に yield した場合、`wait` は後で同じ名前空間ランタイムを再開します。
8. Plugin のロールバックまたはアンインストールは `clearCodeModeNamespacesForPlugin(pluginId)` を
   呼び出し、古いグローバルが失敗した Plugin ロード後に残らないようにします。

重要な不変条件: 名前空間呼び出しはカタログツール呼び出しです。これらは `tools.call(...)` と
同じポリシーフック、承認、中止処理、テレメトリ、トランスクリプト投影、一時停止/再開動作を
使用します。

### 登録の形式

支えとなるツールを所有するインテグレーションから名前空間を登録します。スコープは小さく保ち、
宣言済みカタログツールにマップされるドメイン動詞だけを公開します。

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

`createCodeModeNamespaceTool(toolName, inputMapper)` は、スコープメンバーを呼び出し可能な
名前空間関数としてマークします。任意の `inputMapper` はゲスト引数を受け取り、支えとなる
カタログツールの入力オブジェクトを返します。入力マッパーがない場合、最初のゲスト引数が
使用され、省略時は `{}` が使用されます。

生のホスト関数は、ゲストコードの実行前に拒否されます:

```typescript
createScope: () => ({
  // Wrong: this bypasses the catalog tool lifecycle and will be rejected.
  list: async () => githubClient.listIssues(),
});
```

### 所有権と可視性

名前空間の所有権は、登録呼び出し元の `pluginId` に結び付けられます。
`requiredToolNames` は可視性ゲートであると同時に所有権チェックでもあります:

- すべての必須ツールが実行カタログに存在する必要があります
- すべての必須ツールが `sourceName === pluginId` である必要があります
- 必須ツールのいずれかが存在しない、または別の Plugin に所有されている場合、名前空間は非表示になります
- 各呼び出し可能パスは、`requiredToolNames` に含まれる名前のツールだけを対象にできます

これにより、別の Plugin が同名ツールを登録して名前空間を公開することを防ぎます。また、
名前空間を通常のエージェントポリシーと整合させます。実行が支えとなるツールを見られない場合、
その名前空間も見られません。

たとえば、GitHub 名前空間は、GitHub 認証、REST または GraphQL クライアント、レート制限、
書き込み承認、テストを所有する GitHub 所有の拡張の背後に置くべきです。コアコードモードは、
GitHub 固有の API、トークン処理、プロバイダーポリシーを埋め込むべきではありません。

### スコープのシリアライズ規則

`createScope(ctx)` は、JSON 互換値、配列、ネストされたオブジェクト、
`createCodeModeNamespaceTool(...)` 呼び出しマーカーを含むプレーンオブジェクトを返せます。
ホストオブジェクトが QuickJS に直接入ることはありません。

シリアライザーは次を拒否します:

- 生の関数
- 循環オブジェクトグラフ
- 安全でないパスセグメント: `__proto__`、`constructor`、`prototype`、空キー、または
  内部パス区切り文字を含むキー
- JavaScript 識別子ではない `globalName` 値
- `tools`、`namespaces`、`text`、`json`、`yield_control`、`__openclaw*` などの
  組み込みコードモードグローバルとの `globalName` 衝突

JSON にシリアライズできない値は、ブリッジを通過する前に JSON 安全なフォールバック値へ
変換されます。バイナリデータ、ハンドル、ソケット、クライアント、クラスインスタンスは、
通常のカタログツールの背後に留めるべきです。

### プロンプト

名前空間の `description` と任意の `prompt` は、その実行で名前空間が可視の場合にのみ、
モデルに可視な `exec` スキーマへ追加されます。最小限で有用なサーフェスを教えるために
使用します:

```typescript
{
  description: "Fiction production service helpers.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status), and Fictions.unpaidOver(amount).",
}
```

プロンプトは名前空間の契約に関するものにし、認証セットアップ、実装履歴、無関係な
Plugin の動作については書かないでください。

### クリーンアップ

名前空間はプロセスローカルな登録です。所有する Plugin が無効化、アンインストール、またはロールバックされたときに削除します。

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

コードモードのクリーンアップは Plugin が所有します。名前空間ごとの破棄ハンドルを保持する代わりに、ライフサイクルが終了した時点でその Plugin の名前空間登録をクリアします。テストでは、ケース間で登録が漏れないように `clearCodeModeNamespacesForTest()` を呼び出せます。

### テストチェックリスト

名前空間の変更では、セキュリティ境界とゲストの動作をカバーする必要があります。

- 名前空間のプロンプトテキストは、対応するツールが表示されている場合にのみ表示される
- 別の `sourceName` からの同名ツールが名前空間を公開しない
- 生のスコープ関数が拒否される
- 偽造された名前空間 ID と偽造されたパスが拒否される
- 呼び出し可能なパスが未宣言のツールを対象にできない
- ネストしたオブジェクトと共有参照が正しくシリアライズされる
- 名前空間呼び出しはカタログツールを通じて実行され、JSON セーフな詳細を返す
- 失敗はゲストコードで捕捉できる
- 中断された名前空間呼び出しは `wait` を通じて再開される
- Plugin のロールバックにより、所有する名前空間登録がクリアされる

名前空間は汎用の `tools.search` / `tools.call` カタログを補完します。有効化された任意の OpenClaw、Plugin、クライアントツールにはカタログを使用し、MCP ツールには `MCP` を使用し、繰り返しスキーマ検索を行うより簡潔なコードのほうが信頼できる、Plugin 所有の文書化されたドメイン API には他の名前空間を使用します。

## 出力 API

`text(value)` は人間が読める出力を `output` 配列に追加します。

`json(value)` は JSON 互換のシリアライズ後に構造化された出力項目を追加します。

ゲストコードの最終戻り値は、`completed` 結果の `value` になります。

出力項目:

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

出力ルール:

- 出力順序はゲストの呼び出し順と一致する
- 出力は `maxOutputBytes` で上限設定される
- シリアライズできない値はプレーン文字列またはエラーに変換される
- バイナリ値は v1 ではサポートされない
- 画像とファイルは、コードモードブリッジではなく通常の OpenClaw ツールを通じてやり取りされる

## ツールカタログ

隠しカタログには、有効なポリシーフィルタリング後のツールが含まれます。

1. OpenClaw コアツール。
2. バンドルされた Plugin ツール。
3. 外部 Plugin ツール。
4. MCP ツール。
5. 現在の実行に対してクライアントから提供されたツール。

カタログ ID は 1 回の実行内で安定しており、可能な場合は同等のツールセット間で決定的です。

推奨される ID 形式:

```text
<source>:<owner>:<tool-name>
```

例:

```text
openclaw:core:message
plugin:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

カタログはコードモード制御ツールを省略します。

- `exec`
- `wait`
- `tool_search_code`
- `tool_search`
- `tool_describe`
- `tool_call`

これにより再帰を防ぎ、モデル向けの契約を狭く保ちます。

MCP エントリは実行スコープのカタログに残るため、ポリシー、承認、フック、テレメトリ、トランスクリプト投影、正確なツール ID は通常のツール実行と共有されたままになります。ゲスト向けの `ALL_TOOLS`、`tools.search(...)`、`tools.describe(...)`、`tools.call(...)` ビューは MCP エントリを省略します。生成された `MCP.<server>.<tool>({ ...input })` 名前空間は正確なカタログ ID に解決され、その後同じ実行パスを通じてディスパッチされます。

## ツール検索の相互作用

コードモードは、有効な実行では OpenClaw のツール検索モデルサーフェスを置き換えます。

`tools.codeMode.enabled` が true でコードモードが有効化される場合:

- OpenClaw は `tool_search_code`、`tool_search`、`tool_describe`、または `tool_call` をモデルから見えるツールとして公開しない。
- 同じカタログ化の考え方がゲストランタイム内に移動する。
- ゲストランタイムは、MCP 以外のツール向けにコンパクトな `ALL_TOOLS` メタデータと、検索、説明、呼び出しのヘルパーを受け取る。
- MCP 呼び出しは、`tools.call(...)` の代わりに生成された `MCP` 名前空間とその `$api()` ヘッダーを使用する。
- ネストした呼び出しは、ツール検索が使用するものと同じ OpenClaw 実行パスを通じてディスパッチされる。

既存の[ツール検索](/ja-JP/tools/tool-search)ページでは、OpenClaw のコンパクトなカタログブリッジについて説明しています。コードモードは、`exec` と `wait` を使用できる実行向けの汎用的な OpenClaw 代替手段です。

## ツール名と衝突

モデルから見える `exec` ツールはコードモードツールです。通常の OpenClaw シェル `exec` ツールが有効な場合、それはモデルから隠され、他のツールと同様にカタログ化されます。

ゲストランタイム内では:

- ポリシーで許可されている場合、`tools.call("openclaw:core:exec", input)` はシェル exec ツールを呼び出せる。
- シェル exec のカタログエントリに曖昧さのない安全な名前がある場合にのみ、`tools.exec(...)` がインストールされる。
- コードモードの `exec` ツールは、`tools` を通じて再帰的に利用可能になることはない。

2 つのツールが同じ安全な利便名に正規化される場合、OpenClaw は利便関数を省略し、`tools.call(id, input)` を要求します。

## ネストしたツール実行

すべてのネストしたツール呼び出しはホストブリッジをまたぎ、OpenClaw に再入力されます。

ネストした実行では次が保持されます。

- アクティブなエージェント ID
- セッション ID とセッションキー
- 送信者とチャネルコンテキスト
- サンドボックスポリシー
- 承認ポリシー
- Plugin の `before_tool_call` フック
- 中止シグナル
- 利用可能な場合のストリーミング更新
- 軌跡と監査イベント

ネストした呼び出しは、実際のツール呼び出しとしてトランスクリプトに投影されるため、サポートバンドルで何が起きたかを表示できます。この投影は、親のコードモードツール呼び出しとネストしたツール ID を識別します。

並列のネストした呼び出しは、`maxPendingToolCalls` まで許可されます。

## ランタイム状態

各コードモード実行には状態機械があります。

- `running`: VM が実行中、またはネストした呼び出しが進行中。
- `waiting`: VM スナップショットが存在し、`wait` で再開できる。
- `completed`: 最終値が返された。スナップショットは削除済み。
- `failed`: エラーが返された。スナップショットは削除済み。
- `expired`: スナップショットまたは保留状態が保持期間を超えた。再開不可。
- `aborted`: 親の実行またはセッションがキャンセルされた。スナップショットは削除済み。

状態は、エージェント実行、セッション、ツール呼び出し ID によってスコープ設定されます。別の実行またはセッションからの `wait` 呼び出しは失敗します。

スナップショットストレージには上限があります。

- 実行ごとの最大スナップショットバイト数
- プロセスごとの最大ライブスナップショット数
- スナップショット TTL
- 実行終了時のクリーンアップ
- 永続化がサポートされていない場合の Gateway シャットダウン時のクリーンアップ

## QuickJS-WASI ランタイム

OpenClaw は、所有パッケージ内の直接依存関係として `quickjs-wasi` をロードします。ランタイムは、プロキシ、PAC、または他の無関係な依存関係のためにインストールされた推移的なコピーには依存しません。

ランタイムの責務:

- QuickJS-WASI WebAssembly モジュールをコンパイルまたはロードする
- コードモードの実行または再開ごとに 1 つの分離された VM を作成する
- 安定した名前でホストコールバックを登録する
- メモリ制限と割り込み制限を設定する
- JavaScript を評価する
- 保留中のジョブをドレインする
- 中断された VM 状態をスナップショットする
- `wait` 用にスナップショットを復元する
- 終端状態後に VM ハンドルとスナップショットを破棄する

ランタイムは、ワーカー内で OpenClaw のメインイベントループの外側で実行されます。ゲストの無限ループが Gateway プロセスを無期限にブロックしてはなりません。

## TypeScript

TypeScript サポートはソース変換のみです。

- 受け付ける入力: 1 つの TypeScript コード文字列
- 出力: QuickJS-WASI によって評価される JavaScript 文字列
- 型チェックなし
- モジュール解決なし
- v1 では `import` または `require` なし
- 診断は `failed` 結果として返される

TypeScript コンパイラは、TypeScript セルの場合にのみ遅延ロードされます。プレーンな JavaScript セルと無効化されたコードモードでは、コンパイラはロードされません。

変換では、可能な場合に有用な行番号を保持する必要があります。

## セキュリティ境界

モデルコードは敵対的です。ランタイムは多層防御を使用します。

- メインイベントループの外側で QuickJS-WASI を実行する
- Codex や推移的なパッケージ経由ではなく、直接依存関係として `quickjs-wasi` をロードする
- ゲスト内にファイルシステム、ネットワーク、サブプロセス、モジュールインポート、環境変数、ホストグローバルオブジェクトを持たせない
- QuickJS のメモリ制限と割り込み制限を使用する
- 親プロセスの実時間タイムアウトを強制する
- 出力、スナップショット、ログ、保留呼び出しの上限を強制する
- 狭い JSON アダプターを通じてホストブリッジ値をシリアライズする
- ホストエラーをプレーンなゲストエラーに変換し、ホストレルムオブジェクトにはしない
- タイムアウト、中止、セッション終了、または期限切れ時にスナップショットを破棄する
- `exec`、`wait`、ツール検索制御ツールへの再帰アクセスを拒否する
- 利便名の衝突によってカタログヘルパーがシャドーされるのを防ぐ

サンドボックスはセキュリティ層の 1 つです。高リスクなデプロイでは、運用者が OS レベルの強化を必要とする場合があります。

## エラーコード

```typescript
type CodeModeErrorCode =
  | "runtime_unavailable"
  | "invalid_config"
  | "invalid_input"
  | "unsupported_language"
  | "typescript_transform_failed"
  | "module_access_denied"
  | "timeout"
  | "memory_limit_exceeded"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "snapshot_expired"
  | "snapshot_restore_failed"
  | "too_many_pending_tool_calls"
  | "nested_tool_failed"
  | "aborted"
  | "internal_error";
```

ゲストに返されるエラーはプレーンなデータです。ホストの `Error` インスタンス、スタックオブジェクト、プロトタイプ、ホスト関数は QuickJS に渡りません。

## テレメトリ

コードモードは次を報告します。

- モデルに送信された表示ツール名
- 隠しカタログのサイズとソース内訳
- `exec` と `wait` の回数
- ネストした検索、説明、呼び出しの回数
- 呼び出されたネストしたツール ID
- タイムアウト、メモリ、スナップショット、出力上限の失敗
- スナップショットのライフサイクルイベント

テレメトリには、既存の OpenClaw 軌跡ポリシーを超える秘密情報、生の環境値、または未編集のツール入力を含めてはなりません。

## デバッグ

コードモードが通常のツール実行と異なる動作をする場合は、対象を絞ったモデルトランスポートログを使用します。

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

ペイロード形状のデバッグには、`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` を使用します。これは、モデルリクエストの上限付きで編集済みの JSON スナップショットをログ出力します。プロンプトやメッセージテキストがまだ表示される可能性があるため、デバッグ中にのみ使用してください。

ストリームのデバッグには、`OPENCLAW_DEBUG_SSE=peek` を使用して、編集済み SSE イベントの先頭 5 件をログ出力します。コードモードは、コードモードサーフェスが有効化された後、最終的なプロバイダーペイロードに `exec` と `wait` が正確に含まれていない場合にもフェイルクローズします。

## 実装レイアウト

実装単位:

- 設定契約: `tools.codeMode`
- カタログビルダー: 有効なツールからコンパクトなエントリと ID マップへ
- モデルサーフェスアダプター: 表示ツールを `exec` と `wait` に置き換える
- QuickJS-WASI ランタイムアダプター: ロード、eval、スナップショット、復元、破棄
- ワーカースーパーバイザー: タイムアウト、中止、クラッシュ分離
- ブリッジアダプター: JSON セーフなホストコールバックと結果配送
- TypeScript 変換アダプター
- スナップショットストア: TTL、サイズ上限、実行/セッションのスコープ設定
- ネストしたツール呼び出しの軌跡投影
- テレメトリカウンターと診断

実装はツール検索からカタログと実行の概念を再利用しますが、`node:vm` 子プロセスをサンドボックスとして使用しません。

## 検証チェックリスト

コードモードのカバレッジでは、次を証明する必要があります。

- 無効化された設定では、既存のツール公開は変更されない
- `enabled: true` のないオブジェクト設定では、コードモードは無効のままになる
- 有効化された設定では、実行でツールがアクティブな場合、モデルには `exec` と `wait` のみが公開される
- 生のツールなし実行、`disableTools`、空の許可リストはコードモードのペイロード強制をトリガーしない
- 有効なすべての非 MCP ツールは `ALL_TOOLS` に表示される
- 拒否されたツールは `ALL_TOOLS` に表示されない
- `tools.search`、`tools.describe`、`tools.call` は OpenClaw ツールで動作する
- `API.list("mcp")` と `API.read("mcp/<server>.d.ts")` は、ブリッジ/ツール呼び出しなしで TypeScript 形式の MCP 宣言を公開する
- MCP 名前空間の `$api()` は、スキーマのインラインフォールバックとして引き続き利用できる
- MCP 名前空間呼び出しは、1 つのオブジェクト入力を持つ可視 MCP ツールで動作する一方、直接の MCP カタログエントリは `tools.*` に存在しない
- Tool Search 制御ツールは、モデルサーフェスと非表示カタログの両方から隠される
- ネストされた呼び出しは承認とフックの動作を保持する
- シェル `exec` はモデルから隠されるが、許可されている場合はカタログ ID で呼び出せる
- 再帰的なコードモードの `exec` と `wait` はゲストコードから呼び出せない
- TypeScript 入力は、無効化されたパスまたは JavaScript のみのパスで TypeScript を読み込まずに変換され、評価される
- `import`、`require`、ファイルシステム、ネットワーク、環境へのアクセスは失敗する
- 無限ループはタイムアウトし、Gateway をブロックできない
- メモリ上限の失敗はゲスト VM を終了する
- 出力とスナップショットの上限は、完了済みおよびサスペンド中の呼び出しに適用される
- `wait` はサスペンドされたスナップショットを再開し、最終値を返す
- 期限切れ、中止、誤ったセッション、不明な `runId` 値は失敗する
- トランスクリプトの再生と永続化は、コードモード制御呼び出しを保持する
- トランスクリプトとテレメトリは、ネストされたツール呼び出しを明確に表示する

## E2E テスト計画

ランタイムを変更するときは、これらを統合テストまたはエンドツーエンドテストとして実行する:

1. `tools.codeMode.enabled: false` で Gateway を起動する。
2. 小さな直接ツールセットを含むエージェントターンを送信する。
3. モデルに表示されるツールが変更されていないことをアサートする。
4. `tools.codeMode.enabled: true` で再起動する。
5. OpenClaw、Plugin、MCP、クライアントテストツールを含むエージェントターンを送信する。
6. モデルに表示されるツールリストが正確に `exec`、`wait` であることをアサートする。
7. `exec` で `ALL_TOOLS` を読み取り、有効なテストツールが存在することをアサートする。
8. `exec` で `tools.search`、`tools.describe`、`tools.call` を通じて OpenClaw/Plugin/クライアントツールを呼び出す。
9. `exec` で `API.list("mcp")` と `API.read("mcp/<server>.d.ts")` を呼び出し、宣言ファイルが可視 MCP ツールを記述していることをアサートする。
10. `exec` で `MCP.<server>.<tool>({ ...input })` を通じて MCP ツールを呼び出し、直接の MCP カタログエントリが `ALL_TOOLS` と `tools.*` に存在しないことをアサートする。
11. 拒否されたツールが存在せず、推測した ID で呼び出せないことをアサートする。
12. `exec` が `waiting` を返した後に解決するネストされたツール呼び出しを開始する。
13. `wait` を呼び出し、復元された VM がツール結果を受け取ることをアサートする。
14. 最終回答に復元後に生成された出力が含まれることをアサートする。
15. タイムアウト、中止、スナップショット期限切れがランタイム状態をクリーンアップすることをアサートする。
16. 軌跡をエクスポートし、ネストされた呼び出しが親コードモード呼び出しの下に表示されることをアサートする。

このページのドキュメントのみの変更でも `pnpm check:docs` を実行する必要がある。

## 関連

- [Tool Search](/ja-JP/tools/tool-search)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [Exec ツール](/ja-JP/tools/exec)
- [コード実行](/ja-JP/tools/code-execution)
