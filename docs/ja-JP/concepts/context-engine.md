---
read_when:
    - OpenClawがどのようにモデルコンテキストを組み立てるかを理解したい場合
    - レガシーエンジンとPluginエンジンを切り替えている場合
    - コンテキストエンジンPluginを構築している場合
summary: 'コンテキストエンジン: プラガブルなコンテキストアセンブリ、Compaction、およびサブエージェントのライフサイクル'
title: コンテキストエンジン
x-i18n:
    generated_at: "2026-04-24T04:52:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f4e5f01f945f7fe3056587f2aa60bec607dd0dd64b29e9ab2afe8e77b5d2f1e
    source_path: concepts/context-engine.md
    workflow: 15
---

**コンテキストエンジン**は、OpenClawが各実行でどのようにモデルコンテキストを構築するかを制御します。
つまり、どのメッセージを含めるか、古い履歴をどう要約するか、そして
サブエージェント境界をまたいでコンテキストをどのように管理するかです。

OpenClawには組み込みの`legacy`エンジンが付属しており、これがデフォルトで使用されます。ほとんどの
ユーザーはこれを変更する必要はありません。アセンブリ、Compaction、または
セッション間リコールの動作を変えたい場合にのみ、Pluginエンジンをインストールして選択してください。

## クイックスタート

どのエンジンが有効かを確認します。

```bash
openclaw doctor
# または設定を直接確認:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### コンテキストエンジンPluginのインストール

コンテキストエンジンPluginは、他のOpenClaw Pluginと同様にインストールします。まず
インストールし、その後スロットでエンジンを選択します。

```bash
# npmからインストール
openclaw plugins install @martian-engineering/lossless-claw

# またはローカルパスからインストール（開発用）
openclaw plugins install -l ./my-context-engine
```

次に、Pluginを有効化し、設定でそれを有効なエンジンとして選択します。

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // Pluginが登録したエンジンidと一致する必要があります
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Plugin固有の設定はここに記述します（Pluginのドキュメントを参照）
      },
    },
  },
}
```

インストールと設定の後にgatewayを再起動してください。

組み込みエンジンに戻すには、`contextEngine`を`"legacy"`に設定します（または
キー自体を削除します。`"legacy"`がデフォルトです）。

## 仕組み

OpenClawがモデルプロンプトを実行するたびに、コンテキストエンジンは
4つのライフサイクル時点で関与します。

1. **Ingest** — 新しいメッセージがセッションに追加されたときに呼び出されます。エンジンは
   そのメッセージを自身のデータストアに保存またはインデックス化できます。
2. **Assemble** — 各モデル実行の前に呼び出されます。エンジンは、トークン予算内に収まる
   順序付きメッセージ集合（および任意の`systemPromptAddition`）を返します。
3. **Compact** — コンテキストウィンドウがいっぱいになったとき、またはユーザーが
   `/compact`を実行したときに呼び出されます。エンジンは古い履歴を要約して空きを作ります。
4. **After turn** — 実行完了後に呼び出されます。エンジンは状態を永続化したり、
   バックグラウンドCompactionをトリガーしたり、インデックスを更新したりできます。

バンドルされた非ACPのCodexハーネスでは、OpenClawは組み立て済みコンテキストを
Codexの開発者向け指示と現在のターンプロンプトに投影することで、同じライフサイクルを適用します。
Codexは引き続き自身のネイティブスレッド履歴とネイティブCompactionを管理します。

### サブエージェントのライフサイクル（任意）

OpenClawは2つの任意のサブエージェントライフサイクルフックを呼び出します。

- **prepareSubagentSpawn** — 子実行の開始前に共有コンテキスト状態を準備します。
  このフックは、親/子セッションキー、`contextMode`
  （`isolated`または`fork`）、利用可能なtranscript id/ファイル、および任意のTTLを受け取ります。
  ロールバックハンドルを返した場合、準備成功後にspawnが失敗すると
  OpenClawはそれを呼び出します。
- **onSubagentEnded** — サブエージェントセッションが完了または掃除されたときにクリーンアップします。

### システムプロンプト追加

`assemble`メソッドは`systemPromptAddition`文字列を返せます。OpenClawは
これをその実行のシステムプロンプトの先頭に追加します。これによりエンジンは、
静的なワークスペースファイルを必要とせずに、動的なリコールガイダンス、取得指示、
またはコンテキスト認識ヒントを注入できます。

## レガシーエンジン

組み込みの`legacy`エンジンは、OpenClaw本来の動作を保持します。

- **Ingest**: no-op（メッセージの永続化はセッションマネージャーが直接処理します）。
- **Assemble**: パススルー（ランタイム内の既存のsanitize → validate → limitパイプラインが
  コンテキストアセンブリを処理します）。
- **Compact**: 組み込みの要約Compactionに委譲します。これは古いメッセージの
  単一要約を作成し、最近のメッセージはそのまま保持します。
- **After turn**: no-op。

レガシーエンジンはツールを登録せず、`systemPromptAddition`も提供しません。

`plugins.slots.contextEngine`が設定されていない場合（または`"legacy"`に設定されている場合）、
このエンジンが自動的に使われます。

## Pluginエンジン

Pluginは、Plugin APIを使ってコンテキストエンジンを登録できます。

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // メッセージを自分のデータストアに保存
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // 予算内に収まるメッセージを返す
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // 古いコンテキストを要約
      return { ok: true, compacted: true };
    },
  }));
}
```

その後、設定で有効化します。

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### ContextEngineインターフェース

必須メンバー:

| メンバー | 種別 | 目的 |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Property | エンジンid、名前、バージョン、およびCompactionを自身で担うかどうか |
| `ingest(params)`   | Method   | 単一メッセージを保存する |
| `assemble(params)` | Method   | モデル実行用のコンテキストを構築する（`AssembleResult`を返す） |
| `compact(params)`  | Method   | コンテキストを要約/削減する |

`assemble`は、次を含む`AssembleResult`を返します。

- `messages` — モデルへ送信する順序付きメッセージ。
- `estimatedTokens`（必須、`number`） — 組み立て済みコンテキスト内の
  総トークン数に対するエンジンの推定値。OpenClawはこれをCompaction閾値の
  判断と診断レポートに使用します。
- `systemPromptAddition`（任意、`string`） — システムプロンプトの先頭に追加されます。

任意メンバー:

| メンバー | 種別 | 目的 |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | セッション用のエンジン状態を初期化します。エンジンがセッションを初めて認識したときに1回呼び出されます（例: 履歴インポート）。 |
| `ingestBatch(params)`          | Method | 完了したターンをバッチとして取り込みます。実行完了後、そのターンの全メッセージをまとめて受け取って呼び出されます。 |
| `afterTurn(params)`            | Method | 実行後ライフサイクル処理（状態の永続化、バックグラウンドCompactionのトリガー）。 |
| `prepareSubagentSpawn(params)` | Method | 子セッション開始前に共有状態をセットアップします。 |
| `onSubagentEnded(params)`      | Method | サブエージェント終了後にクリーンアップします。 |
| `dispose()`                    | Method | リソースを解放します。gatewayシャットダウンまたはPluginリロード時に呼び出されます。セッションごとではありません。 |

### ownsCompaction

`ownsCompaction`は、Piの組み込みインアテンプト自動Compactionを、その実行中も
有効にしておくかどうかを制御します。

- `true` — エンジンがCompaction動作を担います。OpenClawはその実行中、
  Piの組み込み自動Compactionを無効にし、エンジンの`compact()`実装が
  `/compact`、オーバーフロー回復Compaction、および`afterTurn()`で行いたい
  先行的Compactionを担当します。
- `false`または未設定 — Piの組み込み自動Compactionはプロンプト実行中にも
  走る場合がありますが、有効なエンジンの`compact()`メソッドは引き続き
  `/compact`とオーバーフロー回復で呼び出されます。

`ownsCompaction: false`は、OpenClawが自動的に
レガシーエンジンのCompactionパスへフォールバックすることを**意味しません**。

つまり、有効なPluginパターンは2つあります。

- **Owning mode** — 独自のCompactionアルゴリズムを実装し、
  `ownsCompaction: true`を設定する。
- **Delegating mode** — `ownsCompaction: false`を設定し、`compact()`から
  `openclaw/plugin-sdk/core`の`delegateCompactionToRuntime(...)`を呼び出して
  OpenClaw組み込みのCompaction動作を使う。

有効な非owningエンジンでno-opの`compact()`を実装するのは危険です。なぜなら、
そのエンジンスロットにおける通常の`/compact`およびオーバーフロー回復Compactionパスを
無効化してしまうからです。

## 設定リファレンス

```json5
{
  plugins: {
    slots: {
      // 有効なコンテキストエンジンを選択します。デフォルト: "legacy"。
      // Pluginエンジンを使うにはPlugin idを設定します。
      contextEngine: "legacy",
    },
  },
}
```

このスロットは実行時には排他的です。つまり、特定の実行またはCompaction操作では
登録済みのコンテキストエンジンは1つだけ解決されます。他の有効な
`kind: "context-engine"` Pluginは引き続き読み込まれ、登録コードも実行できます。
`plugins.slots.contextEngine`は、OpenClawがコンテキストエンジンを必要とするときに
どの登録済みエンジンidを解決するかを選ぶだけです。

## Compactionおよびメモリとの関係

- **Compaction**は、コンテキストエンジンの責務の1つです。レガシーエンジンは
  OpenClaw組み込みの要約に委譲します。Pluginエンジンは任意の
  Compaction戦略（DAG要約、ベクトル取得など）を実装できます。
- **メモリPlugin**（`plugins.slots.memory`）はコンテキストエンジンとは別です。
  メモリPluginは検索/取得を提供し、コンテキストエンジンはモデルが
  何を見るかを制御します。両者は協調できます。たとえばコンテキストエンジンは
  アセンブリ中にメモリPluginデータを利用できます。有効なメモリ
  プロンプトパスを利用したいPluginエンジンは、
  `openclaw/plugin-sdk/core`の`buildMemorySystemPromptAddition(...)`を優先して
  使用してください。これは有効なメモリプロンプトセクションを、先頭追加可能な
  `systemPromptAddition`へ変換します。エンジンがより低レベルの制御を必要とする場合でも、
  `openclaw/plugin-sdk/memory-host-core`の
  `buildActiveMemoryPromptSection(...)`を通じて生の行を取得できます。
- **セッション剪定**（古いツール結果のメモリ内トリミング）は、
  どのコンテキストエンジンが有効であっても引き続き実行されます。

## ヒント

- エンジンが正しく読み込まれているかを確認するには`openclaw doctor`を使用してください。
- エンジンを切り替えても、既存セッションは現在の履歴を保持したまま続行されます。
  新しいエンジンは今後の実行から引き継ぎます。
- エンジンエラーはログに記録され、診断にも表示されます。Pluginエンジンの
  登録に失敗した場合や、選択したエンジンidを解決できない場合、OpenClawは
  自動フォールバックしません。Pluginを修正するか、
  `plugins.slots.contextEngine`を`"legacy"`へ戻すまで、実行は失敗します。
- 開発時には、`openclaw plugins install -l ./my-engine`を使うことで、
  ローカルPluginディレクトリをコピーせずにリンクできます。

関連項目: [Compaction](/ja-JP/concepts/compaction), [Context](/ja-JP/concepts/context),
[Plugins](/ja-JP/tools/plugin), [Plugin manifest](/ja-JP/plugins/manifest)。

## 関連

- [Context](/ja-JP/concepts/context) — エージェントターン用コンテキストがどのように構築されるか
- [Plugin Architecture](/ja-JP/plugins/architecture) — コンテキストエンジンPluginの登録
- [Compaction](/ja-JP/concepts/compaction) — 長い会話の要約
