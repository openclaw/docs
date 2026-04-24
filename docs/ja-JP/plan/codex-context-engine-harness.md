---
read_when:
    - |-
      Codexハーネスにcontext-engineのライフサイクル動作を組み込んでいる＿日本assistant to=functions.read in commentary  天天中彩票公司 一本道高清无码json
      {"path":"docs/specs/codex-harness-context-engine-port.md","offset":1,"limit":400}
    - lossless-claw または他のcontext-engine Pluginを codex/* 埋め込みハーネスセッションで動作させる必要がある
    - 埋め込みPIとCodex app-serverのコンテキスト動作を比較している
summary: バンドル済みCodex app-serverハーネスがOpenClawのcontext-engine Pluginを尊重するようにするための仕様
title: CodexハーネスのContext Engine移植
x-i18n:
    generated_at: "2026-04-24T05:07:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d6b106915f2888337cb08c831c1722770ad8ec6612c575efe88fe2fc263dec5
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

# CodexハーネスのContext Engine移植

## ステータス

実装仕様ドラフト。

## 目標

バンドル済みのCodex app-serverハーネスが、埋め込みPIターンがすでに尊重しているのと同じOpenClawのcontext-engineライフサイクル契約を尊重するようにする。

`agents.defaults.embeddedHarness.runtime: "codex"` または
`codex/*` モデルを使うセッションでも、`lossless-claw` のような選択されたcontext-engine Pluginが、Codex app-server境界が許す範囲で、コンテキスト組み立て、ターン後の取り込み、メンテナンス、OpenClawレベルのCompactionポリシーを制御できるようにする。

## 非目標

- Codex app-server内部を再実装しない。
- CodexネイティブのスレッドCompactionに、lossless-clawの要約を生成させない。
- Codex以外のモデルにCodexハーネスの使用を要求しない。
- ACP/acpxセッションの動作を変更しない。この仕様は、非ACPの埋め込みagentハーネス経路専用である。
- サードパーティPluginにCodex app-server拡張ファクトリの登録をさせない。既存のバンドル済みPluginの信頼境界はそのまま維持する。

## 現在のアーキテクチャ

埋め込み実行ループは、具体的な低レベルハーネスを選択する前に、実行ごとに一度だけ設定されたcontext engineを解決する。

- `src/agents/pi-embedded-runner/run.ts`
  - context-engine Pluginを初期化する
  - `resolveContextEngine(params.config)` を呼ぶ
  - `contextEngine` と `contextTokenBudget` を
    `runEmbeddedAttemptWithBackend(...)` に渡す

`runEmbeddedAttemptWithBackend(...)` は、選択されたagentハーネスに処理を委譲する。

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex app-serverハーネスは、バンドル済みCodex Pluginによって登録される。

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Codexハーネス実装は、PIバックエンドのattemptと同じ `EmbeddedRunAttemptParams` を受け取る。

- `extensions/codex/src/app-server/run-attempt.ts`

つまり、必要なフックポイントはOpenClawが制御するコード内にある。外部境界はCodex app-serverプロトコル自体である。OpenClawは `thread/start`、`thread/resume`、`turn/start` に送る内容を制御でき、通知も観測できるが、Codexの内部スレッドストアやネイティブCompactorは変更できない。

## 現在のギャップ

埋め込みPI attemptは、context-engineライフサイクルを直接呼び出している。

- attempt前のbootstrap/maintenance
- モデル呼び出し前のassemble
- attempt後の afterTurn または ingest
- 成功したターン後のmaintenance
- Compactionを所有するengine向けのcontext-engine Compaction

関連するPIコード:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex app-server attemptは現在、汎用agent-harnessフックを実行し、トランスクリプトをミラーするが、`params.contextEngine.bootstrap`、`params.contextEngine.assemble`、`params.contextEngine.afterTurn`、`params.contextEngine.ingestBatch`、`params.contextEngine.ingest`、`params.contextEngine.maintain` を呼び出していない。

関連するCodexコード:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## 望ましい動作

Codexハーネスのターンでは、OpenClawは次のライフサイクルを維持するべきである。

1. ミラーされたOpenClawセッショントランスクリプトを読む。
2. 以前のセッションファイルが存在する場合、アクティブなcontext engineをbootstrapする。
3. 利用可能ならbootstrap maintenanceを実行する。
4. アクティブなcontext engineを使ってコンテキストをassembleする。
5. assembleされたコンテキストをCodex互換の入力へ変換する。
6. context-engineの `systemPromptAddition` を含むdeveloper instructionsでCodexスレッドを開始または再開する。
7. assembleされたユーザー向けプロンプトでCodexターンを開始する。
8. Codexの結果をOpenClawトランスクリプトへミラーし戻す。
9. 実装されていれば `afterTurn` を呼び、そうでなければミラー済みトランスクリプトスナップショットを使って `ingestBatch` / `ingest` を呼ぶ。
10. 中断されていない成功ターンの後にturn maintenanceを実行する。
11. CodexネイティブのCompactionシグナルとOpenClawのCompactionフックを維持する。

## 設計上の制約

### Codex app-serverはネイティブスレッド状態の正規ソースのままである

Codexは、自身のネイティブスレッドと内部の拡張履歴を所有する。OpenClawは、サポートされたプロトコル呼び出し以外でapp-serverの内部履歴を変更しようとしてはならない。

OpenClawのトランスクリプトミラーは、OpenClaw機能のためのソースのままである。

- チャット履歴
- 検索
- `/new` と `/reset` の記録管理
- 将来のモデルまたはハーネス切り替え
- context-engine Plugin状態

### context engine assemblyはCodex入力へ投影されなければならない

context-engineインターフェースは、CodexスレッドパッチではなくOpenClawの `AgentMessage[]` を返す。Codex app-serverの `turn/start` は現在のユーザー入力を受け取り、一方で `thread/start` と `thread/resume` はdeveloper instructionsを受け取る。

したがって、実装には投影レイヤーが必要である。安全な最初の版では、Codex内部履歴を置き換えられるふりを避けるべきである。代わりに、assembleされたコンテキストを、現在のターンの前後にある決定的なプロンプト/developer-instruction素材として注入するべきである。

### prompt-cacheの安定性が重要

lossless-clawのようなengineでは、入力が変わらない限りassembleされたコンテキストは決定的であるべきだ。生成されるコンテキストテキストに、タイムスタンプ、ランダムID、または非決定的な順序を加えてはならない。

### PIフォールバックのセマンティクスは変わらない

ハーネス選択は現状のままである。

- `runtime: "pi"` はPIを強制する
- `runtime: "codex"` は登録済みCodexハーネスを選択する
- `runtime: "auto"` はPluginハーネスにサポート対象providerのclaimを許す
- `fallback: "none"` は、Pluginハーネスが一致しない場合のPIフォールバックを無効にする

この作業が変更するのは、Codexハーネスが選択された後に何が起きるかである。

## 実装計画

### 1. 再利用可能なcontext-engine attemptヘルパーをエクスポートまたは移設する

現在、再利用可能なライフサイクルヘルパーはPI runner配下にある。

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codexは、可能であればPIを意味する名前の実装パスからimportすべきではない。

ハーネス中立なモジュールを新設する。例:

- `src/agents/harness/context-engine-lifecycle.ts`

移動または再エクスポートするもの:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- `runContextEngineMaintenance` の小さなラッパー

古いファイルから再エクスポートするか、同じPR内でPIの呼び出し箇所を更新することで、PIのimportは引き続き動作させる。

中立ヘルパー名にはPIを含めないこと。

推奨される名前:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Codexコンテキスト投影ヘルパーを追加する

新しいモジュールを追加する:

- `extensions/codex/src/app-server/context-engine-projection.ts`

責務:

- assembleされた `AgentMessage[]`、元のミラー履歴、現在のプロンプトを受け取る。
- どのコンテキストをdeveloper instructionsに入れ、どれを現在のユーザー入力に入れるかを決定する。
- 現在のユーザープロンプトを最後の実行可能な要求として保持する。
- 以前のメッセージを安定した明示的形式でレンダリングする。
- 揮発性のメタデータを避ける。

提案API:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

推奨される最初の投影:

- `systemPromptAddition` をdeveloper instructionsに入れる。
- assembleされたトランスクリプトコンテキストを、現在のプロンプトの前に `promptText` へ入れる。
- それがOpenClaw assembleコンテキストであることを明確にラベル付けする。
- 現在のプロンプトを最後に置く。
- 現在のユーザープロンプトが末尾にすでに現れている場合は重複を除外する。

プロンプト形状の例:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

これはネイティブCodex履歴操作ほど洗練されてはいないが、OpenClaw内で実装可能であり、context-engineのセマンティクスを保持する。

将来の改善: Codex app-serverがスレッド履歴の置換または補足のためのプロトコルを公開したら、この投影レイヤーをそのAPIを使うよう差し替える。

### 3. Codexスレッド起動前にbootstrapを組み込む

`extensions/codex/src/app-server/run-attempt.ts` にて:

- 現在と同様に、ミラーされたセッション履歴を読む。
- この実行前にセッションファイルが存在していたかを判断する。ミラー書き込み前に `fs.stat(params.sessionFile)` を確認するヘルパーを推奨する。
- ヘルパーが必要とする場合は `SessionManager` を開くか、狭いsession manager adapterを使う。
- `params.contextEngine` が存在する場合、中立bootstrapヘルパーを呼ぶ。

擬似フロー:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

Codex tool bridgeとトランスクリプトミラーと同じ `sessionKey` 規約を使う。現在Codexは `params.sessionKey` または `params.sessionId` から `sandboxSessionKey` を計算している。rawの `params.sessionKey` を保持する理由がない限り、それを一貫して使う。

### 4. `thread/start` / `thread/resume` と `turn/start` の前にassembleを組み込む

`runCodexAppServerAttempt` にて:

1. まず動的ツールを構築する。これによりcontext engineは実際に利用可能なツール名を確認できる。
2. ミラーされたセッション履歴を読む。
3. `params.contextEngine` が存在する場合、context-engineの `assemble(...)` を実行する。
4. assemble結果を次へ投影する:
   - developer instruction addition
   - `turn/start` 用のprompt text

既存のフック呼び出し:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

は、context-awareにすべきである:

1. `buildDeveloperInstructions(params)` でベースdeveloper instructionsを計算する
2. context-engine assembly/projectionを適用する
3. 投影済みのprompt/developer instructionsで `before_prompt_build` を実行する

この順序により、汎用promptフックはCodexが受け取るのと同じpromptを見られる。厳密なPI整合性が必要なら、フック合成の前にcontext-engine assemblyを実行する。PIはcontext-engineの `systemPromptAddition` を、promptパイプライン後の最終system promptに適用するためである。重要な不変条件は、context engineとフックの両方が、決定的で文書化された順序を持つことだ。

最初の実装で推奨される順序:

1. `buildDeveloperInstructions(params)`
2. context-engine `assemble()`
3. `systemPromptAddition` をdeveloper instructionsへappend/prependする
4. assembleされたメッセージをprompt textへ投影する
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. 最終developer instructionsを `startOrResumeThread(...)` に渡す
7. 最終prompt textを `buildTurnStartParams(...)` に渡す

この仕様はテストで固定し、将来の変更で誤って順序が変わらないようにするべきである。

### 5. prompt-cacheの安定フォーマットを維持する

投影ヘルパーは、同一入力に対してバイト単位で安定した出力を生成しなければならない:

- 安定したメッセージ順序
- 安定したroleラベル
- 生成タイムスタンプなし
- オブジェクトキー順序の漏えいなし
- ランダムな区切り文字なし
- 実行ごとのIDなし

固定の区切りと明示的なセクションを使うこと。

### 6. トランスクリプトミラー後にpost-turnを組み込む

Codexの `CodexAppServerEventProjector` は、現在のターン向けにローカルな `messagesSnapshot` を構築します。`mirrorTranscriptBestEffort(...)` は、そのスナップショットをOpenClawのトランスクリプトミラーに書き込みます。

ミラーが成功したか失敗したかにかかわらず、利用可能な最良のメッセージスナップショットでcontext-engine finalizerを呼び出します:

- `afterTurn` は現在のターンだけでなくセッション全体のスナップショットを期待するため、書き込み後の完全なミラー済みセッションコンテキストを優先する。
- セッションファイルを再オープンできない場合は `historyMessages + result.messagesSnapshot` にフォールバックする。

擬似フロー:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

ミラーが失敗しても、フォールバックスナップショットで `afterTurn` を呼び出す。ただし、そのcontext engineがフォールバックのターンデータから取り込みを行っていることをログに残す。

### 7. usageとprompt-cacheランタイムコンテキストを正規化する

Codex結果には、利用可能な場合、app-serverのトークン通知からの正規化済みusageが含まれます。そのusageをcontext-engineランタイムコンテキストへ渡します。

Codex app-serverが将来cache read/write詳細を公開した場合は、それを `ContextEnginePromptCacheInfo` にマッピングします。それまでは、0を捏造するのではなく `promptCache` を省略します。

### 8. Compactionポリシー

Compactionシステムは2つある:

1. OpenClaw context-engine の `compact()`
2. Codex app-serverネイティブの `thread/compact/start`

これらを黙って混同してはならない。

#### `/compact` と明示的なOpenClaw Compaction

選択されたcontext engineが `info.ownsCompaction === true` を持つ場合、明示的なOpenClaw Compactionは、OpenClawトランスクリプトミラーとPlugin状態に対して、context engineの `compact()` 結果を優先すべきである。

選択されたCodexハーネスにネイティブスレッドbindingがある場合、app-serverスレッドを健全に保つためにCodexネイティブCompactionを追加で要求してもよいが、これはdetails内で別個のバックエンドアクションとして報告しなければならない。

推奨動作:

- `contextEngine.info.ownsCompaction === true` の場合:
  - 最初にcontext-engineの `compact()` を呼ぶ
  - 次に、スレッドbindingが存在すればベストエフォートでCodexネイティブCompactionを呼ぶ
  - context-engineの結果を主要結果として返す
  - CodexネイティブCompactionの状態を `details.codexNativeCompaction` に含める
- アクティブなcontext engineがCompactionを所有しない場合:
  - 現在のCodexネイティブCompaction動作を維持する

これは、`maybeCompactAgentHarnessSession(...)` がどこから呼ばれているかに応じて、`extensions/codex/src/app-server/compact.ts` の変更、または汎用Compaction経路からのラップが必要になる可能性が高い。

#### ターン中のCodexネイティブcontextCompactionイベント

Codexはターン中に `contextCompaction` itemイベントを送出する場合がある。`event-projector.ts` における現在のbefore/after compactionフック送出は維持するが、これを完了済みのcontext-engine Compactionとして扱ってはならない。

Compactionを所有するengineについては、それにもかかわらずCodexがネイティブCompactionを実行したときに、明示的な診断を送出する:

- stream/event name: 既存の `compaction` streamでよい
- details: `{ backend: "codex-app-server", ownsCompaction: true }`

これにより、この分離を監査可能にする。

### 9. セッションリセットとbinding動作

既存のCodexハーネスの `reset(...)` は、OpenClawセッションファイルからCodex app-server bindingをクリアする。この動作は維持する。

また、context-engine状態のクリーンアップが、既存のOpenClawセッションライフサイクル経路を通じて引き続き行われることも確認する。現在のcontext-engineライフサイクルが全ハーネスに対するreset/deleteイベントを取りこぼしていない限り、Codex固有のクリーンアップを追加しない。

### 10. エラーハンドリング

PIのセマンティクスに従う:

- bootstrap失敗は警告して続行する
- assemble失敗は警告し、assembleされていないパイプラインメッセージ/プロンプトへフォールバックする
- afterTurn/ingest失敗は警告し、ポストターンfinalizationを失敗扱いにする
- maintenanceは、成功し、中断されず、yieldでも中断されていないターンの後でのみ実行する
- Compactionエラーを、新しいプロンプトとして再試行してはならない

Codex固有の追加:

- context projectionに失敗した場合は警告し、元のプロンプトへフォールバックする。
- トランスクリプトミラーに失敗しても、フォールバックメッセージでcontext-engine finalizationを試みる。
- context-engine Compaction成功後にCodexネイティブCompactionが失敗しても、context engineが主要である場合はOpenClaw全体のCompactionを失敗させない。

## テスト計画

### ユニットテスト

`extensions/codex/src/app-server` 配下にテストを追加する:

1. `run-attempt.context-engine.test.ts`
   - セッションファイルが存在する場合、Codexが `bootstrap` を呼ぶ。
   - Codexが、ミラーメッセージ、token budget、tool names、
     citations mode、model id、promptを使って `assemble` を呼ぶ。
   - `systemPromptAddition` がdeveloper instructionsに含まれる。
   - assembleされたメッセージが、現在のリクエストの前にプロンプトへ投影される。
   - Codexが、トランスクリプトミラー後に `afterTurn` を呼ぶ。
   - `afterTurn` がない場合、Codexが `ingestBatch` またはメッセージごとの `ingest` を呼ぶ。
   - ターンmaintenanceが成功ターン後に実行される。
   - prompt error、abort、yield abortではターンmaintenanceが実行されない。

2. `context-engine-projection.test.ts`
   - 同一入力に対して安定した出力
   - assemble履歴に現在のプロンプトが含まれている場合、現在のプロンプトが重複しない
   - 空履歴を扱える
   - role順序を保持する
   - system prompt additionをdeveloper instructionsにのみ含める

3. `compact.context-engine.test.ts`
   - Compactionを所有するcontext engineの主要結果が勝つ
   - CodexネイティブCompactionも試みた場合、その状態がdetailsに現れる
   - Codexネイティブの失敗で、Compactionを所有するcontext-engine Compactionが失敗しない
   - Compactionを所有しないcontext engineでは、現在のネイティブCompaction動作が維持される

### 更新が必要な既存テスト

- `extensions/codex/src/app-server/run-attempt.test.ts` があればそれ、なければ最も近いCodex app-server実行テスト。
- Compactionイベント詳細が変わる場合のみ `extensions/codex/src/app-server/event-projector.test.ts`。
- 設定動作が変わらない限り、`src/agents/harness/selection.test.ts` は変更不要のはずである。安定したままであるべき。
- PIのcontext-engineテストは変更なしで通り続けるべき。

### 統合 / ライブテスト

ライブCodexハーネスのスモークテストを追加または拡張する:

- `plugins.slots.contextEngine` をテストengineに設定する
- `agents.defaults.model` を `codex/*` モデルに設定する
- `agents.defaults.embeddedHarness.runtime = "codex"` を設定する
- テストengineが次を観測したことを確認する:
  - bootstrap
  - assemble
  - afterTurn または ingest
  - maintenance

OpenClaw coreテストでlossless-clawを必須にしないこと。リポジトリ内の小さなフェイクcontext engine pluginを使う。

## 観測性

Codex context-engineライフサイクル呼び出しの周囲にデバッグログを追加する:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` と理由
- `codex native compaction completed alongside context-engine compaction`

完全なプロンプトやトランスクリプト内容はログに出さないこと。

有用な場合は構造化フィールドを追加する:

- `sessionId`
- 既存のログ方針に従ってredactまたは省略された `sessionKey`
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## 移行 / 互換性

これは後方互換であるべき:

- context engineが設定されていない場合、従来のcontext engine動作は現在のCodexハーネス動作と同等であるべき。
- context-engineの `assemble` が失敗した場合、Codexは元のプロンプト経路で続行するべき。
- 既存のCodexスレッドbindingは引き続き有効であるべき。
- 動的ツールfingerprintingにcontext-engine出力を含めてはならない。そうしないと、コンテキストが変わるたびに新しいCodexスレッドが強制される可能性がある。動的ツールfingerprintに影響するのはツールカタログだけであるべき。

## 未解決の質問

1. assembleされたコンテキストは、完全にユーザープロンプトへ注入すべきか、完全にdeveloper instructionsへ注入すべきか、それとも分割すべきか。

   推奨: 分割する。`systemPromptAddition` はdeveloper instructionsへ、assembleされたトランスクリプトコンテキストはユーザープロンプトラッパーへ入れる。これはネイティブスレッド履歴を変更せずに、現在のCodexプロトコルに最もよく合う。

2. context engineがCompactionを所有している場合、CodexネイティブCompactionを無効化すべきか。

   推奨: 少なくとも初期段階ではしない。CodexネイティブCompactionは、app-serverスレッドを生かし続けるために依然必要かもしれない。しかし、それはcontext-engine Compactionではなく、ネイティブCodex Compactionとして報告しなければならない。

3. `before_prompt_build` はcontext-engine assemblyの前に実行すべきか後に実行すべきか。

   推奨: Codexではcontext-engine projectionの後。そうすることで汎用ハーネスフックは、Codexが実際に受け取るprompt/developer instructionsを確認できる。PI整合性のために逆が必要なら、選択した順序をテストに固定し、ここに文書化する。

4. Codex app-serverは、将来、構造化されたコンテキスト/履歴上書きを受け入れられるか。

   不明。可能なら、テキスト投影レイヤーをそのプロトコルへ置き換え、ライフサイクル呼び出しは変更しない。

## 受け入れ基準

- `codex/*` 埋め込みハーネスターンが、選択されたcontext engineのassembleライフサイクルを呼び出す。
- context-engineの `systemPromptAddition` がCodex developer instructionsに影響する。
- assembleされたコンテキストが、決定的な形でCodexターン入力に影響する。
- 成功したCodexターンが `afterTurn` またはingestフォールバックを呼ぶ。
- 成功したCodexターンがcontext-engineのターンmaintenanceを実行する。
- 失敗/中断/yield-abortedのターンではターンmaintenanceを実行しない。
- context-engineが所有するCompactionが、OpenClaw/Plugin状態に対して主要のままである。
- CodexネイティブCompactionが、ネイティブCodex動作として監査可能なままである。
- 既存のPI context-engine動作は変わらない。
- 非legacy context engineが選択されていない場合、またはassemblyが失敗した場合、既存のCodexハーネス動作は変わらない。
