---
read_when:
    - context-engine のライフサイクル動作を Codex ハーネスに組み込んでいます
    - codex/* の埋め込みハーネスセッションを扱うには、lossless-claw または別のコンテキストエンジン Plugin が必要です
    - 組み込み PI と Codex アプリサーバーのコンテキスト動作を比較しています
summary: バンドルされた Codex app-server ハーネスに OpenClaw context-engine Plugin を反映させるための仕様
title: Codex ハーネスのコンテキストエンジン移植
x-i18n:
    generated_at: "2026-05-03T05:00:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6575c25973d43c04cada6157e39c52ea5ad1cc60171cf801fe36cbb9c54c9237
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## ステータス

ドラフト実装仕様。

## 目標

バンドルされた Codex app-server ハーネスが、組み込み PI ターンですでに遵守しているものと同じ OpenClaw コンテキストエンジンのライフサイクル契約を尊重するようにする。

`agents.defaults.embeddedHarness.runtime: "codex"` または `codex/*` モデルを使用するセッションでも、`lossless-claw` など選択されたコンテキストエンジン Plugin が、Codex app-server 境界で可能な範囲で、コンテキストの組み立て、ターン後の取り込み、メンテナンス、OpenClaw レベルの Compaction ポリシーを引き続き制御できるようにする。

## 非目標

- Codex app-server の内部を再実装しない。
- Codex ネイティブスレッドの Compaction が lossless-claw サマリーを生成するようにはしない。
- 非 Codex モデルに Codex ハーネスの使用を要求しない。
- ACP/acpx セッションの動作を変更しない。この仕様は非 ACP の組み込みエージェントハーネス経路のみを対象とする。
- サードパーティ Plugin が Codex app-server 拡張ファクトリを登録できるようにはしない。既存のバンドル Plugin の信頼境界は変更しない。

## 現在のアーキテクチャ

組み込み実行ループは、具体的な低レベルハーネスを選択する前に、実行ごとに構成済みのコンテキストエンジンを一度解決する。

- `src/agents/pi-embedded-runner/run.ts`
  - コンテキストエンジン Plugin を初期化する
  - `resolveContextEngine(params.config)` を呼び出す
  - `contextEngine` と `contextTokenBudget` を `runEmbeddedAttemptWithBackend(...)` に渡す

`runEmbeddedAttemptWithBackend(...)` は選択されたエージェントハーネスに委譲する。

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex app-server ハーネスは、バンドルされた Codex Plugin によって登録される。

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Codex ハーネス実装は、PI バックエンドの試行と同じ `EmbeddedRunAttemptParams` を受け取る。

- `extensions/codex/src/app-server/run-attempt.ts`

つまり、必要なフックポイントは OpenClaw が制御するコード内にある。外部境界は Codex app-server プロトコル自体である。OpenClaw は `thread/start`、`thread/resume`、`turn/start` に送信する内容を制御でき、通知を観測できるが、Codex の内部スレッドストアやネイティブコンパクターは変更できない。

## 現在のギャップ

組み込み PI 試行はコンテキストエンジンのライフサイクルを直接呼び出す。

- 試行前のブートストラップ/メンテナンス
- モデル呼び出し前の組み立て
- 試行後の afterTurn または取り込み
- 成功したターン後のメンテナンス
- Compaction を所有するエンジン向けのコンテキストエンジン Compaction

関連する PI コード:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex app-server 試行は現在、汎用エージェントハーネスフックを実行し、トランスクリプトをミラーするが、`params.contextEngine.bootstrap`、`params.contextEngine.assemble`、`params.contextEngine.afterTurn`、`params.contextEngine.ingestBatch`、`params.contextEngine.ingest`、`params.contextEngine.maintain` は呼び出さない。

関連する Codex コード:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## 望ましい動作

Codex ハーネスのターンでは、OpenClaw はこのライフサイクルを保持するべきである。

1. ミラーされた OpenClaw セッショントランスクリプトを読み取る。
2. 以前のセッションファイルが存在する場合、アクティブなコンテキストエンジンをブートストラップする。
3. 利用可能な場合はブートストラップメンテナンスを実行する。
4. アクティブなコンテキストエンジンを使用してコンテキストを組み立てる。
5. 組み立てられたコンテキストを Codex 互換の入力に変換する。
6. コンテキストエンジンの `systemPromptAddition` を含む開発者指示で Codex スレッドを開始または再開する。
7. 組み立てられたユーザー向けプロンプトで Codex ターンを開始する。
8. Codex の結果を OpenClaw トランスクリプトへミラーし戻す。
9. 実装されている場合は `afterTurn` を呼び出し、そうでなければ、ミラーされたトランスクリプトスナップショットを使用して `ingestBatch`/`ingest` を呼び出す。
10. 成功した中断されていないターンの後に、ターンメンテナンスを実行する。
11. Codex ネイティブの Compaction シグナルと OpenClaw の Compaction フックを保持する。

## 設計上の制約

### Codex app-server はネイティブスレッド状態の正本であり続ける

Codex はネイティブスレッドと内部の拡張履歴を所有する。OpenClaw は、サポートされたプロトコル呼び出し以外で app-server の内部履歴を変更しようとするべきではない。

OpenClaw のトランスクリプトミラーは、OpenClaw 機能のソースであり続ける。

- チャット履歴
- 検索
- `/new` と `/reset` のブックキーピング
- 将来のモデルまたはハーネス切り替え
- コンテキストエンジン Plugin の状態

### コンテキストエンジンの組み立ては Codex 入力に投影する必要がある

コンテキストエンジンインターフェイスは Codex スレッドパッチではなく、OpenClaw の `AgentMessage[]` を返す。Codex app-server の `turn/start` は現在のユーザー入力を受け取り、`thread/start` と `thread/resume` は開発者指示を受け取る。

したがって、実装には投影レイヤーが必要である。安全な最初のバージョンでは、Codex の内部履歴を置き換えられるふりを避けるべきである。現在のターンの周囲に、決定的なプロンプト/開発者指示の素材として組み立て済みコンテキストを注入するべきである。

### プロンプトキャッシュの安定性が重要

lossless-claw のようなエンジンでは、入力が変わらなければ組み立てられるコンテキストも決定的であるべきである。生成されるコンテキストテキストに、タイムスタンプ、ランダム ID、非決定的な順序を追加しない。

### ランタイム選択セマンティクスは変更しない

ハーネス選択は現状のままとする。

- `runtime: "pi"` は PI を強制する
- `runtime: "codex"` は登録済み Codex ハーネスを選択する
- `runtime: "auto"` は Plugin ハーネスに対応プロバイダーを要求させる
- 一致しない `auto` 実行は PI を使用する

この作業は、Codex ハーネスが選択された後に何が起きるかを変更する。

## 実装計画

### 1. 再利用可能なコンテキストエンジン試行ヘルパーをエクスポートまたは移動する

現在、再利用可能なライフサイクルヘルパーは PI ランナー配下にある。

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

避けられるなら、Codex は名前が PI を示唆する実装パスからインポートすべきではない。

たとえば、ハーネス中立のモジュールを作成する。

- `src/agents/harness/context-engine-lifecycle.ts`

次を移動または再エクスポートする。

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- `runContextEngineMaintenance` の小さなラッパー

古いファイルから再エクスポートするか、同じ PR で PI の呼び出し箇所を更新して、PI のインポートが引き続き動作するようにする。

中立なヘルパー名には PI を含めるべきではない。

推奨名:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Codex コンテキスト投影ヘルパーを追加する

新しいモジュールを追加する。

- `extensions/codex/src/app-server/context-engine-projection.ts`

責務:

- 組み立てられた `AgentMessage[]`、元のミラー済み履歴、現在のプロンプトを受け取る。
- どのコンテキストを開発者指示に入れ、どれを現在のユーザー入力に入れるかを判断する。
- 現在のユーザープロンプトを最後の実行可能なリクエストとして保持する。
- 過去のメッセージを安定した明示的な形式でレンダリングする。
- 変動するメタデータを避ける。

提案 API:

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

- `systemPromptAddition` を開発者指示に入れる。
- 組み立てられたトランスクリプトコンテキストを `promptText` 内の現在のプロンプトの前に置く。
- OpenClaw が組み立てたコンテキストとして明確にラベル付けする。
- 現在のプロンプトを最後に保つ。
- 現在のユーザープロンプトがすでに末尾に現れている場合は重複を除外する。

プロンプト形状の例:

```text
このターンの OpenClaw 組み立て済みコンテキスト:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

現在のユーザーリクエスト:
...
```

これはネイティブな Codex 履歴操作ほど洗練されてはいないが、OpenClaw 内で実装可能であり、コンテキストエンジンのセマンティクスを保持できる。

将来の改善: Codex app-server がスレッド履歴を置き換える、または補足するプロトコルを公開した場合、この投影レイヤーをその API を使用するように差し替える。

### 3. Codex スレッド起動前にブートストラップを配線する

`extensions/codex/src/app-server/run-attempt.ts` で:

- 現在と同様にミラー済みセッション履歴を読み取る。
- この実行前にセッションファイルが存在していたかどうかを判定する。ミラー書き込み前に `fs.stat(params.sessionFile)` を確認するヘルパーを優先する。
- `SessionManager` を開くか、ヘルパーが必要とする場合は狭いセッションマネージャーアダプターを使用する。
- `params.contextEngine` が存在する場合、中立ブートストラップヘルパーを呼び出す。

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

Codex ツールブリッジおよびトランスクリプトミラーと同じ `sessionKey` 規約を使用する。現在 Codex は `params.sessionKey` または `params.sessionId` から `sandboxSessionKey` を計算している。生の `params.sessionKey` を保持する理由がない限り、それを一貫して使用する。

### 4. `thread/start` / `thread/resume` と `turn/start` の前に組み立てを配線する

`runCodexAppServerAttempt` で:

1. まず動的ツールを構築し、コンテキストエンジンが実際に利用可能なツール名を認識できるようにする。
2. ミラー済みセッション履歴を読み取る。
3. `params.contextEngine` が存在する場合、コンテキストエンジンの `assemble(...)` を実行する。
4. 組み立て結果を次へ投影する。
   - 開発者指示の追加
   - `turn/start` 用のプロンプトテキスト

既存のフック呼び出し:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

はコンテキスト対応にするべきである。

1. `buildDeveloperInstructions(params)` でベースの開発者指示を計算する
2. コンテキストエンジンの組み立て/投影を適用する
3. 投影済みプロンプト/開発者指示で `before_prompt_build` を実行する

この順序により、汎用プロンプトフックは Codex が受け取るものと同じプロンプトを参照できる。厳密な PI パリティが必要な場合は、フック合成の前にコンテキストエンジンの組み立てを実行する。PI はプロンプトパイプラインの後に、コンテキストエンジンの `systemPromptAddition` を最終システムプロンプトへ適用するためである。重要な不変条件は、コンテキストエンジンとフックの両方が、決定的で文書化された順序を得ることである。

最初の実装で推奨される順序:

1. `buildDeveloperInstructions(params)`
2. コンテキストエンジンの `assemble()`
3. `systemPromptAddition` を開発者指示へ追加/前置する
4. 組み立て済みメッセージをプロンプトテキストへ投影する
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. 最終的な開発者指示を `startOrResumeThread(...)` に渡す
7. 最終的なプロンプトテキストを `buildTurnStartParams(...)` に渡す

将来の変更が誤って順序を変えないよう、この仕様はテストにエンコードするべきである。

### 5. プロンプトキャッシュで安定するフォーマットを保持する

投影ヘルパーは、同一入力に対してバイト単位で安定した出力を生成しなければならない。

- 安定したメッセージ順序
- 安定したロールラベル
- 生成されたタイムスタンプなし
- オブジェクトキー順序の漏れなし
- ランダムな区切り文字なし
- 実行ごとの ID なし

固定区切り文字と明示的なセクションを使用する。

### 6. トランスクリプトミラー後にターン後処理を配線する

Codex の `CodexAppServerEventProjector` は、現在のターン用にローカルの
`messagesSnapshot` を構築します。`mirrorTranscriptBestEffort(...)` はそのスナップショットを
OpenClaw transcript mirror に書き込みます。

ミラーリングの成功または失敗後、利用可能な最善のメッセージスナップショットで
コンテキストエンジン finalizer を呼び出します。

- 書き込み後の完全なミラー済みセッションコンテキストを優先します。`afterTurn` は現在のターンだけではなく、セッションスナップショットを期待するためです。
- セッションファイルを再度開けない場合は、`historyMessages + result.messagesSnapshot` にフォールバックします。

疑似フロー:

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

ミラーリングに失敗した場合も、フォールバックスナップショットで `afterTurn` を呼び出しますが、
コンテキストエンジンがフォールバックのターンデータから取り込んでいることをログに記録します。

### 7. 使用量とプロンプトキャッシュのランタイムコンテキストを正規化する

Codex の結果には、利用可能な場合、app-server のトークン通知から正規化された使用量が含まれます。
その使用量をコンテキストエンジンのランタイムコンテキストに渡します。

Codex app-server が将来的にキャッシュの読み取り/書き込み詳細を公開した場合は、それらを
`ContextEnginePromptCacheInfo` にマッピングします。それまでは、ゼロを捏造するのではなく
`promptCache` を省略します。

### 8. Compaction ポリシー

Compaction システムは 2 つあります。

1. OpenClaw コンテキストエンジン `compact()`
2. Codex app-server ネイティブ `thread/compact/start`

これらを暗黙に混同してはいけません。

#### `/compact` と明示的な OpenClaw Compaction

選択されたコンテキストエンジンの `info.ownsCompaction === true` の場合、明示的な
OpenClaw Compaction は、OpenClaw transcript mirror と Plugin 状態に対して、コンテキストエンジンの
`compact()` 結果を優先するべきです。

選択された Codex harness にネイティブ thread binding がある場合、app-server thread を健全に保つために
Codex ネイティブ Compaction も追加でリクエストできますが、これは詳細内で別のバックエンドアクションとして
報告する必要があります。

推奨される動作:

- `contextEngine.info.ownsCompaction === true` の場合:
  - 先にコンテキストエンジン `compact()` を呼び出す
  - その後、thread binding が存在する場合はベストエフォートで Codex ネイティブ Compaction を呼び出す
  - コンテキストエンジンの結果を主要な結果として返す
  - Codex ネイティブ Compaction のステータスを `details.codexNativeCompaction` に含める
- アクティブなコンテキストエンジンが Compaction を所有していない場合:
  - 現在の Codex ネイティブ Compaction の動作を保持する

これは、`maybeCompactAgentHarnessSession(...)` が呼び出されている場所に応じて、
`extensions/codex/src/app-server/compact.ts` を変更するか、汎用 Compaction パスからラップする必要が
ありそうです。

#### ターン中の Codex ネイティブ contextCompaction イベント

Codex はターン中に `contextCompaction` item events を発行する場合があります。
`event-projector.ts` で現在の before/after Compaction hook emission は維持しますが、
それを完了済みのコンテキストエンジン Compaction として扱ってはいけません。

Compaction を所有するエンジンでは、Codex がそれでもネイティブ Compaction を実行した場合に
明示的な診断を発行します。

- stream/event 名: 既存の `compaction` stream で問題ありません
- details: `{ backend: "codex-app-server", ownsCompaction: true }`

これにより、分離を監査可能にします。

### 9. セッションリセットと binding の動作

既存の Codex harness `reset(...)` は、OpenClaw セッションファイルから Codex app-server binding を
クリアします。この動作を維持します。

また、コンテキストエンジン状態のクリーンアップが、既存の OpenClaw セッションライフサイクルパスを
通じて引き続き行われることも確認します。コンテキストエンジンのライフサイクルが全 harness の
reset/delete イベントを現在取りこぼしている場合を除き、Codex 固有のクリーンアップを追加しないでください。

### 10. エラー処理

PI セマンティクスに従います。

- bootstrap 失敗は warn して続行する
- assemble 失敗は warn し、未 assemble の pipeline messages/prompt にフォールバックする
- afterTurn/ingest 失敗は warn し、ターン後の finalization を不成功としてマークする
- maintenance は、成功し、中断されておらず、yield でも中断されていないターンの後にのみ実行する
- Compaction エラーを新しいプロンプトとして再試行してはいけない

Codex 固有の追加事項:

- コンテキスト projection に失敗した場合は、warn して元のプロンプトにフォールバックします。
- transcript mirror に失敗した場合も、フォールバック messages でコンテキストエンジン finalization を試みます。
- コンテキストエンジン Compaction が成功した後に Codex ネイティブ Compaction が失敗した場合、
  コンテキストエンジンが primary であるときは、OpenClaw Compaction 全体を失敗させません。

## テスト計画

### Unit tests

`extensions/codex/src/app-server` にテストを追加します。

1. `run-attempt.context-engine.test.ts`
   - session file が存在する場合、Codex は `bootstrap` を呼び出す。
   - Codex は mirrored messages、token budget、tool names、citations mode、model id、prompt を使って `assemble` を呼び出す。
   - `systemPromptAddition` が developer instructions に含まれる。
   - assemble 済み messages が現在の request の前に prompt へ projection される。
   - Codex は transcript mirroring の後に `afterTurn` を呼び出す。
   - `afterTurn` がない場合、Codex は `ingestBatch` または message ごとの `ingest` を呼び出す。
   - Turn maintenance は成功したターンの後に実行される。
   - Turn maintenance は prompt error、abort、yield abort では実行されない。

2. `context-engine-projection.test.ts`
   - 同一入力に対して安定した出力
   - assemble 済み history に current prompt が含まれていても重複しない
   - empty history を処理する
   - role order を保持する
   - system prompt addition は developer instructions にのみ含める

3. `compact.context-engine.test.ts`
   - 所有するコンテキストエンジンの primary result が優先される
   - 併せて試行された場合、Codex ネイティブ Compaction のステータスが details に現れる
   - Codex ネイティブ失敗は、所有するコンテキストエンジン Compaction を失敗させない
   - 所有していないコンテキストエンジンでは、現在のネイティブ Compaction 動作を保持する

### 更新する既存テスト

- 存在する場合は `extensions/codex/src/app-server/run-attempt.test.ts`、なければ最も近い Codex app-server run tests。
- Compaction event details が変わる場合に限り `extensions/codex/src/app-server/event-projector.test.ts`。
- config behavior が変わらない限り、`src/agents/harness/selection.test.ts` は変更不要のはずです。安定したままにするべきです。
- PI コンテキストエンジン tests は変更なしで引き続き通るべきです。

### Integration / live tests

live Codex harness smoke tests を追加または拡張します。

- `plugins.slots.contextEngine` を test engine に構成する
- `agents.defaults.model` を `codex/*` model に構成する
- `agents.defaults.embeddedHarness.runtime = "codex"` を構成する
- test engine が次を観測したことを assert する:
  - bootstrap
  - assemble
  - afterTurn または ingest
  - maintenance

OpenClaw core tests で lossless-claw を必須にしないでください。小さなリポジトリ内 fake
context engine plugin を使用します。

## 可観測性

Codex コンテキストエンジン lifecycle calls の周辺に debug logs を追加します。

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` と reason
- `codex native compaction completed alongside context-engine compaction`

完全な prompts や transcript contents はログに記録しないでください。

有用な場合は structured fields を追加します。

- `sessionId`
- `sessionKey` は既存の logging practice に従って redacted または omitted
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## 移行 / 互換性

これは backward-compatible であるべきです。

- コンテキストエンジンが構成されていない場合、legacy context engine behavior は現在の Codex harness behavior と同等であるべきです。
- コンテキストエンジン `assemble` が失敗した場合、Codex は元の prompt path で続行するべきです。
- 既存の Codex thread bindings は有効なままであるべきです。
- Dynamic tool fingerprinting にコンテキストエンジン出力を含めるべきではありません。そうしないと、すべての context change が新しい Codex thread を強制する可能性があります。tool catalog のみが dynamic tool fingerprint に影響するべきです。

## 未解決の質問

1. assemble 済み context は user prompt に完全に注入するべきか、developer instructions に完全に注入するべきか、それとも分割するべきか？

   推奨: 分割します。`systemPromptAddition` は developer instructions に置き、
   assembled transcript context は user prompt wrapper に置きます。これは native thread history を変更せず、
   現在の Codex protocol に最もよく一致します。

2. コンテキストエンジンが Compaction を所有する場合、Codex ネイティブ Compaction を無効化するべきか？

   推奨: いいえ、少なくとも初期段階では無効化しません。Codex ネイティブ Compaction は app-server thread を維持するために
   まだ必要な場合があります。ただし、context-engine compaction ではなく、native Codex compaction として報告する必要があります。

3. `before_prompt_build` はコンテキストエンジン assembly の前に実行するべきか、後に実行するべきか？

   推奨: Codex ではコンテキストエンジン projection の後です。これにより、汎用 harness hooks は Codex が実際に受け取る
   prompt/developer instructions を見ることができます。PI parity が逆を要求する場合は、選択した順序をテストにエンコードし、
   ここに文書化します。

4. Codex app-server は将来の structured context/history override を受け入れられるか？

   不明です。可能な場合は、text projection layer をその protocol に置き換え、lifecycle calls は変更せず維持します。

## 受け入れ基準

- `codex/*` embedded harness turn が、選択されたコンテキストエンジンの assemble lifecycle を呼び出す。
- コンテキストエンジン `systemPromptAddition` が Codex developer instructions に影響する。
- Assembled context が Codex turn input に決定論的に影響する。
- 成功した Codex turns は `afterTurn` または ingest fallback を呼び出す。
- 成功した Codex turns はコンテキストエンジン turn maintenance を実行する。
- failed/aborted/yield-aborted turns は turn maintenance を実行しない。
- コンテキストエンジン所有の Compaction は、OpenClaw/Plugin state に対して primary のままである。
- Codex ネイティブ Compaction は、native Codex behavior として監査可能なままである。
- 既存の PI コンテキストエンジン behavior は変更されていない。
- non-legacy context engine が選択されていない場合、または assembly が失敗した場合、既存の Codex harness behavior は変更されていない。
