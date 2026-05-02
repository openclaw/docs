---
read_when:
    - Telegram の機能または Webhook に取り組む
summary: Telegram ボットのサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-05-02T04:49:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6ef6fc51d18f4bde9219b75b69da204e18a227b40c4c916eae701494c099de3
    source_path: channels/telegram.md
    workflow: 16
---

grammY により、ボットの DM とグループで本番利用できます。デフォルトのモードはロングポーリングです。Webhook モードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram のデフォルト DM ポリシーはペアリングです。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断と修復プレイブックです。
  </Card>
  <Card title="Gateway 設定" icon="settings" href="/ja-JP/gateway/configuration">
    チャネル設定パターンと例の全体です。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="BotFather でボットトークンを作成する">
    Telegram を開いて **@BotFather** とチャットします（ハンドルが正確に `@BotFather` であることを確認してください）。

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

    環境変数フォールバック: `TELEGRAM_BOT_TOKEN=...`（デフォルトアカウントのみ）。
    Telegram は `openclaw channels login telegram` を使用しません。config/env でトークンを設定してから、Gateway を起動してください。

  </Step>

  <Step title="Gateway を起動して最初の DM を承認する">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    ペアリングコードは 1 時間後に期限切れになります。

  </Step>

  <Step title="ボットをグループに追加する">
    ボットをグループに追加し、その後アクセスモデルに合わせて `channels.telegram.groups` と `groupPolicy` を設定します。
  </Step>
</Steps>

<Note>
トークンの解決順序はアカウントを認識します。実際には、config 値が環境変数フォールバックより優先され、`TELEGRAM_BOT_TOKEN` はデフォルトアカウントにのみ適用されます。
</Note>

## Telegram 側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループの可視性">
    Telegram ボットはデフォルトで **プライバシーモード** になっており、受信できるグループメッセージが制限されます。

    ボットがすべてのグループメッセージを見る必要がある場合は、次のいずれかを行います。

    - `/setprivacy` でプライバシーモードを無効にする、または
    - ボットをグループ管理者にする。

    プライバシーモードを切り替える場合は、Telegram が変更を適用するように、各グループでボットを削除してから再追加してください。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスは Telegram グループ設定で制御されます。

    管理者ボットはすべてのグループメッセージを受信します。これは、常時稼働のグループ動作に便利です。

  </Accordion>

  <Accordion title="便利な BotFather 切り替え">

    - `/setjoingroups`: グループ追加を許可/拒否する
    - `/setprivacy`: グループの可視性動作を設定する

  </Accordion>
</AccordionGroup>

## アクセス制御と有効化

<Tabs>
  <Tab title="DM ポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom` に少なくとも 1 つの送信者 ID が必要）
    - `open`（`allowFrom` に `"*"` を含める必要あり）
    - `disabled`

    `allowFrom: ["*"]` とともに `dmPolicy: "open"` を設定すると、ボットのユーザー名を見つけたり推測したりした任意の Telegram アカウントがボットにコマンドを送れるようになります。厳しく制限されたツールを持つ意図的に公開されたボットにのみ使用してください。所有者が 1 人のボットでは、数値ユーザー ID を指定した `allowlist` を使用するべきです。

    `channels.telegram.allowFrom` は数値の Telegram ユーザー ID を受け付けます。`telegram:` / `tg:` 接頭辞は受け付けられ、正規化されます。
    複数アカウント設定では、制限的なトップレベルの `channels.telegram.allowFrom` は安全境界として扱われます。アカウントレベルの `allowFrom: ["*"]` エントリは、マージ後の有効なアカウント許可リストに明示的なワイルドカードがまだ含まれていない限り、そのアカウントを公開状態にはしません。
    空の `allowFrom` を伴う `dmPolicy: "allowlist"` はすべての DM をブロックし、設定検証で拒否されます。
    セットアップでは数値ユーザー ID のみを求めます。
    アップグレード後、設定に `@username` の allowlist エントリが含まれている場合は、`openclaw doctor --fix` を実行して解決してください（ベストエフォート。Telegram ボットトークンが必要です）。
    以前にペアリングストアの allowlist ファイルに依存していた場合、`openclaw doctor --fix` は allowlist フローでエントリを `channels.telegram.allowFrom` に復元できます（たとえば `dmPolicy: "allowlist"` にまだ明示的な ID がない場合）。

    所有者が 1 人のボットでは、以前のペアリング承認に依存するのではなく、明示的な数値 `allowFrom` ID とともに `dmPolicy: "allowlist"` を使用し、アクセスポリシーを設定内で永続化することを推奨します。

    よくある混同: DM ペアリングの承認は「この送信者がどこでも承認されている」ことを意味しません。
    ペアリングは DM アクセスを付与します。コマンド所有者がまだ存在しない場合、最初に承認されたペアリングは `commands.ownerAllowFrom` も設定するため、所有者専用コマンドと exec 承認に明示的なオペレーターアカウントができます。
    グループ送信者の承認は、引き続き明示的な config allowlist から来ます。
    「一度承認すれば DM とグループコマンドの両方が動作する」ようにしたい場合は、自分の数値 Telegram ユーザー ID を `channels.telegram.allowFrom` に入れてください。所有者専用コマンドについては、`commands.ownerAllowFrom` に `telegram:<your user id>` が含まれていることを確認してください。

    ### Telegram ユーザー ID を見つける

    より安全な方法（サードパーティボットなし）:

    1. 自分のボットに DM します。
    2. `openclaw logs --follow` を実行します。
    3. `from.id` を読み取ります。

    公式 Bot API メソッド:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティ方式（プライバシーは低め）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーと allowlist">
    2 つの制御が組み合わせて適用されます。

    1. **許可されるグループ**（`channels.telegram.groups`）
       - `groups` config なし:
         - `groupPolicy: "open"` の場合: 任意のグループがグループ ID チェックを通過可能
         - `groupPolicy: "allowlist"`（デフォルト）の場合: `groups` エントリ（または `"*"`）を追加するまでグループはブロックされる
       - `groups` が設定済み: allowlist として機能（明示的な ID または `"*"`）

    2. **グループ内で許可される送信者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（デフォルト）
       - `disabled`

    `groupAllowFrom` はグループ送信者のフィルタリングに使用されます。未設定の場合、Telegram は `allowFrom` にフォールバックします。
    `groupAllowFrom` エントリは数値の Telegram ユーザー ID にする必要があります（`telegram:` / `tg:` 接頭辞は正規化されます）。
    Telegram グループまたはスーパーグループのチャット ID を `groupAllowFrom` に入れないでください。負のチャット ID は `channels.telegram.groups` の下に置きます。
    数値でないエントリは送信者承認では無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ送信者認証は DM ペアリングストア承認を継承しません。
    ペアリングは DM 専用のままです。グループでは、`groupAllowFrom` またはグループ別/トピック別の `allowFrom` を設定してください。
    `groupAllowFrom` が未設定の場合、Telegram はペアリングストアではなく config の `allowFrom` にフォールバックします。
    所有者が 1 人のボットでの実用的なパターン: 自分のユーザー ID を `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにし、対象グループを `channels.telegram.groups` の下で許可します。
    実行時の注記: `channels.telegram` が完全に存在しない場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、ランタイムは fail-closed の `groupPolicy="allowlist"` をデフォルトにします。

    例: 1 つの特定グループ内の任意のメンバーを許可する:

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
      よくある間違い: `groupAllowFrom` は Telegram グループ allowlist ではありません。

      - `-1001234567890` のような負の Telegram グループまたはスーパーグループのチャット ID は `channels.telegram.groups` の下に置きます。
      - 許可済みグループ内でボットをトリガーできる人を制限したい場合は、`8734062810` のような Telegram ユーザー ID を `groupAllowFrom` の下に置きます。
      - 許可済みグループの任意のメンバーがボットに話しかけられるようにしたい場合にのみ、`groupAllowFrom: ["*"]` を使用します。

    </Warning>

  </Tab>

  <Tab title="メンション動作">
    グループ返信ではデフォルトでメンションが必要です。

    メンションは次から取得できます。

    - ネイティブの `@botusername` メンション、または
    - 次に含まれるメンションパターン:
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

    グループチャット ID を取得する方法:

    - グループメッセージを `@userinfobot` / `@getidsbot` に転送する
    - または `openclaw logs --follow` から `chat.id` を読み取る
    - または Bot API の `getUpdates` を確認する

  </Tab>
</Tabs>

## ランタイム動作

- Telegram は Gateway プロセスによって所有されます。
- ルーティングは決定的です。Telegram の受信には Telegram へ返信します（モデルはチャネルを選びません）。
- 受信メッセージは、返信メタデータとメディアプレースホルダーを持つ共有チャネルエンベロープに正規化されます。
- グループセッションはグループ ID ごとに分離されます。フォーラムトピックでは、トピックを分離するために `:topic:<threadId>` が追加されます。
- DM メッセージには `message_thread_id` を含めることができます。OpenClaw はスレッド対応のセッションキーでそれらをルーティングし、返信用にスレッド ID を保持します。
- ロングポーリングは、チャットごと/スレッドごとの順序制御を備えた grammY runner を使用します。全体の runner sink concurrency は `agents.defaults.maxConcurrent` を使用します。
- ロングポーリングは各 Gateway プロセス内で保護されるため、一度に 1 つのアクティブな poller だけがボットトークンを使用できます。それでも `getUpdates` 409 競合が表示される場合は、別の OpenClaw Gateway、スクリプト、または外部 poller が同じトークンを使用している可能性があります。
- ロングポーリングのウォッチドッグ再起動は、デフォルトでは完了した `getUpdates` の liveness が 120 秒間ない場合にトリガーされます。長時間実行される作業中にデプロイで誤った polling-stall 再起動がまだ発生する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。値はミリ秒単位で、`30000` から `600000` まで許可されます。アカウントごとのオーバーライドもサポートされます。
- Telegram Bot API には既読通知のサポートはありません（`sendReadReceipts` は適用されません）。

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClaw は部分的な返信をリアルタイムでストリーミングできます。

    - ダイレクトチャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming` は `off | partial | block | progress` です（デフォルト: `partial`）
    - Telegram では `progress` は `partial` にマッピングされます（チャネル横断の命名との互換性）
    - `streaming.preview.toolProgress` は、ツール/進行状況の更新が同じ編集済みプレビューメッセージを再利用するかどうかを制御します（デフォルト: プレビューストリーミングが有効な場合は `true`）
    - レガシーの `channels.telegram.streamMode` と boolean の `streaming` 値は検出されます。`openclaw doctor --fix` を実行して `channels.telegram.streaming.mode` に移行してください。

    ツール進行状況のプレビュー更新は、ツール実行中に表示される短い「作業中...」行です。たとえば、コマンド実行、ファイル読み取り、計画更新、パッチ要約などです。Telegram は `v2026.4.22` 以降のリリース済み OpenClaw の動作に合わせるため、これらをデフォルトで有効にしています。回答テキスト用の編集済みプレビューは維持しつつ、ツール進行状況の行を非表示にするには、次のように設定します。

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

    `streaming.mode: "off"` は、最終メッセージのみの配信にしたい場合にだけ使用してください。Telegram プレビュー編集は無効になり、汎用のツール/進行状況の通知は単独の「作業中...」メッセージとして送信されるのではなく抑制されます。承認プロンプト、メディアペイロード、エラーは引き続き通常の最終配信を通じてルーティングされます。回答プレビュー編集だけを維持し、ツール進行状況のステータス行を非表示にしたい場合は、`streaming.preview.toolProgress: false` を使用してください。

    テキストのみの返信の場合:

    - 短い DM/グループ/topic プレビュー: OpenClaw は同じプレビューメッセージを保持し、その場で最終編集を行います
    - 約 1 分より古いプレビュー: OpenClaw は完了した返信を新しい最終メッセージとして送信してからプレビューをクリーンアップするため、Telegram の表示タイムスタンプはプレビュー作成時刻ではなく完了時刻を反映します

    複雑な返信（たとえばメディアペイロード）の場合、OpenClaw は通常の最終配信にフォールバックし、その後プレビューメッセージをクリーンアップします。

    プレビューストリーミングはブロックストリーミングとは別です。Telegram でブロックストリーミングが明示的に有効化されている場合、OpenClaw は二重ストリーミングを避けるためにプレビューストリームをスキップします。

    Telegram 専用の推論ストリーム:

    - `/reasoning stream` は生成中にライブプレビューへ推論を送信します
    - 最終回答は推論テキストなしで送信されます

  </Accordion>

  <Accordion title="書式設定と HTML フォールバック">
    送信テキストは Telegram `parse_mode: "HTML"` を使用します。

    - Markdown 風のテキストは Telegram で安全な HTML にレンダリングされます。
    - 生のモデル HTML は、Telegram の解析失敗を減らすためにエスケープされます。
    - Telegram が解析済み HTML を拒否した場合、OpenClaw はプレーンテキストで再試行します。

    リンクプレビューはデフォルトで有効で、`channels.telegram.linkPreview: false` で無効化できます。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegram コマンドメニューの登録は、起動時に `setMyCommands` で処理されます。

    ネイティブコマンドのデフォルト:

    - `commands.native: "auto"` は Telegram のネイティブコマンドを有効にします

    カスタムコマンドのメニュー項目を追加します:

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

    - 名前は正規化されます（先頭の `/` を削除し、小文字化）
    - 有効なパターン: `a-z`、`0-9`、`_`、長さ `1..32`
    - カスタムコマンドはネイティブコマンドを上書きできません
    - 競合/重複はスキップされ、ログに記録されます

    注:

    - カスタムコマンドはメニュー項目のみです。動作を自動実装するものではありません
    - plugin/skill コマンドは Telegram メニューに表示されていなくても、入力すれば引き続き機能します

    ネイティブコマンドが無効な場合、組み込みコマンドは削除されます。設定されていれば、カスタム/plugin コマンドは引き続き登録される場合があります。

    一般的なセットアップ失敗:

    - `setMyCommands failed` と `BOT_COMMANDS_TOO_MUCH` は、トリミング後も Telegram メニューがまだあふれていることを意味します。plugin/skill/カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効化してください。
    - 直接の Bot API curl コマンドは動作するのに、`deleteWebhook`、`deleteMyCommands`、または `setMyCommands` が `404: Not Found` で失敗する場合、`channels.telegram.apiRoot` が完全な `/bot<TOKEN>` エンドポイントに設定されている可能性があります。`apiRoot` は Bot API ルートのみでなければならず、`openclaw doctor --fix` は誤って末尾に付いた `/bot<TOKEN>` を削除します。
    - `getMe returned 401` は、Telegram が設定されたボットトークンを拒否したことを意味します。`botToken`、`tokenFile`、または `TELEGRAM_BOT_TOKEN` を現在の BotFather トークンで更新してください。OpenClaw はポーリング前に停止するため、これは Webhook クリーンアップ失敗としては報告されません。
    - `setMyCommands failed` とネットワーク/fetch エラーは、通常 `api.telegram.org` への送信 DNS/HTTPS がブロックされていることを意味します。

    ### デバイスペアリングコマンド（`device-pair` plugin）

    `device-pair` plugin がインストールされている場合:

    1. `/pair` がセットアップコードを生成します
    2. iOS アプリにコードを貼り付けます
    3. `/pair pending` が保留中のリクエストを一覧表示します（role/scopes を含む）
    4. リクエストを承認します:
       - 明示的な承認には `/pair approve <requestId>`
       - 保留中のリクエストが 1 件だけの場合は `/pair approve`
       - 最新のものには `/pair approve latest`

    セットアップコードには短命のブートストラップトークンが含まれます。組み込みのブートストラップ引き渡しでは、プライマリノードトークンを `scopes: []` に保ちます。引き渡された operator トークンは `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` に制限されたままです。ブートストラップスコープチェックには role プレフィックスが付くため、この operator 許可リストは operator リクエストだけを満たします。非 operator ロールは、引き続きそれぞれの role プレフィックス配下のスコープが必要です。

    デバイスが認証詳細（たとえば role/scopes/公開鍵）を変更して再試行した場合、以前の保留中リクエストは置き換えられ、新しいリクエストは別の `requestId` を使用します。承認前に `/pair pending` を再実行してください。

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

    レガシーの `capabilities: ["inlineButtons"]` は `inlineButtons: "all"` にマップされます。

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

    コールバックのクリックはテキストとして agent に渡されます:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="agent と自動化向けの Telegram メッセージアクション">
    Telegram ツールアクションには以下が含まれます:

    - `sendMessage`（`to`、`content`、任意の `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`、任意の `iconColor`、`iconCustomEmojiId`）

    チャンネルメッセージアクションは、扱いやすいエイリアス（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）を公開します。

    ゲーティング制御:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（デフォルト: 無効）

    注: `edit` と `topic-create` は現在デフォルトで有効で、個別の `channels.telegram.actions.*` トグルはありません。
    ランタイム送信はアクティブな設定/シークレットのスナップショット（起動/リロード）を使用するため、アクションパスは送信ごとにアドホックな SecretRef 再解決を行いません。

    リアクション削除のセマンティクス: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="返信スレッドタグ">
    Telegram は、生成された出力内の明示的な返信スレッドタグをサポートします:

    - `[[reply_to_current]]` はトリガー元メッセージに返信します
    - `[[reply_to:<id>]]` は特定の Telegram メッセージ ID に返信します

    `channels.telegram.replyToMode` が処理を制御します:

    - `off`（デフォルト）
    - `first`
    - `all`

    返信スレッドが有効で、元の Telegram テキストまたはキャプションが利用可能な場合、OpenClaw はネイティブ Telegram 引用抜粋を自動的に含めます。Telegram はネイティブ引用テキストを 1024 UTF-16 コード単位に制限しているため、長いメッセージは先頭から引用され、Telegram が引用を拒否した場合はプレーンな返信にフォールバックします。

    注: `off` は暗黙的な返信スレッドを無効化します。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラム topic とスレッドの動作">
    フォーラムスーパーグループ:

    - topic セッションキーは `:topic:<threadId>` を追加します
    - 返信と入力中表示は topic スレッドを対象にします
    - topic 設定パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    General topic（`threadId=1`）の特殊ケース:

    - メッセージ送信では `message_thread_id` を省略します（Telegram は `sendMessage(...thread_id=1)` を拒否します）
    - 入力中アクションには引き続き `message_thread_id` が含まれます

    topic の継承: topic エントリは、上書きされない限りグループ設定（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）を継承します。
    `agentId` は topic 専用で、グループのデフォルトからは継承しません。

    **topic ごとの agent ルーティング**: 各 topic は、topic 設定で `agentId` を設定することで別の agent にルーティングできます。これにより各 topic は、それぞれ独立したワークスペース、メモリ、セッションを持ちます。例:

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

    その後、各 topic は独自のセッションキーを持ちます: `agent:zu:telegram:group:-1001234567890:topic:3`

    **永続的な ACP topic バインディング**: フォーラム topic は、トップレベルの型付き ACP バインディング（`type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`、および `-1001234567890:topic:42` のような topic 修飾 ID を持つ `bindings[]`）を通じて ACP ハーネスセッションを固定できます。現在はグループ/スーパーグループ内のフォーラム topic にスコープされています。[ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

    **チャットからのスレッド固定 ACP spawn**: `/acp spawn <agent> --thread here|auto` は現在の topic を新しい ACP セッションにバインドします。以後のやり取りはそこへ直接ルーティングされます。OpenClaw は spawn 確認を topic 内に固定します。`channels.telegram.threadBindings.spawnAcpSessions=true` が必要です。

    テンプレートコンテキストは `MessageThreadId` と `IsForum` を公開します。`message_thread_id` を持つ DM チャットは DM ルーティングを維持しますが、スレッド対応のセッションキーを使用します。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegram は音声メモと音声ファイルを区別します。

    - デフォルト: 音声ファイルの動作
    - agent の返信内のタグ `[[audio_as_voice]]` は音声メモ送信を強制します
    - 受信した音声メモの文字起こしは、agent コンテキスト内で機械生成の信頼できないテキストとして枠付けされます。メンション検出は引き続き生の文字起こしを使用するため、メンションゲート付き音声メッセージは動作し続けます。

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

    動画メモはキャプションをサポートしません。指定されたメッセージテキストは別に送信されます。

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

    ステッカーは（可能な場合）一度記述され、繰り返しの vision 呼び出しを減らすためにキャッシュされます。

    ステッカーアクションを有効化します:

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
    Telegram のリアクションは `message_reaction` 更新として届きます（メッセージペイロードとは別です）。

    有効な場合、OpenClaw は次のようなシステムイベントをキューに入れます:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定:

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    注:

    - `own` は、ボットが送信したメッセージへのユーザーのリアクションのみを意味します（送信済みメッセージのキャッシュによるベストエフォート）。
    - リアクションイベントも Telegram のアクセス制御（`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`）に従います。未承認の送信者は破棄されます。
    - Telegram はリアクション更新でスレッド ID を提供しません。
      - 非フォーラムグループはグループチャットセッションにルーティングされます
      - フォーラムグループは、正確な発生元トピックではなく、グループの一般トピックセッション（`:topic:1`）にルーティングされます

    ポーリング/Webhook の `allowed_updates` には `message_reaction` が自動的に含まれます。

  </Accordion>

  <Accordion title="Ack リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間に確認用の絵文字を送信します。

    解決順序:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェントの ID 絵文字へのフォールバック（`agents.list[].identity.emoji`、それ以外は "👀"）

    注:

    - Telegram は Unicode 絵文字（例: "👀"）を想定しています。
    - チャンネルまたはアカウントでリアクションを無効にするには `""` を使います。

  </Accordion>

  <Accordion title="Telegram イベントとコマンドからの設定書き込み">
    チャンネル設定の書き込みは既定で有効です（`configWrites !== false`）。

    Telegram によってトリガーされる書き込みには次が含まれます:

    - `channels.telegram.groups` を更新するためのグループ移行イベント（`migrate_to_chat_id`）
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
    既定はロングポーリングです。Webhook モードでは `channels.telegram.webhookUrl` と `channels.telegram.webhookSecret` を設定します。任意で `webhookPath`, `webhookHost`, `webhookPort` も設定できます（既定は `/telegram-webhook`, `127.0.0.1`, `8787`）。

    ローカルリスナーは `127.0.0.1:8787` にバインドします。公開 ingress では、ローカルポートの前にリバースプロキシを置くか、意図して `webhookHost: "0.0.0.0"` を設定してください。

    Webhook モードは、Telegram に `200` を返す前にリクエストガード、Telegram シークレットトークン、JSON 本文を検証します。
    その後 OpenClaw は、ロングポーリングで使われるものと同じチャットごと/トピックごとのボットレーンを通じて更新を非同期に処理するため、遅いエージェントターンが Telegram の配信 ACK を保持することはありません。

  </Accordion>

  <Accordion title="制限、リトライ、CLI ターゲット">
    - `channels.telegram.textChunkLimit` の既定は 4000 です。
    - `channels.telegram.chunkMode="newline"` は、長さで分割する前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（既定 100）は、Telegram の受信および送信メディアサイズを制限します。
    - `channels.telegram.timeoutSeconds` は Telegram API クライアントのタイムアウトを上書きします（未設定の場合は grammY の既定が適用されます）。ロングポーリングのボットクライアントは、設定値が 45 秒の `getUpdates` リクエストガードを下回る場合に値をクランプし、30 秒のポーリングウィンドウが完了する前にアイドルポーリングが中断されないようにします。
    - `channels.telegram.pollingStallThresholdMs` の既定は `120000` です。ポーリング停止の誤検知による再起動がある場合のみ、`30000` から `600000` の間で調整してください。
    - グループコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit`（既定 50）を使います。`0` で無効化します。
    - 返信/引用/転送の補足コンテキストは、現在は受信したまま渡されます。
    - Telegram の許可リストは主に、誰がエージェントをトリガーできるかを制御するものであり、補足コンテキスト全体のリダクション境界ではありません。
    - DM 履歴制御:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定は、回復可能な送信 API エラーに対して Telegram 送信ヘルパー（CLI/ツール/アクション）に適用されます。受信メッセージへの最終返信の配信も、Telegram の接続前失敗に対して制限付きの安全な送信リトライを使いますが、表示メッセージを重複させる可能性がある送信後の曖昧なネットワークエンベロープはリトライしません。

    CLI 送信ターゲットには、数値チャット ID またはユーザー名を指定できます:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram の投票は `openclaw message poll` を使い、フォーラムトピックをサポートします:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram 専用の投票フラグ:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - フォーラムトピック用の `--thread-id`（または `:topic:` ターゲットを使用）

    Telegram 送信は次もサポートします:

    - `channels.telegram.capabilities.inlineButtons` が許可している場合、インラインキーボード用の `buttons` ブロックを伴う `--presentation`
    - ボットがそのチャットでピン留めできる場合、ピン留め配信をリクエストする `--pin` または `--delivery '{"pin":true}'`
    - 送信画像と GIF を、圧縮された写真またはアニメーションメディアアップロードではなくドキュメントとして送信する `--force-document`

    アクション制御:

    - `channels.telegram.actions.sendMessage=false` は、投票を含む Telegram 送信メッセージを無効にします
    - `channels.telegram.actions.poll=false` は、通常の送信を有効のままにして Telegram 投票作成を無効にします

  </Accordion>

  <Accordion title="Telegram での exec 承認">
    Telegram は承認者の DM で exec 承認をサポートし、必要に応じて発生元のチャットまたはトピックにプロンプトを投稿できます。承認者は数値の Telegram ユーザー ID である必要があります。

    設定パス:

    - `channels.telegram.execApprovals.enabled`（解決可能な承認者が少なくとも 1 人いる場合に自動有効化）
    - `channels.telegram.execApprovals.approvers`（`commands.ownerAllowFrom` の数値所有者 ID にフォールバック）
    - `channels.telegram.execApprovals.target`: `dm`（既定）| `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom`, `defaultTo` は、誰がボットと会話できるか、および通常の返信をどこへ送信するかを制御します。これらによって誰かが exec 承認者になるわけではありません。コマンド所有者がまだ存在しない場合、最初に承認された DM ペアリングが `commands.ownerAllowFrom` をブートストラップするため、1 人所有者のセットアップは `execApprovals.approvers` の下で ID を重複させなくても機能します。

    チャンネル配信ではコマンドテキストがチャットに表示されます。信頼できるグループ/トピックでのみ `channel` または `both` を有効にしてください。プロンプトがフォーラムトピックに到着した場合、OpenClaw は承認プロンプトとフォローアップのためにそのトピックを保持します。exec 承認は既定で 30 分後に期限切れになります。

    インライン承認ボタンも、`channels.telegram.capabilities.inlineButtons` がターゲットサーフェス（`dm`, `group`, `all`）を許可している必要があります。`plugin:` で始まる承認 ID は Plugin 承認を通じて解決され、それ以外はまず exec 承認を通じて解決されます。

    [exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## エラー返信の制御

エージェントで配信エラーまたはプロバイダーエラーが発生した場合、Telegram はエラーテキストで返信するか、それを抑制できます。この動作は 2 つの設定キーで制御します:

| キー                                | 値                | 既定    | 説明                                                                                             |
| ----------------------------------- | ----------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` はチャットにわかりやすいエラーメッセージを送信します。`silent` はエラー返信を完全に抑制します。 |
| `channels.telegram.errorCooldownMs` | 数値 (ms)         | `60000` | 同じチャットへのエラー返信間の最小時間。障害中のエラースパムを防ぎます。                         |

アカウントごと、グループごと、トピックごとの上書きがサポートされています（他の Telegram 設定キーと同じ継承）。

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
  <Accordion title="メンションなしのグループメッセージにボットが応答しない">

    - `requireMention=false` の場合、Telegram のプライバシーモードで完全な可視性が許可されている必要があります。
      - BotFather: `/setprivacy` -> 無効化
      - その後、ボットをグループから削除して再追加します
    - 設定でメンションなしのグループメッセージを想定している場合、`openclaw channels status` が警告します。
    - `openclaw channels status --probe` は明示的な数値グループ ID を確認できます。ワイルドカード `"*"` はメンバーシッププローブできません。
    - 簡単なセッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="ボットがグループメッセージをまったく認識しない">

    - `channels.telegram.groups` が存在する場合、グループがリストされている必要があります（または `"*"` を含める必要があります）
    - グループ内のボットメンバーシップを確認します
    - スキップ理由についてログを確認します: `openclaw logs --follow`

  </Accordion>

  <Accordion title="コマンドが部分的にしか動作しない、またはまったく動作しない">

    - 送信者 ID を承認します（ペアリングおよび/または数値の `allowFrom`）
    - グループポリシーが `open` の場合でも、コマンド承認は引き続き適用されます
    - `BOT_COMMANDS_TOO_MUCH` による `setMyCommands failed` は、ネイティブメニューのエントリが多すぎることを意味します。Plugin/Skills/カスタムコマンドを減らすか、ネイティブメニューを無効にしてください
    - `deleteMyCommands` / `setMyCommands` の起動時呼び出しは制限され、リクエストタイムアウト時には Telegram のトランスポートフォールバックを通じて 1 回リトライされます。継続的なネットワーク/フェッチエラーは通常、`api.telegram.org` への DNS/HTTPS 到達性の問題を示します

  </Accordion>

  <Accordion title="起動時に未承認トークンが報告される">

    - `getMe returned 401` は、設定されたボットトークンに対する Telegram 認証失敗です。
    - BotFather でボットトークンを再コピーまたは再生成し、既定アカウントの `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken`, `TELEGRAM_BOT_TOKEN` を更新します。
    - 起動時の `deleteWebhook 401 Unauthorized` も認証失敗です。これを「Webhook が存在しない」と扱うと、同じ不正トークンによる失敗を後続の API 呼び出しまで先送りするだけです。
    - ポーリング起動中に一時的なネットワークエラーで `deleteWebhook` が失敗した場合、OpenClaw は `getWebhookInfo` を確認します。Telegram が空の Webhook URL を報告した場合、クリーンアップはすでに満たされているためポーリングは続行されます。

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定性">

    - Node 22+ とカスタム fetch/proxy では、AbortSignal の型が一致しない場合に即時 abort 動作が発生することがあります。
    - 一部のホストは `api.telegram.org` を最初に IPv6 へ解決します。IPv6 の送信経路が壊れていると、Telegram API の断続的な失敗が発生することがあります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれる場合、OpenClaw はこれらを回復可能なネットワークエラーとして再試行するようになりました。
    - Telegram ソケットが短い固定間隔で再作成される場合は、`channels.telegram.timeoutSeconds` が低すぎないか確認してください。long-polling の bot クライアントは、`getUpdates` リクエストのガードより低く設定された値をクランプしますが、古いリリースではこれが long-poll timeout より低く設定されていると、ポーリングごとに abort することがありました。
    - ログに `Polling stall detected` が含まれる場合、OpenClaw はデフォルトで、long-poll の liveness が 120 秒間完了しないとポーリングを再起動し、Telegram トランスポートを再構築します。
    - `openclaw channels status --probe` と `openclaw doctor` は、実行中のポーリングアカウントが起動時の猶予後に `getUpdates` を完了していない場合、実行中の webhook アカウントが起動時の猶予後に `setWebhook` を完了していない場合、または最後に成功したポーリングトランスポートのアクティビティが古い場合に警告します。
    - 長時間実行される `getUpdates` 呼び出しが健全であるにもかかわらず、ホストが誤った polling-stall 再起動を報告する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。永続的な stall は通常、ホストと `api.telegram.org` の間の proxy、DNS、IPv6、または TLS 送信経路の問題を示します。
    - Telegram は Bot API トランスポートについて、`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` とそれらの小文字バリアントを含むプロセスの proxy 環境変数も尊重します。`NO_PROXY` / `no_proxy` は引き続き `api.telegram.org` をバイパスできます。
    - サービス環境向けに OpenClaw 管理 proxy が `OPENCLAW_PROXY_URL` で設定されており、標準の proxy 環境変数が存在しない場合、Telegram も Bot API トランスポートにその URL を使用します。
    - 直接の送信経路/TLS が不安定な VPS ホストでは、Telegram API 呼び出しを `channels.telegram.proxy` 経由でルーティングしてください。

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ はデフォルトで `autoSelectFamily=true` です（WSL2 を除く）。Telegram DNS 結果の順序は、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、次に `channels.telegram.network.dnsResultOrder`、次に `NODE_OPTIONS=--dns-result-order=ipv4first` などのプロセスデフォルトを尊重します。いずれも適用されない場合、Node 22+ は `ipv4first` にフォールバックします。
    - ホストが WSL2 であるか、IPv4 のみの動作の方が明示的にうまく機能する場合は、family 選択を強制してください。

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 ベンチマーク範囲の応答（`198.18.0.0/15`）は、Telegram メディアのダウンロードではデフォルトですでに許可されています。信頼済みの fake-IP または透過 proxy が、メディアダウンロード中に `api.telegram.org` を別の private/internal/special-use アドレスへ書き換える場合は、Telegram のみのバイパスにオプトインできます。

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じオプトインは、`channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` でアカウントごとにも利用できます。
    - proxy が Telegram メディアホストを `198.18.x.x` に解決する場合は、まず dangerous フラグをオフのままにしてください。Telegram メディアは、デフォルトで RFC 2544 ベンチマーク範囲をすでに許可しています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` は Telegram
      メディアの SSRF 保護を弱めます。RFC 2544 ベンチマーク範囲外の
      private または special-use 応答を合成する Clash、Mihomo、Surge fake-IP
      ルーティングなど、信頼済みの運用者管理 proxy 環境でのみ使用してください。
      通常の public internet Telegram アクセスではオフのままにしてください。
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

さらにヘルプ: [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

## 設定リファレンス

主要リファレンス: [設定リファレンス - Telegram](/ja-JP/gateway/config-channels#telegram)。

<Accordion title="High-signal Telegram fields">

- 起動/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*`（`tokenFile` は通常ファイルを指している必要があります。symlink は拒否されます）
- アクセス制御: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, トップレベルの `bindings[]`（`type: "acp"`）
- exec 承認: `execApprovals`, `accounts.*.execApprovals`
- コマンド/メニュー: `commands.native`, `commands.nativeSkills`, `customCommands`
- スレッド/返信: `replyToMode`
- ストリーミング: `streaming`（プレビュー）, `streaming.preview.toolProgress`, `blockStreaming`
- フォーマット/配信: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- メディア/ネットワーク: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- カスタム API ルート: `apiRoot`（Bot API ルートのみ。`/bot<TOKEN>` は含めないでください）
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- アクション/ケイパビリティ: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- リアクション: `reactionNotifications`, `reactionLevel`
- エラー: `errorPolicy`, `errorCooldownMs`
- 書き込み/履歴: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
マルチアカウントの優先順位: 2 つ以上のアカウント ID が設定されている場合は、デフォルトのルーティングを明示するために `channels.telegram.defaultAccount` を設定してください（または `channels.telegram.accounts.default` を含めてください）。そうしない場合、OpenClaw は最初の正規化済みアカウント ID にフォールバックし、`openclaw doctor` が警告します。名前付きアカウントは `channels.telegram.allowFrom` / `groupAllowFrom` を継承しますが、`accounts.default.*` の値は継承しません。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    Telegram ユーザーを gateway にペアリングします。
  </Card>
  <Card title="Groups" icon="users" href="/ja-JP/channels/groups">
    グループとトピックの許可リスト動作。
  </Card>
  <Card title="Channel routing" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージを agent にルーティングします。
  </Card>
  <Card title="Security" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと堅牢化。
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    グループとトピックを agent に対応付けます。
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断。
  </Card>
</CardGroup>
