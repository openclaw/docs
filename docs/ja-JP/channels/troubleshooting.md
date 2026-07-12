---
read_when:
    - チャンネルトランスポートでは接続済みと表示されるが、返信に失敗する
    - プロバイダーの詳細なドキュメントを確認する前に、チャネル固有のチェックが必要です
summary: チャネルごとの障害の兆候と修正方法を使用した迅速なチャネルレベルのトラブルシューティング
title: チャンネルのトラブルシューティング
x-i18n:
    generated_at: "2026-07-11T21:58:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2699b48ed6ab1f702789d2180daa43aed6ee83023889d0d8821faceb9a943b5
    source_path: channels/troubleshooting.md
    workflow: 16
---

チャンネルには接続できるものの、動作が正しくない場合は、このページを使用してください。

## コマンドの実行順序

まず、次のコマンドを順番に実行します。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常時の基準：

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`、`write-capable`、または `admin-capable`
- チャンネルのプローブでトランスポートが接続済みと表示され、サポートされている場合は `works` または `audit ok` と表示される

## 更新後

更新後に Telegram、iMessage、BlueBubbles 時代の設定、または別の Plugin チャンネルが消えた場合は、次を実行します。

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

`openclaw status --all` で `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` を探します。これは、チャンネルは設定されているものの、チャンネルを登録する代わりに、Plugin のセットアップまたは読み込みで破損した依存関係ツリーが検出されたことを意味します。`openclaw doctor --fix` は、古くなった Plugin ランタイムの依存関係シンボリックリンクと認証シャドウを削除し、その後 `openclaw gateway restart` がクリーンな状態を再読み込みします。

## WhatsApp

### WhatsApp の障害パターン

| 症状 | 最も速い確認方法 | 修正方法 |
| ----------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 接続済みだが DM に返信しない | `openclaw pairing list whatsapp` | 送信者を承認するか、DM ポリシーまたは許可リストを変更します。 |
| グループメッセージが無視される | 設定内の `requireMention` とメンションパターンを確認する | ボットにメンションするか、そのグループのメンションポリシーを緩和します。 |
| QR ログインが 408 でタイムアウトする | Gateway の `HTTPS_PROXY` / `HTTP_PROXY` 環境変数を確認する | 到達可能なプロキシを設定します。`NO_PROXY` はバイパスする場合にのみ使用してください。 |
| ランダムな切断と再ログインのループ | `openclaw channels status --probe` とログ | 現在接続されていても、最近の再接続はフラグ付けされます。ログを監視し、Gateway を再起動してから、接続の不安定さが続く場合は再リンクします。 |
| `status=408 Request Time-out` のループ | プローブ、ログ、doctor、Gateway のステータスの順に確認する | まずホストの接続性やタイミングの問題を修正します。ループが続く場合は認証情報をバックアップし、アカウントを再リンクします。 |
| 返信が数秒から数分遅れて届く | `openclaw doctor --fix` | doctor は、Gateway のイベントループを低下させていることが確認された古いローカル TUI クライアントを停止します。 |

詳細なトラブルシューティング：[WhatsApp のトラブルシューティング](/ja-JP/channels/whatsapp#troubleshooting)

## Telegram

### Telegram の障害パターン

| 症状 | 最も速い確認方法 | 修正方法 |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start` を実行しても利用可能な返信フローがない | `openclaw pairing list telegram` | ペアリングを承認するか、DM ポリシーを変更します。 |
| ボットはオンラインだがグループでは応答しない | メンション要件とボットのプライバシーモードを確認する | グループ内で表示されるようプライバシーモードを無効にするか、ボットにメンションします。 |
| ネットワークエラーで送信に失敗する | ログで Telegram API 呼び出しの失敗を確認する | `api.telegram.org` への DNS、IPv6、またはプロキシのルーティングを修正します。 |
| 起動時に `getMe returned 401` と報告される | 設定済みのトークンソースを確認する | BotFather トークンを再コピーまたは再生成し、`botToken`、`tokenFile`、またはデフォルトアカウントの `TELEGRAM_BOT_TOKEN` を更新します。 |
| ポーリングが停止するか再接続が遅い | `openclaw logs --follow` でポーリング診断を確認する | アップグレードします。再起動が誤検知の場合は、`pollingStallThresholdMs` を調整します。停止が続く場合は、引き続きプロキシ、DNS、または IPv6 の問題が疑われます。 |
| 起動時に `setMyCommands` が拒否される | ログで `BOT_COMMANDS_TOO_MUCH` を確認する | Plugin、Skill、またはカスタムの Telegram コマンドを減らすか、ネイティブメニューを無効にします。 |
| アップグレード後に許可リストでブロックされる | `openclaw security audit` と設定の許可リスト | `openclaw doctor --fix` を実行するか、`@username` を数値の送信者 ID に置き換えます。 |

詳細なトラブルシューティング：[Telegram のトラブルシューティング](/ja-JP/channels/telegram#troubleshooting)

## Discord

### Discord の障害パターン

| 症状 | 最も速い確認方法 | 修正方法 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ボットはオンラインだがギルドで返信しない | `openclaw channels status --probe` | ギルドまたはチャンネルを許可し、メッセージコンテンツのインテントを確認します。 |
| グループメッセージが無視される | メンションゲーティングによる破棄がログに記録されていないか確認する | ボットにメンションするか、ギルドまたはチャンネルの `requireMention: false` を設定します。 |
| 入力中表示やトークン使用量はあるが Discord メッセージがない | これがアンビエントルームイベントか、モデルが `message(action=send)` を実行しなかったオプトイン済みの `message_tool` ルームかを確認する | Gateway の詳細ログで抑制された最終ペイロードのメタデータを確認し、`messages.groupChat.unmentionedInbound` を検証して、[アンビエントルームイベント](/ja-JP/channels/ambient-room-events)を読むか、通常のグループリクエストでは `messages.groupChat.visibleReplies: "automatic"` を維持します。 |
| DM の返信がない | `openclaw pairing list discord` | DM のペアリングを承認するか、DM ポリシーを調整します。 |

詳細なトラブルシューティング：[Discord のトラブルシューティング](/ja-JP/channels/discord#troubleshooting)

## Slack

### Slack の障害パターン

| 症状 | 最も速い確認方法 | 修正方法 |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| ソケットモードは接続済みだが応答がない | `openclaw channels status --probe` | アプリトークン、ボットトークン、必要なスコープを確認します。SecretRef ベースのセットアップでは、`botTokenStatus` / `appTokenStatus = configured_unavailable` がないか確認します。 |
| DM がブロックされる | `openclaw pairing list slack` | ペアリングを承認するか、DM ポリシーを緩和します。 |
| チャンネルメッセージが無視される | `groupPolicy` とチャンネルの許可リストを確認する | チャンネルを許可するか、ポリシーを `open` に変更します。 |

詳細なトラブルシューティング：[Slack のトラブルシューティング](/ja-JP/channels/slack#troubleshooting)

## iMessage

### iMessage の障害パターン

| 症状 | 最も速い確認方法 | 修正方法 |
| ------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------- |
| macOS 以外で `imsg` がない、または失敗する | `openclaw channels status --probe --channel imessage` | メッセージアプリがある Mac で OpenClaw を実行するか、`cliPath` に SSH ラッパーを使用します。 |
| macOS で送信できるが受信できない | メッセージアプリの自動操作に関する macOS のプライバシー権限を確認する | TCC 権限を再付与し、チャンネルプロセスを再起動します。 |
| DM の送信者がブロックされる | `openclaw pairing list imessage` | ペアリングを承認するか、許可リストを更新します。 |

詳細なトラブルシューティング：[iMessage のトラブルシューティング](/ja-JP/channels/imessage#troubleshooting)

## Signal

### Signal の障害パターン

| 症状 | 最も速い確認方法 | 修正方法 |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| デーモンには到達できるがボットが応答しない | `openclaw channels status --probe` | `signal-cli` デーモンの URL、アカウント、受信モードを確認します。 |
| DM がブロックされる | `openclaw pairing list signal` | 送信者を承認するか、DM ポリシーを調整します。 |
| グループの返信がトリガーされない | グループの許可リストとメンションパターンを確認する | 送信者またはグループを追加するか、ゲーティングを緩和します。 |

詳細なトラブルシューティング：[Signal のトラブルシューティング](/ja-JP/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot の障害パターン

| 症状 | 最も速い確認方法 | 修正方法 |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| ボットが「火星へ行った」と返信する | 設定内の `appId` と `clientSecret` を確認する | 認証情報を設定するか、Gateway を再起動します。 |
| 受信メッセージがない | `openclaw channels status --probe` | QQ Open Platform で認証情報を確認します。 |
| 音声が文字起こしされない | STT プロバイダーの設定を確認する | `channels.qqbot.stt` または `tools.media.audio` を設定します。 |
| プロアクティブメッセージが届かない | QQ プラットフォームのインタラクション要件を確認する | 最近のインタラクションがない場合、QQ がボット起点のメッセージをブロックすることがあります。 |

詳細なトラブルシューティング：[QQ Bot のトラブルシューティング](/ja-JP/channels/qqbot#troubleshooting)

## Matrix

### Matrix の障害パターン

| 症状 | 最速の確認方法 | 修正方法 |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| ログイン済みだがルームのメッセージを無視する | `openclaw channels status --probe` | `groupPolicy`、ルームの許可リスト、メンション制限を確認します。 |
| DM が処理されない | `openclaw pairing list matrix` | 送信者を承認するか、DM ポリシーを調整します。 |
| 暗号化されたルームで失敗する | `openclaw matrix verify status` | デバイスを再検証してから、`openclaw matrix verify backup status` を確認します。 |
| バックアップの復元が保留中または失敗している | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore` を実行するか、復旧キーを指定して再実行します。 |
| クロス署名またはブートストラップの状態に問題がある | `openclaw matrix verify bootstrap` | シークレットストレージ、クロス署名、バックアップの状態を一度に修復します。 |

完全なセットアップと設定：[Matrix](/ja-JP/channels/matrix)

## 関連項目

- [ペアリング](/ja-JP/channels/pairing)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting)
