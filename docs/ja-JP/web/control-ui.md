---
read_when:
    - ブラウザから Gateway を操作したい
    - SSHトンネルなしでTailnetにアクセスしたい場合
sidebarTitle: Control UI
summary: Gateway 向けのブラウザベースの制御 UI（チャット、ノード、設定）
title: コントロール UI
x-i18n:
    generated_at: "2026-05-04T09:37:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b68b5203b369de6a3354a7e7442ee38ee790875b2d7054b0c8ec997098fd9de
    source_path: web/control-ui.md
    workflow: 16
---

Control UI は、Gateway によって提供される小さな **Vite + Lit** シングルページアプリです。

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します（例: `/openclaw`）

これは同じポート上の **Gateway WebSocket** と直接通信します。

## クイックオープン（ローカル）

Gateway が同じコンピューター上で実行されている場合は、以下を開きます。

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）

ページの読み込みに失敗する場合は、先に Gateway を起動します: `openclaw gateway`。

認証は WebSocket ハンドシェイク中に以下を通じて提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合の Tailscale Serve ID ヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合の信頼済みプロキシ ID ヘッダー

ダッシュボード設定パネルは、現在のブラウザータブセッションと選択された Gateway URL 用のトークンを保持します。パスワードは永続化されません。オンボーディングでは通常、初回接続時に共有シークレット認証用の Gateway トークンが生成されますが、`gateway.auth.mode` が `"password"` の場合はパスワード認証も機能します。

## デバイスペアリング（初回接続）

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

ブラウザーが変更された認証詳細（ロール/スコープ/公開鍵）でペアリングを再試行すると、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認前に `openclaw devices list` を再実行してください。

ブラウザーがすでにペアリング済みで、読み取りアクセスから書き込み/管理者アクセスに変更した場合、これはサイレントな再接続ではなく承認アップグレードとして扱われます。OpenClaw は古い承認を有効なまま保持し、より広い権限での再接続をブロックし、新しいスコープセットを明示的に承認するよう求めます。

承認されると、そのデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り再承認は不要です。トークンのローテーションと取り消しについては、[デバイス CLI](/ja-JP/cli/devices) を参照してください。

<Note>
- 直接の local loopback ブラウザー接続（`127.0.0.1` / `localhost`）は自動承認されます。
- Tailscale Serve は、`gateway.auth.allowTailscale: true` で Tailscale ID が検証され、ブラウザーがデバイス ID を提示する場合、Control UI オペレーターセッションのペアリング往復を省略できます。
- 直接の Tailnet バインド、LAN ブラウザー接続、デバイス ID のないブラウザープロファイルでは、引き続き明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイス ID を生成するため、ブラウザーを切り替えたりブラウザーデータを消去したりすると、再ペアリングが必要になります。

</Note>

## 個人 ID（ブラウザーローカル）

Control UI は、共有セッションでの帰属表示のために送信メッセージへ付与される、ブラウザーごとの個人 ID（表示名とアバター）をサポートします。これはブラウザーストレージに保存され、現在のブラウザープロファイルにスコープされます。他のデバイスへ同期されず、実際に送信したメッセージ上の通常のトランスクリプト作成者メタデータを超えてサーバー側に永続化されることもありません。サイトデータを消去したりブラウザーを切り替えたりすると、空の状態にリセットされます。

同じブラウザーローカルのパターンは、アシスタントアバターのオーバーライドにも適用されます。アップロードされたアシスタントアバターは、ローカルブラウザー上でのみ Gateway が解決した ID に重ねて表示され、`config.patch` を通じて往復することはありません。共有の `ui.assistant.avatar` 設定フィールドは、そのフィールドを直接書き込む非 UI クライアント（スクリプト化された Gateway やカスタムダッシュボードなど）向けに引き続き利用できます。

## ランタイム設定エンドポイント

Control UI は、ランタイム設定を `/__openclaw/control-ui-config.json` から取得します。このエンドポイントは、HTTP サーフェスの他の部分と同じ Gateway 認証で保護されています。未認証のブラウザーは取得できず、取得が成功するには、すでに有効な Gateway トークン/パスワード、Tailscale Serve ID、または信頼済みプロキシ ID のいずれかが必要です。

## 言語サポート

Control UI は、初回読み込み時にブラウザーロケールに基づいて自分自身をローカライズできます。後で上書きするには、**概要 -> Gateway アクセス -> 言語**を開きます。ロケールピッカーは外観ではなく Gateway アクセスカード内にあります。

- サポート対象ロケール: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 英語以外の翻訳はブラウザーで遅延読み込みされます。
- 選択されたロケールはブラウザーストレージに保存され、以後のアクセスで再利用されます。
- 不足している翻訳キーは英語にフォールバックします。

ドキュメント翻訳は同じ英語以外のロケールセット向けに生成されますが、ドキュメントサイトに組み込まれている Mintlify 言語ピッカーは、Mintlify が受け入れるロケールコードに限定されます。タイ語（`th`）とペルシア語（`fa`）のドキュメントは公開リポジトリ内で引き続き生成されますが、Mintlify がこれらのコードをサポートするまで、そのピッカーには表示されない場合があります。

## 外観テーマ

外観パネルには、組み込みの Claw、Knot、Dash テーマに加えて、ブラウザーローカルの tweakcn インポートスロットが 1 つあります。テーマをインポートするには、[tweakcn editor](https://tweakcn.com/editor/theme) を開き、テーマを選択または作成し、**Share** をクリックして、コピーしたテーマリンクを外観に貼り付けます。インポーターは、`https://tweakcn.com/r/themes/<id>` レジストリ URL、`https://tweakcn.com/editor/theme?theme=amethyst-haze` のようなエディター URL、相対 `/themes/<id>` パス、生のテーマ ID、`amethyst-haze` などのデフォルトテーマ名も受け付けます。

インポートされたテーマは現在のブラウザープロファイルにのみ保存されます。Gateway 設定には書き込まれず、デバイス間で同期されません。インポート済みテーマを置き換えると、1 つのローカルスロットが更新されます。消去すると、インポート済みテーマが選択されていた場合はアクティブテーマが Claw に戻ります。

## できること（現在）

<AccordionGroup>
  <Accordion title="チャットと会話">
    - Gateway WS（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）経由でモデルとチャットします。
    - ブラウザーのリアルタイムセッションを通じて会話します。OpenAI は直接 WebRTC を使用し、Google Live は WebSocket 経由の制約付き 1 回限りのブラウザートークンを使用します。バックエンド専用のリアルタイム音声 Plugin は Gateway リレートランスポートを使用します。リレーはプロバイダー認証情報を Gateway 上に保持し、ブラウザーは `talk.realtime.relay*` RPC を通じてマイク PCM をストリーミングし、より大きな設定済み OpenClaw モデル用に `openclaw_agent_consult` ツール呼び出しを `chat.send` 経由で送り返します。
    - チャット内でツール呼び出しとライブツール出力カードをストリーミングします（エージェントイベント）。

  </Accordion>
  <Accordion title="チャネル、インスタンス、セッション、Dreams">
    - チャネル: 組み込みおよびバンドル/外部 Plugin チャネルのステータス、QR ログイン、チャネルごとの設定（`channels.status`, `web.login.*`, `config.patch`）。
    - インスタンス: プレゼンス一覧と更新（`system-presence`）。
    - セッション: 一覧とセッションごとのモデル/思考/高速/詳細/トレース/推論オーバーライド（`sessions.list`, `sessions.patch`）。
    - Dreams: Dreaming ステータス、有効化/無効化トグル、Dream Diary リーダー（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）。

  </Accordion>
  <Accordion title="Cron、Skills、ノード、exec 承認">
    - Cron ジョブ: 一覧/追加/編集/実行/有効化/無効化と実行履歴（`cron.*`）。
    - Skills: ステータス、有効化/無効化、インストール、API キー更新（`skills.*`）。
    - ノード: 一覧と機能（`node.list`）。
    - exec 承認: Gateway またはノードの許可リストと `exec host=gateway/node` の確認ポリシーを編集します（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="設定">
    - `~/.openclaw/openclaw.json` を表示/編集します（`config.get`, `config.set`）。
    - 検証付きで適用して再起動し（`config.apply`）、最後のアクティブセッションを起動します。
    - 書き込みには、同時編集による上書きを防ぐベースハッシュガードが含まれます。
    - 書き込み（`config.set`/`config.apply`/`config.patch`）は、送信された設定ペイロード内の参照について、アクティブな SecretRef 解決を事前確認します。未解決のアクティブな送信済み参照は、書き込み前に拒否されます。
    - スキーマとフォームレンダリング（`config.schema` / `config.schema.lookup`、フィールド `title` / `description`、一致した UI ヒント、直下の子要約、ネストされたオブジェクト/ワイルドカード/配列/合成ノード上のドキュメントメタデータ、および利用可能な場合は Plugin + チャネルスキーマを含む）。Raw JSON エディターは、スナップショットが安全な raw 往復を持つ場合にのみ利用できます。
    - スナップショットが raw テキストを安全に往復できない場合、Control UI はそのスナップショットでフォームモードを強制し、Raw モードを無効化します。
    - Raw JSON エディターの「保存済みにリセット」は、フラット化されたスナップショットを再レンダリングする代わりに、raw で作成された形状（フォーマット、コメント、`$include` レイアウト）を保持するため、スナップショットが安全に往復できる場合、外部編集はリセット後も維持されます。
    - 構造化された SecretRef オブジェクト値は、偶発的なオブジェクトから文字列への破損を防ぐため、フォームのテキスト入力では読み取り専用でレンダリングされます。

  </Accordion>
  <Accordion title="デバッグ、ログ、更新">
    - デバッグ: ステータス/ヘルス/モデルのスナップショット、イベントログ、手動 RPC 呼び出し（`status`, `health`, `models.list`）。
    - イベントログには、Control UI の更新/RPC タイミングに加えて、ブラウザーがこれらの PerformanceObserver エントリー型を公開している場合、長いアニメーションフレームや長いタスクに関するブラウザー応答性エントリーが含まれます。
    - ログ: フィルター/エクスポート付きの Gateway ファイルログのライブ tail（`logs.tail`）。
    - 更新: 再起動レポート付きでパッケージ/git 更新と再起動を実行し（`update.run`）、再接続後に `update.status` をポーリングして、実行中の Gateway バージョンを確認します。

  </Accordion>
  <Accordion title="Cron ジョブパネルの注記">
    - 分離ジョブでは、配信のデフォルトは要約の通知です。内部専用の実行にしたい場合は、なしに切り替えられます。
    - 通知が選択されている場合、チャネル/ターゲットフィールドが表示されます。
    - Webhook モードでは、有効な HTTP(S) Webhook URL に `delivery.to` を設定し、`delivery.mode = "webhook"` を使用します。
    - メインセッションジョブでは、Webhook となしの配信モードを利用できます。
    - 詳細編集コントロールには、実行後削除、エージェントオーバーライドのクリア、cron の exact/stagger オプション、エージェントのモデル/思考オーバーライド、ベストエフォート配信トグルが含まれます。
    - フォーム検証はフィールドレベルのエラーとともにインラインで表示されます。不正な値がある場合、修正されるまで保存ボタンは無効になります。
    - 専用の bearer token を送信するには `cron.webhookToken` を設定します。省略した場合、Webhook は認証ヘッダーなしで送信されます。
    - 非推奨のフォールバック: `notify: true` を持つ保存済みレガシージョブは、移行されるまで引き続き `cron.webhook` を使用できます。

  </Accordion>
</AccordionGroup>

## チャットの動作

<AccordionGroup>
  <Accordion title="送信と履歴のセマンティクス">
    - `chat.send` は**ノンブロッキング**です。`{ runId, status: "started" }` で即座に ack し、応答は `chat` イベント経由でストリーミングされます。
    - チャットアップロードは画像と動画以外のファイルを受け付けます。画像はネイティブ画像パスを保持します。その他のファイルは管理対象メディアとして保存され、履歴には添付リンクとして表示されます。
    - 同じ `idempotencyKey` で再送信すると、実行中は `{ status: "in_flight" }`、完了後は `{ status: "ok" }` が返ります。
    - `chat.history` の応答は UI の安全性のためサイズ制限されます。トランスクリプトエントリが大きすぎる場合、Gateway は長いテキストフィールドを切り詰め、重いメタデータブロックを省略し、サイズ超過メッセージをプレースホルダー (`[chat.history omitted: message too large]`) に置き換えることがあります。
    - アシスタント/生成画像は管理対象メディア参照として永続化され、認証済み Gateway メディア URL 経由で返されます。そのため、再読み込みは raw base64 画像ペイロードがチャット履歴応答に残っていることに依存しません。
    - `chat.history` は、表示用のインラインディレクティブタグ (たとえば `[[reply_to_*]]` と `[[audio_as_voice]]`)、プレーンテキストのツール呼び出し XML ペイロード (`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、切り詰められたツール呼び出しブロックを含む)、漏えいした ASCII/全角のモデル制御トークンも表示されるアシスタントテキストから取り除き、表示テキスト全体が正確なサイレントトークン `NO_REPLY` / `no_reply` だけであるアシスタントエントリを省略します。
    - アクティブな送信中と最後の履歴更新中、`chat.history` が一時的に古いスナップショットを返しても、チャットビューはローカルの楽観的なユーザー/アシスタントメッセージを表示し続けます。Gateway 履歴が追いつくと、正規のトランスクリプトがそれらのローカルメッセージを置き換えます。
    - ライブ `chat` イベントは配信状態であり、`chat.history` は永続的なセッショントランスクリプトから再構築されます。ツール最終イベントの後、Control UI は履歴を再読み込みし、小さな楽観的テールだけをマージします。トランスクリプト境界は [WebChat](/ja-JP/web/webchat) に記載されています。
    - `chat.inject` はアシスタントノートをセッショントランスクリプトに追加し、UI 専用更新用の `chat` イベントをブロードキャストします (エージェント実行もチャネル配信もありません)。
    - チャットヘッダーはセッションピッカーの前にエージェントフィルターを表示し、セッションピッカーは選択中のエージェントにスコープされます。エージェントを切り替えると、そのエージェントに結び付いたセッションだけが表示され、保存済みダッシュボードセッションがまだない場合はそのエージェントのメインセッションにフォールバックします。
    - デスクトップ幅では、チャットコントロールはコンパクトな 1 行に収まり、トランスクリプトを下にスクロールしている間は折りたたまれます。上にスクロールする、先頭に戻る、または末尾に到達すると、コントロールが復元されます。
    - 連続する重複したテキストのみのメッセージは、件数バッジ付きの 1 つの吹き出しとしてレンダリングされます。画像、添付、ツール出力、または canvas プレビューを含むメッセージは折りたたまれません。
    - チャットヘッダーのモデルピッカーと思考ピッカーは、`sessions.patch` 経由でアクティブセッションを即座にパッチします。これらは永続的なセッションオーバーライドであり、1 ターン限定の送信オプションではありません。
    - Control UI で `/new` と入力すると、New Chat と同じ新しいダッシュボードセッションを作成して切り替えます。`/reset` と入力すると、現在のセッションに対する Gateway の明示的なインプレースリセットを維持します。
    - チャットモデルピッカーは Gateway の設定済みモデルビューを要求します。`agents.defaults.models` が存在する場合、その許可リストがピッカーを駆動します。それ以外の場合、ピッカーは明示的な `models.providers.*.models` エントリと、使用可能な認証を持つプロバイダーを表示します。完全なカタログは、デバッグ用の `models.list` RPC で `view: "all"` を指定すると引き続き利用できます。
    - 新しい Gateway セッション使用量レポートが高いコンテキスト圧力を示す場合、チャットコンポーザー領域にコンテキスト通知が表示され、推奨 Compaction レベルでは通常のセッション Compaction パスを実行するコンパクトなボタンが表示されます。古いトークンスナップショットは、Gateway が新しい使用量を再び報告するまで非表示になります。

  </Accordion>
  <Accordion title="トークモード (ブラウザーリアルタイム)">
    トークモードは登録済みのリアルタイム音声プロバイダーを使用します。OpenAI は `talk.provider: "openai"` と `talk.providers.openai.apiKey` で設定し、Google は `talk.provider: "google"` と `talk.providers.google.apiKey` で設定します。Voice Call のリアルタイムプロバイダー設定は、引き続きフォールバックとして再利用できます。ブラウザーは標準プロバイダー API キーを受け取りません。OpenAI は WebRTC 用の一時的な Realtime クライアントシークレットを受け取ります。Google Live は、ブラウザー WebSocket セッション用の 1 回限りの制約付き Live API 認証トークンを受け取り、命令とツール宣言は Gateway によってトークン内に固定されます。バックエンドリアルタイムブリッジだけを公開するプロバイダーは Gateway リレートランスポート経由で実行されるため、認証情報とベンダーソケットはサーバー側に留まり、ブラウザー音声は認証済み Gateway RPC 経由で移動します。Realtime セッションプロンプトは Gateway によって組み立てられます。`talk.realtime.session` は呼び出し元提供の命令オーバーライドを受け付けません。

    チャットコンポーザーでは、トークコントロールはマイクディクテーションボタンの横にある波形ボタンです。トークが開始すると、コンポーザーステータス行にはまず `Connecting Talk...` が表示され、その後、音声が接続されている間は `Talk live`、リアルタイムツール呼び出しが `chat.send` 経由で設定済みのより大きなモデルに問い合わせている間は `Asking OpenClaw...` が表示されます。

    メンテナー向けライブスモーク: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` は、OpenAI ブラウザー WebRTC SDP 交換、Google Live 制約付きトークンのブラウザー WebSocket セットアップ、偽のマイクメディアを使った Gateway リレーブラウザーアダプターを検証します。このコマンドはプロバイダーステータスだけを出力し、シークレットはログに記録しません。

  </Accordion>
  <Accordion title="停止と中止">
    - **Stop** をクリックします (`chat.abort` を呼び出します)。
    - 実行がアクティブな間、通常のフォローアップはキューに入ります。キュー内のメッセージで **Steer** をクリックすると、そのフォローアップを実行中のターンに注入します。
    - `/stop` (または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` のような単独の中止フレーズ) を入力すると、帯域外で中止します。
    - `chat.abort` は、そのセッションのすべてのアクティブな実行を中止するために `{ sessionKey }` (`runId` なし) をサポートします。

  </Accordion>
  <Accordion title="中止時の部分保持">
    - 実行が中止された場合でも、部分的なアシスタントテキストを UI に表示できます。
    - Gateway は、バッファーされた出力が存在する場合、中止された部分的なアシスタントテキストをトランスクリプト履歴に永続化します。
    - 永続化されたエントリには中止メタデータが含まれるため、トランスクリプト利用側は中止部分と通常の完了出力を区別できます。

  </Accordion>
</AccordionGroup>

## PWA インストールと Web プッシュ

Control UI は `manifest.webmanifest` とサービスワーカーを同梱しているため、最新ブラウザーはこれをスタンドアロン PWA としてインストールできます。Web プッシュにより、タブやブラウザーウィンドウが開いていない場合でも、Gateway はインストール済み PWA を通知で起動できます。

| 対象                                                  | 内容                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA マニフェスト。到達可能になると、ブラウザーが「アプリをインストール」を提示します。 |
| `ui/public/sw.js`                                     | `push` イベントと通知クリックを処理するサービスワーカー。          |
| `push/vapid-keys.json` (OpenClaw 状態ディレクトリ配下) | Web プッシュペイロードの署名に使う自動生成 VAPID キーペア。        |
| `push/web-push-subscriptions.json`                    | 永続化されたブラウザーサブスクリプションエンドポイント。           |

キーを固定したい場合 (マルチホストデプロイ、シークレットローテーション、テストなど) は、Gateway プロセス上の環境変数で VAPID キーペアをオーバーライドします。

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (デフォルトは `mailto:openclaw@localhost`)

Control UI は、ブラウザーサブスクリプションの登録とテストに、これらのスコープ制限付き Gateway メソッドを使用します。

- `push.web.vapidPublicKey` — アクティブな VAPID 公開鍵を取得します。
- `push.web.subscribe` — `endpoint` と `keys.p256dh`/`keys.auth` を登録します。
- `push.web.unsubscribe` — 登録済みエンドポイントを削除します。
- `push.web.test` — 呼び出し元のサブスクリプションにテスト通知を送信します。

<Note>
Web プッシュは、iOS APNS リレーパス (リレー backed プッシュについては [設定](/ja-JP/gateway/configuration) を参照) および既存の `push.test` メソッドとは独立しています。これらはネイティブモバイルペアリングを対象にしています。
</Note>

## ホスト型埋め込み

アシスタントメッセージは、`[embed ...]` ショートコードでホストされた Web コンテンツをインラインレンダリングできます。iframe サンドボックスポリシーは `gateway.controlUi.embedSandbox` で制御されます。

<Tabs>
  <Tab title="strict">
    ホスト型埋め込み内でのスクリプト実行を無効にします。
  </Tab>
  <Tab title="scripts (デフォルト)">
    オリジン分離を維持しながらインタラクティブな埋め込みを許可します。これがデフォルトであり、通常は自己完結型のブラウザーゲーム/ウィジェットには十分です。
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
埋め込みドキュメントが本当に同一オリジン動作を必要とする場合にのみ、`trusted` を使用してください。ほとんどのエージェント生成ゲームやインタラクティブ canvas では、`scripts` の方が安全です。
</Warning>

絶対外部 `http(s)` 埋め込み URL は、デフォルトでは引き続きブロックされます。意図的に `[embed url="https://..."]` でサードパーティページを読み込みたい場合は、`gateway.controlUi.allowExternalEmbedUrls: true` を設定します。

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

値はブラウザーに届く前に検証されます。サポートされる値には、`960px` や `82%` のような単純な長さとパーセンテージに加え、制約付きの `min(...)`、`max(...)`、`clamp(...)`、`calc(...)`、`fit-content(...)` 幅式が含まれます。

## tailnet アクセス (推奨)

<Tabs>
  <Tab title="統合 Tailscale Serve (推奨)">
    Gateway を local loopback に置いたまま、Tailscale Serve に HTTPS でプロキシさせます。

    ```bash
    openclaw gateway --tailscale serve
    ```

    開きます。

    - `https://<magicdns>/` (または設定済みの `gateway.controlUi.basePath`)

    デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket Serve リクエストは Tailscale ID ヘッダー (`tailscale-user-login`) 経由で認証できます。OpenClaw は `tailscale whois` で `x-forwarded-for` アドレスを解決し、それをヘッダーと照合することで ID を検証します。また、リクエストが Tailscale の `x-forwarded-*` ヘッダー付きで local loopback に到達した場合にのみ、これらを受け入れます。ブラウザーデバイス ID を持つ Control UI オペレーターセッションでは、この検証済み Serve パスはデバイスペアリングの往復もスキップします。デバイスなしブラウザーとノードロール接続は、引き続き通常のデバイスチェックに従います。Serve トラフィックでも明示的な共有シークレット認証情報を要求したい場合は、`gateway.auth.allowTailscale: false` を設定します。そのうえで `gateway.auth.mode: "token"` または `"password"` を使用します。

    その非同期 Serve ID パスでは、同じクライアント IP と認証スコープに対する失敗した認証試行は、レート制限の書き込み前に直列化されます。そのため、同じブラウザーからの同時の不正な再試行では、2 つの単純な不一致が並列に競合する代わりに、2 回目のリクエストで `retry later` が表示されることがあります。

    <Warning>
    トークンなしの Serve 認証は、gateway ホストが信頼されていることを前提とします。そのホスト上で信頼できないローカルコードが実行される可能性がある場合は、トークン/パスワード認証を要求してください。
    </Warning>

  </Tab>
  <Tab title="tailnet + トークンにバインド">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    次に開きます。

    - `http://<tailscale-ip>:18789/` (または設定済みの `gateway.controlUi.basePath`)

    一致する共有シークレットを UI 設定に貼り付けます（`connect.params.auth.token` または `connect.params.auth.password` として送信されます）。

  </Tab>
</Tabs>

## 安全でない HTTP

プレーン HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、ブラウザーは **非セキュアコンテキスト** で実行され、WebCrypto をブロックします。デフォルトでは、OpenClaw はデバイス ID なしの Control UI 接続を **ブロック** します。

文書化されている例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost 専用の安全でない HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` によるオペレーター Control UI 認証の成功
- 緊急用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS（Tailscale Serve）を使うか、UI をローカルで開きます。

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（Gateway ホスト上）

<AccordionGroup>
  <Accordion title="安全でない認証トグルの挙動">
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
    - ペアリングチェックをバイパスしません。
    - リモート（localhost 以外）のデバイス ID 要件を緩和しません。

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
    `dangerouslyDisableDeviceAuth` は Control UI のデバイス ID チェックを無効化し、重大なセキュリティ低下を招きます。緊急使用後は速やかに戻してください。
    </Warning>

  </Accordion>
  <Accordion title="信頼済みプロキシに関する注記">
    - 信頼済みプロキシ認証に成功すると、デバイス ID なしで **オペレーター** Control UI セッションを許可できます。
    - これはノードロールの Control UI セッションには適用されません。
    - 同一ホストの loopback リバースプロキシは、それでも信頼済みプロキシ認証を満たしません。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照してください。

  </Accordion>
</AccordionGroup>

HTTPS セットアップのガイダンスについては [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## コンテンツセキュリティポリシー

Control UI には厳格な `img-src` ポリシーが付属しています。許可されるのは **同一オリジン** のアセット、`data:` URL、ローカルで生成された `blob:` URL のみです。リモートの `http(s)` およびプロトコル相対の画像 URL はブラウザーによって拒否され、ネットワークフェッチは発行されません。

実際には、これは次のことを意味します。

- 相対パス（例: `/avatars/<id>`）で提供されるアバターと画像は、UI がフェッチしてローカル `blob:` URL に変換する認証済みアバタールートを含めて、引き続きレンダリングされます。
- インラインの `data:image/...` URL は引き続きレンダリングされます（プロトコル内ペイロードに有用です）。
- Control UI によって作成されたローカル `blob:` URL は引き続きレンダリングされます。
- チャンネルメタデータによって出力されたリモートアバター URL は、Control UI のアバターヘルパーで除去され、組み込みロゴ/バッジに置き換えられます。そのため、侵害された、または悪意のあるチャンネルが、オペレーターのブラウザーから任意のリモート画像フェッチを強制することはできません。

この挙動を得るために何かを変更する必要はありません。常に有効であり、設定できません。

## アバタールート認証

Gateway 認証が設定されている場合、Control UI のアバターエンドポイントは API の他の部分と同じ Gateway トークンを要求します。

- `GET /avatar/<agentId>` は、認証済み呼び出し元にのみアバター画像を返します。`GET /avatar/<agentId>?meta=1` は同じルールでアバターメタデータを返します。
- どちらのルートへの未認証リクエストも拒否されます（兄弟の assistant-media ルートと一致します）。これにより、それ以外は保護されているホストで、アバタールートがエージェント ID を漏えいすることを防ぎます。
- Control UI 自体は、アバターをフェッチするときに Gateway トークンを bearer ヘッダーとして転送し、認証済み blob URL を使うため、画像はダッシュボードで引き続きレンダリングされます。

Gateway 認証を無効にすると（共有ホストでは非推奨）、Gateway の他の部分と同様に、アバタールートも未認証になります。

## アシスタントメディアルート認証

Gateway 認証が設定されている場合、アシスタントのローカルメディアプレビューは 2 段階のルートを使います。

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` は通常の Control UI オペレーター認証を要求します。可用性を確認するとき、ブラウザーは Gateway トークンを bearer ヘッダーとして送信します。
- 成功したメタデータレスポンスには、その正確なソースパスにスコープされた短命の `mediaTicket` が含まれます。
- ブラウザーでレンダリングされる画像、音声、動画、ドキュメントの URL は、アクティブな Gateway トークンまたはパスワードではなく `mediaTicket=<ticket>` を使います。チケットはすぐに期限切れになり、別のソースを認可することはできません。

これにより、再利用可能な Gateway 認証情報を可視のメディア URL に入れることなく、通常のメディアレンダリングをブラウザー標準のメディア要素と互換に保てます。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを配信します。次のコマンドでビルドします。

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

## デバッグ/テスト: 開発サーバー + リモート Gateway

Control UI は静的ファイルです。WebSocket ターゲットは設定可能で、HTTP オリジンとは異なるものにできます。これは、Vite 開発サーバーをローカルで使い、Gateway を別の場所で実行したい場合に便利です。

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

    任意の 1 回限りの認証（必要な場合）:

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="注記">
    - `gatewayUrl` はロード後に localStorage に保存され、URL から削除されます。
    - `gatewayUrl` 経由で完全な `ws://` または `wss://` エンドポイントを渡す場合は、ブラウザーがクエリ文字列を正しく解析できるように、`gatewayUrl` 値を URL エンコードしてください。
    - 可能な限り、`token` は URL フラグメント（`#token=...`）経由で渡してください。フラグメントはサーバーに送信されないため、リクエストログや Referer の漏えいを避けられます。レガシーの `?token=` クエリパラメーターは互換性のために今も一度だけインポートされますが、フォールバックとしてのみ使用され、ブートストラップ直後に除去されます。
    - `password` はメモリ内にのみ保持されます。
    - `gatewayUrl` が設定されている場合、UI は config または環境認証情報にフォールバックしません。`token`（または `password`）を明示的に指定してください。明示的な認証情報がない場合はエラーです。
    - Gateway が TLS（Tailscale Serve、HTTPS プロキシなど）の背後にある場合は `wss://` を使ってください。
    - `gatewayUrl` はクリックジャッキングを防ぐため、トップレベルウィンドウ（埋め込みではない）でのみ受け付けられます。
    - 非 loopback の Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を明示的に設定する必要があります（完全なオリジン）。これにはリモート開発セットアップも含まれます。
    - Gateway の起動時に、有効なランタイムのバインドとポートから `http://localhost:<port>` や `http://127.0.0.1:<port>` などのローカルオリジンがシードされることがありますが、リモートブラウザーのオリジンには引き続き明示的なエントリが必要です。
    - 厳密に管理されたローカルテストを除き、`gateway.controlUi.allowedOrigins: ["*"]` は使わないでください。これは任意のブラウザーオリジンを許可するという意味であり、「自分が使っているホストに一致させる」という意味ではありません。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は Host ヘッダーのオリジンフォールバックモードを有効にしますが、これは危険なセキュリティモードです。

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
