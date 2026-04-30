---
read_when:
    - セッション ID、トランスクリプト JSONL、または sessions.json のフィールドをデバッグする必要がある
    - 自動Compactionの動作を変更するか、「Compaction前」のハウスキーピングを追加している
    - メモリのフラッシュまたはサイレントなシステムターンを実装したい場合
summary: '詳説: セッションストア + トランスクリプト、ライフサイクル、(自動)Compaction の内部'
title: セッション管理の詳細解説
x-i18n:
    generated_at: "2026-04-30T05:33:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9785723ebf9b5411440a8f3b2885a50d659f669811ba749c431a2b3aeed700
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw は、これらの領域にまたがってセッションをエンドツーエンドで管理します。

- **セッションルーティング**（受信メッセージがどのように `sessionKey` に対応付けられるか）
- **セッションストア**（`sessions.json`）と、その追跡内容
- **トランスクリプト永続化**（`*.jsonl`）と、その構造
- **トランスクリプトの整備**（実行前のプロバイダー固有の修正）
- **コンテキスト制限**（コンテキストウィンドウと追跡トークン）
- **Compaction**（手動および自動 Compaction）と、Compaction 前の処理をフックする場所
- **サイレントなハウスキーピング**（ユーザーに見える出力を生成すべきでないメモリ書き込み）

先に高レベルの概要を見たい場合は、次から始めてください。

- [セッション管理](/ja-JP/concepts/session)
- [Compaction](/ja-JP/concepts/compaction)
- [メモリ概要](/ja-JP/concepts/memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [セッション pruning](/ja-JP/concepts/session-pruning)
- [トランスクリプトの整備](/ja-JP/reference/transcript-hygiene)

---

## 信頼できる情報源: Gateway

OpenClaw は、セッション状態を所有する単一の **Gateway プロセス**を中心に設計されています。

- UI（macOS アプリ、Web Control UI、TUI）は、セッション一覧とトークン数を Gateway に問い合わせる必要があります。
- リモートモードでは、セッションファイルはリモートホスト上にあります。「ローカルの Mac ファイルを確認する」ことは、Gateway が使用している内容を反映しません。

---

## 2 つの永続化レイヤー

OpenClaw はセッションを 2 つのレイヤーで永続化します。

1. **セッションストア（`sessions.json`）**
   - キー/値マップ: `sessionKey -> SessionEntry`
   - 小さく、可変で、編集（またはエントリ削除）しても安全
   - セッションメタデータ（現在のセッション ID、最終アクティビティ、トグル、トークンカウンターなど）を追跡

2. **トランスクリプト（`<sessionId>.jsonl`）**
   - ツリー構造を持つ追記専用トランスクリプト（エントリは `id` + `parentId` を持つ）
   - 実際の会話 + ツール呼び出し + Compaction 要約を保存
   - 将来のターンでモデルコンテキストを再構築するために使用
   - アクティブなトランスクリプトがチェックポイントサイズ上限を超えると、大きな Compaction 前デバッグチェックポイントはスキップされ、巨大な `.checkpoint.*.jsonl` コピーがもう 1 つ作られるのを避けます。

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
- `pruneAfter`: 古いエントリの年齢しきい値（デフォルト `30d`）
- `maxEntries`: `sessions.json` 内のエントリ上限（デフォルト `500`）
- `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間（デフォルト: `pruneAfter` と同じ。`false` でクリーンアップを無効化）
- `maxDiskBytes`: 任意のセッションディレクトリ容量
- `highWaterBytes`: クリーンアップ後の任意の目標値（デフォルトは `maxDiskBytes` の `80%`）

通常の Gateway 書き込みでは、本番規模の上限に対して `maxEntries` クリーンアップがバッチ処理されるため、次の高水位クリーンアップで設定上限まで書き戻されるまで、ストアが一時的に設定上限を超える場合があります。`openclaw sessions cleanup --enforce` は、設定された上限を即座に適用します。

OpenClaw は、Gateway 書き込み時に自動的な `sessions.json.bak.*` ローテーションバックアップを作成しなくなりました。レガシーの `session.maintenance.rotateBytes` キーは無視され、`openclaw doctor --fix` は古い設定からこれを削除します。

ディスク容量クリーンアップ（`mode: "enforce"`）の適用順序:

1. 最初に、最も古いアーカイブ済み成果物、孤立したトランスクリプト、または孤立した trajectory 成果物を削除します。
2. それでも目標を超える場合は、最も古いセッションエントリと、そのトランスクリプト/trajectory ファイルを退避します。
3. 使用量が `highWaterBytes` 以下になるまで続行します。

`mode: "warn"` では、OpenClaw は発生しうる退避を報告しますが、ストア/ファイルは変更しません。

必要に応じてメンテナンスを実行します。

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron セッションと実行ログ

分離された cron 実行もセッションエントリ/トランスクリプトを作成し、専用の保持制御を持ちます。

- `cron.sessionRetention`（デフォルト `24h`）は、古い分離 cron 実行セッションをセッションストアから prune します（`false` で無効化）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` は、`~/.openclaw/cron/runs/<jobId>.jsonl` ファイルを prune します（デフォルト: `2_000_000` バイトと `2000` 行）。

cron が新しい分離実行セッションを強制作成すると、新しい行を書き込む前に、以前の `cron:<jobId>` セッションエントリをサニタイズします。thinking/fast/verbose 設定、ラベル、ユーザーが明示的に選択したモデル/認証の上書きなど、安全な設定は引き継ぎます。channel/group ルーティング、送信またはキューポリシー、elevation、origin、ACP ランタイムバインディングなどの周辺的な会話コンテキストは削除し、新しい分離実行が古い実行から古くなった配信権限やランタイム権限を継承できないようにします。

---

## セッションキー（`sessionKey`）

`sessionKey` は、自分がいる_会話バケット_（ルーティング + 分離）を識別します。

一般的なパターン:

- メイン/ダイレクトチャット（エージェントごと）: `agent:<agentId>:<mainKey>`（デフォルト `main`）
- グループ: `agent:<agentId>:<channel>:group:<id>`
- ルーム/チャンネル（Discord/Slack）: `agent:<agentId>:<channel>:channel:<id>` または `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>`（上書きされない場合）

正規のルールは [/concepts/session](/ja-JP/concepts/session) に記載されています。

---

## セッション ID（`sessionId`）

各 `sessionKey` は、現在の `sessionId`（会話を継続するトランスクリプトファイル）を指します。

目安となるルール:

- **リセット**（`/new`、`/reset`）は、その `sessionKey` 用に新しい `sessionId` を作成します。
- **日次リセット**（デフォルトでは Gateway ホストのローカル時刻で午前 4:00）は、リセット境界後の次のメッセージで新しい `sessionId` を作成します。
- **アイドル期限切れ**（`session.reset.idleMinutes` またはレガシーの `session.idleMinutes`）は、アイドルウィンドウ後にメッセージが届いたとき、新しい `sessionId` を作成します。日次とアイドルの両方が設定されている場合は、先に期限切れになった方が優先されます。
- **システムイベント**（heartbeat、cron wakeup、exec 通知、Gateway bookkeeping）はセッション行を変更する場合がありますが、日次/アイドルリセットの鮮度は延長しません。リセットロールオーバーは、新しいプロンプトが構築される前に、前のセッションにキューされていたシステムイベント通知を破棄します。
- **スレッド親 fork ガード**（`session.parentForkMaxTokens`、デフォルト `100000`）は、親セッションがすでに大きすぎる場合に親トランスクリプトの fork をスキップします。新しいスレッドは新規に開始されます。無効化するには `0` を設定します。

実装の詳細: この判定は `src/auto-reply/reply/session.ts` の `initSessionState()` で行われます。

---

## セッションストアスキーマ（`sessions.json`）

ストアの値型は `src/config/sessions.ts` の `SessionEntry` です。

主なフィールド（網羅的ではありません）:

- `sessionId`: 現在のトランスクリプト ID（`sessionFile` が設定されていない限り、ファイル名はこれから派生します）
- `sessionStartedAt`: 現在の `sessionId` の開始タイムスタンプ。日次リセットの鮮度はこれを使用します。レガシー行では、JSONL セッションヘッダーから派生する場合があります。
- `lastInteractionAt`: 最後の実ユーザー/チャンネル interaction タイムスタンプ。アイドルリセットの鮮度はこれを使用するため、heartbeat、cron、exec イベントがセッションを維持することはありません。このフィールドがないレガシー行では、復元されたセッション開始時刻にフォールバックしてアイドル鮮度を判定します。
- `updatedAt`: 最後のストア行変更タイムスタンプ。一覧表示、pruning、bookkeeping に使用されます。日次/アイドルリセット鮮度の権威ではありません。
- `sessionFile`: 任意の明示的なトランスクリプトパス上書き
- `chatType`: `direct | group | room`（UI と送信ポリシーを支援）
- `provider`, `subject`, `room`, `space`, `displayName`: グループ/チャンネルのラベル付け用メタデータ
- トグル:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy`（セッションごとの上書き）
- モデル選択:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- トークンカウンター（ベストエフォート / プロバイダー依存）:
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: このセッションキーで自動 Compaction が完了した回数
- `memoryFlushAt`: 最後の Compaction 前メモリ flush のタイムスタンプ
- `memoryFlushCompactionCount`: 最後の flush が実行された時点の Compaction 回数

ストアは編集しても安全ですが、Gateway が権威です。セッション実行中に、Gateway がエントリを書き換えたり再ハイドレートしたりする場合があります。

---

## トランスクリプト構造（`*.jsonl`）

トランスクリプトは `@mariozechner/pi-coding-agent` の `SessionManager` によって管理されます。

ファイルは JSONL です。

- 1 行目: セッションヘッダー（`type: "session"`、`id`、`cwd`、`timestamp`、任意の `parentSession` を含む）
- 以降: `id` + `parentId`（ツリー）を持つセッションエントリ

注目すべきエントリ種別:

- `message`: user/assistant/toolResult メッセージ
- `custom_message`: モデルコンテキストに入る拡張機能注入メッセージ（UI から非表示にできる）
- `custom`: モデルコンテキストに入らない拡張機能状態
- `compaction`: `firstKeptEntryId` と `tokensBefore` を持つ永続化された Compaction 要約
- `branch_summary`: ツリーブランチを移動するときの永続化された要約

OpenClaw は意図的にトランスクリプトを「修正」しません。Gateway は `SessionManager` を使用して読み書きします。

---

## コンテキストウィンドウと追跡トークン

重要な概念は 2 つあります。

1. **モデルコンテキストウィンドウ**: モデルごとのハード上限（モデルから見えるトークン）
2. **セッションストアカウンター**: `sessions.json` に書き込まれるローリング統計（/status とダッシュボードで使用）

制限を調整する場合:

- コンテキストウィンドウはモデルカタログから取得されます（設定で上書き可能）。
- ストア内の `contextTokens` はランタイムの推定/報告値です。厳密な保証として扱わないでください。

詳しくは [/token-use](/ja-JP/reference/token-use) を参照してください。

---

## Compaction: その内容

Compaction は、古い会話をトランスクリプト内の永続化された `compaction` エントリに要約し、最近のメッセージはそのまま保持します。

Compaction 後、将来のターンが見る内容:

- Compaction 要約
- `firstKeptEntryId` 以降のメッセージ

Compaction は（セッション pruning とは異なり）**永続的**です。[/concepts/session-pruning](/ja-JP/concepts/session-pruning) を参照してください。

## Compaction チャンク境界とツールのペアリング

OpenClaw が長いトランスクリプトを Compaction チャンクに分割するとき、assistant のツール呼び出しを、対応する `toolResult` エントリとペアのまま保持します。

- トークン比率による分割位置がツール呼び出しとその結果の間に入る場合、OpenClaw はそのペアを分離する代わりに、assistant のツール呼び出しメッセージへ境界をずらします。
- 末尾の tool-result ブロックによってチャンクが目標を超えてしまう場合でも、OpenClaw はその保留中のツールブロックを保持し、未要約の末尾をそのまま残します。
- 中断/エラーになったツール呼び出しブロックは、保留中の分割を開いたままにしません。

---

## 自動 Compaction が発生するタイミング（Pi ランタイム）

組み込みの Pi エージェントでは、自動 Compaction は 2 つの場合にトリガーされます。

1. **オーバーフロー回復**: モデルがコンテキストオーバーフローエラー（`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded`、および同様のプロバイダー由来のバリアント）を返す → compact → 再試行。
2. **しきい値メンテナンス**: 成功したターンの後、次の場合:

`contextTokens > contextWindow - reserveTokens`

ここで:

- `contextWindow` はモデルのコンテキストウィンドウ
- `reserveTokens` はプロンプト + 次のモデル出力のために予約された余裕

これらは Pi ランタイムのセマンティクスです（OpenClaw はイベントを消費しますが、いつ compact するかは Pi が決定します）。

OpenClaw は、`agents.defaults.compaction.maxActiveTranscriptBytes` が設定され、アクティブなトランスクリプトファイルがそのサイズに達した場合、次の実行を開く前にプリフライトのローカル Compaction をトリガーすることもできます。これはローカルの再オープンコストに対するファイルサイズガードであり、生のアーカイブ処理ではありません。OpenClaw は通常のセマンティック Compaction を引き続き実行し、Compaction 済み要約が新しい後続トランスクリプトになれるように `truncateAfterCompaction` を必要とします。

---

## Compaction 設定（`reserveTokens`, `keepRecentTokens`）

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

OpenClaw は、埋め込み実行にも安全上の下限を適用します。

- `compaction.reserveTokens < reserveTokensFloor` の場合、OpenClaw は値を引き上げます。
- 既定の下限は `20000` トークンです。
- 下限を無効にするには、`agents.defaults.compaction.reserveTokensFloor: 0` を設定します。
- すでにそれより高い場合、OpenClaw はそのままにします。
- 手動の `/compact` は明示的な `agents.defaults.compaction.keepRecentTokens`
  を尊重し、Pi の直近末尾の切り取り位置を維持します。明示的な保持予算がない場合、
  手動 Compaction は引き続きハードチェックポイントになり、再構築されたコンテキストは
  新しい要約から始まります。
- `agents.defaults.compaction.maxActiveTranscriptBytes` をバイト値、または
  `"20mb"` のような文字列に設定すると、アクティブなトランスクリプトが大きくなったとき、
  ターンの前にローカル Compaction を実行します。このガードは
  `truncateAfterCompaction` も有効な場合にのみ有効です。無効にするには未設定のままにするか、
  `0` を設定します。
- `agents.defaults.compaction.truncateAfterCompaction` が有効な場合、
  OpenClaw は Compaction 後に、アクティブなトランスクリプトを圧縮済みの後続 JSONL にローテーションします。
  古い完全なトランスクリプトは、その場で書き換えられるのではなく、
  アーカイブされたまま Compaction チェックポイントからリンクされます。

理由: Compaction が避けられなくなる前に、複数ターンの「ハウスキーピング」（メモリ書き込みなど）に十分な余裕を残すためです。

実装: `src/agents/pi-settings.ts` の `ensurePiCompactionReserveTokens()`
（`src/agents/pi-embedded-runner.ts` から呼び出されます）。

---

## プラグ可能な Compaction プロバイダー

Plugin は、Plugin API の `registerCompactionProvider()` を通じて Compaction プロバイダーを登録できます。`agents.defaults.compaction.provider` が登録済みプロバイダー id に設定されている場合、セーフガード拡張は組み込みの `summarizeInStages` パイプラインではなく、そのプロバイダーに要約を委譲します。

- `provider`: 登録済み Compaction プロバイダー Plugin の id。既定の LLM 要約を使う場合は未設定のままにします。
- `provider` を設定すると、`mode: "safeguard"` が強制されます。
- プロバイダーは、組み込み経路と同じ Compaction 指示および識別子保持ポリシーを受け取ります。
- セーフガードは、プロバイダー出力の後も直近ターンと分割ターンの末尾コンテキストを保持します。
- 組み込みのセーフガード要約は、以前の完全な要約をそのまま保持するのではなく、
  新しいメッセージとともに過去の要約を再蒸留します。
- セーフガードモードでは、要約品質監査が既定で有効になります。
  不正な形式の出力に対する再試行動作をスキップするには、`qualityGuard.enabled: false` を設定します。
- プロバイダーが失敗した場合、または空の結果を返した場合、OpenClaw は自動的に組み込みの LLM 要約へフォールバックします。
- 呼び出し元のキャンセルを尊重するため、中止/タイムアウトシグナルは握りつぶされず、再スローされます。

ソース: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`。

---

## ユーザーに表示される画面

Compaction とセッション状態は次の方法で確認できます。

- `/status`（任意のチャットセッション内）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- 詳細モード: `🧹 Auto-compaction complete` + Compaction 回数

---

## サイレントハウスキーピング (`NO_REPLY`)

OpenClaw は、ユーザーに中間出力を見せるべきではないバックグラウンドタスク向けに「サイレント」ターンをサポートします。

規約:

- アシスタントは、「ユーザーに返信を配信しない」ことを示すために、
  正確なサイレントトークン `NO_REPLY` / `no_reply` で出力を開始します。
- OpenClaw は配信レイヤーでこれを削除/抑制します。
- 正確なサイレントトークンの抑制は大文字小文字を区別しないため、ペイロード全体がサイレントトークンだけの場合、
  `NO_REPLY` と `no_reply` のどちらも対象になります。
- これは真のバックグラウンド/非配信ターン専用です。通常の実行可能なユーザーリクエストの近道ではありません。

`2026.1.10` 時点で、OpenClaw は部分チャンクが `NO_REPLY` で始まる場合、
**ドラフト/入力中ストリーミング** も抑制するため、サイレント操作でターンの途中に部分出力が漏れません。

---

## Compaction 前の「メモリフラッシュ」（実装済み）

目的: 自動 Compaction が発生する前に、永続的な状態をディスク
（例: エージェントワークスペース内の `memory/YYYY-MM-DD.md`）へ書き込むサイレントなエージェントターンを実行し、Compaction が重要なコンテキストを消せないようにします。

OpenClaw は **事前しきい値フラッシュ** アプローチを使用します。

1. セッションのコンテキスト使用量を監視します。
2. （Pi の Compaction しきい値より低い）「ソフトしきい値」を超えたら、
   エージェントに対してサイレントな「今すぐメモリを書き込む」指示を実行します。
3. ユーザーに何も表示されないように、正確なサイレントトークン `NO_REPLY` / `no_reply` を使用します。

設定 (`agents.defaults.compaction.memoryFlush`):

- `enabled`（既定: `true`）
- `model`（フラッシュターン用の任意の正確なプロバイダー/モデル上書き。例: `ollama/qwen3:8b`）
- `softThresholdTokens`（既定: `4000`）
- `prompt`（フラッシュターン用のユーザーメッセージ）
- `systemPrompt`（フラッシュターン用に追加される追加システムプロンプト）

注記:

- 既定のプロンプト/システムプロンプトには、配信を抑制するための `NO_REPLY` ヒントが含まれます。
- `model` が設定されている場合、フラッシュターンはアクティブセッションのフォールバックチェーンを継承せずにそのモデルを使用するため、
  ローカル専用のハウスキーピングが有料の会話モデルへ暗黙的にフォールバックすることはありません。
- フラッシュは Compaction サイクルごとに 1 回実行されます（`sessions.json` で追跡されます）。
- フラッシュは埋め込み Pi セッションでのみ実行されます（CLI バックエンドではスキップされます）。
- セッションワークスペースが読み取り専用（`workspaceAccess: "ro"` または `"none"`）の場合、フラッシュはスキップされます。
- ワークスペースのファイルレイアウトと書き込みパターンについては、[メモリ](/ja-JP/concepts/memory) を参照してください。

Pi は拡張 API で `session_before_compact` フックも公開していますが、OpenClaw の
フラッシュロジックは現在 Gateway 側にあります。

---

## トラブルシューティングチェックリスト

- セッションキーが間違っていますか？[/concepts/session](/ja-JP/concepts/session) から始め、`/status` の `sessionKey` を確認してください。
- ストアとトランスクリプトが一致していませんか？`openclaw status` で Gateway ホストとストアパスを確認してください。
- Compaction が過剰に発生していますか？次を確認してください:
  - モデルのコンテキストウィンドウ（小さすぎる）
  - Compaction 設定（`reserveTokens` がモデルウィンドウに対して高すぎると、より早い Compaction が発生する可能性があります）
  - ツール結果の肥大化: セッションプルーニングを有効化/調整します
- サイレントターンが漏れていますか？返信が `NO_REPLY`（大文字小文字を区別しない正確なトークン）で始まっていること、およびストリーミング抑制修正を含むビルドを使用していることを確認してください。

## 関連

- [セッション管理](/ja-JP/concepts/session)
- [セッションプルーニング](/ja-JP/concepts/session-pruning)
- [コンテキストエンジン](/ja-JP/concepts/context-engine)
