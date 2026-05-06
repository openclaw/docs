---
read_when:
    - ブラウザからGatewayを操作したい
    - SSH トンネルなしで Tailnet アクセスを利用したい
sidebarTitle: Control UI
summary: Gateway 用のブラウザベースの制御用ユーザーインターフェイス（チャット、ノード、設定）
title: 制御 UI
x-i18n:
    generated_at: "2026-05-06T05:23:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c16b37405d7a490b89ea90f2b006c01b9a7b1a3e5278769006b4dc94e7d83aa
    source_path: web/control-ui.md
    workflow: 16
---

Control UI は、Gateway が配信する小さな **Vite + Lit** シングルページアプリです。

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します（例: `/openclaw`）

これは同じポート上の **Gateway WebSocket** と直接通信します。

## すばやく開く（ローカル）

Gateway が同じコンピューターで実行されている場合は、次を開きます。

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）

ページの読み込みに失敗する場合は、先に Gateway を起動します: `openclaw gateway`。

認証は WebSocket ハンドシェイク中に次で提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合の Tailscale Serve ID ヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合の trusted-proxy ID ヘッダー

ダッシュボード設定パネルは、現在のブラウザータブセッションと選択された Gateway URL 用のトークンを保持します。パスワードは永続化されません。オンボーディングでは通常、初回接続時に shared-secret 認証用の Gateway トークンが生成されますが、`gateway.auth.mode` が `"password"` の場合はパスワード認証も機能します。

## デバイスのペアリング（初回接続）

新しいブラウザーまたはデバイスから Control UI に接続すると、Gateway は通常 **1 回限りのペアリング承認**を要求します。これは不正アクセスを防ぐためのセキュリティ対策です。

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

ブラウザーがすでにペアリング済みで、読み取りアクセスから書き込み/管理者アクセスへ変更する場合、これはサイレント再接続ではなく承認アップグレードとして扱われます。OpenClaw は古い承認を有効なまま保持し、より広い再接続をブロックして、新しいスコープセットを明示的に承認するよう求めます。

承認されるとデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り、再承認は不要です。トークンのローテーションと取り消しについては、[デバイス CLI](/ja-JP/cli/devices) を参照してください。

<Note>
- 直接の local loopback ブラウザー接続（`127.0.0.1` / `localhost`）は自動承認されます。
- `gateway.auth.allowTailscale: true` で、Tailscale ID が検証され、ブラウザーがデバイス ID を提示する場合、Tailscale Serve は Control UI オペレーターセッションのペアリング往復を省略できます。
- 直接の Tailnet バインド、LAN ブラウザー接続、デバイス ID のないブラウザープロファイルでは、引き続き明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイス ID を生成するため、ブラウザーを切り替えたりブラウザーデータを消去したりすると、再ペアリングが必要になります。

</Note>

## 個人 ID（ブラウザーローカル）

Control UI は、共有セッションでの帰属表示のために、送信メッセージに付与されるブラウザーごとの個人 ID（表示名とアバター）をサポートします。これはブラウザーストレージに保存され、現在のブラウザープロファイルにスコープされます。他のデバイスには同期されず、実際に送信したメッセージ上の通常のトランスクリプト作成者メタデータを除き、サーバー側には永続化されません。サイトデータを消去したりブラウザーを切り替えたりすると、空にリセットされます。

同じブラウザーローカルのパターンは、アシスタントアバターの上書きにも適用されます。アップロードされたアシスタントアバターは、ローカルブラウザー上でのみ Gateway が解決した ID に重ねられ、`config.patch` を通じて往復することはありません。共有 `ui.assistant.avatar` 設定フィールドは、このフィールドを直接書き込む非 UI クライアント（スクリプト化された Gateway やカスタムダッシュボードなど）向けに引き続き利用できます。

## ランタイム設定エンドポイント

Control UI は、ランタイム設定を `/__openclaw/control-ui-config.json` から取得します。このエンドポイントは、HTTP サーフェスの他の部分と同じ Gateway 認証で保護されています。未認証のブラウザーは取得できず、取得が成功するには、すでに有効な Gateway トークン/パスワード、Tailscale Serve ID、または trusted-proxy ID のいずれかが必要です。

## 言語サポート

Control UI は、初回読み込み時にブラウザーのロケールに基づいてローカライズできます。後で上書きするには、**概要 -> Gateway アクセス -> 言語**を開きます。ロケールピッカーは Appearance ではなく、Gateway アクセスカード内にあります。

- サポートされるロケール: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 英語以外の翻訳はブラウザーで遅延読み込みされます。
- 選択したロケールはブラウザーストレージに保存され、以後の訪問で再利用されます。
- 欠落している翻訳キーは英語にフォールバックします。

Docs 翻訳は同じ英語以外のロケールセット向けに生成されますが、docs サイトに組み込まれている Mintlify 言語ピッカーは、Mintlify が受け付けるロケールコードに制限されています。タイ語（`th`）とペルシア語（`fa`）の docs は publish repo で引き続き生成されますが、Mintlify がこれらのコードをサポートするまで、そのピッカーには表示されない場合があります。

## 外観テーマ

Appearance パネルには、組み込みの Claw、Knot、Dash テーマに加えて、ブラウザーローカルの tweakcn インポートスロットが 1 つあります。テーマをインポートするには、[tweakcn editor](https://tweakcn.com/editor/theme) を開き、テーマを選択または作成して **Share** をクリックし、コピーしたテーマリンクを Appearance に貼り付けます。インポーターは `https://tweakcn.com/r/themes/<id>` レジストリ URL、`https://tweakcn.com/editor/theme?theme=amethyst-haze` のようなエディター URL、相対 `/themes/<id>` パス、生のテーマ ID、`amethyst-haze` のようなデフォルトテーマ名も受け付けます。

インポートされたテーマは現在のブラウザープロファイルにのみ保存されます。Gateway 設定には書き込まれず、デバイス間で同期されません。インポートしたテーマを置き換えると、1 つのローカルスロットが更新されます。消去すると、インポートしたテーマが選択されていた場合はアクティブなテーマが Claw に戻ります。

## できること（現在）

<AccordionGroup>
  <Accordion title="チャットと音声対話">
    - Gateway WS（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）経由でモデルとチャットできます。
    - チャット履歴の更新は、メッセージごとのテキスト上限付きで範囲を限定した最近のウィンドウを要求するため、大規模なセッションでも、チャットが利用可能になる前にブラウザーが完全なトランスクリプトペイロードをレンダリングする必要はありません。
    - ブラウザーのリアルタイムセッションを通じて音声対話できます。OpenAI は直接 WebRTC を使用し、Google Live は WebSocket 経由の制約付き 1 回限りのブラウザートークンを使用し、バックエンド専用のリアルタイム音声 Plugin は Gateway リレートランスポートを使用します。クライアント所有のプロバイダーセッションは `talk.client.create` で開始し、Gateway リレーセッションは `talk.session.create` で開始します。リレーはプロバイダー認証情報を Gateway に保持し、ブラウザーが `talk.session.appendAudio` を通じてマイク PCM をストリーミングし、Gateway ポリシーとより大きく設定された OpenClaw モデル向けに、`openclaw_agent_consult` プロバイダーツール呼び出しを `talk.client.toolCall` を通じて転送します。
    - チャットでツール呼び出しとライブツール出力カードをストリーミングします（エージェントイベント）。

  </Accordion>
  <Accordion title="チャンネル、インスタンス、セッション、Dreaming">
    - チャンネル: 組み込みおよび同梱/外部 Plugin チャンネルのステータス、QR ログイン、チャンネルごとの設定（`channels.status`, `web.login.*`, `config.patch`）。
    - チャンネルプローブの更新では、遅いプロバイダーチェックが完了するまで以前のスナップショットを表示したままにし、プローブまたは監査が UI 予算を超えた場合は部分スナップショットにラベルが付きます。
    - インスタンス: プレゼンス一覧と更新（`system-presence`）。
    - セッション: 一覧とセッションごとのモデル/thinking/fast/verbose/trace/reasoning 上書き（`sessions.list`, `sessions.patch`）。
    - Dreaming: Dreaming ステータス、有効/無効トグル、Dream Diary リーダー（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）。

  </Accordion>
  <Accordion title="Cron、Skills、ノード、exec 承認">
    - Cron ジョブ: 一覧/追加/編集/実行/有効化/無効化と実行履歴（`cron.*`）。
    - Skills: ステータス、有効化/無効化、インストール、API キー更新（`skills.*`）。
    - ノード: 一覧とキャップ（`node.list`）。
    - exec 承認: `exec host=gateway/node` 向けに Gateway またはノードの許可リストと ask ポリシーを編集（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="設定">
    - `~/.openclaw/openclaw.json` を表示/編集します（`config.get`, `config.set`）。
    - 検証付きで適用して再起動し（`config.apply`）、最後にアクティブだったセッションを起動します。
    - 書き込みには、同時編集の上書きを防ぐ base-hash ガードが含まれます。
    - 書き込み（`config.set`/`config.apply`/`config.patch`）は、送信された設定ペイロード内の参照について、アクティブな SecretRef 解決を事前チェックします。送信された未解決のアクティブ参照は、書き込み前に拒否されます。
    - スキーマとフォームレンダリング（`config.schema` / `config.schema.lookup`。フィールド `title` / `description`、一致した UI ヒント、直接の子要素のサマリー、ネストされた object/wildcard/array/composition ノード上の docs メタデータ、利用可能な場合は Plugin とチャンネルのスキーマを含む）。Raw JSON エディターは、スナップショットが安全に raw round-trip できる場合にのみ利用できます。
    - スナップショットが raw テキストを安全に round-trip できない場合、Control UI は Form モードを強制し、そのスナップショットでは Raw モードを無効化します。
    - Raw JSON エディターの「保存済みにリセット」は、フラット化されたスナップショットを再レンダリングするのではなく、raw で作成された形状（書式、コメント、`$include` レイアウト）を保持するため、スナップショットが安全に round-trip できる場合、外部編集はリセット後も残ります。
    - 構造化された SecretRef オブジェクト値は、意図しないオブジェクトから文字列への破損を防ぐため、フォームのテキスト入力では読み取り専用としてレンダリングされます。

  </Accordion>
  <Accordion title="デバッグ、ログ、更新">
    - デバッグ: status/health/models スナップショット、イベントログ、手動 RPC 呼び出し（`status`, `health`, `models.list`）。
    - イベントログには、Control UI の更新/RPC タイミング、遅いチャット/設定レンダリングのタイミング、ブラウザーがそれらの PerformanceObserver エントリタイプを公開している場合は長いアニメーションフレームや長いタスクに関するブラウザー応答性エントリが含まれます。
    - ログ: フィルター/エクスポート付きの Gateway ファイルログのライブ tail（`logs.tail`）。
    - 更新: 再起動レポート付きで package/git 更新と再起動を実行し（`update.run`）、再接続後に `update.status` をポーリングして実行中の Gateway バージョンを確認します。

  </Accordion>
  <Accordion title="Cron ジョブパネルの注記">
    - 分離ジョブでは、配信のデフォルトはサマリー通知です。内部専用の実行にしたい場合は none に切り替えられます。
    - announce が選択されている場合、チャンネル/ターゲットフィールドが表示されます。
    - Webhook モードは、`delivery.to` を有効な HTTP(S) Webhook URL に設定したうえで `delivery.mode = "webhook"` を使用します。
    - main-session ジョブでは、webhook と none の配信モードを利用できます。
    - 高度な編集コントロールには、実行後削除、エージェント上書きのクリア、cron の exact/stagger オプション、エージェントモデル/thinking 上書き、best-effort 配信トグルが含まれます。
    - フォーム検証はフィールドレベルのエラーとしてインライン表示されます。無効な値がある場合、修正されるまで保存ボタンは無効化されます。
    - 専用 bearer token を送信するには `cron.webhookToken` を設定します。省略した場合、Webhook は認証ヘッダーなしで送信されます。
    - 非推奨のフォールバック: `notify: true` を持つ保存済みのレガシージョブは、移行されるまで引き続き `cron.webhook` を使用できます。

  </Accordion>
</AccordionGroup>

## チャットの動作

<AccordionGroup>
  <Accordion title="送信と履歴のセマンティクス">
    - `chat.send` は **非ブロッキング** です。すぐに `{ runId, status: "started" }` で ack し、レスポンスは `chat` イベント経由でストリーミングされます。
    - チャットのアップロードは、画像に加えて動画以外のファイルを受け付けます。画像はネイティブの画像パスを保持します。その他のファイルは管理対象メディアとして保存され、履歴では添付リンクとして表示されます。
    - 同じ `idempotencyKey` で再送信すると、実行中は `{ status: "in_flight" }` を返し、完了後は `{ status: "ok" }` を返します。
    - `chat.history` のレスポンスは、UI の安全性のためサイズ制限されています。トランスクリプトエントリが大きすぎる場合、Gateway は長いテキストフィールドを切り詰め、重いメタデータブロックを省略し、サイズ超過のメッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えることがあります。
    - アシスタント/生成画像は管理対象メディア参照として永続化され、認証済みの Gateway メディア URL 経由で返されるため、リロードは未加工の base64 画像ペイロードがチャット履歴レスポンスに残っていることに依存しません。
    - `chat.history` をレンダリングするとき、Control UI は表示されるアシスタントテキストから、表示専用のインラインディレクティブタグ（例: `[[reply_to_*]]` と `[[audio_as_voice]]`）、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、漏出した ASCII/全角のモデル制御トークンを取り除き、表示テキスト全体が厳密なサイレントトークン `NO_REPLY` / `no_reply` または Heartbeat 確認トークン `HEARTBEAT_OK` だけのアシスタントエントリを省略します。
    - アクティブな送信中と最後の履歴更新中に、`chat.history` が一時的に古いスナップショットを返した場合でも、チャットビューはローカルの楽観的なユーザー/アシスタントメッセージを表示し続けます。Gateway 履歴が追いつくと、正規のトランスクリプトがそれらのローカルメッセージを置き換えます。
    - ライブの `chat` イベントは配信状態であり、`chat.history` は永続的なセッショントランスクリプトから再構築されます。ツール最終イベントの後、Control UI は履歴を再読み込みし、小さな楽観的末尾だけをマージします。トランスクリプト境界は [WebChat](/ja-JP/web/webchat) に記載されています。
    - `chat.inject` はアシスタントノートをセッショントランスクリプトに追加し、UI 専用更新として `chat` イベントをブロードキャストします（エージェント実行なし、チャネル配信なし）。
    - チャットヘッダーはセッションピッカーの前にエージェントフィルターを表示し、セッションピッカーは選択中のエージェントにスコープされます。エージェントを切り替えると、そのエージェントに関連付けられたセッションだけが表示され、保存済みダッシュボードセッションがまだない場合は、そのエージェントのメインセッションにフォールバックします。
    - デスクトップ幅では、チャットコントロールはコンパクトな 1 行に収まり、トランスクリプトを下へスクロールしている間は折りたたまれます。上へスクロールする、先頭に戻る、または末尾に到達すると、コントロールが復元されます。
    - 連続する重複したテキストのみのメッセージは、件数バッジ付きの 1 つのバブルとしてレンダリングされます。画像、添付ファイル、ツール出力、またはキャンバスプレビューを含むメッセージは折りたたまれません。
    - チャットヘッダーのモデルと thinking のピッカーは、`sessions.patch` 経由でアクティブセッションを即座にパッチします。これらは永続的なセッション上書きであり、1 ターン限りの送信オプションではありません。
    - Control UI で `/new` と入力すると、New Chat と同じ新規ダッシュボードセッションを作成して切り替えます。`/reset` と入力すると、現在のセッションに対して Gateway の明示的なインプレースリセットを維持します。
    - チャットモデルピッカーは、Gateway の設定済みモデルビューを要求します。`agents.defaults.models` が存在する場合、その許可リストがピッカーを駆動します。それ以外の場合、ピッカーは明示的な `models.providers.*.models` エントリと、使用可能な認証を持つプロバイダーを表示します。完全なカタログは、デバッグ用の `models.list` RPC で `view: "all"` を指定すると引き続き利用できます。
    - 新しい Gateway セッション使用量レポートが高いコンテキスト圧を示す場合、チャットコンポーザー領域にコンテキスト通知が表示され、推奨される Compaction レベルでは通常のセッション Compaction パスを実行するコンパクトなボタンが表示されます。古いトークンスナップショットは、Gateway が新しい使用量を再度報告するまで非表示になります。

  </Accordion>
  <Accordion title="トークモード（ブラウザーリアルタイム）">
    トークモードは、登録済みのリアルタイム音声プロバイダーを使用します。OpenAI は `talk.realtime.provider: "openai"` と `talk.realtime.providers.openai.apiKey` で設定します。Google は `talk.realtime.provider: "google"` と `talk.realtime.providers.google.apiKey` で設定します。ブラウザーが標準のプロバイダー API キーを受け取ることはありません。OpenAI は WebRTC 用の一時的な Realtime クライアントシークレットを受け取ります。Google Live はブラウザー WebSocket セッション用に、1 回限りで制約付きの Live API 認証トークンを受け取り、指示とツール宣言は Gateway によってトークン内に固定されます。バックエンドのリアルタイムブリッジだけを公開するプロバイダーは Gateway リレートランスポート経由で実行されるため、認証情報とベンダーソケットはサーバー側に留まり、ブラウザー音声は認証済み Gateway RPC 経由で移動します。Realtime セッションプロンプトは Gateway によって組み立てられます。`talk.client.create` は呼び出し元が提供する指示の上書きを受け付けません。

    チャットコンポーザーでは、Talk コントロールはマイク口述ボタンの隣にある波形ボタンです。Talk が開始すると、コンポーザーのステータス行はまず `Connecting Talk...` を表示し、音声が接続されると `Talk live`、リアルタイムツール呼び出しが `talk.client.toolCall` 経由で設定済みのより大きなモデルに問い合わせている間は `Asking OpenClaw...` を表示します。

    メンテナー向けライブスモーク: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` は、OpenAI ブラウザー WebRTC SDP 交換、Google Live の制約付きトークンによるブラウザー WebSocket セットアップ、および偽のマイクメディアを使った Gateway リレーのブラウザーアダプターを検証します。このコマンドはプロバイダーステータスだけを出力し、シークレットはログに記録しません。

  </Accordion>
  <Accordion title="停止と中止">
    - **Stop** をクリックします（`chat.abort` を呼び出します）。
    - 実行がアクティブな間、通常のフォローアップはキューに入ります。キュー済みメッセージの **Steer** をクリックすると、そのフォローアップを実行中のターンに注入します。
    - 帯域外で中止するには、`/stop`（または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` などの単独の中止フレーズ）を入力します。
    - `chat.abort` は、そのセッションのすべてのアクティブな実行を中止するために `{ sessionKey }`（`runId` なし）をサポートします。

  </Accordion>
  <Accordion title="中止時の部分保持">
    - 実行が中止されても、部分的なアシスタントテキストは UI に引き続き表示できます。
    - バッファ済み出力が存在する場合、Gateway は中止された部分的なアシスタントテキストをトランスクリプト履歴に永続化します。
    - 永続化されたエントリには中止メタデータが含まれるため、トランスクリプト利用側は中止部分と通常の完了出力を区別できます。

  </Accordion>
</AccordionGroup>

## PWA インストールと Web プッシュ

Control UI には `manifest.webmanifest` とサービスワーカーが同梱されているため、モダンブラウザーはこれをスタンドアロン PWA としてインストールできます。Web Push により、タブやブラウザーウィンドウが開いていない場合でも、Gateway は通知でインストール済み PWA を起動できます。

| サーフェス                                            | 機能                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA マニフェスト。到達可能になると、ブラウザーは「Install app」を提示します。 |
| `ui/public/sw.js`                                     | `push` イベントと通知クリックを処理するサービスワーカーです。 |
| `push/vapid-keys.json`（OpenClaw 状態ディレクトリ配下） | Web Push ペイロードの署名に使用される、自動生成された VAPID キーペアです。 |
| `push/web-push-subscriptions.json`                    | 永続化されたブラウザー購読エンドポイントです。                          |

キーを固定したい場合（マルチホストデプロイ、シークレットローテーション、またはテスト）、Gateway プロセス上の環境変数で VAPID キーペアを上書きします。

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（デフォルトは `mailto:openclaw@localhost`）

Control UI は、ブラウザー購読の登録とテストに、これらのスコープ制限された Gateway メソッドを使用します。

- `push.web.vapidPublicKey` — アクティブな VAPID 公開鍵を取得します。
- `push.web.subscribe` — `endpoint` と `keys.p256dh`/`keys.auth` を登録します。
- `push.web.unsubscribe` — 登録済みエンドポイントを削除します。
- `push.web.test` — 呼び出し元の購読にテスト通知を送信します。

<Note>
Web Push は、iOS APNS リレーパス（リレーで支えられたプッシュについては [設定](/ja-JP/gateway/configuration) を参照）および既存の `push.test` メソッドから独立しています。これらはネイティブモバイルペアリングを対象とします。
</Note>

## ホスト型埋め込み

アシスタントメッセージは、`[embed ...]` ショートコードでホスト型 Web コンテンツをインラインレンダリングできます。iframe サンドボックスポリシーは `gateway.controlUi.embedSandbox` で制御されます。

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
埋め込みドキュメントが本当に same-origin 動作を必要とする場合にのみ、`trusted` を使用してください。ほとんどのエージェント生成ゲームやインタラクティブキャンバスでは、`scripts` の方が安全な選択です。
</Warning>

絶対外部 `http(s)` 埋め込み URL はデフォルトでブロックされたままです。意図的に `[embed url="https://..."]` でサードパーティページを読み込みたい場合は、`gateway.controlUi.allowExternalEmbedUrls: true` を設定します。

## チャットメッセージ幅

グループ化されたチャットメッセージは、読みやすいデフォルトの max-width を使用します。ワイドモニターのデプロイでは、`gateway.controlUi.chatMessageMaxWidth` を設定することで、同梱 CSS にパッチを当てずに上書きできます。

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
    Gateway を loopback に保ち、Tailscale Serve に HTTPS でプロキシさせます。

    ```bash
    openclaw gateway --tailscale serve
    ```

    開く:

    - `https://<magicdns>/`（または設定済みの `gateway.controlUi.basePath`）

    デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket Serve リクエストは Tailscale ID ヘッダー（`tailscale-user-login`）経由で認証できます。OpenClaw は、`x-forwarded-for` アドレスを `tailscale whois` で解決してヘッダーと照合することで ID を検証し、リクエストが loopback に到達し、Tailscale の `x-forwarded-*` ヘッダーを持つ場合にのみ受け付けます。ブラウザーデバイス ID を持つ Control UI オペレーターセッションでは、この検証済み Serve パスはデバイスペアリングの往復もスキップします。デバイスなしブラウザーと node ロール接続は、引き続き通常のデバイスチェックに従います。Serve トラフィックであっても明示的な共有シークレット認証情報を要求したい場合は、`gateway.auth.allowTailscale: false` を設定します。その後、`gateway.auth.mode: "token"` または `"password"` を使用します。

    その非同期 Serve ID パスでは、同じクライアント IP と認証スコープに対する失敗した認証試行は、レート制限の書き込み前に直列化されます。そのため、同じブラウザーからの同時の不正リトライでは、2 つの単純な不一致が並列に競合する代わりに、2 つ目のリクエストで `retry later` が表示されることがあります。

    <Warning>
    トークンレス Serve 認証は、ゲートウェイホストが信頼されていることを前提とします。信頼されていないローカルコードがそのホストで実行される可能性がある場合は、トークン/パスワード認証を要求してください。
    </Warning>

  </Tab>
  <Tab title="tailnet にバインド + トークン">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    次を開きます。

    - `http://<tailscale-ip>:18789/`（または設定済みの `gateway.controlUi.basePath`）

    一致する共有シークレットを UI 設定に貼り付けます（`connect.params.auth.token` または `connect.params.auth.password` として送信されます）。

  </Tab>
</Tabs>

## 安全でない HTTP

プレーン HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、ブラウザは**非セキュアコンテキスト**で実行され、WebCrypto をブロックします。デフォルトでは、OpenClaw はデバイス ID のない Control UI 接続を**ブロック**します。

文書化されている例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost 専用の安全でない HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` によるオペレーター Control UI 認証の成功
- 緊急用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS（Tailscale Serve）を使うか、UI をローカルで開きます。

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

    `allowInsecureAuth` はローカル互換性用のトグルのみです。

    - 非セキュアな HTTP コンテキストで、localhost の Control UI セッションがデバイス ID なしで続行できるようにします。
    - ペアリングチェックをバイパスしません。
    - リモート（非 localhost）のデバイス ID 要件を緩和しません。

  </Accordion>
  <Accordion title="緊急時専用">
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
    `dangerouslyDisableDeviceAuth` は Control UI のデバイス ID チェックを無効化し、深刻なセキュリティ低下を引き起こします。緊急時の使用後は速やかに元に戻してください。
    </Warning>

  </Accordion>
  <Accordion title="信頼済みプロキシの注意">
    - 信頼済みプロキシ認証に成功すると、デバイス ID なしで**オペレーター** Control UI セッションを許可できます。
    - これはノードロールの Control UI セッションには拡張されません。
    - 同一ホストの loopback リバースプロキシでも信頼済みプロキシ認証は満たされません。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照してください。

  </Accordion>
</AccordionGroup>

HTTPS セットアップのガイダンスについては [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## コンテンツセキュリティポリシー

Control UI には厳格な `img-src` ポリシーが付属しています。許可されるのは**同一オリジン**のアセット、`data:` URL、ローカルで生成された `blob:` URL のみです。リモートの `http(s)` およびプロトコル相対の画像 URL はブラウザによって拒否され、ネットワークフェッチは発行されません。

実際には次のようになります。

- 相対パス（例: `/avatars/<id>`）配下で提供されるアバターと画像は引き続きレンダリングされます。UI がフェッチしてローカルの `blob:` URL に変換する、認証済みアバタールートも含まれます。
- インラインの `data:image/...` URL は引き続きレンダリングされます（プロトコル内ペイロードに有用です）。
- Control UI によって作成されたローカルの `blob:` URL は引き続きレンダリングされます。
- チャンネルメタデータから出力されたリモートアバター URL は、Control UI のアバターヘルパーで取り除かれ、組み込みのロゴ/バッジに置き換えられます。そのため、侵害された、または悪意のあるチャンネルが、オペレーターのブラウザから任意のリモート画像フェッチを強制することはできません。

この動作を得るために何かを変更する必要はありません。常に有効で、設定はできません。

## アバタールートの認証

Gateway 認証が設定されている場合、Control UI のアバターエンドポイントは API の他の部分と同じ Gateway トークンを要求します。

- `GET /avatar/<agentId>` は認証済みの呼び出し元にのみアバター画像を返します。`GET /avatar/<agentId>?meta=1` は同じルールの下でアバターメタデータを返します。
- どちらのルートへの未認証リクエストも拒否されます（兄弟の assistant-media ルートと同様）。これにより、それ以外は保護されているホストで、アバタールートがエージェント ID を漏えいすることを防ぎます。
- Control UI 自体は、アバターをフェッチする際に Gateway トークンを bearer ヘッダーとして転送し、認証済みの blob URL を使用するため、画像はダッシュボード内で引き続きレンダリングされます。

Gateway 認証を無効にした場合（共有ホストでは推奨されません）、Gateway の他の部分と同様に、アバタールートも未認証になります。

## アシスタントメディアルートの認証

Gateway 認証が設定されている場合、アシスタントのローカルメディアプレビューは 2 段階のルートを使用します。

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` は通常の Control UI オペレーター認証を要求します。ブラウザは可用性を確認するときに、Gateway トークンを bearer ヘッダーとして送信します。
- 成功したメタデータレスポンスには、その正確なソースパスにスコープされた短命の `mediaTicket` が含まれます。
- ブラウザでレンダリングされる画像、音声、動画、ドキュメントの URL は、アクティブな Gateway トークンやパスワードではなく `mediaTicket=<ticket>` を使用します。このチケットはすぐに期限切れになり、別のソースを認可することはできません。

これにより、再利用可能な Gateway 認証情報を可視のメディア URL に入れることなく、通常のメディアレンダリングをブラウザネイティブのメディア要素と互換に保てます。

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

その後、UI を Gateway の WS URL（例: `ws://127.0.0.1:18789`）に向けます。

## デバッグ/テスト: 開発サーバー + リモート Gateway

Control UI は静的ファイルです。WebSocket ターゲットは設定可能で、HTTP オリジンとは異なっていてもかまいません。これは、Vite 開発サーバーをローカルで使いながら、Gateway を別の場所で実行したい場合に便利です。

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

    任意のワンタイム認証（必要な場合）:

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="注意">
    - `gatewayUrl` は読み込み後に localStorage に保存され、URL から削除されます。
    - `gatewayUrl` 経由で完全な `ws://` または `wss://` エンドポイントを渡す場合は、ブラウザがクエリ文字列を正しく解析できるように `gatewayUrl` 値を URL エンコードしてください。
    - 可能な限り、`token` は URL フラグメント（`#token=...`）経由で渡してください。フラグメントはサーバーに送信されないため、リクエストログや Referer への漏えいを避けられます。従来の `?token=` クエリパラメーターも互換性のために一度だけインポートされますが、フォールバックとしてのみ扱われ、ブートストラップ直後に取り除かれます。
    - `password` はメモリ内のみに保持されます。
    - `gatewayUrl` が設定されている場合、UI は設定や環境の認証情報にフォールバックしません。`token`（または `password`）を明示的に指定してください。明示的な認証情報がない場合はエラーです。
    - Gateway が TLS（Tailscale Serve、HTTPS プロキシなど）の背後にある場合は `wss://` を使用してください。
    - クリックジャッキングを防ぐため、`gatewayUrl` はトップレベルウィンドウ（埋め込みではない）でのみ受け付けられます。
    - 非 loopback の Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を明示的に設定する必要があります（完全なオリジン）。これにはリモート開発セットアップも含まれます。
    - Gateway の起動時に、有効なランタイムの bind とポートから `http://localhost:<port>` や `http://127.0.0.1:<port>` などのローカルオリジンがシードされる場合がありますが、リモートブラウザのオリジンには引き続き明示的なエントリが必要です。
    - 厳密に制御されたローカルテストを除き、`gateway.controlUi.allowedOrigins: ["*"]` は使用しないでください。これは任意のブラウザオリジンを許可するという意味であり、「自分が使っているホストに一致させる」という意味ではありません。
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

リモートアクセスのセットアップ詳細: [リモートアクセス](/ja-JP/gateway/remote)。

## 関連

- [ダッシュボード](/ja-JP/web/dashboard) — Gateway ダッシュボード
- [ヘルスチェック](/ja-JP/gateway/health) — Gateway ヘルス監視
- [TUI](/ja-JP/web/tui) — ターミナルユーザーインターフェイス
- [WebChat](/ja-JP/web/webchat) — ブラウザベースのチャットインターフェイス
