---
read_when:
    - BlueBubbles から同梱の iMessage Plugin への移行計画
    - BlueBubbles の設定キーを iMessage の同等項目に変換する
    - iMessage Pluginを有効にする前に imsg を検証する
summary: 古い BlueBubbles 設定をバンドル版 iMessage Plugin に移行する方法：キーのマッピング、グループ許可リストのゲート、切り替えの検証。
title: BlueBubbles からの移行
x-i18n:
    generated_at: "2026-07-12T14:18:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b9d1533c356d3901358c25f0b90e6850124f66d3c14f056d90d5723242076d22
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

BlueBubbles のサポートは削除されました。OpenClaw は、バンドルされた `imessage` Plugin を通じてのみ iMessage をサポートします。この Plugin は JSON-RPC 経由で [`steipete/imsg`](https://github.com/steipete/imsg) を操作し、BlueBubbles と同じプライベート API サーフェス（`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、ネイティブ投票、グループ管理、添付ファイル）を利用します。1 つの CLI バイナリが、BlueBubbles サーバー、クライアントアプリ、Webhook の配管処理を置き換えます。REST エンドポイントも Webhook 認証もありません。

このガイドでは、古い `channels.bluebubbles` 設定を `channels.imessage` に移行します。サポートされている移行パスはほかにありません。現在の OpenClaw では、残っている `channels.bluebubbles` ブロックは機能しません。どのランタイムもこのブロックを読み取りません。

<Note>
短い告知と運用者向け概要については、[BlueBubbles の削除と imsg による iMessage パス](/ja-JP/announcements/bluebubbles-imessage)を参照してください。
</Note>

## 移行チェックリスト

古い BlueBubbles 設定をすでに把握している場合の、最短かつ安全な手順は次のとおりです。

1. Messages.app を実行している Mac 上で `imsg` を直接検証します（`imsg chats`、`imsg history`、`imsg send`、`imsg rpc --help`）。
2. 動作設定キーを `channels.bluebubbles` から `channels.imessage` にコピーします：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`includeAttachments`、`attachmentRoots`、`mediaMaxMb`、`textChunkLimit`、`coalesceSameSenderDms`、`actions`。
3. 存在しなくなったトランスポート設定キーを削除します：`serverUrl`、`password`、Webhook URL、BlueBubbles サーバー設定。
4. Gateway が Messages の Mac 上で実行されていない場合は、`channels.imessage.cliPath` に SSH ラッパーを設定し、リモートの添付ファイル取得用に `remoteHost` を設定します。
5. `channels.imessage` を有効にして Gateway を再起動し、`openclaw channels status --probe --channel imessage` を実行します。
6. DM を 1 件、許可されたグループを 1 つ、添付ファイルが有効な場合は添付ファイル、そしてエージェントに使用させる予定のすべてのプライベート API アクションをテストします。
7. iMessage パスを検証した後、BlueBubbles サーバーと古い `channels.bluebubbles` 設定を削除します。

## imsg の役割

`imsg` は Messages 用のローカル macOS CLI です。OpenClaw は `imsg rpc` を子プロセスとして起動し、stdin/stdout 経由の JSON-RPC で通信します。HTTP サーバー、Webhook URL、バックグラウンドデーモン、起動エージェント、公開するポートはありません。

- 読み取りは、読み取り専用の SQLite ハンドルを使用して `~/Library/Messages/chat.db` から行われます。
- ライブの受信メッセージは `imsg watch` / `watch.subscribe` から取得されます。これは `chat.db` のファイルシステムイベントを追跡し、フォールバックとしてポーリングを使用します。
- 通常のテキストおよびファイル送信には、Messages.app の自動操作を使用します。
- 高度なアクションでは、`imsg launch` を使用して `imsg` ヘルパーを Messages.app に注入します。これにより、既読通知、入力中インジケーター、リッチ送信、編集、送信取り消し、スレッド返信、Tapback、投票、グループ管理が利用可能になります。
- Linux ビルドではコピーした `chat.db` を調査できますが、送信、Mac 上のライブデータベースの監視、Messages.app の操作はできません。OpenClaw iMessage では、サインイン済みの Mac 上で `imsg` を実行するか、その Mac への SSH ラッパーを通じて実行してください。

## 始める前に

1. Messages.app を実行している Mac に `imsg` をインストールします。

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg chats --limit 3
   ```

   通常のローカル設定では、OpenClaw のセットアップ時に、サインイン済みの Messages Mac 上で `imsg` を Homebrew によりインストールまたは更新する選択肢を、ユーザーの確認を伴って提示できます。手動設定と SSH ラッパー構成は、引き続き運用者が管理します。`imsg` を実行するローカルまたはリモートの同じユーザーコンテキストで、Homebrew による更新を繰り返してください。`imsg chats` が `unable to open database file`、空の出力、または `authorization denied` で失敗する場合は、`imsg` を起動するターミナル、エディター、Node プロセス、Gateway サービス、または SSH 親プロセスにフルディスクアクセスを付与し、その親プロセスを再起動してください。

2. OpenClaw の設定を変更する前に、読み取り、監視、送信、RPC の各サーフェスを検証します。

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   `42` を `imsg chats` で取得した実際のチャット ID に置き換えてください。送信には Messages.app のオートメーション権限が必要です。OpenClaw を SSH 経由で実行する場合は、OpenClaw が使用するものと同じ SSH ラッパーまたはユーザーコンテキストを通じて、これらのコマンドを実行してください。読み取りは動作するものの、送信が AppleEvents `-1743` で失敗する場合は、オートメーション権限が `/usr/libexec/sshd-keygen-wrapper` に付与されているか確認してください。[SSH ラッパーによる送信が AppleEvents -1743 で失敗する場合](/ja-JP/channels/imessage#requirements-and-permissions-macos)を参照してください。

3. プライベート API ブリッジを有効にします。返信、Tapback、エフェクト、投票、添付ファイルへの返信、グループアクションがこれに依存するため、OpenClaw iMessage では有効化を強く推奨します。

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` には SIP の無効化が必要です（また、最新の macOS ではライブラリ検証の緩和も必要です。[imsg プライベート API の有効化](/ja-JP/channels/imessage#enabling-the-imsg-private-api)を参照してください）。基本的な送信、履歴、監視は `imsg launch` なしでも動作しますが、OpenClaw iMessage のすべてのアクションサーフェスは利用できません。

4. `channels.imessage` を有効にして Gateway を起動した後、OpenClaw を通じてブリッジを検証します。

   ```bash
   openclaw channels status --probe
   ```

   iMessage アカウントは `works` と報告される必要があります。`--json` を指定すると、プローブのペイロードに `privateApi.available: true` が含まれます。`false` と報告された場合は、まずその問題を修正してください。[機能検出](/ja-JP/channels/imessage#private-api-actions)を参照してください。プローブには到達可能な Gateway が必要です（到達できない場合、CLI は設定のみの出力にフォールバックします）。また、設定済みで有効なアカウントのみがプローブされます。

5. 設定のスナップショットを作成します。

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## 設定の変換

iMessage と BlueBubbles は、チャネルレベルの動作設定キーの大部分を共有しています。変更されるのは、トランスポート（REST サーバーとローカル CLI の違い）と、グループレジストリのキー形式です。

| BlueBubbles                                                | バンドル版 iMessage                       | 注記                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | 同じセマンティクスです（ブロックが存在すると、デフォルトは `true`）。                                                                                                                                                                                                                                                |
| `channels.bluebubbles.serverUrl`                           | _(削除済み)_                              | REST サーバーはありません。Plugin が stdio 経由で `imsg rpc` を起動します。                                                                                                                                                                                                                                          |
| `channels.bluebubbles.password`                            | _(削除済み)_                              | Webhook 認証は不要です。                                                                                                                                                                                                                                                                                             |
| _(暗黙的)_                                                 | `channels.imessage.cliPath`               | `imsg` へのパス（デフォルトは `imsg`）。SSH にはラッパースクリプトを使用します。                                                                                                                                                                                                                                     |
| _(暗黙的)_                                                 | `channels.imessage.dbPath`                | Messages.app の `chat.db` を任意で上書きします。省略時は自動検出されます。                                                                                                                                                                                                                                           |
| _(暗黙的)_                                                 | `channels.imessage.remoteHost`            | `host` または `user@host`。`cliPath` が SSH ラッパーで、SCP による添付ファイル取得を行う場合にのみ必要です。                                                                                                                                                                                                          |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | 同じ値（`pairing` / `allowlist` / `open` / `disabled`）を使用し、デフォルトは `pairing` です。                                                                                                                                                                                                                        |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | 同じハンドル形式（`+15555550123`、`user@example.com`）です。ペアリングストアの承認は引き継がれません。以下を参照してください。                                                                                                                                                                                       |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | 同じ値（`allowlist` / `open` / `disabled`）を使用し、デフォルトは `allowlist` です。                                                                                                                                                                                                                                  |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | 同じです。未設定の場合、iMessage は `allowFrom` にフォールバックします。明示的に空の `groupAllowFrom: []` を設定すると、`groupPolicy: "allowlist"` ではすべてのグループがブロックされます。                                                                                                                            |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | `"*"` ワイルドカードエントリはそのままコピーします。グループごとのエントリは、数値の iMessage `chat_id` をキーとして設定し直してください。「グループレジストリの落とし穴」を参照してください。`requireMention`、`tools`、`toolsBySender`、`systemPrompt` は引き継げます。                                            |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | デフォルトは `true` です。バンドル版 Plugin では、プライベート API のプローブが稼働中の場合にのみ実行されます。                                                                                                                                                                                                       |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | 形状は同じで、同様にデフォルトでは無効です。BlueBubbles で添付ファイルを受信していた場合は、これを明示的に設定してください。設定するまで、受信した写真やメディアは（`Inbound message` ログ行もなく）黙って破棄されます。                                                                                               |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | ローカルルートです。ワイルドカードの規則も同じです。                                                                                                                                                                                                                                                               |
| _(該当なし)_                                               | `channels.imessage.remoteAttachmentRoots` | `remoteHost` が SCP 取得用に設定されている場合にのみ使用されます。                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage のデフォルトは 16 MB です（BlueBubbles のデフォルトは 8 MB でした）。低い上限を維持するには明示的に設定してください。                                                                                                                                                                                        |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | どちらもデフォルトは 4000 です。                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | 同じオプトイン設定です。DM のみに適用され、グループではメッセージごとのディスパッチが維持されます。`messages.inbound.byChannel.imessage` またはグローバルな `messages.inbound.debounceMs` が設定されていない限り、デフォルトの受信デバウンスが 7000 ms に拡大されます。[分割送信された DM の結合](/ja-JP/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition)を参照してください。 |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(該当なし)_                              | `imsg` はすでに `chat.db` から送信者の表示名を提供します。                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | アクションごとの同じトグル（`reactions`、`edit`、`unsend`、`reply`、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`、`sendAttachment`）に、新しい `polls` が加わります。すべてデフォルトで有効です。プライベート API のアクションには引き続きブリッジが必要です。 |

複数アカウントの設定（`channels.bluebubbles.accounts.*`）は、`channels.imessage.accounts.*` に一対一で変換されます。

## グループレジストリの落とし穴

バンドル版 iMessage Plugin は、2 つのグループゲートを連続して実行します。グループメッセージがエージェントに到達するには、両方を通過する必要があります。

1. **送信者 / チャットターゲットの許可リスト**（`channels.imessage.groupAllowFrom`）— 送信者のハンドルまたはチャットターゲット（`chat_id:`、`chat_guid:`、`chat_identifier:` エントリ）と照合します。`groupAllowFrom` が未設定の場合、このゲートは `allowFrom` にフォールバックします。明示的に `groupAllowFrom: []` を設定すると、そのフォールバックが無効になり、`groupPolicy: "allowlist"` ではすべてのグループメッセージが破棄されます。
2. **グループレジストリ**（`channels.imessage.groups`）— 数値の iMessage `chat_id` をキーとして使用します。
   - `groups` ブロックがない（または空である）場合: ゲート 1 の実効的な送信者許可リストが空でない限り、グループはこのゲートを通過します。送信者フィルタリングがアクセスを制御し、すべて破棄することを示す起動時警告は発生しません。
   - エントリを持つ `groups` に `"*"` がない場合: 一覧にある `chat_id` キーだけが通過します。グループを 1 つでも列挙すると、`groupPolicy: "open"` であってもレジストリは許可リストとして機能します。
   - `groups: { "*": { ... } }`: すべてのグループがこのゲートを通過します。

移行時の落とし穴: BlueBubbles は `groups` エントリのキーにチャット GUID / チャット識別子を使用していましたが、iMessage レジストリは数値の `chat_id` をキーとして使用します。グループごとのエントリをそのままコピーすると、どのキーも一致しない空ではないレジストリが作成されるため、すべてのグループメッセージがゲート 2 で破棄されます。`"*"` ワイルドカードはそのままコピーし、特定のグループエントリは `imsg chats` で取得した `chat_id` 値をキーとして設定し直してください。

どちらの破棄経路も、デフォルトのログレベルでは `warn` 行として確認できます。

- 起動時にアカウントごとに 1 回、`groupPolicy: "allowlist"` が設定されていて、実効的なグループ送信者許可リストが空の場合: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`。送信者を許可するには `groupAllowFrom`（または `allowFrom`）を設定してください。`groups` を追加するだけでは送信者ゲートの条件を満たしません。
- 実行時に `chat_id` ごとに 1 回、レジストリがグループを破棄する場合: `imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`。追加すべき正確なキーが示されます。

どちらの場合でも DM は引き続き機能します。DM は別のコードパスを通るため、DM が成功してもグループルーティングが機能している証明にはなりません。

`groupPolicy: "allowlist"` を使用する最小限の送信者スコープ設定:

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

これにより、設定した送信者はどのグループでも許可されます。許可するチャットを限定したり、`requireMention` などのチャットごとのオプションを設定したりするには、`groups` エントリを追加します。BlueBubbles の `"*"` エントリはそのままコピーしますが、特定のエントリは数値の iMessage `chat_id` 値をキーとして設定し直してください。

## 手順を追った説明

1. 設定を移行します。編集中は新しいブロックを無効のままにしてください。古い`channels.bluebubbles`ブロックは現在のOpenClawでは無視されるため、参照用として併存させることができます。

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // 切り替える準備ができたらtrueに変更
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // bluebubbles.allowFromからコピー
         groupPolicy: "allowlist",
         groupAllowFrom: [], // bluebubbles.groupAllowFromからコピー
         groups: { "*": { requireMention: true } }, // ワイルドカードはそのままコピー。チャットごとのエントリはchat_idをキーに変更
         // アクションはデフォルトで有効。無効にするには個別のトグルをfalseに設定
       },
     },
   }
   ```

2. **切り替えてプローブします。** `channels.imessage.enabled: true`を設定し、Gatewayを再起動して、チャンネルが正常と報告されることを確認します。

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # "works"になることを確認。--jsonではprivateApi.available: trueと表示
   ```

   プローブには到達可能なGatewayが必要で、設定済みかつ有効なアカウントのみをプローブします。Mac自体を検証するには、[開始前の準備](#before-you-start)に記載された直接の`imsg`コマンドを使用してください。

3. **DMを検証します。** エージェントにダイレクトメッセージを送信し、返信が届くことを確認します。

4. **グループを個別に検証します。** DMとグループは異なるコードパスを通るため、DMが成功してもグループが正しくルーティングされるとは限りません。許可されたグループチャットでメッセージを送信し、返信が届くことを確認します。グループが無反応になった場合（エージェントの返信もエラーもない場合）は、上記の「グループレジストリの落とし穴」にある2つの`warn`行をGatewayログで確認してください。起動時の警告は、有効な送信者許可リストが空であることを意味します。`chat_id`ごとの警告は、値が設定された`groups`レジストリにそのチャットが含まれていないことを意味します。

5. **アクション機能を検証します。** ペアリング済みのDMから、リアクション、編集、送信取り消し、返信、写真の送信、および（グループ内での）グループ名の変更や参加者の追加／削除をエージェントに依頼します。各アクションがMessages.appにネイティブに反映される必要があります。いずれかのアクションで`iMessage <action> requires the imsg private API bridge`が発生した場合は、`imsg launch`を再度実行し、`openclaw channels status --probe`で状態を更新してください。

6. iMessageのDM、グループ、アクションを検証したら、**BlueBubblesサーバーと`channels.bluebubbles`ブロックを削除します**。OpenClawは`channels.bluebubbles`を読み取りません。

## アクション機能の比較一覧

| アクション                                          | 旧BlueBubbles       | バンドル版iMessage                                                              |
| --------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| テキスト送信／SMSフォールバック                     | ✅                 | ✅                                                                            |
| メディア送信（写真、動画、ファイル、音声）          | ✅                 | ✅                                                                            |
| スレッド返信（`reply_to_guid`）                     | ✅                 | ✅（[#51892](https://github.com/openclaw/openclaw/issues/51892)を解決）       |
| Tapback（`react`）                                  | ✅                 | ✅                                                                            |
| 編集／送信取り消し（macOS 13+の受信者）             | ✅                 | ✅                                                                            |
| スクリーンエフェクト付き送信                        | ✅                 | ✅（[#9394](https://github.com/openclaw/openclaw/issues/9394)の一部を解決） |
| リッチテキストの太字／斜体／下線／取り消し線        | ✅                 | ✅（attributedBodyによる型付きrun書式設定）                                  |
| Messagesネイティブ投票（作成と投票）                | ❌                 | ✅（`actions.polls`。ネイティブ表示には受信者側でiOS/macOS 26+が必要）      |
| グループ名変更／グループアイコン設定                | ✅                 | ✅                                                                            |
| 参加者の追加／削除、グループから退出                | ✅                 | ✅                                                                            |
| 開封確認と入力中インジケーター                       | ✅                 | ✅（private APIプローブの結果により制御）                                    |
| 同一送信者のDM統合                                  | ✅                 | ✅（DMのみ。`channels.imessage.coalesceSameSenderDms`でオプトイン）          |
| 再起動後の受信リカバリー                            | ✅                 | ✅（自動：`since_rowid`再生＋GUID重複排除。ローカルでは対象期間が長い）     |

iMessageは、Gatewayの停止中に受信できなかったメッセージを復旧します。起動時に、`imsg watch.subscribe`の`since_rowid`を使用して最後に配信したrowidから再生し、GUIDで重複を排除します。また、古いバックログに対する経過時間の制限により、Pushフラッシュ時の「バックログ爆弾」を抑制します。これは`imsg` RPC接続上で動作するため、リモートSSHの`cliPath`構成でも機能します。ローカル構成では`chat.db`を読み取れるため、より長い復旧期間が適用されます。[ブリッジまたはGatewayの再起動後の受信リカバリー](/ja-JP/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart)を参照してください。

## ペアリング、セッション、ACPバインディング

- **許可リストはハンドル単位で引き継げます。** `channels.imessage.allowFrom`は、BlueBubblesで使用していたものと同じ`+15555550123`／`user@example.com`文字列を認識します。そのままコピーしてください。
- **ペアリングストアの承認は移行されません。** ペアリングストアはチャンネルごとに分かれており、古いBlueBubblesストアを移行する仕組みはありません。ペアリングのみで承認されていた送信者は、iMessageで再度ペアリングする必要があります。または、その送信者のハンドルを`allowFrom`に追加してください。
- **セッション**はエージェント＋チャットごとのスコープを維持します。デフォルトの`session.dmScope=main`では、DMはエージェントのメインセッションに統合されます。グループセッションは`chat_id`ごとに分離されたままです（`agent:<agentId>:imessage:group:<chat_id>`）。BlueBubblesのセッションキーに保存された古い会話履歴は、iMessageセッションには引き継がれません。
- **ACPバインディング**で`match.channel: "bluebubbles"`を参照している場合は、`"imessage"`に変更する必要があります。`match.peer.id`の形式（`chat_id:`、`chat_guid:`、`chat_identifier:`、修飾なしのハンドル）は同一です。

## ロールバック用チャンネルなし

切り戻し先としてサポートされているBlueBubblesランタイムはありません。iMessageの検証に失敗した場合は、`channels.imessage.enabled: false`を設定してGatewayを再起動し、`imsg`の阻害要因を修正してから、切り替えを再試行してください。

返信キャッシュはSQLiteのPlugin状態に保存されます。古い`imessage/reply-cache.jsonl`サイドカーが存在する場合、`openclaw doctor --fix`がそれをインポートしてアーカイブします。

## 関連項目

- [BlueBubblesの削除とimsg iMessageパス](/ja-JP/announcements/bluebubbles-imessage) — 短い告知と運用者向け概要。
- [iMessage](/ja-JP/channels/imessage) — `imsg launch`のセットアップと機能検出を含む、iMessageチャンネルの完全なリファレンス。
- `/channels/bluebubbles` — この移行ガイドへリダイレクトされる旧URL。
- [ペアリング](/ja-JP/channels/pairing) — DMの認証とペアリングフロー。
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — Gatewayが送信返信に使用するチャンネルを選択する仕組み。
