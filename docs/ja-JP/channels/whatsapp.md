---
read_when:
    - WhatsApp/web チャネルの動作または受信トレイのルーティングに取り組む
summary: WhatsApp チャネルのサポート、アクセス制御、配信動作、運用
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T04:50:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: c25380f6a08e771b1a3f5e39f2284cffbffe76a3b05f1a885efe0a5f6a7d022c
    source_path: channels/whatsapp.md
    workflow: 16
---

ステータス: WhatsApp Web (Baileys) 経由で本番利用可能。Gateway がリンク済みセッションを所有します。

## インストール (オンデマンド)

- オンボーディング (`openclaw onboard`) と `openclaw channels add --channel whatsapp` は、
  最初に WhatsApp Plugin を選択したときにインストールを促します。
- `openclaw channels login --channel whatsapp` も、Plugin がまだ存在しない場合は
  インストールフローを提示します。
- 開発チャネル + git チェックアウト: デフォルトでローカル Plugin パスを使用します。
- Stable/Beta: 現在のパッケージが公開されている場合は npm パッケージ
  `@openclaw/whatsapp` を使用します。

手動インストールも引き続き利用できます。

```bash
openclaw plugins install @openclaw/whatsapp
```

npm が OpenClaw 所有のパッケージを非推奨または欠落として報告する場合は、npm パッケージの配信が追いつくまで、
現在のパッケージ済み OpenClaw ビルドまたはローカルチェックアウトを使用してください。

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

    ログイン前に既存またはカスタムの WhatsApp Web 認証ディレクトリを接続するには:

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

    ペアリングリクエストは 1 時間後に期限切れになります。保留中のリクエストはチャネルごとに 3 件までです。

  </Step>
</Steps>

<Note>
OpenClaw は、可能な場合は WhatsApp を別の番号で実行することを推奨します。(チャネルメタデータとセットアップフローはその構成向けに最適化されていますが、個人番号の構成もサポートされています。)
</Note>

## デプロイパターン

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    これは最も明確な運用モードです。

    - OpenClaw 用の別個の WhatsApp ID
    - より明確な DM 許可リストとルーティング境界
    - 自分とのチャットによる混乱の可能性が低い

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
    - `allowFrom` に個人番号を含める
    - `selfChatMode: true`

    実行時には、自分とのチャットの保護はリンク済みの自分の番号と `allowFrom` をキーにします。

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    メッセージングプラットフォームのチャネルは、現在の OpenClaw チャネルアーキテクチャでは WhatsApp Web ベース (`Baileys`) です。

    組み込みチャットチャネルレジストリには、別個の Twilio WhatsApp メッセージングチャネルはありません。

  </Accordion>
</AccordionGroup>

## ランタイムモデル

- Gateway が WhatsApp ソケットと再接続ループを所有します。
- 再接続ウォッチドッグは、受信アプリメッセージ量だけではなく WhatsApp Web トランスポートアクティビティを使用するため、静かなリンク済みデバイスセッションは、最近誰もメッセージを送信していないという理由だけでは再起動されません。より長いアプリケーション無音上限は、トランスポートフレームが到着し続けているにもかかわらずウォッチドッグ期間中にアプリケーションメッセージが処理されない場合、引き続き再接続を強制します。最近アクティブだったセッションの一時的な再接続後、そのアプリケーション無音チェックは、最初の復旧期間に通常のメッセージタイムアウトを使用します。
- Baileys ソケットのタイミングは `web.whatsapp.*` 配下で明示されます。`keepAliveIntervalMs` は WhatsApp Web アプリケーション ping を制御し、`connectTimeoutMs` は開始ハンドシェイクのタイムアウトを制御し、`defaultQueryTimeoutMs` は Baileys クエリタイムアウトを制御します。
- 送信には、対象アカウントのアクティブな WhatsApp リスナーが必要です。
- ステータスチャットとブロードキャストチャットは無視されます (`@status`, `@broadcast`)。
- 再接続ウォッチドッグは、受信アプリメッセージ量だけではなく WhatsApp Web トランスポートアクティビティに従います。静かなリンク済みデバイスセッションはトランスポートフレームが続く限り維持されますが、トランスポート停止は後続のリモート切断経路よりかなり前に再接続を強制します。
- ダイレクトチャットは DM セッションルールを使用します (`session.dmScope`; デフォルトの `main` は DM をエージェントのメインセッションにまとめます)。
- グループセッションは分離されます (`agent:<agentId>:whatsapp:group:<jid>`)。
- WhatsApp Web トランスポートは Gateway ホスト上の標準プロキシ環境変数を尊重します (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / 小文字バリアント)。チャネル固有の WhatsApp プロキシ設定よりも、ホストレベルのプロキシ設定を優先してください。
- `messages.removeAckAfterReply` が有効な場合、OpenClaw は表示可能な返信が配信された後に WhatsApp の確認リアクションをクリアします。

## Plugin フックとプライバシー

WhatsApp の受信メッセージには、個人のメッセージ内容、電話番号、
グループ識別子、送信者名、セッション相関フィールドが含まれる可能性があります。そのため、
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

オプトインを 1 つのアカウントにスコープできます。

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

受信 WhatsApp メッセージの内容と識別子を受け取ることを信頼できる Plugin に対してのみ、
これを有効にしてください。

## アクセス制御と有効化

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` はダイレクトチャットアクセスを制御します。

    - `pairing` (デフォルト)
    - `allowlist`
    - `open` (`allowFrom` に `"*"` を含める必要があります)
    - `disabled`

    `allowFrom` は E.164 形式の番号を受け付けます (内部で正規化されます)。

    マルチアカウントの上書き: `channels.whatsapp.accounts.<id>.dmPolicy` (および `allowFrom`) は、そのアカウントのチャネルレベルのデフォルトより優先されます。

    実行時の動作の詳細:

    - ペアリングはチャネル許可ストアに永続化され、設定済みの `allowFrom` とマージされます
    - 許可リストが設定されていない場合、リンク済みの自分の番号がデフォルトで許可されます
    - OpenClaw は送信 `fromMe` DM (リンク済みデバイスから自分自身へ送信するメッセージ) を自動ペアリングしません

  </Tab>

  <Tab title="Group policy + allowlists">
    グループアクセスには 2 つの層があります。

    1. **グループメンバーシップ許可リスト** (`channels.whatsapp.groups`)
       - `groups` が省略されている場合、すべてのグループが対象になります
       - `groups` が存在する場合、グループ許可リストとして機能します (`"*"` は許可されます)

    2. **グループ送信者ポリシー** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: 送信者許可リストをバイパス
       - `allowlist`: 送信者が `groupAllowFrom` (または `*`) と一致する必要があります
       - `disabled`: すべてのグループ受信をブロック

    送信者許可リストのフォールバック:

    - `groupAllowFrom` が未設定の場合、実行時は利用可能であれば `allowFrom` にフォールバックします
    - 送信者許可リストはメンション/返信による有効化の前に評価されます

    注: `channels.whatsapp` ブロックがまったく存在しない場合、`channels.defaults.groupPolicy` が設定されていても、実行時のグループポリシーフォールバックは `allowlist` です (警告ログ付き)。

  </Tab>

  <Tab title="Mentions + /activation">
    グループ返信にはデフォルトでメンションが必要です。

    メンション検出には次が含まれます。

    - ボット ID への明示的な WhatsApp メンション
    - 設定済みのメンション正規表現パターン (`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`)
    - 許可されたグループメッセージの受信ボイスノート文字起こし
    - 暗黙的なボットへの返信検出 (返信送信者がボット ID と一致)

    セキュリティ注記:

    - 引用/返信はメンションゲートを満たすだけで、送信者認可を付与するものでは**ありません**
    - `groupPolicy: "allowlist"` では、許可リスト外の送信者は、許可リスト内ユーザーのメッセージに返信した場合でもブロックされます

    セッションレベルの有効化コマンド:

    - `/activation mention`
    - `/activation always`

    `activation` はセッション状態を更新します (グローバル設定ではありません)。これは所有者でゲートされます。

  </Tab>
</Tabs>

## 個人番号と自分とのチャットの動作

リンク済みの自分の番号が `allowFrom` にも存在する場合、WhatsApp の自分とのチャット保護が有効になります。

- 自分とのチャットのターンでは既読通知をスキップ
- それ以外なら自分自身を ping するメンション JID 自動トリガー動作を無視
- `messages.responsePrefix` が未設定の場合、自分とのチャットへの返信はデフォルトで `[{identity.name}]` または `[openclaw]` になります

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

    返信メタデータフィールドも、利用可能な場合は設定されます (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, 送信者 JID/E.164)。
    引用返信の対象がダウンロード可能なメディアの場合、OpenClaw はそれを通常の受信メディアストア経由で保存し、
    `MediaPath`/`MediaType` として公開するため、エージェントは
    `<media:image>` だけを見るのではなく、参照された画像を検査できます。

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    メディアのみの受信メッセージは、次のようなプレースホルダーで正規化されます。

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    許可されたグループのボイスノートは、本文が `<media:audio>` のみの場合、メンションゲートの前に文字起こしされるため、
    ボイスノート内でボットへのメンションを発話すると返信をトリガーできます。文字起こしにそれでもボットへのメンションが含まれない場合、
    生のプレースホルダーではなく、文字起こしが保留中のグループ履歴に保持されます。

    位置情報の本文は簡潔な座標テキストを使用します。位置情報のラベル/コメントと連絡先/vCard の詳細は、インラインのプロンプトテキストではなく、フェンス付きの信頼されていないメタデータとしてレンダリングされます。

  </Accordion>

  <Accordion title="Pending group history injection">
    グループでは、未処理メッセージをバッファし、ボットが最終的にトリガーされたときにコンテキストとして挿入できます。

    - デフォルト上限: `50`
    - 設定: `channels.whatsapp.historyLimit`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効化

    挿入マーカー:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
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

    自分とのチャットのターンでは、グローバルに有効な場合でも既読通知をスキップします。

  </Accordion>
</AccordionGroup>

## 配信、チャンク化、メディア

<AccordionGroup>
  <Accordion title="テキストのチャンク分割">
    - デフォルトのチャンク制限: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` モードは段落境界（空行）を優先し、その後、長さに対して安全なチャンク分割にフォールバックします

  </Accordion>

  <Accordion title="送信メディアの動作">
    - 画像、動画、音声（PTT ボイスノート）、ドキュメントのペイロードをサポートします
    - 音声メディアは Baileys の `audio` ペイロードで `ptt: true` として送信されるため、WhatsApp クライアントではプッシュトゥトークのボイスノートとして表示されます
    - 返信ペイロードは `audioAsVoice` を保持します。WhatsApp 向けの TTS ボイスノート出力は、プロバイダーが MP3 または WebM を返す場合でも、この PTT パスにとどまります
    - ネイティブ Ogg/Opus 音声は、ボイスノート互換性のために `audio/ogg; codecs=opus` として送信されます
    - Microsoft Edge TTS の MP3/WebM 出力を含む非 Ogg 音声は、PTT 配信前に `ffmpeg` で 48 kHz モノラル Ogg/Opus にトランスコードされます
    - `/tts latest` は最新のアシスタント返信を 1 つのボイスノートとして送信し、同じ返信の繰り返し送信を抑制します。`/tts chat on|off|default` は現在の WhatsApp チャットの自動 TTS を制御します
    - 動画送信時の `gifPlayback: true` により、アニメーション GIF の再生がサポートされます
    - 複数メディアの返信ペイロードを送信する場合、キャプションは最初のメディア項目に適用されます。ただし、PTT ボイスノートでは音声を先に送信し、表示テキストを別に送信します。これは WhatsApp クライアントがボイスノートのキャプションを一貫して表示しないためです
    - メディアソースには HTTP(S)、`file://`、またはローカルパスを使用できます

  </Accordion>

  <Accordion title="メディアサイズ制限とフォールバック動作">
    - 受信メディア保存上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - 送信メディア送信上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - アカウントごとの上書きは `channels.whatsapp.accounts.<accountId>.mediaMaxMb` を使用します
    - 画像は制限に収まるよう自動最適化（リサイズ/品質スイープ）されます
    - メディア送信失敗時、最初の項目のフォールバックはレスポンスを黙って破棄せず、テキスト警告を送信します

  </Accordion>
</AccordionGroup>

## 返信の引用

WhatsApp はネイティブの返信引用をサポートしており、送信返信で受信メッセージを視覚的に引用できます。`channels.whatsapp.replyToMode` で制御します。

| 値          | 動作                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | 引用しません。通常のメッセージとして送信します                        |
| `"first"`   | 最初の送信返信チャンクのみを引用します                                |
| `"all"`     | すべての送信返信チャンクを引用します                                  |
| `"batched"` | キューに入ったバッチ返信を引用し、即時返信は引用しません              |

デフォルトは `"off"` です。アカウントごとの上書きは `channels.whatsapp.accounts.<id>.replyToMode` を使用します。

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

| レベル        | Ack リアクション | エージェント起点のリアクション | 説明                                             |
| ------------- | ---------------- | ------------------------------ | ------------------------------------------------ |
| `"off"`       | いいえ           | いいえ                         | リアクションを一切行いません                     |
| `"ack"`       | はい             | いいえ                         | Ack リアクションのみ（返信前の受信確認）         |
| `"minimal"`   | はい             | はい（控えめ）                 | Ack + 控えめなガイダンスによるエージェントリアクション |
| `"extensive"` | はい             | はい（推奨）                   | Ack + 推奨ガイダンスによるエージェントリアクション |

デフォルト: `"minimal"`。

アカウントごとの上書きは `channels.whatsapp.accounts.<id>.reactionLevel` を使用します。

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

WhatsApp は `channels.whatsapp.ackReaction` により、受信時の即時 ack リアクションをサポートします。
Ack リアクションは `reactionLevel` によって制御されます。`reactionLevel` が `"off"` の場合は抑制されます。

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

- 受信が受け入れられた直後（返信前）に送信されます
- 失敗はログに記録されますが、通常の返信配信はブロックしません
- グループモード `mentions` はメンションをきっかけにしたターンでリアクションします。グループ有効化 `always` はこのチェックのバイパスとして機能します
- WhatsApp は `channels.whatsapp.ackReaction` を使用します（従来の `messages.ackReaction` はここでは使用されません）

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
    - `~/.openclaw/credentials/` の従来のデフォルト認証は、デフォルトアカウントのフローで引き続き認識/移行されます

  </Accordion>

  <Accordion title="ログアウト動作">
    `openclaw channels logout --channel whatsapp [--account <id>]` は、そのアカウントの WhatsApp 認証状態をクリアします。

    Gateway に到達できる場合、ログアウトはまず選択されたアカウントのライブ WhatsApp リスナーを停止し、リンク済みセッションが次回再起動までメッセージを受信し続けないようにします。`openclaw channels remove --channel whatsapp` も、アカウント設定を無効化または削除する前にライブリスナーを停止します。

    レガシー認証ディレクトリでは、Baileys 認証ファイルが削除される一方で `oauth.json` は保持されます。

  </Accordion>
</AccordionGroup>

## ツール、アクション、設定書き込み

- エージェントツールのサポートには WhatsApp リアクションアクション（`react`）が含まれます。
- アクションゲート:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- チャネル起点の設定書き込みはデフォルトで有効です（`channels.whatsapp.configWrites=false` で無効化）。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="リンクされていない（QR が必要）">
    症状: チャネルステータスが未リンクと報告します。

    修正:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="リンク済みだが切断される / 再接続ループ">
    症状: リンク済みアカウントで切断または再接続試行が繰り返されます。

    静かなアカウントは通常のメッセージタイムアウトを超えて接続を維持できます。ウォッチドッグは、WhatsApp Web トランスポートのアクティビティが停止したとき、ソケットが閉じたとき、またはアプリケーションレベルのアクティビティがより長い安全ウィンドウを超えて沈黙したときに再起動します。

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
    openclaw doctor
    openclaw logs --follow
    ```

    `~/.openclaw/logs/whatsapp-health.log` に `Gateway inactive` と表示される一方で、`openclaw gateway status` と `openclaw channels status --probe` が Gateway と WhatsApp は正常であることを示す場合は、`openclaw doctor` を実行します。Linux では、doctor はまだ `~/.openclaw/bin/ensure-whatsapp.sh` を呼び出すレガシー crontab エントリについて警告します。cron は systemd のユーザーバス環境を持たないことがあり、その古いスクリプトが Gateway の健全性を誤って報告する原因になるため、`crontab -e` でそれらの古いエントリを削除してください。

    必要に応じて、`channels login` で再リンクします。

  </Accordion>

  <Accordion title="プロキシ背後で QR ログインがタイムアウトする">
    症状: `openclaw channels login --channel whatsapp` が、利用可能な QR コードを表示する前に `status=408 Request Time-out` または TLS ソケット切断で失敗します。

    WhatsApp Web ログインは、Gateway ホストの標準プロキシ環境（`HTTPS_PROXY`、`HTTP_PROXY`、小文字のバリアント、`NO_PROXY`）を使用します。Gateway プロセスがプロキシ env を継承していること、および `NO_PROXY` が `mmg.whatsapp.net` に一致しないことを確認してください。

  </Accordion>

  <Accordion title="送信時にアクティブなリスナーがない">
    対象アカウントにアクティブな Gateway リスナーが存在しない場合、送信は即座に失敗します。

    Gateway が実行中で、アカウントがリンクされていることを確認してください。

  </Accordion>

  <Accordion title="返信がトランスクリプトには表示されるが WhatsApp には表示されない">
    トランスクリプト行はエージェントが生成した内容を記録します。WhatsApp 配信は別途チェックされます。OpenClaw は、少なくとも 1 つの表示テキストまたはメディア送信について Baileys が送信メッセージ ID を返した後にのみ、自動返信を送信済みとして扱います。

    Ack リアクションは返信前の独立した受信確認です。リアクションが成功しても、後続のテキストまたはメディア返信が WhatsApp に受け入れられたことの証明にはなりません。

    `auto-reply delivery failed` または `auto-reply was not accepted by WhatsApp provider` について Gateway ログを確認してください。

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
    WhatsApp Gateway ランタイムには Node を使用する必要があります。Bun は、安定した WhatsApp/Telegram Gateway 運用に対して非互換としてフラグ付けされます。
  </Accordion>
</AccordionGroup>

## システムプロンプト

WhatsApp は、`groups` および `direct` マップを介して、グループとダイレクトチャット向けの Telegram スタイルのシステムプロンプトをサポートします。

グループメッセージの解決階層:

有効な `groups` マップが最初に決定されます。アカウントが独自の `groups` を定義している場合、それはルートの `groups` マップを完全に置き換えます（ディープマージなし）。その後、プロンプト検索は結果として得られた単一のマップ上で実行されます。

1. **グループ固有のシステムプロンプト**（`groups["<groupId>"].systemPrompt`）: 特定のグループエントリがマップ内に存在し、**かつ** その `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、システムプロンプトは適用されません。
2. **グループワイルドカードシステムプロンプト**（`groups["*"].systemPrompt`）: 特定のグループエントリがマップにまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

ダイレクトメッセージの解決階層:

有効な `direct` マップが最初に決定されます。アカウントが独自の `direct` を定義している場合、それはルートの `direct` マップを完全に置き換えます（ディープマージなし）。その後、プロンプト検索は結果として得られた単一のマップ上で実行されます。

1. **ダイレクト固有のシステムプロンプト**（`direct["<peerId>"].systemPrompt`）: 特定のピアエントリがマップ内に存在し、**かつ** その `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、システムプロンプトは適用されません。
2. **ダイレクトワイルドカードシステムプロンプト**（`direct["*"].systemPrompt`）: 特定のピアエントリがマップにまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

<Note>
`dms` は軽量な DM ごとの履歴上書きバケット（`dms.<id>.historyLimit`）のままです。プロンプトの上書きは `direct` 配下にあります。
</Note>

**Telegram のマルチアカウント動作との違い:** Telegram では、マルチアカウント設定内のすべてのアカウントについて、ルートの `groups` が意図的に抑制されます。これは、自分自身の `groups` を定義していないアカウントも含みます。これにより、ボットが所属していないグループのグループメッセージを受信することを防ぎます。WhatsApp ではこのガードは適用されません。設定済みアカウント数に関係なく、アカウントレベルの上書きを定義していないアカウントは、常にルートの `groups` とルートの `direct` を継承します。マルチアカウントの WhatsApp 設定でアカウントごとのグループまたはダイレクトプロンプトが必要な場合は、ルートレベルのデフォルトに依存せず、各アカウントの下に完全なマップを明示的に定義してください。

重要な動作:

- `channels.whatsapp.groups` は、グループごとの設定マップであると同時に、チャットレベルのグループ許可リストでもあります。ルートスコープまたはアカウントスコープのいずれでも、`groups["*"]` はそのスコープで「すべてのグループが許可される」ことを意味します。
- ワイルドカードグループの `systemPrompt` は、そのスコープですべてのグループをすでに許可したい場合にのみ追加してください。対象を固定されたグループ ID のセットだけにしたい場合は、プロンプトのデフォルトに `groups["*"]` を使わないでください。代わりに、明示的に許可リストへ追加した各グループエントリでプロンプトを繰り返し指定してください。
- グループの許可と送信者の認可は別々のチェックです。`groups["*"]` はグループ処理に到達できるグループの集合を広げますが、それだけでそのグループ内のすべての送信者を認可するわけではありません。送信者アクセスは引き続き `channels.whatsapp.groupPolicy` と `channels.whatsapp.groupAllowFrom` によって個別に制御されます。
- `channels.whatsapp.direct` には、DM に対する同じ副作用はありません。`direct["*"]` は、`dmPolicy` に加えて `allowFrom` またはペアリングストアのルールによって DM がすでに許可された後に、デフォルトのダイレクトチャット設定を提供するだけです。

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
