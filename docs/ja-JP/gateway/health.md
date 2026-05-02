---
read_when:
    - チャネル接続性またはGatewayの健全性の診断
    - ヘルスチェック CLI コマンドとオプションを理解する
summary: ヘルスチェックコマンドとGatewayのヘルス監視
title: ヘルスチェック
x-i18n:
    generated_at: "2026-05-02T20:47:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf1e0073a09592c6502f697e615f44d0f1a960caf4599888a8b72f22098c1e91
    source_path: gateway/health.md
    workflow: 16
---

接続状態を推測せずにチャネル接続性を確認するための短いガイド。

## クイックチェック

- `openclaw status` — ローカル要約: Gateway の到達性/モード、更新ヒント、リンク済みチャネル認証の経過時間、セッション + 最近のアクティビティ。
- `openclaw status --all` — 完全なローカル診断（読み取り専用、色付き、デバッグ用に貼り付けても安全）。
- `openclaw status --deep` — 実行中の Gateway にライブヘルスプローブ（`probe:true` 付きの `health`）を要求し、対応している場合はアカウントごとのチャネルプローブも含めます。
- `openclaw health` — 実行中の Gateway にヘルススナップショットを要求します（WS のみ。CLI から直接チャネルソケットには接続しません）。
- `openclaw health --verbose` — ライブヘルスプローブを強制し、Gateway 接続の詳細を出力します。
- `openclaw health --json` — 機械可読なヘルススナップショット出力。
- WhatsApp/WebChat で `/status` を単独メッセージとして送信すると、エージェントを起動せずにステータス返信を取得できます。
- ログ: `/tmp/openclaw/openclaw-*.log` を tail し、`web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound` でフィルターします。

Discord やその他のチャットプロバイダーでは、セッション行はソケットの生存性ではありません。
`openclaw sessions`、Gateway `sessions.list`、エージェントの `sessions_list` ツールは、保存された会話状態を読み取ります。
プロバイダーは、再接続して正常なチャネルステータスを表示していても、新しいセッション行がまだ作成されていない場合があります。
ライブ接続性チェックには、上記のチャネルステータスとヘルスコマンドを使用してください。

## 詳細診断

- ディスク上の認証情報: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（mtime は最近である必要があります）。
- セッションストア: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json`（パスは設定で上書きできます）。件数と最近の受信者は `status` で表示されます。
- 再リンクフロー: ステータスコード 409–515 または `loggedOut` がログに表示される場合は、`openclaw channels logout && openclaw channels login --verbose` を実行します。（注: QR ログインフローは、ペアリング後のステータス 515 に対して一度だけ自動再起動します。）
- 診断はデフォルトで有効です。`diagnostics.enabled: false` が設定されていない限り、Gateway は運用上の事実を記録します。メモリーイベントは RSS/ヒープのバイト数、しきい値プレッシャー、増加プレッシャーを記録します。生存性警告は、プロセスが実行中だが飽和している場合に、イベントループ遅延、イベントループ使用率、CPU コア比、アクティブ/待機中/キュー済みセッション数を記録します。過大ペイロードイベントは、拒否、切り詰め、またはチャンク化された内容に加え、利用可能な場合はサイズと制限を記録します。メッセージ本文、添付ファイルの内容、webhook 本文、生のリクエストまたはレスポンス本文、トークン、Cookie、秘密値は記録しません。同じ Heartbeat が境界付き安定性レコーダーを開始し、これは `openclaw gateway stability` または `diagnostics.stability` Gateway RPC から利用できます。致命的な Gateway 終了、シャットダウンタイムアウト、再起動時の起動失敗は、イベントが存在する場合、最新のレコーダースナップショットを `~/.openclaw/logs/stability/` 配下に永続化します。最新の保存済みバンドルを確認するには、`openclaw gateway stability --bundle latest` を使用してください。
- バグ報告では、`openclaw gateway diagnostics export` を実行し、生成された zip を添付してください。このエクスポートは、Markdown 要約、最新の安定性バンドル、サニタイズ済みログメタデータ、サニタイズ済み Gateway ステータス/ヘルススナップショット、設定形状をまとめます。共有を意図したものです。チャットテキスト、webhook 本文、ツール出力、認証情報、Cookie、アカウント/メッセージ識別子、秘密値は省略またはマスクされます。[診断エクスポート](/ja-JP/gateway/diagnostics)を参照してください。

## ヘルスモニター設定

- `gateway.channelHealthCheckMinutes`: Gateway がチャネルヘルスをチェックする頻度。デフォルト: `5`。ヘルスモニターによる再起動をグローバルに無効化するには `0` を設定します。
- `gateway.channelStaleEventThresholdMinutes`: 接続済みチャネルがアイドル状態のままでいられる時間。この時間を超えると、ヘルスモニターはチャネルを stale とみなして再起動します。デフォルト: `30`。これは `gateway.channelHealthCheckMinutes` 以上にしてください。
- `gateway.channelMaxRestartsPerHour`: チャネル/アカウントごとのヘルスモニター再起動について、ローリング 1 時間の上限。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバル監視は有効のまま、特定チャネルのヘルスモニター再起動を無効化します。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: チャネルレベル設定より優先されるマルチアカウント上書き。
- これらのチャネルごとの上書きは、現在それらを公開している組み込みチャネルモニターに適用されます: Discord、Google Chat、iMessage、Microsoft Teams、Signal、Slack、Telegram、WhatsApp。

## 何かが失敗した場合

- `logged out` またはステータス 409–515 → `openclaw channels logout` の後に `openclaw channels login` で再リンクします。
- Gateway に到達できない → 起動します: `openclaw gateway --port 18789`（ポートが使用中の場合は `--force` を使用）。
- 受信メッセージがない → リンク済みの電話がオンラインであり、送信者が許可されていることを確認します（`channels.whatsapp.allowFrom`）。グループチャットでは、許可リスト + メンションルールが一致していることを確認します（`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`）。

## 専用の「health」コマンド

`openclaw health` は、実行中の Gateway にヘルススナップショットを要求します（CLI から直接チャネルソケットには接続しません）。
デフォルトでは、新しいキャッシュ済み Gateway スナップショットを返すことがあります。その後、Gateway はバックグラウンドでそのキャッシュを更新します。
`openclaw health --verbose` は代わりにライブプローブを強制します。このコマンドは、利用可能な場合はリンク済み認証情報/認証の経過時間、チャネルごとのプローブ要約、セッションストア要約、プローブ時間を報告します。
Gateway に到達できない場合、またはプローブが失敗/タイムアウトした場合は、非ゼロで終了します。

オプション:

- `--json`: 機械可読な JSON 出力
- `--timeout <ms>`: デフォルトの 10 秒プローブタイムアウトを上書き
- `--verbose`: ライブプローブを強制し、Gateway 接続の詳細を出力
- `--debug`: `--verbose` のエイリアス

ヘルススナップショットには、`ok`（真偽値）、`ts`（タイムスタンプ）、`durationMs`（プローブ時間）、チャネルごとのステータス、エージェントの可用性、セッションストア要約が含まれます。

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [診断エクスポート](/ja-JP/gateway/diagnostics)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
