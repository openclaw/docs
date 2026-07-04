---
read_when:
    - ブラウザーから Gateway を操作したい
    - SSH トンネルなしで Tailnet アクセスを使いたい
sidebarTitle: Control UI
summary: Gateway 用のブラウザベースの制御 UI（チャット、アクティビティ、ノード、設定）
title: Control UI
x-i18n:
    generated_at: "2026-07-04T17:49:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00575a4633b192b6121145476c3b15b6b68cfd177322f409cacbb7ef331d09d
    source_path: web/control-ui.md
    workflow: 16
---

Control UI は、Gateway によって配信される小さな **Vite + Lit** シングルページアプリです。

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します（例: `/openclaw`）

同じポート上の **Gateway WebSocket に直接** 通信します。

## クイックオープン（ローカル）

Gateway が同じコンピューターで実行されている場合は、次を開きます。

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）

ページの読み込みに失敗する場合は、まず Gateway を起動します: `openclaw gateway`。

<Note>
ネイティブ Windows の LAN バインドでは、Gateway ホスト上で `127.0.0.1` が動作していても、Windows Firewall または組織管理の Group Policy によって、通知された LAN URL がブロックされる場合があります。Windows ホストで `openclaw gateway status --deep` を実行してください。ブロックされている可能性のあるポート、プロファイルの不一致、ポリシーが無視する可能性のあるローカルファイアウォールルールが報告されます。
</Note>

認証は WebSocket ハンドシェイク中に次を介して提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合の Tailscale Serve ID ヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合の信頼済みプロキシ ID ヘッダー

ダッシュボードの設定パネルは、現在のブラウザータブセッションと選択された Gateway URL に対してトークンを保持します。パスワードは永続化されません。オンボーディングでは通常、初回接続時に共有シークレット認証用の Gateway トークンが生成されますが、`gateway.auth.mode` が `"password"` の場合はパスワード認証も機能します。

## デバイスのペアリング（初回接続）

新しいブラウザーまたはデバイスから Control UI に接続すると、通常 Gateway は **1 回限りのペアリング承認**を要求します。これは不正アクセスを防ぐためのセキュリティ対策です。

**表示される内容:** 「disconnected (1008): pairing required」

<Steps>
  <Step title="保留中のリクエストを一覧表示">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="リクエスト ID で承認">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

ブラウザーが変更された認証詳細（ロール/スコープ/公開鍵）でペアリングを再試行すると、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認前に `openclaw devices list` を再実行してください。

ブラウザーがすでにペアリング済みで、読み取りアクセスから書き込み/管理者アクセスに変更した場合、これはサイレント再接続ではなく承認アップグレードとして扱われます。OpenClaw は古い承認を有効なまま保持し、より広い範囲の再接続をブロックし、新しいスコープセットを明示的に承認するよう求めます。

承認されるとデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り、再承認は不要です。トークンのローテーションと取り消しについては [デバイス CLI](/ja-JP/cli/devices) を参照してください。

`openclaw_gateway` アダプター経由で接続する Paperclip エージェントは、同じ初回実行承認フローを使用します。最初の接続試行後、`openclaw devices approve --latest` を実行して保留中リクエストをプレビューし、表示された `openclaw devices approve <requestId>` コマンドを再実行して承認します。リモート Gateway には明示的な `--url` と `--token` の値を渡してください。再起動後も承認を安定させるには、実行ごとに新しい一時的なデバイス ID を生成させる代わりに、Paperclip で永続的な `adapterConfig.devicePrivateKeyPem` を設定します。

<Note>
- 直接の local loopback ブラウザー接続（`127.0.0.1` / `localhost`）は自動承認されます。
- `gateway.auth.allowTailscale: true` で、Tailscale ID が検証され、ブラウザーがデバイス ID を提示する場合、Tailscale Serve は Control UI オペレーターセッションのペアリング往復を省略できます。
- 直接の Tailnet バインド、LAN ブラウザー接続、デバイス ID のないブラウザープロファイルでは、引き続き明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイス ID を生成するため、ブラウザーを切り替えたりブラウザーデータを消去したりすると、再ペアリングが必要になります。

</Note>

## モバイルデバイスをペアリングする

すでにペアリング済みの管理者は、ターミナルを開かずに iOS/Android 接続 QR を作成できます。

<Steps>
  <Step title="モバイルペアリングを開く">
    **Nodes** を選択し、**Devices** カード内の **Pair mobile device** をクリックします。
  </Step>
  <Step title="スマートフォンを接続">
    OpenClaw モバイルアプリで、**Settings** → **Gateway** を開き、QR コードをスキャンします。代わりにセットアップコードをコピーして貼り付けることもできます。
  </Step>
  <Step title="接続を確認">
    公式 iOS/Android アプリは自動的に接続します。**Devices** に保留中リクエストが表示される場合は、承認前にそのロールとスコープを確認してください。
  </Step>
</Steps>

セットアップコードの作成には `operator.admin` が必要です。これを持たないセッションではボタンが無効になります。セットアップコードには短命のブートストラップ認証情報が含まれるため、QR とコピーしたコードは有効な間、パスワードと同様に扱ってください。リモートペアリングでは、Gateway は `wss://` に解決される必要があります（たとえば Tailscale Serve/Funnel 経由）。プレーンな `ws://` はループバックとプライベート LAN アドレスに限定されます。完全なセキュリティとフォールバックの詳細については [ペアリング](/ja-JP/channels/pairing#pair-from-the-control-ui-recommended) を参照してください。

## 個人 ID（ブラウザーローカル）

Control UI は、共有セッションでの帰属表示のために、送信メッセージに紐づくブラウザーごとの個人 ID（表示名とアバター）をサポートします。これはブラウザーストレージに保存され、現在のブラウザープロファイルにスコープされ、他のデバイスへ同期されません。また、実際に送信したメッセージ上の通常のトランスクリプト作成者メタデータを超えてサーバー側に永続化されることもありません。サイトデータを消去するかブラウザーを切り替えると、空にリセットされます。

同じブラウザーローカルのパターンは、アシスタントアバターの上書きにも適用されます。アップロードされたアシスタントアバターは、ローカルブラウザー上でのみ Gateway が解決した ID に重ねられ、`config.patch` 経由で往復することはありません。共有 `ui.assistant.avatar` 設定フィールドは、このフィールドを直接書き込む非 UI クライアント（スクリプト化された Gateway やカスタムダッシュボードなど）向けに引き続き利用できます。

## ランタイム設定エンドポイント

Control UI はランタイム設定を `/control-ui-config.json` から取得します。これは Gateway の Control UI ベースパスを基準に解決されます（たとえば UI が `/__openclaw__/` 配下で配信される場合は `/__openclaw__/control-ui-config.json`）。そのエンドポイントは、HTTP サーフェスの残りと同じ Gateway 認証で保護されます。未認証のブラウザーは取得できず、取得に成功するには、すでに有効な Gateway トークン/パスワード、Tailscale Serve ID、または信頼済みプロキシ ID のいずれかが必要です。

## 言語サポート

Control UI は初回読み込み時に、ブラウザーのロケールに基づいて自身をローカライズできます。後から上書きするには、**Overview -> Gateway Access -> Language** を開きます。ロケールピッカーは Appearance ではなく Gateway Access カードにあります。

- サポートされるロケール: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 英語以外の翻訳はブラウザーで遅延読み込みされます。
- 選択したロケールはブラウザーストレージに保存され、以後の訪問で再利用されます。
- 不足している翻訳キーは英語にフォールバックします。

ドキュメント翻訳は同じ英語以外のロケールセットに対して生成されますが、ドキュメントサイトに組み込まれている Mintlify 言語ピッカーは、Mintlify が受け付けるロケールコードに限定されています。タイ語（`th`）とペルシア語（`fa`）のドキュメントは引き続き公開リポジトリで生成されますが、Mintlify がそれらのコードをサポートするまで、そのピッカーには表示されない場合があります。

## 外観テーマ

Appearance パネルには、組み込みの Claw、Knot、Dash テーマに加えて、ブラウザーローカルの tweakcn インポートスロットが 1 つあります。テーマをインポートするには、[tweakcn editor](https://tweakcn.com/editor/theme) を開き、テーマを選択または作成し、**Share** をクリックして、コピーしたテーマリンクを Appearance に貼り付けます。インポーターは `https://tweakcn.com/r/themes/<id>` レジストリ URL、`https://tweakcn.com/editor/theme?theme=amethyst-haze` のようなエディター URL、相対 `/themes/<id>` パス、生のテーマ ID、`amethyst-haze` のようなデフォルトテーマ名も受け付けます。

Appearance にはブラウザーローカルの Text size 設定も含まれます。この設定は Control UI 設定の残りと一緒に保存され、チャットテキスト、コンポーザーテキスト、ツールカード、チャットサイドバーに適用されます。また、モバイル Safari がフォーカス時に自動ズームしないよう、テキスト入力を少なくとも 16px に保ちます。

インポートされたテーマは現在のブラウザープロファイルにのみ保存されます。Gateway 設定には書き込まれず、デバイス間で同期されません。インポート済みテーマを置き換えると、1 つのローカルスロットが更新されます。消去すると、インポート済みテーマが選択されていた場合はアクティブテーマが Claw に戻ります。

## できること（現在）

<AccordionGroup>
  <Accordion title="チャットとトーク">
    - Gateway WS 経由でモデルとチャットします（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）。
    - チャット履歴の更新では、メッセージごとのテキスト上限を持つ制限付きの最近の範囲をリクエストするため、大規模セッションでも、チャットが使用可能になる前にブラウザーが完全なトランスクリプトペイロードを描画する必要はありません。
    - ブラウザーのリアルタイムセッションを通じてトークします。OpenAI は直接 WebRTC を使用し、Google Live は WebSocket 上の制限付き 1 回限りブラウザートークンを使用し、バックエンド専用のリアルタイム音声 Plugin は Gateway リレートランスポートを使用します。クライアント所有のプロバイダーセッションは `talk.client.create` で開始し、Gateway リレーセッションは `talk.session.create` で開始します。リレーはプロバイダー認証情報を Gateway 上に保持しつつ、ブラウザーが `talk.session.appendAudio` 経由でマイク PCM をストリーミングし、Gateway ポリシーと設定済みのより大きな OpenClaw モデルのために `openclaw_agent_consult` プロバイダーツール呼び出しを `talk.client.toolCall` 経由で転送し、アクティブ実行中の音声ステアリングを `talk.client.steer` または `talk.session.steer` 経由でルーティングします。
    - チャットでツール呼び出しとライブツール出力カードをストリーミングします（エージェントイベント）。
    - 既存の `session.tool` / ツールイベント配信からのライブツールアクティビティについて、ブラウザーローカルで秘匿優先の要約を表示する Activity タブ。

  </Accordion>
  <Accordion title="チャンネル、インスタンス、セッション、Dreaming">
    - チャンネル: 組み込みおよびバンドル/外部 Plugin チャンネルのステータス、QR ログイン、チャンネルごとの設定（`channels.status`, `web.login.*`, `config.patch`）。
    - チャンネルプローブの更新では、遅いプロバイダーチェックが完了するまで前回のスナップショットを表示したままにし、プローブまたは監査が UI 予算を超えた場合は部分スナップショットにラベルが付けられます。
    - インスタンス: プレゼンス一覧と更新（`system-presence`）。
    - セッション: デフォルトで設定済みエージェントセッションを一覧表示し、古い未設定エージェントセッションキーからフォールバックし、セッションごとのモデル/思考/高速/詳細/トレース/推論の上書きを適用します（`sessions.list`, `sessions.patch`）。
    - Dreaming: Dreaming ステータス、有効/無効トグル、Dream Diary リーダー（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）。

  </Accordion>
  <Accordion title="Cron、Skills、ノード、実行承認">
    - Cron ジョブ: 一覧表示/追加/編集/実行/有効化/無効化 + 実行履歴（`cron.*`）。
    - Skills: ステータス、有効化/無効化、インストール、API キー更新（`skills.*`）。
    - ノード: 一覧と機能（`node.list`）、モバイルセットアップコードの作成、デバイスペアリングの承認（`device.pair.*`）。
    - 実行承認: Gateway またはノードの許可リストと、`exec host=gateway/node` の ask ポリシーを編集します（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="設定">
    - `~/.openclaw/openclaw.json` を表示/編集します（`config.get`、`config.set`）。
    - MCP には、設定済みサーバー、有効化、OAuth/フィルター/並列サマリー、一般的なオペレーターコマンド、スコープ付き `mcp` 設定エディター専用の設定ページがあります。
    - 検証付きで適用 + 再起動し（`config.apply`）、最後にアクティブだったセッションを起動します。
    - 書き込みには、同時編集の上書きを防ぐためのベースハッシュガードが含まれます。
    - 書き込み（`config.set`/`config.apply`/`config.patch`）は、送信された設定ペイロード内の参照について、アクティブな SecretRef 解決を事前チェックします。未解決のアクティブな送信済み参照は、書き込み前に拒否されます。
    - フォーム保存では、保存済み設定から復元できない古い編集済みプレースホルダーを破棄しつつ、保存済みシークレットにまだ対応する編集済み値は保持します。
    - スキーマ + フォームレンダリング（`config.schema` / `config.schema.lookup`。フィールドの `title` / `description`、一致した UI ヒント、直下の子サマリー、ネストされたオブジェクト/ワイルドカード/配列/合成ノードの docs メタデータ、利用可能な場合は Plugin + チャンネルスキーマを含む）。Raw JSON エディターは、スナップショットが安全な raw ラウンドトリップを持つ場合にのみ利用できます。
    - スナップショットが raw テキストを安全にラウンドトリップできない場合、Control UI はそのスナップショットに対してフォームモードを強制し、Raw モードを無効にします。
    - Raw JSON エディターの「保存済みにリセット」は、フラット化されたスナップショットを再レンダリングする代わりに、raw で作成された形（フォーマット、コメント、`$include` レイアウト）を保持するため、スナップショットが安全にラウンドトリップできる場合は、外部編集がリセット後も残ります。
    - 構造化された SecretRef オブジェクト値は、誤ってオブジェクトから文字列へ破損することを防ぐため、フォームのテキスト入力では読み取り専用としてレンダリングされます。

  </Accordion>
  <Accordion title="デバッグ、ログ、更新">
    - デバッグ: status/health/models スナップショット + イベントログ + 手動 RPC 呼び出し（`status`、`health`、`models.list`）。
    - イベントログには、Control UI の更新/RPC タイミング、遅いチャット/設定レンダリングのタイミング、およびブラウザーがそれらの PerformanceObserver エントリタイプを公開している場合の長いアニメーションフレームや長いタスクに関するブラウザー応答性エントリが含まれます。
    - ログ: Gateway ファイルログのライブテールとフィルター/エクスポート（`logs.tail`）。
    - 更新: 再起動レポート付きでパッケージ/git 更新 + 再起動を実行し（`update.run`）、再接続後に `update.status` をポーリングして実行中の Gateway バージョンを検証します。

  </Accordion>
  <Accordion title="Cron ジョブパネルの注記">
    - 分離ジョブでは、配信のデフォルトはサマリーの通知です。内部専用の実行にしたい場合は none に切り替えられます。
    - announce が選択されている場合、チャンネル/ターゲットフィールドが表示されます。
    - Webhook モードでは、`delivery.mode = "webhook"` を使用し、`delivery.to` に有効な HTTP(S) webhook URL を設定します。
    - メインセッションジョブでは、webhook と none の配信モードを利用できます。
    - 高度な編集コントロールには、実行後削除、エージェント上書きのクリア、cron exact/stagger オプション、エージェントのモデル/thinking 上書き、ベストエフォート配信の切り替えが含まれます。
    - フォーム検証はフィールド単位のエラーとしてインライン表示されます。無効な値がある場合、修正されるまで保存ボタンは無効になります。
    - 専用の bearer token を送信するには `cron.webhookToken` を設定します。省略した場合、webhook は auth ヘッダーなしで送信されます。
    - 非推奨のフォールバック: `notify: true` を持つ保存済みレガシージョブを `cron.webhook` からジョブごとの明示的な webhook または完了配信へ移行するには、`openclaw doctor --fix` を実行します。

  </Accordion>
</AccordionGroup>

## MCP ページ

専用の MCP ページは、`mcp.servers` 配下の OpenClaw 管理 MCP サーバー向けのオペレータービューです。それ自体では MCP トランスポートを開始しません。保存済み設定を確認および編集し、ライブサーバーの証拠が必要な場合は `openclaw mcp doctor --probe` を使用します。

一般的なワークフロー:

1. サイドバーから **MCP** を開きます。
2. サマリーカードで合計、有効、OAuth、フィルター済みサーバー数を確認します。
3. 各サーバー行で、トランスポート、有効化、認証、フィルター、タイムアウト、コマンドヒントを確認します。
4. サーバーを設定済みのままにしつつランタイム検出から除外したい場合は、有効化を切り替えます。
5. サーバー定義、ヘッダー、TLS/mTLS パス、OAuth メタデータ、ツールフィルター、Codex 投影メタデータについて、スコープ付き `mcp` 設定セクションを編集します。
6. 設定を書き込むには **保存** を使用し、実行中の Gateway に変更済み設定を適用させる場合は **保存して公開** を使用します。
7. 編集したプロセスに静的診断、ライブ証拠、またはキャッシュ済みランタイムの破棄が必要な場合は、ターミナルから `openclaw mcp status --verbose`、`openclaw mcp doctor --probe`、または `openclaw mcp reload` を実行します。

このページは、認証情報を含む URL 形式の値をレンダリング前に編集し、コマンドスニペット内のサーバー名を引用符で囲むため、コピーしたコマンドはスペースやシェルメタ文字を含む場合でも動作します。CLI と設定の完全なリファレンスは [MCP](/ja-JP/cli/mcp) にあります。

## アクティビティタブ

アクティビティタブは、ライブツールアクティビティの一時的なブラウザーローカルオブザーバーです。これは Chat ツールカードを支えるものと同じ Gateway `session.tool` / ツールイベントストリームから派生します。別の Gateway イベントファミリー、エンドポイント、永続的なアクティビティストア、メトリクスフィード、外部オブザーバーストリームは追加しません。

アクティビティエントリは、サニタイズされたサマリーと、編集済みで切り詰められた出力プレビューのみを保持します。ツール引数値はアクティビティ状態に保存されません。UI は引数が非表示であることを示し、引数フィールド数のみを記録します。メモリ内リストは現在のブラウザータブに追従し、Control UI 内のナビゲーションでは維持され、ページ再読み込み、セッション切り替え、または **クリア** でリセットされます。

## チャットの動作

<AccordionGroup>
  <Accordion title="送信と履歴のセマンティクス">
    - `chat.send` は **非ブロッキング** です。`{ runId, status: "started" }` ですぐに ack し、応答は `chat` イベント経由でストリーミングされます。信頼済みの Control UI クライアントは、ローカル診断用に任意の ACK タイミングメタデータを受け取る場合もあります。
    - チャットアップロードは、画像と動画以外のファイルを受け入れます。画像はネイティブ画像パスを保持します。それ以外のファイルは管理対象メディアとして保存され、履歴では添付リンクとして表示されます。
    - 同じ `idempotencyKey` で再送信すると、実行中は `{ status: "in_flight" }` が返り、完了後は `{ status: "ok" }` が返ります。
    - `chat.history` 応答は UI の安全性のためサイズ制限されます。トランスクリプトエントリが大きすぎる場合、Gateway は長いテキストフィールドを切り詰め、重いメタデータブロックを省略し、過大なメッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えることがあります。
    - 表示可能なアシスタントメッセージが `chat.history` で切り詰められた場合、サイドリーダーは `sessionKey`、必要に応じてアクティブな `agentId`、およびトランスクリプト `messageId` を指定して、`chat.message.get` 経由で表示正規化済みの完全なトランスクリプトエントリをオンデマンド取得できます。Gateway がそれでもさらに返せない場合、リーダーは切り詰められたプレビューを黙って繰り返すのではなく、明示的な利用不可状態を表示します。
    - アシスタント/生成画像は管理対象メディア参照として永続化され、認証済み Gateway メディア URL 経由で返されるため、再読み込みは raw base64 画像ペイロードがチャット履歴応答に残っていることに依存しません。
    - `chat.history` をレンダリングする際、Control UI は表示されるアシスタントテキストから表示専用のインラインディレクティブタグ（例: `[[reply_to_*]]` と `[[audio_as_voice]]`）、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、漏洩した ASCII/全角のモデル制御トークンを取り除き、表示テキスト全体が厳密なサイレントトークン `NO_REPLY` / `no_reply` または heartbeat acknowledgement token `HEARTBEAT_OK` のみであるアシスタントエントリを省略します。
    - アクティブな送信中および最終履歴更新中に、`chat.history` が一時的に古いスナップショットを返した場合でも、チャットビューはローカルの楽観的なユーザー/アシスタントメッセージを表示し続けます。Gateway 履歴が追いつくと、正準トランスクリプトがそれらのローカルメッセージを置き換えます。
    - ライブ `chat` イベントは配信状態であり、`chat.history` は永続的なセッショントランスクリプトから再構築されます。ツール最終イベントの後、Control UI は履歴を再読み込みし、小さな楽観的末尾のみをマージします。トランスクリプト境界は [WebChat](/ja-JP/web/webchat) に記載されています。
    - `chat.inject` はセッションのトランスクリプトにアシスタントノートを追加し、UI のみの更新のために `chat` イベントをブロードキャストします（エージェント実行なし、チャンネル配信なし）。
    - サイドバーには、New Session アクション、All Sessions リンク、完全なセッションピッカーを開くセッション検索ボタン付きで最近のセッションが一覧表示されます（選択されたエージェントでスコープされ、検索とページネーション付き）。エージェントを切り替えると、そのエージェントに紐づくセッションのみが表示され、保存済みダッシュボードセッションがまだない場合はそのエージェントのメインセッションにフォールバックします。
    - デスクトップ幅では、チャットコントロールはコンパクトな 1 行に留まり、トランスクリプトを下にスクロールしている間は折りたたまれます。上にスクロールする、先頭に戻る、または末尾に到達すると、コントロールが復元されます。
    - 連続する重複したテキストのみのメッセージは、件数バッジ付きの 1 つの吹き出しとしてレンダリングされます。画像、添付、ツール出力、またはキャンバスプレビューを含むメッセージは折りたたまれません。
    - チャットヘッダーのモデルおよび thinking ピッカーは、`sessions.patch` 経由でアクティブセッションに即座にパッチを適用します。これらは永続的なセッション上書きであり、1 ターン限定の送信オプションではありません。
    - 同じセッションのモデルピッカー変更がまだ保存中の間にメッセージを送信した場合、コンポーザーは `chat.send` を呼び出す前にそのセッションパッチを待機するため、送信には選択されたモデルが使用されます。
    - Control UI で `/new` と入力すると、New Chat と同じ新しいダッシュボードセッションを作成して切り替えます。ただし、`session.dmScope: "main"` が設定されていて、現在の親がエージェントのメインセッションである場合は、そのメインセッションをその場でリセットします。`/reset` と入力すると、現在のセッションに対する Gateway の明示的なその場リセットが維持されます。
    - チャットモデルピッカーは、Gateway の設定済みモデルビューを要求します。`agents.defaults.models` が存在する場合、その許可リストがピッカーを駆動します。これには、プロバイダースコープのカタログを動的に保つ `provider/*` エントリも含まれます。それ以外の場合、ピッカーは明示的な `models.providers.*.models` エントリと、利用可能な認証を持つプロバイダーを表示します。完全なカタログは、`view: "all"` を指定したデバッグ `models.list` RPC から引き続き利用できます。
    - 新しい Gateway セッション使用状況レポートに現在のコンテキストトークンが含まれる場合、チャットコンポーザーツールバーは使用率を示す小さなコンテキスト使用量リングを表示します。完全なトークン詳細はツールチップにあります。高いコンテキスト圧力ではリングが警告スタイルに切り替わり、推奨される Compaction レベルでは、通常のセッション Compaction パスを実行するコンパクトなボタンを表示します。古いトークンスナップショットは、Gateway が新しい使用状況を再度報告するまで非表示になります。

  </Accordion>
  <Accordion title="トークモード（ブラウザーリアルタイム）">
    トークモードは登録済みのリアルタイム音声プロバイダーを使用します。OpenAI を設定するには、`talk.realtime.provider: "openai"` に加えて、`openai` API キー認証プロファイル、`talk.realtime.providers.openai.apiKey`、または `OPENAI_API_KEY` を使用します。OpenAI OAuth プロファイルは Realtime 音声を設定しません。Google を設定するには、`talk.realtime.provider: "google"` に加えて `talk.realtime.providers.google.apiKey` を使用します。ブラウザーが標準のプロバイダー API キーを受け取ることはありません。OpenAI は WebRTC 用の一時的な Realtime クライアントシークレットを受け取ります。Google Live は、ブラウザー WebSocket セッション用の 1 回限りの制約付き Live API 認証トークンを受け取ります。このトークンには、Gateway によって命令とツール宣言が固定されています。バックエンドリアルタイムブリッジのみを公開するプロバイダーは Gateway リレートランスポート経由で実行されるため、認証情報とベンダーソケットはサーバー側に留まり、ブラウザー音声は認証済み Gateway RPC 経由で移動します。Realtime セッションプロンプトは Gateway によって組み立てられます。`talk.client.create` は呼び出し元提供の命令上書きを受け入れません。

    Chat コンポーザーには、Talk 開始/停止ボタンの隣に Talk オプションボタンがあります。このオプションは次の Talk セッションに適用され、プロバイダー、トランスポート、モデル、音声、推論エフォート、VAD しきい値、無音時間、プレフィックスパディングを上書きできます。オプションが空欄の場合、Gateway は利用可能な設定済みデフォルト、またはプロバイダーのデフォルトを使用します。Gateway リレーを選択するとバックエンドのリレーパスが強制されます。WebRTC を選択するとセッションはクライアント所有のままとなり、プロバイダーがブラウザーセッションを作成できない場合に暗黙的にリレーへフォールバックするのではなく失敗します。

    Chat コンポーザーでは、Talk コントロールはマイクのディクテーションボタンの隣にある波形ボタンです。Talk が開始すると、コンポーザーのステータス行にはまず `Connecting Talk...` が表示され、その後、音声が接続されている間は `Talk live`、またはリアルタイムのツール呼び出しが `talk.client.toolCall` を通じて設定済みのより大きなモデルに問い合わせている間は `Asking OpenClaw...` が表示されます。

    メンテナー向けライブスモーク: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` は、OpenAI バックエンド WebSocket ブリッジ、OpenAI ブラウザー WebRTC SDP 交換、Google Live の制約付きトークンブラウザー WebSocket セットアップ、および偽のマイクメディアを使った Gateway リレーブラウザーアダプターを検証します。このコマンドはプロバイダーのステータスのみを出力し、シークレットはログに記録しません。

  </Accordion>
  <Accordion title="停止と中止">
    - **Stop** をクリックします（`chat.abort` を呼び出します）。
    - 実行がアクティブな間、通常のフォローアップはキューに入ります。キュー内のメッセージで **Steer** をクリックすると、そのフォローアップを実行中のターンへ注入できます。
    - `/stop`（または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` のような単独の中止フレーズ）を入力すると、帯域外で中止します。
    - `chat.abort` は、そのセッションのすべてのアクティブな実行を中止するために `{ sessionKey }`（`runId` なし）をサポートします。

  </Accordion>
  <Accordion title="中止時の部分保持">
    - 実行が中止された場合でも、部分的なアシスタントテキストが UI に表示されることがあります。
    - Gateway は、バッファされた出力が存在する場合、中止された部分的なアシスタントテキストをトランスクリプト履歴に永続化します。
    - 永続化されたエントリには中止メタデータが含まれるため、トランスクリプトの利用側は中止時の部分出力と通常の完了出力を区別できます。

  </Accordion>
</AccordionGroup>

## PWA インストールと Web Push

Control UI は `manifest.webmanifest` とサービスワーカーを同梱しているため、モダンブラウザーではスタンドアロン PWA としてインストールできます。Web Push により、タブやブラウザーウィンドウが開いていない場合でも、Gateway は通知でインストール済み PWA を起動できます。

OpenClaw の更新直後にページに **Protocol mismatch** が表示される場合は、まず `openclaw dashboard` でダッシュボードを開き直し、ページをハードリフレッシュしてください。それでも失敗する場合は、ダッシュボードのオリジンのサイトデータを消去するか、プライベートブラウザーウィンドウでテストしてください。古いタブやブラウザーのサービスワーカーキャッシュが、更新前の Control UI バンドルを新しい Gateway に対して実行し続けることがあります。

| サーフェス                                            | 機能                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA マニフェスト。到達可能になると、ブラウザーが「アプリをインストール」を提示します。 |
| `ui/public/sw.js`                                     | `push` イベントと通知クリックを処理するサービスワーカー。          |
| `push/vapid-keys.json`（OpenClaw 状態ディレクトリ配下） | Web Push ペイロードの署名に使用される、自動生成された VAPID キーペア。 |
| `push/web-push-subscriptions.json`                    | 永続化されたブラウザー購読エンドポイント。                         |

キーを固定したい場合（マルチホストデプロイ、シークレットローテーション、またはテストのため）は、Gateway プロセスの環境変数で VAPID キーペアを上書きします。

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（デフォルトは `https://openclaw.ai`）

Control UI は、ブラウザー購読の登録とテストに、これらのスコープ制限付き Gateway メソッドを使用します。

- `push.web.vapidPublicKey` — アクティブな VAPID 公開鍵を取得します。
- `push.web.subscribe` — `endpoint` と `keys.p256dh`/`keys.auth` を登録します。
- `push.web.unsubscribe` — 登録済みエンドポイントを削除します。
- `push.web.test` — 呼び出し元の購読へテスト通知を送信します。

<Note>
Web Push は、iOS APNS リレーパス（リレー支援の push については [設定](/ja-JP/gateway/configuration) を参照）および既存の `push.test` メソッドとは独立しています。これらはネイティブモバイルのペアリングを対象にしています。
</Note>

## ホストされた埋め込み

アシスタントメッセージは、`[embed ...]` ショートコードでホストされた Web コンテンツをインライン表示できます。iframe サンドボックスポリシーは `gateway.controlUi.embedSandbox` で制御されます。

<Tabs>
  <Tab title="strict">
    ホストされた埋め込み内でのスクリプト実行を無効にします。
  </Tab>
  <Tab title="scripts（デフォルト）">
    オリジン分離を維持しながらインタラクティブな埋め込みを許可します。これはデフォルトであり、通常は自己完結型のブラウザーゲームやウィジェットには十分です。
  </Tab>
  <Tab title="trusted">
    より強い権限を意図的に必要とする同一サイトドキュメント向けに、`allow-scripts` に加えて `allow-same-origin` を追加します。
  </Tab>
</Tabs>

例:

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
埋め込みドキュメントが本当に同一オリジンの動作を必要とする場合にのみ `trusted` を使用してください。ほとんどのエージェント生成ゲームやインタラクティブキャンバスでは、`scripts` の方が安全な選択です。
</Warning>

絶対外部 `http(s)` 埋め込み URL は、デフォルトでは引き続きブロックされます。`[embed url="https://..."]` でサードパーティページを読み込むことを意図している場合は、`gateway.controlUi.allowExternalEmbedUrls: true` を設定してください。

## Chat メッセージ幅

グループ化された Chat メッセージは、読みやすいデフォルトの最大幅を使用します。ワイドモニターのデプロイでは、同梱 CSS にパッチを当てずに `gateway.controlUi.chatMessageMaxWidth` を設定して上書きできます。

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

この値はブラウザーへ届く前に検証されます。サポートされる値には、`960px` や `82%` のような単純な長さやパーセンテージに加え、制約付きの `min(...)`、`max(...)`、`clamp(...)`、`calc(...)`、`fit-content(...)` 幅式が含まれます。

## tailnet アクセス（推奨）

<Tabs>
  <Tab title="統合 Tailscale Serve（推奨）">
    Gateway をループバックに維持し、Tailscale Serve に HTTPS でプロキシさせます。

    ```bash
    openclaw gateway --tailscale serve
    ```

    開く:

    - `https://<magicdns>/`（または設定済みの `gateway.controlUi.basePath`）

    デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket Serve リクエストは Tailscale アイデンティティヘッダー（`tailscale-user-login`）で認証できます。OpenClaw は、`x-forwarded-for` アドレスを `tailscale whois` で解決してヘッダーと照合することでアイデンティティを検証し、リクエストが Tailscale の `x-forwarded-*` ヘッダー付きでループバックに到達した場合にのみ受け入れます。ブラウザーデバイスアイデンティティを持つ Control UI オペレーターセッションでは、この検証済み Serve パスはデバイスペアリングの往復も省略します。デバイスなしブラウザーとノードロール接続は、通常のデバイスチェックに従います。Serve トラフィックであっても明示的な共有シークレット認証情報を必須にしたい場合は、`gateway.auth.allowTailscale: false` を設定します。その場合は `gateway.auth.mode: "token"` または `"password"` を使用してください。

    その非同期 Serve アイデンティティパスでは、同じクライアント IP と認証スコープに対する失敗した認証試行は、レート制限の書き込み前に直列化されます。そのため、同じブラウザーからの同時の不正な再試行では、2 つの単純な不一致が並列に競合するのではなく、2 回目のリクエストで `retry later` が表示されることがあります。

    <Warning>
    トークンなしの Serve 認証は、Gateway ホストが信頼されていることを前提とします。そのホスト上で信頼できないローカルコードが実行される可能性がある場合は、トークン/パスワード認証を必須にしてください。
    </Warning>

  </Tab>
  <Tab title="tailnet にバインド + トークン">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    次に開く:

    - `http://<tailscale-ip>:18789/`（または設定済みの `gateway.controlUi.basePath`）

    一致する共有シークレットを UI 設定に貼り付けます（`connect.params.auth.token` または `connect.params.auth.password` として送信されます）。

  </Tab>
</Tabs>

## セキュアでない HTTP

プレーン HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、ブラウザーは **非セキュアコンテキスト** で実行され、WebCrypto をブロックします。デフォルトでは、OpenClaw はデバイスアイデンティティのない Control UI 接続を **ブロック** します。

文書化された例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost 限定のセキュアでない HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` を通じた Control UI オペレーター認証の成功
- 緊急用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS（Tailscale Serve）を使用するか、UI をローカルで開きます。

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（Gateway ホスト上）

<AccordionGroup>
  <Accordion title="セキュアでない認証トグルの動作">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` はローカル互換性トグルに限られます。

    - 非セキュア HTTP コンテキストで、localhost の Control UI セッションがデバイスアイデンティティなしで続行できるようにします。
    - ペアリングチェックはバイパスしません。
    - リモート（localhost 以外）のデバイスアイデンティティ要件は緩和しません。

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
    `dangerouslyDisableDeviceAuth` は Control UI のデバイスアイデンティティチェックを無効にし、重大なセキュリティ低下になります。緊急利用後はすぐに元に戻してください。
    </Warning>

  </Accordion>
  <Accordion title="trusted-proxy の注記">
    - trusted-proxy 認証に成功すると、デバイスアイデンティティなしで **オペレーター** Control UI セッションを許可できます。
    - これはノードロールの Control UI セッションには拡張されません。
    - 同一ホストのループバックリバースプロキシでも trusted-proxy 認証は満たされません。[Trusted proxy auth](/ja-JP/gateway/trusted-proxy-auth) を参照してください。

  </Accordion>
</AccordionGroup>

HTTPS セットアップのガイダンスについては [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## コンテンツセキュリティポリシー

Control UI には厳格な `img-src` ポリシーが同梱されています。許可されるのは **同一オリジン** アセット、`data:` URL、ローカルで生成された `blob:` URL のみです。リモート `http(s)` およびプロトコル相対の画像 URL はブラウザーによって拒否され、ネットワークフェッチは発行されません。

実際には、これは次のことを意味します。

- 相対パス（例: `/avatars/<id>`）配下で提供されるアバターと画像は、UI が取得してローカル `blob:` URL に変換する認証済みアバタールートを含め、引き続きレンダリングされます。
- インライン `data:image/...` URL は引き続きレンダリングされます（プロトコル内ペイロードに有用です）。
- Control UI によって作成されたローカル `blob:` URL は引き続きレンダリングされます。
- チャンネルメタデータによって出力されたリモートアバター URL は、Control UI のアバターヘルパーで除去され、組み込みのロゴ/バッジに置き換えられます。そのため、侵害された、または悪意のあるチャンネルがオペレーターブラウザーから任意のリモート画像フェッチを強制することはできません。

この動作を得るために何かを変更する必要はありません。常に有効であり、設定できません。

## アバタールート認証

Gateway 認証が設定されている場合、Control UI のアバターエンドポイントは API の他の部分と同じ Gateway トークンを要求します。

- `GET /avatar/<agentId>` は、認証済み呼び出し元にのみアバター画像を返します。`GET /avatar/<agentId>?meta=1` は、同じルールの下でアバターメタデータを返します。
- どちらのルートへの未認証リクエストも拒否されます（兄弟の assistant-media ルートと一致します）。これにより、他の点では保護されているホストでアバタールートがエージェントアイデンティティを漏えいすることを防ぎます。
- Control UI 自体は、アバター取得時に Gateway トークンを bearer ヘッダーとして転送し、認証済み blob URL を使用するため、画像はダッシュボード内で引き続きレンダリングされます。

Gateway 認証を無効にした場合（共有ホストでは非推奨）、アバタールートも Gateway の他の部分と同様に未認証になります。

## アシスタントメディアルートの認証

Gateway 認証が設定されている場合、アシスタントのローカルメディアプレビューは 2 段階のルートを使用します。

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` には通常の Control UI オペレーター認証が必要です。ブラウザーは可用性を確認するとき、Gateway トークンを bearer ヘッダーとして送信します。
- 成功したメタデータレスポンスには、その正確なソースパスにスコープされた短命の `mediaTicket` が含まれます。
- ブラウザーでレンダリングされる画像、音声、動画、ドキュメントの URL は、アクティブな Gateway トークンやパスワードではなく `mediaTicket=<ticket>` を使用します。チケットはすぐに期限切れになり、別のソースを認可できません。

これにより、再利用可能な Gateway 認証情報を表示可能なメディア URL に入れずに、通常のメディアレンダリングをブラウザー標準のメディア要素と互換に保てます。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを配信します。次でビルドします。

```bash
pnpm ui:build
```

任意の絶対ベース（固定アセット URL が必要な場合）:

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

ローカル開発用（別の開発サーバー）:

```bash
pnpm ui:dev
```

その後、UI を Gateway WS URL（例: `ws://127.0.0.1:18789`）に向けます。

## 空白の Control UI ページ

ブラウザーが空白のダッシュボードを読み込み、DevTools に有用なエラーが表示されない場合、拡張機能または早期のコンテンツスクリプトが JavaScript モジュールアプリの評価を妨げている可能性があります。静的ページには、起動後に `<openclaw-app>` が登録されていない場合に表示されるプレーンな HTML 復旧パネルが含まれています。

ブラウザー環境を変更した後にパネルの **Try again** アクションを使用するか、次の確認後に手動で再読み込みしてください。

- すべてのページに挿入される拡張機能、特に `<all_urls>` コンテンツスクリプトを持つ拡張機能を無効にします。
- プライベートウィンドウ、クリーンなブラウザープロファイル、または別のブラウザーを試します。
- Gateway を実行したままにし、ブラウザー変更後に同じダッシュボード URL を確認します。

## デバッグ/テスト: 開発サーバー + リモート Gateway

Control UI は静的ファイルです。WebSocket ターゲットは設定可能で、HTTP オリジンと異なっていてもかまいません。これは、Vite 開発サーバーをローカルで使い、Gateway を別の場所で実行したい場合に便利です。

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
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
  <Accordion title="Notes">
    - `gatewayUrl` は読み込み後に localStorage に保存され、URL から削除されます。
    - `gatewayUrl` 経由で完全な `ws://` または `wss://` エンドポイントを渡す場合、ブラウザーがクエリ文字列を正しく解析できるように `gatewayUrl` 値を URL エンコードしてください。
    - `token` は可能な限り URL フラグメント（`#token=...`）経由で渡してください。フラグメントはサーバーに送信されないため、リクエストログや Referer の漏えいを避けられます。レガシーの `?token=` クエリパラメーターは互換性のためにまだ 1 回だけインポートされますが、フォールバックとしてのみであり、ブートストラップ直後に削除されます。
    - `password` はメモリ内にのみ保持されます。
    - `gatewayUrl` が設定されている場合、UI は config や環境の認証情報にフォールバックしません。`token`（または `password`）を明示的に指定してください。明示的な認証情報がない場合はエラーです。
    - Gateway が TLS（Tailscale Serve、HTTPS プロキシなど）の背後にある場合は `wss://` を使用してください。
    - `gatewayUrl` はクリックジャッキングを防ぐため、トップレベルウィンドウ（埋め込みではない）でのみ受け入れられます。
    - 公開の非ループバック Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を明示的に設定する必要があります（完全なオリジン）。ループバック、RFC1918/link-local、`.local`、`.ts.net`、または Tailscale CGNAT ホストからのプライベートな同一オリジン LAN/Tailnet 読み込みは、Host ヘッダーフォールバックを有効にしなくても受け入れられます。
    - Gateway の起動時に、有効なランタイムの bind とポートから `http://localhost:<port>` や `http://127.0.0.1:<port>` などのローカルオリジンがシードされる場合がありますが、リモートブラウザーのオリジンには引き続き明示的なエントリーが必要です。
    - 厳密に制御されたローカルテストを除き、`gateway.controlUi.allowedOrigins: ["*"]` を使用しないでください。これは「使用中の任意のホストに一致する」ではなく、任意のブラウザーオリジンを許可することを意味します。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は Host ヘッダーオリジンフォールバックモードを有効にしますが、危険なセキュリティモードです。

  </Accordion>
</AccordionGroup>

例:

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
