---
read_when:
    - WhatsApp/ウェブチャンネルの動作または受信トレイのルーティングに取り組む
summary: WhatsApp チャンネル対応、アクセス制御、配信動作、運用
title: WhatsApp
x-i18n:
    generated_at: "2026-05-03T04:57:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f12709fc8ecb45e1b060647daf9a4624485d52b7b6436c3d07f171e6807babf
    source_path: channels/whatsapp.md
    workflow: 16
---

ステータス: WhatsApp Web (Baileys) 経由で本番利用可能。Gateway がリンク済みセッションを管理します。

## インストール（必要時）

- オンボーディング (`openclaw onboard`) と `openclaw channels add --channel whatsapp` は、
  初めて WhatsApp plugin を選択したときに、そのインストールを促します。
- `openclaw channels login --channel whatsapp` も、plugin がまだ存在しない場合は
  インストールフローを提示します。
- Dev チャネル + git checkout: デフォルトでローカル plugin パスを使用します。
- Stable/Beta: 現在の公式リリースタグの npm パッケージ `@openclaw/whatsapp` を使用します。

手動インストールも引き続き利用できます。

```bash
openclaw plugins install @openclaw/whatsapp
```

現在の公式リリースタグに追従するには、ベアパッケージを使用します。再現可能なインストールが必要な場合にのみ、正確な
バージョンに固定してください。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    不明な送信者に対するデフォルトの DM ポリシーはペアリングです。
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

    特定のアカウントの場合:

```bash
openclaw channels login --channel whatsapp --account work
```

    ログイン前に既存またはカスタムの WhatsApp Web 認証ディレクトリを割り当てるには:

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

    ペアリングリクエストは 1 時間後に期限切れになります。保留中のリクエストはチャネルごとに最大 3 件です。

  </Step>
</Steps>

<Note>
OpenClaw は、可能な場合は WhatsApp を別の番号で実行することを推奨します。（チャネルメタデータとセットアップフローはその構成に最適化されていますが、個人番号の構成もサポートされています。）
</Note>

## デプロイパターン

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    これは最も明確な運用モードです。

    - OpenClaw 用に分離された WhatsApp ID
    - より明確な DM 許可リストとルーティング境界
    - 自分とのチャットによる混乱の可能性低下

    最小ポリシーパターン:

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
    オンボーディングは個人番号モードをサポートし、自分とのチャットに適したベースラインを書き込みます。

    - `dmPolicy: "allowlist"`
    - `allowFrom` に個人番号が含まれます
    - `selfChatMode: true`

    ランタイムでは、自分とのチャット保護はリンク済みの自分の番号と `allowFrom` を基準にします。

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    メッセージングプラットフォームチャネルは、現在の OpenClaw チャネルアーキテクチャでは WhatsApp Web ベース（`Baileys`）です。

    組み込みチャットチャネルレジストリには、別個の Twilio WhatsApp メッセージングチャネルはありません。

  </Accordion>
</AccordionGroup>

## ランタイムモデル

- Gateway が WhatsApp ソケットと再接続ループを管理します。
- 再接続ウォッチドッグは、受信アプリメッセージ量だけでなく WhatsApp Web トランスポートアクティビティを使用するため、静かなリンク済みデバイスセッションは、最近誰もメッセージを送っていないという理由だけでは再起動されません。より長いアプリケーション無音上限により、トランスポートフレームが到着し続けていてもウォッチドッグ期間中にアプリケーションメッセージが処理されない場合は再接続が強制されます。最近アクティブだったセッションで一時的な再接続が発生した後、そのアプリケーション無音チェックは最初の復旧期間に通常のメッセージタイムアウトを使用します。
- Baileys ソケットのタイミングは `web.whatsapp.*` 配下で明示されます。`keepAliveIntervalMs` は WhatsApp Web アプリケーション ping を制御し、`connectTimeoutMs` は開始ハンドシェイクのタイムアウトを制御し、`defaultQueryTimeoutMs` は Baileys クエリタイムアウトを制御します。
- 送信には、対象アカウントのアクティブな WhatsApp リスナーが必要です。
- グループ送信では、テキストおよびメディアキャプション内の `@+<digits>` と `@<digits>` トークンが、LID-backed グループを含む現在の WhatsApp 参加者メタデータと一致する場合、ネイティブのメンションメタデータを付与します。
- ステータスおよびブロードキャストチャットは無視されます（`@status`、`@broadcast`）。
- 再接続ウォッチドッグは、受信アプリメッセージ量だけでなく WhatsApp Web トランスポートアクティビティに従います。静かなリンク済みデバイスセッションは、トランスポートフレームが継続している間は維持されますが、トランスポート停止は後続のリモート切断経路よりかなり前に再接続を強制します。
- ダイレクトチャットは DM セッションルールを使用します（`session.dmScope`; デフォルトの `main` は DM をエージェントのメインセッションにまとめます）。
- グループセッションは分離されます（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Channels/Newsletters は、ネイティブの `@newsletter` JID を持つ明示的な送信先にできます。送信 newsletter は、DM セッションセマンティクスではなく、チャネルセッションメタデータ（`agent:<agentId>:whatsapp:channel:<jid>`）を使用します。
- WhatsApp Web トランスポートは、Gateway ホスト上の標準プロキシ環境変数（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` / 小文字のバリアント）を尊重します。チャネル固有の WhatsApp プロキシ設定よりも、ホストレベルのプロキシ設定を優先してください。
- `messages.removeAckAfterReply` が有効な場合、OpenClaw は表示可能な返信が配信された後に WhatsApp ack リアクションをクリアします。

## Plugin フックとプライバシー

WhatsApp の受信メッセージには、個人的なメッセージ内容、電話番号、
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

受信 WhatsApp メッセージの内容と識別子を受け取ることを信頼できる plugins に対してのみ、
これを有効にしてください。

## アクセス制御とアクティベーション

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` はダイレクトチャットアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    `allowFrom` は E.164 形式の番号を受け付けます（内部で正規化されます）。

    `allowFrom` は DM 送信者アクセス制御リストです。WhatsApp グループ JID または `@newsletter` チャネル JID への明示的な送信をゲートしません。

    マルチアカウント上書き: `channels.whatsapp.accounts.<id>.dmPolicy`（および `allowFrom`）は、そのアカウントについてチャネルレベルのデフォルトより優先されます。

    ランタイム動作の詳細:

    - ペアリングはチャネル allow-store に永続化され、設定済みの `allowFrom` とマージされます
    - スケジュール済み自動化と Heartbeat 受信者フォールバックは、明示的な配信先または設定済みの `allowFrom` を使用します。DM ペアリング承認は暗黙の Cron または Heartbeat 受信者ではありません
    - 許可リストが設定されていない場合、リンク済みの自分の番号がデフォルトで許可されます
    - OpenClaw は送信 `fromMe` DM（リンク済みデバイスから自分自身に送信するメッセージ）を自動ペアリングしません

  </Tab>

  <Tab title="Group policy + allowlists">
    グループアクセスには 2 つの層があります。

    1. **グループメンバーシップ許可リスト**（`channels.whatsapp.groups`）
       - `groups` が省略された場合、すべてのグループが対象になります
       - `groups` が存在する場合、グループ許可リストとして機能します（`"*"` を許可）

    2. **グループ送信者ポリシー**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`: 送信者許可リストをバイパス
       - `allowlist`: 送信者は `groupAllowFrom`（または `*`）と一致する必要があります
       - `disabled`: すべてのグループ受信をブロック

    送信者許可リストのフォールバック:

    - `groupAllowFrom` が未設定の場合、ランタイムは利用可能なら `allowFrom` にフォールバックします
    - 送信者許可リストは、メンション/返信アクティベーションより前に評価されます

    注: `channels.whatsapp` ブロックがまったく存在しない場合、`channels.defaults.groupPolicy` が設定されていても、ランタイムのグループポリシーフォールバックは `allowlist`（警告ログ付き）です。

  </Tab>

  <Tab title="Mentions + /activation">
    グループ返信にはデフォルトでメンションが必要です。

    メンション検出には次が含まれます。

    - bot ID への明示的な WhatsApp メンション
    - 設定済みのメンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバック `messages.groupChat.mentionPatterns`）
    - 承認済みグループメッセージの受信ボイスメモ文字起こし
    - bot への暗黙の返信検出（返信送信者が bot ID と一致）

    セキュリティ注記:

    - 引用/返信はメンションゲートを満たすだけです。送信者認可は付与しません
    - `groupPolicy: "allowlist"` では、許可リスト外の送信者は、許可リスト内ユーザーのメッセージに返信した場合でもブロックされます

    セッションレベルのアクティベーションコマンド:

    - `/activation mention`
    - `/activation always`

    `activation` はセッション状態を更新します（グローバル設定ではありません）。これは所有者ゲート付きです。

  </Tab>
</Tabs>

## 個人番号と自分とのチャットの動作

リンク済みの自分の番号が `allowFrom` にも存在する場合、WhatsApp の自分とのチャット保護が有効になります。

- 自分とのチャットターンでは既読通知をスキップ
- そうでなければ自分自身に ping してしまうメンション JID 自動トリガー動作を無視
- `messages.responsePrefix` が未設定の場合、自分とのチャット返信はデフォルトで `[{identity.name}]` または `[openclaw]` になります

## メッセージ正規化とコンテキスト

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    受信 WhatsApp メッセージは共有受信エンベロープにラップされます。

    引用返信が存在する場合、コンテキストは次の形式で追加されます。

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    返信メタデータフィールドも、利用可能な場合は設定されます（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、送信者 JID/E.164）。
    引用返信の対象がダウンロード可能なメディアの場合、OpenClaw は通常の受信メディアストアを通じて保存し、
    それを `MediaPath`/`MediaType` として公開するため、
    エージェントは `<media:image>` だけを見るのではなく、
    参照された画像を検査できます。

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    メディアのみの受信メッセージは、次のようなプレースホルダーで正規化されます。

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    承認済みグループのボイスメモは、本文が `<media:audio>` のみの場合、
    メンションゲートの前に文字起こしされるため、ボイスメモ内で bot メンションを言うことで
    返信をトリガーできます。文字起こしにそれでも bot へのメンションがない場合、
    文字起こしは生のプレースホルダーの代わりに保留中のグループ履歴に保持されます。

    位置情報本文は簡潔な座標テキストを使用します。位置情報ラベル/コメントと連絡先/vCard 詳細は、インラインのプロンプトテキストではなく、フェンス付きの信頼できないメタデータとしてレンダリングされます。

  </Accordion>

  <Accordion title="Pending group history injection">
    グループでは、未処理メッセージをバッファし、bot が最終的にトリガーされたときにコンテキストとして注入できます。

    - デフォルト上限: `50`
    - 設定: `channels.whatsapp.historyLimit`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効化

    注入マーカー:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    受け入れられた受信 WhatsApp メッセージでは、既読通知がデフォルトで有効です。

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

    自分とのチャットのターンでは、グローバルで有効になっていても既読通知をスキップします。

  </Accordion>
</AccordionGroup>

## 配信、チャンク分割、メディア

<AccordionGroup>
  <Accordion title="テキストのチャンク分割">
    - デフォルトのチャンク制限: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` モードは段落境界（空行）を優先し、その後、長さに対して安全なチャンク分割にフォールバックします

  </Accordion>

  <Accordion title="送信メディアの動作">
    - 画像、動画、音声（PTT ボイスメモ）、ドキュメントのペイロードをサポートします
    - 音声メディアは Baileys の `audio` ペイロードで `ptt: true` として送信されるため、WhatsApp クライアントではプッシュ・トゥ・トークのボイスメモとして表示されます
    - 返信ペイロードは `audioAsVoice` を保持します。WhatsApp 向けの TTS ボイスメモ出力は、プロバイダーが MP3 または WebM を返す場合でも、この PTT パスに留まります
    - ネイティブの Ogg/Opus 音声は、ボイスメモ互換性のために `audio/ogg; codecs=opus` として送信されます
    - Microsoft Edge TTS の MP3/WebM 出力を含む非 Ogg 音声は、PTT 配信前に `ffmpeg` で 48 kHz モノラル Ogg/Opus にトランスコードされます
    - `/tts latest` は最新のアシスタント返信を 1 つのボイスメモとして送信し、同じ返信の重複送信を抑止します。`/tts chat on|off|default` は現在の WhatsApp チャットの自動 TTS を制御します
    - アニメーション GIF の再生は、動画送信時の `gifPlayback: true` でサポートされます
    - 複数メディアの返信ペイロードを送信する場合、キャプションは最初のメディア項目に適用されます。ただし PTT ボイスメモでは、WhatsApp クライアントがボイスメモのキャプションを一貫して表示しないため、音声を先に送信し、表示テキストを別に送信します
    - メディアソースには HTTP(S)、`file://`、またはローカルパスを使用できます

  </Accordion>

  <Accordion title="メディアサイズ制限とフォールバック動作">
    - 受信メディアの保存上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - 送信メディアの送信上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - アカウントごとのオーバーライドは `channels.whatsapp.accounts.<accountId>.mediaMaxMb` を使用します
    - 画像は制限内に収まるように自動最適化（リサイズ/品質スイープ）されます
    - メディア送信に失敗した場合、最初の項目のフォールバックは応答を黙って破棄するのではなく、テキスト警告を送信します

  </Accordion>
</AccordionGroup>

## 返信の引用

WhatsApp はネイティブの返信引用をサポートしており、送信返信で受信メッセージを視覚的に引用できます。`channels.whatsapp.replyToMode` で制御します。

| 値          | 動作                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | 引用しません。通常のメッセージとして送信します                        |
| `"first"`   | 最初の送信返信チャンクだけを引用します                                |
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

`channels.whatsapp.reactionLevel` は、エージェントが WhatsApp で絵文字リアクションをどの程度広く使用するかを制御します。

| レベル        | 確認応答リアクション | エージェント開始のリアクション | 説明                                                 |
| ------------- | -------------------- | ------------------------------ | ---------------------------------------------------- |
| `"off"`       | いいえ               | いいえ                         | リアクションは一切ありません                         |
| `"ack"`       | はい                 | いいえ                         | 確認応答リアクションのみ（返信前の受領通知）         |
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

WhatsApp は `channels.whatsapp.ackReaction` を介して、受信時の即時確認応答リアクションをサポートします。
確認応答リアクションは `reactionLevel` で制御されます。`reactionLevel` が `"off"` の場合は抑止されます。

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
- グループモード `mentions` はメンションでトリガーされたターンにリアクションします。グループ有効化 `always` はこのチェックのバイパスとして動作します
- WhatsApp は `channels.whatsapp.ackReaction` を使用します（レガシーの `messages.ackReaction` はここでは使用されません）

## 複数アカウントと認証情報

<AccordionGroup>
  <Accordion title="アカウント選択とデフォルト">
    - アカウント ID は `channels.whatsapp.accounts` から取得されます
    - デフォルトのアカウント選択: `default` が存在する場合はそれを使用し、そうでない場合は最初に設定されたアカウント ID（ソート済み）を使用します
    - アカウント ID は検索用に内部で正規化されます

  </Accordion>

  <Accordion title="認証情報パスとレガシー互換性">
    - 現在の認証パス: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - バックアップファイル: `creds.json.bak`
    - `~/.openclaw/credentials/` 内のレガシーデフォルト認証は、デフォルトアカウントのフローで引き続き認識/移行されます

  </Accordion>

  <Accordion title="ログアウト動作">
    `openclaw channels logout --channel whatsapp [--account <id>]` は、そのアカウントの WhatsApp 認証状態を消去します。

    Gateway に到達できる場合、ログアウトはまず選択したアカウントのライブ WhatsApp リスナーを停止し、次回再起動までリンク済みセッションがメッセージを受信し続けないようにします。`openclaw channels remove --channel whatsapp` も、アカウント設定を無効化または削除する前にライブリスナーを停止します。

    レガシー認証ディレクトリでは、Baileys 認証ファイルは削除されますが、`oauth.json` は保持されます。

  </Accordion>
</AccordionGroup>

## ツール、アクション、設定書き込み

- エージェントツールのサポートには WhatsApp リアクションアクション（`react`）が含まれます。
- アクションゲート:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- チャンネル開始の設定書き込みはデフォルトで有効です（`channels.whatsapp.configWrites=false` で無効化）。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="リンクされていません（QR が必要）">
    症状: チャンネルステータスがリンクされていないと報告します。

    修正:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="リンク済みだが切断される / 再接続ループ">
    症状: リンク済みアカウントで切断または再接続試行が繰り返されます。

    静かなアカウントは、通常のメッセージタイムアウトを超えて接続を維持できます。ウォッチドッグは、WhatsApp Web トランスポートの活動が停止した場合、ソケットが閉じた場合、またはアプリケーションレベルの活動がより長い安全ウィンドウを超えて静かなままの場合に再起動します。

    ログに `status=408 Request Time-out Connection was lost` が繰り返し表示される場合は、`web.whatsapp` の下で Baileys ソケットタイミングを調整してください。まず、`keepAliveIntervalMs` をネットワークのアイドルタイムアウトより短くし、低速または損失の多いリンクでは `connectTimeoutMs` を増やします。

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

    `~/.openclaw/logs/whatsapp-health.log` に `Gateway inactive` と表示される一方で、`openclaw gateway status` と `openclaw channels status --probe` が Gateway と WhatsApp は正常だと示す場合は、`openclaw doctor` を実行します。Linux では、doctor はまだ `~/.openclaw/bin/ensure-whatsapp.sh` を呼び出しているレガシーの crontab エントリについて警告します。cron には systemd ユーザーバス環境がない場合があり、その古いスクリプトが Gateway の健全性を誤って報告する可能性があるため、`crontab -e` でそれらの古いエントリを削除してください。

    必要に応じて、`channels login` で再リンクします。

  </Accordion>

  <Accordion title="プロキシ背後で QR ログインがタイムアウトする">
    症状: `openclaw channels login --channel whatsapp` が使用可能な QR コードを表示する前に、`status=408 Request Time-out` または TLS ソケット切断で失敗します。

    WhatsApp Web ログインは、Gateway ホストの標準プロキシ環境（`HTTPS_PROXY`、`HTTP_PROXY`、小文字のバリアント、および `NO_PROXY`）を使用します。Gateway プロセスがプロキシ環境変数を継承していること、および `NO_PROXY` が `mmg.whatsapp.net` に一致していないことを確認してください。

  </Accordion>

  <Accordion title="送信時にアクティブなリスナーがありません">
    対象アカウントにアクティブな Gateway リスナーが存在しない場合、送信はすぐに失敗します。

    Gateway が実行中で、アカウントがリンクされていることを確認してください。

  </Accordion>

  <Accordion title="返信がトランスクリプトには表示されるが WhatsApp には表示されません">
    トランスクリプトの行には、エージェントが生成した内容が記録されます。WhatsApp 配信は別途チェックされます。OpenClaw は、Baileys が少なくとも 1 つの表示可能なテキストまたはメディア送信について送信メッセージ ID を返した後にのみ、自動返信を送信済みとして扱います。

    確認応答リアクションは独立した返信前の受領通知です。リアクションが成功しても、後続のテキストまたはメディア返信が WhatsApp に受け入れられたことの証明にはなりません。

    Gateway ログで `auto-reply delivery failed` または `auto-reply was not accepted by WhatsApp provider` を確認してください。

  </Accordion>

  <Accordion title="グループメッセージが予期せず無視される">
    この順序で確認してください:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` の許可リストエントリ
    - メンションゲート（`requireMention` + メンションパターン）
    - `openclaw.json`（JSON5）内の重複キー: 後のエントリが前のエントリを上書きするため、スコープごとに `groupPolicy` は 1 つだけにしてください

  </Accordion>

  <Accordion title="Bun ランタイム警告">
    WhatsApp Gateway ランタイムには Node を使用する必要があります。Bun は、安定した WhatsApp/Telegram Gateway の動作に互換性がないものとしてフラグ付けされます。
  </Accordion>
</AccordionGroup>

## システムプロンプト

WhatsApp は、`groups` と `direct` のマップを介して、グループおよび直接チャット向けの Telegram スタイルのシステムプロンプトをサポートします。

グループメッセージの解決階層:

有効な `groups` マップが最初に決定されます。アカウントが独自の `groups` を定義している場合、それはルートの `groups` マップを完全に置き換えます（ディープマージはありません）。その後、プロンプト検索は結果の単一マップ上で実行されます。

1. **グループ固有のシステムプロンプト**（`groups["<groupId>"].systemPrompt`）: 特定のグループエントリがマップ内に存在し、**かつ**その `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑止され、システムプロンプトは適用されません。
2. **グループワイルドカードのシステムプロンプト**（`groups["*"].systemPrompt`）: 特定のグループエントリがマップ内にまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

直接メッセージの解決階層:

有効な `direct` マップが最初に決定されます。アカウントが独自の `direct` を定義している場合、それはルートの `direct` マップを完全に置き換えます（ディープマージはありません）。その後、プロンプト検索は結果の単一マップ上で実行されます。

1. **直接チャット固有のシステムプロンプト**（`direct["<peerId>"].systemPrompt`）: 特定のピアエントリがマップ内に存在し、**かつ**その `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑止され、システムプロンプトは適用されません。
2. **直接チャットワイルドカードのシステムプロンプト**（`direct["*"].systemPrompt`）: 特定のピアエントリがマップ内にまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

<Note>
`dms` は、DM ごとの軽量な履歴オーバーライドバケット（`dms.<id>.historyLimit`）のままです。プロンプトオーバーライドは `direct` の下に配置されます。
</Note>

**Telegram の複数アカウント動作との違い:** Telegram では、複数アカウント構成のすべてのアカウントについて、ルートの `groups` が意図的に抑制されます。これは、独自の `groups` を定義していないアカウントも含み、ボットが所属していないグループのグループメッセージを受信するのを防ぐためです。WhatsApp ではこのガードは適用されません。ルートの `groups` とルートの `direct` は、アカウントレベルの上書きを定義していないアカウントに、構成されているアカウント数に関係なく常に継承されます。複数アカウントの WhatsApp 構成で、アカウントごとのグループまたはダイレクト用プロンプトが必要な場合は、ルートレベルのデフォルトに頼らず、各アカウントの下に完全なマップを明示的に定義してください。

重要な動作:

- `channels.whatsapp.groups` は、グループごとの設定マップであると同時に、チャットレベルのグループ許可リストでもあります。ルートまたはアカウントスコープのどちらでも、`groups["*"]` はそのスコープで「すべてのグループが許可される」ことを意味します。
- そのスコープですべてのグループを許可したい場合にのみ、ワイルドカードグループの `systemPrompt` を追加してください。対象にできるグループ ID を固定セットだけにしたい場合は、プロンプトのデフォルトに `groups["*"]` を使わないでください。代わりに、明示的に許可リストに入れた各グループエントリでプロンプトを繰り返してください。
- グループの許可と送信者の認可は別々のチェックです。`groups["*"]` は、グループ処理に到達できるグループの集合を広げますが、それだけでそれらのグループ内のすべての送信者を認可するわけではありません。送信者アクセスは引き続き `channels.whatsapp.groupPolicy` と `channels.whatsapp.groupAllowFrom` によって別途制御されます。
- `channels.whatsapp.direct` には、DM に対する同じ副作用はありません。`direct["*"]` は、DM が `dmPolicy` と `allowFrom` またはペアリングストアルールによってすでに許可された後に、デフォルトのダイレクトチャット設定を提供するだけです。

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

主要なリファレンス:

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
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
