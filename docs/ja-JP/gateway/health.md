---
read_when:
    - チャネル接続または Gateway の健全性の診断
    - OpenClaw health check CLI コマンドとオプションを理解する
summary: ヘルスチェックコマンドと Gateway のヘルス監視
title: ヘルスチェック
x-i18n:
    generated_at: "2026-06-27T11:29:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d6475bef9fead191c11a801151d4fab76c47034d3f30f90a18c15d6e32b5d26
    source_path: gateway/health.md
    workflow: 16
---

チャンネル接続性を推測せずに確認するための短いガイド。

## クイックチェック

- `openclaw status` — ローカル概要: gateway の到達性/モード、更新ヒント、リンク済みチャンネル認証の経過時間、セッション + 最近のアクティビティ。
- `openclaw status --all` — 完全なローカル診断（読み取り専用、カラー表示、デバッグ用に貼り付けても安全）。
- `openclaw status --deep` — 実行中の gateway にライブヘルスプローブ（`probe:true` 付きの `health`）を要求し、対応している場合はアカウントごとのチャンネルプローブも含める。
- `openclaw health` — 実行中の gateway にヘルススナップショットを要求する（WS のみ。CLI からチャンネルソケットへ直接接続しない）。
- `openclaw health --verbose` — ライブヘルスプローブを強制し、gateway 接続の詳細を出力する。
- `openclaw health --json` — 機械可読のヘルススナップショット出力。
- WhatsApp/WebChat で `/status` を単独メッセージとして送信すると、エージェントを呼び出さずにステータス返信を取得できる。
- ログ: `/tmp/openclaw/openclaw-*.log` を tail し、`web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound` でフィルターする。

Discord やその他のチャットプロバイダーでは、セッション行はソケットの生存状態ではない。
`openclaw sessions`、Gateway の `sessions.list`、エージェントの `sessions_list` ツールは、保存された会話状態を読み取る。プロバイダーは再接続し、新しいセッション行が実体化される前に健全なチャンネルステータスを表示できる。ライブ接続チェックには、上記のチャンネルステータスとヘルスコマンドを使用する。

## 詳細診断

- ディスク上の認証情報: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（mtime は最近であるべき）。
- セッションストア: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json`（パスは設定で上書きできる）。件数と最近の受信者は `status` で表示される。
- 再リンクフロー: ステータスコード 409–515、またはログに `loggedOut` が表示される場合は、`openclaw channels logout && openclaw channels login --verbose` を実行する。（注: QR ログインフローは、ペアリング後のステータス 515 に対して一度だけ自動再起動する。）
- 診断はデフォルトで有効。`diagnostics.enabled: false` が設定されていない限り、gateway は運用上の事実を記録する。メモリーイベントは RSS/ヒープのバイト数、しきい値プレッシャー、増加プレッシャーを記録する。重大なメモリープレッシャーは gateway logger 経由でログに記録される。`diagnostics.memoryPressureSnapshot: true` が設定されている場合、重大なメモリープレッシャーは、V8 ヒープ統計、利用可能な場合は Linux cgroup カウンター、アクティブなリソース数、リダクション済み相対パスで見た最大のセッション/トランスクリプトファイルを含む OOM 前の安定性バンドルも書き込む。生存性警告は、プロセスが実行中だが飽和している場合に、イベントループ遅延、イベントループ使用率、CPU コア比、アクティブ/待機中/キュー済みセッション数を記録する。過大ペイロードイベントは、拒否、切り詰め、またはチャンク化された内容に加え、利用可能な場合はサイズと制限を記録する。これらはメッセージ本文、添付ファイルの内容、webhook 本文、生のリクエストまたはレスポンス本文、トークン、Cookie、シークレット値を記録しない。同じ Heartbeat が境界付き安定性レコーダーを開始し、これは `openclaw gateway stability` または `diagnostics.stability` Gateway RPC から利用できる。致命的な Gateway 終了、シャットダウンのタイムアウト、再起動時の起動失敗は、イベントが存在する場合に最新のレコーダースナップショットを `~/.openclaw/logs/stability/` に永続化する。重大なメモリープレッシャーも、`diagnostics.memoryPressureSnapshot: true` が設定されている場合に限り同様に永続化する。最新の保存済みバンドルは `openclaw gateway stability --bundle latest` で検査する。
- バグレポートでは、`openclaw gateway diagnostics export` を実行し、生成された zip を添付する。エクスポートには、Markdown の概要、最新の安定性バンドル、サニタイズ済みログメタデータ、サニタイズ済み Gateway ステータス/ヘルススナップショット、設定形状が含まれる。共有を前提としており、チャット本文、webhook 本文、ツール出力、認証情報、Cookie、アカウント/メッセージ識別子、シークレット値は省略またはリダクションされる。[診断エクスポート](/ja-JP/gateway/diagnostics) を参照。

## ヘルスモニター設定

- `gateway.channelHealthCheckMinutes`: gateway がチャンネルヘルスを確認する頻度。デフォルト: `5`。ヘルスモニターによる再起動をグローバルに無効化するには `0` を設定する。
- `gateway.channelStaleEventThresholdMinutes`: 接続済みチャンネルがアイドル状態のままでいられる時間。この時間を超えると、ヘルスモニターはチャンネルを stale と見なして再起動する。デフォルト: `30`。これは `gateway.channelHealthCheckMinutes` 以上にする。
- `gateway.channelMaxRestartsPerHour`: チャンネル/アカウントごとのヘルスモニター再起動に対するローリング 1 時間上限。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバル監視を有効にしたまま、特定チャンネルのヘルスモニター再起動を無効化する。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: チャンネルレベルの設定より優先されるマルチアカウント上書き。
- これらのチャンネルごとの上書きは、現在それを公開している組み込みチャンネルモニターに適用される: Discord、Google Chat、iMessage、Microsoft Teams、Signal、Slack、Telegram、WhatsApp。

## アップタイム監視

外部アップタイム監視サービスは、`/v1/chat/completions` ではなく、専用の `/health` エンドポイントを使用するべき。

- **使用する:** `GET /health` — 即時レスポンス、セッション作成なし、LLM 呼び出しなし、`{"ok":true,"status":"live"}` を返す
- **使用しない:** ヘルスチェックに `/v1/chat/completions` を使用する — 各リクエストが、skill スナップショット、コンテキスト組み立て、LLM 呼び出しを含む完全なエージェントセッションを作成する

`x-openclaw-session-key` ヘッダーまたは `user` フィールドが提供されていない場合、`/v1/chat/completions` は各リクエストに対して新しいランダムセッションを生成する。15 分ごとに ping する監視サービスは 1 日あたり約 96 セッションを作成し、それぞれが 4–22KB を消費する。時間が経つと、これはセッションストアの肥大化を引き起こし、コンテキストウィンドウのオーバーフローにつながる可能性がある。

### 監視サービス設定例

- **BetterStack:** ヘルスチェック URL を `https://<your-gateway-host>:<port>/health` に設定する
- **UptimeRobot:** URL `https://<your-gateway-host>:<port>/health` で新しい HTTP モニターを追加する
- **汎用:** gateway が健全な場合、`/health` への任意の HTTP GET は `{"ok":true}` とともに 200 を返す

## 何かが失敗した場合

- `logged out` またはステータス 409–515 → `openclaw channels logout` の後に `openclaw channels login` で再リンクする。
- Gateway に到達できない → 起動する: `openclaw gateway --port 18789`（ポートが使用中の場合は `--force` を使用）。
- 受信メッセージがない → リンク済み電話がオンラインで、送信者が許可されていることを確認する（`channels.whatsapp.allowFrom`）。グループチャットでは、allowlist + メンションルールが一致していることを確認する（`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`）。

## 専用の「health」コマンド

`openclaw health` は、実行中の gateway にヘルススナップショットを要求する（CLI からチャンネルソケットへ直接接続しない）。デフォルトでは、新しいキャッシュ済み gateway スナップショットを返すことができ、その後 gateway はバックグラウンドでそのキャッシュを更新する。`openclaw health --verbose` は代わりにライブプローブを強制する。このコマンドは、利用可能な場合はリンク済み認証情報/認証の経過時間、チャンネルごとのプローブ概要、セッションストア概要、プローブ所要時間を報告する。gateway に到達できない場合、またはプローブが失敗/タイムアウトした場合は、非ゼロで終了する。

オプション:

- `--json`: 機械可読の JSON 出力
- `--timeout <ms>`: デフォルトの 10 秒プローブタイムアウトを上書きする
- `--verbose`: ライブプローブを強制し、gateway 接続の詳細を出力する
- `--debug`: `--verbose` のエイリアス

ヘルススナップショットには、`ok`（真偽値）、`ts`（タイムスタンプ）、`durationMs`（プローブ時間）、チャンネルごとのステータス、エージェント可用性、セッションストア概要が含まれる。

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [診断エクスポート](/ja-JP/gateway/diagnostics)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
