---
read_when:
    - WhatsApp/ウェブチャネルの挙動または受信トレイのルーティングに取り組む
summary: WhatsApp チャネルのサポート、アクセス制御、配信動作、運用
title: WhatsApp
x-i18n:
    generated_at: "2026-04-30T05:01:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d0268e068de0001a11a6ed87fe70df8e685d1dcc87c8142ee5b3c77d7a727f3
    source_path: channels/whatsapp.md
    workflow: 16
---

ステータス: WhatsApp Web (Baileys) 経由で本番対応済み。Gateway がリンク済みセッションを所有します。

## インストール（オンデマンド）

- オンボーディング（`openclaw onboard`）と `openclaw channels add --channel whatsapp` は、
  初めて WhatsApp Plugin を選択したときにインストールを促します。
- `openclaw channels login --channel whatsapp` も、Plugin がまだ存在しない場合は
  インストールフローを提示します。
- 開発チャンネル + git チェックアウト: デフォルトでローカル Plugin パスを使用します。
- Stable/Beta: 現行パッケージが公開されている場合は npm パッケージ `@openclaw/whatsapp`
  を使用します。

手動インストールも引き続き利用できます。

```bash
openclaw plugins install @openclaw/whatsapp
```

npm が OpenClaw 所有のパッケージを非推奨または欠落として報告する場合は、npm パッケージ列が
追いつくまで、現行のパッケージ済み OpenClaw ビルドまたはローカルチェックアウトを使用してください。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    既定の DM ポリシーは、不明な送信者に対してペアリングです。
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

  <Step title="最初のペアリング要求を承認する（ペアリングモードを使用している場合）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    ペアリング要求は 1 時間後に期限切れになります。保留中の要求はチャンネルごとに 3 件までです。

  </Step>
</Steps>

<Note>
OpenClaw は、可能な場合は WhatsApp を別の番号で実行することを推奨します。（チャンネルメタデータとセットアップフローはそのセットアップ向けに最適化されていますが、個人番号のセットアップもサポートされています。）
</Note>

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用番号（推奨）">
    これは最も明快な運用モードです。

    - OpenClaw 用の別個の WhatsApp ID
    - より明確な DM 許可リストとルーティング境界
    - 自分自身とのチャットによる混乱の可能性が低い

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
    オンボーディングは個人番号モードをサポートし、自分自身とのチャットに適したベースラインを書き込みます。

    - `dmPolicy: "allowlist"`
    - `allowFrom` に個人番号を含める
    - `selfChatMode: true`

    ランタイムでは、自分自身とのチャットの保護はリンク済みの自己番号と `allowFrom` を基準にします。

  </Accordion>

  <Accordion title="WhatsApp Web のみのチャンネルスコープ">
    メッセージングプラットフォームチャンネルは、現在の OpenClaw チャンネルアーキテクチャでは WhatsApp Web ベース（`Baileys`）です。

    組み込みチャットチャンネルレジストリには、別個の Twilio WhatsApp メッセージングチャンネルはありません。

  </Accordion>
</AccordionGroup>

## ランタイムモデル

- Gateway が WhatsApp ソケットと再接続ループを所有します。
- 再接続ウォッチドッグは、受信アプリメッセージ量だけでなく WhatsApp Web トランスポートアクティビティを使用するため、静かなリンク済みデバイスセッションは、最近誰もメッセージを送っていないという理由だけでは再起動されません。より長いアプリケーション無音上限により、トランスポートフレームが到着し続けてもウォッチドッグ期間中にアプリケーションメッセージが処理されない場合は、引き続き再接続が強制されます。最近アクティブだったセッションの一時的な再接続後は、そのアプリケーション無音チェックは最初の復旧期間で通常のメッセージタイムアウトを使用します。
- Baileys ソケットのタイミングは `web.whatsapp.*` の下で明示されます。`keepAliveIntervalMs` は WhatsApp Web アプリケーション ping を制御し、`connectTimeoutMs` は開始ハンドシェイクのタイムアウトを制御し、`defaultQueryTimeoutMs` は Baileys クエリタイムアウトを制御します。
- 送信には、対象アカウントのアクティブな WhatsApp リスナーが必要です。
- ステータスチャットとブロードキャストチャットは無視されます（`@status`、`@broadcast`）。
- 再接続ウォッチドッグは、受信アプリメッセージ量だけでなく WhatsApp Web トランスポートアクティビティに従います。静かなリンク済みデバイスセッションはトランスポートフレームが続く間は維持されますが、トランスポート停止は後続のリモート切断パスよりかなり前に再接続を強制します。
- ダイレクトチャットは DM セッションルールを使用します（`session.dmScope`; 既定の `main` は DM をエージェントのメインセッションにまとめます）。
- グループセッションは分離されます（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Web トランスポートは、Gateway ホスト上の標準プロキシ環境変数を尊重します（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` / 小文字バリアント）。チャンネル固有の WhatsApp プロキシ設定より、ホストレベルのプロキシ設定を優先してください。
- `messages.removeAckAfterReply` が有効な場合、OpenClaw は表示可能な返信が配信された後に WhatsApp の ack リアクションをクリアします。

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

受信 WhatsApp メッセージの内容と識別子を受け取ることを信頼できる plugins に対してのみ、
これを有効にしてください。

## アクセス制御とアクティベーション

<Tabs>
  <Tab title="DM ポリシー">
    `channels.whatsapp.dmPolicy` はダイレクトチャットアクセスを制御します。

    - `pairing`（既定）
    - `allowlist`
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    `allowFrom` は E.164 形式の番号を受け付けます（内部で正規化されます）。

    複数アカウントの上書き: `channels.whatsapp.accounts.<id>.dmPolicy`（および `allowFrom`）は、そのアカウントについてチャンネルレベルの既定値より優先されます。

    ランタイム動作の詳細:

    - ペアリングはチャンネル許可ストアに永続化され、設定済みの `allowFrom` とマージされます
    - 許可リストが設定されていない場合、リンク済みの自己番号が既定で許可されます
    - OpenClaw は送信 `fromMe` DM（リンク済みデバイスから自分自身に送信するメッセージ）を自動ペアリングしません

  </Tab>

  <Tab title="グループポリシー + 許可リスト">
    グループアクセスには 2 つのレイヤーがあります。

    1. **グループメンバーシップ許可リスト**（`channels.whatsapp.groups`）
       - `groups` が省略されている場合、すべてのグループが対象になります
       - `groups` が存在する場合、グループ許可リストとして機能します（`"*"` が許可されます）

    2. **グループ送信者ポリシー**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`: 送信者許可リストをバイパスします
       - `allowlist`: 送信者が `groupAllowFrom`（または `*`）に一致する必要があります
       - `disabled`: すべてのグループ受信をブロックします

    送信者許可リストのフォールバック:

    - `groupAllowFrom` が未設定の場合、利用可能であればランタイムは `allowFrom` にフォールバックします
    - 送信者許可リストはメンション/返信アクティベーションの前に評価されます

    注: `channels.whatsapp` ブロックがまったく存在しない場合、`channels.defaults.groupPolicy` が設定されていても、ランタイムのグループポリシーフォールバックは `allowlist`（警告ログ付き）になります。

  </Tab>

  <Tab title="メンション + /activation">
    グループ返信には既定でメンションが必要です。

    メンション検出には以下が含まれます。

    - ボット ID への明示的な WhatsApp メンション
    - 設定済みのメンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバック `messages.groupChat.mentionPatterns`）
    - 承認済みグループメッセージの受信ボイスメモ書き起こし
    - 暗黙的なボットへの返信検出（返信送信者がボット ID と一致）

    セキュリティ注記:

    - 引用/返信はメンションゲートのみを満たします。送信者承認を付与するものでは**ありません**
    - `groupPolicy: "allowlist"` では、許可リスト外の送信者は、許可リスト内ユーザーのメッセージに返信した場合でも引き続きブロックされます

    セッションレベルのアクティベーションコマンド:

    - `/activation mention`
    - `/activation always`

    `activation` はセッション状態を更新します（グローバル設定ではありません）。所有者ゲート付きです。

  </Tab>
</Tabs>

## 個人番号と自分自身とのチャットの動作

リンク済みの自己番号が `allowFrom` にも存在する場合、WhatsApp の自分自身とのチャット保護が有効になります。

- 自分自身とのチャットターンでは開封確認をスキップします
- 自分自身に ping してしまうメンション JID 自動トリガー動作を無視します
- `messages.responsePrefix` が未設定の場合、自分自身とのチャットの返信は既定で `[{identity.name}]` または `[openclaw]` になります

## メッセージ正規化とコンテキスト

<AccordionGroup>
  <Accordion title="受信エンベロープ + 返信コンテキスト">
    受信 WhatsApp メッセージは共有受信エンベロープにラップされます。

    引用返信が存在する場合、コンテキストは次の形式で追加されます。

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    利用可能な場合、返信メタデータフィールドも設定されます（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、送信者 JID/E.164）。

  </Accordion>

  <Accordion title="メディアプレースホルダーと位置情報/連絡先の抽出">
    メディアのみの受信メッセージは、次のようなプレースホルダーで正規化されます。

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    承認済みグループのボイスメモは、本文が `<media:audio>` のみの場合、
    メンションゲートの前に書き起こされるため、ボイスメモ内でボットメンションを発話すると
    返信をトリガーできます。書き起こしがそれでもボットにメンションしていない場合、
    書き起こしは生のプレースホルダーではなく保留中のグループ履歴に保持されます。

    位置情報本文は簡潔な座標テキストを使用します。位置情報ラベル/コメントと連絡先/vCard 詳細は、インラインプロンプトテキストではなく、フェンス付きの信頼されていないメタデータとしてレンダリングされます。

  </Accordion>

  <Accordion title="保留中グループ履歴の注入">
    グループでは、未処理メッセージをバッファし、ボットが最終的にトリガーされたときにコンテキストとして注入できます。

    - 既定の上限: `50`
    - 設定: `channels.whatsapp.historyLimit`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効化

    注入マーカー:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="開封確認">
    受け入れられた受信 WhatsApp メッセージでは、開封確認が既定で有効です。

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

    自分自身とのチャットターンでは、グローバルに有効な場合でも開封確認をスキップします。

  </Accordion>
</AccordionGroup>

## 配信、チャンク化、メディア

<AccordionGroup>
  <Accordion title="テキストチャンク化">
    - 既定のチャンク上限: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` モードは段落境界（空行）を優先し、その後、長さ安全なチャンク化にフォールバックします

  </Accordion>

  <Accordion title="送信メディアの動作">
    - 画像、動画、音声（PTT ボイスメモ）、ドキュメントのペイロードをサポートします
    - 音声メディアは `ptt: true` を付けた Baileys の `audio` ペイロード経由で送信されるため、WhatsApp クライアントではプッシュツートークのボイスメモとして表示されます
    - 返信ペイロードは `audioAsVoice` を保持します。WhatsApp 向けの TTS ボイスメモ出力は、プロバイダーが MP3 または WebM を返す場合でも、この PTT パスに留まります
    - ネイティブの Ogg/Opus 音声は、ボイスメモ互換性のため `audio/ogg; codecs=opus` として送信されます
    - Microsoft Edge TTS の MP3/WebM 出力を含む非 Ogg 音声は、PTT 配信前に `ffmpeg` で 48 kHz モノラル Ogg/Opus にトランスコードされます
    - `/tts latest` は最新のアシスタント返信を 1 つのボイスメモとして送信し、同じ返信の重複送信を抑制します。`/tts chat on|off|default` は現在の WhatsApp チャットの自動 TTS を制御します
    - アニメーション GIF の再生は、動画送信時の `gifPlayback: true` によってサポートされます
    - 複数メディアの返信ペイロードを送信する場合、キャプションは最初のメディア項目に適用されます。ただし、PTT ボイスメモでは、WhatsApp クライアントがボイスメモのキャプションを一貫して表示しないため、音声を先に送信し、表示テキストは別に送信します
    - メディアソースには HTTP(S)、`file://`、またはローカルパスを使用できます

  </Accordion>

  <Accordion title="メディアサイズ制限とフォールバック動作">
    - 受信メディアの保存上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - 送信メディアの送信上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - アカウントごとの上書きには `channels.whatsapp.accounts.<accountId>.mediaMaxMb` を使用します
    - 画像は制限内に収まるよう自動最適化（リサイズ/品質の探索）されます
    - メディア送信に失敗した場合、最初の項目のフォールバックとして、レスポンスを黙って破棄する代わりに警告テキストを送信します

  </Accordion>
</AccordionGroup>

## 返信の引用

WhatsApp はネイティブの返信引用をサポートしており、送信返信で受信メッセージを視覚的に引用できます。`channels.whatsapp.replyToMode` で制御します。

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

`channels.whatsapp.reactionLevel` は、エージェントが WhatsApp で絵文字リアクションをどの範囲で使用するかを制御します。

| レベル        | Ack リアクション | エージェント起点のリアクション | 説明                                             |
| ------------- | ---------------- | ------------------------------ | ------------------------------------------------ |
| `"off"`       | いいえ           | いいえ                         | リアクションは一切ありません                     |
| `"ack"`       | はい             | いいえ                         | Ack リアクションのみ（返信前の受領）             |
| `"minimal"`   | はい             | はい（控えめ）                 | Ack + 控えめなガイダンスによるエージェントリアクション |
| `"extensive"` | はい             | はい（推奨）                   | Ack + 推奨ガイダンスによるエージェントリアクション |

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

WhatsApp は `channels.whatsapp.ackReaction` を通じて、受信時の即時 ack リアクションをサポートします。
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

- 受信が受理された直後（返信前）に送信されます
- 失敗はログに記録されますが、通常の返信配信はブロックしません
- グループモード `mentions` は、メンションによってトリガーされたターンでリアクションします。グループアクティベーション `always` は、このチェックのバイパスとして機能します
- WhatsApp は `channels.whatsapp.ackReaction` を使用します（レガシーの `messages.ackReaction` はここでは使用されません）

## 複数アカウントと認証情報

<AccordionGroup>
  <Accordion title="アカウント選択とデフォルト">
    - アカウント ID は `channels.whatsapp.accounts` から取得されます
    - デフォルトのアカウント選択: `default` が存在する場合はそれを使用し、存在しない場合は設定済みアカウント ID の最初のもの（ソート済み）を使用します
    - アカウント ID は検索用に内部で正規化されます

  </Accordion>

  <Accordion title="認証情報パスとレガシー互換性">
    - 現在の認証パス: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - バックアップファイル: `creds.json.bak`
    - `~/.openclaw/credentials/` 内のレガシーのデフォルト認証は、デフォルトアカウントのフローで引き続き認識/移行されます

  </Accordion>

  <Accordion title="ログアウト動作">
    `openclaw channels logout --channel whatsapp [--account <id>]` は、そのアカウントの WhatsApp 認証状態を消去します。

    レガシー認証ディレクトリでは、Baileys 認証ファイルは削除されますが、`oauth.json` は保持されます。

  </Accordion>
</AccordionGroup>

## ツール、アクション、設定書き込み

- エージェントのツールサポートには WhatsApp リアクションアクション（`react`）が含まれます。
- アクションゲート:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- チャンネル起点の設定書き込みはデフォルトで有効です（`channels.whatsapp.configWrites=false` で無効化）。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="リンクされていない（QR が必要）">
    症状: チャンネルステータスがリンクされていないと報告します。

    修正:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="リンク済みだが切断される / 再接続ループ">
    症状: リンク済みアカウントで切断または再接続試行が繰り返されます。

    静かなアカウントは通常のメッセージタイムアウトを超えて接続を維持できます。ウォッチドッグは、WhatsApp Web トランスポートのアクティビティが停止したとき、ソケットが閉じたとき、またはアプリケーションレベルのアクティビティがより長い安全ウィンドウを超えて無音のままになったときに再起動します。

    ログに `status=408 Request Time-out Connection was lost` が繰り返し表示される場合は、`web.whatsapp` の下にある Baileys ソケットのタイミングを調整してください。まず、`keepAliveIntervalMs` をネットワークのアイドルタイムアウトより短くし、低速または損失の多いリンクでは `connectTimeoutMs` を増やします。

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

    必要に応じて、`channels login` で再リンクします。

  </Accordion>

  <Accordion title="プロキシ背後で QR ログインがタイムアウトする">
    症状: `openclaw channels login --channel whatsapp` が、使用可能な QR コードを表示する前に `status=408 Request Time-out` または TLS ソケット切断で失敗します。

    WhatsApp Web ログインは、Gateway ホストの標準プロキシ環境（`HTTPS_PROXY`、`HTTP_PROXY`、小文字のバリアント、`NO_PROXY`）を使用します。Gateway プロセスがプロキシ環境変数を継承していること、および `NO_PROXY` が `mmg.whatsapp.net` に一致していないことを確認してください。

  </Accordion>

  <Accordion title="送信時にアクティブなリスナーがない">
    対象アカウントにアクティブな Gateway リスナーが存在しない場合、送信は即座に失敗します。

    Gateway が実行中で、アカウントがリンクされていることを確認してください。

  </Accordion>

  <Accordion title="返信がトランスクリプトには表示されるが WhatsApp には表示されない">
    トランスクリプト行は、エージェントが生成した内容を記録します。WhatsApp 配信は別途確認されます。OpenClaw は、少なくとも 1 つの表示テキストまたはメディア送信について Baileys が送信メッセージ ID を返した後にのみ、自動返信を送信済みとして扱います。

    Ack リアクションは独立した返信前の受領です。リアクションが成功しても、その後のテキストまたはメディア返信が WhatsApp に受理されたことの証明にはなりません。

    Gateway ログで `auto-reply delivery failed` または `auto-reply was not accepted by WhatsApp provider` を確認してください。

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
    WhatsApp Gateway ランタイムには Node を使用する必要があります。Bun は、安定した WhatsApp/Telegram Gateway 運用には非互換として警告されます。
  </Accordion>
</AccordionGroup>

## システムプロンプト

WhatsApp は、`groups` と `direct` マップを通じて、グループおよびダイレクトチャット向けの Telegram 形式のシステムプロンプトをサポートします。

グループメッセージの解決階層:

有効な `groups` マップが最初に決定されます。アカウントが独自の `groups` を定義している場合、それはルートの `groups` マップを完全に置き換えます（ディープマージなし）。その後、プロンプト検索は結果として得られた単一のマップ上で実行されます。

1. **グループ固有のシステムプロンプト**（`groups["<groupId>"].systemPrompt`）: 特定のグループエントリがマップ内に存在し、**かつ** その `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、システムプロンプトは適用されません。
2. **グループワイルドカードシステムプロンプト**（`groups["*"].systemPrompt`）: 特定のグループエントリがマップ内にまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

ダイレクトメッセージの解決階層:

有効な `direct` マップが最初に決定されます。アカウントが独自の `direct` を定義している場合、それはルートの `direct` マップを完全に置き換えます（ディープマージなし）。その後、プロンプト検索は結果として得られた単一のマップ上で実行されます。

1. **ダイレクト固有のシステムプロンプト**（`direct["<peerId>"].systemPrompt`）: 特定のピアエントリがマップ内に存在し、**かつ** その `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、システムプロンプトは適用されません。
2. **ダイレクトワイルドカードシステムプロンプト**（`direct["*"].systemPrompt`）: 特定のピアエントリがマップ内にまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

<Note>
`dms` は、DM ごとの軽量な履歴上書きバケット（`dms.<id>.historyLimit`）として残ります。プロンプトの上書きは `direct` の下に置きます。
</Note>

**Telegram の複数アカウント動作との違い:** Telegram では、複数アカウント構成のすべてのアカウントに対して、ルートの `groups` が意図的に抑制されます。これは、独自の `groups` を定義していないアカウントであっても同様で、ボットが所属していないグループのグループメッセージを受信することを防ぐためです。WhatsApp はこのガードを適用しません。設定されているアカウント数に関係なく、アカウントレベルの上書きを定義していないアカウントは、常にルートの `groups` とルートの `direct` を継承します。複数アカウントの WhatsApp 構成で、アカウントごとのグループまたはダイレクトプロンプトが必要な場合は、ルートレベルのデフォルトに依存するのではなく、各アカウントの下に完全なマップを明示的に定義してください。

重要な動作:

- `channels.whatsapp.groups` は、グループごとの設定マップであると同時に、チャットレベルのグループ許可リストでもあります。ルートまたはアカウントのどちらのスコープでも、`groups["*"]` はそのスコープで「すべてのグループが受け入れられる」ことを意味します。
- ワイルドカードグループの `systemPrompt` は、そのスコープですべてのグループを受け入れたい場合にのみ追加してください。固定されたグループ ID セットだけを対象にしたい場合は、プロンプトのデフォルトに `groups["*"]` を使用しないでください。代わりに、明示的に許可リスト化した各グループエントリでプロンプトを繰り返してください。
- グループの受け入れと送信者の認可は別々のチェックです。`groups["*"]` はグループ処理に到達できるグループの集合を広げますが、それだけですべての送信者がそれらのグループで認可されるわけではありません。送信者アクセスは、引き続き `channels.whatsapp.groupPolicy` と `channels.whatsapp.groupAllowFrom` によって別途制御されます。
- `channels.whatsapp.direct` には、DM に対する同じ副作用はありません。`direct["*"]` は、DM が `dmPolicy` と `allowFrom`、またはペアリングストアのルールによってすでに受け入れられた後に、デフォルトのダイレクトチャット設定を提供するだけです。

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
- 複数アカウント: `accounts.<id>.enabled`, `accounts.<id>.authDir`, アカウントレベルのオーバーライド
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
