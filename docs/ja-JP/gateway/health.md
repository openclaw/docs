---
read_when:
    - チャネル接続性または Gateway ヘルスの診断
    - ヘルスチェック CLI コマンドとオプションの理解
summary: ヘルスチェックコマンドと Gateway ヘルス監視
title: ヘルスチェック
x-i18n:
    generated_at: "2026-07-05T11:21:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 930bd0f5b91bd4e7abb79a3e0f13eb59317023b796106cf0f0fdc0af51d657fe
    source_path: gateway/health.md
    workflow: 16
---

推測に頼らずチャネル接続性を検証するための短いガイド。

## クイックチェック

- `openclaw status` - ローカル概要: Gateway の到達性/モード、更新ヒント、リンク済みチャネル認証の経過時間、セッション + 最近のアクティビティ。
- `openclaw status --all` - 完全なローカル診断 (読み取り専用、カラー表示、デバッグ用に貼り付けても安全)。
- `openclaw status --deep` - 稼働中の Gateway にライブプローブ (`health` with `probe:true`) を要求し、対応している場合はアカウント別のチャネルプローブも含めます。
- `openclaw status --usage` - モデルプロバイダーの使用量/クォータのスナップショットを表示します。
- `openclaw health` - 稼働中の Gateway にヘルススナップショットを要求します (WS のみ。CLI から直接チャネルソケットには接続しません)。
- `openclaw health --verbose` (alias `--debug`) - ライブヘルスプローブを強制し、Gateway 接続の詳細を出力します。
- `openclaw health --json` - 機械可読のヘルススナップショット出力。
- 任意のチャネルでスタンドアロンのチャットコマンドとして `/status` を送信すると、エージェントを呼び出さずにステータス返信を取得できます。
- ログ: `/tmp/openclaw/openclaw-*.log` を tail し、`web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound` でフィルターします。

Discord やその他のチャットプロバイダーでは、セッション行はソケットの生存性を示しません。
`openclaw sessions`、Gateway `sessions.list`、エージェントの `sessions_list` ツールは
保存済みの会話状態を読み取ります。プロバイダーは再接続し、新しいセッション行が作成される前に
正常なチャネルステータスを表示できます。ライブ接続チェックには、上記のチャネルステータスと
ヘルスコマンドを使用してください。

## 詳細診断

- ディスク上の認証情報: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime は最近であるべきです)。
- セッションストア: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (パスは config で上書きできます)。件数と最近の受信者は `status` 経由で表示されます。
- 再リンクフロー: ステータスコード 409-515 または `loggedOut` がログに表示された場合は、`openclaw channels logout && openclaw channels login --verbose` を実行します。QR ログインフローは、ペアリング後のステータス 515 に対して一度だけ自動再起動します。
- 診断はデフォルトで有効です (`diagnostics.enabled: false` で無効化)。メモリイベントは RSS/ヒープのバイト数としきい値/増加圧力を記録します。重大なメモリ圧力は Gateway ロガー経由で記録され、`diagnostics.memoryPressureSnapshot: true` が設定されている場合は、OOM 前の安定性バンドル (V8 ヒープ統計、利用可能な場合は Linux cgroup カウンター、アクティブリソース数、リダクション済み相対パスごとの最大セッション/トランスクリプトファイル) も書き込みます。生存性警告は、プロセスは実行中だが飽和している場合に、イベントループ遅延/使用率、CPU コア比率、アクティブ/待機中/キュー済みセッション数を記録します。過大ペイロードイベントは、拒否/切り詰め/チャンク化された内容とサイズおよび制限を記録しますが、メッセージ本文、添付ファイル内容、Webhook 本文、生のリクエスト/レスポンス本文、トークン、Cookie、シークレット値は記録しません。
- 同じ Heartbeat が、境界付き安定性レコーダーを駆動します: `openclaw gateway stability` (または `diagnostics.stability` Gateway RPC)。致命的な Gateway 終了、シャットダウンタイムアウト、再起動時の起動失敗、および (`diagnostics.memoryPressureSnapshot: true` の場合) 重大なメモリ圧力は、最新スナップショットを `~/.openclaw/logs/stability/` に永続化します。最新バンドルは `openclaw gateway stability --bundle latest` で確認します。
- バグ報告では、`openclaw gateway diagnostics export` を実行し、生成された zip を添付してください。これには Markdown サマリー、最新の安定性バンドル、サニタイズ済みログメタデータ、サニタイズ済み Gateway ステータス/ヘルススナップショット、config 形状が含まれます。チャット本文、Webhook 本文、ツール出力、認証情報、Cookie、アカウント/メッセージ識別子、シークレット値は省略またはリダクションされます。[診断エクスポート](/ja-JP/gateway/diagnostics)を参照してください。

## ヘルスモニター config

- `gateway.channelHealthCheckMinutes`: Gateway がチャネルヘルスをチェックする頻度。デフォルト: `5`。ヘルスモニターによる再起動をグローバルに無効化するには `0` を設定します。
- `gateway.channelStaleEventThresholdMinutes`: 接続済みチャネルがアイドル状態のまま、ヘルスモニターに古いと見なされ再起動されるまでの時間。デフォルト: `30`。これは `gateway.channelHealthCheckMinutes` 以上にしてください。
- `gateway.channelMaxRestartsPerHour`: チャネル/アカウントごとのヘルスモニター再起動のローリング 1 時間上限。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバル監視は有効のまま、特定チャネルのヘルスモニター再起動を無効化します。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: チャネルレベル設定より優先されるマルチアカウントの上書き。
- これらのチャネル別上書きは、現在それを公開している組み込みチャネルに適用されます: Discord、Google Chat、iMessage、IRC、Microsoft Teams、Signal、Slack、Telegram、WhatsApp。

## 稼働時間監視

外部の稼働時間監視サービスは、`/v1/chat/completions` ではなく、専用の `/health` エンドポイントを使用してください。

- **使用する:** `GET /health` - 即時応答、セッション作成なし、LLM 呼び出しなし、`{"ok":true,"status":"live"}` を返します
- **使用しない:** ヘルスチェックに `/v1/chat/completions` を使用 - 各リクエストが、スキルスナップショット、コンテキスト組み立て、LLM 呼び出しを伴う完全なエージェントセッションを作成します

`x-openclaw-session-key` ヘッダーまたは `user` フィールドが指定されていない場合、`/v1/chat/completions` は各リクエストに対して新しいランダムセッションを生成します。15 分ごとに ping する監視サービスは、1 日あたり約 96 セッションを作成し、それぞれが 4-22KB を消費します。時間が経つと、これはセッションストアの肥大化を引き起こし、コンテキストウィンドウのオーバーフローにつながる可能性があります。

### 監視サービス設定例

- **BetterStack:** ヘルスチェック URL を `https://<your-gateway-host>:<port>/health` に設定します
- **UptimeRobot:** URL `https://<your-gateway-host>:<port>/health` で新しい HTTP モニターを追加します
- **汎用:** Gateway が正常な場合、`/health` への任意の HTTP GET は `{"ok":true}` とともに 200 を返します

## 何かが失敗した場合

- `logged out` またはステータス 409-515 -> `openclaw channels logout` の後に `openclaw channels login` で再リンクします。
- Gateway に到達できない -> 起動します: `openclaw gateway --port 18789` (ポートが使用中の場合は `--force` を使用)。
- インバウンドメッセージがない -> リンク済み電話がオンラインで、送信者が許可されていることを確認します (`channels.whatsapp.allowFrom`)。グループチャットでは、許可リスト + メンションルールが一致していることを確認します (`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`)。

## 専用の「health」コマンド

`openclaw health` は、稼働中の Gateway にヘルススナップショットを要求します (CLI から直接チャネル
ソケットには接続しません)。デフォルトでは、新しいキャッシュ済み Gateway スナップショットを返し、
Gateway はそのキャッシュをバックグラウンドで更新します。`--verbose` は代わりにライブプローブを強制します。
このコマンドは、利用可能な場合はリンク済み認証情報/認証の経過時間、チャネル別プローブサマリー、
セッションストアサマリー、プローブ時間を報告します。Gateway に到達できない場合、またはプローブが
失敗/タイムアウトした場合は、非ゼロで終了します。

オプション:

- `--json`: 機械可読の JSON 出力
- `--timeout <ms>`: デフォルトの 10s プローブタイムアウトを上書き
- `--verbose`: ライブプローブを強制し、Gateway 接続の詳細を出力
- `--debug`: `--verbose` のエイリアス

ヘルススナップショットには、`ok` (boolean)、`ts` (timestamp)、`durationMs` (probe time)、チャネル別ステータス、エージェント可用性、セッションストアサマリーが含まれます。

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [診断エクスポート](/ja-JP/gateway/diagnostics)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
