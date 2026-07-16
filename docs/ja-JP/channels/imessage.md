---
read_when:
    - iMessage サポートの設定
    - iMessage の送受信のデバッグ
summary: imsg（stdio 経由の JSON-RPC）によるネイティブ iMessage サポート。返信、Tapback、エフェクト、投票、添付ファイル、グループ管理のためのプライベート API アクションに対応しています。ホスト要件を満たす場合、新しい OpenClaw iMessage セットアップに推奨されます。
title: iMessage
x-i18n:
    generated_at: "2026-07-16T11:21:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 78b7ff7621e66e3b0122b5581c097140b7f62998b78981741bd3edbc0e1608bd
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
通常の OpenClaw iMessage デプロイでは、Gateway と `imsg` を、同じサインイン済み macOS Messages ホスト上で実行します。Gateway を別の場所で実行する場合は、Mac 上で `imsg` を実行する透過的な SSH ラッパーを `channels.imessage.cliPath` に指定します。

**受信の復旧は自動です。** ブリッジまたは Gateway の再起動後、iMessage は停止中に受信できなかったメッセージを再生し、Push 復旧後に Apple が一括送信することのある古い「バックログ爆弾」を抑制します。また、重複排除によって同じ内容が二重にディスパッチされることを防ぎます。有効化するための設定はありません。詳しくは、[ブリッジまたは Gateway の再起動後の受信復旧](#inbound-recovery-after-a-bridge-or-gateway-restart)を参照してください。
</Note>

<Warning>
BlueBubbles のサポートは削除されました。`channels.bluebubbles` の設定を `channels.imessage` に移行してください。OpenClaw が iMessage をサポートするのは `imsg` 経由のみです。短い告知については、まず [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage)を、完全な移行表については [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles)を参照してください。
</Warning>

ステータス：ネイティブ外部 CLI 統合。Gateway は `imsg rpc` を起動し、標準入出力を介して JSON-RPC で通信します。別個のデーモンやポートはありません。完全な iMessage チャネルを利用するには、Private API モードを強く推奨します。返信、Tapback、エフェクト、投票、添付ファイルへの返信、グループ操作には、`imsg launch` と Private API のプローブ成功が必要です。

一般的なローカルセットアップでは、OpenClaw のセットアップにより、サインイン済みの Messages Mac 上で `imsg` を Homebrew を介してインストールまたは更新することを、ユーザー確認のうえで提案できます。手動セットアップと SSH ラッパー構成は、引き続きオペレーターが管理します。Gateway またはラッパーを実行するユーザーと同じコンテキストで、`imsg` をインストールまたは更新してください。

<CardGroup cols={3}>
  <Card title="Private API の操作" icon="wand-sparkles" href="#private-api-actions">
    返信、Tapback、エフェクト、投票、添付ファイル、グループ管理。
  </Card>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    iMessage の DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="リモート Mac" icon="terminal" href="#remote-mac-over-ssh">
    Gateway が Messages Mac 上で実行されていない場合は、SSH ラッパーを使用します。
  </Card>
  <Card title="設定リファレンス" icon="settings" href="/ja-JP/gateway/config-channels#imessage">
    iMessage の全フィールドのリファレンス。
  </Card>
</CardGroup>

## クイックセットアップ

<Tabs>
  <Tab title="ローカル Mac（高速パス）">
    <Steps>
      <Step title="imsg のインストールと確認">

```bash
brew install steipete/tap/imsg
brew update && brew upgrade imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

        ローカルセットアップウィザードがデフォルトの `imsg` コマンドがないことを検出すると、Homebrew を介した `steipete/tap/imsg` のインストールを求めることができます。Homebrew で管理されている `imsg` を検出すると、再インストールまたは更新を求めることができます。カスタムの `cliPath` ラッパーは変更されません。

      </Step>

      <Step title="OpenClaw の設定">

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

      <Step title="Gateway の起動">

```bash
openclaw gateway
```

      </Step>

      <Step title="最初の DM ペアリングを承認（デフォルトの dmPolicy）">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        ペアリングリクエストは 1 時間後に期限切れになります。
      </Step>
    </Steps>

  </Tab>

  <Tab title="SSH 経由のリモート Mac">
    ほとんどのセットアップでは SSH は不要です。この構成は、サインイン済みの Messages Mac 上で Gateway を実行できない場合にのみ使用してください。OpenClaw に必要なのは標準入出力互換の `cliPath` だけなので、リモート Mac に SSH 接続して `imsg` を実行するラッパースクリプトを `cliPath` に指定できます。
    `imsg` は Gateway ホストではなく、そのリモート Mac 上でインストールおよび更新してください。

```bash
ssh messages-mac 'brew install steipete/tap/imsg && brew update && brew upgrade imsg'
```

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    添付ファイルを有効にする場合の推奨設定：

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // SCP による添付ファイル取得に使用
      includeAttachments: true,
      // 任意：追加で許可する添付ファイルのルート（デフォルトの
      // /Users/*/Library/Messages/Attachments と統合）。
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    `remoteHost` が設定されていない場合、OpenClaw は SSH ラッパースクリプトを解析して自動検出を試みます。
    `remoteHost` は `host` または `user@host` でなければなりません（スペースや SSH オプションは使用不可）。安全でない値は無視されます。
    OpenClaw は SCP で厳格なホストキー確認を使用するため、リレーホストのキーが `~/.ssh/known_hosts` にすでに存在している必要があります。
    添付ファイルのパスは、許可されたルート（`attachmentRoots` / `remoteAttachmentRoots`）に対して検証されます。

<Warning>
`imsg` の前段に配置する `cliPath` ラッパーまたは SSH プロキシは、長時間接続される JSON-RPC に対して透過的な標準入出力パイプとして動作しなければなりません。OpenClaw はチャネルの存続中、ラッパーの標準入力と標準出力を介して、改行でフレーム化された小さな JSON-RPC メッセージを交換します。

- バイトが利用可能になり次第、標準入力の各チャンクまたは行を**直ちに**転送してください。EOF を待ってはいけません。
- 逆方向でも、標準出力の各チャンクまたは行を速やかに転送してください。
- 改行を保持してください。
- 小さなフレームを滞留させる可能性がある、固定サイズのブロッキング読み取り（`read(4096)`、`cat | buffer`、シェルのデフォルトの `read`）は避けてください。
- 標準エラー出力を JSON-RPC の標準出力ストリームから分離してください。

大きなブロックが埋まるまで標準入力をバッファリングするラッパーでは、`imsg rpc` 自体が正常であっても、iMessage の障害のように見える症状、つまり `imsg rpc timeout (chats.list)` やチャネルの繰り返し再起動が発生します。（上記の）`ssh -T host imsg "$@"` は、`rpc` や `--db` などの OpenClaw の `cliPath` 引数を転送するため安全です。`ssh host imsg | grep -v '^DEBUG'` のようなパイプラインは安全ではありません。行バッファリングされたツールでもフレームを保持することがあるため、フィルタリングが必要な場合は各ステージで `stdbuf -oL -eL` を使用してください。
</Warning>

  </Tab>
</Tabs>

## 要件と権限（macOS）

- `imsg` を実行する Mac で Messages にサインインしている必要があります。
- OpenClaw/`imsg` を実行するプロセスコンテキストには、フルディスクアクセスが必要です（Messages データベースへのアクセス）。
- Messages.app を介してメッセージを送信するには、Automation 権限が必要です。
- 高度な操作（リアクション／編集／送信取り消し／スレッド返信／エフェクト／投票／グループ操作）には、システム整合性保護を無効にする必要があります。詳しくは、[imsg Private API の有効化](#enabling-the-imsg-private-api)を参照してください。基本的なテキストおよびメディアの送受信は、無効にしなくても機能します。

<Tip>
権限はプロセスコンテキストごとに付与されます。Gateway をヘッドレス（LaunchAgent/SSH）で実行する場合は、同じコンテキストで一度だけ対話型コマンドを実行し、プロンプトを表示させてください。

```bash
imsg chats --limit 1
# または
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH ラッパーの送信が AppleEvents -1743 で失敗する">
  リモート SSH セットアップでは、チャットの読み取り、`channels status --probe` の通過、受信メッセージの処理には成功しても、送信時に AppleEvents の認証エラーが発生することがあります。

```text
Messages に Apple Events を送信する権限がありません。（-1743）
```

サインイン済み Mac ユーザーの TCC データベース、または System Settings > Privacy & Security > Automation を確認してください。Automation のエントリが `imsg` やローカルシェルプロセスではなく `/usr/libexec/sshd-keygen-wrapper` に記録されている場合、macOS では、その SSH サーバー側クライアントに使用可能な Messages の切り替え項目が表示されないことがあります。

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

この状態では、Messages の Automation を必要とするプロセスコンテキストが UI から権限を付与できるアプリではなく SSH ラッパーであるため、`tccutil reset AppleEvents` を繰り返したり、同じ SSH ラッパーを介して `imsg send` を再実行したりしても、失敗し続ける可能性があります。

代わりに、サポートされている次のいずれかの `imsg` プロセスコンテキストを使用してください。

- Gateway、または少なくとも `imsg` ブリッジを、ログイン済み Messages ユーザーのローカルセッションで実行します。
- 同じセッションからフルディスクアクセスと Automation を付与した後、そのユーザーの LaunchAgent で Gateway を起動します。
- 2 ユーザー構成の SSH トポロジーを維持する場合は、チャネルを有効にする前に、実際の送信 `imsg send` がそのラッパーを介して成功することを確認してください。Automation を付与できない場合は、送信を SSH ラッパーに依存させず、単一ユーザーの `imsg` セットアップに再構成してください。

</Accordion>

## imsg Private API の有効化

`imsg` には 2 つの動作モードがあります。OpenClaw では、ユーザーが期待するネイティブ iMessage 操作をチャネルで利用できるため、Private API モードが推奨セットアップです。基本モードは、低リスクのインストール、初期確認、または SIP を無効にできないホストで引き続き有用です。

- **基本モード**（デフォルト。SIP の変更は不要）：`send` を介したテキストとメディアの送信、受信の監視／履歴、チャット一覧。新規インストールした `brew install steipete/tap/imsg` と、前述の標準的な macOS 権限だけで利用できます。
- **Private API モード**：`imsg` は `Messages.app` にヘルパー dylib を注入し、内部の `IMCore` 関数を呼び出します。これにより、`react`、`edit`、`unsend`、`reply`（スレッド形式）、`sendWithEffect`、`poll` と `poll-vote`（Messages ネイティブの投票）、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup` に加え、入力中インジケーターと既読通知が利用可能になります。

このページで推奨する操作機能には、Private API モードが必要です。`imsg` の README には、この要件が明記されています。

> `read`、`typing`、`launch`、ブリッジを利用するリッチ送信、メッセージの変更、チャット管理などの高度な機能はオプトインです。これらを利用するには、SIP を無効にし、ヘルパー dylib を `Messages.app` に注入する必要があります。SIP が有効な場合、`imsg launch` は注入を拒否します。

このヘルパー注入手法では、`imsg` 独自の dylib を使用して Messages の Private API にアクセスします。OpenClaw の iMessage パスには、サードパーティー製サーバーや BlueBubbles ランタイムはありません。

<Warning>
**SIP の無効化には、実際のセキュリティ上のトレードオフがあります。** SIP は、変更されたシステムコードの実行を防ぐ macOS の中核的な保護機能の 1 つです。システム全体で無効にすると、攻撃対象領域が拡大し、副作用が生じる可能性があります。特に、**Apple Silicon Mac で SIP を無効にすると、Mac に iOS アプリをインストールして実行する機能も無効になります**。

特にメインの個人用 Mac では、これを意図的な運用上の選択として扱ってください。本番品質の OpenClaw iMessage では、ブリッジの有効化を許容できる専用 Mac またはボット用 macOS ユーザーを推奨します。脅威モデル上、どの環境でも SIP の無効化を許容できない場合、同梱の iMessage は基本モードに限定されます。つまり、テキストとメディアの送受信のみで、リアクション／編集／送信取り消し／エフェクト／グループ操作は利用できません。
</Warning>

### セットアップ

1. Messages.app を実行する Mac に **`imsg` をインストール（またはアップグレード）**します。

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` の出力には `bridge_version`、`rpc_methods`、およびメソッドごとの `selectors` が示されるため、開始前に現在のビルドがサポートしている内容を確認できます。

2. **System Integrity Protection と、（最新の macOS では）Library Validation を無効にします。** Apple 署名済みの `Messages.app` に Apple 製ではないヘルパー dylib を注入するには、SIP をオフにし、さらに Library Validation を緩和する必要があります。リカバリモードでの SIP の手順は macOS のバージョンによって異なります。
   - **macOS 10.13-10.15（Sierra-Catalina）：** Terminal で Library Validation を無効にし、Recovery Mode で再起動して `csrutil disable` を実行し、再起動します。
   - **macOS 11 以降（Big Sur 以降）、Intel：** Recovery Mode（または Internet Recovery）で `csrutil disable` を実行し、再起動します。
   - **macOS 11 以降、Apple Silicon：** 電源ボタンを使用する起動手順で Recovery に入ります。最近の macOS バージョンでは、Continue をクリックするときに **Left Shift** キーを押したままにし、その後 `csrutil disable` を実行します。仮想マシン環境では別の手順が必要なため、最初に VM のスナップショットを作成してください。

   **macOS 11 以降では、通常 `csrutil disable` だけでは不十分です。** Apple はプラットフォームバイナリである `Messages.app` に対して引き続き Library Validation を適用するため、SIP がオフでもアドホック署名されたヘルパーは拒否されます（`Library Validation failed: ... platform binary, but mapped file is not`）。SIP を無効にした後、Library Validation も無効にして再起動します。

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26（Tahoe）、26.5.1 で検証済み：** SIP のオフに加えて、上記の `DisableLibraryValidation` コマンドを実行すれば、26.0 から 26.5.x までヘルパーを注入できます。**boot-args は必要ありません。** plist が決定的な要因であり、Tahoe で注入に失敗するときに最もよく欠けている手順です。
   - **plist がある場合：** `imsg launch` が注入され、`imsg status` は `advanced_features: true` を報告します。
   - **plist がない場合（SIP がオフでも）：** `imsg launch` は `Failed to launch: Timeout waiting for Messages.app to initialize` で失敗します。AMFI がロード時にアドホック署名されたヘルパーを拒否するため、ブリッジは準備完了にならず、起動がタイムアウトします。このタイムアウトは Tahoe で最も多く遭遇する症状です。解決策は上記の plist であり、さらに強力な措置ではありません。

   macOS のアップグレード後に `imsg launch` の注入または特定の `selectors` が false を返すようになった場合、通常はこのゲートが原因です。SIP の手順自体が失敗したと判断する前に、SIP と Library Validation の状態を確認してください。これらの設定が正しいにもかかわらずブリッジを注入できない場合は、システム全体のセキュリティ制御をさらに弱めるのではなく、`imsg status --json` と `imsg launch` の出力を収集し、`imsg` プロジェクトに報告してください。

3. **ヘルパーを注入します。** SIP が無効で、Messages.app にサインインしている状態で、次を実行します。

   ```bash
   imsg launch
   ```

   SIP がまだ有効な場合、`imsg launch` は注入を拒否するため、これは手順 2 が適用されたことの確認にもなります。

4. **OpenClaw からブリッジを確認します。**

   ```bash
   openclaw channels status --probe
   ```

   iMessage のエントリは `works` を報告し、`imsg status --json | jq '{rpc_methods, selectors}'` には使用中の macOS ビルドが公開する機能が表示されるはずです。投票の作成には `selectors.pollPayloadMessage` が必要です。投票には `selectors.pollVoteMessage` と `poll.vote` RPC メソッドの両方が必要です。OpenClaw Plugin はキャッシュされたプローブでサポートされているアクションのみを公開しますが、キャッシュが空の場合は楽観的に扱い、最初のディスパッチ時にプローブします。

`openclaw channels status --probe` がチャネルを `works` と報告しているものの、特定のアクションがディスパッチ時に「iMessage `<action>` requires the imsg private API bridge」というエラーをスローする場合は、`imsg launch` を再度実行してください。ヘルパーは外れることがあり（Messages.app の再起動、OS のアップデートなど）、キャッシュされた `available: true` ステータスは、次のプローブで更新されるまでアクションを公開し続けます。

### SIP を有効なままにする場合

脅威モデル上、SIP の無効化を許容できない場合：

- `imsg` は基本モードにフォールバックし、テキスト、メディア、受信のみをサポートします。
- OpenClaw Plugin は引き続きテキスト／メディアの送信と受信監視を公開します。アクションサーフェスから `react`、`edit`、`unsend`、`reply`、`sendWithEffect`、およびグループ操作を非表示にします（メソッドごとの機能ゲートに従います）。
- プライマリデバイスでは SIP を有効に保ちながら、iMessage ワークロード用に SIP を無効にした別の非 Apple Silicon Mac（または専用ボット Mac）を実行できます。以下の[専用ボット用 macOS ユーザー（独立した iMessage ID）](#deployment-patterns)を参照してください。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM ポリシー">
    `channels.imessage.dmPolicy` はダイレクトメッセージを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（少なくとも 1 つの `allowFrom` エントリが必要）
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    許可リストフィールド：`channels.imessage.allowFrom`。

    許可リストのエントリでは、送信者を識別する必要があります。ハンドルまたは静的な送信者アクセスグループ（`accessGroup:<name>`）を使用します。`chat_id:*`、`chat_guid:*`、`chat_identifier:*` などのチャットターゲットには `channels.imessage.groupAllowFrom` を使用し、数値の `chat_id` レジストリキーには `channels.imessage.groups` を使用します。

  </Tab>

  <Tab title="グループポリシーとメンション">
    `channels.imessage.groupPolicy` はグループの処理を制御します。

    - `allowlist`（デフォルト）
    - `open`
    - `disabled`

    グループ送信者の許可リスト：`channels.imessage.groupAllowFrom`。

    `groupAllowFrom` のエントリは、静的な送信者アクセスグループ（`accessGroup:<name>`）も参照できます。

    ランタイムのフォールバック：`groupAllowFrom` が未設定の場合、iMessage のグループ送信者チェックでは `allowFrom` が使用されます。DM とグループで受け入れ条件を分ける必要がある場合は、`groupAllowFrom` を設定してください。`groupAllowFrom: []` を明示的に空にした場合はフォールバックせず、`allowlist` ではすべてのグループ送信者をブロックします。
    ランタイム上の注意：`channels.imessage` が完全に存在しない場合、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログに記録します（`channels.defaults.groupPolicy` が設定されている場合でも同様です）。

    <Warning>
    `groupPolicy: "allowlist"` でのグループルーティングでは、**2 つ**のゲートが連続して実行されます。

    1. **送信者の許可リスト**（`channels.imessage.groupAllowFrom`）— ハンドル、`accessGroup:<name>`、`chat_guid`、`chat_identifier`、または `chat_id`。有効なリストが空の場合（`groupAllowFrom` も `allowFrom` のフォールバックもない場合）、すべてのグループ送信者をブロックします。
    2. **グループレジストリ**（`channels.imessage.groups`）— マップにエントリが追加されると適用されます。チャットは、明示的な `chat_id` ごとのエントリまたは `groups: { "*": { ... } }` ワイルドカードに一致する必要があります。`groups` が空または存在しない場合は、送信者の許可リストだけで受け入れが決まります。

    有効なグループ送信者の許可リストが設定されていない場合、すべてのグループメッセージはレジストリゲートに到達する前に破棄されます。各ゲートはデフォルトのログレベルで独自の `warn` レベルのシグナルを出力し、それぞれ異なる解決方法を示します。

    - アカウントごとに起動時に 1 回、有効なグループ送信者の許可リストが空の場合：`imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` — `channels.imessage.groupAllowFrom`（または `allowFrom`）を設定して修正します。`groups` のエントリを追加するだけでは、ゲート 1 が引き続きすべての送信者をブロックします。
    - 実行時に `chat_id` ごとに 1 回、送信者がゲート 1 を通過したものの、エントリがある `groups` レジストリにチャットが存在しない場合：`imessage: dropping group message from chat_id=<id> ...` — `channels.imessage.groups` の下にその `chat_id`（または `"*"`）を追加して修正します。

    DM は影響を受けません。DM は別のコードパスを通ります。

    `groupPolicy: "allowlist"` でのグループフローの推奨設定：

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

    `groupAllowFrom` だけで、それらの送信者を任意のグループで受け入れます。許可するチャットを限定するには（また、`requireMention` のようなチャットごとのオプションを設定するには）、`groups` ブロックを追加します。
    </Warning>

    グループのメンションゲート：

    - iMessage にはネイティブのメンションメタデータがありません
    - メンション検出では正規表現パターンを使用します（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - パターンが設定されていない場合、メンションゲートを適用できません
    - 認可された送信者からの制御コマンドはメンションゲートを迂回します

    グループごとの `systemPrompt`：

    `channels.imessage.groups.*` の各エントリでは、オプションの `systemPrompt` 文字列を指定できます。そのグループ内のメッセージを処理するすべてのターンで、エージェントのシステムプロンプトに注入されます。解決方法は `channels.whatsapp.groups` と同じです。

    1. **グループ固有のシステムプロンプト**（`groups["<chat_id>"].systemPrompt`）：特定のグループエントリがマップに存在し、**かつ**その `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、そのグループにはシステムプロンプトが適用されません。
    2. **グループワイルドカードのシステムプロンプト**（`groups["*"].systemPrompt`）：特定のグループエントリがマップにまったく存在しない場合、または存在していても `systemPrompt` キーが定義されていない場合に使用されます。

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "イギリス英語の綴りを使用してください。" },
            "8421": {
              requireMention: true,
              systemPrompt: "これはオンコールローテーションのチャットです。返信は3文未満にしてください。",
            },
            "9907": {
              // 明示的な抑制：ワイルドカードの「イギリス英語の綴りを使用してください。」はここには適用されません
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    グループごとのプロンプトはグループメッセージにのみ適用されます。ダイレクトメッセージには影響しません。

  </Tab>

  <Tab title="セッションと決定的な返信">
    - DM はダイレクトルーティングを使用し、グループはグループルーティングを使用します。
    - デフォルトの `session.dmScope=main` では、iMessage の DM はエージェントのメインセッションに統合されます。
    - グループセッションは分離されます（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 返信は、発信元のチャネル／ターゲットのメタデータを使用して iMessage に戻されます。

    グループに似たスレッドの動作：

    一部の複数参加者による iMessage スレッドは、`is_group=false` を伴って到着することがあります。
    その `chat_id` が `channels.imessage.groups` の下に明示的に設定されている場合、OpenClaw はそれをグループトラフィックとして扱います（グループゲートとグループセッションの分離）。

  </Tab>
</Tabs>

## ACP 会話バインディング

iMessage チャットを ACP セッションにバインドできます。

オペレーター向けの簡単な手順：

- DM または許可されたグループチャット内で `/acp spawn codex --bind here` を実行します。
- 以降、同じ iMessage 会話のメッセージは、生成された ACP セッションにルーティングされます。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

設定による永続的なバインディングでは、トップレベルの `bindings[]` エントリと `type: "acp"` および `match.channel: "imessage"` を使用します。

`match.peer.id` には次を使用できます。

- `+15555550123` や `user@example.com` などの正規化された DM ハンドル
- `chat_id:<id>`（安定したグループバインディングに推奨）
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

例：

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

共通の ACP バインディング動作については、[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用ボット用 macOS ユーザー（独立した iMessage ID）">
    ボットのトラフィックを個人用の Messages プロファイルから分離するために、専用の Apple ID と macOS ユーザーを使用します。

    一般的な手順：

    1. 専用の macOS ユーザーを作成し、サインインします。
    2. そのユーザーで、ボット用 Apple ID を使用して Messages にサインインします。
    3. そのユーザーに `imsg` をインストールします。
    4. OpenClaw がそのユーザーコンテキストで `imsg` を実行できるように、SSH ラッパーを作成します。
    5. `channels.imessage.accounts.<id>.cliPath` と `.dbPath` がそのユーザープロファイルを参照するように設定します。

    初回実行時、そのボットユーザーのセッションで GUI の承認（Automation + Full Disk Access）が必要になる場合があります。

  </Accordion>

  <Accordion title="Tailscale 経由のリモート Mac（例）">
    一般的な構成：

    - Gateway は Linux/VM 上で動作
    - iMessage + `imsg` は tailnet 内の Mac 上で動作
    - `cliPath` ラッパーは SSH を使用して `imsg` を実行
    - `remoteHost` は SCP による添付ファイル取得を有効化

    例：

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

    SSH と SCP の両方が非対話式になるよう、SSH キーを使用します。
    `known_hosts` に情報が登録されるよう、最初にホストキーが信頼されていることを確認します（例：`ssh bot@mac-mini.tailnet-1234.ts.net`）。

  </Accordion>

  <Accordion title="複数アカウントの構成">
    iMessage は `channels.imessage.accounts` 配下のアカウント単位の設定をサポートします。

    各アカウントでは、`cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、履歴設定、添付ファイルのルート許可リストなどのフィールドを上書きできます。

  </Accordion>

  <Accordion title="ダイレクトメッセージ履歴">
    `channels.imessage.dmHistoryLimit` を設定すると、新しいダイレクトメッセージセッションに、その会話の最近デコードされた `imsg` 履歴を初期データとして追加できます。送信者ごとの上書きには `channels.imessage.dms["<sender>"].historyLimit` を使用します。これには、送信者の履歴を無効にする `0` も含まれます。

    iMessage の DM 履歴は、必要に応じて `imsg` から取得されます。`dmHistoryLimit` を未設定のままにするとグローバルな DM 履歴の初期投入は無効になりますが、送信者ごとの `channels.imessage.dms["<sender>"].historyLimit` が正の値であれば、その送信者については初期投入が引き続き有効になります。

  </Accordion>
</AccordionGroup>

## メディア、チャンク分割、配信先

<AccordionGroup>
  <Accordion title="添付ファイルとメディア">
    - 受信添付ファイルの取り込みは**デフォルトで無効**です。写真、ボイスメモ、動画、その他の添付ファイルをエージェントに転送するには、`channels.imessage.includeAttachments: true` を設定します。無効の場合、添付ファイルのみの iMessage はエージェントに到達する前に破棄され、`Inbound message` ログ行がまったく生成されないことがあります。
    - `remoteHost` が設定されている場合、リモートの添付ファイルパスを SCP 経由で取得可能
    - 添付ファイルパスは許可されたルートと一致する必要あり：
      - `channels.imessage.attachmentRoots`（ローカル）
      - `channels.imessage.remoteAttachmentRoots`（リモート SCP モード）
      - 設定されたルートは、デフォルトのルートパターン `/Users/*/Library/Messages/Attachments` を拡張（置換ではなくマージ）
    - SCP は厳格なホストキー確認を使用（`StrictHostKeyChecking=yes`）
    - 送信メディアのサイズには `channels.imessage.mediaMaxMb` を使用（デフォルト 16 MB）

  </Accordion>

  <Accordion title="送信テキストとチャンク分割">
    - テキストのチャンク上限：`channels.imessage.textChunkLimit`（デフォルト 4000）
    - チャンクモード：`channels.imessage.streaming.chunkMode`
      - `length`（デフォルト）
      - `newline`（段落優先の分割）
    - 送信時の Markdown の太字、斜体、下線、取り消し線はネイティブのスタイル付きテキストに変換（macOS 15 以降の受信者ではスタイルを表示し、それ以前の受信者ではマーカーなしのプレーンテキストを表示）。Markdown テーブルは、チャンネルの Markdown テーブルモードに従って変換
    - `channels.imessage.sendTransport`（デフォルトは `auto`、ほかに `bridge`、`applescript`）で、`imsg` が送信を配信する方法を選択

  </Accordion>

  <Accordion title="宛先指定形式">
    推奨される明示的な宛先：

    - `chat_id:123`（安定したルーティングに推奨）
    - `chat_guid:...`
    - `chat_identifier:...`

    ハンドルによる宛先もサポートされています：

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## プライベート API アクション

`imsg launch` が実行中で、`openclaw channels status --probe` が `privateApi.available: true` を報告している場合、メッセージツールでは通常のテキスト送信に加えて、iMessage ネイティブのアクションを使用できます。

すべてのアクションはデフォルトで有効です。個々のアクションを無効にするには `channels.imessage.actions` を使用します：

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
    - **react**：iMessage の Tapback を追加または削除（`messageId`、`emoji`、`remove`）。サポートされる Tapback は、love、like、dislike、laugh、emphasize、question に対応します。絵文字を指定せずに削除すると、設定されている Tapback が消去されます。
    - **reply**：既存のメッセージにスレッド返信を送信（`messageId`、`text` または `message` に加えて、`chatGuid`、`chatId`、`chatIdentifier`、または `to`）。添付ファイル付きの返信にはさらに、`--file` をサポートする `send-rich` を備えた `imsg` ビルドが必要です。
    - **sendWithEffect**：iMessage エフェクト付きでテキストを送信（`text` または `message`、`effect` または `effectId`）。短縮名：slam、loud、gentle、invisibleink、confetti、lasers、fireworks、balloon、heart、echo、happybirthday、shootingstar、sparkles、spotlight。
    - **edit**：サポートされる macOS／プライベート API バージョンで送信済みメッセージを編集（`messageId`、`text` または `newText`）。編集できるのは Gateway 自身が送信したメッセージのみです。
    - **unsend**：サポートされる macOS／プライベート API バージョンで送信済みメッセージを取り消し（`messageId`）。送信を取り消せるのは Gateway 自身が送信したメッセージのみです。
    - **upload-file**：メディア／ファイルを送信（base64 形式の `buffer`、またはハイドレート済みの `media`／`path`／`filePath`、`filename`、省略可能な `asVoice`）。レガシーエイリアス：`sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**：現在の宛先がグループ会話の場合に、グループチャットを管理します。これらはホストの Messages ID を変更するため、所有者である送信者または `operator.admin` Gateway クライアントが必要です。
    - **poll**：Apple Messages のネイティブ投票を作成（`pollQuestion`、2〜12 回繰り返す `pollOption` に加えて、`chatGuid`、`chatId`、`chatIdentifier`、または `to`）。iOS／iPadOS／macOS 26 以降の受信者はネイティブに表示して投票できます。それ以前の OS バージョンでは「投票を送信しました」というテキストのフォールバックが表示されます。`selectors.pollPayloadMessage` が必要です。
    - **poll-vote**：既存の投票に投票（`pollId` または `messageId` に加えて、`pollOptionIndex`、`pollOptionId`、`pollOptionText` のいずれか 1 つのみ）。`selectors.pollVoteMessage` と `poll.vote` RPC メソッドが必要です。

    受理された受信投票は、質問、番号付きの選択肢ラベル、得票数、`poll-vote` で必要となる投票メッセージ ID とともにエージェント向けにレンダリングされます。

  </Accordion>

  <Accordion title="メッセージ ID">
    受信した iMessage のコンテキストには、短い `MessageSid` 値と、利用可能な場合は完全なメッセージ GUID（`MessageSidFull`）の両方が含まれます。短い ID の有効範囲は、SQLite ベースの最近の返信キャッシュ内に限定され、使用前に現在のチャットとの一致が確認されます。短い ID が期限切れになった場合は、それを提供した会話を宛先に指定し、対応する `MessageSidFull` で再試行してください。完全な ID でも会話やアカウントへの紐付けは回避できないため、別のチャットの ID は現在の宛先から取得したものに置き換えてください。リモート委任された呼び出しでは、現在の会話を示す証拠が利用できない場合、古い完全 ID が拒否されることがあります。

  </Accordion>

  <Accordion title="機能検出">
    OpenClaw がプライベート API アクションを非表示にするのは、キャッシュされたプローブ状態でブリッジが利用不可と示されている場合のみです。状態が不明な場合、アクションは引き続き表示され、ディスパッチ時に遅延プローブが行われるため、手動で状態を更新しなくても `imsg launch` の後に最初のアクションが成功できます。

  </Accordion>

  <Accordion title="既読通知と入力中表示">
    プライベート API ブリッジが稼働している場合、受理された受信チャットは既読になり、ダイレクトチャットではターンが受理されるとすぐに、エージェントがコンテキストを準備して生成している間、入力中の吹き出しが表示されます。既読化を無効にするには：

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    メソッド単位の機能リストより前の古い `imsg` ビルドでは、入力中表示／既読通知が暗黙に無効化されます。OpenClaw は再起動ごとに一度だけ警告をログに記録するため、通知がない原因を特定できます。

  </Accordion>

  <Accordion title="受信 Tapback">
    OpenClaw は iMessage の Tapback を購読し、受理されたリアクションを通常のメッセージテキストではなくシステムイベントとしてルーティングします。そのため、ユーザーの Tapback によって通常の返信ループが発生することはありません。

    通知モードは `channels.imessage.reactionNotifications` で制御されます：

    - `"own"`（デフォルト）：ユーザーがボット作成のメッセージにリアクションした場合のみ通知。
    - `"all"`：許可された送信者からのすべての受信 Tapback を通知。
    - `"off"`：受信 Tapback を無視。

    アカウント単位の上書きには `channels.imessage.accounts.<id>.reactionNotifications` を使用します。

  </Accordion>

  <Accordion title="承認リアクション（👍／👎）">
    `approvals.exec.enabled` または `approvals.plugin.enabled` が true で、リクエストが iMessage にルーティングされる場合、Gateway は承認プロンプトをネイティブに配信し、Tapback を受け付けて解決します：

    - `👍`（Like Tapback）→ `allow-once`
    - `👎`（Dislike Tapback）→ `deny`
    - `allow-always` は手動フォールバックとして残ります：`/approve <id> allow-always` を通常の返信として送信します。

    リアクションの処理には、リアクションしたユーザーのハンドルが明示的な承認者である必要があります。承認者リストは `channels.imessage.allowFrom`（または `channels.imessage.accounts.<id>.allowFrom`）から読み取られます。ユーザーの電話番号を E.164 形式で追加するか、Apple ID のメールアドレスを追加してください（`chat_id:*` のようなチャット宛先は、有効な承認者エントリではありません）。ワイルドカードエントリ `"*"` も適用されますが、どの送信者でも承認できるようになります。承認者リストが空の場合、リアクションによるショートカットは完全に無効になります。リアクションによるショートカットは、承認の解決で意味を持つ唯一のゲートが明示的な承認者の許可リストであるため、意図的に `reactionNotifications`、`dmPolicy`、`groupAllowFrom` を迂回します。

    `/approve` テキストコマンドの認可も同じリストに従います。`channels.imessage.allowFrom` が空でない場合、`/approve <id> <decision>` は、より広範な DM 許可リストではなく、その承認者リストに照らして認可されます。DM 許可リストでは許可されていても `allowFrom` に含まれない送信者には、明示的な拒否が返されます。`allowFrom` が空の場合、同一チャットのフォールバックが引き続き有効になり、`/approve` は DM 許可リストで許可されたすべてのユーザーを認可します。`/approve` またはリアクションを介して承認すべきすべてのオペレーターを `allowFrom` に追加してください。

    オペレーター向け注記:
    - リアクションのバインディングはメモリと Gateway の永続キーストアの両方に保存され（TTL は承認の有効期限に合わせられます）、Gateway は保留中のプロンプトに対するタップバックもポーリングするため、Gateway の再起動直後に届いたタップバックでも承認を解決できます。
    - オペレーター自身の `is_from_me=true` タップバック（たとえば、ペアリング済みの Apple デバイスからのもの）は、そのハンドルが明示的な承認者である場合に承認を解決します。
    - 明示的な承認者が設定されている場合にのみ、承認プロンプトはグループ会話にルーティングされます。そうでなければ、任意のグループメンバーが承認できてしまいます。
    - 従来のテキスト形式のタップバック（非常に古い Apple クライアントからの `Liked "…"` プレーンテキスト）はメッセージ GUID を持たないため、承認を解決できません。リアクションによる解決には、現在の macOS / iOS クライアントが送信する構造化タップバックメタデータが必要です。

  </Accordion>
</AccordionGroup>

## 設定の書き込み

iMessage では、デフォルトでチャンネルから開始される設定の書き込みが許可されます（`commands.config: true` の場合の `/config set|unset`）。

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

## 分割送信された DM の結合（1 回の入力にコマンド + URL）

ユーザーがコマンドと URL を一緒に入力すると（例: `Dump https://example.com/article`）、Apple の Messages アプリは送信を**2 つの別々の `chat.db` 行**に分割します。

1. テキストメッセージ（`"Dump"`）。
2. OG プレビュー画像を添付ファイルとして含む URL プレビュー吹き出し（`"https://..."`）。

ほとんどの環境では、2 つの行は約 0.8～2.0 秒の間隔で OpenClaw に到着します。結合しない場合、エージェントはターン 1 でコマンドだけを受け取り（多くの場合「URL を送ってください」と応答します）、その後ターン 2 で URL が到着します。これは Apple の送信パイプラインによるものであり、OpenClaw や `imsg` が引き起こすものではありません。

`channels.imessage.coalesceSameSenderDms` は、連続する同一送信者の行を DM でバッファリングするようオプトインします。`imsg` がソース行のいずれかで構造的な URL プレビューマーカー `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` を公開する場合、OpenClaw は実際の分割送信だけを結合し、その他のバッファリングされた行は個別のターンとして維持します。吹き出しメタデータをまったく出力しない古い `imsg` ビルドでは、OpenClaw は分割送信と個別送信を区別できないため、バケットの結合にフォールバックします。これにより、`Dump <url>` の分割送信が 2 ターンに退行するのではなく、メタデータ導入前の動作が維持されます。複数ユーザーのターン構造を維持するため、グループチャットは引き続きメッセージ単位でディスパッチされます。

<Tabs>
  <Tab title="有効にする場合">
    次の場合に有効にします:

    - 1 つのメッセージ内に `command + payload` があることを前提とする Skills（ダンプ、貼り付け、保存、キューへの追加など）を提供している。
    - ユーザーがコマンドと一緒に URL を貼り付ける。
    - 追加される DM ターンのレイテンシーを許容できる（後述）。

    次の場合は無効のままにします:

    - 単語 1 つの DM トリガーでコマンドのレイテンシーを最小限にする必要がある。
    - すべてのフローが、後続のペイロードを伴わない単発コマンドである。

  </Tab>
  <Tab title="有効化">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // オプトイン（デフォルト: false）
        },
      },
    }
    ```

    フラグがオンで、明示的な `messages.inbound.byChannel.imessage` またはグローバルな `messages.inbound.debounceMs` がない場合、デバウンスウィンドウは **7000 ms** に拡大されます（従来のデフォルトは 0 ms、つまりデバウンスなしです）。Messages.app がプレビュー行を生成する間、Apple の URL プレビュー分割送信の間隔が数秒に及ぶことがあるため、より広いウィンドウが必要です。

    ウィンドウを自分で調整するには:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms で、観測された Messages.app の URL プレビュー遅延をカバーします。
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="トレードオフ">
    - **正確な結合には、現在の `imsg` ペイロードメタデータが必要です。** `balloon_bundle_id` が存在する場合、実際の分割送信だけが結合されます。前述したメタデータなしのフォールバック結合は暫定的な後方互換であり、`imsg` が上流で分割送信を結合するようになった時点で削除されます。
    - **DM メッセージにレイテンシーが追加されます。** フラグがオンの場合、URL プレビュー行が到着する可能性に備え、すべての DM（単独の制御コマンドや 1 件のテキストフォローアップを含む）は、ディスパッチ前に最大でデバウンスウィンドウの間待機します。グループチャットメッセージは即時ディスパッチを維持します。
    - **結合された出力には上限があります。** 結合テキストは明示的な `…[truncated]` マーカー付きで 4000 文字、添付ファイルは 20 件、ソースエントリは 10 件が上限です（超過時は最初のエントリと最新のエントリを保持）。すべてのソース GUID は、後続のテレメトリ用に `coalescedMessageGuids` で追跡されます。
    - **DM のみ。** 複数人が入力している場合でもボットの応答性を維持できるよう、グループチャットはメッセージ単位のディスパッチにフォールスルーします。
    - **チャンネル単位のオプトイン。** その他のチャンネル（Discord、Slack、Telegram、WhatsApp など）には影響しません。`channels.bluebubbles.coalesceSameSenderDms` を設定している従来の BlueBubbles 設定は、その値を `channels.imessage.coalesceSameSenderDms` に移行する必要があります。

  </Tab>
</Tabs>

### シナリオとエージェントから見える内容

「フラグオン」列は、`balloon_bundle_id` を出力する `imsg` ビルドでの動作を示します。吹き出しメタデータをまったく出力しない古い `imsg` ビルドでは、以下で「2 ターン」/「N ターン」と記載された行は、代わりに従来の結合（1 ターン）へフォールバックします。OpenClaw は分割送信と個別送信を構造的に区別できないため、メタデータ導入前の結合を維持します。ビルドが吹き出しメタデータを出力すると、正確な分離が有効になります。

| ユーザーの入力内容                                                      | `chat.db` の生成内容                  | フラグオフ（デフォルト）                      | フラグオン + ウィンドウ（imsg が吹き出しメタデータを出力）                                                      |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com`（1 回の送信）                              | 約 1 秒間隔の 2 行                   | エージェントの 2 ターン: 「Dump」のみ、その後 URL | 1 ターン: 結合されたテキスト `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption`（添付ファイル + テキスト）                | URL 吹き出しメタデータのない 2 行 | 2 ターン                               | メタデータ観測後は 2 ターン。古い、またはラッチ前のメタデータなしセッションでは結合された 1 ターン       |
| `/status`（単独コマンド）                                     | 1 行                               | 即時ディスパッチ                        | **最大でウィンドウの間待機してからディスパッチ**                                                                |
| URL のみを貼り付け                                                   | 1 行                               | 即時ディスパッチ                        | 最大でウィンドウの間待機してからディスパッチ                                                                    |
| テキスト + URL を意図的に数分間隔の 2 つの別メッセージとして送信 | ウィンドウ外の 2 行               | 2 ターン                               | 2 ターン（両者の間にウィンドウが期限切れ）                                                             |
| 高速な大量送信（ウィンドウ内に 10 件超の短い DM）                          | URL 吹き出しメタデータのない N 行 | N ターン                                 | メタデータ観測後は N ターン。古い、またはラッチ前のメタデータなしセッションでは上限付きで結合された 1 ターン |
| グループチャットで 2 人が入力                                  | M 人の送信者から N 行               | M+ ターン（送信者バケットごとに 1 つ）        | M+ ターン — グループチャットは結合されない                                                            |

## ブリッジまたは Gateway の再起動後の受信復旧

iMessage は Gateway の停止中に受信できなかったメッセージを復旧すると同時に、Push 復旧後に Apple が一斉送信する可能性のある古い「バックログ爆弾」を抑制します。デフォルトの動作は常にオンで、受信重複排除を基盤としています。

- **リプレイ重複排除。** ディスパッチされたすべての受信メッセージは、その Apple GUID によって永続 Plugin 状態（`imessage.inbound-dedupe`）に記録され、取り込み時に要求され、処理後にコミットされます（一時的な失敗時には再試行できるよう解放されます）。すでに処理済みのものは、二重にディスパッチされるのではなく破棄されます。これにより、メッセージ単位の記録管理なしで復旧リプレイを積極的に実行できます。
- **停止時間からの復旧。** 起動時にモニターは最後にディスパッチされた `chat.db` の rowid（アカウント単位で永続化されたカーソル）を記憶し、それを `since_rowid` として `imsg watch.subscribe` に渡します。これにより imsg は Gateway の停止中に到着した行をリプレイしてから、ライブ追跡に移行します。リプレイは最新の 500 行、および約 2 時間前までのメッセージに制限され、重複排除によって処理済みのものはすべて破棄されます。
- **古いバックログの経過時間フェンス。** 起動境界より上の行は実際にライブです。送信日時が到着時刻より約 15 分以上古いものは Push 一斉送信バックログとして抑制されます。リプレイされた行（境界以下）には、代わりにより広い復旧ウィンドウが使用されるため、最近受信できなかったメッセージは配信され、古い履歴は配信されません。

復旧はローカルとリモートの両方の `cliPath` 環境で機能します。これは `since_rowid` のリプレイが同じ `imsg` RPC 接続上で実行されるためです。違いはウィンドウです。Gateway が `chat.db` を読み取れる場合（ローカル）、起動時の rowid 境界を基準としてリプレイ範囲を制限し、最大で数時間前までの受信できなかったメッセージを配信します。リモート SSH `cliPath` 経由ではデータベースを読み取れないため、リプレイには上限がなく、すべての行にライブ経過時間フェンスが使用されます。それでも最近受信できなかったメッセージは復旧され、古いバックログも抑制されますが、ライブウィンドウは狭くなります。より広い復旧ウィンドウを使用するには、Messages が動作する Mac 上で Gateway を実行してください。

### オペレーターが確認できるシグナル

抑制されたバックログはデフォルトレベルでログに記録され、通知なしに破棄されることはありません（`recovery` フラグは、適用されたウィンドウを示します）。

```text
imessage: 古い受信バックログを抑制 account=<id> sent=<iso> recovery=<bool> (起動後 <N> 件を抑制)
```

### 移行

`channels.imessage.catchup.*` は非推奨です。停止時間からの復旧は自動で行われ、新しい環境では設定が不要です。`catchup.enabled: true` を含む既存の設定は、復旧リプレイウィンドウの互換性プロファイルとして引き続き尊重されます。無効化されたキャッチアップブロック（`enabled: false` または `enabled: true` なし）は廃止され、`openclaw doctor --fix` によって削除されます。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="imsg が見つからない、または RPC がサポートされていない">
    バイナリと RPC サポートを検証します:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    プローブが RPC 非対応と報告する場合は、`imsg` を更新してください。プライベート API アクションが利用できない場合は、ログイン中の macOS ユーザーセッションで `imsg launch` を実行し、再度プローブしてください。Gateway が macOS 上で動作していない場合は、デフォルトのローカル `imsg` パスではなく、前述の SSH 経由のリモート Mac セットアップを使用してください。

  </Accordion>

  <Accordion title="Messages は送信できるが、受信 iMessage が届かない">
    まず、メッセージがローカル Mac に到達したかどうかを確認します。`chat.db` が変化しない場合、`imsg status --json` が正常なブリッジを報告していても、OpenClaw はメッセージを受信できません。

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    電話から送信されたメッセージによって新しい行が作成されない場合は、OpenClaw の設定を変更する前に、macOS の Messages と Apple Push レイヤーを修復してください。多くの場合、サービスを 1 回更新すれば十分です:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    OpenClawセッションをデバッグする前に、電話から新しいiMessageを送信し、新しい`chat.db`行または`imsg watch`イベントがあることを確認します。これを定期的なブリッジ再起動ループとして実行しないでください。作業中に`imsg launch`とGatewayの再起動を繰り返すと、配信が中断され、進行中のチャネル実行が取り残される可能性があります。

  </Accordion>

  <Accordion title="macOSでGatewayが実行されていない">
    デフォルトの`cliPath: "imsg"`は、MessagesにサインインしているMac上で実行する必要があります。LinuxまたはWindowsでは、`channels.imessage.cliPath`を、そのMacにSSH接続して`imsg "$@"`を実行するラッパースクリプトに設定します。

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    次に実行します。

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DMが無視される">
    次を確認します。

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - ペアリングの承認（`openclaw pairing list imessage`）

  </Accordion>

  <Accordion title="グループメッセージが無視される">
    次を確認します。

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups`許可リストの動作
    - メンションパターンの設定（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="リモート添付ファイルが失敗する">
    次を確認します。

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - GatewayホストからのSSH/SCP鍵認証
    - Gatewayホストの`~/.ssh/known_hosts`にホスト鍵が存在すること
    - Messagesを実行しているMac上でリモートパスが読み取り可能であること

  </Accordion>

  <Accordion title="macOSの権限プロンプトを見逃した">
    同じユーザーおよびセッションのコンテキストにある対話型GUIターミナルで再実行し、プロンプトを承認します。

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    OpenClaw／`imsg`を実行するプロセスコンテキストに、フルディスクアクセスとオートメーションの権限が付与されていることを確認します。

  </Accordion>
</AccordionGroup>

## 設定リファレンスへのリンク

- [設定リファレンス - iMessage](/ja-JP/gateway/config-channels#imessage)
- [Gatewayの設定](/ja-JP/gateway/configuration)
- [ペアリング](/ja-JP/channels/pairing)

## 関連項目

- [チャネルの概要](/ja-JP/channels) — サポートされているすべてのチャネル
- [BlueBubblesの削除とimsg iMessageパス](/ja-JP/announcements/bluebubbles-imessage) — お知らせと移行の概要
- [BlueBubblesからの移行](/ja-JP/channels/imessage-from-bluebubbles) — 設定変換表と段階的な切り替え手順
- [ペアリング](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションによる制御
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化策
