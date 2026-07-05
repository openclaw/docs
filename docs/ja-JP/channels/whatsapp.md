---
read_when:
    - WhatsApp/web チャネルの動作または inbox ルーティングに取り組む
summary: WhatsApp チャネルのサポート、アクセス制御、配信動作、運用
title: WhatsApp
x-i18n:
    generated_at: "2026-07-05T11:04:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d006b750f387fac1ec0605d112fb2f753d0fc14354aa671cba300eac1fd5b3b
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: WhatsApp Web (Baileys) 経由で本番利用可能。Gateway がリンク済みセッションを所有します。別個の Twilio WhatsApp チャンネルはありません。

## インストール

`openclaw onboard` と `openclaw channels add --channel whatsapp` は、初めて選択したときに Plugin のインストールを促します。Plugin がない場合、`openclaw channels login --channel whatsapp` でも同じインストールフローが提示されます。開発チェックアウトではローカル Plugin パスを使います。stable/beta ではまず ClawHub から `@openclaw/whatsapp` をインストールし、失敗した場合は npm にフォールバックします。WhatsApp ランタイムはコアの OpenClaw npm パッケージの外で配布されるため、そのランタイム依存関係は外部 Plugin 側に残ります。手動インストール:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

裸の npm パッケージ (`@openclaw/whatsapp`) はレジストリフォールバックにのみ使用してください。再現可能なインストールが必要な場合にのみ、正確なバージョンを固定します。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    不明な送信者に対する既定の DM ポリシーはペアリングです。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復プレイブック。
  </Card>
  <Card title="Gateway 設定" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャンネル設定パターンと例。
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

    ログインは QR のみです。リモートまたはヘッドレスホストでは、ログインを開始する前にライブ QR を電話へ確実に届ける経路を用意してください。ターミナルに描画された QR、スクリーンショット、チャット添付は転送中に期限切れになる場合があります。

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

  <Step title="Gateway を開始する">

```bash
openclaw gateway
```

  </Step>

  <Step title="最初のペアリングリクエストを承認する (ペアリングモード)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    ペアリングリクエストは 1 時間後に期限切れになります。保留中のリクエストはアカウントごとに 3 件までに制限されます。

  </Step>
</Steps>

<Note>
別の WhatsApp 番号を推奨します (セットアップとメタデータはその構成に最適化されています) が、個人番号/セルフチャット構成も完全にサポートされています。
</Note>

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用番号 (推奨)">
    - OpenClaw 用の別個の WhatsApp ID
    - より明確な DM 許可リストとルーティング境界
    - セルフチャットの混乱が起きる可能性の低下

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
    オンボーディングは個人番号モードをサポートし、セルフチャットに適したベースラインを書き込みます: `dmPolicy: "allowlist"`、自分の番号を含む `allowFrom`、`selfChatMode: true`。ランタイムのセルフチャット保護は、リンク済みの自身の番号と `allowFrom` をキーにします。
  </Accordion>
</AccordionGroup>

## ランタイムモデル

- Gateway は WhatsApp ソケットと再接続ループを所有します。
- ウォッチドッグは 2 つのシグナルを独立して追跡します: 生の WhatsApp Web トランスポートアクティビティとアプリケーションメッセージアクティビティです。静かだが接続されているセッションは、最近メッセージが届いていないという理由だけでは再起動されません。固定の内部ウィンドウ (ユーザー設定不可) の間トランスポートフレームが届かなくなった場合、またはアプリケーションメッセージが通常のメッセージタイムアウトの 4 倍を超えて沈黙した場合にのみ、再接続を強制します。最近アクティブだったセッションの再接続直後は、その最初のウィンドウに 4 倍のウィンドウではなく短い通常のメッセージタイムアウトを使います。
- Baileys ソケットのタイミングは `web.whatsapp.*` 配下で明示されます: `keepAliveIntervalMs` (アプリケーション ping 間隔)、`connectTimeoutMs` (開始ハンドシェイクのタイムアウト)、`defaultQueryTimeoutMs` (Baileys クエリ待機に加え、OpenClaw のアウトバウンド送信/プレゼンスとインバウンド既読確認のタイムアウト)。
- アウトバウンド送信には、対象アカウントのアクティブな WhatsApp リスナーが必要です。ない場合、送信は即座に失敗します。
- グループ送信では、現在の参加者メタデータとトークンが一致する場合、`@+<digits>` と `@<digits>` トークン (テキストとメディアキャプション内) にネイティブのメンションメタデータを付与します。LID ベースのグループも含みます。
- ステータスとブロードキャストチャット (`@status`、`@broadcast`) は無視されます。
- ダイレクトチャットは DM セッションルール (`session.dmScope`; 既定の `main` は DM をエージェントのメインセッションに集約) を使います。グループセッションは JID ごとに分離されます (`agent:<agentId>:whatsapp:group:<jid>`)。
- WhatsApp チャンネル/ニュースレターは、ネイティブの `@newsletter` JID 経由で明示的なアウトバウンド対象にできます。DM セマンティクスではなく、チャンネルセッションメタデータ (`agent:<agentId>:whatsapp:channel:<jid>`) を使います。
- WhatsApp Web トランスポートは、Gateway ホスト上の標準プロキシ環境変数 (`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY`、小文字のバリアント) を尊重します。チャンネルごとの設定よりもホストレベルのプロキシ設定を優先してください。
- `messages.removeAckAfterReply` が有効な場合、OpenClaw は可視の返信が配信された後に ack リアクションを消去します。

## MeowCaller で現在のリクエスト元へ発信する (実験的)

Plugin は、WhatsApp 発のエージェントターンで `whatsapp_call` を公開できます。これは [MeowCaller](https://github.com/purpshell/meowcaller) を使って、現在の承認済みリクエスト元へ WhatsApp 音声通話を発信し、応答後に OpenClaw TTS メッセージを再生します。このツールには宛先番号パラメータがないため、プロンプトで通話先を変更することはできません。既定では無効です。

<Warning>
MeowCaller は実験的で、タグ付きリリースがなく、別途ペアリングした whatsmeow リンク済みデバイスセッションを使います。Plugin の Baileys 認証情報は再利用できません。ペアリングにより、同じ WhatsApp アカウントに別のリンク済みデバイスが追加されます。OpenClaw で使う ID でスキャンしてください。個人番号/セルフチャットモードは自身に発信できません。個人番号へ発信するには専用の OpenClaw 番号を使ってください。
</Warning>

<Steps>
  <Step title="実験的な通話を有効にする">

    WhatsApp チャンネル設定に `actions.calls: true` を追加し、Gateway を再起動します:

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

    未指定または `false` の場合、OpenClaw は `whatsapp_call` ツールを公開しません。

  </Step>

  <Step title="レビュー済みの MeowCaller CLI をインストールする">

    アダプターは Gateway ホストの `PATH` 上に `meowcaller` 実行可能ファイルがあることを期待します。[MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) がマージされるまでは、レビュー済みブランチをビルドしてください:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    `$HOME/.local/bin` が Gateway サービスの `PATH` に含まれていることを確認してください。このリビジョンには、明示的な `pair` コマンドと送信専用の `notify` コマンドがあります。`notify` はマイク、スピーカー、ビデオデバイス、診断キャプチャを開きません。上流サンプル CLI の `play` コマンドで代替しないでください。

  </Step>

  <Step title="MeowCaller のリンク済みデバイスをペアリングする">

    WhatsApp エージェントに通話セットアップの確認を依頼します (`whatsapp_call` ステータスアクションはアカウント固有の状態ディレクトリとペアリングコマンドを報告します)。既定アカウントの場合:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    これを対話的に実行し、**WhatsApp > Linked devices** から QR をスキャンし、`MeowCaller linked device ready` を待ちます。`wa-voip.db` は秘密にしてください。これは MeowCaller セッションです。既定以外のアカウントでは、ステータスアクションから独自のストアパスが得られます。Windows では、その PowerShell コマンドを実行します。

  </Step>

  <Step title="TTS を設定し、WhatsApp から発信する">

    電話対応の [TTS プロバイダー](/ja-JP/tools/tts) を設定し、Gateway を再起動してから、`Call me and say the build finished.` のようなリクエストを送信します。ツールは信頼されたインバウンドコンテキストから送信者を解決し、一時的な非公開 WAV ファイルを合成し、制限された通話ウィンドウで MeowCaller を実行し、その後音声ファイルを削除します。OpenClaw はアカウントのストアを明示的に渡し、応答/再生/切断後のゼロ終了ステータスを待ち、タイムアウトまたは非ゼロ終了を失敗したツール呼び出しとして扱います。

  </Step>
</Steps>

制限: 1 対 1 のアウトバウンド音声通話のみ、任意の宛先番号なし、チャット接続との認証共有なし、個人番号/セルフチャットモードからのセルフコールなし、合成音声は 60 秒に制限、MeowCaller の応答/再生/切断完了を超えるハンドセット側の可聴性レシートなし、OpenClaw は制限された 115-175 秒のウィンドウ後にコンパニオンプロセスを停止します (MeowCaller の接続、応答、再生、シャットダウンの各フェーズを含む)。

## 承認プロンプト

WhatsApp は、トップレベルの承認転送設定で制御される exec と Plugin の承認プロンプトを `👍`/`👎` リアクションとしてレンダリングできます:

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

`approvals.exec` と `approvals.plugin` は独立しています。WhatsApp をチャンネルとして有効にしても、トランスポートがリンクされるだけで、一致する承認ファミリーが有効化され、その宛先へルーティングされない限り何も送信されません。セッションモードでは、WhatsApp から発生した承認に対してのみネイティブ絵文字承認が配信されます。ターゲットモードでは、明示的なターゲットに共有転送パイプラインを使い、別個の承認者 DM ファンアウトは作成しません。

WhatsApp 承認リアクションには、`allowFrom` (または `"*"`) に明示的な承認者が必要です。`defaultTo` は通常の既定メッセージターゲットを設定するものであり、承認者リストではありません。手動の `/approve` コマンドも、承認解決の前に通常の WhatsApp 送信者認可パスを通ります。

## Plugin フックとプライバシー

インバウンド WhatsApp メッセージには、個人的な内容、電話番号、グループ識別子、送信者名、セッション相関フィールドが含まれる場合があります。WhatsApp は、明示的にオプトインしない限り、インバウンドの `message_received` フックペイロードを Plugin にブロードキャストしません:

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

オプトインは `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived` 配下の 1 つのアカウントにスコープしてください。インバウンド WhatsApp コンテンツと識別子を信頼して渡せる Plugin に対してのみ有効にしてください。

## アクセス制御と有効化

<Tabs>
  <Tab title="DM ポリシー">
    `channels.whatsapp.dmPolicy`:

    | 値 | 動作 |
    | --- | --- |
    | `pairing` (既定) | 不明な送信者はペアリングをリクエストし、オーナーが承認します |
    | `allowlist` | `allowFrom` の送信者のみ許可されます |
    | `open` | `allowFrom` に `"*"` を含める必要があります |
    | `disabled` | すべての DM をブロックします |

    `allowFrom` は E.164 形式の番号を受け入れます (内部で正規化されます)。これは DM 送信者のアクセス制御リストのみです。グループ JID や `@newsletter` チャンネル JID への明示的なアウトバウンド送信は制御しません。

    複数アカウントのオーバーライド: `channels.whatsapp.accounts.<id>.dmPolicy` (および `.allowFrom`) は、そのアカウントについてチャンネルレベルの既定値より優先されます。

    ランタイムメモ:

    - ペアリングはチャンネル許可ストアに永続化され、設定済みの `allowFrom` とマージされます
    - スケジュール済み自動化と Heartbeat 受信者フォールバックは、明示的な配信ターゲットまたは設定済みの `allowFrom` を使います。DM ペアリング承認は暗黙の Cron/Heartbeat 受信者ではありません
    - 許可リストが設定されていない場合、リンク済みの自身の番号が既定で許可されます
    - OpenClaw はアウトバウンドの `fromMe` DM (リンク済みデバイスから自分で送信したメッセージ) を自動ペアリングしません

  </Tab>

  <Tab title="グループポリシーと許可リスト">
    グループアクセスには 2 つの層があります。

    1. **グループメンバーシップ許可リスト** (`channels.whatsapp.groups`): `groups` が省略されている場合、すべてのグループが対象になります。指定されている場合は、グループ許可リストとして機能します（`"*"` はすべてを許可します）。
    2. **グループ送信者ポリシー** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` は送信者許可リストをバイパスし、`allowlist` は `groupAllowFrom`（または `*`）との一致を要求し、`disabled` はすべてのグループ受信をブロックします。

    `groupAllowFrom` が未設定の場合、送信者チェックは `allowFrom` にエントリがあればそれにフォールバックします。送信者許可リストは、メンション/返信によるアクティベーションより前に評価されます。

    `channels.whatsapp` ブロックがまったく存在しない場合、`channels.defaults.groupPolicy` が別の値に設定されていても、ランタイムは `groupPolicy: "allowlist"` にフォールバックします（警告ログあり）。

    <Note>
    グループメンバーシップ解決には単一アカウント向けの安全策があります。WhatsApp アカウントが 1 つだけ設定されていて、その `accounts.<id>.groups` が明示的な空オブジェクト（`{}`）の場合、それは「未設定」として扱われ、すべてのグループを暗黙にブロックするのではなく、ルートの `channels.whatsapp.groups` マップにフォールバックします。2 個以上のアカウントが設定されている場合、明示的な空のアカウントマップは空のままでフォールバックしません。これにより、あるアカウントだけが意図的にすべてのグループを無効化しても、兄弟アカウントに影響しません。
    </Note>

  </Tab>

  <Tab title="メンションと /activation">
    グループ返信では、デフォルトでメンションが必要です。メンション検出には次が含まれます。

    - ボット ID への明示的な WhatsApp メンション
    - 設定されたメンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - 承認済みグループメッセージの受信ボイスメモ文字起こし
    - ボットへの暗黙的な返信検出（返信送信者がボット ID と一致）

    セキュリティ: 引用/返信はメンションゲートを満たすだけで、送信者の承認は付与しません。`groupPolicy: "allowlist"` では、許可リストにない送信者は、許可リストにあるユーザーのメッセージへ返信していてもブロックされたままです。

    セッションレベルのアクティベーションコマンド: `/activation mention` または `/activation always`。これはセッション状態（グローバル設定ではない）を更新し、所有者ゲート付きです。

  </Tab>
</Tabs>

## 設定済み ACP バインディング

WhatsApp は、トップレベルの `bindings[]` による永続 ACP バインディングをサポートします。

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

ダイレクトチャットは E.164 番号に一致し、グループは WhatsApp グループ JID に一致します。グループ許可リスト、送信者ポリシー、メンション/アクティベーションのゲートは、OpenClaw がバインド済み ACP セッションの存在を保証する前に実行されます。一致したバインディングがそのルートを所有します。ブロードキャストグループは、そのターンを通常の WhatsApp セッションへ展開しません。

## 個人番号と自分宛てチャットの動作

リンクされた自分の番号が `allowFrom` にも存在する場合、自分宛てチャットの安全策が有効になります。自分宛てチャットのターンでは既読通知をスキップし、自分自身に通知してしまうメンション JID 自動トリガー動作を無視し、`messages.responsePrefix` が未設定の場合はデフォルトの返信先を `[{identity.name}]`（または `[openclaw]`）にします。

## メッセージ正規化とコンテキスト

<AccordionGroup>
  <Accordion title="受信エンベロープと返信コンテキスト">
    受信メッセージは共有受信エンベロープでラップされます。引用返信は、次の形式でコンテキストを追加します。

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    返信メタデータ（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、送信者 JID/E.164）は利用可能な場合に設定されます。引用対象がダウンロード可能なメディアの場合、OpenClaw は通常の受信メディアストアを通じて保存し、`MediaPath`/`MediaType` を公開するため、エージェントは `<media:image>` だけを見るのではなく、直接検査できます。

  </Accordion>

  <Accordion title="メディアプレースホルダーと位置情報/連絡先の抽出">
    メディアのみのメッセージはプレースホルダーに正規化されます: `<media:image>`、`<media:video>`、`<media:audio>`、`<media:document>`、`<media:sticker>`。

    承認済みグループのボイスメモは、本文が `<media:audio>` のみの場合、メンションゲートの前に文字起こしされるため、ボイスメモ内でボットへのメンションを発話すると返信をトリガーできます。文字起こし後もボットへのメンションがない場合、生のプレースホルダーではなく保留中のグループ履歴に残ります。

    位置情報の本文は簡潔な座標テキストとしてレンダリングされます。位置情報のラベル/コメントと連絡先/vCard の詳細は、インラインのプロンプトテキストではなく、フェンス付きの信頼できないメタデータとしてレンダリングされます。

  </Accordion>

  <Accordion title="保留中グループ履歴の注入">
    未処理のグループメッセージはバッファされ、ボットが最終的にトリガーされたときにコンテキストとして注入されます。

    - デフォルト上限: `50`
    - 設定: `channels.whatsapp.historyLimit`、フォールバックは `messages.groupChat.historyLimit`
    - `0` は無効化

    注入マーカー: `[Chat messages since your last reply - for context]` と `[Current message - respond to this]`。

  </Accordion>

  <Accordion title="既読通知">
    承認された受信メッセージではデフォルトで有効です。グローバルに無効化するには:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    アカウントごとの上書き: `channels.whatsapp.accounts.<id>.sendReadReceipts`。自分宛てチャットのターンでは、グローバルに有効でも既読通知をスキップします。

  </Accordion>
</AccordionGroup>

## 配信、分割、メディア

<AccordionGroup>
  <Accordion title="テキスト分割">
    - デフォルト分割上限: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`。`newline` は段落境界（空行）を優先し、その後に長さ安全な分割へフォールバックします。

  </Accordion>

  <Accordion title="送信メディアの動作">
    - 画像、動画、音声（PTT ボイスメモ）、ドキュメントのペイロードをサポートします
    - 音声は Baileys の `audio` ペイロードとして `ptt: true` 付きで送信され、プッシュツートークのボイスメモとしてレンダリングされます。`audioAsVoice` は返信ペイロード上で保持されるため、TTS ボイスメモ出力はプロバイダーのソース形式に関係なくこの経路に留まります
    - ネイティブ Ogg/Opus 音声は `audio/ogg; codecs=opus` として送信されます。それ以外（Microsoft Edge TTS の MP3/WebM 出力を含む）は、PTT 配信の前に `ffmpeg` で 48 kHz モノラル Ogg/Opus にトランスコードされます
    - `/tts latest` は最新のアシスタント返信を 1 つのボイスメモとして送信し、同じ返信に対する重複送信を抑制します。`/tts chat on|off|default` は現在のチャットの自動 TTS を制御します
    - 動画送信で `gifPlayback: true` を指定すると、アニメーション GIF 再生が有効になります
    - `forceDocument`/`asDocument` は、WhatsApp のメディア圧縮を避けるため、送信画像、GIF、動画を Baileys ドキュメントペイロード経由にし、解決済みのファイル名と MIME タイプを保持します
    - キャプションは複数メディア返信の最初のメディア項目に適用されます。ただし PTT ボイスメモは例外です。音声はキャプションなしで先に送信され、その後キャプションが別のテキストメッセージとして送信されます（WhatsApp クライアントはボイスメモのキャプションを一貫してレンダリングしません）
    - メディアソースには HTTP(S)、`file://`、またはローカルパスを使用できます

  </Accordion>

  <Accordion title="メディアサイズ上限とフォールバック動作">
    - 受信保存上限と送信上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - アカウントごとの上書き: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - `forceDocument`/`asDocument` がドキュメント配信を要求していない限り、画像は上限に収まるように自動最適化（リサイズ/品質スイープ）されます
    - メディア送信失敗時、最初の項目のフォールバックはレスポンスを暗黙に破棄するのではなく、テキスト警告を送信します

  </Accordion>
</AccordionGroup>

## 返信引用

`channels.whatsapp.replyToMode` はネイティブ返信引用（送信返信が受信メッセージを視覚的に引用する）を制御します。

| 値                | 動作                                                           |
| ----------------- | -------------------------------------------------------------- |
| `"off"`（デフォルト） | 引用しません。通常のメッセージとして送信します                 |
| `"first"`         | 最初の送信返信チャンクだけを引用します                         |
| `"all"`           | すべての送信返信チャンクを引用します                           |
| `"batched"`       | キュー済みのバッチ返信を引用し、即時返信は引用しません         |

アカウントごとの上書き: `channels.whatsapp.accounts.<id>.replyToMode`。

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## リアクションレベル

`channels.whatsapp.reactionLevel` は、エージェントが絵文字リアクションをどの範囲で使用するかを制御します。

| レベル                | Ack リアクション | エージェント開始リアクション |
| --------------------- | ---------------- | ---------------------------- |
| `"off"`               | いいえ           | いいえ                       |
| `"ack"`               | はい             | いいえ                       |
| `"minimal"`（デフォルト） | はい             | はい、控えめなガイダンス     |
| `"extensive"`         | はい             | はい、推奨されるガイダンス   |

アカウントごとの上書き: `channels.whatsapp.accounts.<id>.reactionLevel`。

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## 確認リアクション

`channels.whatsapp.ackReaction` は、受信時に即時リアクションを送信します。これは `reactionLevel` によって制御されます（`"off"` の場合は抑制されます）。

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

メモ: 受信が承認された直後（返信前）に送信されます。`ackReaction` が存在して `emoji` がない場合、WhatsApp はルーティングされたエージェントの ID 絵文字を使用し、フォールバックとして「👀」を使用します（確認リアクションなしにするには `ackReaction` を省略するか `emoji: ""` を設定します）。失敗はログに記録されますが、返信配信はブロックしません。グループモード `mentions` はメンションでトリガーされたターンでのみリアクションし、グループアクティベーション `always` はそのチェックをバイパスします。WhatsApp は `channels.whatsapp.ackReaction` のみを使用します（従来の `messages.ackReaction` はここでは適用されません）。

## ライフサイクルステータスリアクション

`messages.statusReactions.enabled: true` を設定すると、WhatsApp はターン中に静的な受信絵文字を残す代わりに確認リアクションを置き換え、キュー済み、思考中、ツールアクティビティ、Compaction、完了、エラーなどの状態を循環できます。

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

メモ: `channels.whatsapp.ackReaction` は引き続きダイレクトメッセージとグループの対象可否を制御します。キュー済み状態は通常の確認リアクションと同じ有効絵文字を使用します。WhatsApp にはメッセージごとにボットリアクション枠が 1 つあるため、ライフサイクル更新は現在のリアクションをその場で置き換えます。`messages.removeAckAfterReply: true` は、設定された完了/エラー保持時間の後に最終ステータスリアクションを消去します。ツール絵文字カテゴリには `tool`、`coding`、`web`、`deploy`、`build`、`concierge` が含まれます。

## 複数アカウントと認証情報

<AccordionGroup>
  <Accordion title="アカウント選択とデフォルト">
    アカウント ID は `channels.whatsapp.accounts` から取得されます。デフォルトアカウントの選択は、存在する場合は `default`、それ以外の場合は最初に設定されたアカウント ID（アルファベット順にソート）です。アカウント ID は検索用に内部で正規化されます。
  </Accordion>

  <Accordion title="認証情報パスとレガシー互換性">
    - 現在の認証パス: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（バックアップ: `creds.json.bak`）
    - `~/.openclaw/credentials/` 内の従来のデフォルト認証は、デフォルトアカウントフローでは引き続き認識/移行されます

  </Accordion>

  <Accordion title="Logout behavior">
    `openclaw channels logout --channel whatsapp [--account <id>]` は、そのアカウントの WhatsApp 認証状態を消去します。Gateway に到達できる場合、ログアウトはまずそのアカウントのライブリスナーを停止するため、リンク済みセッションは次回再起動前にメッセージの受信を停止します。`openclaw channels remove --channel whatsapp` も、アカウント設定を無効化または削除する前にライブリスナーを停止します。

    レガシー認証ディレクトリでは、Baileys 認証ファイルは削除されますが、`oauth.json` は保持されます。

  </Accordion>
</AccordionGroup>

## ツール、アクション、設定書き込み

- エージェントツールのサポートには WhatsApp のリアクションアクション (`react`) が含まれます。
- アクションゲート: `channels.whatsapp.actions.reactions`、`channels.whatsapp.actions.polls` (既存のアクションのデフォルトは `true`)、`channels.whatsapp.actions.calls` (デフォルトは `false`。上記の MeowCaller を参照)。
- チャンネル起点の設定書き込みはデフォルトで有効です。`channels.whatsapp.configWrites: false` で無効化します。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="Not linked (QR required)">
    症状: チャンネルステータスが未リンクと報告します。

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="Linked but disconnected / reconnect loop">
    症状: リンク済みアカウントで切断または再接続試行が繰り返されます。

    静かなアカウントは通常のメッセージタイムアウトを超えて接続を維持できます。ウォッチドッグは、WhatsApp Web トランスポートのアクティビティが停止した場合、ソケットが閉じた場合、またはアプリケーションレベルのアクティビティがより長い安全ウィンドウを超えて無音のままになった場合にのみ再起動します (上記のランタイムモデルを参照)。

    ログに `status=408 Request Time-out Connection was lost` が繰り返し表示される場合は、`web.whatsapp` の下で Baileys ソケットのタイミングを調整します。まず、`keepAliveIntervalMs` をネットワークのアイドルタイムアウトより短くし、低速または損失の多いリンクでは `connectTimeoutMs` を長くします。

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

    ホスト接続性とタイミングを修正した後もループが続く場合は、アカウント認証ディレクトリをバックアップして再リンクします。

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    `~/.openclaw/logs/whatsapp-health.log` が `Gateway inactive` と表示している一方で、`openclaw gateway status` と `openclaw channels status --probe` の両方が正常と表示する場合は、`openclaw doctor` を実行します。Linux では、doctor は廃止済みの `~/.openclaw/bin/ensure-whatsapp.sh` スクリプトを呼び出すレガシー crontab エントリについて警告します。`crontab -e` でそれらのエントリを削除してください。cron は systemd ユーザーバス環境を持たない場合があり、その古いスクリプトが Gateway の健全性を誤って報告することがあります。

  </Accordion>

  <Accordion title="QR login times out behind a proxy">
    症状: `openclaw channels login --channel whatsapp` が、利用可能な QR を表示する前に `status=408 Request Time-out` または TLS ソケット切断で失敗します。

    WhatsApp Web ログインは Gateway ホストの標準プロキシ環境 (`HTTPS_PROXY`、`HTTP_PROXY`、小文字のバリアント、`NO_PROXY`) を使用します。Gateway プロセスがプロキシ環境変数を継承していること、および `NO_PROXY` が `mmg.whatsapp.net` に一致しないことを確認してください。

  </Accordion>

  <Accordion title="No active listener when sending">
    対象アカウントにアクティブな Gateway リスナーが存在しない場合、送信はすぐに失敗します。Gateway が実行中であり、アカウントがリンク済みであることを確認してください。
  </Accordion>

  <Accordion title="Reply appears in transcript but not in WhatsApp">
    transcript 行はエージェントが生成した内容を記録します。WhatsApp への配信は別途確認されます。OpenClaw は、Baileys が少なくとも 1 件の表示可能なテキストまたはメディア送信について送信メッセージ ID を返した後にのみ、自動返信を送信済みとして扱います。

    Ack リアクションは返信前の独立した受領通知です。リアクションが成功しても、後続のテキスト/メディア返信が受け付けられたことは証明されません。Gateway ログで `auto-reply delivery failed` または `auto-reply was not accepted by WhatsApp provider` を確認してください。

  </Accordion>

  <Accordion title="Group messages unexpectedly ignored">
    次の順序で確認してください: `groupPolicy`、`groupAllowFrom`/`allowFrom`、`groups` 許可リストのエントリ、メンションゲート (`requireMention` + メンションパターン)、および `openclaw.json` 内の重複キー (JSON5 では後のエントリが前のエントリを上書きします。そのためスコープごとに `groupPolicy` は 1 つだけにしてください)。

    `channels.whatsapp.groups` が存在する場合、WhatsApp は他のグループからのメッセージを引き続き観測できますが、OpenClaw はセッションルーティングの前にそれらを破棄します。グループ JID を `channels.whatsapp.groups` に追加するか、`groups["*"]` を追加してすべてのグループを受け入れつつ、送信者承認は `groupPolicy`/`groupAllowFrom` の下で維持してください。

  </Accordion>

  <Accordion title="Bun runtime warning">
    WhatsApp Gateway ランタイムは Node を使用する必要があります。Bun は安定した WhatsApp/Telegram Gateway 運用とは互換性がないものとしてフラグ付けされます。
  </Accordion>
</AccordionGroup>

## システムプロンプト

WhatsApp は、`groups` および `direct` マップを通じて、グループとダイレクトチャット向けの Telegram 形式のシステムプロンプトをサポートします。

グループメッセージの解決: 有効な `groups` マップが最初に決定されます。アカウントが独自の `groups` キーを少しでも定義している場合、それはルートの `groups` マップを完全に置き換えます (ディープマージなし)。その後、プロンプト検索はその単一の結果マップ上で実行されます。

1. **グループ固有プロンプト** (`groups["<groupId>"].systemPrompt`): グループエントリが存在し、**かつ**その `systemPrompt` キーが定義されている場合に使用されます。空文字列 (`""`) はワイルドカードを抑制し、プロンプトを適用しません。
2. **グループワイルドカードプロンプト** (`groups["*"].systemPrompt`): 特定のグループエントリが存在しない場合、または存在していても `systemPrompt` キーがない場合に使用されます。

ダイレクトメッセージの解決は、`direct` マップおよび `direct["*"]` に対して同じパターンに従います。

<Note>
`dms` は、DM ごとの軽量な履歴上書きバケット (`dms.<id>.historyLimit`) のままです。プロンプトの上書きは `direct` の下にあります。
</Note>

<Note>
プロンプト解決におけるこの「アカウントがルートを置き換える」挙動は、単純な浅い上書きです。明示的な空オブジェクトを含む任意のアカウント `groups`/`direct` キーは、ルートマップを置き換えます。これは上記のグループメンバーシップ許可リストチェックとは異なります。そちらには、誤って空の `groups: {}` にした場合の単一アカウント向け安全網があります。
</Note>

**Telegram との違い:** Telegram は、複数アカウント構成のすべてのアカウントについて (独自の `groups` を持たないアカウントであっても) ルート `groups` を抑制し、ボットが所属していないグループのグループメッセージを受信しないようにします。WhatsApp はそのガードを適用しません。ルート `groups`/`direct` は、アカウント数に関係なく、独自の上書きを持たない任意のアカウントに継承されます。複数アカウントの WhatsApp 構成でアカウントごとのプロンプトを使いたい場合は、各アカウントの下に完全なマップを明示的に定義してください。

重要な挙動:

- `channels.whatsapp.groups` は、グループごとの設定マップであると同時に、チャットレベルのグループ許可リストでもあります。ルートまたはアカウントのどちらのスコープでも、`groups["*"]` はそのスコープで「すべてのグループが受け入れられる」ことを意味します。
- ワイルドカード `systemPrompt` は、そのスコープですでにすべてのグループを受け入れたい場合にのみ追加してください。固定されたグループ ID セットだけを対象にしたい場合は、`groups["*"]` を使うのではなく、明示的に許可リスト登録した各エントリでプロンプトを繰り返してください。
- グループの受け入れと送信者承認は別々のチェックです。`groups["*"]` はグループ処理に到達するグループを広げますが、それらのグループ内のすべての送信者を承認するわけではありません。それは引き続き `groupPolicy`/`groupAllowFrom` によって制御されます。
- `channels.whatsapp.direct` には DM に対する同等の副作用はありません。`direct["*"]` は、DM が `dmPolicy` と `allowFrom` またはペアリングストアルールによってすでに受け入れられた後にのみ、デフォルト設定を提供します。

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

主要リファレンス: [設定リファレンス - WhatsApp](/ja-JP/gateway/config-channels#whatsapp)

| 領域             | フィールド                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| アクセス           | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| 配信         | `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`                |
| 複数アカウント    | `accounts.<id>.enabled`, `accounts.<id>.authDir`, およびその他のアカウントごとの上書き                              |
| 運用       | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| セッション挙動 | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| プロンプト          | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [セキュリティ](/ja-JP/gateway/security)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
