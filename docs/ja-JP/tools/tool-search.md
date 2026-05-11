---
read_when:
    - PI エージェントに、すべてのツールスキーマをプロンプトに追加せずに大規模なツールカタログを使わせたい場合
    - OpenClaw ツール、MCP ツール、クライアントツールを、1つのコンパクトな PI サーフェスを通じて公開したい場合
    - PI 実行向けのツール検出を実装またはデバッグしている
summary: 'ツール検索: 大規模な PI ツールカタログを search、describe、call の背後でコンパクト化'
title: ツール検索
x-i18n:
    generated_at: "2026-05-11T20:40:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 410f21a4d56af163d03023f7280469e55e17e8296ee16f7b12cc2589494d0a0c
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Searchは、OpenClaw PIエージェントの実験的機能です。PIエージェントが大規模なツールカタログを検出して呼び出すための、コンパクトな方法を1つ提供します。実行時に利用可能なツールが多数ある一方で、モデルが必要とする可能性が高いのはそのうちの少数だけである場合に有用です。

このページでは、OpenClaw PI Tool Searchについて説明します。これはCodexネイティブのツール検索や動的ツールサーフェスではありません。Codexネイティブのコードモード、ツール検索、遅延動的ツール、ネストされたツール呼び出しは、安定したCodexハーネスサーフェスであり、`tools.toolSearch`には依存しません。

PIで有効にすると、モデルはデフォルトで1つの`tool_search_code`ツールを受け取ります。このツールは、分離されたNodeサブプロセス内で短いJavaScript本文を実行し、`openclaw.tools`ブリッジを使用します。

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

カタログには、OpenClawツール、Pluginツール、MCPツール、クライアント提供ツールを含めることができます。モデルは、すべての完全なスキーマを最初から見るわけではありません。代わりに、コンパクトな記述子を検索し、正確なスキーマが必要なときに選択したツールを1つ記述し、そのツールをOpenClaw経由で呼び出します。

Codexハーネスの実行では、これらの実験的なOpenClaw Tool Searchコントロールは受け取りません。OpenClawはプロダクト機能を動的ツールとしてCodexに渡し、Codexが安定したネイティブコードモード、ネイティブツール検索、遅延動的ツール、ネストされたツール呼び出しを所有します。

## ターンの実行方法

計画時に、PI組み込みランナーは実行の有効カタログを構築します。

1. エージェント、プロファイル、サンドボックス、セッションのアクティブなツールポリシーを解決します。
2. 対象となるOpenClawツールとPluginツールを列挙します。
3. セッションMCPランタイムを通じて対象となるMCPツールを列挙します。
4. 現在の実行に提供された対象クライアントツールを追加します。
5. 検索用にコンパクトな記述子のインデックスを作成します。
6. PIコードブリッジまたは構造化フォールバックツールのいずれかをモデルに公開します。

実行時には、すべての実ツール呼び出しがOpenClawに戻ります。分離されたNodeランタイムは、Plugin実装、MCPクライアントオブジェクト、シークレットを保持しません。`openclaw.tools.call(...)`はブリッジを越えてGatewayに戻り、そこでは通常のポリシー、承認、フック、ロギング、結果処理が引き続き適用されます。

## モード

`tools.toolSearch`には、モデル向けに2つのモードがあります。

- `code`: デフォルトのコンパクトなJavaScriptブリッジである`tool_search_code`を公開します。
- `tools`: コードを受け取るべきではないプロバイダー向けに、`tool_search`、`tool_describe`、`tool_call`を通常の構造化ツールとして公開します。

どちらのモードも同じカタログと実行パスを使用します。唯一の違いは、モデルから見える形です。現在のランタイムが分離されたNodeコードモード子プロセスを起動できない場合、デフォルトの`code`モードはカタログのCompaction前に`tools`へフォールバックします。

どちらのモードも実験的です。小規模なPIツールカタログには直接ツール公開を優先し、Codexハーネス実行にはCodexネイティブの安定したサーフェスを優先してください。

個別のソース選択設定はありません。Tool Searchが有効な場合、カタログには通常のポリシーフィルタリング後に対象となるOpenClaw、MCP、クライアントツールが含まれます。

## これが存在する理由

大規模なカタログは有用ですがコストが高くなります。すべてのツールスキーマをモデルに送信すると、リクエストが大きくなり、計画が遅くなり、意図しないツール選択が増えます。

Tool Searchは形を変えます。

- 直接ツール: モデルは最初のトークンの前に、選択されたすべてのスキーマを見ます
- Tool Searchコードモード: モデルは1つのコンパクトなコードツールと短いAPI契約を見ます
- Tool Searchツールモード: モデルは3つのコンパクトな構造化フォールバックツールを見ます
- ターン中: モデルは実際に必要なツールスキーマだけを読み込みます

小規模なカタログでは、直接ツール公開が引き続き適切なデフォルトです。Tool Searchは、1回の実行で多数のツールを見られる場合、特にMCPサーバーやクライアント提供のアプリツールからのツールが多い場合に最適です。

## API

`openclaw.tools.search(query, options?)`

現在の実行の有効カタログを検索します。結果はコンパクトで、プロンプトコンテキストに戻しても安全です。

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

正確な入力スキーマを含む、1つの検索結果の完全なメタデータを読み込みます。

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

選択したツールをOpenClaw経由で呼び出します。

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

## ランタイム境界

コードブリッジは、短命のNodeサブプロセス内で実行されます。サブプロセスは、Node権限モードが有効、空の環境、ファイルシステムまたはネットワーク権限なし、子プロセスまたはワーカー権限なしで開始されます。OpenClawは親プロセスの壁時計タイムアウトを強制し、非同期継続後も含めて、タイムアウト時にサブプロセスを終了します。

ランタイムが公開するのは次のみです。

- `console.log`、`console.warn`、`console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

最終呼び出しには、通常のOpenClaw動作が引き続き適用されます。

- ツールの許可および拒否ポリシー
- エージェント単位およびサンドボックス単位のツール制限
- 所有者限定ゲーティング
- 承認フック
- Pluginの`before_tool_call`フック
- セッションID、ログ、テレメトリ

## 設定

PI実行でデフォルトのコードブリッジを使用してTool Searchを有効にします。

```bash
openclaw config set tools.toolSearch true
```

同等のJSON:

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

PI実行で代わりに構造化フォールバックツールを使用します。

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

コードモードのタイムアウトと検索結果数の制限を調整します。

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

Tool Searchは、直接ツール公開と比較するために十分なテレメトリを記録します。

- ハーネスに送信されたシリアライズ済みツールとプロンプトの合計バイト数
- カタログサイズとソース別内訳
- 検索、記述、呼び出しの回数
- OpenClaw経由で実行された最終ツール呼び出し
- 選択されたツールIDとソース

セッションログから、次の点を確認できる必要があります。

- モデルが最初に見たツールスキーマ数
- 実行した検索および記述操作の回数
- 呼び出された最終ツール
- 結果がOpenClaw、MCP、クライアントツールのどれから来たか

## E2E検証

Gateway E2Eランナーは、PIハーネスで両方のパスを証明します。

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

一時的な偽Pluginを大規模なツールカタログ付きで作成し、モックOpenAIプロバイダーを起動し、Gatewayを直接モードで1回、Tool Search有効で1回起動してから、プロバイダーリクエストペイロードとセッションログを比較します。

この回帰は次を証明します。

1. 直接モードは偽Pluginツールを呼び出せる。
2. Tool Searchは同じ偽Pluginツールを呼び出せる。
3. 直接モードは偽Pluginツールスキーマをプロバイダーに直接公開する。
4. Tool Searchはコンパクトなブリッジだけを公開する。
5. 大規模な偽カタログでは、Tool Searchのリクエストペイロードのほうが小さい。
6. セッションログには、期待されるツール呼び出し回数とブリッジされた呼び出しのテレメトリが表示される。

## 失敗時の動作

Tool Searchはクローズドに失敗する必要があります。

- ツールが有効ポリシー内にない場合、検索はそれを返すべきではありません
- 選択したツールが利用できなくなった場合、`tool_call`は失敗するべきです
- ポリシーまたは承認が実行をブロックする場合、呼び出し結果はそれをバイパスするのではなく、そのブロックを報告するべきです
- コードブリッジが分離ランタイムを作成できない場合は、そのデプロイでは`mode: "tools"`を使用するか、Tool Searchを無効にしてください

## 関連

- [ツールとPlugin](/ja-JP/tools)
- [マルチエージェントサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools)
- [Execツール](/ja-JP/tools/exec)
- [ACPエージェントのセットアップ](/ja-JP/tools/acp-agents-setup)
- [Pluginの構築](/ja-JP/plugins/building-plugins)
