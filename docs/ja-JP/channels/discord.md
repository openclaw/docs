---
read_when:
    - Discord チャンネル機能の作業
summary: Discord ボットのサポート状況、機能、設定
title: Discord
x-i18n:
    generated_at: "2026-05-02T04:48:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f82966fd7c7f5ded09d72ea8bc8fe255316fe0178ee71c3f8a4e36410aead54
    source_path: channels/discord.md
    workflow: 16
---

公式 Discord Gateway 経由で DM とギルドチャンネルを利用できます。

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

Bot 付きの新しいアプリケーションを作成し、その Bot をサーバーに追加して、OpenClaw とペアリングする必要があります。Bot は自分のプライベートサーバーに追加することを推奨します。まだサーバーがない場合は、[まず作成してください](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends** を選択）。

<Steps>
  <Step title="Discord アプリケーションと Bot を作成する">
    [Discord Developer Portal](https://discord.com/developers/applications) に移動し、**New Application** をクリックします。名前は「OpenClaw」のようにします。

    サイドバーの **Bot** をクリックします。**Username** を OpenClaw エージェントに付けたい名前に設定します。

  </Step>

  <Step title="特権インテントを有効にする">
    引き続き **Bot** ページで、**Privileged Gateway Intents** まで下にスクロールし、次を有効にします。

    - **Message Content Intent**（必須）
    - **Server Members Intent**（推奨。ロールの許可リストと名前から ID への照合に必須）
    - **Presence Intent**（任意。プレゼンス更新にのみ必要）

  </Step>

  <Step title="Bot トークンをコピーする">
    **Bot** ページの上部に戻り、**Reset Token** をクリックします。

    <Note>
    名前に反して、これは最初のトークンを生成します。何かが「リセット」されるわけではありません。
    </Note>

    トークンをコピーして、どこかに保存します。これが **Bot Token** で、すぐに必要になります。

  </Step>

  <Step title="招待 URL を生成し、Bot をサーバーに追加する">
    サイドバーの **OAuth2** をクリックします。Bot をサーバーに追加するための適切な権限を持つ招待 URL を生成します。

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
    下部に生成された URL をコピーしてブラウザーに貼り付け、サーバーを選択して **Continue** をクリックして接続します。これで Discord サーバーに Bot が表示されるはずです。

  </Step>

  <Step title="Developer Mode を有効にして ID を収集する">
    Discord アプリに戻り、内部 ID をコピーできるように Developer Mode を有効にする必要があります。

    1. **User Settings**（アバター横の歯車アイコン）→ **Advanced** → **Developer Mode** をオンに切り替える
    2. サイドバーの **server icon** を右クリック → **Copy Server ID**
    3. **own avatar** を右クリック → **Copy User ID**

    **Server ID** と **User ID** を Bot Token と一緒に保存します。次のステップで 3 つすべてを OpenClaw に送ります。

  </Step>

  <Step title="サーバーメンバーからの DM を許可する">
    ペアリングを機能させるには、Discord が Bot からあなたへの DM を許可する必要があります。**server icon** を右クリック → **Privacy Settings** → **Direct Messages** をオンに切り替えます。

    これにより、サーバーメンバー（Bot を含む）があなたに DM を送信できるようになります。OpenClaw で Discord DM を使いたい場合は、これを有効のままにしてください。ギルドチャンネルだけを使う予定なら、ペアリング後に DM を無効にできます。

  </Step>

  <Step title="Bot トークンを安全に設定する（チャットで送信しない）">
    Discord Bot トークンは秘密情報（パスワードのようなもの）です。エージェントにメッセージを送る前に、OpenClaw を実行しているマシンで設定します。

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

    OpenClaw がすでにバックグラウンドサービスとして実行中の場合は、OpenClaw Mac アプリから再起動するか、`openclaw gateway run` プロセスを停止して再起動します。
    管理対象サービスとしてインストールしている場合は、`DISCORD_BOT_TOKEN` が存在するシェルから `openclaw gateway install` を実行するか、その変数を `~/.openclaw/.env` に保存して、再起動後にサービスが env SecretRef を解決できるようにします。
    ホストが Discord の起動時アプリケーション参照でブロックまたはレート制限される場合は、Developer Portal の Discord アプリケーション/クライアント ID を設定して、起動時にその REST 呼び出しをスキップできるようにします。デフォルトアカウントには `channels.discord.applicationId` を使用し、複数の Discord Bot を実行する場合は `channels.discord.accounts.<accountId>.applicationId` を使用します。

  </Step>

  <Step title="OpenClaw を設定してペアリングする">

    <Tabs>
      <Tab title="エージェントに依頼">
        既存の任意のチャンネル（例: Telegram）で OpenClaw エージェントとチャットし、伝えます。Discord が最初のチャンネルの場合は、代わりに CLI / config タブを使用します。

        > 「Discord Bot トークンは設定にすでに入れました。User ID `<user_id>` と Server ID `<server_id>` を使って Discord のセットアップを完了してください。」
      </Tab>
      <Tab title="CLI / config">
        ファイルベースの設定を使いたい場合は、次を設定します。

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

        デフォルトアカウント用の env フォールバック:

```bash
DISCORD_BOT_TOKEN=...
```

        スクリプト化されたセットアップやリモートセットアップでは、同じ JSON5 ブロックを `openclaw config patch --file ./discord.patch.json5 --dry-run` で書き込み、その後 `--dry-run` なしで再実行します。プレーンテキストの `token` 値がサポートされています。SecretRef 値も、env/file/exec プロバイダー全体で `channels.discord.token` に対してサポートされています。[Secrets Management](/ja-JP/gateway/secrets) を参照してください。

        複数の Discord Bot の場合は、それぞれの Bot トークンとアプリケーション ID をそのアカウント配下に保持します。トップレベルの `channels.discord.applicationId` はアカウントに継承されるため、すべてのアカウントで同じアプリケーション ID を使う場合にのみそこに設定してください。

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
    Gateway が実行されるまで待ってから、Discord で Bot に DM します。Bot はペアリングコードで応答します。

    <Tabs>
      <Tab title="エージェントに依頼">
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

    ペアリングコードは 1 時間後に期限切れになります。

    これで、Discord の DM 経由でエージェントとチャットできるはずです。

  </Step>
</Steps>

<Note>
トークン解決はアカウント対応です。設定のトークン値は env フォールバックより優先されます。`DISCORD_BOT_TOKEN` はデフォルトアカウントにのみ使用されます。
有効な 2 つの Discord アカウントが同じ Bot トークンに解決される場合、OpenClaw はそのトークンに対して 1 つの Gateway モニターだけを起動します。設定由来のトークンはデフォルトの env フォールバックより優先されます。それ以外の場合は、最初に有効化されたアカウントが優先され、重複アカウントは無効として報告されます。
高度なアウトバウンド呼び出し（message ツール/チャンネルアクション）では、明示的な呼び出しごとの `token` がその呼び出しに使用されます。これは送信および読み取り/プローブ系アクション（たとえば read/search/fetch/thread/pins/permissions）に適用されます。アカウントポリシー/再試行設定は、引き続きアクティブなランタイムスナップショットで選択されたアカウントから取得されます。
</Note>

## 推奨: ギルドワークスペースをセットアップする

DM が動作するようになったら、Discord サーバーを完全なワークスペースとしてセットアップできます。各チャンネルは、それぞれ独自のコンテキストを持つ独自のエージェントセッションを取得します。自分と Bot だけのプライベートサーバーではこれを推奨します。

<Steps>
  <Step title="サーバーをギルド許可リストに追加する">
    これにより、エージェントは DM だけでなく、サーバー上の任意のチャンネルで応答できるようになります。

    <Tabs>
      <Tab title="エージェントに依頼">
        > 「Discord Server ID `<server_id>` をギルド許可リストに追加してください」
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

  <Step title="@mention なしでの応答を許可する">
    デフォルトでは、エージェントは @mention された場合にのみギルドチャンネルで応答します。プライベートサーバーでは、おそらくすべてのメッセージに応答させたいはずです。

    ギルドチャンネルでは、通常のアシスタントの最終返信はデフォルトで非公開のままです。表示される Discord 出力は `message` ツールで明示的に送信する必要があるため、エージェントはデフォルトでは待機し、チャンネル返信が有用だと判断したときだけ投稿できます。

    <Tabs>
      <Tab title="エージェントに依頼">
        > 「@mentioned されなくても、このサーバーでエージェントが応答できるようにしてください」
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

        グループ/チャンネルルーム向けの従来の自動最終返信を復元するには、`messages.groupChat.visibleReplies: "automatic"` を設定します。

      </Tab>
    </Tabs>

  </Step>

  <Step title="ギルドチャンネルでのメモリを計画する">
    デフォルトでは、長期メモリ（MEMORY.md）は DM セッションでのみ読み込まれます。ギルドチャンネルでは MEMORY.md は自動読み込みされません。

    <Tabs>
      <Tab title="エージェントに依頼">
        > 「Discord チャンネルで質問するとき、MEMORY.md からの長期コンテキストが必要なら memory_search または memory_get を使ってください。」
      </Tab>
      <Tab title="手動">
        すべてのチャンネルで共有コンテキストが必要な場合は、安定した指示を `AGENTS.md` または `USER.md` に置きます（これらはすべてのセッションに注入されます）。長期メモは `MEMORY.md` に保持し、必要に応じてメモリツールでアクセスします。
      </Tab>
    </Tabs>

  </Step>
</Steps>

これで、Discord サーバーにいくつかチャンネルを作成してチャットを開始できます。エージェントはチャンネル名を見ることができ、各チャンネルはそれぞれ独自の分離されたセッションを取得します。そのため、`#coding`、`#home`、`#research` など、ワークフローに合うものを設定できます。

## ランタイムモデル

- Gateway が Discord 接続を所有します。
- 返信ルーティングは決定的です。Discord の受信返信は Discord に返されます。
- Discord のギルド/チャンネルメタデータは、ユーザーに見える返信プレフィックスではなく、信頼されていない
  コンテキストとしてモデルプロンプトに追加されます。モデルがそのエンベロープを
  コピーして返した場合、OpenClaw は送信返信と
  以降の再生コンテキストからコピーされたメタデータを取り除きます。
- デフォルトでは (`session.dmScope=main`)、直接チャットはエージェントのメインセッション (`agent:main:main`) を共有します。
- ギルドチャンネルは分離されたセッションキーです (`agent:<agentId>:discord:channel:<channelId>`)。
- グループ DM はデフォルトで無視されます (`channels.discord.dm.groupEnabled=false`)。
- ネイティブスラッシュコマンドは分離されたコマンドセッション (`agent:<agentId>:discord:slash:<userId>`) で実行されますが、ルーティング先の会話セッションへ `CommandTargetSessionKey` も引き続き保持します。
- Discord へのテキストのみの cron/heartbeat 通知配信は、最終的な
  アシスタント可視の回答を 1 回使用します。メディアと構造化コンポーネントペイロードは、エージェントが複数の配信可能ペイロードを出力した場合、
  複数メッセージのままです。

## フォーラムチャンネル

Discord のフォーラムチャンネルとメディアチャンネルはスレッド投稿のみを受け付けます。OpenClaw はそれらを作成する 2 つの方法をサポートしています。

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

OpenClaw はエージェントメッセージ用の Discord コンポーネント v2 コンテナをサポートしています。`components` ペイロード付きで message tool を使用します。インタラクション結果は通常の受信メッセージとしてエージェントにルーティングされ、既存の Discord `replyToMode` 設定に従います。

サポートされるブロック:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- アクション行では最大 5 個のボタン、または単一の選択メニューを使用できます
- 選択タイプ: `string`, `user`, `role`, `mentionable`, `channel`

デフォルトでは、コンポーネントは 1 回だけ使用できます。ボタン、選択、フォームを期限切れになるまで複数回使用できるようにするには、`components.reusable=true` を設定します。

ボタンをクリックできるユーザーを制限するには、そのボタンに `allowedUsers` を設定します (Discord ユーザー ID、タグ、または `*`)。設定されている場合、一致しないユーザーにはエフェメラルな拒否が返されます。

`/model` と `/models` スラッシュコマンドは、プロバイダー、モデル、互換性のあるランタイムのドロップダウンと Submit ステップを備えたインタラクティブなモデルピッカーを開きます。`/models add` は非推奨になり、チャットからモデルを登録する代わりに非推奨メッセージを返すようになりました。ピッカーの返信はエフェメラルで、呼び出したユーザーだけが使用できます。

ファイル添付:

- `file` ブロックは添付参照 (`attachment://<filename>`) を指している必要があります
- 添付は `media`/`path`/`filePath` (単一ファイル) で指定します。複数ファイルには `media-gallery` を使用します
- アップロード名を添付参照と一致させる必要がある場合は、`filename` を使って上書きします

モーダルフォーム:

- 最大 5 フィールドの `components.modal` を追加します
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
  <Tab title="DM policy">
    `channels.discord.dmPolicy` は DM アクセスを制御します。`channels.discord.allowFrom` は正規の DM 許可リストです。

    - `pairing` (デフォルト)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` に `"*"` を含める必要があります)
    - `disabled`

    DM ポリシーが open でない場合、不明なユーザーはブロックされます (または `pairing` モードではペアリングを求められます)。

    複数アカウントの優先順位:

    - `channels.discord.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 1 つのアカウントでは、`allowFrom` がレガシーの `dm.allowFrom` より優先されます。
    - 名前付きアカウントは、自身の `allowFrom` とレガシーの `dm.allowFrom` が未設定の場合に `channels.discord.allowFrom` を継承します。
    - 名前付きアカウントは `channels.discord.accounts.default.allowFrom` を継承しません。

    レガシーの `channels.discord.dm.policy` と `channels.discord.dm.allowFrom` は互換性のために引き続き読み取られます。アクセスを変更せずに実行できる場合、`openclaw doctor --fix` はそれらを `dmPolicy` と `allowFrom` に移行します。

    配信用の DM ターゲット形式:

    - `user:<id>`
    - `<@id>` メンション

    チャンネルのデフォルトが有効な場合、裸の数値 ID は通常チャンネル ID として解決されますが、アカウントの有効な DM `allowFrom` に listed された ID は互換性のためにユーザー DM ターゲットとして扱われます。

  </Tab>

  <Tab title="DM access groups">
    Discord DM では、`channels.discord.allowFrom` 内で動的な `accessGroup:<name>` エントリを使用できます。

    アクセスグループ名はメッセージチャンネル間で共有されます。メンバーが各チャンネルの通常の `allowFrom` 構文で表される静的グループには `type: "message.senders"` を使用し、Discord チャンネルの現在の `ViewChannel` オーディエンスがメンバーシップを動的に定義する必要がある場合は `type: "discord.channelAudience"` を使用します。共有アクセスグループの動作はここに記載されています: [アクセスグループ](/ja-JP/channels/access-groups)。

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

    Discord テキストチャンネルには個別のメンバーリストがありません。`type: "discord.channelAudience"` はメンバーシップを次のようにモデル化します。DM 送信者は設定されたギルドのメンバーであり、ロールとチャンネルの上書きが適用された後、設定されたチャンネルに対して現在有効な `ViewChannel` 権限を持っています。

    例: `#maintainers` を見られる全員に bot への DM を許可し、それ以外の全員には DM を閉じたままにします。

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

    ルックアップは失敗時に閉じます。Discord が `Missing Access` を返す場合、メンバールックアップが失敗する場合、またはチャンネルが別のギルドに属する場合、DM 送信者は未承認として扱われます。

    チャンネルオーディエンスアクセスグループを使用する場合は、bot の Discord Developer Portal **Server Members Intent** を有効にします。DM にはギルドメンバー状態が含まれないため、OpenClaw は認可時に Discord REST 経由でメンバーを解決します。

  </Tab>

  <Tab title="Guild policy">
    ギルド処理は `channels.discord.groupPolicy` によって制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` が存在する場合のセキュアなベースラインは `allowlist` です。

    `allowlist` の動作:

    - ギルドは `channels.discord.guilds` と一致する必要があります (`id` 推奨、slug も受け付けます)
    - 任意の送信者許可リスト: `users` (安定した ID を推奨) と `roles` (ロール ID のみ)。どちらかが設定されている場合、送信者は `users` または `roles` に一致すると許可されます
    - 直接の名前/タグマッチングはデフォルトで無効です。緊急互換モードとしてのみ `channels.discord.dangerouslyAllowNameMatching: true` を有効にしてください
    - `users` では名前/タグがサポートされますが、ID のほうが安全です。名前/タグエントリが使用されている場合、`openclaw security audit` が警告します
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

    `DISCORD_BOT_TOKEN` のみを設定し、`channels.discord` ブロックを作成しない場合、`channels.defaults.groupPolicy` が `open` であっても、ランタイムフォールバックは `groupPolicy="allowlist"` になります (ログに警告が出ます)。

  </Tab>

  <Tab title="Mentions and group DMs">
    ギルドメッセージはデフォルトでメンションゲートされます。

    メンション検出には次が含まれます。

    - 明示的な bot メンション
    - 設定されたメンションパターン (`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`)
    - サポートされるケースでの暗黙の bot への返信動作

    `requireMention` はギルド/チャンネルごとに設定されます (`channels.discord.guilds...`)。
    `ignoreOtherMentions` は、bot ではなく別のユーザー/ロールにメンションしているメッセージを任意で破棄します (@everyone/@here を除く)。

    グループ DM:

    - デフォルト: 無視されます (`dm.groupEnabled=false`)
    - `dm.groupChannels` による任意の許可リスト (チャンネル ID または slug)

  </Tab>
</Tabs>

### ロールベースのエージェントルーティング

`bindings[].match.roles` を使用して、Discord ギルドメンバーをロール ID によって異なるエージェントにルーティングします。ロールベースのバインディングはロール ID のみを受け付け、peer または parent-peer バインディングの後、guild-only バインディングの前に評価されます。バインディングが他の一致フィールドも設定している場合 (たとえば `peer` + `guildId` + `roles`)、設定されたすべてのフィールドが一致する必要があります。

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
- `commands.native=false` は以前に登録された Discord ネイティブコマンドを明示的に消去します。
- ネイティブコマンド認可は、通常のメッセージ処理と同じ Discord 許可リスト/ポリシーを使用します。
- 承認されていないユーザーにも、コマンドが Discord UI に表示される場合があります。実行時には引き続き OpenClaw 認可が適用され、"not authorized" が返されます。

コマンドカタログと動作については、[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

デフォルトのスラッシュコマンド設定:

- `ephemeral: true`

## 機能の詳細

<AccordionGroup>
  <Accordion title="返信タグとネイティブ返信">
    Discord はエージェント出力で返信タグをサポートします:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` で制御します:

    - `off` (デフォルト)
    - `first`
    - `all`
    - `batched`

    注: `off` は暗黙的な返信スレッド化を無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。
    `first` は、そのターンの最初の送信 Discord メッセージに、暗黙的なネイティブ返信参照を常に付加します。
    `batched` は、受信ターンが複数メッセージのデバウンス済みバッチだった場合にのみ、
    Discord の暗黙的なネイティブ返信参照を付加します。これは、すべての
    単一メッセージターンではなく、主にあいまいな連続チャットにネイティブ返信を使いたい場合に便利です。

    メッセージ ID はコンテキスト/履歴に公開されるため、エージェントは特定のメッセージを対象にできます。

  </Accordion>

  <Accordion title="ライブストリームプレビュー">
    OpenClaw は、一時メッセージを送信し、テキストの到着に応じて編集することで、下書き返信をストリーミングできます。`channels.discord.streaming` は `off` (デフォルト) | `partial` | `block` | `progress` を取ります。Discord では `progress` は `partial` にマップされます。`streamMode` はレガシーエイリアスで、自動移行されます。

    複数のボットや Gateway がアカウントを共有していると、Discord のプレビュー編集はすぐレート制限に達するため、デフォルトは `off` のままです。

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

    - `partial` はトークンの到着に応じて、単一のプレビューメッセージを編集します。
    - `block` は下書きサイズのチャンクを出力します (サイズと区切り位置の調整には `draftChunk` を使用し、`textChunkLimit` にクランプされます)。
    - メディア、エラー、明示的な返信の最終応答は、保留中のプレビュー編集をキャンセルします。
    - `streaming.preview.toolProgress` (デフォルト `true`) は、ツール/進行状況の更新でプレビューメッセージを再利用するかどうかを制御します。

    プレビューストリーミングはテキスト専用です。メディア返信は通常配信にフォールバックします。`block` ストリーミングが明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためプレビューストリームをスキップします。

  </Accordion>

  <Accordion title="履歴、コンテキスト、スレッド動作">
    ギルド履歴コンテキスト:

    - `channels.discord.historyLimit` のデフォルトは `20`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効化

    DM 履歴の制御:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    スレッド動作:

    - Discord スレッドはチャンネルセッションとしてルーティングされ、上書きされない限り親チャンネル設定を継承します。
    - スレッドセッションは、モデル専用のフォールバックとして親チャンネルのセッションレベルの `/model` 選択を継承します。スレッドローカルの `/model` 選択が引き続き優先され、トランスクリプト継承が有効でない限り、親トランスクリプト履歴はコピーされません。
    - `channels.discord.thread.inheritParent` (デフォルト `false`) は、新しい自動スレッドを親トランスクリプトからシードするようにします。アカウントごとの上書きは `channels.discord.accounts.<id>.thread.inheritParent` にあります。
    - メッセージツールのリアクションは、`user:<id>` DM ターゲットを解決できます。
    - `guilds.<guild>.channels.<channel>.requireMention: false` は、返信段階のアクティベーションフォールバック中も保持されます。

    チャンネルトピックは**信頼されない**コンテキストとして注入されます。許可リストはエージェントをトリガーできるユーザーを制御しますが、完全な補足コンテキストの秘匿境界ではありません。

  </Accordion>

  <Accordion title="サブエージェント用のスレッド固定セッション">
    Discord はスレッドをセッションターゲットにバインドできるため、そのスレッド内のフォローアップメッセージは同じセッション (サブエージェントセッションを含む) にルーティングされ続けます。

    コマンド:

    - `/focus <target>` 現在/新規スレッドをサブエージェント/セッションターゲットにバインドする
    - `/unfocus` 現在のスレッドバインドを削除する
    - `/agents` アクティブな実行とバインド状態を表示する
    - `/session idle <duration|off>` フォーカスされたバインドの非アクティブ時の自動フォーカス解除を確認/更新する
    - `/session max-age <duration|off>` フォーカスされたバインドの厳密な最大有効期間を確認/更新する

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
    - `sessions_spawn({ thread: true })` のためにスレッドを自動作成/バインドするには、`spawnSubagentSessions` を true にする必要があります。
    - ACP (`/acp spawn ... --thread ...` または `sessions_spawn({ runtime: "acp", thread: true })`) のためにスレッドを自動作成/バインドするには、`spawnAcpSessions` を true にする必要があります。
    - アカウントでスレッドバインドが無効な場合、`/focus` および関連するスレッドバインド操作は利用できません。

    [サブエージェント](/ja-JP/tools/subagents)、[ACP エージェント](/ja-JP/tools/acp-agents)、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

  </Accordion>

  <Accordion title="永続 ACP チャンネルバインド">
    安定した「常時稼働」の ACP ワークスペースには、Discord 会話を対象にするトップレベルの型付き ACP バインドを設定します。

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
    - バインドされたチャンネルまたはスレッドでは、`/new` と `/reset` は同じ ACP セッションをその場でリセットします。一時的なスレッドバインドは、アクティブな間、ターゲット解決を上書きできます。
    - `spawnAcpSessions` が必要なのは、OpenClaw が `--thread auto|here` で子スレッドを作成/バインドする必要がある場合のみです。

    バインド動作の詳細については、[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

  </Accordion>

  <Accordion title="リアクション通知">
    ギルドごとのリアクション通知モード:

    - `off`
    - `own` (デフォルト)
    - `all`
    - `allowlist` (`guilds.<id>.users` を使用)

    リアクションイベントはシステムイベントに変換され、ルーティングされた Discord セッションに添付されます。

  </Accordion>

  <Accordion title="Ack リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間、確認用の絵文字を送信します。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - エージェント ID 絵文字フォールバック (`agents.list[].identity.emoji`、なければ "👀")

    注:

    - Discord は Unicode 絵文字またはカスタム絵文字名を受け付けます。
    - チャンネルまたはアカウントでリアクションを無効にするには `""` を使用します。

  </Accordion>

  <Accordion title="設定の書き込み">
    チャンネル起点の設定書き込みはデフォルトで有効です。

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
    `channels.discord.proxy` を使用して、Discord Gateway WebSocket トラフィックと起動時の REST 参照 (アプリケーション ID + 許可リスト解決) を HTTP(S) プロキシ経由でルーティングします。

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

  <Accordion title="PluralKit サポート">
    PluralKit 解決を有効にして、プロキシされたメッセージをシステムメンバー ID にマップします:

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
    - 参照は元のメッセージ ID を使用し、時間ウィンドウで制約されます
    - 参照に失敗した場合、プロキシされたメッセージはボットメッセージとして扱われ、`allowBots=true` でない限り破棄されます

  </Accordion>

  <Accordion title="送信メンションエイリアス">
    既知の Discord ユーザーに対してエージェントが決定的な送信メンションを必要とする場合は、`mentionAliases` を使用します。キーは先頭の `@` なしのハンドルです。値は Discord ユーザー ID です。不明なハンドル、`@everyone`、`@here`、Markdown コードスパン内のメンションは変更されません。

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

  <Accordion title="プレゼンス設定">
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

    アクティビティタイプのマップ:

    - 0: プレイ中
    - 1: ストリーミング (`activityUrl` が必要)
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

    自動プレゼンスはランタイム可用性を Discord ステータスにマップします: healthy => online、degraded または unknown => idle、exhausted または unavailable => dnd。任意のテキスト上書き:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` プレースホルダーをサポート)

  </Accordion>

  <Accordion title="Discord での承認">
    Discord は DM でボタンベースの承認処理をサポートし、任意で元のチャンネルに承認プロンプトを投稿できます。

    設定パス:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (任意。可能な場合は `commands.ownerAllowFrom` にフォールバック)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`、デフォルト: `dm`)
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    Discord は、`enabled` が未設定または `"auto"` で、`execApprovals.approvers` または `commands.ownerAllowFrom` から少なくとも 1 人の承認者を解決できる場合、ネイティブ実行承認を自動的に有効にします。Discord は、チャンネル `allowFrom`、レガシー `dm.allowFrom`、またはダイレクトメッセージ `defaultTo` から実行承認者を推論しません。Discord をネイティブ承認クライアントとして明示的に無効にするには、`enabled: false` を設定します。

    機密性の高い owner 専用グループコマンド（`/diagnostics` や `/export-trajectory` など）では、OpenClaw は承認プロンプトと最終結果を非公開で送信します。呼び出した owner に Discord owner ルートがある場合はまず Discord DM を試みます。利用できない場合は、Telegram など、`commands.ownerAllowFrom` から最初に利用可能な owner ルートへフォールバックします。

    `target` が `channel` または `both` の場合、承認プロンプトはチャンネル内に表示されます。解決済みの承認者だけがボタンを使用でき、他のユーザーには一時的な拒否が返されます。承認プロンプトにはコマンドテキストが含まれるため、信頼できるチャンネルでのみチャンネル配信を有効にしてください。チャンネル ID をセッションキーから導出できない場合、OpenClaw は DM 配信へフォールバックします。

    Discord は、他のチャットチャンネルで使われる共有承認ボタンも表示します。ネイティブ Discord アダプターは主に、承認者 DM ルーティングとチャンネルファンアウトを追加します。
    これらのボタンが存在する場合、それらが主要な承認 UX です。OpenClaw は、
    ツール結果がチャット承認を利用できない、または手動承認が唯一の経路であると示す場合にのみ、
    手動の `/approve` コマンドを含めるべきです。
    Discord ネイティブ承認ランタイムがアクティブでない場合、OpenClaw は
    ローカルで決定論的な `/approve <id> <decision>` プロンプトを表示したままにします。
    ランタイムがアクティブでも、ネイティブカードをどのターゲットにも配信できない場合、
    OpenClaw は保留中の承認から正確な `/approve`
    コマンドを含む同一チャット内フォールバック通知を送信します。

    Gateway 認証と承認解決は、共有 Gateway クライアント契約に従います（`plugin:` ID は `plugin.approval.resolve` で解決され、その他の ID は `exec.approval.resolve` で解決されます）。承認はデフォルトで 30 分後に期限切れになります。

    [Exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## ツールとアクションゲート

Discord メッセージアクションには、メッセージング、チャンネル管理、モデレーション、プレゼンス、メタデータのアクションが含まれます。

主要な例:

- メッセージング: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- リアクション: `react`, `reactions`, `emojiList`
- モデレーション: `timeout`, `kick`, `ban`
- プレゼンス: `setPresence`

`event-create` アクションは、スケジュール済みイベントのカバー画像を設定するために、任意の `image` パラメーター（URL またはローカルファイルパス）を受け付けます。

アクションゲートは `channels.discord.actions.*` の下にあります。

デフォルトのゲート動作:

| アクショングループ                                                                                                                                                       | デフォルト |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 有効       |
| roles                                                                                                                                                                    | 無効       |
| moderation                                                                                                                                                               | 無効       |
| presence                                                                                                                                                                 | 無効       |

## Components v2 UI

OpenClaw は exec 承認とクロスコンテキストマーカーに Discord components v2 を使用します。Discord メッセージアクションは、カスタム UI 用に `components` も受け付けられます（高度な用途。discord ツールを介してコンポーネントペイロードを構築する必要があります）。一方で従来の `embeds` も引き続き利用できますが、推奨されません。

- `channels.discord.ui.components.accentColor` は、Discord コンポーネントコンテナーで使用されるアクセントカラー（hex）を設定します。
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

Discord には、リアルタイムの**ボイスチャンネル**（継続的な会話）と**音声メッセージ添付ファイル**（波形プレビュー形式）という 2 つの異なる音声サーフェスがあります。gateway は両方をサポートします。

### ボイスチャンネル

セットアップチェックリスト:

1. Discord Developer Portal で Message Content Intent を有効にします。
2. ロール/ユーザー許可リストを使用する場合は Server Members Intent を有効にします。
3. `bot` と `applications.commands` スコープで bot を招待します。
4. 対象のボイスチャンネルで Connect、Speak、Send Messages、Read Message History を付与します。
5. ネイティブコマンド（`commands.native` または `channels.discord.commands.native`）を有効にします。
6. `channels.discord.voice` を設定します。

セッションを制御するには `/vc join|leave|status` を使用します。このコマンドはアカウントのデフォルト agent を使用し、他の Discord コマンドと同じ許可リストおよびグループポリシールールに従います。

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

注:

- `voice.tts` は音声再生に限り `messages.tts` を上書きします。
- `voice.model` は Discord ボイスチャンネル応答に使用される LLM のみを上書きします。ルーティングされた agent モデルを継承するには未設定のままにします。
- STT は `tools.media.audio` を使用します。`voice.model` は文字起こしに影響しません。
- チャンネルごとの Discord `systemPrompt` 上書きは、そのボイスチャンネルの音声トランスクリプトターンに適用されます。
- 音声トランスクリプトターンは、Discord `allowFrom`（または `dm.allowFrom`）から owner ステータスを導出します。owner ではない話者は、owner 専用ツール（例: `gateway` や `cron`）にアクセスできません。
- Discord 音声はテキスト専用設定ではオプトインです。`channels.discord.voice.enabled=true` を設定する（または既存の `channels.discord.voice` ブロックを保持する）と、`/vc` コマンド、音声ランタイム、`GuildVoiceStates` gateway intent が有効になります。
- `channels.discord.intents.voiceStates` で voice-state intent サブスクリプションを明示的に上書きできます。有効な音声有効化状態に intent を追従させるには未設定のままにします。
- `voice.daveEncryption` と `voice.decryptionFailureTolerance` は `@discordjs/voice` join オプションへそのまま渡されます。
- 未設定の場合、`@discordjs/voice` のデフォルトは `daveEncryption=true` および `decryptionFailureTolerance=24` です。
- `voice.connectTimeoutMs` は、`/vc join` と自動参加試行における最初の `@discordjs/voice` Ready 待機を制御します。デフォルト: `30000`。
- `voice.reconnectGraceMs` は、切断された音声セッションが破棄される前に再接続を開始するまで OpenClaw が待機する時間を制御します。デフォルト: `15000`。
- OpenClaw は受信復号失敗も監視し、短い時間枠内で失敗が繰り返された場合にボイスチャンネルを退出/再参加して自動復旧します。
- 更新後に受信ログで `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` が繰り返し表示される場合は、依存関係レポートとログを収集してください。バンドルされた `@discordjs/voice` 系列には、discord.js PR #11449 の upstream padding 修正が含まれており、これにより discord.js issue #11419 が解決されました。

ボイスチャンネルパイプライン:

- Discord PCM キャプチャは WAV 一時ファイルに変換されます。
- `tools.media.audio` が STT を処理します。例: `openai/gpt-4o-mini-transcribe`。
- トランスクリプトは Discord ingress とルーティングを通って送信されます。一方で応答 LLM は、agent の `tts` ツールを隠し、返却テキストを要求する音声出力ポリシーで実行されます。これは Discord 音声が最終的な TTS 再生を所有するためです。
- `voice.model` が設定されている場合、このボイスチャンネルターンの応答 LLM のみを上書きします。
- `voice.tts` は `messages.tts` の上にマージされ、結果の音声が参加中のチャンネルで再生されます。

認証情報はコンポーネントごとに解決されます。`voice.model` の LLM ルート認証、`tools.media.audio` の STT 認証、`messages.tts`/`voice.tts` の TTS 認証です。

### 音声メッセージ

Discord 音声メッセージは波形プレビューを表示し、OGG/Opus 音声が必要です。OpenClaw は波形を自動生成しますが、検査と変換のために gateway ホスト上の `ffmpeg` と `ffprobe` が必要です。

- **ローカルファイルパス**を指定します（URL は拒否されます）。
- テキスト内容は省略します（Discord は同じペイロード内のテキスト + 音声メッセージを拒否します）。
- 任意の音声形式を受け付けます。OpenClaw は必要に応じて OGG/Opus に変換します。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="許可されていない intent を使用した、または bot が guild メッセージを認識しない">

    - Message Content Intent を有効にする
    - ユーザー/メンバー解決に依存する場合は Server Members Intent を有効にする
    - intent を変更した後に gateway を再起動する

  </Accordion>

  <Accordion title="Guild メッセージが予期せずブロックされる">

    - `groupPolicy` を確認する
    - `channels.discord.guilds` の下にある guild 許可リストを確認する
    - guild `channels` マップが存在する場合、記載されたチャンネルのみが許可される
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

    - 一致する guild/channel 許可リストなしで `groupPolicy="allowlist"` が設定されている
    - `requireMention` が誤った場所に設定されている（`channels.discord.guilds` または channel entry の下である必要があります）
    - 送信者が guild/channel `users` 許可リストによってブロックされている

  </Accordion>

  <Accordion title="長時間実行される Discord ターンまたは重複返信">

    典型的なログ:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord gateway キューの調整項目:

    - 単一アカウント: `channels.discord.eventQueue.listenerTimeout`
    - 複数アカウント: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - これは Discord gateway listener 作業のみを制御し、agent ターンの寿命は制御しません

    Discord は、キューに入った agent ターンにチャンネル所有のタイムアウトを適用しません。メッセージ listener は即座に引き渡し、キューに入った Discord 実行は、セッション/ツール/ランタイムのライフサイクルが完了するか作業を中止するまで、セッションごとの順序を保持します。

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
    OpenClaw は接続前に Discord `/gateway/bot` メタデータを取得します。一時的な失敗時は Discord のデフォルト gateway URL へフォールバックし、ログ出力はレート制限されます。

    メタデータタイムアウトの調整項目:

    - 単一アカウント: `channels.discord.gatewayInfoTimeoutMs`
    - 複数アカウント: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - config が未設定の場合の env フォールバック: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - デフォルト: `30000`（30 秒）、最大: `120000`

  </Accordion>

  <Accordion title="Gateway READY タイムアウト再起動">
    OpenClaw は、起動時とランタイム再接続後に Discord の gateway `READY` イベントを待機します。起動時の段階的開始を行う複数アカウント構成では、デフォルトより長い起動 READY ウィンドウが必要になる場合があります。

    READY タイムアウトの調整項目:

    - 起動時の単一アカウント: `channels.discord.gatewayReadyTimeoutMs`
    - 起動時の複数アカウント: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - config が未設定の場合の起動時 env フォールバック: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 起動時のデフォルト: `15000` (15 秒)、最大: `120000`
    - runtime の単一アカウント: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime の複数アカウント: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - config が未設定の場合の runtime env フォールバック: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - runtime のデフォルト: `30000` (30 秒)、最大: `120000`

  </Accordion>

  <Accordion title="権限監査の不一致">
    `channels status --probe` の権限チェックは、数値のチャンネル ID でのみ機能します。

    slug キーを使用している場合、runtime の照合は引き続き機能しますが、probe は権限を完全には検証できません。

  </Accordion>

  <Accordion title="DM とペアリングの問題">

    - DM が無効: `channels.discord.dm.enabled=false`
    - DM ポリシーが無効: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - `pairing` モードでペアリング承認待ち

  </Accordion>

  <Accordion title="bot 間ループ">
    デフォルトでは、bot が作成したメッセージは無視されます。

    `channels.discord.allowBots=true` を設定する場合は、ループ動作を避けるため、厳格なメンションと許可リストのルールを使用してください。
    bot にメンションする bot メッセージのみを受け入れるには、`channels.discord.allowBots="mentions"` を推奨します。

  </Accordion>

  <Accordion title="Voice STT が DecryptionFailed(...) でドロップする">

    - Discord の voice receive 復旧ロジックが存在するように、OpenClaw を最新に保つ (`openclaw update`)
    - `channels.discord.voice.daveEncryption=true` (デフォルト) を確認する
    - `channels.discord.voice.decryptionFailureTolerance=24` (upstream デフォルト) から始め、必要な場合のみ調整する
    - 次のログを監視する:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 自動再参加後も失敗が続く場合は、ログを収集し、[discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) と [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) の upstream DAVE 受信履歴と比較する

  </Accordion>
</AccordionGroup>

## 設定リファレンス

主要リファレンス: [設定リファレンス - Discord](/ja-JP/gateway/config-channels#discord)。

<Accordion title="重要度の高い Discord フィールド">

- 起動/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- ポリシー: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- コマンド: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- イベントキュー: `eventQueue.listenerTimeout` (listener budget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- 返信/履歴: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 配信: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- ストリーミング: `streaming` (legacy alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- メディア/再試行: `mediaMaxMb` (送信 Discord アップロードを制限、デフォルト `100MB`), `retry`
- アクション: `actions.*`
- プレゼンス: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- 機能: `threadBindings`, top-level `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## 安全性と運用

- bot token は secret として扱う (管理された環境では `DISCORD_BOT_TOKEN` を推奨)。
- Discord 権限は最小権限で付与する。
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
    受信メッセージをエージェントにルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルとハードニング。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    guild とチャンネルをエージェントにマッピングします。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作。
  </Card>
</CardGroup>
