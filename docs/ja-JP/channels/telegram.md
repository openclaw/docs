---
read_when:
    - Telegram機能またはWebhookの作業をしている
summary: Telegramボットのサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-04-24T04:47:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: fdd6ea0277e074f90306f91d51fd329c6914de85dde0ae09a731713f1bba98d9
    source_path: channels/telegram.md
    workflow: 15
---

BotのDMとグループ向けに、grammY経由で本番運用可能です。デフォルトモードはロングポーリングで、Webhookモードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    TelegramのデフォルトDMポリシーはペアリングです。
  </Card>
  <Card title="チャネルトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断と修復プレイブックです。
  </Card>
  <Card title="Gateway設定" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャネル設定パターンと例です。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="BotFatherでボットトークンを作成する">
    Telegramを開き、**@BotFather** とチャットします（ハンドルが正確に `@BotFather` であることを確認してください）。

    `/newbot` を実行し、案内に従って、トークンを保存します。

  </Step>

  <Step title="トークンとDMポリシーを設定する">

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
    Telegramでは **`openclaw channels login telegram` を使用しません**。設定/環境変数でトークンを設定してから、gatewayを起動してください。

  </Step>

  <Step title="gatewayを起動して最初のDMを承認する">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    ペアリングコードは1時間で期限切れになります。

  </Step>

  <Step title="ボットをグループに追加する">
    ボットをグループに追加し、その後 `channels.telegram.groups` と `groupPolicy` をアクセスモデルに合わせて設定します。
  </Step>
</Steps>

<Note>
トークン解決順序はアカウント対応です。実際には、設定値が環境変数フォールバックより優先され、`TELEGRAM_BOT_TOKEN` はデフォルトアカウントにのみ適用されます。
</Note>

## Telegram側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループ可視性">
    Telegramボットはデフォルトで**Privacy Mode**になっており、受信できるグループメッセージが制限されます。

    ボットがすべてのグループメッセージを見る必要がある場合は、次のいずれかを行ってください。

    - `/setprivacy` でプライバシーモードを無効にする
    - ボットをグループ管理者にする

    プライバシーモードを切り替えたときは、Telegramが変更を適用するよう、各グループでボットを一度削除してから再追加してください。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスはTelegramのグループ設定で制御します。

    管理者ボットはすべてのグループメッセージを受信するため、常時有効のグループ動作に便利です。

  </Accordion>

  <Accordion title="役立つBotFatherトグル">

    - グループ追加を許可/拒否する `/setjoingroups`
    - グループ可視性の動作を切り替える `/setprivacy`

  </Accordion>
</AccordionGroup>

## アクセス制御とアクティベーション

<Tabs>
  <Tab title="DMポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom` に少なくとも1つの送信者IDが必要）
    - `open`（`allowFrom` に `"*"` を含める必要あり）
    - `disabled`

    `channels.telegram.allowFrom` は数値のTelegramユーザーIDを受け付けます。`telegram:` / `tg:` プレフィックスは受け付けられ、正規化されます。
    `dmPolicy: "allowlist"` で `allowFrom` が空の場合、すべてのDMがブロックされ、設定検証で拒否されます。
    セットアップでは数値ユーザーIDのみを尋ねます。
    アップグレード後に設定に `@username` のallowlistエントリが含まれている場合は、それらを解決するために `openclaw doctor --fix` を実行してください（ベストエフォートです。Telegramボットトークンが必要です）。
    以前にペアリングストアのallowlistファイルに依存していた場合、`openclaw doctor --fix` は、allowlistフローでエントリを `channels.telegram.allowFrom` に復元できます（たとえば `dmPolicy: "allowlist"` にまだ明示的なIDがない場合）。

    単一オーナーのボットでは、以前のペアリング承認に依存するのではなく、アクセスポリシーを設定内で永続化するために、明示的な数値 `allowFrom` IDを含む `dmPolicy: "allowlist"` を推奨します。

    よくある混乱として、DMのペアリング承認は「この送信者がどこでも認可される」ことを意味しません。
    ペアリングが付与するのはDMアクセスのみです。グループ送信者の認可は、引き続き明示的な設定allowlistから行われます。
    「一度認可されればDMもグループコマンドも使える」ようにしたい場合は、数値のTelegramユーザーIDを `channels.telegram.allowFrom` に入れてください。

    ### TelegramユーザーIDの見つけ方

    より安全な方法（サードパーティのボット不要）:

    1. ボットにDMを送る。
    2. `openclaw logs --follow` を実行する。
    3. `from.id` を確認する。

    公式Bot APIを使う方法:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティを使う方法（プライバシーは低下します）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーとallowlist">
    2つの制御が一緒に適用されます。

    1. **どのグループが許可されるか**（`channels.telegram.groups`）
       - `groups` 設定なし:
         - `groupPolicy: "open"` の場合: 任意のグループがグループIDチェックを通過可能
         - `groupPolicy: "allowlist"`（デフォルト）の場合: `groups` エントリ（または `"*"`）を追加するまでグループはブロックされる
       - `groups` が設定されている場合: allowlistとして機能する（明示的なIDまたは `"*"`）

    2. **グループ内でどの送信者が許可されるか**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（デフォルト）
       - `disabled`

    `groupAllowFrom` はグループ送信者フィルタリングに使われます。設定されていない場合、Telegramは `allowFrom` にフォールバックします。
    `groupAllowFrom` のエントリは数値のTelegramユーザーIDである必要があります（`telegram:` / `tg:` プレフィックスは正規化されます）。
    TelegramのグループまたはスーパーグループのチャットIDを `groupAllowFrom` に入れないでください。負のチャットIDは `channels.telegram.groups` の下に置く必要があります。
    数値でないエントリは送信者認可では無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ送信者認可はDMペアリングストア承認を継承**しません**。
    ペアリングは引き続きDM専用です。グループについては、`groupAllowFrom` またはグループ/トピックごとの `allowFrom` を設定してください。
    `groupAllowFrom` が未設定の場合、Telegramはペアリングストアではなく、設定の `allowFrom` にフォールバックします。
    単一オーナーのボットに対する実用的なパターン: ユーザーIDを `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにして、対象グループを `channels.telegram.groups` の下で許可します。
    実行時の注記: `channels.telegram` が完全に欠落している場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、実行時はフェイルクローズドの `groupPolicy="allowlist"` がデフォルトになります。

    例: 1つの特定グループ内の任意のメンバーを許可する:

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

    例: 1つの特定グループ内の特定ユーザーのみを許可する:

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
      よくある間違い: `groupAllowFrom` はTelegramグループのallowlistではありません。

      - `-1001234567890` のような負のTelegramグループまたはスーパーグループのチャットIDは `channels.telegram.groups` の下に置いてください。
      - 許可されたグループ内で、どの人がボットを起動できるかを制限したい場合は、`8734062810` のようなTelegramユーザーIDを `groupAllowFrom` の下に置いてください。
      - 許可されたグループの任意のメンバーがボットと会話できるようにしたい場合にのみ、`groupAllowFrom: ["*"]` を使ってください。
    </Warning>

  </Tab>

  <Tab title="メンション動作">
    グループ返信はデフォルトでメンションが必要です。

    メンションは次のいずれかから判定されます。

    - ネイティブの `@botusername` メンション
    - 次にあるメンションパターン:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    セッションレベルのコマンド切り替え:

    - `/activation always`
    - `/activation mention`

    これらはセッション状態のみを更新します。永続化には設定を使ってください。

    永続的な設定の例:

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

    グループチャットIDの取得方法:

    - グループメッセージを `@userinfobot` / `@getidsbot` に転送する
    - または `openclaw logs --follow` から `chat.id` を確認する
    - または Bot API の `getUpdates` を確認する

  </Tab>
</Tabs>

## 実行時の動作

- Telegramはgatewayプロセスによって所有されます。
- ルーティングは決定的です: Telegramの受信はTelegramに返信されます（モデルがチャネルを選ぶことはありません）。
- 受信メッセージは、返信メタデータとメディアプレースホルダーを含む共有チャネルエンベロープへ正規化されます。
- グループセッションはグループIDごとに分離されます。フォーラムトピックは `:topic:<threadId>` を追加してトピックごとの分離を維持します。
- DMメッセージは `message_thread_id` を持つことができ、OpenClawはそれをスレッド対応SessionKeyでルーティングし、返信用にスレッドIDを保持します。
- ロングポーリングは、チャットごと/スレッドごとの順序制御付きで grammY runner を使用します。runner sink全体の並行性には `agents.defaults.maxConcurrent` を使います。
- ロングポーリングのウォッチドッグ再起動は、デフォルトで `getUpdates` の完了済み生存確認が120秒間ない場合に発動します。長時間実行の作業中に誤ったポーリング停止再起動が引き続き発生する場合のみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。値はミリ秒で、`30000` から `600000` まで指定でき、アカウントごとの上書きもサポートされます。
- Telegram Bot APIには既読通知のサポートがありません（`sendReadReceipts` は適用されません）。

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClawは部分的な返信をリアルタイムでストリーミングできます。

    - ダイレクトチャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming` は `off | partial | block | progress`（デフォルト: `partial`）
    - `progress` はTelegram上では `partial` に対応します（チャネル横断の命名互換性のため）
    - `streaming.preview.toolProgress` は、ツール/進捗更新で同じ編集済みプレビューメッセージを再利用するかどうかを制御します（デフォルト: `true`）。ツール/進捗メッセージを別に保持するには `false` を設定します。
    - 従来の `channels.telegram.streamMode` と真偽値の `streaming` 値は自動的にマッピングされます

    テキストのみの返信では:

    - DM: OpenClawは同じプレビューメッセージを維持し、最後にその場で編集します（2つ目のメッセージは送信しません）
    - グループ/トピック: OpenClawは同じプレビューメッセージを維持し、最後にその場で編集します（2つ目のメッセージは送信しません）

    複雑な返信（たとえばメディアペイロード）では、OpenClawは通常の最終配信にフォールバックし、その後プレビューメッセージをクリーンアップします。

    プレビュー配信はブロック配信とは別です。Telegramでブロック配信が明示的に有効になっている場合、OpenClawは二重配信を避けるためにプレビュー配信をスキップします。

    ネイティブの下書き転送が利用できない/拒否された場合、OpenClawは自動的に `sendMessage` + `editMessageText` にフォールバックします。

    Telegram専用のreasoningストリーム:

    - `/reasoning stream` は生成中のreasoningをライブプレビューに送信します
    - 最終回答はreasoningテキストなしで送信されます

  </Accordion>

  <Accordion title="フォーマットとHTMLフォールバック">
    送信テキストはTelegramの `parse_mode: "HTML"` を使います。

    - Markdown風テキストはTelegramで安全なHTMLにレンダリングされます。
    - 生のモデルHTMLは、Telegramの解析失敗を減らすためにエスケープされます。
    - Telegramが解析済みHTMLを拒否した場合、OpenClawはプレーンテキストとして再試行します。

    リンクプレビューはデフォルトで有効で、`channels.telegram.linkPreview: false` で無効にできます。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegramコマンドメニューの登録は、起動時に `setMyCommands` で処理されます。

    ネイティブコマンドのデフォルト:

    - `commands.native: "auto"` はTelegramのネイティブコマンドを有効にします

    カスタムコマンドメニュー項目を追加するには:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Gitバックアップ" },
        { command: "generate", description: "画像を作成" },
      ],
    },
  },
}
```

    ルール:

    - 名前は正規化されます（先頭の `/` を除去し、小文字化）
    - 有効なパターン: `a-z`、`0-9`、`_`、長さ `1..32`
    - カスタムコマンドはネイティブコマンドを上書きできません
    - 競合/重複はスキップされ、ログに記録されます

    注記:

    - カスタムコマンドはメニュー項目にすぎず、動作を自動実装するものではありません
    - Telegramメニューに表示されていなくても、入力されたPlugin/Skillsコマンドは引き続き動作する場合があります

    ネイティブコマンドが無効な場合、組み込みコマンドは削除されます。設定されていれば、カスタム/Pluginコマンドは引き続き登録されることがあります。

    よくあるセットアップ失敗:

    - `setMyCommands failed` で `BOT_COMMANDS_TOO_MUCH` が出る場合は、トリミング後でもTelegramメニューがまだ多すぎることを意味します。Plugin/Skills/カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効にしてください。
    - `setMyCommands failed` で network/fetch エラーが出る場合は、通常 `api.telegram.org` へのDNS/HTTPS送信がブロックされています。

    ### デバイスペアリングコマンド（`device-pair` Plugin）

    `device-pair` Pluginがインストールされている場合:

    1. `/pair` でセットアップコードを生成します
    2. iOSアプリにコードを貼り付けます
    3. `/pair pending` で保留中のリクエスト一覧を表示します（role/scopesを含む）
    4. リクエストを承認します:
       - 明示的に承認するには `/pair approve <requestId>`
       - 保留中のリクエストが1件だけの場合は `/pair approve`
       - 最新のものには `/pair approve latest`

    セットアップコードには短期間有効なブートストラップトークンが含まれています。組み込みのブートストラップ引き継ぎでは、プライマリNodeトークンの `scopes: []` が維持されます。引き渡されるオペレータートークンは、`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` に制限されたままです。ブートストラップのスコープチェックはroleプレフィックス付きなので、そのオペレーターallowlistはオペレーター要求にしか適用されません。非オペレーターroleでは、引き続き自分のroleプレフィックス配下のscopesが必要です。

    デバイスが変更された認証詳細（たとえばrole/scopes/public key）で再試行した場合、以前の保留中リクエストは置き換えられ、新しいリクエストは別の `requestId` を使います。承認前に `/pair pending` を再実行してください。

    詳細: [ペアリング](/ja-JP/channels/pairing#pair-via-telegram-recommended-for-ios)

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

    従来の `capabilities: ["inlineButtons"]` は `inlineButtons: "all"` にマッピングされます。

    メッセージアクションの例:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "オプションを選んでください:",
  buttons: [
    [
      { text: "はい", callback_data: "yes" },
      { text: "いいえ", callback_data: "no" },
    ],
    [{ text: "キャンセル", callback_data: "cancel" }],
  ],
}
```

    コールバッククリックはテキストとしてエージェントに渡されます:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="エージェントと自動化のためのTelegramメッセージアクション">
    Telegramツールアクションには次が含まれます:

    - `sendMessage`（`to`、`content`、省略可能な `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`、省略可能な `iconColor`、`iconCustomEmojiId`）

    チャネルメッセージアクションは使いやすいエイリアスを公開しています（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    ゲーティング制御:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（デフォルト: 無効）

    注記: `edit` と `topic-create` は現在デフォルトで有効で、個別の `channels.telegram.actions.*` トグルはありません。
    実行時の送信では、アクティブな設定/シークレットのスナップショット（起動/再読み込み時点）を使うため、アクション経路では送信ごとにアドホックなSecretRef再解決は行いません。

    リアクション削除のセマンティクス: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="返信スレッディングタグ">
    Telegramは、生成出力内の明示的な返信スレッディングタグをサポートします:

    - `[[reply_to_current]]` はトリガーとなったメッセージに返信します
    - `[[reply_to:<id>]]` は特定のTelegramメッセージIDに返信します

    `channels.telegram.replyToMode` が処理方法を制御します:

    - `off`（デフォルト）
    - `first`
    - `all`

    注記: `off` は暗黙の返信スレッディングを無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッド動作">
    フォーラムsupergroup:

    - トピックのSessionKeyは `:topic:<threadId>` を追加します
    - 返信と入力中表示はトピックスレッドを対象にします
    - トピック設定パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般トピック（`threadId=1`）の特別扱い:

    - メッセージ送信では `message_thread_id` を省略します（Telegramは `sendMessage(...thread_id=1)` を拒否します）
    - typingアクションでは引き続き `message_thread_id` を含めます

    トピック継承: トピックエントリは、上書きされない限りグループ設定を継承します（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` はトピック専用であり、グループデフォルトからは継承されません。

    **トピックごとのエージェントルーティング**: 各トピックは、トピック設定で `agentId` を設定することで別のエージェントにルーティングできます。これにより、各トピックが独自の分離されたワークスペース、メモリ、セッションを持てます。例:

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

    各トピックは次のような独自のSessionKeyを持ちます: `agent:zu:telegram:group:-1001234567890:topic:3`

    **永続的なACPトピックバインディング**: フォーラムトピックは、トップレベルの型付きACP bindings（`type: "acp"` を持つ `bindings[]`、`match.channel: "telegram"`、`peer.kind: "group"`、および `-1001234567890:topic:42` のようなトピック修飾付きid）を通じてACPハーネスセッションをピン留めできます。現在はグループ/supergroup内のフォーラムトピックに限定されています。[ACPエージェント](/ja-JP/tools/acp-agents)を参照してください。

    **チャットからのスレッド束縛ACP生成**: `/acp spawn <agent> --thread here|auto` は、現在のトピックを新しいACPセッションにバインドし、以後のやり取りはそこへ直接ルーティングされます。OpenClawは生成確認をトピック内にピン留めします。`channels.telegram.threadBindings.spawnAcpSessions=true` が必要です。

    テンプレートコンテキストは `MessageThreadId` と `IsForum` を公開します。`message_thread_id` を持つDMチャットはDMルーティングを維持しつつ、スレッド対応SessionKeyを使います。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegramはボイスノートと音声ファイルを区別します。

    - デフォルト: 音声ファイルとしての動作
    - エージェント返信にタグ `[[audio_as_voice]]` を付けると、ボイスノート送信を強制します

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

    Telegramは動画ファイルとビデオノートを区別します。

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

    ビデオノートはキャプションをサポートしません。指定されたメッセージテキストは別送されます。

    ### ステッカー

    受信ステッカーの処理:

    - 静的WEBP: ダウンロードして処理されます（プレースホルダー `<media:sticker>`）
    - アニメーションTGS: スキップされます
    - 動画WEBM: スキップされます

    ステッカーのコンテキストフィールド:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ステッカーキャッシュファイル:

    - `~/.openclaw/telegram/sticker-cache.json`

    ステッカーは（可能な場合）一度だけ説明が生成され、繰り返しのvision呼び出しを減らすためにキャッシュされます。

    ステッカーアクションを有効にするには:

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

    キャッシュ済みステッカーを検索するには:

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
    Telegramのリアクションは、`message_reaction` 更新として届きます（メッセージペイロードとは別です）。

    有効な場合、OpenClawは次のようなシステムイベントをキューに入れます。

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定:

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    注記:

    - `own` は、ボットが送信したメッセージに対するユーザーリアクションのみを意味します（送信メッセージキャッシュによるベストエフォート）。
    - リアクションイベントは、引き続きTelegramのアクセス制御（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）に従います。未認可の送信者は破棄されます。
    - Telegramはリアクション更新にスレッドIDを提供しません。
      - フォーラムではないグループはグループチャットセッションにルーティングされます
      - フォーラムグループは、その正確な元トピックではなく、グループの一般トピックセッション（`:topic:1`）にルーティングされます

    ポーリング/Webhookの `allowed_updates` には、自動的に `message_reaction` が含まれます。

  </Accordion>

  <Accordion title="Ackリアクション">
    `ackReaction` は、OpenClawが受信メッセージを処理している間、確認用の絵文字を送信します。

    解決順序:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェントidentity絵文字へのフォールバック（`agents.list[].identity.emoji`、なければ `"👀"`）

    注記:

    - TelegramはUnicode絵文字を期待します（たとえば `"👀"`）。
    - チャネルまたはアカウントでリアクションを無効にするには `""` を使用します。

  </Accordion>

  <Accordion title="Telegramイベントとコマンドからの設定書き込み">
    チャネル設定への書き込みはデフォルトで有効です（`configWrites !== false`）。

    Telegramトリガーの書き込みには次が含まれます。

    - `channels.telegram.groups` を更新するためのグループ移行イベント（`migrate_to_chat_id`）
    - `/config set` と `/config unset`（コマンド有効化が必要）

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

  <Accordion title="ロングポーリングとWebhook">
    デフォルトはロングポーリングです。Webhookモードでは `channels.telegram.webhookUrl` と `channels.telegram.webhookSecret` を設定します。必要に応じて `webhookPath`、`webhookHost`、`webhookPort` も使えます（デフォルトは `/telegram-webhook`、`127.0.0.1`、`8787`）。

    ローカルリスナーは `127.0.0.1:8787` にバインドされます。公開受信を行うには、ローカルポートの前段にリバースプロキシを置くか、意図的に `webhookHost: "0.0.0.0"` を設定してください。

  </Accordion>

  <Accordion title="制限、リトライ、CLIターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは4000です。
    - `channels.telegram.chunkMode="newline"` は、文字数で分割する前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト100）は、Telegramメディアの受信と送信のサイズ上限です。
    - `channels.telegram.timeoutSeconds` はTelegram APIクライアントのタイムアウトを上書きします（未設定の場合はgrammYのデフォルトが適用されます）。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは `120000` です。誤検知のポーリング停止再起動に対してのみ、`30000` から `600000` の範囲で調整してください。
    - グループコンテキスト履歴には `channels.telegram.historyLimit` または `messages.groupChat.historyLimit` を使います（デフォルト50）。`0` で無効化します。
    - reply/quote/forward の補足コンテキストは現在、受信したまま渡されます。
    - Telegramのallowlistは、主に誰がエージェントを起動できるかを制御するものであり、完全な補足コンテキストのマスキング境界ではありません。
    - DM履歴の制御:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定は、回復可能な送信APIエラーに対するTelegram送信ヘルパー（CLI/ツール/アクション）に適用されます。

    CLI送信ターゲットには、数値チャットIDまたはユーザー名を使えます:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegramの投票には `openclaw message poll` を使い、フォーラムトピックもサポートします:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram専用の投票フラグ:

    - `--poll-duration-seconds`（5-600）
    - `--poll-anonymous`
    - `--poll-public`
    - フォーラムトピック用の `--thread-id`（または `:topic:` ターゲットを使用）

    Telegram送信では次もサポートします:

    - `channels.telegram.capabilities.inlineButtons` が許可している場合、インラインキーボード用の `buttons` ブロックを含む `--presentation`
    - ボットがそのチャットでピン留めできる場合に、ピン留め配信を要求する `--pin` または `--delivery '{"pin":true}'`
    - 送信画像やGIFを圧縮写真やアニメーションメディアアップロードではなく、ドキュメントとして送信する `--force-document`

    アクションゲーティング:

    - `channels.telegram.actions.sendMessage=false` は、投票を含む送信Telegramメッセージを無効にします
    - `channels.telegram.actions.poll=false` は、通常送信を有効にしたままTelegram投票作成を無効にします

  </Accordion>

  <Accordion title="Telegramでのexec承認">
    Telegramは承認者DMでのexec承認をサポートし、必要に応じて元のチャットまたはトピックにもプロンプトを投稿できます。承認者は数値のTelegramユーザーIDである必要があります。

    設定パス:

    - `channels.telegram.execApprovals.enabled`（少なくとも1人の承認者が解決可能な場合、自動的に有効化）
    - `channels.telegram.execApprovals.approvers`（`allowFrom` / `defaultTo` の数値オーナーIDにフォールバック）
    - `channels.telegram.execApprovals.target`: `dm`（デフォルト） | `channel` | `both`
    - `agentFilter`、`sessionFilter`

    チャネル配信ではコマンドテキストがチャット内に表示されるため、`channel` または `both` は信頼できるグループ/トピックでのみ有効にしてください。プロンプトがフォーラムトピックに届く場合、OpenClawは承認プロンプトとその後続処理の両方でトピックを保持します。exec承認のデフォルト有効期限は30分です。

    インライン承認ボタンも、対象サーフェス（`dm`、`group`、`all`）を許可する `channels.telegram.capabilities.inlineButtons` が必要です。`plugin:` プレフィックス付きの承認IDはPlugin承認を通じて解決され、それ以外はまずexec承認として解決されます。

    [Exec approvals](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## エラー返信制御

エージェントが配信エラーまたはプロバイダエラーに遭遇した場合、Telegramはエラーテキストを返信することも、抑制することもできます。この動作は2つの設定キーで制御されます:

| キー | 値 | デフォルト | 説明 |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` はチャットにわかりやすいエラーメッセージを送信します。`silent` はエラー返信を完全に抑制します。 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | 同じチャットへのエラー返信間の最小時間。障害時のエラースパムを防ぎます。 |

アカウントごと、グループごと、トピックごとの上書きをサポートしています（他のTelegram設定キーと同じ継承）。

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // このグループではエラーを抑制
        },
      },
    },
  },
}
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="メンションなしのグループメッセージにボットが応答しない">

    - `requireMention=false` の場合、Telegramのプライバシーモードで完全な可視性が許可されている必要があります。
      - BotFather: `/setprivacy` -> Disable
      - その後、ボットをグループから削除して再追加します
    - `openclaw channels status` は、設定がメンションなしのグループメッセージを期待している場合に警告します。
    - `openclaw channels status --probe` は明示的な数値グループIDを確認できます。ワイルドカード `"*"` はメンバーシップ確認できません。
    - 簡易セッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="ボットがグループメッセージをまったく見ていない">

    - `channels.telegram.groups` が存在する場合、そのグループは一覧に含まれている必要があります（または `"*"` を含める）
    - ボットがグループに参加していることを確認する
    - ログを確認する: スキップ理由は `openclaw logs --follow`

  </Accordion>

  <Accordion title="コマンドが一部しか動かない、またはまったく動かない">

    - 送信者identityを認可してください（ペアリングおよび/または数値の `allowFrom`）
    - グループポリシーが `open` であっても、コマンド認可は引き続き適用されます
    - `setMyCommands failed` で `BOT_COMMANDS_TOO_MUCH` が出る場合、ネイティブメニューの項目が多すぎます。Plugin/Skills/カスタムコマンドを減らすか、ネイティブメニューを無効にしてください
    - `setMyCommands failed` で network/fetch エラーが出る場合、通常は `api.telegram.org` へのDNS/HTTPS到達性の問題を示しています

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定さ">

    - Node 22+ とカスタムfetch/proxyの組み合わせでは、AbortSignalの型不一致により即時abort動作が起こることがあります。
    - 一部のホストでは `api.telegram.org` がまずIPv6に解決され、IPv6送信が壊れているとTelegram API障害が断続的に発生することがあります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれる場合、OpenClawはこれらを回復可能なネットワークエラーとして再試行するようになりました。
    - ログに `Polling stall detected` が含まれる場合、OpenClawはデフォルトで、完了済みロングポーリング生存確認が120秒間ないとポーリングを再起動し、Telegramトランスポートを再構築します。
    - 長時間の `getUpdates` 呼び出しが正常でもホストで誤ったポーリング停止再起動が報告される場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。継続的な停止は通常、ホストと `api.telegram.org` の間のproxy、DNS、IPv6、またはTLS送信問題を示します。
    - 直接の送信/TLSが不安定なVPSホストでは、Telegram API呼び出しを `channels.telegram.proxy` 経由にしてください:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ では、デフォルトで `autoSelectFamily=true`（WSL2を除く）および `dnsResultOrder=ipv4first` です。
    - ホストがWSL2である場合、またはIPv4専用動作のほうが明らかにうまくいく場合は、family選択を強制してください:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544ベンチマーク範囲の応答（`198.18.0.0/15`）は、Telegramメディアダウンロードについてデフォルトですでに許可されています。信頼できるfake-IPまたは透過proxyが、メディアダウンロード中に `api.telegram.org` を別のprivate/internal/special-useアドレスへ書き換える場合は、Telegram専用のバイパスを有効にできます:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じオプトインは、アカウントごとに `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` でも利用できます。
    - proxyがTelegramメディアホストを `198.18.x.x` に解決する場合は、まず危険フラグをオフのままにしてください。TelegramメディアではRFC 2544ベンチマーク範囲がすでにデフォルトで許可されています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` はTelegramメディアのSSRF保護を弱めます。Clash、Mihomo、Surgeのfake-IPルーティングのように、RFC 2544ベンチマーク範囲外のprivateまたはspecial-use応答を合成する、信頼できる運用者管理のproxy環境でのみ使用してください。通常の公開インターネット経由のTelegramアクセスでは無効のままにしてください。
    </Warning>

    - 環境変数による上書き（一時的）:
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS応答を検証するには:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

詳細: [チャネルトラブルシューティング](/ja-JP/channels/troubleshooting)。

## 設定リファレンス

主なリファレンス: [設定リファレンス - Telegram](/ja-JP/gateway/config-channels#telegram)。

<Accordion title="重要なTelegramフィールド">

- 起動/認証: `enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` は通常ファイルを指している必要があり、シンボリックリンクは拒否されます）
- アクセス制御: `dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、トップレベル `bindings[]`（`type: "acp"`）
- exec承認: `execApprovals`、`accounts.*.execApprovals`
- コマンド/メニュー: `commands.native`、`commands.nativeSkills`、`customCommands`
- スレッディング/返信: `replyToMode`
- ストリーミング: `streaming`（プレビュー）、`streaming.preview.toolProgress`、`blockStreaming`
- フォーマット/配信: `textChunkLimit`、`chunkMode`、`linkPreview`、`responsePrefix`
- メディア/ネットワーク: `mediaMaxMb`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- Webhook: `webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- アクション/機能: `capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- リアクション: `reactionNotifications`、`reactionLevel`
- エラー: `errorPolicy`、`errorCooldownMs`
- 書き込み/履歴: `configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
複数アカウントの優先順位: 2つ以上のアカウントIDが設定されている場合は、デフォルトルーティングを明示するために `channels.telegram.defaultAccount` を設定するか（または `channels.telegram.accounts.default` を含めて）ください。そうしないと、OpenClawは最初に正規化されたアカウントIDにフォールバックし、`openclaw doctor` が警告します。名前付きアカウントは `channels.telegram.allowFrom` / `groupAllowFrom` を継承しますが、`accounts.default.*` の値は継承しません。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegramユーザーをgatewayにペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループとトピックのallowlist動作。
  </Card>
  <Card title="チャネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントへルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルとハードニング。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    グループとトピックをエージェントにマップします。
  </Card>
  <Card title="トラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断。
  </Card>
</CardGroup>
