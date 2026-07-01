---
read_when:
    - Telegram 機能や Webhook に取り組む
summary: Telegramボットのサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-07-01T20:10:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 541ce276cf045b19461167513d86e2dd9a5bb8ff95bcb9e55f10440e2e66a165
    source_path: channels/telegram.md
    workflow: 16
---

本番利用可能で、grammY 経由のボット DM とグループに対応します。ロングポーリングがデフォルトモードで、Webhook モードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram のデフォルト DM ポリシーはペアリングです。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断と修復プレイブックです。
  </Card>
  <Card title="Gateway 設定" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャネル設定パターンと例です。
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

    環境変数フォールバック: `TELEGRAM_BOT_TOKEN=...`（デフォルトアカウントのみ）。
    Telegram は `openclaw channels login telegram` を使用しません。config/env でトークンを設定してから Gateway を起動してください。

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
    ボットをグループに追加し、グループアクセスに必要な両方の ID を取得します。

    - `allowFrom` / `groupAllowFrom` で使用する自分の Telegram ユーザー ID
    - `channels.telegram.groups` 配下のキーとして使用する Telegram グループチャット ID

    初回セットアップでは、`openclaw logs --follow`、転送 ID ボット、または Bot API `getUpdates` からグループチャット ID を取得します。グループが許可された後は、`/whoami@<bot_username>` でユーザー ID とグループ ID を確認できます。

    `-100` で始まる負の Telegram スーパーグループ ID はグループチャット ID です。`groupAllowFrom` ではなく `channels.telegram.groups` 配下に配置してください。

  </Step>
</Steps>

<Note>
トークン解決順序はアカウントを考慮します。実際には、config 値が環境変数フォールバックより優先され、`TELEGRAM_BOT_TOKEN` はデフォルトアカウントにのみ適用されます。
起動に成功すると、OpenClaw はボット ID を state ディレクトリに最大 24 時間キャッシュするため、再起動時に追加の Telegram `getMe` 呼び出しを避けられます。トークンを変更または削除すると、そのキャッシュはクリアされます。
</Note>

## Telegram 側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループの可視性">
    Telegram ボットはデフォルトで **プライバシーモード** になっており、グループメッセージの受信範囲が制限されます。

    ボットがすべてのグループメッセージを見る必要がある場合は、次のいずれかを行います。

    - `/setprivacy` でプライバシーモードを無効にする、または
    - ボットをグループ管理者にする。

    プライバシーモードを切り替える場合は、各グループでボットを削除してから再追加し、Telegram に変更を適用させます。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスは Telegram グループ設定で制御されます。

    管理者ボットはすべてのグループメッセージを受信するため、常時有効なグループ動作に便利です。

  </Accordion>

  <Accordion title="便利な BotFather 切り替え">

    - グループ追加を許可/拒否するための `/setjoingroups`
    - グループの可視性動作のための `/setprivacy`

  </Accordion>
</AccordionGroup>

## アクセス制御と有効化

### グループボット ID

Telegram グループとフォーラムトピックでは、設定済みのボットハンドル（例: `@my_bot`）への明示的なメンションは、エージェントのペルソナ名が Telegram ユーザー名と異なる場合でも、選択された OpenClaw エージェント宛てとして扱われます。グループの沈黙ポリシーは無関係なグループトラフィックには引き続き適用されますが、ボットハンドル自体は「別の誰か」とは見なされません。

<Tabs>
  <Tab title="DM ポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom` に少なくとも 1 つの送信者 ID が必要）
    - `open`（`allowFrom` に `"*"` を含める必要あり）
    - `disabled`

    `allowFrom: ["*"]` を伴う `dmPolicy: "open"` は、ボットユーザー名を見つけた、または推測した任意の Telegram アカウントがボットにコマンドを実行できるようにします。厳密に制限されたツールを持つ意図的に公開されたボットにのみ使用してください。単一所有者のボットでは、数値ユーザー ID を指定した `allowlist` を使用するべきです。

    `channels.telegram.allowFrom` は数値の Telegram ユーザー ID を受け付けます。`telegram:` / `tg:` プレフィックスは受け付けられ、正規化されます。
    複数アカウント設定では、制限的なトップレベルの `channels.telegram.allowFrom` は安全境界として扱われます。アカウントレベルの `allowFrom: ["*"]` エントリは、マージ後の実効アカウント allowlist に明示的なワイルドカードが残っていない限り、そのアカウントを公開しません。
    空の `allowFrom` を伴う `dmPolicy: "allowlist"` はすべての DM をブロックし、config 検証で拒否されます。
    セットアップでは数値ユーザー ID のみを求めます。
    アップグレード後の config に `@username` allowlist エントリが含まれている場合は、`openclaw doctor --fix` を実行して解決してください（ベストエフォート。Telegram ボットトークンが必要です）。
    以前にペアリングストアの allowlist ファイルに依存していた場合、`openclaw doctor --fix` は allowlist フローでエントリを `channels.telegram.allowFrom` に復元できます（たとえば `dmPolicy: "allowlist"` に明示的な ID がまだない場合）。

    単一所有者のボットでは、明示的な数値 `allowFrom` ID を指定した `dmPolicy: "allowlist"` を優先し、アクセスポリシーを config 内で永続化してください（以前のペアリング承認に依存しないようにするため）。

    よくある混同: DM ペアリング承認は「この送信者がどこでも認可されている」という意味ではありません。
    ペアリングは DM アクセスを許可します。コマンド所有者がまだ存在しない場合、最初に承認されたペアリングは `commands.ownerAllowFrom` も設定し、所有者専用コマンドと exec 承認に明示的なオペレーターアカウントを持たせます。
    グループ送信者の認可は、引き続き明示的な config allowlist から取得されます。
    「一度認可されれば DM とグループコマンドの両方が動作する」状態にしたい場合は、数値の Telegram ユーザー ID を `channels.telegram.allowFrom` に入れてください。所有者専用コマンドについては、`commands.ownerAllowFrom` に `telegram:<your user id>` が含まれていることを確認してください。

    ### Telegram ユーザー ID を見つける

    より安全な方法（サードパーティボットなし）:

    1. 自分のボットに DM します。
    2. `openclaw logs --follow` を実行します。
    3. `from.id` を読み取ります。

    公式 Bot API の方法:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティの方法（プライバシーは低下）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーと allowlist">
    2 つの制御が一緒に適用されます。

    1. **どのグループが許可されるか**（`channels.telegram.groups`）
       - `groups` config なし:
         - `groupPolicy: "open"` の場合: 任意のグループがグループ ID チェックを通過可能
         - `groupPolicy: "allowlist"`（デフォルト）の場合: `groups` エントリ（または `"*"`）を追加するまでグループはブロックされる
       - `groups` が設定済み: allowlist として動作（明示的な ID または `"*"`）

    2. **グループ内でどの送信者が許可されるか**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（デフォルト）
       - `disabled`

    `groupAllowFrom` はグループ送信者フィルタリングに使用されます。設定されていない場合、Telegram は `allowFrom` にフォールバックします。
    `groupAllowFrom` エントリは数値の Telegram ユーザー ID にするべきです（`telegram:` / `tg:` プレフィックスは正規化されます）。
    Telegram グループまたはスーパーグループのチャット ID を `groupAllowFrom` に入れないでください。負のチャット ID は `channels.telegram.groups` 配下に属します。
    数値でないエントリは、送信者認可では無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ送信者認証は DM ペアリングストア承認を継承しません。
    ペアリングは DM 専用のままです。グループには `groupAllowFrom` またはグループ別/トピック別の `allowFrom` を設定してください。
    `groupAllowFrom` が未設定の場合、Telegram はペアリングストアではなく config の `allowFrom` にフォールバックします。
    単一所有者ボットの実用的なパターン: 自分のユーザー ID を `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにして、対象グループを `channels.telegram.groups` 配下で許可します。
    ランタイムの注意: `channels.telegram` が完全に存在しない場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、ランタイムは fail-closed の `groupPolicy="allowlist"` をデフォルトにします。

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

    グループから `@<bot_username> ping` でテストします。`requireMention: true` の間、通常のグループメッセージはボットをトリガーしません。

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

    例: 1 つの特定グループ内の特定ユーザーだけを許可する:

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

      - `-1001234567890` のような負の Telegram グループまたはスーパーグループチャット ID は `channels.telegram.groups` 配下に入れてください。
      - 許可済みグループ内でどの人がボットをトリガーできるかを制限したい場合は、`8734062810` のような Telegram ユーザー ID を `groupAllowFrom` 配下に入れてください。
      - 許可済みグループの任意のメンバーがボットと話せるようにしたい場合にのみ、`groupAllowFrom: ["*"]` を使用してください。

    </Warning>

  </Tab>

  <Tab title="メンション動作">
    グループ返信はデフォルトでメンションを必要とします。

    メンションは次のいずれかから取得できます。

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

    グループ履歴コンテキストのデフォルトは `mention-only` です。以前のグループメッセージは、
    ボット宛てだった場合、ボットへの返信だった場合、
    またはボット自身のメッセージだった場合にのみ含まれます。信頼済みグループで最近のルーム履歴を
    含めるには `includeGroupHistoryContext: "recent"` を設定します。
    次のターンで以前の Telegram グループ履歴を送信しない場合は、
    `includeGroupHistoryContext: "none"` を設定します。

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    グループチャット ID を取得する:

    - グループメッセージを `@userinfobot` / `@getidsbot` に転送する
    - または `openclaw logs --follow` から `chat.id` を読み取る
    - または Bot API `getUpdates` を確認する
    - グループが許可された後、ネイティブコマンドが有効な場合は `/whoami@<bot_username>` を実行する

  </Tab>
</Tabs>

## ランタイム動作

- Telegram は Gateway プロセスが所有します。
- ルーティングは決定的です。Telegram のインバウンドは Telegram に返信されます（モデルはチャンネルを選択しません）。
- インバウンドメッセージは、返信メタデータ、メディアプレースホルダー、Gateway が観測した Telegram 返信の永続化された返信チェーンコンテキストを含む共有チャンネルエンベロープに正規化されます。
- グループセッションはグループ ID で分離されます。フォーラムトピックは `:topic:<threadId>` を付加してトピックを分離します。
- DM メッセージは `message_thread_id` を持つことがあります。OpenClaw は返信用にそれを保持します。DM トピックセッションは、Telegram `getMe` がボットについて `has_topics_enabled: true` を報告した場合にのみ分割されます。それ以外の場合、DM はフラットなセッションのままです。
- ロングポーリングは grammY runner を使用し、チャット単位/スレッド単位で順序制御します。runner 全体の sink concurrency は `agents.defaults.maxConcurrent` を使用します。
- マルチアカウント起動では、同時実行される Telegram `getMe` プローブに上限を設け、大規模なボット群がすべてのアカウントプローブを一度にファンアウトしないようにします。
- ロングポーリングは各 Gateway プロセス内でガードされるため、同時にボットトークンを使用できるアクティブな poller は 1 つだけです。それでも `getUpdates` 409 競合が表示される場合は、別の OpenClaw Gateway、スクリプト、または外部 poller が同じトークンを使用している可能性があります。
- ロングポーリング watchdog の再起動は、既定では 120 秒間 `getUpdates` liveness の完了がない場合にトリガーされます。デプロイで長時間実行中の作業中に誤った polling-stall 再起動がまだ発生する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。値はミリ秒単位で、`30000` から `600000` まで許可されます。アカウント単位のオーバーライドもサポートされています。
- Telegram Bot API には既読通知のサポートはありません（`sendReadReceipts` は適用されません）。

<Note>
  `channels.telegram.dm.threadReplies` と `channels.telegram.direct.<chatId>.threadReplies` は削除されました。設定にまだこれらのキーがある場合は、アップグレード後に `openclaw doctor --fix` を実行してください。DM トピックルーティングは、Telegram `getMe.has_topics_enabled` から得られるボット機能に従うようになりました。これは BotFather のスレッドモードによって制御されます。topics-enabled ボットは、Telegram が `message_thread_id` を送信した場合にスレッドスコープの DM セッションを使用します。それ以外の DM はフラットなセッションのままです。
</Note>

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClaw は部分的な返信をリアルタイムでストリーミングできます。

    - ダイレクトチャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming` は `off | partial | block | progress` です（既定: `partial`）
    - 短い初期回答プレビューはデバウンスされ、run がまだアクティブな場合は上限付き遅延の後に実体化されます
    - `progress` はツール進捗用に編集可能なステータス下書きを 1 つ保持し、ツール進捗より前に回答アクティビティが到着した場合は安定したステータスラベルを表示し、完了時にクリアし、最終回答を通常メッセージとして送信します
    - `streaming.preview.toolProgress` は、ツール/進捗更新で同じ編集済みプレビューメッセージを再利用するかどうかを制御します（既定: プレビューストリーミングがアクティブな場合は `true`）
    - `streaming.preview.commandText` は、それらのツール進捗行内のコマンド/実行詳細を制御します: `raw`（既定、リリース済みの挙動を保持）または `status`（ツールラベルのみ）
    - `streaming.progress.commentary`（既定: `false`）は、一時的な進捗下書きで assistant commentary/preamble テキストを有効にします
    - レガシーの `channels.telegram.streamMode`、boolean の `streaming` 値、廃止されたネイティブ下書きプレビューキーは検出されます。現在のストリーミング設定へ移行するには `openclaw doctor --fix` を実行してください

    ツール進捗プレビュー更新は、ツール実行中に表示される短いステータス行です。たとえば、コマンド実行、ファイル読み取り、計画更新、パッチ要約、または Codex app-server モードでの Codex preamble/commentary テキストなどです。Telegram では、`v2026.4.22` 以降のリリース済み OpenClaw の挙動に合わせるため、既定でこれらが有効です。

    回答テキスト用の編集済みプレビューは保持しつつ、ツール進捗行を非表示にするには、次のように設定します。

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

    ツール進捗を表示したまま、コマンド/実行テキストを非表示にするには、次のように設定します。

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

    最終回答を同じメッセージに編集せず、可視のツール進捗が必要な場合は `progress` モードを使用します。コマンドテキストポリシーは `streaming.progress` の下に置きます。

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

    `streaming.mode: "off"` は、最終回答のみの配信が必要な場合にのみ使用してください。Telegram プレビュー編集は無効になり、汎用のツール/進捗 chatter はスタンドアロンのステータスメッセージとして送信される代わりに抑制されます。承認プロンプト、メディアペイロード、エラーは引き続き通常の最終配信を通じてルーティングされます。ツール進捗ステータス行を非表示にしつつ回答プレビュー編集だけを保持したい場合は、`streaming.preview.toolProgress: false` を使用してください。

    <Note>
      Telegram の選択引用返信は例外です。`replyToMode` が `"first"`、`"all"`、または `"batched"` で、インバウンドメッセージに選択された引用テキストが含まれる場合、OpenClaw は回答プレビューを編集する代わりに、Telegram のネイティブ引用返信パスを通じて最終回答を送信します。そのため、そのターンでは `streaming.preview.toolProgress` は短いステータス行を表示できません。選択引用テキストのない現在メッセージへの返信では、プレビューストリーミングは引き続き保持されます。ネイティブ引用返信よりもツール進捗の可視性が重要な場合は `replyToMode: "off"` を設定するか、トレードオフを明示するために `streaming.preview.toolProgress: false` を設定してください。
    </Note>

    テキストのみの返信の場合:

    - 短い DM/グループ/トピックのプレビュー: OpenClaw は同じプレビューメッセージを保持し、最終編集をその場で実行します
    - 複数の Telegram メッセージに分割される長いテキストの最終回答では、可能な場合、既存のプレビューを最初の最終チャンクとして再利用し、その後に残りのチャンクだけを送信します
    - progress-mode の最終回答では、ステータス下書きをクリアし、下書きを回答に編集する代わりに通常の最終配信を使用します
    - 完了済みテキストが確認される前に最終編集が失敗した場合、OpenClaw は通常の最終配信を使用し、古いプレビューをクリーンアップします

    複雑な返信（たとえばメディアペイロード）の場合、OpenClaw は通常の最終配信にフォールバックし、その後プレビューメッセージをクリーンアップします。

    プレビューストリーミングは block streaming とは別です。Telegram で block streaming が明示的に有効になっている場合、OpenClaw は二重ストリーミングを避けるためプレビューストリームをスキップします。

    reasoning ストリームの挙動:

    - `/reasoning stream` は、サポートされているチャンネルの reasoning-preview パスを使用します。Telegram では、生成中に reasoning をライブプレビューへストリーミングします
    - reasoning プレビューは最終配信後に削除されます。reasoning を表示したままにする必要がある場合は `/reasoning on` を使用してください
    - 最終回答は reasoning テキストなしで送信されます

  </Accordion>

  <Accordion title="リッチメッセージ書式">
    アウトバウンドテキストは既定で標準の Telegram HTML メッセージを使用するため、現在の Telegram クライアント全体で返信が読みやすく保たれます。この互換モードは通常の太字、斜体、リンク、コード、spoilers、引用をサポートしますが、ネイティブテーブル、details、リッチメディア、数式などの Bot API 10.1 の rich-only ブロックはサポートしません。

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

    有効な場合:

    - agent には、このボット/アカウントで Telegram リッチメッセージが利用可能であることが伝えられます。
    - Markdown テキストは OpenClaw の Markdown IR を通じてレンダリングされ、Telegram リッチ HTML として送信されます。
    - 明示的なリッチ HTML ペイロードは、見出し、テーブル、details、リッチメディア、数式など、サポートされている Bot API 10.1 タグを保持します。
    - メディアキャプションは引き続き Telegram HTML キャプションを使用します。リッチメッセージはキャプションを置き換えないためです。

    これにより、モデルテキストを Telegram Rich Markdown の記号から離せるため、`$400-600K` のような通貨が数式として解析されません。長いリッチテキストは、Telegram のリッチテキストとリッチブロックの制限に合わせて自動的に分割されます。Telegram の列数制限を超えるテーブルはコードブロックとして送信されます。

    既定: クライアント互換性のためオフ。リッチメッセージには互換性のある Telegram クライアントが必要です。現在の一部の Desktop、Web、Android、サードパーティクライアントでは、受け付けられたリッチメッセージが未サポートとして表示されます。ボットで使用するすべてのクライアントがそれらをレンダリングできる場合を除き、このオプションは無効のままにしてください。`/status` は、現在の Telegram セッションでリッチメッセージがオンかオフかを表示します。

    リンクプレビューは既定で有効です。`channels.telegram.linkPreview: false` は、リッチテキストの自動 entity 検出をスキップします。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegram コマンドメニュー登録は、起動時に `setMyCommands` で処理されます。

    ネイティブコマンドの既定:

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

    - 名前は正規化されます（先頭の `/` を取り除き、小文字化）
    - 有効なパターン: `a-z`、`0-9`、`_`、長さ `1..32`
    - カスタムコマンドはネイティブコマンドを上書きできません
    - 競合/重複はスキップされ、ログに記録されます

    注記:

    - カスタムコマンドはメニュー項目のみです。挙動は自動実装されません
    - plugin/skill コマンドは、Telegram メニューに表示されていなくても、入力された場合は引き続き動作できます

    ネイティブコマンドが無効な場合、組み込みコマンドは削除されます。設定されている場合は、カスタム/plugin コマンドが引き続き登録されることがあります。

    一般的なセットアップ失敗:

    - `BOT_COMMANDS_TOO_MUCH` を伴う `setMyCommands failed` は、トリミング後も Telegram メニューがまだあふれていることを意味します。plugin/skill/カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効にしてください。
    - 直接の Bot API curl コマンドは動作するのに、`deleteWebhook`、`deleteMyCommands`、または `setMyCommands` が `404: Not Found` で失敗する場合、`channels.telegram.apiRoot` が完全な `/bot<TOKEN>` エンドポイントに設定されている可能性があります。`apiRoot` は Bot API ルートのみである必要があり、`openclaw doctor --fix` は誤って末尾に付いた `/bot<TOKEN>` を削除します。
    - `getMe returned 401` は、Telegram が設定済みのボットトークンを拒否したことを意味します。`botToken`、`tokenFile`、または `TELEGRAM_BOT_TOKEN` を現在の BotFather トークンで更新してください。OpenClaw は polling の前に停止するため、これは Webhook クリーンアップ失敗として報告されません。
    - ネットワーク/fetch エラーを伴う `setMyCommands failed` は、通常 `api.telegram.org` へのアウトバウンド DNS/HTTPS がブロックされていることを意味します。

    ### デバイスペアリングコマンド（`device-pair` plugin）

    `device-pair` plugin がインストールされている場合:

    1. `/pair` がセットアップコードを生成します
    2. iOS アプリにコードを貼り付けます
    3. `/pair pending` は保留中のリクエストを一覧表示します（role/scopes を含む）
    4. リクエストを承認します。
       - 明示的な承認には `/pair approve <requestId>`
       - 保留中のリクエストが 1 つだけの場合は `/pair approve`
       - 最新のものには `/pair approve latest`

    セットアップコードは短命の bootstrap token を保持します。組み込みのセットアップコード bootstrap は node 専用です。最初の接続で保留中の node リクエストが作成され、承認後、Gateway は `scopes: []` を持つ永続的な node token を返します。引き渡された operator token は返しません。operator アクセスには、別途承認済みの operator ペアリングまたは token flow が必要です。

    デバイスが変更された認証詳細（たとえば role/scopes/public key）で再試行した場合、以前の保留リクエストは置き換えられ、新しいリクエストは異なる `requestId` を使用します。承認前に `/pair pending` を再実行してください。

    詳細: [ペアリング](/ja-JP/channels/pairing#pair-via-telegram-recommended-for-ios)。

  </Accordion>

  <Accordion title="インラインボタン">
    インラインキーボードのスコープを設定します。

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
    - `allowlist` (デフォルト)

    従来の `capabilities: ["inlineButtons"]` は `inlineButtons: "all"` に対応します。

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

    Telegram の `web_app` ボタンは、ユーザーとボットの間のプライベートチャットでのみ機能します。

    登録済み Plugin のインタラクティブハンドラーによって処理されないコールバッククリックは、テキストとしてエージェントに渡されます:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="エージェントと自動化向けの Telegram メッセージアクション">
    Telegram ツールアクションには以下が含まれます。

    - `sendMessage` (`to`, `content`, 任意の `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` または `caption`, 任意の `presentation` インラインボタン。ボタンのみの編集では返信マークアップを更新)
    - `createForumTopic` (`chatId`, `name`, 任意の `iconColor`, `iconCustomEmojiId`)

    チャンネルメッセージアクションは、使いやすいエイリアス (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`) を公開します。

    ゲート制御:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (デフォルト: 無効)

    注: `edit` と `topic-create` は現在デフォルトで有効で、個別の `channels.telegram.actions.*` トグルはありません。
    ランタイム送信ではアクティブな config/secrets スナップショット (起動/再読み込み) を使用するため、アクションパスは送信ごとにアドホックな SecretRef 再解決を行いません。

    リアクション削除のセマンティクス: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="返信スレッドタグ">
    Telegram は生成出力内で明示的な返信スレッドタグをサポートします。

    - `[[reply_to_current]]` はトリガーとなったメッセージに返信します
    - `[[reply_to:<id>]]` は特定の Telegram メッセージ ID に返信します

    `channels.telegram.replyToMode` は処理を制御します。

    - `off` (デフォルト)
    - `first`
    - `all`

    返信スレッドが有効で、元の Telegram テキストまたはキャプションを利用できる場合、OpenClaw はネイティブ Telegram 引用の抜粋を自動的に含めます。Telegram はネイティブ引用テキストを 1024 UTF-16 コードユニットに制限しているため、長いメッセージは先頭から引用され、Telegram が引用を拒否した場合は通常の返信にフォールバックします。

    注: `off` は暗黙的な返信スレッドを無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッドの動作">
    フォーラムスーパーグループ:

    - トピックセッションキーに `:topic:<threadId>` が追加されます
    - 返信と入力中表示はトピックスレッドを対象にします
    - トピック config パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般トピック (`threadId=1`) の特別扱い:

    - メッセージ送信では `message_thread_id` を省略します (Telegram は `sendMessage(...thread_id=1)` を拒否します)
    - 入力中アクションでは引き続き `message_thread_id` を含めます

    トピック継承: トピックエントリは、上書きされない限りグループ設定を継承します (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)。
    `agentId` はトピック専用で、グループのデフォルトからは継承されません。
    `topics."*"` はそのグループ内のすべてのトピックにデフォルトを設定します。正確なトピック ID は引き続き `"*"` より優先されます。

    **トピックごとのエージェントルーティング**: 各トピックは、トピック config で `agentId` を設定することで別のエージェントにルーティングできます。これにより、各トピックに独自の隔離されたワークスペース、メモリ、セッションが与えられます。例:

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

    各トピックは独自のセッションキーを持ちます: `agent:zu:telegram:group:-1001234567890:topic:3`

    **永続 ACP トピックバインディング**: フォーラムトピックは、トップレベルの型付き ACP バインディング (`type: "acp"` と `match.channel: "telegram"`、`peer.kind: "group"`、および `-1001234567890:topic:42` のようなトピック修飾 ID を持つ `bindings[]`) を通じて ACP ハーネスセッションを固定できます。現在はグループ/スーパーグループ内のフォーラムトピックにスコープされています。[ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

    **チャットからのスレッド绑定 ACP spawn**: `/acp spawn <agent> --thread here|auto` は現在のトピックを新しい ACP セッションにバインドします。以降のやり取りはそこへ直接ルーティングされます。OpenClaw は spawn 確認をトピック内に固定します。`channels.telegram.threadBindings.spawnSessions` が有効のままである必要があります (デフォルト: `true`)。

    テンプレートコンテキストは `MessageThreadId` と `IsForum` を公開します。`message_thread_id` を持つ DM チャットは返信メタデータを保持します。それらは、Telegram `getMe` がボットについて `has_topics_enabled: true` を報告した場合にのみ、スレッド対応セッションキーを使用します。
    以前の `dm.threadReplies` と `direct.*.threadReplies` の上書きは意図的に廃止されています。BotFather のスレッドモードを唯一の信頼できる情報源として使用し、`openclaw doctor --fix` を実行して古い config キーを削除してください。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegram はボイスメモと音声ファイルを区別します。

    - デフォルト: 音声ファイルの動作
    - エージェント返信内のタグ `[[audio_as_voice]]` でボイスメモ送信を強制
    - 受信したボイスメモの文字起こしは、エージェントコンテキスト内で機械生成の信頼できないテキストとして扱われます。メンション検出は引き続き生の文字起こしを使用するため、メンションで制御されたボイスメッセージは引き続き機能します。

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

    ### ビデオメッセージ

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

    ビデオノートはキャプションをサポートしていません。指定されたメッセージテキストは別途送信されます。

    ### スタンプ

    受信スタンプの処理:

    - 静的 WEBP: ダウンロードして処理します（プレースホルダー `<media:sticker>`）
    - アニメーション TGS: スキップします
    - 動画 WEBM: スキップします

    スタンプコンテキストフィールド:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    スタンプの説明は、繰り返しのビジョン呼び出しを減らすために OpenClaw SQLite Plugin 状態にキャッシュされます。

    スタンプアクションを有効化:

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

    スタンプ送信アクション:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    キャッシュされたスタンプを検索:

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

    有効な場合、OpenClaw は次のようなシステムイベントをキューに入れます。

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定:

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    注記:

    - `own` は、bot が送信したメッセージに対するユーザーリアクションのみを意味します（送信済みメッセージキャッシュによるベストエフォート）。
    - リアクションイベントは Telegram のアクセス制御（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）を引き続き尊重します。許可されていない送信者は破棄されます。
    - Telegram はリアクション更新でスレッド ID を提供しません。
      - 非フォーラムグループはグループチャットセッションにルーティングされます
      - フォーラムグループは、正確な発生元トピックではなく、グループの一般トピックセッション（`:topic:1`）にルーティングされます

    ポーリング/Webhook の `allowed_updates` には `message_reaction` が自動的に含まれます。

  </Accordion>

  <Accordion title="ACKリアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間に確認絵文字を送信します。`ackReactionScope` は、その絵文字を実際に送信する*タイミング*を決定します。

    **絵文字（`ackReaction`）の解決順序:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェント ID 絵文字フォールバック（`agents.list[].identity.emoji`、なければ "👀"）

    注記:

    - Telegram は Unicode 絵文字（例: "👀"）を想定しています。
    - チャンネルまたはアカウントのリアクションを無効にするには `""` を使用します。

    **スコープ（`messages.ackReactionScope`）:**

    Telegram プロバイダーは `messages.ackReactionScope` からスコープを読み取ります（デフォルトは `"group-mentions"`）。現在、Telegram アカウントまたは Telegram チャンネルレベルの上書きはありません。

    値: `"all"`（DM + グループ）、`"direct"`（DM のみ）、`"group-all"`（すべてのグループメッセージ、DM なし）、`"group-mentions"`（bot がメンションされたグループ。**DM なし** — これがデフォルト）、`"off"` / `"none"`（無効）。

    <Note>
    デフォルトスコープ（`"group-mentions"`）では、ダイレクトメッセージで ACK リアクションは発火しません。受信 Telegram DM で ACK リアクションを得るには、`messages.ackReactionScope` を `"direct"` または `"all"` に設定します。この値は Telegram プロバイダー起動時に読み取られるため、変更を反映するには Gateway の再起動が必要です。
    </Note>

  </Accordion>

  <Accordion title="Telegram イベントとコマンドからの設定書き込み">
    チャンネル設定の書き込みはデフォルトで有効です（`configWrites !== false`）。

    Telegram によってトリガーされる書き込みには以下が含まれます。

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
    デフォルトはロングポーリングです。Webhook モードでは `channels.telegram.webhookUrl` と `channels.telegram.webhookSecret` を設定します。任意で `webhookPath`、`webhookHost`、`webhookPort` も設定できます（デフォルトは `/telegram-webhook`、`127.0.0.1`、`8787`）。

    ロングポーリングモードでは、OpenClaw は更新のディスパッチが成功した後にのみ再起動ウォーターマークを永続化します。ハンドラーが失敗した場合、その更新は同じプロセス内で再試行可能なままで、再起動時の重複排除のために完了済みとして書き込まれません。

    ローカルリスナーは `127.0.0.1:8787` にバインドします。公開入口には、ローカルポートの前にリバースプロキシを置くか、意図的に `webhookHost: "0.0.0.0"` を設定します。

    Webhook モードは、Telegram に `200` を返す前にリクエストガード、Telegram シークレットトークン、JSON 本文を検証します。
    その後 OpenClaw は、ロングポーリングで使われるものと同じチャット別/トピック別 bot レーンを通じて更新を非同期に処理するため、遅いエージェントターンが Telegram の配信 ACK を保持することはありません。

  </Accordion>

  <Accordion title="制限、再試行、CLI ターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは 4000 です。
    - `channels.telegram.chunkMode="newline"` は、長さで分割する前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト 100）は、受信および送信 Telegram メディアのサイズ上限を設定します。
    - `channels.telegram.mediaGroupFlushMs`（デフォルト 500）は、OpenClaw が Telegram のアルバム/メディアグループを 1 つの受信メッセージとしてディスパッチする前にバッファする時間を制御します。アルバムの一部が遅れて届く場合は増やし、アルバム返信のレイテンシを下げる場合は減らします。
    - `channels.telegram.timeoutSeconds` は Telegram API クライアントのタイムアウトを上書きします（未設定の場合は grammY のデフォルトが適用されます）。Bot クライアントは、設定値が 60 秒の送信テキスト/入力中リクエストガードを下回る場合にクランプし、OpenClaw のトランスポートガードとフォールバックが実行される前に grammY が可視返信の配信を中止しないようにします。ロングポーリングでは引き続き 45 秒の `getUpdates` リクエストガードを使用し、アイドルポーリングが無期限に放棄されないようにします。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは `120000` です。誤検知によるポーリング停止再起動の場合にのみ、`30000` から `600000` の間で調整します。
    - グループコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit`（デフォルト 50）を使用します。`0` で無効化します。
    - 返信/引用/転送の補足コンテキストは、Gateway が親メッセージを観測している場合、選択された 1 つの会話コンテキストウィンドウに正規化されます。観測済みメッセージキャッシュは OpenClaw SQLite Plugin 状態に保存され、`openclaw doctor --fix` がレガシーサイドカーをインポートします。Telegram は更新内に浅い `reply_to_message` を 1 つだけ含めるため、キャッシュより古いチェーンは Telegram の現在の更新ペイロードに制限されます。
    - Telegram 許可リストは主に、誰がエージェントをトリガーできるかを制御するものであり、完全な補足コンテキスト編集境界ではありません。
    - DM 履歴の制御:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定は、回復可能な送信 API エラーに対して Telegram 送信ヘルパー（CLI/ツール/アクション）に適用されます。受信の最終返信配信も Telegram の事前接続失敗に対して境界付きの安全送信再試行を使用しますが、可視メッセージを重複させる可能性がある曖昧な送信後ネットワークエンベロープは再試行しません。

    CLI とメッセージツールの送信ターゲットには、数値チャット ID、ユーザー名、またはフォーラムトピックターゲットを指定できます。

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram の投票は `openclaw message poll` を使用し、フォーラムトピックをサポートします。

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

    Telegram 送信は次もサポートします。

    - `channels.telegram.capabilities.inlineButtons` が許可する場合、インラインキーボード用の `buttons` ブロックを含む `--presentation`
    - Bot がそのチャットでピン留めできる場合に、ピン留め配信をリクエストする `--pin` または `--delivery '{"pin":true}'`
    - 送信画像、GIF、動画を、圧縮された写真、アニメーションメディア、動画アップロードではなくドキュメントとして送信する `--force-document`

    アクション制御:

    - `channels.telegram.actions.sendMessage=false` は、投票を含む送信 Telegram メッセージを無効化します
    - `channels.telegram.actions.poll=false` は、通常の送信を有効のままにして Telegram 投票の作成を無効化します

  </Accordion>

  <Accordion title="Telegram での Exec 承認">
    Telegram は承認者 DM で Exec 承認をサポートし、任意で元のチャットまたはトピックにプロンプトを投稿できます。承認者は数値の Telegram ユーザー ID である必要があります。

    設定パス:

    - `channels.telegram.execApprovals.enabled`（少なくとも 1 人の承認者を解決できる場合に自動有効化）
    - `channels.telegram.execApprovals.approvers`（`commands.ownerAllowFrom` の数値所有者 ID にフォールバック）
    - `channels.telegram.execApprovals.target`: `dm`（デフォルト） | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom`、`defaultTo` は、誰が Bot と会話できるか、通常の返信をどこに送るかを制御します。これらは誰かを Exec 承認者にするものではありません。コマンド所有者がまだ存在しない場合、最初に承認された DM ペアリングが `commands.ownerAllowFrom` をブートストラップするため、単一所有者セットアップは `execApprovals.approvers` に ID を重複させなくても動作します。

    チャンネル配信ではコマンドテキストがチャットに表示されます。信頼できるグループ/トピックでのみ `channel` または `both` を有効化してください。プロンプトがフォーラムトピックに届く場合、OpenClaw は承認プロンプトとフォローアップのためにそのトピックを保持します。Exec 承認はデフォルトで 30 分後に期限切れになります。

    インライン承認ボタンには、`channels.telegram.capabilities.inlineButtons` が対象サーフェス（`dm`、`group`、または `all`）を許可することも必要です。`plugin:` で始まる承認 ID は Plugin 承認を通じて解決され、それ以外は最初に Exec 承認を通じて解決されます。

    [Exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## エラー返信の制御

エージェントが配信エラーまたはプロバイダーエラーに遭遇した場合、エラーポリシーはエラーメッセージを Telegram チャットに送信するかどうかを制御します。

| キー                                 | 値                     | デフォルト         | 説明                                                                                                                                                                                               |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — すべてのエラーメッセージをチャットに送信します。`once` — 一意のエラーメッセージごとにクールダウンウィンドウ内で 1 回送信します（同一エラーの繰り返しを抑制）。`silent` — エラーメッセージをチャットに送信しません。 |
| `channels.telegram.errorCooldownMs` | 数値 (ms)                | `14400000` (4h) | `once` ポリシーのクールダウンウィンドウ。エラーが送信された後、同じエラーメッセージはこの間隔が経過するまで抑制されます。障害時のエラースパムを防ぎます。                                      |

アカウント単位、グループ単位、トピック単位の上書きがサポートされています（他の Telegram 設定キーと同じ継承）。

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
  <Accordion title="Bot がメンションなしのグループメッセージに応答しない">

    - `requireMention=false` の場合、Telegram プライバシーモードで完全な可視性を許可する必要があります。
      - BotFather: `/setprivacy` -> 無効化
      - その後、グループから Bot を削除して再追加します
    - `openclaw channels status` は、設定がメンションなしのグループメッセージを期待している場合に警告します。
    - `openclaw channels status --probe` は明示的な数値グループ ID をチェックできます。ワイルドカード `"*"` はメンバーシッププローブできません。
    - 簡単なセッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="Bot がグループメッセージをまったく認識しない">

    - `channels.telegram.groups` が存在する場合、グループがリストに含まれている必要があります（または `"*"` を含めます）
    - グループ内の Bot メンバーシップを確認します
    - ログを確認します: スキップ理由は `openclaw logs --follow`

  </Accordion>

  <Accordion title="コマンドが部分的にしか動作しない、またはまったく動作しない">

    - 送信者 ID を承認します（ペアリングおよび/または数値の `allowFrom`）
    - グループポリシーが `open` の場合でも、コマンド承認は引き続き適用されます
    - `BOT_COMMANDS_TOO_MUCH` を伴う `setMyCommands failed` は、ネイティブメニューのエントリが多すぎることを意味します。Plugin/スキル/カスタムコマンドを減らすか、ネイティブメニューを無効化します
    - 起動時の `deleteMyCommands` / `setMyCommands` 呼び出しと、`sendChatAction` の入力中呼び出しは境界付きで、リクエストタイムアウト時に Telegram のトランスポートフォールバックを通じて 1 回再試行されます。永続的なネットワーク/fetch エラーは通常、`api.telegram.org` への DNS/HTTPS 到達性の問題を示します

  </Accordion>

  <Accordion title="起動時に未承認トークンが報告される">

    - `getMe returned 401` は、設定された Bot トークンに対する Telegram 認証失敗です。
    - BotFather で Bot トークンを再コピーまたは再生成し、デフォルトアカウントの `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken`、または `TELEGRAM_BOT_TOKEN` を更新します。
    - 起動中の `deleteWebhook 401 Unauthorized` も認証失敗です。これを「Webhook が存在しない」と扱うと、同じ不正トークン失敗を後続の API 呼び出しまで先送りするだけです。

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定性">

    - Node 22+ とカスタム fetch/proxy の組み合わせでは、AbortSignal 型の不一致により即時中止の挙動が発生することがあります。
    - 一部のホストは `api.telegram.org` を最初に IPv6 に解決します。壊れた IPv6 送信経路により、断続的な Telegram API 失敗が発生することがあります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれる場合、OpenClaw は現在これらを回復可能なネットワークエラーとして再試行します。
    - ポーリング起動中、OpenClaw は grammY のために成功した起動時の `getMe` プローブを再利用するため、ランナーは最初の `getUpdates` の前に 2 回目の `getMe` を必要としません。
    - ポーリング起動中に `deleteWebhook` が一時的なネットワークエラーで失敗した場合、OpenClaw は別の事前ポーリング制御プレーン呼び出しを行わず、ロングポーリングに進みます。まだアクティブな Webhook は `getUpdates` 競合として表面化します。その後 OpenClaw は Telegram トランスポートを再構築し、Webhook クリーンアップを再試行します。
    - Telegram ソケットが短い固定周期で再利用される場合、低い `channels.telegram.timeoutSeconds` を確認してください。Bot クライアントは、送信および `getUpdates` リクエストガードを下回る設定値をクランプしますが、古いリリースではこの値がそれらのガードを下回ると、すべてのポーリングまたは返信が中止されることがありました。
    - ログに `Polling stall detected` が含まれる場合、OpenClaw はデフォルトで、完了したロングポール生存性が 120 秒間ない場合にポーリングを再起動し、Telegram トランスポートを再構築します。
    - `openclaw channels status --probe` と `openclaw doctor` は、実行中のポーリングアカウントが起動猶予後に `getUpdates` を完了していない場合、実行中の Webhook アカウントが起動猶予後に `setWebhook` を完了していない場合、または最後に成功したポーリングトランスポートアクティビティが古い場合に警告します。
    - 長時間実行される `getUpdates` 呼び出しが正常であるにもかかわらず、ホストが誤ったポーリング停止再起動を報告する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やします。永続的な停止は通常、ホストと `api.telegram.org` の間の proxy、DNS、IPv6、または TLS 送信経路の問題を示します。
    - Telegram は Bot API トランスポートについて、`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` とそれらの小文字バリアントを含むプロセス proxy env も尊重します。`NO_PROXY` / `no_proxy` は引き続き `api.telegram.org` をバイパスできます。
    - サービス環境で OpenClaw 管理 proxy が `OPENCLAW_PROXY_URL` によって設定されており、標準 proxy env が存在しない場合、Telegram も Bot API トランスポートにその URL を使用します。
    - 直接送信経路/TLS が不安定な VPS ホストでは、Telegram API 呼び出しを `channels.telegram.proxy` 経由でルーティングします。

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ は `autoSelectFamily=true` がデフォルトです（WSL2 を除く）。Telegram の DNS 結果順は `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、次に `channels.telegram.network.dnsResultOrder`、次に `NODE_OPTIONS=--dns-result-order=ipv4first` などのプロセス既定値に従います。どれも適用されない場合、Node 22+ は `ipv4first` にフォールバックします。
    - ホストが WSL2 の場合、または IPv4 のみの動作のほうが明示的に安定する場合は、ファミリー選択を強制します。

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 ベンチマーク範囲の応答（`198.18.0.0/15`）は、Telegram メディアダウンロードでは既定で許可済みです。信頼済みの fake-IP または透過プロキシが、メディアダウンロード中に `api.telegram.org` を別のプライベート/内部/特殊用途アドレスへ書き換える場合は、Telegram 専用のバイパスを有効化できます。

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じ有効化は、アカウントごとに
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
      でも利用できます。
    - プロキシが Telegram メディアホストを `198.18.x.x` に解決する場合は、まず危険なフラグをオフのままにしてください。Telegram メディアは、RFC 2544 ベンチマーク範囲を既定で許可しています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` は Telegram
      メディアの SSRF 保護を弱めます。Clash、Mihomo、Surge の fake-IP ルーティングなど、RFC 2544 ベンチマーク範囲外のプライベートまたは特殊用途の応答を合成する、信頼済みのオペレーター管理プロキシ環境でのみ使用してください。通常の公開インターネット経由の Telegram アクセスではオフのままにしてください。
    </Warning>

    - 環境による上書き（一時的）:
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

詳細ヘルプ: [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

## 設定リファレンス

主要リファレンス: [設定リファレンス - Telegram](/ja-JP/gateway/config-channels#telegram)。

<Accordion title="高シグナルな Telegram フィールド">

- 起動/認証: `enabled`, `botToken`, `tokenFile`, `accounts.*`（`tokenFile` は通常ファイルを指している必要があります。シンボリックリンクは拒否されます）
- アクセス制御: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, トップレベルの `bindings[]`（`type: "acp"`）
- トピック既定値: `groups.<chatId>.topics."*"` は一致しないフォーラムトピックに適用されます。正確なトピック ID がそれを上書きします
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
マルチアカウントの優先順位: 2 つ以上のアカウント ID が設定されている場合は、既定のルーティングを明示するために `channels.telegram.defaultAccount` を設定します（または `channels.telegram.accounts.default` を含めます）。そうしない場合、OpenClaw は最初に正規化されたアカウント ID にフォールバックし、`openclaw doctor` が警告します。名前付きアカウントは `channels.telegram.allowFrom` / `groupAllowFrom` を継承しますが、`accounts.default.*` の値は継承しません。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram ユーザーを Gateway にペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループとトピックの許可リスト動作。
  </Card>
  <Card title="チャネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントにルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと強化。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    グループとトピックをエージェントに対応付けます。
  </Card>
  <Card title="トラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断。
  </Card>
</CardGroup>
