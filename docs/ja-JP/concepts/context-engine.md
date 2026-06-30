---
read_when:
    - OpenClaw がモデルコンテキストをどのように組み立てるかを理解したい
    - レガシーエンジンと Plugin エンジンを切り替えています
    - コンテキストエンジンPluginを構築している
sidebarTitle: Context engine
summary: 'コンテキストエンジン: プラグ可能なコンテキスト組み立て、Compaction、サブエージェントのライフサイクル'
title: コンテキストエンジン
x-i18n:
    generated_at: "2026-06-30T13:48:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0ed65cbb72b14b1a6e8d4d9a394f730a48ada35d77e34c12b3356162b281eec
    source_path: concepts/context-engine.md
    workflow: 16
---

**コンテキストエンジン**は、OpenClaw が各実行のモデルコンテキストをどのように構築するかを制御します。どのメッセージを含めるか、古い履歴をどのように要約するか、サブエージェント境界をまたいでコンテキストをどのように管理するかを扱います。

OpenClaw には組み込みの `legacy` エンジンが付属しており、デフォルトで使用されます。ほとんどのユーザーはこれを変更する必要はありません。異なる組み立て、コンパクション、またはセッション横断の想起動作が必要な場合にのみ、プラグインエンジンをインストールして選択してください。

## クイックスタート

<Steps>
  <Step title="有効なエンジンを確認する">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="プラグインエンジンをインストールする">
    コンテキストエンジンプラグインは、他の OpenClaw プラグインと同じようにインストールします。

    <Tabs>
      <Tab title="npm から">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="ローカルパスから">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="エンジンを有効化して選択する">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // must match the plugin's registered engine id
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin-specific config goes here (see the plugin's docs)
          },
        },
      },
    }
    ```

    インストールと設定の後、Gateway を再起動します。

  </Step>
  <Step title="legacy に戻す（任意）">
    `contextEngine` を `"legacy"` に設定します（またはキーを完全に削除します。`"legacy"` がデフォルトです）。
  </Step>
</Steps>

## 仕組み

OpenClaw がモデルプロンプトを実行するたびに、コンテキストエンジンは4つのライフサイクルポイントに関与します。

<AccordionGroup>
  <Accordion title="1. 取り込み">
    新しいメッセージがセッションに追加されたときに呼び出されます。エンジンはメッセージを自身のデータストアに保存またはインデックス化できます。
  </Accordion>
  <Accordion title="2. 組み立て">
    各モデル実行の前に呼び出されます。エンジンは、トークン予算内に収まる順序付きのメッセージセット（および任意の `systemPromptAddition`）を返します。
  </Accordion>
  <Accordion title="3. コンパクト化">
    コンテキストウィンドウが満杯になったとき、またはユーザーが `/compact` を実行したときに呼び出されます。エンジンは古い履歴を要約して空き領域を作ります。
  </Accordion>
  <Accordion title="4. ターン後">
    実行が完了した後に呼び出されます。エンジンは状態を永続化したり、バックグラウンドコンパクションをトリガーしたり、インデックスを更新したりできます。
  </Accordion>
</AccordionGroup>

同梱の非 ACP Codex ハーネスでは、OpenClaw は組み立て済みコンテキストを Codex 開発者指示と現在のターンプロンプトに投影することで、同じライフサイクルを適用します。Codex は引き続き、ネイティブのスレッド履歴とネイティブのコンパクターを所有します。

### サブエージェントのライフサイクル（任意）

OpenClaw は2つの任意のサブエージェントライフサイクルフックを呼び出します。

<ParamField path="prepareSubagentSpawn" type="method">
  子の実行が始まる前に、共有コンテキスト状態を準備します。このフックは親/子セッションキー、`contextMode`（`isolated` または `fork`）、利用可能なトランスクリプト ID/ファイル、任意の TTL を受け取ります。ロールバックハンドルを返した場合、準備が成功した後にスポーンが失敗すると OpenClaw がそれを呼び出します。`lightContext` を要求し、`contextMode="isolated"` に解決されるネイティブサブエージェントスポーンは、このフックを意図的にスキップします。これにより、子はコンテキストエンジン管理のスポーン前状態なしで、軽量なブートストラップコンテキストから開始します。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  サブエージェントセッションが完了した、またはスイープされたときにクリーンアップします。
</ParamField>

### システムプロンプトの追加

`assemble` メソッドは `systemPromptAddition` 文字列を返せます。OpenClaw はこれを実行のシステムプロンプトの先頭に追加します。これにより、エンジンは静的なワークスペースファイルを必要とせずに、動的な想起ガイダンス、検索指示、コンテキスト認識型のヒントを注入できます。

## legacy エンジン

組み込みの `legacy` エンジンは、OpenClaw の元の動作を保持します。

- **取り込み**: 何もしません（セッションマネージャーがメッセージの永続化を直接処理します）。
- **組み立て**: パススルーです（ランタイム内の既存の sanitize → validate → limit パイプラインがコンテキスト組み立てを処理します）。
- **コンパクト化**: 組み込みの要約コンパクションに委譲します。これは古いメッセージの単一の要約を作成し、最近のメッセージをそのまま保持します。
- **ターン後**: 何もしません。

legacy エンジンはツールを登録せず、`systemPromptAddition` も提供しません。

`plugins.slots.contextEngine` が設定されていない場合（または `"legacy"` に設定されている場合）、このエンジンが自動的に使用されます。

## プラグインエンジン

プラグインは、プラグイン API を使用してコンテキストエンジンを登録できます。

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
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
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

ファクトリ `ctx` には任意の `config`、`agentDir`、`workspaceDir`
値が含まれるため、プラグインは最初のライフサイクルフックが実行される前に、エージェント単位またはワークスペース単位の状態を初期化できます。

次に設定で有効化します。

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

### ContextEngine インターフェイス

必須メンバー:

| メンバー           | 種類     | 目的                                                     |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | プロパティ | エンジン ID、名前、バージョン、およびコンパクションを所有するかどうか |
| `ingest(params)`   | メソッド | 単一のメッセージを保存する                               |
| `assemble(params)` | メソッド | モデル実行用のコンテキストを構築する（`AssembleResult` を返す） |
| `compact(params)`  | メソッド | コンテキストを要約/削減する                              |

`assemble` は次を含む `AssembleResult` を返します。

<ParamField path="messages" type="Message[]" required>
  モデルに送信する順序付きメッセージ。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  組み立て済みコンテキスト内の合計トークン数に関するエンジンの推定値。OpenClaw はこれをコンパクションしきい値の判断と診断レポートに使用します。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  システムプロンプトの先頭に追加されます。
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  プリエンプティブなオーバーフロー事前チェックでランナーが使用するトークン推定値を制御します。デフォルトは `"assembled"` です。つまり、コンパクションを所有していないエンジンでは、組み立て済みプロンプトの推定値だけがチェックされます。`ownsCompaction: true` を設定したエンジンは、自身でプロンプトの受け入れを管理するため、OpenClaw はデフォルトで汎用のプロンプト前事前チェックをスキップします。組み立て済みビューが基礎となるトランスクリプト内のオーバーフローリスクを隠す可能性がある場合にのみ、`"preassembly_may_overflow"` を設定してください。その場合、ランナーは汎用事前チェックを有効なままにし、プリエンプティブにコンパクト化するかどうかを判断するときに、組み立て済み推定値と組み立て前（ウィンドウ化されていない）セッション履歴推定値の最大値を使用します。どちらの場合でも、返したメッセージがモデルに見える内容です。`promptAuthority` は事前チェックにのみ影響します。
</ParamField>

`compact` は `CompactResult` を返します。コンパクションがアクティブなトランスクリプトをローテーションする場合、`result.sessionId` と `result.sessionFile` は次のリトライまたはターンが使用する必要のある後継セッションを識別します。

任意メンバー:

| メンバー                       | 種類     | 目的                                                                                                            |
| ------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | メソッド | セッションのエンジン状態を初期化する。エンジンがセッションを初めて見るときに一度呼び出されます（例: 履歴のインポート）。 |
| `ingestBatch(params)`          | メソッド | 完了したターンをバッチとして取り込む。実行完了後、そのターンのすべてのメッセージとともに一度に呼び出されます。 |
| `afterTurn(params)`            | メソッド | 実行後のライフサイクル作業（状態の永続化、バックグラウンドコンパクションのトリガー）。                         |
| `prepareSubagentSpawn(params)` | メソッド | 子セッションが始まる前に共有状態を設定する。                                                                    |
| `onSubagentEnded(params)`      | メソッド | サブエージェント終了後にクリーンアップする。                                                                    |
| `dispose()`                    | メソッド | リソースを解放する。Gateway のシャットダウン時またはプラグインのリロード時に呼び出されます。セッション単位ではありません。 |

### ランタイム設定

OpenClaw 内で実行されるライフサイクルフックは、任意の
`runtimeSettings` オブジェクトを受け取ります。これはバージョン付きの読み取り専用の内部
プロデューサー/コンシューマー API サーフェスです。OpenClaw が選択されたコンテキスト
エンジン向けに生成し、コンテキストエンジンがライフサイクルフック内で消費します。これは
ユーザーに直接表示されず、専用のレポートサーフェスも作成しません。

- `schemaVersion`: 現在は `1`
- `runtime`: OpenClaw ホスト、ランタイムモード（`normal`、`fallback`、または
  `degraded`）、および任意のハーネス/ランタイム ID
- `contextEngineSelection`: 選択されたコンテキストエンジン ID と選択ソース
- `executionHost`: フックを呼び出しているサーフェスのホスト ID とラベル
- `model`: 要求されたモデル、解決済みモデル、プロバイダー、および任意のモデルファミリー
- `limits`: 既知の場合のプロンプトトークン予算と最大出力トークン数
- `diagnostics`: 既知の場合の閉じたフォールバックと劣化理由コード

不明になり得るフィールドは `null` として表されます。ランタイムモードや選択ソースなどの判別子フィールドは非 null のままです。古いエンジンは引き続き互換性があります。厳密な legacy エンジンが `runtimeSettings` を不明なプロパティとして拒否した場合、OpenClaw はエンジンを隔離する代わりに、それなしでライフサイクル呼び出しを再試行します。

### ホスト要件

コンテキストエンジンは `info.hostRequirements` でホスト機能要件を宣言できます。
OpenClaw は操作を開始する前にこれらの要件をチェックし、選択されたランタイムが満たせない場合は説明的なエラーでフェイルクローズします。

エージェント実行では、エンジンが `assemble()` を通じて実際のモデルプロンプトを制御する必要がある場合、`assemble-before-prompt` を宣言します。

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use the native Codex or OpenClaw embedded runtime, or select the legacy context engine.",
    },
  },
}
```

ネイティブ Codex と OpenClaw 埋め込みエージェント実行は `assemble-before-prompt` を満たします。
汎用 CLI バックエンドは満たさないため、それを要求するエンジンは CLI プロセスの開始前に拒否されます。

### 障害の分離

OpenClaw は、選択された Plugin エンジンをコアの返信パスから分離します。非 legacy エンジンが見つからない、コントラクト検証に失敗する、ファクトリ作成中に例外を投げる、またはライフサイクルメソッドから例外を投げる場合、OpenClaw は現在の Gateway プロセスでそのエンジンを隔離し、コンテキストエンジン処理を組み込みの `legacy` エンジンにダウングレードします。エラーは失敗した操作とともにログに記録されるため、オペレーターはエージェントが応答しなくなることなく、Plugin を修復、更新、または無効化できます。

ホスト要件の失敗は異なります。エンジンが、ランタイムに必要な機能がないと宣言した場合、OpenClaw は実行を開始する前にフェイルクローズします。これにより、サポートされていないホストで実行すると状態を破損するエンジンを保護します。

### ownsCompaction

`ownsCompaction` は、OpenClaw ランタイム組み込みの試行内自動 Compaction を、その実行で有効なままにするかどうかを制御します。

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    エンジンが Compaction 動作を所有します。OpenClaw は、その実行について OpenClaw ランタイム組み込みの自動 Compaction と汎用のプロンプト前オーバーフロープリチェックを無効化し、エンジンの `compact()` 実装が `/compact`、プロバイダーのオーバーフロー回復 Compaction、および `afterTurn()` で実行したいプロアクティブな Compaction を担当します。エンジンが `assemble()` から `promptAuthority: "preassembly_may_overflow"` を返す場合、OpenClaw は引き続きプロンプト前オーバーフロー保護を実行します。
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    OpenClaw ランタイム組み込みの自動 Compaction はプロンプト実行中にまだ実行される場合がありますが、アクティブなエンジンの `compact()` メソッドは `/compact` とオーバーフロー回復のために引き続き呼び出されます。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` は、OpenClaw が自動的に legacy エンジンの Compaction パスへフォールバックすることを意味するわけでは**ありません**。
</Warning>

つまり、有効な Plugin パターンは 2 つあります。

<Tabs>
  <Tab title="所有モード">
    独自の Compaction アルゴリズムを実装し、`ownsCompaction: true` を設定します。
  </Tab>
  <Tab title="委譲モード">
    `ownsCompaction: false` を設定し、`compact()` で `openclaw/plugin-sdk/core` の `delegateCompactionToRuntime(...)` を呼び出して、OpenClaw の組み込み Compaction 動作を使用します。
  </Tab>
</Tabs>

no-op の `compact()` は、アクティブな非所有エンジンでは安全ではありません。そのエンジンスロットの通常の `/compact` とオーバーフロー回復 Compaction パスを無効化してしまうためです。

## 設定リファレンス

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
このスロットは実行時に排他的です - 特定の実行または Compaction 操作で解決される登録済みコンテキストエンジンは 1 つだけです。他の有効な `kind: "context-engine"` Plugin は引き続きロードされ、登録コードを実行できます。`plugins.slots.contextEngine` は、OpenClaw がコンテキストエンジンを必要とするときに解決する登録済みエンジン ID を選択するだけです。
</Note>

<Note>
**Plugin のアンインストール:** 現在 `plugins.slots.contextEngine` として選択されている Plugin をアンインストールすると、OpenClaw はスロットをデフォルト (`legacy`) に戻します。同じリセット動作は `plugins.slots.memory` にも適用されます。手動で設定を編集する必要はありません。
</Note>

## Compaction とメモリとの関係

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction はコンテキストエンジンの責務の 1 つです。legacy エンジンは OpenClaw の組み込み要約に委譲します。Plugin エンジンは任意の Compaction 戦略 (DAG 要約、ベクトル検索など) を実装できます。
  </Accordion>
  <Accordion title="メモリ Plugin">
    メモリ Plugin (`plugins.slots.memory`) はコンテキストエンジンとは別です。メモリ Plugin は検索/取得を提供し、コンテキストエンジンはモデルに見せる内容を制御します。両者は連携できます - コンテキストエンジンはアセンブリ中にメモリ Plugin データを使用する場合があります。アクティブメモリのプロンプトパスを使用したい Plugin エンジンは、`openclaw/plugin-sdk/core` の `buildMemorySystemPromptAddition(...)` を優先するべきです。これはアクティブメモリのプロンプトセクションを、先頭に追加できる `systemPromptAddition` に変換します。エンジンがより低レベルの制御を必要とする場合は、`buildActiveMemoryPromptSection(...)` を通じて `openclaw/plugin-sdk/memory-host-core` から生の行を取得することもできます。
  </Accordion>
  <Accordion title="セッションの刈り込み">
    どのコンテキストエンジンがアクティブであっても、古いツール結果のメモリ内トリミングは引き続き実行されます。
  </Accordion>
</AccordionGroup>

## ヒント

- `openclaw doctor` を使用して、エンジンが正しくロードされていることを確認します。
- エンジンを切り替える場合、既存のセッションは現在の履歴のまま続行されます。新しいエンジンは将来の実行から引き継ぎます。
- エンジンエラーはログに記録され、選択された Plugin エンジンは現在の Gateway プロセスで隔離されます。返信を継続できるよう、OpenClaw はユーザーターンで `legacy` にフォールバックしますが、それでも壊れた Plugin を修復、更新、無効化、またはアンインストールする必要があります。
- 開発では、コピーせずにローカル Plugin ディレクトリをリンクするために `openclaw plugins install -l ./my-engine` を使用します。

## 関連

- [Compaction](/ja-JP/concepts/compaction) - 長い会話の要約
- [コンテキスト](/ja-JP/concepts/context) - エージェントターンのコンテキストがどのように構築されるか
- [Plugin アーキテクチャ](/ja-JP/plugins/architecture) - コンテキストエンジン Plugin の登録
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - Plugin マニフェストフィールド
- [Plugin](/ja-JP/tools/plugin) - Plugin の概要
