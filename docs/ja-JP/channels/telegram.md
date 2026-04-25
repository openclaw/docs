---
read_when:
    - Telegram の機能や Webhook に取り組む
summary: Telegram ボットのサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-04-25T18:16:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9509ae437c6017c966d944b6d09af65b106f78ea023174127ac900b8cdc45ede
    source_path: channels/telegram.md
    workflow: 15
---

grammY 経由でボットのDMとグループに本番対応しています。デフォルトモードはロングポーリングで、Webhook モードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram のデフォルトの DM ポリシーはペアリングです。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断と修復プレイブック。
  </Card>
  <Card title="Gateway の設定" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャネル設定パターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="BotFather でボットトークンを作成する">
    Telegram を開いて **@BotFather** とチャットします（ハンドル名が正確に `@BotFather` であることを確認してください）。

    `/newbot` を実行し、案内に従って、トークンを保存します。

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
    Telegram は `openclaw channels login telegram` を使用しません。config/env でトークンを設定し、その後 Gateway を起動してください。

  </Step>

  <Step title="Gateway を起動し、最初の DM を承認する">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    ペアリングコードは 1 時間後に期限切れになります。

  </Step>

  <Step title="ボットをグループに追加する">
    ボットをグループに追加し、その後 `channels.telegram.groups` と `groupPolicy` をアクセスモデルに合わせて設定します。
  </Step>
</Steps>

<Note>
トークンの解決順序はアカウント対応です。実際には、config の値が環境変数フォールバックより優先され、`TELEGRAM_BOT_TOKEN` はデフォルトアカウントにのみ適用されます。
</Note>

## Telegram 側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループの可視性">
    Telegram ボットはデフォルトで **プライバシーモード** になっており、受信できるグループメッセージが制限されます。

    ボットがすべてのグループメッセージを見る必要がある場合は、次のいずれかを行います。

    - `/setprivacy` でプライバシーモードを無効にする
    - ボットをグループ管理者にする

    プライバシーモードを切り替えた場合は、Telegram が変更を適用するよう、各グループでボットを削除して再追加してください。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスは Telegram のグループ設定で制御されます。

    管理者ボットはすべてのグループメッセージを受信するため、常時有効のグループ動作に役立ちます。

  </Accordion>

  <Accordion title="便利な BotFather の切り替え">

    - グループ追加を許可/拒否する `/setjoingroups`
    - グループの可視性の動作を設定する `/setprivacy`

  </Accordion>
</AccordionGroup>

## アクセス制御と有効化

<Tabs>
  <Tab title="DM ポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージのアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom` に少なくとも 1 つの送信者 ID が必要）
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    `channels.telegram.allowFrom` は数値の Telegram ユーザー ID を受け付けます。`telegram:` / `tg:` プレフィックスも受け付けられ、正規化されます。
    空の `allowFrom` で `dmPolicy: "allowlist"` を指定すると、すべての DM がブロックされ、config 検証で拒否されます。
    セットアップでは数値のユーザー ID のみを求めます。
    アップグレード後に config に `@username` の allowlist エントリが含まれている場合は、`openclaw doctor --fix` を実行してそれらを解決してください（ベストエフォート。Telegram ボットトークンが必要です）。
    以前にペアリングストアの allowlist ファイルに依存していた場合、allowlist フローでは `openclaw doctor --fix` により `channels.telegram.allowFrom` にエントリを復元できます（たとえば、`dmPolicy: "allowlist"` にまだ明示的な ID がない場合）。

    1 人の所有者向けのボットでは、アクセスポリシーを config に永続的に保持するために、明示的な数値 `allowFrom` ID を指定した `dmPolicy: "allowlist"` を推奨します（以前のペアリング承認に依存するのではなく）。

    よくある混乱: DM のペアリング承認は「この送信者がどこでも認可される」という意味ではありません。
    ペアリングは DM アクセスのみを付与します。グループ送信者の認可は引き続き明示的な config の allowlist から行われます。
    「一度認可されれば DM でもグループコマンドでも動く」ようにしたい場合は、自分の数値の Telegram ユーザー ID を `channels.telegram.allowFrom` に入れてください。

    ### Telegram ユーザー ID を見つける

    より安全な方法（サードパーティのボット不要）:

    1. ボットに DM を送る。
    2. `openclaw logs --follow` を実行する。
    3. `from.id` を読む。

    公式 Bot API の方法:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティの方法（プライバシーはやや低い）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーと allowlist">
    2 つの制御が一緒に適用されます。

    1. **どのグループを許可するか**（`channels.telegram.groups`）
       - `groups` の config がない場合:
         - `groupPolicy: "open"` の場合: どのグループでもグループ ID チェックを通過できます
         - `groupPolicy: "allowlist"`（デフォルト）の場合: `groups` エントリ（または `"*"`）を追加するまでグループはブロックされます
       - `groups` が設定されている場合: allowlist として機能します（明示的な ID または `"*"`）

    2. **グループ内でどの送信者を許可するか**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（デフォルト）
       - `disabled`

    `groupAllowFrom` はグループ送信者フィルタリングに使用されます。設定されていない場合、Telegram は `allowFrom` にフォールバックします。
    `groupAllowFrom` のエントリは数値の Telegram ユーザー ID にしてください（`telegram:` / `tg:` プレフィックスは正規化されます）。
    `groupAllowFrom` に Telegram のグループまたはスーパーグループのチャット ID を入れないでください。負のチャット ID は `channels.telegram.groups` に属します。
    数値以外のエントリは送信者認可では無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ送信者認証は DM のペアリングストア承認を継承しません。
    ペアリングは DM 専用のままです。グループでは、`groupAllowFrom` またはグループ単位/トピック単位の `allowFrom` を設定してください。
    `groupAllowFrom` が未設定の場合、Telegram はペアリングストアではなく config の `allowFrom` にフォールバックします。
    1 人の所有者向けボットの実用的なパターン: 自分のユーザー ID を `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにして、対象グループを `channels.telegram.groups` で許可します。
    ランタイム注記: `channels.telegram` が完全に欠けている場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、ランタイムのデフォルトは fail-closed の `groupPolicy="allowlist"` になります。

    例: 特定の 1 つのグループで任意のメンバーを許可する:

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

    例: 特定の 1 つのグループ内で特定のユーザーのみを許可する:

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
      - 許可されたグループ内でどのユーザーがボットを起動できるかを制限したい場合は、`8734062810` のような Telegram ユーザー ID を `groupAllowFrom` に入れてください。
      - 許可されたグループの任意のメンバーがボットとやり取りできるようにしたい場合にのみ、`groupAllowFrom: ["*"]` を使用してください。
    </Warning>

  </Tab>

  <Tab title="メンションの動作">
    グループでの返信はデフォルトでメンションが必要です。

    メンションは次のいずれかで行えます。

    - ネイティブの `@botusername` メンション
    - 次にあるメンションパターン:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    セッションレベルのコマンド切り替え:

    - `/activation always`
    - `/activation mention`

    これらはセッション状態のみを更新します。永続化するには config を使用してください。

    永続的な config の例:

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
    - または `openclaw logs --follow` から `chat.id` を読む
    - または Bot API の `getUpdates` を確認する

  </Tab>
</Tabs>

## ランタイムの動作

- Telegram は Gateway プロセスによって管理されます。
- ルーティングは決定的です: Telegram の受信返信は Telegram に返ります（モデルがチャネルを選ぶわけではありません）。
- 受信メッセージは、返信メタデータとメディアプレースホルダーを含む共有チャネルエンベロープに正規化されます。
- グループセッションはグループ ID ごとに分離されます。フォーラムトピックはトピックを分離するために `:topic:<threadId>` を付加します。
- DM メッセージは `message_thread_id` を持つことができ、OpenClaw はそれをスレッド対応のセッションキーでルーティングし、返信用に thread ID を保持します。
- ロングポーリングは、チャットごと/スレッドごとの順序制御を持つ grammY runner を使用します。runner sink 全体の並行性は `agents.defaults.maxConcurrent` を使用します。
- ロングポーリングは各 Gateway プロセス内で保護されており、一度に 1 つのアクティブな poller だけが 1 つのボットトークンを使用できます。それでも `getUpdates` の 409 競合が表示される場合は、別の OpenClaw Gateway、スクリプト、または外部 poller が同じトークンを使っている可能性があります。
- ロングポーリングの watchdog 再起動は、デフォルトで `getUpdates` の完了した生存確認が 120 秒間ない場合に発動します。長時間実行される処理中に誤った polling-stall 再起動が引き続き発生する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。値の単位はミリ秒で、`30000` から `600000` まで指定でき、アカウントごとの上書きにも対応しています。
- Telegram Bot API には既読通知のサポートがありません（`sendReadReceipts` は適用されません）。

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClaw は部分的な返信をリアルタイムでストリーミングできます。

    - ダイレクトチャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming` は `off | partial | block | progress` です（デフォルト: `partial`）
    - `progress` は Telegram では `partial` にマップされます（チャネル横断の命名互換性のため）
    - `streaming.preview.toolProgress` は、ツール/進捗更新で同じ編集済みプレビューメッセージを再利用するかどうかを制御します（デフォルト: プレビューストリーミングが有効な場合は `true`）
    - レガシーな `channels.telegram.streamMode` と真偽値の `streaming` は検出されます。これらを `channels.telegram.streaming.mode` に移行するには `openclaw doctor --fix` を実行してください

    ツール進捗プレビュー更新は、ツールの実行中に表示される短い「Working...」行です。たとえば、コマンド実行、ファイル読み取り、計画更新、パッチ要約などです。Telegram では、`v2026.4.22` 以降のリリース済み OpenClaw の動作に合わせるため、これらはデフォルトで有効です。回答テキストには編集済みプレビューを維持しつつ、ツール進捗行を非表示にしたい場合は、次のように設定します。

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

    Telegram のプレビュー編集を完全に無効にしたい場合にのみ `streaming.mode: "off"` を使用してください。ツール進捗のステータス行だけを無効にしたい場合は `streaming.preview.toolProgress: false` を使用してください。

    テキストのみの返信の場合:

    - DM: OpenClaw は同じプレビューメッセージを維持し、最後にその場で編集します（2 通目のメッセージはありません）
    - グループ/トピック: OpenClaw は同じプレビューメッセージを維持し、最後にその場で編集します（2 通目のメッセージはありません）

    複雑な返信（たとえばメディアペイロードなど）の場合、OpenClaw は通常の最終配信にフォールバックし、その後プレビューメッセージをクリーンアップします。

    プレビューストリーミングはブロックストリーミングとは別です。Telegram でブロックストリーミングが明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためにプレビューストリームをスキップします。

    ネイティブのドラフト転送が利用できない、または拒否された場合、OpenClaw は自動的に `sendMessage` + `editMessageText` にフォールバックします。

    Telegram 専用の推論ストリーム:

    - `/reasoning stream` は生成中の推論をライブプレビューに送信します
    - 最終回答は推論テキストなしで送信されます

  </Accordion>

  <Accordion title="書式設定と HTML フォールバック">
    送信テキストは Telegram の `parse_mode: "HTML"` を使用します。

    - Markdown 風のテキストは Telegram 安全な HTML としてレンダリングされます。
    - 生のモデル HTML は、Telegram の解析失敗を減らすためにエスケープされます。
    - Telegram が解析済み HTML を拒否した場合、OpenClaw はプレーンテキストとして再試行します。

    リンクプレビューはデフォルトで有効で、`channels.telegram.linkPreview: false` で無効化できます。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegram のコマンドメニュー登録は、起動時に `setMyCommands` で処理されます。

    ネイティブコマンドのデフォルト:

    - `commands.native: "auto"` で Telegram のネイティブコマンドが有効になります

    カスタムコマンドメニュー項目を追加する:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git バックアップ" },
        { command: "generate", description: "画像を作成" },
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

    注記:

    - カスタムコマンドはメニュー項目のみであり、動作は自動実装されません
    - plugin/skill コマンドは、Telegram メニューに表示されていなくても、入力すれば引き続き動作する場合があります

    ネイティブコマンドが無効な場合、組み込みコマンドは削除されます。カスタム/plugin コマンドは、設定されていれば引き続き登録される場合があります。

    よくあるセットアップ失敗:

    - `setMyCommands failed` で `BOT_COMMANDS_TOO_MUCH` が表示される場合、トリミング後でも Telegram メニューが多すぎることを意味します。plugin/skill/カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効にしてください。
    - `setMyCommands failed` で network/fetch エラーが表示される場合、通常は `api.telegram.org` への外向き DNS/HTTPS がブロックされています。

    ### デバイスペアリングコマンド（`device-pair` plugin）

    `device-pair` plugin がインストールされている場合:

    1. `/pair` でセットアップコードを生成します
    2. iOS アプリにコードを貼り付けます
    3. `/pair pending` で保留中のリクエストを一覧表示します（ロール/スコープを含む）
    4. リクエストを承認します:
       - 明示的に承認するには `/pair approve <requestId>`
       - 保留中のリクエストが 1 件しかない場合は `/pair approve`
       - 最新のものには `/pair approve latest`

    セットアップコードには短期間有効な bootstrap トークンが含まれます。組み込みの bootstrap handoff では、プライマリ Node トークンは `scopes: []` のまま維持されます。引き渡された operator トークンは `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` に制限されたままです。bootstrap のスコープチェックはロール接頭辞付きなので、その operator allowlist は operator リクエストのみを満たします。operator 以外のロールでは、引き続き各ロール自身の接頭辞の下でスコープが必要です。

    デバイスが変更された認証詳細（たとえばロール/スコープ/公開鍵）で再試行した場合、以前の保留中リクエストは置き換えられ、新しいリクエストは別の `requestId` を使用します。承認前に `/pair pending` を再実行してください。

    詳細: [ペアリング](/ja-JP/channels/pairing#pair-via-telegram-recommended-for-ios)。

  </Accordion>

  <Accordion title="インラインボタン">
    インラインキーボードのスコープを設定する:

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

    レガシーな `capabilities: ["inlineButtons"]` は `inlineButtons: "all"` にマップされます。

    メッセージアクションの例:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "オプションを選択してください:",
  buttons: [
    [
      { text: "はい", callback_data: "yes" },
      { text: "いいえ", callback_data: "no" },
    ],
    [{ text: "キャンセル", callback_data: "cancel" }],
  ],
}
```

    コールバッククリックは、エージェントにテキストとして渡されます:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="エージェントと自動化のための Telegram メッセージアクション">
    Telegram のツールアクションには次のものがあります。

    - `sendMessage`（`to`、`content`、省略可能な `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`、省略可能な `iconColor`、`iconCustomEmojiId`）

    チャネルメッセージアクションは使いやすいエイリアスを公開します（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    ゲーティング制御:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（デフォルト: 無効）

    注: `edit` と `topic-create` は現在デフォルトで有効で、個別の `channels.telegram.actions.*` 切り替えはありません。
    ランタイム送信はアクティブな config/secrets スナップショット（起動時/再読み込み時）を使用するため、アクションパスでは送信ごとにアドホックな SecretRef 再解決は行いません。

    リアクション削除のセマンティクス: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="返信スレッドタグ">
    Telegram は生成出力内の明示的な返信スレッドタグをサポートしています。

    - `[[reply_to_current]]` はトリガー元のメッセージに返信します
    - `[[reply_to:<id>]]` は特定の Telegram メッセージ ID に返信します

    `channels.telegram.replyToMode` は処理を制御します。

    - `off`（デフォルト）
    - `first`
    - `all`

    注: `off` は暗黙の返信スレッド化を無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッドの動作">
    フォーラムスーパーグループ:

    - トピックセッションキーは `:topic:<threadId>` を追加します
    - 返信と入力中表示はトピックスレッドを対象にします
    - トピック config パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般トピック（`threadId=1`）の特別扱い:

    - メッセージ送信では `message_thread_id` を省略します（Telegram は `sendMessage(...thread_id=1)` を拒否します）
    - 入力中アクションには引き続き `message_thread_id` が含まれます

    トピック継承: トピックエントリは、上書きされない限りグループ設定を継承します（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` はトピック専用で、グループのデフォルトからは継承されません。

    **トピックごとのエージェントルーティング**: 各トピックは、トピック config に `agentId` を設定することで、別のエージェントにルーティングできます。これにより、各トピックがそれぞれ独立したワークスペース、メモリ、セッションを持てます。例:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // 一般トピック → main エージェント
                "3": { agentId: "zu" },        // 開発トピック → zu エージェント
                "5": { agentId: "coder" }      // コードレビュー → coder エージェント
              }
            }
          }
        }
      }
    }
    ```

    各トピックはその後、独自のセッションキーを持ちます: `agent:zu:telegram:group:-1001234567890:topic:3`

    **永続的な ACP トピックバインディング**: フォーラムトピックは、トップレベルの型付き ACP バインディング（`bindings[]` で `type: "acp"` を指定し、`match.channel: "telegram"`、`peer.kind: "group"`、`-1001234567890:topic:42` のようなトピック修飾 ID を持つもの）を通じて ACP harness セッションを固定できます。現在はグループ/スーパーグループ内のフォーラムトピックに限定されます。詳細は [ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

    **チャットからのスレッドバインド ACP spawn**: `/acp spawn <agent> --thread here|auto` は、現在のトピックを新しい ACP セッションにバインドし、以後のフォローアップはそこへ直接ルーティングされます。OpenClaw はその spawn 確認をトピック内に固定表示します。`channels.telegram.threadBindings.spawnAcpSessions=true` が必要です。

    テンプレートコンテキストは `MessageThreadId` と `IsForum` を公開します。`message_thread_id` を持つ DM チャットは DM ルーティングを維持しつつ、スレッド対応のセッションキーを使用します。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegram ではボイスノートと音声ファイルが区別されます。

    - デフォルト: 音声ファイルとしての動作
    - エージェント返信内のタグ `[[audio_as_voice]]` で、ボイスノート送信を強制
    - 受信したボイスノートの文字起こしは、エージェントコンテキスト内では機械生成の
      信頼されないテキストとして扱われます。メンション検出は引き続き生の
      文字起こしを使用するため、メンション制御された音声メッセージも引き続き機能します。

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

    Telegram では動画ファイルとビデオノートが区別されます。

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

    - 静的 WEBP: ダウンロードして処理（プレースホルダー `<media:sticker>`）
    - アニメーション TGS: スキップ
    - 動画 WEBM: スキップ

    ステッカーコンテキストフィールド:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ステッカーキャッシュファイル:

    - `~/.openclaw/telegram/sticker-cache.json`

    ステッカーは繰り返しの vision 呼び出しを減らすため、一度だけ説明され（可能な場合）、キャッシュされます。

    ステッカーアクションを有効にする:

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

    キャッシュ済みステッカーを検索する:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "手を振る猫",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="リアクション通知">
    Telegram のリアクションは `message_reaction` 更新として届きます（メッセージペイロードとは別です）。

    有効な場合、OpenClaw は次のようなシステムイベントをキューに入れます。

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定:

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    注記:

    - `own` は、ボットが送信したメッセージへのユーザーリアクションのみを意味します（送信メッセージキャッシュによるベストエフォート）。
    - リアクションイベントも Telegram のアクセス制御（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）に従います。未認可の送信者は破棄されます。
    - Telegram はリアクション更新でスレッド ID を提供しません。
      - フォーラムでないグループはグループチャットセッションにルーティングされます
      - フォーラムグループは、正確な元トピックではなく、グループの一般トピックセッション（`:topic:1`）にルーティングされます

    ポーリング/Webhook の `allowed_updates` には自動的に `message_reaction` が含まれます。

  </Accordion>

  <Accordion title="Ack リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間、確認用の絵文字を送信します。

    解決順序:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェント ID の絵文字フォールバック（`agents.list[].identity.emoji`、なければ "👀"）

    注記:

    - Telegram は Unicode 絵文字を期待します（たとえば "👀"）。
    - チャネルまたはアカウントでリアクションを無効にするには `""` を使用してください。

  </Accordion>

  <Accordion title="Telegram イベントとコマンドからの config 書き込み">
    チャネル config への書き込みはデフォルトで有効です（`configWrites !== false`）。

    Telegram トリガーの書き込みには次のものがあります。

    - `channels.telegram.groups` を更新するためのグループ移行イベント（`migrate_to_chat_id`）
    - `/config set` と `/config unset`（コマンド有効化が必要）

    無効化する:

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
    デフォルトはロングポーリングです。Webhook モードでは `channels.telegram.webhookUrl` と `channels.telegram.webhookSecret` を設定してください。`webhookPath`、`webhookHost`、`webhookPort` は任意です（デフォルトは `/telegram-webhook`、`127.0.0.1`、`8787`）。

    ローカルリスナーは `127.0.0.1:8787` にバインドします。公開インバウンドでは、ローカルポートの前段にリバースプロキシを置くか、意図的に `webhookHost: "0.0.0.0"` を設定してください。

    Webhook モードでは、Telegram に `200` を返す前に、リクエストガード、Telegram のシークレットトークン、JSON ボディを検証します。
    その後 OpenClaw は、ロングポーリングで使われるものと同じチャット単位/トピック単位のボットレーンを通じて更新を非同期に処理するため、遅いエージェントターンでも Telegram の配信 ACK を保持しません。

  </Accordion>

  <Accordion title="制限、再試行、CLI ターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは 4000 です。
    - `channels.telegram.chunkMode="newline"` は、長さで分割する前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト 100）は、受信および送信の Telegram メディアサイズの上限です。
    - `channels.telegram.timeoutSeconds` は Telegram API クライアントのタイムアウトを上書きします（未設定の場合、grammY のデフォルトが適用されます）。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは `120000` です。`30000` から `600000` の範囲で調整するのは、誤検知の polling-stall 再起動がある場合だけにしてください。
    - グループコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit` を使います（デフォルト 50）。`0` で無効になります。
    - 返信/引用/転送の補足コンテキストは現在、受信したまま渡されます。
    - Telegram の allowlist は主に、誰がエージェントを起動できるかを制御するものであり、完全な補足コンテキストの秘匿境界ではありません。
    - DM 履歴の制御:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` config は、回復可能な送信 API エラーに対する Telegram 送信ヘルパー（CLI/tools/actions）に適用されます。

    CLI の送信ターゲットには数値の chat ID またはユーザー名を使用できます:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram の poll は `openclaw message poll` を使用し、フォーラムトピックもサポートします:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram 専用の poll フラグ:

    - `--poll-duration-seconds`（5-600）
    - `--poll-anonymous`
    - `--poll-public`
    - フォーラムトピック用の `--thread-id`（または `:topic:` ターゲットを使用）

    Telegram の送信は次もサポートします:

    - `channels.telegram.capabilities.inlineButtons` が許可している場合、インラインキーボード用の `buttons` ブロックを含む `--presentation`
    - ボットがそのチャットでピン留めできる場合に、ピン留め配信を要求する `--pin` または `--delivery '{"pin":true}'`
    - 送信画像と GIF を圧縮写真やアニメーションメディアのアップロードではなくドキュメントとして送信する `--force-document`

    アクションのゲーティング:

    - `channels.telegram.actions.sendMessage=false` は、poll を含む送信 Telegram メッセージを無効にします
    - `channels.telegram.actions.poll=false` は、通常送信を有効のままにして Telegram poll 作成を無効にします

  </Accordion>

  <Accordion title="Telegram での exec 承認">
    Telegram は approver DM での exec 承認をサポートし、必要に応じて元のチャットまたはトピックにプロンプトを投稿することもできます。approver は数値の Telegram ユーザー ID である必要があります。

    config パス:

    - `channels.telegram.execApprovals.enabled`（少なくとも 1 人の approver を解決できる場合、自動的に有効化）
    - `channels.telegram.execApprovals.approvers`（`allowFrom` / `defaultTo` の数値 owner ID にフォールバック）
    - `channels.telegram.execApprovals.target`: `dm`（デフォルト）| `channel` | `both`
    - `agentFilter`、`sessionFilter`

    チャネル配信ではコマンドテキストがチャットに表示されます。`channel` または `both` は信頼できるグループ/トピックでのみ有効にしてください。プロンプトがフォーラムトピックに届いた場合、OpenClaw は承認プロンプトとその後続の両方でそのトピックを保持します。exec 承認のデフォルト有効期限は 30 分です。

    インライン承認ボタンでは、ターゲット画面（`dm`、`group`、または `all`）を許可するよう `channels.telegram.capabilities.inlineButtons` も必要です。`plugin:` で始まる承認 ID は plugin 承認を通じて解決され、それ以外はまず exec 承認として解決されます。

    [Exec approvals](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>
</AccordionGroup>

## エラー返信の制御

エージェントが配信エラーまたはプロバイダーエラーに遭遇したとき、Telegram はエラーテキストを返信することも、抑制することもできます。この動作は 2 つの config キーで制御されます:

| キー                                | 値                | デフォルト | 説明                                                                                      |
| ----------------------------------- | ----------------- | ---------- | ----------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` はわかりやすいエラーメッセージをチャットに送信します。`silent` はエラー返信を完全に抑制します。 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`    | 同じチャットへのエラー返信の最小間隔。障害時のエラースパムを防ぎます。                           |

アカウント単位、グループ単位、トピック単位の上書きに対応しています（他の Telegram config キーと同じ継承）。

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
  <Accordion title="ボットがメンションなしのグループメッセージに反応しない">

    - `requireMention=false` の場合、Telegram のプライバシーモードで完全な可視性が許可されている必要があります。
      - BotFather: `/setprivacy` -> Disable
      - その後、ボットをグループから削除して再追加
    - `openclaw channels status` は、config がメンションなしのグループメッセージを期待している場合に警告します。
    - `openclaw channels status --probe` は明示的な数値グループ ID を確認できます。ワイルドカード `"*"` は membership-probe できません。
    - クイックセッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="ボットがグループメッセージをまったく認識しない">

    - `channels.telegram.groups` が存在する場合、そのグループが一覧に含まれている必要があります（または `"*"` を含める）
    - グループ内のボットメンバーシップを確認
    - ログを確認: スキップ理由について `openclaw logs --follow`

  </Accordion>

  <Accordion title="コマンドが一部しか動作しない、またはまったく動作しない">

    - 送信者 ID を認可してください（ペアリングおよび/または数値の `allowFrom`）
    - グループポリシーが `open` でも、コマンド認可は引き続き適用されます
    - `setMyCommands failed` で `BOT_COMMANDS_TOO_MUCH` が表示される場合、ネイティブメニューの項目数が多すぎます。plugin/skill/カスタムコマンドを減らすか、ネイティブメニューを無効にしてください
    - `setMyCommands failed` で network/fetch エラーが表示される場合、通常は `api.telegram.org` への DNS/HTTPS 到達性の問題を示します

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定性">

    - Node 22+ + カスタム fetch/proxy では、AbortSignal 型が一致しないと即時 abort 動作が発生する場合があります。
    - 一部のホストは `api.telegram.org` をまず IPv6 に解決します。IPv6 の外向き通信が壊れていると、Telegram API エラーが断続的に発生することがあります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれている場合、OpenClaw はこれらを回復可能なネットワークエラーとして再試行するようになりました。
    - ログに `Polling stall detected` が含まれている場合、OpenClaw はデフォルトで、完了したロングポーリングの生存確認が 120 秒間ないとポーリングを再起動し、Telegram トランスポートを再構築します。
    - `channels.telegram.pollingStallThresholdMs` を増やすのは、長時間実行される `getUpdates` 呼び出しが正常なのに、ホストで polling-stall の誤再起動が報告される場合だけにしてください。持続的な stall は通常、ホストと `api.telegram.org` 間の proxy、DNS、IPv6、または TLS の外向き通信の問題を示します。
    - 直接の外向き通信/TLS が不安定な VPS ホストでは、Telegram API 呼び出しを `channels.telegram.proxy` 経由でルーティングしてください:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ のデフォルトは `autoSelectFamily=true`（WSL2 を除く）および `dnsResultOrder=ipv4first` です。
    - ホストが WSL2 である、または明示的に IPv4 のみの動作の方がうまくいく場合は、family 選択を強制してください:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 ベンチマークレンジの応答（`198.18.0.0/15`）は、
      すでに Telegram メディアダウンロードでデフォルト許可されています。信頼できる fake-IP または
      transparent proxy が、メディアダウンロード中に `api.telegram.org` を別の
      private/internal/special-use アドレスへ書き換える場合は、
      Telegram 専用のバイパスをオプトインできます:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じオプトインはアカウント単位でも利用できます:
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`。
    - proxy が Telegram メディアホストを `198.18.x.x` に解決する場合は、まず
      dangerous フラグをオフのままにしてください。Telegram メディアでは RFC 2544
      ベンチマークレンジはすでにデフォルト許可されています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` は Telegram の
      メディア SSRF 保護を弱めます。これは、Clash、Mihomo、Surge の fake-IP
      ルーティングのように、RFC 2544 ベンチマークレンジ外の private または
      special-use の応答を合成する、信頼できる運用者管理の proxy 環境でのみ使用してください。
      通常のパブリックインターネット経由の Telegram アクセスではオフのままにしてください。
    </Warning>

    - 環境変数による上書き（一時的）:
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS 応答を検証する:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

さらにヘルプ: [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

## 設定リファレンス

主なリファレンス: [設定リファレンス - Telegram](/ja-JP/gateway/config-channels#telegram)。

<Accordion title="シグナルの強い Telegram フィールド">

- 起動/認証: `enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` は通常ファイルを指す必要があり、シンボリックリンクは拒否されます）
- アクセス制御: `dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、トップレベルの `bindings[]`（`type: "acp"`）
- exec 承認: `execApprovals`、`accounts.*.execApprovals`
- コマンド/メニュー: `commands.native`、`commands.nativeSkills`、`customCommands`
- スレッド/返信: `replyToMode`
- ストリーミング: `streaming`（プレビュー）、`streaming.preview.toolProgress`、`blockStreaming`
- 書式設定/配信: `textChunkLimit`、`chunkMode`、`linkPreview`、`responsePrefix`
- メディア/ネットワーク: `mediaMaxMb`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- Webhook: `webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- アクション/機能: `capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- リアクション: `reactionNotifications`、`reactionLevel`
- エラー: `errorPolicy`、`errorCooldownMs`
- 書き込み/履歴: `configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
マルチアカウントの優先順位: 2 つ以上のアカウント ID を設定している場合は、デフォルトルーティングを明示するために `channels.telegram.defaultAccount` を設定してください（または `channels.telegram.accounts.default` を含めてください）。そうしないと、OpenClaw は正規化後の最初のアカウント ID にフォールバックし、`openclaw doctor` が警告します。名前付きアカウントは `channels.telegram.allowFrom` / `groupAllowFrom` を継承しますが、`accounts.default.*` の値は継承しません。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram ユーザーを Gateway にペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループおよびトピックの allowlist の動作。
  </Card>
  <Card title="チャネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントにルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルとハードニング。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    グループとトピックをエージェントにマッピングします。
  </Card>
  <Card title="トラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断。
  </Card>
</CardGroup>
