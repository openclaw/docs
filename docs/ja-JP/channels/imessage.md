---
read_when:
    - iMessage サポートの設定
    - iMessage の送受信のデバッグ
summary: imsg（stdio 上の JSON-RPC）経由のネイティブ iMessage サポート。返信、tapback、エフェクト、投票、添付ファイル、グループ管理向けのプライベート API アクションを備えています。ホスト要件が合う場合、新しい OpenClaw iMessage セットアップに推奨されます。
title: iMessage
x-i18n:
    generated_at: "2026-07-01T10:56:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0fbddd770d05762c64b81e9c6443ac8fd487ba15a34ed70b068a69776d355b81
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
OpenClaw の iMessage デプロイでは、サインイン済みの macOS Messages ホスト上で `imsg` を使用します。Gateway が Linux または Windows で実行されている場合は、Mac 上で `imsg` を実行する SSH ラッパーを `channels.imessage.cliPath` に指定してください。

**インバウンド復旧は自動です。** ブリッジまたは Gateway の再起動後、iMessage は停止中に取り逃したメッセージを再生し、Push 復旧後に Apple がフラッシュする可能性のある古い「バックログ爆弾」を抑制し、重複排除によって同じものが二重にディスパッチされないようにします。有効化する設定はありません — [ブリッジまたは Gateway 再起動後のインバウンド復旧](#inbound-recovery-after-a-bridge-or-gateway-restart)を参照してください。
</Note>

<Warning>
BlueBubbles サポートは削除されました。`channels.bluebubbles` 設定を `channels.imessage` に移行してください。OpenClaw は `imsg` 経由の iMessage のみをサポートします。短い告知は [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage)から、完全な移行表は [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles)から始めてください。
</Warning>

ステータス: ネイティブ外部 CLI 統合。Gateway は `imsg rpc` を起動し、stdio 上の JSON-RPC で通信します（別個のデーモン/ポートはありません）。高度なアクションには `imsg launch` と、成功したプライベート API プローブが必要です。

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    返信、タップバック、エフェクト、投票、添付ファイル、グループ管理。
  </Card>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    iMessage DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    Gateway が Messages Mac 上で実行されていない場合は、SSH ラッパーを使用します。
  </Card>
  <Card title="Configuration reference" icon="settings" href="/ja-JP/gateway/config-channels#imessage">
    iMessage フィールドの完全なリファレンス。
  </Card>
</CardGroup>

## クイックセットアップ

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Configure OpenClaw">

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

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        ペアリングリクエストは 1 時間後に期限切れになります。
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
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
    `remoteHost` は `host` または `user@host` でなければなりません（スペースや SSH オプションは不可）。
    OpenClaw は SCP に厳格なホストキー確認を使用するため、リレーホストのキーはすでに `~/.ssh/known_hosts` に存在している必要があります。
    添付ファイルのパスは、許可されたルート（`attachmentRoots` / `remoteAttachmentRoots`）に対して検証されます。

<Warning>
`imsg` の前に置く `cliPath` ラッパーまたは SSH プロキシは、長時間存続する JSON-RPC の透過的な stdio パイプのように動作しなければなりません。OpenClaw は、チャネルの存続期間中、ラッパーの stdin/stdout 経由で小さな改行区切りの JSON-RPC メッセージを交換します。

- 各 stdin チャンク/行は、**バイトが利用可能になり次第**転送します — EOF を待たないでください。
- 各 stdout チャンク/行は、逆方向にすみやかに転送します。
- 改行を保持します。
- 小さなフレームを飢えさせる可能性がある固定サイズのブロッキング読み取り（`read(4096)`、`cat | buffer`、デフォルトのシェル `read`）は避けます。
- stderr は JSON-RPC stdout ストリームから分離したままにします。

大きなブロックが埋まるまで stdin をバッファリングするラッパーは、`imsg rpc` 自体が正常でも、iMessage 障害のように見える症状 — `imsg rpc timeout (chats.list)` やチャネルの繰り返し再起動 — を引き起こします。`ssh -T host imsg "$@"`（上記）は、`rpc` や `--db` などの OpenClaw の `cliPath` 引数を転送するため安全です。`ssh host imsg | grep -v '^DEBUG'` のようなパイプラインは安全ではありません — 行バッファリングされるツールでもフレームを保持することがあります。どうしてもフィルタする必要がある場合は、すべてのステージで `stdbuf -oL -eL` を使用してください。
</Warning>

  </Tab>
</Tabs>

## 要件と権限（macOS）

- `imsg` を実行する Mac で Messages にサインインしている必要があります。
- OpenClaw/`imsg` を実行するプロセスコンテキストには、フルディスクアクセスが必要です（Messages DB へのアクセス）。
- Messages.app 経由でメッセージを送信するには、オートメーション権限が必要です。
- 高度なアクション（リアクション / 編集 / 送信取り消し / スレッド返信 / エフェクト / 投票 / グループ操作）には、System Integrity Protection を無効にする必要があります — 下記の [imsg プライベート API の有効化](#enabling-the-imsg-private-api)を参照してください。基本的なテキストとメディアの送受信は、それなしでも動作します。

<Tip>
権限はプロセスコンテキストごとに付与されます。Gateway をヘッドレス（LaunchAgent/SSH）で実行する場合は、同じコンテキストで一度だけ対話的なコマンドを実行してプロンプトを表示します。

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH wrapper sends fail with AppleEvents -1743">
  リモート SSH セットアップでは、チャットの読み取り、`channels status --probe` の通過、インバウンドメッセージの処理はできても、アウトバウンド送信が AppleEvents 認可エラーで失敗することがあります。

```text
Not authorized to send Apple events to Messages. (-1743)
```

サインインしている Mac ユーザーの TCC データベース、または System Settings > Privacy & Security > Automation を確認してください。Automation エントリが `imsg` やローカルシェルプロセスではなく `/usr/libexec/sshd-keygen-wrapper` として記録されている場合、macOS はその SSH サーバー側クライアントに使用可能な Messages トグルを公開しないことがあります。

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

その状態では、`tccutil reset AppleEvents` を繰り返したり、同じ SSH ラッパー経由で `imsg send` を再実行したりしても、Messages Automation を必要としているプロセスコンテキストが UI で許可できるアプリではなく SSH ラッパーであるため、失敗し続けることがあります。

代わりに、サポートされている `imsg` プロセスコンテキストのいずれかを使用してください。

- Gateway、または少なくとも `imsg` ブリッジを、ログイン済み Messages ユーザーのローカルセッションで実行します。
- 同じセッションからフルディスクアクセスとオートメーションを付与した後、そのユーザーの LaunchAgent で Gateway を起動します。
- 2 ユーザー SSH トポロジを維持する場合は、チャネルを有効にする前に、正確なラッパー経由で実際のアウトバウンド `imsg send` が成功することを確認してください。Automation を付与できない場合は、送信を SSH ラッパーに依存するのではなく、単一ユーザーの `imsg` セットアップに再構成してください。

</Accordion>

## imsg プライベート API の有効化

`imsg` には 2 つの運用モードがあります。

- **基本モード**（デフォルト、SIP の変更不要）: `send` によるアウトバウンドテキストとメディア、インバウンド watch/history、チャット一覧。これは、新しい `brew install steipete/tap/imsg` と上記の標準 macOS 権限で、すぐに利用できるものです。
- **プライベート API モード**: `imsg` はヘルパー dylib を `Messages.app` に注入し、内部 `IMCore` 関数を呼び出します。これにより `react`、`edit`、`unsend`、`reply`（スレッド）、`sendWithEffect`、`poll` と `poll-vote`（ネイティブ Messages 投票）、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup` に加え、入力インジケーターと既読通知が利用可能になります。

このチャネルページで説明している高度なアクションサーフェスに到達するには、プライベート API モードが必要です。`imsg` README はこの要件を明示しています。

> `read`、`typing`、`launch`、ブリッジ支援のリッチ送信、メッセージ変更、チャット管理などの高度な機能はオプトインです。SIP を無効にし、ヘルパー dylib を `Messages.app` に注入する必要があります。SIP が有効な場合、`imsg launch` は注入を拒否します。

ヘルパー注入の手法では、Messages のプライベート API に到達するために `imsg` 自身の dylib を使用します。OpenClaw iMessage パスには、サードパーティサーバーや BlueBubbles ランタイムはありません。

<Warning>
**SIP の無効化には現実的なセキュリティ上のトレードオフがあります。** SIP は変更されたシステムコードの実行に対する macOS の中核的な保護の 1 つです。システム全体で無効にすると、追加の攻撃対象領域と副作用が生じます。特に、**Apple Silicon Mac で SIP を無効にすると、Mac に iOS アプリをインストールして実行する機能も無効になります**。

これはデフォルトではなく、意図的な運用上の選択として扱ってください。脅威モデルが SIP オフを許容できない場合、同梱 iMessage は基本モードに制限されます — テキストとメディアの送受信のみで、リアクション / 編集 / 送信取り消し / エフェクト / グループ操作はありません。
</Warning>

### セットアップ

1. Messages.app を実行する Mac に **`imsg` をインストール（またはアップグレード）**します。

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` の出力は、開始前に現在のビルドが何をサポートしているか確認できるように、`bridge_version`、`rpc_methods`、メソッドごとの `selectors` を報告します。

2. **System Integrity Protection と、（最新の macOS では）Library Validation を無効化します。** Apple 署名済みの `Messages.app` に非 Apple のヘルパー dylib を注入するには、SIP をオフにし、**かつ**ライブラリ検証を緩和する必要があります。Recovery モードでの SIP 手順は macOS バージョン固有です。
   - **macOS 10.13-10.15（Sierra-Catalina）:** Terminal で Library Validation を無効にし、Recovery Mode で再起動し、`csrutil disable` を実行して再起動します。
   - **macOS 11+（Big Sur 以降）、Intel:** Recovery Mode（または Internet Recovery）で `csrutil disable` を実行し、再起動します。
   - **macOS 11+、Apple Silicon:** 電源ボタンの起動手順で Recovery に入ります。最近の macOS バージョンでは Continue をクリックするときに **Left Shift** キーを押し、その後 `csrutil disable` を実行します。仮想マシンセットアップは別のフローに従うため、先に VM スナップショットを取得してください。

   **macOS 11 以降では、通常 `csrutil disable` だけでは不十分です。** Apple は `Messages.app` をプラットフォームバイナリとしてライブラリ検証の対象にし続けるため、SIP がオフでも adhoc 署名のヘルパーは拒否されます（`Library Validation failed: ... platform binary, but mapped file is not`）。SIP を無効にした後、ライブラリ検証も無効にして再起動してください。

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26（Tahoe）、26.5.1 で検証済み:** SIP オフ**に加えて**上記の `DisableLibraryValidation` コマンドで、26.0 から 26.5.x までヘルパーを注入するには十分です。**boot-args は不要です。** plist が決定的な要素であり、Tahoe で注入が失敗する場合に最もよく欠けている手順です。
   - **plist あり:** `imsg launch` が注入し、`imsg status` は `advanced_features: true` を報告します。
   - **plist なし（SIP オフでも）:** `imsg launch` は `Failed to launch: Timeout waiting for Messages.app to initialize` で失敗します。AMFI がロード時に adhoc ヘルパーを拒否するため、ブリッジは準備完了にならず、起動がタイムアウトします。このタイムアウトは Tahoe で多くの人が遭遇する症状であり、修正は上記の plist であって、それ以上に過激なものではありません。

   これは macOS 26.5.1（Apple Silicon）での制御された前後比較で確認されています。plist があると dylib は `Messages.app` にマップされ、ブリッジが起動します。plist を削除して再起動すると、`imsg launch` は上記のタイムアウト失敗を起こし、dylib はマップされません。

   macOS アップグレード後に `imsg launch` の注入や特定の `selectors` が false を返し始めた場合、通常はこのゲートが原因です。SIP 手順自体が失敗したと判断する前に、SIP とライブラリ検証の状態を確認してください。これらの設定が正しく、それでもブリッジが注入できない場合は、追加のシステム全体のセキュリティ制御を弱めるのではなく、`imsg status --json` と `imsg launch` の出力を収集して `imsg` プロジェクトに報告してください。

   `imsg launch` を実行する前に、使用している Mac 向けの Apple のリカバリモード手順に従って SIP を無効化します。

3. **ヘルパーを注入します。** SIP が無効で Messages.app にサインイン済みの状態で、次を実行します。

   ```bash
   imsg launch
   ```

   SIP がまだ有効な場合、`imsg launch` は注入を拒否するため、これは手順 2 が反映されたことの確認も兼ねます。

4. **OpenClaw からブリッジを検証します。**

   ```bash
   openclaw channels status --probe
   ```

   iMessage の項目は `works` を報告し、`imsg status --json | jq '{rpc_methods, selectors}'` は使用している macOS ビルドで公開されている機能を示すはずです。投票作成には `selectors.pollPayloadMessage` が必要です。投票には `selectors.pollVoteMessage` と `poll.vote` RPC メソッドの両方が必要です。OpenClaw プラグインはキャッシュ済みプローブでサポートされるアクションだけを公開します。一方、空のキャッシュは楽観的に扱われ、最初のディスパッチ時にプローブします。

`openclaw channels status --probe` がチャンネルを `works` と報告しているのに、特定のアクションがディスパッチ時に "iMessage `<action>` requires the imsg private API bridge" を投げる場合は、`imsg launch` を再実行してください。ヘルパーが外れることがあり（Messages.app の再起動、OS 更新など）、キャッシュ済みの `available: true` 状態は次のプローブで更新されるまでアクションを公開し続けます。

### SIP を無効化できない場合

SIP 無効化が脅威モデル上許容できない場合:

- `imsg` は基本モードにフォールバックします。テキスト + メディア + 受信のみです。
- OpenClaw プラグインはテキスト/メディア送信と受信監視を引き続き公開します。ただし、メソッド単位の機能ゲートに従って、アクション面から `react`、`edit`、`unsend`、`reply`、`sendWithEffect`、グループ操作を隠します。
- 主要デバイスでは SIP を有効にしたまま、iMessage ワークロード用に SIP を無効化した別の非 Apple Silicon Mac（または専用ボット Mac）を実行できます。以下の [専用ボット macOS ユーザー（別の iMessage ID）](#deployment-patterns) を参照してください。

## アクセス制御とルーティング

<Tabs>
  <Tab title="ダイレクトメッセージポリシー">
    `channels.imessage.dmPolicy` はダイレクトメッセージを制御します。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    許可リストフィールド: `channels.imessage.allowFrom`。

    許可リストエントリは送信者を識別する必要があります。ハンドル、または静的送信者アクセスグループ（`accessGroup:<name>`）です。`chat_id:*`、`chat_guid:*`、`chat_identifier:*` などのチャットターゲットには `channels.imessage.groupAllowFrom` を使用し、数値の `chat_id` レジストリキーには `channels.imessage.groups` を使用します。

  </Tab>

  <Tab title="グループポリシー + メンション">
    `channels.imessage.groupPolicy` はグループ処理を制御します。

    - `allowlist`（設定時のデフォルト）
    - `open`
    - `disabled`

    グループ送信者許可リスト: `channels.imessage.groupAllowFrom`。

    `groupAllowFrom` エントリは静的送信者アクセスグループ（`accessGroup:<name>`）も参照できます。

    ランタイムフォールバック: `groupAllowFrom` が未設定の場合、iMessage グループ送信者チェックは `allowFrom` を使用します。ダイレクトメッセージとグループの許可を分ける必要がある場合は `groupAllowFrom` を設定してください。
    ランタイム注記: `channels.imessage` が完全に欠落している場合、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログに記録します（`channels.defaults.groupPolicy` が設定されていても同様です）。

    <Warning>
    グループルーティングには、連続して実行される **2 つ** の許可リストゲートがあり、両方に合格する必要があります。

    1. **送信者 / チャットターゲット許可リスト**（`channels.imessage.groupAllowFrom`）— ハンドル、`chat_guid`、`chat_identifier`、または `chat_id`。
    2. **グループレジストリ**（`channels.imessage.groups`）— `groupPolicy: "allowlist"` の場合、このゲートには `groups: { "*": { ... } }` ワイルドカードエントリ（`allowAll = true` を設定）か、`groups` 配下の明示的な `chat_id` ごとのエントリのいずれかが必要です。

    ゲート 2 に何もない場合、すべてのグループメッセージが破棄されます。プラグインはデフォルトのログレベルで 2 つの `warn` レベルシグナルを出力します。

    - 起動時にアカウントごとに 1 回: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - ランタイム時に `chat_id` ごとに 1 回: `imessage: dropping group message from chat_id=<id> ...`

    ダイレクトメッセージは別のコードパスを通るため、引き続き機能します。

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

    これらの `warn` 行が Gateway ログに表示される場合、ゲート 2 が破棄しています。`groups` ブロックを追加してください。
    </Warning>

    グループのメンションゲート:

    - iMessage にはネイティブのメンションメタデータがありません
    - メンション検出は正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバック `messages.groupChat.mentionPatterns`）を使用します
    - パターンが設定されていない場合、メンションゲートは強制できません

    認可済み送信者からの制御コマンドは、グループ内のメンションゲートをバイパスできます。

    グループごとの `systemPrompt`:

    `channels.imessage.groups.*` 配下の各エントリは、任意の `systemPrompt` 文字列を受け付けます。この値は、そのグループ内のメッセージを処理するすべてのターンでエージェントのシステムプロンプトに注入されます。解決は `channels.whatsapp.groups` で使用されるグループごとのプロンプト解決を反映します。

    1. **グループ固有のシステムプロンプト**（`groups["<chat_id>"].systemPrompt`）: 特定のグループエントリがマップ内に存在し、かつその `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、そのグループにはシステムプロンプトが適用されません。
    2. **グループワイルドカードのシステムプロンプト**（`groups["*"].systemPrompt`）: 特定のグループエントリがマップ内にまったく存在しない場合、または存在するが `systemPrompt` キーを定義していない場合に使用されます。

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
    - ダイレクトメッセージは直接ルーティングを使用します。グループはグループルーティングを使用します。
    - デフォルトの `session.dmScope=main` では、iMessage のダイレクトメッセージはエージェントのメインセッションに集約されます。
    - グループセッションは分離されます（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 返信は、発信元のチャンネル/ターゲットメタデータを使用して iMessage にルーティングされます。

    グループ風スレッドの挙動:

    一部の複数参加者 iMessage スレッドは `is_group=false` で到着することがあります。
    その `chat_id` が `channels.imessage.groups` 配下で明示的に設定されている場合、OpenClaw はそれをグループトラフィックとして扱います（グループゲート + グループセッション分離）。

  </Tab>
</Tabs>

## ACP 会話バインディング

従来の iMessage チャットも ACP セッションにバインドできます。

高速なオペレーターフロー:

- ダイレクトメッセージまたは許可済みグループチャット内で `/acp spawn codex --bind here` を実行します。
- 同じ iMessage 会話内の以後のメッセージは、生成された ACP セッションにルーティングされます。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

設定済みの永続バインディングは、トップレベルの `bindings[]` エントリで `type: "acp"` と `match.channel: "imessage"` を使用してサポートされます。

`match.peer.id` には次を使用できます。

- `+15555550123` や `user@example.com` などの正規化済みダイレクトメッセージハンドル
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

共有 ACP バインディングの挙動については、[ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用ボット macOS ユーザー（別の iMessage ID）">
    専用の Apple ID と macOS ユーザーを使用して、ボットのトラフィックを個人の Messages プロファイルから分離します。

    一般的なフロー:

    1. 専用の macOS ユーザーを作成/サインインします。
    2. そのユーザーで、ボット用 Apple ID を使って Messages にサインインします。
    3. そのユーザーに `imsg` をインストールします。
    4. OpenClaw がそのユーザーコンテキストで `imsg` を実行できるように SSH ラッパーを作成します。
    5. `channels.imessage.accounts.<id>.cliPath` と `.dbPath` をそのユーザープロファイルに向けます。

    初回実行時は、そのボットユーザーセッションで GUI 承認（Automation + Full Disk Access）が必要になる場合があります。

  </Accordion>

  <Accordion title="Tailscale 経由のリモート Mac（例）">
    一般的なトポロジー:

    - gateway は Linux/VM で実行されます
    - iMessage + `imsg` は tailnet 内の Mac で実行されます
    - `cliPath` ラッパーは SSH を使用して `imsg` を実行します
    - `remoteHost` は SCP 添付ファイル取得を有効にします

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

    SSH と SCP の両方が非対話になるように SSH キーを使用します。
    先にホストキーが信頼済みであることを確認し（たとえば `ssh bot@mac-mini.tailnet-1234.ts.net`）、`known_hosts` が入力されるようにします。

  </Accordion>

  <Accordion title="複数アカウントパターン">
    iMessage は `channels.imessage.accounts` 配下でアカウントごとの設定をサポートします。

    各アカウントは、`cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、履歴設定、添付ファイルルート許可リストなどのフィールドを上書きできます。

  </Accordion>

  <Accordion title="ダイレクトメッセージ履歴">
    `channels.imessage.dmHistoryLimit` を設定すると、その会話の最近のデコード済み `imsg` 履歴で新しいダイレクトメッセージセッションをシードします。送信者ごとの上書きには `channels.imessage.dms["<sender>"].historyLimit` を使用します。送信者の履歴を無効化するには `0` を指定します。

    iMessage のダイレクトメッセージ履歴は、必要に応じて `imsg` から取得されます。`dmHistoryLimit` を未設定のままにすると、グローバルなダイレクトメッセージ履歴シードは無効になりますが、送信者ごとの `channels.imessage.dms["<sender>"].historyLimit` が正の値であれば、その送信者のシードは引き続き有効になります。

  </Accordion>
</AccordionGroup>

## メディア、チャンク化、配信ターゲット

<AccordionGroup>
  <Accordion title="添付ファイルとメディア">
    - 受信添付ファイルの取り込みは**デフォルトでオフ**です — 写真、ボイスメモ、動画、その他の添付ファイルをエージェントへ転送するには、`channels.imessage.includeAttachments: true` を設定します。無効な場合、添付ファイルのみの iMessages はエージェントへ届く前に破棄され、`Inbound message` ログ行がまったく出ないことがあります。
    - `remoteHost` が設定されている場合、リモート添付ファイルパスは SCP 経由で取得できます
    - 添付ファイルパスは許可されたルートと一致する必要があります:
      - `channels.imessage.attachmentRoots` (ローカル)
      - `channels.imessage.remoteAttachmentRoots` (リモート SCP モード)
      - デフォルトのルートパターン: `/Users/*/Library/Messages/Attachments`
    - SCP は厳密なホストキー確認 (`StrictHostKeyChecking=yes`) を使用します
    - 送信メディアサイズは `channels.imessage.mediaMaxMb` を使用します (デフォルト 16 MB)

  </Accordion>

  <Accordion title="送信チャンク分割">
    - テキストチャンク上限: `channels.imessage.textChunkLimit` (デフォルト 4000)
    - チャンクモード: `channels.imessage.chunkMode`
      - `length` (デフォルト)
      - `newline` (段落優先分割)

  </Accordion>

  <Accordion title="アドレス指定形式">
    推奨される明示的な宛先:

    - `chat_id:123` (安定したルーティングに推奨)
    - `chat_guid:...`
    - `chat_identifier:...`

    ハンドル宛先もサポートされています:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Private API アクション

`imsg launch` が実行中で、`openclaw channels status --probe` が `privateApi.available: true` を報告している場合、メッセージツールは通常のテキスト送信に加えて iMessage ネイティブのアクションを使用できます。

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
        polls: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="利用可能なアクション">
    - **react**: iMessage タップバックを追加/削除します (`messageId`, `emoji`, `remove`)。サポートされるタップバックは love、like、dislike、laugh、emphasize、question にマップされます。
    - **reply**: 既存メッセージへのスレッド返信を送信します (`messageId`, `text` または `message`、および `chatGuid`、`chatId`、`chatIdentifier`、または `to`)。
    - **sendWithEffect**: iMessage エフェクト付きでテキストを送信します (`text` または `message`、`effect` または `effectId`)。
    - **edit**: サポートされる macOS/private API バージョンで送信済みメッセージを編集します (`messageId`, `text` または `newText`)。
    - **unsend**: サポートされる macOS/private API バージョンで送信済みメッセージを取り消します (`messageId`)。
    - **upload-file**: メディア/ファイルを送信します (base64 の `buffer`、またはハイドレート済みの `media`/`path`/`filePath`、`filename`、任意の `asVoice`)。レガシーエイリアス: `sendAttachment`。
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: 現在の宛先がグループ会話の場合にグループチャットを管理します。
    - **poll**: ネイティブ Apple Messages 投票を作成します (`pollQuestion`、2 から 12 回繰り返す `pollOption`、および `chatGuid`、`chatId`、`chatIdentifier`、または `to`)。iOS/iPadOS/macOS 26+ の受信者はネイティブに表示して投票できます。古い OS バージョンでは「投票を送信しました」というテキストフォールバックを受け取ります。`selectors.pollPayloadMessage` が必要です。
    - **poll-vote**: 既存の投票に投票します (`pollId` または `messageId`、および `pollOptionIndex`、`pollOptionId`、`pollOptionText` のうち正確に 1 つ)。`selectors.pollVoteMessage` と `poll.vote` RPC メソッドが必要です。

    受け付けられた受信投票は、質問、番号付きの選択肢ラベル、投票数、および `poll-vote` に必要な投票メッセージ ID とともにエージェント向けにレンダリングされます。

  </Accordion>

  <Accordion title="メッセージ ID">
    受信 iMessage コンテキストには、利用可能な場合、短い `MessageSid` 値と完全なメッセージ GUID の両方が含まれます。短い ID は最近の SQLite ベースの返信キャッシュにスコープされ、使用前に現在のチャットと照合されます。短い ID が期限切れになっているか別のチャットに属している場合は、完全な `MessageSidFull` で再試行してください。

  </Accordion>

  <Accordion title="機能検出">
    OpenClaw は、キャッシュされたプローブステータスがブリッジを利用不可と示す場合にのみ private API アクションを非表示にします。ステータスが不明な場合、アクションは表示されたままで、ディスパッチ時に遅延プローブを行うため、`imsg launch` 後に別途手動でステータスを更新しなくても最初のアクションが成功できます。

  </Accordion>

  <Accordion title="開封確認と入力中表示">
    private API ブリッジが起動している場合、受け付けられた受信チャットは既読としてマークされ、ダイレクトチャットではターンが受け付けられるとすぐに、エージェントがコンテキストを準備して生成している間、入力中バブルが表示されます。既読マークを無効にするには:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    メソッド別機能リストより前の古い `imsg` ビルドでは、入力中/既読がサイレントにゲートオフされます。OpenClaw は、受領確認がない理由を追跡できるよう、再起動ごとに 1 回だけ警告をログに記録します。

  </Accordion>

  <Accordion title="受信タップバック">
    OpenClaw は iMessage タップバックを購読し、受け付けられたリアクションを通常のメッセージテキストではなくシステムイベントとしてルーティングするため、ユーザーのタップバックが通常の返信ループをトリガーすることはありません。

    通知モードは `channels.imessage.reactionNotifications` で制御されます:

    - `"own"` (デフォルト): ユーザーが bot 作成メッセージにリアクションした場合のみ通知します。
    - `"all"`: 許可済み送信者からのすべての受信タップバックを通知します。
    - `"off"`: 受信タップバックを無視します。

    アカウント別のオーバーライドは `channels.imessage.accounts.<id>.reactionNotifications` を使用します。

  </Accordion>

  <Accordion title="承認リアクション (👍 / 👎)">
    `approvals.exec.enabled` または `approvals.plugin.enabled` が true で、リクエストが iMessage にルーティングされる場合、gateway は承認プロンプトをネイティブに配信し、タップバックを受け付けて解決します:

    - `👍` (Like タップバック) → `allow-once`
    - `👎` (Dislike タップバック) → `deny`
    - `allow-always` は手動フォールバックのままです: 通常の返信として `/approve <id> allow-always` を送信します。

    リアクション処理には、リアクションしたユーザーのハンドルが明示的な承認者である必要があります。承認者リストは `channels.imessage.allowFrom` (または `channels.imessage.accounts.<id>.allowFrom`) から読み取られます。ユーザーの電話番号を E.164 形式で追加するか、Apple ID メールアドレスを追加してください。ワイルドカードエントリ `"*"` は尊重されますが、任意の送信者に承認を許可します。リアクションショートカットは、`reactionNotifications`、`dmPolicy`、`groupAllowFrom` を意図的にバイパスします。承認解決で重要な唯一のゲートは、明示的な承認者許可リストだからです。

    **このリリースでの挙動変更:** `channels.imessage.allowFrom` が空でない場合、`/approve <id> <decision>` テキストコマンドは、より広い DM 許可リストではなく、その承認者リストに照らして認可されるようになりました。DM 許可リストでは許可されていても `allowFrom` に含まれていない送信者は、明示的な拒否を受け取ります。以前の挙動を維持するには、`/approve` 経由 (およびリアクション経由) で承認できる必要があるすべてのオペレーターを `allowFrom` に追加してください。`allowFrom` が空の場合、レガシーの「同一チャットフォールバック」は有効なままで、`/approve` は DM 許可リストで許可される全員を引き続き認可します。

    オペレーター向けメモ:
    - リアクションバインディングはメモリ内 (承認の有効期限に合わせた TTL 付き) と gateway の永続キー付きストアの両方に保存されるため、gateway 再起動直後に届いたタップバックでも承認を解決できます。
    - クロスデバイスの `is_from_me=true` タップバック (ペアリングされた Apple デバイス上のオペレーター自身のリアクション) は、bot が自己承認できないように意図的に無視されます。
    - レガシーのテキスト形式タップバック (非常に古い Apple クライアントからの `Liked "…"` プレーンテキスト) は、メッセージ GUID を含まないため承認を解決できません。リアクション解決には、現在の macOS / iOS クライアントが出力する構造化されたタップバックメタデータが必要です。

  </Accordion>
</AccordionGroup>

## 設定書き込み

iMessage はデフォルトでチャネル起点の設定書き込みを許可します (`commands.config: true` の場合の `/config set|unset`)。

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

## 分割送信された DM の合体 (1 回の入力にコマンド + URL)

ユーザーがコマンドと URL を一緒に入力した場合 — 例: `Dump https://example.com/article` — Apple の Messages アプリは送信を**2 つの別々の `chat.db` 行**に分割します:

1. テキストメッセージ (`"Dump"`)。
2. 添付ファイルとして OG プレビュー画像を含む URL プレビューバルーン (`"https://..."`)。

ほとんどの環境では、この 2 行は約 0.8-2.0 秒離れて OpenClaw に到着します。合体しない場合、エージェントはターン 1 でコマンドだけを受け取り、(多くの場合「URL を送ってください」と) 返信し、ターン 2 でようやく URL を見ます。その時点ではコマンドのコンテキストはすでに失われています。これは Apple の送信パイプラインであり、OpenClaw や `imsg` が導入しているものではありません。

`channels.imessage.coalesceSameSenderDms` は、DM で同一送信者の連続行をバッファリングするようオプトインします。`imsg` がソース行の 1 つに構造的な URL プレビューマーカー `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` を公開している場合、OpenClaw はその実際の分割送信のみをマージし、他のバッファ済み行は別々のターンとして保持します。バルーンメタデータをまったく出力しない古い `imsg` ビルドでは、OpenClaw は分割送信と別々の送信を判別できないため、バケットのマージにフォールバックします。これにより、`Dump <url>` の分割送信が 2 ターンに退行するのではなく、メタデータ導入前の挙動が維持されます。グループチャットは、複数ユーザーのターン構造を保つため、引き続きメッセージ単位でディスパッチされます。

<Tabs>
  <Tab title="有効化する場合">
    次の場合に有効化します:

    - 1 つのメッセージ内の `command + payload` を期待するスキル (dump、paste、save、queue など) を提供している。
    - ユーザーがコマンドと一緒に URL を貼り付ける。
    - 追加される DM ターン遅延を許容できる (下記参照)。

    次の場合は無効のままにします:

    - 単語 1 つの DM トリガーで最小のコマンド遅延が必要。
    - すべてのフローが、ペイロードの後続入力を伴わない単発コマンドである。

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

    フラグがオンで、明示的な `messages.inbound.byChannel.imessage` またはグローバルな `messages.inbound.debounceMs` がない場合、デバウンスウィンドウは **7000 ms** に広がります (レガシーのデフォルトは 0 ms — デバウンスなし)。Apple の URL プレビュー分割送信の間隔は、Messages.app がプレビュー行を出力する間に数秒まで伸びることがあるため、より広いウィンドウが必要です。

    ウィンドウを自分で調整するには:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="トレードオフ">
    - **正確なマージには現在の `imsg` ペイロードメタデータが必要。** URL 行に `balloon_bundle_id` が含まれる場合、その実際の分割送信だけがマージされ、他のバッファ済み行は分離されたままになる。balloon メタデータを公開しない古い `imsg` ビルドでは、OpenClaw はバッファ済みバケットのマージにフォールバックするため、`Dump <url>` の分割送信が 2 つのターンに退行しない（暫定的な後方互換。`imsg` が upstream で分割送信を合体できるようになったら削除）。
    - **DM メッセージに遅延が追加される。** フラグがオンの場合、すべての DM（単独の制御コマンドや単一テキストのフォローアップを含む）は、URL プレビュー行が来る可能性に備えて、ディスパッチ前に最大 debounce window まで待機する。グループチャットメッセージは即時ディスパッチを維持する。
    - **マージされた出力には上限がある。** マージされたテキストは明示的な `…[truncated]` マーカー付きで 4000 文字まで、添付ファイルは 20 個まで、ソースエントリは 10 個まで（それを超える場合は最初と最新を保持）。すべてのソース GUID は downstream telemetry 用に `coalescedMessageGuids` で追跡される。
    - **DM のみ。** 複数人が入力しているときも bot の応答性を保つため、グループチャットはメッセージ単位のディスパッチにフォールスルーする。
    - **オプトイン、チャンネル単位。** 他のチャンネル（Telegram、WhatsApp、Slack、…）には影響しない。`channels.bluebubbles.coalesceSameSenderDms` を設定しているレガシー BlueBubbles 設定は、その値を `channels.imessage.coalesceSameSenderDms` に移行する必要がある。

  </Tab>
</Tabs>

### シナリオと agent が見るもの

「フラグオン」列は、`balloon_bundle_id` を emit する `imsg` ビルドでの挙動を示す。balloon メタデータをまったく emit しない古い `imsg` ビルドでは、下で「2 ターン」/「N ターン」と示された行は代わりにレガシーマージ（1 ターン）にフォールバックする。OpenClaw は分割送信と別々の送信を構造的に判別できないため、メタデータ導入前のマージを維持する。ビルドが balloon メタデータを emit するようになると、正確な分離が有効になる。

| ユーザーの作成内容                                                   | `chat.db` の生成内容                  | フラグオフ（デフォルト）                     | フラグオン + window（imsg が balloon メタデータを emit）                                            |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com`（1 回の送信）                              | 約 1 秒差の 2 行                     | 2 つの agent ターン：「Dump」のみ、その後 URL | 1 ターン：マージされたテキスト `Dump https://example.com`                                           |
| `Save this 📎image.jpg caption`（添付ファイル + テキスト）                | URL balloon メタデータなしの 2 行 | 2 ターン                               | メタデータ観測後は 2 ターン。古い/ラッチ前のメタデータなしセッションでは 1 つのマージ済みターン       |
| `/status`（単独コマンド）                                     | 1 行                               | 即時ディスパッチ                        | **最大 window まで待機し、その後ディスパッチ**                                                                |
| URL のみ貼り付け                                                   | 1 行                               | 即時ディスパッチ                        | 最大 window まで待機し、その後ディスパッチ                                                                    |
| テキスト + URL を意図的に 2 つの別メッセージとして数分空けて送信 | window 外の 2 行               | 2 ターン                               | 2 ターン（その間に window が期限切れになる）                                                             |
| 急速な大量送信（window 内に 10 件超の短い DM）                          | URL balloon メタデータなしの N 行 | N ターン                                 | メタデータ観測後は N ターン。古い/ラッチ前のメタデータなしセッションでは上限付きの 1 つのマージ済みターン |
| グループチャットで 2 人が入力                                  | M 送信者からの N 行               | M+ ターン（送信者バケットごとに 1 つ）        | M+ ターン — グループチャットは合体されない                                                            |

## bridge または Gateway 再起動後の inbound recovery

iMessage は Gateway 停止中に見逃したメッセージを復旧し、同時に Push recovery 後に Apple が吐き出す可能性のある古い「backlog bomb」を抑制する。デフォルトの挙動は常にオンで、inbound dedupe の上に構築されている。

- **Replay dedupe。** ディスパッチされたすべての inbound メッセージは、Apple GUID によって永続 Plugin 状態（`imessage.inbound-dedupe`）に記録され、ingestion 時に claim され、処理後に commit される（一時的な失敗時は再試行できるよう release される）。すでに処理済みのものは、2 回ディスパッチされる代わりに破棄される。これにより、メッセージ単位の bookkeeping なしで recovery replay を積極的に実行できる。
- **Downtime recovery。** 起動時に monitor は最後にディスパッチされた `chat.db` rowid（永続化されたアカウント単位の cursor）を記憶し、それを `since_rowid` として `imsg watch.subscribe` に渡す。これにより、imsg は Gateway 停止中に到着した行を replay し、その後 live を tail する。Replay は最新行と約 2 時間前までのメッセージに制限され、dedupe はすでに処理済みのものを破棄する。
- **古い backlog の age fence。** 起動境界より上の行は本当に live である。送信日時が到着より約 15 分以上古い行は Push-flush backlog として抑制される。Replay された行（境界以下）は代わりにより広い recovery window を使うため、最近見逃したメッセージは配信され、古い履歴は配信されない。

Recovery は local と remote の両方の `cliPath` セットアップで機能する。`since_rowid` replay は同じ `imsg` RPC 接続上で動くためである。違いは window にある。Gateway が `chat.db` を読める場合（local）、起動 rowid 境界を anchor し、replay span を制限し、最大で数時間前までの見逃したメッセージを配信する。remote SSH `cliPath` 越しではデータベースを読めないため、replay は無制限になり、すべての行が live age fence を使う。それでも最近見逃したメッセージは復旧し、古い backlog も抑制するが、より狭い live window になる。より広い recovery window が必要な場合は、Messages Mac 上で Gateway を実行する。

### operator から見えるシグナル

抑制された backlog はデフォルトレベルでログに記録され、黙って破棄されることはない（`recovery` フラグは適用された window を示す）。

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### 移行

`channels.imessage.catchup.*` は非推奨である。downtime recovery は現在自動であり、新しいセットアップでは設定を必要としない。`catchup.enabled: true` を含む既存設定は、recovery replay window の互換プロファイルとして引き続き尊重される。無効化された catchup ブロック（`enabled: false` または `enabled: true` なし）は廃止され、`openclaw doctor --fix` がそれらを削除する。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="imsg が見つからない、または RPC がサポートされていない">
    バイナリと RPC サポートを検証する。

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    probe が RPC unsupported を報告する場合は、`imsg` を更新する。private API actions が利用できない場合は、ログイン中の macOS ユーザーセッションで `imsg launch` を実行してから、もう一度 probe する。Gateway が macOS 上で動作していない場合は、デフォルトの local `imsg` パスではなく、上記の Remote Mac over SSH セットアップを使用する。

  </Accordion>

  <Accordion title="Messages は送信できるが inbound iMessages が届かない">
    まず、メッセージが local Mac に到達したかを確認する。`chat.db` が変化しない場合、`imsg status --json` が正常な bridge を報告していても OpenClaw はメッセージを受信できない。

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    phone から送信したメッセージで新しい行が作成されない場合は、OpenClaw 設定を変更する前に macOS Messages と Apple Push レイヤーを修復する。多くの場合、1 回限りの service refresh で十分である。

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    OpenClaw セッションをデバッグする前に、phone から新しい iMessage を送信し、新しい `chat.db` 行または `imsg watch` event を確認する。これを定期的な bridge relaunch loop として実行してはならない。アクティブな作業中に `imsg launch` と Gateway 再起動を繰り返すと、配信が中断され、進行中の channel run が取り残される可能性がある。

  </Accordion>

  <Accordion title="Gateway が macOS 上で動作していない">
    デフォルトの `cliPath: "imsg"` は、Messages にサインインしている Mac 上で実行する必要がある。Linux または Windows では、`channels.imessage.cliPath` を、その Mac に SSH して `imsg "$@"` を実行する wrapper script に設定する。

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    その後、次を実行する。

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DM が無視される">
    次を確認する。

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - pairing approvals（`openclaw pairing list imessage`）

  </Accordion>

  <Accordion title="グループメッセージが無視される">
    次を確認する。

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` allowlist behavior
    - mention pattern configuration（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="remote attachments が失敗する">
    次を確認する。

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - Gateway ホストからの SSH/SCP key auth
    - Gateway ホスト上の `~/.ssh/known_hosts` に host key が存在すること
    - Messages を実行している Mac 上で remote path が読み取り可能であること

  </Accordion>

  <Accordion title="macOS permission prompts を見逃した">
    同じ user/session context の interactive GUI terminal で再実行し、prompts を承認する。

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    OpenClaw/`imsg` を実行する process context に Full Disk Access + Automation が付与されていることを確認する。

  </Accordion>
</AccordionGroup>

## 設定リファレンスへのポインター

- [設定リファレンス - iMessage](/ja-JP/gateway/config-channels#imessage)
- [Gateway 設定](/ja-JP/gateway/configuration)
- [ペアリング](/ja-JP/channels/pairing)

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage) — 告知と移行の概要
- [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles) — 設定変換表と段階的な切り替え
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの挙動と mention gating
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと hardening
