---
read_when:
    - ブラウザーから Gateway を操作したい
    - SSH トンネルなしで Tailnet アクセスを使いたい
sidebarTitle: Control UI
summary: Gateway 用のブラウザベースの制御 UI（チャット、アクティビティ、ノード、設定）
title: コントロール UI
x-i18n:
    generated_at: "2026-07-06T21:52:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: faa16914b33348ae5bc194936453ce822d740c6369e005c1a16c0de399ed45a5
    source_path: web/control-ui.md
    workflow: 16
---

Control UI は、Gateway によって提供される小さな **Vite + Lit** シングルページアプリです。

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します（例: `/openclaw`）

同じポート上の **Gateway WebSocket** と直接通信します。

## クイックオープン（ローカル）

Gateway が同じコンピューターで実行されている場合は、[http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）を開きます。

ページの読み込みに失敗する場合は、先に Gateway を起動します: `openclaw gateway`。

<Note>
ネイティブ Windows の LAN バインドでは、Gateway ホスト上で `127.0.0.1` が動作していても、Windows Firewall や組織管理の Group Policy によって、通知された LAN URL がブロックされることがあります。Windows ホストで `openclaw gateway status --deep` を実行してください。ブロックされている可能性のあるポート、プロファイルの不一致、ポリシーが無視する可能性のあるローカルファイアウォールルールが報告されます。
</Note>

認証は WebSocket ハンドシェイク中に次の方法で提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合の Tailscale Serve ID ヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合の信頼済みプロキシ ID ヘッダー

ダッシュボード設定パネルは、現在のブラウザータブセッションと選択された gateway URL 用のトークンを保持します。パスワードは永続化されません。オンボーディングは通常、初回接続時に共有シークレット認証用の gateway トークンを生成しますが、`gateway.auth.mode` が `"password"` の場合はパスワード認証も使用できます。

## デバイスのペアリング（初回接続）

新しいブラウザーまたはデバイスから接続する場合、通常は **1 回限りのペアリング承認** が必要で、`disconnected (1008): pairing required` と表示されます。

<Steps>
  <Step title="List pending requests">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Approve by request ID">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

ブラウザーが変更された認証詳細（ロール、スコープ、公開鍵）でペアリングを再試行した場合、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認する前に `openclaw devices list` を再実行してください。

すでにペアリング済みのブラウザーを読み取りアクセスから書き込みまたは管理者アクセスへ切り替える場合、サイレント再接続ではなく承認アップグレードとして扱われます。OpenClaw は古い承認を有効なままにし、より広い権限での再接続をブロックし、新しいスコープセットを明示的に承認するよう求めます。

承認されるとデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り、再承認は不要です。トークンのローテーション、取り消し、Paperclip / `openclaw_gateway` の初回実行承認フローについては、[デバイス CLI](/ja-JP/cli/devices) を参照してください。

<Note>
- 直接の local loopback ブラウザー接続（`127.0.0.1` / `localhost`）は自動承認されます。
- `gateway.auth.allowTailscale: true` で、Tailscale ID が検証され、ブラウザーがデバイス ID を提示する場合、Tailscale Serve は Control UI オペレーターセッションのペアリング往復を省略できます。デバイスを持たないブラウザーとノードロール接続は、引き続き通常のデバイスチェックに従います。
- 直接の Tailnet バインド、LAN ブラウザー接続、デバイス ID を持たないブラウザープロファイルでは、引き続き明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイス ID を生成するため、ブラウザーを切り替えたりブラウザーデータを消去したりすると、再ペアリングが必要です。

</Note>

## モバイルデバイスをペアリングする

すでにペアリング済みの管理者は、ターミナルを開かずに iOS/Android 接続用 QR を作成できます。

<Steps>
  <Step title="Open mobile pairing">
    **Nodes** を選択し、**Devices** カード内の **Pair mobile device** をクリックします。
  </Step>
  <Step title="Connect the phone">
    OpenClaw モバイルアプリで、**Settings** → **Gateway** を開き、QR コードをスキャンします。代わりにセットアップコードをコピーして貼り付けることもできます。
  </Step>
  <Step title="Confirm the connection">
    公式 iOS/Android アプリは自動的に接続します。**Devices** に保留中のリクエストが表示される場合は、承認前にそのロールとスコープを確認してください。
  </Step>
</Steps>

セットアップコードの作成には `operator.admin` が必要です。これを持たないセッションではボタンが無効になります。セットアップコードには短命のブートストラップ認証情報が含まれるため、有効期間中は QR とコピーしたコードをパスワードのように扱ってください。リモートペアリングでは、Gateway は `wss://` として解決される必要があります（例: Tailscale Serve/Funnel 経由）。平文の `ws://` はループバックおよびプライベート LAN アドレスに限定されます。セキュリティとフォールバックの詳細については、[ペアリング](/ja-JP/channels/pairing#pair-from-the-control-ui-recommended) を参照してください。

## 個人 ID（ブラウザーローカル）

Control UI は、送信メッセージに紐づくブラウザーごとの個人 ID（表示名とアバター）をサポートし、共有セッションでの帰属表示に使用します。これはブラウザーストレージに保存され、現在のブラウザープロファイルにスコープされます。他のデバイスには同期されず、送信したメッセージ上の通常のトランスクリプト作成者メタデータを超えてサーバー側に永続化されることもありません。サイトデータを消去したりブラウザーを切り替えたりすると、空にリセットされます。

アシスタントアバターのオーバーライドも同じブラウザーローカルのパターンに従います。アップロードされたオーバーライドは、gateway が解決した ID の上にローカルで重ねられ、`config.patch` を通じて往復することはありません。共有 `ui.assistant.avatar` 設定フィールドは、そのフィールドを直接書き込む非 UI クライアント向けに引き続き利用できます。

## ランタイム設定エンドポイント

Control UI は、gateway の Control UI ベースパスから相対的に解決される `/control-ui-config.json` からランタイム設定を取得します（たとえば、ベースパス `/__openclaw__/` の下では `/__openclaw__/control-ui-config.json`）。このエンドポイントは、HTTP サーフェスの他の部分と同じ gateway 認証によって保護されます。未認証のブラウザーは取得できず、取得に成功するには有効な gateway トークンまたはパスワード、Tailscale Serve ID、または信頼済みプロキシ ID が必要です。

## Gateway ホストステータス

Simple ビューで **Settings** を開くと、Gateway マシン、LAN アドレス、オペレーティングシステム、ランタイム、稼働時間、CPU 負荷、メモリ、状態ボリュームのディスク容量を表示する **Gateway Host** カードを確認できます。このカードは、表示されている間、`operator.read` スコープを必要とする `system.info` Gateway RPC を通じて 10 秒ごとに更新されます。古い Gateway やそのスコープを持たない接続では、このカードは表示されません。

## 言語サポート

Control UI は初回読み込み時にブラウザーのロケールに基づいてローカライズされます。後で上書きするには、**Overview -> Gateway Access -> Language** を開きます（ピッカーは Appearance の下ではなく Gateway Access カード内にあります）。

- サポートされるロケール: `en`, `ar`, `de`, `es`, `fa`, `fr`, `hi`, `id`, `it`, `ja-JP`, `ko`, `nl`, `pl`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`
- 英語以外の翻訳はブラウザー内で遅延読み込みされます。
- 選択されたロケールはブラウザーストレージに保存され、今後の訪問で再利用されます。
- 欠落している翻訳キーは英語にフォールバックします。

ドキュメント翻訳は同じ英語以外のロケールセット向けに生成されますが、ドキュメントサイトに組み込まれている Mintlify の言語ピッカーには、Mintlify が受け入れるロケールコードのみが表示されます。タイ語（`th`）とペルシャ語（`fa`）のドキュメントは公開リポジトリ内で引き続き生成されますが、Mintlify がこれらのコードをサポートするまで、そのピッカーには表示されない場合があります。

## 外観テーマ

Appearance パネルには、組み込みの Claw、Knot、Dash テーマ（Claw がデフォルト）と、ブラウザーローカルの tweakcn インポートスロットが 1 つあります。テーマをインポートするには、[tweakcn エディター](https://tweakcn.com/editor/theme)を開き、テーマを選択または作成して **Share** をクリックし、コピーしたリンクを Appearance に貼り付けます。インポーターは、`https://tweakcn.com/r/themes/<id>` レジストリ URL、`https://tweakcn.com/editor/theme?theme=amethyst-haze` のようなエディター URL、相対 `/themes/<id>` パス、生のテーマ ID、`amethyst-haze` のようなデフォルトテーマ名も受け付けます。

インポートされたテーマは現在のブラウザープロファイルにのみ保存されます。gateway 設定には書き込まれず、デバイス間で同期されません。インポート済みテーマを置き換えると、1 つのローカルスロットが更新されます。これを消去すると、インポート済みテーマがアクティブだった場合は Claw に戻ります。

Appearance には、Control UI 設定の残りと一緒に保存される、ブラウザーローカルの Text size 設定もあります。これはチャットテキスト、コンポーザーテキスト、ツールカード、チャットサイドバーに適用され、モバイル Safari がフォーカス時に自動ズームしないよう、テキスト入力を少なくとも 16px に保ちます。

## サイドバーナビゲーション

サイドバーは、スクロール可能な最近のセッション一覧の上にナビゲーションを固定します。一覧は **Pinned**、カスタムグループごとのセクション（セッションの `category`、アルファベット順）、および残りの **Ungrouped** に分かれます。ピン留めされた各セッションは常に表示され、ピン留めされていないセッションは独立した 9 件の最近項目枠を維持します。表示中のセッションを開くと、行の順序を変更せずに選択ハイライトが移動します。一覧外のディープリンクは上部に表示されます。最後に読まれてから新しいアクティビティがあるセッションには未読ドットが表示され、開くと既読になります。各セッション行にはコンテキストメニュー（ケバブボタンまたは右クリック）があり、Pin/Unpin、Mark as unread/read、Rename、Fork、Move to group（New group と Remove from group を含む）、Archive、Delete を利用できます。タッチレイアウトでは、直接のピン操作とメニュー操作が表示されたままになります。マルチエージェント構成では、Ungrouped ヘッダーにコンパクトなスコープコントロールが表示されます。デフォルトでピン留めされる宛先は **Overview** のみです。**More** を展開すると、他のすべての宛先にアクセスできます。More の下にある **Customize sidebar** を選択するか、ナビゲーション領域を右クリックして、宛先のピン留めやピン留め解除、デフォルトの復元を行います。ピン留めセットと More の展開状態は現在のブラウザープロファイルに保存され、再読み込み後も保持されます。

コンパクトなフッターは、接続ステータス、**Settings**、**Docs**、モバイルペアリング、サイドバー折りたたみ切り替えをまとめて配置します。折りたたむと、サイドバーはアイコンレールに縮小され、展開ボタンはフッタースタックの上部に配置されます。ドロワーブレークポイントでは、トップバーのハンバーガーボタンがそのコントロールを置き換えます。

## できること（現在）

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Gateway WS（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）経由でモデルとチャットできます。
    - チャット履歴の更新は、メッセージごとのテキスト上限を持つ制限付きの最近ウィンドウを要求するため、大きなセッションでも、チャットが利用可能になる前にブラウザーが完全なトランスクリプトペイロードをレンダリングする必要はありません。
    - 公開 GitHub issue または pull request リンクにホバーするかキーボードフォーカスすると、その状態、タイトル、作成者、最近のアクティビティ、コメント、変更統計が表示されます。接続中の Gateway は、UI がリモート Gateway を使用している場合も含め、リンク先を変更せずに公開メタデータを取得してキャッシュします。Gateway は、リポジトリが公開されていることを確認した後、利用可能な場合は `GH_TOKEN` または `GITHUB_TOKEN` を使用します。それ以外の場合は、より長いキャッシュで GitHub の匿名 API を使用します。
    - ブラウザーのリアルタイムセッションを通じて会話できます。OpenAI は直接 WebRTC を使用し、Google Live は WebSocket 経由の制約付き 1 回限りのブラウザートークンを使用し、バックエンド専用のリアルタイム音声プラグインは Gateway リレートランスポートを使用します。クライアント所有のプロバイダーセッションは `talk.client.create` で開始し、Gateway リレーセッションは `talk.session.create` で開始します。リレーはプロバイダー認証情報を Gateway 上に保持しながら、ブラウザーが `talk.session.appendAudio` を通じてマイク PCM をストリーミングし、Gateway ポリシーとより大きな設定済み OpenClaw モデル向けに `openclaw_agent_consult` プロバイダーツール呼び出しを `talk.client.toolCall` 経由で転送し、アクティブ実行中の音声ステアリングを `talk.client.steer` または `talk.session.steer` 経由でルーティングします。
    - Chat でツール呼び出しとライブツール出力カードをストリーミングします（エージェントイベント）。
    - 既存の `session.tool` / ツールイベント配信から取得したライブツールアクティビティの、ブラウザーローカルで編集優先のサマリーを表示する Activity タブ。

  </Accordion>
  <Accordion title="チャネル、インスタンス、セッション、ドリーム">
    - チャネル: 組み込みチャネルとバンドル/外部 Plugin チャネルのステータス、QR ログイン、チャネルごとの設定（`channels.status`、`web.login.*`、`config.patch`）。
    - チャネルプローブの更新では、遅いプロバイダーチェックが完了するまで前回のスナップショットを表示し続け、プローブまたは監査が UI 予算を超えた場合は部分的なスナップショットであることを示します。
    - インスタンス: プレゼンス一覧と更新（`system-presence`）。
    - セッション: デフォルトで設定済みエージェントのセッションを一覧表示し、よく使うセッションをピン留め、名前変更、非アクティブなセッションのアーカイブまたは復元、古い未設定エージェントのセッションキーからのフォールバック、セッションごとのモデル/thinking/fast/verbose/trace/reasoning オーバーライドの適用（`sessions.list`、`sessions.patch`）。ピン留めされたセッションは、最近の未ピン留めセッションより上に並びます。アーカイブ済みセッションは Sessions ページのアーカイブビューにあり、トランスクリプトを保持します。行には、最後に既読にしてからアクティビティがあったセッションに未読ドットが表示され、未読化/既読化アクション（`sessions.patch { unread }`）と、トランスクリプトを新しいセッションに分岐する Fork アクション（`sessions.create { parentSessionKey, fork: true }`）があります。
    - セッションのグループ化: Group by コントロールは、カスタムグループ、チャネル、種類、エージェント、日付ごとにセッションテーブルをセクションへ整理します。カスタムグループは `sessions.patch`（`category`）を介してセッションごとに永続化されるため、メッセージチャネル（Discord、Telegram、WhatsApp、...）から開始されたセッションも分類できます。行をセクションへドラッグするか、行ごとのグループセレクターでグループを割り当て、New group アクションでグループを作成します。
    - ドリーム: Dreaming ステータス、有効/無効トグル、Dream Diary リーダー（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="Cron、タスク、Skills、ノード、exec 承認">
    - Cron ジョブ: 一覧/追加/編集/実行/有効化/無効化と実行履歴（`cron.*`）。
    - タスク: リンクされたセッションとキャンセルを含む、ライブのアクティブおよび最近のバックグラウンドタスク台帳（`tasks.*`）。
    - Skills: ステータス、有効化/無効化、インストール、API キー更新（`skills.*`）。
    - ノード: 一覧と上限（`node.list`）、モバイルセットアップコードの作成、デバイスペアリングの承認（`device.pair.*`）。
    - exec 承認: Gateway またはノードの許可リストと `exec host=gateway/node` の ask ポリシーを編集（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="設定">
    - `~/.openclaw/openclaw.json` を表示/編集（`config.get`、`config.set`）。
    - MCP には、設定済みサーバー、有効化、OAuth/フィルター/並列の概要、一般的なオペレーターコマンド、スコープ付き `mcp` 設定エディターの専用設定ページがあります。
    - 検証付きで適用して再起動し（`config.apply`）、その後、最後のアクティブセッションを起こします。
    - 書き込みには、同時編集の上書きを防ぐためのベースハッシュガードが含まれます。
    - 書き込み（`config.set`/`config.apply`/`config.patch`）は、送信された設定ペイロード内の参照について、アクティブな SecretRef 解決を事前チェックします。解決できないアクティブな送信済み参照は、書き込み前に拒否されます。
    - フォーム保存では、保存済み設定から復元できない古い伏せ字プレースホルダーを破棄しつつ、保存済みシークレットにまだ対応している伏せ字値は保持します。
    - スキーマとフォームレンダリングは `config.schema` / `config.schema.lookup` から取得されます。これにはフィールド `title`/`description`、一致した UI ヒント、直接の子要素の概要、ネストされたオブジェクト/ワイルドカード/配列/合成ノード上の docs メタデータ、利用可能な場合は Plugin とチャネルのスキーマが含まれます。Raw JSON エディターは、スナップショットが安全な raw 往復を持つ場合にのみ利用できます。それ以外の場合、Control UI は Form モードを強制します。
    - Raw JSON エディターの「Reset to saved」は、フラット化されたスナップショットを再レンダリングする代わりに、raw で作成された形状（書式、コメント、`$include` レイアウト）を保持するため、スナップショットが安全に往復できる場合は外部編集がリセット後も残ります。
    - 構造化された SecretRef オブジェクト値は、誤ってオブジェクトから文字列へ破損することを防ぐため、フォームのテキスト入力では読み取り専用としてレンダリングされます。

  </Accordion>
  <Accordion title="使用状況">
    - セッション由来のトークンと推定コストの分析は、プロバイダー課金とは分離されたままです。
    - プロバイダーカードは `usage.status` を呼び出し、設定済みプロバイダー Plugin が報告するライブのプラン名、クォータ期間、残高、支出、予算を表示します。
    - プロバイダー使用状況の失敗は、セッション/コストダッシュボードをブロックしません。利用できないプロバイダーカードは、それぞれ独自のエラー状態を表示します。

  </Accordion>
  <Accordion title="デバッグ、ログ、更新">
    - デバッグ: ステータス/ヘルス/モデルのスナップショット、イベントログ、手動 RPC 呼び出し（`status`、`health`、`models.list`）。
    - イベントログには、Control UI の更新/RPC タイミング、遅いチャット/設定レンダリングのタイミング、ブラウザーがそれらの PerformanceObserver エントリータイプを公開している場合の長いアニメーションフレームまたは長いタスクに関するブラウザー応答性エントリーが含まれます。
    - ログ: フィルター/エクスポート付きの Gateway ファイルログのライブ tail（`logs.tail`）。
    - 更新: 再起動レポート付きでパッケージ/git 更新と再起動を実行し（`update.run`）、再接続後に `update.status` をポーリングして実行中の Gateway バージョンを検証します。

  </Accordion>
  <Accordion title="Cron ジョブパネルのメモ">
    - 分離ジョブでは、配信のデフォルトは概要アナウンスです。内部専用の実行では none に切り替えます。
    - announce が選択されている場合、チャネル/ターゲットフィールドが表示されます。
    - Webhook モードでは、`delivery.mode = "webhook"` を使用し、`delivery.to` に有効な HTTP(S) Webhook URL を設定します。
    - メインセッションジョブでは、webhook と none の配信モードを利用できます。
    - 高度な編集コントロールには、実行後削除、エージェントオーバーライドのクリア、cron exact/stagger オプション、エージェントモデル/thinking オーバーライド、ベストエフォート配信トグルが含まれます。
    - フォーム検証はフィールドレベルのエラーとしてインライン表示されます。無効な値がある場合、修正されるまで保存ボタンは無効になります。
    - 専用の bearer token を送信するには `cron.webhookToken` を設定します。省略した場合、Webhook は auth ヘッダーなしで送信されます。
    - `cron.webhook` は非推奨のレガシーフォールバックです。まだ `notify: true` を使用している保存済みジョブを、ジョブごとの明示的な Webhook または完了配信へ移行するには、`openclaw doctor --fix` を実行してください。

  </Accordion>
</AccordionGroup>

## MCP ページ

専用の MCP ページは、`mcp.servers` 配下の OpenClaw 管理 MCP サーバー向けのオペレータービューです。それ自体で MCP トランスポートを開始することはありません。保存済み設定の確認と編集に使用し、ライブサーバーの証明が必要な場合は `openclaw mcp doctor --probe` を使用します。

一般的なワークフロー:

1. サイドバーから **MCP** を開きます。
2. 合計、有効、OAuth、フィルター済みサーバー数の概要カードを確認します。
3. 各サーバー行で、トランスポート、有効化、auth、フィルター、タイムアウト、コマンドヒントを確認します。
4. サーバーを設定済みのまま runtime discovery から外しておく必要がある場合は、有効化を切り替えます。
5. サーバー定義、ヘッダー、TLS/mTLS パス、OAuth メタデータ、ツールフィルター、Codex 投影メタデータ用に、スコープ付き `mcp` 設定セクションを編集します。
6. 設定を書き込むには **Save** を使用し、実行中の Gateway に変更済み設定を適用させる場合は **Save & Publish** を使用します。
7. 静的診断、ライブ証明、キャッシュ済み runtime の破棄には、ターミナルから `openclaw mcp status --verbose`、`openclaw mcp doctor --probe`、または `openclaw mcp reload` を実行します。

このページは、認証情報を含む URL 風の値をレンダリング前に伏せ字にし、コマンドスニペット内のサーバー名を引用符で囲むため、コピーしたコマンドはスペースやシェルメタ文字が含まれていても動作します。完全な CLI と設定リファレンス: [MCP](/ja-JP/cli/mcp)。

## Activity タブ

Activity タブは、Chat ツールカードを支えるものと同じ Gateway `session.tool` / ツールイベントストリームから派生した、ライブツールアクティビティ用の一時的なブラウザーローカルオブザーバーです。別の Gateway イベントファミリー、エンドポイント、永続的なアクティビティストア、メトリクスフィード、外部オブザーバーストリームを追加するものではありません。

Activity エントリーは、サニタイズ済みの概要と、伏せ字かつ切り詰められた出力プレビューのみを保持します。ツール引数の値は Activity 状態に保存されません。UI は引数が非表示であることを示し、引数フィールド数のみを記録します。インメモリ一覧は現在のブラウザータブに追従し、Control UI 内のナビゲーションをまたいで保持され、ページ再読み込み、セッション切り替え、または **Clear** でリセットされます。

## オペレーターターミナル

ドッキング可能なオペレーターターミナルはデフォルトで無効です。有効にするには、`gateway.terminal.enabled: true` を設定して Gateway を再起動します。ターミナルには `operator.admin` 接続が必要で、アクティブなエージェントワークスペースでホスト PTY を開きます。新しいタブは、現在選択されているチャットエージェントに従います。

<Warning>
ターミナルは制限のないホストシェルであり、Gateway プロセス環境を継承します。信頼できるオペレーター環境でのみ有効にしてください。OpenClaw は `sandbox.mode: "all"` のエージェントに対してターミナルセッションを拒否します。アクティブなエージェントをそのモードに変更すると、既存および進行中のターミナルセッションが閉じられます。
</Warning>

ドックを切り替えるには **Ctrl + backtick** を使用します。レイアウトは下部と右側のドッキングをサポートし、ブラウザービューポートに合わせてリサイズされ、複数のシェルタブを保持します。`gateway.terminal.enabled` とオプションの `gateway.terminal.shell` オーバーライドについては、[Gateway 設定](/ja-JP/gateway/configuration-reference#gateway) を参照してください。

セッションは切断後も存続します。ページ再読み込み、ラップトップのスリープ、ネットワークの瞬断では、Gateway 上のセッションは終了せずデタッチされ、同じブラウザータブが再接続時に再アタッチして最近の出力を再生します。デタッチされたセッションは `gateway.terminal.detachedSessionTimeoutSeconds` 後に終了されます（デフォルト 300 秒。`0` は切断時終了を復元します）。`terminal.list` はアタッチ可能なセッションを表示し、`terminal.attach` はその 1 つを採用し（tmux 風の乗っ取り）、`terminal.text` はアタッチせずにセッションの最近の出力をプレーンテキストとして読み取ります。これはエージェント/ツール向けの機能です。

ターミナルは `/?view=terminal` で全画面のターミナル専用ドキュメントとしても利用できます。iOS と Android アプリはこのページを Terminal 画面に埋め込み、保存済みの Gateway 認証情報を再利用します。利用可否は同じ `gateway.terminal.enabled` と `operator.admin` のゲートに従い、接続先 Gateway がターミナルを提供していない場合はページに通知が表示されます。

## チャットの動作

<AccordionGroup>
  <Accordion title="送信と履歴のセマンティクス">
    - `chat.send` は**非ブロッキング**です。`{ runId, status: "started" }` ですぐに ACK し、応答は `chat` イベント経由でストリーミングされます。信頼済みの Control UI クライアントは、ローカル診断用の任意の ACK タイミングメタデータも受け取る場合があります。
    - チャットアップロードは画像と非動画ファイルを受け付けます。画像はネイティブ画像パスを維持し、その他のファイルは管理対象メディアとして保存され、履歴では添付リンクとして表示されます。
    - 同じ `idempotencyKey` で再送信すると、実行中は `{ status: "in_flight" }` を返し、完了後は `{ status: "ok" }` を返します。
    - `chat.history` の応答は、UI の安全性のためサイズ制限されています。トランスクリプトエントリが大きすぎる場合、Gateway は長いテキストフィールドを切り詰め、重いメタデータブロックを省略し、過大なメッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えることがあります。
    - 表示可能なアシスタントメッセージが `chat.history` で切り詰められた場合、サイドリーダーは `sessionKey`、必要に応じてアクティブな `agentId`、およびトランスクリプトの `messageId` によって、表示正規化済みの完全なトランスクリプトエントリを `chat.message.get` 経由でオンデマンド取得できます。Gateway がそれでも追加内容を返せない場合、リーダーは切り詰められたプレビューを黙って繰り返すのではなく、明示的な利用不可状態を表示します。
    - アシスタント/生成画像は管理対象メディア参照として永続化され、認証済み Gateway メディア URL 経由で返されるため、リロードは生の base64 画像ペイロードがチャット履歴応答に残っていることに依存しません。
    - `chat.history` のレンダリング時、Control UI は、表示可能なアシスタントテキストから表示専用のインラインディレクティブタグ（例: `[[reply_to_*]]` と `[[audio_as_voice]]`）、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、漏えいした ASCII/全角のモデル制御トークンを取り除きます。表示テキスト全体が正確なサイレントトークン `NO_REPLY` / `no_reply` または Heartbeat 確認トークン `HEARTBEAT_OK` のみであるアシスタントエントリは省略します。
    - アクティブな送信中および最終履歴更新時に、`chat.history` が一時的に古いスナップショットを返した場合でも、チャットビューはローカルの楽観的なユーザー/アシスタントメッセージを表示したままにします。Gateway 履歴が追いつくと、正規のトランスクリプトがそれらのローカルメッセージを置き換えます。
    - ライブの `chat` イベントは配信状態であり、`chat.history` は耐久性のあるセッショントランスクリプトから再構築されます。ツール最終イベントの後、Control UI は履歴を再読み込みし、小さな楽観的末尾のみをマージします。トランスクリプト境界は [WebChat](/ja-JP/web/webchat) に記載されています。
    - `chat.inject` はアシスタントノートをセッショントランスクリプトに追加し、UI のみの更新として `chat` イベントをブロードキャストします（エージェント実行なし、チャネル配信なし）。
    - サイドバーは、ピン留め/カスタム/未グループ化セクションごとに最近のセッションを一覧表示し、New Session アクションと All Sessions リンクを提供します。ピン留めされたセッションは常に表示されます。ピン留めされていないセッションは 9 件の予算と安定した新しさ順を維持するため、表示中の行を開いてもハイライトだけが移動します。新しいダッシュボードセッションは、最初の非コマンドメッセージから簡潔な生成タイトルを非同期で取得します。明示的な名前は決して置き換えられません。`agents.defaults.utilityModel`（または `agents.list[].utilityModel`）を設定すると、この別個のモデル呼び出しを低コストモデルにルーティングできます。コンパクトエージェントスコープに切り替えると、そのエージェントに結び付いたセッションのみが表示され、保存済みダッシュボードセッションがまだない場合はそのエージェントのメインセッションにフォールバックします。
    - セッション検索はコマンドパレット（⌘K、またはトップバーの検索ボタン）にあります。クエリを入力すると、エージェント全体で一致ページを制限数だけたどり、内部の子/cron 行をフィルタリングし、ナビゲーションコマンドの横に表示可能な一致を一覧表示します。All Sessions ページには、フィルター付きの網羅的な検索可能リストが残ります。
    - 各サイドバー行は、直接のピンアクセスに加えて、未読状態、名前変更、フォーク、グループ化、アーカイブ、削除のための完全なコンテキストメニューを保持します。アクティブな実行とエージェントのメインセッションはアーカイブできません。現在選択中のセッションをアーカイブまたは削除すると、Chat はそのエージェントのメインセッションに戻ります。
    - macOS アプリでは、OpenClaw マークはサイドバー行を消費せず、ウィンドウコントロールの横にあるそれ以外は空のネイティブタイトルバーストリップを使用します。
    - デスクトップ幅では、チャットコントロールは 1 つのコンパクトな行に留まり、トランスクリプトを下にスクロールしている間は折りたたまれます。上にスクロールする、先頭に戻る、または末尾に到達すると、コントロールが復元されます。
    - 連続する重複したテキストのみのメッセージは、件数バッジ付きの 1 つのバブルとしてレンダリングされます。画像、添付、ツール出力、またはキャンバスプレビューを含むメッセージは折りたたまれません。
    - チャットヘッダーのモデルおよび思考ピッカーは、`sessions.patch` 経由でアクティブセッションにただちにパッチを適用します。これらは永続的なセッションオーバーライドであり、1 ターン限りの送信オプションではありません。
    - **分割ビュー:** コンポーザーコントロールから開き、収まるだけ多くのペインを右または下に分割します。各ペインには独自のセッション、トランスクリプト、コンポーザー、ツールストリームがあります。
    - アクティブな分割ペインがサイドバー選択と URL を制御します。ディバイダーで列と積み重ねペインのサイズを変更でき、ブラウザーはリロードをまたいでレイアウトをローカルに保存します。
    - 狭い画面では、分割ビューはレイアウトを保持しますが、アクティブなペインのみをレンダリングします。そのペインヘッダーは引き続きセッション切り替えと閉じるコントロールを提供します。
    - 同じセッションのモデルピッカー変更がまだ保存中の間にメッセージを送信した場合、コンポーザーは `chat.send` を呼び出す前にそのセッションパッチを待つため、送信には選択したモデルが使用されます。
    - `/new` と入力すると、New Chat と同じ新しいダッシュボードセッションを作成して切り替えます。ただし、`session.dmScope: "main"` が構成されていて、現在の親がエージェントのメインセッションである場合は、そのメインセッションをその場でリセットします。`/reset` と入力すると、Gateway の明示的な現在セッションのインプレースリセットを維持します。
    - チャットモデルピッカーは、Gateway に構成済みモデルビューを要求します。`agents.defaults.models` が存在する場合、その許可リストがピッカーを駆動します。これには、プロバイダー単位のカタログを動的に保つ `provider/*` エントリが含まれます。それ以外の場合、ピッカーは明示的な `models.providers.*.models` エントリと、使用可能な認証を持つプロバイダーを表示します。完全なカタログは、デバッグ用の `models.list` RPC で `view: "all"` を指定すると引き続き利用できます。
    - 新しい Gateway セッション使用状況レポートに現在のコンテキストトークンが含まれる場合、チャットコンポーザーツールバーは使用率を示す小さなコンテキスト使用量リングを表示します。リングを開くと、現在のコンテキストウィンドウ、最新実行のトークン数と推定総コスト、プロバイダー/モデル識別情報、および報告されている場合は最新プロバイダー応答の入力/出力/キャッシュコスト内訳が表示されます。リングはコンテキスト圧力が高いと警告スタイルに切り替わり、推奨 Compaction レベルでは、通常のセッション Compaction パスを実行するコンパクトなボタンを表示します。古いトークンスナップショットは、Gateway が新しい使用状況を再度報告するまで非表示になります。

  </Accordion>
  <Accordion title="トークモード（ブラウザーリアルタイム）">
    トークモードは、登録済みのリアルタイム音声プロバイダーを使用します。OpenAI は、`talk.realtime.provider: "openai"` と `openai` API キー/OAuth プロファイル、外部 Codex ログイン、`talk.realtime.providers.openai.apiKey`、または `OPENAI_API_KEY` を組み合わせて構成します。構成済みの API キーソースが優先され、Codex OAuth は自動フォールバックです。Google は、`talk.realtime.provider: "google"` と `talk.realtime.providers.google.apiKey` を組み合わせて構成します。ブラウザーが標準プロバイダー API キーや OAuth トークンを受け取ることはありません。OpenAI は WebRTC 用の一時 Realtime クライアントシークレットを受け取り、Google Live はブラウザー WebSocket セッション用の 1 回限りの制約付き Live API 認証トークンを受け取ります。このトークンには、Gateway によって指示とツール宣言がロックされます。バックエンドリアルタイムブリッジのみを公開するプロバイダーは、Gateway リレートランスポートを通して実行されるため、認証情報とベンダーソケットはサーバー側に留まり、ブラウザー音声は認証済み Gateway RPC 経由で移動します。Realtime セッションプロンプトは Gateway によって組み立てられます。`talk.client.create` は呼び出し元提供の指示オーバーライドを受け付けません。

    永続的なプロバイダー、モデル、音声、トランスポート、推論 effort、正確な VAD しきい値、無音時間、プレフィックスパディングのデフォルトは **Settings → Communications → Talk** にあります。変更には `operator.admin` アクセスが必要です。Gateway リレーを構成するとバックエンドリレーパスが強制されます。WebRTC を構成するとセッションはクライアント所有のままとなり、プロバイダーがブラウザーセッションを作成できない場合は、リレーへ黙ってフォールバックせずに失敗します。

    Talk コントロール自体はコンポーザーツールバーのマイクボタンです。そのキャレットには **System default** と、USB、Bluetooth、仮想入力を含むブラウザーが公開するすべてのマイクが一覧表示されます。選択したデバイス ID はブラウザーローカルに留まり、Gateway には送信されません。その正確なデバイスが消えた場合、Talk は別のマイクから黙って録音するのではなく、別の入力を選択するよう求めます。Talk が開始すると、コンポーザーステータス行はまず `Connecting Talk...` を表示し、音声が接続されている間は `Talk live`、またはリアルタイムツール呼び出しが `talk.client.toolCall` 経由で構成済みのより大きいモデルに問い合わせている間は `Asking OpenClaw...` を表示します。

    メンテナー向けライブスモーク: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` は、OpenAI バックエンド WebSocket ブリッジ、OpenAI ブラウザー WebRTC SDP 交換、Google Live 制約付きトークンのブラウザー WebSocket セットアップ、および偽のマイクメディアを使った Gateway リレーブラウザーアダプターを検証します。このコマンドはプロバイダー状態のみを出力し、シークレットはログに記録しません。

  </Accordion>
  <Accordion title="停止と中止">
    - **Stop** をクリックします（`chat.abort` を呼び出します）。
    - 実行がアクティブな間、通常のフォローアップはキューに入ります。キュー内のメッセージで **Steer** をクリックすると、そのフォローアップを実行中のターンに注入できます。
    - `/stop`（または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` のような単独の中止フレーズ）を入力すると、帯域外で中止します。
    - `chat.abort` は `{ sessionKey }`（`runId` なし）をサポートし、そのセッションのすべてのアクティブな実行を中止できます。

  </Accordion>
  <Accordion title="中止時の部分保持">
    - 実行が中止された場合でも、部分的なアシスタントテキストが UI に表示されることがあります。
    - Gateway は、バッファリングされた出力が存在する場合、中止された部分的なアシスタントテキストをトランスクリプト履歴に永続化します。
    - 永続化されたエントリには中止メタデータが含まれるため、トランスクリプト利用側は中止部分と通常の完了出力を区別できます。

  </Accordion>
</AccordionGroup>

## 接続喪失と再接続

セッションが確立されると、Gateway 接続が切断されてもログアウトされません。クライアントがバックオフ（800 ms から最大 15 s）付きで自動再試行している間、ダッシュボードは琥珀色の「Gateway 接続が失われました — 再接続中…」バナーとともに表示されたままになります。ライブ更新とアクションは接続が戻るまで一時停止します。バナー内の **Retry now** は即時試行を強制します。

ログインゲートは、まだ確立済みセッションがない場合（初回オープン、接続前のページリロード）、または Gateway が認証情報を能動的に拒否した場合（不正なトークン/パスワード、取り消されたペアリング）にのみ表示されます。これらは、待機ではなく入力が必要な状態です。

## PWA インストールと Web Push

Control UI は `manifest.webmanifest` とサービスワーカーを同梱しているため、最新のブラウザーではスタンドアロン PWA としてインストールできます。Web Push により、タブやブラウザーウィンドウが開いていない場合でも、Gateway は通知でインストール済み PWA を起動できます。

OpenClaw 更新直後にページが **Protocol mismatch** を表示する場合は、まず `openclaw dashboard` でダッシュボードを再度開き、ハードリフレッシュしてください。それでも失敗する場合は、ダッシュボードオリジンのサイトデータをクリアするか、プライベートブラウザーウィンドウでテストしてください。古いタブやブラウザーのサービスワーカーキャッシュが、更新前の Control UI バンドルを新しい Gateway に対して実行し続けることがあります。

| サーフェス                                            | 役割                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA マニフェスト。到達可能になると、ブラウザーが「アプリをインストール」を提示します。 |
| `ui/public/sw.js`                                     | `push` イベントと通知クリックを処理するサービスワーカー。 |
| `push/vapid-keys.json` (OpenClaw 状態ディレクトリ配下) | Web Push ペイロードの署名に使う、自動生成された VAPID キーペア。 |
| `push/web-push-subscriptions.json`                    | 永続化されたブラウザー購読エンドポイント。                          |

キーを固定したい場合（複数ホストのデプロイ、シークレットローテーション、テストなど）は、Gateway プロセスの環境変数で VAPID キーペアを上書きします。

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（既定値は `https://openclaw.ai`）

Control UI は、ブラウザー購読の登録とテストに以下のスコープ制限付き Gateway メソッドを使います。

- `push.web.vapidPublicKey` はアクティブな VAPID 公開鍵を取得します。
- `push.web.subscribe` は `endpoint` と `keys.p256dh`/`keys.auth` を登録します。
- `push.web.unsubscribe` は登録済みエンドポイントを削除します。
- `push.web.test` は呼び出し元の購読にテスト通知を送信します。

<Note>
Web Push は iOS APNS リレーパス（リレー支援の push については [構成](/ja-JP/gateway/configuration) を参照）およびネイティブモバイルペアリングを対象にする `push.test` メソッドから独立しています。
</Note>

## ホスト型埋め込み

アシスタントメッセージは `[embed ...]` ショートコードで、ホストされた Web コンテンツをインライン表示できます。iframe サンドボックスポリシーは `gateway.controlUi.embedSandbox` で制御します。

<Tabs>
  <Tab title="strict">
    ホストされた埋め込み内でのスクリプト実行を無効化します。
  </Tab>
  <Tab title="scripts (default)">
    オリジン分離を維持しつつインタラクティブな埋め込みを許可します。通常、自己完結型のブラウザーゲームやウィジェットには十分です。
  </Tab>
  <Tab title="trusted">
    より強い権限を意図的に必要とする同一サイトドキュメント向けに、`allow-scripts` に加えて `allow-same-origin` を追加します。
  </Tab>
</Tabs>

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
`trusted` は、埋め込みドキュメントが同一オリジン動作を本当に必要とする場合にのみ使ってください。ほとんどのエージェント生成ゲームやインタラクティブキャンバスでは、`scripts` のほうが安全な選択です。
</Warning>

絶対形式の外部 `http(s)` 埋め込み URL は、既定でブロックされたままです。`[embed url="https://..."]` にサードパーティページを読み込ませるには、`gateway.controlUi.allowExternalEmbedUrls: true` を設定します。

## チャットメッセージ幅

グループ化されたチャットメッセージには、読みやすい既定の最大幅があります。ワイドモニターのデプロイでは、`gateway.controlUi.chatMessageMaxWidth` を設定することで、同梱 CSS をパッチせずに上書きできます。

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

値はブラウザーに到達する前に検証されます。対応する形式には、`960px` や `82%` のような単純な長さやパーセンテージに加え、制約付きの `min(...)`、`max(...)`、`clamp(...)`、`calc(...)`、`fit-content(...)` 幅式が含まれます。

## Tailnet アクセス（推奨）

<Tabs>
  <Tab title="統合 Tailscale Serve（推奨）">
    Gateway をループバックに置き、Tailscale Serve に HTTPS でプロキシさせます。

    ```bash
    openclaw gateway --tailscale serve
    ```

    `https://<magicdns>/`（または設定済みの `gateway.controlUi.basePath`）を開きます。

    既定では、`gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket Serve リクエストは Tailscale ID ヘッダー（`tailscale-user-login`）で認証できます。OpenClaw は、`x-forwarded-for` アドレスを `tailscale whois` で解決してヘッダーと照合することで ID を検証し、リクエストが Tailscale の `x-forwarded-*` ヘッダー付きでループバックに到達した場合にのみ受け入れます。ブラウザーデバイス ID を持つ Control UI オペレーターセッションでは、この検証済み Serve パスはデバイスペアリングの往復もスキップします。デバイスなしのブラウザーとノードロール接続は、通常のデバイスチェックに従います。Serve トラフィックでも明示的な共有シークレット資格情報を必須にしたい場合は `gateway.auth.allowTailscale: false` を設定し、そのうえで `gateway.auth.mode: "token"` または `"password"` を使います。

    この非同期 Serve ID パスでは、同じクライアント IP と認証スコープに対する認証失敗は、レート制限書き込みの前に直列化されます。そのため、同じブラウザーからの並行した不正リトライでは、2 つの単純な不一致が並行して競合する代わりに、2 回目のリクエストで `retry later` が表示されることがあります。

    <Warning>
    トークンなし Serve 認証は、gateway ホストが信頼済みであることを前提にします。そのホストで信頼できないローカルコードが実行される可能性がある場合は、トークン/パスワード認証を必須にしてください。
    </Warning>

  </Tab>
  <Tab title="tailnet にバインド + トークン">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    `http://<tailscale-ip>:18789/`（または設定済みの `gateway.controlUi.basePath`）を開きます。

    一致する共有シークレットを UI 設定に貼り付けます（`connect.params.auth.token` または `connect.params.auth.password` として送信されます）。

  </Tab>
</Tabs>

## 安全でない HTTP

プレーン HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、ブラウザーは **非セキュアコンテキスト** で実行され、WebCrypto をブロックします。既定では、OpenClaw はデバイス ID のない Control UI 接続を **ブロック** します。

文書化済みの例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost 限定の安全でない HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` による Control UI オペレーター認証の成功
- 緊急用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS（Tailscale Serve）を使うか、UI をローカルで `https://<magicdns>/`（Serve）または `http://127.0.0.1:18789/`（gateway ホスト上）から開きます。

<AccordionGroup>
  <Accordion title="安全でない認証トグルの動作">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` はローカル互換性トグルにすぎません。

    - 非セキュア HTTP コンテキストで、localhost の Control UI セッションがデバイス ID なしで進行できるようにします。
    - ペアリングチェックはバイパスしません。
    - リモート（localhost 以外）のデバイス ID 要件は緩和しません。

  </Accordion>
  <Accordion title="緊急時のみ">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` は Control UI のデバイス ID チェックを無効化し、深刻なセキュリティ低下を招きます。緊急使用後はすみやかに戻してください。
    </Warning>

  </Accordion>
  <Accordion title="信頼済みプロキシの注意">
    - trusted-proxy 認証に成功すると、デバイス ID なしで **operator** Control UI セッションを許可できます。
    - これは node-role Control UI セッションには拡張されません。
    - 同一ホストのループバックリバースプロキシは、それでも trusted-proxy 認証を満たしません。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth) を参照してください。

  </Accordion>
</AccordionGroup>

HTTPS セットアップのガイダンスについては [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## コンテンツセキュリティポリシー

Control UI には厳格な `img-src` ポリシーが同梱されています。許可されるのは **same-origin** アセット、`data:` URL、ローカル生成の `blob:` URL のみです。リモートの `http(s)` およびプロトコル相対の画像 URL はブラウザーによって拒否され、ネットワークフェッチは一切発行されません。

実際には:

- 相対パス（例: `/avatars/<id>`）配下で提供されるアバターと画像は、UI が取得してローカル `blob:` URL に変換する認証済みアバタールートを含め、引き続きレンダリングされます。
- インラインの `data:image/...` URL は引き続きレンダリングされます。
- Control UI によって作成されたローカル `blob:` URL は引き続きレンダリングされます。
- GitHub リンクプレビューのアバターは、Gateway が GitHub の固定アバターホストから取得し、制限付きの `data:` URL として返します。オペレーターのブラウザーがリモートアバターホストに接続することはありません。
- チャンネルメタデータによって出力されたリモートアバター URL は、Control UI のアバターヘルパーで取り除かれ、組み込みのロゴ/バッジに置き換えられます。そのため、侵害された、または悪意のあるチャンネルが、オペレーターのブラウザーから任意のリモート画像フェッチを強制することはできません。

これは常に有効で、設定できません。

## アバタールート認証

gateway 認証が設定されている場合、Control UI アバターエンドポイントには API の他の部分と同じ gateway トークンが必要です。

- `GET /avatar/<agentId>` は認証済み呼び出し元にのみアバター画像を返します。`GET /avatar/<agentId>?meta=1` は同じルールの下でアバターメタデータを返します。
- どちらのルートへの未認証リクエストも拒否されます（兄弟の assistant-media ルートと一致）。そのため、他の部分が保護されているホストで、アバタールートがエージェント ID を漏らすことはありません。
- Control UI はアバター取得時に gateway トークンを bearer ヘッダーとして転送し、認証済み blob URL を使うため、画像はダッシュボードで引き続きレンダリングされます。

gateway 認証を無効化した場合（共有ホストでは非推奨）、gateway の他の部分と同様に、アバタールートも未認証になります。

## アシスタントメディアルート認証

gateway 認証が設定されている場合、アシスタントのローカルメディアプレビューは 2 段階のルートを使います。

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` には通常の Control UI オペレーター認証が必要です。ブラウザーは可用性を確認するときに gateway トークンを bearer ヘッダーとして送信します。
- 成功したメタデータレスポンスには、その正確なソースパスにスコープされた短命の `mediaTicket` が含まれます。
- ブラウザーでレンダリングされる画像、音声、動画、ドキュメントの URL は、アクティブな gateway トークンやパスワードの代わりに `mediaTicket=<ticket>` を使います。チケットはすぐに期限切れになり、別のソースを認可できません。

これにより、再利用可能な gateway 資格情報を可視のメディア URL に入れずに、ブラウザーネイティブのメディア要素との互換性を維持できます。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを提供します。

```bash
pnpm ui:build
```

任意の絶対ベース（固定アセット URL）:

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

ローカル開発（別個の開発サーバー）:

```bash
pnpm ui:dev
```

その後、UI を Gateway WS URL（例: `ws://127.0.0.1:18789`）に向けます。

## 空白の Control UI ページ

ブラウザーが空白のダッシュボードを読み込み、DevTools に有用なエラーが表示されない場合、拡張機能または早期のコンテンツスクリプトが JavaScript モジュールアプリの評価を妨げた可能性があります。静的ページには、起動後に `<openclaw-app>` が登録されていない場合に表示されるプレーン HTML の復旧パネルが含まれています。

ブラウザー環境を変更した後にパネルの **再試行** アクションを使うか、以下を確認した後に手動で再読み込みします。

- すべてのページに注入する拡張機能、特に `<all_urls>` コンテンツスクリプトを持つ拡張機能を無効化します。
- プライベートウィンドウ、クリーンなブラウザープロファイル、または別のブラウザーを試します。
- Gateway を実行したままにし、ブラウザー変更後に同じダッシュボード URL を確認します。

## デバッグ/テスト: 開発サーバー + リモート Gateway

Control UI は静的ファイルです。WebSocket ターゲットは設定可能で、HTTP オリジンと異なっていてもかまいません。これは、Vite 開発サーバーをローカルで使い、Gateway を別の場所で実行したい場合に便利です。

<Steps>
  <Step title="UI 開発サーバーを起動">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="gatewayUrl 付きで開く">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    任意の 1 回限りの認証（必要な場合）:

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="注記">
    - `gatewayUrl` は読み込み後に localStorage に保存され、URL から削除されます。
    - `gatewayUrl` で完全な `ws://` または `wss://` エンドポイントを渡す場合は、ブラウザーがクエリ文字列を正しく解析できるように値を URL エンコードしてください。
    - 可能な限り、`token` は URL フラグメント（`#token=...`）で渡してください。フラグメントはサーバーに送信されないため、リクエストログや Referer への漏えいを避けられます。レガシーな `?token=` クエリパラメーターは互換性のために一度だけ取り込まれますが、フォールバックとしてのみ扱われ、ブートストラップ直後に削除されます。
    - `password` はメモリ内にのみ保持されます。
    - `gatewayUrl` が設定されている場合、UI は設定や環境認証情報へフォールバックしません。`token`（または `password`）を明示的に指定してください。明示的な認証情報がない場合はエラーです。
    - Gateway が TLS（Tailscale Serve、HTTPS プロキシなど）の背後にある場合は `wss://` を使用してください。
    - クリックジャッキングを防ぐため、`gatewayUrl` はトップレベルウィンドウ（埋め込みではない）でのみ受け付けられます。
    - 公開された非ループバックの Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を明示的に設定する必要があります（完全なオリジン）。ループバック、RFC1918/link-local、`.local`、`.ts.net`、または Tailscale CGNAT ホストからのプライベートな同一オリジン LAN/Tailnet 読み込みは、Host ヘッダーフォールバックを有効にしなくても受け付けられます。
    - Gateway 起動時に、有効なランタイムのバインドとポートから `http://localhost:<port>` や `http://127.0.0.1:<port>` などのローカルオリジンがシードされることがありますが、リモートブラウザーのオリジンには引き続き明示的なエントリーが必要です。
    - 厳密に管理されたローカルテスト以外では、`gateway.controlUi.allowedOrigins: ["*"]` を使用しないでください。これは「使用しているホストに一致させる」ではなく、任意のブラウザーオリジンを許可するという意味です。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は Host ヘッダーのオリジンフォールバックモードを有効にしますが、危険なセキュリティモードです。

  </Accordion>
</AccordionGroup>

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

リモートアクセス設定の詳細: [リモートアクセス](/ja-JP/gateway/remote)。

## 関連

- [ダッシュボード](/ja-JP/web/dashboard) — Gateway ダッシュボード
- [ヘルスチェック](/ja-JP/gateway/health) — Gateway ヘルス監視
- [TUI](/ja-JP/web/tui) — ターミナルユーザーインターフェイス
- [WebChat](/ja-JP/web/webchat) — ブラウザーベースのチャットインターフェイス
