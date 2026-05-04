---
read_when:
    - ブラウザから Gateway を操作したい場合
    - SSH トンネルなしで Tailnet アクセスを利用したい
sidebarTitle: Control UI
summary: Gateway のブラウザベースの制御 UI（チャット、ノード、設定）
title: 制御 UI
x-i18n:
    generated_at: "2026-05-04T07:04:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07fbbe1c7fec5f67a04a231e02bdf0f7d16be9c5fe188915674d71fcd69002a5
    source_path: web/control-ui.md
    workflow: 16
---

Control UI は、Gateway によって配信される小さな **Vite + Lit** のシングルページアプリです。

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します (例: `/openclaw`)

同じポート上の **Gateway WebSocket** と直接通信します。

## クイックオープン (ローカル)

Gateway が同じコンピューターで実行されている場合は、次を開きます。

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (または [http://localhost:18789/](http://localhost:18789/))

ページの読み込みに失敗する場合は、先に Gateway を起動します: `openclaw gateway`。

認証は、WebSocket ハンドシェイク中に次を介して提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合の Tailscale Serve アイデンティティヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合の信頼済みプロキシアイデンティティヘッダー

ダッシュボード設定パネルは、現在のブラウザータブセッションと選択された gateway URL のトークンを保持します。パスワードは永続化されません。オンボーディングは通常、初回接続時に共有シークレット認証用の gateway トークンを生成しますが、`gateway.auth.mode` が `"password"` の場合はパスワード認証も機能します。

## デバイスのペアリング (初回接続)

新しいブラウザーまたはデバイスから Control UI に接続すると、Gateway は通常、**1回限りのペアリング承認**を要求します。これは不正アクセスを防ぐためのセキュリティ対策です。

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

ブラウザーがすでにペアリング済みで、読み取りアクセスから書き込み/管理者アクセスへ変更する場合、これはサイレントな再接続ではなく承認アップグレードとして扱われます。OpenClaw は古い承認を有効なまま保持し、より広い権限での再接続をブロックし、新しいスコープセットを明示的に承認するよう求めます。

承認されるとデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り再承認は不要です。トークンローテーションと取り消しについては [デバイス CLI](/ja-JP/cli/devices) を参照してください。

<Note>
- 直接の local loopback ブラウザー接続 (`127.0.0.1` / `localhost`) は自動承認されます。
- `gateway.auth.allowTailscale: true` で、Tailscale アイデンティティが検証され、ブラウザーが自身のデバイスアイデンティティを提示する場合、Tailscale Serve は Control UI オペレーターセッションのペアリング往復を省略できます。
- 直接の Tailnet バインド、LAN ブラウザー接続、デバイスアイデンティティのないブラウザープロファイルでは、引き続き明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイス ID を生成するため、ブラウザーを切り替えたりブラウザーデータを消去したりすると、再ペアリングが必要になります。

</Note>

## 個人アイデンティティ (ブラウザーローカル)

Control UI は、共有セッションでの帰属表示のため、送信メッセージに付加されるブラウザーごとの個人アイデンティティ (表示名とアバター) をサポートします。これはブラウザーストレージに保存され、現在のブラウザープロファイルにスコープされ、実際に送信したメッセージ上の通常のトランスクリプト著者メタデータを除き、他のデバイスへ同期されたりサーバー側に永続化されたりしません。サイトデータを消去するかブラウザーを切り替えると空にリセットされます。

同じブラウザーローカルのパターンは、アシスタントアバターの上書きにも適用されます。アップロードされたアシスタントアバターは、ローカルブラウザー上でのみ gateway が解決したアイデンティティに重ねられ、`config.patch` を介して往復することはありません。共有の `ui.assistant.avatar` 設定フィールドは、スクリプト化された gateway やカスタムダッシュボードなど、このフィールドを直接書き込む非 UI クライアント向けに引き続き利用できます。

## ランタイム設定エンドポイント

Control UI は、ランタイム設定を `/__openclaw/control-ui-config.json` から取得します。そのエンドポイントは、HTTP サーフェスの残り部分と同じ gateway 認証で保護されています。未認証のブラウザーは取得できず、取得に成功するには、すでに有効な gateway トークン/パスワード、Tailscale Serve アイデンティティ、または信頼済みプロキシアイデンティティのいずれかが必要です。

## 言語サポート

Control UI は、初回読み込み時にブラウザーのロケールに基づいて自身をローカライズできます。後で上書きするには、**概要 -> Gateway アクセス -> 言語**を開きます。ロケールピッカーは外観ではなく、Gateway アクセスカードにあります。

- サポートされているロケール: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 英語以外の翻訳はブラウザー内で遅延読み込みされます。
- 選択されたロケールはブラウザーストレージに保存され、以後の訪問で再利用されます。
- 欠落している翻訳キーは英語にフォールバックします。

Docs 翻訳は同じ英語以外のロケールセット向けに生成されますが、docs サイト組み込みの Mintlify 言語ピッカーは、Mintlify が受け付けるロケールコードに制限されています。タイ語 (`th`) とペルシア語 (`fa`) の docs は公開リポジトリで引き続き生成されますが、Mintlify がこれらのコードをサポートするまで、そのピッカーには表示されない場合があります。

## 外観テーマ

外観パネルは、組み込みの Claw、Knot、Dash テーマに加え、ブラウザーローカルの tweakcn インポートスロットを1つ保持します。テーマをインポートするには、[tweakcn エディター](https://tweakcn.com/editor/theme) を開き、テーマを選択または作成して **共有** をクリックし、コピーしたテーマリンクを外観に貼り付けます。インポーターは、`https://tweakcn.com/r/themes/<id>` レジストリ URL、`https://tweakcn.com/editor/theme?theme=amethyst-haze` のようなエディター URL、相対 `/themes/<id>` パス、生のテーマ ID、`amethyst-haze` などのデフォルトテーマ名も受け付けます。

インポートされたテーマは、現在のブラウザープロファイルにのみ保存されます。gateway 設定には書き込まれず、デバイス間で同期されません。インポート済みテーマを置き換えると、その1つのローカルスロットが更新されます。クリアすると、インポート済みテーマが選択されていた場合はアクティブテーマが Claw に戻ります。

## できること (現時点)

<AccordionGroup>
  <Accordion title="チャットと通話">
    - Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`) 経由でモデルとチャットします。
    - ブラウザーのリアルタイムセッションを通じて通話します。OpenAI は直接 WebRTC を使用し、Google Live は WebSocket 上の制限付き1回使用ブラウザートークンを使用し、バックエンド専用リアルタイム音声 plugins は Gateway リレートランスポートを使用します。リレーはプロバイダー認証情報を Gateway に保持し、ブラウザーは `talk.realtime.relay*` RPC を通じてマイク PCM をストリーミングし、より大きな設定済み OpenClaw モデル用に `openclaw_agent_consult` ツール呼び出しを `chat.send` 経由で送り返します。
    - チャット内でツール呼び出しとライブツール出力カードをストリーミングします (エージェントイベント)。

  </Accordion>
  <Accordion title="チャンネル、インスタンス、セッション、dream">
    - チャンネル: 組み込みおよびバンドル/外部 plugin チャンネルのステータス、QR ログイン、チャンネルごとの設定 (`channels.status`, `web.login.*`, `config.patch`)。
    - インスタンス: プレゼンス一覧と更新 (`system-presence`)。
    - セッション: 一覧とセッションごとのモデル/思考/高速/詳細/トレース/reasoning 上書き (`sessions.list`, `sessions.patch`)。
    - Dream: Dreaming ステータス、有効化/無効化トグル、Dream Diary リーダー (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)。

  </Accordion>
  <Accordion title="Cron、skills、ノード、exec 承認">
    - Cron ジョブ: 一覧/追加/編集/実行/有効化/無効化と実行履歴 (`cron.*`)。
    - Skills: ステータス、有効化/無効化、インストール、API キー更新 (`skills.*`)。
    - ノード: 一覧と機能 (`node.list`)。
    - Exec 承認: `exec host=gateway/node` の gateway またはノードの許可リストと確認ポリシーを編集 (`exec.approvals.*`)。

  </Accordion>
  <Accordion title="設定">
    - `~/.openclaw/openclaw.json` を表示/編集します (`config.get`, `config.set`)。
    - 検証付きで適用と再起動を行い (`config.apply`)、最後にアクティブだったセッションを起動します。
    - 書き込みには、同時編集を上書きしないためのベースハッシュガードが含まれます。
    - 書き込み (`config.set`/`config.apply`/`config.patch`) は、送信された設定ペイロード内の参照について、アクティブな SecretRef 解決を事前チェックします。未解決のアクティブな送信済み参照は、書き込み前に拒否されます。
    - スキーマとフォームレンダリング (`config.schema` / `config.schema.lookup`。フィールド `title` / `description`、一致した UI ヒント、直下の子要約、ネストされた object/wildcard/array/composition ノード上の docs メタデータ、利用可能な場合は plugin とチャンネルスキーマを含む)。Raw JSON エディターは、スナップショットが安全な raw 往復を持つ場合にのみ利用できます。
    - スナップショットが raw テキストを安全に往復できない場合、Control UI はフォームモードを強制し、そのスナップショットの Raw モードを無効にします。
    - Raw JSON エディターの「保存済みにリセット」は、平坦化されたスナップショットを再レンダリングするのではなく、raw で作成された形状 (フォーマット、コメント、`$include` レイアウト) を保持するため、スナップショットが安全に往復できる場合、外部編集はリセット後も維持されます。
    - 構造化された SecretRef object 値は、誤って object から文字列へ破損するのを防ぐため、フォームのテキスト入力では読み取り専用で表示されます。

  </Accordion>
  <Accordion title="デバッグ、ログ、更新">
    - デバッグ: ステータス/ヘルス/モデルのスナップショット、イベントログ、手動 RPC 呼び出し (`status`, `health`, `models.list`)。
    - ログ: gateway ファイルログのライブテールとフィルター/エクスポート (`logs.tail`)。
    - 更新: パッケージ/git 更新と再起動を実行し (`update.run`)、再起動レポートを取得した後、再接続後に `update.status` をポーリングして実行中の gateway バージョンを検証します。

  </Accordion>
  <Accordion title="Cron ジョブパネルの注記">
    - 分離ジョブでは、配信のデフォルトは要約の告知です。内部専用の実行にしたい場合は none に切り替えられます。
    - announce が選択されている場合、チャンネル/ターゲットフィールドが表示されます。
    - Webhook モードは、有効な HTTP(S) webhook URL に設定された `delivery.to` とともに `delivery.mode = "webhook"` を使用します。
    - メインセッションジョブでは、webhook と none の配信モードを利用できます。
    - 詳細編集コントロールには、実行後削除、エージェント上書きのクリア、cron exact/stagger オプション、エージェントモデル/思考上書き、ベストエフォート配信トグルが含まれます。
    - フォーム検証はフィールドレベルのエラーとしてインライン表示されます。無効な値があると、修正されるまで保存ボタンが無効になります。
    - 専用 bearer トークンを送信するには `cron.webhookToken` を設定します。省略した場合、webhook は認証ヘッダーなしで送信されます。
    - 非推奨のフォールバック: `notify: true` を持つ保存済みのレガシージョブは、移行されるまで `cron.webhook` を引き続き使用できます。

  </Accordion>
</AccordionGroup>

## チャット動作

<AccordionGroup>
  <Accordion title="送信と履歴のセマンティクス">
    - `chat.send` は **非ブロッキング** です。`{ runId, status: "started" }` ですぐに ack し、応答は `chat` イベント経由でストリーミングされます。
    - チャットのアップロードは画像と動画以外のファイルを受け付けます。画像はネイティブの画像パスを保持し、それ以外のファイルは管理対象メディアとして保存され、履歴には添付リンクとして表示されます。
    - 同じ `idempotencyKey` で再送信すると、実行中は `{ status: "in_flight" }` が返り、完了後は `{ status: "ok" }` が返ります。
    - `chat.history` の応答は UI の安全性のためサイズ制限されます。トランスクリプト項目が大きすぎる場合、Gateway は長いテキストフィールドを切り詰め、重いメタデータブロックを省略し、過大なメッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えることがあります。
    - アシスタント/生成画像は管理対象メディア参照として永続化され、認証済み Gateway メディア URL 経由で返されるため、再読み込みは生の base64 画像ペイロードがチャット履歴応答に残っていることに依存しません。
    - `chat.history` は、表示用のインラインディレクティブタグ（例: `[[reply_to_*]]` と `[[audio_as_voice]]`）、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、切り詰められたツール呼び出しブロックを含む）、漏洩した ASCII/全角のモデル制御トークンも、表示されるアシスタントテキストから取り除き、表示テキスト全体が正確なサイレントトークン `NO_REPLY` / `no_reply` だけのアシスタント項目を省略します。
    - アクティブな送信中と最終的な履歴更新中に、`chat.history` が一時的に古いスナップショットを返した場合でも、チャットビューはローカルの楽観的なユーザー/アシスタントメッセージを表示したままにします。Gateway 履歴が追いつくと、正規のトランスクリプトがそれらのローカルメッセージを置き換えます。
    - ライブ `chat` イベントは配信状態であり、`chat.history` は永続的なセッショントランスクリプトから再構築されます。ツール最終イベントの後、Control UI は履歴を再読み込みし、小さな楽観的テールだけをマージします。トランスクリプト境界は [WebChat](/ja-JP/web/webchat) に記載されています。
    - `chat.inject` はアシスタントメモをセッショントランスクリプトに追加し、UI のみの更新のために `chat` イベントをブロードキャストします（エージェント実行なし、チャネル配信なし）。
    - チャットヘッダーのモデルと思考ピッカーは、`sessions.patch` 経由でアクティブセッションに即座にパッチします。これらは永続的なセッションオーバーライドであり、1 ターン限りの送信オプションではありません。
    - Control UI で `/new` と入力すると、New Chat と同じ新しいダッシュボードセッションが作成され、そこに切り替わります。`/reset` と入力すると、現在のセッションに対する Gateway の明示的なインプレースリセットが維持されます。
    - チャットモデルピッカーは Gateway の設定済みモデルビューを要求します。`agents.defaults.models` が存在する場合、その許可リストがピッカーを駆動します。それ以外の場合、ピッカーは明示的な `models.providers.*.models` 項目と、利用可能な認証を持つプロバイダーを表示します。完全なカタログは、デバッグ用の `models.list` RPC で `view: "all"` を指定すると引き続き利用できます。
    - 新しい Gateway セッション使用状況レポートで高いコンテキスト圧力が示されると、チャットコンポーザー領域にコンテキスト通知が表示され、推奨 Compaction レベルでは通常のセッション Compaction パスを実行するコンパクトボタンが表示されます。古いトークンスナップショットは、Gateway が再び新しい使用状況を報告するまで非表示になります。

  </Accordion>
  <Accordion title="トークモード（ブラウザーリアルタイム）">
    トークモードは登録済みのリアルタイム音声プロバイダーを使用します。OpenAI は `talk.provider: "openai"` と `talk.providers.openai.apiKey` で設定するか、Google は `talk.provider: "google"` と `talk.providers.google.apiKey` で設定します。Voice Call リアルタイムプロバイダー設定はフォールバックとして引き続き再利用できます。ブラウザーが標準のプロバイダー API キーを受け取ることはありません。OpenAI は WebRTC 用の一時的な Realtime クライアントシークレットを受け取ります。Google Live は、ブラウザー WebSocket セッション用の 1 回限りの制約付き Live API 認証トークンを受け取り、指示とツール宣言は Gateway によってそのトークン内にロックされます。バックエンドのリアルタイムブリッジだけを公開するプロバイダーは Gateway リレートランスポートを経由するため、認証情報とベンダーソケットはサーバー側に留まり、ブラウザー音声は認証済み Gateway RPC 経由で移動します。Realtime セッションプロンプトは Gateway によって組み立てられます。`talk.realtime.session` は呼び出し元が指定する指示オーバーライドを受け付けません。

    Chat コンポーザーでは、Talk コントロールはマイクディクテーションボタンの隣にある波形ボタンです。Talk が開始すると、コンポーザーのステータス行には `Connecting Talk...` が表示され、その後、音声が接続されている間は `Talk live`、またはリアルタイムツール呼び出しが `chat.send` 経由で設定済みのより大きなモデルに問い合わせている間は `Asking OpenClaw...` が表示されます。

    メンテナー向けライブスモーク: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` は、OpenAI ブラウザー WebRTC SDP 交換、Google Live の制約付きトークンによるブラウザー WebSocket セットアップ、偽のマイクメディアを使用した Gateway リレーブラウザーアダプターを検証します。このコマンドはプロバイダーステータスのみを出力し、シークレットはログに記録しません。

  </Accordion>
  <Accordion title="停止と中止">
    - **停止** をクリックします（`chat.abort` を呼び出します）。
    - 実行がアクティブな間、通常のフォローアップはキューに入ります。キュー内のメッセージで **誘導** をクリックすると、そのフォローアップが実行中のターンに注入されます。
    - `/stop`（または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` のような単独の中止フレーズ）を入力すると、帯域外で中止します。
    - `chat.abort` は `{ sessionKey }`（`runId` なし）をサポートし、そのセッションのすべてのアクティブな実行を中止できます。

  </Accordion>
  <Accordion title="中止時の部分保持">
    - 実行が中止された場合でも、部分的なアシスタントテキストを UI に表示できます。
    - Gateway は、バッファリングされた出力が存在する場合、中止された部分的なアシスタントテキストをトランスクリプト履歴に永続化します。
    - 永続化された項目には中止メタデータが含まれるため、トランスクリプト利用者は中止された部分出力と通常の完了出力を区別できます。

  </Accordion>
</AccordionGroup>

## PWA インストールと Web Push

Control UI には `manifest.webmanifest` とサービスワーカーが同梱されているため、最新のブラウザーはスタンドアロン PWA としてインストールできます。Web Push により、タブやブラウザーウィンドウが開いていない場合でも、Gateway は通知でインストール済み PWA を起動できます。

| サーフェス                                            | 機能                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA マニフェスト。到達可能になると、ブラウザーは「アプリをインストール」を提示します。 |
| `ui/public/sw.js`                                     | `push` イベントと通知クリックを処理するサービスワーカー。 |
| `push/vapid-keys.json`（OpenClaw 状態ディレクトリ配下） | Web Push ペイロードの署名に使用される、自動生成された VAPID 鍵ペア。 |
| `push/web-push-subscriptions.json`                    | 永続化されたブラウザーサブスクリプションエンドポイント。 |

キーを固定したい場合（マルチホストデプロイ、シークレットローテーション、テストなど）は、Gateway プロセス上の環境変数で VAPID 鍵ペアをオーバーライドします。

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（デフォルトは `mailto:openclaw@localhost`）

Control UI は、ブラウザーサブスクリプションの登録とテストに、次のスコープ制限付き Gateway メソッドを使用します。

- `push.web.vapidPublicKey` — アクティブな VAPID 公開鍵を取得します。
- `push.web.subscribe` — `endpoint` と `keys.p256dh`/`keys.auth` を登録します。
- `push.web.unsubscribe` — 登録済みエンドポイントを削除します。
- `push.web.test` — 呼び出し元のサブスクリプションにテスト通知を送信します。

<Note>
Web Push は iOS APNS リレーパス（リレー支援 push については [設定](/ja-JP/gateway/configuration) を参照）および既存の `push.test` メソッドとは独立しています。これらはネイティブモバイルペアリングを対象にします。
</Note>

## ホスト型埋め込み

アシスタントメッセージは `[embed ...]` ショートコードでホスト型 Web コンテンツをインライン表示できます。iframe サンドボックスポリシーは `gateway.controlUi.embedSandbox` によって制御されます。

<Tabs>
  <Tab title="strict">
    ホスト型埋め込み内でのスクリプト実行を無効にします。
  </Tab>
  <Tab title="scripts（デフォルト）">
    オリジン分離を維持しながらインタラクティブな埋め込みを許可します。これはデフォルトであり、通常は自己完結型のブラウザーゲーム/ウィジェットには十分です。
  </Tab>
  <Tab title="trusted">
    意図的により強い権限を必要とする同一サイトドキュメント向けに、`allow-scripts` に加えて `allow-same-origin` を追加します。
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

絶対外部 `http(s)` 埋め込み URL はデフォルトでブロックされたままです。意図的に `[embed url="https://..."]` でサードパーティページを読み込みたい場合は、`gateway.controlUi.allowExternalEmbedUrls: true` を設定します。

## チャットメッセージ幅

グループ化されたチャットメッセージには、読みやすいデフォルトの最大幅が使用されます。ワイドモニター環境では、`gateway.controlUi.chatMessageMaxWidth` を設定することで、同梱 CSS にパッチせずに上書きできます。

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
    Gateway をループバックに維持し、Tailscale Serve で HTTPS プロキシさせます。

    ```bash
    openclaw gateway --tailscale serve
    ```

    開く:

    - `https://<magicdns>/`（または設定済みの `gateway.controlUi.basePath`）

    デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket Serve リクエストは Tailscale ID ヘッダー（`tailscale-user-login`）経由で認証できます。OpenClaw は `x-forwarded-for` アドレスを `tailscale whois` で解決してヘッダーと照合することで ID を検証し、リクエストが Tailscale の `x-forwarded-*` ヘッダー付きでループバックに到達した場合にのみ受け付けます。ブラウザーデバイス ID を持つ Control UI オペレーターセッションでは、この検証済み Serve パスはデバイスペアリングの往復もスキップします。デバイスなしのブラウザーとノードロール接続は、通常のデバイスチェックに従います。Serve トラフィックでも明示的な共有シークレット認証情報を要求したい場合は、`gateway.auth.allowTailscale: false` を設定します。その後、`gateway.auth.mode: "token"` または `"password"` を使用します。

    その非同期 Serve ID パスでは、同じクライアント IP と認証スコープの失敗した認証試行は、レート制限の書き込み前に直列化されます。そのため、同じブラウザーからの同時の不正な再試行では、2 つの単純な不一致が並列に競合する代わりに、2 回目のリクエストで `retry later` が表示されることがあります。

    <Warning>
    トークンなしの Serve 認証は、gateway ホストが信頼されていることを前提にします。そのホスト上で信頼できないローカルコードが実行される可能性がある場合は、トークン/パスワード認証を要求してください。
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

## 安全でない HTTP

プレーン HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、ブラウザーは **非セキュアコンテキスト** で実行され、WebCrypto をブロックします。デフォルトでは、OpenClaw はデバイス ID のない Control UI 接続を **ブロック** します。

記載されている例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost のみの安全でない HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` 経由で成功したオペレーター Control UI 認証
- 緊急用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

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

    `allowInsecureAuth` はローカル互換性トグルのみです。

    - 非セキュアな HTTP コンテキストで、localhost の Control UI セッションがデバイス ID なしで続行できるようにします。
    - ペアリングチェックはバイパスしません。
    - リモート (非 localhost) のデバイス ID 要件は緩和しません。

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
    `dangerouslyDisableDeviceAuth` は Control UI のデバイス ID チェックを無効化し、深刻なセキュリティ低下を招きます。緊急使用後は速やかに元に戻してください。
    </Warning>

  </Accordion>
  <Accordion title="信頼済みプロキシの注意事項">
    - 信頼済みプロキシ認証に成功すると、デバイス ID なしで **オペレーター** Control UI セッションを許可できます。
    - これはノードロールの Control UI セッションには適用されません。
    - 同一ホストのループバックリバースプロキシでも、信頼済みプロキシ認証は満たしません。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照してください。

  </Accordion>
</AccordionGroup>

HTTPS セットアップのガイダンスについては、[Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## コンテンツセキュリティポリシー

Control UI には厳格な `img-src` ポリシーが同梱されています。許可されるのは、**同一オリジン** のアセット、`data:` URL、ローカルで生成された `blob:` URL のみです。リモートの `http(s)` およびプロトコル相対の画像 URL はブラウザーによって拒否され、ネットワーク取得は発生しません。

実際には、これは次のことを意味します。

- 相対パス (たとえば `/avatars/<id>`) で提供されるアバターや画像は引き続き表示されます。UI が取得してローカルの `blob:` URL に変換する、認証付きアバタールートも含まれます。
- インラインの `data:image/...` URL は引き続き表示されます (プロトコル内ペイロードに便利です)。
- Control UI によって作成されたローカルの `blob:` URL は引き続き表示されます。
- チャンネルメタデータが出力するリモートアバター URL は、Control UI のアバターヘルパーで取り除かれ、組み込みのロゴ/バッジに置き換えられます。そのため、侵害された、または悪意のあるチャンネルが、オペレーターのブラウザーから任意のリモート画像取得を強制することはできません。

この動作を得るために変更は不要です。常に有効で、設定はできません。

## アバタールート認証

Gateway 認証が設定されている場合、Control UI のアバターエンドポイントには API の他の部分と同じ Gateway トークンが必要です。

- `GET /avatar/<agentId>` は認証済み呼び出し元にのみアバター画像を返します。`GET /avatar/<agentId>?meta=1` は同じルールでアバターメタデータを返します。
- どちらのルートへの未認証リクエストも拒否されます (隣接するアシスタントメディアルートと同じです)。これにより、それ以外は保護されているホストで、アバタールートがエージェント ID を漏らすことを防ぎます。
- Control UI 自体は、アバター取得時に Gateway トークンを bearer ヘッダーとして転送し、認証済みの blob URL を使うため、画像はダッシュボードで引き続き表示されます。

Gateway 認証を無効化した場合 (共有ホストでは非推奨)、Gateway の他の部分と同様に、アバタールートも未認証になります。

## アシスタントメディアルート認証

Gateway 認証が設定されている場合、アシスタントのローカルメディアプレビューは 2 段階のルートを使用します。

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` には通常の Control UI オペレーター認証が必要です。ブラウザーは可用性を確認するとき、Gateway トークンを bearer ヘッダーとして送信します。
- 成功したメタデータレスポンスには、その正確なソースパスにスコープされた短命の `mediaTicket` が含まれます。
- ブラウザーでレンダリングされる画像、音声、動画、ドキュメントの URL は、有効な Gateway トークンやパスワードの代わりに `mediaTicket=<ticket>` を使用します。チケットはすぐに期限切れになり、別のソースを認可することはできません。

これにより、再利用可能な Gateway 認証情報を可視のメディア URL に入れずに、通常のメディアレンダリングとブラウザー標準のメディア要素との互換性を保てます。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを提供します。次でビルドします。

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

Control UI は静的ファイルです。WebSocket ターゲットは設定可能で、HTTP オリジンと異なっていてもかまいません。ローカルでは Vite 開発サーバーを使い、Gateway は別の場所で実行したい場合に便利です。

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

    任意の 1 回限りの認証 (必要な場合):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="注意事項">
    - `gatewayUrl` は読み込み後に localStorage に保存され、URL から削除されます。
    - `gatewayUrl` で完全な `ws://` または `wss://` エンドポイントを渡す場合は、ブラウザーがクエリ文字列を正しく解析できるように `gatewayUrl` の値を URL エンコードしてください。
    - `token` は可能な限り URL フラグメント (`#token=...`) で渡してください。フラグメントはサーバーに送信されないため、リクエストログや Referer からの漏えいを避けられます。従来の `?token=` クエリパラメーターも互換性のために一度だけ取り込まれますが、フォールバックとしてのみ扱われ、ブートストラップ直後に削除されます。
    - `password` はメモリ内にのみ保持されます。
    - `gatewayUrl` が設定されている場合、UI は設定や環境の認証情報にフォールバックしません。`token` (または `password`) を明示的に指定してください。明示的な認証情報がない場合はエラーです。
    - Gateway が TLS の背後にある場合 (Tailscale Serve、HTTPS プロキシなど) は `wss://` を使用してください。
    - `gatewayUrl` は、クリックジャッキングを防ぐため、トップレベルウィンドウ (埋め込みではない) でのみ受け付けられます。
    - 非ループバックの Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を明示的に設定する必要があります (完全なオリジン)。これにはリモート開発セットアップも含まれます。
    - Gateway の起動時に、有効なランタイムのバインドとポートから `http://localhost:<port>` や `http://127.0.0.1:<port>` などのローカルオリジンがシードされる場合がありますが、リモートブラウザーのオリジンには引き続き明示的なエントリが必要です。
    - 厳密に制御されたローカルテストを除き、`gateway.controlUi.allowedOrigins: ["*"]` は使用しないでください。これは「使用中のホストに一致させる」ではなく、任意のブラウザーオリジンを許可することを意味します。
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
- [ヘルスチェック](/ja-JP/gateway/health) — Gateway ヘルス監視
- [TUI](/ja-JP/web/tui) — ターミナルユーザーインターフェイス
- [WebChat](/ja-JP/web/webchat) — ブラウザーベースのチャットインターフェイス
