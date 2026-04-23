---
read_when:
    - 接続性/認証の問題があり、ガイド付きの修正を行いたい
    - 更新後に簡単な健全性チェックを行いたい
summary: '`openclaw doctor` の CLI リファレンス（ヘルスチェック + ガイド付き修復）'
title: doctor
x-i18n:
    generated_at: "2026-04-23T14:01:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4b858e8726094c950edcde1e3bdff05d03ae2bd216c3519bbee4805955cf851
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Gateway とチャネル向けのヘルスチェック + クイック修復。

関連:

- トラブルシューティング: [Troubleshooting](/ja-JP/gateway/troubleshooting)
- セキュリティ監査: [Security](/ja-JP/gateway/security)

## 例

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## オプション

- `--no-workspace-suggestions`: ワークスペースのメモリ/検索に関する提案を無効化
- `--yes`: プロンプトなしで既定値を受け入れる
- `--repair`: プロンプトなしで推奨修復を適用
- `--fix`: `--repair` のエイリアス
- `--force`: 必要に応じてカスタムサービス設定の上書きも含む、強力な修復を適用
- `--non-interactive`: プロンプトなしで実行。安全な移行のみ
- `--generate-gateway-token`: Gateway トークンを生成して設定
- `--deep`: 追加の Gateway インストールをシステムサービスから走査

注意:

- 対話プロンプト（keychain/OAuth 修復など）は、stdin が TTY であり、かつ `--non-interactive` が**設定されていない**場合にのみ実行されます。ヘッドレス実行（Cron、Telegram、ターミナルなし）ではプロンプトはスキップされます。
- パフォーマンス: 非対話の `doctor` 実行では、ヘッドレスのヘルスチェックを高速に保つために eager な Plugin 読み込みをスキップします。対話セッションでは、チェックで必要な場合に引き続き Plugin を完全に読み込みます。
- `--fix`（`--repair` のエイリアス）は `~/.openclaw/openclaw.json.bak` にバックアップを書き込み、未知の設定キーを削除し、各削除項目を一覧表示します。
- 状態整合性チェックでは、sessions ディレクトリ内の孤立した transcript ファイルも検出できるようになり、安全に空き容量を回収するため `.deleted.<timestamp>` としてアーカイブできます。
- Doctor は `~/.openclaw/cron/jobs.json`（または `cron.store`）も走査して、レガシーな Cron ジョブ形式を検出し、スケジューラーが実行時に自動正規化する前にその場で書き換えることができます。
- Doctor は、インストール済み OpenClaw パッケージへの書き込み権限がなくても、不足しているバンドル済みPluginのランタイム依存関係を修復します。root 所有の npm インストールまたは強化された systemd ユニットでは、`OPENCLAW_PLUGIN_STAGE_DIR` を `/var/lib/openclaw/plugin-runtime-deps` のような書き込み可能ディレクトリに設定してください。
- Doctor は、レガシーなフラット Talk 設定（`talk.voiceId`、`talk.modelId` など）を `talk.provider` + `talk.providers.<provider>` に自動移行します。
- 差分がオブジェクトキー順序だけの場合、`doctor --fix` の繰り返し実行では Talk 正規化を報告/適用しなくなりました。
- Doctor にはメモリ検索の準備状況チェックが含まれており、埋め込み資格情報が欠けている場合は `openclaw configure --section model` を推奨できます。
- sandbox モードが有効なのに Docker が利用できない場合、doctor は修復方法（`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`）付きの明確な警告を表示します。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef 管理であり、現在のコマンド経路で利用できない場合、doctor は読み取り専用の警告を表示し、平文のフォールバック資格情報は書き込みません。
- チャネル SecretRef の検査が修復経路で失敗しても、doctor は途中終了せず、警告を報告して続行します。
- Telegram の `allowFrom` ユーザー名自動解決（`doctor --fix`）には、現在のコマンド経路で解決可能な Telegram トークンが必要です。トークン検査が利用できない場合、doctor は警告を表示し、その回の自動解決をスキップします。

## macOS: `launchctl` 環境変数上書き

以前に `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（または `...PASSWORD`）を実行していると、その値が設定ファイルを上書きし、`unauthorized` エラーが継続する原因になることがあります。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
