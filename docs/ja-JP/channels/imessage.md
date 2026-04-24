---
read_when:
    - iMessageサポートのセットアップ
    - iMessageの送受信のデバッグ
summary: imsg経由のレガシーなiMessageサポート（stdio上のJSON-RPC）。新規セットアップではBlueBubblesを使用してください。
title: iMessage
x-i18n:
    generated_at: "2026-04-24T04:46:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff2773ebcfced8834bc5d28378d9a6e3c20826cc0e08d6ea5480f8a5975fd8e3
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage（レガシー: imsg）

<Warning>
新しいiMessageデプロイでは、<a href="/ja-JP/channels/bluebubbles">BlueBubbles</a>を使用してください。

`imsg`連携はレガシーであり、将来のリリースで削除される可能性があります。
</Warning>

ステータス: レガシーな外部CLI連携。Gatewayは`imsg rpc`を起動し、stdio上のJSON-RPCで通信します（別個のデーモン/ポートは不要）。

<CardGroup cols={3}>
  <Card title="BlueBubbles (recommended)" icon="message-circle" href="/ja-JP/channels/bluebubbles">
    新しいセットアップ向けの推奨iMessage経路。
  </Card>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    iMessageのDMはデフォルトでペアリングモードです。
  </Card>
  <Card title="Configuration reference" icon="settings" href="/ja-JP/gateway/config-channels#imessage">
    iMessageの完全なフィールドリファレンス。
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

        ペアリングリクエストは1時間後に期限切れになります。
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClawはstdio互換の`cliPath`だけを必要とするため、`cliPath`を、リモートMacへSSH接続して`imsg`を実行するラッパースクリプトに向けることができます。

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
      remoteHost: "user@gateway-host", // SCPによる添付ファイル取得に使用
      includeAttachments: true,
      // 任意: 許可する添付ファイルルートを上書きします。
      // デフォルトには /Users/*/Library/Messages/Attachments が含まれます
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    `remoteHost`が設定されていない場合、OpenClawはSSHラッパースクリプトを解析して自動検出を試みます。
    `remoteHost`は`host`または`user@host`である必要があります（スペースやSSHオプションは不可）。
    OpenClawはSCPに厳格なホスト鍵検証を使用するため、リレーホストの鍵は事前に`~/.ssh/known_hosts`に存在している必要があります。
    添付ファイルパスは、許可されたルート（`attachmentRoots` / `remoteAttachmentRoots`）に対して検証されます。

  </Tab>
</Tabs>

## 要件と権限（macOS）

- `imsg`を実行するMacでMessagesにサインインしている必要があります。
- OpenClaw/`imsg`を実行するプロセスコンテキストには、フルディスクアクセスが必要です（Messages DBアクセス）。
- Messages.app経由でメッセージを送信するには、Automation権限が必要です。

<Tip>
権限はプロセスコンテキストごとに付与されます。gatewayをヘッドレス（LaunchAgent/SSH）で実行する場合は、同じコンテキストで一度対話的コマンドを実行してプロンプトを発生させてください。

```bash
imsg chats --limit 1
# または
imsg send <handle> "test"
```

</Tip>

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy`はダイレクトメッセージを制御します。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`allowFrom`に`"*"`が含まれている必要があります）
    - `disabled`

    許可リストフィールド: `channels.imessage.allowFrom`。

    許可リストのエントリには、ハンドルまたはチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用できます。

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy`はグループ処理を制御します。

    - `allowlist`（設定されている場合のデフォルト）
    - `open`
    - `disabled`

    グループ送信者許可リスト: `channels.imessage.groupAllowFrom`。

    実行時フォールバック: `groupAllowFrom`が未設定の場合、iMessageグループ送信者チェックは、利用可能であれば`allowFrom`にフォールバックします。
    実行時の注意: `channels.imessage`自体が完全に欠けている場合、実行時には`groupPolicy="allowlist"`にフォールバックし、警告を記録します（`channels.defaults.groupPolicy`が設定されていても同様です）。

    グループのメンションゲーティング:

    - iMessageにはネイティブのメンションメタデータがありません
    - メンション検出には正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは`messages.groupChat.mentionPatterns`）を使用します
    - パターンが設定されていない場合、メンションゲーティングは強制できません

    認可された送信者からの制御コマンドは、グループ内でメンションゲーティングをバイパスできます。

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DMはダイレクトルーティングを使用し、グループはグループルーティングを使用します。
    - デフォルトの`session.dmScope=main`では、iMessageのDMはエージェントのメインセッションに統合されます。
    - グループセッションは分離されます（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 返信は、発信元のチャネル/ターゲットメタデータを使用してiMessageへ戻されます。

    グループ風スレッドの動作:

    一部の複数参加者iMessageスレッドは、`is_group=false`で到着することがあります。
    その`chat_id`が`channels.imessage.groups`で明示的に設定されている場合、OpenClawはそれをグループトラフィックとして扱います（グループゲーティング + グループセッション分離）。

  </Tab>
</Tabs>

## ACP会話バインディング

レガシーiMessageチャットはACPセッションにもバインドできます。

高速なオペレーターフロー:

- DMまたは許可されたグループチャット内で`/acp spawn codex --bind here`を実行します。
- 同じiMessage会話内の今後のメッセージは、起動されたACPセッションへルーティングされます。
- `/new`と`/reset`は、同じバインド済みACPセッションをその場でリセットします。
- `/acp close`はACPセッションを閉じ、バインディングを削除します。

設定済みの永続バインディングは、トップレベルの`bindings[]`エントリで`type: "acp"`および`match.channel: "imessage"`を通じてサポートされます。

`match.peer.id`には以下を使用できます。

- `+15555550123`や`user@example.com`のような正規化済みDMハンドル
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

共有のACPバインディング動作については、[ACP Agents](/ja-JP/tools/acp-agents)を参照してください。

## デプロイパターン

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    ボットトラフィックを個人のMessagesプロファイルから分離するため、専用のApple IDとmacOSユーザーを使用してください。

    一般的な流れ:

    1. 専用のmacOSユーザーを作成してサインインする。
    2. そのユーザーで、ボット用Apple IDでMessagesにサインインする。
    3. そのユーザーに`imsg`をインストールする。
    4. OpenClawがそのユーザーコンテキストで`imsg`を実行できるようにSSHラッパーを作成する。
    5. `channels.imessage.accounts.<id>.cliPath`と`.dbPath`をそのユーザープロファイルに向ける。

    初回実行では、そのボットユーザーセッションでGUI承認（Automation + フルディスクアクセス）が必要になる場合があります。

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    一般的なトポロジー:

    - gatewayはLinux/VM上で実行
    - iMessage + `imsg`はtailnet内のMac上で実行
    - `cliPath`ラッパーはSSHを使用して`imsg`を実行
    - `remoteHost`はSCPによる添付ファイル取得を有効化

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

    SSHとSCPの両方が非対話になるよう、SSH鍵を使用してください。
    まずホスト鍵が信頼済みであることを確認してください（例: `ssh bot@mac-mini.tailnet-1234.ts.net`）。これにより`known_hosts`が埋まります。

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessageは`channels.imessage.accounts`以下のアカウントごとの設定をサポートします。

    各アカウントは、`cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、履歴設定、添付ファイルルート許可リストなどのフィールドを上書きできます。

  </Accordion>
</AccordionGroup>

## メディア、チャンク化、配信先

<AccordionGroup>
  <Accordion title="Attachments and media">
    - 受信添付ファイルの取り込みは任意です: `channels.imessage.includeAttachments`
    - `remoteHost`が設定されている場合、リモート添付ファイルパスはSCPで取得できます
    - 添付ファイルパスは許可されたルートに一致する必要があります:
      - `channels.imessage.attachmentRoots`（ローカル）
      - `channels.imessage.remoteAttachmentRoots`（リモートSCPモード）
      - デフォルトのルートパターン: `/Users/*/Library/Messages/Attachments`
    - SCPは厳格なホスト鍵検証を使用します（`StrictHostKeyChecking=yes`）
    - 送信メディアサイズには`channels.imessage.mediaMaxMb`を使用します（デフォルト16 MB）
  </Accordion>

  <Accordion title="Outbound chunking">
    - テキストチャンク上限: `channels.imessage.textChunkLimit`（デフォルト4000）
    - チャンクモード: `channels.imessage.chunkMode`
      - `length`（デフォルト）
      - `newline`（段落優先の分割）
  </Accordion>

  <Accordion title="Addressing formats">
    推奨される明示的ターゲット:

    - `chat_id:123`（安定したルーティングに推奨）
    - `chat_guid:...`
    - `chat_identifier:...`

    ハンドルターゲットもサポートされます。

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## 設定の書き込み

iMessageでは、チャネル起点の設定書き込みがデフォルトで許可されています（`commands.config: true`時の`/config set|unset`用）。

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

## トラブルシューティング

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    バイナリとRPCサポートを検証してください。

```bash
imsg rpc --help
openclaw channels status --probe
```

    プローブでRPC未対応と報告される場合は、`imsg`を更新してください。

  </Accordion>

  <Accordion title="DMs are ignored">
    次を確認してください。

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - ペアリング承認（`openclaw pairing list imessage`）

  </Accordion>

  <Accordion title="Group messages are ignored">
    次を確認してください。

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups`の許可リスト動作
    - メンションパターン設定（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="Remote attachments fail">
    次を確認してください。

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - gatewayホストからのSSH/SCP鍵認証
    - gatewayホスト上の`~/.ssh/known_hosts`にホスト鍵が存在する
    - Messagesを実行しているMac上でリモートパスが読み取り可能である

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    同じユーザー/セッションコンテキストの対話的GUIターミナルで再実行し、プロンプトを承認してください。

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    OpenClaw/`imsg`を実行するプロセスコンテキストに、フルディスクアクセスとAutomationが付与されていることを確認してください。

  </Accordion>
</AccordionGroup>

## 設定リファレンスへのリンク

- [Configuration reference - iMessage](/ja-JP/gateway/config-channels#imessage)
- [Gateway configuration](/ja-JP/gateway/configuration)
- [Pairing](/ja-JP/channels/pairing)
- [BlueBubbles](/ja-JP/channels/bluebubbles)

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャネル
- [Pairing](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
