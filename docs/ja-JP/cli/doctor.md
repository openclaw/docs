---
read_when:
    - 接続/認証の問題があり、ガイド付きの修正を行いたい
    - 更新後に健全性チェックをしたい場合
summary: '`openclaw doctor` の CLI リファレンス（ヘルスチェック + ガイド付き修復）'
title: 診断
x-i18n:
    generated_at: "2026-05-02T20:43:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: c64cefee8f36b38657b72912271e3734411870376d2bd5a374d23a77a080035d
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway とチャンネルのヘルスチェックとクイック修正。

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
- `--yes`: 確認なしでデフォルトを受け入れる
- `--repair`: 確認なしで推奨される非サービス修復を適用する。Gateway サービスのインストールと書き換えには、引き続き対話的な確認または明示的な Gateway コマンドが必要
- `--fix`: `--repair` のエイリアス
- `--force`: 必要に応じてカスタムサービス設定の上書きを含む、積極的な修復を適用する
- `--non-interactive`: プロンプトなしで実行する。安全な移行と非サービス修復のみ
- `--generate-gateway-token`: Gateway トークンを生成して設定する
- `--deep`: 追加の Gateway インストールをシステムサービスからスキャンする

注記:

- 対話的プロンプト（keychain/OAuth 修正など）は、stdin が TTY であり、`--non-interactive` が設定されて**いない**場合にのみ実行される。ヘッドレス実行（cron、Telegram、端末なし）ではプロンプトはスキップされる。
- パフォーマンス: 非対話型の `doctor` 実行では、ヘッドレスヘルスチェックを高速に保つため、積極的な Plugin 読み込みをスキップする。対話型セッションでは、チェックに Plugin の寄与が必要な場合は引き続き Plugin を完全に読み込む。
- `--fix`（`--repair` のエイリアス）は `~/.openclaw/openclaw.json.bak` にバックアップを書き込み、不明な設定キーを削除し、各削除を一覧表示する。
- `doctor --fix --non-interactive` は、Gateway サービス定義の欠落または古さを報告するが、更新修復モード以外ではそれらをインストールまたは書き換えない。サービスが欠落している場合は `openclaw gateway install` を実行し、ランチャーを意図的に置き換えたい場合は `openclaw gateway install --force` を実行する。
- 状態の整合性チェックは、セッションディレクトリ内の孤立したトランスクリプトファイルを検出するようになった。それらを `.deleted.<timestamp>` としてアーカイブするには対話的な確認が必要で、`--fix`、`--yes`、ヘッドレス実行ではそのまま残す。
- Doctor は `~/.openclaw/cron/jobs.json`（または `cron.store`）もスキャンして、レガシーな Cron ジョブ形状を検出し、スケジューラーが実行時に自動正規化する前にその場で書き換えることができる。
- Linux では、ユーザーの crontab がまだレガシーな `~/.openclaw/bin/ensure-whatsapp.sh` を実行している場合、doctor は警告する。このスクリプトは現在メンテナンスされておらず、cron に systemd ユーザーバス環境がない場合に WhatsApp Gateway 障害を誤ってログ出力する可能性がある。
- Doctor は、古い OpenClaw バージョンによって作成されたレガシーな Plugin 依存関係ステージング状態をクリーンアップする。また、レジストリが解決できる場合は、設定済みだが欠落しているダウンロード可能 Plugin を修復し、2026.5.2 の doctor パスでは、そのリリースで設定を変更済みとしてマークする前に、古い設定がすでに使用しているダウンロード可能 Plugin を自動的にインストールする。
- Doctor は、Plugin 検出が正常な場合、`plugins.allow`/`plugins.entries` から欠落している Plugin ID を削除し、一致する未解決のチャンネル設定、Heartbeat ターゲット、チャンネルモデルオーバーライドも削除して、古い Plugin 設定を修復する。
- Doctor は、影響を受けた `plugins.entries.<id>` エントリを無効化し、その無効な `config` ペイロードを削除することで、無効な Plugin 設定を隔離する。Gateway 起動時には、その不正な Plugin だけがすでにスキップされるため、他の Plugin とチャンネルは実行を継続できる。
- 別のスーパーバイザーが Gateway ライフサイクルを所有している場合は、`OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定する。Doctor は引き続き Gateway/サービスの健全性を報告し、非サービス修復を適用するが、サービスのインストール/開始/再起動/ブートストラップとレガシーサービスのクリーンアップはスキップする。
- Linux では、doctor は非アクティブな追加の Gateway 風 systemd ユニットを無視し、修復中に実行中の systemd Gateway サービスのコマンド/エントリポイントメタデータを書き換えない。アクティブなランチャーを意図的に置き換えたい場合は、先にサービスを停止するか、`openclaw gateway install --force` を使用する。
- Doctor は、レガシーなフラット Talk 設定（`talk.voiceId`、`talk.modelId` など）を `talk.provider` + `talk.providers.<provider>` に自動移行する。
- `doctor --fix` を繰り返し実行しても、差分がオブジェクトキーの順序だけの場合、Talk 正規化を報告/適用しなくなった。
- Doctor にはメモリ検索の準備状況チェックが含まれ、埋め込み認証情報が欠落している場合は `openclaw configure --section model` を推奨できる。
- Doctor は、コマンド所有者が設定されていない場合に警告する。コマンド所有者とは、所有者専用コマンドを実行し、危険な操作を承認できる人間のオペレーターアカウントである。DM ペアリングは、誰かがボットと会話できるようにするだけであり、最初の所有者ブートストラップが存在する前に送信者を承認していた場合は、`commands.ownerAllowFrom` を明示的に設定する。
- Doctor は、Codex モードエージェントが設定されており、オペレーターの Codex ホームに個人用 Codex CLI アセットが存在する場合に警告する。ローカル Codex アプリサーバー起動では、エージェントごとに隔離されたホームを使用するため、意図的に昇格すべきアセットを棚卸しするには `openclaw migrate codex --dry-run` を使用する。
- Doctor は、デフォルトエージェントに許可された Skills が、bin、env var、config、または OS 要件の欠落により現在のランタイム環境で利用できない場合に警告する。`doctor --fix` は、それらの利用不可 Skills を `skills.entries.<skill>.enabled=false` で無効化できる。Skill をアクティブなままにしたい場合は、代わりに欠落している要件をインストール/設定する。
- サンドボックスモードが有効だが Docker が利用できない場合、doctor は修復方法（`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`）を含む重要度の高い警告を報告する。
- `gateway.auth.token`/`gateway.auth.password` が SecretRef 管理であり、現在のコマンドパスで利用できない場合、doctor は読み取り専用の警告を報告し、平文のフォールバック認証情報を書き込まない。
- 修正パスでチャンネル SecretRef 検査が失敗した場合、doctor は早期終了せず、処理を続行して警告を報告する。
- 状態ディレクトリ移行後、doctor は有効化されたデフォルトの Telegram または Discord アカウントが env フォールバックに依存しており、`TELEGRAM_BOT_TOKEN` または `DISCORD_BOT_TOKEN` が doctor プロセスから利用できない場合に警告する。
- Telegram の `allowFrom` ユーザー名自動解決（`doctor --fix`）には、現在のコマンドパスで解決可能な Telegram トークンが必要である。トークン検査を利用できない場合、doctor は警告を報告し、そのパスでは自動解決をスキップする。

## macOS: `launchctl` env オーバーライド

以前に `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（または `...PASSWORD`）を実行していた場合、その値は設定ファイルを上書きし、永続的な「unauthorized」エラーを引き起こす可能性がある。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway doctor](/ja-JP/gateway/doctor)
