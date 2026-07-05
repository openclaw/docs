---
read_when:
    - OpenClaw がモデルコンテキストをどのように組み立てるかを理解したい
    - レガシーエンジンとPluginエンジンを切り替えています
    - コンテキストエンジンPluginを構築しています
sidebarTitle: Context engine
summary: 'コンテキストエンジン: プラグ可能なコンテキスト組み立て、Compaction、サブエージェントのライフサイクル'
title: コンテキストエンジン
x-i18n:
    generated_at: "2026-07-05T11:15:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2649dea456f271421aa64022abb00663ccf71e0afd5e11ecbbee7aa30338fd53
    source_path: concepts/context-engine.md
    workflow: 16
---

**コンテキストエンジン**は、OpenClaw が各実行のモデルコンテキストをどのように構築するかを制御します。含めるメッセージ、古い履歴の要約方法、サブエージェント境界をまたぐコンテキストの管理方法を決定します。

OpenClaw には組み込みの `legacy` エンジンが同梱されており、既定で使用されます。異なる組み立て、Compaction、またはセッション間の想起動作が必要な場合にのみ、Plugin エンジンをインストールして選択してください。

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

    インストールと設定の後、Gateway を再起動します。

  </Step>
  <Step title="legacy に戻す (任意)">
    `contextEngine` を `"legacy"` に設定します (またはキーを完全に削除します - `"legacy"` が既定です)。
  </Step>
</Steps>

## 仕組み

OpenClaw がモデルプロンプトを実行するたびに、コンテキストエンジンは 4 つのライフサイクルポイントに参加します。

<AccordionGroup>
  <Accordion title="1. 取り込み">
    新しいメッセージがセッションに追加されたときに呼び出されます。エンジンは、そのメッセージを自身のデータストアに保存またはインデックス化できます。
  </Accordion>
  <Accordion title="2. 組み立て">
    各モデル実行の前に呼び出されます。エンジンは、トークン予算内に収まるメッセージの順序付きセット (および任意の `systemPromptAddition`) を返します。
  </Accordion>
  <Accordion title="3. Compact">
    コンテキストウィンドウがいっぱいになったとき、またはユーザーが `/compact` を実行したときに呼び出されます。エンジンは古い履歴を要約して空き領域を作ります。
  </Accordion>
  <Accordion title="4. ターン後">
    実行が完了した後に呼び出されます。エンジンは状態の永続化、バックグラウンド Compaction のトリガー、またはインデックスの更新を行えます。
  </Accordion>
</AccordionGroup>

エンジンは、ブートストラップ後、成功したターン後、または Compaction 後のトランスクリプトメンテナンス (`runtimeContext.rewriteTranscriptEntries()` による安全な書き換え) のために、任意の `maintain()` メソッドも実装できます。返信をブロックせず遅延作業として実行するには、`info.turnMaintenanceMode: "background"` を設定します。

同梱の非 ACP Codex ハーネスでは、OpenClaw は組み立て済みコンテキストを Codex 開発者指示と現在のターンプロンプトに投影することで、同じライフサイクルを適用します。Codex は引き続き、ネイティブのスレッド履歴とネイティブの compactor を所有します。

### サブエージェントライフサイクル (任意)

OpenClaw は 2 つの任意のサブエージェントライフサイクルフックを呼び出します。

<ParamField path="prepareSubagentSpawn" type="method">
  子の実行が開始する前に、共有コンテキスト状態を準備します。このフックは、親/子セッションキー、`contextMode` (`isolated` または `fork`)、利用可能なトランスクリプト ID/ファイル、および任意の TTL を受け取ります。ロールバックハンドルを返した場合、準備が成功した後にスポーンが失敗すると OpenClaw がそれを呼び出します。`lightContext` を要求し、`contextMode="isolated"` に解決されるネイティブサブエージェントスポーンは、このフックを意図的にスキップします。これにより、子はコンテキストエンジン管理のスポーン前状態なしに、軽量なブートストラップコンテキストから開始します。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  サブエージェントセッションが完了したとき、またはスイープされたときにクリーンアップします。
</ParamField>

### システムプロンプト追加

`assemble` メソッドは `systemPromptAddition` 文字列を返せます。OpenClaw はこれをその実行のシステムプロンプトの先頭に追加します。これにより、エンジンは静的なワークスペースファイルを必要とせずに、動的な想起ガイダンス、検索指示、またはコンテキスト対応のヒントを注入できます。

## legacy エンジン

組み込みの `legacy` エンジンは、OpenClaw の元の動作を維持します。

- **取り込み**: no-op (セッションマネージャーがメッセージ永続化を直接処理します)。
- **組み立て**: パススルー (ランタイム内の既存の sanitize → validate → limit パイプラインがコンテキストの組み立てを処理します)。
- **Compact**: 組み込みの要約 Compaction に委譲します。これは古いメッセージの単一の要約を作成し、最近のメッセージをそのまま保持します。
- **ターン後**: no-op。

legacy エンジンはツールを登録せず、`systemPromptAddition` も提供しません。

`plugins.slots.contextEngine` が設定されていない場合 (または `"legacy"` に設定されている場合)、このエンジンが自動的に使用されます。

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
値が含まれるため、Plugin は最初のライフサイクルフックが実行される前に、エージェント単位またはワークスペース単位の状態を初期化できます。

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

### ContextEngine インターフェイス

必須メンバー:

| メンバー           | 種類     | 目的                                                     |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | プロパティ | エンジン ID、名前、バージョン、および Compaction を所有するかどうか |
| `ingest(params)`   | メソッド | 単一のメッセージを保存する                               |
| `assemble(params)` | メソッド | モデル実行のコンテキストを構築する (`AssembleResult` を返す) |
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
  ランナーが予防的なオーバーフロー事前チェックに使用するトークン推定値を制御します。既定は `"assembled"` です。これは、Compaction を所有しないエンジンについては、組み立て済みプロンプトの推定値のみがチェックされることを意味します。`ownsCompaction: true` を設定するエンジンは独自のプロンプト許可を管理するため、OpenClaw は既定で汎用のプロンプト前事前チェックをスキップします。組み立て済みビューが基盤となるトランスクリプト内のオーバーフローリスクを隠す可能性がある場合にのみ、`"preassembly_may_overflow"` を設定してください。その場合、ランナーは汎用の事前チェックを有効なままにし、予防的に Compact するかどうかを判断するときに、組み立て済み推定値と組み立て前 (ウィンドウ化されていない) セッション履歴推定値の最大値を使用します。どちらの場合でも、返したメッセージがモデルに見える内容であることに変わりはありません。`promptAuthority` は事前チェックのみに影響します。
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  永続的なバックエンドスレッドを持つホスト (例: Codex app-server) 向けの任意の投影ライフサイクル。安定した `epoch` を持つ `mode: "thread_bootstrap"` は、ターンごとに再投影する代わりに、ホストに対してエポックごとに 1 回だけ組み立て済みコンテキストを注入し、エポックが変わるまでバックエンドスレッドを再利用するよう要求します。通常のターンごとの投影では、このフィールドを省略します。
</ParamField>

`compact` は `CompactResult` を返します。Compaction によってアクティブなトランスクリプトがローテーションされる場合、`result.sessionId` と `result.sessionFile` は、次の再試行またはターンが使用する必要がある後続セッションを識別します。

任意メンバー:

| メンバー                       | 種類   | 目的                                                                                                                                         |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | メソッド | セッションのエンジン状態を初期化します。エンジンがセッションを初めて見るときに 1 回呼び出されます (例: 履歴のインポート)。                   |
| `maintain(params)`             | メソッド | ブートストラップ後、成功したターン後、または Compaction 後のトランスクリプトメンテナンス。安全な書き換えには `runtimeContext.rewriteTranscriptEntries()` を使用します。 |
| `ingestBatch(params)`          | メソッド | 完了したターンをバッチとして取り込みます。実行完了後に、そのターンのすべてのメッセージをまとめて受け取って呼び出されます。                 |
| `afterTurn(params)`            | メソッド | 実行後のライフサイクル作業 (状態の永続化、バックグラウンド Compaction のトリガー)。                                                        |
| `prepareSubagentSpawn(params)` | メソッド | 子セッションが開始する前に共有状態を設定します。                                                                                            |
| `onSubagentEnded(params)`      | メソッド | サブエージェント終了後にクリーンアップします。                                                                                              |
| `dispose()`                    | メソッド | リソースを解放します。Gateway シャットダウン中または Plugin リロード中に呼び出されます。セッションごとではありません。                    |

### ランタイム設定

OpenClaw 内で実行されるライフサイクルフックは、任意の
`runtimeSettings` オブジェクトを受け取ります。これは、バージョン付きの読み取り専用内部
producer/consumer API サーフェスです。OpenClaw が選択されたコンテキストエンジン向けに生成し、コンテキストエンジンがライフサイクルフック内で消費します。ユーザーに直接表示されることはなく、専用のレポートサーフェスも作成しません。

- `schemaVersion`: 現在は `1`
- `runtime`: OpenClaw ホスト、ランタイムモード (`normal`、`fallback`、または
  `degraded`)、および任意のハーネス/ランタイム ID
- `contextEngineSelection`: 選択されたコンテキストエンジン ID と選択元
- `executionHost`: フックを呼び出しているサーフェスのホスト ID とラベル
- `model`: 要求されたモデル、解決済みモデル、プロバイダー、および任意のモデルファミリー
- `limits`: 既知の場合のプロンプトトークン予算と最大出力トークン
- `diagnostics`: 既知の場合のクローズドなフォールバックおよび degraded 理由コード

不明になり得るフィールドは `null` として表されます。ランタイムモードや選択元などの判別子フィールドは非 nullable のままです。古いエンジンも互換性を保ちます。厳密な legacy エンジンが `runtimeSettings` を未知のプロパティとして拒否した場合、OpenClaw はエンジンを隔離するのではなく、それなしでライフサイクル呼び出しを再試行します。

### ホスト要件

コンテキストエンジンは、`info.hostRequirements` でホスト機能要件を宣言できます。
OpenClaw は操作を開始する前にこれらの要件を確認し、選択されたランタイムがそれらを満たせない場合は、説明的なエラーでフェイルクローズします。

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

ネイティブ Codex と OpenClaw 組み込みエージェント実行は `assemble-before-prompt` を満たします。
汎用 CLI バックエンドは満たさないため、それを要求するエンジンは CLI プロセスの開始前に拒否されます。

### 失敗の分離

OpenClaw は、選択された Plugin エンジンをコアの返信パスから分離します。非レガシーエンジンが見つからない、コントラクト検証に失敗する、ファクトリ作成中に例外を投げる、またはライフサイクルメソッドから例外を投げる場合、OpenClaw は現在の Gateway プロセスでそのエンジンを隔離し、コンテキストエンジン作業を組み込みの `legacy` エンジンにダウングレードします。エラーは失敗した操作とともにログに記録されるため、オペレーターはエージェントが沈黙することなく Plugin を修復、更新、または無効化できます。

ホスト要件の失敗は異なります。エンジンがランタイムに必須機能が欠けていると宣言した場合、OpenClaw は実行を開始する前にフェイルクローズします。これにより、サポートされていないホストで実行すると状態を破損する可能性があるエンジンを保護します。

### ownsCompaction

`ownsCompaction` は、OpenClaw ランタイムの組み込み試行内自動 Compaction を、その実行で有効のままにするかどうかを制御します。

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    エンジンが Compaction 動作を所有します。OpenClaw は、その実行について OpenClaw ランタイムの組み込み自動 Compaction と汎用のプロンプト前オーバーフロー事前チェックを無効にし、エンジンの `compact()` 実装が `/compact`、プロバイダーのオーバーフロー復旧 Compaction、および `afterTurn()` で実行したい任意のプロアクティブな Compaction を担当します。エンジンが `assemble()` から `promptAuthority: "preassembly_may_overflow"` を返す場合、OpenClaw は引き続きプロンプト前オーバーフロー保護を実行します。
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    OpenClaw ランタイムの組み込み自動 Compaction はプロンプト実行中に引き続き実行される場合がありますが、アクティブなエンジンの `compact()` メソッドは `/compact` とオーバーフロー復旧について引き続き呼び出されます。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` は、OpenClaw がレガシーエンジンの Compaction パスへ自動的にフォールバックすることを意味**しません**。
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

no-op の `compact()` は、アクティブな非所有エンジンにとって安全ではありません。そのエンジンスロットの通常の `/compact` とオーバーフロー復旧 Compaction パスを無効にしてしまうためです。

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
スロットは実行時に排他的です。特定の実行または Compaction 操作に対して解決される登録済みコンテキストエンジンは 1 つだけです。他の有効な `kind: "context-engine"` Plugin は引き続き読み込まれ、登録コードを実行できます。`plugins.slots.contextEngine` は、OpenClaw がコンテキストエンジンを必要とするときに解決する登録済みエンジン ID だけを選択します。
</Note>

<Note>
**Plugin のアンインストール:** 現在 `plugins.slots.contextEngine` として選択されている Plugin をアンインストールすると、OpenClaw はスロットをデフォルト (`legacy`) にリセットします。同じリセット動作は `plugins.slots.memory` にも適用されます。手動で設定を編集する必要はありません。
</Note>

## Compaction とメモリとの関係

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction はコンテキストエンジンの責務の 1 つです。レガシーエンジンは OpenClaw の組み込み要約に委譲します。Plugin エンジンは任意の Compaction 戦略 (DAG 要約、ベクトル検索など) を実装できます。
  </Accordion>
  <Accordion title="メモリ Plugin">
    メモリ Plugin (`plugins.slots.memory`) はコンテキストエンジンとは別のものです。メモリ Plugin は検索/取得を提供し、コンテキストエンジンはモデルに見せる内容を制御します。これらは連携できます。コンテキストエンジンはアセンブリ中にメモリ Plugin のデータを使用する場合があります。アクティブなメモリプロンプトパスを使いたい Plugin エンジンは、`openclaw/plugin-sdk/core` の `buildMemorySystemPromptAddition(...)` を優先して使うべきです。これはアクティブなメモリプロンプトセクションを、先頭に追加できる `systemPromptAddition` に変換します。エンジンがより低レベルの制御を必要とする場合は、`openclaw/plugin-sdk/memory-host-core` から `buildActiveMemoryPromptSection(...)` 経由で生の行を取得することもできます。
  </Accordion>
  <Accordion title="セッションの刈り込み">
    古いツール結果をメモリ内でトリミングする処理は、どのコンテキストエンジンがアクティブかに関係なく引き続き実行されます。
  </Accordion>
</AccordionGroup>

## ヒント

- `openclaw doctor` を使用して、エンジンが正しく読み込まれていることを確認します。
- エンジンを切り替える場合、既存のセッションは現在の履歴を使い続けます。新しいエンジンは将来の実行から引き継ぎます。
- エンジンエラーはログに記録され、選択された Plugin エンジンは現在の Gateway プロセスで隔離されます。OpenClaw はユーザーターンについて `legacy` にフォールバックするため返信は継続できますが、壊れた Plugin は修復、更新、無効化、またはアンインストールする必要があります。
- 開発時は、`openclaw plugins install -l ./my-engine` を使用して、ローカル Plugin ディレクトリをコピーせずにリンクします。

## 関連

- [Compaction](/ja-JP/concepts/compaction) - 長い会話の要約
- [コンテキスト](/ja-JP/concepts/context) - エージェントターンのコンテキスト構築方法
- [Plugin アーキテクチャ](/ja-JP/plugins/architecture) - コンテキストエンジン Plugin の登録
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - Plugin マニフェストフィールド
- [Plugins](/ja-JP/tools/plugin) - Plugin の概要
