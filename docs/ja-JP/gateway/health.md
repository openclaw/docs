---
read_when:
    - チャンネル接続性または Gateway ヘルスを診断しています
    - ヘルスチェック CLI コマンドとオプションを理解しています
summary: ヘルスチェックコマンドと Gateway ヘルス監視
title: ヘルスチェック
x-i18n:
    generated_at: "2026-04-24T04:57:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08278ff0079102459c4d9141dc2e8d89e731de1fc84487f6baa620aaf7c119b4
    source_path: gateway/health.md
    workflow: 15
---

# ヘルスチェック（CLI）

推測に頼らずにチャンネル接続性を確認するための短いガイドです。

## クイックチェック

- `openclaw status` — ローカルサマリー: Gateway 到達可能性/モード、更新ヒント、リンクされたチャンネル認証の経過時間、セッション + 最近のアクティビティ。
- `openclaw status --all` — 完全なローカル診断（読み取り専用、カラー表示、デバッグ用に安全に貼り付け可能）。
- `openclaw status --deep` — 実行中の Gateway にライブヘルスプローブ（`health` に `probe:true`）を要求します。対応していれば、アカウントごとのチャンネルプローブも含まれます。
- `openclaw health` — 実行中の Gateway にヘルススナップショットを要求します（WS のみ。CLI からチャンネルソケットへ直接接続はしません）。
- `openclaw health --verbose` — ライブヘルスプローブを強制し、Gateway 接続詳細を表示します。
- `openclaw health --json` — 機械可読なヘルススナップショット出力。
- WhatsApp/WebChat でスタンドアロンメッセージとして `/status` を送信すると、エージェントを起動せずにステータス返信を取得できます。
- ログ: `/tmp/openclaw/openclaw-*.log` を tail し、`web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound` で絞り込みます。

## 詳細診断

- ディスク上の認証情報: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（mtime は最近であるべきです）。
- セッションストア: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json`（パスは config で上書きされることがあります）。件数と最近の受信者は `status` で表示されます。
- 再リンク手順: ログにステータスコード 409–515 または `loggedOut` が現れた場合は `openclaw channels logout && openclaw channels login --verbose` を実行します。（注: QR ログインフローは、ペアリング後のステータス 515 に対して 1 回だけ自動再起動します。）
- 診断はデフォルトで有効です。`diagnostics.enabled: false` が設定されていない限り、Gateway は運用上の事実を記録します。メモリイベントは RSS/heap のバイト数、しきい値圧力、増加圧力を記録します。過大ペイロードイベントは、拒否、切り詰め、またはチャンク化された内容に加え、利用可能な場合はサイズと制限を記録します。メッセージ本文、添付内容、Webhook 本文、生のリクエストまたはレスポンス本文、トークン、Cookie、シークレット値は記録しません。同じ Heartbeat が制限付き安定性 recorder も開始し、これは `openclaw gateway stability` または `diagnostics.stability` Gateway RPC から利用できます。致命的な Gateway 終了、シャットダウンタイムアウト、再起動時の起動失敗では、イベントが存在する場合、最新の recorder スナップショットが `~/.openclaw/logs/stability/` 配下に永続化されます。最新の保存済みバンドルは `openclaw gateway stability --bundle latest` で確認してください。
- バグレポート用には、`openclaw gateway diagnostics export` を実行し、生成された zip を添付してください。このエクスポートは、Markdown サマリー、最新の安定性バンドル、サニタイズ済みログメタデータ、サニタイズ済み Gateway 状態/ヘルススナップショット、設定の形状をまとめたものです。共有されることを前提にしています。チャットテキスト、Webhook 本文、ツール出力、認証情報、Cookie、account/message ID、シークレット値は省略またはリダクトされます。詳しくは [Diagnostics Export](/ja-JP/gateway/diagnostics) を参照してください。

## ヘルスモニター設定

- `gateway.channelHealthCheckMinutes`: Gateway がチャンネルヘルスを確認する頻度。デフォルト: `5`。ヘルスモニターによる再起動をグローバルに無効にするには `0` を設定します。
- `gateway.channelStaleEventThresholdMinutes`: 接続済みチャンネルがどれだけアイドル状態を維持すると、ヘルスモニターが stale とみなして再起動するか。デフォルト: `30`。これは `gateway.channelHealthCheckMinutes` 以上にしてください。
- `gateway.channelMaxRestartsPerHour`: チャンネル/アカウントごとの、ヘルスモニターによる再起動の 1 時間あたりのローリング上限。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバル監視を有効にしたまま、特定チャンネルのヘルスモニター再起動を無効にします。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: チャンネルレベル設定より優先されるマルチアカウント上書き。
- これらのチャンネルごとの上書きは、現在それを公開している内蔵チャンネルモニターに適用されます: Discord、Google Chat、iMessage、Microsoft Teams、Signal、Slack、Telegram、WhatsApp。

## 何かが失敗したとき

- `logged out` またはステータス 409–515 → `openclaw channels logout` の後に `openclaw channels login` で再リンクします。
- Gateway に到達できない → 起動します: `openclaw gateway --port 18789`（ポートが使用中の場合は `--force` を使用）。
- 受信メッセージがない → リンクされたスマートフォンがオンラインであり、送信者が許可されていること（`channels.whatsapp.allowFrom`）を確認してください。グループチャットでは、許可リスト + メンションルールが一致していることを確認してください（`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`）。

## 専用の「health」コマンド

`openclaw health` は、実行中の Gateway にヘルススナップショットを要求します（CLI からチャンネル
ソケットへ直接接続はしません）。デフォルトでは、新しいキャッシュ済み Gateway スナップショットを返すことがあり、
その後 Gateway はそのキャッシュをバックグラウンドで更新します。`openclaw health --verbose` は
代わりにライブプローブを強制します。このコマンドは、利用可能であればリンク済み認証情報/認証の経過時間、
チャンネルごとのプローブサマリー、セッションストアサマリー、プローブ所要時間を報告します。Gateway に到達できないか、
プローブが失敗/タイムアウトした場合、非ゼロで終了します。

オプション:

- `--json`: 機械可読 JSON 出力
- `--timeout <ms>`: デフォルトの 10 秒プローブタイムアウトを上書き
- `--verbose`: ライブプローブを強制し、Gateway 接続詳細を表示
- `--debug`: `--verbose` のエイリアス

ヘルススナップショットには次が含まれます: `ok`（真偽値）、`ts`（タイムスタンプ）、`durationMs`（プローブ時間）、チャンネルごとの状態、エージェント可用性、セッションストアサマリー。

## 関連

- [Gateway runbook](/ja-JP/gateway)
- [Diagnostics export](/ja-JP/gateway/diagnostics)
- [Gateway troubleshooting](/ja-JP/gateway/troubleshooting)
