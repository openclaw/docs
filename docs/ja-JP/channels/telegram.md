---
read_when:
    - Telegram の機能または Webhook に取り組む
summary: Telegram ボットのサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-05-02T20:42:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b5a733970f21e6b5a145b9ebb13134fb8e18b81fa0c723607019837c60f5497
    source_path: channels/telegram.md
    workflow: 16
---

本番対応で、grammY を介した bot DM とグループに対応しています。デフォルトモードはロングポーリングで、webhook モードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram のデフォルト DM ポリシーはペアリングです。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    クロスチャネルの診断と修復プレイブックです。
  </Card>
  <Card title="Gateway 設定" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャネル設定パターンと例です。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="BotFather で bot トークンを作成する">
    Telegram を開き、**@BotFather** とチャットします（ハンドルが正確に `@BotFather` であることを確認してください）。

    `/newbot` を実行し、プロンプトに従って、トークンを保存します。

  </Step>

  <Step title="トークンと DM ポリシーを設定する">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    env フォールバック: `TELEGRAM_BOT_TOKEN=...`（デフォルトアカウントのみ）。
    Telegram は `openclaw channels login telegram` を使用**しません**。config/env でトークンを設定してから、gateway を起動してください。

  </Step>

  <Step title="gateway を起動し、最初の DM を承認する">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    ペアリングコードは 1 時間後に期限切れになります。

  </Step>

  <Step title="bot をグループに追加する">
    bot をグループに追加してから、アクセスモデルに合わせて `channels.telegram.groups` と `groupPolicy` を設定します。
  </Step>
</Steps>

<Note>
トークン解決順序はアカウントを考慮します。実際には config 値が env フォールバックより優先され、`TELEGRAM_BOT_TOKEN` はデフォルトアカウントにのみ適用されます。
</Note>

## Telegram 側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループの可視性">
    Telegram bot はデフォルトで **プライバシーモード**になっており、受信できるグループメッセージが制限されます。

    bot がすべてのグループメッセージを見る必要がある場合は、次のいずれかを行います。

    - `/setprivacy` でプライバシーモードを無効化する、または
    - bot をグループ管理者にする。

    プライバシーモードを切り替えるときは、Telegram が変更を適用するように各グループで bot を削除してから再追加してください。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスは Telegram のグループ設定で制御されます。

    管理者 bot はすべてのグループメッセージを受信するため、常時稼働のグループ動作に有用です。

  </Accordion>

  <Accordion title="便利な BotFather 切り替え">

    - `/setjoingroups` でグループ追加を許可/拒否する
    - `/setprivacy` でグループの可視性動作を設定する

  </Accordion>
</AccordionGroup>

## アクセス制御とアクティベーション

<Tabs>
  <Tab title="DM ポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージのアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom` に少なくとも 1 つの送信者 ID が必要）
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    `dmPolicy: "open"` と `allowFrom: ["*"]` を組み合わせると、bot のユーザー名を見つけるか推測した任意の Telegram アカウントが bot に命令できるようになります。厳しく制限されたツールを持つ、意図的に公開された bot にのみ使用してください。単一所有者の bot では、数値ユーザー ID を使った `allowlist` を使用してください。

    `channels.telegram.allowFrom` は数値の Telegram ユーザー ID を受け入れます。`telegram:` / `tg:` プレフィックスは受け入れられ、正規化されます。
    マルチアカウント設定では、制限的なトップレベルの `channels.telegram.allowFrom` は安全境界として扱われます。アカウントレベルの `allowFrom: ["*"]` エントリは、マージ後の有効なアカウント allowlist に明示的なワイルドカードがまだ含まれていない限り、そのアカウントを公開状態にはしません。
    空の `allowFrom` を持つ `dmPolicy: "allowlist"` はすべての DM をブロックし、config 検証で拒否されます。
    セットアップでは数値ユーザー ID のみを求めます。
    アップグレード後に config に `@username` allowlist エントリが含まれている場合は、`openclaw doctor --fix` を実行して解決してください（ベストエフォート。Telegram bot トークンが必要です）。
    以前にペアリングストアの allowlist ファイルに依存していた場合、`openclaw doctor --fix` は allowlist フローでエントリを `channels.telegram.allowFrom` に復元できます（たとえば、`dmPolicy: "allowlist"` にまだ明示的な ID がない場合）。

    単一所有者の bot では、以前のペアリング承認に依存する代わりに、明示的な数値 `allowFrom` ID を指定した `dmPolicy: "allowlist"` を使用して、アクセスポリシーを config 内で永続化することを推奨します。

    よくある混乱: DM ペアリング承認は「この送信者がどこでも承認されている」という意味ではありません。
    ペアリングは DM アクセスを付与します。コマンド所有者がまだ存在しない場合、最初に承認されたペアリングは `commands.ownerAllowFrom` も設定し、所有者専用コマンドと exec 承認に明示的なオペレーターアカウントを持たせます。
    グループ送信者の承認は、引き続き明示的な config allowlist から取得されます。
    「一度承認されれば DM とグループコマンドの両方が動作する」ようにしたい場合は、数値の Telegram ユーザー ID を `channels.telegram.allowFrom` に入れてください。所有者専用コマンドでは、`commands.ownerAllowFrom` に `telegram:<your user id>` が含まれていることを確認してください。

    ### Telegram ユーザー ID を確認する

    より安全な方法（サードパーティ bot なし）:

    1. bot に DM します。
    2. `openclaw logs --follow` を実行します。
    3. `from.id` を読み取ります。

    公式 Bot API メソッド:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティ方式（プライバシーは低め）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーと allowlist">
    2 つの制御が一緒に適用されます。

    1. **許可されるグループ**（`channels.telegram.groups`）
       - `groups` config なし:
         - `groupPolicy: "open"` の場合: 任意のグループがグループ ID チェックを通過できます
         - `groupPolicy: "allowlist"`（デフォルト）の場合: `groups` エントリ（または `"*"`）を追加するまでグループはブロックされます
       - `groups` が設定済み: allowlist として機能します（明示的な ID または `"*"`）

    2. **グループ内で許可される送信者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（デフォルト）
       - `disabled`

    `groupAllowFrom` はグループ送信者フィルタリングに使用されます。設定されていない場合、Telegram は `allowFrom` にフォールバックします。
    `groupAllowFrom` エントリは数値の Telegram ユーザー ID である必要があります（`telegram:` / `tg:` プレフィックスは正規化されます）。
    Telegram グループまたはスーパーグループのチャット ID を `groupAllowFrom` に入れないでください。負のチャット ID は `channels.telegram.groups` に属します。
    数値以外のエントリは送信者承認では無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ送信者認証は DM ペアリングストア承認を継承**しません**。
    ペアリングは DM 専用のままです。グループでは、`groupAllowFrom` またはグループ別/トピック別の `allowFrom` を設定してください。
    `groupAllowFrom` が未設定の場合、Telegram はペアリングストアではなく config の `allowFrom` にフォールバックします。
    単一所有者 bot の実用的なパターン: ユーザー ID を `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにして、対象グループを `channels.telegram.groups` で許可します。
    実行時の注記: `channels.telegram` が完全に欠落している場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、runtime は fail-closed の `groupPolicy="allowlist"` をデフォルトにします。

    例: 1 つの特定グループで任意のメンバーを許可する:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    例: 1 つの特定グループ内で特定ユーザーのみを許可する:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      よくある間違い: `groupAllowFrom` は Telegram グループの allowlist ではありません。

      - `-1001234567890` のような負の Telegram グループまたはスーパーグループのチャット ID は `channels.telegram.groups` に入れてください。
      - 許可されたグループ内でどの人が bot をトリガーできるかを制限したい場合は、`8734062810` のような Telegram ユーザー ID を `groupAllowFrom` に入れてください。
      - 許可されたグループの任意のメンバーが bot とやり取りできるようにしたい場合にのみ、`groupAllowFrom: ["*"]` を使用してください。

    </Warning>

  </Tab>

  <Tab title="メンション動作">
    グループ返信はデフォルトでメンションを必要とします。

    メンションは次から取得できます。

    - ネイティブの `@botusername` メンション、または
    - 次のメンションパターン:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    セッションレベルのコマンド切り替え:

    - `/activation always`
    - `/activation mention`

    これらはセッション状態のみを更新します。永続化には config を使用してください。

    永続 config の例:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    グループチャット ID の取得方法:

    - グループメッセージを `@userinfobot` / `@getidsbot` に転送する
    - または `openclaw logs --follow` から `chat.id` を読み取る
    - または Bot API の `getUpdates` を確認する

  </Tab>
</Tabs>

## Runtime 動作

- Telegram は gateway プロセスによって所有されます。
- ルーティングは決定的です。Telegram の受信は Telegram に返信されます（モデルはチャネルを選択しません）。
- 受信メッセージは、返信メタデータとメディアプレースホルダーを含む共有チャネルエンベロープに正規化されます。
- グループセッションはグループ ID で分離されます。フォーラムトピックは `:topic:<threadId>` を追加してトピックを分離します。
- DM メッセージは `message_thread_id` を持てます。OpenClaw は返信用にスレッド ID を保持しますが、デフォルトでは DM をフラットなセッションのままにします。意図的に DM トピックセッション分離を行いたい場合は、`channels.telegram.dm.threadReplies: "inbound"`、`channels.telegram.direct.<chatId>.threadReplies: "inbound"`、`requireTopic: true`、または一致するトピック config を設定してください。
- ロングポーリングは、チャット別/スレッド別シーケンシングを備えた grammY runner を使用します。runner 全体の sink 並行数は `agents.defaults.maxConcurrent` を使用します。
- ロングポーリングは各 gateway プロセス内で保護されるため、一度に 1 つのアクティブな poller だけが bot トークンを使用できます。それでも `getUpdates` の 409 競合が表示される場合は、別の OpenClaw gateway、スクリプト、または外部 poller が同じトークンを使用している可能性があります。
- ロングポーリング watchdog の再起動は、デフォルトで完了した `getUpdates` liveness が 120 秒間ない場合にトリガーされます。長時間実行される作業中にデプロイでまだ誤った polling-stall 再起動が発生する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。値はミリ秒単位で、`30000` から `600000` まで許可されます。アカウント別の上書きもサポートされています。
- Telegram Bot API には既読確認のサポートがありません（`sendReadReceipts` は適用されません）。

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClaw は部分的な返信をリアルタイムでストリーミングできます。

    - ダイレクトチャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming` は `off | partial | block | progress` です（デフォルト: `partial`）
    - `progress` は Telegram では `partial` にマップされます（クロスチャネル命名との互換性）
    - `streaming.preview.toolProgress` は、ツール/進行状況の更新が同じ編集済みプレビューメッセージを再利用するかどうかを制御します（デフォルト: プレビューストリーミングがアクティブな場合は `true`）
    - レガシーの `channels.telegram.streamMode` と boolean の `streaming` 値は検出されます。`openclaw doctor --fix` を実行して `channels.telegram.streaming.mode` に移行してください。

    ツール進行状況のプレビュー更新は、ツール実行中に表示される短い「Working...」行です。たとえば、コマンド実行、ファイル読み取り、計画更新、パッチ要約などです。Telegram では、`v2026.4.22` 以降のリリース済み OpenClaw 動作に合わせるため、これらがデフォルトで有効になっています。回答テキスト用の編集済みプレビューは維持しつつ、ツール進行状況の行を非表示にするには、次のように設定します。

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    `streaming.mode: "off"` は、最終応答のみの配信をしたい場合だけ使用してください。Telegram のプレビュー編集は無効になり、汎用的なツール/進行状況の雑談は、独立した「Working...」メッセージとして送信される代わりに抑制されます。承認プロンプト、メディアペイロード、エラーは引き続き通常の最終配信経路を通ります。回答プレビュー編集だけを維持し、ツール進行状況のステータス行を非表示にしたい場合は、`streaming.preview.toolProgress: false` を使用してください。

    テキストのみの返信の場合:

    - 短い DM/グループ/トピックのプレビュー: OpenClaw は同じプレビューメッセージを維持し、その場で最終編集を行います
    - 約1分より古いプレビュー: OpenClaw は完了した返信を新しい最終メッセージとして送信してからプレビューをクリーンアップするため、Telegram に表示されるタイムスタンプはプレビュー作成時刻ではなく完了時刻を反映します

    複雑な返信（たとえばメディアペイロード）の場合、OpenClaw は通常の最終配信にフォールバックしてからプレビューメッセージをクリーンアップします。

    プレビューストリーミングはブロックストリーミングとは別です。Telegram でブロックストリーミングが明示的に有効になっている場合、OpenClaw は二重ストリーミングを避けるためにプレビューストリームをスキップします。

    Telegram専用の推論ストリーム:

    - `/reasoning stream` は生成中に推論をライブプレビューへ送信します
    - 最終回答は推論テキストなしで送信されます

  </Accordion>

  <Accordion title="書式設定と HTML フォールバック">
    送信テキストは Telegram `parse_mode: "HTML"` を使用します。

    - Markdown 風のテキストは Telegram で安全な HTML にレンダリングされます。
    - 生のモデル HTML は、Telegram の解析失敗を減らすためにエスケープされます。
    - Telegram が解析済み HTML を拒否した場合、OpenClaw はプレーンテキストで再試行します。

    リンクプレビューはデフォルトで有効で、`channels.telegram.linkPreview: false` で無効にできます。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegram コマンドメニューの登録は起動時に `setMyCommands` で処理されます。

    ネイティブコマンドのデフォルト:

    - `commands.native: "auto"` は Telegram のネイティブコマンドを有効にします

    カスタムコマンドメニュー項目を追加します:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    ルール:

    - 名前は正規化されます（先頭の `/` を取り除き、小文字化）
    - 有効なパターン: `a-z`、`0-9`、`_`、長さ `1..32`
    - カスタムコマンドはネイティブコマンドを上書きできません
    - 競合/重複はスキップされ、ログに記録されます

    注記:

    - カスタムコマンドはメニュー項目のみです。動作を自動実装するものではありません
    - Plugin/Skills コマンドは、Telegram メニューに表示されていなくても、入力されれば引き続き動作できます

    ネイティブコマンドが無効の場合、組み込みコマンドは削除されます。カスタム/Plugin コマンドは、構成されていれば引き続き登録される場合があります。

    よくある設定失敗:

    - `setMyCommands failed` と `BOT_COMMANDS_TOO_MUCH` が出る場合、トリミング後も Telegram メニューがまだ上限を超えています。Plugin/Skills/カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効にしてください。
    - 直接の Bot API curl コマンドは動作するのに、`deleteWebhook`、`deleteMyCommands`、または `setMyCommands` が `404: Not Found` で失敗する場合、`channels.telegram.apiRoot` が完全な `/bot<TOKEN>` エンドポイントに設定されている可能性があります。`apiRoot` は Bot API ルートのみである必要があり、`openclaw doctor --fix` は誤って末尾に付いた `/bot<TOKEN>` を削除します。
    - `getMe returned 401` は、Telegram が設定済みの bot トークンを拒否したことを意味します。`botToken`、`tokenFile`、または `TELEGRAM_BOT_TOKEN` を現在の BotFather トークンで更新してください。OpenClaw はポーリング前に停止するため、これは Webhook クリーンアップ失敗としては報告されません。
    - `setMyCommands failed` とネットワーク/fetch エラーが出る場合、通常は `api.telegram.org` への送信 DNS/HTTPS がブロックされています。

    ### デバイスペアリングコマンド（`device-pair` Plugin）

    `device-pair` Plugin がインストールされている場合:

    1. `/pair` がセットアップコードを生成します
    2. iOS アプリにコードを貼り付けます
    3. `/pair pending` は保留中のリクエストを一覧表示します（ロール/スコープを含む）
    4. リクエストを承認します:
       - 明示的な承認には `/pair approve <requestId>`
       - 保留中のリクエストが1件だけの場合は `/pair approve`
       - 最新のものには `/pair approve latest`

    セットアップコードには短命のブートストラップトークンが含まれます。組み込みのブートストラップ引き渡しは、プライマリノードトークンを `scopes: []` に維持します。引き渡されたオペレータートークンは、`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` に制限されたままです。ブートストラップのスコープチェックにはロール接頭辞が付くため、そのオペレーター許可リストはオペレーターリクエストのみを満たします。オペレーター以外のロールには、引き続きそれぞれのロール接頭辞配下のスコープが必要です。

    デバイスが変更された認証詳細（たとえばロール/スコープ/公開鍵）で再試行した場合、以前の保留中リクエストは置き換えられ、新しいリクエストは別の `requestId` を使用します。承認前に `/pair pending` を再実行してください。

    詳細: [ペアリング](/ja-JP/channels/pairing#pair-via-telegram-recommended-for-ios)。

  </Accordion>

  <Accordion title="インラインボタン">
    インラインキーボードのスコープを構成します:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    アカウント単位の上書き:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    スコープ:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist`（デフォルト）

    旧式の `capabilities: ["inlineButtons"]` は `inlineButtons: "all"` にマップされます。

    メッセージアクションの例:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    コールバックのクリックはテキストとしてエージェントに渡されます:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="エージェントと自動化向け Telegram メッセージアクション">
    Telegram ツールアクションには次が含まれます:

    - `sendMessage`（`to`、`content`、任意の `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`、任意の `iconColor`、`iconCustomEmojiId`）

    チャンネルメッセージアクションは、使いやすいエイリアス（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）を公開します。

    ゲート制御:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（デフォルト: 無効）

    注記: `edit` と `topic-create` は現在デフォルトで有効で、個別の `channels.telegram.actions.*` トグルはありません。
    ランタイム送信はアクティブな構成/シークレットスナップショット（起動/リロード）を使用するため、アクションパスは送信ごとにアドホックな SecretRef 再解決を行いません。

    リアクション削除の意味論: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="返信スレッドタグ">
    Telegram は生成出力内の明示的な返信スレッドタグをサポートします:

    - `[[reply_to_current]]` はトリガー元メッセージに返信します
    - `[[reply_to:<id>]]` は特定の Telegram メッセージ ID に返信します

    `channels.telegram.replyToMode` は処理を制御します:

    - `off`（デフォルト）
    - `first`
    - `all`

    返信スレッドが有効で、元の Telegram テキストまたはキャプションが利用可能な場合、OpenClaw はネイティブ Telegram 引用抜粋を自動的に含めます。Telegram はネイティブ引用テキストを 1024 UTF-16 コード単位に制限しているため、長いメッセージは先頭から引用され、Telegram が引用を拒否した場合はプレーンな返信にフォールバックします。

    注記: `off` は暗黙的な返信スレッドを無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッド動作">
    フォーラムスーパーグループ:

    - トピックセッションキーには `:topic:<threadId>` が追加されます
    - 返信と入力中表示はトピックスレッドを対象にします
    - トピック構成パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般トピック（`threadId=1`）の特殊ケース:

    - メッセージ送信では `message_thread_id` を省略します（Telegram は `sendMessage(...thread_id=1)` を拒否します）
    - 入力中アクションには引き続き `message_thread_id` が含まれます

    トピック継承: トピック項目は、上書きされない限りグループ設定を継承します（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` はトピック専用で、グループのデフォルトからは継承されません。

    **トピック単位のエージェントルーティング**: 各トピックは、トピック構成で `agentId` を設定することで別のエージェントにルーティングできます。これにより、各トピックは独自に分離されたワークスペース、メモリ、セッションを持てます。例:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    その後、各トピックは独自のセッションキーを持ちます: `agent:zu:telegram:group:-1001234567890:topic:3`

    **永続的な ACP トピックバインディング**: フォーラムトピックは、トップレベルの型付き ACP バインディング（`type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`、および `-1001234567890:topic:42` のようなトピック修飾 ID を持つ `bindings[]`）を通じて、ACP ハーネスセッションを固定できます。現在はグループ/スーパーグループ内のフォーラムトピックにスコープされています。[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

    **チャットからのスレッド紐付け ACP spawn**: `/acp spawn <agent> --thread here|auto` は現在のトピックを新しい ACP セッションにバインドします。後続のやり取りはそこへ直接ルーティングされます。OpenClaw は spawn 確認をトピック内に固定します。`channels.telegram.threadBindings.spawnSessions` が有効なままである必要があります（デフォルト: `true`）。

    テンプレートコンテキストは `MessageThreadId` と `IsForum` を公開します。`message_thread_id` を持つ DM チャットは、デフォルトで DM ルーティングと返信メタデータをフラットセッション上に維持します。`threadReplies: "inbound"`、`threadReplies: "always"`、`requireTopic: true`、または一致するトピック構成で設定されている場合にのみ、スレッド対応セッションキーを使用します。アカウントのデフォルトにはトップレベルの `channels.telegram.dm.threadReplies` を使用し、単一の DM には `direct.<chatId>.threadReplies` を使用してください。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegram はボイスメモと音声ファイルを区別します。

    - デフォルト: 音声ファイルの動作
    - エージェント返信内のタグ `[[audio_as_voice]]` でボイスメモ送信を強制します
    - 受信したボイスメモの文字起こしは、エージェントコンテキスト内で機械生成の信頼されないテキストとして枠付けされます。メンション検出は引き続き生の文字起こしを使用するため、メンションでゲートされた音声メッセージは引き続き動作します。

    メッセージアクションの例:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### 動画メッセージ

    Telegram は動画ファイルと動画メモを区別します。

    メッセージアクションの例:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    動画メモはキャプションをサポートしません。指定されたメッセージテキストは別途送信されます。

    ### ステッカー

    受信ステッカーの処理:

    - 静的 WEBP: ダウンロードされ処理されます（プレースホルダー `<media:sticker>`）
    - アニメーション TGS: スキップされます
    - 動画 WEBM: スキップされます

    ステッカーコンテキストフィールド:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ステッカーキャッシュファイル:

    - `~/.openclaw/telegram/sticker-cache.json`

    ステッカーは（可能な場合）一度説明され、繰り返しのビジョン呼び出しを減らすためにキャッシュされます。

    ステッカーアクションを有効にします:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    ステッカーアクションを送信:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    キャッシュ済みステッカーを検索:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="リアクション通知">
    Telegram のリアクションは、メッセージペイロードとは別の `message_reaction` 更新として届きます。

    有効にすると、OpenClaw は次のようなシステムイベントをキューに入れます:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定:

    - `channels.telegram.reactionNotifications`: `off | own | all` (デフォルト: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (デフォルト: `minimal`)

    注記:

    - `own` は、ボットが送信したメッセージへのユーザーリアクションのみを意味します (送信済みメッセージキャッシュによるベストエフォート)。
    - リアクションイベントにも Telegram のアクセス制御 (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) が適用されます。許可されていない送信者は破棄されます。
    - Telegram はリアクション更新でスレッド ID を提供しません。
      - 非フォーラムグループはグループチャットセッションにルーティングされます
      - フォーラムグループは、正確な発信元トピックではなく、グループの一般トピックセッション (`:topic:1`) にルーティングされます

    ポーリング/Webhook の `allowed_updates` には、`message_reaction` が自動的に含まれます。

  </Accordion>

  <Accordion title="Ack リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間、確認応答の絵文字を送信します。

    解決順序:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェントの ID 絵文字フォールバック (`agents.list[].identity.emoji`、なければ "👀")

    注記:

    - Telegram は Unicode 絵文字 (例: "👀") を想定しています。
    - チャンネルまたはアカウントのリアクションを無効にするには `""` を使用します。

  </Accordion>

  <Accordion title="Telegram イベントとコマンドからの設定書き込み">
    チャンネル設定の書き込みはデフォルトで有効です (`configWrites !== false`)。

    Telegram によってトリガーされる書き込みには次が含まれます:

    - `channels.telegram.groups` を更新するためのグループ移行イベント (`migrate_to_chat_id`)
    - `/config set` と `/config unset` (コマンドの有効化が必要)

    無効化:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="ロングポーリングと Webhook">
    デフォルトはロングポーリングです。Webhook モードでは `channels.telegram.webhookUrl` と `channels.telegram.webhookSecret` を設定します。任意で `webhookPath`, `webhookHost`, `webhookPort` も設定できます (デフォルトは `/telegram-webhook`, `127.0.0.1`, `8787`)。

    ローカルリスナーは `127.0.0.1:8787` にバインドします。公開入口には、ローカルポートの前にリバースプロキシを置くか、意図的に `webhookHost: "0.0.0.0"` を設定します。

    Webhook モードは、Telegram に `200` を返す前にリクエストガード、Telegram シークレットトークン、JSON 本文を検証します。
    その後 OpenClaw は、ロングポーリングと同じチャット単位/トピック単位のボットレーンを通じて更新を非同期に処理するため、エージェントのターンが遅くても Telegram の配信 ACK を保持しません。

  </Accordion>

  <Accordion title="制限、再試行、CLI ターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは 4000 です。
    - `channels.telegram.chunkMode="newline"` は、長さで分割する前に段落境界 (空行) を優先します。
    - `channels.telegram.mediaMaxMb` (デフォルト 100) は、受信および送信 Telegram メディアサイズを制限します。
    - `channels.telegram.timeoutSeconds` は Telegram API クライアントのタイムアウトを上書きします (未設定の場合は grammY のデフォルトが適用されます)。ボットクライアントは、設定値が 60 秒の送信テキスト/タイピングリクエストガードを下回る場合に値をクランプし、OpenClaw のトランスポートガードとフォールバックが実行される前に grammY が表示される返信配信を中止しないようにします。ロングポーリングでは引き続き 45 秒の `getUpdates` リクエストガードを使用するため、アイドル状態のポーリングが無期限に放置されることはありません。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは `120000` です。誤検知のポーリング停止再起動に対してのみ、`30000` から `600000` の間で調整してください。
    - グループコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit` を使用します (デフォルト 50)。`0` で無効化します。
    - 返信/引用/転送の補足コンテキストは、現在は受信したまま渡されます。
    - Telegram の許可リストは主に、誰がエージェントをトリガーできるかを制御するものであり、完全な補足コンテキスト墨消し境界ではありません。
    - DM 履歴制御:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定は、復旧可能な送信 API エラーに対して Telegram 送信ヘルパー (CLI/ツール/アクション) に適用されます。受信の最終返信配信も、Telegram の事前接続失敗に対して境界付きの安全送信再試行を使用しますが、表示されるメッセージが重複する可能性のある曖昧な送信後ネットワークエンベロープは再試行しません。

    CLI 送信ターゲットには、数値のチャット ID またはユーザー名を指定できます:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram ポーリングは `openclaw message poll` を使用し、フォーラムトピックをサポートします:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram 専用のポーリングフラグ:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - フォーラムトピック用の `--thread-id` (または `:topic:` ターゲットを使用)

    Telegram 送信は次もサポートします:

    - `channels.telegram.capabilities.inlineButtons` が許可している場合、インラインキーボード用の `buttons` ブロックを持つ `--presentation`
    - ボットがそのチャットでピン留めできる場合にピン留め配信をリクエストする `--pin` または `--delivery '{"pin":true}'`
    - 送信画像と GIF を、圧縮写真またはアニメーションメディアアップロードではなくドキュメントとして送信する `--force-document`

    アクションのゲート:

    - `channels.telegram.actions.sendMessage=false` は、ポーリングを含む送信 Telegram メッセージを無効にします
    - `channels.telegram.actions.poll=false` は、通常の送信を有効のままにして Telegram ポーリング作成を無効にします

  </Accordion>

  <Accordion title="Telegram の exec 承認">
    Telegram は承認者 DM で exec 承認をサポートし、任意で発信元チャットまたはトピックにもプロンプトを投稿できます。承認者は数値の Telegram ユーザー ID である必要があります。

    設定パス:

    - `channels.telegram.execApprovals.enabled` (少なくとも 1 人の承認者が解決可能な場合に自動で有効化)
    - `channels.telegram.execApprovals.approvers` (`commands.ownerAllowFrom` の数値オーナー ID にフォールバック)
    - `channels.telegram.execApprovals.target`: `dm` (デフォルト) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom`, `defaultTo` は、誰がボットと会話できるか、通常の返信をどこへ送るかを制御します。これらは誰かを exec 承認者にするものではありません。コマンドオーナーがまだ存在しない場合、最初に承認された DM ペアリングが `commands.ownerAllowFrom` を初期化するため、1 オーナー構成でも `execApprovals.approvers` の下に ID を重複させずに機能します。

    チャンネル配信ではコマンドテキストがチャットに表示されます。`channel` または `both` は信頼されたグループ/トピックでのみ有効にしてください。プロンプトがフォーラムトピックに届いた場合、OpenClaw は承認プロンプトとフォローアップのためにトピックを保持します。exec 承認はデフォルトで 30 分後に期限切れになります。

    インライン承認ボタンでも、ターゲットサーフェス (`dm`, `group`, `all`) を許可する `channels.telegram.capabilities.inlineButtons` が必要です。`plugin:` で始まる承認 ID は Plugin 承認を通じて解決され、それ以外はまず exec 承認を通じて解決されます。

    [Exec 承認](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>
</AccordionGroup>

## エラー返信制御

エージェントで配信エラーまたはプロバイダーエラーが発生した場合、Telegram はエラーテキストで返信するか、それを抑制できます。この動作は 2 つの設定キーで制御します:

| キー                                | 値                | デフォルト | 説明                                                                                             |
| ----------------------------------- | ----------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` はチャットに親しみやすいエラーメッセージを送信します。`silent` はエラー返信を完全に抑制します。 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`    | 同じチャットへのエラー返信間の最小時間。障害中のエラースパムを防ぎます。                         |

アカウント単位、グループ単位、トピック単位の上書きがサポートされています (他の Telegram 設定キーと同じ継承)。

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="ボットがメンションなしのグループメッセージに応答しない">

    - `requireMention=false` の場合、Telegram プライバシーモードで完全な可視性を許可する必要があります。
      - BotFather: `/setprivacy` -> Disable
      - その後、ボットをグループから削除して再追加します
    - 設定がメンションなしのグループメッセージを想定している場合、`openclaw channels status` が警告します。
    - `openclaw channels status --probe` は明示的な数値グループ ID を確認できます。ワイルドカード `"*"` はメンバーシップをプローブできません。
    - 簡易セッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="ボットがグループメッセージをまったく認識しない">

    - `channels.telegram.groups` が存在する場合、グループが一覧に含まれている必要があります (または `"*"` を含めます)
    - グループ内のボットメンバーシップを確認します
    - スキップ理由についてログを確認します: `openclaw logs --follow`

  </Accordion>

  <Accordion title="コマンドが部分的にしか動作しない、またはまったく動作しない">

    - 送信者 ID を承認します (ペアリングおよび/または数値の `allowFrom`)
    - グループポリシーが `open` の場合でも、コマンド承認は引き続き適用されます
    - `setMyCommands failed` と `BOT_COMMANDS_TOO_MUCH` が出る場合、ネイティブメニューの項目が多すぎます。Plugin/skill/カスタムコマンドを減らすか、ネイティブメニューを無効にしてください
    - `deleteMyCommands` / `setMyCommands` の起動時呼び出しと `sendChatAction` のタイピング呼び出しは境界付きで、リクエストタイムアウト時に Telegram のトランスポートフォールバックを通じて 1 回再試行されます。永続的なネットワーク/フェッチエラーは通常、`api.telegram.org` への DNS/HTTPS 到達性の問題を示します

  </Accordion>

  <Accordion title="起動時に未承認トークンが報告される">

    - `getMe returned 401` は、設定されたボットトークンに対する Telegram 認証失敗です。
    - BotFather でボットトークンを再コピーまたは再生成し、デフォルトアカウントの `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken`, または `TELEGRAM_BOT_TOKEN` を更新してください。
    - 起動中の `deleteWebhook 401 Unauthorized` も認証失敗です。これを「Webhook が存在しない」と扱うと、同じ不正トークンの失敗を後続の API 呼び出しに先送りするだけです。
    - ポーリング起動中に `deleteWebhook` が一時的なネットワークエラーで失敗した場合、OpenClaw は `getWebhookInfo` を確認します。Telegram が空の Webhook URL を報告した場合、クリーンアップはすでに満たされているためポーリングを継続します。

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定性">

    - Node 22+ + カスタム fetch/proxy は、AbortSignal 型が一致しない場合に即時 abort 動作を引き起こすことがあります。
    - 一部のホストは `api.telegram.org` を先に IPv6 に解決します。壊れた IPv6 egress は、Telegram API の断続的な失敗を引き起こすことがあります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれる場合、OpenClaw はこれらを回復可能なネットワークエラーとして再試行するようになりました。
    - Telegram ソケットが短い固定間隔で再作成される場合は、`channels.telegram.timeoutSeconds` が低すぎないか確認してください。bot クライアントは、outbound および `getUpdates` リクエストガードを下回る設定値をクランプしますが、古いリリースでは、この値がそれらのガードを下回ると、すべての poll または返信で abort することがありました。
    - ログに `Polling stall detected` が含まれる場合、OpenClaw はデフォルトで、完了した long-poll liveness が 120 秒間ないと polling を再起動し、Telegram トランスポートを再構築します。
    - `openclaw channels status --probe` と `openclaw doctor` は、実行中の polling アカウントが起動猶予後に `getUpdates` を完了していない場合、実行中の webhook アカウントが起動猶予後に `setWebhook` を完了していない場合、または最後に成功した polling トランスポートアクティビティが古くなっている場合に警告します。
    - 長時間実行される `getUpdates` 呼び出しが正常なのに、ホストが誤った polling-stall 再起動を報告する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。永続的な stall は通常、ホストと `api.telegram.org` の間の proxy、DNS、IPv6、または TLS egress の問題を示します。
    - Telegram は Bot API トランスポートについても、`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` とそれらの小文字バリアントを含むプロセス proxy env を尊重します。`NO_PROXY` / `no_proxy` は引き続き `api.telegram.org` をバイパスできます。
    - サービス環境で OpenClaw managed proxy が `OPENCLAW_PROXY_URL` によって設定され、標準 proxy env が存在しない場合、Telegram も Bot API トランスポートにその URL を使用します。
    - 不安定な直接 egress/TLS を持つ VPS ホストでは、Telegram API 呼び出しを `channels.telegram.proxy` 経由でルーティングします。

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ はデフォルトで `autoSelectFamily=true` です（WSL2 を除く）。Telegram DNS 結果の順序は、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、次に `channels.telegram.network.dnsResultOrder`、次に `NODE_OPTIONS=--dns-result-order=ipv4first` などのプロセスデフォルトに従います。いずれも適用されない場合、Node 22+ は `ipv4first` にフォールバックします。
    - ホストが WSL2 である、または IPv4 のみの動作の方が明示的に適している場合は、family selection を強制します。

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 ベンチマーク範囲の応答（`198.18.0.0/15`）は、デフォルトですでに Telegram メディアダウンロードに許可されています。信頼済みの fake-IP または透過 proxy が、メディアダウンロード中に `api.telegram.org` を他の private/internal/special-use アドレスへ書き換える場合は、Telegram のみのバイパスに opt in できます。

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じ opt-in はアカウントごとにも
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
      で利用できます。
    - proxy が Telegram メディアホストを `198.18.x.x` に解決する場合は、まず
      dangerous フラグをオフのままにしてください。Telegram メディアは、デフォルトで
      RFC 2544 ベンチマーク範囲をすでに許可しています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` は Telegram
      メディア SSRF 保護を弱めます。Clash、Mihomo、Surge の fake-IP ルーティングなど、
      RFC 2544 ベンチマーク範囲外の private または special-use 応答を合成する、信頼済みの operator-controlled proxy
      環境でのみ使用してください。通常の public internet Telegram アクセスではオフのままにしてください。
    </Warning>

    - 環境オーバーライド（一時的）:
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS 応答を検証します。

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

さらにヘルプ: [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

## 設定リファレンス

主なリファレンス: [設定リファレンス - Telegram](/ja-JP/gateway/config-channels#telegram)。

<Accordion title="High-signal Telegram fields">

- 起動/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*`（`tokenFile` は通常ファイルを指している必要があります。symlink は拒否されます）
- アクセス制御: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, top-level `bindings[]`（`type: "acp"`）
- exec 承認: `execApprovals`, `accounts.*.execApprovals`
- command/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- スレッド/返信: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming`（preview）, `streaming.preview.toolProgress`, `blockStreaming`
- formatting/delivery: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- メディア/ネットワーク: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- カスタム API ルート: `apiRoot`（Bot API root のみ。`/bot<TOKEN>` を含めないでください）
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- アクション/capabilities: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- リアクション: `reactionNotifications`, `reactionLevel`
- エラー: `errorPolicy`, `errorCooldownMs`
- 書き込み/履歴: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
複数アカウントの優先順位: 2 つ以上のアカウント ID が設定されている場合は、`channels.telegram.defaultAccount` を設定する（または `channels.telegram.accounts.default` を含める）ことで、デフォルトルーティングを明示してください。そうしない場合、OpenClaw は最初に正規化されたアカウント ID にフォールバックし、`openclaw doctor` が警告します。名前付きアカウントは `channels.telegram.allowFrom` / `groupAllowFrom` を継承しますが、`accounts.default.*` の値は継承しません。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    Telegram ユーザーを Gateway にペアリングします。
  </Card>
  <Card title="Groups" icon="users" href="/ja-JP/channels/groups">
    グループとトピックの allowlist 動作。
  </Card>
  <Card title="Channel routing" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントにルーティングします。
  </Card>
  <Card title="Security" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと強化。
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    グループとトピックをエージェントにマッピングします。
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断。
  </Card>
</CardGroup>
