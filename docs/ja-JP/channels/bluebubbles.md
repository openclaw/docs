---
read_when:
    - BlueBubbles チャネルの設定
    - Webhook ペアリングのトラブルシューティング
    - macOS で iMessage を設定する
sidebarTitle: BlueBubbles
summary: BlueBubbles macOS サーバー経由の iMessage（REST 送受信、入力中表示、リアクション、ペアリング、高度なアクション）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-30T04:57:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a77b248ed86eb4114f8b7f1fc6bd4cea004d65095a0439a4a8c814bc180082c
    source_path: channels/bluebubbles.md
    workflow: 16
---

ステータス: HTTP 経由で BlueBubbles macOS サーバーと通信するバンドル済みPlugin。レガシーの imsg チャネルに比べて API が豊富でセットアップしやすいため、**iMessage 連携に推奨**されます。

<Note>
現在の OpenClaw リリースには BlueBubbles がバンドルされているため、通常のパッケージビルドでは別途 `openclaw plugins install` 手順は不要です。
</Note>

## 概要

- BlueBubbles ヘルパーアプリ ([bluebubbles.app](https://bluebubbles.app)) を通じて macOS 上で動作します。
- 推奨/テスト済み: macOS Sequoia (15)。macOS Tahoe (26) でも動作します。Tahoe では現在、編集が壊れており、グループアイコンの更新は成功と報告されても同期されない場合があります。
- OpenClaw は REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`) を通じて通信します。
- 受信メッセージは Webhook 経由で到着します。送信返信、入力中インジケーター、開封通知、Tapback は REST 呼び出しです。
- 添付ファイルとステッカーは受信メディアとして取り込まれます（可能な場合はエージェントにも提示されます）。
- MP3 または CAF 音声を合成する自動 TTS 返信は、通常のファイル添付ではなく iMessage ボイスメモの吹き出しとして配信されます。
- ペアリング/許可リストは他のチャネルと同じ方法 (`/channels/pairing` など) で機能し、`channels.bluebubbles.allowFrom` + ペアリングコードを使用します。
- リアクションは Slack/Telegram と同様にシステムイベントとして提示されるため、エージェントは返信前にそれらへ「言及」できます。
- 高度な機能: 編集、送信取り消し、返信スレッド、メッセージ効果、グループ管理。

## クイックスタート

<Steps>
  <Step title="BlueBubbles をインストールする">
    Mac に BlueBubbles サーバーをインストールします（[bluebubbles.app/install](https://bluebubbles.app/install) の手順に従ってください）。
  </Step>
  <Step title="web API を有効にする">
    BlueBubbles 設定で web API を有効にし、パスワードを設定します。
  </Step>
  <Step title="OpenClaw を設定する">
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
  <Step title="Webhook を Gateway に向ける">
    BlueBubbles Webhook を Gateway に向けます（例: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）。
  </Step>
  <Step title="Gateway を起動する">
    Gateway を起動します。Webhook ハンドラーを登録し、ペアリングを開始します。
  </Step>
</Steps>

<Warning>
**セキュリティ**

- Webhook パスワードを必ず設定してください。
- Webhook 認証は常に必須です。OpenClaw は、loopback/プロキシトポロジーに関係なく、`channels.bluebubbles.password` と一致するパスワード/guid（例: `?password=<password>` または `x-password`）を含まない BlueBubbles Webhook リクエストを拒否します。
- パスワード認証は、Webhook 本文全体を読み取り/解析する前にチェックされます。

</Warning>

## Messages.app を稼働状態に保つ（VM / ヘッドレス構成）

一部の macOS VM / 常時稼働構成では、Messages.app が「アイドル」状態になることがあります（アプリを開く/前面に出すまで受信イベントが停止します）。簡単な回避策は、AppleScript + LaunchAgent を使って **5 分ごとに Messages を刺激する**ことです。

<Steps>
  <Step title="AppleScript を保存する">
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
  <Step title="LaunchAgent をインストールする">
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

    これは **300 秒ごと**、および**ログイン時**に実行されます。初回実行時に macOS の **Automation** プロンプト（`osascript` → Messages）が表示される場合があります。LaunchAgent を実行する同じユーザーセッションで承認してください。

  </Step>
  <Step title="読み込む">
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

ウィザードは次を入力するよう促します。

<ParamField path="サーバー URL" type="string" required>
  BlueBubbles サーバーアドレス（例: `http://192.168.1.100:1234`）。
</ParamField>
<ParamField path="パスワード" type="string" required>
  BlueBubbles Server 設定の API パスワード。
</ParamField>
<ParamField path="Webhook パス" type="string" default="/bluebubbles-webhook">
  Webhook エンドポイントパス。
</ParamField>
<ParamField path="DM ポリシー" type="string">
  `pairing`、`allowlist`、`open`、または `disabled`。
</ParamField>
<ParamField path="許可リスト" type="string[]">
  電話番号、メール、またはチャットターゲット。
</ParamField>

CLI から BlueBubbles を追加することもできます。

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## アクセス制御（DM + グループ）

<Tabs>
  <Tab title="DM">
    - デフォルト: `channels.bluebubbles.dmPolicy = "pairing"`。
    - 不明な送信者はペアリングコードを受け取ります。承認されるまでメッセージは無視されます（コードは 1 時間後に期限切れになります）。
    - 承認方法:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - ペアリングはデフォルトのトークン交換です。詳細: [ペアリング](/ja-JP/channels/pairing)

  </Tab>
  <Tab title="グループ">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（デフォルト: `allowlist`）。
    - `channels.bluebubbles.groupAllowFrom` は、`allowlist` が設定されている場合にグループで誰がトリガーできるかを制御します。

  </Tab>
</Tabs>

### 連絡先名の補完（macOS、任意）

BlueBubbles のグループ Webhook には、多くの場合、生の参加者アドレスだけが含まれます。代わりに `GroupMembers` コンテキストにローカル連絡先名を表示したい場合は、macOS 上のローカル連絡先補完をオプトインできます。

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` で検索を有効にします。デフォルト: `false`。
- 検索は、グループアクセス、コマンド承認、メンションゲートによってメッセージの通過が許可された後にのみ実行されます。
- 名前のない電話番号参加者のみが補完されます。
- ローカル一致が見つからない場合、生の電話番号がフォールバックとして残ります。

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### メンションゲート（グループ）

BlueBubbles は、iMessage/WhatsApp の動作に合わせて、グループチャットのメンションゲートをサポートします。

- `agents.list[].groupChat.mentionPatterns`（または `messages.groupChat.mentionPatterns`）を使用してメンションを検出します。
- グループで `requireMention` が有効な場合、エージェントはメンションされたときにのみ応答します。
- 承認済み送信者からの制御コマンドは、メンションゲートをバイパスします。

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

### コマンドゲート

- 制御コマンド（例: `/config`, `/model`）には承認が必要です。
- コマンド承認を判定するために `allowFrom` と `groupAllowFrom` を使用します。
- 承認済み送信者は、グループ内でメンションしなくても制御コマンドを実行できます。

### グループごとのシステムプロンプト

`channels.bluebubbles.groups.*` 配下の各エントリは、任意の `systemPrompt` 文字列を受け入れます。この値は、そのグループのメッセージを処理する各ターンでエージェントのシステムプロンプトに注入されるため、エージェントプロンプトを編集せずにグループごとのペルソナや振る舞いのルールを設定できます。

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

キーは、BlueBubbles がグループの `chatGuid` / `chatIdentifier` / 数値 `chatId` として報告する値に一致します。また、`"*"` ワイルドカードエントリは、完全一致がないすべてのグループのデフォルトを提供します（`requireMention` とグループごとのツールポリシーで使われるものと同じパターンです）。完全一致は常にワイルドカードより優先されます。DM はこのフィールドを無視します。代わりにエージェントレベルまたはアカウントレベルのプロンプトカスタマイズを使用してください。

#### 実例: スレッド返信と Tapback リアクション（Private API）

BlueBubbles Private API が有効な場合、受信メッセージには短いメッセージ ID（例: `[[reply_to:5]]`）が付与され、エージェントは `action=reply` を呼び出して特定のメッセージにスレッド化したり、`action=react` で Tapback を付けたりできます。グループごとの `systemPrompt` は、エージェントに正しいツールを選ばせ続けるための信頼できる方法です。

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "When replying in this group, always call action=reply with the",
            "[[reply_to:N]] messageId from context so your response threads",
            "under the triggering message. Never send a new unlinked message.",
            "",
            "For short acknowledgements ('ok', 'got it', 'on it'), use",
            "action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓)",
            "instead of sending a text reply.",
          ].join(" "),
        },
      },
    },
  },
}
```

Tapback リアクションとスレッド返信はいずれも BlueBubbles Private API が必要です。基盤となる仕組みについては、[高度なアクション](#advanced-actions) と [メッセージ ID](#message-ids-short-vs-full) を参照してください。

## ACP 会話バインディング

BlueBubbles チャットは、トランスポート層を変更せずに永続的な ACP ワークスペースへ変換できます。

高速なオペレーターフロー:

- DM または許可済みグループチャット内で `/acp spawn codex --bind here` を実行します。
- 同じ BlueBubbles 会話内の以後のメッセージは、生成された ACP セッションにルーティングされます。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

設定済みの永続バインディングは、`type: "acp"` と `match.channel: "bluebubbles"` を持つトップレベルの `bindings[]` エントリでもサポートされます。

`match.peer.id` には、サポートされている任意の BlueBubbles ターゲット形式を使用できます。

- `+15555550123` や `user@example.com` のような正規化済み DM ハンドル
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

安定したグループバインディングでは、`chat_id:*` または `chat_identifier:*` を推奨します。

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

共有 ACP バインディング動作については、[ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

## 入力中 + 開封通知

- **入力中インジケーター**: 応答生成の前と最中に自動送信されます。
- **既読確認**: `channels.bluebubbles.sendReadReceipts` で制御されます（デフォルト: `true`）。
- **入力中インジケーター**: OpenClaw は入力開始イベントを送信します。BlueBubbles は送信時またはタイムアウト時に入力中状態を自動的にクリアします（DELETE による手動停止は信頼できません）。

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

BlueBubbles は、設定で有効化されている場合に高度なメッセージアクションをサポートします。

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
  <Accordion title="Available actions">
    - **react**: tapback リアクションを追加/削除します（`messageId`、`emoji`、`remove`）。iMessage のネイティブ tapback セットは `love`、`like`、`dislike`、`laugh`、`emphasize`、`question` です。エージェントがそのセット外の絵文字（例: `👀`）を選んだ場合、リアクションツールは `love` にフォールバックするため、リクエスト全体を失敗させずに tapback が引き続き表示されます。設定済みの ack リアクションは引き続き厳密に検証され、不明な値ではエラーになります。
    - **edit**: 送信済みメッセージを編集します（`messageId`、`text`）。
    - **unsend**: メッセージの送信を取り消します（`messageId`）。
    - **reply**: 特定のメッセージに返信します（`messageId`、`text`、`to`）。
    - **sendWithEffect**: iMessage エフェクト付きで送信します（`text`、`to`、`effectId`）。
    - **renameGroup**: グループチャット名を変更します（`chatGuid`、`displayName`）。
    - **setGroupIcon**: グループチャットのアイコン/写真を設定します（`chatGuid`、`media`）— macOS 26 Tahoe では不安定です（API は成功を返す場合がありますが、アイコンが同期されません）。
    - **addParticipant**: グループに誰かを追加します（`chatGuid`、`address`）。
    - **removeParticipant**: グループから誰かを削除します（`chatGuid`、`address`）。
    - **leaveGroup**: グループチャットから退出します（`chatGuid`）。
    - **upload-file**: メディア/ファイルを送信します（`to`、`buffer`、`filename`、`asVoice`）。
      - ボイスメモ: iMessage ボイスメッセージとして送信するには、**MP3** または **CAF** 音声で `asVoice: true` を設定します。BlueBubbles はボイスメモ送信時に MP3 → CAF に変換します。
    - レガシーエイリアス: `sendAttachment` は引き続き動作しますが、`upload-file` が正規のアクション名です。

  </Accordion>
</AccordionGroup>

### メッセージ ID（短縮版と完全版）

OpenClaw はトークン節約のために_短縮_メッセージ ID（例: `1`、`2`）を表示する場合があります。

- `MessageSid` / `ReplyToId` は短縮 ID の場合があります。
- `MessageSidFull` / `ReplyToIdFull` にはプロバイダーの完全 ID が含まれます。
- 短縮 ID はメモリ内にあります。再起動やキャッシュ削除で期限切れになる場合があります。
- アクションは短縮または完全な `messageId` を受け付けますが、短縮 ID が利用できなくなるとエラーになります。

永続的な自動化や保存には完全 ID を使用してください。

- テンプレート: `{{MessageSidFull}}`、`{{ReplyToIdFull}}`
- コンテキスト: 受信ペイロード内の `MessageSidFull` / `ReplyToIdFull`

テンプレート変数については [設定](/ja-JP/gateway/configuration) を参照してください。

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 分割送信された DM の結合（1 回の入力内のコマンド + URL）

ユーザーが iMessage でコマンドと URL を一緒に入力すると（例: `Dump https://example.com/article`）、Apple は送信を**2 つの別々の Webhook 配信**に分割します。

1. テキストメッセージ（`"Dump"`）。
2. OG プレビュー画像を添付として含む URL プレビュー吹き出し（`"https://..."`）。

ほとんどの環境では、この 2 つの Webhook は約 0.8〜2.0 秒差で OpenClaw に到着します。結合しない場合、エージェントは 1 ターン目でコマンドだけを受け取り、返信し（多くの場合「URL を送ってください」）、2 ターン目で初めて URL を見ます。その時点ではコマンドのコンテキストはすでに失われています。

`channels.bluebubbles.coalesceSameSenderDms` は、DM で同一送信者から連続して届く Webhook を 1 つのエージェントターンに結合するようにします。グループチャットは引き続きメッセージ単位でキー化されるため、複数ユーザーのターン構造は維持されます。

<Tabs>
  <Tab title="When to enable">
    次の場合に有効化します。

    - 1 つのメッセージ内で `command + payload` を想定する Skills（dump、paste、save、queue など）を提供している。
    - ユーザーがコマンドと一緒に URL、画像、長いコンテンツを貼り付ける。
    - 追加される DM ターン遅延を許容できる（下記参照）。

    次の場合は無効のままにします。

    - 単語 1 つの DM トリガーで最小のコマンド遅延が必要。
    - すべてのフローがペイロードの後続なしで完結する単発コマンドである。

  </Tab>
  <Tab title="Enabling">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    フラグがオンで、明示的な `messages.inbound.byChannel.bluebubbles` がない場合、デバウンスウィンドウは **2500 ms** に広がります（非結合時のデフォルトは 500 ms）。この広いウィンドウは必須です。Apple の 0.8〜2.0 秒という分割送信間隔は、より狭いデフォルトには収まりません。

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
  <Tab title="Trade-offs">
    - **DM 制御コマンドに遅延が追加されます。** フラグをオンにすると、DM の制御コマンドメッセージ（`Dump`、`Save` など）は、ペイロード Webhook が来る可能性に備えて、ディスパッチ前に最大でデバウンスウィンドウ分待機するようになります。グループチャットのコマンドは即時ディスパッチのままです。
    - **結合された出力には上限があります** — 結合テキストは明示的な `…[truncated]` マーカー付きで 4000 文字に制限されます。添付は 20 個まで、ソースエントリは 10 個までです（それを超える場合は先頭と最新を保持）。各ソースの `messageId` は引き続き受信重複排除に到達するため、後続の MessagePoller が個別イベントを再生しても重複として認識されます。
    - **チャンネル単位のオプトインです。** 他のチャンネル（Telegram、WhatsApp、Slack、…）には影響しません。

  </Tab>
</Tabs>

### シナリオとエージェントが見る内容

| ユーザーの入力                                                     | Apple の配信             | フラグオフ（デフォルト）                | フラグオン + 2500 ms ウィンドウ                                        |
| ------------------------------------------------------------------ | ------------------------ | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（1 回送信）                             | Webhook 2 件、約 1 秒差  | 2 つのエージェントターン: "Dump" のみ、その後 URL | 1 ターン: 結合テキスト `Dump https://example.com`                      |
| `Save this 📎image.jpg caption`（添付 + テキスト）                 | Webhook 2 件             | 2 ターン                                | 1 ターン: テキスト + 画像                                              |
| `/status`（単独コマンド）                                          | Webhook 1 件             | 即時ディスパッチ                        | **ウィンドウまで待機してからディスパッチ**                             |
| URL のみを貼り付け                                                 | Webhook 1 件             | 即時ディスパッチ                        | 即時ディスパッチ（バケット内のエントリが 1 つだけ）                    |
| テキスト + URL を意図的に別々のメッセージとして数分間隔で送信      | ウィンドウ外の Webhook 2 件 | 2 ターン                                | 2 ターン（その間にウィンドウが期限切れ）                               |
| 急速な大量送信（ウィンドウ内に 10 件超の小さな DM）                | N 件の Webhook           | N ターン                                | 1 ターン、上限付き出力（先頭 + 最新、テキスト/添付の上限を適用）       |

### 分割送信結合のトラブルシューティング

フラグがオンでも分割送信が 2 ターンとして届く場合は、各レイヤーを確認してください。

<AccordionGroup>
  <Accordion title="Config actually loaded">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    その後 `openclaw gateway restart` を実行します。このフラグはデバウンサーレジストリ作成時に読み込まれます。

  </Accordion>
  <Accordion title="Debounce window wide enough for your setup">
    `~/Library/Logs/bluebubbles-server/main.log` にある BlueBubbles サーバーログを確認します。

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    `"Dump"` 形式のテキストディスパッチと、それに続く `"https://..."; Attachments:` ディスパッチの間隔を測定します。その間隔を十分にカバーできるよう、`messages.inbound.byChannel.bluebubbles` を引き上げます。

  </Accordion>
  <Accordion title="Session JSONL timestamps ≠ webhook arrival">
    セッションイベントのタイムスタンプ（`~/.openclaw/agents/<id>/sessions/*.jsonl`）は、Gateway がメッセージをエージェントに渡した時点を反映しており、Webhook が到着した時点では**ありません**。`[Queued messages while agent was busy]` とタグ付けされたキュー内の 2 つ目のメッセージは、2 つ目の Webhook が到着した時点で最初のターンがまだ実行中だったことを意味します。結合バケットはすでにフラッシュされていました。セッションログではなく BB サーバーログを基準にウィンドウを調整してください。
  </Accordion>
  <Accordion title="Memory pressure slowing reply dispatch">
    小さめのマシン（8 GB）では、エージェントターンに時間がかかり、返信完了前に結合バケットがフラッシュされて、URL がキュー内の 2 つ目のターンとして届くことがあります。`memory_pressure` と `ps -o rss -p $(pgrep openclaw-gateway)` を確認してください。Gateway が約 500 MB RSS を超えていてコンプレッサーがアクティブな場合は、他の重いプロセスを閉じるか、より大きなホストに移行してください。
  </Accordion>
  <Accordion title="Reply-quote sends are a different path">
    ユーザーが既存の URL 吹き出しへの**返信**として `Dump` をタップした場合（iMessage では Dump 吹き出しに「1 Reply」バッジが表示されます）、URL は 2 つ目の Webhook ではなく `replyToBody` にあります。結合は適用されません。これは Skills/プロンプトの問題であり、デバウンサーの問題ではありません。
  </Accordion>
</AccordionGroup>

## ブロックストリーミング

応答を単一メッセージとして送信するか、ブロック単位でストリーミングするかを制御します。

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

- 受信添付はダウンロードされ、メディアキャッシュに保存されます。
- 受信および送信メディアのメディア上限は `channels.bluebubbles.mediaMaxMb` で指定します（デフォルト: 8 MB）。
- 送信テキストは `channels.bluebubbles.textChunkLimit` に分割されます（デフォルト: 4000 文字）。

## 設定リファレンス

完全な設定: [設定](/ja-JP/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connection and webhook">
    - `channels.bluebubbles.enabled`: チャンネルを有効化/無効化します。
    - `channels.bluebubbles.serverUrl`: BlueBubbles REST API のベース URL。
    - `channels.bluebubbles.password`: API パスワード。
    - `channels.bluebubbles.webhookPath`: Webhook エンドポイントパス（デフォルト: `/bluebubbles-webhook`）。

  </Accordion>
  <Accordion title="Access policy">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: `pairing`）。
    - `channels.bluebubbles.allowFrom`: DM 許可リスト（ハンドル、メールアドレス、E.164 番号、`chat_id:*`、`chat_guid:*`）。
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled`（デフォルト: `allowlist`）。
    - `channels.bluebubbles.groupAllowFrom`: グループ送信者許可リスト。
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOS では、ゲート判定通過後に、名前のないグループ参加者をローカルの連絡先から任意で補完します。デフォルト: `false`。
    - `channels.bluebubbles.groups`: グループごとの設定（`requireMention` など）。

  </Accordion>
  <Accordion title="配信とチャンク化">
    - `channels.bluebubbles.sendReadReceipts`: 開封通知を送信します (デフォルト: `true`)。
    - `channels.bluebubbles.blockStreaming`: ブロックストリーミングを有効にします (デフォルト: `false`; ストリーミング返信に必要)。
    - `channels.bluebubbles.textChunkLimit`: 送信チャンクサイズ (文字数、デフォルト: 4000)。
    - `channels.bluebubbles.sendTimeoutMs`: `/api/v1/message/text` 経由の送信テキスト送信に対するリクエストごとのタイムアウト (ms、デフォルト: 30000)。Private API の iMessage 送信が iMessage フレームワーク内で 60 秒以上停止することがある macOS 26 環境では、たとえば `45000` や `60000` に引き上げます。プローブ、チャット検索、リアクション、編集、ヘルスチェックは現在、短い 10 秒のデフォルトを維持します。リアクションと編集への適用範囲拡大はフォローアップとして計画されています。アカウントごとの上書き: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
    - `channels.bluebubbles.chunkMode`: `length` (デフォルト) は `textChunkLimit` を超えた場合にのみ分割します。`newline` は長さによるチャンク化の前に空行 (段落境界) で分割します。

  </Accordion>
  <Accordion title="メディアと履歴">
    - `channels.bluebubbles.mediaMaxMb`: 受信/送信メディアの上限 (MB、デフォルト: 8)。
    - `channels.bluebubbles.mediaLocalRoots`: 送信ローカルメディアパスで許可される絶対ローカルディレクトリの明示的な許可リスト。これが設定されていない限り、ローカルパス送信はデフォルトで拒否されます。アカウントごとの上書き: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
    - `channels.bluebubbles.coalesceSameSenderDms`: 連続する同一送信者の DM Webhook を 1 つのエージェントターンに統合し、Apple のテキスト+URL 分割送信が単一メッセージとして届くようにします (デフォルト: `false`)。シナリオ、ウィンドウ調整、トレードオフについては、[分割送信 DM の統合](#coalescing-split-send-dms-command--url-in-one-composition)を参照してください。明示的な `messages.inbound.byChannel.bluebubbles` なしで有効にした場合、デフォルトの受信デバウンスウィンドウを 500 ms から 2500 ms に広げます。
    - `channels.bluebubbles.historyLimit`: コンテキスト用の最大グループメッセージ数 (0 で無効化)。
    - `channels.bluebubbles.dmHistoryLimit`: DM 履歴の上限。

  </Accordion>
  <Accordion title="アクションとアカウント">
    - `channels.bluebubbles.actions`: 特定のアクションを有効/無効にします。
    - `channels.bluebubbles.accounts`: 複数アカウント設定。

  </Accordion>
</AccordionGroup>

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns` (または `messages.groupChat.mentionPatterns`)。
- `messages.responsePrefix`。

## アドレス指定 / 配信ターゲット

安定したルーティングには `chat_guid` を推奨します:

- `chat_guid:iMessage;-;+15555550123` (グループには推奨)
- `chat_id:123`
- `chat_identifier:...`
- 直接ハンドル: `+15555550123`, `user@example.com`
  - 直接ハンドルに既存の DM チャットがない場合、OpenClaw は `POST /api/v1/chat/new` で作成します。これには BlueBubbles Private API が有効である必要があります。

### iMessage と SMS ルーティング

同じハンドルに Mac 上で iMessage と SMS の両方のチャットがある場合 (たとえば、iMessage 登録済みだが緑の吹き出しのフォールバックも受信したことがある電話番号)、OpenClaw は iMessage チャットを優先し、SMS へ暗黙的にダウングレードすることはありません。SMS チャットを強制するには、明示的な `sms:` ターゲット接頭辞 (たとえば `sms:+15555550123`) を使用します。一致する iMessage チャットがないハンドルは、BlueBubbles が報告する任意のチャットを通じて送信されます。

## セキュリティ

- Webhook リクエストは、`guid`/`password` クエリパラメータまたはヘッダーを `channels.bluebubbles.password` と比較して認証されます。
- API パスワードと Webhook エンドポイントは秘密に保ってください (認証情報として扱います)。
- BlueBubbles Webhook 認証に localhost バイパスはありません。Webhook トラフィックをプロキシする場合は、リクエストのエンドツーエンドで BlueBubbles パスワードを保持してください。ここでは `gateway.trustedProxies` は `channels.bluebubbles.password` の代わりにはなりません。[Gateway セキュリティ](/ja-JP/gateway/security#reverse-proxy-configuration)を参照してください。
- LAN の外部に公開する場合は、BlueBubbles サーバーで HTTPS とファイアウォールルールを有効にします。

## トラブルシューティング

- 入力中/既読イベントが動作しなくなった場合は、BlueBubbles Webhook ログを確認し、Gateway パスが `channels.bluebubbles.webhookPath` と一致していることを検証します。
- ペアリングコードは 1 時間後に期限切れになります。`openclaw pairing list bluebubbles` と `openclaw pairing approve bluebubbles <code>` を使用してください。
- リアクションには BlueBubbles private API (`POST /api/v1/message/react`) が必要です。サーバーバージョンがそれを公開していることを確認してください。
- 編集/送信取り消しには macOS 13+ と互換性のある BlueBubbles サーバーバージョンが必要です。macOS 26 (Tahoe) では、private API の変更により編集は現在壊れています。
- グループアイコン更新は macOS 26 (Tahoe) では不安定な場合があります。API が成功を返しても、新しいアイコンが同期されないことがあります。
- OpenClaw は、BlueBubbles サーバーの macOS バージョンに基づいて、壊れていることが既知のアクションを自動的に非表示にします。macOS 26 (Tahoe) で編集がまだ表示される場合は、`channels.bluebubbles.actions.edit=false` で手動で無効にしてください。
- `coalesceSameSenderDms` が有効でも、分割送信 (例: `Dump` + URL) がまだ 2 つのターンとして届く場合は、[分割送信統合のトラブルシューティング](#split-send-coalescing-troubleshooting)チェックリストを参照してください。よくある原因は、デバウンスウィンドウが短すぎること、セッションログのタイムスタンプを Webhook 到着として読み違えること、または返信引用送信 (`replyToBody` を使用し、2 番目の Webhook ではない) です。
- ステータス/ヘルス情報: `openclaw status --all` または `openclaw status --deep`。

一般的なチャンネルワークフローのリファレンスについては、[チャンネル](/ja-JP/channels)と[Plugins](/ja-JP/tools/plugin)ガイドを参照してください。

## 関連

- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [チャンネル概要](/ja-JP/channels) — 対応しているすべてのチャンネル
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
