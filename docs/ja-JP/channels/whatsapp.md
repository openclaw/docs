---
read_when:
    - WhatsApp/Webチャネルの動作または受信トレイのルーティングに取り組む
summary: WhatsApp チャンネルのサポート、アクセス制御、配信動作、運用
title: WhatsApp
x-i18n:
    generated_at: "2026-06-27T10:43:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88f81adc38bd64d1e35f382dfc209e690c059d52e522e5cbdf77d1da45c9d15f
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: WhatsApp Web (Baileys) 経由で本番利用可能。Gateway がリンク済みセッションを所有します。

## インストール（オンデマンド）

- オンボーディング（`openclaw onboard`）と `openclaw channels add --channel whatsapp` は、
  初めて WhatsApp Plugin を選択したときにインストールを促します。
- `openclaw channels login --channel whatsapp` も、Plugin がまだ存在しない場合は
  インストールフローを提示します。
- Dev チャンネル + git チェックアウト: ローカル Plugin パスがデフォルトです。
- Stable/Beta: まず ClawHub から公式 `@openclaw/whatsapp` Plugin をインストールし、
  フォールバックとして npm を使います。
- WhatsApp ランタイムはコア OpenClaw npm パッケージの外で配布されるため、
  WhatsApp 固有のランタイム依存関係は外部 Plugin 側に留まります。

手動インストールも引き続き利用できます。

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

レジストリフォールバックが必要な場合にのみ、素の npm パッケージ（`@openclaw/whatsapp`）を使ってください。
再現可能なインストールが必要な場合にのみ、正確なバージョンを固定してください。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    不明な送信者に対するデフォルトの DM ポリシーはペアリングです。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復プレイブック。
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャンネル設定パターンと例。
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

    現在のログインは QR ベースです。リモート環境またはヘッドレス環境では、
    ログイン開始前に、スキャンする電話へライブ QR コードを確実に届ける経路があることを確認してください。

    特定のアカウントの場合:

```bash
openclaw channels login --channel whatsapp --account work
```

    ログイン前に既存またはカスタムの WhatsApp Web 認証ディレクトリを関連付けるには:

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

    ペアリングリクエストは 1 時間後に期限切れになります。保留中のリクエストはチャンネルごとに最大 3 件です。

  </Step>
</Steps>

<Note>
OpenClaw では、可能な場合は WhatsApp を別の番号で実行することを推奨します。（チャンネルメタデータとセットアップフローはその構成に最適化されていますが、個人番号での構成もサポートされています。）
</Note>

<Warning>
現在の WhatsApp セットアップフローは QR のみです。ターミナルに表示された QR、スクリーンショット、
PDF、またはチャット添付ファイルは、リモートマシンから中継される間に期限切れになったり、
読み取れなくなったりする場合があります。リモート/ヘッドレスホストでは、手動のターミナルキャプチャよりも、
直接 QR 画像を受け渡す経路を優先してください。
</Warning>

## デプロイパターン

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    これは最もクリーンな運用モードです。

    - OpenClaw 用に分離された WhatsApp アイデンティティ
    - より明確な DM 許可リストとルーティング境界
    - セルフチャットの混乱が起きる可能性の低下

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
    オンボーディングは個人番号モードをサポートし、セルフチャットに適したベースラインを書き込みます。

    - `dmPolicy: "allowlist"`
    - `allowFrom` に個人番号が含まれる
    - `selfChatMode: true`

    ランタイムでは、セルフチャット保護はリンク済みの自分の番号と `allowFrom` を基準にします。

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    メッセージングプラットフォームチャンネルは、現在の OpenClaw チャンネルアーキテクチャでは WhatsApp Web ベース（`Baileys`）です。

    組み込みチャットチャンネルレジストリには、独立した Twilio WhatsApp メッセージングチャンネルはありません。

  </Accordion>
</AccordionGroup>

## ランタイムモデル

- Gateway が WhatsApp ソケットと再接続ループを所有します。
- 再接続ウォッチドッグは、受信アプリメッセージ量だけではなく WhatsApp Web トランスポートアクティビティを使用するため、静かなリンク済みデバイスセッションは、最近誰もメッセージを送っていないという理由だけでは再起動されません。より長いアプリケーション無音上限は、トランスポートフレームが到着し続けていてもウォッチドッグウィンドウ内でアプリケーションメッセージが処理されない場合に、引き続き再接続を強制します。最近アクティブだったセッションの一時的な再接続後、そのアプリケーション無音チェックは最初の回復ウィンドウに通常のメッセージタイムアウトを使用します。
- Baileys ソケットのタイミングは `web.whatsapp.*` の下で明示されます。`keepAliveIntervalMs` は WhatsApp Web アプリケーション ping を制御し、`connectTimeoutMs` は開始ハンドシェイクのタイムアウトを制御し、`defaultQueryTimeoutMs` は Baileys クエリ待機に加えて、OpenClaw のローカル送信/プレゼンスおよび受信既読確認操作の上限を制御します。
- 送信には、対象アカウントのアクティブな WhatsApp リスナーが必要です。
- グループ送信では、テキストおよびメディアキャプション内の `@+<digits>` と `@<digits>` トークンが現在の WhatsApp 参加者メタデータに一致する場合、LID ベースのグループを含めて、ネイティブメンションメタデータを付与します。
- ステータスとブロードキャストチャットは無視されます（`@status`、`@broadcast`）。
- 再接続ウォッチドッグは、受信アプリメッセージ量だけではなく WhatsApp Web トランスポートアクティビティに従います。静かなリンク済みデバイスセッションは、トランスポートフレームが継続している間は維持されますが、トランスポート停止は後続のリモート切断経路よりかなり前に再接続を強制します。
- 直接チャットは DM セッションルールを使用します（`session.dmScope`; デフォルトの `main` は DM をエージェントのメインセッションにまとめます）。
- グループセッションは分離されます（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Channels/Newsletters は、ネイティブの `@newsletter` JID を持つ明示的な送信先にできます。送信ニュースレターは、DM セッションセマンティクスではなくチャンネルセッションメタデータ（`agent:<agentId>:whatsapp:channel:<jid>`）を使用します。
- WhatsApp Web トランスポートは Gateway ホスト上の標準プロキシ環境変数（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` / 小文字バリアント）を尊重します。チャンネル固有の WhatsApp プロキシ設定よりも、ホストレベルのプロキシ設定を優先してください。
- `messages.removeAckAfterReply` が有効な場合、OpenClaw は表示可能な返信が配信された後に WhatsApp の ack リアクションをクリアします。

## 承認プロンプト

WhatsApp は exec と Plugin の承認プロンプトを `👍` / `👎` リアクションで表示できます。配信は
トップレベルの承認転送設定で制御されます。

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

`approvals.exec` と `approvals.plugin` は独立しています。WhatsApp をチャンネルとして有効化しても
トランスポートをリンクするだけです。一致する承認ファミリーが有効化され、WhatsApp にルーティングされない限り、
承認プロンプトは送信されません。セッションモードは、WhatsApp から発生した承認に対してのみネイティブ絵文字承認を配信します。
ターゲットモードは、明示的な WhatsApp ターゲットに共有転送パイプラインを使用し、
個別の承認者 DM ファンアウトは作成しません。

WhatsApp 承認リアクションには、`allowFrom` または `"*"` からの明示的な WhatsApp 承認者が必要です。
`defaultTo` は通常のデフォルトメッセージターゲットを制御します。承認の承認者ではありません。手動の
`/approve` コマンドも、承認解決の前に通常の WhatsApp 送信者認可経路を通過します。

## Plugin フックとプライバシー

WhatsApp の受信メッセージには、個人のメッセージ内容、電話番号、
グループ識別子、送信者名、セッション相関フィールドが含まれる場合があります。そのため、
明示的にオプトインしない限り、WhatsApp は受信 `message_received` フックペイロードを Plugin にブロードキャストしません。

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

オプトインを 1 つのアカウントに限定できます。

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

受信 WhatsApp メッセージの内容と識別子を受け取ってよいと信頼できる Plugin に対してのみ、
これを有効にしてください。

## アクセス制御と有効化

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` は直接チャットアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    `allowFrom` は E.164 形式の番号を受け付けます（内部で正規化されます）。

    `allowFrom` は DM 送信者アクセス制御リストです。WhatsApp グループ JID または `@newsletter` チャンネル JID への明示的な送信は制限しません。

    複数アカウントの上書き: `channels.whatsapp.accounts.<id>.dmPolicy`（および `allowFrom`）は、そのアカウントについてチャンネルレベルのデフォルトより優先されます。

    ランタイム動作の詳細:

    - ペアリングはチャンネル許可ストアに永続化され、設定済みの `allowFrom` とマージされます
    - スケジュール済みオートメーションと Heartbeat 受信者フォールバックは、明示的な配信ターゲットまたは設定済みの `allowFrom` を使用します。DM ペアリング承認は暗黙の Cron または Heartbeat 受信者ではありません
    - 許可リストが設定されていない場合、リンク済みの自分の番号がデフォルトで許可されます
    - OpenClaw は送信 `fromMe` DM（リンク済みデバイスから自分自身に送るメッセージ）を自動ペアリングしません

  </Tab>

  <Tab title="Group policy + allowlists">
    グループアクセスには 2 つの層があります。

    1. **グループメンバーシップ許可リスト**（`channels.whatsapp.groups`）
       - `groups` が省略されている場合、すべてのグループが対象になります
       - `groups` が存在する場合、グループ許可リストとして機能します（`"*"` が許可されます）

    2. **グループ送信者ポリシー**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`: 送信者許可リストをバイパス
       - `allowlist`: 送信者は `groupAllowFrom`（または `*`）に一致する必要があります
       - `disabled`: すべてのグループ受信をブロック

    送信者許可リストのフォールバック:

    - `groupAllowFrom` が未設定の場合、ランタイムは利用可能なときに `allowFrom` にフォールバックします
    - 送信者許可リストはメンション/返信による有効化の前に評価されます

    注: `channels.whatsapp` ブロックがまったく存在しない場合、`channels.defaults.groupPolicy` が設定されていても、ランタイムのグループポリシーフォールバックは `allowlist` になります（警告ログ付き）。

  </Tab>

  <Tab title="Mentions + /activation">
    グループ返信にはデフォルトでメンションが必要です。

    メンション検出には次が含まれます。

    - bot アイデンティティへの明示的な WhatsApp メンション
    - 設定済みのメンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバック `messages.groupChat.mentionPatterns`）
    - 認可済みグループメッセージの受信ボイスノート文字起こし
    - bot への暗黙的な返信検出（返信送信者が bot アイデンティティに一致）

    セキュリティ上の注意:

    - 引用/返信はメンションゲートを満たすだけであり、送信者認可を付与するものでは**ありません**
    - `groupPolicy: "allowlist"` では、許可リストにない送信者は、許可リストにあるユーザーのメッセージに返信しても引き続きブロックされます

    セッションレベルの有効化コマンド:

    - `/activation mention`
    - `/activation always`

    `activation` はセッション状態を更新します（グローバル設定ではありません）。これは所有者ゲート付きです。

  </Tab>
</Tabs>

## 設定済み ACP バインディング

WhatsApp はトップレベルの `bindings[]` エントリによる永続 ACP バインディングをサポートします。

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
- グループ allowlist、送信者ポリシー、メンションまたはアクティベーションのゲート処理は、OpenClaw が設定済み ACP セッションの存在を確認する前に実行されます。
- 一致した設定済み ACP バインディングがルートを所有します。WhatsApp ブロードキャストグループは、そのターンを通常の WhatsApp セッションへファンアウトしません。

## 個人番号と自分宛てチャットの動作

リンク済みの自分の番号が `allowFrom` にも含まれている場合、WhatsApp の自分宛てチャット保護が有効になります。

- 自分宛てチャットのターンでは開封確認をスキップする
- 通常なら自分自身に通知してしまうメンション JID 自動トリガー動作を無視する
- `messages.responsePrefix` が未設定の場合、自分宛てチャットの返信はデフォルトで `[{identity.name}]` または `[openclaw]` になる

## メッセージの正規化とコンテキスト

<AccordionGroup>
  <Accordion title="受信エンベロープ + 返信コンテキスト">
    受信 WhatsApp メッセージは共有受信エンベロープでラップされます。

    引用返信が存在する場合、コンテキストは次の形式で追加されます。

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    利用可能な場合、返信メタデータフィールドも入力されます（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、送信者 JID/E.164）。
    引用返信の対象がダウンロード可能なメディアの場合、OpenClaw は通常の受信メディアストアを通じて保存し、`MediaPath`/`MediaType` として公開します。これにより、agent は `<media:image>` だけを見るのではなく、参照された画像を検査できます。

  </Accordion>

  <Accordion title="メディアプレースホルダーと位置情報/連絡先の抽出">
    メディアのみの受信メッセージは、次のようなプレースホルダーで正規化されます。

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    承認済みグループのボイスメモは、本文が `<media:audio>` のみの場合、メンションゲートの前に文字起こしされます。そのため、ボイスメモ内で bot へのメンションを発話すると返信をトリガーできます。文字起こし結果にも bot へのメンションがない場合、未加工のプレースホルダーではなく、文字起こし結果が保留中のグループ履歴に保持されます。

    位置情報の本文は簡潔な座標テキストを使用します。位置情報のラベル/コメントと連絡先/vCard の詳細は、インラインのプロンプトテキストではなく、フェンス付きの信頼されないメタデータとしてレンダリングされます。

  </Accordion>

  <Accordion title="保留中グループ履歴の注入">
    グループでは、未処理メッセージをバッファし、bot が最終的にトリガーされたときにコンテキストとして注入できます。

    - デフォルト上限: `50`
    - 設定: `channels.whatsapp.historyLimit`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効化

    注入マーカー:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="開封確認">
    承認された受信 WhatsApp メッセージでは、開封確認がデフォルトで有効です。

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

    アカウント単位の上書き:

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

    グローバルに有効な場合でも、自分宛てチャットのターンでは開封確認をスキップします。

  </Accordion>
</AccordionGroup>

## 配信、チャンク分割、メディア

<AccordionGroup>
  <Accordion title="テキストのチャンク分割">
    - デフォルトのチャンク上限: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` モードは段落境界（空行）を優先し、その後、長さに安全なチャンク分割へフォールバックします

  </Accordion>

  <Accordion title="送信メディアの動作">
    - 画像、動画、音声（PTT ボイスメモ）、ドキュメントペイロードをサポートします
    - 音声メディアは Baileys の `audio` ペイロードで `ptt: true` として送信されるため、WhatsApp クライアントではプッシュツートークのボイスメモとしてレンダリングされます
    - 返信ペイロードは `audioAsVoice` を保持します。WhatsApp 向け TTS ボイスメモ出力は、プロバイダーが MP3 または WebM を返す場合でも、この PTT パスに留まります
    - ネイティブ Ogg/Opus 音声は、ボイスメモ互換性のため `audio/ogg; codecs=opus` として送信されます
    - Microsoft Edge TTS の MP3/WebM 出力を含む非 Ogg 音声は、PTT 配信前に `ffmpeg` で 48 kHz モノラル Ogg/Opus にトランスコードされます
    - `/tts latest` は最新の assistant 返信を 1 つのボイスメモとして送信し、同じ返信の重複送信を抑制します。`/tts chat on|off|default` は現在の WhatsApp チャットの自動 TTS を制御します
    - アニメーション GIF 再生は、動画送信時の `gifPlayback: true` でサポートされます
    - `forceDocument` / `asDocument` は、解決済みファイル名と MIME タイプを保持しながら WhatsApp のメディア圧縮を回避するため、送信画像、GIF、動画を Baileys のドキュメントペイロードで送信します
    - 複数メディアの返信ペイロードを送信する場合、キャプションは最初のメディア項目に適用されます。ただし PTT ボイスメモでは、WhatsApp クライアントがボイスメモのキャプションを一貫してレンダリングしないため、音声を先に送り、表示テキストを別に送信します
    - メディアソースには HTTP(S)、`file://`、またはローカルパスを使用できます

  </Accordion>

  <Accordion title="メディアサイズ上限とフォールバック動作">
    - 受信メディア保存上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - 送信メディア送信上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - アカウント単位の上書きには `channels.whatsapp.accounts.<accountId>.mediaMaxMb` を使用します
    - `forceDocument` / `asDocument` がドキュメント配信を要求していない限り、画像は上限に収まるよう自動最適化（リサイズ/品質調整）されます
    - メディア送信に失敗した場合、最初の項目のフォールバックとして、応答を黙って破棄する代わりに警告テキストを送信します

  </Accordion>
</AccordionGroup>

## 返信の引用

WhatsApp はネイティブの返信引用をサポートしており、送信返信で受信メッセージを目に見える形で引用できます。`channels.whatsapp.replyToMode` で制御します。

| 値          | 動作                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | 引用しない。通常のメッセージとして送信する                            |
| `"first"`   | 最初の送信返信チャンクのみ引用する                                    |
| `"all"`     | すべての送信返信チャンクを引用する                                    |
| `"batched"` | キューされたバッチ返信を引用し、即時返信は引用しないままにする        |

デフォルトは `"off"` です。アカウント単位の上書きには `channels.whatsapp.accounts.<id>.replyToMode` を使用します。

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

`channels.whatsapp.reactionLevel` は、agent が WhatsApp 上で emoji リアクションをどの範囲まで使用するかを制御します。

| レベル        | 確認応答リアクション | agent 起点リアクション | 説明                                                 |
| ------------- | -------------------- | ---------------------- | ---------------------------------------------------- |
| `"off"`       | いいえ               | いいえ                 | リアクションなし                                     |
| `"ack"`       | はい                 | いいえ                 | 確認応答リアクションのみ（返信前の受領確認）         |
| `"minimal"`   | はい                 | はい（控えめ）         | 確認応答 + 控えめなガイダンスによる agent リアクション |
| `"extensive"` | はい                 | はい（推奨）           | 確認応答 + 推奨ガイダンスによる agent リアクション   |

デフォルト: `"minimal"`。

アカウント単位の上書きには `channels.whatsapp.accounts.<id>.reactionLevel` を使用します。

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## 確認応答リアクション

WhatsApp は、`channels.whatsapp.ackReaction` による受信時の即時確認応答リアクションをサポートします。
確認応答リアクションは `reactionLevel` によってゲートされます。`reactionLevel` が `"off"` の場合は抑制されます。

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

- 受信が承認された直後に送信されます（返信前）
- `ackReaction` が存在し、`emoji` がない場合、WhatsApp はルーティングされた agent の identity emoji を使用し、フォールバックとして "👀" を使用します。確認応答リアクションを送信しないには `ackReaction` を省略するか、`emoji: ""` を設定します
- 失敗はログに記録されますが、通常の返信配信はブロックしません
- グループモード `mentions` はメンショントリガーのターンで反応します。グループアクティベーション `always` はこのチェックのバイパスとして機能します
- WhatsApp は `channels.whatsapp.ackReaction` を使用します（レガシーの `messages.ackReaction` はここでは使用されません）

## ライフサイクルステータスリアクション

`messages.statusReactions.enabled: true` を設定すると、WhatsApp はターン中に静的な受領 emoji を残す代わりに、確認応答リアクションを置き換えられます。有効な場合、OpenClaw はキュー済み、思考中、ツール活動、Compaction、完了、エラーなどのライフサイクル状態に同じ受信メッセージのリアクションスロットを使用します。

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

- `channels.whatsapp.ackReaction` は、ステータスリアクションがダイレクトメッセージとグループで対象になれるかどうかを引き続き制御します。
- キュー済みステータスリアクションは、通常の確認応答リアクションと同じ有効な確認応答 emoji を使用します。
- WhatsApp にはメッセージごとに bot のリアクションスロットが 1 つあるため、ライフサイクル更新は現在のリアクションをその場で置き換えます。
- `messages.removeAckAfterReply: true` は、設定済みの完了/エラー保持時間の後、最終ステータスリアクションをクリアします。
- ツール emoji カテゴリには `tool`、`coding`、`web`、`deploy`、`build`、`concierge` が含まれます。

## 複数アカウントと認証情報

<AccordionGroup>
  <Accordion title="アカウント選択とデフォルト">
    - アカウント ID は `channels.whatsapp.accounts` から取得されます
    - デフォルトのアカウント選択: `default` が存在する場合はそれを使用し、そうでない場合は最初の設定済みアカウント ID（ソート済み）を使用します
    - アカウント ID は検索のため内部的に正規化されます

  </Accordion>

  <Accordion title="認証情報パスとレガシー互換性">
    - 現在の認証パス: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - バックアップファイル: `creds.json.bak`
    - `~/.openclaw/credentials/` 内のレガシーデフォルト認証は、デフォルトアカウントフローで引き続き認識/移行されます

  </Accordion>

  <Accordion title="ログアウト動作">
    `openclaw channels logout --channel whatsapp [--account <id>]` は、そのアカウントの WhatsApp 認証状態をクリアします。

    Gateway に到達可能な場合、ログアウトはまず選択されたアカウントのライブ WhatsApp リスナーを停止します。これにより、次回再起動までリンク済みセッションがメッセージを受信し続けることを防ぎます。`openclaw channels remove --channel whatsapp` も、アカウント設定を無効化または削除する前にライブリスナーを停止します。

    レガシー認証ディレクトリでは、Baileys 認証ファイルが削除される一方で `oauth.json` は保持されます。

  </Accordion>
</AccordionGroup>

## ツール、アクション、設定書き込み

- agent ツールサポートには WhatsApp リアクションアクション（`react`）が含まれます。
- アクションゲート:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- チャネル起点の設定書き込みはデフォルトで有効です（`channels.whatsapp.configWrites=false` で無効化）。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="リンクされていない（QR が必要）">
    症状: チャネルステータスがリンクされていないと報告します。

    修正:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="リンク済みだが切断される / 再接続ループ">
    症状: リンク済みアカウントで切断または再接続試行が繰り返されます。

    静かなアカウントは、通常のメッセージタイムアウトを超えて接続を維持できます。watchdog は、WhatsApp Web トランスポート活動が停止したとき、ソケットが閉じたとき、またはアプリケーションレベルの活動がより長い安全ウィンドウを超えて無音のままになったときに再起動します。

    ログに `status=408 Request Time-out Connection was lost` が繰り返し表示される場合は、
    `web.whatsapp` 配下の Baileys ソケットタイミングを調整します。まず
    `keepAliveIntervalMs` をネットワークのアイドルタイムアウトより短くし、低速または損失の多いリンクでは
    `connectTimeoutMs` を増やします。

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

    ホスト接続性とタイミングを修正してもループが続く場合は、アカウント認証ディレクトリをバックアップし、
    そのアカウントを再リンクします。

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    `~/.openclaw/logs/whatsapp-health.log` に `Gateway inactive` と表示される一方で、
    `openclaw gateway status` と `openclaw channels status --probe` が
    Gateway と WhatsApp が正常であることを示す場合は、`openclaw doctor` を実行します。Linux では、doctor はまだ
    `~/.openclaw/bin/ensure-whatsapp.sh` を呼び出している従来の crontab エントリについて警告します。
    cron には systemd ユーザーバス環境がなく、その古いスクリプトが Gateway の健全性を誤って報告する可能性があるため、
    `crontab -e` でそれらの古いエントリを削除してください。

    必要に応じて、`channels login` で再リンクします。

  </Accordion>

  <Accordion title="プロキシ背後で QR ログインがタイムアウトする">
    症状: `openclaw channels login --channel whatsapp` が、使用可能な QR コードを表示する前に `status=408 Request Time-out` または TLS ソケット切断で失敗します。

    WhatsApp Web ログインは、Gateway ホストの標準プロキシ環境（`HTTPS_PROXY`、`HTTP_PROXY`、小文字のバリアント、および `NO_PROXY`）を使用します。Gateway プロセスがプロキシ環境変数を継承していること、および `NO_PROXY` が `mmg.whatsapp.net` に一致していないことを確認してください。

  </Accordion>

  <Accordion title="送信時にアクティブなリスナーがない">
    対象アカウントにアクティブな Gateway リスナーが存在しない場合、アウトバウンド送信はすぐに失敗します。

    Gateway が実行中で、アカウントがリンク済みであることを確認してください。

  </Accordion>

  <Accordion title="返信がトランスクリプトには表示されるが WhatsApp には表示されない">
    トランスクリプト行は、エージェントが生成した内容を記録します。WhatsApp への配送は別途確認されます。OpenClaw は、少なくとも 1 つの表示可能なテキストまたはメディア送信について Baileys がアウトバウンドメッセージ ID を返した後にのみ、自動返信を送信済みとして扱います。

    ACK リアクションは、返信前の独立した受領確認です。リアクションの成功は、後続のテキストまたはメディア返信が WhatsApp に受け入れられたことの証明にはなりません。

    `auto-reply delivery failed` または `auto-reply was not accepted by WhatsApp provider` がないか Gateway ログを確認してください。

  </Accordion>

  <Accordion title="グループメッセージが予期せず無視される">
    次の順序で確認してください。

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 許可リストエントリ
    - メンションゲート（`requireMention` + メンションパターン）
    - `openclaw.json`（JSON5）内の重複キー: 後のエントリが前のエントリを上書きするため、スコープごとに `groupPolicy` は 1 つだけにしてください

    `channels.whatsapp.groups` が存在する場合でも、WhatsApp は他のグループからのメッセージを観測できますが、OpenClaw はセッションルーティング前にそれらを破棄します。グループ JID を `channels.whatsapp.groups` に追加するか、`groups["*"]` を追加してすべてのグループを受け入れつつ、送信者認可を `groupPolicy` と `groupAllowFrom` の下に維持してください。

  </Accordion>

  <Accordion title="Bun ランタイム警告">
    WhatsApp Gateway ランタイムには Node を使用する必要があります。Bun は、安定した WhatsApp/Telegram Gateway 運用には非互換として扱われます。
  </Accordion>
</AccordionGroup>

## システムプロンプト

WhatsApp は、`groups` と `direct` マップを通じて、グループおよびダイレクトチャット向けの Telegram スタイルのシステムプロンプトをサポートします。

グループメッセージの解決階層:

有効な `groups` マップが最初に決定されます。アカウントが独自の `groups` を定義している場合、それはルートの `groups` マップを完全に置き換えます（ディープマージなし）。その後、プロンプト検索は結果として得られた単一のマップ上で実行されます。

1. **グループ固有のシステムプロンプト**（`groups["<groupId>"].systemPrompt`）: 特定のグループエントリがマップ内に存在し、**かつ**その `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、システムプロンプトは適用されません。
2. **グループワイルドカードシステムプロンプト**（`groups["*"].systemPrompt`）: 特定のグループエントリがマップ内にまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

ダイレクトメッセージの解決階層:

有効な `direct` マップが最初に決定されます。アカウントが独自の `direct` を定義している場合、それはルートの `direct` マップを完全に置き換えます（ディープマージなし）。その後、プロンプト検索は結果として得られた単一のマップ上で実行されます。

1. **ダイレクト固有のシステムプロンプト**（`direct["<peerId>"].systemPrompt`）: 特定のピアエントリがマップ内に存在し、**かつ**その `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、システムプロンプトは適用されません。
2. **ダイレクトワイルドカードシステムプロンプト**（`direct["*"].systemPrompt`）: 特定のピアエントリがマップ内にまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

<Note>
`dms` は、DM ごとの軽量な履歴上書きバケット（`dms.<id>.historyLimit`）のままです。プロンプト上書きは `direct` の下にあります。
</Note>

**Telegram のマルチアカウント動作との違い:** Telegram では、マルチアカウント設定内のすべてのアカウントについて、ルートの `groups` が意図的に抑制されます。これは、自分自身の `groups` を定義していないアカウントであっても、ボットが所属していないグループのグループメッセージを受信するのを防ぐためです。WhatsApp はこのガードを適用しません。構成されているアカウント数に関係なく、アカウントレベルの上書きを定義していないアカウントは常にルートの `groups` とルートの `direct` を継承します。マルチアカウント WhatsApp 設定でアカウントごとのグループまたはダイレクトプロンプトが必要な場合は、ルートレベルのデフォルトに頼るのではなく、各アカウントの下に完全なマップを明示的に定義してください。

重要な動作:

- `channels.whatsapp.groups` は、グループごとの設定マップであると同時に、チャットレベルのグループ許可リストでもあります。ルートまたはアカウントのどちらのスコープでも、`groups["*"]` はそのスコープで「すべてのグループが受け入れられる」ことを意味します。
- ワイルドカードグループ `systemPrompt` は、そのスコープですでにすべてのグループを受け入れたい場合にのみ追加してください。固定されたグループ ID のセットのみを対象にしたい場合は、プロンプトのデフォルトに `groups["*"]` を使用しないでください。代わりに、明示的に許可リスト化した各グループエントリにプロンプトを繰り返し指定してください。
- グループ受け入れと送信者認可は別々のチェックです。`groups["*"]` はグループ処理に到達できるグループの集合を広げますが、それ自体でそれらのグループ内のすべての送信者を認可するわけではありません。送信者アクセスは引き続き `channels.whatsapp.groupPolicy` と `channels.whatsapp.groupAllowFrom` によって別途制御されます。
- `channels.whatsapp.direct` には DM に対する同じ副作用はありません。`direct["*"]` は、DM が `dmPolicy` と `allowFrom` またはペアリングストアルールによってすでに受け入れられた後に、デフォルトのダイレクトチャット設定を提供するだけです。

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
- 配送: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- マルチアカウント: `accounts.<id>.enabled`, `accounts.<id>.authDir`, アカウントレベルの上書き
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
