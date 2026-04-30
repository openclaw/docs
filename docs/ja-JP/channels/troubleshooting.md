---
read_when:
    - チャネルのトランスポートは接続済みと表示されるが、返信に失敗する
    - 詳細なプロバイダードキュメントを読む前に、チャネル固有のチェックが必要です
summary: チャネルごとの障害シグネチャと修正による、迅速なチャネルレベルのトラブルシューティング
title: チャンネルのトラブルシューティング
x-i18n:
    generated_at: "2026-04-30T05:01:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6024f2ae0a058b2296758c237c912a5cd8ea6bbafea33cc201690cc081efcbee
    source_path: channels/troubleshooting.md
    workflow: 16
---

チャネルが接続されているのに動作が誤っている場合は、このページを使用してください。

## コマンド手順

まず、次を順番に実行します。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常なベースライン:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`、`write-capable`、または `admin-capable`
- チャネルのプローブでトランスポートが接続済みと表示され、サポートされている場合は `works` または `audit ok` と表示される

## WhatsApp

### WhatsApp の障害シグネチャ

| 症状                         | 最速の確認                                       | 修正                                                                                                                              |
| ------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 接続済みだが DM に返信しない     | `openclaw pairing list whatsapp`                    | 送信者を承認するか、DM ポリシー/許可リストを切り替えます。                                                                                    |
| グループメッセージが無視される          | 設定の `requireMention` + メンションパターンを確認 | ボットにメンションするか、そのグループのメンションポリシーを緩和します。                                                                          |
| QR ログインが 408 でタイムアウトする     | Gateway の `HTTPS_PROXY` / `HTTP_PROXY` env を確認      | 到達可能なプロキシを設定します。`NO_PROXY` はバイパスのみに使用します。                                                                         |
| ランダムな切断/再ログインループ | `openclaw channels status --probe` + ログ           | 現在接続されていても、最近の再接続はフラグ付けされます。ログを監視し、Gateway を再起動してから、フラッピングが続く場合は再リンクします。 |

完全なトラブルシューティング: [WhatsApp のトラブルシューティング](/ja-JP/channels/whatsapp#troubleshooting)

## Telegram

### Telegram の障害シグネチャ

| 症状                              | 最速の確認                                    | 修正                                                                                                                        |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start` したが利用可能な返信フローがない    | `openclaw pairing list telegram`                 | ペアリングを承認するか、DM ポリシーを変更します。                                                                                       |
| ボットはオンラインだがグループが沈黙したまま    | メンション要件とボットのプライバシーモードを確認  | グループでの可視性のためにプライバシーモードを無効にするか、ボットにメンションします。                                                                  |
| ネットワークエラーで送信に失敗する    | Telegram API 呼び出し失敗のログを調査する      | `api.telegram.org` への DNS/IPv6/プロキシルーティングを修正します。                                                                          |
| 起動時に `getMe returned 401` と報告される | 設定済みトークンソースを確認する                    | BotFather トークンを再コピーまたは再生成し、`botToken`、`tokenFile`、またはデフォルトアカウントの `TELEGRAM_BOT_TOKEN` を更新します。     |
| ポーリングが停止する、または再接続が遅い  | ポーリング診断について `openclaw logs --follow` を確認 | アップグレードします。再起動が誤検出の場合は、`pollingStallThresholdMs` を調整します。停止が継続する場合は、依然としてプロキシ/DNS/IPv6 が原因です。 |
| 起動時に `setMyCommands` が拒否される  | `BOT_COMMANDS_TOO_MUCH` のログを調査する         | Plugin/skill/カスタム Telegram コマンドを減らすか、ネイティブメニューを無効にします。                                                      |
| アップグレード後に許可リストでブロックされる    | `openclaw security audit` と設定の許可リスト  | `openclaw doctor --fix` を実行するか、`@username` を数値の送信者 ID に置き換えます。                                                |

完全なトラブルシューティング: [Telegram のトラブルシューティング](/ja-JP/channels/telegram#troubleshooting)

## Discord

### Discord の障害シグネチャ

| 症状                         | 最速の確認                       | 修正                                                       |
| ------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| ボットはオンラインだがギルドで返信しない | `openclaw channels status --probe`  | ギルド/チャネルを許可し、メッセージコンテンツインテントを確認します。    |
| グループメッセージが無視される          | メンションゲートによるドロップのログを確認 | ボットにメンションするか、ギルド/チャネルの `requireMention: false` を設定します。 |
| DM 返信がない              | `openclaw pairing list discord`     | DM ペアリングを承認するか、DM ポリシーを調整します。                   |

完全なトラブルシューティング: [Discord のトラブルシューティング](/ja-JP/channels/discord#troubleshooting)

## Slack

### Slack の障害シグネチャ

| 症状                                | 最速の確認                             | 修正                                                                                                                                                  |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode は接続済みだが応答がない | `openclaw channels status --probe`        | アプリトークン + ボットトークンと必要なスコープを確認します。SecretRef ベースのセットアップでは `botTokenStatus` / `appTokenStatus = configured_unavailable` に注意します。 |
| DM がブロックされる                            | `openclaw pairing list slack`             | ペアリングを承認するか、DM ポリシーを緩和します。                                                                                                                  |
| チャネルメッセージが無視される                | `groupPolicy` とチャネル許可リストを確認 | チャネルを許可するか、ポリシーを `open` に切り替えます。                                                                                                        |

完全なトラブルシューティング: [Slack のトラブルシューティング](/ja-JP/channels/slack#troubleshooting)

## iMessage と BlueBubbles

### iMessage と BlueBubbles の障害シグネチャ

| 症状                          | 最速の確認                                                           | 修正                                                   |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| 受信イベントがない                | Webhook/サーバーの到達性とアプリ権限を確認                  | Webhook URL または BlueBubbles サーバー状態を修正します。          |
| macOS で送信はできるが受信できない | Messages 自動化の macOS プライバシー権限を確認                 | TCC 権限を再付与し、チャネルプロセスを再起動します。 |
| DM 送信者がブロックされる                | `openclaw pairing list imessage` または `openclaw pairing list bluebubbles` | ペアリングを承認するか、許可リストを更新します。                  |

完全なトラブルシューティング:

- [iMessage のトラブルシューティング](/ja-JP/channels/imessage#troubleshooting)
- [BlueBubbles のトラブルシューティング](/ja-JP/channels/bluebubbles#troubleshooting)

## Signal

### Signal の障害シグネチャ

| 症状                         | 最速の確認                              | 修正                                                      |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| デーモンには到達可能だがボットが沈黙する | `openclaw channels status --probe`         | `signal-cli` デーモン URL/アカウントと受信モードを確認します。 |
| DM がブロックされる                      | `openclaw pairing list signal`             | 送信者を承認するか、DM ポリシーを調整します。                      |
| グループ返信がトリガーされない    | グループ許可リストとメンションパターンを確認 | 送信者/グループを追加するか、ゲートを緩和します。                       |

完全なトラブルシューティング: [Signal のトラブルシューティング](/ja-JP/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot の障害シグネチャ

| 症状                         | 最速の確認                               | 修正                                                             |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| ボットが "gone to Mars" と返信する      | 設定の `appId` と `clientSecret` を確認 | 認証情報を設定するか、Gateway を再起動します。                         |
| 受信メッセージがない             | `openclaw channels status --probe`          | QQ Open Platform の認証情報を確認します。                     |
| 音声が文字起こしされない           | STT プロバイダー設定を確認                   | `channels.qqbot.stt` または `tools.media.audio` を設定します。          |
| プロアクティブメッセージが届かない | QQ プラットフォームのインタラクション要件を確認  | 最近のインタラクションがない場合、QQ がボット起点のメッセージをブロックする可能性があります。 |

完全なトラブルシューティング: [QQ Bot のトラブルシューティング](/ja-JP/channels/qqbot#troubleshooting)

## Matrix

### Matrix の障害シグネチャ

| 症状                             | 最速の確認                          | 修正                                                                       |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| ログイン済みだがルームメッセージを無視する | `openclaw channels status --probe`     | `groupPolicy`、ルーム許可リスト、メンションゲートを確認します。                  |
| DM が処理されない                  | `openclaw pairing list matrix`         | 送信者を承認するか、DM ポリシーを調整します。                                       |
| 暗号化ルームが失敗する                | `openclaw matrix verify status`        | デバイスを再確認し、その後 `openclaw matrix verify backup status` を確認します。  |
| バックアップ復元が保留中/壊れている    | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore` を実行するか、リカバリキーを使って再実行します。 |
| クロス署名/ブートストラップが誤って見える | `openclaw matrix verify bootstrap`     | シークレットストレージ、クロス署名、バックアップ状態を 1 回で修復します。       |

完全なセットアップと設定: [Matrix](/ja-JP/channels/matrix)

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting)
