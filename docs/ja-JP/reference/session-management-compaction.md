---
read_when:
    - セッション ID、トランスクリプト JSONL、または sessions.json フィールドをデバッグする必要がある
    - 自動 Compaction の動作を変更する、または「Compaction 前」の整理処理を追加する場合
    - メモリのフラッシュまたはサイレントなシステムターンを実装したい場合
summary: '詳細解説: セッションストア + トランスクリプト、ライフサイクル、(自動)Compaction の内部構造'
title: セッション管理の詳細解説
x-i18n:
    generated_at: "2026-05-06T05:18:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ade29b83c2b3857c52e56275ed11c5b1f3cd07050ba9f35ea49ad427efcc39d
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw は以下の領域にわたってセッションをエンドツーエンドで管理します。

- **セッションルーティング**（受信メッセージを `sessionKey` に対応付ける方法）
- **セッションストア**（`sessions.json`）とそれが追跡する内容
- **トランスクリプト永続化**（`*.jsonl`）とその構造
- **トランスクリプトの衛生管理**（実行前のプロバイダー固有の補正）
- **コンテキスト制限**（コンテキストウィンドウと追跡トークン）
- **Compaction**（手動および自動 Compaction）と Compaction 前の作業をフックする場所
- **サイレントなハウスキーピング**（ユーザーに見える出力を生成すべきでないメモリ書き込み）

先により高レベルな概要を確認したい場合は、以下から始めてください。

- [セッション管理](/ja-JP/concepts/session)
- [Compaction](/ja-JP/concepts/compaction)
- [メモリ概要](/ja-JP/concepts/memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [セッションの枝刈り](/ja-JP/concepts/session-pruning)
- [トランスクリプトの衛生管理](/ja-JP/reference/transcript-hygiene)

---

## 信頼できる情報源: Gateway

OpenClaw は、セッション状態を所有する単一の **Gateway プロセス**を中心に設計されています。

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
   - ツリー構造を持つ追記専用トランスクリプト（エントリには `id` + `parentId` がある）
   - 実際の会話 + ツール呼び出し + Compaction サマリーを保存
   - 将来のターンでモデルコンテキストを再構築するために使用
   - アクティブなトランスクリプトがチェックポイントサイズ上限を超えると、大きな Compaction 前デバッグチェックポイントはスキップされ、2 つ目の巨大な `.checkpoint.*.jsonl` コピーを避けます。

Gateway の履歴リーダーは、そのサーフェスが任意の履歴アクセスを明示的に必要としない限り、トランスクリプト全体の実体化を避ける必要があります。最初のページの履歴、埋め込みチャット履歴、再起動復旧、トークン/使用量チェックでは、境界付きの末尾読み取りを使用します。完全なトランスクリプトスキャンは非同期トランスクリプトインデックスを経由し、これはファイルパスに `mtimeMs`/`size` を加えた値でキャッシュされ、同時リーダー間で共有されます。

---

## ディスク上の場所

Gateway ホスト上で、エージェントごとに:

- ストア: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- トランスクリプト: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram トピックセッション: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw はこれらを `src/config/sessions.ts` 経由で解決します。

---

## ストアメンテナンスとディスク制御

セッション永続化には、`sessions.json`、トランスクリプト成果物、trajectory サイドカー向けの自動メンテナンス制御（`session.maintenance`）があります。

- `mode`: `warn`（デフォルト）または `enforce`
- `pruneAfter`: 古いエントリの経過時間のしきい値（デフォルト `30d`）
- `maxEntries`: `sessions.json` 内のエントリ上限（デフォルト `500`）
- `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間（デフォルト: `pruneAfter` と同じ、`false` でクリーンアップ無効）
- `maxDiskBytes`: 任意のセッションディレクトリ容量上限
- `highWaterBytes`: クリーンアップ後の任意の目標値（デフォルトは `maxDiskBytes` の `80%`）

通常の Gateway 書き込みは、インプロセスの変更を直列化するストア単位のセッションライターを経由し、実行時ファイルロックは取得しません。ホットパスのパッチヘルパーは、そのライタースロットを保持している間に検証済みの変更可能キャッシュを借用するため、大きな `sessions.json` ファイルがメタデータ更新ごとに複製されたり再読み込みされたりすることはありません。ランタイムコードでは `updateSessionStore(...)` または `updateSessionStoreEntry(...)` を優先してください。ストア全体の直接保存は、互換性とオフラインメンテナンス用のツールです。Gateway に到達できる場合、非ドライランの `openclaw sessions cleanup` と `openclaw agents delete` はストア変更を Gateway に委譲し、クリーンアップが同じライターキューに参加するようにします。`--store <path>` は、直接ファイルメンテナンス用の明示的なオフライン修復パスです。`maxEntries` クリーンアップは本番規模の上限でも引き続きバッチ処理されるため、次の高水位クリーンアップで上限以下に書き戻されるまで、ストアが設定済み上限を一時的に超える場合があります。セッションストアの読み取りは、Gateway 起動中にエントリの枝刈りや上限制御を行いません。クリーンアップには、書き込みまたは `openclaw sessions cleanup --enforce` を使用してください。`openclaw sessions cleanup --enforce` は、ディスク容量上限が設定されていない場合でも、設定済みの上限を即座に適用し、古い未参照のトランスクリプト、チェックポイント、trajectory 成果物を枝刈りします。

メンテナンスは、グループセッションやスレッドスコープのチャットセッションなど、永続的な外部会話ポインターを保持しますが、cron、フック、heartbeat、ACP、サブエージェント用の合成ランタイムエントリは、設定された経過時間、件数、またはディスク容量上限を超えた場合に削除されることがあります。

OpenClaw は、Gateway 書き込み中に自動的な `sessions.json.bak.*` ローテーションバックアップを作成しなくなりました。レガシーの `session.maintenance.rotateBytes` キーは無視され、`openclaw doctor --fix` は古い設定からそれを削除します。

トランスクリプト変更では、トランスクリプトファイル上のセッション書き込みロックを使用します。ロック取得は、ビジーセッションエラーを表示する前に最大 `session.writeLock.acquireTimeoutMs` まで待機します。デフォルトは `60000` ms です。正当な準備、クリーンアップ、Compaction、またはトランスクリプトミラー作業が低速なマシンでより長く競合する場合にのみ、これを引き上げてください。古いロックの検出と最大保持時間の警告は、引き続き別個のポリシーです。

ディスク容量上限クリーンアップ（`mode: "enforce"`）の適用順序:

1. 最初に、最も古いアーカイブ済み成果物、孤立トランスクリプト成果物、または孤立 trajectory 成果物を削除します。
2. それでも目標値を超えている場合は、最も古いセッションエントリとそのトランスクリプト/trajectory ファイルを退避します。
3. 使用量が `highWaterBytes` 以下になるまで続行します。

`mode: "warn"` では、OpenClaw は発生し得る退避を報告しますが、ストア/ファイルは変更しません。

必要に応じてメンテナンスを実行します。

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron セッションと実行ログ

分離された cron 実行もセッションエントリ/トランスクリプトを作成し、専用の保持制御があります。

- `cron.sessionRetention`（デフォルト `24h`）は、古い分離 cron 実行セッションをセッションストアから枝刈りします（`false` で無効）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` は、`~/.openclaw/cron/runs/<jobId>.jsonl` ファイルを枝刈りします（デフォルト: `2_000_000` バイトと `2000` 行）。

cron が新しい分離実行セッションを強制作成すると、新しい行を書き込む前に、以前の `cron:<jobId>` セッションエントリをサニタイズします。thinking/fast/verbose 設定、ラベル、明示的にユーザーが選択したモデル/auth オーバーライドなどの安全な設定は引き継ぎます。channel/group ルーティング、送信またはキューポリシー、elevation、origin、ACP ランタイムバインディングなどの周辺会話コンテキストは削除されるため、新しい分離実行が古い実行から古い配信権限やランタイム権限を継承することはありません。

---

## セッションキー（`sessionKey`）

`sessionKey` は、自分が_どの会話バケット_にいるか（ルーティング + 分離）を識別します。

一般的なパターン:

- メイン/ダイレクトチャット（エージェントごと）: `agent:<agentId>:<mainKey>`（デフォルト `main`）
- グループ: `agent:<agentId>:<channel>:group:<id>`
- ルーム/チャンネル（Discord/Slack）: `agent:<agentId>:<channel>:channel:<id>` または `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>`（オーバーライドされていない場合）

正規のルールは [/concepts/session](/ja-JP/concepts/session) に記載されています。

---

## セッション ID（`sessionId`）

各 `sessionKey` は、現在の `sessionId`（会話を継続するトランスクリプトファイル）を指します。

経験則:

- **リセット**（`/new`、`/reset`）は、その `sessionKey` に対して新しい `sessionId` を作成します。
- **日次リセット**（デフォルトでは Gateway ホストのローカル時刻で午前 4:00）は、リセット境界後の次のメッセージで新しい `sessionId` を作成します。
- **アイドル期限切れ**（`session.reset.idleMinutes` またはレガシー `session.idleMinutes`）は、アイドル時間枠の後にメッセージが届いたときに新しい `sessionId` を作成します。日次 + アイドルの両方が設定されている場合は、先に期限切れになった方が優先されます。
- **システムイベント**（heartbeat、cron wakeup、exec 通知、gateway ブックキーピング）はセッション行を変更する場合がありますが、日次/アイドルリセットの鮮度は延長しません。リセットのロールオーバーでは、新しいプロンプトが構築される前に、前のセッション向けのキュー済みシステムイベント通知が破棄されます。
- **親フォークポリシー**は、スレッドまたはサブエージェントフォークを作成するときに PI のアクティブブランチを使用します。そのブランチが大きすぎる場合、OpenClaw は失敗したり使用不能な履歴を継承したりする代わりに、分離コンテキストで子を開始します。サイズ調整ポリシーは自動です。レガシーの `session.parentForkMaxTokens` 設定は `openclaw doctor --fix` によって削除されます。

実装詳細: この判断は `src/auto-reply/reply/session.ts` の `initSessionState()` で行われます。

---

## セッションストアスキーマ（`sessions.json`）

ストアの値型は `src/config/sessions.ts` の `SessionEntry` です。

主なフィールド（網羅的ではありません）:

- `sessionId`: 現在のトランスクリプト ID（`sessionFile` が設定されていない限り、ファイル名はこれから派生）
- `sessionStartedAt`: 現在の `sessionId` の開始タイムスタンプ。日次リセットの鮮度はこれを使用します。レガシー行では、JSONL セッションヘッダーから派生する場合があります。
- `lastInteractionAt`: 最後の実ユーザー/チャンネルインタラクションのタイムスタンプ。アイドルリセットの鮮度はこれを使用するため、heartbeat、cron、exec イベントがセッションを維持することはありません。このフィールドがないレガシー行では、復旧されたセッション開始時刻をアイドル鮮度のフォールバックとして使用します。
- `updatedAt`: 最後のストア行変更タイムスタンプ。一覧表示、枝刈り、ブックキーピングに使用されます。これは日次/アイドルリセット鮮度の権威ではありません。
- `sessionFile`: 任意の明示的なトランスクリプトパスオーバーライド
- `chatType`: `direct | group | room`（UI と送信ポリシーを補助）
- `provider`, `subject`, `room`, `space`, `displayName`: グループ/チャンネルラベル付け用のメタデータ
- トグル:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy`（セッション単位のオーバーライド）
- モデル選択:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- トークンカウンター（ベストエフォート / プロバイダー依存）:
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: このセッションキーで自動 Compaction が完了した回数
- `memoryFlushAt`: 最後の Compaction 前メモリフラッシュのタイムスタンプ
- `memoryFlushCompactionCount`: 最後のフラッシュが実行されたときの Compaction 回数

ストアは編集しても安全ですが、Gateway が権威です。セッション実行中にエントリを書き直したり、再ハイドレートしたりする場合があります。

---

## トランスクリプト構造（`*.jsonl`）

トランスクリプトは `@mariozechner/pi-coding-agent` の `SessionManager` によって管理されます。

ファイルは JSONL です。

- 1 行目: セッションヘッダー（`type: "session"`、`id`、`cwd`、`timestamp`、任意の `parentSession` を含む）
- 以降: `id` + `parentId` を持つセッションエントリ（ツリー）

注目すべきエントリタイプ:

- `message`: ユーザー/アシスタント/toolResult メッセージ
- `custom_message`: モデルコンテキストに_入る_拡張注入メッセージ（UI から非表示にできる）
- `custom`: モデルコンテキストに_入らない_拡張状態
- `compaction`: `firstKeptEntryId` と `tokensBefore` を持つ永続化された Compaction サマリー
- `branch_summary`: ツリーブランチを移動するときの永続化されたサマリー

OpenClaw は意図的にトランスクリプトを「補正」しません。Gateway は `SessionManager` を使用してそれらを読み書きします。

---

## コンテキストウィンドウと追跡トークン

重要な概念は 2 つあります。

1. **モデルコンテキストウィンドウ**: モデルごとのハード上限（モデルから見えるトークン）
2. **セッションストアカウンター**: `sessions.json` に書き込まれるローリング統計（/status とダッシュボードで使用）

制限を調整している場合:

- コンテキストウィンドウはモデルカタログから取得されます（設定でオーバーライド可能）。
- ストア内の `contextTokens` はランタイムの推定/報告値です。厳密な保証として扱わないでください。

詳細は [/token-use](/ja-JP/reference/token-use) を参照してください。

---

## Compaction: それは何か

Compaction は、古い会話をトランスクリプト内の永続化された `compaction` エントリに要約し、最近のメッセージをそのまま保持します。

Compaction 後、将来のターンには以下が見えます。

- Compaction サマリー
- `firstKeptEntryId` 以降のメッセージ

Compaction は **永続的** です（セッション pruning とは異なります）。[/concepts/session-pruning](/ja-JP/concepts/session-pruning) を参照してください。

## Compaction チャンク境界とツールのペアリング

OpenClaw が長いトランスクリプトを Compaction チャンクに分割するとき、assistant のツール呼び出しは対応する `toolResult` エントリとペアのまま保持されます。

- トークン比率による分割位置がツール呼び出しとその結果の間に来る場合、OpenClaw はそのペアを分離するのではなく、境界を assistant のツール呼び出しメッセージまで移動します。
- 末尾のツール結果ブロックによってチャンクが目標を超えてしまう場合でも、OpenClaw はその保留中のツールブロックを保持し、未要約の末尾をそのまま保ちます。
- 中断またはエラーになったツール呼び出しブロックは、保留中の分割を開いたままにはしません。

---

## 自動 Compaction が発生するタイミング（Pi ランタイム）

埋め込み Pi エージェントでは、自動 Compaction は次の 2 つの場合にトリガーされます。

1. **オーバーフロー回復**: モデルがコンテキストオーバーフローエラー（`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded`、および同様のプロバイダー形式のバリアント）を返す → compact → 再試行。
2. **しきい値メンテナンス**: ターンが成功した後、次の場合:

`contextTokens > contextWindow - reserveTokens`

ここで:

- `contextWindow` はモデルのコンテキストウィンドウ
- `reserveTokens` はプロンプト + 次のモデル出力のために予約された余裕

これらは Pi ランタイムのセマンティクスです（OpenClaw はイベントを消費しますが、いつ compact するかは Pi が決定します）。

OpenClaw は、`agents.defaults.compaction.maxActiveTranscriptBytes` が設定されていて、アクティブなトランスクリプトファイルがそのサイズに達した場合、次の実行を開く前にプリフライトのローカル Compaction をトリガーすることもできます。これはローカルでの再オープンコストに対するファイルサイズガードであり、生のアーカイブではありません。OpenClaw は引き続き通常のセマンティック Compaction を実行し、compact 済みサマリーが新しい後続トランスクリプトになれるように `truncateAfterCompaction` が必要です。

埋め込み Pi 実行では、`agents.defaults.compaction.midTurnPrecheck.enabled: true` によって、オプトインのツールループガードが追加されます。ツール結果が追加された後、次のモデル呼び出しの前に、OpenClaw はターン開始時に使用するものと同じプリフライト予算ロジックでプロンプトの圧力を見積もります。コンテキストが収まらなくなった場合、このガードは Pi の `transformContext` フック内では compact しません。構造化された mid-turn precheck シグナルを発行し、現在のプロンプト送信を停止して、外側の実行ループに既存の回復パスを使わせます。つまり、それで十分な場合は過大なツール結果を切り詰め、そうでなければ設定済みの Compaction モードをトリガーして再試行します。このオプションはデフォルトで無効で、`default` と `safeguard` の両方の Compaction モードで機能します。プロバイダー支援の safeguard Compaction も含まれます。
これは `maxActiveTranscriptBytes` とは独立しています。バイトサイズガードはターンが開く前に実行されますが、mid-turn precheck は新しいツール結果が追加された後、埋め込み Pi ツールループ内で後から実行されます。

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

OpenClaw は埋め込み実行に対して安全用の下限も適用します。

- `compaction.reserveTokens < reserveTokensFloor` の場合、OpenClaw はそれを引き上げます。
- デフォルトの下限は `20000` トークンです。
- 下限を無効化するには `agents.defaults.compaction.reserveTokensFloor: 0` を設定します。
- すでにそれより高い場合、OpenClaw はそのままにします。
- 手動の `/compact` は明示的な `agents.defaults.compaction.keepRecentTokens` を尊重し、Pi の recent-tail カットポイントを維持します。明示的な保持予算がない場合、手動 Compaction はハードチェックポイントのままで、再構築されたコンテキストは新しいサマリーから開始されます。
- 新しいツール結果の後、次のモデル呼び出しの前に任意のツールループ precheck を実行するには、`agents.defaults.compaction.midTurnPrecheck.enabled: true` を設定します。これはトリガーのみです。サマリー生成は引き続き設定済みの Compaction パスを使用します。これは、ターン開始時のアクティブトランスクリプトのバイトサイズガードである `maxActiveTranscriptBytes` とは独立しています。
- アクティブなトランスクリプトが大きくなったとき、ターンの前にローカル Compaction を実行するには、`agents.defaults.compaction.maxActiveTranscriptBytes` にバイト値または `"20mb"` のような文字列を設定します。このガードは `truncateAfterCompaction` も有効な場合にのみ有効です。無効化するには未設定のままにするか `0` を設定します。
- `agents.defaults.compaction.truncateAfterCompaction` が有効な場合、OpenClaw は Compaction 後にアクティブなトランスクリプトを compact 済みの後続 JSONL にローテートします。古い完全なトランスクリプトは、その場で書き換えられるのではなく、アーカイブされたまま Compaction チェックポイントからリンクされます。

理由: Compaction が避けられなくなる前に、複数ターンの「ハウスキーピング」（メモリ書き込みなど）のための十分な余裕を残すためです。

実装: `src/agents/pi-settings.ts` の `ensurePiCompactionReserveTokens()`
（`src/agents/pi-embedded-runner.ts` から呼び出されます）。

---

## プラグ可能な Compaction プロバイダー

Plugin は Plugin API の `registerCompactionProvider()` を通じて Compaction プロバイダーを登録できます。`agents.defaults.compaction.provider` が登録済みプロバイダー ID に設定されている場合、safeguard 拡張は組み込みの `summarizeInStages` パイプラインではなく、そのプロバイダーに要約を委譲します。

- `provider`: 登録済み Compaction プロバイダー Plugin の ID。デフォルトの LLM 要約を使う場合は未設定のままにします。
- `provider` を設定すると、`mode: "safeguard"` が強制されます。
- プロバイダーは、組み込みパスと同じ Compaction 指示と識別子保持ポリシーを受け取ります。
- safeguard は、プロバイダー出力の後でも recent-turn と split-turn の suffix コンテキストを保持します。
- 組み込みの safeguard 要約は、以前のサマリー全体をそのまま保持するのではなく、新しいメッセージとともに過去のサマリーを再蒸留します。
- safeguard モードではサマリー品質監査がデフォルトで有効になります。形式不正な出力で再試行する動作をスキップするには、`qualityGuard.enabled: false` を設定します。
- プロバイダーが失敗した場合、または空の結果を返した場合、OpenClaw は自動的に組み込みの LLM 要約へフォールバックします。
- 中断またはタイムアウトのシグナルは、呼び出し元のキャンセルを尊重するために再スローされます（握りつぶされません）。

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

OpenClaw は、ユーザーに中間出力を見せるべきではないバックグラウンドタスク向けに「サイレント」ターンをサポートします。

規約:

- assistant は出力を正確なサイレントトークン `NO_REPLY` / `no_reply` で開始し、「ユーザーに返信を届けない」ことを示します。
- OpenClaw は配信レイヤーでこれを除去または抑制します。
- 正確なサイレントトークンの抑制は大文字小文字を区別しないため、ペイロード全体がサイレントトークンだけの場合、`NO_REPLY` と `no_reply` はどちらも対象になります。
- これは本当にバックグラウンドで配信不要なターン専用です。通常の実行可能なユーザー要求の近道ではありません。

`2026.1.10` 時点で、OpenClaw は部分チャンクが `NO_REPLY` で始まる場合、**ドラフト/入力中ストリーミング** も抑制するため、サイレント操作がターン途中で部分出力を漏らすことはありません。

---

## Compaction 前の「メモリフラッシュ」（実装済み）

目標: 自動 Compaction が発生する前に、永続的な状態をディスク（例: エージェントワークスペース内の `memory/YYYY-MM-DD.md`）へ書き込むサイレントなエージェントターンを実行し、Compaction が重要なコンテキストを消せないようにします。

OpenClaw は **pre-threshold flush** アプローチを使用します。

1. セッションコンテキスト使用量を監視します。
2. それが「ソフトしきい値」（Pi の Compaction しきい値より下）を超えたら、エージェントに対してサイレントな「今すぐメモリを書き込む」指示を実行します。
3. 正確なサイレントトークン `NO_REPLY` / `no_reply` を使用し、ユーザーには何も表示されないようにします。

設定（`agents.defaults.compaction.memoryFlush`）:

- `enabled`（デフォルト: `true`）
- `model`（フラッシュターン用の任意の正確なプロバイダー/モデル上書き。例: `ollama/qwen3:8b`）
- `softThresholdTokens`（デフォルト: `4000`）
- `prompt`（フラッシュターン用のユーザーメッセージ）
- `systemPrompt`（フラッシュターン用に追加される追加システムプロンプト）

注記:

- デフォルトのプロンプト/システムプロンプトには、配信を抑制するための `NO_REPLY` ヒントが含まれます。
- `model` が設定されている場合、フラッシュターンはアクティブセッションのフォールバックチェーンを継承せずにそのモデルを使用するため、ローカル専用のハウスキーピングが有料の会話モデルへ暗黙にフォールバックすることはありません。
- フラッシュは Compaction サイクルごとに 1 回実行されます（`sessions.json` で追跡）。
- フラッシュは埋め込み Pi セッションでのみ実行されます（CLI バックエンドではスキップされます）。
- セッションワークスペースが読み取り専用（`workspaceAccess: "ro"` または `"none"`）の場合、フラッシュはスキップされます。
- ワークスペースのファイルレイアウトと書き込みパターンについては、[Memory](/ja-JP/concepts/memory) を参照してください。

Pi は拡張 API で `session_before_compact` フックも公開していますが、OpenClaw のフラッシュロジックは現時点では Gateway 側にあります。

---

## トラブルシューティングチェックリスト

- セッションキーが間違っていますか？[/concepts/session](/ja-JP/concepts/session) から始めて、`/status` の `sessionKey` を確認してください。
- ストアとトランスクリプトが一致しませんか？`openclaw status` で Gateway ホストとストアパスを確認してください。
- Compaction が頻発していますか？以下を確認してください。
  - モデルのコンテキストウィンドウ（小さすぎる）
  - Compaction 設定（`reserveTokens` がモデルウィンドウに対して高すぎると、より早い Compaction の原因になることがあります）
  - ツール結果の肥大化: セッション pruning を有効化または調整してください
- サイレントターンが漏れていますか？返信が `NO_REPLY`（大文字小文字を区別しない正確なトークン）で始まっていること、およびストリーミング抑制修正を含むビルドを使用していることを確認してください。

## 関連

- [セッション管理](/ja-JP/concepts/session)
- [セッション pruning](/ja-JP/concepts/session-pruning)
- [コンテキストエンジン](/ja-JP/concepts/context-engine)
