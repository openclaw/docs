---
read_when:
    - 接続または認証の問題があり、ガイド付きの修正を必要としている
    - 更新したので、簡単な確認をしたい
summary: '`openclaw doctor` の CLI リファレンス（ヘルスチェック + ガイド付き修復）'
title: 診断
x-i18n:
    generated_at: "2026-06-27T10:54:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf7c07cd39053fce7efa81d968ef0f2666f6f5331581e72d2684843519c63b43
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway とチャネルのヘルスチェックとクイック修復。

関連:

- トラブルシューティング: [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- セキュリティ監査: [セキュリティ](/ja-JP/gateway/security)

## 使用する理由

`openclaw doctor` は OpenClaw のヘルス確認サーフェスです。Gateway、
チャネル、プラグイン、Skills、モデルルーティング、ローカル状態、または設定移行が
期待どおりに動作せず、何が問題かを 1 つのコマンドで説明したい場合に使用します。

Doctor には 3 つの姿勢があります:

| 姿勢 | コマンド                 | 動作                                                                            |
| ---- | ------------------------ | ------------------------------------------------------------------------------- |
| 検査 | `openclaw doctor`        | 人間向けのチェックとガイド付きプロンプト。                                      |
| 修復 | `openclaw doctor --fix`  | サポートされている修復を適用します。非対話修復が安全な場合を除き、プロンプトを使用します。 |
| Lint | `openclaw doctor --lint` | CI、事前確認、レビューゲート向けの読み取り専用の構造化された検出結果。          |

自動化で安定した結果が必要な場合は `--lint` を優先してください。人間のオペレーターが
意図的に doctor に設定または状態を編集させたい場合は `--fix` を優先してください。

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
```

チャネル固有の権限には、`doctor` ではなくチャネルプローブを使用します:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

対象を絞った Discord 機能プローブはボットの有効なチャネル権限を報告します。ステータスプローブは設定済みの Discord チャネルと音声自動参加ターゲットを監査します。

## オプション

- `--no-workspace-suggestions`: ワークスペースのメモリ/検索候補を無効にする
- `--yes`: プロンプトなしでデフォルトを受け入れる
- `--repair`: 推奨される非サービス修復をプロンプトなしで適用する。Gateway サービスのインストールと書き換えには、引き続き対話的な確認または明示的な Gateway コマンドが必要
- `--fix`: `--repair` のエイリアス
- `--force`: 必要に応じてカスタムサービス設定を上書きするなど、積極的な修復を適用する
- `--non-interactive`: プロンプトなしで実行する。安全な移行と非サービス修復のみ
- `--generate-gateway-token`: Gateway トークンを生成して設定する
- `--allow-exec`: シークレット検証中に、設定済みの exec SecretRefs を doctor が実行できるようにする
- `--deep`: 追加の Gateway インストールについてシステムサービスをスキャンし、最近の Gateway スーパーバイザー再起動ハンドオフを報告する
- `--lint`: 読み取り専用モードで近代化されたヘルスチェックを実行し、診断検出結果を出力する
- `--post-upgrade`: アップグレード後のプラグイン互換性プローブを実行する。検出結果を stdout に出力する。error レベルの検出結果が 1 件でも存在する場合はコード 1 で終了する
- `--json`: `--lint` と併用すると、人間向け出力の代わりに JSON 検出結果を出力する。`--post-upgrade` と併用すると、機械可読の JSON エンベロープ（`{ probesRun, findings }`）を出力する
- `--severity-min <level>`: `--lint` と併用すると、`info`、`warning`、または `error` 未満の検出結果を除外する
- `--all`: `--lint` と併用すると、デフォルトの自動化セットから除外されるオプトインチェックを含め、登録済みのすべてのチェックを実行する
- `--skip <id>`: `--lint` と併用すると、チェック ID をスキップする。複数スキップするには繰り返す
- `--only <id>`: `--lint` と併用すると、チェック ID のみを実行する。小さな選択セットを実行するには繰り返す

## Lint モード

`openclaw doctor --lint` は doctor チェックの読み取り専用の自動化姿勢です。
構造化ヘルスチェック経路を使用し、プロンプトを表示せず、設定/状態を修復または
書き換えません。ガイド付き修復プロンプトではなく機械可読の検出結果が必要な場合に、
CI、事前確認スクリプト、レビュー ワークフローで使用します。
`--json`、`--severity-min`、`--all`、`--only`、`--skip` などの Lint 出力オプションは
`--lint` と併用した場合にのみ受け付けられます。

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
```

人間向け出力はコンパクトです:

```text
doctor --lint: ran 6 check(s), 1 finding(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode is unset; gateway start will be blocked.
    fix: Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`.
```

JSON 出力は Lint 実行用のスクリプト用サーフェスです:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode is unset; gateway start will be blocked.",
      "path": "gateway.mode",
      "fixHint": "Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`."
    }
  ]
}
```

終了動作:

- `0`: 選択された重大度しきい値以上の検出結果がない
- `1`: 選択されたしきい値を満たす検出結果が少なくとも 1 件ある
- `2`: Lint 検出結果を生成する前のコマンド/ランタイム失敗

`--severity-min` は、表示される検出結果と終了しきい値の両方を制御します。たとえば、
`openclaw doctor --lint --severity-min error` は、重大度が低い `info` または `warning` の
検出結果が存在する場合でも、検出結果を何も表示せずに `0` で終了できます。

`--all` は、重大度フィルタリングの前にどのチェックを選択するかを制御します。
デフォルトの Lint 実行は安定した自動化ゲートであり、深い、履歴的、または
修復可能なレガシー残留物を表面化させる可能性が高いために意図的にオプトインとされている
チェックを除外します。各チェック ID を列挙せずに完全な Lint インベントリが必要な場合は
`--all` を使用します。`--only <id>` は引き続き最も正確なセレクターであり、登録済みの任意のチェックを ID で実行できます。

## 構造化ヘルスチェック

近代的な doctor チェックは小さな構造化コントラクトを使用します:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` は `doctor --lint` を動かします。`repair()` は任意であり、
`doctor --fix` / `doctor --repair` によってのみ考慮されます。この形に移行していない
チェックは、従来の doctor コントリビューション フローを引き続き使用します。

この分割は意図的です。`detect()` は診断を所有し、`repair()` は何を変更したか、
または何を変更する予定かの報告を所有します。修復コンテキストは `dryRun`/`diff`
リクエストを保持でき、修復結果は設定/ファイル編集用の構造化された `diffs` と、
サービス、プロセス、パッケージ、状態、またはその他の副作用用の `effects` を返せます。
これにより、変換済みチェックはミューテーション計画を `detect()` に移さずに、
`doctor --fix --dry-run` と差分報告へ発展できます。

`repair()` は、要求された修復を試行したかどうかを `status:
"repaired" | "skipped" | "failed"` で報告します。ステータスが省略された場合は
`repaired` を意味するため、単純な修復チェックは変更だけを返せば十分です。
修復が `skipped` または `failed` を返した場合、doctor は理由を報告し、そのチェックの検証は実行しません。

構造化修復が成功した後、doctor は修復済みの検出結果をスコープとして `detect()` を
再実行します。チェックは、選択された検出結果、パス、または `ocPath` 値を使用して
焦点を絞った検証を行えます。検出結果がまだ存在する場合、doctor は変更を暗黙に完了したものとして扱わず、修復警告を報告します。

検出結果には以下が含まれます:

| フィールド        | 目的                                                   |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | skip/only フィルターと CI 許可リスト用の安定した ID。 |
| `severity`        | `info`、`warning`、または `error`。                    |
| `message`         | 人間が読める問題文。                                  |
| `path`            | 利用可能な場合の設定、ファイル、または論理パス。      |
| `line` / `column` | 利用可能な場合のソース位置。                          |
| `ocPath`          | チェックが指し示せる場合の正確な `oc://` アドレス。   |
| `fixHint`         | 推奨されるオペレーター操作または修復概要。            |

近代化されたコア doctor チェックは、それらの人間向け `doctor` / `doctor --fix` 動作を
所有する順序付き doctor コントリビューションに紐付いたままです。共有の構造化ヘルス
レジストリが拡張ポイントです。バンドル済みおよびプラグイン backed のチェックは、
所有パッケージがアクティブなコマンド経路で登録した後、コア doctor チェックの後に実行されます。
`openclaw/plugin-sdk/health` サブパスは、これらの拡張コンシューマー向けに同じ
コントラクトを公開します。

## チェックの選択

ワークフローで焦点を絞ったゲートが必要な場合は、`--only` と `--skip` を使用します:

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` と `--skip` は完全なチェック ID を受け付け、繰り返し指定できます。`--only`
ID が登録されていない場合、その ID に対してチェックは実行されません。コマンドの
`checksRun` と `checksSkipped` フィールドを使用して、焦点を絞ったゲートが期待するチェックを
選択していることを確認してください。

## アップグレード後モード

`openclaw doctor --post-upgrade` は、ビルドまたはアップグレード後に連鎖して実行することを
意図したプラグイン互換性プローブを実行します。検出結果は stdout に出力されます。
`level: "error"` の検出結果が 1 件でもある場合、コマンドはコード 1 で終了します。
CI、コミュニティの `fork-upgrade` skill、およびその他のアップグレード後スモークツールに適した
機械可読のエンベロープ（`{ probesRun, findings }`）を受け取るには `--json` を追加します。
インストール済みプラグイン インデックスが欠落しているか不正な形式の場合でも、JSON モードは
`plugin.index_unavailable` エラー検出結果を含むそのエンベロープを出力します。

注:

- Nix モード (`OPENCLAW_NIX_MODE=1`) では、読み取り専用の doctor チェックは引き続き動作しますが、`openclaw.json` が不変のため、`doctor --fix`、`doctor --repair`、`doctor --yes`、`doctor --generate-gateway-token` は無効化されます。代わりに、このインストールの Nix ソースを編集してください。nix-openclaw では、エージェント優先の [クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start) を使用します。
- インタラクティブなプロンプト (keychain/OAuth 修正など) は、stdin が TTY で、かつ `--non-interactive` が設定されて**いない**場合にのみ実行されます。ヘッドレス実行 (cron、Telegram、端末なし) ではプロンプトがスキップされます。
- パフォーマンス: 非インタラクティブな `doctor` 実行では、ヘッドレスのヘルスチェックを高速に保つため、積極的な Plugin 読み込みをスキップします。インタラクティブな doctor セッションでは、従来のヘルスおよび修復フローに必要な Plugin サーフェスを引き続き読み込みます。
- `--lint` は `--non-interactive` より厳格です。常に読み取り専用で、プロンプトを表示せず、安全なマイグレーションも適用しません。doctor に変更を加えさせたい場合は、`doctor --fix` または `doctor --repair` を実行してください。
- デフォルトでは、doctor はシークレットのチェック中に `exec` SecretRefs を実行しません。設定済みのシークレットリゾルバーを doctor に意図的に実行させたい場合にのみ、`openclaw doctor --allow-exec` または `openclaw doctor --lint --allow-exec` を使用してください。
- `--fix` (`--repair` のエイリアス) はバックアップを `~/.openclaw/openclaw.json.bak` に書き込み、不明な設定キーを削除して、各削除を一覧表示します。
- 最新化されたヘルスチェックは、`doctor --fix` 用の `repair()` パスを公開できます。公開していないチェックは、既存の doctor 修復フローを引き続き使用します。
- `doctor --fix --non-interactive` は、欠落または古い Gateway サービス定義を報告しますが、更新修復モード外ではそれらをインストールまたは書き換えません。サービスが欠落している場合は `openclaw gateway install` を実行し、ランチャーを意図的に置き換えたい場合は `openclaw gateway install --force` を実行してください。
- 状態整合性チェックは、sessions ディレクトリ内の孤立したトランスクリプトファイルを検出するようになりました。それらを `.deleted.<timestamp>` としてアーカイブするにはインタラクティブな確認が必要です。`--fix`、`--yes`、ヘッドレス実行ではそのまま残されます。
- doctor は `~/.openclaw/cron/jobs.json` (または `cron.store`) もスキャンし、従来の cron ジョブ形状を検出して、正規の行を SQLite にインポートする前に書き換えます。
- doctor は、明示的な `payload.model` オーバーライドを持つ cron ジョブを報告します。これには、プロバイダーナamespace の数と `agents.defaults.model` との不一致が含まれるため、デフォルトモデルを継承しないスケジュール済みジョブが、認証または請求の調査中に可視化されます。
- Linux では、ユーザーの crontab が従来の `~/.openclaw/bin/ensure-whatsapp.sh` をまだ実行している場合、doctor が警告します。このスクリプトは現在メンテナンスされておらず、cron に systemd ユーザーバス環境がない場合に WhatsApp Gateway の停止を誤ってログに記録する可能性があります。
- WhatsApp が有効な場合、doctor はローカルの `openclaw-tui` クライアントがまだ実行中で、劣化した Gateway イベントループがないか確認します。`doctor --fix` は検証済みのローカル TUI クライアントのみを停止するため、WhatsApp の返信が古い TUI 更新ループの後ろにキューされることはありません。
- doctor は、プライマリモデル、フォールバック、画像/動画生成モデル、Heartbeat/サブエージェント/Compaction オーバーライド、フック、チャンネルモデルオーバーライド、古いセッションルートピン全体で、従来の `openai-codex/*` モデル参照を正規の `openai/*` 参照に書き換えます。`--fix` は、従来の `openai-codex:*` 認証プロファイルと `auth.order.openai-codex` エントリも `openai:*` に移行し、Codex intent をプロバイダー/モデルスコープの `agentRuntime.id: "codex"` エントリに移動し、古いエージェント全体/セッションランタイムピンを削除し、修復された OpenAI エージェント参照を直接の OpenAI API キー認証ではなく Codex 認証ルーティングに保持します。
- doctor は、古い OpenClaw バージョンで作成された従来の Plugin 依存関係ステージング状態をクリーンアップし、ホスト `openclaw` パッケージを peer dependency として宣言している managed npm Plugin 向けに再リンクします。また、`plugins.entries`、設定済みチャンネル、設定済みプロバイダー/検索設定、設定済みエージェントランタイムなど、設定から参照されている欠落したダウンロード可能 Plugin も修復します。パッケージ更新中、doctor はパッケージの入れ替えが完了するまでパッケージマネージャー Plugin 修復をスキップします。設定済み Plugin にまだ復旧が必要な場合は、その後 `openclaw doctor --fix` を再実行してください。ダウンロードに失敗した場合、doctor はインストールエラーを報告し、次回の修復試行のために設定済み Plugin エントリを保持します。
- doctor は、Plugin 検出が正常な場合、`plugins.allow`/`plugins.deny`/`plugins.entries` から欠落した Plugin ID を削除し、一致する宙ぶらりんのチャンネル設定、Heartbeat ターゲット、チャンネルモデルオーバーライドも削除することで、古い Plugin 設定を修復します。
- doctor は、影響を受ける `plugins.entries.<id>` エントリを無効化し、その無効な `config` ペイロードを削除することで、無効な Plugin 設定を隔離します。Gateway 起動時には、その不正な Plugin だけがすでにスキップされるため、他の Plugin とチャンネルは実行を継続できます。
- 別のスーパーバイザーが Gateway ライフサイクルを所有している場合は、`OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定します。doctor は Gateway/サービスのヘルスを引き続き報告し、サービス以外の修復を適用しますが、サービスのインストール/起動/再起動/ブートストラップおよび従来のサービスクリーンアップはスキップします。
- Linux では、doctor は非アクティブな追加の Gateway 風 systemd ユニットを無視し、修復中に実行中の systemd Gateway サービスのコマンド/エントリポイントメタデータを書き換えません。アクティブなランチャーを意図的に置き換えたい場合は、先にサービスを停止するか、`openclaw gateway install --force` を使用してください。
- doctor は、従来のフラットな Talk 設定 (`talk.voiceId`、`talk.modelId` など) を `talk.provider` + `talk.providers.<provider>` に自動移行します。
- `doctor --fix` の繰り返し実行では、唯一の違いがオブジェクトキーの順序だけである場合、Talk 正規化を報告/適用しなくなりました。
- doctor にはメモリ検索の準備状況チェックが含まれ、埋め込み認証情報が欠落している場合に `openclaw configure --section model` を推奨できます。
- doctor は、コマンド所有者が設定されていない場合に警告します。コマンド所有者とは、所有者専用コマンドの実行と危険な操作の承認を許可された人間のオペレーターアカウントです。DM ペアリングは、誰かがボットと会話できるようにするだけです。最初の所有者ブートストラップが存在する前に送信者を承認した場合は、`commands.ownerAllowFrom` を明示的に設定してください。
- Codex モードのエージェントが設定され、個人用 Codex CLI アセットがオペレーターの Codex ホームに存在する場合、doctor は情報メモを報告します。ローカル Codex app-server の起動では、エージェントごとに分離されたホームを使用するため、必要に応じて先に Codex Plugin をインストールし、その後 `openclaw migrate plan codex` を使用して、意図的に昇格すべきアセットのインベントリを作成してください。
- doctor は、廃止された `plugins.entries.codex.config.codexDynamicToolsProfile` を削除します。Codex app-server は常に Codex ネイティブのワークスペースツールをネイティブのまま保持します。
- doctor は、デフォルトエージェントに許可された Skills が、bin、環境変数、設定、または OS 要件の欠落により、現在のランタイム環境で利用できない場合に警告します。`doctor --fix` は、`skills.entries.<skill>.enabled=false` でそれらの利用不能な Skills を無効化できます。Skills を有効なままにしたい場合は、代わりに欠落している要件をインストール/設定してください。
- サンドボックスモードが有効で Docker が利用できない場合、doctor は修復方法 (`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`) を含む高シグナルな警告を報告します。
- 従来のサンドボックスレジストリファイルまたはシャードディレクトリが存在する場合 (`~/.openclaw/sandbox/containers.json`、`~/.openclaw/sandbox/browsers.json`、`~/.openclaw/sandbox/containers/`、または `~/.openclaw/sandbox/browsers/`)、doctor はそれらを報告します。`openclaw doctor --fix` は有効なエントリを SQLite に移行し、無効な従来ファイルを隔離します。
- `gateway.auth.token`/`gateway.auth.password` が SecretRef 管理で、現在のコマンドパスで利用できない場合、doctor は読み取り専用の警告を報告し、平文のフォールバック認証情報を書き込みません。exec ベースの SecretRefs については、`--allow-exec` が指定されていない限り、doctor は実行をスキップします。
- 修正パスでチャンネル SecretRef の検査に失敗した場合、doctor は早期終了せず、処理を継続して警告を報告します。
- 状態ディレクトリのマイグレーション後、doctor プロセスで `TELEGRAM_BOT_TOKEN` または `DISCORD_BOT_TOKEN` が利用できず、有効なデフォルト Telegram または Discord アカウントが環境変数フォールバックに依存している場合、doctor は警告します。
- Telegram `allowFrom` ユーザー名の自動解決 (`doctor --fix`) には、現在のコマンドパスで解決可能な Telegram トークンが必要です。トークン検査が利用できない場合、doctor は警告を報告し、そのパスでは自動解決をスキップします。

## macOS: `launchctl` 環境変数オーバーライド

以前に `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (または `...PASSWORD`) を実行していた場合、その値は設定ファイルを上書きし、永続的な「unauthorized」エラーを引き起こす可能性があります。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway doctor](/ja-JP/gateway/doctor)
