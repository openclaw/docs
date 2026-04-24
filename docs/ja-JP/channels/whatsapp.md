---
read_when:
    - WhatsApp/Web チャネルの動作または受信トレイルーティングの利用方法
summary: WhatsApp チャネルのサポート、アクセス制御、配信動作、運用
title: WhatsApp
x-i18n:
    generated_at: "2026-04-24T04:48:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0261e132d459c91f5d81d5ad9485acbdf5792e6bfc8cd33bb74e45192df9fd2f
    source_path: channels/whatsapp.md
    workflow: 15
---

ステータス: WhatsApp Web（Baileys）経由で本番運用可能です。Gateway がリンク済みセッションを所有します。

## インストール（必要時）

- オンボーディング（`openclaw onboard`）と `openclaw channels add --channel whatsapp` は、
  初めて WhatsApp を選択したときに WhatsApp Plugin のインストールを促します。
- `openclaw channels login --channel whatsapp` も、まだ
  Plugin が存在しない場合はインストールフローを提示します。
- 開発チャネル + git チェックアウトでは、デフォルトでローカル Plugin パスを使います。
- Stable/Beta では、デフォルトで npm パッケージ `@openclaw/whatsapp` を使います。

手動インストールも引き続き利用できます。

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    不明な送信者に対するデフォルトの DM ポリシーは pairing です。
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

  </Step>

  <Step title="Gateway を起動する">

```bash
openclaw gateway
```

  </Step>

  <Step title="最初のペアリングリクエストを承認する（pairing モードを使う場合）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    ペアリングリクエストは 1 時間で期限切れになります。保留中リクエストはチャネルごとに 3 件までです。

  </Step>
</Steps>

<Note>
OpenClaw は、可能であれば別の番号で WhatsApp を運用することを推奨します。（チャネルメタデータとセットアップフローはその構成向けに最適化されていますが、個人番号での構成もサポートされています。）
</Note>

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用番号（推奨）">
    これが最もクリーンな運用モードです。

    - OpenClaw 用に分離された WhatsApp アイデンティティ
    - より明確な DM 許可リストとルーティング境界
    - 自分自身とのチャット混乱の可能性が低い

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

  <Accordion title="個人番号のフォールバック">
    オンボーディングは個人番号モードをサポートし、self-chat に適したベースラインを書き込みます。

    - `dmPolicy: "allowlist"`
    - `allowFrom` にあなたの個人番号を含める
    - `selfChatMode: true`

    ランタイムでは、self-chat 保護はリンク済み self 番号と `allowFrom` に基づいて動作します。

  </Accordion>

  <Accordion title="WhatsApp Web のみのチャネルスコープ">
    現在の OpenClaw チャネルアーキテクチャでは、メッセージングプラットフォームのチャネルは WhatsApp Web ベース（`Baileys`）です。

    組み込みチャットチャネルレジストリには、別個の Twilio WhatsApp メッセージングチャネルはありません。

  </Accordion>
</AccordionGroup>

## ランタイムモデル

- Gateway が WhatsApp ソケットと再接続ループを所有します。
- 送信には、対象アカウントに対してアクティブな WhatsApp リスナーが必要です。
- ステータスチャットとブロードキャストチャットは無視されます（`@status`, `@broadcast`）。
- ダイレクトチャットは DM セッションルールを使用します（`session.dmScope`。デフォルトの `main` は DM をエージェントのメインセッションに集約します）。
- グループセッションは分離されます（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Web トランスポートは、Gateway ホスト上の標準プロキシ環境変数（`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / 小文字版）に従います。チャネル固有の WhatsApp プロキシ設定より、ホストレベルのプロキシ設定を推奨します。

## アクセス制御とアクティベーション

<Tabs>
  <Tab title="DM ポリシー">
    `channels.whatsapp.dmPolicy` はダイレクトチャットアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    `allowFrom` は E.164 形式の番号を受け付けます（内部で正規化されます）。

    マルチアカウント上書き: `channels.whatsapp.accounts.<id>.dmPolicy`（および `allowFrom`）は、そのアカウントについてチャネルレベルのデフォルトより優先されます。

    ランタイム動作の詳細:

    - pairing はチャネルの allow-store に永続化され、設定済み `allowFrom` とマージされます
    - 許可リストが設定されていない場合、リンク済み self 番号はデフォルトで許可されます
    - OpenClaw は、送信元 `fromMe` の DM（リンク済みデバイスから自分宛てに送ったメッセージ）を自動ペアリングしません

  </Tab>

  <Tab title="グループポリシー + 許可リスト">
    グループアクセスには 2 つの層があります。

    1. **グループメンバーシップ許可リスト**（`channels.whatsapp.groups`）
       - `groups` が省略されている場合、すべてのグループが対象になります
       - `groups` が存在する場合、それはグループ許可リストとして機能します（`"*"` を許可可能）

    2. **グループ送信者ポリシー**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`: 送信者許可リストをバイパス
       - `allowlist`: 送信者は `groupAllowFrom`（または `*`）に一致する必要があります
       - `disabled`: すべてのグループ受信をブロック

    送信者許可リストのフォールバック:

    - `groupAllowFrom` が未設定の場合、ランタイムは利用可能なら `allowFrom` にフォールバックします
    - 送信者許可リストは、メンション/返信アクティベーションより前に評価されます

    注意: `channels.whatsapp` ブロック自体がまったく存在しない場合、`channels.defaults.groupPolicy` が設定されていても、ランタイムのグループポリシーフォールバックは `allowlist` です（警告ログあり）。

  </Tab>

  <Tab title="メンション + /activation">
    グループ返信はデフォルトでメンションを必要とします。

    メンション検出には以下が含まれます。

    - ボットアイデンティティへの明示的な WhatsApp メンション
    - 設定済みメンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - 暗黙のボット宛て返信検出（返信送信者がボットアイデンティティに一致）

    セキュリティに関する注意:

    - 引用/返信はメンションゲーティングを満たすだけであり、送信者認可は付与しません
    - `groupPolicy: "allowlist"` では、許可リストにない送信者は、許可リスト済みユーザーのメッセージに返信していても引き続きブロックされます

    セッションレベルのアクティベーションコマンド:

    - `/activation mention`
    - `/activation always`

    `activation` はセッション状態を更新します（グローバル設定ではありません）。オーナー制限があります。

  </Tab>
</Tabs>

## 個人番号と self-chat の動作

リンク済み self 番号が `allowFrom` にも含まれている場合、WhatsApp の self-chat 保護が有効になります。

- self-chat ターンでは既読通知をスキップ
- そうでなければ自分を ping してしまうメンション JID 自動トリガー動作を無視
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

    返信メタデータフィールドも、利用可能な場合に設定されます（`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164）。

  </Accordion>

  <Accordion title="メディアプレースホルダーと位置情報/連絡先抽出">
    メディアのみの受信メッセージは、次のようなプレースホルダーで正規化されます。

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    位置情報本文は簡潔な座標テキストを使います。位置情報ラベル/コメントと連絡先/vCard 詳細は、インラインのプロンプトテキストではなく、フェンス付きの信頼されていないメタデータとしてレンダリングされます。

  </Accordion>

  <Accordion title="保留中グループ履歴の注入">
    グループでは、未処理メッセージをバッファし、ボットが最終的にトリガーされたときにコンテキストとして注入できます。

    - デフォルト上限: `50`
    - 設定: `channels.whatsapp.historyLimit`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効化

    注入マーカー:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="既読通知">
    受理された受信 WhatsApp メッセージについて、既読通知はデフォルトで有効です。

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

    self-chat ターンでは、グローバルに有効でも既読通知をスキップします。

  </Accordion>
</AccordionGroup>

## 配信、分割、メディア

<AccordionGroup>
  <Accordion title="テキスト分割">
    - デフォルトの分割上限: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` モードは段落境界（空行）を優先し、その後で長さ安全な分割にフォールバックします
  </Accordion>

  <Accordion title="送信メディアの動作">
    - 画像、動画、音声（PTT ボイスノート）、ドキュメントペイロードをサポート
    - `audio/ogg` は、ボイスノート互換性のため `audio/ogg; codecs=opus` に書き換えられます
    - アニメーション GIF 再生は、動画送信時の `gifPlayback: true` でサポートされます
    - 複数メディア返信ペイロード送信時、キャプションは最初のメディア項目に適用されます
    - メディアソースは HTTP(S)、`file://`、またはローカルパスを使用できます
  </Accordion>

  <Accordion title="メディアサイズ上限とフォールバック動作">
    - 受信メディア保存上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - 送信メディア送信上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - アカウントごとの上書きは `channels.whatsapp.accounts.<accountId>.mediaMaxMb` を使用
    - 画像は上限に収まるよう自動最適化されます（リサイズ/品質スイープ）
    - メディア送信失敗時、先頭項目のフォールバックは応答を黙って破棄せず、警告テキストを送信します
  </Accordion>
</AccordionGroup>

## 返信引用

WhatsApp はネイティブな返信引用をサポートしており、送信返信で受信メッセージを目に見える形で引用できます。これを `channels.whatsapp.replyToMode` で制御します。

| 値       | 動作                                                                                 |
| -------- | ------------------------------------------------------------------------------------ |
| `"auto"` | プロバイダーがサポートする場合は受信メッセージを引用し、そうでなければ引用をスキップ |
| `"on"`   | 常に受信メッセージを引用し、引用が拒否された場合は通常送信にフォールバック           |
| `"off"`  | 引用せず、通常メッセージとして送信                                                   |

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

`channels.whatsapp.reactionLevel` は、エージェントが WhatsApp で絵文字リアクションをどの程度広く使うかを制御します。

| レベル        | Ack リアクション | エージェント開始リアクション | 説明                                                |
| ------------- | ---------------- | ---------------------------- | --------------------------------------------------- |
| `"off"`       | なし             | なし                         | リアクションを一切使わない                          |
| `"ack"`       | あり             | なし                         | Ack リアクションのみ（返信前の受領確認）            |
| `"minimal"`   | あり             | あり（保守的）               | Ack + 保守的なガイダンス付きエージェントリアクション |
| `"extensive"` | あり             | あり（推奨）                 | Ack + 推奨ガイダンス付きエージェントリアクション     |

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

WhatsApp は `channels.whatsapp.ackReaction` を通じて、受信時の即時 ack リアクションをサポートします。
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

動作に関する注意:

- 受信が受理された直後に送信されます（返信前）
- 失敗はログに記録されますが、通常の返信配信は妨げません
- グループモード `mentions` は、メンションによってトリガーされたターンでリアクションします。グループアクティベーション `always` はこのチェックをバイパスするものとして動作します
- WhatsApp は `channels.whatsapp.ackReaction` を使用します（旧来の `messages.ackReaction` はここでは使われません）

## マルチアカウントと認証情報

<AccordionGroup>
  <Accordion title="アカウント選択とデフォルト">
    - アカウント ID は `channels.whatsapp.accounts` から取得されます
    - デフォルトアカウントの選択: `default` が存在すればそれ、存在しなければ設定済みアカウント ID の先頭（ソート順）
    - アカウント ID は参照用に内部で正規化されます
  </Accordion>

  <Accordion title="認証情報パスと旧来互換性">
    - 現在の認証パス: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - バックアップファイル: `creds.json.bak`
    - `~/.openclaw/credentials/` 内の旧来のデフォルト認証も、デフォルトアカウントフローでは引き続き認識/移行されます
  </Accordion>

  <Accordion title="ログアウト動作">
    `openclaw channels logout --channel whatsapp [--account <id>]` は、そのアカウントの WhatsApp 認証状態を消去します。

    旧来の認証ディレクトリでは、`oauth.json` は保持され、Baileys 認証ファイルは削除されます。

  </Accordion>
</AccordionGroup>

## Tools、アクション、設定書き込み

- エージェントの tool サポートには、WhatsApp リアクションアクション（`react`）が含まれます。
- アクションゲート:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- チャネル起点の設定書き込みはデフォルトで有効です（`channels.whatsapp.configWrites=false` で無効化）。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="未リンク（QR が必要）">
    症状: チャネルステータスが未リンクを示します。

    修正:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="リンク済みだが切断される / 再接続ループ">
    症状: リンク済みアカウントで切断または再接続試行が繰り返されます。

    修正:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    必要に応じて、`channels login` で再リンクしてください。

  </Accordion>

  <Accordion title="送信時にアクティブなリスナーがない">
    対象アカウントにアクティブな Gateway リスナーが存在しない場合、送信は即座に失敗します。

    Gateway が動作中であり、そのアカウントがリンク済みであることを確認してください。

  </Accordion>

  <Accordion title="グループメッセージが予期せず無視される">
    次の順序で確認してください。

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 許可リストエントリー
    - メンションゲーティング（`requireMention` + メンションパターン）
    - `openclaw.json` 内の重複キー（JSON5）: 後のエントリーが前のものを上書きするため、スコープごとに `groupPolicy` は 1 つだけにしてください

  </Accordion>

  <Accordion title="Bun ランタイム警告">
    WhatsApp Gateway ランタイムには Node を使用してください。安定した WhatsApp/Telegram Gateway 運用では、Bun は非互換として扱われます。
  </Accordion>
</AccordionGroup>

## システムプロンプト

WhatsApp は、グループチャットとダイレクトチャットの両方で、Telegram 形式のシステムプロンプトを `groups` および `direct` マップ経由でサポートします。

グループメッセージの解決階層:

まず有効な `groups` マップが決定されます。アカウントが独自の `groups` を定義している場合、それはルートの `groups` マップを完全に置き換えます（deep merge なし）。その後、結果となる単一マップに対してプロンプト検索が行われます。

1. **グループ固有のシステムプロンプト**（`groups["<groupId>"].systemPrompt`）: 特定のグループエントリーが `systemPrompt` を定義している場合に使用されます。
2. **グループワイルドカードシステムプロンプト**（`groups["*"].systemPrompt`）: 特定のグループエントリーが存在しない、または `systemPrompt` を定義していない場合に使用されます。

ダイレクトメッセージの解決階層:

まず有効な `direct` マップが決定されます。アカウントが独自の `direct` を定義している場合、それはルートの `direct` マップを完全に置き換えます（deep merge なし）。その後、結果となる単一マップに対してプロンプト検索が行われます。

1. **ダイレクト固有のシステムプロンプト**（`direct["<peerId>"].systemPrompt`）: 特定の peer エントリーが `systemPrompt` を定義している場合に使用されます。
2. **ダイレクトワイルドカードシステムプロンプト**（`direct["*"].systemPrompt`）: 特定の peer エントリーが存在しない、または `systemPrompt` を定義していない場合に使用されます。

注意: `dms` は引き続き軽量な DM ごとの履歴上書きバケット（`dms.<id>.historyLimit`）です。プロンプト上書きは `direct` 配下に置かれます。

**Telegram マルチアカウント動作との違い:** Telegram では、ボットが所属していないグループのメッセージを受け取ることを防ぐため、マルチアカウント構成ではルートの `groups` がすべてのアカウントで意図的に抑制されます。これは、そのアカウントが独自の `groups` を定義していない場合でも同様です。WhatsApp ではこのガードは適用されません。設定されているアカウント数に関係なく、アカウントレベルの上書きを定義していないアカウントは常にルートの `groups` とルートの `direct` を継承します。マルチアカウントの WhatsApp 構成でアカウントごとのグループまたはダイレクトプロンプトが必要な場合は、ルートレベルのデフォルトに頼らず、各アカウント配下に完全なマップを明示的に定義してください。

重要な動作:

- `channels.whatsapp.groups` は、グループごとの設定マップであると同時に、チャットレベルのグループ許可リストでもあります。ルートまたはアカウントスコープのいずれでも、`groups["*"]` はそのスコープで「すべてのグループを受け入れる」ことを意味します。
- ワイルドカードグループ `systemPrompt` は、そのスコープで本当にすべてのグループを受け入れたい場合にのみ追加してください。それでも対象を固定されたグループ ID 集合のみにしたい場合は、プロンプトデフォルトに `groups["*"]` を使わないでください。代わりに、明示的に許可リストに入れた各グループエントリーに同じプロンプトを繰り返し指定してください。
- グループ受け入れと送信者認可は別々のチェックです。`groups["*"]` はグループ処理に到達できるグループ集合を広げますが、それだけでそのグループ内のすべての送信者を認可するわけではありません。送信者アクセスは引き続き `channels.whatsapp.groupPolicy` と `channels.whatsapp.groupAllowFrom` によって別途制御されます。
- `channels.whatsapp.direct` には、DM について同じ副作用はありません。`direct["*"]` は、DM が `dmPolicy` と `allowFrom` または pairing-store ルールによって受け入れられた後にのみ、デフォルトのダイレクトチャット設定を提供します。

例:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // ルートスコープですべてのグループを受け入れる場合にのみ使用します。
        // 独自の groups マップを定義しないすべてのアカウントに適用されます。
        "*": { systemPrompt: "すべてのグループ向けのデフォルトプロンプト。" },
      },
      direct: {
        // 独自の direct マップを定義しないすべてのアカウントに適用されます。
        "*": { systemPrompt: "すべてのダイレクトチャット向けのデフォルトプロンプト。" },
      },
      accounts: {
        work: {
          groups: {
            // このアカウントは独自の groups を定義しているため、ルートの groups は完全に
            // 置き換えられます。ワイルドカードを維持したい場合は、ここでも明示的に "*" を定義してください。
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "プロジェクト管理に集中する。",
            },
            // このアカウントですべてのグループを受け入れる場合にのみ使用します。
            "*": { systemPrompt: "業務グループ向けのデフォルトプロンプト。" },
          },
          direct: {
            // このアカウントは独自の direct マップを定義しているため、ルートの direct エントリーは
            // 完全に置き換えられます。ワイルドカードを維持したい場合は、ここでも明示的に "*" を定義してください。
            "+15551234567": { systemPrompt: "特定の業務ダイレクトチャット向けプロンプト。" },
            "*": { systemPrompt: "業務ダイレクトチャット向けのデフォルトプロンプト。" },
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
- 運用: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- セッション動作: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- プロンプト: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [セキュリティ](/ja-JP/gateway/security)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
