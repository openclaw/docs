---
read_when:
    - ブラウザから Gateway を操作したい場合
    - SSH トンネルなしで Tailnet アクセスを使いたい
sidebarTitle: Control UI
summary: Gateway 用のブラウザベースのコントロール UI（チャット、アクティビティ、ノード、設定）
title: コントロール UI
x-i18n:
    generated_at: "2026-07-03T09:23:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b23d0e2aeefc3b746f1ab51cd9049135e2695ab77cf5cbb5eab6ec0df90f011d
    source_path: web/control-ui.md
    workflow: 16
---

Control UI は、Gateway によって提供される小さな **Vite + Lit** シングルページアプリです。

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します（例: `/openclaw`）

同じポート上の **Gateway WebSocket に直接** 通信します。

## クイック起動（ローカル）

Gateway が同じコンピューター上で実行されている場合は、次を開きます。

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）

ページの読み込みに失敗する場合は、まず Gateway を起動します: `openclaw gateway`。

<Note>
ネイティブ Windows LAN バインドでは、Gateway ホスト上で `127.0.0.1` が動作していても、Windows Firewall または組織管理の Group Policy によって、通知された LAN URL がブロックされることがあります。Windows ホストで `openclaw gateway status --deep` を実行してください。ブロックされている可能性が高いポート、プロファイルの不一致、ポリシーが無視する可能性のあるローカルファイアウォールルールが報告されます。
</Note>

認証は、WebSocket ハンドシェイク中に次を介して提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合の Tailscale Serve ID ヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合の信頼済みプロキシ ID ヘッダー

ダッシュボード設定パネルは、現在のブラウザータブセッションと選択された Gateway URL のトークンを保持します。パスワードは永続化されません。オンボーディングでは通常、初回接続時に共有シークレット認証用の Gateway トークンが生成されますが、`gateway.auth.mode` が `"password"` の場合はパスワード認証も機能します。

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

ブラウザーがすでにペアリング済みで、読み取りアクセスから書き込み/管理者アクセスに変更した場合、これは無音の再接続ではなく承認アップグレードとして扱われます。OpenClaw は古い承認を有効なまま維持し、より広い再接続をブロックし、新しいスコープセットの明示的な承認を求めます。

承認後、デバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り再承認は不要です。トークンローテーションと取り消しについては [Devices CLI](/ja-JP/cli/devices) を参照してください。

`openclaw_gateway` アダプターを介して接続する Paperclip エージェントも、同じ初回実行承認フローを使用します。初回接続の試行後、`openclaw devices approve --latest` を実行して保留中のリクエストをプレビューし、表示された `openclaw devices approve <requestId>` コマンドを再実行して承認します。リモート Gateway には明示的な `--url` と `--token` 値を渡してください。再起動後も承認を安定させるには、実行ごとに新しい一時デバイス ID を生成させるのではなく、Paperclip で永続的な `adapterConfig.devicePrivateKeyPem` を設定します。

<Note>
- 直接の local loopback ブラウザー接続（`127.0.0.1` / `localhost`）は自動承認されます。
- `gateway.auth.allowTailscale: true` で、Tailscale ID が検証され、ブラウザーがデバイス ID を提示する場合、Tailscale Serve は Control UI オペレーターセッションのペアリング往復を省略できます。
- 直接の Tailnet バインド、LAN ブラウザー接続、デバイス ID のないブラウザープロファイルでは、引き続き明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイス ID を生成するため、ブラウザーを切り替えたりブラウザーデータを消去したりすると、再ペアリングが必要になります。

</Note>

## 個人 ID（ブラウザーローカル）

Control UI は、共有セッションでの帰属表示のため、送信メッセージに付与されるブラウザー単位の個人 ID（表示名とアバター）をサポートします。これはブラウザーストレージに保存され、現在のブラウザープロファイルにスコープされ、実際に送信したメッセージ上の通常のトランスクリプト作成者メタデータを除き、他のデバイスへ同期されたりサーバー側に永続化されたりしません。サイトデータを消去したりブラウザーを切り替えたりすると空にリセットされます。

同じブラウザーローカルのパターンは、アシスタントアバターの上書きにも適用されます。アップロードされたアシスタントアバターは、ローカルブラウザー上でのみ Gateway が解決した ID に重ねられ、`config.patch` を通じて往復することはありません。共有の `ui.assistant.avatar` 設定フィールドは、そのフィールドを直接書き込む非 UI クライアント（スクリプト化された Gateway やカスタムダッシュボードなど）向けに引き続き利用できます。

## ランタイム設定エンドポイント

Control UI は、Gateway の Control UI ベースパスから相対解決される `/control-ui-config.json` からランタイム設定を取得します（たとえば UI が `/__openclaw__/` 配下で提供される場合は `/__openclaw__/control-ui-config.json`）。このエンドポイントは、HTTP サーフェスの他の部分と同じ Gateway 認証で保護されています。未認証のブラウザーは取得できず、取得が成功するには、すでに有効な Gateway トークン/パスワード、Tailscale Serve ID、または信頼済みプロキシ ID のいずれかが必要です。

## 言語サポート

Control UI は、初回読み込み時にブラウザーのロケールに基づいて自身をローカライズできます。後で上書きするには、**Overview -> Gateway Access -> Language** を開きます。ロケールピッカーは Appearance ではなく Gateway Access カード内にあります。

- サポートされるロケール: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 英語以外の翻訳はブラウザーで遅延読み込みされます。
- 選択したロケールはブラウザーストレージに保存され、以後の訪問で再利用されます。
- 翻訳キーが欠落している場合は英語にフォールバックします。

Docs の翻訳は同じ英語以外のロケールセット向けに生成されますが、Docs サイト組み込みの Mintlify 言語ピッカーは Mintlify が受け入れるロケールコードに制限されます。タイ語（`th`）とペルシア語（`fa`）の Docs は引き続き公開リポジトリに生成されますが、Mintlify がそれらのコードをサポートするまで、そのピッカーには表示されない場合があります。

## 外観テーマ

Appearance パネルには、組み込みの Claw、Knot、Dash テーマに加え、ブラウザーローカルの tweakcn インポートスロットが 1 つあります。テーマをインポートするには、[tweakcn editor](https://tweakcn.com/editor/theme) を開き、テーマを選択または作成し、**Share** をクリックして、コピーされたテーマリンクを Appearance に貼り付けます。インポーターは `https://tweakcn.com/r/themes/<id>` レジストリ URL、`https://tweakcn.com/editor/theme?theme=amethyst-haze` のようなエディター URL、相対 `/themes/<id>` パス、生のテーマ ID、`amethyst-haze` などのデフォルトテーマ名も受け入れます。

Appearance にはブラウザーローカルの Text size 設定も含まれます。この設定は Control UI の他の設定とともに保存され、チャットテキスト、コンポーザーテキスト、ツールカード、チャットサイドバーに適用されます。また、モバイル Safari がフォーカス時に自動ズームしないよう、テキスト入力は少なくとも 16px に保たれます。

インポートされたテーマは現在のブラウザープロファイルにのみ保存されます。Gateway 設定には書き込まれず、デバイス間で同期されません。インポートされたテーマを置き換えると、1 つのローカルスロットが更新されます。クリアすると、インポートされたテーマが選択されていた場合、アクティブテーマは Claw に戻ります。

## できること（現在）

<AccordionGroup>
  <Accordion title="チャットと音声会話">
    - Gateway WS（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）を介してモデルとチャットします。
    - チャット履歴の更新では、メッセージごとのテキスト上限付きで範囲を限定した最近のウィンドウを要求するため、大きなセッションでも、チャットが使用可能になる前にブラウザーへ完全なトランスクリプトペイロードのレンダリングを強制しません。
    - ブラウザーのリアルタイムセッションを通じて音声会話します。OpenAI は直接 WebRTC を使用し、Google Live は WebSocket 経由の制約付き 1 回限りブラウザートークンを使用し、バックエンド専用のリアルタイム音声 Plugin は Gateway リレートランスポートを使用します。クライアント所有のプロバイダーセッションは `talk.client.create` で開始します。Gateway リレーセッションは `talk.session.create` で開始します。リレーはプロバイダー認証情報を Gateway 上に保持しながら、ブラウザーが `talk.session.appendAudio` を通じてマイク PCM をストリーミングし、Gateway ポリシーと設定済みのより大きな OpenClaw モデルのために `openclaw_agent_consult` プロバイダーツール呼び出しを `talk.client.toolCall` 経由で転送し、アクティブ実行の音声誘導を `talk.client.steer` または `talk.session.steer` 経由でルーティングします。
    - チャット内でツール呼び出しとライブツール出力カードをストリーミングします（エージェントイベント）。
    - Activity タブには、既存の `session.tool` / ツールイベント配信からのライブツールアクティビティについて、ブラウザーローカルで秘匿優先の要約が表示されます。

  </Accordion>
  <Accordion title="チャンネル、インスタンス、セッション、Dreaming">
    - チャンネル: 組み込みおよびバンドル/外部 Plugin チャンネルのステータス、QR ログイン、チャンネルごとの設定（`channels.status`, `web.login.*`, `config.patch`）。
    - チャンネルプローブ更新では、遅いプロバイダーチェックが完了するまで以前のスナップショットを表示し続け、プローブまたは監査が UI 予算を超えた場合は部分スナップショットにラベルが付けられます。
    - インスタンス: プレゼンス一覧と更新（`system-presence`）。
    - セッション: デフォルトで設定済みエージェントセッションを一覧表示し、古い未設定エージェントセッションキーからフォールバックし、セッションごとのモデル/thinking/fast/verbose/trace/reasoning 上書きを適用します（`sessions.list`, `sessions.patch`）。
    - Dreams: Dreaming ステータス、有効/無効トグル、Dream Diary リーダー（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）。

  </Accordion>
  <Accordion title="Cron、Skills、ノード、実行承認">
    - Cron ジョブ: 一覧/追加/編集/実行/有効化/無効化と実行履歴（`cron.*`）。
    - Skills: ステータス、有効化/無効化、インストール、API キー更新（`skills.*`）。
    - ノード: 一覧と能力（`node.list`）。
    - 実行承認: Gateway またはノードの許可リストと `exec host=gateway/node` の確認ポリシーを編集します（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="設定">
    - `~/.openclaw/openclaw.json` を表示/編集します（`config.get`, `config.set`）。
    - MCP には、設定済みサーバー、有効化、OAuth/フィルター/並列の要約、一般的なオペレーターコマンド、スコープ付き `mcp` 設定エディター用の専用設定ページがあります。
    - 検証付きで適用して再起動し（`config.apply`）、最後にアクティブだったセッションを起こします。
    - 書き込みには、同時編集による上書きを防ぐためのベースハッシュガードが含まれます。
    - 書き込み（`config.set`/`config.apply`/`config.patch`）では、送信された設定ペイロード内の参照について、アクティブな SecretRef 解決を事前確認します。未解決のアクティブな送信済み参照は書き込み前に拒否されます。
    - フォーム保存では、保存済み設定から復元できない古い秘匿プレースホルダーを破棄しつつ、保存済みシークレットにまだ対応する秘匿値を保持します。
    - スキーマとフォームレンダリング（`config.schema` / `config.schema.lookup`。フィールド `title` / `description`、一致した UI ヒント、直下の子要約、ネストされたオブジェクト/ワイルドカード/配列/合成ノードの Docs メタデータ、利用可能な場合は Plugin とチャンネルのスキーマを含む）。Raw JSON エディターは、スナップショットが安全に生の往復を行える場合にのみ利用できます。
    - スナップショットが生テキストを安全に往復できない場合、Control UI は Form モードを強制し、そのスナップショットの Raw モードを無効にします。
    - Raw JSON エディターの "Reset to saved" は、平坦化されたスナップショットを再レンダリングするのではなく、生で作成された形状（書式、コメント、`$include` レイアウト）を保持するため、スナップショットが安全に往復できる場合は外部編集がリセット後も残ります。
    - 構造化された SecretRef オブジェクト値は、偶発的なオブジェクトから文字列への破損を防ぐため、フォームのテキスト入力では読み取り専用でレンダリングされます。

  </Accordion>
  <Accordion title="デバッグ、ログ、更新">
    - デバッグ: ステータス/ヘルス/モデルのスナップショット、イベントログ、手動 RPC 呼び出し（`status`, `health`, `models.list`）。
    - イベントログには、Control UI の更新/RPC タイミング、遅いチャット/設定レンダリングのタイミング、ブラウザーがそれらの PerformanceObserver エントリタイプを公開している場合の長いアニメーションフレームまたは長いタスクに関するブラウザー応答性エントリが含まれます。
    - ログ: フィルター/エクスポート付きで Gateway ファイルログをライブテールします（`logs.tail`）。
    - 更新: 再起動レポート付きでパッケージ/git 更新と再起動を実行し（`update.run`）、再接続後に `update.status` をポーリングして実行中の Gateway バージョンを確認します。

  </Accordion>
  <Accordion title="Cron ジョブパネルの注記">
    - 分離ジョブでは、配信はデフォルトで要約の通知です。内部専用の実行にしたい場合は none に切り替えられます。
    - announce が選択されている場合、チャンネル/ターゲットフィールドが表示されます。
    - Webhook モードは `delivery.mode = "webhook"` を使用し、`delivery.to` には有効な HTTP(S) Webhook URL を設定します。
    - メインセッションジョブでは、webhook と none の配信モードを利用できます。
    - 高度な編集コントロールには、実行後削除、エージェント上書きのクリア、cron の厳密/分散オプション、エージェントモデル/思考の上書き、ベストエフォート配信の切り替えが含まれます。
    - フォーム検証はフィールド単位のエラーとしてインライン表示されます。無効な値がある場合、修正されるまで保存ボタンは無効になります。
    - 専用の bearer トークンを送信するには `cron.webhookToken` を設定します。省略した場合、Webhook は auth ヘッダーなしで送信されます。
    - 非推奨フォールバック: `openclaw doctor --fix` を実行して、`notify: true` を持つ保存済みのレガシージョブを `cron.webhook` からジョブごとの明示的な Webhook または完了配信へ移行してください。

  </Accordion>
</AccordionGroup>

## MCP ページ

専用の MCP ページは、`mcp.servers` 配下の OpenClaw 管理 MCP サーバー向けのオペレータービューです。MCP トランスポートを単独で起動するものではありません。保存済み設定の検査と編集に使用し、ライブサーバーの証明が必要な場合は `openclaw mcp doctor --probe` を使用してください。

典型的なワークフロー:

1. サイドバーから **MCP** を開きます。
2. 合計、有効、OAuth、フィルター済みサーバー数のサマリーカードを確認します。
3. 各サーバー行で、トランスポート、有効化状態、auth、フィルター、タイムアウト、コマンドヒントを確認します。
4. サーバーを設定済みのままにしつつランタイム探索から外しておく必要がある場合は、有効化状態を切り替えます。
5. サーバー定義、ヘッダー、TLS/mTLS パス、OAuth メタデータ、ツールフィルター、Codex 投影メタデータ向けに、スコープされた `mcp` 設定セクションを編集します。
6. 設定を書き込むには **保存** を使用し、実行中の Gateway に変更後の設定を適用させる場合は **保存して公開** を使用します。
7. 編集したプロセスに静的診断、ライブ証明、またはキャッシュ済みランタイムの破棄が必要な場合は、ターミナルから `openclaw mcp status --verbose`、`openclaw mcp doctor --probe`、または `openclaw mcp reload` を実行します。

このページは、レンダリング前に認証情報を含む URL 風の値を伏せ字にし、コマンドスニペット内のサーバー名を引用するため、コピーしたコマンドはスペースやシェルのメタ文字を含んでいても機能します。完全な CLI と設定のリファレンスは [MCP](/ja-JP/cli/mcp) にあります。

## アクティビティタブ

アクティビティタブは、ライブツールアクティビティのための一時的なブラウザローカルのオブザーバーです。これは、チャットのツールカードを支えるものと同じ Gateway の `session.tool` / ツールイベントストリームから派生します。別の Gateway イベントファミリー、エンドポイント、永続的なアクティビティストア、メトリクスフィード、外部オブザーバーストリームを追加するものではありません。

アクティビティエントリは、サニタイズ済みの要約と、伏せ字化され切り詰められた出力プレビューのみを保持します。ツール引数の値はアクティビティ状態に保存されません。UI は引数が非表示であることを示し、引数フィールド数のみを記録します。メモリ内のリストは現在のブラウザタブに追従し、Control UI 内のナビゲーションでは保持され、ページ再読み込み、セッション切り替え、または **クリア** でリセットされます。

## チャットの動作

<AccordionGroup>
  <Accordion title="送信と履歴のセマンティクス">
    - `chat.send` は **非ブロッキング** です。`{ runId, status: "started" }` で即座に ack し、応答は `chat` イベント経由でストリームされます。信頼済みの Control UI クライアントは、ローカル診断用に任意の ACK タイミングメタデータも受け取る場合があります。
    - チャットアップロードは画像と動画以外のファイルを受け付けます。画像はネイティブの画像パスを保持し、その他のファイルは管理対象メディアとして保存され、履歴には添付リンクとして表示されます。
    - 同じ `idempotencyKey` で再送信すると、実行中は `{ status: "in_flight" }` を返し、完了後は `{ status: "ok" }` を返します。
    - `chat.history` の応答は UI の安全性のためサイズ制限されています。トランスクリプトエントリが大きすぎる場合、Gateway は長いテキストフィールドを切り詰め、重いメタデータブロックを省略し、過大なメッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換える場合があります。
    - 表示可能なアシスタントメッセージが `chat.history` で切り詰められた場合、サイドリーダーは `sessionKey`、必要に応じてアクティブな `agentId`、およびトランスクリプトの `messageId` によって、表示正規化済みの完全なトランスクリプトエントリを `chat.message.get` 経由でオンデマンド取得できます。Gateway がそれ以上返せない場合、リーダーは切り詰められたプレビューを黙って繰り返すのではなく、明示的な利用不可状態を表示します。
    - アシスタント/生成画像は管理対象メディア参照として永続化され、認証済み Gateway メディア URL 経由で返されるため、再読み込みは生の base64 画像ペイロードがチャット履歴応答に残っていることに依存しません。
    - `chat.history` をレンダリングする際、Control UI は表示専用のインラインディレクティブタグ（例: `[[reply_to_*]]` と `[[audio_as_voice]]`）、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、漏出した ASCII/全角のモデル制御トークンを、表示されるアシスタントテキストから取り除き、表示テキスト全体が厳密なサイレントトークン `NO_REPLY` / `no_reply` または Heartbeat 確認トークン `HEARTBEAT_OK` のみであるアシスタントエントリを省略します。
    - アクティブな送信中および最終履歴更新中に `chat.history` が一時的に古いスナップショットを返した場合でも、チャットビューはローカルの楽観的なユーザー/アシスタントメッセージを表示し続けます。Gateway 履歴が追いつくと、正規のトランスクリプトがそれらのローカルメッセージを置き換えます。
    - ライブ `chat` イベントは配信状態であり、`chat.history` は永続的なセッショントランスクリプトから再構築されます。ツール最終イベントの後、Control UI は履歴を再読み込みし、小さな楽観的末尾のみをマージします。トランスクリプト境界は [WebChat](/ja-JP/web/webchat) に記載されています。
    - `chat.inject` はセッションのトランスクリプトにアシスタントノートを追加し、UI 専用更新のために `chat` イベントをブロードキャストします（エージェント実行なし、チャンネル配信なし）。
    - サイドバーには最近のセッションが、新規セッションアクション、すべてのセッションリンク、完全なセッションピッカーを開くセッション検索ボタン（選択したエージェントでスコープされ、検索とページネーション付き）とともに一覧表示されます。エージェントを切り替えると、そのエージェントに紐づくセッションのみが表示され、保存済みのダッシュボードセッションがまだない場合はそのエージェントのメインセッションにフォールバックします。
    - デスクトップ幅では、チャットコントロールはコンパクトな 1 行に留まり、トランスクリプトを下へスクロールしている間は折りたたまれます。上へスクロールする、先頭に戻る、または末尾に到達すると、コントロールが復元されます。
    - 連続する重複したテキストのみのメッセージは、件数バッジ付きの 1 つのバブルとしてレンダリングされます。画像、添付、ツール出力、またはキャンバスプレビューを含むメッセージは折りたたまれません。
    - チャットヘッダーのモデルピッカーと思考ピッカーは、`sessions.patch` 経由でアクティブセッションに即座にパッチを適用します。これらは永続的なセッション上書きであり、1 ターン限りの送信オプションではありません。
    - 同じセッションのモデルピッカー変更がまだ保存中の間にメッセージを送信した場合、コンポーザーは `chat.send` を呼び出す前にそのセッションパッチを待つため、送信は選択されたモデルを使用します。
    - Control UI で `/new` と入力すると、新規チャットと同じ新しいダッシュボードセッションが作成され、そこへ切り替わります。ただし、`session.dmScope: "main"` が設定され、現在の親がエージェントのメインセッションである場合は、そのメインセッションをその場でリセットします。`/reset` と入力すると、現在のセッションに対する Gateway の明示的なその場リセットが保持されます。
    - チャットモデルピッカーは、Gateway の設定済みモデルビューを要求します。`agents.defaults.models` が存在する場合、その許可リストがピッカーを駆動し、プロバイダースコープのカタログを動的に保つ `provider/*` エントリも含まれます。それ以外の場合、ピッカーは明示的な `models.providers.*.models` エントリに加え、使用可能な auth を持つプロバイダーを表示します。完全なカタログは、`view: "all"` を指定したデバッグ用 `models.list` RPC から引き続き利用できます。
    - 新しい Gateway セッション使用量レポートに現在のコンテキストトークンが含まれている場合、チャットコンポーザーのツールバーには使用率を示す小さなコンテキスト使用量リングが表示されます。完全なトークン詳細はそのツールチップにあります。リングはコンテキスト圧力が高いと警告スタイルに切り替わり、推奨される Compaction レベルでは、通常のセッション Compaction パスを実行するコンパクトなボタンを表示します。古いトークンスナップショットは、Gateway が新しい使用量を再度報告するまで非表示になります。

  </Accordion>
  <Accordion title="トークモード（ブラウザリアルタイム）">
    トークモードは、登録済みのリアルタイム音声プロバイダーを使用します。OpenAI は、`talk.realtime.provider: "openai"` と `openai` API キー auth プロファイル、`talk.realtime.providers.openai.apiKey`、または `OPENAI_API_KEY` を組み合わせて設定します。OpenAI OAuth プロファイルは Realtime 音声を設定しません。Google は、`talk.realtime.provider: "google"` と `talk.realtime.providers.google.apiKey` を組み合わせて設定します。ブラウザが標準のプロバイダー API キーを受け取ることはありません。OpenAI は WebRTC 用の一時的な Realtime クライアントシークレットを受け取ります。Google Live は、Gateway によってトークン内に指示とツール宣言が固定された、ブラウザ WebSocket セッション用の 1 回限りの制約付き Live API auth トークンを受け取ります。バックエンドのリアルタイムブリッジのみを公開するプロバイダーは Gateway リレートランスポート経由で実行されるため、認証情報とベンダーソケットはサーバー側に留まり、ブラウザ音声は認証済み Gateway RPC 経由で移動します。Realtime セッションプロンプトは Gateway によって組み立てられます。`talk.client.create` は呼び出し元提供の指示上書きを受け付けません。

    チャットコンポーザーには、トーク開始/停止ボタンの隣にトークオプションボタンがあります。このオプションは次のトークセッションに適用され、プロバイダー、トランスポート、モデル、音声、推論努力、VAD しきい値、無音時間、プレフィックスパディングを上書きできます。オプションが空の場合、Gateway は利用可能な設定済みデフォルトまたはプロバイダーのデフォルトを使用します。Gateway リレーを選択するとバックエンドリレーパスが強制されます。WebRTC を選択するとセッションはクライアント所有のままとなり、プロバイダーがブラウザセッションを作成できない場合でもリレーへ黙ってフォールバックせずに失敗します。

    チャットコンポーザーでは、トークコントロールはマイクディクテーションボタンの隣にある波形ボタンです。トークが開始されると、コンポーザーのステータス行は `Connecting Talk...` を表示し、その後、音声接続中は `Talk live`、リアルタイムツール呼び出しが `talk.client.toolCall` 経由で設定済みのより大きなモデルに問い合わせている間は `Asking OpenClaw...` を表示します。

    メンテナーのライブスモーク: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` は、OpenAI バックエンド WebSocket ブリッジ、OpenAI ブラウザ WebRTC SDP 交換、Google Live 制約付きトークンのブラウザ WebSocket セットアップ、および偽のマイクメディアを使った Gateway リレーのブラウザアダプターを検証します。このコマンドはプロバイダーのステータスのみを出力し、シークレットはログに記録しません。

  </Accordion>
  <Accordion title="停止と中止">
    - **停止** をクリックします（`chat.abort` を呼び出します）。
    - 実行がアクティブな間、通常のフォローアップはキューに入ります。キュー内のメッセージで **誘導** をクリックすると、そのフォローアップを実行中のターンに注入できます。
    - 帯域外で中止するには、`/stop`（または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` などの単独の中止フレーズ）を入力します。
    - `chat.abort` は、そのセッションのすべてのアクティブな実行を中止するために `{ sessionKey }`（`runId` なし）をサポートします。

  </Accordion>
  <Accordion title="中止時の部分保持">
    - 実行が中止された場合でも、部分的なアシスタントテキストは UI に表示される場合があります。
    - Gateway は、バッファ済み出力が存在する場合、中止された部分的なアシスタントテキストをトランスクリプト履歴に永続化します。
    - 永続化されたエントリには中止メタデータが含まれるため、トランスクリプト利用者は中止された部分出力を通常の完了出力と区別できます。

  </Accordion>
</AccordionGroup>

## PWA インストールと Web Push

Control UI は `manifest.webmanifest` とサービスワーカーを同梱しているため、モダンブラウザではスタンドアロン PWA としてインストールできます。Web Push により、タブやブラウザウィンドウが開いていない場合でも、Gateway は通知でインストール済み PWA を起動できます。

OpenClaw の更新直後にページに **Protocol mismatch** が表示される場合は、まず `openclaw dashboard` でダッシュボードを開き直し、ページをハードリフレッシュしてください。それでも失敗する場合は、ダッシュボードのオリジンのサイトデータを消去するか、プライベートブラウザーウィンドウでテストしてください。古いタブやブラウザーのサービスワーカーキャッシュによって、更新前の Control UI バンドルが新しい Gateway に対して実行され続けることがあります。

| サーフェス                                            | 役割                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA マニフェスト。到達可能になると、ブラウザーが「アプリをインストール」を提示します。 |
| `ui/public/sw.js`                                     | `push` イベントと通知クリックを処理するサービスワーカー。 |
| `push/vapid-keys.json` (OpenClaw state dir 配下) | Web Push ペイロードの署名に使われる、自動生成された VAPID キーペア。 |
| `push/web-push-subscriptions.json`                    | 永続化されたブラウザーサブスクリプションエンドポイント。 |

キーを固定したい場合 (マルチホストデプロイ、シークレットローテーション、テストなど) は、Gateway プロセス上の環境変数で VAPID キーペアを上書きします。

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (デフォルトは `https://openclaw.ai`)

Control UI は、ブラウザーサブスクリプションの登録とテストに、これらのスコープ制限付き Gateway メソッドを使用します。

- `push.web.vapidPublicKey` — アクティブな VAPID 公開鍵を取得します。
- `push.web.subscribe` — `endpoint` と `keys.p256dh`/`keys.auth` を登録します。
- `push.web.unsubscribe` — 登録済みのエンドポイントを削除します。
- `push.web.test` — 呼び出し元のサブスクリプションにテスト通知を送信します。

<Note>
Web Push は、iOS APNS リレー経路 (リレー支援のプッシュについては [Configuration](/ja-JP/gateway/configuration) を参照) および既存の `push.test` メソッドとは独立しています。これらはネイティブモバイルのペアリングを対象にします。
</Note>

## ホストされた埋め込み

アシスタントメッセージは、`[embed ...]` ショートコードでホストされた Web コンテンツをインライン表示できます。iframe サンドボックスポリシーは `gateway.controlUi.embedSandbox` で制御されます。

<Tabs>
  <Tab title="strict">
    ホストされた埋め込み内でのスクリプト実行を無効にします。
  </Tab>
  <Tab title="scripts (default)">
    オリジン分離を維持しながらインタラクティブな埋め込みを許可します。これがデフォルトであり、自己完結型のブラウザーゲームやウィジェットには通常十分です。
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
埋め込みドキュメントが本当に same-origin 動作を必要とする場合にのみ `trusted` を使用してください。ほとんどのエージェント生成ゲームやインタラクティブキャンバスでは、`scripts` の方が安全な選択です。
</Warning>

絶対外部 `http(s)` 埋め込み URL は、デフォルトでは引き続きブロックされます。`[embed url="https://..."]` でサードパーティページを読み込みたいことが意図的にある場合は、`gateway.controlUi.allowExternalEmbedUrls: true` を設定してください。

## チャットメッセージ幅

グループ化されたチャットメッセージは、読みやすいデフォルトの最大幅を使用します。ワイドモニターのデプロイでは、バンドル済み CSS にパッチを当てずに `gateway.controlUi.chatMessageMaxWidth` を設定して上書きできます。

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

値はブラウザーに到達する前に検証されます。サポートされる値には、`960px` や `82%` のような単純な長さやパーセンテージに加え、制約付きの `min(...)`、`max(...)`、`clamp(...)`、`calc(...)`、`fit-content(...)` 幅式が含まれます。

## Tailnet アクセス (推奨)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Gateway を loopback のままにし、Tailscale Serve に HTTPS でプロキシさせます。

    ```bash
    openclaw gateway --tailscale serve
    ```

    開く:

    - `https://<magicdns>/` (または設定済みの `gateway.controlUi.basePath`)

    デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket Serve リクエストは Tailscale ID ヘッダー (`tailscale-user-login`) で認証できます。OpenClaw は `x-forwarded-for` アドレスを `tailscale whois` で解決してヘッダーと照合することで ID を検証し、リクエストが Tailscale の `x-forwarded-*` ヘッダー付きで loopback に到達した場合にのみ受け入れます。ブラウザーデバイス ID を持つ Control UI オペレーターセッションでは、この検証済み Serve 経路はデバイスペアリングの往復もスキップします。デバイスなしブラウザーと node-role 接続は、引き続き通常のデバイスチェックに従います。Serve トラフィックでも明示的な共有シークレット資格情報を要求したい場合は、`gateway.auth.allowTailscale: false` を設定してください。その後、`gateway.auth.mode: "token"` または `"password"` を使用します。

    その非同期 Serve ID 経路では、同じクライアント IP と認証スコープの失敗した認証試行は、レート制限の書き込み前に直列化されます。そのため、同じブラウザーからの並行した不正リトライでは、2 つの単純な不一致が並列に競合する代わりに、2 回目のリクエストで `retry later` が表示されることがあります。

    <Warning>
    トークンなし Serve 認証は、ゲートウェイホストが信頼されていることを前提とします。そのホスト上で信頼できないローカルコードが実行される可能性がある場合は、トークン/パスワード認証を必須にしてください。
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    次に開く:

    - `http://<tailscale-ip>:18789/` (または設定済みの `gateway.controlUi.basePath`)

    一致する共有シークレットを UI 設定に貼り付けます (`connect.params.auth.token` または `connect.params.auth.password` として送信されます)。

  </Tab>
</Tabs>

## 安全でない HTTP

プレーン HTTP (`http://<lan-ip>` または `http://<tailscale-ip>`) でダッシュボードを開くと、ブラウザーは **非セキュアコンテキスト** で実行され、WebCrypto をブロックします。デフォルトでは、OpenClaw はデバイス ID のない Control UI 接続を **ブロック** します。

文書化された例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost 専用の安全でない HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` による成功したオペレーター Control UI 認証
- 緊急時用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS (Tailscale Serve) を使用するか、UI をローカルで開きます。

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (ゲートウェイホスト上)

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

    - 非セキュア HTTP コンテキストで、localhost Control UI セッションがデバイス ID なしで進行することを許可します。
    - ペアリングチェックはバイパスしません。
    - リモート (localhost 以外) のデバイス ID 要件を緩和しません。

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
    `dangerouslyDisableDeviceAuth` は Control UI のデバイス ID チェックを無効にし、重大なセキュリティ低下を招きます。緊急使用後は速やかに元に戻してください。
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - 成功した trusted-proxy 認証は、デバイス ID なしの **オペレーター** Control UI セッションを許可できます。
    - これは node-role Control UI セッションには拡張されません。
    - 同一ホストの loopback リバースプロキシでも trusted-proxy 認証は満たされません。[Trusted proxy auth](/ja-JP/gateway/trusted-proxy-auth) を参照してください。

  </Accordion>
</AccordionGroup>

HTTPS セットアップのガイダンスについては [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## コンテンツセキュリティポリシー

Control UI は厳格な `img-src` ポリシーとともに出荷されます。許可されるのは **same-origin** アセット、`data:` URL、ローカル生成の `blob:` URL のみです。リモート `http(s)` およびプロトコル相対の画像 URL はブラウザーによって拒否され、ネットワークフェッチは発行されません。

実際には次のことを意味します。

- 相対パス (例: `/avatars/<id>`) 配下で提供されるアバターと画像は、UI が取得してローカル `blob:` URL に変換する認証済みアバタールートを含め、引き続き表示されます。
- インライン `data:image/...` URL は引き続き表示されます (プロトコル内ペイロードに便利です)。
- Control UI によって作成されたローカル `blob:` URL は引き続き表示されます。
- チャンネルメタデータによって出力されたリモートアバター URL は、Control UI のアバターヘルパーで取り除かれ、組み込みのロゴ/バッジに置き換えられます。そのため、侵害された、または悪意のあるチャンネルが、オペレーターブラウザーから任意のリモート画像フェッチを強制することはできません。

この動作を得るために変更は不要です。これは常に有効で、設定できません。

## アバタールート認証

Gateway 認証が設定されている場合、Control UI アバターエンドポイントは API の他の部分と同じゲートウェイトークンを要求します。

- `GET /avatar/<agentId>` は、認証済み呼び出し元にのみアバター画像を返します。`GET /avatar/<agentId>?meta=1` は、同じルールでアバターメタデータを返します。
- どちらのルートへの未認証リクエストも拒否されます (隣接する assistant-media ルートと一致します)。これにより、他の部分が保護されているホストで、アバタールートがエージェント ID を漏らすことを防ぎます。
- Control UI 自体はアバター取得時にゲートウェイトークンを bearer ヘッダーとして転送し、認証済み blob URL を使用するため、画像はダッシュボードで引き続き表示されます。

Gateway 認証を無効にした場合 (共有ホストでは非推奨)、ゲートウェイの他の部分と同様に、アバタールートも未認証になります。

## アシスタントメディアルート認証

Gateway 認証が設定されている場合、アシスタントのローカルメディアプレビューは 2 段階のルートを使用します。

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` は通常の Control UI オペレーター認証を要求します。ブラウザーは可用性確認時にゲートウェイトークンを bearer ヘッダーとして送信します。
- 成功したメタデータ応答には、その正確なソースパスにスコープされた短命の `mediaTicket` が含まれます。
- ブラウザーでレンダリングされる画像、音声、動画、ドキュメント URL は、アクティブなゲートウェイトークンやパスワードの代わりに `mediaTicket=<ticket>` を使用します。チケットはすぐに期限切れになり、別のソースを認可することはできません。

これにより、再利用可能なゲートウェイ資格情報を表示可能なメディア URL に入れずに、通常のメディアレンダリングをブラウザー標準のメディア要素と互換に保てます。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを提供します。次でビルドします。

```bash
pnpm ui:build
```

任意の絶対ベース (固定アセット URL が必要な場合):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

ローカル開発用 (別の dev server):

```bash
pnpm ui:dev
```

その後、UI を Gateway WS URL (例: `ws://127.0.0.1:18789`) に向けます。

## 空白の Control UI ページ

ブラウザーが空白のダッシュボードを読み込み、DevTools に有用なエラーが表示されない場合、拡張機能または早期コンテンツスクリプトが JavaScript モジュールアプリの評価を妨げた可能性があります。静的ページには、起動後に `<openclaw-app>` が登録されていない場合に表示されるプレーン HTML の復旧パネルが含まれています。

ブラウザー環境を変更した後にパネルの **Try again** アクションを使用するか、次の確認後に手動でリロードしてください。

- すべてのページに注入する拡張機能、特に `<all_urls>` コンテンツスクリプトを持つ拡張機能を無効にします。
- プライベートウィンドウ、クリーンなブラウザープロファイル、または別のブラウザーを試します。
- Gateway を実行したままにし、ブラウザー変更後に同じダッシュボード URL を確認します。

## デバッグ/テスト: dev server + リモート Gateway

Control UI は静的ファイルです。WebSocket ターゲットは設定可能で、HTTP オリジンと異なっていてもかまいません。これは、Vite dev server はローカルで使い、Gateway は別の場所で実行したい場合に便利です。

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

    任意の 1 回限りの認証 (必要な場合):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="メモ">
    - `gatewayUrl` はロード後に localStorage に保存され、URL から削除されます。
    - `gatewayUrl` 経由で完全な `ws://` または `wss://` エンドポイントを渡す場合は、ブラウザーがクエリ文字列を正しく解析できるように `gatewayUrl` の値を URL エンコードしてください。
    - `token` は可能な限り URL フラグメント（`#token=...`）経由で渡してください。フラグメントはサーバーに送信されないため、リクエストログや Referer への漏えいを避けられます。互換性のために従来の `?token=` クエリパラメーターも一度だけ取り込まれますが、フォールバックとしてのみ扱われ、ブートストラップ直後に削除されます。
    - `password` はメモリ内にのみ保持されます。
    - `gatewayUrl` が設定されている場合、UI は設定や環境の認証情報へフォールバックしません。`token`（または `password`）を明示的に指定してください。明示的な認証情報がない場合はエラーです。
    - Gateway が TLS の背後にある場合（Tailscale Serve、HTTPS プロキシなど）は `wss://` を使用してください。
    - `gatewayUrl` はクリックジャッキングを防ぐため、トップレベルウィンドウ（埋め込みではない）でのみ受け付けられます。
    - 公開された非ループバックの Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を明示的に設定する必要があります（完全なオリジン）。ループバック、RFC1918/link-local、`.local`、`.ts.net`、または Tailscale CGNAT ホストからのプライベートな同一オリジン LAN/Tailnet ロードは、Host ヘッダーフォールバックを有効にしなくても受け付けられます。
    - Gateway の起動時に、有効なランタイムの bind とポートから `http://localhost:<port>` や `http://127.0.0.1:<port>` のようなローカルオリジンがシードされる場合がありますが、リモートブラウザーのオリジンには引き続き明示的なエントリが必要です。
    - 厳密に管理されたローカルテストを除き、`gateway.controlUi.allowedOrigins: ["*"]` は使用しないでください。これは任意のブラウザーオリジンを許可するという意味であり、「使用しているホストに何でも一致させる」という意味ではありません。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は Host ヘッダーのオリジンフォールバックモードを有効にしますが、危険なセキュリティモードです。

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
- [ヘルスチェック](/ja-JP/gateway/health) — Gateway のヘルス監視
- [TUI](/ja-JP/web/tui) — ターミナルユーザーインターフェイス
- [WebChat](/ja-JP/web/webchat) — ブラウザーベースのチャットインターフェイス
