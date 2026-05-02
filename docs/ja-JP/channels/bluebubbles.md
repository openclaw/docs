---
read_when:
    - BlueBubbles チャンネルの設定
    - Webhook ペアリングのトラブルシューティング
    - macOSでiMessageを設定する
sidebarTitle: BlueBubbles
summary: BlueBubbles macOSサーバー経由のiMessage（RESTでの送受信、入力中表示、リアクション、ペアリング、高度なアクション）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-02T04:48:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 499cc2a46db6e0eddfb897e96ec4b3e4a39ba9f2f6da8e7485c1c46562de4145
    source_path: channels/bluebubbles.md
    workflow: 16
---

ステータス: HTTP 経由で BlueBubbles macOS サーバーと通信するバンドル済み Plugin。レガシーの imsg チャネルと比べて API が豊富でセットアップが簡単なため、**iMessage 連携に推奨**されます。

<Note>
現在の OpenClaw リリースには BlueBubbles がバンドルされているため、通常のパッケージ版ビルドでは別途 `openclaw plugins install` 手順は不要です。
</Note>

## 概要

- BlueBubbles ヘルパーアプリ ([bluebubbles.app](https://bluebubbles.app)) を介して macOS 上で動作します。
- 推奨/テスト済み: macOS Sequoia (15)。macOS Tahoe (26) でも動作します。ただし Tahoe では現在、編集が壊れており、グループアイコンの更新は成功と報告されても同期されないことがあります。
- OpenClaw は REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`) を通じて通信します。
- 受信メッセージは Webhook 経由で届きます。返信の送信、入力中インジケーター、開封確認、タップバックは REST 呼び出しです。
- 添付ファイルとステッカーは受信メディアとして取り込まれます (可能な場合はエージェントに公開されます)。
- MP3 または CAF 音声を合成する Auto-TTS 返信は、通常のファイル添付ではなく iMessage のボイスメモ吹き出しとして配信されます。
- ペアリング/許可リストは他のチャネルと同じように機能します (`/channels/pairing` など)。`channels.bluebubbles.allowFrom` + ペアリングコードを使います。
- リアクションは Slack/Telegram と同様にシステムイベントとして公開されるため、エージェントは返信前にそれらを「メンション」できます。
- 高度な機能: 編集、送信取り消し、返信スレッド化、メッセージエフェクト、グループ管理。

## クイックスタート

<Steps>
  <Step title="BlueBubbles をインストールする">
    Mac に BlueBubbles サーバーをインストールします ([bluebubbles.app/install](https://bluebubbles.app/install) の手順に従ってください)。
  </Step>
  <Step title="Web API を有効にする">
    BlueBubbles 設定で Web API を有効にし、パスワードを設定します。
  </Step>
  <Step title="OpenClaw を設定する">
    `openclaw onboard` を実行して BlueBubbles を選択するか、手動で設定します:

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
    BlueBubbles Webhook を自分の Gateway に向けます (例: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)。
  </Step>
  <Step title="Gateway を起動する">
    Gateway を起動します。Gateway は Webhook ハンドラーを登録し、ペアリングを開始します。
  </Step>
</Steps>

<Warning>
**セキュリティ**

- Webhook パスワードを常に設定してください。
- Webhook 認証は常に必須です。OpenClaw は、`channels.bluebubbles.password` に一致する password/guid (たとえば `?password=<password>` または `x-password`) を含まない BlueBubbles Webhook リクエストを、loopback/プロキシ構成に関係なく拒否します。
- パスワード認証は、Webhook 本文全体を読み取り/解析する前にチェックされます。

</Warning>

## Messages.app を稼働状態に保つ (VM / ヘッドレス構成)

一部の macOS VM / 常時稼働構成では、Messages.app が「アイドル」状態になり、アプリを開くかフォアグラウンドにするまで受信イベントが停止することがあります。簡単な回避策は、AppleScript + LaunchAgent を使って **5 分ごとに Messages を起こす**ことです。

<Steps>
  <Step title="AppleScript を保存する">
    これを `~/Scripts/poke-messages.scpt` として保存します:

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
    これを `~/Library/LaunchAgents/com.user.poke-messages.plist` として保存します:

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

    これは **300 秒ごと**および**ログイン時**に実行されます。初回実行時に macOS の **Automation** プロンプト (`osascript` → Messages) が表示されることがあります。LaunchAgent を実行している同じユーザーセッションで許可します。

  </Step>
  <Step title="読み込む">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## オンボーディング

BlueBubbles は対話型オンボーディングで利用できます:

```
openclaw onboard
```

ウィザードは次の項目を尋ねます:

<ParamField path="サーバー URL" type="string" required>
  BlueBubbles サーバーのアドレス (例: `http://192.168.1.100:1234`)。
</ParamField>
<ParamField path="パスワード" type="string" required>
  BlueBubbles Server 設定の API パスワード。
</ParamField>
<ParamField path="Webhook パス" type="string" default="/bluebubbles-webhook">
  Webhook エンドポイントのパス。
</ParamField>
<ParamField path="DM ポリシー" type="string">
  `pairing`, `allowlist`, `open`, または `disabled`。
</ParamField>
<ParamField path="許可リスト" type="string[]">
  電話番号、メールアドレス、またはチャットターゲット。
</ParamField>

CLI から BlueBubbles を追加することもできます:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## アクセス制御 (DM + グループ)

<Tabs>
  <Tab title="DM">
    - デフォルト: `channels.bluebubbles.dmPolicy = "pairing"`。
    - 不明な送信者にはペアリングコードが送られます。承認されるまでメッセージは無視されます (コードは 1 時間後に期限切れになります)。
    - 次で承認します:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - ペアリングはデフォルトのトークン交換方式です。詳細: [ペアリング](/ja-JP/channels/pairing)

  </Tab>
  <Tab title="グループ">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (デフォルト: `allowlist`)。
    - `channels.bluebubbles.groupAllowFrom` は、`allowlist` が設定されている場合にグループで誰がトリガーできるかを制御します。

  </Tab>
</Tabs>

### 連絡先名の補完 (macOS、任意)

BlueBubbles のグループ Webhook には、多くの場合、生の参加者アドレスだけが含まれます。`GroupMembers` コンテキストにローカルの連絡先名を表示したい場合は、macOS でローカルの連絡先による補完を有効にできます:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` で検索を有効にします。デフォルト: `false`。
- 検索は、グループアクセス、コマンド認可、メンションゲーティングがメッセージの通過を許可した後にのみ実行されます。
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

### メンションゲーティング (グループ)

BlueBubbles はグループチャット向けに、iMessage/WhatsApp の動作に合わせたメンションゲーティングをサポートします:

- メンションの検出には `agents.list[].groupChat.mentionPatterns` (または `messages.groupChat.mentionPatterns`) を使います。
- グループで `requireMention` が有効な場合、エージェントはメンションされたときだけ応答します。
- 許可された送信者からの制御コマンドは、メンションゲーティングをバイパスします。

グループ単位の設定:

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

### コマンドゲーティング

- 制御コマンド (例: `/config`, `/model`) には認可が必要です。
- コマンド認可の判定には `allowFrom` と `groupAllowFrom` を使います。
- 許可された送信者は、グループでメンションしなくても制御コマンドを実行できます。

### グループ単位のシステムプロンプト

`channels.bluebubbles.groups.*` 配下の各エントリは、任意の `systemPrompt` 文字列を受け入れます。この値は、そのグループ内のメッセージを処理するすべてのターンでエージェントのシステムプロンプトに注入されるため、エージェントのプロンプトを編集せずにグループ単位のペルソナや振る舞いのルールを設定できます:

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

キーは、BlueBubbles がグループに対して報告する `chatGuid` / `chatIdentifier` / 数値の `chatId` のいずれかに一致します。また、`"*"` ワイルドカードエントリは、完全一致のないすべてのグループにデフォルトを提供します (`requireMention` やグループ単位のツールポリシーと同じパターン)。完全一致は常にワイルドカードより優先されます。DM はこのフィールドを無視します。代わりに、エージェントレベルまたはアカウントレベルのプロンプトカスタマイズを使ってください。

#### 実例: スレッド返信とタップバックリアクション (Private API)

BlueBubbles Private API が有効な場合、受信メッセージには短いメッセージ ID (たとえば `[[reply_to:5]]`) が付き、エージェントは `action=reply` を呼び出して特定のメッセージにスレッド返信したり、`action=react` でタップバックを付けたりできます。グループ単位の `systemPrompt` は、エージェントに適切なツールを選ばせ続ける確実な方法です:

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

タップバックリアクションとスレッド返信はいずれも BlueBubbles Private API が必要です。基礎となる仕組みについては、[高度なアクション](#advanced-actions) と [メッセージ ID](#message-ids-short-vs-full) を参照してください。

## ACP 会話バインディング

BlueBubbles チャットは、トランスポート層を変更せずに永続的な ACP ワークスペースへ変換できます。

オペレーター向けの簡単な流れ:

- DM または許可されたグループチャット内で `/acp spawn codex --bind here` を実行します。
- 以後、同じ BlueBubbles 会話内のメッセージは、生成された ACP セッションにルーティングされます。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

設定済みの永続バインディングも、トップレベルの `bindings[]` エントリで `type: "acp"` と `match.channel: "bluebubbles"` を指定することでサポートされます。

`match.peer.id` には、サポートされている任意の BlueBubbles ターゲット形式を使用できます:

- `+15555550123` や `user@example.com` などの正規化された DM ハンドル
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

安定したグループバインディングには、`chat_id:*` または `chat_identifier:*` を優先してください。

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

共有の ACP バインディング動作については、[ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

## 入力中表示 + 開封確認

- **入力中インジケーター**: 応答生成の前と生成中に自動送信されます。
- **既読通知**: `channels.bluebubbles.sendReadReceipts` によって制御されます（デフォルト: `true`）。
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

BlueBubbles は、設定で有効にすると高度なメッセージアクションをサポートします。

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
    - **react**: Tapback リアクションを追加または削除します（`messageId`, `emoji`, `remove`）。iMessage のネイティブ Tapback セットは `love`, `like`, `dislike`, `laugh`, `emphasize`, `question` です。エージェントがそのセット外の絵文字（例: `👀`）を選択した場合、リアクションツールは `love` にフォールバックするため、リクエスト全体を失敗させずに Tapback が表示されます。設定済みの ack リアクションは引き続き厳密に検証され、不明な値ではエラーになります。
    - **edit**: 送信済みメッセージを編集します（`messageId`, `text`）。
    - **unsend**: メッセージの送信を取り消します（`messageId`）。
    - **reply**: 特定のメッセージに返信します（`messageId`, `text`, `to`）。
    - **sendWithEffect**: iMessage エフェクト付きで送信します（`text`, `to`, `effectId`）。
    - **renameGroup**: グループチャット名を変更します（`chatGuid`, `displayName`）。
    - **setGroupIcon**: グループチャットのアイコン/写真を設定します（`chatGuid`, `media`）— macOS 26 Tahoe では不安定です（API が成功を返してもアイコンが同期されないことがあります）。
    - **addParticipant**: グループに参加者を追加します（`chatGuid`, `address`）。
    - **removeParticipant**: グループから参加者を削除します（`chatGuid`, `address`）。
    - **leaveGroup**: グループチャットから退出します（`chatGuid`）。
    - **upload-file**: メディア/ファイルを送信します（`to`, `buffer`, `filename`, `asVoice`）。
      - 音声メモ: iMessage の音声メッセージとして送信するには、**MP3** または **CAF** 音声で `asVoice: true` を設定します。BlueBubbles は音声メモ送信時に MP3 → CAF に変換します。
    - レガシーエイリアス: `sendAttachment` は引き続き動作しますが、正式なアクション名は `upload-file` です。

  </Accordion>
</AccordionGroup>

### メッセージ ID（短縮と完全）

OpenClaw は、トークン節約のために _短縮_ メッセージ ID（例: `1`, `2`）を表示することがあります。

- `MessageSid` / `ReplyToId` は短縮 ID の場合があります。
- `MessageSidFull` / `ReplyToIdFull` にはプロバイダーの完全な ID が含まれます。
- 短縮 ID はメモリ内にあります。再起動やキャッシュ削除で期限切れになることがあります。
- アクションは短縮または完全な `messageId` を受け付けますが、短縮 ID が利用できなくなっている場合はエラーになります。

永続的な自動化や保存には完全な ID を使用してください。

- テンプレート: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- コンテキスト: 受信ペイロード内の `MessageSidFull` / `ReplyToIdFull`

テンプレート変数については [設定](/ja-JP/gateway/configuration) を参照してください。

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 分割送信 DM の結合（1 回の作成でコマンド + URL）

ユーザーが iMessage でコマンドと URL を一緒に入力した場合（例: `Dump https://example.com/article`）、Apple は送信を **2 つの個別の webhook 配信** に分割します。

1. テキストメッセージ（`"Dump"`）。
2. OG プレビュー画像を添付として含む URL プレビューバルーン（`"https://..."`）。

ほとんどのセットアップでは、2 つの webhook は約 0.8〜2.0 秒間隔で OpenClaw に到着します。結合しない場合、エージェントはターン 1 でコマンドだけを受け取り、返信し（多くの場合「URL を送ってください」）、ターン 2 でようやく URL を認識します。その時点ではコマンドのコンテキストはすでに失われています。

`channels.bluebubbles.coalesceSameSenderDms` は、DM で連続する同一送信者の webhook を 1 つのエージェントターンにマージするようにします。グループチャットは引き続きメッセージごとにキー化されるため、複数ユーザーのターン構造が維持されます。

<Tabs>
  <Tab title="有効にする場合">
    次の場合に有効にします。

    - 1 つのメッセージ内に `command + payload` を期待する Skills（dump、paste、save、queue など）を提供している。
    - ユーザーがコマンドと一緒に URL、画像、長いコンテンツを貼り付ける。
    - 追加される DM ターン遅延を許容できる（下記参照）。

    次の場合は無効のままにします。

    - 1 語の DM トリガーで最小のコマンド遅延が必要。
    - すべてのフローが、後続ペイロードなしの単発コマンドである。

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

    フラグがオンで、明示的な `messages.inbound.byChannel.bluebubbles` がない場合、デバウンスウィンドウは **2500 ms** に広がります（非結合時のデフォルトは 500 ms）。この広いウィンドウが必要です。Apple の分割送信の間隔である 0.8〜2.0 秒は、より短いデフォルトには収まりません。

    ウィンドウを自分で調整するには:

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
    - **DM 制御コマンドに遅延が追加されます。** フラグがオンの場合、DM 制御コマンドメッセージ（`Dump`, `Save` など）は、ペイロード webhook が来る可能性に備えて、ディスパッチ前にデバウンスウィンドウまで待機するようになります。グループチャットのコマンドは即時ディスパッチのままです。
    - **マージされた出力には上限があります** — マージ後のテキストは明示的な `…[truncated]` マーカー付きで 4000 文字に制限されます。添付は 20 件まで、ソースエントリは 10 件までです（それを超える場合は最初と最新が保持されます）。個々のイベントが後で MessagePoller によって再生されても重複として認識されるよう、各ソースの `messageId` は引き続き受信重複排除に到達します。
    - **オプトインで、チャンネルごとの設定です。** 他のチャンネル（Telegram, WhatsApp, Slack, …）には影響しません。

  </Tab>
</Tabs>

### シナリオとエージェントが見る内容

| ユーザーの作成内容                                                 | Apple の配信             | フラグオフ（デフォルト）                | フラグオン + 2500 ms ウィンドウ                                      |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（1 回の送信）                           | 約 1 秒間隔の 2 webhook   | 2 つのエージェントターン: 「Dump」だけ、その後 URL | 1 つのターン: マージされたテキスト `Dump https://example.com`          |
| `Save this 📎image.jpg caption`（添付 + テキスト）                 | 2 webhook                 | 2 つのターン                            | 1 つのターン: テキスト + 画像                                          |
| `/status`（単独コマンド）                                         | 1 webhook                 | 即時ディスパッチ                        | **ウィンドウまで待機してからディスパッチ**                            |
| URL だけを貼り付け                                                 | 1 webhook                 | 即時ディスパッチ                        | 即時ディスパッチ（バケット内のエントリが 1 つだけ）                   |
| テキスト + URL を意図的に別々のメッセージとして数分空けて送信      | ウィンドウ外の 2 webhook  | 2 つのターン                            | 2 つのターン（その間にウィンドウが期限切れ）                          |
| 急速な大量送信（ウィンドウ内に >10 件の小さな DM）                | N webhook                 | N ターン                                | 1 つのターン、上限付き出力（最初 + 最新、テキスト/添付の上限を適用） |

### 分割送信結合のトラブルシューティング

フラグがオンでも分割送信が 2 つのターンとして到着する場合は、各レイヤーを確認してください。

<AccordionGroup>
  <Accordion title="設定が実際に読み込まれている">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    その後 `openclaw gateway restart` を実行します。このフラグはデバウンサーレジストリ作成時に読み取られます。

  </Accordion>
  <Accordion title="セットアップに対してデバウンスウィンドウが十分広い">
    `~/Library/Logs/bluebubbles-server/main.log` にある BlueBubbles サーバーログを確認します。

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    `"Dump"` のようなテキストディスパッチと、その後に続く `"https://..."; Attachments:` ディスパッチとの間隔を測定します。その間隔を十分にカバーできるように `messages.inbound.byChannel.bluebubbles` を引き上げます。

  </Accordion>
  <Accordion title="セッション JSONL タイムスタンプ ≠ webhook 到着">
    セッションイベントのタイムスタンプ（`~/.openclaw/agents/<id>/sessions/*.jsonl`）は、Gateway がメッセージをエージェントに渡した時刻を反映しており、webhook が到着した時刻では**ありません**。`[Queued messages while agent was busy]` とタグ付けされたキュー済みの 2 通目のメッセージは、2 つ目の webhook が到着した時点で最初のターンがまだ実行中だったことを意味します。結合バケットはすでにフラッシュされていました。セッションログではなく、BB サーバーログに合わせてウィンドウを調整してください。
  </Accordion>
  <Accordion title="メモリ圧迫により返信ディスパッチが遅くなる">
    小さめのマシン（8 GB）では、エージェントターンに十分な時間がかかり、返信が完了する前に結合バケットがフラッシュされ、URL がキュー済みの 2 ターン目として到着することがあります。`memory_pressure` と `ps -o rss -p $(pgrep openclaw-gateway)` を確認してください。Gateway が約 500 MB RSS を超えていてコンプレッサーがアクティブな場合は、他の重いプロセスを閉じるか、より大きいホストに増強してください。
  </Accordion>
  <Accordion title="返信引用送信は別経路">
    ユーザーが既存の URL バルーンへの**返信**として `Dump` をタップした場合（iMessage では Dump バブルに「1 Reply」バッジが表示されます）、URL は 2 つ目の webhook ではなく `replyToBody` に存在します。結合は適用されません。これはデバウンサーの問題ではなく、skill/prompt の問題です。
  </Accordion>
</AccordionGroup>

## ブロックストリーミング

応答を単一のメッセージとして送信するか、ブロック単位でストリーミングするかを制御します。

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
- 受信および送信メディアの上限は `channels.bluebubbles.mediaMaxMb` で設定します（デフォルト: 8 MB）。
- 送信テキストは `channels.bluebubbles.textChunkLimit` に分割されます（デフォルト: 4000 文字）。

## 設定リファレンス

完全な設定: [設定](/ja-JP/gateway/configuration)

<AccordionGroup>
  <Accordion title="接続と webhook">
    - `channels.bluebubbles.enabled`: チャンネルを有効/無効にします。
    - `channels.bluebubbles.serverUrl`: BlueBubbles REST API ベース URL。
    - `channels.bluebubbles.password`: API パスワード。
    - `channels.bluebubbles.webhookPath`: Webhook エンドポイントパス（デフォルト: `/bluebubbles-webhook`）。

  </Accordion>
  <Accordion title="アクセスポリシー">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: `pairing`）。
    - `channels.bluebubbles.allowFrom`: DM 許可リスト（ハンドル、メール、E.164 番号、`chat_id:*`, `chat_guid:*`）。
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled`（デフォルト: `allowlist`）。
    - `channels.bluebubbles.groupAllowFrom`: グループ送信者許可リスト。
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOS では、ゲート通過後に名前のないグループ参加者をローカルの連絡先から任意で補完します。デフォルト: `false`。
    - `channels.bluebubbles.groups`: グループごとの設定（`requireMention` など）。

  </Accordion>
  <Accordion title="配信とチャンク化">
    - `channels.bluebubbles.sendReadReceipts`: 既読通知を送信します (デフォルト: `true`)。
    - `channels.bluebubbles.blockStreaming`: ブロックストリーミングを有効にします (デフォルト: `false`、ストリーミング返信に必要)。
    - `channels.bluebubbles.textChunkLimit`: 送信チャンクサイズ (文字数、デフォルト: 4000)。
    - `channels.bluebubbles.sendTimeoutMs`: `/api/v1/message/text` 経由の送信テキスト送信に対するリクエストごとのタイムアウト (ms、デフォルト: 30000)。Private API の iMessage 送信が iMessage フレームワーク内で 60 秒以上停止することがある macOS 26 環境では、たとえば `45000` や `60000` に引き上げます。プローブ、チャット検索、リアクション、編集、ヘルスチェックは現在も短い 10 秒のデフォルトを維持します。リアクションと編集への対象拡大はフォローアップとして予定されています。アカウントごとの上書き: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
    - `channels.bluebubbles.chunkMode`: `length` (デフォルト) は `textChunkLimit` を超えた場合にのみ分割します。`newline` は長さによるチャンク化の前に空行 (段落境界) で分割します。

  </Accordion>
  <Accordion title="メディアと履歴">
    - `channels.bluebubbles.mediaMaxMb`: 受信/送信メディアの上限 (MB、デフォルト: 8)。
    - `channels.bluebubbles.mediaLocalRoots`: 送信ローカルメディアパスに許可される絶対ローカルディレクトリの明示的な許可リスト。これが設定されていない限り、ローカルパス送信はデフォルトで拒否されます。アカウントごとの上書き: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
    - `channels.bluebubbles.coalesceSameSenderDms`: 同じ送信者から連続する DM Webhook を 1 つのエージェントターンに統合し、Apple のテキスト+URL 分割送信を単一メッセージとして到着させます (デフォルト: `false`)。シナリオ、ウィンドウ調整、トレードオフについては [分割送信 DM の統合](#coalescing-split-send-dms-command--url-in-one-composition) を参照してください。明示的な `messages.inbound.byChannel.bluebubbles` なしで有効にすると、デフォルトの受信デバウンスウィンドウが 500 ms から 2500 ms に広がります。
    - `channels.bluebubbles.historyLimit`: コンテキスト用の最大グループメッセージ数 (0 で無効)。
    - `channels.bluebubbles.dmHistoryLimit`: DM 履歴の上限。
    - `channels.bluebubbles.replyContextApiFallback`: 受信返信に `replyToBody`/`replyToSender` がなく、メモリ内の返信コンテキストキャッシュもミスした場合、ベストエフォートのフォールバックとして BlueBubbles HTTP API から元メッセージを取得します (デフォルト: `false`)。1 つの BlueBubbles アカウントを共有する複数インスタンス構成、プロセス再起動後、または長期間の TTL/LRU キャッシュ退避後に有用です。この取得は他のすべての BlueBubbles クライアントリクエストと同じポリシーで SSRF から保護され、例外を投げず、キャッシュを埋めるため後続の返信で償却されます。アカウントごとの上書き: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`。チャンネルレベルの設定は、このフラグを省略したアカウントへ伝播します。

  </Accordion>
  <Accordion title="アクションとアカウント">
    - `channels.bluebubbles.actions`: 特定のアクションを有効化/無効化します。
    - `channels.bluebubbles.accounts`: 複数アカウント構成。

  </Accordion>
</AccordionGroup>

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns` (または `messages.groupChat.mentionPatterns`)。
- `messages.responsePrefix`。

## アドレス指定 / 配信先

安定したルーティングには `chat_guid` を推奨します:

- `chat_guid:iMessage;-;+15555550123` (グループに推奨)
- `chat_id:123`
- `chat_identifier:...`
- 直接ハンドル: `+15555550123`, `user@example.com`
  - 直接ハンドルに既存の DM チャットがない場合、OpenClaw は `POST /api/v1/chat/new` 経由で作成します。これには BlueBubbles Private API が有効である必要があります。

### iMessage と SMS のルーティング

同じハンドルに Mac 上で iMessage と SMS の両方のチャットがある場合 (たとえば、iMessage に登録されているが緑の吹き出しのフォールバックも受信したことがある電話番号)、OpenClaw は iMessage チャットを優先し、暗黙に SMS へダウングレードすることはありません。SMS チャットを強制するには、明示的な `sms:` ターゲット接頭辞を使用します (例: `sms:+15555550123`)。一致する iMessage チャットがないハンドルは、BlueBubbles が報告する任意のチャット経由で送信されます。

## セキュリティ

- Webhook リクエストは、`guid`/`password` クエリパラメータまたはヘッダーを `channels.bluebubbles.password` と比較して認証されます。
- API パスワードと Webhook エンドポイントは秘密にしてください (認証情報と同様に扱ってください)。
- BlueBubbles Webhook 認証には localhost バイパスはありません。Webhook トラフィックをプロキシする場合、リクエストのエンドツーエンドで BlueBubbles パスワードを保持してください。ここでは `gateway.trustedProxies` は `channels.bluebubbles.password` を置き換えません。[Gateway セキュリティ](/ja-JP/gateway/security#reverse-proxy-configuration) を参照してください。
- LAN 外に公開する場合は、BlueBubbles サーバーで HTTPS とファイアウォールルールを有効にしてください。

## トラブルシューティング

- 入力中/既読イベントが動作しなくなった場合は、BlueBubbles Webhook ログを確認し、Gateway パスが `channels.bluebubbles.webhookPath` と一致していることを検証してください。
- ペアリングコードは 1 時間後に期限切れになります。`openclaw pairing list bluebubbles` と `openclaw pairing approve bluebubbles <code>` を使用してください。
- リアクションには BlueBubbles private API (`POST /api/v1/message/react`) が必要です。サーバーバージョンがそれを公開していることを確認してください。
- 編集/送信取り消しには macOS 13+ と互換性のある BlueBubbles サーバーバージョンが必要です。macOS 26 (Tahoe) では、private API の変更により編集は現在壊れています。
- グループアイコン更新は macOS 26 (Tahoe) で不安定な場合があります。API は成功を返しても、新しいアイコンが同期されないことがあります。
- OpenClaw は、BlueBubbles サーバーの macOS バージョンに基づいて、既知の壊れたアクションを自動的に非表示にします。macOS 26 (Tahoe) でも編集が表示される場合は、`channels.bluebubbles.actions.edit=false` で手動で無効化してください。
- `coalesceSameSenderDms` を有効にしているのに分割送信 (例: `Dump` + URL) がまだ 2 ターンとして到着する場合は、[分割送信統合のトラブルシューティング](#split-send-coalescing-troubleshooting) チェックリストを参照してください。よくある原因は、デバウンスウィンドウが短すぎる、セッションログのタイムスタンプを Webhook 到着時刻として読み間違えている、または返信引用送信 (`replyToBody` を使用し、2 つ目の Webhook ではない) です。
- ステータス/ヘルス情報: `openclaw status --all` または `openclaw status --deep`。

一般的なチャンネルワークフローのリファレンスについては、[Channels](/ja-JP/channels) と [Plugins](/ja-JP/tools/plugin) ガイドを参照してください。

## 関連

- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [チャンネル概要](/ja-JP/channels) — 対応するすべてのチャンネル
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
