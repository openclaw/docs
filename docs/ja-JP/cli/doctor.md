---
read_when:
    - 接続や認証の問題があり、ガイド付きの修正を利用したい場合
    - 更新後に健全性チェックをしたい場合
summary: '`openclaw doctor` の CLI リファレンス (ヘルスチェック + ガイド付き修復)'
title: 診断
x-i18n:
    generated_at: "2026-05-04T02:22:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd7fb09d373c313e4be45ad9e3b19ceb187a5787ef3e70fcd2b1f1f01b50c905
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway とチャンネルのヘルスチェック + クイック修復。

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

- `--no-workspace-suggestions`: ワークスペースのメモリ/検索候補を無効にする
- `--yes`: プロンプトなしでデフォルトを受け入れる
- `--repair`: プロンプトなしで推奨される非サービス修復を適用する。Gateway サービスのインストールと書き換えには、引き続き対話的な確認または明示的な Gateway コマンドが必要
- `--fix`: `--repair` の別名
- `--force`: 必要に応じてカスタムサービス設定の上書きを含む、強力な修復を適用する
- `--non-interactive`: プロンプトなしで実行する。安全な移行と非サービス修復のみ
- `--generate-gateway-token`: Gateway トークンを生成して設定する
- `--deep`: 追加の Gateway インストールがないかシステムサービスをスキャンする

注記:

- 対話的プロンプト（keychain/OAuth 修正など）は、stdin が TTY で、かつ `--non-interactive` が設定されて**いない**場合にのみ実行されます。ヘッドレス実行（cron、Telegram、ターミナルなし）ではプロンプトはスキップされます。
- パフォーマンス: 非対話型の `doctor` 実行では、ヘッドレスのヘルスチェックを高速に保つため、積極的な Plugin 読み込みをスキップします。対話型セッションでは、チェックで Plugin の寄与が必要な場合、引き続き Plugin を完全に読み込みます。
- `--fix`（`--repair` の別名）はバックアップを `~/.openclaw/openclaw.json.bak` に書き込み、不明な設定キーを削除して、各削除を一覧表示します。
- `doctor --fix --non-interactive` は、Gateway サービス定義の欠落または古さを報告しますが、更新修復モード以外ではインストールや書き換えは行いません。サービスがない場合は `openclaw gateway install` を実行し、ランチャーを意図的に置き換えたい場合は `openclaw gateway install --force` を実行します。
- 状態整合性チェックは、sessions ディレクトリ内の孤立した transcript ファイルを検出するようになりました。それらを `.deleted.<timestamp>` としてアーカイブするには対話的な確認が必要です。`--fix`、`--yes`、ヘッドレス実行ではそのまま残します。
- Doctor は `~/.openclaw/cron/jobs.json`（または `cron.store`）もスキャンして、レガシーな Cron ジョブ形状を検出し、スケジューラが実行時に自動正規化する前にその場で書き換えることができます。
- Linux では、ユーザーの crontab がまだレガシーな `~/.openclaw/bin/ensure-whatsapp.sh` を実行している場合、doctor が警告します。このスクリプトは保守されておらず、cron に systemd ユーザーバス環境がない場合に誤った WhatsApp Gateway 障害をログに記録する可能性があります。
- Doctor は、古い OpenClaw バージョンで作成されたレガシー Plugin 依存関係のステージング状態をクリーンアップします。また、レジストリで解決できる場合は、設定済みで欠落しているダウンロード可能 Plugin も修復します。2026.5.2 の doctor パスでは、そのリリース用に設定を変更済みとしてマークする前に、古い設定ですでに使用されているダウンロード可能 Plugin を自動的にインストールします。ダウンロードに失敗した場合、doctor はインストールエラーを報告し、次回の修復試行のために設定済み Plugin エントリを保持します。
- Doctor は、Plugin 検出が正常な場合に、欠落している Plugin ID を `plugins.allow`/`plugins.entries` から削除し、対応する不要なチャンネル設定、Heartbeat ターゲット、チャンネルモデル上書きも削除して、古い Plugin 設定を修復します。
- Doctor は、影響を受ける `plugins.entries.<id>` エントリを無効化し、その無効な `config` ペイロードを削除することで、無効な Plugin 設定を隔離します。Gateway 起動時はすでに、その不正な Plugin だけをスキップするため、他の Plugin とチャンネルは実行を継続できます。
- 別のスーパーバイザーが Gateway ライフサイクルを所有している場合は、`OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定します。Doctor は引き続き Gateway/サービスのヘルスを報告し、非サービス修復を適用しますが、サービスのインストール/開始/再起動/ブートストラップとレガシーサービスのクリーンアップはスキップします。
- Linux では、doctor は非アクティブな追加の Gateway 風 systemd ユニットを無視し、修復中に実行中の systemd Gateway サービスのコマンド/エントリポイントメタデータを書き換えません。アクティブなランチャーを意図的に置き換えたい場合は、先にサービスを停止するか、`openclaw gateway install --force` を使用します。
- Doctor は、レガシーなフラット Talk 設定（`talk.voiceId`、`talk.modelId` など）を `talk.provider` + `talk.providers.<provider>` に自動移行します。
- `doctor --fix` の繰り返し実行では、差分がオブジェクトキー順序だけの場合、Talk 正規化の報告/適用を行わなくなりました。
- Doctor にはメモリ検索の準備状況チェックが含まれ、埋め込み認証情報が欠落している場合に `openclaw configure --section model` を推奨できます。
- Doctor は、コマンド所有者が設定されていない場合に警告します。コマンド所有者とは、所有者専用コマンドの実行と危険な操作の承認を許可された人間のオペレーターアカウントです。DM ペアリングは誰かが bot と会話できるようにするだけです。最初の所有者ブートストラップが存在する前に送信者を承認していた場合は、`commands.ownerAllowFrom` を明示的に設定してください。
- Doctor は、Codex モードのエージェントが設定され、オペレーターの Codex ホームに個人用 Codex CLI アセットが存在する場合に警告します。ローカルの Codex app-server 起動では、エージェントごとに分離されたホームが使用されるため、意図的に昇格すべきアセットを棚卸しするには `openclaw migrate codex --dry-run` を使用してください。
- Doctor は、デフォルトエージェントに許可された Skills が、bin、環境変数、設定、OS 要件の不足により現在の実行環境で利用できない場合に警告します。`doctor --fix` は、それらの利用できない Skills を `skills.entries.<skill>.enabled=false` で無効化できます。Skills を有効なままにしたい場合は、代わりに不足している要件をインストール/設定してください。
- サンドボックスモードが有効だが Docker が利用できない場合、doctor は修復方法（`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`）を含む高シグナルな警告を報告します。
- レガシーなサンドボックスレジストリファイル（`~/.openclaw/sandbox/containers.json` または `~/.openclaw/sandbox/browsers.json`）が存在する場合、doctor はそれらを報告します。`openclaw doctor --fix` は、有効なエントリをシャード化されたレジストリディレクトリに移行し、無効なレガシーファイルを隔離します。
- `gateway.auth.token`/`gateway.auth.password` が SecretRef 管理で、現在のコマンドパスで利用できない場合、doctor は読み取り専用の警告を報告し、プレーンテキストのフォールバック認証情報を書き込みません。
- 修復パスでチャンネル SecretRef 検査が失敗した場合、doctor は早期終了せずに続行し、警告を報告します。
- 状態ディレクトリ移行後、doctor プロセスから `TELEGRAM_BOT_TOKEN` または `DISCORD_BOT_TOKEN` が利用できず、有効化されたデフォルトの Telegram または Discord アカウントが環境変数フォールバックに依存している場合、doctor は警告します。
- Telegram `allowFrom` ユーザー名の自動解決（`doctor --fix`）には、現在のコマンドパスで解決可能な Telegram トークンが必要です。トークン検査を利用できない場合、doctor は警告を報告し、そのパスでは自動解決をスキップします。

## macOS: `launchctl` 環境上書き

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
