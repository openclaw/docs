---
read_when:
    - チャンネルトランスポートでは接続済みと表示されるが、返信に失敗する
    - 詳細なプロバイダードキュメントに進む前に、チャンネル固有の確認が必要です
summary: チャンネルごとの障害シグネチャと修正方法による迅速なチャンネルレベルのトラブルシューティング
title: チャンネルのトラブルシューティング
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T04:48:22Z"
  model: gpt-5.4
  provider: openai
  source_hash: ae605835c3566958341b11d8bdfc3cd4cb4656142bb2953933d06ed6018a483f
  source_path: channels/troubleshooting.md
  workflow: 15
---

チャンネルは接続されているが動作がおかしい場合は、このページを使ってください。

## コマンドラダー

まず、次の順番で実行してください。

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
- チャンネル probe でトランスポート接続済みと表示され、サポートされる場合は `works` または `audit ok` が表示される

## WhatsApp

### WhatsApp の障害シグネチャ

| 症状 | 最速の確認 | 修正 |
| ------------------------------- | --------------------------------------------------- | ------------------------------------------------------- |
| 接続済みだが DM に返信しない | `openclaw pairing list whatsapp` | 送信者を承認するか、DM ポリシー/許可リストを切り替える。 |
| グループメッセージが無視される | config の `requireMention` + mention パターンを確認 | ボットを mention するか、そのグループの mention ポリシーを緩める。 |
| ランダムな切断/再ログインループ | `openclaw channels status --probe` + ログ | 再ログインし、認証情報ディレクトリが正常であることを確認する。 |

完全なトラブルシューティング: [WhatsApp troubleshooting](/ja-JP/channels/whatsapp#troubleshooting)

## Telegram

### Telegram の障害シグネチャ

| 症状 | 最速の確認 | 修正 |
| ----------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start` は動くが返信フローが使えない | `openclaw pairing list telegram` | ペアリングを承認するか、DM ポリシーを変更する。 |
| ボットはオンラインだがグループで無反応 | mention 必須設定とボットの privacy mode を確認 | グループ可視性のために privacy mode を無効にするか、ボットを mention する。 |
| ネットワークエラーで送信に失敗する | ログで Telegram API 呼び出し失敗を確認 | `api.telegram.org` への DNS/IPv6/プロキシルーティングを修正する。 |
| ポーリングが停止する、または再接続が遅い | `openclaw logs --follow` でポーリング診断を確認 | アップグレードする。再起動が誤検出なら `pollingStallThresholdMs` を調整する。継続的な停止は依然としてプロキシ/DNS/IPv6 が原因。 |
| 起動時に `setMyCommands` が拒否される | ログで `BOT_COMMANDS_TOO_MUCH` を確認 | Plugin/Skills/カスタム Telegram コマンドを減らすか、ネイティブメニューを無効にする。 |
| アップグレード後に許可リストで自分がブロックされる | `openclaw security audit` と config の許可リスト | `openclaw doctor --fix` を実行するか、`@username` を数値の送信者 ID に置き換える。 |

完全なトラブルシューティング: [Telegram troubleshooting](/ja-JP/channels/telegram#troubleshooting)

## Discord

### Discord の障害シグネチャ

| 症状 | 最速の確認 | 修正 |
| ------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| ボットはオンラインだが guild に返信しない | `openclaw channels status --probe` | guild/channel を許可し、message content intent を確認する。 |
| グループメッセージが無視される | ログで mention gating による破棄を確認 | ボットを mention するか、guild/channel の `requireMention: false` を設定する。 |
| DM 返信がない | `openclaw pairing list discord` | DM ペアリングを承認するか、DM ポリシーを調整する。 |

完全なトラブルシューティング: [Discord troubleshooting](/ja-JP/channels/discord#troubleshooting)

## Slack

### Slack の障害シグネチャ

| 症状 | 最速の確認 | 修正 |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode は接続済みだが応答しない | `openclaw channels status --probe` | app token + bot token と必要なスコープを確認する。SecretRef 利用時は `botTokenStatus` / `appTokenStatus = configured_unavailable` に注意する。 |
| DM がブロックされる | `openclaw pairing list slack` | ペアリングを承認するか、DM ポリシーを緩める。 |
| チャンネルメッセージが無視される | `groupPolicy` とチャンネル許可リストを確認 | チャンネルを許可するか、ポリシーを `open` に切り替える。 |

完全なトラブルシューティング: [Slack troubleshooting](/ja-JP/channels/slack#troubleshooting)

## iMessage と BlueBubbles

### iMessage と BlueBubbles の障害シグネチャ

| 症状 | 最速の確認 | 修正 |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| 受信イベントがない | Webhook/サーバー到達性とアプリ権限を確認 | Webhook URL または BlueBubbles サーバー状態を修正する。 |
| 送信はできるが macOS で受信できない | Messages 自動化に対する macOS プライバシー権限を確認 | TCC 権限を再付与し、チャンネルプロセスを再起動する。 |
| DM 送信者がブロックされる | `openclaw pairing list imessage` または `openclaw pairing list bluebubbles` | ペアリングを承認するか、許可リストを更新する。 |

完全なトラブルシューティング:

- [iMessage troubleshooting](/ja-JP/channels/imessage#troubleshooting)
- [BlueBubbles troubleshooting](/ja-JP/channels/bluebubbles#troubleshooting)

## Signal

### Signal の障害シグネチャ

| 症状 | 最速の確認 | 修正 |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| デーモンには到達できるがボットが無反応 | `openclaw channels status --probe` | `signal-cli` デーモンの URL/アカウントと受信モードを確認する。 |
| DM がブロックされる | `openclaw pairing list signal` | 送信者を承認するか、DM ポリシーを調整する。 |
| グループ返信がトリガーされない | グループ許可リストと mention パターンを確認 | 送信者/グループを追加するか、ゲーティングを緩める。 |

完全なトラブルシューティング: [Signal troubleshooting](/ja-JP/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot の障害シグネチャ

| 症状 | 最速の確認 | 修正 |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| ボットが「gone to Mars」と返信する | config の `appId` と `clientSecret` を確認 | 認証情報を設定するか、gateway を再起動する。 |
| 受信メッセージがない | `openclaw channels status --probe` | QQ Open Platform 上の認証情報を確認する。 |
| 音声が文字起こしされない | STT プロバイダー設定を確認 | `channels.qqbot.stt` または `tools.media.audio` を設定する。 |
| 能動メッセージが届かない | QQ プラットフォームのインタラクション要件を確認 | QQ は最近のインタラクションがないとボット起点メッセージをブロックする場合がある。 |

完全なトラブルシューティング: [QQ Bot troubleshooting](/ja-JP/channels/qqbot#troubleshooting)

## Matrix

### Matrix の障害シグネチャ

| 症状 | 最速の確認 | 修正 |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| ログイン済みだがルームメッセージを無視する | `openclaw channels status --probe` | `groupPolicy`、ルーム許可リスト、mention gating を確認する。 |
| DM を処理しない | `openclaw pairing list matrix` | 送信者を承認するか、DM ポリシーを調整する。 |
| 暗号化ルームで失敗する | `openclaw matrix verify status` | デバイスを再検証し、その後 `openclaw matrix verify backup status` を確認する。 |
| バックアップ復元が保留/破損している | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore` を実行するか、リカバリーキー付きで再実行する。 |
| cross-signing/bootstrap がおかしい | `openclaw matrix verify bootstrap` | secret storage、cross-signing、バックアップ状態を一括で修復する。 |

完全なセットアップと設定: [Matrix](/ja-JP/channels/matrix)

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting)
