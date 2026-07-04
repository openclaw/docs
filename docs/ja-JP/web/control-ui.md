---
read_when:
    - ブラウザーから Gateway を操作したい
    - SSH トンネルなしで Tailnet アクセスを使いたい
sidebarTitle: Control UI
summary: Gateway 用のブラウザベースのコントロール UI（チャット、アクティビティ、ノード、設定）
title: Control UI
x-i18n:
    generated_at: "2026-07-04T20:25:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 883e951b304a104a5cb2d0197199d06e372b1b8a25efdfd082ae190575bf409d
    source_path: web/control-ui.md
    workflow: 16
---

Control UI は、Gateway から配信される小さな **Vite + Lit** シングルページアプリです。

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します（例: `/openclaw`）

同じポート上で **Gateway WebSocket に直接**通信します。

## クイックオープン（ローカル）

Gateway が同じコンピューター上で実行されている場合は、次を開きます。

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）

ページの読み込みに失敗する場合は、先に Gateway を起動してください: `openclaw gateway`。

<Note>
ネイティブ Windows の LAN バインドでは、Gateway ホスト上で `127.0.0.1` が動作していても、Windows Firewall や組織管理の Group Policy が通知された LAN URL をブロックすることがあります。Windows ホストで `openclaw gateway status --deep` を実行してください。ブロックされている可能性が高いポート、プロファイルの不一致、ポリシーが無視する可能性のあるローカルファイアウォールルールを報告します。
</Note>

認証は WebSocket ハンドシェイク中に次のいずれかで提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合の Tailscale Serve ID ヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合の trusted-proxy ID ヘッダー

ダッシュボード設定パネルは、現在のブラウザータブセッションと選択された Gateway URL に対してトークンを保持します。パスワードは永続化されません。オンボーディングでは通常、初回接続時に共有シークレット認証用の Gateway トークンが生成されますが、`gateway.auth.mode` が `"password"` の場合はパスワード認証も使用できます。

## デバイスペアリング（初回接続）

新しいブラウザーまたはデバイスから Control UI に接続すると、Gateway は通常 **一度限りのペアリング承認**を要求します。これは不正アクセスを防ぐためのセキュリティ対策です。

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

ブラウザーがすでにペアリング済みで、読み取りアクセスから書き込み/管理者アクセスに変更した場合、これはサイレントな再接続ではなく承認アップグレードとして扱われます。OpenClaw は古い承認を有効なまま保持し、より広い再接続をブロックして、新しいスコープセットを明示的に承認するよう求めます。

承認されるとデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り再承認は不要です。トークンのローテーションと取り消しについては [Devices CLI](/ja-JP/cli/devices) を参照してください。

`openclaw_gateway` アダプター経由で接続する Paperclip エージェントは、同じ初回承認フローを使用します。最初の接続試行後、`openclaw devices approve --latest` を実行して保留中のリクエストをプレビューし、表示された `openclaw devices approve <requestId>` コマンドを再実行して承認します。リモート Gateway では明示的な `--url` と `--token` の値を渡してください。再起動後も承認を安定させるには、実行ごとに新しい一時的なデバイス ID を生成させるのではなく、Paperclip で永続的な `adapterConfig.devicePrivateKeyPem` を設定します。

<Note>
- 直接の local loopback ブラウザー接続（`127.0.0.1` / `localhost`）は自動承認されます。
- `gateway.auth.allowTailscale: true` で、Tailscale ID が検証され、ブラウザーがデバイス ID を提示する場合、Tailscale Serve は Control UI オペレーターセッションのペアリング往復をスキップできます。
- 直接の Tailnet バインド、LAN ブラウザー接続、デバイス ID のないブラウザープロファイルでは、引き続き明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイス ID を生成するため、ブラウザーを切り替える、またはブラウザーデータを消去すると再ペアリングが必要になります。

</Note>

## モバイルデバイスをペアリングする

すでにペアリング済みの管理者は、ターミナルを開かずに iOS/Android 接続用 QR を作成できます。

<Steps>
  <Step title="モバイルペアリングを開く">
    **Nodes** を選択し、**Devices** カード内の **Pair mobile device** をクリックします。
  </Step>
  <Step title="スマートフォンを接続する">
    OpenClaw モバイルアプリで **Settings** → **Gateway** を開き、QR コードをスキャンします。代わりにセットアップコードをコピーして貼り付けることもできます。
  </Step>
  <Step title="接続を確認する">
    公式 iOS/Android アプリは自動的に接続します。**Devices** に保留中のリクエストが表示される場合は、承認前にそのロールとスコープを確認してください。
  </Step>
</Steps>

セットアップコードを作成するには `operator.admin` が必要です。この権限がないセッションではボタンは無効になります。セットアップコードには短期間有効なブートストラップ認証情報が含まれるため、有効な間は QR とコピーしたコードをパスワードのように扱ってください。リモートペアリングでは、Gateway は `wss://` に解決される必要があります（たとえば Tailscale Serve/Funnel 経由）。プレーンな `ws://` は loopback とプライベート LAN アドレスに制限されます。完全なセキュリティとフォールバックの詳細については [Pairing](/ja-JP/channels/pairing#pair-from-the-control-ui-recommended) を参照してください。

## 個人 ID（ブラウザーローカル）

Control UI は、共有セッションでの帰属表示のために、送信メッセージに付与されるブラウザーごとの個人 ID（表示名とアバター）をサポートします。これはブラウザーストレージに保存され、現在のブラウザープロファイルにスコープされます。他のデバイスには同期されず、実際に送信したメッセージ上の通常のトランスクリプト作者メタデータを除き、サーバー側には永続化されません。サイトデータを消去する、またはブラウザーを切り替えると空にリセットされます。

同じブラウザーローカルのパターンは、アシスタントアバターの上書きにも適用されます。アップロードされたアシスタントアバターは、ローカルブラウザー上でのみ Gateway が解決した ID に重ねられ、`config.patch` を通じて往復することはありません。共有の `ui.assistant.avatar` 設定フィールドは、スクリプト化された Gateway やカスタムダッシュボードなど、このフィールドを直接書き込む非 UI クライアント向けに引き続き利用できます。

## ランタイム設定エンドポイント

Control UI は、Gateway の Control UI ベースパスからの相対解決で `/control-ui-config.json` からランタイム設定を取得します（たとえば UI が `/__openclaw__/` 配下で提供される場合は `/__openclaw__/control-ui-config.json`）。このエンドポイントは、HTTP サーフェスの他の部分と同じ Gateway 認証で保護されます。未認証のブラウザーは取得できず、取得に成功するには、すでに有効な Gateway トークン/パスワード、Tailscale Serve ID、または trusted-proxy ID のいずれかが必要です。

## 言語サポート

Control UI は、初回読み込み時にブラウザーのロケールに基づいて自身をローカライズできます。後で上書きするには、**Overview -> Gateway Access -> Language** を開きます。ロケールピッカーは Appearance ではなく Gateway Access カード内にあります。

- サポートされるロケール: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 英語以外の翻訳はブラウザーで遅延読み込みされます。
- 選択したロケールはブラウザーストレージに保存され、以後の訪問で再利用されます。
- 欠落した翻訳キーは英語にフォールバックします。

ドキュメント翻訳は同じ英語以外のロケールセットに対して生成されますが、ドキュメントサイトに組み込まれている Mintlify の言語ピッカーは Mintlify が受け付けるロケールコードに制限されます。タイ語（`th`）とペルシア語（`fa`）のドキュメントは publish repo で引き続き生成されますが、Mintlify がこれらのコードをサポートするまで、そのピッカーには表示されない場合があります。

## 外観テーマ

Appearance パネルには、組み込みの Claw、Knot、Dash テーマに加えて、ブラウザーローカルの tweakcn インポートスロットが 1 つあります。テーマをインポートするには、[tweakcn editor](https://tweakcn.com/editor/theme) を開き、テーマを選択または作成し、**Share** をクリックして、コピーしたテーマリンクを Appearance に貼り付けます。インポーターは、`https://tweakcn.com/r/themes/<id>` レジストリ URL、`https://tweakcn.com/editor/theme?theme=amethyst-haze` のようなエディター URL、相対 `/themes/<id>` パス、生のテーマ ID、`amethyst-haze` などのデフォルトテーマ名も受け付けます。

Appearance にはブラウザーローカルのテキストサイズ設定も含まれます。この設定は Control UI の他の設定と一緒に保存され、チャットテキスト、コンポーザーテキスト、ツールカード、チャットサイドバーに適用されます。また、モバイル Safari がフォーカス時に自動ズームしないよう、テキスト入力を少なくとも 16px に保ちます。

インポートされたテーマは現在のブラウザープロファイルにのみ保存されます。Gateway 設定には書き込まれず、デバイス間で同期されません。インポート済みテーマを置き換えると、その 1 つのローカルスロットが更新されます。クリアすると、インポート済みテーマが選択されていた場合、アクティブテーマは Claw に戻ります。

## できること（現時点）

<AccordionGroup>
  <Accordion title="チャットと通話">
    - Gateway WS 経由でモデルとチャットします（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）。
    - チャット履歴の更新では、メッセージごとのテキスト上限付きで境界付きの最近のウィンドウを要求するため、大規模セッションでも、チャットが使用可能になる前にブラウザーが完全なトランスクリプトペイロードをレンダリングする必要がありません。
    - ブラウザーのリアルタイムセッションを通じて通話します。OpenAI は直接 WebRTC を使用し、Google Live は WebSocket 経由の制約付き使い捨てブラウザートークンを使用し、バックエンド専用のリアルタイム音声 Plugin は Gateway リレートランスポートを使用します。クライアント所有のプロバイダーセッションは `talk.client.create` で開始します。Gateway リレーセッションは `talk.session.create` で開始します。リレーはプロバイダー認証情報を Gateway 上に保持し、ブラウザーが `talk.session.appendAudio` を通じてマイク PCM をストリーミングする間、Gateway ポリシーと設定済みのより大きな OpenClaw モデルのために `openclaw_agent_consult` プロバイダーツール呼び出しを `talk.client.toolCall` 経由で転送し、アクティブ実行の音声ステアリングを `talk.client.steer` または `talk.session.steer` 経由でルーティングします。
    - Chat でツール呼び出しとライブツール出力カードをストリーミングします（エージェントイベント）。
    - Activity タブでは、既存の `session.tool` / ツールイベント配信から、ライブツールアクティビティのブラウザーローカルかつ秘匿優先の要約を表示します。

  </Accordion>
  <Accordion title="チャネル、インスタンス、セッション、夢">
    - チャネル: 組み込みおよびバンドル/外部 Plugin チャネルのステータス、QR ログイン、チャネルごとの設定（`channels.status`, `web.login.*`, `config.patch`）。
    - チャネルプローブの更新では、遅いプロバイダーチェックが完了するまで前回のスナップショットを表示し続け、プローブまたは監査が UI 予算を超えた場合は部分スナップショットにラベルが付けられます。
    - インスタンス: プレゼンス一覧と更新（`system-presence`）。
    - セッション: デフォルトで設定済みエージェントセッションを一覧表示し、頻繁なセッションをピン留めし、名前を変更し、非アクティブなセッションをアーカイブまたは復元し、古い未設定エージェントセッションキーからフォールバックし、セッションごとのモデル/thinking/fast/verbose/trace/reasoning 上書きを適用します（`sessions.list`, `sessions.patch`）。ピン留めされたセッションは最近の未ピン留めセッションより上に並びます。アーカイブ済みセッションは Sessions ページのアーカイブビューにあり、トランスクリプトを保持します。
    - 夢: Dreaming ステータス、有効/無効トグル、Dream Diary リーダー（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）。

  </Accordion>
  <Accordion title="Cron、Skills、ノード、exec 承認">
    - Cron ジョブ: 一覧/追加/編集/実行/有効化/無効化と実行履歴（`cron.*`）。
    - Skills: ステータス、有効化/無効化、インストール、API キー更新（`skills.*`）。
    - ノード: 一覧と機能（`node.list`）、モバイルセットアップコードの作成、デバイスペアリングの承認（`device.pair.*`）。
    - Exec 承認: Gateway またはノードの許可リストと `exec host=gateway/node` の ask policy を編集します（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="設定">
    - `~/.openclaw/openclaw.json` を表示/編集します（`config.get`、`config.set`）。
    - MCP には、設定済みサーバー、有効化、OAuth/フィルター/並列サマリー、一般的なオペレーターコマンド、スコープ付きの `mcp` 設定エディターのための専用設定ページがあります。
    - 検証付きで適用 + 再起動し（`config.apply`）、最後にアクティブだったセッションを起動します。
    - 書き込みには、同時編集の上書きを防ぐベースハッシュガードが含まれます。
    - 書き込み（`config.set`/`config.apply`/`config.patch`）は、送信された設定ペイロード内の参照について、アクティブな SecretRef 解決を事前確認します。未解決のアクティブな送信済み参照は、書き込み前に拒否されます。
    - フォーム保存では、保存済み設定から復元できない古い墨消しプレースホルダーを破棄しつつ、保存済みシークレットにまだ対応している墨消し値は保持します。
    - スキーマ + フォーム描画（`config.schema` / `config.schema.lookup`、フィールド `title` / `description`、一致した UI ヒント、直接の子サマリー、ネストされたオブジェクト/ワイルドカード/配列/合成ノード上のドキュメントメタデータ、利用可能な場合は plugin + チャンネルスキーマを含む）。Raw JSON エディターは、スナップショットが安全な raw ラウンドトリップを持つ場合にのみ利用できます。
    - スナップショットが raw テキストを安全にラウンドトリップできない場合、Control UI はそのスナップショットについてフォームモードを強制し、Raw モードを無効にします。
    - Raw JSON エディターの「保存済みにリセット」は、フラット化されたスナップショットを再描画するのではなく、raw で作成された形（フォーマット、コメント、`$include` レイアウト）を保持するため、スナップショットが安全にラウンドトリップできる場合は外部編集がリセット後も残ります。
    - 構造化された SecretRef オブジェクト値は、誤ってオブジェクトから文字列へ破損することを防ぐため、フォームのテキスト入力では読み取り専用として描画されます。

  </Accordion>
  <Accordion title="デバッグ、ログ、更新">
    - デバッグ: ステータス/ヘルス/モデルのスナップショット + イベントログ + 手動 RPC 呼び出し（`status`、`health`、`models.list`）。
    - イベントログには、Control UI の更新/RPC タイミング、遅いチャット/設定描画タイミング、ブラウザーが該当する PerformanceObserver エントリー種別を公開している場合の長いアニメーションフレームまたは長いタスクに関するブラウザー応答性エントリーが含まれます。
    - ログ: フィルター/エクスポート付きで Gateway ファイルログをライブ追尾します（`logs.tail`）。
    - 更新: 再起動レポート付きでパッケージ/git 更新 + 再起動を実行し（`update.run`）、再接続後に `update.status` をポーリングして実行中の Gateway バージョンを確認します。

  </Accordion>
  <Accordion title="Cron ジョブパネルの注記">
    - 分離ジョブでは、配信のデフォルトはサマリー通知です。内部専用の実行にしたい場合は none に切り替えられます。
    - announce が選択されている場合、チャンネル/ターゲットフィールドが表示されます。
    - Webhook モードは、`delivery.to` を有効な HTTP(S) Webhook URL に設定したうえで `delivery.mode = "webhook"` を使用します。
    - メインセッションジョブでは、webhook と none の配信モードを利用できます。
    - 詳細編集コントロールには、実行後削除、エージェントオーバーライドのクリア、cron の exact/stagger オプション、エージェントモデル/thinking オーバーライド、ベストエフォート配信トグルが含まれます。
    - フォーム検証はフィールド単位のエラー付きでインライン表示されます。無効な値がある場合、修正されるまで保存ボタンは無効になります。
    - 専用 bearer トークンを送信するには `cron.webhookToken` を設定します。省略した場合、Webhook は認証ヘッダーなしで送信されます。
    - 非推奨のフォールバック: `notify: true` を持つ保存済みのレガシージョブを `cron.webhook` からジョブごとの明示的な Webhook または完了配信へ移行するには、`openclaw doctor --fix` を実行します。

  </Accordion>
</AccordionGroup>

## MCP ページ

専用 MCP ページは、`mcp.servers` 配下の OpenClaw 管理 MCP サーバー向けのオペレータービューです。それ自体で MCP トランスポートを開始することはありません。保存済み設定の確認と編集に使用し、ライブサーバーの証明が必要な場合は `openclaw mcp doctor --probe` を使用します。

一般的なワークフロー:

1. サイドバーから **MCP** を開きます。
2. サマリーカードで、合計、有効、OAuth、フィルター済みサーバー数を確認します。
3. 各サーバー行で、トランスポート、有効化、認証、フィルター、タイムアウト、コマンドヒントを確認します。
4. サーバーを設定済みのままにしつつランタイム検出から除外したい場合は、有効化を切り替えます。
5. サーバー定義、ヘッダー、TLS/mTLS パス、OAuth メタデータ、ツールフィルター、Codex 投影メタデータについて、スコープ付きの `mcp` 設定セクションを編集します。
6. 設定を書き込む場合は **保存** を使用し、実行中の Gateway に変更済み設定を適用させる場合は **保存して公開** を使用します。
7. 編集対象プロセスに静的診断、ライブ証明、またはキャッシュ済みランタイムの破棄が必要な場合は、ターミナルから `openclaw mcp status --verbose`、`openclaw mcp doctor --probe`、または `openclaw mcp reload` を実行します。

このページは、認証情報を含む URL 風の値を描画前に墨消しし、コマンドスニペット内のサーバー名を引用符で囲むため、コピーしたコマンドはスペースやシェルのメタ文字を含む場合でも機能します。完全な CLI と設定リファレンスは [MCP](/ja-JP/cli/mcp) にあります。

## アクティビティタブ

アクティビティタブは、ライブツールアクティビティ向けの一時的なブラウザー内ローカルオブザーバーです。これは、チャットのツールカードを動かしているものと同じ Gateway の `session.tool` / ツールイベントストリームから派生します。別の Gateway イベントファミリー、エンドポイント、永続的なアクティビティストア、メトリクスフィード、外部オブザーバーストリームを追加するものではありません。

アクティビティエントリーは、サニタイズ済みサマリーと、墨消しされ切り詰められた出力プレビューのみを保持します。ツール引数の値はアクティビティ状態に保存されません。UI は引数が非表示であることを示し、引数フィールド数のみを記録します。メモリ内リストは現在のブラウザータブに追従し、Control UI 内のナビゲーションでは保持され、ページ再読み込み、セッション切り替え、または **クリア** でリセットされます。

## チャットの動作

<AccordionGroup>
  <Accordion title="送信と履歴のセマンティクス">
    - `chat.send` は **非ブロッキング** です。`{ runId, status: "started" }` で即座に ACK し、応答は `chat` イベント経由でストリーミングされます。信頼済みの Control UI クライアントは、ローカル診断用に任意の ACK タイミングメタデータも受け取る場合があります。
    - チャットアップロードは、画像と動画以外のファイルを受け付けます。画像はネイティブ画像パスを保持し、それ以外のファイルは管理メディアとして保存され、履歴では添付リンクとして表示されます。
    - 同じ `idempotencyKey` で再送信すると、実行中は `{ status: "in_flight" }` を返し、完了後は `{ status: "ok" }` を返します。
    - `chat.history` の応答は UI の安全性のためサイズ制限されています。トランスクリプトエントリーが大きすぎる場合、Gateway は長いテキストフィールドを切り詰め、重いメタデータブロックを省略し、サイズ超過のメッセージをプレースホルダー（`[chat.history omitted: message too large]`）で置き換えることがあります。
    - 表示可能な assistant メッセージが `chat.history` で切り詰められた場合、サイドリーダーは `sessionKey`、必要に応じてアクティブな `agentId`、トランスクリプト `messageId` によって、表示正規化済みの完全なトランスクリプトエントリーを `chat.message.get` 経由でオンデマンド取得できます。Gateway がそれでも追加分を返せない場合、リーダーは切り詰められたプレビューを無言で繰り返すのではなく、明示的な利用不可状態を表示します。
    - assistant/生成画像は管理メディア参照として永続化され、認証済み Gateway メディア URL 経由で返されます。そのため、再読み込みは生の base64 画像ペイロードがチャット履歴応答に残っていることに依存しません。
    - `chat.history` を描画する際、Control UI は、表示専用のインラインディレクティブタグ（例: `[[reply_to_*]]` と `[[audio_as_voice]]`）、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、切り詰められたツール呼び出しブロックを含む）、漏出した ASCII/全角のモデル制御トークンを、表示される assistant テキストから取り除きます。また、表示テキスト全体が厳密なサイレントトークン `NO_REPLY` / `no_reply` または Heartbeat 確認トークン `HEARTBEAT_OK` のみである assistant エントリーを省略します。
    - アクティブな送信中と最後の履歴更新中に `chat.history` が一時的に古いスナップショットを返した場合でも、チャットビューはローカルの楽観的なユーザー/assistant メッセージを表示し続けます。Gateway 履歴が追いつくと、正規トランスクリプトがそれらのローカルメッセージを置き換えます。
    - ライブの `chat` イベントは配信状態であり、`chat.history` は永続的なセッショントランスクリプトから再構築されます。ツール最終イベントの後、Control UI は履歴を再読み込みし、小さな楽観的テールのみをマージします。トランスクリプト境界は [WebChat](/ja-JP/web/webchat) に記載されています。
    - `chat.inject` は assistant ノートをセッショントランスクリプトに追加し、UI 専用更新用の `chat` イベントをブロードキャストします（エージェント実行なし、チャンネル配信なし）。
    - サイドバーには、最近のセッションが New Session アクション、All Sessions リンク、完全なセッションピッカーを開くセッション検索ボタン（選択中のエージェントでスコープされ、検索とページネーション付き）とともに一覧表示されます。エージェントを切り替えると、そのエージェントに紐づくセッションのみが表示され、保存済みダッシュボードセッションがまだない場合はそのエージェントのメインセッションにフォールバックします。
    - 各セッションピッカー行では、セッションの名前変更、ピン留め、アーカイブができます。アクティブな実行とエージェントのメインセッションはアーカイブできません。現在選択中のセッションをアーカイブすると、チャットはそのエージェントのメインセッションへ戻ります。
    - デスクトップ幅では、チャットコントロールはコンパクトな 1 行に留まり、トランスクリプトを下にスクロールしている間は折りたたまれます。上にスクロールする、先頭に戻る、または末尾に到達すると、コントロールが復元されます。
    - 連続する重複したテキストのみのメッセージは、件数バッジ付きの 1 つの吹き出しとして描画されます。画像、添付、ツール出力、またはキャンバスプレビューを含むメッセージは折りたたまれません。
    - チャットヘッダーのモデルと thinking ピッカーは、`sessions.patch` 経由でアクティブセッションを即座にパッチします。これらは永続的なセッションオーバーライドであり、1 ターン限定の送信オプションではありません。
    - 同じセッションのモデルピッカー変更がまだ保存中の間にメッセージを送信した場合、コンポーザーは `chat.send` を呼び出す前にそのセッションパッチを待つため、送信には選択済みモデルが使用されます。
    - Control UI で `/new` と入力すると、`session.dmScope: "main"` が設定されていて現在の親がエージェントのメインセッションである場合を除き、新規チャットと同じ新しいダッシュボードセッションを作成して切り替えます。その場合はメインセッションをその場でリセットします。`/reset` と入力すると、現在のセッションに対する Gateway の明示的なインプレースリセットを保持します。
    - チャットモデルピッカーは、Gateway の設定済みモデルビューを要求します。`agents.defaults.models` が存在する場合、その許可リストがピッカーを駆動します。これには、プロバイダースコープのカタログを動的に保つ `provider/*` エントリーも含まれます。それ以外の場合、ピッカーは明示的な `models.providers.*.models` エントリーと、利用可能な認証を持つプロバイダーを表示します。完全なカタログは、`view: "all"` を指定したデバッグ用 `models.list` RPC から引き続き利用できます。
    - 新しい Gateway セッション使用量レポートに現在のコンテキストトークンが含まれる場合、チャットコンポーザーツールバーには使用率を示す小さなコンテキスト使用量リングが表示されます。完全なトークン詳細はツールチップにあります。リングはコンテキスト圧力が高いと警告スタイルに切り替わり、推奨 Compaction レベルでは通常のセッション Compaction パスを実行するコンパクトなボタンを表示します。古いトークンスナップショットは、Gateway が新しい使用量を再度報告するまで非表示になります。

  </Accordion>
  <Accordion title="トークモード（ブラウザー realtime）">
    トークモードは、登録済みの realtime 音声プロバイダーを使用します。OpenAI は、`talk.realtime.provider: "openai"` に加えて `openai` API キー認証プロファイル、`talk.realtime.providers.openai.apiKey`、または `OPENAI_API_KEY` で設定します。OpenAI OAuth プロファイルは Realtime 音声を設定しません。Google は、`talk.realtime.provider: "google"` に加えて `talk.realtime.providers.google.apiKey` で設定します。ブラウザーが標準プロバイダー API キーを受け取ることはありません。OpenAI は WebRTC 用の一時的な Realtime クライアントシークレットを受け取ります。Google Live は、ブラウザー WebSocket セッション用に制約された 1 回限りの Live API 認証トークンを受け取ります。このトークンには、Gateway によって指示とツール宣言が固定されます。バックエンド realtime ブリッジのみを公開するプロバイダーは Gateway リレートランスポート経由で実行されるため、認証情報とベンダーソケットはサーバー側に留まり、ブラウザー音声は認証済み Gateway RPC 経由で移動します。Realtime セッションプロンプトは Gateway によって組み立てられます。`talk.client.create` は呼び出し元が指定する指示オーバーライドを受け付けません。

    Chat composer には、Talk の開始/停止ボタンの横に Talk オプションボタンがあります。オプションは次の Talk セッションに適用され、プロバイダー、トランスポート、モデル、音声、推論エフォート、VAD しきい値、無音時間、プレフィックスパディングを上書きできます。オプションが空欄の場合、Gateway は利用可能なら設定済みのデフォルトを使用し、なければプロバイダーのデフォルトを使用します。Gateway リレーを選択するとバックエンドリレーパスが強制されます。WebRTC を選択するとセッションはクライアント所有のままになり、プロバイダーがブラウザーセッションを作成できない場合にリレーへ暗黙にフォールバックせず失敗します。

    Chat composer では、Talk コントロールはマイクのディクテーションボタンの横にある波形ボタンです。Talk が開始すると、composer のステータス行には、音声が接続されている間はまず `Connecting Talk...`、続いて `Talk live` が表示されます。またはリアルタイムのツール呼び出しが `talk.client.toolCall` を通じて設定済みのより大きなモデルに問い合わせている間は `Asking OpenClaw...` が表示されます。

    メンテナー向けライブスモーク: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` は、OpenAI バックエンド WebSocket ブリッジ、OpenAI ブラウザー WebRTC SDP 交換、Google Live の制約付きトークンによるブラウザー WebSocket セットアップ、偽のマイクメディアを使った Gateway リレーのブラウザーアダプターを検証します。このコマンドはプロバイダーのステータスのみを出力し、シークレットはログに記録しません。

  </Accordion>
  <Accordion title="停止と中止">
    - **Stop** をクリックします（`chat.abort` を呼び出します）。
    - 実行がアクティブな間、通常のフォローアップはキューに入ります。キュー内のメッセージで **Steer** をクリックすると、そのフォローアップを実行中のターンに注入できます。
    - `/stop`（または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` のような単独の中止フレーズ）を入力すると、帯域外で中止します。
    - `chat.abort` は、そのセッションのすべてのアクティブな実行を中止するために `{ sessionKey }`（`runId` なし）をサポートします。

  </Accordion>
  <Accordion title="中止時の部分保持">
    - 実行が中止された場合でも、部分的なアシスタントテキストは UI に表示できます。
    - Gateway は、バッファ済み出力が存在する場合、中止された部分的なアシスタントテキストをトランスクリプト履歴に永続化します。
    - 永続化されたエントリには中止メタデータが含まれるため、トランスクリプトの利用側は中止された部分と通常完了の出力を区別できます。

  </Accordion>
</AccordionGroup>

## PWA のインストールと Web Push

Control UI には `manifest.webmanifest` とサービスワーカーが同梱されているため、最新のブラウザーではスタンドアロン PWA としてインストールできます。Web Push により、タブやブラウザーウィンドウが開いていない場合でも、Gateway は通知でインストール済み PWA を起動できます。

OpenClaw の更新直後にページに **Protocol mismatch** が表示される場合は、まず `openclaw dashboard` でダッシュボードを開き直し、ページをハードリフレッシュしてください。それでも失敗する場合は、ダッシュボードのオリジンのサイトデータを消去するか、プライベートブラウザーウィンドウでテストしてください。古いタブやブラウザーのサービスワーカーキャッシュが、更新前の Control UI バンドルを新しい Gateway に対して実行し続けることがあります。

| サーフェス                                            | 役割                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA マニフェスト。到達可能になるとブラウザーが「アプリをインストール」を提示します。 |
| `ui/public/sw.js`                                     | `push` イベントと通知クリックを処理するサービスワーカーです。 |
| `push/vapid-keys.json`（OpenClaw 状態ディレクトリ配下） | Web Push ペイロードの署名に使用する自動生成の VAPID キーペアです。 |
| `push/web-push-subscriptions.json`                    | 永続化されたブラウザー購読エンドポイントです。                     |

キーを固定したい場合（複数ホストのデプロイ、シークレットローテーション、テストなど）は、Gateway プロセス上の環境変数で VAPID キーペアを上書きします。

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（デフォルトは `https://openclaw.ai`）

Control UI は、ブラウザー購読の登録とテストに、これらのスコープ制限付き Gateway メソッドを使用します。

- `push.web.vapidPublicKey` — アクティブな VAPID 公開鍵を取得します。
- `push.web.subscribe` — `endpoint` と `keys.p256dh`/`keys.auth` を登録します。
- `push.web.unsubscribe` — 登録済みエンドポイントを削除します。
- `push.web.test` — 呼び出し元の購読にテスト通知を送信します。

<Note>
Web Push は、iOS APNS リレーパス（リレー支援のプッシュについては [設定](/ja-JP/gateway/configuration) を参照）および既存の `push.test` メソッドとは独立しています。これらはネイティブモバイルのペアリングを対象にしています。
</Note>

## ホスト埋め込み

アシスタントメッセージは、`[embed ...]` ショートコードでホストされた Web コンテンツをインライン表示できます。iframe サンドボックスポリシーは `gateway.controlUi.embedSandbox` で制御されます。

<Tabs>
  <Tab title="strict">
    ホスト埋め込み内でのスクリプト実行を無効にします。
  </Tab>
  <Tab title="scripts（デフォルト）">
    オリジン分離を維持しながらインタラクティブな埋め込みを許可します。これがデフォルトであり、通常は自己完結型のブラウザーゲームやウィジェットには十分です。
  </Tab>
  <Tab title="trusted">
    より強い権限を意図的に必要とする同一サイトのドキュメント向けに、`allow-scripts` に加えて `allow-same-origin` を追加します。
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
埋め込みドキュメントが同一オリジンの動作を本当に必要とする場合にのみ `trusted` を使用してください。ほとんどのエージェント生成ゲームやインタラクティブキャンバスでは、`scripts` のほうが安全な選択です。
</Warning>

絶対外部 `http(s)` 埋め込み URL はデフォルトでブロックされたままです。意図的に `[embed url="https://..."]` でサードパーティページを読み込みたい場合は、`gateway.controlUi.allowExternalEmbedUrls: true` を設定してください。

## Chat メッセージの幅

グループ化された Chat メッセージは、読みやすいデフォルトの最大幅を使用します。ワイドモニターのデプロイでは、バンドル済み CSS にパッチを当てずに `gateway.controlUi.chatMessageMaxWidth` を設定して上書きできます。

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

この値はブラウザーに到達する前に検証されます。サポートされる値には、`960px` や `82%` のような単純な長さとパーセンテージに加え、制約付きの `min(...)`、`max(...)`、`clamp(...)`、`calc(...)`、`fit-content(...)` 幅式が含まれます。

## Tailnet アクセス（推奨）

<Tabs>
  <Tab title="統合 Tailscale Serve（推奨）">
    Gateway を loopback に置いたまま、Tailscale Serve に HTTPS でプロキシさせます。

    ```bash
    openclaw gateway --tailscale serve
    ```

    開く場所:

    - `https://<magicdns>/`（または設定済みの `gateway.controlUi.basePath`）

    デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket Serve リクエストは Tailscale ID ヘッダー（`tailscale-user-login`）で認証できます。OpenClaw は、`x-forwarded-for` アドレスを `tailscale whois` で解決してヘッダーと照合することで ID を検証し、リクエストが Tailscale の `x-forwarded-*` ヘッダー付きで loopback に到達した場合にのみ受け入れます。ブラウザーのデバイス ID を持つ Control UI オペレーターセッションでは、この検証済み Serve パスはデバイスペアリングの往復もスキップします。デバイスなしのブラウザーと node ロール接続は、引き続き通常のデバイスチェックに従います。Serve トラフィックでも明示的な共有シークレット資格情報を要求したい場合は、`gateway.auth.allowTailscale: false` を設定してください。その後、`gateway.auth.mode: "token"` または `"password"` を使用します。

    その非同期 Serve ID パスでは、同じクライアント IP と認証スコープに対する失敗した認証試行は、レート制限書き込みの前に直列化されます。そのため、同じブラウザーからの並行した不正な再試行では、2 つの単純な不一致が並列に競合する代わりに、2 番目のリクエストで `retry later` が表示されることがあります。

    <Warning>
    トークンなしの Serve 認証は、gateway ホストが信頼されていることを前提とします。そのホストで信頼できないローカルコードが実行される可能性がある場合は、トークン/パスワード認証を要求してください。
    </Warning>

  </Tab>
  <Tab title="tailnet にバインド + トークン">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    次に開きます。

    - `http://<tailscale-ip>:18789/`（または設定済みの `gateway.controlUi.basePath`）

    一致する共有シークレットを UI 設定に貼り付けます（`connect.params.auth.token` または `connect.params.auth.password` として送信されます）。

  </Tab>
</Tabs>

## 安全でない HTTP

プレーン HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、ブラウザーは **非セキュアコンテキスト** で実行され、WebCrypto をブロックします。デフォルトでは、OpenClaw はデバイス ID のない Control UI 接続を **ブロック** します。

文書化されている例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost 限定の安全でない HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` によるオペレーター Control UI 認証の成功
- 緊急時用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS（Tailscale Serve）を使用するか、UI をローカルで開きます。

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（gateway ホスト上）

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

    `allowInsecureAuth` はローカル互換性トグルのみです。

    - 非セキュアな HTTP コンテキストで、localhost の Control UI セッションがデバイス ID なしで進行できるようにします。
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
    `dangerouslyDisableDeviceAuth` は Control UI のデバイス ID チェックを無効にし、重大なセキュリティ低下を招きます。緊急使用後はすぐに戻してください。
    </Warning>

  </Accordion>
  <Accordion title="信頼済みプロキシの注記">
    - trusted-proxy 認証が成功すると、デバイス ID なしで **operator** Control UI セッションを許可できます。
    - これは node ロールの Control UI セッションには拡張されません。
    - 同一ホストの loopback リバースプロキシは、引き続き trusted-proxy 認証を満たしません。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth) を参照してください。

  </Accordion>
</AccordionGroup>

HTTPS セットアップのガイダンスについては [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## コンテンツセキュリティポリシー

Control UI には厳格な `img-src` ポリシーが同梱されています。許可されるのは **same-origin** アセット、`data:` URL、ローカル生成された `blob:` URL のみです。リモートの `http(s)` およびプロトコル相対の画像 URL はブラウザーによって拒否され、ネットワーク取得は発生しません。

実際の意味:

- 相対パス配下（たとえば `/avatars/<id>`）で提供されるアバターと画像は、UI が取得してローカル `blob:` URL に変換する認証付きアバタールートを含め、引き続きレンダリングされます。
- インラインの `data:image/...` URL は引き続きレンダリングされます（プロトコル内ペイロードに有用です）。
- Control UI によって作成されたローカル `blob:` URL は引き続きレンダリングされます。
- チャンネルメタデータによって出力されたリモートアバター URL は、Control UI のアバターヘルパーで取り除かれ、組み込みのロゴ/バッジに置き換えられます。そのため、侵害された、または悪意のあるチャンネルが、オペレーターのブラウザーから任意のリモート画像取得を強制することはできません。

この動作を得るために変更は不要です。常に有効であり、設定できません。

## アバタールート認証

gateway 認証が設定されている場合、Control UI アバターエンドポイントは API の他の部分と同じ gateway トークンを要求します。

- `GET /avatar/<agentId>` は、認証済みの呼び出し元にのみアバター画像を返します。`GET /avatar/<agentId>?meta=1` は同じルールの下でアバターメタデータを返します。
- いずれのルートへの未認証リクエストも拒否されます（兄弟の assistant-media ルートと一致します）。これにより、他の部分が保護されているホストで、アバタールートがエージェント ID を漏らすことを防ぎます。
- Control UI 自体は、アバター取得時に gateway トークンを bearer ヘッダーとして転送し、認証済み blob URL を使用するため、画像はダッシュボード内で引き続きレンダリングされます。

Gateway 認証を無効にすると（共有ホストでは非推奨）、アバタールートも Gateway の他の部分と同様に未認証になります。

## アシスタントメディアルート認証

Gateway 認証が構成されている場合、アシスタントのローカルメディアプレビューは 2 段階のルートを使用します。

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` には通常の Control UI オペレーター認証が必要です。ブラウザーは可用性を確認するときに、Gateway トークンを Bearer ヘッダーとして送信します。
- 成功したメタデータレスポンスには、その正確なソースパスにスコープされた短命の `mediaTicket` が含まれます。
- ブラウザーでレンダリングされる画像、音声、動画、ドキュメントの URL は、アクティブな Gateway トークンやパスワードではなく `mediaTicket=<ticket>` を使用します。チケットはすぐに期限切れになり、別のソースを認可することはできません。

これにより、再利用可能な Gateway 認証情報を表示可能なメディア URL に入れることなく、通常のメディアレンダリングをブラウザー標準のメディア要素と互換に保てます。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを提供します。次のコマンドでビルドします。

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

ブラウザーが空白のダッシュボードを読み込み、DevTools に有用なエラーが表示されない場合、拡張機能または早期に実行されるコンテンツスクリプトが JavaScript モジュールアプリの評価を妨げた可能性があります。静的ページには、起動後に `<openclaw-app>` が登録されていない場合に表示されるプレーン HTML の復旧パネルが含まれています。

ブラウザー環境を変更した後にパネルの **Try again** アクションを使用するか、次の確認後に手動で再読み込みします。

- すべてのページに注入する拡張機能、特に `<all_urls>` コンテンツスクリプトを持つ拡張機能を無効にします。
- プライベートウィンドウ、クリーンなブラウザープロファイル、または別のブラウザーを試します。
- Gateway を実行したままにし、ブラウザー変更後に同じダッシュボード URL を確認します。

## デバッグ/テスト: 開発サーバー + リモート Gateway

Control UI は静的ファイルです。WebSocket ターゲットは構成可能で、HTTP オリジンとは異なるものにできます。これは、Vite 開発サーバーをローカルで使い、Gateway を別の場所で実行したい場合に便利です。

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
    - `gatewayUrl` 経由で完全な `ws://` または `wss://` エンドポイントを渡す場合は、ブラウザーがクエリ文字列を正しく解析できるように `gatewayUrl` 値を URL エンコードします。
    - 可能な限り、`token` は URL フラグメント（`#token=...`）経由で渡す必要があります。フラグメントはサーバーに送信されないため、リクエストログや Referer の漏えいを避けられます。レガシーの `?token=` クエリパラメーターも互換性のために 1 回だけインポートされますが、フォールバックとしてのみ扱われ、ブートストラップ直後に削除されます。
    - `password` はメモリ内にのみ保持されます。
    - `gatewayUrl` が設定されている場合、UI は構成や環境の認証情報にフォールバックしません。`token`（または `password`）を明示的に指定してください。明示的な認証情報がない場合はエラーです。
    - Gateway が TLS の背後にある場合（Tailscale Serve、HTTPS プロキシなど）は `wss://` を使用します。
    - `gatewayUrl` はクリックジャッキングを防ぐため、トップレベルウィンドウ（埋め込みではない）でのみ受け付けられます。
    - 公開された非ループバックの Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を明示的に設定する必要があります（完全なオリジン）。ループバック、RFC1918/link-local、`.local`、`.ts.net`、または Tailscale CGNAT ホストからのプライベートな同一オリジン LAN/Tailnet 読み込みは、Host ヘッダーフォールバックを有効にしなくても受け付けられます。
    - Gateway の起動時に、有効な実行時バインドとポートから `http://localhost:<port>` や `http://127.0.0.1:<port>` などのローカルオリジンがシードされる場合がありますが、リモートブラウザーのオリジンには引き続き明示的なエントリが必要です。
    - 厳密に制御されたローカルテスト以外では `gateway.controlUi.allowedOrigins: ["*"]` を使用しないでください。これは任意のブラウザーオリジンを許可するという意味であり、「使用中のどのホストにも一致する」という意味ではありません。
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

リモートアクセスのセットアップ詳細: [リモートアクセス](/ja-JP/gateway/remote)。

## 関連

- [ダッシュボード](/ja-JP/web/dashboard) — Gateway ダッシュボード
- [ヘルスチェック](/ja-JP/gateway/health) — Gateway ヘルスモニタリング
- [TUI](/ja-JP/web/tui) — ターミナルユーザーインターフェイス
- [WebChat](/ja-JP/web/webchat) — ブラウザーベースのチャットインターフェイス
