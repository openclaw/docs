---
read_when:
    - WhatsApp/Webチャンネルの動作または受信トレイルーティングの作業
summary: WhatsAppチャンネルのサポート、アクセス制御、配信動作、運用
title: WhatsApp
x-i18n:
    generated_at: "2026-04-23T13:59:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: e14735a33ffb48334b920a5e63645abf3445f56481b1ce8b7c128800e2adc981
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp（Webチャンネル）

ステータス: WhatsApp Web（Baileys）経由で本番対応済み。リンク済みセッションはGatewayが管理します。

## インストール（必要時）

- オンボーディング（`openclaw onboard`）と `openclaw channels add --channel whatsapp` は、初回選択時にWhatsApp Pluginのインストールを案内します。
- `openclaw channels login --channel whatsapp` も、Pluginがまだ存在しない場合はインストールフローを案内します。
- 開発チャンネル + git checkoutでは、デフォルトでローカルPluginパスを使用します。
- Stable/Betaでは、デフォルトでnpmパッケージ `@openclaw/whatsapp` を使用します。

手動インストールも引き続き利用できます:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    未知の送信者に対するデフォルトのDMポリシーはpairingです。
  </Card>
  <Card title="チャンネルトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復プレイブック。
  </Card>
  <Card title="Gateway設定" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャンネル設定パターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="WhatsAppアクセスポリシーを設定する">

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

  <Step title="WhatsAppをリンクする（QR）">

```bash
openclaw channels login --channel whatsapp
```

    特定のアカウントの場合:

```bash
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Gatewayを起動する">

```bash
openclaw gateway
```

  </Step>

  <Step title="最初のペアリングリクエストを承認する（pairingモードを使用している場合）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    ペアリングリクエストは1時間で期限切れになります。保留中リクエストはチャンネルごとに最大3件です。

  </Step>
</Steps>

<Note>
OpenClawは、可能であれば別番号でWhatsAppを運用することを推奨します。（チャンネルメタデータとセットアップフローはその構成向けに最適化されていますが、個人番号での構成もサポートされています。）
</Note>

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用番号（推奨）">
    これは最もクリーンな運用モードです:

    - OpenClaw用に分離されたWhatsApp ID
    - より明確なDM許可リストとルーティング境界
    - self-chatの混乱が起きる可能性が低い

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

  <Accordion title="個人番号での代替運用">
    オンボーディングは個人番号モードをサポートし、self-chatしやすいベースラインを書き込みます:

    - `dmPolicy: "allowlist"`
    - `allowFrom` に個人番号を含める
    - `selfChatMode: true`

    実行時には、self-chat保護はリンク済みの自分の番号と `allowFrom` に基づいて動作します。

  </Accordion>

  <Accordion title="WhatsApp Web限定のチャンネルスコープ">
    現在のOpenClawチャンネルアーキテクチャでは、メッセージングプラットフォームチャンネルはWhatsApp Webベース（`Baileys`）です。

    組み込みのチャットチャンネルレジストリには、別個のTwilio WhatsAppメッセージングチャンネルはありません。

  </Accordion>
</AccordionGroup>

## 実行時モデル

- GatewayがWhatsAppソケットと再接続ループを管理します。
- 送信には、対象アカウントに対してアクティブなWhatsAppリスナーが必要です。
- ステータスチャットとブロードキャストチャットは無視されます（`@status`, `@broadcast`）。
- ダイレクトチャットはDMセッションルールを使用します（`session.dmScope`。デフォルト `main` はDMをエージェントのメインセッションへ集約します）。
- グループセッションは分離されます（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Webトランスポートは、Gatewayホスト上の標準プロキシ環境変数（`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` および小文字版）を尊重します。チャンネル固有のWhatsAppプロキシ設定より、ホストレベルのプロキシ設定を推奨します。

## アクセス制御と有効化

<Tabs>
  <Tab title="DMポリシー">
    `channels.whatsapp.dmPolicy` はダイレクトチャットアクセスを制御します:

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    `allowFrom` はE.164形式の番号を受け付けます（内部で正規化されます）。

    マルチアカウント上書き: そのアカウントでは `channels.whatsapp.accounts.<id>.dmPolicy`（および `allowFrom`）がチャンネルレベルのデフォルトより優先されます。

    実行時の動作詳細:

    - pairingはチャンネルallow-storeに永続化され、設定済み `allowFrom` とマージされます
    - 許可リストが設定されていない場合、リンク済みの自分の番号はデフォルトで許可されます
    - 送信側の `fromMe` DMが自動でペアリングされることはありません

  </Tab>

  <Tab title="グループポリシー + 許可リスト">
    グループアクセスには2層あります:

    1. **グループメンバーシップ許可リスト**（`channels.whatsapp.groups`）
       - `groups` が省略されている場合、すべてのグループが対象候補です
       - `groups` が存在する場合、それはグループ許可リストとして機能します（`"*"` 可）

    2. **グループ送信者ポリシー**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`: 送信者許可リストをバイパス
       - `allowlist`: 送信者は `groupAllowFrom`（または `*`）に一致する必要があります
       - `disabled`: すべてのグループ受信をブロック

    送信者許可リストのフォールバック:

    - `groupAllowFrom` が未設定の場合、利用可能なら実行時に `allowFrom` へフォールバックします
    - 送信者許可リストはmention/reply有効化より前に評価されます

    注意: `channels.whatsapp` ブロック自体がまったく存在しない場合、実行時のグループポリシーフォールバックは `allowlist` です（警告ログあり）。`channels.defaults.groupPolicy` が設定されていても同様です。

  </Tab>

  <Tab title="メンション + /activation">
    グループ返信はデフォルトでメンションが必要です。

    メンション検出には以下が含まれます:

    - bot IDに対する明示的なWhatsAppメンション
    - 設定済みのメンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - 暗黙のbotへの返信検出（返信元送信者がbot IDと一致）

    セキュリティに関する注意:

    - 引用/返信はmention gatingを満たすだけであり、送信者認可は付与しません
    - `groupPolicy: "allowlist"` の場合、許可リスト外の送信者は、許可リスト内ユーザーのメッセージに返信していてもブロックされます

    セッションレベルの有効化コマンド:

    - `/activation mention`
    - `/activation always`

    `activation` はセッション状態を更新します（グローバル設定ではありません）。所有者ゲート付きです。

  </Tab>
</Tabs>

## 個人番号とself-chatの動作

リンク済みの自分の番号が `allowFrom` にも存在する場合、WhatsApp self-chat保護が有効になります:

- self-chatターンでは既読通知をスキップする
- そうでなければ自分自身を通知してしまうmention-JID自動トリガー動作を無視する
- `messages.responsePrefix` が未設定の場合、self-chat返信のデフォルトは `[{identity.name}]` または `[openclaw]`

## メッセージ正規化とコンテキスト

<AccordionGroup>
  <Accordion title="受信エンベロープ + 返信コンテキスト">
    受信したWhatsAppメッセージは共有の受信エンベロープでラップされます。

    引用返信がある場合、コンテキストは次の形式で追加されます:

    ```text
    [<sender>への返信 id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    返信メタデータフィールドも、利用可能な場合は設定されます（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、sender JID/E.164）。

  </Accordion>

  <Accordion title="メディアプレースホルダーと位置情報/連絡先の抽出">
    メディアのみの受信メッセージは、次のようなプレースホルダーで正規化されます:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    位置情報と連絡先ペイロードは、ルーティング前にテキストコンテキストへ正規化されます。

  </Accordion>

  <Accordion title="保留中グループ履歴の注入">
    グループでは、未処理メッセージをバッファし、botが最終的にトリガーされたときにコンテキストとして注入できます。

    - デフォルト上限: `50`
    - 設定: `channels.whatsapp.historyLimit`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効化

    注入マーカー:

    - `[前回の返信以降のチャットメッセージ - コンテキスト用]`
    - `[現在のメッセージ - これに応答してください]`

  </Accordion>

  <Accordion title="既読通知">
    既読通知は、受理された受信WhatsAppメッセージに対してデフォルトで有効です。

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

    self-chatターンでは、グローバルで有効でも既読通知をスキップします。

  </Accordion>
</AccordionGroup>

## 配信、チャンク化、メディア

<AccordionGroup>
  <Accordion title="テキストのチャンク化">
    - デフォルトのチャンク上限: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` モードは段落境界（空行）を優先し、その後で長さ安全なチャンク化へフォールバックします
  </Accordion>

  <Accordion title="送信メディアの動作">
    - 画像、動画、音声（PTTボイスノート）、ドキュメントのペイロードをサポート
    - `audio/ogg` はボイスノート互換性のため `audio/ogg; codecs=opus` に書き換えられます
    - アニメーションGIF再生は、動画送信時の `gifPlayback: true` でサポートされます
    - 複数メディアの返信ペイロードを送る際、キャプションは最初のメディア項目に適用されます
    - メディアソースはHTTP(S)、`file://`、またはローカルパスが利用できます
  </Accordion>

  <Accordion title="メディアサイズ制限とフォールバック動作">
    - 受信メディア保存上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - 送信メディア送信上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - アカウントごとの上書きは `channels.whatsapp.accounts.<accountId>.mediaMaxMb` を使用します
    - 画像は制限に収まるよう自動最適化されます（リサイズ/品質調整）
    - メディア送信失敗時には、最初の項目のフォールバックとしてテキスト警告を送信し、応答を黙って破棄しません
  </Accordion>
</AccordionGroup>

## 返信の引用

WhatsAppはネイティブな返信引用をサポートしており、送信返信では受信メッセージが視覚的に引用されます。これは `channels.whatsapp.replyToMode` で制御します。

| Value    | 動作                                                                               |
| -------- | ---------------------------------------------------------------------------------- |
| `"auto"` | プロバイダーがサポートしている場合は受信メッセージを引用し、そうでなければ引用をスキップ |
| `"on"`   | 常に受信メッセージを引用し、引用が拒否された場合は通常送信にフォールバック              |
| `"off"`  | 引用せず、通常メッセージとして送信                                                  |

デフォルトは `"auto"` です。アカウントごとの上書きは `channels.whatsapp.accounts.<id>.replyToMode` を使用します。

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## リアクションレベル

`channels.whatsapp.reactionLevel` は、エージェントがWhatsAppでどの程度広く絵文字リアクションを使うかを制御します:

| Level         | Ackリアクション | エージェント主導リアクション | 説明                                               |
| ------------- | --------------- | ---------------------------- | -------------------------------------------------- |
| `"off"`       | なし            | なし                         | リアクションを一切行わない                         |
| `"ack"`       | あり            | なし                         | Ackリアクションのみ（返信前の受領確認）            |
| `"minimal"`   | あり            | あり（保守的）               | Ack + 保守的ガイダンス付きエージェントリアクション |
| `"extensive"` | あり            | あり（推奨）                 | Ack + 推奨ガイダンス付きエージェントリアクション   |

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

WhatsAppは、`channels.whatsapp.ackReaction` を通じて受信直後のAckリアクションをサポートします。
Ackリアクションは `reactionLevel` によって制御され、`reactionLevel` が `"off"` の場合は抑制されます。

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

動作に関する注意:

- 受信が受理された直後に送信されます（返信前）。
- 失敗はログに記録されますが、通常の返信配信は妨げません。
- グループモード `mentions` は、メンショントリガーのターンでリアクションします。グループ有効化 `always` はこのチェックをバイパスするものとして動作します。
- WhatsAppでは `channels.whatsapp.ackReaction` を使用します（旧 `messages.ackReaction` はここでは使用されません）。

## マルチアカウントと認証情報

<AccordionGroup>
  <Accordion title="アカウント選択とデフォルト">
    - アカウントIDは `channels.whatsapp.accounts` から取得されます
    - デフォルトアカウント選択: `default` が存在すればそれ、なければ設定済みアカウントIDの先頭（ソート順）
    - アカウントIDは参照用に内部で正規化されます
  </Accordion>

  <Accordion title="認証情報パスと旧構成との互換性">
    - 現在の認証パス: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - バックアップファイル: `creds.json.bak`
    - `~/.openclaw/credentials/` 内の旧デフォルト認証も、デフォルトアカウントフローでは引き続き認識/移行されます
  </Accordion>

  <Accordion title="ログアウト動作">
    `openclaw channels logout --channel whatsapp [--account <id>]` は、そのアカウントのWhatsApp認証状態を消去します。

    旧認証ディレクトリでは、`oauth.json` は保持され、Baileys認証ファイルは削除されます。

  </Accordion>
</AccordionGroup>

## ツール、アクション、設定書き込み

- エージェントツールサポートにはWhatsAppリアクションアクション（`react`）が含まれます。
- アクションゲート:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- チャンネル主導の設定書き込みはデフォルトで有効です（`channels.whatsapp.configWrites=false` で無効化）。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="リンクされていない（QRが必要）">
    症状: チャンネルステータスが未リンクと表示される。

    修正:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="リンク済みだが切断される / 再接続ループ">
    症状: リンク済みアカウントで切断または再接続試行が繰り返される。

    修正:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    必要に応じて、`channels login` で再リンクしてください。

  </Accordion>

  <Accordion title="送信時にアクティブなリスナーがない">
    対象アカウントに対してアクティブなGatewayリスナーが存在しない場合、送信は即座に失敗します。

    Gatewayが動作中で、そのアカウントがリンク済みであることを確認してください。

  </Accordion>

  <Accordion title="グループメッセージが予期せず無視される">
    次の順で確認してください:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 許可リストエントリ
    - mention gating（`requireMention` + mention patterns）
    - `openclaw.json` 内の重複キー（JSON5）: 後のエントリが前のエントリを上書きするため、スコープごとに `groupPolicy` は1つだけにしてください

  </Accordion>

  <Accordion title="Bunランタイム警告">
    WhatsApp GatewayランタイムはNodeを使用する必要があります。Bunは安定したWhatsApp/Telegram Gateway運用とは互換性がないものとして扱われます。
  </Accordion>
</AccordionGroup>

## システムプロンプト

WhatsAppは、`groups` および `direct` マップを通じて、Telegramスタイルのグループ/ダイレクトチャット用システムプロンプトをサポートします。

グループメッセージの解決階層:

まず有効な `groups` マップが決定されます。アカウントが独自の `groups` を定義している場合、それはルートの `groups` マップを完全に置き換えます（ディープマージなし）。その後、プロンプト参照はその結果得られた単一マップに対して行われます:

1. **グループ固有のシステムプロンプト**（`groups["<groupId>"].systemPrompt`）: 特定グループのエントリが `systemPrompt` を定義している場合に使用されます。
2. **グループワイルドカードのシステムプロンプト**（`groups["*"].systemPrompt`）: 特定グループのエントリが存在しない、または `systemPrompt` を定義していない場合に使用されます。

ダイレクトメッセージの解決階層:

まず有効な `direct` マップが決定されます。アカウントが独自の `direct` を定義している場合、それはルートの `direct` マップを完全に置き換えます（ディープマージなし）。その後、プロンプト参照はその結果得られた単一マップに対して行われます:

1. **ダイレクト固有のシステムプロンプト**（`direct["<peerId>"].systemPrompt`）: 特定peerのエントリが `systemPrompt` を定義している場合に使用されます。
2. **ダイレクトワイルドカードのシステムプロンプト**（`direct["*"].systemPrompt`）: 特定peerのエントリが存在しない、または `systemPrompt` を定義していない場合に使用されます。

注意: `dms` は、軽量なDMごとの履歴上書きバケット（`dms.<id>.historyLimit`）として引き続き使われます。プロンプト上書きは `direct` 配下に置かれます。

**Telegramのマルチアカウント動作との違い:** Telegramでは、マルチアカウント構成時に、ルート `groups` は意図的にすべてのアカウントで抑止されます。独自の `groups` を定義していないアカウントでも同様です。これは、botが所属していないグループのメッセージを受信しないようにするためです。WhatsAppではこのガードは適用されません。設定アカウント数に関係なく、アカウントレベルの上書きを定義していないアカウントは、常にルート `groups` とルート `direct` を継承します。マルチアカウントのWhatsApp構成でアカウントごとのグループまたはダイレクトプロンプトが必要な場合は、ルートレベルのデフォルトに頼るのではなく、各アカウント配下に完全なマップを明示的に定義してください。

重要な動作:

- `channels.whatsapp.groups` は、グループごとの設定マップであると同時に、チャットレベルのグループ許可リストでもあります。ルートスコープでもアカウントスコープでも、`groups["*"]` はそのスコープにおいて「すべてのグループを受け入れる」ことを意味します。
- ワイルドカードのグループ `systemPrompt` は、そのスコープですべてのグループをすでに受け入れたい場合にのみ追加してください。引き続き固定されたグループID集合だけを対象にしたい場合は、プロンプトのデフォルトとして `groups["*"]` を使わないでください。代わりに、明示的に許可リストへ追加した各グループエントリに同じプロンプトを繰り返してください。
- グループ受け入れと送信者認可は別のチェックです。`groups["*"]` はグループ処理に到達できるグループ集合を広げますが、それ自体でそれらのグループ内のすべての送信者を認可するわけではありません。送信者アクセスは引き続き `channels.whatsapp.groupPolicy` と `channels.whatsapp.groupAllowFrom` によって個別に制御されます。
- `channels.whatsapp.direct` にはDMに対して同じ副作用はありません。`direct["*"]` は、DMが `dmPolicy` と `allowFrom` またはpairing-storeルールによってすでに受け入れられた後にのみ、デフォルトのダイレクトチャット設定を提供します。

例:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // ルートスコープですべてのグループを受け入れるべき場合にのみ使用します。
        // 独自のgroupsマップを定義していないすべてのアカウントに適用されます。
        "*": { systemPrompt: "すべてのグループ用のデフォルトプロンプト。" },
      },
      direct: {
        // 独自のdirectマップを定義していないすべてのアカウントに適用されます。
        "*": { systemPrompt: "すべてのダイレクトチャット用のデフォルトプロンプト。" },
      },
      accounts: {
        work: {
          groups: {
            // このアカウントは独自のgroupsを定義しているため、ルートgroupsは完全に
            // 置き換えられます。ワイルドカードも維持したい場合は、ここでも明示的に
            // "*" を定義してください。
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "プロジェクト管理に集中してください。",
            },
            // このアカウントですべてのグループを受け入れるべき場合にのみ使用します。
            "*": { systemPrompt: "workグループ用のデフォルトプロンプト。" },
          },
          direct: {
            // このアカウントは独自のdirectマップを定義しているため、ルートdirectエントリは
            // 完全に置き換えられます。ワイルドカードも維持したい場合は、ここでも明示的に
            // "*" を定義してください。
            "+15551234567": { systemPrompt: "特定のworkダイレクトチャット用のプロンプト。" },
            "*": { systemPrompt: "workダイレクトチャット用のデフォルトプロンプト。" },
          },
        },
      },
    },
  },
}
```

## 設定リファレンス参照先

主要リファレンス:

- [Configuration reference - WhatsApp](/ja-JP/gateway/configuration-reference#whatsapp)

重要度の高いWhatsAppフィールド:

- アクセス: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- 配信: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- マルチアカウント: `accounts.<id>.enabled`, `accounts.<id>.authDir`, アカウントレベルの上書き
- 運用: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- セッション動作: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- プロンプト: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## 関連

- [Pairing](/ja-JP/channels/pairing)
- [Groups](/ja-JP/channels/groups)
- [Security](/ja-JP/gateway/security)
- [Channel routing](/ja-JP/channels/channel-routing)
- [Multi-agent routing](/ja-JP/concepts/multi-agent)
- [Troubleshooting](/ja-JP/channels/troubleshooting)
