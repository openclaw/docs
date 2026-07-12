---
read_when:
    - すべてのツールスキーマをプロンプトに追加せずに、OpenClawエージェントで大規模なツールカタログを使用したい場合
    - OpenClaw ツール、MCP ツール、クライアントツールを、1 つのコンパクトなランタイムインターフェースを通じて公開したい場合
    - OpenClaw の実行におけるツール検出を実装またはデバッグしている場合
summary: ツール検索：大規模な OpenClaw ツールカタログを検索、説明、呼び出しの背後に集約する
title: ツール検索
x-i18n:
    generated_at: "2026-07-11T22:46:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6608a2de3b8ec03d3bb182d5909bb73429f623af8cebb34bc38856cb9d8b8c32
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search は、OpenClaw エージェントランタイムの実験的機能です。多数のツールカタログを検出して呼び出すための、コンパクトで統一された方法をエージェントに提供します。実行時に多数のツールを利用できる一方、モデルが必要とする可能性が高いツールがそのうち数個だけの場合に役立ちます。

このページでは、OpenClaw Tool Search について説明します。これは Codex ネイティブのツール検索や動的ツールのサーフェスではありません。Codex ネイティブのコードモード、ツール検索、遅延動的ツール、ネストされたツール呼び出しは、安定した Codex ハーネスのサーフェスであり、`tools.toolSearch` には依存しません。

OpenClaw の実行で有効にすると、モデルはデフォルトで 1 つの `tool_search_code` ツールに加え、構造化された結果をコンパクトブリッジ経由で渡せない direct-only ツールを受け取ります。コードツールは、分離された Node サブプロセス内で短い JavaScript 本文を、`openclaw.tools` ブリッジとともに実行します。

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

カタログには、カタログ登録対象の OpenClaw ツール、Plugin ツール、MCP ツール、クライアント提供ツールを含められます。モデルには、カタログ内のすべてのスキーマが最初から表示されるわけではありません。代わりに、コンパクトな記述子を検索し、正確なスキーマが必要になった時点で選択した 1 つのツールの詳細を取得し、そのツールを OpenClaw 経由で呼び出します。direct-only ツールは引き続きモデルに表示され、カタログには追加されません。

Codex ハーネスの実行では、これらの実験的な OpenClaw Tool Search の制御機能を受け取りません。OpenClaw は製品機能を動的ツールとして Codex に渡し、安定したネイティブコードモード、ネイティブツール検索、遅延動的ツール、ネストされたツール呼び出しは Codex が管理します。

## ターンの実行方法

計画時に、OpenClaw の組み込みランナーが実行用の有効なカタログを構築します。

1. エージェント、プロファイル、サンドボックス、セッションに対する有効なツールポリシーを解決します。
2. 対象となる OpenClaw ツールと Plugin ツールを列挙します。
3. セッションの MCP ランタイムを通じて、対象となる MCP ツールを列挙します。
4. 現在の実行に提供された対象クライアントツールを追加します。
5. direct-only ツールはモデルに表示したままにし、残りのカタログ登録対象ツールについてコンパクトな記述子をインデックス化します。
6. それらの direct-only ツールとともに、OpenClaw コードブリッジ、構造化フォールバックツール、またはコンパクトなディレクトリサーフェスを公開します。

実行時には、実際のツール呼び出しがすべて OpenClaw に戻ります。分離された Node ランタイムは、Plugin の実装、MCP クライアントオブジェクト、シークレットを保持しません。`openclaw.tools.call(...)` はブリッジを越えて Gateway に戻り、通常のポリシー、承認、フック、ログ記録、結果処理が引き続き適用されます。

## モード

`tools.toolSearch` には、モデル向けのモードが 3 つあります。

- `code`: デフォルトのコンパクトな JavaScript ブリッジである `tool_search_code` を、direct-only ツールとともに公開します。
- `tools`: コードを受け取るべきでないプロバイダー向けに、`tool_search`、`tool_describe`、`tool_call` を通常の構造化ツールとして、direct-only ツールとともに公開します。
- `directory`: `tool_search`、`tool_describe`、`tool_call` に加え、すべての完全なスキーマを表示せずにツール名を確認すべきプロバイダー向けに、利用可能なツール名と説明を収めた上限付きのプロンプトディレクトリを公開します。OpenClaw は、現在のターンで使用される可能性が高い、または必須のツールスキーマのうち、上限付きの小規模な集合を直接公開することもできます。このモードでも direct-only ツールは引き続き表示されます。

すべてのモードで、同じポリシーフィルタリング済みカタログと通常の OpenClaw 実行経路を使用します。`catalogMode: "direct-only"` と指定されたツールはそのカタログの外部に留まり、引き続きモデルに表示されます。現在のランタイムが分離された Node コードモードの子プロセスを起動できない場合、デフォルトの `code` モードは、カタログの圧縮前に `tools` にフォールバックします。`directory` モードでは、クライアント提供ツールは現在の実行中に直接表示されたままになり、OpenClaw ツール、Plugin ツール、MCP ツールはディレクトリカタログの背後に圧縮できます。非表示になっている正確なディレクトリ名を直接呼び出す場合は、実行前に、同じ承認済みカタログからそのツールが展開されます。

すべてのモードは実験的です。OpenClaw のツールカタログが小さい場合はツールの直接公開を優先し、Codex ハーネスの実行では Codex ネイティブの安定したサーフェスを優先してください。

個別のソース選択設定はありません。Tool Search を有効にすると、通常のポリシーフィルタリング後に、カタログ登録対象の OpenClaw、MCP、クライアントツールがカタログに含まれます。direct-only ツールは別に保持されます。

## この機能が存在する理由

大規模なカタログは便利ですが、コストが高くなります。すべてのツールスキーマをモデルに送信すると、リクエストが大きくなり、計画が遅くなり、誤ってツールを選択する可能性が高まります。

Tool Search は構成を次のように変えます。

- 直接ツール: モデルは最初のトークンの前に、選択されたすべてのスキーマを確認します
- Tool Search のコードモード: モデルは 1 つのコンパクトなコードツール、短い API コントラクト、direct-only ツールを確認します
- Tool Search のツールモード: モデルは 3 つのコンパクトな構造化フォールバックツールと direct-only ツールを確認します
- Tool Search のディレクトリモード: モデルは上限付きのディレクトリ、検索・詳細取得・呼び出しの制御機能、使用される可能性が高い、または必須のスキーマの上限付き小規模集合、direct-only ツールを確認します
- ターン中: モデルは必要に応じて残りのスキーマを読み込めます

小規模なカタログでは、ツールの直接公開が引き続き適切なデフォルトです。Tool Search は、1 回の実行で多数のツールを参照できる場合、特に MCP サーバーやクライアント提供のアプリツールがある場合に最適です。

## API

`openclaw.tools.search(query, options?)`

現在の実行に対する有効なカタログを検索します。結果はコンパクトであり、プロンプトコンテキストに安全に戻せます。

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

正確な入力スキーマを含む、1 件の検索結果の完全なメタデータを読み込みます。

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

構造化フォールバックモードでは、同じ操作を次のツールとして公開します。

- `tool_search`
- `tool_describe`
- `tool_call`

ディレクトリモードでは、次を公開します。

- `tool_search`
- `tool_describe`
- `tool_call`

また、クライアント提供ツールとすべての direct-only ツールを直接表示したままにし、現在のターンで使用される可能性が高い、または必須のカタログツールスキーマのうち、上限付きの小規模な集合を直接公開することがあります。上限付きディレクトリで項目が省略されている場合は、`tool_search` を使用して検索してください。モデルが非表示になっている正確なディレクトリツール名を直接要求した場合、OpenClaw は通常実行の前に、承認済みカタログからそのツールを展開します。
正確な遅延ディスパッチではこれらの名前を使用するため、ディレクトリモードのクライアントツール名は、OpenClaw、Plugin、MCP のツール名と重複してはなりません。

## ランタイム境界

コードブリッジは、短時間だけ存続する Node サブプロセス内で実行されます。サブプロセスは、Node の権限モードを有効にし、環境を空にした状態で起動します。ファイルシステムやネットワークへの許可、および子プロセスやワーカーへの許可はありません。OpenClaw は親プロセス側で実時間タイムアウトを適用し、非同期処理の継続後も含め、タイムアウト時にサブプロセスを終了します。

ランタイムが公開するのは次のものだけです。

- `console.log`、`console.warn`、`console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

最終的な呼び出しには、通常の OpenClaw の動作が引き続き適用されます。

- ツールの許可・拒否ポリシー
- エージェント単位およびサンドボックス単位のツール制限
- チャネル・ランタイムのツールポリシー
- 承認フック
- Plugin の `before_tool_call` フック
- セッション ID、ログ、テレメトリ

## 設定

デフォルトのコードブリッジを使用して、OpenClaw の実行で Tool Search を有効にします。

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

代わりに、OpenClaw の実行で構造化フォールバックツールを使用します。

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

代わりに、OpenClaw の実行でコンパクトなディレクトリサーフェスを使用します。

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

コードモードのタイムアウトと検索結果の上限を調整します（表示されている値はデフォルトです）。

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

ランタイムは、`codeTimeoutMs` を 1000〜60000、`maxSearchLimit` を 1〜50、`searchDefaultLimit` を 1〜`maxSearchLimit` の範囲に制限します。

無効にするには、次のように設定します。

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## プロンプトとテレメトリ

Tool Search は、ツールの直接公開と比較するために十分なテレメトリを記録します。

- ハーネスに送信された、シリアル化済みツールとプロンプトの合計バイト数
- カタログサイズとソース別の内訳
- 検索、詳細取得、呼び出しの回数
- OpenClaw 経由で実行された最終ツール呼び出し
- 選択されたツール ID とソース

セッションログから、次の問いに回答できる必要があります。

- モデルが最初に確認したツールスキーマの数
- 実行した検索操作と詳細取得操作の数
- 最終的に呼び出されたツール
- 結果の提供元が OpenClaw、MCP、クライアントツールのいずれであるか

## E2E 検証

QA Lab の Gateway シナリオでは、OpenClaw ランタイムを使用して両方の経路を検証します。

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

このシナリオは、大規模なツールカタログを持つ一時的な偽 Plugin を作成し、モック OpenAI プロバイダーを起動します。その後、直接モードで 1 回、Tool Search を有効にして 1 回 Gateway を起動し、プロバイダーへのリクエストペイロードとセッションログを比較します。

この回帰テストでは、次のことを検証します。

1. 直接モードで偽 Plugin ツールを呼び出せること。
2. Tool Search で同じ偽 Plugin ツールを呼び出せること。
3. 直接モードでは、偽 Plugin ツールのスキーマがプロバイダーに直接公開されること。
4. Tool Search では、コンパクトブリッジと direct-only ツールだけが公開されること。
5. 大規模な偽カタログでは、Tool Search のリクエストペイロードが小さくなること。
6. セッションログに、想定されるツール呼び出し回数とブリッジ経由の呼び出しテレメトリが記録されること。

## 失敗時の動作

Tool Search は、安全側に閉じる形で失敗する必要があります。

- ツールが有効なポリシーに含まれていない場合、検索結果にそのツールを含めないこと
- 選択したツールが利用できなくなった場合、`tool_call` が失敗すること
- ポリシーまたは承認によって実行がブロックされた場合、呼び出し結果ではそれを迂回せず、ブロックされたことを報告すること
- コードブリッジが分離ランタイムを作成できない場合、そのデプロイでは `mode: "tools"` を使用するか、Tool Search を無効にすること

## 関連項目

- [ツールと Plugin](/ja-JP/tools)
- [マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools)
- [Exec ツール](/ja-JP/tools/exec)
- [ACP エージェントのセットアップ](/ja-JP/tools/acp-agents-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
