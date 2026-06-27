---
read_when:
    - OpenClaw がモデルコンテキストをどのように組み立てるかを理解したい
    - レガシーエンジンと Plugin エンジンを切り替えています
    - コンテキストエンジン Plugin を構築しています
sidebarTitle: Context engine
summary: 'コンテキストエンジン: プラグ可能なコンテキスト構築、Compaction、サブエージェントのライフサイクル'
title: コンテキストエンジン
x-i18n:
    generated_at: "2026-06-27T11:07:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 124b6daf52f3d58f756352e2e169697541a8b6e67aecaa5a219bed15bda801cd
    source_path: concepts/context-engine.md
    workflow: 16
---

**コンテキストエンジン**は、OpenClaw が各実行のモデルコンテキストを構築する方法を制御します。含めるメッセージ、古い履歴の要約方法、サブエージェント境界をまたいだコンテキスト管理方法を決定します。

OpenClaw には組み込みの `legacy` エンジンが同梱され、デフォルトで使用されます。ほとんどのユーザーはこれを変更する必要はありません。異なる組み立て、Compaction、またはセッション横断の想起動作が必要な場合にのみ、Plugin エンジンをインストールして選択してください。

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
    コンテキストエンジンの Plugin は、他の OpenClaw Plugin と同じようにインストールします。

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

    インストールと設定の後に Gateway を再起動します。

  </Step>
  <Step title="legacy に戻す（任意）">
    `contextEngine` を `"legacy"` に設定します（またはキーを完全に削除します。`"legacy"` がデフォルトです）。
  </Step>
</Steps>

## 仕組み

OpenClaw がモデルプロンプトを実行するたびに、コンテキストエンジンは 4 つのライフサイクルポイントに関与します。

<AccordionGroup>
  <Accordion title="1. 取り込み">
    新しいメッセージがセッションに追加されたときに呼び出されます。エンジンは、そのメッセージを自身のデータストアに保存またはインデックス化できます。
  </Accordion>
  <Accordion title="2. 組み立て">
    各モデル実行の前に呼び出されます。エンジンは、トークン予算内に収まる順序付きのメッセージセット（および任意の `systemPromptAddition`）を返します。
  </Accordion>
  <Accordion title="3. Compact">
    コンテキストウィンドウが満杯になったとき、またはユーザーが `/compact` を実行したときに呼び出されます。エンジンは古い履歴を要約して空き容量を確保します。
  </Accordion>
  <Accordion title="4. ターン後">
    実行完了後に呼び出されます。エンジンは状態を永続化したり、バックグラウンド Compaction をトリガーしたり、インデックスを更新したりできます。
  </Accordion>
</AccordionGroup>

同梱の非 ACP Codex ハーネスでは、OpenClaw は組み立て済みコンテキストを Codex の開発者向け指示と現在のターンプロンプトに投影することで、同じライフサイクルを適用します。Codex は引き続き、ネイティブのスレッド履歴とネイティブの compactor を所有します。

### サブエージェントのライフサイクル（任意）

OpenClaw は 2 つの任意のサブエージェントライフサイクルフックを呼び出します。

<ParamField path="prepareSubagentSpawn" type="method">
  子実行が開始する前に共有コンテキスト状態を準備します。このフックは、親/子セッションキー、`contextMode`（`isolated` または `fork`）、利用可能なトランスクリプト ID/ファイル、および任意の TTL を受け取ります。ロールバックハンドルを返した場合、準備成功後に spawn が失敗すると OpenClaw がそれを呼び出します。`lightContext` を要求し、`contextMode="isolated"` に解決されるネイティブサブエージェント spawn は、このフックを意図的にスキップします。これにより、子はコンテキストエンジン管理の事前 spawn 状態なしに、軽量なブートストラップコンテキストから開始します。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  サブエージェントセッションが完了またはスイープされたときにクリーンアップします。
</ParamField>

### システムプロンプト追加

`assemble` メソッドは `systemPromptAddition` 文字列を返せます。OpenClaw はこれを実行用のシステムプロンプトの先頭に追加します。これにより、エンジンは静的なワークスペースファイルを必要とせずに、動的な想起ガイダンス、検索指示、またはコンテキスト対応のヒントを注入できます。

## legacy エンジン

組み込みの `legacy` エンジンは、OpenClaw の元の動作を維持します。

- **取り込み**: no-op（セッションマネージャーがメッセージの永続化を直接処理します）。
- **組み立て**: パススルー（ランタイム内の既存の sanitize → validate → limit パイプラインがコンテキスト組み立てを処理します）。
- **Compact**: 組み込みの要約 Compaction に委譲します。これは古いメッセージの単一の要約を作成し、最近のメッセージをそのまま保持します。
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

ファクトリ `ctx` には、任意の `config`、`agentDir`、`workspaceDir` の値が含まれるため、Plugin は最初のライフサイクルフックが実行される前に、エージェントごとまたはワークスペースごとの状態を初期化できます。

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
| `ingest(params)`   | メソッド | 単一のメッセージを保存する                               |
| `assemble(params)` | メソッド | モデル実行用のコンテキストを構築する（`AssembleResult` を返す） |
| `compact(params)`  | メソッド | コンテキストを要約/削減する                              |

`assemble` は次を含む `AssembleResult` を返します。

<ParamField path="messages" type="Message[]" required>
  モデルに送信する順序付きメッセージ。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  組み立て済みコンテキスト内の合計トークン数に対するエンジンの推定値。OpenClaw はこれを Compaction しきい値の判断と診断レポートに使用します。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  システムプロンプトの先頭に追加されます。
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  ランナーが先制的なオーバーフロー事前チェックに使用するトークン推定値を制御します。デフォルトは `"assembled"` です。これは、組み立て済みプロンプトの推定値のみがチェックされることを意味し、ウィンドウ化された自己完結型コンテキストを返すエンジンに適しています。組み立て済みビューが基盤となるトランスクリプト内のオーバーフローリスクを隠す可能性がある場合にのみ、`"preassembly_may_overflow"` に設定します。その場合、ランナーは先制的に compact するかどうかを判断するときに、組み立て済み推定値と組み立て前（ウィンドウ化されていない）セッション履歴推定値の最大値を取ります。いずれの場合も、返したメッセージがモデルに表示される内容です。`promptAuthority` は事前チェックにのみ影響します。
</ParamField>

`compact` は `CompactResult` を返します。Compaction によってアクティブなトランスクリプトがローテーションされる場合、`result.sessionId` と `result.sessionFile` は、次のリトライまたはターンが使用する必要がある後継セッションを識別します。

任意メンバー:

| メンバー                       | 種類   | 目的                                                                                                            |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | メソッド | セッションのエンジン状態を初期化します。エンジンがセッションを初めて認識したときに一度呼び出されます（例: 履歴のインポート）。 |
| `ingestBatch(params)`          | メソッド | 完了したターンをバッチとして取り込みます。実行完了後、そのターンのすべてのメッセージをまとめて呼び出されます。 |
| `afterTurn(params)`            | メソッド | 実行後のライフサイクル作業（状態の永続化、バックグラウンド Compaction のトリガー）。 |
| `prepareSubagentSpawn(params)` | メソッド | 開始前に子セッション用の共有状態をセットアップします。 |
| `onSubagentEnded(params)`      | メソッド | サブエージェント終了後にクリーンアップします。 |
| `dispose()`                    | メソッド | リソースを解放します。Gateway シャットダウンまたは Plugin リロード中に呼び出され、セッションごとではありません。 |

### ランタイム設定

OpenClaw 内で実行されるライフサイクルフックは、任意の `runtimeSettings` オブジェクトを受け取ります。これは、バージョン付きの読み取り専用の内部 producer/consumer API サーフェスです。OpenClaw が選択されたコンテキストエンジン向けに生成し、コンテキストエンジンがライフサイクルフック内で消費します。これはユーザーに直接表示されず、専用のレポートサーフェスも作成しません。

- `schemaVersion`: 現在は `1`
- `runtime`: OpenClaw ホスト、ランタイムモード（`normal`、`fallback`、または `degraded`）、任意のハーネス/ランタイム ID
- `contextEngineSelection`: 選択されたコンテキストエンジン ID と選択元
- `executionHost`: フックを呼び出すサーフェスのホスト ID とラベル
- `model`: 要求されたモデル、解決済みモデル、プロバイダー、任意のモデルファミリー
- `limits`: 判明している場合のプロンプトトークン予算と最大出力トークン数
- `diagnostics`: 判明している場合のクローズドな fallback および degraded 理由コード

不明になり得るフィールドは `null` として表されます。ランタイムモードや選択元などの判別子フィールドは非 null のままです。古いエンジンも互換性を維持します。厳格な legacy エンジンが `runtimeSettings` を不明なプロパティとして拒否した場合、OpenClaw はエンジンを隔離するのではなく、それなしでライフサイクル呼び出しを再試行します。

### ホスト要件

コンテキストエンジンは、`info.hostRequirements` でホスト機能要件を宣言できます。OpenClaw は操作開始前にこれらの要件を確認し、選択されたランタイムが満たせない場合は、説明付きエラーで fail closed します。

エージェント実行では、エンジンが `assemble()` を通じて実際のモデルプロンプトを制御する必要がある場合に `assemble-before-prompt` を宣言します。

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

ネイティブ Codex と OpenClaw embedded エージェント実行は `assemble-before-prompt` を満たします。汎用 CLI バックエンドは満たさないため、それを要求するエンジンは CLI プロセスが開始する前に拒否されます。

### 障害の分離

OpenClaw は、選択された Plugin エンジンをコア返信パスから分離します。非 legacy エンジンが見つからない、契約検証に失敗する、ファクトリ作成中に例外を投げる、またはライフサイクルメソッドから例外を投げる場合、OpenClaw は現在の Gateway プロセスでそのエンジンを隔離し、コンテキストエンジン作業を組み込みの `legacy` エンジンにダウングレードします。エラーは失敗した操作とともにログに記録されるため、オペレーターはエージェントが沈黙することなく、Plugin を修復、更新、または無効化できます。

ホスト要件の失敗は異なります。エンジンが、ランタイムに必要な機能が欠けていると宣言した場合、OpenClaw は実行を開始する前にフェイルクローズします。これにより、サポートされていないホストで実行すると状態を破損する可能性があるエンジンを保護します。

### ownsCompaction

`ownsCompaction` は、その実行で OpenClaw ランタイム組み込みの試行内自動 Compaction を有効のままにするかどうかを制御します。

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    エンジンが Compaction 動作を所有します。OpenClaw はその実行で OpenClaw ランタイム組み込みの自動 Compaction を無効にし、エンジンの `compact()` 実装が `/compact`、オーバーフロー復旧 Compaction、そして `afterTurn()` で実行したい任意のプロアクティブな Compaction を担当します。OpenClaw は引き続きプロンプト前のオーバーフロー保護を実行する場合があります。完全なトランスクリプトがオーバーフローすると予測した場合、復旧パスは別のプロンプトを送信する前にアクティブなエンジンの `compact()` を呼び出します。
  </Accordion>
  <Accordion title="ownsCompaction: false または未設定">
    OpenClaw ランタイム組み込みの自動 Compaction はプロンプト実行中に引き続き実行される場合がありますが、`/compact` とオーバーフロー復旧では、アクティブなエンジンの `compact()` メソッドが引き続き呼び出されます。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` は、OpenClaw がレガシーエンジンの Compaction パスへ自動的にフォールバックすることを意味しません。
</Warning>

つまり、有効な Plugin パターンは 2 つあります。

<Tabs>
  <Tab title="所有モード">
    独自の Compaction アルゴリズムを実装し、`ownsCompaction: true` を設定します。
  </Tab>
  <Tab title="委譲モード">
    `ownsCompaction: false` を設定し、`compact()` で `openclaw/plugin-sdk/core` の `delegateCompactionToRuntime(...)` を呼び出して、OpenClaw 組み込みの Compaction 動作を使用します。
  </Tab>
</Tabs>

アクティブな非所有エンジンで no-op の `compact()` を使うのは安全ではありません。そのエンジンスロットの通常の `/compact` とオーバーフロー復旧 Compaction パスが無効になるためです。

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
このスロットは実行時に排他的です。特定の実行または Compaction 操作に対して解決される登録済みコンテキストエンジンは 1 つだけです。他の有効な `kind: "context-engine"` Plugin は引き続きロードされ、登録コードを実行できます。`plugins.slots.contextEngine` は、OpenClaw がコンテキストエンジンを必要とするときに解決する登録済みエンジン ID だけを選択します。
</Note>

<Note>
**Plugin のアンインストール:** 現在 `plugins.slots.contextEngine` として選択されている Plugin をアンインストールすると、OpenClaw はスロットをデフォルト（`legacy`）にリセットします。同じリセット動作は `plugins.slots.memory` にも適用されます。手動で設定を編集する必要はありません。
</Note>

## Compaction とメモリとの関係

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction はコンテキストエンジンの責務の 1 つです。レガシーエンジンは OpenClaw 組み込みの要約に委譲します。Plugin エンジンは任意の Compaction 戦略（DAG 要約、ベクトル検索など）を実装できます。
  </Accordion>
  <Accordion title="メモリ Plugin">
    メモリ Plugin（`plugins.slots.memory`）はコンテキストエンジンとは別のものです。メモリ Plugin は検索と取得を提供し、コンテキストエンジンはモデルが見る内容を制御します。これらは連携できます。たとえば、コンテキストエンジンが組み立て中にメモリ Plugin のデータを使う場合があります。アクティブなメモリプロンプトパスを使いたい Plugin エンジンは、`openclaw/plugin-sdk/core` の `buildMemorySystemPromptAddition(...)` を優先するべきです。これは、アクティブなメモリプロンプトセクションを、先頭に追加できる `systemPromptAddition` に変換します。エンジンがより低レベルの制御を必要とする場合でも、`openclaw/plugin-sdk/memory-host-core` から `buildActiveMemoryPromptSection(...)` 経由で生の行を取得できます。
  </Accordion>
  <Accordion title="セッションの枝刈り">
    古いツール結果のメモリ内トリミングは、どのコンテキストエンジンがアクティブであるかに関係なく引き続き実行されます。
  </Accordion>
</AccordionGroup>

## ヒント

- エンジンが正しくロードされていることを確認するには、`openclaw doctor` を使用します。
- エンジンを切り替えても、既存のセッションは現在の履歴を保持したまま継続します。新しいエンジンは今後の実行を引き継ぎます。
- エンジンエラーはログに記録され、選択された Plugin エンジンは現在の Gateway プロセスで隔離されます。OpenClaw はユーザーターンに対して `legacy` にフォールバックするため返信は継続できますが、壊れた Plugin は修復、更新、無効化、またはアンインストールする必要があります。
- 開発では、コピーせずにローカル Plugin ディレクトリをリンクするために `openclaw plugins install -l ./my-engine` を使用します。

## 関連

- [Compaction](/ja-JP/concepts/compaction) - 長い会話を要約する
- [コンテキスト](/ja-JP/concepts/context) - エージェントターンのコンテキストがどのように構築されるか
- [Plugin アーキテクチャ](/ja-JP/plugins/architecture) - コンテキストエンジン Plugin を登録する
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - Plugin マニフェストフィールド
- [Plugin](/ja-JP/tools/plugin) - Plugin の概要
