---
read_when:
    - Telegram機能またはWebhookで作業する
summary: Telegram ボットのサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-06-30T13:45:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e143096bbcdf949ef11566ffe2a5360eea261cd5bf99f0cf90d31c8e9d4637d6
    source_path: channels/telegram.md
    workflow: 16
---

本番対応済みで、grammY 経由のボット DM とグループに対応します。ロングポーリングがデフォルトモードで、Webhook モードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram のデフォルト DM ポリシーはペアリングです。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復プレイブック。
  </Card>
  <Card title="Gateway設定" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャンネル設定パターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="BotFather でボットトークンを作成する">
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
    Telegram は `openclaw channels login telegram` を使用しません。config/env でトークンを設定してから、gateway を起動してください。

  </Step>

  <Step title="gateway を起動し、最初の DM を承認する">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    ペアリングコードは 1 時間後に期限切れになります。

  </Step>

  <Step title="ボットをグループに追加する">
    ボットをグループに追加してから、グループアクセスに必要な両方の ID を取得します。

    - `allowFrom` / `groupAllowFrom` で使用される、あなたの Telegram ユーザー ID
    - `channels.telegram.groups` 配下のキーとして使用される、Telegram グループチャット ID

    初回セットアップでは、`openclaw logs --follow`、転送 ID ボット、または Bot API `getUpdates` からグループチャット ID を取得します。グループが許可された後は、`/whoami@<bot_username>` でユーザー ID とグループ ID を確認できます。

    `-100` で始まる負の Telegram スーパーグループ ID はグループチャット ID です。`groupAllowFrom` ではなく、`channels.telegram.groups` 配下に置いてください。

  </Step>
</Steps>

<Note>
トークン解決順序はアカウント対応です。実際には、config 値が env フォールバックより優先され、`TELEGRAM_BOT_TOKEN` はデフォルトアカウントにのみ適用されます。
起動に成功すると、OpenClaw は再起動時に追加の Telegram `getMe` 呼び出しを避けられるよう、最大 24 時間、state ディレクトリにボット ID をキャッシュします。トークンを変更または削除すると、そのキャッシュはクリアされます。
</Note>

## Telegram 側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループの可視性">
    Telegram ボットはデフォルトで **Privacy Mode** になっており、受信できるグループメッセージが制限されます。

    ボットがすべてのグループメッセージを見る必要がある場合は、次のいずれかを行います。

    - `/setprivacy` でプライバシーモードを無効にする、または
    - ボットをグループ管理者にする。

    プライバシーモードを切り替えるときは、各グループでボットを削除して再追加し、Telegram に変更を適用させてください。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスは Telegram のグループ設定で制御されます。

    管理者ボットはすべてのグループメッセージを受信するため、常時オンのグループ動作に役立ちます。

  </Accordion>

  <Accordion title="便利な BotFather トグル">

    - `/setjoingroups` でグループ追加を許可/拒否する
    - `/setprivacy` でグループ可視性の動作を設定する

  </Accordion>
</AccordionGroup>

## アクセス制御と有効化

### グループボット ID

Telegram のグループとフォーラムトピックでは、設定済みのボットハンドル（例: `@my_bot`）への明示的なメンションは、エージェントのペルソナ名が Telegram ユーザー名と異なる場合でも、選択された OpenClaw エージェントへの宛先として扱われます。グループのサイレンスポリシーは無関係なグループトラフィックには引き続き適用されますが、ボットハンドル自体は「他の誰か」とは見なされません。

<Tabs>
  <Tab title="DM ポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom` に少なくとも 1 つの送信者 ID が必要）
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    `allowFrom: ["*"]` と組み合わせた `dmPolicy: "open"` は、ボットのユーザー名を見つけた、または推測した任意の Telegram アカウントがボットにコマンドを送れるようにします。厳格に制限されたツールを持つ、意図的に公開されたボットにのみ使用してください。単一所有者のボットでは、数値ユーザー ID を使った `allowlist` を使用してください。

    `channels.telegram.allowFrom` は数値の Telegram ユーザー ID を受け付けます。`telegram:` / `tg:` プレフィックスは受け付けられ、正規化されます。
    複数アカウント設定では、制限的なトップレベルの `channels.telegram.allowFrom` は安全境界として扱われます。アカウントレベルの `allowFrom: ["*"]` エントリは、マージ後の有効なアカウント allowlist に明示的なワイルドカードがまだ含まれていない限り、そのアカウントを公開しません。
    空の `allowFrom` を持つ `dmPolicy: "allowlist"` はすべての DM をブロックし、config 検証で拒否されます。
    セットアップでは数値ユーザー ID のみを要求します。
    アップグレード後、config に `@username` allowlist エントリが含まれている場合は、`openclaw doctor --fix` を実行して解決してください（ベストエフォート。Telegram ボットトークンが必要です）。
    以前にペアリングストアの allowlist ファイルに依存していた場合、`openclaw doctor --fix` は allowlist フローでエントリを `channels.telegram.allowFrom` に復元できます（たとえば、`dmPolicy: "allowlist"` に明示的な ID がまだない場合）。

    単一所有者のボットでは、以前のペアリング承認に依存するのではなく、明示的な数値 `allowFrom` ID を持つ `dmPolicy: "allowlist"` を優先し、アクセスポリシーを config 内で永続化してください。

    よくある混乱: DM ペアリング承認は「この送信者はどこでも承認されている」という意味ではありません。
    ペアリングは DM アクセスを付与します。コマンド所有者がまだ存在しない場合、最初に承認されたペアリングは `commands.ownerAllowFrom` も設定し、所有者専用コマンドと exec 承認に明示的なオペレーターアカウントを持たせます。
    グループ送信者の認可は、引き続き明示的な config allowlist から取得されます。
    「一度承認されれば、DM とグループコマンドの両方が動作する」ようにしたい場合は、数値の Telegram ユーザー ID を `channels.telegram.allowFrom` に入れてください。所有者専用コマンドでは、`commands.ownerAllowFrom` に `telegram:<your user id>` が含まれていることを確認してください。

    ### Telegram ユーザー ID を見つける

    より安全な方法（サードパーティボットなし）:

    1. 自分のボットに DM します。
    2. `openclaw logs --follow` を実行します。
    3. `from.id` を読み取ります。

    公式 Bot API の方法:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティの方法（プライバシーは低め）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーと allowlist">
    2 つの制御が同時に適用されます。

    1. **どのグループを許可するか**（`channels.telegram.groups`）
       - `groups` config がない場合:
         - `groupPolicy: "open"` の場合: 任意のグループがグループ ID チェックを通過できます
         - `groupPolicy: "allowlist"`（デフォルト）の場合: `groups` エントリ（または `"*"`）を追加するまでグループはブロックされます
       - `groups` が設定されている場合: allowlist として機能します（明示的な ID または `"*"`）

    2. **グループ内でどの送信者を許可するか**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（デフォルト）
       - `disabled`

    `groupAllowFrom` はグループ送信者フィルタリングに使用されます。設定されていない場合、Telegram は `allowFrom` にフォールバックします。
    `groupAllowFrom` エントリは数値の Telegram ユーザー ID にする必要があります（`telegram:` / `tg:` プレフィックスは正規化されます）。
    Telegram グループまたはスーパーグループのチャット ID を `groupAllowFrom` に入れないでください。負のチャット ID は `channels.telegram.groups` 配下に属します。
    数値でないエントリは送信者認可では無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ送信者認証は DM ペアリングストア承認を継承しません。
    ペアリングは DM 専用のままです。グループでは、`groupAllowFrom` またはグループ/トピックごとの `allowFrom` を設定してください。
    `groupAllowFrom` が未設定の場合、Telegram はペアリングストアではなく config の `allowFrom` にフォールバックします。
    単一所有者ボットの実用的なパターン: ユーザー ID を `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにして、対象グループを `channels.telegram.groups` 配下で許可します。
    ランタイム注記: `channels.telegram` が完全に存在しない場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、ランタイムは fail-closed の `groupPolicy="allowlist"` をデフォルトにします。

    所有者専用グループセットアップ:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    グループから `@<bot_username> ping` でテストします。`requireMention: true` の間は、通常のグループメッセージではボットは起動しません。

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

      - `-1001234567890` のような負の Telegram グループまたはスーパーグループのチャット ID は `channels.telegram.groups` 配下に置きます。
      - 許可されたグループ内でどの人がボットを起動できるかを制限したい場合は、`8734062810` のような Telegram ユーザー ID を `groupAllowFrom` 配下に置きます。
      - 許可されたグループの任意のメンバーがボットと会話できるようにしたい場合のみ、`groupAllowFrom: ["*"]` を使用します。

    </Warning>

  </Tab>

  <Tab title="メンション動作">
    グループ返信にはデフォルトでメンションが必要です。

    メンションは次から発生します。

    - ネイティブの `@botusername` メンション、または
    - 次のメンションパターン:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    セッションレベルのコマンドトグル:

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

    グループ履歴コンテキストのデフォルトは `mention-only` です。以前のグループメッセージは、
    ボット宛てだった場合、ボットへの返信だった場合、
    またはボット自身のメッセージだった場合にのみ含まれます。信頼できるグループで最近のルーム履歴を
    含めるには `includeGroupHistoryContext: "recent"` を設定します。次のターンで以前の Telegram グループ履歴を
    送信しない場合は `includeGroupHistoryContext: "none"` を設定します。

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    グループチャット ID の取得方法:

    - グループメッセージを `@userinfobot` / `@getidsbot` に転送する
    - または `openclaw logs --follow` から `chat.id` を読み取る
    - または Bot API `getUpdates` を確認する
    - グループが許可された後、ネイティブコマンドが有効な場合は `/whoami@<bot_username>` を実行する

  </Tab>
</Tabs>

## ランタイム動作

- Telegram は Gatewayプロセスによって所有されます。
- ルーティングは決定的です。Telegram の受信返信は Telegram に返されます（モデルはチャネルを選びません）。
- 受信メッセージは、返信メタデータ、メディアプレースホルダー、Gateway が観測した Telegram 返信の永続化された返信チェーンコンテキストを含む共有チャネルエンベロープに正規化されます。
- グループセッションはグループ ID によって分離されます。フォーラムトピックでは、トピックを分離するために `:topic:<threadId>` が追加されます。
- DM メッセージは `message_thread_id` を持つことがあります。OpenClaw は返信のためにそれを保持します。DM トピックセッションは、Telegram `getMe` がボットに対して `has_topics_enabled: true` を報告した場合にのみ分割されます。それ以外の DM はフラットなセッションのままです。
- ロングポーリングは grammY runner を使用し、チャットごと/スレッドごとの順序制御を行います。runner sink 全体の並行数には `agents.defaults.maxConcurrent` を使用します。
- マルチアカウント起動では、同時実行される Telegram `getMe` プローブを制限し、大規模なボット群がすべてのアカウントプローブを一度に展開しないようにします。
- ロングポーリングは各 Gatewayプロセス内でガードされるため、同時に 1 つのアクティブな poller だけがボットトークンを使用できます。それでも `getUpdates` の 409 競合が表示される場合は、別の OpenClaw Gateway、スクリプト、または外部 poller が同じトークンを使用している可能性があります。
- ロングポーリングの watchdog 再起動は、デフォルトで完了した `getUpdates` の liveness が 120 秒間ない場合にトリガーされます。長時間実行される作業中に、デプロイ環境で誤った polling-stall 再起動がまだ発生する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。値はミリ秒単位で、`30000` から `600000` まで許可されます。アカウントごとの上書きもサポートされています。
- Telegram Bot API には既読通知のサポートはありません（`sendReadReceipts` は適用されません）。

<Note>
  `channels.telegram.dm.threadReplies` と `channels.telegram.direct.<chatId>.threadReplies` は削除されました。設定にこれらのキーがまだある場合は、アップグレード後に `openclaw doctor --fix` を実行してください。DM トピックルーティングは、現在 Telegram `getMe.has_topics_enabled` から得られるボット機能に従います。これは BotFather のスレッドモードによって制御されます。トピックが有効なボットは、Telegram が `message_thread_id` を送信したときにスレッドスコープの DM セッションを使用し、それ以外の DM はフラットなセッションのままです。
</Note>

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClaw は部分的な返信をリアルタイムでストリーミングできます。

    - 直接チャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming` は `off | partial | block | progress` です（デフォルト: `partial`）
    - 短い初期回答プレビューはデバウンスされ、実行がまだアクティブな場合は制限された遅延後に具現化されます
    - `progress` はツール進捗用に編集可能なステータス下書きを 1 つ保持し、ツール進捗より前に回答アクティビティが到着した場合は安定したステータスラベルを表示し、完了時にそれをクリアして、最終回答を通常のメッセージとして送信します
    - `streaming.preview.toolProgress` は、ツール/進捗更新が同じ編集済みプレビューメッセージを再利用するかどうかを制御します（デフォルト: プレビューのストリーミングがアクティブな場合は `true`）
    - `streaming.preview.commandText` は、それらのツール進捗行内のコマンド/exec 詳細を制御します: `raw`（デフォルト、リリース済みの動作を保持）または `status`（ツールラベルのみ）
    - `streaming.progress.commentary`（デフォルト: `false`）は、一時的な進捗下書き内のアシスタントの commentary/preamble テキストを有効にします
    - レガシーの `channels.telegram.streamMode`、boolean の `streaming` 値、廃止されたネイティブ下書きプレビューキーは検出されます。現在のストリーミング設定に移行するには `openclaw doctor --fix` を実行してください

    ツール進捗プレビュー更新は、ツール実行中に表示される短いステータス行です。たとえば、コマンド実行、ファイル読み取り、計画更新、パッチ要約、または Codex app-server モードでの Codex preamble/commentary テキストです。Telegram では、`v2026.4.22` 以降のリリース済み OpenClaw の動作に合わせるため、これらはデフォルトで有効です。

    回答テキストの編集済みプレビューを保持しつつ、ツール進捗行を非表示にするには、次のように設定します。

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

    ツール進捗を表示したまま、コマンド/exec テキストを非表示にするには、次のように設定します。

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    最終回答を同じメッセージに編集せず、可視のツール進捗が必要な場合は `progress` モードを使用します。コマンドテキストポリシーは `streaming.progress` の下に配置します。

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    `streaming.mode: "off"` は、最終のみの配信が必要な場合にのみ使用します。Telegram プレビュー編集は無効になり、汎用的なツール/進捗の雑多なメッセージは、単独のステータスメッセージとして送信される代わりに抑制されます。承認プロンプト、メディアペイロード、エラーは引き続き通常の最終配信を通じてルーティングされます。ツール進捗ステータス行を非表示にしつつ回答プレビュー編集だけを保持したい場合は、`streaming.preview.toolProgress: false` を使用します。

    <Note>
      Telegram の選択引用返信は例外です。`replyToMode` が `"first"`、`"all"`、または `"batched"` で、受信メッセージに選択された引用テキストが含まれる場合、OpenClaw は回答プレビューを編集する代わりに、Telegram のネイティブな引用返信パスを通じて最終回答を送信します。そのため、そのターンでは `streaming.preview.toolProgress` は短いステータス行を表示できません。選択引用テキストのない現在メッセージへの返信では、引き続きプレビューストリーミングが保持されます。ツール進捗の可視性がネイティブ引用返信より重要な場合は `replyToMode: "off"` を設定するか、このトレードオフを受け入れるために `streaming.preview.toolProgress: false` を設定してください。
    </Note>

    テキストのみの返信の場合:

    - 短い DM/グループ/トピックのプレビュー: OpenClaw は同じプレビューメッセージを保持し、最終編集をその場で実行します
    - 複数の Telegram メッセージに分割される長い最終テキストは、可能であれば既存のプレビューを最初の最終チャンクとして再利用し、その後は残りのチャンクだけを送信します
    - progress モードの最終回答はステータス下書きをクリアし、下書きを回答に編集する代わりに通常の最終配信を使用します
    - 完了済みテキストが確認される前に最終編集が失敗した場合、OpenClaw は通常の最終配信を使用し、古いプレビューをクリーンアップします

    複雑な返信（たとえばメディアペイロード）の場合、OpenClaw は通常の最終配信にフォールバックし、その後プレビューメッセージをクリーンアップします。

    プレビューストリーミングはブロックストリーミングとは別です。Telegram でブロックストリーミングが明示的に有効になっている場合、OpenClaw は二重ストリーミングを避けるためにプレビューストリームをスキップします。

    推論ストリームの動作:

    - `/reasoning stream` はサポートされているチャネルの推論プレビューパスを使用します。Telegram では、生成中に推論をライブプレビューへストリーミングします
    - 推論プレビューは最終配信後に削除されます。推論を表示したままにする必要がある場合は `/reasoning on` を使用してください
    - 最終回答は推論テキストなしで送信されます

  </Accordion>

  <Accordion title="リッチメッセージ書式">
    送信テキストは、デフォルトで標準の Telegram HTML メッセージを使用するため、現在の Telegram クライアント全体で返信を読みやすく保てます。この互換モードは通常の太字、斜体、リンク、コード、スポイラー、引用をサポートしますが、ネイティブテーブル、details、リッチメディア、数式など、Bot API 10.1 のリッチ専用ブロックはサポートしません。

    Bot API 10.1 リッチメッセージを有効にするには、`channels.telegram.richMessages: true` を設定します。

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    有効にした場合:

    - エージェントには、このボット/アカウントで Telegram リッチメッセージが利用可能であることが伝えられます。
    - Markdown テキストは OpenClaw の Markdown IR を通じてレンダリングされ、Telegram リッチ HTML として送信されます。
    - 明示的なリッチ HTML ペイロードは、見出し、テーブル、details、リッチメディア、数式など、サポートされている Bot API 10.1 タグを保持します。
    - リッチメッセージはキャプションを置き換えないため、メディアキャプションは引き続き Telegram HTML キャプションを使用します。

    これにより、モデルテキストを Telegram Rich Markdown の記号から遠ざけるため、`$400-600K` のような通貨が数式として解析されません。長いリッチテキストは、Telegram のリッチテキストとリッチブロックの制限に合わせて自動的に分割されます。Telegram の列数制限を超えるテーブルはコードブロックとして送信されます。

    デフォルト: クライアント互換性のためオフ。リッチメッセージには互換性のある Telegram クライアントが必要です。現在の一部の Desktop、Web、Android、およびサードパーティクライアントでは、受け付けられたリッチメッセージが未サポートとして表示されます。ボットで使用されるすべてのクライアントがそれらをレンダリングできる場合を除き、このオプションは無効のままにしてください。`/status` は、現在の Telegram セッションでリッチメッセージがオンかオフかを表示します。

    リンクプレビューはデフォルトで有効です。`channels.telegram.linkPreview: false` はリッチテキストの自動エンティティ検出をスキップします。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegram コマンドメニューの登録は、起動時に `setMyCommands` で処理されます。

    ネイティブコマンドのデフォルト:

    - `commands.native: "auto"` は Telegram のネイティブコマンドを有効にします

    カスタムコマンドメニュー項目を追加します。

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
    - plugin/skill コマンドは、Telegram メニューに表示されていなくても、入力された場合は引き続き動作できます

    ネイティブコマンドが無効になっている場合、組み込みコマンドは削除されます。カスタム/plugin コマンドは、設定されていれば引き続き登録されることがあります。

    一般的なセットアップ失敗:

    - `BOT_COMMANDS_TOO_MUCH` を伴う `setMyCommands failed` は、トリミング後も Telegram メニューがまだ上限を超えていることを意味します。plugin/skill/カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効にしてください。
    - 直接の Bot API curl コマンドは動作するのに、`deleteWebhook`、`deleteMyCommands`、または `setMyCommands` が `404: Not Found` で失敗する場合、`channels.telegram.apiRoot` が完全な `/bot<TOKEN>` エンドポイントに設定されている可能性があります。`apiRoot` は Bot API ルートのみである必要があり、`openclaw doctor --fix` は誤って付いた末尾の `/bot<TOKEN>` を削除します。
    - `getMe returned 401` は、Telegram が設定済みのボットトークンを拒否したことを意味します。`botToken`、`tokenFile`、または `TELEGRAM_BOT_TOKEN` を現在の BotFather トークンで更新してください。OpenClaw はポーリング前に停止するため、これは Webhook クリーンアップ失敗として報告されません。
    - ネットワーク/fetch エラーを伴う `setMyCommands failed` は、通常 `api.telegram.org` への送信 DNS/HTTPS がブロックされていることを意味します。

    ### デバイスペアリングコマンド（`device-pair` plugin）

    `device-pair` plugin がインストールされている場合:

    1. `/pair` がセットアップコードを生成します
    2. iOS アプリにコードを貼り付けます
    3. `/pair pending` が保留中のリクエストを一覧表示します（ロール/スコープを含む）
    4. リクエストを承認します:
       - 明示的に承認する場合は `/pair approve <requestId>`
       - 保留中のリクエストが 1 つだけの場合は `/pair approve`
       - 最新のものには `/pair approve latest`

    セットアップコードには短命のブートストラップトークンが含まれます。組み込みのセットアップコードブートストラップは node 専用です。最初の接続で保留中の node リクエストが作成され、承認後に Gateway は `scopes: []` を持つ永続的な node トークンを返します。引き渡された operator トークンは返しません。operator アクセスには、別途承認された operator ペアリングまたはトークンフローが必要です。

    デバイスが変更された認証詳細（たとえばロール/スコープ/公開鍵）で再試行した場合、以前の保留中リクエストは置き換えられ、新しいリクエストは別の `requestId` を使用します。承認前に `/pair pending` を再実行してください。

    詳細: [ペアリング](/ja-JP/channels/pairing#pair-via-telegram-recommended-for-ios).

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
    - `allowlist` (デフォルト)

    レガシーの `capabilities: ["inlineButtons"]` は `inlineButtons: "all"` に対応します。

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

    Mini App ボタンの例:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Open app:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Launch", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    Telegram の `web_app` ボタンは、ユーザーと
    bot の間のプライベートチャットでのみ機能します。

    コールバックのクリックはテキストとしてエージェントに渡されます:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="エージェントと自動化向けの Telegram メッセージアクション">
    Telegram ツールアクションには以下が含まれます:

    - `sendMessage` (`to`, `content`, 任意の `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` または `caption`, 任意の `presentation` インラインボタン。ボタンのみの編集は返信マークアップを更新します)
    - `createForumTopic` (`chatId`, `name`, 任意の `iconColor`, `iconCustomEmojiId`)

    チャンネルメッセージアクションは、使いやすいエイリアス (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`) を公開します。

    ゲート制御:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (デフォルト: 無効)

    注: `edit` と `topic-create` は現在デフォルトで有効であり、個別の `channels.telegram.actions.*` トグルはありません。
    ランタイム送信はアクティブな config/secrets スナップショット (起動/リロード) を使用するため、アクションパスは送信ごとにアドホックな SecretRef 再解決を行いません。

    リアクション削除のセマンティクス: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="返信スレッドタグ">
    Telegram は生成出力内の明示的な返信スレッドタグをサポートします:

    - `[[reply_to_current]]` はトリガー元メッセージに返信します
    - `[[reply_to:<id>]]` は特定の Telegram メッセージ ID に返信します

    `channels.telegram.replyToMode` は処理を制御します:

    - `off` (デフォルト)
    - `first`
    - `all`

    返信スレッドが有効で、元の Telegram テキストまたはキャプションが利用可能な場合、OpenClaw はネイティブ Telegram 引用抜粋を自動的に含めます。Telegram はネイティブ引用テキストを 1024 UTF-16 コードユニットに制限しているため、長いメッセージは先頭から引用され、Telegram が引用を拒否した場合は通常の返信にフォールバックします。

    注: `off` は暗黙的な返信スレッドを無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッド動作">
    フォーラムスーパーグループ:

    - トピックセッションキーは `:topic:<threadId>` を追加します
    - 返信と入力中表示はトピックスレッドを対象にします
    - トピック設定パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般トピック (`threadId=1`) の特殊ケース:

    - メッセージ送信では `message_thread_id` を省略します (Telegram は `sendMessage(...thread_id=1)` を拒否します)
    - 入力中アクションには引き続き `message_thread_id` が含まれます

    トピックの継承: トピックエントリは、上書きされない限りグループ設定 (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`) を継承します。
    `agentId` はトピック専用であり、グループデフォルトからは継承されません。
    `topics."*"` はそのグループ内のすべてのトピックのデフォルトを設定します。正確なトピック ID は引き続き `"*"` より優先されます。

    **トピックごとのエージェントルーティング**: 各トピックは、トピック設定で `agentId` を設定することで別のエージェントにルーティングできます。これにより各トピックは、独立したワークスペース、メモリ、セッションを持ちます。例:

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

    各トピックは次のような独自のセッションキーを持ちます: `agent:zu:telegram:group:-1001234567890:topic:3`

    **永続 ACP トピックバインド**: フォーラムトピックは、トップレベルの型付き ACP バインド (`bindings[]`、`type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`、および `-1001234567890:topic:42` のようなトピック修飾 id) を通じて ACP ハーネスセッションを固定できます。現在はグループ/スーパーグループ内のフォーラムトピックに限定されています。[ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

    **チャットからのスレッドバインド ACP spawn**: `/acp spawn <agent> --thread here|auto` は現在のトピックを新しい ACP セッションにバインドします。以降のやり取りはそこに直接ルーティングされます。OpenClaw は spawn 確認をトピック内にピン留めします。`channels.telegram.threadBindings.spawnSessions` が有効なままである必要があります (デフォルト: `true`)。

    テンプレートコンテキストは `MessageThreadId` と `IsForum` を公開します。`message_thread_id` を持つ DM チャットは返信メタデータを保持します。Telegram `getMe` が bot に対して `has_topics_enabled: true` を報告した場合にのみ、スレッド対応のセッションキーを使用します。
    以前の `dm.threadReplies` と `direct.*.threadReplies` オーバーライドは意図的に廃止されています。BotFather のスレッドモードを単一の信頼できる情報源として使用し、`openclaw doctor --fix` を実行して古い設定キーを削除してください。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegram はボイスメモと音声ファイルを区別します。

    - デフォルト: 音声ファイルの動作
    - エージェント返信内のタグ `[[audio_as_voice]]` でボイスメモ送信を強制します
    - 受信したボイスメモの文字起こしは、エージェントコンテキスト内で機械生成の
      信頼できないテキストとして扱われます。メンション検出は引き続き生の
      文字起こしを使用するため、メンションでゲートされた音声メッセージは引き続き機能します。

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

    Telegram は動画ファイルとビデオノートを区別します。

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

    ビデオノートはキャプションをサポートしません。指定されたメッセージテキストは別途送信されます。

    ### ステッカー

    受信ステッカーの処理:

    - 静的 WEBP: ダウンロードして処理されます（プレースホルダー `<media:sticker>`）
    - アニメーション TGS: スキップされます
    - 動画 WEBM: スキップされます

    ステッカーコンテキストフィールド:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ステッカーの説明は、繰り返しの vision 呼び出しを減らすために OpenClaw SQLite Plugin 状態にキャッシュされます。

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
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="リアクション通知">
    Telegram のリアクションは `message_reaction` 更新として届きます（メッセージペイロードとは別です）。

    有効にすると、OpenClaw は次のようなシステムイベントをキューに入れます:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定:

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    注記:

    - `own` は、bot が送信したメッセージに対するユーザーのリアクションのみを意味します（送信済みメッセージキャッシュによるベストエフォート）。
    - リアクションイベントは引き続き Telegram のアクセス制御（`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`）に従います。許可されていない送信者は破棄されます。
    - Telegram はリアクション更新でスレッド ID を提供しません。
      - 非フォーラムグループはグループチャットセッションにルーティングされます
      - フォーラムグループは、正確な発生元トピックではなく、グループの一般トピックセッション（`:topic:1`）にルーティングされます

    ポーリング/Webhook の `allowed_updates` には `message_reaction` が自動的に含まれます。

  </Accordion>

  <Accordion title="確認応答リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間に確認応答 emoji を送信します。`ackReactionScope` は、その emoji が実際に送信される*タイミング*を決定します。

    **Emoji（`ackReaction`）の解決順序:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - agent identity emoji フォールバック（`agents.list[].identity.emoji`、それ以外は "👀"）

    注記:

    - Telegram は unicode emoji（例: "👀"）を想定します。
    - チャンネルまたはアカウントのリアクションを無効にするには `""` を使用します。

    **スコープ（`messages.ackReactionScope`）:**

    Telegram provider は `messages.ackReactionScope` からスコープを読み取ります（デフォルトは `"group-mentions"`）。現在、Telegram アカウント単位または Telegram チャンネル単位のオーバーライドはありません。

    値: `"all"`（DM + グループ）、`"direct"`（DM のみ）、`"group-all"`（すべてのグループメッセージ、DM なし）、`"group-mentions"`（bot がメンションされたグループ。**DM なし** — これがデフォルト）、`"off"` / `"none"`（無効）。

    <Note>
    デフォルトスコープ（`"group-mentions"`）では、ダイレクトメッセージで確認応答リアクションは発火しません。受信 Telegram DM で確認応答リアクションを得るには、`messages.ackReactionScope` を `"direct"` または `"all"` に設定します。この値は Telegram provider の起動時に読み取られるため、変更を有効にするには Gateway の再起動が必要です。
    </Note>

  </Accordion>

  <Accordion title="Telegram イベントとコマンドからの設定書き込み">
    チャンネル設定の書き込みはデフォルトで有効です（`configWrites !== false`）。

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
    デフォルトはロングポーリングです。Webhook モードでは `channels.telegram.webhookUrl` と `channels.telegram.webhookSecret` を設定します。任意で `webhookPath`, `webhookHost`, `webhookPort` も設定できます（デフォルトは `/telegram-webhook`, `127.0.0.1`, `8787`）。

    ロングポーリングモードでは、OpenClaw は更新のディスパッチが成功した後にのみ再起動ウォーターマークを永続化します。ハンドラーが失敗した場合、その更新は同じプロセス内で再試行可能なままとなり、再起動時の重複排除のために完了済みとして書き込まれません。

    ローカルリスナーは `127.0.0.1:8787` にバインドします。公開 ingress では、ローカルポートの前段にリバースプロキシを置くか、意図的に `webhookHost: "0.0.0.0"` を設定します。

    Webhook モードでは、Telegram に `200` を返す前に、リクエストガード、Telegram シークレットトークン、JSON 本文を検証します。
    その後 OpenClaw は、ロングポーリングで使用されるものと同じチャット別/トピック別の bot レーンを通じて更新を非同期に処理するため、遅い agent ターンが Telegram の配信 ACK を保持することはありません。

  </Accordion>

  <Accordion title="制限、再試行、CLI ターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは 4000 です。
    - `channels.telegram.chunkMode="newline"` は、長さで分割する前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト 100）は、受信および送信 Telegram メディアサイズの上限を設定します。
    - `channels.telegram.mediaGroupFlushMs`（デフォルト 500）は、Telegram のアルバム/メディアグループを OpenClaw が 1 件の受信メッセージとしてディスパッチする前にバッファリングする時間を制御します。アルバムの一部が遅れて到着する場合は増やし、アルバム返信のレイテンシを下げる場合は減らします。
    - `channels.telegram.timeoutSeconds` は Telegram API クライアントのタイムアウトを上書きします（未設定の場合は grammY のデフォルトが適用されます）。ボットクライアントは、OpenClaw のトランスポートガードとフォールバックが実行される前に grammY が可視の返信配信を中止しないよう、設定値を 60 秒の送信テキスト/入力中リクエストガード未満にクランプします。ロングポーリングでは引き続き 45 秒の `getUpdates` リクエストガードを使用するため、アイドル状態のポーリングが無期限に放棄されることはありません。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは `120000` です。誤検知のポーリング停止再起動に限り、`30000` から `600000` の間で調整します。
    - グループコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit`（デフォルト 50）を使用します。`0` で無効化します。
    - 返信/引用/転送の補足コンテキストは、Gateway が親メッセージを観測済みの場合、選択された 1 つの会話コンテキストウィンドウに正規化されます。観測済みメッセージキャッシュは OpenClaw SQLite Plugin 状態に保存され、`openclaw doctor --fix` はレガシーのサイドカーをインポートします。Telegram は更新内に浅い `reply_to_message` を 1 つだけ含めるため、キャッシュより古いチェーンは Telegram の現在の更新ペイロードに制限されます。
    - Telegram の許可リストは、主に誰がエージェントをトリガーできるかを制御するものであり、完全な補足コンテキストの墨消し境界ではありません。
    - DM 履歴制御:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定は、復旧可能な送信 API エラーに対する Telegram 送信ヘルパー（CLI/ツール/アクション）に適用されます。受信の最終返信配信も、Telegram の接続前失敗に対して境界付きの安全な送信再試行を使用しますが、可視メッセージを重複させる可能性がある送信後のあいまいなネットワークエンベロープは再試行しません。

    CLI およびメッセージツールの送信ターゲットには、数値チャット ID、ユーザー名、またはフォーラムトピックターゲットを使用できます。

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram ポーリングは `openclaw message poll` を使用し、フォーラムトピックをサポートします。

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

    Telegram 送信は次もサポートします。

    - `channels.telegram.capabilities.inlineButtons` が許可している場合、インラインキーボード用の `buttons` ブロックを伴う `--presentation`
    - ボットがそのチャットでピン留めできる場合、ピン留め配信を要求する `--pin` または `--delivery '{"pin":true}'`
    - 送信画像、GIF、動画を、圧縮写真、アニメーションメディア、動画アップロードではなくドキュメントとして送信する `--force-document`

    アクション制御:

    - `channels.telegram.actions.sendMessage=false` は、ポーリングを含む Telegram 送信メッセージを無効化します
    - `channels.telegram.actions.poll=false` は、通常の送信を有効のまま、Telegram ポーリング作成を無効化します

  </Accordion>

  <Accordion title="Telegram での exec 承認">
    Telegram は承認者 DM で exec 承認をサポートし、任意で元のチャットまたはトピックにプロンプトを投稿できます。承認者は数値の Telegram ユーザー ID である必要があります。

    設定パス:

    - `channels.telegram.execApprovals.enabled`（少なくとも 1 人の承認者を解決できる場合に自動有効化）
    - `channels.telegram.execApprovals.approvers`（`commands.ownerAllowFrom` の数値オーナー ID にフォールバック）
    - `channels.telegram.execApprovals.target`: `dm`（デフォルト） | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom`、`defaultTo` は、誰がボットと会話できるか、および通常の返信をどこへ送信するかを制御します。これらは誰かを exec 承認者にするものではありません。まだコマンドオーナーが存在しない場合、最初に承認された DM ペアリングが `commands.ownerAllowFrom` をブートストラップするため、1 オーナー構成は `execApprovals.approvers` に ID を重複させなくても機能します。

    チャンネル配信はチャットにコマンドテキストを表示します。信頼できるグループ/トピックでのみ `channel` または `both` を有効にしてください。プロンプトがフォーラムトピックに到達した場合、OpenClaw は承認プロンプトと後続応答でそのトピックを保持します。exec 承認はデフォルトで 30 分後に期限切れになります。

    インライン承認ボタンでも、`channels.telegram.capabilities.inlineButtons` がターゲットサーフェス（`dm`、`group`、または `all`）を許可している必要があります。`plugin:` で始まる承認 ID は Plugin 承認を通じて解決され、それ以外はまず exec 承認を通じて解決されます。

    [Exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## エラー返信制御

エージェントが配信エラーまたはプロバイダーエラーに遭遇した場合、エラーポリシーはエラーメッセージを Telegram チャットへ送信するかどうかを制御します。

| キー                                | 値                         | デフォルト      | 説明                                                                                                                                                                                                      |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — すべてのエラーメッセージをチャットへ送信します。`once` — クールダウンウィンドウごとに各一意のエラーメッセージを 1 回送信します（同一エラーの繰り返しを抑制）。`silent` — エラーメッセージをチャットへ送信しません。 |
| `channels.telegram.errorCooldownMs` | 数値 (ms)                  | `14400000` (4h) | `once` ポリシーのクールダウンウィンドウです。エラーが送信された後、この間隔が経過するまで同じエラーメッセージは抑制されます。障害中のエラースパムを防ぎます。                                      |

アカウントごと、グループごと、トピックごとの上書きがサポートされています（他の Telegram 設定キーと同じ継承）。

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
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

    - `requireMention=false` の場合、Telegram プライバシーモードで完全な可視性が許可されている必要があります。
      - BotFather: `/setprivacy` -> Disable
      - その後、ボットをグループから削除して再追加します
    - `openclaw channels status` は、設定がメンションなしのグループメッセージを想定している場合に警告します。
    - `openclaw channels status --probe` は明示的な数値グループ ID を確認できます。ワイルドカード `"*"` はメンバーシップをプローブできません。
    - 簡易セッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="ボットがグループメッセージをまったく認識しない">

    - `channels.telegram.groups` が存在する場合、グループがリストされている必要があります（または `"*"` を含めます）
    - グループ内のボットメンバーシップを確認します
    - ログを確認します: スキップ理由は `openclaw logs --follow`

  </Accordion>

  <Accordion title="コマンドが一部しか動作しない、またはまったく動作しない">

    - 送信者 ID を承認します（ペアリングおよび/または数値の `allowFrom`）
    - グループポリシーが `open` の場合でも、コマンド承認は引き続き適用されます
    - `BOT_COMMANDS_TOO_MUCH` を伴う `setMyCommands failed` は、ネイティブメニューのエントリが多すぎることを意味します。Plugin/skill/カスタムコマンドを減らすか、ネイティブメニューを無効化してください
    - `deleteMyCommands` / `setMyCommands` の起動時呼び出しと `sendChatAction` の入力中呼び出しは境界付きで、リクエストタイムアウト時には Telegram のトランスポートフォールバックを通じて 1 回再試行されます。永続的なネットワーク/fetch エラーは通常、`api.telegram.org` への DNS/HTTPS 到達性の問題を示します

  </Accordion>

  <Accordion title="起動時に未承認トークンが報告される">

    - `getMe returned 401` は、設定済みボットトークンに対する Telegram 認証失敗です。
    - BotFather でボットトークンを再コピーまたは再生成し、デフォルトアカウント用の `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken`、または `TELEGRAM_BOT_TOKEN` を更新します。
    - 起動中の `deleteWebhook 401 Unauthorized` も認証失敗です。これを「Webhook が存在しない」と扱うと、同じ不正なトークンによる失敗を後続の API 呼び出しまで先送りするだけです。

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定性">

    - Node 22+ とカスタム fetch/proxy の組み合わせでは、AbortSignal 型が一致しない場合に即時中止動作を引き起こすことがあります。
    - 一部のホストは `api.telegram.org` を IPv6 優先で解決します。IPv6 の外向き通信が壊れていると、Telegram API の断続的な失敗が発生する可能性があります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれる場合、OpenClaw はこれらを復旧可能なネットワークエラーとして再試行するようになりました。
    - ポーリング起動中、OpenClaw は grammY 用に成功した起動時の `getMe` プローブを再利用するため、ランナーは最初の `getUpdates` の前に 2 回目の `getMe` を必要としません。
    - ポーリング起動中に `deleteWebhook` が一時的なネットワークエラーで失敗した場合、OpenClaw は別のポーリング前コントロールプレーン呼び出しを行わず、ロングポーリングへ続行します。Webhook がまだアクティブな場合は `getUpdates` の競合として表面化し、その後 OpenClaw は Telegram トランスポートを再構築して Webhook クリーンアップを再試行します。
    - Telegram ソケットが短い固定間隔で再作成される場合、低い `channels.telegram.timeoutSeconds` を確認してください。ボットクライアントは設定値を送信および `getUpdates` リクエストガード未満にクランプしますが、古いリリースではこの値がそれらのガードより低く設定されていると、すべてのポーリングまたは返信が中止される可能性がありました。
    - ログに `Polling stall detected` が含まれる場合、OpenClaw はデフォルトで、完了したロングポーリングの生存確認が 120 秒間ないとポーリングを再起動し、Telegram トランスポートを再構築します。
    - `openclaw channels status --probe` と `openclaw doctor` は、実行中のポーリングアカウントが起動猶予後に `getUpdates` を完了していない場合、実行中の Webhook アカウントが起動猶予後に `setWebhook` を完了していない場合、または最後に成功したポーリングトランスポートアクティビティが古い場合に警告します。
    - 長時間実行される `getUpdates` 呼び出しが正常であるにもかかわらず、ホストが誤ったポーリング停止再起動を報告する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。永続的な停止は通常、ホストと `api.telegram.org` の間の proxy、DNS、IPv6、または TLS 外向き通信の問題を示します。
    - Telegram は Bot API トランスポートについて、`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、およびそれらの小文字バリアントを含むプロセス proxy 環境変数も尊重します。`NO_PROXY` / `no_proxy` は引き続き `api.telegram.org` をバイパスできます。
    - OpenClaw 管理 proxy がサービス環境用に `OPENCLAW_PROXY_URL` で設定されており、標準の proxy 環境変数が存在しない場合、Telegram は Bot API トランスポートにもその URL を使用します。
    - 直接の外向き通信/TLS が不安定な VPS ホストでは、Telegram API 呼び出しを `channels.telegram.proxy` 経由でルーティングします。

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ はデフォルトで `autoSelectFamily=true` です（WSL2 を除く）。Telegram の DNS 結果順序は、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、次に `channels.telegram.network.dnsResultOrder`、次に `NODE_OPTIONS=--dns-result-order=ipv4first` のようなプロセスのデフォルトに従います。いずれも適用されない場合、Node 22+ は `ipv4first` にフォールバックします。
    - ホストが WSL2 の場合、または IPv4 のみの動作のほうが明示的に適している場合は、ファミリー選択を強制します。

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 ベンチマーク範囲の応答（`198.18.0.0/15`）は、デフォルトで
      Telegram メディアダウンロードに対してすでに許可されています。信頼済みの fake-IP または
      透過プロキシが、メディアダウンロード中に `api.telegram.org` を他の
      プライベート/内部/特殊用途アドレスへ書き換える場合は、Telegram のみのバイパスを
      オプトインできます。

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じオプトインは、アカウントごとに
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
      でも利用できます。
    - プロキシが Telegram メディアホストを `198.18.x.x` に解決する場合は、まず
      危険なフラグをオフのままにしてください。Telegram メディアはデフォルトで
      RFC 2544 ベンチマーク範囲をすでに許可しています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` は Telegram
      メディアの SSRF 保護を弱めます。Clash、Mihomo、Surge の fake-IP ルーティングのように、
      RFC 2544 ベンチマーク範囲外のプライベートまたは特殊用途の応答を合成する、
      信頼済みのオペレーター管理プロキシ環境でのみ使用してください。
      通常の公開インターネット経由の Telegram アクセスではオフのままにしてください。
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

詳細なヘルプ: [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

## 設定リファレンス

主なリファレンス: [設定リファレンス - Telegram](/ja-JP/gateway/config-channels#telegram)。

<Accordion title="重要度の高い Telegram フィールド">

- 起動/認証: `enabled`, `botToken`, `tokenFile`, `accounts.*`（`tokenFile` は通常ファイルを指す必要があります。シンボリックリンクは拒否されます）
- アクセス制御: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, トップレベルの `bindings[]`（`type: "acp"`）
- トピックのデフォルト: `groups.<chatId>.topics."*"` は一致しないフォーラムトピックに適用されます。正確なトピック ID はこれを上書きします
- 実行承認: `execApprovals`, `accounts.*.execApprovals`
- コマンド/メニュー: `commands.native`, `commands.nativeSkills`, `customCommands`
- スレッド/返信: `replyToMode`
- ストリーミング: `streaming`（プレビュー）, `streaming.preview.toolProgress`, `blockStreaming`
- 書式設定/配信: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- メディア/ネットワーク: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- カスタム API ルート: `apiRoot`（Bot API ルートのみ。`/bot<TOKEN>` は含めないでください）
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- アクション/機能: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- リアクション: `reactionNotifications`, `reactionLevel`
- エラー: `errorPolicy`, `errorCooldownMs`
- 書き込み/履歴: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
複数アカウントの優先順位: 2 つ以上のアカウント ID が設定されている場合は、デフォルトのルーティングを明示するために `channels.telegram.defaultAccount` を設定します（または `channels.telegram.accounts.default` を含めます）。そうしない場合、OpenClaw は最初に正規化されたアカウント ID にフォールバックし、`openclaw doctor` が警告します。名前付きアカウントは `channels.telegram.allowFrom` / `groupAllowFrom` を継承しますが、`accounts.default.*` の値は継承しません。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram ユーザーを Gateway にペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループとトピックの許可リスト動作。
  </Card>
  <Card title="チャンネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントにルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルとハードニング。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    グループとトピックをエージェントにマッピングします。
  </Card>
  <Card title="トラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断。
  </Card>
</CardGroup>
