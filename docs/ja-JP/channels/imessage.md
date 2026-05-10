---
read_when:
    - iMessage対応の設定
    - iMessage の送受信をデバッグする
summary: imsg（stdio 経由の JSON-RPC）によるネイティブな iMessage サポート。返信、タップバック、エフェクト、添付ファイル、グループ管理向けのプライベート API アクションを備えています。ホスト要件が合う場合、新しい OpenClaw iMessage セットアップに推奨されます。
title: iMessage
x-i18n:
    generated_at: "2026-05-10T19:21:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 249d5faf9718e354caecaeb8ee22f66f9e24b50c6b091997d1c2286c44c1581d
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
OpenClaw iMessage デプロイでは、サインイン済みの macOS Messages ホスト上で `imsg` を使用します。Gateway が Linux または Windows で実行されている場合は、Mac 上で `imsg` を実行する SSH ラッパーを `channels.imessage.cliPath` に指定します。

**Gateway ダウンタイム後のキャッチアップはオプトインです。** 有効にすると（`channels.imessage.catchup.enabled: true`）、gateway は次回起動時に、オフライン中（クラッシュ、再起動、Mac のスリープ）に `chat.db` に到着した受信メッセージを再生します。デフォルトでは無効です。[Gateway ダウンタイム後のキャッチアップ](#catching-up-after-gateway-downtime)を参照してください。[openclaw#78649](https://github.com/openclaw/openclaw/issues/78649) をクローズします。
</Note>

<Warning>
BlueBubbles サポートは削除されました。`channels.bluebubbles` 設定を `channels.imessage` に移行してください。OpenClaw は `imsg` のみで iMessage をサポートします。
</Warning>

状態: ネイティブ外部 CLI 統合。Gateway は `imsg rpc` を起動し、stdio 上の JSON-RPC で通信します（別個のデーモンやポートはありません）。高度なアクションには、`imsg launch` と private API プローブの成功が必要です。

<CardGroup cols={3}>
  <Card title="Private API アクション" icon="wand-sparkles" href="#private-api-actions">
    返信、タップバック、エフェクト、添付ファイル、グループ管理。
  </Card>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    iMessage DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="SSH 経由のリモート Mac" icon="terminal" href="#remote-mac-over-ssh">
    Gateway が Messages Mac 上で実行されていない場合は、SSH ラッパーを使用します。
  </Card>
  <Card title="設定リファレンス" icon="settings" href="/ja-JP/gateway/config-channels#imessage">
    iMessage フィールドの完全なリファレンス。
  </Card>
</CardGroup>

## クイックセットアップ

<Tabs>
  <Tab title="ローカル Mac（高速パス）">
    <Steps>
      <Step title="imsg のインストールと検証">

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

      <Step title="gateway を起動する">

```bash
openclaw gateway
```

      </Step>

      <Step title="最初の DM ペアリングを承認する（デフォルトの dmPolicy）">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        ペアリングリクエストは 1 時間後に期限切れになります。
      </Step>
    </Steps>

  </Tab>

  <Tab title="SSH 経由のリモート Mac">
    OpenClaw が必要とするのは stdio 互換の `cliPath` だけなので、リモート Mac に SSH して `imsg` を実行するラッパースクリプトを `cliPath` に指定できます。

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
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    `remoteHost` が設定されていない場合、OpenClaw は SSH ラッパースクリプトを解析して自動検出を試みます。
    `remoteHost` は `host` または `user@host` である必要があります（スペースや SSH オプションは不可）。
    OpenClaw は SCP に厳密なホストキー検証を使用するため、リレーホストキーはすでに `~/.ssh/known_hosts` に存在している必要があります。
    添付ファイルパスは、許可されたルート（`attachmentRoots` / `remoteAttachmentRoots`）に照らして検証されます。

  </Tab>
</Tabs>

## 要件と権限（macOS）

- `imsg` を実行する Mac で Messages にサインインしている必要があります。
- OpenClaw/`imsg` を実行するプロセスコンテキストにはフルディスクアクセスが必要です（Messages DB アクセス）。
- Messages.app 経由でメッセージを送信するには、オートメーション権限が必要です。
- 高度なアクション（リアクション / 編集 / 送信取り消し / スレッド返信 / エフェクト / グループ操作）には、システム整合性保護を無効にする必要があります。下記の [imsg private API の有効化](#enabling-the-imsg-private-api)を参照してください。基本的なテキストとメディアの送受信は、これなしで動作します。

<Tip>
権限はプロセスコンテキストごとに付与されます。gateway をヘッドレス（LaunchAgent/SSH）で実行する場合は、同じコンテキストで一度だけ対話型コマンドを実行して、プロンプトをトリガーします。

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## imsg private API の有効化

`imsg` は 2 つの運用モードを備えています。

- **基本モード**（デフォルト、SIP の変更は不要）: `send` による送信テキストとメディア、受信ウォッチ/履歴、チャット一覧。これは、新規の `brew install steipete/tap/imsg` と上記の標準 macOS 権限でそのまま得られるものです。
- **Private API モード**: `imsg` はヘルパー dylib を `Messages.app` に注入して、内部 `IMCore` 関数を呼び出します。これにより、`react`、`edit`、`unsend`、`reply`（スレッド形式）、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`、さらに入力インジケーターと開封確認が使用可能になります。

このチャンネルページで説明している高度なアクション面に到達するには、Private API モードが必要です。`imsg` README は要件を明確に述べています。

> `read`、`typing`、`launch`、ブリッジ対応のリッチ送信、メッセージ変更、チャット管理などの高度な機能はオプトインです。SIP を無効にし、ヘルパー dylib を `Messages.app` に注入する必要があります。SIP が有効な場合、`imsg launch` は注入を拒否します。

ヘルパー注入方式では、Messages の private API に到達するために `imsg` 自身の dylib を使用します。OpenClaw iMessage パスには、サードパーティサーバーや BlueBubbles ランタイムはありません。

<Warning>
**SIP を無効にすることは実際のセキュリティ上のトレードオフです。** SIP は、変更されたシステムコードの実行に対する macOS の中核的な保護の 1 つです。システム全体でオフにすると、追加の攻撃対象領域と副作用が生じます。特に、**Apple Silicon Mac で SIP を無効にすると、Mac に iOS アプリをインストールして実行する機能も無効になります**。

これをデフォルトではなく、意図的な運用上の選択として扱ってください。脅威モデルが SIP オフを許容できない場合、バンドル版 iMessage は基本モードに制限されます。つまり、テキストとメディアの送受信のみで、リアクション / 編集 / 送信取り消し / エフェクト / グループ操作はありません。
</Warning>

### セットアップ

1. Messages.app を実行する Mac に **`imsg` をインストール（またはアップグレード）** します。

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` の出力には `bridge_version`、`rpc_methods`、メソッドごとの `selectors` が報告されるため、開始前に現在のビルドが何をサポートしているかを確認できます。

2. **システム整合性保護を無効にします。** 基盤となる Apple の要件は OS とハードウェアに依存するため、これは macOS バージョン固有です。
   - **macOS 10.13–10.15（Sierra–Catalina）:** Terminal で Library Validation を無効化し、Recovery Mode に再起動して `csrutil disable` を実行し、再起動します。
   - **macOS 11+（Big Sur 以降）、Intel:** Recovery Mode（または Internet Recovery）で `csrutil disable` を実行し、再起動します。
   - **macOS 11+、Apple Silicon:** 電源ボタンの起動シーケンスで Recovery に入ります。最近の macOS バージョンでは Continue をクリックするときに **Left Shift** キーを押し続け、その後 `csrutil disable` を実行します。仮想マシン構成では別のフローに従います。先に VM スナップショットを取得してください。
   - **macOS 26 / Tahoe:** library-validation ポリシーと `imagent` の private-entitlement チェックがさらに厳格化されています。`imsg` が追従するには更新されたビルドが必要になる場合があります。macOS のメジャーアップグレード後に `imsg launch` の注入や特定の `selectors` が false を返し始めた場合は、SIP 手順が成功したと判断する前に `imsg` のリリースノートを確認してください。

   `imsg launch` を実行する前に、使用している Mac 向けの Apple の Recovery-mode フローに従って SIP を無効にしてください。

3. **ヘルパーを注入します。** SIP を無効にし、Messages.app にサインインした状態で次を実行します。

   ```bash
   imsg launch
   ```

   SIP がまだ有効な場合、`imsg launch` は注入を拒否するため、これは手順 2 が反映されたことの確認も兼ねます。

4. **OpenClaw からブリッジを検証します。**

   ```bash
   openclaw channels status --probe
   ```

   iMessage エントリは `works` を報告するはずです。また、`imsg status --json | jq '.selectors'` は `retractMessagePart: true` に加え、使用中の macOS ビルドが公開している編集 / 入力 / 既読セレクターを表示するはずです。`actions.ts` の OpenClaw Plugin のメソッド別ゲートは、基盤となるセレクターが `true` のアクションのみを公開するため、エージェントのツール一覧で見えるアクション面は、このホスト上でブリッジが実際に実行できる内容を反映します。

`openclaw channels status --probe` がチャンネルを `works` と報告しているのに、特定のアクションがディスパッチ時に「iMessage `<action>` requires the imsg private API bridge」をスローする場合は、`imsg launch` を再実行してください。ヘルパーは外れることがあり（Messages.app の再起動、OS 更新など）、キャッシュされた `available: true` 状態は、次回のプローブで更新されるまでアクションの公開を続けます。

### SIP を無効にできない場合

SIP 無効化が脅威モデルに受け入れられない場合:

- `imsg` は基本モードにフォールバックします。テキスト + メディア + 受信のみです。
- OpenClaw Plugin は引き続きテキスト/メディア送信と受信監視を公開します。ただし、メソッド別の capability ゲートに従って、`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、グループ操作をアクション面から隠します。
- iMessage ワークロード用に、SIP をオフにした別の非 Apple Silicon Mac（または専用 bot Mac）を実行し、主要デバイスでは SIP を有効のままにできます。下記の[専用 bot macOS ユーザー（別の iMessage ID）](#deployment-patterns)を参照してください。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM ポリシー">
    `channels.imessage.dmPolicy` はダイレクトメッセージを制御します。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    allowlist フィールド: `channels.imessage.allowFrom`。

    allowlist エントリには、ハンドル、静的な送信者アクセスグループ（`accessGroup:<name>`）、またはチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を指定できます。

  </Tab>

  <Tab title="グループポリシー + メンション">
    `channels.imessage.groupPolicy` はグループ処理を制御します。

    - `allowlist`（設定時のデフォルト）
    - `open`
    - `disabled`

    グループ送信者 allowlist: `channels.imessage.groupAllowFrom`。

    `groupAllowFrom` エントリは、静的な送信者アクセスグループ（`accessGroup:<name>`）も参照できます。

    ランタイムフォールバック: `groupAllowFrom` が未設定の場合、iMessage グループ送信者チェックは、利用可能であれば `allowFrom` にフォールバックします。
    ランタイム注記: `channels.imessage` が完全に欠落している場合、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログに記録します（`channels.defaults.groupPolicy` が設定されている場合でも）。

    <Warning>
    グループルーティングには、連続して実行される **2 つ** の allowlist ゲートがあり、両方を通過する必要があります。

    1. **送信者 / チャットターゲット allowlist**（`channels.imessage.groupAllowFrom`）— ハンドル、`chat_guid`、`chat_identifier`、または `chat_id`。
    2. **グループレジストリ**（`channels.imessage.groups`）— `groupPolicy: "allowlist"` の場合、このゲートには `groups: { "*": { ... } }` ワイルドカードエントリ（`allowAll = true` を設定）または `groups` 配下の明示的な `chat_id` ごとのエントリのいずれかが必要です。

    ゲート 2 に何もない場合、すべてのグループメッセージはドロップされます。Plugin はデフォルトのログレベルで 2 つの `warn` レベルのシグナルを出力します。

    - 起動時にアカウントごとに 1 回: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - 実行時に `chat_id` ごとに 1 回: `imessage: dropping group message from chat_id=<id> ...`

    DM は異なるコードパスを通るため、引き続き動作します。

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

    これらの `warn` 行が gateway ログに表示される場合、ゲート 2 がドロップしています。`groups` ブロックを追加してください。
    </Warning>

    グループのメンションゲート:

    - iMessage にはネイティブのメンションメタデータがない
    - メンション検出は正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）を使用する
    - パターンが設定されていない場合、メンションゲートを強制できない

    認可済み送信者からの制御コマンドは、グループ内でメンションゲートをバイパスできる。

    グループ別 `systemPrompt`:

    `channels.imessage.groups.*` 配下の各エントリは、任意の `systemPrompt` 文字列を受け入れる。この値は、そのグループ内のメッセージを処理する各ターンで、エージェントのシステムプロンプトに注入される。解決方法は `channels.whatsapp.groups` で使われるグループ別プロンプト解決と同じ。

    1. **グループ固有のシステムプロンプト**（`groups["<chat_id>"].systemPrompt`）: 特定のグループエントリがマップ内に存在し、かつその `systemPrompt` キーが定義されている場合に使用される。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、そのグループにはシステムプロンプトが適用されない。
    2. **グループワイルドカードのシステムプロンプト**（`groups["*"].systemPrompt`）: 特定のグループエントリがマップにまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用される。

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

    グループ別プロンプトはグループメッセージにのみ適用される。このチャンネルのダイレクトメッセージには影響しない。

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DM は直接ルーティングを使用し、グループはグループルーティングを使用する。
    - デフォルトの `session.dmScope=main` では、iMessage の DM はエージェントのメインセッションに統合される。
    - グループセッションは分離される（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 返信は、発信元のチャンネル/ターゲットメタデータを使用して iMessage にルーティングされる。

    グループに近いスレッドの挙動:

    一部の複数参加者 iMessage スレッドは、`is_group=false` として届くことがある。
    その `chat_id` が `channels.imessage.groups` 配下に明示的に設定されている場合、OpenClaw はそれをグループトラフィックとして扱う（グループゲート + グループセッション分離）。

  </Tab>
</Tabs>

## ACP 会話バインディング

レガシー iMessage チャットも ACP セッションにバインドできる。

高速なオペレーターフロー:

- DM または許可されたグループチャット内で `/acp spawn codex --bind here` を実行する。
- 同じ iMessage 会話内の以後のメッセージは、生成された ACP セッションにルーティングされる。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットする。
- `/acp close` は ACP セッションを閉じ、バインディングを削除する。

設定済みの永続バインディングは、`type: "acp"` と `match.channel: "imessage"` を持つトップレベルの `bindings[]` エントリでサポートされる。

`match.peer.id` には次を使用できる。

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

共有 ACP バインディングの挙動については、[ACP エージェント](/ja-JP/tools/acp-agents)を参照。

## デプロイパターン

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    ボットのトラフィックを個人の Messages プロファイルから分離するため、専用の Apple ID と macOS ユーザーを使用する。

    一般的なフロー:

    1. 専用の macOS ユーザーを作成/サインインする。
    2. そのユーザーで、ボット用 Apple ID を使って Messages にサインインする。
    3. そのユーザーに `imsg` をインストールする。
    4. OpenClaw がそのユーザーコンテキストで `imsg` を実行できるように SSH ラッパーを作成する。
    5. `channels.imessage.accounts.<id>.cliPath` と `.dbPath` をそのユーザープロファイルに向ける。

    初回実行時には、そのボットユーザーセッションで GUI 承認（オートメーション + フルディスクアクセス）が必要になる場合がある。

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    一般的なトポロジー:

    - Gateway は Linux/VM 上で動作する
    - iMessage + `imsg` は tailnet 内の Mac 上で動作する
    - `cliPath` ラッパーは SSH を使用して `imsg` を実行する
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

    SSH と SCP の両方が非対話的になるように SSH キーを使用する。
    先にホストキーが信頼されていることを確認し（例: `ssh bot@mac-mini.tailnet-1234.ts.net`）、`known_hosts` が設定されるようにする。

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage は `channels.imessage.accounts` 配下でアカウント別設定をサポートする。

    各アカウントは、`cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、履歴設定、添付ファイルルートの許可リストなどのフィールドを上書きできる。

  </Accordion>
</AccordionGroup>

## メディア、チャンク化、配信ターゲット

<AccordionGroup>
  <Accordion title="Attachments and media">
    - 受信添付ファイルの取り込みは**デフォルトでオフ**。写真、ボイスメモ、動画、その他の添付ファイルをエージェントに転送するには、`channels.imessage.includeAttachments: true` を設定する。無効な場合、添付ファイルのみの iMessage はエージェントに到達する前に破棄され、`Inbound message` ログ行がまったく生成されないことがある。
    - `remoteHost` が設定されている場合、リモート添付ファイルパスは SCP 経由で取得できる
    - 添付ファイルパスは許可されたルートと一致する必要がある:
      - `channels.imessage.attachmentRoots`（ローカル）
      - `channels.imessage.remoteAttachmentRoots`（リモート SCP モード）
      - デフォルトのルートパターン: `/Users/*/Library/Messages/Attachments`
    - SCP は厳格なホストキー確認（`StrictHostKeyChecking=yes`）を使用する
    - 送信メディアサイズは `channels.imessage.mediaMaxMb` を使用する（デフォルト 16 MB）

  </Accordion>

  <Accordion title="Outbound chunking">
    - テキストチャンク上限: `channels.imessage.textChunkLimit`（デフォルト 4000）
    - チャンクモード: `channels.imessage.chunkMode`
      - `length`（デフォルト）
      - `newline`（段落優先の分割）

  </Accordion>

  <Accordion title="Addressing formats">
    推奨される明示的ターゲット:

    - `chat_id:123`（安定したルーティングに推奨）
    - `chat_guid:...`
    - `chat_identifier:...`

    ハンドルターゲットもサポートされる:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## プライベート API アクション

`imsg launch` が実行中で、`openclaw channels status --probe` が `privateApi.available: true` を報告している場合、メッセージツールは通常のテキスト送信に加えて、iMessage ネイティブのアクションを使用できる。

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
  <Accordion title="Available actions">
    - **react**: iMessage の tapback を追加/削除する（`messageId`、`emoji`、`remove`）。サポートされる tapback は love、like、dislike、laugh、emphasize、question に対応する。
    - **reply**: 既存メッセージへのスレッド返信を送信する（`messageId`、`text` または `message` に加えて、`chatGuid`、`chatId`、`chatIdentifier`、または `to`）。
    - **sendWithEffect**: iMessage エフェクト付きでテキストを送信する（`text` または `message`、`effect` または `effectId`）。
    - **edit**: サポートされる macOS/プライベート API バージョンで送信済みメッセージを編集する（`messageId`、`text` または `newText`）。
    - **unsend**: サポートされる macOS/プライベート API バージョンで送信済みメッセージを取り消す（`messageId`）。
    - **upload-file**: メディア/ファイルを送信する（base64 の `buffer`、またはハイドレート済みの `media`/`path`/`filePath`、`filename`、任意の `asVoice`）。レガシーエイリアス: `sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**: 現在のターゲットがグループ会話の場合に、グループチャットを管理する。

  </Accordion>

  <Accordion title="Message IDs">
    受信 iMessage コンテキストには、利用可能な場合、短い `MessageSid` 値と完全なメッセージ GUID の両方が含まれる。短い ID は直近のメモリ内返信キャッシュにスコープされ、使用前に現在のチャットと照合される。短い ID の期限が切れているか、別のチャットに属している場合は、完全な `MessageSidFull` で再試行する。

  </Accordion>

  <Accordion title="Capability detection">
    OpenClaw は、キャッシュされたプローブステータスがブリッジを利用不可と示す場合にのみ、プライベート API アクションを非表示にする。ステータスが不明な場合、アクションは表示されたままになり、ディスパッチ時に遅延プローブされるため、`imsg launch` の後に手動で別途ステータス更新を行わなくても最初のアクションが成功できる。

  </Accordion>

  <Accordion title="Read receipts and typing">
    プライベート API ブリッジが起動している場合、受け付けられた受信チャットはディスパッチ前に既読としてマークされ、エージェントが生成している間、送信者に入力中バブルが表示される。既読マークを無効にするには:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    メソッド別の機能リストより前の古い `imsg` ビルドでは、入力中/既読が黙ってゲートされる。OpenClaw は再起動ごとに一度だけ警告をログに出すため、既読通知が欠落している原因を特定できる。

  </Accordion>
</AccordionGroup>

## 設定書き込み

iMessage は、デフォルトでチャンネル起点の設定書き込みを許可する（`commands.config: true` の場合の `/config set|unset`）。

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

## 分割送信された DM の結合（1 つの入力内のコマンド + URL）

ユーザーがコマンドと URL を一緒に入力した場合（例: `Dump https://example.com/article`）、Apple の Messages アプリは送信を**2 つの別個の `chat.db` 行**に分割する。

1. テキストメッセージ（`"Dump"`）。
2. OG プレビュー画像を添付ファイルとして含む URL プレビューバルーン（`"https://..."`）。

この 2 行は、ほとんどの環境で約 0.8〜2.0 秒の間隔で OpenClaw に到着する。結合しない場合、エージェントはターン 1 でコマンドだけを受け取り、返信し（多くの場合「URL を送ってください」）、ターン 2 でようやく URL を見る。この時点では、コマンドコンテキストはすでに失われている。これは Apple の送信パイプラインによるもので、OpenClaw や `imsg` が導入しているものではない。

`channels.imessage.coalesceSameSenderDms` は、DM で同じ送信者から連続して届いた行を 1 つのエージェントターンにマージすることを有効にする。グループチャットは、複数ユーザーのターン構造を保持するため、メッセージ単位でディスパッチし続ける。

<Tabs>
  <Tab title="When to enable">
    次の場合に有効化する:

    - 1 つのメッセージ内の `command + payload` を期待するスキル（dump、paste、save、queue など）を提供している。
    - ユーザーがコマンドと一緒に URL、画像、または長いコンテンツを貼り付ける。
    - 追加される DM ターン遅延を許容できる（下記参照）。

    次の場合は無効のままにする:

    - 1 語の DM トリガーで最小のコマンド遅延が必要である。
    - すべてのフローが、ペイロードの後続入力を伴わない単発コマンドである。

  </Tab>
  <Tab title="Enabling">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    フラグを有効にし、明示的な `messages.inbound.byChannel.imessage` がない場合、デバウンスウィンドウは **2500 ms** に広がります（レガシー既定値は 0 ms、つまりデバウンスなし）。Apple の 0.8〜2.0 s の分割送信間隔は、より短い既定値には収まらないため、広いウィンドウが必要です。

    ウィンドウを自分で調整するには:

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
    - **DM メッセージのレイテンシが増えます。** フラグを有効にすると、すべての DM（単独の制御コマンドや単一テキストの追加返信を含む）は、ペイロード行が来る可能性に備えて、ディスパッチ前に最大でデバウンスウィンドウ分待機します。グループチャットメッセージは即時ディスパッチを維持します。
    - **マージされた出力には上限があります。** マージされたテキストは明示的な `…[truncated]` マーカー付きで 4000 文字に制限されます。添付ファイルは 20 件まで、ソースエントリは 10 件までです（それを超える分は先頭と最新が保持されます）。すべてのソース GUID は、下流のテレメトリー用に `coalescedMessageGuids` で追跡されます。
    - **DM のみ。** 複数人が入力しているときもボットの応答性を保つため、グループチャットはメッセージ単位のディスパッチにフォールスルーします。
    - **オプトイン、チャネル単位。** 他のチャネル（Telegram、WhatsApp、Slack、…）には影響しません。`channels.bluebubbles.coalesceSameSenderDms` を設定しているレガシー BlueBubbles 設定は、その値を `channels.imessage.coalesceSameSenderDms` に移行してください。

  </Tab>
</Tabs>

### シナリオとエージェントが見る内容

| ユーザーの作成内容                                                 | `chat.db` の生成内容  | フラグ無効（既定）                    | フラグ有効 + 2500 ms ウィンドウ                                         |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（1 回の送信）                           | 約 1 s 間隔の 2 行    | 2 回のエージェントターン: "Dump" のみ、その後 URL | 1 回のターン: マージされたテキスト `Dump https://example.com`           |
| `Save this 📎image.jpg caption`（添付ファイル + テキスト）          | 2 行                  | 2 回のターン（マージ時に添付ファイルが削除） | 1 回のターン: テキスト + 画像を保持                                     |
| `/status`（単独コマンド）                                          | 1 行                  | 即時ディスパッチ                        | **ウィンドウ分まで待機してからディスパッチ**                            |
| URL のみを貼り付け                                                 | 1 行                  | 即時ディスパッチ                        | 即時ディスパッチ（バケット内のエントリが 1 件のみ）                     |
| テキスト + URL を数分間隔で意図的に 2 つの別メッセージとして送信   | ウィンドウ外の 2 行   | 2 回のターン                            | 2 回のターン（その間にウィンドウが期限切れ）                            |
| 短い DM の高速大量送信（ウィンドウ内で 10 件超）                   | N 行                  | N 回のターン                            | 1 回のターン、上限付き出力（先頭 + 最新、テキスト/添付ファイル上限を適用） |
| グループチャットで 2 人が入力                                      | M 人の送信者から N 行 | M+ 回のターン（送信者バケットごとに 1 回） | M+ 回のターン — グループチャットは結合されません                       |

## Gateway ダウンタイム後の追いつき

Gateway がオフライン（クラッシュ、再起動、Mac のスリープ、マシン電源断）の場合、`imsg watch` は Gateway が復帰すると現在の `chat.db` 状態から再開します。既定では、その間に届いたものは一切見られません。catchup は次回起動時にそれらのメッセージを再生し、エージェントが受信トラフィックを黙って見逃さないようにします。

catchup は**既定で無効**です。チャネルごとに有効化します:

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

`monitorIMessageProvider` の起動ごとに 1 回、`imsg launch` ready → `watch.subscribe` → `performIMessageCatchup` → ライブディスパッチループの順で実行されます。catchup 自体は、`imsg watch` と同じ JSON-RPC クライアントに対して `chats.list` + チャットごとの `messages.history` を使用します。catchup パス中に届いたものは通常どおりライブディスパッチを通過します。既存の受信重複排除キャッシュが、再生された行との重複を吸収します。

再生される各行はライブディスパッチパス（`evaluateIMessageInbound` + `dispatchInboundMessage`）を通されるため、許可リスト、グループポリシー、デバウンサー、エコーキャッシュ、開封確認は、再生メッセージとライブメッセージで同一に動作します。

### カーソルとリトライのセマンティクス

catchup はアカウントごとのカーソルを `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` に保持します（OpenClaw の状態ディレクトリの既定値は `~/.openclaw` で、`OPENCLAW_STATE_DIR` で上書きできます）:

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- カーソルはディスパッチ成功ごとに進み、行のディスパッチが例外を投げた場合は保持されます。次回起動時には、保持されたカーソルから同じ行を再試行します。
- 同じ `guid` に対して `maxFailureRetries` 回連続で例外が投げられた後、catchup は `warn` をログに出し、詰まったメッセージを越えてカーソルを強制的に進めることで、以後の起動が進行できるようにします。
- すでに諦めた guid は、後続の実行で見つかり次第スキップされ（ディスパッチ試行なし）、実行サマリーの `skippedGivenUp` に計上されます。

### オペレーターに見えるシグナル

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

`WARN ... capped to perRunLimit` 行は、1 回の起動でバックログをすべて消化しなかったことを意味します。ギャップが既定の 50 行パスを定期的に超える場合は、`perRunLimit`（最大 500）を引き上げてください。

### オフのままにする場合

- Gateway がウォッチドッグ自動再起動付きで継続実行され、ギャップが常に数秒未満である場合、既定のオフで問題ありません。
- DM 量が少なく、見逃したメッセージがエージェントの動作を変えない場合。`firstRunLookbackMinutes` の初期ウィンドウは、初回有効化時に想定外の古いコンテキストをディスパッチする可能性があります。

catchup を有効にした場合、カーソルがない最初の起動では、`maxAgeMinutes` ウィンドウ全体ではなく `firstRunLookbackMinutes`（既定 30 分）だけをさかのぼります。これにより、有効化前の長い履歴が再生されるのを避けます。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="imsg が見つからない、または RPC がサポートされていない">
    バイナリと RPC サポートを検証します:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    プローブが RPC 非対応を報告した場合は、`imsg` を更新してください。private API アクションが利用できない場合は、ログイン中の macOS ユーザーセッションで `imsg launch` を実行し、再度プローブしてください。Gateway が macOS 上で実行されていない場合は、既定のローカル `imsg` パスではなく、上記の SSH 経由の Remote Mac セットアップを使用してください。

  </Accordion>

  <Accordion title="Gateway が macOS 上で実行されていない">
    既定の `cliPath: "imsg"` は、Messages にサインインしている Mac 上で実行する必要があります。Linux または Windows では、`channels.imessage.cliPath` を、その Mac に SSH して `imsg "$@"` を実行するラッパースクリプトに設定してください。

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    その後、次を実行します:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DM が無視される">
    次を確認してください:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - ペアリング承認（`openclaw pairing list imessage`）

  </Accordion>

  <Accordion title="グループメッセージが無視される">
    次を確認してください:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` 許可リストの動作
    - メンションパターン設定（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="リモート添付ファイルが失敗する">
    次を確認してください:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - Gateway ホストからの SSH/SCP 鍵認証
    - Gateway ホスト上の `~/.ssh/known_hosts` にホストキーが存在する
    - Messages を実行している Mac 上のリモートパスの読み取り可否

  </Accordion>

  <Accordion title="macOS の権限プロンプトを見逃した">
    同じユーザー/セッションコンテキストの対話型 GUI ターミナルで再実行し、プロンプトを承認してください:

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

- [チャネル概要](/ja-JP/channels) — サポートされるすべてのチャネル
- [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles) — 設定変換表と段階的な切り替え
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルとハードニング
