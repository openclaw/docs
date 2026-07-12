---
read_when:
    - チャネル接続または Gateway の正常性の診断
    - ヘルスチェック CLI のコマンドとオプションについて理解する
summary: ヘルスチェックコマンドとGatewayのヘルス監視
title: ヘルスチェック
x-i18n:
    generated_at: "2026-07-12T14:29:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6cc015fcd8dc002eafac95fb3e7aa0b6f3be5b9995e94438e2fed539a561931d
    source_path: gateway/health.md
    workflow: 16
---

推測せずにチャンネル接続を確認するための簡潔なガイドです。

## クイックチェック

- `openclaw status` - ローカル概要：Gateway の到達可能性／モード、更新のヒント、リンク済みチャンネル認証の経過時間、セッションと最近のアクティビティ。
- `openclaw status --all` - 完全なローカル診断（読み取り専用、カラー表示、デバッグ用に安全に貼り付け可能）。
- `openclaw status --deep` - 実行中の Gateway にライブプローブ（`probe:true` を指定した `health`）を要求します。対応している場合は、アカウントごとのチャンネルプローブも含まれます。
- `openclaw status --usage` - モデルプロバイダーの使用量／クォータのスナップショットを表示します。
- `openclaw health` - 実行中の Gateway にヘルススナップショットを要求します（WS のみ。CLI からチャンネルソケットへ直接接続しません）。
- `openclaw health --verbose`（別名 `--debug`）- ライブヘルスプローブを強制し、Gateway 接続の詳細を出力します。
- `openclaw health --json` - 機械可読なヘルススナップショットを出力します。
- 任意のチャンネルで `/status` を単独のチャットコマンドとして送信すると、エージェントを呼び出さずにステータス応答を取得できます。
- ログ：`/tmp/openclaw/openclaw-*.log` を追跡し、`web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound` でフィルタリングします。

Discord やその他のチャットプロバイダーでは、セッション行はソケットの稼働状態を示すものではありません。
`openclaw sessions`、Gateway の `sessions.list`、エージェントの `sessions_list` ツールは、
保存された会話状態を読み取ります。プロバイダーが再接続すると、新しいセッション行が作成される前でも、
チャンネルステータスが正常と表示される場合があります。ライブ接続の確認には、上記のチャンネルステータスと
ヘルスコマンドを使用してください。

## 詳細診断

- ディスク上の認証情報：`ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（mtime は最近の時刻である必要があります）。
- セッションストア：`ls -l ~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`。件数と最近の受信者は `status` で表示されます。
- 再リンク手順：ログにステータスコード 409-515 または `loggedOut` が表示された場合は、`openclaw channels logout && openclaw channels login --verbose` を実行します。QR ログインフローは、ペアリング後にステータス 515 が発生すると一度だけ自動再起動します。
- 診断はデフォルトで有効です（`diagnostics.enabled: false` で無効化されます）。メモリイベントには RSS／ヒープのバイト数と、しきい値／増加圧力が記録されます。重大なメモリ圧力は Gateway ロガーを通じて記録され、`diagnostics.memoryPressureSnapshot: true` が設定されている場合は、OOM 発生前の安定性バンドル（V8 ヒープ統計、利用可能な場合は Linux cgroup カウンター、アクティブなリソース数、秘匿化された相対パスで示される最大のセッション／トランスクリプトファイル）も書き込まれます。稼働状態の警告には、プロセスは実行中だが飽和している場合のイベントループ遅延／使用率、CPU コア比率、アクティブ／待機中／キュー内のセッション数が記録されます。過大なペイロードのイベントには、拒否／切り詰め／分割された対象と、そのサイズおよび制限が記録されますが、メッセージ本文、添付ファイルの内容、Webhook 本文、生のリクエスト／レスポンス本文、トークン、Cookie、シークレット値は決して記録されません。
- 同じ Heartbeat がサイズ制限付きの安定性レコーダーを駆動します：`openclaw gateway stability`（または `diagnostics.stability` Gateway RPC）。致命的な Gateway 終了、シャットダウンのタイムアウト、再起動時の起動失敗、および（`diagnostics.memoryPressureSnapshot: true` の場合は）重大なメモリ圧力が発生すると、最新のスナップショットが `~/.openclaw/logs/stability/` に保存されます。最新のバンドルは `openclaw gateway stability --bundle latest` で確認します。
- バグ報告では、`openclaw gateway diagnostics export` を実行し、生成された zip を添付してください。zip には Markdown の概要、最新の安定性バンドル、サニタイズ済みログメタデータ、サニタイズ済み Gateway ステータス／ヘルススナップショット、設定の構造が含まれます。チャット本文、Webhook 本文、ツール出力、認証情報、Cookie、アカウント／メッセージ識別子、シークレット値は省略または秘匿化されます。[診断エクスポート](/ja-JP/gateway/diagnostics)を参照してください。

## ヘルスモニター設定

- `gateway.channelHealthCheckMinutes`：Gateway がチャンネルのヘルスを確認する間隔。デフォルト：`5`。グローバルにヘルスモニターによる再起動を無効化するには `0` に設定します。
- `gateway.channelStaleEventThresholdMinutes`：接続済みチャンネルがアイドル状態のままでいられる時間。この時間を超えると、ヘルスモニターはそのチャンネルを停滞状態とみなし、再起動します。デフォルト：`30`。`gateway.channelHealthCheckMinutes` 以上に設定してください。
- `gateway.channelMaxRestartsPerHour`：チャンネル／アカウントごとのヘルスモニターによる再起動回数について、ローリング方式で適用される 1 時間あたりの上限。デフォルト：`10`。
- `channels.<provider>.healthMonitor.enabled`：グローバル監視を有効にしたまま、特定のチャンネルについてヘルスモニターによる再起動を無効化します。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：チャンネルレベルの設定より優先される、複数アカウント向けのオーバーライド。
- これらのチャンネルごとのオーバーライドは、現在この機能を公開している組み込みチャンネル（Discord、Google Chat、iMessage、IRC、Microsoft Teams、Signal、Slack、Telegram、WhatsApp）に適用されます。

## 稼働時間の監視

外部の稼働時間監視サービスでは、`/v1/chat/completions` ではなく専用の `/health` エンドポイントを使用してください。

- **使用するもの：** `GET /health` - 即時応答、セッションは作成されず、LLM 呼び出しも行われず、`{"ok":true,"status":"live"}` を返します
- **使用しないもの：** ヘルスチェックでの `/v1/chat/completions` - 各リクエストで、スキルスナップショット、コンテキスト構築、LLM 呼び出しを伴う完全なエージェントセッションが作成されます

`x-openclaw-session-key` ヘッダーも `user` フィールドも指定されていない場合、`/v1/chat/completions` はリクエストごとに新しいランダムなセッションを生成します。15 分ごとに ping する監視サービスでは、1 日あたり約 96 個のセッションが作成され、それぞれ 4-22KB を消費します。時間の経過とともにセッションストアが肥大化し、コンテキストウィンドウのオーバーフローにつながる可能性があります。

### 監視サービスの設定例

- **BetterStack：** ヘルスチェック URL を `https://<your-gateway-host>:<port>/health` に設定します
- **UptimeRobot：** URL `https://<your-gateway-host>:<port>/health` を指定して新しい HTTP モニターを追加します
- **汎用：** Gateway が正常な場合、`/health` への任意の HTTP GET は `{"ok":true}` とともに 200 を返します

## 問題が発生した場合

- `logged out` またはステータス 409-515 -> `openclaw channels logout` を実行してから `openclaw channels login` を実行し、再リンクします。
- Gateway に到達できない -> 起動します：`openclaw gateway --port 18789`（ポートが使用中の場合は `--force` を使用します）。
- 受信メッセージがない -> リンク済みの電話がオンラインであり、送信者が許可されていることを確認します（`channels.whatsapp.allowFrom`）。グループチャットでは、許可リストとメンションルールが一致していることを確認します（`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`）。

## 専用の「health」コマンド

`openclaw health` は、実行中の Gateway にヘルススナップショットを要求します（CLI から
チャンネルソケットへ直接接続しません）。デフォルトでは、最新のキャッシュ済み Gateway スナップショットを返し、
Gateway はそのキャッシュをバックグラウンドで更新します。`--verbose` を指定すると、代わりにライブプローブを強制します。
このコマンドは、利用可能な場合はリンク済み認証情報／認証の経過時間、チャンネルごとのプローブ概要、
セッションストアの概要、プローブの所要時間を報告します。Gateway に到達できない場合、またはプローブが
失敗／タイムアウトした場合は、0 以外の終了コードで終了します。

オプション：

- `--json`：機械可読な JSON 出力
- `--timeout <ms>`：デフォルトの 10s プローブタイムアウトを上書き
- `--verbose`：ライブプローブを強制し、Gateway 接続の詳細を出力
- `--debug`：`--verbose` の別名

ヘルススナップショットには、`ok`（真偽値）、`ts`（タイムスタンプ）、`durationMs`（プローブ時間）、チャンネルごとのステータス、エージェントの可用性、セッションストアの概要が含まれます。

## 関連項目

- [Gateway 運用手順書](/ja-JP/gateway)
- [診断エクスポート](/ja-JP/gateway/diagnostics)
- [Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting)
