---
read_when:
    - 接続/認証の問題があり、ガイド付きの修正を行いたい
    - 更新したので健全性チェックをしたい
summary: '`openclaw doctor` の CLI リファレンス（ヘルスチェック + ガイド付き修復）'
title: 診断
x-i18n:
    generated_at: "2026-07-05T11:11:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f79924f095b94ed839fa1088908c89603396fe06ea28becb989069f6b5d113bf
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway、チャネル、プラグイン、Skills、モデルルーティング、ローカル状態、設定マイグレーションのヘルスチェックとクイック修正。何かが期待どおりに動作せず、何が問題かを 1 つのコマンドで説明したいときに使用します。

関連:

- トラブルシューティング: [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- セキュリティ監査: [セキュリティ](/ja-JP/gateway/security)

## 動作モード

| 動作モード | コマンド                 | 動作                                                                        |
| ------- | ------------------------ | --------------------------------------------------------------------------- |
| 検査 | `openclaw doctor`        | 人間向けのチェックとガイド付きプロンプト。                                   |
| 修復  | `openclaw doctor --fix`  | サポートされている修復を適用し、非対話修復が安全な場合を除いて確認を求めます。 |
| Lint    | `openclaw doctor --lint` | CI、事前確認、レビューゲート向けの読み取り専用の構造化された検出結果。          |

自動化で安定した結果が必要な場合は `--lint` を優先してください。人間のオペレーターが doctor に設定または状態を編集させたい場合は `--fix` を優先してください。

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

チャネル固有の権限には、`doctor` ではなくチャネルプローブを使用してください:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities` は、特定のチャネルターゲットに対するボットの実効権限を報告します。`channels status --probe` は、設定済みのすべてのチャネルと音声自動参加ターゲットを監査します。

## オプション

| オプション                   | 効果                                                                                                                                                                                    |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions` | ワークスペースメモリ/検索の提案を無効にします。                                                                                                                                          |
| `--yes`                      | プロンプトなしでデフォルトを受け入れます。                                                                                                                                              |
| `--repair` / `--fix`         | 推奨される非サービス修復をプロンプトなしで適用します（`--fix` は別名です）。Gateway サービスのインストール/書き換えには、引き続き対話的な確認または明示的な `gateway` コマンドが必要です。 |
| `--force`                    | カスタムサービス設定の上書きを含む、積極的な修復を適用します。                                                                                                                          |
| `--non-interactive`          | プロンプトなしで実行します。安全なマイグレーションと非サービス修復のみです。                                                                                                            |
| `--generate-gateway-token`   | Gateway トークンを生成して設定します。                                                                                                                                                  |
| `--allow-exec`               | シークレット検証中に、設定済みの `exec` SecretRefs を doctor が実行できるようにします。                                                                                                |
| `--deep`                     | 追加の Gateway インストールがないかシステムサービスをスキャンし、最近の Gateway supervisor 再起動ハンドオフを報告します。                                                               |
| `--lint`                     | 読み取り専用モードでモダン化されたヘルスチェックを実行し、診断検出結果を出力します。                                                                                                    |
| `--post-upgrade`             | アップグレード後のプラグイン互換性プローブを実行します。検出結果は stdout に出力されます。error レベルの検出結果が存在する場合、終了コードは 1 です。                                      |
| `--json`                     | `--lint` と併用: JSON 検出結果。`--post-upgrade` と併用: 機械可読エンベロープ `{ probesRun, findings }`。                                                                               |
| `--severity-min <level>`     | `--lint` と併用: `info`、`warning`、または `error` 未満の検出結果を除外します。                                                                                                         |
| `--all`                      | `--lint` と併用: デフォルトセットから除外されるオプトインチェックを含め、登録済みのすべてのチェックを実行します。                                                                        |
| `--skip <id>`                | `--lint` と併用: チェック ID をスキップします。繰り返し指定できます。                                                                                                                   |
| `--only <id>`                | `--lint` と併用: 指定したチェック ID のみを実行します。繰り返し指定できます。                                                                                                           |

`--json`、`--severity-min`、`--all`、`--only`、`--skip` は `--lint` と組み合わせた場合のみ受け付けられます。

## Lint モード

`openclaw doctor --lint` は読み取り専用です。プロンプト、修復、設定/状態の書き換えはありません。

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

JSON 出力はスクリプト用のサーフェスです:

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

終了コード:

| コード | 意味                                                       |
| ---- | ------------------------------------------------------------- |
| `0`  | 選択された重大度しきい値以上の検出結果はありません。      |
| `1`  | 少なくとも 1 つの検出結果が選択されたしきい値を満たしています。            |
| `2`  | lint 検出結果を生成する前にコマンド/ランタイム障害が発生しました。 |

`--severity-min` は、表示される検出結果と終了しきい値の両方を制御します。`openclaw doctor --lint --severity-min error` は、低い重大度の `info`/`warning` 検出結果が存在していても、何も表示せず `0` で終了する場合があります。

`--all` は、重大度フィルタリングの前にどのチェックを選択するかを制御します。デフォルトの lint 実行では、深いチェック、履歴的なチェック、または修復可能なレガシー残留物を検出しやすいチェックは除外されます。完全な一覧には `--all` を使用してください。`--only <id>` は最も精密なセレクターで、登録済みの任意のチェックを ID で実行できます。

## 構造化ヘルスチェック

モダンな doctor チェックは、小さく分割された契約を使用します:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` は `doctor --lint` を支えます。`repair()` は任意で、`doctor --fix` / `doctor --repair` の下でのみ実行されます。この形へ移行していないチェックは、引き続きレガシー doctor 貢献フローを使用します。

修復コンテキストは `dryRun`/`diff` リクエストを運ぶことができます。修復結果は構造化された `diffs`（設定/ファイル編集）と `effects`（サービス、プロセス、パッケージ、状態、その他の副作用）を返せるため、変換済みチェックは変更計画を `detect()` に移さずに `doctor --fix --dry-run` へ向けて拡張できます。

`repair()` は `status: "repaired" | "skipped" | "failed"` を報告します（status が省略された場合は `repaired` を意味します）。修復が `skipped` または `failed` を返した場合、doctor は理由を報告し、そのチェックの検証をスキップします。修復に成功した後、doctor は修復された検出結果にスコープして `detect()` を再実行します。検出結果がまだ存在する場合、doctor は変更を完了として扱うのではなく、修復警告を報告します。

検出結果には以下が含まれます:

| フィールド        | 目的                                                |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | skip/only フィルターと CI 許可リスト用の安定した ID。     |
| `severity`        | `info`、`warning`、または `error`。                         |
| `message`         | 人間が読める問題文。                      |
| `path`            | 利用可能な場合の設定、ファイル、または論理パス。          |
| `line` / `column` | 利用可能な場合のソース位置。                        |
| `ocPath`          | チェックが指し示せる場合の正確な `oc://` アドレス。 |
| `fixHint`         | 推奨されるオペレーター操作または修復サマリー。           |

モダン化されたコア doctor チェックは、人間向けの `doctor` / `doctor --fix` 動作を所有する順序付き doctor 貢献に紐付いたままです。共有の構造化ヘルスレジストリが拡張ポイントです。バンドル済みおよびプラグイン支援のチェックは、所有パッケージがアクティブなコマンドパスに登録されると、コア doctor チェックの後に実行されます。`openclaw/plugin-sdk/health` は、プラグイン作者向けに同じ契約を公開します。

## チェック選択

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` と `--skip` は完全なチェック ID を受け取り、繰り返し指定できます。`--only` ID が登録されていない場合、その ID ではチェックは実行されません。出力の `checksRun`/`checksSkipped` を使用して、絞り込んだゲートが期待するチェックを選択していることを確認してください。

## アップグレード後モード

`openclaw doctor --post-upgrade` は、ビルドまたはアップグレード後に連鎖させるためのプラグイン互換性プローブを実行します。検出結果は stdout に出力されます。`level: "error"` の検出結果がある場合、終了コードは 1 です。CI、コミュニティの `fork-upgrade` skill、その他のアップグレード後スモークツールに適した機械可読エンベロープ（`{ probesRun, findings }`）には `--json` を追加してください。インストール済みプラグインインデックスが存在しない、または形式が不正な場合でも、JSON モードは `plugin.index_unavailable` error 検出結果を含むエンベロープを出力します。

## メモ

- Nix モード (`OPENCLAW_NIX_MODE=1`) では、読み取り専用の doctor チェックは引き続き動作しますが、`openclaw.json` がイミュータブルなため、`doctor --fix`、`doctor --repair`、`doctor --yes`、`doctor --generate-gateway-token` は無効化されます。代わりに、このインストールの Nix ソースを編集してください。nix-openclaw では、エージェント優先の [クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start) を使用します。
- 対話型プロンプト（keychain/OAuth 修正など）は、stdin が TTY で、かつ `--non-interactive` が設定されて**いない**場合にのみ実行されます。ヘッドレス実行（cron、Telegram、端末なし）ではプロンプトをスキップします。
- 非対話型の `doctor` 実行では、ヘッドレスのヘルスチェックを高速に保つため、積極的な Plugin 読み込みをスキップします。対話型セッションでは、従来のヘルス/修復フローに必要な Plugin サーフェスを引き続き読み込みます。
- `--lint` は `--non-interactive` より厳格です。常に読み取り専用で、プロンプトは出さず、安全なマイグレーションも適用しません。doctor に変更を加えさせたい場合は、`doctor --fix` または `doctor --repair` を使用します。
- Doctor はデフォルトではシークレットをチェックする際に `exec` SecretRefs を実行しません。構成済みのシークレットリゾルバーを doctor に意図的に実行させたい場合にのみ、`--allow-exec`（`--lint` の有無を問わず）を使用します。
- 設定の書き込み（`--fix` 修復を含む）は、バックアップを `~/.openclaw/openclaw.json.bak`（番号付きの `.bak.1`..`.bak.4` リング付き）へローテーションします。`--fix` は、スキーマ検証で報告された未知の設定キーも削除し、各削除を一覧表示します。ただし、更新中は、部分的に書き込まれたアップグレード状態がマイグレーション完了前に取り除かれないよう、この処理をスキップします。
- 別のスーパーバイザーが Gateway ライフサイクルを所有している場合は、`OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定します。Doctor は Gateway/サービスのヘルスを引き続き報告し、サービス以外の修復を適用しますが、サービスのインストール/開始/再起動/ブートストラップと従来サービスのクリーンアップはスキップします。
- Linux では、doctor は非アクティブな追加の Gateway 風 systemd ユニットを無視し、修復中に実行中の systemd Gateway サービスのコマンド/エントリポイントメタデータを書き換えません。先にサービスを停止するか、`openclaw gateway install --force` を使用してアクティブなランチャーを置き換えてください。
- `doctor --fix --non-interactive` は、不足または古くなった Gateway サービス定義を報告しますが、更新修復モード以外ではインストールや書き換えを行いません。サービスがない場合は `openclaw gateway install` を実行し、ランチャーを置き換える場合は `openclaw gateway install --force` を実行します。
- 状態整合性チェックは、sessions ディレクトリ内の孤立した transcript ファイルを検出します。それらを `.deleted.<timestamp>` としてアーカイブするには対話型の確認が必要です。`--fix`、`--yes`、ヘッドレス実行では、そのまま残します。
- Doctor は、従来の cron ジョブ形状を探すために `~/.openclaw/cron/jobs.json`（または `cron.store`）をスキャンし、正規行を SQLite にインポートする前に書き換えます。
- Doctor は、明示的な `payload.model` オーバーライドを持つ cron ジョブを報告します。これには provider 名前空間ごとの件数と `agents.defaults.model` との不一致が含まれるため、デフォルトモデルを継承しないスケジュール済みジョブを、認証や課金の調査中に確認できます。
- Linux では、ユーザーの crontab が未メンテナンスの従来スクリプト `~/.openclaw/bin/ensure-whatsapp.sh` をまだ実行している場合に doctor が警告します。このスクリプトは、cron に systemd user-bus 環境がないと `Gateway inactive` を誤報告する可能性があります。
- WhatsApp が有効な場合、doctor はローカルの `openclaw-tui` クライアントがまだ実行中の、劣化した Gateway イベントループをチェックします。`doctor --fix` は検証済みのローカル TUI クライアントのみを停止するため、WhatsApp の返信が古い TUI 更新ループの後ろにキューされません。
- Doctor は、プライマリモデル、フォールバック、画像/動画生成モデル、heartbeat/subagent/compaction オーバーライド、フック、チャンネルモデルオーバーライド、古いセッションルート固定にわたって、従来の `openai-codex/*` モデル参照を正規の `openai/*` 参照へ書き換えます。`--fix` は、従来の `openai-codex:*` 認証プロファイルと `auth.order.openai-codex` エントリも `openai:*` へ移行し、Codex の意図を provider/model スコープの `agentRuntime.id: "codex"` エントリへ移し、古いエージェント全体/セッションのランタイム固定を削除し、修復済みの OpenAI エージェント参照を直接の OpenAI API キー認証ではなく Codex 認証ルーティングに維持します。
- Doctor は、古い OpenClaw バージョンからの従来の Plugin 依存関係ステージング状態をクリーンアップし、peer dependency として宣言している managed npm plugins のためにホストの `openclaw` パッケージを再リンクします。また、設定（`plugins.entries`、構成済みチャンネル、構成済み provider/search 設定、構成済みエージェントランタイム）で参照されている不足したダウンロード可能 Plugin も修復します。パッケージ更新中、doctor はパッケージの入れ替えが完了するまで package-manager Plugin 修復をスキップします。構成済み Plugin の復旧がまだ必要な場合は、その後に `openclaw doctor --fix` を再実行してください。ダウンロードに失敗した場合、doctor はインストールエラーを報告し、次回の修復試行のために構成済み Plugin エントリを保持します。
- Doctor は、Plugin 検出が正常な場合に、不足している Plugin ID を `plugins.allow`/`plugins.deny`/`plugins.entries` から削除し、対応するぶら下がったチャンネル設定、heartbeat ターゲット、チャンネルモデルオーバーライドも削除して、古い Plugin 設定を修復します。
- Doctor は、影響を受けた `plugins.entries.<id>` エントリを無効化し、無効な `config` ペイロードを削除することで、無効な Plugin 設定を隔離します。Gateway 起動はすでにその不正な Plugin だけをスキップするため、他の Plugin とチャンネルは実行を継続します。
- Doctor は、廃止された `plugins.entries.codex.config.codexDynamicToolsProfile` を削除します。Codex app-server は常に Codex ネイティブの workspace tools をネイティブのまま保持します。
- Doctor は、従来のフラットな Talk 設定（`talk.voiceId`、`talk.modelId` など）を `talk.provider` + `talk.providers.<provider>` へ自動移行します。唯一の差分がオブジェクトキー順の場合、繰り返し `doctor --fix` を実行しても Talk 正規化は報告/適用されなくなりました。
- Doctor には memory-search readiness チェックが含まれており、embedding 認証情報がない場合に `openclaw configure --section model` を推奨できます。
- Doctor は、コマンド所有者が構成されていない場合に警告します。コマンド所有者は、所有者専用コマンドの実行と危険なアクションの承認を許可された人間のオペレーターアカウントです。DM ペアリングは誰かが bot と会話できるようにするだけです。first-owner bootstrap が存在する前に送信者を承認していた場合は、`commands.ownerAllowFrom` を明示的に設定してください。
- Doctor は、Codex モードのエージェントが構成されていて、オペレーターの Codex home に個人用 Codex CLI アセットが存在する場合、情報メモを報告します。ローカルの Codex app-server 起動は、エージェントごとに分離された home を使用します。必要であれば先に Codex Plugin をインストールし、その後 `openclaw migrate plan codex` を使用して、意図的に昇格すべきアセットをインベントリしてください。
- Doctor は、デフォルトエージェントに許可された skills が現在のランタイム環境で利用できない場合（不足した bins、env vars、config、または OS 要件）に警告します。`doctor --fix` は、それらの利用できない skills を `skills.entries.<skill>.enabled=false` で無効化できます。skill を有効なまま維持したい場合は、不足している要件をインストール/構成してください。
- sandbox モードが有効だが Docker が利用できない場合、doctor は修復方法（`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`）を含む高シグナルの警告を報告します。
- 従来の sandbox レジストリファイルまたは shard ディレクトリ（`~/.openclaw/sandbox/containers.json`、`~/.openclaw/sandbox/browsers.json`、`~/.openclaw/sandbox/containers/`、または `~/.openclaw/sandbox/browsers/`）が存在する場合、doctor はそれらを報告します。`--fix` は有効なエントリを SQLite へ移行し、無効な従来ファイルを隔離します。
- `gateway.auth.token`/`gateway.auth.password` が SecretRef 管理で、現在のコマンドパスで利用できない場合、doctor は読み取り専用の警告を報告し、平文のフォールバック認証情報を書き込みません。exec backed SecretRefs については、`--allow-exec` が存在しない限り doctor は実行をスキップします。
- 修正パスでチャンネル SecretRef 検査に失敗した場合、doctor は早期終了せずに続行し、警告を報告します。
- 状態ディレクトリのマイグレーション後、doctor は、有効なデフォルト Telegram または Discord アカウントが env fallback に依存していて、`TELEGRAM_BOT_TOKEN` または `DISCORD_BOT_TOKEN` が doctor プロセスで利用できない場合に警告します。
- Telegram `allowFrom` ユーザー名の自動解決（`doctor --fix`）には、現在のコマンドパスで解決可能な Telegram トークンが必要です。トークン検査が利用できない場合、doctor は警告を報告し、そのパスでの自動解決をスキップします。

## macOS: `launchctl` env オーバーライド

以前に `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（または `...PASSWORD`）を実行した場合、その値が設定ファイルをオーバーライドし、永続的な「unauthorized」エラーを引き起こす可能性があります。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway doctor](/ja-JP/gateway/doctor)
