---
read_when:
    - iMessage サポートの設定
    - iMessage の送受信をデバッグする
summary: imsg（stdio 経由の JSON-RPC）によるネイティブ iMessage 対応。返信、Tapback、エフェクト、投票、添付ファイル、グループ管理のためのプライベート API アクションを提供します。ホスト要件を満たす場合、新しい OpenClaw iMessage 環境では推奨されます。
title: iMessage
x-i18n:
    generated_at: "2026-07-12T14:19:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 81819aad1a9199791c3c02eb0c9cc72059c663710140b33ba31f79b4bc59d8e2
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
通常のOpenClaw iMessageデプロイでは、Gatewayと`imsg`を、Messagesにサインイン済みの同じmacOSホスト上で実行します。Gatewayを別の場所で実行する場合は、`channels.imessage.cliPath`に、Mac上で`imsg`を実行する透過的なSSHラッパーを指定します。

**受信復旧は自動です。** ブリッジまたはGatewayの再起動後、iMessageは停止中に受信できなかったメッセージを再生し、Push復旧後にAppleが一気に流す可能性がある古い「バックログ爆弾」を抑制します。また、重複排除により同じメッセージが二重にディスパッチされることはありません。有効化するための設定はありません。[ブリッジまたはGateway再起動後の受信復旧](#inbound-recovery-after-a-bridge-or-gateway-restart)を参照してください。
</Note>

<Warning>
BlueBubblesのサポートは削除されました。`channels.bluebubbles`の設定を`channels.imessage`に移行してください。OpenClawは`imsg`を通じてのみiMessageをサポートします。短い告知については[BlueBubblesの削除とimsgによるiMessage経路](/ja-JP/announcements/bluebubbles-imessage)から、完全な移行表については[BlueBubblesからの移行](/ja-JP/channels/imessage-from-bluebubbles)から始めてください。
</Warning>

ステータス: ネイティブ外部CLI統合。Gatewayは`imsg rpc`を起動し、stdio経由でJSON-RPCを使用します。個別のデーモンやポートはありません。完全なiMessageチャンネルを実現するため、Private APIモードを強く推奨します。返信、tapback、エフェクト、投票、添付ファイルへの返信、グループ操作には、`imsg launch`とPrivate APIプローブの成功が必要です。

一般的なローカル構成では、OpenClawのセットアップ時に、Messagesへサインイン済みのMac上で`imsg`をHomebrewによりインストールまたは更新するよう、ユーザー確認付きで提案できます。手動セットアップおよびSSHラッパートポロジーは、引き続きオペレーターが管理します。Gatewayまたはラッパーを実行するのと同じユーザーコンテキストに`imsg`をインストールまたは更新してください。

<CardGroup cols={3}>
  <Card title="Private API操作" icon="wand-sparkles" href="#private-api-actions">
    返信、tapback、エフェクト、投票、添付ファイル、グループ管理。
  </Card>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    iMessageのDMはデフォルトでペアリングモードです。
  </Card>
  <Card title="リモートMac" icon="terminal" href="#remote-mac-over-ssh">
    GatewayがMessagesのMac上で実行されていない場合は、SSHラッパーを使用します。
  </Card>
  <Card title="設定リファレンス" icon="settings" href="/ja-JP/gateway/config-channels#imessage">
    iMessageの全フィールドのリファレンス。
  </Card>
</CardGroup>

## クイックセットアップ

<Tabs>
  <Tab title="ローカルMac（最短経路）">
    <Steps>
      <Step title="imsgのインストールと検証">

```bash
brew install steipete/tap/imsg
brew update && brew upgrade imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

        ローカルセットアップウィザードがデフォルトの`imsg`コマンドが存在しないことを検出すると、Homebrewを通じて`steipete/tap/imsg`をインストールするよう案内できます。Homebrewで管理されている`imsg`を検出した場合は、再インストールまたは更新するよう案内できます。カスタム`cliPath`ラッパーは変更されません。

      </Step>

      <Step title="OpenClawの設定">

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

      <Step title="Gatewayの起動">

```bash
openclaw gateway
```

      </Step>

      <Step title="最初のDMペアリングを承認（デフォルトのdmPolicy）">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        ペアリング要求は1時間後に期限切れになります。
      </Step>
    </Steps>

  </Tab>

  <Tab title="SSH経由のリモートMac">
    ほとんどの構成ではSSHは必要ありません。このトポロジーは、GatewayをMessagesへサインイン済みのMac上で実行できない場合にのみ使用してください。OpenClawに必要なのはstdio互換の`cliPath`だけなので、リモートMacへSSH接続して`imsg`を実行するラッパースクリプトを`cliPath`に指定できます。
    `imsg`はGatewayホストではなく、そのリモートMacにインストールし、更新してください。

```bash
ssh messages-mac 'brew install steipete/tap/imsg && brew update && brew upgrade imsg'
```

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    添付ファイルを有効にする場合の推奨設定:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // SCPによる添付ファイル取得に使用
      includeAttachments: true,
      // 任意: 追加で許可する添付ファイルのルート（デフォルトの
      // /Users/*/Library/Messages/Attachmentsと統合される）。
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    `remoteHost`が設定されていない場合、OpenClawはSSHラッパースクリプトを解析して自動検出を試みます。
    `remoteHost`は`host`または`user@host`である必要があります（空白やSSHオプションは使用不可）。安全でない値は無視されます。
    OpenClawはSCPに厳格なホストキー検証を使用するため、リレーホストのキーが事前に`~/.ssh/known_hosts`に存在する必要があります。
    添付ファイルのパスは、許可されたルート（`attachmentRoots` / `remoteAttachmentRoots`）に照らして検証されます。

<Warning>
`imsg`の前段に配置する`cliPath`ラッパーまたはSSHプロキシは、長時間存続するJSON-RPCの透過的なstdioパイプとして動作しなければなりません。OpenClawはチャンネルの存続期間中、ラッパーのstdin/stdoutを介して、改行でフレーム化された小さなJSON-RPCメッセージを交換します。

- バイトが利用可能になったら、各stdinチャンクまたは行を**直ちに**転送してください。EOFを待たないでください。
- 逆方向でも、各stdoutチャンクまたは行を速やかに転送してください。
- 改行を保持してください。
- 小さなフレームを枯渇させる可能性がある固定サイズのブロッキング読み取り（`read(4096)`、`cat | buffer`、シェルのデフォルトの`read`）は避けてください。
- stderrをJSON-RPCのstdoutストリームから分離してください。

大きなブロックが埋まるまでstdinをバッファリングするラッパーでは、`imsg rpc`自体が正常であっても、iMessageの停止に見える症状（`imsg rpc timeout (chats.list)`やチャンネルの繰り返し再起動）が発生します。上記の`ssh -T host imsg "$@"`は、`rpc`や`--db`など、OpenClawの`cliPath`引数を転送するため安全です。`ssh host imsg | grep -v '^DEBUG'`のようなパイプラインは安全では**ありません**。行バッファリングを行うツールでもフレームを保持する可能性があります。フィルタリングが必要な場合は、すべての段階で`stdbuf -oL -eL`を使用してください。
</Warning>

  </Tab>
</Tabs>

## 要件と権限（macOS）

- `imsg`を実行するMacでMessagesにサインインしている必要があります。
- OpenClaw/`imsg`を実行するプロセスコンテキストには、Full Disk Accessが必要です（Messages DBへのアクセス）。
- Messages.appを通じてメッセージを送信するには、Automation権限が必要です。
- 高度な操作（リアクション / 編集 / 送信取り消し / スレッド返信 / エフェクト / 投票 / グループ操作）には、System Integrity Protectionを無効にする必要があります。[imsg Private APIの有効化](#enabling-the-imsg-private-api)を参照してください。基本的なテキストおよびメディアの送受信は、無効にしなくても機能します。

<Tip>
権限はプロセスコンテキストごとに付与されます。Gatewayをヘッドレス（LaunchAgent/SSH）で実行する場合は、同じコンテキストで一度だけ対話型コマンドを実行して、権限プロンプトを表示させてください。

```bash
imsg chats --limit 1
# または
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSHラッパーからの送信がAppleEvents -1743で失敗する">
  リモートSSH構成では、チャットの読み取り、`channels status --probe`の成功、受信メッセージの処理が可能でも、送信時にAppleEventsの認証エラーが発生して失敗することがあります。

```text
MessagesにApple eventsを送信する権限がありません。(-1743)
```

サインイン済みのMacユーザーのTCCデータベース、またはSystem Settings > Privacy & Security > Automationを確認してください。Automationのエントリが`imsg`やローカルシェルプロセスではなく`/usr/libexec/sshd-keygen-wrapper`に記録されている場合、macOSでは、そのSSHサーバー側クライアントに使用可能なMessagesの切り替え項目が表示されないことがあります。

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

この状態では、MessagesのAutomationを必要とするプロセスコンテキストがUIで権限を付与できるアプリではなくSSHラッパーであるため、`tccutil reset AppleEvents`を繰り返したり、同じSSHラッパーを通じて`imsg send`を再実行したりしても、失敗し続ける可能性があります。

代わりに、サポートされている`imsg`プロセスコンテキストのいずれかを使用してください。

- Gateway、または少なくとも`imsg`ブリッジを、Messagesユーザーがログインしているローカルセッションで実行します。
- 同じセッションからFull Disk AccessとAutomationを付与した後、そのユーザーのLaunchAgentでGatewayを起動します。
- 2ユーザーのSSHトポロジーを維持する場合は、チャンネルを有効にする前に、実際の送信`imsg send`が正確に同じラッパーを通じて成功することを確認してください。Automationを付与できない場合は、送信をSSHラッパーに依存させず、単一ユーザーの`imsg`構成に変更してください。

</Accordion>

## imsg Private APIの有効化

`imsg`には2つの動作モードがあります。OpenClawでは、ユーザーが期待するネイティブなiMessage操作をチャンネルで利用できるため、Private APIモードを推奨します。基本モードは、低リスクのインストール、初期検証、またはSIPを無効にできないホストで引き続き有用です。

- **基本モード**（デフォルト、SIPの変更は不要）: `send`によるテキストとメディアの送信、受信の監視と履歴、チャット一覧。これは、新規に`brew install steipete/tap/imsg`を実行し、上記の標準macOS権限を付与した状態で利用できます。
- **Private APIモード**: `imsg`はヘルパーdylibを`Messages.app`に注入し、内部の`IMCore`関数を呼び出します。これにより、`react`、`edit`、`unsend`、`reply`（スレッド形式）、`sendWithEffect`、`poll`および`poll-vote`（Messagesネイティブの投票）、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`に加え、入力中インジケーターと既読通知が利用可能になります。

このページで推奨する操作機能にはPrivate APIモードが必要です。`imsg`のREADMEには要件が明記されています。

> `read`、`typing`、`launch`、ブリッジを利用したリッチ送信、メッセージの変更、チャット管理などの高度な機能はオプトインです。これらを使用するには、SIPを無効にし、ヘルパーdylibを`Messages.app`に注入する必要があります。SIPが有効な場合、`imsg launch`は注入を拒否します。

このヘルパー注入手法では、MessagesのPrivate APIへアクセスするために`imsg`独自のdylibを使用します。OpenClawのiMessage経路には、サードパーティ製サーバーやBlueBubblesランタイムは存在しません。

<Warning>
**SIPの無効化には現実的なセキュリティ上のトレードオフがあります。** SIPは、変更されたシステムコードの実行を防ぐmacOSの中核的な保護機能の1つです。システム全体で無効にすると、追加の攻撃対象領域や副作用が生じます。特に、**Apple Silicon MacでSIPを無効にすると、MacにiOSアプリをインストールして実行する機能も無効になります**。

特に主要な個人用Macでは、意図的な運用上の選択として扱ってください。本番品質のOpenClaw iMessageには、ブリッジの有効化を許容できる専用Macまたはbot用macOSユーザーを推奨します。脅威モデル上、どの環境でもSIPの無効化を許容できない場合、同梱のiMessage機能は基本モードに制限されます。つまり、テキストとメディアの送受信のみで、リアクション / 編集 / 送信取り消し / エフェクト / グループ操作は利用できません。
</Warning>

### セットアップ

1. Messages.appを実行するMacに**`imsg`をインストール（またはアップグレード）**します。

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json`の出力には`bridge_version`、`rpc_methods`、およびメソッドごとの`selectors`が含まれるため、開始前に現在のビルドでサポートされている機能を確認できます。

2. **System Integrity Protection、および（最新のmacOSでは）Library Validationを無効にします。** Appleによって署名された`Messages.app`へApple製ではないヘルパーdylibを注入するには、SIPを無効にし、**かつ**Library Validationを緩和する必要があります。リカバリーモードでのSIP手順は、macOSのバージョンによって異なります。
   - **macOS 10.13-10.15（Sierra-Catalina）:** TerminalでLibrary Validationを無効にし、Recovery Modeで再起動して`csrutil disable`を実行した後、再起動します。
   - **macOS 11以降（Big Sur以降）、Intel:** Recovery Mode（またはInternet Recovery）で`csrutil disable`を実行し、再起動します。
   - **macOS 11以降、Apple Silicon:** 電源ボタンを使用した起動手順でRecoveryに入ります。最近のmacOSバージョンでは、Continueをクリックするときに**Left Shift**キーを押したままにし、その後`csrutil disable`を実行します。仮想マシン環境では別の手順を使用するため、最初にVMスナップショットを作成してください。

   **macOS 11以降では、通常、`csrutil disable` だけでは不十分です。** Appleはプラットフォームバイナリである`Messages.app`に対して引き続きライブラリ検証を適用するため、SIPを無効にしていてもアドホック署名されたヘルパーは拒否されます（`Library Validation failed: ... platform binary, but mapped file is not`）。SIPを無効にした後、ライブラリ検証も無効にして再起動してください。

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26（Tahoe）、26.5.1で検証済み：** SIPの無効化**と**上記の`DisableLibraryValidation`コマンドを組み合わせれば、26.0から26.5.xまでヘルパーを注入できます。**boot-argsは不要です。** このplistが決定的な要素であり、Tahoeで注入に失敗する場合に最もよく欠けている手順です。
   - **plistがある場合：** `imsg launch`は注入に成功し、`imsg status`は`advanced_features: true`を報告します。
   - **plistがない場合（SIPが無効でも）：** `imsg launch`は`Failed to launch: Timeout waiting for Messages.app to initialize`で失敗します。AMFIが読み込み時にアドホック署名されたヘルパーを拒否するため、ブリッジは準備完了にならず、起動がタイムアウトします。このタイムアウトはTahoeで最も多く遭遇する症状です。修正方法は上記のplistであり、より抜本的な対処ではありません。

   macOSのアップグレード後に`imsg launch`による注入や特定の`selectors`がfalseを返し始めた場合、通常はこのゲートが原因です。SIPの手順自体が失敗したと判断する前に、SIPとライブラリ検証の状態を確認してください。これらの設定が正しいにもかかわらずブリッジを注入できない場合は、追加のシステム全体のセキュリティ制御を弱めるのではなく、`imsg status --json`と`imsg launch`の出力を収集し、`imsg`プロジェクトに報告してください。

3. **ヘルパーを注入します。** SIPが無効で、Messages.appにサインインしている状態で実行します。

   ```bash
   imsg launch
   ```

   SIPがまだ有効な場合、`imsg launch`は注入を拒否するため、これは手順2が反映されたことの確認も兼ねます。

4. **OpenClawからブリッジを検証します。**

   ```bash
   openclaw channels status --probe
   ```

   iMessageのエントリは`works`を報告し、`imsg status --json | jq '{rpc_methods, selectors}'`には使用中のmacOSビルドが公開する機能が表示されるはずです。投票の作成には`selectors.pollPayloadMessage`が必要です。投票への回答には`selectors.pollVoteMessage`と`poll.vote` RPCメソッドの両方が必要です。OpenClaw Pluginは、キャッシュされたプローブでサポートされているアクションのみを公開します。一方、キャッシュが空の場合は楽観的に動作し、最初のディスパッチ時にプローブします。

`openclaw channels status --probe`がチャネルを`works`と報告していても、特定のアクションがディスパッチ時に「iMessage `<action>` requires the imsg private API bridge」をスローする場合は、`imsg launch`を再度実行してください。ヘルパーはMessages.appの再起動やOSアップデートなどによって外れることがあり、キャッシュされた`available: true`ステータスは、次のプローブで更新されるまでアクションを公開し続けます。

### SIPを有効なままにする場合

脅威モデル上、SIPの無効化を許容できない場合：

- `imsg`は基本モードにフォールバックします。利用できるのはテキスト、メディア、受信のみです。
- OpenClaw Pluginは引き続きテキスト／メディア送信と受信監視を公開しますが、メソッドごとの機能ゲートに従い、アクションサーフェスから`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、グループ操作を非表示にします。
- プライマリデバイスではSIPを有効に保ったまま、iMessageワークロード用に別の非Apple Silicon Mac（または専用のボットMac）をSIP無効で運用できます。以下の[専用ボット用macOSユーザー（別のiMessage ID）](#deployment-patterns)を参照してください。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DMポリシー">
    `channels.imessage.dmPolicy`はダイレクトメッセージを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（少なくとも1つの`allowFrom`エントリが必要）
    - `open`（`allowFrom`に`"*"`を含める必要あり）
    - `disabled`

    許可リストフィールド：`channels.imessage.allowFrom`。

    許可リストのエントリでは、送信者を識別する必要があります。ハンドルまたは静的な送信者アクセスグループ（`accessGroup:<name>`）を使用します。`chat_id:*`、`chat_guid:*`、`chat_identifier:*`などのチャットターゲットには`channels.imessage.groupAllowFrom`を使用し、数値の`chat_id`レジストリキーには`channels.imessage.groups`を使用します。

  </Tab>

  <Tab title="グループポリシーとメンション">
    `channels.imessage.groupPolicy`はグループの処理を制御します。

    - `allowlist`（デフォルト）
    - `open`
    - `disabled`

    グループ送信者の許可リスト：`channels.imessage.groupAllowFrom`。

    `groupAllowFrom`のエントリは、静的な送信者アクセスグループ（`accessGroup:<name>`）も参照できます。

    ランタイムのフォールバック：`groupAllowFrom`が未設定の場合、iMessageのグループ送信者チェックでは`allowFrom`が使用されます。DMとグループで受け入れ条件を分ける場合は`groupAllowFrom`を設定してください。明示的に空の`groupAllowFrom: []`はフォールバックせず、`allowlist`の下ですべてのグループ送信者をブロックします。
    ランタイムに関する注意：`channels.imessage`が完全に存在しない場合、ランタイムは`groupPolicy="allowlist"`にフォールバックし、警告をログに記録します（`channels.defaults.groupPolicy`が設定されている場合も同様です）。

    <Warning>
    `groupPolicy: "allowlist"`でのグループルーティングでは、**2つ**のゲートが連続して実行されます。

    1. **送信者許可リスト**（`channels.imessage.groupAllowFrom`）— ハンドル、`accessGroup:<name>`、`chat_guid`、`chat_identifier`、または`chat_id`。有効なリストが空の場合（`groupAllowFrom`がなく、`allowFrom`へのフォールバックもない場合）、すべてのグループ送信者がブロックされます。
    2. **グループレジストリ**（`channels.imessage.groups`）— マップにエントリが存在すると適用されます。チャットは、明示的な`chat_id`ごとのエントリまたは`groups: { "*": { ... } }`ワイルドカードに一致する必要があります。`groups`が空または存在しない場合、送信者許可リストのみで受け入れ可否が決まります。

    有効なグループ送信者許可リストが設定されていない場合、すべてのグループメッセージはレジストリゲートに到達する前に破棄されます。各ゲートはデフォルトのログレベルで独自の`warn`レベルのシグナルを出し、それぞれ異なる修正方法を示します。

    - 起動時にアカウントごとに1回、有効なグループ送信者許可リストが空の場合：`imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` — `channels.imessage.groupAllowFrom`（または`allowFrom`）を設定して修正します。`groups`エントリを追加するだけでは、ゲート1が引き続きすべての送信者をブロックします。
    - 実行時に`chat_id`ごとに1回、送信者がゲート1を通過したものの、設定済みの`groups`レジストリにチャットが存在しない場合：`imessage: dropping group message from chat_id=<id> ...` — その`chat_id`（または`"*"`）を`channels.imessage.groups`に追加して修正します。

    DMには影響しません。DMは別のコードパスを通ります。

    `groupPolicy: "allowlist"`でグループのフローを有効にするための推奨設定：

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

    `groupAllowFrom`だけを設定すると、それらの送信者はどのグループでも許可されます。許可するチャットの範囲を限定し、`requireMention`などのチャットごとのオプションを設定するには、`groups`ブロックを追加します。
    </Warning>

    グループのメンションゲート：

    - iMessageにはネイティブのメンションメタデータがありません
    - メンション検出では正規表現パターンを使用します（`agents.list[].groupChat.mentionPatterns`、フォールバックは`messages.groupChat.mentionPatterns`）
    - パターンが設定されていない場合、メンションゲートは適用できません
    - 承認済み送信者からの制御コマンドはメンションゲートを迂回します

    グループごとの`systemPrompt`：

    `channels.imessage.groups.*`配下の各エントリは、オプションの`systemPrompt`文字列を受け入れます。そのグループのメッセージを処理する各ターンで、エージェントのシステムプロンプトに注入されます。解決方法は`channels.whatsapp.groups`と同じです。

    1. **グループ固有のシステムプロンプト**（`groups["<chat_id>"].systemPrompt`）：特定のグループエントリがマップに存在し、**かつ**その`systemPrompt`キーが定義されている場合に使用されます。`systemPrompt`が空文字列（`""`）の場合、ワイルドカードは抑制され、そのグループにはシステムプロンプトが適用されません。
    2. **グループワイルドカードのシステムプロンプト**（`groups["*"].systemPrompt`）：特定のグループエントリがマップにまったく存在しない場合、または存在していても`systemPrompt`キーが定義されていない場合に使用されます。

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
              systemPrompt: "これはオンコール当番のチャットです。返信は3文以内にしてください。",
            },
            "9907": {
              // 明示的な抑制：ワイルドカードの「イギリス英語の綴りを使用してください。」はここでは適用されません
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    グループごとのプロンプトはグループメッセージにのみ適用され、ダイレクトメッセージには影響しません。

  </Tab>

  <Tab title="セッションと決定的な返信">
    - DMは直接ルーティングを使用し、グループはグループルーティングを使用します。
    - デフォルトの`session.dmScope=main`では、iMessageのDMはエージェントのメインセッションに集約されます。
    - グループセッションは分離されます（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 返信は、元のチャネル／ターゲットのメタデータを使用してiMessageにルーティングされます。

    グループに類似したスレッドの動作：

    複数の参加者がいる一部のiMessageスレッドは、`is_group=false`として到着することがあります。
    その`chat_id`が`channels.imessage.groups`で明示的に設定されている場合、OpenClawはそれをグループトラフィックとして扱います（グループゲートとグループセッションの分離）。

  </Tab>
</Tabs>

## ACP会話バインディング

iMessageチャットをACPセッションにバインドできます。

オペレーター向けの簡単な手順：

- DMまたは許可されたグループチャット内で`/acp spawn codex --bind here`を実行します。
- 以降、同じiMessage会話内のメッセージは、生成されたACPセッションにルーティングされます。
- `/new`と`/reset`は、バインドされた同じACPセッションをその場でリセットします。
- `/acp close`はACPセッションを閉じ、バインディングを削除します。

設定による永続バインディングでは、`type: "acp"`および`match.channel: "imessage"`を持つトップレベルの`bindings[]`エントリを使用します。

`match.peer.id`には次を使用できます。

- `+15555550123`や`user@example.com`などの正規化されたDMハンドル
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

共通のACPバインディングの動作については、[ACPエージェント](/ja-JP/tools/acp-agents)を参照してください。

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用ボット用macOSユーザー（別のiMessage ID）">
    専用のApple IDとmacOSユーザーを使用して、ボットのトラフィックを個人用のMessagesプロファイルから分離します。

    一般的な手順：

    1. 専用のmacOSユーザーを作成し、サインインします。
    2. そのユーザーで、ボット用Apple IDを使用してMessagesにサインインします。
    3. そのユーザーに`imsg`をインストールします。
    4. OpenClawがそのユーザーコンテキストで`imsg`を実行できるように、SSHラッパーを作成します。
    5. `channels.imessage.accounts.<id>.cliPath`と`.dbPath`をそのユーザープロファイルに向けます。

    初回実行時には、そのボットユーザーのセッションでGUIによる承認（Automation + Full Disk Access）が必要になる場合があります。

  </Accordion>

  <Accordion title="Tailscale経由のリモートMac（例）">
    一般的なトポロジ：

    - GatewayはLinux／VM上で実行します
    - iMessageと`imsg`はtailnet内のMac上で実行します
    - `cliPath`ラッパーはSSHを使用して`imsg`を実行します
    - `remoteHost`はSCPによる添付ファイルの取得を有効にします

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

    SSH と SCP の両方を非対話式にするため、SSH キーを使用します。
    最初にホストキーが信頼されていることを確認し（例: `ssh bot@mac-mini.tailnet-1234.ts.net`）、`known_hosts` に登録されるようにしてください。

  </Accordion>

  <Accordion title="複数アカウントのパターン">
    iMessage は `channels.imessage.accounts` 配下のアカウントごとの設定をサポートしています。

    各アカウントでは、`cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、履歴設定、添付ファイルのルート許可リストなどのフィールドを上書きできます。

  </Accordion>

  <Accordion title="ダイレクトメッセージの履歴">
    `channels.imessage.dmHistoryLimit` を設定すると、新しいダイレクトメッセージセッションに、その会話のデコード済み `imsg` 履歴を直近分投入できます。送信者ごとに上書きするには `channels.imessage.dms["<sender>"].historyLimit` を使用します。`0` を指定すると、その送信者の履歴を無効化できます。

    iMessage の DM 履歴は、必要に応じて `imsg` から取得されます。`dmHistoryLimit` を未設定のままにすると、グローバルな DM 履歴の投入は無効になりますが、送信者ごとの `channels.imessage.dms["<sender>"].historyLimit` に正の値を設定すると、その送信者については引き続き投入が有効になります。

  </Accordion>
</AccordionGroup>

## メディア、分割、配信先

<AccordionGroup>
  <Accordion title="添付ファイルとメディア">
    - 受信添付ファイルの取り込みは**デフォルトで無効**です — 写真、ボイスメモ、動画、その他の添付ファイルをエージェントに転送するには、`channels.imessage.includeAttachments: true` を設定します。無効の場合、添付ファイルのみの iMessage はエージェントに到達する前に破棄され、`Inbound message` ログ行が一切生成されないことがあります。
    - `remoteHost` が設定されている場合、リモートの添付ファイルパスを SCP 経由で取得できます
    - 添付ファイルパスは許可されたルートに一致する必要があります:
      - `channels.imessage.attachmentRoots`（ローカル）
      - `channels.imessage.remoteAttachmentRoots`（リモート SCP モード）
      - 設定したルートはデフォルトのルートパターン `/Users/*/Library/Messages/Attachments` に追加されます（置換ではなくマージ）
    - SCP は厳密なホストキーチェック（`StrictHostKeyChecking=yes`）を使用します
    - 送信メディアのサイズには `channels.imessage.mediaMaxMb` を使用します（デフォルト 16 MB）

  </Accordion>

  <Accordion title="送信テキストと分割">
    - テキストの分割上限: `channels.imessage.textChunkLimit`（デフォルト 4000）
    - 分割モード: `channels.imessage.streaming.chunkMode`
      - `length`（デフォルト）
      - `newline`（段落を優先して分割）
    - 送信時の Markdown の太字、斜体、下線、取り消し線はネイティブのスタイル付きテキストに変換されます（macOS 15+ の受信者にはスタイルが表示され、古い環境の受信者にはマーカーなしのプレーンテキストが表示されます）。Markdown テーブルはチャンネルの Markdown テーブルモードに従って変換されます
    - `channels.imessage.sendTransport`（デフォルトは `auto`、ほかに `bridge`、`applescript`）で、`imsg` が送信を配信する方法を選択します

  </Accordion>

  <Accordion title="宛先指定形式">
    推奨される明示的な宛先:

    - `chat_id:123`（安定したルーティングに推奨）
    - `chat_guid:...`
    - `chat_identifier:...`

    ハンドルによる宛先もサポートされています:

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

すべてのアクションはデフォルトで有効です。個別のアクションを無効にするには `channels.imessage.actions` を使用します:

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
    - **react**: iMessage の Tapback を追加または削除します（`messageId`、`emoji`、`remove`）。サポートされる Tapback は、love、like、dislike、laugh、emphasize、question に対応します。絵文字を指定せずに削除すると、設定されている Tapback が消去されます。
    - **reply**: 既存のメッセージへのスレッド返信を送信します（`messageId`、`text` または `message`、および `chatGuid`、`chatId`、`chatIdentifier`、`to` のいずれか）。添付ファイル付きの返信には、さらに `send-rich` が `--file` をサポートする `imsg` ビルドが必要です。
    - **sendWithEffect**: iMessage のエフェクト付きでテキストを送信します（`text` または `message`、`effect` または `effectId`）。短縮名: slam、loud、gentle、invisibleink、confetti、lasers、fireworks、balloon、heart、echo、happybirthday、shootingstar、sparkles、spotlight。
    - **edit**: サポートされる macOS／プライベート API バージョンで、送信済みメッセージを編集します（`messageId`、`text` または `newText`）。Gateway 自身が送信したメッセージのみ編集できます。
    - **unsend**: サポートされる macOS／プライベート API バージョンで、送信済みメッセージを取り消します（`messageId`）。Gateway 自身が送信したメッセージのみ取り消せます。
    - **upload-file**: メディア／ファイルを送信します（base64 形式の `buffer`、または展開済みの `media`／`path`／`filePath`、`filename`、任意の `asVoice`）。レガシーエイリアス: `sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**: 現在の宛先がグループ会話の場合に、グループチャットを管理します。これらはホストの Messages ID を変更するため、所有者の送信者または `operator.admin` Gateway クライアントが必要です。
    - **poll**: Apple Messages ネイティブの投票を作成します（`pollQuestion`、2～12 回繰り返す `pollOption`、および `chatGuid`、`chatId`、`chatIdentifier`、`to` のいずれか）。iOS／iPadOS／macOS 26+ の受信者はネイティブに表示して投票できます。古い OS バージョンでは「Sent a poll」というテキストのフォールバックが表示されます。`selectors.pollPayloadMessage` が必要です。
    - **poll-vote**: 既存の投票に投票します（`pollId` または `messageId`、および `pollOptionIndex`、`pollOptionId`、`pollOptionText` のうち正確に1つ）。`selectors.pollVoteMessage` と `poll.vote` RPC メソッドが必要です。

    受け入れられた受信投票は、質問、番号付きの選択肢ラベル、得票数、`poll-vote` に必要な投票メッセージ ID とともにエージェント向けに表示されます。

  </Accordion>

  <Accordion title="メッセージ ID">
    受信 iMessage のコンテキストには、利用可能な場合、短い `MessageSid` 値と完全なメッセージ GUID（`MessageSidFull`）の両方が含まれます。短い ID のスコープは、SQLite ベースの直近返信キャッシュに限定され、使用前に現在のチャットと照合されます。短い ID の有効期限が切れている場合や別のチャットに属している場合は、完全な `MessageSidFull` で再試行してください。

  </Accordion>

  <Accordion title="機能検出">
    OpenClaw は、キャッシュされたプローブ状態でブリッジが利用不可と判定された場合にのみ、プライベート API アクションを非表示にします。状態が不明な場合、アクションは引き続き表示され、実行時に遅延プローブが行われます。そのため、個別に手動で状態を更新しなくても、`imsg launch` 後の最初のアクションから成功できます。

  </Accordion>

  <Accordion title="既読通知と入力中表示">
    プライベート API ブリッジが稼働している場合、受け入れられた受信チャットは既読としてマークされ、ダイレクトチャットではターンが受け入れられるとすぐに、エージェントがコンテキストを準備して生成している間、入力中の吹き出しが表示されます。既読マークを無効にするには、次のように設定します:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    メソッドごとの機能リストより前の古い `imsg` ビルドでは、入力中表示と既読通知が通知なく無効になります。OpenClaw は、通知がない原因を特定できるよう、再起動ごとに1回警告をログに記録します。

  </Accordion>

  <Accordion title="受信 Tapback">
    OpenClaw は iMessage の Tapback を購読し、受け入れられたリアクションを通常のメッセージテキストではなくシステムイベントとしてルーティングします。そのため、ユーザーの Tapback によって通常の返信ループが発生することはありません。

    通知モードは `channels.imessage.reactionNotifications` で制御します:

    - `"own"`（デフォルト）: ユーザーがボット作成のメッセージにリアクションした場合のみ通知します。
    - `"all"`: 承認済みの送信者から受信したすべての Tapback を通知します。
    - `"off"`: 受信 Tapback を無視します。

    アカウントごとの上書きには `channels.imessage.accounts.<id>.reactionNotifications` を使用します。

  </Accordion>

  <Accordion title="承認リアクション（👍 / 👎）">
    `approvals.exec.enabled` または `approvals.plugin.enabled` が true で、リクエストが iMessage にルーティングされる場合、Gateway は承認プロンプトをネイティブに配信し、Tapback を受け付けて解決します:

    - `👍`（Like Tapback）→ `allow-once`
    - `👎`（Dislike Tapback）→ `deny`
    - `allow-always` は手動のフォールバックとして引き続き利用できます。通常の返信として `/approve <id> allow-always` を送信してください。

    リアクションの処理では、リアクションしたユーザーのハンドルが明示的な承認者である必要があります。承認者リストは `channels.imessage.allowFrom`（または `channels.imessage.accounts.<id>.allowFrom`）から読み取られます。ユーザーの電話番号を E.164 形式で追加するか、Apple ID のメールアドレスを追加してください（`chat_id:*` などのチャット宛先は、有効な承認者エントリではありません）。ワイルドカードエントリ `"*"` は有効ですが、すべての送信者が承認できるようになります。承認者リストが空の場合、リアクションによるショートカットは完全に無効になります。リアクションによるショートカットは、承認の解決で重要な唯一のゲートが明示的承認者の許可リストであるため、意図的に `reactionNotifications`、`dmPolicy`、`groupAllowFrom` を迂回します。

    `/approve` テキストコマンドの認可も同じリストに従います。`channels.imessage.allowFrom` が空でない場合、`/approve <id> <decision>` は、より広範な DM 許可リストではなく、その承認者リストに基づいて認可されます。DM 許可リストでは許可されていても `allowFrom` に含まれていない送信者には、明示的な拒否が返されます。`allowFrom` が空の場合は、同一チャットのフォールバックが引き続き有効になり、DM 許可リストで許可されたすべてのユーザーが `/approve` を実行できます。`/approve` またはリアクションによって承認する必要があるすべてのオペレーターを `allowFrom` に追加してください。

    オペレーター向けの注意事項:
    - リアクションの関連付けはメモリと Gateway の永続的なキー付きストアの両方に保存され（TTL は承認の有効期限と一致）、Gateway は保留中のプロンプトについても Tapback をポーリングします。そのため、Gateway の再起動直後に届いた Tapback でも承認を解決できます。
    - オペレーター自身の `is_from_me=true` Tapback（ペアリング済みの Apple デバイスからのものなど）は、そのハンドルが明示的な承認者であれば承認を解決します。
    - 承認プロンプトは、明示的な承認者が設定されている場合にのみグループ会話へルーティングされます。設定されていない場合、任意のグループメンバーが承認できてしまいます。
    - レガシーなテキスト形式の Tapback（非常に古い Apple クライアントからの `Liked "…"` プレーンテキスト）は、メッセージ GUID を含まないため、承認を解決できません。リアクションによる解決には、現在の macOS／iOS クライアントが生成する構造化された Tapback メタデータが必要です。

  </Accordion>
</AccordionGroup>

## 設定の書き込み

iMessage では、チャンネルから開始される設定の書き込みがデフォルトで許可されています（`commands.config: true` の場合の `/config set|unset`）。

無効化するには:

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

## 分割送信された DM の結合（1回の入力内のコマンドと URL）

ユーザーがコマンドと URL を一緒に入力した場合（例: `Dump https://example.com/article`）、Apple の Messages アプリは送信内容を**2つの別々の `chat.db` 行**に分割します:

1. テキストメッセージ（`"Dump"`）。
2. OG プレビュー画像を添付ファイルとして含む URL プレビューの吹き出し（`"https://..."`）。

ほとんどの環境では、2つの行は約0.8～2.0秒の間隔で OpenClaw に到着します。結合しない場合、エージェントはターン1でコマンドだけを受け取り、多くの場合、ターン2で URL が到着する前に「URL を送ってください」と返信します。これは Apple の送信パイプラインによるものであり、OpenClaw や `imsg` が発生させているものではありません。

`channels.imessage.coalesceSameSenderDms` は、DM で同じ送信者から連続する行をバッファリングするようオプトインします。ソース行のいずれかで `imsg` が構造的な URL プレビューマーカー `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` を公開する場合、OpenClaw は実際に分割送信されたものだけをマージし、バッファリングされたその他の行は別々のターンとして維持します。バルーンメタデータをまったく出力しない古い `imsg` ビルドでは、OpenClaw は分割送信と個別送信を区別できないため、フォールバックとしてバケットをマージします。これにより、`Dump <url>` の分割送信が 2 ターンに退行することなく、メタデータ導入前の動作が維持されます。複数ユーザーによるターン構造を維持するため、グループチャットでは引き続きメッセージ単位でディスパッチされます。

<Tabs>
  <Tab title="有効にする場合">
    次の場合に有効にします。

    - 1 つのメッセージ内に `command + payload` があることを想定する Skills（dump、paste、save、queue など）を提供している。
    - ユーザーがコマンドと一緒に URL を貼り付ける。
    - DM ターンに追加されるレイテンシー（下記参照）を許容できる。

    次の場合は無効のままにします。

    - 1 単語の DM トリガーでコマンドのレイテンシーを最小限にする必要がある。
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

    フラグがオンで、`messages.inbound.byChannel.imessage` またはグローバルな `messages.inbound.debounceMs` が明示的に設定されていない場合、デバウンスウィンドウは **7000 ms** に拡大されます（従来のデフォルトは 0 ms — デバウンスなし）。Messages.app がプレビュー行を出力する間、Apple の URL プレビュー分割送信の間隔が数秒に及ぶことがあるため、より広いウィンドウが必要です。

    ウィンドウを自身で調整するには、次のようにします。

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
    - **正確なマージには、現在の `imsg` ペイロードメタデータが必要です。** `balloon_bundle_id` が存在する場合、実際の分割送信だけがマージされます。前述のメタデータなしでのフォールバックマージは暫定的な後方互換性対応であり、`imsg` がアップストリームで分割送信を結合するようになった時点で削除されます。
    - **DM メッセージにレイテンシーが追加されます。** フラグがオンの場合、URL プレビュー行が届く可能性に備え、すべての DM（単独の制御コマンドや単一テキストの後続メッセージを含む）はディスパッチ前に最大でデバウンスウィンドウの時間だけ待機します。グループチャットのメッセージは引き続き即座にディスパッチされます。
    - **マージされた出力には上限があります。** マージされたテキストは、明示的な `…[truncated]` マーカーを付けて 4000 文字に制限されます。添付ファイルは 20 個、ソースエントリは 10 件が上限です（それを超える場合は最初と最新のものを保持）。ダウンストリームのテレメトリ用に、すべてのソース GUID が `coalescedMessageGuids` に記録されます。
    - **DM のみです。** 複数のユーザーが入力している場合でもボットの応答性を維持するため、グループチャットはメッセージ単位のディスパッチにフォールスルーします。
    - **チャンネル単位のオプトインです。** その他のチャンネル（Discord、Slack、Telegram、WhatsApp、…）には影響しません。`channels.bluebubbles.coalesceSameSenderDms` を設定している従来の BlueBubbles 構成では、その値を `channels.imessage.coalesceSameSenderDms` に移行する必要があります。

  </Tab>
</Tabs>

### シナリオとエージェントから見える内容

「フラグオン」列は、`balloon_bundle_id` を出力する `imsg` ビルドでの動作を示します。バルーンメタデータをまったく出力しない古い `imsg` ビルドでは、以下で「2 ターン」/「N ターン」と記載された行は、代わりに従来のマージ（1 ターン）へフォールバックします。OpenClaw は分割送信と個別送信を構造的に区別できないため、メタデータ導入前のマージ動作を維持します。ビルドがバルーンメタデータを出力するようになると、正確な分離が有効になります。

| ユーザーの入力                                                       | `chat.db` が生成する内容                  | フラグオフ（デフォルト）                         | フラグオン + ウィンドウ（imsg がバルーンメタデータを出力）                                              |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com`（1 回の送信）                              | 約 1 秒間隔の 2 行                   | エージェントの 2 ターン: 「Dump」のみ、その後 URL | 1 ターン: マージされたテキスト `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption`（添付ファイル + テキスト）                | URL バルーンメタデータのない 2 行 | 2 ターン                               | メタデータの観測後は 2 ターン。古い、またはラッチ前のメタデータなしセッションではマージされた 1 ターン       |
| `/status`（単独コマンド）                                     | 1 行                               | 即時ディスパッチ                        | **最大でウィンドウの時間だけ待機してからディスパッチ**                                                                |
| URL のみを貼り付け                                                   | 1 行                               | 即時ディスパッチ                        | 最大でウィンドウの時間だけ待機してからディスパッチ                                                                    |
| テキスト + URL を意図的に別々の 2 メッセージとして数分間隔で送信 | ウィンドウ外の 2 行               | 2 ターン                               | 2 ターン（その間にウィンドウが期限切れ）                                                             |
| 急速な大量送信（ウィンドウ内に 10 件超の短い DM）                          | URL バルーンメタデータのない N 行 | N ターン                                 | メタデータの観測後は N ターン。古い、またはラッチ前のメタデータなしセッションでは上限付きでマージされた 1 ターン |
| グループチャットで 2 人が入力                                         | M 人の送信者から N 行               | M+ ターン（送信者バケットごとに 1 つ）        | M+ ターン — グループチャットは結合されない                                                            |

## ブリッジまたは Gateway の再起動後の受信復旧

iMessage は Gateway の停止中に取りこぼしたメッセージを復旧すると同時に、Push 復旧後に Apple が一気に流す可能性のある古い「バックログ爆弾」を抑制します。デフォルト動作は常に有効で、受信重複排除を基盤としています。

- **リプレイ重複排除。** ディスパッチされた各受信メッセージは、Apple GUID を使用して永続 Plugin 状態（`imessage.inbound-dedupe`）に記録されます。取り込み時に確保され、処理後にコミットされます（一時的な失敗時には再試行できるよう解放されます）。すでに処理済みのものは、重複してディスパッチされず破棄されます。これにより、メッセージごとの記帳なしで復旧リプレイを積極的に実行できます。
- **停止期間の復旧。** 起動時にモニターは最後にディスパッチされた `chat.db` の rowid（アカウントごとに永続化されたカーソル）を記憶し、それを `since_rowid` として `imsg watch.subscribe` に渡します。これにより、imsg は Gateway の停止中に到着した行をリプレイしてから、ライブの追尾を開始します。リプレイは最新の 500 行および約 2 時間以内のメッセージに制限され、重複排除によって処理済みのものは破棄されます。
- **古いバックログの経過時間フェンス。** 起動境界より上の行は実際のライブメッセージです。そのうち送信日時が到着時刻より約 15 分以上古いものは、Push によって一気に流されたバックログとして抑制されます。リプレイされた行（境界以下）には、代わりにより広い復旧ウィンドウが適用されるため、最近取りこぼしたメッセージは配信され、古い履歴は配信されません。

`since_rowid` リプレイは同じ `imsg` RPC 接続上で実行されるため、復旧はローカルとリモートの両方の `cliPath` セットアップで機能します。違いはウィンドウです。Gateway が `chat.db` を読み取れる場合（ローカル）は、起動時の rowid 境界を基準とし、リプレイ範囲を制限して、最大数時間前までの取りこぼしたメッセージを配信します。リモート SSH `cliPath` 経由ではデータベースを読み取れないため、リプレイは無制限となり、すべての行にライブ経過時間フェンスが適用されます。それでも最近取りこぼしたメッセージは復旧され、古いバックログも抑制されますが、使用されるライブウィンドウはより狭くなります。より広い復旧ウィンドウを使用するには、Messages を実行している Mac 上で Gateway を実行してください。

### オペレーターに表示されるシグナル

抑制されたバックログはデフォルトレベルでログに記録され、暗黙に破棄されることはありません（`recovery` フラグはどちらのウィンドウが適用されたかを示します）。

```text
imessage: 古い受信バックログを抑制しました account=<id> sent=<iso> recovery=<bool>（起動後の抑制数: <N>）
```

### 移行

`channels.imessage.catchup.*` は非推奨です。停止期間の復旧は自動で行われ、新しいセットアップでは構成は不要です。`catchup.enabled: true` が設定された既存の構成は、復旧リプレイウィンドウの互換性プロファイルとして引き続き尊重されます。無効化された catchup ブロック（`enabled: false` または `enabled: true` の指定なし）は廃止され、`openclaw doctor --fix` によって削除されます。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="imsg が見つからない、または RPC がサポートされていない">
    バイナリと RPC サポートを検証します。

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    プローブで RPC がサポートされていないと報告された場合は、`imsg` を更新してください。プライベート API のアクションを使用できない場合は、ログイン中の macOS ユーザーセッションで `imsg launch` を実行してから、再度プローブしてください。Gateway が macOS 上で実行されていない場合は、デフォルトのローカル `imsg` パスではなく、前述の SSH 経由のリモート Mac セットアップを使用してください。

  </Accordion>

  <Accordion title="Messages は送信できるが、受信 iMessage が届かない">
    まず、メッセージがローカル Mac に到達したかどうかを確認します。`chat.db` が変化しない場合、`imsg status --json` が正常なブリッジを報告していても、OpenClaw はメッセージを受信できません。

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    電話から送信したメッセージで新しい行が作成されない場合は、OpenClaw の構成を変更する前に macOS Messages と Apple Push レイヤーを修復してください。多くの場合、サービスを 1 回更新するだけで十分です。

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    電話から新しい iMessage を送信し、新しい `chat.db` 行または `imsg watch` イベントを確認してから、OpenClaw セッションをデバッグしてください。これを定期的なブリッジ再起動ループとして実行しないでください。作業中に `imsg launch` と Gateway の再起動を繰り返すと、配信が中断され、処理中のチャンネル実行が取り残される可能性があります。

  </Accordion>

  <Accordion title="Gateway が macOS 上で実行されていない">
    デフォルトの `cliPath: "imsg"` は、Messages にサインインしている Mac 上で実行する必要があります。Linux または Windows では、`channels.imessage.cliPath` に、その Mac へ SSH 接続して `imsg "$@"` を実行するラッパースクリプトを設定してください。

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    次に実行します。

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DM が無視される">
    次を確認してください。

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - ペアリング承認（`openclaw pairing list imessage`）

  </Accordion>

  <Accordion title="グループメッセージが無視される">
    次を確認してください。

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` の許可リスト動作
    - メンションパターンの構成（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="リモート添付ファイルが失敗する">
    次を確認してください。

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - Gateway ホストからの SSH/SCP 鍵認証
    - Gateway ホスト上の `~/.ssh/known_hosts` にホスト鍵が存在すること
    - Messages を実行している Mac 上でリモートパスを読み取れること

  </Accordion>

  <Accordion title="macOS の権限プロンプトを見逃した">
    同じユーザー/セッションコンテキストの対話型 GUI ターミナルで再実行し、プロンプトを承認してください。

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    OpenClaw/`imsg` を実行するプロセスコンテキストに対して、フルディスクアクセスとオートメーションが許可されていることを確認してください。

  </Accordion>
</AccordionGroup>

## 設定リファレンスへのポインター

- [設定リファレンス - iMessage](/ja-JP/gateway/config-channels#imessage)
- [Gateway の設定](/ja-JP/gateway/configuration)
- [ペアリング](/ja-JP/channels/pairing)

## 関連項目

- [チャンネルの概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage) — 告知と移行の概要
- [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles) — 設定変換表と段階的な切り替え手順
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンション制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルとセキュリティ強化
