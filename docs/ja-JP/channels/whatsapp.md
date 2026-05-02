---
read_when:
    - WhatsApp/ウェブチャネルの動作または受信箱ルーティングに取り組む
summary: WhatsApp チャネル対応、アクセス制御、配信動作、運用
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T20:42:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb8afa93f0470e0454cf59e19193d8c2f204db63b428a4de579e93f01bf3ee62
    source_path: channels/whatsapp.md
    workflow: 16
---

状態: WhatsApp Web (Baileys) 経由で本番利用可能。Gateway がリンク済みセッションを管理します。

## インストール（必要時）

- オンボーディング（`openclaw onboard`）と `openclaw channels add --channel whatsapp` は、
  WhatsApp Plugin を初めて選択したときにインストールするよう促します。
- `openclaw channels login --channel whatsapp` も、Plugin がまだ存在しない場合は
  インストールフローを提示します。
- Dev チャネル + git checkout: ローカル Plugin パスがデフォルトです。
- Stable/Beta: 現在のパッケージが公開されている場合、npm パッケージ `@openclaw/whatsapp` を使用します。

手動インストールも引き続き利用できます。

```bash
openclaw plugins install @openclaw/whatsapp
```

npm が OpenClaw 所有のパッケージを非推奨または存在しないと報告する場合は、
npm パッケージ列が追いつくまで、現在のパッケージ済み OpenClaw ビルドまたはローカル checkout を使用してください。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    不明な送信者に対するデフォルトの DM ポリシーはペアリングです。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    クロスチャネル診断と修復プレイブックです。
  </Card>
  <Card title="Gateway 設定" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャネル設定パターンと例です。
  </Card>
</CardGroup>

## クイック設定

<Steps>
  <Step title="WhatsApp アクセスポリシーを設定する">

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

  <Step title="WhatsApp をリンクする（QR）">

```bash
openclaw channels login --channel whatsapp
```

    特定のアカウントの場合:

```bash
openclaw channels login --channel whatsapp --account work
```

    ログイン前に既存またはカスタムの WhatsApp Web 認証ディレクトリを接続するには:

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

  <Step title="最初のペアリングリクエストを承認する（ペアリングモードを使用している場合）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    ペアリングリクエストは 1 時間後に期限切れになります。保留中のリクエストはチャネルごとに 3 件までです。

  </Step>
</Steps>

<Note>
OpenClaw では、可能な場合は別の番号で WhatsApp を実行することを推奨します。（チャネルメタデータとセットアップフローはその構成に最適化されていますが、個人番号の構成もサポートされています。）
</Note>

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用番号（推奨）">
    これは最もクリーンな運用モードです。

    - OpenClaw 用の別個の WhatsApp ID
    - より明確な DM 許可リストとルーティング境界
    - セルフチャットの混乱が起きる可能性の低減

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

  <Accordion title="個人番号フォールバック">
    オンボーディングは個人番号モードをサポートし、セルフチャットに適したベースラインを書き込みます。

    - `dmPolicy: "allowlist"`
    - `allowFrom` に個人番号を含める
    - `selfChatMode: true`

    ランタイムでは、セルフチャット保護はリンク済みの自己番号と `allowFrom` を基準にします。

  </Accordion>

  <Accordion title="WhatsApp Web のみのチャネル範囲">
    メッセージングプラットフォームのチャネルは、現在の OpenClaw チャネルアーキテクチャでは WhatsApp Web ベース（`Baileys`）です。

    組み込みのチャットチャネルレジストリには、個別の Twilio WhatsApp メッセージングチャネルはありません。

  </Accordion>
</AccordionGroup>

## ランタイムモデル

- Gateway が WhatsApp ソケットと再接続ループを管理します。
- 再接続 watchdog は、受信アプリメッセージ量だけでなく WhatsApp Web トランスポートアクティビティを使用するため、静かなリンク済みデバイスセッションは、最近誰もメッセージを送っていないという理由だけでは再起動されません。より長いアプリケーション無音上限により、トランスポートフレームが到着し続けていても watchdog ウィンドウ内でアプリケーションメッセージが処理されない場合は、引き続き再接続が強制されます。最近アクティブだったセッションの一時的な再接続後、そのアプリケーション無音チェックでは最初の復旧ウィンドウに通常のメッセージタイムアウトを使用します。
- Baileys ソケットのタイミングは `web.whatsapp.*` 配下で明示されます。`keepAliveIntervalMs` は WhatsApp Web アプリケーション ping を制御し、`connectTimeoutMs` は開始ハンドシェイクのタイムアウトを制御し、`defaultQueryTimeoutMs` は Baileys クエリタイムアウトを制御します。
- 送信には、対象アカウントに対してアクティブな WhatsApp listener が必要です。
- ステータスおよびブロードキャストチャットは無視されます（`@status`、`@broadcast`）。
- 再接続 watchdog は、受信アプリメッセージ量だけでなく WhatsApp Web トランスポートアクティビティに従います。静かなリンク済みデバイスセッションはトランスポートフレームが継続する限り維持されますが、トランスポート停止は後続のリモート切断パスよりもかなり前に再接続を強制します。
- ダイレクトチャットは DM セッションルールを使用します（`session.dmScope`; デフォルトの `main` は DM を agent main session に統合します）。
- グループセッションは分離されます（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Channels/Newsletters は、ネイティブの `@newsletter` JID を持つ明示的な送信先にできます。newsletter 送信では、DM セッションの意味論ではなくチャネルセッションメタデータ（`agent:<agentId>:whatsapp:channel:<jid>`）を使用します。
- WhatsApp Web トランスポートは、Gateway ホスト上の標準プロキシ環境変数（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` / 小文字バリアント）を尊重します。チャネル固有の WhatsApp プロキシ設定よりも、ホストレベルのプロキシ設定を優先してください。
- `messages.removeAckAfterReply` が有効な場合、OpenClaw は表示可能な返信が配信された後に WhatsApp ack リアクションをクリアします。

## Plugin フックとプライバシー

WhatsApp の受信メッセージには、個人のメッセージ内容、電話番号、
グループ識別子、送信者名、セッション相関フィールドが含まれる場合があります。そのため、
WhatsApp は、明示的にオプトインしない限り、受信 `message_received` フックペイロードを Plugin にブロードキャストしません。

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

受信 WhatsApp メッセージの内容と識別子を受け取ることを信頼できる Plugin に対してのみ、これを有効にしてください。

## アクセス制御とアクティベーション

<Tabs>
  <Tab title="DM ポリシー">
    `channels.whatsapp.dmPolicy` はダイレクトチャットアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    `allowFrom` は E.164 形式の番号を受け付けます（内部で正規化されます）。

    `allowFrom` は DM 送信者のアクセス制御リストです。WhatsApp グループ JID や `@newsletter` チャネル JID への明示的な送信は制限しません。

    マルチアカウントの上書き: `channels.whatsapp.accounts.<id>.dmPolicy`（および `allowFrom`）は、そのアカウントについてチャネルレベルのデフォルトより優先されます。

    ランタイム動作の詳細:

    - ペアリングはチャネル許可ストアに永続化され、設定済みの `allowFrom` とマージされます
    - スケジュール済み自動化と Heartbeat 受信者フォールバックは、明示的な配信先または設定済みの `allowFrom` を使用します。DM ペアリング承認は暗黙の Cron または Heartbeat 受信者ではありません
    - 許可リストが設定されていない場合、リンク済みの自己番号がデフォルトで許可されます
    - OpenClaw は送信 `fromMe` DM（リンク済みデバイスから自分自身に送るメッセージ）を自動ペアリングしません

  </Tab>

  <Tab title="グループポリシー + 許可リスト">
    グループアクセスには 2 つの層があります。

    1. **グループメンバーシップ許可リスト**（`channels.whatsapp.groups`）
       - `groups` が省略されている場合、すべてのグループが対象になります
       - `groups` が存在する場合、グループ許可リストとして機能します（`"*"` が許可されます）

    2. **グループ送信者ポリシー**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`: 送信者許可リストをバイパスします
       - `allowlist`: 送信者は `groupAllowFrom`（または `*`）に一致する必要があります
       - `disabled`: すべてのグループ受信をブロックします

    送信者許可リストのフォールバック:

    - `groupAllowFrom` が未設定の場合、ランタイムは利用可能であれば `allowFrom` にフォールバックします
    - 送信者許可リストは mention/reply アクティベーションより前に評価されます

    注: `channels.whatsapp` ブロックがまったく存在しない場合、`channels.defaults.groupPolicy` が設定されていても、ランタイムのグループポリシーフォールバックは `allowlist` になります（警告ログ付き）。

  </Tab>

  <Tab title="メンション + /activation">
    グループ返信にはデフォルトでメンションが必要です。

    メンション検出には次が含まれます。

    - bot ID への明示的な WhatsApp メンション
    - 設定済みのメンション regex パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - 承認済みグループメッセージの受信 voice-note transcript
    - 暗黙的な bot への返信検出（返信送信者が bot ID と一致）

    セキュリティ上の注意:

    - quote/reply はメンションゲートを満たすだけであり、送信者認可は付与しません
    - `groupPolicy: "allowlist"` では、許可リスト外の送信者は、許可リスト内ユーザーのメッセージに返信した場合でも引き続きブロックされます

    セッションレベルのアクティベーションコマンド:

    - `/activation mention`
    - `/activation always`

    `activation` はセッション状態を更新します（グローバル設定ではありません）。これは owner-gated です。

  </Tab>
</Tabs>

## 個人番号とセルフチャットの動作

リンク済みの自己番号が `allowFrom` にも存在する場合、WhatsApp セルフチャット保護が有効になります。

- セルフチャット turn では read receipts をスキップします
- 自分自身に ping してしまう mention-JID 自動トリガー動作を無視します
- `messages.responsePrefix` が未設定の場合、セルフチャット返信のデフォルトは `[{identity.name}]` または `[openclaw]` です

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

    返信メタデータフィールドも、利用可能な場合に入力されます（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、送信者 JID/E.164）。
    引用返信対象がダウンロード可能なメディアの場合、OpenClaw は通常の受信メディアストアを通じて保存し、
    `MediaPath`/`MediaType` として公開するため、agent は
    `<media:image>` だけを見るのではなく、参照された画像を検査できます。

  </Accordion>

  <Accordion title="メディアプレースホルダーと位置情報/連絡先の抽出">
    メディアのみの受信メッセージは、次のようなプレースホルダーで正規化されます。

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    承認済みグループのボイスメモは、本文が `<media:audio>` のみの場合、メンションゲートの前に文字起こしされるため、
    ボイスメモ内で bot メンションを言うと
    返信をトリガーできます。文字起こしにまだ bot へのメンションが含まれていない場合、
    生のプレースホルダーではなく、文字起こしが保留中のグループ履歴に保持されます。

    位置情報本文は簡潔な座標テキストを使用します。位置情報ラベル/コメントと連絡先/vCard 詳細は、インラインプロンプトテキストではなく、fenced された信頼できないメタデータとしてレンダリングされます。

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

  <Accordion title="既読通知">
    受け入れられた受信 WhatsApp メッセージでは、既読通知がデフォルトで有効です。

    グローバルに無効化するには:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    アカウントごとの上書き:

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

    自分自身とのチャットのターンでは、グローバルに有効な場合でも既読通知はスキップされます。

  </Accordion>
</AccordionGroup>

## 配信、チャンク分割、メディア

<AccordionGroup>
  <Accordion title="テキストのチャンク分割">
    - デフォルトのチャンク上限: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` モードは段落境界（空行）を優先し、その後、長さに対して安全なチャンク分割にフォールバックします

  </Accordion>

  <Accordion title="送信メディアの動作">
    - 画像、動画、音声（PTT ボイスメモ）、ドキュメントのペイロードをサポートします
    - 音声メディアは Baileys の `audio` ペイロードで `ptt: true` として送信されるため、WhatsApp クライアントではプッシュトゥトークのボイスメモとして表示されます
    - 返信ペイロードは `audioAsVoice` を保持します。WhatsApp 向けの TTS ボイスメモ出力は、プロバイダーが MP3 または WebM を返す場合でも、この PTT 経路に残ります
    - ネイティブの Ogg/Opus 音声は、ボイスメモ互換性のために `audio/ogg; codecs=opus` として送信されます
    - Microsoft Edge TTS の MP3/WebM 出力を含む Ogg 以外の音声は、PTT 配信の前に `ffmpeg` で 48 kHz モノラル Ogg/Opus にトランスコードされます
    - `/tts latest` は最新のアシスタント返信を 1 つのボイスメモとして送信し、同じ返信の重複送信を抑制します。`/tts chat on|off|default` は現在の WhatsApp チャットの自動 TTS を制御します
    - アニメーション GIF の再生は、動画送信時の `gifPlayback: true` でサポートされます
    - 複数メディアの返信ペイロードを送信する場合、キャプションは最初のメディア項目に適用されます。ただし、PTT ボイスメモでは、WhatsApp クライアントがボイスメモのキャプションを一貫して表示しないため、音声を先に送信し、表示テキストは別に送信します
    - メディアソースには HTTP(S)、`file://`、またはローカルパスを使用できます

  </Accordion>

  <Accordion title="メディアサイズ上限とフォールバック動作">
    - 受信メディアの保存上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - 送信メディアの送信上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - アカウントごとのオーバーライドは `channels.whatsapp.accounts.<accountId>.mediaMaxMb` を使用します
    - 画像は上限に収まるように自動最適化（リサイズ/品質スイープ）されます
    - メディア送信に失敗した場合、最初の項目のフォールバックは応答を黙って破棄する代わりにテキスト警告を送信します

  </Accordion>
</AccordionGroup>

## 返信の引用

WhatsApp はネイティブの返信引用をサポートしており、送信返信では受信メッセージが見える形で引用されます。`channels.whatsapp.replyToMode` で制御します。

| 値          | 動作                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | 引用しません。通常のメッセージとして送信します                        |
| `"first"`   | 最初の送信返信チャンクのみ引用します                                  |
| `"all"`     | すべての送信返信チャンクを引用します                                  |
| `"batched"` | キューされたバッチ返信を引用し、即時返信は引用しないままにします      |

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

`channels.whatsapp.reactionLevel` は、エージェントが WhatsApp で絵文字リアクションをどの程度広く使用するかを制御します。

| レベル        | 確認応答リアクション | エージェント起点のリアクション | 説明                                             |
| ------------- | -------------------- | ------------------------------ | ------------------------------------------------ |
| `"off"`       | いいえ               | いいえ                         | リアクションを一切使用しません                   |
| `"ack"`       | はい                 | いいえ                         | 確認応答リアクションのみ（返信前の受領確認）     |
| `"minimal"`   | はい                 | はい（控えめ）                 | 確認応答 + 控えめなガイダンスによるエージェントリアクション |
| `"extensive"` | はい                 | はい（推奨）                   | 確認応答 + 推奨ガイダンスによるエージェントリアクション |

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

## 確認応答リアクション

WhatsApp は、`channels.whatsapp.ackReaction` による受信時の即時確認応答リアクションをサポートします。
確認応答リアクションは `reactionLevel` によって制御され、`reactionLevel` が `"off"` の場合は抑制されます。

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

- 受信が受け付けられた直後（返信前）に送信されます
- 失敗はログに記録されますが、通常の返信配信はブロックしません
- グループモード `mentions` はメンションでトリガーされたターンでリアクションします。グループ有効化 `always` はこのチェックのバイパスとして機能します
- WhatsApp は `channels.whatsapp.ackReaction` を使用します（レガシーの `messages.ackReaction` はここでは使用されません）

## 複数アカウントと認証情報

<AccordionGroup>
  <Accordion title="アカウント選択とデフォルト">
    - アカウント ID は `channels.whatsapp.accounts` から取得されます
    - デフォルトのアカウント選択: `default` が存在する場合はそれを使用し、それ以外の場合は最初に設定されたアカウント ID（ソート済み）を使用します
    - アカウント ID は検索用に内部で正規化されます

  </Accordion>

  <Accordion title="認証情報パスとレガシー互換性">
    - 現在の認証パス: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - バックアップファイル: `creds.json.bak`
    - `~/.openclaw/credentials/` 内のレガシーのデフォルト認証は、デフォルトアカウントのフローで引き続き認識/移行されます

  </Accordion>

  <Accordion title="ログアウト動作">
    `openclaw channels logout --channel whatsapp [--account <id>]` は、そのアカウントの WhatsApp 認証状態を消去します。

    Gateway に到達可能な場合、ログアウトではまず選択したアカウントのライブ WhatsApp リスナーを停止するため、リンク済みセッションが次回再起動までメッセージを受信し続けることはありません。`openclaw channels remove --channel whatsapp` も、アカウント設定を無効化または削除する前にライブリスナーを停止します。

    レガシー認証ディレクトリでは、Baileys 認証ファイルが削除される一方で、`oauth.json` は保持されます。

  </Accordion>
</AccordionGroup>

## ツール、アクション、設定書き込み

- エージェントツールのサポートには WhatsApp リアクションアクション（`react`）が含まれます。
- アクションゲート:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- チャンネル起点の設定書き込みはデフォルトで有効です（`channels.whatsapp.configWrites=false` で無効化）。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="リンクされていない（QR が必要）">
    症状: チャンネルステータスでリンクされていないと報告されます。

    修正:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="リンク済みだが切断される / 再接続ループ">
    症状: リンク済みアカウントで切断または再接続試行が繰り返されます。

    静かなアカウントは通常のメッセージタイムアウトを超えて接続を維持できます。ウォッチドッグは、WhatsApp Web トランスポートのアクティビティが停止した場合、ソケットが閉じた場合、またはアプリケーションレベルのアクティビティがより長い安全ウィンドウを超えて無音のままの場合に再起動します。

    ログに `status=408 Request Time-out Connection was lost` が繰り返し表示される場合は、`web.whatsapp` の Baileys ソケットタイミングを調整します。まず、`keepAliveIntervalMs` をネットワークのアイドルタイムアウトより短くし、低速または損失の多いリンクでは `connectTimeoutMs` を増やします。

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
    openclaw doctor
    openclaw logs --follow
    ```

    `~/.openclaw/logs/whatsapp-health.log` に `Gateway inactive` と表示されるが、`openclaw gateway status` と `openclaw channels status --probe` で Gateway と WhatsApp が正常と表示される場合は、`openclaw doctor` を実行してください。Linux では、doctor が、引き続き `~/.openclaw/bin/ensure-whatsapp.sh` を呼び出しているレガシー crontab エントリについて警告します。cron には systemd ユーザーバス環境がない場合があり、その古いスクリプトが Gateway のヘルスを誤報告する可能性があるため、`crontab -e` でそれらの古いエントリを削除してください。

    必要に応じて、`channels login` で再リンクしてください。

  </Accordion>

  <Accordion title="プロキシ配下で QR ログインがタイムアウトする">
    症状: `openclaw channels login --channel whatsapp` が、使用可能な QR コードを表示する前に `status=408 Request Time-out` または TLS ソケット切断で失敗します。

    WhatsApp Web ログインは、Gateway ホストの標準プロキシ環境（`HTTPS_PROXY`、`HTTP_PROXY`、小文字のバリアント、`NO_PROXY`）を使用します。Gateway プロセスがプロキシ環境変数を継承していること、および `NO_PROXY` が `mmg.whatsapp.net` に一致していないことを確認してください。

  </Accordion>

  <Accordion title="送信時にアクティブなリスナーがない">
    対象アカウントにアクティブな Gateway リスナーが存在しない場合、送信はすぐに失敗します。

    Gateway が実行中で、アカウントがリンクされていることを確認してください。

  </Accordion>

  <Accordion title="返信がトランスクリプトには表示されるが WhatsApp には表示されない">
    トランスクリプト行には、エージェントが生成した内容が記録されます。WhatsApp 配信は別に確認されます。OpenClaw は、少なくとも 1 つの表示可能なテキストまたはメディア送信について Baileys が送信メッセージ ID を返した後にのみ、自動返信を送信済みとして扱います。

    確認応答リアクションは独立した返信前の受領確認です。リアクションが成功しても、後続のテキストまたはメディア返信が WhatsApp に受け付けられたことの証明にはなりません。

    Gateway ログで `auto-reply delivery failed` または `auto-reply was not accepted by WhatsApp provider` を確認してください。

  </Accordion>

  <Accordion title="グループメッセージが予期せず無視される">
    次の順序で確認してください。

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 許可リストエントリ
    - メンションゲート（`requireMention` + メンションパターン）
    - `openclaw.json`（JSON5）の重複キー: 後のエントリが前のエントリを上書きするため、スコープごとに `groupPolicy` は 1 つだけ保持してください

  </Accordion>

  <Accordion title="Bun ランタイム警告">
    WhatsApp Gateway ランタイムには Node を使用する必要があります。Bun は、安定した WhatsApp/Telegram Gateway 操作には非互換としてフラグ付けされています。
  </Accordion>
</AccordionGroup>

## システムプロンプト

WhatsApp は、`groups` と `direct` マップを介して、グループおよび直接チャット向けの Telegram 形式のシステムプロンプトをサポートします。

グループメッセージの解決階層:

有効な `groups` マップが最初に決定されます。アカウントが独自の `groups` を定義している場合、それはルートの `groups` マップを完全に置き換えます（ディープマージなし）。その後、プロンプト検索は結果として得られた単一のマップに対して実行されます。

1. **グループ固有のシステムプロンプト**（`groups["<groupId>"].systemPrompt`）: 特定のグループエントリがマップ内に存在し、**かつ** その `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、システムプロンプトは適用されません。
2. **グループワイルドカードのシステムプロンプト**（`groups["*"].systemPrompt`）: 特定のグループエントリがマップにまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

直接メッセージの解決階層:

有効な `direct` マップが最初に決定されます。アカウントが独自の `direct` を定義している場合、それはルートの `direct` マップを完全に置き換えます（ディープマージなし）。その後、プロンプト検索は結果として得られた単一のマップに対して実行されます。

1. **直接チャット固有のシステムプロンプト**（`direct["<peerId>"].systemPrompt`）: 特定のピアエントリがマップ内に存在し、**かつ** その `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、システムプロンプトは適用されません。
2. **直接チャットワイルドカードのシステムプロンプト**（`direct["*"].systemPrompt`）: 特定のピアエントリがマップにまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

<Note>
`dms` は軽量な DM ごとの履歴オーバーライド用バケット（`dms.<id>.historyLimit`）のままです。プロンプトのオーバーライドは `direct` の下にあります。
</Note>

**Telegram の複数アカウント動作との違い:** Telegram では、複数アカウント設定内のすべてのアカウントに対して、ルートの `groups` が意図的に抑制されます。これは、独自の `groups` を定義していないアカウントも含みます。ボットが所属していないグループのグループメッセージを受信しないようにするためです。WhatsApp ではこのガードは適用されません。ルートの `groups` とルートの `direct` は、アカウントレベルの上書きを定義していないアカウントに常に継承され、設定されているアカウント数には左右されません。複数アカウントの WhatsApp 設定で、アカウントごとのグループまたはダイレクト用プロンプトが必要な場合は、ルートレベルのデフォルトに依存せず、各アカウントの下に完全なマップを明示的に定義してください。

重要な動作:

- `channels.whatsapp.groups` は、グループごとの設定マップであると同時に、チャットレベルのグループ許可リストでもあります。ルートまたはアカウントのどちらのスコープでも、`groups["*"]` はそのスコープで「すべてのグループを許可する」ことを意味します。
- ワイルドカードグループの `systemPrompt` は、そのスコープですでにすべてのグループを許可したい場合にのみ追加してください。対象にできるグループ ID を固定セットのみにしたい場合は、プロンプトのデフォルトとして `groups["*"]` を使わないでください。代わりに、明示的に許可リストへ追加した各グループエントリでプロンプトを繰り返してください。
- グループの許可と送信者の認可は別々のチェックです。`groups["*"]` はグループ処理に到達できるグループの集合を広げますが、それ自体でそれらのグループ内のすべての送信者を認可するわけではありません。送信者アクセスは引き続き `channels.whatsapp.groupPolicy` と `channels.whatsapp.groupAllowFrom` によって別途制御されます。
- `channels.whatsapp.direct` は DM に対して同じ副作用を持ちません。`direct["*"]` は、DM がすでに `dmPolicy` と `allowFrom` またはペアリングストアのルールによって許可された後に、デフォルトのダイレクトチャット設定を提供するだけです。

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

主要リファレンス:

- [設定リファレンス - WhatsApp](/ja-JP/gateway/config-channels#whatsapp)

重要度の高い WhatsApp フィールド:

- アクセス: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- 配信: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- 複数アカウント: `accounts.<id>.enabled`, `accounts.<id>.authDir`, アカウントレベルの上書き
- 運用: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- セッション動作: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- プロンプト: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [セキュリティ](/ja-JP/gateway/security)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [複数エージェントルーティング](/ja-JP/concepts/multi-agent)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
