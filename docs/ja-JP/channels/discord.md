---
read_when:
    - Discord チャンネル機能に取り組む
summary: Discord ボットのサポート状況、機能、設定
title: Discord
x-i18n:
    generated_at: "2026-05-07T01:50:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0422fe8a25a7c40d49c4a8c6ec5683c729c09b79d5d03daefc0fcf032f6d75c2
    source_path: channels/discord.md
    workflow: 16
---

Discord 公式 Gateway を介した DM とギルドチャネルに対応しています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Discord の DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作とコマンドカタログ。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断と修復フロー。
  </Card>
</CardGroup>

## クイックセットアップ

ボットを持つ新しいアプリケーションを作成し、そのボットをサーバーに追加して、OpenClaw とペアリングする必要があります。自分専用のプライベートサーバーにボットを追加することをおすすめします。まだ持っていない場合は、まず[作成してください](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends** を選択）。

<Steps>
  <Step title="Discord アプリケーションとボットを作成する">
    [Discord Developer Portal](https://discord.com/developers/applications) に移動し、**New Application** をクリックします。名前は "OpenClaw" などにします。

    サイドバーの **Bot** をクリックします。**Username** は OpenClaw エージェントに付けたい名前に設定します。

  </Step>

  <Step title="特権インテントを有効にする">
    引き続き **Bot** ページで、**Privileged Gateway Intents** までスクロールし、以下を有効にします。

    - **Message Content Intent**（必須）
    - **Server Members Intent**（推奨。ロール許可リストと名前から ID への照合に必要）
    - **Presence Intent**（任意。プレゼンス更新にのみ必要）

  </Step>

  <Step title="ボットトークンをコピーする">
    **Bot** ページの上部に戻り、**Reset Token** をクリックします。

    <Note>
    名前はそうなっていますが、これは最初のトークンを生成するものです。「リセット」されるものはありません。
    </Note>

    トークンをコピーしてどこかに保存します。これが **Bot Token** で、すぐ後で必要になります。

  </Step>

  <Step title="招待 URL を生成し、ボットをサーバーに追加する">
    サイドバーの **OAuth2** をクリックします。ボットをサーバーに追加するために必要な権限を持つ招待 URL を生成します。

    **OAuth2 URL Generator** までスクロールし、以下を有効にします。

    - `bot`
    - `applications.commands`

    下に **Bot Permissions** セクションが表示されます。少なくとも以下を有効にします。

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（任意）

    これは通常のテキストチャネル向けの基本セットです。フォーラムやメディアチャネルのワークフローでスレッドを作成または継続する場合を含め、Discord スレッドに投稿する予定がある場合は、**Send Messages in Threads** も有効にします。
    下部に生成された URL をコピーし、ブラウザーに貼り付けてサーバーを選択し、**Continue** をクリックして接続します。これで Discord サーバー内にボットが表示されるはずです。

  </Step>

  <Step title="Developer Mode を有効にして ID を収集する">
    Discord アプリに戻り、内部 ID をコピーできるように Developer Mode を有効にする必要があります。

    1. **User Settings**（アバター横の歯車アイコン）→ **Advanced** → **Developer Mode** をオンにする
    2. サイドバーの **server icon** を右クリック → **Copy Server ID**
    3. 自分の **own avatar** を右クリック → **Copy User ID**

    **Server ID** と **User ID** を Bot Token と一緒に保存します。次のステップで 3 つすべてを OpenClaw に送ります。

  </Step>

  <Step title="サーバーメンバーからの DM を許可する">
    ペアリングを機能させるには、Discord がボットから自分への DM を許可している必要があります。**server icon** を右クリック → **Privacy Settings** → **Direct Messages** をオンにします。

    これにより、サーバーメンバー（ボットを含む）があなたに DM を送信できるようになります。OpenClaw で Discord の DM を使いたい場合は、この設定を有効のままにしてください。ギルドチャネルだけを使う予定の場合は、ペアリング後に DM を無効にできます。

  </Step>

  <Step title="ボットトークンを安全に設定する（チャットで送信しない）">
    Discord ボットトークンは秘密情報（パスワードのようなもの）です。エージェントにメッセージを送る前に、OpenClaw を実行しているマシンで設定します。

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
    マネージドサービスとしてインストールしている場合は、`DISCORD_BOT_TOKEN` が存在するシェルから `openclaw gateway install` を実行するか、変数を `~/.openclaw/.env` に保存して、再起動後にサービスが env SecretRef を解決できるようにします。
    ホストが Discord の起動時アプリケーション検索でブロックされている、またはレート制限されている場合は、Developer Portal から Discord アプリケーション/クライアント ID を設定すると、起動時にその REST 呼び出しをスキップできます。デフォルトアカウントには `channels.discord.applicationId` を使い、複数の Discord ボットを実行する場合は `channels.discord.accounts.<accountId>.applicationId` を使います。

  </Step>

  <Step title="OpenClaw を設定してペアリングする">

    <Tabs>
      <Tab title="エージェントに依頼する">
        既存の任意のチャネル（例: Telegram）で OpenClaw エージェントとチャットし、伝えます。Discord が最初のチャネルの場合は、代わりに CLI / config タブを使います。

        > "I already set my Discord bot token in config. Please finish Discord setup with User ID `<user_id>` and Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        ファイルベースの設定を使いたい場合は、以下を設定します。

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

        スクリプト化されたセットアップやリモートセットアップでは、同じ JSON5 ブロックを `openclaw config patch --file ./discord.patch.json5 --dry-run` で書き込み、その後 `--dry-run` なしで再実行します。平文の `token` 値がサポートされています。SecretRef 値も env/file/exec プロバイダー全体で `channels.discord.token` に対応しています。[シークレット管理](/ja-JP/gateway/secrets) を参照してください。

        複数の Discord ボットでは、各ボットトークンとアプリケーション ID をそれぞれのアカウント配下に保持します。トップレベルの `channels.discord.applicationId` はアカウントに継承されるため、すべてのアカウントで同じアプリケーション ID を使う場合にのみそこへ設定します。

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
    Gateway が実行されるまで待ってから、Discord でボットに DM を送ります。ペアリングコードが返信されます。

    <Tabs>
      <Tab title="エージェントに依頼する">
        既存のチャネルでエージェントにペアリングコードを送ります。

        > "Approve this Discord pairing code: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    ペアリングコードは 1 時間で期限切れになります。

    これで、DM 経由で Discord のエージェントとチャットできるようになります。

  </Step>
</Steps>

<Note>
トークン解決はアカウント対応です。設定のトークン値は env フォールバックより優先されます。`DISCORD_BOT_TOKEN` はデフォルトアカウントにのみ使われます。
有効化された 2 つの Discord アカウントが同じボットトークンに解決される場合、OpenClaw はそのトークンに対して 1 つの Gateway モニターだけを開始します。設定由来のトークンはデフォルトの env フォールバックより優先されます。それ以外の場合は最初に有効化されたアカウントが優先され、重複アカウントは無効として報告されます。
高度なアウトバウンド呼び出し（メッセージツール/チャネルアクション）では、呼び出しごとの明示的な `token` がその呼び出しに使われます。これは送信と読み取り/プローブ形式のアクション（例: read/search/fetch/thread/pins/permissions）に適用されます。アカウントポリシー/再試行設定は引き続き、アクティブなランタイムスナップショットで選択されたアカウントから取得されます。
</Note>

## 推奨: ギルドワークスペースをセットアップする

DM が動作するようになったら、Discord サーバーを完全なワークスペースとしてセットアップできます。各チャネルには、それぞれ独自のコンテキストを持つ独自のエージェントセッションが割り当てられます。自分とボットだけがいるプライベートサーバーではこれをおすすめします。

<Steps>
  <Step title="サーバーをギルド許可リストに追加する">
    これにより、エージェントは DM だけでなく、サーバー上の任意のチャネルで応答できるようになります。

    <Tabs>
      <Tab title="エージェントに依頼する">
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

  <Step title="@mention なしでの応答を許可する">
    デフォルトでは、エージェントは @mentioned された場合にのみギルドチャネルで応答します。プライベートサーバーでは、おそらくすべてのメッセージに応答してほしいはずです。

    ギルドチャネルでは、通常のアシスタントの最終返信はデフォルトで非公開のままです。表示される Discord 出力は `message` ツールで明示的に送信する必要があるため、エージェントはデフォルトで待機し、チャネルへの返信が有用だと判断した場合にのみ投稿できます。

    つまり、選択されたモデルは確実にツールを呼び出せる必要があります。Discord で入力中表示が出て、ログにはトークン使用量が表示されているのにメッセージが投稿されない場合は、セッションログで `didSendViaMessagingTool: false` を含むアシスタントテキストを確認してください。これは、モデルが `message(action=send)` を呼び出す代わりに、非公開の最終回答を生成したことを意味します。より強いツール呼び出しモデルに切り替えるか、下の設定を使って従来の自動最終返信を復元してください。

    <Tabs>
      <Tab title="エージェントに依頼する">
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

        グループ/チャネルルームで従来の自動最終返信を復元するには、`messages.groupChat.visibleReplies: "automatic"` を設定します。

      </Tab>
    </Tabs>

  </Step>

  <Step title="ギルドチャネルでのメモリを計画する">
    デフォルトでは、長期メモリ（MEMORY.md）は DM セッションでのみ読み込まれます。ギルドチャネルでは MEMORY.md は自動読み込みされません。

    <Tabs>
      <Tab title="エージェントに依頼する">
        > "When I ask questions in Discord channels, use memory_search or memory_get if you need long-term context from MEMORY.md."
      </Tab>
      <Tab title="手動">
        すべてのチャネルで共有コンテキストが必要な場合は、安定した指示を `AGENTS.md` または `USER.md` に入れてください（これらはすべてのセッションに挿入されます）。長期メモは `MEMORY.md` に保持し、必要に応じてメモリツールでアクセスします。
      </Tab>
    </Tabs>

  </Step>
</Steps>

これで、Discord サーバー上にいくつかチャネルを作成してチャットを開始できます。エージェントはチャネル名を確認でき、各チャネルには独自の分離されたセッションが割り当てられます。そのため、`#coding`、`#home`、`#research` など、ワークフローに合うものを設定できます。

## ランタイムモデル

- Gateway が Discord 接続を所有します。
- 返信ルーティングは決定的です。Discord の受信返信は Discord に戻ります。
- Discord のギルド/チャンネルメタデータは、ユーザーに見える返信プレフィックスとしてではなく、信頼されないコンテキストとしてモデルプロンプトに追加されます。モデルがそのエンベロープをコピーして返した場合、OpenClaw は送信返信と今後のリプレイコンテキストから、コピーされたメタデータを削除します。
- デフォルトでは（`session.dmScope=main`）、ダイレクトチャットはエージェントのメインセッション（`agent:main:main`）を共有します。
- ギルドチャンネルは分離されたセッションキーです（`agent:<agentId>:discord:channel:<channelId>`）。
- グループ DM はデフォルトで無視されます（`channels.discord.dm.groupEnabled=false`）。
- ネイティブのスラッシュコマンドは分離されたコマンドセッション（`agent:<agentId>:discord:slash:<userId>`）で実行されますが、ルーティング先の会話セッションへの `CommandTargetSessionKey` は引き続き保持します。
- Discord へのテキストのみの cron/heartbeat 通知配信では、最終的にアシスタントに見える回答を 1 回だけ使用します。メディアと構造化コンポーネントのペイロードは、エージェントが複数の配信可能ペイロードを出力した場合、複数メッセージのままです。

## フォーラムチャンネル

Discord のフォーラムチャンネルとメディアチャンネルはスレッド投稿のみを受け付けます。OpenClaw は、それらを作成する方法を 2 つサポートしています。

- フォーラム親（`channel:<forumId>`）にメッセージを送信して、スレッドを自動作成します。スレッドタイトルには、メッセージの最初の空でない行が使われます。
- `openclaw message thread create` を使用して、スレッドを直接作成します。フォーラムチャンネルでは `--message-id` を渡さないでください。

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

フォーラム親は Discord コンポーネントを受け付けません。コンポーネントが必要な場合は、スレッド自体（`channel:<threadId>`）に送信してください。

## インタラクティブコンポーネント

OpenClaw は、エージェントメッセージ用の Discord components v2 コンテナをサポートしています。`components` ペイロードとともにメッセージツールを使用します。インタラクション結果は通常の受信メッセージとしてエージェントにルーティングされ、既存の Discord `replyToMode` 設定に従います。

サポートされるブロック:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- アクション行では最大 5 個のボタン、または単一の選択メニューを使用できます
- 選択タイプ: `string`, `user`, `role`, `mentionable`, `channel`

デフォルトでは、コンポーネントは 1 回限りです。ボタン、選択、フォームを期限切れになるまで複数回使用できるようにするには、`components.reusable=true` を設定します。

ボタンをクリックできるユーザーを制限するには、そのボタンに `allowedUsers` を設定します（Discord ユーザー ID、タグ、または `*`）。設定されている場合、一致しないユーザーにはエフェメラルな拒否が返されます。

`/model` と `/models` スラッシュコマンドは、プロバイダー、モデル、互換ランタイムのドロップダウンと送信ステップを備えたインタラクティブなモデルピッカーを開きます。`/models add` は非推奨になっており、チャットからモデルを登録する代わりに非推奨メッセージを返します。ピッカーの返信はエフェメラルで、呼び出したユーザーだけが使用できます。

ファイル添付:

- `file` ブロックは添付参照（`attachment://<filename>`）を指している必要があります
- 添付は `media`/`path`/`filePath`（単一ファイル）で指定します。複数ファイルには `media-gallery` を使用します
- アップロード名を添付参照と一致させる必要がある場合は、`filename` を使用して上書きします

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
  <Tab title="DM policy">
    `channels.discord.dmPolicy` は DM アクセスを制御します。`channels.discord.allowFrom` は正規の DM 許可リストです。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.discord.allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    DM ポリシーが open でない場合、不明なユーザーはブロックされます（または `pairing` モードではペアリングを求められます）。

    複数アカウントの優先順位:

    - `channels.discord.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 1 つのアカウントでは、`allowFrom` がレガシーの `dm.allowFrom` より優先されます。
    - 名前付きアカウントは、自身の `allowFrom` とレガシーの `dm.allowFrom` が未設定の場合、`channels.discord.allowFrom` を継承します。
    - 名前付きアカウントは `channels.discord.accounts.default.allowFrom` を継承しません。

    レガシーの `channels.discord.dm.policy` と `channels.discord.dm.allowFrom` は、互換性のために引き続き読み取られます。`openclaw doctor --fix` は、アクセスを変更せずに実行できる場合、それらを `dmPolicy` と `allowFrom` に移行します。

    配信用の DM ターゲット形式:

    - `user:<id>`
    - `<@id>` メンション

    通常、チャンネルデフォルトが有効な場合、裸の数値 ID はチャンネル ID として解決されますが、アカウントの有効な DM `allowFrom` に記載されている ID は、互換性のためにユーザー DM ターゲットとして扱われます。

  </Tab>

  <Tab title="DM access groups">
    Discord DM では、`channels.discord.allowFrom` 内で動的な `accessGroup:<name>` エントリを使用できます。

    アクセスグループ名はメッセージチャンネル間で共有されます。メンバーを各チャンネルの通常の `allowFrom` 構文で表す静的グループには `type: "message.senders"` を使用し、Discord チャンネルの現在の `ViewChannel` オーディエンスでメンバーシップを動的に定義する場合は `type: "discord.channelAudience"` を使用します。共有アクセスグループの動作はここで説明されています: [アクセスグループ](/ja-JP/channels/access-groups)。

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

    Discord テキストチャンネルには別個のメンバー一覧がありません。`type: "discord.channelAudience"` はメンバーシップを次のようにモデル化します。DM 送信者は設定済みギルドのメンバーであり、ロールとチャンネルの上書きが適用された後、設定済みチャンネルに対する有効な `ViewChannel` 権限を現在持っています。

    例: DM は他の全員に対して閉じたままにしつつ、`#maintainers` を表示できる全員がボットに DM できるようにします。

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

    ルックアップは失敗時に閉じます。Discord が `Missing Access` を返す、メンバールックアップが失敗する、またはチャンネルが別のギルドに属している場合、DM 送信者は未承認として扱われます。

    チャンネルオーディエンスのアクセスグループを使用する場合は、ボットに対して Discord Developer Portal の **Server Members Intent** を有効にしてください。DM にはギルドメンバー状態が含まれないため、OpenClaw は承認時に Discord REST を通じてメンバーを解決します。

  </Tab>

  <Tab title="Guild policy">
    ギルドの処理は `channels.discord.groupPolicy` によって制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` が存在する場合の安全なベースラインは `allowlist` です。

    `allowlist` の動作:

    - ギルドは `channels.discord.guilds` と一致する必要があります（`id` 推奨、slug も受け付けます）
    - 任意の送信者許可リスト: `users`（安定した ID を推奨）と `roles`（ロール ID のみ）。どちらかが設定されている場合、送信者は `users` または `roles` に一致すると許可されます
    - 直接の名前/タグ一致はデフォルトで無効です。緊急時の互換モードとしてのみ `channels.discord.dangerouslyAllowNameMatching: true` を有効にしてください
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

    `DISCORD_BOT_TOKEN` だけを設定し、`channels.discord` ブロックを作成しない場合、実行時フォールバックは `groupPolicy="allowlist"`（ログに警告あり）になります。これは `channels.defaults.groupPolicy` が `open` であっても同じです。

  </Tab>

  <Tab title="Mentions and group DMs">
    ギルドメッセージはデフォルトでメンションゲートされます。

    メンション検出には次が含まれます。

    - 明示的なボットメンション
    - 設定済みのメンションパターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - サポートされる場合の暗黙的なボットへの返信動作

    Discord 送信メッセージを書くときは、正規のメンション構文を使用してください。ユーザーは `<@USER_ID>`、チャンネルは `<#CHANNEL_ID>`、ロールは `<@&ROLE_ID>` です。レガシーの `<@!USER_ID>` ニックネームメンション形式は使用しないでください。

    `requireMention` はギルド/チャンネルごとに設定します（`channels.discord.guilds...`）。
    `ignoreOtherMentions` は、別のユーザー/ロールにはメンションしているがボットにはメンションしていないメッセージを任意で破棄します（@everyone/@here は除外）。

    グループ DM:

    - デフォルト: 無視（`dm.groupEnabled=false`）
    - `dm.groupChannels` による任意の許可リスト（チャンネル ID または slug）

  </Tab>
</Tabs>

### ロールベースのエージェントルーティング

`bindings[].match.roles` を使用して、Discord ギルドメンバーをロール ID によって別のエージェントにルーティングします。ロールベースのバインディングはロール ID のみを受け付け、ピアまたは親ピアのバインディングの後、ギルドのみのバインディングの前に評価されます。バインディングが他の一致フィールド（例: `peer` + `guildId` + `roles`）も設定している場合、設定されたすべてのフィールドが一致する必要があります。

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
- チャンネルごとのオーバーライド: `channels.discord.commands.native`。
- `commands.native=false` は、起動中の Discord スラッシュコマンド登録とクリーンアップをスキップします。以前に登録されたコマンドは、Discord アプリから削除するまで Discord に表示されたままになることがあります。
- ネイティブコマンド認証は、通常のメッセージ処理と同じ Discord allowlist/ポリシーを使用します。
- 認可されていないユーザーにも、コマンドが Discord UI に表示されることがあります。実行時には引き続き OpenClaw 認証が適用され、"not authorized" が返されます。

コマンドカタログと動作については、[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

デフォルトのスラッシュコマンド設定:

- `ephemeral: true`

## 機能の詳細

<AccordionGroup>
  <Accordion title="返信タグとネイティブ返信">
    Discord はエージェント出力内の返信タグをサポートします。

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` で制御します。

    - `off` (デフォルト)
    - `first`
    - `all`
    - `batched`

    注: `off` は暗黙的な返信スレッド化を無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。
    `first` は、そのターンの最初の送信 Discord メッセージに暗黙的なネイティブ返信参照を常に付加します。
    `batched` は、受信ターンが複数メッセージのデバウンス済みバッチだった場合にのみ、Discord の暗黙的なネイティブ返信参照を付加します。これは、すべての単一メッセージターンではなく、主に曖昧で突発的なチャットにネイティブ返信を使いたい場合に便利です。

    メッセージ ID はコンテキスト/履歴に表示されるため、エージェントは特定のメッセージを対象にできます。

  </Accordion>

  <Accordion title="ライブストリームプレビュー">
    OpenClaw は、一時メッセージを送信し、テキストが到着するにつれてそれを編集することで、下書き返信をストリーミングできます。`channels.discord.streaming` は `off` | `partial` | `block` | `progress` (デフォルト) を受け取ります。`progress` は編集可能なステータス下書きを 1 つ維持し、最終配信までツール進捗で更新します。`streamMode` は従来のランタイムエイリアスです。永続化された設定を正規キーに書き換えるには、`openclaw doctor --fix` を実行してください。

    Discord プレビュー編集を無効にするには、`channels.discord.streaming.mode` を `off` に設定します。Discord ブロックストリーミングが明示的に有効な場合、二重ストリーミングを避けるため、OpenClaw はプレビューストリームをスキップします。

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

    - `partial` は、トークンが到着するにつれて単一のプレビューメッセージを編集します。
    - `block` は下書きサイズのチャンクを出力します (サイズとブレークポイントの調整には `draftChunk` を使用し、`textChunkLimit` に制限されます)。
    - メディア、エラー、明示的返信の最終出力は、保留中のプレビュー編集をキャンセルします。
    - `streaming.preview.toolProgress` (デフォルト `true`) は、ツール/進捗更新がプレビューメッセージを再利用するかどうかを制御します。
    - `streaming.preview.commandText` / `streaming.progress.commandText` は、コンパクトな進捗行でのコマンド/実行詳細を制御します: `raw` (デフォルト) または `status` (ツールラベルのみ)。

    コンパクトな進捗行を維持しながら、生のコマンド/実行テキストを非表示にします。

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

    プレビューストリーミングはテキストのみです。メディア返信は通常の配信にフォールバックします。`block` ストリーミングが明示的に有効な場合、二重ストリーミングを避けるため、OpenClaw はプレビューストリームをスキップします。

  </Accordion>

  <Accordion title="履歴、コンテキスト、スレッド動作">
    ギルド履歴コンテキスト:

    - `channels.discord.historyLimit` のデフォルトは `20`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` は無効化します

    DM 履歴コントロール:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    スレッド動作:

    - Discord スレッドはチャンネルセッションとしてルーティングされ、オーバーライドされない限り親チャンネル設定を継承します。
    - スレッドセッションは、モデルのみのフォールバックとして、親チャンネルのセッションレベルの `/model` 選択を継承します。スレッドローカルの `/model` 選択は引き続き優先され、トランスクリプト継承が有効でない限り、親のトランスクリプト履歴はコピーされません。
    - `channels.discord.thread.inheritParent` (デフォルト `false`) は、新しい自動スレッドを親トランスクリプトからのシード対象にします。アカウントごとのオーバーライドは `channels.discord.accounts.<id>.thread.inheritParent` 配下にあります。
    - メッセージツールのリアクションは `user:<id>` DM ターゲットを解決できます。
    - `guilds.<guild>.channels.<channel>.requireMention: false` は、返信段階のアクティベーションフォールバック中に保持されます。

    チャンネルトピックは **信頼されていない** コンテキストとして注入されます。Allowlist は、誰がエージェントをトリガーできるかを制御しますが、完全な補足コンテキストの秘匿境界ではありません。

  </Accordion>

  <Accordion title="サブエージェント用のスレッド紐付けセッション">
    Discord は、スレッドをセッションターゲットに紐付けることで、そのスレッド内の後続メッセージを同じセッション (サブエージェントセッションを含む) にルーティングし続けることができます。

    コマンド:

    - `/focus <target>` 現在/新規スレッドをサブエージェント/セッションターゲットに紐付ける
    - `/unfocus` 現在のスレッド紐付けを削除する
    - `/agents` アクティブな実行と紐付け状態を表示する
    - `/session idle <duration|off>` フォーカス中の紐付けの非アクティブ時自動解除を確認/更新する
    - `/session max-age <duration|off>` フォーカス中の紐付けのハード最大期間を確認/更新する

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
    - `spawnSessions` は、`sessions_spawn({ thread: true })` と ACP スレッド生成でスレッドを自動作成/紐付けするかを制御します。デフォルト: `true`。
    - `defaultSpawnContext` は、スレッド紐付け生成のネイティブサブエージェントコンテキストを制御します。デフォルト: `"fork"`。
    - 非推奨の `spawnSubagentSessions`/`spawnAcpSessions` キーは、`openclaw doctor --fix` によって移行されます。
    - アカウントでスレッド紐付けが無効になっている場合、`/focus` および関連するスレッド紐付け操作は利用できません。

    [サブエージェント](/ja-JP/tools/subagents)、[ACP エージェント](/ja-JP/tools/acp-agents)、[設定リファレンス](/ja-JP/gateway/configuration-reference) を参照してください。

  </Accordion>

  <Accordion title="永続 ACP チャンネル紐付け">
    安定した「常時オン」の ACP ワークスペースでは、Discord 会話を対象とするトップレベルの型付き ACP 紐付けを設定します。

    設定パス:

    - `bindings[]` と `type: "acp"`、`match.channel: "discord"`

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

    - `/acp spawn codex --bind here` は現在のチャンネルまたはスレッドをその場で紐付け、以降のメッセージを同じ ACP セッションに維持します。スレッドメッセージは親チャンネルの紐付けを継承します。
    - 紐付け済みチャンネルまたはスレッドでは、`/new` と `/reset` は同じ ACP セッションをその場でリセットします。一時的なスレッド紐付けは、アクティブな間、ターゲット解決をオーバーライドできます。
    - `spawnSessions` は、`--thread auto|here` による子スレッドの作成/紐付けを制御します。

    紐付け動作の詳細については、[ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

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
    `ackReaction` は、OpenClaw が受信メッセージを処理している間に確認絵文字を送信します。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - エージェント ID 絵文字フォールバック (`agents.list[].identity.emoji`、それ以外は "👀")

    注:

    - Discord は Unicode 絵文字またはカスタム絵文字名を受け付けます。
    - チャンネルまたはアカウントのリアクションを無効にするには、`""` を使用します。

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
    `channels.discord.proxy` を使用して、Discord Gateway WebSocket トラフィックと起動時の REST 参照 (アプリケーション ID + allowlist 解決) を HTTP(S) プロキシ経由でルーティングします。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    アカウントごとのオーバーライド:

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

    - allowlist は `pk:<memberId>` を使用できます
    - `channels.discord.dangerouslyAllowNameMatching: true` の場合にのみ、メンバー表示名は名前/スラッグで照合されます
    - 参照には元のメッセージ ID が使用され、時間ウィンドウで制限されます
    - 参照に失敗した場合、プロキシされたメッセージは Bot メッセージとして扱われ、`allowBots=true` でない限りドロップされます

  </Accordion>

  <Accordion title="送信メンションエイリアス">
    既知の Discord ユーザーに対して、エージェントが決定的な送信メンションを必要とする場合は `mentionAliases` を使用します。キーは先頭の `@` なしのハンドルで、値は Discord ユーザー ID です。不明なハンドル、`@everyone`、`@here`、Markdown コードスパン内のメンションは変更されません。

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

    アクティビティ例 (カスタムステータスはデフォルトのアクティビティタイプです):

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

    ストリーミング例:

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

    - 0: Playing
    - 1: Streaming (`activityUrl` が必要)
    - 2: Listening
    - 3: Watching
    - 4: Custom (アクティビティテキストをステータス状態として使用します。絵文字は任意です)
    - 5: Competing

    自動プレゼンス例 (ランタイム健全性シグナル):

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

    自動プレゼンスは、実行時の可用性を Discord ステータスに対応付けます: healthy => online、degraded または unknown => idle、exhausted または unavailable => dnd。任意のテキスト上書き:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` プレースホルダーに対応)

  </Accordion>

  <Accordion title="Discord での承認">
    Discord は DM でボタンベースの承認処理に対応し、必要に応じて承認プロンプトを発信元チャンネルに投稿できます。

    設定パス:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (任意。可能な場合は `commands.ownerAllowFrom` にフォールバック)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`、デフォルト: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord は、`enabled` が未設定または `"auto"` で、`execApprovals.approvers` または `commands.ownerAllowFrom` から少なくとも 1 人の承認者を解決できる場合、ネイティブ exec 承認を自動的に有効化します。Discord は、チャンネル `allowFrom`、従来の `dm.allowFrom`、またはダイレクトメッセージの `defaultTo` から exec 承認者を推測しません。Discord をネイティブ承認クライアントとして明示的に無効化するには、`enabled: false` を設定します。

    `/diagnostics` や `/export-trajectory` のような機密性の高い所有者専用グループコマンドでは、OpenClaw は承認プロンプトと最終結果を非公開で送信します。呼び出した所有者に Discord 所有者ルートがある場合は、まず Discord DM を試します。利用できない場合は、Telegram など、`commands.ownerAllowFrom` から利用可能な最初の所有者ルートにフォールバックします。

    `target` が `channel` または `both` の場合、承認プロンプトはチャンネル内に表示されます。解決済みの承認者だけがボタンを使用できます。他のユーザーには一時的な拒否が返されます。承認プロンプトにはコマンドテキストが含まれるため、信頼済みチャンネルでのみチャンネル配信を有効化してください。セッションキーからチャンネル ID を導出できない場合、OpenClaw は DM 配信にフォールバックします。

    Discord は、他のチャットチャンネルで使用される共有承認ボタンもレンダリングします。ネイティブ Discord アダプターは主に、承認者 DM ルーティングとチャンネルへのファンアウトを追加します。
    これらのボタンが存在する場合、それらが主要な承認 UX です。OpenClaw は、
    ツール結果がチャット承認を利用できない、または手動承認が唯一の経路であると示す場合にのみ、
    手動の `/approve` コマンドを含める必要があります。
    Discord ネイティブ承認ランタイムがアクティブでない場合、OpenClaw は
    ローカルで決定論的な `/approve <id> <decision>` プロンプトを表示したままにします。
    ランタイムはアクティブだが、ネイティブカードをどのターゲットにも配信できない場合、
    OpenClaw は保留中の承認から正確な `/approve` コマンドを含む同一チャットのフォールバック通知を送信します。

    Gateway 認証と承認解決は共有 Gateway クライアント契約に従います (`plugin:` ID は `plugin.approval.resolve` を通じて解決され、その他の ID は `exec.approval.resolve` を通じて解決されます)。承認はデフォルトで 30 分後に期限切れになります。

    [Exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## ツールとアクションゲート

Discord メッセージアクションには、メッセージング、チャンネル管理、モデレーション、プレゼンス、メタデータのアクションが含まれます。

基本例:

- メッセージング: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- リアクション: `react`, `reactions`, `emojiList`
- モデレーション: `timeout`, `kick`, `ban`
- プレゼンス: `setPresence`

`event-create` アクションは、スケジュール済みイベントのカバー画像を設定するための任意の `image` パラメーター (URL またはローカルファイルパス) を受け取ります。

アクションゲートは `channels.discord.actions.*` 配下にあります。

デフォルトのゲート動作:

| アクショングループ                                                                                                                                                       | デフォルト |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled    |
| roles                                                                                                                                                                    | disabled   |
| moderation                                                                                                                                                               | disabled   |
| presence                                                                                                                                                                 | disabled   |

## Components v2 UI

OpenClaw は exec 承認とクロスコンテキストマーカーに Discord components v2 を使用します。Discord メッセージアクションは、カスタム UI 用の `components` も受け取れます (上級者向け。discord ツールを通じてコンポーネントペイロードを構築する必要があります)。従来の `embeds` も引き続き利用できますが、推奨されません。

- `channels.discord.ui.components.accentColor` は、Discord コンポーネントコンテナーで使用されるアクセントカラー (hex) を設定します。
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

Discord には 2 つの異なる音声サーフェスがあります: リアルタイムの**音声チャンネル** (継続的な会話) と**音声メッセージ添付ファイル** (波形プレビュー形式)。Gateway は両方に対応しています。

### 音声チャンネル

セットアップチェックリスト:

1. Discord Developer Portal で Message Content Intent を有効化します。
2. ロール/ユーザー許可リストを使用する場合は Server Members Intent を有効化します。
3. `bot` と `applications.commands` スコープで bot を招待します。
4. 対象の音声チャンネルで Connect、Speak、Send Messages、Read Message History を付与します。
5. ネイティブコマンド (`commands.native` または `channels.discord.commands.native`) を有効化します。
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

注:

- `voice.tts` は音声再生に限り `messages.tts` を上書きします。
- `voice.model` は Discord 音声チャンネル応答で使用される LLM に限り上書きします。未設定のままにすると、ルーティングされたエージェントモデルを継承します。
- STT は `tools.media.audio` を使用します。`voice.model` は文字起こしに影響しません。
- チャンネルごとの Discord `systemPrompt` 上書きは、その音声チャンネルの音声トランスクリプトターンに適用されます。
- 音声トランスクリプトターンは、Discord `allowFrom` (または `dm.allowFrom`) から所有者ステータスを導出します。所有者でない話者は、所有者専用ツール (例: `gateway` と `cron`) にアクセスできません。
- Discord 音声はテキストのみの設定ではオプトインです。`/vc` コマンド、音声ランタイム、`GuildVoiceStates` Gateway intent を有効化するには、`channels.discord.voice.enabled=true` を設定します (または既存の `channels.discord.voice` ブロックを維持します)。
- `channels.discord.intents.voiceStates` は、音声状態 intent サブスクリプションを明示的に上書きできます。intent が有効な音声有効化状態に従うようにするには、未設定のままにします。
- `voice.daveEncryption` と `voice.decryptionFailureTolerance` は `@discordjs/voice` 参加オプションにそのまま渡されます。
- 未設定の場合、`@discordjs/voice` のデフォルトは `daveEncryption=true` と `decryptionFailureTolerance=24` です。
- `voice.connectTimeoutMs` は、`/vc join` と自動参加試行で最初の `@discordjs/voice` Ready 待機を制御します。デフォルト: `30000`。
- `voice.reconnectGraceMs` は、切断された音声セッションが再接続を開始するまで OpenClaw が待機する時間を制御し、その後に破棄します。デフォルト: `15000`。
- OpenClaw は受信復号失敗も監視し、短い時間枠で失敗が繰り返された場合、音声チャンネルを退出して再参加することで自動復旧します。
- 更新後に受信ログで `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` が繰り返し表示される場合は、依存関係レポートとログを収集してください。バンドルされた `@discordjs/voice` 系統には、discord.js issue #11419 をクローズした discord.js PR #11449 のアップストリーム padding 修正が含まれています。

音声チャンネルパイプライン:

- Discord PCM キャプチャは WAV 一時ファイルに変換されます。
- `tools.media.audio` が STT を処理します。例: `openai/gpt-4o-mini-transcribe`。
- トランスクリプトは Discord ingress とルーティングを通じて送信され、応答 LLM は音声出力ポリシー付きで実行されます。このポリシーはエージェントの `tts` ツールを隠し、返却テキストを要求します。最終的な TTS 再生は Discord 音声が所有するためです。
- `voice.model` が設定されている場合、この音声チャンネルターンの応答 LLM だけを上書きします。
- `voice.tts` は `messages.tts` にマージされ、生成された音声が参加中のチャンネルで再生されます。

資格情報はコンポーネントごとに解決されます: `voice.model` の LLM ルート認証、`tools.media.audio` の STT 認証、`messages.tts`/`voice.tts` の TTS 認証です。

### 音声メッセージ

Discord 音声メッセージは波形プレビューを表示し、OGG/Opus 音声を必要とします。OpenClaw は波形を自動生成しますが、検査と変換のために Gateway ホスト上の `ffmpeg` と `ffprobe` が必要です。

- **ローカルファイルパス**を指定します (URL は拒否されます)。
- テキストコンテンツは省略します (Discord は同じペイロード内のテキスト + 音声メッセージを拒否します)。
- 任意の音声形式を受け付けます。OpenClaw は必要に応じて OGG/Opus に変換します。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="許可されていない intent を使用した、または bot が guild メッセージを認識しない">

    - Message Content Intent を有効化する
    - ユーザー/メンバー解決に依存する場合は Server Members Intent を有効化する
    - intent 変更後に Gateway を再起動する

  </Accordion>

  <Accordion title="Guild メッセージが予期せずブロックされる">

    - `groupPolicy` を確認する
    - `channels.discord.guilds` 配下の guild 許可リストを確認する
    - guild `channels` マップが存在する場合、一覧にあるチャンネルだけが許可される
    - `requireMention` の動作と mention パターンを確認する

    役立つ確認:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention が false だがまだブロックされる">
    一般的な原因:

    - 一致する guild/チャンネル許可リストがない `groupPolicy="allowlist"`
    - `requireMention` が誤った場所に設定されている (`channels.discord.guilds` またはチャンネルエントリ配下でなければならない)
    - 送信者が guild/チャンネル `users` 許可リストによってブロックされている

  </Accordion>

  <Accordion title="長時間実行される Discord ターンまたは重複返信">

    典型的なログ:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway キュー調整項目:

    - 単一アカウント: `channels.discord.eventQueue.listenerTimeout`
    - 複数アカウント: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - これは Discord Gateway リスナー処理のみを制御し、エージェントターンの寿命は制御しない

    Discord は、キューに入ったエージェントターンにチャンネル所有のタイムアウトを適用しません。メッセージリスナーは即座に引き渡し、キューに入った Discord 実行は、セッション/ツール/ランタイムライフサイクルが完了するか処理を中止するまで、セッションごとの順序を維持します。

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

  <Accordion title="Gateway メタデータ取得タイムアウト警告">
    OpenClaw は接続前に Discord の `/gateway/bot` メタデータを取得します。一時的な失敗時は Discord のデフォルト Gateway URL にフォールバックし、ログではレート制限されます。

    メタデータタイムアウトの調整項目:

    - 単一アカウント: `channels.discord.gatewayInfoTimeoutMs`
    - 複数アカウント: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 設定が未設定の場合の env フォールバック: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - デフォルト: `30000` (30 秒)、最大: `120000`

  </Accordion>

  <Accordion title="Gateway READY タイムアウトによる再起動">
    OpenClaw は起動時とランタイム再接続後に Discord の Gateway `READY` イベントを待機します。起動をずらす複数アカウント構成では、デフォルトより長い起動時 READY ウィンドウが必要になる場合があります。

    READY タイムアウトの調整項目:

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
    `channels status --probe` の権限チェックは数値のチャンネル ID でのみ機能します。

    slug キーを使用している場合、ランタイム照合は引き続き機能しますが、probe は権限を完全には検証できません。

  </Accordion>

  <Accordion title="DM とペアリングの問題">

    - DM 無効: `channels.discord.dm.enabled=false`
    - DM ポリシー無効: `channels.discord.dmPolicy="disabled"` (レガシー: `channels.discord.dm.policy`)
    - `pairing` モードでペアリング承認待ち

  </Accordion>

  <Accordion title="Bot 間ループ">
    デフォルトでは bot が作成したメッセージは無視されます。

    `channels.discord.allowBots=true` を設定する場合は、ループ動作を避けるために厳格な mention と allowlist ルールを使用してください。
    bot への mention を含む bot メッセージのみを受け入れるには、`channels.discord.allowBots="mentions"` を推奨します。

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

    - Discord 音声受信の復旧ロジックが含まれるよう、OpenClaw を最新に保つ (`openclaw update`)
    - `channels.discord.voice.daveEncryption=true` を確認する (デフォルト)
    - `channels.discord.voice.decryptionFailureTolerance=24` (upstream のデフォルト) から始め、必要な場合のみ調整する
    - 次のログを監視する:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 自動再参加後も失敗が続く場合は、ログを収集し、[discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) と [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) の upstream DAVE 受信履歴と比較する

  </Accordion>
</AccordionGroup>

## 設定リファレンス

主要リファレンス: [設定リファレンス - Discord](/ja-JP/gateway/config-channels#discord)。

<Accordion title="高シグナルの Discord フィールド">

- 起動/認証: `enabled`, `token`, `accounts.*`, `allowBots`
- ポリシー: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- コマンド: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- イベントキュー: `eventQueue.listenerTimeout` (listener 予算), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- 返信/履歴: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 配信: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- ストリーミング: `streaming` (レガシーエイリアス: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- メディア/リトライ: `mediaMaxMb` (Discord への outbound アップロードを上限設定、デフォルト `100MB`), `retry`
- アクション: `actions.*`
- プレゼンス: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- 機能: `threadBindings`, トップレベル `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## 安全性と運用

- bot token はシークレットとして扱う (監督下の環境では `DISCORD_BOT_TOKEN` を推奨)。
- Discord 権限は最小権限で付与する。
- コマンドのデプロイ/状態が古い場合は、gateway を再起動し、`openclaw channels status --probe` で再確認する。

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Discord ユーザーを gateway にペアリングする。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループチャットと allowlist の動作。
  </Card>
  <Card title="チャンネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントにルーティングする。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルとハードニング。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    guild とチャンネルをエージェントに対応付ける。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作。
  </Card>
</CardGroup>
