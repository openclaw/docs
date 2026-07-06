---
read_when:
    - Telegram の機能または Webhook に取り組む
summary: Telegram bot のサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-07-06T10:46:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81802f9077e9339bae1c4b3296db2b1b76d4085593544305be37e43669173c0a
    source_path: channels/telegram.md
    workflow: 16
---

grammY 経由の bot DM とグループで本番利用できます。デフォルトのトランスポートはロングポーリングです。Webhook モードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram のデフォルト DM ポリシーはペアリングです。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    クロスチャネルの診断と修復プレイブック。
  </Card>
  <Card title="Gateway 設定" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャネル設定パターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="BotFather で bot トークンを作成する">
    どちらのフローも、OpenClaw に貼り付けるトークンを最後に取得します。どちらかを選んでください。

    - **チャットフロー**: Telegram を開き、**@BotFather** とチャットし（ハンドルが正確に `@BotFather` であることを確認）、`/newbot` を実行し、プロンプトに従ってトークンを保存します。
    - **Web フロー**: [BotFather の Web アプリ](https://t.me/BotFather?startapp) を開きます。これは [web.telegram.org](https://web.telegram.org) を含むすべての Telegram クライアントで動作します。UI で bot を作成し、そのトークンをコピーします。

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

    環境変数フォールバック: `TELEGRAM_BOT_TOKEN`（デフォルトアカウントのみ。名前付きアカウントは `botToken` または `tokenFile` を使う必要があります）。
    Telegram は `openclaw channels login telegram` を**使用しません**。config/env にトークンを設定してから、Gateway を起動してください。

  </Step>

  <Step title="Gateway を起動して最初の DM を承認する">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    ペアリングコードは 1 時間後に期限切れになります。

  </Step>

  <Step title="bot をグループに追加する">
    bot をグループに追加してから、グループアクセスに必要な 2 つの ID を取得します。

    - `allowFrom` / `groupAllowFrom` 用の Telegram ユーザー ID
    - `channels.telegram.groups` 配下のキーとして使う Telegram グループチャット ID

    グループチャット ID は、`openclaw logs --follow`、転送 ID bot、または Bot API の `getUpdates` から取得します。グループが許可された後、`/whoami@<bot_username>` でユーザー ID とグループ ID を確認できます。

    `-100` で始まる負のスーパーグループ ID はグループチャット ID です。これらは `groupAllowFrom` ではなく `channels.telegram.groups` 配下に置きます。

  </Step>
</Steps>

<Note>
トークン解決はアカウントを認識します。`tokenFile` は `botToken` より優先され、`botToken` は env より優先され、config は常に `TELEGRAM_BOT_TOKEN`（デフォルトアカウントでのみ解決されます）より優先されます。起動が成功すると、OpenClaw は bot ID を最大 24 時間キャッシュするため、再起動時に余分な `getMe` 呼び出しを省略できます。トークンを変更または削除すると、そのキャッシュはクリアされます。
</Note>

## Telegram 側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループの可視性">
    Telegram bot はデフォルトで**プライバシーモード**になっており、受信できるグループメッセージが制限されます。

    すべてのグループメッセージを見るには、次のいずれかを行います。

    - `/setprivacy` でプライバシーモードを無効にする、または
    - bot をグループ管理者にする。

    プライバシーモードを切り替えた後は、各グループで bot を削除して再追加し、Telegram に変更を適用させます。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスは Telegram グループ設定で制御されます。管理者 bot はすべてのグループメッセージを受信するため、常時オンのグループ動作に役立ちます。
  </Accordion>

  <Accordion title="便利な BotFather トグル">

    - `/setjoingroups` — グループ追加を許可/拒否する
    - `/setprivacy` — グループ可視性の動作

    チャットコマンドより UI を好む場合は、同じ設定を [BotFather の Web アプリ](https://t.me/BotFather?startapp) でも利用できます。

  </Accordion>
</AccordionGroup>

## アクセス制御と有効化

### グループ bot ID

グループやフォーラムトピックでは、設定済み bot ハンドル（例: `@my_bot`）への明示的なメンションが、選択された OpenClaw エージェントを宛先にします。これは、エージェントのペルソナ名が Telegram ユーザー名と異なる場合でも同じです。無関係なトラフィックにはグループの沈黙ポリシーが引き続き適用されますが、bot ハンドル自体が「他の誰か」と扱われることはありません。

<Tabs>
  <Tab title="DM ポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージのアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom` に少なくとも 1 つの送信者 ID が必要）
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    `dmPolicy: "open"` と `allowFrom: ["*"]` を組み合わせると、bot ユーザー名を見つけた、または推測した任意の Telegram アカウントが bot にコマンドを送れます。これは、ツールが厳しく制限された意図的な公開 bot にのみ使用してください。単一所有者の bot では、数値ユーザー ID を使った `allowlist` を使用してください。

    `channels.telegram.allowFrom` は数値の Telegram ユーザー ID を受け付けます。`telegram:` / `tg:` プレフィックスは受け付けられ、正規化されます。
    マルチアカウント設定では、制限的なトップレベルの `channels.telegram.allowFrom` が安全境界になります。アカウントレベルの `allowFrom: ["*"]` は、マージ後の有効な許可リストに明示的なワイルドカードがまだ含まれていない限り、そのアカウントを公開しません。
    `dmPolicy: "allowlist"` で `allowFrom` が空の場合、すべての DM がブロックされ、config 検証で拒否されます。
    セットアップでは数値ユーザー ID のみを求めます。古いセットアップ由来の `@username` 許可リストエントリが config にある場合は、`openclaw doctor --fix` を実行して数値 ID に解決してください（ベストエフォート。Telegram bot トークンが必要です）。
    以前にペアリングストアの許可リストファイルに依存していた場合、`openclaw doctor --fix` は allowlist フロー用にエントリを `channels.telegram.allowFrom` へ復元できます（たとえば `dmPolicy: "allowlist"` に明示的な ID がまだない場合）。

    単一所有者の bot では、以前のペアリング承認に依存するよりも、明示的な数値 `allowFrom` ID を指定した `dmPolicy: "allowlist"` を優先してください。

    よくある混乱: DM ペアリング承認は「この送信者はどこでも承認されている」という意味ではありません。ペアリングが付与するのは DM アクセスのみです。コマンド所有者がまだ存在しない場合、最初に承認されたペアリングは `commands.ownerAllowFrom` も設定し、所有者専用コマンドと exec 承認に明示的なオペレーターアカウントを与えます。グループ送信者の承認は、引き続き明示的な config 許可リストから行われます。
    1 つの ID で DM とグループコマンドの両方を承認するには、数値の Telegram ユーザー ID を `channels.telegram.allowFrom` に入れ、所有者専用コマンドについては `commands.ownerAllowFrom` に `telegram:<your user id>` が含まれていることを確認してください。

    ### Telegram ユーザー ID を見つける

    より安全（サードパーティ bot なし）: 自分の bot に DM を送り、`openclaw logs --follow` を実行し、`from.id` を読み取ります。

    公式 Bot API メソッド:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティ（プライバシーは低め）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーと許可リスト">
    2 つの制御が一緒に適用されます。

    1. **どのグループを許可するか**（`channels.telegram.groups`）
       - `groups` config なし、`groupPolicy: "open"`: 任意のグループがグループ ID チェックを通過します
       - `groups` config なし、`groupPolicy: "allowlist"`（デフォルト）: `groups` エントリ（または `"*"`）を追加するまで、すべてのグループがブロックされます
       - `groups` が設定済み: 許可リストとして機能します（明示的な ID または `"*"`）

    2. **グループ内でどの送信者を許可するか**（`channels.telegram.groupPolicy`）
       - `open` / `allowlist`（デフォルト） / `disabled`

    `groupAllowFrom` はグループ送信者をフィルターします。未設定の場合、Telegram は `allowFrom` にフォールバックします（ペアリングストアではありません。グループ送信者認証は DM ペアリングストア承認を継承しないという、`2026.2.25` 以降の安全境界です）。
    `groupAllowFrom` エントリは数値の Telegram ユーザー ID にしてください（`telegram:` / `tg:` プレフィックスは正規化されます）。数値でないエントリは無視されます。ここにグループやスーパーグループのチャット ID を入れないでください。負のチャット ID は `channels.telegram.groups` 配下に置きます。
    単一所有者 bot の実用的なパターン: 自分のユーザー ID を `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにして、対象グループを `channels.telegram.groups` 配下で許可します。
    config に `channels.telegram` がまったく存在しない場合、runtime は `channels.defaults.groupPolicy` が明示的に設定されていない限り、フェイルクローズの `groupPolicy="allowlist"` をデフォルトにします。

    所有者専用グループ設定:

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

    グループから `@<bot_username> ping` でテストします。`requireMention: true` の間は、通常のグループメッセージは bot をトリガーしません。

    特定の 1 グループで任意のメンバーを許可する:

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

    特定の 1 グループ内で特定ユーザーのみを許可する:

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
      よくある間違い: `groupAllowFrom` はグループ許可リストではありません。

      - 負の Telegram グループ/スーパーグループチャット ID（`-1001234567890`）は `channels.telegram.groups` 配下に置きます。
      - Telegram ユーザー ID（`8734062810`）は、許可済みグループ内のどの人が bot をトリガーできるかを制限するために `groupAllowFrom` 配下に置きます。
      - 許可済みグループの任意のメンバーが bot と話せるようにする場合にのみ、`groupAllowFrom: ["*"]` を使用します。

    </Warning>

  </Tab>

  <Tab title="メンション動作">
    グループ返信はデフォルトでメンションを必要とします。メンションは次のいずれかから来ます。

    - ネイティブの `@botusername` メンション、または
    - `agents.list[].groupChat.mentionPatterns` または `messages.groupChat.mentionPatterns` 内のメンションパターン

    セッションレベルのトグル（状態のみで、永続化されません）: `/activation always`、`/activation mention`。永続化には config を使用します。

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

    グループ履歴コンテキストは常に有効で、`historyLimit` によって上限が設定されます。グループ履歴ウィンドウを無効にするには `channels.telegram.historyLimit: 0` を設定します。`openclaw doctor --fix` は廃止された `includeGroupHistoryContext` キーを削除します。

    グループチャット ID の取得: グループメッセージを `@userinfobot` / `@getidsbot` に転送する、`openclaw logs --follow` から `chat.id` を読み取る、Bot API の `getUpdates` を調べる、または（グループが許可された後で）`/whoami@<bot_username>` を実行します。

  </Tab>
</Tabs>

## Runtime の動作

- Telegram は Gateway プロセス内で実行されます。
- ルーティングは決定的です。Telegram のインバウンドには Telegram へ返信します（モデルはチャネルを選択しません）。
- インバウンドメッセージは、返信メタデータ、メディアプレースホルダー、Gateway が観測した返信の永続化済み返信チェーンコンテキストを含む共有チャネルエンベロープへ正規化されます。
- グループセッションはグループ ID で分離されます。フォーラムトピックは `:topic:<threadId>` を追加します。
- DM メッセージは `message_thread_id` を持つことがあります。OpenClaw は返信のためにそれを保持します。DM トピックセッションは、Telegram の `getMe` が bot について `has_topics_enabled: true` を報告した場合にのみ分割されます。それ以外の場合、DM はフラットなセッションのままです。
- ロングポーリングは grammY runner を使用し、チャットごと/スレッドごとの順序付けを行います。runner sink の並行性は `agents.defaults.maxConcurrent` を使用します。
- マルチアカウント起動では、同時 `getMe` プローブ数に上限を設けるため、大規模な bot 群でもすべてのアカウントプローブが一度に広がることはありません。
- 各 Gateway プロセスはロングポーリングを保護し、1 つの bot トークンを同時に使用できるアクティブ poller が 1 つだけになるようにします。継続的な `getUpdates` 409 競合は、同じトークンを使用している別の OpenClaw Gateway、スクリプト、または外部 poller を示します。
- ポーリング watchdog は、デフォルトで 120 秒間 `getUpdates` の liveness 完了がない場合に再起動します。長時間実行される作業中に誤った polling-stall 再起動が発生するデプロイでのみ、`channels.telegram.pollingStallThresholdMs`（30000-600000、アカウントごとの上書きに対応）を引き上げてください。
- Telegram Bot API は既読確認をサポートしていません（`sendReadReceipts` は適用されません）。

<Note>
  `channels.telegram.dm.threadReplies` と `channels.telegram.direct.<chatId>.threadReplies` は削除されました。設定にこれらのキーがまだある場合は、アップグレード後に `openclaw doctor --fix` を実行してください。DM トピックルーティングは、Telegram `getMe.has_topics_enabled`（BotFather のスレッドモードで制御）に従うようになりました。トピック有効のボットは、Telegram が `message_thread_id` を送信したときにスレッドスコープの DM セッションを使用し、それ以外の DM はフラットなセッションのままです。
</Note>

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClaw は、ダイレクトチャット、グループ、トピックで部分返信をリアルタイムにストリームします。プレビューメッセージを送信してから `editMessageText` を繰り返し、同じ場所で確定します。

    - `channels.telegram.streaming` は `off | partial | block | progress` です（デフォルト: `partial`）
    - 短い初期回答プレビューはデバウンスされ、実行がまだアクティブな場合は上限付きの遅延後に実体化されます
    - `progress` はツール進捗用に編集可能なステータス下書きを 1 つ保持し、ツール進捗より前に回答アクティビティが届いた場合は安定したステータスラベルを表示し、完了時に消去して、最終回答を通常のメッセージとして送信します
    - `streaming.preview.toolProgress` は、ツール/進捗の更新で同じ編集済みプレビューメッセージを再利用するかを制御します（デフォルト: プレビューストリーミングがアクティブな場合は `true`）
    - `streaming.preview.commandText` は、それらの行内のコマンド/実行詳細を制御します: `raw`（デフォルト）または `status`（ツールラベルのみ）
    - `streaming.progress.commentary`（デフォルト: `false`）は、一時的な進捗下書きにアシスタントのコメント/前置きテキストを含めるようにします
    - レガシーの `channels.telegram.streamMode`、真偽値の `streaming` 値、廃止済みのネイティブ下書きプレビューキーは検出されます。移行するには `openclaw doctor --fix` を実行してください

    ツール進捗行は、ツール実行中に表示される短いステータス更新です（コマンド実行、ファイル読み取り、計画更新、パッチ要約、app-server モードの Codex 前置き/コメント）。Telegram ではこれらがデフォルトで有効です（`v2026.4.22` 以降のリリース済み動作と一致します）。

    回答プレビュー編集は維持し、ツール進捗行を非表示にします。

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "toolProgress": false }
          }
        }
      }
    }
    ```

    ツール進捗を表示したまま、コマンド/実行テキストを非表示にします。

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "commandText": "status" }
          }
        }
      }
    }
    ```

    `progress` モードは、そのメッセージへ最終回答を編集して入れることなくツール進捗を表示します。コマンドテキストポリシーは `streaming.progress` の下に置きます。

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

    `streaming.mode: "off"` は、プレビュー編集を無効にし、汎用的なツール/進捗の雑音を単独のステータスメッセージとして送信する代わりに抑制します。承認プロンプト、メディア、エラーは引き続き通常の最終配信を通ります。`streaming.preview.toolProgress: false` は回答プレビュー編集のみを維持します。

    <Note>
      選択引用返信は例外です。`replyToMode` が `first`、`all`、または `batched` で、受信メッセージに選択された引用テキストがある場合、OpenClaw は回答プレビューを編集する代わりに Telegram のネイティブ引用返信経路で最終回答を送信するため、そのターンでは `streaming.preview.toolProgress` でステータス行を表示できません。選択引用テキストのない現在メッセージへの返信は引き続きストリームされます。ツール進捗の可視性がネイティブ引用返信より重要な場合は `replyToMode: "off"` を設定し、そのトレードオフを受け入れる場合は `streaming.preview.toolProgress: false` を設定してください。
    </Note>

    テキストのみの返信の場合: 短いプレビューは同じ場所で最終編集されます。複数メッセージに分割される長い最終回答は、プレビューを最初のチャンクとして再利用し、残りだけを送信します。進捗モードの最終回答はステータス下書きを消去し、通常の最終配信を使用します。完了が確認される前に最終編集が失敗した場合、OpenClaw は通常の最終配信にフォールバックし、古いプレビューをクリーンアップします。複雑な返信（メディアペイロード）の場合、OpenClaw は常に通常の最終配信にフォールバックし、プレビューをクリーンアップします。

    プレビューストリーミングとブロックストリーミングは相互排他的です。ブロックストリーミングが明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためプレビューストリームをスキップします。

    推論: `/reasoning stream` は生成中に推論をライブプレビューへストリームし、最終配信後に推論プレビューを削除します（表示したままにするには `/reasoning on` を使用）。最終回答は推論テキストなしで送信されます。

  </Accordion>

  <Accordion title="リッチメッセージ書式">
    送信テキストはデフォルトで標準の Telegram HTML メッセージを使用し、現在のクライアント全体で読みやすくなっています。太字、斜体、リンク、コード、スポイラー、引用に対応しますが、Bot API 10.1 のリッチ専用ブロック（ネイティブテーブル、詳細、リッチメディア、数式）ではありません。

    Bot API 10.1 のリッチメッセージを有効にします。

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    有効な場合: このボット/アカウントでリッチメッセージが利用可能であることがエージェントに伝えられます。Markdown テキストは OpenClaw の Markdown IR を通じて Telegram リッチ HTML としてレンダリングされます。明示的なリッチ HTML ペイロードは、対応する Bot API 10.1 タグ（見出し、テーブル、詳細、リッチメディア、数式）を保持します。メディアキャプションは引き続き Telegram HTML キャプションを使用します（リッチメッセージはキャプションを置き換えず、キャプションは 1024 文字が上限です）。

    これにより、モデルテキストは Telegram のリッチ Markdown 記号から離されるため、`$400-600K` のような通貨が数式として解析されません。長いリッチテキストは Telegram の制限に合わせて自動的に分割されます。20 列の制限を超えるテーブルはコードブロックにフォールバックします。

    デフォルト: オフ。クライアント互換性のためです。現在の一部の Desktop、Web、Android、サードパーティクライアントは、受理されたリッチメッセージを未対応としてレンダリングします。ボットで使用するすべてのクライアントがレンダリングできる場合を除き、これはオフのままにしてください。`/status` は現在のセッションでリッチメッセージがオンかオフかを表示します。

    リンクプレビューはデフォルトでオンです。`channels.telegram.linkPreview: false` はリッチテキストの自動エンティティ検出を無効にします。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegram のコマンドメニューは起動時に `setMyCommands` で登録されます。`commands.native: "auto"` は Telegram のネイティブコマンドを有効にします。

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

    ルール: 名前は正規化されます（先頭の `/` を削除し、小文字化）。有効なパターンは `a-z`、`0-9`、`_`、長さ 1-32 です。カスタムコマンドはネイティブコマンドを上書きできません。競合/重複はスキップされ、ログに記録されます。

    カスタムコマンドはメニュー項目のみです。動作を自動実装するものではありません。Plugin/skill コマンドは、Telegram メニューに表示されていなくても、入力されれば引き続き動作できます。ネイティブコマンドが無効な場合、組み込みは削除されます。カスタム/Plugin コマンドは、設定されていれば引き続き登録される場合があります。

    よくあるセットアップ失敗:

    - トリム再試行後に `setMyCommands failed` と `BOT_COMMANDS_TOO_MUCH` が出る場合、メニューがまだあふれています。Plugin/skill/カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効にしてください。
    - 直接の Bot API curl コマンドは動作するのに、`deleteWebhook`、`deleteMyCommands`、または `setMyCommands` が `404: Not Found` で失敗する場合、通常は `channels.telegram.apiRoot` が完全な `/bot<TOKEN>` エンドポイントに設定されています。`apiRoot` は Bot API のルートのみである必要があります。`openclaw doctor --fix` は誤って末尾に付いた `/bot<TOKEN>` を削除します。
    - `getMe returned 401` は、Telegram が設定済みボットトークンを拒否したことを意味します。現在の BotFather トークンで `botToken`、`tokenFile`、または `TELEGRAM_BOT_TOKEN`（デフォルトアカウント）を更新してください。OpenClaw はポーリング前に停止するため、これは Webhook クリーンアップ失敗として報告されません。
    - ネットワーク/フェッチエラーで `setMyCommands failed` になる場合、通常は `api.telegram.org` への外向き DNS/HTTPS がブロックされています。

    ### デバイスペアリングコマンド（`device-pair` Plugin）

    インストール済みの場合:

    1. `/pair` がセットアップコードを生成します
    2. iOS アプリにコードを貼り付けます
    3. `/pair pending` が保留中のリクエストを一覧表示します（ロール/スコープを含む）
    4. 承認します: `/pair approve <requestId>`、`/pair approve`（保留中リクエストが 1 件のみ）、または `/pair approve latest`

    デバイスが変更された認証詳細（ロール、スコープ、公開鍵）で再試行した場合、以前の保留中リクエストは新しい `requestId` で置き換えられます。承認前に `/pair pending` を再実行してください。

    詳細: [ペアリング](/ja-JP/channels/pairing#pair-via-telegram)。

  </Accordion>

  <Accordion title="インラインボタン">
    インラインキーボードスコープを設定します。

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

    スコープ: `off`、`dm`、`group`、`all`、`allowlist`（デフォルト）。レガシーの `capabilities: ["inlineButtons"]` は `"all"` にマップされます。

    メッセージアクション例:

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

    Mini App ボタン例:

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

    `web_app` ボタンは、ユーザーとボット間のプライベートチャットでのみ動作します。

    登録済み Plugin のインタラクティブハンドラーに要求されなかったコールバッククリックは、テキストとしてエージェントに渡されます: `callback_data: <value>`。

  </Accordion>

  <Accordion title="エージェントと自動化向けの Telegram メッセージアクション">
    アクション:

    - `sendMessage`（`to`、`content`、任意の `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content` または `caption`、任意の `presentation` インラインボタン。ボタンのみの編集は返信マークアップを更新します）
    - `createForumTopic`（`chatId`、`name`、任意の `iconColor`、`iconCustomEmojiId`）

    使いやすいエイリアス: `send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`。

    ゲート制御: `channels.telegram.actions.sendMessage`、`deleteMessage`、`reactions`、`sticker`（デフォルト: 無効）。`edit`、`createForumTopic`、`editForumTopic` は専用トグルなしでデフォルト有効です。
    ランタイム送信は起動/リロード時点のアクティブな設定/シークレットスナップショットを使用するため、アクション経路は送信ごとに `SecretRef` 値を再解決しません。

    リアクション削除のセマンティクス: [/tools/reactions](/ja-JP/tools/reactions)。

  </Accordion>

  <Accordion title="返信スレッドタグ">
    生成された出力内の明示的な返信スレッドタグ:

    - `[[reply_to_current]]` — トリガーになったメッセージに返信します
    - `[[reply_to:<id>]]` — 特定のメッセージ ID に返信します

    `channels.telegram.replyToMode`: `off`（デフォルト）、`first`、`all`。

    返信スレッドが有効で、元のテキスト/キャプションが利用可能な場合、OpenClaw はネイティブ引用抜粋を自動的に追加します。Telegram はネイティブ引用テキストを 1024 UTF-16 コード単位に制限します。長いメッセージは先頭から引用され、Telegram が引用を拒否した場合は通常の返信にフォールバックします。

    `off` は暗黙的な返信スレッドのみを無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッドの動作">
    フォーラムスーパーグループ: トピックセッションキーには `:topic:<threadId>` が追加されます。返信と入力中表示はトピックのスレッドを対象にします。トピック設定パスは `channels.telegram.groups.<chatId>.topics.<threadId>` です。

    一般トピック (`threadId=1`) は特殊ケースです。メッセージ送信では `message_thread_id` を省略します (Telegram は `sendMessage(...thread_id=1)` を "thread not found" で拒否します) が、入力中アクションには引き続き `message_thread_id` を含めます (入力中インジケーターを表示するために経験的に必要です)。

    トピックエントリは、上書きされない限りグループ設定 (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`) を継承します。`agentId` はトピック専用で、グループのデフォルトからは継承されません。`topics."*"` はそのグループ内のすべてのトピックに対するデフォルトを設定します。完全一致するトピック ID は引き続き `"*"` より優先されます。

    **トピックごとのエージェントルーティング**: 各トピックは、トピック設定内の `agentId` によって別のエージェントへルーティングでき、それぞれ独自のワークスペース、メモリ、セッションを持てます。

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic -> main agent
                "3": { agentId: "zu" },        // Dev topic -> zu agent
                "5": { agentId: "coder" }      // Code review -> coder agent
              }
            }
          }
        }
      }
    }
    ```

    その後、各トピックは独自のセッションキーを持ちます。たとえば `agent:zu:telegram:group:-1001234567890:topic:3` です。

    **永続的な ACP トピックバインディング**: フォーラムトピックは、トップレベルの型付きバインディング (`type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`、および `-1001234567890:topic:42` のようなトピック修飾 ID を持つ `bindings[]`) を通じて ACP ハーネスセッションを固定できます。現在はグループ/スーパーグループ内のフォーラムトピックにスコープされています。[ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

    **チャットからのスレッド紐付け ACP 生成**: `/acp spawn <agent> --thread here|auto` は現在のトピックを新しい ACP セッションにバインドします。後続のやり取りはそこへ直接ルーティングされ、OpenClaw は生成確認をトピック内にピン留めします。`channels.telegram.threadBindings.spawnSessions` が必要です (デフォルト: `true`)。

    テンプレートコンテキストは `MessageThreadId` と `IsForum` を公開します。`message_thread_id` を持つ DM チャットは返信メタデータを保持しますが、Telegram `getMe` が `has_topics_enabled: true` を返す場合にのみ、スレッド対応のセッションキーを使用します。
    廃止された `dm.threadReplies` と `direct.*.threadReplies` の上書きは削除されました。BotFather のスレッドモードが唯一の信頼できる情報源です。古い設定キーを削除するには `openclaw doctor --fix` を実行してください。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegram はボイスメモと音声ファイルを区別します。デフォルト: 音声ファイルの動作です。エージェント返信に `[[audio_as_voice]]` をタグ付けすると、ボイスメモ送信を強制できます。受信したボイスメモの文字起こしは、エージェントコンテキスト内で機械生成の信頼できないテキストとして扱われますが、メンション検出は引き続き生の文字起こしを使用するため、メンションで制限されたボイスメッセージは動作し続けます。

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

    Telegram は動画ファイルとビデオメモを区別します。ビデオメモはキャプションをサポートしていません。指定されたメッセージテキストは別途送信されます。

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### ステッカー

    受信: 静的 WEBP はダウンロードされて処理されます (プレースホルダー `<media:sticker>`)。アニメーション TGS と動画 WEBM はスキップされます。

    ステッカーコンテキストフィールド: `Sticker.emoji`, `Sticker.setName`, `Sticker.fileId`, `Sticker.fileUniqueId`, `Sticker.cachedDescription`。説明は、繰り返しのビジョン呼び出しを減らすために OpenClaw SQLite プラグイン状態にキャッシュされます。

    ステッカーアクションを有効化します。

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

    送信:

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
    Telegram のリアクションは、メッセージペイロードとは別の `message_reaction` 更新として到着します。有効な場合、OpenClaw は `Telegram reaction added: 👍 by Alice (@alice) on msg 42` のようなシステムイベントをキューに入れます。

    - `channels.telegram.reactionNotifications`: `off | own | all` (デフォルト: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (デフォルト: `minimal`)

    `own` は、ボットが送信したメッセージへのユーザーリアクションのみを意味します (送信済みメッセージキャッシュによるベストエフォート)。リアクションイベントは引き続き Telegram のアクセス制御 (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) に従います。許可されていない送信者は破棄されます。

    Telegram はリアクション更新内でスレッド ID を提供しません。非フォーラムグループはグループチャットセッションへルーティングされます。フォーラムグループは、正確な発信元トピックではなく、一般トピックセッション (`:topic:1`) へルーティングされます。

    ポーリング/Webhook の `allowed_updates` には `message_reaction` が自動的に含まれます。

  </Accordion>

  <Accordion title="Ack リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間に確認用の絵文字を送信します。`messages.ackReactionScope` は、それが*いつ*送信されるかを決定します。

    **絵文字の解決順序:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェント ID 絵文字フォールバック (`agents.list[].identity.emoji`、なければ "👀")

    Telegram は Unicode 絵文字 (たとえば "👀") を想定します。チャンネルまたはアカウントのリアクションを無効にするには `""` を使用してください。

    **スコープ (`messages.ackReactionScope`、デフォルト `"group-mentions"`。現在、Telegram アカウントまたは Telegram チャンネルによる上書きはありません):**

    `all` (DM + グループ、アンビエントルームイベントを含む)、`direct` (DM のみ)、`group-all` (アンビエントルームイベントを除くすべてのグループメッセージ、DM なし)、`group-mentions` (ボットがメンションされたグループ。**DM なし** — デフォルト)、`off` / `none` (無効)。

    <Note>
    デフォルトスコープ (`group-mentions`) は、DM またはアンビエントルームイベントで ack リアクションを発火しません。DM には `direct` または `all` を使用してください。アンビエントルームイベントを確認するのは `all` のみです。この値は Telegram プロバイダーの起動時に読み取られるため、変更を有効にするには Gateway の再起動が必要です。
    </Note>

  </Accordion>

  <Accordion title="Telegram イベントとコマンドからの設定書き込み">
    チャンネル設定の書き込みはデフォルトで有効です (`configWrites !== false`)。Telegram によってトリガーされる書き込みには、グループ移行イベント (`migrate_to_chat_id`、`channels.telegram.groups` を更新) と `/config set` / `/config unset` (コマンド有効化が必要) が含まれます。

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

  <Accordion title="ロングポーリング vs Webhook">
    デフォルトはロングポーリングです。Webhook モードでは、`channels.telegram.webhookUrl` と `channels.telegram.webhookSecret` を設定します。任意で `webhookPath` (デフォルト `/telegram-webhook`)、`webhookHost` (デフォルト `127.0.0.1`)、`webhookPort` (デフォルト `8787`)、`webhookCertPath` (直接 IP またはドメインなしのセットアップ向けの自己署名証明書 PEM) を設定できます。

    ロングポーリングモードでは、OpenClaw は更新が正常にディスパッチされた後にのみ再起動ウォーターマークを永続化します。失敗したハンドラーは、その更新を完了済みとしてマークするのではなく、同じプロセス内で再試行可能なままにします。

    ローカルリスナーはデフォルトで `127.0.0.1:8787` にバインドします。公開インレスには、ローカルポートの前段にリバースプロキシを置くか、意図的に `webhookHost: "0.0.0.0"` を設定してください。

    Webhook モードは、`200` を返す前にリクエストガード、Telegram シークレットトークン、JSON 本文を検証します。その後、OpenClaw はロングポーリングで使われるものと同じチャットごと/トピックごとのボットレーンを通じて、更新を非同期で処理します。そのため、遅いエージェントターンが Telegram の配信 ACK を保持することはありません。

  </Accordion>

  <Accordion title="制限、再試行、CLI ターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは 4000 です。`chunkMode="newline"` は長さ分割の前に段落境界 (空行) を優先します。
    - `channels.telegram.mediaMaxMb` (デフォルト 100) は受信および送信メディアサイズを制限します。
    - `channels.telegram.mediaGroupFlushMs` (デフォルト 500、範囲 10-60000) は、アルバム/メディアグループを OpenClaw が 1 つの受信メッセージとしてディスパッチする前にバッファリングする時間を制御します。アルバムの一部が遅れて到着する場合は増やし、アルバム返信レイテンシを減らす場合は減らしてください。
    - `channels.telegram.timeoutSeconds` は API クライアントのタイムアウトを上書きします (未設定の場合は grammY のデフォルトが適用されます)。ボットクライアントは、OpenClaw のトランスポートガードとフォールバックが実行できる前に grammY が表示される返信配信を中止しないように、設定値を 60 秒の送信テキスト/入力中リクエストガード未満に制限します。ロングポーリングでは引き続き 45 秒の `getUpdates` リクエストガードを使用するため、アイドル状態のポーリングが無期限に放棄されることはありません。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは 120000 です。誤検知のポーリング停止再起動の場合にのみ、30000 から 600000 の間で調整してください。
    - グループコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit` (デフォルト 50) を使用します。`0` は無効化します。
    - 返信/引用/転送の補足コンテキストは、Gateway が親メッセージを観測している場合、選択された 1 つの会話コンテキストウィンドウへ正規化されます。観測済みメッセージキャッシュは OpenClaw SQLite プラグイン状態に保存され、`openclaw doctor --fix` はレガシーサイドカーをインポートします。Telegram は各更新につき浅い `reply_to_message` を 1 つだけ含めるため、キャッシュより古いチェーンはそのペイロードに限定されます。
    - Telegram 許可リストは主に、誰がエージェントをトリガーできるかを制御するものであり、完全な補足コンテキストの秘匿境界ではありません。
    - DM 履歴: `channels.telegram.dmHistoryLimit`, `channels.telegram.dms["<user_id>"].historyLimit`。
    - `channels.telegram.retry` は、復旧可能な送信 API エラーに対して Telegram 送信ヘルパー (CLI/ツール/アクション) に適用されます。受信の最終返信配信では、接続前の失敗に対して境界付きのセーフ送信再試行を使用しますが、表示メッセージが重複する可能性のある送信後の曖昧なネットワークエンベロープは再試行しません。

    CLI とメッセージツールの送信ターゲットは、数値チャット ID、ユーザー名、またはフォーラムトピックターゲットを受け付けます。

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    投票は `openclaw message poll` を使用し、フォーラムトピックをサポートします。

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram 専用の投票フラグ: `--poll-duration-seconds` (5-600)、`--poll-anonymous`、`--poll-public`、`--thread-id` (または `:topic:` ターゲット)。`--poll-option` は 2-12 回繰り返します (Telegram の選択肢上限)。

    Telegram 送信は、インラインキーボード用の `buttons` ブロックを持つ `--presentation` (`channels.telegram.capabilities.inlineButtons` が許可する場合)、ボットがそのチャットでピン留めできる場合にピン留め配信を要求する `--pin` または `--delivery '{"pin":true}'`、送信画像、GIF、動画を圧縮/アニメーション/動画アップロードではなくドキュメントとして送信する `--force-document` もサポートします。

    アクションゲート: `channels.telegram.actions.sendMessage=false` は投票を含むすべての送信メッセージを無効化します。`channels.telegram.actions.poll=false` は通常送信を有効のまま、投票作成を無効化します。

  </Accordion>

  <Accordion title="Telegram での exec 承認">
    Telegram は承認者 DM で exec 承認をサポートし、任意で発信元のチャットまたはトピックにプロンプトを投稿できます。承認者は数値の Telegram ユーザー ID である必要があります。

    - `channels.telegram.execApprovals.enabled`（少なくとも 1 人の承認者を解決できる場合、`"auto"` で有効化）
    - `channels.telegram.execApprovals.approvers`（`commands.ownerAllowFrom` の数値所有者 ID にフォールバック）
    - `channels.telegram.execApprovals.target`: `dm`（デフォルト） | `channel` | `both`
    - `agentFilter`、`sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom`、`defaultTo` は、誰がボットと会話できるか、通常の返信をどこへ送るかを制御します。これらによって誰かが exec 承認者になるわけではありません。最初に承認された DM ペアリングは、コマンド所有者がまだ存在しない場合に `commands.ownerAllowFrom` をブートストラップするため、所有者が 1 人のセットアップでは `execApprovals.approvers` に ID を重複して記述せずに動作します。

    チャンネル配信ではチャット内にコマンドテキストが表示されます。信頼できるグループ/トピックでのみ `channel` または `both` を有効にしてください。プロンプトがフォーラムトピックに届いた場合、OpenClaw は承認プロンプトとフォローアップでそのトピックを保持します。exec 承認はデフォルトで 30 分後に期限切れになります。

    インライン承認ボタンでは、`channels.telegram.capabilities.inlineButtons` が対象サーフェス（`dm`、`group`、または `all`）を許可していることも必要です。`plugin:` で始まる承認 ID は Plugin 承認を通じて解決され、それ以外は最初に exec 承認を通じて解決されます。

    [Exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## エラー返信制御

エージェントで配信エラーまたはプロバイダーエラーが発生した場合、エラーポリシーによってエラーメッセージを Telegram チャットへ届けるかどうかを制御します。

| キー                                | 値                         | デフォルト      | 説明                                                                                                                                                                                                   |
| ----------------------------------- | -------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `always`、`once`、`silent` | `always`        | `always` はすべてのエラーメッセージをチャットへ送信します。`once` はクールダウン期間ごとに一意のエラーメッセージを 1 回送信します（同一エラーの繰り返しを抑制します）。`silent` はエラーメッセージをチャットへ送信しません。 |
| `channels.telegram.errorCooldownMs` | 数値 (ms)                  | `14400000` (4h) | `once` ポリシーのクールダウン期間です。エラーが送信された後、同じメッセージはこの間隔が経過するまで抑制されます。障害中のエラースパムを防ぎます。                                      |

アカウント単位、グループ単位、トピック単位のオーバーライドに対応しています（他の Telegram 設定キーと同じ継承）。

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
  <Accordion title="メンションのないグループメッセージにボットが応答しない">

    - `requireMention=false` の場合、Telegram のプライバシーモードで完全な可視性を許可する必要があります。BotFather の `/setprivacy` -> Disable を実行し、その後ボットをグループから削除して再追加してください。
    - 設定がメンションなしのグループメッセージを想定している場合、`openclaw channels status` が警告します。
    - `openclaw channels status --probe` は明示的な数値グループ ID をチェックします。ワイルドカード `"*"` はメンバーシッププローブできません。
    - 簡易セッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="ボットがグループメッセージをまったく認識しない">

    - `channels.telegram.groups` が存在する場合、そのグループを一覧に含める必要があります（または `"*"` を含めます）。
    - グループ内のボットメンバーシップを確認してください。
    - スキップ理由について `openclaw logs --follow` を確認してください。

  </Accordion>

  <Accordion title="コマンドが一部しか動作しない、またはまったく動作しない">

    - 送信者 ID を承認してください（ペアリングおよび/または数値の `allowFrom`）。グループポリシーが `open` の場合でも、コマンド承認は引き続き適用されます。
    - `BOT_COMMANDS_TOO_MUCH` を伴う `setMyCommands failed` は、ネイティブメニューの項目数が多すぎることを意味します。Plugin/skill/カスタムコマンドを減らすか、ネイティブメニューを無効にしてください。
    - 起動時の `deleteMyCommands` / `setMyCommands` 呼び出しと、`sendChatAction` の入力中表示呼び出しは、リクエストタイムアウト時に制限付きで Telegram のトランスポートフォールバックを通じて 1 回再試行されます。永続的なネットワーク/フェッチエラーは通常、`api.telegram.org` への DNS/HTTPS が到達不能であることを意味します。

  </Accordion>

  <Accordion title="起動時に未承認トークンが報告される">

    - `getMe returned 401` は、設定されたボットトークンに対する Telegram 認証失敗です。BotFather でトークンを再コピーまたは再生成し、`channels.telegram.botToken`、`tokenFile`、`accounts.<id>.botToken`、または `TELEGRAM_BOT_TOKEN`（デフォルトアカウント）を更新してください。
    - 起動中の `deleteWebhook 401 Unauthorized` も認証失敗です。これを「Webhook が存在しない」と扱っても、同じ不正トークンの失敗が後続の API 呼び出しまで先送りされるだけです。

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定性">

    - カスタム fetch/proxy を使う Node 22+ では、`AbortSignal` 型が一致しない場合に即時中断動作が発生することがあります。
    - 一部のホストは `api.telegram.org` を IPv6 優先で解決します。壊れた IPv6 送信経路は断続的な API 失敗を引き起こします。
    - `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` を含むログは、回復可能なネットワークエラーとして再試行されます。
    - ポーリング起動中、OpenClaw は成功した起動時の `getMe` プローブを grammY 用に再利用するため、ランナーは最初の `getUpdates` の前に 2 回目の `getMe` を必要としません。
    - ポーリング起動中に `deleteWebhook` が一時的なネットワークエラーで失敗した場合、OpenClaw は別のポーリング前コントロールプレーン呼び出しを行わず、long polling に進みます。まだ有効な Webhook がある場合は `getUpdates` の競合として表面化します。OpenClaw はトランスポートを再構築し、Webhook クリーンアップを再試行します。
    - Telegram ソケットが短い固定周期で再利用される場合は、低い `channels.telegram.timeoutSeconds` を確認してください。ボットクライアントは送信リクエストおよび `getUpdates` リクエストのガードを下回る設定値をクランプしますが、古いリリースではこの値がそれらのガード未満に設定されると、すべてのポーリングまたは返信が中断されることがありました。
    - ログの `Polling stall detected` は、デフォルトで 120 秒間、完了した long-poll ライブネスがない場合に、OpenClaw がポーリングを再起動し、トランスポートを再構築することを意味します。
    - `openclaw channels status --probe` と `openclaw doctor` は、実行中のポーリングアカウントが起動猶予後に `getUpdates` を完了していない場合、実行中の Webhook アカウントが起動猶予後に `setWebhook` を完了していない場合、または最後に成功したポーリングトランスポートアクティビティが古い場合に警告します。
    - 長時間実行される `getUpdates` 呼び出しは正常だが、ホストが誤ったポーリング停止再起動を報告する場合にのみ、`channels.telegram.pollingStallThresholdMs` を引き上げてください。永続的な停止は通常、`api.telegram.org` への proxy、DNS、IPv6、または TLS 送信経路の問題を示します。
    - Telegram は Bot API トランスポートに対してプロセスの proxy 環境変数を尊重します: `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、および小文字のバリアント。`NO_PROXY` / `no_proxy` は引き続き `api.telegram.org` をバイパスできます。
    - サービス環境で `OPENCLAW_PROXY_URL` が設定され、標準 proxy 環境変数が存在しない場合、Telegram もその URL を Bot API トランスポートに使用します。
    - 直接の送信経路/TLS が不安定な VPS ホストでは、proxy 経由で Telegram API 呼び出しをルーティングしてください。

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ はデフォルトで `autoSelectFamily=true` です（WSL2 を除く）。Telegram DNS 結果順序は、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、次に `channels.telegram.network.dnsResultOrder`、次にプロセスのデフォルト（例: `NODE_OPTIONS=--dns-result-order=ipv4first`）を尊重し、いずれも適用されない場合は Node 22+ で `ipv4first` にフォールバックします。
    - WSL2、または IPv4 のみの動作がより適している場合は、ファミリー選択を強制してください。

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 ベンチマーク範囲の応答（`198.18.0.0/15`）は、Telegram メディアダウンロードでデフォルトですでに許可されています。信頼できる fake-IP または透過 proxy が、メディアダウンロード中に `api.telegram.org` を他の private/internal/special-use アドレスへ書き換える場合は、Telegram 専用バイパスにオプトインしてください。

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じオプトインは、`channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` でアカウント単位でも利用できます。
    - proxy が Telegram メディアホストを `198.18.x.x` に解決する場合は、まず dangerous フラグをオフのままにしてください。この範囲はデフォルトですでに許可されています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` は Telegram メディアの SSRF 保護を弱めます。RFC 2544 ベンチマーク範囲外の private または special-use 応答を合成する、信頼できるオペレーター管理の proxy 環境（Clash、Mihomo、Surge fake-IP ルーティング）でのみ使用してください。通常のパブリックインターネット経由の Telegram アクセスではオフのままにしてください。
    </Warning>

    - 一時的な環境オーバーライド: `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`、`OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`。
    - DNS 応答を検証します。

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

詳細ヘルプ: [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

## 設定リファレンス

主要リファレンス: [設定リファレンス - Telegram](/ja-JP/gateway/config-channels#telegram)。

<Accordion title="重要度の高い Telegram フィールド">

- 起動/認証: `enabled`、`botToken`、`tokenFile`（通常ファイルである必要があります。シンボリックリンクは拒否されます）、`accounts.*`
- アクセス制御: `dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、トップレベルの `bindings[]`（`type: "acp"`）
- トピックデフォルト: `groups.<chatId>.topics."*"` は一致しないフォーラムトピックに適用されます。完全一致するトピック ID がそれを上書きします
- exec 承認: `execApprovals`、`accounts.*.execApprovals`
- コマンド/メニュー: `commands.native`、`commands.nativeSkills`、`customCommands`
- スレッド/返信: `replyToMode`、`threadBindings`
- ストリーミング: `streaming`（モード `off | partial | block | progress`）、`streaming.preview.toolProgress`
- フォーマット/配信: `textChunkLimit`、`chunkMode`、`richMessages`、`markdown.tables`（`off | bullets | code | block`）、`linkPreview`、`responsePrefix`
- メディア/ネットワーク: `mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- カスタム API ルート: `apiRoot`（Bot API ルートのみ。`/bot<TOKEN>` は含めないでください）、`trustedLocalFileRoots`（セルフホスト Bot API の絶対 `file_path` ルート）
- Webhook: `webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`、`webhookPort`、`webhookCertPath`
- アクション/機能: `capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- リアクション: `reactionNotifications`、`reactionLevel`
- エラー: `errorPolicy`、`errorCooldownMs`、`silentErrorReplies`
- 書き込み/履歴: `configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
複数アカウントの優先順位: 2 つ以上のアカウント ID を設定している場合は、デフォルトルーティングを明示するために `channels.telegram.defaultAccount` を設定してください（または `channels.telegram.accounts.default` を含めてください）。そうでない場合、OpenClaw は最初に正規化されたアカウント ID にフォールバックし、`openclaw doctor` が警告します。名前付きアカウントは `channels.telegram.allowFrom` / `groupAllowFrom` を継承しますが、`accounts.default.*` の値は継承しません。
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
    脅威モデルとハードニング。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    グループとトピックをエージェントに対応付けます。
  </Card>
  <Card title="トラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断。
  </Card>
</CardGroup>
