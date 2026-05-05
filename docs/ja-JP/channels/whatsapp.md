---
read_when:
    - WhatsApp/ウェブチャネルの動作または受信トレイのルーティングに取り組む
summary: WhatsApp チャネル対応、アクセス制御、配信動作、運用
title: WhatsApp
x-i18n:
    generated_at: "2026-05-05T04:49:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52a81fc323568e06d11606931e34465fe5a823a0699d8e0638195b8667c3ebee
    source_path: channels/whatsapp.md
    workflow: 16
---

ステータス: WhatsApp Web (Baileys) 経由で本番対応済み。Gateway がリンク済みセッションを所有します。

## インストール (必要時)

- オンボーディング (`openclaw onboard`) と `openclaw channels add --channel whatsapp` は、
  初めて WhatsApp plugin を選択したときにインストールを促します。
- `openclaw channels login --channel whatsapp` も、plugin がまだ存在しない場合は
  インストールフローを提示します。
- 開発チャンネル + git checkout: デフォルトでローカル plugin パスを使用します。
- Stable/Beta: 現在の公式リリースタグの npm パッケージ `@openclaw/whatsapp` を使用します。

手動インストールも引き続き利用できます。

```bash
openclaw plugins install @openclaw/whatsapp
```

現在の公式リリースタグに追従するには、素のパッケージを使用します。再現可能なインストールが必要な場合にのみ、正確な
バージョンを固定してください。

Windows では、WhatsApp plugin は npm install 中に `PATH` 上の Git を必要とします。これは
Baileys/libsignal 依存関係の 1 つが git URL から取得されるためです。Git for Windows をインストールしてから、シェルを再起動し、インストールを再実行します。

```powershell
winget install --id Git.Git -e
```

Portable Git も、その `bin` ディレクトリが `PATH` 上にあれば動作します。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    未知の送信者に対するデフォルトの DM ポリシーはペアリングです。
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

  <Step title="WhatsApp をリンクする (QR)">

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

  <Step title="最初のペアリング要求を承認する (ペアリングモードを使用する場合)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    ペアリング要求は 1 時間後に期限切れになります。保留中の要求はチャンネルごとに 3 件までです。

  </Step>
</Steps>

<Note>
OpenClaw では、可能な場合は WhatsApp を別の番号で実行することを推奨します。(チャンネルメタデータとセットアップフローはその構成に最適化されていますが、個人番号での構成もサポートされています。)
</Note>

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用番号 (推奨)">
    これは最もクリーンな運用モードです。

    - OpenClaw 用の別の WhatsApp ID
    - より明確な DM 許可リストとルーティング境界
    - セルフチャットの混乱が起きる可能性が低い

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
    - `allowFrom` には個人番号が含まれます
    - `selfChatMode: true`

    実行時には、セルフチャット保護はリンク済みの自分の番号と `allowFrom` をキーにします。

  </Accordion>

  <Accordion title="WhatsApp Web のみのチャンネルスコープ">
    メッセージングプラットフォームチャンネルは、現在の OpenClaw チャンネルアーキテクチャでは WhatsApp Web ベース (`Baileys`) です。

    組み込みチャットチャンネルレジストリには、別の Twilio WhatsApp メッセージングチャンネルはありません。

  </Accordion>
</AccordionGroup>

## 実行時モデル

- Gateway が WhatsApp ソケットと再接続ループを所有します。
- 再接続ウォッチドッグは、受信アプリメッセージ量だけでなく WhatsApp Web トランスポート活動を使用するため、静かなリンク済みデバイスセッションは、最近誰もメッセージを送信していないという理由だけでは再起動されません。トランスポートフレームは到着し続けているが、ウォッチドッグ期間中にアプリケーションメッセージが処理されない場合は、より長いアプリケーション沈黙上限により引き続き再接続が強制されます。最近アクティブだったセッションの一時的な再接続後は、そのアプリケーション沈黙チェックは最初の復旧期間に通常のメッセージタイムアウトを使用します。
- Baileys ソケットタイミングは `web.whatsapp.*` 配下で明示されています: `keepAliveIntervalMs` は WhatsApp Web アプリケーション ping を制御し、`connectTimeoutMs` は開始ハンドシェイクのタイムアウトを制御し、`defaultQueryTimeoutMs` は Baileys クエリタイムアウトを制御します。
- 送信には、対象アカウントのアクティブな WhatsApp リスナーが必要です。
- グループ送信では、テキストおよびメディアキャプション内の `@+<digits>` と `@<digits>` トークンが、LID ベースのグループを含む現在の WhatsApp 参加者メタデータに一致する場合、ネイティブのメンションメタデータを付与します。
- ステータスとブロードキャストチャットは無視されます (`@status`, `@broadcast`)。
- 再接続ウォッチドッグは、受信アプリメッセージ量だけでなく WhatsApp Web トランスポート活動に従います。静かなリンク済みデバイスセッションはトランスポートフレームが継続している間は維持されますが、トランスポート停止は後続のリモート切断パスよりかなり前に再接続を強制します。
- ダイレクトチャットは DM セッションルールを使用します (`session.dmScope`; デフォルトの `main` は DM をエージェントのメインセッションに集約します)。
- グループセッションは分離されます (`agent:<agentId>:whatsapp:group:<jid>`)。
- WhatsApp Channels/Newsletters は、ネイティブの `@newsletter` JID を持つ明示的な送信先にできます。ニュースレター送信は、DM セッションセマンティクスではなくチャンネルセッションメタデータ (`agent:<agentId>:whatsapp:channel:<jid>`) を使用します。
- WhatsApp Web トランスポートは、Gateway ホスト上の標準プロキシ環境変数 (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / 小文字バリアント) を尊重します。チャンネル固有の WhatsApp プロキシ設定よりも、ホストレベルのプロキシ設定を優先してください。
- `messages.removeAckAfterReply` が有効な場合、OpenClaw は表示される返信が配信された後に WhatsApp の ack リアクションをクリアします。

## Plugin フックとプライバシー

WhatsApp の受信メッセージには、個人的なメッセージ内容、電話番号、
グループ識別子、送信者名、セッション相関フィールドが含まれる場合があります。そのため、
WhatsApp は、明示的にオプトインしない限り、受信 `message_received` フックペイロードを plugins にブロードキャストしません。

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

オプトインは 1 つのアカウントにスコープできます。

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

受信 WhatsApp メッセージの内容と識別子を受け取ることを信頼できる plugins に対してのみ、これを有効にしてください。

## アクセス制御とアクティベーション

<Tabs>
  <Tab title="DM ポリシー">
    `channels.whatsapp.dmPolicy` はダイレクトチャットアクセスを制御します。

    - `pairing` (デフォルト)
    - `allowlist`
    - `open` (`allowFrom` に `"*"` が含まれている必要があります)
    - `disabled`

    `allowFrom` は E.164 形式の番号を受け付けます (内部で正規化されます)。

    `allowFrom` は DM 送信者のアクセス制御リストです。WhatsApp グループ JID または `@newsletter` チャンネル JID への明示的な送信は制限しません。

    マルチアカウントのオーバーライド: `channels.whatsapp.accounts.<id>.dmPolicy` (および `allowFrom`) は、そのアカウントに対してチャンネルレベルのデフォルトより優先されます。

    実行時動作の詳細:

    - ペアリングはチャンネル許可ストアに永続化され、設定済みの `allowFrom` とマージされます
    - スケジュール済み自動化と Heartbeat 受信者フォールバックは、明示的な配信先または設定済みの `allowFrom` を使用します。DM ペアリング承認は暗黙的な Cron または Heartbeat 受信者ではありません
    - 許可リストが設定されていない場合、リンク済みの自分の番号がデフォルトで許可されます
    - OpenClaw は送信 `fromMe` DM (リンク済みデバイスから自分自身へ送信するメッセージ) を自動ペアリングしません

  </Tab>

  <Tab title="グループポリシー + 許可リスト">
    グループアクセスには 2 つのレイヤーがあります。

    1. **グループメンバーシップ許可リスト** (`channels.whatsapp.groups`)
       - `groups` が省略されている場合、すべてのグループが対象になります
       - `groups` が存在する場合、グループ許可リストとして機能します (`"*"` を許可)

    2. **グループ送信者ポリシー** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: 送信者許可リストをバイパス
       - `allowlist`: 送信者が `groupAllowFrom` (または `*`) に一致する必要があります
       - `disabled`: すべてのグループ受信をブロック

    送信者許可リストのフォールバック:

    - `groupAllowFrom` が未設定の場合、実行時は利用可能であれば `allowFrom` にフォールバックします
    - 送信者許可リストはメンション/返信アクティベーションの前に評価されます

    注: `channels.whatsapp` ブロックがまったく存在しない場合、`channels.defaults.groupPolicy` が設定されていても、実行時のグループポリシーフォールバックは `allowlist` です (警告ログ付き)。

  </Tab>

  <Tab title="メンション + /activation">
    グループ返信にはデフォルトでメンションが必要です。

    メンション検出には次が含まれます。

    - ボット ID への明示的な WhatsApp メンション
    - 設定済みのメンション正規表現パターン (`agents.list[].groupChat.mentionPatterns`, フォールバック `messages.groupChat.mentionPatterns`)
    - 許可されたグループメッセージの受信ボイスノート文字起こし
    - 暗黙的なボットへの返信検出 (返信送信者がボット ID と一致)

    セキュリティ上の注意:

    - 引用/返信はメンションゲートを満たすだけで、送信者の認可は付与しません
    - `groupPolicy: "allowlist"` では、許可リスト外の送信者は、許可リスト内ユーザーのメッセージに返信しても引き続きブロックされます

    セッションレベルのアクティベーションコマンド:

    - `/activation mention`
    - `/activation always`

    `activation` はセッション状態を更新します (グローバル設定ではありません)。これは所有者でゲートされます。

  </Tab>
</Tabs>

## 個人番号とセルフチャットの動作

リンク済みの自分の番号が `allowFrom` にも存在する場合、WhatsApp のセルフチャット保護が有効になります。

- セルフチャットのターンでは既読通知をスキップ
- 自分自身に ping してしまうメンション JID 自動トリガー動作を無視
- `messages.responsePrefix` が未設定の場合、セルフチャット返信はデフォルトで `[{identity.name}]` または `[openclaw]` になります

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

    返信メタデータフィールドも、利用可能な場合は設定されます (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, 送信者 JID/E.164)。
    引用返信の対象がダウンロード可能なメディアの場合、OpenClaw は通常の受信メディアストアを通じてそれを保存し、
    `MediaPath`/`MediaType` として公開するため、
    エージェントは `<media:image>` だけを見るのではなく、
    参照された画像を検査できます。

  </Accordion>

  <Accordion title="メディアプレースホルダーと位置情報/連絡先の抽出">
    メディアのみの受信メッセージは、次のようなプレースホルダーで正規化されます。

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    許可されたグループボイスノートは、本文が `<media:audio>` のみの場合、
    メンションゲートの前に文字起こしされるため、ボイスノート内でボットへのメンションを言うと
    返信をトリガーできます。文字起こしにまだボットへのメンションが含まれていない場合、
    文字起こしは生のプレースホルダーではなく、保留中のグループ履歴に保持されます。

    位置情報本文は簡潔な座標テキストを使用します。位置情報のラベル/コメントと連絡先/vCard の詳細は、インラインのプロンプトテキストではなく、フェンス付きの信頼されないメタデータとしてレンダリングされます。

  </Accordion>

  <Accordion title="保留中のグループ履歴注入">
    グループでは、未処理のメッセージをバッファし、ボットが最終的にトリガーされたときにコンテキストとして注入できます。

    - デフォルトの上限: `50`
    - 設定: `channels.whatsapp.historyLimit`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効化

    挿入マーカー:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="既読通知">
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

    自分宛チャットのターンでは、グローバルに有効な場合でも既読通知をスキップします。

  </Accordion>
</AccordionGroup>

## 配信、分割、メディア

<AccordionGroup>
  <Accordion title="テキストの分割">
    - デフォルトの分割上限: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` モードは段落境界（空行）を優先し、その後、長さに対して安全な分割にフォールバックします

  </Accordion>

  <Accordion title="送信メディアの動作">
    - 画像、動画、音声（PTT ボイスメモ）、ドキュメントのペイロードをサポートします
    - 音声メディアは Baileys の `audio` ペイロードで `ptt: true` として送信されるため、WhatsApp クライアントではプッシュトゥトークのボイスメモとして表示されます
    - 返信ペイロードは `audioAsVoice` を保持します。WhatsApp 向けの TTS ボイスメモ出力は、プロバイダーが MP3 または WebM を返す場合でも、この PTT パスに留まります
    - ネイティブの Ogg/Opus 音声は、ボイスメモ互換性のために `audio/ogg; codecs=opus` として送信されます
    - Microsoft Edge TTS の MP3/WebM 出力を含む Ogg 以外の音声は、PTT 配信前に `ffmpeg` で 48 kHz モノラル Ogg/Opus にトランスコードされます
    - `/tts latest` は最新のアシスタント返信を 1 つのボイスメモとして送信し、同じ返信の重複送信を抑制します。`/tts chat on|off|default` は現在の WhatsApp チャットの自動 TTS を制御します
    - 動画送信時の `gifPlayback: true` により、アニメーション GIF 再生をサポートします
    - 複数メディアの返信ペイロードを送信する場合、キャプションは最初のメディア項目に適用されます。ただし PTT ボイスメモでは、WhatsApp クライアントがボイスメモのキャプションを一貫して表示しないため、音声を先に送信し、表示テキストを別に送信します
    - メディアソースには HTTP(S)、`file://`、またはローカルパスを使用できます

  </Accordion>

  <Accordion title="メディアサイズ上限とフォールバック動作">
    - 受信メディア保存上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - 送信メディア送信上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - アカウントごとの上書きには `channels.whatsapp.accounts.<accountId>.mediaMaxMb` を使用します
    - 画像は上限に収まるよう自動最適化（リサイズ/品質スイープ）されます
    - メディア送信失敗時、最初の項目のフォールバックは応答を黙って破棄する代わりにテキスト警告を送信します

  </Accordion>
</AccordionGroup>

## 返信引用

WhatsApp はネイティブの返信引用をサポートしており、送信返信で受信メッセージを視覚的に引用できます。`channels.whatsapp.replyToMode` で制御します。

| 値          | 動作                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | 引用しない。通常のメッセージとして送信します                          |
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

`channels.whatsapp.reactionLevel` は、エージェントが WhatsApp で絵文字リアクションをどの程度広く使用するかを制御します。

| レベル        | Ack リアクション | エージェント開始のリアクション | 説明                                             |
| ------------- | ---------------- | ------------------------------ | ------------------------------------------------ |
| `"off"`       | いいえ           | いいえ                         | リアクションなし                                 |
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

WhatsApp は、`channels.whatsapp.ackReaction` により、受信時の即時 ack リアクションをサポートします。
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

- 受信が受け入れられた直後に送信されます（返信前）
- 失敗はログに記録されますが、通常の返信配信はブロックしません
- グループモード `mentions` はメンションでトリガーされたターンにリアクションします。グループ有効化 `always` はこのチェックのバイパスとして機能します
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
    - `~/.openclaw/credentials/` にあるレガシーのデフォルト認証は、デフォルトアカウントのフローで引き続き認識/移行されます

  </Accordion>

  <Accordion title="ログアウト動作">
    `openclaw channels logout --channel whatsapp [--account <id>]` は、そのアカウントの WhatsApp 認証状態を消去します。

    Gateway に到達できる場合、ログアウトはまず選択したアカウントのライブ WhatsApp リスナーを停止し、リンク済みセッションが次の再起動までメッセージを受信し続けないようにします。`openclaw channels remove --channel whatsapp` も、アカウント設定を無効化または削除する前にライブリスナーを停止します。

    レガシー認証ディレクトリでは、Baileys 認証ファイルが削除される一方で `oauth.json` は保持されます。

  </Accordion>
</AccordionGroup>

## ツール、アクション、設定書き込み

- エージェントツールのサポートには WhatsApp リアクションアクション（`react`）が含まれます。
- アクションゲート:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- チャネル開始の設定書き込みはデフォルトで有効です（`channels.whatsapp.configWrites=false` で無効化）。

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

    静かなアカウントは、通常のメッセージタイムアウトを過ぎても接続を維持できます。ウォッチドッグは、WhatsApp Web トランスポートのアクティビティが停止した、ソケットが閉じた、またはアプリケーションレベルのアクティビティがより長い安全ウィンドウを超えて沈黙した場合に再起動します。

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

    `~/.openclaw/logs/whatsapp-health.log` に `Gateway inactive` とある一方で、`openclaw gateway status` と `openclaw channels status --probe` が Gateway と WhatsApp は正常と示す場合は、`openclaw doctor` を実行します。Linux では、doctor が引き続き `~/.openclaw/bin/ensure-whatsapp.sh` を呼び出すレガシーの crontab エントリについて警告します。cron には systemd のユーザーバス環境がない場合があり、その古いスクリプトが Gateway の健全性を誤報告する原因になるため、`crontab -e` で古いエントリを削除します。

    必要に応じて、`channels login` で再リンクします。

  </Accordion>

  <Accordion title="プロキシ配下で QR ログインがタイムアウトする">
    症状: `openclaw channels login --channel whatsapp` が、使用可能な QR コードを表示する前に `status=408 Request Time-out` または TLS ソケット切断で失敗します。

    WhatsApp Web ログインは、Gateway ホストの標準プロキシ環境（`HTTPS_PROXY`、`HTTP_PROXY`、小文字のバリアント、`NO_PROXY`）を使用します。Gateway プロセスがプロキシ環境を継承していること、および `NO_PROXY` が `mmg.whatsapp.net` に一致していないことを確認します。

  </Accordion>

  <Accordion title="送信時にアクティブなリスナーがない">
    対象アカウントにアクティブな Gateway リスナーが存在しない場合、送信はすぐに失敗します。

    Gateway が実行中で、アカウントがリンクされていることを確認します。

  </Accordion>

  <Accordion title="返信がトランスクリプトには表示されるが WhatsApp には表示されない">
    トランスクリプト行には、エージェントが生成した内容が記録されます。WhatsApp 配信は別途確認されます。OpenClaw は、少なくとも 1 つの表示テキストまたはメディア送信について Baileys が送信メッセージ ID を返した後でのみ、自動返信を送信済みとして扱います。

    Ack リアクションは独立した返信前の受領です。リアクションが成功しても、その後のテキストまたはメディア返信が WhatsApp に受け入れられたことの証明にはなりません。

    Gateway ログで `auto-reply delivery failed` または `auto-reply was not accepted by WhatsApp provider` を確認します。

  </Accordion>

  <Accordion title="グループメッセージが予期せず無視される">
    次の順序で確認します。

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 許可リストエントリ
    - メンションゲート（`requireMention` + メンションパターン）
    - `openclaw.json`（JSON5）内の重複キー: 後のエントリが前のエントリを上書きするため、スコープごとに `groupPolicy` は 1 つだけにしてください

  </Accordion>

  <Accordion title="Bun ランタイム警告">
    WhatsApp Gateway ランタイムは Node を使用する必要があります。Bun は、安定した WhatsApp/Telegram Gateway 運用に非互換としてフラグ付けされます。
  </Accordion>
</AccordionGroup>

## システムプロンプト

WhatsApp は、`groups` と `direct` マップを通じて、グループおよびダイレクトチャット向けの Telegram スタイルのシステムプロンプトをサポートします。

グループメッセージの解決階層:

有効な `groups` マップが最初に決定されます。アカウントが独自の `groups` を定義している場合、それはルートの `groups` マップを完全に置き換えます（ディープマージなし）。その後、プロンプト検索は結果として得られた単一のマップ上で実行されます。

1. **グループ固有のシステムプロンプト**（`groups["<groupId>"].systemPrompt`）: 特定のグループエントリがマップ内に存在し、かつその `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、システムプロンプトは適用されません。
2. **グループワイルドカードシステムプロンプト**（`groups["*"].systemPrompt`）: 特定のグループエントリがマップにまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

ダイレクトメッセージの解決階層:

有効な `direct` マップが最初に決定されます。アカウントが独自の `direct` を定義している場合、それはルートの `direct` マップを完全に置き換えます（ディープマージなし）。その後、プロンプト検索は結果として得られた単一のマップ上で実行されます。

1. **Direct 固有のシステムプロンプト** (`direct["<peerId>"].systemPrompt`): マップ内に特定のピアエントリが存在し、**かつ**その `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列 (`""`) の場合、ワイルドカードは抑制され、システムプロンプトは適用されません。
2. **Direct ワイルドカードシステムプロンプト** (`direct["*"].systemPrompt`): 特定のピアエントリがマップにまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

<Note>
`dms` は、DM ごとの軽量な履歴オーバーライド用バケット (`dms.<id>.historyLimit`) のままです。プロンプトのオーバーライドは `direct` 配下に置きます。
</Note>

**Telegram のマルチアカウント動作との違い:** Telegram では、マルチアカウント設定内のすべてのアカウントについて、ルートの `groups` が意図的に抑制されます。自分の `groups` を定義していないアカウントでも同様です。これは、ボットが所属していないグループのグループメッセージを受信しないようにするためです。WhatsApp ではこの保護は適用されません。ルートの `groups` とルートの `direct` は、構成されているアカウント数に関係なく、アカウントレベルのオーバーライドを定義していないアカウントに常に継承されます。マルチアカウントの WhatsApp 設定で、アカウントごとのグループプロンプトまたは Direct プロンプトを使いたい場合は、ルートレベルのデフォルトに依存せず、各アカウント配下に完全なマップを明示的に定義してください。

重要な動作:

- `channels.whatsapp.groups` は、グループごとの構成マップであると同時に、チャットレベルのグループ許可リストでもあります。ルートスコープまたはアカウントスコープのどちらでも、`groups["*"]` はそのスコープで「すべてのグループが許可される」ことを意味します。
- ワイルドカードグループの `systemPrompt` は、そのスコープですでにすべてのグループを許可したい場合にのみ追加してください。対象にできるグループ ID を固定セットのみにしたい場合は、プロンプトのデフォルトに `groups["*"]` を使わないでください。代わりに、明示的に許可リストに入れた各グループエントリでプロンプトを繰り返し指定します。
- グループの受け入れと送信者の認可は別々のチェックです。`groups["*"]` は、グループ処理に到達できるグループの集合を広げますが、それだけでそれらのグループ内のすべての送信者を認可するわけではありません。送信者アクセスは引き続き `channels.whatsapp.groupPolicy` と `channels.whatsapp.groupAllowFrom` によって別個に制御されます。
- `channels.whatsapp.direct` には、DM に対する同じ副作用はありません。`direct["*"]` は、DM が `dmPolicy` と `allowFrom`、またはペアリングストアのルールによってすでに許可された後に、デフォルトの Direct チャット構成を提供するだけです。

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

## 構成リファレンスの参照先

主要リファレンス:

- [構成リファレンス - WhatsApp](/ja-JP/gateway/config-channels#whatsapp)

重要な WhatsApp フィールド:

- アクセス: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- 配信: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- マルチアカウント: `accounts.<id>.enabled`, `accounts.<id>.authDir`, アカウントレベルのオーバーライド
- 運用: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- セッション動作: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- プロンプト: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [セキュリティ](/ja-JP/gateway/security)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
