---
read_when:
    - 接続/認証の問題があり、ガイド付きの修正を行いたい
    - 更新後にサニティチェックを行いたい場合
summary: '`openclaw doctor` の CLI リファレンス（ヘルスチェック + ガイド付き修復）'
title: 診断
x-i18n:
    generated_at: "2026-05-03T21:28:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4baab5b0cd4d046d12ae5bd14ccf05224115856d45e630a57e77a2be15e5db0
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

- `--no-workspace-suggestions`: ワークスペースメモリ/検索の提案を無効にする
- `--yes`: 確認なしでデフォルトを受け入れる
- `--repair`: 確認なしで推奨される非サービス修復を適用する。Gateway サービスのインストールと書き換えには、引き続き対話的な確認または明示的な Gateway コマンドが必要
- `--fix`: `--repair` のエイリアス
- `--force`: 必要に応じてカスタムサービス設定の上書きを含む、積極的な修復を適用する
- `--non-interactive`: プロンプトなしで実行する。安全なマイグレーションと非サービス修復のみ
- `--generate-gateway-token`: Gateway トークンを生成して設定する
- `--deep`: 追加の Gateway インストールがないかシステムサービスをスキャンする

注:

- 対話型プロンプト（keychain/OAuth 修復など）は、stdin が TTY で、`--non-interactive` が設定されて**いない**場合にのみ実行されます。ヘッドレス実行（cron、Telegram、ターミナルなし）ではプロンプトはスキップされます。
- パフォーマンス: 非対話型の `doctor` 実行では、ヘッドレスのヘルスチェックを高速に保つため、先行 Plugin 読み込みをスキップします。対話型セッションでは、チェックで Plugin の寄与が必要な場合、引き続き Plugin を完全に読み込みます。
- `--fix`（`--repair` のエイリアス）は、バックアップを `~/.openclaw/openclaw.json.bak` に書き込み、不明な設定キーを削除し、削除ごとに一覧表示します。
- `doctor --fix --non-interactive` は、Gateway サービス定義の欠落または古さを報告しますが、更新修復モード以外ではインストールや書き換えを行いません。サービスがない場合は `openclaw gateway install` を実行し、ランチャーを意図的に置き換える場合は `openclaw gateway install --force` を実行します。
- 状態整合性チェックは、sessions ディレクトリ内の孤立したトランスクリプトファイルを検出するようになりました。それらを `.deleted.<timestamp>` としてアーカイブするには対話的な確認が必要です。`--fix`、`--yes`、ヘッドレス実行ではそのまま残します。
- Doctor は `~/.openclaw/cron/jobs.json`（または `cron.store`）もスキャンして、レガシー cron ジョブ形状を検出し、スケジューラが実行時に自動正規化する前に、その場で書き換えることができます。
- Linux では、ユーザーの crontab がまだレガシーの `~/.openclaw/bin/ensure-whatsapp.sh` を実行している場合、doctor が警告します。このスクリプトはもう保守されておらず、cron に systemd ユーザーバス環境がない場合、誤った WhatsApp Gateway 障害をログに出力する可能性があります。
- Doctor は古い OpenClaw バージョンで作成されたレガシー Plugin 依存関係のステージング状態をクリーンアップします。また、レジストリで解決できる場合は、設定済みで欠落しているダウンロード可能 Plugin を修復します。さらに 2026.5.2 の doctor パスでは、古い設定がすでに使用しているダウンロード可能 Plugin を自動的にインストールしてから、そのリリース向けに設定を変更済みとしてマークします。
- Doctor は、Plugin 検出が正常な場合に、`plugins.allow`/`plugins.entries` から欠落している Plugin ID を削除し、一致する未参照のチャンネル設定、Heartbeat ターゲット、チャンネルモデルオーバーライドも削除することで、古い Plugin 設定を修復します。
- Doctor は、影響を受けた `plugins.entries.<id>` エントリを無効化し、無効な `config` ペイロードを削除することで、無効な Plugin 設定を隔離します。Gateway 起動時にはすでに、その問題のある Plugin だけをスキップするため、他の Plugin とチャンネルは実行を継続できます。
- 別のスーパーバイザーが Gateway ライフサイクルを所有している場合は、`OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定します。Doctor は引き続き Gateway/サービスの健全性を報告し、非サービス修復を適用しますが、サービスの install/start/restart/bootstrap とレガシーサービスのクリーンアップはスキップします。
- Linux では、doctor は非アクティブな追加の Gateway 風 systemd ユニットを無視し、修復中に実行中の systemd Gateway サービスの command/entrypoint メタデータを書き換えません。アクティブなランチャーを意図的に置き換える場合は、まずサービスを停止するか、`openclaw gateway install --force` を使用してください。
- Doctor はレガシーのフラットな Talk 設定（`talk.voiceId`、`talk.modelId` など）を `talk.provider` + `talk.providers.<provider>` に自動移行します。
- `doctor --fix` を繰り返し実行しても、唯一の差分がオブジェクトキー順序だけの場合、Talk 正規化を報告/適用しなくなりました。
- Doctor にはメモリ検索準備チェックが含まれており、埋め込み認証情報がない場合は `openclaw configure --section model` を推奨できます。
- Doctor はコマンド所有者が設定されていない場合に警告します。コマンド所有者は、所有者専用コマンドの実行と危険な操作の承認を許可された人間のオペレーターアカウントです。DM ペアリングは、誰かがボットと会話できるようにするだけです。初回所有者の bootstrap が存在する前に送信者を承認していた場合は、`commands.ownerAllowFrom` を明示的に設定してください。
- Doctor は、Codex モードのエージェントが設定され、個人の Codex CLI アセットがオペレーターの Codex ホームに存在する場合に警告します。ローカルの Codex アプリサーバー起動では、エージェントごとに分離されたホームを使用するため、意図的に昇格すべきアセットを棚卸しするには `openclaw migrate codex --dry-run` を使用してください。
- Doctor は、デフォルトエージェントに許可されている Skills が、bin、環境変数、設定、または OS 要件の不足により現在のランタイム環境で利用できない場合に警告します。`doctor --fix` は、`skills.entries.<skill>.enabled=false` でそれらの利用不可 Skills を無効化できます。Skill を有効なままにしたい場合は、不足している要件を代わりにインストール/設定してください。
- サンドボックスモードが有効でも Docker が利用できない場合、doctor は修復方法（`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`）を含む高シグナルの警告を報告します。
- レガシーサンドボックスレジストリファイル（`~/.openclaw/sandbox/containers.json` または `~/.openclaw/sandbox/browsers.json`）が存在する場合、doctor はそれらを報告します。`openclaw doctor --fix` は、有効なエントリをシャーディングされたレジストリディレクトリに移行し、無効なレガシーファイルを隔離します。
- `gateway.auth.token`/`gateway.auth.password` が SecretRef 管理で、現在のコマンドパスで利用できない場合、doctor は読み取り専用の警告を報告し、平文のフォールバック認証情報を書き込みません。
- 修復パスでチャンネル SecretRef 検査に失敗した場合、doctor は早期終了せずに続行し、警告を報告します。
- 状態ディレクトリの移行後、doctor は、有効なデフォルト Telegram または Discord アカウントが環境フォールバックに依存していて、`TELEGRAM_BOT_TOKEN` または `DISCORD_BOT_TOKEN` が doctor プロセスで利用できない場合に警告します。
- Telegram の `allowFrom` ユーザー名自動解決（`doctor --fix`）には、現在のコマンドパスで解決可能な Telegram トークンが必要です。トークン検査が利用できない場合、doctor は警告を報告し、そのパスの自動解決をスキップします。

## macOS: `launchctl` 環境上書き

以前に `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（または `...PASSWORD`）を実行していた場合、その値が設定ファイルを上書きし、永続的な「unauthorized」エラーを引き起こす可能性があります。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway doctor](/ja-JP/gateway/doctor)
