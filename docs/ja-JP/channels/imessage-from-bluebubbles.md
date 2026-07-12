---
read_when:
    - バンドル版iMessage PluginへのBlueBubblesからの移行を計画する
    - BlueBubblesの設定キーをiMessageの同等項目に変換する
    - iMessage Plugin を有効にする前に imsg を検証する
summary: 古い BlueBubbles 設定を同梱の iMessage Plugin 向けに移行する方法：キーのマッピング、グループ許可リストのゲート、切り替えの検証。
title: BlueBubbles からの移行
x-i18n:
    generated_at: "2026-07-11T21:56:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9d1533c356d3901358c25f0b90e6850124f66d3c14f056d90d5723242076d22
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

BlueBubbles のサポートは削除されました。OpenClaw は、JSON-RPC 経由で [`steipete/imsg`](https://github.com/steipete/imsg) を操作し、BlueBubbles と同じプライベート API サーフェス（`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、ネイティブ投票、グループ管理、添付ファイル）にアクセスする、同梱の `imessage` Plugin を通じてのみ iMessage をサポートします。1 つの CLI バイナリが、BlueBubbles サーバー、クライアントアプリ、Webhook の連携処理を置き換えます。REST エンドポイントも Webhook 認証もありません。

このガイドでは、古い `channels.bluebubbles` 設定を `channels.imessage` に移行します。これ以外にサポートされる移行経路はありません。現在の OpenClaw では、残存する `channels.bluebubbles` ブロックは機能しません。これを読み取るランタイムはありません。

<Note>
簡潔な告知と運用者向け概要については、[BlueBubbles の削除と imsg による iMessage 経路](/ja-JP/announcements/bluebubbles-imessage)を参照してください。
</Note>

## 移行チェックリスト

古い BlueBubbles 設定の内容をすでに把握している場合、最短で安全な手順は次のとおりです。

1. Messages.app を実行している Mac 上で `imsg` を直接検証します（`imsg chats`、`imsg history`、`imsg send`、`imsg rpc --help`）。
2. 動作設定キーを `channels.bluebubbles` から `channels.imessage` にコピーします：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`includeAttachments`、`attachmentRoots`、`mediaMaxMb`、`textChunkLimit`、`coalesceSameSenderDms`、`actions`。
3. 存在しなくなったトランスポートキーを削除します：`serverUrl`、`password`、Webhook URL、BlueBubbles サーバー設定。
4. Gateway が Messages Mac 上で稼働していない場合は、`channels.imessage.cliPath` に SSH ラッパーを設定し、リモートで添付ファイルを取得するために `remoteHost` を設定します。
5. `channels.imessage` を有効にして Gateway を再起動し、`openclaw channels status --probe --channel imessage` を実行します。
6. 1 件の DM、許可済みのグループ 1 件、有効にしている場合は添付ファイル、そしてエージェントに使用させる予定のすべてのプライベート API アクションをテストします。
7. iMessage 経路を検証した後、BlueBubbles サーバーと古い `channels.bluebubbles` 設定を削除します。

## imsg の機能

`imsg` は Messages 用のローカル macOS CLI です。OpenClaw は `imsg rpc` を子プロセスとして起動し、標準入力と標準出力を介して JSON-RPC で通信します。HTTP サーバー、Webhook URL、バックグラウンドデーモン、起動エージェント、公開するポートはありません。

- 読み取りは、読み取り専用の SQLite ハンドルを使用して `~/Library/Messages/chat.db` から行われます。
- リアルタイムの受信メッセージは `imsg watch` / `watch.subscribe` から取得されます。これは `chat.db` のファイルシステムイベントを追跡し、フォールバックとしてポーリングを使用します。
- 通常のテキストとファイルの送信には Messages.app の自動操作を使用します。
- 高度なアクションでは、`imsg launch` を使用して `imsg` ヘルパーを Messages.app に注入します。これにより、開封確認、入力中インジケーター、リッチ送信、編集、送信取消、スレッド返信、Tapback、投票、グループ管理が利用可能になります。
- Linux ビルドでは、コピーされた `chat.db` を調査できますが、送信、Mac 上の稼働中データベースの監視、Messages.app の操作はできません。OpenClaw iMessage では、サインイン済みの Mac 上で `imsg` を実行するか、その Mac への SSH ラッパーを介して実行してください。

## 始める前に

1. Messages.app を実行している Mac に `imsg` をインストールします。

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg chats --limit 3
   ```

   一般的なローカル構成では、OpenClaw のセットアップ時に、サインイン済みの Messages Mac 上で `imsg` を Homebrew によりインストールまたは更新するかどうかをユーザーに確認できます。手動セットアップおよび SSH ラッパー構成は、引き続き運用者が管理します。`imsg` を実行するのと同じローカルまたはリモートのユーザーコンテキストで、Homebrew による更新を繰り返してください。`imsg chats` が `unable to open database file`、空の出力、または `authorization denied` で失敗する場合は、`imsg` を起動するターミナル、エディター、Node プロセス、Gateway サービス、または SSH 親プロセスにフルディスクアクセスを許可してから、その親プロセスを再度開いてください。

2. OpenClaw の設定を変更する前に、読み取り、監視、送信、RPC の各サーフェスを検証します。

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   `42` を `imsg chats` で取得した実際のチャット ID に置き換えてください。送信には Messages.app のオートメーション権限が必要です。OpenClaw を SSH 経由で実行する場合は、OpenClaw が使用するものと同じ SSH ラッパーまたはユーザーコンテキストを介して、これらのコマンドを実行してください。読み取りには成功するものの、送信が AppleEvents `-1743` で失敗する場合は、オートメーション権限が `/usr/libexec/sshd-keygen-wrapper` に付与されているか確認してください。[SSH ラッパー経由の送信が AppleEvents -1743 で失敗する場合](/ja-JP/channels/imessage#requirements-and-permissions-macos)を参照してください。

3. プライベート API ブリッジを有効にします。返信、Tapback、エフェクト、投票、添付ファイルへの返信、グループアクションはこれに依存するため、OpenClaw iMessage では有効化を強く推奨します。

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` には SIP の無効化が必要です（また、最新の macOS ではライブラリ検証の緩和も必要です。[imsg プライベート API の有効化](/ja-JP/channels/imessage#enabling-the-imsg-private-api)を参照してください）。基本的な送信、履歴、監視は `imsg launch` なしでも動作しますが、OpenClaw iMessage の完全なアクションサーフェスは利用できません。

4. `channels.imessage` を有効にして Gateway を起動した後、OpenClaw を介してブリッジを検証します。

   ```bash
   openclaw channels status --probe
   ```

   iMessage アカウントは `works` と報告される必要があります。`--json` を指定した場合、プローブのペイロードに `privateApi.available: true` が含まれます。`false` と報告された場合は、まずその問題を修正してください。[機能検出](/ja-JP/channels/imessage#private-api-actions)を参照してください。プローブには到達可能な Gateway が必要です（到達できない場合、CLI は設定のみの出力にフォールバックします）。また、設定済みで有効なアカウントのみがプローブされます。

5. 設定のスナップショットを作成します。

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## 設定の変換

iMessage と BlueBubbles は、チャネルレベルの動作設定キーの大部分を共有しています。変更されるのは、トランスポート（REST サーバーとローカル CLI の違い）とグループレジストリキーの形式です。

| BlueBubbles                                                | バンドル版 iMessage                       | 注記                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | 同じセマンティクスです（ブロックが存在する場合のデフォルトは `true`）。                                                                                                                                                                                                                                               |
| `channels.bluebubbles.serverUrl`                           | _（削除済み）_                            | REST サーバーはありません。Plugin が標準入出力経由で `imsg rpc` を起動します。                                                                                                                                                                                                                                        |
| `channels.bluebubbles.password`                            | _（削除済み）_                            | Webhook 認証は不要です。                                                                                                                                                                                                                                                                                              |
| _（暗黙）_                                                 | `channels.imessage.cliPath`               | `imsg` へのパス（デフォルトは `imsg`）。SSH にはラッパースクリプトを使用します。                                                                                                                                                                                                                                      |
| _（暗黙）_                                                 | `channels.imessage.dbPath`                | Messages.app の `chat.db` を任意で上書き指定します。省略時は自動検出されます。                                                                                                                                                                                                                                        |
| _（暗黙）_                                                 | `channels.imessage.remoteHost`            | `host` または `user@host`。`cliPath` が SSH ラッパーであり、SCP による添付ファイル取得を行う場合にのみ必要です。                                                                                                                                                                                                        |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | 同じ値（`pairing` / `allowlist` / `open` / `disabled`）を使用し、デフォルトは `pairing` です。                                                                                                                                                                                                                         |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | 同じハンドル形式（`+15555550123`、`user@example.com`）を使用します。ペアリングストアの承認は移行されません。以下を参照してください。                                                                                                                                                                                    |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | 同じ値（`allowlist` / `open` / `disabled`）を使用し、デフォルトは `allowlist` です。                                                                                                                                                                                                                                   |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | 同じです。未設定の場合、iMessage は `allowFrom` にフォールバックします。明示的に空の `groupAllowFrom: []` を指定すると、`groupPolicy: "allowlist"` ではすべてのグループがブロックされます。                                                                                                                              |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | `"*"` ワイルドカードのエントリはそのままコピーします。グループごとのエントリは、数値の iMessage `chat_id` をキーとして付け直してください。「グループレジストリの落とし穴」を参照してください。`requireMention`、`tools`、`toolsBySender`、`systemPrompt` はそのまま引き継げます。                                         |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | デフォルトは `true` です。バンドル版 Plugin では、プライベート API のプローブが稼働している場合にのみ実行されます。                                                                                                                                                                                                     |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | 同じ形式で、同様にデフォルトでは無効です。BlueBubbles で添付ファイルを受信していた場合は、これを明示的に設定してください。設定するまで、受信した写真やメディアは何も通知されずに破棄されます（`Inbound message` ログ行も出力されません）。                                                                                  |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | ローカルルートです。ワイルドカードの規則も同じです。                                                                                                                                                                                                                                                                  |
| _（該当なし）_                                             | `channels.imessage.remoteAttachmentRoots` | SCP で取得するために `remoteHost` が設定されている場合にのみ使用されます。                                                                                                                                                                                                                                             |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage でのデフォルトは 16 MB です（BlueBubbles のデフォルトは 8 MB でした）。上限を低いまま維持するには明示的に設定してください。                                                                                                                                                                                    |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | どちらもデフォルトは 4000 です。                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | 同じオプトイン設定です。DM のみに適用され、グループではメッセージごとのディスパッチが維持されます。`messages.inbound.byChannel.imessage` またはグローバルな `messages.inbound.debounceMs` が設定されていない限り、デフォルトの受信デバウンスが 7000 ms に延長されます。[分割送信された DM の結合](/ja-JP/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition)を参照してください。 |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _（該当なし）_                            | `imsg` はすでに `chat.db` から送信者の表示名を提供します。                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | アクションごとの同じ切り替え（`reactions`、`edit`、`unsend`、`reply`、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`、`sendAttachment`）に加えて、新しい `polls` があります。すべてデフォルトで有効です。プライベート API のアクションには引き続きブリッジが必要です。 |

複数アカウントの設定（`channels.bluebubbles.accounts.*`）は、`channels.imessage.accounts.*` に一対一で移行できます。

## グループレジストリの落とし穴

バンドル版 iMessage Plugin は、2 つのグループゲートを連続して実行します。グループメッセージがエージェントに届くには、両方を通過する必要があります。

1. **送信者／チャット対象の許可リスト**（`channels.imessage.groupAllowFrom`）— 送信者のハンドル、またはチャット対象（`chat_id:`、`chat_guid:`、`chat_identifier:` のエントリ）と照合します。`groupAllowFrom` が未設定の場合、このゲートは `allowFrom` にフォールバックします。明示的に `groupAllowFrom: []` を指定すると、そのフォールバックが無効になり、`groupPolicy: "allowlist"` ではすべてのグループメッセージが破棄されます。
2. **グループレジストリ**（`channels.imessage.groups`）— 数値の iMessage `chat_id` をキーとして使用します。
   - `groups` ブロックがない場合（または空の場合）：ゲート 1 の実効的な送信者許可リストが空でなければ、グループはこのゲートを通過します。アクセスは送信者フィルタリングによって制御され、すべてを破棄する旨の起動時警告は発生しません。
   - エントリを持つ `groups` に `"*"` がない場合：一覧に記載された `chat_id` キーだけが通過します。グループを 1 つでも記載すると、`groupPolicy: "open"` であってもレジストリは許可リストとして機能します。
   - `groups: { "*": { ... } }`：すべてのグループがこのゲートを通過します。

移行時の落とし穴は、BlueBubbles では `groups` のエントリにチャット GUID／チャット識別子をキーとして使用していたのに対し、iMessage レジストリでは数値の `chat_id` をキーとして使用する点です。グループごとのエントリをそのままコピーすると、どのキーも一致しない空ではないレジストリが作成されるため、すべてのグループメッセージがゲート 2 で破棄されます。`"*"` ワイルドカードはそのままコピーしてください。特定のグループのエントリは、`imsg chats` から取得した `chat_id` の値を使用してキーを付け直してください。

どちらの破棄経路も、デフォルトのログレベルで `warn` 行として確認できます。

- 起動時にアカウントごとに一度、`groupPolicy: "allowlist"` が設定され、実効的なグループ送信者許可リストが空の場合：`imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`。送信者を許可するには `groupAllowFrom`（または `allowFrom`）を設定してください。`groups` を追加するだけでは送信者ゲートの条件を満たしません。
- 実行時に `chat_id` ごとに一度、レジストリがグループを破棄した場合：`imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`。追加すべき正確なキーが示されます。

いずれの場合も DM は引き続き動作します。DM は別のコードパスを通るため、DM が成功してもグループルーティングが機能している証明にはなりません。

`groupPolicy: "allowlist"` を使用する、送信者スコープの最小構成は次のとおりです。

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
    },
  },
}
```

これにより、設定した送信者が任意のグループで許可されます。許可するチャットを限定したり、`requireMention` などのチャットごとのオプションを設定したりするには、`groups` エントリを追加します。BlueBubbles の `"*"` エントリはそのままコピーしますが、特定のエントリは数値の iMessage `chat_id` の値を使用してキーを付け直してください。

## 手順

1. 設定を移行します。編集中は新しいブロックを無効のままにしてください。古い `channels.bluebubbles` ブロックは現在の OpenClaw では無視されるため、参照用として併記できます。

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // 切り替える準備ができたら true に変更
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // bluebubbles.allowFrom からコピー
         groupPolicy: "allowlist",
         groupAllowFrom: [], // bluebubbles.groupAllowFrom からコピー
         groups: { "*": { requireMention: true } }, // ワイルドカードはそのままコピー。チャットごとのエントリは chat_id をキーに変更
         // アクションはデフォルトで有効。無効にするには個別のトグルを false に設定
       },
     },
   }
   ```

2. **切り替えてプローブします。** `channels.imessage.enabled: true` を設定し、Gateway を再起動して、チャンネルが正常と報告されることを確認します。

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # "works" が期待値。--json では privateApi.available: true と表示
   ```

   プローブには到達可能な Gateway が必要で、設定済みかつ有効なアカウントのみが対象です。Mac 自体を検証するには、[開始前の準備](#before-you-start)にある直接の `imsg` コマンドを使用してください。

3. **DM を検証します。** エージェントにダイレクトメッセージを送信し、返信が届くことを確認します。

4. **グループを個別に検証します。** DM とグループでは異なるコードパスが使用されるため、DM の成功だけではグループが正しくルーティングされることを証明できません。許可されたグループチャットでメッセージを送信し、返信が届くことを確認します。グループが無反応になった場合（エージェントからの返信もエラーもない場合）は、上記の「グループレジストリの落とし穴」にある2つの `warn` 行を Gateway のログで確認してください。起動時の警告は、実効的な送信者許可リストが空であることを意味します。`chat_id` ごとの警告は、値が設定された `groups` レジストリにそのチャットが含まれていないことを意味します。

5. **アクション機能を検証します。** ペアリング済みの DM から、エージェントにリアクション、編集、送信取り消し、返信、写真送信、および（グループ内での）グループ名変更や参加者の追加・削除を依頼します。各アクションは Messages.app にネイティブに反映される必要があります。いずれかのアクションで `iMessage <action> requires the imsg private API bridge` がスローされた場合は、`imsg launch` を再実行し、`openclaw channels status --probe` で状態を更新してください。

6. iMessage の DM、グループ、アクションの検証が完了したら、**BlueBubbles サーバーと `channels.bluebubbles` ブロックを削除します**。OpenClaw は `channels.bluebubbles` を読み取りません。

## アクション対応状況の概要

| アクション                                            | 従来の BlueBubbles | バンドル版 iMessage                                                            |
| --------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| テキスト送信 / SMS フォールバック                      | ✅                 | ✅                                                                            |
| メディア送信（写真、動画、ファイル、音声）               | ✅                 | ✅                                                                            |
| スレッド返信（`reply_to_guid`）                        | ✅                 | ✅（[#51892](https://github.com/openclaw/openclaw/issues/51892) を解決）       |
| Tapback（`react`）                                   | ✅                 | ✅                                                                            |
| 編集 / 送信取り消し（macOS 13 以降の受信者）            | ✅                 | ✅                                                                            |
| スクリーンエフェクト付き送信                            | ✅                 | ✅（[#9394](https://github.com/openclaw/openclaw/issues/9394) の一部を解決） |
| リッチテキストの太字 / 斜体 / 下線 / 取り消し線          | ✅                 | ✅（attributedBody による型付きラン書式設定）                                  |
| Messages ネイティブの投票（作成と投票）                 | ❌                 | ✅（`actions.polls`。ネイティブ表示には受信者側で iOS/macOS 26 以降が必要）    |
| グループ名変更 / グループアイコン設定                    | ✅                 | ✅                                                                            |
| 参加者の追加 / 削除、グループから退出                    | ✅                 | ✅                                                                            |
| 既読通知と入力中インジケーター                            | ✅                 | ✅（プライベート API プローブにより制御）                                      |
| 同一送信者からの DM の統合                              | ✅                 | ✅（DM のみ。`channels.imessage.coalesceSameSenderDms` でオプトイン）          |
| 再起動後の受信復旧                                      | ✅                 | ✅（自動：`since_rowid` の再生 + GUID 重複排除。ローカルでは復旧期間が長い）    |

iMessage は Gateway の停止中に受信できなかったメッセージを復旧します。起動時に、`imsg watch.subscribe` の `since_rowid` を使用して最後にディスパッチされた rowid 以降を再生し、GUID で重複を排除します。また、古いバックログに対する経過時間の境界により、Push フラッシュ時の「バックログ爆弾」を抑制します。これは `imsg` RPC 接続経由で実行されるため、リモート SSH の `cliPath` 構成でも動作します。ローカル構成では `chat.db` を読み取れるため、復旧期間がより長くなります。[ブリッジまたは Gateway の再起動後の受信復旧](/ja-JP/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart)を参照してください。

## ペアリング、セッション、ACP バインディング

- **許可リストはハンドル単位で引き継げます。** `channels.imessage.allowFrom` は、BlueBubbles で使用していたものと同じ `+15555550123` / `user@example.com` 形式の文字列を認識します。そのままコピーしてください。
- **ペアリングストアの承認は引き継がれません。** ペアリングストアはチャンネルごとに分かれており、古い BlueBubbles ストアを移行する処理はありません。ペアリングだけで承認されていた送信者は、iMessage でもう一度ペアリングするか、そのハンドルを `allowFrom` に追加する必要があります。
- **セッション**は引き続きエージェントとチャットの組み合わせごとにスコープされます。デフォルトの `session.dmScope=main` では、DM はエージェントのメインセッションに統合されます。グループセッションは `chat_id` ごとに分離されたままです（`agent:<agentId>:imessage:group:<chat_id>`）。BlueBubbles のセッションキーに保存された過去の会話履歴は、iMessage セッションには引き継がれません。
- `match.channel: "bluebubbles"` を参照する **ACP バインディング**は、`"imessage"` に変更する必要があります。`match.peer.id` の形式（`chat_id:`、`chat_guid:`、`chat_identifier:`、プレフィックスなしのハンドル）は同一です。

## ロールバック用チャンネルなし

切り戻し先としてサポートされている BlueBubbles ランタイムはありません。iMessage の検証に失敗した場合は、`channels.imessage.enabled: false` を設定し、Gateway を再起動して、`imsg` の阻害要因を修正したうえで、切り替えを再試行してください。

返信キャッシュは SQLite の Plugin 状態に保存されます。古い `imessage/reply-cache.jsonl` サイドカーファイルが存在する場合、`openclaw doctor --fix` はそれをインポートしてアーカイブします。

## 関連項目

- [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage) — 短い告知と運用者向けの概要。
- [iMessage](/ja-JP/channels/imessage) — `imsg launch` のセットアップや機能検出を含む、iMessage チャンネルの完全なリファレンス。
- `/channels/bluebubbles` — この移行ガイドにリダイレクトされる従来の URL。
- [ペアリング](/ja-JP/channels/pairing) — DM の認証とペアリングフロー。
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — Gateway が送信返信に使用するチャンネルを選択する仕組み。
