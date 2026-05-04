---
read_when:
    - ブラウザから Gateway を操作したい場合
    - SSH トンネルなしで Tailnet アクセスを使いたい場合
sidebarTitle: Control UI
summary: ブラウザベースの Gateway 用コントロール UI（チャット、ノード、設定）
title: コントロール UI
x-i18n:
    generated_at: "2026-05-04T05:03:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99a40ab77276fbc3180aefb103c2dd46804829c7b1b6966a8456ed35b85ed644
    source_path: web/control-ui.md
    workflow: 16
---

コントロール UI は、Gateway によって配信される小さな **Vite + Lit** シングルページアプリです。

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します (例: `/openclaw`)

同じポート上の **Gateway WebSocket** と直接通信します。

## クイックオープン (ローカル)

Gateway が同じコンピューターで実行されている場合は、次を開きます。

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (または [http://localhost:18789/](http://localhost:18789/))

ページの読み込みに失敗する場合は、先に Gateway を起動します: `openclaw gateway`。

認証は、WebSocket ハンドシェイク中に次の方法で提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合の Tailscale Serve アイデンティティヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合の信頼済みプロキシアイデンティティヘッダー

ダッシュボードの設定パネルは、現在のブラウザータブセッションと選択中の Gateway URL 用のトークンを保持します。パスワードは永続化されません。オンボーディングでは通常、初回接続時に共有シークレット認証用の Gateway トークンが生成されますが、`gateway.auth.mode` が `"password"` の場合はパスワード認証も機能します。

## デバイスペアリング (初回接続)

新しいブラウザーまたはデバイスからコントロール UI に接続すると、Gateway は通常、**一回限りのペアリング承認**を要求します。これは不正アクセスを防ぐためのセキュリティ対策です。

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

ブラウザーがすでにペアリング済みで、読み取りアクセスから書き込み/管理者アクセスへ変更する場合、これはサイレント再接続ではなく承認のアップグレードとして扱われます。OpenClaw は古い承認を有効なまま保持し、より広い再接続をブロックし、新しいスコープセットを明示的に承認するよう求めます。

承認されるとデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り再承認は不要です。トークンローテーションと取り消しについては、[デバイス CLI](/ja-JP/cli/devices) を参照してください。

<Note>
- 直接の local loopback ブラウザー接続 (`127.0.0.1` / `localhost`) は自動承認されます。
- `gateway.auth.allowTailscale: true` で、Tailscale アイデンティティが検証され、ブラウザーがデバイスアイデンティティを提示する場合、Tailscale Serve はコントロール UI オペレーターセッションのペアリング往復を省略できます。
- 直接の Tailnet バインド、LAN ブラウザー接続、デバイスアイデンティティのないブラウザープロファイルでは、引き続き明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイス ID を生成するため、ブラウザーを切り替えたりブラウザーデータを消去したりすると、再ペアリングが必要になります。

</Note>

## 個人アイデンティティ (ブラウザーローカル)

コントロール UI は、共有セッションでの帰属表示のために送信メッセージへ付与される、ブラウザーごとの個人アイデンティティ (表示名とアバター) をサポートします。これはブラウザーストレージに存在し、現在のブラウザープロファイルにスコープされ、他のデバイスには同期されません。また、実際に送信したメッセージ上の通常のトランスクリプト作成者メタデータを除き、サーバー側に永続化されません。サイトデータを消去したりブラウザーを切り替えたりすると、空にリセットされます。

同じブラウザーローカルのパターンは、アシスタントアバターの上書きにも適用されます。アップロードされたアシスタントアバターは、ローカルブラウザー上でのみ Gateway が解決したアイデンティティに重ねられ、`config.patch` を通じて往復することはありません。共有 `ui.assistant.avatar` 設定フィールドは、このフィールドへ直接書き込む非 UI クライアント (スクリプト化された Gateway やカスタムダッシュボードなど) 向けに引き続き利用できます。

## ランタイム設定エンドポイント

コントロール UI は、実行時設定を `/__openclaw/control-ui-config.json` から取得します。このエンドポイントは、HTTP サーフェスの残りと同じ Gateway 認証で制御されます。未認証のブラウザーは取得できず、取得に成功するには、すでに有効な Gateway トークン/パスワード、Tailscale Serve アイデンティティ、または信頼済みプロキシアイデンティティのいずれかが必要です。

## 言語サポート

コントロール UI は、初回読み込み時にブラウザーのロケールに基づいてローカライズできます。後で上書きするには、**概要 -> Gateway アクセス -> 言語** を開きます。ロケールピッカーは外観ではなく、Gateway アクセスカードにあります。

- サポートされるロケール: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 英語以外の翻訳はブラウザーで遅延読み込みされます。
- 選択したロケールはブラウザーストレージに保存され、以後の訪問で再利用されます。
- 不足している翻訳キーは英語にフォールバックします。

ドキュメント翻訳は同じ英語以外のロケールセット向けに生成されますが、ドキュメントサイトに組み込まれた Mintlify の言語ピッカーは、Mintlify が受け入れるロケールコードに制限されています。タイ語 (`th`) とペルシア語 (`fa`) のドキュメントは公開リポジトリで引き続き生成されますが、Mintlify がこれらのコードをサポートするまで、そのピッカーには表示されない場合があります。

## 外観テーマ

外観パネルには、組み込みの Claw、Knot、Dash テーマに加え、ブラウザーローカルの tweakcn インポートスロットが 1 つあります。テーマをインポートするには、[tweakcn editor](https://tweakcn.com/editor/theme) を開き、テーマを選択または作成し、**共有** をクリックして、コピーしたテーマリンクを外観に貼り付けます。インポーターは `https://tweakcn.com/r/themes/<id>` レジストリ URL、`https://tweakcn.com/editor/theme?theme=amethyst-haze` のようなエディター URL、相対 `/themes/<id>` パス、生のテーマ ID、`amethyst-haze` などのデフォルトテーマ名も受け入れます。

インポートされたテーマは現在のブラウザープロファイルにのみ保存されます。Gateway 設定には書き込まれず、デバイス間で同期されません。インポート済みテーマを置き換えると、1 つのローカルスロットが更新されます。消去すると、インポート済みテーマが選択されていた場合、アクティブテーマは Claw に戻ります。

## できること (現在)

<AccordionGroup>
  <Accordion title="チャットと通話">
    - Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`) 経由でモデルとチャットします。
    - ブラウザーのリアルタイムセッションで通話します。OpenAI は直接 WebRTC を使用し、Google Live は WebSocket 経由の制約付き一回限りブラウザートークンを使用し、バックエンド専用リアルタイム音声 Plugin は Gateway リレートランスポートを使用します。リレーはプロバイダー資格情報を Gateway 上に保持し、ブラウザーは `talk.realtime.relay*` RPC を通じてマイク PCM をストリーミングし、より大きな設定済み OpenClaw モデル用の `openclaw_agent_consult` ツール呼び出しを `chat.send` 経由で送り返します。
    - チャットでツール呼び出しとライブツール出力カードをストリーミングします (エージェントイベント)。

  </Accordion>
  <Accordion title="チャンネル、インスタンス、セッション、Dream">
    - チャンネル: 組み込みおよび同梱/外部 Plugin チャンネルのステータス、QR ログイン、チャンネルごとの設定 (`channels.status`, `web.login.*`, `config.patch`)。
    - インスタンス: プレゼンス一覧と更新 (`system-presence`)。
    - セッション: 一覧とセッションごとのモデル/思考/高速/詳細/トレース/推論の上書き (`sessions.list`, `sessions.patch`)。
    - Dream: Dreaming ステータス、有効/無効トグル、Dream Diary リーダー (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)。

  </Accordion>
  <Accordion title="Cron、Skills、ノード、exec 承認">
    - Cron ジョブ: 一覧/追加/編集/実行/有効化/無効化と実行履歴 (`cron.*`)。
    - Skills: ステータス、有効化/無効化、インストール、API キー更新 (`skills.*`)。
    - ノード: 一覧と機能 (`node.list`)。
    - exec 承認: Gateway またはノードの許可リストと `exec host=gateway/node` の確認ポリシーを編集します (`exec.approvals.*`)。

  </Accordion>
  <Accordion title="設定">
    - `~/.openclaw/openclaw.json` を表示/編集します (`config.get`, `config.set`)。
    - 検証付きで適用して再起動し (`config.apply`)、最後にアクティブだったセッションを起こします。
    - 書き込みには、同時編集による上書きを防ぐためのベースハッシュガードが含まれます。
    - 書き込み (`config.set`/`config.apply`/`config.patch`) は、送信された設定ペイロード内の参照について、アクティブな SecretRef 解決を事前確認します。送信された未解決のアクティブ参照は、書き込み前に拒否されます。
    - スキーマとフォームレンダリング (`config.schema` / `config.schema.lookup`。フィールド `title` / `description`、一致した UI ヒント、直下の子要素サマリー、ネストされたオブジェクト/ワイルドカード/配列/合成ノード上のドキュメントメタデータ、利用可能な場合は Plugin とチャンネルのスキーマを含む)。Raw JSON エディターは、スナップショットが安全に raw 往復できる場合にのみ利用できます。
    - スナップショットが raw テキストを安全に往復できない場合、コントロール UI はフォームモードを強制し、そのスナップショットの Raw モードを無効にします。
    - Raw JSON エディターの「保存済みにリセット」は、フラット化されたスナップショットを再レンダリングする代わりに、raw で作成された形状 (書式、コメント、`$include` レイアウト) を保持するため、スナップショットが安全に往復できる場合は外部編集がリセット後も残ります。
    - 構造化された SecretRef オブジェクト値は、誤ってオブジェクトから文字列へ破損することを防ぐため、フォームのテキスト入力では読み取り専用でレンダリングされます。

  </Accordion>
  <Accordion title="デバッグ、ログ、更新">
    - デバッグ: ステータス/ヘルス/モデルのスナップショット、イベントログ、手動 RPC 呼び出し (`status`, `health`, `models.list`)。
    - ログ: Gateway ファイルログのライブテール、フィルター/エクスポート付き (`logs.tail`)。
    - 更新: 再起動レポート付きでパッケージ/git 更新と再起動を実行し (`update.run`)、再接続後に `update.status` をポーリングして実行中の Gateway バージョンを検証します。

  </Accordion>
  <Accordion title="Cron ジョブパネルの注記">
    - 分離ジョブでは、配信のデフォルトはサマリーのアナウンスです。内部専用の実行にしたい場合は、なしに切り替えられます。
    - アナウンスが選択されている場合、チャンネル/ターゲットフィールドが表示されます。
    - Webhook モードは、有効な HTTP(S) Webhook URL に設定された `delivery.to` とともに `delivery.mode = "webhook"` を使用します。
    - メインセッションジョブでは、Webhook と配信なしモードを利用できます。
    - 詳細編集コントロールには、実行後削除、エージェント上書きのクリア、Cron の厳密/分散オプション、エージェントのモデル/思考の上書き、ベストエフォート配信トグルが含まれます。
    - フォーム検証はフィールドレベルのエラーとしてインライン表示されます。無効な値がある場合、修正されるまで保存ボタンは無効になります。
    - 専用の bearer トークンを送信するには `cron.webhookToken` を設定します。省略した場合、Webhook は認証ヘッダーなしで送信されます。
    - 非推奨のフォールバック: `notify: true` を持つ保存済みの従来ジョブは、移行されるまで引き続き `cron.webhook` を使用できます。

  </Accordion>
</AccordionGroup>

## チャット動作

<AccordionGroup>
  <Accordion title="送信と履歴のセマンティクス">
    - `chat.send` は**非ブロッキング**です。`{ runId, status: "started" }` ですぐに ACK し、応答は `chat` イベント経由でストリーミングされます。
    - チャットアップロードは画像と動画以外のファイルを受け付けます。画像はネイティブの画像パスを保持し、その他のファイルは管理対象メディアとして保存され、履歴には添付リンクとして表示されます。
    - 同じ `idempotencyKey` で再送信すると、実行中は `{ status: "in_flight" }`、完了後は `{ status: "ok" }` が返ります。
    - `chat.history` の応答は UI の安全性のためサイズ制限されています。トランスクリプトエントリが大きすぎる場合、Gateway は長いテキストフィールドを切り詰め、重いメタデータブロックを省略し、サイズ超過メッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えることがあります。
    - アシスタントまたは生成された画像は管理対象メディア参照として永続化され、認証済み Gateway メディア URL 経由で返されます。そのため、再読み込みは生の base64 画像ペイロードがチャット履歴応答に残っていることに依存しません。
    - `chat.history` は、表示専用のインラインディレクティブタグ（たとえば `[[reply_to_*]]` と `[[audio_as_voice]]`）、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、切り詰められたツール呼び出しブロックを含む）、漏えいした ASCII/全角のモデル制御トークンも、表示されるアシスタントテキストから除去し、表示テキスト全体が正確なサイレントトークン `NO_REPLY` / `no_reply` だけであるアシスタントエントリを省略します。
    - アクティブな送信中と最終的な履歴更新中、`chat.history` が一時的に古いスナップショットを返した場合でも、チャットビューはローカルの楽観的なユーザー/アシスタントメッセージを表示し続けます。Gateway 履歴が追いつくと、正規のトランスクリプトがそれらのローカルメッセージを置き換えます。
    - ライブの `chat` イベントは配信状態であり、`chat.history` は永続セッショントランスクリプトから再構築されます。ツール最終イベントの後、Control UI は履歴を再読み込みし、小さな楽観的末尾だけをマージします。トランスクリプト境界は [WebChat](/ja-JP/web/webchat) に記載されています。
    - `chat.inject` はアシスタントメモをセッショントランスクリプトに追加し、UI のみの更新として `chat` イベントをブロードキャストします（エージェント実行なし、チャンネル配信なし）。
    - チャットヘッダーのモデルおよび思考ピッカーは、`sessions.patch` 経由でアクティブセッションに即座にパッチを適用します。これらは永続的なセッションオーバーライドであり、1 ターン限定の送信オプションではありません。
    - Control UI で `/new` と入力すると、New Chat と同じ新しいダッシュボードセッションが作成され、そのセッションに切り替わります。`/reset` と入力すると、現在のセッションに対する Gateway の明示的なインプレースリセットが維持されます。
    - チャットモデルピッカーは、Gateway に設定されたモデルビューを要求します。`agents.defaults.models` が存在する場合、その許可リストがピッカーを制御します。それ以外の場合、ピッカーには明示的な `models.providers.*.models` エントリと、使用可能な認証を持つプロバイダーが表示されます。完全なカタログは、デバッグ用の `models.list` RPC で `view: "all"` を指定すると引き続き利用できます。
    - 新しい Gateway セッション使用状況レポートが高いコンテキスト圧力を示す場合、チャットコンポーザー領域にはコンテキスト通知が表示され、推奨 Compaction レベルでは通常のセッション Compaction パスを実行するコンパクトボタンが表示されます。古いトークンスナップショットは、Gateway が新しい使用状況を再度報告するまで非表示になります。

  </Accordion>
  <Accordion title="トークモード（ブラウザーリアルタイム）">
    トークモードは、登録済みのリアルタイム音声プロバイダーを使用します。OpenAI を設定するには `talk.provider: "openai"` と `talk.providers.openai.apiKey` を指定し、Google を設定するには `talk.provider: "google"` と `talk.providers.google.apiKey` を指定します。Voice Call のリアルタイムプロバイダー設定は、フォールバックとして引き続き再利用できます。ブラウザーが標準プロバイダー API キーを受け取ることはありません。OpenAI は WebRTC 用の一時的な Realtime クライアントシークレットを受け取ります。Google Live は、ブラウザー WebSocket セッション用の 1 回限りの制約付き Live API 認証トークンを受け取り、指示とツール宣言は Gateway によってトークン内に固定されます。バックエンドのリアルタイムブリッジのみを公開するプロバイダーは Gateway リレートランスポート経由で実行されるため、認証情報とベンダーソケットはサーバー側に留まり、ブラウザー音声は認証済み Gateway RPC 経由で移動します。Realtime セッションプロンプトは Gateway によって組み立てられます。`talk.realtime.session` は呼び出し元が提供する指示オーバーライドを受け付けません。

    Chat コンポーザーでは、Talk コントロールはマイクのディクテーションボタンの横にある波形ボタンです。Talk が開始されると、コンポーザーのステータス行には、音声接続中は `Connecting Talk...`、接続後は `Talk live`、リアルタイムツール呼び出しが `chat.send` 経由で設定済みのより大きなモデルに問い合わせている間は `Asking OpenClaw...` が表示されます。

    メンテナー向けライブスモーク: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` は、OpenAI ブラウザー WebRTC SDP 交換、Google Live の制約付きトークンによるブラウザー WebSocket セットアップ、偽のマイクメディアを使った Gateway リレーブラウザーアダプターを検証します。このコマンドはプロバイダーのステータスのみを出力し、シークレットはログに記録しません。

  </Accordion>
  <Accordion title="停止と中止">
    - **Stop** をクリックします（`chat.abort` を呼び出します）。
    - 実行がアクティブな間、通常のフォローアップはキューに入ります。キュー内のメッセージで **Steer** をクリックすると、そのフォローアップを実行中のターンに注入できます。
    - `/stop`（または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` のような単独の中止フレーズ）を入力すると、帯域外で中止します。
    - `chat.abort` は、そのセッションのすべてのアクティブな実行を中止するために `{ sessionKey }`（`runId` なし）をサポートします。

  </Accordion>
  <Accordion title="中止時の部分保持">
    - 実行が中止された場合でも、部分的なアシスタントテキストが UI に表示されることがあります。
    - Gateway は、バッファーされた出力が存在する場合、中止された部分的なアシスタントテキストをトランスクリプト履歴に永続化します。
    - 永続化されたエントリには中止メタデータが含まれるため、トランスクリプト利用側は中止された部分出力と通常の完了出力を区別できます。

  </Accordion>
</AccordionGroup>

## PWA のインストールと Web Push

Control UI には `manifest.webmanifest` とサービスワーカーが同梱されているため、最新のブラウザーではスタンドアロン PWA としてインストールできます。Web Push により、タブやブラウザーウィンドウが開いていない場合でも、Gateway は通知でインストール済み PWA を起動できます。

| サーフェス                                            | 動作                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA マニフェスト。到達可能になると、ブラウザーは「アプリをインストール」を提示します。 |
| `ui/public/sw.js`                                     | `push` イベントと通知クリックを処理するサービスワーカー。 |
| `push/vapid-keys.json`（OpenClaw 状態ディレクトリ配下） | Web Push ペイロードの署名に使用される、自動生成された VAPID キーペア。 |
| `push/web-push-subscriptions.json`                    | 永続化されたブラウザーサブスクリプションエンドポイント。 |

キーを固定したい場合（マルチホストデプロイ、シークレットローテーション、テストなど）は、Gateway プロセスの環境変数で VAPID キーペアをオーバーライドします。

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（デフォルトは `mailto:openclaw@localhost`）

Control UI は、ブラウザーサブスクリプションを登録およびテストするために、これらのスコープ制限付き Gateway メソッドを使用します。

- `push.web.vapidPublicKey` — アクティブな VAPID 公開鍵を取得します。
- `push.web.subscribe` — `endpoint` と `keys.p256dh`/`keys.auth` を登録します。
- `push.web.unsubscribe` — 登録済みエンドポイントを削除します。
- `push.web.test` — 呼び出し元のサブスクリプションにテスト通知を送信します。

<Note>
Web Push は、iOS APNS リレーパス（リレー backed push については [設定](/ja-JP/gateway/configuration) を参照）および既存の `push.test` メソッドとは独立しています。これらはネイティブモバイルペアリングを対象とします。
</Note>

## ホストされた埋め込み

アシスタントメッセージは、`[embed ...]` ショートコードを使ってホストされた Web コンテンツをインラインでレンダリングできます。iframe サンドボックスポリシーは `gateway.controlUi.embedSandbox` によって制御されます。

<Tabs>
  <Tab title="strict">
    ホストされた埋め込み内でのスクリプト実行を無効にします。
  </Tab>
  <Tab title="scripts (default)">
    オリジン分離を維持しながらインタラクティブな埋め込みを許可します。これがデフォルトであり、通常は自己完結型のブラウザーゲーム/ウィジェットには十分です。
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
埋め込みドキュメントが本当に同一オリジンの動作を必要とする場合にのみ、`trusted` を使用してください。ほとんどのエージェント生成ゲームやインタラクティブキャンバスでは、`scripts` の方が安全な選択です。
</Warning>

絶対外部 `http(s)` 埋め込み URL は、デフォルトでは引き続きブロックされます。`[embed url="https://..."]` でサードパーティページを読み込ませたいことが意図的にある場合は、`gateway.controlUi.allowExternalEmbedUrls: true` を設定してください。

## チャットメッセージ幅

グループ化されたチャットメッセージには、読みやすいデフォルトの最大幅が使用されます。ワイドモニターのデプロイでは、`gateway.controlUi.chatMessageMaxWidth` を設定することで、同梱 CSS にパッチを当てずにこれをオーバーライドできます。

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
    Gateway をループバックに保持し、Tailscale Serve に HTTPS でプロキシさせます。

    ```bash
    openclaw gateway --tailscale serve
    ```

    開く:

    - `https://<magicdns>/`（または設定済みの `gateway.controlUi.basePath`）

    デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket Serve リクエストは Tailscale ID ヘッダー（`tailscale-user-login`）経由で認証できます。OpenClaw は、`x-forwarded-for` アドレスを `tailscale whois` で解決してヘッダーと照合することで ID を検証し、リクエストが Tailscale の `x-forwarded-*` ヘッダー付きで local loopback に到達した場合にのみ受け入れます。ブラウザーデバイス ID を持つ Control UI オペレーターセッションでは、この検証済み Serve パスはデバイスペアリングの往復もスキップします。デバイスなしのブラウザーとノードロール接続は、通常のデバイスチェックに従います。Serve トラフィックであっても明示的な共有シークレット認証情報を要求したい場合は、`gateway.auth.allowTailscale: false` を設定してください。そのうえで `gateway.auth.mode: "token"` または `"password"` を使用します。

    その非同期 Serve ID パスでは、同じクライアント IP と認証スコープに対する認証失敗の試行は、レート制限の書き込み前に直列化されます。そのため、同じブラウザーからの同時の不正リトライでは、2 つの単純な不一致が並行して競合する代わりに、2 番目のリクエストで `retry later` が表示されることがあります。

    <Warning>
    トークンなしの Serve 認証は、Gateway ホストが信頼されていることを前提とします。そのホスト上で信頼できないローカルコードが実行される可能性がある場合は、トークン/パスワード認証を要求してください。
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

プレーン HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、ブラウザーは**非セキュアコンテキスト**で実行され、WebCrypto をブロックします。デフォルトでは、OpenClaw はデバイス ID のない Control UI 接続を**ブロック**します。

文書化された例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost 限定の安全でない HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` 経由でのオペレーター Control UI 認証の成功
- 緊急時用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS (Tailscale Serve) を使うか、UI をローカルで開きます。

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (Gateway ホスト上)

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

    `allowInsecureAuth` はローカル互換性用のトグルにすぎません。

    - 非セキュアな HTTP コンテキストで、localhost の Control UI セッションがデバイス ID なしで続行できるようにします。
    - ペアリングチェックはバイパスしません。
    - リモート (localhost 以外) のデバイス ID 要件は緩和しません。

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
  <Accordion title="信頼済みプロキシに関する注記">
    - 信頼済みプロキシ認証に成功すると、デバイス ID なしで **operator** Control UI セッションを許可できます。
    - これは node-role Control UI セッションには適用されません。
    - 同一ホストのループバックリバースプロキシでも、信頼済みプロキシ認証の条件は満たされません。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth) を参照してください。

  </Accordion>
</AccordionGroup>

HTTPS セットアップのガイダンスについては [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## コンテンツセキュリティポリシー

Control UI には厳格な `img-src` ポリシーが含まれています。許可されるのは **同一オリジン** のアセット、`data:` URL、ローカルで生成された `blob:` URL のみです。リモートの `http(s)` およびプロトコル相対の画像 URL はブラウザによって拒否され、ネットワークフェッチは発生しません。

実際には、これは次を意味します。

- 相対パス配下で提供されるアバターや画像 (例: `/avatars/<id>`) は引き続き表示されます。UI がフェッチしてローカルの `blob:` URL に変換する、認証付きアバタールートも含まれます。
- インラインの `data:image/...` URL は引き続き表示されます (プロトコル内ペイロードに便利です)。
- Control UI によって作成されたローカルの `blob:` URL は引き続き表示されます。
- チャネルメタデータから出力されたリモートアバター URL は、Control UI のアバターヘルパーで取り除かれ、組み込みのロゴ/バッジに置き換えられます。そのため、侵害された、または悪意のあるチャネルがオペレーターのブラウザから任意のリモート画像フェッチを強制することはできません。

この動作を得るために変更は不要です。常に有効で、設定変更はできません。

## アバタールート認証

Gateway 認証が設定されている場合、Control UI のアバターエンドポイントには API の他の部分と同じ Gateway トークンが必要です。

- `GET /avatar/<agentId>` は認証済みの呼び出し元にのみアバター画像を返します。`GET /avatar/<agentId>?meta=1` は同じルールでアバターメタデータを返します。
- どちらのルートへの未認証リクエストも拒否されます (兄弟の assistant-media ルートと同様です)。これにより、他の部分では保護されているホストで、アバタールートからエージェント ID が漏れることを防ぎます。
- Control UI 自体はアバターをフェッチするときに Gateway トークンを bearer ヘッダーとして転送し、認証済みの blob URL を使うため、画像はダッシュボード内で引き続き表示されます。

Gateway 認証を無効化した場合 (共有ホストでは非推奨)、Gateway の他の部分と同様に、アバタールートも未認証になります。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを提供します。次でビルドします。

```bash
pnpm ui:build
```

任意の絶対ベース (固定アセット URL を使いたい場合):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

ローカル開発用 (別の開発サーバー):

```bash
pnpm ui:dev
```

その後、UI を Gateway の WS URL (例: `ws://127.0.0.1:18789`) に向けます。

## デバッグ/テスト: 開発サーバー + リモート Gateway

Control UI は静的ファイルです。WebSocket ターゲットは設定可能で、HTTP オリジンとは異なる場所にできます。これは、Vite 開発サーバーをローカルで使い、Gateway を別の場所で実行したい場合に便利です。

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
    - `gatewayUrl` 経由で完全な `ws://` または `wss://` エンドポイントを渡す場合は、ブラウザがクエリ文字列を正しく解析できるように `gatewayUrl` の値を URL エンコードしてください。
    - 可能な限り、`token` は URL フラグメント (`#token=...`) 経由で渡してください。フラグメントはサーバーに送信されないため、リクエストログや Referer への漏えいを避けられます。従来の `?token=` クエリパラメータも互換性のために一度だけ取り込まれますが、フォールバックとしてのみ使われ、ブートストラップ直後に取り除かれます。
    - `password` はメモリ内にのみ保持されます。
    - `gatewayUrl` が設定されている場合、UI は設定や環境の認証情報にフォールバックしません。`token` (または `password`) を明示的に指定してください。明示的な認証情報がない場合はエラーです。
    - Gateway が TLS (Tailscale Serve、HTTPS プロキシなど) の背後にある場合は `wss://` を使用してください。
    - `gatewayUrl` はクリックジャッキングを防ぐため、トップレベルウィンドウ (埋め込みではない) でのみ受け付けられます。
    - 非ループバックの Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を明示的に設定する必要があります (完全なオリジン)。これにはリモート開発セットアップも含まれます。
    - Gateway の起動時に、有効な実行時の bind と port から `http://localhost:<port>` や `http://127.0.0.1:<port>` などのローカルオリジンがシードされる場合がありますが、リモートブラウザのオリジンには引き続き明示的なエントリが必要です。
    - 厳密に管理されたローカルテストを除き、`gateway.controlUi.allowedOrigins: ["*"]` は使用しないでください。これは任意のブラウザオリジンを許可するという意味であり、「現在使用しているホストに一致させる」という意味ではありません。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は Host ヘッダーのオリジンフォールバックモードを有効化しますが、危険なセキュリティモードです。

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

- [ダッシュボード](/ja-JP/web/dashboard) — Gateway ダッシュボード
- [ヘルスチェック](/ja-JP/gateway/health) — Gateway ヘルスモニタリング
- [TUI](/ja-JP/web/tui) — ターミナルユーザーインターフェイス
- [WebChat](/ja-JP/web/webchat) — ブラウザベースのチャットインターフェイス
