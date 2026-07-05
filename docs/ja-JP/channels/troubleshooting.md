---
read_when:
    - チャネル トランスポートは接続済みと表示されるが、返信が失敗する
    - プロバイダーの詳細ドキュメントに進む前に、チャネル固有の確認が必要です
summary: チャネルごとの失敗シグネチャと修正による高速なチャネルレベルのトラブルシューティング
title: チャンネルのトラブルシューティング
x-i18n:
    generated_at: "2026-07-05T11:04:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2699b48ed6ab1f702789d2180daa43aed6ee83023889d0d8821faceb9a943b5
    source_path: channels/troubleshooting.md
    workflow: 16
---

チャンネルは接続するが動作が正しくない場合は、このページを使用します。

## コマンドラダー

まず、これらを順に実行します。

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
- チャンネルプローブでトランスポートが接続済みと表示され、対応している場合は `works` または `audit ok` が表示される

## 更新後

Telegram、iMessage、BlueBubbles 時代の設定、または別の Plugin チャンネルが更新後に消えた場合に使用します。

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

`openclaw status --all` で `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` を探します。これは、チャンネルは設定されているものの、Plugin のセットアップまたは読み込みがチャンネル登録ではなく破損した依存関係ツリーに到達したことを意味します。`openclaw doctor --fix` は古い Plugin ランタイム依存関係のシンボリックリンクと古い認証シャドウを削除し、その後 `openclaw gateway restart` がクリーンな状態を再読み込みします。

## WhatsApp

### WhatsApp の失敗シグネチャ

| 症状                                | 最速の確認方法                                      | 修正                                                                                                                           |
| ----------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 接続済みだが DM に返信しない        | `openclaw pairing list whatsapp`                    | 送信者を承認するか、DM ポリシー/許可リストを切り替える。                                                                      |
| グループメッセージが無視される      | 設定で `requireMention` + メンションパターンを確認  | bot にメンションするか、そのグループのメンションポリシーを緩和する。                                                          |
| QR ログインが 408 でタイムアウトする | Gateway の `HTTPS_PROXY` / `HTTP_PROXY` env を確認  | 到達可能なプロキシを設定する。`NO_PROXY` はバイパス専用に使う。                                                               |
| ランダムな切断/再ログインループ     | `openclaw channels status --probe` + ログ           | 現在接続中でも最近の再接続はフラグ付けされる。ログを監視し、Gateway を再起動し、フラッピングが続く場合は再リンクする。       |
| `status=408 Request Time-out` ループ | プローブ、ログ、doctor、その後 Gateway status       | まずホストの接続性/タイミングを修正する。ループが続く場合は認証をバックアップし、アカウントを再リンクする。                  |
| 返信が数秒/数分遅れて届く           | `openclaw doctor --fix`                             | doctor は、Gateway イベントループを劣化させていることが確認された古いローカル TUI クライアントを停止する。                    |

完全なトラブルシューティング: [WhatsApp トラブルシューティング](/ja-JP/channels/whatsapp#troubleshooting)

## Telegram

### Telegram の失敗シグネチャ

| 症状                                    | 最速の確認方法                                   | 修正                                                                                                                       |
| --------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start` しても使用可能な返信フローがない | `openclaw pairing list telegram`                 | ペアリングを承認するか、DM ポリシーを変更する。                                                                           |
| bot はオンラインだがグループが沈黙する  | メンション要件と bot プライバシーモードを確認    | グループで可視化するにはプライバシーモードを無効にするか、bot にメンションする。                                          |
| ネットワークエラーで送信に失敗する      | Telegram API 呼び出し失敗のログを確認            | `api.telegram.org` への DNS/IPv6/プロキシルーティングを修正する。                                                         |
| 起動時に `getMe returned 401` が報告される | 設定済みトークンソースを確認                    | BotFather トークンを再コピーまたは再生成し、`botToken`、`tokenFile`、またはデフォルトアカウントの `TELEGRAM_BOT_TOKEN` を更新する。 |
| ポーリングが停止する、または再接続が遅い | ポーリング診断のために `openclaw logs --follow`  | アップグレードする。再起動が誤検知なら `pollingStallThresholdMs` を調整する。永続的な停止は依然としてプロキシ/DNS/IPv6 を示す。 |
| 起動時に `setMyCommands` が拒否される   | ログで `BOT_COMMANDS_TOO_MUCH` を確認             | Plugin/skill/カスタム Telegram コマンドを減らすか、ネイティブメニューを無効にする。                                      |
| アップグレード後に許可リストでブロックされる | `openclaw security audit` と設定の許可リスト | `openclaw doctor --fix` を実行するか、`@username` を数値の送信者 ID に置き換える。                                        |

完全なトラブルシューティング: [Telegram トラブルシューティング](/ja-JP/channels/telegram#troubleshooting)

## Discord

### Discord の失敗シグネチャ

| 症状                                      | 最速の確認方法                                                                                                               | 修正                                                                                                                                                                                                                                                                |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bot はオンラインだが guild で返信しない   | `openclaw channels status --probe`                                                                                           | guild/チャンネルを許可し、メッセージコンテンツ intent を確認する。                                                                                                                                                                                                 |
| グループメッセージが無視される            | メンションゲートで破棄されたログを確認                                                                                       | bot にメンションするか、guild/チャンネルの `requireMention: false` を設定する。                                                                                                                                                                                     |
| 入力中/トークン使用はあるが Discord メッセージがない | これがアンビエントルームイベントか、モデルが `message(action=send)` を逃したオプトイン済みの `message_tool` ルームかを確認 | Gateway の詳細ログで抑制された最終ペイロードメタデータを確認し、`messages.groupChat.unmentionedInbound` を検証し、[アンビエントルームイベント](/ja-JP/channels/ambient-room-events) を読むか、通常のグループリクエストでは `messages.groupChat.visibleReplies: "automatic"` を維持する。 |
| DM の返信がない                           | `openclaw pairing list discord`                                                                                              | DM ペアリングを承認するか、DM ポリシーを調整する。                                                                                                                                                                                                                  |

完全なトラブルシューティング: [Discord トラブルシューティング](/ja-JP/channels/discord#troubleshooting)

## Slack

### Slack の失敗シグネチャ

| 症状                                      | 最速の確認方法                            | 修正                                                                                                                                                 |
| ----------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode は接続済みだが応答がない      | `openclaw channels status --probe`        | app token + bot token と必要な scopes を確認する。SecretRef ベースのセットアップでは `botTokenStatus` / `appTokenStatus = configured_unavailable` に注意する。 |
| DM がブロックされる                       | `openclaw pairing list slack`             | ペアリングを承認するか、DM ポリシーを緩和する。                                                                                                     |
| チャンネルメッセージが無視される          | `groupPolicy` とチャンネル許可リストを確認 | チャンネルを許可するか、ポリシーを `open` に切り替える。                                                                                            |

完全なトラブルシューティング: [Slack トラブルシューティング](/ja-JP/channels/slack#troubleshooting)

## iMessage

### iMessage の失敗シグネチャ

| 症状                                  | 最速の確認方法                                          | 修正                                                                  |
| ------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| `imsg` が見つからない、または非 macOS で失敗する | `openclaw channels status --probe --channel imessage`   | Messages Mac で OpenClaw を実行するか、`cliPath` に SSH ラッパーを使用する。 |
| macOS で送信できるが受信できない      | Messages automation の macOS プライバシー権限を確認     | TCC 権限を再付与し、チャンネルプロセスを再起動する。                 |
| DM 送信者がブロックされる             | `openclaw pairing list imessage`                        | ペアリングを承認するか、許可リストを更新する。                       |

完全なトラブルシューティング: [iMessage トラブルシューティング](/ja-JP/channels/imessage#troubleshooting)

## Signal

### Signal の失敗シグネチャ

| 症状                              | 最速の確認方法                             | 修正                                                     |
| --------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| デーモンに到達可能だが bot が沈黙する | `openclaw channels status --probe`         | `signal-cli` デーモン URL/アカウントと受信モードを確認する。 |
| DM がブロックされる               | `openclaw pairing list signal`             | 送信者を承認するか、DM ポリシーを調整する。             |
| グループ返信がトリガーされない    | グループ許可リストとメンションパターンを確認 | 送信者/グループを追加するか、ゲートを緩める。           |

完全なトラブルシューティング: [Signal トラブルシューティング](/ja-JP/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot の失敗シグネチャ

| 症状                                      | 最速の確認方法                              | 修正                                                           |
| ----------------------------------------- | ------------------------------------------- | -------------------------------------------------------------- |
| bot が「火星に行った」と返信する          | 設定で `appId` と `clientSecret` を確認     | 認証情報を設定するか、Gateway を再起動する。                   |
| インバウンドメッセージがない              | `openclaw channels status --probe`          | QQ Open Platform で認証情報を確認する。                        |
| 音声が文字起こしされない                  | STT プロバイダー設定を確認                  | `channels.qqbot.stt` または `tools.media.audio` を設定する。    |
| プロアクティブメッセージが届かない        | QQ platform のインタラクション要件を確認    | QQ は最近のインタラクションがない bot 起点のメッセージをブロックする場合がある。 |

完全なトラブルシューティング: [QQ Bot トラブルシューティング](/ja-JP/channels/qqbot#troubleshooting)

## Matrix

### Matrix の失敗シグネチャ

| 症状                             | 最速の確認方法                          | 修正                                                                       |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| ログイン済みだがルームメッセージを無視する | `openclaw channels status --probe`     | `groupPolicy`、ルーム許可リスト、メンションゲーティングを確認する。                  |
| DM が処理されない                  | `openclaw pairing list matrix`         | 送信者を承認するか、DM ポリシーを調整する。                                       |
| 暗号化ルームが失敗する                | `openclaw matrix verify status`        | デバイスを再検証し、その後 `openclaw matrix verify backup status` を確認する。  |
| バックアップの復元が保留中または壊れている    | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore` を実行するか、リカバリーキー付きで再実行する。 |
| クロス署名/bootstrap が正しく見えない | `openclaw matrix verify bootstrap`     | シークレットストレージ、クロス署名、バックアップ状態を 1 回で修復する。       |

完全なセットアップと設定: [Matrix](/ja-JP/channels/matrix)

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting)
