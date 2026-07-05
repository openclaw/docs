---
read_when:
    - BlueBubbles から同梱の iMessage Plugin への移行を計画する
    - BlueBubbles の設定キーを iMessage 相当へ変換する
    - iMessage Plugin を有効化する前に imsg を検証する
summary: '古い BlueBubbles 設定をバンドル済みの iMessage Plugin に移行する: キーマッピング、グループ許可リストのゲート、切り替え検証。'
title: BlueBubbles から移行する
x-i18n:
    generated_at: "2026-07-05T17:39:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93d4a6adb1ad0548368ce840f419339fdfe294ea19eca2e94f665c3b4613af4c
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

BlueBubbles のサポートは削除されました。OpenClaw は、同梱の `imessage` plugin を通じてのみ iMessage をサポートします。この plugin は JSON-RPC 経由で [`steipete/imsg`](https://github.com/steipete/imsg) を駆動し、BlueBubbles が持っていたものと同じ private API surface（`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、ネイティブ投票、グループ管理、添付ファイル）に到達します。1 つの CLI バイナリが BlueBubbles サーバー + クライアントアプリ + webhook 配管を置き換えます。REST エンドポイントも webhook 認証もありません。

このガイドでは、古い `channels.bluebubbles` 設定を `channels.imessage` に移行します。他にサポートされる移行パスはありません。現在の OpenClaw では、残っている `channels.bluebubbles` ブロックは不活性で、runtime は読み取りません。

<Note>
短い告知と運用者向け概要については、[BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage)を参照してください。
</Note>

## 移行チェックリスト

古い BlueBubbles 設定がすでに分かっている場合の、最短で安全な手順:

1. Messages.app を実行している Mac で `imsg` を直接確認します（`imsg chats`、`imsg history`、`imsg send`、`imsg rpc --help`）。
2. 挙動キーを `channels.bluebubbles` から `channels.imessage` にコピーします: `dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`includeAttachments`、`attachmentRoots`、`mediaMaxMb`、`textChunkLimit`、`coalesceSameSenderDms`、`actions`。
3. もう存在しない transport キーを削除します: `serverUrl`、`password`、webhook URL、BlueBubbles サーバー設定。
4. Gateway が Messages の Mac 上で実行されていない場合は、`channels.imessage.cliPath` を SSH ラッパーに設定し、リモート添付ファイル取得用に `remoteHost` を設定します。
5. `channels.imessage` を有効化し、Gateway を再起動してから、`openclaw channels status --probe --channel imessage` を実行します。
6. DM を 1 件、許可されたグループを 1 件、添付ファイルが有効なら添付ファイルを、そして agent に使わせる予定のすべての private API アクションをテストします。
7. iMessage パスが検証できたら、BlueBubbles サーバーと古い `channels.bluebubbles` 設定を削除します。

## imsg の役割

`imsg` は Messages 用のローカル macOS CLI です。OpenClaw は `imsg rpc` を子プロセスとして起動し、stdin/stdout 経由で JSON-RPC をやり取りします。HTTP サーバー、webhook URL、バックグラウンドデーモン、launch agent、公開するポートはありません。

- 読み取りは、読み取り専用 SQLite ハンドルを使用して `~/Library/Messages/chat.db` から行われます。
- ライブ受信メッセージは `imsg watch` / `watch.subscribe` から取得され、これはポーリング fallback 付きで `chat.db` のファイルシステムイベントを追跡します。
- 送信は、通常のテキスト送信とファイル送信に Messages.app automation を使用します。
- 高度なアクションは、`imsg launch` を使って `imsg` ヘルパーを Messages.app に注入します。これにより、開封確認、入力中インジケーター、リッチ送信、編集、送信取り消し、スレッド返信、tapback、投票、グループ管理が利用できるようになります。
- Linux ビルドではコピーした `chat.db` を検査できますが、送信、ライブ Mac データベースの watch、Messages.app の駆動はできません。OpenClaw iMessage では、サインイン済みの Mac 上、またはその Mac への SSH ラッパー経由で `imsg` を実行してください。

## 始める前に

1. Messages.app を実行している Mac に `imsg` をインストールします:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   `imsg chats` が `unable to open database file`、空の出力、または `authorization denied` で失敗する場合は、`imsg` を起動するターミナル、エディタ、Node プロセス、Gateway サービス、または SSH 親プロセスにフルディスクアクセスを付与し、その親プロセスを開き直してください。

2. OpenClaw 設定を変更する前に、read、watch、send、RPC の surface を確認します:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   `42` は `imsg chats` から得た実際の chat id に置き換えてください。送信には Messages.app の Automation 権限が必要です。OpenClaw を SSH 経由で実行する場合は、OpenClaw が使用するのと同じ SSH ラッパーまたはユーザーコンテキストでこれらのコマンドを実行してください。読み取りは動作するが送信が AppleEvents `-1743` で失敗する場合は、Automation が `/usr/libexec/sshd-keygen-wrapper` に付与されていないか確認してください。[SSH ラッパー送信が AppleEvents -1743 で失敗する](/ja-JP/channels/imessage#requirements-and-permissions-macos)を参照してください。

3. 高度なアクションが必要な場合は、private API ブリッジを有効化します:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` には SIP の無効化が必要です（また、現代の macOS では library validation の緩和も必要です。[imsg private API の有効化](/ja-JP/channels/imessage#enabling-the-imsg-private-api)を参照してください）。基本的な送信、履歴、watch は `imsg launch` なしで動作しますが、高度なアクションは動作しません。

4. `channels.imessage` を有効化して Gateway を起動した後、OpenClaw 経由でブリッジを確認します:

   ```bash
   openclaw channels status --probe
   ```

   iMessage アカウントは `works` を報告するはずです。`--json` では、probe payload に `privateApi.available: true` が含まれます。`false` が報告される場合は、まずそれを修正してください。[Capability detection](/ja-JP/channels/imessage#private-api-actions)を参照してください。probe には到達可能な Gateway が必要です（そうでない場合 CLI は config-only 出力に fallback します）。また、設定済みかつ有効なアカウントだけを probe します。

5. 設定のスナップショットを取ります:

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## 設定の変換

iMessage と BlueBubbles は、ほとんどの channel-level 挙動キーを共有します。変わるのは transport（REST サーバー vs ローカル CLI）と、グループレジストリのキー形式です。

| BlueBubbles                                                | 同梱 iMessage                          | 注記                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | 同じセマンティクス（ブロックが存在するとデフォルトは `true`）。                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.serverUrl`                           | _(削除済み)_                               | REST サーバーはありません。Plugin は stdio 経由で `imsg rpc` を起動します。                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.password`                            | _(削除済み)_                               | Webhook 認証は不要です。                                                                                                                                                                                                                                                                                     |
| _(暗黙)_                                               | `channels.imessage.cliPath`               | `imsg` へのパス（デフォルトは `imsg`）。SSH にはラッパースクリプトを使用します。                                                                                                                                                                                                                                                        |
| _(暗黙)_                                               | `channels.imessage.dbPath`                | 任意の Messages.app `chat.db` オーバーライド。省略時は自動検出されます。                                                                                                                                                                                                                                                 |
| _(暗黙)_                                               | `channels.imessage.remoteHost`            | `host` または `user@host`。`cliPath` が SSH ラッパーで、SCP による添付ファイル取得を使いたい場合にのみ必要です。                                                                                                                                                                                                             |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | 同じ値（`pairing` / `allowlist` / `open` / `disabled`）。デフォルトは `pairing`。                                                                                                                                                                                                                                       |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | 同じハンドル形式（`+15555550123`, `user@example.com`）。ペアリングストアの承認は移行されません。下記を参照してください。                                                                                                                                                                                                        |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | 同じ値（`allowlist` / `open` / `disabled`）。デフォルトは `allowlist`。                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | 同じです。未設定の場合、iMessage は `allowFrom` にフォールバックします。明示的に空の `groupAllowFrom: []` を設定すると、`groupPolicy: "allowlist"` ではすべてのグループがブロックされます。                                                                                                                                                                    |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | `"*"` ワイルドカードエントリはそのままコピーします。グループごとのエントリは数値の iMessage `chat_id` でキーを付け直します。「グループレジストリの落とし穴」を参照してください。`requireMention`, `tools`, `toolsBySender`, `systemPrompt` は引き継がれます。                                                                                                                 |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | デフォルトは `true`。同梱 Plugin では、これはプライベート API プローブが稼働している場合にのみ発火します。                                                                                                                                                                                                                             |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | 同じ形状で、同じくデフォルトはオフです。BlueBubbles で添付ファイルが流れていた場合は、これを明示的に設定してください。設定するまで、受信写真/メディアは黙って破棄されます（`Inbound message` ログ行は出ません）。                                                                                                                                  |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | ローカルルート。同じワイルドカードルールです。                                                                                                                                                                                                                                                                                     |
| _(N/A)_                                                    | `channels.imessage.remoteAttachmentRoots` | SCP 取得用に `remoteHost` が設定されている場合にのみ使用されます。                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage のデフォルトは 16 MB です（BlueBubbles のデフォルトは 8 MB でした）。低い上限を維持するには明示的に設定してください。                                                                                                                                                                                                                       |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | どちらもデフォルトは 4000 です。                                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | 同じオプトインです。DM のみで、グループはメッセージ単位のディスパッチを維持します。`messages.inbound.byChannel.imessage` またはグローバルの `messages.inbound.debounceMs` が設定されていない限り、デフォルトの受信デバウンスは 7000 ms に広がります。[分割送信された DM の結合](/ja-JP/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition)を参照してください。 |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N/A)_                                   | `imsg` はすでに `chat.db` から送信者の表示名を公開します。                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | アクションごとの同じトグル（`reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`）に加えて、新しい `polls` があります。すべてデフォルトで有効です。プライベート API アクションには引き続きブリッジが必要です。                                      |

マルチアカウント設定（`channels.bluebubbles.accounts.*`）は、`channels.imessage.accounts.*` に一対一で変換されます。

## グループレジストリの落とし穴

同梱 iMessage Plugin は 2 つのグループゲートを連続して実行します。グループメッセージがエージェントに届くには、両方を通過する必要があります。

1. **送信者 / チャットターゲットの許可リスト**（`channels.imessage.groupAllowFrom`）— 送信者ハンドル、またはチャットターゲット（`chat_id:`, `chat_guid:`, `chat_identifier:` エントリ）に一致します。`groupAllowFrom` が未設定の場合、このゲートは `allowFrom` にフォールバックします。明示的な `groupAllowFrom: []` はそのフォールバックを無効にし、`groupPolicy: "allowlist"` ではすべてのグループメッセージを破棄します。
2. **グループレジストリ**（`channels.imessage.groups`）— 数値の iMessage `chat_id` をキーにします。
   - `groups` ブロックがない（または空の）場合: ゲート 1 に空でない実効送信者許可リストがある限り、グループはこのゲートを通過します。送信者フィルタリングがアクセスを管理し、全破棄の起動時警告は出ません。
   - エントリを持つ `groups` だが `"*"` がない場合: 一覧にある `chat_id` キーのみが通過します。どれか 1 つのグループを列挙すると、`groupPolicy: "open"` であってもレジストリは許可リストになります。
   - `groups: { "*": { ... } }`: すべてのグループがこのゲートを通過します。

移行時の罠: BlueBubbles は `groups` エントリをチャット GUID / チャット識別子でキー付けしていましたが、iMessage レジストリは数値の `chat_id` でキー付けします。グループごとのエントリをそのままコピーすると、キーが決して一致しない空ではないレジストリが作られるため、すべてのグループメッセージがゲート 2 で破棄されます。`"*"` ワイルドカードはそのままコピーし、特定グループのエントリは `imsg chats` の `chat_id` 値でキーを付け直してください。

どちらの破棄パスも、デフォルトのログレベルでは `warn` 行として表示されます。

- 起動時にアカウントごとに 1 回、`groupPolicy: "allowlist"` が設定されていて、実効グループ送信者許可リストが空の場合: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`。送信者を許可するには `groupAllowFrom`（または `allowFrom`）を設定します。`groups` だけを追加しても送信者ゲートは満たされません。
- 実行時に `chat_id` ごとに 1 回、レジストリがグループを破棄する場合: `imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`。追加すべき正確なキーが示されます。

DM はどちらの場合でも動作し続けます。別のコードパスを通るため、DM の成功はグループルーティングの証明にはなりません。

`groupPolicy: "allowlist"` を使う最小限の送信者スコープ設定:

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

これにより、設定済みの送信者を任意のグループで許可します。許可するチャットを絞り込む場合や `requireMention` などのチャットごとのオプションを設定する場合は、`groups` エントリを追加します。BlueBubbles の `"*"` エントリはそのままコピーしますが、特定のエントリは数値の iMessage `chat_id` 値でキーを付け直してください。

## 手順

1. config を移行します。編集中は新しいブロックを無効のままにしてください。古い `channels.bluebubbles` ブロックは現在の OpenClaw では無視されるため、参照用として並べて残しておけます。

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // flip to true when ready to cut over
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // wildcard copies verbatim; re-key per-chat entries by chat_id
         // actions default to enabled; set individual toggles false to disable
       },
     },
   }
   ```

2. **切り替えてプローブします。** `channels.imessage.enabled: true` を設定し、Gateway を再起動して、チャンネルが正常と報告されることを確認します。

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # expect "works"; --json shows privateApi.available: true
   ```

   プローブには到達可能な Gateway が必要で、設定済みかつ有効なアカウントのみをプローブします。Mac 自体を検証するには、[始める前に](#before-you-start) の直接の `imsg` コマンドを使用してください。

3. **DM を検証します。** エージェントにダイレクトメッセージを送信し、返信が届くことを確認します。

4. **グループは別個に検証します。** DM とグループは異なるコードパスを通ります。DM の成功は、グループがルーティングされていることの証明にはなりません。許可済みのグループチャットでメッセージを送信し、返信が届くことを確認します。グループが沈黙する場合（エージェント返信なし、エラーなし）は、上記の「Group registry footgun」からの 2 つの `warn` 行を gateway ログで確認してください。起動時の警告は、有効な送信者許可リストが空であることを意味します。`chat_id` ごとの警告は、入力済みの `groups` レジストリにそのチャットが含まれていないことを意味します。

5. **アクション面を検証します。** ペアリング済み DM から、リアクション、編集、送信取り消し、返信、写真送信、そして（グループ内で）グループ名の変更または参加者の追加/削除をエージェントに依頼します。各アクションは Messages.app にネイティブに反映される必要があります。いずれかのアクションで `iMessage <action> requires the imsg private API bridge` が発生する場合は、`imsg launch` を再度実行し、`openclaw channels status --probe` で更新してください。

6. iMessage の DM、グループ、アクションが検証できたら、**BlueBubbles サーバーと `channels.bluebubbles` ブロックを削除します**。OpenClaw は `channels.bluebubbles` を読み取りません。

## アクションの対応状況の概要

| アクション                                          | 従来の BlueBubbles | 同梱 iMessage                                                                  |
| --------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| テキスト送信 / SMS フォールバック                   | ✅                 | ✅                                                                            |
| メディア送信（写真、動画、ファイル、音声）          | ✅                 | ✅                                                                            |
| スレッド返信（`reply_to_guid`）                     | ✅                 | ✅（[#51892](https://github.com/openclaw/openclaw/issues/51892) を解決）       |
| Tapback（`react`）                                  | ✅                 | ✅                                                                            |
| 編集 / 送信取り消し（macOS 13+ の受信者）           | ✅                 | ✅                                                                            |
| スクリーンエフェクト付き送信                        | ✅                 | ✅（[#9394](https://github.com/openclaw/openclaw/issues/9394) の一部を解決） |
| リッチテキストの太字 / 斜体 / 下線 / 取り消し線     | ✅                 | ✅（attributedBody による typed-run 書式設定）                                 |
| ネイティブ Messages 投票（作成と投票）              | ❌                 | ✅（`actions.polls`。ネイティブ描画には受信者側に iOS/macOS 26+ が必要）      |
| グループ名変更 / グループアイコン設定               | ✅                 | ✅                                                                            |
| 参加者の追加 / 削除、グループ退出                   | ✅                 | ✅                                                                            |
| 開封確認と入力中インジケーター                      | ✅                 | ✅（private API プローブにより制御）                                           |
| 同一送信者 DM の結合                                | ✅                 | ✅（DM のみ。`channels.imessage.coalesceSameSenderDms` でオプトイン）          |
| 再起動後の受信復旧                                  | ✅                 | ✅（自動: `since_rowid` リプレイ + GUID 重複排除。local ではより広いウィンドウ） |

iMessage は、gateway 停止中に取り逃したメッセージを復旧します。起動時に `imsg watch.subscribe` の `since_rowid` を介して最後に dispatch された rowid からリプレイし、GUID で重複排除し、古いバックログの年齢フェンスによって Push-flush の「backlog bomb」を抑制します。これは `imsg` RPC 接続上で実行されるため、リモート SSH `cliPath` 構成でも機能します。local 構成では `chat.db` を読み取れるため、より広い復旧ウィンドウが得られます。[ブリッジまたは gateway 再起動後の受信復旧](/ja-JP/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart) を参照してください。

## ペアリング、セッション、ACP バインディング

- **許可リストは handle で引き継がれます。** `channels.imessage.allowFrom` は、BlueBubbles が使用していたものと同じ `+15555550123` / `user@example.com` 文字列を認識します。そのままコピーしてください。
- **pairing-store の承認は移行されません。** pairing store はチャンネルごとであり、古い BlueBubbles store を移行するものはありません。ペアリングのみで承認されていた送信者は、iMessage で再度ペアリングする必要があります。または、その handle を `allowFrom` に追加します。
- **セッション** はエージェント + チャットごとのスコープのままです。DM はデフォルトの `session.dmScope=main` のもとでエージェントのメインセッションに集約されます。グループセッションは `chat_id` ごとに分離されたままです（`agent:<agentId>:imessage:group:<chat_id>`）。BlueBubbles のセッションキー配下にある古い会話履歴は、iMessage セッションには引き継がれません。
- **ACP バインディング** で `match.channel: "bluebubbles"` を参照している場合は、`"imessage"` に変更する必要があります。`match.peer.id` の形（`chat_id:`、`chat_guid:`、`chat_identifier:`、裸の handle）は同一です。

## ロールバックチャンネルなし

戻すためのサポート対象 BlueBubbles ランタイムはありません。iMessage 検証が失敗する場合は、`channels.imessage.enabled: false` を設定し、Gateway を再起動し、`imsg` のブロッカーを修正してから、切り替えを再試行してください。

返信キャッシュは SQLite Plugin state に保存されます。`openclaw doctor --fix` は、古い `imessage/reply-cache.jsonl` sidecar が存在する場合、それをインポートしてアーカイブします。

## 関連

- [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage) — 短い告知と運用者向け概要。
- [iMessage](/ja-JP/channels/imessage) — `imsg launch` セットアップと capability 検出を含む、完全な iMessage チャンネルリファレンス。
- `/channels/bluebubbles` — この移行ガイドへリダイレクトするレガシー URL。
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー。
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — gateway が送信返信用のチャンネルを選択する方法。
