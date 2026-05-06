---
read_when:
    - BlueBubbles チャンネルの設定
    - Webhook ペアリングのトラブルシューティング
    - macOS で iMessage を設定する
sidebarTitle: BlueBubbles
summary: BlueBubbles macOS サーバー経由の iMessage（REST 送受信、入力中表示、リアクション、ペアリング、高度なアクション）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-06T04:57:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f2308a016826addc1098937d764b753ee08f3e86f39b0657c930a12b486793f
    source_path: channels/bluebubbles.md
    workflow: 16
---

Status: HTTP 経由で BlueBubbles macOS サーバーと通信する同梱 Plugin。従来の imsg チャンネルよりも API が豊富で設定が簡単なため、**iMessage 連携に推奨**されます。

<Note>
現在の OpenClaw リリースには BlueBubbles が同梱されているため、通常のパッケージ版ビルドでは個別に `openclaw plugins install` を実行する必要はありません。
</Note>

## 概要

- BlueBubbles ヘルパーアプリ（[bluebubbles.app](https://bluebubbles.app)）を介して macOS 上で動作します。
- 推奨/テスト済み: macOS Sequoia (15)。macOS Tahoe (26) でも動作しますが、Tahoe では現在編集が壊れており、グループアイコンの更新は成功と報告されても同期されない場合があります。
- OpenClaw は REST API（`GET /api/v1/ping`、`POST /message/text`、`POST /chat/:id/*`）を通じて通信します。
- 受信メッセージは Webhook 経由で届き、送信返信、入力インジケーター、既読通知、tapback は REST 呼び出しです。
- 添付ファイルとステッカーは受信メディアとして取り込まれます（可能な場合はエージェントにも提示されます）。
- MP3 または CAF 音声を合成する自動 TTS 返信は、通常のファイル添付ではなく iMessage のボイスメモ吹き出しとして配信されます。
- ペアリング/allowlist は他のチャンネル（`/channels/pairing` など）と同じ方法で動作し、`channels.bluebubbles.allowFrom` とペアリングコードを使用します。
- リアクションは Slack/Telegram と同じくシステムイベントとして提示されるため、エージェントは返信前にそれらに「mention」できます。
- 高度な機能: 編集、送信取り消し、返信スレッド、メッセージエフェクト、グループ管理。

## クイックスタート

<Steps>
  <Step title="Install BlueBubbles">
    Mac に BlueBubbles サーバーをインストールします（[bluebubbles.app/install](https://bluebubbles.app/install) の手順に従ってください）。
  </Step>
  <Step title="Enable the web API">
    BlueBubbles 設定で Web API を有効にし、パスワードを設定します。
  </Step>
  <Step title="Configure OpenClaw">
    `openclaw onboard` を実行して BlueBubbles を選択するか、手動で設定します。

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

  </Step>
  <Step title="Point webhooks at the gateway">
    BlueBubbles Webhook の送信先を Gateway に向けます（例: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）。
  </Step>
  <Step title="Start the gateway">
    Gateway を起動します。Webhook ハンドラーが登録され、ペアリングが開始されます。
  </Step>
</Steps>

<Warning>
**セキュリティ**

- Webhook パスワードを必ず設定してください。
- Webhook 認証は常に必須です。OpenClaw は、loopback/proxy トポロジーにかかわらず、`channels.bluebubbles.password` と一致する password/guid（例: `?password=<password>` または `x-password`）を含まない BlueBubbles Webhook リクエストを拒否します。
- パスワード認証は、Webhook 本文全体を読み取り/解析する前に確認されます。

</Warning>

## Messages.app を動かし続ける（VM / ヘッドレス設定）

一部の macOS VM / 常時稼働設定では、Messages.app が「idle」状態になり（アプリを開く/前面に出すまで受信イベントが止まる）、問題になることがあります。簡単な回避策は、AppleScript + LaunchAgent を使って**5 分ごとに Messages を刺激する**ことです。

<Steps>
  <Step title="Save the AppleScript">
    これを `~/Scripts/poke-messages.scpt` として保存します。

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

  </Step>
  <Step title="Install a LaunchAgent">
    これを `~/Library/LaunchAgents/com.user.poke-messages.plist` として保存します。

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

    これは**300 秒ごと**および**ログイン時**に実行されます。初回実行時に macOS の**オートメーション**プロンプト（`osascript` → Messages）が表示される場合があります。LaunchAgent を実行する同じユーザーセッションで承認してください。

  </Step>
  <Step title="Load it">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## オンボーディング

BlueBubbles は対話型オンボーディングで利用できます。

```
openclaw onboard
```

ウィザードでは次の項目を入力します。

<ParamField path="Server URL" type="string" required>
  BlueBubbles サーバーアドレス（例: `http://192.168.1.100:1234`）。
</ParamField>
<ParamField path="Password" type="string" required>
  BlueBubbles Server 設定の API パスワード。
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Webhook エンドポイントパス。
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`、`allowlist`、`open`、または `disabled`。
</ParamField>
<ParamField path="Allow list" type="string[]">
  電話番号、メールアドレス、またはチャットターゲット。
</ParamField>

CLI から BlueBubbles を追加することもできます。

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## アクセス制御（DM + グループ）

<Tabs>
  <Tab title="DMs">
    - デフォルト: `channels.bluebubbles.dmPolicy = "pairing"`。
    - 不明な送信者にはペアリングコードが送られます。承認されるまでメッセージは無視されます（コードは 1 時間後に期限切れになります）。
    - 承認方法:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - ペアリングはデフォルトのトークン交換です。詳細: [ペアリング](/ja-JP/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（デフォルト: `allowlist`）。
    - `channels.bluebubbles.groupAllowFrom` は、`allowlist` が設定されている場合にグループ内で誰がトリガーできるかを制御します。

  </Tab>
</Tabs>

### 連絡先名の補完（macOS、任意）

BlueBubbles のグループ Webhook には、生の参加者アドレスだけが含まれることがよくあります。代わりに `GroupMembers` コンテキストへローカル連絡先名を表示したい場合は、macOS 上のローカル連絡先補完を有効にできます。

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` で検索を有効にします。デフォルト: `false`。
- 検索は、グループアクセス、コマンド認可、mention gating によってメッセージの通過が許可された後にのみ実行されます。
- 名前のない電話番号参加者だけが補完されます。
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

### Mention gating（グループ）

BlueBubbles は iMessage/WhatsApp の動作に合わせて、グループチャットの mention gating をサポートします。

- mention の検出には `agents.list[].groupChat.mentionPatterns`（または `messages.groupChat.mentionPatterns`）を使用します。
- グループで `requireMention` が有効な場合、エージェントは mention されたときだけ応答します。
- 認可済み送信者からの制御コマンドは mention gating を迂回します。

グループごとの設定:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default for all groups
        "iMessage;-;chat123": { requireMention: false }, // override for specific group
      },
    },
  },
}
```

### コマンド gating

- 制御コマンド（例: `/config`、`/model`）には認可が必要です。
- コマンド認可の判定には `allowFrom` と `groupAllowFrom` を使用します。
- 認可済み送信者は、グループ内で mention しなくても制御コマンドを実行できます。

### グループごとのシステムプロンプト

`channels.bluebubbles.groups.*` 配下の各エントリは、任意の `systemPrompt` 文字列を受け付けます。この値は、そのグループ内のメッセージを処理する各ターンでエージェントのシステムプロンプトに注入されるため、エージェントのプロンプトを編集せずにグループごとのペルソナや動作ルールを設定できます。

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Keep responses under 3 sentences. Mirror the group's casual tone.",
        },
      },
    },
  },
}
```

キーは、BlueBubbles がグループについて報告する `chatGuid` / `chatIdentifier` / 数値の `chatId` のいずれかと一致します。また、`"*"` ワイルドカードエントリは、完全一致がないすべてのグループに対するデフォルトを提供します（`requireMention` やグループごとのツールポリシーと同じパターンです）。完全一致は常にワイルドカードより優先されます。DM はこのフィールドを無視します。代わりにエージェントレベルまたはアカウントレベルのプロンプトカスタマイズを使用してください。

#### 実例: スレッド返信と tapback リアクション（Private API）

BlueBubbles Private API を有効にすると、受信メッセージには短いメッセージ ID（例: `[[reply_to:5]]`）が付与され、エージェントは `action=reply` を呼び出して特定のメッセージにスレッド返信したり、`action=react` で tapback を付けたりできます。グループごとの `systemPrompt` は、エージェントに適切なツールを選ばせる信頼性の高い方法です。

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: "When replying in this group, always call action=reply with the [[reply_to:N]] messageId from context so your response threads under the triggering message. Never send a new unlinked message. For short acknowledgements ('ok', 'got it', 'on it'), use action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓) instead of sending a text reply.",
        },
      },
    },
  },
}
```

Tapback リアクションとスレッド返信はいずれも BlueBubbles Private API が必要です。基礎となる仕組みについては [高度なアクション](#advanced-actions) と [メッセージ ID](#message-ids-short-vs-full) を参照してください。

## ACP 会話バインディング

BlueBubbles チャットは、トランスポート層を変更せずに永続的な ACP ワークスペースに変換できます。

高速なオペレーター手順:

- DM または許可されたグループチャット内で `/acp spawn codex --bind here` を実行します。
- 以後、同じ BlueBubbles 会話内のメッセージは、生成された ACP セッションにルーティングされます。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

構成済みの永続バインディングも、`type: "acp"` と `match.channel: "bluebubbles"` を持つトップレベルの `bindings[]` エントリでサポートされています。

`match.peer.id` には、サポートされている任意の BlueBubbles ターゲット形式を使用できます。

- `+15555550123` や `user@example.com` などの正規化済み DM ハンドル
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

共有 ACP バインディング動作については [ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

## 入力中 + 既読通知

- **入力インジケーター**: 応答生成の前および生成中に自動送信されます。
- **既読通知**: `channels.bluebubbles.sendReadReceipts`（デフォルト: `true`）で制御されます。
- **入力インジケーター**: OpenClaw は入力開始イベントを送信します。BlueBubbles は送信時またはタイムアウト時に入力状態を自動的にクリアします（DELETE による手動停止は信頼できません）。

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
    },
  },
}
```

## 高度なアクション

BlueBubbles は、config で有効化されている場合に高度なメッセージアクションをサポートします。

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="利用可能なアクション">
    - **react**: tapback リアクションを追加または削除します（`messageId`, `emoji`, `remove`）。iMessage のネイティブ tapback セットは `love`、`like`、`dislike`、`laugh`、`emphasize`、`question` です。エージェントがそのセット外の絵文字（例: `👀`）を選んだ場合、リアクションツールは `love` にフォールバックするため、リクエスト全体を失敗させずに tapback が表示されます。構成済みの ack リアクションは引き続き厳密に検証され、不明な値ではエラーになります。
    - **edit**: 送信済みメッセージを編集します（`messageId`, `text`）。
    - **unsend**: メッセージの送信を取り消します（`messageId`）。
    - **reply**: 特定のメッセージに返信します（`messageId`, `text`, `to`）。
    - **sendWithEffect**: iMessage エフェクト付きで送信します（`text`, `to`, `effectId`）。
    - **renameGroup**: グループチャットの名前を変更します（`chatGuid`, `displayName`）。
    - **setGroupIcon**: グループチャットのアイコン/写真を設定します（`chatGuid`, `media`）- macOS 26 Tahoe では不安定です（API が成功を返してもアイコンが同期されない場合があります）。
    - **addParticipant**: グループに誰かを追加します（`chatGuid`, `address`）。
    - **removeParticipant**: グループから誰かを削除します（`chatGuid`, `address`）。
    - **leaveGroup**: グループチャットから退出します（`chatGuid`）。
    - **upload-file**: メディア/ファイルを送信します（`to`, `buffer`, `filename`, `asVoice`）。
      - ボイスメモ: iMessage の音声メッセージとして送信するには、**MP3** または **CAF** 音声で `asVoice: true` を設定します。BlueBubbles はボイスメモ送信時に MP3 → CAF に変換します。
    - レガシーエイリアス: `sendAttachment` は引き続き動作しますが、`upload-file` が正規のアクション名です。

  </Accordion>
</AccordionGroup>

### メッセージ ID（短縮版と完全版）

OpenClaw は、トークンを節約するために_短い_メッセージ ID（例: `1`, `2`）を表示する場合があります。

- `MessageSid` / `ReplyToId` は短い ID の場合があります。
- `MessageSidFull` / `ReplyToIdFull` にはプロバイダーの完全な ID が含まれます。
- 短い ID はメモリ内にあり、再起動やキャッシュ退避で期限切れになることがあります。
- アクションは短い `messageId` と完全な `messageId` のどちらも受け付けますが、短い ID が利用できなくなっている場合はエラーになります。

耐久性のある自動化とストレージには完全な ID を使用してください。

- テンプレート: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- コンテキスト: 受信ペイロード内の `MessageSidFull` / `ReplyToIdFull`

テンプレート変数については、[構成](/ja-JP/gateway/configuration)を参照してください。

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 分割送信された DM の結合（1 回の作成内のコマンド + URL）

ユーザーが iMessage でコマンドと URL を一緒に入力した場合（例: `Dump https://example.com/article`）、Apple は送信を**2 つの別個の Webhook 配信**に分割します。

1. テキストメッセージ（`"Dump"`）。
2. 添付ファイルとして OG プレビュー画像を含む URL プレビュー吹き出し（`"https://..."`）。

ほとんどの構成では、この 2 つの Webhook は OpenClaw に約 0.8〜2.0 秒差で到着します。結合しない場合、エージェントは 1 ターン目でコマンドだけを受け取り、返信し（多くの場合「URL を送ってください」）、2 ターン目で初めて URL を確認します。この時点ではコマンドのコンテキストはすでに失われています。

`channels.bluebubbles.coalesceSameSenderDms` は、DM で同じ送信者から連続して届く Webhook を 1 つのエージェントターンにマージするよう opt in します。グループチャットは引き続きメッセージ単位でキー化されるため、複数ユーザーのターン構造は保持されます。

<Tabs>
  <Tab title="有効化する場合">
    次の場合に有効化してください。

    - 1 つのメッセージ内の `command + payload` を想定する Skills（dump、paste、save、queue など）を提供している。
    - ユーザーがコマンドと一緒に URL、画像、長いコンテンツを貼り付ける。
    - 追加される DM ターン遅延を許容できる（下記参照）。

    次の場合は無効のままにしてください。

    - 1 語の DM トリガーで最小限のコマンド遅延が必要。
    - すべてのフローが、後続ペイロードのない単発コマンドである。

  </Tab>
  <Tab title="有効化">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    このフラグがオンで、明示的な `messages.inbound.byChannel.bluebubbles` がない場合、デバウンスウィンドウは **2500 ms** に広がります（非結合時のデフォルトは 500 ms）。Apple の分割送信の間隔である 0.8〜2.0 秒はより短いデフォルトには収まらないため、この広いウィンドウが必要です。

    ウィンドウを自分で調整するには、次のようにします。

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is slow
            // or under memory pressure (observed gap can stretch past 2 s then).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="トレードオフ">
    - **DM 制御コマンドに遅延が追加されます。** このフラグがオンの場合、DM 制御コマンドメッセージ（`Dump`、`Save` など）は、ペイロード Webhook が来る可能性に備えて、ディスパッチ前に最大でデバウンスウィンドウ分待機します。グループチャットのコマンドは即時ディスパッチのままです。
    - **マージされた出力には上限があります** - マージされたテキストは明示的な `…[truncated]` マーカー付きで 4000 文字に制限されます。添付ファイルは 20 件まで、source エントリは 10 件までです（それを超える場合は最初と最新が保持されます）。各 source の `messageId` は引き続き受信重複排除に届くため、後から MessagePoller が個別イベントを再生しても重複として認識されます。
    - **opt in で、チャンネル単位です。** 他のチャンネル（Telegram、WhatsApp、Slack、…）には影響しません。

  </Tab>
</Tabs>

### シナリオとエージェントが見る内容

| ユーザーの作成内容                                                | Apple の配信              | フラグオフ（デフォルト）                | フラグオン + 2500 ms ウィンドウ                                       |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（1 回の送信）                           | 約 1 秒差の 2 Webhook     | 2 つのエージェントターン: "Dump" のみ、その後 URL | 1 ターン: マージされたテキスト `Dump https://example.com`               |
| `Save this 📎image.jpg caption`（添付ファイル + テキスト）          | 2 Webhook                 | 2 ターン                                | 1 ターン: テキスト + 画像                                              |
| `/status`（単独コマンド）                                          | 1 Webhook                 | 即時ディスパッチ                        | **最大でウィンドウ分待機し、その後ディスパッチ**                       |
| URL のみを貼り付け                                                 | 1 Webhook                 | 即時ディスパッチ                        | 即時ディスパッチ（バケット内のエントリが 1 つだけ）                    |
| テキスト + URL を数分間隔で意図的に別々のメッセージとして送信     | ウィンドウ外の 2 Webhook  | 2 ターン                                | 2 ターン（その間にウィンドウが期限切れ）                               |
| 急速な大量送信（ウィンドウ内に 10 件超の小さな DM）               | N Webhook                 | N ターン                                | 1 ターン、上限付き出力（最初 + 最新、テキスト/添付ファイル上限を適用） |

### 分割送信結合のトラブルシューティング

フラグがオンなのに分割送信がまだ 2 ターンとして届く場合は、各レイヤーを確認してください。

<AccordionGroup>
  <Accordion title="構成が実際に読み込まれている">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    その後 `openclaw gateway restart` を実行します。このフラグは debouncer-registry 作成時に読み込まれます。

  </Accordion>
  <Accordion title="デバウンスウィンドウが構成に対して十分に広い">
    `~/Library/Logs/bluebubbles-server/main.log` にある BlueBubbles サーバーログを確認してください。

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    `"Dump"` 形式のテキストディスパッチと、それに続く `"https://..."; Attachments:` ディスパッチの間隔を測定します。その間隔を十分に覆えるように `messages.inbound.byChannel.bluebubbles` を引き上げます。

  </Accordion>
  <Accordion title="セッション JSONL タイムスタンプ ≠ Webhook 到着">
    セッションイベントのタイムスタンプ（`~/.openclaw/agents/<id>/sessions/*.jsonl`）は、Gateway がメッセージをエージェントに渡した時刻を反映しており、Webhook が到着した時刻では**ありません**。`[Queued messages while agent was busy]` とタグ付けされたキュー内の 2 件目のメッセージは、2 件目の Webhook が到着した時点で 1 ターン目がまだ実行中だったことを意味します。結合バケットはすでにフラッシュ済みでした。ウィンドウはセッションログではなく、BB サーバーログに対して調整してください。
  </Accordion>
  <Accordion title="メモリ圧迫で返信ディスパッチが遅くなる">
    小さめのマシン（8 GB）では、エージェントターンに時間がかかり、返信が完了する前に結合バケットがフラッシュされ、URL がキュー内の 2 ターン目として入ることがあります。`memory_pressure` と `ps -o rss -p $(pgrep openclaw-gateway)` を確認してください。Gateway が約 500 MB RSS を超えていて compressor がアクティブな場合は、他の重いプロセスを閉じるか、より大きなホストに増強してください。
  </Accordion>
  <Accordion title="返信引用送信は別のパス">
    ユーザーが既存の URL 吹き出しへの**返信**として `Dump` をタップした場合（iMessage では Dump の吹き出しに "1 Reply" バッジが表示されます）、URL は 2 件目の Webhook ではなく `replyToBody` に存在します。結合は適用されません。これは debouncer の問題ではなく、skill/prompt の問題です。
  </Accordion>
</AccordionGroup>

## ブロックストリーミング

レスポンスを単一メッセージとして送信するか、ブロック単位でストリーミングするかを制御します。

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## メディア + 制限

- 受信添付ファイルはダウンロードされ、メディアキャッシュに保存されます。
- 受信および送信メディアの上限は `channels.bluebubbles.mediaMaxMb` で指定します（デフォルト: 8 MB）。
- 送信テキストは `channels.bluebubbles.textChunkLimit` に分割されます（デフォルト: 4000 文字）。

## 構成リファレンス

完全な構成: [構成](/ja-JP/gateway/configuration)

<AccordionGroup>
  <Accordion title="接続と Webhook">
    - `channels.bluebubbles.enabled`: チャンネルを有効化/無効化します。
    - `channels.bluebubbles.serverUrl`: BlueBubbles REST API のベース URL。
    - `channels.bluebubbles.password`: API パスワード。
    - `channels.bluebubbles.webhookPath`: Webhook エンドポイントパス（デフォルト: `/bluebubbles-webhook`）。

  </Accordion>
  <Accordion title="アクセスポリシー">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: `pairing`）。
    - `channels.bluebubbles.allowFrom`: DM allowlist（ハンドル、メールアドレス、E.164 番号、`chat_id:*`、`chat_guid:*`）。
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled`（デフォルト: `allowlist`）。
    - `channels.bluebubbles.groupAllowFrom`: グループ送信者 allowlist。
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOS では、ゲート通過後にローカルの連絡先から名前のないグループ参加者情報を任意で補強します。デフォルト: `false`。
    - `channels.bluebubbles.groups`: グループごとの構成（`requireMention` など）。

  </Accordion>
  <Accordion title="配信とチャンク化">
    - `channels.bluebubbles.sendReadReceipts`: 既読通知を送信します（デフォルト: `true`）。
    - `channels.bluebubbles.blockStreaming`: ブロックストリーミングを有効にします（デフォルト: `false`。ストリーミング返信に必要）。
    - `channels.bluebubbles.textChunkLimit`: 送信チャンクサイズ（文字数、デフォルト: 4000）。
    - `channels.bluebubbles.sendTimeoutMs`: `/api/v1/message/text` 経由の送信テキストに対するリクエストごとのタイムアウト（ミリ秒、デフォルト: 30000）。Private API の iMessage 送信が iMessage フレームワーク内で 60 秒以上停止することがある macOS 26 環境では、たとえば `45000` や `60000` に引き上げます。プローブ、チャット検索、リアクション、編集、ヘルスチェックは現在、より短い 10 秒のデフォルトを維持します。リアクションと編集への対象拡大は後続作業として計画されています。アカウントごとの上書き: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
    - `channels.bluebubbles.chunkMode`: `length`（デフォルト）は `textChunkLimit` を超えた場合のみ分割します。`newline` は長さによるチャンク化の前に空行（段落境界）で分割します。

  </Accordion>
  <Accordion title="メディアと履歴">
    - `channels.bluebubbles.mediaMaxMb`: 受信/送信メディアの上限（MB、デフォルト: 8）。
    - `channels.bluebubbles.mediaLocalRoots`: 送信ローカルメディアパスに許可される絶対ローカルディレクトリの明示的な許可リスト。これが設定されていない限り、ローカルパス送信はデフォルトで拒否されます。アカウントごとの上書き: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
    - `channels.bluebubbles.coalesceSameSenderDms`: 連続する同一送信者の DM Webhook を 1 つのエージェントターンに統合し、Apple のテキスト+URL 分割送信が 1 件のメッセージとして届くようにします（デフォルト: `false`）。シナリオ、ウィンドウ調整、トレードオフについては、[分割送信 DM の統合](#coalescing-split-send-dms-command--url-in-one-composition)を参照してください。明示的な `messages.inbound.byChannel.bluebubbles` なしで有効にした場合、デフォルトの受信デバウンスウィンドウを 500 ms から 2500 ms に広げます。
    - `channels.bluebubbles.historyLimit`: コンテキスト用の最大グループメッセージ数（0 で無効）。
    - `channels.bluebubbles.dmHistoryLimit`: DM 履歴の上限。
    - `channels.bluebubbles.replyContextApiFallback`: 受信返信に `replyToBody`/`replyToSender` がなく、メモリ内の返信コンテキストキャッシュもミスした場合、ベストエフォートのフォールバックとして BlueBubbles HTTP API から元のメッセージを取得します（デフォルト: `false`）。1 つの BlueBubbles アカウントを共有する複数インスタンスのデプロイ、プロセス再起動後、または長寿命の TTL/LRU キャッシュ削除後に有用です。この取得は他のすべての BlueBubbles クライアントリクエストと同じポリシーで SSRF ガードされ、例外を投げず、キャッシュを埋めるため後続の返信で償却されます。アカウントごとの上書き: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`。チャネルレベルの設定は、このフラグを省略したアカウントに伝播します。

  </Accordion>
  <Accordion title="アクションとアカウント">
    - `channels.bluebubbles.actions`: 特定のアクションを有効/無効にします。
    - `channels.bluebubbles.accounts`: マルチアカウント設定。

  </Accordion>
</AccordionGroup>

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns`（または `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`。

## アドレス指定 / 配信先

安定したルーティングには `chat_guid` を推奨します:

- `chat_guid:iMessage;-;+15555550123`（グループに推奨）
- `chat_id:123`
- `chat_identifier:...`
- 直接ハンドル: `+15555550123`、`user@example.com`
  - 直接ハンドルに既存の DM チャットがない場合、OpenClaw は `POST /api/v1/chat/new` で作成します。これには BlueBubbles Private API が有効である必要があります。

### iMessage と SMS のルーティング

同じハンドルに Mac 上で iMessage チャットと SMS チャットの両方がある場合（たとえば、iMessage に登録されているがグリーンバブルのフォールバックも受信したことがある電話番号）、OpenClaw は iMessage チャットを優先し、暗黙に SMS へダウングレードすることはありません。SMS チャットを強制するには、明示的な `sms:` ターゲットプレフィックスを使用します（例: `sms:+15555550123`）。一致する iMessage チャットがないハンドルは、BlueBubbles が報告する任意のチャット経由で送信されます。

## セキュリティ

- Webhook リクエストは、`guid`/`password` クエリパラメータまたはヘッダーを `channels.bluebubbles.password` と比較して認証されます。
- API パスワードと Webhook エンドポイントは秘密にしてください（認証情報として扱います）。
- BlueBubbles Webhook 認証には localhost バイパスはありません。Webhook トラフィックをプロキシする場合、リクエストのエンドツーエンドで BlueBubbles パスワードを維持してください。ここでは `gateway.trustedProxies` は `channels.bluebubbles.password` の代わりにはなりません。[Gateway セキュリティ](/ja-JP/gateway/security#reverse-proxy-configuration)を参照してください。
- LAN 外に公開する場合は、BlueBubbles サーバーで HTTPS とファイアウォールルールを有効にしてください。

## トラブルシューティング

- 入力中/既読イベントが機能しなくなった場合は、BlueBubbles Webhook ログを確認し、Gateway パスが `channels.bluebubbles.webhookPath` と一致していることを確認してください。
- ペアリングコードは 1 時間後に期限切れになります。`openclaw pairing list bluebubbles` と `openclaw pairing approve bluebubbles <code>` を使用してください。
- リアクションには BlueBubbles Private API（`POST /api/v1/message/react`）が必要です。サーバーバージョンがそれを公開していることを確認してください。
- 編集/送信取り消しには macOS 13+ と互換性のある BlueBubbles サーバーバージョンが必要です。macOS 26（Tahoe）では、Private API の変更により編集は現在壊れています。
- グループアイコン更新は macOS 26（Tahoe）で不安定な場合があります。API が成功を返しても、新しいアイコンが同期されないことがあります。
- OpenClaw は、BlueBubbles サーバーの macOS バージョンに基づいて既知の壊れているアクションを自動的に非表示にします。macOS 26（Tahoe）で編集がまだ表示される場合は、`channels.bluebubbles.actions.edit=false` で手動で無効にしてください。
- `coalesceSameSenderDms` が有効なのに分割送信（例: `Dump` + URL）がまだ 2 ターンとして届く場合は、[分割送信統合のトラブルシューティング](#split-send-coalescing-troubleshooting)チェックリストを参照してください - 一般的な原因は、デバウンスウィンドウが短すぎる、セッションログのタイムスタンプを Webhook 到着時刻と誤読している、または返信引用送信（これは 2 つ目の Webhook ではなく `replyToBody` を使用します）です。
- ステータス/ヘルス情報: `openclaw status --all` または `openclaw status --deep`。

一般的なチャネルワークフローのリファレンスについては、[チャネル](/ja-JP/channels)と[Plugins](/ja-JP/tools/plugin)ガイドを参照してください。

## 関連

- [チャネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [チャネル概要](/ja-JP/channels) - サポートされるすべてのチャネル
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンション制御
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと堅牢化
