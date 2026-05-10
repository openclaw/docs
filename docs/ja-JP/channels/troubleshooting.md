---
read_when:
    - チャネルのトランスポートでは接続済みと表示されるが、返信が失敗する
    - 詳細なプロバイダー文書に入る前に、チャネル固有のチェックが必要です。
summary: チャネル別の失敗シグネチャと修正策による、迅速なチャネルレベルのトラブルシューティング
title: チャネルのトラブルシューティング
x-i18n:
    generated_at: "2026-05-10T19:23:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a314cd772e15c038008b78603f811caaa40a3be31e7268c8fb1eefbb000b32
    source_path: channels/troubleshooting.md
    workflow: 16
---

接続はできるものの動作が誤っている場合は、このページを使用してください。

## コマンドの段階的確認

まず、以下を順番に実行します。

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
- チャンネルのプローブでトランスポートが接続済みと表示され、サポートされている場合は `works` または `audit ok` と表示される

## WhatsApp

### WhatsApp の失敗シグネチャ

| 症状                                | 最速の確認方法                                      | 修正                                                                                                                              |
| ----------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 接続済みだが DM 返信がない          | `openclaw pairing list whatsapp`                    | 送信者を承認するか、DM ポリシー/許可リストを切り替えます。                                                                       |
| グループメッセージが無視される      | 設定の `requireMention` とメンションパターンを確認 | bot にメンションするか、そのグループのメンションポリシーを緩和します。                                                           |
| QR ログインが 408 でタイムアウトする | Gateway の `HTTPS_PROXY` / `HTTP_PROXY` env を確認  | 到達可能なプロキシを設定します。`NO_PROXY` はバイパスのみに使用します。                                                          |
| ランダムな切断/再ログインループ     | `openclaw channels status --probe` + ログ           | 現在接続済みでも、最近の再接続はフラグ付けされます。ログを監視し、Gateway を再起動してから、揺れが続く場合は再リンクします。    |
| 返信が数秒/数分遅れて届く           | `openclaw doctor --fix`                             | Doctor は、Gateway イベントループを劣化させていることが検証済みの古いローカル TUI クライアントを停止します。                    |

詳細なトラブルシューティング: [WhatsApp のトラブルシューティング](/ja-JP/channels/whatsapp#troubleshooting)

## Telegram

### Telegram の失敗シグネチャ

| 症状                                       | 最速の確認方法                                     | 修正                                                                                                                        |
| ------------------------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `/start` したが利用可能な返信フローがない  | `openclaw pairing list telegram`                   | ペアリングを承認するか、DM ポリシーを変更します。                                                                          |
| bot はオンラインだがグループが沈黙する     | メンション要件と bot のプライバシーモードを確認   | グループの可視性のためにプライバシーモードを無効化するか、bot にメンションします。                                         |
| ネットワークエラーで送信に失敗する         | Telegram API 呼び出し失敗のログを確認             | `api.telegram.org` への DNS/IPv6/プロキシルーティングを修正します。                                                        |
| 起動時に `getMe returned 401` と報告される | 設定されたトークンソースを確認                     | BotFather トークンを再コピーまたは再生成し、`botToken`、`tokenFile`、またはデフォルトアカウントの `TELEGRAM_BOT_TOKEN` を更新します。 |
| ポーリングが停止するか再接続が遅い         | ポーリング診断のために `openclaw logs --follow`    | アップグレードします。再起動が偽陽性の場合は、`pollingStallThresholdMs` を調整します。永続的な停止は、依然としてプロキシ/DNS/IPv6 を示します。 |
| 起動時に `setMyCommands` が拒否される      | `BOT_COMMANDS_TOO_MUCH` のログを確認               | Plugin/skill/カスタム Telegram コマンドを減らすか、ネイティブメニューを無効化します。                                      |
| アップグレード後に許可リストでブロックされる | `openclaw security audit` と設定の許可リストを確認 | `openclaw doctor --fix` を実行するか、`@username` を数値の送信者 ID に置き換えます。                                        |

詳細なトラブルシューティング: [Telegram のトラブルシューティング](/ja-JP/channels/telegram#troubleshooting)

## Discord

### Discord の失敗シグネチャ

| 症状                                      | 最速の確認方法                                                         | 修正                                                                                                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bot はオンラインだがギルド返信がない      | `openclaw channels status --probe`                                     | ギルド/チャンネルを許可し、メッセージコンテンツ intent を確認します。                                                                                                |
| グループメッセージが無視される            | メンションゲートによるドロップのログを確認                            | bot にメンションするか、ギルド/チャンネルの `requireMention: false` を設定します。                                                                                    |
| 入力中/トークン使用はあるが Discord メッセージがない | セッションログに `didSendViaMessagingTool: false` のアシスタントテキストがある | モデルがメッセージツールを呼び出さず、非公開で回答しています。ツール呼び出しの信頼性が高いモデルを使用するか、`messages.groupChat.visibleReplies: "automatic"` を設定して自動投稿します。 |
| DM 返信がない                             | `openclaw pairing list discord`                                        | DM ペアリングを承認するか、DM ポリシーを調整します。                                                                                                                 |

詳細なトラブルシューティング: [Discord のトラブルシューティング](/ja-JP/channels/discord#troubleshooting)

## Slack

### Slack の失敗シグネチャ

| 症状                                           | 最速の確認方法                              | 修正                                                                                                                                                  |
| ---------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| ソケットモードは接続済みだが応答がない         | `openclaw channels status --probe`          | app トークン + bot トークンと必要なスコープを確認します。SecretRef ベースの設定では `botTokenStatus` / `appTokenStatus = configured_unavailable` に注意します。 |
| DM がブロックされる                            | `openclaw pairing list slack`               | ペアリングを承認するか、DM ポリシーを緩和します。                                                                                                    |
| チャンネルメッセージが無視される               | `groupPolicy` とチャンネル許可リストを確認  | チャンネルを許可するか、ポリシーを `open` に切り替えます。                                                                                           |

詳細なトラブルシューティング: [Slack のトラブルシューティング](/ja-JP/channels/slack#troubleshooting)

## iMessage

### iMessage の失敗シグネチャ

| 症状                                      | 最速の確認方法                                          | 修正                                                                  |
| ----------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| `imsg` が見つからない、または macOS 以外で失敗する | `openclaw channels status --probe --channel imessage`   | Messages Mac で OpenClaw を実行するか、`cliPath` に SSH ラッパーを使用します。 |
| macOS で送信できるが受信できない          | Messages 自動化の macOS プライバシー権限を確認         | TCC 権限を再付与し、チャンネルプロセスを再起動します。               |
| DM 送信者がブロックされる                 | `openclaw pairing list imessage`                        | ペアリングを承認するか、許可リストを更新します。                     |

詳細なトラブルシューティング:

- [iMessage のトラブルシューティング](/ja-JP/channels/imessage#troubleshooting)

## Signal

### Signal の失敗シグネチャ

| 症状                                | 最速の確認方法                             | 修正                                                      |
| ----------------------------------- | ------------------------------------------ | --------------------------------------------------------- |
| デーモンには到達できるが bot が沈黙する | `openclaw channels status --probe`         | `signal-cli` デーモン URL/アカウントと受信モードを確認します。 |
| DM がブロックされる                 | `openclaw pairing list signal`             | 送信者を承認するか、DM ポリシーを調整します。            |
| グループ返信がトリガーされない      | グループ許可リストとメンションパターンを確認 | 送信者/グループを追加するか、ゲートを緩めます。          |

詳細なトラブルシューティング: [Signal のトラブルシューティング](/ja-JP/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot の失敗シグネチャ

| 症状                                  | 最速の確認方法                              | 修正                                                            |
| ------------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| bot が「gone to Mars」と返信する       | 設定の `appId` と `clientSecret` を確認     | 資格情報を設定するか、Gateway を再起動します。                 |
| 受信メッセージがない                  | `openclaw channels status --probe`          | QQ Open Platform の資格情報を確認します。                      |
| 音声が文字起こしされない              | STT プロバイダー設定を確認                  | `channels.qqbot.stt` または `tools.media.audio` を設定します。 |
| プロアクティブメッセージが届かない    | QQ プラットフォームのインタラクション要件を確認 | 直近のインタラクションがない場合、QQ は bot 起点のメッセージをブロックすることがあります。 |

詳細なトラブルシューティング: [QQ Bot のトラブルシューティング](/ja-JP/channels/qqbot#troubleshooting)

## Matrix

### Matrix の失敗シグネチャ

| 症状                                      | 最速の確認方法                          | 修正                                                                       |
| ----------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| ログイン済みだがルームメッセージを無視する | `openclaw channels status --probe`      | `groupPolicy`、ルーム許可リスト、メンションゲートを確認します。           |
| DM が処理されない                         | `openclaw pairing list matrix`          | 送信者を承認するか、DM ポリシーを調整します。                             |
| 暗号化ルームが失敗する                    | `openclaw matrix verify status`         | デバイスを再検証し、その後 `openclaw matrix verify backup status` を確認します。 |
| バックアップ復元が保留中/壊れている       | `openclaw matrix verify backup status`  | `openclaw matrix verify backup restore` を実行するか、リカバリーキーで再実行します。 |
| クロス署名/ブートストラップが誤って見える | `openclaw matrix verify bootstrap`      | シークレットストレージ、クロス署名、バックアップ状態を一度に修復します。  |

完全なセットアップと設定: [Matrix](/ja-JP/channels/matrix)

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting)
