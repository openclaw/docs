---
read_when:
    - Discord チャンネル機能に取り組む
summary: Discord ボットのサポート状況、機能、設定
title: Discord
x-i18n:
    generated_at: "2026-06-27T10:32:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90ed02258347113ca5b1dfcc5169a48190e3b4e1273d27a8a5c45f0f930cdbbf
    source_path: channels/discord.md
    workflow: 16
---

公式 Discord gateway 経由で、DM とギルドチャンネルを利用できます。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Discord DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復フロー。
  </Card>
</CardGroup>

## クイックセットアップ

ボット付きの新しいアプリケーションを作成し、そのボットをサーバーに追加して、OpenClaw とペアリングする必要があります。自分専用のプライベートサーバーにボットを追加することをおすすめします。まだない場合は、[まず作成してください](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends** を選択）。

<Steps>
  <Step title="Discord アプリケーションとボットを作成する">
    [Discord Developer Portal](https://discord.com/developers/applications) に移動し、**New Application** をクリックします。「OpenClaw」のような名前を付けます。

    サイドバーで **Bot** をクリックします。**Username** は OpenClaw エージェントに付けたい名前に設定します。

  </Step>

  <Step title="特権インテントを有効にする">
    引き続き **Bot** ページで、**Privileged Gateway Intents** まで下にスクロールし、次を有効にします。

    - **Message Content Intent**（必須）
    - **Server Members Intent**（推奨。ロール許可リストと名前から ID への照合に必須）
    - **Presence Intent**（任意。プレゼンス更新にのみ必要）

  </Step>

  <Step title="ボットトークンをコピーする">
    **Bot** ページの上部に戻り、**Reset Token** をクリックします。

    <Note>
    名前に反して、これは最初のトークンを生成します。「リセット」されるものはありません。
    </Note>

    トークンをコピーしてどこかに保存します。これは **Bot Token** で、まもなく必要になります。

  </Step>

  <Step title="招待 URL を生成してボットをサーバーに追加する">
    サイドバーで **OAuth2** をクリックします。ボットをサーバーに追加するための適切な権限を持つ招待 URL を生成します。

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

    これは通常のテキストチャンネル向けのベースラインセットです。フォーラムやメディアチャンネルのワークフローでスレッドを作成または継続する場合を含め、Discord スレッドに投稿する予定がある場合は、**Send Messages in Threads** も有効にします。
    下部の生成された URL をコピーしてブラウザーに貼り付け、サーバーを選択して **Continue** をクリックして接続します。これで Discord サーバーにボットが表示されるはずです。

  </Step>

  <Step title="開発者モードを有効にして ID を収集する">
    Discord アプリに戻り、内部 ID をコピーできるように開発者モードを有効にする必要があります。

    1. **User Settings**（アバターの横の歯車アイコン）→ **Advanced** → **Developer Mode** をオンに切り替えます
    2. サイドバーの **サーバーアイコン** を右クリック → **Copy Server ID**
    3. **自分のアバター** を右クリック → **Copy User ID**

    **Server ID** と **User ID** を Bot Token と一緒に保存します。次のステップで 3 つすべてを OpenClaw に送信します。

  </Step>

  <Step title="サーバーメンバーからの DM を許可する">
    ペアリングを機能させるには、Discord がボットからあなたへの DM を許可する必要があります。**サーバーアイコン** を右クリック → **Privacy Settings** → **Direct Messages** をオンに切り替えます。

    これにより、サーバーメンバー（ボットを含む）があなたに DM を送信できるようになります。OpenClaw で Discord DM を使用したい場合は、これを有効のままにしてください。ギルドチャンネルだけを使う予定なら、ペアリング後に DM を無効にできます。

  </Step>

  <Step title="ボットトークンを安全に設定する（チャットで送信しない）">
    Discord ボットトークンは（パスワードのような）シークレットです。エージェントにメッセージを送る前に、OpenClaw を実行しているマシンに設定します。

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

    OpenClaw がすでにバックグラウンドサービスとして実行されている場合は、OpenClaw Mac アプリから、または `openclaw gateway run` プロセスを停止して再起動します。
    管理サービスとしてインストールしている場合は、`DISCORD_BOT_TOKEN` が存在するシェルから `openclaw gateway install` を実行するか、変数を `~/.openclaw/.env` に保存して、再起動後にサービスが env SecretRef を解決できるようにします。
    ホストが Discord の起動時アプリケーション検索によってブロックまたはレート制限される場合は、Developer Portal から Discord アプリケーション/クライアント ID を設定すると、起動時にその REST 呼び出しをスキップできます。デフォルトアカウントには `channels.discord.applicationId` を使用し、複数の Discord ボットを実行する場合は `channels.discord.accounts.<accountId>.applicationId` を使用します。

  </Step>

  <Step title="OpenClaw を設定してペアリングする">

    <Tabs>
      <Tab title="エージェントに依頼">
        既存の任意のチャンネル（例: Telegram）で OpenClaw エージェントとチャットして伝えます。Discord が最初のチャンネルの場合は、代わりに CLI / config タブを使用してください。

        > 「Discord ボットトークンはすでに設定に入れました。User ID `<user_id>` と Server ID `<server_id>` で Discord セットアップを完了してください。」
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

        デフォルトアカウントの env フォールバック:

```bash
DISCORD_BOT_TOKEN=...
```

        スクリプト化またはリモートセットアップでは、同じ JSON5 ブロックを `openclaw config patch --file ./discord.patch.json5 --dry-run` で書き込み、その後 `--dry-run` なしで再実行します。プレーンテキストの `token` 値がサポートされています。SecretRef 値も、env/file/exec プロバイダー全体で `channels.discord.token` に対応しています。[シークレット管理](/ja-JP/gateway/secrets) を参照してください。

        複数の Discord ボットでは、各ボットのトークンとアプリケーション ID をそのアカウント配下に保持します。トップレベルの `channels.discord.applicationId` はアカウントに継承されるため、すべてのアカウントで同じアプリケーション ID を使うべき場合にのみ、そこに設定してください。

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
    gateway が実行されるまで待ってから、Discord でボットに DM します。ペアリングコードが返されます。

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

    これで DM 経由で Discord のエージェントとチャットできるはずです。

  </Step>
</Steps>

<Note>
トークン解決はアカウント対応です。設定のトークン値は env フォールバックより優先されます。`DISCORD_BOT_TOKEN` はデフォルトアカウントにのみ使用されます。
有効な 2 つの Discord アカウントが同じボットトークンに解決される場合、OpenClaw はそのトークンに対して 1 つの gateway モニターだけを起動します。設定由来のトークンはデフォルトの env フォールバックより優先されます。それ以外の場合は、最初に有効化されたアカウントが優先され、重複アカウントは無効として報告されます。
高度なアウトバウンド呼び出し（メッセージツール/チャンネルアクション）では、明示的な呼び出しごとの `token` がその呼び出しに使用されます。これは送信と読み取り/プローブ形式のアクション（たとえば read/search/fetch/thread/pins/permissions）に適用されます。アカウントポリシー/再試行設定は引き続き、アクティブなランタイムスナップショットで選択されたアカウントから取得されます。
</Note>

## 推奨: ギルドワークスペースを設定する

DM が機能したら、Discord サーバーを完全なワークスペースとして設定できます。各チャンネルは独自のコンテキストを持つ独自のエージェントセッションを取得します。これは、自分とボットだけのプライベートサーバーにおすすめです。

<Steps>
  <Step title="サーバーをギルド許可リストに追加する">
    これにより、エージェントは DM だけでなく、サーバー上の任意のチャンネルで応答できるようになります。

    <Tabs>
      <Tab title="エージェントに依頼">
        > 「私の Discord Server ID `<server_id>` をギルド許可リストに追加してください」
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
    デフォルトでは、エージェントは @mentioned された場合にのみギルドチャンネルで応答します。プライベートサーバーでは、おそらくすべてのメッセージに応答させたいでしょう。

    ギルドチャンネルでは、通常の返信はデフォルトで自動投稿されます。共有の常時オンの部屋では、`messages.groupChat.visibleReplies: "message_tool"` を選択すると、エージェントが待機し、チャンネル返信が有用だと判断した場合にのみ投稿できます。これは GPT 5.5 のような最新世代の、ツール信頼性の高いモデルで最もよく機能します。周囲の部屋イベントは、ツールが送信しない限り静かに保たれます。完全な待機モード設定については、[周囲の部屋イベント](/ja-JP/channels/ambient-room-events) を参照してください。

    Discord に入力中表示が出て、ログにトークン使用量が表示されているのにメッセージが投稿されない場合は、そのターンが周囲の部屋イベントとして設定されていたか、メッセージツールの可視返信を選択していたかを確認してください。

    <Tabs>
      <Tab title="エージェントに依頼">
        > 「@mentioned されなくても、このサーバーでエージェントが応答できるようにしてください」
      </Tab>
      <Tab title="Config">
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

        表示されるグループ/チャンネル返信にメッセージツール送信を必須にするには、`messages.groupChat.visibleReplies: "message_tool"` を設定します。

      </Tab>
    </Tabs>

  </Step>

  <Step title="ギルドチャンネルのメモリを計画する">
    デフォルトでは、長期メモリ（MEMORY.md）は DM セッションでのみ読み込まれます。ギルドチャンネルでは MEMORY.md は自動読み込みされません。

    <Tabs>
      <Tab title="エージェントに依頼">
        > 「Discord チャンネルで質問するとき、MEMORY.md から長期コンテキストが必要な場合は memory_search または memory_get を使用してください。」
      </Tab>
      <Tab title="手動">
        すべてのチャンネルで共有コンテキストが必要な場合は、安定した指示を `AGENTS.md` または `USER.md` に入れてください（すべてのセッションに注入されます）。長期メモは `MEMORY.md` に保持し、必要に応じてメモリツールでアクセスします。
      </Tab>
    </Tabs>

  </Step>
</Steps>

次に、Discord サーバーにいくつかのチャンネルを作成してチャットを始めます。エージェントはチャンネル名を確認でき、各チャンネルには独立したセッションが割り当てられます。そのため、`#coding`、`#home`、`#research`、またはワークフローに合う任意のチャンネルを設定できます。

## ランタイムモデル

- Gateway が Discord 接続を所有します。
- 返信ルーティングは決定的です。Discord の受信返信は Discord に返ります。
- Discord のギルド/チャンネルメタデータは、ユーザーに見える返信プレフィックスとしてではなく、信頼されないコンテキストとしてモデルプロンプトに追加されます。モデルがそのエンベロープをコピーして返した場合、OpenClaw は送信返信と今後のリプレイコンテキストから、コピーされたメタデータを取り除きます。
- デフォルトでは（`session.dmScope=main`）、直接チャットはエージェントのメインセッション（`agent:main:main`）を共有します。
- ギルドチャンネルは分離されたセッションキー（`agent:<agentId>:discord:channel:<channelId>`）です。
- グループ DM はデフォルトで無視されます（`channels.discord.dm.groupEnabled=false`）。
- ネイティブのスラッシュコマンドは分離されたコマンドセッション（`agent:<agentId>:discord:slash:<userId>`）で実行されますが、ルーティング先の会話セッションへの `CommandTargetSessionKey` は引き続き保持します。
- Discord へのテキストのみの cron/heartbeat 通知配信では、最終的なアシスタントに見える回答を 1 回使用します。メディアおよび構造化コンポーネントペイロードは、エージェントが複数の配信可能ペイロードを出力する場合、複数メッセージのままです。

## フォーラムチャンネル

Discord のフォーラムチャンネルとメディアチャンネルはスレッド投稿のみを受け付けます。OpenClaw はそれらを作成する 2 つの方法をサポートしています。

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

OpenClaw はエージェントメッセージ向けに Discord components v2 コンテナをサポートしています。`components` ペイロード付きでメッセージツールを使用します。インタラクション結果は通常の受信メッセージとしてエージェントにルーティングされ、既存の Discord `replyToMode` 設定に従います。

サポートされるブロック:

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- アクション行では最大 5 個のボタン、または単一の選択メニューを使用できます
- 選択タイプ: `string`、`user`、`role`、`mentionable`、`channel`

デフォルトでは、コンポーネントは 1 回のみ使用できます。ボタン、選択、フォームを期限切れまで複数回使用できるようにするには、`components.reusable=true` を設定します。

ボタンをクリックできるユーザーを制限するには、そのボタンに `allowedUsers` を設定します（Discord ユーザー ID、タグ、または `*`）。設定されている場合、一致しないユーザーには一時的な拒否が返されます。

コンポーネントコールバックはデフォルトで 30 分後に期限切れになります。デフォルトの Discord アカウントでそのコールバックレジストリの存続期間を変更するには `channels.discord.agentComponents.ttlMs` を設定し、複数アカウント設定で 1 つのアカウントを上書きするには `channels.discord.accounts.<accountId>.agentComponents.ttlMs` を設定します。値はミリ秒で、正の整数である必要があり、`86400000`（24 時間）を上限とします。長い TTL は、ボタンを使用可能なままにする必要があるレビューや承認ワークフローに有用ですが、古い Discord メッセージがまだアクションをトリガーできる期間も延びます。ワークフローに合う最短の TTL を優先し、古いコールバックが意外な動作になる場合はデフォルトのままにしてください。

`/model` と `/models` スラッシュコマンドは、プロバイダー、モデル、互換ランタイムのドロップダウンと Submit ステップを備えたインタラクティブなモデルピッカーを開きます。`/models add` は非推奨となり、チャットからモデルを登録する代わりに非推奨メッセージを返すようになりました。ピッカーの返信は一時的で、呼び出したユーザーだけが使用できます。Discord の選択メニューは 25 個のオプションに制限されているため、`openai` や `vllm` など選択されたプロバイダーについてのみ動的に検出されたモデルをピッカーに表示したい場合は、`agents.defaults.models` に `provider/*` エントリを追加してください。

ファイル添付:

- `file` ブロックは添付参照（`attachment://<filename>`）を指す必要があります
- 添付は `media`/`path`/`filePath` で提供します（単一ファイル）。複数ファイルには `media-gallery` を使用します
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
    - `open`（`channels.discord.allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    DM ポリシーが open でない場合、不明なユーザーはブロックされます（または `pairing` モードではペアリングを促されます）。

    複数アカウントの優先順位:

    - `channels.discord.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 1 つのアカウントでは、`allowFrom` が従来の `dm.allowFrom` より優先されます。
    - 名前付きアカウントは、自身の `allowFrom` と従来の `dm.allowFrom` が未設定の場合、`channels.discord.allowFrom` を継承します。
    - 名前付きアカウントは `channels.discord.accounts.default.allowFrom` を継承しません。

    従来の `channels.discord.dm.policy` と `channels.discord.dm.allowFrom` は、互換性のため引き続き読み取られます。`openclaw doctor --fix` は、アクセスを変更せずに実行できる場合、それらを `dmPolicy` と `allowFrom` に移行します。

    配信用の DM ターゲット形式:

    - `user:<id>`
    - `<@id>` メンション

    チャンネルデフォルトが有効な場合、通常、裸の数値 ID はチャンネル ID として解決されますが、アカウントの有効な DM `allowFrom` に記載された ID は、互換性のためユーザー DM ターゲットとして扱われます。

  </Tab>

  <Tab title="Access groups">
    Discord DM とテキストコマンドの認可では、`channels.discord.allowFrom` 内の動的な `accessGroup:<name>` エントリを使用できます。

    アクセスグループ名はメッセージチャンネル間で共有されます。メンバーが各チャンネルの通常の `allowFrom` 構文で表現される静的グループには `type: "message.senders"` を使用し、Discord チャンネルの現在の `ViewChannel` オーディエンスでメンバーシップを動的に定義する必要がある場合は `type: "discord.channelAudience"` を使用します。共有アクセスグループの動作はここに記載されています: [アクセスグループ](/ja-JP/channels/access-groups)。

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

    Discord テキストチャンネルには個別のメンバーリストがありません。`type: "discord.channelAudience"` はメンバーシップを次のようにモデル化します。DM 送信者が設定されたギルドのメンバーであり、ロールとチャンネルの上書きが適用された後、設定されたチャンネルに対して現在有効な `ViewChannel` 権限を持っていること。

    例: `#maintainers` を表示できるすべてのユーザーがボットに DM できるようにし、それ以外の全員には DM を閉じたままにする。

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

    チャンネルオーディエンスアクセスグループを使用する場合は、ボットに対して Discord Developer Portal の **Server Members Intent** を有効にします。DM にはギルドメンバー状態が含まれないため、OpenClaw は認可時に Discord REST を通じてメンバーを解決します。

  </Tab>

  <Tab title="Guild policy">
    ギルド処理は `channels.discord.groupPolicy` によって制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` が存在する場合のセキュアなベースラインは `allowlist` です。

    `allowlist` の動作:

    - ギルドは `channels.discord.guilds` と一致する必要があります（`id` 推奨、slug も受け付けます）
    - 任意の送信者許可リスト: `users`（安定した ID を推奨）と `roles`（ロール ID のみ）。どちらかが設定されている場合、送信者は `users` または `roles` に一致すると許可されます
    - 直接の名前/タグ照合はデフォルトで無効です。非常時の互換モードとしてのみ `channels.discord.dangerouslyAllowNameMatching: true` を有効にしてください
    - `users` では名前/タグがサポートされますが、ID の方が安全です。名前/タグエントリが使用されている場合、`openclaw security audit` が警告します
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

    `DISCORD_BOT_TOKEN` だけを設定し、`channels.discord` ブロックを作成しない場合、`channels.defaults.groupPolicy` が `open` であっても、ランタイムフォールバックは `groupPolicy="allowlist"` になります（ログに警告が出ます）。

  </Tab>

  <Tab title="Mentions and group DMs">
    ギルドメッセージはデフォルトでメンションゲートされます。

    メンション検出には次が含まれます。

    - 明示的なボットメンション
    - 設定されたメンションパターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - サポートされるケースでの暗黙的なボットへの返信動作

    Discord 送信メッセージを書くときは、正規のメンション構文を使用してください。ユーザーには `<@USER_ID>`、チャンネルには `<#CHANNEL_ID>`、ロールには `<@&ROLE_ID>` です。従来の `<@!USER_ID>` ニックネームメンション形式は使用しないでください。

    `requireMention` はギルド/チャンネルごとに設定されます（`channels.discord.guilds...`）。
    `ignoreOtherMentions` は、別のユーザー/ロールにメンションしているがボットにはメンションしていないメッセージを任意で破棄します（@everyone/@here を除く）。

    グループ DM:

    - デフォルト: 無視されます（`dm.groupEnabled=false`）
    - `dm.groupChannels` による任意の許可リスト（チャンネル ID または slug）

  </Tab>
</Tabs>

### ロールベースのエージェントルーティング

`bindings[].match.roles` を使用して、Discord ギルドメンバーをロール ID ごとに異なるエージェントへルーティングします。ロールベースのバインディングはロール ID のみを受け入れ、ピアまたは親ピアのバインディングの後、ギルド専用バインディングの前に評価されます。バインディングで他のマッチフィールドも設定している場合（例: `peer` + `guildId` + `roles`）、設定されたすべてのフィールドが一致する必要があります。

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
- `commands.native=false` は、起動時の Discord スラッシュコマンド登録とクリーンアップをスキップします。以前に登録されたコマンドは、Discord アプリから削除するまで Discord に表示され続ける場合があります。
- ネイティブコマンドの認可は、通常のメッセージ処理と同じ Discord の許可リスト/ポリシーを使用します。
- 認可されていないユーザーにも、コマンドが Discord UI に表示される場合があります。実行時には引き続き OpenClaw の認可が強制され、"not authorized" が返されます。

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

    - `off`（デフォルト）
    - `first`
    - `all`
    - `batched`

    注: `off` は暗黙的な返信スレッド化を無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。
    `first` は、ターンの最初の送信 Discord メッセージに、暗黙的なネイティブ返信参照を常に付与します。
    `batched` は、受信イベントが複数メッセージのデバウンス済みバッチだった場合にのみ、Discord の暗黙的なネイティブ返信参照を付与します。これは、すべての単一メッセージターンではなく、主に曖昧で短時間に集中するチャットにネイティブ返信を使いたい場合に便利です。

    メッセージ ID はコンテキスト/履歴に公開されるため、エージェントは特定のメッセージを対象にできます。

  </Accordion>

  <Accordion title="リンクプレビュー">
    Discord はデフォルトで URL のリッチリンク埋め込みを生成します。OpenClaw はデフォルトで、送信 Discord メッセージ上のそれらの生成済み埋め込みを抑制するため、明示的に有効化しない限り、エージェントが送信した URL はプレーンリンクのままになります。

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    1 つのアカウントを上書きするには `channels.discord.accounts.<id>.suppressEmbeds` を設定します。エージェントのメッセージツール送信でも、単一メッセージに `suppressEmbeds: false` を渡せます。明示的な Discord `embeds` ペイロードは、デフォルトのリンクプレビュー設定では抑制されません。

  </Accordion>

  <Accordion title="ライブストリームプレビュー">
    OpenClaw は一時メッセージを送信し、テキストが到着するたびに編集することで、下書き返信をストリーミングできます。`channels.discord.streaming` は `off` | `partial` | `block` | `progress`（デフォルト）を受け取ります。`progress` は編集可能なステータス下書きを 1 つ保持し、最終配信までツール進捗で更新します。共有スターターラベルは流れる行なので、十分な作業が表示されると他と同様にスクロールして見えなくなります。`streamMode` はレガシーランタイムエイリアスです。永続化済み設定を正規キーに書き換えるには `openclaw doctor --fix` を実行します。

    Discord プレビュー編集を無効にするには、`channels.discord.streaming.mode` を `off` に設定します。Discord ブロックストリーミングが明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためプレビューストリームをスキップします。

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - `partial` は、トークンが到着するたびに単一のプレビューメッセージを編集します。
    - `block` は下書きサイズのチャンクを出力します（サイズとブレークポイントの調整には `draftChunk` を使用し、`textChunkLimit` にクランプされます）。
    - メディア、エラー、明示的な返信の最終応答は、保留中のプレビュー編集をキャンセルします。
    - `streaming.preview.toolProgress`（デフォルト `true`）は、ツール/進捗更新でプレビューメッセージを再利用するかどうかを制御します。
    - ツール/進捗行は、利用可能な場合、コンパクトな絵文字 + タイトル + 詳細としてレンダリングされます。例: `🛠️ Bash: run tests` または `🔎 Web Search: for "query"`。
    - `streaming.progress.commentary`（デフォルト `false`）は、一時的な進捗下書き内のアシスタントのコメント/前置きテキストを有効にします。コメントは表示前にクリーンアップされ、一時的なままで、最終回答の配信は変更しません。
    - `streaming.progress.maxLineChars` は、行ごとの進捗プレビュー予算を制御します。散文は単語境界で短縮され、コマンドとパスの詳細は有用な接尾部を保持します。
    - `streaming.preview.commandText` / `streaming.progress.commandText` は、コンパクトな進捗行のコマンド/実行詳細を制御します: `raw`（デフォルト）または `status`（ツールラベルのみ）。

    コンパクトな進捗行を維持しつつ、生のコマンド/実行テキストを非表示にします。

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

    プレビューストリーミングはテキスト専用です。メディア返信は通常の配信にフォールバックします。`block` ストリーミングが明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためプレビューストリームをスキップします。

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
    - スレッドセッションは、親チャンネルのセッションレベル `/model` 選択をモデル専用フォールバックとして継承します。スレッドローカルの `/model` 選択が引き続き優先され、トランスクリプト継承が有効でない限り親トランスクリプト履歴はコピーされません。
    - `channels.discord.thread.inheritParent`（デフォルト `false`）は、新しい自動スレッドに親トランスクリプトからのシードを有効化します。アカウントごとの上書きは `channels.discord.accounts.<id>.thread.inheritParent` 配下にあります。
    - メッセージツールのリアクションは、`user:<id>` DM ターゲットを解決できます。
    - `guilds.<guild>.channels.<channel>.requireMention: false` は、返信段階のアクティベーションフォールバック中も保持されます。

    チャンネルトピックは**信頼されない**コンテキストとして注入されます。許可リストは、誰がエージェントをトリガーできるかを制御するものであり、完全な補足コンテキストの秘匿境界ではありません。

  </Accordion>

  <Accordion title="サブエージェント向けスレッド束縛セッション">
    Discord はスレッドをセッションターゲットにバインドできるため、そのスレッド内の後続メッセージは同じセッション（サブエージェントセッションを含む）へルーティングされ続けます。

    コマンド:

    - `/focus <target>` 現在/新規スレッドをサブエージェント/セッションターゲットにバインド
    - `/unfocus` 現在のスレッドバインディングを削除
    - `/agents` アクティブな実行とバインディング状態を表示
    - `/session idle <duration|off>` フォーカス済みバインディングの非アクティブ自動フォーカス解除を確認/更新
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
    - `channels.discord.threadBindings.*` は Discord の動作を上書きします。
    - `spawnSessions` は、`sessions_spawn({ thread: true })` と ACP スレッド生成のためのスレッド自動作成/バインドを制御します。デフォルト: `true`。
    - `defaultSpawnContext` は、スレッド束縛生成におけるネイティブサブエージェントコンテキストを制御します。デフォルト: `"fork"`。
    - 非推奨の `spawnSubagentSessions`/`spawnAcpSessions` キーは、`openclaw doctor --fix` によって移行されます。
    - アカウントでスレッドバインディングが無効な場合、`/focus` と関連するスレッドバインディング操作は利用できません。

    [サブエージェント](/ja-JP/tools/subagents)、[ACP エージェント](/ja-JP/tools/acp-agents)、[設定リファレンス](/ja-JP/gateway/configuration-reference) を参照してください。

  </Accordion>

  <Accordion title="永続 ACP チャンネルバインディング">
    安定した「常時稼働」ACP ワークスペースでは、Discord 会話を対象にしたトップレベルの型付き ACP バインディングを設定します。

    設定パス:

    - `bindings[]`、`type: "acp"` と `match.channel: "discord"` を指定

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

    - `/acp spawn codex --bind here` は、現在のチャンネルまたはスレッドをその場でバインドし、以後のメッセージを同じ ACP セッションに保持します。スレッドメッセージは親チャンネルのバインディングを継承します。
    - バインド済みチャンネルまたはスレッドでは、`/new` と `/reset` が同じ ACP セッションをその場でリセットします。一時的なスレッドバインディングは、アクティブな間ターゲット解決を上書きできます。
    - `spawnSessions` は、`--thread auto|here` による子スレッド作成/バインディングを制御します。

    バインディング動作の詳細については、[ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

  </Accordion>

  <Accordion title="リアクション通知">
    ギルドごとのリアクション通知モード:

    - `off`
    - `own`（デフォルト）
    - `all`
    - `allowlist`（`guilds.<id>.users` を使用）

    リアクションイベントはシステムイベントに変換され、ルーティングされた Discord セッションに添付されます。

  </Accordion>

  <Accordion title="確認リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間、確認絵文字を送信します。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - エージェント ID 絵文字フォールバック（`agents.list[].identity.emoji`、なければ "👀"）

    注:

    - Discord は Unicode 絵文字またはカスタム絵文字名を受け入れます。
    - チャンネルまたはアカウントでリアクションを無効にするには `""` を使用します。

  </Accordion>

  <Accordion title="設定書き込み">
    チャンネル起点の設定書き込みはデフォルトで有効です。

    これは `/config set|unset` フローに影響します（コマンド機能が有効な場合）。

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
    `channels.discord.proxy` を使用して、Discord Gateway WebSocket トラフィックと起動時 REST ルックアップ（アプリケーション ID + 許可リスト解決）を HTTP(S) プロキシ経由でルーティングします。

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
    プロキシされたメッセージをシステムメンバー ID にマッピングするには、PluralKit 解決を有効にします。

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // 任意。プライベートシステムに必要
      },
    },
  },
}
```

    注:

    - allowlist では `pk:<memberId>` を使用できます
    - メンバー表示名は `channels.discord.dangerouslyAllowNameMatching: true` の場合のみ、name/slug で照合されます
    - ルックアップは元のメッセージ ID を使用し、時間ウィンドウで制限されます
    - ルックアップに失敗した場合、プロキシされたメッセージは bot メッセージとして扱われ、`allowBots=true` でない限り破棄されます

  </Accordion>

  <Accordion title="アウトバウンドメンションエイリアス">
    既知の Discord ユーザーに対してエージェントが決定的なアウトバウンドメンションを必要とする場合は、`mentionAliases` を使用します。キーは先頭の `@` を除いたハンドルです。値は Discord ユーザー ID です。不明なハンドル、`@everyone`、`@here`、および Markdown コードスパン内のメンションは変更されません。

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

    アクティビティの例（カスタムステータスがデフォルトのアクティビティタイプです）:

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
    - 1: ストリーミング中（`activityUrl` が必要）
    - 2: 聞いています
    - 3: 視聴中
    - 4: カスタム（アクティビティテキストをステータス状態として使用します。絵文字は任意です）
    - 5: 競技中

    自動プレゼンスの例（ランタイムヘルスシグナル）:

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
    - `autoPresence.exhaustedText`（`{reason}` プレースホルダーをサポート）

  </Accordion>

  <Accordion title="Discord での承認">
    Discord は DM でのボタンベースの承認処理をサポートし、任意で元のチャンネルに承認プロンプトを投稿できます。

    設定パス:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（任意。可能な場合は `commands.ownerAllowFrom` にフォールバック）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    `enabled` が未設定または `"auto"` で、`execApprovals.approvers` または `commands.ownerAllowFrom` から少なくとも 1 人の承認者を解決できる場合、Discord はネイティブ exec 承認を自動的に有効にします。Discord はチャンネルの `allowFrom`、レガシーの `dm.allowFrom`、またはダイレクトメッセージの `defaultTo` から exec 承認者を推論しません。ネイティブ承認クライアントとしての Discord を明示的に無効にするには、`enabled: false` を設定します。

    `/diagnostics` や `/export-trajectory` などの機密性の高いオーナー専用グループコマンドでは、OpenClaw は承認プロンプトと最終結果を非公開で送信します。呼び出し元のオーナーに Discord オーナールートがある場合はまず Discord DM を試し、利用できない場合は Telegram など、`commands.ownerAllowFrom` から利用可能な最初のオーナールートにフォールバックします。

    `target` が `channel` または `both` の場合、承認プロンプトはチャンネルに表示されます。解決済みの承認者のみがボタンを使用できます。他のユーザーには一時的な拒否が返されます。承認プロンプトにはコマンドテキストが含まれるため、チャンネル配信は信頼済みチャンネルでのみ有効にしてください。セッションキーからチャンネル ID を導出できない場合、OpenClaw は DM 配信にフォールバックします。

    Discord は他のチャットチャンネルで使用される共有承認ボタンもレンダリングします。ネイティブ Discord アダプターは主に、承認者 DM ルーティングとチャンネルファンアウトを追加します。
    これらのボタンが存在する場合、それらが主要な承認 UX です。OpenClaw は、
    ツール結果がチャット承認を利用できない、または手動承認が唯一の経路であると示す場合にのみ、
    手動の `/approve` コマンドを含める必要があります。
    Discord ネイティブ承認ランタイムがアクティブでない場合、OpenClaw は
    ローカルの決定的な `/approve <id> <decision>` プロンプトを表示したままにします。
    ランタイムがアクティブでもネイティブカードをどのターゲットにも配信できない場合、
    OpenClaw は保留中の承認から正確な `/approve` コマンドを含む
    同じチャット内のフォールバック通知を送信します。

    Gateway 認証と承認解決は、共有 Gateway クライアント契約に従います（`plugin:` ID は `plugin.approval.resolve` 経由で解決され、その他の ID は `exec.approval.resolve` 経由で解決されます）。承認はデフォルトで 30 分後に期限切れになります。

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

OpenClaw は exec 承認とクロスコンテキストマーカーに Discord components v2 を使用します。Discord メッセージアクションはカスタム UI 用の `components` も受け付けられます（高度。discord ツールを介してコンポーネントペイロードを構築する必要があります）。一方、レガシーの `embeds` も引き続き利用できますが、推奨されません。

- `channels.discord.ui.components.accentColor` は Discord コンポーネントコンテナで使用されるアクセントカラー（hex）を設定します。
- `channels.discord.accounts.<id>.ui.components.accentColor` でアカウントごとに設定します。
- `channels.discord.agentComponents.ttlMs` は、送信済み Discord コンポーネントコールバックが登録されたままになる時間を制御します（デフォルト `1800000`、最大 `86400000`）。`channels.discord.accounts.<id>.agentComponents.ttlMs` でアカウントごとに設定します。
- components v2 が存在する場合、`embeds` は無視されます。
- プレーン URL プレビューはデフォルトで抑制されます。単一のアウトバウンドリンクを展開する必要がある場合は、メッセージアクションで `suppressEmbeds: false` を設定します。

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

Discord には 2 つの異なる音声サーフェスがあります。リアルタイムの **音声チャンネル**（継続的な会話）と **音声メッセージ添付ファイル**（波形プレビュー形式）です。Gateway はその両方をサポートします。

### 音声チャンネル

セットアップチェックリスト:

1. Discord Developer Portal で Message Content Intent を有効にします。
2. ロール/ユーザー allowlist を使用する場合は Server Members Intent を有効にします。
3. `bot` と `applications.commands` スコープで bot を招待します。
4. 対象の音声チャンネルで Connect、Speak、Send Messages、Read Message History を付与します。
5. ネイティブコマンド（`commands.native` または `channels.discord.commands.native`）を有効にします。
6. `channels.discord.voice` を設定します。

セッションを制御するには `/vc join|leave|status` を使用します。このコマンドはアカウントのデフォルトエージェントを使用し、他の Discord コマンドと同じ allowlist およびグループポリシールールに従います。

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

参加前に bot の有効な権限を確認するには、次を実行します:

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
        model: "openai/gpt-5.5",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        allowedChannels: [
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
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

注:

- `voice.tts` は、`stt-tts` 音声再生のみで `messages.tts` を上書きします。リアルタイムモードでは `voice.realtime.speakerVoice` を使用します。
- `voice.mode` は会話パスを制御します。デフォルトは `agent-proxy` です。リアルタイム音声フロントエンドがターンのタイミング、割り込み、再生を処理し、実質的な作業を `openclaw_agent_consult` 経由でルーティングされた OpenClaw エージェントに委譲し、その結果をその話者からの入力済み Discord プロンプトのように扱います。`stt-tts` は以前のバッチ STT と TTS のフローを維持します。`bidi` は、OpenClaw ブレイン向けに `openclaw_agent_consult` を公開しながら、リアルタイムモデルが直接会話できるようにします。
- `voice.agentSession` は、どの OpenClaw 会話が音声ターンを受け取るかを制御します。音声チャンネル自身のセッションを使う場合は未設定のままにします。または、`{ mode: "target", target: "channel:<text-channel-id>" }` を設定して、音声チャンネルを `#maintainers` などの既存の Discord テキストチャンネルセッションのマイク/スピーカー拡張として動作させます。
- `voice.model` は、Discord 音声応答とリアルタイム consult で使う OpenClaw エージェントブレインを上書きします。ルーティングされたエージェントモデルを継承する場合は未設定のままにします。これは `voice.realtime.model` とは別です。
- `voice.followUsers` を使うと、ボットが選択したユーザーとともに Discord 音声へ参加、移動、退出できます。動作ルールと例については [音声でユーザーをフォローする](#follow-users-in-voice) を参照してください。
- `agent-proxy` は発話を `discord-voice` 経由でルーティングします。これにより、話者と対象セッションに対する通常の所有者/ツール認可は保持されますが、Discord 音声が再生を所有するため、エージェントの `tts` ツールは非表示になります。デフォルトでは、`agent-proxy` は所有者話者に対して consult に所有者相当の完全なツールアクセスを付与し (`voice.realtime.toolPolicy: "owner"`)、実質的な回答の前に OpenClaw エージェントへ consult することを強く優先します (`voice.realtime.consultPolicy: "always"`)。このデフォルトの `always` モードでは、リアルタイム層は consult の回答前に穴埋めの発話を自動で話しません。発話をキャプチャして文字起こしし、その後ルーティングされた OpenClaw の回答を話します。Discord が最初の回答をまだ再生している間に複数の強制 consult 回答が完了した場合、後続の正確な発話回答は文の途中で発話を置き換えるのではなく、再生がアイドルになるまでキューに入れられます。
- `stt-tts` モードでは、STT は `tools.media.audio` を使用します。`voice.model` は文字起こしに影響しません。
- リアルタイムモードでは、`voice.realtime.provider`、`voice.realtime.model`、`voice.realtime.speakerVoice` がリアルタイム音声セッションを設定します。OpenAI Realtime 2 と Codex ブレインを使う場合は、`voice.realtime.model: "gpt-realtime-2"` と `voice.model: "openai/gpt-5.5"` を使用します。
- リアルタイム音声モードでは、デフォルトで小さな `IDENTITY.md`、`USER.md`、`SOUL.md` プロファイルファイルをリアルタイムプロバイダー指示に含めるため、高速な直接ターンでも、ルーティングされた OpenClaw エージェントと同じアイデンティティ、ユーザー基盤、ペルソナを保てます。これをカスタマイズするには `voice.realtime.bootstrapContextFiles` にサブセットを設定し、無効化するには `[]` を設定します。対応するリアルタイムブートストラップファイルはこれらのプロファイルファイルに限定されます。`AGENTS.md` は通常のエージェントコンテキストに残ります。注入されたプロファイルコンテキストは、ワークスペース作業、現在の事実、メモリ検索、ツールに裏付けられたアクションにおいて `openclaw_agent_consult` を置き換えるものではありません。
- OpenAI `agent-proxy` リアルタイムモードでは、文字起こしがウェイク名で始まるか終わるまで Discord リアルタイム音声を無音にしておくには、`voice.realtime.requireWakeName: true` を設定します。設定するウェイク名は 1 語または 2 語でなければなりません。`voice.realtime.wakeNames` が未設定の場合、OpenClaw はルーティングされたエージェントの `name` と `OpenClaw` を使用し、フォールバックとしてエージェント ID と `OpenClaw` を使用します。ウェイク名ゲートはリアルタイムプロバイダーの自動応答を無効にし、受け入れられたターンを OpenClaw エージェント consult パス経由でルーティングし、最終文字起こしが到着する前に部分文字起こしから先頭のウェイク名が認識された場合は短い音声確認を返します。
- OpenAI リアルタイムプロバイダーは、現在の Realtime 2 イベント名と、出力音声および文字起こしイベント向けのレガシーな Codex 互換エイリアスを受け入れるため、互換プロバイダースナップショットがずれてもアシスタント音声は失われません。
- `voice.realtime.bargeIn` は、Discord の話者開始イベントがアクティブなリアルタイム再生を割り込むかどうかを制御します。未設定の場合、リアルタイムプロバイダーの入力音声割り込み設定に従います。
- `voice.realtime.minBargeInAudioEndMs` は、OpenAI リアルタイム barge-in が音声を切り詰める前の最小アシスタント再生時間を制御します。デフォルト: `250`。エコーの少ない部屋で即時割り込みするには `0` を設定し、エコーが多いスピーカー構成では値を上げます。
- Discord 再生で OpenAI 音声を使うには、`voice.tts.provider: "openai"` を設定し、`voice.tts.providers.openai.speakerVoice` 配下で Text-to-speech 音声を選択します。現在の OpenAI TTS モデルでは、`cedar` は男性的に聞こえる良い選択肢です。
- チャンネルごとの Discord `systemPrompt` 上書きは、その音声チャンネルの音声文字起こしターンに適用されます。
- 音声文字起こしターンは、所有者制限付きコマンドとチャンネルアクション向けに、Discord `allowFrom` (または `dm.allowFrom`) から所有者ステータスを導出します。エージェントツールの可視性は、ルーティングされたセッションに設定されたツールポリシーに従います。
- Discord 音声はテキスト専用設定ではオプトインです。`/vc` コマンド、音声ランタイム、`GuildVoiceStates` Gateway intent を有効にするには `channels.discord.voice.enabled=true` を設定します (または既存の `channels.discord.voice` ブロックを維持します)。
- `channels.discord.intents.voiceStates` は、音声状態 intent サブスクリプションを明示的に上書きできます。有効な音声有効化状態に intent を従わせるには、未設定のままにします。
- `voice.autoJoin` に同じギルドのエントリが複数ある場合、OpenClaw はそのギルドで最後に設定されたチャンネルへ参加します。
- `voice.allowedChannels` は任意の滞在許可リストです。`/vc join` で認可済みの任意の Discord 音声チャンネルへ参加できるようにするには未設定のままにします。設定すると、`/vc join`、起動時の自動参加、ボットの音声状態移動は、列挙された `{ guildId, channelId }` エントリに制限されます。すべての Discord 音声参加を拒否するには空配列に設定します。Discord がボットを許可リスト外へ移動した場合、OpenClaw はそのチャンネルから退出し、利用可能な場合は設定済みの自動参加ターゲットへ再参加します。
- `voice.daveEncryption` と `voice.decryptionFailureTolerance` は `@discordjs/voice` の参加オプションへ渡されます。
- 未設定の場合、`@discordjs/voice` のデフォルトは `daveEncryption=true` と `decryptionFailureTolerance=24` です。
- OpenClaw は、Discord 音声受信とリアルタイム raw PCM 再生に、バンドルされた `libopus-wasm` コーデックを使用します。固定された libopus WebAssembly ビルドを同梱しており、ネイティブ opus アドオンは不要です。
- `voice.connectTimeoutMs` は、`/vc join` と自動参加試行における初期 `@discordjs/voice` Ready 待機を制御します。デフォルト: `30000`。
- `voice.reconnectGraceMs` は、切断された音声セッションが再接続を開始するまで、OpenClaw が破棄前に待機する時間を制御します。デフォルト: `15000`。
- `stt-tts` モードでは、別のユーザーが話し始めただけでは音声再生は停止しません。フィードバックループを避けるため、OpenClaw は TTS 再生中の新しい音声キャプチャを無視します。次のターンでは再生が完了してから話してください。リアルタイムモードでは、話者開始を barge-in シグナルとしてリアルタイムプロバイダーへ転送します。
- リアルタイムモードでは、スピーカーから開いたマイクへ入るエコーが barge-in のように見え、再生を割り込むことがあります。エコーが多い Discord ルームでは、入力音声で OpenAI が自動割り込みしないように `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` を設定します。Discord の話者開始イベントでアクティブな再生を引き続き割り込ませたい場合は、`voice.realtime.bargeIn: true` を追加します。OpenAI リアルタイムブリッジは、`voice.realtime.minBargeInAudioEndMs` より短い再生切り詰めをエコー/ノイズの可能性が高いものとして無視し、Discord 再生をクリアするのではなくスキップとしてログに記録します。
- `voice.captureSilenceGraceMs` は、Discord が話者停止を報告した後、OpenClaw がその音声セグメントを STT 用に確定するまで待つ時間を制御します。デフォルト: `2000`。Discord が通常の間を細切れの部分文字起こしに分割する場合は、この値を上げます。
- ElevenLabs が選択された TTS プロバイダーの場合、Discord 音声再生はストリーミング TTS を使用し、プロバイダー応答ストリームから開始します。ストリーミング対応のないプロバイダーは、合成された一時ファイルのパスにフォールバックします。
- OpenClaw は受信復号失敗も監視し、短い時間枠内で失敗が繰り返された後に音声チャンネルを退出/再参加して自動復旧します。
- 更新後に受信ログで `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` が繰り返し表示される場合は、依存関係レポートとログを収集してください。バンドルされた `@discordjs/voice` 系列には、discord.js PR #11449 の upstream パディング修正が含まれており、これにより discord.js issue #11419 が解決されました。
- `The operation was aborted` 受信イベントは、OpenClaw がキャプチャ済み話者セグメントを確定するときに想定されるものです。これは詳細診断であり、警告ではありません。
- 詳細な Discord 音声ログには、受け入れられた各話者セグメントについて、境界付きの 1 行 STT 文字起こしプレビューが含まれます。そのため、デバッグ時に無制限の文字起こしテキストをダンプせず、ユーザー側とエージェント応答側の両方を確認できます。
- `agent-proxy` モードでは、強制 consult フォールバックは、`...` で終わるテキストや `and` のような末尾の接続語など、不完全な文字起こし断片の可能性が高いものに加え、「すぐ戻ります」や「さようなら」のような明らかにアクション不可能な締めの言葉をスキップします。これにより古いキュー済み回答が防止される場合、ログには `forced agent consult skipped reason=...` が表示されます。

### 音声でユーザーをフォローする

起動時に固定チャンネルへ参加したり `/vc join` を待ったりするのではなく、Discord 音声ボットを 1 人以上の既知の Discord ユーザーと同じ場所に留めたい場合は、`voice.followUsers` を使用します。

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        followUsersEnabled: true,
        followUsers: ["discord:123456789012345678"],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
      },
    },
  },
}
```

動作:

- `followUsers` は raw Discord ユーザー ID と `discord:<id>` 値を受け入れます。OpenClaw は音声状態イベントとの照合前に両方の形式を正規化します。
- `followUsersEnabled` は、`followUsers` が設定されている場合、デフォルトで `true` になります。保存済みリストを保持しつつ自動音声フォローを停止するには、`false` に設定します。
- フォロー対象ユーザーが許可された音声チャンネルに参加すると、OpenClaw はそのチャンネルに参加します。ユーザーが移動すると、OpenClaw も一緒に移動します。アクティブなフォロー対象ユーザーが切断すると、OpenClaw は退出します。
- 同じギルドに複数のフォロー対象ユーザーがいて、アクティブなフォロー対象ユーザーが退出した場合、OpenClaw はギルドから退出する前に、追跡中の別のフォロー対象ユーザーのチャンネルへ移動します。複数のフォロー対象ユーザーが同時に移動した場合は、最後に観測された音声状態イベントが優先されます。
- `allowedChannels` は引き続き適用されます。許可されていないチャンネルにいるフォロー対象ユーザーは無視され、フォロー所有のセッションは別のフォロー対象ユーザーへ移動するか退出します。
- OpenClaw は、起動時と境界付き間隔で、取り逃した音声状態イベントを照合します。照合は設定済みギルドをサンプリングし、1 回の実行あたりの REST ルックアップ数に上限を設けるため、非常に大きい `followUsers` リストでは収束までに複数の間隔が必要になることがあります。
- ユーザーをフォロー中に Discord または管理者がボットを移動した場合、OpenClaw は音声セッションを再構築し、移動先が許可されていればフォロー所有権を保持します。ボットが `allowedChannels` の外へ移動された場合、OpenClaw は退出し、存在する場合は設定済みターゲットへ再参加します。
- DAVE 受信復旧では、復号失敗が繰り返された後に同じチャンネルを退出して再参加することがあります。フォロー所有のセッションはその復旧パスを通じてフォロー所有権を保持するため、後でフォロー対象ユーザーが切断してもチャンネルから退出します。

参加モードを選択します。

- 自分が音声にいるときにボットも自動で音声にいてほしい個人用またはオペレーター用の構成では、`followUsers` を使用します。
- 追跡対象ユーザーが音声にいない場合でも存在しているべき固定ルームボットには、`autoJoin` を使用します。
- 1 回限りの参加や、自動音声プレゼンスが予想外に感じられる部屋では、`/vc join` を使用します。

Discord 音声コーデック:

- 音声受信ログには `discord voice: opus decoder: libopus-wasm` が表示されます。
- リアルタイム再生では、パケットを `@discordjs/voice` に渡す前に、同じ同梱 `libopus-wasm` パッケージで raw 48 kHz stereo PCM を Opus にエンコードします。
- ファイル再生とプロバイダーストリーム再生では、ffmpeg で raw 48 kHz stereo PCM にトランスコードし、その後 Discord に送信する Opus パケットストリームに `libopus-wasm` を使用します。

STT と TTS のパイプライン:

- Discord PCM キャプチャは WAV 一時ファイルに変換されます。
- `tools.media.audio` が STT を処理します。たとえば `openai/gpt-4o-mini-transcribe` です。
- トランスクリプトは Discord の入力とルーティングを通じて送信されます。一方で応答 LLM は、agent の `tts` ツールを隠して返却テキストを要求する音声出力ポリシーで実行されます。これは、Discord 音声が最終的な TTS 再生を所有するためです。
- `voice.model` が設定されている場合、この音声チャンネルターンの応答 LLM だけを上書きします。
- `voice.tts` は `messages.tts` にマージされます。ストリーミング対応プロバイダーはプレイヤーに直接供給し、それ以外の場合は生成された音声ファイルが参加中のチャンネルで再生されます。

デフォルトの agent-proxy 音声チャンネルセッション例:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

`voice.agentSession` ブロックがない場合、各音声チャンネルにはそれぞれ独自のルーティング済み OpenClaw セッションが割り当てられます。たとえば、`/vc join channel:234567890123456789` はその Discord 音声チャンネルのセッションと会話します。リアルタイムモデルは音声フロントエンドにすぎません。実質的なリクエストは構成済みの OpenClaw agent に渡されます。リアルタイムモデルが consult ツールを呼び出さずに最終トランスクリプトを生成した場合、デフォルトでも agent と会話しているように動作するよう、OpenClaw はフォールバックとして consult を強制します。

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
          providers: {
            openai: {
              model: "gpt-4o-mini-tts",
              speakerVoice: "cedar",
            },
          },
        },
      },
    },
  },
}
```

リアルタイム双方向の例:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
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
        model: "openai/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

`agent-proxy` モードでは、bot は構成済みの音声チャンネルに参加しますが、OpenClaw agent のターンはターゲットチャンネルの通常のルーティング済みセッションと agent を使用します。リアルタイム音声セッションは、返された結果を音声チャンネルに読み上げます。supervisor agent は引き続き、そのツールポリシーに従って通常のメッセージツールを使用できます。適切なアクションであれば、別の Discord メッセージを送信することもできます。

委任された OpenClaw 実行がアクティブな間、新しい Discord 音声トランスクリプトは、別の agent ターンを開始する前にライブ実行制御として扱われます。「status」、「cancel that」、「use the smaller fix」、「when you're done also check tests」などのフレーズは、アクティブなセッションに対するステータス、キャンセル、誘導、またはフォローアップ入力として分類されます。ステータス、キャンセル、受け入れられた誘導、フォローアップの結果は音声チャンネルに読み上げられるため、呼び出し元は OpenClaw がリクエストを処理したかどうかを把握できます。

便利なターゲット形式:

- `target: "channel:123456789012345678"` は Discord テキストチャンネルセッションを経由してルーティングします。
- `target: "123456789012345678"` はチャンネルターゲットとして扱われます。
- `target: "dm:123456789012345678"` または `target: "user:123456789012345678"` は、そのダイレクトメッセージセッションを経由してルーティングします。

エコーが多い OpenAI Realtime の例:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
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

モデルが開いたマイクを通じて自分自身の Discord 再生を聞いてしまうものの、発話で割り込みたい場合にこれを使用します。OpenClaw は OpenAI が raw 入力音声で自動割り込みしないようにしつつ、`bargeIn: true` によって、次のキャプチャターンが OpenAI に届く前に、Discord の話者開始イベントとすでにアクティブな話者音声がアクティブなリアルタイム応答をキャンセルできるようにします。`audioEndMs` が `minBargeInAudioEndMs` 未満の非常に早い barge-in シグナルは、エコーまたはノイズの可能性が高いものとして扱われ、モデルが最初の再生フレームで途切れないように無視されます。

想定される音声ログ:

- 参加時: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- リアルタイム開始時: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 話者音声時: `discord voice: realtime speaker turn opened ...`、`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`、および `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 古い発話をスキップしたとき: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` または `reason=non-actionable-closing ...`
- リアルタイム応答完了時: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 再生停止/リセット時: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- リアルタイム consult 時: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- agent の回答時: `discord voice: agent turn answer ...`
- 厳密な発話のキュー投入時: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...` に続いて `discord voice: realtime exact speech dequeued reason=player-idle ...`
- barge-in 検出時: `discord voice: realtime barge-in detected source=speaker-start ...` または `discord voice: realtime barge-in detected source=active-speaker-audio ...` に続いて `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- リアルタイム割り込み時: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in` に続いて、`discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` または `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- エコー/ノイズの無視時: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- barge-in 無効時: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- アイドル再生時: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

途切れる音声をデバッグするには、リアルタイム音声ログをタイムラインとして読みます。

1. `realtime audio playback started` は、Discord がアシスタント音声の再生を開始したことを意味します。ブリッジはこの時点から、アシスタント出力チャンク、Discord PCM バイト、プロバイダーのリアルタイムバイト、合成音声の長さをカウントし始めます。
2. `realtime speaker turn opened` は、Discord の話者がアクティブになったことを示します。再生がすでにアクティブで `bargeIn` が有効な場合、その後に `barge-in detected source=speaker-start` が続くことがあります。
3. `realtime input audio started` は、その話者ターンで最初の実際の音声フレームを受信したことを示します。ここで `outputActive=true` または非ゼロの `outputAudioMs` がある場合、アシスタント再生がまだアクティブな間にマイクが入力を送信していることを意味します。
4. `barge-in detected source=active-speaker-audio` は、アシスタント再生がアクティブな間に OpenClaw がライブ話者音声を検出したことを意味します。これは、有用な音声のない Discord 話者開始イベントと実際の割り込みを区別するのに役立ちます。
5. `barge-in requested reason=...` は、OpenClaw がリアルタイムプロバイダーにアクティブな応答のキャンセルまたは切り詰めを要求したことを意味します。`outputAudioMs`、`outputActive`、`playbackChunks` が含まれるため、割り込み前に実際にどれだけのアシスタント音声が再生されていたかを確認できます。
6. `realtime audio playback stopped reason=...` は、ローカルの Discord 再生リセットポイントです。理由は、誰が再生を停止したかを示します: `barge-in`、`player-idle`、`provider-clear-audio`、`forced-agent-consult`、`stream-close`、または `session-close`。
7. `realtime speaker turn closed` は、キャプチャされた入力ターンを要約します。`chunks=0` または `hasAudio=false` は、話者ターンは開いたものの、使用可能な音声がリアルタイムブリッジに到達しなかったことを意味します。`interruptedPlayback=true` は、その入力ターンがアシスタント出力と重なり、barge-in ロジックをトリガーしたことを意味します。

便利なフィールド:

- `outputAudioMs`: ログ行の前にリアルタイムプロバイダーが生成したアシスタント音声の長さ。
- `audioMs`: 再生停止前に OpenClaw がカウントしたアシスタント音声の長さ。
- `elapsedMs`: 再生ストリームまたは話者ターンの開始から終了までの実時間。
- `discordBytes`: Discord 音声へ送信、または Discord 音声から受信した 48 kHz stereo PCM バイト。
- `realtimeBytes`: リアルタイムプロバイダーへ送信、またはリアルタイムプロバイダーから受信したプロバイダー形式の PCM バイト。
- `playbackChunks`: アクティブな応答のために Discord に転送されたアシスタント音声チャンク。
- `sinceLastAudioMs`: 最後にキャプチャされた話者音声フレームから話者ターン終了までの間隔。

一般的なパターン:

- `source=active-speaker-audio`、小さい `outputAudioMs`、近くに同じユーザーがある即時の途切れは、通常、スピーカーのエコーがマイクに入っていることを示します。`voice.realtime.minBargeInAudioEndMs` を上げる、スピーカー音量を下げる、ヘッドホンを使う、または `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` を設定してください。
- `source=speaker-start` に続いて `speaker turn closed ... hasAudio=false` がある場合、Discord は話者開始を報告したものの、音声が OpenClaw に到達しなかったことを意味します。これは一時的な Discord 音声イベント、ノイズゲートの動作、またはクライアントが短時間マイクをオンにしたことが原因になり得ます。
- 近くに barge-in または `provider-clear-audio` がない `audio playback stopped reason=stream-close` は、ローカルの Discord 再生ストリームが予期せず終了したことを意味します。直前のプロバイダーと Discord プレイヤーのログを確認してください。
- `capture ignored during playback (barge-in disabled)` は、アシスタント音声がアクティブな間、OpenClaw が意図的に入力を破棄したことを意味します。発話で再生を割り込みたい場合は `voice.realtime.bargeIn` を有効にしてください。
- `barge-in ignored ... outputActive=false` は、Discord またはプロバイダー VAD が発話を報告したものの、OpenClaw には割り込むアクティブな再生がなかったことを意味します。これは音声を途切れさせるべきではありません。

認証情報はコンポーネントごとに解決されます。`voice.model` には LLM ルート認証、`tools.media.audio` には STT 認証、`messages.tts`/`voice.tts` には TTS 認証、`voice.realtime.providers` またはプロバイダーの通常の認証設定にはリアルタイムプロバイダー認証が使用されます。

### 音声メッセージ

Discord 音声メッセージには波形プレビューが表示され、OGG/Opus 音声が必要です。OpenClaw は波形を自動生成しますが、検査と変換のために Gateway ホスト上の `ffmpeg` と `ffprobe` が必要です。

- **ローカルファイルパス**を指定します（URL は拒否されます）。
- テキスト内容は省略します（Discord は同じペイロード内のテキスト + 音声メッセージを拒否します）。
- 任意の音声形式を使用できます。OpenClaw は必要に応じて OGG/Opus に変換します。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - Message Content Intent を有効にする
    - ユーザー/メンバー解決に依存する場合は Server Members Intent を有効にする
    - インテントを変更した後に Gateway を再起動する

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - `groupPolicy` を確認する
    - `channels.discord.guilds` の下にあるギルド許可リストを確認する
    - ギルドの `channels` マップが存在する場合、一覧にあるチャンネルのみが許可されます
    - `requireMention` の動作とメンションパターンを確認する

    役立つ確認:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    一般的な原因:

    - 一致するギルド/チャンネル許可リストなしで `groupPolicy="allowlist"` を使用している
    - `requireMention` が間違った場所に設定されている（`channels.discord.guilds` またはチャンネルエントリの下にある必要があります）
    - 送信者がギルド/チャンネルの `users` 許可リストでブロックされている

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    典型的なログ:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway キューの調整項目:

    - 単一アカウント: `channels.discord.eventQueue.listenerTimeout`
    - 複数アカウント: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - これは Discord Gateway リスナー処理のみを制御し、エージェントターンの有効期間は制御しません

    Discord は、キューに入ったエージェントターンにチャンネル所有のタイムアウトを適用しません。メッセージリスナーはすぐに引き渡し、キューに入った Discord 実行は、セッション/ツール/ランタイムのライフサイクルが完了するか処理を中止するまで、セッションごとの順序を維持します。

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

  <Accordion title="Gateway metadata lookup timeout warnings">
    OpenClaw は接続前に Discord `/gateway/bot` メタデータを取得します。一時的な失敗時は Discord のデフォルト Gateway URL にフォールバックし、ログ内でレート制限されます。

    メタデータタイムアウトの調整項目:

    - 単一アカウント: `channels.discord.gatewayInfoTimeoutMs`
    - 複数アカウント: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 設定が未指定の場合の env フォールバック: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - デフォルト: `30000`（30 秒）、最大: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw は起動時およびランタイム再接続後に Discord の Gateway `READY` イベントを待ちます。起動のずらしを行う複数アカウント構成では、デフォルトより長い起動時 READY ウィンドウが必要になる場合があります。

    READY タイムアウトの調整項目:

    - 起動時の単一アカウント: `channels.discord.gatewayReadyTimeoutMs`
    - 起動時の複数アカウント: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 設定が未指定の場合の起動時 env フォールバック: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 起動時デフォルト: `15000`（15 秒）、最大: `120000`
    - ランタイムの単一アカウント: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - ランタイムの複数アカウント: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 設定が未指定の場合のランタイム env フォールバック: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - ランタイムデフォルト: `30000`（30 秒）、最大: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    `channels status --probe` の権限チェックは、数値のチャンネル ID に対してのみ機能します。

    slug キーを使用している場合、ランタイムの照合は引き続き機能することがありますが、プローブは権限を完全には検証できません。

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM 無効: `channels.discord.dm.enabled=false`
    - DM ポリシー無効: `channels.discord.dmPolicy="disabled"`（レガシー: `channels.discord.dm.policy`）
    - `pairing` モードでペアリング承認を待機中

  </Accordion>

  <Accordion title="Bot to bot loops">
    デフォルトでは、ボットが作成したメッセージは無視されます。

    `channels.discord.allowBots=true` を設定する場合は、ループ動作を避けるために厳密なメンションと許可リストのルールを使用してください。
    ボットへのメンションを含むボットメッセージのみを受け付けるには、`channels.discord.allowBots="mentions"` を推奨します。

    OpenClaw には共有の[ボットループ保護](/ja-JP/channels/bot-loop-protection)も同梱されています。`allowBots` によりボットが作成したメッセージがディスパッチに到達するたびに、Discord は受信イベントを `(account, channel, bot pair)` の事実にマッピングし、汎用ペアガードは構成済みイベント予算を超えた後にそのペアを抑制します。このガードは、以前は Discord のレート制限で停止する必要があった暴走する 2 ボットループを防ぎます。単一ボットのデプロイや、予算内に収まる 1 回限りのボット返信には影響しません。

    デフォルト設定（`allowBots` が設定されている場合に有効）:

    - `maxEventsPerWindow: 20` -- ボットペアはスライディングウィンドウ内で 20 件のメッセージを交換できます
    - `windowSeconds: 60` -- スライディングウィンドウの長さ
    - `cooldownSeconds: 60` -- 予算に達すると、どちらの方向の追加のボット間メッセージも 1 分間ドロップされます

    共有デフォルトを `channels.defaults.botLoopProtection` の下で一度設定し、正当なワークフローでより多くの余裕が必要な場合に Discord をオーバーライドします。優先順位は次のとおりです。

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - 組み込みデフォルト

    Discord は汎用の `maxEventsPerWindow`、`windowSeconds`、`cooldownSeconds` キーを使用します。

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // Optional Discord-wide override. Account blocks override individual
      // fields and inherit omitted fields from here.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write a Mantis Discord mention with the configured user id.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Allow up to five messages per minute before suppressing the pair.
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - Discord 音声受信の回復ロジックが含まれるよう、OpenClaw を最新に保つ（`openclaw update`）
    - `channels.discord.voice.daveEncryption=true`（デフォルト）を確認する
    - `channels.discord.voice.decryptionFailureTolerance=24`（アップストリームのデフォルト）から開始し、必要な場合のみ調整する
    - 次のログを監視する:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 自動再参加後も失敗が続く場合は、ログを収集し、[discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) と [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) のアップストリーム DAVE 受信履歴と比較する

  </Accordion>
</AccordionGroup>

## 設定リファレンス

主要リファレンス: [設定リファレンス - Discord](/ja-JP/gateway/config-channels#discord)。

<Accordion title="High-signal Discord fields">

- 起動/認証: `enabled`, `token`, `accounts.*`, `allowBots`
- ポリシー: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- コマンド: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- イベントキュー: `eventQueue.listenerTimeout`（リスナー予算）、`eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- 返信/履歴: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 配信: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- ストリーミング: `streaming`（レガシーエイリアス: `streamMode`）、`streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- メディア/リトライ: `mediaMaxMb`（Discord への送信アップロードを制限、デフォルト `100MB`）、`retry`
- アクション: `actions.*`
- プレゼンス: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- 機能: `threadBindings`, トップレベル `bindings[]`（`type: "acp"`）、`pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## 安全性と運用

- ボットトークンはシークレットとして扱います（管理環境では `DISCORD_BOT_TOKEN` を推奨）。
- Discord 権限は最小権限で付与します。
- コマンドのデプロイ/状態が古い場合は、Gateway を再起動し、`openclaw channels status --probe` で再確認します。

## 関連

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    Discord ユーザーを Gateway にペアリングします。
  </Card>
  <Card title="Groups" icon="users" href="/ja-JP/channels/groups">
    グループチャットと許可リストの動作。
  </Card>
  <Card title="Channel routing" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントにルーティングします。
  </Card>
  <Card title="Security" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと強化。
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    ギルドとチャンネルをエージェントにマッピングします。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作。
  </Card>
</CardGroup>
