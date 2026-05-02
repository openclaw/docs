---
read_when:
    - セッション ID、トランスクリプト JSONL、または sessions.json フィールドをデバッグする必要がある
    - 自動 Compaction の動作を変更している、または「pre-compaction」のハウスキーピングを追加している
    - メモリフラッシュまたはサイレントなシステムターンを実装したい場合
summary: '詳細解説: セッションストア + トランスクリプト、ライフサイクル、（自動）Compaction の内部構造'
title: セッション管理の詳細解説
x-i18n:
    generated_at: "2026-05-02T21:05:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8271d7b0786e1c47a8cec6e7bd73c3c86a433d629e17937fdd87fa756ed78d73
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw は、以下の領域にわたってセッションをエンドツーエンドで管理します。

- **セッションルーティング**（受信メッセージを `sessionKey` にマッピングする方法）
- **セッションストア**（`sessions.json`）と追跡内容
- **トランスクリプトの永続化**（`*.jsonl`）とその構造
- **トランスクリプトの健全性維持**（実行前のプロバイダー固有の修正）
- **コンテキスト制限**（コンテキストウィンドウと追跡トークン）
- **Compaction**（手動および自動 Compaction）と、Compaction 前処理をフックする場所
- **サイレントなハウスキーピング**（ユーザーに見える出力を生成すべきでないメモリ書き込み）

まず上位レベルの概要を確認したい場合は、以下から始めてください。

- [セッション管理](/ja-JP/concepts/session)
- [Compaction](/ja-JP/concepts/compaction)
- [メモリ概要](/ja-JP/concepts/memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [セッション枝刈り](/ja-JP/concepts/session-pruning)
- [トランスクリプトの健全性維持](/ja-JP/reference/transcript-hygiene)

---

## 信頼できる情報源: Gateway

OpenClaw は、セッション状態を所有する単一の **Gateway プロセス** を中心に設計されています。

- UI（macOS アプリ、Web Control UI、TUI）は、セッション一覧とトークン数を Gateway に問い合わせる必要があります。
- リモートモードでは、セッションファイルはリモートホスト上にあります。「ローカルの Mac ファイルを確認する」ことでは、Gateway が使用している内容は反映されません。

---

## 2 つの永続化レイヤー

OpenClaw はセッションを 2 つのレイヤーで永続化します。

1. **セッションストア（`sessions.json`）**
   - キー/値マップ: `sessionKey -> SessionEntry`
   - 小さく、変更可能で、編集（またはエントリ削除）しても安全
   - セッションメタデータ（現在のセッション ID、最終アクティビティ、トグル、トークンカウンターなど）を追跡

2. **トランスクリプト（`<sessionId>.jsonl`）**
   - ツリー構造を持つ追記専用トランスクリプト（エントリは `id` + `parentId` を持つ）
   - 実際の会話、ツール呼び出し、Compaction 要約を保存
   - 以後のターンでモデルコンテキストを再構築するために使用
   - アクティブなトランスクリプトがチェックポイントサイズ上限を超えると、Compaction 前の大きなデバッグチェックポイントはスキップされ、2 つ目の巨大な `.checkpoint.*.jsonl` コピーを避けます。

Gateway の履歴リーダーは、任意の履歴アクセスが明示的に必要なサーフェスでない限り、トランスクリプト全体の実体化を避ける必要があります。最初のページの履歴、埋め込みチャット履歴、再起動復旧、トークン/使用量チェックでは、境界付きの末尾読み取りを使用します。トランスクリプト全体のスキャンは非同期トランスクリプトインデックスを経由し、そのインデックスはファイルパスと `mtimeMs`/`size` でキャッシュされ、同時実行中のリーダー間で共有されます。

---

## ディスク上の場所

Gateway ホスト上で、エージェントごとに以下にあります。

- ストア: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- トランスクリプト: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram トピックセッション: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw はこれらを `src/config/sessions.ts` 経由で解決します。

---

## ストアメンテナンスとディスク制御

セッション永続化には、`sessions.json`、トランスクリプトアーティファクト、トラジェクトリサイドカー向けの自動メンテナンス制御（`session.maintenance`）があります。

- `mode`: `warn`（デフォルト）または `enforce`
- `pruneAfter`: 古いエントリの年齢カットオフ（デフォルト `30d`）
- `maxEntries`: `sessions.json` 内のエントリ上限（デフォルト `500`）
- `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間（デフォルト: `pruneAfter` と同じ、`false` でクリーンアップ無効）
- `maxDiskBytes`: 任意のセッションディレクトリ容量予算
- `highWaterBytes`: クリーンアップ後の任意の目標値（デフォルトは `maxDiskBytes` の `80%`）

通常の Gateway 書き込みは、プロセス内ミューテーションを実行時ファイルロックなしで直列化するストアごとのセッションライターを通ります。ホットパスのパッチヘルパーは、そのライタースロットを保持している間、検証済みの変更可能キャッシュを借用するため、大きな `sessions.json` ファイルがメタデータ更新ごとに複製または再読込されることはありません。実行時コードでは `updateSessionStore(...)` または `updateSessionStoreEntry(...)` を優先してください。直接のストア全体保存は、互換性およびオフラインメンテナンスツールです。Gateway に到達できる場合、非ドライランの `openclaw sessions cleanup` と `openclaw agents delete` は、ストアミューテーションを Gateway に委譲し、クリーンアップが同じライターキューに合流するようにします。`--store <path>` は、直接ファイルメンテナンス用の明示的なオフライン修復パスです。`maxEntries` クリーンアップは、本番サイズの上限でも引き続きバッチ処理されるため、次回の高水位クリーンアップで上限以下に書き戻されるまで、ストアが設定上限を一時的に超えることがあります。Gateway 起動中のセッションストア読み取りでは、エントリの枝刈りや上限制限は行われません。クリーンアップには、書き込みまたは `openclaw sessions cleanup --enforce` を使用してください。`openclaw sessions cleanup --enforce` は、設定された上限を即時に適用します。

メンテナンスは、グループセッションやスレッド単位のチャットセッションなど、永続的な外部会話ポインターを保持しますが、cron、フック、heartbeat、ACP、サブエージェント向けの合成実行時エントリは、設定された年齢、件数、またはディスク予算を超えた場合に削除されることがあります。

OpenClaw は、Gateway 書き込み中に自動的な `sessions.json.bak.*` ローテーションバックアップを作成しなくなりました。レガシーの `session.maintenance.rotateBytes` キーは無視され、`openclaw doctor --fix` は古い設定からそれを削除します。

トランスクリプトのミューテーションでは、トランスクリプトファイル上のセッション書き込みロックを使用します。ロック取得は、ビジーセッションエラーを表面化する前に `session.writeLock.acquireTimeoutMs` まで待機します。デフォルトは `60000` ms です。正当な準備、クリーンアップ、Compaction、またはトランスクリプトミラー処理が、遅いマシンでこれより長く競合する場合にのみ増やしてください。古いロックの検出と最大保持時間の警告は、引き続き別のポリシーです。

ディスク予算クリーンアップ（`mode: "enforce"`）の適用順序:

1. 最も古いアーカイブ、孤立トランスクリプト、または孤立トラジェクトリアーティファクトを最初に削除します。
2. まだ目標値を超えている場合は、最も古いセッションエントリとそのトランスクリプト/トラジェクトリファイルを削除します。
3. 使用量が `highWaterBytes` 以下になるまで続行します。

`mode: "warn"` では、OpenClaw は潜在的な削除を報告しますが、ストア/ファイルは変更しません。

必要に応じてメンテナンスを実行します。

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron セッションと実行ログ

分離された cron 実行もセッションエントリ/トランスクリプトを作成し、それらには専用の保持制御があります。

- `cron.sessionRetention`（デフォルト `24h`）は、古い分離 cron 実行セッションをセッションストアから枝刈りします（`false` で無効）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` は、`~/.openclaw/cron/runs/<jobId>.jsonl` ファイルを枝刈りします（デフォルト: `2_000_000` バイトおよび `2000` 行）。

cron が新しい分離実行セッションを強制作成する場合、新しい行を書き込む前に、以前の `cron:<jobId>` セッションエントリをサニタイズします。thinking/fast/verbose 設定、ラベル、明示的にユーザーが選択したモデル/認証の上書きなど、安全な設定は引き継ぎます。チャンネル/グループルーティング、送信またはキューポリシー、昇格、起点、ACP 実行時バインディングなどの周辺会話コンテキストは破棄するため、新しい分離実行が古い実行から古い配信権限や実行時権限を継承することはありません。

---

## セッションキー（`sessionKey`）

`sessionKey` は、自分がいる _会話バケット_（ルーティング + 分離）を識別します。

一般的なパターン:

- メイン/ダイレクトチャット（エージェントごと）: `agent:<agentId>:<mainKey>`（デフォルト `main`）
- グループ: `agent:<agentId>:<channel>:group:<id>`
- ルーム/チャンネル（Discord/Slack）: `agent:<agentId>:<channel>:channel:<id>` または `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>`（上書きされていない限り）

正規ルールは [/concepts/session](/ja-JP/concepts/session) に記載されています。

---

## セッション ID（`sessionId`）

各 `sessionKey` は、現在の `sessionId`（会話を継続するトランスクリプトファイル）を指します。

経験則:

- **リセット**（`/new`、`/reset`）は、その `sessionKey` に対して新しい `sessionId` を作成します。
- **日次リセット**（デフォルトでは Gateway ホストのローカル時刻で午前 4:00）は、リセット境界後の次のメッセージで新しい `sessionId` を作成します。
- **アイドル期限切れ**（`session.reset.idleMinutes` またはレガシーの `session.idleMinutes`）は、アイドル期間後にメッセージが到着すると新しい `sessionId` を作成します。日次とアイドルの両方が設定されている場合は、先に期限切れになった方が優先されます。
- **システムイベント**（heartbeat、cron ウェイクアップ、exec 通知、gateway ブックキーピング）はセッション行を変更することがありますが、日次/アイドルリセットの鮮度は延長しません。リセットロールオーバーは、新しいプロンプトが構築される前に、以前のセッション向けにキューされたシステムイベント通知を破棄します。
- **親フォークポリシー**は、スレッドまたはサブエージェントフォークを作成するときに PI のアクティブブランチを使用します。そのブランチが大きすぎる場合、OpenClaw は失敗したり使用不能な履歴を継承したりするのではなく、分離コンテキストで子を開始します。サイズ設定ポリシーは自動です。レガシーの `session.parentForkMaxTokens` 設定は `openclaw doctor --fix` によって削除されます。

実装詳細: この判断は `src/auto-reply/reply/session.ts` の `initSessionState()` で行われます。

---

## セッションストアスキーマ（`sessions.json`）

ストアの値型は `src/config/sessions.ts` の `SessionEntry` です。

主なフィールド（網羅的ではありません）:

- `sessionId`: 現在のトランスクリプト ID（`sessionFile` が設定されていない限り、ファイル名はこれから派生）
- `sessionStartedAt`: 現在の `sessionId` の開始タイムスタンプ。日次リセットの鮮度はこれを使用します。レガシー行では JSONL セッションヘッダーから派生する場合があります。
- `lastInteractionAt`: 最後の実ユーザー/チャンネル操作タイムスタンプ。アイドルリセットの鮮度はこれを使用するため、heartbeat、cron、exec イベントがセッションを存続させることはありません。このフィールドがないレガシー行では、アイドル鮮度について復元されたセッション開始時刻にフォールバックします。
- `updatedAt`: 最後のストア行ミューテーションタイムスタンプ。一覧表示、枝刈り、ブックキーピングに使用されます。日次/アイドルリセット鮮度の権威ではありません。
- `sessionFile`: 任意の明示的なトランスクリプトパス上書き
- `chatType`: `direct | group | room`（UI と送信ポリシーに役立つ）
- `provider`、`subject`、`room`、`space`、`displayName`: グループ/チャンネルラベル付け用のメタデータ
- トグル:
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（セッションごとの上書き）
- モデル選択:
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- トークンカウンター（ベストエフォート / プロバイダー依存）:
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`: このセッションキーで自動 Compaction が完了した回数
- `memoryFlushAt`: 最後の Compaction 前メモリフラッシュのタイムスタンプ
- `memoryFlushCompactionCount`: 最後のフラッシュ実行時の Compaction 回数

ストアは編集しても安全ですが、Gateway が権威です。セッションの実行に伴い、エントリを書き換えたり再ハイドレートしたりすることがあります。

---

## トランスクリプト構造（`*.jsonl`）

トランスクリプトは `@mariozechner/pi-coding-agent` の `SessionManager` によって管理されます。

ファイルは JSONL です。

- 最初の行: セッションヘッダー（`type: "session"`、`id`、`cwd`、`timestamp`、任意の `parentSession` を含む）
- 以降: `id` + `parentId` を持つセッションエントリ（ツリー）

注目すべきエントリタイプ:

- `message`: ユーザー/アシスタント/toolResult メッセージ
- `custom_message`: モデルコンテキストに入る、拡張機能が注入したメッセージ（UI から非表示にできる）
- `custom`: モデルコンテキストに入らない拡張機能状態
- `compaction`: `firstKeptEntryId` と `tokensBefore` を持つ永続化された Compaction 要約
- `branch_summary`: ツリーブランチ移動時の永続化された要約

OpenClaw は意図的にトランスクリプトを「修正」しません。Gateway は `SessionManager` を使用してそれらを読み書きします。

---

## コンテキストウィンドウと追跡トークン

重要な概念は 2 つあります。

1. **モデルコンテキストウィンドウ**: モデルごとのハード上限（モデルに見えるトークン）
2. **セッションストアカウンター**: `sessions.json` に書き込まれるローリング統計（/status とダッシュボードで使用）

制限を調整する場合:

- コンテキストウィンドウはモデルカタログから取得されます（設定で上書き可能）。
- ストア内の `contextTokens` は実行時の推定/報告値です。厳密な保証として扱わないでください。

詳細は [/token-use](/ja-JP/reference/token-use) を参照してください。

---

## Compaction: それは何か

Compaction は、古い会話をトランスクリプト内の永続化された `compaction` エントリに要約し、最近のメッセージをそのまま保持します。

Compaction 後、以後のターンでは以下が見えます。

- Compaction 要約
- `firstKeptEntryId` 以降のメッセージ

Compaction は（セッション枝刈りとは異なり）**永続的**です。[/concepts/session-pruning](/ja-JP/concepts/session-pruning) を参照してください。

## Compaction チャンク境界とツールのペアリング

OpenClaw が長いトランスクリプトを Compaction チャンクに分割するとき、assistant のツール呼び出しは対応する `toolResult` エントリとペアのまま保持されます。

- トークン比率による分割位置がツール呼び出しとその結果の間に来る場合、OpenClaw はペアを分離する代わりに、境界を assistant のツール呼び出しメッセージ側へ移動します。
- 末尾のツール結果ブロックによってチャンクが目標を超えてしまう場合でも、OpenClaw はその保留中のツールブロックを保持し、未要約の末尾をそのまま残します。
- 中止済みまたはエラーのツール呼び出しブロックは、保留中の分割を開いたままにしません。

---

## 自動 Compaction が発生するタイミング（Pi ランタイム）

組み込み Pi エージェントでは、自動 Compaction は次の 2 つの場合にトリガーされます。

1. **オーバーフロー回復**: モデルがコンテキストオーバーフローエラー（`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded`、および同様のプロバイダー形式のバリアント）を返す → compact → 再試行。
2. **しきい値メンテナンス**: 成功したターンの後、次の場合:

`contextTokens > contextWindow - reserveTokens`

ここで:

- `contextWindow` はモデルのコンテキストウィンドウ
- `reserveTokens` はプロンプト + 次のモデル出力用に予約されたヘッドルーム

これらは Pi ランタイムのセマンティクスです（OpenClaw はイベントを消費しますが、いつ compact するかは Pi が決定します）。

OpenClaw は、`agents.defaults.compaction.maxActiveTranscriptBytes` が設定され、アクティブなトランスクリプトファイルがそのサイズに達した場合、次の実行を開く前にプリフライトのローカル Compaction もトリガーできます。これはローカルでの再オープンコストに対するファイルサイズガードであり、生のアーカイブではありません。OpenClaw は通常の意味的 Compaction を引き続き実行し、圧縮された要約が新しい後続トランスクリプトになれるように `truncateAfterCompaction` を必要とします。

組み込み Pi 実行では、`agents.defaults.compaction.midTurnPrecheck.enabled: true` により、オプトインのツールループガードが追加されます。ツール結果が追加された後、次のモデル呼び出しの前に、OpenClaw はターン開始時と同じプリフライト予算ロジックを使ってプロンプト圧力を見積もります。コンテキストが収まらなくなっている場合、このガードは Pi の `transformContext` フック内では compact しません。構造化されたターン途中プリチェック信号を発行し、現在のプロンプト送信を停止し、外側の実行ループに既存の回復パスを使わせます。十分であれば過大なツール結果を切り詰め、そうでなければ設定された Compaction モードをトリガーして再試行します。このオプションはデフォルトで無効で、プロバイダー backed safeguard Compaction を含む `default` と `safeguard` の両方の Compaction モードで動作します。
これは `maxActiveTranscriptBytes` とは独立しています。バイトサイズガードはターンが開く前に実行される一方、ターン途中プリチェックは新しいツール結果が追加された後、組み込み Pi ツールループの後半で実行されます。

---

## Compaction 設定（`reserveTokens`、`keepRecentTokens`）

Pi の Compaction 設定は Pi 設定内にあります。

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw は組み込み実行に対して安全下限も適用します。

- `compaction.reserveTokens < reserveTokensFloor` の場合、OpenClaw は値を引き上げます。
- デフォルトの下限は `20000` トークンです。
- 下限を無効にするには `agents.defaults.compaction.reserveTokensFloor: 0` を設定します。
- すでにそれより高い場合、OpenClaw はそのままにします。
- 手動 `/compact` は明示的な `agents.defaults.compaction.keepRecentTokens` を尊重し、Pi の直近末尾の切断位置を維持します。明示的な保持予算がない場合、手動 Compaction はハードチェックポイントのままで、再構築されたコンテキストは新しい要約から始まります。
- 新しいツール結果の後、次のモデル呼び出しの前にオプションのツールループプリチェックを実行するには、`agents.defaults.compaction.midTurnPrecheck.enabled: true` を設定します。これはトリガーのみです。要約生成は引き続き設定された Compaction パスを使います。これはターン開始時のアクティブトランスクリプトのバイトサイズガードである `maxActiveTranscriptBytes` とは独立しています。
- アクティブなトランスクリプトが大きくなったときにターン前のローカル Compaction を実行するには、`agents.defaults.compaction.maxActiveTranscriptBytes` をバイト値、または `"20mb"` のような文字列に設定します。このガードは `truncateAfterCompaction` も有効な場合にのみ有効です。無効にするには未設定のままにするか、`0` を設定します。
- `agents.defaults.compaction.truncateAfterCompaction` が有効な場合、OpenClaw は Compaction 後にアクティブなトランスクリプトを圧縮済みの後続 JSONL へローテートします。古い完全なトランスクリプトは、その場で書き換えられる代わりにアーカイブされたまま残り、Compaction チェックポイントからリンクされます。

理由: Compaction が避けられなくなる前に、複数ターンの「ハウスキーピング」（メモリ書き込みなど）に十分なヘッドルームを残すためです。

実装: `src/agents/pi-settings.ts` の `ensurePiCompactionReserveTokens()`
（`src/agents/pi-embedded-runner.ts` から呼び出されます）。

---

## プラガブルな Compaction プロバイダー

Plugin は、Plugin API の `registerCompactionProvider()` を介して Compaction プロバイダーを登録できます。`agents.defaults.compaction.provider` が登録済みプロバイダー ID に設定されている場合、safeguard Plugin は組み込みの `summarizeInStages` パイプラインではなく、そのプロバイダーへ要約を委譲します。

- `provider`: 登録済み Compaction プロバイダー Plugin の ID。デフォルトの LLM 要約を使う場合は未設定のままにします。
- `provider` を設定すると、`mode: "safeguard"` が強制されます。
- プロバイダーは、組み込みパスと同じ Compaction 指示と識別子保持ポリシーを受け取ります。
- safeguard は、プロバイダー出力後も直近ターンと分割ターンのサフィックスコンテキストを保持します。
- 組み込みの safeguard 要約は、以前の要約全文をそのまま保持するのではなく、新しいメッセージとともに以前の要約を再蒸留します。
- safeguard モードでは、要約品質監査がデフォルトで有効になります。形式不正出力時の再試行動作をスキップするには `qualityGuard.enabled: false` を設定します。
- プロバイダーが失敗するか空の結果を返した場合、OpenClaw は自動的に組み込み LLM 要約へフォールバックします。
- 中止/タイムアウト信号は、呼び出し元のキャンセルを尊重するため、握りつぶされず再スローされます。

ソース: `src/plugins/compaction-provider.ts`、`src/agents/pi-hooks/compaction-safeguard.ts`。

---

## ユーザーに見えるサーフェス

Compaction とセッション状態は次の方法で確認できます。

- `/status`（任意のチャットセッション内）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- 詳細モード: `🧹 Auto-compaction complete` + Compaction 回数

---

## サイレントハウスキーピング（`NO_REPLY`）

OpenClaw は、ユーザーに中間出力を表示すべきではないバックグラウンドタスク向けに「サイレント」ターンをサポートします。

規約:

- assistant は、正確なサイレントトークン `NO_REPLY` / `no_reply` で出力を開始し、「ユーザーへ返信を配信しない」ことを示します。
- OpenClaw は配信レイヤーでこれを除去/抑制します。
- 正確なサイレントトークンの抑制は大文字小文字を区別しないため、ペイロード全体がサイレントトークンだけの場合、`NO_REPLY` と `no_reply` の両方が該当します。
- これは真のバックグラウンド/非配信ターン専用です。通常の実行可能なユーザーリクエストの近道ではありません。

`2026.1.10` 時点で、OpenClaw は部分チャンクが `NO_REPLY` で始まる場合、**下書き/入力中ストリーミング** も抑制します。そのため、サイレント操作でターン途中の部分出力が漏れることはありません。

---

## Compaction 前の「メモリフラッシュ」（実装済み）

目標: 自動 Compaction が発生する前に、永続状態をディスクへ書き込むサイレントなエージェントターンを実行します（例: エージェントワークスペース内の `memory/YYYY-MM-DD.md`）。これにより、Compaction が重要なコンテキストを消してしまうことを防ぎます。

OpenClaw は **事前しきい値フラッシュ** アプローチを使います。

1. セッションのコンテキスト使用量を監視します。
2. Pi の Compaction しきい値より低い「ソフトしきい値」を超えたら、エージェントにサイレントな「今すぐメモリを書き込む」指示を実行します。
3. 正確なサイレントトークン `NO_REPLY` / `no_reply` を使い、ユーザーには何も表示されないようにします。

設定（`agents.defaults.compaction.memoryFlush`）:

- `enabled`（デフォルト: `true`）
- `model`（フラッシュターン用の任意の正確なプロバイダー/モデル上書き。例: `ollama/qwen3:8b`）
- `softThresholdTokens`（デフォルト: `4000`）
- `prompt`（フラッシュターン用のユーザーメッセージ）
- `systemPrompt`（フラッシュターン用に追加される追加システムプロンプト）

注:

- デフォルトのプロンプト/システムプロンプトには、配信を抑制するための `NO_REPLY` ヒントが含まれます。
- `model` が設定されている場合、フラッシュターンはアクティブセッションのフォールバックチェーンを継承せずにそのモデルを使用します。そのため、ローカル専用のハウスキーピングが有料の会話モデルへ暗黙にフォールバックすることはありません。
- フラッシュは Compaction サイクルごとに 1 回実行されます（`sessions.json` で追跡されます）。
- フラッシュは組み込み Pi セッションでのみ実行されます（CLI バックエンドではスキップされます）。
- セッションワークスペースが読み取り専用（`workspaceAccess: "ro"` または `"none"`）の場合、フラッシュはスキップされます。
- ワークスペースのファイルレイアウトと書き込みパターンについては、[メモリ](/ja-JP/concepts/memory) を参照してください。

Pi は Plugin API で `session_before_compact` フックも公開していますが、OpenClaw のフラッシュロジックは現在 Gateway 側にあります。

---

## トラブルシューティングチェックリスト

- セッションキーが間違っていますか？[/concepts/session](/ja-JP/concepts/session) から始め、`/status` の `sessionKey` を確認してください。
- ストアとトランスクリプトが一致しませんか？`openclaw status` から Gateway ホストとストアパスを確認してください。
- Compaction が大量に発生しますか？確認してください:
  - モデルのコンテキストウィンドウ（小さすぎる）
  - Compaction 設定（`reserveTokens` がモデルウィンドウに対して高すぎると、より早い Compaction の原因になります）
  - ツール結果の肥大化: セッション pruning を有効化/調整してください
- サイレントターンが漏れていますか？返信が `NO_REPLY`（大文字小文字を区別しない正確なトークン）で始まっていること、およびストリーミング抑制修正を含むビルドを使っていることを確認してください。

## 関連

- [セッション管理](/ja-JP/concepts/session)
- [セッション pruning](/ja-JP/concepts/session-pruning)
- [コンテキストエンジン](/ja-JP/concepts/context-engine)
