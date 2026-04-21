---
read_when:
    - Telegramの機能またはWebhookに取り組む
summary: Telegramボットのサポート状況、機能、および設定
title: Telegram
x-i18n:
    generated_at: "2026-04-21T04:43:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5c70775b55d4923a31ad8bae7f4c6e7cbae754c05c3a578180d63db2b59e39a
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram（Bot API）

ステータス: grammY経由のボットDMおよびグループに対して本番運用対応。ロングポーリングがデフォルトモードで、Webhookモードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    TelegramのデフォルトDMポリシーはペアリングです。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断と修復プレイブック。
  </Card>
  <Card title="Gatewayの設定" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャネル設定パターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="BotFatherでボットトークンを作成する">
    Telegramを開いて **@BotFather** とチャットします（ハンドルが正確に `@BotFather` であることを確認してください）。

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
    Telegramは `openclaw channels login telegram` を使用しません。config/envでトークンを設定してから、gatewayを起動してください。

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
トークン解決順序はアカウント対応です。実際には、config値が環境変数フォールバックより優先され、`TELEGRAM_BOT_TOKEN` はデフォルトアカウントにのみ適用されます。
</Note>

## Telegram側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループ可視性">
    Telegramボットはデフォルトで **Privacy Mode** になっており、受信できるグループメッセージが制限されます。

    ボットがすべてのグループメッセージを見る必要がある場合は、次のいずれかを行います。

    - `/setprivacy` でプライバシーモードを無効化する
    - ボットをグループ管理者にする

    プライバシーモードを切り替えたときは、Telegramが変更を適用するよう、各グループでボットを削除して再追加してください。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスはTelegramのグループ設定で制御されます。

    管理者ボットはすべてのグループメッセージを受信するため、常時有効なグループ動作に役立ちます。

  </Accordion>

  <Accordion title="役立つBotFatherトグル">

    - グループ追加を許可/拒否する `/setjoingroups`
    - グループ可視性の動作用の `/setprivacy`

  </Accordion>
</AccordionGroup>

## アクセス制御と有効化

<Tabs>
  <Tab title="DMポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom` に少なくとも1つの送信者IDが必要）
    - `open`（`allowFrom` に `"*"` を含める必要あり）
    - `disabled`

    `channels.telegram.allowFrom` は数値のTelegramユーザーIDを受け付けます。`telegram:` / `tg:` プレフィックスは受け付けられ、正規化されます。
    空の `allowFrom` での `dmPolicy: "allowlist"` はすべてのDMをブロックし、config検証で拒否されます。
    セットアップでは数値ユーザーIDのみを求めます。
    アップグレード後にconfigに `@username` の許可リスト項目が含まれている場合は、それらを解決するために `openclaw doctor --fix` を実行してください（ベストエフォートで、Telegramボットトークンが必要です）。
    以前にペアリングストアの許可リストファイルに依存していた場合、`openclaw doctor --fix` は allowlist フローにおいて項目を `channels.telegram.allowFrom` に復旧できます（たとえば `dmPolicy: "allowlist"` にまだ明示的なIDがない場合）。

    単一オーナーのボットでは、以前のペアリング承認に依存するのではなく、アクセスポリシーをconfigで永続化するために、明示的な数値 `allowFrom` IDを持つ `dmPolicy: "allowlist"` を推奨します。

    よくある混乱点: DMのペアリング承認は「この送信者がどこでも認可される」ことを意味しません。
    ペアリングが付与するのはDMアクセスのみです。グループ送信者の認可は、引き続き明示的なconfig許可リストから行われます。
    「一度認可されれば、DMもグループコマンドも両方使える」ようにしたい場合は、数値のTelegramユーザーIDを `channels.telegram.allowFrom` に入れてください。

    ### TelegramユーザーIDを見つける

    より安全な方法（サードパーティボット不要）:

    1. ボットにDMを送る。
    2. `openclaw logs --follow` を実行する。
    3. `from.id` を読む。

    公式Bot APIの方法:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティの方法（プライバシーは低め）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーと許可リスト">
    2つの制御が組み合わせて適用されます。

    1. **どのグループが許可されるか**（`channels.telegram.groups`）
       - `groups` configなし:
         - `groupPolicy: "open"` の場合: どのグループでもグループIDチェックを通過できます
         - `groupPolicy: "allowlist"`（デフォルト）の場合: `groups` エントリ（または `"*"`）を追加するまでグループはブロックされます
       - `groups` が設定されている場合: 許可リストとして機能します（明示的なIDまたは `"*"`）

    2. **グループ内でどの送信者が許可されるか**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（デフォルト）
       - `disabled`

    `groupAllowFrom` はグループ送信者フィルタリングに使用されます。設定されていない場合、Telegramは `allowFrom` にフォールバックします。
    `groupAllowFrom` の項目は数値のTelegramユーザーIDにする必要があります（`telegram:` / `tg:` プレフィックスは正規化されます）。
    TelegramのグループまたはスーパーグループのチャットIDを `groupAllowFrom` に入れないでください。負のチャットIDは `channels.telegram.groups` の下に置いてください。
    数値でない項目は送信者認可で無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ送信者認証はDMのペアリングストア承認を継承しません。
    ペアリングは引き続きDM専用です。グループについては、`groupAllowFrom` またはグループごと/トピックごとの `allowFrom` を設定してください。
    `groupAllowFrom` が未設定の場合、Telegramはペアリングストアではなくconfigの `allowFrom` にフォールバックします。
    単一オーナーのボット向けの実用的なパターン: ユーザーIDを `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにして、対象グループを `channels.telegram.groups` で許可します。
    ランタイム注記: `channels.telegram` が完全に欠けている場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、ランタイムのデフォルトはフェイルクローズドの `groupPolicy="allowlist"` です。

    例: 特定の1つのグループで任意のメンバーを許可する

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

    例: 特定の1つのグループ内で特定のユーザーだけを許可する

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
      よくある間違い: `groupAllowFrom` はTelegramグループの許可リストではありません。

      - `-1001234567890` のような負のTelegramグループまたはスーパーグループのチャットIDは `channels.telegram.groups` の下に置いてください。
      - 許可済みグループ内でボットをトリガーできる人を制限したい場合は、`8734062810` のようなTelegramユーザーIDを `groupAllowFrom` の下に置いてください。
      - 許可済みグループの任意のメンバーがボットに話しかけられるようにしたい場合にのみ `groupAllowFrom: ["*"]` を使用してください。
    </Warning>

  </Tab>

  <Tab title="メンション動作">
    グループ返信はデフォルトでメンションが必要です。

    メンションは次から行えます。

    - ネイティブの `@botusername` メンション
    - 次にあるメンションパターン:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    セッションレベルのコマンド切り替え:

    - `/activation always`
    - `/activation mention`

    これらはセッション状態のみを更新します。永続化にはconfigを使用してください。

    永続configの例:

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

    グループチャットIDを取得する方法:

    - グループメッセージを `@userinfobot` / `@getidsbot` に転送する
    - または `openclaw logs --follow` から `chat.id` を読む
    - または Bot API の `getUpdates` を確認する

  </Tab>
</Tabs>

## ランタイム動作

- Telegramはgatewayプロセスによって所有されます。
- ルーティングは決定的です: Telegramからの受信返信はTelegramへ返されます（モデルはチャネルを選択しません）。
- 受信メッセージは、返信メタデータとメディアプレースホルダーを含む共有チャネルエンベロープへ正規化されます。
- グループセッションはグループIDごとに分離されます。フォーラムトピックはトピックを分離するために `:topic:<threadId>` を付加します。
- DMメッセージは `message_thread_id` を持つことができます。OpenClawはそれらをスレッド対応のセッションキーでルーティングし、返信用にスレッドIDを保持します。
- ロングポーリングはチャットごと/スレッドごとのシーケンシングを備えた grammY runner を使用します。runner sink 全体の並行性は `agents.defaults.maxConcurrent` を使用します。
- ロングポーリングのウォッチドッグ再起動は、デフォルトで完了した `getUpdates` の生存確認が120秒ない場合にトリガーされます。長時間実行の処理中にもデプロイメントで誤ったポーリング停止再起動が発生する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。値の単位はミリ秒で、`30000` から `600000` まで許可されます。アカウントごとのオーバーライドにも対応しています。
- Telegram Bot APIには既読通知サポートがありません（`sendReadReceipts` は適用されません）。

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClawは部分返信をリアルタイムでストリーミングできます。

    - ダイレクトチャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming` は `off | partial | block | progress` です（デフォルト: `partial`）
    - `progress` はTelegram上では `partial` にマッピングされます（チャネル横断の命名互換性のため）
    - 旧来の `channels.telegram.streamMode` と真偽値の `streaming` は自動マッピングされます

    テキストのみの返信の場合:

    - DM: OpenClawは同じプレビューメッセージを保持し、その場で最終編集を行います（2つ目のメッセージはありません）
    - グループ/トピック: OpenClawは同じプレビューメッセージを保持し、その場で最終編集を行います（2つ目のメッセージはありません）

    複雑な返信（たとえばメディアペイロード）の場合、OpenClawは通常の最終配信にフォールバックし、その後プレビューメッセージをクリーンアップします。

    プレビュー配信はブロックストリーミングとは別です。Telegramでブロックストリーミングが明示的に有効な場合、OpenClawは二重ストリーミングを避けるためにプレビューストリームをスキップします。

    ネイティブドラフト転送が利用できない/拒否された場合、OpenClawは自動的に `sendMessage` + `editMessageText` にフォールバックします。

    Telegram専用のreasoningストリーム:

    - `/reasoning stream` は生成中のreasoningをライブプレビューに送信します
    - 最終回答はreasoningテキストなしで送信されます

  </Accordion>

  <Accordion title="書式設定とHTMLフォールバック">
    送信テキストはTelegramの `parse_mode: "HTML"` を使用します。

    - Markdown風テキストはTelegram安全なHTMLにレンダリングされます。
    - 生のモデルHTMLは、Telegramのパース失敗を減らすためにエスケープされます。
    - Telegramがパース済みHTMLを拒否した場合、OpenClawはプレーンテキストとして再試行します。

    リンクプレビューはデフォルトで有効で、`channels.telegram.linkPreview: false` で無効化できます。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegramコマンドメニュー登録は起動時に `setMyCommands` で処理されます。

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
    - 有効なパターン: `a-z`, `0-9`, `_`, 長さ `1..32`
    - カスタムコマンドはネイティブコマンドを上書きできません
    - 競合/重複はスキップされ、ログに記録されます

    注記:

    - カスタムコマンドはメニュー項目のみであり、動作は自動実装されません
    - plugin/skill コマンドは、Telegramメニューに表示されていなくても、入力すれば動作することがあります

    ネイティブコマンドが無効な場合、組み込みコマンドは削除されます。設定されていれば、カスタム/plugin コマンドは引き続き登録されることがあります。

    よくあるセットアップ失敗:

    - `BOT_COMMANDS_TOO_MUCH` を伴う `setMyCommands failed` は、トリミング後もTelegramメニューがまだ上限を超えていることを意味します。plugin/skill/custom コマンドを減らすか、`channels.telegram.commands.native` を無効にしてください。
    - ネットワーク/fetch エラーを伴う `setMyCommands failed` は、通常 `api.telegram.org` への外向きDNS/HTTPSがブロックされていることを意味します。

    ### デバイスのペアリングコマンド（`device-pair` plugin）

    `device-pair` plugin がインストールされている場合:

    1. `/pair` でセットアップコードを生成します
    2. iOSアプリにコードを貼り付けます
    3. `/pair pending` で保留中のリクエスト一覧を表示します（role/scopes を含む）
    4. リクエストを承認します:
       - 明示的に承認する場合は `/pair approve <requestId>`
       - 保留中のリクエストが1つだけの場合は `/pair approve`
       - 最新のものを承認する場合は `/pair approve latest`

    セットアップコードには短命のブートストラップトークンが含まれます。組み込みのブートストラップ引き継ぎでは、プライマリ Node トークンは `scopes: []` のまま維持されます。引き渡された operator トークンは、`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` に制限されたままです。ブートストラップスコープチェックには role プレフィックスが付くため、この operator 許可リストは operator リクエストのみを満たします。operator 以外の role では、引き続きそれぞれの role プレフィックス配下の scopes が必要です。

    デバイスが変更された認証詳細（たとえば role/scopes/public key）で再試行した場合、以前の保留中リクエストは置き換えられ、新しいリクエストは別の `requestId` を使用します。承認前に `/pair pending` を再実行してください。

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

    アカウントごとのオーバーライド:

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

    コールバッククリックはテキストとして agent に渡されます:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="agent と自動化向けのTelegramメッセージアクション">
    Telegramツールアクションには次が含まれます:

    - `sendMessage`（`to`, `content`, オプションの `mediaUrl`, `replyToMessageId`, `messageThreadId`）
    - `react`（`chatId`, `messageId`, `emoji`）
    - `deleteMessage`（`chatId`, `messageId`）
    - `editMessage`（`chatId`, `messageId`, `content`）
    - `createForumTopic`（`chatId`, `name`, オプションの `iconColor`, `iconCustomEmojiId`）

    チャネルメッセージアクションは使いやすいエイリアスを公開します（`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`）。

    ゲート制御:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（デフォルト: 無効）

    注記: `edit` と `topic-create` は現在デフォルトで有効で、個別の `channels.telegram.actions.*` トグルはありません。
    ランタイム送信はアクティブな config/secrets スナップショット（起動時/リロード時）を使用するため、アクション経路では送信ごとにその場で SecretRef を再解決しません。

    リアクション削除のセマンティクス: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="返信スレッドタグ">
    Telegramは生成出力内の明示的な返信スレッドタグをサポートします:

    - `[[reply_to_current]]` はトリガーとなったメッセージに返信します
    - `[[reply_to:<id>]]` は特定のTelegramメッセージIDに返信します

    `channels.telegram.replyToMode` が処理方法を制御します:

    - `off`（デフォルト）
    - `first`
    - `all`

    注記: `off` は暗黙の返信スレッド化を無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッド動作">
    フォーラムスーパーグループ:

    - トピックのセッションキーには `:topic:<threadId>` が追加されます
    - 返信とタイピングはそのトピックスレッドを対象にします
    - トピック設定パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般トピック（`threadId=1`）の特別扱い:

    - メッセージ送信では `message_thread_id` を省略します（Telegramは `sendMessage(...thread_id=1)` を拒否します）
    - タイピングアクションでは引き続き `message_thread_id` を含めます

    トピック継承: トピック項目は、上書きされない限りグループ設定を継承します（`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`）。
    `agentId` はトピック専用で、グループデフォルトからは継承されません。

    **トピックごとの agent ルーティング**: 各トピックは、トピック設定で `agentId` を設定することで別の agent にルーティングできます。これにより各トピックは独自に分離されたワークスペース、メモリ、セッションを持てます。例:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // 一般トピック → main agent
                "3": { agentId: "zu" },        // 開発トピック → zu agent
                "5": { agentId: "coder" }      // コードレビュー → coder agent
              }
            }
          }
        }
      }
    }
    ```

    各トピックはその後、それぞれ独自のセッションキーを持ちます: `agent:zu:telegram:group:-1001234567890:topic:3`

    **永続的な ACP トピックバインディング**: フォーラムトピックは、トップレベルの型付きACPバインディングを通じてACPハーネスセッションを固定できます:

    - `bindings[]` で `type: "acp"` および `match.channel: "telegram"` を使用

    例:

    ```json5
    {
      agents: {
        list: [
          {
            id: "codex",
            runtime: {
              type: "acp",
              acp: {
                agent: "codex",
                backend: "acpx",
                mode: "persistent",
                cwd: "/workspace/openclaw",
              },
            },
          },
        ],
      },
      bindings: [
        {
          type: "acp",
          agentId: "codex",
          match: {
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    これは現在、グループおよびスーパーグループ内のフォーラムトピックに限定されています。

    **チャットからのスレッドバインドACP起動**:

    - `/acp spawn <agent> --thread here|auto` で、現在のTelegramトピックを新しいACPセッションにバインドできます。
    - 以後のトピックメッセージは、バインドされたACPセッションへ直接ルーティングされます（`/acp steer` は不要）。
    - OpenClawは、バインド成功後に起動確認メッセージをそのトピック内に固定します。
    - `channels.telegram.threadBindings.spawnAcpSessions=true` が必要です。

    テンプレートコンテキストには次が含まれます:

    - `MessageThreadId`
    - `IsForum`

    DMスレッド動作:

    - `message_thread_id` を持つプライベートチャットはDMルーティングを維持しますが、スレッド対応のセッションキー/返信先を使用します。

  </Accordion>

  <Accordion title="音声、動画、およびステッカー">
    ### 音声メッセージ

    Telegramはボイスノートと音声ファイルを区別します。

    - デフォルト: 音声ファイルとしての動作
    - agent の返信内でタグ `[[audio_as_voice]]` を使うと、ボイスノート送信を強制します

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

    ビデオノートはキャプションをサポートしていません。指定されたメッセージテキストは別送されます。

    ### ステッカー

    受信ステッカーの処理:

    - 静的WEBP: ダウンロードして処理（プレースホルダー `<media:sticker>`）
    - アニメーションTGS: スキップ
    - 動画WEBM: スキップ

    ステッカーのコンテキストフィールド:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ステッカーキャッシュファイル:

    - `~/.openclaw/telegram/sticker-cache.json`

    ステッカーは、繰り返しのvision呼び出しを減らすために、可能な場合は一度だけ説明されてキャッシュされます。

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

    キャッシュ済みステッカーを検索:

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
    Telegramのリアクションは `message_reaction` 更新として届きます（メッセージペイロードとは別です）。

    有効な場合、OpenClawは次のようなシステムイベントをキューに入れます:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定:

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    注記:

    - `own` は、ボットが送信したメッセージに対するユーザーリアクションのみを意味します（送信メッセージキャッシュによるベストエフォート）。
    - リアクションイベントは引き続きTelegramのアクセス制御（`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`）に従います。未認可の送信者は破棄されます。
    - Telegramはリアクション更新にスレッドIDを提供しません。
      - フォーラムでないグループはグループチャットセッションにルーティングされます
      - フォーラムグループは、その元の正確なトピックではなく、グループの一般トピックセッション（`:topic:1`）にルーティングされます

    ポーリング/Webhook 用の `allowed_updates` には `message_reaction` が自動的に含まれます。

  </Accordion>

  <Accordion title="Ack リアクション">
    `ackReaction` は、OpenClawが受信メッセージを処理している間、確認用の絵文字を送信します。

    解決順序:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - agent identity の絵文字フォールバック（`agents.list[].identity.emoji`、なければ `"👀"`）

    注記:

    - TelegramはUnicode絵文字を想定しています（たとえば `"👀"`）。
    - チャネルまたはアカウントでリアクションを無効化するには `""` を使用してください。

  </Accordion>

  <Accordion title="Telegramイベントおよびコマンドからのconfig書き込み">
    チャネルconfig書き込みはデフォルトで有効です（`configWrites !== false`）。

    Telegramトリガーの書き込みには次が含まれます:

    - `channels.telegram.groups` を更新するためのグループ移行イベント（`migrate_to_chat_id`）
    - `/config set` および `/config unset`（コマンド有効化が必要）

    無効化するには:

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
    デフォルト: ロングポーリング。

    Webhookモード:

    - `channels.telegram.webhookUrl` を設定
    - `channels.telegram.webhookSecret` を設定（Webhook URLが設定されている場合は必須）
    - 任意の `channels.telegram.webhookPath`（デフォルト `/telegram-webhook`）
    - 任意の `channels.telegram.webhookHost`（デフォルト `127.0.0.1`）
    - 任意の `channels.telegram.webhookPort`（デフォルト `8787`）

    Webhookモードのデフォルトのローカルリスナーは `127.0.0.1:8787` にバインドされます。

    公開エンドポイントが異なる場合は、手前にリバースプロキシを置き、`webhookUrl` をその公開URLに向けてください。
    意図的に外部からの流入が必要な場合は、`webhookHost`（たとえば `0.0.0.0`）を設定してください。

  </Accordion>

  <Accordion title="制限、再試行、およびCLIターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは 4000 です。
    - `channels.telegram.chunkMode="newline"` は、長さで分割する前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト 100）は、受信および送信のTelegramメディアサイズ上限を設定します。
    - `channels.telegram.timeoutSeconds` はTelegram APIクライアントのタイムアウトを上書きします（未設定の場合は grammY のデフォルトが適用されます）。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは `120000` です。誤検知のポーリング停止再起動に対してのみ、`30000` から `600000` の範囲で調整してください。
    - グループコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit` を使用します（デフォルト 50）。`0` で無効になります。
    - 返信/引用/転送の補足コンテキストは現在、受信したとおりに渡されます。
    - Telegramの許可リストは主に、誰が agent をトリガーできるかを制御するものであり、完全な補足コンテキストの秘匿境界ではありません。
    - DM履歴の制御:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定は、回復可能な送信APIエラーに対してTelegram送信ヘルパー（CLI/tools/actions）に適用されます。

    CLI送信ターゲットには数値チャットIDまたはユーザー名を使用できます:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegramの投票には `openclaw message poll` を使用し、フォーラムトピックもサポートしています:

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

    Telegram送信は次もサポートしています:

    - `channels.telegram.capabilities.inlineButtons` が許可している場合のインラインキーボード用 `--buttons`
    - 送信画像とGIFを、圧縮された写真やアニメーションメディアのアップロードではなく、ドキュメントとして送るための `--force-document`

    アクションゲート:

    - `channels.telegram.actions.sendMessage=false` は、投票を含む送信Telegramメッセージを無効にします
    - `channels.telegram.actions.poll=false` は、通常の送信を有効なままにしてTelegram投票作成を無効にします

  </Accordion>

  <Accordion title="Telegramでのexec承認">
    Telegramは承認者DMでのexec承認をサポートし、必要に応じて元のチャットやトピックにも承認プロンプトを投稿できます。

    設定パス:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers`（任意。可能な場合は `allowFrom` とダイレクトメッセージの `defaultTo` から推測される数値オーナーIDにフォールバック）
    - `channels.telegram.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
    - `agentFilter`, `sessionFilter`

    承認者は数値のTelegramユーザーIDでなければなりません。Telegramは、`enabled` が未設定または `"auto"` で、`execApprovals.approvers` またはアカウントの数値オーナー設定（`allowFrom` およびダイレクトメッセージ `defaultTo`）から少なくとも1人の承認者を解決できる場合、自動的にネイティブexec承認を有効にします。ネイティブ承認クライアントとしてのTelegramを明示的に無効にするには `enabled: false` を設定してください。それ以外の場合、承認リクエストは他の設定済み承認経路またはexec承認フォールバックポリシーにフォールバックします。

    Telegramは他のチャットチャネルで使われる共有承認ボタンもレンダリングします。ネイティブTelegramアダプターは主に、承認者DMルーティング、チャネル/トピックへのファンアウト、および配信前のタイピングヒントを追加します。
    それらのボタンが存在する場合、それが主要な承認UXです。OpenClaw
    は、ツール結果でチャット承認が利用できないと示された場合、または手動承認が唯一の経路である場合にのみ、手動 `/approve` コマンドを含めるべきです。

    配信ルール:

    - `target: "dm"` は、解決済み承認者DMにのみ承認プロンプトを送信します
    - `target: "channel"` は、元のTelegramチャット/トピックにプロンプトを送り返します
    - `target: "both"` は、承認者DMと元のチャット/トピックの両方に送信します

    承認または拒否できるのは解決済み承認者のみです。非承認者は `/approve` を使えず、Telegram承認ボタンも使用できません。

    承認解決動作:

    - `plugin:` プレフィックス付きIDは常に plugin 承認を通じて解決されます。
    - それ以外の承認IDは、まず `exec.approval.resolve` を試します。
    - Telegramにも plugin 承認の権限があり、gateway が
      そのexec承認を不明/期限切れと返した場合、Telegramは
      `plugin.approval.resolve` を通じて1回だけ再試行します。
    - 実際のexec承認拒否/エラーは、黙って plugin
      承認解決にフォールスルーしません。

    チャネル配信ではチャット内にコマンドテキストが表示されるため、`channel` または `both` は信頼できるグループ/トピックでのみ有効にしてください。プロンプトがフォーラムトピックに届いた場合、OpenClawは承認プロンプトと承認後フォローアップの両方でそのトピックを維持します。exec承認の有効期限はデフォルトで30分です。

    インライン承認ボタンも、`channels.telegram.capabilities.inlineButtons` が対象サーフェス（`dm`、`group`、または `all`）を許可している必要があります。

    関連ドキュメント: [Exec承認](/ja-JP/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## エラー返信制御

agent が配信またはプロバイダーエラーに遭遇したとき、Telegramはエラーテキストで返信することも、抑制することもできます。この動作は2つのconfigキーで制御されます。

| Key                                 | Values            | Default | 説明                                                                                     |
| ----------------------------------- | ----------------- | ------- | ---------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` は親しみやすいエラーメッセージをチャットに送信します。`silent` はエラー返信を完全に抑制します。 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | 同じチャットへのエラー返信の最小間隔。障害中のエラースパムを防ぎます。        |

アカウントごと、グループごと、トピックごとのオーバーライドに対応しています（他のTelegram configキーと同じ継承）。

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
  <Accordion title="ボットがメンションなしのグループメッセージに応答しない">

    - `requireMention=false` の場合、Telegramのプライバシーモードで完全可視性が許可されている必要があります。
      - BotFather: `/setprivacy` -> Disable
      - その後、ボットをグループから削除して再追加
    - `openclaw channels status` は、configがメンションなしグループメッセージを想定している場合に警告します。
    - `openclaw channels status --probe` は明示的な数値グループIDを確認できます。ワイルドカード `"*"` はメンバーシップ検査できません。
    - クイックセッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="ボットがグループメッセージをまったく見ていない">

    - `channels.telegram.groups` が存在する場合、グループが一覧に含まれている必要があります（または `"*"` を含める）
    - グループ内のボット参加を確認する
    - ログを確認: スキップ理由は `openclaw logs --follow`

  </Accordion>

  <Accordion title="コマンドが一部しか動かない、またはまったく動かない">

    - 送信者IDを認可する（ペアリングおよび/または数値 `allowFrom`）
    - グループポリシーが `open` でもコマンド認可は引き続き適用されます
    - `BOT_COMMANDS_TOO_MUCH` を伴う `setMyCommands failed` は、ネイティブメニューの項目数が多すぎることを意味します。plugin/skill/custom コマンドを減らすか、ネイティブメニューを無効にしてください
    - ネットワーク/fetch エラーを伴う `setMyCommands failed` は、通常 `api.telegram.org` へのDNS/HTTPS到達性の問題を示します

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定性">

    - Node 22+ + カスタム fetch/proxy では、AbortSignal 型の不一致があると即時中断動作が発生することがあります。
    - 一部のホストは `api.telegram.org` をまずIPv6に解決します。壊れたIPv6送信経路は断続的なTelegram API障害を引き起こす可能性があります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれる場合、OpenClawはこれらを回復可能なネットワークエラーとして再試行するようになりました。
    - ログに `Polling stall detected` が含まれる場合、OpenClawはデフォルトで、完了したロングポールの生存確認が120秒ないとポーリングを再起動し、Telegramトランスポートを再構築します。
    - 長時間の `getUpdates` 呼び出しが健全なのにホストで誤ったポーリング停止再起動が報告される場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。継続的な停止は通常、ホストと `api.telegram.org` の間のproxy、DNS、IPv6、またはTLS送信経路の問題を示します。
    - 直接の送信経路/TLSが不安定なVPSホストでは、`channels.telegram.proxy` を通してTelegram API呼び出しをルーティングしてください:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ のデフォルトは `autoSelectFamily=true`（WSL2を除く）かつ `dnsResultOrder=ipv4first` です。
    - ホストがWSL2であるか、明示的にIPv4のみの動作の方がうまくいく場合は、ファミリー選択を強制してください:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 ベンチマーク範囲の応答（`198.18.0.0/15`）は、Telegramメディアダウンロードに対してすでにデフォルトで許可されています。信頼できる fake-IP または
      transparent proxy が、メディアダウンロード中に `api.telegram.org` を別の
      private/internal/special-use アドレスに書き換える場合は、Telegram専用の
      バイパスをオプトインできます:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じオプトインはアカウントごとにも
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
      で利用できます。
    - proxy がTelegramメディアホストを `198.18.x.x` に解決する場合は、まず
      dangerous フラグをオフのままにしてください。TelegramメディアはすでにRFC 2544
      ベンチマーク範囲をデフォルトで許可しています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` はTelegram
      メディアのSSRF保護を弱めます。これは、Clash、Mihomo、Surge の fake-IP ルーティングのように、
      RFC 2544 ベンチマーク範囲外の private または special-use 応答を合成する、
      信頼されたオペレーター管理下のproxy環境でのみ使用してください。通常の公開インターネット経由のTelegramアクセスでは無効のままにしてください。
    </Warning>

    - 環境変数オーバーライド（一時的）:
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS応答を確認するには:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

詳細: [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

## Telegram configリファレンスポインタ

主要リファレンス:

- `channels.telegram.enabled`: チャネル起動を有効/無効にします。
- `channels.telegram.botToken`: ボットトークン（BotFather）。
- `channels.telegram.tokenFile`: 通常ファイルのパスからトークンを読み込みます。シンボリックリンクは拒否されます。
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）。
- `channels.telegram.allowFrom`: DM許可リスト（数値のTelegramユーザーID）。`allowlist` には少なくとも1つの送信者IDが必要です。`open` には `"*"` が必要です。`openclaw doctor --fix` は、従来の `@username` 項目をIDに解決でき、allowlist 移行フローではペアリングストアファイルから allowlist 項目を復旧することもできます。
- `channels.telegram.actions.poll`: Telegram投票作成を有効または無効にします（デフォルト: 有効。引き続き `sendMessage` が必要です）。
- `channels.telegram.defaultTo`: 明示的な `--reply-to` が指定されていないときに、CLI の `--deliver` で使用されるデフォルトのTelegramターゲット。
- `channels.telegram.groupPolicy`: `open | allowlist | disabled`（デフォルト: allowlist）。
- `channels.telegram.groupAllowFrom`: グループ送信者許可リスト（数値のTelegramユーザーID）。`openclaw doctor --fix` は従来の `@username` 項目をIDに解決できます。数値でない項目は認証時に無視されます。グループ認証ではDMペアリングストアのフォールバックは使用しません（`2026.2.25+`）。
- マルチアカウントの優先順位:
  - 2つ以上のアカウントIDが設定されている場合、デフォルトルーティングを明示するために `channels.telegram.defaultAccount` を設定するか、`channels.telegram.accounts.default` を含めてください。
  - どちらも設定されていない場合、OpenClaw は正規化された最初のアカウントIDにフォールバックし、`openclaw doctor` が警告します。
  - `channels.telegram.accounts.default.allowFrom` と `channels.telegram.accounts.default.groupAllowFrom` は `default` アカウントにのみ適用されます。
  - 名前付きアカウントは、アカウントレベルの値が未設定の場合、`channels.telegram.allowFrom` と `channels.telegram.groupAllowFrom` を継承します。
  - 名前付きアカウントは `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom` を継承しません。
- `channels.telegram.groups`: グループごとのデフォルト + 許可リスト（グローバルデフォルトには `"*"` を使用）。
  - `channels.telegram.groups.<id>.groupPolicy`: groupPolicy のグループごとのオーバーライド（`open | allowlist | disabled`）。
  - `channels.telegram.groups.<id>.requireMention`: メンションゲートのデフォルト。
  - `channels.telegram.groups.<id>.skills`: skill フィルター（省略 = すべての Skills、空 = なし）。
  - `channels.telegram.groups.<id>.allowFrom`: グループごとの送信者許可リストオーバーライド。
  - `channels.telegram.groups.<id>.systemPrompt`: そのグループ向けの追加システムプロンプト。
  - `channels.telegram.groups.<id>.enabled`: `false` の場合はそのグループを無効化します。
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: トピックごとのオーバーライド（グループフィールド + トピック専用の `agentId`）。
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: このトピックを特定の agent にルーティングします（グループレベルおよびバインディングルーティングを上書き）。
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: groupPolicy のトピックごとのオーバーライド（`open | allowlist | disabled`）。
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: メンションゲートのトピックごとのオーバーライド。
- `match.peer.id` に正規のトピックID `chatId:topic:topicId` を持つトップレベル `bindings[]` と `type: "acp"`: 永続的ACPトピックバインディングフィールド（[ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) を参照）。
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: DMトピックを特定の agent にルーティングします（フォーラムトピックと同じ動作）。
- `channels.telegram.execApprovals.enabled`: このアカウントでTelegramをチャットベースのexec承認クライアントとして有効にします。
- `channels.telegram.execApprovals.approvers`: execリクエストの承認または拒否を許可されたTelegramユーザーID。`channels.telegram.allowFrom` またはダイレクトな `channels.telegram.defaultTo` がすでにオーナーを識別している場合は任意です。
- `channels.telegram.execApprovals.target`: `dm | channel | both`（デフォルト: `dm`）。`channel` と `both` は、存在する場合、元のTelegramトピックを維持します。
- `channels.telegram.execApprovals.agentFilter`: 転送される承認プロンプト用の任意の agent ID フィルター。
- `channels.telegram.execApprovals.sessionFilter`: 転送される承認プロンプト用の任意のセッションキーフィルター（部分文字列または正規表現）。
- `channels.telegram.accounts.<account>.execApprovals`: Telegram exec承認ルーティングと承認者認可のアカウントごとのオーバーライド。
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist`（デフォルト: allowlist）。
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: アカウントごとのオーバーライド。
- `channels.telegram.commands.nativeSkills`: Telegramネイティブ Skills コマンドを有効/無効にします。
- `channels.telegram.replyToMode`: `off | first | all`（デフォルト: `off`）。
- `channels.telegram.textChunkLimit`: 送信チャンクサイズ（文字数）。
- `channels.telegram.chunkMode`: `length`（デフォルト）または `newline`。長さでチャンク化する前に空行（段落境界）で分割します。
- `channels.telegram.linkPreview`: 送信メッセージのリンクプレビューを切り替えます（デフォルト: true）。
- `channels.telegram.streaming`: `off | partial | block | progress`（ライブストリームプレビュー。デフォルト: `partial`。`progress` は `partial` にマップされます。`block` は従来のプレビューモード互換）。Telegramのプレビュー配信は、その場で編集される単一のプレビューメッセージを使用します。
- `channels.telegram.mediaMaxMb`: 受信/送信Telegramメディア上限（MB、デフォルト: 100）。
- `channels.telegram.retry`: 回復可能な送信APIエラーに対するTelegram送信ヘルパー（CLI/tools/actions）用の再試行ポリシー（attempts, minDelayMs, maxDelayMs, jitter）。
- `channels.telegram.network.autoSelectFamily`: Node の autoSelectFamily を上書きします（true=有効、false=無効）。デフォルトではNode 22+で有効で、WSL2ではデフォルトで無効です。
- `channels.telegram.network.dnsResultOrder`: DNS結果順序を上書きします（`ipv4first` または `verbatim`）。デフォルトではNode 22+で `ipv4first` です。
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: 信頼できる fake-IP または transparent-proxy 環境向けの危険なオプトイン。これらの環境では、Telegramメディアダウンロード時に `api.telegram.org` がデフォルトのRFC 2544ベンチマーク範囲許可外の private/internal/special-use アドレスに解決されます。
- `channels.telegram.proxy`: Bot API呼び出し用のproxy URL（SOCKS/HTTP）。
- `channels.telegram.webhookUrl`: Webhookモードを有効にします（`channels.telegram.webhookSecret` が必要）。
- `channels.telegram.webhookSecret`: Webhookシークレット（webhookUrl が設定されている場合は必須）。
- `channels.telegram.webhookPath`: ローカルWebhookパス（デフォルト `/telegram-webhook`）。
- `channels.telegram.webhookHost`: ローカルWebhookバインドホスト（デフォルト `127.0.0.1`）。
- `channels.telegram.webhookPort`: ローカルWebhookバインドポート（デフォルト `8787`）。
- `channels.telegram.actions.reactions`: Telegramツールリアクションをゲートします。
- `channels.telegram.actions.sendMessage`: Telegramツールメッセージ送信をゲートします。
- `channels.telegram.actions.deleteMessage`: Telegramツールメッセージ削除をゲートします。
- `channels.telegram.actions.sticker`: Telegramステッカーアクション（送信と検索）をゲートします（デフォルト: false）。
- `channels.telegram.reactionNotifications`: `off | own | all` — どのリアクションがシステムイベントをトリガーするかを制御します（未設定時のデフォルト: `own`）。
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — agent のリアクション機能を制御します（未設定時のデフォルト: `minimal`）。
- `channels.telegram.errorPolicy`: `reply | silent` — エラー返信動作を制御します（デフォルト: `reply`）。アカウント/グループ/トピックごとのオーバーライドに対応。
- `channels.telegram.errorCooldownMs`: 同じチャットへのエラー返信の最小ミリ秒間隔（デフォルト: `60000`）。障害中のエラースパムを防ぎます。

- [設定リファレンス - Telegram](/ja-JP/gateway/configuration-reference#telegram)

Telegram固有の高シグナルなフィールド:

- 起動/認証: `enabled`, `botToken`, `tokenFile`, `accounts.*`（`tokenFile` は通常ファイルを指している必要があります。シンボリックリンクは拒否されます）
- アクセス制御: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, トップレベル `bindings[]`（`type: "acp"`）
- exec承認: `execApprovals`, `accounts.*.execApprovals`
- コマンド/メニュー: `commands.native`, `commands.nativeSkills`, `customCommands`
- スレッド/返信: `replyToMode`
- ストリーミング: `streaming`（プレビュー）, `blockStreaming`
- 書式設定/配信: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- メディア/ネットワーク: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- アクション/機能: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- リアクション: `reactionNotifications`, `reactionLevel`
- エラー: `errorPolicy`, `errorCooldownMs`
- 書き込み/履歴: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [セキュリティ](/ja-JP/gateway/security)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [マルチagentルーティング](/ja-JP/concepts/multi-agent)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
