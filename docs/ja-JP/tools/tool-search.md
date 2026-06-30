---
read_when:
    - OpenClaw エージェントに、すべてのツールスキーマをプロンプトに追加せずに大規模なツールカタログを使わせたい
    - OpenClaw ツール、MCP ツール、クライアントツールを 1 つのコンパクトなランタイムサーフェスを通じて公開したい
    - OpenClaw 実行のツール検出を実装またはデバッグしている
summary: 'ツール検索: 大規模な OpenClaw ツールカタログを search、describe、call の背後に Compaction する'
title: ツール検索
x-i18n:
    generated_at: "2026-06-30T13:49:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81036277d763be8040526b42c116b2e503589921a58b3f765ff38670554a751c
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search は実験的な OpenClaw エージェントランタイム機能です。エージェントが大規模なツールカタログを見つけて呼び出すための、コンパクトな単一の方法を提供します。実行時に利用可能なツールが多数ある一方で、モデルが必要とする可能性が高いツールがそのうち少数だけの場合に有用です。

このページでは OpenClaw Tool Search について説明します。これは Codex ネイティブのツール検索または動的ツールサーフェスではありません。Codex ネイティブのコードモード、ツール検索、遅延動的ツール、ネストされたツール呼び出しは安定した Codex ハーネスサーフェスであり、`tools.toolSearch` には依存しません。

OpenClaw 実行で有効にすると、モデルはデフォルトで 1 つの `tool_search_code` ツールを受け取ります。このツールは、`openclaw.tools` ブリッジを持つ分離された Node サブプロセス内で短い JavaScript 本体を実行します。

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

カタログには、OpenClaw ツール、Pluginツール、MCP ツール、クライアント提供ツールを含められます。モデルは最初からすべての完全なスキーマを見るわけではありません。代わりに、コンパクトな記述子を検索し、正確なスキーマが必要になったときに選択した 1 つのツールを記述し、OpenClaw 経由でそのツールを呼び出します。

Codex ハーネス実行は、これらの実験的な OpenClaw Tool Search 制御を受け取りません。OpenClaw は製品機能を動的ツールとして Codex に渡し、Codex が安定したネイティブコードモード、ネイティブツール検索、遅延動的ツール、ネストされたツール呼び出しを所有します。

## ターンの実行方法

計画時に、OpenClaw 組み込みランナーはその実行に有効なカタログを構築します。

1. エージェント、プロファイル、サンドボックス、セッションのアクティブなツールポリシーを解決します。
2. 対象となる OpenClaw ツールと Pluginツールを一覧化します。
3. セッション MCP ランタイムを通じて、対象となる MCP ツールを一覧化します。
4. 現在の実行に提供された対象クライアントツールを追加します。
5. 検索用にコンパクトな記述子をインデックス化します。
6. OpenClaw コードブリッジ、構造化フォールバックツール、またはコンパクトなディレクトリサーフェスをモデルに公開します。

実行時、実際のすべてのツール呼び出しは OpenClaw に戻ります。分離された Node ランタイムは、Plugin実装、MCP クライアントオブジェクト、シークレットを保持しません。`openclaw.tools.call(...)` はブリッジを越えて Gateway に戻り、そこで通常のポリシー、承認、フック、ロギング、結果処理が引き続き適用されます。

## モード

`tools.toolSearch` には、モデル向けの 3 つのモードがあります。

- `code`: デフォルトのコンパクトな JavaScript ブリッジである `tool_search_code` を公開します。
- `tools`: コードを受け取るべきでないプロバイダー向けに、`tool_search`、`tool_describe`、`tool_call` を通常の構造化ツールとして公開します。
- `directory`: すべての完全なスキーマなしでツール名を見るべきプロバイダー向けに、`tool_search`、`tool_describe`、`tool_call` に加えて、利用可能なツール名と説明の範囲付きプロンプトディレクトリを公開します。OpenClaw は、現在のターンに対して、可能性が高い、または必須のツールスキーマの小さな範囲付きセットを直接公開することもできます。

すべてのモードは、同じポリシーでフィルタリングされたカタログと通常の OpenClaw 実行パスを使用します。現在のランタイムが分離された Node コードモード子プロセスを起動できない場合、デフォルトの `code` モードはカタログ Compaction の前に `tools` にフォールバックします。`directory` モードでは、クライアント提供ツールは現在の実行に対して直接表示されたままになり、OpenClaw ツール、Pluginツール、MCP ツールはディレクトリカタログの背後にコンパクト化できます。正確な隠しディレクトリ名への直接呼び出しは、実行前に同じ承認済みカタログからハイドレートされます。

すべてのモードは実験的です。小規模な OpenClaw ツールカタログには直接ツール公開を優先し、Codex ハーネス実行には Codex ネイティブの安定したサーフェスを優先してください。

ソース選択用の個別設定はありません。Tool Search が有効な場合、カタログには通常のポリシーフィルタリング後に対象となる OpenClaw、MCP、クライアントツールが含まれます。

## これが存在する理由

大規模なカタログは有用ですが高コストです。すべてのツールスキーマをモデルに送ると、リクエストが大きくなり、計画が遅くなり、意図しないツール選択が増えます。

Tool Search は形を変えます。

- 直接ツール: モデルは最初のトークンの前に、選択されたすべてのスキーマを見ます
- Tool Search コードモード: モデルは 1 つのコンパクトなコードツールと短い API 契約を見ます
- Tool Search ツールモード: モデルは 3 つのコンパクトな構造化フォールバックツールを見ます
- Tool Search ディレクトリモード: モデルは範囲付きディレクトリ、検索/記述/呼び出し制御、可能性が高い、または必須のスキーマの小さな範囲付きセットを見ます
- ターン中: モデルは必要に応じて残りのスキーマを読み込めます

小規模なカタログでは、直接ツール公開が引き続き適切なデフォルトです。Tool Search は、1 回の実行で多数のツールを見える場合、特に MCP サーバーやクライアント提供アプリツール由来の場合に最適です。

## API

`openclaw.tools.search(query, options?)`

現在の実行に有効なカタログを検索します。結果はコンパクトで、プロンプトコンテキストに戻しても安全です。

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

正確な入力スキーマを含む、1 つの検索結果の完全なメタデータを読み込みます。

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

ディレクトリモードは次を公開します。

- `tool_search`
- `tool_describe`
- `tool_call`

また、クライアント提供ツールを直接表示したままにし、現在のターンに対して、可能性が高い、または必須のカタログツールスキーマの小さな範囲付きセットを直接公開する場合があります。範囲付きディレクトリでエントリが省略されている場合は、`tool_search` を使って見つけます。モデルが正確な隠しディレクトリツール名を直接要求した場合、OpenClaw は通常実行の前に承認済みカタログからそれをハイドレートします。
ディレクトリモードのクライアントツール名は、OpenClaw、Plugin、MCP のツール名と衝突してはいけません。正確な遅延ディスパッチはそれらの名前を使用するためです。

## ランタイム境界

コードブリッジは短命の Node サブプロセス内で実行されます。サブプロセスは、Node 権限モードが有効、空の環境、ファイルシステムやネットワークの許可なし、子プロセスやワーカーの許可なしで開始されます。OpenClaw は親プロセスの実時間タイムアウトを適用し、非同期継続の後も含め、タイムアウト時にサブプロセスを終了します。

ランタイムが公開するものは次のみです。

- `console.log`、`console.warn`、`console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

最終呼び出しには、通常の OpenClaw の動作が引き続き適用されます。

- ツールの許可および拒否ポリシー
- エージェント単位およびサンドボックス単位のツール制限
- チャネル/ランタイムのツールポリシー
- 承認フック
- Plugin `before_tool_call` フック
- セッション ID、ログ、テレメトリ

## 設定

デフォルトのコードブリッジで OpenClaw 実行の Tool Search を有効にします。

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

OpenClaw 実行で、代わりに構造化フォールバックツールを使用します。

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

OpenClaw 実行で、代わりにコンパクトなディレクトリサーフェスを使用します。

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

コードモードのタイムアウトと検索結果上限を調整します。

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

無効にします。

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## プロンプトとテレメトリ

Tool Search は、直接ツール公開と比較するのに十分なテレメトリを記録します。

- ハーネスに送信された、シリアライズ済みツールとプロンプトの合計バイト数
- カタログサイズとソース内訳
- 検索、記述、呼び出しの回数
- OpenClaw 経由で実行された最終ツール呼び出し
- 選択されたツール ID とソース

セッションログから、次のことに答えられる必要があります。

- モデルが最初に見たツールスキーマの数
- 実行した検索操作と記述操作の数
- 呼び出された最終ツール
- 結果が OpenClaw、MCP、クライアントツールのいずれに由来するか

## E2E 検証

QA Lab Gateway シナリオは、OpenClaw ランタイムで両方のパスを証明します。

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

これは、大規模なツールカタログを持つ一時的な偽 Pluginを作成し、モック OpenAI プロバイダーを起動し、Gateway を直接モードで 1 回、Tool Search 有効で 1 回起動してから、プロバイダーリクエストペイロードとセッションログを比較します。

この回帰テストは次を証明します。

1. 直接モードで偽 Pluginツールを呼び出せます。
2. Tool Search で同じ偽 Pluginツールを呼び出せます。
3. 直接モードでは、偽 Pluginツールスキーマがプロバイダーに直接公開されます。
4. Tool Search はコンパクトなブリッジのみを公開します。
5. 大規模な偽カタログでは、Tool Search のリクエストペイロードの方が小さくなります。
6. セッションログには、期待されるツール呼び出し回数とブリッジされた呼び出しテレメトリが表示されます。

## 失敗時の動作

Tool Search はフェイルクローズであるべきです。

- ツールが有効なポリシー内にない場合、検索はそれを返すべきではありません
- 選択したツールが利用不可になった場合、`tool_call` は失敗すべきです
- ポリシーまたは承認が実行をブロックする場合、呼び出し結果はそれをバイパスするのではなく、そのブロックを報告すべきです
- コードブリッジが分離されたランタイムを作成できない場合、そのデプロイでは `mode: "tools"` を使用するか、Tool Search を無効にしてください

## 関連

- [ツールとPlugin](/ja-JP/tools)
- [マルチエージェントサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools)
- [Exec ツール](/ja-JP/tools/exec)
- [ACP エージェント設定](/ja-JP/tools/acp-agents-setup)
- [Pluginの構築](/ja-JP/plugins/building-plugins)
