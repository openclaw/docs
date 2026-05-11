---
read_when:
    - セッションID、トランスクリプト JSONL、または sessions.json のフィールドをデバッグする必要がある
    - 自動Compactionの動作を変更している、または「pre-Compaction」の整理処理を追加している
    - メモリのフラッシュまたはサイレントなシステムターンを実装したい場合
summary: '詳細解説: セッションストア + トランスクリプト、ライフサイクル、（自動）Compaction の内部構造'
title: セッション管理の詳細解説
x-i18n:
    generated_at: "2026-05-11T20:37:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ed30f6b1943b2ed5808c5ccdd593e6899e10fb7f75ff5911e6a9623a30ed6be
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw は、以下の領域にわたってセッションをエンドツーエンドで管理します。

- **セッションルーティング** (受信メッセージを `sessionKey` に対応付ける方法)
- **セッションストア** (`sessions.json`) と、それが追跡する内容
- **トランスクリプトの永続化** (`*.jsonl`) とその構造
- **トランスクリプト衛生** (実行前のプロバイダー固有の修正)
- **コンテキスト制限** (コンテキストウィンドウと追跡トークン)
- **Compaction** (手動および自動 Compaction) と、Compaction 前処理をフックする場所
- **サイレントハウスキーピング** (ユーザーに見える出力を生成すべきではないメモリ書き込み)

先に上位レベルの概要を確認したい場合は、次から始めてください。

- [セッション管理](/ja-JP/concepts/session)
- [Compaction](/ja-JP/concepts/compaction)
- [メモリ概要](/ja-JP/concepts/memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [セッション枝刈り](/ja-JP/concepts/session-pruning)
- [トランスクリプト衛生](/ja-JP/reference/transcript-hygiene)

---

## 信頼できる情報源: Gateway

OpenClaw は、セッション状態を所有する単一の **Gateway プロセス** を中心に設計されています。

- UI (macOS アプリ、Web コントロール UI、TUI) は、セッション一覧とトークン数を Gateway に問い合わせる必要があります。
- リモートモードでは、セッションファイルはリモートホスト上にあります。「ローカル Mac ファイルを確認する」だけでは、Gateway が使用している内容は反映されません。

---

## 2 つの永続化レイヤー

OpenClaw はセッションを 2 つのレイヤーで永続化します。

1. **セッションストア (`sessions.json`)**
   - キー/値マップ: `sessionKey -> SessionEntry`
   - 小さく、変更可能で、編集 (またはエントリ削除) しても安全
   - セッションメタデータ (現在のセッション ID、最終アクティビティ、トグル、トークンカウンターなど) を追跡します

2. **トランスクリプト (`<sessionId>.jsonl`)**
   - ツリー構造を持つ追記専用トランスクリプト (エントリには `id` + `parentId` があります)
   - 実際の会話 + ツール呼び出し + Compaction サマリーを保存します
   - 将来のターンでモデルコンテキストを再構築するために使用されます
   - アクティブなトランスクリプトがチェックポイントサイズ上限を超えると、大きな Compaction 前デバッグチェックポイントはスキップされ、
     2 つ目の巨大な `.checkpoint.*.jsonl` コピーを避けます。

Gateway の履歴リーダーは、そのサーフェスが任意の履歴アクセスを明示的に必要とする場合を除き、
トランスクリプト全体の実体化を避ける必要があります。最初のページの履歴、
埋め込みチャット履歴、再起動復旧、トークン/使用量チェックは、制限付きの末尾読み取りを使用します。
トランスクリプト全体のスキャンは非同期トランスクリプトインデックスを経由します。このインデックスは
ファイルパスと `mtimeMs`/`size` によってキャッシュされ、並行するリーダー間で共有されます。

---

## ディスク上の場所

Gateway ホスト上で、エージェントごとに次の場所です。

- ストア: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- トランスクリプト: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram トピックセッション: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw は、これらを `src/config/sessions.ts` 経由で解決します。

---

## ストアメンテナンスとディスク制御

セッション永続化には、`sessions.json`、トランスクリプト成果物、trajectory サイドカー向けの自動メンテナンス制御 (`session.maintenance`) があります。

- `mode`: `warn` (デフォルト) または `enforce`
- `pruneAfter`: 古いエントリの経過時間カットオフ (デフォルト `30d`)
- `maxEntries`: `sessions.json` 内のエントリ上限 (デフォルト `500`)
- `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間 (デフォルト: `pruneAfter` と同じ。`false` でクリーンアップを無効化)
- `maxDiskBytes`: 任意のセッションディレクトリ予算
- `highWaterBytes`: クリーンアップ後の任意の目標値 (デフォルトは `maxDiskBytes` の `80%`)

通常の Gateway 書き込みは、ランタイムファイルロックを取得せず、プロセス内の変更を直列化するストアごとのセッションライターを経由します。ホットパスのパッチヘルパーは、そのライタースロットを保持している間、検証済みの可変キャッシュを借用するため、大きな `sessions.json` ファイルがメタデータ更新のたびに複製されたり再読み込みされたりすることはありません。ランタイムコードでは `updateSessionStore(...)` または `updateSessionStoreEntry(...)` を優先してください。ストア全体を直接保存する方法は、互換性およびオフラインメンテナンス用のツールです。Gateway に到達できる場合、非 dry-run の `openclaw sessions cleanup` と `openclaw agents delete` はストア変更を Gateway に委譲し、クリーンアップが同じライターキューに合流するようにします。`--store <path>` は、直接ファイルメンテナンスを行うための明示的なオフライン修復パスです。`maxEntries` クリーンアップは本番規模の上限に対してもバッチ処理されるため、次の高水位クリーンアップが上限内に書き戻すまで、ストアが設定された上限を一時的に超える場合があります。セッションストアの読み取りは、Gateway 起動中にエントリの枝刈りや上限適用を行いません。クリーンアップには書き込み、または `openclaw sessions cleanup --enforce` を使用してください。`openclaw sessions cleanup --enforce` は、ディスク予算が設定されていない場合でも、設定済みの上限を即座に適用し、古い未参照のトランスクリプト、チェックポイント、trajectory 成果物を枝刈りします。

メンテナンスでは、グループセッションやスレッドスコープのチャットセッションなどの耐久性のある外部会話ポインターは保持されますが、
cron、フック、heartbeat、ACP、サブエージェント用の合成ランタイムエントリは、設定された経過時間、件数、またはディスク予算を超えると削除される場合があります。

OpenClaw は、Gateway 書き込み中に自動の `sessions.json.bak.*` ローテーションバックアップを作成しなくなりました。従来の `session.maintenance.rotateBytes` キーは無視され、`openclaw doctor --fix` は古い設定からそれを削除します。

トランスクリプトの変更では、トランスクリプトファイル上のセッション書き込みロックを使用します。ロック取得は、
ビジーセッションエラーを表示する前に `session.writeLock.acquireTimeoutMs` まで待機します。デフォルトは `60000`
ms です。正当な準備、クリーンアップ、Compaction、またはトランスクリプトミラー処理が低速なマシンでより長く競合する場合にのみ、この値を上げてください。古いロックの検出と最大保持時間の警告は、引き続き別個のポリシーです。

ディスク予算クリーンアップ (`mode: "enforce"`) の適用順序:

1. 最も古いアーカイブ済み、孤立トランスクリプト、または孤立 trajectory 成果物を最初に削除します。
2. まだ目標値を超えている場合は、最も古いセッションエントリとそのトランスクリプト/trajectory ファイルを削除します。
3. 使用量が `highWaterBytes` 以下になるまで続けます。

`mode: "warn"` では、OpenClaw は潜在的な削除を報告しますが、ストア/ファイルは変更しません。

必要に応じてメンテナンスを実行します。

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron セッションと実行ログ

分離された cron 実行もセッションエントリ/トランスクリプトを作成し、専用の保持制御があります。

- `cron.sessionRetention` (デフォルト `24h`) は、古い分離 cron 実行セッションをセッションストアから枝刈りします (`false` で無効化)。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` は、`~/.openclaw/cron/runs/<jobId>.jsonl` ファイルを枝刈りします (デフォルト: `2_000_000` バイトおよび `2000` 行)。

cron が新しい分離実行セッションを強制作成するときは、新しい行を書き込む前に、以前の
`cron:<jobId>` セッションエントリをサニタイズします。thinking/fast/verbose 設定、ラベル、明示的な
ユーザー選択のモデル/auth オーバーライドなど、安全な設定を引き継ぎます。チャンネル/グループルーティング、送信またはキューポリシー、昇格、origin、ACP
ランタイムバインディングなどの周辺会話コンテキストは削除されるため、新しい分離実行が古い実行から古い配信権限や
ランタイム権限を継承することはありません。

---

## セッションキー (`sessionKey`)

`sessionKey` は、自分が _どの会話バケット_ にいるか (ルーティング + 分離) を識別します。

一般的なパターン:

- メイン/ダイレクトチャット (エージェントごと): `agent:<agentId>:<mainKey>` (デフォルト `main`)
- グループ: `agent:<agentId>:<channel>:group:<id>`
- ルーム/チャンネル (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` または `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (上書きされていない場合)

正規ルールは [/concepts/session](/ja-JP/concepts/session) に記載されています。

---

## セッション ID (`sessionId`)

各 `sessionKey` は、現在の `sessionId` (会話を継続するトランスクリプトファイル) を指します。

目安:

- **リセット** (`/new`, `/reset`) は、その `sessionKey` に対して新しい `sessionId` を作成します。
- **日次リセット** (デフォルトでは Gateway ホストのローカル時刻で午前 4:00) は、リセット境界後の次のメッセージで新しい `sessionId` を作成します。
- **アイドル期限切れ** (`session.reset.idleMinutes` または従来の `session.idleMinutes`) は、アイドルウィンドウ後にメッセージが到着したときに新しい `sessionId` を作成します。日次とアイドルの両方が設定されている場合は、先に期限切れになったほうが優先されます。
- **システムイベント** (heartbeat、cron wakeup、exec 通知、gateway ブックキーピング) は、セッション行を変更する場合がありますが、日次/アイドルリセットの新鮮さは延長しません。リセットのロールオーバーでは、新しいプロンプトが構築される前に、前のセッション向けにキューされたシステムイベント通知が破棄されます。
- **親フォークポリシー** は、スレッドまたはサブエージェントフォークを作成するときに PI のアクティブブランチを使用します。そのブランチが大きすぎる場合、OpenClaw は失敗したり使用不能な履歴を継承したりする代わりに、分離コンテキストで子を開始します。サイズ決定ポリシーは自動です。従来の `session.parentForkMaxTokens` 設定は `openclaw doctor --fix` によって削除されます。

実装の詳細: この判断は `src/auto-reply/reply/session.ts` の `initSessionState()` で行われます。

---

## セッションストアスキーマ (`sessions.json`)

ストアの値型は `src/config/sessions.ts` の `SessionEntry` です。

主なフィールド (すべてではありません):

- `sessionId`: 現在のトランスクリプト ID (`sessionFile` が設定されていない限り、ファイル名はこれから派生します)
- `sessionStartedAt`: 現在の `sessionId` の開始タイムスタンプ。日次リセットの
  新鮮さはこれを使用します。従来の行では、JSONL セッションヘッダーから派生する場合があります。
- `lastInteractionAt`: 最後の実ユーザー/チャンネルインタラクションのタイムスタンプ。アイドルリセットの
  新鮮さはこれを使用するため、heartbeat、cron、exec イベントによってセッションが
  生き続けることはありません。このフィールドのない従来の行は、復元されたセッション開始
  時刻にフォールバックしてアイドルの新鮮さを判断します。
- `updatedAt`: 最後のストア行変更タイムスタンプ。一覧表示、枝刈り、
  ブックキーピングに使用されます。これは日次/アイドルリセットの新鮮さに関する権威ではありません。
- `sessionFile`: 任意の明示的なトランスクリプトパス上書き
- `chatType`: `direct | group | room` (UI と送信ポリシーに役立ちます)
- `provider`, `subject`, `room`, `space`, `displayName`: グループ/チャンネルのラベル付け用メタデータ
- トグル:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (セッション単位の上書き)
- モデル選択:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- トークンカウンター (ベストエフォート / プロバイダー依存):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: このセッションキーに対して自動 Compaction が完了した回数
- `memoryFlushAt`: 最後の Compaction 前メモリフラッシュのタイムスタンプ
- `memoryFlushCompactionCount`: 最後のフラッシュ実行時の Compaction 回数

ストアは編集しても安全ですが、Gateway が権威です。セッション実行中に、エントリを書き換えたり再水和したりする場合があります。

---

## トランスクリプト構造 (`*.jsonl`)

トランスクリプトは `@earendil-works/pi-coding-agent` の `SessionManager` によって管理されます。

ファイルは JSONL です。

- 最初の行: セッションヘッダー (`type: "session"`、`id`、`cwd`、`timestamp`、任意の `parentSession` を含みます)
- その後: `id` + `parentId` を持つセッションエントリ (ツリー)

注目すべきエントリタイプ:

- `message`: ユーザー/アシスタント/toolResult メッセージ
- `custom_message`: モデルコンテキストに _入る_ 拡張機能注入メッセージ (UI から非表示にできます)
- `custom`: モデルコンテキストに _入らない_ 拡張機能状態
- `compaction`: `firstKeptEntryId` と `tokensBefore` を持つ永続化された Compaction サマリー
- `branch_summary`: ツリーブランチを移動するときに永続化されるサマリー

OpenClaw は意図的にトランスクリプトを「修正」しません。Gateway は `SessionManager` を使用してそれらを読み書きします。

---

## コンテキストウィンドウと追跡トークン

重要な概念は 2 つあります。

1. **モデルコンテキストウィンドウ**: モデルごとのハード上限 (モデルに見えるトークン)
2. **セッションストアカウンター**: `sessions.json` に書き込まれるローリング統計 (/status とダッシュボードに使用)

制限を調整する場合:

- コンテキストウィンドウはモデルカタログから取得されます (設定で上書き可能)。
- ストア内の `contextTokens` はランタイムの推定/レポート値です。厳密な保証として扱わないでください。

詳細は [/token-use](/ja-JP/reference/token-use) を参照してください。

---

## Compaction: 概要

Compaction は、古い会話をトランスクリプト内の永続化された `compaction` エントリに要約し、最近のメッセージはそのまま保持します。

Compaction 後、将来のターンが見る内容は次のとおりです。

- Compaction サマリー
- `firstKeptEntryId` 以降のメッセージ

Compaction は **永続的** です（セッションのプルーニングとは異なります）。[/concepts/session-pruning](/ja-JP/concepts/session-pruning) を参照してください。

## Compaction チャンク境界とツールのペアリング

OpenClaw が長いトランスクリプトを Compaction チャンクに分割するとき、アシスタントのツール呼び出しは、対応する `toolResult` エントリとペアのまま維持されます。

- トークン比率による分割位置がツール呼び出しとその結果の間に来る場合、OpenClaw はそのペアを分離する代わりに、境界をアシスタントのツール呼び出しメッセージへ移動します。
- 末尾のツール結果ブロックによってチャンクが目標を超えてしまう場合でも、OpenClaw はその保留中のツールブロックを保持し、要約されていない末尾部分をそのまま維持します。
- 中止またはエラーになったツール呼び出しブロックは、保留中の分割を開いたままにはしません。

---

## 自動 Compaction が発生するタイミング（Pi ランタイム）

組み込み Pi エージェントでは、自動 Compaction は 2 つの場合にトリガーされます。

1. **オーバーフロー回復**: モデルがコンテキストオーバーフローエラー（`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded`、および同様のプロバイダー形式の変種）を返す → 圧縮 → 再試行。
2. **しきい値メンテナンス**: 成功したターンの後、次の場合:

`contextTokens > contextWindow - reserveTokens`

ここで:

- `contextWindow` はモデルのコンテキストウィンドウ
- `reserveTokens` はプロンプトと次のモデル出力のために予約された余裕

これらは Pi ランタイムのセマンティクスです（OpenClaw はイベントを消費しますが、いつ圧縮するかは Pi が決定します）。

OpenClaw は、`agents.defaults.compaction.maxActiveTranscriptBytes` が設定され、アクティブなトランスクリプトファイルがそのサイズに達した場合、次の実行を開く前にプリフライトのローカル Compaction をトリガーすることもできます。これはローカル再オープンコストのためのファイルサイズガードであり、生のアーカイブではありません。OpenClaw は引き続き通常のセマンティック Compaction を実行し、圧縮済み要約が新しい後続トランスクリプトになれるように `truncateAfterCompaction` を必要とします。

組み込み Pi 実行では、`agents.defaults.compaction.midTurnPrecheck.enabled: true` により、オプトインのツールループガードが追加されます。ツール結果が追加された後、次のモデル呼び出しの前に、OpenClaw はターン開始時と同じプリフライト予算ロジックを使ってプロンプト負荷を推定します。コンテキストが収まらなくなった場合、このガードは Pi の `transformContext` フック内では圧縮しません。構造化されたターン中プリチェックシグナルを発生させ、現在のプロンプト送信を停止し、外側の実行ループに既存の回復パスを使わせます。十分であれば過大なツール結果を切り詰め、そうでなければ設定された Compaction モードをトリガーして再試行します。このオプションはデフォルトで無効であり、プロバイダー支援のセーフガード Compaction を含む `default` と `safeguard` の両方の Compaction モードで動作します。
これは `maxActiveTranscriptBytes` とは独立しています。バイトサイズガードはターンを開く前に実行されますが、ターン中プリチェックは、新しいツール結果が追加された後の組み込み Pi ツールループ内で後から実行されます。

---

## Compaction 設定（`reserveTokens`、`keepRecentTokens`）

Pi の Compaction 設定は Pi 設定にあります。

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw は組み込み実行に対して安全下限も強制します。

- `compaction.reserveTokens < reserveTokensFloor` の場合、OpenClaw はそれを引き上げます。
- デフォルトの下限は `20000` トークンです。
- 下限を無効にするには `agents.defaults.compaction.reserveTokensFloor: 0` を設定します。
- すでにそれより高い場合、OpenClaw はそのままにします。
- 手動の `/compact` は明示的な `agents.defaults.compaction.keepRecentTokens` を尊重し、Pi の直近末尾の切断点を維持します。明示的な保持予算がない場合、手動 Compaction はハードチェックポイントのままで、再構築されたコンテキストは新しい要約から開始されます。
- 新しいツール結果の後、次のモデル呼び出しの前に任意のツールループプリチェックを実行するには、`agents.defaults.compaction.midTurnPrecheck.enabled: true` を設定します。これはトリガーのみです。要約生成は引き続き設定済みの Compaction パスを使います。これは `maxActiveTranscriptBytes` とは独立しており、`maxActiveTranscriptBytes` はターン開始時のアクティブトランスクリプトのバイトサイズガードです。
- アクティブなトランスクリプトが大きくなったとき、ターン前にローカル Compaction を実行するには、`agents.defaults.compaction.maxActiveTranscriptBytes` にバイト値または `"20mb"` のような文字列を設定します。このガードは `truncateAfterCompaction` も有効な場合にのみ有効です。無効にするには未設定のままにするか、`0` を設定します。
- `agents.defaults.compaction.truncateAfterCompaction` が有効な場合、OpenClaw は Compaction 後に、アクティブなトランスクリプトを圧縮済みの後続 JSONL へローテートします。古い完全なトランスクリプトはその場で書き換えられるのではなく、アーカイブされたまま Compaction チェックポイントからリンクされます。

理由: Compaction が避けられなくなる前に、メモリ書き込みのような複数ターンの「ハウスキーピング」のための十分な余裕を残すためです。

実装: `src/agents/pi-settings.ts` の `ensurePiCompactionReserveTokens()`
（`src/agents/pi-embedded-runner.ts` から呼び出されます）。

---

## プラグ可能な Compaction プロバイダー

Plugin は、Plugin API の `registerCompactionProvider()` を介して Compaction プロバイダーを登録できます。`agents.defaults.compaction.provider` が登録済みプロバイダー ID に設定されている場合、セーフガード拡張は組み込みの `summarizeInStages` パイプラインではなく、そのプロバイダーに要約を委譲します。

- `provider`: 登録済み Compaction プロバイダー Plugin の ID。デフォルトの LLM 要約を使う場合は未設定のままにします。
- `provider` を設定すると、`mode: "safeguard"` が強制されます。
- プロバイダーは、組み込みパスと同じ Compaction 指示と識別子保持ポリシーを受け取ります。
- セーフガードは、プロバイダー出力の後も直近ターンと分割ターンのサフィックスコンテキストを保持します。
- 組み込みのセーフガード要約は、以前の要約全体をそのまま保持するのではなく、新しいメッセージとともに以前の要約を再蒸留します。
- セーフガードモードでは、要約品質監査がデフォルトで有効になります。形式不正な出力に対する再試行動作をスキップするには、`qualityGuard.enabled: false` を設定します。
- プロバイダーが失敗するか空の結果を返した場合、OpenClaw は自動的に組み込み LLM 要約へフォールバックします。
- 中止またはタイムアウトのシグナルは、呼び出し元のキャンセルを尊重するために再スローされます（握りつぶされません）。

ソース: `src/plugins/compaction-provider.ts`、`src/agents/pi-hooks/compaction-safeguard.ts`。

---

## ユーザーに表示されるサーフェス

Compaction とセッション状態は、次の方法で確認できます。

- `/status`（任意のチャットセッション内）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- Gateway ログ（`pnpm gateway:watch` または `openclaw logs --follow`）: `embedded run auto-compaction start` + `complete`
- 詳細モード: `🧹 Auto-compaction complete` + Compaction 回数

---

## サイレントなハウスキーピング（`NO_REPLY`）

OpenClaw は、ユーザーに途中出力を見せるべきではないバックグラウンドタスク向けに「サイレント」ターンをサポートします。

規約:

- アシスタントは、ユーザーに返信を届けないことを示すために、正確なサイレントトークン `NO_REPLY` / `no_reply` で出力を開始します。
- OpenClaw は配信レイヤーでこれを取り除くか抑制します。
- 正確なサイレントトークンの抑制は大文字小文字を区別しないため、ペイロード全体がそのサイレントトークンだけである場合、`NO_REPLY` と `no_reply` はどちらも対象になります。
- これは真のバックグラウンドまたは未配信ターン専用です。通常の実行可能なユーザー要求のショートカットではありません。

`2026.1.10` の時点で、OpenClaw は部分チャンクが `NO_REPLY` で始まる場合、**下書き/入力中ストリーミング** も抑制するため、サイレント操作がターン中に部分出力を漏らすことはありません。

---

## Compaction 前の「メモリフラッシュ」（実装済み）

目標: 自動 Compaction が発生する前に、永続的な状態をディスク（例: エージェントワークスペース内の `memory/YYYY-MM-DD.md`）へ書き込むサイレントなエージェント的ターンを実行し、Compaction が重要なコンテキストを消去できないようにします。

OpenClaw は **しきい値前フラッシュ** アプローチを使います。

1. セッションコンテキスト使用量を監視します。
2. Pi の Compaction しきい値より低い「ソフトしきい値」を超えたら、エージェントにサイレントな「今すぐメモリを書き込む」指示を実行します。
3. ユーザーに何も見えないように、正確なサイレントトークン `NO_REPLY` / `no_reply` を使います。

設定（`agents.defaults.compaction.memoryFlush`）:

- `enabled`（デフォルト: `true`）
- `model`（任意。フラッシュターン用の正確なプロバイダー/モデル上書き。例: `ollama/qwen3:8b`）
- `softThresholdTokens`（デフォルト: `4000`）
- `prompt`（フラッシュターン用のユーザーメッセージ）
- `systemPrompt`（フラッシュターン用に追加される追加システムプロンプト）

注意:

- デフォルトのプロンプト/システムプロンプトには、配信を抑制するための `NO_REPLY` ヒントが含まれます。
- `model` が設定されている場合、フラッシュターンはアクティブセッションのフォールバックチェーンを継承せず、そのモデルを使います。そのため、ローカル専用のハウスキーピングが有料の会話モデルへ静かにフォールバックすることはありません。
- フラッシュは Compaction サイクルごとに 1 回実行されます（`sessions.json` で追跡されます）。
- フラッシュは組み込み Pi セッションでのみ実行されます（CLI バックエンドではスキップされます）。
- セッションワークスペースが読み取り専用（`workspaceAccess: "ro"` または `"none"`）の場合、フラッシュはスキップされます。
- ワークスペースのファイルレイアウトと書き込みパターンについては、[メモリ](/ja-JP/concepts/memory) を参照してください。

Pi も拡張 API で `session_before_compact` フックを公開していますが、OpenClaw のフラッシュロジックは現在 Gateway 側にあります。

---

## トラブルシューティングチェックリスト

- セッションキーが間違っていますか？[/concepts/session](/ja-JP/concepts/session) から始めて、`/status` の `sessionKey` を確認してください。
- ストアとトランスクリプトが一致しませんか？`openclaw status` で Gateway ホストとストアパスを確認してください。
- Compaction が多発しますか？確認してください:
  - モデルのコンテキストウィンドウ（小さすぎる）
  - Compaction 設定（`reserveTokens` がモデルウィンドウに対して高すぎると、より早い Compaction が発生する可能性があります）
  - ツール結果の肥大化: セッションプルーニングを有効化/調整してください
- サイレントターンが漏れていますか？返信が `NO_REPLY`（大文字小文字を区別しない正確なトークン）で始まっていること、およびストリーミング抑制修正を含むビルドを使っていることを確認してください。

## 関連

- [セッション管理](/ja-JP/concepts/session)
- [セッションプルーニング](/ja-JP/concepts/session-pruning)
- [コンテキストエンジン](/ja-JP/concepts/context-engine)
