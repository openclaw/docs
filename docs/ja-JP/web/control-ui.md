---
read_when:
    - ブラウザから Gateway を操作したい場合
    - SSHトンネルなしでTailnetアクセスを使いたい
sidebarTitle: Control UI
summary: Gateway 用のブラウザベースのコントロール UI（チャット、ノード、設定）
title: コントロール UI
x-i18n:
    generated_at: "2026-05-03T05:04:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 88959ccf435b31015039bf28c3043023d99f0b953a1489986ab2d0cbd261771c
    source_path: web/control-ui.md
    workflow: 16
---

Control UI は、Gateway から配信される小さな **Vite + Lit** シングルページアプリです。

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します (例: `/openclaw`)

これは、同じポート上の **Gateway WebSocket** と直接通信します。

## すばやく開く (ローカル)

Gateway が同じコンピューター上で実行されている場合は、次を開きます。

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (または [http://localhost:18789/](http://localhost:18789/))

ページの読み込みに失敗する場合は、まず Gateway を起動します: `openclaw gateway`。

認証は、WebSocket ハンドシェイク中に次の方法で提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合の Tailscale Serve ID ヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合の信頼済みプロキシ ID ヘッダー

ダッシュボード設定パネルは、現在のブラウザータブセッションと選択された Gateway URL のトークンを保持します。パスワードは永続化されません。オンボーディングでは通常、初回接続時に共有シークレット認証用の Gateway トークンが生成されますが、`gateway.auth.mode` が `"password"` の場合はパスワード認証も機能します。

## デバイスのペアリング (初回接続)

新しいブラウザーやデバイスから Control UI に接続すると、通常 Gateway は **1 回限りのペアリング承認**を要求します。これは不正アクセスを防ぐためのセキュリティ対策です。

**表示される内容:** 「切断されました (1008): ペアリングが必要です」

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

ブラウザーが変更された認証詳細 (ロール/スコープ/公開鍵) でペアリングを再試行すると、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認する前に `openclaw devices list` を再実行してください。

ブラウザーがすでにペアリング済みで、読み取りアクセスから書き込み/管理者アクセスに変更した場合、これは暗黙の再接続ではなく承認アップグレードとして扱われます。OpenClaw は古い承認を有効なまま維持し、より広い権限での再接続をブロックして、新しいスコープセットを明示的に承認するよう求めます。

承認されるとデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り、再承認は不要です。トークンローテーションと取り消しについては [デバイス CLI](/ja-JP/cli/devices) を参照してください。

<Note>
- 直接の local loopback ブラウザー接続 (`127.0.0.1` / `localhost`) は自動承認されます。
- `gateway.auth.allowTailscale: true` で、Tailscale ID が検証され、ブラウザーがデバイス ID を提示する場合、Tailscale Serve は Control UI オペレーターセッションのペアリング往復をスキップできます。
- 直接の Tailnet バインド、LAN ブラウザー接続、デバイス ID のないブラウザープロファイルでは、引き続き明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイス ID を生成するため、ブラウザーを切り替えたりブラウザーデータを消去したりすると、再ペアリングが必要になります。

</Note>

## 個人 ID (ブラウザーローカル)

Control UI は、共有セッションでの帰属表示のために、送信メッセージに添付されるブラウザーごとの個人 ID (表示名とアバター) をサポートします。これはブラウザーストレージに保存され、現在のブラウザープロファイルにスコープされます。他のデバイスには同期されず、実際に送信したメッセージ上の通常のトランスクリプト著者メタデータを超えてサーバー側に永続化されることもありません。サイトデータを消去したりブラウザーを切り替えたりすると、空にリセットされます。

同じブラウザーローカルのパターンは、アシスタントアバターの上書きにも適用されます。アップロードされたアシスタントアバターは、ローカルブラウザー上でのみ Gateway が解決した ID に重ねられ、`config.patch` を通じて往復することはありません。共有の `ui.assistant.avatar` 設定フィールドは、スクリプト化された Gateway やカスタムダッシュボードなど、フィールドを直接書き込む非 UI クライアント向けに引き続き利用できます。

## ランタイム設定エンドポイント

Control UI は、ランタイム設定を `/__openclaw/control-ui-config.json` から取得します。このエンドポイントは、HTTP サーフェスの他の部分と同じ Gateway 認証で保護されています。未認証のブラウザーは取得できず、取得を成功させるには、有効な Gateway トークン/パスワード、Tailscale Serve ID、または信頼済みプロキシ ID のいずれかがすでに必要です。

## 言語サポート

Control UI は初回読み込み時に、ブラウザーのロケールに基づいて自身をローカライズできます。後で上書きするには、**概要 -> Gateway アクセス -> 言語**を開きます。ロケールピッカーは外観ではなく、Gateway アクセスカード内にあります。

- サポートされるロケール: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 英語以外の翻訳はブラウザー内で遅延読み込みされます。
- 選択したロケールはブラウザーストレージに保存され、以降の訪問で再利用されます。
- 不足している翻訳キーは英語にフォールバックします。

ドキュメント翻訳は同じ英語以外のロケールセットに対して生成されますが、ドキュメントサイト組み込みの Mintlify 言語ピッカーは、Mintlify が受け付けるロケールコードに制限されています。タイ語 (`th`) とペルシア語 (`fa`) のドキュメントは公開リポジトリ内で引き続き生成されますが、Mintlify がそれらのコードをサポートするまで、そのピッカーには表示されない場合があります。

## 外観テーマ

外観パネルには、組み込みの Claw、Knot、Dash テーマに加えて、ブラウザーローカルの tweakcn インポートスロットが 1 つあります。テーマをインポートするには、[tweakcn テーマ](https://tweakcn.com/themes) を開き、テーマを選択または作成し、**共有**をクリックして、コピーしたテーマリンクを外観に貼り付けます。インポーターは `https://tweakcn.com/r/themes/<id>` レジストリ URL、`https://tweakcn.com/editor/theme?theme=amethyst-haze` のようなエディター URL、相対 `/themes/<id>` パス、生のテーマ ID、`amethyst-haze` などのデフォルトテーマ名も受け付けます。

インポートされたテーマは、現在のブラウザープロファイルにのみ保存されます。Gateway 設定には書き込まれず、デバイス間で同期されません。インポート済みテーマを置き換えると、その 1 つのローカルスロットが更新されます。消去すると、インポート済みテーマが選択されていた場合、アクティブテーマは Claw に戻ります。

## できること (現在)

<AccordionGroup>
  <Accordion title="チャットと会話">
    - Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`) 経由でモデルとチャットします。
    - ブラウザーのリアルタイムセッションを通じて会話します。OpenAI は直接 WebRTC を使用し、Google Live は WebSocket 経由の制約付き 1 回使用ブラウザートークンを使用し、バックエンド専用リアルタイム音声 Plugin は Gateway リレートランスポートを使用します。リレーはプロバイダー資格情報を Gateway 上に保持し、ブラウザーは `talk.realtime.relay*` RPC を通じてマイク PCM をストリーミングし、より大きな設定済み OpenClaw モデル向けに `openclaw_agent_consult` ツール呼び出しを `chat.send` 経由で送り返します。
    - チャット内でツール呼び出しとライブツール出力カードをストリーミングします (エージェントイベント)。

  </Accordion>
  <Accordion title="チャンネル、インスタンス、セッション、夢">
    - チャンネル: 組み込みおよびバンドル/外部 Plugin チャンネルのステータス、QR ログイン、チャンネルごとの設定 (`channels.status`, `web.login.*`, `config.patch`)。
    - インスタンス: プレゼンス一覧と更新 (`system-presence`)。
    - セッション: 一覧とセッションごとのモデル/思考/高速/詳細/トレース/推論の上書き (`sessions.list`, `sessions.patch`)。
    - 夢: Dreaming ステータス、有効/無効トグル、Dream Diary リーダー (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)。

  </Accordion>
  <Accordion title="Cron、Skills、ノード、実行承認">
    - Cron ジョブ: 一覧/追加/編集/実行/有効化/無効化と実行履歴 (`cron.*`)。
    - Skills: ステータス、有効化/無効化、インストール、API キー更新 (`skills.*`)。
    - ノード: 一覧と機能 (`node.list`)。
    - 実行承認: `exec host=gateway/node` の Gateway またはノードの許可リストと問い合わせポリシーを編集 (`exec.approvals.*`)。

  </Accordion>
  <Accordion title="設定">
    - `~/.openclaw/openclaw.json` を表示/編集します (`config.get`, `config.set`)。
    - 検証付きで適用して再起動し (`config.apply`)、最後にアクティブだったセッションを起こします。
    - 書き込みには、同時編集の上書きを防ぐベースハッシュガードが含まれます。
    - 書き込み (`config.set`/`config.apply`/`config.patch`) は、送信された設定ペイロード内の参照について、アクティブな SecretRef 解決を事前確認します。送信された未解決のアクティブ参照は、書き込み前に拒否されます。
    - スキーマとフォームレンダリング (`config.schema` / `config.schema.lookup`。フィールド `title` / `description`、一致した UI ヒント、直下の子の要約、ネストされたオブジェクト/ワイルドカード/配列/合成ノード上のドキュメントメタデータ、利用可能な場合は Plugin とチャンネルのスキーマを含む)。生 JSON エディターは、スナップショットが安全な生の往復を持つ場合にのみ利用できます。
    - スナップショットが生テキストを安全に往復できない場合、Control UI はフォームモードを強制し、そのスナップショットの生モードを無効にします。
    - 生 JSON エディターの「保存済みにリセット」は、フラット化されたスナップショットを再レンダリングする代わりに、生で作成された形状 (フォーマット、コメント、`$include` レイアウト) を保持するため、スナップショットが安全に往復できる場合は外部編集がリセット後も残ります。
    - 構造化された SecretRef オブジェクト値は、誤ってオブジェクトから文字列へ破損することを防ぐため、フォームのテキスト入力では読み取り専用としてレンダリングされます。

  </Accordion>
  <Accordion title="デバッグ、ログ、更新">
    - デバッグ: ステータス/ヘルス/モデルのスナップショット、イベントログ、手動 RPC 呼び出し (`status`, `health`, `models.list`)。
    - ログ: フィルター/エクスポート付きの Gateway ファイルログのライブテール (`logs.tail`)。
    - 更新: 再起動レポート付きでパッケージ/git 更新と再起動を実行し (`update.run`)、再接続後に `update.status` をポーリングして実行中の Gateway バージョンを確認します。

  </Accordion>
  <Accordion title="Cron ジョブパネルの注記">
    - 分離ジョブでは、配信のデフォルトは要約のアナウンスです。内部専用の実行にしたい場合は、なしに切り替えられます。
    - アナウンスが選択されている場合、チャンネル/ターゲットフィールドが表示されます。
    - Webhook モードは、有効な HTTP(S) Webhook URL が設定された `delivery.to` とともに `delivery.mode = "webhook"` を使用します。
    - メインセッションジョブでは、Webhook となしの配信モードを利用できます。
    - 高度な編集コントロールには、実行後削除、エージェント上書きのクリア、Cron の厳密/分散オプション、エージェントのモデル/思考の上書き、ベストエフォート配信トグルが含まれます。
    - フォーム検証はフィールド単位のエラーとしてインライン表示されます。無効な値があると、修正されるまで保存ボタンは無効になります。
    - 専用のベアラートークンを送信するには `cron.webhookToken` を設定します。省略した場合、Webhook は認証ヘッダーなしで送信されます。
    - 非推奨のフォールバック: `notify: true` を持つ保存済みのレガシージョブは、移行されるまで引き続き `cron.webhook` を使用できます。

  </Accordion>
</AccordionGroup>

## チャットの動作

<AccordionGroup>
  <Accordion title="送信と履歴のセマンティクス">
    - `chat.send` は **ノンブロッキング** です。`{ runId, status: "started" }` で即座に ack し、応答は `chat` イベント経由でストリーミングされます。
    - チャットのアップロードは、画像と動画以外のファイルを受け付けます。画像はネイティブの画像パスを保持し、それ以外のファイルは管理対象メディアとして保存され、履歴では添付リンクとして表示されます。
    - 同じ `idempotencyKey` で再送信すると、実行中は `{ status: "in_flight" }` が返り、完了後は `{ status: "ok" }` が返ります。
    - `chat.history` の応答は UI の安全性のためサイズ制限されています。トランスクリプトのエントリが大きすぎる場合、Gateway は長いテキストフィールドを切り詰め、重いメタデータブロックを省略し、サイズ超過のメッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えることがあります。
    - アシスタント/生成画像は管理対象メディア参照として永続化され、認証済み Gateway メディア URL 経由で返されるため、再読み込みは未加工の base64 画像ペイロードがチャット履歴応答に残っていることに依存しません。
    - `chat.history` は、表示専用のインラインディレクティブタグ（例: `[[reply_to_*]]` と `[[audio_as_voice]]`）、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、漏出した ASCII/全角のモデル制御トークンも表示されるアシスタントテキストから除去し、表示テキスト全体が正確な無音トークン `NO_REPLY` / `no_reply` だけであるアシスタントエントリを省略します。
    - アクティブな送信中と最終履歴更新中に `chat.history` が一時的に古いスナップショットを返した場合でも、チャットビューはローカルの楽観的なユーザー/アシスタントメッセージを表示したままにします。Gateway の履歴が追いつくと、正規のトランスクリプトがそれらのローカルメッセージを置き換えます。
    - `chat.inject` はアシスタントノートをセッションのトランスクリプトに追加し、UI 専用更新のために `chat` イベントをブロードキャストします（エージェント実行なし、チャネル配信なし）。
    - チャットヘッダーのモデルと thinking ピッカーは、`sessions.patch` 経由でアクティブセッションに即座にパッチします。これらは永続的なセッション上書きであり、1 ターン限定の送信オプションではありません。
    - Control UI で `/new` と入力すると、New Chat と同じ新しいダッシュボードセッションが作成され、そこへ切り替わります。`/reset` と入力すると、現在のセッションに対する Gateway の明示的なインプレースリセットが維持されます。
    - チャットモデルピッカーは、Gateway の構成済みモデルビューを要求します。`agents.defaults.models` が存在する場合、その許可リストがピッカーを制御します。存在しない場合、ピッカーは明示的な `models.providers.*.models` エントリと、利用可能な認証を持つプロバイダーを表示します。完全なカタログは、デバッグ用の `models.list` RPC で `view: "all"` を指定すると引き続き利用できます。
    - 新しい Gateway セッション使用状況レポートが高いコンテキスト圧力を示す場合、チャットコンポーザー領域にはコンテキスト通知が表示され、推奨 Compaction レベルでは通常のセッション Compaction パスを実行するコンパクトボタンが表示されます。古いトークンスナップショットは、Gateway が新しい使用状況を再び報告するまで非表示になります。

  </Accordion>
  <Accordion title="トークモード（ブラウザーリアルタイム）">
    トークモードは、登録済みのリアルタイム音声プロバイダーを使用します。`talk.provider: "openai"` と `talk.providers.openai.apiKey` で OpenAI を構成するか、`talk.provider: "google"` と `talk.providers.google.apiKey` で Google を構成します。Voice Call のリアルタイムプロバイダー構成は、フォールバックとして引き続き再利用できます。ブラウザーが標準のプロバイダー API キーを受け取ることはありません。OpenAI は WebRTC 用の一時的な Realtime クライアントシークレットを受け取ります。Google Live は、ブラウザー WebSocket セッション用の 1 回限りの制約付き Live API 認証トークンを受け取り、指示とツール宣言は Gateway によってトークン内にロックされます。バックエンドのリアルタイムブリッジしか公開しないプロバイダーは Gateway リレートランスポート経由で実行されるため、認証情報とベンダーソケットはサーバー側に残り、ブラウザー音声は認証済み Gateway RPC 経由で移動します。Realtime セッションプロンプトは Gateway によって組み立てられます。`talk.realtime.session` は呼び出し元から提供される指示の上書きを受け付けません。

    チャットコンポーザーでは、Talk コントロールはマイクの音声入力ボタンの横にある波形ボタンです。Talk が開始すると、コンポーザーのステータス行には `Connecting Talk...` が表示され、その後、音声が接続されている間は `Talk live`、リアルタイムツール呼び出しが `chat.send` 経由で構成済みのより大きなモデルに問い合わせている間は `Asking OpenClaw...` が表示されます。

    メンテナー向けライブスモーク: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` は、OpenAI ブラウザー WebRTC SDP 交換、Google Live の制約付きトークンによるブラウザー WebSocket セットアップ、および偽のマイクメディアを使った Gateway リレーのブラウザーアダプターを検証します。このコマンドはプロバイダーのステータスのみを出力し、シークレットをログに記録しません。

  </Accordion>
  <Accordion title="停止と中止">
    - **Stop** をクリックします（`chat.abort` を呼び出します）。
    - 実行がアクティブな間、通常のフォローアップはキューに入ります。キュー内のメッセージで **Steer** をクリックすると、そのフォローアップを実行中のターンに注入できます。
    - `/stop`（または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` のような単独の中止フレーズ）を入力すると、帯域外で中止します。
    - `chat.abort` は、そのセッションのすべてのアクティブな実行を中止するために `{ sessionKey }`（`runId` なし）をサポートします。

  </Accordion>
  <Accordion title="中止時の部分保持">
    - 実行が中止された場合でも、部分的なアシスタントテキストは UI に表示できます。
    - バッファリングされた出力が存在する場合、Gateway は中止された部分的なアシスタントテキストをトランスクリプト履歴に永続化します。
    - 永続化されたエントリには中止メタデータが含まれるため、トランスクリプトの利用者は中止された部分と通常完了時の出力を区別できます。

  </Accordion>
</AccordionGroup>

## PWA のインストールと Web Push

Control UI には `manifest.webmanifest` とサービスワーカーが同梱されているため、最新のブラウザーはこれをスタンドアロン PWA としてインストールできます。Web Push により、タブやブラウザーウィンドウが開いていない場合でも、Gateway は通知でインストール済み PWA を起動できます。

| サーフェス                                            | 役割                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA マニフェスト。到達可能になると、ブラウザーが「アプリをインストール」を提示します。 |
| `ui/public/sw.js`                                     | `push` イベントと通知クリックを処理するサービスワーカー。 |
| `push/vapid-keys.json`（OpenClaw 状態ディレクトリ配下） | Web Push ペイロードの署名に使用される、自動生成された VAPID キーペア。 |
| `push/web-push-subscriptions.json`                    | 永続化されたブラウザーサブスクリプションエンドポイント。 |

キーを固定したい場合（マルチホストデプロイ、シークレットローテーション、またはテスト用）、Gateway プロセス上の env var で VAPID キーペアを上書きします。

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（デフォルトは `mailto:openclaw@localhost`）

Control UI は、これらのスコープ制限付き Gateway メソッドを使用して、ブラウザーサブスクリプションを登録およびテストします。

- `push.web.vapidPublicKey` — アクティブな VAPID 公開鍵を取得します。
- `push.web.subscribe` — `endpoint` と `keys.p256dh`/`keys.auth` を登録します。
- `push.web.unsubscribe` — 登録済みエンドポイントを削除します。
- `push.web.test` — 呼び出し元のサブスクリプションにテスト通知を送信します。

<Note>
Web Push は、iOS APNS リレーパス（リレーを利用するプッシュについては [構成](/ja-JP/gateway/configuration) を参照）および既存の `push.test` メソッドとは独立しています。これらはネイティブモバイルのペアリングを対象にしています。
</Note>

## ホスト型埋め込み

アシスタントメッセージは、`[embed ...]` ショートコードを使ってホストされた Web コンテンツをインラインでレンダリングできます。iframe サンドボックスポリシーは `gateway.controlUi.embedSandbox` で制御されます。

<Tabs>
  <Tab title="strict">
    ホスト型埋め込み内でのスクリプト実行を無効にします。
  </Tab>
  <Tab title="scripts（デフォルト）">
    オリジン分離を維持しながらインタラクティブな埋め込みを許可します。これがデフォルトで、通常は自己完結型のブラウザーゲーム/ウィジェットには十分です。
  </Tab>
  <Tab title="trusted">
    意図的により強い権限を必要とする同一サイト文書のために、`allow-scripts` に加えて `allow-same-origin` を追加します。
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
埋め込まれた文書が同一オリジンの動作を本当に必要とする場合にのみ、`trusted` を使用してください。ほとんどのエージェント生成ゲームやインタラクティブキャンバスでは、`scripts` のほうが安全な選択です。
</Warning>

絶対外部 `http(s)` 埋め込み URL は、デフォルトではブロックされたままです。`[embed url="https://..."]` でサードパーティページを読み込ませる意図がある場合は、`gateway.controlUi.allowExternalEmbedUrls: true` を設定してください。

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

この値は、ブラウザーに届く前に検証されます。サポートされる値には、`960px` や `82%` などの単純な長さとパーセンテージに加え、制約付きの `min(...)`、`max(...)`、`clamp(...)`、`calc(...)`、`fit-content(...)` 幅式が含まれます。

## Tailnet アクセス（推奨）

<Tabs>
  <Tab title="統合 Tailscale Serve（推奨）">
    Gateway をループバック上に保持し、Tailscale Serve に HTTPS でプロキシさせます。

    ```bash
    openclaw gateway --tailscale serve
    ```

    開きます。

    - `https://<magicdns>/`（または構成済みの `gateway.controlUi.basePath`）

    デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket Serve リクエストは Tailscale ID ヘッダー（`tailscale-user-login`）経由で認証できます。OpenClaw は `x-forwarded-for` アドレスを `tailscale whois` で解決し、それをヘッダーと照合することで ID を検証します。また、これらはリクエストが Tailscale の `x-forwarded-*` ヘッダー付きでループバックに到達した場合にのみ受け付けます。ブラウザーデバイス ID を持つ Control UI オペレーターセッションでは、この検証済み Serve パスによりデバイスペアリングの往復もスキップされます。デバイスのないブラウザーとノードロール接続は、引き続き通常のデバイスチェックに従います。Serve トラフィックでも明示的な共有シークレット認証情報を必須にしたい場合は、`gateway.auth.allowTailscale: false` を設定してください。そのうえで `gateway.auth.mode: "token"` または `"password"` を使用します。

    その非同期 Serve ID パスでは、同じクライアント IP と認証スコープに対する認証失敗は、レート制限の書き込み前に直列化されます。そのため、同じブラウザーからの同時に発生した不正な再試行では、2 つの単純な不一致が並列で競合するのではなく、2 番目のリクエストで `retry later` が表示されることがあります。

    <Warning>
    トークンなしの Serve 認証は、Gateway ホストが信頼済みであることを前提とします。信頼できないローカルコードがそのホストで実行される可能性がある場合は、トークン/パスワード認証を必須にしてください。
    </Warning>

  </Tab>
  <Tab title="tailnet にバインド + トークン">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    次に開きます。

    - `http://<tailscale-ip>:18789/`（または構成済みの `gateway.controlUi.basePath`）

    一致する共有シークレットを UI 設定に貼り付けます（`connect.params.auth.token` または `connect.params.auth.password` として送信されます）。

  </Tab>
</Tabs>

## 安全でない HTTP

プレーン HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、ブラウザーは **非セキュアコンテキスト** で実行され、WebCrypto をブロックします。デフォルトでは、OpenClaw はデバイス ID のない Control UI 接続を **ブロック** します。

文書化されている例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost 限定の安全でない HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` 経由の成功したオペレーター Control UI 認証
- 緊急回避用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS（Tailscale Serve）を使用するか、UI をローカルで開きます。

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

    `allowInsecureAuth` はローカル互換性のためのトグルにすぎません。

    - 非セキュアな HTTP コンテキストで、localhost の Control UI セッションがデバイス ID なしで続行できるようにします。
    - ペアリングチェックはバイパスしません。
    - リモート（非 localhost）のデバイス ID 要件は緩和しません。

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
    `dangerouslyDisableDeviceAuth` は Control UI のデバイス ID チェックを無効にし、重大なセキュリティ低下を招きます。緊急時の使用後は速やかに元に戻してください。
    </Warning>

  </Accordion>
  <Accordion title="信頼済みプロキシの注意事項">
    - 信頼済みプロキシ認証に成功すると、デバイス ID なしで **operator** Control UI セッションを許可できます。
    - これは node-role Control UI セッションには適用されません。
    - 同一ホストの loopback リバースプロキシは、引き続き信頼済みプロキシ認証を満たしません。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照してください。

  </Accordion>
</AccordionGroup>

HTTPS 設定のガイダンスについては [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## コンテンツセキュリティポリシー

Control UI には厳格な `img-src` ポリシーが同梱されています。許可されるのは、**同一オリジン** のアセット、`data:` URL、ローカルで生成された `blob:` URL のみです。リモートの `http(s)` およびプロトコル相対の画像 URL はブラウザーによって拒否され、ネットワークフェッチは発生しません。

実際には、これは次のことを意味します。

- 相対パス（例: `/avatars/<id>`）で提供されるアバターと画像は引き続き表示されます。UI がフェッチしてローカルの `blob:` URL に変換する、認証付きアバタールートも含まれます。
- インラインの `data:image/...` URL は引き続き表示されます（プロトコル内ペイロードに便利です）。
- Control UI によって作成されたローカルの `blob:` URL は引き続き表示されます。
- チャンネルメタデータによって出力されたリモートアバター URL は、Control UI のアバターヘルパーで削除され、組み込みのロゴ/バッジに置き換えられます。そのため、侵害された、または悪意のあるチャンネルが、operator のブラウザーから任意のリモート画像フェッチを強制することはできません。

この動作を得るために変更は不要です。常に有効で、設定変更はできません。

## アバタールート認証

Gateway 認証が設定されている場合、Control UI アバターエンドポイントには API の他の部分と同じ Gateway トークンが必要です。

- `GET /avatar/<agentId>` は、認証済みの呼び出し元にのみアバター画像を返します。`GET /avatar/<agentId>?meta=1` は、同じルールのもとでアバターメタデータを返します。
- どちらのルートへの未認証リクエストも拒否されます（隣接する assistant-media ルートと同様）。これにより、他の部分では保護されているホストでアバタールートから agent ID が漏えいすることを防ぎます。
- Control UI 自体は、アバターをフェッチするときに Gateway トークンを bearer ヘッダーとして転送し、認証付き blob URL を使うため、画像はダッシュボード内で引き続き表示されます。

Gateway 認証を無効にした場合（共有ホストでは非推奨）、Gateway の他の部分と同様に、アバタールートも未認証になります。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを配信します。次のコマンドでビルドします。

```bash
pnpm ui:build
```

任意の絶対ベース（固定アセット URL が必要な場合）:

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

ローカル開発の場合（別の開発サーバー）:

```bash
pnpm ui:dev
```

その後、UI に Gateway の WS URL（例: `ws://127.0.0.1:18789`）を指定します。

## デバッグ/テスト: 開発サーバー + リモート Gateway

Control UI は静的ファイルです。WebSocket ターゲットは設定可能で、HTTP オリジンとは異なるものにできます。これは、Vite 開発サーバーをローカルで使い、Gateway を別の場所で実行したい場合に便利です。

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

    任意の一回限りの認証（必要な場合）:

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="注意事項">
    - `gatewayUrl` は読み込み後に localStorage に保存され、URL から削除されます。
    - `gatewayUrl` 経由で完全な `ws://` または `wss://` エンドポイントを渡す場合は、ブラウザーがクエリ文字列を正しく解析できるように、`gatewayUrl` の値を URL エンコードしてください。
    - `token` は可能な限り URL フラグメント（`#token=...`）経由で渡してください。フラグメントはサーバーに送信されないため、リクエストログや Referer への漏えいを回避できます。従来の `?token=` クエリパラメーターも互換性のために一度だけインポートされますが、フォールバックとしてのみ扱われ、ブートストラップ直後に削除されます。
    - `password` はメモリ内にのみ保持されます。
    - `gatewayUrl` が設定されている場合、UI は config または環境の認証情報にフォールバックしません。`token`（または `password`）を明示的に指定してください。明示的な認証情報がない場合はエラーです。
    - Gateway が TLS（Tailscale Serve、HTTPS プロキシなど）の背後にある場合は `wss://` を使用してください。
    - `gatewayUrl` は、クリックジャッキングを防ぐためトップレベルウィンドウでのみ受け付けられます（埋め込みでは不可）。
    - 非 loopback の Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を明示的に設定する必要があります（完全なオリジン）。これにはリモート開発セットアップも含まれます。
    - Gateway の起動時に、有効なランタイムの bind と port から `http://localhost:<port>` や `http://127.0.0.1:<port>` などのローカルオリジンがシードされる場合がありますが、リモートブラウザーのオリジンには引き続き明示的なエントリが必要です。
    - 厳密に管理されたローカルテストを除き、`gateway.controlUi.allowedOrigins: ["*"]` は使用しないでください。これは「使用しているホストに一致させる」ではなく、任意のブラウザーオリジンを許可するという意味です。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は Host-header オリジンフォールバックモードを有効にしますが、危険なセキュリティモードです。

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

- [ダッシュボード](/ja-JP/web/dashboard) — gateway ダッシュボード
- [ヘルスチェック](/ja-JP/gateway/health) — gateway ヘルスモニタリング
- [TUI](/ja-JP/web/tui) — ターミナルユーザーインターフェイス
- [WebChat](/ja-JP/web/webchat) — ブラウザーベースのチャットインターフェイス
