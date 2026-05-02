---
read_when:
    - WhatsApp/ウェブチャネルの動作または受信トレイのルーティングに取り組む
summary: WhatsApp チャネルのサポート、アクセス制御、配信動作、および運用
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T22:16:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffe2fce121dd1230fbcf20d55ec3855beb22c39f80b926eed41bf56183178ab2
    source_path: channels/whatsapp.md
    workflow: 16
---

ステータス: WhatsApp Web (Baileys) 経由で本番対応済み。Gateway がリンク済みセッションを所有します。

## インストール (オンデマンド)

- オンボーディング (`openclaw onboard`) と `openclaw channels add --channel whatsapp` は、
  初めて WhatsApp plugin を選択したときにインストールを促します。
- `openclaw channels login --channel whatsapp` も、Plugin がまだ存在しない場合は
  インストールフローを提示します。
- Dev チャンネル + git checkout: ローカル Plugin パスがデフォルトです。
- Stable/Beta: 現在の公式リリースタグの npm パッケージ `@openclaw/whatsapp` を使用します。

手動インストールも引き続き利用できます。

```bash
openclaw plugins install @openclaw/whatsapp
```

現在の公式リリースタグに追従するには、素のパッケージを使用してください。再現可能なインストールが必要な場合にのみ、正確なバージョンを固定してください。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    不明な送信者に対するデフォルトの DM ポリシーはペアリングです。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復プレイブックです。
  </Card>
  <Card title="Gateway 設定" icon="settings" href="/ja-JP/gateway/configuration">
    チャンネル設定パターンと例の全体です。
  </Card>
</CardGroup>

## クイックセットアップ

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

  <Step title="WhatsApp をリンクする (QR)">

```bash
openclaw channels login --channel whatsapp
```

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

  <Step title="Gateway を起動する">

```bash
openclaw gateway
```

  </Step>

  <Step title="最初のペアリングリクエストを承認する (ペアリングモードを使用している場合)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    ペアリングリクエストは 1 時間後に期限切れになります。保留中のリクエストはチャンネルごとに 3 件までです。

  </Step>
</Steps>

<Note>
OpenClaw では、可能な場合は WhatsApp を別の番号で実行することを推奨します。(チャンネルメタデータとセットアップフローはその構成向けに最適化されていますが、個人番号の構成もサポートされています。)
</Note>

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用番号 (推奨)">
    これは最も明確な運用モードです。

    - OpenClaw 用の独立した WhatsApp アイデンティティ
    - より明確な DM 許可リストとルーティング境界
    - セルフチャットの混乱が起きる可能性の低下

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

  <Accordion title="個人番号フォールバック">
    オンボーディングは個人番号モードをサポートし、セルフチャットに適したベースラインを書き込みます。

    - `dmPolicy: "allowlist"`
    - `allowFrom` に個人番号を含める
    - `selfChatMode: true`

    ランタイムでは、セルフチャット保護はリンク済みの自分の番号と `allowFrom` をキーにします。

  </Accordion>

  <Accordion title="WhatsApp Web のみのチャンネルスコープ">
    メッセージングプラットフォームのチャンネルは、現在の OpenClaw チャンネルアーキテクチャでは WhatsApp Web ベース (`Baileys`) です。

    組み込みのチャットチャンネルレジストリには、独立した Twilio WhatsApp メッセージングチャンネルはありません。

  </Accordion>
</AccordionGroup>

## ランタイムモデル

- Gateway は WhatsApp ソケットと再接続ループを所有します。
- 再接続ウォッチドッグは、受信アプリメッセージ量だけではなく WhatsApp Web トランスポートのアクティビティを使用するため、静かなリンク済みデバイスセッションは、最近だれもメッセージを送っていないという理由だけでは再起動されません。トランスポートフレームが到着し続けているのにウォッチドッグウィンドウ中にアプリケーションメッセージが処理されない場合は、より長いアプリケーション無音上限によって再接続が強制されます。直近でアクティブだったセッションの一時的な再接続後は、そのアプリケーション無音チェックは最初の復旧ウィンドウで通常のメッセージタイムアウトを使用します。
- Baileys ソケットのタイミングは `web.whatsapp.*` 配下で明示されます。`keepAliveIntervalMs` は WhatsApp Web アプリケーション ping を制御し、`connectTimeoutMs` は開始ハンドシェイクのタイムアウトを制御し、`defaultQueryTimeoutMs` は Baileys クエリタイムアウトを制御します。
- 送信には、対象アカウントのアクティブな WhatsApp リスナーが必要です。
- ステータスとブロードキャストチャットは無視されます (`@status`, `@broadcast`)。
- 再接続ウォッチドッグは、受信アプリメッセージ量だけではなく WhatsApp Web トランスポートのアクティビティに従います。静かなリンク済みデバイスセッションはトランスポートフレームが継続している間は維持されますが、トランスポート停止が発生すると、後続のリモート切断経路よりかなり前に再接続が強制されます。
- 直接チャットは DM セッションルールを使用します (`session.dmScope`; デフォルトの `main` は DM をエージェントのメインセッションにまとめます)。
- グループセッションは分離されます (`agent:<agentId>:whatsapp:group:<jid>`)。
- WhatsApp Channels/Newsletters は、ネイティブの `@newsletter` JID を使って明示的な送信先にできます。ニュースレターへの送信は、DM セッションセマンティクスではなくチャンネルセッションメタデータ (`agent:<agentId>:whatsapp:channel:<jid>`) を使用します。
- WhatsApp Web トランスポートは、Gateway ホスト上の標準プロキシ環境変数 (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / 小文字バリアント) を尊重します。チャンネル固有の WhatsApp プロキシ設定よりも、ホストレベルのプロキシ設定を優先してください。
- `messages.removeAckAfterReply` が有効な場合、OpenClaw は表示可能な返信が配信された後に WhatsApp の ack リアクションをクリアします。

## Plugin フックとプライバシー

WhatsApp の受信メッセージには、個人的なメッセージ内容、電話番号、
グループ識別子、送信者名、セッション相関フィールドが含まれる場合があります。そのため、
WhatsApp は明示的にオプトインしない限り、受信 `message_received` フックペイロードを Plugin にブロードキャストしません。

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

受信 WhatsApp メッセージの内容と識別子を受け取ってよいと信頼できる Plugin に対してのみ、これを有効にしてください。

## アクセス制御とアクティベーション

<Tabs>
  <Tab title="DM ポリシー">
    `channels.whatsapp.dmPolicy` は直接チャットアクセスを制御します。

    - `pairing` (デフォルト)
    - `allowlist`
    - `open` (`allowFrom` に `"*"` を含める必要があります)
    - `disabled`

    `allowFrom` は E.164 形式の番号を受け付けます (内部で正規化されます)。

    `allowFrom` は DM 送信者アクセス制御リストです。WhatsApp グループ JID や `@newsletter` チャンネル JID への明示的な送信は制限しません。

    マルチアカウントのオーバーライド: `channels.whatsapp.accounts.<id>.dmPolicy` (および `allowFrom`) は、そのアカウントについてチャンネルレベルのデフォルトより優先されます。

    ランタイム動作の詳細:

    - ペアリングはチャンネル許可ストアに永続化され、設定済みの `allowFrom` とマージされます
    - スケジュール済み自動化と Heartbeat 受信者フォールバックは、明示的な配信先または設定済みの `allowFrom` を使用します。DM ペアリング承認は暗黙の Cron または Heartbeat 受信者ではありません
    - 許可リストが設定されていない場合、リンク済みの自分の番号がデフォルトで許可されます
    - OpenClaw は送信 `fromMe` DM (リンク済みデバイスから自分自身に送るメッセージ) を自動ペアリングしません

  </Tab>

  <Tab title="グループポリシー + 許可リスト">
    グループアクセスには 2 つのレイヤーがあります。

    1. **グループメンバーシップ許可リスト** (`channels.whatsapp.groups`)
       - `groups` が省略された場合、すべてのグループが対象になります
       - `groups` が存在する場合、グループ許可リストとして機能します (`"*"` が許可されます)

    2. **グループ送信者ポリシー** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: 送信者許可リストをバイパスします
       - `allowlist`: 送信者が `groupAllowFrom` (または `*`) に一致する必要があります
       - `disabled`: すべてのグループ受信をブロックします

    送信者許可リストのフォールバック:

    - `groupAllowFrom` が未設定の場合、ランタイムは利用可能なら `allowFrom` にフォールバックします
    - 送信者許可リストはメンション/返信アクティベーションの前に評価されます

    注: `channels.whatsapp` ブロックがまったく存在しない場合、`channels.defaults.groupPolicy` が設定されていても、ランタイムのグループポリシーフォールバックは `allowlist` になります (警告ログ付き)。

  </Tab>

  <Tab title="メンション + /activation">
    グループ返信にはデフォルトでメンションが必要です。

    メンション検出には次が含まれます。

    - bot アイデンティティへの明示的な WhatsApp メンション
    - 設定済みのメンション正規表現パターン (`agents.list[].groupChat.mentionPatterns`、フォールバック `messages.groupChat.mentionPatterns`)
    - 認可済みグループメッセージの受信ボイスノート文字起こし
    - bot への暗黙的な返信検出 (返信送信者が bot アイデンティティと一致)

    セキュリティ上の注意:

    - 引用/返信はメンションゲートだけを満たします。送信者認可は付与しません
    - `groupPolicy: "allowlist"` では、許可リストにない送信者は、許可リストにあるユーザーのメッセージに返信した場合でもブロックされます

    セッションレベルのアクティベーションコマンド:

    - `/activation mention`
    - `/activation always`

    `activation` はセッション状態を更新します (グローバル設定ではありません)。これは所有者ゲート付きです。

  </Tab>
</Tabs>

## 個人番号とセルフチャットの動作

リンク済みの自分の番号が `allowFrom` にも存在する場合、WhatsApp セルフチャット保護が有効になります。

- セルフチャットターンの既読通知をスキップします
- 自分自身に ping してしまうメンション JID の自動トリガー動作を無視します
- `messages.responsePrefix` が未設定の場合、セルフチャット返信はデフォルトで `[{identity.name}]` または `[openclaw]` になります

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

    返信メタデータフィールドも、利用可能な場合は設定されます (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, 送信者 JID/E.164)。
    引用返信の対象がダウンロード可能なメディアの場合、OpenClaw はそれを
    通常の受信メディアストア経由で保存し、`MediaPath`/`MediaType` として公開するため、
    エージェントは `<media:image>` だけを見るのではなく、
    参照された画像を検査できます。

  </Accordion>

  <Accordion title="メディアプレースホルダーと位置情報/連絡先抽出">
    メディアのみの受信メッセージは、次のようなプレースホルダーで正規化されます。

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    認可済みグループのボイスノートは、本文が `<media:audio>` のみの場合、
    メンションゲートの前に文字起こしされるため、ボイスノート内で bot メンションを言うと
    返信をトリガーできます。文字起こしにまだ bot へのメンションがない場合、
    文字起こしは生のプレースホルダーではなく保留中のグループ履歴に保持されます。

    位置情報本文は簡潔な座標テキストを使用します。位置情報ラベル/コメントと連絡先/vCard 詳細は、インラインのプロンプトテキストではなく、フェンス付きの信頼されていないメタデータとしてレンダリングされます。

  </Accordion>

  <Accordion title="保留中のグループ履歴の注入">
    グループでは、未処理メッセージをバッファし、最終的に bot がトリガーされたときにコンテキストとして注入できます。

    - デフォルト上限: `50`
    - 設定: `channels.whatsapp.historyLimit`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` は無効化します

    注入マーカー:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="既読通知">
    受理された受信 WhatsApp メッセージでは、既読通知がデフォルトで有効です。

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

    アカウント単位のオーバーライド:

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

    セルフチャットのターンでは、グローバルに有効化されている場合でも開封通知をスキップします。

  </Accordion>
</AccordionGroup>

## 配信、チャンク化、メディア

<AccordionGroup>
  <Accordion title="テキストのチャンク化">
    - デフォルトのチャンク上限: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` モードは段落境界（空行）を優先し、その後、長さ制限に安全なチャンク化へフォールバックします

  </Accordion>

  <Accordion title="送信メディアの動作">
    - 画像、動画、音声（PTT ボイスノート）、ドキュメントペイロードをサポートします
    - 音声メディアは Baileys の `audio` ペイロードで `ptt: true` として送信されるため、WhatsApp クライアントではプッシュトゥトークのボイスノートとして表示されます
    - 返信ペイロードは `audioAsVoice` を保持します。WhatsApp 向け TTS ボイスノート出力は、プロバイダーが MP3 または WebM を返す場合でも、この PTT 経路に留まります
    - ネイティブ Ogg/Opus 音声は、ボイスノート互換性のため `audio/ogg; codecs=opus` として送信されます
    - Microsoft Edge TTS の MP3/WebM 出力を含む非 Ogg 音声は、PTT 配信の前に `ffmpeg` で 48 kHz モノラル Ogg/Opus にトランスコードされます
    - `/tts latest` は最新のアシスタント返信を 1 つのボイスノートとして送信し、同じ返信の重複送信を抑制します。`/tts chat on|off|default` は現在の WhatsApp チャットの自動 TTS を制御します
    - 動画送信時の `gifPlayback: true` により、アニメーション GIF 再生がサポートされます
    - 複数メディアの返信ペイロードを送信する場合、キャプションは最初のメディア項目に適用されます。ただし、PTT ボイスノートでは音声を先に送信し、表示テキストを別に送信します。これは WhatsApp クライアントがボイスノートのキャプションを一貫して表示しないためです
    - メディアソースには HTTP(S)、`file://`、またはローカルパスを使用できます

  </Accordion>

  <Accordion title="メディアサイズ制限とフォールバック動作">
    - 受信メディアの保存上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - 送信メディアの送信上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - アカウントごとの上書きには `channels.whatsapp.accounts.<accountId>.mediaMaxMb` を使用します
    - 画像は制限内に収まるよう自動最適化（リサイズ/品質調整）されます
    - メディア送信に失敗した場合、最初の項目のフォールバックとして、レスポンスを黙って破棄する代わりにテキスト警告を送信します

  </Accordion>
</AccordionGroup>

## 返信の引用

WhatsApp はネイティブの返信引用をサポートしており、送信返信では受信メッセージが見える形で引用されます。`channels.whatsapp.replyToMode` で制御します。

| 値          | 動作                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | 引用しません。通常のメッセージとして送信します                        |
| `"first"`   | 最初の送信返信チャンクのみ引用します                                  |
| `"all"`     | すべての送信返信チャンクを引用します                                  |
| `"batched"` | キューに入ったバッチ返信を引用し、即時返信は引用しないままにします    |

デフォルトは `"off"` です。アカウントごとの上書きには `channels.whatsapp.accounts.<id>.replyToMode` を使用します。

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

`channels.whatsapp.reactionLevel` は、エージェントが WhatsApp で絵文字リアクションをどの程度広く使うかを制御します。

| レベル        | Ack リアクション | エージェント起点のリアクション | 説明                                                 |
| ------------- | ---------------- | ------------------------------ | ---------------------------------------------------- |
| `"off"`       | いいえ           | いいえ                         | リアクションは一切ありません                         |
| `"ack"`       | はい             | いいえ                         | Ack リアクションのみ（返信前の受信確認）             |
| `"minimal"`   | はい             | はい（控えめ）                 | Ack + 控えめなガイダンス付きのエージェントリアクション |
| `"extensive"` | はい             | はい（推奨）                   | Ack + 推奨ガイダンス付きのエージェントリアクション   |

デフォルト: `"minimal"`。

アカウントごとの上書きには `channels.whatsapp.accounts.<id>.reactionLevel` を使用します。

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

WhatsApp は `channels.whatsapp.ackReaction` により、受信時の即時 Ack リアクションをサポートします。
Ack リアクションは `reactionLevel` によって制御され、`reactionLevel` が `"off"` の場合は抑制されます。

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

- 受信が受理された直後（返信前）に送信されます
- 失敗はログに記録されますが、通常の返信配信はブロックしません
- グループモード `mentions` はメンションでトリガーされたターンでリアクションします。グループ有効化 `always` はこのチェックのバイパスとして機能します
- WhatsApp は `channels.whatsapp.ackReaction` を使用します（レガシーの `messages.ackReaction` はここでは使用されません）

## 複数アカウントと認証情報

<AccordionGroup>
  <Accordion title="アカウント選択とデフォルト">
    - アカウント ID は `channels.whatsapp.accounts` から取得されます
    - デフォルトのアカウント選択: `default` が存在する場合はそれを使用し、それ以外の場合は最初に構成されたアカウント ID（ソート済み）を使用します
    - アカウント ID は検索用に内部で正規化されます

  </Accordion>

  <Accordion title="認証情報パスとレガシー互換性">
    - 現在の認証パス: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - バックアップファイル: `creds.json.bak`
    - `~/.openclaw/credentials/` 内のレガシーデフォルト認証は、デフォルトアカウントのフローでは引き続き認識/移行されます

  </Accordion>

  <Accordion title="ログアウト動作">
    `openclaw channels logout --channel whatsapp [--account <id>]` は、そのアカウントの WhatsApp 認証状態をクリアします。

    Gateway に到達できる場合、ログアウトはまず選択されたアカウントの稼働中 WhatsApp リスナーを停止し、リンク済みセッションが次回再起動までメッセージを受信し続けないようにします。`openclaw channels remove --channel whatsapp` も、アカウント設定を無効化または削除する前に稼働中リスナーを停止します。

    レガシー認証ディレクトリでは、Baileys 認証ファイルが削除される一方で `oauth.json` は保持されます。

  </Accordion>
</AccordionGroup>

## ツール、アクション、設定書き込み

- エージェントのツールサポートには WhatsApp リアクションアクション（`react`）が含まれます。
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
    症状: リンク済みアカウントで切断または再接続の試行が繰り返されます。

    静かなアカウントは通常のメッセージタイムアウトを超えて接続を維持できます。ウォッチドッグは、WhatsApp Web トランスポートのアクティビティが停止したとき、ソケットが閉じたとき、またはアプリケーションレベルのアクティビティがより長い安全時間枠を超えて無音のままになったときに再起動します。

    ログに `status=408 Request Time-out Connection was lost` が繰り返し表示される場合は、`web.whatsapp` の下で Baileys ソケットタイミングを調整します。まず `keepAliveIntervalMs` をネットワークのアイドルタイムアウトより短くし、低速または損失の多いリンクでは `connectTimeoutMs` を増やします。

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

    `~/.openclaw/logs/whatsapp-health.log` に `Gateway inactive` と表示されている一方で、`openclaw gateway status` と `openclaw channels status --probe` では gateway と WhatsApp が正常と表示される場合は、`openclaw doctor` を実行します。Linux では、doctor が、まだ `~/.openclaw/bin/ensure-whatsapp.sh` を呼び出しているレガシー crontab エントリについて警告します。cron には systemd ユーザーバス環境がない場合があり、その古いスクリプトが gateway のヘルスを誤って報告することがあるため、`crontab -e` でそれらの古いエントリを削除してください。

    必要に応じて、`channels login` で再リンクします。

  </Accordion>

  <Accordion title="プロキシ背後で QR ログインがタイムアウトする">
    症状: `openclaw channels login --channel whatsapp` が、使用可能な QR コードを表示する前に `status=408 Request Time-out` または TLS ソケット切断で失敗します。

    WhatsApp Web ログインは、gateway ホストの標準プロキシ環境（`HTTPS_PROXY`、`HTTP_PROXY`、小文字のバリアント、および `NO_PROXY`）を使用します。gateway プロセスがプロキシ環境を継承していること、および `NO_PROXY` が `mmg.whatsapp.net` に一致しないことを確認してください。

  </Accordion>

  <Accordion title="送信時にアクティブなリスナーがない">
    対象アカウントにアクティブな gateway リスナーが存在しない場合、送信はすぐに失敗します。

    gateway が実行中で、アカウントがリンク済みであることを確認してください。

  </Accordion>

  <Accordion title="返信がトランスクリプトには表示されるが WhatsApp には表示されない">
    トランスクリプト行はエージェントが生成した内容を記録します。WhatsApp 配信は別途チェックされます。OpenClaw は、少なくとも 1 つの表示テキストまたはメディア送信について Baileys が送信メッセージ ID を返した後にのみ、自動返信を送信済みとして扱います。

    Ack リアクションは独立した返信前の受信確認です。リアクションの成功は、後続のテキストまたはメディア返信が WhatsApp に受理されたことを証明するものではありません。

    gateway ログで `auto-reply delivery failed` または `auto-reply was not accepted by WhatsApp provider` を確認してください。

  </Accordion>

  <Accordion title="グループメッセージが予期せず無視される">
    次の順序で確認してください。

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 許可リストエントリ
    - メンションゲート（`requireMention` + メンションパターン）
    - `openclaw.json`（JSON5）内の重複キー: 後のエントリが前のエントリを上書きするため、スコープごとに `groupPolicy` は 1 つだけにしてください

  </Accordion>

  <Accordion title="Bun ランタイム警告">
    WhatsApp gateway ランタイムには Node を使用する必要があります。Bun は、安定した WhatsApp/Telegram gateway 動作とは互換性がないものとしてフラグ付けされます。
  </Accordion>
</AccordionGroup>

## システムプロンプト

WhatsApp は、`groups` と `direct` マップを介して、グループおよびダイレクトチャット向けの Telegram 形式のシステムプロンプトをサポートします。

グループメッセージの解決階層:

有効な `groups` マップが最初に決定されます。アカウントが独自の `groups` を定義している場合、それはルートの `groups` マップを完全に置き換えます（ディープマージなし）。その後、プロンプト検索は結果として得られた単一のマップ上で実行されます。

1. **グループ固有のシステムプロンプト**（`groups["<groupId>"].systemPrompt`）: 特定のグループエントリがマップに存在し、かつその `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、システムプロンプトは適用されません。
2. **グループワイルドカードシステムプロンプト**（`groups["*"].systemPrompt`）: 特定のグループエントリがマップにまったく存在しない場合、または存在しても `systemPrompt` キーを定義していない場合に使用されます。

ダイレクトメッセージの解決階層:

有効な `direct` マップが最初に決定されます。アカウントが独自の `direct` を定義している場合、それはルートの `direct` マップを完全に置き換えます（ディープマージなし）。その後、プロンプト検索は結果として得られた単一のマップ上で実行されます。

1. **ダイレクト固有のシステムプロンプト**（`direct["<peerId>"].systemPrompt`）: 特定のピアエントリがマップに存在し、かつその `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、システムプロンプトは適用されません。
2. **ダイレクトワイルドカードシステムプロンプト**（`direct["*"].systemPrompt`）: 特定のピアエントリがマップにまったく存在しない場合、または存在しても `systemPrompt` キーを定義していない場合に使用されます。

<Note>
`dms` は、DM ごとの軽量な履歴上書きバケット（`dms.<id>.historyLimit`）のままです。プロンプトの上書きは `direct` の下に置かれます。
</Note>

**Telegram のマルチアカウント動作との違い:** Telegram では、マルチアカウント設定のすべてのアカウントでルートの `groups` が意図的に抑制されます。これは、独自の `groups` を定義していないアカウントも含み、bot が所属していないグループのグループメッセージを受信しないようにするためです。WhatsApp ではこのガードは適用されません。設定されているアカウント数に関係なく、アカウントレベルのオーバーライドを定義していないアカウントは、常にルートの `groups` とルートの `direct` を継承します。マルチアカウントの WhatsApp 設定で、アカウントごとのグループまたはダイレクトプロンプトを使いたい場合は、ルートレベルのデフォルトに依存せず、各アカウントの下に完全なマップを明示的に定義してください。

重要な動作:

- `channels.whatsapp.groups` は、グループごとの設定マップであると同時に、チャットレベルのグループ許可リストでもあります。ルートまたはアカウントのどちらのスコープでも、`groups["*"]` はそのスコープで「すべてのグループが受け入れられる」ことを意味します。
- そのスコープですでにすべてのグループを受け入れたい場合にのみ、ワイルドカードグループ `systemPrompt` を追加してください。対象にできるグループ ID を固定セットのみにしたい場合は、プロンプトのデフォルトとして `groups["*"]` を使用しないでください。代わりに、明示的に許可リストに入れた各グループエントリでプロンプトを繰り返してください。
- グループ受け入れと送信者認可は別々のチェックです。`groups["*"]` はグループ処理に到達できるグループの集合を広げますが、それだけでそれらのグループ内のすべての送信者を認可するわけではありません。送信者アクセスは引き続き `channels.whatsapp.groupPolicy` と `channels.whatsapp.groupAllowFrom` によって個別に制御されます。
- `channels.whatsapp.direct` には、DM に対して同じ副作用はありません。`direct["*"]` は、`dmPolicy` に加えて `allowFrom` またはペアリングストアのルールによって DM がすでに受け入れられた後に、デフォルトのダイレクトチャット設定を提供するだけです。

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

主なリファレンス:

- [設定リファレンス - WhatsApp](/ja-JP/gateway/config-channels#whatsapp)

特に重要な WhatsApp フィールド:

- アクセス: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- 配信: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- マルチアカウント: `accounts.<id>.enabled`, `accounts.<id>.authDir`, アカウントレベルのオーバーライド
- 運用: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- セッション動作: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- プロンプト: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## 関連情報

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [セキュリティ](/ja-JP/gateway/security)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
