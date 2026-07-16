---
read_when:
    - セッション ID、トランスクリプトイベント、またはセッション行のフィールドをデバッグする必要がある場合
    - 自動 Compaction の動作を変更する、または「Compaction 前」のハウスキーピングを追加する場合
    - メモリのフラッシュまたはサイレントなシステムターンを実装する場合
summary: 詳細解説：セッションストアとトランスクリプト、ライフサイクル、（自動）Compactionの内部構造
title: セッション管理の詳細解説
x-i18n:
    generated_at: "2026-07-16T12:09:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7551a94a4e2dc8be8b69503795309d0200cc3b5d7231b54083dbcaade697b06c
    source_path: reference/session-management-compaction.md
    workflow: 16
---

単一の **Gateway プロセス**がセッション状態をエンドツーエンドで管理します。UI（macOS アプリ、Web Control UI、TUI）は、セッション一覧とトークン数を Gateway に問い合わせます。リモートモードでは、セッションファイルはリモートホストに保存されるため、ローカルの Mac 上のファイルを確認しても、Gateway が使用している内容は反映されません。

まず概要ドキュメントを参照してください：[セッション管理](/ja-JP/concepts/session)、[Compaction](/ja-JP/concepts/compaction)、[メモリの概要](/ja-JP/concepts/memory)、[メモリ検索](/ja-JP/concepts/memory-search)、[セッションのプルーニング](/ja-JP/concepts/session-pruning)、[トランスクリプトの健全性](/ja-JP/reference/transcript-hygiene)。完全な設定リファレンスは[エージェント設定](/ja-JP/gateway/config-agents)にあります。

## 2 つの永続化レイヤー

1. **セッション行（エージェントごとの SQLite）** - キー／値マップ `sessionKey -> SessionEntry`。Gateway が管理する変更可能なランタイム状態です。現在のセッション ID、最終アクティビティ、切り替え設定、トークンカウンターなどのメタデータを追跡します。
2. **トランスクリプトイベント（エージェントごとの SQLite）** - 追記専用のツリー構造（エントリには `id` + `parentId` があります）。会話、ツール呼び出し、Compaction の要約を保存し、以後のターン用にモデルコンテキストを再構築します。Compaction チェックポイントは、圧縮された後継トランスクリプト上のメタデータです。新たな Compaction によって 2 つ目の `.checkpoint.*.jsonl` コピーが書き込まれることはありません。

古いインストールには、エージェントの `sessions/`
ディレクトリ内に `sessions.json` ファイルが残っている場合があります。
これらのファイルは、従来のセッション行の移行入力、または明示的な
オフラインメンテナンス対象として扱ってください。Gateway の起動時および
`openclaw doctor --fix` は、使用中の従来行とトランスクリプト履歴を
エージェントごとの SQLite ストアへ自動的にインポートします。明示的な
検査または検証の証拠が必要な場合は、`openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` を実行してから
[Doctor の移行手順](/ja-JP/cli/doctor#session-sqlite-migration)に従ってください。
従来のトランスクリプト成果物のアーカイブ後に移行が失敗した場合は、その手順にある
Doctor のリカバリモードを使用してください。リカバリでは移行マニフェストを使用し、
影響を受けたアーカイブ済みサポート成果物のみを復元し、要求された場合は
サニタイズ済みの GitHub Issue レポートを作成します。また、アクティブなランタイムが
JSONL ファイルを再び読み取るようにはしません。

Gateway の履歴リーダーは、任意の過去データへのアクセスが必要なサーフェスを除き、トランスクリプト全体をメモリ上に展開しません。最初のページの履歴、埋め込みチャット履歴、再起動時の復旧、トークン／使用量の確認には、SQLite からの上限付き末尾読み取りを使用します。トランスクリプト全体のスキャンは非同期トランスクリプトインデックスを介して行われ、同時実行される複数のリーダー間で共有されます。

## ディスク上の場所

Gateway ホスト上のエージェントごとの場所（`src/config/sessions.ts` によって解決）：

- ランタイムセッション行ストア：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- ランタイムトランスクリプト行：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- 従来／アーカイブ済みトランスクリプト成果物：`~/.openclaw/agents/<agentId>/sessions/`
- 従来行の移行入力：`~/.openclaw/agents/<agentId>/sessions/sessions.json`

## ストアのメンテナンスとディスク制御

`session.maintenance` は、SQLite セッション行、SQLite トランスクリプト行、アーカイブ成果物、軌跡サイドカーの自動メンテナンスを制御します。

| キー                    | デフォルト            | 備考                                                                                        |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | または `"warn"`（報告のみ、変更なし）                                                      |
| `pruneAfter`            | `"30d"`               | 古いエントリとみなす経過時間のしきい値                                                                      |
| `maxEntries`            | `500`                 | セッションエントリ数の上限                                                                      |
| `resetArchiveRetention` | 保持（経過時間のしきい値なし） | `*.reset.*`/`*.deleted.*` トランスクリプトアーカイブの経過時間しきい値。期間を指定すると削除が有効になります |
| `maxDiskBytes`          | `2gb`                 | エージェントごとのセッションのディスク容量。`false` で無効化                                            |
| `highWaterBytes`        | `maxDiskBytes` の 80% | 容量クリーンアップ後の目標                                                                 |

アーカイブ済みトランスクリプトはデフォルトで保持され、ランタイムが対応している場合は zstd（`*.jsonl.<reason>.<timestamp>.zst`）で圧縮されます。そのため、セッションを削除またはリセットしても、会話履歴が暗黙に破棄されることはありません。ディスク容量を超えた場合は、使用中のセッションに触れる前に、最も古いアーカイブから削除されます。

`maxDiskBytes` のアクティブな SQLite 適用では、セッションごとにセッション行の JSON とトランスクリプトイベントの JSON のバイト数を測定します。従来のオフラインメンテナンスでの適用では、選択したセッションディレクトリ内のファイルを測定します。

Gateway のモデル実行プローブセッション（`agent:*:explicit:model-run-<uuid>` に一致するキー）には、固定された別個の `24h` 保持期間が適用されます。このプルーニングは負荷条件付きです。セッションエントリのメンテナンスまたは上限による負荷に達した場合にのみ実行され、グローバルな古いエントリのクリーンアップ／上限処理より前にのみ行われます。他の明示的なセッションには、この保持期間は適用されません。

ディスク容量クリーンアップ（`mode: "enforce"`）の適用順序：

1. 最も古いアーカイブ済みトランスクリプト成果物、孤立した従来成果物、または孤立した軌跡成果物を最初に削除します。
2. それでも目標を上回る場合は、最も古いセッションエントリと、そのトランスクリプト行または軌跡成果物を削除します。
3. 使用量が `highWaterBytes` 以下になるまで繰り返します。

`mode: "warn"` は、ストアまたはファイルを変更せずに、削除される可能性のある項目を報告します。

必要に応じてメンテナンスを実行します：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

メンテナンスでは、グループセッションやスレッド単位のチャットセッションなど、永続的な外部会話ポインターは維持されます。ただし、合成ランタイムエントリ（Cron、フック、Heartbeat、ACP、サブエージェント）は、設定された経過時間、件数、またはディスク容量を超えると削除される場合があります。分離された Cron 実行には、モデル実行プローブの保持とは独立した別個の `cron.sessionRetention` 制御が使用されます。

通常の Gateway 書き込みはセッションアクセサーを経由し、ランタイムライターパスを通じてエージェントごとの SQLite 変更を直列化します。ランタイムコードでは `src/config/sessions/session-accessor.ts` のアクセサーヘルパーを優先してください。従来の `sessions.json` ヘルパーは、移行およびオフラインメンテナンス用のツールです。Gateway に到達可能な場合、ドライランではない `openclaw sessions cleanup` と `openclaw agents delete` はストアの変更を Gateway に委任し、クリーンアップを同じライターキューに参加させます。`--store <path>` は、選択した従来ストアに対する明示的なオフライン修復パスであり、常にローカルで実行されます（`--dry-run` も同様です）。`maxEntries` のクリーンアップは本番規模のストア向けにバッチ処理されるため、次回の高水位クリーンアップによって上限以下に書き直されるまで、ストアが設定上限を一時的に超える場合があります。Gateway の起動中に読み取りによってエントリがプルーニングされたり上限が適用されたりすることはありません。これらを行うのは書き込みまたは `openclaw sessions cleanup --enforce` のみです。後者は上限も即座に適用し、ディスク容量が設定されていない場合でも、参照されていない古い従来トランスクリプト、チェックポイント、軌跡成果物をプルーニングします。

OpenClaw は、Gateway の書き込み中に `sessions.json.bak.*` ローテーションバックアップを自動作成しなくなりました。現在のスキーマは従来の `session.maintenance.rotateBytes` キーを拒否し、`openclaw doctor --fix` は古い設定からそのキーを削除します。

トランスクリプトの変更では、SQLite トランスクリプトターゲット用のセッション書き込みキューを使用します：

| 設定                                 | デフォルト | 環境変数による上書き                               |
| ------------------------------------ | --------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`   | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000` | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`  | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` は、ロック待機を諦める前に、セッション使用中エラーとして表面化させるまでの時間です。正当な準備、クリーンアップ、Compaction、またはトランスクリプトのミラーリング処理が低速なマシン上でより長く競合する場合にのみ増やしてください。`staleMs` は、既存のロックを古いものとして再取得できるようになる時間です。`maxHoldMs` は、プロセス内ウォッチドッグがロックを解放するしきい値です。

### SQLite への切り替え後のダウングレード

古いファイルベースの OpenClaw バージョンを実行する前に、
アーカイブ済みの従来トランスクリプト成果物を復元してください：

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

移行では、サポートおよびロールバック用に従来の `sessions.json` ファイルを
そのまま残しますが、SQLite にインポートされた使用中のトランスクリプト JSONL ファイルは
`session-sqlite-import-archive/` に名前変更されます。古いファイルベースのランタイムは
`sessions.json` 内の `sessionFile` パスを参照するため、起動前に
これらの成果物を復元する必要があります。復元では移行マニフェストを使用し、
元のパスが存在しない記録済みのアーカイブ成果物のみを移動し、将来のリカバリ用に
SQLite データベースをそのまま残します。

SQLite への切り替え後に作成されたセッションは SQLite のみに存在し、
古いファイルベースのランタイムには表示されません。ダウングレード後に再アップグレードする場合は、
Doctor の検査および検証手順をもう一度実行し、復元された従来成果物を
インポート前に OpenClaw が検証できるようにしてください。

## Cron セッションと実行ログ

分離された Cron 実行は、専用の保持設定を持つ独自のセッションエントリ／トランスクリプトを作成します：

- `cron.sessionRetention`（デフォルト `"24h"`）は、古い分離 Cron 実行セッションをストアからプルーニングします。`false` で無効化します。
- 実行履歴では、Cron ジョブごとに最新の 2000 件の終了行を保持します。失われた行には、24 時間のクリーンアップ期間が引き続き適用されます。

Cron が新しい分離実行セッションを強制作成する場合、新しい行を書き込む前に、以前の `cron:<jobId>` セッションエントリをサニタイズします。安全な設定（思考／高速／詳細／推論設定、ラベル、表示名）と、ユーザーが明示的に選択したモデル／認証の上書きは引き継ぎますが、周辺の会話コンテキスト（チャンネル／グループのルーティング、送信／キューポリシー、権限昇格、オリジン、ACP ランタイムバインディング）は削除します。これにより、新しい分離実行が古い実行から陳腐化した配信権限またはランタイム権限を継承することを防ぎます。

## セッションキー（`sessionKey`）

`sessionKey` は、どの会話バケットに属しているか（ルーティング + 分離）を識別します。正規ルール：[/concepts/session](/ja-JP/concepts/session)。

| パターン                     | 例                                                          |
| ---------------------------- | ----------------------------------------------------------- |
| メイン／ダイレクトチャット（エージェントごと） | `agent:<agentId>:<mainKey>`（デフォルト `main`）                |
| グループ                     | `agent:<agentId>:<channel>:group:<id>`                      |
| ルーム／チャンネル（Discord/Slack） | `agent:<agentId>:<channel>:channel:<id>` または `...:room:<id>` |
| Cron                         | `cron:<job.id>`                                             |
| Webhook                      | `hook:<uuid>`（上書きされない場合）                           |

## セッション ID（`sessionId`）

各 `sessionKey` は、現在の `sessionId`（会話を継続する SQLite トランスクリプトの識別子）を指します。判定ロジックは `src/auto-reply/reply/session.ts` 内の `initSessionState()` にあります。

- **リセット**（`/new`、`/reset`）は、その`sessionKey`用に新しい`sessionId`を作成します。
- **日次リセット**（デフォルトでは Gateway ホストの現地時刻午前4:00）は、リセット境界後の次のメッセージで新しい`sessionId`を作成します。
- **アイドル期限切れ**（`session.reset.idleMinutes`、またはレガシーの`session.idleMinutes`）は、アイドル期間後にメッセージが到着すると、新しい`sessionId`を作成します。日次とアイドルの両方が設定されている場合は、先に期限切れになった方が優先されます。
- **Control UI の再接続再開**は、Gateway がオペレーター UI クライアントから一致する`sessionId`を受信した場合、再接続後の1回の送信に限り、現在表示されているセッションを維持します。これは1回限りのシグナルです。通常の古い送信では、引き続き新しい`sessionId`が作成されます。
- **システムイベント**（Heartbeat、Cron ウェイクアップ、exec 通知、Gateway の管理処理）はセッション行を変更することがありますが、日次／アイドルリセットの鮮度を延長することはありません。リセットによる切り替えでは、新しいプロンプトを構築する前に、前のセッション用にキューに入っているシステムイベント通知が破棄されます。
- **親フォークポリシー**は、スレッドまたはサブエージェントのフォークを作成するときに、OpenClaw のアクティブなブランチを使用します。そのブランチが大きすぎる場合（固定の内部上限を超える場合。現在は100Kトークン）、OpenClaw は失敗したり使用不能な履歴を継承したりする代わりに、分離されたコンテキストで子を開始します。サイズ判定は自動であり、設定できません。レガシーの`session.parentForkMaxTokens`設定は`openclaw doctor --fix`によって削除されます。
- **オペレーターフォーク**：`sessions.create { parentSessionKey, fork: true }`は、親の現在の状態からトランスクリプトが分岐する新しいセッションを作成します（上記のサイズ上限を含め、サブエージェント生成と同じフォーク機構）。親で実行がアクティブな間はフォークが拒否され、明示的にモデルが渡されない限り親のモデル選択を継承し、子を新しいトークンカウンターを持つ`forkedFromParent`としてマークします。

## セッションストアのスキーマ

ランタイムストアは、エージェントごとの SQLite に`SessionEntry`値を保持します。値の型は、`src/config/sessions.ts`内の`SessionEntry`です。主なフィールド（すべてではありません）：

- `sessionId`：SQLite のトランスクリプト行を参照するために使用する現在のトランスクリプト ID
- `sessionStartedAt`：現在の`sessionId`の開始タイムスタンプ。日次リセットの鮮度判定で使用されます。レガシー行では、JSONL セッションヘッダーから導出される場合があります。
- `lastInteractionAt`：最後の実際のユーザー／チャンネル操作のタイムスタンプ。Heartbeat、Cron、exec イベントによってセッションが維持されないよう、アイドルリセットの鮮度判定で使用されます。このフィールドがないレガシー行では、復元されたセッション開始時刻にフォールバックします。
- `updatedAt`：ストア行が最後に変更されたタイムスタンプ。一覧表示、削除、管理処理に使用され、日次／アイドルの鮮度を決定する基準ではありません。
- `archivedAt`：省略可能なアーカイブタイムスタンプ。アーカイブ済みセッションは、トランスクリプトをそのまま保持してストアに残り、通常のアクティブ一覧から除外されます。
- `pinnedAt`：省略可能なピン留めタイムスタンプ。アクティブなピン留め済みセッションは、ピン留めされていないセッションより前に並びます。セッションをアーカイブすると、そのピン留めは解除されます。
- Codex スレッド相互運用：両方のフィールドは Codex のスレッド管理形式に従います。通信上の`archived`／`pinned`ブール値は常にタイムスタンプから導出され、サーバー側で設定されます。これは Codex の`threads.archived_at`セマンティクスおよび camelCase シリアル化と一致します。OpenClaw のタイムスタンプはエポックミリ秒、Codex はエポック秒を使用するため、ブリッジは`codex` Plugin 境界で変換します。Codex にはまだピン留め API がなく（`thread/archive`／`thread/unarchive`のみ）、API が追加されるまではピン留め状態を OpenClaw 側に保持します。追加後は形式が一致しているため、バインドされたセッションのピン留め状態を機械的に往復変換できます。
- Codex の監視では、アーカイブされていないネイティブスレッドのみが一覧表示されます。Gateway ローカルの`idle`または`notLoaded`でアクティビティが不明なスレッドは、他の Codex プロセスが所有していないことをオペレーターが明示的に確認した場合にのみ、ネイティブの`thread/archive`を通じてアーカイブできます。Plugin は最初にプロセスローカルの最新ステータスを読み取り、その後スレッドはカタログから消えます。この読み取りでは、別の App Server プロセスがそのスレッドを使用していないことを証明できません。OpenClaw はアクティブな行とエラー行のアーカイブを拒否します。また、Node ブリッジがストリーミングされるスレッドのライフサイクル全体を所有できるようになるまで、ペアリングされた Node のアーカイブは利用できません。ネイティブ Codex クライアントでアーカイブを解除すると、そのスレッドは再び表示対象になります。
- `lastReadAt`／`markedUnreadAt`：`sessions.patch { unread }`によってサーバー側で設定される既読状態のタイムスタンプ。`unread: false`は既読を記録し（`lastReadAt`を設定して`markedUnreadAt`をクリア）、`unread: true`は次に既読になるまでセッションを未読としてマークします。セッション行は、明示的に未読とマークされている、または最新のアクティビティより前に既読になっていることを示す、導出された`unread`ブール値を公開します。一度も既読としてマークされていないセッションは`unread: false`のままなので、既存のインストール環境がアップグレード時に一斉に未読表示になることはありません。
- `lastActivityAt`：未読に値するアクティビティとして扱われる、最後に完了したエージェント実行（ユーザー、チャンネル、Cron 実行）のタイムスタンプ。Heartbeat と内部イベントのターン、およびメタデータのパッチでは更新されません。`updatedAt`はアクティビティシグナルではありません。
- `sessionFile`：移行／アーカイブの互換性のために保持されるレガシーマーカー。アクティブなランタイムは SQLite の ID を使用します
- `chatType`：`direct | group | room`
- `provider`、`subject`、`room`、`space`、`displayName`：グループ／チャンネルのラベル付けメタデータ
- 切り替え設定：`thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`、`sendPolicy`（セッション単位のオーバーライド）
- モデル選択：`providerOverride`、`modelOverride`、`authProfileOverride`
- トークンカウンター（ベストエフォート／プロバイダー依存）：`inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：このセッションキーで自動 Compaction が完了した回数
- `memoryFlushAt`／`memoryFlushCompactionCount`：最後の Compaction 前メモリフラッシュのタイムスタンプと Compaction 回数

Gateway が信頼できる情報源です。セッションの実行中に、エントリを書き換えたり再構築したりすることがあります。レガシーのファイルベースのインストール環境では、
`sessions.json`を編集してランタイムがそのファイルを読み続けることを期待するのではなく、
`openclaw doctor --session-sqlite import --session-sqlite-all-agents`を使用して移行してください。

## トランスクリプトイベントの構造

トランスクリプトは OpenClaw セッションアクセサーによって管理され、ID ベースのヘルパーを通じてランタイムコードに公開されます。イベントストリームは追記専用です：

- 最初のエントリ：セッションヘッダー — `type: "session"`、`id`、`cwd`、`timestamp`、省略可能な`parentSession`。
- 以降：`id` + `parentId`を持つエントリ（ツリー構造）。

主なエントリタイプ：

- `message`：ユーザー／アシスタント／toolResult メッセージ
- `custom_message`：拡張機能から注入され、モデルコンテキストに_入る_メッセージ（`display: true`の場合は TUI に表示され、`display: false`の場合は完全に非表示）
- `custom`：モデルコンテキストに_入らない_拡張機能の状態（再読み込みをまたいで拡張機能の状態を永続化するため）
- `compaction`：`firstKeptEntryId`と`tokensBefore`を持つ永続化された Compaction 要約
- `branch_summary`：ツリーブランチを移動するときに永続化される要約

OpenClaw は意図的にトランスクリプトを「修正」しません。Gateway は`SessionManager`を使用して読み書きします。

## コンテキストウィンドウと追跡トークン

異なる2つの概念があります：

1. **モデルのコンテキストウィンドウ**：モデルごとのハード上限（モデルから見えるトークン）。モデルカタログから取得され、設定でオーバーライドできます。
2. **セッションストアのカウンター**：セッション行に書き込まれるローリング統計（`/status`とダッシュボードで使用）。`contextTokens`はランタイムの推定値／レポート値であり、厳密な保証として扱わないでください。

制限の詳細：[/reference/token-use](/ja-JP/reference/token-use)。

## Compaction とは

Compaction は、古い会話をトランスクリプト内の永続化された`compaction`エントリに要約し、最近のメッセージをそのまま保持します。Compaction 後のターンでは、Compaction 要約と`firstKeptEntryId`より後のメッセージが参照されます。セッションのプルーニングとは異なり、Compaction は**永続的**です。[/concepts/session-pruning](/ja-JP/concepts/session-pruning)を参照してください。

Compaction 後の AGENTS.md セクションの再注入は、`agents.defaults.compaction.postCompactionSections`によるオプトインです。未設定または`[]`の場合、OpenClaw は Compaction 要約の上に AGENTS.md の抜粋を追加しません。

### チャンク境界とツールのペアリング

長いトランスクリプトを Compaction チャンクに分割するとき、OpenClaw はアシスタントのツール呼び出しと、それに対応する`toolResult`エントリのペアを維持します：

- トークン比率による分割位置がツール呼び出しとその結果の間になる場合、OpenClaw はペアを分離せず、境界をアシスタントのツール呼び出しメッセージまで移動します。
- 末尾のツール結果ブロックによってチャンクが目標を超える場合、OpenClaw はその保留中のツールブロックを維持し、要約されていない末尾部分をそのまま残します。
- 中断／エラーになったツール呼び出しブロックは、保留中の分割を開いたままにしません。

## 自動 Compaction が発生するタイミング

組み込み OpenClaw エージェントには2つのトリガーがあります：

1. **オーバーフロー復旧**：モデルがコンテキストオーバーフローエラー（`request_too_large`、`context length exceeded`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`、`ollama error: context length exceeded`、およびその他のプロバイダー固有の形式）を返した場合、Compaction を実行してから再試行します。プロバイダーが試行時のトークン数を報告した場合、OpenClaw は観測されたその数をオーバーフロー復旧の Compaction に渡します。プロバイダーがオーバーフローを確認しても解析可能な数を公開しない場合、OpenClaw は予算を最小限だけ超える合成値を Compaction エンジンと診断処理に渡します。オーバーフロー復旧が引き続き失敗した場合、OpenClaw は現在のセッションマッピングを維持したまま明示的な対処方法を表示し、暗黙に新しいセッション ID へ切り替えることはありません。メッセージを再試行するか、`/compact`または`/new`を実行してください。
2. **しきい値メンテナンス**：ターンが正常に完了した後、`contextTokens > contextWindow - reserveTokens`になった場合に実行されます。ここで、`contextWindow`はモデルのコンテキストウィンドウ、`reserveTokens`はプロンプトと次のモデル出力用に予約される余裕です。

これら2つのトリガーの外側で、さらに2つのガードが実行されます：

- **プリフライトローカル Compaction**：`agents.defaults.compaction.maxActiveTranscriptBytes`（バイト数、または`"20mb"`のような文字列）を設定すると、アクティブなトランスクリプトがそのサイズに達した時点で、次の実行を開始する前にローカル Compaction がトリガーされます。これはローカルで再度開く際のコストに対するサイズガードであり、未加工のアーカイブではありません。通常の意味的 Compaction は引き続き実行され、Compaction 済みの要約を新しい後継トランスクリプトにするために`truncateAfterCompaction`が必要です。
- **ターン途中の事前チェック**：`agents.defaults.compaction.midTurnPrecheck.enabled: true`（デフォルトは`false`）を設定すると、ツールループガードが追加されます。ツール結果が追加された後、次のモデル呼び出しの前に、OpenClaw はターン開始時と同じプリフライト予算ロジックを使用してプロンプトの負荷を推定します。コンテキストに収まらなくなった場合、ガードはその場で Compaction を行いません。代わりに構造化されたターン途中の事前チェックシグナルを発生させ、現在のプロンプト送信を停止し、外側の実行ループに既存の復旧パスを使用させます（それで十分な場合は大きすぎるツール結果を切り詰め、そうでなければ設定された Compaction モードをトリガーして再試行します）。プロバイダーによるセーフガード Compaction を含め、`default`と`safeguard`の両方の Compaction モードで機能します。`maxActiveTranscriptBytes`とは独立しています。バイトサイズガードはターンが開始する前に実行され、ターン途中の事前チェックはその後、新しいツール結果が追加されてから実行されます。

## Compaction の設定

```json5
{
  agents: {
    defaults: {
      compaction: {
        enabled: true,
        reserveTokens: 16384,
        keepRecentTokens: 20000,
      },
    },
  },
}
```

OpenClaw は埋め込み実行に対しても安全性の下限を適用します。`compaction.reserveTokens` が `reserveTokensFloor`（デフォルトは `20000`）を下回る場合、OpenClaw はその値を下限まで引き上げます。下限を無効にするには、`agents.defaults.compaction.reserveTokensFloor: 0` を設定します。アクティブなモデルのコンテキストウィンドウが既知の場合、予約領域がプロンプト予算全体を消費しないように、下限と最終的な有効予約領域の両方に上限が設定されます。これにより、コンテキストの小さいモデル（たとえば 16K トークンのローカルモデル）が最初のトークンから Compaction に入ることを防ぎます。コンテキストウィンドウが不明な場合、設定済みおよび現在の予約予算には上限が設定されません。そもそも下限が必要な理由は、Compaction が避けられなくなる前に、複数ターンにわたる「ハウスキーピング」（以下のメモリフラッシュなど）に十分な余裕を残すためです。実装は `src/agents/agent-settings.ts` の `applyAgentCompactionSettingsFromConfig()` で、埋め込みランナーのターンおよび Compaction のセットアップパスから呼び出されます。

手動の `/compact` は、明示的な `agents.defaults.compaction.keepRecentTokens` を尊重し、ランタイムの直近末尾の切り分け位置を維持します。維持予算が明示されていない場合、手動 Compaction は厳密なチェックポイントとなり、再構築されたコンテキストは新しい要約から開始されます。

`truncateAfterCompaction` が有効な場合、OpenClaw は Compaction 後にアクティブなトランスクリプトを圧縮済みの後継へローテーションします。ブランチ／復元チェックポイントのアクションでは、その圧縮済みの後継が使用されます。Compaction 前の従来のチェックポイントファイルは、参照されている間は引き続き読み取り可能です。

## プラグイン可能な Compaction プロバイダー

Plugin は、Plugin API の `registerCompactionProvider()` を介して Compaction プロバイダーを登録します。`agents.defaults.compaction.provider` に登録済みプロバイダー ID が設定されている場合、セーフガード拡張機能は、組み込みの `summarizeInStages` パイプラインではなく、そのプロバイダーに要約を委譲します。

- `provider`：登録済み Compaction プロバイダー Plugin の ID。デフォルトの LLM 要約を使用する場合は未設定のままにします。`provider` を設定すると `mode: "safeguard"` が強制されます。
- プロバイダーは、組み込みパスと同じ Compaction 指示および識別子保持ポリシーを受け取り、セーフガードはプロバイダーの出力後も直近ターンと分割ターンのサフィックスコンテキストを保持します。
- 組み込みのセーフガード要約では、以前の要約全体をそのまま保持するのではなく、新しいメッセージとともに以前の要約を再抽出します。
- セーフガードモードでは、デフォルトで要約品質監査が有効になります。不正な形式の出力に対する再試行動作を省略するには、`qualityGuard.enabled: false` を設定します。
- プロバイダーが失敗するか空の結果を返した場合、OpenClaw は自動的に組み込みの LLM 要約へフォールバックします。呼び出し元が明示的に発生させた中止／タイムアウトシグナルは握りつぶさず再スローされるため、キャンセルは常に尊重されます。

ソース：`src/plugins/compaction-provider.ts`、`src/agents/agent-hooks/compaction-safeguard.ts`。

## ユーザーに表示される箇所

- 任意のチャットセッション内の `/status`
- `openclaw status`（CLI）
- `openclaw sessions` / `openclaw sessions --json`
- Gateway ログ（`pnpm gateway:watch` または `openclaw logs --follow`）：`embedded run auto-compaction start` + `complete`
- 詳細モード：`🧹 Auto-compaction complete` と Compaction 回数

## サイレントハウスキーピング（`NO_REPLY`）

OpenClaw は、ユーザーに中間出力を表示すべきでないバックグラウンドタスク向けに「サイレント」ターンをサポートしています。

- アシスタントは、「ユーザーに返信を配信しない」ことを示すため、正確なサイレントトークン `NO_REPLY` / `no_reply` で出力を開始します。OpenClaw は配信レイヤーでこれを除去／抑制します。
- 正確なサイレントトークンの抑制では大文字と小文字が区別されません。ペイロード全体がサイレントトークンのみである場合、`NO_REPLY` と `no_reply` はどちらも該当します。
- `2026.1.10` 以降、OpenClaw は部分チャンクが `NO_REPLY` で始まる場合、ドラフト／入力中のストリーミングも抑制するため、サイレント操作の部分出力がターンの途中で漏れることはありません。
- これは、真にバックグラウンドで実行され、配信を行わないターン専用です。通常の対応可能なユーザーリクエストに対する近道ではありません。

## Compaction 前のメモリフラッシュ

自動 Compaction が発生する前に、OpenClaw は永続状態をディスク（たとえばエージェントワークスペース内の `memory/YYYY-MM-DD.md`）に書き込むサイレントなエージェントターンを実行できます。これにより、Compaction によって重要なコンテキストが消去されることを防ぎます。OpenClaw はセッションのコンテキスト使用量を監視し、Compaction しきい値より低いソフトしきい値を超えると、正確なサイレントトークン `NO_REPLY` / `no_reply` を使用してサイレントな「今すぐメモリを書き込む」指示を送信するため、ユーザーには何も表示されません。

設定（`agents.defaults.compaction.memoryFlush`）の完全なリファレンスは [/gateway/config-agents](/ja-JP/gateway/config-agents#agentsdefaultscompaction) を参照してください。

| キー                         | デフォルト          | 備考                                                                                                                                  |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | 未設定            | フラッシュターンのみに適用するプロバイダー／モデルの正確なオーバーライド。例：`ollama/qwen3:8b`                                                   |
| `softThresholdTokens`       | `4000`           | フラッシュをトリガーする Compaction しきい値未満の差                                                                               |
| `forceFlushTranscriptBytes` | 未設定（無効） | トークンカウンターが古い場合でも、トランスクリプトファイルがこのバイトサイズ（または `"2mb"` のような文字列）に達した時点でフラッシュを強制します。`0` で無効になります |
| `prompt`                    | 組み込み         | フラッシュターン用のユーザーメッセージ                                                                                                        |
| `systemPrompt`              | 組み込み         | フラッシュターン用に追加される追加のシステムプロンプト                                                                                        |

注記：

- デフォルトのプロンプト／システムプロンプトには、配信を抑制するための `NO_REPLY` ヒントが含まれます。
- `model` が設定されている場合、フラッシュターンはアクティブなセッションのフォールバックチェーンを継承せず、そのモデルを使用します。そのため、ローカル専用のハウスキーピングが失敗時に有料の会話モデルへ暗黙的にフォールバックすることはありません。
- フラッシュは Compaction サイクルごとに 1 回実行されます（セッション行で追跡されます）。
- フラッシュは埋め込み OpenClaw セッションでのみ実行されます。CLI バックエンドと Heartbeat ターンではスキップされます。
- セッションワークスペースが読み取り専用（`workspaceAccess: "ro"` または `"none"`）の場合、フラッシュはスキップされます。
- ワークスペースのファイルレイアウトと書き込みパターンについては、[メモリ](/ja-JP/concepts/memory)を参照してください。

OpenClaw は拡張 API で `session_before_compact` フックを公開していますが、上記のフラッシュロジックはそのフックではなく、Gateway 側（`src/auto-reply/reply/memory-flush.ts`、`src/auto-reply/reply/agent-runner-memory.ts`）に存在します。

## トラブルシューティングのチェックリスト

- **セッションキーが間違っていますか？** [/concepts/session](/ja-JP/concepts/session) から確認を始め、`/status` 内の `sessionKey` を確認してください。
- **ストアとトランスクリプトが一致しませんか？** `openclaw status` で Gateway ホストとストアパスを確認してください。
- **Compaction が頻発しますか？** モデルのコンテキストウィンドウ（小さすぎると頻繁な Compaction が発生します）、`reserveTokens`（モデルウィンドウに対して高すぎると Compaction が早まります）、およびツール結果の肥大化（セッションのプルーニングを調整してください）を確認してください。
- **小さなローカルモデルですべてのプロンプトがオーバーフローするように見えますか？** プロバイダーが正しいモデルコンテキストウィンドウを報告していることを確認してください。OpenClaw が有効予約領域に上限を設定できるのは、そのウィンドウが既知の場合のみです。
- **サイレントターンが漏れていますか？** 返信が正確なサイレントトークン `NO_REPLY`（大文字と小文字を区別しません）で始まっていること、およびストリーミング抑制の修正を含むビルド（`2026.1.10` 以降）を使用していることを確認してください。

## 関連項目

- [セッション管理](/ja-JP/concepts/session)
- [セッションのプルーニング](/ja-JP/concepts/session-pruning)
- [コンテキストエンジン](/ja-JP/concepts/context-engine)
- [エージェント設定リファレンス](/ja-JP/gateway/config-agents)
