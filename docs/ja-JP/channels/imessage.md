---
read_when:
    - iMessage サポートの設定
    - iMessage の送受信をデバッグする
summary: imsg（stdio 経由の JSON-RPC）による iMessage のネイティブ対応。返信、タップバック、エフェクト、添付ファイル、グループ管理のためのプライベート API アクションを備えています。ホスト要件に合う場合、新しい OpenClaw iMessage セットアップに推奨されます。
title: iMessage
x-i18n:
    generated_at: "2026-05-11T20:20:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbce499e35c3dac12e6bb3f157d624a02a9bc8c26356f3decdfe62c85db6ee15
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
OpenClaw iMessage デプロイでは、サインイン済みの macOS Messages ホスト上で `imsg` を使用します。Gateway が Linux または Windows で動作している場合は、`channels.imessage.cliPath` を Mac 上で `imsg` を実行する SSH ラッパーに向けてください。

**Gateway ダウンタイムのキャッチアップはオプトインです。** 有効にすると (`channels.imessage.catchup.enabled: true`)、Gateway は次回起動時に、オフライン中（クラッシュ、再起動、Mac のスリープ）に `chat.db` に到着した受信メッセージを再生します。デフォルトでは無効です — [Gateway ダウンタイム後のキャッチアップ](#catching-up-after-gateway-downtime)を参照してください。[openclaw#78649](https://github.com/openclaw/openclaw/issues/78649) をクローズします。
</Note>

<Warning>
BlueBubbles サポートは削除されました。`channels.bluebubbles` 設定を `channels.imessage` に移行してください。OpenClaw は `imsg` のみを通じて iMessage をサポートします。短い告知は [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage)から、完全な移行表は [BlueBubbles から移行する](/ja-JP/channels/imessage-from-bluebubbles)から始めてください。
</Warning>

ステータス: ネイティブ外部 CLI 統合。Gateway は `imsg rpc` を起動し、stdio 上の JSON-RPC で通信します（別のデーモンやポートはありません）。高度なアクションには `imsg launch` と、private API プローブの成功が必要です。

<CardGroup cols={3}>
  <Card title="Private API アクション" icon="wand-sparkles" href="#private-api-actions">
    返信、タップバック、エフェクト、添付ファイル、グループ管理。
  </Card>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    iMessage DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="リモート Mac" icon="terminal" href="#remote-mac-over-ssh">
    Gateway が Messages Mac 上で動作していない場合は SSH ラッパーを使用します。
  </Card>
  <Card title="設定リファレンス" icon="settings" href="/ja-JP/gateway/config-channels#imessage">
    iMessage フィールドの完全なリファレンス。
  </Card>
</CardGroup>

## クイックセットアップ

<Tabs>
  <Tab title="ローカル Mac（高速パス）">
    <Steps>
      <Step title="imsg をインストールして検証する">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="OpenClaw を設定する">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Gateway を起動する">

```bash
openclaw gateway
```

      </Step>

      <Step title="最初の DM ペアリングを承認する（デフォルト dmPolicy）">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        ペアリングリクエストは 1 時間後に期限切れになります。
      </Step>
    </Steps>

  </Tab>

  <Tab title="SSH 経由のリモート Mac">
    OpenClaw が必要とするのは stdio 互換の `cliPath` だけなので、リモート Mac に SSH 接続して `imsg` を実行するラッパースクリプトに `cliPath` を向けることができます。

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    添付ファイルを有効にする場合の推奨設定:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // SCP 添付ファイル取得に使用
      includeAttachments: true,
      // 任意: 許可する添付ファイルルートを上書きします。
      // デフォルトには /Users/*/Library/Messages/Attachments が含まれます
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    `remoteHost` が設定されていない場合、OpenClaw は SSH ラッパースクリプトを解析して自動検出を試みます。
    `remoteHost` は `host` または `user@host` である必要があります（スペースや SSH オプションは不可）。
    OpenClaw は SCP に厳格なホストキー検証を使用するため、リレーホストキーはすでに `~/.ssh/known_hosts` に存在している必要があります。
    添付ファイルパスは、許可されたルート（`attachmentRoots` / `remoteAttachmentRoots`）に対して検証されます。

  </Tab>
</Tabs>

## 要件と権限（macOS）

- `imsg` を実行する Mac で Messages にサインインしている必要があります。
- OpenClaw/`imsg` を実行するプロセスコンテキストにはフルディスクアクセスが必要です（Messages DB アクセス）。
- Messages.app を通じてメッセージを送信するには Automation 権限が必要です。
- 高度なアクション（リアクション / 編集 / 送信取り消し / スレッド返信 / エフェクト / グループ操作）には、System Integrity Protection を無効にする必要があります — 下の [imsg private API を有効にする](#enabling-the-imsg-private-api)を参照してください。基本的なテキストとメディアの送受信は、それなしでも動作します。

<Tip>
権限はプロセスコンテキストごとに付与されます。Gateway がヘッドレス（LaunchAgent/SSH）で動作している場合は、同じコンテキストで 1 回だけ対話型コマンドを実行してプロンプトを表示します。

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## imsg private API を有効にする

`imsg` には 2 つの動作モードがあります。

- **基本モード**（デフォルト、SIP の変更不要）: `send` による送信テキストとメディア、受信 watch/history、チャット一覧。これは新規の `brew install steipete/tap/imsg` と上記の標準 macOS 権限で、すぐに利用できるものです。
- **Private API モード**: `imsg` はヘルパー dylib を `Messages.app` に注入して、内部の `IMCore` 関数を呼び出します。これにより `react`、`edit`、`unsend`、`reply`（スレッド）、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup` に加えて、入力インジケーターと既読通知が利用可能になります。

このチャネルページで説明している高度なアクションサーフェスを利用するには、Private API モードが必要です。`imsg` README はこの要件を明示しています。

> `read`、`typing`、`launch`、ブリッジ支援のリッチ送信、メッセージ変更、チャット管理などの高度な機能はオプトインです。これらには SIP を無効にし、ヘルパー dylib を `Messages.app` に注入する必要があります。SIP が有効な場合、`imsg launch` は注入を拒否します。

ヘルパー注入手法は、`imsg` 自身の dylib を使って Messages private API に到達します。OpenClaw iMessage パスには、サードパーティサーバーや BlueBubbles ランタイムはありません。

<Warning>
**SIP を無効にすることは、実際のセキュリティ上のトレードオフです。** SIP は、変更されたシステムコードの実行から保護する macOS の中核的な保護機能の 1 つです。システム全体で無効にすると、追加の攻撃対象領域と副作用が生じます。特に、**Apple Silicon Mac で SIP を無効にすると、Mac に iOS アプリをインストールして実行する機能も無効になります**。

これはデフォルトではなく、意図的な運用上の選択として扱ってください。脅威モデルが SIP 無効化を許容できない場合、バンドルされた iMessage は基本モードに制限されます — テキストとメディアの送受信のみで、リアクション / 編集 / 送信取り消し / エフェクト / グループ操作はありません。
</Warning>

### セットアップ

1. Messages.app を実行する Mac に **`imsg` をインストール（またはアップグレード）** します。

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 出力は `bridge_version`、`rpc_methods`、メソッドごとの `selectors` を報告するため、開始前に現在のビルドが何をサポートしているか確認できます。

2. **System Integrity Protection を無効にします。** これは macOS バージョン固有です。基盤となる Apple の要件が OS とハードウェアに依存するためです。
   - **macOS 10.13–10.15（Sierra–Catalina）:** Terminal で Library Validation を無効にし、Recovery Mode で再起動し、`csrutil disable` を実行して再起動します。
   - **macOS 11+（Big Sur 以降）、Intel:** Recovery Mode（または Internet Recovery）、`csrutil disable`、再起動。
   - **macOS 11+、Apple Silicon:** 電源ボタンの起動シーケンスで Recovery に入ります。最近の macOS バージョンでは Continue をクリックするときに **Left Shift** キーを押し続け、その後 `csrutil disable` を実行します。仮想マシン構成では別のフローに従います — 先に VM スナップショットを取得してください。
   - **macOS 26 / Tahoe:** library-validation ポリシーと `imagent` private-entitlement チェックがさらに厳しくなっています。`imsg` は追従するために更新されたビルドが必要になる場合があります。macOS のメジャーアップグレード後に `imsg launch` 注入または特定の `selectors` が false を返し始めた場合は、SIP 手順が成功したと判断する前に `imsg` のリリースノートを確認してください。

   `imsg launch` を実行する前に、使用している Mac に合わせて Apple の Recovery-mode フローに従い、SIP を無効にしてください。

3. **ヘルパーを注入します。** SIP を無効にし、Messages.app にサインインした状態で:

   ```bash
   imsg launch
   ```

   SIP がまだ有効な場合、`imsg launch` は注入を拒否するため、これはステップ 2 が反映されたことの確認にもなります。

4. **OpenClaw からブリッジを検証します。**

   ```bash
   openclaw channels status --probe
   ```

   iMessage エントリは `works` を報告し、`imsg status --json | jq '.selectors'` は `retractMessagePart: true` と、macOS ビルドが公開する編集 / 入力 / 既読セレクターを表示するはずです。`actions.ts` の OpenClaw Plugin のメソッドごとのゲートは、基盤となる selector が `true` のアクションのみを公開するため、エージェントのツール一覧に表示されるアクションサーフェスは、このホスト上でブリッジが実際にできることを反映します。

`openclaw channels status --probe` がチャネルを `works` と報告しているのに、特定のアクションがディスパッチ時に「iMessage `<action>` requires the imsg private API bridge」を投げる場合は、`imsg launch` を再度実行してください — ヘルパーは外れることがあり（Messages.app の再起動、OS 更新など）、キャッシュされた `available: true` ステータスは、次回のプローブ更新までアクションの公開を続けます。

### SIP を無効にできない場合

SIP 無効化が脅威モデル上許容できない場合:

- `imsg` は基本モードにフォールバックします — テキスト + メディア + 受信のみです。
- OpenClaw Plugin は引き続きテキスト/メディア送信と受信監視を公開します。ただし、メソッドごとの capability ゲートに従って、`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、グループ操作をアクションサーフェスから隠します。
- iMessage ワークロード用に、SIP を無効にした別の非 Apple Silicon Mac（または専用 bot Mac）を実行し、主要デバイスでは SIP を有効にしたままにできます。下の [専用 bot macOS ユーザー（別の iMessage ID）](#deployment-patterns)を参照してください。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM ポリシー">
    `channels.imessage.dmPolicy` はダイレクトメッセージを制御します。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    Allowlist フィールド: `channels.imessage.allowFrom`。

    Allowlist エントリには、ハンドル、静的 sender access group（`accessGroup:<name>`）、またはチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を指定できます。

  </Tab>

  <Tab title="グループポリシー + メンション">
    `channels.imessage.groupPolicy` はグループ処理を制御します。

    - `allowlist`（設定時のデフォルト）
    - `open`
    - `disabled`

    グループ sender allowlist: `channels.imessage.groupAllowFrom`。

    `groupAllowFrom` エントリは、静的 sender access group（`accessGroup:<name>`）も参照できます。

    ランタイムフォールバック: `groupAllowFrom` が未設定の場合、iMessage グループ sender チェックは利用可能なら `allowFrom` にフォールバックします。
    ランタイム注記: `channels.imessage` が完全に存在しない場合、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログに出力します（`channels.defaults.groupPolicy` が設定されていても）。

    <Warning>
    グループルーティングには、連続して実行される **2 つ** の allowlist ゲートがあり、両方に合格する必要があります。

    1. **Sender / チャットターゲット allowlist**（`channels.imessage.groupAllowFrom`）— ハンドル、`chat_guid`、`chat_identifier`、または `chat_id`。
    2. **グループレジストリ**（`channels.imessage.groups`）— `groupPolicy: "allowlist"` では、このゲートは `groups: { "*": { ... } }` ワイルドカードエントリ（`allowAll = true` を設定）または `groups` 配下の明示的な `chat_id` ごとのエントリのいずれかを必要とします。

    ゲート 2 に何もない場合、すべてのグループメッセージは破棄されます。Plugin はデフォルトのログレベルで 2 つの `warn` レベルシグナルを出力します。

    - 起動時にアカウントごとに 1 回: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - 実行時に `chat_id` ごとに 1 回: `imessage: dropping group message from chat_id=<id> ...`

    DM は別のコードパスを使うため、引き続き動作します。

    `groupPolicy: "allowlist"` の下でグループを流し続けるための最小設定:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    それらの `warn` 行が Gateway ログに表示される場合、ゲート 2 がドロップしています。`groups` ブロックを追加してください。
    </Warning>

    グループのメンションゲートについて:

    - iMessage にはネイティブのメンションメタデータがない
    - メンション検出は正規表現パターンを使用する（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - パターンが設定されていない場合、メンションゲートは強制できない

    認可済み送信者からの制御コマンドは、グループ内のメンションゲートをバイパスできます。

    グループごとの `systemPrompt`:

    `channels.imessage.groups.*` 配下の各エントリは、任意の `systemPrompt` 文字列を受け付けます。この値は、そのグループ内のメッセージを処理するすべてのターンでエージェントのシステムプロンプトに注入されます。解決方法は、`channels.whatsapp.groups` で使われるグループごとのプロンプト解決と同じです。

    1. **グループ固有のシステムプロンプト**（`groups["<chat_id>"].systemPrompt`）: 特定のグループエントリがマップ内に存在し、かつその `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、そのグループにはシステムプロンプトが適用されません。
    2. **グループワイルドカードのシステムプロンプト**（`groups["*"].systemPrompt`）: 特定のグループエントリがマップ内にまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    グループごとのプロンプトはグループメッセージにのみ適用されます。このチャンネルのダイレクトメッセージには影響しません。

  </Tab>

  <Tab title="セッションと決定的な返信">
    - DM はダイレクトルーティングを使用し、グループはグループルーティングを使用します。
    - 既定の `session.dmScope=main` では、iMessage の DM はエージェントのメインセッションに集約されます。
    - グループセッションは分離されます（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 返信は、送信元のチャンネル/ターゲットメタデータを使って iMessage にルーティングされます。

    グループに近いスレッドの動作:

    複数参加者の一部の iMessage スレッドは、`is_group=false` として到着することがあります。
    その `chat_id` が `channels.imessage.groups` 配下に明示的に設定されている場合、OpenClaw はそれをグループトラフィック（グループゲート + グループセッション分離）として扱います。

  </Tab>
</Tabs>

## ACP 会話バインディング

レガシー iMessage チャットは、ACP セッションにもバインドできます。

高速なオペレーターフロー:

- DM または許可済みグループチャット内で `/acp spawn codex --bind here` を実行します。
- 同じ iMessage 会話内の以後のメッセージは、生成された ACP セッションにルーティングされます。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

設定済みの永続バインディングは、`type: "acp"` と `match.channel: "imessage"` を持つトップレベルの `bindings[]` エントリを通じてサポートされます。

`match.peer.id` には以下を使用できます。

- `+15555550123` や `user@example.com` などの正規化済み DM ハンドル
- `chat_id:<id>`（安定したグループバインディングに推奨）
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

例:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

共有 ACP バインディングの動作については、[ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用 bot macOS ユーザー（別の iMessage ID）">
    専用の Apple ID と macOS ユーザーを使用し、bot トラフィックを個人の Messages プロファイルから分離します。

    一般的なフロー:

    1. 専用の macOS ユーザーを作成/サインインします。
    2. そのユーザーで bot の Apple ID を使って Messages にサインインします。
    3. そのユーザーに `imsg` をインストールします。
    4. OpenClaw がそのユーザーコンテキストで `imsg` を実行できるように SSH ラッパーを作成します。
    5. `channels.imessage.accounts.<id>.cliPath` と `.dbPath` をそのユーザープロファイルに向けます。

    初回実行時には、その bot ユーザーセッションで GUI 承認（Automation + Full Disk Access）が必要になる場合があります。

  </Accordion>

  <Accordion title="Tailscale 経由のリモート Mac（例）">
    一般的なトポロジー:

    - Gateway は Linux/VM 上で実行される
    - iMessage + `imsg` は tailnet 内の Mac 上で実行される
    - `cliPath` ラッパーは SSH を使って `imsg` を実行する
    - `remoteHost` は SCP による添付ファイル取得を有効にする

    例:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    SSH と SCP の両方が非対話的に動作するように SSH キーを使用します。
    先にホストキーが信頼済みであることを確認し（例: `ssh bot@mac-mini.tailnet-1234.ts.net`）、`known_hosts` が設定されるようにします。

  </Accordion>

  <Accordion title="マルチアカウントパターン">
    iMessage は `channels.imessage.accounts` 配下でアカウントごとの設定をサポートします。

    各アカウントは、`cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、履歴設定、添付ファイルルート許可リストなどのフィールドを上書きできます。

  </Accordion>
</AccordionGroup>

## メディア、チャンク化、配信ターゲット

<AccordionGroup>
  <Accordion title="添付ファイルとメディア">
    - 受信添付ファイルの取り込みは**既定でオフ**です。写真、ボイスメモ、動画、その他の添付ファイルをエージェントに転送するには、`channels.imessage.includeAttachments: true` を設定してください。無効な場合、添付ファイルのみの iMessage はエージェントに到達する前にドロップされ、`Inbound message` ログ行がまったく生成されないことがあります。
    - `remoteHost` が設定されている場合、リモート添付ファイルパスは SCP 経由で取得できます
    - 添付ファイルパスは許可されたルートに一致する必要があります:
      - `channels.imessage.attachmentRoots`（ローカル）
      - `channels.imessage.remoteAttachmentRoots`（リモート SCP モード）
      - 既定のルートパターン: `/Users/*/Library/Messages/Attachments`
    - SCP は厳格なホストキー確認を使用します（`StrictHostKeyChecking=yes`）
    - 送信メディアサイズは `channels.imessage.mediaMaxMb` を使用します（既定 16 MB）

  </Accordion>

  <Accordion title="送信チャンク化">
    - テキストチャンク上限: `channels.imessage.textChunkLimit`（既定 4000）
    - チャンクモード: `channels.imessage.chunkMode`
      - `length`（既定）
      - `newline`（段落優先の分割）

  </Accordion>

  <Accordion title="アドレス指定形式">
    推奨される明示的なターゲット:

    - `chat_id:123`（安定したルーティングに推奨）
    - `chat_guid:...`
    - `chat_identifier:...`

    ハンドルターゲットもサポートされます:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Private API アクション

`imsg launch` が実行中で、`openclaw channels status --probe` が `privateApi.available: true` を報告する場合、メッセージツールは通常のテキスト送信に加えて iMessage ネイティブのアクションを使用できます。

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="利用可能なアクション">
    - **react**: iMessage tapback を追加/削除します（`messageId`、`emoji`、`remove`）。サポートされる tapback は、love、like、dislike、laugh、emphasize、question に対応します。
    - **reply**: 既存メッセージへのスレッド返信を送信します（`messageId`、`text` または `message`、さらに `chatGuid`、`chatId`、`chatIdentifier`、または `to`）。
    - **sendWithEffect**: iMessage エフェクト付きでテキストを送信します（`text` または `message`、`effect` または `effectId`）。
    - **edit**: サポートされる macOS/Private API バージョンで送信済みメッセージを編集します（`messageId`、`text` または `newText`）。
    - **unsend**: サポートされる macOS/Private API バージョンで送信済みメッセージを取り消します（`messageId`）。
    - **upload-file**: メディア/ファイルを送信します（base64 の `buffer`、またはハイドレーション済みの `media`/`path`/`filePath`、`filename`、任意の `asVoice`）。レガシーエイリアス: `sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**: 現在のターゲットがグループ会話の場合にグループチャットを管理します。

  </Accordion>

  <Accordion title="メッセージ ID">
    受信 iMessage コンテキストには、利用可能な場合、短い `MessageSid` 値と完全なメッセージ GUID の両方が含まれます。短い ID は最近のインメモリ返信キャッシュにスコープされ、使用前に現在のチャットに対して確認されます。短い ID が期限切れになっているか別のチャットに属している場合は、完全な `MessageSidFull` で再試行してください。

  </Accordion>

  <Accordion title="ケイパビリティ検出">
    OpenClaw は、キャッシュされたプローブステータスがブリッジを利用不可と示している場合にのみ Private API アクションを非表示にします。ステータスが不明な場合、アクションは表示されたままになり、ディスパッチ時に遅延プローブされるため、別途手動でステータスを更新しなくても、`imsg launch` 後の最初のアクションが成功できます。

  </Accordion>

  <Accordion title="開封確認と入力中表示">
    Private API ブリッジが起動している場合、受け付けられた受信チャットはディスパッチ前に既読としてマークされ、エージェントが生成している間、送信者に入力中バブルが表示されます。既読マークを無効にするには:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    メソッドごとのケイパビリティリストより前の古い `imsg` ビルドでは、入力中/既読が静かにゲートされます。OpenClaw は再起動ごとに 1 回だけ警告をログに出すため、レシート欠落の原因を特定できます。

  </Accordion>
</AccordionGroup>

## 設定書き込み

iMessage では、既定でチャンネル起点の設定書き込みが許可されています（`commands.config: true` の場合の `/config set|unset`）。

無効化:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 分割送信された DM の結合（1 つの作成内容にコマンド + URL）

ユーザーがコマンドと URL を一緒に入力した場合（例: `Dump https://example.com/article`）、Apple の Messages アプリは送信を**2 つの別々の `chat.db` 行**に分割します。

1. テキストメッセージ（`"Dump"`）。
2. OG プレビュー画像を添付ファイルとして含む URL プレビューバルーン（`"https://..."`）。

ほとんどの環境では、この 2 行は約 0.8-2.0 秒差で OpenClaw に到着します。結合しない場合、エージェントはターン 1 でコマンドだけを受け取り、返信し（多くの場合「URL を送ってください」）、ターン 2 でようやく URL を確認します。その時点では、コマンドのコンテキストはすでに失われています。これは Apple の送信パイプラインであり、OpenClaw や `imsg` が導入しているものではありません。

`channels.imessage.coalesceSameSenderDms` は、DM で同一送信者の連続行を 1 つのエージェントターンにマージするようにします。グループチャットは、複数ユーザーのターン構造を維持するため、引き続きメッセージごとにディスパッチされます。

<Tabs>
  <Tab title="有効にする場合">
    次の場合に有効にします。

    - 1 つのメッセージ内に `command + payload` があることを期待する Skills（dump、paste、save、queue など）を提供している。
    - ユーザーがコマンドと一緒に URL、画像、または長いコンテンツを貼り付ける。
    - 追加される DM ターンレイテンシーを許容できる（下記参照）。

    次の場合は無効のままにします。

    - 1 語の DM トリガーに対して最小のコマンドレイテンシーが必要。
    - すべてのフローが、ペイロードの後続送信を伴わない単発コマンドである。

  </Tab>
  <Tab title="有効化">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    フラグがオンで、明示的な `messages.inbound.byChannel.imessage` がない場合、デバウンス時間枠は **2500 ms** に広がります（従来のデフォルトは 0 ms、つまりデバウンスなし）。Apple の分割送信間隔は 0.8-2.0 s であり、より短いデフォルトには収まらないため、この広い時間枠が必要です。

    時間枠を自分で調整するには:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is
            // slow or under memory pressure (observed gap can stretch past 2 s
            // then).
            imessage: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="トレードオフ">
    - **DM メッセージに遅延が追加されます。** フラグがオンの場合、すべての DM（単独の制御コマンドや単一テキストの追記を含む）は、ペイロード行が到着する可能性に備えて、送出前に最大でデバウンス時間枠まで待機します。グループチャットのメッセージは即時送出のままです。
    - **マージされた出力には上限があります。** マージされたテキストは明示的な `…[truncated]` マーカー付きで 4000 文字までです。添付ファイルは 20 個まで、ソースエントリは 10 個までです（それを超える場合は先頭と最新が保持されます）。すべてのソース GUID は、下流のテレメトリ用に `coalescedMessageGuids` で追跡されます。
    - **DM のみ。** グループチャットはメッセージ単位の送出にフォールスルーするため、複数人が入力している場合でも bot の応答性が保たれます。
    - **オプトイン、チャンネル単位。** 他のチャンネル（Telegram、WhatsApp、Slack、…）には影響しません。`channels.bluebubbles.coalesceSameSenderDms` を設定している従来の BlueBubbles 設定は、その値を `channels.imessage.coalesceSameSenderDms` に移行してください。

  </Tab>
</Tabs>

### シナリオと agent から見える内容

| ユーザーの作成内容                                                 | `chat.db` の生成内容  | フラグオフ（デフォルト）                | フラグオン + 2500 ms 時間枠                                             |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（1 回の送信）                            | 約 1 s 間隔の 2 行    | 2 回の agent ターン: "Dump" 単独、その後 URL | 1 回のターン: マージされたテキスト `Dump https://example.com`           |
| `Save this 📎image.jpg caption`（添付ファイル + テキスト）          | 2 行                  | 2 回のターン（添付ファイルはマージ時に破棄） | 1 回のターン: テキスト + 画像が保持される                               |
| `/status`（単独コマンド）                                          | 1 行                  | 即時送出                                | **最大で時間枠まで待機してから送出**                                    |
| URL だけを貼り付け                                                 | 1 行                  | 即時送出                                | 即時送出（バケット内のエントリが 1 つだけ）                             |
| テキスト + URL を意図的に分けて 2 通のメッセージとして数分間隔で送信 | 時間枠外の 2 行       | 2 回のターン                            | 2 回のターン（それらの間に時間枠が期限切れになる）                      |
| 短時間の大量送信（時間枠内に >10 個の短い DM）                     | N 行                  | N 回のターン                            | 1 回のターン、上限付き出力（先頭 + 最新、テキスト/添付ファイル上限を適用） |
| グループチャットで 2 人が入力                                      | M 人の送信者から N 行 | M+ 回のターン（送信者バケットごとに 1 回） | M+ 回のターン — グループチャットは結合されない                          |

## Gateway 停止後の追いつき処理

Gateway がオフライン（クラッシュ、再起動、Mac のスリープ、マシンの電源断）になると、Gateway が復帰した時点で `imsg watch` は現在の `chat.db` 状態から再開します。ギャップ中に届いたものは、デフォルトでは一切検出されません。追いつき処理は次回起動時にそれらのメッセージを再生するため、agent が受信トラフィックを黙って見逃すことを防ぎます。

追いつき処理は**デフォルトで無効**です。チャンネルごとに有効化します。

```ts
channels: {
  imessage: {
    catchup: {
      enabled: true,             // master switch (default: false)
      maxAgeMinutes: 120,        // skip rows older than now - 2h (default: 120, clamp 1..720)
      perRunLimit: 50,           // max rows replayed per startup (default: 50, clamp 1..500)
      firstRunLookbackMinutes: 30, // first run with no cursor: look back 30 min (default: 30)
      maxFailureRetries: 10,     // give up on a wedged guid after 10 dispatch failures (default: 10)
    },
  },
}
```

### 実行方法

`monitorIMessageProvider` の起動ごとに 1 回のパスとして、`imsg launch` 準備完了 → `watch.subscribe` → `performIMessageCatchup` → ライブ送出ループの順に実行されます。追いつき処理自体は、`imsg watch` と同じ JSON-RPC クライアントに対して `chats.list` + チャットごとの `messages.history` を使用します。追いつき処理のパス中に届いたものは通常どおりライブ送出を通過します。既存の受信重複排除キャッシュが、再生された行との重複を吸収します。

再生される各行はライブ送出パス（`evaluateIMessageInbound` + `dispatchInboundMessage`）に渡されるため、許可リスト、グループポリシー、デバウンサー、エコーキャッシュ、開封確認は、再生メッセージとライブメッセージで同一に動作します。

### カーソルとリトライのセマンティクス

追いつき処理は、アカウントごとのカーソルを `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` に保持します（OpenClaw 状態ディレクトリのデフォルトは `~/.openclaw` で、`OPENCLAW_STATE_DIR` により上書き可能です）。

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- カーソルは送出が成功するたびに進み、行の送出で例外が発生した場合は保持されます。次回起動時は保持されたカーソルから同じ行を再試行します。
- 同じ `guid` に対して `maxFailureRetries` 回連続で例外が発生した後、追いつき処理は `warn` をログに出し、詰まったメッセージを越えてカーソルを強制的に進めます。これにより後続の起動で処理を進められます。
- すでに諦めた guid は後続の実行で検出時にスキップされ（送出試行なし）、実行サマリーの `skippedGivenUp` に計上されます。

### オペレーターから見えるシグナル

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

`WARN ... capped to perRunLimit` 行は、1 回の起動ではバックログ全体を処理しきれなかったことを意味します。ギャップがデフォルトの 50 行パスを定期的に超える場合は、`perRunLimit`（最大 500）を引き上げてください。

### オフのままにしておく場合

- Gateway が watchdog の自動再起動付きで継続的に動作し、ギャップが常に数秒未満である場合、デフォルトのオフで問題ありません。
- DM の量が少なく、見逃したメッセージが agent の動作を変えない場合、`firstRunLookbackMinutes` の初回時間枠が、初回有効化時に想定外の古いコンテキストを送出する可能性があります。

追いつき処理をオンにした場合、カーソルがない最初の起動では `firstRunLookbackMinutes`（デフォルト 30 分）だけを振り返ります。`maxAgeMinutes` の時間枠全体ではありません。これにより、有効化前の長い履歴を再生することを避けます。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="imsg が見つからない、または RPC がサポートされていない">
    バイナリと RPC サポートを検証します。

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    プローブで RPC が未サポートと報告される場合は、`imsg` を更新してください。private API アクションを利用できない場合は、ログイン中の macOS ユーザーセッションで `imsg launch` を実行し、再度プローブしてください。Gateway が macOS 上で実行されていない場合は、デフォルトのローカル `imsg` パスではなく、上記の SSH 経由のリモート Mac 設定を使用してください。

  </Accordion>

  <Accordion title="Gateway が macOS で実行されていない">
    デフォルトの `cliPath: "imsg"` は、Messages にサインインしている Mac 上で実行する必要があります。Linux または Windows では、`channels.imessage.cliPath` を、その Mac に SSH して `imsg "$@"` を実行するラッパースクリプトに設定してください。

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    その後、次を実行します。

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DM が無視される">
    確認項目:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - ペアリング承認（`openclaw pairing list imessage`）

  </Accordion>

  <Accordion title="グループメッセージが無視される">
    確認項目:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` 許可リストの動作
    - メンションパターン設定（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="リモート添付ファイルに失敗する">
    確認項目:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - Gateway ホストからの SSH/SCP 鍵認証
    - Gateway ホスト上の `~/.ssh/known_hosts` にホスト鍵が存在する
    - Messages を実行している Mac 上でリモートパスが読み取り可能

  </Accordion>

  <Accordion title="macOS の権限プロンプトを見逃した">
    同じユーザー/セッションコンテキストの対話型 GUI ターミナルで再実行し、プロンプトを承認します。

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    OpenClaw/`imsg` を実行するプロセスコンテキストに対して、フルディスクアクセス + オートメーションが付与されていることを確認してください。

  </Accordion>
</AccordionGroup>

## 設定リファレンスへのポインター

- [設定リファレンス - iMessage](/ja-JP/gateway/config-channels#imessage)
- [Gateway 設定](/ja-JP/gateway/configuration)
- [ペアリング](/ja-JP/channels/pairing)

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされるすべてのチャンネル
- [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage) — 告知と移行サマリー
- [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles) — 設定変換表と段階的な切り替え
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
