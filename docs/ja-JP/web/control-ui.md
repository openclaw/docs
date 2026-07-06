---
read_when:
    - ブラウザーから Gateway を操作したい
    - SSH トンネルなしで Tailnet アクセスを利用したい
sidebarTitle: Control UI
summary: Gateway 用のブラウザベースの制御 UI（チャット、アクティビティ、ノード、設定）
title: Control UI
x-i18n:
    generated_at: "2026-07-06T10:54:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c17497942b55a1b886948f7c3f0685b4fac29da0b755530f18230e59eb2b412
    source_path: web/control-ui.md
    workflow: 16
---

Control UI は、Gateway によって配信される小さな **Vite + Lit** シングルページアプリです。

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します（例: `/openclaw`）

同じポート上の **Gateway WebSocket に直接** 通信します。

## クイックオープン（ローカル）

Gateway が同じコンピューターで実行されている場合は、[http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）を開きます。

ページの読み込みに失敗する場合は、先に Gateway を起動します: `openclaw gateway`。

<Note>
ネイティブ Windows の LAN バインドでは、Gateway ホスト上で `127.0.0.1` が動作していても、Windows Firewall または組織管理の Group Policy によって、通知された LAN URL がブロックされることがあります。Windows ホストで `openclaw gateway status --deep` を実行してください。ブロックされている可能性のあるポート、プロファイルの不一致、ポリシーが無視する可能性のあるローカルファイアウォールルールを報告します。
</Note>

認証は WebSocket ハンドシェイク中に次の方法で提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合の Tailscale Serve ID ヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合の信頼済みプロキシ ID ヘッダー

ダッシュボード設定パネルは、現在のブラウザータブセッションと選択された Gateway URL のトークンを保持します。パスワードは永続化されません。オンボーディングは通常、初回接続時に共有シークレット認証用の Gateway トークンを生成しますが、`gateway.auth.mode` が `"password"` の場合はパスワード認証も機能します。

## デバイスペアリング（初回接続）

新しいブラウザーまたはデバイスから接続する場合、通常は **1 回限りのペアリング承認** が必要で、`disconnected (1008): pairing required` と表示されます。

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

ブラウザーが変更された認証詳細（ロール/スコープ/公開鍵）でペアリングを再試行すると、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認する前に `openclaw devices list` を再実行してください。

すでにペアリング済みのブラウザーを読み取りアクセスから書き込み/管理者アクセスへ切り替えることは、サイレント再接続ではなく承認アップグレードとして扱われます。OpenClaw は古い承認を有効なまま保持し、より広い再接続をブロックし、新しいスコープセットを明示的に承認するよう求めます。

承認されると、そのデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り、再承認は不要です。トークンローテーション、取り消し、Paperclip / `openclaw_gateway` の初回実行承認フローについては、[Devices CLI](/ja-JP/cli/devices) を参照してください。

<Note>
- 直接の local loopback ブラウザー接続（`127.0.0.1` / `localhost`）は自動承認されます。
- `gateway.auth.allowTailscale: true` で、Tailscale ID が検証され、ブラウザーがデバイス ID を提示する場合、Tailscale Serve は Control UI オペレーターセッションのペアリング往復を省略できます。デバイスなしのブラウザーとノードロール接続は、引き続き通常のデバイスチェックに従います。
- 直接の Tailnet バインド、LAN ブラウザー接続、デバイス ID のないブラウザープロファイルでは、引き続き明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイス ID を生成するため、ブラウザーの切り替えやブラウザーデータの消去には再ペアリングが必要です。

</Note>

## モバイルデバイスをペアリングする

すでにペアリング済みの管理者は、ターミナルを開かずに iOS/Android 接続 QR を作成できます。

<Steps>
  <Step title="モバイルペアリングを開く">
    **Nodes** を選択し、**Devices** カード内の **Pair mobile device** をクリックします。
  </Step>
  <Step title="電話を接続">
    OpenClaw モバイルアプリで、**Settings** → **Gateway** を開き、QR コードをスキャンします。代わりにセットアップコードをコピーして貼り付けることもできます。
  </Step>
  <Step title="接続を確認">
    公式 iOS/Android アプリは自動的に接続します。**Devices** に保留中のリクエストが表示される場合は、承認する前にそのロールとスコープを確認してください。
  </Step>
</Steps>

セットアップコードの作成には `operator.admin` が必要です。これを持たないセッションではボタンが無効になります。セットアップコードには短命のブートストラップ資格情報が含まれるため、QR とコピーしたコードは有効な間、パスワードと同様に扱ってください。リモートペアリングでは、Gateway が `wss://` に解決される必要があります（たとえば Tailscale Serve/Funnel 経由）。プレーンな `ws://` は loopback とプライベート LAN アドレスに限定されます。完全なセキュリティとフォールバックの詳細については、[Pairing](/ja-JP/channels/pairing#pair-from-the-control-ui-recommended) を参照してください。

## 個人 ID（ブラウザーローカル）

Control UI は、共有セッションでの帰属表示のために、送信メッセージに付与されるブラウザーごとの個人 ID（表示名とアバター）をサポートします。これはブラウザーストレージに保存され、現在のブラウザープロファイルにスコープされます。他のデバイスには同期されず、送信したメッセージ上の通常のトランスクリプト作成者メタデータを超えてサーバー側に永続化されることもありません。サイトデータを消去したりブラウザーを切り替えたりすると空にリセットされます。

アシスタントアバターの上書きも同じブラウザーローカルパターンに従います。アップロードされた上書きは、Gateway で解決された ID にローカルで重ねられ、`config.patch` を通じて往復することはありません。共有 `ui.assistant.avatar` 設定フィールドは、そのフィールドを直接書き込む非 UI クライアント向けに引き続き利用できます。

## ランタイム設定エンドポイント

Control UI は、Gateway の Control UI ベースパスからの相対解決で、`/control-ui-config.json` からランタイム設定を取得します（たとえば、ベースパス `/__openclaw__/` の下では `/__openclaw__/control-ui-config.json`）。このエンドポイントは、HTTP サーフェスの他の部分と同じ Gateway 認証で保護されます。未認証のブラウザーは取得できず、取得に成功するには有効な Gateway トークン/パスワード、Tailscale Serve ID、または信頼済みプロキシ ID が必要です。

## Gateway ホストステータス

Simple ビューで **Settings** を開くと、Gateway マシン、LAN アドレス、オペレーティングシステム、ランタイム、稼働時間、CPU 負荷、メモリ、状態ボリュームのディスク容量を表示する **Gateway Host** カードを確認できます。このカードは、表示中は `system.info` Gateway RPC を通じて 10 秒ごとに更新されます。この RPC には `operator.read` スコープが必要です。古い Gateway や、そのスコープを持たない接続ではカードは省略されます。

## 言語サポート

Control UI は初回読み込み時にブラウザーロケールに基づいてローカライズされます。後で上書きするには、**Overview -> Gateway Access -> Language** を開きます（ピッカーは Appearance ではなく Gateway Access カード内にあります）。

- サポートされるロケール: `en`, `ar`, `de`, `es`, `fa`, `fr`, `hi`, `id`, `it`, `ja-JP`, `ko`, `nl`, `pl`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`
- 英語以外の翻訳はブラウザー内で遅延読み込みされます。
- 選択されたロケールはブラウザーストレージに保存され、以後の訪問で再利用されます。
- 欠落している翻訳キーは英語にフォールバックします。

Docs 翻訳は同じ英語以外のロケールセットに対して生成されますが、docs サイトに組み込まれている Mintlify 言語ピッカーには、Mintlify が受け入れるロケールコードのみが一覧表示されます。タイ語（`th`）とペルシア語（`fa`）の docs は publish repo で引き続き生成されますが、Mintlify がこれらのコードをサポートするまでは、そのピッカーに表示されない場合があります。

## 外観テーマ

Appearance パネルには、組み込みの Claw、Knot、Dash テーマ（Claw がデフォルト）に加え、ブラウザーローカルの tweakcn インポートスロットが 1 つあります。テーマをインポートするには、[tweakcn editor](https://tweakcn.com/editor/theme) を開き、テーマを選択または作成して **Share** をクリックし、コピーしたリンクを Appearance に貼り付けます。インポーターは `https://tweakcn.com/r/themes/<id>` レジストリ URL、`https://tweakcn.com/editor/theme?theme=amethyst-haze` のようなエディター URL、相対 `/themes/<id>` パス、生のテーマ ID、`amethyst-haze` などのデフォルトテーマ名も受け付けます。

インポートされたテーマは現在のブラウザープロファイルにのみ保存されます。Gateway 設定には書き込まれず、デバイス間で同期されません。インポート済みテーマを置き換えると、1 つのローカルスロットが更新されます。消去すると、インポート済みテーマがアクティブだった場合は Claw に戻ります。

Appearance にはブラウザーローカルの Text size 設定もあり、Control UI の他の設定とともに保存されます。これはチャットテキスト、コンポーザーテキスト、ツールカード、チャットサイドバーに適用され、モバイル Safari がフォーカス時に自動ズームしないよう、テキスト入力を少なくとも 16px に保ちます。

## サイドバーナビゲーション

サイドバーはセッションを先頭に保ち、**Pinned** と **Sessions** グループに分割します。ピン留めされたセッションはすべて表示されたままになり、ピン留めされていないセッションは独立した 9 件の最近項目枠を保持します。**Overview** はデフォルトでピン留めされる唯一の行き先です。他のすべての行き先にアクセスするには **More** を展開します。More の下にある **Customize sidebar** を選択するか、ナビゲーション領域を右クリックして、行き先のピン留めまたは解除、およびデフォルトの復元を行います。ピン留めセットと More の展開状態は現在のブラウザープロファイルに保存され、再読み込み後も維持されます。

コンパクトなフッターには、接続ステータス、**Settings**、**Docs**、モバイルペアリングがまとめられています。デスクトップでは、ターミナルコントロールの隣にあるトップバーボタンを使用してサイドバーを折りたたむまたは展開します。ドロワーブレークポイントでは、そのコントロールはハンバーガーボタンに置き換わります。

## できること（現在）

<AccordionGroup>
  <Accordion title="チャットと通話">
    - Gateway WS（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）経由でモデルとチャットします。
    - チャット履歴の更新は、メッセージごとのテキスト上限付きで境界のある最近ウィンドウを要求するため、大きなセッションでも、チャットが利用可能になる前にブラウザーが完全なトランスクリプトペイロードをレンダリングする必要はありません。
    - 公開 GitHub issue または pull request リンクにホバーするかキーボードフォーカスすると、その状態、タイトル、作成者、最近のアクティビティ、コメント、変更統計が表示されます。接続中の Gateway は、UI がリモート Gateway を使用している場合を含め、リンクターゲットを変更せずに公開メタデータを取得してキャッシュします。Gateway は、リポジトリが公開であることを確認した後、利用可能な場合は `GH_TOKEN` または `GITHUB_TOKEN` を使用します。それ以外の場合は、より長いキャッシュを伴う GitHub の匿名 API を使用します。
    - ブラウザーのリアルタイムセッションを通じて通話します。OpenAI は直接 WebRTC を使用し、Google Live は WebSocket 上の制約付き 1 回限りブラウザートークンを使用し、バックエンド専用のリアルタイム音声 Plugin は Gateway リレートランスポートを使用します。クライアント所有のプロバイダーセッションは `talk.client.create` で開始し、Gateway リレーセッションは `talk.session.create` で開始します。リレーはプロバイダー資格情報を Gateway 上に保持し、ブラウザーが `talk.session.appendAudio` を通じてマイク PCM をストリーミングする間、Gateway ポリシーと設定済みのより大きな OpenClaw モデルに対して `openclaw_agent_consult` プロバイダーツール呼び出しを `talk.client.toolCall` 経由で転送し、アクティブ実行中の音声ステアリングを `talk.client.steer` または `talk.session.steer` 経由でルーティングします。
    - Chat でツール呼び出しとライブツール出力カードをストリーミングします（エージェントイベント）。
    - 既存の `session.tool` / ツールイベント配信から、ライブツールアクティビティのブラウザーローカルでリダクション優先の要約を表示する Activity タブ。

  </Accordion>
  <Accordion title="チャンネル、インスタンス、セッション、ドリーム">
    - チャンネル: 組み込みおよびバンドル/外部 Plugin チャンネルのステータス、QR ログイン、チャンネルごとの設定 (`channels.status`, `web.login.*`, `config.patch`)。
    - チャンネルプローブの更新では、低速なプロバイダー確認が完了するまで前回のスナップショットを表示し続け、プローブまたは監査が UI 予算を超えた場合は部分スナップショットにラベルを付ける。
    - インスタンス: プレゼンス一覧と更新 (`system-presence`)。
    - セッション: 既定では設定済みエージェントのセッションを一覧表示し、頻繁に使うセッションのピン留め、名前変更、非アクティブなセッションのアーカイブまたは復元、古い未設定エージェントセッションキーからのフォールバック、セッションごとの model/thinking/fast/verbose/trace/reasoning オーバーライドの適用を行う (`sessions.list`, `sessions.patch`)。ピン留めされたセッションは、最近の未ピン留めセッションより上に並ぶ。アーカイブ済みセッションは Sessions ページのアーカイブビューにあり、トランスクリプトを保持する。
    - セッションのグループ化: Group by コントロールは、カスタムグループ、チャンネル、種別、エージェント、日付ごとのセクションにセッションテーブルを整理する。カスタムグループは `sessions.patch` (`category`) によりセッションごとに保持されるため、メッセージチャンネル (Discord, Telegram, WhatsApp, ...) から開始されたセッションも分類できる。行をセクションへドラッグするか、行ごとのグループセレクターを使ってグループを割り当て、New group アクションでグループを作成する。
    - ドリーム: dreaming ステータス、有効/無効トグル、ドリーム日記リーダー (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)。

  </Accordion>
  <Accordion title="Cron、Skills、Node、exec 承認">
    - Cron ジョブ: 一覧/追加/編集/実行/有効化/無効化、および実行履歴 (`cron.*`)。
    - Skills: ステータス、有効化/無効化、インストール、API キー更新 (`skills.*`)。
    - Node: 一覧と上限 (`node.list`)、モバイルセットアップコードの作成、デバイスペアリングの承認 (`device.pair.*`)。
    - Exec 承認: gateway または node の許可リストと `exec host=gateway/node` の ask ポリシーを編集する (`exec.approvals.*`)。

  </Accordion>
  <Accordion title="設定">
    - `~/.openclaw/openclaw.json` を表示/編集する (`config.get`, `config.set`)。
    - MCP には、設定済みサーバー、有効化、OAuth/フィルター/並列の概要、一般的なオペレーターコマンド、スコープ付き `mcp` 設定エディターのための専用設定ページがある。
    - 検証付きで適用して再起動し (`config.apply`)、最後にアクティブだったセッションを起こす。
    - 書き込みには、並行編集による上書きを防ぐ base-hash ガードが含まれる。
    - 書き込み (`config.set`/`config.apply`/`config.patch`) は、送信された設定ペイロード内の参照についてアクティブな SecretRef 解決を事前確認する。解決できないアクティブな送信済み参照は、書き込み前に拒否される。
    - フォーム保存では、保存済み設定から復元できない古い伏せ字プレースホルダーを破棄しつつ、保存済みシークレットにまだ対応する伏せ字の値は保持する。
    - スキーマとフォーム描画は `config.schema` / `config.schema.lookup` から取得され、フィールドの `title`/`description`、一致した UI ヒント、直下の子要素の概要、ネストされた object/wildcard/array/composition ノード上の docs メタデータ、利用可能な場合は Plugin とチャンネルのスキーマを含む。Raw JSON エディターは、スナップショットが安全に raw ラウンドトリップできる場合にのみ利用できる。それ以外の場合、Control UI は Form モードを強制する。
    - Raw JSON エディターの「保存済みにリセット」は、フラット化されたスナップショットを再描画する代わりに、raw で作成された形状 (書式、コメント、`$include` レイアウト) を保持するため、スナップショットが安全にラウンドトリップできる場合、外部編集はリセット後も残る。
    - 構造化された SecretRef オブジェクト値は、フォームのテキスト入力では読み取り専用で描画され、意図しない object から string への破損を防ぐ。

  </Accordion>
  <Accordion title="使用状況">
    - セッション由来のトークンと推定コスト分析は、プロバイダー請求とは分離されたままになる。
    - プロバイダーカードは `usage.status` を呼び出し、設定済みプロバイダー Plugin が報告するライブのプラン名、クォータ期間、残高、支出、予算を表示する。
    - プロバイダー使用状況の失敗は、セッション/コストダッシュボードをブロックしない。利用できないプロバイダーカードは、それぞれ独自のエラー状態を表示する。

  </Accordion>
  <Accordion title="デバッグ、ログ、更新">
    - デバッグ: ステータス/ヘルス/モデルのスナップショット、イベントログ、手動 RPC 呼び出し (`status`, `health`, `models.list`)。
    - イベントログには、Control UI の更新/RPC タイミング、低速なチャット/設定描画タイミング、ブラウザーがそれらの PerformanceObserver エントリー種別を公開している場合の長いアニメーションフレームまたは長いタスクに関するブラウザー応答性エントリーが含まれる。
    - ログ: フィルター/エクスポート付きの Gateway ファイルログのライブ tail (`logs.tail`)。
    - 更新: 再起動レポート付きで package/git 更新と再起動を実行し (`update.run`)、再接続後に `update.status` をポーリングして実行中の Gateway バージョンを確認する。

  </Accordion>
  <Accordion title="Cron ジョブパネルの注記">
    - 分離ジョブでは、配信の既定値は概要の通知。内部専用の実行では none に切り替える。
    - announce が選択されている場合、チャンネル/ターゲットフィールドが表示される。
    - Webhook モードは `delivery.mode = "webhook"` を使用し、`delivery.to` には有効な HTTP(S) webhook URL を設定する。
    - メインセッションジョブでは、webhook と none の配信モードを利用できる。
    - 高度な編集コントロールには、実行後削除、エージェントオーバーライドのクリア、cron の exact/stagger オプション、エージェントの model/thinking オーバーライド、best-effort 配信トグルが含まれる。
    - フォーム検証はフィールド単位のエラーとしてインライン表示される。無効な値がある場合、修正されるまで保存ボタンは無効になる。
    - 専用 bearer token を送信するには `cron.webhookToken` を設定する。省略した場合、webhook は auth ヘッダーなしで送信される。
    - `cron.webhook` は非推奨のレガシーフォールバック。まだ `notify: true` を使っている保存済みジョブを、ジョブごとの明示的な webhook または完了配信へ移行するには、`openclaw doctor --fix` を実行する。

  </Accordion>
</AccordionGroup>

## MCP ページ

専用の MCP ページは、`mcp.servers` 配下の OpenClaw 管理 MCP サーバー向けオペレータービューです。それ自体では MCP トランスポートを開始しません。保存済み設定の確認と編集に使い、ライブサーバーの証明が必要な場合は `openclaw mcp doctor --probe` を使用してください。

一般的なワークフロー:

1. サイドバーから **MCP** を開く。
2. 概要カードで total、enabled、OAuth、filtered のサーバー数を確認する。
3. 各サーバー行で、トランスポート、有効化、認証、フィルター、タイムアウト、コマンドヒントを確認する。
4. サーバーを設定済みのままにしつつ runtime discovery から外しておく必要がある場合は、有効化を切り替える。
5. サーバー定義、ヘッダー、TLS/mTLS パス、OAuth メタデータ、ツールフィルター、Codex projection メタデータのために、スコープ付き `mcp` 設定セクションを編集する。
6. 設定を書き込むには **保存** を使用し、実行中の Gateway に変更後の設定を適用させる場合は **保存して公開** を使用する。
7. 静的診断、ライブ証明、またはキャッシュ済み runtime の破棄には、ターミナルから `openclaw mcp status --verbose`、`openclaw mcp doctor --probe`、または `openclaw mcp reload` を実行する。

このページは、資格情報を含む URL 風の値を描画前に伏せ字にし、コマンドスニペット内のサーバー名を引用符で囲むため、コピーしたコマンドはスペースや shell メタ文字を含む場合でも動作します。CLI と設定の完全なリファレンス: [MCP](/ja-JP/cli/mcp)。

## Activity タブ

Activity タブは、Chat ツールカードを支えるものと同じ Gateway の `session.tool` / tool イベントストリームから派生した、ライブツールアクティビティ用の一時的なブラウザーローカルオブザーバーです。別の Gateway イベントファミリー、エンドポイント、永続的なアクティビティストア、メトリクスフィード、外部オブザーバーストリームは追加しません。

Activity エントリーは、サニタイズ済みの概要と、伏せ字化され切り詰められた出力プレビューのみを保持します。ツール引数の値は Activity 状態に保存されません。UI は引数が非表示であることを示し、引数フィールド数のみを記録します。インメモリ一覧は現在のブラウザータブに従い、Control UI 内のナビゲーションでは保持されますが、ページ再読み込み、セッション切り替え、または **Clear** でリセットされます。

## オペレーターターミナル

ドッキング可能なオペレーターターミナルは既定で無効です。有効にするには、`gateway.terminal.enabled: true` を設定して Gateway を再起動します。ターミナルには `operator.admin` 接続が必要で、アクティブなエージェントワークスペースでホスト PTY を開きます。新しいタブは現在選択されているチャットエージェントに従います。

<Warning>
ターミナルは制限のないホスト shell であり、Gateway プロセス環境を継承します。信頼できるオペレーター配置でのみ有効にしてください。OpenClaw は `sandbox.mode: "all"` のエージェントに対するターミナルセッションを拒否します。アクティブなエージェントをそのモードに変更すると、既存および進行中のターミナルセッションが閉じられます。
</Warning>

ドックを切り替えるには **Ctrl + backtick** を使用します。レイアウトは下部と右側へのドッキングに対応し、ブラウザービューポートに合わせてサイズ変更され、複数の shell タブを保持します。`gateway.terminal.enabled` と任意の `gateway.terminal.shell` オーバーライドについては、[Gateway 設定](/ja-JP/gateway/configuration-reference#gateway) を参照してください。

セッションは切断後も維持されます。ページ再読み込み、ノート PC のスリープ、ネットワークの瞬断では、セッションは強制終了されず Gateway 上でデタッチされ、同じブラウザータブが再接続時に再アタッチし、最近の出力が再生されます。デタッチされたセッションは `gateway.terminal.detachedSessionTimeoutSeconds` の後に強制終了されます (既定は 300 秒。`0` は切断時強制終了を復元します)。`terminal.list` はアタッチ可能なセッションを表示し、`terminal.attach` はその 1 つを引き継ぎ (tmux 形式の take-over)、`terminal.text` はアタッチせずにセッションの最近の出力をプレーンテキストとして読み取ります。これはエージェント/ツール向けの利便機能です。

ターミナルは、`/?view=terminal` にある全画面のターミナル専用ドキュメントとしても利用できます。iOS および Android アプリは、このページを Terminal 画面に埋め込み、保存済みの gateway 資格情報を再利用します。利用可否は同じ `gateway.terminal.enabled` と `operator.admin` のゲートに従い、接続先 Gateway がターミナルを提供していない場合、ページには通知が表示されます。

## チャット動作

<AccordionGroup>
  <Accordion title="送信と履歴のセマンティクス">
    - `chat.send` は **非ブロッキング**です。`{ runId, status: "started" }` ですぐに ACK し、応答は `chat` イベント経由でストリーミングされます。信頼された Control UI クライアントは、ローカル診断用に任意の ACK タイミングメタデータも受け取る場合があります。
    - チャットのアップロードは、画像と動画以外のファイルを受け付けます。画像はネイティブの画像パスを保持します。他のファイルは管理対象メディアとして保存され、履歴では添付リンクとして表示されます。
    - 同じ `idempotencyKey` で再送信すると、実行中は `{ status: "in_flight" }` が返り、完了後は `{ status: "ok" }` が返ります。
    - `chat.history` の応答は UI の安全性のためサイズ制限されます。トランスクリプトエントリが大きすぎる場合、Gateway は長いテキストフィールドを切り詰め、重いメタデータブロックを省略し、サイズ超過のメッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えることがあります。
    - 表示されるアシスタントメッセージが `chat.history` で切り詰められた場合、サイドリーダーは必要に応じて `sessionKey`、アクティブな `agentId`、トランスクリプトの `messageId` を使い、`chat.message.get` 経由で表示用に正規化された完全なトランスクリプトエントリをオンデマンドで取得できます。Gateway がそれ以上を返せない場合、リーダーは切り詰められたプレビューを黙って繰り返すのではなく、明示的な利用不可状態を表示します。
    - アシスタントまたは生成された画像は管理対象メディア参照として永続化され、認証済み Gateway メディア URL 経由で返されます。そのため、リロードは生の base64 画像ペイロードがチャット履歴応答に残っていることに依存しません。
    - `chat.history` をレンダリングするとき、Control UI は表示されるアシスタントテキストから、表示専用のインラインディレクティブタグ（例: `[[reply_to_*]]` と `[[audio_as_voice]]`）、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、漏えいした ASCII/全角のモデル制御トークンを取り除きます。可視テキスト全体が正確なサイレントトークン `NO_REPLY` / `no_reply` または Heartbeat 確認トークン `HEARTBEAT_OK` だけであるアシスタントエントリは省略します。
    - アクティブな送信中および最終的な履歴更新中に、`chat.history` が一時的に古いスナップショットを返した場合でも、チャットビューはローカルの楽観的なユーザー/アシスタントメッセージを表示したままにします。Gateway 履歴が追いつくと、正規のトランスクリプトがそれらのローカルメッセージを置き換えます。
    - ライブの `chat` イベントは配信状態であり、`chat.history` は永続的なセッショントランスクリプトから再構築されます。ツール最終イベントの後、Control UI は履歴を再読み込みし、小さな楽観的テールだけをマージします。トランスクリプト境界は [WebChat](/ja-JP/web/webchat) に記載されています。
    - `chat.inject` はアシスタントメモをセッショントランスクリプトに追加し、UI のみの更新用に `chat` イベントをブロードキャストします（エージェント実行なし、チャネル配信なし）。
    - サイドバーには最近のセッションが表示され、New Session アクション、All Sessions リンク、完全なセッションピッカーを開くセッション検索ボタン（選択したエージェントでスコープされ、検索とページネーション付き）があります。新しいダッシュボードセッションは、最初の非コマンドメッセージから非同期で簡潔な生成タイトルを取得します。明示的な名前は置き換えられません。この別のモデル呼び出しを低コストモデルにルーティングするには、`agents.defaults.utilityModel`（または `agents.list[].utilityModel`）を設定します。エージェントを切り替えると、そのエージェントに紐づくセッションだけが表示され、保存済みのダッシュボードセッションがまだない場合は、そのエージェントのメインセッションにフォールバックします。
    - 各セッションピッカー行では、セッションの名前変更、ピン留め、アーカイブができます。アクティブな実行とエージェントのメインセッションはアーカイブできません。現在選択中のセッションをアーカイブすると、Chat はそのエージェントのメインセッションに戻ります。
    - デスクトップ幅では、チャットコントロールはコンパクトな 1 行にとどまり、トランスクリプトを下にスクロールしている間は折りたたまれます。上にスクロールする、最上部に戻る、または最下部に到達すると、コントロールが復元されます。
    - 連続する重複したテキストのみのメッセージは、件数バッジ付きの 1 つの吹き出しとしてレンダリングされます。画像、添付、ツール出力、またはキャンバスプレビューを含むメッセージは折りたたまれません。
    - チャットヘッダーのモデルおよび思考ピッカーは、`sessions.patch` 経由でアクティブセッションを即座にパッチします。これらは永続的なセッションオーバーライドであり、1 ターン限定の送信オプションではありません。
    - 同じセッションのモデルピッカー変更がまだ保存中の間にメッセージを送信すると、コンポーザーは `chat.send` を呼び出す前にそのセッションパッチを待つため、送信では選択したモデルが使用されます。
    - `/new` と入力すると、New Chat と同じ新しいダッシュボードセッションが作成され、そのセッションに切り替わります。ただし、`session.dmScope: "main"` が設定され、現在の親がエージェントのメインセッションである場合は、そのメインセッションをその場でリセットします。`/reset` と入力すると、現在のセッションに対する Gateway の明示的なインプレースリセットが維持されます。
    - チャットモデルピッカーは、Gateway の設定済みモデルビューを要求します。`agents.defaults.models` が存在する場合、その許可リストがピッカーを駆動し、プロバイダースコープのカタログを動的に保つ `provider/*` エントリも含まれます。それ以外の場合、ピッカーは明示的な `models.providers.*.models` エントリと、利用可能な認証を持つプロバイダーを表示します。完全なカタログは、デバッグ用の `models.list` RPC で `view: "all"` を指定すると引き続き利用できます。
    - 新しい Gateway セッション使用状況レポートに現在のコンテキストトークンが含まれている場合、チャットコンポーザーツールバーは使用率を示す小さなコンテキスト使用量リングを表示します。リングを開くと、現在のコンテキストウィンドウ、最新実行のトークン数と推定総コスト、プロバイダー/モデル ID、報告されている場合は最新のプロバイダー応答の入力/出力/キャッシュのコスト内訳が表示されます。リングはコンテキスト圧が高いと警告スタイルに切り替わり、推奨 Compaction レベルでは通常のセッション Compaction パスを実行するコンパクトなボタンを表示します。古いトークンスナップショットは、Gateway が新しい使用状況を再び報告するまで非表示になります。

  </Accordion>
  <Accordion title="Talk モード（ブラウザーリアルタイム）">
    Talk モードは、登録済みのリアルタイム音声プロバイダーを使用します。OpenAI は、`talk.realtime.provider: "openai"` に加えて、`openai` API キー/OAuth プロファイル、外部 Codex ログイン、`talk.realtime.providers.openai.apiKey`、または `OPENAI_API_KEY` で設定します。設定済みの API キーソースが優先され、Codex OAuth は自動フォールバックです。Google は、`talk.realtime.provider: "google"` に加えて `talk.realtime.providers.google.apiKey` で設定します。ブラウザーが標準プロバイダーの API キーまたは OAuth トークンを受け取ることはありません。OpenAI は WebRTC 用の一時 Realtime クライアントシークレットを受け取り、Google Live はブラウザー WebSocket セッション用の 1 回限りの制約付き Live API 認証トークンを受け取ります。このトークンには、Gateway によって指示とツール宣言が固定されます。バックエンドのリアルタイムブリッジのみを公開するプロバイダーは Gateway リレートランスポートを経由するため、資格情報とベンダーソケットはサーバー側に残り、ブラウザー音声は認証済み Gateway RPC 経由で移動します。Realtime セッションプロンプトは Gateway によって組み立てられます。`talk.client.create` は呼び出し元提供の指示オーバーライドを受け付けません。

    Chat コンポーザーには、Talk 開始/停止ボタンの横に Talk オプションのキャレットがあります。そのコンパクトなパネルには、次の Talk セッション用の Voice、Model、Sensitivity だけが保持されます。**Settings でさらに表示** は **Settings → Communications → Talk** を開きます。そこには、永続的なプロバイダー、トランスポート、推論 effort、正確な VAD しきい値、無音時間、プレフィックスパディングのデフォルトがあります。これらのデフォルトを変更するには `operator.admin` アクセスが必要です。空白のコンポーザー値は、設定済みのデフォルトまたはプロバイダーデフォルトにフォールバックします。Gateway リレーを設定するとバックエンドリレーパスが強制されます。WebRTC を設定するとセッションはクライアント所有のままになり、プロバイダーがブラウザーセッションを作成できない場合は、リレーへ黙ってフォールバックするのではなく失敗します。

    Talk コントロール自体はコンポーザーツールバー内のマイクボタンで、その横の小さなキャレットから Talk オプションを開きます。Talk が開始すると、コンポーザーのステータス行には、音声が接続されるまでは `Connecting Talk...`、接続中は `Talk live`、またはリアルタイムツール呼び出しが `talk.client.toolCall` 経由で設定済みのより大きなモデルに問い合わせている間は `Asking OpenClaw...` が表示されます。

    メンテナー向けライブスモーク: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` は、OpenAI バックエンド WebSocket ブリッジ、OpenAI ブラウザー WebRTC SDP 交換、Google Live 制約付きトークンのブラウザー WebSocket セットアップ、偽のマイクメディアを使った Gateway リレーブラウザーアダプターを検証します。このコマンドはプロバイダーステータスのみを出力し、シークレットはログに記録しません。

  </Accordion>
  <Accordion title="停止と中断">
    - **Stop** をクリックします（`chat.abort` を呼び出します）。
    - 実行がアクティブな間、通常のフォローアップはキューに入ります。キュー済みメッセージの **Steer** をクリックすると、そのフォローアップが実行中のターンに注入されます。
    - `/stop`（または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` のような単独の中断フレーズ）を入力すると、帯域外で中断します。
    - `chat.abort` は、そのセッションのすべてのアクティブな実行を中断するために `{ sessionKey }`（`runId` なし）をサポートします。

  </Accordion>
  <Accordion title="中断時の部分保持">
    - 実行が中断された場合でも、部分的なアシスタントテキストは UI に表示されることがあります。
    - Gateway は、バッファリング済み出力が存在する場合、中断された部分的なアシスタントテキストをトランスクリプト履歴に永続化します。
    - 永続化されたエントリには中断メタデータが含まれるため、トランスクリプトの利用側は中断部分と通常の完了出力を区別できます。

  </Accordion>
</AccordionGroup>

## 接続喪失と再接続

セッションが確立されると、Gateway 接続が切断されてもログアウトされません。クライアントがバックオフ（800 ms から最大 15 s）付きで自動的に再試行する間、ダッシュボードは琥珀色の「Gateway 接続が失われました — 再接続中…」バナーとともに表示されたままになります。接続が戻るまでライブ更新とアクションは一時停止します。バナー内の **今すぐ再試行** は即時試行を強制します。

ログインゲートは、確立済みセッションがまだない場合（初回オープン、接続前のページリロード）、または Gateway が資格情報を能動的に拒否した場合（不正なトークン/パスワード、取り消されたペアリング）にのみ表示されます。これらは、待つのではなく入力が必要な状態です。

## PWA インストールと Web Push

Control UI には `manifest.webmanifest` と service worker が同梱されているため、モダンブラウザーではスタンドアロン PWA としてインストールできます。Web Push により、タブまたはブラウザーウィンドウが開いていない場合でも、Gateway は通知でインストール済み PWA を起動できます。

OpenClaw 更新直後にページに **プロトコル不一致** が表示される場合は、まず `openclaw dashboard` でダッシュボードを開き直し、ハードリフレッシュしてください。それでも失敗する場合は、ダッシュボードオリジンのサイトデータをクリアするか、プライベートブラウザーウィンドウでテストしてください。古いタブまたはブラウザーの service worker キャッシュが、更新前の Control UI バンドルを新しい Gateway に対して実行し続けることがあります。

| サーフェス                                            | 動作                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA マニフェスト。到達可能になると、ブラウザーは「アプリをインストール」を提示します。 |
| `ui/public/sw.js`                                     | `push` イベントと通知クリックを処理する service worker。 |
| `push/vapid-keys.json`（OpenClaw 状態ディレクトリ配下） | Web Push ペイロードの署名に使われる自動生成の VAPID キーペア。 |
| `push/web-push-subscriptions.json`                    | 永続化されたブラウザー購読エンドポイント。                         |

キーを固定したい場合（マルチホストデプロイ、シークレットローテーション、またはテスト）は、Gateway プロセス上の環境変数で VAPID キーペアをオーバーライドします。

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（デフォルトは `https://openclaw.ai`）

Control UI は、ブラウザー購読の登録とテストに、これらのスコープ制限付き Gateway メソッドを使用します。

- `push.web.vapidPublicKey` はアクティブな VAPID 公開鍵を取得します。
- `push.web.subscribe` は `endpoint` と `keys.p256dh`/`keys.auth` を登録します。
- `push.web.unsubscribe` は登録済みのエンドポイントを削除します。
- `push.web.test` は呼び出し元のサブスクリプションへテスト通知を送信します。

<Note>
Web Push は iOS APNS リレー経路（リレーに支えられたプッシュについては [設定](/ja-JP/gateway/configuration) を参照）および、ネイティブモバイルのペアリングを対象にする `push.test` メソッドとは独立しています。
</Note>

## ホスト型埋め込み

アシスタントメッセージは `[embed ...]` ショートコードでホストされた Web コンテンツをインライン表示できます。iframe のサンドボックスポリシーは `gateway.controlUi.embedSandbox` で制御します。

<Tabs>
  <Tab title="strict">
    ホスト型埋め込み内でのスクリプト実行を無効にします。
  </Tab>
  <Tab title="scripts (default)">
    オリジン分離を維持しながらインタラクティブな埋め込みを許可します。通常、自己完結型のブラウザーゲームやウィジェットには十分です。
  </Tab>
  <Tab title="trusted">
    意図的により強い権限を必要とする同一サイトのドキュメント向けに、`allow-scripts` に加えて `allow-same-origin` を追加します。
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
埋め込みドキュメントが本当に同一オリジン動作を必要とする場合にのみ `trusted` を使用してください。ほとんどのエージェント生成ゲームやインタラクティブなキャンバスでは、`scripts` の方が安全な選択です。
</Warning>

絶対外部 `http(s)` 埋め込み URL はデフォルトではブロックされたままです。`[embed url="https://..."]` がサードパーティページを読み込めるようにするには、`gateway.controlUi.allowExternalEmbedUrls: true` を設定します。

## チャットメッセージ幅

グループ化されたチャットメッセージには、読みやすいデフォルトの最大幅が使われます。ワイドモニター環境では、`gateway.controlUi.chatMessageMaxWidth` を設定することで、バンドル済み CSS にパッチを当てずに上書きできます。

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

この値はブラウザーに届く前に検証されます。サポートされる形式には、`960px` や `82%` のような単純な長さとパーセンテージに加え、制約付きの `min(...)`、`max(...)`、`clamp(...)`、`calc(...)`、`fit-content(...)` 幅式が含まれます。

## tailnet アクセス（推奨）

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Gateway をループバック上に置き、Tailscale Serve に HTTPS でプロキシさせます。

    ```bash
    openclaw gateway --tailscale serve
    ```

    `https://<magicdns>/`（または設定済みの `gateway.controlUi.basePath`）を開きます。

    デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket Serve リクエストは Tailscale ID ヘッダー（`tailscale-user-login`）で認証できます。OpenClaw は `x-forwarded-for` アドレスを `tailscale whois` で解決してヘッダーと照合することで ID を検証し、リクエストが Tailscale の `x-forwarded-*` ヘッダー付きでループバックに到達した場合にのみ受け入れます。ブラウザーデバイス ID を持つ Control UI オペレーターセッションでは、この検証済み Serve 経路によりデバイスペアリングの往復もスキップされます。デバイスなしブラウザーとノードロール接続は、引き続き通常のデバイスチェックに従います。Serve トラフィックであっても明示的な共有シークレット認証情報を要求したい場合は、`gateway.auth.allowTailscale: false` を設定してから、`gateway.auth.mode: "token"` または `"password"` を使用します。

    その非同期 Serve ID 経路では、同じクライアント IP と認証スコープに対する認証失敗の試行は、レート制限書き込みの前に直列化されます。そのため、同じブラウザーからの並行した不正な再試行では、2 つの単純な不一致が並列で競合する代わりに、2 件目のリクエストで `retry later` が表示される場合があります。

    <Warning>
    トークンなし Serve 認証は、Gateway ホストが信頼済みであることを前提とします。そのホストで信頼できないローカルコードが実行される可能性がある場合は、トークン/パスワード認証を要求してください。
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    `http://<tailscale-ip>:18789/`（または設定済みの `gateway.controlUi.basePath`）を開きます。

    一致する共有シークレットを UI 設定に貼り付けます（`connect.params.auth.token` または `connect.params.auth.password` として送信されます）。

  </Tab>
</Tabs>

## 安全でない HTTP

プレーン HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、ブラウザーは**非セキュアコンテキスト**で動作し、WebCrypto をブロックします。デフォルトでは、OpenClaw はデバイス ID のない Control UI 接続を**ブロック**します。

文書化された例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost 限定の安全でない HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` によるオペレーター Control UI 認証の成功
- 緊急用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS（Tailscale Serve）を使用するか、`https://<magicdns>/`（Serve）または `http://127.0.0.1:18789/`（Gateway ホスト上）で UI をローカルに開きます。

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

    - 非セキュア HTTP コンテキストで、localhost の Control UI セッションがデバイス ID なしで進行できるようにします。
    - ペアリングチェックはバイパスしません。
    - リモート（localhost 以外）のデバイス ID 要件は緩和しません。

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
    `dangerouslyDisableDeviceAuth` は Control UI のデバイス ID チェックを無効にし、重大なセキュリティ低下を招きます。緊急使用後はすみやかに元に戻してください。
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - trusted-proxy 認証に成功すると、デバイス ID のない**オペレーター** Control UI セッションを許可できます。
    - これはノードロールの Control UI セッションには拡張されません。
    - 同一ホストのループバックリバースプロキシでも trusted-proxy 認証は満たせません。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth) を参照してください。

  </Accordion>
</AccordionGroup>

HTTPS セットアップのガイダンスについては [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## コンテンツセキュリティポリシー

Control UI は厳格な `img-src` ポリシーを同梱しています。許可されるのは、**同一オリジン**アセット、`data:` URL、ローカルで生成された `blob:` URL のみです。リモート `http(s)` とプロトコル相対の画像 URL はブラウザーにより拒否され、ネットワーク取得は一切発行されません。

実際には次のようになります。

- 相対パス（例: `/avatars/<id>`）配下で提供されるアバターや画像は引き続き表示されます。UI が取得してローカル `blob:` URL に変換する認証付きアバタールートも含まれます。
- インライン `data:image/...` URL は引き続き表示されます。
- Control UI によって作成されたローカル `blob:` URL は引き続き表示されます。
- GitHub リンクプレビューアバターは、Gateway が GitHub の固定アバターホストから取得し、制限付きの `data:` URL として返します。オペレーターブラウザーがリモートアバターホストに接続することはありません。
- チャンネルメタデータが出力するリモートアバター URL は、Control UI のアバターヘルパーで取り除かれ、組み込みロゴ/バッジに置き換えられます。そのため、侵害された、または悪意のあるチャンネルが、オペレーターブラウザーから任意のリモート画像取得を強制することはできません。

これは常に有効で、設定できません。

## アバタールート認証

Gateway 認証が設定されている場合、Control UI アバターエンドポイントは API の他の部分と同じ Gateway トークンを要求します。

- `GET /avatar/<agentId>` は認証済み呼び出し元にのみアバター画像を返します。`GET /avatar/<agentId>?meta=1` は同じルールの下でアバターメタデータを返します。
- いずれのルートへの未認証リクエストも拒否されます（兄弟の assistant-media ルートと一致します）。そのため、他の部分が保護されているホストで、アバタールートがエージェント ID を漏らすことはできません。
- Control UI はアバター取得時に Gateway トークンを bearer ヘッダーとして転送し、認証済み blob URL を使用するため、画像はダッシュボードで引き続き表示されます。

Gateway 認証を無効にすると（共有ホストでは非推奨）、Gateway の他の部分と同様にアバタールートも未認証になります。

## アシスタントメディアルート認証

Gateway 認証が設定されている場合、アシスタントのローカルメディアプレビューは 2 段階のルートを使用します。

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` は通常の Control UI オペレーター認証を要求します。ブラウザーは可用性確認時に Gateway トークンを bearer ヘッダーとして送信します。
- 成功したメタデータ応答には、その正確なソースパスにスコープされた短命の `mediaTicket` が含まれます。
- ブラウザーでレンダリングされる画像、音声、動画、ドキュメント URL は、アクティブな Gateway トークンやパスワードの代わりに `mediaTicket=<ticket>` を使用します。このチケットは短時間で期限切れになり、別のソースを認可することはできません。

これにより、再利用可能な Gateway 認証情報を見えるメディア URL に入れずに、メディアレンダリングとブラウザー標準のメディア要素との互換性を保てます。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを提供します。

```bash
pnpm ui:build
```

任意の絶対ベース（固定アセット URL）:

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

ローカル開発（別の開発サーバー）:

```bash
pnpm ui:dev
```

その後、UI を Gateway WS URL（例: `ws://127.0.0.1:18789`）に向けます。

## 空白の Control UI ページ

ブラウザーが空白のダッシュボードを読み込み、DevTools に有用なエラーが表示されない場合、拡張機能または早期のコンテンツスクリプトが JavaScript モジュールアプリの評価を妨げている可能性があります。静的ページには、起動後に `<openclaw-app>` が登録されていない場合に表示されるプレーン HTML の復旧パネルが含まれています。

ブラウザー環境を変更した後にパネルの **Try again** アクションを使用するか、次の確認後に手動で再読み込みしてください。

- すべてのページに注入する拡張機能、特に `<all_urls>` コンテンツスクリプトを持つ拡張機能を無効にします。
- プライベートウィンドウ、クリーンなブラウザープロファイル、または別のブラウザーを試します。
- Gateway を実行したままにし、ブラウザー変更後に同じダッシュボード URL を検証します。

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

    任意の一回限り認証（必要な場合）:

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="注記">
    - `gatewayUrl` は読み込み後に localStorage に保存され、URL から削除されます。
    - `gatewayUrl` で完全な `ws://` または `wss://` エンドポイントを渡す場合は、ブラウザーがクエリ文字列を正しく解析できるように値を URL エンコードしてください。
    - `token` は可能な限り URL フラグメント（`#token=...`）で渡してください。フラグメントはサーバーに送信されないため、リクエストログや Referer への漏えいを避けられます。従来の `?token=` クエリパラメーターは互換性のために一度だけ取り込まれますが、フォールバックとしてのみ扱われ、ブートストラップ直後に削除されます。
    - `password` はメモリ内にのみ保持されます。
    - `gatewayUrl` が設定されている場合、UI は設定や環境の認証情報にフォールバックしません。`token`（または `password`）を明示的に指定してください。明示的な認証情報がない場合はエラーです。
    - Gateway が TLS の背後にある場合（Tailscale Serve、HTTPS プロキシなど）は `wss://` を使用してください。
    - クリックジャッキングを防ぐため、`gatewayUrl` はトップレベルウィンドウ（埋め込みではない）でのみ受け付けられます。
    - 公開された非ループバックの Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を明示的に設定する必要があります（完全なオリジン）。ループバック、RFC1918/link-local、`.local`、`.ts.net`、または Tailscale CGNAT ホストからのプライベートな同一オリジン LAN/Tailnet 読み込みは、Host ヘッダーフォールバックを有効にしなくても受け付けられます。
    - Gateway の起動時には、有効なランタイムのバインドとポートから `http://localhost:<port>` や `http://127.0.0.1:<port>` などのローカルオリジンがシードされる場合がありますが、リモートブラウザーのオリジンには引き続き明示的なエントリが必要です。
    - 厳密に制御されたローカルテストを除き、`gateway.controlUi.allowedOrigins: ["*"]` は使用しないでください。これは任意のブラウザーオリジンを許可するという意味であり、「現在使用しているホストに一致させる」という意味ではありません。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は Host ヘッダーオリジンフォールバックモードを有効にしますが、これは危険なセキュリティモードです。

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
