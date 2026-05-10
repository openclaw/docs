---
read_when:
    - Pi エージェントに、すべてのツールスキーマをプロンプトに追加せずに大規模なツールカタログを使わせたい
    - OpenClaw ツール、MCP ツール、クライアントツールを、1つのコンパクトな PI サーフェスを通じて公開したい
    - Pi 実行向けのツール検出を実装またはデバッグしている
summary: 'ツール検索: 大規模な PI ツールカタログを検索、説明、呼び出しの背後に集約'
title: ツール検索
x-i18n:
    generated_at: "2026-05-10T19:56:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 182b850db5a1d6c9a769d5d50ccae914bc65416c1fd9368f0aeeb43663c0c0ae
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search は、PI エージェントが大規模なツールカタログを検出して呼び出すためのコンパクトな方法を 1 つ提供します。これは、実行時に利用可能なツールが多数あるものの、モデルが必要とする可能性が高いのはその一部だけである場合に有用です。

PI で有効にすると、モデルはデフォルトで `tool_search_code` ツールを 1 つ受け取ります。このツールは、`openclaw.tools` ブリッジを備えた隔離された Node サブプロセス内で短い JavaScript 本体を実行します。

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

カタログには、OpenClaw ツール、Plugin ツール、MCP ツール、クライアント提供ツールを含めることができます。モデルは、最初からすべての完全なスキーマを見るわけではありません。代わりに、コンパクトな記述子を検索し、正確なスキーマが必要になったときに選択したツールを 1 つ記述し、そのツールを OpenClaw 経由で呼び出します。

Codex ハーネスの実行では、これらの OpenClaw Tool Search コントロールは受け取りません。OpenClaw は製品機能を動的ツールとして Codex に渡し、Codex はネイティブコードモード、ネイティブツール検索、遅延動的ツール、ネストされたツール呼び出しを所有します。

## ターンの実行方法

計画時に、PI 埋め込みランナーはその実行の有効なカタログを構築します。

1. エージェント、プロファイル、サンドボックス、セッションに対するアクティブなツールポリシーを解決します。
2. 対象となる OpenClaw ツールと Plugin ツールを一覧表示します。
3. セッション MCP ランタイムを通じて対象となる MCP ツールを一覧表示します。
4. 現在の実行に提供された対象クライアントツールを追加します。
5. 検索用にコンパクトな記述子をインデックス化します。
6. PI コードブリッジまたは構造化フォールバックツールのいずれかをモデルに公開します。

実行時には、すべての実ツール呼び出しが OpenClaw に戻ります。隔離された Node ランタイムは、Plugin 実装、MCP クライアントオブジェクト、シークレットを保持しません。`openclaw.tools.call(...)` はブリッジを渡って Gateway に戻り、そこで通常のポリシー、承認、フック、ログ記録、結果処理が引き続き適用されます。

## モード

`tools.toolSearch` には、モデル向けに 2 つのモードがあります。

- `code`: デフォルトのコンパクトな JavaScript ブリッジである `tool_search_code` を公開します。
- `tools`: コードを受け取るべきでないプロバイダー向けに、`tool_search`、`tool_describe`、`tool_call` を通常の構造化ツールとして公開します。

どちらのモードも同じカタログと実行経路を使用します。唯一の違いは、モデルが見る形です。現在のランタイムが隔離された Node コードモード子プロセスを起動できない場合、デフォルトの `code` モードはカタログの Compaction 前に `tools` にフォールバックします。

個別のソース選択設定はありません。Tool Search が有効な場合、カタログには通常のポリシーフィルタリング後に対象となる OpenClaw、MCP、クライアントツールが含まれます。

## 存在理由

大規模なカタログは有用ですが、コストがかかります。すべてのツールスキーマをモデルに送信すると、リクエストが大きくなり、計画が遅くなり、意図しないツール選択が増えます。

Tool Search は形を変えます。

- 直接ツール: モデルは最初のトークンの前に、選択されたすべてのスキーマを見ます
- Tool Search コードモード: モデルは 1 つのコンパクトなコードツールと短い API 契約を見ます
- Tool Search ツールモード: モデルは 3 つのコンパクトな構造化フォールバックツールを見ます
- ターン中: モデルは実際に必要なツールスキーマだけを読み込みます

小規模なカタログでは、直接ツール公開が引き続き適切なデフォルトです。Tool Search は、特に MCP サーバーやクライアント提供アプリツールから、1 回の実行で多数のツールが見える場合に最適です。

## API

`openclaw.tools.search(query, options?)`

現在の実行の有効なカタログを検索します。結果はコンパクトで、プロンプトコンテキストに戻しても安全です。

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

正確な入力スキーマを含め、1 つの検索結果の完全なメタデータを読み込みます。

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

構造化フォールバックモードでは、同じ操作をツールとして公開します。

- `tool_search`
- `tool_describe`
- `tool_call`

## ランタイム境界

コードブリッジは短命の Node サブプロセスで実行されます。サブプロセスは、Node 権限モードが有効、空の環境、ファイルシステムまたはネットワーク権限なし、子プロセスまたはワーカー権限なしで開始されます。OpenClaw は親プロセスの実時間タイムアウトを強制し、非同期継続後も含めて、タイムアウト時にサブプロセスを終了します。

ランタイムが公開するのは次のものだけです。

- `console.log`、`console.warn`、`console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

最終呼び出しには、通常の OpenClaw の動作が引き続き適用されます。

- ツールの許可および拒否ポリシー
- エージェントごと、およびサンドボックスごとのツール制限
- オーナー専用ゲート
- 承認フック
- Plugin `before_tool_call` フック
- セッション ID、ログ、テレメトリ

## 設定

デフォルトのコードブリッジで PI 実行向けに Tool Search を有効にします。

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

PI 実行向けに、代わりに構造化フォールバックツールを使用します。

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

コードモードのタイムアウトと検索結果の上限を調整します。

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

Tool Search は、直接ツール公開と比較するために十分なテレメトリを記録します。

- ハーネスに送信されたシリアライズ済みツールとプロンプトの合計バイト数
- カタログサイズとソース別内訳
- 検索、記述、呼び出しの回数
- OpenClaw 経由で実行された最終ツール呼び出し
- 選択されたツール ID とソース

セッションログから、次のことを回答できる必要があります。

- モデルが最初に見たツールスキーマの数
- 実行した検索操作と記述操作の数
- どの最終ツールが呼び出されたか
- 結果が OpenClaw、MCP、クライアントツールのどれから来たか

## E2E 検証

Gateway E2E ランナーは、PI ハーネスで両方の経路を証明します。

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

これは、大規模なツールカタログを持つ一時的な偽 Plugin を作成し、モック OpenAI プロバイダーを開始し、直接モードで 1 回、Tool Search 有効で 1 回 Gateway を開始してから、プロバイダーリクエストペイロードとセッションログを比較します。

この回帰は次を証明します。

1. 直接モードは偽 Plugin ツールを呼び出せる。
2. Tool Search は同じ偽 Plugin ツールを呼び出せる。
3. 直接モードは偽 Plugin ツールスキーマをプロバイダーに直接公開する。
4. Tool Search はコンパクトなブリッジだけを公開する。
5. 大規模な偽カタログでは、Tool Search のリクエストペイロードのほうが小さい。
6. セッションログには、期待されるツール呼び出し数とブリッジ経由の呼び出しテレメトリが表示される。

## 失敗時の動作

Tool Search は閉じた状態で失敗する必要があります。

- ツールが有効なポリシーに含まれていない場合、検索はそれを返さない
- 選択したツールが利用不可になった場合、`tool_call` は失敗する
- ポリシーまたは承認が実行をブロックする場合、呼び出し結果はそれを回避するのではなく、そのブロックを報告する
- コードブリッジが隔離されたランタイムを作成できない場合、そのデプロイでは `mode: "tools"` を使用するか、Tool Search を無効にする

## 関連

- [ツールとPlugin](/ja-JP/tools)
- [マルチエージェントサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools)
- [Exec ツール](/ja-JP/tools/exec)
- [ACP エージェント設定](/ja-JP/tools/acp-agents-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
