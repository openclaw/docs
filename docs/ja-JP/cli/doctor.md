---
read_when:
    - 接続や認証に問題があり、ガイド付きの修正を利用したい
    - 更新して、妥当性確認をしたい場合
summary: '`openclaw doctor` の CLI リファレンス (ヘルスチェック + ガイド付き修復)'
title: 診断
x-i18n:
    generated_at: "2026-04-30T05:04:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9985c84d23861dd9468a4659ee00519573fe6d540c436548da0a68067dbabc4c
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

- `--no-workspace-suggestions`: ワークスペースのメモリ/検索候補を無効化
- `--yes`: プロンプトなしでデフォルトを受け入れる
- `--repair`: プロンプトなしで推奨修復を適用
- `--fix`: `--repair` のエイリアス
- `--force`: 必要に応じたカスタムサービス設定の上書きを含め、積極的な修復を適用
- `--non-interactive`: プロンプトなしで実行。安全なマイグレーションのみ
- `--generate-gateway-token`: Gateway トークンを生成して設定
- `--deep`: 追加の Gateway インストールについてシステムサービスをスキャン

注記:

- インタラクティブプロンプト（keychain/OAuth 修正など）は、stdin が TTY であり、`--non-interactive` が設定されて**いない**場合にのみ実行されます。ヘッドレス実行（cron、Telegram、ターミナルなし）ではプロンプトをスキップします。
- パフォーマンス: 非インタラクティブの `doctor` 実行では積極的な Plugin 読み込みをスキップするため、ヘッドレスのヘルスチェックを高速に保てます。インタラクティブセッションでは、チェックが Plugin の寄与を必要とする場合は引き続き Plugin を完全に読み込みます。
- `--fix`（`--repair` のエイリアス）は `~/.openclaw/openclaw.json.bak` にバックアップを書き込み、不明な設定キーを削除して、それぞれの削除を一覧表示します。
- 状態整合性チェックは、sessions ディレクトリ内の孤立した transcript ファイルを検出するようになりました。それらを `.deleted.<timestamp>` としてアーカイブするにはインタラクティブな確認が必要です。`--fix`、`--yes`、ヘッドレス実行ではそのまま残します。
- Doctor は `~/.openclaw/cron/jobs.json`（または `cron.store`）もスキャンして、レガシーな cron ジョブ形状を検出し、スケジューラーが実行時に自動正規化する前にその場で書き換えることができます。
- Doctor は、パッケージ化されたグローバルインストールへ書き込まずに、欠落している同梱 Plugin ランタイム依存関係を修復します。root 所有の npm インストールや強化された systemd ユニットでは、`OPENCLAW_PLUGIN_STAGE_DIR` を `/var/lib/openclaw/plugin-runtime-deps` のような書き込み可能なディレクトリに設定してください。`/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps` のようなパスリストにすることもでき、その場合、前の root は読み取り専用の検索レイヤーで、最後の root が修復対象になります。
- Doctor は、Plugin 検出が健全な場合、`plugins.allow`/`plugins.entries` から欠落した Plugin ID を削除し、一致するぶら下がったチャンネル設定、Heartbeat ターゲット、チャンネルモデルオーバーライドも削除して、古い Plugin 設定を修復します。
- Doctor は、影響を受ける `plugins.entries.<id>` エントリを無効化し、その無効な `config` ペイロードを削除することで、無効な Plugin 設定を隔離します。Gateway 起動はすでにその不正な Plugin のみをスキップするため、他の Plugin とチャンネルは実行を継続できます。
- 別のスーパーバイザーが Gateway ライフサイクルを所有している場合は、`OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定します。Doctor は引き続き Gateway/サービスのヘルス状態を報告し、非サービス修復を適用しますが、サービスの install/start/restart/bootstrap とレガシーサービスのクリーンアップはスキップします。
- Linux では、doctor は非アクティブな追加の Gateway 風 systemd ユニットを無視し、修復中に実行中の systemd Gateway サービスの command/entrypoint メタデータを書き換えません。アクティブなランチャーを意図的に置き換えたい場合は、先にサービスを停止するか、`openclaw gateway install --force` を使用してください。
- Doctor は、レガシーのフラットな Talk 設定（`talk.voiceId`、`talk.modelId` など）を `talk.provider` + `talk.providers.<provider>` に自動マイグレーションします。
- `doctor --fix` の繰り返し実行は、差分がオブジェクトキー順序のみの場合、Talk 正規化を報告/適用しなくなりました。
- Doctor にはメモリ検索の準備状態チェックが含まれ、embedding 認証情報が欠落している場合は `openclaw configure --section model` を推奨できます。
- Doctor は、コマンド所有者が設定されていない場合に警告します。コマンド所有者とは、所有者専用コマンドの実行と危険な操作の承認を許可された人間のオペレーターアカウントです。DM ペアリングは誰かがボットと会話できるようにするだけです。初回所有者 bootstrap が存在する前に送信者を承認した場合は、`commands.ownerAllowFrom` を明示的に設定してください。
- sandbox モードが有効でも Docker が利用できない場合、doctor は修復方法（`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`）を含む高シグナルの警告を報告します。
- `gateway.auth.token`/`gateway.auth.password` が SecretRef 管理であり、現在のコマンドパスで利用できない場合、doctor は読み取り専用の警告を報告し、平文のフォールバック認証情報を書き込みません。
- fix パスでチャンネル SecretRef 検査が失敗した場合、doctor は早期終了せずに続行し、警告を報告します。
- Telegram `allowFrom` ユーザー名の自動解決（`doctor --fix`）には、現在のコマンドパスで解決可能な Telegram トークンが必要です。トークン検査が利用できない場合、doctor は警告を報告し、その実行では自動解決をスキップします。

## macOS: `launchctl` 環境変数オーバーライド

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
