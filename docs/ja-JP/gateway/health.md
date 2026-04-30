---
read_when:
    - チャンネル接続性または Gateway の健全性を診断する
    - ヘルスチェック CLI コマンドとオプションを理解する
summary: ヘルスチェックコマンドとGatewayのヘルス監視
title: ヘルスチェック
x-i18n:
    generated_at: "2026-04-30T05:13:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: f34b91ef5d54b0fac7c451e46e07d36520a7d08fb0dce0538c6158d0bc6982b8
    source_path: gateway/health.md
    workflow: 16
---

推測なしでチャネル接続性を検証するための短いガイド。

## クイックチェック

- `openclaw status` — ローカル概要: Gateway の到達性/モード、更新ヒント、リンク済みチャネル認証の経過時間、セッション + 最近のアクティビティ。
- `openclaw status --all` — 完全なローカル診断 (読み取り専用、カラー、デバッグ用に貼り付けても安全)。
- `openclaw status --deep` — 実行中の Gateway にライブヘルスプローブ (`probe:true` を指定した `health`) を要求し、対応している場合はアカウントごとのチャネルプローブも含める。
- `openclaw health` — 実行中の Gateway にヘルススナップショットを要求する (WS のみ。CLI からチャネルソケットへ直接接続しない)。
- `openclaw health --verbose` — ライブヘルスプローブを強制し、Gateway 接続の詳細を表示する。
- `openclaw health --json` — 機械可読なヘルススナップショット出力。
- WhatsApp/WebChat で `/status` を単独メッセージとして送信すると、エージェントを呼び出さずにステータス返信を取得できる。
- ログ: `/tmp/openclaw/openclaw-*.log` を tail し、`web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound` でフィルターする。

## 詳細診断

- ディスク上の認証情報: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime は最近であるべき)。
- セッションストア: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (パスは設定で上書き可能)。件数と最近の受信者は `status` 経由で表示される。
- 再リンクフロー: ステータスコード 409-515 または `loggedOut` がログに現れた場合は、`openclaw channels logout && openclaw channels login --verbose` を実行する。(注: QR ログインフローは、ペアリング後のステータス 515 について 1 回だけ自動再起動する。)
- 診断はデフォルトで有効。`diagnostics.enabled: false` が設定されていない限り、Gateway は運用上の事実を記録する。メモリイベントは RSS/ヒープのバイト数、しきい値圧力、増加圧力を記録する。ライブネス警告は、プロセスが実行中だが飽和している場合に、イベントループ遅延、イベントループ使用率、CPU コア比率、アクティブ/待機中/キュー済みのセッション数を記録する。過大ペイロードイベントは、拒否、切り詰め、またはチャンク化された対象に加え、利用可能な場合はサイズと制限を記録する。メッセージ本文、添付ファイルの内容、Webhook 本文、生のリクエストまたはレスポンス本文、トークン、Cookie、シークレット値は記録しない。同じ Heartbeat が境界付きの安定性レコーダーを開始し、これは `openclaw gateway stability` または `diagnostics.stability` Gateway RPC から利用できる。致命的な Gateway 終了、シャットダウンタイムアウト、再起動時の起動失敗は、イベントが存在する場合、最新のレコーダースナップショットを `~/.openclaw/logs/stability/` 配下に永続化する。最新の保存済みバンドルは `openclaw gateway stability --bundle latest` で確認する。
- バグ報告では、`openclaw gateway diagnostics export` を実行し、生成された zip を添付する。このエクスポートは、Markdown 概要、最新の安定性バンドル、サニタイズ済みログメタデータ、サニタイズ済み Gateway ステータス/ヘルススナップショット、設定の形状をまとめる。共有を前提としており、チャットテキスト、Webhook 本文、ツール出力、認証情報、Cookie、アカウント/メッセージ識別子、シークレット値は省略または編集される。[診断エクスポート](/ja-JP/gateway/diagnostics)を参照。

## ヘルスモニター設定

- `gateway.channelHealthCheckMinutes`: Gateway がチャネルヘルスを確認する頻度。デフォルト: `5`。ヘルスモニターによる再起動をグローバルに無効化するには `0` を設定する。
- `gateway.channelStaleEventThresholdMinutes`: 接続済みチャネルがアイドル状態のままでいられる時間。この時間を超えると、ヘルスモニターは古い状態とみなして再起動する。デフォルト: `30`。これは `gateway.channelHealthCheckMinutes` 以上に保つ。
- `gateway.channelMaxRestartsPerHour`: チャネル/アカウントごとのヘルスモニター再起動に対する、ローリング 1 時間の上限。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバル監視は有効のまま、特定チャネルのヘルスモニター再起動を無効化する。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: チャネルレベル設定より優先されるマルチアカウント上書き。
- これらのチャネルごとの上書きは、現在それを公開している組み込みチャネルモニターに適用される: Discord、Google Chat、iMessage、Microsoft Teams、Signal、Slack、Telegram、WhatsApp。

## 何かが失敗した場合

- `logged out` またはステータス 409-515 → `openclaw channels logout` の後に `openclaw channels login` で再リンクする。
- Gateway に到達できない → 起動する: `openclaw gateway --port 18789` (ポートが使用中の場合は `--force` を使う)。
- 受信メッセージがない → リンク済み電話がオンラインで、送信者が許可されていることを確認する (`channels.whatsapp.allowFrom`)。グループチャットでは、許可リスト + メンションルールが一致していることを確認する (`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`)。

## 専用の「health」コマンド

`openclaw health` は、実行中の Gateway にヘルススナップショットを要求する (CLI からチャネルソケットへ直接接続しない)。デフォルトでは、新しいキャッシュ済み Gateway スナップショットを返すことがあり、その後 Gateway がバックグラウンドでそのキャッシュを更新する。`openclaw health --verbose` は、代わりにライブプローブを強制する。このコマンドは、利用可能な場合にリンク済み認証情報/認証の経過時間、チャネルごとのプローブ概要、セッションストア概要、プローブ時間を報告する。Gateway に到達できない、またはプローブが失敗/タイムアウトした場合は、非ゼロで終了する。

オプション:

- `--json`: 機械可読な JSON 出力
- `--timeout <ms>`: デフォルトの 10 秒プローブタイムアウトを上書きする
- `--verbose`: ライブプローブを強制し、Gateway 接続の詳細を表示する
- `--debug`: `--verbose` のエイリアス

ヘルススナップショットには、`ok` (boolean)、`ts` (timestamp)、`durationMs` (プローブ時間)、チャネルごとのステータス、エージェントの可用性、セッションストア概要が含まれる。

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [診断エクスポート](/ja-JP/gateway/diagnostics)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
