---
read_when:
    - Discord チャンネル機能に取り組む
summary: Discord ボットのサポート状況、機能、設定
title: Discord
x-i18n:
    generated_at: "2026-05-07T13:13:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805a093452b7af1c844919cdf776d898c6fd39f63f1bf363967dd471842eebd5
    source_path: channels/discord.md
    workflow: 16
---

公式 Discord gateway 経由で DM とギルドチャンネルに対応します。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Discord の DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復フロー。
  </Card>
</CardGroup>

## クイックセットアップ

bot 付きの新しいアプリケーションを作成し、bot をサーバーに追加して、OpenClaw とペアリングする必要があります。bot は自分専用のプライベートサーバーに追加することをおすすめします。まだサーバーがない場合は、[先に作成してください](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends** を選択）。

<Steps>
  <Step title="Discord アプリケーションと bot を作成する">
    [Discord Developer Portal](https://discord.com/developers/applications) に移動し、**New Application** をクリックします。「OpenClaw」のような名前を付けます。

    サイドバーの **Bot** をクリックします。**Username** を、自分の OpenClaw エージェントに付ける名前に設定します。

  </Step>

  <Step title="特権インテントを有効にする">
    同じ **Bot** ページで、**Privileged Gateway Intents** まで下にスクロールし、次を有効にします。

    - **Message Content Intent**（必須）
    - **Server Members Intent**（推奨。ロール許可リストと名前から ID への照合に必要）
    - **Presence Intent**（任意。プレゼンス更新にのみ必要）

  </Step>

  <Step title="bot トークンをコピーする">
    **Bot** ページの上部に戻り、**Reset Token** をクリックします。

    <Note>
    名前とは異なり、これは最初のトークンを生成します。「リセット」されるものはありません。
    </Note>

    トークンをコピーし、どこかに保存します。これは **Bot Token** で、この後すぐに必要になります。

  </Step>

  <Step title="招待 URL を生成し、bot をサーバーに追加する">
    サイドバーの **OAuth2** をクリックします。bot をサーバーに追加するために必要な権限を持つ招待 URL を生成します。

    **OAuth2 URL Generator** まで下にスクロールし、次を有効にします。

    - `bot`
    - `applications.commands`

    下に **Bot Permissions** セクションが表示されます。少なくとも次を有効にします。

    **General Permissions**
      - チャンネルを表示
    **Text Permissions**
      - メッセージを送信
      - メッセージ履歴を読む
      - リンクを埋め込む
      - ファイルを添付
      - リアクションを追加（任意）

    これは通常のテキストチャンネル向けの基本セットです。フォーラムやメディアチャンネルのワークフローなど、スレッドを作成または継続する Discord スレッドに投稿する予定がある場合は、**Send Messages in Threads** も有効にしてください。
    下部に生成された URL をコピーしてブラウザーに貼り付け、サーバーを選択して **Continue** をクリックして接続します。これで Discord サーバーに bot が表示されるはずです。

  </Step>

  <Step title="開発者モードを有効にして ID を集める">
    Discord アプリに戻り、内部 ID をコピーできるように開発者モードを有効にする必要があります。

    1. **User Settings**（アバター横の歯車アイコン）→ **Advanced** → **Developer Mode** をオン
    2. サイドバーの **サーバーアイコン** を右クリック → **Copy Server ID**
    3. **自分のアバター** を右クリック → **Copy User ID**

    **Server ID** と **User ID** を Bot Token と一緒に保存します。次のステップで 3 つすべてを OpenClaw に送信します。

  </Step>

  <Step title="サーバーメンバーからの DM を許可する">
    ペアリングを機能させるには、Discord が bot からあなたへの DM を許可している必要があります。**サーバーアイコン** を右クリック → **Privacy Settings** → **Direct Messages** をオンにします。

    これにより、サーバーメンバー（bot を含む）があなたに DM を送れるようになります。OpenClaw で Discord の DM を使いたい場合は、この設定を有効のままにします。ギルドチャンネルのみを使う予定なら、ペアリング後に DM を無効にできます。

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
    マネージドサービスインストールの場合は、`DISCORD_BOT_TOKEN` が存在するシェルから `openclaw gateway install` を実行するか、変数を `~/.openclaw/.env` に保存して、再起動後にサービスが env SecretRef を解決できるようにします。
    ホストが Discord の起動時アプリケーション検索でブロックまたはレート制限される場合は、Developer Portal から Discord アプリケーション/クライアント ID を設定し、起動時にその REST 呼び出しをスキップできるようにします。デフォルトアカウントには `channels.discord.applicationId` を使用し、複数の Discord bot を実行する場合は `channels.discord.accounts.<accountId>.applicationId` を使用します。

  </Step>

  <Step title="OpenClaw を設定してペアリングする">

    <Tabs>
      <Tab title="エージェントに依頼">
        既存の任意のチャンネル（例: Telegram）で OpenClaw エージェントとチャットし、次のように伝えます。Discord が最初のチャンネルの場合は、代わりに CLI / config タブを使用します。

        > 「Discord bot トークンはすでに config に設定しました。User ID `<user_id>` と Server ID `<server_id>` で Discord セットアップを完了してください。」
      </Tab>
      <Tab title="CLI / config">
        ファイルベースの config を使用する場合は、次を設定します。

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

        スクリプト化されたセットアップまたはリモートセットアップでは、同じ JSON5 ブロックを `openclaw config patch --file ./discord.patch.json5 --dry-run` で書き込み、その後 `--dry-run` なしで再実行します。平文の `token` 値に対応しています。SecretRef 値も、env/file/exec provider 全体で `channels.discord.token` に対応しています。[シークレット管理](/ja-JP/gateway/secrets) を参照してください。

        複数の Discord bot では、各 bot トークンとアプリケーション ID をそれぞれのアカウント配下に保持します。トップレベルの `channels.discord.applicationId` はアカウントに継承されるため、すべてのアカウントで同じアプリケーション ID を使う場合にのみそこへ設定します。

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
    gateway が実行されるまで待ってから、Discord で bot に DM を送ります。bot がペアリングコードを返します。

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

    これで Discord の DM 経由でエージェントとチャットできるはずです。

  </Step>
</Steps>

<Note>
トークン解決はアカウント対応です。Config のトークン値は env フォールバックより優先されます。`DISCORD_BOT_TOKEN` はデフォルトアカウントにのみ使用されます。
有効化された 2 つの Discord アカウントが同じ bot トークンに解決される場合、OpenClaw はそのトークンに対して gateway モニターを 1 つだけ起動します。config 由来のトークンはデフォルトの env フォールバックより優先されます。それ以外の場合は、最初に有効化されたアカウントが優先され、重複アカウントは無効として報告されます。
高度な送信呼び出し（message ツール/チャンネルアクション）では、明示的な呼び出しごとの `token` がその呼び出しに使用されます。これは送信および読み取り/プローブ系アクション（例: read/search/fetch/thread/pins/permissions）に適用されます。アカウントポリシー/再試行設定は、引き続きアクティブなランタイムスナップショット内で選択されたアカウントから取得されます。
</Note>

## 推奨: ギルドワークスペースを設定する

DM が動作したら、Discord サーバーを完全なワークスペースとして設定できます。各チャンネルには、それぞれ独自のコンテキストを持つエージェントセッションが割り当てられます。これは、あなたと bot だけがいるプライベートサーバーにおすすめです。

<Steps>
  <Step title="サーバーをギルド許可リストに追加する">
    これにより、エージェントは DM だけでなく、サーバー上の任意のチャンネルで応答できるようになります。

    <Tabs>
      <Tab title="エージェントに依頼">
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
    デフォルトでは、エージェントはギルドチャンネルで @mention された場合にのみ応答します。プライベートサーバーでは、おそらくすべてのメッセージに応答させたいはずです。

    ギルドチャンネルでは、通常のアシスタントの最終返信はデフォルトで非公開のままです。表示される Discord 出力は `message` ツールで明示的に送信する必要があるため、エージェントはデフォルトで待機し、チャンネル返信が有用だと判断した場合にのみ投稿できます。

    つまり、選択したモデルはツールを確実に呼び出せる必要があります。Discord で入力中表示が出て、ログにトークン使用量が表示されているのにメッセージが投稿されない場合は、セッションログで `didSendViaMessagingTool: false` の付いたアシスタントテキストを確認してください。これは、モデルが `message(action=send)` を呼び出す代わりに、非公開の最終回答を生成したことを意味します。より強力なツール呼び出しモデルに切り替えるか、下の config を使用して従来の自動最終返信を復元してください。

    <Tabs>
      <Tab title="エージェントに依頼">
        > 「@mention されなくても、このサーバーでエージェントが応答できるようにしてください」
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

        グループ/チャンネルルーム向けの従来の自動最終返信を復元するには、`messages.groupChat.visibleReplies: "automatic"` を設定します。

      </Tab>
    </Tabs>

  </Step>

  <Step title="ギルドチャンネルのメモリを計画する">
    デフォルトでは、長期メモリ（MEMORY.md）は DM セッションでのみ読み込まれます。ギルドチャンネルでは MEMORY.md は自動読み込みされません。

    <Tabs>
      <Tab title="エージェントに依頼">
        > 「Discord チャンネルで質問したとき、MEMORY.md から長期コンテキストが必要な場合は memory_search または memory_get を使ってください。」
      </Tab>
      <Tab title="手動">
        すべてのチャンネルで共有コンテキストが必要な場合は、安定した指示を `AGENTS.md` または `USER.md` に置きます（これらはすべてのセッションに注入されます）。長期メモは `MEMORY.md` に保持し、必要に応じて memory ツールでアクセスします。
      </Tab>
    </Tabs>

  </Step>
</Steps>

これで Discord サーバーにいくつかのチャンネルを作成し、チャットを始められます。エージェントはチャンネル名を参照でき、各チャンネルには独立したセッションが割り当てられます。そのため、`#coding`、`#home`、`#research` など、自分のワークフローに合うものを設定できます。

## ランタイムモデル

- Gateway が Discord 接続を所有します。
- 返信ルーティングは決定的です。Discord の受信返信は Discord に戻されます。
- Discord のギルド/チャンネルメタデータは、ユーザーに見える返信プレフィックスとしてではなく、信頼されないコンテキストとしてモデルプロンプトに追加されます。モデルがそのエンベロープをコピーして返した場合、OpenClaw は送信返信と今後のリプレイコンテキストからコピーされたメタデータを除去します。
- デフォルトでは（`session.dmScope=main`）、ダイレクトチャットはエージェントのメインセッション（`agent:main:main`）を共有します。
- ギルドチャンネルは分離されたセッションキー（`agent:<agentId>:discord:channel:<channelId>`）です。
- グループ DM はデフォルトで無視されます（`channels.discord.dm.groupEnabled=false`）。
- ネイティブのスラッシュコマンドは分離されたコマンドセッション（`agent:<agentId>:discord:slash:<userId>`）で実行されますが、ルーティング先の会話セッションには `CommandTargetSessionKey` を引き続き運びます。
- Discord へのテキストのみの cron/heartbeat 通知配信では、最終的にアシスタントに見える回答を 1 回使用します。メディアと構造化コンポーネントのペイロードは、エージェントが複数の配信可能なペイロードを発行する場合、複数メッセージのままです。

## フォーラムチャンネル

Discord のフォーラムチャンネルとメディアチャンネルはスレッド投稿のみを受け付けます。OpenClaw はそれらを作成する 2 つの方法をサポートします。

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

OpenClaw はエージェントメッセージ向けに Discord コンポーネント v2 コンテナをサポートします。`components` ペイロード付きでメッセージツールを使用します。インタラクション結果は通常の受信メッセージとしてエージェントに戻され、既存の Discord `replyToMode` 設定に従います。

サポートされるブロック:

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- アクション行では最大 5 個のボタン、または単一の選択メニューを使用できます
- 選択タイプ: `string`、`user`、`role`、`mentionable`、`channel`

デフォルトでは、コンポーネントは 1 回のみ使用できます。ボタン、選択、フォームを期限切れまで複数回使用できるようにするには、`components.reusable=true` を設定します。

ボタンをクリックできるユーザーを制限するには、そのボタンに `allowedUsers` を設定します（Discord ユーザー ID、タグ、または `*`）。設定されている場合、一致しないユーザーには一時的な拒否が届きます。

`/model` と `/models` スラッシュコマンドは、プロバイダー、モデル、互換性のあるランタイムのドロップダウンと送信ステップを含むインタラクティブなモデルピッカーを開きます。`/models add` は非推奨であり、チャットからモデルを登録する代わりに非推奨メッセージを返すようになりました。ピッカーの返信は一時的で、呼び出したユーザーだけが使用できます。

ファイル添付:

- `file` ブロックは添付参照（`attachment://<filename>`）を指す必要があります
- `media`/`path`/`filePath` で添付を指定します（単一ファイル）。複数ファイルには `media-gallery` を使用します
- アップロード名を添付参照と一致させる必要がある場合は、`filename` を使用して上書きします

モーダルフォーム:

- 最大 5 個のフィールドを持つ `components.modal` を追加します
- フィールドタイプ: `text`、`checkbox`、`radio`、`select`、`role-select`、`user-select`
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
    - `open`（`channels.discord.allowFrom` に `"*"` が含まれている必要があります）
    - `disabled`

    DM ポリシーがオープンでない場合、不明なユーザーはブロックされます（または `pairing` モードではペアリングを促されます）。

    複数アカウントの優先順位:

    - `channels.discord.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 1 つのアカウントでは、`allowFrom` はレガシーの `dm.allowFrom` より優先されます。
    - 名前付きアカウントは、自身の `allowFrom` とレガシーの `dm.allowFrom` が未設定の場合、`channels.discord.allowFrom` を継承します。
    - 名前付きアカウントは `channels.discord.accounts.default.allowFrom` を継承しません。

    レガシーの `channels.discord.dm.policy` と `channels.discord.dm.allowFrom` は互換性のために引き続き読み取られます。`openclaw doctor --fix` は、アクセスを変更せずに実行できる場合、それらを `dmPolicy` と `allowFrom` に移行します。

    配信用の DM ターゲット形式:

    - `user:<id>`
    - `<@id>` メンション

    裸の数値 ID は通常、チャンネルデフォルトが有効な場合はチャンネル ID として解決されますが、アカウントの有効な DM `allowFrom` に列挙されている ID は、互換性のためユーザー DM ターゲットとして扱われます。

  </Tab>

  <Tab title="DM access groups">
    Discord DM では、`channels.discord.allowFrom` 内で動的な `accessGroup:<name>` エントリを使用できます。

    アクセスグループ名はメッセージチャンネル間で共有されます。メンバーが各チャンネルの通常の `allowFrom` 構文で表現される静的グループには `type: "message.senders"` を使用し、Discord チャンネルの現在の `ViewChannel` オーディエンスでメンバーシップを動的に定義する必要がある場合は `type: "discord.channelAudience"` を使用します。共有アクセスグループの動作はこちらに記載されています: [アクセスグループ](/ja-JP/channels/access-groups)。

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

    Discord テキストチャンネルには個別のメンバーリストはありません。`type: "discord.channelAudience"` はメンバーシップを次のようにモデル化します。DM 送信者は設定されたギルドのメンバーであり、ロールとチャンネルの上書きが適用された後、設定されたチャンネルに対する有効な `ViewChannel` 権限を現在持っています。

    例: 他の全員への DM を閉じたまま、`#maintainers` を閲覧できるユーザーなら誰でもボットに DM できるようにする。

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

    チャンネルオーディエンスのアクセスグループを使用する場合は、ボットに対して Discord Developer Portal の **Server Members Intent** を有効にします。DM にはギルドメンバー状態が含まれないため、OpenClaw は認可時に Discord REST 経由でメンバーを解決します。

  </Tab>

  <Tab title="Guild policy">
    ギルド処理は `channels.discord.groupPolicy` によって制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` が存在する場合の安全なベースラインは `allowlist` です。

    `allowlist` の動作:

    - ギルドは `channels.discord.guilds` と一致する必要があります（`id` 推奨、スラッグも可）
    - 任意の送信者許可リスト: `users`（安定した ID を推奨）と `roles`（ロール ID のみ）。いずれかが設定されている場合、送信者は `users` または `roles` に一致すると許可されます
    - 直接の名前/タグ照合はデフォルトで無効です。非常用の互換モードとしてのみ `channels.discord.dangerouslyAllowNameMatching: true` を有効にしてください
    - `users` では名前/タグがサポートされますが、ID の方が安全です。名前/タグのエントリが使用されている場合、`openclaw security audit` が警告します
    - ギルドに `channels` が設定されている場合、列挙されていないチャンネルは拒否されます
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

    `DISCORD_BOT_TOKEN` だけを設定し、`channels.discord` ブロックを作成しない場合、`channels.defaults.groupPolicy` が `open` であっても、ランタイムフォールバックは `groupPolicy="allowlist"` になります（ログに警告が出ます）。

  </Tab>

  <Tab title="Mentions and group DMs">
    ギルドメッセージはデフォルトでメンションゲートされます。

    メンション検出には次が含まれます。

    - 明示的なボットメンション
    - 設定されたメンションパターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - サポートされるケースでの暗黙のボットへの返信動作

    Discord 送信メッセージを書くときは、正規のメンション構文を使用してください。ユーザーには `<@USER_ID>`、チャンネルには `<#CHANNEL_ID>`、ロールには `<@&ROLE_ID>` です。レガシーの `<@!USER_ID>` ニックネームメンション形式は使用しないでください。

    `requireMention` はギルド/チャンネルごとに設定されます（`channels.discord.guilds...`）。
    `ignoreOtherMentions` は、ボットではなく別のユーザー/ロールにメンションしているメッセージを任意で破棄します（@everyone/@here を除く）。

    グループ DM:

    - デフォルト: 無視されます（`dm.groupEnabled=false`）
    - `dm.groupChannels` による任意の許可リスト（チャンネル ID またはスラッグ）

  </Tab>
</Tabs>

### ロールベースのエージェントルーティング

`bindings[].match.roles` を使用して、Discord ギルドメンバーをロール ID によって異なるエージェントへルーティングします。ロールベースのバインディングはロール ID のみを受け付け、ピアまたは親ピアのバインディングの後、ギルドのみのバインディングの前に評価されます。バインディングが他の一致フィールドも設定している場合（たとえば `peer` + `guildId` + `roles`）、設定されたすべてのフィールドが一致する必要があります。

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
- `commands.native=false` は起動時の Discord スラッシュコマンド登録とクリーンアップをスキップします。以前に登録されたコマンドは、Discord アプリから削除するまで Discord に表示され続ける場合があります。
- ネイティブコマンド認可は、通常のメッセージ処理と同じ Discord 許可リスト/ポリシーを使用します。
- コマンドは認可されていないユーザーにも Discord UI で表示される場合があります。実行時には引き続き OpenClaw 認可が適用され、「not authorized」が返されます。

コマンドカタログと動作については、[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

デフォルトのスラッシュコマンド設定:

- `ephemeral: true`

## 機能の詳細

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord はエージェント出力内の返信タグをサポートします。

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` で制御します。

    - `off` (デフォルト)
    - `first`
    - `all`
    - `batched`

    注: `off` は暗黙的な返信スレッド化を無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。
    `first` は、そのターンの最初の送信 Discord メッセージに、常に暗黙的なネイティブ返信参照を付与します。
    `batched` は、受信ターンが複数メッセージのデバウンスされたバッチだった場合にのみ、
    Discord の暗黙的なネイティブ返信参照を付与します。これは、
    単一メッセージのすべてのターンではなく、主に曖昧な連続チャットでネイティブ返信を使いたい場合に便利です。

    メッセージ ID はコンテキスト/履歴に表示されるため、エージェントは特定のメッセージを対象にできます。

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw は、一時メッセージを送信し、テキスト到着に合わせて編集することで、下書き返信をストリーミングできます。`channels.discord.streaming` は `off` | `partial` | `block` | `progress` (デフォルト) を受け取ります。`progress` は編集可能なステータス下書きを 1 つ保持し、最終配信までツール進行状況で更新します。`streamMode` はレガシーランタイムエイリアスです。永続化された設定を正規キーに書き換えるには、`openclaw doctor --fix` を実行します。

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

    - `partial` はトークン到着に合わせて単一のプレビューメッセージを編集します。
    - `block` は下書きサイズのチャンクを送出します (サイズと区切り位置の調整には `draftChunk` を使用し、`textChunkLimit` にクランプされます)。
    - メディア、エラー、明示的な返信の最終メッセージは、保留中のプレビュー編集をキャンセルします。
    - `streaming.preview.toolProgress` (デフォルト `true`) は、ツール/進行状況更新がプレビューメッセージを再利用するかどうかを制御します。
    - `streaming.preview.commandText` / `streaming.progress.commandText` は、コンパクトな進行状況行でのコマンド/exec 詳細を制御します: `raw` (デフォルト) または `status` (ツールラベルのみ)。

    コンパクトな進行状況行を維持しつつ、生のコマンド/exec テキストを隠すには:

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
    - `0` は無効化

    DM 履歴制御:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    スレッドの動作:

    - Discord スレッドはチャンネルセッションとしてルーティングされ、上書きされない限り親チャンネル設定を継承します。
    - スレッドセッションは、親チャンネルのセッションレベルの `/model` 選択をモデルのみのフォールバックとして継承します。スレッドローカルの `/model` 選択が引き続き優先され、トランスクリプト継承が有効でない限り親トランスクリプト履歴はコピーされません。
    - `channels.discord.thread.inheritParent` (デフォルト `false`) は、新しい自動スレッドを親トランスクリプトからシードするようにします。アカウントごとの上書きは `channels.discord.accounts.<id>.thread.inheritParent` 配下にあります。
    - メッセージツールのリアクションは `user:<id>` DM ターゲットを解決できます。
    - `guilds.<guild>.channels.<channel>.requireMention: false` は、返信ステージのアクティベーションフォールバック中に保持されます。

    チャンネルトピックは **信頼されない** コンテキストとして注入されます。許可リストは誰がエージェントをトリガーできるかを制御しますが、完全な補足コンテキストの秘匿境界ではありません。

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord はスレッドをセッションターゲットにバインドできるため、そのスレッド内の後続メッセージは同じセッション (サブエージェントセッションを含む) にルーティングされ続けます。

    コマンド:

    - `/focus <target>` 現在/新規スレッドをサブエージェント/セッションターゲットにバインド
    - `/unfocus` 現在のスレッドバインドを削除
    - `/agents` アクティブな実行とバインド状態を表示
    - `/session idle <duration|off>` フォーカス済みバインドの非アクティブ時自動フォーカス解除を確認/更新
    - `/session max-age <duration|off>` フォーカス済みバインドのハード最大期間を確認/更新

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
    - `spawnSessions` は `sessions_spawn({ thread: true })` と ACP スレッド生成に対するスレッドの自動作成/バインドを制御します。デフォルト: `true`。
    - `defaultSpawnContext` は、スレッドバインド生成のネイティブサブエージェントコンテキストを制御します。デフォルト: `"fork"`。
    - 非推奨の `spawnSubagentSessions`/`spawnAcpSessions` キーは `openclaw doctor --fix` によって移行されます。
    - アカウントでスレッドバインドが無効な場合、`/focus` と関連するスレッドバインド操作は利用できません。

    [サブエージェント](/ja-JP/tools/subagents)、[ACP エージェント](/ja-JP/tools/acp-agents)、[設定リファレンス](/ja-JP/gateway/configuration-reference) を参照してください。

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    安定した「常時稼働」の ACP ワークスペースでは、Discord 会話を対象とするトップレベルの型付き ACP バインドを設定します。

    設定パス:

    - `bindings[]` に `type: "acp"` と `match.channel: "discord"` を設定

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

    - `/acp spawn codex --bind here` は現在のチャンネルまたはスレッドをその場でバインドし、以後のメッセージを同じ ACP セッションに保持します。スレッドメッセージは親チャンネルのバインドを継承します。
    - バインド済みのチャンネルまたはスレッドでは、`/new` と `/reset` は同じ ACP セッションをその場でリセットします。一時スレッドバインドは、アクティブな間ターゲット解決を上書きできます。
    - `spawnSessions` は `--thread auto|here` による子スレッドの作成/バインドをゲートします。

    バインド動作の詳細については、[ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

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
    `ackReaction` は、OpenClaw が受信メッセージを処理している間、確認用絵文字を送信します。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - エージェント ID 絵文字フォールバック (`agents.list[].identity.emoji`、なければ "👀")

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
    `channels.discord.proxy` を使用して、Discord gateway WebSocket トラフィックと起動時 REST 参照 (アプリケーション ID + 許可リスト解決) を HTTP(S) プロキシ経由でルーティングします。

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
    PluralKit 解決を有効にして、プロキシされたメッセージをシステムメンバー ID にマッピングします。

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
    - メンバー表示名は、`channels.discord.dangerouslyAllowNameMatching: true` の場合にのみ名前/slug で照合されます
    - 参照は元のメッセージ ID を使用し、時間枠で制限されます
    - 参照に失敗した場合、プロキシされたメッセージはボットメッセージとして扱われ、`allowBots=true` でない限り破棄されます

  </Accordion>

  <Accordion title="Outbound mention aliases">
    エージェントが既知の Discord ユーザーに対して決定的な送信メンションを必要とする場合は、`mentionAliases` を使用します。キーは先頭の `@` を除いたハンドルです。値は Discord ユーザー ID です。不明なハンドル、`@everyone`、`@here`、Markdown コードスパン内のメンションは変更されません。

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

    アクティビティタイプの対応表:

    - 0: プレイ中
    - 1: ストリーミング中 (`activityUrl` が必要)
    - 2: 聞いている
    - 3: 視聴中
    - 4: カスタム (アクティビティテキストをステータス状態として使用します。絵文字は任意です)
    - 5: 競争中

    自動プレゼンスの例 (ランタイムヘルスシグナル):

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

  <Accordion title="Discordでの承認">
    Discord は DM でのボタンベースの承認処理をサポートし、任意で承認プロンプトを元のチャンネルに投稿できます。

    設定パス:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (任意。可能な場合は `commands.ownerAllowFrom` にフォールバック)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`、デフォルト: `dm`)
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    Discord は `enabled` が未設定または `"auto"` で、`execApprovals.approvers` または `commands.ownerAllowFrom` から少なくとも1人の承認者を解決できる場合、ネイティブの実行承認を自動的に有効化します。Discord はチャンネルの `allowFrom`、レガシーの `dm.allowFrom`、またはダイレクトメッセージの `defaultTo` から実行承認者を推測しません。Discord をネイティブ承認クライアントとして明示的に無効化するには、`enabled: false` を設定します。

    `/diagnostics` や `/export-trajectory` などの機密性の高い所有者専用グループコマンドでは、OpenClaw は承認プロンプトと最終結果を非公開で送信します。呼び出し元の所有者に Discord 所有者ルートがある場合は、まず Discord DM を試します。利用できない場合は、Telegram など、`commands.ownerAllowFrom` から利用可能な最初の所有者ルートにフォールバックします。

    `target` が `channel` または `both` の場合、承認プロンプトはチャンネルに表示されます。解決済みの承認者だけがボタンを使用できます。他のユーザーには一時的な拒否が返されます。承認プロンプトにはコマンドテキストが含まれるため、チャンネル配信は信頼済みチャンネルでのみ有効にしてください。セッションキーからチャンネル ID を導出できない場合、OpenClaw は DM 配信にフォールバックします。

    Discord は他のチャットチャンネルで使用される共有承認ボタンも描画します。ネイティブ Discord アダプターは主に、承認者 DM ルーティングとチャンネルファンアウトを追加します。
    これらのボタンが存在する場合、それらが主要な承認 UX です。OpenClaw は、
    ツール結果がチャット承認を利用できない、または手動承認が唯一の経路であることを示す場合にのみ、
    手動の `/approve` コマンドを含める必要があります。
    Discord ネイティブ承認ランタイムがアクティブでない場合、OpenClaw は
    ローカルで決定論的な `/approve <id> <decision>` プロンプトを表示したままにします。
    ランタイムはアクティブだが、ネイティブカードをどのターゲットにも配信できない場合、
    OpenClaw は保留中の承認から正確な `/approve`
    コマンドを含む同一チャットのフォールバック通知を送信します。

    Gateway 認証と承認解決は共有 Gateway クライアント契約に従います (`plugin:` ID は `plugin.approval.resolve` 経由で解決され、その他の ID は `exec.approval.resolve` 経由で解決されます)。承認はデフォルトで30分後に期限切れになります。

    [実行承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## ツールとアクションゲート

Discord メッセージアクションには、メッセージ送信、チャンネル管理、モデレーション、プレゼンス、メタデータのアクションが含まれます。

主な例:

- メッセージ送信: `sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- リアクション: `react`、`reactions`、`emojiList`
- モデレーション: `timeout`、`kick`、`ban`
- プレゼンス: `setPresence`

`event-create` アクションは、スケジュール済みイベントのカバー画像を設定するための任意の `image` パラメーター (URL またはローカルファイルパス) を受け取ります。

アクションゲートは `channels.discord.actions.*` の下にあります。

デフォルトのゲート動作:

| アクショングループ                                                                                                                                                       | デフォルト |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 有効       |
| roles                                                                                                                                                                    | 無効       |
| moderation                                                                                                                                                               | 無効       |
| presence                                                                                                                                                                 | 無効       |

## Components v2 UI

OpenClaw は、実行承認とコンテキスト横断マーカーに Discord components v2 を使用します。Discord メッセージアクションは、カスタム UI 用に `components` も受け取れます (高度。discord ツール経由でコンポーネントペイロードを構築する必要があります)。一方、レガシーの `embeds` も引き続き利用できますが、推奨されません。

- `channels.discord.ui.components.accentColor` は Discord コンポーネントコンテナで使用されるアクセントカラーを設定します (16進数)。
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

Discord には2つの異なる音声サーフェスがあります: リアルタイムの**ボイスチャンネル** (継続的な会話) と**音声メッセージ添付** (波形プレビュー形式) です。Gateway は両方をサポートします。

### ボイスチャンネル

セットアップチェックリスト:

1. Discord Developer Portal で Message Content Intent を有効にします。
2. ロール/ユーザーの許可リストを使用する場合は Server Members Intent を有効にします。
3. `bot` と `applications.commands` スコープでボットを招待します。
4. 対象のボイスチャンネルで Connect、Speak、Send Messages、Read Message History を付与します。
5. ネイティブコマンド (`commands.native` または `channels.discord.commands.native`) を有効にします。
6. `channels.discord.voice` を設定します。

セッションを制御するには `/vc join|leave|status` を使用します。このコマンドはアカウントのデフォルトエージェントを使用し、他の Discord コマンドと同じ許可リストおよびグループポリシールールに従います。

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

参加前にボットの有効な権限を調べるには、次を実行します。

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

- `voice.tts` は音声再生に限って `messages.tts` を上書きします。
- `voice.model` は Discord ボイスチャンネル応答に使用される LLM だけを上書きします。ルーティングされたエージェントモデルを継承するには未設定のままにします。
- STT は `tools.media.audio` を使用します。`voice.model` は文字起こしに影響しません。
- チャンネルごとの Discord `systemPrompt` 上書きは、そのボイスチャンネルの音声トランスクリプトターンに適用されます。
- 音声トランスクリプトターンは、Discord `allowFrom` (または `dm.allowFrom`) から所有者ステータスを導出します。所有者でない話者は、所有者専用ツール (例: `gateway` と `cron`) にアクセスできません。
- Discord 音声はテキスト専用設定ではオプトインです。`/vc` コマンド、音声ランタイム、`GuildVoiceStates` Gateway インテントを有効にするには、`channels.discord.voice.enabled=true` を設定します (または既存の `channels.discord.voice` ブロックを維持します)。
- `channels.discord.intents.voiceStates` は音声状態インテントのサブスクリプションを明示的に上書きできます。インテントを有効な音声有効化状態に従わせるには未設定のままにします。
- `voice.daveEncryption` と `voice.decryptionFailureTolerance` は `@discordjs/voice` の参加オプションにそのまま渡されます。
- `@discordjs/voice` のデフォルトは、未設定の場合 `daveEncryption=true` と `decryptionFailureTolerance=24` です。
- `voice.connectTimeoutMs` は `/vc join` と自動参加試行における最初の `@discordjs/voice` Ready 待機を制御します。デフォルト: `30000`。
- `voice.reconnectGraceMs` は、切断された音声セッションが再接続を開始するまで OpenClaw が待機してから破棄する時間を制御します。デフォルト: `15000`。
- 他のユーザーが話し始めただけでは音声再生は停止しません。フィードバックループを避けるため、OpenClaw は TTS の再生中、新しい音声キャプチャを無視します。次のターンでは再生終了後に話してください。
- `voice.captureSilenceGraceMs` は、Discord が話者の停止を報告してから、OpenClaw がその音声セグメントを STT 用に確定するまでの待機時間を制御します。デフォルト: `2500`。Discord が通常の間を途切れ途切れの部分トランスクリプトに分割する場合は、この値を上げてください。
- ElevenLabs が選択された TTS プロバイダーの場合、Discord 音声再生はストリーミング TTS を使用し、プロバイダーの応答ストリームから開始します。ストリーミングをサポートしないプロバイダーは、合成された一時ファイルの経路にフォールバックします。
- OpenClaw は受信復号失敗も監視し、短時間に失敗が繰り返された場合はボイスチャンネルを退出/再参加して自動復旧します。
- 更新後に受信ログで `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` が繰り返し表示される場合は、依存関係レポートとログを収集してください。バンドルされた `@discordjs/voice` ラインには、discord.js issue #11419 をクローズした discord.js PR #11449 の上流パディング修正が含まれています。
- `The operation was aborted` 受信イベントは、OpenClaw がキャプチャした話者セグメントを確定するときに想定されるものです。これは詳細診断であり、警告ではありません。

ボイスチャンネルのパイプライン:

- Discord PCM キャプチャは WAV 一時ファイルに変換されます。
- `tools.media.audio` が STT を処理します。例: `openai/gpt-4o-mini-transcribe`。
- トランスクリプトは Discord 入口とルーティングを通じて送信されます。その間、応答 LLM は、エージェントの `tts` ツールを隠し、返却テキストを求める音声出力ポリシーで実行されます。これは Discord 音声が最終的な TTS 再生を所有するためです。
- `voice.model` が設定されている場合、このボイスチャンネルターンの応答 LLM だけを上書きします。
- `voice.tts` は `messages.tts` にマージされます。ストリーミング対応プロバイダーはプレーヤーに直接供給し、それ以外の場合は結果の音声ファイルが参加中のチャンネルで再生されます。

認証情報はコンポーネントごとに解決されます: `voice.model` 用の LLM ルート認証、`tools.media.audio` 用の STT 認証、`messages.tts`/`voice.tts` 用の TTS 認証です。

### 音声メッセージ

Discord 音声メッセージは波形プレビューを表示し、OGG/Opus 音声を必要とします。OpenClaw は波形を自動生成しますが、検査と変換のために Gateway ホスト上の `ffmpeg` と `ffprobe` が必要です。

- **ローカルファイルパス**を指定します (URL は拒否されます)。
- テキスト内容は省略します (Discord は同じペイロード内のテキスト + 音声メッセージを拒否します)。
- 任意の音声形式を受け付けます。OpenClaw は必要に応じて OGG/Opus に変換します。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="許可されていないインテントを使用した、またはボットがギルドメッセージを認識しない">

    - Message Content Intent を有効にします
    - ユーザー/メンバー解決に依存する場合は Server Members Intent を有効にします
    - インテントを変更した後に Gateway を再起動します

  </Accordion>

  <Accordion title="ギルドメッセージが予期せずブロックされる">

    - `groupPolicy` を確認します
    - `channels.discord.guilds` の下にあるギルド許可リストを確認します
    - ギルドの `channels` マップが存在する場合、一覧にあるチャンネルだけが許可されます
    - `requireMention` の動作とメンションパターンを確認します

    有用なチェック:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="require mention false だがまだブロックされる">
    よくある原因:

    - `groupPolicy="allowlist"` に一致する guild/channel allowlist がない
    - `requireMention` が誤った場所に設定されている（`channels.discord.guilds` または channel entry 配下にある必要がある）
    - 送信者が guild/channel の `users` allowlist によってブロックされている

  </Accordion>

  <Accordion title="長時間実行される Discord ターンまたは重複返信">

    典型的なログ:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway キューの調整項目:

    - 単一アカウント: `channels.discord.eventQueue.listenerTimeout`
    - 複数アカウント: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - これは Discord Gateway リスナーの処理だけを制御し、エージェントのターン継続時間は制御しない

    Discord は、キューに入ったエージェントターンに channel 所有のタイムアウトを適用しません。メッセージリスナーは即座に引き渡し、キューに入った Discord 実行は、セッション/ツール/ランタイムのライフサイクルが完了するか処理を中断するまで、セッションごとの順序を保持します。

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
    OpenClaw は接続前に Discord の `/gateway/bot` メタデータを取得します。一時的な失敗時は Discord のデフォルト Gateway URL にフォールバックし、ログではレート制限されます。

    メタデータタイムアウトの調整項目:

    - 単一アカウント: `channels.discord.gatewayInfoTimeoutMs`
    - 複数アカウント: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - config が未設定の場合の env フォールバック: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - デフォルト: `30000`（30 秒）、最大: `120000`

  </Accordion>

  <Accordion title="Gateway READY タイムアウトによる再起動">
    OpenClaw は起動時とランタイム再接続後に Discord の Gateway `READY` イベントを待ちます。起動の段階的実行を伴う複数アカウント構成では、デフォルトより長い起動時 READY ウィンドウが必要になる場合があります。

    READY タイムアウトの調整項目:

    - 起動時の単一アカウント: `channels.discord.gatewayReadyTimeoutMs`
    - 起動時の複数アカウント: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - config が未設定の場合の起動時 env フォールバック: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 起動時のデフォルト: `15000`（15 秒）、最大: `120000`
    - ランタイムの単一アカウント: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - ランタイムの複数アカウント: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - config が未設定の場合のランタイム env フォールバック: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - ランタイムのデフォルト: `30000`（30 秒）、最大: `120000`

  </Accordion>

  <Accordion title="権限監査の不一致">
    `channels status --probe` の権限チェックは、数値の channel ID でのみ機能します。

    slug key を使用している場合、ランタイムの照合は引き続き機能する可能性がありますが、probe は権限を完全には検証できません。

  </Accordion>

  <Accordion title="DM と pairing の問題">

    - DM 無効: `channels.discord.dm.enabled=false`
    - DM ポリシー無効: `channels.discord.dmPolicy="disabled"`（legacy: `channels.discord.dm.policy`）
    - `pairing` モードで pairing 承認待ち

  </Accordion>

  <Accordion title="Bot 間ループ">
    デフォルトでは、bot が作成したメッセージは無視されます。

    `channels.discord.allowBots=true` を設定する場合は、ループ動作を避けるために厳格な mention と allowlist ルールを使用してください。
    bot をメンションする bot メッセージのみを受け入れるには、`channels.discord.allowBots="mentions"` を推奨します。

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

  <Accordion title="DecryptionFailed(...) による Voice STT のドロップ">

    - Discord voice receive recovery logic が含まれるように、OpenClaw を最新に保つ（`openclaw update`）
    - `channels.discord.voice.daveEncryption=true`（デフォルト）を確認する
    - `channels.discord.voice.decryptionFailureTolerance=24`（upstream デフォルト）から始め、必要な場合のみ調整する
    - 次のログを監視する:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 自動再参加後も失敗が続く場合は、ログを収集し、[discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) と [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) の upstream DAVE 受信履歴と比較する

  </Accordion>
</AccordionGroup>

## 設定リファレンス

主要リファレンス: [設定リファレンス - Discord](/ja-JP/gateway/config-channels#discord)。

<Accordion title="高シグナルな Discord フィールド">

- 起動/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- ポリシー: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- コマンド: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- イベントキュー: `eventQueue.listenerTimeout`（リスナーバジェット）, `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- 返信/履歴: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 配信: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming`（legacy alias: `streamMode`）, `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- メディア/リトライ: `mediaMaxMb`（送信 Discord アップロードを上限設定、デフォルト `100MB`）, `retry`
- アクション: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- 機能: `threadBindings`, トップレベル `bindings[]`（`type: "acp"`）, `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## 安全性と運用

- bot トークンはシークレットとして扱う（監視付き環境では `DISCORD_BOT_TOKEN` を推奨）。
- 最小権限の Discord 権限を付与する。
- コマンドの deploy/state が古い場合は、Gateway を再起動し、`openclaw channels status --probe` で再確認する。

## 関連

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    Discord ユーザーを Gateway にペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループチャットと allowlist の動作。
  </Card>
  <Card title="Channel routing" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントへルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと堅牢化。
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    guild と channel をエージェントにマッピングします。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作。
  </Card>
</CardGroup>
