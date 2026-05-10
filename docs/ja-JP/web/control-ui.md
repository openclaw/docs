---
read_when:
    - ブラウザから Gateway を操作したい場合
    - SSH トンネルなしで Tailnet アクセスを利用したい
sidebarTitle: Control UI
summary: Gateway 向けのブラウザベースの制御 UI（チャット、ノード、設定）
title: 制御 UI
x-i18n:
    generated_at: "2026-05-10T19:57:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb158d1b6b92b7097fe7ba8d61aee5d6c6e67a8d45fc2cb2514c555ef3e52d81
    source_path: web/control-ui.md
    workflow: 16
---

Control UI は、Gateway によって提供される小さな **Vite + Lit** シングルページアプリです。

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します (例: `/openclaw`)

同じポート上の **Gateway WebSocket** と直接通信します。

## クイック表示 (ローカル)

Gateway が同じコンピューター上で実行されている場合は、次を開きます。

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (または [http://localhost:18789/](http://localhost:18789/))

ページの読み込みに失敗する場合は、先に Gateway を起動します: `openclaw gateway`。

認証は WebSocket ハンドシェイク時に次で提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合の Tailscale Serve ID ヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合の信頼済みプロキシ ID ヘッダー

ダッシュボード設定パネルは、現在のブラウザータブセッションと選択中の Gateway URL 用にトークンを保持します。パスワードは永続化されません。オンボーディングでは通常、初回接続時に共有シークレット認証用の Gateway トークンが生成されますが、`gateway.auth.mode` が `"password"` の場合はパスワード認証も機能します。

## デバイスのペアリング (初回接続)

新しいブラウザーまたはデバイスから Control UI に接続すると、Gateway は通常 **1 回限りのペアリング承認** を要求します。これは不正アクセスを防ぐためのセキュリティ対策です。

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

ブラウザーが変更された認証詳細 (ロール/スコープ/公開鍵) でペアリングを再試行すると、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認前に `openclaw devices list` を再実行してください。

ブラウザーがすでにペアリング済みで、それを読み取りアクセスから書き込み/管理者アクセスへ変更した場合、これは暗黙の再接続ではなく承認のアップグレードとして扱われます。OpenClaw は古い承認を有効なまま維持し、より広い権限での再接続をブロックし、新しいスコープセットの明示的な承認を求めます。

承認後、そのデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り再承認は不要です。トークンのローテーションと取り消しについては [Devices CLI](/ja-JP/cli/devices) を参照してください。

<Note>
- 直接の local loopback ブラウザー接続 (`127.0.0.1` / `localhost`) は自動承認されます。
- `gateway.auth.allowTailscale: true` で、Tailscale ID が検証され、ブラウザーがデバイス ID を提示する場合、Tailscale Serve は Control UI オペレーターセッションのペアリング往復を省略できます。
- 直接の Tailnet バインド、LAN ブラウザー接続、デバイス ID のないブラウザープロファイルでは、引き続き明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイス ID を生成するため、ブラウザーを切り替えたりブラウザーデータを消去したりすると、再ペアリングが必要になります。

</Note>

## 個人 ID (ブラウザーローカル)

Control UI は、共有セッションでの帰属表示のために、送信メッセージに付加されるブラウザーごとの個人 ID (表示名とアバター) をサポートします。これはブラウザーストレージ内にあり、現在のブラウザープロファイルにスコープされ、他のデバイスには同期されず、実際に送信したメッセージ上の通常のトランスクリプト著者メタデータを超えてサーバー側に永続化されることもありません。サイトデータを消去したりブラウザーを切り替えたりすると空にリセットされます。

同じブラウザーローカルのパターンは、アシスタントアバターの上書きにも適用されます。アップロードされたアシスタントアバターは、ローカルブラウザー上でのみ Gateway が解決した ID に重ねて表示され、`config.patch` を通じて往復することはありません。共有 `ui.assistant.avatar` 設定フィールドは、スクリプト化された Gateway やカスタムダッシュボードなど、フィールドに直接書き込む非 UI クライアント向けに引き続き利用できます。

## ランタイム設定エンドポイント

Control UI は、ランタイム設定を `/__openclaw/control-ui-config.json` から取得します。このエンドポイントは、HTTP サーフェスの他の部分と同じ Gateway 認証によって保護されます。未認証のブラウザーは取得できず、取得に成功するには、有効な Gateway トークン/パスワード、Tailscale Serve ID、または信頼済みプロキシ ID のいずれかがすでに必要です。

## 言語サポート

Control UI は初回読み込み時に、ブラウザーのロケールに基づいて自身をローカライズできます。後で上書きするには、**概要 -> Gateway アクセス -> 言語** を開きます。ロケールピッカーは外観ではなく、Gateway アクセスカード内にあります。

- サポートされるロケール: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 英語以外の翻訳はブラウザー内で遅延読み込みされます。
- 選択したロケールはブラウザーストレージに保存され、以後の訪問で再利用されます。
- 不足している翻訳キーは英語にフォールバックします。

ドキュメント翻訳は同じ英語以外のロケールセット向けに生成されますが、ドキュメントサイトに組み込まれている Mintlify の言語ピッカーは、Mintlify が受け付けるロケールコードに制限されています。タイ語 (`th`) とペルシア語 (`fa`) のドキュメントも公開リポジトリ内に生成されますが、Mintlify がこれらのコードをサポートするまでは、そのピッカーに表示されない場合があります。

## 外観テーマ

外観パネルには、組み込みの Claw、Knot、Dash テーマに加えて、ブラウザーローカルの tweakcn インポートスロットが 1 つあります。テーマをインポートするには、[tweakcn editor](https://tweakcn.com/editor/theme) を開き、テーマを選択または作成し、**共有** をクリックして、コピーしたテーマリンクを外観に貼り付けます。インポーターは `https://tweakcn.com/r/themes/<id>` レジストリ URL、`https://tweakcn.com/editor/theme?theme=amethyst-haze` のようなエディター URL、相対 `/themes/<id>` パス、生のテーマ ID、`amethyst-haze` などのデフォルトテーマ名も受け付けます。

インポートされたテーマは現在のブラウザープロファイルにのみ保存されます。Gateway 設定には書き込まれず、デバイス間で同期されません。インポート済みテーマを置き換えると、1 つのローカルスロットが更新されます。インポート済みテーマが選択されている状態でそれを消去すると、アクティブなテーマは Claw に戻ります。

## できること (現時点)

<AccordionGroup>
  <Accordion title="チャットとトーク">
    - Gateway WS 経由でモデルとチャットできます (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)。
    - チャット履歴の更新では、メッセージごとのテキスト上限付きで範囲を限定した最近のウィンドウを要求するため、大きなセッションでもチャットが使用可能になる前にブラウザーが完全なトランスクリプトペイロードを描画する必要はありません。
    - ブラウザーのリアルタイムセッションを通じて会話できます。OpenAI は直接 WebRTC を使用し、Google Live は WebSocket 経由の制約付き 1 回限りのブラウザートークンを使用し、バックエンド専用のリアルタイム音声 Plugin は Gateway リレートランスポートを使用します。クライアント所有のプロバイダーセッションは `talk.client.create` で開始し、Gateway リレーセッションは `talk.session.create` で開始します。リレーはプロバイダー認証情報を Gateway 上に保持し、ブラウザーは `talk.session.appendAudio` を通じてマイク PCM をストリーミングし、Gateway ポリシーおよび設定されたより大きな OpenClaw モデル向けに `openclaw_agent_consult` プロバイダーツール呼び出しを `talk.client.toolCall` 経由で転送します。
    - チャット内でツール呼び出しとライブツール出力カードをストリーミングします (エージェントイベント)。

  </Accordion>
  <Accordion title="チャンネル、インスタンス、セッション、Dream">
    - チャンネル: 組み込みおよび同梱/外部 Plugin チャンネルの状態、QR ログイン、チャンネルごとの設定 (`channels.status`, `web.login.*`, `config.patch`)。
    - チャンネルプローブの更新では、遅いプロバイダーチェックが完了するまで以前のスナップショットを表示し続け、プローブまたは監査が UI 予算を超えた場合は部分スナップショットとしてラベル付けされます。
    - インスタンス: プレゼンス一覧と更新 (`system-presence`)。
    - セッション: デフォルトでは設定済みエージェントセッションを一覧表示し、古い未設定エージェントセッションキーからフォールバックし、セッションごとのモデル/思考/高速/詳細/トレース/推論の上書きを適用します (`sessions.list`, `sessions.patch`)。
    - Dream: Dreaming の状態、有効/無効の切り替え、Dream Diary リーダー (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)。

  </Accordion>
  <Accordion title="Cron、Skills、ノード、実行承認">
    - Cron ジョブ: 一覧表示/追加/編集/実行/有効化/無効化と実行履歴 (`cron.*`)。
    - Skills: 状態、有効化/無効化、インストール、API キー更新 (`skills.*`)。
    - ノード: 一覧と機能上限 (`node.list`)。
    - 実行承認: Gateway またはノードの許可リストと `exec host=gateway/node` の確認ポリシーを編集します (`exec.approvals.*`)。

  </Accordion>
  <Accordion title="設定">
    - `~/.openclaw/openclaw.json` を表示/編集します (`config.get`, `config.set`)。
    - 検証付きで適用して再起動します (`config.apply`)。また、最後にアクティブだったセッションを起こします。
    - 書き込みには、同時編集による上書きを防ぐためのベースハッシュガードが含まれます。
    - 書き込み (`config.set`/`config.apply`/`config.patch`) は、送信された設定ペイロード内の参照について、アクティブな SecretRef 解決を事前チェックします。未解決のアクティブな送信済み参照は、書き込み前に拒否されます。
    - スキーマとフォーム描画 (`config.schema` / `config.schema.lookup`、フィールドの `title` / `description`、一致した UI ヒント、直接の子要素の概要、ネストされたオブジェクト/ワイルドカード/配列/合成ノード上のドキュメントメタデータ、利用可能な場合は Plugin とチャンネルのスキーマを含む)。Raw JSON エディターは、スナップショットが安全に生の往復処理を行える場合にのみ利用できます。
    - スナップショットが生テキストを安全に往復処理できない場合、Control UI はそのスナップショットでフォームモードを強制し、Raw モードを無効化します。
    - Raw JSON エディターの「保存済みにリセット」は、フラット化されたスナップショットを再描画するのではなく、生で作成された形状 (書式、コメント、`$include` レイアウト) を保持するため、スナップショットが安全に往復処理できる場合は外部編集がリセット後も残ります。
    - 構造化された SecretRef オブジェクト値は、偶発的なオブジェクトから文字列への破損を防ぐため、フォームのテキスト入力内で読み取り専用として描画されます。

  </Accordion>
  <Accordion title="デバッグ、ログ、更新">
    - デバッグ: 状態/ヘルス/モデルのスナップショット、イベントログ、手動 RPC 呼び出し (`status`, `health`, `models.list`)。
    - イベントログには、Control UI の更新/RPC タイミング、遅いチャット/設定描画タイミング、ブラウザーがそれらの PerformanceObserver エントリー型を公開する場合の長いアニメーションフレームまたは長いタスクに関するブラウザー応答性エントリーが含まれます。
    - ログ: フィルター/エクスポート付きの Gateway ファイルログのライブ末尾表示 (`logs.tail`)。
    - 更新: 再起動レポート付きでパッケージ/git 更新と再起動を実行し (`update.run`)、再接続後に `update.status` をポーリングして、実行中の Gateway バージョンを確認します。

  </Accordion>
  <Accordion title="Cron ジョブパネルの注記">
    - 分離ジョブでは、配信のデフォルトは概要の通知です。内部のみの実行にしたい場合は、なしに切り替えることができます。
    - 通知が選択されている場合、チャンネル/ターゲットフィールドが表示されます。
    - Webhook モードでは、`delivery.mode = "webhook"` を使用し、`delivery.to` を有効な HTTP(S) Webhook URL に設定します。
    - メインセッションジョブでは、Webhook となしの配信モードを利用できます。
    - 高度な編集コントロールには、実行後削除、エージェント上書きのクリア、Cron の exact/stagger オプション、エージェントモデル/思考の上書き、ベストエフォート配信トグルが含まれます。
    - フォーム検証はフィールドレベルのエラーとともにインラインで行われます。無効な値がある場合、修正されるまで保存ボタンは無効になります。
    - 専用ベアラートークンを送信するには `cron.webhookToken` を設定します。省略した場合、Webhook は認証ヘッダーなしで送信されます。
    - 非推奨のフォールバック: `notify: true` を持つ保存済みのレガシージョブは、移行されるまで引き続き `cron.webhook` を使用できます。

  </Accordion>
</AccordionGroup>

## チャットの動作

<AccordionGroup>
  <Accordion title="送信と履歴のセマンティクス">
    - `chat.send` は**ノンブロッキング**です。即座に `{ runId, status: "started" }` で確認応答し、レスポンスは `chat` イベント経由でストリーミングされます。
    - チャットアップロードは画像と非動画ファイルを受け付けます。画像はネイティブの画像パスを保持し、その他のファイルは管理メディアとして保存され、履歴では添付リンクとして表示されます。
    - 同じ `idempotencyKey` で再送信すると、実行中は `{ status: "in_flight" }` が返り、完了後は `{ status: "ok" }` が返ります。
    - `chat.history` レスポンスは UI の安全性のためサイズ制限されています。トランスクリプトのエントリが大きすぎる場合、Gateway は長いテキストフィールドを切り詰め、重いメタデータブロックを省略し、過大なメッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えることがあります。
    - アシスタント/生成画像は管理メディア参照として永続化され、認証済み Gateway メディア URL 経由で返されるため、再読み込みは未加工の base64 画像ペイロードがチャット履歴レスポンスに残っていることに依存しません。
    - `chat.history` をレンダリングするとき、Control UI は表示されるアシスタントテキストから表示専用のインラインディレクティブタグ（たとえば `[[reply_to_*]]` と `[[audio_as_voice]]`）、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、漏洩した ASCII/全角のモデル制御トークンを除去し、表示テキスト全体が正確な無音トークン `NO_REPLY` / `no_reply` または Heartbeat 確認応答トークン `HEARTBEAT_OK` のみであるアシスタントエントリを省略します。
    - アクティブな送信中および最終履歴更新中に、`chat.history` が一時的に古いスナップショットを返した場合でも、チャットビューはローカルの楽観的なユーザー/アシスタントメッセージを表示し続けます。Gateway 履歴が追いつくと、正規トランスクリプトがそれらのローカルメッセージを置き換えます。
    - ライブ `chat` イベントは配信状態であり、`chat.history` は永続セッショントランスクリプトから再構築されます。ツール最終イベントの後、Control UI は履歴を再読み込みし、小さな楽観的末尾のみをマージします。トランスクリプト境界は [WebChat](/ja-JP/web/webchat) に記載されています。
    - `chat.inject` はアシスタントメモをセッショントランスクリプトに追加し、UI のみの更新用に `chat` イベントをブロードキャストします（エージェント実行もチャンネル配信もありません）。
    - チャットヘッダーはセッションピッカーの前にエージェントフィルターを表示し、セッションピッカーは選択されたエージェントにスコープされます。エージェントを切り替えると、そのエージェントに関連付けられたセッションのみが表示され、まだ保存済みのダッシュボードセッションがない場合はそのエージェントのメインセッションにフォールバックします。
    - デスクトップ幅では、チャットコントロールはコンパクトな 1 行に収まり、トランスクリプトを下へスクロールしている間は折りたたまれます。上へスクロールする、先頭に戻る、または末尾に到達すると、コントロールが復元されます。
    - 連続する重複したテキストのみのメッセージは、件数バッジ付きの 1 つの吹き出しとしてレンダリングされます。画像、添付ファイル、ツール出力、またはキャンバスプレビューを含むメッセージは折りたたまれません。
    - チャットヘッダーのモデルおよび thinking ピッカーは、`sessions.patch` 経由でアクティブセッションを即座にパッチします。これらは永続的なセッション上書きであり、1 ターン限りの送信オプションではありません。
    - 同じセッションのモデルピッカー変更がまだ保存中の間にメッセージを送信すると、送信が選択されたモデルを使用するように、コンポーザーは `chat.send` を呼び出す前にそのセッションパッチを待ちます。
    - Control UI で `/new` と入力すると、New Chat と同じ新しいダッシュボードセッションが作成され、そこへ切り替わります。ただし、`session.dmScope: "main"` が構成されており、現在の親がエージェントのメインセッションである場合は、そのメインセッションをその場でリセットします。`/reset` と入力すると、現在のセッションに対する Gateway の明示的なインプレースリセットを維持します。
    - チャットモデルピッカーは Gateway の構成済みモデルビューをリクエストします。`agents.defaults.models` が存在する場合、その許可リストがピッカーを駆動し、プロバイダースコープのカタログを動的に保つ `provider/*` エントリも含まれます。それ以外の場合、ピッカーは明示的な `models.providers.*.models` エントリと、利用可能な認証を持つプロバイダーを表示します。完全なカタログは、デバッグ用の `models.list` RPC で `view: "all"` を指定することで引き続き利用できます。
    - 新しい Gateway セッション使用状況レポートに現在のコンテキストトークンが含まれる場合、チャットコンポーザー領域にはコンパクトなコンテキスト使用量インジケーターが表示されます。コンテキスト圧力が高い場合は警告スタイルに切り替わり、推奨 Compaction レベルでは、通常のセッション Compaction パスを実行するコンパクトなボタンが表示されます。古いトークンスナップショットは、Gateway が新しい使用状況を再度報告するまで非表示になります。

  </Accordion>
  <Accordion title="トークモード（ブラウザーリアルタイム）">
    トークモードは、登録済みのリアルタイム音声プロバイダーを使用します。OpenAI を構成するには、`talk.realtime.provider: "openai"` に加えて、`talk.realtime.providers.openai.apiKey`、`OPENAI_API_KEY`、または `openai-codex` OAuth プロファイルのいずれかを設定します。Google を構成するには、`talk.realtime.provider: "google"` に加えて `talk.realtime.providers.google.apiKey` を設定します。ブラウザーが標準のプロバイダー API キーを受け取ることはありません。OpenAI は WebRTC 用の一時的な Realtime クライアントシークレットを受け取ります。Google Live は、ブラウザー WebSocket セッション用の使い捨て制約付き Live API 認証トークンを受け取り、指示とツール宣言は Gateway によってトークン内に固定されます。バックエンドリアルタイムブリッジのみを公開するプロバイダーは Gateway リレートランスポート経由で実行されるため、認証情報とベンダーソケットはサーバー側に留まり、ブラウザー音声は認証済み Gateway RPC 経由で移動します。Realtime セッションプロンプトは Gateway によって組み立てられます。`talk.client.create` は呼び出し元提供の指示上書きを受け付けません。

    チャットコンポーザーには、トーク開始/停止ボタンの隣にトークオプションボタンがあります。オプションは次のトークセッションに適用され、プロバイダー、トランスポート、モデル、音声、推論努力、VAD しきい値、無音時間、プレフィックスパディングを上書きできます。オプションが空の場合、Gateway は利用可能な構成済みデフォルト、またはプロバイダーのデフォルトを使用します。Gateway リレーを選択するとバックエンドリレーパスが強制されます。WebRTC を選択するとセッションはクライアント所有のままとなり、プロバイダーがブラウザーセッションを作成できない場合、リレーへ暗黙にフォールバックする代わりに失敗します。

    チャットコンポーザーでは、トークコントロールはマイクディクテーションボタンの隣にある波形ボタンです。トークが開始すると、コンポーザーのステータス行にはまず `Connecting Talk...` が表示され、音声が接続されている間は `Talk live`、またはリアルタイムツール呼び出しが `talk.client.toolCall` 経由で構成済みのより大きなモデルに問い合わせている間は `Asking OpenClaw...` が表示されます。

    メンテナー向けライブスモーク: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` は、OpenAI バックエンド WebSocket ブリッジ、OpenAI ブラウザー WebRTC SDP 交換、Google Live 制約付きトークンのブラウザー WebSocket セットアップ、および偽のマイクメディアを使用した Gateway リレーのブラウザーアダプターを検証します。このコマンドはプロバイダーのステータスのみを出力し、シークレットはログに記録しません。

  </Accordion>
  <Accordion title="停止と中止">
    - **停止**をクリックします（`chat.abort` を呼び出します）。
    - 実行がアクティブな間、通常のフォローアップはキューに入ります。キュー内のメッセージで**誘導**をクリックすると、そのフォローアップを実行中のターンに注入します。
    - `/stop`（または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` のような単独の中止フレーズ）を入力すると、帯域外で中止します。
    - `chat.abort` は `{ sessionKey }`（`runId` なし）をサポートし、そのセッションのすべてのアクティブな実行を中止します。

  </Accordion>
  <Accordion title="中止時の部分保持">
    - 実行が中止された場合でも、部分的なアシスタントテキストは UI に表示されることがあります。
    - Gateway は、バッファ済み出力が存在する場合、中止された部分的なアシスタントテキストをトランスクリプト履歴に永続化します。
    - 永続化されたエントリには中止メタデータが含まれるため、トランスクリプト利用側は中止部分と通常の完了出力を区別できます。

  </Accordion>
</AccordionGroup>

## PWA インストールと Web Push

Control UI は `manifest.webmanifest` とサービスワーカーを同梱しているため、最新ブラウザーではスタンドアロン PWA としてインストールできます。Web Push により、タブやブラウザーウィンドウが開いていない場合でも、Gateway は通知でインストール済み PWA を起動できます。

| サーフェス                                            | 機能                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA マニフェスト。到達可能になると、ブラウザーは「アプリをインストール」を提示します。 |
| `ui/public/sw.js`                                     | `push` イベントと通知クリックを処理するサービスワーカー。 |
| `push/vapid-keys.json`（OpenClaw 状態ディレクトリ配下） | Web Push ペイロードの署名に使用される、自動生成された VAPID キーペア。 |
| `push/web-push-subscriptions.json`                    | 永続化されたブラウザー購読エンドポイント。                          |

キーを固定したい場合（マルチホストデプロイ、シークレットローテーション、またはテストなど）、Gateway プロセス上の環境変数で VAPID キーペアを上書きします。

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（デフォルトは `mailto:openclaw@localhost`）

Control UI は、ブラウザー購読を登録およびテストするために、これらのスコープ制限付き Gateway メソッドを使用します。

- `push.web.vapidPublicKey` — アクティブな VAPID 公開鍵を取得します。
- `push.web.subscribe` — `endpoint` と `keys.p256dh`/`keys.auth` を登録します。
- `push.web.unsubscribe` — 登録済みエンドポイントを削除します。
- `push.web.test` — 呼び出し元の購読にテスト通知を送信します。

<Note>
Web Push は、iOS APNS リレーパス（リレー支援 push については [構成](/ja-JP/gateway/configuration) を参照）および既存の `push.test` メソッドから独立しています。これらはネイティブモバイルのペアリングを対象としています。
</Note>

## ホスト型埋め込み

アシスタントメッセージは、`[embed ...]` ショートコードを使用してホスト型 Web コンテンツをインラインでレンダリングできます。iframe サンドボックスポリシーは `gateway.controlUi.embedSandbox` によって制御されます。

<Tabs>
  <Tab title="strict">
    ホスト型埋め込み内でのスクリプト実行を無効にします。
  </Tab>
  <Tab title="scripts（デフォルト）">
    オリジン分離を維持しながらインタラクティブな埋め込みを許可します。これがデフォルトであり、通常は自己完結型のブラウザーゲーム/ウィジェットには十分です。
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
埋め込みドキュメントが同一オリジン動作を本当に必要とする場合にのみ、`trusted` を使用してください。ほとんどのエージェント生成ゲームやインタラクティブキャンバスでは、`scripts` の方が安全な選択です。
</Warning>

絶対外部 `http(s)` 埋め込み URL は、デフォルトでは引き続きブロックされます。`[embed url="https://..."]` でサードパーティページを読み込ませたい場合は、`gateway.controlUi.allowExternalEmbedUrls: true` を設定してください。

## チャットメッセージ幅

グループ化されたチャットメッセージは、読みやすいデフォルトの最大幅を使用します。ワイドモニターのデプロイでは、バンドル済み CSS をパッチせずに `gateway.controlUi.chatMessageMaxWidth` を設定して上書きできます。

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

この値はブラウザーに到達する前に検証されます。サポートされる値には、`960px` や `82%` のような単純な長さとパーセンテージに加えて、制約付きの `min(...)`、`max(...)`、`clamp(...)`、`calc(...)`、`fit-content(...)` 幅式が含まれます。

## Tailnet アクセス（推奨）

<Tabs>
  <Tab title="統合 Tailscale Serve（推奨）">
    Gateway をループバックに維持し、Tailscale Serve に HTTPS でプロキシさせます。

    ```bash
    openclaw gateway --tailscale serve
    ```

    開く:

    - `https://<magicdns>/`（または構成済みの `gateway.controlUi.basePath`）

    デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket Serve リクエストは Tailscale アイデンティティヘッダー（`tailscale-user-login`）で認証できます。OpenClaw は、`x-forwarded-for` アドレスを `tailscale whois` で解決してヘッダーと照合することでアイデンティティを検証し、リクエストが Tailscale の `x-forwarded-*` ヘッダー付きでループバックに到達した場合にのみ受け入れます。ブラウザーのデバイスアイデンティティを持つ Control UI オペレーターセッションでは、この検証済み Serve パスでもデバイスペアリングの往復処理をスキップします。デバイスなしのブラウザーとノードロール接続は、引き続き通常のデバイスチェックに従います。Serve トラフィックでも明示的な共有シークレット認証情報を必須にしたい場合は、`gateway.auth.allowTailscale: false` を設定してください。そのうえで `gateway.auth.mode: "token"` または `"password"` を使用します。

    その非同期 Serve アイデンティティパスでは、同じクライアント IP と認証スコープに対する失敗した認証試行は、レート制限の書き込み前に直列化されます。そのため、同じブラウザーからの並行した不正な再試行では、2 つの単純な不一致が並列に競合する代わりに、2 番目のリクエストで `retry later` が表示されることがあります。

    <Warning>
    トークンなしの Serve 認証は、Gateway ホストが信頼済みであることを前提にしています。信頼できないローカルコードがそのホストで実行される可能性がある場合は、トークン/パスワード認証を必須にしてください。
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

プレーン HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、ブラウザーは**非セキュアコンテキスト**で実行され、WebCrypto をブロックします。デフォルトでは、OpenClaw はデバイスアイデンティティのない Control UI 接続を**ブロック**します。

文書化されている例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost 専用の安全でない HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` によるオペレーター Control UI 認証の成功
- 緊急用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

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

    `allowInsecureAuth` はローカル互換性トグルのみです。

    - 非セキュア HTTP コンテキストで、localhost の Control UI セッションがデバイスアイデンティティなしで進行できるようにします。
    - ペアリングチェックをバイパスしません。
    - リモート（非 localhost）のデバイスアイデンティティ要件を緩和しません。

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
    `dangerouslyDisableDeviceAuth` は Control UI のデバイスアイデンティティチェックを無効化し、重大なセキュリティ低下を招きます。緊急使用後は速やかに元に戻してください。
    </Warning>

  </Accordion>
  <Accordion title="信頼済みプロキシに関する注記">
    - 信頼済みプロキシ認証に成功すると、デバイスアイデンティティなしで**オペレーター** Control UI セッションを許可できます。
    - これはノードロール Control UI セッションには拡張されません。
    - 同一ホストのループバックリバースプロキシでも信頼済みプロキシ認証は満たしません。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照してください。

  </Accordion>
</AccordionGroup>

HTTPS 設定のガイダンスについては、[Tailscale](/ja-JP/gateway/tailscale)を参照してください。

## コンテンツセキュリティポリシー

Control UI には厳密な `img-src` ポリシーがあります。許可されるのは、**同一オリジン**アセット、`data:` URL、ローカルで生成された `blob:` URL のみです。リモートの `http(s)` およびプロトコル相対の画像 URL はブラウザーによって拒否され、ネットワークフェッチは発行されません。

実際には、これは次のことを意味します。

- 相対パス（例: `/avatars/<id>`）で提供されるアバターと画像は引き続きレンダリングされます。UI がフェッチしてローカルの `blob:` URL に変換する認証済みアバタールートも含まれます。
- インラインの `data:image/...` URL は引き続きレンダリングされます（プロトコル内ペイロードに便利です）。
- Control UI によって作成されたローカルの `blob:` URL は引き続きレンダリングされます。
- チャンネルメタデータが出力するリモートアバター URL は Control UI のアバターヘルパーで取り除かれ、組み込みのロゴ/バッジに置き換えられます。そのため、侵害されたチャンネルや悪意のあるチャンネルが、オペレーターのブラウザーから任意のリモート画像フェッチを強制することはできません。

この動作を得るために変更は不要です。これは常に有効で、構成できません。

## アバタールート認証

Gateway 認証が構成されている場合、Control UI のアバターエンドポイントには、API の他の部分と同じ Gateway トークンが必要です。

- `GET /avatar/<agentId>` は認証済み呼び出し元にのみアバター画像を返します。`GET /avatar/<agentId>?meta=1` は同じルールの下でアバターメタデータを返します。
- どちらのルートへの未認証リクエストも拒否されます（隣接する assistant-media ルートと同じです）。これにより、それ以外は保護されているホスト上で、アバタールートからエージェントアイデンティティが漏れることを防ぎます。
- Control UI 自体は、アバターをフェッチするときに Gateway トークンを Bearer ヘッダーとして転送し、認証済み blob URL を使用するため、画像はダッシュボードで引き続きレンダリングされます。

Gateway 認証を無効化した場合（共有ホストでは推奨されません）、Gateway の他の部分と同様に、アバタールートも未認証になります。

## Assistant メディアルート認証

Gateway 認証が構成されている場合、Assistant のローカルメディアプレビューは 2 段階のルートを使用します。

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` には通常の Control UI オペレーター認証が必要です。ブラウザーは可用性を確認するときに Gateway トークンを Bearer ヘッダーとして送信します。
- 成功したメタデータレスポンスには、その正確なソースパスにスコープされた短命の `mediaTicket` が含まれます。
- ブラウザーでレンダリングされる画像、音声、動画、ドキュメントの URL は、アクティブな Gateway トークンやパスワードの代わりに `mediaTicket=<ticket>` を使用します。チケットはすぐに期限切れになり、別のソースを認可できません。

これにより、再利用可能な Gateway 認証情報を可視のメディア URL に入れずに、通常のメディアレンダリングをブラウザー標準のメディア要素と互換に保てます。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを提供します。次でビルドします。

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

次に、UI に Gateway WS URL（例: `ws://127.0.0.1:18789`）を指定します。

## デバッグ/テスト: 開発サーバー + リモート Gateway

Control UI は静的ファイルです。WebSocket ターゲットは構成可能で、HTTP オリジンとは異なっていてもかまいません。これは、Vite 開発サーバーをローカルで使い、Gateway は別の場所で実行したい場合に便利です。

<Steps>
  <Step title="UI 開発サーバーを起動">
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
  <Accordion title="注記">
    - `gatewayUrl` はロード後に localStorage に保存され、URL から削除されます。
    - `gatewayUrl` 経由で完全な `ws://` または `wss://` エンドポイントを渡す場合は、ブラウザーがクエリ文字列を正しく解析できるように `gatewayUrl` 値を URL エンコードしてください。
    - `token` は可能な限り URL フラグメント（`#token=...`）経由で渡してください。フラグメントはサーバーに送信されないため、リクエストログと Referer の漏えいを避けられます。レガシーの `?token=` クエリパラメーターは互換性のために一度だけ取り込まれますが、フォールバックとしてのみ扱われ、ブートストラップ直後に削除されます。
    - `password` はメモリ内にのみ保持されます。
    - `gatewayUrl` が設定されている場合、UI は構成や環境の認証情報にフォールバックしません。`token`（または `password`）を明示的に指定してください。明示的な認証情報がない場合はエラーです。
    - Gateway が TLS の背後にある場合（Tailscale Serve、HTTPS プロキシなど）は `wss://` を使用してください。
    - クリックジャッキングを防ぐため、`gatewayUrl` はトップレベルウィンドウ（埋め込みではない）でのみ受け付けられます。
    - 非ループバックの Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を明示的に設定する必要があります（完全なオリジン）。これにはリモート開発セットアップも含まれます。
    - Gateway の起動時に、有効なランタイムのバインドとポートから `http://localhost:<port>` や `http://127.0.0.1:<port>` などのローカルオリジンがシードされることがありますが、リモートブラウザーのオリジンには引き続き明示的なエントリが必要です。
    - 厳密に管理されたローカルテスト以外では、`gateway.controlUi.allowedOrigins: ["*"]` を使用しないでください。これは任意のブラウザーオリジンを許可するという意味であり、「使用中のホストなら何でも一致させる」という意味ではありません。
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
- [ヘルスチェック](/ja-JP/gateway/health) — Gateway ヘルス監視
- [TUI](/ja-JP/web/tui) — ターミナルユーザーインターフェイス
- [WebChat](/ja-JP/web/webchat) — ブラウザーベースのチャットインターフェイス
