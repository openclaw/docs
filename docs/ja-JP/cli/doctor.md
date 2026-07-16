---
read_when:
    - 接続や認証に問題があり、ガイド付きの修正を希望する場合
    - 更新後に簡単な確認を行いたい場合
summary: '`openclaw doctor` の CLI リファレンス（ヘルスチェックとガイド付き修復）'
title: 診断ツール
x-i18n:
    generated_at: "2026-07-16T11:29:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 322af63f52a3d864e46da332353ca921a4462e13fa849986d936524759f80ccc
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway、チャンネル、Plugin、Skills、モデルルーティング、ローカル状態、設定移行のヘルスチェックとクイック修復を行います。何かが期待どおりに動作せず、問題の原因を1つのコマンドで確認したい場合に使用します。

関連項目:

- トラブルシューティング: [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- セキュリティ監査: [セキュリティ](/ja-JP/gateway/security)

## 動作モード

Doctorには5つの動作モードがあります:

| 動作モード                   | コマンド                                   | 動作                                                                        |
| ------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------- |
| 検査                   | `openclaw doctor`                         | 人間向けのチェックと対話形式のプロンプト。                                       |
| 修復                    | `openclaw doctor --fix`                   | サポート対象の修復を適用します。非対話形式の修復が安全でない限り、プロンプトを使用します。 |
| Lint                      | `openclaw doctor --lint`                  | CI、事前確認、レビューゲート向けの読み取り専用の構造化された検出結果。              |
| 共有SQLiteのメンテナンス | `openclaw doctor --state-sqlite compact`  | 正規の共有状態DBに対し、チェックポイント、圧縮、検証を明示的に実行します。   |
| セッションSQLiteの移行  | `openclaw doctor --session-sqlite <mode>` | セッション状態を検査、インポート、検証、圧縮、復旧、または復元します。    |

自動化で安定した結果が必要な場合は`--lint`を推奨します。人間のオペレーターがDoctorに設定または状態を編集させたい場合は`--fix`を推奨します。

## 例

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
openclaw doctor --state-sqlite compact
openclaw doctor --state-sqlite compact --json
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-agent main --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

チャンネル固有の権限には、`doctor`の代わりにチャンネルプローブを使用します:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities`は、特定のチャンネルターゲットに対してボットが実際に持つ権限を報告します。`channels status --probe`は、設定済みのすべてのチャンネルと音声自動参加ターゲットを監査します。

## オプション

| オプション                          | 効果                                                                                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions`    | ワークスペースのメモリ/検索候補を無効にします。                                                                                                                                            |
| `--yes`                         | 確認せずにデフォルトを受け入れます。                                                                                                                                                      |
| `--repair` / `--fix`            | 推奨されるサービス以外の修復を確認なしで適用します（`--fix`は別名です）。Gatewayサービスのインストール/書き換えには、引き続き対話形式の確認または明示的な`gateway`コマンドが必要です。 |
| `--force`                       | カスタムサービス設定の上書きを含む、積極的な修復を適用します。                                                                                                                  |
| `--non-interactive`             | プロンプトなしで実行します。安全な移行とサービス以外の修復のみを行います。                                                                                                                      |
| `--generate-gateway-token`      | Gatewayトークンを生成して設定します。                                                                                                                                                 |
| `--allow-exec`                  | シークレットの検証中に、設定済みの`exec` SecretRefsをDoctorが実行できるようにします。                                                                                                           |
| `--deep`                        | 追加のGatewayインストールについてシステムサービスをスキャンし、最近のGatewayスーパーバイザーの再起動引き継ぎを報告します。                                                                                     |
| `--lint`                        | 最新化されたヘルスチェックを読み取り専用モードで実行し、診断結果を出力します。                                                                                                            |
| `--post-upgrade`                | アップグレード後のPlugin互換性プローブを実行します。検出結果は標準出力に送られ、エラーレベルの検出結果が1件でも存在する場合は終了コード1になります。                                                                 |
| `--state-sqlite <mode>`         | 明示的な共有状態SQLiteメンテナンスを実行します。唯一のモードは`compact`です。                                                                                                               |
| `--session-sqlite <mode>`       | 対象を絞ったセッションSQLite移行モードを実行します: `inspect`、`dry-run`、`import`、`validate`、`compact`、`recover`、または`restore`。                                                         |
| `--session-sqlite-store <path>` | `--session-sqlite`とともに使用: 従来の`sessions.json`ストアパスを1つ選択します。                                                                                                                  |
| `--session-sqlite-agent <id>`   | `--session-sqlite`とともに使用: 設定済みのエージェントを1つ選択します。                                                                                                                                   |
| `--session-sqlite-all-agents`   | `--session-sqlite`とともに使用: 設定済みおよび検出済みのエージェントストアを選択します。                                                                                                                 |
| `--github-issue`                | `--session-sqlite recover`とともに使用: サニタイズ済みのopenclaw/openclaw Issueレポートを準備します。Doctorは、`--yes`または対話形式の確認後、`gh`を使用してレポートを作成します。                             |
| `--json`                        | `--lint`とともに使用: JSON形式の検出結果。`--post-upgrade`とともに使用: `{ probesRun, findings }`。`--state-sqlite`または`--session-sqlite`とともに使用: メンテナンスレポートをJSON形式で出力します。                            |
| `--severity-min <level>`        | `--lint`とともに使用: `info`、`warning`、または`error`未満の検出結果を除外します。                                                                                                                       |
| `--all`                         | `--lint`とともに使用: デフォルトセットから除外されているオプトインチェックを含め、登録済みのすべてのチェックを実行します。                                                                                        |
| `--skip <id>`                   | `--lint`とともに使用: チェックIDをスキップします。複数回指定できます。                                                                                                                                             |
| `--only <id>`                   | `--lint`とともに使用: 指定したチェックIDのみを実行します。複数回指定できます。                                                                                                                              |

`--severity-min`、`--all`、`--only`、`--skip`は、`--lint`と同時に指定した場合にのみ受け付けられます。`--json`は、`--lint`、`--post-upgrade`、`--state-sqlite`、`--session-sqlite`とともに使用できます。

## Lintモード

`openclaw doctor --lint`は読み取り専用です。プロンプト、修復、設定/状態の書き換えは行いません。

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

人間向けの出力は簡潔です:

```text
doctor --lint: 6件のチェックを実行、1件の検出結果
  [warning] core/doctor/gateway-config gateway.mode - gateway.modeが未設定です。gatewayの起動はブロックされます。
    修正: `openclaw configure`を実行してGatewayモード（local/remote）を設定するか、`openclaw config set gateway.mode local`を実行してください。
```

JSON出力はスクリプト用のインターフェースです:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.modeが未設定です。gatewayの起動はブロックされます。",
      "path": "gateway.mode",
      "fixHint": "`openclaw configure`を実行してGatewayモード（local/remote）を設定するか、`openclaw config set gateway.mode local`を実行してください。"
    }
  ]
}
```

終了コード:

| コード | 意味                                                       |
| ---- | ------------------------------------------------------------- |
| `0`  | 選択した重大度しきい値以上の検出結果はありません。      |
| `1`  | 選択したしきい値を満たす検出結果が1件以上あります。            |
| `2`  | Lintの検出結果を生成する前にコマンド/ランタイムが失敗しました。 |

`--severity-min`は、出力する検出結果と終了しきい値の両方を制御します。重大度の低い`info`/`warning`の検出結果が存在する場合でも、`openclaw doctor --lint --severity-min error`では何も出力せず、`0`で終了することがあります。

`--all`は、重大度によるフィルタリングの前に選択するチェックを制御します。デフォルトのLint実行では、詳細、履歴、または修復可能な従来の残存物が見つかる可能性が高いチェックが除外されます。完全な一覧には`--all`を使用します。`--only <id>`は最も精密なセレクターであり、登録済みの任意のチェックをIDで実行できます。

`core/doctor/local-audio-acceleration`は、音声モデルを読み込まずに、自動選択されたローカルSTTコマンド、利用可能/要求済み/観測済みのバックエンドに関する個別の証拠、およびフォールバック順序を報告します。これは情報レベルの検出結果を生成するため、表示するには`--severity-min info`を含めてください。

## 構造化ヘルスチェック

最新のDoctorチェックでは、次のような小さく分割された契約を使用します:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()`は`doctor --lint`を支えます。`repair()`は任意であり、`doctor --fix` / `doctor --repair`の下でのみ実行されます。この形式に移行していないチェックでは、引き続き従来のDoctorコントリビューションフローを使用します。

修復コンテキストには`dryRun`/`diff`リクエストを含めることができます。修復結果は、構造化された`diffs`（設定/ファイル編集）と`effects`（サービス、プロセス、パッケージ、状態、またはその他の副作用）を返すことができます。これにより、変換済みのチェックは、変更計画を`detect()`に移すことなく`doctor --fix --dry-run`へ発展できます。

`repair()` は `status: "repaired" | "skipped" | "failed"` を報告します（ステータスが省略されている場合は `repaired` を意味します）。修復が `skipped` または `failed` を返した場合、doctor は理由を報告し、そのチェックの検証をスキップします。修復が成功すると、doctor は修復された検出事項を対象として `detect()` を再実行します。検出事項がまだ存在する場合、doctor は変更を完了として扱う代わりに修復警告を報告します。

検出事項には以下が含まれます。

| フィールド             | 目的                                                |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | スキップ／限定フィルターおよび CI 許可リスト用の安定した ID。     |
| `severity`        | `info`、`warning`、または `error`。                         |
| `message`         | 人が読める問題の説明。                      |
| `path`            | 利用可能な場合は、設定、ファイル、または論理パス。          |
| `line` / `column` | 利用可能な場合はソース内の位置。                        |
| `ocPath`          | チェックが特定できる場合の正確な `oc://` アドレス。 |
| `fixHint`         | 推奨されるオペレーターの対応または修復の概要。           |

最新化されたコア doctor チェックは、人向けの `doctor` / `doctor --fix` 動作を所有する順序付き doctor コントリビューションに引き続き関連付けられます。共有の構造化ヘルスレジストリが拡張ポイントです。バンドル済みおよび Plugin ベースのチェックは、所有するパッケージがアクティブなコマンドパスに登録すると、コア doctor チェックの後に実行されます。`openclaw/plugin-sdk/health` は Plugin 作成者向けに同じ契約を公開します。

## チェックの選択

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` と `--skip` は完全なチェック ID を受け入れ、繰り返し指定できます。`--only` ID が登録されていない場合、その ID に対するチェックは実行されません。出力の `checksRun`/`checksSkipped` を使用して、対象を絞ったゲートが想定どおりのチェックを選択していることを確認してください。

## アップグレード後モード

`openclaw doctor --post-upgrade` は、ビルドまたはアップグレード後に連続実行するための Plugin 互換性プローブを実行します。検出事項は標準出力に送られ、いずれかの検出事項に `level: "error"` がある場合、終了コードは 1 になります。CI、コミュニティの `fork-upgrade` skill、およびその他のアップグレード後スモークツールに適した、機械可読なエンベロープ（`{ probesRun, findings }`）を出力するには `--json` を追加します。インストール済み Plugin インデックスが存在しないか不正な場合でも、JSON モードは `plugin.index_unavailable` エラー検出事項を含むエンベロープを出力します。

コンテナイメージの起動は、通常の「更新後に doctor を実行する」フローの例外です。`openclaw gateway run` が新しい OpenClaw バージョンで起動すると、準備完了を報告する前に、安全な状態修復と Plugin 修復を実行します。修復を安全に完了できない場合、起動は終了し、コンテナを通常どおり再起動する前に、同じマウント済み状態／設定に対して同じイメージを `openclaw doctor --fix` 付きで一度実行するよう案内します。

## 共有状態 SQLite の Compaction

`openclaw doctor --state-sqlite compact` は、`<state-dir>/state/openclaw.sqlite` にある正規の共有状態データベースに対する明示的なオフラインメンテナンスです。任意のデータベースパスは受け付けず、通常の Gateway 動作から呼び出されることはなく、`openclaw doctor --fix` の一部でもありません。このコマンドは Gateway 起動と同じ状態所有権ロックを取得し、検証、チェックポイント処理、`VACUUM`、および最終整合性チェックが完了するまで保持します。Gateway または別の SQLite メンテナンスコマンドがそのロックを所有している間は実行を拒否します。`OPENCLAW_ALLOW_MULTI_GATEWAY=1` が設定ごとの Gateway シングルトンをスキップする場合でも状態ロックは有効なため、メンテナンスで Gateway を検出するために、オペレーターシェルが Gateway サービスの環境を継承する必要はありません。

まず Gateway を停止し、検証済みバックアップを作成してください。

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --state-sqlite compact --json
openclaw gateway start
```

このコマンドは以下を行います。

1. 正規の共有状態パスに通常ファイルがあることを必須とします。データベースがない場合は `skipped` として報告され、正常終了します。
2. チェックポイント処理またはファイル変更の前に、現在サポートされているスキーマバージョンと `schema_meta.role = "global"` を検証します。
3. ビジーでない `wal_checkpoint(TRUNCATE)` を必須とします。チェックポイントがビジーの場合は、残っている OpenClaw プロセスをすべて停止して再試行してください。
4. `auto_vacuum` を `INCREMENTAL` に設定し、完全な `VACUUM` を実行して、再度チェックポイント処理を行います。
5. `quick_check`、`integrity_check`、および `foreign_key_check` を実行し、その後データベースと SQLite サイドカーファイルに所有者専用の権限を再適用します。

JSON 出力は、Compaction 前後のデータベースと WAL のサイズ、フリーリストページ数、ページサイズ、および `auto_vacuum` の値に加え、回収されたバイト数と `quick_check` および `integrity_check` の結果を報告します。`foreign_key_check` はフェイルクローズで強制され、個別の成功フィールドはありません。SQLite は `auto_vacuum` を、なしの場合は `0`、完全の場合は `1`、増分の場合は `2` として報告します。

スキーマが古い、実行中の OpenClaw ビルドより新しい、またはエージェントデータベースに属している場合、Compaction は変更を加えずに失敗します。古い共有状態スキーマの場合は、先に `openclaw doctor --fix` を実行してください。新しいスキーマの場合は、互換性のあるバックアップを復元するか OpenClaw をアップグレードしてください。

## セッション SQLite の移行

OpenClaw は、gateway 起動時および `openclaw doctor --fix` の実行時に、従来のセッション行とトランスクリプト履歴を各エージェントの SQLite データベースへ自動的にインポートします。`openclaw doctor --session-sqlite <mode>` は、その移行を対象とした検査および検証ツールです。現在のランタイムセッション行は `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` にあります。従来の `sessions.json` ファイルは移行元です。使用中のトランスクリプト JSONL ファイルはインポートされ、インポート成功後にアクティブなセッションディレクトリ外へアーカイブされます。アーカイブ階層の JSONL ファイルはサポート用アーティファクトとして残り、ランタイムのフォールバックにはなりません。

モード：

| モード       | 動作                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | インポートせずに、従来形式と SQLite の件数、および参照されていない JSONL ファイルを読み取ります。                                       |
| `dry-run`  | 従来のエントリとトランスクリプト JSONL ファイルを解析し、インポート可能な行を数え、SQLite 行を書き込まずに問題を報告します。 |
| `import`   | 選択した対象について、従来のエントリとトランスクリプトイベントを SQLite にインポートします。                                      |
| `validate` | 選択した従来の移行元を、SQLite 行およびトランスクリプトイベント数と比較します。                                   |
| `compact`  | 大量削除またはアーカイブ整理後に空きページを回収するため、選択したエージェント SQLite データベースをチェックポイント処理して VACUUM します。    |
| `recover`  | 最新の失敗した移行実行を復元し、その対象を検証して、サニタイズ済みの GitHub Issue レポートを準備します。            |
| `restore`  | SQLite データを削除せずに、記録された移行マニフェストからアーカイブ済みトランスクリプトアーティファクトを復元します。                  |

セレクター：

- デフォルト：従来のストアファイルが存在する場合、設定されたデフォルトエージェントストア。
- `--session-sqlite-agent <id>`：設定済みの 1 つのエージェント。
- `--session-sqlite-all-agents`：設定済みのエージェントストアと検出されたエージェントストア。
- `--session-sqlite-store <path>`：明示的に指定された 1 つの従来の `sessions.json` パス。

手動検査の手順：

```bash
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-all-agents --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
```

重要な履歴を持つインストール環境で `import` を実行する前に、OpenClaw の状態ディレクトリをバックアップしてください。選択された従来のエントリが SQLite にない場合、セッション ID が異なる場合、またはトランスクリプトイベント数が異なる場合、`validate` は 0 以外で終了します。`--session-sqlite-store <path>` を使用する場合は、レポートに想定した対象数が含まれていることを確認してください。存在しない明示的なストアパスを指定すると、対象は選択されません。

SQLite の削除では、まずデータベース内部のページが回収されます。データベースファイルが即座に縮小するとは限りません。大量のトランスクリプトを削除またはアーカイブした後、`openclaw doctor --session-sqlite compact --session-sqlite-all-agents` を実行して WAL ファイルをチェックポイント処理し、`VACUUM` を実行して、処理前後のデータベースと WAL のサイズを報告してください。Compaction には、現在のエージェントスキーマを持つ通常ファイル、選択したエージェントの永続的な所有者メタデータ、および doctor プロセス内に開かれたハンドルがないことが必要です。破壊的な `import`、`compact`、`recover`、および `restore` モードは、操作全体を通して Gateway 起動と同じ状態所有権ロックを保持します。`inspect`、`dry-run`、および `validate` は読み取り専用のままで、ロックを取得しません。先に Gateway を停止してください。破壊的モードは、ライブ書き込みや別のメンテナンスコマンドと競合する代わりに失敗します。破壊的な `--session-sqlite-store` の対象は、アクティブな状態ディレクトリ内にある必要があります。別のインストール環境をメンテナンスする前に、`OPENCLAW_STATE_DIR` をそのストアを所有する状態ディレクトリに設定してください。既存のハードリンクされた対象は、ロックされた状態ディレクトリ外の別のパスが同じデータベース inode を共有できるため拒否されます。同じ所有権チェックが、SQLite の WAL、共有メモリ、およびロールバックジャーナルのサイドカーにも適用されます。

各インポートでは、トランスクリプトアーティファクトをアーカイブへ移動する前に、`~/.openclaw/session-sqlite-migration-runs/` の下にマニフェストが書き込まれます。アーティファクトの移動後に、起動時のセッション SQLite 移行失敗が報告された場合は、リカバリーを実行してください。

```bash
openclaw doctor --session-sqlite recover --github-issue
```

リカバリーは、最新の失敗した移行マニフェストを選択し、そのマニフェストのアーカイブ済みアーティファクトのみを復元し、影響を受けた対象を検証し、サニタイズ済みの `.failure.md` および `.failure.json` レポートを更新して、トランスクリプト内容、生の環境、シークレット、無制限の設定を含まない GitHub Issue 本文を準備します。失敗した移行マニフェストが存在しないものの、選択されたエージェント SQLite データベースが破損している、データベースではない、またはメインデータベースなしでジャーナルサイドカーが存在する場合、リカバリーは完全なファイルセットを一時検査ディレクトリへコピーします。SQLite は、その使い捨てコピー内で有効なホットジャーナルをロールバックしてから `quick_check`、`integrity_check`、および `foreign_key_check` を実行できます。その間、元のフォレンジックファイルは変更されません。整合性チェックの失敗または孤立したサイドカーがある場合は、検出されたセット全体の名前を 1 つの `.corrupt-<timestamp>` サフィックス付きに変更することで、DB、WAL、SHM、およびロールバックジャーナルファイルを保持します。名前変更の失敗を捕捉した場合は、失敗を報告する前に、すでに移動したファイルをロールバックします。これにより、復元可能なファイルセットが暗黙に分割されることはありません。リカバリーの前に Gateway を停止してください。変化中の SQLite ファイルセットをコピーまたは名前変更することは安全ではなく、オペレーティングシステムによって動作が異なります。`--github-issue --yes` を使用すると、doctor は GitHub CLI を使用して `openclaw/openclaw` に Issue を作成します。確認を行わない場合は、ローカルのサポートレポートを書き込み、入力済みの Issue URL を表示します。

`restore` は、引き続き低レベルの取り消し操作です。これはマニフェストの `sourcePath -> archivePath` レコードを使用し、元のパスが存在しない場合にのみアーカイブ済みアーティファクトを元に戻し、両方のパスが存在する場合は競合を報告し、SQLite データベースはそのまま残します。

### セッション SQLite 移行後のダウングレード

古いファイルベースの OpenClaw バージョンを起動する前に、アーカイブ済みの従来のトランスクリプトアーティファクトを復元してください。

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

古いバージョンは、`sessions.json` エントリと、それらのエントリに記録された `sessionFile` パスを読み取ります。SQLite への移行後、インポートが成功すると、使用中の JSONL トランスクリプトは `session-sqlite-import-archive/` に移動されるため、復元によってマニフェストに記録されたそれらのアーティファクトが元のパスへ戻されるまで、古いランタイムからその履歴を参照できません。

復元では SQLite データは削除されません。SQLite への切り替え後に作成されたセッションは SQLite にのみ存在し、古いランタイムには表示されません。後で再度アップグレードする場合は、上記の通常の移行検証手順を実行し、インポート前に OpenClaw が復元されたレガシーアーティファクトと SQLite の行を比較できるようにしてください。

## 注記

- Nix モード（`OPENCLAW_NIX_MODE=1`）では、読み取り専用の doctor チェックは引き続き機能しますが、`openclaw.json` は変更不可であるため、`doctor --fix`、`doctor --repair`、`doctor --yes`、および `doctor --generate-gateway-token` は無効になります。代わりに、このインストールの Nix ソースを編集してください。nix-openclaw については、エージェント優先の[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を参照してください。
- 対話型プロンプト（キーチェーン/OAuth の修正など）は、stdin が TTY であり、かつ `--non-interactive` が設定されて**いない**場合にのみ実行されます。ヘッドレス実行（cron、Telegram、端末なし）ではプロンプトをスキップします。
- 非対話型の `doctor` 実行では、ヘッドレスのヘルスチェックを高速に保つため、先行 Plugin 読み込みをスキップします。対話型セッションでは、レガシーなヘルスチェック/修復フローに必要な Plugin サーフェスを引き続き読み込みます。
- `--lint` は `--non-interactive` より厳格です。常に読み取り専用で、プロンプトを表示せず、安全な移行も適用しません。doctor に変更を行わせる場合は、`doctor --fix` または `doctor --repair` を使用してください。
- doctor は、デフォルトではシークレットのチェック中に `exec` SecretRef を実行しません。設定済みのシークレットリゾルバーを doctor に意図的に実行させる場合にのみ、`--allow-exec` を使用してください（`--lint` の有無は問いません）。
- 設定への書き込み（`--fix` の修復を含む）を行うと、バックアップが `~/.openclaw/openclaw.json.bak` にローテーションされます（番号付きの `.bak.1`..`.bak.4` リングを使用）。`--fix` は、スキーマ検証で報告された不明な設定キーも削除し、削除した各キーを一覧表示します。更新中はこの処理をスキップし、部分的に書き込まれたアップグレード状態が移行完了前に除去されないようにします。
- 別のスーパーバイザーが Gateway のライフサイクルを管理している場合は、`OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。doctor は引き続き Gateway/サービスの健全性を報告し、サービス以外の修復を適用しますが、サービスのインストール/起動/再起動/ブートストラップと、レガシーサービスのクリーンアップはスキップします。
- Linux では、doctor は非アクティブな追加の Gateway 類似 systemd ユニットを無視し、修復中に実行中の systemd Gateway サービスのコマンド/エントリポイントメタデータを書き換えません。先にサービスを停止するか、`openclaw gateway install --force` を使用してアクティブなランチャーを置き換えてください。
- `doctor --fix --non-interactive` は、欠落または古くなった Gateway サービス定義を報告しますが、更新修復モード以外ではインストールも書き換えも行いません。サービスがない場合は `openclaw gateway install` を、ランチャーを置き換える場合は `openclaw gateway install --force` を実行してください。
- 状態整合性チェックでは、sessions ディレクトリ内の孤立したトランスクリプトファイルを検出します。それらを `.deleted.<timestamp>` としてアーカイブするには対話型の確認が必要です。`--fix`、`--yes`、およびヘッドレス実行では、そのまま残します。
- doctor は、レガシーな cron ジョブ形式について `~/.openclaw/cron/jobs.json`（または `cron.store`）をスキャンし、正規化された行を SQLite にインポートする前にそれらを書き換えます。
- doctor は、明示的な `payload.model` オーバーライドを持つ cron ジョブについて、プロバイダー名前空間ごとの件数と `agents.defaults.model` との不一致を含めて報告します。これにより、デフォルトモデルを継承しないスケジュール済みジョブを、認証や請求の調査中に確認できます。
- doctor は、実行中（`state.runningAtMs`）としてマークされたままの cron ジョブを報告します。この状態では、`openclaw cron list` に `running` と表示される場合があります。このチェックは読み取り専用です。マークされたジョブを現在実行している Gateway がない場合、次回の cron サービス起動時に中断された実行を記録し、マーカーを解除します。
- Linux では、ユーザーの crontab が、メンテナンスされていないレガシーな `~/.openclaw/bin/ensure-whatsapp.sh` を引き続き実行している場合、doctor が警告します。cron に systemd ユーザーバス環境がない場合、これは `Gateway inactive` を誤って報告する可能性があります。
- WhatsApp が有効な場合、doctor はローカルの `openclaw-tui` クライアントがまだ実行中で、Gateway のイベントループが劣化していないか確認します。`doctor --fix` は検証済みのローカル TUI クライアントのみを停止し、WhatsApp の返信が古い TUI 更新ループの後ろで待機しないようにします。
- doctor は、プライマリモデル、フォールバック、モデル許可リスト、画像/動画生成モデル、Heartbeat/サブエージェント/Compaction のオーバーライド、フック、チャンネルモデルのオーバーライド、cron ペイロード、および古いセッション/トランスクリプトのルート固定にわたって、レガシーな `codex/*` および `openai-codex/*` モデル参照を正規の `openai/*` 参照へ書き換えます。`--fix` は、安全な場合にレガシーな `models.providers.codex` と `models.providers.openai-codex` の設定もマージし、レガシーな `openai-codex:*` 認証プロファイルと `auth.order.openai-codex` エントリを `openai:*` へ移行し、Codex の意図をプロバイダー/モデル単位の `agentRuntime.id: "codex"` エントリへ移し、古いエージェント全体/セッションのランタイム固定を削除します。また、修復された OpenAI エージェント参照では、直接の OpenAI API キー認証ではなく Codex 認証ルーティングを維持します。
- doctor は、参照先プロファイルがすべて失われている一方で互換性のある保存済み認証情報が存在する、空でない `auth.order.<provider>` リストを報告します。`doctor --fix` は、そのような古いオーバーライドのみを削除し、エージェントごとの認証情報の自動選択を復元します。明示的に空の順序、利用可能な項目が一部残っているリスト、互換性のある保存済み認証情報がない順序は変更されません。アクティブな SQLite 認証ストアを読み取れないか形式が不正な場合、doctor はこの修復をスキップした理由を説明します。設定の再読み込みモードで書き込みが自動適用されない場合は、認証状態を再確認する前に実行中の Gateway を再起動してください。
- doctor は、古い OpenClaw バージョンのレガシーな Plugin 依存関係ステージング状態をクリーンアップし、ピア依存関係として宣言されている管理対象 npm Plugin に対して、ホストの `openclaw` パッケージを再リンクします。また、設定から参照されている欠落したダウンロード可能な Plugin（`plugins.entries`、設定済みチャンネル、設定済みプロバイダー/検索設定、設定済みエージェントランタイム）も修復します。パッケージ更新中は、パッケージの入れ替えが完了するまでパッケージマネージャーによる Plugin 修復をスキップします。設定済み Plugin に引き続き復旧が必要な場合は、その後 `openclaw doctor --fix` を再実行してください。ダウンロードに失敗した場合、doctor はインストールエラーを報告し、次回の修復試行のために設定済み Plugin エントリを保持します。
- doctor は、Plugin 検出が正常な場合、`plugins.allow`/`plugins.deny`/`plugins.entries` から欠落した Plugin ID を削除し、それに対応する参照先のないチャンネル設定、Heartbeat ターゲット、およびチャンネルモデルのオーバーライドも削除して、古い Plugin 設定を修復します。
- doctor は、影響を受ける `plugins.entries.<id>` エントリを無効化し、無効な `config` ペイロードを削除することで、不正な Plugin 設定を隔離します。Gateway の起動時には、すでに問題のあるその Plugin のみがスキップされるため、他の Plugin とチャンネルは動作を継続します。
- doctor は廃止された `plugins.entries.codex.config.codexDynamicToolsProfile` を削除します。Codex app-server は、Codex ネイティブのワークスペースツールを常にネイティブのまま維持します。
- doctor は、レガシーなフラット形式の Talk 設定（`talk.voiceId`、`talk.modelId` など）を `talk.provider` + `talk.providers.<provider>` へ自動移行します。差分がオブジェクトキーの順序だけの場合、`doctor --fix` を繰り返し実行しても、Talk の正規化は報告も適用もされなくなりました。
- doctor にはメモリ検索の準備状況チェックが含まれており、埋め込み用の認証情報がない場合は `openclaw configure --section model` を推奨できます。
- コマンド所有者が設定されていない場合、doctor は警告します。コマンド所有者とは、所有者専用コマンドの実行と危険な操作の承認を許可された人間のオペレーターアカウントです。DM ペアリングで許可されるのは、ボットとの会話だけです。初回所有者ブートストラップが存在する前に送信者を承認していた場合は、`commands.ownerAllowFrom` を明示的に設定してください。
- Codex モードのエージェントが設定されており、オペレーターの Codex ホームに個人用 Codex CLI アセットが存在する場合、doctor は情報メモを報告します。ローカルの Codex app-server の起動では、エージェントごとに分離されたホームを使用します。必要な場合は先に Codex Plugin をインストールし、その後 `openclaw migrate plan codex` を使用して、意図的に昇格させるべきアセットを一覧化してください。
- デフォルトエージェントに許可された Skills が、現在のランタイム環境で利用できない場合（バイナリ、環境変数、設定、または OS 要件の欠落）、doctor は警告します。`doctor --fix` は、`skills.entries.<skill>.enabled=false` を使用して、利用できないそれらの Skills を無効化できます。Skills を有効なまま維持する場合は、代わりに不足している要件をインストールまたは設定してください。
- サンドボックスモードが有効で Docker が利用できない場合、doctor は修復方法（`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`）を伴う、重要度の高い警告を報告します。
- レガシーなサンドボックスレジストリファイルまたはシャードディレクトリ（`~/.openclaw/sandbox/containers.json`、`~/.openclaw/sandbox/browsers.json`、`~/.openclaw/sandbox/containers/`、または `~/.openclaw/sandbox/browsers/`）が存在する場合、doctor はそれらを報告します。`--fix` は、有効なエントリを SQLite へ移行し、無効なレガシーファイルを隔離します。
- `gateway.auth.token`/`gateway.auth.password` が SecretRef で管理され、現在のコマンドパスで利用できない場合、doctor は読み取り専用の警告を報告し、平文のフォールバック認証情報を書き込みません。exec ベースの SecretRef については、`--allow-exec` が存在しない限り、doctor は実行をスキップします。
- 修正パスでチャンネルの SecretRef 検査に失敗した場合、doctor は早期終了せずに処理を続行し、警告を報告します。
- 状態ディレクトリの移行後、有効なデフォルトの Telegram または Discord アカウントが環境変数のフォールバックに依存しており、`TELEGRAM_BOT_TOKEN` または `DISCORD_BOT_TOKEN` を doctor プロセスが利用できない場合、doctor は警告します。
- Telegram の `allowFrom` ユーザー名の自動解決（`doctor --fix`）には、現在のコマンドパスで解決可能な Telegram トークンが必要です。トークンを検査できない場合、doctor は警告を報告し、その実行では自動解決をスキップします。

## macOS：`launchctl` 環境変数オーバーライド

以前に `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（または `...PASSWORD`）を実行した場合、その値が設定ファイルを上書きし、「unauthorized」エラーが継続的に発生する可能性があります。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [Gateway doctor](/ja-JP/gateway/doctor)
