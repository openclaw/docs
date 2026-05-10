---
read_when:
    - 接続/認証の問題があり、ガイド付きの修正を行いたい
    - 更新後に妥当性チェックをしたい場合
summary: '`openclaw doctor` の CLI リファレンス（ヘルスチェック + ガイド付き修復）'
title: 診断
x-i18n:
    generated_at: "2026-05-10T19:27:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: c336915c94b6bf703ebece5be429cc0a86be9a2122dd9a912e956579ecb2b096
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway とチャネルのヘルスチェックとクイック修正。

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

チャネル固有の権限には、`doctor` ではなくチャネルプローブを使用します:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

対象を絞った Discord 機能プローブは、ボットの有効なチャネル権限を報告します。ステータスプローブは、設定済みの Discord チャネルと音声自動参加ターゲットを監査します。

## オプション

- `--no-workspace-suggestions`: ワークスペースメモリ/検索の提案を無効にする
- `--yes`: プロンプトなしでデフォルトを受け入れる
- `--repair`: プロンプトなしで推奨される非サービス修復を適用する。Gateway サービスのインストールと書き換えには、引き続き対話的な確認または明示的な Gateway コマンドが必要
- `--fix`: `--repair` のエイリアス
- `--force`: 必要に応じてカスタムサービス設定の上書きを含む、積極的な修復を適用する
- `--non-interactive`: プロンプトなしで実行する。安全なマイグレーションと非サービス修復のみ
- `--generate-gateway-token`: Gateway トークンを生成して設定する
- `--deep`: 追加の Gateway インストールについてシステムサービスをスキャンし、最近の Gateway スーパーバイザー再起動ハンドオフを報告する

注記:

- Nix モード (`OPENCLAW_NIX_MODE=1`) では、読み取り専用の doctor チェックは引き続き動作しますが、`openclaw.json` が不変であるため、`doctor --fix`、`doctor --repair`、`doctor --yes`、`doctor --generate-gateway-token` は無効になります。代わりにこのインストールの Nix ソースを編集してください。nix-openclaw では、エージェント優先の [クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start) を使用します。
- 対話型プロンプト (keychain/OAuth 修正など) は、stdin が TTY で、`--non-interactive` が設定されて**いない**場合にのみ実行されます。ヘッドレス実行 (cron、Telegram、端末なし) ではプロンプトがスキップされます。
- パフォーマンス: 非対話型の `doctor` 実行では、ヘッドレスのヘルスチェックを高速に保つため、Plugin の積極的な読み込みをスキップします。対話型セッションでは、チェックが Plugin の寄与を必要とする場合に引き続き Plugin を完全に読み込みます。
- `--fix` (`--repair` のエイリアス) はバックアップを `~/.openclaw/openclaw.json.bak` に書き込み、不明な設定キーを削除し、各削除を一覧表示します。
- `doctor --fix --non-interactive` は、欠落または古い Gateway サービス定義を報告しますが、更新修復モードの外ではインストールや書き換えを行いません。サービスが欠落している場合は `openclaw gateway install` を実行し、ランチャーを意図的に置き換える場合は `openclaw gateway install --force` を実行します。
- 状態整合性チェックは、sessions ディレクトリ内の孤立したトランスクリプトファイルを検出するようになりました。それらを `.deleted.<timestamp>` としてアーカイブするには対話的な確認が必要です。`--fix`、`--yes`、およびヘッドレス実行ではそのまま残されます。
- Doctor は、レガシーな cron ジョブ形式について `~/.openclaw/cron/jobs.json` (または `cron.store`) もスキャンし、スケジューラがランタイムで自動正規化する前にその場で書き換えることができます。
- Linux では、ユーザーの crontab がレガシーな `~/.openclaw/bin/ensure-whatsapp.sh` をまだ実行している場合、doctor が警告します。このスクリプトはメンテナンスされなくなっており、cron に systemd ユーザーバス環境がない場合に誤った WhatsApp Gateway 停止をログに記録することがあります。
- WhatsApp が有効な場合、doctor はローカルの `openclaw-tui` クライアントがまだ実行されている状態で、劣化した Gateway イベントループがないか確認します。`doctor --fix` は、WhatsApp の返信が古い TUI 更新ループの後ろにキューイングされないよう、検証済みのローカル TUI クライアントのみを停止します。
- Doctor は、プライマリモデル、フォールバック、heartbeat/subagent/compaction オーバーライド、フック、チャネルモデルオーバーライド、古いセッションルートピン全体のレガシーな `openai-codex/*` モデル参照を、正規の `openai/*` 参照に書き換えます。`--fix` は Codex の意図を provider/model スコープの `agentRuntime.id: "codex"` エントリへ移動し、`openai-codex:...` などのセッション auth-profile ピンを保持し、古いエージェント全体/セッションランタイムピンを削除し、修復された OpenAI エージェント参照を直接の OpenAI API キー認証ではなく Codex 認証ルーティングに維持します。
- Doctor は、古い OpenClaw バージョンによって作成されたレガシーな Plugin 依存関係ステージング状態をクリーンアップします。また、`plugins.entries`、設定済みチャネル、設定済み provider/search 設定、または設定済みエージェントランタイムなど、設定から参照されている欠落したダウンロード可能 Plugin も修復します。パッケージ更新中、doctor はパッケージの入れ替えが完了するまで、パッケージマネージャーによる Plugin 修復をスキップします。設定済み Plugin がまだ復旧を必要とする場合は、その後で `openclaw doctor --fix` を再実行してください。ダウンロードが失敗した場合、doctor はインストールエラーを報告し、次回の修復試行に備えて設定済み Plugin エントリを保持します。
- Doctor は、Plugin 検出が正常な場合に、`plugins.allow`/`plugins.entries` から欠落した Plugin ID を削除し、対応するぶら下がったチャネル設定、heartbeat ターゲット、チャネルモデルオーバーライドも削除して、古い Plugin 設定を修復します。
- Doctor は、影響を受ける `plugins.entries.<id>` エントリを無効化し、その無効な `config` ペイロードを削除することで、無効な Plugin 設定を隔離します。Gateway 起動はすでにその不正な Plugin のみをスキップするため、他の Plugin とチャネルは実行を継続できます。
- 別のスーパーバイザーが Gateway ライフサイクルを所有している場合は、`OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定します。Doctor は引き続き Gateway/サービスの正常性を報告し、非サービス修復を適用しますが、サービスのインストール/起動/再起動/ブートストラップとレガシーサービスのクリーンアップはスキップします。
- Linux では、doctor は非アクティブな追加の Gateway 風 systemd ユニットを無視し、修復中に実行中の systemd Gateway サービスの command/entrypoint メタデータを書き換えません。アクティブなランチャーを意図的に置き換える場合は、先にサービスを停止するか、`openclaw gateway install --force` を使用します。
- Doctor は、レガシーなフラット Talk 設定 (`talk.voiceId`、`talk.modelId`、および関連項目) を `talk.provider` + `talk.providers.<provider>` へ自動マイグレーションします。
- `doctor --fix` の繰り返し実行では、唯一の違いがオブジェクトキー順である場合、Talk の正規化を報告/適用しなくなりました。
- Doctor にはメモリ検索の準備状況チェックが含まれ、埋め込み認証情報が欠落している場合に `openclaw configure --section model` を推奨できます。
- Doctor は、コマンド所有者が設定されていない場合に警告します。コマンド所有者は、所有者専用コマンドを実行し、危険な操作を承認できる人間のオペレーターアカウントです。DM ペアリングは誰かがボットと会話できるようにするだけです。初回所有者ブートストラップが存在する前に送信者を承認した場合は、`commands.ownerAllowFrom` を明示的に設定してください。
- Doctor は、Codex モードのエージェントが設定され、オペレーターの Codex ホームに個人用 Codex CLI アセットが存在する場合に警告します。ローカル Codex アプリサーバーの起動では、エージェントごとに分離されたホームが使用されるため、意図的に昇格すべきアセットを棚卸しするには `openclaw migrate codex --dry-run` を使用します。
- Doctor は、廃止された `plugins.entries.codex.config.codexDynamicToolsProfile` を削除します。Codex アプリサーバーは、Codex ネイティブのワークスペースツールを常にネイティブのまま維持します。
- Doctor は、デフォルトエージェントに許可された skills が、bins、環境変数、設定、または OS 要件の欠落により現在のランタイム環境で利用できない場合に警告します。`doctor --fix` は、`skills.entries.<skill>.enabled=false` でそれらの利用不可 skills を無効化できます。skill をアクティブに保ちたい場合は、代わりに欠落している要件をインストール/設定してください。
- サンドボックスモードが有効だが Docker が利用できない場合、doctor は対応策 (`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`) を含む高シグナルな警告を報告します。
- レガシーなサンドボックスレジストリファイル (`~/.openclaw/sandbox/containers.json` または `~/.openclaw/sandbox/browsers.json`) が存在する場合、doctor はそれらを報告します。`openclaw doctor --fix` は、有効なエントリをシャード化されたレジストリディレクトリへマイグレーションし、無効なレガシーファイルを隔離します。
- `gateway.auth.token`/`gateway.auth.password` が SecretRef 管理で、現在のコマンドパスで利用できない場合、doctor は読み取り専用の警告を報告し、プレーンテキストのフォールバック認証情報を書き込みません。
- 修正パスでチャネル SecretRef 検査が失敗した場合、doctor は早期終了せずに続行し、警告を報告します。
- 状態ディレクトリのマイグレーション後、doctor は、有効なデフォルト Telegram または Discord アカウントが env フォールバックに依存していて、`TELEGRAM_BOT_TOKEN` または `DISCORD_BOT_TOKEN` が doctor プロセスで利用できない場合に警告します。
- Telegram の `allowFrom` ユーザー名自動解決 (`doctor --fix`) には、現在のコマンドパスで解決可能な Telegram トークンが必要です。トークン検査が利用できない場合、doctor は警告を報告し、そのパスでの自動解決をスキップします。

## macOS: `launchctl` 環境オーバーライド

以前に `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (または `...PASSWORD`) を実行した場合、その値は設定ファイルを上書きし、永続的な「unauthorized」エラーを引き起こす可能性があります。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway doctor](/ja-JP/gateway/doctor)
