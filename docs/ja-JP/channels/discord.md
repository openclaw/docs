---
read_when:
    - Discord チャネル機能への取り組み
summary: Discord ボットのサポート状況、機能、設定
title: Discord
x-i18n:
    generated_at: "2026-05-03T21:27:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a38cb3c8e25c1f3d6b7ddfc35a0445dc264be74d74b08d0051528b462b743a3
    source_path: channels/discord.md
    workflow: 16
---

公式 Discord Gateway 経由で DM とギルドチャンネルに対応しています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Discord DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブのコマンド動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復フロー。
  </Card>
</CardGroup>

## クイックセットアップ

bot を含む新しいアプリケーションを作成し、その bot をサーバーに追加して、OpenClaw とペアリングする必要があります。自分専用のプライベートサーバーに bot を追加することをおすすめします。まだない場合は、[先に作成してください](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends** を選択）。

<Steps>
  <Step title="Discord アプリケーションと bot を作成する">
    [Discord Developer Portal](https://discord.com/developers/applications) に移動し、**New Application** をクリックします。名前は "OpenClaw" のようなものにします。

    サイドバーで **Bot** をクリックします。**Username** を OpenClaw エージェントに付けたい名前に設定します。

  </Step>

  <Step title="特権 intents を有効にする">
    引き続き **Bot** ページで、**Privileged Gateway Intents** まで下にスクロールし、次を有効にします。

    - **Message Content Intent**（必須）
    - **Server Members Intent**（推奨。ロール許可リストと名前から ID への照合に必要）
    - **Presence Intent**（任意。プレゼンス更新にのみ必要）

  </Step>

  <Step title="bot トークンをコピーする">
    **Bot** ページの上部に戻り、**Reset Token** をクリックします。

    <Note>
    名前に反して、これは最初のトークンを生成します。「reset」されるものはありません。
    </Note>

    トークンをコピーしてどこかに保存します。これが **Bot Token** で、すぐ後で必要になります。

  </Step>

  <Step title="招待 URL を生成し、bot をサーバーに追加する">
    サイドバーで **OAuth2** をクリックします。bot をサーバーに追加するために必要な権限を持つ招待 URL を生成します。

    **OAuth2 URL Generator** まで下にスクロールし、次を有効にします。

    - `bot`
    - `applications.commands`

    下に **Bot Permissions** セクションが表示されます。少なくとも次を有効にします。

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（任意）

    これは通常のテキストチャンネル向けのベースライン設定です。Discord スレッドに投稿する予定がある場合、フォーラムやメディアチャンネルのワークフローでスレッドを作成または継続する場合も含めて、**Send Messages in Threads** も有効にしてください。
    下部の生成された URL をコピーしてブラウザーに貼り付け、サーバーを選択して **Continue** をクリックして接続します。これで Discord サーバーに bot が表示されるはずです。

  </Step>

  <Step title="Developer Mode を有効にして ID を集める">
    Discord アプリに戻り、内部 ID をコピーできるように Developer Mode を有効にする必要があります。

    1. **User Settings**（アバターの横にある歯車アイコン）をクリック → **Advanced** → **Developer Mode** をオンにする
    2. サイドバーの **server icon** を右クリック → **Copy Server ID**
    3. **own avatar** を右クリック → **Copy User ID**

    **Server ID** と **User ID** を Bot Token と一緒に保存します。次の手順で 3 つすべてを OpenClaw に送ります。

  </Step>

  <Step title="サーバーメンバーからの DM を許可する">
    ペアリングを機能させるには、Discord が bot からあなたへの DM を許可する必要があります。**server icon** を右クリック → **Privacy Settings** → **Direct Messages** をオンにします。

    これにより、サーバーメンバー（bot を含む）があなたに DM を送信できます。Discord DM を OpenClaw で使いたい場合は、この設定を有効のままにしてください。ギルドチャンネルだけを使う予定なら、ペアリング後に DM を無効にできます。

  </Step>

  <Step title="bot トークンを安全に設定する（チャットに送信しない）">
    Discord bot トークンはシークレット（パスワードのようなもの）です。エージェントにメッセージを送る前に、OpenClaw を実行しているマシン上で設定します。

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
cat > discord.patch.json5 <<'JSON5'
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./discord.patch.json5 --dry-run
openclaw config patch --file ./discord.patch.json5
openclaw gateway
```

    OpenClaw がすでにバックグラウンドサービスとして実行されている場合は、OpenClaw Mac アプリから再起動するか、`openclaw gateway run` プロセスを停止して再起動します。
    マネージドサービスインストールの場合は、`DISCORD_BOT_TOKEN` が存在するシェルから `openclaw gateway install` を実行するか、変数を `~/.openclaw/.env` に保存して、再起動後にサービスが env SecretRef を解決できるようにします。
    ホストが Discord の起動時アプリケーション検索でブロックまたはレート制限される場合は、Developer Portal の Discord application/client ID を設定して、起動時にその REST 呼び出しをスキップできるようにします。デフォルトアカウントには `channels.discord.applicationId` を使用し、複数の Discord bot を実行する場合は `channels.discord.accounts.<accountId>.applicationId` を使用します。

  </Step>

  <Step title="OpenClaw を設定してペアリングする">

    <Tabs>
      <Tab title="エージェントに依頼">
        既存の任意のチャンネル（例: Telegram）で OpenClaw エージェントとチャットして伝えます。Discord が最初のチャンネルの場合は、代わりに CLI / config タブを使用してください。

        > "Discord bot トークンはすでに config に設定しました。User ID `<user_id>` と Server ID `<server_id>` で Discord セットアップを完了してください。"
      </Tab>
      <Tab title="CLI / config">
        ファイルベースの config を好む場合は、次を設定します。

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        デフォルトアカウントの env フォールバック:

```bash
DISCORD_BOT_TOKEN=...
```

        スクリプトやリモートセットアップの場合は、同じ JSON5 ブロックを `openclaw config patch --file ./discord.patch.json5 --dry-run` で書き込み、その後 `--dry-run` なしで再実行します。プレーンテキストの `token` 値がサポートされています。SecretRef 値も env/file/exec プロバイダー全体で `channels.discord.token` に対応しています。[シークレット管理](/ja-JP/gateway/secrets)を参照してください。

        複数の Discord bot では、各 bot トークンと application ID をそれぞれのアカウント配下に保持します。トップレベルの `channels.discord.applicationId` はアカウントに継承されるため、すべてのアカウントが同じ application ID を使う場合にのみそこに設定してください。

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        personal: {
          token: { source: "env", provider: "default", id: "DISCORD_PERSONAL_TOKEN" },
          applicationId: "111111111111111111",
        },
        work: {
          token: { source: "env", provider: "default", id: "DISCORD_WORK_TOKEN" },
          applicationId: "222222222222222222",
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="最初の DM ペアリングを承認する">
    Gateway が実行されるまで待ってから、Discord で bot に DM します。bot はペアリングコードで応答します。

    <Tabs>
      <Tab title="エージェントに依頼">
        既存のチャンネルでペアリングコードをエージェントに送信します。

        > "この Discord ペアリングコードを承認してください: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    ペアリングコードは 1 時間後に期限切れになります。

    これで Discord の DM 経由でエージェントとチャットできるようになります。

  </Step>
</Steps>

<Note>
トークン解決はアカウントを認識します。config のトークン値は env フォールバックより優先されます。`DISCORD_BOT_TOKEN` はデフォルトアカウントにのみ使用されます。
有効化された 2 つの Discord アカウントが同じ bot トークンに解決される場合、OpenClaw はそのトークンに対して Gateway モニターを 1 つだけ開始します。config 由来のトークンはデフォルトの env フォールバックより優先されます。それ以外の場合は、最初に有効化されたアカウントが優先され、重複アカウントは無効として報告されます。
高度なアウトバウンド呼び出し（message ツール/チャンネルアクション）では、明示的な呼び出しごとの `token` がその呼び出しに使用されます。これは送信および読み取り/プローブ系アクション（たとえば read/search/fetch/thread/pins/permissions）に適用されます。アカウントポリシー/リトライ設定は引き続き、アクティブなランタイムスナップショットで選択されたアカウントから取得されます。
</Note>

## 推奨: ギルドワークスペースを設定する

DM が動作したら、Discord サーバーをフルワークスペースとして設定できます。各チャンネルには独自のコンテキストを持つ独自のエージェントセッションが割り当てられます。自分と bot だけがいるプライベートサーバーではこれをおすすめします。

<Steps>
  <Step title="サーバーをギルド許可リストに追加する">
    これにより、エージェントは DM だけでなく、サーバー上の任意のチャンネルで応答できるようになります。

    <Tabs>
      <Tab title="エージェントに依頼">
        > "Discord Server ID `<server_id>` をギルド許可リストに追加してください"
      </Tab>
      <Tab title="Config">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="@mention なしの応答を許可する">
    デフォルトでは、エージェントはギルドチャンネルで @mentioned された場合にのみ応答します。プライベートサーバーでは、おそらくすべてのメッセージに応答させたいはずです。

    ギルドチャンネルでは、通常のアシスタント最終返信はデフォルトで非公開のままです。表示される Discord 出力は `message` ツールで明示的に送信する必要があるため、エージェントはデフォルトで控えめに待機し、チャンネル返信が有用だと判断したときだけ投稿できます。

    <Tabs>
      <Tab title="エージェントに依頼">
        > "このサーバーで、@mentioned されなくてもエージェントが応答できるようにしてください"
      </Tab>
      <Tab title="Config">
        ギルド config で `requireMention: false` を設定します。

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

        グループ/チャンネルルームで従来の自動最終返信を復元するには、`messages.groupChat.visibleReplies: "automatic"` を設定します。

      </Tab>
    </Tabs>

  </Step>

  <Step title="ギルドチャンネルのメモリを計画する">
    デフォルトでは、長期メモリ（MEMORY.md）は DM セッションでのみ読み込まれます。ギルドチャンネルでは MEMORY.md は自動読み込みされません。

    <Tabs>
      <Tab title="エージェントに依頼">
        > "Discord チャンネルで質問したとき、MEMORY.md の長期コンテキストが必要なら memory_search または memory_get を使用してください。"
      </Tab>
      <Tab title="手動">
        すべてのチャンネルで共有コンテキストが必要な場合は、安定した指示を `AGENTS.md` または `USER.md` に置きます（これらはすべてのセッションに注入されます）。長期ノートは `MEMORY.md` に保持し、必要に応じてメモリツールでアクセスします。
      </Tab>
    </Tabs>

  </Step>
</Steps>

これで Discord サーバーにいくつかのチャンネルを作成し、チャットを開始できます。エージェントはチャンネル名を認識でき、各チャンネルには独自の分離されたセッションが割り当てられます。そのため、`#coding`、`#home`、`#research` など、ワークフローに合うものを設定できます。

## ランタイムモデル

- Gateway が Discord 接続を所有します。
- 返信ルーティングは決定的です。Discord の受信返信は Discord に戻ります。
- Discord のギルド/チャンネルメタデータは、ユーザーに見える返信プレフィックスとしてではなく、信頼されないコンテキストとしてモデルプロンプトに追加されます。モデルがそのエンベロープをコピーして返した場合、OpenClaw は送信返信と今後のリプレイコンテキストから、コピーされたメタデータを取り除きます。
- デフォルトでは (`session.dmScope=main`)、ダイレクトチャットはエージェントのメインセッション (`agent:main:main`) を共有します。
- ギルドチャンネルは分離されたセッションキー (`agent:<agentId>:discord:channel:<channelId>`) です。
- グループ DM はデフォルトで無視されます (`channels.discord.dm.groupEnabled=false`)。
- ネイティブのスラッシュコマンドは分離されたコマンドセッション (`agent:<agentId>:discord:slash:<userId>`) で実行されますが、ルーティング先の会話セッションへ `CommandTargetSessionKey` も引き続き保持します。
- Discord へのテキストのみの Cron/Heartbeat 通知配信では、最終的なアシスタント可視の回答を一度だけ使用します。メディアと構造化コンポーネントペイロードは、エージェントが複数の配信可能なペイロードを出力した場合、複数メッセージのままです。

## フォーラムチャンネル

Discord のフォーラムチャンネルとメディアチャンネルは、スレッド投稿のみ受け付けます。OpenClaw はそれらを作成する方法を 2 つサポートしています。

- フォーラム親 (`channel:<forumId>`) にメッセージを送信して、スレッドを自動作成します。スレッドタイトルには、メッセージの最初の空でない行が使われます。
- `openclaw message thread create` を使ってスレッドを直接作成します。フォーラムチャンネルでは `--message-id` を渡さないでください。

例: フォーラム親に送信してスレッドを作成する

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

例: フォーラムスレッドを明示的に作成する

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

フォーラム親は Discord コンポーネントを受け付けません。コンポーネントが必要な場合は、スレッド自体 (`channel:<threadId>`) に送信してください。

## インタラクティブコンポーネント

OpenClaw はエージェントメッセージ用の Discord コンポーネント v2 コンテナーをサポートしています。`components` ペイロード付きのメッセージツールを使用します。インタラクション結果は通常の受信メッセージとしてエージェントにルーティングされ、既存の Discord `replyToMode` 設定に従います。

サポートされるブロック:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- アクション行では最大 5 個のボタン、または単一のセレクトメニューを使用できます
- セレクトの種類: `string`, `user`, `role`, `mentionable`, `channel`

デフォルトでは、コンポーネントは 1 回限り使用できます。ボタン、セレクト、フォームを期限切れまで複数回使用できるようにするには、`components.reusable=true` を設定します。

ボタンをクリックできるユーザーを制限するには、そのボタンに `allowedUsers` を設定します (Discord ユーザー ID、タグ、または `*`)。設定されている場合、一致しないユーザーには一時的な拒否メッセージが届きます。

`/model` と `/models` スラッシュコマンドは、プロバイダー、モデル、互換ランタイムのドロップダウンに加えて Submit ステップを備えたインタラクティブなモデルピッカーを開きます。`/models add` は非推奨になり、チャットからモデルを登録する代わりに非推奨メッセージを返すようになりました。ピッカーの返信は一時的で、呼び出したユーザーだけが使用できます。

ファイル添付:

- `file` ブロックは添付参照 (`attachment://<filename>`) を指している必要があります
- 添付は `media`/`path`/`filePath` で提供します (単一ファイル)。複数ファイルには `media-gallery` を使用します
- アップロード名を添付参照と一致させる必要がある場合は、`filename` を使って上書きします

モーダルフォーム:

- 最大 5 個のフィールドを持つ `components.modal` を追加します
- フィールドの種類: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw はトリガーボタンを自動的に追加します

例:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM policy">
    `channels.discord.dmPolicy` は DM アクセスを制御します。`channels.discord.allowFrom` は標準の DM 許可リストです。

    - `pairing` (デフォルト)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` に `"*"` を含める必要があります)
    - `disabled`

    DM ポリシーが open でない場合、不明なユーザーはブロックされます (または `pairing` モードではペアリングを促されます)。

    複数アカウントの優先順位:

    - `channels.discord.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 1 つのアカウントでは、`allowFrom` がレガシーの `dm.allowFrom` より優先されます。
    - 名前付きアカウントは、自身の `allowFrom` とレガシーの `dm.allowFrom` が未設定の場合、`channels.discord.allowFrom` を継承します。
    - 名前付きアカウントは `channels.discord.accounts.default.allowFrom` を継承しません。

    レガシーの `channels.discord.dm.policy` と `channels.discord.dm.allowFrom` は、互換性のために引き続き読み取られます。`openclaw doctor --fix` は、アクセスを変更せずに実行できる場合、それらを `dmPolicy` と `allowFrom` に移行します。

    配信用の DM ターゲット形式:

    - `user:<id>`
    - `<@id>` メンション

    通常、チャンネルデフォルトが有効な場合、むき出しの数値 ID はチャンネル ID として解決されますが、アカウントの有効な DM `allowFrom` に列挙された ID は、互換性のためにユーザー DM ターゲットとして扱われます。

  </Tab>

  <Tab title="DM access groups">
    Discord DM は `channels.discord.allowFrom` 内で動的な `accessGroup:<name>` エントリを使用できます。

    アクセスグループ名はメッセージチャンネル全体で共有されます。メンバーが各チャンネルの通常の `allowFrom` 構文で表される静的グループには `type: "message.senders"` を使用し、Discord チャンネルの現在の `ViewChannel` オーディエンスでメンバーシップを動的に定義する必要がある場合は `type: "discord.channelAudience"` を使用します。共有アクセスグループの動作はこちらに記載されています: [アクセスグループ](/ja-JP/channels/access-groups)

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

    Discord テキストチャンネルには個別のメンバーリストはありません。`type: "discord.channelAudience"` はメンバーシップを次のようにモデル化します。DM 送信者が設定済みギルドのメンバーであり、ロールとチャンネルの上書きが適用された後、設定済みチャンネルに対する有効な `ViewChannel` 権限を現在持っていること。

    例: `#maintainers` を閲覧できる全員にボットへの DM を許可し、それ以外の全員には DM を閉じたままにする。

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

    動的エントリと静的エントリを混在させることができます。

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers", "discord:123456789012345678"],
    },
  },
}
```

    ルックアップは失敗時に閉じます。Discord が `Missing Access` を返した場合、メンバールックアップが失敗した場合、またはチャンネルが別のギルドに属している場合、DM 送信者は未承認として扱われます。

    チャンネルオーディエンスアクセスグループを使用する場合は、ボットに対して Discord Developer Portal の **Server Members Intent** を有効にします。DM にはギルドメンバーの状態が含まれないため、OpenClaw は認可時に Discord REST 経由でメンバーを解決します。

  </Tab>

  <Tab title="Guild policy">
    ギルドの処理は `channels.discord.groupPolicy` で制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` が存在する場合のセキュアなベースラインは `allowlist` です。

    `allowlist` の動作:

    - ギルドは `channels.discord.guilds` と一致する必要があります (`id` 推奨、スラッグも可)
    - 任意の送信者許可リスト: `users` (安定した ID を推奨) と `roles` (ロール ID のみ)。どちらかが設定されている場合、送信者は `users` または `roles` に一致すると許可されます
    - 直接的な名前/タグ一致はデフォルトで無効です。緊急互換モードとしてのみ `channels.discord.dangerouslyAllowNameMatching: true` を有効にしてください
    - `users` では名前/タグがサポートされますが、ID の方が安全です。名前/タグエントリが使われている場合、`openclaw security audit` が警告します
    - ギルドに `channels` が設定されている場合、列挙されていないチャンネルは拒否されます
    - ギルドに `channels` ブロックがない場合、その許可リスト入りギルド内のすべてのチャンネルが許可されます

    例:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    `DISCORD_BOT_TOKEN` だけを設定し、`channels.discord` ブロックを作成しない場合、`channels.defaults.groupPolicy` が `open` であっても、ランタイムフォールバックは `groupPolicy="allowlist"` になります (ログに警告が出ます)。

  </Tab>

  <Tab title="Mentions and group DMs">
    ギルドメッセージはデフォルトでメンションゲートされます。

    メンション検出には次が含まれます。

    - 明示的なボットメンション
    - 設定済みメンションパターン (`agents.list[].groupChat.mentionPatterns`、フォールバック `messages.groupChat.mentionPatterns`)
    - サポートされる場合の暗黙的なボットへの返信動作

    Discord への送信メッセージを書く場合は、標準のメンション構文を使用します。ユーザーには `<@USER_ID>`、チャンネルには `<#CHANNEL_ID>`、ロールには `<@&ROLE_ID>` です。レガシーの `<@!USER_ID>` ニックネームメンション形式は使用しないでください。

    `requireMention` はギルド/チャンネルごとに設定されます (`channels.discord.guilds...`)。
    `ignoreOtherMentions` は、ボットではなく別のユーザー/ロールにメンションしているメッセージを任意で破棄します (@everyone/@here は除く)。

    グループ DM:

    - デフォルト: 無視 (`dm.groupEnabled=false`)
    - `dm.groupChannels` による任意の許可リスト (チャンネル ID またはスラッグ)

  </Tab>
</Tabs>

### ロールベースのエージェントルーティング

ロール ID によって Discord ギルドメンバーを別のエージェントにルーティングするには、`bindings[].match.roles` を使用します。ロールベースのバインディングはロール ID のみを受け付け、ピアまたは親ピアのバインディングの後、ギルドのみのバインディングの前に評価されます。バインディングが他の一致フィールドも設定している場合 (たとえば `peer` + `guildId` + `roles`)、設定されたすべてのフィールドが一致する必要があります。

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## ネイティブコマンドとコマンド認可

- `commands.native` のデフォルトは `"auto"` で、Discord では有効です。
- チャンネルごとの上書き: `channels.discord.commands.native`。
- `commands.native=false` は、起動時の Discord スラッシュコマンドの登録とクリーンアップをスキップします。以前に登録されたコマンドは、Discord アプリから削除するまで Discord に表示されたままになる場合があります。
- ネイティブコマンド認証は、通常のメッセージ処理と同じ Discord 許可リスト/ポリシーを使用します。
- コマンドは、認可されていないユーザーにも Discord UI で表示される場合があります。実行時には引き続き OpenClaw 認証が適用され、「not authorized」が返されます。

コマンドカタログと動作については、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

デフォルトのスラッシュコマンド設定:

- `ephemeral: true`

## 機能の詳細

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord はエージェント出力内の返信タグをサポートします:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` で制御します:

    - `off` (デフォルト)
    - `first`
    - `all`
    - `batched`

    注: `off` は暗黙的な返信スレッド化を無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。
    `first` は、そのターンの最初の送信 Discord メッセージに、常に暗黙的なネイティブ返信参照を付けます。
    `batched` は、受信ターンが複数メッセージのデバウンスされたバッチだった場合にのみ、
    Discord の暗黙的なネイティブ返信参照を付けます。これは、すべての単一メッセージターンではなく、
    主に曖昧なバースト状のチャットでネイティブ返信を使いたい場合に便利です。

    メッセージ ID はコンテキスト/履歴に表示されるため、エージェントは特定のメッセージを対象にできます。

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw は、一時メッセージを送信し、テキストが届くたびに編集することで、下書き返信をストリーミングできます。`channels.discord.streaming` は `off` (デフォルト) | `partial` | `block` | `progress` を取ります。`progress` は編集可能なステータス下書きを 1 つ保持し、最終配信までツール進行状況で更新します。`streamMode` はレガシーエイリアスで、自動移行されます。

    複数のボットまたはゲートウェイがアカウントを共有している場合、Discord プレビュー編集はすぐにレート制限に達するため、デフォルトは `off` のままです。

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    - `partial` は、トークンが届くたびに 1 つのプレビューメッセージを編集します。
    - `block` は、下書きサイズのチャンクを出力します (サイズと区切り位置を調整するには `draftChunk` を使い、`textChunkLimit` にクランプされます)。
    - メディア、エラー、明示的な返信の最終メッセージは、保留中のプレビュー編集をキャンセルします。
    - `streaming.preview.toolProgress` (デフォルト `true`) は、ツール/進行状況の更新でプレビューメッセージを再利用するかどうかを制御します。

    プレビューストリーミングはテキストのみです。メディア返信は通常配信にフォールバックします。`block` ストリーミングが明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためプレビューストリームをスキップします。

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    ギルド履歴コンテキスト:

    - `channels.discord.historyLimit` のデフォルトは `20`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効化

    DM 履歴の制御:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    スレッドの動作:

    - Discord スレッドはチャンネルセッションとしてルーティングされ、上書きされない限り親チャンネル設定を継承します。
    - スレッドセッションは、親チャンネルのセッションレベルの `/model` 選択をモデル専用フォールバックとして継承します。スレッドローカルの `/model` 選択は引き続き優先され、トランスクリプト継承が有効でない限り、親トランスクリプト履歴はコピーされません。
    - `channels.discord.thread.inheritParent` (デフォルト `false`) は、新しい自動スレッドを親トランスクリプトからシードするようにします。アカウントごとの上書きは `channels.discord.accounts.<id>.thread.inheritParent` 配下にあります。
    - メッセージツールのリアクションは、`user:<id>` DM ターゲットを解決できます。
    - `guilds.<guild>.channels.<channel>.requireMention: false` は、返信段階のアクティベーションフォールバック中も保持されます。

    チャンネルトピックは**信頼されない**コンテキストとして注入されます。許可リストは、エージェントを起動できるユーザーを制限するものであり、補足コンテキスト全体の編集境界ではありません。

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord は、スレッドをセッションターゲットにバインドできるため、そのスレッド内の後続メッセージは同じセッション (サブエージェントセッションを含む) にルーティングされ続けます。

    コマンド:

    - `/focus <target>` 現在/新規スレッドをサブエージェント/セッションターゲットにバインド
    - `/unfocus` 現在のスレッドバインドを削除
    - `/agents` アクティブな実行とバインド状態を表示
    - `/session idle <duration|off>` フォーカスされたバインドの非アクティブ時の自動フォーカス解除を確認/更新
    - `/session max-age <duration|off>` フォーカスされたバインドのハード最大期間を確認/更新

    設定:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    注:

    - `session.threadBindings.*` はグローバルデフォルトを設定します。
    - `channels.discord.threadBindings.*` は Discord の動作を上書きします。
    - `spawnSessions` は、`sessions_spawn({ thread: true })` と ACP スレッド生成でスレッドを自動作成/バインドするかを制御します。デフォルト: `true`。
    - `defaultSpawnContext` は、スレッドバインドされた生成のネイティブサブエージェントコンテキストを制御します。デフォルト: `"fork"`。
    - 非推奨の `spawnSubagentSessions`/`spawnAcpSessions` キーは、`openclaw doctor --fix` によって移行されます。
    - アカウントでスレッドバインドが無効な場合、`/focus` と関連するスレッドバインド操作は利用できません。

    [サブエージェント](/ja-JP/tools/subagents)、[ACP エージェント](/ja-JP/tools/acp-agents)、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    安定した「常時オン」の ACP ワークスペースには、Discord 会話をターゲットにするトップレベルの型付き ACP バインドを設定します。

    設定パス:

    - `bindings[]` に `type: "acp"` と `match.channel: "discord"` を指定

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
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    注:

    - `/acp spawn codex --bind here` は、現在のチャンネルまたはスレッドをその場でバインドし、以後のメッセージを同じ ACP セッションに保持します。スレッドメッセージは親チャンネルのバインドを継承します。
    - バインドされたチャンネルまたはスレッドでは、`/new` と `/reset` は同じ ACP セッションをその場でリセットします。一時的なスレッドバインドは、有効な間はターゲット解決を上書きできます。
    - `spawnSessions` は、`--thread auto|here` による子スレッドの作成/バインドを制御します。

    バインド動作の詳細については、[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

  </Accordion>

  <Accordion title="Reaction notifications">
    ギルドごとのリアクション通知モード:

    - `off`
    - `own` (デフォルト)
    - `all`
    - `allowlist` (`guilds.<id>.users` を使用)

    リアクションイベントはシステムイベントに変換され、ルーティングされた Discord セッションに添付されます。

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間に確認用の絵文字を送信します。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - エージェント ID 絵文字フォールバック (`agents.list[].identity.emoji`、それ以外は "👀")

    注:

    - Discord は Unicode 絵文字またはカスタム絵文字名を受け付けます。
    - チャンネルまたはアカウントでリアクションを無効にするには `""` を使用します。

  </Accordion>

  <Accordion title="Config writes">
    チャンネル起点の設定書き込みはデフォルトで有効です。

    これは `/config set|unset` フロー (コマンド機能が有効な場合) に影響します。

    無効化:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway proxy">
    Discord Gateway WebSocket トラフィックと起動時の REST 参照 (アプリケーション ID + 許可リスト解決) を、`channels.discord.proxy` で HTTP(S) プロキシ経由にルーティングします。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    アカウントごとの上書き:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="PluralKit support">
    PluralKit 解決を有効にして、プロキシされたメッセージをシステムメンバー ID にマッピングします:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    注:

    - 許可リストでは `pk:<memberId>` を使用できます
    - メンバー表示名は、`channels.discord.dangerouslyAllowNameMatching: true` の場合にのみ、名前/スラッグで照合されます
    - 参照は元のメッセージ ID を使用し、時間枠で制約されます
    - 参照に失敗した場合、`allowBots=true` でない限り、プロキシされたメッセージはボットメッセージとして扱われ、破棄されます

  </Accordion>

  <Accordion title="Outbound mention aliases">
    エージェントが既知の Discord ユーザーに対して決定的な送信メンションを必要とする場合は、`mentionAliases` を使用します。キーは先頭の `@` なしのハンドルで、値は Discord ユーザー ID です。不明なハンドル、`@everyone`、`@here`、Markdown コードスパン内のメンションは変更されません。

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        Vladislava: "123456789012345678",
      },
      accounts: {
        ops: {
          mentionAliases: {
            OpsLead: "234567890123456789",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Presence configuration">
    プレゼンス更新は、ステータスまたはアクティビティフィールドを設定したとき、または自動プレゼンスを有効にしたときに適用されます。

    ステータスのみの例:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    アクティビティの例 (カスタムステータスがデフォルトのアクティビティタイプです):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    ストリーミングの例:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    アクティビティタイプの対応表:

    - 0: プレイ中
    - 1: ストリーミング中 (`activityUrl` が必要)
    - 2: リスニング中
    - 3: 視聴中
    - 4: カスタム (アクティビティテキストをステータス状態として使用します。絵文字は任意です)
    - 5: 競技中

    自動プレゼンスの例 (ランタイム健全性シグナル):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    自動プレゼンスはランタイムの可用性を Discord ステータスにマッピングします: healthy => online、degraded または unknown => idle、exhausted または unavailable => dnd。任意のテキスト上書き:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` プレースホルダーをサポート)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord は DM でボタンベースの承認処理をサポートし、必要に応じて発信元チャンネルに承認プロンプトを投稿できます。

    設定パス:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (任意。可能な場合は `commands.ownerAllowFrom` にフォールバック)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`、デフォルト: `dm`)
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    Discord は、`enabled` が未設定または `"auto"` で、少なくとも 1 つの承認者を `execApprovals.approvers` または `commands.ownerAllowFrom` から解決できる場合に、ネイティブ exec 承認を自動で有効化します。Discord は、チャンネルの `allowFrom`、従来の `dm.allowFrom`、またはダイレクトメッセージの `defaultTo` から exec 承認者を推測しません。Discord をネイティブ承認クライアントとして明示的に無効化するには、`enabled: false` を設定します。

    `/diagnostics` や `/export-trajectory` など、機密性の高い所有者専用グループコマンドでは、OpenClaw は承認プロンプトと最終結果を非公開で送信します。呼び出した所有者に Discord 所有者ルートがある場合は、まず Discord DM を試します。利用できない場合は、Telegram など、`commands.ownerAllowFrom` から最初に利用可能な所有者ルートにフォールバックします。

    `target` が `channel` または `both` の場合、承認プロンプトはチャンネルに表示されます。解決済みの承認者だけがボタンを使用できます。他のユーザーには一時的な拒否が返されます。承認プロンプトにはコマンドテキストが含まれるため、信頼済みチャンネルでのみチャンネル配信を有効にしてください。セッションキーからチャンネル ID を導出できない場合、OpenClaw は DM 配信にフォールバックします。

    Discord は、他のチャットチャンネルで使われる共有承認ボタンも表示します。ネイティブ Discord アダプターは主に、承認者 DM ルーティングとチャンネルファンアウトを追加します。
    それらのボタンが存在する場合、それらが主要な承認 UX です。OpenClaw は、ツール結果がチャット承認を利用できない、または手動承認が唯一の経路だと示す場合にのみ、手動の `/approve` コマンドを含めるべきです。
    Discord ネイティブ承認ランタイムがアクティブでない場合、OpenClaw はローカルの決定的な `/approve <id> <decision>` プロンプトを表示したままにします。ランタイムがアクティブでも、ネイティブカードをどのターゲットにも配信できない場合、OpenClaw は保留中の承認から正確な `/approve` コマンドを含む、同じチャットへのフォールバック通知を送信します。

    Gateway 認証と承認解決は、共有 Gateway クライアント契約に従います（`plugin:` ID は `plugin.approval.resolve` を通じて解決され、その他の ID は `exec.approval.resolve` を通じて解決されます）。承認はデフォルトで 30 分後に期限切れになります。

    [Exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## ツールとアクションゲート

Discord メッセージアクションには、メッセージング、チャンネル管理、モデレーション、プレゼンス、メタデータアクションが含まれます。

主要な例:

- メッセージング: `sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- リアクション: `react`、`reactions`、`emojiList`
- モデレーション: `timeout`、`kick`、`ban`
- プレゼンス: `setPresence`

`event-create` アクションは、スケジュール済みイベントのカバー画像を設定するための任意の `image` パラメーター（URL またはローカルファイルパス）を受け付けます。

アクションゲートは `channels.discord.actions.*` の下にあります。

デフォルトのゲート動作:

| アクショングループ                                                                                                                                                       | デフォルト |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 有効       |
| roles                                                                                                                                                                    | 無効       |
| moderation                                                                                                                                                               | 無効       |
| presence                                                                                                                                                                 | 無効       |

## Components v2 UI

OpenClaw は exec 承認とクロスコンテキストマーカーに Discord components v2 を使用します。Discord メッセージアクションはカスタム UI 用に `components` も受け付けられます（高度。discord ツールでコンポーネントペイロードを構築する必要があります）。一方、従来の `embeds` も引き続き利用できますが、推奨されません。

- `channels.discord.ui.components.accentColor` は、Discord コンポーネントコンテナーで使われるアクセントカラー（hex）を設定します。
- アカウントごとに `channels.discord.accounts.<id>.ui.components.accentColor` で設定します。
- components v2 が存在する場合、`embeds` は無視されます。

例:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## 音声

Discord には 2 つの異なる音声サーフェスがあります。リアルタイムの**音声チャンネル**（継続的な会話）と、**音声メッセージ添付ファイル**（波形プレビュー形式）です。Gateway は両方をサポートします。

### 音声チャンネル

セットアップチェックリスト:

1. Discord Developer Portal で Message Content Intent を有効にします。
2. ロール/ユーザーの許可リストを使う場合は、Server Members Intent を有効にします。
3. `bot` と `applications.commands` スコープでボットを招待します。
4. 対象の音声チャンネルで、Connect、Speak、Send Messages、Read Message History を付与します。
5. ネイティブコマンド（`commands.native` または `channels.discord.commands.native`）を有効にします。
6. `channels.discord.voice` を設定します。

セッションを制御するには `/vc join|leave|status` を使用します。このコマンドはアカウントのデフォルトエージェントを使用し、他の Discord コマンドと同じ許可リストおよびグループポリシールールに従います。

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

自動参加の例:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        tts: {
          provider: "openai",
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

注記:

- `voice.tts` は音声再生に限り `messages.tts` を上書きします。
- `voice.model` は Discord 音声チャンネル応答に使われる LLM だけを上書きします。ルーティングされたエージェントモデルを継承するには未設定のままにします。
- STT は `tools.media.audio` を使用します。`voice.model` は文字起こしに影響しません。
- チャンネルごとの Discord `systemPrompt` 上書きは、その音声チャンネルの音声トランスクリプトターンに適用されます。
- 音声トランスクリプトターンは、Discord `allowFrom`（または `dm.allowFrom`）から所有者ステータスを導出します。所有者でない発話者は、所有者専用ツール（例: `gateway` と `cron`）にアクセスできません。
- Discord 音声はテキスト専用設定ではオプトインです。`channels.discord.voice.enabled=true` を設定する（または既存の `channels.discord.voice` ブロックを維持する）と、`/vc` コマンド、音声ランタイム、`GuildVoiceStates` Gateway Intent が有効になります。
- `channels.discord.intents.voiceStates` は、音声状態 Intent サブスクリプションを明示的に上書きできます。有効な音声有効化状態に Intent を従わせるには未設定のままにします。
- `voice.daveEncryption` と `voice.decryptionFailureTolerance` は `@discordjs/voice` の参加オプションにそのまま渡されます。
- `@discordjs/voice` のデフォルトは、未設定の場合 `daveEncryption=true` と `decryptionFailureTolerance=24` です。
- `voice.connectTimeoutMs` は、`/vc join` と自動参加試行の初回 `@discordjs/voice` Ready 待機を制御します。デフォルト: `30000`。
- `voice.reconnectGraceMs` は、切断された音声セッションが再接続を開始するまで OpenClaw が待機する時間を制御し、その後破棄します。デフォルト: `15000`。
- OpenClaw は受信側の復号失敗も監視し、短時間の間に失敗が繰り返された場合、音声チャンネルを退出して再参加することで自動復旧します。
- 更新後に受信ログで `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` が繰り返し表示される場合は、依存関係レポートとログを収集してください。バンドルされた `@discordjs/voice` 系統には、discord.js issue #11419 をクローズした discord.js PR #11449 の upstream padding 修正が含まれています。

音声チャンネルパイプライン:

- Discord PCM キャプチャは WAV 一時ファイルに変換されます。
- `tools.media.audio` が STT を処理します。例: `openai/gpt-4o-mini-transcribe`。
- トランスクリプトは Discord 入口とルーティングを通じて送信されます。一方、応答 LLM は、Discord 音声が最終 TTS 再生を所有するため、エージェントの `tts` ツールを隠し、返却テキストを求める音声出力ポリシーで実行されます。
- `voice.model` が設定されている場合、この音声チャンネルターンの応答 LLM だけを上書きします。
- `voice.tts` は `messages.tts` にマージされます。結果の音声は参加中のチャンネルで再生されます。

認証情報はコンポーネントごとに解決されます。`voice.model` には LLM ルート認証、`tools.media.audio` には STT 認証、`messages.tts`/`voice.tts` には TTS 認証が使われます。

### 音声メッセージ

Discord 音声メッセージは波形プレビューを表示し、OGG/Opus 音声を必要とします。OpenClaw は波形を自動生成しますが、検査と変換のために Gateway ホスト上の `ffmpeg` と `ffprobe` が必要です。

- **ローカルファイルパス**を指定します（URL は拒否されます）。
- テキスト内容は省略します（Discord は同じペイロード内のテキスト + 音声メッセージを拒否します）。
- どの音声形式も受け付けます。OpenClaw は必要に応じて OGG/Opus に変換します。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="許可されていない Intent を使った、またはボットがギルドメッセージを見られない">

    - Message Content Intent を有効にする
    - ユーザー/メンバー解決に依存する場合は Server Members Intent を有効にする
    - Intent を変更した後に gateway を再起動する

  </Accordion>

  <Accordion title="ギルドメッセージが予期せずブロックされる">

    - `groupPolicy` を確認する
    - `channels.discord.guilds` の下のギルド許可リストを確認する
    - ギルドの `channels` マップが存在する場合、列挙されたチャンネルだけが許可される
    - `requireMention` の動作とメンションパターンを確認する

    有用な確認:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention が false なのにまだブロックされる">
    よくある原因:

    - 一致するギルド/チャンネル許可リストなしで `groupPolicy="allowlist"` を使っている
    - `requireMention` が誤った場所に設定されている（`channels.discord.guilds` またはチャンネルエントリの下である必要があります）
    - 送信者がギルド/チャンネル `users` 許可リストによってブロックされている

  </Accordion>

  <Accordion title="長時間実行される Discord ターンまたは重複返信">

    典型的なログ:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway キューの調整項目:

    - 単一アカウント: `channels.discord.eventQueue.listenerTimeout`
    - 複数アカウント: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - これは Discord Gateway リスナー作業だけを制御し、エージェントターンの存続時間は制御しません

    Discord はキューに入ったエージェントターンに、チャンネル所有のタイムアウトを適用しません。メッセージリスナーは即座に引き渡し、キューに入った Discord 実行は、セッション/ツール/ランタイムのライフサイクルが完了するか作業を中止するまで、セッションごとの順序を保持します。

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway メタデータ検索タイムアウト警告">
    OpenClaw は接続前に Discord `/gateway/bot` メタデータを取得します。一時的な失敗時は Discord のデフォルト Gateway URL にフォールバックし、ログではレート制限されます。

    メタデータタイムアウトの調整項目:

    - 単一アカウント: `channels.discord.gatewayInfoTimeoutMs`
    - 複数アカウント: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 設定が未指定の場合の env フォールバック: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - デフォルト: `30000`（30 秒）、最大: `120000`

  </Accordion>

  <Accordion title="Gateway READY タイムアウトによる再起動">
    OpenClaw は起動時およびランタイム再接続後に、Discord の Gateway `READY` イベントを待機します。起動時のずらし実行を使う複数アカウント構成では、デフォルトより長い起動時 READY ウィンドウが必要になる場合があります。

    READY タイムアウトの設定項目:

    - 起動時の単一アカウント: `channels.discord.gatewayReadyTimeoutMs`
    - 起動時の複数アカウント: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 設定が未設定の場合の起動時 env フォールバック: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 起動時のデフォルト: `15000` (15 秒)、最大: `120000`
    - ランタイムの単一アカウント: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - ランタイムの複数アカウント: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 設定が未設定の場合のランタイム env フォールバック: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - ランタイムのデフォルト: `30000` (30 秒)、最大: `120000`

  </Accordion>

  <Accordion title="権限監査の不一致">
    `channels status --probe` の権限チェックは、数値のチャンネル ID でのみ機能します。

    slug キーを使用している場合でもランタイムの照合は機能することがありますが、probe は権限を完全には検証できません。

  </Accordion>

  <Accordion title="DM とペアリングの問題">

    - DM 無効: `channels.discord.dm.enabled=false`
    - DM ポリシー無効: `channels.discord.dmPolicy="disabled"` (レガシー: `channels.discord.dm.policy`)
    - `pairing` モードでペアリング承認待ち

  </Accordion>

  <Accordion title="ボット間ループ">
    デフォルトでは、ボットが作成したメッセージは無視されます。

    `channels.discord.allowBots=true` を設定する場合は、ループ動作を避けるために厳密なメンションと許可リストのルールを使用してください。
    ボットにメンションしているボットメッセージのみを受け入れるには、`channels.discord.allowBots="mentions"` を推奨します。

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write "@Mantis" and send a real Discord mention.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="音声 STT が DecryptionFailed(...) で失われる">

    - Discord 音声受信の復旧ロジックが存在するように、OpenClaw を最新に保つ (`openclaw update`)
    - `channels.discord.voice.daveEncryption=true` (デフォルト) を確認する
    - `channels.discord.voice.decryptionFailureTolerance=24` (アップストリームのデフォルト) から始め、必要な場合にのみ調整する
    - ログで次を確認する:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 自動再参加後も失敗が続く場合は、ログを収集し、[discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) と [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) のアップストリーム DAVE 受信履歴と比較する

  </Accordion>
</AccordionGroup>

## 設定リファレンス

主要リファレンス: [設定リファレンス - Discord](/ja-JP/gateway/config-channels#discord)。

<Accordion title="重要度の高い Discord フィールド">

- 起動/認証: `enabled`, `token`, `accounts.*`, `allowBots`
- ポリシー: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- コマンド: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- イベントキュー: `eventQueue.listenerTimeout` (リスナー予算), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- 返信/履歴: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 配信: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- ストリーミング: `streaming` (レガシーエイリアス: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- メディア/再試行: `mediaMaxMb` (送信 Discord アップロードを制限、デフォルト `100MB`), `retry`
- アクション: `actions.*`
- プレゼンス: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- 機能: `threadBindings`, トップレベル `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## 安全性と運用

- ボットトークンはシークレットとして扱う (管理された環境では `DISCORD_BOT_TOKEN` を推奨)。
- 最小権限の Discord 権限を付与する。
- コマンドのデプロイ/状態が古い場合は、gateway を再起動し、`openclaw channels status --probe` で再確認する。

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Discord ユーザーを gateway にペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループチャットと許可リストの動作。
  </Card>
  <Card title="チャンネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントへルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと堅牢化。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    guild とチャンネルをエージェントにマッピングします。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作。
  </Card>
</CardGroup>
