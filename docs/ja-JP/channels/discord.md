---
read_when:
    - Discord チャンネル機能に取り組む
summary: Discord ボットのサポート状況、機能、設定
title: Discord
x-i18n:
    generated_at: "2026-04-30T04:58:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f31af2801e7faf6456d4452a5f43b0e42a067b86b7e562c308fa450a847356
    source_path: channels/discord.md
    workflow: 16
---

DM とギルドチャンネルで、公式 Discord gateway 経由で利用できます。

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

bot 付きの新しいアプリケーションを作成し、その bot をサーバーに追加して、OpenClaw にペアリングする必要があります。bot は自分専用のプライベートサーバーに追加することをおすすめします。まだサーバーがない場合は、[先に作成してください](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends** を選択）。

<Steps>
  <Step title="Discord アプリケーションと bot を作成する">
    [Discord Developer Portal](https://discord.com/developers/applications) に移動し、**New Application** をクリックします。名前は "OpenClaw" のようなものにします。

    サイドバーの **Bot** をクリックします。**Username** は OpenClaw エージェントに付ける名前に設定します。

  </Step>

  <Step title="特権 intents を有効化する">
    引き続き **Bot** ページで、**Privileged Gateway Intents** まで下にスクロールし、次を有効化します。

    - **Message Content Intent**（必須）
    - **Server Members Intent**（推奨。ロール許可リストと名前から ID への照合に必要）
    - **Presence Intent**（任意。プレゼンス更新が必要な場合のみ）

  </Step>

  <Step title="bot トークンをコピーする">
    **Bot** ページの上部に戻り、**Reset Token** をクリックします。

    <Note>
    この名前に反して、これは最初のトークンを生成します。「リセット」されるものはありません。
    </Note>

    トークンをコピーして、どこかに保存します。これは **Bot Token** で、まもなく必要になります。

  </Step>

  <Step title="招待 URL を生成して bot をサーバーに追加する">
    サイドバーの **OAuth2** をクリックします。bot をサーバーに追加するための適切な権限を持つ招待 URL を生成します。

    **OAuth2 URL Generator** まで下にスクロールし、次を有効化します。

    - `bot`
    - `applications.commands`

    下に **Bot Permissions** セクションが表示されます。少なくとも次を有効化します。

    **General Permissions**
      - チャンネルを表示
    **Text Permissions**
      - メッセージを送信
      - メッセージ履歴を読む
      - リンクを埋め込む
      - ファイルを添付
      - リアクションを追加（任意）

    これは通常のテキストチャンネル向けのベースラインセットです。フォーラムやメディアチャンネルのワークフローを含め、スレッドを作成または継続する Discord スレッドに投稿する予定がある場合は、**Send Messages in Threads** も有効化します。
    下部に生成された URL をコピーしてブラウザーに貼り付け、サーバーを選択し、**Continue** をクリックして接続します。これで Discord サーバーに bot が表示されるはずです。

  </Step>

  <Step title="Developer Mode を有効化して ID を収集する">
    Discord アプリに戻り、内部 ID をコピーできるように Developer Mode を有効化する必要があります。

    1. **User Settings**（アバター横の歯車アイコン）→ **Advanced** → **Developer Mode** をオンに切り替え
    2. サイドバーの **サーバーアイコン** を右クリック → **Copy Server ID**
    3. **自分のアバター** を右クリック → **Copy User ID**

    **Server ID** と **User ID** を Bot Token と一緒に保存します。次のステップでこの 3 つすべてを OpenClaw に送信します。

  </Step>

  <Step title="サーバーメンバーからの DM を許可する">
    ペアリングを機能させるには、Discord で bot からあなたへの DM を許可する必要があります。**サーバーアイコン** を右クリック → **Privacy Settings** → **Direct Messages** をオンに切り替えます。

    これにより、サーバーメンバー（bot を含む）があなたに DM を送信できます。Discord DM を OpenClaw で使いたい場合は、この設定を有効にしたままにします。ギルドチャンネルだけを使う予定なら、ペアリング後に DM を無効化できます。

  </Step>

  <Step title="bot トークンを安全に設定する（チャットで送信しない）">
    Discord bot トークンはシークレット（パスワードのようなもの）です。エージェントにメッセージを送る前に、OpenClaw を実行しているマシンで設定します。

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

    OpenClaw がすでにバックグラウンドサービスとして実行されている場合は、OpenClaw Mac アプリ経由、または `openclaw gateway run` プロセスを停止して再起動することで再起動します。
    管理対象サービスのインストールでは、`DISCORD_BOT_TOKEN` が存在するシェルから `openclaw gateway install` を実行するか、変数を `~/.openclaw/.env` に保存して、再起動後にサービスが env SecretRef を解決できるようにします。
    ホストが Discord の起動時アプリケーション検索でブロックまたはレート制限される場合は、起動時にその REST 呼び出しをスキップできるよう、Developer Portal から Discord アプリケーション/クライアント ID を設定します。デフォルトアカウントには `channels.discord.applicationId` を使い、複数の Discord bot を実行する場合は `channels.discord.accounts.<accountId>.applicationId` を使います。

  </Step>

  <Step title="OpenClaw を設定してペアリングする">

    <Tabs>
      <Tab title="エージェントに依頼">
        既存の任意のチャンネル（例: Telegram）で OpenClaw エージェントとチャットし、伝えます。Discord が最初のチャンネルの場合は、代わりに CLI / 設定タブを使います。

        > "I already set my Discord bot token in config. Please finish Discord setup with User ID `<user_id>` and Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / 設定">
        ファイルベースの設定を好む場合は、次を設定します。

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

        スクリプト化またはリモートセットアップでは、同じ JSON5 ブロックを `openclaw config patch --file ./discord.patch.json5 --dry-run` で書き込み、その後 `--dry-run` なしで再実行します。プレーンテキストの `token` 値がサポートされています。SecretRef 値も、env/file/exec プロバイダー全体で `channels.discord.token` に対してサポートされています。[シークレット管理](/ja-JP/gateway/secrets)を参照してください。

        複数の Discord bot では、各 bot トークンとアプリケーション ID をそのアカウント配下に保持します。トップレベルの `channels.discord.applicationId` はアカウントに継承されるため、すべてのアカウントで同じアプリケーション ID を使う場合にのみ、そこに設定します。

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
    Gateway が実行されるまで待ってから、Discord で bot に DM します。ペアリングコードが返されます。

    <Tabs>
      <Tab title="エージェントに依頼">
        既存のチャンネルでペアリングコードをエージェントに送信します。

        > "Approve this Discord pairing code: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    ペアリングコードは 1 時間後に期限切れになります。

    これで Discord の DM 経由でエージェントとチャットできるはずです。

  </Step>
</Steps>

<Note>
トークン解決はアカウントを考慮します。設定のトークン値は env フォールバックより優先されます。`DISCORD_BOT_TOKEN` はデフォルトアカウントでのみ使われます。
有効化された 2 つの Discord アカウントが同じ bot トークンに解決される場合、OpenClaw はそのトークンに対して 1 つの gateway モニターだけを開始します。設定由来のトークンはデフォルトの env フォールバックより優先されます。それ以外の場合は、最初の有効なアカウントが優先され、重複アカウントは無効として報告されます。
高度なアウトバウンド呼び出し（メッセージツール/チャンネルアクション）では、明示的な呼び出し単位の `token` がその呼び出しに使われます。これは送信と読み取り/プローブ系アクション（例: read/search/fetch/thread/pins/permissions）に適用されます。アカウントポリシー/リトライ設定は、引き続きアクティブなランタイムスナップショットで選択されたアカウントから取得されます。
</Note>

## 推奨: ギルドワークスペースをセットアップする

DM が機能したら、Discord サーバーをフルワークスペースとしてセットアップできます。各チャンネルは独自のコンテキストを持つ独自のエージェントセッションになります。自分と bot だけのプライベートサーバーではこれをおすすめします。

<Steps>
  <Step title="サーバーをギルド許可リストに追加する">
    これにより、エージェントは DM だけでなく、サーバー上の任意のチャンネルで応答できるようになります。

    <Tabs>
      <Tab title="エージェントに依頼">
        > "Add my Discord Server ID `<server_id>` to the guild allowlist"
      </Tab>
      <Tab title="設定">

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
    デフォルトでは、エージェントは @mentioned された場合にのみギルドチャンネルで応答します。プライベートサーバーでは、すべてのメッセージに応答させたいことが多いでしょう。

    ギルドチャンネルでは、通常のアシスタント最終応答はデフォルトで非公開のままです。表示される Discord 出力は `message` ツールで明示的に送信する必要があるため、エージェントはデフォルトで待機し、チャンネル返信が有用だと判断した場合にのみ投稿できます。

    <Tabs>
      <Tab title="エージェントに依頼">
        > "Allow my agent to respond on this server without having to be @mentioned"
      </Tab>
      <Tab title="設定">
        ギルド設定で `requireMention: false` を設定します。

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

        グループ/チャンネルルームで従来の自動最終応答を復元するには、`messages.groupChat.visibleReplies: "automatic"` を設定します。

      </Tab>
    </Tabs>

  </Step>

  <Step title="ギルドチャンネルのメモリを計画する">
    デフォルトでは、長期メモリ（MEMORY.md）は DM セッションでのみ読み込まれます。ギルドチャンネルでは MEMORY.md は自動読み込みされません。

    <Tabs>
      <Tab title="エージェントに依頼">
        > "When I ask questions in Discord channels, use memory_search or memory_get if you need long-term context from MEMORY.md."
      </Tab>
      <Tab title="手動">
        すべてのチャンネルで共有コンテキストが必要な場合は、安定した指示を `AGENTS.md` または `USER.md` に入れます（これらはすべてのセッションに注入されます）。長期メモは `MEMORY.md` に保持し、必要に応じてメモリツールでアクセスします。
      </Tab>
    </Tabs>

  </Step>
</Steps>

これで Discord サーバーにいくつかチャンネルを作成し、チャットを始められます。エージェントはチャンネル名を確認でき、各チャンネルは独自の分離セッションになります。そのため、`#coding`、`#home`、`#research` など、ワークフローに合うものをセットアップできます。

## ランタイムモデル

- Gateway は Discord 接続を所有します。
- 応答ルーティングは決定的です: Discord の受信返信は Discord に返されます。
- Discord のギルド/チャンネルメタデータは、ユーザーに見える返信プレフィックスではなく、信頼されないコンテキストとしてモデルプロンプトに追加されます。モデルがそのエンベロープをコピーして返した場合、OpenClaw は送信返信と以後のリプレイコンテキストから、コピーされたメタデータを削除します。
- デフォルトでは (`session.dmScope=main`)、ダイレクトチャットはエージェントのメインセッション (`agent:main:main`) を共有します。
- ギルドチャンネルは分離されたセッションキー (`agent:<agentId>:discord:channel:<channelId>`) です。
- グループ DM はデフォルトで無視されます (`channels.discord.dm.groupEnabled=false`)。
- ネイティブスラッシュコマンドは分離されたコマンドセッション (`agent:<agentId>:discord:slash:<userId>`) で実行されますが、ルーティング先の会話セッションへの `CommandTargetSessionKey` は引き続き保持します。
- Discord へのテキストのみの cron/heartbeat 告知配信では、最終的なアシスタント可視の回答を一度だけ使用します。メディアと構造化コンポーネントペイロードは、エージェントが複数の配信可能ペイロードを出力する場合、複数メッセージのままです。

## フォーラムチャンネル

Discord のフォーラムチャンネルとメディアチャンネルはスレッド投稿のみを受け付けます。OpenClaw はそれらを作成する方法を 2 つサポートしています。

- フォーラム親 (`channel:<forumId>`) にメッセージを送信してスレッドを自動作成します。スレッドタイトルには、メッセージの最初の空でない行が使われます。
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

OpenClaw はエージェントメッセージ用の Discord コンポーネント v2 コンテナをサポートしています。`components` ペイロードを指定してメッセージツールを使用してください。インタラクション結果は通常の受信メッセージとしてエージェントにルーティングされ、既存の Discord `replyToMode` 設定に従います。

サポートされるブロック:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- アクション行には最大 5 個のボタン、または 1 個のセレクトメニューを配置できます
- セレクトタイプ: `string`, `user`, `role`, `mentionable`, `channel`

デフォルトでは、コンポーネントは一度だけ使用できます。ボタン、セレクト、フォームを有効期限まで複数回使用できるようにするには、`components.reusable=true` を設定します。

ボタンをクリックできるユーザーを制限するには、そのボタンに `allowedUsers` を設定します (Discord ユーザー ID、タグ、または `*`)。設定されている場合、一致しないユーザーにはエフェメラルな拒否が返されます。

`/model` と `/models` スラッシュコマンドは、プロバイダー、モデル、互換性のあるランタイムのドロップダウンと送信ステップを備えたインタラクティブなモデルピッカーを開きます。`/models add` は非推奨となり、チャットからモデルを登録する代わりに非推奨メッセージを返すようになりました。ピッカーの返信はエフェメラルで、呼び出したユーザーのみが使用できます。

ファイル添付:

- `file` ブロックは添付参照 (`attachment://<filename>`) を指している必要があります
- 添付は `media`/`path`/`filePath` で指定します (単一ファイル)。複数ファイルには `media-gallery` を使用してください
- アップロード名を添付参照に一致させる必要がある場合は、`filename` を使って上書きします

モーダルフォーム:

- 最大 5 個のフィールドを持つ `components.modal` を追加します
- フィールドタイプ: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
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

    DM ポリシーが open でない場合、不明なユーザーはブロックされます (または `pairing` モードではペアリングを促されます)。

    マルチアカウントの優先順位:

    - `channels.discord.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 1 つのアカウントでは、`allowFrom` がレガシーの `dm.allowFrom` より優先されます。
    - 名前付きアカウントは、自身の `allowFrom` とレガシーの `dm.allowFrom` が未設定の場合、`channels.discord.allowFrom` を継承します。
    - 名前付きアカウントは `channels.discord.accounts.default.allowFrom` を継承しません。

    レガシーの `channels.discord.dm.policy` と `channels.discord.dm.allowFrom` は互換性のために引き続き読み取られます。`openclaw doctor --fix` は、アクセスを変更せずに可能な場合、それらを `dmPolicy` と `allowFrom` に移行します。

    配信用の DM ターゲット形式:

    - `user:<id>`
    - `<@id>` メンション

    チャンネルデフォルトが有効な場合、裸の数値 ID は通常チャンネル ID として解決されますが、アカウントの有効な DM `allowFrom` に列挙されている ID は、互換性のためにユーザー DM ターゲットとして扱われます。

  </Tab>

  <Tab title="ギルドポリシー">
    ギルド処理は `channels.discord.groupPolicy` によって制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` が存在する場合の安全なベースラインは `allowlist` です。

    `allowlist` の動作:

    - ギルドは `channels.discord.guilds` に一致する必要があります (`id` を推奨、スラッグも使用可能)
    - 任意の送信者許可リスト: `users` (安定した ID を推奨) と `roles` (ロール ID のみ)。どちらかが設定されている場合、送信者は `users` または `roles` に一致すると許可されます
    - 直接の名前/タグ一致はデフォルトで無効です。非常用の互換モードとしてのみ `channels.discord.dangerouslyAllowNameMatching: true` を有効にしてください
    - `users` では名前/タグがサポートされますが、ID のほうが安全です。名前/タグのエントリが使用されている場合、`openclaw security audit` が警告します
    - ギルドに `channels` が設定されている場合、一覧にないチャンネルは拒否されます
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

    `DISCORD_BOT_TOKEN` だけを設定し、`channels.discord` ブロックを作成しない場合、`channels.defaults.groupPolicy` が `open` であっても、ランタイムフォールバックは `groupPolicy="allowlist"` になります (ログに警告が出ます)。

  </Tab>

  <Tab title="メンションとグループ DM">
    ギルドメッセージはデフォルトでメンションによって制限されます。

    メンション検出には以下が含まれます。

    - 明示的なボットメンション
    - 設定されたメンションパターン (`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`)
    - サポートされる場合の暗黙的なボットへの返信動作

    `requireMention` はギルド/チャンネルごとに設定されます (`channels.discord.guilds...`)。
    `ignoreOtherMentions` は、別のユーザー/ロールにメンションしているがボットにはメンションしていないメッセージを任意でドロップします (@everyone/@here を除く)。

    グループ DM:

    - デフォルト: 無視されます (`dm.groupEnabled=false`)
    - `dm.groupChannels` による任意の許可リスト (チャンネル ID またはスラッグ)

  </Tab>
</Tabs>

### ロールベースのエージェントルーティング

`bindings[].match.roles` を使用して、Discord ギルドメンバーをロール ID によって別のエージェントにルーティングします。ロールベースのバインディングはロール ID のみを受け付け、ピアまたは親ピアのバインディングの後、ギルドのみのバインディングの前に評価されます。バインディングが他の一致フィールドも設定している場合 (たとえば `peer` + `guildId` + `roles`)、設定されたすべてのフィールドが一致する必要があります。

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
- `commands.native=false` は、以前に登録された Discord ネイティブコマンドを明示的に削除します。
- ネイティブコマンドの認可には、通常のメッセージ処理と同じ Discord 許可リスト/ポリシーが使用されます。
- 認可されていないユーザーにも、Discord UI でコマンドが表示される場合があります。実行時には引き続き OpenClaw の認可が適用され、「not authorized」が返されます。

コマンドカタログと動作については、[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

デフォルトのスラッシュコマンド設定:

- `ephemeral: true`

## 機能詳細

<AccordionGroup>
  <Accordion title="返信タグとネイティブ返信">
    Discord はエージェント出力内の返信タグをサポートします。

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` によって制御されます。

    - `off` (デフォルト)
    - `first`
    - `all`
    - `batched`

    注: `off` は暗黙的な返信スレッド化を無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。
    `first` は、そのターンの最初の送信 Discord メッセージに、暗黙的なネイティブ返信参照を常に付与します。
    `batched` は、受信ターンが複数メッセージのデバウンス済みバッチだった場合にのみ、Discord の暗黙的なネイティブ返信参照を付与します。これは、すべての単一メッセージターンではなく、主に曖昧な連続チャットでネイティブ返信を使いたい場合に便利です。

    エージェントが特定のメッセージをターゲットにできるよう、メッセージ ID はコンテキスト/履歴に表示されます。

  </Accordion>

  <Accordion title="ライブストリームプレビュー">
    OpenClaw は、一時メッセージを送信し、テキストが到着するにつれて編集することで、下書き返信をストリーミングできます。`channels.discord.streaming` は `off` (デフォルト) | `partial` | `block` | `progress` を受け取ります。Discord では `progress` は `partial` にマップされます。`streamMode` はレガシーエイリアスで、自動移行されます。

    複数のボットまたは Gateway がアカウントを共有していると、Discord のプレビュー編集はすぐにレート制限に達するため、デフォルトは `off` のままです。

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

    - `partial` は、トークンが到着するにつれて 1 つのプレビューメッセージを編集します。
    - `block` は下書きサイズのチャンクを送出します (サイズと区切り位置の調整には `draftChunk` を使用し、`textChunkLimit` にクランプされます)。
    - メディア、エラー、明示的返信の最終出力は、保留中のプレビュー編集をキャンセルします。
    - `streaming.preview.toolProgress` (デフォルト `true`) は、ツール/進捗更新がプレビューメッセージを再利用するかどうかを制御します。

    プレビューストリーミングはテキストのみです。メディア返信は通常配信にフォールバックします。`block` ストリーミングが明示的に有効化されている場合、OpenClaw は二重ストリーミングを避けるためプレビューストリームをスキップします。

  </Accordion>

  <Accordion title="履歴、コンテキスト、スレッド動作">
    ギルド履歴コンテキスト:

    - `channels.discord.historyLimit` デフォルト `20`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` は無効化します

    DM 履歴制御:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    スレッドの動作:

    - Discord スレッドはチャンネルセッションとしてルーティングされ、上書きされない限り親チャンネル設定を継承します。
    - スレッドセッションは、親チャンネルのセッションレベルの `/model` 選択をモデル専用フォールバックとして継承します。スレッドローカルの `/model` 選択は引き続き優先され、トランスクリプト継承が有効でない限り親のトランスクリプト履歴はコピーされません。
    - `channels.discord.thread.inheritParent` (デフォルト `false`) は、新しい自動スレッドを親トランスクリプトから初期化するようにします。アカウント単位の上書きは `channels.discord.accounts.<id>.thread.inheritParent` にあります。
    - メッセージツールのリアクションは `user:<id>` の DM ターゲットを解決できます。
    - `guilds.<guild>.channels.<channel>.requireMention: false` は、返信段階のアクティベーションフォールバック中も保持されます。

    チャンネルトピックは**信頼されない**コンテキストとして注入されます。許可リストはエージェントをトリガーできるユーザーを制御しますが、補足コンテキスト全体の墨消し境界ではありません。

  </Accordion>

  <Accordion title="サブエージェントのスレッド固定セッション">
    Discord はスレッドをセッションターゲットにバインドできるため、そのスレッド内の後続メッセージは同じセッション (サブエージェントセッションを含む) にルーティングされ続けます。

    コマンド:

    - `/focus <target>` 現在または新しいスレッドをサブエージェント/セッションターゲットにバインド
    - `/unfocus` 現在のスレッドバインドを削除
    - `/agents` アクティブな実行とバインド状態を表示
    - `/session idle <duration|off>` フォーカスされたバインドの非アクティブ時自動フォーカス解除を確認/更新
    - `/session max-age <duration|off>` フォーカスされたバインドの厳密な最大期間を確認/更新

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
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    注:

    - `session.threadBindings.*` はグローバルデフォルトを設定します。
    - `channels.discord.threadBindings.*` は Discord の動作を上書きします。
    - `sessions_spawn({ thread: true })` のためにスレッドを自動作成/バインドするには、`spawnSubagentSessions` が true である必要があります。
    - ACP (`/acp spawn ... --thread ...` または `sessions_spawn({ runtime: "acp", thread: true })`) のためにスレッドを自動作成/バインドするには、`spawnAcpSessions` が true である必要があります。
    - アカウントでスレッドバインドが無効になっている場合、`/focus` と関連するスレッドバインド操作は利用できません。

    [サブエージェント](/ja-JP/tools/subagents)、[ACP エージェント](/ja-JP/tools/acp-agents)、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

  </Accordion>

  <Accordion title="永続 ACP チャンネルバインド">
    安定した「常時オン」の ACP ワークスペースでは、Discord 会話をターゲットにしたトップレベルの型付き ACP バインドを設定します。

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

    - `/acp spawn codex --bind here` は現在のチャンネルまたはスレッドをその場でバインドし、以後のメッセージを同じ ACP セッションに維持します。スレッドメッセージは親チャンネルのバインドを継承します。
    - バインドされたチャンネルまたはスレッドでは、`/new` と `/reset` は同じ ACP セッションをその場でリセットします。一時的なスレッドバインドは、アクティブな間ターゲット解決を上書きできます。
    - `spawnAcpSessions` が必要なのは、OpenClaw が `--thread auto|here` を使って子スレッドを作成/バインドする必要がある場合だけです。

    バインド動作の詳細は [ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

  </Accordion>

  <Accordion title="リアクション通知">
    ギルド単位のリアクション通知モード:

    - `off`
    - `own` (デフォルト)
    - `all`
    - `allowlist` (`guilds.<id>.users` を使用)

    リアクションイベントはシステムイベントに変換され、ルーティングされた Discord セッションに添付されます。

  </Accordion>

  <Accordion title="Ack リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間に確認応答絵文字を送信します。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - エージェント識別絵文字フォールバック (`agents.list[].identity.emoji`、なければ "👀")

    注:

    - Discord は Unicode 絵文字またはカスタム絵文字名を受け付けます。
    - チャンネルまたはアカウントでリアクションを無効にするには `""` を使用します。

  </Accordion>

  <Accordion title="設定の書き込み">
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

  <Accordion title="Gateway プロキシ">
    `channels.discord.proxy` を使って、Discord Gateway WebSocket トラフィックと起動時の REST ルックアップ (アプリケーション ID + 許可リスト解決) を HTTP(S) プロキシ経由でルーティングします。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    アカウント単位の上書き:

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

  <Accordion title="PluralKit サポート">
    PluralKit 解決を有効にして、プロキシされたメッセージをシステムメンバーの ID にマッピングします。

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
    - ルックアップは元のメッセージ ID を使用し、時間ウィンドウで制限されます
    - ルックアップに失敗した場合、プロキシされたメッセージはボットメッセージとして扱われ、`allowBots=true` でない限り破棄されます

  </Accordion>

  <Accordion title="プレゼンス設定">
    ステータスまたはアクティビティフィールドを設定した場合、または自動プレゼンスを有効にした場合に、プレゼンス更新が適用されます。

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
    - 2: 聴取中
    - 3: 視聴中
    - 4: カスタム (アクティビティテキストをステータス状態として使用します。絵文字は任意です)
    - 5: 競技中

    自動プレゼンスの例 (ランタイムヘルス信号):

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

    自動プレゼンスはランタイムの可用性を Discord ステータスに対応付けます: healthy => online、degraded または unknown => idle、exhausted または unavailable => dnd。任意のテキスト上書き:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` プレースホルダーをサポート)

  </Accordion>

  <Accordion title="Discord での承認">
    Discord は DM でのボタンベースの承認処理をサポートし、必要に応じて承認プロンプトを元のチャンネルに投稿できます。

    設定パス:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (任意。可能な場合は `commands.ownerAllowFrom` にフォールバック)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`、デフォルト: `dm`)
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    Discord は、`enabled` が未設定または `"auto"` で、かつ `execApprovals.approvers` または `commands.ownerAllowFrom` から少なくとも 1 人の承認者を解決できる場合、ネイティブ実行承認を自動的に有効にします。Discord は、チャンネルの `allowFrom`、レガシーな `dm.allowFrom`、またはダイレクトメッセージの `defaultTo` から実行承認者を推論しません。Discord をネイティブ承認クライアントとして明示的に無効にするには、`enabled: false` を設定します。

    `/diagnostics` や `/export-trajectory` などの機密性の高い所有者専用グループコマンドでは、OpenClaw は承認プロンプトと最終結果を非公開で送信します。呼び出し元の所有者に Discord 所有者ルートがある場合は、まず Discord DM を試します。利用できない場合は、Telegram など `commands.ownerAllowFrom` から利用可能な最初の所有者ルートにフォールバックします。

    `target` が `channel` または `both` の場合、承認プロンプトはチャンネルに表示されます。解決済みの承認者だけがボタンを使用できます。他のユーザーには一時的な拒否が表示されます。承認プロンプトにはコマンドテキストが含まれるため、チャンネル配信は信頼できるチャンネルでのみ有効にしてください。セッションキーからチャンネル ID を導出できない場合、OpenClaw は DM 配信にフォールバックします。

    Discord は、他のチャットチャンネルで使用される共有承認ボタンもレンダリングします。ネイティブ Discord アダプターは主に、承認者への DM ルーティングとチャンネルへのファンアウトを追加します。
    これらのボタンが存在する場合、それらが主要な承認 UX です。OpenClaw は、
    ツール結果がチャット承認を利用できない、または手動承認が唯一の経路だと示す場合にのみ、
    手動の `/approve` コマンドを含めるべきです。
    Discord ネイティブ承認ランタイムがアクティブでない場合、OpenClaw は
    ローカルで決定的な `/approve <id> <decision>` プロンプトを表示したままにします。
    ランタイムがアクティブでもネイティブカードをどのターゲットにも配信できない場合、
    OpenClaw は保留中の承認から正確な `/approve` コマンドを含む同一チャットのフォールバック通知を送信します。

    Gateway 認証と承認解決は、共有 Gateway クライアント契約に従います (`plugin:` ID は `plugin.approval.resolve` を通じて解決され、その他の ID は `exec.approval.resolve` を通じて解決されます)。承認はデフォルトで 30 分後に期限切れになります。

    [実行承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## ツールとアクションゲート

Discord メッセージアクションには、メッセージング、チャンネル管理、モデレーション、プレゼンス、メタデータアクションが含まれます。

主な例:

- メッセージング: `sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- リアクション: `react`、`reactions`、`emojiList`
- モデレーション: `timeout`、`kick`、`ban`
- プレゼンス: `setPresence`

`event-create` アクションは、スケジュール済みイベントのカバー画像を設定するための任意の `image` パラメーター (URL またはローカルファイルパス) を受け付けます。

アクションゲートは `channels.discord.actions.*` の下にあります。

デフォルトのゲート動作:

| アクショングループ                                                                                                                                                             | デフォルト  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 有効  |
| roles                                                                                                                                                                    | 無効 |
| moderation                                                                                                                                                               | 無効 |
| presence                                                                                                                                                                 | 無効 |

## コンポーネント v2 UI

OpenClaw は実行承認とクロスコンテキストマーカーに Discord コンポーネント v2 を使用します。Discord メッセージアクションはカスタム UI 用に `components` も受け取れます（高度な機能です。discord ツールでコンポーネントペイロードを構築する必要があります）。一方で、従来の `embeds` も引き続き利用できますが、推奨されません。

- `channels.discord.ui.components.accentColor` は Discord コンポーネントコンテナで使用するアクセントカラー（16 進数）を設定します。
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

Discord には 2 つの異なる音声サーフェスがあります。リアルタイムの **音声チャンネル**（継続的な会話）と、**音声メッセージ添付ファイル**（波形プレビュー形式）です。Gateway は両方をサポートします。

### 音声チャンネル

セットアップチェックリスト:

1. Discord Developer Portal で Message Content Intent を有効にします。
2. ロール/ユーザーの許可リストを使用する場合は、Server Members Intent を有効にします。
3. `bot` と `applications.commands` スコープでボットを招待します。
4. 対象の音声チャンネルで Connect、Speak、Send Messages、Read Message History を付与します。
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

- `voice.tts` は音声再生の場合にのみ `messages.tts` を上書きします。
- `voice.model` は Discord 音声チャンネル応答に使用される LLM のみを上書きします。ルーティングされたエージェントモデルを継承するには未設定のままにします。
- STT は `tools.media.audio` を使用します。`voice.model` は文字起こしに影響しません。
- 音声トランスクリプトのターンは、Discord `allowFrom`（または `dm.allowFrom`）から所有者ステータスを導出します。所有者ではない話者は、所有者専用ツール（たとえば `gateway` と `cron`）にアクセスできません。
- 音声はデフォルトで有効です。音声ランタイムと `GuildVoiceStates` Gateway intent を無効にするには `channels.discord.voice.enabled=false` を設定します。
- `channels.discord.intents.voiceStates` は音声状態 intent サブスクリプションを明示的に上書きできます。intent が `voice.enabled` に従うようにするには未設定のままにします。
- `voice.daveEncryption` と `voice.decryptionFailureTolerance` は `@discordjs/voice` の参加オプションに渡されます。
- `@discordjs/voice` のデフォルトは、未設定の場合 `daveEncryption=true` と `decryptionFailureTolerance=24` です。
- OpenClaw は受信復号失敗も監視し、短時間に失敗が繰り返された後に音声チャンネルを退出して再参加することで自動復旧します。
- 更新後に受信ログで `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` が繰り返し表示される場合は、依存関係レポートとログを収集してください。バンドルされている `@discordjs/voice` 系列には、discord.js issue #11419 をクローズした discord.js PR #11449 のアップストリームのパディング修正が含まれています。

音声チャンネルのパイプライン:

- Discord PCM キャプチャは WAV 一時ファイルに変換されます。
- `tools.media.audio` が STT を処理します。例: `openai/gpt-4o-mini-transcribe`。
- トランスクリプトは通常の Discord 取り込みとルーティングを通じて送信されます。
- `voice.model` が設定されている場合、この音声チャンネルターンの応答 LLM のみを上書きします。
- `voice.tts` は `messages.tts` にマージされ、生成された音声が参加中のチャンネルで再生されます。

認証情報はコンポーネントごとに解決されます。`voice.model` の LLM ルート認証、`tools.media.audio` の STT 認証、`messages.tts`/`voice.tts` の TTS 認証です。

### 音声メッセージ

Discord 音声メッセージは波形プレビューを表示し、OGG/Opus 音声を必要とします。OpenClaw は波形を自動生成しますが、検査と変換のために Gateway ホスト上に `ffmpeg` と `ffprobe` が必要です。

- **ローカルファイルパス**を指定します（URL は拒否されます）。
- テキストコンテンツは省略します（Discord は同じペイロード内のテキスト + 音声メッセージを拒否します）。
- 任意の音声形式を受け付けます。OpenClaw は必要に応じて OGG/Opus に変換します。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="許可されていない intent を使用した、またはボットがギルドメッセージを認識しない">

    - Message Content Intent を有効にします
    - ユーザー/メンバー解決に依存する場合は Server Members Intent を有効にします
    - intent を変更した後は Gateway を再起動します

  </Accordion>

  <Accordion title="ギルドメッセージが予期せずブロックされる">

    - `groupPolicy` を確認します
    - `channels.discord.guilds` の下にあるギルド許可リストを確認します
    - ギルドの `channels` マップが存在する場合、一覧にあるチャンネルのみが許可されます
    - `requireMention` の動作とメンションパターンを確認します

    有用なチェック:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="メンション必須が false でもブロックされる">
    よくある原因:

    - 一致するギルド/チャンネル許可リストなしで `groupPolicy="allowlist"` を使用している
    - `requireMention` が誤った場所に設定されている（`channels.discord.guilds` またはチャンネルエントリの下にある必要があります）
    - 送信者がギルド/チャンネルの `users` 許可リストでブロックされている

  </Accordion>

  <Accordion title="長時間実行される Discord ターンまたは重複返信">

    典型的なログ:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway キューの調整項目:

    - 単一アカウント: `channels.discord.eventQueue.listenerTimeout`
    - 複数アカウント: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - これは Discord Gateway リスナー作業のみを制御し、エージェントターンの存続時間は制御しません

    Discord は、キューに入ったエージェントターンにチャンネル所有のタイムアウトを適用しません。メッセージリスナーは即座に引き渡し、キューに入った Discord 実行は、セッション/ツール/ランタイムライフサイクルが完了するか作業を中止するまで、セッションごとの順序を保持します。

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

  <Accordion title="Gateway メタデータ検索のタイムアウト警告">
    OpenClaw は接続前に Discord `/gateway/bot` メタデータを取得します。一時的な失敗時は Discord のデフォルト Gateway URL にフォールバックし、ログではレート制限されます。

    メタデータタイムアウトの調整項目:

    - 単一アカウント: `channels.discord.gatewayInfoTimeoutMs`
    - 複数アカウント: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 設定が未設定の場合の env フォールバック: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - デフォルト: `30000`（30 秒）、最大: `120000`

  </Accordion>

  <Accordion title="権限監査の不一致">
    `channels status --probe` の権限チェックは数値チャンネル ID に対してのみ機能します。

    スラッグキーを使用している場合、ランタイムの照合は引き続き機能することがありますが、probe は権限を完全には検証できません。

  </Accordion>

  <Accordion title="DM とペアリングの問題">

    - DM 無効: `channels.discord.dm.enabled=false`
    - DM ポリシー無効: `channels.discord.dmPolicy="disabled"`（レガシー: `channels.discord.dm.policy`）
    - `pairing` モードでペアリング承認待ち

  </Accordion>

  <Accordion title="ボット同士のループ">
    デフォルトでは、ボットが作成したメッセージは無視されます。

    `channels.discord.allowBots=true` を設定する場合は、ループ動作を避けるため、厳格なメンションと許可リストルールを使用してください。
    ボットをメンションするボットメッセージのみを受け付けるには、`channels.discord.allowBots="mentions"` を推奨します。

  </Accordion>

  <Accordion title="DecryptionFailed(...) による音声 STT の欠落">

    - Discord 音声受信復旧ロジックが存在するように、OpenClaw を最新の状態に保ちます（`openclaw update`）
    - `channels.discord.voice.daveEncryption=true`（デフォルト）を確認します
    - `channels.discord.voice.decryptionFailureTolerance=24`（アップストリームのデフォルト）から開始し、必要な場合にのみ調整します
    - ログで次を監視します:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 自動再参加後も失敗が続く場合は、ログを収集し、[discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) と [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) のアップストリーム DAVE 受信履歴と比較します

  </Accordion>
</AccordionGroup>

## 設定リファレンス

主要リファレンス: [設定リファレンス - Discord](/ja-JP/gateway/config-channels#discord)。

<Accordion title="高シグナルな Discord フィールド">

- 起動/認証: `enabled`, `token`, `accounts.*`, `allowBots`
- ポリシー: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- コマンド: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- イベントキュー: `eventQueue.listenerTimeout`（リスナー予算）, `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway メタデータ: `gatewayInfoTimeoutMs`
- 返信/履歴: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 配信: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- ストリーミング: `streaming`（レガシーエイリアス: `streamMode`）, `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- メディア/リトライ: `mediaMaxMb`（送信 Discord アップロードを制限、デフォルト `100MB`）, `retry`
- アクション: `actions.*`
- プレゼンス: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- 機能: `threadBindings`, トップレベル `bindings[]`（`type: "acp"`）, `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## 安全性と運用

- ボットトークンはシークレットとして扱います（管理された環境では `DISCORD_BOT_TOKEN` を推奨）。
- 最小権限の Discord 権限を付与します。
- コマンドのデプロイ/状態が古い場合は、Gateway を再起動し、`openclaw channels status --probe` で再確認します。

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    DiscordユーザーをGatewayにペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループチャットと許可リストの動作。
  </Card>
  <Card title="チャネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントにルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルとハードニング。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    ギルドとチャネルをエージェントに対応付けます。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作。
  </Card>
</CardGroup>
