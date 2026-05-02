---
read_when:
    - ブラウザーから Gateway を操作したい
    - SSH トンネルなしで Tailnet アクセスを利用したい
sidebarTitle: Control UI
summary: Gateway 用のブラウザベースの制御ユーザーインターフェイス（チャット、ノード、設定）
title: コントロールUI
x-i18n:
    generated_at: "2026-05-02T23:39:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 50bef807915f27406e19f1c6ca7d839a610d79ba79da85d7a78523400cbf9208
    source_path: web/control-ui.md
    workflow: 16
---

コントロール UI は、Gateway によって提供される小さな **Vite + Lit** シングルページアプリです。

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します（例: `/openclaw`）

これは同じポート上の **Gateway WebSocket** と直接通信します。

## クイックオープン（ローカル）

Gateway が同じコンピューターで実行されている場合は、次を開きます。

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）

ページの読み込みに失敗する場合は、先に Gateway を起動します: `openclaw gateway`。

認証は WebSocket ハンドシェイク中に次を通じて提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合の Tailscale Serve ID ヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合の信頼済みプロキシ ID ヘッダー

ダッシュボード設定パネルは、現在のブラウザータブセッションと選択中の Gateway URL に対してトークンを保持します。パスワードは永続化されません。オンボーディングでは通常、初回接続時に共有シークレット認証用の Gateway トークンが生成されますが、`gateway.auth.mode` が `"password"` の場合はパスワード認証も機能します。

## デバイスのペアリング（初回接続）

新しいブラウザーまたはデバイスからコントロール UI に接続すると、Gateway は通常、**1 回限りのペアリング承認**を要求します。これは不正アクセスを防ぐためのセキュリティ対策です。

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

ブラウザーがすでにペアリング済みで、読み取りアクセスから書き込み/管理者アクセスに変更する場合、これは暗黙の再接続ではなく承認のアップグレードとして扱われます。OpenClaw は古い承認を有効なまま維持し、より広い権限での再接続をブロックして、新しいスコープセットを明示的に承認するよう求めます。

承認されると、デバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り再承認は不要です。トークンのローテーションと取り消しについては [デバイス CLI](/ja-JP/cli/devices) を参照してください。

<Note>
- 直接の local loopback ブラウザー接続（`127.0.0.1` / `localhost`）は自動承認されます。
- `gateway.auth.allowTailscale: true` で、Tailscale ID が検証され、ブラウザーがデバイス ID を提示する場合、Tailscale Serve はコントロール UI のオペレーターセッションでペアリングの往復を省略できます。
- 直接の Tailnet バインド、LAN ブラウザー接続、およびデバイス ID のないブラウザープロファイルでは、引き続き明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイス ID を生成するため、ブラウザーを切り替えたりブラウザーデータを消去したりすると、再ペアリングが必要になります。

</Note>

## 個人 ID（ブラウザーローカル）

コントロール UI は、共有セッションでの帰属表示のために、送信メッセージに付与されるブラウザーごとの個人 ID（表示名とアバター）をサポートします。これはブラウザーストレージ内にあり、現在のブラウザープロファイルにスコープされ、実際に送信したメッセージの通常のトランスクリプト作成者メタデータを除き、他のデバイスへ同期されたりサーバー側に永続化されたりしません。サイトデータを消去したりブラウザーを切り替えたりすると、空の状態にリセットされます。

同じブラウザーローカルのパターンは、アシスタントアバターの上書きにも適用されます。アップロードされたアシスタントアバターは、ローカルブラウザー上でのみ Gateway によって解決された ID に重ねられ、`config.patch` を介して往復することはありません。共有の `ui.assistant.avatar` 設定フィールドは、スクリプト化された Gateway やカスタムダッシュボードなど、このフィールドを直接書き込む非 UI クライアント向けに引き続き利用できます。

## ランタイム設定エンドポイント

コントロール UI は、ランタイム設定を `/__openclaw/control-ui-config.json` から取得します。このエンドポイントは、HTTP サーフェスの他の部分と同じ Gateway 認証で保護されています。未認証のブラウザーは取得できず、取得に成功するには、すでに有効な Gateway トークン/パスワード、Tailscale Serve ID、または信頼済みプロキシ ID のいずれかが必要です。

## 言語サポート

コントロール UI は初回読み込み時に、ブラウザーのロケールに基づいて自身をローカライズできます。後で上書きするには、**概要 -> Gateway アクセス -> 言語** を開きます。ロケールピッカーは Gateway アクセスカード内にあり、外観の下にはありません。

- サポートされるロケール: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 英語以外の翻訳はブラウザー内で遅延読み込みされます。
- 選択したロケールはブラウザーストレージに保存され、以後の訪問で再利用されます。
- 欠落している翻訳キーは英語にフォールバックします。

ドキュメント翻訳は同じ英語以外のロケールセットに対して生成されますが、ドキュメントサイトに組み込まれた Mintlify 言語ピッカーは Mintlify が受け入れるロケールコードに制限されています。タイ語（`th`）とペルシア語（`fa`）のドキュメントは公開リポジトリで引き続き生成されますが、Mintlify がこれらのコードをサポートするまで、そのピッカーには表示されない場合があります。

## 外観テーマ

外観パネルは、組み込みの Claw、Knot、Dash テーマに加え、ブラウザーローカルの tweakcn インポートスロットを 1 つ保持します。テーマをインポートするには、[tweakcn themes](https://tweakcn.com/themes) を開き、テーマを選択または作成して **共有** をクリックし、コピーされたテーマリンクを外観に貼り付けます。インポーターは、`https://tweakcn.com/r/themes/<id>` レジストリ URL、`https://tweakcn.com/editor/theme?theme=amethyst-haze` のようなエディター URL、相対 `/themes/<id>` パス、生のテーマ ID、`amethyst-haze` のようなデフォルトテーマ名も受け付けます。

インポートされたテーマは、現在のブラウザープロファイルにのみ保存されます。Gateway 設定には書き込まれず、デバイス間で同期されません。インポート済みテーマを置き換えると、1 つのローカルスロットが更新されます。削除すると、インポート済みテーマが選択されていた場合はアクティブテーマが Claw に戻ります。

## できること（現時点）

<AccordionGroup>
  <Accordion title="チャットと会話">
    - Gateway WS（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）を介してモデルとチャットします。
    - サーバー側 STT（`chat.transcribeAudio`）でチャット入力欄に音声入力します。ブラウザーは短いマイク音声クリップを録音して Gateway に送信し、Gateway は設定済みの `tools.media.audio` 文字起こしパイプラインを実行して、プロバイダー認証情報をブラウザーに公開せずに下書きテキストを返します。
    - ブラウザーのリアルタイムセッションを通じて会話します。OpenAI は直接 WebRTC を使用し、Google Live は WebSocket 経由の制限付き 1 回使用ブラウザートークンを使用し、バックエンド専用リアルタイム音声 Plugin は Gateway リレートランスポートを使用します。リレーはプロバイダー認証情報を Gateway 上に保持し、ブラウザーは `talk.realtime.relay*` RPC を通じてマイク PCM をストリーミングし、より大きな設定済み OpenClaw モデル向けに `openclaw_agent_consult` ツール呼び出しを `chat.send` 経由で送り返します。
    - チャットでツール呼び出しとライブツール出力カードをストリーミングします（エージェントイベント）。

  </Accordion>
  <Accordion title="チャンネル、インスタンス、セッション、夢">
    - チャンネル: 組み込みおよびバンドル/外部 Plugin チャンネルのステータス、QR ログイン、チャンネルごとの設定（`channels.status`, `web.login.*`, `config.patch`）。
    - インスタンス: プレゼンス一覧と更新（`system-presence`）。
    - セッション: 一覧とセッションごとのモデル/思考/高速/詳細/トレース/推論の上書き（`sessions.list`, `sessions.patch`）。
    - 夢: Dreaming ステータス、有効/無効トグル、Dream Diary リーダー（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）。

  </Accordion>
  <Accordion title="Cron、Skills、ノード、exec 承認">
    - Cron ジョブ: 一覧/追加/編集/実行/有効化/無効化と実行履歴（`cron.*`）。
    - Skills: ステータス、有効化/無効化、インストール、API キー更新（`skills.*`）。
    - ノード: 一覧と能力（`node.list`）。
    - exec 承認: `exec host=gateway/node` の Gateway またはノードの許可リストと確認ポリシーを編集（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="設定">
    - `~/.openclaw/openclaw.json` を表示/編集（`config.get`, `config.set`）。
    - 検証付きで適用して再起動（`config.apply`）し、最後にアクティブだったセッションを起動します。
    - 書き込みには、同時編集による上書きを防ぐためのベースハッシュガードが含まれます。
    - 書き込み（`config.set`/`config.apply`/`config.patch`）は、送信された設定ペイロード内の ref について、アクティブな SecretRef 解決を事前チェックします。未解決のアクティブな送信済み ref は、書き込み前に拒否されます。
    - スキーマとフォームレンダリング（`config.schema` / `config.schema.lookup`。フィールド `title` / `description`、一致した UI ヒント、直下の子サマリー、ネストされたオブジェクト/ワイルドカード/配列/合成ノード上のドキュメントメタデータ、利用可能な場合は Plugin とチャンネルのスキーマを含む）。Raw JSON エディターは、スナップショットが安全に raw 往復できる場合にのみ利用できます。
    - スナップショットが raw テキストを安全に往復できない場合、コントロール UI はそのスナップショットに対してフォームモードを強制し、Raw モードを無効にします。
    - Raw JSON エディターの「保存済みにリセット」は、フラット化されたスナップショットを再レンダリングするのではなく、raw で作成された形状（書式、コメント、`$include` レイアウト）を保持するため、スナップショットが安全に往復できる場合、外部編集はリセット後も残ります。
    - 構造化された SecretRef オブジェクト値は、誤ってオブジェクトから文字列へ破損するのを防ぐため、フォームのテキスト入力では読み取り専用として表示されます。

  </Accordion>
  <Accordion title="デバッグ、ログ、更新">
    - デバッグ: ステータス/ヘルス/モデルのスナップショット、イベントログ、手動 RPC 呼び出し（`status`, `health`, `models.list`）。
    - ログ: フィルター/エクスポート付きの Gateway ファイルログのライブ末尾表示（`logs.tail`）。
    - 更新: 再起動レポート付きでパッケージ/git 更新と再起動（`update.run`）を実行し、再接続後に `update.status` をポーリングして実行中の Gateway バージョンを検証します。

  </Accordion>
  <Accordion title="Cron ジョブパネルのメモ">
    - 分離ジョブでは、配信のデフォルトはサマリー通知です。内部専用の実行にしたい場合は、なしに切り替えられます。
    - 通知が選択されている場合、チャンネル/ターゲットフィールドが表示されます。
    - Webhook モードは、`delivery.to` に有効な HTTP(S) Webhook URL を設定して `delivery.mode = "webhook"` を使用します。
    - メインセッションジョブでは、Webhook となしの配信モードを利用できます。
    - 高度な編集コントロールには、実行後削除、エージェント上書きのクリア、Cron の exact/stagger オプション、エージェントのモデル/思考上書き、ベストエフォート配信トグルが含まれます。
    - フォーム検証はフィールドレベルのエラーとしてインライン表示されます。無効な値がある場合、修正されるまで保存ボタンは無効になります。
    - 専用のベアラートークンを送信するには `cron.webhookToken` を設定します。省略した場合、Webhook は認証ヘッダーなしで送信されます。
    - 非推奨のフォールバック: `notify: true` を持つ保存済みのレガシージョブは、移行されるまで引き続き `cron.webhook` を使用できます。

  </Accordion>
</AccordionGroup>

## チャットの動作

<AccordionGroup>
  <Accordion title="送信と履歴のセマンティクス">
    - `chat.send` は **ノンブロッキング** です。`{ runId, status: "started" }` で即座に ack を返し、応答は `chat` イベントでストリーミングされます。
    - `chat.transcribeAudio` は Chat の下書き用のワンショット音声入力ヘルパーです。ブラウザーで録音した base64 音声を受け取り、アップロードを Gateway WebSocket フレーム制限未満に保ち、一時ローカルファイルを書き込み、アクティブな Gateway 設定でメディア理解の音声文字起こしを実行し、`{ text, provider, model }` を返して、一時ファイルを削除します。これはエージェント実行を作成せず、リアルタイム Talk とは別です。
    - Chat のアップロードは画像と動画以外のファイルを受け付けます。画像はネイティブ画像パスを保持し、それ以外のファイルは管理対象メディアとして保存され、履歴には添付リンクとして表示されます。
    - 同じ `idempotencyKey` で再送信すると、実行中は `{ status: "in_flight" }` を返し、完了後は `{ status: "ok" }` を返します。
    - `chat.history` の応答は UI の安全性のためサイズ制限されます。トランスクリプト項目が大きすぎる場合、Gateway は長いテキストフィールドを切り詰め、重いメタデータブロックを省略し、サイズ超過メッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えることがあります。
    - アシスタント/生成画像は管理対象メディア参照として永続化され、認証済み Gateway メディア URL 経由で返されるため、再読み込みは未加工の base64 画像ペイロードが Chat 履歴応答に残っていることに依存しません。
    - `chat.history` は、表示専用のインライン指示タグ（例: `[[reply_to_*]]` と `[[audio_as_voice]]`）、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、漏れた ASCII/全角モデル制御トークンも、表示されるアシスタントテキストから除去し、表示テキスト全体が正確なサイレントトークン `NO_REPLY` / `no_reply` だけであるアシスタント項目を省略します。
    - アクティブな送信中と最終履歴更新中に、`chat.history` が一時的に古いスナップショットを返した場合でも、Chat ビューはローカルの楽観的なユーザー/アシスタントメッセージを表示し続けます。Gateway 履歴が追いつくと、正規のトランスクリプトがそれらのローカルメッセージを置き換えます。
    - `chat.inject` はアシスタントメモをセッショントランスクリプトに追加し、UI のみの更新用に `chat` イベントをブロードキャストします（エージェント実行なし、チャネル配信なし）。
    - Chat ヘッダーのモデルと thinking のピッカーは、`sessions.patch` 経由でアクティブセッションに即座にパッチを適用します。これらは 1 ターン限定の送信オプションではなく、永続的なセッションオーバーライドです。
    - Control UI で `/new` と入力すると、New Chat と同じ新しいダッシュボードセッションが作成され、そのセッションに切り替わります。`/reset` と入力すると、現在のセッションに対する Gateway の明示的なインプレースリセットが保持されます。
    - Chat モデルピッカーは、Gateway の設定済みモデルビューを要求します。`agents.defaults.models` が存在する場合、その許可リストがピッカーを制御します。存在しない場合、ピッカーは明示的な `models.providers.*.models` 項目と、利用可能な認証を持つプロバイダーを表示します。完全なカタログは、デバッグ用の `models.list` RPC で `view: "all"` を指定すると引き続き利用できます。
    - 新しい Gateway セッション使用量レポートが高いコンテキスト圧力を示す場合、Chat コンポーザー領域にはコンテキスト通知が表示され、推奨される Compaction レベルでは通常のセッション Compaction パスを実行するコンパクトボタンが表示されます。古いトークンスナップショットは、Gateway が新しい使用量を再び報告するまで非表示になります。

  </Accordion>
  <Accordion title="Talk モード（ブラウザーリアルタイム）">
    Talk モードは登録済みのリアルタイム音声プロバイダーを使用します。OpenAI は `talk.provider: "openai"` と `talk.providers.openai.apiKey` で設定し、Google は `talk.provider: "google"` と `talk.providers.google.apiKey` で設定します。Voice Call のリアルタイムプロバイダー設定もフォールバックとして再利用できます。ブラウザーが標準プロバイダー API キーを受け取ることはありません。OpenAI は WebRTC 用のエフェメラル Realtime クライアントシークレットを受け取ります。Google Live は、ブラウザー WebSocket セッション用の 1 回限りの制約付き Live API 認証トークンを受け取り、指示とツール宣言は Gateway によってトークン内にロックされます。バックエンドのリアルタイムブリッジのみを公開するプロバイダーは Gateway リレートランスポート経由で実行されるため、認証情報とベンダーソケットはサーバー側に留まり、ブラウザー音声は認証済み Gateway RPC 経由で移動します。Realtime セッションプロンプトは Gateway によって組み立てられます。`talk.realtime.session` は呼び出し元が指定する指示オーバーライドを受け付けません。

    Chat コンポーザーでは、Talk コントロールはマイク音声入力ボタンの隣にある波形ボタンです。Talk が開始すると、コンポーザーのステータス行にまず `Connecting Talk...` が表示され、音声が接続されている間は `Talk live`、リアルタイムツール呼び出しが `chat.send` 経由で設定済みの大型モデルに問い合わせている間は `Asking OpenClaw...` が表示されます。

    メンテナー向けライブスモーク: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` は、OpenAI ブラウザー WebRTC SDP 交換、Google Live 制約付きトークンのブラウザー WebSocket セットアップ、偽のマイクメディアを使った Gateway リレーブラウザーアダプターを検証します。このコマンドはプロバイダーのステータスのみを出力し、シークレットはログに記録しません。

  </Accordion>
  <Accordion title="停止と中止">
    - **停止** をクリックします（`chat.abort` を呼び出します）。
    - 実行がアクティブな間、通常のフォローアップはキューに入ります。キュー内のメッセージで **Steer** をクリックすると、そのフォローアップを実行中のターンに注入できます。
    - 帯域外で中止するには、`/stop`（または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` のような単独の中止フレーズ）を入力します。
    - `chat.abort` は、そのセッションのすべてのアクティブな実行を中止するために `{ sessionKey }`（`runId` なし）をサポートします。

  </Accordion>
  <Accordion title="中止時の部分保持">
    - 実行が中止されても、アシスタントの部分テキストは UI に表示されることがあります。
    - バッファーされた出力が存在する場合、Gateway は中止されたアシスタントの部分テキストをトランスクリプト履歴に永続化します。
    - 永続化された項目には中止メタデータが含まれるため、トランスクリプト利用側は中止された部分出力と通常の完了出力を区別できます。

  </Accordion>
</AccordionGroup>

## PWA インストールと Web Push

Control UI は `manifest.webmanifest` とサービスワーカーを同梱しているため、最新ブラウザーではスタンドアロン PWA としてインストールできます。Web Push により、タブやブラウザーウィンドウが開いていない場合でも、Gateway は通知でインストール済み PWA を起動できます。

| サーフェス                                            | 動作                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA マニフェスト。到達可能になると、ブラウザーは「アプリをインストール」を提示します。 |
| `ui/public/sw.js`                                     | `push` イベントと通知クリックを処理するサービスワーカー。         |
| `push/vapid-keys.json`（OpenClaw 状態ディレクトリ配下） | Web Push ペイロードの署名に使用される、自動生成された VAPID キーペア。 |
| `push/web-push-subscriptions.json`                    | 永続化されたブラウザー購読エンドポイント。                         |

キーを固定したい場合（マルチホストデプロイ、シークレットローテーション、テストなど）は、Gateway プロセスの環境変数で VAPID キーペアをオーバーライドします。

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（デフォルトは `mailto:openclaw@localhost`）

Control UI は、ブラウザー購読の登録とテストに、これらのスコープ制限付き Gateway メソッドを使用します。

- `push.web.vapidPublicKey` — アクティブな VAPID 公開鍵を取得します。
- `push.web.subscribe` — `endpoint` と `keys.p256dh`/`keys.auth` を登録します。
- `push.web.unsubscribe` — 登録済みエンドポイントを削除します。
- `push.web.test` — 呼び出し元の購読にテスト通知を送信します。

<Note>
Web Push は iOS APNS リレーパス（リレーに支えられた push については [設定](/ja-JP/gateway/configuration) を参照）および既存の `push.test` メソッドとは独立しており、これらはネイティブモバイルペアリングを対象とします。
</Note>

## ホストされた埋め込み

アシスタントメッセージは、`[embed ...]` ショートコードでホストされた Web コンテンツをインライン表示できます。iframe サンドボックスポリシーは `gateway.controlUi.embedSandbox` で制御されます。

<Tabs>
  <Tab title="strict">
    ホストされた埋め込み内でのスクリプト実行を無効にします。
  </Tab>
  <Tab title="scripts（デフォルト）">
    オリジン分離を維持しながらインタラクティブな埋め込みを許可します。これはデフォルトであり、通常は自己完結型のブラウザーゲーム/ウィジェットに十分です。
  </Tab>
  <Tab title="trusted">
    より強い権限を意図的に必要とする同一サイトドキュメントのために、`allow-scripts` に加えて `allow-same-origin` を追加します。
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
`trusted` は、埋め込みドキュメントが本当に同一オリジン動作を必要とする場合にのみ使用してください。ほとんどのエージェント生成ゲームやインタラクティブキャンバスでは、`scripts` の方が安全な選択です。
</Warning>

絶対外部 `http(s)` 埋め込み URL はデフォルトでブロックされたままです。意図的に `[embed url="https://..."]` でサードパーティページを読み込みたい場合は、`gateway.controlUi.allowExternalEmbedUrls: true` を設定します。

## Chat メッセージ幅

グループ化された Chat メッセージは、読みやすいデフォルト最大幅を使用します。ワイドモニターのデプロイでは、同梱 CSS にパッチを当てずに `gateway.controlUi.chatMessageMaxWidth` を設定してオーバーライドできます。

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
    Gateway をループバックに保ち、Tailscale Serve に HTTPS でプロキシさせます。

    ```bash
    openclaw gateway --tailscale serve
    ```

    開く:

    - `https://<magicdns>/`（または設定済みの `gateway.controlUi.basePath`）

    デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket Serve リクエストは Tailscale ID ヘッダー（`tailscale-user-login`）で認証できます。OpenClaw は `x-forwarded-for` アドレスを `tailscale whois` で解決してヘッダーと照合することで ID を検証し、リクエストが Tailscale の `x-forwarded-*` ヘッダー付きでループバックに到達した場合にのみ受け入れます。ブラウザーのデバイス ID を持つ Control UI オペレーターセッションでは、この検証済み Serve パスはデバイスペアリングの往復もスキップします。デバイスのないブラウザーと node-role 接続は、通常のデバイスチェックに引き続き従います。Serve トラフィックであっても明示的な共有シークレット認証情報を要求したい場合は、`gateway.auth.allowTailscale: false` を設定します。その後、`gateway.auth.mode: "token"` または `"password"` を使用します。

    その非同期 Serve ID パスでは、同じクライアント IP と認証スコープに対する認証失敗は、レート制限書き込みの前に直列化されます。そのため、同じブラウザーから同時に不正な再試行があると、2 つの単純な不一致が並行して競合する代わりに、2 番目のリクエストで `retry later` が表示されることがあります。

    <Warning>
    トークンなしの Serve 認証は、ゲートウェイホストが信頼されていることを前提とします。そのホスト上で信頼できないローカルコードが実行される可能性がある場合は、トークン/パスワード認証を要求してください。
    </Warning>

  </Tab>
  <Tab title="tailnet へバインド + トークン">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    次に開く:

    - `http://<tailscale-ip>:18789/`（または設定済みの `gateway.controlUi.basePath`）

    一致する共有シークレットを UI 設定に貼り付けます（`connect.params.auth.token` または `connect.params.auth.password` として送信されます）。

  </Tab>
</Tabs>

## 安全でない HTTP

プレーン HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、ブラウザーは **非セキュアコンテキスト** で実行され、WebCrypto をブロックします。デフォルトでは、OpenClaw はデバイス ID のない Control UI 接続を **ブロック** します。

文書化された例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost のみの安全でない HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` によるオペレーター Control UI 認証の成功
- 緊急用 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS (Tailscale Serve) を使用するか、UI をローカルで開きます。

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway ホスト上)

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

    - 非セキュアな HTTP コンテキストで、localhost の Control UI セッションがデバイス ID なしで続行できるようにします。
    - ペアリングチェックをバイパスしません。
    - リモート (非 localhost) のデバイス ID 要件を緩和しません。

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
    `dangerouslyDisableDeviceAuth` は Control UI のデバイス ID チェックを無効化するため、重大なセキュリティ低下です。緊急使用後は速やかに元に戻してください。
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy の注記">
    - trusted-proxy 認証に成功すると、デバイス ID なしで **オペレーター** Control UI セッションを許可できます。
    - これはノードロールの Control UI セッションには拡張されません。
    - 同一ホストのループバックリバースプロキシでも trusted-proxy 認証を満たしません。詳しくは [Trusted proxy auth](/ja-JP/gateway/trusted-proxy-auth) を参照してください。

  </Accordion>
</AccordionGroup>

HTTPS セットアップのガイダンスについては [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## コンテンツセキュリティポリシー

Control UI には厳格な `img-src` ポリシーが組み込まれています。許可されるのは **same-origin** アセット、`data:` URL、ローカル生成の `blob:` URL のみです。リモートの `http(s)` およびプロトコル相対の画像 URL はブラウザーによって拒否され、ネットワークフェッチは発行されません。

実際には次のような意味です。

- 相対パス配下で提供されるアバターと画像 (たとえば `/avatars/<id>`) は、UI がフェッチしてローカルの `blob:` URL に変換する認証済みアバタールートも含め、引き続きレンダリングされます。
- インラインの `data:image/...` URL は引き続きレンダリングされます (プロトコル内ペイロードに便利です)。
- Control UI によって作成されたローカルの `blob:` URL は引き続きレンダリングされます。
- チャンネルメタデータから出力されたリモートアバター URL は、Control UI のアバターヘルパーで除去され、組み込みのロゴ/バッジに置き換えられます。そのため、侵害された、または悪意のあるチャンネルが、オペレーターのブラウザーから任意のリモート画像フェッチを強制することはできません。

この動作を得るために変更は不要です。常に有効であり、設定できません。

## アバタールート認証

gateway 認証が設定されている場合、Control UI のアバターエンドポイントには API の他の部分と同じ gateway トークンが必要です。

- `GET /avatar/<agentId>` は、認証済みの呼び出し元にのみアバター画像を返します。`GET /avatar/<agentId>?meta=1` は、同じルールの下でアバターメタデータを返します。
- どちらのルートに対する未認証リクエストも拒否されます (隣接する assistant-media ルートと同様)。これにより、他の部分が保護されているホストで、アバタールートからエージェント ID が漏れることを防ぎます。
- Control UI 自体はアバターをフェッチするときに gateway トークンを bearer ヘッダーとして転送し、認証済み blob URL を使用するため、ダッシュボード内でも画像は引き続きレンダリングされます。

gateway 認証を無効にした場合 (共有ホストでは推奨されません)、gateway の他の部分と同様に、アバタールートも未認証になります。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを提供します。次のコマンドでビルドします。

```bash
pnpm ui:build
```

任意の絶対ベース (固定アセット URL が必要な場合):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

ローカル開発用 (別の開発サーバー):

```bash
pnpm ui:dev
```

その後、UI に Gateway WS URL (例: `ws://127.0.0.1:18789`) を指定します。

## デバッグ/テスト: 開発サーバー + リモート Gateway

Control UI は静的ファイルです。WebSocket ターゲットは設定可能で、HTTP オリジンとは異なるものにできます。これは、Vite 開発サーバーをローカルで使いながら Gateway を別の場所で実行したい場合に便利です。

<Steps>
  <Step title="UI 開発サーバーを起動する">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="gatewayUrl 付きで開く">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    任意の一回限りの認証 (必要な場合):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="注記">
    - `gatewayUrl` は読み込み後に localStorage に保存され、URL から削除されます。
    - 完全な `ws://` または `wss://` エンドポイントを `gatewayUrl` 経由で渡す場合は、ブラウザーがクエリ文字列を正しく解析できるように `gatewayUrl` の値を URL エンコードしてください。
    - `token` は可能な限り URL フラグメント (`#token=...`) 経由で渡してください。フラグメントはサーバーへ送信されないため、リクエストログや Referer への漏えいを避けられます。従来の `?token=` クエリパラメーターも互換性のため一度だけ取り込まれますが、フォールバックとしてのみ使用され、ブートストラップ直後に削除されます。
    - `password` はメモリ内にのみ保持されます。
    - `gatewayUrl` が設定されている場合、UI は設定や環境の認証情報へフォールバックしません。`token` (または `password`) を明示的に指定してください。明示的な認証情報がない場合はエラーです。
    - Gateway が TLS (Tailscale Serve、HTTPS プロキシなど) の背後にある場合は `wss://` を使用してください。
    - `gatewayUrl` はクリックジャッキングを防ぐため、トップレベルウィンドウでのみ受け付けられます (埋め込みでは不可)。
    - 非ループバックの Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を明示的に設定する必要があります (完全なオリジン)。これにはリモート開発セットアップも含まれます。
    - Gateway の起動時に、有効なランタイムのバインドとポートから `http://localhost:<port>` や `http://127.0.0.1:<port>` などのローカルオリジンがシードされることがありますが、リモートブラウザーのオリジンには引き続き明示的なエントリが必要です。
    - 厳密に管理されたローカルテストを除き、`gateway.controlUi.allowedOrigins: ["*"]` は使用しないでください。これは任意のブラウザーオリジンを許可するという意味であり、「現在使用しているホストに一致させる」という意味ではありません。
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

- [Dashboard](/ja-JP/web/dashboard) — gateway ダッシュボード
- [Health Checks](/ja-JP/gateway/health) — gateway ヘルス監視
- [TUI](/ja-JP/web/tui) — ターミナルユーザーインターフェイス
- [WebChat](/ja-JP/web/webchat) — ブラウザーベースのチャットインターフェイス
