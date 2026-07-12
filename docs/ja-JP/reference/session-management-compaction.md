---
read_when:
    - セッション ID、トランスクリプトイベント、またはセッション行のフィールドをデバッグする必要があります
    - 自動 Compaction の動作を変更する場合、または「Compaction 前」のハウスキーピングを追加する場合
    - メモリのフラッシュまたはサイレントなシステムターンを実装する場合
summary: 詳細解説：セッションストアとトランスクリプト、ライフサイクル、（自動）Compaction の内部構造
title: セッション管理の詳細解説
x-i18n:
    generated_at: "2026-07-12T14:52:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2f06b50dcece64a92c2b35a468910b2069622d14649ab24052a5a7956f9d41d1
    source_path: reference/session-management-compaction.md
    workflow: 16
---

単一の **Gateway プロセス**がセッション状態をエンドツーエンドで管理します。UI（macOS アプリ、Web Control UI、TUI）は、セッション一覧とトークン数を Gateway に照会します。リモートモードでは、セッションファイルはリモートホスト上にあるため、ローカル Mac のファイルを確認しても Gateway が使用している内容は反映されません。

まず概要ドキュメントを参照してください：[セッション管理](/ja-JP/concepts/session)、[Compaction](/ja-JP/concepts/compaction)、[メモリの概要](/ja-JP/concepts/memory)、[メモリ検索](/ja-JP/concepts/memory-search)、[セッションのプルーニング](/ja-JP/concepts/session-pruning)、[トランスクリプトの衛生管理](/ja-JP/reference/transcript-hygiene)。完全な設定リファレンスは[エージェント設定](/ja-JP/gateway/config-agents)にあります。

## 2 つの永続化レイヤー

1. **セッション行（エージェントごとの SQLite）** - キー/値マップ `sessionKey -> SessionEntry`。Gateway が所有する可変のランタイム状態です。現在のセッション ID、最終アクティビティ、切り替え設定、トークンカウンターなどのメタデータを追跡します。
2. **トランスクリプトイベント（エージェントごとの SQLite）** - 追記専用でツリー構造（各エントリは `id` + `parentId` を持ちます）。会話、ツール呼び出し、Compaction の要約を保存し、将来のターン用にモデルコンテキストを再構築します。Compaction チェックポイントは、圧縮後の後続トランスクリプトに対するメタデータです。新しい Compaction で 2 つ目の `.checkpoint.*.jsonl` コピーが書き込まれることはありません。

古いインストール環境には、エージェントの `sessions/`
ディレクトリ内に `sessions.json` ファイルが残っている場合があります。これらのファイルは、従来のセッション行の移行入力、または明示的な
オフラインメンテナンス対象として扱ってください。Gateway の起動時および `openclaw doctor --fix` は、
使用中の従来行とトランスクリプト履歴をエージェントごとの SQLite ストアへ
自動的にインポートします。明示的な検査や検証証跡が必要な場合は、`openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` を実行し、[Doctor の移行
手順](/ja-JP/cli/doctor#session-sqlite-migration)に従ってください。従来のトランスクリプト
アーティファクトがアーカイブされた後に移行が失敗した場合は、その手順にある Doctor のリカバリモードを使用してください。
リカバリでは移行マニフェストを使用し、影響を受けたアーカイブ済みの補助
アーティファクトのみを復元し、要求された場合はサニタイズ済みの GitHub issue レポートを作成します。また、
アクティブなランタイムが JSONL ファイルを再び読み取るようにはしません。

Gateway の履歴リーダーは、任意の過去データへのアクセスが必要なサーフェスを除き、トランスクリプト全体を実体化しません。履歴の最初のページ、埋め込みチャット履歴、再起動時のリカバリ、トークン/使用量の確認には、SQLite からの範囲を限定した末尾読み取りを使用します。トランスクリプト全体のスキャンは非同期トランスクリプトインデックスを経由し、同時実行される複数のリーダー間で共有されます。

## ディスク上の保存場所

Gateway ホスト上で、エージェントごとに配置されます（`src/config/sessions.ts` で解決）：

- ランタイムセッション行ストア：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- ランタイムトランスクリプト行：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- 従来/アーカイブのトランスクリプトアーティファクト：`~/.openclaw/agents/<agentId>/sessions/`
- 従来行の移行入力：`~/.openclaw/agents/<agentId>/sessions/sessions.json`

## ストアのメンテナンスとディスク制御

`session.maintenance` は、SQLite セッション行、SQLite トランスクリプト行、アーカイブアーティファクト、軌跡サイドカーの自動メンテナンスを制御します：

| キー                    | デフォルト              | 注記                                                                                                               |
| ----------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `mode`                  | `"enforce"`             | または `"warn"`（報告のみで変更なし）                                                                              |
| `pruneAfter`            | `"30d"`                 | 古いエントリを判定する経過時間のしきい値                                                                            |
| `maxEntries`            | `500`                   | セッションエントリ数の上限                                                                                          |
| `resetArchiveRetention` | 保持（経過時間制限なし） | `*.reset.*`/`*.deleted.*` トランスクリプトアーカイブの経過時間制限。期間を指定すると削除が有効になります             |
| `maxDiskBytes`          | `2gb`                   | エージェントごとのセッション用ディスク容量。`false` で無効化                                                       |
| `highWaterBytes`        | `maxDiskBytes` の 80%   | 容量超過のクリーンアップ後に目標とする値                                                                             |

アーカイブ済みトランスクリプトはデフォルトで保持され、ランタイムが対応している場合は zstd（`*.jsonl.<reason>.<timestamp>.zst`）で圧縮されます。そのため、セッションを削除またはリセットしても、会話履歴が暗黙的に破棄されることはありません。ディスク容量の制限では、稼働中のセッションに手を付ける前に、最も古いアーカイブから削除します。

`maxDiskBytes` のアクティブな SQLite 適用では、セッションごとにセッション行の JSON とトランスクリプトイベントの JSON のバイト数を測定します。従来のオフラインメンテナンスでの適用では、選択したセッションディレクトリ内のファイルを測定します。

Gateway のモデル実行プローブセッション（`agent:*:explicit:model-run-<uuid>` に一致するキー）には、個別に固定された `24h` の保持期間が適用されます。このプルーニングは負荷条件付きです。セッションエントリのメンテナンスまたは上限による圧力が発生した場合にのみ、グローバルな古いエントリのクリーンアップ/上限処理の前に実行されます。その他の明示的なセッションには、この保持期間は適用されません。

ディスク容量クリーンアップの適用順序（`mode: "enforce"`）：

1. 最も古いアーカイブ済みトランスクリプトアーティファクト、孤立した従来アーティファクト、または孤立した軌跡アーティファクトを最初に削除します。
2. それでも目標を上回る場合は、最も古いセッションエントリと、そのトランスクリプト行または軌跡アーティファクトを削除します。
3. 使用量が `highWaterBytes` 以下になるまで繰り返します。

`mode: "warn"` は、ストアやファイルを変更せずに、削除対象となる可能性がある項目を報告します。

オンデマンドでメンテナンスを実行します：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

メンテナンスでは、グループセッションやスレッド単位のチャットセッションなど、永続的な外部会話ポインターを保持します。ただし、合成されたランタイムエントリ（cron、フック、Heartbeat、ACP、サブエージェント）は、設定された経過時間、件数、またはディスク容量を超えると削除される場合があります。分離された cron 実行では、モデル実行プローブの保持期間とは独立した `cron.sessionRetention` 制御を使用します。

通常の Gateway 書き込みはセッションアクセサーを経由し、ランタイムのライターパスを通じて、エージェントごとの SQLite 変更を直列化します。ランタイムコードでは `src/config/sessions/session-accessor.ts` のアクセサーヘルパーを優先してください。従来の `sessions.json` ヘルパーは、移行およびオフラインメンテナンス用のツールです。Gateway に接続できる場合、非 dry-run の `openclaw sessions cleanup` と `openclaw agents delete` は、ストアの変更を Gateway に委任するため、クリーンアップも同じライターキューに入ります。`--store <path>` は選択した従来ストアを対象とする明示的なオフライン修復パスであり、常にローカルで実行されます（`--dry-run` も同様です）。`maxEntries` のクリーンアップは本番規模のストア向けにバッチ処理されるため、次の高水位クリーンアップで上限まで書き直されるまでの間、ストアが設定された上限を一時的に超える場合があります。Gateway 起動時の読み取りでは、エントリのプルーニングや上限制限は行いません。これらを行うのは書き込みまたは `openclaw sessions cleanup --enforce` のみです。後者は上限を直ちに適用し、ディスク容量が設定されていない場合でも、参照されていない古い従来のトランスクリプト、チェックポイント、軌跡アーティファクトをプルーニングします。

OpenClaw は、Gateway の書き込み時に `sessions.json.bak.*` のローテーションバックアップを自動作成しなくなりました。従来の `session.maintenance.rotateBytes` キーは無視され、`openclaw doctor --fix` によって古い設定から削除されます。

トランスクリプトの変更では、SQLite トランスクリプトターゲット用のセッション書き込みキューを使用します：

| 設定                                 | デフォルト | 環境変数による上書き                             |
| ------------------------------------ | ---------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`    | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000`  | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`   | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` は、ロック待機を諦めてセッション使用中エラーを返すまでの時間です。低速なマシンで、正当な準備、クリーンアップ、Compaction、またはトランスクリプトのミラー処理による競合が長時間続く場合にのみ、この値を増やしてください。`staleMs` は、既存のロックを古いものとして回収できるまでの時間です。`maxHoldMs` は、プロセス内ウォッチドッグがロックを解放するしきい値です。

### SQLite 移行後のダウングレード

ファイルベースの古い OpenClaw バージョンを実行する前に、アーカイブ済みの従来トランスクリプトアーティファクトを復元してください：

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

移行では、サポートと
ロールバックのために従来の `sessions.json` ファイルを残しますが、SQLite に
インポートされた使用中のトランスクリプト JSONL ファイルは
`session-sqlite-import-archive/` に名前変更されます。ファイルベースの古いランタイムは
`sessions.json` 内の `sessionFile` パスを参照するため、起動
前にこれらのアーティファクトを復元する必要があります。復元では移行マニフェストを使用し、元のパスが存在しない記録済みのアーカイブ
アーティファクトのみを移動し、将来のリカバリのために SQLite データベースを
そのまま残します。

SQLite 移行後に作成されたセッションは SQLite 専用であり、ファイルベースの
古いランタイムには表示されません。ダウングレード後に再アップグレードする場合は、Doctor の
検査および検証手順を再度実行し、OpenClaw が復元された従来の
アーティファクトをインポート前に検証できるようにしてください。

## Cron セッションと実行ログ

分離された cron 実行では、専用の保持設定を持つ独自のセッションエントリ/トランスクリプトが作成されます：

- `cron.sessionRetention`（デフォルト `"24h"`）は、分離された古い cron 実行セッションをストアからプルーニングします。`false` で無効化します。
- `cron.runLog.keepLines` は、cron ジョブごとに保持される SQLite 実行履歴行をプルーニングします（デフォルト `2000`）。`cron.runLog.maxBytes` は、古いファイルベースの実行ログとの互換性のためにのみ受け付けられます。

cron が分離された新しい実行セッションを強制作成する際は、新しい行を書き込む前に、以前の `cron:<jobId>` セッションエントリをサニタイズします。安全な設定（思考/高速/詳細/推論設定、ラベル、表示名）と、ユーザーが明示的に選択したモデル/認証の上書き設定は引き継ぎますが、周辺の会話コンテキスト（チャンネル/グループのルーティング、送信/キューポリシー、権限昇格、発生元、ACP ランタイムバインディング）は破棄します。これにより、分離された新しい実行が、古い実行から陳腐化した配信設定やランタイム権限を継承することを防ぎます。

## セッションキー（`sessionKey`）

`sessionKey` は、どの会話バケットに属しているか（ルーティング + 分離）を識別します。正規ルール：[/concepts/session](/ja-JP/concepts/session)。

| パターン                         | 例                                                          |
| -------------------------------- | ----------------------------------------------------------- |
| メイン/ダイレクトチャット（エージェントごと） | `agent:<agentId>:<mainKey>`（デフォルト `main`）            |
| グループ                         | `agent:<agentId>:<channel>:group:<id>`                      |
| ルーム/チャンネル（Discord/Slack） | `agent:<agentId>:<channel>:channel:<id>` または `...:room:<id>` |
| Cron                             | `cron:<job.id>`                                             |
| Webhook                          | `hook:<uuid>`（上書きされていない場合）                     |

## セッション ID（`sessionId`）

各 `sessionKey` は、現在の `sessionId`（会話を継続する SQLite トランスクリプトの識別子）を指します。判定ロジックは `src/auto-reply/reply/session.ts` の `initSessionState()` にあります。

- **リセット**（`/new`、`/reset`）は、その`sessionKey`に対して新しい`sessionId`を作成します。
- **日次リセット**（デフォルトではGatewayホストのローカル時刻で午前4:00）は、リセット境界後の次のメッセージで新しい`sessionId`を作成します。
- **アイドル期限切れ**（`session.reset.idleMinutes`、または従来の`session.idleMinutes`）は、アイドル期間後にメッセージが到着すると新しい`sessionId`を作成します。日次とアイドルの両方が設定されている場合は、先に期限切れになった方が優先されます。
- **Control UI再接続時の再開**は、GatewayがオペレーターUIクライアントから一致する`sessionId`を受信した場合、再接続後の1回の送信について、現在表示されているセッションを維持します。これは1回限りのシグナルです。通常の古い送信では、引き続き新しい`sessionId`が作成されます。
- **システムイベント**（heartbeat、cronウェイクアップ、exec通知、gatewayの記帳処理）はセッション行を変更する場合がありますが、日次リセットやアイドルリセットの鮮度を延長することはありません。リセット切り替え時には、新しいプロンプトを構築する前に、以前のセッション用にキューされたシステムイベント通知が破棄されます。
- **親フォークポリシー**は、スレッドまたはサブエージェントのフォークを作成するときに、OpenClawのアクティブなブランチを使用します。そのブランチが大きすぎる場合（固定の内部上限、現在は100Kトークンを超える場合）、OpenClawは失敗したり使用不能な履歴を継承したりする代わりに、分離されたコンテキストで子を開始します。サイズ判定は自動であり、設定できません。従来の`session.parentForkMaxTokens`設定は`openclaw doctor --fix`によって削除されます。
- **オペレーターフォーク**：`sessions.create { parentSessionKey, fork: true }`は、親の現在の状態からトランスクリプトが分岐する新しいセッションを作成します（上記のサイズ上限を含め、サブエージェントの生成と同じフォーク機構）。親で実行がアクティブな間はフォークが拒否され、明示的に指定されない限り親のモデル選択を継承し、子を`forkedFromParent`としてマークしてトークンカウンターを新しくします。

## セッションストアのスキーマ

ランタイムストアは、エージェントごとのSQLiteに`SessionEntry`値を保持します。値の型は`src/config/sessions.ts`の`SessionEntry`です。主なフィールド（網羅的ではありません）：

- `sessionId`：SQLiteトランスクリプト行の指定に使用される現在のトランスクリプトID
- `sessionStartedAt`：現在の`sessionId`の開始タイムスタンプ。日次リセットの鮮度判定に使用されます。従来の行では、JSONLセッションヘッダーから導出される場合があります。
- `lastInteractionAt`：最後の実際のユーザー／チャネル操作のタイムスタンプ。アイドルリセットの鮮度判定に使用されるため、heartbeat、cron、execイベントによってセッションが存続し続けることはありません。このフィールドがない従来の行では、復元されたセッション開始時刻にフォールバックします。
- `updatedAt`：ストア行が最後に変更されたタイムスタンプ。一覧表示、枝刈り、記帳処理に使用されますが、日次／アイドルの鮮度を決定する基準ではありません。
- `archivedAt`：任意のアーカイブタイムスタンプ。アーカイブされたセッションはトランスクリプトを維持したままストアに残り、通常のアクティブ一覧から除外されます。
- `pinnedAt`：任意のピン留めタイムスタンプ。アクティブなピン留め済みセッションは、ピン留めされていないセッションより前に並びます。セッションをアーカイブするとピン留めが解除されます。
- Codexスレッド相互運用：両方のフィールドはCodexのスレッド管理形式に従います。通信上の`archived`／`pinned`ブール値は常にタイムスタンプから導出され、Codexの`threads.archived_at`セマンティクスおよびcamelCaseシリアル化に合わせてサーバー側で付与されます。OpenClawのタイムスタンプはエポックミリ秒ですが、Codexはエポック秒を使用するため、ブリッジは`codex` pluginの境界で変換します。Codexにはまだピン留めAPIがなく（`thread/archive`／`thread/unarchive`のみ）、APIが追加されるまではピン留め状態がOpenClaw側に保持されます。追加された時点で、対応する形式により、バインドされたセッションのピン留め状態を機械的に往復変換できます。
- Codexの監視一覧には、アーカイブされていないネイティブスレッドのみが表示されます。Gatewayローカルでアクティビティが不明な`idle`または`notLoaded`スレッドは、他のCodexプロセスがそのスレッドを所有していないことをオペレーターが明示的に確認した後にのみ、ネイティブの`thread/archive`を通じてアーカイブできます。pluginは最初にプロセスローカルの状態を新たに読み取り、その後スレッドはカタログから消えます。この読み取りでは、別のApp Serverプロセスがそのスレッドを使用していないことまでは証明できません。OpenClawはアクティブな行とエラー行のアーカイブを拒否します。また、Nodeブリッジがストリーミングされるスレッドのライフサイクル全体を管理できるようになるまで、ペアリングされたNodeでのアーカイブは利用できません。ネイティブCodexクライアントでアーカイブを解除すると、スレッドは再び表示対象になります。
- `lastReadAt`／`markedUnreadAt`：`sessions.patch { unread }`によってサーバー側で付与される既読状態のタイムスタンプ。`unread: false`は既読を記録し（`lastReadAt`を設定し、`markedUnreadAt`をクリア）、`unread: true`は次に既読になるまでセッションを未読としてマークします。セッション行は、明示的に未読としてマークされているか、最新のアクティビティより前に既読になっているかに基づいて導出された`unread`ブール値を公開します。一度も既読としてマークされていないセッションは`unread: false`のままなので、既存のインストール環境でアップグレード時に未読表示が一斉に点灯することはありません。
- `lastActivityAt`：未読に値するアクティビティとして扱われる、最後に完了したエージェント実行（ユーザー、チャネル、cron実行）のタイムスタンプ。Heartbeatと内部イベントのターン、およびメタデータのパッチでは更新されません。`updatedAt`はアクティビティシグナルではありません。
- `sessionFile`：移行／アーカイブ互換性のために保持されている従来のマーカー。アクティブなランタイムはSQLiteの識別情報を使用します
- `chatType`：`direct | group | room`
- `provider`、`subject`、`room`、`space`、`displayName`：グループ／チャネルのラベル付けメタデータ
- 切り替え設定：`thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`、`sendPolicy`（セッション単位のオーバーライド）
- モデル選択：`providerOverride`、`modelOverride`、`authProfileOverride`
- トークンカウンター（ベストエフォート／プロバイダー依存）：`inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：このセッションキーで自動Compactionが完了した回数
- `memoryFlushAt`／`memoryFlushCompactionCount`：最後のCompaction前メモリフラッシュのタイムスタンプとCompaction回数

Gatewayが信頼できる基準です。セッションの実行に伴い、エントリを
書き換えたり再ハイドレートしたりする場合があります。従来のファイルベースのインストール環境では、
`sessions.json`を編集してランタイムがそのファイルを読み続けることを期待するのではなく、
`openclaw doctor --session-sqlite import --session-sqlite-all-agents`で移行してください。

## トランスクリプトイベントの構造

トランスクリプトはOpenClawセッションアクセサーによって管理され、IDベースのヘルパーを通じてランタイムコードに公開されます。イベントストリームは追記専用です：

- 最初のエントリ：セッションヘッダー - `type: "session"`、`id`、`cwd`、`timestamp`、任意の`parentSession`。
- その後：`id` + `parentId`を持つエントリ（ツリー構造）。

主なエントリタイプ：

- `message`：ユーザー／アシスタント／toolResultメッセージ
- `custom_message`：拡張機能によって挿入され、モデルコンテキストに_入る_メッセージ（`display: true`の場合はTUIに表示され、`display: false`の場合は完全に非表示）
- `custom`：モデルコンテキストに_入らない_拡張機能の状態（再読み込みをまたいで拡張機能の状態を永続化するため）
- `compaction`：`firstKeptEntryId`と`tokensBefore`を含む、永続化されたCompactionの要約
- `branch_summary`：ツリーブランチの移動時に永続化される要約

OpenClawは意図的にトランスクリプトを「修正」しません。Gatewayは`SessionManager`を使用してトランスクリプトを読み書きします。

## コンテキストウィンドウと追跡トークンの違い

異なる2つの概念があります：

1. **モデルコンテキストウィンドウ**：モデルごとのハード上限（モデルから見えるトークン）。モデルカタログから取得され、設定でオーバーライドできます。
2. **セッションストアのカウンター**：セッション行に書き込まれるローリング統計（`/status`とダッシュボードで使用）。`contextTokens`はランタイムによる推定値／レポート値であり、厳密な保証として扱わないでください。

制限の詳細については、[/reference/token-use](/ja-JP/reference/token-use)を参照してください。

## Compaction とは

Compaction は、過去の会話を要約してトランスクリプト内の永続的な`compaction`エントリに保存し、最近のメッセージはそのまま保持します。Compaction 後、以降のターンでは Compaction の要約と`firstKeptEntryId`以降のメッセージが参照されます。Compaction は、セッションのプルーニングとは異なり**永続的**です。[/concepts/session-pruning](/ja-JP/concepts/session-pruning)を参照してください。

Compaction 後の AGENTS.md セクションの再挿入は、`agents.defaults.compaction.postCompactionSections`でオプトインできます。未設定または`[]`の場合、OpenClaw は Compaction の要約に AGENTS.md の抜粋を追加しません。

### チャンク境界とツールのペアリング

長いトランスクリプトを Compaction 用のチャンクに分割する際、OpenClaw はアシスタントのツール呼び出しと、それに対応する`toolResult`エントリのペアを維持します。

- トークン比率に基づく分割位置がツール呼び出しとその結果の間になる場合、OpenClaw はペアを分離せず、境界をアシスタントのツール呼び出しメッセージの位置へ移動します。
- 末尾のツール結果ブロックによってチャンクが目標サイズを超える場合、OpenClaw はその保留中のツールブロックを保持し、未要約の末尾部分をそのまま維持します。
- 中止またはエラーとなったツール呼び出しブロックは、保留中の分割を維持しません。

## 自動 Compaction が実行されるタイミング

組み込みの OpenClaw エージェントには、次の2つのトリガーがあります。

1. **オーバーフローからの復旧**: モデルがコンテキストオーバーフローエラー（`request_too_large`、`context length exceeded`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`、`ollama error: context length exceeded`、およびその他のプロバイダー固有の形式）を返した場合、Compaction を実行してから再試行します。プロバイダーが試行時のトークン数を報告した場合、OpenClaw はその実測値をオーバーフロー復旧用の Compaction に渡します。プロバイダーがオーバーフローを確認しても解析可能なトークン数を公開しない場合、OpenClaw は予算をわずかに超える合成トークン数を Compaction エンジンと診断機能に渡します。オーバーフローからの復旧が引き続き失敗する場合、OpenClaw は明示的なガイダンスを表示し、新しいセッション ID へ暗黙的に切り替えるのではなく、現在のセッションマッピングを保持します。メッセージを再試行するか、`/compact`または`/new`を実行してください。
2. **しきい値の維持**: ターンが正常に完了した後、`contextTokens > contextWindow - reserveTokens`となった場合に実行されます。ここで、`contextWindow`はモデルのコンテキストウィンドウ、`reserveTokens`はプロンプトと次のモデル出力のために確保される余裕です。

この2つのトリガーとは別に、さらに2つのガードが実行されます。

- **事前ローカル Compaction**: `agents.defaults.compaction.maxActiveTranscriptBytes`（バイト数、または`"20mb"`のような文字列）を設定すると、アクティブなトランスクリプトがそのサイズに達した時点で、次の実行を開始する前にローカル Compaction がトリガーされます。これはローカルでの再オープンコストを抑えるためのサイズガードであり、未加工のアーカイブ処理ではありません。通常の意味的 Compaction も引き続き実行され、Compaction 済みの要約を新しい後続トランスクリプトにするために`truncateAfterCompaction`が必要です。
- **ターン途中の事前チェック**: `agents.defaults.compaction.midTurnPrecheck.enabled: true`（デフォルトは`false`）を設定すると、ツールループ用のガードが追加されます。ツール結果が追加された後、次のモデル呼び出しの前に、OpenClaw はターン開始時と同じ事前予算ロジックを使用してプロンプトの負荷を見積もります。コンテキストが収まらなくなった場合、ガードはその場で Compaction を実行しません。代わりに、構造化されたターン途中の事前チェックシグナルを発生させ、現在のプロンプト送信を停止し、外側の実行ループに既存の復旧パスを使用させます（サイズ超過のツール結果を切り詰めれば十分な場合は切り詰め、そうでなければ設定済みの Compaction モードをトリガーして再試行します）。プロバイダー側で実行される safeguard Compaction を含め、`default`と`safeguard`の両方の Compaction モードで機能します。`maxActiveTranscriptBytes`とは独立しています。バイトサイズガードはターンを開始する前に実行され、ターン途中の事前チェックはその後、新しいツール結果が追加された時点で実行されます。

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

OpenClaw は埋め込み実行に対して安全性の下限も適用します。`compaction.reserveTokens` が `reserveTokensFloor`（デフォルトは `20000`）を下回る場合、OpenClaw はその値を引き上げます。この下限を無効にするには、`agents.defaults.compaction.reserveTokensFloor: 0` を設定します。アクティブなモデルのコンテキストウィンドウが判明している場合、予約分がプロンプト予算全体を消費しないように、下限と最終的な有効予約量の両方に上限が設定されます。これにより、コンテキストが小さいモデル（たとえば 16K トークンのローカルモデル）が最初のトークンから Compaction に入るのを防ぎます。コンテキストウィンドウが不明な場合、設定済みおよび現在の予約予算には上限が設定されません。そもそも下限を設ける理由は、Compaction が避けられなくなる前に、複数ターンにわたる「保守処理」（後述のメモリフラッシュなど）に十分な余裕を残すためです。実装は `src/agents/agent-settings.ts` の `applyAgentCompactionSettingsFromConfig()` で、埋め込みランナーのターンおよび Compaction のセットアップパスから呼び出されます。

手動の `/compact` は、明示的な `agents.defaults.compaction.keepRecentTokens` を尊重し、ランタイムの直近末尾の切り分け位置を維持します。保持予算が明示されていない場合、手動 Compaction は厳密なチェックポイントとなり、再構築されたコンテキストは新しい要約から開始されます。

`truncateAfterCompaction` が有効な場合、OpenClaw は Compaction 後にアクティブなトランスクリプトを、圧縮済みの後継トランスクリプトへ切り替えます。ブランチ／復元のチェックポイント操作ではこの圧縮済み後継トランスクリプトが使用され、Compaction 前の従来のチェックポイントファイルも、参照されている間は引き続き読み取れます。

## 差し替え可能な Compaction プロバイダー

Plugin は、Plugin API の `registerCompactionProvider()` を介して Compaction プロバイダーを登録します。`agents.defaults.compaction.provider` に登録済みプロバイダー ID が設定されている場合、セーフガード拡張機能は組み込みの `summarizeInStages` パイプラインではなく、そのプロバイダーに要約処理を委譲します。

- `provider`: 登録済み Compaction プロバイダー Plugin の ID。デフォルトの LLM 要約を使用する場合は未設定のままにします。`provider` を設定すると、`mode: "safeguard"` が強制されます。
- プロバイダーは組み込みパスと同じ Compaction 指示および識別子保持ポリシーを受け取り、プロバイダーの出力後も、セーフガードは直近ターンおよび分割ターンの接尾コンテキストを保持します。
- 組み込みのセーフガード要約は、以前の要約全文をそのまま保持するのではなく、新しいメッセージと合わせて以前の要約を再要約します。
- セーフガードモードでは、デフォルトで要約品質監査が有効になります。不正な形式の出力に対する再試行動作を省略するには、`qualityGuard.enabled: false` を設定します。
- プロバイダーが失敗するか空の結果を返した場合、OpenClaw は自動的に組み込みの LLM 要約へフォールバックします。呼び出し元が明示的に発生させた中止／タイムアウトシグナルは握りつぶさず再スローされるため、キャンセルは常に尊重されます。

ソース: `src/plugins/compaction-provider.ts`、`src/agents/agent-hooks/compaction-safeguard.ts`。

## ユーザーに表示される箇所

- 任意のチャットセッション内の `/status`
- `openclaw status`（CLI）
- `openclaw sessions` / `openclaw sessions --json`
- Gateway ログ（`pnpm gateway:watch` または `openclaw logs --follow`）: `embedded run auto-compaction start` + `complete`
- 詳細モード: `🧹 Auto-compaction complete` と Compaction 回数

## サイレント保守処理（`NO_REPLY`）

OpenClaw は、ユーザーに途中出力を表示すべきでないバックグラウンドタスク向けに「サイレント」ターンをサポートします。

- アシスタントは出力の先頭に正確なサイレントトークン `NO_REPLY` / `no_reply` を付け、「ユーザーに返信を配信しない」ことを示します。OpenClaw は配信レイヤーでこれを削除／抑制します。
- サイレントトークンだけで構成されたペイロードの場合、正確なサイレントトークンの抑制では大文字と小文字が区別されません。`NO_REPLY` と `no_reply` はどちらも該当します。
- `2026.1.10` 以降、部分チャンクが `NO_REPLY` で始まる場合、OpenClaw はドラフト／入力中のストリーミングも抑制するため、サイレント操作の途中で部分出力が漏れることはありません。
- これは実際にバックグラウンドで実行し、何も配信しないターン専用です。通常の対応可能なユーザーリクエストを省略するための近道ではありません。

## Compaction 前のメモリフラッシュ

自動 Compaction が発生する前に、OpenClaw は永続的な状態をディスクへ書き込むサイレントなエージェントターンを実行できます（たとえば、エージェントワークスペース内の `memory/YYYY-MM-DD.md`）。これにより、Compaction で重要なコンテキストが消去されるのを防ぎます。セッションのコンテキスト使用量を監視し、Compaction しきい値より低いソフトしきい値を超えると、正確なサイレントトークン `NO_REPLY` / `no_reply` を使用して、サイレントな「今すぐメモリを書き込む」指示を送信するため、ユーザーには何も表示されません。

設定（`agents.defaults.compaction.memoryFlush`）。完全なリファレンスは [/gateway/config-agents](/ja-JP/gateway/config-agents#agentsdefaultscompaction) を参照してください。

| キー                        | デフォルト       | 注記                                                                                                                                   |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | 未設定           | フラッシュターンだけに適用する正確なプロバイダー／モデルのオーバーライド。例: `ollama/qwen3:8b`                                       |
| `softThresholdTokens`       | `4000`           | フラッシュを発生させる、Compaction しきい値までの差                                                                                    |
| `forceFlushTranscriptBytes` | 未設定（無効）   | トークンカウンターが古い場合でも、トランスクリプトファイルがこのバイトサイズ（または `"2mb"` のような文字列）に達したらフラッシュを強制。`0` で無効化 |
| `prompt`                    | 組み込み         | フラッシュターンのユーザーメッセージ                                                                                                   |
| `systemPrompt`              | 組み込み         | フラッシュターンに追加される追加システムプロンプト                                                                                     |

注記:

- デフォルトのプロンプト／システムプロンプトには、配信を抑制するための `NO_REPLY` ヒントが含まれます。
- `model` が設定されている場合、フラッシュターンはアクティブなセッションのフォールバックチェーンを継承せず、そのモデルを使用します。そのため、ローカル専用の保守処理が失敗時に有料の会話モデルへ暗黙的にフォールバックすることはありません。
- フラッシュは Compaction サイクルごとに 1 回実行されます（セッション行で追跡）。
- フラッシュは埋め込み OpenClaw セッションでのみ実行されます。CLI バックエンドと Heartbeat ターンでは省略されます。
- セッションワークスペースが読み取り専用（`workspaceAccess: "ro"` または `"none"`）の場合、フラッシュは省略されます。
- ワークスペースのファイル配置と書き込みパターンについては、[メモリ](/ja-JP/concepts/memory)を参照してください。

OpenClaw は拡張 API で `session_before_compact` フックを公開していますが、前述のフラッシュロジックはそのフックではなく、Gateway 側（`src/auto-reply/reply/memory-flush.ts`、`src/auto-reply/reply/agent-runner-memory.ts`）にあります。

## トラブルシューティングのチェックリスト

- **セッションキーが間違っていますか？** [/concepts/session](/ja-JP/concepts/session) から確認を始め、`/status` の `sessionKey` を確認してください。
- **ストアとトランスクリプトが一致していませんか？** `openclaw status` で Gateway ホストとストアパスを確認してください。
- **Compaction が頻発しますか？** モデルのコンテキストウィンドウ（小さすぎると Compaction が頻発します）、`reserveTokens`（モデルのウィンドウに対して大きすぎると Compaction が早まります）、ツール結果の肥大化（セッションプルーニングを調整）を確認してください。
- **小さなローカルモデルで、すべてのプロンプトがオーバーフローするように見えますか？** プロバイダーが正しいモデルコンテキストウィンドウを報告していることを確認してください。OpenClaw が有効予約量に上限を設定できるのは、そのウィンドウが判明している場合だけです。
- **サイレントターンが漏れていますか？** 返信が正確なサイレントトークン `NO_REPLY`（大文字と小文字は区別されません）で始まっていること、およびストリーミング抑制の修正を含むビルド（`2026.1.10` 以降）を使用していることを確認してください。

## 関連項目

- [セッション管理](/ja-JP/concepts/session)
- [セッションプルーニング](/ja-JP/concepts/session-pruning)
- [コンテキストエンジン](/ja-JP/concepts/context-engine)
- [エージェント設定リファレンス](/ja-JP/gateway/config-agents)
