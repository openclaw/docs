---
read_when:
    - チャネルのトランスポートは接続済みと表示されるが、返信に失敗する
    - 詳細なプロバイダードキュメントに進む前に、チャネル固有のチェックが必要です。
summary: チャンネル別の失敗シグネチャと修正策を使った迅速なチャンネルレベルのトラブルシューティング
title: チャンネルのトラブルシューティング
x-i18n:
    generated_at: "2026-05-04T02:22:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3a0737156ae83897c44d18505e0355a5d8e5700106b984496d94874c270deb2
    source_path: channels/troubleshooting.md
    workflow: 16
---

チャンネルは接続されるが、動作が正しくない場合にこのページを使用します。

## コマンド手順

まず次を順に実行します。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常な基準状態:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`、`write-capable`、または `admin-capable`
- チャンネルプローブでトランスポートが接続済みであり、対応している場合は `works` または `audit ok` が表示される

## WhatsApp

### WhatsApp の障害シグネチャ

| 症状                            | 最速の確認                                          | 修正                                                                                                                         |
| ------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 接続済みだが DM 返信がない      | `openclaw pairing list whatsapp`                    | 送信者を承認するか、DM ポリシー/許可リストを切り替えます。                                                                  |
| グループメッセージが無視される  | config の `requireMention` とメンションパターンを確認 | bot をメンションするか、そのグループのメンションポリシーを緩和します。                                                      |
| QR ログインが 408 でタイムアウトする | Gateway の `HTTPS_PROXY` / `HTTP_PROXY` env を確認   | 到達可能なプロキシを設定します。`NO_PROXY` はバイパスにのみ使用します。                                                     |
| ランダムな切断/再ログインループ | `openclaw channels status --probe` + ログ           | 現在接続中でも最近の再接続はフラグ付けされます。ログを監視し、Gateway を再起動してから、フラッピングが続く場合は再リンクします。 |

完全なトラブルシューティング: [WhatsApp のトラブルシューティング](/ja-JP/channels/whatsapp#troubleshooting)

## Telegram

### Telegram の障害シグネチャ

| 症状                                   | 最速の確認                                      | 修正                                                                                                                          |
| -------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `/start` しても使用可能な返信フローがない | `openclaw pairing list telegram`                 | ペアリングを承認するか、DM ポリシーを変更します。                                                                            |
| bot はオンラインだがグループが沈黙したまま | メンション要件と bot のプライバシーモードを確認 | グループで表示できるようにプライバシーモードを無効にするか、bot をメンションします。                                        |
| ネットワークエラーで送信に失敗する     | Telegram API 呼び出しの失敗をログで調査         | `api.telegram.org` への DNS/IPv6/プロキシルーティングを修正します。                                                          |
| 起動時に `getMe returned 401` が報告される | 設定済みのトークンソースを確認                  | BotFather トークンを再コピーまたは再生成し、`botToken`、`tokenFile`、またはデフォルトアカウントの `TELEGRAM_BOT_TOKEN` を更新します。 |
| ポーリングが停止する、または再接続が遅い | ポーリング診断のために `openclaw logs --follow` | アップグレードします。再起動が誤検知の場合は `pollingStallThresholdMs` を調整します。永続的な停止は引き続きプロキシ/DNS/IPv6 を示します。 |
| 起動時に `setMyCommands` が拒否される  | `BOT_COMMANDS_TOO_MUCH` をログで調査             | Plugin/skill/custom Telegram コマンドを減らすか、ネイティブメニューを無効にします。                                         |
| アップグレード後に許可リストでブロックされる | `openclaw security audit` と config の許可リスト | `openclaw doctor --fix` を実行するか、`@username` を数値の送信者 ID に置き換えます。                                        |

完全なトラブルシューティング: [Telegram のトラブルシューティング](/ja-JP/channels/telegram#troubleshooting)

## Discord

### Discord の障害シグネチャ

| 症状                                      | 最速の確認                                                          | 修正                                                                                                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bot はオンラインだが guild で返信がない   | `openclaw channels status --probe`                                  | guild/channel を許可し、メッセージコンテンツ intent を確認します。                                                                                                        |
| グループメッセージが無視される            | メンションゲートによるドロップをログで確認                         | bot をメンションするか、guild/channel の `requireMention: false` を設定します。                                                                                           |
| 入力中/トークン使用はあるが Discord メッセージがない | セッションログに `didSendViaMessagingTool: false` の assistant text が表示される | モデルが message tool を呼ばずに非公開で回答しています。ツール呼び出しが信頼できるモデルを使用するか、`messages.groupChat.visibleReplies: "automatic"` を設定して自動投稿します。 |
| DM 返信がない                             | `openclaw pairing list discord`                                     | DM ペアリングを承認するか、DM ポリシーを調整します。                                                                                                                     |

完全なトラブルシューティング: [Discord のトラブルシューティング](/ja-JP/channels/discord#troubleshooting)

## Slack

### Slack の障害シグネチャ

| 症状                                  | 最速の確認                                | 修正                                                                                                                                                       |
| ------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode は接続済みだが応答がない  | `openclaw channels status --probe`        | app token + bot token と必要な scopes を確認します。SecretRef に基づくセットアップでは `botTokenStatus` / `appTokenStatus = configured_unavailable` に注意します。 |
| DM がブロックされる                   | `openclaw pairing list slack`             | ペアリングを承認するか、DM ポリシーを緩和します。                                                                                                         |
| チャンネルメッセージが無視される      | `groupPolicy` とチャンネル許可リストを確認 | チャンネルを許可するか、ポリシーを `open` に切り替えます。                                                                                                |

完全なトラブルシューティング: [Slack のトラブルシューティング](/ja-JP/channels/slack#troubleshooting)

## iMessage と BlueBubbles

### iMessage と BlueBubbles の障害シグネチャ

| 症状                              | 最速の確認                                                            | 修正                                                   |
| --------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------ |
| 受信イベントがない                | Webhook/サーバーの到達性とアプリ権限を確認                           | Webhook URL または BlueBubbles サーバー状態を修正します。 |
| macOS で送信はできるが受信できない | Messages automation の macOS プライバシー権限を確認                  | TCC 権限を再付与し、チャンネルプロセスを再起動します。 |
| DM 送信者がブロックされる         | `openclaw pairing list imessage` または `openclaw pairing list bluebubbles` | ペアリングを承認するか、許可リストを更新します。       |

完全なトラブルシューティング:

- [iMessage のトラブルシューティング](/ja-JP/channels/imessage#troubleshooting)
- [BlueBubbles のトラブルシューティング](/ja-JP/channels/bluebubbles#troubleshooting)

## Signal

### Signal の障害シグネチャ

| 症状                              | 最速の確認                                  | 修正                                                       |
| --------------------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| daemon は到達可能だが bot が沈黙する | `openclaw channels status --probe`          | `signal-cli` daemon URL/account と受信モードを確認します。 |
| DM がブロックされる               | `openclaw pairing list signal`              | 送信者を承認するか、DM ポリシーを調整します。              |
| グループ返信がトリガーされない    | グループ許可リストとメンションパターンを確認 | 送信者/グループを追加するか、ゲートを緩和します。          |

完全なトラブルシューティング: [Signal のトラブルシューティング](/ja-JP/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot の障害シグネチャ

| 症状                                      | 最速の確認                                  | 修正                                                               |
| ----------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------ |
| bot が「gone to Mars」と返信する          | config の `appId` と `clientSecret` を確認  | 認証情報を設定するか、Gateway を再起動します。                     |
| 受信メッセージがない                      | `openclaw channels status --probe`          | QQ Open Platform で認証情報を確認します。                          |
| 音声が文字起こしされない                  | STT プロバイダー config を確認              | `channels.qqbot.stt` または `tools.media.audio` を設定します。      |
| プロアクティブメッセージが届かない        | QQ platform のインタラクション要件を確認    | 直近のインタラクションがない場合、QQ は bot 起点のメッセージをブロックすることがあります。 |

完全なトラブルシューティング: [QQ Bot のトラブルシューティング](/ja-JP/channels/qqbot#troubleshooting)

## Matrix

### Matrix の障害シグネチャ

| 症状                                      | 最速の確認                                  | 修正                                                                       |
| ----------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| ログイン済みだがルームメッセージを無視する | `openclaw channels status --probe`          | `groupPolicy`、ルーム許可リスト、メンションゲートを確認します。           |
| DM が処理されない                         | `openclaw pairing list matrix`              | 送信者を承認するか、DM ポリシーを調整します。                              |
| 暗号化ルームが失敗する                    | `openclaw matrix verify status`             | デバイスを再検証し、その後 `openclaw matrix verify backup status` を確認します。 |
| バックアップ復元が保留中/壊れている       | `openclaw matrix verify backup status`      | `openclaw matrix verify backup restore` を実行するか、リカバリーキーを使って再実行します。 |
| クロス署名/bootstrap が正しく見えない      | `openclaw matrix verify bootstrap`          | secret storage、クロス署名、バックアップ状態を 1 回で修復します。          |

完全なセットアップと config: [Matrix](/ja-JP/channels/matrix)

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting)
