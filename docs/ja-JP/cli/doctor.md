---
read_when:
    - 接続や認証に問題があり、ガイド付きの修正を行いたい場合
    - 更新したので、簡単な動作確認を行いたい場合
summary: '`openclaw doctor` の CLI リファレンス（ヘルスチェックとガイド付き修復）'
title: Doctor
x-i18n:
    generated_at: "2026-07-12T14:25:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4e616fd0843183167662292acf501297f44520050b664796fbb15a117cb68905
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway、チャンネル、plugins、Skills、モデルルーティング、ローカル状態、設定移行の健全性チェックとクイック修復を行います。何かが期待どおりに動作せず、問題の内容を1つのコマンドで確認したい場合に使用します。

関連項目:

- トラブルシューティング: [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- セキュリティ監査: [セキュリティ](/ja-JP/gateway/security)

## 動作モード

Doctorには5つの動作モードがあります:

| 動作モード                | コマンド                                  | 動作                                                                            |
| ------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------- |
| 検査                      | `openclaw doctor`                         | 人間向けのチェックとガイド付きプロンプト。                                      |
| 修復                      | `openclaw doctor --fix`                   | サポート対象の修復を適用します。非対話型の修復が安全でない場合はプロンプトを使用します。 |
| Lint                      | `openclaw doctor --lint`                  | CI、事前チェック、レビューゲート向けの読み取り専用の構造化された検出結果。      |
| 共有SQLiteメンテナンス    | `openclaw doctor --state-sqlite compact`  | 正規の共有状態DBを明示的にチェックポイント、圧縮、検証します。                  |
| セッションSQLite移行      | `openclaw doctor --session-sqlite <mode>` | セッション状態を検査、インポート、検証、圧縮、復旧、または復元します。          |

自動化で安定した結果が必要な場合は`--lint`を推奨します。人間のオペレーターがdoctorに設定や状態を編集させる場合は`--fix`を推奨します。

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

チャンネル固有の権限については、`doctor`ではなくチャンネルプローブを使用します:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities`は、特定のチャンネルターゲットに対するbotの実効権限を報告します。`channels status --probe`は、設定済みのすべてのチャンネルと音声自動参加ターゲットを監査します。

## オプション

| オプション                      | 効果                                                                                                                                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions`    | ワークスペースのメモリ／検索候補を無効にします。                                                                                                                                        |
| `--yes`                         | プロンプトを表示せずにデフォルトを受け入れます。                                                                                                                                        |
| `--repair` / `--fix`            | 推奨されるサービス以外の修復をプロンプトなしで適用します（`--fix`はエイリアスです）。Gatewayサービスのインストール／書き換えには、引き続き対話型の確認または明示的な`gateway`コマンドが必要です。 |
| `--force`                       | カスタムサービス設定の上書きを含む、積極的な修復を適用します。                                                                                                                          |
| `--non-interactive`             | プロンプトなしで実行します。安全な移行とサービス以外の修復のみを行います。                                                                                                              |
| `--generate-gateway-token`      | Gatewayトークンを生成して設定します。                                                                                                                                                   |
| `--allow-exec`                  | シークレットの検証中に、設定済みの`exec` SecretRefsをdoctorが実行できるようにします。                                                                                                   |
| `--deep`                        | 追加のGatewayインストールがないかシステムサービスをスキャンし、最近のGatewayスーパーバイザー再起動の引き継ぎを報告します。                                                              |
| `--lint`                        | 最新化された健全性チェックを読み取り専用モードで実行し、診断結果を出力します。                                                                                                          |
| `--post-upgrade`                | アップグレード後のplugin互換性プローブを実行します。検出結果は標準出力に送られ、エラーレベルの検出結果が1つでも存在する場合は終了コード1になります。                                    |
| `--state-sqlite <mode>`         | 明示的な共有状態SQLiteメンテナンスを実行します。唯一のモードは`compact`です。                                                                                                           |
| `--session-sqlite <mode>`       | 対象のセッションSQLite移行モードを実行します: `inspect`、`dry-run`、`import`、`validate`、`compact`、`recover`、または`restore`。                                                        |
| `--session-sqlite-store <path>` | `--session-sqlite`とともに使用し、従来の`sessions.json`ストアパスを1つ選択します。                                                                                                      |
| `--session-sqlite-agent <id>`   | `--session-sqlite`とともに使用し、設定済みのエージェントを1つ選択します。                                                                                                               |
| `--session-sqlite-all-agents`   | `--session-sqlite`とともに使用し、設定済みおよび検出済みのエージェントストアを選択します。                                                                                               |
| `--github-issue`                | `--session-sqlite recover`とともに使用し、サニタイズされたopenclaw/openclawのissueレポートを準備します。doctorは`--yes`または対話型の確認後に`gh`で作成します。                           |
| `--json`                        | `--lint`ではJSON形式の検出結果。`--post-upgrade`では`{ probesRun, findings }`。`--state-sqlite`または`--session-sqlite`ではメンテナンスレポートをJSONとして出力します。                  |
| `--severity-min <level>`        | `--lint`とともに使用し、`info`、`warning`、または`error`未満の検出結果を除外します。                                                                                                    |
| `--all`                         | `--lint`とともに使用し、デフォルトセットから除外されているオプトインチェックを含む、登録済みのすべてのチェックを実行します。                                                            |
| `--skip <id>`                   | `--lint`とともに使用し、チェックIDをスキップします。繰り返し指定できます。                                                                                                              |
| `--only <id>`                   | `--lint`とともに使用し、指定されたチェックIDのみを実行します。繰り返し指定できます。                                                                                                    |

`--severity-min`、`--all`、`--only`、`--skip`は`--lint`との組み合わせでのみ使用できます。`--json`は`--lint`、`--post-upgrade`、`--state-sqlite`、`--session-sqlite`とともに使用できます。

## Lintモード

`openclaw doctor --lint`は読み取り専用です。プロンプト、修復、設定／状態の書き換えは行いません。

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

JSON出力はスクリプト向けのインターフェースです:

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

| コード | 意味                                                          |
| ------ | ------------------------------------------------------------- |
| `0`    | 選択された重大度のしきい値以上の検出結果はありません。        |
| `1`    | 選択されたしきい値を満たす検出結果が少なくとも1つあります。   |
| `2`    | Lintの検出結果を生成する前にコマンド／ランタイムが失敗しました。 |

`--severity-min`は、出力する検出結果と終了しきい値の両方を制御します。`openclaw doctor --lint --severity-min error`は、重大度の低い`info`／`warning`の検出結果が存在しても、何も出力せず終了コード`0`で終了する場合があります。

`--all`は、重大度によるフィルタリングの前に選択されるチェックを制御します。デフォルトのLint実行では、詳細、履歴的、または修復可能な従来の残存物を検出する可能性が高いチェックが除外されます。完全な一覧を確認するには`--all`を使用します。`--only <id>`は最も精密なセレクターで、登録済みの任意のチェックをIDで実行できます。

`core/doctor/local-audio-acceleration`は、音声モデルを読み込まずに、自動選択されたローカルSTTコマンド、利用可能／要求済み／観測済みのバックエンドに関する個別の根拠、およびフォールバック順序を報告します。情報レベルの検出結果を出力するため、表示するには`--severity-min info`を指定してください。

## 構造化された健全性チェック

最新のdoctorチェックでは、小さく分割された契約を使用します:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()`は`doctor --lint`を動作させます。`repair()`は任意であり、`doctor --fix`／`doctor --repair`の実行時にのみ動作します。この形式にまだ移行されていないチェックでは、従来のdoctorコントリビューションフローが引き続き使用されます。

修復コンテキストは`dryRun`／`diff`リクエストを保持できます。修復結果は構造化された`diffs`（設定／ファイル編集）と`effects`（サービス、プロセス、パッケージ、状態、またはその他の副作用）を返せるため、変換済みのチェックは変更計画を`detect()`に移すことなく、`doctor --fix --dry-run`へ発展できます。

`repair()`は`status: "repaired" | "skipped" | "failed"`を報告します（statusを省略した場合は`repaired`を意味します）。修復が`skipped`または`failed`を返した場合、doctorは理由を報告し、そのチェックの検証をスキップします。修復に成功すると、doctorは修復された検出結果を対象として`detect()`を再実行します。検出結果がまだ存在する場合、doctorは変更が完了したものとして扱わず、修復警告を報告します。

検出結果には以下が含まれます:

| フィールド        | 目的                                                           |
| ----------------- | -------------------------------------------------------------- |
| `checkId`         | skip/only フィルターおよび CI 許可リスト用の安定した ID。      |
| `severity`        | `info`、`warning`、または `error`。                            |
| `message`         | 人間が読める問題の説明。                                       |
| `path`            | 利用可能な場合は、設定、ファイル、または論理パス。             |
| `line` / `column` | 利用可能な場合は、ソース内の位置。                             |
| `ocPath`          | チェックが指し示せる場合の正確な `oc://` アドレス。            |
| `fixHint`         | 推奨されるオペレーター操作または修復内容の概要。               |

モダナイズされたコア doctor チェックは、人間向けの `doctor` / `doctor --fix` の動作を所有する、順序付けされた doctor コントリビューションに関連付けられたままです。共有の構造化ヘルスレジストリが拡張ポイントです。バンドルされたチェックと Plugin ベースのチェックは、所有するパッケージがアクティブなコマンドパスに登録した後、コア doctor チェックに続いて実行されます。`openclaw/plugin-sdk/health` は Plugin 作成者向けに同じコントラクトを公開します。

## チェックの選択

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` と `--skip` は完全なチェック ID を受け付け、繰り返し指定できます。`--only` の ID が登録されていない場合、その ID に対するチェックは実行されません。出力の `checksRun`/`checksSkipped` を使用して、対象を絞ったゲートが想定どおりのチェックを選択していることを確認してください。

## アップグレード後モード

`openclaw doctor --post-upgrade` は、ビルドまたはアップグレード後の連続実行用に Plugin 互換性プローブを実行します。検出結果は stdout に出力され、いずれかの検出結果に `level: "error"` がある場合、終了コードは 1 になります。機械可読なエンベロープ（`{ probesRun, findings }`）を出力するには `--json` を追加します。これは CI、コミュニティの `fork-upgrade` skill、およびその他のアップグレード後スモークツールに適しています。インストール済み Plugin のインデックスが存在しないか不正な形式である場合も、JSON モードでは `plugin.index_unavailable` エラーの検出結果を含むエンベロープが出力されます。

コンテナイメージの起動は、通常の「更新後に doctor を実行する」フローの例外です。新しい OpenClaw バージョンで `openclaw gateway run` が起動すると、準備完了を報告する前に、安全な状態修復と Plugin 修復を実行します。修復を安全に完了できない場合、起動は終了し、コンテナを通常どおり再起動する前に、同じマウント済み状態/設定に対して同じイメージで `openclaw doctor --fix` を一度実行するよう案内します。

## 共有状態 SQLite の圧縮

`openclaw doctor --state-sqlite compact` は、`<state-dir>/state/openclaw.sqlite` にある正規の共有状態データベースに対する明示的なオフラインメンテナンスです。任意のデータベースパスは受け付けず、通常の Gateway 操作から呼び出されることはなく、`openclaw doctor --fix` の一部でもありません。

まず Gateway を停止し、検証済みのバックアップを作成してください。

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --state-sqlite compact --json
openclaw gateway start
```

このコマンドは次を行います。

1. 正規の共有状態パスに通常ファイルが存在することを要求します。データベースが存在しない場合は `skipped` と報告され、正常終了します。
2. チェックポイント処理やファイル変更の前に、現在サポートされているスキーマバージョンと `schema_meta.role = "global"` を検証します。
3. ビジー状態でない `wal_checkpoint(TRUNCATE)` を要求します。チェックポイントがビジーの場合は、残っている OpenClaw プロセスを停止して再試行してください。
4. `auto_vacuum` を `INCREMENTAL` に設定し、完全な `VACUUM` を実行して、再度チェックポイント処理を行います。
5. `quick_check`、`integrity_check`、`foreign_key_check` を実行し、データベースと SQLite サイドカーファイルに所有者のみの権限を再適用します。

JSON 出力では、圧縮前後のデータベースと WAL のサイズ、フリーリストページ数、ページサイズ、`auto_vacuum` 値に加えて、回収されたバイト数と `quick_check` および `integrity_check` の結果が報告されます。`foreign_key_check` はフェイルクローズ方式で強制され、個別の成功フィールドはありません。SQLite は `auto_vacuum` を、無効の場合は `0`、完全の場合は `1`、増分の場合は `2` として報告します。

スキーマが古い場合、実行中の OpenClaw ビルドより新しい場合、またはエージェントデータベースに属する場合、圧縮は変更を加えずに失敗します。古い共有状態スキーマの場合は、先に `openclaw doctor --fix` を実行してください。新しいスキーマの場合は、互換性のあるバックアップを復元するか、OpenClaw をアップグレードしてください。

## セッション SQLite の移行

OpenClaw は、Gateway の起動時および `openclaw doctor --fix` の実行時に、従来のセッション行とトランスクリプト履歴を各エージェントの SQLite データベースへ自動的にインポートします。`openclaw doctor --session-sqlite <mode>` は、その移行を対象とする検査および検証ツールです。現在のランタイムセッション行は `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` に保存されます。従来の `sessions.json` ファイルは移行元です。アクティブなトランスクリプト JSONL ファイルはインポートされ、正常なインポート後にアクティブなセッションディレクトリ外へアーカイブされます。アーカイブ層の JSONL ファイルはサポート用成果物であり、ランタイムのフォールバックではありません。

モード：

| モード     | 動作                                                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | インポートせずに、従来形式と SQLite の件数、および参照されていない JSONL ファイルを読み取ります。                            |
| `dry-run`  | 従来のエントリとトランスクリプト JSONL ファイルを解析し、インポート可能な行数を数え、SQLite 行を書き込まずに問題を報告します。 |
| `import`   | 選択した対象について、従来のエントリとトランスクリプトイベントを SQLite にインポートします。                               |
| `validate` | 選択した従来の移行元を、SQLite 行およびトランスクリプトイベント数と比較します。                                             |
| `compact`  | 大量削除またはアーカイブのクリーンアップ後に空きページを回収するため、選択したエージェント SQLite データベースをチェックポイント処理して VACUUM します。 |
| `recover`  | 直近の失敗した移行実行を復元し、その対象を検証して、サニタイズ済みの GitHub Issue レポートを準備します。                    |
| `restore`  | SQLite データを削除せず、記録された移行マニフェストからアーカイブ済みトランスクリプト成果物を復元します。                   |

セレクター：

- デフォルト：設定されたデフォルトのエージェントストア。ただし、その従来のストアファイルが存在する場合。
- `--session-sqlite-agent <id>`：設定済みの 1 つのエージェント。
- `--session-sqlite-all-agents`：設定済みのエージェントストアと検出されたエージェントストア。
- `--session-sqlite-store <path>`：明示的に指定した 1 つの従来の `sessions.json` パス。

手動検査の手順：

```bash
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-all-agents --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
```

重要な履歴があるインストール環境で `import` を実行する前に、OpenClaw の状態ディレクトリをバックアップしてください。選択した従来のエントリが SQLite に存在しない場合、セッション ID が異なる場合、またはトランスクリプトイベント数が異なる場合、`validate` は 0 以外で終了します。`--session-sqlite-store <path>` を使用する場合は、レポートに想定した対象数が含まれていることを確認してください。明示的に指定したストアパスが存在しない場合、対象は選択されません。

SQLite の削除では、まずデータベース内部のページが回収されます。データベースファイルが直ちに縮小されるとは限りません。大きなトランスクリプトを削除またはアーカイブした後は、`openclaw doctor --session-sqlite compact --session-sqlite-all-agents` を実行して WAL ファイルをチェックポイント処理し、`VACUUM` を実行して、処理前後のデータベースと WAL のサイズを報告してください。圧縮には、現在のエージェントスキーマ、選択したエージェントの永続的な所有者メタデータを持ち、doctor プロセスで開かれたハンドルがない通常ファイルが必要です。これは明示的なオフラインメンテナンスです。通常の書き込みがチェックポイント処理や `VACUUM` と競合しないよう、先に Gateway を停止してください。

各インポートでは、トランスクリプト成果物をアーカイブへ移動する前に、`~/.openclaw/session-sqlite-migration-runs/` 配下へマニフェストが書き込まれます。成果物の移動後に、起動時のセッション SQLite 移行失敗が報告された場合は、リカバリーを実行してください。

```bash
openclaw doctor --session-sqlite recover --github-issue
```

リカバリーは、直近の失敗した移行マニフェストを選択し、そのマニフェストのアーカイブ済み成果物のみを復元し、影響を受けた対象を検証し、サニタイズ済みの `.failure.md` および `.failure.json` レポートを更新して、トランスクリプトの内容、生の環境情報、シークレット、無制限の設定を含まない GitHub Issue 本文を準備します。失敗した移行マニフェストが存在しないものの、選択したエージェント SQLite データベースが破損している、データベースではない、またはメインデータベースなしでジャーナルサイドカーが存在する場合、リカバリーは完全なファイルセットを一時検査ディレクトリへコピーします。SQLite は、その破棄可能なコピー内で有効なホットジャーナルをロールバックしてから `quick_check`、`integrity_check`、`foreign_key_check` を実行でき、元のフォレンジックファイルは変更されません。整合性チェックの失敗または孤立したサイドカーがある場合、検出されたセット全体の名前を 1 つの `.corrupt-<timestamp>` サフィックス付きに変更することで、DB、WAL、SHM、ロールバックジャーナルの各ファイルが保持されます。名前変更の失敗を捕捉すると、失敗を報告する前に移動済みのファイルがロールバックされるため、復元可能なファイルセットが暗黙に分割されることはありません。リカバリー前に Gateway を停止してください。変化中の SQLite ファイルセットをコピーまたは名前変更することは安全ではなく、オペレーティングシステムによって動作が異なります。`--github-issue --yes` を指定すると、doctor は GitHub CLI を使用して `openclaw/openclaw` に Issue を作成します。確認を指定しない場合は、ローカルのサポートレポートを書き込み、入力済みの Issue URL を出力します。

`restore` は、より低レベルの取り消し操作として残ります。これはマニフェストの `sourcePath -> archivePath` レコードを使用し、元のパスが存在しない場合にのみアーカイブ済み成果物を元へ戻し、両方のパスが存在する場合は競合を報告し、SQLite データベースはそのまま残します。

### セッション SQLite 移行後のダウングレード

以前のファイルベースの OpenClaw バージョンを起動する前に、アーカイブ済みの従来のトランスクリプト成果物を復元してください。

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

以前のバージョンは、`sessions.json` のエントリと、それらのエントリに記録された `sessionFile` パスを読み取ります。SQLite 移行後、正常にインポートされたアクティブな JSONL トランスクリプトは `session-sqlite-import-archive/` へ移動されるため、復元によってマニフェストに記録された成果物を元のパスへ戻すまで、以前のランタイムからその履歴を参照できません。

復元では SQLite データは削除されません。SQLite への切り替え後に作成されたセッションは SQLite にのみ存在し、以前のランタイムには表示されません。後で再度アップグレードする場合は、上記の通常の移行検証手順を実行し、インポート前に OpenClaw が復元済みの従来の成果物と SQLite 行を比較できるようにしてください。

## 注記

- Nix モード（`OPENCLAW_NIX_MODE=1`）では、読み取り専用の doctor チェックは引き続き機能しますが、`openclaw.json` が不変であるため、`doctor --fix`、`doctor --repair`、`doctor --yes`、`doctor --generate-gateway-token` は無効になります。代わりに、このインストールの Nix ソースを編集してください。nix-openclaw については、エージェント優先の[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を使用してください。
- 対話型プロンプト（キーチェーン/OAuth の修正など）は、stdin が TTY であり、かつ `--non-interactive` が設定されていない場合にのみ実行されます。ヘッドレス実行（cron、Telegram、端末なし）ではプロンプトをスキップします。
- 非対話型の `doctor` 実行では、ヘッドレスのヘルスチェックを高速に保つため、先行的な Plugin 読み込みをスキップします。対話型セッションでは、従来のヘルス/修復フローに必要な Plugin サーフェスを引き続き読み込みます。
- `--lint` は `--non-interactive` より厳格です。常に読み取り専用で、プロンプトを表示せず、安全なマイグレーションも適用しません。doctor に変更を行わせる場合は、`doctor --fix` または `doctor --repair` を使用してください。
- doctor はデフォルトでは、シークレットの確認中に `exec` SecretRefs を実行しません。設定済みのシークレットリゾルバーを doctor に意図的に実行させる場合にのみ、`--allow-exec`（`--lint` の有無を問わず）を使用してください。
- 設定への書き込み（`--fix` の修復を含む）が行われるたびに、バックアップが `~/.openclaw/openclaw.json.bak` にローテーションされます（番号付きの `.bak.1`..`.bak.4` リングを使用）。`--fix` は、スキーマ検証で報告された不明な設定キーも削除し、削除した各キーを一覧表示します。ただし、更新中はこれをスキップするため、部分的に書き込まれたアップグレード状態がマイグレーション完了前に除去されることはありません。
- 別のスーパーバイザーが Gateway のライフサイクルを管理している場合は、`OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。doctor は引き続き Gateway/サービスのヘルスを報告し、サービス以外の修復を適用しますが、サービスのインストール/起動/再起動/ブートストラップ、および従来のサービスのクリーンアップはスキップします。
- Linux では、doctor は非アクティブな余分の Gateway 類似 systemd ユニットを無視し、修復中に実行中の systemd Gateway サービスのコマンド/エントリポイントメタデータを書き換えません。まずサービスを停止するか、`openclaw gateway install --force` を使用してアクティブなランチャーを置き換えてください。
- `doctor --fix --non-interactive` は、Gateway サービス定義の欠落または古さを報告しますが、更新修復モード以外ではインストールや書き換えを行いません。サービスが欠落している場合は `openclaw gateway install` を、ランチャーを置き換える場合は `openclaw gateway install --force` を実行してください。
- 状態整合性チェックは、セッションディレクトリ内の孤立したトランスクリプトファイルを検出します。それらを `.deleted.<timestamp>` としてアーカイブするには対話型の確認が必要です。`--fix`、`--yes`、およびヘッドレス実行では、そのまま残します。
- doctor は、`~/.openclaw/cron/jobs.json`（または `cron.store`）をスキャンして従来形式の cron ジョブを検出し、正規化された行を SQLite にインポートする前に書き換えます。
- doctor は、明示的な `payload.model` オーバーライドが設定された cron ジョブについて、プロバイダー名前空間ごとの件数と `agents.defaults.model` との不一致を含めて報告します。これにより、デフォルトモデルを継承しないスケジュール済みジョブを、認証または請求の調査時に確認できます。
- doctor は、実行中としてマークされたままの cron ジョブ（`state.runningAtMs`）を報告します。この状態では、`openclaw cron list` によって `running` と表示されることがあります。このチェックは読み取り専用です。現在、マークされたジョブを実行している Gateway がない場合、次回の cron サービス起動時に中断された実行が記録され、マーカーがクリアされます。
- Linux では、ユーザーの crontab が保守されていない従来の `~/.openclaw/bin/ensure-whatsapp.sh` を引き続き実行している場合、doctor が警告します。cron に systemd ユーザーバス環境がないと、これにより `Gateway inactive` が誤って報告されることがあります。
- WhatsApp が有効な場合、doctor はローカルの `openclaw-tui` クライアントがまだ実行中で、Gateway のイベントループが劣化していないか確認します。`doctor --fix` は、検証済みのローカル TUI クライアントのみを停止し、WhatsApp の返信が古い TUI 更新ループの後ろでキューに滞留しないようにします。
- doctor は、プライマリモデル、フォールバック、画像/動画生成モデル、Heartbeat/サブエージェント/Compaction のオーバーライド、フック、チャネルモデルのオーバーライド、古いセッションルート固定設定にわたり、従来の `openai-codex/*` モデル参照を正規の `openai/*` 参照に書き換えます。`--fix` は、従来の `openai-codex:*` 認証プロファイルと `auth.order.openai-codex` エントリも `openai:*` に移行し、Codex の意図をプロバイダー/モデルスコープの `agentRuntime.id: "codex"` エントリに移し、古いエージェント全体/セッションのランタイム固定設定を削除します。また、修復された OpenAI エージェント参照では、OpenAI API キーによる直接認証ではなく Codex 認証ルーティングを維持します。
- doctor は、参照先プロファイルがすべて失われている一方で、互換性のある保存済み認証情報が存在する、空でない `auth.order.<provider>` リストを報告します。`doctor --fix` は、そのような古いオーバーライドのみを削除し、エージェントごとの認証情報の自動選択を復元します。明示的に空の順序、使用可能な項目が一部残っているリスト、互換性のある保存済み認証情報がない順序は変更されません。アクティブな SQLite 認証ストアが読み取れない、または不正な形式の場合、doctor はこの修復をスキップした理由を説明します。実行中の Gateway の設定再読み込みモードで書き込みが自動的に適用されない場合は、認証状態を再確認する前に Gateway を再起動してください。
- doctor は、古い OpenClaw バージョンの従来の Plugin 依存関係ステージング状態をクリーンアップし、ピア依存関係として宣言している管理対象 npm Plugin に対して、ホストの `openclaw` パッケージを再リンクします。また、設定で参照されているダウンロード可能な Plugin（`plugins.entries`、設定済みチャネル、設定済みプロバイダー/検索設定、設定済みエージェントランタイム）の欠落も修復します。パッケージの更新中は、パッケージ交換が完了するまで doctor はパッケージマネージャーによる Plugin 修復をスキップします。設定済み Plugin の復旧が引き続き必要な場合は、その後 `openclaw doctor --fix` を再実行してください。ダウンロードに失敗した場合、doctor はインストールエラーを報告し、次回の修復試行に備えて設定済み Plugin エントリを保持します。
- Plugin の検出が正常な場合、doctor は `plugins.allow`/`plugins.deny`/`plugins.entries` から欠落した Plugin ID を削除し、それに対応する未参照のチャネル設定、Heartbeat ターゲット、チャネルモデルのオーバーライドも削除して、古い Plugin 設定を修復します。
- doctor は、影響を受ける `plugins.entries.<id>` エントリを無効化し、不正な `config` ペイロードを削除することで、無効な Plugin 設定を隔離します。Gateway の起動時には、すでに問題のあるその Plugin のみがスキップされるため、他の Plugin とチャネルは引き続き動作します。
- doctor は、廃止された `plugins.entries.codex.config.codexDynamicToolsProfile` を削除します。Codex app-server は常に Codex ネイティブのワークスペースツールをネイティブのまま維持します。
- doctor は、従来のフラットな Talk 設定（`talk.voiceId`、`talk.modelId` など）を `talk.provider` + `talk.providers.<provider>` に自動移行します。差異がオブジェクトキーの順序だけの場合、`doctor --fix` を繰り返し実行しても、Talk の正規化は報告も適用もされなくなりました。
- doctor にはメモリ検索の準備状況チェックが含まれ、埋め込み用の認証情報が欠落している場合は `openclaw configure --section model` を推奨できます。
- コマンド所有者が設定されていない場合、doctor は警告します。コマンド所有者とは、所有者専用コマンドの実行と危険なアクションの承認を許可された人間のオペレーターアカウントです。DM ペアリングで可能になるのは、ボットとの会話だけです。最初の所有者を設定するブートストラップが導入される前に送信者を承認した場合は、`commands.ownerAllowFrom` を明示的に設定してください。
- Codex モードのエージェントが設定されており、オペレーターの Codex ホームに個人用 Codex CLI アセットが存在する場合、doctor は情報メモを報告します。ローカルの Codex app-server 起動では、エージェントごとに分離されたホームを使用します。必要に応じて最初に Codex Plugin をインストールし、その後 `openclaw migrate plan codex` を使用して、意図的に昇格させるべきアセットのインベントリを作成してください。
- デフォルトエージェントに許可された Skills が現在のランタイム環境で利用できない場合（バイナリ、環境変数、設定、または OS 要件の欠落）、doctor は警告します。`doctor --fix` は、`skills.entries.<skill>.enabled=false` を使用して、利用できない Skills を無効化できます。Skills を有効なまま維持する場合は、代わりに欠落している要件をインストールまたは設定してください。
- サンドボックスモードが有効で Docker が利用できない場合、doctor は修復方法（`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`）を含む、重要度の高い警告を報告します。
- 従来のサンドボックスレジストリファイルまたはシャードディレクトリ（`~/.openclaw/sandbox/containers.json`、`~/.openclaw/sandbox/browsers.json`、`~/.openclaw/sandbox/containers/`、または `~/.openclaw/sandbox/browsers/`）が存在する場合、doctor はそれらを報告します。`--fix` は有効なエントリを SQLite に移行し、無効な従来ファイルを隔離します。
- `gateway.auth.token`/`gateway.auth.password` が SecretRef で管理され、現在のコマンドパスでは利用できない場合、doctor は読み取り専用の警告を報告し、プレーンテキストのフォールバック認証情報を書き込みません。exec ベースの SecretRefs については、`--allow-exec` が存在しない限り、doctor は実行をスキップします。
- 修復パスでチャネルの SecretRef 検査に失敗した場合、doctor は早期終了せず、処理を続行して警告を報告します。
- 状態ディレクトリのマイグレーション後、有効なデフォルトの Telegram または Discord アカウントが環境変数のフォールバックに依存しており、`TELEGRAM_BOT_TOKEN` または `DISCORD_BOT_TOKEN` を doctor プロセスで利用できない場合、doctor は警告します。
- Telegram の `allowFrom` ユーザー名の自動解決（`doctor --fix`）には、現在のコマンドパスで解決可能な Telegram トークンが必要です。トークンを検査できない場合、doctor は警告を報告し、その回の自動解決をスキップします。

## macOS：`launchctl` 環境変数のオーバーライド

以前に `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（または `...PASSWORD`）を実行した場合、その値が設定ファイルより優先され、「unauthorized」エラーが継続的に発生する可能性があります。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [Gateway doctor](/ja-JP/gateway/doctor)
