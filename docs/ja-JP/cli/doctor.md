---
read_when:
    - 接続/認証の問題があり、ガイド付きの修正を利用したい
    - 更新後にサニティチェックしたい場合
summary: '`openclaw doctor` の CLI リファレンス（ヘルスチェック + ガイド付き修復）'
title: 診断
x-i18n:
    generated_at: "2026-05-05T01:44:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 079d7674ae2a259a0430e30e7577ac532135ad5461c57c4b3a6514a007bc9ea5
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway とチャネルのヘルスチェック + クイック修正。

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
- `--yes`: プロンプトなしでデフォルトを受け入れる
- `--repair`: プロンプトなしで推奨される非サービス修復を適用する。Gateway サービスのインストールと再書き込みには、引き続き対話的な確認または明示的な Gateway コマンドが必要
- `--fix`: `--repair` のエイリアス
- `--force`: 必要に応じてカスタムサービス設定を上書きするなど、積極的な修復を適用する
- `--non-interactive`: プロンプトなしで実行する。安全なマイグレーションと非サービス修復のみ
- `--generate-gateway-token`: Gateway トークンを生成して設定する
- `--deep`: 追加の Gateway インストールをシステムサービスでスキャンする

注記:

- 対話的プロンプト（keychain/OAuth 修正など）は、stdin が TTY であり、かつ `--non-interactive` が設定されて**いない**場合にのみ実行されます。ヘッドレス実行（cron、Telegram、端末なし）ではプロンプトをスキップします。
- パフォーマンス: 非対話的な `doctor` 実行では、ヘッドレスのヘルスチェックを高速に保つため、積極的な Plugin 読み込みをスキップします。対話的セッションでは、チェックが Plugin の寄与を必要とする場合、引き続き Plugin を完全に読み込みます。
- `--fix`（`--repair` のエイリアス）は `~/.openclaw/openclaw.json.bak` にバックアップを書き込み、不明な設定キーを削除して、各削除を一覧表示します。
- `doctor --fix --non-interactive` は、欠落または古い Gateway サービス定義を報告しますが、更新修復モード以外ではそれらをインストールまたは再書き込みしません。サービスが欠落している場合は `openclaw gateway install` を実行し、ランチャーを意図的に置き換えたい場合は `openclaw gateway install --force` を実行してください。
- 状態整合性チェックは、sessions ディレクトリ内の孤立した transcript ファイルを検出するようになりました。それらを `.deleted.<timestamp>` としてアーカイブするには対話的な確認が必要です。`--fix`、`--yes`、ヘッドレス実行ではそのまま残します。
- Doctor は、レガシー Cron ジョブ形状について `~/.openclaw/cron/jobs.json`（または `cron.store`）もスキャンし、スケジューラーが実行時に自動正規化する前に、その場で再書き込みできます。
- Linux では、ユーザーの crontab がまだレガシーの `~/.openclaw/bin/ensure-whatsapp.sh` を実行している場合、doctor が警告します。このスクリプトはもう保守されておらず、cron に systemd ユーザーバス環境がない場合に WhatsApp Gateway の誤った停止をログ出力する可能性があります。
- Doctor は、古い OpenClaw バージョンで作成されたレガシー Plugin 依存関係ステージング状態をクリーンアップします。また、`plugins.entries`、設定済みチャネル、設定済みプロバイダー/検索設定、または設定済みエージェントランタイムなど、設定から参照されている欠落したダウンロード可能 Plugin も修復します。パッケージ更新中、doctor はパッケージの入れ替えが完了するまでパッケージマネージャー Plugin 修復をスキップします。設定済み Plugin がまだ復旧を必要とする場合は、その後で `openclaw doctor --fix` を再実行してください。ダウンロードが失敗した場合、doctor はインストールエラーを報告し、次回の修復試行のために設定済み Plugin エントリを保持します。
- Doctor は、Plugin 検出が健全な場合、欠落した Plugin id を `plugins.allow`/`plugins.entries` から削除し、対応する宙づりのチャネル設定、Heartbeat ターゲット、チャネルモデル上書きも削除することで、古い Plugin 設定を修復します。
- Doctor は、影響を受けた `plugins.entries.<id>` エントリを無効化し、その無効な `config` ペイロードを削除することで、無効な Plugin 設定を隔離します。Gateway 起動時にはすでに、その不正な Plugin のみをスキップするため、他の Plugin とチャネルは実行を継続できます。
- 別のスーパーバイザーが Gateway ライフサイクルを所有している場合は、`OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。Doctor は引き続き Gateway/サービスの健全性を報告し、非サービス修復を適用しますが、サービスのインストール/起動/再起動/ブートストラップ、およびレガシーサービスのクリーンアップをスキップします。
- Linux では、doctor は非アクティブな追加の Gateway 風 systemd ユニットを無視し、修復中に実行中の systemd Gateway サービスのコマンド/エントリポイントメタデータを書き換えません。アクティブなランチャーを意図的に置き換えたい場合は、まずサービスを停止するか、`openclaw gateway install --force` を使用してください。
- Doctor は、レガシーのフラットな Talk 設定（`talk.voiceId`、`talk.modelId` など）を `talk.provider` + `talk.providers.<provider>` に自動マイグレーションします。
- `doctor --fix` の繰り返し実行は、差分がオブジェクトキー順序のみの場合、Talk 正規化を報告/適用しなくなりました。
- Doctor にはメモリ検索の準備状況チェックが含まれ、embedding 認証情報が欠落している場合は `openclaw configure --section model` を推奨できます。
- Doctor は、コマンド所有者が設定されていない場合に警告します。コマンド所有者とは、所有者専用コマンドの実行と危険な操作の承認を許可された人間のオペレーターアカウントです。DM ペアリングはボットと会話できるようにするだけです。最初の所有者ブートストラップが存在する前に送信者を承認した場合は、`commands.ownerAllowFrom` を明示的に設定してください。
- Doctor は、Codex モードのエージェントが設定され、オペレーターの Codex home に個人用 Codex CLI アセットが存在する場合に警告します。ローカル Codex app-server 起動では、エージェントごとに分離された home を使用するため、意図的に昇格すべきアセットを棚卸しするには `openclaw migrate codex --dry-run` を使用してください。
- Doctor は、デフォルトエージェントに許可された skills が、bin、env vars、config、または OS 要件の欠落により現在のランタイム環境で利用できない場合に警告します。`doctor --fix` は、それらの利用不可 skills を `skills.entries.<skill>.enabled=false` で無効化できます。skill をアクティブなままにしたい場合は、代わりに欠落している要件をインストール/設定してください。
- sandbox モードが有効だが Docker を利用できない場合、doctor は修復方法（`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`）を含む高シグナルな警告を報告します。
- レガシー sandbox レジストリファイル（`~/.openclaw/sandbox/containers.json` または `~/.openclaw/sandbox/browsers.json`）が存在する場合、doctor はそれらを報告します。`openclaw doctor --fix` は、有効なエントリをシャード化されたレジストリディレクトリへマイグレーションし、無効なレガシーファイルを隔離します。
- `gateway.auth.token`/`gateway.auth.password` が SecretRef 管理であり、現在のコマンドパスで利用できない場合、doctor は読み取り専用の警告を報告し、平文のフォールバック認証情報を書き込みません。
- 修正パスでチャネル SecretRef 検査が失敗した場合、doctor は早期終了せずに続行し、警告を報告します。
- 状態ディレクトリのマイグレーション後、有効化されたデフォルトの Telegram または Discord アカウントが env フォールバックに依存していて、`TELEGRAM_BOT_TOKEN` または `DISCORD_BOT_TOKEN` を doctor プロセスが利用できない場合、doctor は警告します。
- Telegram `allowFrom` ユーザー名の自動解決（`doctor --fix`）には、現在のコマンドパスで解決可能な Telegram トークンが必要です。トークン検査を利用できない場合、doctor は警告を報告し、そのパスでの自動解決をスキップします。

## macOS: `launchctl` env 上書き

以前に `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（または `...PASSWORD`）を実行した場合、その値が設定ファイルを上書きし、永続的な「unauthorized」エラーを引き起こす可能性があります。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway doctor](/ja-JP/gateway/doctor)
