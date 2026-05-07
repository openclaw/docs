---
read_when:
    - 接続/認証の問題があり、ガイド付きの修正を行いたい
    - 更新後に健全性チェックをしたい場合
summary: '`openclaw doctor` の CLI リファレンス（健全性チェック + ガイド付き修復）'
title: 診断
x-i18n:
    generated_at: "2026-05-07T13:14:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7683a974eb9406e5ca071612c96c7db05247a69e253ef4293c57e7707aa5fd4
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

チャンネル固有の権限には、`doctor` の代わりにチャンネルプローブを使用します。

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

対象を絞った Discord capabilities プローブは、ボットの実効的なチャンネル権限を報告します。status プローブは、設定済みの Discord チャンネルと音声自動参加ターゲットを監査します。

## オプション

- `--no-workspace-suggestions`: ワークスペースメモリ/検索候補を無効にする
- `--yes`: 確認なしでデフォルトを受け入れる
- `--repair`: 確認なしで推奨される非サービス修復を適用する。Gateway サービスのインストールと書き換えには、引き続き対話的な確認または明示的な Gateway コマンドが必要
- `--fix`: `--repair` のエイリアス
- `--force`: 必要な場合にカスタムサービス設定の上書きを含む、積極的な修復を適用する
- `--non-interactive`: プロンプトなしで実行する。安全な移行と非サービス修復のみ
- `--generate-gateway-token`: Gateway トークンを生成して設定する
- `--deep`: 追加の Gateway インストールについてシステムサービスをスキャンし、最近の Gateway スーパーバイザー再起動ハンドオフを報告する

注:

- Nix モード (`OPENCLAW_NIX_MODE=1`) では、読み取り専用の doctor チェックは引き続き機能しますが、`openclaw.json` が不変であるため、`doctor --fix`、`doctor --repair`、`doctor --yes`、`doctor --generate-gateway-token` は無効です。代わりに、このインストールの Nix ソースを編集してください。nix-openclaw では、エージェント優先の [クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start) を使用します。
- 対話型プロンプト（keychain/OAuth 修正など）は、stdin が TTY であり、かつ `--non-interactive` が設定されて**いない**場合にのみ実行されます。ヘッドレス実行（cron、Telegram、端末なし）はプロンプトをスキップします。
- パフォーマンス: 非対話型の `doctor` 実行では、ヘッドレスのヘルスチェックを高速に保つため、積極的な plugin 読み込みをスキップします。対話型セッションでは、チェックが plugin の寄与を必要とする場合、引き続き plugin を完全に読み込みます。
- `--fix`（`--repair` のエイリアス）は `~/.openclaw/openclaw.json.bak` にバックアップを書き込み、不明な設定キーを削除して、各削除を一覧表示します。
- `doctor --fix --non-interactive` は、欠落または古い Gateway サービス定義を報告しますが、更新修復モード以外ではインストールや書き換えを行いません。サービスが欠落している場合は `openclaw gateway install` を実行します。意図的にランチャーを置き換える場合は `openclaw gateway install --force` を実行します。
- 状態整合性チェックは、sessions ディレクトリ内の孤立したトランスクリプトファイルを検出するようになりました。それらを `.deleted.<timestamp>` としてアーカイブするには対話的な確認が必要です。`--fix`、`--yes`、ヘッドレス実行ではそのまま残します。
- Doctor は `~/.openclaw/cron/jobs.json`（または `cron.store`）もスキャンして、レガシーな cron ジョブ形状を検出し、スケジューラーが実行時に自動正規化する前にその場で書き換えることができます。
- Linux では、ユーザーの crontab がレガシーな `~/.openclaw/bin/ensure-whatsapp.sh` をまだ実行している場合に doctor が警告します。このスクリプトは現在メンテナンスされておらず、cron に systemd ユーザーバス環境がない場合、誤った WhatsApp Gateway 障害をログに記録する可能性があります。
- WhatsApp が有効な場合、doctor はローカルの `openclaw-tui` クライアントがまだ実行中の劣化した Gateway イベントループをチェックします。`doctor --fix` は、検証済みのローカル TUI クライアントのみを停止するため、WhatsApp の返信が古い TUI リフレッシュループの後ろにキューされることはありません。
- Doctor は、プライマリモデル、フォールバック、heartbeat/subagent/compaction オーバーライド、hooks、チャンネルモデルオーバーライド、古いセッションルートピン全体で、レガシーな `openai-codex/*` モデル参照を正規の `openai/*` 参照に書き換えます。`--fix` は、Codex plugin がインストール済み、有効、`codex` ハーネスを提供し、使用可能な OAuth を持つ場合にのみ `agentRuntime.id: "codex"` を選択します。それ以外の場合は、ルートがデフォルトの OpenClaw ランナーに留まるように `agentRuntime.id: "pi"` を選択します。
- Doctor は、古い OpenClaw バージョンによって作成されたレガシーな plugin 依存関係ステージング状態をクリーンアップします。また、`plugins.entries`、設定済みチャンネル、設定済みプロバイダー/検索設定、設定済みエージェントランタイムなど、設定から参照されている欠落したダウンロード可能 plugin も修復します。パッケージ更新中、doctor はパッケージの入れ替えが完了するまでパッケージマネージャーの plugin 修復をスキップします。設定済み plugin にまだ復旧が必要な場合は、その後に `openclaw doctor --fix` を再実行してください。ダウンロードに失敗した場合、doctor はインストールエラーを報告し、次回の修復試行のために設定済み plugin エントリを保持します。
- Doctor は、plugin 検出が正常な場合、`plugins.allow`/`plugins.entries` から欠落した plugin ID を削除し、一致するぶら下がったチャンネル設定、heartbeat ターゲット、チャンネルモデルオーバーライドも削除して、古い plugin 設定を修復します。
- Doctor は、影響を受けた `plugins.entries.<id>` エントリを無効化し、その無効な `config` ペイロードを削除することで、無効な plugin 設定を隔離します。Gateway 起動時にはすでに、その不正な plugin だけをスキップするため、他の plugin とチャンネルは実行を継続できます。
- 別のスーパーバイザーが Gateway ライフサイクルを所有している場合は、`OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定します。Doctor は引き続き Gateway/サービスの健全性を報告し、非サービス修復を適用しますが、サービスのインストール/開始/再起動/bootstrap とレガシーサービスのクリーンアップをスキップします。
- Linux では、doctor は非アクティブな追加の Gateway 風 systemd unit を無視し、修復中に実行中の systemd Gateway サービスのコマンド/エントリポイントメタデータを書き換えません。アクティブなランチャーを意図的に置き換える場合は、先にサービスを停止するか `openclaw gateway install --force` を使用してください。
- Doctor は、レガシーなフラット Talk 設定（`talk.voiceId`、`talk.modelId` など）を `talk.provider` + `talk.providers.<provider>` に自動移行します。
- `doctor --fix` を繰り返し実行しても、違いがオブジェクトキーの順序だけの場合、Talk 正規化を報告/適用しなくなりました。
- Doctor にはメモリ検索準備状況チェックが含まれ、埋め込み認証情報がない場合に `openclaw configure --section model` を推奨できます。
- コマンド所有者が設定されていない場合、doctor は警告します。コマンド所有者とは、所有者専用コマンドの実行と危険な操作の承認を許可された人間のオペレーターアカウントです。DM ペアリングは、その人がボットと会話できるようにするだけです。first-owner bootstrap が存在する前に送信者を承認した場合は、`commands.ownerAllowFrom` を明示的に設定してください。
- Codex モードのエージェントが設定され、オペレーターの Codex home に個人用 Codex CLI アセットが存在する場合、doctor は警告します。ローカル Codex app-server 起動では、エージェントごとに分離された home が使用されるため、`openclaw migrate codex --dry-run` を使用して、意図的に昇格すべきアセットを棚卸ししてください。
- デフォルトエージェントに許可された skills が、bins、env vars、config、OS 要件の不足により現在のランタイム環境で利用できない場合、doctor は警告します。`doctor --fix` は `skills.entries.<skill>.enabled=false` でそれらの利用不可な skills を無効にできます。skill を有効なままにしたい場合は、代わりに不足している要件をインストール/設定してください。
- sandbox モードが有効で Docker が利用できない場合、doctor は修復方法（`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`）を含む高シグナルの警告を報告します。
- レガシーな sandbox レジストリファイル（`~/.openclaw/sandbox/containers.json` または `~/.openclaw/sandbox/browsers.json`）が存在する場合、doctor はそれらを報告します。`openclaw doctor --fix` は有効なエントリをシャード化されたレジストリディレクトリへ移行し、無効なレガシーファイルを隔離します。
- `gateway.auth.token`/`gateway.auth.password` が SecretRef 管理で、現在のコマンドパスで利用できない場合、doctor は読み取り専用の警告を報告し、平文のフォールバック認証情報を書き込みません。
- 修正パスでチャンネル SecretRef 検査に失敗した場合、doctor は早期終了せずに続行し、警告を報告します。
- 状態ディレクトリの移行後、有効なデフォルトの Telegram または Discord アカウントが env フォールバックに依存していて、`TELEGRAM_BOT_TOKEN` または `DISCORD_BOT_TOKEN` が doctor プロセスから利用できない場合、doctor は警告します。
- Telegram の `allowFrom` ユーザー名自動解決（`doctor --fix`）には、現在のコマンドパスで解決可能な Telegram トークンが必要です。トークン検査が利用できない場合、doctor は警告を報告し、そのパスでは自動解決をスキップします。

## macOS: `launchctl` env オーバーライド

以前に `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（または `...PASSWORD`）を実行していた場合、その値が設定ファイルを上書きし、永続的な「unauthorized」エラーを引き起こすことがあります。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway doctor](/ja-JP/gateway/doctor)
