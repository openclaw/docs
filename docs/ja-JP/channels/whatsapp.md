---
read_when:
    - WhatsApp/Web チャネルの動作または受信トレイのルーティングに取り組む
summary: WhatsApp チャネルのサポート、アクセス制御、配信動作、運用
title: WhatsApp
x-i18n:
    generated_at: "2026-07-11T21:59:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f416d2b7a75e9c4798ded34a1ec5d9d7f49ab99a56977f1383347936fe47af55
    source_path: channels/whatsapp.md
    workflow: 16
---

ステータス: WhatsApp Web (Baileys) 経由で本番環境に対応済み。Gateway がリンク済みセッションを管理し、個別の Twilio WhatsApp チャネルはありません。

## インストール

`openclaw onboard` と `openclaw channels add --channel whatsapp` では、初めて選択したときに Plugin のインストールを求められます。Plugin がない場合、`openclaw channels login --channel whatsapp` でも同じインストールフローが提示されます。開発用チェックアウトではローカルの Plugin パスを使用します。安定版/ベータ版では、まず ClawHub から `@openclaw/whatsapp` をインストールし、失敗した場合は npm にフォールバックします。WhatsApp ランタイムは OpenClaw のコア npm パッケージ外で提供されるため、ランタイム依存関係は外部 Plugin 側に保持されます。手動インストール:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

素の npm パッケージ (`@openclaw/whatsapp`) はレジストリへのフォールバックにのみ使用してください。再現可能なインストールが必要な場合に限り、正確なバージョンを固定してください。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    不明な送信者に対するデフォルトの DM ポリシーはペアリングです。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断と修復手順。
  </Card>
  <Card title="Gateway の設定" icon="settings" href="/ja-JP/gateway/configuration">
    チャネル設定の完全なパターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="アクセスポリシーを設定する">

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

    ログインは QR のみです。リモートまたはヘッドレスホストでは、ログインを開始する前に、表示中の QR を確実に電話へ届ける手段を用意してください。ターミナルに表示した QR、スクリーンショット、チャットの添付ファイルは、転送中に期限切れになることがあります。

    特定のアカウントの場合:

```bash
openclaw channels login --channel whatsapp --account work
```

    ログイン前に既存またはカスタムの認証ディレクトリを関連付けるには:

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

  <Step title="最初のペアリング要求を承認する (ペアリングモード)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    ペアリング要求は 1 時間後に期限切れになります。保留中の要求はアカウントごとに最大 3 件です。

  </Step>
</Steps>

<Note>
別の WhatsApp 番号を使用することを推奨します (セットアップとメタデータはこの構成に最適化されています) が、個人番号/セルフチャット構成も完全にサポートされています。
</Note>

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用番号 (推奨)">
    - OpenClaw 専用の WhatsApp ID
    - より明確な DM 許可リストとルーティング境界
    - セルフチャットによる混乱が起きる可能性を低減

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

  <Accordion title="個人番号へのフォールバック">
    オンボーディングは個人番号モードをサポートし、セルフチャット向けの基準設定を書き込みます。`dmPolicy: "allowlist"`、自分の番号を含む `allowFrom`、`selfChatMode: true` です。ランタイムのセルフチャット保護では、リンク済みの自分の番号と `allowFrom` が使用されます。
  </Accordion>
</AccordionGroup>

## ランタイムモデル

- Gateway が WhatsApp ソケットと再接続ループを管理します。
- ウォッチドッグは 2 つのシグナルを個別に追跡します。生の WhatsApp Web トランスポートアクティビティと、アプリケーションメッセージのアクティビティです。接続中で静かなセッションは、最近メッセージが届いていないという理由だけでは再起動されません。一定の内部時間枠 (ユーザーによる設定不可) にわたってトランスポートフレームが届かない場合、または通常のメッセージタイムアウトの 4 倍を超えてアプリケーションメッセージが届かない場合にのみ、再接続を強制します。最近アクティブだったセッションの再接続直後は、最初の時間枠に 4 倍の時間枠ではなく、より短い通常のメッセージタイムアウトを使用します。OpenClaw は、その再接続の早い段階で Baileys が配信するオフラインメッセージに自動返信できます。その範囲は受信メッセージ ID の重複排除期間によって制限されます。初回起動時は、短い古い履歴のガードが維持されます。
- Baileys ソケットのタイミングは `web.whatsapp.*` で明示的に設定されます。`keepAliveIntervalMs` (アプリケーションの ping 間隔)、`connectTimeoutMs` (接続開始時のハンドシェイクタイムアウト)、`defaultQueryTimeoutMs` (Baileys のクエリ待機時間、および OpenClaw の送信/プレゼンスと受信開封確認のタイムアウト) です。
- 送信には、対象アカウントでアクティブな WhatsApp リスナーが必要です。存在しない場合は即座に失敗します。
- グループ送信では、`@+<digits>` および `@<digits>` トークン (テキストとメディアのキャプション内) が現在の参加者メタデータと一致する場合、LID ベースのグループを含め、ネイティブのメンションメタデータを付加します。
- ステータスチャットとブロードキャストチャット (`@status`、`@broadcast`) は無視されます。
- ダイレクトチャットでは DM セッションルールを使用します (`session.dmScope`。デフォルトの `main` では DM をエージェントのメインセッションに統合します)。グループセッションは JID ごとに分離されます (`agent:<agentId>:whatsapp:group:<jid>`)。
- WhatsApp のチャネル/ニュースレターは、ネイティブの `@newsletter` JID を使用して明示的な送信先にできます。この場合、DM のセマンティクスではなくチャネルセッションのメタデータ (`agent:<agentId>:whatsapp:channel:<jid>`) を使用します。
- WhatsApp Web トランスポートは、Gateway ホスト上の標準プロキシ環境変数 (`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY`、および小文字のバリアント) に従います。チャネル単位の設定よりも、ホストレベルのプロキシ設定を推奨します。
- `messages.removeAckAfterReply` が有効な場合、OpenClaw は表示可能な返信が配信されると確認リアクションを消去します。

## MeowCaller で現在の要求者に通話する (試験的)

この Plugin は、WhatsApp から開始されたエージェントターンで `whatsapp_call` を公開できます。[MeowCaller](https://github.com/purpshell/meowcaller) を使用して、現在の承認済み要求者に WhatsApp 音声通話を発信し、応答後に OpenClaw の TTS メッセージを再生します。このツールには宛先番号パラメーターがないため、プロンプトから通話先を変更することはできません。デフォルトでは無効です。

<Warning>
MeowCaller は試験的で、タグ付きリリースがなく、個別にペアリングされた whatsmeow リンク済みデバイスセッションを使用します。Plugin の Baileys 認証情報は再利用できません。ペアリングすると、同じ WhatsApp アカウントに別のリンク済みデバイスが追加されます。OpenClaw が使用する ID でスキャンしてください。個人番号/セルフチャットモードでは自分自身に通話できません。個人番号に通話するには、OpenClaw 専用番号を使用してください。
</Warning>

<Steps>
  <Step title="試験的な通話を有効にする">

    WhatsApp チャネル設定に `actions.calls: true` を追加し、Gateway を再起動します。

```json
{
  "channels": {
    "whatsapp": {
      "actions": {
        "calls": true
      }
    }
  }
}
```

    未指定または `false` の場合、OpenClaw は `whatsapp_call` ツールを公開しません。

  </Step>

  <Step title="レビュー済みの MeowCaller CLI をインストールする">

    アダプターは、Gateway ホストの `PATH` に `meowcaller` 実行ファイルがあることを前提とします。[MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) がマージされるまでは、レビュー済みのブランチをビルドしてください。

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    `$HOME/.local/bin` が Gateway サービスの `PATH` に含まれていることを確認してください。このリビジョンには、明示的な `pair` コマンドと送信専用の `notify` コマンドがあります。`notify` はマイク、スピーカー、ビデオデバイス、診断キャプチャを一切開きません。アップストリームのサンプル CLI にある `play` コマンドで代用しないでください。

  </Step>

  <Step title="MeowCaller のリンク済みデバイスをペアリングする">

    WhatsApp エージェントに通話セットアップの確認を依頼してください (`whatsapp_call` のステータスアクションは、アカウント固有の状態ディレクトリとペアリングコマンドを報告します)。デフォルトアカウントの場合:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    これを対話形式で実行し、**WhatsApp > Linked devices** から QR をスキャンして、`MeowCaller linked device ready` が表示されるまで待ちます。`wa-voip.db` は非公開に保ってください。これは MeowCaller のセッションです。デフォルト以外のアカウントでは、ステータスアクションから個別の保存先パスが提供されます。Windows では、その PowerShell コマンドを実行してください。

  </Step>

  <Step title="TTS を設定し、WhatsApp から通話する">

    電話通話に対応する [TTS プロバイダー](/ja-JP/tools/tts) を設定して Gateway を再起動し、`Call me and say the build finished.` のような要求を送信します。ツールは信頼済みの受信コンテキストから送信者を特定し、一時的な非公開 WAV ファイルを合成し、制限された通話時間枠で MeowCaller を実行して、その後音声ファイルを削除します。OpenClaw はアカウントの保存先を明示的に渡し、応答/再生/切断後に終了ステータスが 0 になるまで待機します。タイムアウトまたは 0 以外の終了ステータスは、ツール呼び出しの失敗として扱われます。

  </Step>
</Steps>

制限: 1 対 1 の発信音声通話のみ、任意の宛先番号は不可、チャット接続との認証共有は不可、個人番号/セルフチャットモードからの自己通話は不可、合成音声は最大 60 秒、MeowCaller の応答/再生/切断完了以外に端末側で聞こえたことを確認する受領通知はなし、OpenClaw は 115～175 秒の制限時間枠 (MeowCaller の接続、応答、再生、終了フェーズを含む) の経過後に補助プロセスを停止します。

## 承認プロンプト

WhatsApp は、実行および Plugin の承認プロンプトを `👍`/`👎` リアクションとして表示できます。これは最上位の承認転送設定で制御されます。

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec` と `approvals.plugin` は独立しています。WhatsApp をチャネルとして有効にしても、トランスポートがリンクされるだけです。該当する承認種別が有効化され、そこへルーティングされない限り、何も送信されません。セッションモードでは、WhatsApp から発生した承認に対してのみネイティブの絵文字承認を配信します。ターゲットモードでは、明示的なターゲットに共有転送パイプラインを使用し、承認者向けの個別 DM 配信は作成しません。

WhatsApp の承認リアクションでは、`allowFrom` (または `"*"`) に承認者を明示的に指定する必要があります。`defaultTo` は通常のデフォルトメッセージ送信先を設定するものであり、承認者リストではありません。手動の `/approve` コマンドも、承認を解決する前に通常の WhatsApp 送信者認可パスを通過します。

## Plugin フックとプライバシー

受信 WhatsApp メッセージには、個人的な内容、電話番号、グループ識別子、送信者名、セッション相関フィールドが含まれる場合があります。明示的にオプトインしない限り、WhatsApp は受信した `message_received` フックのペイロードを Plugin にブロードキャストしません。

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

`channels.whatsapp.accounts.<id>.pluginHooks.messageReceived` で、オプトインの範囲を 1 つのアカウントに限定できます。WhatsApp の受信内容と識別子を信頼して渡せる Plugin に対してのみ有効にしてください。

## アクセス制御と有効化

<Tabs>
  <Tab title="DM ポリシー">
    `channels.whatsapp.dmPolicy`:

    | 値 | 動作 |
    | --- | --- |
    | `pairing` (デフォルト) | 不明な送信者がペアリングを要求し、所有者が承認する |
    | `allowlist` | `allowFrom` に含まれる送信者のみ許可する |
    | `open` | `allowFrom` に `"*"` を含める必要がある |
    | `disabled` | すべての DM をブロックする |

    `allowFrom` には E.164 形式の番号を指定できます (内部で正規化されます)。これは DM 送信者専用のアクセス制御リストです。グループ JID や `@newsletter` チャネル JID への明示的な送信を制限するものではありません。

    複数アカウントでの上書き: `channels.whatsapp.accounts.<id>.dmPolicy` (および `.allowFrom`) は、そのアカウントに対してチャネルレベルのデフォルトより優先されます。

    ランタイムに関する注意事項:

    - ペアリングはチャンネルの許可ストアに永続化され、設定済みの `allowFrom` とマージされます
    - スケジュールされた自動化と Heartbeat の受信者フォールバックでは、明示的な配信先または設定済みの `allowFrom` を使用します。DM ペアリングの承認先が暗黙的に Cron/Heartbeat の受信者になることはありません
    - 許可リストが設定されていない場合、リンク済みの自己番号がデフォルトで許可されます
    - OpenClaw は、送信方向の `fromMe` DM（リンク済みデバイスから自分自身に送信したメッセージ）を自動ペアリングしません

  </Tab>

  <Tab title="グループポリシーと許可リスト">
    グループアクセスには 2 つのレイヤーがあります。

    1. **グループメンバーシップ許可リスト**（`channels.whatsapp.groups`）：`groups` を省略すると、すべてのグループが対象になります。指定した場合はグループ許可リストとして機能します（`"*"` はすべてを許可します）。
    2. **グループ送信者ポリシー**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）：`open` は送信者許可リストを迂回し、`allowlist` は `groupAllowFrom`（または `*`）との一致を必須とし、`disabled` はグループからのすべての受信をブロックします。

    `groupAllowFrom` が未設定の場合、`allowFrom` にエントリがあれば、送信者チェックはそれにフォールバックします。送信者許可リストは、メンション／返信による有効化より前に評価されます。

    `channels.whatsapp` ブロック自体が存在しない場合、`channels.defaults.groupPolicy` が別の値に設定されていても、ランタイムは `groupPolicy: "allowlist"` にフォールバックします（警告ログが出力されます）。

    <Note>
    グループメンバーシップの解決には、単一アカウント向けの安全策があります。WhatsApp アカウントが 1 つだけ設定され、その `accounts.<id>.groups` が明示的な空オブジェクト（`{}`）である場合、それは「未設定」として扱われ、すべてのグループを暗黙的にブロックする代わりに、ルートの `channels.whatsapp.groups` マップへフォールバックします。2 つ以上のアカウントが設定されている場合、明示的に空のアカウントマップは空のままで、フォールバックしません。これにより、他のアカウントに影響を与えずに、1 つのアカウントだけですべてのグループを意図的に無効化できます。
    </Note>

  </Tab>

  <Tab title="メンションと /activation">
    グループへの返信には、デフォルトでメンションが必要です。メンション検出には以下が含まれます。

    - ボットのアイデンティティに対する明示的な WhatsApp メンション
    - 設定済みのメンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - 許可されたグループメッセージに含まれる受信ボイスメモの文字起こし
    - 暗黙的なボット宛て返信の検出（返信先の送信者がボットのアイデンティティと一致）

    セキュリティ：引用／返信はメンション要件を満たすだけであり、送信者の認可を付与するものでは**ありません**。`groupPolicy: "allowlist"` の場合、許可リストに含まれない送信者は、許可リストに含まれるユーザーのメッセージへ返信してもブロックされたままです。

    セッション単位の有効化コマンド：`/activation mention` または `/activation always`。これはセッション状態（グローバル設定ではありません）を更新し、所有者のみが使用できます。

  </Tab>
</Tabs>

## 設定済みの ACP バインディング

WhatsApp は、トップレベルの `bindings[]` による永続的な ACP バインディングをサポートします。

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

ダイレクトチャットは E.164 番号と照合され、グループは WhatsApp グループ JID と照合されます。グループ許可リスト、送信者ポリシー、メンション／有効化のゲート処理は、OpenClaw がバインドされた ACP セッションの存在を保証する前に実行されます。一致したバインディングがそのルートを所有します。ブロードキャストグループがそのターンを通常の WhatsApp セッションへ展開することはありません。

## 個人番号と自己チャットの動作

リンク済みの自己番号が `allowFrom` にも含まれている場合、自己チャットの安全策が有効になります。自己チャットのターンでは既読通知をスキップし、自分自身を呼び出してしまうメンション JID の自動トリガー動作を無視し、`messages.responsePrefix` が未設定の場合は返信のデフォルトを `[{identity.name}]`（または `[openclaw]`）にします。

## メッセージの正規化とコンテキスト

<AccordionGroup>
  <Accordion title="受信エンベロープと返信コンテキスト">
    受信メッセージは共有受信エンベロープでラップされます。引用返信では、次の形式でコンテキストが追加されます。

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    利用可能な場合、返信メタデータ（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、送信者の JID/E.164）が設定されます。引用対象がダウンロード可能なメディアの場合、OpenClaw は通常の受信メディアストアを通じて保存し、`MediaPath`／`MediaType` を公開します。これにより、エージェントは `<media:image>` だけを見るのではなく、メディアを直接調査できます。

  </Accordion>

  <Accordion title="メディアプレースホルダーと位置情報／連絡先の抽出">
    メディアのみのメッセージは、次のプレースホルダーに正規化されます：`<media:image>`、`<media:video>`、`<media:audio>`、`<media:document>`、`<media:sticker>`。

    本文が `<media:audio>` のみの場合、許可されたグループボイスメモはメンション判定の前に文字起こしされるため、ボイスメモ内でボットへのメンションを発話すると返信をトリガーできます。文字起こしにもボットへのメンションが含まれない場合、生のプレースホルダーではなく、保留中のグループ履歴に残ります。

    位置情報の本文は簡潔な座標テキストとして表示されます。位置情報のラベル／コメントと連絡先／vCard の詳細は、インラインのプロンプトテキストではなく、フェンスで囲まれた信頼されていないメタデータとして表示されます。

  </Accordion>

  <Accordion title="保留中のグループ履歴の挿入">
    未処理のグループメッセージはバッファされ、最終的にボットがトリガーされたときにコンテキストとして挿入されます。

    - デフォルト上限：`50`
    - 設定：`channels.whatsapp.historyLimit`、フォールバックは `messages.groupChat.historyLimit`
    - `0` で無効化

    挿入マーカー：`[Chat messages since your last reply - for context]` と `[Current message - respond to this]`。

  </Accordion>

  <Accordion title="既読通知">
    受理された受信メッセージでは、デフォルトで有効です。グローバルに無効化するには次のようにします。

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    アカウント単位の上書き：`channels.whatsapp.accounts.<id>.sendReadReceipts`。グローバルに有効な場合でも、自己チャットのターンでは既読通知をスキップします。

  </Accordion>
</AccordionGroup>

## 配信、分割、メディア

<AccordionGroup>
  <Accordion title="テキストの分割">
    - デフォルトの分割上限：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`。`newline` は段落境界（空行）を優先し、その後、長さの上限を守る分割へフォールバックします

  </Accordion>

  <Accordion title="送信メディアの動作">
    - 画像、動画、音声（PTT ボイスメモ）、ドキュメントのペイロードをサポートします
    - 音声は `ptt: true` を指定した Baileys の `audio` ペイロードとして送信され、プッシュ・トゥ・トークのボイスメモとして表示されます。返信ペイロードでは `audioAsVoice` が保持されるため、プロバイダーの元の形式に関係なく、TTS ボイスメモの出力はこの経路を使用し続けます
    - ネイティブの Ogg/Opus 音声は `audio/ogg; codecs=opus` として送信されます。それ以外の形式（Microsoft Edge TTS の MP3/WebM 出力を含む）は、PTT 配信前に `ffmpeg` で 48 kHz モノラルの Ogg/Opus にトランスコードされます
    - `/tts latest` は最新のアシスタント返信を 1 つのボイスメモとして送信し、同じ返信の重複送信を抑制します。`/tts chat on|off|default` は現在のチャットの自動 TTS を制御します
    - 動画送信で `gifPlayback: true` を指定すると、アニメーション GIF の再生が有効になります
    - `forceDocument`／`asDocument` は、WhatsApp のメディア圧縮を避けるため、送信する画像、GIF、動画を Baileys のドキュメントペイロード経由にし、解決済みのファイル名と MIME タイプを保持します
    - 複数メディアの返信では、キャプションは最初のメディア項目に適用されます。ただし PTT ボイスメモは例外です。音声はキャプションなしで先に送信され、その後キャプションが別のテキストメッセージとして送信されます（WhatsApp クライアントではボイスメモのキャプション表示が一貫しないためです）
    - メディアソースには HTTP(S)、`file://`、またはローカルパスを使用できます

  </Accordion>

  <Accordion title="メディアサイズ上限とフォールバック動作">
    - 受信時の保存上限と送信時の上限：`channels.whatsapp.mediaMaxMb`（デフォルトは `50`）
    - アカウント単位の上書き：`channels.whatsapp.accounts.<id>.mediaMaxMb`
    - `forceDocument`／`asDocument` でドキュメント配信を要求しない限り、画像は上限内に収まるよう自動的に最適化（サイズ変更／品質調整）されます
    - メディア送信に失敗した場合、最初の項目のフォールバックとして、応答を暗黙的に破棄する代わりにテキストの警告を送信します

  </Accordion>
</AccordionGroup>

## 返信の引用

`channels.whatsapp.replyToMode` はネイティブの返信引用を制御します（送信返信で受信メッセージが視覚的に引用されます）。

| 値                | 動作                                                   |
| ----------------- | ------------------------------------------------------ |
| `"off"`（デフォルト） | 引用せず、通常のメッセージとして送信します             |
| `"first"`         | 最初の送信返信チャンクだけを引用します                 |
| `"all"`           | すべての送信返信チャンクを引用します                   |
| `"batched"`       | キューに入ったバッチ返信を引用し、即時返信は引用しません |

アカウント単位の上書き：`channels.whatsapp.accounts.<id>.replyToMode`。

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## リアクションレベル

`channels.whatsapp.reactionLevel` は、エージェントが絵文字リアクションを使用する範囲を制御します。

| レベル                  | 確認リアクション | エージェントが開始するリアクション |
| ----------------------- | ---------------- | ---------------------------------- |
| `"off"`                 | なし             | なし                               |
| `"ack"`                 | あり             | なし                               |
| `"minimal"`（デフォルト） | あり             | あり、控えめに使用                 |
| `"extensive"`           | あり             | あり、積極的な使用を推奨           |

アカウント単位の上書き：`channels.whatsapp.accounts.<id>.reactionLevel`。

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## 確認リアクション

`channels.whatsapp.ackReaction` は受信時に即座にリアクションを送信します。これは `reactionLevel` によって制御されます（`"off"` の場合は抑制されます）。

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

注：受信が受理された直後（返信前）に送信されます。`ackReaction` が存在しても `emoji` がない場合、WhatsApp はルーティング先エージェントのアイデンティティ絵文字を使用し、なければ「👀」にフォールバックします（確認リアクションを無効にするには `ackReaction` を省略するか、`emoji: ""` を設定します）。失敗はログに記録されますが、返信の配信はブロックされません。グループモード `mentions` はメンションでトリガーされたターンにのみリアクションしますが、グループ有効化の `always` はこのチェックを迂回します。WhatsApp では `channels.whatsapp.ackReaction` のみが使用されます（従来の `messages.ackReaction` はここには適用されません）。

## ライフサイクル状態リアクション

`messages.statusReactions.enabled: true` を設定すると、WhatsApp はターン中に静的な受信絵文字を残す代わりに確認リアクションを置き換え、キュー待ち、思考中、ツール実行、Compaction、完了、エラーなどの状態を順に表示できます。

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

注：`channels.whatsapp.ackReaction` は引き続きダイレクトメッセージとグループでの適用可否を制御します。キュー待ち状態では通常の確認リアクションと同じ実効絵文字が使用されます。WhatsApp ではメッセージごとにボットのリアクション枠が 1 つしかないため、ライフサイクル更新は現在のリアクションをその場で置き換えます。`messages.removeAckAfterReply: true` を設定すると、設定された完了／エラーの保持時間後に最終状態リアクションが消去されます。ツール絵文字のカテゴリには `tool`、`coding`、`web`、`deploy`、`build`、`concierge` が含まれます。

## 複数アカウントと認証情報

<AccordionGroup>
  <Accordion title="アカウントの選択とデフォルト">
    アカウント ID は `channels.whatsapp.accounts` から取得されます。デフォルトのアカウント選択は、`default` が存在する場合はそれを使用し、存在しない場合は設定済みアカウント ID のうちアルファベット順で最初のものを使用します。アカウント ID は検索用に内部で正規化されます。
  </Accordion>

  <Accordion title="認証情報のパスとレガシー互換性">
    - 現在の認証パス: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（バックアップ: `creds.json.bak`）
    - `~/.openclaw/credentials/` 内のレガシーなデフォルト認証は、デフォルトアカウントのフローで引き続き認識され、移行されます

  </Accordion>

  <Accordion title="ログアウト時の動作">
    `openclaw channels logout --channel whatsapp [--account <id>]` は、そのアカウントの WhatsApp 認証状態を消去します。Gateway に到達できる場合、ログアウトはまずそのアカウントの稼働中のリスナーを停止するため、リンク済みセッションは次回の再起動を待たずにメッセージの受信を停止します。`openclaw channels remove --channel whatsapp` も、アカウント設定を無効化または削除する前に稼働中のリスナーを停止します。

    レガシー認証ディレクトリでは、Baileys の認証ファイルが削除されても `oauth.json` は保持されます。

  </Accordion>
</AccordionGroup>

## ツール、アクション、設定の書き込み

- エージェントツールでは、WhatsApp のリアクションアクション（`react`）がサポートされています。
- アクションゲート: `channels.whatsapp.actions.reactions`、`channels.whatsapp.actions.polls`（既存のアクションのデフォルトは `true`）、`channels.whatsapp.actions.calls`（デフォルトは `false`、上記の MeowCaller を参照）。
- チャンネルから開始される設定の書き込みはデフォルトで有効です。無効にするには `channels.whatsapp.configWrites: false` を指定します。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="リンクされていない（QR が必要）">
    症状: チャンネルのステータスでリンクされていないと報告されます。

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="リンク済みだが切断される／再接続ループ">
    症状: リンク済みアカウントで、切断または再接続試行が繰り返されます。

    通信量の少ないアカウントは、通常のメッセージタイムアウトを超えても接続を維持できます。ウォッチドッグが再起動するのは、WhatsApp Web のトランスポートアクティビティが停止した場合、ソケットが閉じた場合、またはアプリケーションレベルのアクティビティがより長い安全時間枠を超えて停止した場合のみです（上記のランタイムモデルを参照）。

    ログに `status=408 Request Time-out Connection was lost` が繰り返し表示される場合は、`web.whatsapp` 配下で Baileys のソケットタイミングを調整します。まず、`keepAliveIntervalMs` をネットワークのアイドルタイムアウトより短くし、低速またはパケット損失のあるリンクでは `connectTimeoutMs` を増やします。

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

    修正手順:

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    ホストの接続性とタイミングを修正してもループが続く場合は、アカウントの認証ディレクトリをバックアップしてから再リンクします。

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    `~/.openclaw/logs/whatsapp-health.log` に `Gateway inactive` と記録されている一方で、`openclaw gateway status` と `openclaw channels status --probe` の両方が正常と表示される場合は、`openclaw doctor` を実行します。Linux では、廃止された `~/.openclaw/bin/ensure-whatsapp.sh` スクリプトを呼び出すレガシーな crontab エントリについて doctor が警告します。`crontab -e` でこれらのエントリを削除してください。cron には systemd のユーザーバス環境がない場合があり、そのため古いスクリプトが Gateway の稼働状態を誤って報告することがあります。

  </Accordion>

  <Accordion title="プロキシ環境で QR ログインがタイムアウトする">
    症状: `openclaw channels login --channel whatsapp` が、使用可能な QR を表示する前に `status=408 Request Time-out` または TLS ソケット切断で失敗します。

    WhatsApp Web のログインでは、Gateway ホストの標準プロキシ環境（`HTTPS_PROXY`、`HTTP_PROXY`、小文字の各バリアント、`NO_PROXY`）が使用されます。Gateway プロセスがプロキシ環境変数を継承していること、および `NO_PROXY` が `mmg.whatsapp.net` に一致していないことを確認してください。

  </Accordion>

  <Accordion title="送信時にアクティブなリスナーがない">
    対象アカウントにアクティブな Gateway リスナーが存在しない場合、送信メッセージは即座に失敗します。Gateway が実行中で、アカウントがリンクされていることを確認してください。
  </Accordion>

  <Accordion title="返信がトランスクリプトには表示されるが WhatsApp には表示されない">
    トランスクリプトの行には、エージェントが生成した内容が記録されます。WhatsApp への配信は別途確認されます。OpenClaw は、少なくとも1件の表示可能なテキストまたはメディア送信について Baileys が送信メッセージ ID を返した後にのみ、自動返信を送信済みとして扱います。

    Ack リアクションは返信前の独立した受信確認です。リアクションが成功しても、その後のテキスト／メディア返信が受け付けられたことを証明するものではありません。Gateway のログで `auto-reply delivery failed` または `auto-reply was not accepted by WhatsApp provider` を確認してください。

  </Accordion>

  <Accordion title="グループメッセージが予期せず無視される">
    次の順序で確認してください: `groupPolicy`、`groupAllowFrom`／`allowFrom`、`groups` の許可リストエントリ、メンションゲート（`requireMention` + メンションパターン）、`openclaw.json` 内の重複キー（JSON5 では後のエントリが前のエントリを上書きします。スコープごとに `groupPolicy` を1つだけ保持してください）。

    `channels.whatsapp.groups` が存在する場合でも、WhatsApp は他のグループからのメッセージを監視できますが、OpenClaw はセッションルーティングの前にそれらを破棄します。グループ JID を `channels.whatsapp.groups` に追加するか、`groups["*"]` を追加してすべてのグループを許可しつつ、送信者の認可は `groupPolicy`／`groupAllowFrom` で制御してください。

  </Accordion>

  <Accordion title="Bun ランタイムの警告">
    WhatsApp Gateway のランタイムには Node を使用してください。Bun は、WhatsApp／Telegram Gateway の安定運用には非互換として警告されます。
  </Accordion>
</AccordionGroup>

## システムプロンプト

WhatsApp は、`groups` マップと `direct` マップを介して、グループおよびダイレクトチャット向けの Telegram 形式のシステムプロンプトをサポートします。

グループメッセージの解決方法: まず有効な `groups` マップが決定されます。アカウントが独自の `groups` キーを1つでも定義している場合、ルートの `groups` マップを完全に置き換えます（ディープマージは行われません）。その後、プロンプトの検索は、その結果得られた単一のマップに対して実行されます。

1. **グループ固有のプロンプト**（`groups["<groupId>"].systemPrompt`）: グループエントリが存在し、**かつ**その `systemPrompt` キーが定義されている場合に使用されます。空文字列（`""`）はワイルドカードを抑制し、プロンプトを適用しません。
2. **グループのワイルドカードプロンプト**（`groups["*"].systemPrompt`）: 特定のグループエントリが存在しない場合、または存在していても `systemPrompt` キーがない場合に使用されます。

ダイレクトメッセージの解決方法も、`direct` マップと `direct["*"]` に対して同じパターンに従います。

<Note>
`dms` は、DM ごとの軽量な履歴上書き用バケット（`dms.<id>.historyLimit`）として残ります。プロンプトの上書きは `direct` 配下に配置します。
</Note>

<Note>
プロンプト解決における、このアカウント設定がルート設定を置き換える動作は、単純な浅い上書きです。明示的な空オブジェクトを含め、アカウントに `groups`／`direct` キーがあれば、ルートマップが置き換えられます。これは上記のグループ所属許可リストのチェックとは異なります。グループ所属許可リストには、誤って空の `groups: {}` を設定した場合に備えた単一アカウント向けの安全策があります。
</Note>

**Telegram との違い:** Telegram は、複数アカウント構成では、各アカウントに独自の `groups` がない場合でも、すべてのアカウントに対してルートの `groups` を抑制します。これは、ボットが所属していないグループのグループメッセージを受信するのを防ぐためです。WhatsApp はこの保護を適用しません。独自の上書きがないアカウントは、アカウント数に関係なくルートの `groups`／`direct` を継承します。複数アカウントの WhatsApp 構成でアカウントごとのプロンプトを使用する場合は、各アカウント配下に完全なマップを明示的に定義してください。

重要な動作:

- `channels.whatsapp.groups` は、グループごとの設定マップであると同時に、チャットレベルのグループ許可リストでもあります。ルートスコープでもアカウントスコープでも、`groups["*"]` は、そのスコープで「すべてのグループを許可する」ことを意味します。
- そのスコープですべてのグループをすでに許可する意図がある場合にのみ、ワイルドカードの `systemPrompt` を追加してください。固定されたグループ ID の集合だけを対象にするには、`groups["*"]` を使用せず、明示的に許可リストへ追加した各エントリにプロンプトを繰り返し設定します。
- グループの許可と送信者の認可は別々のチェックです。`groups["*"]` はグループ処理に到達するグループの範囲を広げますが、それらのグループ内のすべての送信者を認可するものではありません。送信者の認可は引き続き `groupPolicy`／`groupAllowFrom` で制御されます。
- `channels.whatsapp.direct` には、DM に対する同等の副作用はありません。`direct["*"]` は、DM が `dmPolicy` と `allowFrom` またはペアリングストアのルールによって許可された後にのみ、デフォルト設定を提供します。

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
            // 置き換えられます。ワイルドカードを維持するには、ここでも "*" を明示的に定義します。
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "プロジェクト管理に集中する。",
            },
            // このアカウントですべてのグループを許可する場合にのみ使用します。
            "*": { systemPrompt: "業務用グループ向けのデフォルトプロンプト。" },
          },
          direct: {
            // このアカウントは独自の direct マップを定義しているため、ルートの direct エントリは
            // 完全に置き換えられます。ワイルドカードを維持するには、ここでも "*" を明示的に定義します。
            "+15551234567": { systemPrompt: "特定の業務用ダイレクトチャット向けのプロンプト。" },
            "*": { systemPrompt: "業務用ダイレクトチャット向けのデフォルトプロンプト。" },
          },
        },
      },
    },
  },
}
```

## 設定リファレンスへのポインター

主要リファレンス: [設定リファレンス - WhatsApp](/ja-JP/gateway/config-channels#whatsapp)

| 領域             | フィールド                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| アクセス         | `dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`                                             |
| 配信             | `textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`、`reactionLevel`                |
| 複数アカウント   | `accounts.<id>.enabled`、`accounts.<id>.authDir`、およびその他のアカウントごとの上書き                        |
| 運用             | `configWrites`、`debounceMs`、`web.enabled`、`web.heartbeatSeconds`、`web.reconnect.*`、`web.whatsapp.*`       |
| セッションの動作 | `session.dmScope`、`historyLimit`、`dmHistoryLimit`、`dms.<id>.historyLimit`                                   |
| プロンプト       | `groups.<id>.systemPrompt`、`groups["*"].systemPrompt`、`direct.<id>.systemPrompt`、`direct["*"].systemPrompt` |

## 関連項目

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [セキュリティ](/ja-JP/gateway/security)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
