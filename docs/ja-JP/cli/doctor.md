---
read_when:
    - 接続/認証の問題があり、ガイド付きの修正が必要な場合
    - 更新後に簡単な確認をしたい場合
summary: '`openclaw doctor` の CLI リファレンス（ヘルスチェック + ガイド付き修復）'
title: 診断
x-i18n:
    generated_at: "2026-05-02T04:51:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: e861fa105737088eafa55815faa1a37ccd61e154e8dbe811cf4b988bc1c571e5
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway とチャンネルのヘルスチェック + クイック修正。

関連:

- トラブルシューティング: [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- セキュリティ監査: [セキュリティ](/ja-JP/gateway/security)

## 例

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## オプション

- `--no-workspace-suggestions`: ワークスペースメモリ/検索の提案を無効化する
- `--yes`: プロンプトなしで既定値を受け入れる
- `--repair`: 推奨される非サービス修復をプロンプトなしで適用する。Gateway サービスのインストールと書き換えには、引き続き対話的な確認または明示的な Gateway コマンドが必要
- `--fix`: `--repair` のエイリアス
- `--force`: 必要に応じてカスタムサービス設定の上書きを含む、強力な修復を適用する
- `--non-interactive`: プロンプトなしで実行する。安全なマイグレーションと非サービス修復のみ
- `--generate-gateway-token`: Gateway トークンを生成して設定する
- `--deep`: 追加の Gateway インストールがないかシステムサービスをスキャンする

注記:

- 対話型プロンプト（keychain/OAuth 修正など）は、stdin が TTY であり、かつ `--non-interactive` が設定されて**いない**場合にのみ実行されます。ヘッドレス実行（cron、Telegram、ターミナルなし）ではプロンプトをスキップします。
- パフォーマンス: 非対話型の `doctor` 実行では、ヘッドレスのヘルスチェックを高速に保つため、先行的な Plugin 読み込みをスキップします。対話型セッションでは、チェックで Plugin の寄与が必要な場合、引き続き Plugin を完全に読み込みます。
- `--fix`（`--repair` のエイリアス）はバックアップを `~/.openclaw/openclaw.json.bak` に書き込み、不明な設定キーを削除して、削除ごとに一覧表示します。
- `doctor --fix --non-interactive` は、Gateway サービス定義の欠落または古さを報告しますが、更新修復モード以外ではそれらをインストールまたは書き換えません。サービスがない場合は `openclaw gateway install` を実行し、ランチャーを意図的に置き換えたい場合は `openclaw gateway install --force` を実行します。
- 状態整合性チェックは、sessions ディレクトリ内の孤立した transcript ファイルを検出するようになりました。それらを `.deleted.<timestamp>` としてアーカイブするには対話的な確認が必要です。`--fix`、`--yes`、およびヘッドレス実行では、そのまま残します。
- Doctor は、`~/.openclaw/cron/jobs.json`（または `cron.store`）もスキャンしてレガシー Cron ジョブ形状を検出し、スケジューラが実行時に自動正規化する前に、その場で書き換えることができます。
- Linux では、ユーザーの crontab がまだレガシーの `~/.openclaw/bin/ensure-whatsapp.sh` を実行している場合に doctor が警告します。このスクリプトはもう保守されておらず、cron に systemd ユーザーバス環境がない場合に WhatsApp Gateway の誤った障害をログ出力することがあります。
- Doctor は、古い OpenClaw バージョンによって作成されたレガシー Plugin 依存関係ステージング状態をクリーンアップします。また、レジストリで解決できる場合は、設定済みだが欠落しているダウンロード可能 Plugin も修復します。
- Plugin 検出が正常な場合、Doctor は `plugins.allow`/`plugins.entries` から欠落している Plugin ID を削除し、対応するぶら下がったチャンネル設定、Heartbeat ターゲット、チャンネルモデル上書きも削除して、古い Plugin 設定を修復します。
- Doctor は、影響を受ける `plugins.entries.<id>` エントリを無効化し、その無効な `config` ペイロードを削除することで、無効な Plugin 設定を隔離します。Gateway 起動時には、すでにその問題のある Plugin だけをスキップするため、他の Plugin とチャンネルは実行を継続できます。
- 別のスーパーバイザーが Gateway ライフサイクルを所有している場合は、`OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定します。Doctor は引き続き Gateway/サービスの健全性を報告し、非サービス修復を適用しますが、サービスのインストール/起動/再起動/bootstrap とレガシーサービスのクリーンアップをスキップします。
- Linux では、doctor は非アクティブな追加の Gateway 風 systemd ユニットを無視し、修復中に実行中の systemd Gateway サービスのコマンド/エントリポイントメタデータを書き換えません。アクティブなランチャーを意図的に置き換えたい場合は、まずサービスを停止するか、`openclaw gateway install --force` を使用してください。
- Doctor は、レガシーのフラットな Talk 設定（`talk.voiceId`、`talk.modelId` など）を `talk.provider` + `talk.providers.<provider>` に自動マイグレーションします。
- `doctor --fix` を繰り返し実行しても、違いがオブジェクトキー順序だけの場合は Talk 正規化を報告/適用しなくなりました。
- Doctor にはメモリ検索の準備状況チェックが含まれ、埋め込み認証情報が欠落している場合は `openclaw configure --section model` を推奨できます。
- Doctor は、コマンド所有者が設定されていない場合に警告します。コマンド所有者とは、所有者専用コマンドを実行し、危険なアクションを承認できる人間のオペレーターアカウントです。DM ペアリングは誰かが bot と会話できるようにするだけです。初回所有者 bootstrap が存在する前に送信者を承認していた場合は、`commands.ownerAllowFrom` を明示的に設定してください。
- Doctor は、Codex モードのエージェントが設定されていて、オペレーターの Codex ホームに個人用 Codex CLI アセットが存在する場合に警告します。ローカルの Codex app-server 起動では、エージェントごとに分離されたホームを使用するため、意図的に昇格すべきアセットを棚卸しするには `openclaw migrate codex --dry-run` を使用してください。
- sandbox モードが有効だが Docker を利用できない場合、doctor は修復方法（`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`）を含む高シグナルの警告を報告します。
- `gateway.auth.token`/`gateway.auth.password` が SecretRef 管理であり、現在のコマンドパスで利用できない場合、doctor は読み取り専用の警告を報告し、プレーンテキストのフォールバック認証情報を書き込みません。
- 修正パスでチャンネル SecretRef 検査に失敗した場合、doctor は早期終了せずに続行し、警告を報告します。
- 状態ディレクトリのマイグレーション後、有効化された既定の Telegram または Discord アカウントが env フォールバックに依存しており、`TELEGRAM_BOT_TOKEN` または `DISCORD_BOT_TOKEN` を doctor プロセスが利用できない場合、doctor は警告します。
- Telegram `allowFrom` ユーザー名の自動解決（`doctor --fix`）には、現在のコマンドパスで解決可能な Telegram トークンが必要です。トークン検査を利用できない場合、doctor は警告を報告し、その実行では自動解決をスキップします。

## macOS: `launchctl` env 上書き

以前に `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（または `...PASSWORD`）を実行していた場合、その値が設定ファイルを上書きし、永続的な「unauthorized」エラーの原因になることがあります。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway doctor](/ja-JP/gateway/doctor)
