---
read_when:
    - 接続/認証の問題があり、ガイド付きの修正を利用したい
    - 更新後に簡易確認をしたい場合
summary: '`openclaw doctor` の CLI リファレンス（ヘルスチェック + ガイド付き修復）'
title: 診断
x-i18n:
    generated_at: "2026-05-05T08:25:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6101008d1cb7e08f9902a8a29785710f325966524b003b87b5c628fe906ab78
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway とチャネルのヘルスチェック + クイック修正。

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
- `--yes`: 確認せずにデフォルトを受け入れる
- `--repair`: 推奨される非サービス修復を確認なしで適用する。Gateway サービスのインストールと書き換えには、引き続き対話的な確認または明示的な Gateway コマンドが必要
- `--fix`: `--repair` のエイリアス
- `--force`: 必要に応じてカスタムサービス設定の上書きを含む、強力な修復を適用する
- `--non-interactive`: プロンプトなしで実行する。安全な移行と非サービス修復のみ
- `--generate-gateway-token`: Gateway トークンを生成して設定する
- `--deep`: 追加の Gateway インストールがないかシステムサービスをスキャンし、最近の Gateway スーパーバイザー再起動ハンドオフを報告する

注記:

- 対話型プロンプト（キーチェーン/OAuth 修正など）は、stdin が TTY で、`--non-interactive` が設定されていない場合にのみ実行される。ヘッドレス実行（cron、Telegram、端末なし）ではプロンプトをスキップする。
- パフォーマンス: 非対話型の `doctor` 実行では、ヘッドレスのヘルスチェックを高速に保つために積極的な Plugin 読み込みをスキップする。対話型セッションでは、チェックが Plugin からの寄与を必要とする場合、引き続き Plugin を完全に読み込む。
- `--fix`（`--repair` のエイリアス）はバックアップを `~/.openclaw/openclaw.json.bak` に書き込み、不明な設定キーを削除し、削除ごとに一覧表示する。
- `doctor --fix --non-interactive` は、欠落または古くなった Gateway サービス定義を報告するが、更新修復モード以外ではインストールや書き換えを行わない。サービスが欠落している場合は `openclaw gateway install` を実行し、ランチャーを意図的に置き換える場合は `openclaw gateway install --force` を実行する。
- 状態整合性チェックは、セッションディレクトリ内の孤立したトランスクリプトファイルを検出するようになった。それらを `.deleted.<timestamp>` としてアーカイブするには対話的な確認が必要であり、`--fix`、`--yes`、ヘッドレス実行ではそのまま残す。
- doctor は `~/.openclaw/cron/jobs.json`（または `cron.store`）もスキャンしてレガシー cron ジョブ形状を検出し、スケジューラーが実行時に自動正規化する前にその場で書き換えられる。
- Linux では、ユーザーの crontab がまだレガシーの `~/.openclaw/bin/ensure-whatsapp.sh` を実行している場合、doctor は警告する。このスクリプトはもう保守されておらず、cron に systemd ユーザーバス環境がない場合に WhatsApp Gateway の誤った停止をログに記録することがある。
- WhatsApp が有効な場合、doctor はローカルの `openclaw-tui` クライアントがまだ実行中で、Gateway イベントループが劣化していないか確認する。`doctor --fix` は検証済みのローカル TUI クライアントだけを停止するため、WhatsApp の返信が古い TUI 更新ループの後ろでキューに滞留しない。
- doctor は、古い OpenClaw バージョンで作成されたレガシー Plugin 依存関係ステージング状態をクリーンアップする。また、`plugins.entries`、設定済みチャネル、設定済みプロバイダー/検索設定、設定済みエージェントランタイムなど、設定から参照されている欠落したダウンロード可能な Plugin を修復する。パッケージ更新中は、パッケージの入れ替えが完了するまで doctor はパッケージマネージャーによる Plugin 修復をスキップする。設定済み Plugin の復旧がまだ必要な場合は、その後で `openclaw doctor --fix` を再実行する。ダウンロードに失敗した場合、doctor はインストールエラーを報告し、次の修復試行のために設定済み Plugin エントリを保持する。
- doctor は、Plugin 検出が正常な場合に、欠落した Plugin ID を `plugins.allow`/`plugins.entries` から削除し、対応するぶら下がったチャネル設定、Heartbeat ターゲット、チャネルモデルオーバーライドも削除して、古い Plugin 設定を修復する。
- doctor は、影響を受ける `plugins.entries.<id>` エントリを無効化し、無効な `config` ペイロードを削除することで、無効な Plugin 設定を隔離する。Gateway 起動時には、その問題のある Plugin だけを既にスキップするため、他の Plugin とチャネルは実行を継続できる。
- 別のスーパーバイザーが Gateway ライフサイクルを所有している場合は、`OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定する。doctor は引き続き Gateway/サービスの健全性を報告し、非サービス修復を適用するが、サービスのインストール/開始/再起動/ブートストラップとレガシーサービスのクリーンアップはスキップする。
- Linux では、doctor は非アクティブな追加の Gateway 風 systemd ユニットを無視し、修復中に実行中の systemd Gateway サービスのコマンド/エントリポイントメタデータを書き換えない。アクティブなランチャーを意図的に置き換える場合は、まずサービスを停止するか、`openclaw gateway install --force` を使用する。
- doctor は、レガシーのフラットな Talk 設定（`talk.voiceId`、`talk.modelId` など）を `talk.provider` + `talk.providers.<provider>` に自動移行する。
- `doctor --fix` を繰り返し実行しても、差分がオブジェクトキー順序だけの場合は Talk 正規化を報告/適用しなくなった。
- doctor にはメモリ検索準備チェックが含まれ、埋め込み認証情報が欠落している場合に `openclaw configure --section model` を推奨できる。
- コマンド所有者が設定されていない場合、doctor は警告する。コマンド所有者は、所有者専用コマンドの実行と危険な操作の承認を許可された人間のオペレーターアカウントである。DM ペアリングは誰かがボットと会話できるようにするだけであり、最初の所有者ブートストラップが存在する前に送信者を承認した場合は、`commands.ownerAllowFrom` を明示的に設定する。
- Codex モードのエージェントが設定され、オペレーターの Codex ホームに個人用 Codex CLI アセットが存在する場合、doctor は警告する。ローカルの Codex アプリサーバー起動では、エージェントごとに分離されたホームを使用するため、意図的に昇格すべきアセットを棚卸しするには `openclaw migrate codex --dry-run` を使用する。
- デフォルトエージェントに許可された Skills が、bin、環境変数、設定、または OS 要件の欠落により現在のランタイム環境で利用できない場合、doctor は警告する。`doctor --fix` は `skills.entries.<skill>.enabled=false` でそれらの利用不能な Skills を無効化できる。Skills を有効なままにしたい場合は、代わりに欠落している要件をインストール/設定する。
- サンドボックスモードが有効だが Docker が利用できない場合、doctor は修復方法（`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`）を含む高シグナルの警告を報告する。
- レガシーサンドボックスレジストリファイル（`~/.openclaw/sandbox/containers.json` または `~/.openclaw/sandbox/browsers.json`）が存在する場合、doctor はそれらを報告する。`openclaw doctor --fix` は有効なエントリをシャード化されたレジストリディレクトリへ移行し、無効なレガシーファイルを隔離する。
- `gateway.auth.token`/`gateway.auth.password` が SecretRef 管理で、現在のコマンドパスで利用できない場合、doctor は読み取り専用の警告を報告し、プレーンテキストのフォールバック認証情報を書き込まない。
- 修正パスでチャネル SecretRef の検査に失敗した場合、doctor は早期終了せずに続行し、警告を報告する。
- 状態ディレクトリ移行後、有効なデフォルト Telegram または Discord アカウントが環境フォールバックに依存しており、`TELEGRAM_BOT_TOKEN` または `DISCORD_BOT_TOKEN` が doctor プロセスで利用できない場合、doctor は警告する。
- Telegram の `allowFrom` ユーザー名自動解決（`doctor --fix`）には、現在のコマンドパスで解決可能な Telegram トークンが必要である。トークン検査が利用できない場合、doctor は警告を報告し、そのパスでは自動解決をスキップする。

## macOS: `launchctl` 環境オーバーライド

以前に `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（または `...PASSWORD`）を実行していた場合、その値は設定ファイルより優先され、永続的な「unauthorized」エラーの原因になることがある。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway doctor](/ja-JP/gateway/doctor)
