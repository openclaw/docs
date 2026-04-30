---
read_when:
    - ブラウザから Gateway を操作したい
    - SSH トンネルなしで Tailnet アクセスを利用したい場合
sidebarTitle: Control UI
summary: Gateway 用のブラウザベースの制御 UI（チャット、ノード、設定）
title: コントロール UI
x-i18n:
    generated_at: "2026-04-30T05:41:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 982d25d48770b753faa4e57d9a284e9bff10c15cda21dd9c00848d2a6b912d41
    source_path: web/control-ui.md
    workflow: 16
---

コントロール UI は、Gateway によって配信される小さな **Vite + Lit** シングルページアプリです。

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します（例: `/openclaw`）

同じポート上の **Gateway WebSocket** と直接通信します。

## クイックオープン（ローカル）

Gateway が同じコンピューターで実行されている場合は、次を開きます。

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）

ページの読み込みに失敗する場合は、先に Gateway を起動します: `openclaw gateway`。

認証は WebSocket ハンドシェイク中に次で提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合は Tailscale Serve の ID ヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合は trusted-proxy の ID ヘッダー

ダッシュボード設定パネルは、現在のブラウザータブセッションと選択された gateway URL 用のトークンを保持します。パスワードは永続化されません。オンボーディングでは通常、初回接続時に共有シークレット認証用の gateway トークンが生成されますが、`gateway.auth.mode` が `"password"` の場合はパスワード認証も機能します。

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

ブラウザーがすでにペアリング済みで、読み取りアクセスから書き込み/管理者アクセスへ変更した場合、これはサイレント再接続ではなく承認アップグレードとして扱われます。OpenClaw は古い承認を有効なまま保持し、より広い再接続をブロックして、新しいスコープセットを明示的に承認するよう求めます。

承認されると、そのデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り再承認は不要です。トークンローテーションと取り消しについては [デバイス CLI](/ja-JP/cli/devices) を参照してください。

<Note>
- 直接の local loopback ブラウザー接続（`127.0.0.1` / `localhost`）は自動承認されます。
- `gateway.auth.allowTailscale: true` で、Tailscale ID が検証され、ブラウザーがそのデバイス ID を提示する場合、Tailscale Serve はコントロール UI オペレーターセッションのペアリング往復を省略できます。
- 直接の Tailnet バインド、LAN ブラウザー接続、デバイス ID のないブラウザープロファイルでは、引き続き明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイス ID を生成するため、ブラウザーを切り替えたりブラウザーデータを消去したりすると、再ペアリングが必要になります。

</Note>

## 個人 ID（ブラウザーローカル）

コントロール UI は、共有セッションでの帰属表示のため、送信メッセージに付加されるブラウザーごとの個人 ID（表示名とアバター）をサポートします。これはブラウザーストレージに保存され、現在のブラウザープロファイルにスコープされます。他のデバイスへ同期されず、実際に送信したメッセージの通常のトランスクリプト作成者メタデータを超えてサーバー側に永続化されることもありません。サイトデータを消去したりブラウザーを切り替えたりすると、空にリセットされます。

同じブラウザーローカルのパターンは、アシスタントアバターのオーバーライドにも適用されます。アップロードされたアシスタントアバターは、ローカルブラウザー上でのみ gateway によって解決された ID に重ねられ、`config.patch` を通じて往復することはありません。共有の `ui.assistant.avatar` config フィールドは、スクリプト化された gateways やカスタムダッシュボードなど、そのフィールドを直接書き込む非 UI クライアント向けに引き続き利用できます。

## ランタイム config エンドポイント

コントロール UI は、ランタイム設定を `/__openclaw/control-ui-config.json` から取得します。このエンドポイントは、HTTP サーフェスの他の部分と同じ gateway 認証で保護されています。未認証のブラウザーは取得できず、取得に成功するには、すでに有効な gateway トークン/パスワード、Tailscale Serve ID、または trusted-proxy ID のいずれかが必要です。

## 言語サポート

コントロール UI は、初回読み込み時にブラウザーロケールに基づいて自身をローカライズできます。後で上書きするには、**概要 -> Gateway アクセス -> 言語**を開きます。ロケールピッカーは外観ではなく Gateway アクセスカード内にあります。

- サポートされるロケール: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 英語以外の翻訳はブラウザー内で遅延読み込みされます。
- 選択したロケールはブラウザーストレージに保存され、今後の訪問時に再利用されます。
- 不足している翻訳キーは英語にフォールバックします。

ドキュメント翻訳は同じ非英語ロケールセット向けに生成されますが、ドキュメントサイトに組み込まれている Mintlify 言語ピッカーは、Mintlify が受け付けるロケールコードに制限されています。タイ語（`th`）とペルシア語（`fa`）のドキュメントは引き続き publish repo に生成されますが、Mintlify がそれらのコードをサポートするまで、そのピッカーには表示されない場合があります。

## 外観テーマ

外観パネルには、組み込みの Claw、Knot、Dash テーマに加えて、ブラウザーローカルの tweakcn インポートスロットが 1 つあります。テーマをインポートするには、[tweakcn themes](https://tweakcn.com/themes) を開き、テーマを選択または作成し、**共有**をクリックして、コピーしたテーマリンクを外観に貼り付けます。インポーターは `https://tweakcn.com/r/themes/<id>` のレジストリ URL、`https://tweakcn.com/editor/theme?theme=amethyst-haze` のようなエディター URL、相対 `/themes/<id>` パス、生のテーマ ID、`amethyst-haze` などのデフォルトテーマ名も受け付けます。

インポートされたテーマは、現在のブラウザープロファイルにのみ保存されます。gateway config には書き込まれず、デバイス間で同期されません。インポート済みテーマを置き換えると、その 1 つのローカルスロットが更新されます。クリアすると、インポート済みテーマが選択されていた場合、アクティブなテーマは Claw に戻ります。

## できること（現在）

<AccordionGroup>
  <Accordion title="チャットと音声会話">
    - Gateway WS（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）経由でモデルとチャットします。
    - ブラウザーのリアルタイムセッションを通じて音声会話します。OpenAI は直接 WebRTC を使用し、Google Live は WebSocket 経由の制限付き 1 回使用ブラウザートークンを使用し、バックエンド専用のリアルタイム音声 plugins は Gateway リレー transport を使用します。リレーは provider 認証情報を Gateway 上に保持し、ブラウザーは `talk.realtime.relay*` RPC を通じてマイク PCM をストリーミングし、より大きな設定済み OpenClaw モデル向けに `openclaw_agent_consult` ツール呼び出しを `chat.send` 経由で送り返します。
    - チャット内でツール呼び出しとライブツール出力カードをストリーミングします（agent events）。

  </Accordion>
  <Accordion title="チャンネル、インスタンス、セッション、dreams">
    - チャンネル: 組み込みおよびバンドル/外部 plugin チャンネルのステータス、QR ログイン、チャンネルごとの config（`channels.status`, `web.login.*`, `config.patch`）。
    - インスタンス: プレゼンス一覧と更新（`system-presence`）。
    - セッション: 一覧とセッションごとの model/thinking/fast/verbose/trace/reasoning オーバーライド（`sessions.list`, `sessions.patch`）。
    - Dreams: dreaming ステータス、有効/無効トグル、Dream Diary リーダー（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）。

  </Accordion>
  <Accordion title="Cron、skills、nodes、exec 承認">
    - Cron ジョブ: 一覧/追加/編集/実行/有効化/無効化と実行履歴（`cron.*`）。
    - Skills: ステータス、有効化/無効化、インストール、API キー更新（`skills.*`）。
    - Nodes: 一覧と caps（`node.list`）。
    - Exec 承認: `exec host=gateway/node` の gateway または node allowlists と ask ポリシーを編集（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="Config">
    - `~/.openclaw/openclaw.json` を表示/編集します（`config.get`, `config.set`）。
    - 検証付きで適用して再起動し（`config.apply`）、最後のアクティブセッションを起こします。
    - 書き込みには、同時編集による上書きを防ぐ base-hash ガードが含まれます。
    - 書き込み（`config.set`/`config.apply`/`config.patch`）では、送信された config ペイロード内の refs について、アクティブな SecretRef 解決を事前確認します。解決できないアクティブな送信 refs は書き込み前に拒否されます。
    - スキーマとフォームレンダリング（`config.schema` / `config.schema.lookup`。フィールド `title` / `description`、一致した UI ヒント、直下の子サマリー、ネストされた object/wildcard/array/composition nodes の docs メタデータ、利用可能な場合は plugin とチャンネルのスキーマを含む）。Raw JSON エディターは、スナップショットが安全に raw 往復できる場合にのみ利用できます。
    - スナップショットが raw テキストを安全に往復できない場合、コントロール UI はそのスナップショットについて Form モードを強制し、Raw モードを無効にします。
    - Raw JSON エディターの「保存済みにリセット」は、フラット化されたスナップショットを再レンダリングするのではなく、raw で作成された形状（書式、コメント、`$include` レイアウト）を保持するため、スナップショットが安全に往復できる場合は外部編集がリセット後も残ります。
    - 構造化された SecretRef object 値は、誤って object から string へ破損することを防ぐため、フォームのテキスト入力では読み取り専用でレンダリングされます。

  </Accordion>
  <Accordion title="デバッグ、ログ、更新">
    - デバッグ: status/health/models スナップショット、イベントログ、手動 RPC 呼び出し（`status`, `health`, `models.list`）。
    - ログ: gateway ファイルログのライブ tail とフィルター/エクスポート（`logs.tail`）。
    - 更新: package/git 更新と再起動（`update.run`）を再起動レポート付きで実行し、再接続後に `update.status` をポーリングして実行中の gateway バージョンを検証します。

  </Accordion>
  <Accordion title="Cron ジョブパネルのメモ">
    - 分離ジョブでは、配信のデフォルトはサマリー通知です。内部のみの実行にしたい場合は none に切り替えられます。
    - announce が選択されている場合、チャンネル/ターゲットフィールドが表示されます。
    - Webhook モードは、`delivery.to` に有効な HTTP(S) webhook URL を設定し、`delivery.mode = "webhook"` を使用します。
    - メインセッションジョブでは、webhook と none の配信モードが利用できます。
    - 高度な編集コントロールには、実行後削除、agent オーバーライドのクリア、cron exact/stagger オプション、agent model/thinking オーバーライド、best-effort 配信トグルが含まれます。
    - フォーム検証はフィールドレベルのエラーとしてインライン表示されます。無効な値がある場合、修正されるまで保存ボタンは無効になります。
    - 専用の bearer token を送信するには `cron.webhookToken` を設定します。省略した場合、webhook は auth ヘッダーなしで送信されます。
    - 非推奨のフォールバック: `notify: true` を持つ保存済み legacy ジョブは、移行されるまで引き続き `cron.webhook` を使用できます。

  </Accordion>
</AccordionGroup>

## チャットの動作

<AccordionGroup>
  <Accordion title="送信と履歴のセマンティクス">
    - `chat.send` は**非ブロッキング**です。`{ runId, status: "started" }` ですぐに ACK を返し、レスポンスは `chat` イベント経由でストリーミングされます。
    - チャットのアップロードは、画像と動画以外のファイルを受け入れます。画像はネイティブの画像パスを保持し、その他のファイルは管理対象メディアとして保存され、履歴では添付リンクとして表示されます。
    - 同じ `idempotencyKey` で再送信すると、実行中は `{ status: "in_flight" }` を返し、完了後は `{ status: "ok" }` を返します。
    - `chat.history` のレスポンスは、UI の安全性のためサイズ制限があります。トランスクリプトのエントリが大きすぎる場合、Gateway は長いテキストフィールドを切り詰めたり、重いメタデータブロックを省略したり、サイズ超過のメッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えたりすることがあります。
    - アシスタント生成画像は管理対象メディア参照として永続化され、認証済み Gateway メディア URL 経由で返されるため、再読み込みは生の base64 画像ペイロードがチャット履歴レスポンスに残っていることに依存しません。
    - `chat.history` は、表示専用のインラインディレクティブタグ（例: `[[reply_to_*]]` と `[[audio_as_voice]]`）、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、漏えいした ASCII/全角のモデル制御トークンも、表示されるアシスタントテキストから除去し、表示テキスト全体が正確なサイレントトークン `NO_REPLY` / `no_reply` だけであるアシスタントエントリを省略します。
    - アクティブな送信中と最終履歴更新中に `chat.history` が一時的に古いスナップショットを返しても、チャットビューはローカルの楽観的なユーザー/アシスタントメッセージを表示し続けます。Gateway 履歴が追いつくと、正規のトランスクリプトがそれらのローカルメッセージを置き換えます。
    - `chat.inject` はアシスタントのメモをセッショントランスクリプトに追加し、UI 専用更新のために `chat` イベントをブロードキャストします（エージェント実行なし、チャンネル配信なし）。
    - チャットヘッダーのモデルと思考ピッカーは、`sessions.patch` 経由でアクティブセッションを即時にパッチします。これらは永続的なセッションオーバーライドであり、1 ターン限定の送信オプションではありません。
    - チャットのモデルピッカーは、Gateway に設定されたモデルビューを要求します。`agents.defaults.models` が存在する場合、その許可リストがピッカーを制御します。それ以外の場合、ピッカーは明示的な `models.providers.*.models` エントリと、利用可能な認証を持つプロバイダーを表示します。完全なカタログは、デバッグ用の `models.list` RPC で `view: "all"` を指定すると引き続き利用できます。
    - 新しい Gateway セッション使用状況レポートが高いコンテキスト圧迫を示す場合、チャットコンポーザー領域にコンテキスト通知が表示され、推奨される Compaction レベルでは通常のセッション Compaction パスを実行するコンパクトボタンが表示されます。古いトークンスナップショットは、Gateway が再び新しい使用状況を報告するまで非表示になります。

  </Accordion>
  <Accordion title="トークモード（ブラウザーリアルタイム）">
    トークモードは、登録済みのリアルタイム音声プロバイダーを使用します。OpenAI を `talk.provider: "openai"` と `talk.providers.openai.apiKey` で設定するか、Google を `talk.provider: "google"` と `talk.providers.google.apiKey` で設定します。Voice Call のリアルタイムプロバイダー設定は、引き続きフォールバックとして再利用できます。ブラウザーが標準のプロバイダー API キーを受け取ることはありません。OpenAI は WebRTC 用の一時的な Realtime クライアントシークレットを受け取ります。Google Live は、ブラウザー WebSocket セッション用の 1 回限りの制約付き Live API 認証トークンを受け取り、そのトークンには Gateway によって指示とツール宣言がロックされます。バックエンドのリアルタイムブリッジしか公開していないプロバイダーは Gateway リレートランスポート経由で実行されるため、認証情報とベンダーソケットはサーバー側に残り、ブラウザー音声は認証済み Gateway RPC 経由で移動します。Realtime セッションプロンプトは Gateway によって組み立てられます。`talk.realtime.session` は呼び出し元が提供する指示オーバーライドを受け付けません。

    チャットコンポーザーでは、トークコントロールはマイクディクテーションボタンの横にある波形ボタンです。トークが開始されると、コンポーザーのステータス行にはまず `Connecting Talk...` が表示され、その後、音声が接続されている間は `Talk live`、リアルタイムツール呼び出しが `chat.send` 経由で設定済みの大きいモデルに問い合わせている間は `Asking OpenClaw...` が表示されます。

    メンテナー向けライブスモーク: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` は、OpenAI ブラウザー WebRTC SDP 交換、Google Live 制約付きトークンのブラウザー WebSocket セットアップ、および偽のマイクメディアを使った Gateway リレーブラウザーアダプターを検証します。このコマンドはプロバイダーのステータスのみを出力し、シークレットはログに記録しません。

  </Accordion>
  <Accordion title="停止と中止">
    - **Stop** をクリックします（`chat.abort` を呼び出します）。
    - 実行がアクティブな間、通常のフォローアップはキューに入ります。キュー内のメッセージで **Steer** をクリックすると、そのフォローアップを実行中のターンに注入します。
    - `/stop`（または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` のような単独の中止フレーズ）を入力すると、帯域外で中止します。
    - `chat.abort` は、そのセッションのすべてのアクティブな実行を中止するために `{ sessionKey }`（`runId` なし）をサポートします。

  </Accordion>
  <Accordion title="中止時の部分出力保持">
    - 実行が中止された場合でも、部分的なアシスタントテキストは UI に表示できます。
    - Gateway は、バッファされた出力が存在する場合、中止された部分的なアシスタントテキストをトランスクリプト履歴に永続化します。
    - 永続化されたエントリには中止メタデータが含まれるため、トランスクリプトの利用側は中止時の部分出力を通常の完了出力と区別できます。

  </Accordion>
</AccordionGroup>

## PWA のインストールと Web Push

Control UI は `manifest.webmanifest` とサービスワーカーを同梱しているため、最新のブラウザーではスタンドアロン PWA としてインストールできます。Web Push により、タブやブラウザーウィンドウが開いていない場合でも、Gateway はインストール済み PWA を通知で起動できます。

| サーフェス                                            | 役割                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA マニフェスト。到達可能になると、ブラウザーが「アプリをインストール」を提示します。 |
| `ui/public/sw.js`                                     | `push` イベントと通知クリックを処理するサービスワーカー。 |
| `push/vapid-keys.json`（OpenClaw 状態ディレクトリ配下） | Web Push ペイロードへの署名に使う、自動生成された VAPID キーペア。 |
| `push/web-push-subscriptions.json`                    | 永続化されたブラウザー購読エンドポイント。                          |

キーを固定したい場合（マルチホストデプロイ、シークレットローテーション、テストなど）は、Gateway プロセスの env vars で VAPID キーペアをオーバーライドします。

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（デフォルトは `mailto:openclaw@localhost`）

Control UI は、ブラウザー購読を登録およびテストするために、これらのスコープ制限付き Gateway メソッドを使用します。

- `push.web.vapidPublicKey` — アクティブな VAPID 公開キーを取得します。
- `push.web.subscribe` — `endpoint` と `keys.p256dh`/`keys.auth` を登録します。
- `push.web.unsubscribe` — 登録済みエンドポイントを削除します。
- `push.web.test` — 呼び出し元の購読にテスト通知を送信します。

<Note>
Web Push は、iOS APNS リレーパス（リレー支援のプッシュについては [Configuration](/ja-JP/gateway/configuration) を参照）および既存の `push.test` メソッドとは独立しています。これらはネイティブモバイルペアリングを対象とします。
</Note>

## ホストされた埋め込み

アシスタントメッセージは、`[embed ...]` ショートコードを使ってホストされた Web コンテンツをインラインでレンダリングできます。iframe サンドボックスポリシーは `gateway.controlUi.embedSandbox` によって制御されます。

<Tabs>
  <Tab title="strict">
    ホストされた埋め込み内でのスクリプト実行を無効にします。
  </Tab>
  <Tab title="scripts（デフォルト）">
    オリジン分離を維持しながら、インタラクティブな埋め込みを許可します。これはデフォルトであり、通常は自己完結型のブラウザーゲーム/ウィジェットには十分です。
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
埋め込みドキュメントが同一オリジンの挙動を本当に必要とする場合にのみ、`trusted` を使用してください。ほとんどのエージェント生成ゲームとインタラクティブキャンバスでは、`scripts` のほうが安全な選択です。
</Warning>

絶対外部 `http(s)` 埋め込み URL は、デフォルトでは引き続きブロックされます。`[embed url="https://..."]` でサードパーティページを読み込みたいことが意図的である場合は、`gateway.controlUi.allowExternalEmbedUrls: true` を設定します。

## tailnet アクセス（推奨）

<Tabs>
  <Tab title="統合 Tailscale Serve（推奨）">
    Gateway を loopback に置いたまま、Tailscale Serve に HTTPS でプロキシさせます。

    ```bash
    openclaw gateway --tailscale serve
    ```

    開く:

    - `https://<magicdns>/`（または設定済みの `gateway.controlUi.basePath`）

    デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket Serve リクエストは Tailscale ID ヘッダー（`tailscale-user-login`）経由で認証できます。OpenClaw は、`x-forwarded-for` アドレスを `tailscale whois` で解決してヘッダーと照合することで ID を検証し、リクエストが Tailscale の `x-forwarded-*` ヘッダー付きで loopback に到達した場合にのみ受け入れます。ブラウザーデバイス ID を持つ Control UI オペレーターセッションでは、この検証済み Serve パスはデバイスペアリングの往復もスキップします。デバイスなしのブラウザーとノードロール接続は、引き続き通常のデバイスチェックに従います。Serve トラフィックでも明示的な共有シークレット認証情報を要求したい場合は、`gateway.auth.allowTailscale: false` を設定します。そのうえで `gateway.auth.mode: "token"` または `"password"` を使用します。

    その非同期 Serve ID パスでは、同じクライアント IP と認証スコープに対する失敗した認証試行は、レート制限の書き込み前に直列化されます。そのため、同じブラウザーからの同時の不正な再試行では、2 つの単純な不一致が並行して競合する代わりに、2 番目のリクエストで `retry later` が表示されることがあります。

    <Warning>
    トークンなしの Serve 認証は、Gateway ホストが信頼できることを前提にしています。そのホスト上で信頼できないローカルコードが実行される可能性がある場合は、トークン/パスワード認証を必須にしてください。
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

## セキュアでない HTTP

プレーン HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、ブラウザーは**非セキュアコンテキスト**で実行され、WebCrypto をブロックします。デフォルトでは、OpenClaw はデバイス ID のない Control UI 接続を**ブロック**します。

文書化された例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost 限定のセキュアでない HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` によるオペレーター Control UI 認証の成功
- 緊急避難用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS（Tailscale Serve）を使用するか、UI をローカルで開きます。

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（Gateway ホスト上）

<AccordionGroup>
  <Accordion title="セキュアでない認証トグルの挙動">
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

    - 非セキュア HTTP コンテキストで、localhost Control UI セッションがデバイス ID なしで続行できるようにします。
    - ペアリングチェックはバイパスしません。
    - リモート（localhost 以外）のデバイス ID 要件を緩和しません。

  </Accordion>
  <Accordion title="緊急避難専用">
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
    `dangerouslyDisableDeviceAuth` は Control UI のデバイス ID チェックを無効にし、深刻なセキュリティ低下を招きます。緊急使用後はすみやかに元に戻してください。
    </Warning>

  </Accordion>
  <Accordion title="信頼済みプロキシに関する注記">
    - 信頼済みプロキシ認証に成功すると、デバイス ID なしで **operator** Control UI セッションを許可できます。
    - これは node-role Control UI セッションには拡張されません。
    - 同一ホストの loopback リバースプロキシでも、信頼済みプロキシ認証は満たしません。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照してください。

  </Accordion>
</AccordionGroup>

HTTPS セットアップのガイダンスについては [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## コンテンツセキュリティポリシー

Control UI には厳格な `img-src` ポリシーが同梱されています。許可されるのは、**同一オリジン**のアセット、`data:` URL、ローカルで生成された `blob:` URL のみです。リモートの `http(s)` およびプロトコル相対の画像 URL はブラウザによって拒否され、ネットワークフェッチは発行されません。

実際には、これは次のことを意味します。

- 相対パス（たとえば `/avatars/<id>`）で提供されるアバターと画像は引き続きレンダリングされます。UI が取得してローカルの `blob:` URL に変換する、認証付きアバタールートも含まれます。
- インラインの `data:image/...` URL は引き続きレンダリングされます（プロトコル内ペイロードに便利です）。
- Control UI によって作成されたローカルの `blob:` URL は引き続きレンダリングされます。
- チャネルメタデータから出力されたリモートアバター URL は、Control UI のアバターヘルパーで除去され、組み込みのロゴ/バッジに置き換えられます。そのため、侵害された、または悪意あるチャネルが operator のブラウザから任意のリモート画像フェッチを強制することはできません。

この動作を得るために何かを変更する必要はありません。常に有効で、設定変更はできません。

## アバタールート認証

Gateway 認証が設定されている場合、Control UI のアバターエンドポイントでは API の他の部分と同じ Gateway トークンが必要です。

- `GET /avatar/<agentId>` は、認証済みの呼び出し元にのみアバター画像を返します。`GET /avatar/<agentId>?meta=1` は、同じルールの下でアバターメタデータを返します。
- どちらのルートへの未認証リクエストも拒否されます（隣接する assistant-media ルートと同様）。これにより、それ以外は保護されているホストでアバタールートがエージェント ID を漏らすことを防ぎます。
- Control UI 自体は、アバター取得時に Gateway トークンを bearer ヘッダーとして転送し、認証済みの blob URL を使用するため、ダッシュボード内で画像は引き続きレンダリングされます。

Gateway 認証を無効にした場合（共有ホストでは推奨されません）、アバタールートも Gateway の他の部分と同様に未認証になります。

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

Control UI は静的ファイルです。WebSocket ターゲットは設定可能で、HTTP オリジンとは別にできます。ローカルでは Vite 開発サーバーを使い、Gateway は別の場所で動かしたい場合に便利です。

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
  <Accordion title="注記">
    - `gatewayUrl` は読み込み後に localStorage に保存され、URL から削除されます。
    - `gatewayUrl` 経由で完全な `ws://` または `wss://` エンドポイントを渡す場合は、ブラウザがクエリ文字列を正しく解析できるように `gatewayUrl` の値を URL エンコードしてください。
    - 可能な限り、`token` は URL フラグメント（`#token=...`）経由で渡してください。フラグメントはサーバーに送信されないため、リクエストログや Referer への漏えいを避けられます。従来の `?token=` クエリパラメーターも互換性のため一度だけ取り込まれますが、フォールバックとしてのみ使われ、bootstrap 直後に削除されます。
    - `password` はメモリ内にのみ保持されます。
    - `gatewayUrl` が設定されている場合、UI は config や環境の認証情報にフォールバックしません。`token`（または `password`）を明示的に指定してください。明示的な認証情報がない場合はエラーです。
    - Gateway が TLS（Tailscale Serve、HTTPS プロキシなど）の背後にある場合は `wss://` を使用してください。
    - `gatewayUrl` はクリックジャッキングを防ぐため、トップレベルウィンドウ（埋め込みではない）でのみ受け付けられます。
    - 非 loopback の Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を明示的に設定する必要があります（完全なオリジン）。これにはリモート開発セットアップも含まれます。
    - Gateway の起動時に、有効なランタイム bind と port から `http://localhost:<port>` や `http://127.0.0.1:<port>` などのローカルオリジンがシードされる場合がありますが、リモートブラウザのオリジンには引き続き明示的なエントリが必要です。
    - 厳密に管理されたローカルテストを除き、`gateway.controlUi.allowedOrigins: ["*"]` は使用しないでください。これは任意のブラウザオリジンを許可するという意味であり、「現在使用しているホストに一致させる」という意味ではありません。
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
