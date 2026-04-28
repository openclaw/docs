---
read_when:
    - Telegram 機能やWebhookの作業
summary: Telegram bot サポートのステータス、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-04-26T11:24:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7d269b15bc2d377fa45f0516e435517ed366c0216d0bc31fe4f4bc080a6c726
    source_path: channels/telegram.md
    workflow: 15
---

grammY経由で、botのDMおよびグループに本番対応しています。デフォルトモードはlong pollingで、webhookモードは任意です。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    Telegram のデフォルトDMポリシーはペアリングです。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断および修復プレイブック。
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャネル設定パターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="BotFatherでbotトークンを作成する">
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
    Telegram は `openclaw channels login telegram` を使用しません。config/env にトークンを設定してから、gateway を起動してください。

  </Step>

  <Step title="gatewayを起動し、最初のDMを承認する">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    ペアリングコードの有効期限は1時間です。

  </Step>

  <Step title="botをグループに追加する">
    botをグループに追加し、その後 `channels.telegram.groups` と `groupPolicy` をアクセスモデルに合わせて設定します。
  </Step>
</Steps>

<Note>
トークン解決順序はアカウント対応です。実際には、config値がenvフォールバックより優先され、`TELEGRAM_BOT_TOKEN` はデフォルトアカウントにのみ適用されます。
</Note>

## Telegram 側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループ可視性">
    Telegram botはデフォルトで **Privacy Mode** になっており、受信できるグループメッセージが制限されます。

    botがすべてのグループメッセージを見る必要がある場合は、次のいずれかを行います。

    - `/setprivacy` でプライバシーモードを無効にする
    - botをグループ管理者にする

    プライバシーモードを切り替えたときは、Telegramが変更を適用できるように、各グループでbotを削除して再追加してください。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスはTelegramのグループ設定で制御されます。

    管理者botはすべてのグループメッセージを受信するため、常時動作するグループ動作に役立ちます。

  </Accordion>

  <Accordion title="役立つBotFatherの切り替え項目">

    - グループ追加を許可/拒否する `/setjoingroups`
    - グループ可視性動作用の `/setprivacy`

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
    空の `allowFrom` で `dmPolicy: "allowlist"` を指定すると、すべてのDMがブロックされ、config検証で拒否されます。
    セットアップでは数値のユーザーIDのみが求められます。
    アップグレード済みで config に `@username` の許可リストエントリがある場合は、`openclaw doctor --fix` を実行して解決してください（ベストエフォートであり、Telegram botトークンが必要です）。
    以前にペアリングストアの許可リストファイルに依存していた場合、`openclaw doctor --fix` によって、allowlist フローでエントリを `channels.telegram.allowFrom` に復旧できます（たとえば `dmPolicy: "allowlist"` にまだ明示的なIDがない場合）。

    単一オーナーのbotでは、以前のペアリング承認に依存するのではなく、アクセスポリシーをconfig内で持続的に保つために、明示的な数値 `allowFrom` IDを使った `dmPolicy: "allowlist"` を推奨します。

    よくある混同: DMペアリング承認は「この送信者がどこでも認可される」という意味ではありません。
    ペアリングが付与するのはDMアクセスのみです。グループ送信者の認可は、引き続き明示的なconfig許可リストから行われます。
    「一度認可されれば、DMもグループコマンドも動く」ようにしたい場合は、自分の数値TelegramユーザーIDを `channels.telegram.allowFrom` に入れてください。

    ### 自分のTelegramユーザーIDを見つける

    より安全な方法（サードパーティbot不要）:

    1. botにDMを送る。
    2. `openclaw logs --follow` を実行する。
    3. `from.id` を読む。

    公式Bot APIメソッド:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティの方法（プライバシーはやや低い）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーと許可リスト">
    2つの制御が一緒に適用されます。

    1. **どのグループが許可されるか**（`channels.telegram.groups`）
       - `groups` config がない場合:
         - `groupPolicy: "open"` の場合: どのグループでもグループIDチェックを通過可能
         - `groupPolicy: "allowlist"`（デフォルト）の場合: `groups` エントリ（または `"*"`）を追加するまでグループはブロックされる
       - `groups` が設定されている場合: 許可リストとして機能する（明示的なIDまたは `"*"`）

    2. **グループ内でどの送信者が許可されるか**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（デフォルト）
       - `disabled`

    `groupAllowFrom` はグループ送信者フィルタリングに使用されます。設定されていない場合、Telegram は `allowFrom` にフォールバックします。
    `groupAllowFrom` エントリは数値のTelegramユーザーIDである必要があります（`telegram:` / `tg:` プレフィックスは正規化されます）。
    `groupAllowFrom` にTelegramグループまたはsupergroupのチャットIDを入れないでください。負のチャットIDは `channels.telegram.groups` の下に置きます。
    非数値エントリは送信者認可では無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ送信者認可はDMペアリングストア承認を継承しません。
    ペアリングは引き続きDM専用です。グループでは `groupAllowFrom` またはグループごと/トピックごとの `allowFrom` を設定してください。
    `groupAllowFrom` が未設定の場合、Telegram はペアリングストアではなく config の `allowFrom` にフォールバックします。
    単一オーナーのbot向けの実用パターン: 自分のユーザーIDを `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにして、対象グループを `channels.telegram.groups` で許可します。
    実行時の注意: `channels.telegram` が完全に存在しない場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、実行時デフォルトはフェイルクローズドの `groupPolicy="allowlist"` になります。

    例: 特定の1つのグループで任意のメンバーを許可する:

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

    例: 特定の1つのグループ内で特定のユーザーのみ許可する:

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
      よくあるミス: `groupAllowFrom` はTelegramグループ許可リストではありません。

      - `-1001234567890` のような負のTelegramグループまたはsupergroupチャットIDは `channels.telegram.groups` の下に置いてください。
      - 許可されたグループ内で、どの人がbotをトリガーできるかを制限したい場合は、`8734062810` のようなTelegramユーザーIDを `groupAllowFrom` の下に置いてください。
      - 許可されたグループの任意のメンバーがbotと話せるようにしたい場合にのみ、`groupAllowFrom: ["*"]` を使用してください。

    </Warning>

  </Tab>

  <Tab title="メンション動作">
    グループ返信はデフォルトでメンションが必要です。

    メンションは次のいずれかから取得できます。

    - ネイティブの `@botusername` メンション
    - 次の中のメンションパターン:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    セッションレベルのコマンド切り替え:

    - `/activation always`
    - `/activation mention`

    これらはセッション状態のみを更新します。永続化にはconfigを使用してください。

    永続的なconfig例:

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
    - または Bot API `getUpdates` を確認する

  </Tab>
</Tabs>

## 実行時の動作

- Telegram はgatewayプロセスによって所有されます。
- ルーティングは決定的です。Telegram の受信メッセージには Telegram に返信します（モデルがチャネルを選ぶことはありません）。
- 受信メッセージは、返信メタデータとメディアプレースホルダーを含む共有チャネルエンベロープに正規化されます。
- グループセッションはグループIDごとに分離されます。forum topics には `:topic:<threadId>` が追加され、トピックが分離されます。
- DMメッセージは `message_thread_id` を含むことができ、OpenClaw はそれをスレッド対応セッションキーでルーティングし、返信用にスレッドIDを保持します。
- Long polling は、チャットごと/スレッドごとのシーケンシングを伴う grammY runner を使用します。全体のrunner sink並行数には `agents.defaults.maxConcurrent` を使用します。
- Long polling は各gatewayプロセス内で保護されているため、1つのアクティブpollerだけが同時に1つのbotトークンを使用できます。それでも `getUpdates` の409競合が表示される場合は、別の OpenClaw gateway、スクリプト、または外部pollerが同じトークンを使用している可能性があります。
- Long-polling watchdog の再起動は、デフォルトで `getUpdates` の完了した生存確認が120秒間ないとトリガーされます。長時間実行の作業中に誤検知のpolling-stall再起動がまだ発生するデプロイでは、`channels.telegram.pollingStallThresholdMs` を増やしてください。値はミリ秒で、`30000` から `600000` まで許可されます。アカウントごとの上書きにも対応しています。
- Telegram Bot API は既読通知をサポートしていません（`sendReadReceipts` は適用されません）。

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClaw は、部分的な返信をリアルタイムでストリーミングできます。

    - ダイレクトチャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming` は `off | partial | block | progress`（デフォルト: `partial`）
    - `progress` はTelegramでは `partial` にマップされます（チャネル横断の命名との互換性のため）
    - `streaming.preview.toolProgress` は、ツール/進捗更新で同じ編集済みプレビューメッセージを再利用するかを制御します（デフォルト: プレビューストリーミングが有効な場合は `true`）
    - 従来の `channels.telegram.streamMode` およびbooleanの `streaming` 値は検出されます。`openclaw doctor --fix` を実行して `channels.telegram.streaming.mode` に移行してください

    ツール進捗のプレビュー更新は、ツール実行中に表示される短い「Working...」行です。たとえばコマンド実行、ファイル読み取り、計画更新、パッチ要約などです。Telegram では、`v2026.4.22` 以降のリリース済み OpenClaw の動作に合わせるため、これらはデフォルトで有効になっています。回答テキスト用の編集済みプレビューは維持しつつ、ツール進捗行は非表示にしたい場合は、次のように設定します。

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

    `streaming.mode: "off"` は、Telegram のプレビュー編集を完全に無効にしたい場合にのみ使用してください。ツール進捗ステータス行だけを無効にしたい場合は、`streaming.preview.toolProgress: false` を使用してください。

    テキストのみの返信の場合:

    - DM: OpenClaw は同じプレビューメッセージを維持し、最終的にその場で編集します（2通目のメッセージは送信されません）
    - グループ/トピック: OpenClaw は同じプレビューメッセージを維持し、最終的にその場で編集します（2通目のメッセージは送信されません）

    複雑な返信（たとえばメディアペイロード）の場合、OpenClaw は通常の最終配信にフォールバックし、その後プレビューメッセージをクリーンアップします。

    プレビューストリーミングはblock streamingとは別です。Telegram でblock streamingが明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためにプレビューストリームをスキップします。

    ネイティブのドラフト転送が利用不可または拒否された場合、OpenClaw は自動的に `sendMessage` + `editMessageText` にフォールバックします。

    Telegram専用のreasoningストリーム:

    - `/reasoning stream` は生成中のreasoningをライブプレビューに送信します
    - 最終回答はreasoningテキストなしで送信されます

  </Accordion>

  <Accordion title="書式設定とHTMLフォールバック">
    送信テキストは Telegram `parse_mode: "HTML"` を使用します。

    - Markdown風テキストは、Telegramで安全なHTMLにレンダリングされます。
    - 生のモデルHTMLは、Telegramのパース失敗を減らすためにエスケープされます。
    - Telegramがパース済みHTMLを拒否した場合、OpenClaw はプレーンテキストとして再試行します。

    リンクプレビューはデフォルトで有効で、`channels.telegram.linkPreview: false` で無効にできます。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegramのコマンドメニュー登録は、起動時に `setMyCommands` で処理されます。

    ネイティブコマンドのデフォルト:

    - `commands.native: "auto"` でTelegramのネイティブコマンドが有効になります

    カスタムコマンドメニュー項目の追加:

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
    - 有効なパターン: `a-z`, `0-9`, `_`、長さ `1..32`
    - カスタムコマンドはネイティブコマンドを上書きできません
    - 競合/重複はスキップされ、ログに記録されます

    注意:

    - カスタムコマンドはメニュー項目のみであり、動作は自動実装されません
    - Plugin/skill コマンドは、Telegramメニューに表示されていなくても、入力すれば引き続き動作する場合があります

    ネイティブコマンドが無効な場合、組み込みコマンドは削除されます。設定されていれば、カスタム/plugin コマンドは引き続き登録される場合があります。

    よくあるセットアップ失敗:

    - `setMyCommands failed` で `BOT_COMMANDS_TOO_MUCH` が出る場合、削減後でもTelegramメニューがまだ上限を超えています。plugin/skill/カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効にしてください。
    - `setMyCommands failed` でnetwork/fetchエラーが出る場合、通常は `api.telegram.org` への送信DNS/HTTPSがブロックされています。

    ### デバイスペアリングコマンド（`device-pair` Plugin）

    `device-pair` Plugin がインストールされている場合:

    1. `/pair` でセットアップコードを生成する
    2. iOSアプリにコードを貼り付ける
    3. `/pair pending` で保留中のリクエスト一覧を表示する（role/scopes を含む）
    4. リクエストを承認する:
       - 明示的に承認するには `/pair approve <requestId>`
       - 保留中のリクエストが1件だけのときは `/pair approve`
       - 最新のものには `/pair approve latest`

    セットアップコードには短期間有効なbootstrap tokenが含まれます。組み込みのbootstrap handoff により、プライマリ Node token は `scopes: []` のまま維持されます。引き渡されたoperator token は、`operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write` に制限されたままです。Bootstrap scope チェックはroleプレフィックス付きなので、そのoperator許可リストはoperatorリクエストのみを満たします。非operator role は引き続き自身のroleプレフィックス配下のscopesが必要です。

    デバイスが変更された認証詳細（たとえば role/scopes/public key）で再試行した場合、以前の保留リクエストは置き換えられ、新しいリクエストは別の `requestId` を使用します。承認前に `/pair pending` を再実行してください。

    詳細: [Pairing](/ja-JP/channels/pairing#pair-via-telegram-recommended-for-ios)

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

    コールバッククリックは、次のテキストとしてエージェントに渡されます:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="エージェントおよび自動化向けのTelegramメッセージアクション">
    Telegramツールアクションには次が含まれます:

    - `sendMessage`（`to`, `content`, 任意で `mediaUrl`, `replyToMessageId`, `messageThreadId`）
    - `react`（`chatId`, `messageId`, `emoji`）
    - `deleteMessage`（`chatId`, `messageId`）
    - `editMessage`（`chatId`, `messageId`, `content`）
    - `createForumTopic`（`chatId`, `name`, 任意で `iconColor`, `iconCustomEmojiId`）

    チャネルメッセージアクションは使いやすいエイリアスを提供します（`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`）。

    ゲーティング制御:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（デフォルト: 無効）

    注意: `edit` と `topic-create` は現在デフォルトで有効で、個別の `channels.telegram.actions.*` トグルはありません。
    実行時の送信では、アクティブなconfig/secretsスナップショット（起動時/リロード時）を使用するため、アクション経路では送信ごとにアドホックな SecretRef 再解決は行いません。

    リアクション削除のセマンティクス: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="返信スレッディングタグ">
    Telegramは、生成された出力内の明示的な返信スレッディングタグをサポートします:

    - `[[reply_to_current]]` はトリガー元メッセージに返信します
    - `[[reply_to:<id>]]` は特定のTelegramメッセージIDに返信します

    `channels.telegram.replyToMode` が処理方法を制御します:

    - `off`（デフォルト）
    - `first`
    - `all`

    返信スレッディングが有効で、元のTelegramテキストまたはキャプションが利用可能な場合、OpenClaw はネイティブのTelegram引用抜粋を自動的に含めます。Telegramのネイティブ引用テキストは1024 UTF-16コードユニットに制限されているため、長いメッセージは先頭から引用され、Telegramが引用を拒否した場合はプレーンな返信にフォールバックします。

    注意: `off` は暗黙的な返信スレッディングを無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="Forum topics とスレッド動作">
    Forum supergroups:

    - トピックセッションキーには `:topic:<threadId>` が追加されます
    - 返信と入力中表示はトピックスレッドを対象にします
    - トピック設定パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    General topic（`threadId=1`）の特別扱い:

    - メッセージ送信では `message_thread_id` を省略します（Telegramは `sendMessage(...thread_id=1)` を拒否します）
    - 入力中アクションには引き続き `message_thread_id` が含まれます

    トピック継承: トピックエントリは、上書きされない限りグループ設定を継承します（`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`）。
    `agentId` はトピック専用で、グループデフォルトからは継承されません。

    **トピックごとのエージェントルーティング**: 各トピックは、トピックconfigで `agentId` を設定することで、別のエージェントにルーティングできます。これにより、各トピックが独自の分離されたワークスペース、メモリ、セッションを持てます。例:

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

    **永続的なACPトピックバインディング**: Forum topics は、トップレベルの型付きACP bindings（`type: "acp"` を持つ `bindings[]` と、`match.channel: "telegram"`、`peer.kind: "group"`、および `-1001234567890:topic:42` のようなトピック修飾ID）を通じてACPハーネスセッションを固定できます。現在は、グループ/supergroup 内の forum topics に限定されています。[ACP Agents](/ja-JP/tools/acp-agents)を参照してください。

    **チャットからのスレッドバインドACP起動**: `/acp spawn <agent> --thread here|auto` は、現在のトピックを新しいACPセッションにバインドし、その後のやり取りはそこへ直接ルーティングされます。OpenClaw は起動確認をトピック内にピン留めします。`channels.telegram.threadBindings.spawnAcpSessions=true` が必要です。

    テンプレートコンテキストは `MessageThreadId` と `IsForum` を公開します。`message_thread_id` を持つDMチャットはDMルーティングを維持しつつ、スレッド対応セッションキーを使用します。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegramは、ボイスノートと音声ファイルを区別します。

    - デフォルト: 音声ファイル動作
    - エージェント返信内のタグ `[[audio_as_voice]]` でボイスノート送信を強制
    - 受信したボイスノートの文字起こしは、エージェントコンテキスト内で機械生成の信頼されていないテキストとしてフレーム化されます。メンション検出は引き続き生の文字起こしを使用するため、メンションゲート付きの音声メッセージも引き続き動作します。

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

    Telegramは、動画ファイルとvideo notesを区別します。

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

    Video notes はキャプションをサポートしていません。指定したメッセージテキストは別送信されます。

    ### ステッカー

    受信ステッカー処理:

    - 静的WEBP: ダウンロードして処理（プレースホルダー `<media:sticker>`）
    - アニメーションTGS: スキップ
    - 動画WEBM: スキップ

    ステッカーコンテキストフィールド:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ステッカーキャッシュファイル:

    - `~/.openclaw/telegram/sticker-cache.json`

    ステッカーは（可能な場合）一度だけ説明が生成され、繰り返しのvision呼び出しを減らすためにキャッシュされます。

    ステッカーアクションを有効化:

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
    Telegramのリアクションは `message_reaction` 更新として届きます（メッセージペイロードとは別）。

    有効時、OpenClaw は次のようなシステムイベントをキューに入れます:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定:

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    注意:

    - `own` は、botが送信したメッセージに対するユーザーリアクションのみを意味します（送信メッセージキャッシュによるベストエフォート）。
    - リアクションイベントもTelegramのアクセス制御（`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`）に従います。未認可の送信者は破棄されます。
    - Telegramはリアクション更新にスレッドIDを提供しません。
      - non-forum グループはグループチャットセッションにルーティングされます
      - forum グループは、元の正確なトピックではなく、グループのgeneral-topicセッション（`:topic:1`）にルーティングされます

    polling/webhook の `allowed_updates` には、自動的に `message_reaction` が含まれます。

  </Accordion>

  <Accordion title="Ackリアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理中に確認用の絵文字を送信します。

    解決順序:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェントidentity絵文字へのフォールバック（`agents.list[].identity.emoji`、なければ `"👀"`）

    注意:

    - Telegramはunicode絵文字を期待します（たとえば `"👀"`）。
    - チャネルまたはアカウントでリアクションを無効にするには `""` を使用します。

  </Accordion>

  <Accordion title="Telegramイベントおよびコマンドからのconfig書き込み">
    チャネルconfig書き込みはデフォルトで有効です（`configWrites !== false`）。

    Telegramトリガーの書き込みには次が含まれます:

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

  <Accordion title="Long polling と webhook">
    デフォルトはlong pollingです。webhookモードを使用するには `channels.telegram.webhookUrl` と `channels.telegram.webhookSecret` を設定します。任意で `webhookPath`, `webhookHost`, `webhookPort` も設定できます（デフォルトは `/telegram-webhook`, `127.0.0.1`, `8787`）。

    ローカルリスナーは `127.0.0.1:8787` にバインドします。公開インバウンドを使う場合は、ローカルポートの前段にリバースプロキシを置くか、意図的に `webhookHost: "0.0.0.0"` を設定してください。

    Webhookモードでは、Telegram に `200` を返す前に、リクエストガード、Telegram secret token、JSONボディを検証します。
    その後、OpenClaw はlong pollingで使われるのと同じチャットごと/トピックごとのbotレーンを通じて更新を非同期に処理するため、遅いエージェントターンがTelegramの配信ACKを保持することはありません。

  </Accordion>

  <Accordion title="制限、リトライ、CLIターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは4000です。
    - `channels.telegram.chunkMode="newline"` は、長さで分割する前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト100）は、Telegramの受信および送信メディアサイズの上限です。
    - `channels.telegram.timeoutSeconds` はTelegram APIクライアントのタイムアウトを上書きします（未設定の場合は grammY のデフォルトが適用されます）。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは `120000` です。`30000` から `600000` の範囲で調整するのは、polling-stall再起動の誤検知がある場合のみにしてください。
    - グループコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit` を使用します（デフォルト50）。`0` で無効になります。
    - reply/quote/forward の補足コンテキストは現在、受信時のまま渡されます。
    - Telegramの許可リストは主に、誰がエージェントをトリガーできるかを制御するものであり、補足コンテキスト全体の秘匿境界ではありません。
    - DM履歴の制御:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` config は、回復可能な送信APIエラーに対するTelegram送信ヘルパー（CLI/tools/actions）に適用されます。

    CLI送信ターゲットには数値チャットIDまたはユーザー名を使用できます:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegramのpollでは `openclaw message poll` を使用し、forum topics をサポートします:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram専用のpollフラグ:

    - `--poll-duration-seconds`（5-600）
    - `--poll-anonymous`
    - `--poll-public`
    - forum topics 用の `--thread-id`（または `:topic:` ターゲットを使用）

    Telegram送信では、次もサポートされます:

    - `channels.telegram.capabilities.inlineButtons` が許可している場合、インラインキーボード用の `buttons` ブロックを含む `--presentation`
    - botがそのチャットでピン留めできる場合、ピン留め配信を要求する `--pin` または `--delivery '{"pin":true}'`
    - 送信画像およびGIFを、圧縮された写真やアニメーションメディアアップロードではなくドキュメントとして送信する `--force-document`

    アクションゲーティング:

    - `channels.telegram.actions.sendMessage=false` は、poll を含むTelegram送信メッセージを無効にします
    - `channels.telegram.actions.poll=false` は、通常送信を有効のままにしてTelegram poll作成を無効にします

  </Accordion>

  <Accordion title="Telegramでのexec承認">
    Telegramは、承認者DMでのexec承認をサポートし、必要に応じて元のチャットまたはトピックにもプロンプトを投稿できます。承認者は数値のTelegramユーザーIDである必要があります。

    configパス:

    - `channels.telegram.execApprovals.enabled`（少なくとも1人の承認者が解決可能な場合に自動有効化）
    - `channels.telegram.execApprovals.approvers`（`allowFrom` / `defaultTo` の数値オーナーIDにフォールバック）
    - `channels.telegram.execApprovals.target`: `dm`（デフォルト） | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    チャネル配信ではコマンドテキストがチャットに表示されます。`channel` または `both` を有効にするのは、信頼できるグループ/トピックでのみにしてください。forum topic にプロンプトが届く場合、OpenClaw は承認プロンプトとその後のやり取りの両方でそのトピックを保持します。exec承認のデフォルト有効期限は30分です。

    インライン承認ボタンでも、ターゲットサーフェス（`dm`, `group`, `all`）を許可する `channels.telegram.capabilities.inlineButtons` が必要です。`plugin:` プレフィックス付きの承認IDはplugin approvals を通じて解決され、それ以外はまずexec approvals として解決されます。

    [Exec approvals](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## エラー返信の制御

エージェントが配信エラーまたはプロバイダーエラーに遭遇した場合、Telegramではエラーテキストで返信するか、抑制するかを選べます。この動作は2つのconfigキーで制御されます。

| キー | 値 | デフォルト | 説明 |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy` | `reply`, `silent` | `reply` | `reply` はフレンドリーなエラーメッセージをチャットに送信します。`silent` はエラー返信を完全に抑制します。 |
| `channels.telegram.errorCooldownMs` | number (ms) | `60000` | 同じチャットへのエラー返信の最小間隔。障害時のエラースパムを防ぎます。 |

アカウントごと、グループごと、トピックごとの上書きをサポートします（他のTelegram configキーと同じ継承）。

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
  <Accordion title="botがメンションなしのグループメッセージに応答しない">

    - `requireMention=false` の場合、Telegramのprivacy mode が完全可視性を許可している必要があります。
      - BotFather: `/setprivacy` -> Disable
      - その後、グループからbotを削除して再追加
    - `openclaw channels status` は、config がメンションなしのグループメッセージを期待している場合に警告を出します。
    - `openclaw channels status --probe` は明示的な数値グループIDを確認できます。ワイルドカード `"*"` はメンバーシップのprobeができません。
    - セッションの簡易テスト: `/activation always`

  </Accordion>

  <Accordion title="botがグループメッセージをまったく見ていない">

    - `channels.telegram.groups` が存在する場合、グループがそこに列挙されている必要があります（または `"*"` を含める）
    - botがグループに参加していることを確認
    - ログ確認: スキップ理由は `openclaw logs --follow`

  </Accordion>

  <Accordion title="コマンドが部分的にしか動かない、またはまったく動かない">

    - 自分の送信者アイデンティティを認可する（ペアリングおよび/または数値 `allowFrom`）
    - グループポリシーが `open` でも、コマンド認可は引き続き適用されます
    - `setMyCommands failed` で `BOT_COMMANDS_TOO_MUCH` が出る場合、ネイティブメニューの項目数が多すぎます。plugin/skill/カスタムコマンドを減らすか、ネイティブメニューを無効にしてください
    - `setMyCommands failed` でnetwork/fetchエラーが出る場合、通常は `api.telegram.org` へのDNS/HTTPS到達性の問題です

  </Accordion>

  <Accordion title="Pollingまたはネットワークの不安定性">

    - Node 22+ + custom fetch/proxy では、AbortSignal型の不一致があると即時abort動作が起きる場合があります。
    - 一部のホストでは `api.telegram.org` が最初にIPv6へ解決されます。IPv6送信経路が壊れていると、Telegram API障害が断続的に発生することがあります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれる場合、OpenClaw はこれらを回復可能なネットワークエラーとして再試行するようになりました。
    - ログに `Polling stall detected` が含まれる場合、OpenClaw はデフォルトで120秒間、完了したlong-poll生存確認がないとpollingを再起動し、Telegram transport を再構築します。
    - `channels.telegram.pollingStallThresholdMs` を増やすのは、長時間実行の `getUpdates` 呼び出しが正常なのに、ホストで誤ったpolling-stall再起動が報告される場合のみにしてください。継続的なstallは通常、ホストと `api.telegram.org` の間のproxy、DNS、IPv6、TLS送信経路の問題を示します。
    - 直接の送信経路/TLSが不安定なVPSホストでは、`channels.telegram.proxy` を通してTelegram API呼び出しをルーティングしてください:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ のデフォルトは `autoSelectFamily=true`（WSL2を除く）および `dnsResultOrder=ipv4first` です。
    - ホストがWSL2である、または明示的にIPv4のみの動作の方が適している場合は、family selection を強制してください:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544ベンチマーク範囲の応答（`198.18.0.0/15`）は、Telegramメディアダウンロードではデフォルトで許可されています。信頼できるfake-IPまたは透過プロキシが、メディアダウンロード中に `api.telegram.org` を他のprivate/internal/special-useアドレスへ書き換える場合は、Telegram専用バイパスを明示的に有効化できます:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じ明示的設定はアカウントごとにも
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
      で利用できます。
    - proxy がTelegramメディアホストを `198.18.x.x` に解決する場合は、まず dangerous フラグをオフのままにしてください。TelegramメディアではRFC 2544ベンチマーク範囲がすでにデフォルトで許可されています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` はTelegram
      メディアのSSRF保護を弱めます。これは、Clash、Mihomo、Surgeの
      fake-IPルーティングのような、オペレーターが管理する信頼済みproxy環境で、
      RFC 2544ベンチマーク範囲外のprivateまたはspecial-use応答を合成する場合にのみ使用してください。
      通常のパブリックインターネット経由のTelegramアクセスではオフのままにしてください。
    </Warning>

    - 環境変数による上書き（一時的）:
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS応答を確認する:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

詳細なヘルプ: [Channel troubleshooting](/ja-JP/channels/troubleshooting)。

## 設定リファレンス

主なリファレンス: [Configuration reference - Telegram](/ja-JP/gateway/config-channels#telegram)。

<Accordion title="重要なTelegramフィールド">

- 起動/認証: `enabled`, `botToken`, `tokenFile`, `accounts.*`（`tokenFile` は通常ファイルを指している必要があり、symlinkは拒否されます）
- アクセス制御: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, トップレベルの `bindings[]`（`type: "acp"`）
- exec承認: `execApprovals`, `accounts.*.execApprovals`
- コマンド/メニュー: `commands.native`, `commands.nativeSkills`, `customCommands`
- スレッディング/返信: `replyToMode`
- ストリーミング: `streaming`（プレビュー）, `streaming.preview.toolProgress`, `blockStreaming`
- 書式/配信: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- メディア/ネットワーク: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- アクション/機能: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- リアクション: `reactionNotifications`, `reactionLevel`
- エラー: `errorPolicy`, `errorCooldownMs`
- 書き込み/履歴: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
マルチアカウントの優先順位: 2つ以上のアカウントIDが設定されている場合は、デフォルトルーティングを明示するために `channels.telegram.defaultAccount` を設定するか（または `channels.telegram.accounts.default` を含めて）ください。そうしないと、OpenClaw は最初に正規化されたアカウントIDにフォールバックし、`openclaw doctor` が警告します。名前付きアカウントは `channels.telegram.allowFrom` / `groupAllowFrom` を継承しますが、`accounts.default.*` の値は継承しません。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    Telegramユーザーをgatewayにペアリングします。
  </Card>
  <Card title="Groups" icon="users" href="/ja-JP/channels/groups">
    グループおよびトピックの許可リスト動作。
  </Card>
  <Card title="Channel routing" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントにルーティングします。
  </Card>
  <Card title="Security" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルとハードニング。
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    グループとトピックをエージェントに割り当てます。
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断。
  </Card>
</CardGroup>
