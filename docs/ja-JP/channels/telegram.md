---
read_when:
    - Telegram 機能または Webhook の開発
summary: Telegram ボットのサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-04-23T13:59:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 024b76c3c71537995fc4efc26887eae516846d3f845d135b263d4d7f270afbb7
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram（Bot API）

ステータス: grammY によるボット DM とグループ向けに本番対応済みです。デフォルトモードは long polling で、Webhook モードはオプションです。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram のデフォルト DM ポリシーはペアリングです。
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
    Telegram を開き、**@BotFather** とチャットしてください（ハンドル名が正確に `@BotFather` であることを確認してください）。

    `/newbot` を実行し、プロンプトに従ってトークンを保存してください。

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

    環境変数のフォールバック: `TELEGRAM_BOT_TOKEN=...`（デフォルトアカウントのみ）。
    Telegram では `openclaw channels login telegram` は使用しません。config/env でトークンを設定してから gateway を起動してください。

  </Step>

  <Step title="gateway を起動して最初の DM を承認する">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    ペアリングコードは 1 時間で期限切れになります。

  </Step>

  <Step title="ボットをグループに追加する">
    ボットをグループに追加し、その後 `channels.telegram.groups` と `groupPolicy` をアクセスモデルに合わせて設定してください。
  </Step>
</Steps>

<Note>
トークンの解決順序はアカウント対応です。実際には config 値が env フォールバックより優先され、`TELEGRAM_BOT_TOKEN` はデフォルトアカウントにのみ適用されます。
</Note>

## Telegram 側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループ可視性">
    Telegram ボットはデフォルトで **プライバシーモード** になっており、グループ内で受信できるメッセージが制限されます。

    ボットがすべてのグループメッセージを見る必要がある場合は、次のいずれかを行ってください。

    - `/setprivacy` でプライバシーモードを無効化する
    - ボットをグループ管理者にする

    プライバシーモードを切り替えたときは、Telegram が変更を適用するよう、各グループでボットを削除して再追加してください。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスは Telegram グループ設定で制御されます。

    管理者ボットはすべてのグループメッセージを受信するため、常時有効のグループ動作に役立ちます。

  </Accordion>

  <Accordion title="役立つ BotFather の切り替え項目">

    - `/setjoingroups` でグループ追加の許可/拒否
    - グループ可視性の動作には `/setprivacy`

  </Accordion>
</AccordionGroup>

## アクセス制御と有効化

<Tabs>
  <Tab title="DM ポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージのアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom` に少なくとも 1 つの送信者 ID が必要）
    - `open`（`allowFrom` に `"*"` が含まれている必要あり）
    - `disabled`

    `channels.telegram.allowFrom` は数値の Telegram ユーザー ID を受け付けます。`telegram:` / `tg:` プレフィックスは受け付けられ、正規化されます。
    `allowFrom` が空の `dmPolicy: "allowlist"` はすべての DM をブロックし、設定検証で拒否されます。
    セットアップでは数値のユーザー ID のみを求めます。
    アップグレード後の config に `@username` の allowlist エントリがある場合は、`openclaw doctor --fix` を実行して解決してください（ベストエフォート。Telegram ボットトークンが必要です）。
    以前にペアリングストアの allowlist ファイルに依存していた場合、`openclaw doctor --fix` は allowlist フローで `channels.telegram.allowFrom` へエントリを復元できます（たとえば `dmPolicy: "allowlist"` に明示的な ID がまだない場合）。

    単一オーナーのボットでは、アクセスポリシーを config 内で永続的に保つため、過去のペアリング承認に依存するのではなく、明示的な数値 `allowFrom` ID を指定した `dmPolicy: "allowlist"` を推奨します。

    よくある誤解: DM のペアリング承認は「この送信者がどこでも認可される」という意味ではありません。
    ペアリングは DM アクセスのみを付与します。グループ送信者の認可は、引き続き明示的な config allowlist から行われます。
    「一度認可されれば DM もグループコマンドも両方動く」ようにしたい場合は、あなたの数値 Telegram ユーザー ID を `channels.telegram.allowFrom` に入れてください。

    ### Telegram ユーザー ID を見つける

    より安全な方法（サードパーティボット不要）:

    1. ボットに DM を送る。
    2. `openclaw logs --follow` を実行する。
    3. `from.id` を読む。

    公式 Bot API を使う方法:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティの方法（プライバシー性は低い）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーと allowlist">
    2 つの制御が一緒に適用されます。

    1. **どのグループが許可されるか**（`channels.telegram.groups`）
       - `groups` 設定なし:
         - `groupPolicy: "open"` の場合: 任意のグループがグループ ID チェックを通過できます
         - `groupPolicy: "allowlist"`（デフォルト）の場合: `groups` エントリ（または `"*"`）を追加するまでグループはブロックされます
       - `groups` 設定あり: allowlist として動作します（明示的 ID または `"*"`）

    2. **グループ内でどの送信者が許可されるか**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（デフォルト）
       - `disabled`

    `groupAllowFrom` はグループ送信者フィルタリングに使われます。設定されていない場合、Telegram は `allowFrom` にフォールバックします。
    `groupAllowFrom` のエントリは数値の Telegram ユーザー ID にしてください（`telegram:` / `tg:` プレフィックスは正規化されます）。
    `groupAllowFrom` に Telegram グループまたは supergroup のチャット ID を入れないでください。負のチャット ID は `channels.telegram.groups` に置いてください。
    数値でないエントリは送信者認可で無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ送信者認可は DM のペアリングストア承認を継承しません。
    ペアリングは DM 専用のままです。グループでは `groupAllowFrom` またはグループ単位/トピック単位の `allowFrom` を設定してください。
    `groupAllowFrom` が未設定の場合、Telegram はペアリングストアではなく config の `allowFrom` にフォールバックします。
    単一オーナーのボット向けの実用パターン: あなたのユーザー ID を `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにして、対象グループを `channels.telegram.groups` で許可します。
    ランタイム上の注意: `channels.telegram` が完全に欠落している場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、ランタイムのデフォルトは fail-closed の `groupPolicy="allowlist"` です。

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

    例: 特定の 1 つのグループ内で特定ユーザーのみを許可する:

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

      - `-1001234567890` のような負の Telegram グループまたは supergroup のチャット ID は `channels.telegram.groups` に入れてください。
      - 許可されたグループ内で、どの人がボットをトリガーできるかを制限したい場合は、`8734062810` のような Telegram ユーザー ID を `groupAllowFrom` に入れてください。
      - 許可されたグループの任意のメンバーがボットに話しかけられるようにしたい場合にのみ `groupAllowFrom: ["*"]` を使ってください。
    </Warning>

  </Tab>

  <Tab title="メンション動作">
    グループでの応答はデフォルトでメンションを必要とします。

    メンションは次のいずれかで行えます。

    - ネイティブの `@botusername` メンション
    - 次の中のメンションパターン:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    セッションレベルのコマンド切り替え:

    - `/activation always`
    - `/activation mention`

    これらはセッション状態のみを更新します。永続化するには config を使ってください。

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
    - または `openclaw logs --follow` から `chat.id` を読む
    - または Bot API の `getUpdates` を確認する

  </Tab>
</Tabs>

## ランタイム動作

- Telegram は gateway プロセスが所有します。
- ルーティングは決定的です。Telegram からの入力への応答は Telegram に返されます（モデルがチャネルを選ぶことはありません）。
- 入力メッセージは、返信メタデータとメディアプレースホルダーを持つ共有チャネルエンベロープに正規化されます。
- グループセッションはグループ ID ごとに分離されます。フォーラムトピックは `:topic:<threadId>` を追加してトピックを分離します。
- DM メッセージは `message_thread_id` を持てます。OpenClaw はそれらをスレッド対応セッションキーでルーティングし、返信のために thread ID を保持します。
- Long polling は grammY runner を使い、チャットごと/スレッドごとの順序を保ちます。全体の runner sink 並行性は `agents.defaults.maxConcurrent` を使用します。
- デフォルトでは、完了済み `getUpdates` の生存確認が 120 秒間ないと long-polling watchdog の再起動が発生します。長時間実行の作業中にデプロイで polling-stall の誤検知再起動が引き続き発生する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。値はミリ秒で、`30000` から `600000` まで許可されます。アカウント単位の上書きに対応しています。
- Telegram Bot API には既読通知のサポートがありません（`sendReadReceipts` は適用されません）。

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClaw は部分的な応答をリアルタイムでストリーミングできます。

    - ダイレクトチャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming` は `off | partial | block | progress`（デフォルト: `partial`）
    - `progress` は Telegram では `partial` にマップされます（チャネル横断の命名互換性のため）
    - `streaming.preview.toolProgress` は、ツール/進捗更新で同じ編集済みプレビューメッセージを再利用するかどうかを制御します（デフォルト: `true`）。個別のツール/進捗メッセージを維持するには `false` に設定してください。
    - 旧来の `channels.telegram.streamMode` と真偽値の `streaming` は自動でマップされます

    テキストのみの応答では:

    - DM: OpenClaw は同じプレビューメッセージを維持し、最終的なインプレース編集を行います（2 通目のメッセージはありません）
    - グループ/トピック: OpenClaw は同じプレビューメッセージを維持し、最終的なインプレース編集を行います（2 通目のメッセージはありません）

    複雑な応答（たとえばメディアペイロード）では、OpenClaw は通常の最終配信にフォールバックし、その後プレビューメッセージをクリーンアップします。

    プレビューストリーミングは block streaming とは別です。Telegram で block streaming が明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためプレビューストリームをスキップします。

    ネイティブのドラフト転送が利用できない、または拒否された場合、OpenClaw は自動的に `sendMessage` + `editMessageText` にフォールバックします。

    Telegram 専用の reasoning ストリーム:

    - `/reasoning stream` は生成中の reasoning をライブプレビューに送信します
    - 最終回答は reasoning テキストなしで送信されます

  </Accordion>

  <Accordion title="書式設定と HTML フォールバック">
    送信テキストは Telegram の `parse_mode: "HTML"` を使用します。

    - Markdown 風テキストは Telegram セーフな HTML にレンダリングされます。
    - 生のモデル HTML は Telegram のパース失敗を減らすためエスケープされます。
    - Telegram がパース済み HTML を拒否した場合、OpenClaw はプレーンテキストとして再試行します。

    リンクプレビューはデフォルトで有効で、`channels.telegram.linkPreview: false` で無効化できます。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegram コマンドメニューの登録は、起動時に `setMyCommands` で処理されます。

    ネイティブコマンドのデフォルト:

    - `commands.native: "auto"` は Telegram 用のネイティブコマンドを有効にします

    カスタムコマンドメニュー項目を追加するには:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
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

    注意:

    - カスタムコマンドはメニュー項目にすぎず、自動的に動作を実装するわけではありません
    - plugin/skill コマンドは、Telegram メニューに表示されていなくても、入力すれば引き続き動作する場合があります

    ネイティブコマンドが無効な場合、組み込みコマンドは削除されます。カスタム/plugin コマンドは、設定されていれば引き続き登録される場合があります。

    よくあるセットアップ失敗:

    - `setMyCommands failed` で `BOT_COMMANDS_TOO_MUCH` が出る場合、Telegram メニューは削減後もまだ上限超過です。plugin/skill/カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効化してください。
    - `setMyCommands failed` でネットワーク/fetch エラーが出る場合、通常は `api.telegram.org` への外向き DNS/HTTPS がブロックされています。

    ### デバイスのペアリングコマンド（`device-pair` Plugin）

    `device-pair` Plugin がインストールされている場合:

    1. `/pair` でセットアップコードを生成
    2. iOS アプリにコードを貼り付ける
    3. `/pair pending` で保留中のリクエストを一覧表示（role/scopes を含む）
    4. リクエストを承認:
       - 明示的に承認するには `/pair approve <requestId>`
       - 保留中リクエストが 1 件だけの場合は `/pair approve`
       - 最新のものには `/pair approve latest`

    セットアップコードには短命のブートストラップトークンが含まれます。組み込みのブートストラップ引き継ぎでは、プライマリ node トークンは `scopes: []` のまま維持され、引き渡される operator トークンは `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` に制限されたままです。ブートストラップのスコープチェックは role プレフィックス付きなので、その operator allowlist は operator リクエストだけを満たします。operator 以外の role では、引き続き自身の role プレフィックス配下の scopes が必要です。

    デバイスが変更された認証詳細（たとえば role/scopes/public key）で再試行した場合、以前の保留中リクエストは置き換えられ、新しいリクエストは異なる `requestId` を使用します。承認前に `/pair pending` を再実行してください。

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

    従来の `capabilities: ["inlineButtons"]` は `inlineButtons: "all"` にマップされます。

    メッセージアクションの例:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "オプションを選択:",
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

  <Accordion title="エージェントと自動化のための Telegram メッセージアクション">
    Telegram ツールアクションには次が含まれます:

    - `sendMessage`（`to`、`content`、任意で `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`、任意で `iconColor`、`iconCustomEmojiId`）

    チャネルメッセージアクションでは、使いやすい別名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）を公開しています。

    制御ゲート:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（デフォルト: 無効）

    注: `edit` と `topic-create` は現在デフォルトで有効で、個別の `channels.telegram.actions.*` 切り替えはありません。
    ランタイム送信はアクティブな config/secrets スナップショット（起動時/リロード時）を使うため、アクション経路では送信ごとにアドホックな SecretRef 再解決は行いません。

    リアクション削除の意味論: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="返信スレッドタグ">
    Telegram は生成された出力で明示的な返信スレッドタグをサポートします:

    - `[[reply_to_current]]` はトリガー元メッセージに返信します
    - `[[reply_to:<id>]]` は特定の Telegram メッセージ ID に返信します

    `channels.telegram.replyToMode` が処理方法を制御します:

    - `off`（デフォルト）
    - `first`
    - `all`

    注: `off` は暗黙的な返信スレッド化を無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッド動作">
    フォーラム supergroup:

    - トピックのセッションキーには `:topic:<threadId>` が追加されます
    - 返信と入力中表示はそのトピックスレッドを対象にします
    - トピック設定パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般トピック（`threadId=1`）の特別扱い:

    - メッセージ送信では `message_thread_id` を省略します（Telegram は `sendMessage(...thread_id=1)` を拒否します）
    - 入力中アクションには引き続き `message_thread_id` が含まれます

    トピック継承: トピックエントリは、上書きされない限りグループ設定（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）を継承します。
    `agentId` はトピック専用であり、グループデフォルトからは継承されません。

    **トピック単位のエージェントルーティング**: 各トピックは、トピック設定で `agentId` を設定することで、異なるエージェントにルーティングできます。これにより各トピックは独自に分離されたワークスペース、メモリ、セッションを持てます。例:

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

    各トピックはその後、独自のセッションキーを持ちます: `agent:zu:telegram:group:-1001234567890:topic:3`

    **永続的な ACP トピックバインド**: フォーラムトピックは、トップレベルの型付き ACP バインド（`bindings[]` で `type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`、および `-1001234567890:topic:42` のようなトピック付き id）を通じて ACP ハーネスセッションを固定できます。現在はグループ/supergroup 内のフォーラムトピックに限定されています。[ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

    **チャットからのスレッド固定 ACP spawn**: `/acp spawn <agent> --thread here|auto` は現在のトピックを新しい ACP セッションにバインドし、その後のやり取りを直接そこへルーティングします。OpenClaw は spawn 確認をトピック内に固定します。`channels.telegram.threadBindings.spawnAcpSessions=true` が必要です。

    テンプレートコンテキストは `MessageThreadId` と `IsForum` を公開します。`message_thread_id` を持つ DM チャットは DM ルーティングを維持しつつ、スレッド対応セッションキーを使います。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegram ではボイスノートと音声ファイルが区別されます。

    - デフォルト: 音声ファイルとしての動作
    - エージェント返信に `[[audio_as_voice]]` タグを付けると、ボイスノート送信を強制します

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

    ステッカーのコンテキストフィールド:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ステッカーキャッシュファイル:

    - `~/.openclaw/telegram/sticker-cache.json`

    ステッカーは可能な場合に一度だけ説明され、繰り返しの vision 呼び出しを減らすためキャッシュされます。

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
    Telegram のリアクションは `message_reaction` 更新として届きます（メッセージペイロードとは別です）。

    有効な場合、OpenClaw は次のようなシステムイベントをキューに入れます:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定:

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    注:

    - `own` は、ボット送信メッセージに対するユーザーリアクションのみを意味します（送信メッセージキャッシュによるベストエフォート）。
    - リアクションイベントも Telegram のアクセス制御（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）に従い、未認可の送信者は破棄されます。
    - Telegram はリアクション更新に thread ID を提供しません。
      - 非フォーラムグループはグループチャットセッションにルーティングされます
      - フォーラムグループは、正確な元トピックではなく、グループの一般トピックセッション（`:topic:1`）にルーティングされます

    polling/webhook 用の `allowed_updates` には `message_reaction` が自動的に含まれます。

  </Accordion>

  <Accordion title="確認リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理中に確認用の絵文字を送ります。

    解決順序:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェント identity の絵文字フォールバック（`agents.list[].identity.emoji`、なければ `"👀"`）

    注:

    - Telegram は Unicode 絵文字を期待します（例: `"👀"`）。
    - チャネルまたはアカウントでリアクションを無効にするには `""` を使ってください。

  </Accordion>

  <Accordion title="Telegram イベントとコマンドからの config 書き込み">
    チャネル config 書き込みはデフォルトで有効です（`configWrites !== false`）。

    Telegram トリガーの書き込みには次が含まれます:

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

  <Accordion title="Long polling と Webhook">
    デフォルトは long polling です。Webhook モードにするには `channels.telegram.webhookUrl` と `channels.telegram.webhookSecret` を設定します。任意で `webhookPath`、`webhookHost`、`webhookPort`（デフォルトは `/telegram-webhook`、`127.0.0.1`、`8787`）も設定できます。

    ローカルリスナーは `127.0.0.1:8787` にバインドされます。公開 ingress にするには、ローカルポートの前段にリバースプロキシを置くか、意図的に `webhookHost: "0.0.0.0"` を設定してください。

  </Accordion>

  <Accordion title="制限、再試行、CLI ターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは 4000 です。
    - `channels.telegram.chunkMode="newline"` は、長さで分割する前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト 100）は、送受信する Telegram メディアサイズの上限です。
    - `channels.telegram.timeoutSeconds` は Telegram API クライアントのタイムアウトを上書きします（未設定の場合は grammY のデフォルトが適用されます）。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは `120000` です。polling-stall の誤検知による再起動に対してのみ、`30000` から `600000` の範囲で調整してください。
    - グループのコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit`（デフォルト 50）を使用します。`0` で無効化されます。
    - 返信/引用/転送の補足コンテキストは現在、受信したまま渡されます。
    - Telegram の allowlist は主に、誰がエージェントをトリガーできるかを制御するものであり、完全な補足コンテキストの秘匿境界ではありません。
    - DM 履歴の制御:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定は、回復可能な送信 API エラーに対する Telegram の送信ヘルパー（CLI/ツール/アクション）に適用されます。

    CLI の送信ターゲットには、数値 chat ID または username を使えます:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram の poll は `openclaw message poll` を使い、フォーラムトピックにも対応しています:

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

    Telegram の送信は次にも対応しています:

    - `channels.telegram.capabilities.inlineButtons` が許可している場合、インラインキーボード用に `buttons` ブロック付きの `--presentation`
    - ボットがそのチャットで固定できる場合、固定配信を要求する `--pin` または `--delivery '{"pin":true}'`
    - 送信画像と GIF を圧縮写真またはアニメーションメディアアップロードではなく、ドキュメントとして送る `--force-document`

    アクション制御:

    - `channels.telegram.actions.sendMessage=false` は、poll を含む Telegram への送信メッセージを無効化します
    - `channels.telegram.actions.poll=false` は、通常送信は有効のまま Telegram poll 作成を無効化します

  </Accordion>

  <Accordion title="Telegram での exec 承認">
    Telegram は approver の DM で exec 承認をサポートし、必要に応じて元のチャットまたはトピックにもプロンプトを投稿できます。approver は数値の Telegram ユーザー ID である必要があります。

    設定パス:

    - `channels.telegram.execApprovals.enabled`（少なくとも 1 つの approver を解決できる場合に自動で有効化）
    - `channels.telegram.execApprovals.approvers`（`allowFrom` / `defaultTo` の数値 owner ID にフォールバック）
    - `channels.telegram.execApprovals.target`: `dm`（デフォルト） | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    チャネル配信ではコマンドテキストがチャットに表示されます。`channel` または `both` は、信頼できるグループ/トピックでのみ有効化してください。プロンプトがフォーラムトピックに届いた場合、OpenClaw は承認プロンプトとその後のやり取りの両方でトピックを保持します。exec 承認のデフォルト有効期限は 30 分です。

    インライン承認ボタンにも、ターゲット画面（`dm`、`group`、または `all`）を許可する `channels.telegram.capabilities.inlineButtons` が必要です。`plugin:` プレフィックス付きの承認 ID は plugin 承認経由で解決され、それ以外は最初に exec 承認経由で解決されます。

    [Exec approvals](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>
</AccordionGroup>

## エラー応答の制御

エージェントが配信エラーまたは provider エラーに遭遇した場合、Telegram はエラーテキストで応答することも、抑制することもできます。この動作は 2 つの config キーで制御されます:

| キー                                | 値                | デフォルト | 説明                                                                                           |
| ----------------------------------- | ----------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` はフレンドリーなエラーメッセージをチャットに送信します。`silent` はエラー応答を完全に抑制します。 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`    | 同じチャットへのエラー応答の最小間隔。障害時のエラースパムを防ぎます。                          |

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
  <Accordion title="ボットがメンションなしのグループメッセージに応答しない">

    - `requireMention=false` の場合、Telegram のプライバシーモードで完全な可視性が許可されている必要があります。
      - BotFather: `/setprivacy` -> Disable
      - その後、ボットをグループから削除して再追加
    - `openclaw channels status` は、config がメンションなしのグループメッセージを想定している場合に警告します。
    - `openclaw channels status --probe` は明示的な数値グループ ID を確認できます。ワイルドカード `"*"` のメンバーシップは probe できません。
    - クイックセッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="ボットがグループメッセージをまったく認識しない">

    - `channels.telegram.groups` が存在する場合、そのグループがリストされている必要があります（または `"*"` を含める）
    - ボットがグループに参加していることを確認
    - `openclaw logs --follow` でスキップ理由を確認

  </Accordion>

  <Accordion title="コマンドが部分的にしか動かない、またはまったく動かない">

    - 送信者 ID を認可してください（ペアリングおよび/または数値 `allowFrom`）
    - グループポリシーが `open` でも、コマンド認可は引き続き適用されます
    - `setMyCommands failed` で `BOT_COMMANDS_TOO_MUCH` が出る場合、ネイティブメニューの項目数が多すぎます。plugin/skill/カスタムコマンドを減らすか、ネイティブメニューを無効化してください
    - `setMyCommands failed` でネットワーク/fetch エラーが出る場合、通常は `api.telegram.org` への DNS/HTTPS 到達性の問題です

  </Accordion>

  <Accordion title="Polling またはネットワークの不安定さ">

    - Node 22+ とカスタム fetch/proxy の組み合わせでは、AbortSignal 型の不一致があると即時 abort 動作が起こることがあります。
    - 一部のホストは `api.telegram.org` をまず IPv6 に解決します。IPv6 の外向き通信が壊れていると、Telegram API の断続的な障害につながることがあります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれる場合、OpenClaw はこれらを回復可能なネットワークエラーとして再試行するようになっています。
    - ログに `Polling stall detected` が含まれる場合、OpenClaw はデフォルトで 120 秒間、完了済み long-poll の生存確認がないと polling を再起動し、Telegram transport を再構築します。
    - `channels.telegram.pollingStallThresholdMs` を増やすのは、長時間実行の `getUpdates` 呼び出し自体は正常なのに、ホストで polling-stall の誤検知再起動が発生する場合だけにしてください。継続的な stall は通常、ホストと `api.telegram.org` 間の proxy、DNS、IPv6、または TLS の外向き通信の問題を示します。
    - VPS ホストで直接の外向き通信/TLS が不安定な場合は、Telegram API 呼び出しを `channels.telegram.proxy` 経由にしてください:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ のデフォルトは `autoSelectFamily=true`（WSL2 を除く）および `dnsResultOrder=ipv4first` です。
    - ホストが WSL2 の場合、または明示的に IPv4 のみの動作の方がうまくいく場合は、family 選択を強制してください:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 ベンチマーク範囲の応答（`198.18.0.0/15`）は、Telegram メディアダウンロード用としてデフォルトですでに許可されています。信頼できる fake-IP または透過 proxy が、メディアダウンロード時に `api.telegram.org` を他の private/internal/special-use アドレスに書き換える場合は、Telegram 専用のバイパスをオプトインできます:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じオプトインは、アカウント単位で `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` にもあります。
    - proxy が Telegram メディアホストを `198.18.x.x` に解決する場合は、まず dangerous フラグをオフのままにしてください。Telegram メディアでは RFC 2544 ベンチマーク範囲がすでにデフォルトで許可されています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` は、Telegram
      メディアの SSRF 保護を弱めます。Clash、Mihomo、Surge の fake-IP ルーティングのように、信頼できる operator 管理の proxy 環境が RFC 2544 ベンチマーク範囲外の private または special-use 応答を合成する場合にのみ使用してください。通常のパブリックインターネット経由の Telegram アクセスではオフのままにしてください。
    </Warning>

    - 環境変数による上書き（一時的）:
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS 応答を確認:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

詳細は [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting) を参照してください。

## Telegram config リファレンスへのポインタ

主要リファレンス:

- `channels.telegram.enabled`: チャネル起動の有効/無効。
- `channels.telegram.botToken`: ボットトークン（BotFather）。
- `channels.telegram.tokenFile`: 通常ファイルのパスからトークンを読み取ります。symlink は拒否されます。
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）。
- `channels.telegram.allowFrom`: DM allowlist（数値の Telegram ユーザー ID）。`allowlist` には少なくとも 1 つの送信者 ID が必要です。`open` には `"*"` が必要です。`openclaw doctor --fix` は、従来の `@username` エントリを ID に解決でき、allowlist 移行フローでは pairing-store ファイルから allowlist エントリを復元することもできます。
- `channels.telegram.actions.poll`: Telegram poll 作成の有効/無効（デフォルト: 有効。ただし `sendMessage` は引き続き必要です）。
- `channels.telegram.defaultTo`: 明示的な `--reply-to` が指定されていない場合に CLI `--deliver` で使われるデフォルトの Telegram ターゲット。
- `channels.telegram.groupPolicy`: `open | allowlist | disabled`（デフォルト: allowlist）。
- `channels.telegram.groupAllowFrom`: グループ送信者 allowlist（数値の Telegram ユーザー ID）。`openclaw doctor --fix` は従来の `@username` エントリを ID に解決できます。数値でないエントリは認可時に無視されます。グループ認可では DM pairing-store フォールバックは使われません（`2026.2.25+`）。
- マルチアカウントの優先順位:
  - 2 つ以上のアカウント ID が設定されている場合は、デフォルトルーティングを明示するために `channels.telegram.defaultAccount` を設定するか（または `channels.telegram.accounts.default` を含めてください）。
  - どちらも設定されていない場合、OpenClaw は最初の正規化済みアカウント ID にフォールバックし、`openclaw doctor` が警告します。
  - `channels.telegram.accounts.default.allowFrom` と `channels.telegram.accounts.default.groupAllowFrom` は `default` アカウントにのみ適用されます。
  - 名前付きアカウントは、アカウントレベルの値が未設定の場合に `channels.telegram.allowFrom` と `channels.telegram.groupAllowFrom` を継承します。
  - 名前付きアカウントは `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom` を継承しません。
- `channels.telegram.groups`: グループ単位のデフォルト + allowlist（グローバルデフォルトには `"*"` を使用）。
  - `channels.telegram.groups.<id>.groupPolicy`: groupPolicy のグループ単位上書き（`open | allowlist | disabled`）。
  - `channels.telegram.groups.<id>.requireMention`: デフォルトのメンション制御。
  - `channels.telegram.groups.<id>.skills`: Skills フィルター（省略 = すべての Skills、空 = なし）。
  - `channels.telegram.groups.<id>.allowFrom`: グループ単位の送信者 allowlist 上書き。
  - `channels.telegram.groups.<id>.systemPrompt`: そのグループ用の追加 system prompt。
  - `channels.telegram.groups.<id>.enabled`: `false` の場合はそのグループを無効化。
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: トピック単位の上書き（グループフィールド + トピック専用の `agentId`）。
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: このトピックを特定のエージェントにルーティングします（グループレベルおよびバインディングのルーティングを上書き）。
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: groupPolicy のトピック単位上書き（`open | allowlist | disabled`）。
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: メンション制御のトピック単位上書き。
- `match.peer.id` に `type: "acp"` と正規化されたトピック id `chatId:topic:topicId` を持つトップレベル `bindings[]`: 永続的な ACP トピックバインディングフィールド（[ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) を参照）。
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: DM トピックを特定のエージェントにルーティングします（フォーラムトピックと同じ動作）。
- `channels.telegram.execApprovals.enabled`: このアカウントで、チャットベースの exec 承認クライアントとして Telegram を有効化。
- `channels.telegram.execApprovals.approvers`: exec リクエストの承認または拒否が許可される Telegram ユーザー ID。`channels.telegram.allowFrom` または直接の `channels.telegram.defaultTo` で owner がすでに識別されている場合は省略可能です。
- `channels.telegram.execApprovals.target`: `dm | channel | both`（デフォルト: `dm`）。`channel` と `both` は、存在する場合に元の Telegram トピックを保持します。
- `channels.telegram.execApprovals.agentFilter`: 転送される承認プロンプト用の任意の agent ID フィルター。
- `channels.telegram.execApprovals.sessionFilter`: 転送される承認プロンプト用の任意のセッションキーフィルター（部分文字列または regex）。
- `channels.telegram.accounts.<account>.execApprovals`: Telegram exec 承認ルーティングおよび approver 認可のアカウント単位上書き。
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist`（デフォルト: allowlist）。
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: アカウント単位の上書き。
- `channels.telegram.commands.nativeSkills`: Telegram ネイティブ Skills コマンドの有効/無効。
- `channels.telegram.replyToMode`: `off | first | all`（デフォルト: `off`）。
- `channels.telegram.textChunkLimit`: 送信チャンクサイズ（文字数）。
- `channels.telegram.chunkMode`: `length`（デフォルト）または `newline`。長さベースのチャンク化の前に空行（段落境界）で分割します。
- `channels.telegram.linkPreview`: 送信メッセージのリンクプレビュー切り替え（デフォルト: true）。
- `channels.telegram.streaming`: `off | partial | block | progress`（ライブストリームプレビュー。デフォルト: `partial`。`progress` は `partial` にマップされ、`block` は従来のプレビューモード互換です）。Telegram のプレビューストリーミングは、1 つのプレビューメッセージをその場で編集して使います。
- `channels.telegram.streaming.preview.toolProgress`: プレビューストリーミング有効時に、ツール/進捗更新でライブプレビューメッセージを再利用します（デフォルト: `true`）。個別のツール/進捗メッセージを維持するには `false` に設定してください。
- `channels.telegram.mediaMaxMb`: 送受信する Telegram メディアの上限（MB、デフォルト: 100）。
- `channels.telegram.retry`: 回復可能な送信 API エラーに対する Telegram 送信ヘルパー（CLI/ツール/アクション）の再試行ポリシー（attempts、minDelayMs、maxDelayMs、jitter）。
- `channels.telegram.network.autoSelectFamily`: Node の autoSelectFamily を上書きします（true=有効、false=無効）。デフォルトでは Node 22+ で有効、WSL2 ではデフォルトで無効です。
- `channels.telegram.network.dnsResultOrder`: DNS 結果順序を上書きします（`ipv4first` または `verbatim`）。デフォルトでは Node 22+ で `ipv4first` です。
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: 信頼できる fake-IP または透過 proxy 環境向けの危険なオプトイン。Telegram メディアダウンロード時に `api.telegram.org` が、デフォルトの RFC 2544 ベンチマーク範囲許可外の private/internal/special-use アドレスへ解決される場合に使用します。
- `channels.telegram.proxy`: Bot API 呼び出し用の proxy URL（SOCKS/HTTP）。
- `channels.telegram.webhookUrl`: Webhook モードを有効化（`channels.telegram.webhookSecret` が必要）。
- `channels.telegram.webhookSecret`: Webhook シークレット（webhookUrl 設定時に必須）。
- `channels.telegram.webhookPath`: ローカル Webhook パス（デフォルト `/telegram-webhook`）。
- `channels.telegram.webhookHost`: ローカル Webhook バインドホスト（デフォルト `127.0.0.1`）。
- `channels.telegram.webhookPort`: ローカル Webhook バインドポート（デフォルト `8787`）。
- `channels.telegram.actions.reactions`: Telegram ツールのリアクション制御。
- `channels.telegram.actions.sendMessage`: Telegram ツールのメッセージ送信制御。
- `channels.telegram.actions.deleteMessage`: Telegram ツールのメッセージ削除制御。
- `channels.telegram.actions.sticker`: Telegram ステッカーアクションの制御 — 送信と検索（デフォルト: false）。
- `channels.telegram.reactionNotifications`: `off | own | all` — どのリアクションがシステムイベントをトリガーするかを制御します（未設定時のデフォルト: `own`）。
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — エージェントのリアクション機能を制御します（未設定時のデフォルト: `minimal`）。
- `channels.telegram.errorPolicy`: `reply | silent` — エラー応答の動作を制御します（デフォルト: `reply`）。アカウント/グループ/トピック単位の上書きに対応しています。
- `channels.telegram.errorCooldownMs`: 同じチャットへのエラー応答の最小間隔（ms、デフォルト: `60000`）。障害時のエラースパムを防ぎます。

- [設定リファレンス - Telegram](/ja-JP/gateway/configuration-reference#telegram)

Telegram 固有の重要フィールド:

- 起動/認証: `enabled`, `botToken`, `tokenFile`, `accounts.*`（`tokenFile` は通常ファイルを指している必要があり、symlink は拒否されます）
- アクセス制御: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, トップレベル `bindings[]`（`type: "acp"`）
- exec 承認: `execApprovals`, `accounts.*.execApprovals`
- コマンド/メニュー: `commands.native`, `commands.nativeSkills`, `customCommands`
- スレッド/返信: `replyToMode`
- ストリーミング: `streaming`（プレビュー）、`streaming.preview.toolProgress`, `blockStreaming`
- 書式/配信: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
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
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
