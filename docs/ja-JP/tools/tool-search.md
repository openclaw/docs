---
read_when:
    - すべてのツールスキーマをプロンプトに追加せずに、OpenClaw エージェントに大規模なツールカタログを使用させたい場合
    - OpenClawツール、MCPツール、クライアントツールを1つのコンパクトなランタイムサーフェスを通じて公開したい場合
    - OpenClaw実行のツール検出を実装またはデバッグしている
summary: 'Tool Search: 大規模な OpenClaw ツールカタログを検索、説明、呼び出しの背後に compact する'
title: ツール検索
x-i18n:
    generated_at: "2026-07-05T11:56:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa8a7f8580fe3743bfc6082ad3ab0fef848a326539131b4804e577daa05f4137
    source_path: tools/tool-search.md
    workflow: 16
---

ツール検索は、実験的な OpenClaw エージェントランタイム機能です。エージェントが大規模なツールカタログを発見して呼び出すための、コンパクトな方法を1つ提供します。実行で利用可能なツールが多数ある一方で、モデルが必要とする可能性が高いものがそのうち少数だけの場合に有用です。

このページでは OpenClaw ツール検索について説明します。これは Codex ネイティブのツール検索や動的ツールのサーフェスではありません。Codex ネイティブのコードモード、ツール検索、遅延動的ツール、ネストされたツール呼び出しは安定した Codex ハーネスサーフェスであり、`tools.toolSearch` には依存しません。

OpenClaw 実行で有効にすると、モデルはデフォルトで1つの `tool_search_code` ツールを受け取ります。そのツールは、分離された Node サブプロセス内で短い JavaScript 本体を実行し、`openclaw.tools` ブリッジを使用します。

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

カタログには、OpenClaw ツール、plugin ツール、MCP ツール、クライアント提供ツールを含められます。モデルは最初からすべての完全なスキーマを見るわけではありません。代わりに、コンパクトな記述子を検索し、正確なスキーマが必要になったときに選択した1つのツールを説明し、そのツールを OpenClaw 経由で呼び出します。

Codex ハーネス実行は、これらの実験的な OpenClaw ツール検索コントロールを受け取りません。OpenClaw は製品機能を動的ツールとして Codex に渡し、Codex が安定したネイティブコードモード、ネイティブツール検索、遅延動的ツール、ネストされたツール呼び出しを所有します。

## ターンの実行方法

計画時に、OpenClaw 組み込みランナーは実行に対する有効なカタログを構築します。

1. エージェント、プロファイル、サンドボックス、セッションに対するアクティブなツールポリシーを解決します。
2. 対象となる OpenClaw ツールと plugin ツールを一覧表示します。
3. セッション MCP ランタイムを通じて対象となる MCP ツールを一覧表示します。
4. 現在の実行に提供された対象のクライアントツールを追加します。
5. 検索用にコンパクトな記述子をインデックス化します。
6. OpenClaw コードブリッジ、構造化フォールバックツール、またはコンパクトなディレクトリサーフェスをモデルに公開します。

実行時には、すべての実ツール呼び出しが OpenClaw に戻ります。分離された Node ランタイムは、plugin 実装、MCP クライアントオブジェクト、またはシークレットを保持しません。`openclaw.tools.call(...)` はブリッジを越えて Gateway に戻り、そこでは通常のポリシー、承認、フック、ロギング、結果処理が引き続き適用されます。

## モード

`tools.toolSearch` には、モデル向けのモードが3つあります。

- `code`: デフォルトのコンパクトな JavaScript ブリッジである `tool_search_code` を公開します。
- `tools`: コードを受け取るべきでないプロバイダー向けに、`tool_search`、`tool_describe`、`tool_call` を通常の構造化ツールとして公開します。
- `directory`: すべての完全なスキーマなしでツール名を見るべきプロバイダー向けに、`tool_search`、`tool_describe`、`tool_call` に加えて、利用可能なツール名と説明の範囲付きプロンプトディレクトリを公開します。OpenClaw は、現在のターンで可能性が高い、または必須のツールスキーマの小さな範囲付きセットを直接公開することもできます。

すべてのモードは、同じポリシーフィルタ済みカタログと通常の OpenClaw 実行パスを使用します。現在のランタイムが分離された Node コードモード子プロセスを起動できない場合、デフォルトの `code` モードはカタログの Compaction の前に `tools` にフォールバックします。`directory` モードでは、クライアント提供ツールは現在の実行で直接表示されたままになり、OpenClaw ツール、plugin ツール、MCP ツールはディレクトリカタログの背後でコンパクト化できます。正確な非表示ディレクトリ名への直接呼び出しは、実行前に同じ承認済みカタログからハイドレートされます。

すべてのモードは実験的です。小規模な OpenClaw ツールカタログには直接ツール公開を優先し、Codex ハーネス実行には Codex ネイティブの安定したサーフェスを優先してください。

個別のソース選択設定はありません。ツール検索が有効な場合、カタログには通常のポリシーフィルタリング後に対象となる OpenClaw、MCP、クライアントツールが含まれます。

## これが存在する理由

大規模なカタログは有用ですが高コストです。すべてのツールスキーマをモデルに送信すると、リクエストが大きくなり、計画が遅くなり、意図しないツール選択が増えます。

ツール検索は形を変えます。

- 直接ツール: モデルは最初のトークンの前に、選択されたすべてのスキーマを見ます
- ツール検索コードモード: モデルは1つのコンパクトなコードツールと短い API コントラクトを見ます
- ツール検索ツールモード: モデルは3つのコンパクトな構造化フォールバックツールを見ます
- ツール検索ディレクトリモード: モデルは、範囲付きディレクトリに加えて検索/説明/呼び出しコントロールと、可能性が高い、または必須のスキーマの小さな範囲付きセットを見ます
- ターン中: モデルは必要に応じて残りのスキーマを読み込めます

小規模なカタログでは、直接ツール公開が引き続き適切なデフォルトです。ツール検索は、1つの実行が多くのツール、特に MCP サーバーやクライアント提供アプリツール由来のツールを参照できる場合に最適です。

## API

`openclaw.tools.search(query, options?)`

現在の実行に対する有効なカタログを検索します。結果はコンパクトで、プロンプトコンテキストに戻しても安全です。

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

正確な入力スキーマを含む、1つの検索結果の完全なメタデータを読み込みます。

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

選択したツールを OpenClaw 経由で呼び出します。

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

構造化フォールバックモードは、同じ操作をツールとして公開します。

- `tool_search`
- `tool_describe`
- `tool_call`

ディレクトリモードは以下を公開します。

- `tool_search`
- `tool_describe`
- `tool_call`

また、クライアント提供ツールを直接表示したままにし、現在のターンで可能性が高い、または必須のカタログツールスキーマの小さな範囲付きセットを直接公開する場合があります。範囲付きディレクトリがエントリを省略している場合は、`tool_search` を使用して見つけます。モデルが正確な非表示ディレクトリツール名を直接要求した場合、OpenClaw は通常の実行前に承認済みカタログからそれをハイドレートします。
ディレクトリモードのクライアントツール名は、OpenClaw、plugin、または MCP ツール名と衝突してはなりません。正確な遅延ディスパッチはそれらの名前を使用するためです。

## ランタイム境界

コードブリッジは短命の Node サブプロセスで実行されます。サブプロセスは、Node 権限モードが有効な状態、空の環境、ファイルシステムまたはネットワーク許可なし、子プロセスまたはワーカー許可なしで開始します。OpenClaw は親プロセスの実時間タイムアウトを強制し、非同期継続の後も含め、タイムアウト時にサブプロセスを強制終了します。

ランタイムが公開するのは以下のみです。

- `console.log`、`console.warn`、`console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

最終呼び出しには、通常の OpenClaw 動作が引き続き適用されます。

- ツール許可および拒否ポリシー
- エージェント単位およびサンドボックス単位のツール制限
- チャンネル/ランタイムのツールポリシー
- 承認フック
- plugin `before_tool_call` フック
- セッション ID、ログ、テレメトリ

## 設定

デフォルトのコードブリッジで OpenClaw 実行のツール検索を有効にします。

```bash
openclaw config set tools.toolSearch true
```

同等の JSON:

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

OpenClaw 実行で代わりに構造化フォールバックツールを使用します。

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

OpenClaw 実行で代わりにコンパクトなディレクトリサーフェスを使用します。

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

コードモードのタイムアウトと検索結果の制限を調整します（表示値はデフォルトです）。

```json5
{
  tools: {
    toolSearch: {
      mode: "code",
      codeTimeoutMs: 10000,
      searchDefaultLimit: 8,
      maxSearchLimit: 20,
    },
  },
}
```

ランタイムは `codeTimeoutMs` を 1000-60000 に、`maxSearchLimit` を 1-50 に、`searchDefaultLimit` を 1..`maxSearchLimit` にクランプします。

無効にします。

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## プロンプトとテレメトリ

ツール検索は、直接ツール公開と比較するのに十分なテレメトリを記録します。

- ハーネスに送信されたシリアライズ済みツールとプロンプトの総バイト数
- カタログサイズとソース内訳
- 検索、説明、呼び出しの回数
- OpenClaw 経由で実行された最終ツール呼び出し
- 選択されたツール ID とソース

セッションログから、以下に答えられる必要があります。

- モデルが最初に見たツールスキーマの数
- 実行した検索操作と説明操作の数
- 呼び出された最終ツール
- 結果が OpenClaw、MCP、またはクライアントツールのどれから来たか

## E2E 検証

QA Lab Gateway シナリオは、OpenClaw ランタイムで両方のパスを証明します。

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

これは、大規模なツールカタログを持つ一時的な偽 plugin を作成し、モック OpenAI プロバイダーを開始し、Gateway を直接モードで1回、ツール検索を有効にして1回開始してから、プロバイダーリクエストペイロードとセッションログを比較します。

このリグレッションが証明することは次のとおりです。

1. 直接モードは偽 plugin ツールを呼び出せる。
2. ツール検索は同じ偽 plugin ツールを呼び出せる。
3. 直接モードは偽 plugin ツールスキーマをプロバイダーに直接公開する。
4. ツール検索はコンパクトなブリッジのみを公開する。
5. 大規模な偽カタログでは、ツール検索のリクエストペイロードが小さい。
6. セッションログは、期待されるツール呼び出し回数とブリッジされた呼び出しテレメトリを示す。

## 失敗時の動作

ツール検索はフェイルクローズする必要があります。

- ツールが有効なポリシーに含まれていない場合、検索はそれを返すべきではありません
- 選択したツールが利用できなくなった場合、`tool_call` は失敗するべきです
- ポリシーまたは承認が実行をブロックした場合、呼び出し結果はそれをバイパスするのではなく、そのブロックを報告するべきです
- コードブリッジが分離ランタイムを作成できない場合は、そのデプロイメントで `mode: "tools"` を使用するか、ツール検索を無効にします

## 関連

- [ツールと plugins](/ja-JP/tools)
- [マルチエージェントサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools)
- [Exec ツール](/ja-JP/tools/exec)
- [ACP エージェントセットアップ](/ja-JP/tools/acp-agents-setup)
- [plugins の構築](/ja-JP/plugins/building-plugins)
