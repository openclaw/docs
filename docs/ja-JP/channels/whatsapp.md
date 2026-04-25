---
read_when:
    - WhatsApp/webチャネルの動作または受信トレイルーティングに取り組んでいる場合
summary: WhatsAppチャネルのサポート、アクセス制御、配信動作、および運用
title: WhatsApp
x-i18n:
    generated_at: "2026-04-25T18:16:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0935e7ac3676c57d83173a6dd9eedc489f77b278dfbc47bd811045078ee7e4d0
    source_path: channels/whatsapp.md
    workflow: 15
---

ステータス: WhatsApp Web（Baileys）経由で本番運用可能。Gateway がリンク済みセッションを管理します。

## インストール（必要時）

- オンボーディング（`openclaw onboard`）および `openclaw channels add --channel whatsapp` では、初回選択時に WhatsApp Plugin のインストールを促します。
- `openclaw channels login --channel whatsapp` でも、Plugin がまだ存在しない場合はインストールフローが提示されます。
- Dev channel + git checkout: デフォルトでローカルの Plugin パスが使用されます。
- Stable/Beta: デフォルトで npm パッケージ `@openclaw/whatsapp` が使用されます。

手動インストールも引き続き利用できます:

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
    完全なチャネル設定パターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="WhatsApp アクセスポリシーを設定">

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

    ログイン前に既存またはカスタムの WhatsApp Web 認証ディレクトリをアタッチするには:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Gateway を起動">

```bash
openclaw gateway
```

  </Step>

  <Step title="最初のペアリング要求を承認（pairing モードを使用している場合）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    ペアリング要求は 1 時間で期限切れになります。保留中の要求はチャネルごとに 3 件までです。

  </Step>
</Steps>

<Note>
OpenClaw は、可能であれば WhatsApp を別の電話番号で運用することを推奨します。（チャネルメタデータとセットアップフローはその構成向けに最適化されていますが、個人番号での構成もサポートされています。）
</Note>

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用番号（推奨）">
    これは最もクリーンな運用モードです:

    - OpenClaw 専用の WhatsApp ID
    - より明確な DM 許可リストとルーティング境界
    - セルフチャットの混乱が起きる可能性が低い

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

  <Accordion title="個人番号のフォールバック">
    オンボーディングは個人番号モードをサポートし、セルフチャットに適したベースラインを書き込みます:

    - `dmPolicy: "allowlist"`
    - `allowFrom` に個人の電話番号が含まれる
    - `selfChatMode: true`

    実行時には、セルフチャット保護はリンク済みの自分の番号と `allowFrom` に基づいて動作します。

  </Accordion>

  <Accordion title="WhatsApp Web 専用のチャネルスコープ">
    現在の OpenClaw チャネルアーキテクチャでは、メッセージングプラットフォームのチャネルは WhatsApp Web ベース（`Baileys`）です。

    組み込みのチャットチャネルレジストリには、Twilio の WhatsApp メッセージング用の別チャネルはありません。

  </Accordion>
</AccordionGroup>

## 実行時モデル

- Gateway が WhatsApp ソケットと再接続ループを管理します。
- 送信メッセージには、対象アカウントに対するアクティブな WhatsApp リスナーが必要です。
- ステータスおよびブロードキャストチャットは無視されます（`@status`、`@broadcast`）。
- ダイレクトチャットは DM セッションルール（`session.dmScope`）を使用します。デフォルトの `main` は DM をエージェントのメインセッションに集約します。
- グループセッションは分離されます（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Web トランスポートは、Gateway ホスト上の標準的なプロキシ環境変数（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` / 小文字の各種変数）を尊重します。チャネル固有の WhatsApp プロキシ設定よりも、ホストレベルのプロキシ設定を推奨します。

## Plugin フックとプライバシー

WhatsApp の受信メッセージには、個人的なメッセージ内容、電話番号、
グループ識別子、送信者名、セッション相関フィールドが含まれる場合があります。そのため、
明示的にオプトインしない限り、WhatsApp は受信した `message_received` フックのペイロードを Plugin にブロードキャストしません:

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

このオプトインは 1 つのアカウントに限定することもできます:

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

受信した WhatsApp メッセージの内容や識別子を受け取ることを信頼できる Plugin に対してのみ、これを有効にしてください。

## アクセス制御とアクティベーション

<Tabs>
  <Tab title="DM ポリシー">
    `channels.whatsapp.dmPolicy` はダイレクトチャットへのアクセスを制御します:

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    `allowFrom` は E.164 形式の電話番号を受け付けます（内部で正規化されます）。

    複数アカウントでの上書き: そのアカウントでは `channels.whatsapp.accounts.<id>.dmPolicy`（および `allowFrom`）がチャネルレベルのデフォルトより優先されます。

    実行時動作の詳細:

    - ペアリングはチャネルの allow-store に永続化され、設定済みの `allowFrom` とマージされます
    - 許可リストが設定されていない場合、リンク済みの自分の番号はデフォルトで許可されます
    - OpenClaw は送信済みの `fromMe` DM（リンク済みデバイスから自分自身に送信したメッセージ）を自動でペアリングすることはありません

  </Tab>

  <Tab title="グループポリシー + 許可リスト">
    グループアクセスには 2 つのレイヤーがあります:

    1. **グループメンバーシップ許可リスト**（`channels.whatsapp.groups`）
       - `groups` を省略した場合、すべてのグループが対象になります
       - `groups` が存在する場合、グループ許可リストとして機能します（`"*"` も可）

    2. **グループ送信者ポリシー**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`: 送信者許可リストをバイパスします
       - `allowlist`: 送信者は `groupAllowFrom`（または `*`）に一致する必要があります
       - `disabled`: すべてのグループ受信をブロックします

    送信者許可リストのフォールバック:

    - `groupAllowFrom` が未設定の場合、利用可能であれば実行時に `allowFrom` にフォールバックします
    - 送信者許可リストは、メンション/返信によるアクティベーションより前に評価されます

    注: `channels.whatsapp` ブロック自体がまったく存在しない場合、`channels.defaults.groupPolicy` が設定されていても、実行時のグループポリシーのフォールバックは `allowlist` になります（警告ログあり）。

  </Tab>

  <Tab title="メンション + /activation">
    グループ返信では、デフォルトでメンションが必要です。

    メンション検出には以下が含まれます:

    - ボット ID に対する明示的な WhatsApp メンション
    - 設定されたメンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - 暗黙のボット宛て返信検出（返信先送信者がボット ID と一致）

    セキュリティ上の注意:

    - 引用/返信はメンションゲーティングを満たすだけであり、送信者の認可を与えるものではありません
    - `groupPolicy: "allowlist"` の場合、許可リストにない送信者は、許可リストにあるユーザーのメッセージに返信しても引き続きブロックされます

    セッションレベルのアクティベーションコマンド:

    - `/activation mention`
    - `/activation always`

    `activation` はセッション状態を更新します（グローバル設定ではありません）。オーナー限定です。

  </Tab>
</Tabs>

## 個人番号とセルフチャットの動作

リンク済みの自分の番号が `allowFrom` にも含まれている場合、WhatsApp のセルフチャット保護が有効になります:

- セルフチャットのターンでは既読通知を送信しない
- 通常なら自分自身に ping してしまうメンション JID の自動トリガー動作を無視する
- `messages.responsePrefix` が未設定の場合、セルフチャット返信のデフォルトは `[{identity.name}]` または `[openclaw]`

## メッセージ正規化とコンテキスト

<AccordionGroup>
  <Accordion title="受信エンベロープ + 返信コンテキスト">
    受信した WhatsApp メッセージは、共有の受信エンベロープでラップされます。

    引用返信が存在する場合、コンテキストは次の形式で追記されます:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    利用可能な場合は返信メタデータフィールドも設定されます（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、送信者 JID/E.164）。

  </Accordion>

  <Accordion title="メディアプレースホルダーと位置情報/連絡先の抽出">
    メディアのみの受信メッセージは、次のようなプレースホルダーで正規化されます:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    位置情報の本文は簡潔な座標テキストになります。位置ラベル/コメントや連絡先/vCard の詳細は、インラインのプロンプトテキストではなく、フェンス付きの信頼されていないメタデータとしてレンダリングされます。

  </Accordion>

  <Accordion title="保留中のグループ履歴インジェクション">
    グループでは、未処理メッセージをバッファし、ボットが最終的にトリガーされた際にコンテキストとして注入できます。

    - デフォルト上限: `50`
    - 設定: `channels.whatsapp.historyLimit`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効化

    注入マーカー:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="既読通知">
    既読通知は、受け入れられた受信 WhatsApp メッセージに対してデフォルトで有効です。

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

    アカウント単位で上書きするには:

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

    セルフチャットのターンでは、グローバルに有効でも既読通知は送信されません。

  </Accordion>
</AccordionGroup>

## 配信、チャンク分割、およびメディア

<AccordionGroup>
  <Accordion title="テキストのチャンク分割">
    - デフォルトのチャンク上限: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` モードは段落境界（空行）を優先し、その後で長さ安全なチャンク分割にフォールバックします
  </Accordion>

  <Accordion title="送信メディアの動作">
    - 画像、動画、音声（PTT ボイスノート）、ドキュメントのペイロードをサポートします
    - 返信ペイロードは `audioAsVoice` を維持し、WhatsApp は音声メディアを Baileys の PTT ボイスノートとして送信します
    - Microsoft Edge TTS の MP3/WebM 出力を含む非 Ogg 音声は、PTT 配信前に Ogg/Opus へトランスコードされます
    - ネイティブの Ogg/Opus 音声は、ボイスノート互換性のため `audio/ogg; codecs=opus` として送信されます
    - アニメーション GIF 再生は、動画送信時の `gifPlayback: true` でサポートされます
    - 複数メディアの返信ペイロードを送信する場合、キャプションは最初のメディア項目に適用されます。ただし、PTT ボイスノートは音声が先に送信され、表示テキストは別送されます。これは WhatsApp クライアントがボイスノートのキャプションを一貫して表示しないためです
    - メディアソースには HTTP(S)、`file://`、またはローカルパスを使用できます
  </Accordion>

  <Accordion title="メディアサイズ上限とフォールバック動作">
    - 受信メディア保存上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - 送信メディア送信上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - アカウント単位の上書きは `channels.whatsapp.accounts.<accountId>.mediaMaxMb` を使用します
    - 画像は上限に収まるよう自動最適化されます（リサイズ/品質スイープ）
    - メディア送信に失敗した場合、先頭項目のフォールバックとして、レスポンスを黙って破棄せず警告テキストを送信します
  </Accordion>
</AccordionGroup>

## 返信の引用

WhatsApp は、送信返信で受信メッセージを視覚的に引用するネイティブな返信引用をサポートします。これを `channels.whatsapp.replyToMode` で制御します。

| 値          | 動作                                                                    |
| ----------- | ----------------------------------------------------------------------- |
| `"off"`     | 引用しない。プレーンメッセージとして送信する                            |
| `"first"`   | 最初の送信返信チャンクのみを引用する                                    |
| `"all"`     | すべての送信返信チャンクを引用する                                      |
| `"batched"` | キューされたバッチ返信を引用し、即時返信は引用しないままにする          |

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

`channels.whatsapp.reactionLevel` は、エージェントが WhatsApp 上で絵文字リアクションをどの程度広く使うかを制御します:

| レベル        | Ack リアクション | エージェント主導のリアクション | 説明                                             |
| ------------- | ---------------- | ------------------------------ | ------------------------------------------------ |
| `"off"`       | いいえ           | いいえ                         | リアクションをまったく使わない                   |
| `"ack"`       | はい             | いいえ                         | Ack リアクションのみ（返信前の受領確認）         |
| `"minimal"`   | はい             | はい（保守的）                 | Ack + 保守的ガイダンスによるエージェントリアクション |
| `"extensive"` | はい             | はい（推奨）                   | Ack + 推奨ガイダンスによるエージェントリアクション   |

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

## 確認リアクション

WhatsApp は、`channels.whatsapp.ackReaction` によって受信時の即時 Ack リアクションをサポートします。
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
- グループモード `mentions` は、メンショントリガーのターンでリアクションします。グループアクティベーション `always` はこのチェックをバイパスするものとして機能します
- WhatsApp は `channels.whatsapp.ackReaction` を使用します（旧来の `messages.ackReaction` はここでは使用されません）

## 複数アカウントと認証情報

<AccordionGroup>
  <Accordion title="アカウント選択とデフォルト">
    - アカウント ID は `channels.whatsapp.accounts` から取得されます
    - デフォルトのアカウント選択: `default` が存在する場合はそれ、存在しない場合は最初に設定されたアカウント ID（ソート順）
    - アカウント ID は参照のために内部で正規化されます
  </Accordion>

  <Accordion title="認証情報パスとレガシー互換性">
    - 現在の認証パス: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - バックアップファイル: `creds.json.bak`
    - `~/.openclaw/credentials/` 内の従来のデフォルト認証も、デフォルトアカウントフロー向けに引き続き認識/移行されます
  </Accordion>

  <Accordion title="ログアウト動作">
    `openclaw channels logout --channel whatsapp [--account <id>]` は、そのアカウントの WhatsApp 認証状態をクリアします。

    レガシー認証ディレクトリでは、Baileys の認証ファイルは削除されますが、`oauth.json` は保持されます。

  </Accordion>
</AccordionGroup>

## ツール、アクション、および設定書き込み

- エージェントツールのサポートには、WhatsApp のリアクションアクション（`react`）が含まれます。
- アクションゲート:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- チャネル起点の設定書き込みはデフォルトで有効です（`channels.whatsapp.configWrites=false` で無効化）。

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

  <Accordion title="リンク済みだが切断される / 再接続ループ">
    症状: リンク済みアカウントで切断や再接続試行が繰り返される。

    修正:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    必要に応じて、`channels login` で再リンクしてください。

  </Accordion>

  <Accordion title="送信時にアクティブなリスナーがない">
    対象アカウントにアクティブな Gateway リスナーが存在しない場合、送信は即座に失敗します。

    Gateway が実行中であり、そのアカウントがリンク済みであることを確認してください。

  </Accordion>

  <Accordion title="グループメッセージが予期せず無視される">
    次の順に確認してください:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 許可リストのエントリ
    - メンションゲーティング（`requireMention` + メンションパターン）
    - `openclaw.json`（JSON5）内の重複キー: 後ろのエントリが前のものを上書きするため、各スコープでは `groupPolicy` を 1 つだけにしてください

  </Accordion>

  <Accordion title="Bun ランタイム警告">
    WhatsApp の Gateway ランタイムでは Node を使用する必要があります。Bun は、安定した WhatsApp/Telegram Gateway 運用には非互換として扱われます。
  </Accordion>
</AccordionGroup>

## システムプロンプト

WhatsApp は、`groups` および `direct` マップを通じて、グループチャットとダイレクトチャット向けの Telegram スタイルのシステムプロンプトをサポートします。

グループメッセージの解決階層:

有効な `groups` マップが最初に決定されます。アカウントが独自の `groups` を定義している場合、それはルートの `groups` マップを完全に置き換えます（深いマージは行いません）。その後、生成された単一のマップに対してプロンプト検索が実行されます:

1. **グループ固有のシステムプロンプト**（`groups["<groupId>"].systemPrompt`）: 特定のグループエントリがマップ内に存在し、かつその `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、システムプロンプトは適用されません。
2. **グループワイルドカードのシステムプロンプト**（`groups["*"].systemPrompt`）: 特定のグループエントリがマップにまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

ダイレクトメッセージの解決階層:

有効な `direct` マップが最初に決定されます。アカウントが独自の `direct` を定義している場合、それはルートの `direct` マップを完全に置き換えます（深いマージは行いません）。その後、生成された単一のマップに対してプロンプト検索が実行されます:

1. **ダイレクト固有のシステムプロンプト**（`direct["<peerId>"].systemPrompt`）: 特定の相手エントリがマップ内に存在し、かつその `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、システムプロンプトは適用されません。
2. **ダイレクトワイルドカードのシステムプロンプト**（`direct["*"].systemPrompt`）: 特定の相手エントリがマップにまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

注: `dms` は軽量な DM ごとの履歴上書きバケット（`dms.<id>.historyLimit`）のままです。プロンプトの上書きは `direct` の下に置かれます。

**Telegram の複数アカウント動作との違い:** Telegram では、複数アカウント構成時に、どのアカウントにも独自の `groups` が定義されていなくても、ルートの `groups` はすべてのアカウントで意図的に抑制されます。これは、ボットが所属していないグループのメッセージを受け取らないようにするためです。WhatsApp ではこのガードは適用されません。アカウントレベルの上書きを定義していないアカウントは、設定アカウント数に関係なく、常にルートの `groups` とルートの `direct` を継承します。複数アカウントの WhatsApp 構成でアカウントごとのグループまたはダイレクト用プロンプトが必要な場合は、ルートレベルのデフォルトに依存せず、各アカウント配下に完全なマップを明示的に定義してください。

重要な動作:

- `channels.whatsapp.groups` は、グループごとの設定マップであると同時に、チャットレベルのグループ許可リストでもあります。ルートまたはアカウントスコープのいずれでも、`groups["*"]` はそのスコープで「すべてのグループを許可する」ことを意味します。
- ワイルドカードのグループ `systemPrompt` は、そのスコープですでにすべてのグループを許可したい場合にのみ追加してください。引き続き固定されたグループ ID のみを対象にしたい場合は、プロンプトのデフォルトとして `groups["*"]` を使用しないでください。代わりに、明示的に許可リストに入れた各グループエントリで同じプロンプトを繰り返してください。
- グループの許可と送信者の認可は別々のチェックです。`groups["*"]` はグループ処理に到達できるグループの集合を広げますが、それ自体でそれらのグループ内のすべての送信者を認可するわけではありません。送信者アクセスは引き続き `channels.whatsapp.groupPolicy` と `channels.whatsapp.groupAllowFrom` によって別途制御されます。
- `channels.whatsapp.direct` には DM に対して同じ副作用はありません。`direct["*"]` は、DM が `dmPolicy` と `allowFrom` または pairing-store ルールによってすでに受理された後に、デフォルトのダイレクトチャット設定を提供するだけです。

例:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // ルートスコープですべてのグループを許可する場合にのみ使用します。
        // 独自の groups マップを定義していないすべてのアカウントに適用されます。
        "*": { systemPrompt: "すべてのグループ向けのデフォルトプロンプト。" },
      },
      direct: {
        // 独自の direct マップを定義していないすべてのアカウントに適用されます。
        "*": { systemPrompt: "すべてのダイレクトチャット向けのデフォルトプロンプト。" },
      },
      accounts: {
        work: {
          groups: {
            // このアカウントは独自の groups を定義しているため、ルートの groups は完全に
            // 置き換えられます。ワイルドカードも維持したい場合は、ここでも明示的に "*" を定義してください。
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "プロジェクト管理に集中してください。",
            },
            // このアカウントですべてのグループを許可する場合にのみ使用します。
            "*": { systemPrompt: "work グループ向けのデフォルトプロンプト。" },
          },
          direct: {
            // このアカウントは独自の direct マップを定義しているため、ルートの direct エントリは
            // 完全に置き換えられます。ワイルドカードも維持したい場合は、ここでも明示的に "*" を定義してください。
            "+15551234567": { systemPrompt: "特定の work ダイレクトチャット向けのプロンプト。" },
            "*": { systemPrompt: "work ダイレクトチャット向けのデフォルトプロンプト。" },
          },
        },
      },
    },
  },
}
```

## 設定リファレンスへの案内

主要リファレンス:

- [設定リファレンス - WhatsApp](/ja-JP/gateway/config-channels#whatsapp)

重要度の高い WhatsApp フィールド:

- アクセス: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- 配信: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- 複数アカウント: `accounts.<id>.enabled`, `accounts.<id>.authDir`, アカウントレベルの上書き
- 運用: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- セッション動作: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- プロンプト: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [セキュリティ](/ja-JP/gateway/security)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [複数エージェントルーティング](/ja-JP/concepts/multi-agent)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
