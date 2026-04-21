---
read_when:
    - チャネルのトランスポートでは接続済みと表示されるが、返信に失敗する
    - 詳細なプロバイダのドキュメントを見る前に、チャネル固有の確認が必要です
summary: チャネルごとの障害シグネチャと修正方法による迅速なチャネルレベルのトラブルシューティング
title: チャネルのトラブルシューティング
x-i18n:
    generated_at: "2026-04-21T04:44:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e9e8f093bee1c7aafc244d6b999a957b7571cc125096d72060d0df52bf52c0
    source_path: channels/troubleshooting.md
    workflow: 15
---

# チャネルのトラブルシューティング

チャネルは接続しているのに動作がおかしい場合は、このページを使用してください。

## コマンドの順序

まず、次のコマンドをこの順番で実行してください。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常時のベースライン:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`、`write-capable`、または `admin-capable`
- チャネルプローブでトランスポートが接続済みと表示され、対応している場合は `works` または `audit ok` も表示される

## WhatsApp

### WhatsAppの障害シグネチャ

| 症状 | 最も速い確認方法 | 修正 |
| ------------------------------- | --------------------------------------------------- | ------------------------------------------------------- |
| 接続済みだがDM返信がない | `openclaw pairing list whatsapp` | 送信者を承認するか、DMポリシー/許可リストを切り替える。 |
| グループメッセージが無視される | 設定の `requireMention` とメンションパターンを確認する | ボットにメンションするか、そのグループのメンションポリシーを緩和する。 |
| ランダムな切断/再ログインループ | `openclaw channels status --probe` とログ | 再ログインし、認証情報ディレクトリが正常であることを確認する。 |

完全なトラブルシューティング: [/channels/whatsapp#troubleshooting](/ja-JP/channels/whatsapp#troubleshooting)

## Telegram

### Telegramの障害シグネチャ

| 症状 | 最も速い確認方法 | 修正 |
| ----------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start` は動くが実用的な返信フローがない | `openclaw pairing list telegram` | ペアリングを承認するか、DMポリシーを変更する。 |
| ボットはオンラインだがグループでは無反応 | メンション必須設定とボットのプライバシーモードを確認する | グループで見えるようにプライバシーモードを無効にするか、ボットにメンションする。 |
| ネットワークエラーで送信に失敗する | Telegram API呼び出し失敗のログを確認する | `api.telegram.org` へのDNS/IPv6/プロキシ経路を修正する。 |
| ポーリングが停止する、または再接続が遅い | ポーリング診断のために `openclaw logs --follow` を確認する | アップグレードする。再起動が誤検知なら `pollingStallThresholdMs` を調整する。停止が続く場合は、依然としてプロキシ/DNS/IPv6が原因です。 |
| 起動時に `setMyCommands` が拒否される | `BOT_COMMANDS_TOO_MUCH` のログを確認する | Plugin/Skills/カスタムTelegramコマンドを減らすか、ネイティブメニューを無効にする。 |
| アップグレード後に許可リストで自分がブロックされる | `openclaw security audit` と設定の許可リスト | `openclaw doctor --fix` を実行するか、`@username` を数値の送信者IDに置き換える。 |

完全なトラブルシューティング: [/channels/telegram#troubleshooting](/ja-JP/channels/telegram#troubleshooting)

## Discord

### Discordの障害シグネチャ

| 症状 | 最も速い確認方法 | 修正 |
| ------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| ボットはオンラインだがギルドで返信しない | `openclaw channels status --probe` | ギルド/チャネルを許可し、message content intent を確認する。 |
| グループメッセージが無視される | メンションゲートで破棄されたログを確認する | ボットにメンションするか、ギルド/チャネルの `requireMention: false` を設定する。 |
| DM返信がない | `openclaw pairing list discord` | DMペアリングを承認するか、DMポリシーを調整する。 |

完全なトラブルシューティング: [/channels/discord#troubleshooting](/ja-JP/channels/discord#troubleshooting)

## Slack

### Slackの障害シグネチャ

| 症状 | 最も速い確認方法 | 修正 |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode は接続済みだが応答がない | `openclaw channels status --probe` | app token と bot token、および必要なスコープを確認する。SecretRefベースの設定では `botTokenStatus` / `appTokenStatus = configured_unavailable` に注意する。 |
| DMがブロックされる | `openclaw pairing list slack` | ペアリングを承認するか、DMポリシーを緩和する。 |
| チャネルメッセージが無視される | `groupPolicy` とチャネル許可リストを確認する | そのチャネルを許可するか、ポリシーを `open` に切り替える。 |

完全なトラブルシューティング: [/channels/slack#troubleshooting](/ja-JP/channels/slack#troubleshooting)

## iMessage と BlueBubbles

### iMessage と BlueBubblesの障害シグネチャ

| 症状 | 最も速い確認方法 | 修正 |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| 受信イベントがない | Webhook/サーバー到達性とアプリ権限を確認する | Webhook URL またはBlueBubblesサーバー状態を修正する。 |
| 送信できるがmacOSで受信できない | Messages自動化のmacOSプライバシー権限を確認する | TCC権限を再付与し、チャネルプロセスを再起動する。 |
| DM送信者がブロックされる | `openclaw pairing list imessage` または `openclaw pairing list bluebubbles` | ペアリングを承認するか、許可リストを更新する。 |

完全なトラブルシューティング:

- [/channels/imessage#troubleshooting](/ja-JP/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/ja-JP/channels/bluebubbles#troubleshooting)

## Signal

### Signalの障害シグネチャ

| 症状 | 最も速い確認方法 | 修正 |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| デーモンには到達できるがボットが無反応 | `openclaw channels status --probe` | `signal-cli` デーモンのURL/アカウントと受信モードを確認する。 |
| DMがブロックされる | `openclaw pairing list signal` | 送信者を承認するか、DMポリシーを調整する。 |
| グループ返信が発火しない | グループ許可リストとメンションパターンを確認する | 送信者/グループを追加するか、ゲートを緩和する。 |

完全なトラブルシューティング: [/channels/signal#troubleshooting](/ja-JP/channels/signal#troubleshooting)

## QQ Bot

### QQ Botの障害シグネチャ

| 症状 | 最も速い確認方法 | 修正 |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| ボットが「gone to Mars」と返信する | 設定の `appId` と `clientSecret` を確認する | 認証情報を設定するか、Gatewayを再起動する。 |
| 受信メッセージがない | `openclaw channels status --probe` | QQ Open Platform 上の認証情報を確認する。 |
| 音声が文字起こしされない | STTプロバイダ設定を確認する | `channels.qqbot.stt` または `tools.media.audio` を設定する。 |
| 能動的なメッセージが届かない | QQプラットフォームのインタラクション要件を確認する | 直近のやり取りがない場合、QQはボット主導のメッセージをブロックすることがあります。 |

完全なトラブルシューティング: [/channels/qqbot#troubleshooting](/ja-JP/channels/qqbot#troubleshooting)

## Matrix

### Matrixの障害シグネチャ

| 症状 | 最も速い確認方法 | 修正 |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| ログイン済みだがルームメッセージを無視する | `openclaw channels status --probe` | `groupPolicy`、ルーム許可リスト、メンションゲートを確認する。 |
| DMが処理されない | `openclaw pairing list matrix` | 送信者を承認するか、DMポリシーを調整する。 |
| 暗号化ルームで失敗する | `openclaw matrix verify status` | デバイスを再検証してから、`openclaw matrix verify backup status` を確認する。 |
| バックアップ復元が保留中/壊れている | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore` を実行するか、リカバリキー付きで再実行する。 |
| クロス署名/ブートストラップが正しく見えない | `openclaw matrix verify bootstrap` | シークレットストレージ、クロス署名、バックアップ状態をまとめて修復する。 |

完全なセットアップと設定: [Matrix](/ja-JP/channels/matrix)
