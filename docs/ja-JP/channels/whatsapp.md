---
read_when:
    - WhatsApp/webチャネルの動作または受信トレイのルーティングに取り組む
summary: WhatsApp チャネルのサポート、アクセス制御、配信動作、運用
title: WhatsApp
x-i18n:
    generated_at: "2026-07-05T17:39:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f416d2b7a75e9c4798ded34a1ec5d9d7f49ab99a56977f1383347936fe47af55
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: WhatsApp Web (Baileys) 経由で本番対応済み。Gateway がリンク済みセッションを所有します。独立した Twilio WhatsApp チャネルはありません。

## インストール

`openclaw onboard` と `openclaw channels add --channel whatsapp` は、その Plugin を初めて選択したときにインストールを促します。Plugin がない場合、`openclaw channels login --channel whatsapp` でも同じインストールフローが提示されます。開発チェックアウトではローカル Plugin パスを使用します。stable/beta はまず ClawHub から `@openclaw/whatsapp` をインストールし、失敗した場合は npm にフォールバックします。WhatsApp ランタイムは OpenClaw の中核 npm パッケージ外で提供されるため、そのランタイム依存関係は外部 Plugin 側に残ります。手動インストール:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

裸の npm パッケージ (`@openclaw/whatsapp`) はレジストリフォールバックの場合にのみ使用してください。再現可能なインストールの場合にのみ、正確なバージョンを固定してください。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    既定の DM ポリシーは、不明な送信者に対してペアリングです。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    クロスチャネル診断と修復プレイブック。
  </Card>
  <Card title="Gateway 設定" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャネル設定パターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="アクセスポリシーを設定する">

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

  <Step title="WhatsApp をリンクする (QR)">

```bash
openclaw channels login --channel whatsapp
```

    ログインは QR のみです。リモートまたはヘッドレスホストでは、ログインを開始する前に、ライブ QR を電話に確実に届ける経路を用意してください。ターミナルに表示された QR、スクリーンショット、チャット添付は転送中に期限切れになることがあります。

    特定のアカウントの場合:

```bash
openclaw channels login --channel whatsapp --account work
```

    ログイン前に既存またはカスタムの認証ディレクトリを接続するには:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Gateway を起動する">

```bash
openclaw gateway
```

  </Step>

  <Step title="最初のペアリングリクエストを承認する (ペアリングモード)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    ペアリングリクエストは 1 時間後に期限切れになります。保留中のリクエストはアカウントあたり 3 件に制限されます。

  </Step>
</Steps>

<Note>
別の WhatsApp 番号を推奨します (セットアップとメタデータはそれに最適化されています) が、個人番号/セルフチャット構成も完全にサポートされています。
</Note>

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用番号 (推奨)">
    - OpenClaw 用の独立した WhatsApp ID
    - より明確な DM 許可リストとルーティング境界
    - セルフチャットによる混乱の可能性が低い

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

  <Accordion title="個人番号フォールバック">
    オンボーディングは個人番号モードをサポートし、セルフチャットに適したベースラインを書き込みます: `dmPolicy: "allowlist"`、自分の番号を含む `allowFrom`、`selfChatMode: true`。ランタイムのセルフチャット保護は、リンク済みの自分の番号と `allowFrom` をキーにします。
  </Accordion>
</AccordionGroup>

## ランタイムモデル

- Gateway が WhatsApp ソケットと再接続ループを所有します。
- ウォッチドッグは、素の WhatsApp Web トランスポート活動とアプリケーションメッセージ活動という 2 つのシグナルを個別に追跡します。静かだが接続中のセッションは、最近メッセージが到着していないという理由だけでは再起動されません。トランスポートフレームが固定の内部ウィンドウ (ユーザー設定不可) の間到着しなくなった場合、またはアプリケーションメッセージが通常のメッセージタイムアウトの 4 倍を超えて無音のままの場合にのみ、再接続を強制します。最近アクティブだったセッションの再接続直後は、その最初のウィンドウで 4 倍ウィンドウではなく短い通常のメッセージタイムアウトを使用します。OpenClaw は、その再接続の早い段階で Baileys が配信するオフラインメッセージに自動返信できます。これは受信メッセージ ID の重複排除有効期間に制限されます。初回起動では短い古い履歴ガードを維持します。
- Baileys ソケットのタイミングは `web.whatsapp.*` の下で明示されます: `keepAliveIntervalMs` (アプリケーション ping 間隔)、`connectTimeoutMs` (開始ハンドシェイクタイムアウト)、`defaultQueryTimeoutMs` (Baileys クエリ待機に加え、OpenClaw の送信/プレゼンスおよび受信既読確認タイムアウト)。
- 送信には対象アカウントのアクティブな WhatsApp リスナーが必要です。そうでない場合、送信は即座に失敗します。
- グループ送信では、トークンが現在の参加者メタデータと一致する場合、`@+<digits>` と `@<digits>` トークン (テキストとメディアキャプション内) にネイティブのメンションメタデータを付与します。LID ベースのグループも含まれます。
- ステータスおよびブロードキャストチャット (`@status`, `@broadcast`) は無視されます。
- ダイレクトチャットは DM セッションルール (`session.dmScope`; 既定の `main` は DM をエージェントのメインセッションにまとめます) を使用します。グループセッションは JID ごとに分離されます (`agent:<agentId>:whatsapp:group:<jid>`)。
- WhatsApp Channels/Newsletters は、DM セマンティクスではなくチャネルセッションメタデータ (`agent:<agentId>:whatsapp:channel:<jid>`) を使用し、ネイティブの `@newsletter` JID を通じて明示的な送信先にできます。
- WhatsApp Web トランスポートは Gateway ホスト上の標準プロキシ環境変数 (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`, 小文字のバリアント) を尊重します。チャネル単位の設定よりもホストレベルのプロキシ設定を優先してください。
- `messages.removeAckAfterReply` が有効な場合、OpenClaw は表示可能な返信が配信されると ack リアクションを消去します。

## MeowCaller で現在のリクエスト元に発信する (実験的)

この Plugin は、WhatsApp 由来のエージェントターンで `whatsapp_call` を公開できます。これは [MeowCaller](https://github.com/purpshell/meowcaller) を使用して、現在の承認済みリクエスト元に WhatsApp 音声通話を発信し、相手が応答した後に OpenClaw TTS メッセージを再生します。このツールには宛先番号パラメータがないため、プロンプトで通話先を変更することはできません。既定では無効です。

<Warning>
MeowCaller は実験的で、タグ付きリリースがなく、別途ペアリングされた whatsmeow リンク済みデバイスセッションを使用します。Plugin の Baileys 資格情報を再利用することはできません。ペアリングにより、同じ WhatsApp アカウントに別のリンク済みデバイスが追加されます。OpenClaw が使用する ID でスキャンしてください。個人番号/セルフチャットモードでは自分自身に発信できません。個人番号に発信するには、専用の OpenClaw 番号を使用してください。
</Warning>

<Steps>
  <Step title="実験的な通話を有効にする">

    WhatsApp チャネル設定に `actions.calls: true` を追加し、Gateway を再起動します:

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

    存在しない場合、または `false` の場合、OpenClaw は `whatsapp_call` ツールを公開しません。

  </Step>

  <Step title="レビュー済みの MeowCaller CLI をインストールする">

    アダプターは、Gateway ホストの `PATH` に `meowcaller` 実行可能ファイルがあることを想定しています。[MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) がマージされるまでは、レビュー済みブランチをビルドしてください:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    `$HOME/.local/bin` が Gateway サービスの `PATH` に含まれていることを確認してください。このリビジョンには明示的な `pair` コマンドと送信専用の `notify` コマンドがあります。`notify` はマイク、スピーカー、ビデオデバイス、診断キャプチャを開きません。上流の例 CLI の `play` コマンドで置き換えないでください。

  </Step>

  <Step title="MeowCaller リンク済みデバイスをペアリングする">

    WhatsApp エージェントに通話セットアップの確認を依頼してください (`whatsapp_call` status アクションは、アカウント固有の状態ディレクトリとペアリングコマンドを報告します)。既定アカウントの場合:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    これを対話的に実行し、**WhatsApp > Linked devices** から QR をスキャンし、`MeowCaller linked device ready` を待ちます。`wa-voip.db` は非公開にしてください。これは MeowCaller セッションです。既定以外のアカウントでは、status アクションから独自のストアパスを取得します。Windows では、その PowerShell コマンドを実行してください。

  </Step>

  <Step title="TTS を設定して WhatsApp から発信する">

    通話対応の [TTS プロバイダー](/ja-JP/tools/tts) を設定し、Gateway を再起動してから、`Call me and say the build finished.` のようなリクエストを送信します。このツールは信頼された受信コンテキストから送信者を解決し、一時的なプライベート WAV ファイルを合成し、制限付きの通話ウィンドウで MeowCaller を実行し、その後に音声ファイルを削除します。OpenClaw はアカウントのストアを明示的に渡し、応答/再生/切断後のゼロ終了ステータスを待ち、タイムアウトまたはゼロ以外の終了を失敗したツール呼び出しとして扱います。

  </Step>
</Steps>

制限: 1 対 1 の送信音声通話のみ、任意の宛先番号なし、チャット接続との共有認証なし、個人番号/セルフチャットモードからのセルフコールなし、合成音声は 60 秒に制限、MeowCaller の応答/再生/切断完了以外に端末側の可聴性受領なし、OpenClaw は 115-175 秒の制限付きウィンドウ (MeowCaller の接続、応答、再生、シャットダウンフェーズを含む) の後に付随プロセスを停止します。

## 承認プロンプト

WhatsApp は exec および Plugin 承認プロンプトを `👍`/`👎` リアクションとしてレンダリングできます。これはトップレベルの承認転送設定で制御されます:

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

`approvals.exec` と `approvals.plugin` は独立しています。チャネルとして WhatsApp を有効にしても、トランスポートがリンクされるだけで、一致する承認ファミリーが有効化され、そこへルーティングされない限り何も送信されません。セッションモードは、WhatsApp から発生した承認に対してのみネイティブ絵文字承認を配信します。ターゲットモードは明示的なターゲットに共有転送パイプラインを使用し、別個の承認者 DM ファンアウトを作成しません。

WhatsApp 承認リアクションには、`allowFrom` (または `"*"`) で明示的な承認者が必要です。`defaultTo` は通常の既定メッセージターゲットを設定するもので、承認者リストではありません。手動の `/approve` コマンドも、承認解決の前に通常の WhatsApp 送信者認可パスを通過します。

## Plugin フックとプライバシー

受信 WhatsApp メッセージには、個人コンテンツ、電話番号、グループ識別子、送信者名、セッション相関フィールドが含まれる場合があります。WhatsApp は、オプトインしない限り、受信 `message_received` フックペイロードを Plugin にブロードキャストしません:

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

オプトインは `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived` の下で 1 つのアカウントにスコープしてください。受信 WhatsApp コンテンツと識別子を信頼して渡せる Plugin に対してのみ、これを有効にしてください。

## アクセス制御と有効化

<Tabs>
  <Tab title="DM ポリシー">
    `channels.whatsapp.dmPolicy`:

    | 値 | 動作 |
    | --- | --- |
    | `pairing` (既定) | 不明な送信者がペアリングを要求し、所有者が承認します |
    | `allowlist` | `allowFrom` 送信者のみを許可します |
    | `open` | `allowFrom` に `"*"` が含まれている必要があります |
    | `disabled` | すべての DM をブロックします |

    `allowFrom` は E.164 形式の番号を受け付けます (内部で正規化されます)。これは DM 送信者のアクセス制御リストのみです。グループ JID または `@newsletter` チャネル JID への明示的な送信を制御するものではありません。

    マルチアカウントの上書き: `channels.whatsapp.accounts.<id>.dmPolicy` (および `.allowFrom`) は、そのアカウントについてチャネルレベルの既定値より優先されます。

    ランタイム注記:

    - ペアリングはチャネルの allow-store に永続化され、設定済みの `allowFrom` とマージされる
    - スケジュール済み自動化と Heartbeat 受信者フォールバックは、明示的な配信ターゲットまたは設定済みの `allowFrom` を使用する。DM ペアリング承認は暗黙の Cron/Heartbeat 受信者ではない
    - allowlist が設定されていない場合、リンク済みの自分の番号がデフォルトで許可される
    - OpenClaw は送信側の `fromMe` DM（リンク済みデバイスから自分自身に送信したメッセージ）を自動ペアリングしない

  </Tab>

  <Tab title="グループポリシーと allowlist">
    グループアクセスには 2 つのレイヤーがある:

    1. **グループメンバーシップ allowlist** (`channels.whatsapp.groups`): `groups` が省略されている場合、すべてのグループが対象になる。存在する場合はグループ allowlist として機能する（`"*"` はすべてを許可）。
    2. **グループ送信者ポリシー** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` は送信者 allowlist をバイパスし、`allowlist` は `groupAllowFrom`（または `*`）の一致を要求し、`disabled` はすべてのグループ受信をブロックする。

    `groupAllowFrom` が未設定の場合、送信者チェックはエントリがある場合の `allowFrom` にフォールバックする。送信者 allowlist はメンション/返信によるアクティベーションの前に評価される。

    `channels.whatsapp` ブロックがまったく存在しない場合、ランタイムは `channels.defaults.groupPolicy` が別の値に設定されていても、`groupPolicy: "allowlist"` にフォールバックする（警告ログ付き）。

    <Note>
    グループメンバーシップ解決には単一アカウント向けの安全策がある。WhatsApp アカウントが 1 つだけ設定されていて、その `accounts.<id>.groups` が明示的な空オブジェクト（`{}`）の場合、それは「未設定」として扱われ、すべてのグループを黙ってブロックするのではなく、ルートの `channels.whatsapp.groups` マップにフォールバックする。2 つ以上のアカウントが設定されている場合、明示的な空のアカウントマップは空のままでフォールバックしない。これにより、1 つのアカウントで兄弟アカウントに影響を与えず、意図的にすべてのグループを無効化できる。
    </Note>

  </Tab>

  <Tab title="メンションと /activation">
    グループ返信はデフォルトでメンションを必要とする。メンション検出には以下が含まれる:

    - ボット ID への明示的な WhatsApp メンション
    - 設定済みのメンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - 認可されたグループメッセージの受信ボイスノート文字起こし
    - 暗黙のボット宛て返信検出（返信送信者がボット ID と一致）

    セキュリティ: 引用/返信はメンションゲートだけを満たす。送信者認可は付与**しない**。`groupPolicy: "allowlist"` では、allowlist にない送信者は、allowlist にあるユーザーのメッセージへ返信していてもブロックされたままになる。

    セッションレベルのアクティベーションコマンド: `/activation mention` または `/activation always`。これはセッション状態（グローバル設定ではない）を更新し、所有者ゲート付き。

  </Tab>
</Tabs>

## 設定済み ACP バインディング

WhatsApp はトップレベルの `bindings[]` による永続 ACP バインディングをサポートする:

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

ダイレクトチャットは E.164 番号に一致し、グループは WhatsApp グループ JID に一致する。OpenClaw がバインド済み ACP セッションの存在を保証する前に、グループ allowlist、送信者ポリシー、メンション/アクティベーションゲートが実行される。一致したバインディングがルートを所有する。ブロードキャストグループはそのターンを通常の WhatsApp セッションへファンアウトしない。

## 個人番号とセルフチャットの動作

リンク済みの自分の番号が `allowFrom` にも存在する場合、セルフチャット保護が有効になる。セルフチャットターンの既読通知をスキップし、自分自身に ping してしまうメンション JID 自動トリガー動作を無視し、`messages.responsePrefix` が未設定の場合はデフォルトの返信先を `[{identity.name}]`（または `[openclaw]`）にする。

## メッセージ正規化とコンテキスト

<AccordionGroup>
  <Accordion title="受信エンベロープと返信コンテキスト">
    受信メッセージは共有受信エンベロープでラップされる。引用返信は、この形式でコンテキストを追加する:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    返信メタデータ（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、送信者 JID/E.164）は利用可能な場合に設定される。引用対象がダウンロード可能なメディアの場合、OpenClaw は通常の受信メディアストアを通じて保存し、`MediaPath`/`MediaType` を公開するため、エージェントは `<media:image>` だけを見るのではなく直接検査できる。

  </Accordion>

  <Accordion title="メディアプレースホルダーと位置情報/連絡先抽出">
    メディアのみのメッセージはプレースホルダーに正規化される: `<media:image>`、`<media:video>`、`<media:audio>`、`<media:document>`、`<media:sticker>`。

    認可されたグループボイスノートは、本文が `<media:audio>` のみの場合、メンションゲートの前に文字起こしされる。そのため、ボイスノート内でボットメンションを言うと返信をトリガーできる。文字起こしがそれでもボットにメンションしていない場合、生のプレースホルダーではなく保留中のグループ履歴に残る。

    位置情報本文は簡潔な座標テキストとしてレンダリングされる。位置情報ラベル/コメントと連絡先/vCard 詳細は、インラインプロンプトテキストではなく、フェンス付きの信頼されないメタデータとしてレンダリングされる。

  </Accordion>

  <Accordion title="保留中のグループ履歴注入">
    未処理のグループメッセージはバッファリングされ、ボットが最終的にトリガーされたときにコンテキストとして注入される。

    - デフォルト上限: `50`
    - 設定: `channels.whatsapp.historyLimit`、フォールバックは `messages.groupChat.historyLimit`
    - `0` で無効化

    注入マーカー: `[Chat messages since your last reply - for context]` と `[Current message - respond to this]`。

  </Accordion>

  <Accordion title="既読通知">
    受け入れられた受信メッセージではデフォルトで有効。グローバルに無効化する:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    アカウント単位のオーバーライド: `channels.whatsapp.accounts.<id>.sendReadReceipts`。セルフチャットターンは、グローバルに有効な場合でも既読通知をスキップする。

  </Accordion>
</AccordionGroup>

## 配信、チャンク化、メディア

<AccordionGroup>
  <Accordion title="テキストチャンク化">
    - デフォルトのチャンク上限: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`。`newline` は段落境界（空行）を優先し、その後、長さ安全なチャンク化にフォールバックする

  </Accordion>

  <Accordion title="送信メディアの動作">
    - 画像、動画、音声（PTT ボイスノート）、ドキュメントペイロードをサポートする
    - 音声は Baileys の `audio` ペイロードとして `ptt: true` 付きで送信され、プッシュツートークのボイスノートとしてレンダリングされる。`audioAsVoice` は返信ペイロードで保持されるため、TTS ボイスノート出力はプロバイダーのソース形式に関係なくこの経路に留まる
    - ネイティブ Ogg/Opus 音声は `audio/ogg; codecs=opus` として送信される。それ以外（Microsoft Edge TTS の MP3/WebM 出力を含む）は、PTT 配信前に `ffmpeg` で 48 kHz モノラル Ogg/Opus にトランスコードされる
    - `/tts latest` は最新のアシスタント返信を 1 つのボイスノートとして送信し、同じ返信の繰り返し送信を抑制する。`/tts chat on|off|default` は現在のチャットの自動 TTS を制御する
    - 動画送信で `gifPlayback: true` を指定するとアニメーション GIF 再生が有効になる
    - `forceDocument`/`asDocument` は、WhatsApp のメディア圧縮を避けるために、送信画像、GIF、動画を Baileys ドキュメントペイロード経由にし、解決済みのファイル名と MIME タイプを保持する
    - キャプションは複数メディア返信の最初のメディア項目に適用される。ただし PTT ボイスノートは例外で、音声がキャプションなしで先に送信され、その後キャプションが別のテキストメッセージとして送信される（WhatsApp クライアントはボイスノートのキャプションを一貫してレンダリングしない）
    - メディアソースは HTTP(S)、`file://`、またはローカルパスを使用できる

  </Accordion>

  <Accordion title="メディアサイズ上限とフォールバック動作">
    - 受信保存上限と送信上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - アカウント単位のオーバーライド: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - 画像は、`forceDocument`/`asDocument` がドキュメント配信を要求していない限り、上限に収まるよう自動最適化（リサイズ/品質スイープ）される
    - メディア送信失敗時、最初の項目のフォールバックはレスポンスを黙って破棄するのではなく、テキスト警告を送信する

  </Accordion>
</AccordionGroup>

## 返信引用

`channels.whatsapp.replyToMode` はネイティブ返信引用（送信返信が受信メッセージを目に見える形で引用する）を制御する:

| 値                | 動作                                                           |
| ----------------- | -------------------------------------------------------------- |
| `"off"`（デフォルト） | 引用しない。プレーンメッセージとして送信する                   |
| `"first"`         | 最初の送信返信チャンクだけを引用する                           |
| `"all"`           | すべての送信返信チャンクを引用する                             |
| `"batched"`       | キューされたバッチ返信を引用する。即時返信は引用しない         |

アカウント単位のオーバーライド: `channels.whatsapp.accounts.<id>.replyToMode`。

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## リアクションレベル

`channels.whatsapp.reactionLevel` は、エージェントが絵文字リアクションをどの程度広く使用するかを制御する:

| レベル                | Ack リアクション | エージェント起点のリアクション |
| --------------------- | ---------------- | ------------------------------ |
| `"off"`               | いいえ           | いいえ                         |
| `"ack"`               | はい             | いいえ                         |
| `"minimal"`（デフォルト） | はい             | はい、控えめなガイダンス       |
| `"extensive"`         | はい             | はい、推奨されるガイダンス     |

アカウント単位のオーバーライド: `channels.whatsapp.accounts.<id>.reactionLevel`。

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## 確認リアクション

`channels.whatsapp.ackReaction` は受信時に即時リアクションを送信し、`reactionLevel` によってゲートされる（`"off"` の場合は抑制）:

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

注記: 受信が受け入れられた直後（返信前）に送信される。`ackReaction` が `emoji` なしで存在する場合、WhatsApp はルーティングされたエージェントの ID 絵文字を使用し、なければ "👀" にフォールバックする（確認なしにするには `ackReaction` を省略するか `emoji: ""` を設定する）。失敗はログに記録されるが返信配信はブロックしない。グループモード `mentions` はメンションでトリガーされたターンでのみリアクションし、グループアクティベーション `always` はそのチェックをバイパスする。WhatsApp は `channels.whatsapp.ackReaction` のみを使用する（レガシーの `messages.ackReaction` はここでは適用されない）。

## ライフサイクルステータスリアクション

`messages.statusReactions.enabled: true` を設定すると、ターン中に静的な受領絵文字を残す代わりに、WhatsApp が Ack リアクションを置き換え、キュー済み、思考中、ツール活動、Compaction、完了、エラーなどの状態を巡回できる:

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

注記: `channels.whatsapp.ackReaction` は引き続きダイレクトメッセージとグループの適格性を制御する。キュー済み状態は通常の Ack リアクションと同じ有効絵文字を使用する。WhatsApp にはメッセージごとにボットのリアクションスロットが 1 つあるため、ライフサイクル更新は現在のリアクションをその場で置き換える。`messages.removeAckAfterReply: true` は、設定された完了/エラー保持後に最終ステータスリアクションをクリアする。ツール絵文字カテゴリには `tool`、`coding`、`web`、`deploy`、`build`、`concierge` が含まれる。

## 複数アカウントと認証情報

<AccordionGroup>
  <Accordion title="アカウント選択とデフォルト">
    アカウント ID は `channels.whatsapp.accounts` から取得される。デフォルトのアカウント選択は、存在する場合は `default`、それ以外は最初に設定されたアカウント ID（アルファベット順）になる。アカウント ID は検索用に内部で正規化される。
  </Accordion>

  <Accordion title="認証情報パスとレガシー互換性">
    - 現在の認証パス: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (バックアップ: `creds.json.bak`)
    - `~/.openclaw/credentials/` のレガシー既定認証は、既定アカウントフロー向けに引き続き認識および移行されます

  </Accordion>

  <Accordion title="ログアウト時の動作">
    `openclaw channels logout --channel whatsapp [--account <id>]` は、そのアカウントの WhatsApp 認証状態を消去します。Gateway に到達できる場合、ログアウトはまずそのアカウントのライブリスナーを停止するため、リンク済みセッションは次回再起動前にメッセージの受信を停止します。`openclaw channels remove --channel whatsapp` も、アカウント設定を無効化または削除する前にライブリスナーを停止します。

    レガシー認証ディレクトリでは、Baileys 認証ファイルが削除される一方で `oauth.json` は保持されます。

  </Accordion>
</AccordionGroup>

## ツール、アクション、設定書き込み

- エージェントツールのサポートには WhatsApp リアクションアクション (`react`) が含まれます。
- アクションゲート: `channels.whatsapp.actions.reactions`、`channels.whatsapp.actions.polls` (既存のアクションの既定値は `true`)、`channels.whatsapp.actions.calls` (既定値は `false`、上記の MeowCaller を参照)。
- チャンネル起点の設定書き込みは既定で有効です。`channels.whatsapp.configWrites: false` で無効化します。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="リンクされていない (QR が必要)">
    症状: チャンネルステータスがリンクされていないと報告する。

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="リンク済みだが切断される / 再接続ループ">
    症状: リンク済みアカウントで切断または再接続試行が繰り返される。

    通信の少ないアカウントは通常のメッセージタイムアウトを超えて接続を維持できます。ウォッチドッグは、WhatsApp Web トランスポートのアクティビティが停止した場合、ソケットが閉じた場合、またはアプリケーションレベルのアクティビティがより長い安全ウィンドウを超えて無音のままになった場合にのみ再起動します (上記のランタイムモデルを参照)。

    ログに `status=408 Request Time-out Connection was lost` が繰り返し表示される場合は、`web.whatsapp` 配下の Baileys ソケットタイミングを調整します。まず、`keepAliveIntervalMs` をネットワークのアイドルタイムアウトより短くし、低速または損失の多いリンクでは `connectTimeoutMs` を増やします。

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

    ホスト接続性とタイミングを修正してもループが続く場合は、アカウント認証ディレクトリをバックアップして再リンクします。

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    `~/.openclaw/logs/whatsapp-health.log` に `Gateway inactive` と表示される一方で、`openclaw gateway status` と `openclaw channels status --probe` の両方が正常を示す場合は、`openclaw doctor` を実行します。Linux では、doctor が廃止済みの `~/.openclaw/bin/ensure-whatsapp.sh` スクリプトを呼び出すレガシー crontab エントリについて警告します。`crontab -e` でそれらのエントリを削除してください。cron には systemd ユーザーバス環境がない場合があり、その古いスクリプトが Gateway のヘルスを誤報する原因になります。

  </Accordion>

  <Accordion title="プロキシ背後で QR ログインがタイムアウトする">
    症状: `openclaw channels login --channel whatsapp` が、利用可能な QR を表示する前に `status=408 Request Time-out` または TLS ソケット切断で失敗する。

    WhatsApp Web ログインは、Gateway ホストの標準プロキシ環境 (`HTTPS_PROXY`、`HTTP_PROXY`、小文字のバリアント、`NO_PROXY`) を使用します。Gateway プロセスがプロキシ環境変数を継承していること、および `NO_PROXY` が `mmg.whatsapp.net` に一致していないことを確認します。

  </Accordion>

  <Accordion title="送信時にアクティブなリスナーがない">
    対象アカウントにアクティブな Gateway リスナーが存在しない場合、アウトバウンド送信は即座に失敗します。Gateway が実行中で、アカウントがリンク済みであることを確認してください。
  </Accordion>

  <Accordion title="返信がトランスクリプトには表示されるが WhatsApp には表示されない">
    トランスクリプト行はエージェントが生成した内容を記録します。WhatsApp への配信は別途確認されます。OpenClaw は、少なくとも 1 つの表示可能なテキストまたはメディア送信について Baileys がアウトバウンドメッセージ ID を返した後にのみ、自動返信を送信済みとして扱います。

    Ack リアクションは返信前の独立した受領通知です。リアクションが成功しても、後続のテキスト/メディア返信が受け入れられたことの証明にはなりません。Gateway ログで `auto-reply delivery failed` または `auto-reply was not accepted by WhatsApp provider` を確認してください。

  </Accordion>

  <Accordion title="グループメッセージが予期せず無視される">
    次の順序で確認します: `groupPolicy`、`groupAllowFrom`/`allowFrom`、`groups` 許可リストエントリ、メンションゲート (`requireMention` + メンションパターン)、および `openclaw.json` 内の重複キー (JSON5 では後のエントリが前のエントリを上書きします。スコープごとに `groupPolicy` は 1 つだけにしてください)。

    `channels.whatsapp.groups` が存在する場合でも、WhatsApp は他のグループからのメッセージを観測できますが、OpenClaw はセッションルーティングの前にそれらを破棄します。グループ JID を `channels.whatsapp.groups` に追加するか、`groups["*"]` を追加して、送信者認可を `groupPolicy`/`groupAllowFrom` 配下に維持したまますべてのグループを許可します。

  </Accordion>

  <Accordion title="Bun ランタイム警告">
    WhatsApp Gateway ランタイムは Node を使用する必要があります。Bun は、安定した WhatsApp/Telegram Gateway 操作と互換性がないものとしてフラグ付けされます。
  </Accordion>
</AccordionGroup>

## システムプロンプト

WhatsApp は、`groups` と `direct` マップを介して、グループおよびダイレクトチャット向けの Telegram 形式のシステムプロンプトをサポートします。

グループメッセージの解決: 有効な `groups` マップが最初に決定されます。アカウントが独自の `groups` キーを少しでも定義している場合、それはルートの `groups` マップを完全に置き換えます (ディープマージはありません)。その後、プロンプト検索はその単一の結果マップ上で実行されます。

1. **グループ固有プロンプト** (`groups["<groupId>"].systemPrompt`): グループエントリが存在し、**かつ** その `systemPrompt` キーが定義されている場合に使用されます。空文字列 (`""`) はワイルドカードを抑制し、プロンプトを適用しません。
2. **グループワイルドカードプロンプト** (`groups["*"].systemPrompt`): 特定のグループエントリが存在しない場合、または存在しても `systemPrompt` キーがない場合に使用されます。

ダイレクトメッセージの解決は、`direct` マップと `direct["*"]` に対して同じパターンに従います。

<Note>
`dms` は、軽量な DM ごとの履歴上書きバケット (`dms.<id>.historyLimit`) のままです。プロンプトの上書きは `direct` 配下にあります。
</Note>

<Note>
プロンプト解決におけるこのアカウントがルートを置き換える動作は、単純な浅い上書きです。明示的な空オブジェクトを含む任意のアカウント `groups`/`direct` キーが、ルートマップを置き換えます。これは上記のグループメンバーシップ許可リストチェックとは異なります。そちらには、誤って空の `groups: {}` にした場合の単一アカウント向け安全網があります。
</Note>

**Telegram との違い:** Telegram は、複数アカウント設定内のすべてのアカウントについて (独自の `groups` を持たないアカウントであっても)、ルートの `groups` を抑制します。これは、ボットが所属していないグループのグループメッセージを受信するのを防ぐためです。WhatsApp はこのガードを適用しません。ルートの `groups`/`direct` は、アカウント数に関係なく、独自の上書きを持たない任意のアカウントに継承されます。複数アカウントの WhatsApp 設定でアカウントごとのプロンプトが必要な場合は、各アカウント配下に完全なマップを明示的に定義してください。

重要な動作:

- `channels.whatsapp.groups` は、グループごとの設定マップであると同時にチャットレベルのグループ許可リストでもあります。ルートスコープまたはアカウントスコープのどちらでも、`groups["*"]` はそのスコープで「すべてのグループを許可する」ことを意味します。
- ワイルドカード `systemPrompt` は、そのスコープですでにすべてのグループを許可したい場合にのみ追加してください。固定されたグループ ID セットだけを対象にしたい場合は、`groups["*"]` を使用せず、明示的に許可リストに入れた各エントリにプロンプトを繰り返し設定します。
- グループの許可と送信者認可は別々のチェックです。`groups["*"]` はグループ処理に到達するグループを広げますが、それらのグループ内のすべての送信者を認可するわけではありません。送信者認可は引き続き `groupPolicy`/`groupAllowFrom` によって制御されます。
- `channels.whatsapp.direct` には DM に対する同等の副作用はありません。`direct["*"]` は、DM が `dmPolicy` と `allowFrom` またはペアリングストアのルールによってすでに許可された後に、既定設定を提供するだけです。

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

## 設定リファレンスの参照先

主なリファレンス: [設定リファレンス - WhatsApp](/ja-JP/gateway/config-channels#whatsapp)

| 領域             | フィールド                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| アクセス         | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| 配信             | `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`                |
| 複数アカウント   | `accounts.<id>.enabled`, `accounts.<id>.authDir`, およびその他のアカウントごとの上書き                         |
| 運用             | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| セッション動作   | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| プロンプト       | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [セキュリティ](/ja-JP/gateway/security)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
