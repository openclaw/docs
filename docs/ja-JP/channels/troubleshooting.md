---
read_when:
    - チャネルのトランスポートは接続済みと表示されるが、返信が失敗する
    - 詳細なプロバイダードキュメントの前に、チャネル固有のチェックが必要です
summary: チャンネルごとの障害シグネチャと修正方法による迅速なチャンネルレベルのトラブルシューティング
title: チャネルのトラブルシューティング
x-i18n:
    generated_at: "2026-05-05T08:25:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360184c41ce6929c696688af597c5104a8a28b54620c354f7ee400a2e5490519
    source_path: channels/troubleshooting.md
    workflow: 16
---

チャネルは接続するが挙動が正しくない場合は、このページを使います。

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
- `Capability: read-only`, `write-capable`, または `admin-capable`
- チャネルプローブでトランスポートが接続済みと表示され、サポートされている場合は `works` または `audit ok` と表示される

## WhatsApp

### WhatsApp の失敗の兆候

| 症状                                | 最速の確認                                          | 修正                                                                                                                               |
| ----------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 接続済みだが DM 返信がない          | `openclaw pairing list whatsapp`                    | 送信者を承認するか、DM ポリシー/許可リストを切り替えます。                                                                        |
| グループメッセージが無視される      | 設定の `requireMention` とメンションパターンを確認  | ボットにメンションするか、そのグループのメンションポリシーを緩和します。                                                          |
| QR ログインが 408 でタイムアウトする | Gateway の `HTTPS_PROXY` / `HTTP_PROXY` 環境変数を確認 | 到達可能なプロキシを設定します。`NO_PROXY` はバイパスにのみ使います。                                                             |
| ランダムな切断/再ログインループ     | `openclaw channels status --probe` + ログ           | 現在接続中でも、最近の再接続はフラグされます。ログを監視し、Gateway を再起動してから、揺れが続く場合は再リンクします。          |
| 返信が数秒/数分遅れて届く           | `openclaw doctor --fix`                             | Doctor は、Gateway イベントループを劣化させていることが確認された古いローカル TUI クライアントを停止します。                     |

詳細なトラブルシューティング: [WhatsApp トラブルシューティング](/ja-JP/channels/whatsapp#troubleshooting)

## Telegram

### Telegram の失敗の兆候

| 症状                                   | 最速の確認                                         | 修正                                                                                                                         |
| -------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `/start` しても利用可能な返信フローがない | `openclaw pairing list telegram`                   | ペアリングを承認するか、DM ポリシーを変更します。                                                                            |
| ボットはオンラインだがグループが無言    | メンション要件とボットのプライバシーモードを確認  | グループの可視性のためにプライバシーモードを無効にするか、ボットにメンションします。                                        |
| ネットワークエラーで送信に失敗する      | Telegram API 呼び出し失敗についてログを調査        | `api.telegram.org` への DNS/IPv6/プロキシルーティングを修正します。                                                          |
| 起動時に `getMe returned 401` が報告される | 設定済みトークンソースを確認                      | BotFather トークンを再コピーまたは再生成し、`botToken`、`tokenFile`、または既定アカウントの `TELEGRAM_BOT_TOKEN` を更新します。 |
| ポーリングが停止する、または再接続が遅い | ポーリング診断のために `openclaw logs --follow`    | アップグレードします。再起動が誤検知の場合は `pollingStallThresholdMs` を調整します。永続的な停止は引き続きプロキシ/DNS/IPv6 を示します。 |
| 起動時に `setMyCommands` が拒否される   | `BOT_COMMANDS_TOO_MUCH` についてログを調査         | Plugin/skill/カスタム Telegram コマンドを減らすか、ネイティブメニューを無効にします。                                       |
| アップグレード後に許可リストにブロックされる | `openclaw security audit` と設定の許可リスト       | `openclaw doctor --fix` を実行するか、`@username` を数値の送信者 ID に置き換えます。                                         |

詳細なトラブルシューティング: [Telegram トラブルシューティング](/ja-JP/channels/telegram#troubleshooting)

## Discord

### Discord の失敗の兆候

| 症状                                    | 最速の確認                                                            | 修正                                                                                                                                                                      |
| --------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ボットはオンラインだがギルド返信がない  | `openclaw channels status --probe`                                    | ギルド/チャネルを許可し、メッセージコンテンツインテントを確認します。                                                                                                     |
| グループメッセージが無視される          | メンションゲーティングによるドロップについてログを確認               | ボットにメンションするか、ギルド/チャネルの `requireMention: false` を設定します。                                                                                        |
| 入力中/トークン使用はあるが Discord メッセージがない | セッションログに `didSendViaMessagingTool: false` 付きのアシスタントテキストが表示される | モデルがメッセージツールを呼び出さず、非公開で回答しています。ツール呼び出しの信頼性が高いモデルを使うか、`messages.groupChat.visibleReplies: "automatic"` を設定して自動投稿します。 |
| DM 返信がない                           | `openclaw pairing list discord`                                       | DM ペアリングを承認するか、DM ポリシーを調整します。                                                                                                                      |

詳細なトラブルシューティング: [Discord トラブルシューティング](/ja-JP/channels/discord#troubleshooting)

## Slack

### Slack の失敗の兆候

| 症状                                    | 最速の確認                                | 修正                                                                                                                                                  |
| --------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| ソケットモードは接続済みだが応答がない  | `openclaw channels status --probe`        | アプリトークン + ボットトークンと必要なスコープを確認します。SecretRef ベースのセットアップでは `botTokenStatus` / `appTokenStatus = configured_unavailable` を監視します。 |
| DM がブロックされる                     | `openclaw pairing list slack`             | ペアリングを承認するか、DM ポリシーを緩和します。                                                                                                     |
| チャネルメッセージが無視される          | `groupPolicy` とチャネル許可リストを確認 | チャネルを許可するか、ポリシーを `open` に切り替えます。                                                                                              |

詳細なトラブルシューティング: [Slack トラブルシューティング](/ja-JP/channels/slack#troubleshooting)

## iMessage と BlueBubbles

### iMessage と BlueBubbles の失敗の兆候

| 症状                               | 最速の確認                                                              | 修正                                                        |
| ---------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| 受信イベントがない                 | Webhook/サーバーの到達性とアプリ権限を確認                              | Webhook URL または BlueBubbles サーバー状態を修正します。   |
| macOS で送信できるが受信できない   | Messages 自動化の macOS プライバシー権限を確認                          | TCC 権限を再付与し、チャネルプロセスを再起動します。        |
| DM 送信者がブロックされる          | `openclaw pairing list imessage` または `openclaw pairing list bluebubbles` | ペアリングを承認するか、許可リストを更新します。            |

詳細なトラブルシューティング:

- [iMessage トラブルシューティング](/ja-JP/channels/imessage#troubleshooting)
- [BlueBubbles トラブルシューティング](/ja-JP/channels/bluebubbles#troubleshooting)

## Signal

### Signal の失敗の兆候

| 症状                                  | 最速の確認                                 | 修正                                                       |
| ------------------------------------- | ------------------------------------------ | ---------------------------------------------------------- |
| デーモンに到達できるがボットが無言    | `openclaw channels status --probe`         | `signal-cli` デーモン URL/アカウントと受信モードを確認します。 |
| DM がブロックされる                   | `openclaw pairing list signal`             | 送信者を承認するか、DM ポリシーを調整します。              |
| グループ返信がトリガーされない        | グループ許可リストとメンションパターンを確認 | 送信者/グループを追加するか、ゲーティングを緩めます。      |

詳細なトラブルシューティング: [Signal トラブルシューティング](/ja-JP/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot の失敗の兆候

| 症状                                  | 最速の確認                                  | 修正                                                          |
| ------------------------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| ボットが「gone to Mars」と返信する     | 設定の `appId` と `clientSecret` を確認     | 認証情報を設定するか、Gateway を再起動します。                |
| 受信メッセージがない                  | `openclaw channels status --probe`          | QQ Open Platform で認証情報を確認します。                     |
| 音声が文字起こしされない              | STT プロバイダー設定を確認                  | `channels.qqbot.stt` または `tools.media.audio` を設定します。 |
| プロアクティブメッセージが届かない    | QQ プラットフォームのインタラクション要件を確認 | 最近のインタラクションがない場合、QQ がボット開始メッセージをブロックすることがあります。 |

詳細なトラブルシューティング: [QQ Bot トラブルシューティング](/ja-JP/channels/qqbot#troubleshooting)

## Matrix

### Matrix の失敗の兆候

| 症状                                      | 最速の確認                             | 修正                                                                         |
| ----------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------- |
| ログイン済みだがルームメッセージを無視する | `openclaw channels status --probe`     | `groupPolicy`、ルーム許可リスト、メンションゲーティングを確認します。        |
| DM が処理されない                         | `openclaw pairing list matrix`         | 送信者を承認するか、DM ポリシーを調整します。                                |
| 暗号化ルームが失敗する                    | `openclaw matrix verify status`        | デバイスを再検証してから、`openclaw matrix verify backup status` を確認します。 |
| バックアップ復元が保留中/壊れている       | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore` を実行するか、リカバリキーを使って再実行します。 |
| クロス署名/ブートストラップがおかしい     | `openclaw matrix verify bootstrap`     | シークレットストレージ、クロス署名、バックアップ状態を 1 回で修復します。     |

詳細なセットアップと設定: [Matrix](/ja-JP/channels/matrix)

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
