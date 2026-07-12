---
read_when:
    - すべてのツールスキーマをプロンプトに追加せずに、OpenClawエージェントで大規模なツールカタログを使用する場合
    - OpenClaw ツール、MCP ツール、クライアントツールを、1 つのコンパクトなランタイムサーフェスを通じて公開したい場合
    - OpenClaw の実行におけるツール検出を実装またはデバッグしている場合
summary: ツール検索：大規模な OpenClaw ツールカタログを検索、説明、呼び出しでコンパクト化する
title: ツール検索
x-i18n:
    generated_at: "2026-07-12T14:53:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6608a2de3b8ec03d3bb182d5909bb73429f623af8cebb34bc38856cb9d8b8c32
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search は、OpenClaw エージェントランタイムの実験的機能です。エージェントが大規模なツールカタログを検出して呼び出すための、単一でコンパクトな方法を提供します。実行時に多数のツールが利用可能でも、モデルが必要とする可能性があるツールがごく少数の場合に有用です。

このページでは、OpenClaw Tool Search について説明します。Codex ネイティブのツール検索や動的ツールのサーフェスについて説明するものではありません。Codex ネイティブのコードモード、ツール検索、遅延動的ツール、ネストされたツール呼び出しは、安定した Codex ハーネスのサーフェスであり、`tools.toolSearch` には依存しません。

OpenClaw の実行で有効にすると、モデルはデフォルトで 1 つの `tool_search_code` ツールに加え、構造化された結果をコンパクトブリッジ経由で受け渡せない direct-only ツールを受け取ります。コードツールは、`openclaw.tools` ブリッジを備えた隔離された Node サブプロセス内で短い JavaScript コードを実行します。

```js
const hits = await openclaw.tools.search("GitHub の issue を作成する");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "起動時にクラッシュする",
  body: "再現手順...",
});
```

カタログには、カタログ対象の OpenClaw ツール、Plugin ツール、MCP ツール、クライアント提供ツールを含めることができます。モデルには、カタログ登録されたすべてのスキーマが事前に提示されるわけではありません。代わりに、コンパクトな記述子を検索し、正確なスキーマが必要な場合は選択したツール 1 つの詳細を取得し、そのツールを OpenClaw 経由で呼び出します。direct-only ツールは引き続きモデルから見える状態に保たれ、カタログには追加されません。

Codex ハーネスの実行には、これらの実験的な OpenClaw Tool Search コントロールは提供されません。OpenClaw は製品機能を動的ツールとして Codex に渡し、安定したネイティブコードモード、ネイティブツール検索、遅延動的ツール、ネストされたツール呼び出しは Codex が管理します。

## ターンの実行方法

計画時に、OpenClaw の組み込みランナーが実行用の有効なカタログを構築します。

1. エージェント、プロファイル、サンドボックス、セッションの有効なツールポリシーを解決します。
2. 対象となる OpenClaw ツールと Plugin ツールを列挙します。
3. セッションの MCP ランタイムを通じて、対象となる MCP ツールを列挙します。
4. 現在の実行に提供された対象となるクライアントツールを追加します。
5. direct-only ツールをモデルから見える状態に保ち、残りのカタログ対象ツールのコンパクトな記述子にインデックスを作成します。
6. それらの direct-only ツールとともに、OpenClaw コードブリッジ、構造化フォールバックツール、またはコンパクトなディレクトリサーフェスを公開します。

実行時には、実際のツール呼び出しはすべて OpenClaw に戻ります。隔離された Node ランタイムは、Plugin の実装、MCP クライアントオブジェクト、シークレットを保持しません。`openclaw.tools.call(...)` はブリッジを越えて Gateway に戻り、通常のポリシー、承認、フック、ログ記録、結果処理が引き続き適用されます。

## モード

`tools.toolSearch` には、モデル向けに 3 つのモードがあります。

- `code`: direct-only ツールとともに、デフォルトのコンパクトな JavaScript ブリッジである `tool_search_code` を公開します。
- `tools`: コードを受け取るべきでないプロバイダー向けに、direct-only ツールとともに `tool_search`、`tool_describe`、`tool_call` を通常の構造化ツールとして公開します。
- `directory`: すべての完全なスキーマを提示せずにツール名を確認すべきプロバイダー向けに、`tool_search`、`tool_describe`、`tool_call` に加えて、利用可能なツール名と説明を含むサイズ制限付きのプロンプトディレクトリを公開します。OpenClaw は、現在のターンで使用される可能性が高い、または必要なツールスキーマの小規模なサイズ制限付きセットを直接公開することもできます。このモードでも direct-only ツールは引き続き表示されます。

すべてのモードで、同じポリシーフィルタリング済みカタログと通常の OpenClaw 実行パスを使用します。`catalogMode: "direct-only"` と指定されたツールはカタログ外に留まり、モデルから見える状態が維持されます。現在のランタイムで隔離された Node コードモードの子プロセスを起動できない場合、デフォルトの `code` モードはカタログ圧縮前に `tools` にフォールバックします。`directory` モードでは、クライアント提供ツールは現在の実行で直接表示されたままですが、OpenClaw ツール、Plugin ツール、MCP ツールはディレクトリカタログの背後に圧縮できます。非表示になっている正確なディレクトリ名を直接呼び出すと、実行前に同じ認可済みカタログからそのツールがハイドレートされます。

すべてのモードは実験的です。OpenClaw のツールカタログが小規模な場合はツールの直接公開を優先し、Codex ハーネスの実行では Codex ネイティブの安定したサーフェスを優先してください。

ソース選択用の独立した設定はありません。Tool Search を有効にすると、通常のポリシーフィルタリング後のカタログ対象 OpenClaw ツール、MCP ツール、クライアントツールがカタログに含まれます。direct-only ツールは別途保持されます。

## この機能が存在する理由

大規模なカタログは便利ですが、コストが高くなります。すべてのツールスキーマをモデルに送信すると、リクエストが大きくなり、計画が遅くなり、誤ってツールを選択する可能性が高まります。

Tool Search はその構成を次のように変えます。

- 直接ツール: モデルは最初のトークンの前に、選択されたすべてのスキーマを確認します
- Tool Search コードモード: モデルは 1 つのコンパクトなコードツール、短い API コントラクト、すべての direct-only ツールを確認します
- Tool Search ツールモード: モデルは 3 つのコンパクトな構造化フォールバックツールと、すべての direct-only ツールを確認します
- Tool Search ディレクトリモード: モデルはサイズ制限付きディレクトリ、検索・詳細取得・呼び出しのコントロール、使用される可能性が高い、または必要なスキーマの小規模なサイズ制限付きセット、およびすべての direct-only ツールを確認します
- ターン中: モデルは必要に応じて残りのスキーマを読み込めます

小規模なカタログでは、ツールの直接公開が引き続き適切なデフォルトです。Tool Search は、1 回の実行で多数のツールを参照できる場合、特に MCP サーバーまたはクライアント提供のアプリツールから提供される場合に最適です。

## API

`openclaw.tools.search(query, options?)`

現在の実行の有効なカタログを検索します。結果はコンパクトであり、プロンプトコンテキストに安全に戻せます。

```js
const hits = await openclaw.tools.search("カレンダーイベント", { limit: 5 });
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
  summary: "計画",
  start: "2026-05-09T14:00:00Z",
});
```

構造化フォールバックモードでは、同じ操作をツールとして公開します。

- `tool_search`
- `tool_describe`
- `tool_call`

ディレクトリモードでは、次のツールを公開します。

- `tool_search`
- `tool_describe`
- `tool_call`

また、クライアント提供ツールとすべての direct-only ツールを直接表示したままにし、現在のターンで使用される可能性が高い、または必要なカタログツールスキーマの小規模なサイズ制限付きセットを直接公開する場合があります。サイズ制限付きディレクトリでエントリが省略されている場合は、`tool_search` を使用して検索してください。モデルが非表示になっている正確なディレクトリツール名を直接要求した場合、OpenClaw は通常の実行前に、認可済みカタログからそのツールをハイドレートします。
正確な遅延ディスパッチではこれらの名前を使用するため、ディレクトリモードのクライアントツール名は OpenClaw、Plugin、MCP のツール名と競合してはなりません。

## ランタイム境界

コードブリッジは、短時間だけ存続する Node サブプロセスで実行されます。サブプロセスは、Node の権限モードを有効にし、空の環境、ファイルシステムやネットワークへの許可なし、子プロセスやワーカーへの許可なしで起動します。OpenClaw は親プロセスで実時間タイムアウトを適用し、非同期継続処理の後も含め、タイムアウト時にはサブプロセスを終了します。

ランタイムが公開するのは次の要素だけです。

- `console.log`、`console.warn`、`console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

最終的な呼び出しには、通常の OpenClaw の動作が引き続き適用されます。

- ツールの許可および拒否ポリシー
- エージェント単位およびサンドボックス単位のツール制限
- チャネルおよびランタイムのツールポリシー
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

OpenClaw の実行で、代わりに構造化フォールバックツールを使用します。

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

OpenClaw の実行で、代わりにコンパクトなディレクトリサーフェスを使用します。

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

ランタイムは、`codeTimeoutMs` を 1000-60000、`maxSearchLimit` を 1-50、`searchDefaultLimit` を 1..`maxSearchLimit` の範囲に制限します。

無効にするには、次のようにします。

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
- カタログサイズとソース別内訳
- 検索、詳細取得、呼び出しの回数
- OpenClaw 経由で実行された最終的なツール呼び出し
- 選択されたツール ID とソース

セッションログから、次の点を確認できる必要があります。

- モデルが事前に確認したツールスキーマの数
- 実行した検索および詳細取得操作の数
- 最終的に呼び出されたツール
- 結果が OpenClaw、MCP、クライアントツールのどれから返されたか

## E2E 検証

QA Lab Gateway シナリオは、OpenClaw ランタイムで両方のパスを検証します。

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

このシナリオは、大規模なツールカタログを持つ一時的な偽の Plugin を作成し、モック OpenAI プロバイダーを起動して、Gateway を直接モードで 1 回、Tool Search を有効にして 1 回起動した後、プロバイダーのリクエストペイロードとセッションログを比較します。

この回帰テストでは、次の点を検証します。

1. 直接モードで偽の Plugin ツールを呼び出せること。
2. Tool Search で同じ偽の Plugin ツールを呼び出せること。
3. 直接モードでは、偽の Plugin ツールのスキーマがプロバイダーに直接公開されること。
4. Tool Search では、コンパクトブリッジとすべての direct-only ツールだけが公開されること。
5. 大規模な偽のカタログでは、Tool Search のリクエストペイロードが小さくなること。
6. セッションログに、想定されるツール呼び出し回数とブリッジ経由の呼び出しテレメトリが記録されること。

## 失敗時の動作

Tool Search はフェイルクローズする必要があります。

- ツールが有効なポリシーに含まれていない場合、検索結果に返してはなりません
- 選択したツールが利用できなくなった場合、`tool_call` は失敗する必要があります
- ポリシーまたは承認によって実行がブロックされた場合、呼び出し結果はそれを迂回せず、ブロックされたことを報告する必要があります
- コードブリッジが隔離されたランタイムを作成できない場合、そのデプロイでは `mode: "tools"` を使用するか、Tool Search を無効にしてください

## 関連項目

- [ツールと Plugin](/ja-JP/tools)
- [マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools)
- [Exec ツール](/ja-JP/tools/exec)
- [ACP エージェントのセットアップ](/ja-JP/tools/acp-agents-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
