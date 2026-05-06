---
read_when:
    - 接続や認証の問題があり、ガイド付きの修正を行いたい
    - 更新後に簡単な確認をしたい場合
summary: '`openclaw doctor` の CLI リファレンス（ヘルスチェック + ガイド付き修復）'
title: 診断
x-i18n:
    generated_at: "2026-05-06T04:59:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20eff2f94b41315dbe1d393ebbbf6dce352a7f9e589db3b8fb51f423dd6fed28
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway とチャネルのヘルスチェック + クイック修復。

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
- `--yes`: プロンプトなしでデフォルトを受け入れる
- `--repair`: 推奨される非サービス修復をプロンプトなしで適用する。Gateway サービスのインストールと書き換えには、引き続き対話的な確認または明示的な Gateway コマンドが必要
- `--fix`: `--repair` のエイリアス
- `--force`: 必要に応じてカスタムサービス設定の上書きを含む、積極的な修復を適用する
- `--non-interactive`: プロンプトなしで実行する。安全な移行と非サービス修復のみ
- `--generate-gateway-token`: Gateway トークンを生成して設定する
- `--deep`: 追加の Gateway インストールがないかシステムサービスをスキャンし、最近の Gateway supervisor 再起動ハンドオフを報告する

注記:

- 対話的なプロンプト（キーチェーン/OAuth 修復など）は、stdin が TTY で、かつ `--non-interactive` が設定されて**いない**場合にのみ実行されます。ヘッドレス実行（cron、Telegram、ターミナルなし）はプロンプトをスキップします。
- パフォーマンス: 非対話型の `doctor` 実行では、ヘッドレスヘルスチェックを高速に保つため、先行的な plugin 読み込みをスキップします。対話型セッションでは、チェックでその提供内容が必要な場合、引き続き plugin を完全に読み込みます。
- `--fix`（`--repair` のエイリアス）はバックアップを `~/.openclaw/openclaw.json.bak` に書き込み、不明な設定キーを削除して各削除を一覧表示します。
- `doctor --fix --non-interactive` は、Gateway サービス定義の欠落や古さを報告しますが、更新修復モード以外ではそれらをインストールまたは書き換えません。サービスがない場合は `openclaw gateway install` を実行し、意図的にランチャーを置き換える場合は `openclaw gateway install --force` を実行してください。
- 状態整合性チェックは、sessions ディレクトリ内の孤立した transcript ファイルを検出するようになりました。それらを `.deleted.<timestamp>` としてアーカイブするには対話的な確認が必要です。`--fix`、`--yes`、およびヘッドレス実行では、そのまま残されます。
- Doctor は `~/.openclaw/cron/jobs.json`（または `cron.store`）もスキャンして、レガシー cron ジョブ形状を検出し、スケジューラが実行時に自動正規化する前にその場で書き換えることができます。
- Linux では、ユーザーの crontab がレガシーの `~/.openclaw/bin/ensure-whatsapp.sh` をまだ実行している場合に doctor が警告します。このスクリプトはもう保守されておらず、cron に systemd ユーザーバス環境がない場合、WhatsApp Gateway 停止を誤ってログに記録する可能性があります。
- WhatsApp が有効な場合、doctor はローカルの `openclaw-tui` クライアントがまだ実行中で、Gateway イベントループが劣化していないかを確認します。`doctor --fix` は、検証済みのローカル TUI クライアントのみを停止するため、WhatsApp の返信が古い TUI 更新ループの後ろでキューに積まれることはありません。
- Doctor は、primary model、fallback、heartbeat/subagent/compaction override、hook、channel model override、古い session route pin 全体で、レガシーの `openai-codex/*` model ref を正規の `openai/*` ref に書き換えます。`--fix` は、Codex plugin がインストール済み、有効、`codex` harness を提供しており、利用可能な OAuth を持つ場合にのみ `agentRuntime.id: "codex"` を選択します。それ以外の場合は `agentRuntime.id: "pi"` を選択し、route がデフォルトの OpenClaw runner に留まるようにします。
- Doctor は、古い OpenClaw バージョンで作成されたレガシー plugin dependency staging state をクリーンアップします。また、`plugins.entries`、設定済みチャネル、設定済み provider/search settings、または設定済み agent runtimes など、設定から参照される欠落したダウンロード可能 plugin も修復します。パッケージ更新中、doctor はパッケージの入れ替えが完了するまで package-manager plugin 修復をスキップします。設定済み plugin にまだ復旧が必要な場合は、その後で `openclaw doctor --fix` を再実行してください。ダウンロードに失敗した場合、doctor はインストールエラーを報告し、次回の修復試行に備えて設定済み plugin エントリを保持します。
- Doctor は、plugin discovery が正常な場合、`plugins.allow`/`plugins.entries` から欠落した plugin id を削除し、対応する dangling channel config、heartbeat target、channel model override も削除して、古い plugin 設定を修復します。
- Doctor は、影響を受ける `plugins.entries.<id>` エントリを無効化し、その無効な `config` payload を削除することで、無効な plugin 設定を隔離します。Gateway 起動時には、他の plugins とチャネルが実行を継続できるように、その不正な plugin だけをすでにスキップします。
- 別の supervisor が Gateway ライフサイクルを所有している場合は、`OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。Doctor は Gateway/サービスのヘルス状態を引き続き報告し、非サービス修復を適用しますが、サービスの install/start/restart/bootstrap とレガシーサービスのクリーンアップはスキップします。
- Linux では、doctor は非アクティブな追加の Gateway 風 systemd unit を無視し、修復中に実行中の systemd Gateway サービスの command/entrypoint metadata を書き換えません。アクティブなランチャーを意図的に置き換える場合は、先にサービスを停止するか、`openclaw gateway install --force` を使用してください。
- Doctor はレガシーのフラットな Talk 設定（`talk.voiceId`、`talk.modelId` など）を `talk.provider` + `talk.providers.<provider>` に自動移行します。
- `doctor --fix` を繰り返し実行しても、差分がオブジェクトキー順だけの場合は、Talk 正規化を報告/適用しなくなりました。
- Doctor には memory-search readiness check が含まれ、embedding credentials が欠落している場合に `openclaw configure --section model` を推奨できます。
- Doctor は command owner が設定されていない場合に警告します。command owner は、owner-only commands を実行し、危険な操作を承認できる人間の operator account です。DM ペアリングは誰かが bot と話せるようにするだけです。first-owner bootstrap が存在する前に sender を承認した場合は、`commands.ownerAllowFrom` を明示的に設定してください。
- Doctor は、Codex-mode agents が設定されており、operator の Codex home に個人用 Codex CLI assets が存在する場合に警告します。ローカル Codex app-server 起動では agent ごとに分離された home を使用するため、意図的に昇格すべき assets を棚卸しするには `openclaw migrate codex --dry-run` を使用してください。
- Doctor は、デフォルト agent に許可された skills が、bin、env var、config、または OS 要件の欠落により現在の runtime environment で利用できない場合に警告します。`doctor --fix` は、`skills.entries.<skill>.enabled=false` でそれらの利用できない skills を無効化できます。skill をアクティブに保ちたい場合は、代わりに欠落している要件をインストール/設定してください。
- sandbox mode が有効でも Docker が利用できない場合、doctor は修復方法（`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`）を含む高シグナルな警告を報告します。
- レガシー sandbox registry files（`~/.openclaw/sandbox/containers.json` または `~/.openclaw/sandbox/browsers.json`）が存在する場合、doctor はそれらを報告します。`openclaw doctor --fix` は、有効なエントリを sharded registry directories に移行し、無効なレガシーファイルを隔離します。
- `gateway.auth.token`/`gateway.auth.password` が SecretRef 管理で、現在の command path で利用できない場合、doctor は読み取り専用の警告を報告し、平文の fallback credentials を書き込みません。
- fix path で channel SecretRef inspection が失敗した場合、doctor は早期終了せずに続行し、警告を報告します。
- state-directory migrations の後、doctor は有効なデフォルト Telegram または Discord アカウントが env fallback に依存しており、`TELEGRAM_BOT_TOKEN` または `DISCORD_BOT_TOKEN` が doctor プロセスで利用できない場合に警告します。
- Telegram の `allowFrom` username auto-resolution（`doctor --fix`）には、現在の command path で解決可能な Telegram token が必要です。token inspection が利用できない場合、doctor は警告を報告し、そのパスでの auto-resolution をスキップします。

## macOS: `launchctl` env overrides

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
