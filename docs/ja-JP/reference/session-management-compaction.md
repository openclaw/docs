---
read_when:
    - セッション ID、トランスクリプト JSONL、または sessions.json のフィールドをデバッグする必要がある
    - 自動 Compaction の動作を変更している、または「Compaction 前」のハウスキーピングを追加している
    - メモリフラッシュまたはサイレントなシステムターンを実装したい場合
summary: '詳細解説: セッションストア + トランスクリプト、ライフサイクル、（自動）Compaction の内部構造'
title: セッション管理の詳細解説
x-i18n:
    generated_at: "2026-05-02T05:05:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: efd2fb5157a98cb406c5210d813fa600259dfc559350010a9c070075ac6b28ed
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw は、次の領域にわたってセッションをエンドツーエンドで管理します。

- **セッションルーティング**（受信メッセージを `sessionKey` に対応付ける方法）
- **セッションストア**（`sessions.json`）と、それが追跡する内容
- **トランスクリプト永続化**（`*.jsonl`）とその構造
- **トランスクリプト衛生**（実行前のプロバイダー固有の修正）
- **コンテキスト制限**（コンテキストウィンドウと追跡トークン）
- **Compaction**（手動および自動 Compaction）と、Compaction 前作業をフックする場所
- **サイレントなハウスキーピング**（ユーザーに見える出力を生成すべきでないメモリ書き込み）

まず上位レベルの概要を確認したい場合は、次から始めてください。

- [セッション管理](/ja-JP/concepts/session)
- [Compaction](/ja-JP/concepts/compaction)
- [メモリ概要](/ja-JP/concepts/memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [セッションのプルーニング](/ja-JP/concepts/session-pruning)
- [トランスクリプト衛生](/ja-JP/reference/transcript-hygiene)

---

## 信頼できる唯一の情報源: Gateway

OpenClaw は、セッション状態を所有する単一の **Gateway プロセス**を中心に設計されています。

- UI（macOS アプリ、Web Control UI、TUI）は、セッション一覧とトークン数を Gateway に問い合わせるべきです。
- リモートモードでは、セッションファイルはリモートホスト上にあります。「ローカル Mac ファイルを確認する」ことでは、Gateway が使用している内容は反映されません。

---

## 2 つの永続化レイヤー

OpenClaw はセッションを 2 つのレイヤーで永続化します。

1. **セッションストア（`sessions.json`）**
   - キー/値マップ: `sessionKey -> SessionEntry`
   - 小さく、変更可能で、編集（またはエントリ削除）しても安全
   - セッションメタデータ（現在のセッション ID、最終アクティビティ、トグル、トークンカウンターなど）を追跡します。

2. **トランスクリプト（`<sessionId>.jsonl`）**
   - ツリー構造を持つ追記専用トランスクリプト（エントリは `id` + `parentId` を持ちます）
   - 実際の会話 + ツール呼び出し + Compaction サマリーを保存します。
   - 将来のターンでモデルコンテキストを再構築するために使用されます。
   - アクティブなトランスクリプトがチェックポイントサイズ上限を超えると、Compaction 前の大きなデバッグチェックポイントはスキップされ、2 つ目の巨大な `.checkpoint.*.jsonl` コピーを避けます。

---

## ディスク上の場所

エージェントごとに、Gateway ホスト上で:

- ストア: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- トランスクリプト: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram トピックセッション: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw はこれらを `src/config/sessions.ts` 経由で解決します。

---

## ストアメンテナンスとディスク制御

セッション永続化には、`sessions.json`、トランスクリプト成果物、軌跡サイドカーに対する自動メンテナンス制御（`session.maintenance`）があります。

- `mode`: `warn`（デフォルト）または `enforce`
- `pruneAfter`: 古くなったエントリの経過時間しきい値（デフォルト `30d`）
- `maxEntries`: `sessions.json` 内のエントリ上限（デフォルト `500`）
- `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間（デフォルト: `pruneAfter` と同じ。`false` でクリーンアップを無効化）
- `maxDiskBytes`: 任意のセッションディレクトリ容量予算
- `highWaterBytes`: クリーンアップ後の任意の目標値（デフォルトは `maxDiskBytes` の `80%`）

通常の Gateway 書き込みでは、本番規模の上限に対して `maxEntries` クリーンアップをバッチ処理するため、次の高水位クリーンアップがストアを書き戻して縮小するまで、ストアが設定済み上限を一時的に超えることがあります。セッションストアの読み取りは、Gateway 起動中にエントリをプルーニングしたり上限適用したりしません。クリーンアップには書き込み、または `openclaw sessions cleanup --enforce` を使用してください。`openclaw sessions cleanup --enforce` は、設定済み上限をただちに適用します。

OpenClaw は、Gateway 書き込み中に自動の `sessions.json.bak.*` ローテーションバックアップを作成しなくなりました。レガシーの `session.maintenance.rotateBytes` キーは無視され、`openclaw doctor --fix` は古い設定からそれを削除します。

ディスク容量予算クリーンアップ（`mode: "enforce"`）の適用順序:

1. まず、最も古いアーカイブ済み成果物、孤立したトランスクリプト、または孤立した軌跡成果物を削除します。
2. それでも目標を上回る場合、最も古いセッションエントリと、そのトランスクリプト/軌跡ファイルを退避します。
3. 使用量が `highWaterBytes` 以下になるまで続けます。

`mode: "warn"` では、OpenClaw は発生しうる退避を報告しますが、ストア/ファイルは変更しません。

必要に応じてメンテナンスを実行します。

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron セッションと実行ログ

分離された Cron 実行もセッションエントリ/トランスクリプトを作成し、専用の保持制御があります。

- `cron.sessionRetention`（デフォルト `24h`）は、古い分離 Cron 実行セッションをセッションストアからプルーニングします（`false` で無効化）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` は `~/.openclaw/cron/runs/<jobId>.jsonl` ファイルをプルーニングします（デフォルト: `2_000_000` バイトと `2000` 行）。

Cron が新しい分離実行セッションを強制作成するとき、新しい行を書き込む前に、以前の `cron:<jobId>` セッションエントリをサニタイズします。思考/高速/詳細設定、ラベル、明示的にユーザー選択されたモデル/認証オーバーライドなど、安全な設定は引き継ぎます。チャネル/グループルーティング、送信またはキューポリシー、昇格、オリジン、ACP ランタイムバインディングなどの周辺的な会話コンテキストは削除されるため、新しい分離実行が古い実行から古い配信権限やランタイム権限を継承することはありません。

---

## セッションキー（`sessionKey`）

`sessionKey` は、_どの会話バケット_にいるか（ルーティング + 分離）を識別します。

一般的なパターン:

- メイン/ダイレクトチャット（エージェントごと）: `agent:<agentId>:<mainKey>`（デフォルト `main`）
- グループ: `agent:<agentId>:<channel>:group:<id>`
- ルーム/チャネル（Discord/Slack）: `agent:<agentId>:<channel>:channel:<id>` または `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>`（上書きされない場合）

正規ルールは [/concepts/session](/ja-JP/concepts/session) に記載されています。

---

## セッション ID（`sessionId`）

各 `sessionKey` は、現在の `sessionId`（会話を継続するトランスクリプトファイル）を指します。

目安:

- **リセット**（`/new`、`/reset`）は、その `sessionKey` に対して新しい `sessionId` を作成します。
- **日次リセット**（デフォルトでは Gateway ホストのローカル時刻で午前 4:00）は、リセット境界後の次のメッセージで新しい `sessionId` を作成します。
- **アイドル期限切れ**（`session.reset.idleMinutes` またはレガシーの `session.idleMinutes`）は、アイドルウィンドウ後にメッセージが到着したとき、新しい `sessionId` を作成します。日次とアイドルの両方が設定されている場合は、先に期限切れになった方が優先されます。
- **システムイベント**（heartbeat、Cron の起動、exec 通知、Gateway のブックキーピング）は、セッション行を変更することがありますが、日次/アイドルリセットの鮮度は延長しません。リセットのロールオーバーは、新しいプロンプトを構築する前に、以前のセッション向けにキューされていたシステムイベント通知を破棄します。
- **スレッド親フォークガード**（`session.parentForkMaxTokens`、デフォルト `100000`）は、親セッションがすでに大きすぎる場合に親トランスクリプトのフォークをスキップします。新しいスレッドは新規に開始します。無効化するには `0` を設定します。

実装詳細: この判定は `src/auto-reply/reply/session.ts` の `initSessionState()` で行われます。

---

## セッションストアスキーマ（`sessions.json`）

ストアの値型は `src/config/sessions.ts` の `SessionEntry` です。

主なフィールド（網羅的ではありません）:

- `sessionId`: 現在のトランスクリプト ID（`sessionFile` が設定されていない限り、ファイル名はこれから派生します）
- `sessionStartedAt`: 現在の `sessionId` の開始タイムスタンプ。日次リセットの鮮度はこれを使用します。レガシー行では、JSONL セッションヘッダーから派生する場合があります。
- `lastInteractionAt`: 最後の実ユーザー/チャネル操作タイムスタンプ。アイドルリセットの鮮度はこれを使用するため、heartbeat、Cron、exec イベントによってセッションが維持されることはありません。このフィールドがないレガシー行は、アイドル鮮度について復元されたセッション開始時刻にフォールバックします。
- `updatedAt`: 最後のストア行変更タイムスタンプ。一覧表示、プルーニング、ブックキーピングに使用されます。日次/アイドルリセットの鮮度に対する権威ではありません。
- `sessionFile`: 任意の明示的なトランスクリプトパス上書き
- `chatType`: `direct | group | room`（UI と送信ポリシーを支援）
- `provider`, `subject`, `room`, `space`, `displayName`: グループ/チャネルラベル付け用メタデータ
- トグル:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy`（セッションごとの上書き）
- モデル選択:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- トークンカウンター（ベストエフォート / プロバイダー依存）:
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: このセッションキーで自動 Compaction が完了した回数
- `memoryFlushAt`: 最後の Compaction 前メモリフラッシュのタイムスタンプ
- `memoryFlushCompactionCount`: 最後のフラッシュが実行されたときの Compaction 回数

ストアは編集しても安全ですが、Gateway が権威です。セッション実行時にエントリを書き換えたり再水和したりすることがあります。

---

## トランスクリプト構造（`*.jsonl`）

トランスクリプトは `@mariozechner/pi-coding-agent` の `SessionManager` によって管理されます。

ファイルは JSONL です。

- 1 行目: セッションヘッダー（`type: "session"`、`id`、`cwd`、`timestamp`、任意の `parentSession` を含む）
- 以降: `id` + `parentId` を持つセッションエントリ（ツリー）

注目すべきエントリ種別:

- `message`: user/assistant/toolResult メッセージ
- `custom_message`: モデルコンテキストに入る拡張注入メッセージ（UI から非表示にできます）
- `custom`: モデルコンテキストに入らない拡張状態
- `compaction`: `firstKeptEntryId` と `tokensBefore` を持つ永続化された Compaction サマリー
- `branch_summary`: ツリーブランチを移動するときに永続化されるサマリー

OpenClaw は意図的にトランスクリプトを「修正」しません。Gateway は `SessionManager` を使ってそれらを読み書きします。

---

## コンテキストウィンドウと追跡トークン

重要な概念は 2 つあります。

1. **モデルコンテキストウィンドウ**: モデルごとのハード上限（モデルから見えるトークン）
2. **セッションストアカウンター**: `sessions.json` に書き込まれるローリング統計（/status とダッシュボードで使用）

制限を調整する場合:

- コンテキストウィンドウはモデルカタログから取得されます（設定で上書き可能）。
- ストア内の `contextTokens` はランタイム推定/レポート値です。厳密な保証として扱わないでください。

詳細は [/token-use](/ja-JP/reference/token-use) を参照してください。

---

## Compaction: その内容

Compaction は、古い会話をトランスクリプト内の永続化された `compaction` エントリに要約し、最近のメッセージをそのまま保持します。

Compaction 後、将来のターンから見える内容:

- Compaction サマリー
- `firstKeptEntryId` 以降のメッセージ

Compaction は（セッションのプルーニングとは異なり）**永続的**です。[/concepts/session-pruning](/ja-JP/concepts/session-pruning) を参照してください。

## Compaction チャンク境界とツールのペアリング

OpenClaw が長いトランスクリプトを Compaction チャンクに分割するとき、assistant のツール呼び出しを対応する `toolResult` エントリとペアのまま保持します。

- トークン比率による分割位置がツール呼び出しとその結果の間にある場合、OpenClaw はペアを分離する代わりに、境界を assistant ツール呼び出しメッセージへ移動します。
- 末尾の tool-result ブロックによってチャンクが目標を超えてしまう場合、OpenClaw はその保留中のツールブロックを保持し、未要約の末尾をそのまま維持します。
- 中断/エラーになった tool-call ブロックは、保留中の分割を開いたままにしません。

---

## 自動 Compaction が発生するタイミング（Pi ランタイム）

組み込み Pi エージェントでは、自動 Compaction は 2 つの場合にトリガーされます。

1. **オーバーフロー回復**: モデルがコンテキストオーバーフローエラー（`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded`、および同様のプロバイダー形式のバリアント）を返す → compact → 再試行。
2. **しきい値メンテナンス**: 成功したターンの後、次の場合:

`contextTokens > contextWindow - reserveTokens`

各項目:

- `contextWindow` はモデルのコンテキストウィンドウ
- `reserveTokens` はプロンプト + 次のモデル出力のために予約される余裕

これらは Pi ランタイムのセマンティクスです（OpenClaw はイベントを消費しますが、いつ compact するかは Pi が決定します）。

OpenClaw は、`agents.defaults.compaction.maxActiveTranscriptBytes` が設定され、アクティブなトランスクリプトファイルがそのサイズに達した場合、次の実行を開く前にプリフライトのローカル Compaction をトリガーすることもできます。これはローカル再オープンコストのためのファイルサイズガードであり、生のアーカイブではありません。OpenClaw は通常のセマンティック Compaction を引き続き実行し、Compaction されたサマリーが新しい後続トランスクリプトになれるように `truncateAfterCompaction` を必要とします。

Pi の埋め込み実行では、`agents.defaults.compaction.midTurnPrecheck.enabled: true` により、オプトインのツールループガードが追加されます。ツール結果が追加された後、次のモデル呼び出しの前に、OpenClaw はターン開始時に使われるものと同じプリフライト予算ロジックでプロンプトの圧力を見積もります。コンテキストが収まらなくなっている場合、このガードは Pi の `transformContext` フック内では Compaction しません。構造化されたターン途中プリチェックシグナルを発行し、現在のプロンプト送信を停止し、外側の実行ループに既存の復旧パスを使わせます。十分であれば肥大化したツール結果を切り詰め、そうでなければ設定済みの Compaction モードを起動して再試行します。このオプションはデフォルトで無効で、プロバイダーが担う safeguard Compaction を含め、`default` と `safeguard` の両方の Compaction モードで動作します。
これは `maxActiveTranscriptBytes` とは独立しています。バイトサイズガードはターンが開始する前に実行されますが、ターン途中プリチェックは、新しいツール結果が追加された後の埋め込み Pi ツールループ内で後から実行されます。

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

OpenClaw は埋め込み実行に対して安全下限も適用します。

- `compaction.reserveTokens < reserveTokensFloor` の場合、OpenClaw は値を引き上げます。
- デフォルトの下限は `20000` トークンです。
- 下限を無効にするには、`agents.defaults.compaction.reserveTokensFloor: 0` を設定します。
- すでにより高い値の場合、OpenClaw はそのままにします。
- 手動の `/compact` は、明示的な `agents.defaults.compaction.keepRecentTokens`
  を尊重し、Pi の直近末尾の切り出し位置を保持します。明示的な保持予算がない場合、
  手動 Compaction はハードチェックポイントのままで、再構築されたコンテキストは
  新しい要約から開始します。
- 新しいツール結果の後、次のモデル呼び出しの前に任意のツールループプリチェックを実行するには、
  `agents.defaults.compaction.midTurnPrecheck.enabled: true` を設定します。
  これはトリガーのみです。要約生成は引き続き設定済みの
  Compaction パスを使います。これは `maxActiveTranscriptBytes` とは独立しており、
  後者はターン開始時のアクティブトランスクリプトのバイトサイズガードです。
- アクティブトランスクリプトが大きくなったときにターン前にローカル Compaction を実行するには、
  `agents.defaults.compaction.maxActiveTranscriptBytes` にバイト値または
  `"20mb"` のような文字列を設定します。このガードは
  `truncateAfterCompaction` も有効な場合にのみ有効です。無効にするには、
  未設定のままにするか `0` を設定します。
- `agents.defaults.compaction.truncateAfterCompaction` が有効な場合、
  OpenClaw は Compaction 後に、アクティブトランスクリプトを Compaction 済みの後続 JSONL へローテーションします。古い完全なトランスクリプトは、その場で書き換えられるのではなく、アーカイブされたまま Compaction チェックポイントからリンクされます。

理由: Compaction が避けられなくなる前に、複数ターンにまたがる「ハウスキーピング」（メモリ書き込みなど）に十分な余裕を残すためです。

実装: `src/agents/pi-settings.ts` の `ensurePiCompactionReserveTokens()`
（`src/agents/pi-embedded-runner.ts` から呼び出されます）。

---

## プラグ可能な Compaction プロバイダー

Plugin は Plugin API の `registerCompactionProvider()` を介して Compaction プロバイダーを登録できます。`agents.defaults.compaction.provider` が登録済みプロバイダー ID に設定されている場合、safeguard Plugin は組み込みの `summarizeInStages` パイプラインではなく、そのプロバイダーに要約を委譲します。

- `provider`: 登録済み Compaction プロバイダー Plugin の ID。デフォルトの LLM 要約には未設定のままにします。
- `provider` を設定すると、`mode: "safeguard"` が強制されます。
- プロバイダーは、組み込みパスと同じ Compaction 指示および識別子保持ポリシーを受け取ります。
- safeguard は、プロバイダー出力後も直近ターンと分割ターンの接尾辞コンテキストを保持します。
- 組み込みの safeguard 要約は、以前の完全な要約をそのまま保持するのではなく、
  以前の要約を新しいメッセージとともに再蒸留します。
- Safeguard モードでは、要約品質監査がデフォルトで有効になります。
  不正な形式の出力で再試行する動作をスキップするには、
  `qualityGuard.enabled: false` を設定します。
- プロバイダーが失敗するか空の結果を返した場合、OpenClaw は自動的に組み込みの LLM 要約へフォールバックします。
- 中止/タイムアウトシグナルは、呼び出し元のキャンセルを尊重するため、握りつぶされずに再スローされます。

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

OpenClaw は、ユーザーに中間出力を見せるべきではないバックグラウンドタスク向けに「サイレント」ターンをサポートしています。

規約:

- アシスタントは、正確なサイレントトークン `NO_REPLY` /
  `no_reply` で出力を開始し、「ユーザーに返信を配信しない」ことを示します。
- OpenClaw は配信レイヤーでこれを除去/抑制します。
- 正確なサイレントトークンの抑制は大文字小文字を区別しないため、ペイロード全体がサイレントトークンだけである場合、
  `NO_REPLY` と `no_reply` はどちらも該当します。
- これは本当にバックグラウンド/非配信のターン専用です。通常の実行可能なユーザーリクエストの近道ではありません。

`2026.1.10` 時点で、OpenClaw は部分チャンクが `NO_REPLY` で始まる場合、
**下書き/入力中ストリーミング** も抑制します。そのため、サイレント操作がターン途中に部分出力を漏らすことはありません。

---

## Compaction 前の「メモリフラッシュ」（実装済み）

目的: 自動 Compaction が発生する前に、耐久性のある状態をディスクへ書き込むサイレントなエージェント型ターンを実行します（例: エージェントワークスペース内の `memory/YYYY-MM-DD.md`）。これにより、Compaction が重要なコンテキストを消去できなくなります。

OpenClaw は **事前しきい値フラッシュ** アプローチを使います。

1. セッションのコンテキスト使用量を監視します。
2. それが「ソフトしきい値」（Pi の Compaction しきい値未満）を超えたら、
   エージェントにサイレントな「今すぐメモリを書き込む」指示を実行します。
3. 正確なサイレントトークン `NO_REPLY` / `no_reply` を使い、ユーザーには
   何も見せません。

設定（`agents.defaults.compaction.memoryFlush`）:

- `enabled`（デフォルト: `true`）
- `model`（フラッシュターン用の任意の正確なプロバイダー/モデル上書き。例: `ollama/qwen3:8b`）
- `softThresholdTokens`（デフォルト: `4000`）
- `prompt`（フラッシュターン用のユーザーメッセージ）
- `systemPrompt`（フラッシュターン用に追加される追加システムプロンプト）

注記:

- デフォルトのプロンプト/システムプロンプトには、配信を抑制するための `NO_REPLY` ヒントが含まれます。
- `model` が設定されている場合、フラッシュターンはアクティブセッションのフォールバックチェーンを継承せずにそのモデルを使います。そのため、ローカル専用のハウスキーピングが有料の会話モデルへ静かにフォールバックすることはありません。
- フラッシュは Compaction サイクルごとに 1 回実行されます（`sessions.json` で追跡されます）。
- フラッシュは埋め込み Pi セッションでのみ実行されます（CLI バックエンドではスキップされます）。
- セッションワークスペースが読み取り専用（`workspaceAccess: "ro"` または `"none"`）の場合、フラッシュはスキップされます。
- ワークスペースのファイルレイアウトと書き込みパターンについては、[Memory](/ja-JP/concepts/memory) を参照してください。

Pi は Plugin API で `session_before_compact` フックも公開していますが、OpenClaw のフラッシュロジックは現時点では Gateway 側にあります。

---

## トラブルシューティングチェックリスト

- セッションキーが違いますか？[/concepts/session](/ja-JP/concepts/session) から始めて、`/status` の `sessionKey` を確認してください。
- ストアとトランスクリプトが一致しませんか？`openclaw status` で Gateway ホストとストアパスを確認してください。
- Compaction が多発しますか？次を確認してください。
  - モデルのコンテキストウィンドウ（小さすぎる）
  - Compaction 設定（`reserveTokens` がモデルウィンドウに対して高すぎると、より早い Compaction が発生する可能性があります）
  - ツール結果の肥大化: セッション pruning を有効化/調整してください
- サイレントターンが漏れていますか？返信が `NO_REPLY`（大文字小文字を区別しない正確なトークン）で始まること、およびストリーミング抑制修正を含むビルドを使っていることを確認してください。

## 関連

- [セッション管理](/ja-JP/concepts/session)
- [セッション pruning](/ja-JP/concepts/session-pruning)
- [コンテキストエンジン](/ja-JP/concepts/context-engine)
