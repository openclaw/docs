---
read_when:
    - Telegram の機能または Webhook に取り組む
summary: Telegram ボットのサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-04-30T16:27:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: d18ca6c7ab39d7d34848c562857661501d8364329f6e5a266213aa23846047dd
    source_path: channels/telegram.md
    workflow: 16
---

bot の DM とグループで grammY 経由で本番利用可能です。デフォルトモードはロングポーリングで、webhook モードは任意です。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    Telegram のデフォルト DM ポリシーはペアリングです。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復プレイブック。
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャンネル設定パターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="Create the bot token in BotFather">
    Telegram を開き、**@BotFather** とチャットします（ハンドルが正確に `@BotFather` であることを確認してください）。

    `/newbot` を実行し、プロンプトに従って、トークンを保存します。

  </Step>

  <Step title="Configure token and DM policy">

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

    環境変数フォールバック: `TELEGRAM_BOT_TOKEN=...`（デフォルトアカウントのみ）。
    Telegram は `openclaw channels login telegram` を使用**しません**。config/env でトークンを設定してから、gateway を起動してください。

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    ペアリングコードは 1 時間後に期限切れになります。

  </Step>

  <Step title="Add the bot to a group">
    bot をグループに追加してから、アクセスモデルに合わせて `channels.telegram.groups` と `groupPolicy` を設定します。
  </Step>
</Steps>

<Note>
トークンの解決順序はアカウント対応です。実際には、config 値が環境変数フォールバックより優先され、`TELEGRAM_BOT_TOKEN` はデフォルトアカウントにのみ適用されます。
</Note>

## Telegram 側の設定

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Telegram bot はデフォルトで **Privacy Mode** になっており、受信するグループメッセージが制限されます。

    bot がすべてのグループメッセージを確認する必要がある場合は、次のいずれかを行います。

    - `/setprivacy` でプライバシーモードを無効にする、または
    - bot をグループ管理者にする。

    プライバシーモードを切り替えるときは、Telegram が変更を適用できるように、各グループで bot を削除してから再追加してください。

  </Accordion>

  <Accordion title="Group permissions">
    管理者ステータスは Telegram グループ設定で制御されます。

    管理者 bot はすべてのグループメッセージを受信するため、常時有効なグループ動作に有用です。

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - グループ追加を許可/拒否するには `/setjoingroups`
    - グループ可視性の動作には `/setprivacy`

  </Accordion>
</AccordionGroup>

## アクセス制御とアクティベーション

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` はダイレクトメッセージアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom` に少なくとも 1 つの送信者 ID が必要）
    - `open`（`allowFrom` に `"*"` を含める必要あり）
    - `disabled`

    `dmPolicy: "open"` と `allowFrom: ["*"]` の組み合わせでは、bot のユーザー名を見つけた、または推測した任意の Telegram アカウントが bot にコマンドを送れるようになります。厳密に制限されたツールを持つ、意図的に公開された bot にのみ使用してください。単一所有者の bot では、数値ユーザー ID を指定した `allowlist` を使用してください。

    `channels.telegram.allowFrom` は数値の Telegram ユーザー ID を受け付けます。`telegram:` / `tg:` プレフィックスは受け付けられ、正規化されます。
    複数アカウント構成では、制限的なトップレベルの `channels.telegram.allowFrom` は安全境界として扱われます。アカウントレベルの `allowFrom: ["*"]` エントリがあっても、マージ後の有効なアカウント許可リストに明示的なワイルドカードが残っていない限り、そのアカウントは公開されません。
    空の `allowFrom` と `dmPolicy: "allowlist"` の組み合わせはすべての DM をブロックし、config 検証で拒否されます。
    セットアップでは数値ユーザー ID のみを求めます。
    アップグレード後の config に `@username` 許可リストエントリが含まれている場合は、`openclaw doctor --fix` を実行して解決してください（ベストエフォート。Telegram bot トークンが必要です）。
    以前にペアリングストアの許可リストファイルに依存していた場合、`openclaw doctor --fix` は allowlist フローでエントリを `channels.telegram.allowFrom` に復元できます（たとえば `dmPolicy: "allowlist"` にまだ明示的な ID がない場合）。

    単一所有者の bot では、以前のペアリング承認に依存する代わりに、明示的な数値 `allowFrom` ID と `dmPolicy: "allowlist"` を使い、アクセスポリシーを config 内で永続化することを推奨します。

    よくある混同: DM ペアリング承認は「この送信者があらゆる場所で認可されている」という意味ではありません。
    ペアリングは DM アクセスを付与します。コマンド所有者がまだ存在しない場合、最初に承認されたペアリングは `commands.ownerAllowFrom` も設定し、所有者専用コマンドと exec 承認に明示的な操作アカウントを持たせます。
    グループ送信者認可は、引き続き明示的な config 許可リストから取得されます。
    「一度認可されれば DM とグループコマンドの両方が動く」ようにしたい場合は、数値の Telegram ユーザー ID を `channels.telegram.allowFrom` に入れてください。所有者専用コマンドについては、`commands.ownerAllowFrom` に `telegram:<your user id>` が含まれていることを確認してください。

    ### Telegram ユーザー ID を見つける

    より安全な方法（サードパーティ bot なし）:

    1. 自分の bot に DM します。
    2. `openclaw logs --follow` を実行します。
    3. `from.id` を読み取ります。

    公式 Bot API メソッド:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティの方法（プライバシーは低め）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="Group policy and allowlists">
    2 つの制御が一緒に適用されます。

    1. **許可されるグループ**（`channels.telegram.groups`）
       - `groups` config なし:
         - `groupPolicy: "open"` の場合: どのグループでもグループ ID チェックを通過できます
         - `groupPolicy: "allowlist"`（デフォルト）の場合: `groups` エントリ（または `"*"`）を追加するまでグループはブロックされます
       - `groups` が設定済み: 許可リストとして動作します（明示的な ID または `"*"`）

    2. **グループ内で許可される送信者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（デフォルト）
       - `disabled`

    `groupAllowFrom` はグループ送信者フィルタリングに使用されます。未設定の場合、Telegram は `allowFrom` にフォールバックします。
    `groupAllowFrom` エントリは数値の Telegram ユーザー ID にする必要があります（`telegram:` / `tg:` プレフィックスは正規化されます）。
    Telegram グループまたはスーパーグループのチャット ID を `groupAllowFrom` に入れないでください。負のチャット ID は `channels.telegram.groups` の下に属します。
    数値でないエントリは送信者認可では無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ送信者認証は DM ペアリングストア承認を**継承しません**。
    ペアリングは DM 専用のままです。グループには `groupAllowFrom` またはグループ別/トピック別の `allowFrom` を設定してください。
    `groupAllowFrom` が未設定の場合、Telegram はペアリングストアではなく config の `allowFrom` にフォールバックします。
    単一所有者 bot の実用的なパターン: ユーザー ID を `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のまま、対象グループを `channels.telegram.groups` の下で許可します。
    ランタイム注記: `channels.telegram` が完全に存在しない場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、ランタイムはフェイルクローズの `groupPolicy="allowlist"` をデフォルトにします。

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
      よくある間違い: `groupAllowFrom` は Telegram グループ許可リストではありません。

      - `-1001234567890` のような負の Telegram グループまたはスーパーグループのチャット ID は `channels.telegram.groups` の下に入れます。
      - 許可されたグループ内でどの人が bot をトリガーできるかを制限したい場合は、`8734062810` のような Telegram ユーザー ID を `groupAllowFrom` の下に入れます。
      - 許可されたグループの任意のメンバーが bot に話しかけられるようにしたい場合にのみ、`groupAllowFrom: ["*"]` を使用します。

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    グループ返信ではデフォルトでメンションが必要です。

    メンションは次の場所から取得できます。

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
    - または Bot API `getUpdates` を調べる

  </Tab>
</Tabs>

## ランタイム動作

- Telegram は gateway プロセスによって所有されます。
- ルーティングは決定的です。Telegram の受信メッセージには Telegram へ返信します（モデルがチャンネルを選ぶことはありません）。
- 受信メッセージは、返信メタデータとメディアプレースホルダーを含む共有チャンネルエンベロープに正規化されます。
- グループセッションはグループ ID で分離されます。フォーラムトピックではトピックを分離するために `:topic:<threadId>` が追加されます。
- DM メッセージは `message_thread_id` を運ぶことができます。OpenClaw はスレッド対応セッションキーでそれらをルーティングし、返信用にスレッド ID を保持します。
- ロングポーリングは、チャット別/スレッド別の順序制御付きで grammY runner を使用します。runner sink 全体の並行実行数は `agents.defaults.maxConcurrent` を使用します。
- ロングポーリングは各 gateway プロセス内でガードされるため、一度に 1 つのアクティブな poller のみが bot トークンを使用できます。それでも `getUpdates` 409 競合が表示される場合は、別の OpenClaw gateway、スクリプト、または外部 poller が同じトークンを使用している可能性があります。
- ロングポーリングウォッチドッグの再起動は、デフォルトでは完了した `getUpdates` の liveness が 120 秒間ない場合にトリガーされます。長時間実行中の作業中に誤った polling-stall 再起動がまだ発生するデプロイでのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。値はミリ秒単位で、`30000` から `600000` まで許可されます。アカウント別のオーバーライドにも対応しています。
- Telegram Bot API には既読通知サポートがありません（`sendReadReceipts` は適用されません）。

## 機能リファレンス

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw は部分返信をリアルタイムでストリーミングできます。

    - 直接チャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming` は `off | partial | block | progress` です（デフォルト: `partial`）
    - `progress` は Telegram 上では `partial` にマップされます（チャンネル横断の命名との互換性）
    - `streaming.preview.toolProgress` は、ツール/進捗更新が同じ編集済みプレビューメッセージを再利用するかどうかを制御します（デフォルト: プレビューストリーミングが有効な場合は `true`）
    - レガシーの `channels.telegram.streamMode` と boolean の `streaming` 値は検出されます。`openclaw doctor --fix` を実行して `channels.telegram.streaming.mode` に移行してください

    ツール進捗プレビュー更新は、コマンド実行、ファイル読み取り、計画更新、パッチ要約など、ツール実行中に表示される短い「作業中...」行です。Telegram では、`v2026.4.22` 以降でリリースされた OpenClaw の動作に合わせるため、これらはデフォルトで有効です。回答テキストの編集済みプレビューは維持しつつ、ツール進捗行を非表示にするには、次のように設定します。

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

    最終結果のみの配信にしたい場合にのみ `streaming.mode: "off"` を使用してください。Telegram プレビュー編集は無効になり、汎用的なツール/進捗の雑多な出力は、単独の「作業中...」メッセージとして送信される代わりに抑制されます。承認プロンプト、メディアペイロード、エラーは通常の最終配信経路を通ります。ツール進捗ステータス行を非表示にしつつ、回答プレビュー編集だけを維持したい場合は `streaming.preview.toolProgress: false` を使用してください。

    テキストのみの返信の場合:

    - 短いDM/グループ/トピックのプレビュー: OpenClawは同じプレビューメッセージを維持し、最後にその場で最終編集を行います
    - 約1分より古いプレビュー: OpenClawは完了した返信を新しい最終メッセージとして送信してからプレビューをクリーンアップするため、Telegramの表示タイムスタンプはプレビュー作成時刻ではなく完了時刻を反映します

    複雑な返信（たとえばメディアペイロード）の場合、OpenClawは通常の最終配信にフォールバックし、その後プレビューメッセージをクリーンアップします。

    プレビューストリーミングはブロックストリーミングとは別です。Telegramでブロックストリーミングが明示的に有効になっている場合、OpenClawは二重ストリーミングを避けるためプレビューストリームをスキップします。

    Telegram専用の推論ストリーム:

    - `/reasoning stream` は生成中にライブプレビューへ推論を送信します
    - 最終回答は推論テキストなしで送信されます

  </Accordion>

  <Accordion title="書式設定とHTMLフォールバック">
    送信テキストはTelegram `parse_mode: "HTML"` を使用します。

    - Markdown風のテキストはTelegramで安全なHTMLにレンダリングされます。
    - 生のモデルHTMLは、Telegramの解析失敗を減らすためにエスケープされます。
    - Telegramが解析済みHTMLを拒否した場合、OpenClawはプレーンテキストとして再試行します。

    リンクプレビューはデフォルトで有効で、`channels.telegram.linkPreview: false` で無効にできます。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegramコマンドメニューの登録は、起動時に `setMyCommands` で処理されます。

    ネイティブコマンドのデフォルト:

    - `commands.native: "auto"` はTelegramのネイティブコマンドを有効にします

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

    - カスタムコマンドはメニュー項目のみです。動作を自動実装しません
    - Plugin/skillコマンドは、Telegramメニューに表示されていなくても入力すれば動作できます

    ネイティブコマンドが無効な場合、組み込みは削除されます。設定されていれば、カスタム/Pluginコマンドは引き続き登録されることがあります。

    よくあるセットアップ失敗:

    - `BOT_COMMANDS_TOO_MUCH` を伴う `setMyCommands failed` は、トリミング後もTelegramメニューがまだ上限を超えたことを意味します。Plugin/skill/カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効にしてください。
    - 直接のBot API curlコマンドは動作するのに、`deleteWebhook`、`deleteMyCommands`、または `setMyCommands` が `404: Not Found` で失敗する場合、`channels.telegram.apiRoot` が完全な `/bot<TOKEN>` エンドポイントに設定されている可能性があります。`apiRoot` はBot APIルートのみである必要があり、`openclaw doctor --fix` は誤って末尾に付いた `/bot<TOKEN>` を削除します。
    - `getMe returned 401` は、Telegramが設定済みのボットトークンを拒否したことを意味します。現在のBotFatherトークンで `botToken`、`tokenFile`、または `TELEGRAM_BOT_TOKEN` を更新してください。OpenClawはポーリング前に停止するため、これはWebhookクリーンアップ失敗として報告されません。
    - ネットワーク/fetchエラーを伴う `setMyCommands failed` は通常、`api.telegram.org` への送信DNS/HTTPSがブロックされていることを意味します。

    ### デバイスペアリングコマンド（`device-pair` Plugin）

    `device-pair` Pluginがインストールされている場合:

    1. `/pair` はセットアップコードを生成します
    2. iOSアプリにコードを貼り付けます
    3. `/pair pending` は保留中のリクエスト（role/scopesを含む）を一覧表示します
    4. リクエストを承認します:
       - 明示的に承認する場合は `/pair approve <requestId>`
       - 保留中のリクエストが1件だけの場合は `/pair approve`
       - 最新を承認する場合は `/pair approve latest`

    セットアップコードには短命のブートストラップトークンが含まれます。組み込みのブートストラップ引き渡しは、プライマリノードトークンを `scopes: []` のままにします。引き渡されたオペレータートークンはすべて、`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` に制限されます。ブートストラップのスコープチェックにはロール接頭辞が付くため、そのオペレーター許可リストはオペレーターリクエストのみを満たします。非オペレーターロールは、引き続き自身のロール接頭辞配下のスコープが必要です。

    デバイスが変更された認証詳細（たとえばrole/scopes/public key）で再試行した場合、以前の保留リクエストは置き換えられ、新しいリクエストは別の `requestId` を使用します。承認前に `/pair pending` を再実行してください。

    詳細: [ペアリング](/ja-JP/channels/pairing#pair-via-telegram-recommended-for-ios)。

  </Accordion>

  <Accordion title="インラインボタン">
    インラインキーボードのスコープを設定します:

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

    アカウントごとの上書き:

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

    従来の `capabilities: ["inlineButtons"]` は `inlineButtons: "all"` にマップされます。

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

  <Accordion title="エージェントと自動化向けのTelegramメッセージアクション">
    Telegramツールアクションには次が含まれます:

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

    注: `edit` と `topic-create` は現在デフォルトで有効で、個別の `channels.telegram.actions.*` トグルはありません。
    ランタイム送信はアクティブな設定/シークレットのスナップショット（起動/リロード）を使用するため、アクションパスは送信ごとにアドホックなSecretRef再解決を行いません。

    リアクション削除セマンティクス: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="返信スレッドタグ">
    Telegramは、生成された出力内の明示的な返信スレッドタグをサポートします:

    - `[[reply_to_current]]` はトリガーしたメッセージに返信します
    - `[[reply_to:<id>]]` は特定のTelegramメッセージIDに返信します

    `channels.telegram.replyToMode` は処理を制御します:

    - `off`（デフォルト）
    - `first`
    - `all`

    返信スレッドが有効で、元のTelegramテキストまたはキャプションが利用できる場合、OpenClawはネイティブTelegram引用の抜粋を自動的に含めます。Telegramはネイティブ引用テキストを1024 UTF-16コード単位に制限しているため、長いメッセージは先頭から引用され、Telegramが引用を拒否した場合はプレーン返信にフォールバックします。

    注: `off` は暗黙的な返信スレッドを無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッドの動作">
    フォーラムスーパーグループ:

    - トピックセッションキーは `:topic:<threadId>` を追加します
    - 返信と入力中表示はトピックスレッドを対象にします
    - トピック設定パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般トピック（`threadId=1`）の特殊ケース:

    - メッセージ送信では `message_thread_id` を省略します（Telegramは `sendMessage(...thread_id=1)` を拒否します）
    - 入力中アクションでは引き続き `message_thread_id` を含めます

    トピック継承: トピック項目は、上書きされない限りグループ設定（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）を継承します。
    `agentId` はトピック専用で、グループのデフォルトから継承されません。

    **トピックごとのエージェントルーティング**: 各トピックは、トピック設定で `agentId` を設定することで別のエージェントにルーティングできます。これにより、各トピックは独自に分離されたワークスペース、メモリ、セッションを持ちます。例:

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

    **永続的なACPトピックバインディング**: フォーラムトピックは、トップレベルの型付きACPバインディング（`type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`、および `-1001234567890:topic:42` のようなトピック修飾IDを持つ `bindings[]`）を通じてACPハーネスセッションを固定できます。現在はグループ/スーパーグループ内のフォーラムトピックに限定されています。[ACPエージェント](/ja-JP/tools/acp-agents)を参照してください。

    **チャットからのスレッドバインドACPスポーン**: `/acp spawn <agent> --thread here|auto` は現在のトピックを新しいACPセッションにバインドします。以降のやり取りはそこに直接ルーティングされます。OpenClawはスポーン確認をトピック内に固定します。`channels.telegram.threadBindings.spawnAcpSessions=true` が必要です。

    テンプレートコンテキストは `MessageThreadId` と `IsForum` を公開します。`message_thread_id` を持つDMチャットはDMルーティングを維持しますが、スレッド対応のセッションキーを使用します。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegramはボイスメモと音声ファイルを区別します。

    - デフォルト: 音声ファイルの動作
    - エージェント返信内のタグ `[[audio_as_voice]]` はボイスメモ送信を強制します
    - 受信ボイスメモの文字起こしは、エージェントコンテキスト内で機械生成の信頼されないテキストとして枠付けされます。メンション検出は引き続き生の文字起こしを使用するため、メンションでゲートされたボイスメッセージは引き続き動作します。

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

    Telegramは動画ファイルと動画メモを区別します。

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

    動画メモはキャプションをサポートしません。提供されたメッセージテキストは別に送信されます。

    ### ステッカー

    受信ステッカーの処理:

    - 静的WEBP: ダウンロードして処理されます（プレースホルダー `<media:sticker>`）
    - アニメーションTGS: スキップされます
    - 動画WEBM: スキップされます

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

    ステッカー送信アクション:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    キャッシュ済みステッカーを検索します:

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
    Telegramリアクションは `message_reaction` 更新として届きます（メッセージペイロードとは別です）。

    有効な場合、OpenClawは次のようなシステムイベントをキューに入れます:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定:

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    注記:

    - `own` は、bot が送信したメッセージに対するユーザーのリアクションのみを意味します（送信済みメッセージキャッシュによるベストエフォート）。
    - リアクションイベントも Telegram のアクセス制御（`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`）に従います。未承認の送信者は破棄されます。
    - Telegram はリアクション更新でスレッド ID を提供しません。
      - 非フォーラムグループはグループチャットセッションへルーティングされます
      - フォーラムグループは、正確な発信元トピックではなく、グループの一般トピックセッション（`:topic:1`）へルーティングされます

    ポーリング/Webhook の `allowed_updates` には `message_reaction` が自動的に含まれます。

  </Accordion>

  <Accordion title="確認リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間に確認用の絵文字を送信します。

    解決順序:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェント ID の絵文字フォールバック（`agents.list[].identity.emoji`、なければ "👀"）

    注記:

    - Telegram は Unicode 絵文字（例: "👀"）を想定しています。
    - チャンネルまたはアカウントでリアクションを無効化するには `""` を使用します。

  </Accordion>

  <Accordion title="Telegram イベントとコマンドからの設定書き込み">
    チャンネル設定の書き込みはデフォルトで有効です（`configWrites !== false`）。

    Telegram によってトリガーされる書き込みには次が含まれます:

    - `channels.telegram.groups` を更新するグループ移行イベント（`migrate_to_chat_id`）
    - `/config set` と `/config unset`（コマンドの有効化が必要）

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
    デフォルトはロングポーリングです。Webhook モードでは `channels.telegram.webhookUrl` と `channels.telegram.webhookSecret` を設定します。任意で `webhookPath`, `webhookHost`, `webhookPort` も設定できます（デフォルトは `/telegram-webhook`, `127.0.0.1`, `8787`）。

    ローカルリスナーは `127.0.0.1:8787` にバインドします。公開 ingress には、ローカルポートの前にリバースプロキシを置くか、意図的に `webhookHost: "0.0.0.0"` を設定します。

    Webhook モードは、Telegram に `200` を返す前に、リクエストガード、Telegram シークレットトークン、JSON 本文を検証します。
    その後 OpenClaw は、ロングポーリングで使われるものと同じチャット単位/トピック単位の bot レーンを通じて更新を非同期に処理するため、遅いエージェントターンが Telegram の配信 ACK を保持しません。

  </Accordion>

  <Accordion title="制限、リトライ、CLI ターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは 4000 です。
    - `channels.telegram.chunkMode="newline"` は、長さによる分割の前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト 100）は、受信および送信 Telegram メディアサイズを制限します。
    - `channels.telegram.timeoutSeconds` は Telegram API クライアントのタイムアウトを上書きします（未設定の場合は grammY のデフォルトが適用されます）。ロングポーリングの bot クライアントは、アイドル時のポーリングが 30 秒のポーリングウィンドウ完了前に中断されないように、設定値が 45 秒の `getUpdates` リクエストガードを下回る場合にクランプします。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは `120000` です。ポーリング停止の誤検知による再起動に限り、`30000` から `600000` の間で調整してください。
    - グループコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit`（デフォルト 50）を使用します。`0` は無効化します。
    - 返信/引用/転送の補足コンテキストは、現時点では受信したまま渡されます。
    - Telegram 許可リストは主に、誰がエージェントをトリガーできるかを制御するものであり、完全な補足コンテキスト墨消し境界ではありません。
    - DM 履歴コントロール:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定は、回復可能な送信 API エラーに対して Telegram 送信ヘルパー（CLI/ツール/アクション）に適用されます。受信メッセージへの最終返信配信も、Telegram 接続前の失敗には範囲を限定した安全送信リトライを使用しますが、表示メッセージが重複する可能性のある送信後の曖昧なネットワークエンベロープはリトライしません。

    CLI 送信ターゲットには数値チャット ID またはユーザー名を使用できます:

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
    - フォーラムトピック用の `--thread-id`（または `:topic:` ターゲットを使用）

    Telegram 送信は次もサポートします:

    - `channels.telegram.capabilities.inlineButtons` が許可している場合、インラインキーボード用の `buttons` ブロックを含む `--presentation`
    - bot がそのチャットでピン留めできる場合、ピン留め配信を要求する `--pin` または `--delivery '{"pin":true}'`
    - 送信画像と GIF を圧縮写真またはアニメーションメディアアップロードではなくドキュメントとして送信する `--force-document`

    アクション制御:

    - `channels.telegram.actions.sendMessage=false` は、ポーリングを含む Telegram 送信メッセージを無効化します
    - `channels.telegram.actions.poll=false` は、通常の送信を有効のままにして Telegram ポーリング作成を無効化します

  </Accordion>

  <Accordion title="Telegram での exec 承認">
    Telegram は承認者 DM で exec 承認をサポートし、任意で発信元チャットまたはトピックにプロンプトを投稿できます。承認者は数値の Telegram ユーザー ID である必要があります。

    設定パス:

    - `channels.telegram.execApprovals.enabled`（少なくとも 1 人の承認者を解決できる場合に自動有効化）
    - `channels.telegram.execApprovals.approvers`（`commands.ownerAllowFrom` の数値オーナー ID にフォールバック）
    - `channels.telegram.execApprovals.target`: `dm`（デフォルト） | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom`, `defaultTo` は、誰が bot と会話できるか、通常の返信をどこへ送るかを制御します。これらによって誰かが exec 承認者になるわけではありません。コマンドオーナーがまだ存在しない場合、最初に承認された DM ペアリングが `commands.ownerAllowFrom` をブートストラップするため、1 オーナー構成でも `execApprovals.approvers` の下で ID を重複させずに機能します。

    チャンネル配信ではチャット内にコマンドテキストが表示されます。`channel` または `both` は、信頼されたグループ/トピックでのみ有効化してください。プロンプトがフォーラムトピックに届く場合、OpenClaw は承認プロンプトと後続メッセージでトピックを保持します。exec 承認はデフォルトで 30 分後に期限切れになります。

    インライン承認ボタンも、ターゲットサーフェス（`dm`, `group`, `all`）を許可する `channels.telegram.capabilities.inlineButtons` を必要とします。`plugin:` で始まる承認 ID はプラグイン承認を通じて解決され、それ以外はまず exec 承認を通じて解決されます。

    [exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## エラー返信コントロール

エージェントで配信エラーまたはプロバイダーエラーが発生した場合、Telegram はエラーテキストで返信するか、それを抑制できます。この動作は 2 つの設定キーで制御します:

| キー                                | 値                | デフォルト | 説明                                                                                           |
| ----------------------------------- | ----------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` はチャットに親しみやすいエラーメッセージを送信します。`silent` はエラー返信を完全に抑制します。 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`    | 同じチャットへのエラー返信間の最小時間です。障害中のエラースパムを防ぎます。                   |

アカウント単位、グループ単位、トピック単位の上書きがサポートされています（他の Telegram 設定キーと同じ継承）。

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
  <Accordion title="bot がメンションのないグループメッセージに応答しない">

    - `requireMention=false` の場合、Telegram プライバシーモードで完全な可視性を許可する必要があります。
      - BotFather: `/setprivacy` -> Disable
      - その後 bot をグループから削除して再追加します
    - `openclaw channels status` は、設定がメンションのないグループメッセージを想定している場合に警告します。
    - `openclaw channels status --probe` は明示的な数値グループ ID を確認できます。ワイルドカード `"*"` はメンバーシップをプローブできません。
    - クイックセッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="bot がグループメッセージをまったく認識しない">

    - `channels.telegram.groups` が存在する場合、グループがリストされている必要があります（または `"*"` を含めます）
    - グループ内の bot メンバーシップを確認します
    - スキップ理由についてログを確認します: `openclaw logs --follow`

  </Accordion>

  <Accordion title="コマンドが部分的にしか機能しない、またはまったく機能しない">

    - 送信者 ID を承認します（ペアリングおよび/または数値の `allowFrom`）
    - グループポリシーが `open` の場合でも、コマンド承認は適用されます
    - `BOT_COMMANDS_TOO_MUCH` を伴う `setMyCommands failed` は、ネイティブメニューのエントリが多すぎることを意味します。プラグイン/スキル/カスタムコマンドを減らすか、ネイティブメニューを無効化してください
    - `deleteMyCommands` / `setMyCommands` の起動時呼び出しは制限され、リクエストタイムアウト時に Telegram のトランスポートフォールバックを通じて 1 回リトライされます。永続的なネットワーク/fetch エラーは通常、`api.telegram.org` への DNS/HTTPS 到達性の問題を示します

  </Accordion>

  <Accordion title="起動時に未承認トークンが報告される">

    - `getMe returned 401` は、設定された bot トークンに対する Telegram 認証失敗です。
    - BotFather で bot トークンを再コピーまたは再生成し、その後デフォルトアカウント用に `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken`, または `TELEGRAM_BOT_TOKEN` を更新します。
    - 起動中の `deleteWebhook 401 Unauthorized` も認証失敗です。これを「Webhook が存在しない」と扱うと、同じ不正トークンの失敗を後続の API 呼び出しまで先送りするだけです。
    - ポーリング起動中に `deleteWebhook` が一時的なネットワークエラーで失敗した場合、OpenClaw は `getWebhookInfo` を確認します。Telegram が空の Webhook URL を報告すると、クリーンアップはすでに満たされているためポーリングは続行されます。

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定性">

    - Node 22+ + カスタム fetch/proxy は、AbortSignal の型が一致しない場合に即時 abort 動作を引き起こすことがあります。
    - 一部のホストは `api.telegram.org` を先に IPv6 へ解決します。IPv6 の外向き通信が壊れていると、Telegram API が断続的に失敗することがあります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれる場合、OpenClaw はこれらを復旧可能なネットワークエラーとして再試行するようになりました。
    - Telegram ソケットが短い固定間隔で再利用される場合は、`channels.telegram.timeoutSeconds` が低くないか確認してください。long-polling bot クライアントは `getUpdates` リクエストガードより低い設定値をクランプしますが、古いリリースではこれが long-poll タイムアウトより低く設定されていると、poll ごとに abort することがありました。
    - ログに `Polling stall detected` が含まれる場合、OpenClaw はデフォルトで、完了した long-poll の liveness が 120 秒間ないと polling を再起動し、Telegram トランスポートを再構築します。
    - `openclaw channels status --probe` と `openclaw doctor` は、実行中の polling アカウントが起動時の猶予期間後に `getUpdates` を完了していない場合、実行中の webhook アカウントが起動時の猶予期間後に `setWebhook` を完了していない場合、または最後に成功した polling トランスポートアクティビティが古い場合に警告します。
    - 長時間実行される `getUpdates` 呼び出しが正常なのにホストが誤った polling-stall 再起動を報告する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。永続的な stall は通常、ホストと `api.telegram.org` の間のプロキシ、DNS、IPv6、または TLS の外向き通信の問題を示します。
    - Telegram は Bot API トランスポートについて、`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` とそれらの小文字バリアントを含むプロセスのプロキシ環境変数も尊重します。`NO_PROXY` / `no_proxy` は引き続き `api.telegram.org` をバイパスできます。
    - サービス環境で OpenClaw 管理プロキシが `OPENCLAW_PROXY_URL` を通じて設定されていて、標準のプロキシ環境変数が存在しない場合、Telegram も Bot API トランスポートにその URL を使用します。
    - 直接の外向き通信/TLS が不安定な VPS ホストでは、Telegram API 呼び出しを `channels.telegram.proxy` 経由でルーティングします。

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ はデフォルトで `autoSelectFamily=true`（WSL2 を除く）および `dnsResultOrder=ipv4first` です。
    - ホストが WSL2 の場合、または IPv4 のみの動作のほうが明示的にうまく機能する場合は、family 選択を強制します。

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 ベンチマーク範囲の回答（`198.18.0.0/15`）は、デフォルトで Telegram メディアダウンロードに対してすでに許可されています。信頼済みの fake-IP または透過プロキシが、メディアダウンロード中に `api.telegram.org` を他のプライベート/内部/特殊用途アドレスへ書き換える場合は、Telegram 専用バイパスにオプトインできます。

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じオプトインはアカウントごとに
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` でも利用できます。
    - プロキシが Telegram メディアホストを `198.18.x.x` に解決する場合は、まず危険なフラグをオフのままにしてください。Telegram メディアはデフォルトで RFC 2544 ベンチマーク範囲をすでに許可しています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` は Telegram
      メディアの SSRF 保護を弱めます。Clash、Mihomo、Surge の fake-IP ルーティングのように、RFC 2544 ベンチマーク範囲外のプライベートまたは特殊用途の回答を合成する、信頼済みのオペレーター管理プロキシ環境でのみ使用してください。通常の公開インターネット経由の Telegram アクセスではオフのままにしてください。
    </Warning>

    - 環境オーバーライド（一時的）:
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS の回答を検証します。

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

詳しいヘルプ: [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

## 設定リファレンス

主要リファレンス: [設定リファレンス - Telegram](/ja-JP/gateway/config-channels#telegram)。

<Accordion title="高シグナルな Telegram フィールド">

- 起動/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*`（`tokenFile` は通常ファイルを指している必要があります。symlink は拒否されます）
- アクセス制御: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, トップレベル `bindings[]`（`type: "acp"`）
- exec 承認: `execApprovals`, `accounts.*.execApprovals`
- コマンド/メニュー: `commands.native`, `commands.nativeSkills`, `customCommands`
- スレッド/返信: `replyToMode`
- ストリーミング: `streaming`（プレビュー）, `streaming.preview.toolProgress`, `blockStreaming`
- フォーマット/配信: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- メディア/ネットワーク: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- カスタム API ルート: `apiRoot`（Bot API ルートのみ。`/bot<TOKEN>` は含めないでください）
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- アクション/機能: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- リアクション: `reactionNotifications`, `reactionLevel`
- エラー: `errorPolicy`, `errorCooldownMs`
- 書き込み/履歴: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
複数アカウントの優先順位: 2 つ以上のアカウント ID が設定されている場合は、`channels.telegram.defaultAccount` を設定する（または `channels.telegram.accounts.default` を含める）ことで、デフォルトルーティングを明示してください。そうしない場合、OpenClaw は最初に正規化されたアカウント ID にフォールバックし、`openclaw doctor` が警告します。名前付きアカウントは `channels.telegram.allowFrom` / `groupAllowFrom` を継承しますが、`accounts.default.*` の値は継承しません。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram ユーザーを Gateway にペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループとトピックの allowlist 動作。
  </Card>
  <Card title="チャネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントへルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと強化。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    グループとトピックをエージェントにマッピングします。
  </Card>
  <Card title="トラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断。
  </Card>
</CardGroup>
