---
read_when:
    - WhatsApp/Web チャネルの動作または受信トレイルーティングに取り組むこと
summary: WhatsApp チャネルのサポート、アクセス制御、配信動作、運用
title: WhatsApp
x-i18n:
    generated_at: "2026-04-26T11:24:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd4217adb673bc4c071fc1bff6994fb214966c2b28fe59253a1a6f4b4b7fcdba
    source_path: channels/whatsapp.md
    workflow: 15
---

ステータス: WhatsApp Web（Baileys）経由で本番運用対応済み。Gateway がリンクされたセッションを管理します。

## インストール（必要時）

- オンボーディング（`openclaw onboard`）および `openclaw channels add --channel whatsapp` では、
  初めて選択したときに WhatsApp Plugin のインストールを案内します。
- `openclaw channels login --channel whatsapp` でも、
  Plugin がまだ存在しない場合はインストールフローが提供されます。
- Dev チャネル + git checkout: デフォルトでローカルの Plugin パスを使用します。
- Stable/Beta: デフォルトで npm パッケージ `@openclaw/whatsapp` を使用します。

手動インストールも引き続き利用できます。

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    不明な送信者に対するデフォルトの DM ポリシーはペアリングです。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断と修復プレイブック。
  </Card>
  <Card title="Gateway 設定" icon="settings" href="/ja-JP/gateway/configuration">
    チャネル設定の完全なパターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="WhatsApp のアクセスポリシーを設定する">

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

    ペアリングリクエストは 1 時間後に期限切れになります。保留中リクエストはチャネルごとに最大 3 件です。

  </Step>
</Steps>

<Note>
可能であれば、OpenClaw では WhatsApp を別番号で運用することを推奨します。（チャネルメタデータとセットアップフローはその構成向けに最適化されていますが、個人番号でのセットアップにも対応しています。）
</Note>

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用番号（推奨）">
    これが最もクリーンな運用モードです。

    - OpenClaw 用に分離された WhatsApp アイデンティティ
    - より明確な DM allowlist とルーティング境界
    - self-chat の混乱が起きる可能性が低い

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

  <Accordion title="個人番号でのフォールバック">
    オンボーディングは個人番号モードをサポートし、self-chat しやすいベースラインを書き込みます。

    - `dmPolicy: "allowlist"`
    - `allowFrom` に個人番号を含める
    - `selfChatMode: true`

    ランタイムでは、self-chat 保護はリンクされた self 番号と `allowFrom` に基づいて動作します。

  </Accordion>

  <Accordion title="WhatsApp Web のみのチャネルスコープ">
    現在の OpenClaw チャネルアーキテクチャでは、メッセージングプラットフォームのチャネルは WhatsApp Web ベース（`Baileys`）です。

    組み込みのチャットチャネルレジストリには、Twilio WhatsApp の別個のメッセージングチャネルはありません。

  </Accordion>
</AccordionGroup>

## ランタイムモデル

- Gateway が WhatsApp ソケットと再接続ループを管理します。
- 送信には、対象アカウント用のアクティブな WhatsApp リスナーが必要です。
- ステータスチャットとブロードキャストチャットは無視されます（`@status`、`@broadcast`）。
- ダイレクトチャットでは DM セッションルールが使われます（`session.dmScope`。デフォルトの `main` は DM をエージェントのメインセッションに集約します）。
- グループセッションは分離されます（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Web トランスポートは、Gateway ホスト上の標準的なプロキシ環境変数（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` および小文字版）を尊重します。チャネル固有の WhatsApp プロキシ設定よりも、ホストレベルのプロキシ設定を推奨します。
- `messages.removeAckAfterReply` が有効な場合、OpenClaw は可視の返信が配信された後に WhatsApp の ack リアクションを消去します。

## Plugin フックとプライバシー

WhatsApp の受信メッセージには、個人的なメッセージ内容、電話番号、
グループ識別子、送信者名、セッション相関フィールドが含まれることがあります。
そのため、明示的にオプトインしない限り、
WhatsApp は受信 `message_received` フックのペイロードを Plugin にブロードキャストしません。

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

このオプトインは 1 つのアカウントに限定することもできます。

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

## アクセス制御と有効化

<Tabs>
  <Tab title="DM ポリシー">
    `channels.whatsapp.dmPolicy` はダイレクトチャットアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    `allowFrom` には E.164 形式の番号を指定できます（内部で正規化されます）。

    マルチアカウントのオーバーライド: `channels.whatsapp.accounts.<id>.dmPolicy`（および `allowFrom`）は、そのアカウントについてチャネルレベルのデフォルトより優先されます。

    ランタイム動作の詳細:

    - ペアリングはチャネルの allow-store に永続化され、設定済みの `allowFrom` とマージされます
    - allowlist が設定されていない場合、リンクされた self 番号がデフォルトで許可されます
    - OpenClaw は送信 `fromMe` DM（リンク済みデバイスから自分自身に送るメッセージ）を自動ペアリングしません

  </Tab>

  <Tab title="グループポリシー + allowlist">
    グループアクセスには 2 層あります。

    1. **グループメンバーシップ allowlist**（`channels.whatsapp.groups`）
       - `groups` が省略されている場合、すべてのグループが対象になります
       - `groups` が存在する場合、グループ allowlist として機能します（`"*"` 可）

    2. **グループ送信者ポリシー**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`: 送信者 allowlist をバイパス
       - `allowlist`: 送信者は `groupAllowFrom`（または `*`）に一致する必要があります
       - `disabled`: すべてのグループ受信をブロック

    送信者 allowlist のフォールバック:

    - `groupAllowFrom` が未設定の場合、ランタイムは利用可能であれば `allowFrom` にフォールバックします
    - 送信者 allowlist は mention/reply による有効化より前に評価されます

    注意: `channels.whatsapp` ブロックがまったく存在しない場合、`channels.defaults.groupPolicy` が設定されていても、ランタイムのグループポリシーのフォールバックは `allowlist` になります（警告ログあり）。

  </Tab>

  <Tab title="メンション + /activation">
    グループ返信はデフォルトでメンションが必要です。

    メンション検出には以下が含まれます。

    - bot アイデンティティに対する明示的な WhatsApp メンション
    - 設定済みの mention regex パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - 許可されたグループメッセージの受信音声ノート文字起こし
    - 暗黙の bot への返信検出（返信送信者が bot アイデンティティに一致）

    セキュリティに関する注意:

    - 引用/返信はメンションゲートを満たすだけであり、送信者認可は付与しません
    - `groupPolicy: "allowlist"` の場合、allowlist にない送信者は、allowlist にあるユーザーのメッセージに返信したとしてもブロックされます

    セッションレベルの有効化コマンド:

    - `/activation mention`
    - `/activation always`

    `activation` はセッション状態を更新します（グローバル config ではありません）。所有者ゲート付きです。

  </Tab>
</Tabs>

## 個人番号と self-chat の動作

リンクされた self 番号が `allowFrom` にも存在する場合、WhatsApp の self-chat 保護が有効になります。

- self-chat ターンでは既読通知をスキップする
- そうでなければ自分自身に ping してしまう mention-JID 自動トリガー動作を無視する
- `messages.responsePrefix` が未設定の場合、self-chat 返信のデフォルトは `[{identity.name}]` または `[openclaw]`

## メッセージ正規化とコンテキスト

<AccordionGroup>
  <Accordion title="受信エンベロープ + 返信コンテキスト">
    受信した WhatsApp メッセージは共有の受信エンベロープにラップされます。

    引用返信が存在する場合、コンテキストは次の形式で追加されます。

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    利用可能な場合は返信メタデータフィールドも設定されます（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、送信者 JID/E.164）。

  </Accordion>

  <Accordion title="メディアプレースホルダーと location/contact 抽出">
    メディアのみの受信メッセージは、次のようなプレースホルダーで正規化されます。

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    許可されたグループ音声ノートでは、本文が `<media:audio>` のみの場合、メンションゲートの前に文字起こしが行われるため、音声ノート内で bot へのメンションを話すことで返信をトリガーできます。文字起こし後も bot へのメンションがなければ、文字起こしは生のプレースホルダーではなく保留中のグループ履歴に保持されます。

    location 本文では簡潔な座標テキストが使われます。location のラベル/コメントおよび contact/vCard の詳細は、インラインのプロンプトテキストではなく、信頼されていないメタデータとしてフェンス付きでレンダリングされます。

  </Accordion>

  <Accordion title="保留中グループ履歴の注入">
    グループでは、未処理メッセージをバッファし、bot が最終的にトリガーされたときにコンテキストとして注入できます。

    - デフォルト上限: `50`
    - config: `channels.whatsapp.historyLimit`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効化

    注入マーカー:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="既読通知">
    既読通知は、受理された受信 WhatsApp メッセージに対してデフォルトで有効です。

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

    self-chat ターンでは、グローバルに有効でも既読通知をスキップします。

  </Accordion>
</AccordionGroup>

## 配信、分割、メディア

<AccordionGroup>
  <Accordion title="テキスト分割">
    - デフォルトの分割上限: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` モードでは段落境界（空行）を優先し、その後に長さ安全な分割へフォールバックします

  </Accordion>

  <Accordion title="送信メディア動作">
    - 画像、動画、音声（PTT 音声ノート）、document ペイロードをサポート
    - 音声メディアは Baileys の `audio` ペイロードで `ptt: true` として送信されるため、WhatsApp クライアントでは push-to-talk 音声ノートとして表示されます
    - 返信ペイロードは `audioAsVoice` を保持します。WhatsApp 向けの TTS 音声ノート出力は、provider が MP3 または WebM を返す場合でもこの PTT 経路のままです
    - ネイティブの Ogg/Opus 音声は、音声ノート互換性のため `audio/ogg; codecs=opus` として送信されます
    - Microsoft Edge TTS の MP3/WebM 出力を含む非 Ogg 音声は、PTT 配信前に `ffmpeg` で 48 kHz モノラルの Ogg/Opus にトランスコードされます
    - `/tts latest` は最新のアシスタント返信を 1 つの音声ノートとして送信し、同じ返信に対する重複送信を抑制します。`/tts chat on|off|default` は現在の WhatsApp チャットの自動 TTS を制御します
    - アニメーション GIF 再生は、動画送信時の `gifPlayback: true` でサポートされます
    - マルチメディア返信ペイロード送信時、caption は最初のメディア項目に適用されます。ただし、PTT 音声ノートでは、WhatsApp クライアントが音声ノートの caption を一貫して表示しないため、音声が先に送信され、可視テキストは別送されます
    - メディアソースには HTTP(S)、`file://`、またはローカルパスを使用できます

  </Accordion>

  <Accordion title="メディアサイズ上限とフォールバック動作">
    - 受信メディア保存上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - 送信メディア送信上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - アカウントごとのオーバーライドは `channels.whatsapp.accounts.<accountId>.mediaMaxMb` を使用します
    - 画像は上限内に収まるよう自動最適化されます（リサイズ/画質スイープ）
    - メディア送信に失敗した場合、先頭項目のフォールバックでレスポンスを黙って破棄するのではなく、警告テキストを送信します

  </Accordion>
</AccordionGroup>

## 返信引用

WhatsApp はネイティブの返信引用をサポートしており、送信返信で受信メッセージを視覚的に引用できます。これを `channels.whatsapp.replyToMode` で制御します。

| 値          | 動作                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | まったく引用せず、通常のメッセージとして送信                         |
| `"first"`   | 最初の送信返信チャンクのみを引用                                     |
| `"all"`     | すべての送信返信チャンクを引用                                       |
| `"batched"` | キューされたバッチ返信を引用し、即時返信は引用しない                 |

デフォルトは `"off"` です。アカウントごとのオーバーライドには `channels.whatsapp.accounts.<id>.replyToMode` を使います。

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

`channels.whatsapp.reactionLevel` は、エージェントが WhatsApp 上で絵文字リアクションをどの程度広く使うかを制御します。

| レベル        | Ack リアクション | エージェント起点のリアクション | 説明                                               |
| ------------- | ---------------- | ------------------------------ | -------------------------------------------------- |
| `"off"`       | いいえ           | いいえ                         | リアクションをまったく使わない                     |
| `"ack"`       | はい             | いいえ                         | Ack リアクションのみ（返信前の受領通知）           |
| `"minimal"`   | はい             | はい（控えめ）                 | Ack + 控えめなガイダンス付きのエージェントリアクション |
| `"extensive"` | はい             | はい（推奨）                   | Ack + 推奨ガイダンス付きのエージェントリアクション |

デフォルト: `"minimal"`。

アカウントごとのオーバーライドには `channels.whatsapp.accounts.<id>.reactionLevel` を使います。

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

WhatsApp は、`channels.whatsapp.ackReaction` によって受信直後の即時 Ack リアクションをサポートします。
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

動作に関する注記:

- 受信が受理された直後に送信されます（返信前）
- 失敗はログに記録されますが、通常の返信配信は妨げません
- グループモード `mentions` では、メンションでトリガーされたターンにリアクションします。グループ有効化 `always` はこのチェックをバイパスするものとして機能します
- WhatsApp では `channels.whatsapp.ackReaction` を使用します（レガシーの `messages.ackReaction` はここでは使われません）

## マルチアカウントと認証情報

<AccordionGroup>
  <Accordion title="アカウント選択とデフォルト">
    - アカウント ID は `channels.whatsapp.accounts` から取得されます
    - デフォルトアカウント選択: `default` が存在すればそれ、なければ最初に設定されたアカウント ID（ソート順）
    - アカウント ID は検索用に内部で正規化されます

  </Accordion>

  <Accordion title="認証情報パスとレガシー互換性">
    - 現在の認証パス: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - バックアップファイル: `creds.json.bak`
    - `~/.openclaw/credentials/` のレガシーデフォルト認証も、デフォルトアカウントフローでは引き続き認識/移行されます

  </Accordion>

  <Accordion title="ログアウト動作">
    `openclaw channels logout --channel whatsapp [--account <id>]` は、そのアカウントの WhatsApp 認証状態を消去します。

    レガシー認証ディレクトリでは、`oauth.json` は保持され、Baileys 認証ファイルは削除されます。

  </Accordion>
</AccordionGroup>

## ツール、アクション、config 書き込み

- エージェントツールは WhatsApp のリアクションアクション（`react`）をサポートします。
- アクションゲート:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- チャネル起点の config 書き込みはデフォルトで有効です（`channels.whatsapp.configWrites=false` で無効化）。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="未リンク（QR が必要）">
    症状: チャネルステータスで未リンクと表示される。

    修正:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="リンク済みだが切断 / 再接続ループしている">
    症状: リンク済みアカウントで切断または再接続試行が繰り返される。

    修正:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    必要に応じて、`channels login` で再リンクしてください。

  </Accordion>

  <Accordion title="送信時にアクティブなリスナーがない">
    対象アカウントに対してアクティブな Gateway リスナーが存在しない場合、送信は即座に失敗します。

    Gateway が実行中であり、アカウントがリンク済みであることを確認してください。

  </Accordion>

  <Accordion title="グループメッセージが予期せず無視される">
    次の順で確認してください。

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` allowlist エントリ
    - メンションゲート（`requireMention` + mention patterns）
    - `openclaw.json` 内の重複キー（JSON5）: 後のエントリが前のエントリを上書きするため、各スコープに `groupPolicy` は 1 つだけにしてください

  </Accordion>

  <Accordion title="Bun ランタイム警告">
    WhatsApp Gateway ランタイムでは Node を使用してください。Bun は安定した WhatsApp/Telegram Gateway 運用と互換性がないものとして扱われます。
  </Accordion>
</AccordionGroup>

## システムプロンプト

WhatsApp は、`groups` と `direct` マップを通じて、グループおよびダイレクトチャット向けの Telegram スタイルのシステムプロンプトをサポートします。

グループメッセージの解決階層:

まず有効な `groups` マップが決定されます。アカウントが独自の `groups` を定義している場合、それはルートの `groups` マップを完全に置き換えます（ディープマージなし）。その後、結果として得られた単一マップに対してプロンプト検索が実行されます。

1. **グループ固有のシステムプロンプト**（`groups["<groupId>"].systemPrompt`）: 特定のグループエントリがマップ内に存在し、かつその `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、システムプロンプトは適用されません。
2. **グループワイルドカードのシステムプロンプト**（`groups["*"].systemPrompt`）: 特定のグループエントリがマップにまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

ダイレクトメッセージの解決階層:

まず有効な `direct` マップが決定されます。アカウントが独自の `direct` を定義している場合、それはルートの `direct` マップを完全に置き換えます（ディープマージなし）。その後、結果として得られた単一マップに対してプロンプト検索が実行されます。

1. **ダイレクト固有のシステムプロンプト**（`direct["<peerId>"].systemPrompt`）: 特定の peer エントリがマップ内に存在し、かつその `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、システムプロンプトは適用されません。
2. **ダイレクトワイルドカードのシステムプロンプト**（`direct["*"].systemPrompt`）: 特定の peer エントリがマップにまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

注: `dms` は引き続き DM ごとの軽量な履歴オーバーライドバケット（`dms.<id>.historyLimit`）であり、プロンプトオーバーライドは `direct` 配下にあります。

**Telegram のマルチアカウント動作との違い:** Telegram では、マルチアカウント構成時に、ある bot が所属していないグループのメッセージを受け取らないようにするため、ルートの `groups` は、独自の `groups` を定義していないアカウントを含むすべてのアカウントで意図的に抑制されます。WhatsApp ではこのガードは適用されません。`groups` または `direct` のアカウントレベルのオーバーライドを定義していないアカウントは、設定されたアカウント数に関係なく、常にルートの `groups` とルートの `direct` を継承します。マルチアカウントの WhatsApp 構成でアカウントごとのグループまたはダイレクトプロンプトが必要な場合は、ルートレベルのデフォルトに依存せず、各アカウント配下に完全なマップを明示的に定義してください。

重要な動作:

- `channels.whatsapp.groups` は、グループごとの config マップであると同時に、チャットレベルのグループ allowlist でもあります。ルートまたはアカウントスコープのいずれでも、`groups["*"]` はそのスコープで「すべてのグループを受け入れる」ことを意味します。
- ワイルドカードグループ `systemPrompt` は、そのスコープですべてのグループを受け入れたい場合にのみ追加してください。引き続き固定されたグループ ID の集合だけを対象にしたい場合、プロンプトのデフォルトに `groups["*"]` を使わないでください。代わりに、明示的に allowlist 化された各グループエントリにプロンプトを繰り返し設定してください。
- グループ受け入れと送信者認可は別個のチェックです。`groups["*"]` はグループ処理に到達できるグループの集合を広げますが、それだけでそれらのグループ内のすべての送信者を認可するわけではありません。送信者アクセスは依然として `channels.whatsapp.groupPolicy` と `channels.whatsapp.groupAllowFrom` によって別途制御されます。
- `channels.whatsapp.direct` は DM に対して同じ副作用を持ちません。`direct["*"]` は、DM が `dmPolicy` と `allowFrom` または pairing-store ルールによってすでに受け入れられた後にのみ、デフォルトのダイレクトチャット config を提供します。

例:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // ルートスコープですべてのグループを受け入れるべき場合にのみ使用します。
        // 独自の groups マップを定義していないすべてのアカウントに適用されます。
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // 独自の direct マップを定義していないすべてのアカウントに適用されます。
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // このアカウントは独自の groups を定義しているため、ルート groups は完全に
            // 置き換えられます。ワイルドカードも維持したい場合は、ここでも "*" を明示的に定義してください。
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // このアカウントですべてのグループを受け入れるべき場合にのみ使用します。
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // このアカウントは独自の direct マップを定義しているため、ルート direct エントリは
            // 完全に置き換えられます。ワイルドカードも維持したい場合は、ここでも "*" を明示的に定義してください。
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## 設定リファレンスへのポインタ

主要なリファレンス:

- [設定リファレンス - WhatsApp](/ja-JP/gateway/config-channels#whatsapp)

重要な WhatsApp フィールド:

- アクセス: `dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`
- 配信: `textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`、`reactionLevel`
- マルチアカウント: `accounts.<id>.enabled`、`accounts.<id>.authDir`、アカウントレベルのオーバーライド
- 運用: `configWrites`、`debounceMs`、`web.enabled`、`web.heartbeatSeconds`、`web.reconnect.*`
- セッション動作: `session.dmScope`、`historyLimit`、`dmHistoryLimit`、`dms.<id>.historyLimit`
- プロンプト: `groups.<id>.systemPrompt`、`groups["*"].systemPrompt`、`direct.<id>.systemPrompt`、`direct["*"].systemPrompt`

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [セキュリティ](/ja-JP/gateway/security)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
