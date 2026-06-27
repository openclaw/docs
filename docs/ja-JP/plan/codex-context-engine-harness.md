---
read_when:
    - Codex ハーネスに context-engine のライフサイクル動作を接続しています
    - codex/* の埋め込みハーネスセッションを扱うには、lossless-claw または別のコンテキストエンジンプラグインが必要です
    - OpenClaw組み込みとCodexアプリサーバーのコンテキスト動作を比較しています
summary: バンドルされた Codex app-server ハーネスで OpenClaw context-engine plugins を尊重させるための仕様
title: Codex ハーネス Context Engine ポート
x-i18n:
    generated_at: "2026-06-27T11:57:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a757ee324e7937e30736ff8a82d86fec6b3fe93e837a71a69a6d0af911e9f395
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## ステータス

ドラフトの実装仕様。

## 目標

バンドルされた Codex app-server ハーネスが、埋め込み OpenClaw ターンですでに尊重されているものと同じ OpenClaw context-engine ライフサイクル契約を尊重するようにする。

provider/model `agentRuntime.id: "codex"` または `codex/*` モデルを使用するセッションでも、Codex app-server 境界で可能な範囲で、選択された context-engine Plugin、たとえば `lossless-claw` が、コンテキストの組み立て、ターン後の取り込み、メンテナンス、OpenClaw レベルの Compaction ポリシーを制御できるようにする。

## 非目標

- Codex app-server の内部を再実装しない。
- Codex ネイティブスレッド Compaction が lossless-claw サマリーを生成するようにしない。
- 非 Codex モデルに Codex ハーネスの使用を要求しない。
- ACP/acpx セッションの挙動を変更しない。この仕様は非 ACP の埋め込みエージェントハーネスパスのみを対象とする。
- サードパーティ Plugin に Codex app-server 拡張ファクトリの登録を要求しない。既存のバンドル Plugin の信頼境界は変更しない。

## 現在のアーキテクチャ

埋め込み実行ループは、具体的な低レベルハーネスを選択する前に、設定済み context engine を実行ごとに一度解決する。

- `src/agents/embedded-agent-runner/run.ts`
  - context-engine Plugin を初期化する
  - `resolveContextEngine(params.config)` を呼び出す
  - `contextEngine` と `contextTokenBudget` を
    `runEmbeddedAttemptWithBackend(...)` に渡す

`runEmbeddedAttemptWithBackend(...)` は、選択されたエージェントハーネスに委譲する。

- `src/agents/embedded-agent-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex app-server ハーネスは、バンドルされた Codex Plugin によって登録される。

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Codex ハーネス実装は、組み込み OpenClaw 試行と同じ `EmbeddedRunAttemptParams` を受け取る。

- `extensions/codex/src/app-server/run-attempt.ts`

つまり、必要なフックポイントは OpenClaw が制御するコード内にある。外部境界は Codex app-server プロトコル自体である。OpenClaw は `thread/start`、`thread/resume`、`turn/start` に送信する内容を制御でき、通知を観測できるが、Codex の内部スレッドストアやネイティブ Compaction を変更することはできない。

## 現在のギャップ

組み込み OpenClaw 試行は、context-engine ライフサイクルを直接呼び出す。

- 試行前のブートストラップ/メンテナンス
- モデル呼び出し前の組み立て
- 試行後の afterTurn または ingest
- 成功したターン後のメンテナンス
- Compaction を所有するエンジン向けの context-engine Compaction

関連する OpenClaw コード:

- `src/agents/embedded-agent-runner/run/attempt.ts`
- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex app-server 試行は現在、汎用エージェントハーネスフックを実行し、トランスクリプトをミラーするが、`params.contextEngine.bootstrap`、`params.contextEngine.assemble`、`params.contextEngine.afterTurn`、`params.contextEngine.ingestBatch`、`params.contextEngine.ingest`、または `params.contextEngine.maintain` を呼び出していない。

関連する Codex コード:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## 望ましい挙動

Codex ハーネスターンでは、OpenClaw はこのライフサイクルを維持するべきである。

1. ミラーされた OpenClaw セッショントランスクリプトを読み取る。
2. 以前のセッションファイルが存在する場合、アクティブな context engine をブートストラップする。
3. 利用可能な場合、ブートストラップメンテナンスを実行する。
4. アクティブな context engine を使用してコンテキストを組み立てる。
5. 組み立てられたコンテキストを Codex 互換の入力に変換する。
6. context-engine `systemPromptAddition` がある場合はそれを含む開発者指示で Codex スレッドを開始または再開する。
7. 組み立てられたユーザー向けプロンプトで Codex ターンを開始する。
8. Codex の結果を OpenClaw トランスクリプトにミラーし戻す。
9. 実装されている場合は `afterTurn` を呼び出し、そうでなければミラーされたトランスクリプトスナップショットを使用して `ingestBatch`/`ingest` を呼び出す。
10. 成功した非中断ターンの後にターンメンテナンスを実行する。
11. Codex ネイティブ Compaction シグナルと OpenClaw Compaction フックを維持する。

## 設計制約

### Codex app-server はネイティブスレッド状態の正準であり続ける

Codex はネイティブスレッドと内部の拡張履歴を所有する。OpenClaw は、サポートされているプロトコル呼び出し以外で app-server の内部履歴を変更しようとするべきではない。

OpenClaw のトランスクリプトミラーは、OpenClaw 機能のソースであり続ける。

- チャット履歴
- 検索
- `/new` と `/reset` の記録管理
- 将来のモデルまたはハーネス切り替え
- context-engine Plugin 状態

### Context engine の組み立ては Codex 入力へ投影する必要がある

context-engine インターフェースは Codex スレッドパッチではなく、OpenClaw `AgentMessage[]` を返す。Codex app-server `turn/start` は現在のユーザー入力を受け取り、`thread/start` と `thread/resume` は開発者指示を受け取る。

そのため、実装には投影レイヤーが必要である。安全な初期バージョンでは、Codex の内部履歴を置き換えられると見せかけることは避けるべきである。現在のターンの周囲に、決定論的なプロンプト/開発者指示素材として組み立て済みコンテキストを注入するべきである。

### プロンプトキャッシュの安定性が重要

lossless-claw のようなエンジンでは、入力が変わらない場合、組み立てられるコンテキストは決定論的であるべきである。生成されるコンテキストテキストに、タイムスタンプ、ランダム ID、または非決定論的な順序を追加しない。

### ランタイム選択セマンティクスは変更しない

ハーネス選択は現状のままとする。

- `runtime: "openclaw"` は組み込み OpenClaw ハーネスを選択する
- `runtime: "codex"` は登録済み Codex ハーネスを選択する
- `runtime: "auto"` は Plugin ハーネスに対応 provider の要求を許可する
- 一致しない `auto` 実行は組み込み OpenClaw ハーネスを使用する

この作業は、Codex ハーネスが選択された後に何が起こるかを変更する。

## 実装計画

### 1. 再利用可能な context-engine 試行ヘルパーをエクスポートまたは移動する

現在、再利用可能なライフサイクルヘルパーは埋め込みエージェントランナー配下にある。

- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/run/attempt.prompt-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex は、ランナー実装の詳細に入り込むのではなく、ハーネス中立のヘルパーをインポートするべきである。

たとえば、ハーネス中立のモジュールを作成する。

- `src/agents/harness/context-engine-lifecycle.ts`

移動または再エクスポートするもの:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- `runContextEngineMaintenance` の小さなラッパー

同じ PR で組み込みハーネスの呼び出し箇所を更新する。

中立ヘルパー名は、組み込みハーネスに言及するべきではない。

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

- 組み立てられた `AgentMessage[]`、元のミラー履歴、現在のプロンプトを受け取る。
- どのコンテキストを開発者指示に入れ、どれを現在のユーザー入力に入れるかを決定する。
- 現在のユーザープロンプトを最後の実行可能なリクエストとして維持する。
- 以前のメッセージを安定した明示的な形式でレンダリングする。
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

推奨される初期投影:

- `systemPromptAddition` を開発者指示に入れる。
- 現在のプロンプトの前に、組み立てられたトランスクリプトコンテキストを `promptText` に入れる。
- OpenClaw が組み立てたコンテキストであることを明確にラベル付けする。
- 現在のプロンプトを最後に保つ。
- 現在のユーザープロンプトがすでに末尾にある場合は重複を除外する。

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

これはネイティブ Codex 履歴の手術ほど洗練されていないが、OpenClaw 内で実装可能であり、context-engine セマンティクスを維持できる。

将来の改善: Codex app-server がスレッド履歴を置き換える、または補完するためのプロトコルを公開した場合、この投影レイヤーをその API の使用に差し替える。

### 3. Codex スレッド起動前にブートストラップを配線する

`extensions/codex/src/app-server/run-attempt.ts` で:

- 現在と同様に、ミラーされたセッション履歴を読み取る。
- この実行前にセッションファイルが存在していたかを判定する。ミラー書き込み前に `fs.stat(params.sessionFile)` を確認するヘルパーを優先する。
- ヘルパーが必要とする場合は、`SessionManager` を開くか、狭いセッションマネージャーアダプターを使用する。
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

Codex ツールブリッジとトランスクリプトミラーと同じ `sessionKey` 規約を使用する。現在 Codex は `params.sessionKey` または `params.sessionId` から `sandboxSessionKey` を計算している。raw `params.sessionKey` を維持する理由がない限り、それを一貫して使用する。

### 4. `thread/start` / `thread/resume` と `turn/start` の前に assemble を配線する

`runCodexAppServerAttempt` で:

1. まず動的ツールを構築し、context engine が実際に利用可能なツール名を見られるようにする。
2. ミラーされたセッション履歴を読み取る。
3. `params.contextEngine` が存在する場合、context-engine `assemble(...)` を実行する。
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

は、コンテキスト対応にするべきである。

1. `buildDeveloperInstructions(params)` でベースの開発者指示を計算する
2. context-engine の組み立て/投影を適用する
3. 投影されたプロンプト/開発者指示で `before_prompt_build` を実行する

この順序により、汎用プロンプトフックは Codex が受け取るものと同じプロンプトを見られる。厳密な OpenClaw パリティが必要な場合は、フック合成の前に context-engine 組み立てを実行する。組み込みハーネスは、プロンプトパイプライン後の最終システムプロンプトに context-engine `systemPromptAddition` を適用するためである。重要な不変条件は、context engine とフックの両方が決定論的で文書化された順序を得ることである。

初期実装の推奨順序:

1. `buildDeveloperInstructions(params)`
2. context-engine `assemble()`
3. `systemPromptAddition` を開発者指示に追加/前置する
4. 組み立てられたメッセージをプロンプトテキストへ投影する
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. 最終的な開発者指示を `startOrResumeThread(...)` に渡す
7. 最終的なプロンプトテキストを `buildTurnStartParams(...)` に渡す

将来の変更で誤って順序が変わらないように、この仕様はテストにエンコードするべきである。

### 5. プロンプトキャッシュに安定したフォーマットを維持する

投影ヘルパーは、同一入力に対してバイト安定の出力を生成する必要がある。

- 安定したメッセージ順序
- 安定したロールラベル
- 生成されたタイムスタンプなし
- オブジェクトキー順序の漏れなし
- ランダム区切り文字なし
- 実行ごとの ID なし

固定の区切り文字と明示的なセクションを使用する。

### 6. トランスクリプトミラー後にターン後処理を配線する

Codex の `CodexAppServerEventProjector` は、現在のターン用にローカルの `messagesSnapshot` を構築します。`mirrorTranscriptBestEffort(...)` は、そのスナップショットを OpenClaw トランスクリプトミラーに書き込みます。

ミラーリングが成功または失敗した後、利用可能な最良のメッセージスナップショットでコンテキストエンジンのファイナライザーを呼び出します。

- 書き込み後の完全なミラー済みセッションコンテキストを優先します。`afterTurn` は現在のターンだけでなく、セッションスナップショットを想定しているためです。
- セッションファイルを再オープンできない場合は、`historyMessages + result.messagesSnapshot` にフォールバックします。

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

ミラーリングに失敗した場合も、フォールバックスナップショットで `afterTurn` を呼び出します。ただし、コンテキストエンジンがフォールバックのターンデータから取り込んでいることをログに記録します。

### 7. 使用量とプロンプトキャッシュのランタイムコンテキストを正規化する

Codex の結果には、利用可能な場合、アプリサーバーのトークン通知から正規化された使用量が含まれます。その使用量をコンテキストエンジンのランタイムコンテキストに渡します。

Codex アプリサーバーが将来的にキャッシュの読み書き詳細を公開する場合は、それらを `ContextEnginePromptCacheInfo` にマッピングします。それまでは、ゼロを捏造するのではなく `promptCache` を省略します。

### 8. Compaction ポリシー

Compaction システムは 2 つあります。

1. OpenClaw コンテキストエンジン `compact()`
2. Codex アプリサーバーのネイティブ `thread/compact/start`

これらを暗黙に混同しないでください。

#### `/compact` と明示的な OpenClaw Compaction

選択されたコンテキストエンジンの `info.ownsCompaction === true` の場合、明示的な OpenClaw Compaction は、OpenClaw トランスクリプトミラーと Plugin 状態について、コンテキストエンジンの `compact()` 結果を優先するべきです。

選択された Codex ハーネスにネイティブスレッドバインディングがある場合、アプリサーバースレッドを健全に保つために Codex ネイティブ Compaction も追加で要求できます。ただし、これは details 内で別個のバックエンドアクションとして報告する必要があります。

推奨される動作:

- `contextEngine.info.ownsCompaction === true` の場合:
  - まずコンテキストエンジンの `compact()` を呼び出す
  - 次に、スレッドバインディングが存在する場合はベストエフォートで Codex ネイティブ Compaction を呼び出す
  - コンテキストエンジンの結果を主結果として返す
  - Codex ネイティブ Compaction のステータスを `details.codexNativeCompaction` に含める
- アクティブなコンテキストエンジンが Compaction を所有していない場合:
  - 現在の Codex ネイティブ Compaction の動作を維持する

これは、`maybeCompactAgentHarnessSession(...)` がどこで呼び出されているかに応じて、`extensions/codex/src/app-server/compact.ts` を変更するか、汎用 Compaction パスからラップする必要がある可能性があります。

#### ターン内の Codex ネイティブ contextCompaction イベント

Codex はターン中に `contextCompaction` アイテムイベントを出す場合があります。`event-projector.ts` の現在の Compaction 前後フックの発行は維持しますが、それを完了済みのコンテキストエンジン Compaction として扱わないでください。

Compaction を所有するエンジンについては、それでも Codex がネイティブ Compaction を実行した場合に、明示的な診断を発行します。

- ストリーム/イベント名: 既存の `compaction` ストリームで問題ありません
- details: `{ backend: "codex-app-server", ownsCompaction: true }`

これにより、分離を監査可能にします。

### 9. セッションリセットとバインディング動作

既存の Codex ハーネスの `reset(...)` は、OpenClaw セッションファイルから Codex アプリサーバーバインディングをクリアします。この動作を維持してください。

また、コンテキストエンジンの状態クリーンアップが既存の OpenClaw セッションライフサイクルパスを通じて継続して行われることも確認してください。現在のコンテキストエンジンライフサイクルがすべてのハーネスについてリセット/削除イベントを取りこぼしているのでない限り、Codex 固有のクリーンアップを追加しないでください。

### 10. エラー処理

組み込みの OpenClaw セマンティクスに従います。

- ブートストラップ失敗は警告して続行する
- assemble 失敗は警告し、未 assemble のパイプラインメッセージ/プロンプトにフォールバックする
- afterTurn/ingest 失敗は警告し、ターン後のファイナライズを失敗としてマークする
- メンテナンスは、成功し、中断されておらず、yield で中断されていないターンの後にのみ実行する
- Compaction エラーは新しいプロンプトとして再試行しない

Codex 固有の追加事項:

- コンテキスト投影に失敗した場合は、警告して元のプロンプトにフォールバックします。
- トランスクリプトミラーに失敗した場合も、フォールバックメッセージでコンテキストエンジンのファイナライズを試みます。
- コンテキストエンジン Compaction が成功した後に Codex ネイティブ Compaction が失敗しても、コンテキストエンジンが主である場合は OpenClaw Compaction 全体を失敗させないでください。

## テスト計画

### ユニットテスト

`extensions/codex/src/app-server` 配下にテストを追加します。

1. `run-attempt.context-engine.test.ts`
   - セッションファイルが存在する場合、Codex が `bootstrap` を呼び出す。
   - Codex がミラー済みメッセージ、トークン予算、ツール名、引用モード、モデル ID、プロンプトで `assemble` を呼び出す。
   - `systemPromptAddition` が開発者向け指示に含まれる。
   - assemble 済みメッセージが現在のリクエスト前にプロンプトへ投影される。
   - Codex がトランスクリプトミラーリング後に `afterTurn` を呼び出す。
   - `afterTurn` がない場合、Codex が `ingestBatch` またはメッセージ単位の `ingest` を呼び出す。
   - 成功したターン後にターンメンテナンスが実行される。
   - プロンプトエラー、中断、または yield 中断ではターンメンテナンスが実行されない。

2. `context-engine-projection.test.ts`
   - 同一入力に対する安定した出力
   - assemble 済み履歴に現在のプロンプトが含まれる場合、現在のプロンプトを重複させない
   - 空の履歴を処理する
   - ロール順を維持する
   - システムプロンプト追加を開発者向け指示にのみ含める

3. `compact.context-engine.test.ts`
   - 所有するコンテキストエンジンの主結果が優先される
   - 併せて試行された場合、Codex ネイティブ Compaction のステータスが details に現れる
   - Codex ネイティブ失敗によって、所有するコンテキストエンジンの Compaction が失敗しない
   - 所有していないコンテキストエンジンでは、現在のネイティブ Compaction 動作を維持する

### 更新する既存テスト

- 存在する場合は `extensions/codex/src/app-server/run-attempt.test.ts`、そうでなければ最も近い Codex アプリサーバー実行テスト。
- Compaction イベントの details が変わる場合のみ、`extensions/codex/src/app-server/event-projector.test.ts`。
- config 動作が変わらない限り、`src/agents/harness/selection.test.ts` は変更不要です。安定したままであるべきです。
- 組み込みハーネスのコンテキストエンジンテストは、変更なしで引き続き成功するべきです。

### 統合 / ライブテスト

ライブ Codex ハーネスのスモークテストを追加または拡張します。

- `plugins.slots.contextEngine` をテストエンジンに設定する
- `agents.defaults.model` を `codex/*` モデルに設定する
- provider/model の `agentRuntime.id = "codex"` を設定する
- テストエンジンが以下を観測したことをアサートする:
  - bootstrap
  - assemble
  - afterTurn または ingest
  - maintenance

OpenClaw コアテストで lossless-claw を必須にすることは避けます。リポジトリ内の小さなフェイクコンテキストエンジン Plugin を使用してください。

## 観測性

Codex コンテキストエンジンのライフサイクル呼び出しの周辺にデバッグログを追加します。

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- 理由付きの `codex context engine maintenance skipped`
- `codex native compaction completed alongside context-engine compaction`

完全なプロンプトやトランスクリプト内容のログ出力は避けます。

有用な場合は構造化フィールドを追加します。

- `sessionId`
- 既存のログ慣行に従って編集済みまたは省略された `sessionKey`
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## マイグレーション / 互換性

これは後方互換であるべきです。

- コンテキストエンジンが設定されていない場合、レガシーコンテキストエンジンの動作は現在の Codex ハーネス動作と同等であるべきです。
- コンテキストエンジンの `assemble` が失敗した場合、Codex は元のプロンプトパスで続行するべきです。
- 既存の Codex スレッドバインディングは引き続き有効であるべきです。
- 動的ツールフィンガープリントにコンテキストエンジン出力を含めないでください。そうしないと、コンテキスト変更のたびに新しい Codex スレッドが強制される可能性があります。動的ツールフィンガープリントに影響するのはツールカタログだけであるべきです。

## 未解決の質問

1. assemble 済みコンテキストは、ユーザープロンプト全体に注入するべきか、開発者向け指示全体に注入するべきか、それとも分割するべきか。

   推奨: 分割します。`systemPromptAddition` は開発者向け指示に入れ、assemble 済みトランスクリプトコンテキストはユーザープロンプトラッパーに入れます。これは、ネイティブスレッド履歴を変更せずに現在の Codex プロトコルに最もよく一致します。

2. コンテキストエンジンが Compaction を所有している場合、Codex ネイティブ Compaction を無効にするべきか。

   推奨: 初期段階では無効にしません。Codex ネイティブ Compaction は、アプリサーバースレッドを維持するために引き続き必要な可能性があります。ただし、コンテキストエンジン Compaction としてではなく、ネイティブ Codex Compaction として報告する必要があります。

3. `before_prompt_build` はコンテキストエンジン assemble の前に実行するべきか、後に実行するべきか。

   推奨: Codex ではコンテキストエンジン投影の後に実行し、汎用ハーネスフックが Codex が実際に受け取るプロンプト/開発者向け指示を見られるようにします。組み込みハーネスとの一致のために逆順が必要な場合は、選択した順序をテストにエンコードし、ここに文書化します。

4. Codex アプリサーバーは将来的な構造化コンテキスト/履歴オーバーライドを受け入れられるか。

   不明です。可能な場合は、テキスト投影レイヤーをそのプロトコルに置き換え、ライフサイクル呼び出しは変更しないでください。

## 受け入れ基準

- `codex/*` 埋め込みハーネスのターンが、選択されたコンテキストエンジンの assemble ライフサイクルを呼び出す。
- コンテキストエンジンの `systemPromptAddition` が Codex の開発者向け指示に影響する。
- assemble 済みコンテキストが Codex ターン入力に決定論的に影響する。
- 成功した Codex ターンが `afterTurn` または ingest フォールバックを呼び出す。
- 成功した Codex ターンがコンテキストエンジンのターンメンテナンスを実行する。
- 失敗/中断/yield 中断されたターンではターンメンテナンスを実行しない。
- コンテキストエンジン所有の Compaction が OpenClaw/Plugin 状態の主であり続ける。
- Codex ネイティブ Compaction がネイティブ Codex 動作として監査可能なままである。
- 既存の組み込みハーネスのコンテキストエンジン動作が変更されていない。
- 非レガシーのコンテキストエンジンが選択されていない場合、または assemble が失敗した場合、既存の Codex ハーネス動作が変更されていない。
