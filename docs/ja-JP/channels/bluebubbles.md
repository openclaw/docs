---
read_when:
    - BlueBubblesチャンネルの設定
    - Webhookペアリングのトラブルシューティング
    - macOSでのiMessageの設定
summary: BlueBubbles macOSサーバー経由のiMessage（REST送受信、入力中表示、リアクション、ペアリング、高度なアクション）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-23T13:57:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1c1670bb453a1f78bb8e35e4b7065ceeba46ce93180e1288745621f8c4179c9
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles（macOS REST）

ステータス: HTTP経由でBlueBubbles macOSサーバーと通信するバンドル済みPlugin。従来のimsgチャンネルと比べてAPIがより高機能で設定も容易なため、**iMessage連携にはこちらを推奨**します。

## バンドル済みPlugin

現在のOpenClawリリースにはBlueBubblesが同梱されているため、通常のパッケージ版ビルドでは別途 `openclaw plugins install` を実行する必要はありません。

## 概要

- BlueBubblesヘルパーアプリ（[bluebubbles.app](https://bluebubbles.app)）を通じてmacOS上で動作します。
- 推奨/検証済み: macOS Sequoia（15）。macOS Tahoe（26）でも動作しますが、現在Tahoeでは編集が壊れており、グループアイコンの更新は成功と表示されても同期されない場合があります。
- OpenClawはREST API（`GET /api/v1/ping`、`POST /message/text`、`POST /chat/:id/*`）経由でこれと通信します。
- 受信メッセージはWebhook経由で到着し、送信返信、入力中表示、既読通知、tapbackはREST呼び出しです。
- 添付ファイルとステッカーは受信メディアとして取り込まれ、可能な場合はエージェントにも渡されます。
- ペアリング/許可リストは他のチャンネルと同じように動作します（`/channels/pairing` など）。`channels.bluebubbles.allowFrom` + ペアリングコードを使用します。
- リアクションはSlack/Telegramと同様にシステムイベントとして扱われるため、エージェントは返信前にそれらに「言及」できます。
- 高度な機能: 編集、送信取り消し、返信スレッド、メッセージ効果、グループ管理。

## クイックスタート

1. MacにBlueBubblesサーバーをインストールします（[bluebubbles.app/install](https://bluebubbles.app/install) の手順に従ってください）。
2. BlueBubblesの設定でWeb APIを有効にし、パスワードを設定します。
3. `openclaw onboard` を実行してBlueBubblesを選択するか、手動で設定します:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. BlueBubblesのWebhookをあなたのGatewayに向けます（例: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）。
5. Gatewayを起動します。Webhookハンドラーが登録され、ペアリングが開始されます。

セキュリティに関する注意:

- 必ずWebhookパスワードを設定してください。
- Webhook認証は常に必須です。OpenClawは、BlueBubblesのWebhookリクエストに `channels.bluebubbles.password` と一致するpassword/guidが含まれていない限り（たとえば `?password=<password>` または `x-password`）、loopback/proxy構成に関係なく拒否します。
- パスワード認証は、Webhook本文全体を読み取り/解析する前にチェックされます。

## Messages.appを動作状態に保つ（VM / ヘッドレス構成）

一部のmacOS VM / 常時稼働構成では、Messages.appが「アイドル」状態になり（受信イベントがアプリを開く/前面化するまで止まる）、イベント受信が止まることがあります。簡単な回避策として、AppleScript + LaunchAgentを使って**5分ごとにMessagesをつつく**方法があります。

### 1) AppleScriptを保存する

以下の場所に保存します:

- `~/Scripts/poke-messages.scpt`

スクリプト例（非対話式、フォーカスを奪いません）:

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2) LaunchAgentをインストールする

以下の場所に保存します:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

注意:

- これは**300秒ごと**と**ログイン時**に実行されます。
- 初回実行時にmacOSの**Automation**プロンプト（`osascript` → Messages）が表示される場合があります。LaunchAgentを実行する同じユーザーセッションで承認してください。

読み込み:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## オンボーディング

BlueBubblesは対話型オンボーディングで利用できます:

```
openclaw onboard
```

ウィザードで入力を求められる項目:

- **Server URL**（必須）: BlueBubblesサーバーのアドレス（例: `http://192.168.1.100:1234`）
- **Password**（必須）: BlueBubbles Server設定のAPIパスワード
- **Webhook path**（任意）: デフォルトは `/bluebubbles-webhook`
- **DM policy**: pairing、allowlist、open、またはdisabled
- **Allow list**: 電話番号、メールアドレス、またはチャットターゲット

CLIからBlueBubblesを追加することもできます:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## アクセス制御（DM + グループ）

DM:

- デフォルト: `channels.bluebubbles.dmPolicy = "pairing"`。
- 未知の送信者にはペアリングコードが返され、承認されるまでメッセージは無視されます（コードは1時間で期限切れ）。
- 承認方法:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- ペアリングがデフォルトのトークン交換方式です。詳細: [Pairing](/ja-JP/channels/pairing)

グループ:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（デフォルト: `allowlist`）。
- `channels.bluebubbles.groupAllowFrom` は、`allowlist` が設定されているときにグループ内で誰がトリガーできるかを制御します。

### 連絡先名の補完（macOS、任意）

BlueBubblesのグループWebhookには、生の参加者アドレスしか含まれないことがよくあります。`GroupMembers` コンテキストに代わりにローカル連絡先名を表示したい場合は、macOSでローカルContacts補完を有効にできます:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` で参照を有効化します。デフォルト: `false`。
- 参照は、グループアクセス、コマンド認可、mention gatingによってそのメッセージの通過が許可された後にのみ実行されます。
- 補完されるのは、名前のない電話番号参加者のみです。
- ローカル一致が見つからない場合は、生の電話番号がフォールバックとして残ります。

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### mention gating（グループ）

BlueBubblesはグループチャットでのmention gatingをサポートしており、iMessage/WhatsAppの動作と一致します:

- `agents.list[].groupChat.mentionPatterns`（または `messages.groupChat.mentionPatterns`）を使ってメンションを検出します。
- グループで `requireMention` が有効な場合、エージェントはメンションされたときだけ応答します。
- 認可済み送信者からの制御コマンドはmention gatingをバイパスします。

グループごとの設定:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // すべてのグループのデフォルト
        "iMessage;-;chat123": { requireMention: false }, // 特定グループの上書き
      },
    },
  },
}
```

### コマンド gating

- 制御コマンド（例: `/config`, `/model`）には認可が必要です。
- コマンド認可の判定には `allowFrom` と `groupAllowFrom` を使用します。
- 認可済み送信者は、グループ内でメンションなしでも制御コマンドを実行できます。

### グループごとのシステムプロンプト

`channels.bluebubbles.groups.*` の各エントリは、任意の `systemPrompt` 文字列を受け付けます。この値は、そのグループ内のメッセージを処理する各ターンでエージェントのシステムプロンプトに注入されるため、エージェントのプロンプトを編集せずにグループごとのペルソナや振る舞いルールを設定できます:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "応答は3文以内にしてください。グループのカジュアルな雰囲気に合わせてください。",
        },
      },
    },
  },
}
```

キーは、BlueBubblesがそのグループについて報告する `chatGuid` / `chatIdentifier` / 数値の `chatId` のいずれかに一致し、`"*"` ワイルドカードエントリは、完全一致のないすべてのグループに対するデフォルトを提供します（`requireMention` やグループごとのツールポリシーと同じパターンです）。完全一致は常にワイルドカードより優先されます。DMではこのフィールドは無視されます。代わりに、エージェントレベルまたはアカウントレベルのプロンプトカスタマイズを使用してください。

#### 実例: スレッド返信とtapbackリアクション（Private API）

BlueBubbles Private APIを有効にすると、受信メッセージには短いメッセージID（たとえば `[[reply_to:5]]`）が付いて到着し、エージェントは `action=reply` を呼び出して特定のメッセージへスレッド返信したり、`action=react` を呼び出してtapbackを付けたりできます。グループごとの `systemPrompt` は、エージェントに適切なツールを選ばせる確実な方法です:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "このグループで返信するときは、必ずコンテキスト内の",
            "[[reply_to:N]] messageId を使って action=reply を呼び出し、",
            "応答がトリガー元メッセージの下にスレッドされるようにしてください。",
            "リンクされていない新規メッセージは絶対に送らないでください。",
            "",
            "短い確認応答（「ok」「了解」「対応します」など）には、",
            "テキスト返信を送る代わりに、適切なtapback絵文字",
            "（❤️, 👍, 😂, ‼️, ❓）で action=react を使ってください。",
          ].join(" "),
        },
      },
    },
  },
}
```

tapbackリアクションとスレッド返信はいずれもBlueBubbles Private APIが必要です。基盤となる仕組みについては、[高度なアクション](#advanced-actions) と [メッセージID](#message-ids-short-vs-full) を参照してください。

## ACP会話バインディング

BlueBubblesチャットは、転送レイヤーを変更せずに永続的なACPワークスペースへ変換できます。

高速なオペレーターフロー:

- そのDMまたは許可されたグループチャット内で `/acp spawn codex --bind here` を実行します。
- 以後、同じBlueBubbles会話内のメッセージは、起動されたACPセッションへルーティングされます。
- `/new` と `/reset` は、同じバインド済みACPセッションをその場でリセットします。
- `/acp close` はACPセッションを閉じ、バインディングを削除します。

設定済みの永続バインディングも、トップレベルの `bindings[]` エントリで `type: "acp"` と `match.channel: "bluebubbles"` を指定することでサポートされます。

`match.peer.id` には、サポートされているBlueBubblesターゲット形式をいずれも使用できます:

- `+15555550123` や `user@example.com` のような正規化済みDMハンドル
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

安定したグループバインディングには、`chat_id:*` または `chat_identifier:*` を推奨します。

例:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

共有されるACPバインディングの動作については、[ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

## 入力中表示 + 既読通知

- **入力中表示**: 応答生成の前および生成中に自動送信されます。
- **既読通知**: `channels.bluebubbles.sendReadReceipts` で制御します（デフォルト: `true`）。
- **入力中表示**: OpenClawは入力開始イベントを送信します。BlueBubblesは送信時またはタイムアウト時に自動で入力中表示をクリアします（`DELETE` による手動停止は信頼できません）。

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // 既読通知を無効化
    },
  },
}
```

## 高度なアクション

BlueBubblesは、設定で有効にすると高度なメッセージアクションをサポートします:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback（デフォルト: true）
        edit: true, // 送信済みメッセージを編集（macOS 13+、macOS 26 Tahoeでは壊れています）
        unsend: true, // メッセージの送信取り消し（macOS 13+）
        reply: true, // メッセージGUIDによるスレッド返信
        sendWithEffect: true, // メッセージ効果（slam、loudなど）
        renameGroup: true, // グループチャット名を変更
        setGroupIcon: true, // グループチャットのアイコン/写真を設定（macOS 26 Tahoeでは不安定）
        addParticipant: true, // グループに参加者を追加
        removeParticipant: true, // グループから参加者を削除
        leaveGroup: true, // グループチャットから退出
        sendAttachment: true, // 添付ファイル/メディアを送信
      },
    },
  },
}
```

利用可能なアクション:

- **react**: tapbackリアクションを追加/削除します（`messageId`、`emoji`、`remove`）。iMessageネイティブのtapbackセットは `love`、`like`、`dislike`、`laugh`、`emphasize`、`question` です。エージェントがこのセット外の絵文字（たとえば `👀`）を選んだ場合、リアクションツールは `love` にフォールバックするため、リクエスト全体を失敗させずにtapbackは表示されます。設定済みのackリアクションは引き続き厳密に検証され、不明な値ではエラーになります。
- **edit**: 送信済みメッセージを編集します（`messageId`、`text`）
- **unsend**: メッセージを送信取り消しします（`messageId`）
- **reply**: 特定のメッセージに返信します（`messageId`、`text`、`to`）
- **sendWithEffect**: iMessage効果付きで送信します（`text`、`to`、`effectId`）
- **renameGroup**: グループチャット名を変更します（`chatGuid`、`displayName`）
- **setGroupIcon**: グループチャットのアイコン/写真を設定します（`chatGuid`、`media`）— macOS 26 Tahoeでは不安定です（APIは成功を返してもアイコンが同期されない場合があります）。
- **addParticipant**: グループに参加者を追加します（`chatGuid`、`address`）
- **removeParticipant**: グループから参加者を削除します（`chatGuid`、`address`）
- **leaveGroup**: グループチャットから退出します（`chatGuid`）
- **upload-file**: メディア/ファイルを送信します（`to`、`buffer`、`filename`、`asVoice`）
  - ボイスメモ: **MP3** または **CAF** 音声に対して `asVoice: true` を設定すると、iMessageの音声メッセージとして送信されます。BlueBubblesはボイスメモ送信時にMP3 → CAFへ変換します。
- 旧エイリアス: `sendAttachment` も引き続き動作しますが、正式なアクション名は `upload-file` です。

### メッセージID（短縮版と完全版）

OpenClawは、トークン節約のために_短縮_メッセージID（例: `1`、`2`）を表示することがあります。

- `MessageSid` / `ReplyToId` は短縮IDである場合があります。
- `MessageSidFull` / `ReplyToIdFull` にはプロバイダーの完全IDが入ります。
- 短縮IDはメモリ内のみです。再起動やキャッシュ削除で失効することがあります。
- アクションは短縮または完全な `messageId` を受け付けますが、短縮IDは利用できなくなっているとエラーになります。

永続的な自動化や保存には完全IDを使用してください:

- テンプレート: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- コンテキスト: 受信ペイロード内の `MessageSidFull` / `ReplyToIdFull`

テンプレート変数については [Configuration](/ja-JP/gateway/configuration) を参照してください。

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 分割送信されたDMの結合（1回の入力内のコマンド + URL）

ユーザーがiMessageでコマンドとURLをまとめて入力した場合 — たとえば `Dump https://example.com/article` — Appleは送信を**2つの別々のWebhook配信**に分割します:

1. テキストメッセージ（`"Dump"`）。
2. OGプレビュー画像を添付したURLプレビューバルーン（`"https://..."`）。

この2つのWebhookは、多くの環境で約0.8〜2.0秒の間隔でOpenClawに到着します。結合しない場合、エージェントは1ターン目でコマンド単体だけを受け取り、返信し（多くの場合「URLを送ってください」）、2ターン目でようやくURLを見ることになります。その時点ではコマンド文脈はすでに失われています。

`channels.bluebubbles.coalesceSameSenderDms` は、同一送信者から連続するWebhookを1つのエージェントターンにまとめるようDMをオプトインさせます。グループチャットは引き続きメッセージ単位でキー付けされるため、複数ユーザーのターン構造は保たれます。

### 有効にするべきケース

以下の場合に有効化してください:

- 1つのメッセージ内に `command + payload` を期待するSkills（dump、paste、save、queueなど）を提供している。
- ユーザーがコマンドと一緒にURL、画像、または長文コンテンツを貼り付ける。
- DMターンの遅延増加を許容できる（下記参照）。

以下の場合は無効のままにしてください:

- 単語だけのDMトリガーに対して最小のコマンド遅延が必要。
- すべてのフローが、後続ペイロードのないワンショットコマンドである。

### 有効化

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // オプトイン（デフォルト: false）
    },
  },
}
```

このフラグを有効にし、明示的な `messages.inbound.byChannel.bluebubbles` がない場合、デバウンスウィンドウは **2500 ms** に拡大されます（結合なしのデフォルトは500 ms）。この広いウィンドウが必要なのは、Appleの分割送信間隔である0.8〜2.0秒が、より短いデフォルトには収まらないためです。

ウィンドウを自分で調整するには:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 多くの環境では2500 msで十分です。Macが遅い場合
        // またはメモリ圧迫下にある場合は4000 msまで増やしてください
        // （その場合、観測される間隔が2秒を超えて伸びることがあります）。
        bluebubbles: 2500,
      },
    },
  },
}
```

### トレードオフ

- **DM制御コマンドの遅延増加。** このフラグを有効にすると、DMの制御コマンドメッセージ（`Dump`、`Save` など）は、ペイロードWebhookが来る可能性に備えて、ディスパッチ前に最大でデバウンスウィンドウ分待機するようになります。グループチャットのコマンドは即時ディスパッチのままです。
- **結合結果には上限があります** — 結合テキストは4000文字までで、明示的な `…[truncated]` マーカーが付きます。添付は20件まで、ソースエントリは10件までです（それを超える場合は最初と最新を保持）。各ソース `messageId` は引き続き受信重複排除へ渡されるため、後から個別イベントがMessagePollerで再配信されても重複として認識されます。
- **チャンネル単位のオプトインです。** 他のチャンネル（Telegram、WhatsApp、Slack、…）には影響しません。

### シナリオとエージェントが見る内容

| ユーザーの入力内容                                                 | Appleの配信内容            | フラグ無効（デフォルト）                | フラグ有効 + 2500 msウィンドウ                                         |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（1回で送信）                            | 約1秒差の2つのWebhook     | 2ターン: 「Dump」単体、その後URL        | 1ターン: 結合テキスト `Dump https://example.com`                        |
| `Save this 📎image.jpg caption`（添付 + テキスト）                 | 2つのWebhook              | 2ターン                                 | 1ターン: テキスト + 画像                                                |
| `/status`（単独コマンド）                                          | 1つのWebhook              | 即時ディスパッチ                        | **ウィンドウ時間まで待ってからディスパッチ**                            |
| URL単体の貼り付け                                                  | 1つのWebhook              | 即時ディスパッチ                        | 即時ディスパッチ（バケット内エントリは1件のみ）                         |
| テキスト + URLを意図的に数分空けて別々に送信                      | ウィンドウ外の2つのWebhook | 2ターン                                 | 2ターン（その間にウィンドウが期限切れ）                                 |
| 短時間に大量送信（ウィンドウ内で10件超の小さなDM）                | N個のWebhook              | Nターン                                 | 1ターン、上限制限付き出力（最初 + 最新、テキスト/添付上限を適用）       |

### 分割送信の結合に関するトラブルシューティング

フラグが有効なのに分割送信がまだ2ターンで届く場合は、各レイヤーを確認してください:

1. **設定が実際に読み込まれていること。**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   次に `openclaw gateway restart` を実行してください — このフラグはdebouncer-registry作成時に読み込まれます。

2. **デバウンスウィンドウが環境に対して十分広いこと。** BlueBubblesサーバーログ `~/Library/Logs/bluebubbles-server/main.log` を確認します:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   `"Dump"` のようなテキスト配信と、その後に続く `"https://..."; Attachments:` 配信の間隔を測定してください。その差を十分にカバーするように `messages.inbound.byChannel.bluebubbles` を増やします。

3. **セッションJSONLのタイムスタンプ ≠ Webhook到着時刻。** セッションイベントのタイムスタンプ（`~/.openclaw/agents/<id>/sessions/*.jsonl`）は、Webhook到着時刻ではなく、Gatewayがメッセージをエージェントへ渡した時刻を表します。`[Queued messages while agent was busy]` とタグ付けされた2件目メッセージは、2件目Webhookが到着した時点で1ターン目がまだ実行中だったことを意味します — 結合バケットはすでにフラッシュ済みです。ウィンドウ調整はセッションログではなくBBサーバーログに対して行ってください。

4. **メモリ圧迫で返信ディスパッチが遅くなっている。** 小さめのマシン（8 GB）では、エージェントターンに時間がかかりすぎて、返信完了前に結合バケットがフラッシュし、URLがキューされた2ターン目として到着することがあります。`memory_pressure` と `ps -o rss -p $(pgrep openclaw-gateway)` を確認してください。Gatewayが約500 MB RSSを超えていてコンプレッサーが動作中なら、他の重いプロセスを閉じるか、より大きいホストへ移してください。

5. **引用返信による送信は別経路です。** ユーザーが既存のURLバルーンに対して **返信** として `Dump` をタップした場合（iMessageではDumpバブルに「1 Reply」バッジが表示されます）、URLは2つ目のWebhookではなく `replyToBody` に入ります。結合は適用されません — これはdebouncerの問題ではなく、Skill/プロンプト側の考慮事項です。

## ブロックストリーミング

応答を1つのメッセージとして送信するか、ブロック単位でストリーミングするかを制御します:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // ブロックストリーミングを有効化（デフォルトでは無効）
    },
  },
}
```

## メディア + 制限

- 受信添付ファイルはダウンロードされ、メディアキャッシュに保存されます。
- 受信・送信メディアの上限は `channels.bluebubbles.mediaMaxMb` で設定します（デフォルト: 8 MB）。
- 送信テキストは `channels.bluebubbles.textChunkLimit` でチャンク化されます（デフォルト: 4000文字）。

## 設定リファレンス

完全な設定: [Configuration](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.bluebubbles.enabled`: チャンネルを有効/無効にします。
- `channels.bluebubbles.serverUrl`: BlueBubbles REST APIのベースURL。
- `channels.bluebubbles.password`: APIパスワード。
- `channels.bluebubbles.webhookPath`: Webhookエンドポイントのパス（デフォルト: `/bluebubbles-webhook`）。
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: `pairing`）。
- `channels.bluebubbles.allowFrom`: DM許可リスト（ハンドル、メール、E.164番号、`chat_id:*`、`chat_guid:*`）。
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled`（デフォルト: `allowlist`）。
- `channels.bluebubbles.groupAllowFrom`: グループ送信者の許可リスト。
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOS上で、gating通過後に名前のないグループ参加者をローカルContactsから任意で補完します。デフォルト: `false`。
- `channels.bluebubbles.groups`: グループごとの設定（`requireMention` など）。
- `channels.bluebubbles.sendReadReceipts`: 既読通知を送信します（デフォルト: `true`）。
- `channels.bluebubbles.blockStreaming`: ブロックストリーミングを有効にします（デフォルト: `false`。ストリーミング返信に必要）。
- `channels.bluebubbles.textChunkLimit`: 送信チャンクの文字数上限（デフォルト: 4000）。
- `channels.bluebubbles.sendTimeoutMs`: `/api/v1/message/text` 経由で送信テキストを送る際のリクエストごとのタイムアウト（ミリ秒）（デフォルト: 30000）。macOS 26環境でPrivate APIのiMessage送信がiMessageフレームワーク内で60秒以上停止することがあるため、その場合は `45000` または `60000` などへ引き上げてください。現在のところ、プローブ、チャット参照、リアクション、編集、ヘルスチェックは引き続き短い10秒デフォルトを使用します。リアクションと編集にもこの拡張を広げる対応は今後のフォローアップとして予定されています。アカウントごとの上書き: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
- `channels.bluebubbles.chunkMode`: `length`（デフォルト）は `textChunkLimit` を超えた場合のみ分割します。`newline` は、長さによる分割の前に空行（段落境界）で分割します。
- `channels.bluebubbles.mediaMaxMb`: 受信/送信メディアの上限サイズ（MB）（デフォルト: 8）。
- `channels.bluebubbles.mediaLocalRoots`: 送信時にローカルメディアパスとして使用を許可する絶対ローカルディレクトリの明示的な許可リスト。これを設定しない限り、ローカルパス送信はデフォルトで拒否されます。アカウントごとの上書き: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
- `channels.bluebubbles.coalesceSameSenderDms`: 同一送信者から連続するDM Webhookを1つのエージェントターンに結合し、Appleのテキスト+URL分割送信を1つのメッセージとして受け取れるようにします（デフォルト: `false`）。シナリオ、ウィンドウ調整、トレードオフについては [分割送信されたDMの結合](#coalescing-split-send-dms-command--url-in-one-composition) を参照してください。明示的な `messages.inbound.byChannel.bluebubbles` なしで有効にすると、デフォルトの受信デバウンスウィンドウは500 msから2500 msに拡大されます。
- `channels.bluebubbles.historyLimit`: コンテキスト用のグループメッセージ最大数（0で無効）。
- `channels.bluebubbles.dmHistoryLimit`: DM履歴の上限。
- `channels.bluebubbles.actions`: 個別アクションの有効/無効を切り替えます。
- `channels.bluebubbles.accounts`: マルチアカウント設定。

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns`（または `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`.

## 宛先指定 / 配信ターゲット

安定したルーティングには `chat_guid` を推奨します:

- `chat_guid:iMessage;-;+15555550123`（グループ推奨）
- `chat_id:123`
- `chat_identifier:...`
- 直接ハンドル: `+15555550123`, `user@example.com`
  - 直接ハンドルに既存のDMチャットがない場合、OpenClawは `POST /api/v1/chat/new` 経由で作成します。これにはBlueBubbles Private APIを有効にする必要があります。

### iMessageとSMSのルーティング

同じハンドルに対してMac上にiMessageチャットとSMSチャットの両方が存在する場合（たとえば、iMessage登録済みだが緑バブルへのフォールバックも受信したことがある電話番号）、OpenClawはiMessageチャットを優先し、黙ってSMSへダウングレードすることはありません。SMSチャットを強制したい場合は、明示的な `sms:` ターゲット接頭辞を使用してください（例: `sms:+15555550123`）。一致するiMessageチャットがないハンドルは、BlueBubblesが報告したチャット経由で送信されます。

## セキュリティ

- Webhookリクエストは、`guid`/`password` のクエリパラメータまたはヘッダーを `channels.bluebubbles.password` と比較して認証されます。
- APIパスワードとWebhookエンドポイントは秘密にしてください（認証情報として扱ってください）。
- BlueBubblesのWebhook認証にはlocalhostバイパスはありません。Webhookトラフィックをプロキシする場合でも、BlueBubblesパスワードをリクエストのエンドツーエンドで保持してください。ここでは `gateway.trustedProxies` は `channels.bluebubbles.password` の代わりにはなりません。[Gateway security](/ja-JP/gateway/security#reverse-proxy-configuration) を参照してください。
- LAN外へ公開する場合は、BlueBubblesサーバーでHTTPSとファイアウォールルールを有効にしてください。

## トラブルシューティング

- 入力中表示/既読イベントが動かなくなった場合は、BlueBubblesのWebhookログを確認し、Gatewayパスが `channels.bluebubbles.webhookPath` と一致していることを検証してください。
- ペアリングコードは1時間で期限切れになります。`openclaw pairing list bluebubbles` と `openclaw pairing approve bluebubbles <code>` を使用してください。
- リアクションにはBlueBubbles private API（`POST /api/v1/message/react`）が必要です。サーバーバージョンがこれを公開していることを確認してください。
- 編集/送信取り消しにはmacOS 13+と互換性のあるBlueBubblesサーバーバージョンが必要です。macOS 26（Tahoe）では、private APIの変更により現在編集は壊れています。
- グループアイコン更新はmacOS 26（Tahoe）で不安定になることがあります。APIは成功を返しても新しいアイコンが同期されない場合があります。
- OpenClawは、BlueBubblesサーバーのmacOSバージョンに基づいて既知の不具合があるアクションを自動的に非表示にします。macOS 26（Tahoe）でまだeditが表示される場合は、`channels.bluebubbles.actions.edit=false` で手動無効化してください。
- `coalesceSameSenderDms` を有効にしているのに分割送信（例: `Dump` + URL）がまだ2ターンで届く場合は、[分割送信の結合に関するトラブルシューティング](#split-send-coalescing-troubleshooting) のチェックリストを参照してください。よくある原因は、デバウンスウィンドウが短すぎること、セッションログのタイムスタンプをWebhook到着時刻と誤認していること、または引用返信送信（これは2つ目のWebhookではなく `replyToBody` を使います）です。
- ステータス/ヘルス情報については: `openclaw status --all` または `openclaw status --deep`。

一般的なチャンネルのワークフローについては、[Channels](/ja-JP/channels) と [Plugins](/ja-JP/tools/plugin) ガイドを参照してください。

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャンネル
- [Pairing](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とmention gating
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
