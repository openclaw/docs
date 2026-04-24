---
read_when:
    - 接続や認証の問題があり、ガイド付きの修正を行いたい場合
    - 更新後に正常性チェックを行いたい場合
summary: '`openclaw doctor` のCLIリファレンス（ヘルスチェック + ガイド付き修復）'
title: Doctor
x-i18n:
    generated_at: "2026-04-24T04:50:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5ea3f4992effe3d417f20427b3bdb9e47712816106b03bc27a415571cf88a7c
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Gateway とチャンネル向けのヘルスチェックとクイック修復です。

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

- `--no-workspace-suggestions`: workspace memory/search の提案を無効化
- `--yes`: プロンプトを出さずにデフォルトを受け入れる
- `--repair`: プロンプトを出さずに推奨される修復を適用する
- `--fix`: `--repair` の別名
- `--force`: 必要に応じてカスタムサービス設定の上書きを含む積極的な修復を適用する
- `--non-interactive`: プロンプトなしで実行する。安全な移行のみ
- `--generate-gateway-token`: gateway トークンを生成して設定する
- `--deep`: 追加の gateway インストールを見つけるためにシステムサービスをスキャンする

注:

- 対話型プロンプト（keychain/OAuth 修復など）は、stdin が TTY であり、かつ `--non-interactive` が**設定されていない**場合にのみ実行されます。ヘッドレス実行（Cron、Telegram、ターミナルなし）ではプロンプトはスキップされます。
- パフォーマンス: 非対話型の `doctor` 実行では eager plugin loading をスキップするため、ヘッドレスのヘルスチェックを高速に保てます。対話型セッションでは、チェックで必要な場合に引き続き plugin を完全に読み込みます。
- `--fix`（`--repair` の別名）は `~/.openclaw/openclaw.json.bak` にバックアップを書き込み、不明な config キーを削除し、削除した各項目を一覧表示します。
- 状態整合性チェックでは、sessions ディレクトリ内の孤立した transcript ファイルを検出できるようになり、安全に領域を回収するためにそれらを `.deleted.<timestamp>` としてアーカイブできます。
- Doctor は `~/.openclaw/cron/jobs.json`（または `cron.store`）もスキャンして旧式の Cron job 形式を検出し、スケジューラーがランタイムで自動正規化する前にその場で書き換えることができます。
- Doctor は、インストール済み OpenClaw パッケージへの書き込み権限を必要とせず、不足している bundled plugin ランタイム依存関係を修復します。root 所有の npm インストールや hardened systemd unit の場合は、`OPENCLAW_PLUGIN_STAGE_DIR` を `/var/lib/openclaw/plugin-runtime-deps` のような書き込み可能ディレクトリに設定してください。
- Doctor は旧式のフラットな Talk 設定（`talk.voiceId`, `talk.modelId` など）を `talk.provider` + `talk.providers.<provider>` に自動移行します。
- `doctor --fix` を繰り返し実行しても、違いがオブジェクトキー順のみである場合は Talk の正規化を報告または適用しなくなりました。
- Doctor には memory-search の準備状況チェックが含まれており、埋め込み認証情報が欠けている場合は `openclaw configure --section model` を推奨できます。
- sandbox mode が有効なのに Docker が利用できない場合、doctor は修復方法（`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`）付きの高シグナル警告を報告します。
- `gateway.auth.token`/`gateway.auth.password` が SecretRef 管理で、現在のコマンドパスでは利用できない場合、doctor は読み取り専用の警告を報告し、プレーンテキストのフォールバック認証情報は書き込みません。
- チャンネル SecretRef の検査が修復パスで失敗した場合、doctor は早期終了せずに続行し、警告を報告します。
- Telegram の `allowFrom` username 自動解決（`doctor --fix`）には、現在のコマンドパスで解決可能な Telegram トークンが必要です。トークン検査が利用できない場合、doctor は警告を報告し、その回の自動解決をスキップします。

## macOS: `launchctl` 環境変数の上書き

以前に `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（または `...PASSWORD`）を実行している場合、その値が config ファイルを上書きし、継続的な「unauthorized」エラーの原因になることがあります。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 関連

- [CLI reference](/ja-JP/cli)
- [Gateway doctor](/ja-JP/gateway/doctor)
