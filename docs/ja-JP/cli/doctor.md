---
read_when:
    - 接続/認証の問題があり、ガイド付きの修正が必要な場合
    - 更新後に妥当性を確認したい場合
summary: '`openclaw doctor` のCLIリファレンス（ヘルスチェック + ガイド付き修復）'
title: 診断
x-i18n:
    generated_at: "2026-05-12T08:45:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90050276597a50abcc3638e7b7b50f29ef0682f5da30d33d5dca3ad6117173e0
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

チャンネル固有の権限には、`doctor` の代わりにチャンネルプローブを使用します。

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

対象を指定した Discord 機能プローブは、ボットの実効チャンネル権限を報告します。ステータスプローブは、設定済みの Discord チャンネルと音声自動参加ターゲットを監査します。

## オプション

- `--no-workspace-suggestions`: ワークスペースメモリ/検索候補を無効化する
- `--yes`: プロンプトなしでデフォルトを受け入れる
- `--repair`: プロンプトなしで推奨される非サービス修復を適用する。Gateway サービスのインストールと書き換えには、引き続き対話的な確認または明示的な Gateway コマンドが必要
- `--fix`: `--repair` のエイリアス
- `--force`: 必要に応じてカスタムサービス設定の上書きを含む、積極的な修復を適用する
- `--non-interactive`: プロンプトなしで実行する。安全な移行と非サービス修復のみ
- `--generate-gateway-token`: Gateway トークンを生成して設定する
- `--deep`: 追加の Gateway インストールについてシステムサービスをスキャンし、最近の Gateway スーパーバイザー再起動ハンドオフを報告する

注:

- Nix モード（`OPENCLAW_NIX_MODE=1`）では、読み取り専用の doctor チェックは引き続き動作しますが、`openclaw.json` が不変であるため、`doctor --fix`、`doctor --repair`、`doctor --yes`、`doctor --generate-gateway-token` は無効になります。代わりにこのインストールの Nix ソースを編集してください。nix-openclaw では、エージェント優先の [クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start) を使用してください。
- 対話プロンプト（キーチェーン/OAuth 修正など）は、stdin が TTY で、`--non-interactive` が設定されて**いない**場合にのみ実行されます。ヘッドレス実行（cron、Telegram、端末なし）ではプロンプトをスキップします。
- パフォーマンス: 非対話型の `doctor` 実行では積極的な Plugin 読み込みをスキップするため、ヘッドレスヘルスチェックは高速に保たれます。対話セッションでは、チェックが Plugin の寄与を必要とするときに引き続き Plugin を完全に読み込みます。
- `--fix`（`--repair` のエイリアス）は `~/.openclaw/openclaw.json.bak` にバックアップを書き込み、不明な設定キーを削除し、各削除を一覧表示します。
- `doctor --fix --non-interactive` は、欠落または古い Gateway サービス定義を報告しますが、更新修復モード以外ではそれらをインストールまたは書き換えません。サービスが欠落している場合は `openclaw gateway install` を実行し、ランチャーを意図的に置き換える場合は `openclaw gateway install --force` を実行します。
- 状態整合性チェックは、sessions ディレクトリ内の孤立した transcript ファイルを検出するようになりました。それらを `.deleted.<timestamp>` としてアーカイブするには対話的な確認が必要です。`--fix`、`--yes`、ヘッドレス実行ではそのまま残します。
- Doctor は `~/.openclaw/cron/jobs.json`（または `cron.store`）もスキャンして、レガシー cron ジョブ形状を検出し、スケジューラーが実行時に自動正規化する前にその場で書き換えられます。
- Linux では、ユーザーの crontab がレガシーの `~/.openclaw/bin/ensure-whatsapp.sh` をまだ実行している場合、doctor は警告します。このスクリプトはもう保守されておらず、cron に systemd ユーザーバス環境がない場合、WhatsApp Gateway の誤った停止をログに記録することがあります。
- WhatsApp が有効な場合、doctor はローカルの `openclaw-tui` クライアントがまだ動作している状態で Gateway イベントループが劣化していないかを確認します。`doctor --fix` は検証済みのローカル TUI クライアントのみを停止し、WhatsApp の返信が古い TUI 更新ループの後ろにキューされないようにします。
- Doctor は、プライマリモデル、フォールバック、heartbeat/subagent/compaction のオーバーライド、hooks、チャンネルモデルのオーバーライド、古いセッションルートピン全体で、レガシーの `openai-codex/*` モデル参照を正規の `openai/*` 参照へ書き換えます。`--fix` は Codex の意図を provider/model スコープの `agentRuntime.id: "codex"` エントリへ移動し、`openai-codex:...` などのセッション auth-profile ピンを保持し、古いエージェント全体/セッション runtime ピンを削除し、修復された OpenAI エージェント参照を直接の OpenAI API キー認証ではなく Codex 認証ルーティングに維持します。
- Doctor は、古い OpenClaw バージョンによって作成されたレガシー Plugin 依存関係ステージング状態をクリーンアップし、ピア依存関係として宣言している managed npm Plugin 用にホストの `openclaw` パッケージを再リンクします。また、`plugins.entries`、設定済みチャンネル、設定済み provider/search 設定、設定済みエージェント runtime など、設定で参照されている欠落したダウンロード可能 Plugin も修復します。パッケージ更新中、doctor はパッケージ交換が完了するまで package-manager Plugin 修復をスキップします。設定済み Plugin にまだ復旧が必要な場合は、その後 `openclaw doctor --fix` を再実行してください。ダウンロードに失敗した場合、doctor はインストールエラーを報告し、次回の修復試行のために設定済み Plugin エントリを保持します。
- Doctor は、Plugin 検出が正常な場合に、`plugins.allow`/`plugins.deny`/`plugins.entries` から欠落した Plugin ID を削除し、対応する宙ぶらりんのチャンネル設定、heartbeat ターゲット、チャンネルモデルのオーバーライドも削除して、古い Plugin 設定を修復します。
- Doctor は、影響を受ける `plugins.entries.<id>` エントリを無効化し、その無効な `config` ペイロードを削除することで、無効な Plugin 設定を隔離します。Gateway 起動は既にその問題のある Plugin だけをスキップするため、他の Plugin とチャンネルは実行を継続できます。
- 別のスーパーバイザーが Gateway ライフサイクルを所有している場合は、`OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定します。Doctor は引き続き Gateway/サービスの健全性を報告し、非サービス修復を適用しますが、サービスの install/start/restart/bootstrap とレガシーサービスのクリーンアップはスキップします。
- Linux では、doctor は非アクティブな追加の Gateway 風 systemd ユニットを無視し、修復中に実行中の systemd Gateway サービスの command/entrypoint メタデータを書き換えません。アクティブなランチャーを意図的に置き換える場合は、先にサービスを停止するか、`openclaw gateway install --force` を使用してください。
- Doctor は、レガシーのフラットな Talk 設定（`talk.voiceId`、`talk.modelId` など）を `talk.provider` + `talk.providers.<provider>` に自動移行します。
- `doctor --fix` を繰り返し実行しても、違いがオブジェクトキー順序だけの場合は Talk 正規化を報告/適用しなくなりました。
- Doctor には memory-search 準備状態チェックが含まれ、embedding 認証情報が欠落している場合に `openclaw configure --section model` を推奨できます。
- Doctor は、コマンド所有者が設定されていない場合に警告します。コマンド所有者は、所有者専用コマンドの実行と危険な操作の承認を許可された人間のオペレーターアカウントです。DM ペアリングは誰かがボットと会話できるようにするだけです。first-owner bootstrap が存在する前に送信者を承認していた場合は、`commands.ownerAllowFrom` を明示的に設定してください。
- Doctor は、Codex モードのエージェントが設定され、オペレーターの Codex home に個人用 Codex CLI アセットが存在する場合に警告します。ローカル Codex app-server 起動は分離されたエージェントごとの home を使用するため、意図的に昇格すべきアセットを一覧化するには `openclaw migrate codex --dry-run` を使用してください。
- Doctor は廃止された `plugins.entries.codex.config.codexDynamicToolsProfile` を削除します。Codex app-server は常に Codex ネイティブのワークスペースツールをネイティブのまま維持します。
- Doctor は、デフォルトエージェントに許可された Skills が、bin、環境変数、設定、OS 要件の欠落により現在の runtime 環境で利用できない場合に警告します。`doctor --fix` は `skills.entries.<skill>.enabled=false` でそれらの利用不可 Skills を無効化できます。Skill を有効なまま維持したい場合は、不足している要件を代わりにインストール/設定してください。
- sandbox モードが有効だが Docker が利用できない場合、doctor は修復方法（`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`）を含む高シグナルの警告を報告します。
- レガシー sandbox レジストリファイル（`~/.openclaw/sandbox/containers.json` または `~/.openclaw/sandbox/browsers.json`）が存在する場合、doctor はそれらを報告します。`openclaw doctor --fix` は有効なエントリをシャード化されたレジストリディレクトリへ移行し、無効なレガシーファイルを隔離します。
- `gateway.auth.token`/`gateway.auth.password` が SecretRef 管理で、現在のコマンドパスで利用できない場合、doctor は読み取り専用の警告を報告し、平文のフォールバック認証情報を書き込みません。
- 修正パスでチャンネル SecretRef 検査に失敗した場合、doctor は早期終了せずに続行し、警告を報告します。
- 状態ディレクトリ移行後、doctor は、有効なデフォルト Telegram または Discord アカウントが env フォールバックに依存しており、`TELEGRAM_BOT_TOKEN` または `DISCORD_BOT_TOKEN` が doctor プロセスから利用できない場合に警告します。
- Telegram `allowFrom` ユーザー名の自動解決（`doctor --fix`）には、現在のコマンドパスで解決可能な Telegram トークンが必要です。トークン検査を利用できない場合、doctor は警告を報告し、そのパスでの自動解決をスキップします。

## macOS: `launchctl` env オーバーライド

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
