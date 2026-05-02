---
read_when:
    - OpenClaw がモデルコンテキストをどのように組み立てるかを理解したい
    - レガシーエンジンとPluginエンジンを切り替えています
    - コンテキストエンジン Pluginを構築しています
sidebarTitle: Context engine
summary: 'コンテキストエンジン: プラガブルなコンテキスト組み立て、Compaction、サブエージェントのライフサイクル'
title: コンテキストエンジン
x-i18n:
    generated_at: "2026-05-02T04:53:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7477dd1d48f9633586dce67204912a810e0931d7bc9f2d6719ba465fe19681b
    source_path: concepts/context-engine.md
    workflow: 16
---

**コンテキストエンジン**は、OpenClaw が各実行のモデルコンテキストを構築する方法を制御します。含めるメッセージ、古い履歴の要約方法、サブエージェント境界をまたいだコンテキスト管理方法を決定します。

OpenClaw には組み込みの `legacy` エンジンが同梱されており、デフォルトで使用されます。ほとんどのユーザーはこれを変更する必要はありません。別の組み立て、Compaction、またはセッション間の想起動作が必要な場合にのみ、Plugin エンジンをインストールして選択してください。

## クイックスタート

<Steps>
  <Step title="有効なエンジンを確認する">
    ```bash
    openclaw doctor
    # または設定を直接確認します:
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

    インストールと設定の後、Gateway を再起動します。

  </Step>
  <Step title="legacy に戻す（任意）">
    `contextEngine` を `"legacy"` に設定します（またはキーを完全に削除します。`"legacy"` がデフォルトです）。
  </Step>
</Steps>

## 仕組み

OpenClaw がモデルプロンプトを実行するたびに、コンテキストエンジンは 4 つのライフサイクルポイントに参加します。

<AccordionGroup>
  <Accordion title="1. 取り込み">
    セッションに新しいメッセージが追加されたときに呼び出されます。エンジンは、そのメッセージを独自のデータストアに保存またはインデックス化できます。
  </Accordion>
  <Accordion title="2. 組み立て">
    各モデル実行の前に呼び出されます。エンジンは、トークン予算内に収まる順序付きメッセージセット（および任意の `systemPromptAddition`）を返します。
  </Accordion>
  <Accordion title="3. Compact">
    コンテキストウィンドウがいっぱいになったとき、またはユーザーが `/compact` を実行したときに呼び出されます。エンジンは古い履歴を要約してスペースを解放します。
  </Accordion>
  <Accordion title="4. ターン後">
    実行完了後に呼び出されます。エンジンは状態を永続化し、バックグラウンド Compaction をトリガーし、またはインデックスを更新できます。
  </Accordion>
</AccordionGroup>

同梱の非 ACP Codex ハーネスでは、OpenClaw は組み立てられたコンテキストを Codex の開発者向け指示と現在のターンプロンプトへ投影することで、同じライフサイクルを適用します。Codex は引き続き、独自のネイティブスレッド履歴とネイティブコンパクターを所有します。

### サブエージェントのライフサイクル（任意）

OpenClaw は 2 つの任意のサブエージェントライフサイクルフックを呼び出します。

<ParamField path="prepareSubagentSpawn" type="method">
  子実行が開始する前に、共有コンテキスト状態を準備します。このフックは親/子セッションキー、`contextMode`（`isolated` または `fork`）、利用可能なトランスクリプト ID/ファイル、任意の TTL を受け取ります。ロールバックハンドルを返した場合、準備成功後にスポーンが失敗すると OpenClaw がそれを呼び出します。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  サブエージェントセッションが完了またはスイープされたときにクリーンアップします。
</ParamField>

### システムプロンプトの追加

`assemble` メソッドは `systemPromptAddition` 文字列を返せます。OpenClaw はこれをその実行のシステムプロンプトの先頭に追加します。これによりエンジンは、静的なワークスペースファイルを必要とせずに、動的な想起ガイダンス、検索指示、またはコンテキスト対応のヒントを注入できます。

## legacy エンジン

組み込みの `legacy` エンジンは、OpenClaw の従来の動作を保持します。

- **取り込み**: 何もしません（セッションマネージャーがメッセージの永続化を直接処理します）。
- **組み立て**: パススルーです（ランタイム内の既存の sanitize → validate → limit パイプラインがコンテキストの組み立てを処理します）。
- **Compact**: 組み込みの要約 Compaction に委譲します。これは古いメッセージの単一の要約を作成し、最近のメッセージをそのまま保持します。
- **ターン後**: 何もしません。

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
値が含まれるため、Plugin は最初のライフサイクルフックが実行される前に、
エージェントごと、またはワークスペースごとの状態を初期化できます。

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
| `info`             | プロパティ | エンジン ID、名前、バージョン、および Compaction を所有するかどうか |
| `ingest(params)`   | メソッド | 単一メッセージを保存する                                 |
| `assemble(params)` | メソッド | モデル実行用のコンテキストを構築する（`AssembleResult` を返す） |
| `compact(params)`  | メソッド | コンテキストを要約/削減する                              |

`assemble` は以下を含む `AssembleResult` を返します。

<ParamField path="messages" type="Message[]" required>
  モデルへ送信する順序付きメッセージ。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  組み立てられたコンテキスト内の合計トークン数に関するエンジンの推定値。OpenClaw はこれを Compaction しきい値の判断と診断レポートに使用します。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  システムプロンプトの先頭に追加されます。
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  ランナーが先行オーバーフロー事前チェックに使用するトークン推定値を制御します。デフォルトは `"assembled"` で、組み立て済みプロンプトの推定値のみがチェックされます。これは、ウィンドウ化された自己完結型コンテキストを返すエンジンに適しています。組み立て済みビューが基礎となるトランスクリプト内のオーバーフローリスクを隠す可能性がある場合にのみ、`"preassembly_may_overflow"` に設定してください。その場合、ランナーは先行 Compaction を行うかどうかを決定する際に、組み立て済み推定値と、組み立て前（非ウィンドウ化）のセッション履歴推定値の最大値を使用します。いずれの場合も、返したメッセージがモデルに表示される内容であることに変わりはありません。`promptAuthority` が影響するのは事前チェックだけです。
</ParamField>

`compact` は `CompactResult` を返します。Compaction がアクティブな
トランスクリプトをローテーションする場合、`result.sessionId` と `result.sessionFile` は、次の再試行またはターンが使用する必要がある後続セッションを識別します。

任意メンバー:

| メンバー                       | 種類   | 目的                                                                                                            |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | メソッド | セッション用のエンジン状態を初期化します。エンジンが初めてセッションを認識したときに一度呼び出されます（例: 履歴のインポート）。 |
| `ingestBatch(params)`          | メソッド | 完了したターンをバッチとして取り込みます。実行完了後、そのターンのすべてのメッセージを一度に渡して呼び出されます。 |
| `afterTurn(params)`            | メソッド | 実行後のライフサイクル処理（状態の永続化、バックグラウンド Compaction のトリガー）。                            |
| `prepareSubagentSpawn(params)` | メソッド | 子セッションが開始する前に共有状態をセットアップします。                                                        |
| `onSubagentEnded(params)`      | メソッド | サブエージェント終了後にクリーンアップします。                                                                  |
| `dispose()`                    | メソッド | リソースを解放します。Gateway シャットダウン時または Plugin リロード時に呼び出されます。セッションごとではありません。 |

### ownsCompaction

`ownsCompaction` は、Pi の組み込み試行内自動 Compaction をその実行で有効のままにするかどうかを制御します。

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    エンジンが Compaction 動作を所有します。OpenClaw はその実行で Pi の組み込み自動 Compaction を無効化し、エンジンの `compact()` 実装が `/compact`、オーバーフロー回復 Compaction、および `afterTurn()` 内で実行したい任意のプロアクティブな Compaction を担当します。OpenClaw は引き続きプロンプト前のオーバーフロー保護を実行する場合があります。完全なトランスクリプトがオーバーフローすると予測した場合、回復パスは別のプロンプトを送信する前に、アクティブなエンジンの `compact()` を呼び出します。
  </Accordion>
  <Accordion title="ownsCompaction: false または未設定">
    Pi の組み込み自動 Compaction はプロンプト実行中に引き続き実行される場合がありますが、アクティブなエンジンの `compact()` メソッドは `/compact` とオーバーフロー回復のために引き続き呼び出されます。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` は、OpenClaw が legacy エンジンの Compaction パスへ自動的にフォールバックすることを意味**しません**。
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

アクティブな非所有エンジンで何もしない `compact()` を使用するのは安全ではありません。そのエンジンスロットの通常の `/compact` とオーバーフロー回復 Compaction パスが無効になるためです。

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
このスロットは実行時に排他的です。特定の実行または Compaction 操作に対して解決される登録済みコンテキストエンジンは 1 つだけです。他の有効な `kind: "context-engine"` Plugin は引き続きロードされ、登録コードを実行できます。`plugins.slots.contextEngine` は、OpenClaw がコンテキストエンジンを必要とするときに解決する登録済みエンジン ID を選択するだけです。
</Note>

<Note>
**Plugin のアンインストール:** `plugins.slots.contextEngine` として現在選択されている Plugin をアンインストールすると、OpenClaw はスロットをデフォルト（`legacy`）へリセットします。同じリセット動作は `plugins.slots.memory` にも適用されます。手動で設定を編集する必要はありません。
</Note>

## Compaction とメモリとの関係

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction はコンテキストエンジンの責務の 1 つです。レガシーエンジンは OpenClaw の組み込み要約に委譲します。Plugin エンジンは任意の Compaction 戦略（DAG 要約、ベクトル検索など）を実装できます。
  </Accordion>
  <Accordion title="メモリPlugin">
    メモリPlugin（`plugins.slots.memory`）はコンテキストエンジンとは別です。メモリPluginは検索/取得を提供し、コンテキストエンジンはモデルに見せる内容を制御します。両者は連携できます — コンテキストエンジンは組み立て時にメモリPluginのデータを使うことがあります。Active Memory プロンプトパスを使いたい Plugin エンジンは、`openclaw/plugin-sdk/core` の `buildMemorySystemPromptAddition(...)` を優先してください。これは Active Memory プロンプトセクションを、先頭に追加できる `systemPromptAddition` に変換します。エンジンがより低レベルの制御を必要とする場合でも、`openclaw/plugin-sdk/memory-host-core` の `buildActiveMemoryPromptSection(...)` を使って生の行を取得できます。
  </Accordion>
  <Accordion title="セッションの刈り込み">
    メモリ内で古いツール結果をトリミングする処理は、どのコンテキストエンジンが有効でも引き続き実行されます。
  </Accordion>
</AccordionGroup>

## ヒント

- `openclaw doctor` を使って、エンジンが正しく読み込まれていることを確認します。
- エンジンを切り替える場合、既存のセッションは現在の履歴のまま継続します。新しいエンジンは今後の実行から引き継ぎます。
- エンジンエラーはログに記録され、診断に表示されます。Plugin エンジンの登録に失敗した場合、または選択されたエンジン ID を解決できない場合、OpenClaw は自動的にフォールバックしません。Plugin を修正するか、`plugins.slots.contextEngine` を `"legacy"` に戻すまで、実行は失敗します。
- 開発では、`openclaw plugins install -l ./my-engine` を使うと、ローカルの Plugin ディレクトリをコピーせずにリンクできます。

## 関連

- [Compaction](/ja-JP/concepts/compaction) — 長い会話の要約
- [コンテキスト](/ja-JP/concepts/context) — エージェントターンのコンテキストがどのように構築されるか
- [Plugin アーキテクチャ](/ja-JP/plugins/architecture) — コンテキストエンジンPluginの登録
- [Plugin マニフェスト](/ja-JP/plugins/manifest) — Plugin マニフェストのフィールド
- [Plugin](/ja-JP/tools/plugin) — Plugin の概要
