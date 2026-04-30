---
read_when:
    - セッション ID、トランスクリプト JSONL、または sessions.json のフィールドをデバッグする必要がある
    - 自動 Compaction の動作を変更しているか、「Compaction 前」の整理処理を追加しています
    - メモリフラッシュまたはサイレントなシステムターンを実装したい場合
summary: '詳細解説: セッションストア + トランスクリプト、ライフサイクル、(自動)Compaction の内部構造'
title: セッション管理の詳細解説
x-i18n:
    generated_at: "2026-04-30T16:30:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a6a7031cebd90d27784a32a0d0378ea9959249389d209f0745395f90b8a0df9
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw は、以下の領域にまたがってセッションをエンドツーエンドで管理します。

- **セッションルーティング**（受信メッセージを `sessionKey` に対応付ける方法）
- **セッションストア**（`sessions.json`）と、それが追跡する内容
- **トランスクリプトの永続化**（`*.jsonl`）と、その構造
- **トランスクリプトの衛生管理**（実行前のプロバイダー固有の修正）
- **コンテキスト制限**（コンテキストウィンドウと追跡トークン）
- **Compaction**（手動および自動 Compaction）と、Compaction 前処理をフックする場所
- **サイレントなハウスキーピング**（ユーザーに見える出力を生成すべきでないメモリ書き込み）

先に上位レベルの概要を確認したい場合は、以下から始めてください。

- [セッション管理](/ja-JP/concepts/session)
- [Compaction](/ja-JP/concepts/compaction)
- [メモリ概要](/ja-JP/concepts/memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [セッション整理](/ja-JP/concepts/session-pruning)
- [トランスクリプトの衛生管理](/ja-JP/reference/transcript-hygiene)

---

## 信頼できる情報源: Gateway

OpenClaw は、セッション状態を所有する単一の **Gateway プロセス**を中心に設計されています。

- UI（macOS アプリ、Web Control UI、TUI）は、セッション一覧とトークン数を Gateway に問い合わせる必要があります。
- リモートモードでは、セッションファイルはリモートホスト上にあります。「ローカルの Mac ファイルを確認する」だけでは、Gateway が使用している内容は反映されません。

---

## 2 つの永続化レイヤー

OpenClaw は、セッションを 2 つのレイヤーで永続化します。

1. **セッションストア（`sessions.json`）**
   - キー/値マップ: `sessionKey -> SessionEntry`
   - 小さく、変更可能で、編集（またはエントリ削除）しても安全
   - セッションメタデータ（現在のセッション ID、最終アクティビティ、切り替え設定、トークンカウンターなど）を追跡します。

2. **トランスクリプト（`<sessionId>.jsonl`）**
   - ツリー構造を持つ追記専用トランスクリプト（エントリは `id` + `parentId` を持ちます）
   - 実際の会話 + ツール呼び出し + Compaction サマリーを保存します
   - 将来のターンでモデルコンテキストを再構築するために使用されます
   - アクティブなトランスクリプトがチェックポイントサイズ上限を超えると、大きな Compaction 前デバッグチェックポイントはスキップされ、2 つ目の巨大な `.checkpoint.*.jsonl` コピーを避けます。

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
- `pruneAfter`: 古いエントリの経過時間しきい値（デフォルト `30d`）
- `maxEntries`: `sessions.json` 内のエントリ上限（デフォルト `500`）
- `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間（デフォルト: `pruneAfter` と同じ。`false` でクリーンアップを無効化）
- `maxDiskBytes`: 任意のセッションディレクトリ容量予算
- `highWaterBytes`: クリーンアップ後の任意の目標値（デフォルトは `maxDiskBytes` の `80%`）

通常の Gateway 書き込みでは、本番サイズの上限に対して `maxEntries` クリーンアップがバッチ処理されるため、次の高水位クリーンアップで上限内に書き戻されるまで、ストアが設定済み上限を一時的に超えることがあります。`openclaw sessions cleanup --enforce` は、設定済み上限を即座に適用します。

OpenClaw は、Gateway 書き込み中に `sessions.json.bak.*` の自動ローテーションバックアップを作成しなくなりました。レガシーの `session.maintenance.rotateBytes` キーは無視され、`openclaw doctor --fix` は古い設定からそのキーを削除します。

ディスク予算クリーンアップ（`mode: "enforce"`）の強制順序:

1. 最初に、最も古いアーカイブ、孤立したトランスクリプト、または孤立した trajectory 成果物を削除します。
2. それでも目標を超えている場合は、最も古いセッションエントリと、そのトランスクリプト/trajectory ファイルを退避します。
3. 使用量が `highWaterBytes` 以下になるまで続けます。

`mode: "warn"` では、OpenClaw は発生し得る退避を報告しますが、ストアやファイルは変更しません。

必要に応じてメンテナンスを実行します。

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron セッションと実行ログ

分離された cron 実行もセッションエントリ/トランスクリプトを作成し、専用の保持制御があります。

- `cron.sessionRetention`（デフォルト `24h`）は、古い分離 cron 実行セッションをセッションストアから整理します（`false` で無効化）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` は、`~/.openclaw/cron/runs/<jobId>.jsonl` ファイルを整理します（デフォルト: `2_000_000` バイトと `2000` 行）。

cron が新しい分離実行セッションを強制作成するときは、新しい行を書き込む前に、以前の `cron:<jobId>` セッションエントリをサニタイズします。thinking/fast/verbose 設定、ラベル、ユーザーが明示的に選択したモデル/認証オーバーライドなどの安全な設定は引き継ぎます。チャネル/グループルーティング、送信またはキューポリシー、昇格、origin、ACP ランタイムバインディングなどの周辺会話コンテキストは破棄されるため、新しい分離実行が古い実行から古い配信権限やランタイム権限を継承することはありません。

---

## セッションキー（`sessionKey`）

`sessionKey` は、_どの会話バケット_にいるか（ルーティング + 分離）を識別します。

一般的なパターン:

- メイン/ダイレクトチャット（エージェントごと）: `agent:<agentId>:<mainKey>`（デフォルト `main`）
- グループ: `agent:<agentId>:<channel>:group:<id>`
- ルーム/チャネル（Discord/Slack）: `agent:<agentId>:<channel>:channel:<id>` または `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>`（上書きされていない場合）

標準ルールは [/concepts/session](/ja-JP/concepts/session) に記載されています。

---

## セッション ID（`sessionId`）

各 `sessionKey` は、現在の `sessionId`（会話を継続するトランスクリプトファイル）を指します。

目安:

- **リセット**（`/new`、`/reset`）は、その `sessionKey` に対して新しい `sessionId` を作成します。
- **日次リセット**（デフォルトでは Gateway ホストのローカル時刻で午前 4:00）は、リセット境界後の次のメッセージで新しい `sessionId` を作成します。
- **アイドル期限切れ**（`session.reset.idleMinutes` またはレガシー `session.idleMinutes`）は、アイドル期間後にメッセージが到着すると新しい `sessionId` を作成します。日次とアイドルの両方が設定されている場合は、先に期限切れになった方が優先されます。
- **システムイベント**（heartbeat、cron ウェイクアップ、exec 通知、gateway ブックキーピング）はセッション行を変更することがありますが、日次/アイドルリセットの鮮度は延長しません。リセットロールオーバーは、新しいプロンプトが構築される前に、前のセッションに対するキュー済みのシステムイベント通知を破棄します。
- **スレッド親フォークガード**（`session.parentForkMaxTokens`、デフォルト `100000`）は、親セッションがすでに大きすぎる場合、親トランスクリプトのフォークをスキップします。新しいスレッドは新規に開始されます。無効にするには `0` を設定します。

実装詳細: この判定は `src/auto-reply/reply/session.ts` の `initSessionState()` で行われます。

---

## セッションストアスキーマ（`sessions.json`）

ストアの値型は `src/config/sessions.ts` の `SessionEntry` です。

主なフィールド（網羅的ではありません）:

- `sessionId`: 現在のトランスクリプト ID（`sessionFile` が設定されていない限り、ファイル名はこれから派生します）
- `sessionStartedAt`: 現在の `sessionId` の開始タイムスタンプ。日次リセットの鮮度はこれを使用します。レガシー行では JSONL セッションヘッダーから派生することがあります。
- `lastInteractionAt`: 最後の実ユーザー/チャネル対話タイムスタンプ。アイドルリセットの鮮度はこれを使用するため、heartbeat、cron、exec イベントはセッションを存続させません。このフィールドがないレガシー行は、復元されたセッション開始時刻をアイドル鮮度のフォールバックとして使用します。
- `updatedAt`: 最後にストア行が変更されたタイムスタンプ。一覧表示、整理、ブックキーピングに使用されます。日次/アイドルリセット鮮度の根拠ではありません。
- `sessionFile`: 任意の明示的なトランスクリプトパス上書き
- `chatType`: `direct | group | room`（UI と送信ポリシーを支援します）
- `provider`, `subject`, `room`, `space`, `displayName`: グループ/チャネルラベル付け用メタデータ
- 切り替え設定:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy`（セッションごとの上書き）
- モデル選択:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- トークンカウンター（ベストエフォート / プロバイダー依存）:
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: このセッションキーで自動 Compaction が完了した回数
- `memoryFlushAt`: 最後の Compaction 前メモリフラッシュのタイムスタンプ
- `memoryFlushCompactionCount`: 最後のフラッシュ実行時の Compaction カウント

ストアは編集しても安全ですが、Gateway が権威です。セッション実行中に、Gateway がエントリを書き換えたり再ハイドレートしたりする場合があります。

---

## トランスクリプト構造（`*.jsonl`）

トランスクリプトは `@mariozechner/pi-coding-agent` の `SessionManager` によって管理されます。

ファイルは JSONL です。

- 1 行目: セッションヘッダー（`type: "session"`、`id`、`cwd`、`timestamp`、任意の `parentSession` を含みます）
- 以降: `id` + `parentId`（ツリー）を持つセッションエントリ

注目すべきエントリタイプ:

- `message`: ユーザー/アシスタント/`toolResult` メッセージ
- `custom_message`: モデルコンテキストに入る、拡張機能から注入されたメッセージ（UI から非表示にできます）
- `custom`: モデルコンテキストに入らない拡張機能状態
- `compaction`: `firstKeptEntryId` と `tokensBefore` を持つ永続化された Compaction サマリー
- `branch_summary`: ツリーブランチを移動するときの永続化されたサマリー

OpenClaw は意図的にトランスクリプトを「修正」しません。Gateway は `SessionManager` を使用して読み書きします。

---

## コンテキストウィンドウと追跡トークン

重要なのは 2 つの異なる概念です。

1. **モデルコンテキストウィンドウ**: モデルごとのハード上限（モデルから見えるトークン）
2. **セッションストアカウンター**: `sessions.json` に書き込まれるローリング統計（/status とダッシュボードで使用）

制限を調整する場合:

- コンテキストウィンドウはモデルカタログから取得されます（設定で上書き可能）。
- ストア内の `contextTokens` はランタイムの推定/報告値です。厳密な保証として扱わないでください。

詳細は [/token-use](/ja-JP/reference/token-use) を参照してください。

---

## Compaction: その内容

Compaction は、古い会話をトランスクリプト内の永続化された `compaction` エントリに要約し、最近のメッセージをそのまま保持します。

Compaction 後、将来のターンには以下が見えます。

- Compaction サマリー
- `firstKeptEntryId` 以降のメッセージ

Compaction は（セッション整理とは異なり）**永続的**です。[/concepts/session-pruning](/ja-JP/concepts/session-pruning) を参照してください。

## Compaction チャンク境界とツールのペアリング

OpenClaw が長いトランスクリプトを Compaction チャンクに分割するとき、アシスタントのツール呼び出しを対応する `toolResult` エントリとペアのまま保持します。

- トークン割合による分割位置がツール呼び出しとその結果の間に来た場合、OpenClaw はペアを分離する代わりに、境界をアシスタントのツール呼び出しメッセージへ移動します。
- 末尾のツール結果ブロックがチャンクを目標超過にしてしまう場合、OpenClaw はその保留中のツールブロックを保持し、要約されていない末尾をそのまま維持します。
- 中止/エラーになったツール呼び出しブロックは、保留中の分割を開いたままにしません。

---

## 自動 Compaction が発生するタイミング（Pi ランタイム）

組み込み Pi エージェントでは、自動 Compaction は 2 つの場合にトリガーされます。

1. **オーバーフロー回復**: モデルがコンテキストオーバーフローエラー（`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded`、および類似したプロバイダー形状のバリアント）を返す → compact → 再試行。
2. **しきい値メンテナンス**: ターンが成功した後、次の場合:

`contextTokens > contextWindow - reserveTokens`

ここで:

- `contextWindow` はモデルのコンテキストウィンドウです
- `reserveTokens` はプロンプト + 次のモデル出力用に予約された余裕です

これらは Pi ランタイムのセマンティクスです（OpenClaw はイベントを消費しますが、いつ compact するかは Pi が決定します）。

OpenClaw は、`agents.defaults.compaction.maxActiveTranscriptBytes` が設定され、アクティブなトランスクリプトファイルがそのサイズに達している場合、次の実行を開く前にプリフライトのローカル Compaction をトリガーすることもできます。これはローカル再オープンコストのためのファイルサイズガードであり、生のアーカイブ処理ではありません。OpenClaw は通常のセマンティック Compaction を引き続き実行し、圧縮済みサマリーが新しい後続トランスクリプトになれるように `truncateAfterCompaction` を必要とします。

埋め込み Pi 実行では、`agents.defaults.compaction.midTurnPrecheck.enabled: true` により、オプトインのツールループガードが追加されます。ツール結果が追加された後、次のモデル呼び出しの前に、OpenClaw はターン開始時に使うものと同じプリフライト予算ロジックでプロンプトの圧力を見積もります。コンテキストが収まらなくなった場合、このガードは Pi の `transformContext` フック内ではコンパクト化しません。構造化されたターン途中の事前チェックシグナルを発行し、現在のプロンプト送信を停止し、外側の実行ループに既存のリカバリパスを使わせます。つまり、それで十分な場合は過大なツール結果を切り詰め、そうでない場合は設定済みの compaction モードをトリガーして再試行します。このオプションはデフォルトでは無効であり、プロバイダーに支えられた safeguard compaction を含め、`default` と `safeguard` の両方の compaction モードで機能します。
これは `maxActiveTranscriptBytes` とは独立しています。バイトサイズガードはターンが開く前に実行されますが、ターン途中の事前チェックは、新しいツール結果が追加された後の埋め込み Pi ツールループ内で、より後に実行されます。

---

## Compaction 設定 (`reserveTokens`, `keepRecentTokens`)

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

OpenClaw は埋め込み実行向けの安全フロアも適用します。

- `compaction.reserveTokens < reserveTokensFloor` の場合、OpenClaw は値を引き上げます。
- デフォルトのフロアは `20000` トークンです。
- フロアを無効にするには、`agents.defaults.compaction.reserveTokensFloor: 0` を設定します。
- すでにそれより高い場合、OpenClaw はそのままにします。
- 手動 `/compact` は明示的な `agents.defaults.compaction.keepRecentTokens`
  を尊重し、Pi の直近末尾の切り取り位置を維持します。明示的な保持予算がない場合、
  手動 compaction は引き続きハードチェックポイントとして扱われ、再構築されたコンテキストは
  新しい要約から始まります。
- 新しいツール結果の後、次のモデル呼び出しの前に、任意のツールループ事前チェックを実行するには
  `agents.defaults.compaction.midTurnPrecheck.enabled: true` を設定します。
  これはトリガーのみです。要約生成は引き続き設定済みの compaction パスを使います。
  これは `maxActiveTranscriptBytes` とは独立しています。`maxActiveTranscriptBytes` は
  ターン開始時のアクティブトランスクリプトのバイトサイズガードです。
- アクティブトランスクリプトが大きくなったとき、ターン前にローカル compaction を実行するには、
  `agents.defaults.compaction.maxActiveTranscriptBytes` にバイト値、または
  `"20mb"` のような文字列を設定します。このガードは
  `truncateAfterCompaction` も有効な場合にのみ有効です。無効にするには、
  未設定のままにするか `0` を設定します。
- `agents.defaults.compaction.truncateAfterCompaction` が有効な場合、
  OpenClaw は compaction 後にアクティブトランスクリプトをコンパクト化された後続 JSONL へローテーションします。
  古い完全なトランスクリプトは、インプレースで書き換えられるのではなく、アーカイブされたまま
  compaction チェックポイントからリンクされます。

理由: compaction が避けられなくなる前に、複数ターンにまたがる「ハウスキーピング」（メモリ書き込みなど）に十分な余裕を残すためです。

実装: `src/agents/pi-settings.ts` の `ensurePiCompactionReserveTokens()`
（`src/agents/pi-embedded-runner.ts` から呼び出されます）。

---

## プラグ可能な compaction プロバイダー

Plugin は Plugin API の `registerCompactionProvider()` を介して compaction プロバイダーを登録できます。`agents.defaults.compaction.provider` が登録済みプロバイダー ID に設定されている場合、セーフガード拡張機能は組み込みの `summarizeInStages` パイプラインではなく、そのプロバイダーへ要約を委譲します。

- `provider`: 登録済み compaction プロバイダー Plugin の ID。デフォルトの LLM 要約を使う場合は未設定のままにします。
- `provider` を設定すると、`mode: "safeguard"` が強制されます。
- プロバイダーは、組み込みパスと同じ compaction 指示と識別子保持ポリシーを受け取ります。
- セーフガードは、プロバイダー出力後も直近ターンと分割ターンのサフィックスコンテキストを保持します。
- 組み込みのセーフガード要約は、以前の完全な要約をそのまま保持するのではなく、
  新しいメッセージとともに以前の要約を再蒸留します。
- セーフガードモードでは、要約品質監査がデフォルトで有効になります。
  不正な形式の出力時に再試行する動作をスキップするには、`qualityGuard.enabled: false` を設定します。
- プロバイダーが失敗するか空の結果を返した場合、OpenClaw は自動的に組み込みの LLM 要約へフォールバックします。
- 呼び出し元のキャンセルを尊重するため、アボート/タイムアウトシグナルは再スローされます（握りつぶされません）。

ソース: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## ユーザーに表示されるサーフェス

Compaction とセッション状態は、次の方法で確認できます。

- `/status`（任意のチャットセッション内）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- 詳細モード: `🧹 Auto-compaction complete` + compaction 回数

---

## サイレントハウスキーピング (`NO_REPLY`)

OpenClaw は、ユーザーに中間出力を見せるべきではないバックグラウンドタスク向けに「サイレント」ターンをサポートしています。

規約:

- アシスタントは、出力を正確なサイレントトークン `NO_REPLY` /
  `no_reply` で開始し、「ユーザーへ返信を配信しない」ことを示します。
- OpenClaw は配信レイヤーでこれを削除または抑制します。
- 正確なサイレントトークンの抑制は大文字小文字を区別しないため、ペイロード全体がサイレントトークンだけである場合、
  `NO_REPLY` と `no_reply` はどちらも該当します。
- これは真のバックグラウンド/非配信ターン専用です。通常の実行可能なユーザー要求のショートカットではありません。

`2026.1.10` 時点で、OpenClaw は部分チャンクが `NO_REPLY` で始まる場合、
**ドラフト/入力中ストリーミング** も抑制します。そのため、サイレント操作がターン途中で部分出力を漏らすことはありません。

---

## Compaction 前の「メモリフラッシュ」（実装済み）

目的: 自動 compaction が発生する前に、永続的な状態をディスクへ書き込むサイレントなエージェント的ターンを実行します
（例: エージェントワークスペース内の `memory/YYYY-MM-DD.md`）。これにより、compaction が重要なコンテキストを消せないようにします。

OpenClaw は **しきい値前フラッシュ** のアプローチを使用します。

1. セッションコンテキスト使用量を監視します。
2. 「ソフトしきい値」（Pi の compaction しきい値より低い値）を超えたら、サイレントな
   「今すぐメモリを書き込む」指示をエージェントへ実行します。
3. 正確なサイレントトークン `NO_REPLY` / `no_reply` を使い、ユーザーには
   何も表示しません。

設定 (`agents.defaults.compaction.memoryFlush`):

- `enabled`（デフォルト: `true`）
- `model`（フラッシュターン向けの任意の正確なプロバイダー/モデル上書き。例: `ollama/qwen3:8b`）
- `softThresholdTokens`（デフォルト: `4000`）
- `prompt`（フラッシュターン用のユーザーメッセージ）
- `systemPrompt`（フラッシュターン用に追加される追加システムプロンプト）

注記:

- デフォルトのプロンプト/システムプロンプトには、配信を抑制するための `NO_REPLY` ヒントが含まれます。
- `model` が設定されている場合、フラッシュターンはアクティブセッションのフォールバックチェーンを継承せずに
  そのモデルを使用します。そのため、ローカル専用のハウスキーピングが有料の会話モデルへ
  静かにフォールバックすることはありません。
- フラッシュは compaction サイクルごとに 1 回実行されます（`sessions.json` で追跡されます）。
- フラッシュは埋め込み Pi セッションでのみ実行されます（CLI バックエンドではスキップされます）。
- セッションワークスペースが読み取り専用（`workspaceAccess: "ro"` または `"none"`）の場合、フラッシュはスキップされます。
- ワークスペースのファイルレイアウトと書き込みパターンについては、[メモリ](/ja-JP/concepts/memory) を参照してください。

Pi は拡張 API で `session_before_compact` フックも公開していますが、OpenClaw の
フラッシュロジックは現在 Gateway 側にあります。

---

## トラブルシューティングチェックリスト

- セッションキーが間違っていますか？[/concepts/session](/ja-JP/concepts/session) から始めて、`/status` の `sessionKey` を確認してください。
- ストアとトランスクリプトが一致しませんか？`openclaw status` で Gateway ホストとストアパスを確認してください。
- Compaction が頻発しますか？確認項目:
  - モデルのコンテキストウィンドウ（小さすぎる）
  - compaction 設定（`reserveTokens` がモデルウィンドウに対して高すぎると、より早く compaction が発生する可能性があります）
  - ツール結果の肥大化: セッションプルーニングを有効化/調整してください
- サイレントターンが漏れていますか？返信が `NO_REPLY`（大文字小文字を区別しない正確なトークン）で始まっていること、およびストリーミング抑制修正を含むビルドを使っていることを確認してください。

## 関連

- [セッション管理](/ja-JP/concepts/session)
- [セッションプルーニング](/ja-JP/concepts/session-pruning)
- [コンテキストエンジン](/ja-JP/concepts/context-engine)
