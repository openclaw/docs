---
read_when:
    - 接続/認証の問題があり、ガイド付きの修正を行いたい
    - 更新済みで、健全性チェックをしたい場合
summary: '`openclaw doctor` の CLI リファレンス（ヘルスチェック + ガイド付き修復）'
title: 診断
x-i18n:
    generated_at: "2026-05-11T20:26:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69f2dd99f339e4fcdeeae840b75098f3c251b3aa133b7ea11b040b3c7f32c200
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

チャンネル固有の権限には、`doctor` ではなくチャンネルプローブを使用します。

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

対象を絞った Discord 機能プローブは、ボットの有効なチャンネル権限を報告します。ステータスプローブは、設定済みの Discord チャンネルと音声自動参加ターゲットを監査します。

## オプション

- `--no-workspace-suggestions`: ワークスペースメモリ/検索候補を無効にする
- `--yes`: プロンプトを表示せず既定値を受け入れる
- `--repair`: 推奨される非サービス修復をプロンプトなしで適用する。Gateway サービスのインストールと書き換えには、引き続き対話的な確認または明示的な Gateway コマンドが必要
- `--fix`: `--repair` のエイリアス
- `--force`: 必要に応じてカスタムサービス設定の上書きを含む、積極的な修復を適用する
- `--non-interactive`: プロンプトなしで実行する。安全な移行と非サービス修復のみ
- `--generate-gateway-token`: Gateway トークンを生成して設定する
- `--deep`: 追加の Gateway インストールをシステムサービスからスキャンし、最近の Gateway supervisor 再起動ハンドオフを報告する

注:

- Nix モード (`OPENCLAW_NIX_MODE=1`) では、読み取り専用の doctor チェックは引き続き動作しますが、`openclaw.json` が不変のため、`doctor --fix`、`doctor --repair`、`doctor --yes`、`doctor --generate-gateway-token` は無効です。代わりにこのインストールの Nix ソースを編集してください。nix-openclaw では、エージェント優先の [クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start) を使用してください。
- 対話型プロンプト（keychain/OAuth 修正など）は、stdin が TTY で、かつ `--non-interactive` が設定されて**いない**場合にのみ実行されます。ヘッドレス実行（cron、Telegram、端末なし）ではプロンプトをスキップします。
- パフォーマンス: 非対話型の `doctor` 実行では、ヘッドレスのヘルスチェックを高速に保つため、積極的な Plugin 読み込みをスキップします。対話型セッションでは、チェックが Plugin の寄与を必要とする場合に引き続き Plugin を完全に読み込みます。
- `--fix`（`--repair` のエイリアス）はバックアップを `~/.openclaw/openclaw.json.bak` に書き込み、不明な設定キーを削除し、削除ごとに一覧表示します。
- `doctor --fix --non-interactive` は、不足または古い Gateway サービス定義を報告しますが、更新修復モード外ではインストールや書き換えを行いません。サービスが不足している場合は `openclaw gateway install` を実行し、ランチャーを意図的に置き換える場合は `openclaw gateway install --force` を実行してください。
- 状態の整合性チェックは、sessions ディレクトリ内の孤立したトランスクリプトファイルを検出するようになりました。それらを `.deleted.<timestamp>` としてアーカイブするには対話的な確認が必要です。`--fix`、`--yes`、ヘッドレス実行ではそのまま残します。
- Doctor は `~/.openclaw/cron/jobs.json`（または `cron.store`）もスキャンして、従来の Cron ジョブ形状を検出し、スケジューラが実行時に自動正規化する前にその場で書き換えることができます。
- Linux では、ユーザーの crontab が従来の `~/.openclaw/bin/ensure-whatsapp.sh` をまだ実行している場合に doctor が警告します。このスクリプトは現在メンテナンスされておらず、cron に systemd user-bus 環境がない場合に WhatsApp Gateway の誤った停止をログに記録することがあります。
- WhatsApp が有効な場合、doctor はローカルの `openclaw-tui` クライアントがまだ実行中で、Gateway イベントループが劣化していないかチェックします。`doctor --fix` は検証済みのローカル TUI クライアントのみを停止し、WhatsApp の返信が古い TUI 更新ループの後ろにキューされないようにします。
- Doctor は、プライマリモデル、フォールバック、heartbeat/subagent/compaction オーバーライド、フック、チャンネルモデルオーバーライド、古いセッションルートピン全体にわたって、従来の `openai-codex/*` モデル参照を正規の `openai/*` 参照へ書き換えます。`--fix` は Codex の意図を provider/model スコープの `agentRuntime.id: "codex"` エントリに移し、`openai-codex:...` などのセッション auth-profile ピンを保持し、古いエージェント全体/セッション runtime ピンを削除し、修復済みの OpenAI エージェント参照を、直接の OpenAI API-key 認証ではなく Codex auth routing のままにします。
- Doctor は古い OpenClaw バージョンによって作成された従来の Plugin 依存関係ステージング状態をクリーンアップします。また、`plugins.entries`、設定済みチャンネル、設定済み provider/search 設定、設定済み agent runtime など、設定から参照される不足したダウンロード可能 Plugin も修復します。パッケージ更新中、doctor はパッケージの入れ替えが完了するまで package-manager Plugin 修復をスキップします。設定済み Plugin にまだ復旧が必要な場合は、その後で `openclaw doctor --fix` を再実行してください。ダウンロードに失敗した場合、doctor はインストールエラーを報告し、次回の修復試行に備えて設定済み Plugin エントリを保持します。
- Doctor は、Plugin 探索が正常な場合、`plugins.allow`/`plugins.deny`/`plugins.entries` から不足した Plugin ID を削除し、対応するぶら下がったチャンネル設定、heartbeat ターゲット、チャンネルモデルオーバーライドも削除して、古い Plugin 設定を修復します。
- Doctor は、影響を受けた `plugins.entries.<id>` エントリを無効にし、不正な `config` ペイロードを削除することで、無効な Plugin 設定を隔離します。Gateway 起動時にはすでに、その不正な Plugin のみをスキップするため、他の Plugin とチャンネルは実行を継続できます。
- 別の supervisor が Gateway ライフサイクルを所有している場合は、`OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定します。Doctor は引き続き Gateway/サービスの健全性を報告し、非サービス修復を適用しますが、サービスの install/start/restart/bootstrap と従来のサービスクリーンアップはスキップします。
- Linux では、doctor は非アクティブな追加の Gateway 風 systemd unit を無視し、修復中に実行中の systemd Gateway サービスの command/entrypoint メタデータを書き換えません。アクティブなランチャーを意図的に置き換える場合は、先にサービスを停止するか、`openclaw gateway install --force` を使用してください。
- Doctor は従来のフラットな Talk 設定（`talk.voiceId`、`talk.modelId` など）を `talk.provider` + `talk.providers.<provider>` に自動移行します。
- `doctor --fix` の繰り返し実行は、唯一の違いがオブジェクトキーの順序である場合に、Talk 正規化を報告/適用しなくなりました。
- Doctor にはメモリ検索準備状況チェックが含まれており、埋め込み認証情報が不足している場合は `openclaw configure --section model` を推奨できます。
- Doctor はコマンド所有者が設定されていない場合に警告します。コマンド所有者は、所有者限定コマンドを実行し、危険な操作を承認できる人間のオペレーターアカウントです。DM ペアリングは誰かがボットと会話できるようにするだけです。first-owner bootstrap が存在する前に送信者を承認した場合は、`commands.ownerAllowFrom` を明示的に設定してください。
- Doctor は、Codex モードのエージェントが設定され、オペレーターの Codex home に個人の Codex CLI 資産が存在する場合に警告します。ローカルの Codex app-server 起動では、エージェントごとに分離された home を使用するため、意図的に昇格すべき資産のインベントリには `openclaw migrate codex --dry-run` を使用してください。
- Doctor は廃止された `plugins.entries.codex.config.codexDynamicToolsProfile` を削除します。Codex app-server は常に Codex ネイティブのワークスペースツールをネイティブのままにします。
- Doctor は、デフォルトエージェントに許可された Skills が、bins、env vars、config、OS 要件の不足により現在の runtime 環境で利用できない場合に警告します。`doctor --fix` は `skills.entries.<skill>.enabled=false` でそれらの利用できない Skills を無効にできます。Skill をアクティブに保ちたい場合は、不足している要件を代わりにインストール/設定してください。
- サンドボックスモードが有効で Docker が利用できない場合、doctor は修復策（`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`）付きの重要な警告を報告します。
- 従来のサンドボックス registry ファイル（`~/.openclaw/sandbox/containers.json` または `~/.openclaw/sandbox/browsers.json`）が存在する場合、doctor はそれらを報告します。`openclaw doctor --fix` は有効なエントリをシャード化された registry ディレクトリへ移行し、無効な従来ファイルを隔離します。
- `gateway.auth.token`/`gateway.auth.password` が SecretRef 管理で、現在のコマンドパスで利用できない場合、doctor は読み取り専用の警告を報告し、平文のフォールバック認証情報を書き込みません。
- 修正パスでチャンネル SecretRef 検査に失敗した場合、doctor は早期終了せずに続行し、警告を報告します。
- 状態ディレクトリ移行後、doctor は、有効なデフォルトの Telegram または Discord アカウントが env フォールバックに依存していて、`TELEGRAM_BOT_TOKEN` または `DISCORD_BOT_TOKEN` を doctor プロセスで利用できない場合に警告します。
- Telegram の `allowFrom` username 自動解決（`doctor --fix`）には、現在のコマンドパスで解決可能な Telegram トークンが必要です。トークン検査が利用できない場合、doctor は警告を報告し、その実行では自動解決をスキップします。

## macOS: `launchctl` env オーバーライド

以前に `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（または `...PASSWORD`）を実行した場合、その値が設定ファイルをオーバーライドし、永続的な「unauthorized」エラーの原因になることがあります。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway doctor](/ja-JP/gateway/doctor)
