---
read_when:
    - ブラウザからGatewayを操作したい
    - SSH トンネルなしで Tailnet にアクセスしたい場合
sidebarTitle: Control UI
summary: Gateway 用のブラウザベースの制御UI（チャット、ノード、設定）
title: 制御 UI
x-i18n:
    generated_at: "2026-05-11T20:40:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0033b2666fe76bd23d5585d05b39fdd33f8d15d4e7c16561b5cfd0e75b8d22e
    source_path: web/control-ui.md
    workflow: 16
---

Control UI は、Gateway によって配信される小さな **Vite + Lit** シングルページアプリです。

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します（例: `/openclaw`）

これは、同じポート上の **Gateway WebSocket** と直接通信します。

## クイックオープン（ローカル）

Gateway が同じコンピューターで実行中の場合は、次を開きます。

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）

ページの読み込みに失敗する場合は、先に Gateway を起動してください: `openclaw gateway`。

認証は WebSocket ハンドシェイク中に次の方法で提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合の Tailscale Serve アイデンティティヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合の trusted-proxy アイデンティティヘッダー

ダッシュボード設定パネルは、現在のブラウザータブセッションと選択中の Gateway URL 用のトークンを保持します。パスワードは永続化されません。オンボーディングは通常、初回接続時に shared-secret 認証用の Gateway トークンを生成しますが、`gateway.auth.mode` が `"password"` の場合はパスワード認証も機能します。

## デバイスのペアリング（初回接続）

新しいブラウザーまたはデバイスから Control UI に接続すると、Gateway は通常、**一度限りのペアリング承認**を要求します。これは不正アクセスを防ぐためのセキュリティ対策です。

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

ブラウザーが変更された認証詳細（ロール/スコープ/公開鍵）でペアリングを再試行した場合、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認前に `openclaw devices list` を再実行してください。

ブラウザーがすでにペアリング済みで、読み取りアクセスから書き込み/admin アクセスに変更した場合、これはサイレントな再接続ではなく承認アップグレードとして扱われます。OpenClaw は古い承認を有効なまま保持し、より広い権限での再接続をブロックして、新しいスコープセットを明示的に承認するよう求めます。

承認されるとデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り再承認は不要です。トークンローテーションと取り消しについては、[デバイス CLI](/ja-JP/cli/devices) を参照してください。

<Note>
- 直接の local loopback ブラウザー接続（`127.0.0.1` / `localhost`）は自動承認されます。
- `gateway.auth.allowTailscale: true` で、Tailscale アイデンティティが検証され、ブラウザーがデバイスアイデンティティを提示する場合、Tailscale Serve は Control UI オペレーターセッションのペアリング往復を省略できます。
- 直接の Tailnet バインド、LAN ブラウザー接続、デバイスアイデンティティのないブラウザープロファイルでは、引き続き明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイス ID を生成するため、ブラウザーを切り替えたりブラウザーデータを削除したりすると、再ペアリングが必要になります。

</Note>

## 個人アイデンティティ（ブラウザーローカル）

Control UI は、共有セッションでの帰属表示のために、送信メッセージに付与されるブラウザーごとの個人アイデンティティ（表示名とアバター）をサポートします。これはブラウザーストレージに保存され、現在のブラウザープロファイルにスコープされます。他のデバイスには同期されず、実際に送信したメッセージ上の通常のトランスクリプト作成者メタデータを超えてサーバー側に永続化されることもありません。サイトデータを削除したりブラウザーを切り替えたりすると、空の状態にリセットされます。

同じブラウザーローカルのパターンは、アシスタントアバターのオーバーライドにも適用されます。アップロードされたアシスタントアバターは、ローカルブラウザー上でのみ Gateway が解決したアイデンティティに重ねられ、`config.patch` を通じて往復することはありません。共有 `ui.assistant.avatar` 設定フィールドは、このフィールドを直接書き込む非 UI クライアント（スクリプト化された Gateway やカスタムダッシュボードなど）向けに引き続き利用できます。

## ランタイム設定エンドポイント

Control UI はランタイム設定を `/__openclaw/control-ui-config.json` から取得します。このエンドポイントは、HTTP サーフェスの他の部分と同じ Gateway 認証で保護されています。未認証のブラウザーは取得できず、取得に成功するには、すでに有効な Gateway トークン/パスワード、Tailscale Serve アイデンティティ、または trusted-proxy アイデンティティのいずれかが必要です。

## 言語サポート

Control UI は初回読み込み時にブラウザーのロケールに基づいて自身をローカライズできます。あとで上書きするには、**概要 -> Gateway アクセス -> 言語** を開きます。ロケールピッカーは、外観ではなく Gateway アクセスカード内にあります。

- サポートされるロケール: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 英語以外の翻訳はブラウザー内で遅延読み込みされます。
- 選択したロケールはブラウザーストレージに保存され、以後の訪問で再利用されます。
- 翻訳キーがない場合は英語にフォールバックします。

Docs の翻訳は同じ英語以外のロケールセットで生成されますが、Docs サイトに組み込まれた Mintlify の言語ピッカーは、Mintlify が受け付けるロケールコードに制限されます。タイ語（`th`）とペルシア語（`fa`）の Docs は公開リポジトリで引き続き生成されますが、Mintlify がこれらのコードをサポートするまで、そのピッカーには表示されない場合があります。

## 外観テーマ

外観パネルには、組み込みの Claw、Knot、Dash テーマに加えて、ブラウザーローカルの tweakcn インポートスロットが 1 つあります。テーマをインポートするには、[tweakcn editor](https://tweakcn.com/editor/theme) を開き、テーマを選択または作成して **共有** をクリックし、コピーしたテーマリンクを外観に貼り付けます。インポーターは `https://tweakcn.com/r/themes/<id>` レジストリ URL、`https://tweakcn.com/editor/theme?theme=amethyst-haze` のようなエディター URL、相対 `/themes/<id>` パス、生のテーマ ID、`amethyst-haze` のようなデフォルトテーマ名も受け付けます。

インポートされたテーマは、現在のブラウザープロファイルにのみ保存されます。Gateway 設定には書き込まれず、デバイス間で同期されません。インポート済みテーマを置き換えると、1 つのローカルスロットが更新されます。クリアすると、インポート済みテーマが選択されていた場合、アクティブテーマは Claw に戻ります。

## できること（現在）

<AccordionGroup>
  <Accordion title="チャットと音声会話">
    - Gateway WS 経由でモデルとチャットします（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）。
    - チャット履歴の更新は、メッセージごとのテキスト上限付きで制限された最近のウィンドウを要求するため、大規模なセッションでも、チャットが使用可能になる前にブラウザーが完全なトランスクリプトペイロードをレンダリングする必要がありません。
    - ブラウザーのリアルタイムセッションを通じて音声会話します。OpenAI は直接 WebRTC を使用し、Google Live は WebSocket 経由の制約付き一回限りのブラウザートークンを使用し、バックエンド専用のリアルタイム音声 Plugin は Gateway リレートランスポートを使用します。クライアント所有のプロバイダーセッションは `talk.client.create` で開始します。Gateway リレーセッションは `talk.session.create` で開始します。リレーはプロバイダー認証情報を Gateway 上に保持し、ブラウザーが `talk.session.appendAudio` を通じてマイク PCM をストリーミングし、`openclaw_agent_consult` プロバイダーツール呼び出しを `talk.client.toolCall` 経由で Gateway ポリシーと、より大きく設定された OpenClaw モデルに転送します。
    - チャット内でツール呼び出しとライブツール出力カードをストリーミングします（エージェントイベント）。

  </Accordion>
  <Accordion title="チャネル、インスタンス、セッション、夢">
    - チャネル: 組み込みおよびバンドル/外部 Plugin チャネルのステータス、QR ログイン、チャネルごとの設定（`channels.status`, `web.login.*`, `config.patch`）。
    - チャネルプローブの更新では、低速なプロバイダーチェックが完了するまで以前のスナップショットが表示され続け、プローブまたは監査が UI 予算を超えた場合は部分スナップショットとしてラベル付けされます。
    - インスタンス: プレゼンス一覧と更新（`system-presence`）。
    - セッション: デフォルトで設定済みエージェントセッションを一覧表示し、古くなった未設定エージェントセッションキーからフォールバックし、セッションごとのモデル/thinking/fast/verbose/trace/reasoning オーバーライドを適用します（`sessions.list`, `sessions.patch`）。
    - 夢: Dreaming ステータス、有効/無効トグル、Dream Diary リーダー（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）。

  </Accordion>
  <Accordion title="Cron、Skills、ノード、exec 承認">
    - Cron ジョブ: 一覧表示/追加/編集/実行/有効化/無効化 + 実行履歴（`cron.*`）。
    - Skills: ステータス、有効化/無効化、インストール、API キー更新（`skills.*`）。
    - ノード: 一覧と機能（`node.list`）。
    - Exec 承認: Gateway またはノードの許可リストと `exec host=gateway/node` の確認ポリシーを編集します（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="設定">
    - `~/.openclaw/openclaw.json` を表示/編集します（`config.get`, `config.set`）。
    - 検証付きで適用 + 再起動し（`config.apply`）、最後のアクティブセッションを起動します。
    - 書き込みには、同時編集の上書きを防ぐためのベースハッシュガードが含まれます。
    - 書き込み（`config.set`/`config.apply`/`config.patch`）は、送信された設定ペイロード内の参照について、アクティブな SecretRef 解決を事前確認します。解決されていないアクティブな送信済み参照は、書き込み前に拒否されます。
    - スキーマ + フォームレンダリング（`config.schema` / `config.schema.lookup`、フィールド `title` / `description`、一致した UI ヒント、直接の子要素サマリー、ネストされたオブジェクト/ワイルドカード/配列/合成ノード上の Docs メタデータ、利用可能な場合は Plugin + チャネルスキーマを含む）。Raw JSON エディターは、スナップショットが安全に生の往復を行える場合にのみ利用できます。
    - スナップショットが生テキストを安全に往復できない場合、Control UI はそのスナップショットでフォームモードを強制し、Raw モードを無効にします。
    - Raw JSON エディターの「保存済みにリセット」は、フラット化されたスナップショットを再レンダリングする代わりに、生で作成された形状（フォーマット、コメント、`$include` レイアウト）を保持します。そのため、スナップショットが安全に往復できる場合、外部編集はリセット後も保持されます。
    - 構造化された SecretRef オブジェクト値は、誤ってオブジェクトから文字列へ破損するのを防ぐため、フォームのテキスト入力では読み取り専用としてレンダリングされます。

  </Accordion>
  <Accordion title="デバッグ、ログ、更新">
    - デバッグ: ステータス/ヘルス/モデルのスナップショット + イベントログ + 手動 RPC 呼び出し（`status`, `health`, `models.list`）。
    - イベントログには、Control UI の更新/RPC タイミング、低速なチャット/設定レンダリングのタイミング、ブラウザーがそれらの PerformanceObserver エントリタイプを公開している場合の長いアニメーションフレームまたは長いタスクに関するブラウザー応答性エントリが含まれます。
    - ログ: フィルター/エクスポート付きの Gateway ファイルログのライブテール（`logs.tail`）。
    - 更新: 再起動レポート付きでパッケージ/git 更新 + 再起動を実行し（`update.run`）、再接続後に `update.status` をポーリングして、実行中の Gateway バージョンを検証します。

  </Accordion>
  <Accordion title="Cron ジョブパネルのメモ">
    - 分離ジョブでは、配信のデフォルトは概要の通知です。内部専用の実行にしたい場合は、none に切り替えられます。
    - announce が選択されている場合、チャネル/ターゲットフィールドが表示されます。
    - Webhook モードは `delivery.mode = "webhook"` を使用し、`delivery.to` を有効な HTTP(S) Webhook URL に設定します。
    - メインセッションジョブでは、Webhook と none の配信モードを利用できます。
    - 高度な編集コントロールには、実行後削除、エージェントオーバーライドのクリア、cron exact/stagger オプション、エージェントモデル/thinking オーバーライド、best-effort 配信トグルが含まれます。
    - フォーム検証はフィールドレベルのエラーとともにインラインで表示されます。無効な値がある場合、修正されるまで保存ボタンは無効になります。
    - 専用の bearer トークンを送信するには `cron.webhookToken` を設定します。省略した場合、Webhook は認証ヘッダーなしで送信されます。
    - 非推奨のフォールバック: `notify: true` を持つ保存済みのレガシージョブは、移行されるまで引き続き `cron.webhook` を使用できます。

  </Accordion>
</AccordionGroup>

## チャットの動作

<AccordionGroup>
  <Accordion title="送信と履歴のセマンティクス">
    - `chat.send` は**非ブロッキング**です。すぐに `{ runId, status: "started" }` で ack し、レスポンスは `chat` イベント経由でストリーミングされます。
    - Chat アップロードは画像と非動画ファイルを受け付けます。画像はネイティブの画像パスを保持し、その他のファイルは管理対象メディアとして保存され、履歴では添付リンクとして表示されます。
    - 同じ `idempotencyKey` で再送信すると、実行中は `{ status: "in_flight" }` が返り、完了後は `{ status: "ok" }` が返ります。
    - `chat.history` レスポンスは UI の安全性のためにサイズ制限されています。トランスクリプト項目が大きすぎる場合、Gateway は長いテキストフィールドを切り詰め、重いメタデータブロックを省略し、サイズ超過のメッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えることがあります。
    - アシスタント/生成画像は管理対象メディア参照として永続化され、認証済み Gateway メディア URL 経由で返されます。そのため、再読み込みは生の base64 画像ペイロードがチャット履歴レスポンスに残っていることに依存しません。
    - `chat.history` のレンダリング時、Control UI は表示されるアシスタントテキストから表示専用のインラインディレクティブタグ（たとえば `[[reply_to_*]]` と `[[audio_as_voice]]`）、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、切り詰められたツール呼び出しブロックを含む）、漏れた ASCII/全角モデル制御トークンを取り除き、表示可能なテキスト全体が正確な無音トークン `NO_REPLY` / `no_reply` または Heartbeat 確認トークン `HEARTBEAT_OK` だけであるアシスタント項目を省略します。
    - アクティブな送信中および最終履歴更新中に `chat.history` が一時的に古いスナップショットを返した場合でも、チャットビューはローカルの楽観的なユーザー/アシスタントメッセージを表示し続けます。Gateway 履歴が追いつくと、正規のトランスクリプトがそれらのローカルメッセージを置き換えます。
    - ライブの `chat` イベントは配信状態であり、`chat.history` は永続セッショントランスクリプトから再構築されます。ツール最終イベント後、Control UI は履歴を再読み込みし、小さな楽観的末尾だけをマージします。トランスクリプト境界は [WebChat](/ja-JP/web/webchat) に記載されています。
    - `chat.inject` はアシスタントメモをセッショントランスクリプトに追加し、UI 専用更新のために `chat` イベントをブロードキャストします（エージェント実行なし、チャネル配信なし）。
    - チャットヘッダーでは、セッションピッカーの前にエージェントフィルターが表示され、セッションピッカーは選択中のエージェントにスコープされます。エージェントを切り替えると、そのエージェントに紐づくセッションだけが表示され、保存済みダッシュボードセッションがまだない場合はそのエージェントのメインセッションにフォールバックします。
    - デスクトップ幅では、チャットコントロールは 1 つのコンパクトな行に留まり、トランスクリプトを下へスクロールしている間は折りたたまれます。上へスクロールする、先頭へ戻る、または末尾に到達すると、コントロールが復元されます。
    - 連続する重複したテキストのみのメッセージは、件数バッジ付きの 1 つのバブルとしてレンダリングされます。画像、添付、ツール出力、キャンバスプレビューを含むメッセージは折りたたまれません。
    - チャットヘッダーのモデルおよび thinking ピッカーは、`sessions.patch` 経由でアクティブセッションを即座にパッチします。これらは永続的なセッションオーバーライドであり、1 ターンだけの送信オプションではありません。
    - 同じセッションのモデルピッカー変更がまだ保存中のときにメッセージを送信すると、送信が選択されたモデルを使うように、コンポーザーは `chat.send` を呼び出す前にそのセッションパッチを待ちます。
    - Control UI で `/new` と入力すると、New Chat と同じ新しいダッシュボードセッションが作成され、そのセッションへ切り替わります。ただし、`session.dmScope: "main"` が設定され、現在の親がエージェントのメインセッションである場合は、その場でメインセッションをリセットします。`/reset` と入力すると、現在のセッションに対する Gateway の明示的なインプレースリセットが維持されます。
    - チャットモデルピッカーは Gateway の設定済みモデルビューを要求します。`agents.defaults.models` が存在する場合、その許可リストがピッカーを駆動し、プロバイダースコープのカタログを動的に保つ `provider/*` 項目も含みます。それ以外の場合、ピッカーは明示的な `models.providers.*.models` 項目と、利用可能な認証を持つプロバイダーを表示します。完全なカタログは、デバッグ用の `models.list` RPC で `view: "all"` を指定すると引き続き利用できます。
    - 新しい Gateway セッション使用量レポートに現在のコンテキストトークンが含まれている場合、チャットコンポーザー領域にはコンパクトなコンテキスト使用量インジケーターが表示されます。高いコンテキスト圧力では警告スタイルに切り替わり、推奨される Compaction レベルでは、通常のセッション Compaction パスを実行するコンパクトなボタンを表示します。古いトークンスナップショットは、Gateway が新しい使用量を再び報告するまで非表示になります。

  </Accordion>
  <Accordion title="Talk モード（ブラウザーリアルタイム）">
    Talk モードは登録済みのリアルタイム音声プロバイダーを使用します。OpenAI は `talk.realtime.provider: "openai"` と、`talk.realtime.providers.openai.apiKey`、`OPENAI_API_KEY`、または `openai-codex` OAuth プロファイルのいずれかで設定します。Google は `talk.realtime.provider: "google"` と `talk.realtime.providers.google.apiKey` で設定します。ブラウザーは標準のプロバイダー API キーを受け取りません。OpenAI は WebRTC 用の一時 Realtime クライアントシークレットを受け取ります。Google Live は、ブラウザー WebSocket セッション用の使い捨ての制約付き Live API 認証トークンを受け取り、そのトークンには Gateway によって指示とツール宣言が固定されます。バックエンドリアルタイムブリッジだけを公開するプロバイダーは Gateway リレートランスポート経由で実行されるため、認証情報とベンダーソケットはサーバー側に留まり、ブラウザー音声は認証済み Gateway RPC 経由で移動します。Realtime セッションプロンプトは Gateway によって組み立てられます。`talk.client.create` は呼び出し元が提供する指示オーバーライドを受け付けません。

    Chat コンポーザーには、Talk 開始/停止ボタンの隣に Talk オプションボタンがあります。オプションは次の Talk セッションに適用され、プロバイダー、トランスポート、モデル、音声、推論エフォート、VAD しきい値、無音時間、プレフィックスパディングをオーバーライドできます。オプションが空の場合、Gateway は利用可能な設定済みデフォルト、またはプロバイダーのデフォルトを使用します。Gateway リレーを選択するとバックエンドリレーパスが強制されます。WebRTC を選択するとセッションはクライアント所有のままになり、プロバイダーがブラウザーセッションを作成できない場合は、リレーへ暗黙にフォールバックせず失敗します。

    Chat コンポーザーでは、Talk コントロールはマイクディクテーションボタンの隣にある波形ボタンです。Talk が開始すると、コンポーザーのステータス行に `Connecting Talk...` が表示され、音声が接続されている間は `Talk live`、リアルタイムツール呼び出しが `talk.client.toolCall` 経由で設定済みのより大きなモデルに問い合わせている間は `Asking OpenClaw...` が表示されます。

    メンテナー向けライブスモーク: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` は、OpenAI バックエンド WebSocket ブリッジ、OpenAI ブラウザー WebRTC SDP 交換、Google Live 制約付きトークンのブラウザー WebSocket セットアップ、および偽のマイクメディアを使った Gateway リレーブラウザーアダプターを検証します。このコマンドはプロバイダー状態のみを出力し、シークレットはログに記録しません。

  </Accordion>
  <Accordion title="停止と中止">
    - **Stop** をクリックします（`chat.abort` を呼び出します）。
    - 実行がアクティブな間、通常のフォローアップはキューに入ります。キュー内のメッセージで **Steer** をクリックすると、そのフォローアップを実行中のターンに注入できます。
    - `/stop`（または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` などの単独の中止フレーズ）を入力すると、帯域外で中止します。
    - `chat.abort` は、そのセッションのすべてのアクティブな実行を中止するために `{ sessionKey }`（`runId` なし）をサポートします。

  </Accordion>
  <Accordion title="中止部分の保持">
    - 実行が中止された場合でも、部分的なアシスタントテキストが UI に表示されることがあります。
    - Gateway は、バッファ済み出力が存在する場合、中止された部分的なアシスタントテキストをトランスクリプト履歴に永続化します。
    - 永続化された項目には中止メタデータが含まれるため、トランスクリプト利用側は中止部分と通常の完了出力を区別できます。

  </Accordion>
</AccordionGroup>

## PWA インストールと Web Push

Control UI には `manifest.webmanifest` とサービスワーカーが同梱されているため、最新のブラウザーではスタンドアロン PWA としてインストールできます。Web Push により、タブやブラウザーウィンドウが開いていない場合でも、Gateway はインストール済み PWA を通知で起動できます。

| サーフェス                                            | 役割                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA マニフェスト。到達可能になると、ブラウザーは「アプリをインストール」を提示します。 |
| `ui/public/sw.js`                                     | `push` イベントと通知クリックを処理するサービスワーカー。 |
| `push/vapid-keys.json`（OpenClaw 状態ディレクトリ内） | Web Push ペイロードの署名に使われる自動生成 VAPID キーペア。       |
| `push/web-push-subscriptions.json`                    | 永続化されたブラウザー購読エンドポイント。                          |

キーを固定したい場合（マルチホストデプロイ、シークレットローテーション、テストなど）、Gateway プロセスの環境変数で VAPID キーペアをオーバーライドします。

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（デフォルトは `mailto:openclaw@localhost`）

Control UI は、ブラウザー購読の登録とテストに、これらのスコープ制限付き Gateway メソッドを使用します。

- `push.web.vapidPublicKey` — アクティブな VAPID 公開鍵を取得します。
- `push.web.subscribe` — `endpoint` と `keys.p256dh`/`keys.auth` を登録します。
- `push.web.unsubscribe` — 登録済みエンドポイントを削除します。
- `push.web.test` — 呼び出し元の購読へテスト通知を送信します。

<Note>
Web Push は、iOS APNS リレーパス（リレーで支えられた push については [設定](/ja-JP/gateway/configuration) を参照）および既存の `push.test` メソッドとは独立しています。これらはネイティブモバイルのペアリングを対象とします。
</Note>

## ホストされた埋め込み

アシスタントメッセージは、`[embed ...]` ショートコードでホストされた Web コンテンツをインラインレンダリングできます。iframe サンドボックスポリシーは `gateway.controlUi.embedSandbox` で制御されます。

<Tabs>
  <Tab title="strict">
    ホストされた埋め込み内でのスクリプト実行を無効にします。
  </Tab>
  <Tab title="scripts（デフォルト）">
    オリジン分離を維持しながら対話型埋め込みを許可します。これがデフォルトであり、通常は自己完結型のブラウザーゲーム/ウィジェットに十分です。
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
埋め込みドキュメントが本当に same-origin の動作を必要とする場合にのみ `trusted` を使用してください。ほとんどのエージェント生成ゲームや対話型キャンバスでは、`scripts` のほうが安全な選択です。
</Warning>

絶対外部 `http(s)` 埋め込み URL はデフォルトで引き続きブロックされます。`[embed url="https://..."]` でサードパーティページを読み込ませたい場合は、`gateway.controlUi.allowExternalEmbedUrls: true` を設定します。

## チャットメッセージ幅

グループ化されたチャットメッセージは、読みやすいデフォルトの最大幅を使用します。ワイドモニターのデプロイでは、`gateway.controlUi.chatMessageMaxWidth` を設定することで、同梱 CSS をパッチせずに上書きできます。

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

値はブラウザーに到達する前に検証されます。サポートされる値には、`960px` や `82%` などの単純な長さとパーセンテージに加え、制約付きの `min(...)`、`max(...)`、`clamp(...)`、`calc(...)`、`fit-content(...)` 幅式が含まれます。

## Tailnet アクセス（推奨）

<Tabs>
  <Tab title="統合 Tailscale Serve（推奨）">
    Gateway を loopback に置いたまま、Tailscale Serve に HTTPS でプロキシさせます。

    ```bash
    openclaw gateway --tailscale serve
    ```

    開く:

    - `https://<magicdns>/`（または設定済みの `gateway.controlUi.basePath`）

    デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket の Serve リクエストは Tailscale ID ヘッダー（`tailscale-user-login`）で認証できます。OpenClaw は、`x-forwarded-for` アドレスを `tailscale whois` で解決してヘッダーと照合することで ID を検証し、リクエストが Tailscale の `x-forwarded-*` ヘッダー付きで loopback に到達した場合のみ受け付けます。ブラウザーのデバイス ID を持つ Control UI オペレーターセッションでは、この検証済み Serve パスによりデバイスペアリングの往復もスキップされます。デバイスなしのブラウザーと node ロール接続は、通常のデバイスチェックに従います。Serve トラフィックに対しても明示的な共有シークレット認証情報を必須にしたい場合は、`gateway.auth.allowTailscale: false` を設定します。そのうえで `gateway.auth.mode: "token"` または `"password"` を使用します。

    その非同期 Serve ID パスでは、同じクライアント IP と認証スコープに対する認証失敗は、レート制限の書き込み前に直列化されます。そのため、同じブラウザーから並行して不正な再試行が行われると、2 つの単純な不一致が並列に競合する代わりに、2 回目のリクエストで `retry later` が表示されることがあります。

    <Warning>
    トークンなしの Serve 認証は、gateway ホストが信頼済みであることを前提とします。そのホスト上で信頼できないローカルコードが実行される可能性がある場合は、トークン/パスワード認証を必須にしてください。
    </Warning>

  </Tab>
  <Tab title="tailnet + token にバインド">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    次を開きます。

    - `http://<tailscale-ip>:18789/`（または設定済みの `gateway.controlUi.basePath`）

    一致する共有シークレットを UI 設定に貼り付けます（`connect.params.auth.token` または `connect.params.auth.password` として送信されます）。

  </Tab>
</Tabs>

## 安全でない HTTP

プレーン HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、ブラウザーは**非セキュアコンテキスト**で実行され、WebCrypto をブロックします。デフォルトでは、OpenClaw はデバイス ID のない Control UI 接続を**ブロック**します。

文書化されている例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost 限定の安全でない HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` を通じた Control UI オペレーター認証の成功
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

    - 非セキュア HTTP コンテキストで、localhost の Control UI セッションがデバイス ID なしで進行できるようにします。
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
    `dangerouslyDisableDeviceAuth` は Control UI のデバイス ID チェックを無効化するもので、重大なセキュリティ低下です。緊急使用後は速やかに元に戻してください。
    </Warning>

  </Accordion>
  <Accordion title="trusted-proxy の注記">
    - trusted-proxy 認証に成功すると、デバイス ID なしで **operator** Control UI セッションを許可できます。
    - これは node ロールの Control UI セッションには拡張されません。
    - 同一ホストの loopback リバースプロキシは、依然として trusted-proxy 認証を満たしません。[Trusted proxy auth](/ja-JP/gateway/trusted-proxy-auth) を参照してください。

  </Accordion>
</AccordionGroup>

HTTPS 設定ガイダンスについては [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## コンテンツセキュリティポリシー

Control UI には厳格な `img-src` ポリシーが同梱されています。許可されるのは、**same-origin** アセット、`data:` URL、ローカル生成の `blob:` URL のみです。リモートの `http(s)` とプロトコル相対の画像 URL はブラウザーによって拒否され、ネットワークフェッチは発生しません。

実際には次のようになります。

- 相対パス（例: `/avatars/<id>`）配下で提供されるアバターと画像は引き続きレンダリングされます。これには、UI がフェッチしてローカルの `blob:` URL に変換する、認証済みアバタールートも含まれます。
- インラインの `data:image/...` URL は引き続きレンダリングされます（プロトコル内ペイロードに便利です）。
- Control UI によって作成されたローカルの `blob:` URL は引き続きレンダリングされます。
- チャンネルメタデータが出力するリモートアバター URL は、Control UI のアバターヘルパーで除去され、組み込みのロゴ/バッジに置き換えられます。そのため、侵害された、または悪意のあるチャンネルが、オペレーターブラウザーから任意のリモート画像フェッチを強制することはできません。

この動作を得るために変更は不要です。常に有効で、設定できません。

## アバタールート認証

gateway 認証が設定されている場合、Control UI のアバターエンドポイントには、API の他の部分と同じ gateway トークンが必要です。

- `GET /avatar/<agentId>` は、認証済み呼び出し元にのみアバター画像を返します。`GET /avatar/<agentId>?meta=1` は、同じルールの下でアバターメタデータを返します。
- どちらのルートに対する未認証リクエストも拒否されます（兄弟の assistant-media ルートと同様です）。これにより、それ以外は保護されているホストで、アバタールートがエージェント ID を漏らすことを防ぎます。
- Control UI 自体は、アバターをフェッチするときに gateway トークンを bearer ヘッダーとして転送し、認証済み blob URL を使用するため、画像はダッシュボードで引き続きレンダリングされます。

gateway 認証を無効化すると（共有ホストでは推奨されません）、gateway の他の部分と同様に、アバタールートも未認証になります。

## assistant media ルート認証

gateway 認証が設定されている場合、assistant のローカルメディアプレビューは 2 段階のルートを使用します。

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` には通常の Control UI オペレーター認証が必要です。可用性を確認するとき、ブラウザーは gateway トークンを bearer ヘッダーとして送信します。
- 成功したメタデータレスポンスには、その正確なソースパスにスコープされた短命の `mediaTicket` が含まれます。
- ブラウザーでレンダリングされる画像、音声、動画、ドキュメントの URL は、アクティブな gateway トークンやパスワードの代わりに `mediaTicket=<ticket>` を使用します。チケットはすぐに期限切れになり、別のソースを認可することはできません。

これにより、再利用可能な gateway 認証情報を表示されるメディア URL に入れることなく、通常のメディアレンダリングをブラウザー標準のメディア要素と互換に保てます。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを提供します。次でビルドします。

```bash
pnpm ui:build
```

任意の絶対ベース（固定アセット URL が必要な場合）:

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

ローカル開発の場合（別の dev server）:

```bash
pnpm ui:dev
```

次に UI を Gateway WS URL（例: `ws://127.0.0.1:18789`）に向けます。

## 空白の Control UI ページ

ブラウザーが空白のダッシュボードを読み込み、DevTools に有用なエラーが表示されない場合、拡張機能または早期のコンテンツスクリプトが JavaScript モジュールアプリの評価を妨げた可能性があります。静的ページには、起動後に `<openclaw-app>` が登録されていない場合に表示されるプレーン HTML の復旧パネルが含まれています。

ブラウザー環境を変更した後にパネルの **再試行** アクションを使用するか、次の確認後に手動で再読み込みします。

- すべてのページに挿入される拡張機能、特に `<all_urls>` コンテンツスクリプトを持つ拡張機能を無効化します。
- プライベートウィンドウ、クリーンなブラウザープロファイル、または別のブラウザーを試します。
- Gateway を実行したままにし、ブラウザー変更後に同じダッシュボード URL を確認します。

## デバッグ/テスト: dev server + リモート Gateway

Control UI は静的ファイルです。WebSocket ターゲットは設定可能で、HTTP オリジンとは別にできます。これは、Vite dev server をローカルに置き、Gateway を別の場所で実行したい場合に便利です。

<Steps>
  <Step title="UI dev server を開始">
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
    - 完全な `ws://` または `wss://` エンドポイントを `gatewayUrl` 経由で渡す場合は、ブラウザーがクエリ文字列を正しく解析できるように、`gatewayUrl` の値を URL エンコードしてください。
    - 可能な限り、`token` は URL フラグメント（`#token=...`）経由で渡してください。フラグメントはサーバーに送信されないため、リクエストログと Referer の漏洩を避けられます。レガシーの `?token=` クエリパラメーターも互換性のために 1 回だけインポートされますが、フォールバックとしてのみで、bootstrap 直後に除去されます。
    - `password` はメモリ内にのみ保持されます。
    - `gatewayUrl` が設定されている場合、UI は設定や環境の認証情報にフォールバックしません。`token`（または `password`）を明示的に指定してください。明示的な認証情報がない場合はエラーです。
    - Gateway が TLS（Tailscale Serve、HTTPS プロキシなど）の背後にある場合は `wss://` を使用します。
    - `gatewayUrl` は、クリックジャッキングを防ぐため、トップレベルウィンドウ（埋め込みではない）でのみ受け付けられます。
    - local loopback ではない Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を明示的に設定する必要があります（完全なオリジン）。これにはリモート dev セットアップも含まれます。
    - Gateway 起動時に、有効なランタイムのバインドとポートから `http://localhost:<port>` や `http://127.0.0.1:<port>` などのローカルオリジンがシードされる場合がありますが、リモートブラウザーのオリジンには依然として明示的なエントリが必要です。
    - 厳密に管理されたローカルテストを除き、`gateway.controlUi.allowedOrigins: ["*"]` は使用しないでください。これは任意のブラウザーオリジンを許可するという意味であり、「使用しているホストに何でも一致する」という意味ではありません。
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
- [ヘルスチェック](/ja-JP/gateway/health) — gateway ヘルス監視
- [TUI](/ja-JP/web/tui) — ターミナルユーザーインターフェイス
- [WebChat](/ja-JP/web/webchat) — ブラウザーベースのチャットインターフェイス
