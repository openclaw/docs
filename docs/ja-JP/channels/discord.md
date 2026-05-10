---
read_when:
    - Discord チャンネル機能に取り組む
summary: Discord ボットのサポート状況、機能、設定
title: Discord
x-i18n:
    generated_at: "2026-05-10T19:20:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 121b0b46bfb0d438f6ebfba4c93410c2ecfe8f99aa257e362b8767bf0aac27ce
    source_path: channels/discord.md
    workflow: 16
---

公式 Discord gateway 経由で、DM とギルドチャンネルに対応しています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Discord の DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブなコマンド動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復フロー。
  </Card>
</CardGroup>

## クイックセットアップ

bot 付きの新しいアプリケーションを作成し、その bot をサーバーに追加して、OpenClaw にペアリングする必要があります。bot は自分のプライベートサーバーに追加することをおすすめします。まだサーバーがない場合は、[先に作成してください](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends** を選択）。

<Steps>
  <Step title="Discord アプリケーションと bot を作成する">
    [Discord Developer Portal](https://discord.com/developers/applications) に移動し、**New Application** をクリックします。「OpenClaw」のような名前を付けます。

    サイドバーの **Bot** をクリックします。**Username** を、自分の OpenClaw エージェントに付けたい名前に設定します。

  </Step>

  <Step title="特権インテントを有効にする">
    引き続き **Bot** ページで、**Privileged Gateway Intents** まで下にスクロールし、次を有効にします。

    - **Message Content Intent**（必須）
    - **Server Members Intent**（推奨。ロールの許可リストと名前から ID への照合に必須）
    - **Presence Intent**（任意。プレゼンス更新にのみ必要）

  </Step>

  <Step title="bot トークンをコピーする">
    **Bot** ページの上部に戻り、**Reset Token** をクリックします。

    <Note>
    名前に反して、これは最初のトークンを生成します。「reset」されるものはありません。
    </Note>

    トークンをコピーして保存します。これが **Bot Token** で、すぐに必要になります。

  </Step>

  <Step title="招待 URL を生成して bot をサーバーに追加する">
    サイドバーの **OAuth2** をクリックします。bot をサーバーに追加するための適切な権限を持つ招待 URL を生成します。

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

    これは通常のテキストチャンネル向けの基本セットです。フォーラムやメディアチャンネルのワークフローなど、スレッドを作成または継続する Discord スレッドに投稿する予定がある場合は、**Send Messages in Threads** も有効にしてください。
    下部に生成された URL をコピーし、ブラウザに貼り付け、サーバーを選択して **Continue** をクリックして接続します。これで Discord サーバーに bot が表示されるはずです。

  </Step>

  <Step title="Developer Mode を有効にして ID を収集する">
    Discord アプリに戻り、内部 ID をコピーできるように Developer Mode を有効にする必要があります。

    1. **User Settings**（アバター横の歯車アイコン）→ **Advanced** → **Developer Mode** をオンにする
    2. サイドバーの **server icon** を右クリック → **Copy Server ID**
    3. 自分の **own avatar** を右クリック → **Copy User ID**

    **Server ID** と **User ID** を Bot Token と一緒に保存します。次のステップで 3 つすべてを OpenClaw に送信します。

  </Step>

  <Step title="サーバーメンバーからの DM を許可する">
    ペアリングを機能させるには、Discord が bot から自分への DM を許可している必要があります。**server icon** を右クリック → **Privacy Settings** → **Direct Messages** をオンにします。

    これにより、サーバーメンバー（bot を含む）が自分に DM を送信できます。OpenClaw で Discord DM を使いたい場合は、この設定を有効のままにしてください。ギルドチャンネルだけを使う予定の場合は、ペアリング後に DM を無効にできます。

  </Step>

  <Step title="bot トークンを安全に設定する（チャットで送信しない）">
    Discord bot トークンは秘密情報（パスワードのようなもの）です。エージェントにメッセージを送る前に、OpenClaw を実行しているマシンで設定します。

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
    ホストが Discord の起動時アプリケーション検索でブロックまたはレート制限されている場合は、Developer Portal から Discord application/client ID を設定すると、起動時にその REST 呼び出しをスキップできます。デフォルトアカウントには `channels.discord.applicationId` を使用し、複数の Discord bot を実行する場合は `channels.discord.accounts.<accountId>.applicationId` を使用します。

  </Step>

  <Step title="OpenClaw を設定してペアリングする">

    <Tabs>
      <Tab title="エージェントに依頼する">
        既存の任意のチャンネル（例: Telegram）で OpenClaw エージェントとチャットし、伝えます。Discord が最初のチャンネルの場合は、代わりに CLI / config タブを使用してください。

        > 「Discord bot トークンはすでに config に設定しました。User ID `<user_id>` と Server ID `<server_id>` で Discord セットアップを完了してください。」
      </Tab>
      <Tab title="CLI / config">
        ファイルベースの config を使いたい場合は、次を設定します。

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

        スクリプトまたはリモートセットアップの場合は、同じ JSON5 ブロックを `openclaw config patch --file ./discord.patch.json5 --dry-run` で書き込み、その後 `--dry-run` なしで再実行します。プレーンテキストの `token` 値がサポートされています。SecretRef 値も、env/file/exec プロバイダー全体で `channels.discord.token` に対応しています。[Secrets Management](/ja-JP/gateway/secrets) を参照してください。

        複数の Discord bot を使う場合は、各 bot トークンと application ID をそれぞれのアカウント配下に置きます。トップレベルの `channels.discord.applicationId` はアカウントに継承されるため、すべてのアカウントが同じ application ID を使う場合にのみ、そこに設定してください。

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
    gateway が実行されるまで待ってから、Discord で bot に DM します。ペアリングコードが返されます。

    <Tabs>
      <Tab title="エージェントに依頼する">
        既存のチャンネルでペアリングコードをエージェントに送信します。

        > 「この Discord ペアリングコードを承認してください: `<CODE>`」
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    ペアリングコードは 1 時間で期限切れになります。

    これで、Discord の DM 経由でエージェントとチャットできるようになるはずです。

  </Step>
</Steps>

<Note>
トークン解決はアカウントを認識します。Config のトークン値が env フォールバックより優先されます。`DISCORD_BOT_TOKEN` はデフォルトアカウントにのみ使用されます。
有効な 2 つの Discord アカウントが同じ bot トークンに解決される場合、OpenClaw はそのトークンに対して 1 つの gateway モニターだけを開始します。config 由来のトークンはデフォルトの env フォールバックより優先されます。それ以外の場合、最初の有効なアカウントが優先され、重複アカウントは無効として報告されます。
高度な送信呼び出し（message ツール/チャンネルアクション）では、明示的な呼び出しごとの `token` がその呼び出しに使用されます。これは送信および read/probe スタイルのアクション（例: read/search/fetch/thread/pins/permissions）に適用されます。アカウントポリシー/リトライ設定は引き続き、アクティブなランタイムスナップショット内の選択されたアカウントから取得されます。
</Note>

## 推奨: ギルドワークスペースをセットアップする

DM が動作したら、Discord サーバーを完全なワークスペースとしてセットアップできます。各チャンネルには独自のコンテキストを持つ独自のエージェントセッションが割り当てられます。これは、自分と bot だけがいるプライベートサーバーにおすすめです。

<Steps>
  <Step title="サーバーをギルド許可リストに追加する">
    これにより、エージェントは DM だけでなく、サーバー上の任意のチャンネルで応答できるようになります。

    <Tabs>
      <Tab title="エージェントに依頼する">
        > 「Discord Server ID `<server_id>` をギルド許可リストに追加してください」
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
    デフォルトでは、エージェントはギルドチャンネルで @mention された場合にのみ応答します。プライベートサーバーでは、おそらくすべてのメッセージに応答させたいでしょう。

    ギルドチャンネルでは、通常のアシスタントの最終返信はデフォルトで非公開のままです。表示される Discord 出力は `message` ツールで明示的に送信する必要があるため、エージェントはデフォルトでは待機し、チャンネル返信が有用だと判断した場合にのみ投稿できます。

    つまり、選択されたモデルは確実にツールを呼び出せる必要があります。Discord に typing が表示され、ログにはトークン使用量が表示されるのに投稿メッセージがない場合は、セッションログで `didSendViaMessagingTool: false` が付いたアシスタントテキストを確認してください。これは、モデルが `message(action=send)` を呼び出す代わりに、非公開の最終回答を生成したことを意味します。より強力なツール呼び出しモデルに切り替えるか、下の config を使って従来の自動最終返信を復元してください。

    <Tabs>
      <Tab title="エージェントに依頼する">
        > 「このサーバーで @mentioned されなくてもエージェントが応答できるようにしてください」
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

  <Step title="ギルドチャンネルでのメモリを計画する">
    デフォルトでは、長期メモリ（MEMORY.md）は DM セッションでのみ読み込まれます。ギルドチャンネルでは MEMORY.md は自動読み込みされません。

    <Tabs>
      <Tab title="エージェントに依頼する">
        > 「Discord チャンネルで質問したとき、MEMORY.md から長期コンテキストが必要な場合は memory_search または memory_get を使用してください。」
      </Tab>
      <Tab title="手動">
        すべてのチャンネルで共有コンテキストが必要な場合は、安定した指示を `AGENTS.md` または `USER.md`（すべてのセッションに注入されます）に入れます。長期メモは `MEMORY.md` に保持し、必要に応じてメモリツールでアクセスします。
      </Tab>
    </Tabs>

  </Step>
</Steps>

これで Discord サーバーにいくつかチャンネルを作成し、チャットを開始できます。エージェントはチャンネル名を確認でき、各チャンネルには独立した専用セッションが割り当てられます。そのため、`#coding`、`#home`、`#research` など、ワークフローに合うものを設定できます。

## ランタイムモデル

- Gateway が Discord 接続を所有します。
- 返信ルーティングは決定的です。Discord の受信返信は Discord に返ります。
- Discord のギルド/チャンネルメタデータは、ユーザーに見える返信プレフィックスとしてではなく、信頼されない
  コンテキストとしてモデルプロンプトに追加されます。モデルがそのエンベロープを
  コピーして返した場合、OpenClaw は送信返信と
  将来のリプレイコンテキストから、コピーされたメタデータを取り除きます。
- デフォルトでは (`session.dmScope=main`)、ダイレクトチャットはエージェントのメインセッション (`agent:main:main`) を共有します。
- ギルドチャンネルは分離されたセッションキーです (`agent:<agentId>:discord:channel:<channelId>`)。
- グループ DM はデフォルトで無視されます (`channels.discord.dm.groupEnabled=false`)。
- ネイティブのスラッシュコマンドは分離されたコマンドセッション (`agent:<agentId>:discord:slash:<userId>`) で実行されますが、ルーティング先の会話セッションへの `CommandTargetSessionKey` は引き続き保持します。
- Discord へのテキストのみの cron/heartbeat 通知配信では、最終的な
  アシスタント可視の回答を一度だけ使います。メディアと構造化コンポーネントのペイロードは、
  エージェントが複数の配信可能ペイロードを出力する場合、複数メッセージのままです。

## フォーラムチャンネル

Discord のフォーラムチャンネルとメディアチャンネルはスレッド投稿のみを受け付けます。OpenClaw はそれらを作成する方法を 2 つサポートします。

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

OpenClaw はエージェントメッセージ用に Discord components v2 コンテナをサポートします。`components` ペイロードとともにメッセージツールを使ってください。インタラクション結果は通常の受信メッセージとしてエージェントにルーティングされ、既存の Discord `replyToMode` 設定に従います。

サポートされるブロック:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- アクション行では最大 5 個のボタン、または単一のセレクトメニューを使用できます
- セレクトの種類: `string`, `user`, `role`, `mentionable`, `channel`

デフォルトでは、コンポーネントは 1 回だけ使用できます。ボタン、セレクト、フォームを期限切れになるまで複数回使用できるようにするには、`components.reusable=true` を設定します。

ボタンをクリックできるユーザーを制限するには、そのボタンに `allowedUsers` を設定します (Discord ユーザー ID、タグ、または `*`)。設定されている場合、一致しないユーザーには一時的な拒否が送信されます。

`/model` と `/models` スラッシュコマンドは、プロバイダー、モデル、互換ランタイムのドロップダウンと送信ステップを備えたインタラクティブなモデルピッカーを開きます。`/models add` は非推奨であり、チャットからモデルを登録する代わりに非推奨メッセージを返すようになりました。ピッカーの返信は一時的であり、呼び出したユーザーだけが使用できます。Discord のセレクトメニューは 25 個のオプションに制限されているため、`openai-codex` や `vllm` などの選択されたプロバイダーについてのみ、動的に検出されたモデルをピッカーに表示したい場合は、`agents.defaults.models` に `provider/*` エントリを追加してください。

ファイル添付:

- `file` ブロックは添付参照 (`attachment://<filename>`) を指す必要があります
- `media`/`path`/`filePath` (単一ファイル) で添付を提供します。複数ファイルには `media-gallery` を使ってください
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
  <Tab title="DM ポリシー">
    `channels.discord.dmPolicy` は DM アクセスを制御します。`channels.discord.allowFrom` は正規の DM 許可リストです。

    - `pairing` (デフォルト)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` に `"*"` が含まれている必要があります)
    - `disabled`

    DM ポリシーが open でない場合、不明なユーザーはブロックされます (または `pairing` モードではペアリングを求められます)。

    複数アカウントの優先順位:

    - `channels.discord.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 1 つのアカウントでは、`allowFrom` がレガシーの `dm.allowFrom` より優先されます。
    - 名前付きアカウントは、自身の `allowFrom` とレガシーの `dm.allowFrom` が未設定の場合、`channels.discord.allowFrom` を継承します。
    - 名前付きアカウントは `channels.discord.accounts.default.allowFrom` を継承しません。

    レガシーの `channels.discord.dm.policy` と `channels.discord.dm.allowFrom` は互換性のため引き続き読み取られます。アクセスを変更せずに実行できる場合、`openclaw doctor --fix` はそれらを `dmPolicy` と `allowFrom` に移行します。

    配信用の DM ターゲット形式:

    - `user:<id>`
    - `<@id>` メンション

    チャンネルのデフォルトが有効な場合、裸の数値 ID は通常チャンネル ID として解決されますが、アカウントの有効な DM `allowFrom` に記載されている ID は、互換性のためユーザー DM ターゲットとして扱われます。

  </Tab>

  <Tab title="アクセスグループ">
    Discord DM とテキストコマンド認可では、`channels.discord.allowFrom` の動的な `accessGroup:<name>` エントリを使用できます。

    アクセスグループ名はメッセージチャンネル間で共有されます。メンバーを各チャンネルの通常の `allowFrom` 構文で表す静的グループには `type: "message.senders"` を使い、Discord チャンネルの現在の `ViewChannel` オーディエンスでメンバーシップを動的に定義する必要がある場合は `type: "discord.channelAudience"` を使います。共有アクセスグループの動作はこちらに記載されています: [アクセスグループ](/ja-JP/channels/access-groups)。

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

    Discord テキストチャンネルには別個のメンバーリストはありません。`type: "discord.channelAudience"` はメンバーシップを次のようにモデル化します。DM 送信者は設定されたギルドのメンバーであり、ロールとチャンネルの上書きが適用された後、設定されたチャンネルに対して現在有効な `ViewChannel` 権限を持っています。

    例: それ以外の全員には DM を閉じたまま、`#maintainers` を閲覧できるすべてのユーザーにボットへの DM を許可する。

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

    ルックアップは失敗時に閉じます。Discord が `Missing Access` を返す、メンバールックアップが失敗する、またはチャンネルが別のギルドに属している場合、DM 送信者は未認可として扱われます。

    チャンネルオーディエンスのアクセスグループを使用する場合は、ボットに対して Discord Developer Portal の **Server Members Intent** を有効にしてください。DM にはギルドメンバー状態が含まれないため、OpenClaw は認可時に Discord REST を通じてメンバーを解決します。

  </Tab>

  <Tab title="ギルドポリシー">
    ギルド処理は `channels.discord.groupPolicy` によって制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` が存在する場合のセキュアなベースラインは `allowlist` です。

    `allowlist` の動作:

    - ギルドは `channels.discord.guilds` と一致する必要があります (`id` 推奨、slug も可)
    - 任意の送信者許可リスト: `users` (安定した ID 推奨) と `roles` (ロール ID のみ)。いずれかが設定されている場合、送信者は `users` または `roles` に一致すると許可されます
    - 直接の名前/タグ一致はデフォルトで無効です。非常時の互換モードとしてのみ `channels.discord.dangerouslyAllowNameMatching: true` を有効にしてください
    - `users` では名前/タグがサポートされますが、ID の方が安全です。名前/タグのエントリが使われている場合、`openclaw security audit` は警告します
    - ギルドに `channels` が設定されている場合、リストにないチャンネルは拒否されます
    - ギルドに `channels` ブロックがない場合、その許可リスト済みギルド内のすべてのチャンネルが許可されます

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

    `DISCORD_BOT_TOKEN` だけを設定し、`channels.discord` ブロックを作成しない場合、実行時フォールバックは `groupPolicy="allowlist"` です (ログに警告が出ます)。これは `channels.defaults.groupPolicy` が `open` の場合でも同じです。

  </Tab>

  <Tab title="メンションとグループ DM">
    ギルドメッセージはデフォルトでメンションゲートされます。

    メンション検出には次が含まれます。

    - 明示的なボットメンション
    - 設定されたメンションパターン (`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`)
    - サポートされる場合の暗黙的なボットへの返信動作

    Discord の送信メッセージを書く場合は、正規のメンション構文を使ってください。ユーザーには `<@USER_ID>`、チャンネルには `<#CHANNEL_ID>`、ロールには `<@&ROLE_ID>` です。レガシーの `<@!USER_ID>` ニックネームメンション形式は使わないでください。

    `requireMention` はギルド/チャンネルごとに設定されます (`channels.discord.guilds...`)。
    `ignoreOtherMentions` は任意で、ボットではなく別のユーザー/ロールにメンションしているメッセージをドロップします (@everyone/@here を除く)。

    グループ DM:

    - デフォルト: 無視されます (`dm.groupEnabled=false`)
    - 任意の許可リストは `dm.groupChannels` (チャンネル ID または slug) で指定します

  </Tab>
</Tabs>

### ロールベースのエージェントルーティング

Discord ギルドメンバーをロール ID によって別のエージェントへルーティングするには、`bindings[].match.roles` を使います。ロールベースのバインディングはロール ID のみを受け付け、ピアまたは親ピアのバインディングの後、ギルドのみのバインディングの前に評価されます。バインディングに他の一致フィールドも設定されている場合 (たとえば `peer` + `guildId` + `roles`)、設定されたすべてのフィールドが一致する必要があります。

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

## ネイティブコマンドとコマンド認証

- `commands.native` のデフォルトは `"auto"` で、Discord では有効です。
- チャンネル単位のオーバーライド: `channels.discord.commands.native`。
- `commands.native=false` は、起動時の Discord スラッシュコマンドの登録とクリーンアップをスキップします。以前に登録されたコマンドは、Discord アプリから削除するまで Discord 内で表示され続ける場合があります。
- ネイティブコマンド認証は、通常のメッセージ処理と同じ Discord の許可リスト/ポリシーを使用します。
- 権限のないユーザーにも Discord UI でコマンドが表示される場合がありますが、実行時には引き続き OpenClaw 認証が適用され、「not authorized」が返されます。

コマンドカタログと動作については、[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

デフォルトのスラッシュコマンド設定:

- `ephemeral: true`

## 機能の詳細

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord はエージェント出力内の返信タグをサポートします。

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` で制御されます。

    - `off` (デフォルト)
    - `first`
    - `all`
    - `batched`

    注: `off` は暗黙的な返信スレッド化を無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。
    `first` は、そのターンの最初の送信 Discord メッセージに、暗黙的なネイティブ返信参照を常に添付します。
    `batched` は、受信ターンが複数メッセージのデバウンス済みバッチだった場合にのみ、
    Discord の暗黙的なネイティブ返信参照を添付します。これは、
    すべての単一メッセージターンではなく、主に曖昧な短時間連投チャットでネイティブ返信を使いたい場合に便利です。

    メッセージ ID はコンテキスト/履歴に表示されるため、エージェントは特定のメッセージを対象にできます。

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw は、一時メッセージを送信し、テキストの到着に合わせて編集することで、下書き返信をストリーミングできます。`channels.discord.streaming` は `off` | `partial` | `block` | `progress` (デフォルト) を取ります。`progress` は編集可能なステータス下書きを 1 つ維持し、最終配信までツール進捗で更新します。共有の開始ラベルは流れる 1 行なので、十分な作業内容が表示されると他と同じようにスクロールして消えます。`streamMode` はレガシーのランタイムエイリアスです。永続化済み設定を正規キーに書き換えるには、`openclaw doctor --fix` を実行します。

    Discord プレビュー編集を無効にするには、`channels.discord.streaming.mode` を `off` に設定します。Discord ブロックストリーミングが明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためにプレビューストリームをスキップします。

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
        },
      },
    },
  },
}
```

    - `partial` は、トークンの到着に合わせて単一のプレビューメッセージを編集します。
    - `block` は下書きサイズのチャンクを出力します (サイズとブレークポイントの調整には `draftChunk` を使用し、`textChunkLimit` にクランプされます)。
    - メディア、エラー、明示的返信の最終出力は、保留中のプレビュー編集をキャンセルします。
    - `streaming.preview.toolProgress` (デフォルト `true`) は、ツール/進捗更新でプレビューメッセージを再利用するかを制御します。
    - ツール/進捗行は、利用可能な場合にコンパクトな絵文字 + タイトル + 詳細として表示されます。例: `🛠️ Bash: run tests` または `🔎 Web Search: for "query"`。
    - `streaming.preview.commandText` / `streaming.progress.commandText` は、コンパクトな進捗行のコマンド/実行詳細を制御します: `raw` (デフォルト) または `status` (ツールラベルのみ)。

    コンパクトな進捗行を維持しながら、生のコマンド/実行テキストを非表示にする:

    ```json
    {
      "channels": {
        "discord": {
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

    プレビューストリーミングはテキストのみです。メディア返信は通常配信にフォールバックします。`block` ストリーミングが明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためにプレビューストリームをスキップします。

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    ギルド履歴コンテキスト:

    - `channels.discord.historyLimit` のデフォルトは `20`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効化

    DM 履歴制御:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    スレッド動作:

    - Discord スレッドはチャンネルセッションとしてルーティングされ、オーバーライドされない限り親チャンネル設定を継承します。
    - スレッドセッションは、モデル専用フォールバックとして親チャンネルのセッションレベルの `/model` 選択を継承します。スレッドローカルの `/model` 選択は引き続き優先され、トランスクリプト継承が有効でない限り親トランスクリプト履歴はコピーされません。
    - `channels.discord.thread.inheritParent` (デフォルト `false`) は、新しい自動スレッドを親トランスクリプトからシードするようにします。アカウント単位のオーバーライドは `channels.discord.accounts.<id>.thread.inheritParent` 配下にあります。
    - メッセージツールのリアクションは `user:<id>` DM ターゲットを解決できます。
    - `guilds.<guild>.channels.<channel>.requireMention: false` は、返信段階のアクティベーションフォールバック中も保持されます。

    チャンネルトピックは**信頼されない**コンテキストとして注入されます。許可リストは誰がエージェントをトリガーできるかを制御するものであり、完全な補足コンテキストの秘匿境界ではありません。

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord はスレッドをセッションターゲットにバインドできるため、そのスレッド内の後続メッセージは同じセッション (サブエージェントセッションを含む) にルーティングされ続けます。

    コマンド:

    - `/focus <target>` 現在/新規スレッドをサブエージェント/セッションターゲットにバインド
    - `/unfocus` 現在のスレッドバインディングを削除
    - `/agents` アクティブな実行とバインディング状態を表示
    - `/session idle <duration|off>` フォーカス済みバインディングの非アクティブ時自動フォーカス解除を確認/更新
    - `/session max-age <duration|off>` フォーカス済みバインディングのハード最大期間を確認/更新

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
    - `channels.discord.threadBindings.*` は Discord の動作をオーバーライドします。
    - `spawnSessions` は `sessions_spawn({ thread: true })` と ACP スレッド spawn に対するスレッドの自動作成/バインドを制御します。デフォルト: `true`。
    - `defaultSpawnContext` は、スレッドバインド spawn のネイティブサブエージェントコンテキストを制御します。デフォルト: `"fork"`。
    - 非推奨の `spawnSubagentSessions`/`spawnAcpSessions` キーは `openclaw doctor --fix` によって移行されます。
    - アカウントでスレッドバインディングが無効な場合、`/focus` と関連するスレッドバインディング操作は利用できません。

    [サブエージェント](/ja-JP/tools/subagents)、[ACP エージェント](/ja-JP/tools/acp-agents)、[設定リファレンス](/ja-JP/gateway/configuration-reference) を参照してください。

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    安定した「常時オン」の ACP ワークスペースには、Discord 会話を対象にするトップレベルの型付き ACP バインディングを設定します。

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

    - `/acp spawn codex --bind here` は、現在のチャンネルまたはスレッドをその場でバインドし、以降のメッセージを同じ ACP セッションに維持します。スレッドメッセージは親チャンネルのバインディングを継承します。
    - バインド済みチャンネルまたはスレッドでは、`/new` と `/reset` は同じ ACP セッションをその場でリセットします。一時的なスレッドバインディングは、アクティブな間ターゲット解決をオーバーライドできます。
    - `spawnSessions` は `--thread auto|here` による子スレッドの作成/バインドを制御します。

    バインディング動作の詳細については、[ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

  </Accordion>

  <Accordion title="Reaction notifications">
    ギルド単位のリアクション通知モード:

    - `off`
    - `own` (デフォルト)
    - `all`
    - `allowlist` (`guilds.<id>.users` を使用)

    リアクションイベントはシステムイベントに変換され、ルーティングされた Discord セッションに添付されます。

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間に確認応答の絵文字を送信します。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - エージェント ID 絵文字フォールバック (`agents.list[].identity.emoji`、なければ「👀」)

    注:

    - Discord は Unicode 絵文字またはカスタム絵文字名を受け付けます。
    - チャンネルまたはアカウントでリアクションを無効にするには `""` を使用します。

  </Accordion>

  <Accordion title="Config writes">
    チャンネルから開始される設定書き込みはデフォルトで有効です。

    これは `/config set|unset` フローに影響します (コマンド機能が有効な場合)。

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
    `channels.discord.proxy` を使用して、Discord Gateway WebSocket トラフィックと起動時の REST ルックアップ (アプリケーション ID + 許可リスト解決) を HTTP(S) プロキシ経由でルーティングします。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    アカウント単位のオーバーライド:

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
    PluralKit 解決を有効にして、プロキシされたメッセージをシステムメンバー ID にマップします。

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
    - メンバー表示名は、`channels.discord.dangerouslyAllowNameMatching: true` の場合にのみ名前/スラッグで照合されます
    - ルックアップは元のメッセージ ID を使用し、時間窓で制限されます
    - ルックアップに失敗した場合、プロキシされたメッセージは bot メッセージとして扱われ、`allowBots=true` でない限り破棄されます

  </Accordion>

  <Accordion title="Outbound mention aliases">
    エージェントが既知の Discord ユーザーに対して決定的な送信メンションを必要とする場合は、`mentionAliases` を使用します。キーは先頭の `@` を含まないハンドル、値は Discord ユーザー ID です。不明なハンドル、`@everyone`、`@here`、Markdown コードスパン内のメンションは変更されません。

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
    プレゼンス更新は、ステータスまたはアクティビティフィールドを設定した場合、または自動プレゼンスを有効にした場合に適用されます。

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

    アクティビティタイプマップ:

    - 0: プレイ中
    - 1: ストリーミング中（`activityUrl` が必要）
    - 2: 聞いています
    - 3: 視聴中
    - 4: カスタム（アクティビティテキストをステータス状態として使用。絵文字は任意）
    - 5: 競争中

    自動プレゼンスの例（ランタイムのヘルスシグナル）:

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

    自動プレゼンスはランタイムの可用性を Discord ステータスにマッピングします: healthy => online、degraded または unknown => idle、exhausted または unavailable => dnd。任意のテキストオーバーライド:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（`{reason}` プレースホルダーをサポート）

  </Accordion>

  <Accordion title="Discord での承認">
    Discord は DM でボタンベースの承認処理をサポートし、必要に応じて発信元チャンネルに承認プロンプトを投稿できます。

    設定パス:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（任意。可能な場合は `commands.ownerAllowFrom` にフォールバック）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    `enabled` が未設定または `"auto"` で、少なくとも 1 人の承認者を `execApprovals.approvers` または `commands.ownerAllowFrom` から解決できる場合、Discord はネイティブの exec 承認を自動的に有効化します。Discord はチャンネルの `allowFrom`、レガシーの `dm.allowFrom`、またはダイレクトメッセージの `defaultTo` から exec 承認者を推測しません。Discord をネイティブ承認クライアントとして明示的に無効化するには、`enabled: false` を設定します。

    `/diagnostics` や `/export-trajectory` などの機密性の高いオーナー専用グループコマンドでは、OpenClaw は承認プロンプトと最終結果を非公開で送信します。呼び出したオーナーに Discord オーナールートがある場合は、まず Discord DM を試行します。それが利用できない場合は、Telegram など、`commands.ownerAllowFrom` で利用可能な最初のオーナールートにフォールバックします。

    `target` が `channel` または `both` の場合、承認プロンプトはチャンネルに表示されます。解決済みの承認者だけがボタンを使用できます。他のユーザーには一時的な拒否が表示されます。承認プロンプトにはコマンドテキストが含まれるため、信頼できるチャンネルでのみチャンネル配信を有効にしてください。セッションキーからチャンネル ID を導出できない場合、OpenClaw は DM 配信にフォールバックします。

    Discord は他のチャットチャンネルで使われる共有承認ボタンもレンダリングします。ネイティブ Discord アダプターは主に、承認者への DM ルーティングとチャンネルへのファンアウトを追加します。
    これらのボタンが存在する場合、それらが主要な承認 UX です。OpenClaw は、
    ツール結果がチャット承認を利用できない、または手動承認が唯一の経路だと示す場合にのみ、
    手動の `/approve` コマンドを含めるべきです。
    Discord のネイティブ承認ランタイムがアクティブでない場合、OpenClaw は
    ローカルで決定的な `/approve <id> <decision>` プロンプトを表示したままにします。
    ランタイムがアクティブでも、どのターゲットにもネイティブカードを配信できない場合、
    OpenClaw は保留中の承認にある正確な `/approve`
    コマンドを含む、同じチャット内のフォールバック通知を送信します。

    Gateway 認証と承認解決は、共有 Gateway クライアント契約に従います（`plugin:` ID は `plugin.approval.resolve` を通じて解決し、それ以外の ID は `exec.approval.resolve` を通じて解決します）。承認はデフォルトで 30 分後に期限切れになります。

    [Exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## ツールとアクションゲート

Discord メッセージアクションには、メッセージング、チャンネル管理、モデレーション、プレゼンス、メタデータアクションが含まれます。

主な例:

- メッセージング: `sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- リアクション: `react`、`reactions`、`emojiList`
- モデレーション: `timeout`、`kick`、`ban`
- プレゼンス: `setPresence`

`event-create` アクションは、スケジュール済みイベントのカバー画像を設定するために、任意の `image` パラメーター（URL またはローカルファイルパス）を受け取ります。

アクションゲートは `channels.discord.actions.*` 配下にあります。

デフォルトのゲート動作:

| アクショングループ                                                                                                                                                       | デフォルト |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 有効     |
| roles                                                                                                                                                                    | 無効     |
| moderation                                                                                                                                                               | 無効     |
| presence                                                                                                                                                                 | 無効     |

## Components v2 UI

OpenClaw は exec 承認とクロスコンテキストマーカーに Discord components v2 を使用します。Discord メッセージアクションは、カスタム UI 用の `components` も受け取れます（高度。discord ツールを通じて component ペイロードを構築する必要があります）。一方、レガシーの `embeds` は引き続き利用できますが、推奨されません。

- `channels.discord.ui.components.accentColor` は、Discord component コンテナーで使用されるアクセントカラー（16 進数）を設定します。
- `channels.discord.accounts.<id>.ui.components.accentColor` でアカウントごとに設定します。
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

Discord には 2 つの異なる音声サーフェスがあります。リアルタイムの**音声チャンネル**（継続的な会話）と**音声メッセージ添付ファイル**（波形プレビュー形式）です。Gateway は両方をサポートします。

### 音声チャンネル

セットアップチェックリスト:

1. Discord Developer Portal で Message Content Intent を有効化します。
2. ロールまたはユーザーの許可リストを使用する場合は、Server Members Intent を有効化します。
3. `bot` と `applications.commands` スコープで bot を招待します。
4. 対象の音声チャンネルで Connect、Speak、Send Messages、Read Message History を付与します。
5. ネイティブコマンド（`commands.native` または `channels.discord.commands.native`）を有効化します。
6. `channels.discord.voice` を設定します。

セッションを制御するには `/vc join|leave|status` を使用します。このコマンドはアカウントのデフォルト agent を使用し、他の Discord コマンドと同じ許可リストおよびグループポリシールールに従います。

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

参加する前に bot の有効な権限を確認するには、次を実行します。

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

自動参加の例:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
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
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

注記:

- `voice.tts` は、`stt-tts` 音声再生の場合にのみ `messages.tts` を上書きします。リアルタイムモードでは `voice.realtime.voice` を使います。
- `voice.mode` は会話経路を制御します。デフォルトは `agent-proxy` です。リアルタイム音声フロントエンドがターンのタイミング、割り込み、再生を処理し、実質的な作業を `openclaw_agent_consult` 経由でルーティングされた OpenClaw エージェントに委譲し、その結果をその話者からの入力済み Discord プロンプトのように扱います。`stt-tts` は従来のバッチ STT と TTS のフローを維持します。`bidi` では、リアルタイムモデルが直接会話しつつ、OpenClaw ブレイン用に `openclaw_agent_consult` を公開します。
- `voice.agentSession` は、どの OpenClaw 会話が音声ターンを受け取るかを制御します。音声チャンネル自身のセッションを使う場合は未設定のままにします。または、`{ mode: "target", target: "channel:<text-channel-id>" }` を設定すると、その音声チャンネルを `#maintainers` など既存の Discord テキストチャンネルセッションのマイク/スピーカー拡張として動作させられます。
- `voice.model` は、Discord 音声応答とリアルタイム consult 用の OpenClaw エージェントブレインを上書きします。ルーティングされたエージェントモデルを継承する場合は未設定のままにします。これは `voice.realtime.model` とは別です。
- `agent-proxy` は音声を `discord-voice` 経由でルーティングします。これにより話者と対象セッションの通常の所有者/ツール認可は維持されますが、Discord 音声が再生を所有するためエージェントの `tts` ツールは隠されます。デフォルトでは、`agent-proxy` は所有者話者に対して consult に所有者相当の完全なツールアクセスを与え（`voice.realtime.toolPolicy: "owner"`）、実質的な回答の前に OpenClaw エージェントへ consult することを強く優先します（`voice.realtime.consultPolicy: "always"`）。そのデフォルトの `always` モードでは、リアルタイム層は consult の回答前にフィラーを自動発話しません。音声をキャプチャして文字起こしし、その後ルーティングされた OpenClaw の回答を発話します。Discord が最初の回答をまだ再生している間に複数の強制 consult 回答が完了した場合、後続の完全発話回答は文の途中で音声を置き換えるのではなく、再生がアイドルになるまでキューに入れられます。
- `stt-tts` モードでは、STT は `tools.media.audio` を使います。`voice.model` は文字起こしに影響しません。
- リアルタイムモードでは、`voice.realtime.provider`、`voice.realtime.model`、`voice.realtime.voice` がリアルタイム音声セッションを設定します。OpenAI Realtime 2 と Codex ブレインを使う場合は、`voice.realtime.model: "gpt-realtime-2"` と `voice.model: "openai-codex/gpt-5.5"` を使います。
- OpenAI リアルタイムプロバイダーは、現在の Realtime 2 イベント名と、出力音声および文字起こしイベント用の従来の Codex 互換エイリアスを受け入れるため、互換プロバイダースナップショットがずれてもアシスタント音声は失われません。
- `voice.realtime.bargeIn` は、Discord の話者開始イベントがアクティブなリアルタイム再生に割り込むかどうかを制御します。未設定の場合は、リアルタイムプロバイダーの入力音声割り込み設定に従います。
- `voice.realtime.minBargeInAudioEndMs` は、OpenAI リアルタイムの割り込みが音声を切り詰める前に必要なアシスタント再生の最小継続時間を制御します。デフォルト: `250`。エコーの少ない部屋で即時割り込みにするには `0` を設定し、エコーが多いスピーカー構成では値を上げます。
- Discord 再生で OpenAI 音声を使うには、`voice.tts.provider: "openai"` を設定し、`voice.tts.openai.voice` または `voice.tts.providers.openai.voice` で Text-to-speech 音声を選択します。現在の OpenAI TTS モデルでは、`cedar` は男性的に聞こえるよい選択肢です。
- チャンネルごとの Discord `systemPrompt` 上書きは、その音声チャンネルの音声文字起こしターンに適用されます。
- 音声文字起こしターンは、Discord の `allowFrom`（または `dm.allowFrom`）から所有者ステータスを導出します。所有者ではない話者は、所有者専用ツール（たとえば `gateway` や `cron`）にアクセスできません。
- Discord 音声はテキスト専用設定ではオプトインです。`/vc` コマンド、音声ランタイム、`GuildVoiceStates` Gateway intent を有効にするには、`channels.discord.voice.enabled=true` を設定します（または既存の `channels.discord.voice` ブロックを保持します）。
- `channels.discord.intents.voiceStates` は、音声状態 intent サブスクリプションを明示的に上書きできます。有効な音声有効化状態に intent を従わせる場合は未設定のままにします。
- `voice.autoJoin` に同じギルドのエントリが複数ある場合、OpenClaw はそのギルドで最後に設定されたチャンネルに参加します。
- `voice.daveEncryption` と `voice.decryptionFailureTolerance` は、`@discordjs/voice` の参加オプションへそのまま渡されます。
- 未設定の場合、`@discordjs/voice` のデフォルトは `daveEncryption=true` と `decryptionFailureTolerance=24` です。
- OpenClaw は Discord 音声受信用に純粋な JS の `opusscript` デコーダーをデフォルトで使います。通常のインストール、Docker レーン、無関係なテストでネイティブアドオンをコンパイルしないように、オプションのネイティブ `@discordjs/opus` パッケージはリポジトリの pnpm インストールポリシーによって無視されます。専用の音声パフォーマンスホストでは、ネイティブアドオンをインストールした後に `OPENCLAW_DISCORD_OPUS_DECODER=native` でオプトインできます。
- `voice.connectTimeoutMs` は、`/vc join` と自動参加の試行における最初の `@discordjs/voice` Ready 待機を制御します。デフォルト: `30000`。
- `voice.reconnectGraceMs` は、切断された音声セッションが破棄される前に、OpenClaw が再接続開始を待つ時間を制御します。デフォルト: `15000`。
- `stt-tts` モードでは、別のユーザーが話し始めただけでは音声再生は停止しません。フィードバックループを避けるため、OpenClaw は TTS の再生中は新しい音声キャプチャを無視します。次のターンでは再生が終わってから話してください。リアルタイムモードでは、話者開始を割り込みシグナルとしてリアルタイムプロバイダーへ転送します。
- リアルタイムモードでは、スピーカーから開いたマイクへ入るエコーが割り込みのように見え、再生を中断することがあります。エコーが多い Discord ルームでは、入力音声で OpenAI が自動割り込みしないように `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` を設定します。それでも Discord の話者開始イベントでアクティブな再生に割り込みたい場合は、`voice.realtime.bargeIn: true` を追加します。OpenAI リアルタイムブリッジは、`voice.realtime.minBargeInAudioEndMs` より短い再生切り詰めをエコー/ノイズの可能性が高いものとして無視し、Discord 再生をクリアする代わりにスキップとしてログに記録します。
- `voice.captureSilenceGraceMs` は、Discord が話者の停止を報告した後、その音声セグメントを STT 用に確定するまで OpenClaw が待つ時間を制御します。デフォルト: `2500`。Discord が通常の間を細切れの部分文字起こしに分割する場合は、この値を上げます。
- ElevenLabs が選択された TTS プロバイダーの場合、Discord 音声再生はストリーミング TTS を使い、プロバイダー応答ストリームから開始します。ストリーミングに対応していないプロバイダーは、合成された一時ファイルの経路にフォールバックします。
- OpenClaw は受信復号失敗も監視し、短時間に失敗が繰り返された場合は音声チャンネルを退出して再参加することで自動回復します。
- 更新後に受信ログで `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` が繰り返し表示される場合は、依存関係レポートとログを収集してください。同梱の `@discordjs/voice` 系列には、discord.js issue #11419 をクローズした discord.js PR #11449 のアップストリームのパディング修正が含まれています。
- `The operation was aborted` 受信イベントは、OpenClaw がキャプチャ済みの話者セグメントを確定するときに想定されるものです。これは詳細診断であり、警告ではありません。
- 詳細な Discord 音声ログには、受理された各話者セグメントについて範囲制限された 1 行の STT 文字起こしプレビューが含まれるため、無制限の文字起こしテキストをダンプせずに、ユーザー側とエージェント返信側の両方をデバッグで確認できます。
- `agent-proxy` モードでは、強制 consult フォールバックは、`...` で終わるテキストや `and` のような末尾の接続語に加え、「すぐ戻ります」や「さようなら」のような明らかにアクション不要の締めくくりなど、不完全な文字起こし断片と思われるものをスキップします。これにより古いキュー済み回答を防いだ場合、ログには `forced agent consult skipped reason=...` が表示されます。

ソースチェックアウト用のネイティブ opus セットアップ:

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

アップストリームの macOS arm64 ビルド済みネイティブアドオンを使いたい場合は、Gateway に Node 22 を使います。別の Node ランタイムを使う場合、オプトインインストーラーにはローカルの `node-gyp` ソースビルドツールチェーンが必要になることがあります。

ネイティブアドオンをインストールした後、次のように Gateway を起動します。

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

詳細な音声ログには `discord voice: opus decoder: @discordjs/opus` が表示されるはずです。環境変数でオプトインしていない場合、またはネイティブアドオンが存在しないかホストでロードできない場合、OpenClaw は `discord voice: opus decoder: opusscript` をログに記録し、純粋な JS フォールバック経由で音声受信を継続します。

STT と TTS のパイプライン:

- Discord PCM キャプチャは WAV 一時ファイルに変換されます。
- `tools.media.audio` が STT を処理します。たとえば `openai/gpt-4o-mini-transcribe` です。
- 文字起こしは Discord の入力経路とルーティングを通ります。その間、応答 LLM は、エージェントの `tts` ツールを隠して返却テキストを求める音声出力ポリシーで実行されます。これは Discord 音声が最終的な TTS 再生を所有するためです。
- `voice.model` が設定されている場合、この音声チャンネルターンの応答 LLM のみを上書きします。
- `voice.tts` は `messages.tts` の上にマージされます。ストリーミング対応プロバイダーはプレイヤーへ直接供給し、それ以外の場合は生成された音声ファイルが参加中のチャンネルで再生されます。

デフォルトの agent-proxy 音声チャンネルセッション例:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

`voice.agentSession` ブロックがない場合、各音声チャンネルは自身のルーティングされた OpenClaw セッションを取得します。たとえば、`/vc join channel:234567890123456789` はその Discord 音声チャンネル用のセッションと会話します。リアルタイムモデルは音声フロントエンドにすぎません。実質的なリクエストは設定済みの OpenClaw エージェントに渡されます。リアルタイムモデルが consult ツールを呼び出さずに最終文字起こしを生成した場合、デフォルトでもエージェントと会話するように動作するよう、OpenClaw はフォールバックとして consult を強制します。

従来の STT と TTS の例:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "stt-tts",
        model: "openai/gpt-5.4-mini",
        tts: {
          provider: "openai",
          openai: {
            model: "gpt-4o-mini-tts",
            voice: "cedar",
          },
        },
      },
    },
  },
}
```

リアルタイム bidi の例:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

既存の Discord チャンネルセッションの拡張としての音声:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai-codex/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

`agent-proxy` モードでは、ボットは設定済みの音声チャンネルに参加しますが、OpenClaw エージェントのターンは対象チャンネルの通常のルーティング済みセッションとエージェントを使います。リアルタイム音声セッションは返された結果を音声チャンネルへ発話します。スーパーバイザーエージェントは引き続き、そのツールポリシーに従って通常のメッセージツールを使えます。適切なアクションであれば、別の Discord メッセージを送信することも含まれます。

有用な対象形式:

- `target: "channel:123456789012345678"` は Discord テキストチャンネルセッション経由でルーティングします。
- `target: "123456789012345678"` はチャンネル対象として扱われます。
- `target: "dm:123456789012345678"` または `target: "user:123456789012345678"` は、そのダイレクトメッセージセッション経由でルーティングします。

エコーが多い OpenAI Realtime の例:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
          bargeIn: true,
          minBargeInAudioEndMs: 500,
          consultPolicy: "always",
          providers: {
            openai: {
              interruptResponseOnInputAudio: false,
            },
          },
        },
      },
    },
  },
}
```

モデルが開いたマイクを通して自身の Discord 再生音を聞いてしまうが、発話で割り込みたい場合にこれを使用する。OpenClaw は未加工の入力音声で OpenAI が自動割り込みしないようにしつつ、`bargeIn: true` によって、次にキャプチャされたターンが OpenAI に届く前に、Discord の話者開始イベントとすでにアクティブな話者音声がアクティブなリアルタイム応答をキャンセルできるようにする。`audioEndMs` が `minBargeInAudioEndMs` 未満の非常に早い割り込み信号は、エコーまたはノイズの可能性が高いものとして扱われ、モデルが最初の再生フレームで途切れないように無視される。

想定される音声ログ:

- 参加時: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- リアルタイム開始時: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 話者音声時: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, および `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 古い発話のスキップ時: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` または `reason=non-actionable-closing ...`
- リアルタイム応答完了時: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 再生停止/リセット時: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- リアルタイム相談時: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- エージェントの回答時: `discord voice: agent turn answer ...`
- 完全一致の発話がキューに入った時: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`、続いて `discord voice: realtime exact speech dequeued reason=player-idle ...`
- 割り込み検出時: `discord voice: realtime barge-in detected source=speaker-start ...` または `discord voice: realtime barge-in detected source=active-speaker-audio ...`、続いて `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- リアルタイム割り込み時: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`、続いて `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` または `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- エコー/ノイズの無視時: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 割り込み無効時: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- アイドル再生時: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

音声が途切れる問題をデバッグするには、リアルタイム音声ログをタイムラインとして読む:

1. `realtime audio playback started` は、Discord がアシスタント音声の再生を開始したことを意味する。ブリッジはこの時点から、アシスタント出力チャンク、Discord PCM バイト、プロバイダーのリアルタイムバイト、合成音声の長さのカウントを開始する。
2. `realtime speaker turn opened` は、Discord の話者がアクティブになったことを示す。再生がすでにアクティブで `bargeIn` が有効な場合、これに続いて `barge-in detected source=speaker-start` が出ることがある。
3. `realtime input audio started` は、その話者ターンで最初の実際の音声フレームを受信したことを示す。ここで `outputActive=true` または 0 以外の `outputAudioMs` がある場合、アシスタント再生がまだアクティブな間にマイクが入力を送信していることを意味する。
4. `barge-in detected source=active-speaker-audio` は、アシスタント再生がアクティブな間に OpenClaw がライブの話者音声を検出したことを意味する。これは、有用な音声のない Discord の話者開始イベントと、実際の割り込みを区別するのに役立つ。
5. `barge-in requested reason=...` は、OpenClaw がリアルタイムプロバイダーにアクティブな応答のキャンセルまたは切り詰めを要求したことを意味する。`outputAudioMs`、`outputActive`、`playbackChunks` が含まれるため、割り込み前に実際にどれだけのアシスタント音声が再生されたかを確認できる。
6. `realtime audio playback stopped reason=...` は、ローカルの Discord 再生リセット地点である。理由は、誰が再生を停止したかを示す: `barge-in`、`player-idle`、`provider-clear-audio`、`forced-agent-consult`、`stream-close`、または `session-close`。
7. `realtime speaker turn closed` は、キャプチャされた入力ターンを要約する。`chunks=0` または `hasAudio=false` は、話者ターンは開いたが、使用可能な音声がリアルタイムブリッジに届かなかったことを意味する。`interruptedPlayback=true` は、その入力ターンがアシスタント出力と重なり、割り込みロジックをトリガーしたことを意味する。

有用なフィールド:

- `outputAudioMs`: ログ行の前にリアルタイムプロバイダーが生成したアシスタント音声の長さ。
- `audioMs`: 再生停止前に OpenClaw がカウントしたアシスタント音声の長さ。
- `elapsedMs`: 再生ストリームまたは話者ターンの開始から終了までの実時間。
- `discordBytes`: Discord 音声へ送信、または Discord 音声から受信した 48 kHz ステレオ PCM バイト。
- `realtimeBytes`: リアルタイムプロバイダーへ送信、またはリアルタイムプロバイダーから受信したプロバイダー形式の PCM バイト。
- `playbackChunks`: アクティブな応答のために Discord へ転送されたアシスタント音声チャンク。
- `sinceLastAudioMs`: 最後にキャプチャされた話者音声フレームから話者ターン終了までの間隔。

一般的なパターン:

- `source=active-speaker-audio`、小さい `outputAudioMs`、同じユーザーが近くにいる状態で即座に途切れる場合、通常はスピーカーのエコーがマイクに入っていることを示す。`voice.realtime.minBargeInAudioEndMs` を上げる、スピーカー音量を下げる、ヘッドホンを使う、または `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` を設定する。
- `source=speaker-start` に続いて `speaker turn closed ... hasAudio=false` が出る場合、Discord は話者開始を報告したが、音声は OpenClaw に届かなかったことを意味する。これは一時的な Discord 音声イベント、ノイズゲートの挙動、またはクライアントが一瞬だけマイクを有効化したことが原因になり得る。
- 近くに割り込みや `provider-clear-audio` がない状態で `audio playback stopped reason=stream-close` が出る場合、ローカルの Discord 再生ストリームが予期せず終了したことを意味する。直前のプロバイダーと Discord プレイヤーのログを確認する。
- `capture ignored during playback (barge-in disabled)` は、アシスタント音声がアクティブな間に OpenClaw が意図的に入力を破棄したことを意味する。発話で再生に割り込みたい場合は `voice.realtime.bargeIn` を有効にする。
- `barge-in ignored ... outputActive=false` は、Discord またはプロバイダーの VAD が発話を報告したが、OpenClaw には割り込むべきアクティブな再生がなかったことを意味する。これは音声を途切れさせないはずである。

認証情報はコンポーネントごとに解決される: `voice.model` 用の LLM ルート認証、`tools.media.audio` 用の STT 認証、`messages.tts`/`voice.tts` 用の TTS 認証、`voice.realtime.providers` またはプロバイダーの通常の認証設定用のリアルタイムプロバイダー認証。

### 音声メッセージ

Discord 音声メッセージは波形プレビューを表示し、OGG/Opus 音声を必要とする。OpenClaw は波形を自動生成するが、検査と変換のために Gateway ホスト上の `ffmpeg` と `ffprobe` が必要である。

- **ローカルファイルパス**を指定する (URL は拒否される)。
- テキストコンテンツは省略する (Discord は同じペイロード内のテキスト + 音声メッセージを拒否する)。
- 任意の音声形式を受け付ける。OpenClaw は必要に応じて OGG/Opus に変換する。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="許可されていないインテントを使用した、または bot がギルドメッセージを確認できない">

    - Message Content Intent を有効にする
    - ユーザー/メンバー解決に依存する場合は Server Members Intent を有効にする
    - インテントを変更した後に Gateway を再起動する

  </Accordion>

  <Accordion title="ギルドメッセージが予期せずブロックされる">

    - `groupPolicy` を確認する
    - `channels.discord.guilds` 配下のギルド許可リストを確認する
    - ギルドの `channels` マップが存在する場合、一覧にあるチャンネルのみ許可される
    - `requireMention` の挙動とメンションパターンを確認する

    有用な確認:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="メンション必須が false なのにまだブロックされる">
    よくある原因:

    - 一致するギルド/チャンネル許可リストがない状態での `groupPolicy="allowlist"`
    - `requireMention` が誤った場所に設定されている (`channels.discord.guilds` またはチャンネルエントリ配下である必要がある)
    - 送信者がギルド/チャンネルの `users` 許可リストによってブロックされている

  </Accordion>

  <Accordion title="長時間実行される Discord ターンまたは重複返信">

    典型的なログ:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway キューの調整項目:

    - 単一アカウント: `channels.discord.eventQueue.listenerTimeout`
    - 複数アカウント: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - これは Discord Gateway リスナー処理のみを制御し、エージェントターンの存続時間は制御しない

    Discord は、キューに入ったエージェントターンにチャンネル所有のタイムアウトを適用しない。メッセージリスナーは即座に引き渡し、キューに入った Discord 実行は、セッション/ツール/ランタイムのライフサイクルが完了するか作業を中止するまで、セッションごとの順序を保持する。

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
    OpenClaw は接続前に Discord `/gateway/bot` メタデータを取得する。一時的な失敗時は Discord のデフォルト Gateway URL にフォールバックし、ログではレート制限される。

    メタデータタイムアウトの調整項目:

    - 単一アカウント: `channels.discord.gatewayInfoTimeoutMs`
    - 複数アカウント: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - config が未設定の場合の env フォールバック: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - デフォルト: `30000` (30 秒)、最大: `120000`

  </Accordion>

  <Accordion title="Gateway READY タイムアウト再起動">
    OpenClaw は、起動時およびランタイム再接続後に Discord の Gateway `READY` イベントを待機する。起動の段階的開始を伴う複数アカウント構成では、デフォルトより長い起動 READY ウィンドウが必要になる場合がある。

    READY タイムアウトの調整項目:

    - 起動時の単一アカウント: `channels.discord.gatewayReadyTimeoutMs`
    - 起動時の複数アカウント: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - config が未設定の場合の起動時 env フォールバック: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 起動時デフォルト: `15000` (15 秒)、最大: `120000`
    - ランタイムの単一アカウント: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - ランタイムの複数アカウント: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - config が未設定の場合のランタイム env フォールバック: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - ランタイムデフォルト: `30000` (30 秒)、最大: `120000`

  </Accordion>

  <Accordion title="権限監査の不一致">
    `channels status --probe` の権限チェックは、数値のチャンネル ID に対してのみ機能する。

    slug キーを使用している場合、ランタイム一致は引き続き機能する場合があるが、probe は権限を完全には検証できない。

  </Accordion>

  <Accordion title="DM とペアリングの問題">

    - DM 無効: `channels.discord.dm.enabled=false`
    - DM ポリシー無効: `channels.discord.dmPolicy="disabled"` (レガシー: `channels.discord.dm.policy`)
    - `pairing` モードでペアリング承認待ち

  </Accordion>

  <Accordion title="bot から bot へのループ">
    デフォルトでは、bot が作成したメッセージは無視される。

    `channels.discord.allowBots=true` を設定する場合は、ループ動作を避けるため、厳格なメンションルールと許可リストルールを使用してください。
    ボットにメンションしているボットメッセージのみを受け付けるには、`channels.discord.allowBots="mentions"` を推奨します。

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

  <Accordion title="DecryptionFailed(...) による音声 STT のドロップ">

    - Discord の音声受信復旧ロジックが含まれるよう、OpenClaw を最新に保つ（`openclaw update`）
    - `channels.discord.voice.daveEncryption=true`（デフォルト）を確認する
    - `channels.discord.voice.decryptionFailureTolerance=24`（アップストリームのデフォルト）から始め、必要な場合のみ調整する
    - ログで以下を確認する:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 自動再参加後も失敗が続く場合は、ログを収集し、[discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) と [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) のアップストリーム DAVE 受信履歴と比較する

  </Accordion>
</AccordionGroup>

## 設定リファレンス

主なリファレンス: [設定リファレンス - Discord](/ja-JP/gateway/config-channels#discord)。

<Accordion title="重要度の高い Discord フィールド">

- 起動/認証: `enabled`, `token`, `accounts.*`, `allowBots`
- ポリシー: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- コマンド: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- イベントキュー: `eventQueue.listenerTimeout`（リスナーの予算）, `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- 返信/履歴: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 配信: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- ストリーミング: `streaming`（レガシーエイリアス: `streamMode`）, `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- メディア/再試行: `mediaMaxMb`（Discord への送信アップロードを制限、デフォルト `100MB`）, `retry`
- アクション: `actions.*`
- プレゼンス: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- 機能: `threadBindings`, トップレベルの `bindings[]`（`type: "acp"`）, `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## 安全性と運用

- ボットトークンはシークレットとして扱う（管理された環境では `DISCORD_BOT_TOKEN` を推奨）。
- 最小権限の Discord 権限を付与する。
- コマンドのデプロイ/状態が古い場合は、gateway を再起動し、`openclaw channels status --probe` で再確認する。

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Discord ユーザーを gateway にペアリングする。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループチャットと許可リストの動作。
  </Card>
  <Card title="チャンネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントにルーティングする。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと堅牢化。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    ギルドとチャンネルをエージェントにマッピングする。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作。
  </Card>
</CardGroup>
