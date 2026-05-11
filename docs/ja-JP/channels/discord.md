---
read_when:
    - Discord チャネル機能に取り組む
summary: Discord ボットのサポート状況、機能、設定
title: Discord
x-i18n:
    generated_at: "2026-05-11T20:20:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70107cf53c44f80e42f99f670aacf6eed8b77d839c05bccc853cd91a7273e5aa
    source_path: channels/discord.md
    workflow: 16
---

公式 Discord Gateway 経由で DM とギルドチャンネルに対応しています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Discord の DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブのコマンド動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復フロー。
  </Card>
</CardGroup>

## クイックセットアップ

Bot を含む新しいアプリケーションを作成し、その Bot を自分のサーバーに追加して、OpenClaw にペアリングする必要があります。自分専用のプライベートサーバーに Bot を追加することをおすすめします。まだ持っていない場合は、[先に作成してください](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**自分で作成 > 自分と友達のため** を選びます）。

<Steps>
  <Step title="Discord アプリケーションと Bot を作成する">
    [Discord Developer Portal](https://discord.com/developers/applications) に移動し、**新しいアプリケーション** をクリックします。「OpenClaw」のような名前を付けます。

    サイドバーで **Bot** をクリックします。**ユーザー名** を、OpenClaw エージェントに付けたい名前に設定します。

  </Step>

  <Step title="特権インテントを有効にする">
    引き続き **Bot** ページで、**特権 Gateway インテント** まで下にスクロールし、次を有効にします。

    - **メッセージコンテンツインテント**（必須）
    - **サーバーメンバーインテント**（推奨。ロール許可リストと名前から ID への照合に必要）
    - **プレゼンスインテント**（任意。プレゼンス更新にのみ必要）

  </Step>

  <Step title="Bot トークンをコピーする">
    **Bot** ページの上部に戻り、**トークンをリセット** をクリックします。

    <Note>
    名前に反して、これは最初のトークンを生成します。何かが「リセット」されるわけではありません。
    </Note>

    トークンをコピーしてどこかに保存します。これは **Bot トークン** で、すぐに必要になります。

  </Step>

  <Step title="招待 URL を生成し、Bot をサーバーに追加する">
    サイドバーで **OAuth2** をクリックします。Bot をサーバーに追加するための適切な権限を持つ招待 URL を生成します。

    **OAuth2 URL ジェネレーター** まで下にスクロールし、次を有効にします。

    - `bot`
    - `applications.commands`

    **Bot 権限** セクションが下に表示されます。少なくとも次を有効にします。

    **一般権限**
      - チャンネルを見る
    **テキスト権限**
      - メッセージを送信
      - メッセージ履歴を読む
      - 埋め込みリンク
      - ファイルを添付
      - リアクションを追加（任意）

    これは通常のテキストチャンネル向けの基本セットです。フォーラムやメディアチャンネルのワークフローでスレッドを作成または継続する場合を含め、Discord スレッドに投稿する予定がある場合は、**スレッドでメッセージを送信** も有効にします。
    下部に生成された URL をコピーしてブラウザーに貼り付け、サーバーを選択して **続行** をクリックして接続します。これで Discord サーバーに Bot が表示されるはずです。

  </Step>

  <Step title="開発者モードを有効にして ID を収集する">
    Discord アプリに戻り、内部 ID をコピーできるように開発者モードを有効にする必要があります。

    1. **ユーザー設定**（アバターの横の歯車アイコン）をクリック → **詳細設定** → **開発者モード** をオン
    2. サイドバーの **サーバーアイコン** を右クリック → **サーバー ID をコピー**
    3. **自分のアバター** を右クリック → **ユーザー ID をコピー**

    **サーバー ID** と **ユーザー ID** を Bot トークンと一緒に保存します。次のステップで 3 つすべてを OpenClaw に送ります。

  </Step>

  <Step title="サーバーメンバーからの DM を許可する">
    ペアリングを機能させるには、Discord が Bot からあなたへの DM を許可する必要があります。**サーバーアイコン** を右クリック → **プライバシー設定** → **ダイレクトメッセージ** をオンにします。

    これにより、サーバーメンバー（Bot を含む）があなたに DM を送信できます。OpenClaw で Discord の DM を使いたい場合は、これを有効のままにしてください。ギルドチャンネルだけを使う予定なら、ペアリング後に DM を無効にできます。

  </Step>

  <Step title="Bot トークンを安全に設定する（チャットで送らない）">
    Discord Bot トークンは秘密情報です（パスワードのようなものです）。エージェントにメッセージを送る前に、OpenClaw を実行しているマシンで設定します。

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
    マネージドサービスのインストールでは、`DISCORD_BOT_TOKEN` が存在するシェルから `openclaw gateway install` を実行するか、変数を `~/.openclaw/.env` に保存して、再起動後にサービスが env SecretRef を解決できるようにします。
    ホストが Discord の起動時アプリケーション検索でブロックされる、またはレート制限される場合は、Developer Portal から Discord アプリケーション/クライアント ID を設定して、起動時にその REST 呼び出しをスキップできるようにします。デフォルトアカウントには `channels.discord.applicationId` を使い、複数の Discord Bot を実行する場合は `channels.discord.accounts.<accountId>.applicationId` を使います。

  </Step>

  <Step title="OpenClaw を設定してペアリングする">

    <Tabs>
      <Tab title="エージェントに依頼">
        既存の任意のチャンネル（例: Telegram）で OpenClaw エージェントとチャットし、伝えます。Discord が最初のチャンネルの場合は、代わりに CLI / 設定タブを使います。

        > 「Discord Bot トークンはすでに設定に入れました。ユーザー ID `<user_id>` とサーバー ID `<server_id>` で Discord セットアップを完了してください。」
      </Tab>
      <Tab title="CLI / 設定">
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

        スクリプト化されたセットアップやリモートセットアップでは、同じ JSON5 ブロックを `openclaw config patch --file ./discord.patch.json5 --dry-run` で書き込み、その後 `--dry-run` なしで再実行します。平文の `token` 値に対応しています。SecretRef 値も env/file/exec プロバイダーを通じて `channels.discord.token` で対応しています。[シークレット管理](/ja-JP/gateway/secrets) を参照してください。

        複数の Discord Bot では、各 Bot トークンとアプリケーション ID をそのアカウント配下に保持します。トップレベルの `channels.discord.applicationId` はアカウントに継承されるため、すべてのアカウントで同じアプリケーション ID を使う場合にのみ、そこへ設定します。

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

    これで Discord の DM 経由でエージェントとチャットできるはずです。

  </Step>
</Steps>

<Note>
トークン解決はアカウントを認識します。設定のトークン値は env フォールバックより優先されます。`DISCORD_BOT_TOKEN` はデフォルトアカウントにのみ使われます。
有効な 2 つの Discord アカウントが同じ Bot トークンに解決される場合、OpenClaw はそのトークンに対して Gateway モニターを 1 つだけ起動します。設定由来のトークンはデフォルトの env フォールバックより優先されます。それ以外の場合は最初に有効化されたアカウントが優先され、重複アカウントは無効として報告されます。
高度なアウトバウンド呼び出し（メッセージツール/チャンネルアクション）では、呼び出しごとの明示的な `token` がその呼び出しに使われます。これは送信と read/probe スタイルのアクション（たとえば read/search/fetch/thread/pins/permissions）に適用されます。アカウントポリシー/リトライ設定は、アクティブなランタイムスナップショットで選択されたアカウントから引き続き取得されます。
</Note>

## 推奨: ギルドワークスペースをセットアップする

DM が動作したら、Discord サーバーを完全なワークスペースとしてセットアップできます。各チャンネルには独自のコンテキストを持つ独自のエージェントセッションが割り当てられます。これは、自分と Bot だけがいるプライベートサーバーにおすすめです。

<Steps>
  <Step title="サーバーをギルド許可リストに追加する">
    これにより、エージェントは DM だけでなく、サーバー上の任意のチャンネルで応答できるようになります。

    <Tabs>
      <Tab title="エージェントに依頼">
        > 「私の Discord サーバー ID `<server_id>` をギルド許可リストに追加してください」
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
    デフォルトでは、エージェントはギルドチャンネルで @mention された場合にのみ応答します。プライベートサーバーでは、おそらくすべてのメッセージに応答してほしいはずです。

    ギルドチャンネルでは、通常のアシスタントの最終返信はデフォルトで非公開のままです。Discord に表示される出力は `message` ツールで明示的に送信する必要があるため、エージェントはデフォルトでは待機し、チャンネル返信が有用だと判断した場合にのみ投稿できます。

    つまり、選択したモデルは確実にツールを呼び出せる必要があります。Discord で入力中表示が出て、ログにトークン使用量があるのに投稿メッセージがない場合は、セッションログで `didSendViaMessagingTool: false` を含むアシスタントテキストを確認してください。これは、モデルが `message(action=send)` を呼び出す代わりに、非公開の最終回答を生成したことを意味します。より強力なツール呼び出しモデルに切り替えるか、下の設定を使って従来の自動最終返信を復元してください。

    <Tabs>
      <Tab title="エージェントに依頼">
        > 「@mention されなくても、このサーバーでエージェントが応答できるようにしてください」
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

        グループ/チャンネルルームで従来の自動最終返信を復元するには、`messages.groupChat.visibleReplies: "automatic"` を設定します。

      </Tab>
    </Tabs>

  </Step>

  <Step title="ギルドチャンネルのメモリを計画する">
    デフォルトでは、長期メモリ（MEMORY.md）は DM セッションでのみ読み込まれます。ギルドチャンネルでは MEMORY.md は自動読み込みされません。

    <Tabs>
      <Tab title="エージェントに依頼">
        > 「Discord チャンネルで私が質問するとき、MEMORY.md から長期コンテキストが必要な場合は memory_search または memory_get を使ってください。」
      </Tab>
      <Tab title="手動">
        すべてのチャンネルで共有コンテキストが必要な場合は、安定した指示を `AGENTS.md` または `USER.md` に置きます（これらはすべてのセッションに注入されます）。長期メモは `MEMORY.md` に保持し、必要に応じてメモリツールでアクセスします。
      </Tab>
    </Tabs>

  </Step>
</Steps>

次に、Discord サーバーにいくつかのチャンネルを作成してチャットを始めます。エージェントはチャンネル名を参照でき、各チャンネルには独自の分離されたセッションが割り当てられます。そのため、`#coding`、`#home`、`#research`、またはワークフローに合う任意のチャンネルを設定できます。

## ランタイムモデル

- Gateway が Discord 接続を所有します。
- 返信ルーティングは決定的です。Discord の受信返信は Discord に返されます。
- Discord のギルド/チャンネルメタデータは、ユーザーに見える返信プレフィックスとしてではなく、信頼されないコンテキストとしてモデルプロンプトに追加されます。モデルがそのエンベロープをコピーして返した場合、OpenClaw は送信返信と以後の再生コンテキストから、コピーされたメタデータを取り除きます。
- デフォルトでは（`session.dmScope=main`）、ダイレクトチャットはエージェントのメインセッション（`agent:main:main`）を共有します。
- ギルドチャンネルは分離されたセッションキー（`agent:<agentId>:discord:channel:<channelId>`）です。
- グループ DM はデフォルトで無視されます（`channels.discord.dm.groupEnabled=false`）。
- ネイティブスラッシュコマンドは、分離されたコマンドセッション（`agent:<agentId>:discord:slash:<userId>`）で実行されますが、ルーティング先の会話セッションに `CommandTargetSessionKey` を引き続き渡します。
- Discord へのテキストのみの Cron/Heartbeat 通知配信は、最終的にアシスタントに見える回答を一度だけ使います。メディアと構造化コンポーネントペイロードは、エージェントが複数の配信可能ペイロードを出力する場合、複数メッセージのままです。

## フォーラムチャンネル

Discord のフォーラムチャンネルとメディアチャンネルはスレッド投稿のみを受け付けます。OpenClaw はそれらを作成する方法を 2 つサポートします。

- フォーラムの親（`channel:<forumId>`）にメッセージを送信して、スレッドを自動作成します。スレッドタイトルには、メッセージの最初の空でない行が使われます。
- `openclaw message thread create` を使って、スレッドを直接作成します。フォーラムチャンネルでは `--message-id` を渡さないでください。

例: フォーラムの親に送信してスレッドを作成する

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

例: フォーラムスレッドを明示的に作成する

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

フォーラムの親は Discord コンポーネントを受け付けません。コンポーネントが必要な場合は、スレッド自体（`channel:<threadId>`）に送信してください。

## インタラクティブコンポーネント

OpenClaw は、エージェントメッセージ向けに Discord components v2 コンテナをサポートします。`components` ペイロードを指定してメッセージツールを使います。インタラクション結果は通常の受信メッセージとしてエージェントにルーティングされ、既存の Discord `replyToMode` 設定に従います。

サポートされるブロック:

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- アクション行では、最大 5 個のボタンまたは単一の選択メニューを使用できます
- 選択タイプ: `string`、`user`、`role`、`mentionable`、`channel`

デフォルトでは、コンポーネントは 1 回限り使用できます。ボタン、選択、フォームを期限切れになるまで複数回使用できるようにするには、`components.reusable=true` を設定します。

ボタンをクリックできるユーザーを制限するには、そのボタンに `allowedUsers` を設定します（Discord ユーザー ID、タグ、または `*`）。設定されている場合、一致しないユーザーにはエフェメラルな拒否が届きます。

`/model` と `/models` スラッシュコマンドは、プロバイダー、モデル、互換ランタイムのドロップダウンと送信ステップを備えたインタラクティブなモデルピッカーを開きます。`/models add` は非推奨であり、チャットからモデルを登録する代わりに非推奨メッセージを返すようになりました。ピッカーの返信はエフェメラルで、呼び出したユーザーのみが使用できます。Discord の選択メニューは 25 個のオプションに制限されているため、`openai-codex` や `vllm` など選択したプロバイダーについてのみ、動的に検出されたモデルをピッカーに表示したい場合は、`provider/*` エントリを `agents.defaults.models` に追加してください。

ファイル添付:

- `file` ブロックは添付参照（`attachment://<filename>`）を指す必要があります
- `media`/`path`/`filePath`（単一ファイル）で添付を提供します。複数ファイルには `media-gallery` を使います
- アップロード名を添付参照と一致させる必要がある場合は、`filename` を使って上書きします

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
  <Tab title="DM ポリシー">
    `channels.discord.dmPolicy` は DM アクセスを制御します。`channels.discord.allowFrom` は正規の DM 許可リストです。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.discord.allowFrom` に `"*"` が含まれている必要があります）
    - `disabled`

    DM ポリシーが open でない場合、不明なユーザーはブロックされます（または `pairing` モードではペアリングを促されます）。

    マルチアカウントの優先順位:

    - `channels.discord.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 1 つのアカウントでは、`allowFrom` がレガシーの `dm.allowFrom` より優先されます。
    - 名前付きアカウントは、独自の `allowFrom` とレガシーの `dm.allowFrom` が未設定の場合、`channels.discord.allowFrom` を継承します。
    - 名前付きアカウントは `channels.discord.accounts.default.allowFrom` を継承しません。

    レガシーの `channels.discord.dm.policy` と `channels.discord.dm.allowFrom` は互換性のために引き続き読み取られます。`openclaw doctor --fix` は、アクセスを変更せずに実行できる場合、それらを `dmPolicy` と `allowFrom` に移行します。

    配信用の DM ターゲット形式:

    - `user:<id>`
    - `<@id>` メンション

    チャンネルのデフォルトが有効な場合、通常、裸の数値 ID はチャンネル ID として解決されますが、アカウントの有効な DM `allowFrom` に列挙されている ID は、互換性のためにユーザー DM ターゲットとして扱われます。

  </Tab>

  <Tab title="アクセスグループ">
    Discord DM とテキストコマンド認可では、`channels.discord.allowFrom` 内の動的な `accessGroup:<name>` エントリを使用できます。

    アクセスグループ名はメッセージチャンネル間で共有されます。メンバーが各チャンネルの通常の `allowFrom` 構文で表される静的グループには `type: "message.senders"` を使い、Discord チャンネルの現在の `ViewChannel` オーディエンスでメンバーシップを動的に定義する場合は `type: "discord.channelAudience"` を使います。共有アクセスグループの動作はここに記載されています: [アクセスグループ](/ja-JP/channels/access-groups)

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

    Discord テキストチャンネルには、個別のメンバーリストはありません。`type: "discord.channelAudience"` はメンバーシップを次のようにモデル化します。DM 送信者は設定されたギルドのメンバーであり、ロールとチャンネルの上書きが適用された後、設定されたチャンネルに対して現在有効な `ViewChannel` 権限を持っている。

    例: `#maintainers` を表示できるすべてのユーザーがボットに DM できるようにし、それ以外のユーザーには DM を閉じたままにします。

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

    チャンネルオーディエンスアクセスグループを使用する場合は、ボットに対して Discord Developer Portal の **Server Members Intent** を有効にしてください。DM にはギルドメンバー状態が含まれないため、OpenClaw は認可時に Discord REST を通じてメンバーを解決します。

  </Tab>

  <Tab title="ギルドポリシー">
    ギルド処理は `channels.discord.groupPolicy` によって制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` が存在する場合の安全なベースラインは `allowlist` です。

    `allowlist` の動作:

    - ギルドは `channels.discord.guilds` と一致する必要があります（`id` を推奨、スラッグも受け付けます）
    - オプションの送信者許可リスト: `users`（安定した ID を推奨）と `roles`（ロール ID のみ）。どちらかが設定されている場合、送信者は `users` または `roles` に一致すると許可されます
    - 直接の名前/タグ照合はデフォルトで無効です。非常用の互換モードとしてのみ `channels.discord.dangerouslyAllowNameMatching: true` を有効にしてください
    - `users` では名前/タグがサポートされますが、ID の方が安全です。名前/タグエントリが使われている場合、`openclaw security audit` が警告します
    - ギルドに `channels` が設定されている場合、列挙されていないチャンネルは拒否されます
    - ギルドに `channels` ブロックがない場合、その許可リスト内のギルドのすべてのチャンネルが許可されます

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

    `DISCORD_BOT_TOKEN` だけを設定し、`channels.discord` ブロックを作成しない場合、`channels.defaults.groupPolicy` が `open` であっても、ランタイムフォールバックは `groupPolicy="allowlist"`（ログに警告あり）になります。

  </Tab>

  <Tab title="メンションとグループ DM">
    ギルドメッセージはデフォルトでメンション制限されます。

    メンション検出には次が含まれます。

    - 明示的なボットメンション
    - 設定されたメンションパターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - サポートされる場合の、ボットへの暗黙的な返信動作

    Discord 送信メッセージを書くときは、正規のメンション構文を使ってください。ユーザーには `<@USER_ID>`、チャンネルには `<#CHANNEL_ID>`、ロールには `<@&ROLE_ID>` です。レガシーの `<@!USER_ID>` ニックネームメンション形式は使わないでください。

    `requireMention` はギルド/チャンネルごとに設定されます（`channels.discord.guilds...`）。
    `ignoreOtherMentions` は、ボットではなく別のユーザー/ロールをメンションするメッセージ（@everyone/@here を除く）を任意で破棄します。

    グループ DM:

    - デフォルト: 無視されます（`dm.groupEnabled=false`）
    - `dm.groupChannels` による任意の許可リスト（チャンネル ID またはスラッグ）

  </Tab>
</Tabs>

### ロールベースのエージェントルーティング

Discord ギルドメンバーをロール ID に基づいて別のエージェントへルーティングするには、`bindings[].match.roles` を使います。ロールベースのバインディングはロール ID のみを受け付け、ピアまたは親ピアのバインディングの後、ギルドのみのバインディングの前に評価されます。バインディングが他の照合フィールド（たとえば `peer` + `guildId` + `roles`）も設定している場合、設定されたすべてのフィールドが一致する必要があります。

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
- `commands.native=false` は、起動時の Discord スラッシュコマンド登録とクリーンアップをスキップします。以前に登録されたコマンドは、Discord アプリから削除するまで Discord に表示されたままになる場合があります。
- ネイティブコマンド認証は、通常のメッセージ処理と同じ Discord の許可リスト/ポリシーを使用します。
- 権限のないユーザーにも、コマンドが Discord UI に表示される場合があります。実行時には引き続き OpenClaw 認証が適用され、"not authorized" が返されます。

コマンドカタログと動作については、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

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
    `first` は、ターンの最初の送信 Discord メッセージに、暗黙的なネイティブ返信参照を常に付与します。
    `batched` は、受信ターンが複数メッセージのデバウンス済みバッチだった場合にのみ、Discord の暗黙的なネイティブ返信参照を付与します。これは、単一メッセージのすべてのターンではなく、主に曖昧で短時間に集中するチャットでネイティブ返信を使いたい場合に便利です。

    エージェントが特定のメッセージを対象にできるように、メッセージ ID はコンテキスト/履歴に表示されます。

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw は、一時メッセージを送信し、テキストが到着するたびに編集することで、返信の下書きをストリーミングできます。`channels.discord.streaming` は `off` | `partial` | `block` | `progress` (デフォルト) を受け取ります。`progress` は編集可能なステータス下書きを 1 つ保持し、最終配信までツール進捗で更新します。共有の開始ラベルは流れる行なので、十分な作業が表示されると他の内容と同様にスクロールして見えなくなります。`streamMode` はレガシーランタイムエイリアスです。永続化された設定を正規キーに書き換えるには、`openclaw doctor --fix` を実行してください。

    Discord のプレビュー編集を無効にするには、`channels.discord.streaming.mode` を `off` に設定します。Discord のブロックストリーミングが明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためプレビューストリームをスキップします。

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

    - `partial` は、トークンの到着に応じて単一のプレビューメッセージを編集します。
    - `block` は下書きサイズのチャンクを出力します (サイズと区切り位置の調整には `draftChunk` を使用し、`textChunkLimit` にクランプされます)。
    - メディア、エラー、明示的返信の最終応答は、保留中のプレビュー編集をキャンセルします。
    - `streaming.preview.toolProgress` (デフォルト `true`) は、ツール/進捗の更新でプレビューメッセージを再利用するかどうかを制御します。
    - ツール/進捗行は、利用可能な場合、コンパクトな絵文字 + タイトル + 詳細としてレンダリングされます。例: `🛠️ Bash: run tests` または `🔎 Web Search: for "query"`。
    - `streaming.preview.commandText` / `streaming.progress.commandText` は、コンパクトな進捗行のコマンド/実行詳細を制御します: `raw` (デフォルト) または `status` (ツールラベルのみ)。

    コンパクトな進捗行を維持しつつ、生のコマンド/実行テキストを非表示にするには:

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

  <Accordion title="History, context, and thread behavior">
    ギルド履歴コンテキスト:

    - `channels.discord.historyLimit` のデフォルトは `20`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効化

    DM 履歴制御:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    スレッド動作:

    - Discord スレッドはチャンネルセッションとしてルーティングされ、上書きされない限り親チャンネル設定を継承します。
    - スレッドセッションは、モデルのみのフォールバックとして、親チャンネルのセッションレベルの `/model` 選択を継承します。スレッドローカルの `/model` 選択は引き続き優先され、トランスクリプト継承が有効でない限り、親のトランスクリプト履歴はコピーされません。
    - `channels.discord.thread.inheritParent` (デフォルト `false`) は、新しい自動スレッドで親トランスクリプトからのシードを有効にします。アカウントごとの上書きは `channels.discord.accounts.<id>.thread.inheritParent` 配下にあります。
    - メッセージツールのリアクションは、`user:<id>` DM ターゲットを解決できます。
    - `guilds.<guild>.channels.<channel>.requireMention: false` は、返信段階のアクティベーションフォールバック中も保持されます。

    チャンネルトピックは**信頼されない**コンテキストとして注入されます。許可リストは、誰がエージェントをトリガーできるかを制御するものであり、完全な補足コンテキストの秘匿境界ではありません。

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord は、スレッドをセッションターゲットにバインドできます。これにより、そのスレッド内の後続メッセージは同じセッション (サブエージェントセッションを含む) にルーティングされ続けます。

    コマンド:

    - `/focus <target>` 現在/新規スレッドをサブエージェント/セッションターゲットにバインド
    - `/unfocus` 現在のスレッドバインドを削除
    - `/agents` アクティブな実行とバインド状態を表示
    - `/session idle <duration|off>` フォーカス済みバインドの非アクティブ時自動アンフォーカスを確認/更新
    - `/session max-age <duration|off>` フォーカス済みバインドの厳格な最大有効期間を確認/更新

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
    - `spawnSessions` は、`sessions_spawn({ thread: true })` と ACP スレッドスポーンでのスレッド自動作成/バインドを制御します。デフォルト: `true`。
    - `defaultSpawnContext` は、スレッドバインドされたスポーンのネイティブサブエージェントコンテキストを制御します。デフォルト: `"fork"`。
    - 非推奨の `spawnSubagentSessions`/`spawnAcpSessions` キーは `openclaw doctor --fix` によって移行されます。
    - アカウントでスレッドバインドが無効な場合、`/focus` と関連するスレッドバインド操作は利用できません。

    [サブエージェント](/ja-JP/tools/subagents)、[ACP エージェント](/ja-JP/tools/acp-agents)、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    安定した「常時オン」の ACP ワークスペースでは、Discord 会話を対象にするトップレベルの型付き ACP バインドを設定します。

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
    - バインドされたチャンネルまたはスレッドでは、`/new` と `/reset` は同じ ACP セッションをその場でリセットします。一時的なスレッドバインドは、アクティブな間ターゲット解決を上書きできます。
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
    `ackReaction` は、OpenClaw が受信メッセージを処理している間、確認用の絵文字を送信します。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - エージェント ID 絵文字フォールバック (`agents.list[].identity.emoji`、なければ "👀")

    注:

    - Discord は Unicode 絵文字またはカスタム絵文字名を受け付けます。
    - チャンネルまたはアカウントのリアクションを無効にするには `""` を使用します。

  </Accordion>

  <Accordion title="Config writes">
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

  <Accordion title="Gateway proxy">
    Discord Gateway WebSocket トラフィックと起動時の REST ルックアップ (アプリケーション ID + 許可リスト解決) を、`channels.discord.proxy` を使って HTTP(S) プロキシ経由でルーティングします。

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
    - メンバー表示名は、`channels.discord.dangerouslyAllowNameMatching: true` の場合にのみ name/slug で照合されます
    - ルックアップは元のメッセージ ID を使用し、時間枠で制限されます
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

    アクティビティタイプの対応表:

    - 0: プレイ中
    - 1: 配信中（`activityUrl` が必要）
    - 2: 聴取中
    - 3: 視聴中
    - 4: カスタム（アクティビティテキストをステータス状態として使用します。絵文字は任意です）
    - 5: 競技中

    自動プレゼンスの例（実行時ヘルスシグナル）:

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

    自動プレゼンスは、実行時の可用性を Discord ステータスに対応付けます: 正常 => online、劣化または不明 => idle、枯渇または利用不可 => dnd。任意のテキスト上書き:

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

    `enabled` が未設定または `"auto"` で、`execApprovals.approvers` または `commands.ownerAllowFrom` から少なくとも 1 人の承認者を解決できる場合、Discord はネイティブの実行承認を自動的に有効化します。Discord は、チャンネルの `allowFrom`、従来の `dm.allowFrom`、またはダイレクトメッセージの `defaultTo` から実行承認者を推測しません。Discord をネイティブ承認クライアントとして明示的に無効化するには、`enabled: false` を設定します。

    `/diagnostics` や `/export-trajectory` など、機密性の高いオーナー専用グループコマンドでは、OpenClaw は承認プロンプトと最終結果を非公開で送信します。呼び出したオーナーに Discord オーナールートがある場合はまず Discord DM を試し、それが利用できない場合は Telegram など、`commands.ownerAllowFrom` から最初に利用可能なオーナールートにフォールバックします。

    `target` が `channel` または `both` の場合、承認プロンプトはチャンネルに表示されます。解決済みの承認者だけがボタンを使用できます。他のユーザーには一時的な拒否が返されます。承認プロンプトにはコマンドテキストが含まれるため、チャンネル配信は信頼済みチャンネルでのみ有効化してください。セッションキーからチャンネル ID を導出できない場合、OpenClaw は DM 配信にフォールバックします。

    Discord は、他のチャットチャンネルで使われる共有承認ボタンもレンダリングします。ネイティブ Discord アダプターは主に、承認者への DM ルーティングとチャンネルへのファンアウトを追加します。
    これらのボタンが存在する場合、それらが主要な承認 UX です。OpenClaw
    は、ツール結果がチャット承認を利用できない、または手動承認が唯一の経路であると示す場合にのみ、手動の `/approve` コマンドを含めるべきです。
    Discord ネイティブ承認ランタイムがアクティブでない場合、OpenClaw は
    ローカルの決定論的な `/approve <id> <decision>` プロンプトを表示したままにします。
    ランタイムがアクティブでも、どのターゲットにもネイティブカードを配信できない場合、
    OpenClaw は保留中の承認から正確な `/approve`
    コマンドを含む、同じチャット内のフォールバック通知を送信します。

    Gateway 認証と承認解決は、共有 Gateway クライアント契約に従います（`plugin:` ID は `plugin.approval.resolve` を通じて解決され、その他の ID は `exec.approval.resolve` を通じて解決されます）。承認はデフォルトで 30 分後に期限切れになります。

    [実行承認](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>
</AccordionGroup>

## ツールとアクションゲート

Discord メッセージアクションには、メッセージング、チャンネル管理、モデレーション、プレゼンス、メタデータアクションが含まれます。

主要な例:

- メッセージング: `sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- リアクション: `react`、`reactions`、`emojiList`
- モデレーション: `timeout`、`kick`、`ban`
- プレゼンス: `setPresence`

`event-create` アクションは、スケジュール済みイベントのカバー画像を設定する任意の `image` パラメーター（URL またはローカルファイルパス）を受け取ります。

アクションゲートは `channels.discord.actions.*` の下にあります。

デフォルトのゲート動作:

| アクショングループ                                                                                                                                                             | デフォルト  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 有効  |
| roles                                                                                                                                                                    | 無効 |
| moderation                                                                                                                                                               | 無効 |
| presence                                                                                                                                                                 | 無効 |

## コンポーネント v2 UI

OpenClaw は実行承認とクロスコンテキストマーカーに Discord コンポーネント v2 を使用します。Discord メッセージアクションはカスタム UI 用の `components` も受け取れます（高度。discord ツールを通じてコンポーネントペイロードを構築する必要があります）。一方、従来の `embeds` は引き続き利用できますが、推奨されません。

- `channels.discord.ui.components.accentColor` は、Discord コンポーネントコンテナーで使われるアクセントカラー（16 進）を設定します。
- `channels.discord.accounts.<id>.ui.components.accentColor` でアカウントごとに設定します。
- コンポーネント v2 が存在する場合、`embeds` は無視されます。

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

1. Discord Developer Portal で Message Content Intent を有効化します。
2. ロール/ユーザー許可リストを使用する場合は、Server Members Intent を有効化します。
3. `bot` と `applications.commands` スコープでボットを招待します。
4. 対象の音声チャンネルで Connect、Speak、Send Messages、Read Message History を付与します。
5. ネイティブコマンド（`commands.native` または `channels.discord.commands.native`）を有効化します。
6. `channels.discord.voice` を設定します。

セッションを制御するには `/vc join|leave|status` を使用します。このコマンドはアカウントのデフォルトエージェントを使用し、他の Discord コマンドと同じ許可リストおよびグループポリシールールに従います。

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

参加前にボットの有効な権限を調べるには、次を実行します:

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
          voice: "cedar",
        },
      },
    },
  },
}
```

注:

- `voice.tts` は、`stt-tts` の音声再生のみに対して `messages.tts` を上書きします。リアルタイムモードでは `voice.realtime.voice` を使用します。
- `voice.mode` は会話パスを制御します。デフォルトは `agent-proxy` です。リアルタイム音声フロントエンドがターンのタイミング、割り込み、再生を処理し、実質的な作業を `openclaw_agent_consult` を通じてルーティング済みの OpenClaw エージェントに委任し、その結果をその話者からの入力済み Discord プロンプトのように扱います。`stt-tts` は従来のバッチ STT と TTS のフローを維持します。`bidi` では、OpenClaw の頭脳向けに `openclaw_agent_consult` を公開しながら、リアルタイムモデルが直接会話できます。
- `voice.agentSession` は、どの OpenClaw 会話が音声ターンを受け取るかを制御します。音声チャンネル自身のセッションを使う場合は未設定のままにするか、音声チャンネルを `#maintainers` のような既存 Discord テキストチャンネルセッションのマイク/スピーカー拡張として動作させるには `{ mode: "target", target: "channel:<text-channel-id>" }` を設定します。
- `voice.model` は、Discord 音声応答とリアルタイム consult に対して OpenClaw エージェントの頭脳を上書きします。ルーティング済みエージェントモデルを継承する場合は未設定のままにします。これは `voice.realtime.model` とは別です。
- `agent-proxy` は音声を `discord-voice` 経由でルーティングします。これにより話者とターゲットセッションに対する通常の所有者/ツール認可は保持されますが、Discord 音声が再生を所有するため、エージェントの `tts` ツールは非表示になります。デフォルトでは、`agent-proxy` は所有者話者の consult に所有者相当の完全なツールアクセスを付与し（`voice.realtime.toolPolicy: "owner"`）、実質的な回答の前に OpenClaw エージェントへ consult することを強く優先します（`voice.realtime.consultPolicy: "always"`）。そのデフォルトの `always` モードでは、リアルタイム層は consult の回答前に埋め草を自動発話しません。音声をキャプチャして文字起こしし、その後ルーティング済み OpenClaw の回答を発話します。Discord が最初の回答を再生中に複数の強制 consult 回答が完了した場合、後続の正確な発話回答は文の途中で音声を置き換えるのではなく、再生がアイドルになるまでキューに入れられます。
- `stt-tts` モードでは、STT は `tools.media.audio` を使用します。`voice.model` は文字起こしに影響しません。
- リアルタイムモードでは、`voice.realtime.provider`、`voice.realtime.model`、`voice.realtime.voice` がリアルタイム音声セッションを構成します。OpenAI Realtime 2 と Codex の頭脳を使う場合は、`voice.realtime.model: "gpt-realtime-2"` と `voice.model: "openai-codex/gpt-5.5"` を使用します。
- OpenAI リアルタイムプロバイダーは、現在の Realtime 2 イベント名と、出力音声およびトランスクリプトイベント向けの従来の Codex 互換エイリアスを受け入れるため、互換プロバイダースナップショットが変化してもアシスタント音声を落とさずに済みます。
- `voice.realtime.bargeIn` は、Discord の話者開始イベントがアクティブなリアルタイム再生を割り込むかどうかを制御します。未設定の場合は、リアルタイムプロバイダーの入力音声割り込み設定に従います。
- `voice.realtime.minBargeInAudioEndMs` は、OpenAI リアルタイム barge-in が音声を切り詰める前に必要な最小アシスタント再生時間を制御します。デフォルト: `250`。エコーの少ない部屋では即時割り込みのために `0` を設定し、エコーが多いスピーカー構成では値を上げます。
- Discord 再生で OpenAI 音声を使う場合は、`voice.tts.provider: "openai"` を設定し、`voice.tts.openai.voice` または `voice.tts.providers.openai.voice` で Text-to-speech 音声を選択します。現在の OpenAI TTS モデルでは、`cedar` は男性的な響きのよい選択肢です。
- チャンネルごとの Discord `systemPrompt` 上書きは、その音声チャンネルの音声トランスクリプトターンに適用されます。
- 音声トランスクリプトターンは、Discord `allowFrom`（または `dm.allowFrom`）から所有者ステータスを派生します。非所有者の話者は所有者専用ツール（例: `gateway` と `cron`）にアクセスできません。
- Discord 音声はテキスト専用構成ではオプトインです。`/vc` コマンド、音声ランタイム、`GuildVoiceStates` Gateway インテントを有効にするには、`channels.discord.voice.enabled=true` を設定します（または既存の `channels.discord.voice` ブロックを維持します）。
- `channels.discord.intents.voiceStates` は、音声状態インテント購読を明示的に上書きできます。インテントを有効な音声有効化状態に従わせる場合は未設定のままにします。
- `voice.autoJoin` に同じギルドのエントリが複数ある場合、OpenClaw はそのギルドで最後に構成されたチャンネルに参加します。
- `voice.allowedChannels` は任意の常駐先許可リストです。未設定のままにすると、認可済みの任意の Discord 音声チャンネルへの `/vc join` を許可します。設定した場合、`/vc join`、起動時の自動参加、ボットの音声状態移動は、列挙された `{ guildId, channelId }` エントリに制限されます。空配列に設定すると、すべての Discord 音声参加を拒否します。Discord がボットを許可リスト外へ移動した場合、OpenClaw はそのチャンネルを退出し、利用可能な構成済み自動参加ターゲットに再参加します。
- `voice.daveEncryption` と `voice.decryptionFailureTolerance` は、`@discordjs/voice` の参加オプションにそのまま渡されます。
- `@discordjs/voice` のデフォルトは、未設定の場合 `daveEncryption=true` と `decryptionFailureTolerance=24` です。
- OpenClaw は Discord 音声受信用に純 JS の `opusscript` デコーダーをデフォルトで使用します。任意のネイティブ `@discordjs/opus` パッケージは、リポジトリの pnpm install ポリシーにより無視されるため、通常のインストール、Docker レーン、無関係なテストでネイティブ addon がコンパイルされることはありません。専用の音声パフォーマンスホストでは、ネイティブ addon をインストールした後に `OPENCLAW_DISCORD_OPUS_DECODER=native` でオプトインできます。
- `voice.connectTimeoutMs` は、`/vc join` と自動参加試行の初期 `@discordjs/voice` Ready 待機を制御します。デフォルト: `30000`。
- `voice.reconnectGraceMs` は、切断された音声セッションが再接続を開始するまで OpenClaw が待機する時間を制御し、その後破棄します。デフォルト: `15000`。
- `stt-tts` モードでは、別のユーザーが話し始めただけでは音声再生は停止しません。フィードバックループを避けるため、TTS の再生中は OpenClaw は新しい音声キャプチャを無視します。次のターンでは再生完了後に話してください。リアルタイムモードでは、話者開始を barge-in シグナルとしてリアルタイムプロバイダーへ転送します。
- リアルタイムモードでは、スピーカーから開いたマイクへ入るエコーが barge-in のように見え、再生を割り込むことがあります。エコーが多い Discord ルームでは、入力音声で OpenAI が自動割り込みしないように `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` を設定します。それでも Discord の話者開始イベントでアクティブな再生を割り込みたい場合は、`voice.realtime.bargeIn: true` を追加します。OpenAI リアルタイムブリッジは、`voice.realtime.minBargeInAudioEndMs` より短い再生切り詰めをエコー/ノイズの可能性が高いものとして無視し、Discord 再生をクリアする代わりにスキップとしてログに記録します。
- `voice.captureSilenceGraceMs` は、Discord が話者停止を報告してから、OpenClaw がその音声セグメントを STT 用に確定するまで待機する時間を制御します。デフォルト: `2500`。Discord が通常の間を途切れ途切れの部分トランスクリプトに分割する場合は、この値を上げます。
- ElevenLabs が選択された TTS プロバイダーの場合、Discord 音声再生はストリーミング TTS を使用し、プロバイダー応答ストリームから開始します。ストリーミング対応のないプロバイダーは、合成された一時ファイルのパスにフォールバックします。
- OpenClaw は受信復号失敗も監視し、短時間のうちに失敗が繰り返された場合は、音声チャンネルを退出/再参加することで自動復旧します。
- 更新後に受信ログで `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` が繰り返し表示される場合は、依存関係レポートとログを収集してください。バンドルされた `@discordjs/voice` 系には、discord.js issue #11419 を閉じた discord.js PR #11449 の upstream パディング修正が含まれています。
- `The operation was aborted` 受信イベントは、OpenClaw がキャプチャ済み話者セグメントを確定するときに想定されるものです。これは詳細診断であり、警告ではありません。
- 詳細な Discord 音声ログには、受け入れられた各話者セグメントについて、境界付きの 1 行 STT トランスクリプトプレビューが含まれます。これにより、無制限のトランスクリプトテキストを出力せずに、ユーザー側とエージェント返信側の両方をデバッグで確認できます。
- `agent-proxy` モードでは、強制 consult フォールバックは、`...` で終わるテキストや `and` のような末尾の接続詞など、不完全と思われるトランスクリプト断片に加えて、「すぐ戻ります」や「さようなら」のような明らかにアクション不要の締めの言葉をスキップします。これにより古いキュー済み回答を防いだ場合、ログには `forced agent consult skipped reason=...` が表示されます。

ソースチェックアウト向けのネイティブ opus セットアップ:

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

upstream の macOS arm64 事前ビルド済みネイティブ addon を使いたい場合は、Gateway に Node 22 を使用してください。別の Node ランタイムを使う場合、オプトインインストーラーにはローカルの `node-gyp` ソースビルドツールチェーンが必要になることがあります。

ネイティブ addon をインストールした後、次のコマンドで Gateway を起動します。

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

詳細な音声ログには `discord voice: opus decoder: @discordjs/opus` が表示されるはずです。env オプトインがない場合、またはネイティブ addon が見つからないかホストで読み込めない場合、OpenClaw は `discord voice: opus decoder: opusscript` をログに記録し、純 JS フォールバック経由で音声受信を継続します。

STT と TTS のパイプライン:

- Discord PCM キャプチャは WAV 一時ファイルに変換されます。
- `tools.media.audio` が STT を処理します。例: `openai/gpt-4o-mini-transcribe`。
- トランスクリプトは Discord 入口とルーティングを通じて送信され、その間、応答 LLM は音声出力ポリシーで実行されます。このポリシーは、Discord 音声が最終 TTS 再生を所有するため、エージェントの `tts` ツールを非表示にし、返却テキストを求めます。
- `voice.model` が設定されている場合、この音声チャンネルターンの応答 LLM のみを上書きします。
- `voice.tts` は `messages.tts` の上にマージされます。ストリーミング対応プロバイダーはプレイヤーへ直接フィードし、それ以外の場合は生成された音声ファイルが参加済みチャンネルで再生されます。

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

`voice.agentSession` ブロックがない場合、各音声チャンネルは独自のルーティング済み OpenClaw セッションを取得します。たとえば、`/vc join channel:234567890123456789` はその Discord 音声チャンネルのセッションと会話します。リアルタイムモデルは音声フロントエンドにすぎません。実質的なリクエストは構成済み OpenClaw エージェントへ渡されます。リアルタイムモデルが consult ツールを呼ばずに最終トランスクリプトを生成した場合でも、デフォルトがエージェントと話すように動作するよう、OpenClaw はフォールバックとして consult を強制します。

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

`agent-proxy` モードでは、ボットは構成済み音声チャンネルに参加しますが、OpenClaw エージェントターンはターゲットチャンネルの通常のルーティング済みセッションとエージェントを使用します。リアルタイム音声セッションは返却された結果を音声チャンネルへ話します。スーパーバイザーエージェントは、適切なアクションであれば個別の Discord メッセージを送信することも含め、ツールポリシーに従って通常のメッセージツールを引き続き使用できます。

便利なターゲット形式:

- `target: "channel:123456789012345678"` は Discord テキストチャンネルセッション経由でルーティングします。
- `target: "123456789012345678"` はチャンネルターゲットとして扱われます。
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

モデルが開いたマイクを通じて自身の Discord 再生音を聞いてしまうが、発話で割り込みたい場合にこれを使用します。OpenClaw は OpenAI が生の入力音声で自動割り込みしないようにしつつ、`bargeIn: true` により、次のキャプチャ済みターンが OpenAI に届く前に Discord の話者開始イベントとすでにアクティブな話者音声で、アクティブなリアルタイム応答をキャンセルできるようにします。`audioEndMs` が `minBargeInAudioEndMs` 未満の非常に早い割り込みシグナルは、エコーまたはノイズの可能性が高いものとして扱われ無視されるため、モデルは最初の再生フレームで途切れません。

想定される音声ログ:

- 参加時: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- リアルタイム開始時: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 話者音声時: `discord voice: realtime speaker turn opened ...`、`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`、および `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 古い発話のスキップ時: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` または `reason=non-actionable-closing ...`
- リアルタイム応答完了時: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 再生停止/リセット時: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- リアルタイム相談時: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- エージェント回答時: `discord voice: agent turn answer ...`
- 厳密な発話のキュー投入時: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`、続いて `discord voice: realtime exact speech dequeued reason=player-idle ...`
- 割り込み検出時: `discord voice: realtime barge-in detected source=speaker-start ...` または `discord voice: realtime barge-in detected source=active-speaker-audio ...`、続いて `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- リアルタイム割り込み時: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`、続いて `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` または `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- 無視されたエコー/ノイズ時: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 無効な割り込み時: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- アイドル再生時: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

途切れる音声をデバッグするには、リアルタイム音声ログを時系列として読みます:

1. `realtime audio playback started` は、Discord がアシスタント音声の再生を開始したことを意味します。ブリッジはこの時点から、アシスタント出力チャンク、Discord PCM バイト、プロバイダーのリアルタイムバイト、および合成音声の長さのカウントを開始します。
2. `realtime speaker turn opened` は、Discord 話者がアクティブになったことを示します。再生がすでにアクティブで `bargeIn` が有効な場合、その後に `barge-in detected source=speaker-start` が続くことがあります。
3. `realtime input audio started` は、その話者ターンで最初の実際の音声フレームを受信したことを示します。ここで `outputActive=true` またはゼロでない `outputAudioMs` がある場合、アシスタント再生がまだアクティブな間にマイクが入力を送信していることを意味します。
4. `barge-in detected source=active-speaker-audio` は、アシスタント再生がアクティブな間に OpenClaw がライブ話者音声を検出したことを意味します。これは、有用な音声を伴わない Discord 話者開始イベントと実際の割り込みを区別するのに役立ちます。
5. `barge-in requested reason=...` は、OpenClaw がリアルタイムプロバイダーにアクティブな応答のキャンセルまたは切り詰めを依頼したことを意味します。`outputAudioMs`、`outputActive`、`playbackChunks` が含まれるため、割り込み前に実際にどれだけのアシスタント音声が再生されたかを確認できます。
6. `realtime audio playback stopped reason=...` は、ローカル Discord 再生のリセット地点です。理由は、誰が再生を停止したかを示します: `barge-in`、`player-idle`、`provider-clear-audio`、`forced-agent-consult`、`stream-close`、または `session-close`。
7. `realtime speaker turn closed` は、キャプチャされた入力ターンを要約します。`chunks=0` または `hasAudio=false` は、話者ターンは開いたが使用可能な音声がリアルタイムブリッジに届かなかったことを意味します。`interruptedPlayback=true` は、その入力ターンがアシスタント出力と重なり、割り込みロジックをトリガーしたことを意味します。

有用なフィールド:

- `outputAudioMs`: ログ行の前にリアルタイムプロバイダーが生成したアシスタント音声の長さ。
- `audioMs`: 再生停止前に OpenClaw がカウントしたアシスタント音声の長さ。
- `elapsedMs`: 再生ストリームまたは話者ターンの開始から終了までの実時間。
- `discordBytes`: Discord 音声に送信、または Discord 音声から受信された 48 kHz ステレオ PCM バイト。
- `realtimeBytes`: リアルタイムプロバイダーに送信、またはリアルタイムプロバイダーから受信されたプロバイダー形式の PCM バイト。
- `playbackChunks`: アクティブな応答用に Discord へ転送されたアシスタント音声チャンク。
- `sinceLastAudioMs`: 最後にキャプチャされた話者音声フレームから話者ターン終了までの間隔。

一般的なパターン:

- `source=active-speaker-audio`、小さい `outputAudioMs`、同じユーザーが近くにいる状態で即座に途切れる場合、通常はスピーカーエコーがマイクに入っていることを示します。`voice.realtime.minBargeInAudioEndMs` を上げる、スピーカー音量を下げる、ヘッドホンを使用する、または `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` を設定してください。
- `source=speaker-start` の後に `speaker turn closed ... hasAudio=false` が続く場合、Discord は話者開始を報告したが音声が OpenClaw に届かなかったことを意味します。これは一時的な Discord 音声イベント、ノイズゲートの挙動、またはクライアントが一瞬だけマイクをオンにしたことが原因の場合があります。
- 近くに割り込みや `provider-clear-audio` がないのに `audio playback stopped reason=stream-close` が出る場合、ローカル Discord 再生ストリームが予期せず終了したことを意味します。直前のプロバイダーおよび Discord プレイヤーログを確認してください。
- `capture ignored during playback (barge-in disabled)` は、アシスタント音声がアクティブな間に OpenClaw が意図的に入力を破棄したことを意味します。発話で再生を割り込みたい場合は、`voice.realtime.bargeIn` を有効にしてください。
- `barge-in ignored ... outputActive=false` は、Discord またはプロバイダーの VAD が発話を報告したが、OpenClaw には割り込む対象のアクティブな再生がなかったことを意味します。これによって音声が途切れることはありません。

認証情報はコンポーネントごとに解決されます: `voice.model` の LLM ルート認証、`tools.media.audio` の STT 認証、`messages.tts`/`voice.tts` の TTS 認証、および `voice.realtime.providers` またはプロバイダーの通常の認証設定のリアルタイムプロバイダー認証。

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

    - Message Content Intent を有効にする
    - ユーザー/メンバー解決に依存する場合は Server Members Intent を有効にする
    - インテントを変更した後に Gateway を再起動する

  </Accordion>

  <Accordion title="ギルドメッセージが予期せずブロックされる">

    - `groupPolicy` を確認する
    - `channels.discord.guilds` 配下のギルド許可リストを確認する
    - ギルドの `channels` マップが存在する場合、リストされたチャンネルのみが許可される
    - `requireMention` の挙動とメンションパターンを確認する

    有用な確認:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention が false だがまだブロックされる">
    一般的な原因:

    - 一致するギルド/チャンネル許可リストなしで `groupPolicy="allowlist"` になっている
    - `requireMention` が誤った場所に設定されている (`channels.discord.guilds` またはチャンネルエントリ配下である必要があります)
    - 送信者がギルド/チャンネルの `users` 許可リストによってブロックされている

  </Accordion>

  <Accordion title="長時間実行される Discord ターンまたは重複返信">

    典型的なログ:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway キューの調整項目:

    - 単一アカウント: `channels.discord.eventQueue.listenerTimeout`
    - 複数アカウント: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - これは Discord Gateway リスナー処理のみを制御し、エージェントターンの寿命は制御しません

    Discord は、キューに入ったエージェントターンにチャンネル所有のタイムアウトを適用しません。メッセージリスナーは即座に処理を引き渡し、キューに入った Discord 実行は、セッション/ツール/ランタイムのライフサイクルが完了または作業を中止するまで、セッションごとの順序を保持します。

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
    - デフォルト: `30000` (30 秒)、最大: `120000`

  </Accordion>

  <Accordion title="Gateway READY タイムアウトによる再起動">
    OpenClaw は起動時およびランタイム再接続後に、Discord の Gateway `READY` イベントを待機します。起動時スタガリングを伴う複数アカウント構成では、デフォルトより長い起動時 READY ウィンドウが必要な場合があります。

    READY タイムアウトの調整項目:

    - 起動時の単一アカウント: `channels.discord.gatewayReadyTimeoutMs`
    - 起動時の複数アカウント: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 設定が未指定の場合の起動時 env フォールバック: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 起動時デフォルト: `15000` (15 秒)、最大: `120000`
    - ランタイムの単一アカウント: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - ランタイムの複数アカウント: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 設定が未指定の場合のランタイム env フォールバック: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - ランタイムデフォルト: `30000` (30 秒)、最大: `120000`

  </Accordion>

  <Accordion title="権限監査の不一致">
    `channels status --probe` の権限チェックは数値チャンネル ID に対してのみ機能します。

    スラッグキーを使用している場合、ランタイム照合は引き続き機能する可能性がありますが、プローブは権限を完全には検証できません。

  </Accordion>

  <Accordion title="DM とペアリングの問題">

    - DM 無効: `channels.discord.dm.enabled=false`
    - DM ポリシー無効: `channels.discord.dmPolicy="disabled"` (レガシー: `channels.discord.dm.policy`)
    - `pairing` モードでペアリング承認待ち

  </Accordion>

  <Accordion title="ボット間ループ">
    デフォルトでは、ボットが作成したメッセージは無視されます。

    `channels.discord.allowBots=true` を設定する場合は、ループ動作を避けるために厳格なメンションと許可リストのルールを使用します。
    ボットにメンションするボットメッセージのみを受け付けるには、`channels.discord.allowBots="mentions"` を優先します。

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

  <Accordion title="音声 STT が DecryptionFailed(...) で途切れる">

    - Discord 音声受信の復旧ロジックが含まれるように、OpenClaw を最新の状態に保つ (`openclaw update`)
    - `channels.discord.voice.daveEncryption=true` (デフォルト) を確認する
    - `channels.discord.voice.decryptionFailureTolerance=24` (アップストリームのデフォルト) から始め、必要な場合のみ調整する
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
- イベントキュー: `eventQueue.listenerTimeout` (リスナーの予算), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
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
    脅威モデルと堅牢化。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    ギルドとチャンネルをエージェントに対応付けます。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作。
  </Card>
</CardGroup>
