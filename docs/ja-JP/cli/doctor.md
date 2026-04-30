---
read_when:
    - 接続/認証の問題があり、ガイド付きの修正を行いたい
    - 更新したので健全性チェックをしたい
summary: '`openclaw doctor` のCLIリファレンス（ヘルスチェック + ガイド付き修復）'
title: 診断
x-i18n:
    generated_at: "2026-04-30T20:05:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 265d82a10da086cf89687886e491be018a720b70021e0b26bd8f39b25a907e14
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

- `--no-workspace-suggestions`: ワークスペースのメモリ/検索候補を無効にする
- `--yes`: プロンプトなしでデフォルトを受け入れる
- `--repair`: プロンプトなしで推奨修復を適用する
- `--fix`: `--repair` のエイリアス
- `--force`: 必要に応じてカスタムサービス設定の上書きを含む、積極的な修復を適用する
- `--non-interactive`: プロンプトなしで実行する。安全な移行のみ
- `--generate-gateway-token`: Gateway トークンを生成して設定する
- `--deep`: 追加の Gateway インストールがないかシステムサービスをスキャンする

注記:

- 対話型プロンプト（keychain/OAuth 修正など）は、stdin が TTY で、`--non-interactive` が設定されて**いない**場合にのみ実行されます。ヘッドレス実行（cron、Telegram、端末なし）ではプロンプトはスキップされます。
- パフォーマンス: 非対話型の `doctor` 実行では、ヘッドレスヘルスチェックを高速に保つため、先行 Plugin 読み込みをスキップします。対話型セッションでは、チェックが Plugin の寄与を必要とする場合、引き続き Plugin を完全に読み込みます。
- `--fix`（`--repair` のエイリアス）はバックアップを `~/.openclaw/openclaw.json.bak` に書き込み、不明な設定キーを削除して、それぞれの削除を一覧表示します。
- 状態整合性チェックは、sessions ディレクトリ内の孤立した transcript ファイルを検出するようになりました。それらを `.deleted.<timestamp>` としてアーカイブするには対話型確認が必要です。`--fix`、`--yes`、ヘッドレス実行ではそのまま残します。
- Doctor は `~/.openclaw/cron/jobs.json`（または `cron.store`）もスキャンしてレガシー Cron ジョブ形状を検出し、スケジューラが実行時に自動正規化する前に、その場で書き換えられます。
- Doctor は、パッケージ化されたグローバルインストールに書き込まずに、欠落しているバンドル Plugin ランタイム依存関係を修復します。root 所有の npm インストールまたは強化された systemd ユニットでは、`OPENCLAW_PLUGIN_STAGE_DIR` を `/var/lib/openclaw/plugin-runtime-deps` などの書き込み可能なディレクトリに設定してください。`/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps` のようなパスリストにすることもでき、前方の root は読み取り専用の検索レイヤー、最後の root は修復対象になります。
- Doctor は、Plugin 検出が正常な場合、`plugins.allow`/`plugins.entries` から欠落している Plugin id を削除し、一致するぶら下がったチャンネル設定、Heartbeat ターゲット、チャンネルモデル上書きも削除して、古い Plugin 設定を修復します。
- Doctor は、影響を受ける `plugins.entries.<id>` エントリを無効化し、その無効な `config` ペイロードを削除することで、無効な Plugin 設定を隔離します。Gateway 起動時には既に、その問題のある Plugin だけをスキップするため、他の Plugin とチャンネルは実行を継続できます。
- 別の supervisor が Gateway ライフサイクルを所有している場合は、`OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定します。Doctor は引き続き Gateway/サービスの正常性を報告し、サービス以外の修復を適用しますが、サービスのインストール/開始/再起動/bootstrap とレガシーサービスのクリーンアップはスキップします。
- Linux では、doctor は非アクティブな追加の Gateway 風 systemd ユニットを無視し、修復中に実行中の systemd Gateway サービスの command/entrypoint メタデータを書き換えません。アクティブなランチャーを意図的に置き換えたい場合は、先にサービスを停止するか、`openclaw gateway install --force` を使用してください。
- Doctor は、レガシーのフラットな Talk 設定（`talk.voiceId`、`talk.modelId` など）を `talk.provider` + `talk.providers.<provider>` に自動移行します。
- `doctor --fix` の繰り返し実行で、唯一の差分がオブジェクトキー順序だけの場合、Talk 正規化は報告/適用されなくなりました。
- Doctor にはメモリ検索準備状況チェックが含まれ、embedding 認証情報が欠落している場合は `openclaw configure --section model` を推奨できます。
- Doctor はコマンド所有者が設定されていない場合に警告します。コマンド所有者は、owner-only コマンドを実行し、危険なアクションを承認できる人間のオペレーターアカウントです。DM ペアリングは誰かが bot と会話できるようにするだけです。first-owner bootstrap が存在する前に送信者を承認していた場合は、`commands.ownerAllowFrom` を明示的に設定してください。
- Doctor は、Codex モードのエージェントが設定され、個人用 Codex CLI アセットがオペレーターの Codex home に存在する場合に警告します。ローカルの Codex app-server 起動では、エージェントごとに分離された home を使用するため、意図的に昇格すべきアセットを棚卸しするには `openclaw migrate codex --dry-run` を使用してください。
- sandbox モードが有効でも Docker が利用できない場合、doctor は修復方法（`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`）を含む高シグナルな警告を報告します。
- `gateway.auth.token`/`gateway.auth.password` が SecretRef 管理で、現在のコマンドパスでは利用できない場合、doctor は読み取り専用の警告を報告し、平文のフォールバック認証情報を書き込みません。
- 修正パスでチャンネル SecretRef 検査に失敗した場合、doctor は早期終了せずに続行し、警告を報告します。
- Telegram `allowFrom` ユーザー名の自動解決（`doctor --fix`）には、現在のコマンドパスで解決可能な Telegram トークンが必要です。トークン検査を利用できない場合、doctor は警告を報告し、そのパスでの自動解決をスキップします。

## macOS: `launchctl` 環境変数の上書き

以前に `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（または `...PASSWORD`）を実行していた場合、その値は設定ファイルを上書きし、永続的な「unauthorized」エラーを引き起こす可能性があります。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway doctor](/ja-JP/gateway/doctor)
