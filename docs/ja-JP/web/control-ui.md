---
read_when:
    - ブラウザーから Gateway を操作したい場合
    - SSH トンネルを使わずに Tailnet アクセスを利用したい
sidebarTitle: Control UI
summary: Gateway 用のブラウザベースの制御 UI（チャット、ノード、設定）
title: コントロール UI
x-i18n:
    generated_at: "2026-05-05T06:17:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: d249559d26ef8d257a14b104a797442e9fbb67a8ab31c7fcc9eaa4127f29c933
    source_path: web/control-ui.md
    workflow: 16
---

Control UI は、Gateway によって提供される小さな **Vite + Lit** シングルページアプリです。

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します (例: `/openclaw`)

同じポート上の **Gateway WebSocket** と直接通信します。

## クイックオープン (ローカル)

Gateway が同じコンピューターで実行されている場合は、次を開きます。

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (または [http://localhost:18789/](http://localhost:18789/))

ページの読み込みに失敗する場合は、先に Gateway を起動します: `openclaw gateway`。

認証は WebSocket ハンドシェイク中に次を通じて提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合の Tailscale Serve ID ヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合の信頼済みプロキシ ID ヘッダー

ダッシュボード設定パネルは、現在のブラウザータブセッションと選択された Gateway URL 用のトークンを保持します。パスワードは永続化されません。オンボーディングは通常、初回接続時に共有シークレット認証用の Gateway トークンを生成しますが、`gateway.auth.mode` が `"password"` の場合はパスワード認証も機能します。

## デバイスペアリング (初回接続)

新しいブラウザーまたはデバイスから Control UI に接続すると、Gateway は通常、**1 回限りのペアリング承認**を要求します。これは不正アクセスを防ぐためのセキュリティ対策です。

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

ブラウザーがすでにペアリング済みで、読み取りアクセスから書き込み/管理者アクセスへ変更した場合、これはサイレントな再接続ではなく承認アップグレードとして扱われます。OpenClaw は古い承認を有効なまま維持し、より広い権限での再接続をブロックし、新しいスコープセットを明示的に承認するよう求めます。

承認されると、そのデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り、再承認は不要です。トークンのローテーションと取り消しについては [デバイス CLI](/ja-JP/cli/devices) を参照してください。

<Note>
- 直接の local loopback ブラウザー接続 (`127.0.0.1` / `localhost`) は自動承認されます。
- `gateway.auth.allowTailscale: true` で、Tailscale ID が検証され、ブラウザーがデバイス ID を提示する場合、Tailscale Serve は Control UI オペレーターセッションのペアリング往復をスキップできます。
- 直接の Tailnet バインド、LAN ブラウザー接続、デバイス ID のないブラウザープロファイルでは、引き続き明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイス ID を生成するため、ブラウザーを切り替えたりブラウザーデータを消去したりすると、再ペアリングが必要になります。

</Note>

## 個人 ID (ブラウザーローカル)

Control UI は、共有セッションでの帰属表示のために送信メッセージへ付与される、ブラウザーごとの個人 ID (表示名とアバター) をサポートしています。これはブラウザーストレージ内にあり、現在のブラウザープロファイルにスコープされ、他のデバイスには同期されず、実際に送信したメッセージ上の通常のトランスクリプト作成者メタデータを超えてサーバー側に永続化されることもありません。サイトデータを消去したりブラウザーを切り替えたりすると、空にリセットされます。

同じブラウザーローカルのパターンは、アシスタントアバターの上書きにも適用されます。アップロードされたアシスタントアバターは、ローカルブラウザー上でのみ Gateway が解決した ID に重ねられ、`config.patch` 経由で往復することはありません。共有の `ui.assistant.avatar` 設定フィールドは、スクリプト化された Gateway やカスタムダッシュボードなど、フィールドへ直接書き込む非 UI クライアント向けに引き続き利用できます。

## ランタイム設定エンドポイント

Control UI は `/__openclaw/control-ui-config.json` からランタイム設定を取得します。このエンドポイントは、HTTP サーフェスの他の部分と同じ Gateway 認証で保護されています。未認証のブラウザーは取得できず、取得に成功するには、すでに有効な Gateway トークン/パスワード、Tailscale Serve ID、または信頼済みプロキシ ID のいずれかが必要です。

## 言語サポート

Control UI は、初回読み込み時にブラウザーロケールに基づいてローカライズできます。後で上書きするには、**概要 -> Gateway アクセス -> 言語** を開きます。ロケールピッカーは外観の下ではなく、Gateway アクセスカード内にあります。

- サポートされるロケール: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 英語以外の翻訳はブラウザー内で遅延読み込みされます。
- 選択されたロケールはブラウザーストレージに保存され、以後の訪問で再利用されます。
- 不足している翻訳キーは英語にフォールバックします。

ドキュメント翻訳は同じ英語以外のロケールセット向けに生成されますが、ドキュメントサイトに組み込まれている Mintlify 言語ピッカーは、Mintlify が受け入れるロケールコードに制限されています。タイ語 (`th`) とペルシア語 (`fa`) のドキュメントは公開リポジトリ内に引き続き生成されますが、Mintlify がこれらのコードをサポートするまで、そのピッカーには表示されない場合があります。

## 外観テーマ

外観パネルは、組み込みの Claw、Knot、Dash テーマに加え、ブラウザーローカルの tweakcn インポートスロットを 1 つ保持します。テーマをインポートするには、[tweakcn エディター](https://tweakcn.com/editor/theme)を開き、テーマを選択または作成し、**共有**をクリックして、コピーしたテーマリンクを外観に貼り付けます。インポーターは `https://tweakcn.com/r/themes/<id>` レジストリ URL、`https://tweakcn.com/editor/theme?theme=amethyst-haze` のようなエディター URL、相対 `/themes/<id>` パス、生のテーマ ID、`amethyst-haze` などのデフォルトテーマ名も受け入れます。

インポートされたテーマは、現在のブラウザープロファイルにのみ保存されます。Gateway 設定には書き込まれず、デバイス間で同期されません。インポートされたテーマを置き換えると、その 1 つのローカルスロットが更新されます。クリアすると、インポートされたテーマが選択されていた場合は、アクティブなテーマが Claw に戻ります。

## できること (現在)

<AccordionGroup>
  <Accordion title="チャットと会話">
    - Gateway WS 経由でモデルとチャットします (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)。
    - ブラウザーのリアルタイムセッションを通じて会話します。OpenAI は直接 WebRTC を使用し、Google Live は WebSocket 上の制約付き 1 回限りのブラウザートークンを使用し、バックエンド専用のリアルタイム音声 Plugin は Gateway リレートランスポートを使用します。リレーはプロバイダー資格情報を Gateway 上に保持し、ブラウザーは `talk.realtime.relay*` RPC を通じてマイク PCM をストリーミングし、より大きな設定済み OpenClaw モデル向けに `openclaw_agent_consult` ツール呼び出しを `chat.send` 経由で送り返します。
    - チャットでツール呼び出しとライブツール出力カードをストリーミングします (エージェントイベント)。

  </Accordion>
  <Accordion title="チャネル、インスタンス、セッション、夢">
    - チャネル: 組み込みおよびバンドル/外部 Plugin チャネルのステータス、QR ログイン、チャネルごとの設定 (`channels.status`, `web.login.*`, `config.patch`)。
    - インスタンス: プレゼンス一覧と更新 (`system-presence`)。
    - セッション: 一覧とセッションごとのモデル/思考/高速/詳細/トレース/推論の上書き (`sessions.list`, `sessions.patch`)。
    - 夢: Dreaming ステータス、有効/無効トグル、Dream Diary リーダー (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)。

  </Accordion>
  <Accordion title="Cron、Skills、ノード、exec 承認">
    - Cron ジョブ: 一覧/追加/編集/実行/有効化/無効化と実行履歴 (`cron.*`)。
    - Skills: ステータス、有効化/無効化、インストール、API キー更新 (`skills.*`)。
    - ノード: 一覧と機能 (`node.list`)。
    - exec 承認: Gateway またはノードの許可リストと `exec host=gateway/node` の確認ポリシーを編集します (`exec.approvals.*`)。

  </Accordion>
  <Accordion title="設定">
    - `~/.openclaw/openclaw.json` を表示/編集します (`config.get`, `config.set`)。
    - 検証付きで適用して再起動し (`config.apply`)、最後のアクティブセッションを起動します。
    - 書き込みには、同時編集の上書きを防ぐためのベースハッシュガードが含まれます。
    - 書き込み (`config.set`/`config.apply`/`config.patch`) は、送信された設定ペイロード内の参照に対して、アクティブな SecretRef 解決を事前確認します。未解決のアクティブな送信参照は書き込み前に拒否されます。
    - スキーマとフォームレンダリング (`config.schema` / `config.schema.lookup`、フィールド `title` / `description`、一致した UI ヒント、直下の子要素サマリー、ネストされたオブジェクト/ワイルドカード/配列/合成ノード上のドキュメントメタデータ、利用可能な場合は Plugin とチャネルのスキーマを含む)。Raw JSON エディターは、スナップショットが安全な raw 往復を持つ場合にのみ利用できます。
    - スナップショットが raw テキストを安全に往復できない場合、Control UI はフォームモードを強制し、そのスナップショットの Raw モードを無効にします。
    - Raw JSON エディターの「保存済みにリセット」は、フラット化されたスナップショットを再レンダリングするのではなく、raw で作成された形状 (フォーマット、コメント、`$include` レイアウト) を保持するため、スナップショットが安全に往復できる場合は外部編集がリセット後も残ります。
    - 構造化された SecretRef オブジェクト値は、意図しないオブジェクトから文字列への破損を防ぐため、フォームのテキスト入力では読み取り専用としてレンダリングされます。

  </Accordion>
  <Accordion title="デバッグ、ログ、更新">
    - デバッグ: ステータス/ヘルス/モデルのスナップショット、イベントログ、手動 RPC 呼び出し (`status`, `health`, `models.list`)。
    - イベントログには、Control UI の更新/RPC タイミングに加え、ブラウザーがそれらの PerformanceObserver エントリタイプを公開している場合は長いアニメーションフレームまたは長いタスクのブラウザー応答性エントリが含まれます。
    - ログ: フィルター/エクスポート付きの Gateway ファイルログのライブ tail (`logs.tail`)。
    - 更新: パッケージ/git 更新と再起動を実行し (`update.run`)、再起動レポートを取得した後、再接続後に `update.status` をポーリングして実行中の Gateway バージョンを確認します。

  </Accordion>
  <Accordion title="Cron ジョブパネルの注記">
    - 分離ジョブでは、配信のデフォルトはサマリー通知です。内部専用の実行にしたい場合は、なしに切り替えられます。
    - 通知が選択されている場合、チャネル/ターゲットフィールドが表示されます。
    - Webhook モードは `delivery.mode = "webhook"` を使用し、`delivery.to` は有効な HTTP(S) Webhook URL に設定します。
    - メインセッションジョブでは、Webhook となしの配信モードを利用できます。
    - 高度な編集コントロールには、実行後削除、エージェント上書きのクリア、cron exact/stagger オプション、エージェントモデル/思考の上書き、ベストエフォート配信トグルが含まれます。
    - フォーム検証はフィールドレベルのエラーとともにインラインで表示されます。無効な値がある場合、修正されるまで保存ボタンは無効になります。
    - 専用の bearer トークンを送信するには `cron.webhookToken` を設定します。省略した場合、Webhook は認証ヘッダーなしで送信されます。
    - 非推奨のフォールバック: `notify: true` を持つ保存済みのレガシージョブは、移行されるまで `cron.webhook` を引き続き使用できます。

  </Accordion>
</AccordionGroup>

## チャットの動作

<AccordionGroup>
  <Accordion title="送信と履歴のセマンティクス">
    - `chat.send` は**非ブロッキング**です。`{ runId, status: "started" }` ですぐに ack し、応答は `chat` イベント経由でストリーミングされます。
    - チャットのアップロードは画像と動画以外のファイルを受け付けます。画像はネイティブの画像パスを保持し、それ以外のファイルは管理対象メディアとして保存され、履歴では添付リンクとして表示されます。
    - 同じ `idempotencyKey` で再送信すると、実行中は `{ status: "in_flight" }` が返り、完了後は `{ status: "ok" }` が返ります。
    - `chat.history` の応答は UI の安全性のためサイズ制限されています。トランスクリプトのエントリが大きすぎる場合、Gateway は長いテキストフィールドを切り詰め、重いメタデータブロックを省略し、サイズ超過メッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えることがあります。
    - アシスタントまたは生成された画像は管理対象メディア参照として永続化され、認証済み Gateway メディア URL 経由で返されるため、リロードは生の base64 画像ペイロードがチャット履歴応答に残っていることに依存しません。
    - `chat.history` のレンダリング時、Control UI は表示専用のインラインディレクティブタグ（例: `[[reply_to_*]]` と `[[audio_as_voice]]`）、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、切り詰められたツール呼び出しブロックを含む）、漏出した ASCII/全角のモデル制御トークンを、表示されるアシスタントテキストから取り除き、表示テキスト全体が正確なサイレントトークン `NO_REPLY` / `no_reply` または Heartbeat 確認トークン `HEARTBEAT_OK` だけのアシスタントエントリを省略します。
    - アクティブな送信中と最後の履歴更新中に `chat.history` が一時的に古いスナップショットを返しても、チャットビューはローカルの楽観的なユーザー/アシスタントメッセージを表示し続けます。Gateway 履歴が追いつくと、正規のトランスクリプトがそれらのローカルメッセージを置き換えます。
    - ライブの `chat` イベントは配信状態であり、`chat.history` は永続的なセッショントランスクリプトから再構築されます。ツール最終イベントの後、Control UI は履歴を再読み込みし、小さな楽観的テールだけをマージします。トランスクリプト境界は [WebChat](/ja-JP/web/webchat) に記載されています。
    - `chat.inject` はアシスタントノートをセッショントランスクリプトに追加し、UI 専用更新のために `chat` イベントをブロードキャストします（エージェント実行なし、チャネル配信なし）。
    - チャットヘッダーでは、セッションピッカーの前にエージェントフィルターが表示され、セッションピッカーは選択されたエージェントにスコープされます。エージェントを切り替えると、そのエージェントに紐づくセッションだけが表示され、保存済みのダッシュボードセッションがまだない場合は、そのエージェントのメインセッションにフォールバックします。
    - デスクトップ幅では、チャットコントロールはコンパクトな 1 行に収まり、トランスクリプトを下にスクロールすると折りたたまれます。上にスクロールする、先頭に戻る、または末尾に到達すると、コントロールが復元されます。
    - 連続する重複したテキストのみのメッセージは、件数バッジ付きの 1 つのバブルとしてレンダリングされます。画像、添付ファイル、ツール出力、canvas プレビューを含むメッセージは折りたたまれません。
    - チャットヘッダーのモデルピッカーと思考ピッカーは、`sessions.patch` 経由でアクティブセッションに即時パッチを適用します。これらは永続的なセッションオーバーライドであり、1 ターン限りの送信オプションではありません。
    - Control UI で `/new` と入力すると、New Chat と同じ新しいダッシュボードセッションを作成して切り替えます。`/reset` と入力すると、現在のセッションに対する Gateway の明示的なインプレースリセットを維持します。
    - チャットモデルピッカーは、Gateway に設定済みモデルビューを要求します。`agents.defaults.models` が存在する場合、その許可リストがピッカーを駆動します。それ以外の場合、ピッカーは明示的な `models.providers.*.models` エントリと、使用可能な認証を持つプロバイダーを表示します。完全なカタログは、`view: "all"` を指定したデバッグ用 `models.list` RPC 経由で引き続き利用できます。
    - 新しい Gateway セッション使用状況レポートが高いコンテキスト圧力を示す場合、チャットコンポーザー領域にはコンテキスト通知が表示され、推奨 Compaction レベルでは通常のセッション Compaction パスを実行するコンパクトなボタンが表示されます。古いトークンスナップショットは、Gateway が再び新しい使用状況を報告するまで非表示になります。

  </Accordion>
  <Accordion title="トークモード（ブラウザーリアルタイム）">
    トークモードは登録済みのリアルタイム音声プロバイダーを使用します。OpenAI は `talk.provider: "openai"` と `talk.providers.openai.apiKey` で設定し、Google は `talk.provider: "google"` と `talk.providers.google.apiKey` で設定します。Voice Call のリアルタイムプロバイダー設定は、フォールバックとして引き続き再利用できます。ブラウザーが標準プロバイダー API キーを受け取ることはありません。OpenAI は WebRTC 用の一時的な Realtime クライアントシークレットを受け取ります。Google Live は、ブラウザー WebSocket セッション用の使い捨て制約付き Live API 認証トークンを受け取り、そのトークン内には Gateway によって命令とツール宣言が固定されます。バックエンドリアルタイムブリッジだけを公開するプロバイダーは、Gateway リレートランスポートを経由して実行されるため、認証情報とベンダーソケットはサーバー側に留まり、ブラウザー音声は認証済み Gateway RPC を通じて移動します。Realtime セッションプロンプトは Gateway によって組み立てられます。`talk.realtime.session` は呼び出し元提供の命令オーバーライドを受け付けません。

    Chat コンポーザーでは、Talk コントロールはマイク音声入力ボタンの隣にある波形ボタンです。Talk が開始されると、コンポーザーステータス行には、音声が接続されるまで `Connecting Talk...` が表示され、その後 `Talk live` が表示されます。または、リアルタイムツール呼び出しが `chat.send` 経由で設定済みのより大きなモデルに問い合わせている間は `Asking OpenClaw...` が表示されます。

    メンテナー向けライブスモーク: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` は、OpenAI ブラウザー WebRTC SDP 交換、Google Live 制約付きトークンのブラウザー WebSocket セットアップ、およびフェイクマイクメディアを使った Gateway リレーブラウザーアダプターを検証します。このコマンドはプロバイダー状態だけを出力し、シークレットはログに記録しません。

  </Accordion>
  <Accordion title="停止と中止">
    - **Stop** をクリックします（`chat.abort` を呼び出します）。
    - 実行がアクティブな間、通常のフォローアップはキューに入ります。キュー内のメッセージで **Steer** をクリックすると、そのフォローアップを実行中のターンに注入します。
    - `/stop`（または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` のような単独の中止フレーズ）を入力して、帯域外で中止します。
    - `chat.abort` は、そのセッションのすべてのアクティブな実行を中止するために `{ sessionKey }`（`runId` なし）をサポートします。

  </Accordion>
  <Accordion title="中止時の部分保持">
    - 実行が中止された場合でも、部分的なアシスタントテキストを UI に表示できます。
    - Gateway は、バッファーされた出力が存在する場合、中止された部分的なアシスタントテキストをトランスクリプト履歴に永続化します。
    - 永続化されたエントリには中止メタデータが含まれるため、トランスクリプトの利用側は中止時の部分出力と通常の完了出力を区別できます。

  </Accordion>
</AccordionGroup>

## PWA インストールと Web プッシュ

Control UI には `manifest.webmanifest` とサービスワーカーが同梱されているため、モダンブラウザーではスタンドアロン PWA としてインストールできます。Web Push により、タブやブラウザーウィンドウが開いていなくても、Gateway は通知でインストール済み PWA を起動できます。

| サーフェス                                            | 機能                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA マニフェスト。到達可能になると、ブラウザーは「アプリをインストール」を提示します。 |
| `ui/public/sw.js`                                     | `push` イベントと通知クリックを処理するサービスワーカー。 |
| `push/vapid-keys.json`（OpenClaw 状態ディレクトリ配下） | Web Push ペイロードの署名に使う、自動生成された VAPID キーペア。 |
| `push/web-push-subscriptions.json`                    | 永続化されたブラウザー購読エンドポイント。                          |

キーを固定したい場合（マルチホストデプロイ、シークレットローテーション、テストなど）は、Gateway プロセス上の環境変数で VAPID キーペアをオーバーライドします。

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（デフォルトは `mailto:openclaw@localhost`）

Control UI は、ブラウザー購読の登録とテストに、これらのスコープ制限付き Gateway メソッドを使用します。

- `push.web.vapidPublicKey` — アクティブな VAPID 公開鍵を取得します。
- `push.web.subscribe` — `endpoint` と `keys.p256dh`/`keys.auth` を登録します。
- `push.web.unsubscribe` — 登録済みエンドポイントを削除します。
- `push.web.test` — 呼び出し元の購読にテスト通知を送信します。

<Note>
Web Push は iOS APNS リレーパス（リレーに支えられたプッシュについては [Configuration](/ja-JP/gateway/configuration) を参照）および既存の `push.test` メソッドとは独立しており、これらはネイティブモバイルペアリングを対象にしています。
</Note>

## ホスト型埋め込み

アシスタントメッセージは、`[embed ...]` ショートコードを使ってホストされた Web コンテンツをインラインでレンダリングできます。iframe サンドボックスポリシーは `gateway.controlUi.embedSandbox` で制御されます。

<Tabs>
  <Tab title="strict">
    ホスト型埋め込み内でのスクリプト実行を無効にします。
  </Tab>
  <Tab title="scripts（デフォルト）">
    オリジン分離を維持しながらインタラクティブな埋め込みを許可します。これはデフォルトであり、通常は自己完結型のブラウザーゲーム/ウィジェットに十分です。
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
埋め込まれたドキュメントが本当に同一オリジン動作を必要とする場合にだけ `trusted` を使用してください。ほとんどのエージェント生成ゲームやインタラクティブ canvas では、`scripts` のほうが安全な選択です。
</Warning>

絶対外部 `http(s)` 埋め込み URL は、デフォルトではブロックされたままです。意図的に `[embed url="https://..."]` でサードパーティページを読み込みたい場合は、`gateway.controlUi.allowExternalEmbedUrls: true` を設定します。

## チャットメッセージ幅

グループ化されたチャットメッセージは、読みやすいデフォルトの最大幅を使用します。ワイドモニターのデプロイでは、`gateway.controlUi.chatMessageMaxWidth` を設定することで、同梱 CSS にパッチを当てずに上書きできます。

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

## tailnet アクセス（推奨）

<Tabs>
  <Tab title="統合 Tailscale Serve（推奨）">
    Gateway をループバック上に保ち、Tailscale Serve に HTTPS でプロキシさせます。

    ```bash
    openclaw gateway --tailscale serve
    ```

    開く:

    - `https://<magicdns>/`（または設定済みの `gateway.controlUi.basePath`）

    デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket Serve リクエストは Tailscale ID ヘッダー（`tailscale-user-login`）で認証できます。OpenClaw は `x-forwarded-for` アドレスを `tailscale whois` で解決してヘッダーと照合することで ID を検証し、リクエストが Tailscale の `x-forwarded-*` ヘッダー付きでループバックに到達した場合にだけこれらを受け入れます。ブラウザーデバイス ID を持つ Control UI オペレーターセッションでは、この検証済み Serve パスによりデバイスペアリングの往復もスキップされます。デバイスなしブラウザーとノードロール接続は、通常のデバイスチェックに従います。Serve トラフィックでも明示的な共有シークレット認証情報を要求したい場合は、`gateway.auth.allowTailscale: false` を設定します。そのうえで `gateway.auth.mode: "token"` または `"password"` を使用します。

    その非同期 Serve ID パスでは、同じクライアント IP と認証スコープに対する認証失敗は、レート制限の書き込み前に直列化されます。そのため、同じブラウザーからの並行した不正な再試行では、2 つの単純な不一致が並列で競合する代わりに、2 番目のリクエストで `retry later` が表示されることがあります。

    <Warning>
    トークンなしの Serve 認証は、ゲートウェイホストが信頼されていることを前提とします。そのホスト上で信頼できないローカルコードが実行される可能性がある場合は、トークン/パスワード認証を必須にしてください。
    </Warning>

  </Tab>
  <Tab title="tailnet へのバインド + トークン">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    その後、開きます。

    - `http://<tailscale-ip>:18789/`（または設定済みの `gateway.controlUi.basePath`）

    一致する共有シークレットを UI 設定に貼り付けます（`connect.params.auth.token` または `connect.params.auth.password` として送信されます）。

  </Tab>
</Tabs>

## 安全でない HTTP

プレーン HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、ブラウザーは**非セキュアコンテキスト**で実行され、WebCrypto をブロックします。デフォルトでは、OpenClaw はデバイス ID のない Control UI 接続を**ブロック**します。

文書化されている例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost のみの安全でない HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` を通じた operator Control UI 認証の成功
- 緊急用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

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

    - 非セキュアな HTTP コンテキストで、localhost の Control UI セッションがデバイス ID なしで続行できるようにします。
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
    `dangerouslyDisableDeviceAuth` は Control UI のデバイス ID チェックを無効化し、重大なセキュリティ低下を招きます。緊急使用後は速やかに元に戻してください。
    </Warning>

  </Accordion>
  <Accordion title="trusted-proxy の注記">
    - trusted-proxy 認証に成功すると、デバイス ID なしで **operator** Control UI セッションを許可できます。
    - これは node-role Control UI セッションには拡張されません。
    - 同一ホストの loopback リバースプロキシは、それでも trusted-proxy 認証を満たしません。[trusted proxy 認証](/ja-JP/gateway/trusted-proxy-auth)を参照してください。

  </Accordion>
</AccordionGroup>

HTTPS セットアップのガイダンスについては [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## コンテンツセキュリティポリシー

Control UI には厳格な `img-src` ポリシーが付属しています。許可されるのは、**same-origin** アセット、`data:` URL、ローカルで生成された `blob:` URL のみです。リモートの `http(s)` およびプロトコル相対の画像 URL はブラウザーにより拒否され、ネットワークフェッチは発行されません。

実際には、これは次のことを意味します。

- 相対パス配下（例: `/avatars/<id>`）で提供されるアバターと画像は、UI が取得してローカル `blob:` URL に変換する認証付きアバタールートを含め、引き続きレンダリングされます。
- インラインの `data:image/...` URL は引き続きレンダリングされます（プロトコル内ペイロードに便利です）。
- Control UI によって作成されたローカル `blob:` URL は引き続きレンダリングされます。
- チャネルメタデータによって出力されたリモートアバター URL は、Control UI のアバターヘルパーで取り除かれ、組み込みのロゴ/バッジに置き換えられます。そのため、侵害された、または悪意のあるチャネルが operator ブラウザーから任意のリモート画像フェッチを強制することはできません。

この動作を得るために何かを変更する必要はありません。常に有効で、設定できません。

## アバタールート認証

gateway 認証が設定されている場合、Control UI アバターエンドポイントには API の他の部分と同じ gateway トークンが必要です。

- `GET /avatar/<agentId>` は認証済みの呼び出し元にのみアバター画像を返します。`GET /avatar/<agentId>?meta=1` は同じルールの下でアバターメタデータを返します。
- どちらのルートへの未認証リクエストも拒否されます（隣接する assistant-media ルートと同様）。これにより、それ以外は保護されているホストで、アバタールートから agent ID が漏えいするのを防ぎます。
- Control UI 自体はアバター取得時に gateway トークンを bearer ヘッダーとして転送し、認証済み blob URL を使用するため、画像はダッシュボードで引き続きレンダリングされます。

gateway 認証を無効化した場合（共有ホストでは推奨されません）、gateway の他の部分と同様に、アバタールートも未認証になります。

## アシスタントメディアルート認証

gateway 認証が設定されている場合、アシスタントのローカルメディアプレビューは 2 段階のルートを使用します。

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` には通常の Control UI operator 認証が必要です。ブラウザーは利用可否の確認時に gateway トークンを bearer ヘッダーとして送信します。
- 成功したメタデータレスポンスには、その正確なソースパスにスコープされた短命の `mediaTicket` が含まれます。
- ブラウザーでレンダリングされる画像、音声、動画、ドキュメント URL は、アクティブな gateway トークンやパスワードの代わりに `mediaTicket=<ticket>` を使用します。チケットはすぐに期限切れになり、別のソースを認可することはできません。

これにより、再利用可能な gateway 認証情報を可視のメディア URL に含めずに、通常のメディアレンダリングをブラウザー標準のメディア要素と互換に保てます。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを提供します。次のコマンドでビルドします。

```bash
pnpm ui:build
```

任意の絶対ベース（固定アセット URL が必要な場合）:

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

ローカル開発用（別の dev サーバー）:

```bash
pnpm ui:dev
```

その後、UI に Gateway WS URL（例: `ws://127.0.0.1:18789`）を指定します。

## デバッグ/テスト: dev サーバー + リモート Gateway

Control UI は静的ファイルです。WebSocket ターゲットは設定可能で、HTTP オリジンとは異なっていてもかまいません。これは、Vite dev サーバーはローカルで使い、Gateway は別の場所で実行したい場合に便利です。

<Steps>
  <Step title="UI dev サーバーを開始する">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="gatewayUrl で開く">
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
    - `gatewayUrl` 経由で完全な `ws://` または `wss://` エンドポイントを渡す場合は、ブラウザーがクエリ文字列を正しく解析できるように `gatewayUrl` 値を URL エンコードしてください。
    - `token` は可能な限り URL フラグメント（`#token=...`）経由で渡してください。フラグメントはサーバーに送信されないため、リクエストログや Referer への漏えいを避けられます。従来の `?token=` クエリパラメーターも互換性のため 1 回だけインポートされますが、フォールバックとしてのみ扱われ、ブートストラップ直後に削除されます。
    - `password` はメモリ内にのみ保持されます。
    - `gatewayUrl` が設定されている場合、UI は設定や環境の認証情報にフォールバックしません。`token`（または `password`）を明示的に指定してください。明示的な認証情報がない場合はエラーです。
    - Gateway が TLS（Tailscale Serve、HTTPS プロキシなど）の背後にある場合は `wss://` を使用してください。
    - `gatewayUrl` はクリックジャッキングを防ぐため、トップレベルウィンドウ（埋め込みではない）でのみ受け入れられます。
    - 非 loopback の Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を明示的に設定する必要があります（完全なオリジン）。これにはリモート dev セットアップも含まれます。
    - Gateway 起動時に、有効なランタイム bind と port から `http://localhost:<port>` や `http://127.0.0.1:<port>` のようなローカルオリジンがシードされる場合がありますが、リモートブラウザーのオリジンには引き続き明示的なエントリが必要です。
    - 厳密に管理されたローカルテストを除き、`gateway.controlUi.allowedOrigins: ["*"]` は使用しないでください。これは「使用中のホストに合わせる」ではなく、任意のブラウザーオリジンを許可することを意味します。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は Host-header origin フォールバックモードを有効にしますが、危険なセキュリティモードです。

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

リモートアクセスセットアップの詳細: [リモートアクセス](/ja-JP/gateway/remote)。

## 関連

- [ダッシュボード](/ja-JP/web/dashboard) — gateway ダッシュボード
- [ヘルスチェック](/ja-JP/gateway/health) — gateway ヘルス監視
- [TUI](/ja-JP/web/tui) — ターミナルユーザーインターフェイス
- [WebChat](/ja-JP/web/webchat) — ブラウザーベースのチャットインターフェイス
