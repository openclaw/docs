---
read_when:
    - ブラウザーから Gateway を操作したい
    - SSH トンネルなしで Tailnet アクセスを使いたい
sidebarTitle: Control UI
summary: Gateway 用のブラウザベースのコントロール UI（チャット、アクティビティ、ノード、設定）
title: コントロール UI
x-i18n:
    generated_at: "2026-06-27T13:23:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc8b9675454d57bbfb6be10bb7ef94152a89a72c94affdf72be8c79cf14cbb08
    source_path: web/control-ui.md
    workflow: 16
---

Control UI は、Gateway によって配信される小さな **Vite + Lit** シングルページアプリです。

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します（例: `/openclaw`）

同じポート上の **Gateway WebSocket と直接**通信します。

## クイックオープン（ローカル）

Gateway が同じコンピューターで実行されている場合は、次を開きます。

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）

ページの読み込みに失敗する場合は、先に Gateway を起動します: `openclaw gateway`

認証は WebSocket ハンドシェイク中に次で提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合の Tailscale Serve ID ヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合の信頼済みプロキシ ID ヘッダー

ダッシュボード設定パネルは、現在のブラウザータブセッションと選択されたゲートウェイ URL 用のトークンを保持します。パスワードは永続化されません。オンボーディングでは通常、初回接続時に共有シークレット認証用のゲートウェイトークンが生成されますが、`gateway.auth.mode` が `"password"` の場合はパスワード認証も機能します。

## デバイスペアリング（初回接続）

新しいブラウザーまたはデバイスから Control UI に接続すると、Gateway は通常、**1 回限りのペアリング承認**を要求します。これは不正アクセスを防ぐためのセキュリティ対策です。

**表示される内容:** "disconnected (1008): pairing required"

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

ブラウザーがすでにペアリング済みで、読み取りアクセスから書き込み/管理者アクセスへ変更する場合、これは暗黙の再接続ではなく承認アップグレードとして扱われます。OpenClaw は古い承認を有効なまま維持し、より広い権限での再接続をブロックし、新しいスコープセットを明示的に承認するよう求めます。

承認されるとデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り、再承認は不要です。トークンローテーションと取り消しについては [デバイス CLI](/ja-JP/cli/devices) を参照してください。

`openclaw_gateway` アダプター経由で接続する Paperclip エージェントは、同じ初回実行時の承認フローを使用します。最初の接続試行後、`openclaw devices approve --latest` を実行して保留中のリクエストをプレビューし、表示された `openclaw devices approve <requestId>` コマンドを再実行して承認します。リモートゲートウェイには明示的な `--url` と `--token` の値を渡してください。再起動をまたいで承認を安定させるには、実行ごとに新しい一時的なデバイス ID を生成させるのではなく、Paperclip で永続的な `adapterConfig.devicePrivateKeyPem` を設定します。

<Note>
- 直接の local loopback ブラウザー接続（`127.0.0.1` / `localhost`）は自動承認されます。
- `gateway.auth.allowTailscale: true` で、Tailscale ID が検証され、ブラウザーがデバイス ID を提示する場合、Tailscale Serve は Control UI オペレーターセッションのペアリング往復をスキップできます。
- 直接の Tailnet バインド、LAN ブラウザー接続、デバイス ID のないブラウザープロファイルでは、引き続き明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイス ID を生成するため、ブラウザーの切り替えやブラウザーデータの消去には再ペアリングが必要です。

</Note>

## 個人 ID（ブラウザーローカル）

Control UI は、共有セッションでの帰属表示のため、送信メッセージに付与されるブラウザーごとの個人 ID（表示名とアバター）をサポートします。これはブラウザーストレージに保存され、現在のブラウザープロファイルにスコープされ、他のデバイスには同期されず、実際に送信したメッセージ上の通常のトランスクリプト作成者メタデータを超えてサーバー側に永続化されることもありません。サイトデータを消去するかブラウザーを切り替えると空にリセットされます。

同じブラウザーローカルのパターンは、アシスタントアバターの上書きにも適用されます。アップロードされたアシスタントアバターは、ローカルブラウザー上でのみゲートウェイ解決済み ID に重ねられ、`config.patch` を通じて往復することはありません。共有の `ui.assistant.avatar` 設定フィールドは、そのフィールドを直接書き込む非 UI クライアント（スクリプト化されたゲートウェイやカスタムダッシュボードなど）向けに引き続き利用できます。

## ランタイム設定エンドポイント

Control UI は、ゲートウェイの Control UI ベースパスを基準に解決される `/control-ui-config.json` からランタイム設定を取得します（たとえば UI が `/__openclaw__/` 配下で配信される場合は `/__openclaw__/control-ui-config.json`）。このエンドポイントは、HTTP サーフェスの他の部分と同じゲートウェイ認証で保護されます。未認証のブラウザーは取得できず、取得に成功するには、すでに有効なゲートウェイトークン/パスワード、Tailscale Serve ID、または信頼済みプロキシ ID のいずれかが必要です。

## 言語サポート

Control UI は初回読み込み時にブラウザーロケールに基づいてローカライズできます。後で上書きするには、**概要 -> Gateway アクセス -> 言語**を開きます。ロケールピッカーは外観ではなく Gateway アクセスカード内にあります。

- サポートされるロケール: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 英語以外の翻訳はブラウザーで遅延読み込みされます。
- 選択したロケールはブラウザーストレージに保存され、以後の訪問で再利用されます。
- 欠落している翻訳キーは英語にフォールバックします。

ドキュメント翻訳も同じ英語以外のロケールセット向けに生成されますが、ドキュメントサイトに組み込まれた Mintlify 言語ピッカーは Mintlify が受け付けるロケールコードに制限されます。タイ語（`th`）とペルシア語（`fa`）のドキュメントは公開リポジトリで引き続き生成されますが、Mintlify がこれらのコードをサポートするまでは、そのピッカーに表示されない場合があります。

## 外観テーマ

外観パネルには、組み込みの Claw、Knot、Dash テーマに加えて、ブラウザーローカルの tweakcn インポートスロットが 1 つあります。テーマをインポートするには、[tweakcn editor](https://tweakcn.com/editor/theme) を開き、テーマを選択または作成し、**Share** をクリックして、コピーされたテーマリンクを外観に貼り付けます。インポーターは `https://tweakcn.com/r/themes/<id>` レジストリ URL、`https://tweakcn.com/editor/theme?theme=amethyst-haze` のようなエディター URL、相対 `/themes/<id>` パス、生のテーマ ID、`amethyst-haze` などのデフォルトテーマ名も受け付けます。

外観にはブラウザーローカルのテキストサイズ設定も含まれます。この設定は Control UI の他の設定と一緒に保存され、チャットテキスト、コンポーザーテキスト、ツールカード、チャットサイドバーに適用され、モバイル Safari がフォーカス時に自動ズームしないようテキスト入力を少なくとも 16px に保ちます。

インポートされたテーマは現在のブラウザープロファイルにのみ保存されます。ゲートウェイ設定には書き込まれず、デバイス間で同期されません。インポート済みテーマを置き換えると、1 つのローカルスロットが更新されます。消去すると、インポート済みテーマが選択されていた場合、アクティブテーマは Claw に戻ります。

## できること（現時点）

<AccordionGroup>
  <Accordion title="チャットとトーク">
    - Gateway WS（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）経由でモデルとチャットします。
    - チャット履歴の更新は、メッセージごとのテキスト上限付きで範囲を絞った最近のウィンドウを要求するため、大きなセッションでもチャットが利用可能になる前にブラウザーへ完全なトランスクリプトペイロードのレンダリングを強制しません。
    - ブラウザーのリアルタイムセッションを通じてトークします。OpenAI は直接 WebRTC を使用し、Google Live は WebSocket 経由の制約付き 1 回限りブラウザートークンを使用し、バックエンド専用のリアルタイム音声 Plugin は Gateway リレートランスポートを使用します。クライアント所有のプロバイダーセッションは `talk.client.create` で開始し、Gateway リレーセッションは `talk.session.create` で開始します。リレーはプロバイダー資格情報を Gateway に保持しながら、ブラウザーが `talk.session.appendAudio` を通じてマイク PCM をストリーミングし、`openclaw_agent_consult` プロバイダーツール呼び出しを `talk.client.toolCall` を通じて Gateway ポリシーと、設定されたより大きな OpenClaw モデルへ転送し、アクティブ実行の音声ステアリングを `talk.client.steer` または `talk.session.steer` 経由でルーティングします。
    - チャット内でツール呼び出しとライブツール出力カードをストリーミングします（エージェントイベント）。
    - 既存の `session.tool` / ツールイベント配信からのライブツールアクティビティについて、ブラウザーローカルで編集優先の要約を表示するアクティビティタブ。

  </Accordion>
  <Accordion title="チャネル、インスタンス、セッション、夢">
    - チャネル: 組み込みおよびバンドル/外部 Plugin チャネルのステータス、QR ログイン、チャネルごとの設定（`channels.status`, `web.login.*`, `config.patch`）。
    - チャネルプローブ更新では、遅いプロバイダーチェックが完了するまで以前のスナップショットを表示したままにし、プローブまたは監査が UI 予算を超えると部分スナップショットにラベルが付けられます。
    - インスタンス: プレゼンス一覧と更新（`system-presence`）。
    - セッション: デフォルトで設定済みエージェントセッションを一覧表示し、古い未設定エージェントセッションキーからフォールバックし、セッションごとのモデル/thinking/fast/verbose/trace/reasoning 上書きを適用します（`sessions.list`, `sessions.patch`）。
    - 夢: Dreaming ステータス、有効/無効トグル、Dream Diary リーダー（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）。

  </Accordion>
  <Accordion title="Cron、Skills、ノード、exec 承認">
    - Cron ジョブ: 一覧表示/追加/編集/実行/有効化/無効化と実行履歴（`cron.*`）。
    - Skills: ステータス、有効化/無効化、インストール、API キー更新（`skills.*`）。
    - ノード: 一覧と上限（`node.list`）。
    - Exec 承認: Gateway またはノードの許可リストと、`exec host=gateway/node` の ask ポリシーを編集します（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="設定">
    - `~/.openclaw/openclaw.json` を表示/編集します（`config.get`, `config.set`）。
    - MCP には、設定済みサーバー、有効化、OAuth/フィルター/並列要約、一般的なオペレーターコマンド、スコープされた `mcp` 設定エディター専用の設定ページがあります。
    - 検証付きで適用して再起動し（`config.apply`）、最後にアクティブだったセッションを起動します。
    - 書き込みには、同時編集の上書きを防ぐためのベースハッシュガードが含まれます。
    - 書き込み（`config.set`/`config.apply`/`config.patch`）は、送信された設定ペイロード内の参照に対してアクティブな SecretRef 解決を事前検査します。解決できないアクティブな送信済み参照は書き込み前に拒否されます。
    - フォーム保存では、保存済みシークレットにまだ対応する編集済み値を保持しながら、保存済み設定から復元できない古い編集済みプレースホルダーを破棄します。
    - スキーマとフォームレンダリング（`config.schema` / `config.schema.lookup`。フィールド `title` / `description`、一致した UI ヒント、直下の子要約、ネストされたオブジェクト/ワイルドカード/配列/合成ノード上のドキュメントメタデータ、利用可能な場合は Plugin とチャネルのスキーマを含む）。Raw JSON エディターは、スナップショットが安全な生のラウンドトリップを持つ場合にのみ利用できます。
    - スナップショットが生テキストを安全にラウンドトリップできない場合、Control UI はフォームモードを強制し、そのスナップショットの Raw モードを無効にします。
    - Raw JSON エディターの「保存済みにリセット」は、フラット化されたスナップショットを再レンダリングするのではなく、生で作成された形状（書式、コメント、`$include` レイアウト）を保持するため、スナップショットが安全にラウンドトリップできる場合は外部編集がリセット後も残ります。
    - 構造化された SecretRef オブジェクト値は、偶発的なオブジェクトから文字列への破損を防ぐため、フォームのテキスト入力では読み取り専用でレンダリングされます。

  </Accordion>
  <Accordion title="デバッグ、ログ、更新">
    - デバッグ: ステータス/ヘルス/モデルのスナップショット、イベントログ、手動 RPC 呼び出し（`status`, `health`, `models.list`）。
    - イベントログには、Control UI の更新/RPC タイミング、遅いチャット/設定レンダリングのタイミング、およびブラウザーがそれらの PerformanceObserver エントリタイプを公開する場合の長いアニメーションフレームや長いタスクに関するブラウザー応答性エントリが含まれます。
    - ログ: フィルター/エクスポート付きでゲートウェイファイルログをライブ追尾します（`logs.tail`）。
    - 更新: 再起動レポート付きでパッケージ/git 更新と再起動を実行し（`update.run`）、再接続後に `update.status` をポーリングして実行中のゲートウェイバージョンを確認します。

  </Accordion>
  <Accordion title="Cron ジョブパネルの注記">
    - 分離されたジョブでは、配信のデフォルトは要約の通知です。内部専用の実行にしたい場合は、なしに切り替えられます。
    - 通知が選択されている場合、チャンネル/ターゲットフィールドが表示されます。
    - Webhook モードは、有効な HTTP(S) Webhook URL に設定された `delivery.to` とともに `delivery.mode = "webhook"` を使用します。
    - メインセッションジョブでは、Webhook となしの配信モードを使用できます。
    - 高度な編集コントロールには、実行後削除、エージェントのオーバーライド解除、Cron の厳密/スタガーオプション、エージェントモデル/思考のオーバーライド、ベストエフォート配信トグルが含まれます。
    - フォーム検証はフィールドレベルのエラーとしてインライン表示されます。無効な値がある場合、修正されるまで保存ボタンは無効になります。
    - 専用のベアラートークンを送信するには `cron.webhookToken` を設定します。省略した場合、Webhook は認証ヘッダーなしで送信されます。
    - 非推奨のフォールバック: `notify: true` を持つ保存済みのレガシージョブを `cron.webhook` からジョブごとの明示的な Webhook または完了配信へ移行するには、`openclaw doctor --fix` を実行します。

  </Accordion>
</AccordionGroup>

## MCP ページ

専用の MCP ページは、`mcp.servers` 配下の OpenClaw 管理 MCP サーバー向けのオペレータービューです。それ自体では MCP トランスポートを開始しません。保存済み設定の確認と編集に使用し、ライブサーバーの証明が必要な場合は `openclaw mcp doctor --probe` を使用します。

典型的なワークフロー:

1. サイドバーから **MCP** を開きます。
2. 合計、有効、OAuth、フィルタ済みサーバー数のサマリーカードを確認します。
3. 各サーバー行で、トランスポート、有効化、認証、フィルター、タイムアウト、コマンドヒントを確認します。
4. サーバーを設定済みのままランタイム検出から外しておく必要がある場合は、有効化を切り替えます。
5. サーバー定義、ヘッダー、TLS/mTLS パス、OAuth メタデータ、ツールフィルター、Codex 投影メタデータについて、スコープされた `mcp` 設定セクションを編集します。
6. 設定を書き込むには **保存** を使用し、実行中の Gateway に変更後の設定を適用させる場合は **保存して公開** を使用します。
7. 編集したプロセスに静的診断、ライブ証明、またはキャッシュ済みランタイムの破棄が必要な場合は、ターミナルから `openclaw mcp status --verbose`、`openclaw mcp doctor --probe`、または `openclaw mcp reload` を実行します。

このページは、認証情報を含む URL 風の値をレンダリング前に秘匿し、コマンドスニペット内のサーバー名を引用符で囲むため、コピーしたコマンドはスペースやシェルのメタ文字を含む場合でも動作します。完全な CLI と設定リファレンスは [MCP](/ja-JP/cli/mcp) にあります。

## アクティビティタブ

アクティビティタブは、ライブツールアクティビティのための一時的なブラウザー内ローカルオブザーバーです。これはチャットのツールカードを動かしているものと同じ Gateway `session.tool` / ツールイベントストリームから派生します。別の Gateway イベントファミリー、エンドポイント、永続的なアクティビティストア、メトリクスフィード、外部オブザーバーストリームは追加しません。

アクティビティエントリは、サニタイズ済みの要約と秘匿・切り詰め済みの出力プレビューのみを保持します。ツール引数の値はアクティビティ状態に保存されません。UI は引数が非表示であることを示し、引数字段数のみを記録します。メモリ内リストは現在のブラウザータブに従い、Control UI 内のナビゲーションでは保持され、ページ再読み込み、セッション切り替え、または **クリア** でリセットされます。

## チャットの挙動

<AccordionGroup>
  <Accordion title="送信と履歴のセマンティクス">
    - `chat.send` は **非ブロッキング** です。`{ runId, status: "started" }` ですぐに ACK し、レスポンスは `chat` イベント経由でストリーミングされます。信頼済みの Control UI クライアントは、ローカル診断用に任意の ACK タイミングメタデータも受け取る場合があります。
    - チャットアップロードは、画像に加えて動画以外のファイルを受け付けます。画像はネイティブ画像パスを保持し、それ以外のファイルは管理対象メディアとして保存され、履歴には添付リンクとして表示されます。
    - 同じ `idempotencyKey` で再送信すると、実行中は `{ status: "in_flight" }` を返し、完了後は `{ status: "ok" }` を返します。
    - `chat.history` のレスポンスは UI の安全性のためサイズ制限されています。トランスクリプトエントリが大きすぎる場合、Gateway は長いテキストフィールドを切り詰め、重いメタデータブロックを省略し、過大なメッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えることがあります。
    - 表示可能なアシスタントメッセージが `chat.history` で切り詰められた場合、サイドリーダーは `sessionKey`、必要に応じてアクティブな `agentId`、トランスクリプトの `messageId` により、`chat.message.get` を通じて表示正規化済みの完全なトランスクリプトエントリをオンデマンドで取得できます。Gateway がそれでも追加分を返せない場合、リーダーは切り詰められたプレビューを暗黙に繰り返すのではなく、明示的な利用不可状態を表示します。
    - アシスタント/生成画像は管理対象メディア参照として永続化され、認証済み Gateway メディア URL 経由で配信されるため、再読み込みは生の base64 画像ペイロードがチャット履歴レスポンス内に残っていることに依存しません。
    - `chat.history` をレンダリングする際、Control UI は、表示されるアシスタントテキストから表示専用のインラインディレクティブタグ（例: `[[reply_to_*]]` と `[[audio_as_voice]]`）、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、切り詰められたツール呼び出しブロックを含む）、漏れた ASCII/全角モデル制御トークンを除去し、表示テキスト全体が正確なサイレントトークン `NO_REPLY` / `no_reply` または Heartbeat 確認トークン `HEARTBEAT_OK` のみであるアシスタントエントリを省略します。
    - アクティブな送信中と最終的な履歴更新時に、`chat.history` が一時的に古いスナップショットを返した場合でも、チャットビューはローカルの楽観的なユーザー/アシスタントメッセージを表示し続けます。Gateway 履歴が追いつくと、正規のトランスクリプトがそれらのローカルメッセージを置き換えます。
    - ライブ `chat` イベントは配信状態であり、`chat.history` は永続的なセッショントランスクリプトから再構築されます。ツール最終イベントの後、Control UI は履歴を再読み込みし、小さな楽観的末尾のみをマージします。トランスクリプト境界は [WebChat](/ja-JP/web/webchat) に記載されています。
    - `chat.inject` はアシスタントノートをセッショントランスクリプトに追加し、UI 専用更新のために `chat` イベントをブロードキャストします（エージェント実行なし、チャンネル配信なし）。
    - チャットヘッダーはセッションピッカーの前にエージェントフィルターを表示し、セッションピッカーは選択されたエージェントでスコープされます。エージェントを切り替えると、そのエージェントに紐づくセッションのみが表示され、保存済みダッシュボードセッションがまだない場合はそのエージェントのメインセッションにフォールバックします。
    - デスクトップ幅では、チャットコントロールはコンパクトな 1 行に収まり、トランスクリプトを下にスクロールしている間は折りたたまれます。上にスクロールする、先頭に戻る、または末尾に到達すると、コントロールが復元されます。
    - 連続する重複したテキストのみのメッセージは、件数バッジ付きの 1 つの吹き出しとしてレンダリングされます。画像、添付、ツール出力、またはキャンバスプレビューを含むメッセージは折りたたまれません。
    - チャットヘッダーのモデルピッカーと思考ピッカーは、`sessions.patch` を通じてアクティブセッションに即座にパッチします。これらは永続的なセッションオーバーライドであり、1 ターン限りの送信オプションではありません。
    - 同じセッションのモデルピッカー変更がまだ保存中の間にメッセージを送信した場合、コンポーザーは `chat.send` を呼び出す前にそのセッションパッチを待つため、送信は選択されたモデルを使用します。
    - Control UI で `/new` と入力すると、New Chat と同じ新しいダッシュボードセッションを作成して切り替えます。ただし、`session.dmScope: "main"` が設定され、現在の親がエージェントのメインセッションである場合は、そのメインセッションをその場でリセットします。`/reset` と入力すると、現在のセッションに対して Gateway の明示的なインプレースリセットを維持します。
    - チャットモデルピッカーは、Gateway の設定済みモデルビューをリクエストします。`agents.defaults.models` が存在する場合、その許可リストがピッカーを駆動し、プロバイダースコープのカタログを動的に保つ `provider/*` エントリも含まれます。それ以外の場合、ピッカーは明示的な `models.providers.*.models` エントリと、使用可能な認証を持つプロバイダーを表示します。完全なカタログは、デバッグ用の `models.list` RPC で `view: "all"` を指定することで引き続き利用できます。
    - 新しい Gateway セッション使用状況レポートに現在のコンテキストトークンが含まれている場合、チャットコンポーザー領域にコンパクトなコンテキスト使用量インジケーターが表示されます。コンテキスト圧力が高い場合は警告スタイルに切り替わり、推奨される Compaction レベルでは、通常のセッション Compaction パスを実行するコンパクトなボタンが表示されます。古いトークンスナップショットは、Gateway が新しい使用状況を再度報告するまで非表示になります。

  </Accordion>
  <Accordion title="トークモード（ブラウザーリアルタイム）">
    トークモードは、登録済みのリアルタイム音声プロバイダーを使用します。OpenAI は、`talk.realtime.provider: "openai"` と `openai` API キー認証プロファイル、`talk.realtime.providers.openai.apiKey`、または `OPENAI_API_KEY` を組み合わせて設定します。OpenAI OAuth プロファイルでは Realtime 音声は設定されません。Google は、`talk.realtime.provider: "google"` と `talk.realtime.providers.google.apiKey` を組み合わせて設定します。ブラウザーが標準プロバイダー API キーを受け取ることはありません。OpenAI は WebRTC 用の一時的な Realtime クライアントシークレットを受け取ります。Google Live は、ブラウザー WebSocket セッション用に 1 回限りの制約付き Live API 認証トークンを受け取り、そのトークンには Gateway によって指示とツール宣言が固定されます。バックエンドのリアルタイムブリッジのみを公開するプロバイダーは Gateway リレートランスポートを通じて実行されるため、認証情報とベンダーソケットはサーバー側に留まり、ブラウザー音声は認証済み Gateway RPC 経由で移動します。Realtime セッションプロンプトは Gateway によって組み立てられます。`talk.client.create` は呼び出し元提供の指示オーバーライドを受け付けません。

    チャットコンポーザーには、トーク開始/停止ボタンの隣にトークオプションボタンがあります。オプションは次のトークセッションに適用され、プロバイダー、トランスポート、モデル、音声、推論努力、VAD 閾値、無音時間、プレフィックスパディングをオーバーライドできます。オプションが空白の場合、Gateway は利用可能であれば設定済みデフォルトを使用し、そうでなければプロバイダーのデフォルトを使用します。Gateway リレーを選択するとバックエンドリレーパスが強制されます。WebRTC を選択するとセッションはクライアント所有のままとなり、プロバイダーがブラウザーセッションを作成できない場合はリレーへ暗黙にフォールバックせず失敗します。

    チャットコンポーザーでは、トークコントロールはマイク音声入力ボタンの隣にある波形ボタンです。トークが開始すると、コンポーザーのステータス行には音声が接続されるまで `Connecting Talk...`、接続後は `Talk live`、またはリアルタイムツール呼び出しが `talk.client.toolCall` を通じて設定済みのより大きなモデルに問い合わせている間は `Asking OpenClaw...` が表示されます。

    メンテナー向けライブスモーク: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` は、OpenAI バックエンド WebSocket ブリッジ、OpenAI ブラウザー WebRTC SDP 交換、Google Live 制約付きトークンのブラウザー WebSocket セットアップ、偽のマイクメディアを使った Gateway リレーブラウザーアダプターを検証します。このコマンドはプロバイダーのステータスのみを出力し、シークレットはログに記録しません。

  </Accordion>
  <Accordion title="停止と中止">
    - **停止** をクリックします（`chat.abort` を呼び出します）。
    - 実行がアクティブな間、通常のフォローアップはキューに入ります。キュー内のメッセージで **方向付け** をクリックすると、そのフォローアップを実行中のターンに注入します。
    - 帯域外で中止するには、`/stop`（または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` などの単独の中止フレーズ）を入力します。
    - `chat.abort` は、そのセッションのすべてのアクティブな実行を中止するために `{ sessionKey }`（`runId` なし）をサポートします。

  </Accordion>
  <Accordion title="中止時の部分保持">
    - 実行が中止された場合でも、アシスタントの部分テキストは UI に表示されることがあります。
    - Gateway は、バッファされた出力が存在する場合、中止されたアシスタントの部分テキストをトランスクリプト履歴に永続化します。
    - 永続化されたエントリには中止メタデータが含まれるため、トランスクリプトの利用側は中止された部分と通常の完了出力を区別できます。

  </Accordion>
</AccordionGroup>

## PWA インストールと Web プッシュ

Control UI は `manifest.webmanifest` とサービスワーカーを同梱しているため、モダンブラウザーではスタンドアロン PWA としてインストールできます。Web プッシュにより、タブやブラウザーウィンドウが開いていない場合でも、Gateway は通知でインストール済み PWA を起動できます。

OpenClaw の更新直後にページが **プロトコル不一致** と表示する場合は、まず `openclaw dashboard` でダッシュボードを再度開き、ページをハードリフレッシュします。それでも失敗する場合は、ダッシュボードオリジンのサイトデータをクリアするか、プライベートブラウザーウィンドウでテストしてください。古いタブやブラウザーのサービスワーカーキャッシュが、更新前の Control UI バンドルを新しい Gateway に対して実行し続けることがあります。

| サーフェス                                            | 役割                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA マニフェスト。到達可能になると、ブラウザーが「アプリをインストール」を提示します。 |
| `ui/public/sw.js`                                     | `push` イベントと通知クリックを処理する Service worker。 |
| `push/vapid-keys.json` (OpenClaw state dir 配下) | Web Push ペイロードの署名に使われる、自動生成された VAPID キーペア。 |
| `push/web-push-subscriptions.json`                    | 永続化されたブラウザー購読エンドポイント。                          |

キーを固定したい場合（複数ホストのデプロイ、シークレットローテーション、テストなど）は、Gateway プロセスの環境変数で VAPID キーペアを上書きします。

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (デフォルトは `https://openclaw.ai`)

Control UI は、ブラウザー購読の登録とテストに、これらのスコープ制限付き Gateway メソッドを使います。

- `push.web.vapidPublicKey` — アクティブな VAPID 公開鍵を取得します。
- `push.web.subscribe` — `endpoint` と `keys.p256dh`/`keys.auth` を登録します。
- `push.web.unsubscribe` — 登録済みエンドポイントを削除します。
- `push.web.test` — 呼び出し元の購読にテスト通知を送信します。

<Note>
Web Push は iOS APNS リレーパス（リレーに裏付けられたプッシュについては [設定](/ja-JP/gateway/configuration) を参照）および既存の `push.test` メソッドとは独立しており、これらはネイティブモバイルのペアリングを対象にします。
</Note>

## ホストされた埋め込み

アシスタントメッセージは `[embed ...]` ショートコードで、ホストされた Web コンテンツをインライン表示できます。iframe sandbox ポリシーは `gateway.controlUi.embedSandbox` で制御されます。

<Tabs>
  <Tab title="strict">
    ホストされた埋め込み内でのスクリプト実行を無効にします。
  </Tab>
  <Tab title="scripts (default)">
    オリジン分離を維持しながらインタラクティブな埋め込みを許可します。これがデフォルトで、自己完結型のブラウザーゲームやウィジェットには通常十分です。
  </Tab>
  <Tab title="trusted">
    意図的により強い権限を必要とする同一サイト文書向けに、`allow-scripts` に加えて `allow-same-origin` を追加します。
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
`trusted` は、埋め込み文書が同一オリジンの動作を本当に必要とする場合にのみ使ってください。ほとんどのエージェント生成ゲームやインタラクティブキャンバスでは、`scripts` の方が安全な選択です。
</Warning>

絶対外部 `http(s)` 埋め込み URL はデフォルトでブロックされたままです。意図的に `[embed url="https://..."]` でサードパーティページを読み込みたい場合は、`gateway.controlUi.allowExternalEmbedUrls: true` を設定します。

## チャットメッセージ幅

グループ化されたチャットメッセージには、読みやすいデフォルトの最大幅があります。ワイドモニターのデプロイでは、バンドル済み CSS にパッチを当てずに `gateway.controlUi.chatMessageMaxWidth` を設定して上書きできます。

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

この値はブラウザーに到達する前に検証されます。サポートされる値には、`960px` や `82%` などの単純な長さとパーセンテージに加え、制約付きの `min(...)`、`max(...)`、`clamp(...)`、`calc(...)`、`fit-content(...)` 幅式が含まれます。

## Tailnet アクセス（推奨）

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Gateway を loopback に置いたまま、Tailscale Serve に HTTPS でプロキシさせます。

    ```bash
    openclaw gateway --tailscale serve
    ```

    開く:

    - `https://<magicdns>/`（または設定済みの `gateway.controlUi.basePath`）

    デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket Serve リクエストは Tailscale ID ヘッダー（`tailscale-user-login`）で認証できます。OpenClaw は `x-forwarded-for` アドレスを `tailscale whois` で解決してヘッダーと照合することで ID を検証し、リクエストが Tailscale の `x-forwarded-*` ヘッダー付きで loopback に到達した場合のみ受け入れます。ブラウザーデバイス ID を持つ Control UI オペレーターセッションでは、この検証済み Serve パスによりデバイスペアリングの往復もスキップされます。デバイスなしのブラウザーとノードロール接続は、引き続き通常のデバイスチェックに従います。Serve トラフィックであっても明示的な共有シークレット資格情報を要求したい場合は、`gateway.auth.allowTailscale: false` を設定します。そのうえで `gateway.auth.mode: "token"` または `"password"` を使います。

    その非同期 Serve ID パスでは、同じクライアント IP と認証スコープの認証失敗試行は、レート制限の書き込み前に直列化されます。そのため、同じブラウザーからの並行した不正再試行では、2 つの単純な不一致が並行して競合する代わりに、2 つ目のリクエストで `retry later` が表示されることがあります。

    <Warning>
    トークンなしの Serve 認証は、gateway ホストが信頼されていることを前提にします。そのホスト上で信頼できないローカルコードが実行される可能性がある場合は、token/password 認証を必須にしてください。
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    次に開く:

    - `http://<tailscale-ip>:18789/`（または設定済みの `gateway.controlUi.basePath`）

    一致する共有シークレットを UI 設定に貼り付けます（`connect.params.auth.token` または `connect.params.auth.password` として送信されます）。

  </Tab>
</Tabs>

## 安全でない HTTP

プレーン HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、ブラウザーは**非セキュアコンテキスト**で動作し、WebCrypto をブロックします。デフォルトでは、OpenClaw はデバイス ID のない Control UI 接続を**ブロック**します。

文書化された例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost 限定の安全でない HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` 経由での Control UI オペレーター認証の成功
- 緊急用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS（Tailscale Serve）を使うか、UI をローカルで開きます。

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway ホスト上)

<AccordionGroup>
  <Accordion title="Insecure-auth toggle behavior">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` はローカル互換性トグルのみです。

    - 非セキュア HTTP コンテキストで、localhost の Control UI セッションがデバイス ID なしで進行することを許可します。
    - ペアリングチェックを回避しません。
    - リモート（非 localhost）のデバイス ID 要件を緩和しません。

  </Accordion>
  <Accordion title="Break-glass only">
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
    `dangerouslyDisableDeviceAuth` は Control UI のデバイス ID チェックを無効にし、重大なセキュリティ低下をもたらします。緊急使用後は速やかに元に戻してください。
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - trusted-proxy 認証に成功すると、デバイス ID なしで**オペレーター** Control UI セッションを許可できます。
    - これはノードロール Control UI セッションには拡張されません。
    - 同一ホストの loopback リバースプロキシは、依然として trusted-proxy 認証を満たしません。[Trusted proxy auth](/ja-JP/gateway/trusted-proxy-auth) を参照してください。

  </Accordion>
</AccordionGroup>

HTTPS セットアップのガイダンスについては [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## コンテンツセキュリティポリシー

Control UI には厳格な `img-src` ポリシーが同梱されています。許可されるのは、**同一オリジン**アセット、`data:` URL、ローカル生成の `blob:` URL のみです。リモート `http(s)` およびプロトコル相対の画像 URL はブラウザーによって拒否され、ネットワークフェッチは発行されません。

実際には次のようになります。

- 相対パス（例: `/avatars/<id>`）配下で提供されるアバターと画像は、UI が取得してローカル `blob:` URL に変換する認証済みアバタールートを含め、引き続きレンダリングされます。
- インライン `data:image/...` URL は引き続きレンダリングされます（プロトコル内ペイロードに有用です）。
- Control UI が作成したローカル `blob:` URL は引き続きレンダリングされます。
- チャンネルメタデータが出力したリモートアバター URL は、Control UI のアバターヘルパーで取り除かれ、組み込みのロゴ/バッジに置き換えられます。そのため、侵害された、または悪意のあるチャンネルが、オペレーターブラウザーから任意のリモート画像フェッチを強制することはできません。

この動作を得るために変更は不要です。常に有効で、設定できません。

## アバタールート認証

gateway 認証が設定されている場合、Control UI アバターエンドポイントは API の他の部分と同じ gateway トークンを要求します。

- `GET /avatar/<agentId>` は、認証済み呼び出し元にのみアバター画像を返します。`GET /avatar/<agentId>?meta=1` は、同じルールの下でアバターメタデータを返します。
- どちらのルートへの未認証リクエストも拒否されます（兄弟の assistant-media ルートと一致します）。これにより、他の部分が保護されているホストでアバタールートがエージェント ID を漏えいすることを防ぎます。
- Control UI 自体は、アバター取得時に gateway トークンを bearer ヘッダーとして転送し、認証済み blob URL を使うため、ダッシュボード内で画像は引き続きレンダリングされます。

gateway 認証を無効にすると（共有ホストでは推奨されません）、gateway の他の部分と同様に、アバタールートも未認証になります。

## アシスタントメディアルート認証

gateway 認証が設定されている場合、アシスタントのローカルメディアプレビューは 2 段階のルートを使います。

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` は、通常の Control UI オペレーター認証を要求します。ブラウザーは可用性確認時に gateway トークンを bearer ヘッダーとして送信します。
- メタデータ応答が成功すると、その正確なソースパスにスコープされた短命の `mediaTicket` が含まれます。
- ブラウザーでレンダリングされる画像、音声、動画、文書 URL は、アクティブな gateway トークンやパスワードの代わりに `mediaTicket=<ticket>` を使います。チケットはすぐに期限切れになり、別のソースを認可することはできません。

これにより、再利用可能な gateway 資格情報を可視メディア URL に入れずに、通常のメディアレンダリングをブラウザー標準のメディア要素と互換に保てます。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを提供します。次でビルドします。

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

次に、UI を Gateway WS URL（例: `ws://127.0.0.1:18789`）に向けます。

## 空白の Control UI ページ

ブラウザーが空白のダッシュボードを読み込み、DevTools に有用なエラーが表示されない場合、拡張機能または早期のコンテンツスクリプトが JavaScript モジュールアプリの評価を妨げた可能性があります。静的ページには、起動後に `<openclaw-app>` が登録されていない場合に表示されるプレーン HTML の復旧パネルが含まれています。

ブラウザー環境を変更した後にパネルの **Try again** アクションを使うか、次の確認後に手動で再読み込みしてください。

- すべてのページに注入する拡張機能、特に `<all_urls>` コンテンツスクリプトを持つ拡張機能を無効にします。
- プライベートウィンドウ、クリーンなブラウザープロファイル、または別のブラウザーを試します。
- Gateway を起動したままにし、ブラウザー変更後に同じダッシュボード URL を確認します。

## デバッグ/テスト: 開発サーバー + リモート Gateway

Control UI は静的ファイルです。WebSocket ターゲットは設定可能で、HTTP オリジンと異なっていてもかまいません。これは、Vite 開発サーバーをローカルに置き、Gateway を別の場所で実行したい場合に便利です。

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
  <Accordion title="メモ">
    - `gatewayUrl` はロード後に localStorage に保存され、URL から削除されます。
    - `gatewayUrl` 経由で完全な `ws://` または `wss://` エンドポイントを渡す場合は、ブラウザーがクエリ文字列を正しく解析できるように `gatewayUrl` の値を URL エンコードしてください。
    - `token` は可能な限り URL フラグメント（`#token=...`）経由で渡してください。フラグメントはサーバーに送信されないため、リクエストログや Referer からの漏えいを避けられます。レガシーな `?token=` クエリパラメーターは互換性のために一度だけインポートされますが、フォールバックとしてのみ扱われ、ブートストラップ直後に削除されます。
    - `password` はメモリ内にのみ保持されます。
    - `gatewayUrl` が設定されている場合、UI は設定や環境認証情報にフォールバックしません。`token`（または `password`）を明示的に指定してください。明示的な認証情報がない場合はエラーになります。
    - Gateway が TLS（Tailscale Serve、HTTPS プロキシなど）の背後にある場合は `wss://` を使用してください。
    - `gatewayUrl` はクリックジャッキングを防ぐため、トップレベルウィンドウ（埋め込みではない）でのみ受け付けられます。
    - 公開された非ループバックの Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を明示的に設定する必要があります（完全なオリジン）。ループバック、RFC1918/link-local、`.local`、`.ts.net`、または Tailscale CGNAT ホストからのプライベートな同一オリジン LAN/Tailnet ロードは、Host-header フォールバックを有効にしなくても受け付けられます。
    - Gateway 起動時には、有効なランタイムのバインドとポートから `http://localhost:<port>` や `http://127.0.0.1:<port>` などのローカルオリジンをシードすることがありますが、リモートブラウザーのオリジンには引き続き明示的なエントリが必要です。
    - 厳密に制御されたローカルテスト以外では、`gateway.controlUi.allowedOrigins: ["*"]` を使用しないでください。これは「あらゆるブラウザーオリジンを許可する」という意味であり、「使用中の任意のホストに一致する」という意味ではありません。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は Host-header オリジンフォールバックモードを有効にしますが、これは危険なセキュリティモードです。

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
- [ヘルスチェック](/ja-JP/gateway/health) — Gateway ヘルスモニタリング
- [TUI](/ja-JP/web/tui) — ターミナルユーザーインターフェイス
- [WebChat](/ja-JP/web/webchat) — ブラウザーベースのチャットインターフェイス
