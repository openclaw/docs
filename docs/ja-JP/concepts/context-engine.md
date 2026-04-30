---
read_when:
    - OpenClaw がモデルコンテキストをどのように組み立てるかを理解したい
    - レガシーエンジンと Plugin エンジンを切り替えています
    - コンテキストエンジンPluginを構築しています
sidebarTitle: Context engine
summary: 'コンテキストエンジン: 差し替え可能なコンテキストの組み立て、Compaction、サブエージェントのライフサイクル'
title: コンテキストエンジン
x-i18n:
    generated_at: "2026-04-30T05:07:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f192c6b28ad2b5960b504811926fb5e30fe8da9d985d8eec3ad4b65c9f7cae5
    source_path: concepts/context-engine.md
    workflow: 16
---

**コンテキストエンジン**は、OpenClaw が各実行のモデルコンテキストを構築する方法を制御します。どのメッセージを含めるか、古い履歴をどう要約するか、サブエージェント境界をまたぐコンテキストをどう管理するかを扱います。

OpenClaw には組み込みの `legacy` エンジンが同梱されており、デフォルトで使用されます。ほとんどのユーザーはこれを変更する必要はありません。異なる組み立て、圧縮、またはセッションをまたぐ想起動作が必要な場合にのみ、Plugin エンジンをインストールして選択してください。

## クイックスタート

<Steps>
  <Step title="有効なエンジンを確認する">
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

    インストールと設定の後に Gateway を再起動してください。

  </Step>
  <Step title="legacy に戻す（任意）">
    `contextEngine` を `"legacy"` に設定します（またはキーを完全に削除します。`"legacy"` がデフォルトです）。
  </Step>
</Steps>

## 仕組み

OpenClaw がモデルプロンプトを実行するたびに、コンテキストエンジンは 4 つのライフサイクルポイントに関与します。

<AccordionGroup>
  <Accordion title="1. 取り込み">
    新しいメッセージがセッションに追加されたときに呼び出されます。エンジンは、自身のデータストアにメッセージを保存またはインデックス化できます。
  </Accordion>
  <Accordion title="2. 組み立て">
    各モデル実行の前に呼び出されます。エンジンは、トークン予算内に収まる順序付きのメッセージセット（および任意の `systemPromptAddition`）を返します。
  </Accordion>
  <Accordion title="3. 圧縮">
    コンテキストウィンドウがいっぱいになったとき、またはユーザーが `/compact` を実行したときに呼び出されます。エンジンは古い履歴を要約して空き領域を作ります。
  </Accordion>
  <Accordion title="4. ターン後">
    実行が完了した後に呼び出されます。エンジンは状態を永続化したり、バックグラウンド圧縮をトリガーしたり、インデックスを更新したりできます。
  </Accordion>
</AccordionGroup>

同梱の非 ACP Codex ハーネスでは、OpenClaw は組み立て済みコンテキストを Codex の開発者向け指示と現在のターンプロンプトに投影することで、同じライフサイクルを適用します。Codex は引き続き、ネイティブのスレッド履歴とネイティブのコンパクターを所有します。

### サブエージェントのライフサイクル（任意）

OpenClaw は 2 つの任意のサブエージェントライフサイクルフックを呼び出します。

<ParamField path="prepareSubagentSpawn" type="method">
  子実行が開始される前に共有コンテキスト状態を準備します。このフックは、親/子セッションキー、`contextMode`（`isolated` または `fork`）、利用可能なトランスクリプト ID/ファイル、および任意の TTL を受け取ります。ロールバックハンドルを返した場合、準備の成功後に spawn が失敗したとき、OpenClaw はそれを呼び出します。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  サブエージェントセッションが完了したとき、または sweep されたときにクリーンアップします。
</ParamField>

### システムプロンプト追加

`assemble` メソッドは `systemPromptAddition` 文字列を返すことができます。OpenClaw はこれを実行時のシステムプロンプトの先頭に追加します。これにより、エンジンは静的なワークスペースファイルを必要とせずに、動的な想起ガイダンス、検索指示、またはコンテキスト対応のヒントを注入できます。

## legacy エンジン

組み込みの `legacy` エンジンは、OpenClaw の元の動作を維持します。

- **取り込み**: no-op（セッションマネージャーがメッセージの永続化を直接処理します）。
- **組み立て**: パススルー（ランタイム内の既存の sanitize → validate → limit パイプラインがコンテキストの組み立てを処理します）。
- **圧縮**: 組み込みの要約圧縮に委譲します。これにより、古いメッセージの単一の要約が作成され、最近のメッセージはそのまま保持されます。
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

ファクトリ `ctx` には任意の `config`、`agentDir`、`workspaceDir` 値が含まれているため、Plugin は最初のライフサイクルフックが実行される前に、エージェント単位またはワークスペース単位の状態を初期化できます。

次に、設定で有効化します。

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
| `info`             | プロパティ | エンジン ID、名前、バージョン、および圧縮を所有するかどうか |
| `ingest(params)`   | メソッド | 単一のメッセージを保存する                               |
| `assemble(params)` | メソッド | モデル実行のコンテキストを構築する（`AssembleResult` を返す） |
| `compact(params)`  | メソッド | コンテキストを要約/削減する                              |

`assemble` は、次を含む `AssembleResult` を返します。

<ParamField path="messages" type="Message[]" required>
  モデルに送信する順序付きメッセージ。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  組み立てられたコンテキスト内の総トークン数に対するエンジンの推定値。OpenClaw はこれを圧縮しきい値の判断と診断レポートに使用します。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  システムプロンプトの先頭に追加されます。
</ParamField>

`compact` は `CompactResult` を返します。圧縮によってアクティブなトランスクリプトがローテーションされる場合、`result.sessionId` と `result.sessionFile` は、次の再試行またはターンで使用する必要がある後続セッションを識別します。

任意メンバー:

| メンバー                       | 種類     | 目的                                                                                                           |
| ------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | メソッド | セッションのエンジン状態を初期化します。エンジンが初めてセッションを認識したときに 1 回呼び出されます（例: 履歴のインポート）。 |
| `ingestBatch(params)`          | メソッド | 完了したターンをバッチとして取り込みます。実行完了後に、そのターンのすべてのメッセージとともに 1 回呼び出されます。 |
| `afterTurn(params)`            | メソッド | 実行後のライフサイクル作業（状態の永続化、バックグラウンド圧縮のトリガー）。                                     |
| `prepareSubagentSpawn(params)` | メソッド | 子セッションが開始する前に共有状態を設定します。                                                               |
| `onSubagentEnded(params)`      | メソッド | サブエージェントの終了後にクリーンアップします。                                                               |
| `dispose()`                    | メソッド | リソースを解放します。Gateway のシャットダウンまたは Plugin のリロード中に呼び出されます。セッション単位ではありません。 |

### ownsCompaction

`ownsCompaction` は、Pi の組み込みの試行内自動圧縮をその実行で有効なままにするかどうかを制御します。

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    エンジンが圧縮動作を所有します。OpenClaw はその実行で Pi の組み込み自動圧縮を無効にし、エンジンの `compact()` 実装が `/compact`、オーバーフロー回復圧縮、および `afterTurn()` で実行したい任意の事前圧縮を担当します。OpenClaw はプリプロンプトのオーバーフロー保護を引き続き実行する場合があります。完全なトランスクリプトがオーバーフローすると予測した場合、回復パスは別のプロンプトを送信する前に、アクティブなエンジンの `compact()` を呼び出します。
  </Accordion>
  <Accordion title="ownsCompaction: false または未設定">
    Pi の組み込み自動圧縮はプロンプト実行中に引き続き実行される場合がありますが、アクティブなエンジンの `compact()` メソッドは `/compact` とオーバーフロー回復のために引き続き呼び出されます。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` は、OpenClaw が自動的に legacy エンジンの圧縮パスにフォールバックすることを意味**しません**。
</Warning>

つまり、有効な Plugin パターンは 2 つあります。

<Tabs>
  <Tab title="所有モード">
    独自の圧縮アルゴリズムを実装し、`ownsCompaction: true` を設定します。
  </Tab>
  <Tab title="委譲モード">
    `ownsCompaction: false` を設定し、`compact()` で `openclaw/plugin-sdk/core` の `delegateCompactionToRuntime(...)` を呼び出して OpenClaw の組み込み圧縮動作を使用します。
  </Tab>
</Tabs>

no-op の `compact()` は、アクティブな非所有エンジンでは安全ではありません。そのエンジンスロットの通常の `/compact` とオーバーフロー回復圧縮パスを無効にしてしまうためです。

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
このスロットは実行時には排他的です。指定された実行または圧縮操作に対して解決される登録済みコンテキストエンジンは 1 つだけです。他の有効な `kind: "context-engine"` Plugin は引き続きロードされ、その登録コードを実行できます。`plugins.slots.contextEngine` は、OpenClaw がコンテキストエンジンを必要とするときに解決する登録済みエンジン ID を選択するだけです。
</Note>

<Note>
**Plugin のアンインストール:** 現在 `plugins.slots.contextEngine` として選択されている Plugin をアンインストールすると、OpenClaw はスロットをデフォルト（`legacy`）に戻します。同じリセット動作は `plugins.slots.memory` にも適用されます。手動で設定を編集する必要はありません。
</Note>

## 圧縮とメモリとの関係

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction はコンテキストエンジンの責務の1つです。従来のエンジンは OpenClaw の組み込み要約に委譲します。Plugin エンジンは任意の Compaction 戦略（DAG 要約、ベクトル検索など）を実装できます。
  </Accordion>
  <Accordion title="メモリー Plugin">
    メモリー Plugin（`plugins.slots.memory`）はコンテキストエンジンとは別です。メモリー Plugin は検索/取得を提供し、コンテキストエンジンはモデルに見せる内容を制御します。これらは連携できます。コンテキストエンジンは組み立て時にメモリー Plugin のデータを使用する場合があります。Active Memory プロンプトパスを使いたい Plugin エンジンは、`openclaw/plugin-sdk/core` の `buildMemorySystemPromptAddition(...)` を優先してください。これは Active Memory プロンプトセクションを、前置き可能な `systemPromptAddition` に変換します。エンジンがより低レベルの制御を必要とする場合は、`openclaw/plugin-sdk/memory-host-core` から `buildActiveMemoryPromptSection(...)` 経由で生の行を取得することもできます。
  </Accordion>
  <Accordion title="セッションの枝刈り">
    メモリー内の古いツール結果のトリミングは、どのコンテキストエンジンがアクティブかに関係なく引き続き実行されます。
  </Accordion>
</AccordionGroup>

## ヒント

- `openclaw doctor` を使用して、エンジンが正しく読み込まれていることを確認してください。
- エンジンを切り替えても、既存のセッションは現在の履歴のまま継続します。新しいエンジンは今後の実行から引き継ぎます。
- エンジンエラーはログに記録され、診断に表示されます。Plugin エンジンの登録に失敗した場合、または選択されたエンジン ID を解決できない場合、OpenClaw は自動的にはフォールバックしません。Plugin を修正するか、`plugins.slots.contextEngine` を `"legacy"` に戻すまで、実行は失敗します。
- 開発では、`openclaw plugins install -l ./my-engine` を使用すると、ローカル Plugin ディレクトリをコピーせずにリンクできます。

## 関連

- [Compaction](/ja-JP/concepts/compaction) — 長い会話の要約
- [コンテキスト](/ja-JP/concepts/context) — エージェントターンのコンテキストがどのように構築されるか
- [Plugin アーキテクチャ](/ja-JP/plugins/architecture) — コンテキストエンジン Plugin の登録
- [Plugin マニフェスト](/ja-JP/plugins/manifest) — Plugin マニフェストフィールド
- [Plugin](/ja-JP/tools/plugin) — Plugin の概要
