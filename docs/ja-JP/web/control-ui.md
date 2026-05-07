---
read_when:
    - ブラウザから Gateway を操作したい場合
    - SSH トンネルなしで Tailnet アクセスしたい場合
sidebarTitle: Control UI
summary: Gateway 用のブラウザベースの制御 UI（チャット、ノード、設定）
title: コントロール UI
x-i18n:
    generated_at: "2026-05-07T13:27:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9ef19392f0d14aef9373e4469789f5916250f76038c8c81fe8a932c47913ca8
    source_path: web/control-ui.md
    workflow: 16
---

コントロール UI は、Gateway から配信される小さな **Vite + Lit** シングルページアプリです。

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します (例: `/openclaw`)

これは同じポート上の **Gateway WebSocket** と**直接**通信します。

## すぐに開く (ローカル)

Gateway が同じコンピューターで実行されている場合は、次を開きます。

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (または [http://localhost:18789/](http://localhost:18789/))

ページの読み込みに失敗する場合は、まず Gateway を起動します: `openclaw gateway`。

認証は WebSocket ハンドシェイク中に次の方法で提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合の Tailscale Serve ID ヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合の信頼済みプロキシ ID ヘッダー

ダッシュボード設定パネルは、現在のブラウザータブセッションと選択された Gateway URL のためにトークンを保持します。パスワードは永続化されません。オンボーディングでは通常、初回接続時に共有シークレット認証用の Gateway トークンが生成されますが、`gateway.auth.mode` が `"password"` の場合はパスワード認証も機能します。

## デバイスのペアリング (初回接続)

新しいブラウザーまたはデバイスからコントロール UI に接続すると、Gateway は通常、**一度限りのペアリング承認**を要求します。これは不正アクセスを防ぐためのセキュリティ対策です。

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

ブラウザーが変更された認証詳細 (ロール/スコープ/公開鍵) でペアリングを再試行すると、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認前に `openclaw devices list` を再実行してください。

ブラウザーがすでにペアリング済みで、それを読み取りアクセスから書き込み/管理者アクセスに変更した場合、これは暗黙の再接続ではなく承認アップグレードとして扱われます。OpenClaw は古い承認を有効なまま保持し、より広い権限での再接続をブロックし、新しいスコープセットを明示的に承認するよう求めます。

承認されると、そのデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り、再承認は不要になります。トークンのローテーションと取り消しについては、[Devices CLI](/ja-JP/cli/devices) を参照してください。

<Note>
- 直接の local loopback ブラウザー接続 (`127.0.0.1` / `localhost`) は自動承認されます。
- `gateway.auth.allowTailscale: true` で、Tailscale ID が検証され、ブラウザーがデバイス ID を提示する場合、Tailscale Serve はコントロール UI オペレーターセッションのペアリング往復を省略できます。
- 直接の Tailnet バインド、LAN ブラウザー接続、デバイス ID のないブラウザープロファイルでは、引き続き明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイス ID を生成するため、ブラウザーを切り替えたりブラウザーデータを消去したりすると、再ペアリングが必要になります。

</Note>

## 個人 ID (ブラウザーローカル)

コントロール UI は、共有セッションでの帰属表示のために送信メッセージに付加される、ブラウザーごとの個人 ID (表示名とアバター) をサポートしています。これはブラウザーストレージに保存され、現在のブラウザープロファイルにスコープされます。他のデバイスには同期されず、実際に送信したメッセージ上の通常のトランスクリプト作成者メタデータを除き、サーバー側には永続化されません。サイトデータを消去したりブラウザーを切り替えたりすると、空にリセットされます。

同じブラウザーローカルのパターンは、アシスタントアバターの上書きにも適用されます。アップロードされたアシスタントアバターは、ローカルブラウザー上でのみ Gateway が解決した ID に重ねられ、`config.patch` を通じて往復することはありません。共有の `ui.assistant.avatar` 設定フィールドは、スクリプト化された Gateway やカスタムダッシュボードなど、フィールドを直接書き込む非 UI クライアント向けに引き続き利用できます。

## ランタイム設定エンドポイント

コントロール UI は、ランタイム設定を `/__openclaw/control-ui-config.json` から取得します。このエンドポイントは、HTTP サーフェスの他の部分と同じ Gateway 認証で保護されています。未認証のブラウザーは取得できず、取得に成功するには、すでに有効な Gateway トークン/パスワード、Tailscale Serve ID、または信頼済みプロキシ ID のいずれかが必要です。

## 言語サポート

コントロール UI は、初回読み込み時にブラウザーのロケールに基づいてローカライズできます。後で上書きするには、**概要 -> Gateway アクセス -> 言語**を開きます。ロケールピッカーは外観ではなく、Gateway アクセスカード内にあります。

- サポートされるロケール: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 英語以外の翻訳はブラウザー内で遅延読み込みされます。
- 選択したロケールはブラウザーストレージに保存され、今後の訪問で再利用されます。
- 欠落している翻訳キーは英語にフォールバックします。

ドキュメント翻訳は同じ英語以外のロケールセットに対して生成されますが、ドキュメントサイトに組み込まれている Mintlify 言語ピッカーは、Mintlify が受け付けるロケールコードに制限されています。タイ語 (`th`) とペルシア語 (`fa`) のドキュメントも公開リポジトリに生成されますが、Mintlify がこれらのコードをサポートするまで、そのピッカーには表示されない場合があります。

## 外観テーマ

外観パネルには、組み込みの Claw、Knot、Dash テーマに加えて、ブラウザーローカルの tweakcn インポートスロットが 1 つあります。テーマをインポートするには、[tweakcn editor](https://tweakcn.com/editor/theme) を開き、テーマを選択または作成し、**共有**をクリックして、コピーされたテーマリンクを外観に貼り付けます。インポーターは `https://tweakcn.com/r/themes/<id>` レジストリ URL、`https://tweakcn.com/editor/theme?theme=amethyst-haze` のようなエディター URL、相対 `/themes/<id>` パス、生のテーマ ID、`amethyst-haze` などのデフォルトテーマ名も受け付けます。

インポートされたテーマは現在のブラウザープロファイルにのみ保存されます。Gateway 設定には書き込まれず、デバイス間で同期されません。インポート済みテーマを置き換えると、1 つのローカルスロットが更新されます。クリアすると、インポート済みテーマが選択されていた場合、アクティブテーマは Claw に戻ります。

## できること (現在)

<AccordionGroup>
  <Accordion title="チャットとトーク">
    - Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`) 経由でモデルとチャットします。
    - チャット履歴の更新は、メッセージごとのテキスト上限を持つ制限された最近のウィンドウをリクエストするため、大きなセッションでも、チャットが利用可能になる前にブラウザーへ完全なトランスクリプトペイロードの描画を強制しません。
    - ブラウザーのリアルタイムセッションを通じて会話します。OpenAI は直接 WebRTC を使用し、Google Live は WebSocket 経由の制約付き一回限りのブラウザートークンを使用し、バックエンド専用のリアルタイム音声 Plugin は Gateway リレートランスポートを使用します。クライアント所有のプロバイダーセッションは `talk.client.create` で開始し、Gateway リレーセッションは `talk.session.create` で開始します。リレーはプロバイダー資格情報を Gateway 上に保持し、ブラウザーが `talk.session.appendAudio` を通じてマイク PCM をストリーミングし、`openclaw_agent_consult` プロバイダーツール呼び出しを Gateway ポリシーとより大きな設定済み OpenClaw モデルのために `talk.client.toolCall` 経由で転送します。
    - チャット内でツール呼び出しとライブツール出力カードをストリーミングします (エージェントイベント)。

  </Accordion>
  <Accordion title="チャンネル、インスタンス、セッション、夢">
    - チャンネル: 組み込みおよび同梱/外部 Plugin チャンネルのステータス、QR ログイン、チャンネルごとの設定 (`channels.status`, `web.login.*`, `config.patch`)。
    - チャンネルプローブの更新は、遅いプロバイダーチェックが完了するまで以前のスナップショットを表示したままにし、プローブまたは監査が UI 予算を超えると部分スナップショットにラベルを付けます。
    - インスタンス: プレゼンスリストと更新 (`system-presence`)。
    - セッション: デフォルトで設定済みエージェントセッションを一覧表示し、古い未設定エージェントセッションキーからフォールバックし、セッションごとのモデル/thinking/fast/verbose/trace/reasoning 上書きを適用します (`sessions.list`, `sessions.patch`)。
    - 夢: Dreaming ステータス、有効/無効トグル、Dream Diary リーダー (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)。

  </Accordion>
  <Accordion title="Cron、Skills、ノード、exec 承認">
    - Cron ジョブ: 一覧表示/追加/編集/実行/有効化/無効化と実行履歴 (`cron.*`)。
    - Skills: ステータス、有効化/無効化、インストール、API キー更新 (`skills.*`)。
    - ノード: 一覧と機能 (`node.list`)。
    - exec 承認: Gateway またはノードの許可リストと `exec host=gateway/node` の ask ポリシーを編集します (`exec.approvals.*`)。

  </Accordion>
  <Accordion title="設定">
    - `~/.openclaw/openclaw.json` を表示/編集します (`config.get`, `config.set`)。
    - 検証付きで適用して再起動し (`config.apply`)、最後にアクティブだったセッションを起こします。
    - 書き込みには、同時編集による上書きを防ぐための base-hash ガードが含まれます。
    - 書き込み (`config.set`/`config.apply`/`config.patch`) は、送信された設定ペイロード内の refs について、アクティブな SecretRef 解決を事前確認します。未解決のアクティブな送信済み refs は、書き込み前に拒否されます。
    - スキーマとフォーム描画 (`config.schema` / `config.schema.lookup`。フィールド `title` / `description`、一致した UI ヒント、直下の子要約、ネストされたオブジェクト/ワイルドカード/配列/合成ノード上のドキュメントメタデータ、さらに利用可能な場合は Plugin とチャンネルのスキーマを含む)。Raw JSON エディターは、スナップショットが安全な raw 往復を持つ場合にのみ利用できます。
    - スナップショットが raw テキストを安全に往復できない場合、コントロール UI はそのスナップショットでフォームモードを強制し、Raw モードを無効にします。
    - Raw JSON エディターの「保存済みにリセット」は、平坦化されたスナップショットを再描画する代わりに、raw で作成された形状 (書式、コメント、`$include` レイアウト) を保持するため、スナップショットが安全に往復できる場合、外部編集はリセット後も保持されます。
    - 構造化された SecretRef オブジェクト値は、誤ってオブジェクトから文字列へ破損するのを防ぐため、フォームのテキスト入力では読み取り専用として描画されます。

  </Accordion>
  <Accordion title="デバッグ、ログ、更新">
    - デバッグ: ステータス/ヘルス/モデルのスナップショット、イベントログ、手動 RPC 呼び出し (`status`, `health`, `models.list`)。
    - イベントログには、コントロール UI の更新/RPC タイミング、遅いチャット/設定描画タイミング、およびブラウザーがそれらの PerformanceObserver エントリータイプを公開している場合の長いアニメーションフレームまたは長いタスクに関するブラウザー応答性エントリーが含まれます。
    - ログ: フィルター/エクスポート付きで Gateway ファイルログをライブ tail します (`logs.tail`)。
    - 更新: 再起動レポート付きで package/git 更新と再起動を実行し (`update.run`)、再接続後に `update.status` をポーリングして、実行中の Gateway バージョンを検証します。

  </Accordion>
  <Accordion title="Cron ジョブパネルの注意事項">
    - 分離されたジョブでは、配信のデフォルトはサマリーの告知です。内部専用の実行にしたい場合は none に切り替えられます。
    - announce が選択されている場合、チャンネル/ターゲットフィールドが表示されます。
    - Webhook モードは `delivery.mode = "webhook"` を使用し、`delivery.to` には有効な HTTP(S) Webhook URL を設定します。
    - メインセッションジョブでは、webhook と none の配信モードを利用できます。
    - 高度な編集コントロールには、delete-after-run、clear agent override、cron exact/stagger オプション、エージェントのモデル/thinking 上書き、best-effort delivery トグルが含まれます。
    - フォーム検証はフィールドレベルのエラーとしてインライン表示されます。無効な値がある場合、修正されるまで保存ボタンは無効になります。
    - 専用 bearer token を送信するには `cron.webhookToken` を設定します。省略した場合、Webhook は認証ヘッダーなしで送信されます。
    - 非推奨フォールバック: `notify: true` を持つ保存済みのレガシージョブは、移行されるまで引き続き `cron.webhook` を使用できます。

  </Accordion>
</AccordionGroup>

## チャットの動作

<AccordionGroup>
  <Accordion title="送信と履歴のセマンティクス">
    - `chat.send` は**非ブロッキング**です。即座に `{ runId, status: "started" }` で ACK を返し、レスポンスは `chat` イベント経由でストリームされます。
    - チャットのアップロードは、画像と動画以外のファイルを受け付けます。画像はネイティブ画像パスを保持し、その他のファイルは管理対象メディアとして保存され、履歴では添付リンクとして表示されます。
    - 同じ `idempotencyKey` で再送信すると、実行中は `{ status: "in_flight" }` が返り、完了後は `{ status: "ok" }` が返ります。
    - `chat.history` レスポンスは UI の安全性のためサイズ制限があります。トランスクリプトのエントリが大きすぎる場合、Gateway は長いテキストフィールドを切り詰め、重いメタデータブロックを省略し、サイズ超過メッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えることがあります。
    - アシスタント/生成画像は管理対象メディア参照として永続化され、認証済み Gateway メディア URL 経由で返されるため、再読み込みは未加工の base64 画像ペイロードがチャット履歴レスポンス内に残っていることに依存しません。
    - `chat.history` のレンダリング時、Control UI は表示専用のインラインディレクティブタグ（例: `[[reply_to_*]]` と `[[audio_as_voice]]`）、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、切り詰められたツール呼び出しブロックを含む）、漏洩した ASCII/全角のモデル制御トークンを、表示されるアシスタントテキストから取り除きます。また、表示テキスト全体が正確なサイレントトークン `NO_REPLY` / `no_reply` または Heartbeat 確認トークン `HEARTBEAT_OK` だけであるアシスタントエントリを省略します。
    - アクティブな送信中と最終履歴更新時に、`chat.history` が一時的に古いスナップショットを返した場合でも、チャットビューはローカルの楽観的なユーザー/アシスタントメッセージを表示し続けます。Gateway 履歴が追いつくと、正規のトランスクリプトがそれらのローカルメッセージを置き換えます。
    - ライブ `chat` イベントは配信状態であり、`chat.history` は永続的なセッショントランスクリプトから再構築されます。ツール最終イベントの後、Control UI は履歴を再読み込みし、小さな楽観的末尾だけをマージします。トランスクリプト境界は [WebChat](/ja-JP/web/webchat) に記載されています。
    - `chat.inject` はアシスタントノートをセッショントランスクリプトに追加し、UI 専用更新のために `chat` イベントをブロードキャストします（エージェント実行なし、チャネル配信なし）。
    - チャットヘッダーはセッションピッカーの前にエージェントフィルターを表示し、セッションピッカーは選択中のエージェントにスコープされます。エージェントを切り替えると、そのエージェントに紐づくセッションだけが表示され、保存済みダッシュボードセッションがまだない場合はそのエージェントのメインセッションにフォールバックします。
    - デスクトップ幅では、チャットコントロールはコンパクトな 1 行にとどまり、トランスクリプトを下へスクロール中は折りたたまれます。上へスクロールする、先頭へ戻る、または末尾に到達すると、コントロールが復元されます。
    - 連続する重複したテキストのみのメッセージは、カウントバッジ付きの 1 つのバブルとしてレンダリングされます。画像、添付、ツール出力、または canvas プレビューを含むメッセージは折りたたまれません。
    - チャットヘッダーのモデルと thinking ピッカーは、`sessions.patch` 経由でアクティブセッションに即座にパッチを適用します。これらは永続的なセッションオーバーライドであり、1 ターン限定の送信オプションではありません。
    - Control UI で `/new` と入力すると、New Chat と同じ新しいダッシュボードセッションを作成して切り替えます。`/reset` と入力すると、現在のセッションに対する Gateway の明示的なインプレースリセットを維持します。
    - チャットモデルピッカーは Gateway の構成済みモデルビューを要求します。`agents.defaults.models` が存在する場合、その許可リストがピッカーを駆動します。それ以外の場合、ピッカーは明示的な `models.providers.*.models` エントリと、使用可能な認証を持つプロバイダーを表示します。完全なカタログは、デバッグ用 `models.list` RPC の `view: "all"` から引き続き利用できます。
    - 新しい Gateway セッション使用状況レポートに現在のコンテキストトークンが含まれる場合、チャットコンポーザー領域はコンパクトなコンテキスト使用量インジケーターを表示します。高いコンテキスト負荷では警告スタイルに切り替わり、推奨 Compaction レベルでは通常のセッション Compaction パスを実行するコンパクトなボタンを表示します。古いトークンスナップショットは、Gateway が新しい使用状況を再度報告するまで非表示になります。

  </Accordion>
  <Accordion title="トークモード（ブラウザーリアルタイム）">
    トークモードは、登録済みのリアルタイム音声プロバイダーを使用します。OpenAI を `talk.realtime.provider: "openai"` と `talk.realtime.providers.openai.apiKey` で構成するか、Google を `talk.realtime.provider: "google"` と `talk.realtime.providers.google.apiKey` で構成します。ブラウザーは標準のプロバイダー API キーを受け取りません。OpenAI は WebRTC 用の一時的な Realtime クライアントシークレットを受け取ります。Google Live は、ブラウザー WebSocket セッション用の 1 回限りの制約付き Live API 認証トークンを受け取り、そのトークンには Gateway によって命令とツール宣言が固定されます。バックエンドのリアルタイムブリッジのみを公開するプロバイダーは Gateway リレートランスポート経由で実行されるため、認証情報とベンダーソケットはサーバー側に残り、ブラウザー音声は認証済み Gateway RPC 経由で移動します。Realtime セッションプロンプトは Gateway によって組み立てられます。`talk.client.create` は呼び出し元が提供する命令オーバーライドを受け付けません。

    チャットコンポーザーでは、Talk コントロールはマイク音声入力ボタンの横にある波形ボタンです。Talk が開始すると、コンポーザーステータス行には音声接続中に `Connecting Talk...`、音声が接続されている間は `Talk live`、またはリアルタイムツール呼び出しが `talk.client.toolCall` 経由で構成済みの大型モデルに問い合わせている間は `Asking OpenClaw...` が表示されます。

    メンテナー向けライブスモーク: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` は、OpenAI ブラウザー WebRTC SDP 交換、Google Live の制約付きトークンによるブラウザー WebSocket セットアップ、偽のマイクメディアを使った Gateway リレーブラウザーアダプターを検証します。このコマンドはプロバイダーのステータスのみを出力し、シークレットはログに記録しません。

  </Accordion>
  <Accordion title="停止と中止">
    - **Stop** をクリックします（`chat.abort` を呼び出します）。
    - 実行中は、通常のフォローアップがキューに入ります。キューに入ったメッセージの **Steer** をクリックすると、そのフォローアップを実行中のターンに注入します。
    - `/stop`（または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` のような単独の中止フレーズ）を入力すると、帯域外で中止します。
    - `chat.abort` は、そのセッションのすべてのアクティブ実行を中止するために `{ sessionKey }`（`runId` なし）をサポートします。

  </Accordion>
  <Accordion title="中止時の部分保持">
    - 実行が中止された場合でも、部分的なアシスタントテキストが UI に表示されることがあります。
    - Gateway は、バッファ済み出力が存在する場合、中止された部分的なアシスタントテキストをトランスクリプト履歴に永続化します。
    - 永続化されたエントリには中止メタデータが含まれるため、トランスクリプト利用者は中止部分を通常の完了出力と区別できます。

  </Accordion>
</AccordionGroup>

## PWA インストールと Web プッシュ

Control UI は `manifest.webmanifest` とサービスワーカーを同梱しているため、最新のブラウザーではスタンドアロン PWA としてインストールできます。Web Push により、タブやブラウザーウィンドウが開いていない場合でも、Gateway は通知でインストール済み PWA を起動できます。

| サーフェス                                            | 動作                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA マニフェスト。到達可能になるとブラウザーは「アプリをインストール」を提示します。 |
| `ui/public/sw.js`                                     | `push` イベントと通知クリックを処理するサービスワーカー。 |
| `push/vapid-keys.json`（OpenClaw 状態ディレクトリ配下） | Web Push ペイロードの署名に使用される、自動生成された VAPID キーペア。 |
| `push/web-push-subscriptions.json`                    | 永続化されたブラウザー購読エンドポイント。                          |

キーを固定したい場合（マルチホストデプロイ、シークレットローテーション、テストなど）は、Gateway プロセス上の環境変数で VAPID キーペアをオーバーライドします。

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（デフォルトは `mailto:openclaw@localhost`）

Control UI は、ブラウザー購読を登録およびテストするために、これらのスコープ制限付き Gateway メソッドを使用します。

- `push.web.vapidPublicKey` — アクティブな VAPID 公開鍵を取得します。
- `push.web.subscribe` — `endpoint` と `keys.p256dh`/`keys.auth` を登録します。
- `push.web.unsubscribe` — 登録済みエンドポイントを削除します。
- `push.web.test` — 呼び出し元の購読にテスト通知を送信します。

<Note>
Web Push は、iOS APNS リレーパス（リレー支援プッシュについては [構成](/ja-JP/gateway/configuration) を参照）および既存の `push.test` メソッドから独立しています。これらはネイティブモバイルのペアリングを対象とします。
</Note>

## ホスト型埋め込み

アシスタントメッセージは、`[embed ...]` ショートコードを使ってホストされた Web コンテンツをインラインでレンダリングできます。iframe サンドボックスポリシーは `gateway.controlUi.embedSandbox` によって制御されます。

<Tabs>
  <Tab title="strict">
    ホスト型埋め込み内でのスクリプト実行を無効にします。
  </Tab>
  <Tab title="scripts（デフォルト）">
    オリジン分離を維持しながらインタラクティブな埋め込みを許可します。これがデフォルトであり、通常は自己完結型のブラウザーゲーム/ウィジェットには十分です。
  </Tab>
  <Tab title="trusted">
    より強い権限を意図的に必要とする同一サイト文書のために、`allow-scripts` に加えて `allow-same-origin` を追加します。
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
埋め込み文書が本当に同一オリジンの挙動を必要とする場合にのみ `trusted` を使用してください。ほとんどのエージェント生成ゲームやインタラクティブ canvas では、`scripts` の方が安全な選択です。
</Warning>

絶対外部 `http(s)` 埋め込み URL は、デフォルトでは引き続きブロックされます。意図的に `[embed url="https://..."]` でサードパーティページを読み込みたい場合は、`gateway.controlUi.allowExternalEmbedUrls: true` を設定します。

## チャットメッセージ幅

グループ化されたチャットメッセージは、読みやすいデフォルトの最大幅を使用します。ワイドモニターのデプロイでは、`gateway.controlUi.chatMessageMaxWidth` を設定することで、同梱 CSS にパッチを当てずにオーバーライドできます。

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

値はブラウザーに到達する前に検証されます。サポートされる値には、`960px` や `82%` のような単純な長さとパーセンテージに加え、制約付きの `min(...)`、`max(...)`、`clamp(...)`、`calc(...)`、`fit-content(...)` 幅式が含まれます。

## Tailnet アクセス（推奨）

<Tabs>
  <Tab title="統合 Tailscale Serve（推奨）">
    Gateway を loopback に保持し、Tailscale Serve で HTTPS プロキシさせます。

    ```bash
    openclaw gateway --tailscale serve
    ```

    開く:

    - `https://<magicdns>/`（または構成済みの `gateway.controlUi.basePath`）

    デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket Serve リクエストは Tailscale ID ヘッダー（`tailscale-user-login`）経由で認証できます。OpenClaw は、`x-forwarded-for` アドレスを `tailscale whois` で解決してヘッダーと照合することで ID を検証し、リクエストが Tailscale の `x-forwarded-*` ヘッダー付きで loopback に到達した場合にのみ受け入れます。ブラウザーデバイス ID を持つ Control UI オペレーターセッションでは、この検証済み Serve パスはデバイスペアリングの往復もスキップします。デバイスなしブラウザーとノードロール接続は、通常のデバイスチェックに従います。Serve トラフィックでも明示的な共有シークレット認証情報を要求したい場合は、`gateway.auth.allowTailscale: false` を設定します。その場合は `gateway.auth.mode: "token"` または `"password"` を使用します。

    その非同期 Serve ID パスでは、同じクライアント IP と認証スコープに対する認証失敗は、レート制限書き込みの前に直列化されます。そのため、同じブラウザーから同時に不正な再試行が行われると、2 つの単純な不一致が並行して競合する代わりに、2 回目のリクエストで `retry later` が表示されることがあります。

    <Warning>
    トークンなし Serve 認証は、gateway ホストが信頼されていることを前提とします。信頼できないローカルコードがそのホスト上で実行される可能性がある場合は、トークン/パスワード認証を要求してください。
    </Warning>

  </Tab>
  <Tab title="tailnet へバインド + トークン">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    次に開きます:

    - `http://<tailscale-ip>:18789/` (または構成済みの `gateway.controlUi.basePath`)

    対応する共有シークレットを UI 設定に貼り付けます（`connect.params.auth.token` または `connect.params.auth.password` として送信されます）。

  </Tab>
</Tabs>

## 安全でない HTTP

プレーン HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、ブラウザーは**非セキュアコンテキスト**で実行され、WebCrypto をブロックします。デフォルトでは、OpenClaw はデバイス ID のない Control UI 接続を**ブロック**します。

文書化されている例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost 限定の安全でない HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` によるオペレーターの Control UI 認証成功
- 非常時用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS（Tailscale Serve）を使用するか、UI をローカルで開きます:

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（Gateway ホスト上）

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

    `allowInsecureAuth` はローカル互換性トグル専用です:

    - 非セキュア HTTP コンテキストで、localhost の Control UI セッションがデバイス ID なしで進行することを許可します。
    - ペアリングチェックはバイパスしません。
    - リモート（localhost 以外）のデバイス ID 要件は緩和しません。

  </Accordion>
  <Accordion title="非常時専用">
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
  <Accordion title="信頼済みプロキシの注記">
    - 信頼済みプロキシ認証に成功すると、**オペレーター**の Control UI セッションはデバイス ID なしで許可される場合があります。
    - これはノードロールの Control UI セッションには拡張されません。
    - 同一ホストのループバックリバースプロキシでも、信頼済みプロキシ認証は満たされません。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照してください。

  </Accordion>
</AccordionGroup>

HTTPS のセットアップガイダンスについては、[Tailscale](/ja-JP/gateway/tailscale)を参照してください。

## コンテンツセキュリティポリシー

Control UI には厳格な `img-src` ポリシーが同梱されています。許可されるのは、**同一オリジン**のアセット、`data:` URL、ローカルで生成された `blob:` URL だけです。リモートの `http(s)` およびプロトコル相対の画像 URL はブラウザーによって拒否され、ネットワークフェッチは発行されません。

実際には、これは次のことを意味します:

- 相対パス（たとえば `/avatars/<id>`）配下で提供されるアバターと画像は、UI が取得してローカルの `blob:` URL に変換する認証済みアバタールートを含め、引き続きレンダリングされます。
- インラインの `data:image/...` URL は引き続きレンダリングされます（プロトコル内ペイロードに有用です）。
- Control UI によって作成されたローカルの `blob:` URL は引き続きレンダリングされます。
- チャンネルメタデータから出力されたリモートアバター URL は、Control UI のアバターヘルパーで取り除かれ、組み込みのロゴ/バッジに置き換えられます。そのため、侵害されたチャンネルや悪意のあるチャンネルが、オペレーターのブラウザーから任意のリモート画像フェッチを強制することはできません。

この動作を得るために変更は不要です。常に有効で、構成できません。

## アバタールート認証

Gateway 認証が構成されている場合、Control UI のアバターエンドポイントには API の残りの部分と同じ Gateway トークンが必要です:

- `GET /avatar/<agentId>` は、認証済み呼び出し元にのみアバター画像を返します。`GET /avatar/<agentId>?meta=1` は、同じルールの下でアバターメタデータを返します。
- どちらのルートへの未認証リクエストも拒否されます（兄弟の assistant-media ルートと同様）。これにより、ほかの部分が保護されているホストで、アバタールートからエージェント ID が漏れることを防ぎます。
- Control UI 自体は、アバター取得時に Gateway トークンを bearer ヘッダーとして転送し、認証済み blob URL を使用するため、画像はダッシュボードで引き続きレンダリングされます。

Gateway 認証を無効にすると（共有ホストでは推奨されません）、Gateway の残りの部分と同様に、アバタールートも未認証になります。

## アシスタントメディアルート認証

Gateway 認証が構成されている場合、アシスタントのローカルメディアプレビューは 2 段階のルートを使用します:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` には通常の Control UI オペレーター認証が必要です。ブラウザーは可用性を確認するとき、Gateway トークンを bearer ヘッダーとして送信します。
- 成功したメタデータレスポンスには、その正確なソースパスにスコープされた短命の `mediaTicket` が含まれます。
- ブラウザーでレンダリングされる画像、音声、動画、ドキュメントの URL は、アクティブな Gateway トークンまたはパスワードの代わりに `mediaTicket=<ticket>` を使用します。チケットはすぐに期限切れになり、別のソースを認可することはできません。

これにより、再利用可能な Gateway 認証情報を見えるメディア URL に含めることなく、通常のメディアレンダリングをブラウザー標準のメディア要素と互換に保てます。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを提供します。次でビルドします:

```bash
pnpm ui:build
```

任意の絶対ベース（固定アセット URL が必要な場合）:

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

ローカル開発用（別個の開発サーバー）:

```bash
pnpm ui:dev
```

次に、UI を Gateway WS URL（例: `ws://127.0.0.1:18789`）に向けます。

## デバッグ/テスト: 開発サーバー + リモート Gateway

Control UI は静的ファイルです。WebSocket ターゲットは構成可能で、HTTP オリジンと異なっていてもかまいません。これは、Vite 開発サーバーをローカルで使い、Gateway を別の場所で実行したい場合に便利です。

<Steps>
  <Step title="UI 開発サーバーを起動する">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="gatewayUrl で開く">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    任意の一回限りの認証（必要な場合）:

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="注記">
    - `gatewayUrl` は読み込み後に localStorage に保存され、URL から削除されます。
    - 完全な `ws://` または `wss://` エンドポイントを `gatewayUrl` 経由で渡す場合は、ブラウザーがクエリ文字列を正しく解析できるように `gatewayUrl` の値を URL エンコードしてください。
    - `token` は可能な限り URL フラグメント（`#token=...`）経由で渡してください。フラグメントはサーバーに送信されないため、リクエストログや Referer への漏えいを避けられます。レガシーな `?token=` クエリパラメーターも互換性のため一度だけインポートされますが、フォールバックとしてのみで、ブートストラップ直後に取り除かれます。
    - `password` はメモリ内にのみ保持されます。
    - `gatewayUrl` が設定されている場合、UI は構成や環境認証情報にフォールバックしません。`token`（または `password`）を明示的に指定してください。明示的な認証情報がない場合はエラーです。
    - Gateway が TLS（Tailscale Serve、HTTPS プロキシなど）の背後にある場合は `wss://` を使用してください。
    - `gatewayUrl` はクリックジャッキングを防ぐため、トップレベルウィンドウ（埋め込みではない）でのみ受け付けられます。
    - 非ループバックの Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を明示的に設定する必要があります（完全なオリジン）。これにはリモート開発セットアップも含まれます。
    - Gateway の起動時に、有効なランタイムの bind とポートから `http://localhost:<port>` や `http://127.0.0.1:<port>` などのローカルオリジンがシードされる場合がありますが、リモートブラウザーのオリジンには引き続き明示的なエントリが必要です。
    - 厳密に管理されたローカルテストを除き、`gateway.controlUi.allowedOrigins: ["*"]` は使用しないでください。これは任意のブラウザーオリジンを許可するという意味であり、「現在使用しているホストに一致する」という意味ではありません。
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
- [ヘルスチェック](/ja-JP/gateway/health) — Gateway のヘルス監視
- [TUI](/ja-JP/web/tui) — ターミナルユーザーインターフェイス
- [WebChat](/ja-JP/web/webchat) — ブラウザーベースのチャットインターフェイス
