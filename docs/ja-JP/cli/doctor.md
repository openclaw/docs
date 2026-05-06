---
read_when:
    - 接続/認証の問題があり、ガイド付きの修正を行いたい
    - 更新したので、妥当性確認をしたい
summary: '`openclaw doctor` の CLI リファレンス（ヘルスチェック + ガイド付き修復）'
title: 診断
x-i18n:
    generated_at: "2026-05-06T17:52:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: eed73ecbec848ae3071448f2444735e2564680fee94cf1e22a73d1e7beaede80
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

- `--no-workspace-suggestions`: ワークスペースメモリ/検索の提案を無効化
- `--yes`: プロンプトなしでデフォルトを受け入れる
- `--repair`: プロンプトなしで推奨される非サービス修復を適用する。Gateway サービスのインストールと書き換えには、引き続き対話的な確認または明示的な Gateway コマンドが必要
- `--fix`: `--repair` のエイリアス
- `--force`: 必要に応じてカスタムサービス設定の上書きを含む、積極的な修復を適用する
- `--non-interactive`: プロンプトなしで実行する。安全な移行と非サービス修復のみ
- `--generate-gateway-token`: Gateway トークンを生成して設定する
- `--deep`: 追加の Gateway インストールがないかシステムサービスをスキャンし、最近の Gateway supervisor 再起動ハンドオフを報告する

注記:

- Nix モード (`OPENCLAW_NIX_MODE=1`) では、読み取り専用の doctor チェックは引き続き動作しますが、`openclaw.json` がイミュータブルなため、`doctor --fix`、`doctor --repair`、`doctor --yes`、`doctor --generate-gateway-token` は無効化されます。代わりにこのインストールの Nix ソースを編集してください。nix-openclaw では、エージェント優先の [クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start) を使用してください。
- 対話プロンプト（keychain/OAuth 修正など）は、stdin が TTY で、かつ `--non-interactive` が設定されて**いない**場合にのみ実行されます。ヘッドレス実行（cron、Telegram、ターミナルなし）ではプロンプトはスキップされます。
- パフォーマンス: 非対話の `doctor` 実行では、ヘッドレスヘルスチェックを高速に保つため、先行 Plugin 読み込みをスキップします。対話セッションでは、チェックが Plugin の寄与を必要とする場合、引き続き Plugin を完全に読み込みます。
- `--fix`（`--repair` のエイリアス）はバックアップを `~/.openclaw/openclaw.json.bak` に書き込み、不明な設定キーを削除して、各削除を一覧表示します。
- `doctor --fix --non-interactive` は、Gateway サービス定義の欠落または古さを報告しますが、更新修復モード以外ではそれらをインストールまたは書き換えません。サービスが欠落している場合は `openclaw gateway install` を実行し、ランチャーを意図的に置き換える場合は `openclaw gateway install --force` を実行してください。
- 状態整合性チェックは、sessions ディレクトリ内の孤立した transcript ファイルを検出するようになりました。それらを `.deleted.<timestamp>` としてアーカイブするには対話的な確認が必要です。`--fix`、`--yes`、ヘッドレス実行では、そのまま残されます。
- Doctor は `~/.openclaw/cron/jobs.json`（または `cron.store`）もスキャンしてレガシー Cron ジョブ形状を検出し、スケジューラが実行時に自動正規化する前に、その場で書き換えることができます。
- Linux では、ユーザーの crontab がまだレガシーな `~/.openclaw/bin/ensure-whatsapp.sh` を実行している場合に doctor が警告します。そのスクリプトはもうメンテナンスされておらず、cron に systemd user-bus 環境がない場合、誤った WhatsApp Gateway 障害をログに記録する可能性があります。
- WhatsApp が有効な場合、doctor はローカルの `openclaw-tui` クライアントがまだ実行中の状態で Gateway イベントループが劣化していないかをチェックします。`doctor --fix` は検証済みのローカル TUI クライアントのみを停止し、WhatsApp の返信が古い TUI 更新ループの後ろにキューされないようにします。
- Doctor は、プライマリモデル、フォールバック、heartbeat/subagent/compaction オーバーライド、フック、チャンネルモデルオーバーライド、古いセッションルートピン全体で、レガシーな `openai-codex/*` モデル参照を正規の `openai/*` 参照に書き換えます。`--fix` は、Codex Plugin がインストール済み、有効、`codex` ハーネスを提供、かつ利用可能な OAuth を持つ場合にのみ `agentRuntime.id: "codex"` を選択します。それ以外の場合は、ルートがデフォルトの OpenClaw runner に留まるように `agentRuntime.id: "pi"` を選択します。
- Doctor は、古い OpenClaw バージョンで作成されたレガシー Plugin 依存関係ステージング状態をクリーンアップします。また、`plugins.entries`、設定済みチャンネル、設定済み provider/search 設定、設定済みエージェントランタイムなど、設定から参照されているダウンロード可能 Plugin の欠落も修復します。パッケージ更新中、doctor はパッケージ差し替えが完了するまで package-manager Plugin 修復をスキップします。設定済み Plugin にまだ復旧が必要な場合は、その後で `openclaw doctor --fix` を再実行してください。ダウンロードに失敗した場合、doctor はインストールエラーを報告し、次回の修復試行のために設定済み Plugin エントリを保持します。
- Doctor は、Plugin 検出が正常な場合に、欠落した Plugin ID を `plugins.allow`/`plugins.entries` から削除し、一致する宙ぶらりんのチャンネル設定、Heartbeat ターゲット、チャンネルモデルオーバーライドも削除して、古い Plugin 設定を修復します。
- Doctor は、影響を受ける `plugins.entries.<id>` エントリを無効化し、その無効な `config` ペイロードを削除することで、無効な Plugin 設定を隔離します。Gateway 起動時には、すでにその不正な Plugin のみがスキップされるため、他の Plugin とチャンネルは実行を継続できます。
- 別の supervisor が Gateway ライフサイクルを所有している場合は、`OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。Doctor は引き続き Gateway/サービスの健全性を報告し、非サービス修復を適用しますが、サービスのインストール/開始/再起動/bootstrap とレガシーサービスのクリーンアップはスキップします。
- Linux では、doctor は非アクティブな追加の Gateway 風 systemd ユニットを無視し、修復中に実行中の systemd Gateway サービスのコマンド/エントリポイントメタデータを書き換えません。アクティブなランチャーを意図的に置き換える場合は、先にサービスを停止するか、`openclaw gateway install --force` を使用してください。
- Doctor は、レガシーなフラット Talk 設定（`talk.voiceId`、`talk.modelId` など）を `talk.provider` + `talk.providers.<provider>` に自動移行します。
- `doctor --fix` を繰り返し実行しても、差分がオブジェクトキー順序だけの場合は、Talk 正規化を報告/適用しなくなりました。
- Doctor にはメモリ検索の準備状況チェックが含まれ、embedding 認証情報が欠落している場合は `openclaw configure --section model` を推奨できます。
- Doctor はコマンド所有者が設定されていない場合に警告します。コマンド所有者は、所有者専用コマンドの実行と危険な操作の承認を許可された人間のオペレーターアカウントです。DM ペアリングは誰かがボットと会話できるようにするだけです。最初の所有者 bootstrap が存在する前に送信者を承認していた場合は、`commands.ownerAllowFrom` を明示的に設定してください。
- Doctor は、Codex モードのエージェントが設定され、オペレーターの Codex home に個人用 Codex CLI アセットが存在する場合に警告します。ローカル Codex app-server 起動ではエージェントごとに隔離された home を使用するため、意図的に昇格すべきアセットを棚卸しするには `openclaw migrate codex --dry-run` を使用してください。
- Doctor は、デフォルトエージェントに許可された Skills が、bin、env vars、config、OS 要件の欠落により現在のランタイム環境で利用できない場合に警告します。`doctor --fix` は、それらの利用できない Skills を `skills.entries.<skill>.enabled=false` で無効化できます。Skill を有効なままにしたい場合は、代わりに欠落している要件をインストール/設定してください。
- sandbox モードが有効だが Docker が利用できない場合、doctor は修復方法（`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`）を含む高シグナルの警告を報告します。
- レガシー sandbox registry ファイル（`~/.openclaw/sandbox/containers.json` または `~/.openclaw/sandbox/browsers.json`）が存在する場合、doctor はそれらを報告します。`openclaw doctor --fix` は、有効なエントリをシャーディングされた registry ディレクトリに移行し、無効なレガシーファイルを隔離します。
- `gateway.auth.token`/`gateway.auth.password` が SecretRef 管理で、現在のコマンドパスで利用できない場合、doctor は読み取り専用の警告を報告し、平文のフォールバック認証情報を書き込みません。
- 修正パスでチャンネル SecretRef 検査に失敗した場合、doctor は早期終了せず、処理を続けて警告を報告します。
- 状態ディレクトリ移行後、doctor は、有効化されたデフォルトの Telegram または Discord アカウントが env フォールバックに依存しており、`TELEGRAM_BOT_TOKEN` または `DISCORD_BOT_TOKEN` を doctor プロセスが利用できない場合に警告します。
- Telegram `allowFrom` ユーザー名の自動解決（`doctor --fix`）には、現在のコマンドパスで解決可能な Telegram トークンが必要です。トークン検査が利用できない場合、doctor は警告を報告し、その実行では自動解決をスキップします。

## macOS: `launchctl` env オーバーライド

以前に `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（または `...PASSWORD`）を実行していた場合、その値が設定ファイルを上書きし、持続的な「unauthorized」エラーを引き起こす可能性があります。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway doctor](/ja-JP/gateway/doctor)
