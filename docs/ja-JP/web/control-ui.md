---
read_when:
    - ブラウザーからGatewayを操作したい場合
    - SSH トンネルなしで Tailnet にアクセスしたい
sidebarTitle: Control UI
summary: ブラウザベースの Gateway 用コントロール UI（チャット、ノード、設定）
title: 制御 UI
x-i18n:
    generated_at: "2026-05-02T21:09:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 88959ccf435b31015039bf28c3043023d99f0b953a1489986ab2d0cbd261771c
    source_path: web/control-ui.md
    workflow: 16
---

Control UI は、Gateway によって提供される小さな **Vite + Lit** シングルページアプリです。

- 既定: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します (例: `/openclaw`)

同じポート上の **Gateway WebSocket** と直接通信します。

## すばやく開く (ローカル)

Gateway が同じコンピューターで実行されている場合は、次を開きます。

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (または [http://localhost:18789/](http://localhost:18789/))

ページの読み込みに失敗する場合は、先に Gateway を起動してください: `openclaw gateway`。

認証は WebSocket ハンドシェイク中に次を通じて提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合の Tailscale Serve ID ヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合の信頼済みプロキシ ID ヘッダー

ダッシュボード設定パネルは、現在のブラウザータブセッションと選択した gateway URL のトークンを保持します。パスワードは永続化されません。オンボーディングでは通常、初回接続時に共有シークレット認証用の gateway トークンが生成されますが、`gateway.auth.mode` が `"password"` の場合はパスワード認証も機能します。

## デバイスのペアリング (初回接続)

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

ブラウザーが変更された認証詳細 (role/scopes/public key) でペアリングを再試行すると、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認する前に `openclaw devices list` を再実行してください。

ブラウザーがすでにペアリング済みで、読み取りアクセスから書き込み/admin アクセスに変更する場合、これはサイレント再接続ではなく承認アップグレードとして扱われます。OpenClaw は古い承認を有効なまま保持し、より広い権限での再接続をブロックして、新しいスコープセットを明示的に承認するよう求めます。

承認されるとデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り再承認は不要です。トークンのローテーションと失効については [デバイス CLI](/ja-JP/cli/devices) を参照してください。

<Note>
- 直接の local loopback ブラウザー接続 (`127.0.0.1` / `localhost`) は自動承認されます。
- `gateway.auth.allowTailscale: true` で、Tailscale ID が検証され、ブラウザーがデバイス ID を提示する場合、Tailscale Serve は Control UI オペレーターセッションのペアリング往復を省略できます。
- 直接の Tailnet バインド、LAN ブラウザー接続、デバイス ID のないブラウザープロファイルでは、引き続き明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイス ID を生成するため、ブラウザーを切り替えたりブラウザーデータを消去したりすると、再ペアリングが必要になります。

</Note>

## 個人 ID (ブラウザーローカル)

Control UI は、共有セッションでの帰属表示のために送信メッセージへ付加される、ブラウザーごとの個人 ID (表示名とアバター) をサポートします。これはブラウザーストレージに保存され、現在のブラウザープロファイルにスコープされます。他のデバイスには同期されず、実際に送信したメッセージ上の通常のトランスクリプト作成者メタデータを除いて、サーバー側に永続化されることもありません。サイトデータを消去したりブラウザーを切り替えたりすると、空の状態にリセットされます。

同じブラウザーローカルのパターンは、アシスタントアバターのオーバーライドにも適用されます。アップロードされたアシスタントアバターは、ローカルブラウザー上でのみ gateway が解決した ID に重ねて表示され、`config.patch` を経由して往復することはありません。共有の `ui.assistant.avatar` 設定フィールドは、このフィールドへ直接書き込む非 UI クライアント (スクリプト化された gateways やカスタムダッシュボードなど) では引き続き利用できます。

## ランタイム設定エンドポイント

Control UI は、ランタイム設定を `/__openclaw/control-ui-config.json` から取得します。このエンドポイントは HTTP サーフェスの他の部分と同じ gateway 認証で保護されています。未認証のブラウザーは取得できず、取得に成功するには、すでに有効な gateway トークン/パスワード、Tailscale Serve ID、または信頼済みプロキシ ID のいずれかが必要です。

## 言語サポート

Control UI は、初回読み込み時にブラウザーのロケールに基づいて自身をローカライズできます。後から上書きするには、**概要 -> Gateway アクセス -> 言語**を開きます。ロケールピッカーは Appearance ではなく、Gateway アクセスカード内にあります。

- サポートされるロケール: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 英語以外の翻訳はブラウザー内で遅延読み込みされます。
- 選択したロケールはブラウザーストレージに保存され、以降の訪問で再利用されます。
- 翻訳キーがない場合は英語にフォールバックします。

ドキュメント翻訳も同じ英語以外のロケールセットに対して生成されますが、ドキュメントサイト内蔵の Mintlify 言語ピッカーは、Mintlify が受け入れるロケールコードに制限されています。タイ語 (`th`) とペルシャ語 (`fa`) のドキュメントも公開リポジトリに生成されていますが、Mintlify がそれらのコードをサポートするまで、そのピッカーには表示されない場合があります。

## 外観テーマ

Appearance パネルには、組み込みの Claw、Knot、Dash テーマに加えて、ブラウザーローカルの tweakcn インポートスロットが 1 つあります。テーマをインポートするには、[tweakcn themes](https://tweakcn.com/themes) を開き、テーマを選択または作成し、**Share** をクリックして、コピーしたテーマリンクを Appearance に貼り付けます。インポーターは `https://tweakcn.com/r/themes/<id>` レジストリ URL、`https://tweakcn.com/editor/theme?theme=amethyst-haze` のようなエディター URL、相対 `/themes/<id>` パス、生のテーマ ID、`amethyst-haze` などの既定テーマ名も受け付けます。

インポートされたテーマは現在のブラウザープロファイル内にのみ保存されます。gateway 設定には書き込まれず、デバイス間で同期されません。インポート済みテーマを置き換えると、その 1 つのローカルスロットが更新されます。消去すると、インポート済みテーマが選択されていた場合はアクティブなテーマが Claw に戻ります。

## できること (現時点)

<AccordionGroup>
  <Accordion title="チャットと通話">
    - Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`) を介してモデルとチャットします。
    - ブラウザーのリアルタイムセッションを通じて通話します。OpenAI は直接 WebRTC を使用し、Google Live は WebSocket 経由の制約付き 1 回用ブラウザートークンを使用し、バックエンド専用のリアルタイム音声 plugins は Gateway リレートランスポートを使用します。リレーはプロバイダー認証情報を Gateway 上に保持し、ブラウザーは `talk.realtime.relay*` RPC を通じてマイク PCM をストリーミングし、より大きな設定済み OpenClaw モデルに対する `openclaw_agent_consult` ツール呼び出しを `chat.send` 経由で送り返します。
    - チャット内でツール呼び出しとライブツール出力カードをストリーミングします (エージェントイベント)。

  </Accordion>
  <Accordion title="チャンネル、インスタンス、セッション、dreams">
    - チャンネル: 組み込みおよび同梱/外部 plugin チャンネルのステータス、QR ログイン、チャンネルごとの設定 (`channels.status`, `web.login.*`, `config.patch`)。
    - インスタンス: プレゼンス一覧と更新 (`system-presence`)。
    - セッション: 一覧とセッションごとの model/thinking/fast/verbose/trace/reasoning オーバーライド (`sessions.list`, `sessions.patch`)。
    - Dreams: dreaming ステータス、有効/無効の切り替え、Dream Diary リーダー (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)。

  </Accordion>
  <Accordion title="Cron、skills、nodes、exec 承認">
    - Cron ジョブ: 一覧/追加/編集/実行/有効化/無効化と実行履歴 (`cron.*`)。
    - Skills: ステータス、有効化/無効化、インストール、API キー更新 (`skills.*`)。
    - Nodes: 一覧と caps (`node.list`)。
    - Exec 承認: gateway または node の allowlists と `exec host=gateway/node` の ask policy を編集します (`exec.approvals.*`)。

  </Accordion>
  <Accordion title="設定">
    - `~/.openclaw/openclaw.json` を表示/編集します (`config.get`, `config.set`)。
    - 検証付きで適用して再起動し (`config.apply`)、最後にアクティブだったセッションを起動します。
    - 書き込みには、同時編集による上書きを防ぐ base-hash ガードが含まれます。
    - 書き込み (`config.set`/`config.apply`/`config.patch`) は、送信された設定ペイロード内の refs についてアクティブな SecretRef 解決を事前確認します。未解決のアクティブな送信済み refs は、書き込み前に拒否されます。
    - スキーマとフォームレンダリング (`config.schema` / `config.schema.lookup`。フィールド `title` / `description`、一致した UI ヒント、直下の子サマリー、ネストされた object/wildcard/array/composition nodes 上の docs metadata、利用可能な場合は plugin と channel schemas を含む)。Raw JSON エディターは、スナップショットが安全な raw 往復を持つ場合にのみ利用できます。
    - スナップショットが raw テキストを安全に往復できない場合、Control UI は Form モードを強制し、そのスナップショットの Raw モードを無効にします。
    - Raw JSON エディターの「Reset to saved」は、フラット化されたスナップショットを再レンダリングする代わりに、raw で作成された形状 (フォーマット、コメント、`$include` レイアウト) を保持するため、スナップショットが安全に往復できる場合は外部編集がリセット後も残ります。
    - 構造化された SecretRef オブジェクト値は、誤って object から string に破損するのを防ぐため、フォームのテキスト入力では読み取り専用でレンダリングされます。

  </Accordion>
  <Accordion title="デバッグ、ログ、更新">
    - デバッグ: status/health/models スナップショット、イベントログ、手動 RPC 呼び出し (`status`, `health`, `models.list`)。
    - ログ: フィルター/エクスポート付きの gateway ファイルログのライブ tail (`logs.tail`)。
    - 更新: restart report 付きで package/git update と再起動を実行し (`update.run`)、再接続後に `update.status` をポーリングして実行中の gateway バージョンを確認します。

  </Accordion>
  <Accordion title="Cron ジョブパネルの注記">
    - 分離ジョブでは、配信の既定値は announce summary です。内部専用の実行にしたい場合は none に切り替えられます。
    - announce が選択されている場合、channel/target フィールドが表示されます。
    - Webhook モードは、有効な HTTP(S) webhook URL に設定された `delivery.to` とともに `delivery.mode = "webhook"` を使用します。
    - main-session ジョブでは、webhook と none の配信モードを利用できます。
    - 詳細編集コントロールには、delete-after-run、clear agent override、cron exact/stagger options、agent model/thinking overrides、best-effort delivery toggles が含まれます。
    - フォーム検証はフィールド単位のエラーとしてインライン表示されます。無効な値がある場合、修正されるまで保存ボタンは無効になります。
    - 専用 bearer token を送信するには `cron.webhookToken` を設定します。省略した場合、webhook は auth header なしで送信されます。
    - 非推奨のフォールバック: `notify: true` を持つ保存済み legacy jobs は、移行されるまで引き続き `cron.webhook` を使用できます。

  </Accordion>
</AccordionGroup>

## チャットの動作

<AccordionGroup>
  <Accordion title="送信と履歴のセマンティクス">
    - `chat.send` は**非ブロッキング**です。`{ runId, status: "started" }` ですぐに ack し、応答は `chat` イベント経由でストリーミングされます。
    - チャットのアップロードは、画像と動画以外のファイルを受け付けます。画像はネイティブ画像パスを保持し、その他のファイルは管理対象メディアとして保存され、履歴には添付リンクとして表示されます。
    - 同じ `idempotencyKey` で再送信すると、実行中は `{ status: "in_flight" }` が返り、完了後は `{ status: "ok" }` が返ります。
    - `chat.history` の応答は、UI の安全性のためサイズ制限があります。トランスクリプトのエントリが大きすぎる場合、Gateway は長いテキストフィールドを切り詰め、重いメタデータブロックを省略し、サイズ超過のメッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えることがあります。
    - アシスタント/生成画像は管理対象メディア参照として永続化され、認証済み Gateway メディア URL 経由で返されるため、再読み込みは raw base64 画像ペイロードがチャット履歴応答に残っていることに依存しません。
    - `chat.history` は、表示されるアシスタントテキストから表示専用のインラインディレクティブタグ（たとえば `[[reply_to_*]]` と `[[audio_as_voice]]`）、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、切り詰められたツール呼び出しブロックを含む）、漏出した ASCII/全角のモデル制御トークンも取り除き、表示テキスト全体が正確なサイレントトークン `NO_REPLY` / `no_reply` だけであるアシスタントエントリを省略します。
    - アクティブな送信中と最終的な履歴更新中に、`chat.history` が短時間古いスナップショットを返した場合でも、チャットビューはローカルの楽観的なユーザー/アシスタントメッセージを表示し続けます。Gateway 履歴が追いつくと、正規のトランスクリプトがそれらのローカルメッセージを置き換えます。
    - `chat.inject` はアシスタントメモをセッションのトランスクリプトに追加し、UI 専用更新のために `chat` イベントをブロードキャストします（エージェント実行なし、チャネル配信なし）。
    - チャットヘッダーのモデルと thinking ピッカーは、`sessions.patch` 経由でアクティブセッションを即座にパッチします。これらは永続的なセッションオーバーライドであり、1 ターン限りの送信オプションではありません。
    - Control UI で `/new` と入力すると、New Chat と同じ新しいダッシュボードセッションが作成され、そこに切り替わります。`/reset` と入力すると、現在のセッションに対して Gateway の明示的なインプレースリセットが保持されます。
    - チャットモデルピッカーは、Gateway の設定済みモデルビューを要求します。`agents.defaults.models` が存在する場合、その許可リストがピッカーを制御します。存在しない場合、ピッカーには明示的な `models.providers.*.models` エントリと、使用可能な認証を持つプロバイダーが表示されます。完全なカタログは、デバッグ用 `models.list` RPC の `view: "all"` 経由で引き続き利用できます。
    - 新しい Gateway セッション使用状況レポートが高いコンテキスト負荷を示す場合、チャットコンポーザー領域にコンテキスト通知が表示され、推奨される Compaction レベルでは通常のセッション Compaction パスを実行するコンパクトボタンが表示されます。古いトークンスナップショットは、Gateway が新しい使用状況を再び報告するまで非表示になります。

  </Accordion>
  <Accordion title="トークモード（ブラウザーリアルタイム）">
    トークモードは、登録済みのリアルタイム音声プロバイダーを使用します。OpenAI は `talk.provider: "openai"` と `talk.providers.openai.apiKey` で設定し、Google は `talk.provider: "google"` と `talk.providers.google.apiKey` で設定します。Voice Call のリアルタイムプロバイダー設定はフォールバックとして引き続き再利用できます。ブラウザーが標準のプロバイダー API キーを受け取ることはありません。OpenAI は WebRTC 用の一時的な Realtime クライアントシークレットを受け取ります。Google Live は、ブラウザー WebSocket セッション用の 1 回限りの制約付き Live API 認証トークンを受け取り、そのトークンには Gateway によって指示とツール宣言が固定されます。バックエンドのリアルタイムブリッジしか公開しないプロバイダーは、Gateway リレートランスポートを通じて実行されるため、認証情報とベンダーソケットはサーバー側に残り、ブラウザー音声は認証済み Gateway RPC を通じて移動します。Realtime セッションプロンプトは Gateway によって組み立てられます。`talk.realtime.session` は呼び出し元が指定する指示オーバーライドを受け付けません。

    Chat コンポーザーでは、Talk コントロールはマイクディクテーションボタンの隣にある波形ボタンです。Talk が開始すると、コンポーザーステータス行には `Connecting Talk...` が表示され、音声が接続されると `Talk live`、リアルタイムツール呼び出しが `chat.send` 経由で設定済みの大きなモデルに問い合わせている間は `Asking OpenClaw...` が表示されます。

    メンテナー向けライブスモーク: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` は、OpenAI ブラウザー WebRTC SDP 交換、Google Live の制約付きトークンによるブラウザー WebSocket セットアップ、偽のマイクメディアを使った Gateway リレーブラウザーアダプターを検証します。このコマンドはプロバイダーステータスのみを出力し、シークレットはログに記録しません。

  </Accordion>
  <Accordion title="停止と中断">
    - **Stop** をクリックします（`chat.abort` を呼び出します）。
    - 実行がアクティブな間、通常のフォローアップはキューに入ります。キュー内のメッセージで **Steer** をクリックすると、そのフォローアップを実行中のターンに注入できます。
    - `/stop`（または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` のような単独の中断フレーズ）を入力すると、帯域外で中断します。
    - `chat.abort` は、そのセッションのすべてのアクティブな実行を中断するために `{ sessionKey }`（`runId` なし）をサポートします。

  </Accordion>
  <Accordion title="中断時の部分保持">
    - 実行が中断された場合でも、部分的なアシスタントテキストを UI に表示できます。
    - Gateway は、バッファーされた出力が存在する場合、中断された部分的なアシスタントテキストをトランスクリプト履歴に永続化します。
    - 永続化されたエントリには中断メタデータが含まれるため、トランスクリプトの利用者は中断部分と通常の完了出力を区別できます。

  </Accordion>
</AccordionGroup>

## PWA のインストールと Web Push

Control UI には `manifest.webmanifest` とサービスワーカーが同梱されているため、モダンブラウザーはそれをスタンドアロン PWA としてインストールできます。Web Push により、タブやブラウザーウィンドウが開いていない場合でも、Gateway は通知でインストール済み PWA を起動できます。

| サーフェス                                            | 役割                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA マニフェスト。到達可能になると、ブラウザーは「アプリをインストール」を提示します。 |
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
Web Push は、iOS APNS リレーパス（リレー支援プッシュについては [設定](/ja-JP/gateway/configuration) を参照）および既存の `push.test` メソッドとは独立しています。これらはネイティブモバイルペアリングを対象にしています。
</Note>

## ホスト埋め込み

アシスタントメッセージは、`[embed ...]` ショートコードでホストされた Web コンテンツをインライン表示できます。iframe サンドボックスポリシーは `gateway.controlUi.embedSandbox` で制御されます。

<Tabs>
  <Tab title="strict">
    ホスト埋め込み内でのスクリプト実行を無効にします。
  </Tab>
  <Tab title="scripts (default)">
    オリジン分離を維持しながら、インタラクティブな埋め込みを許可します。これはデフォルトであり、通常は自己完結型のブラウザーゲーム/ウィジェットに十分です。
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
埋め込みドキュメントが本当に same-origin 動作を必要とする場合にのみ `trusted` を使用してください。ほとんどのエージェント生成ゲームやインタラクティブキャンバスでは、`scripts` のほうが安全な選択です。
</Warning>

絶対外部 `http(s)` 埋め込み URL はデフォルトでブロックされたままです。意図的に `[embed url="https://..."]` でサードパーティページを読み込みたい場合は、`gateway.controlUi.allowExternalEmbedUrls: true` を設定します。

## チャットメッセージ幅

グループ化されたチャットメッセージには、読みやすいデフォルトの最大幅が使用されます。ワイドモニターのデプロイでは、`gateway.controlUi.chatMessageMaxWidth` を設定することで、同梱 CSS をパッチせずにオーバーライドできます。

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

## Tailnet アクセス（推奨）

<Tabs>
  <Tab title="統合 Tailscale Serve（推奨）">
    Gateway を loopback に維持し、Tailscale Serve に HTTPS でプロキシさせます。

    ```bash
    openclaw gateway --tailscale serve
    ```

    開く:

    - `https://<magicdns>/`（または設定済みの `gateway.controlUi.basePath`）

    デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket Serve リクエストは Tailscale アイデンティティヘッダー（`tailscale-user-login`）で認証できます。OpenClaw は `x-forwarded-for` アドレスを `tailscale whois` で解決し、それをヘッダーと照合することでアイデンティティを検証します。また、リクエストが Tailscale の `x-forwarded-*` ヘッダー付きで loopback に到達した場合にのみ受け付けます。ブラウザーデバイスアイデンティティを持つ Control UI オペレーターセッションでは、この検証済み Serve パスはデバイスペアリングの往復もスキップします。デバイスなしのブラウザーと node-role 接続は、通常のデバイスチェックに引き続き従います。Serve トラフィックでも明示的な共有シークレット認証情報を必須にしたい場合は、`gateway.auth.allowTailscale: false` を設定します。その後、`gateway.auth.mode: "token"` または `"password"` を使用します。

    その非同期 Serve アイデンティティパスでは、同じクライアント IP と認証スコープに対する失敗した認証試行は、レート制限の書き込み前に直列化されます。そのため、同じブラウザーからの並行した不正な再試行では、2 つの単純な不一致が並列に競合する代わりに、2 番目のリクエストで `retry later` が表示されることがあります。

    <Warning>
    トークンなしの Serve 認証は、ゲートウェイホストが信頼されていることを前提としています。そのホスト上で信頼できないローカルコードが実行される可能性がある場合は、トークン/パスワード認証を必須にしてください。
    </Warning>

  </Tab>
  <Tab title="tailnet にバインド + トークン">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    その後、開きます。

    - `http://<tailscale-ip>:18789/`（または設定済みの `gateway.controlUi.basePath`）

    一致する共有シークレットを UI 設定に貼り付けます（`connect.params.auth.token` または `connect.params.auth.password` として送信されます）。

  </Tab>
</Tabs>

## 安全でない HTTP

プレーン HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、ブラウザーは**非セキュアコンテキスト**で実行され、WebCrypto をブロックします。デフォルトでは、OpenClaw はデバイスアイデンティティのない Control UI 接続を**ブロック**します。

文書化された例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost 専用の安全でない HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` 経由で成功したオペレーター Control UI 認証
- 緊急回避用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS（Tailscale Serve）を使用するか、UI をローカルで開きます。

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（ゲートウェイホスト上）

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

    - localhost の Control UI セッションが、安全でない HTTP コンテキストでデバイス ID なしに進行できるようにします。
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
    `dangerouslyDisableDeviceAuth` は Control UI のデバイス ID チェックを無効化し、重大なセキュリティ低下を招きます。緊急使用後は速やかに元に戻してください。
    </Warning>

  </Accordion>
  <Accordion title="信頼済みプロキシの注記">
    - 信頼済みプロキシ認証に成功すると、デバイス ID なしで **operator** Control UI セッションを許可できます。
    - これは node ロールの Control UI セッションには拡張されません。
    - 同一ホストの loopback リバースプロキシは、それでも信頼済みプロキシ認証を満たしません。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照してください。

  </Accordion>
</AccordionGroup>

HTTPS セットアップのガイダンスについては [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## コンテンツセキュリティポリシー

Control UI には厳格な `img-src` ポリシーが同梱されています。許可されるのは **same-origin** アセット、`data:` URL、ローカルで生成された `blob:` URL のみです。リモートの `http(s)` およびプロトコル相対の画像 URL はブラウザーによって拒否され、ネットワークフェッチは発行されません。

実際には次の意味になります。

- 相対パス（例: `/avatars/<id>`）で提供されるアバターと画像は、UI が取得してローカル `blob:` URL に変換する認証付きアバタールートを含め、引き続きレンダリングされます。
- インラインの `data:image/...` URL は引き続きレンダリングされます（プロトコル内ペイロードに有用です）。
- Control UI が作成したローカル `blob:` URL は引き続きレンダリングされます。
- チャンネルメタデータから出力されるリモートアバター URL は、Control UI のアバターヘルパーで取り除かれ、組み込みロゴ/バッジに置き換えられます。そのため、侵害された、または悪意のあるチャンネルが、operator のブラウザーから任意のリモート画像フェッチを強制することはできません。

この動作を得るために何かを変更する必要はありません。常に有効であり、設定で変更することはできません。

## アバタールート認証

Gateway 認証が設定されている場合、Control UI のアバターエンドポイントは API の他の部分と同じ Gateway トークンを要求します。

- `GET /avatar/<agentId>` は、認証済みの呼び出し元にのみアバター画像を返します。`GET /avatar/<agentId>?meta=1` は、同じルールの下でアバターメタデータを返します。
- どちらのルートへの未認証リクエストも拒否されます（隣接する assistant-media ルートと同様）。これにより、それ以外は保護されているホストで、アバタールートからエージェント ID が漏えいするのを防ぎます。
- Control UI 自体は、アバター取得時に Gateway トークンを bearer ヘッダーとして転送し、認証済みの blob URL を使用するため、画像はダッシュボードで引き続きレンダリングされます。

Gateway 認証を無効にした場合（共有ホストでは非推奨）、Gateway の他の部分と同様に、アバタールートも未認証になります。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを提供します。次でビルドします。

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

次に、UI に Gateway WS URL（例: `ws://127.0.0.1:18789`）を指定します。

## デバッグ/テスト: 開発サーバー + リモート Gateway

Control UI は静的ファイルです。WebSocket ターゲットは設定可能で、HTTP オリジンと異なっていてもかまいません。これは、Vite 開発サーバーをローカルで使い、Gateway は別の場所で実行したい場合に便利です。

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

    任意の 1 回限りの認証（必要な場合）:

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="注記">
    - `gatewayUrl` はロード後に localStorage に保存され、URL から削除されます。
    - `gatewayUrl` 経由で完全な `ws://` または `wss://` エンドポイントを渡す場合は、ブラウザーがクエリ文字列を正しく解析できるように、`gatewayUrl` の値を URL エンコードしてください。
    - 可能な限り、`token` は URL フラグメント（`#token=...`）経由で渡してください。フラグメントはサーバーに送信されないため、リクエストログや Referer の漏えいを避けられます。従来の `?token=` クエリパラメーターは互換性のために一度だけインポートされますが、フォールバックとしてのみ使用され、ブートストラップ直後に取り除かれます。
    - `password` はメモリ内にのみ保持されます。
    - `gatewayUrl` が設定されている場合、UI は設定または環境の認証情報にフォールバックしません。`token`（または `password`）を明示的に指定してください。明示的な認証情報がない場合はエラーです。
    - Gateway が TLS（Tailscale Serve、HTTPS プロキシなど）の背後にある場合は `wss://` を使用してください。
    - `gatewayUrl` は、クリックジャッキングを防ぐため、トップレベルウィンドウでのみ受け付けられます（埋め込みでは不可）。
    - 非 loopback の Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を明示的に設定する必要があります（完全なオリジン）。これにはリモート開発セットアップも含まれます。
    - Gateway の起動時、有効なランタイム bind とポートから `http://localhost:<port>` や `http://127.0.0.1:<port>` などのローカルオリジンがシードされる場合がありますが、リモートブラウザーのオリジンには引き続き明示的なエントリが必要です。
    - 厳密に制御されたローカルテストを除き、`gateway.controlUi.allowedOrigins: ["*"]` は使用しないでください。これは任意のブラウザーオリジンを許可するという意味であり、「現在使用しているホストに一致させる」という意味ではありません。
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

リモートアクセス設定の詳細: [リモートアクセス](/ja-JP/gateway/remote)。

## 関連

- [ダッシュボード](/ja-JP/web/dashboard) — Gateway ダッシュボード
- [ヘルスチェック](/ja-JP/gateway/health) — Gateway ヘルス監視
- [TUI](/ja-JP/web/tui) — ターミナルユーザーインターフェイス
- [WebChat](/ja-JP/web/webchat) — ブラウザーベースのチャットインターフェイス
