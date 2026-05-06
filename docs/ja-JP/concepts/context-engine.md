---
read_when:
    - OpenClaw がモデルコンテキストをどのように組み立てるかを理解したい
    - レガシーエンジンと Plugin エンジンを切り替えています
    - コンテキストエンジンPluginを構築しています
sidebarTitle: Context engine
summary: 'コンテキストエンジン: 差し替え可能なコンテキスト組み立て、Compaction、サブエージェントのライフサイクル'
title: コンテキストエンジン
x-i18n:
    generated_at: "2026-05-06T05:00:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c33c94971751d92a2ce695db545a0c0abb7adcbe1820383b83f4201fa7e628d
    source_path: concepts/context-engine.md
    workflow: 16
---

**コンテキストエンジン**は、OpenClaw が各実行のモデルコンテキストをどのように構築するかを制御します。どのメッセージを含めるか、古い履歴をどのように要約するか、サブエージェント境界をまたいでコンテキストをどのように管理するかを制御します。

OpenClaw には組み込みの `legacy` エンジンが同梱され、デフォルトで使用されます - ほとんどのユーザーはこれを変更する必要はありません。異なるアセンブリ、Compaction、またはセッション横断の想起動作が必要な場合にのみ、Plugin エンジンをインストールして選択してください。

## クイックスタート

<Steps>
  <Step title="どのエンジンが有効かを確認する">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Plugin エンジンをインストールする">
    コンテキストエンジン Plugin は、他の OpenClaw Plugin と同じようにインストールします。

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

    インストールと設定が完了したら Gateway を再起動します。

  </Step>
  <Step title="legacy に戻す（任意）">
    `contextEngine` を `"legacy"` に設定します（またはキーを完全に削除します - `"legacy"` がデフォルトです）。
  </Step>
</Steps>

## 仕組み

OpenClaw がモデルプロンプトを実行するたびに、コンテキストエンジンは 4 つのライフサイクルポイントに関与します。

<AccordionGroup>
  <Accordion title="1. 取り込み">
    新しいメッセージがセッションに追加されたときに呼び出されます。エンジンは、そのメッセージを独自のデータストアに保存またはインデックス化できます。
  </Accordion>
  <Accordion title="2. アセンブル">
    各モデル実行の前に呼び出されます。エンジンは、トークン予算内に収まる順序付きメッセージセット（および任意の `systemPromptAddition`）を返します。
  </Accordion>
  <Accordion title="3. コンパクト化">
    コンテキストウィンドウがいっぱいになったとき、またはユーザーが `/compact` を実行したときに呼び出されます。エンジンは古い履歴を要約して空き容量を確保します。
  </Accordion>
  <Accordion title="4. ターン後">
    実行が完了した後に呼び出されます。エンジンは状態を永続化したり、バックグラウンド Compaction をトリガーしたり、インデックスを更新したりできます。
  </Accordion>
</AccordionGroup>

同梱の非 ACP Codex ハーネスでは、OpenClaw はアセンブル済みコンテキストを Codex の開発者指示と現在のターンプロンプトに投影することで、同じライフサイクルを適用します。Codex は引き続き、ネイティブのスレッド履歴とネイティブのコンパクターを所有します。

### サブエージェントのライフサイクル（任意）

OpenClaw は 2 つの任意のサブエージェントライフサイクルフックを呼び出します。

<ParamField path="prepareSubagentSpawn" type="method">
  子実行が開始する前に、共有コンテキスト状態を準備します。このフックは親/子セッションキー、`contextMode`（`isolated` または `fork`）、利用可能なトランスクリプト id/ファイル、および任意の TTL を受け取ります。ロールバックハンドルを返した場合、準備が成功した後に生成が失敗すると、OpenClaw がそれを呼び出します。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  サブエージェントセッションが完了した、またはスイープされたときにクリーンアップします。
</ParamField>

### システムプロンプト追加

`assemble` メソッドは `systemPromptAddition` 文字列を返せます。OpenClaw はこれを実行のシステムプロンプトの前に付加します。これにより、エンジンは静的なワークスペースファイルを必要とせずに、動的な想起ガイダンス、検索指示、またはコンテキスト対応のヒントを注入できます。

## legacy エンジン

組み込みの `legacy` エンジンは、OpenClaw の元の動作を維持します。

- **取り込み**: no-op（セッションマネージャーがメッセージ永続化を直接処理します）。
- **アセンブル**: パススルー（ランタイム内の既存の sanitize → validate → limit パイプラインがコンテキストアセンブリを処理します）。
- **コンパクト化**: 組み込みの要約 Compaction に委譲します。これは古いメッセージの単一の要約を作成し、最近のメッセージをそのまま保持します。
- **ターン後**: no-op。

legacy エンジンはツールを登録せず、`systemPromptAddition` も提供しません。

`plugins.slots.contextEngine` が設定されていない場合（または `"legacy"` に設定されている場合）、このエンジンが自動的に使用されます。

## Plugin エンジン

Plugin は Plugin API を使用してコンテキストエンジンを登録できます。

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
値が含まれるため、Plugin は最初のライフサイクルフックが実行される前に
エージェント単位またはワークスペース単位の状態を初期化できます。

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

### ContextEngine インターフェース

必須メンバー:

| メンバー           | 種類         | 目的                                                     |
| ------------------ | ------------ | -------------------------------------------------------- |
| `info`             | プロパティ   | エンジン id、名前、バージョン、および Compaction を所有するかどうか |
| `ingest(params)`   | メソッド     | 単一のメッセージを保存する                               |
| `assemble(params)` | メソッド     | モデル実行用のコンテキストを構築する（`AssembleResult` を返す） |
| `compact(params)`  | メソッド     | コンテキストを要約/削減する                              |

`assemble` は次を含む `AssembleResult` を返します。

<ParamField path="messages" type="Message[]" required>
  モデルに送信する順序付きメッセージ。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  アセンブル済みコンテキスト内の総トークン数に対するエンジンの推定値。OpenClaw はこれを Compaction しきい値の判断と診断レポートに使用します。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  システムプロンプトの前に付加されます。
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  ランナーが先制的なオーバーフロー事前チェックに使用するトークン推定値を制御します。デフォルトは `"assembled"` で、アセンブル済みプロンプトの推定値のみがチェックされることを意味します - ウィンドウ化された自己完結型コンテキストを返すエンジンに適しています。アセンブル済みビューが基になるトランスクリプト内のオーバーフローリスクを隠す可能性がある場合にのみ、`"preassembly_may_overflow"` に設定してください。その場合、先制的にコンパクト化するかどうかを判断するとき、ランナーはアセンブル済み推定値とアセンブル前（ウィンドウ化されていない）セッション履歴推定値の最大値を使用します。いずれの場合も、返したメッセージがモデルに表示される内容です - `promptAuthority` は事前チェックにのみ影響します。
</ParamField>

`compact` は `CompactResult` を返します。Compaction がアクティブな
トランスクリプトをローテーションする場合、`result.sessionId` と `result.sessionFile` は次の再試行またはターンで使用する必要がある後継セッションを識別します。

任意メンバー:

| メンバー                       | 種類     | 目的                                                                                                            |
| ------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | メソッド | セッションのエンジン状態を初期化します。エンジンが初めてセッションを確認したときに 1 回呼び出されます（例: 履歴のインポート）。 |
| `ingestBatch(params)`          | メソッド | 完了したターンをバッチとして取り込みます。実行完了後に、そのターンのすべてのメッセージをまとめて渡して呼び出されます。 |
| `afterTurn(params)`            | メソッド | 実行後のライフサイクル処理（状態の永続化、バックグラウンド Compaction のトリガー）。                           |
| `prepareSubagentSpawn(params)` | メソッド | 子セッションが開始する前に共有状態を設定します。                                                               |
| `onSubagentEnded(params)`      | メソッド | サブエージェント終了後にクリーンアップします。                                                                 |
| `dispose()`                    | メソッド | リソースを解放します。Gateway シャットダウン時または Plugin リロード時に呼び出されます - セッション単位ではありません。 |

### ownsCompaction

`ownsCompaction` は、Pi の組み込み試行内自動 Compaction をその実行で有効なままにするかどうかを制御します。

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    エンジンが Compaction 動作を所有します。OpenClaw はその実行で Pi の組み込み自動 Compaction を無効にし、エンジンの `compact()` 実装が `/compact`、オーバーフロー回復 Compaction、および `afterTurn()` 内で実行したい任意のプロアクティブ Compaction に責任を持ちます。OpenClaw はそれでもプロンプト前のオーバーフロー安全策を実行する場合があります。完全なトランスクリプトがオーバーフローすると予測した場合、回復パスは別のプロンプトを送信する前に、アクティブなエンジンの `compact()` を呼び出します。
  </Accordion>
  <Accordion title="ownsCompaction: false または未設定">
    Pi の組み込み自動 Compaction はプロンプト実行中に引き続き実行される場合がありますが、アクティブなエンジンの `compact()` メソッドは `/compact` とオーバーフロー回復のために引き続き呼び出されます。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` は、OpenClaw が legacy エンジンの Compaction パスに自動的にフォールバックすることを意味**しません**。
</Warning>

つまり、有効な Plugin パターンは 2 つあります。

<Tabs>
  <Tab title="所有モード">
    独自の Compaction アルゴリズムを実装し、`ownsCompaction: true` を設定します。
  </Tab>
  <Tab title="委譲モード">
    `ownsCompaction: false` を設定し、`compact()` から `openclaw/plugin-sdk/core` の `delegateCompactionToRuntime(...)` を呼び出して、OpenClaw の組み込み Compaction 動作を使用します。
  </Tab>
</Tabs>

no-op の `compact()` は、アクティブな非所有エンジンにとって安全ではありません。そのエンジンスロットの通常の `/compact` とオーバーフロー回復 Compaction パスを無効にしてしまうためです。

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
このスロットは実行時に排他的です - 特定の実行または Compaction 操作に対して解決される登録済みコンテキストエンジンは 1 つだけです。他の有効な `kind: "context-engine"` Plugin は引き続きロードされ、登録コードを実行できます。`plugins.slots.contextEngine` は、OpenClaw がコンテキストエンジンを必要とするときにどの登録済みエンジン id を解決するかだけを選択します。
</Note>

<Note>
**Plugin のアンインストール:** `plugins.slots.contextEngine` として現在選択されている Plugin をアンインストールすると、OpenClaw はスロットをデフォルト（`legacy`）に戻します。同じリセット動作は `plugins.slots.memory` にも適用されます。手動の設定編集は不要です。
</Note>

## Compaction とメモリとの関係

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction はコンテキストエンジンの責務の 1 つです。レガシーエンジンは OpenClaw の組み込み要約に委譲します。Plugin エンジンは任意の圧縮戦略（DAG 要約、ベクトル検索など）を実装できます。
  </Accordion>
  <Accordion title="メモリ Plugin">
    メモリ Plugin（`plugins.slots.memory`）はコンテキストエンジンとは別のものです。メモリ Plugin は検索/取得を提供し、コンテキストエンジンはモデルに見せる内容を制御します。両者は連携できます。コンテキストエンジンはアセンブリ中にメモリ Plugin のデータを使用することがあります。Active Memory プロンプトパスを使いたい Plugin エンジンは、Active Memory プロンプトセクションを先頭に追加できる `systemPromptAddition` に変換する `openclaw/plugin-sdk/core` の `buildMemorySystemPromptAddition(...)` を優先して使用してください。エンジンでより低レベルの制御が必要な場合は、`buildActiveMemoryPromptSection(...)` を使って `openclaw/plugin-sdk/memory-host-core` から生の行を取得することもできます。
  </Accordion>
  <Accordion title="セッションの剪定">
    古いツール結果のメモリ内トリミングは、どのコンテキストエンジンがアクティブであるかに関係なく引き続き実行されます。
  </Accordion>
</AccordionGroup>

## ヒント

- `openclaw doctor` を使用して、エンジンが正しく読み込まれていることを確認します。
- エンジンを切り替えても、既存のセッションは現在の履歴で続行します。新しいエンジンは今後の実行から引き継ぎます。
- エンジンエラーはログに記録され、診断に表示されます。Plugin エンジンの登録に失敗した場合、または選択されたエンジン id を解決できない場合、OpenClaw は自動的にフォールバックしません。Plugin を修正するか、`plugins.slots.contextEngine` を `"legacy"` に戻すまで、実行は失敗します。
- 開発では、`openclaw plugins install -l ./my-engine` を使用して、ローカル Plugin ディレクトリをコピーせずにリンクします。

## 関連

- [Compaction](/ja-JP/concepts/compaction) - 長い会話の要約
- [コンテキスト](/ja-JP/concepts/context) - エージェントターンのコンテキストを構築する方法
- [Plugin アーキテクチャ](/ja-JP/plugins/architecture) - コンテキストエンジン Plugin の登録
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - Plugin マニフェストのフィールド
- [Plugin](/ja-JP/tools/plugin) - Plugin の概要
