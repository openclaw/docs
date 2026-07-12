---
read_when:
    - OpenClaw がモデルコンテキストをどのように構成するかを理解したい場合
    - レガシーエンジンとPluginエンジンを切り替えています
    - コンテキストエンジンのPluginを構築しています
sidebarTitle: Context engine
summary: コンテキストエンジン：プラグイン可能なコンテキスト構築、Compaction、サブエージェントのライフサイクル
title: コンテキストエンジン
x-i18n:
    generated_at: "2026-07-12T14:24:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 05cb5eb01f002001354dc63b77cdb86f3e9f3bc51722bd943ac20c9e1566dc60
    source_path: concepts/context-engine.md
    workflow: 16
---

**コンテキストエンジン**は、各実行で OpenClaw がモデルコンテキストを構築する方法を制御します。含めるメッセージ、古い履歴を要約する方法、サブエージェント境界をまたいでコンテキストを管理する方法を決定します。

OpenClaw には組み込みの `legacy` エンジンが付属しており、デフォルトで使用されます。アセンブリ、Compaction、またはセッションをまたぐ想起の動作を変更したい場合にのみ、Plugin エンジンをインストールして選択してください。

## クイックスタート

<Steps>
  <Step title="アクティブなエンジンを確認する">
    ```bash
    openclaw doctor
    # または設定を直接確認します:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Plugin エンジンをインストールする">
    コンテキストエンジン Plugin は、他の OpenClaw Plugin と同じ方法でインストールします。

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
          contextEngine: "lossless-claw", // Plugin に登録されたエンジン ID と一致する必要があります
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin 固有の設定をここに記述します（Plugin のドキュメントを参照）
          },
        },
      },
    }
    ```

    インストールと設定の完了後、Gateway を再起動します。

  </Step>
  <Step title="legacy に戻す（任意）">
    `contextEngine` を `"legacy"` に設定します（またはキーを完全に削除します。`"legacy"` がデフォルトです）。
  </Step>
</Steps>

## 仕組み

OpenClaw がモデルプロンプトを実行するたびに、コンテキストエンジンはライフサイクルの 4 つの時点で処理に参加します。

<AccordionGroup>
  <Accordion title="1. 取り込み">
    セッションに新しいメッセージが追加されたときに呼び出されます。エンジンは、独自のデータストアにメッセージを保存したり、インデックスを作成したりできます。
  </Accordion>
  <Accordion title="2. アセンブル">
    各モデル実行の前に呼び出されます。エンジンは、トークン予算内に収まる順序付きのメッセージセット（および任意の `systemPromptAddition`）を返します。
  </Accordion>
  <Accordion title="3. Compact">
    コンテキストウィンドウがいっぱいになったとき、またはユーザーが `/compact` を実行したときに呼び出されます。エンジンは、空き領域を確保するために古い履歴を要約します。
  </Accordion>
  <Accordion title="4. ターン後">
    実行の完了後に呼び出されます。エンジンは、状態の永続化、バックグラウンド Compaction の開始、またはインデックスの更新を行えます。
  </Accordion>
</AccordionGroup>

エンジンは、ブートストラップ後、ターンの成功後、または Compaction 後にトランスクリプトを保守するための任意の `maintain()` メソッドも実装できます（`runtimeContext.rewriteTranscriptEntries()` による安全な書き換え）。応答をブロックせず遅延処理として実行するには、`info.turnMaintenanceMode: "background"` を設定します。

バンドルされている非 ACP Codex ハーネスでは、OpenClaw は、アセンブルされたコンテキストを Codex の開発者向け指示と現在のターンのプロンプトに投影することで、同じライフサイクルを適用します。Codex は引き続き、ネイティブのスレッド履歴とネイティブの Compaction 機構を管理します。

### サブエージェントのライフサイクル（任意）

OpenClaw は、任意のサブエージェントライフサイクルフックを 2 つ呼び出します。

<ParamField path="prepareSubagentSpawn" type="method">
  子実行の開始前に、共有コンテキストの状態を準備します。このフックは、親と子のセッションキー、`contextMode`（`isolated` または `fork`）、利用可能なトランスクリプト ID/ファイル、および任意の TTL を受け取ります。ロールバックハンドルを返した場合、準備の成功後にスポーンが失敗すると、OpenClaw がそのハンドルを呼び出します。`lightContext` を要求し、`contextMode="isolated"` に解決されるネイティブなサブエージェントのスポーンでは、このフックを意図的にスキップします。これにより、子はコンテキストエンジンが管理するスポーン前状態を使わず、軽量なブートストラップコンテキストから開始します。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  サブエージェントセッションが完了またはスイープされたときにクリーンアップします。
</ParamField>

### システムプロンプトへの追加

`assemble` メソッドは、`systemPromptAddition` 文字列を返せます。OpenClaw は、これを実行時のシステムプロンプトの先頭に追加します。これによりエンジンは、静的なワークスペースファイルを必要とせずに、動的な想起ガイダンス、検索指示、またはコンテキストを考慮したヒントを注入できます。

## legacy エンジン

組み込みの `legacy` エンジンは、OpenClaw の従来の動作を維持します。

- **取り込み**: 何もしません（セッションマネージャーがメッセージの永続化を直接処理します）。
- **アセンブル**: そのまま渡します（ランタイム内の既存のサニタイズ → 検証 → 制限パイプラインがコンテキストのアセンブリを処理します）。
- **Compact**: 組み込みの要約 Compaction に委譲します。これは古いメッセージを単一の要約にまとめ、最近のメッセージをそのまま維持します。
- **ターン後**: 何もしません。

legacy エンジンは、ツールを登録せず、`systemPromptAddition` も提供しません。

`plugins.slots.contextEngine` が設定されていない場合（または `"legacy"` に設定されている場合）、このエンジンが自動的に使用されます。

## Plugin エンジン

Plugin は、Plugin API を使用してコンテキストエンジンを登録できます。

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // メッセージをデータストアに保存します
      return { ingested: true };
    },

    async assemble({
      sessionId,
      sessionKey,
      messages,
      tokenBudget,
      availableTools,
      citationsMode,
    }) {
      // 予算内に収まるメッセージを返します
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // 古いコンテキストを要約します
      return { ok: true, compacted: true };
    },
  }));
}
```

ファクトリの `ctx` には、任意の `config`、`agentDir`、`workspaceDir`
の値が含まれるため、Plugin は最初のライフサイクルフックが実行される前に、
エージェントごとまたはワークスペースごとの状態を初期化できます。

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

### ContextEngine インターフェース

必須メンバー:

| メンバー             | 種別     | 目的                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | プロパティ | エンジンの ID、名前、バージョン、および Compaction を所有するかどうか |
| `ingest(params)`   | メソッド   | 単一のメッセージを保存する                                   |
| `assemble(params)` | メソッド   | モデル実行用のコンテキストを構築する（`AssembleResult` を返す） |
| `compact(params)`  | メソッド   | コンテキストを要約または削減する                                 |

`assemble` は、以下を含む `AssembleResult` を返します。

<ParamField path="messages" type="Message[]" required>
  モデルに送信する順序付きメッセージ。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  アセンブルされたコンテキスト内の総トークン数に関するエンジンの推定値。OpenClaw は、Compaction しきい値の判定と診断レポートにこの値を使用します。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  システムプロンプトの先頭に追加されます。
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  ランナーが先行オーバーフロー事前チェックに使用するトークン推定値を制御します。デフォルトは `"assembled"` です。これは、Compaction を所有しないエンジンについて、アセンブルされたプロンプトの推定値だけをチェックすることを意味します。`ownsCompaction: true` を設定したエンジンは独自にプロンプトの受け入れを管理するため、OpenClaw はデフォルトで汎用のプロンプト前事前チェックをスキップします。アセンブルされたビューによって基礎となるトランスクリプト内のオーバーフローリスクが隠れる可能性がある場合にのみ、`"preassembly_may_overflow"` を設定してください。その場合、ランナーは汎用の事前チェックを有効なまま維持し、先行して Compact するかどうかを判断するときに、アセンブルされた推定値と、アセンブル前の（ウィンドウ化されていない）セッション履歴の推定値のうち大きい方を使用します。どちらの場合でも、返したメッセージがモデルに表示される内容であることに変わりはありません。`promptAuthority` は事前チェックにのみ影響します。
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  永続的なバックエンドスレッドを持つホスト（Codex app-server など）のための任意の投影ライフサイクルです。安定した `epoch` とともに `mode: "thread_bootstrap"` を指定すると、ホストはアセンブルされたコンテキストを epoch ごとに 1 回注入し、毎ターン再投影するのではなく、epoch が変わるまでバックエンドスレッドを再利用します。通常のターンごとの投影では、このフィールドを省略します。
</ParamField>

`compact` は `CompactResult` を返します。Compaction によってアクティブなセッション ID が変更された場合、`result.sessionTarget`（セッション ID とストアスコープを保持する型付きの `ContextEngineSessionTarget`）が、次の再試行またはターンで使用する必要がある後継セッションを示します。`result.sessionId` は後継 ID を反映します。

任意のメンバー:

| メンバー                         | 種別   | 目的                                                                                                                                      |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | メソッド | セッションのエンジン状態を初期化します。エンジンがセッションを初めて認識したときに 1 回呼び出されます（履歴のインポートなど）。                              |
| `maintain(params)`             | メソッド | ブートストラップ後、ターンの成功後、または Compaction 後のトランスクリプト保守。安全な書き換えには `runtimeContext.rewriteTranscriptEntries()` を使用します。 |
| `ingestBatch(params)`          | メソッド | 完了したターンをバッチとして取り込みます。実行完了後、そのターンのすべてのメッセージをまとめて渡して呼び出されます。                                  |
| `afterTurn(params)`            | メソッド | 実行後のライフサイクル処理（状態の永続化、バックグラウンド Compaction の開始）。                                                                      |
| `prepareSubagentSpawn(params)` | メソッド | 子セッションの開始前に共有状態を設定します。                                                                                    |
| `onSubagentEnded(params)`      | メソッド | サブエージェントの終了後にクリーンアップします。                                                                                                              |
| `dispose()`                    | メソッド | リソースを解放します。Gateway のシャットダウン時または Plugin の再読み込み時に呼び出され、セッションごとには呼び出されません。                                                        |

### ランタイム設定

OpenClaw 内で実行されるライフサイクルフックは、任意の
`runtimeSettings` オブジェクトを受け取ります。これは、バージョン管理された読み取り専用の内部
プロデューサー/コンシューマー API サーフェスです。OpenClaw が選択されたコンテキスト
エンジン用に生成し、コンテキストエンジンがライフサイクルフック内で使用します。ユーザーに
直接表示されることはなく、専用のレポートサーフェスも作成しません。

- `schemaVersion`: 現在は `1`
- `runtime`: OpenClaw ホスト、ランタイムモード（`normal`、`fallback`、または
  `degraded`）、および任意のハーネス/ランタイム ID
- `contextEngineSelection`: 選択されたコンテキストエンジン ID と選択元
- `executionHost`: フックを呼び出すサーフェスのホスト ID とラベル
- `model`: 要求されたモデル、解決されたモデル、プロバイダー、および任意のモデルファミリー
- `limits`: 判明している場合のプロンプトトークン予算と最大出力トークン数
- `diagnostics`: 判明している場合のクローズドなフォールバックおよびデグレード理由コード

不明となり得るフィールドは `null` として表されます。ランタイムモードや選択元などの判別フィールドは引き続き null 非許容です。古いエンジンとの互換性も維持されます。厳格なレガシーエンジンが `runtimeSettings` を不明なプロパティとして拒否した場合、OpenClaw はそのエンジンを隔離せず、それを除外してライフサイクル呼び出しを再試行します。

### ホスト要件

コンテキストエンジンは、`info.hostRequirements` でホストのケイパビリティ要件を宣言できます。
OpenClaw は操作を開始する前にこれらの要件を確認し、選択されたランタイムが要件を満たせない場合は、
詳細なエラーを表示してフェイルクローズします。

エージェント実行で、エンジンが `assemble()` を通じて実際のモデルプロンプトを制御する必要がある場合は、`assemble-before-prompt` を宣言します。

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "ネイティブ Codex または OpenClaw 組み込みランタイムを使用するか、レガシーコンテキストエンジンを選択してください。",
    },
  },
}
```

ネイティブ Codex および OpenClaw 組み込みエージェント実行は、`assemble-before-prompt` を満たします。
汎用 CLI バックエンドはこれを満たさないため、この機能を必要とするエンジンは CLI プロセスが開始される前に拒否されます。

### 障害の分離

OpenClaw は、選択された Plugin エンジンをコアの応答パスから分離します。非レガシーエンジンが見つからない場合、コントラクト検証に失敗した場合、ファクトリの作成中に例外が発生した場合、またはライフサイクルメソッドから例外が発生した場合、OpenClaw は現在の Gateway プロセスでそのエンジンを隔離し、コンテキストエンジンの処理を組み込みの `legacy` エンジンにダウングレードします。エラーは失敗した操作とともにログに記録されるため、エージェントが応答しなくなることなく、オペレーターは Plugin を修復、更新、または無効化できます。

ホスト要件の不充足は別の扱いになります。エンジンが、ランタイムに必須の機能がないと宣言した場合、OpenClaw は実行を開始する前にフェイルクローズします。これにより、サポートされていないホストで実行すると状態を破損する可能性があるエンジンを保護します。

### ownsCompaction

`ownsCompaction` は、OpenClaw ランタイムに組み込まれた試行中の自動 Compaction を、その実行で有効なままにするかどうかを制御します。

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    エンジンが Compaction の動作を管理します。OpenClaw は、その実行について OpenClaw ランタイムに組み込まれた自動 Compaction と汎用のプロンプト前オーバーフロー事前チェックを無効にします。また、エンジンの `compact()` 実装が、`/compact`、プロバイダーのオーバーフロー回復 Compaction、および `afterTurn()` で実行する任意の予防的 Compaction を担います。エンジンが `assemble()` から `promptAuthority: "preassembly_may_overflow"` を返した場合、OpenClaw は引き続きプロンプト前のオーバーフロー保護機構を実行します。
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    OpenClaw ランタイムに組み込まれた自動 Compaction は、プロンプトの実行中に引き続き動作する可能性がありますが、`/compact` とオーバーフロー回復では、アクティブなエンジンの `compact()` メソッドが引き続き呼び出されます。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` は、OpenClaw が自動的にレガシーエンジンの Compaction パスへフォールバックすることを意味するものでは**ありません**。
</Warning>

つまり、有効なPluginパターンは2つあります。

<Tabs>
  <Tab title="所有モード">
    独自のCompactionアルゴリズムを実装し、`ownsCompaction: true`を設定します。
  </Tab>
  <Tab title="委譲モード">
    `ownsCompaction: false`を設定し、`compact()`から`openclaw/plugin-sdk/core`の`delegateCompactionToRuntime(...)`を呼び出して、OpenClaw組み込みのCompaction動作を使用します。
  </Tab>
</Tabs>

アクティブな非所有エンジンで何も行わない`compact()`を使用するのは安全ではありません。そのエンジンスロットにおける通常の`/compact`およびオーバーフロー復旧用のCompactionパスが無効になるためです。

## 設定リファレンス

```json5
{
  plugins: {
    slots: {
      // アクティブなコンテキストエンジンを選択します。デフォルト: "legacy"。
      // Pluginエンジンを使用するには、Plugin IDを設定します。
      contextEngine: "legacy",
    },
  },
}
```

<Note>
実行時、このスロットは排他的です。特定の実行またはCompaction操作に対して解決される登録済みコンテキストエンジンは1つだけです。有効になっている他の`kind: "context-engine"` Pluginも読み込まれ、登録コードを実行できます。`plugins.slots.contextEngine`は、OpenClawがコンテキストエンジンを必要とするときに、どの登録済みエンジンIDを解決するかだけを選択します。
</Note>

<Note>
**Pluginのアンインストール:** 現在`plugins.slots.contextEngine`で選択されているPluginをアンインストールすると、OpenClawはスロットをデフォルト（`legacy`）に戻します。同じリセット動作が`plugins.slots.memory`にも適用されます。設定を手動で編集する必要はありません。
</Note>

## Compactionおよびメモリとの関係

<AccordionGroup>
  <Accordion title="Compaction">
    Compactionはコンテキストエンジンが担う役割の1つです。レガシーエンジンはOpenClaw組み込みの要約処理に委譲します。Pluginエンジンでは、任意のCompaction戦略（DAG要約、ベクトル検索など）を実装できます。
  </Accordion>
  <Accordion title="メモリPlugin">
    メモリPlugin（`plugins.slots.memory`）はコンテキストエンジンとは別のものです。メモリPluginは検索と取得を提供し、コンテキストエンジンはモデルに何を提示するかを制御します。両者は連携できます。たとえば、コンテキストエンジンは組み立て時にメモリPluginのデータを使用できます。アクティブなメモリプロンプトパスを使用するPluginエンジンでは、`openclaw/plugin-sdk/core`の`buildMemorySystemPromptAddition(...)`を優先してください。これは、アクティブなメモリプロンプトセクションを、先頭に追加できる`systemPromptAddition`へ変換します。エンジンでより低レベルの制御が必要な場合は、引き続き`buildActiveMemoryPromptSection(...)`を介して`openclaw/plugin-sdk/memory-host-core`から未加工の行を取得できます。
  </Accordion>
  <Accordion title="セッションの刈り込み">
    メモリ内の古いツール結果のトリミングは、どのコンテキストエンジンがアクティブであっても引き続き実行されます。
  </Accordion>
</AccordionGroup>

## ヒント

- エンジンが正しく読み込まれていることを確認するには、`openclaw doctor`を使用します。
- エンジンを切り替えても、既存のセッションでは現在の履歴が引き続き使用されます。新しいエンジンは今後の実行から引き継ぎます。
- エンジンエラーはログに記録され、選択されたPluginエンジンは現在のGatewayプロセスで隔離されます。返信を継続できるように、OpenClawはユーザーターンで`legacy`にフォールバックしますが、問題のあるPluginを修復、更新、無効化、またはアンインストールする必要があります。
- 開発時には、`openclaw plugins install -l ./my-engine`を使用すると、ローカルのPluginディレクトリをコピーせずにリンクできます。

## 関連項目

- [Compaction](/ja-JP/concepts/compaction) - 長い会話の要約
- [コンテキスト](/ja-JP/concepts/context) - エージェントターンのコンテキストが構築される仕組み
- [Pluginアーキテクチャ](/ja-JP/plugins/architecture) - コンテキストエンジンPluginの登録
- [Pluginマニフェスト](/ja-JP/plugins/manifest) - Pluginマニフェストのフィールド
- [Plugin](/ja-JP/tools/plugin) - Pluginの概要
