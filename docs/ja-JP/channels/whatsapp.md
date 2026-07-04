---
read_when:
    - WhatsApp/Webチャネルの動作またはインボックスルーティングに取り組む
summary: WhatsApp チャネルのサポート、アクセス制御、配信動作、運用
title: WhatsApp
x-i18n:
    generated_at: "2026-07-04T10:26:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a968c08c461708fb4b8cabe4528af2514b0a5768d272abab8f88e36e24bde302
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: WhatsApp Web (Baileys) 経由で本番利用可能。Gateway がリンク済みセッションを所有する。

## インストール（オンデマンド）

- オンボーディング（`openclaw onboard`）と `openclaw channels add --channel whatsapp` は、
  初回選択時に WhatsApp Plugin のインストールを促す。
- `openclaw channels login --channel whatsapp` も、Plugin がまだ存在しない場合は
  インストールフローを提示する。
- Dev チャネル + git チェックアウト: ローカル Plugin パスがデフォルト。
- Stable/Beta: まず ClawHub から公式 `@openclaw/whatsapp` Plugin をインストールし、
  フォールバックとして npm を使う。
- WhatsApp ランタイムは中核の OpenClaw npm パッケージの外で配布されるため、
  WhatsApp 固有のランタイム依存関係は外部 Plugin 側に残る。

手動インストールも引き続き利用できる:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

ベア npm パッケージ（`@openclaw/whatsapp`）は、レジストリの
フォールバックが必要な場合にのみ使う。再現可能なインストールが必要な場合にのみ、正確なバージョンを固定する。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    不明な送信者に対するデフォルトの DM ポリシーはペアリング。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断と修復プレイブック。
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャネル設定パターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="Configure WhatsApp access policy">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Link WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    現在のログインは QR ベース。リモート環境またはヘッドレス環境では、ログインを開始する前に、
    ライブ QR コードをスキャンする電話へ確実に届ける経路があることを確認する。

    特定のアカウントの場合:

```bash
openclaw channels login --channel whatsapp --account work
```

    ログイン前に既存またはカスタムの WhatsApp Web 認証ディレクトリをアタッチするには:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Start the gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approve first pairing request (if using pairing mode)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    ペアリングリクエストは 1 時間後に期限切れになる。保留中のリクエストはチャネルごとに 3 件まで。

  </Step>
</Steps>

<Note>
OpenClaw は、可能な場合は WhatsApp を別番号で実行することを推奨する。（チャネルメタデータとセットアップフローはその構成に最適化されているが、個人番号の構成もサポートされる。）
</Note>

<Warning>
現在の WhatsApp セットアップフローは QR のみ。ターミナルに描画された QR、スクリーンショット、
PDF、チャット添付は、リモートマシンから中継される間に期限切れになったり、読み取れなくなったりする場合がある。
リモート/ヘッドレスホストでは、手動のターミナルキャプチャよりも直接的な QR 画像の
受け渡し経路を優先する。
</Warning>

## MeowCaller で現在のリクエスト送信者に発信する（実験的）

WhatsApp Plugin は、WhatsApp 起点のエージェントターンで `whatsapp_call` を公開できる。このツールは
[MeowCaller](https://github.com/purpshell/meowcaller) を使い、現在の認可済みリクエスト送信者へ WhatsApp 音声通話を発信し、
相手が応答した後に OpenClaw TTS メッセージを再生する。このツールは
宛先番号を受け付けないため、プロンプトで通話を第三者へリダイレクトすることはできない。
この実験的機能はデフォルトで無効。

<Warning>
MeowCaller は実験的で、タグ付きリリースはなく、別途ペアリングされた whatsmeow
リンク済みデバイスセッションを使う。WhatsApp Plugin の Baileys 認証情報を再利用することはできない。
ペアリングにより、同じ WhatsApp アカウントに別のリンク済みデバイスが追加される。
OpenClaw で使用している WhatsApp ID でスキャンする。個人番号/自分宛てチャットモードでは自分自身に発信できない。
個人番号へ発信するには専用の OpenClaw 番号を使う。
</Warning>

<Steps>
  <Step title="Enable experimental calls">

    WhatsApp チャネルの `openclaw.json` に `actions.calls: true` を追加する:

```json
{
  "channels": {
    "whatsapp": {
      "actions": {
        "calls": true
      }
    }
  }
}
```

    これを既存の WhatsApp 設定にマージし、Gateway を再起動する。
    設定が存在しない、または `false` の場合、OpenClaw は `whatsapp_call` ツールをエージェントに公開しない。

  </Step>

  <Step title="Install the reviewed MeowCaller CLI">

    アダプターは、Gateway ホストの `PATH` 上に `meowcaller` という名前の実行可能ファイルがあることを想定する。
    [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) がマージされるまでは、
    コミット `752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f` のレビュー済みブランチをビルドする:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    `$HOME/.local/bin` が Gateway サービスの `PATH` にも含まれていることを確認する。このリビジョンは、
    明示的な `pair` コマンドと送信専用の `notify` コマンドを提供する。`notify` は、マイク、スピーカー、
    ビデオデバイス、受信音声シンク、診断キャプチャを開かない。サンプル
    CLI の `play` コマンドで代替しない。

  </Step>

  <Step title="Pair the MeowCaller linked device">

    WhatsApp エージェントに通話セットアップを確認するよう依頼する。`whatsapp_call` ステータスアクションは、
    アカウント固有の状態ディレクトリとペアリングコマンドを報告する。デフォルトアカウントの場合:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    コマンドは対話型ターミナルで実行する。**WhatsApp > Linked devices** から QR をスキャンし、
    `MeowCaller linked device ready` を待つ。その後、コマンドは終了する。`wa-voip.db` は
    MeowCaller のリンク済みデバイスセッションなので非公開に保つ。デフォルト以外のアカウントを使う場合、
    `whatsapp_call` ステータスアクションはアカウント固有のコマンドとシェルを返す。
    Windows では、その PowerShell コマンドを実行する。MeowCaller がストアディレクトリを作成する。

  </Step>

  <Step title="Configure TTS and call from WhatsApp">

    電話向け機能に対応した [TTS プロバイダー](/ja-JP/tools/tts) を設定し、Gateway を再起動してから、
    `Call me and say the build finished.` のような WhatsApp リクエストを送信する。このツールは信頼済みの受信コンテキストから送信者を解決し、
    一時的な非公開 WAV ファイルを合成し、制限付きの通話ウィンドウで MeowCaller を実行し、
    その後に音声ファイルを削除する。OpenClaw はアカウントのストアを明示的に渡し、
    応答、再生、切断後のゼロ終了ステータスを待機し、タイムアウトまたは非ゼロ終了を
    失敗したツール呼び出しとして扱う。

  </Step>
</Steps>

現在の制限:

- 1 対 1 の発信音声通話のみ
- 任意の宛先番号は不可
- チャット接続との認証共有なし
- 個人番号/自分宛てチャットモードからの自己通話なし
- 合成音声は 60 秒に制限
- MeowCaller の応答/再生/切断完了以外に、端末側で聞こえたことの受領通知はなし
- OpenClaw は、MeowCaller の接続、応答、再生、シャットダウンの各フェーズを含む
  115〜175 秒の制限付きウィンドウ後にコンパニオンプロセスを停止する

## デプロイパターン

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    これは最もクリーンな運用モード:

    - OpenClaw 用の独立した WhatsApp ID
    - より明確な DM 許可リストとルーティング境界
    - 自分宛てチャットの混乱が起きる可能性が低い

    最小限のポリシーパターン:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Personal-number fallback">
    オンボーディングは個人番号モードをサポートし、自分宛てチャットに適したベースラインを書き込む:

    - `dmPolicy: "allowlist"`
    - `allowFrom` に個人番号を含める
    - `selfChatMode: true`

    ランタイムでは、自分宛てチャットの保護はリンク済みの自分の番号と `allowFrom` をキーにする。

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    メッセージングプラットフォームチャネルは、現在の OpenClaw チャネルアーキテクチャでは WhatsApp Web ベース（`Baileys`）。

    組み込みのチャットチャネルレジストリには、別個の Twilio WhatsApp メッセージングチャネルはない。

  </Accordion>
</AccordionGroup>

## ランタイムモデル

- Gateway が WhatsApp ソケットと再接続ループを所有する。
- 再接続ウォッチドッグは、受信アプリメッセージ量だけでなく WhatsApp Web トランスポートアクティビティも使うため、静かなリンク済みデバイスセッションは、最近誰もメッセージを送信していないという理由だけで再起動されることはない。より長いアプリケーション無音上限は、トランスポートフレームが届き続けていてもウォッチドッグウィンドウ内でアプリケーションメッセージが処理されない場合に、なお再接続を強制する。最近アクティブだったセッションの一時的な再接続後は、そのアプリケーション無音チェックは最初の復旧ウィンドウに通常のメッセージタイムアウトを使う。
- Baileys ソケットのタイミングは `web.whatsapp.*` 配下で明示される: `keepAliveIntervalMs` は WhatsApp Web アプリケーション ping を制御し、`connectTimeoutMs` は開始ハンドシェイクのタイムアウトを制御し、`defaultQueryTimeoutMs` は Baileys クエリ待機に加えて OpenClaw のローカル送信/プレゼンスと受信既読通知操作の上限を制御する。
- 送信には対象アカウントのアクティブな WhatsApp リスナーが必要。
- グループ送信では、テキストとメディアキャプション内の `@+<digits>` および `@<digits>` トークンが、LID ベースのグループを含む現在の WhatsApp 参加者メタデータに一致する場合、ネイティブメンションメタデータを添付する。
- ステータスとブロードキャストチャットは無視される（`@status`、`@broadcast`）。
- 再接続ウォッチドッグは、受信アプリメッセージ量だけでなく WhatsApp Web トランスポートアクティビティに従う。静かなリンク済みデバイスセッションはトランスポートフレームが続く間は維持されるが、トランスポート停止時には後続のリモート切断経路よりかなり前に再接続を強制する。
- ダイレクトチャットは DM セッションルール（`session.dmScope`; デフォルトの `main` は DM をエージェントのメインセッションにまとめる）を使う。
- グループセッションは分離される（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Channels/Newsletters は、ネイティブの `@newsletter` JID を持つ明示的な送信先にできる。ニュースレター送信は、DM セッションセマンティクスではなくチャネルセッションメタデータ（`agent:<agentId>:whatsapp:channel:<jid>`）を使う。
- WhatsApp Web トランスポートは Gateway ホスト上の標準プロキシ環境変数（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` / 小文字バリアント）を尊重する。チャネル固有の WhatsApp プロキシ設定よりもホストレベルのプロキシ設定を優先する。
- `messages.removeAckAfterReply` が有効な場合、OpenClaw は可視の返信が配信された後に WhatsApp の ack リアクションをクリアする。

## 承認プロンプト

WhatsApp は、`👍` / `👎` リアクションで exec と Plugin の承認プロンプトを表示できる。配信は
トップレベルの承認転送設定によって制御される:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec` と `approvals.plugin` は独立している。WhatsApp をチャネルとして有効にしても
トランスポートがリンクされるだけであり、一致する承認ファミリーが有効化され
WhatsApp にルーティングされない限り、承認プロンプトは送信されない。
セッションモードは、WhatsApp から発生した承認にのみネイティブ絵文字承認を配信する。
ターゲットモードは、明示的な WhatsApp ターゲットに共有転送パイプラインを使い、
別個の承認者 DM ファンアウトは作成しない。

WhatsApp 承認リアクションには、`allowFrom` または `"*"` からの明示的な WhatsApp 承認者が必要。
`defaultTo` は通常のデフォルトメッセージターゲットを制御するものであり、承認の承認者ではない。手動の
`/approve` コマンドは、承認解決の前に通常の WhatsApp 送信者認可経路を引き続き通過する。

## Plugin フックとプライバシー

WhatsApp の受信メッセージには、個人のメッセージ内容、電話番号、
グループ識別子、送信者名、セッション相関フィールドが含まれる場合があります。そのため、
明示的にオプトインしない限り、WhatsApp は受信 `message_received` フックペイロードを plugins にブロードキャストしません。

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

オプトインは 1 つのアカウントに限定できます。

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

受信 WhatsApp メッセージの内容と識別子を受け取っても信頼できる plugins に対してのみ、これを有効にしてください。

## アクセス制御と有効化

<Tabs>
  <Tab title="DM ポリシー">
    `channels.whatsapp.dmPolicy` はダイレクトチャットアクセスを制御します。

    - `pairing` (デフォルト)
    - `allowlist`
    - `open` (`allowFrom` に `"*"` を含める必要があります)
    - `disabled`

    `allowFrom` は E.164 形式の番号を受け付けます (内部で正規化されます)。

    `allowFrom` は DM 送信者のアクセス制御リストです。WhatsApp グループ JID や `@newsletter` チャンネル JID への明示的な送信は制限しません。

    複数アカウントのオーバーライド: `channels.whatsapp.accounts.<id>.dmPolicy` (および `allowFrom`) は、そのアカウントについてチャンネルレベルのデフォルトより優先されます。

    ランタイム動作の詳細:

    - ペアリングはチャンネルの許可ストアに永続化され、設定済みの `allowFrom` とマージされます
    - スケジュール済み自動化と Heartbeat 受信者フォールバックは、明示的な配信ターゲットまたは設定済みの `allowFrom` を使用します。DM ペアリング承認は暗黙の cron や Heartbeat 受信者にはなりません
    - allowlist が設定されていない場合、リンク済みの自分の番号がデフォルトで許可されます
    - OpenClaw は送信 `fromMe` DM (リンク済みデバイスから自分自身に送るメッセージ) を自動ペアリングしません

  </Tab>

  <Tab title="グループポリシー + allowlists">
    グループアクセスには 2 つの層があります。

    1. **グループメンバーシップ allowlist** (`channels.whatsapp.groups`)
       - `groups` が省略されている場合、すべてのグループが対象になります
       - `groups` が存在する場合、グループ allowlist として機能します (`"*"` が許可されます)

    2. **グループ送信者ポリシー** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: 送信者 allowlist をバイパスします
       - `allowlist`: 送信者が `groupAllowFrom` (または `*`) と一致する必要があります
       - `disabled`: すべてのグループ受信をブロックします

    送信者 allowlist フォールバック:

    - `groupAllowFrom` が未設定の場合、利用可能であればランタイムは `allowFrom` にフォールバックします
    - 送信者 allowlists はメンション/返信による有効化の前に評価されます

    注: `channels.whatsapp` ブロックがまったく存在しない場合、`channels.defaults.groupPolicy` が設定されていても、ランタイムのグループポリシーフォールバックは `allowlist` (警告ログ付き) です。

  </Tab>

  <Tab title="メンション + /activation">
    グループ返信では、デフォルトでメンションが必要です。

    メンション検出には次が含まれます。

    - bot アイデンティティへの明示的な WhatsApp メンション
    - 設定済みのメンション正規表現パターン (`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`)
    - 承認済みグループメッセージの受信ボイスノート文字起こし
    - bot への返信の暗黙的な検出 (返信送信者が bot アイデンティティと一致)

    セキュリティ上の注意:

    - 引用/返信はメンション制限を満たすだけです。送信者への承認は**付与しません**
    - `groupPolicy: "allowlist"` の場合、allowlist に含まれない送信者は、allowlist に含まれるユーザーのメッセージに返信しても引き続きブロックされます

    セッションレベルの有効化コマンド:

    - `/activation mention`
    - `/activation always`

    `activation` はセッション状態を更新します (グローバル設定ではありません)。これは所有者によって制限されます。

  </Tab>
</Tabs>

## 設定済み ACP バインディング

WhatsApp は、トップレベルの `bindings[]` エントリによる永続的な ACP バインディングをサポートします。

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

- ダイレクトチャットは `+15555550123` のような E.164 番号に一致します。
- グループは `120363424282127706@g.us` のような WhatsApp グループ JID に一致します。
- OpenClaw が設定済み ACP セッションの存在を保証する前に、グループ allowlists、送信者ポリシー、メンションまたは有効化の制限が実行されます。
- 一致した設定済み ACP バインディングがルートを所有します。WhatsApp ブロードキャストグループは、そのターンを通常の WhatsApp セッションへファンアウトしません。

## 個人番号と自分宛てチャットの動作

リンク済みの自分の番号が `allowFrom` にも存在する場合、WhatsApp の自分宛てチャット保護が有効になります。

- 自分宛てチャットのターンでは既読通知をスキップします
- 自分自身に ping してしまうメンション JID の自動トリガー動作を無視します
- `messages.responsePrefix` が未設定の場合、自分宛てチャットの返信はデフォルトで `[{identity.name}]` または `[openclaw]` になります

## メッセージ正規化とコンテキスト

<AccordionGroup>
  <Accordion title="受信エンベロープ + 返信コンテキスト">
    受信 WhatsApp メッセージは共有受信エンベロープでラップされます。

    引用返信が存在する場合、コンテキストは次の形式で追加されます。

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    利用可能な場合、返信メタデータフィールドも入力されます (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, 送信者 JID/E.164)。
    引用返信の対象がダウンロード可能なメディアの場合、OpenClaw はそれを
    通常の受信メディアストア経由で保存し、`MediaPath`/`MediaType` として公開するため、
    agent は `<media:image>` だけを見るのではなく、参照された画像を検査できます。

  </Accordion>

  <Accordion title="メディアプレースホルダーと位置情報/連絡先抽出">
    メディアのみの受信メッセージは、次のようなプレースホルダーで正規化されます。

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    承認済みグループのボイスノートは、本文が `<media:audio>` のみの場合、
    メンション制限の前に文字起こしされるため、ボイスノート内で bot をメンションすると
    返信をトリガーできます。文字起こしにまだ bot へのメンションが含まれていない場合、
    生のプレースホルダーではなく、文字起こしが保留中のグループ履歴に保持されます。

    位置情報の本文は簡潔な座標テキストを使用します。位置情報ラベル/コメントと連絡先/vCard 詳細は、インラインのプロンプトテキストではなく、フェンス付きの信頼されないメタデータとしてレンダリングされます。

  </Accordion>

  <Accordion title="保留中のグループ履歴注入">
    グループでは、未処理のメッセージをバッファリングし、bot が最終的にトリガーされたときにコンテキストとして注入できます。

    - デフォルト制限: `50`
    - 設定: `channels.whatsapp.historyLimit`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効化

    注入マーカー:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="既読通知">
    受け付けられた受信 WhatsApp メッセージでは、既読通知がデフォルトで有効です。

    グローバルに無効化:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    アカウントごとのオーバーライド:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    自分宛てチャットのターンでは、グローバルに有効であっても既読通知をスキップします。

  </Accordion>
</AccordionGroup>

## 配信、チャンク化、メディア

<AccordionGroup>
  <Accordion title="テキストのチャンク化">
    - デフォルトのチャンク制限: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` モードは段落境界 (空行) を優先し、その後、長さに対して安全なチャンク化にフォールバックします

  </Accordion>

  <Accordion title="送信メディアの動作">
    - 画像、動画、音声 (PTT ボイスノート)、ドキュメントペイロードをサポートします
    - 音声メディアは Baileys の `audio` ペイロードに `ptt: true` を付けて送信されるため、WhatsApp クライアントではプッシュトゥトークのボイスノートとしてレンダリングされます
    - 返信ペイロードは `audioAsVoice` を保持します。WhatsApp 向けの TTS ボイスノート出力は、プロバイダーが MP3 または WebM を返した場合でも、この PTT パスに留まります
    - ネイティブ Ogg/Opus 音声は、ボイスノート互換性のために `audio/ogg; codecs=opus` として送信されます
    - Microsoft Edge TTS の MP3/WebM 出力を含む非 Ogg 音声は、PTT 配信の前に `ffmpeg` で 48 kHz モノラル Ogg/Opus にトランスコードされます
    - `/tts latest` は最新のアシスタント返信を 1 つのボイスノートとして送信し、同じ返信の重複送信を抑制します。`/tts chat on|off|default` は現在の WhatsApp チャットの自動 TTS を制御します
    - アニメーション GIF 再生は、動画送信時の `gifPlayback: true` でサポートされます
    - `forceDocument` / `asDocument` は、WhatsApp のメディア圧縮を避けながら解決済みファイル名と MIME タイプを保持するため、送信画像、GIF、動画を Baileys のドキュメントペイロード経由で送信します
    - 複数メディアの返信ペイロードを送信する場合、キャプションは最初のメディア項目に適用されます。ただし、PTT ボイスノートでは音声を先に送信し、表示テキストを別に送信します。WhatsApp クライアントがボイスノートのキャプションを一貫してレンダリングしないためです
    - メディアソースには HTTP(S)、`file://`、またはローカルパスを使用できます

  </Accordion>

  <Accordion title="メディアサイズ制限とフォールバック動作">
    - 受信メディア保存上限: `channels.whatsapp.mediaMaxMb` (デフォルト `50`)
    - 送信メディア送信上限: `channels.whatsapp.mediaMaxMb` (デフォルト `50`)
    - アカウントごとのオーバーライドは `channels.whatsapp.accounts.<accountId>.mediaMaxMb` を使用します
    - `forceDocument` / `asDocument` がドキュメント配信を要求しない限り、画像は制限内に収まるよう自動最適化 (リサイズ/品質スイープ) されます
    - メディア送信に失敗した場合、最初の項目のフォールバックはレスポンスを黙って破棄するのではなく、警告テキストを送信します

  </Accordion>
</AccordionGroup>

## 返信引用

WhatsApp はネイティブの返信引用をサポートしており、送信返信で受信メッセージが視覚的に引用されます。`channels.whatsapp.replyToMode` で制御します。

| 値          | 動作                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | 引用しません。通常のメッセージとして送信します                        |
| `"first"`   | 最初の送信返信チャンクのみ引用します                                  |
| `"all"`     | すべての送信返信チャンクを引用します                                  |
| `"batched"` | キューに入ったバッチ返信を引用し、即時返信は引用しないままにします    |

デフォルトは `"off"` です。アカウントごとのオーバーライドは `channels.whatsapp.accounts.<id>.replyToMode` を使用します。

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## リアクションレベル

`channels.whatsapp.reactionLevel` は、agent が WhatsApp 上で絵文字リアクションをどの程度広く使用するかを制御します。

| レベル        | 確認リアクション | agent 起点のリアクション | 説明                                           |
| ------------- | ---------------- | ------------------------ | ---------------------------------------------- |
| `"off"`       | いいえ           | いいえ                   | リアクションを一切使用しません                 |
| `"ack"`       | はい             | いいえ                   | 確認リアクションのみ (返信前の受領確認)        |
| `"minimal"`   | はい             | はい (控えめ)            | 確認 + 控えめなガイダンスによる agent リアクション |
| `"extensive"` | はい             | はい (推奨)              | 確認 + 推奨ガイダンスによる agent リアクション |

デフォルト: `"minimal"`。

アカウントごとのオーバーライドは `channels.whatsapp.accounts.<id>.reactionLevel` を使用します。

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## 確認リアクション

WhatsApp は `channels.whatsapp.ackReaction` による受信時の即時確認リアクションをサポートします。
確認リアクションは `reactionLevel` によって制限されます。`reactionLevel` が `"off"` の場合は抑制されます。

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

動作メモ:

- インバウンドが受け付けられた直後に送信される（返信前）
- `ackReaction` が `emoji` なしで存在する場合、WhatsApp はルーティング先エージェントの識別絵文字を使用し、なければ "👀" にフォールバックする。ACKリアクションを送信しない場合は `ackReaction` を省略するか、`emoji: ""` を設定する
- 失敗はログに記録されるが、通常の返信配信はブロックしない
- グループモード `mentions` はメンションでトリガーされたターンにリアクションする。グループ有効化 `always` はこのチェックのバイパスとして機能する
- WhatsApp は `channels.whatsapp.ackReaction` を使用する（レガシーの `messages.ackReaction` はここでは使用されない）

## ライフサイクルステータスリアクション

静的な受領絵文字を残す代わりに、ターン中に WhatsApp が ACKリアクションを置き換えられるようにするには、`messages.statusReactions.enabled: true` を設定します。有効にすると、OpenClaw はキュー投入、思考中、ツールアクティビティ、Compaction、完了、エラーなどのライフサイクル状態に同じインバウンドメッセージのリアクション枠を使用します。

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

動作メモ:

- `channels.whatsapp.ackReaction` は、ステータスリアクションをダイレクトメッセージとグループで使用できるかどうかを引き続き制御する。
- キュー投入ステータスリアクションは、通常のACKリアクションと同じ有効なACK絵文字を使用する。
- WhatsApp にはメッセージごとにボットのリアクション枠が1つあるため、ライフサイクル更新は現在のリアクションをその場で置き換える。
- `messages.removeAckAfterReply: true` は、設定された完了/エラー保持時間の後に最終ステータスリアクションをクリアする。
- ツール絵文字カテゴリには、`tool`、`coding`、`web`、`deploy`、`build`、`concierge` が含まれる。

## 複数アカウントと認証情報

<AccordionGroup>
  <Accordion title="アカウント選択とデフォルト">
    - アカウントIDは `channels.whatsapp.accounts` から取得される
    - デフォルトのアカウント選択: `default` が存在する場合はそれ、それ以外は最初に設定されたアカウントID（ソート済み）
    - アカウントIDは検索用に内部で正規化される

  </Accordion>

  <Accordion title="認証情報パスとレガシー互換性">
    - 現在の認証パス: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - バックアップファイル: `creds.json.bak`
    - `~/.openclaw/credentials/` 内のレガシーデフォルト認証は、デフォルトアカウントのフローでは引き続き認識/移行される

  </Accordion>

  <Accordion title="ログアウト動作">
    `openclaw channels logout --channel whatsapp [--account <id>]` は、そのアカウントの WhatsApp 認証状態をクリアします。

    Gateway に到達できる場合、ログアウトはまず選択したアカウントのライブ WhatsApp リスナーを停止し、リンク済みセッションが次回再起動までメッセージを受信し続けないようにします。`openclaw channels remove --channel whatsapp` も、アカウント設定を無効化または削除する前にライブリスナーを停止します。

    レガシー認証ディレクトリでは、Baileys 認証ファイルが削除される一方で `oauth.json` は保持されます。

  </Accordion>
</AccordionGroup>

## ツール、アクション、設定書き込み

- エージェントのツールサポートには WhatsApp リアクションアクション（`react`）が含まれる。
- アクションゲート:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- チャンネル起点の設定書き込みはデフォルトで有効です（`channels.whatsapp.configWrites=false` で無効化）。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="リンクされていない（QRが必要）">
    症状: チャンネルステータスがリンクされていないと報告する。

    修正:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="リンク済みだが切断されている / 再接続ループ">
    症状: リンク済みアカウントで切断または再接続試行が繰り返される。

    通信の少ないアカウントは通常のメッセージタイムアウトを超えて接続を維持できます。ウォッチドッグは、WhatsApp Web トランスポートアクティビティが停止したとき、ソケットが閉じたとき、またはアプリケーションレベルのアクティビティがより長い安全ウィンドウを超えて無音のままになったときに再起動します。

    ログに `status=408 Request Time-out Connection was lost` が繰り返し表示される場合は、`web.whatsapp` 配下の Baileys ソケットタイミングを調整します。まず、`keepAliveIntervalMs` をネットワークのアイドルタイムアウトより短くし、遅いリンクや損失の多いリンクでは `connectTimeoutMs` を増やします。

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    修正:

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    ホスト接続性とタイミングを修正してもループが続く場合は、アカウント認証ディレクトリをバックアップし、そのアカウントを再リンクします。

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    `~/.openclaw/logs/whatsapp-health.log` に `Gateway inactive` と表示される一方で、`openclaw gateway status` と `openclaw channels status --probe` が Gateway と WhatsApp は正常と示す場合は、`openclaw doctor` を実行します。Linux では、doctor は `~/.openclaw/bin/ensure-whatsapp.sh` をまだ呼び出しているレガシー crontab エントリについて警告します。cron には systemd ユーザーバス環境がない場合があり、古いスクリプトが Gateway の健全性を誤って報告することがあるため、`crontab -e` でそれらの古いエントリを削除してください。

    必要に応じて、`channels login` で再リンクします。

  </Accordion>

  <Accordion title="プロキシ背後でQRログインがタイムアウトする">
    症状: `openclaw channels login --channel whatsapp` が、使用可能なQRコードを表示する前に `status=408 Request Time-out` または TLS ソケット切断で失敗する。

    WhatsApp Web ログインは、Gateway ホストの標準プロキシ環境（`HTTPS_PROXY`、`HTTP_PROXY`、小文字のバリアント、`NO_PROXY`）を使用します。Gateway プロセスがプロキシ環境変数を継承していること、および `NO_PROXY` が `mmg.whatsapp.net` に一致していないことを確認してください。

  </Accordion>

  <Accordion title="送信時にアクティブなリスナーがない">
    対象アカウントにアクティブな Gateway リスナーが存在しない場合、アウトバウンド送信は即座に失敗します。

    Gateway が実行中で、アカウントがリンク済みであることを確認してください。

  </Accordion>

  <Accordion title="返信がトランスクリプトには表示されるが WhatsApp には表示されない">
    トランスクリプト行は、エージェントが生成した内容を記録します。WhatsApp 配信は別途確認されます。OpenClaw は、少なくとも1つの表示可能なテキストまたはメディア送信について Baileys がアウトバウンドメッセージIDを返した後にのみ、自動返信を送信済みとして扱います。

    ACKリアクションは返信前の独立した受領通知です。リアクションが成功しても、後続のテキストまたはメディア返信が WhatsApp に受け付けられたことは証明されません。

    Gateway ログで `auto-reply delivery failed` または `auto-reply was not accepted by WhatsApp provider` を確認してください。

  </Accordion>

  <Accordion title="グループメッセージが予期せず無視される">
    次の順序で確認してください。

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 許可リストエントリ
    - メンションゲート（`requireMention` + メンションパターン）
    - `openclaw.json`（JSON5）内の重複キー: 後のエントリが前のエントリを上書きするため、スコープごとに `groupPolicy` は1つだけにする

    `channels.whatsapp.groups` が存在する場合でも、WhatsApp は他のグループからのメッセージを観測できますが、OpenClaw はセッションルーティングの前にそれらを破棄します。グループJIDを `channels.whatsapp.groups` に追加するか、`groups["*"]` を追加してすべてのグループを許可しつつ、送信者認可は `groupPolicy` と `groupAllowFrom` で維持してください。

  </Accordion>

  <Accordion title="Bun ランタイム警告">
    WhatsApp Gateway ランタイムは Node を使用する必要があります。安定した WhatsApp/Telegram Gateway 運用について、Bun は非互換としてフラグ付けされています。
  </Accordion>
</AccordionGroup>

## システムプロンプト

WhatsApp は、`groups` と `direct` マップを介して、グループとダイレクトチャット向けの Telegram 形式のシステムプロンプトをサポートします。

グループメッセージの解決階層:

有効な `groups` マップが最初に決定されます。アカウントが独自の `groups` を定義している場合、それはルートの `groups` マップを完全に置き換えます（ディープマージなし）。その後、プロンプト検索は結果として得られた単一のマップ上で実行されます。

1. **グループ固有のシステムプロンプト**（`groups["<groupId>"].systemPrompt`）: 特定のグループエントリがマップ内に存在し、**かつ** その `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、システムプロンプトは適用されません。
2. **グループワイルドカードシステムプロンプト**（`groups["*"].systemPrompt`）: 特定のグループエントリがマップにまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

ダイレクトメッセージの解決階層:

有効な `direct` マップが最初に決定されます。アカウントが独自の `direct` を定義している場合、それはルートの `direct` マップを完全に置き換えます（ディープマージなし）。その後、プロンプト検索は結果として得られた単一のマップ上で実行されます。

1. **ダイレクト固有のシステムプロンプト**（`direct["<peerId>"].systemPrompt`）: 特定のピアエントリがマップ内に存在し、**かつ** その `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、システムプロンプトは適用されません。
2. **ダイレクトワイルドカードシステムプロンプト**（`direct["*"].systemPrompt`）: 特定のピアエントリがマップにまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

<Note>
`dms` は軽量なDMごとの履歴上書きバケット（`dms.<id>.historyLimit`）のままです。プロンプト上書きは `direct` 配下にあります。
</Note>

**Telegram の複数アカウント動作との違い:** Telegram では、複数アカウント構成のすべてのアカウントについて、たとえ独自の `groups` を定義していないアカウントであっても、ルートの `groups` は意図的に抑制されます。これは、ボットが所属していないグループのグループメッセージを受信しないようにするためです。WhatsApp はこのガードを適用しません。ルートの `groups` とルートの `direct` は、設定されているアカウント数に関係なく、アカウントレベルの上書きを定義していないアカウントに常に継承されます。複数アカウントの WhatsApp 構成で、アカウントごとのグループまたはダイレクトプロンプトが必要な場合は、ルートレベルのデフォルトに依存するのではなく、各アカウント配下に完全なマップを明示的に定義してください。

重要な動作:

- `channels.whatsapp.groups` は、グループごとの設定マップであると同時に、チャットレベルのグループ許可リストでもあります。ルートまたはアカウントのどちらのスコープでも、`groups["*"]` はそのスコープで「すべてのグループが許可される」ことを意味します。
- そのスコープですでにすべてのグループを許可したい場合にのみ、ワイルドカードグループ `systemPrompt` を追加してください。固定されたグループIDの集合だけを対象にしたい場合は、プロンプトのデフォルトに `groups["*"]` を使用しないでください。代わりに、明示的に許可リスト化された各グループエントリでプロンプトを繰り返してください。
- グループの受け入れと送信者の認可は別個のチェックです。`groups["*"]` はグループ処理に到達できるグループの集合を広げますが、それ自体ですべての送信者を認可するわけではありません。送信者アクセスは引き続き `channels.whatsapp.groupPolicy` と `channels.whatsapp.groupAllowFrom` によって別途制御されます。
- `channels.whatsapp.direct` にはDMに対する同じ副作用はありません。`direct["*"]` は、DMが `dmPolicy` と `allowFrom` またはペアリングストアルールによってすでに許可された後にのみ、デフォルトのダイレクトチャット設定を提供します。

例:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## 設定リファレンスへのポインター

主要リファレンス:

- [設定リファレンス - WhatsApp](/ja-JP/gateway/config-channels#whatsapp)

重要度の高い WhatsApp フィールド:

- アクセス: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- 配信: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- マルチアカウント: `accounts.<id>.enabled`, `accounts.<id>.authDir`, アカウントレベルのオーバーライド
- 運用: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- セッション動作: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- プロンプト: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [セキュリティ](/ja-JP/gateway/security)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
