---
read_when:
    - ブラウザから Gateway を操作したい場合
    - SSH トンネルなしで tailnet アクセスを使いたい場合
summary: Gateway 用のブラウザベース Control UI（チャット、Node、設定）
title: Control UI
x-i18n:
    generated_at: "2026-04-25T18:22:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29d77ae57e32abe5ad25b2c22986d9d8e67f7ac183af06e8ffc4907ae4e6c0bc
    source_path: web/control-ui.md
    workflow: 15
---

Control UI は、Gateway から配信される小さな **Vite + Lit** のシングルページアプリです:

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定（例: `/openclaw`）

同じポート上の **Gateway WebSocket に直接**接続します。

## クイックオープン（ローカル）

Gateway が同じコンピューター上で動作している場合は、次を開いてください:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）

ページが読み込めない場合は、まず Gateway を起動してください: `openclaw gateway`。

認証は、WebSocket ハンドシェイク中に次を介して提供されます:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` のときの Tailscale Serve ID ヘッダー
- `gateway.auth.mode: "trusted-proxy"` のときの trusted-proxy ID ヘッダー

ダッシュボードの設定パネルは、現在のブラウザータブセッションと
選択した Gateway URL に対する token を保持しますが、password は永続化しません。オンボーディングでは通常、
初回接続時に共有シークレット認証用の Gateway token を生成しますが、`gateway.auth.mode` が `"password"` の場合は
password 認証も利用できます。

## デバイスペアリング（初回接続）

新しいブラウザーまたはデバイスから Control UI に接続すると、Gateway は
**一度限りのペアリング承認**を要求します。`gateway.auth.allowTailscale: true` で同じ Tailnet 上にいても同様です。
これは、不正アクセスを防ぐためのセキュリティ対策です。

**表示される内容:** 「disconnected (1008): pairing required」

**デバイスを承認するには:**

```bash
# 保留中のリクエストを一覧表示
openclaw devices list

# リクエスト ID で承認
openclaw devices approve <requestId>
```

ブラウザーが変更された認証詳細（role/scopes/public
key）でペアリングを再試行すると、以前の保留中リクエストは置き換えられ、新しい `requestId` が
作成されます。承認前に `openclaw devices list` を再実行してください。

ブラウザーがすでにペアリング済みで、それを読み取りアクセスから
書き込み/admin アクセスへ変更した場合、これは無言の再接続ではなく承認アップグレードとして扱われます。
OpenClaw は古い承認を有効なまま維持し、より広い権限での再接続をブロックし、
新しいスコープセットを明示的に承認するよう求めます。

一度承認されると、そのデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で
取り消さない限り再承認は不要です。token のローテーションと取り消しについては
[Devices CLI](/ja-JP/cli/devices) を参照してください。

**メモ:**

- 直接のローカル local loopback ブラウザー接続（`127.0.0.1` / `localhost`）は
  自動承認されます。
- Tailnet および LAN のブラウザー接続は、同じマシンからの接続であっても
  引き続き明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイス ID を生成するため、ブラウザーを切り替えたり
  ブラウザーデータを消去したりすると再ペアリングが必要になります。

## 個人 ID（ブラウザーローカル）

Control UI は、共有セッションで送信メッセージの帰属表示に使われる、
ブラウザーごとの個人 ID（表示名とアバター）をサポートします。これはブラウザーストレージに保存され、
現在のブラウザープロファイルにスコープされ、他のデバイスへ同期されたり、
実際に送信したメッセージ上の通常の transcript 作成者メタデータを超えてサーバー側に永続化されたりはしません。
サイトデータを消去するかブラウザーを切り替えると、空にリセットされます。

同じブラウザーローカルのパターンは、アシスタントアバター上書きにも適用されます。
アップロードされたアシスタントアバターは、ローカルブラウザー上でのみ gateway 解決済み ID に重ねて表示され、
`config.patch` を経由して往復することはありません。共有の
`ui.assistant.avatar` 設定フィールドは、引き続き非 UI クライアントがこのフィールドを直接書き込む用途
（スクリプト化された Gateway やカスタムダッシュボードなど）で利用できます。

## 実行時設定エンドポイント

Control UI は、その実行時設定を
`/__openclaw/control-ui-config.json` から取得します。このエンドポイントは
他の HTTP サーフェスと同じ Gateway 認証で保護されています。未認証のブラウザーは取得できず、
取得に成功するには、すでに有効な Gateway
token/password、Tailscale Serve ID、または trusted-proxy ID のいずれかが必要です。

## 言語サポート

Control UI は初回ロード時に、ブラウザーロケールに基づいて自身をローカライズできます。
後から上書きするには、**Overview -> Gateway Access -> Language** を開いてください。ロケール
ピッカーは Appearance ではなく Gateway Access カード内にあります。

- サポートされるロケール: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- 英語以外の翻訳はブラウザー内で lazy-load されます。
- 選択したロケールはブラウザーストレージに保存され、次回以降の訪問でも再利用されます。
- 翻訳キーが欠けている場合は英語にフォールバックします。

## 現在できること

- Gateway WS 経由でモデルとチャット（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）
- ブラウザーから WebRTC 経由で OpenAI Realtime と直接対話。Gateway は
  `talk.realtime.session` で短命の Realtime client secret を発行し、ブラウザーは
  マイク音声を OpenAI に直接送信し、
  より大きな設定済み OpenClaw モデル向けの `openclaw_agent_consult` ツール呼び出しを `chat.send` 経由で中継します
- Chat 内でのツール呼び出しストリーム + ライブツール出力カード（エージェントイベント）
- Channels: 組み込みおよびバンドル済み/外部 Plugin チャネルのステータス、QR ログイン、チャネルごとの設定（`channels.status`, `web.login.*`, `config.patch`）
- Instances: プレゼンス一覧 + 更新（`system-presence`）
- Sessions: 一覧表示 + セッションごとの model/thinking/fast/verbose/trace/reasoning 上書き（`sessions.list`, `sessions.patch`）
- Dreams: Dreaming ステータス、有効/無効トグル、および Dream Diary リーダー（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）
- Cron ジョブ: 一覧/追加/編集/実行/有効化/無効化 + 実行履歴（`cron.*`）
- Skills: ステータス、有効化/無効化、インストール、API キー更新（`skills.*`）
- Nodes: 一覧 + cap（`node.list`）
- Exec 承認: `exec host=gateway/node` 用の Gateway または Node の allowlist と ask ポリシーを編集（`exec.approvals.*`）
- 設定: `~/.openclaw/openclaw.json` を表示/編集（`config.get`, `config.set`）
- 設定: 検証付きで適用 + 再起動（`config.apply`）し、最後にアクティブだったセッションを復帰
- 設定書き込みには base-hash ガードが含まれ、同時編集の上書きを防止
- 設定書き込み（`config.set`/`config.apply`/`config.patch`）は、送信された設定ペイロード内の ref に対するアクティブな SecretRef 解決も事前検証します。未解決のアクティブ submitted ref は書き込み前に拒否されます
- 設定スキーマ + フォームレンダリング（`config.schema` / `config.schema.lookup`、
  フィールドの `title` / `description`、一致する UI ヒント、直下の子要素
  サマリー、ネストした object/wildcard/array/composition ノード上の docs メタデータ、
  および利用可能な場合は Plugin + チャネルスキーマを含む）。Raw JSON エディターは、
  スナップショットで安全な raw round-trip が可能な場合にのみ利用できます
- スナップショットが raw テキストを安全に round-trip できない場合、Control UI は Form モードを強制し、そのスナップショットでは Raw モードを無効化します
- Raw JSON エディターの「Reset to saved」は、平坦化されたスナップショットを再レンダリングするのではなく、raw 作成時の形状（フォーマット、コメント、`$include` レイアウト）を保持するため、スナップショットが安全に round-trip 可能であれば外部編集もリセット後に残ります
- 構造化された SecretRef オブジェクト値は、誤って object-to-string 破損を起こさないよう、フォームのテキスト入力では読み取り専用としてレンダリングされます
- デバッグ: status/health/models スナップショット + イベントログ + 手動 RPC 呼び出し（`status`, `health`, `models.list`）
- ログ: Gateway ファイルログのライブ tail。フィルター/エクスポート付き（`logs.tail`）
- 更新: パッケージ/git 更新 + 再起動を実行（`update.run`）。再起動レポート付き

Cron ジョブパネルのメモ:

- 分離ジョブでは、配信のデフォルトはサマリー通知です。内部専用の実行にしたい場合は none に切り替えられます。
- announce が選択されている場合、channel/target フィールドが表示されます。
- Webhook モードでは `delivery.mode = "webhook"` を使用し、`delivery.to` には有効な HTTP(S) Webhook URL を設定します。
- main-session ジョブでは、webhook と none の配信モードが利用できます。
- 高度な編集コントロールには、実行後削除、agent 上書きのクリア、Cron の exact/stagger オプション、
  agent の model/thinking 上書き、および best-effort 配信トグルが含まれます。
- フォーム検証はフィールドレベルのエラー付きでインライン表示されます。無効な値がある場合、修正されるまで保存ボタンは無効になります。
- 専用 bearer token を送るには `cron.webhookToken` を設定してください。省略した場合、Webhook は認証ヘッダーなしで送信されます。
- 非推奨のフォールバック: `notify: true` を持つ保存済みレガシージョブは、移行されるまで `cron.webhook` を引き続き利用できます。

## チャットの動作

- `chat.send` は**ノンブロッキング**です。即座に `{ runId, status: "started" }` で ack し、応答は `chat` イベント経由でストリームされます。
- 同じ `idempotencyKey` で再送すると、実行中は `{ status: "in_flight" }` が返り、完了後は `{ status: "ok" }` が返ります。
- `chat.history` の応答は、UI の安全性のためサイズ制限があります。transcript エントリが大きすぎる場合、Gateway は長いテキストフィールドを切り詰めたり、重いメタデータブロックを省略したり、サイズ超過メッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えたりすることがあります。
- アシスタント/生成画像は managed media 参照として永続化され、認証付き Gateway media URL を通して返されるため、再読み込み時に chat history 応答内へ生の base64 画像ペイロードが残っている必要はありません。
- `chat.history` は、表示専用のインライン directive タグ（例: `[[reply_to_*]]` や `[[audio_as_voice]]`）、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、漏出した ASCII/全角のモデル制御トークンも assistant の可視テキストから除去し、可視テキスト全体が完全にサイレントトークン `NO_REPLY` / `no_reply` のみである assistant エントリは省略します。
- アクティブな送信中および最終的な履歴更新中は、`chat.history` が一時的に
  古いスナップショットを返しても、チャットビューはローカルの
  optimistic な user/assistant メッセージを表示したままにします。Gateway の履歴が追いつくと、
  正式な transcript がそれらのローカルメッセージを置き換えます。
- `chat.inject` は assistant note をセッション transcript に追記し、UI 専用更新のために `chat` イベントをブロードキャストします（agent run なし、channel 配信なし）。
- チャットヘッダーの model および thinking ピッカーは、`sessions.patch` を通じてアクティブセッションを即時更新します。これらは 1 ターン限定の送信オプションではなく、永続的なセッション上書きです。
- 新しい Gateway セッション使用量レポートでコンテキスト圧が高いことが示されると、チャット
  composer 領域にコンテキスト通知が表示され、推奨される Compaction レベルでは、
  通常のセッション Compaction パスを実行する compact ボタンも表示されます。古いトークン
  スナップショットは、Gateway が再び新しい使用量を報告するまで非表示になります。
- Talk mode は、ブラウザー WebRTC セッションをサポートする登録済み realtime voice provider を使います。`talk.provider: "openai"` に加えて
  `talk.providers.openai.apiKey` を設定するか、
  Voice Call の realtime provider 設定を再利用してください。ブラウザーが標準の OpenAI API key を受け取ることはなく、
  受け取るのは短命の Realtime client secret のみです。Google Live realtime voice は
  バックエンドの Voice Call と Google Meet ブリッジではサポートされますが、このブラウザー
  WebRTC パスではまだサポートされていません。Realtime セッションプロンプトは Gateway によって組み立てられます。
  `talk.realtime.session` は呼び出し元提供の instruction 上書きを受け付けません。
- Chat composer では、Talk コントロールは
  マイク音声入力ボタンの横にある波形ボタンです。Talk が開始されると、composer のステータス行に
  `Connecting Talk...` が表示され、その後音声接続中は `Talk live`、
  realtime ツール呼び出しが `chat.send` 経由で設定済みの
  より大きなモデルに問い合わせている間は `Asking OpenClaw...` が表示されます。
- 停止:
  - **Stop** をクリック（`chat.abort` を呼び出します）
  - run がアクティブな間、通常のフォローアップはキューに入ります。キューされたメッセージの **Steer** をクリックすると、そのフォローアップを実行中のターンへ注入します。
  - `/stop` を入力（または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` のような単独の中断フレーズ）すると、帯域外で中断します
  - `chat.abort` は `{ sessionKey }`（`runId` なし）をサポートし、そのセッションのすべてのアクティブ run を中断します
- 中断時の部分保持:
  - run が中断されても、部分的な assistant テキストは引き続き UI に表示されることがあります
  - バッファ済み出力が存在する場合、Gateway は中断された部分 assistant テキストを transcript 履歴へ永続化します
  - 永続化されたエントリには中断メタデータが含まれるため、transcript 利用側は中断由来の部分出力と通常完了出力を区別できます

## PWA インストールと Web Push

Control UI には `manifest.webmanifest` と service worker が含まれているため、
最新ブラウザーではスタンドアロン PWA としてインストールできます。Web Push により、
Gateway はタブや
ブラウザーウィンドウが開いていないときでも、通知でインストール済み PWA を起こせます。

| サーフェス                                            | 役割                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest。到達可能になると、ブラウザーは「アプリをインストール」を提示します。   |
| `ui/public/sw.js`                                     | `push` イベントと通知クリックを処理する service worker。 |
| `push/vapid-keys.json`（OpenClaw state dir 配下） | Web Push ペイロード署名に使われる自動生成 VAPID キーペア。       |
| `push/web-push-subscriptions.json`                    | 永続化されたブラウザー subscription endpoint。                          |

キーを固定したい場合（複数ホスト構成、シークレットローテーション、または
テストのため）は、Gateway プロセス上の env vars で VAPID キーペアを上書きできます:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（デフォルトは `mailto:openclaw@localhost`）

Control UI は、ブラウザー subscription の登録と
テストのために、スコープ制御された次の Gateway メソッドを使います:

- `push.web.vapidPublicKey` — アクティブな VAPID 公開鍵を取得します。
- `push.web.subscribe` — `endpoint` と `keys.p256dh`/`keys.auth` を登録します。
- `push.web.unsubscribe` — 登録済み endpoint を削除します。
- `push.web.test` — 呼び出し元の subscription にテスト通知を送信します。

Web Push は iOS APNS relay パスとは独立しています
（relay バックの push については [Configuration](/ja-JP/gateway/configuration) を参照）および
既存の `push.test` メソッドとも独立しています。これらはネイティブモバイルのペアリングを対象にします。

## ホスト埋め込み

assistant メッセージは `[embed ...]`
shortcode を使ってホストされた Web コンテンツをインライン表示できます。iframe sandbox ポリシーは
`gateway.controlUi.embedSandbox` で制御されます:

- `strict`: ホスト埋め込み内でのスクリプト実行を無効化します
- `scripts`: origin 分離を維持したままインタラクティブ埋め込みを許可します。これが
  デフォルトであり、自己完結型のブラウザーゲーム/ウィジェットには通常これで十分です
- `trusted`: `allow-scripts` に加えて `allow-same-origin` を付与します。同一サイトの
  ドキュメントで、意図的により強い権限が必要な場合向けです

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

埋め込みドキュメントが本当に same-origin
動作を必要とする場合にのみ `trusted` を使ってください。多くの agent 生成ゲームやインタラクティブ canvas では、`scripts` のほうが
安全です。

絶対外部 `http(s)` 埋め込み URL は、デフォルトでは引き続きブロックされます。意図的に
`[embed url="https://..."]` でサードパーティページを読み込みたい場合は、
`gateway.controlUi.allowExternalEmbedUrls: true` を設定してください。

## Tailnet アクセス（推奨）

### 統合 Tailscale Serve（推奨）

Gateway は loopback のままにし、Tailscale Serve に HTTPS でプロキシさせます:

```bash
openclaw gateway --tailscale serve
```

開く URL:

- `https://<magicdns>/`（または設定した `gateway.controlUi.basePath`）

デフォルトでは、`gateway.auth.allowTailscale` が `true` のとき、Control UI/WebSocket Serve リクエストは Tailscale ID ヘッダー
（`tailscale-user-login`）で認証できます。OpenClaw
は `x-forwarded-for` アドレスを
`tailscale whois` で解決してヘッダーと照合することで ID を検証し、
リクエストが Tailscale の `x-forwarded-*` ヘッダー付きで loopback に到達した場合にのみこれを受け入れます。
Serve トラフィックでも明示的な共有シークレット
認証を必須にしたい場合は、`gateway.auth.allowTailscale: false` を設定してください。その場合は `gateway.auth.mode: "token"` または
`"password"` を使用します。
この非同期 Serve ID パスでは、同じクライアント IP
および auth scope に対する失敗した認証試行は、レート制限書き込みの前に直列化されます。
そのため、同じブラウザーからの不正な並行再試行では、2 つの通常の不一致が並列に競合する代わりに、
2 回目のリクエストで `retry later` が表示されることがあります。
token なしの Serve 認証は、Gateway ホストが信頼されていることを前提とします。そのホスト上で信頼できないローカルコードが実行される可能性がある場合は、token/password 認証を必須にしてください。

### tailnet へ bind + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

その後、次を開いてください:

- `http://<tailscale-ip>:18789/`（または設定した `gateway.controlUi.basePath`）

一致する共有シークレットを UI 設定へ貼り付けます（
`connect.params.auth.token` または `connect.params.auth.password` として送信されます）。

## 非セキュア HTTP

プレーン HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、
ブラウザーは**非セキュアコンテキスト**で実行され、WebCrypto がブロックされます。デフォルトでは、
OpenClaw はデバイス ID なしの Control UI 接続を**ブロック**します。

文書化された例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost 限定の非セキュア HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` を通した正常な operator Control UI 認証
- 緊急用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS（Tailscale Serve）を使うか、UI をローカルで開いてください:

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（Gateway ホスト上）

**非セキュア認証トグルの動作:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` はローカル互換性用のトグルにすぎません:

- これにより、非セキュア HTTP コンテキストでも
  localhost の Control UI セッションはデバイス ID なしで進行できます。
- pairing チェックはバイパスしません。
- リモート（非 localhost）のデバイス ID 要件は緩和しません。

**緊急用のみ:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` は Control UI のデバイス ID チェックを無効化するもので、
重大なセキュリティ低下です。緊急利用後は速やかに元に戻してください。

trusted-proxy に関する注意:

- trusted-proxy 認証に成功すると、**operator** の Control UI セッションは
  デバイス ID なしで許可される場合があります
- これは node-role の Control UI セッションには**適用されません**
- 同一ホストの loopback リバースプロキシは引き続き trusted-proxy 認証を満たしません。詳細は
  [Trusted proxy auth](/ja-JP/gateway/trusted-proxy-auth) を参照してください

HTTPS セットアップの案内については [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## Content Security Policy

Control UI には厳格な `img-src` ポリシーが含まれています。許可されるのは **same-origin** アセット、`data:` URL、およびローカル生成の `blob:` URL のみです。リモートの `http(s)` および protocol-relative な画像 URL はブラウザーによって拒否され、ネットワーク fetch は発行されません。

実際の動作は次のとおりです:

- 相対パス配下（例: `/avatars/<id>`）で提供されるアバターや画像は引き続きレンダリングされます。これには、UI が取得してローカル `blob:` URL に変換する認証付きアバタールートも含まれます。
- インライン `data:image/...` URL は引き続きレンダリングされます（プロトコル内ペイロードに有用です）。
- Control UI が作成したローカル `blob:` URL は引き続きレンダリングされます。
- チャネルメタデータから出力されたリモートアバター URL は、Control UI のアバターヘルパーで除去され、組み込みロゴ/バッジに置き換えられるため、侵害されたまたは悪意のあるチャネルが operator ブラウザーから任意のリモート画像 fetch を強制することはできません。

この動作を得るために何か変更する必要はありません。これは常に有効で、設定変更はできません。

## アバタールート認証

Gateway 認証が設定されている場合、Control UI のアバターエンドポイントは API の他の部分と同じ Gateway token を必要とします:

- `GET /avatar/<agentId>` は認証済み呼び出し元にのみアバター画像を返します。`GET /avatar/<agentId>?meta=1` は同じルールでアバターメタデータを返します。
- どちらのルートへの未認証リクエストも拒否されます（兄弟の assistant-media ルートと同様）。これにより、他の部分が保護されているホスト上でアバタールートから agent ID が漏れることを防ぎます。
- Control UI 自体は、アバター取得時に Gateway token を bearer ヘッダーとして転送し、認証付き blob URL を使用するため、画像はダッシュボード内で引き続き表示されます。

Gateway 認証を無効にすると（共有ホストでは非推奨）、アバタールートも Gateway の他の部分と同様に未認証になります。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを配信します。次でビルドします:

```bash
pnpm ui:build
```

固定アセット URL が必要な場合の任意の絶対 base:

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

ローカル開発用（別の dev server）:

```bash
pnpm ui:dev
```

その後、UI を Gateway WS URL（例: `ws://127.0.0.1:18789`）に向けてください。

## デバッグ/テスト: dev server + リモート Gateway

Control UI は静的ファイルであり、WebSocket ターゲットは設定可能で、
HTTP origin と異なっていてもかまいません。これは、Vite dev server はローカルで動かしつつ、
Gateway は別ホストで動かしたい場合に便利です。

1. UI dev server を起動: `pnpm ui:dev`
2. 次のような URL を開きます:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

必要に応じて任意のワンタイム認証:

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

メモ:

- `gatewayUrl` はロード後に localStorage に保存され、URL から削除されます。
- `token` は可能であれば URL フラグメント（`#token=...`）で渡してください。フラグメントはサーバーへ送信されないため、リクエストログや Referer からの漏えいを防げます。レガシーの `?token=` クエリパラメータも互換性のため一度だけ取り込まれますが、フォールバック用途に限られ、bootstrap 後すぐに取り除かれます。
- `password` はメモリ内のみに保持されます。
- `gatewayUrl` が設定されている場合、UI は設定や環境の認証情報へフォールバックしません。
  `token`（または `password`）を明示的に指定してください。
  明示的な認証情報がない場合はエラーです。
- Gateway が TLS の背後にある場合（Tailscale Serve、HTTPS プロキシなど）は `wss://` を使ってください。
- `gatewayUrl` はクリックジャッキング防止のため、トップレベルウィンドウでのみ受け付けられます（埋め込み不可）。
- 非 loopback の Control UI デプロイでは、`gateway.controlUi.allowedOrigins`
  を明示的に設定する必要があります（完全な origin）。これにはリモート dev 構成も含まれます。
- 厳密に制御されたローカルテスト以外では、`gateway.controlUi.allowedOrigins: ["*"]` を使わないでください。
  これは「今使っているホストに一致する」ではなく、「任意のブラウザー origin を許可する」ことを意味します。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は
  Host ヘッダー origin フォールバックモードを有効にしますが、危険なセキュリティモードです。

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

リモートアクセス構成の詳細: [Remote access](/ja-JP/gateway/remote)。

## 関連

- [Dashboard](/ja-JP/web/dashboard) — Gateway ダッシュボード
- [WebChat](/ja-JP/web/webchat) — ブラウザーベースのチャットインターフェース
- [TUI](/ja-JP/web/tui) — TUI
- [Health Checks](/ja-JP/gateway/health) — Gateway ヘルス監視
