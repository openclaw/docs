---
read_when:
    - チャンネル transport は接続済みと表示されるが返信に失敗する
    - 詳細なプロバイダードキュメントの前に、チャンネル固有のチェックが必要です
summary: 高速なチャネルレベルのトラブルシューティングと、チャネルごとの障害シグネチャおよび修正方法
title: チャネルのトラブルシューティング
x-i18n:
    generated_at: "2026-06-27T10:43:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56b64030ec56553b4c2e156195806029f91bc8cc449588a242b0f45f8bbddb6e
    source_path: channels/troubleshooting.md
    workflow: 16
---

チャネルは接続できるが動作が間違っている場合は、このページを使用します。

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
- チャネルプローブでトランスポートが接続済みと表示され、サポートされている場合は `works` または `audit ok` と表示される

## 更新後

Telegram、iMessage、BlueBubbles 時代の設定、または別の Plugin
チャネルが更新後に消える場合に使用します。

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

`openclaw status --all` で `plugin load failed: dependency tree corrupted; run openclaw doctor
--fix` を探します。これはチャネルは設定されているが、
Plugin のセットアップ/ロードパスがチャネル登録ではなく破損した依存関係ツリーに
到達したことを意味します。`openclaw doctor --fix` は古い Plugin 依存関係のステージング
ディレクトリと古い認証シャドウを削除し、その後 `openclaw gateway restart` が
クリーンな状態を再読み込みします。

## WhatsApp

### WhatsApp の失敗シグネチャ

| 症状                                | 最速の確認                                          | 修正                                                                                                                              |
| ----------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 接続済みだが DM 返信がない          | `openclaw pairing list whatsapp`                    | 送信者を承認するか、DM ポリシー/許可リストを切り替えます。                                                                       |
| グループメッセージが無視される      | 設定内の `requireMention` とメンションパターンを確認 | ボットにメンションするか、そのグループのメンションポリシーを緩和します。                                                        |
| QR ログインが 408 でタイムアウトする | Gateway の `HTTPS_PROXY` / `HTTP_PROXY` env を確認  | 到達可能なプロキシを設定します。`NO_PROXY` はバイパスにのみ使用します。                                                          |
| ランダムな切断/再ログインループ     | `openclaw channels status --probe` + ログ           | 現在接続中でも最近の再接続はフラグされます。ログを監視し、Gateway を再起動して、それでも不安定なら再リンクします。             |
| `status=408 Request Time-out` ループ | プローブ、ログ、doctor、その後 Gateway ステータス   | まずホストの接続性/タイミングを修正します。ループが続く場合は認証をバックアップしてアカウントを再リンクします。                |
| 返信が数秒/数分遅れて届く           | `openclaw doctor --fix`                             | doctor は、Gateway イベントループを劣化させていることが確認された古いローカル TUI クライアントを停止します。                    |

完全なトラブルシューティング: [WhatsApp のトラブルシューティング](/ja-JP/channels/whatsapp#troubleshooting)

## Telegram

### Telegram の失敗シグネチャ

| 症状                                   | 最速の確認                                     | 修正                                                                                                                               |
| -------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/start` しても利用可能な返信フローがない | `openclaw pairing list telegram`               | ペアリングを承認するか、DM ポリシーを変更します。                                                                                  |
| ボットはオンラインだがグループが沈黙する | メンション要件とボットのプライバシーモードを確認 | グループでの可視性のためにプライバシーモードを無効にするか、ボットにメンションします。                                             |
| ネットワークエラーで送信に失敗する       | Telegram API 呼び出し失敗のログを調査          | `api.telegram.org` への DNS/IPv6/プロキシルーティングを修正します。                                                                 |
| 起動時に `getMe returned 401` と報告される | 設定されたトークンソースを確認                 | BotFather トークンを再コピーまたは再生成し、`botToken`、`tokenFile`、またはデフォルトアカウントの `TELEGRAM_BOT_TOKEN` を更新します。 |
| ポーリングが停止する、または再接続が遅い | ポーリング診断のために `openclaw logs --follow` | アップグレードします。再起動が偽陽性なら、`pollingStallThresholdMs` を調整します。持続的な停止は引き続きプロキシ/DNS/IPv6 を示します。 |
| 起動時に `setMyCommands` が拒否される   | `BOT_COMMANDS_TOO_MUCH` のログを調査            | Plugin/skill/カスタム Telegram コマンドを減らすか、ネイティブメニューを無効にします。                                             |
| アップグレード後に許可リストでブロックされる | `openclaw security audit` と設定の許可リスト   | `openclaw doctor --fix` を実行するか、`@username` を数値の送信者 ID に置き換えます。                                               |

完全なトラブルシューティング: [Telegram のトラブルシューティング](/ja-JP/channels/telegram#troubleshooting)

## Discord

### Discord の失敗シグネチャ

| 症状                                      | 最速の確認                                                                                                                   | 修正                                                                                                                                                                                                                                                                      |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ボットはオンラインだが guild 返信がない   | `openclaw channels status --probe`                                                                                           | guild/チャネルを許可し、メッセージ内容 intent を確認します。                                                                                                                                                                                                              |
| グループメッセージが無視される            | メンションゲートによるドロップのログを確認                                                                                   | ボットにメンションするか、guild/チャネルの `requireMention: false` を設定します。                                                                                                                                                                                        |
| タイピング/トークン使用はあるが Discord メッセージがない | これが ambient ルームイベントなのか、モデルが `message(action=send)` を逃したオプトイン済み `message_tool` ルームなのかを確認 | Gateway の詳細ログで抑制された最終ペイロードメタデータを調査し、`messages.groupChat.unmentionedInbound` を確認し、[Ambient ルームイベント](/ja-JP/channels/ambient-room-events)を読むか、通常のグループリクエストでは `messages.groupChat.visibleReplies: "automatic"` を維持します。 |
| DM 返信がない                             | `openclaw pairing list discord`                                                                                              | DM ペアリングを承認するか、DM ポリシーを調整します。                                                                                                                                                                                                                     |

完全なトラブルシューティング: [Discord のトラブルシューティング](/ja-JP/channels/discord#troubleshooting)

## Slack

### Slack の失敗シグネチャ

| 症状                                      | 最速の確認                                | 修正                                                                                                                                                     |
| ----------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ソケットモードは接続済みだが応答がない    | `openclaw channels status --probe`        | app token + bot token と必要なスコープを確認します。SecretRef ベースのセットアップでは `botTokenStatus` / `appTokenStatus = configured_unavailable` に注意します。 |
| DM がブロックされる                       | `openclaw pairing list slack`             | ペアリングを承認するか、DM ポリシーを緩和します。                                                                                                       |
| チャネルメッセージが無視される            | `groupPolicy` とチャネル許可リストを確認 | チャネルを許可するか、ポリシーを `open` に切り替えます。                                                                                                |

完全なトラブルシューティング: [Slack のトラブルシューティング](/ja-JP/channels/slack#troubleshooting)

## iMessage

### iMessage の失敗シグネチャ

| 症状                                      | 最速の確認                                              | 修正                                                                  |
| ----------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| `imsg` がない、または非 macOS で失敗する  | `openclaw channels status --probe --channel imessage`   | Messages の Mac で OpenClaw を実行するか、`cliPath` に SSH ラッパーを使用します。 |
| macOS で送信できるが受信できない          | Messages 自動化の macOS プライバシー権限を確認          | TCC 権限を再付与し、チャネルプロセスを再起動します。                  |
| DM 送信者がブロックされる                 | `openclaw pairing list imessage`                        | ペアリングを承認するか、許可リストを更新します。                      |

完全なトラブルシューティング:

- [iMessage のトラブルシューティング](/ja-JP/channels/imessage#troubleshooting)

## Signal

### Signal の失敗シグネチャ

| 症状                                | 最速の確認                                | 修正                                                       |
| ----------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| デーモンに到達できるがボットが沈黙する | `openclaw channels status --probe`        | `signal-cli` デーモン URL/アカウントと受信モードを確認します。 |
| DM がブロックされる                 | `openclaw pairing list signal`            | 送信者を承認するか、DM ポリシーを調整します。             |
| グループ返信がトリガーされない      | グループ許可リストとメンションパターンを確認 | 送信者/グループを追加するか、ゲートを緩和します。          |

完全なトラブルシューティング: [Signal のトラブルシューティング](/ja-JP/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot の失敗シグネチャ

| 症状                                  | 最速の確認                                | 修正                                                              |
| ------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| ボットが「火星へ行きました」と返信する | 設定の `appId` と `clientSecret` を確認   | 認証情報を設定するか、Gateway を再起動します。                    |
| 受信メッセージがない                  | `openclaw channels status --probe`        | QQ Open Platform の認証情報を確認します。                         |
| 音声が文字起こしされない              | STT provider 設定を確認                   | `channels.qqbot.stt` または `tools.media.audio` を設定します。     |
| プロアクティブメッセージが届かない    | QQ プラットフォームのインタラクション要件を確認 | QQ は最近のインタラクションがないボット発信メッセージをブロックする場合があります。 |

Full トラブルシューティング: [QQ Bot トラブルシューティング](/ja-JP/channels/qqbot#troubleshooting)

## Matrix

### Matrix の失敗シグネチャ

| 症状                             | 最速の確認                          | 修正                                                                       |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| ログイン済みだがルームメッセージを無視する | `openclaw channels status --probe`     | `groupPolicy`、ルーム許可リスト、メンションゲートを確認する。                  |
| DM が処理されない                  | `openclaw pairing list matrix`         | 送信者を承認するか、DM ポリシーを調整する。                                       |
| 暗号化ルームが失敗する                | `openclaw matrix verify status`        | デバイスを再検証し、その後 `openclaw matrix verify backup status` を確認する。  |
| バックアップ復元が保留中または壊れている    | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore` を実行するか、リカバリキーを使って再実行する。 |
| クロス署名/bootstrap が正しく見えない | `openclaw matrix verify bootstrap`     | シークレットストレージ、クロス署名、バックアップ状態を一度に修復する。       |

完全なセットアップと設定: [Matrix](/ja-JP/channels/matrix)

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
