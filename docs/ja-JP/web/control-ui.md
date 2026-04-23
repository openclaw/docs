---
read_when:
    - ブラウザーからGatewayを操作したい。
    - SSHトンネルなしでTailnetアクセスを使いたい。
summary: Gateway用のブラウザベースControl UI（チャット、Nodes、設定）
title: Control UI
x-i18n:
    generated_at: "2026-04-23T14:11:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce0ed08db83a04d47122c5ada0507d6a9e4c725f8ad4fa8f62cb5d4f0412bfc6
    source_path: web/control-ui.md
    workflow: 15
---

# Control UI（ブラウザー）

Control UIは、Gatewayによって配信される小さな**Vite + Lit**のシングルページアプリです:

- デフォルト: `http://<host>:18789/`
- 任意のprefix: `gateway.controlUi.basePath` を設定（例: `/openclaw`）

これは同じポート上の**Gateway WebSocketに直接**接続します。

## クイックオープン（ローカル）

Gatewayが同じコンピューター上で動作している場合は、次を開きます:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）

ページが読み込めない場合は、先にGatewayを起動してください: `openclaw gateway`。

認証は、WebSocketハンドシェイク中に次を通じて渡されます:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` のときのTailscale Serve identity headers
- `gateway.auth.mode: "trusted-proxy"` のときのtrusted-proxy identity headers

ダッシュボード設定パネルは、現在のブラウザータブセッションと選択したgateway URLに対するtokenを保持しますが、passwordsは永続化しません。オンボーディングでは通常、初回接続時に共有シークレット認証用のgateway tokenが生成されますが、`gateway.auth.mode` が `"password"` の場合はpassword認証も使えます。

## デバイスペアリング（初回接続）

新しいブラウザーまたはデバイスからControl UIへ接続すると、Gatewayは**1回限りのペアリング承認**を要求します。これは、同じTailnet上で `gateway.auth.allowTailscale: true` の場合でも同様です。これは、不正アクセスを防ぐためのセキュリティ対策です。

**表示される内容:** 「disconnected (1008): pairing required」

**デバイスを承認するには:**

```bash
# 保留中の要求を一覧表示
openclaw devices list

# request IDで承認
openclaw devices approve <requestId>
```

ブラウザーが変更された認証詳細（role/scopes/public
key）でペアリングを再試行した場合、以前の保留中要求は置き換えられ、新しい `requestId` が作成されます。承認前に `openclaw devices list` を再実行してください。

ブラウザーがすでにペアリング済みで、それをreadアクセスから
write/adminアクセスへ変更した場合、これは無言の再接続ではなく、承認アップグレードとして扱われます。OpenClawは古い承認を有効なまま維持し、より広い再接続をブロックし、新しいscope setを明示的に承認するよう求めます。

いったん承認されると、そのデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で失効しない限り再承認は不要です。tokenのローテーションと失効については
[Devices CLI](/ja-JP/cli/devices) を参照してください。

**注記:**

- 直接のローカルloopbackブラウザー接続（`127.0.0.1` / `localhost`）は
  自動承認されます。
- TailnetおよびLANからのブラウザー接続は、同じマシンからの接続であっても引き続き明示的承認が必要です。
- 各ブラウザープロファイルは一意のdevice IDを生成するため、ブラウザーを切り替えたりブラウザーデータを消去したりすると再ペアリングが必要になります。

## 個人アイデンティティ（ブラウザー内ローカル）

Control UIは、共有sessionで送信メッセージの帰属表示に使われる、ブラウザーごとの個人アイデンティティ（表示名と
avatar）をサポートしています。これはブラウザーストレージに保存され、現在のブラウザープロファイルに限定され、実際に送信したメッセージ上の通常のtranscript authorship metadataを超えて、他のデバイスへ同期されたりサーバー側に永続化されたりすることはありません。site dataを消去するかブラウザーを切り替えると空にリセットされます。

## ランタイムconfig endpoint

Control UIは、そのランタイム設定を
`/__openclaw/control-ui-config.json` から取得します。このendpointは、
HTTP surfaceの他の部分と同じgateway authで保護されています。未認証のブラウザーは
取得できず、取得成功には、すでに有効なgateway
token/password、Tailscale Serve identity、またはtrusted-proxy identityのいずれかが必要です。

## 言語サポート

Control UIは、初回読み込み時にブラウザーlocaleに基づいて自身をローカライズできます。後で上書きするには、**Overview -> Gateway Access -> Language** を開いてください。locale pickerはAppearanceの下ではなく、Gateway Accessカード内にあります。

- サポートされるlocale: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- 英語以外の翻訳はブラウザーで遅延読み込みされます。
- 選択したlocaleはブラウザーストレージに保存され、次回以降のアクセスでも再利用されます。
- 翻訳キーが欠けている場合は英語にフォールバックします。

## 現在できること

- Gateway WS経由でmodelとチャット（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）
- Chat内でのtool calls + ライブtool出力カードのストリーミング（agent events）
- Channels: 組み込みおよび同梱/外部Plugin channelsのstatus、QRログイン、channelごとのconfig（`channels.status`, `web.login.*`, `config.patch`）
- Instances: presence一覧 + リフレッシュ（`system-presence`）
- Sessions: 一覧 + sessionごとのmodel/thinking/fast/verbose/trace/reasoning overrides（`sessions.list`, `sessions.patch`）
- Dreams: dreaming status、有効/無効トグル、およびDream Diary reader（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）
- Cron jobs: 一覧/追加/編集/実行/有効化/無効化 + 実行履歴（`cron.*`）
- Skills: status、有効/無効、インストール、API key更新（`skills.*`）
- Nodes: 一覧 + caps（`node.list`）
- Exec approvals: gatewayまたはnode allowlistsの編集 + `exec host=gateway/node` 用のask policy（`exec.approvals.*`）
- Config: `~/.openclaw/openclaw.json` の表示/編集（`config.get`, `config.set`）
- Config: 検証付きの適用 + 再起動（`config.apply`）および最後にアクティブだったsessionのwake
- Config書き込みには、同時編集の上書きを防ぐbase-hash guardが含まれます
- Config書き込み（`config.set`/`config.apply`/`config.patch`）では、送信されたconfig payload内のrefsについて、アクティブなSecretRef解決のpreflightも行われます。解決不能なアクティブsubmitted refsは書き込み前に拒否されます
- Config schema + form rendering（`config.schema` / `config.schema.lookup`。
  fieldの `title` / `description`、一致するUI hints、直下のchild
  summaries、ネストされたobject/wildcard/array/composition nodes上のdocs metadata、
  および利用可能な場合のplugin + channel schemasを含む）。Raw JSON editorは、
  snapshotに安全なraw round-tripがある場合にのみ利用可能です
- Snapshotが安全にraw round-tripできない場合、Control UIはForm modeを強制し、そのsnapshotではRaw modeを無効にします
- Raw JSON editorの「Reset to saved」は、flattenされたsnapshotを再描画するのではなく、rawで記述された形（書式、comments、`$include` レイアウト）を保持するため、安全にround-tripできるsnapshotでは外部編集内容がreset後も保持されます
- 構造化されたSecretRef object valuesは、誤ってobject-to-string破損を起こさないよう、form text inputsでは読み取り専用で表示されます
- Debug: status/health/models snapshots + event log + 手動RPC calls（`status`, `health`, `models.list`）
- Logs: フィルター/エクスポート付きgateway file logsのライブtail（`logs.tail`）
- Update: 再起動レポート付きのpackage/git update + restart実行（`update.run`）

Cron jobsパネルの注記:

- 分離jobでは、配信のデフォルトはannounce summaryです。内部実行専用にしたい場合はnoneへ切り替えられます。
- announceが選択されている場合、channel/target fieldsが表示されます。
- Webhook modeは、`delivery.mode = "webhook"` を使い、`delivery.to` に有効なHTTP(S) Webhook URLを設定します。
- main-session jobsでは、Webhookとnoneのdelivery modesが利用可能です。
- 高度な編集コントロールには、delete-after-run、clear agent override、Cron exact/stagger options、
  agent model/thinking overrides、およびbest-effort delivery togglesが含まれます。
- Form validationはfield-level errors付きのインラインです。不正な値があると、修正されるまでsaveボタンは無効になります。
- 専用のbearer tokenを送るには `cron.webhookToken` を設定してください。省略した場合、Webhookはauth headerなしで送信されます。
- 非推奨のフォールバック: `notify: true` を持つ保存済みのlegacy jobsは、移行されるまで引き続き `cron.webhook` を使えます。

## チャット動作

- `chat.send` は**non-blocking**です: すぐに `{ runId, status: "started" }` でackし、応答は `chat` events経由でストリーミングされます。
- 同じ `idempotencyKey` で再送すると、実行中は `{ status: "in_flight" }`、完了後は `{ status: "ok" }` が返ります。
- `chat.history` の応答は、UI安全性のためサイズ制限されています。transcript entriesが大きすぎる場合、Gatewayは長いテキストfieldsを切り詰めたり、重いmetadata blocksを省略したり、大きすぎるメッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えたりすることがあります。
- `chat.history` は、可視assistant textから表示専用のinline directive tags（たとえば `[[reply_to_*]]` や `[[audio_as_voice]]`）、プレーンテキストのtool-call XML payloads（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたtool-call blocksを含む）、漏れたASCII/full-width model control tokensも除去し、可視テキスト全体が厳密なsilent token `NO_REPLY` / `no_reply` のみであるassistant entriesを省略します。
- `chat.inject` はsession transcriptにassistant noteを追記し、UI専用更新用の `chat` eventをbroadcastします（agent runなし、channel配信なし）。
- チャットヘッダーのmodelとthinkingのpickerは、`sessions.patch` を通じてアクティブsessionを即座にpatchします。これらは一度限りのsend optionsではなく、永続的なsession overridesです。
- Stop:
  - **Stop** をクリック（`chat.abort` を呼び出す）
  - `/stop` を入力（または `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` のような単独のabort phrases）してout-of-bandでabort
  - `chat.abort` は `{ sessionKey }`（`runId` なし）をサポートし、そのsessionのすべてのアクティブrunsをabortできます
- Abort partial retention:
  - Runがabortされたとき、partialなassistant textがUIに表示されることがあります
  - Gatewayは、buffered outputが存在する場合、abortされたpartialなassistant textをtranscript historyへ永続化します
  - 永続化されたentriesにはabort metadataが含まれるため、transcript consumersはabort partialsと通常のcompletion outputを区別できます

## Hosted embeds

Assistantメッセージは `[embed ...]`
shortcodeを使ってhosted web contentをインライン表示できます。iframe sandbox policyは
`gateway.controlUi.embedSandbox` で制御されます:

- `strict`: hosted embeds内でのscript実行を無効化
- `scripts`: origin isolationを保ったままinteractive embedsを許可。これが
  デフォルトで、通常は自己完結したブラウザーゲーム/ウィジェットにはこれで十分です
- `trusted`: `allow-scripts` に加えて `allow-same-origin` を追加。意図的により強い権限を必要とするsame-site
  documents向け

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

埋め込まれたdocumentが本当にsame-origin
behaviorを必要とする場合にのみ `trusted` を使ってください。ほとんどのagent生成ゲームやinteractive canvasesでは、`scripts` の方が安全な選択です。

絶対外部 `http(s)` embed URLsはデフォルトでは引き続きブロックされます。意図的に `[embed url="https://..."]` でサードパーティページを読み込みたい場合は、`gateway.controlUi.allowExternalEmbedUrls: true` を設定してください。

## Tailnetアクセス（推奨）

### 統合Tailscale Serve（推奨）

Gatewayはloopback上に維持し、Tailscale ServeにHTTPSでproxyさせます:

```bash
openclaw gateway --tailscale serve
```

開く場所:

- `https://<magicdns>/`（または設定済みの `gateway.controlUi.basePath`）

デフォルトでは、`gateway.auth.allowTailscale` が `true` のとき、Control UI/WebSocket Serve requestsはTailscale identity headers
（`tailscale-user-login`）経由で認証できます。OpenClawは、
`x-forwarded-for` アドレスを `tailscale whois` で解決して
headerと照合することでidentityを検証し、requestが
Tailscaleの `x-forwarded-*` headers付きでloopbackに到達したときにのみ、これらを受け入れます。Serveトラフィックであっても明示的な共有シークレット
credentialsを要求したい場合は、`gateway.auth.allowTailscale: false` を設定してください。その場合は `gateway.auth.mode: "token"` または
`"password"` を使ってください。
この非同期Serve identity pathでは、同じclient IP
およびauth scopeからの認証失敗試行は、rate-limit書き込み前に直列化されます。そのため、同じブラウザーからの同時の不正リトライでは、2つの単純なmismatchが並列に競合する代わりに、2回目のrequestで `retry later` が表示されることがあります。
TokenなしのServe authは、gateway hostが信頼されていることを前提にします。そのhost上で信頼できないローカルコードが実行されうる場合は、token/password authを要求してください。

### tailnetへbind + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

その後、次を開きます:

- `http://<tailscale-ip>:18789/`（または設定済みの `gateway.controlUi.basePath`）

一致する共有シークレットをUI設定に貼り付けてください（`connect.params.auth.token` または `connect.params.auth.password` として送信されます）。

## 安全でないHTTP

プレーンHTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、
ブラウザーは**非セキュアコンテキスト**で動作し、WebCryptoをブロックします。デフォルトでは、
OpenClawはデバイスIDなしのControl UI接続を**ブロック**します。

文書化された例外:

- `gateway.controlUi.allowInsecureAuth=true` によるlocalhost専用の安全でないHTTP互換性
- `gateway.auth.mode: "trusted-proxy"` を通した成功したoperator Control UI認証
- 緊急用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS（Tailscale Serve）を使うか、ローカルでUIを開いてください:

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（gateway host上）

**安全でないauthトグルの動作:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` はローカル互換性専用のトグルです:

- これにより、非セキュアHTTPコンテキストでもlocalhostのControl UI sessionsが
  デバイスIDなしで進行できるようになります。
- ペアリングチェックはバイパスしません。
- リモート（非localhost）のデバイスID要件は緩和しません。

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

`dangerouslyDisableDeviceAuth` はControl UIのデバイスIDチェックを無効化し、
深刻なセキュリティ低下になります。緊急使用後は速やかに元に戻してください。

Trusted-proxyに関する注記:

- 成功したtrusted-proxy authは、デバイスIDなしで **operator** Control UI sessionsを許可できます
- これはnode-roleのControl UI sessionsには**適用されません**
- 同一hostのloopback reverse proxiesもtrusted-proxy authを満たしません。詳しくは
  [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照してください

HTTPSセットアップのガイダンスについては [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## Content Security Policy

Control UIは、厳格な `img-src` ポリシーを持っています: **same-origin** のassetsと `data:` URLsのみ許可されます。リモートの `http(s)` およびprotocol-relative image URLsはブラウザーによって拒否され、ネットワークfetchは発生しません。

実際には次の意味になります:

- 相対パス（たとえば `/avatars/<id>`）で配信されるavatarsやimagesは引き続き表示されます。
- インラインの `data:image/...` URLsは引き続き表示されます（in-protocol payloadsに有用です）。
- Channel metadataが出力するリモートavatar URLsは、Control UIのavatar helpersで除去され、組み込みlogo/badgeに置き換えられます。これにより、侵害されたまたは悪意あるchannelがoperatorブラウザーから任意のリモートimage fetchを強制することを防ぎます。

この動作を得るために変更する必要はありません。これは常に有効で、設定変更はできません。

## Avatar route認証

Gateway authが設定されている場合、Control UI avatar endpointはAPIの他の部分と同じgateway tokenを必要とします:

- `GET /avatar/<agentId>` は、認証済み呼び出し元にのみavatar imageを返します。`GET /avatar/<agentId>?meta=1` は同じルールでavatar metadataを返します。
- どちらのrouteへの未認証要求も拒否されます（隣接するassistant-media routeと同じ）。これにより、他が保護されているhosts上でavatar routeからagent identityが漏れることを防ぎます。
- Control UI自体は、avatars取得時にgateway tokenをbearer headerとして転送し、認証済みblob URLsを使うため、ダッシュボード内で画像は引き続き表示されます。

Gateway authを無効にした場合（共有hostsでは非推奨）、avatar routeもGatewayの他の部分と同様に未認証になります。

## UIのビルド

Gatewayは `dist/control-ui` から静的ファイルを配信します。これらは次でビルドします:

```bash
pnpm ui:build
```

任意の絶対base（固定asset URLsが欲しい場合）:

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

ローカル開発用（別dev server）:

```bash
pnpm ui:dev
```

その後、UIをGateway WS URL（例: `ws://127.0.0.1:18789`）に向けてください。

## デバッグ/テスト: dev server + リモートGateway

Control UIは静的ファイルであり、WebSocket targetは設定可能で、HTTP originと
異なっていても構いません。これは、Vite dev serverはローカルで動かしたいが
Gatewayは別の場所で動いている場合に便利です。

1. UI dev serverを起動: `pnpm ui:dev`
2. 次のようなURLを開きます:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

必要なら任意の一時auth:

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

注記:

- `gatewayUrl` は読み込み後にlocalStorageに保存され、URLから削除されます。
- `token` は、可能な限りURL fragment（`#token=...`）経由で渡すべきです。Fragmentsはサーバーに送信されないため、request-logやReferer漏えいを防げます。レガシーの `?token=` query paramsも互換性のために1回だけ取り込まれますが、あくまでfallbackであり、bootstrap直後に削除されます。
- `password` はメモリ内のみに保持されます。
- `gatewayUrl` が設定されている場合、UIはconfigや環境変数の認証情報にフォールバックしません。
  `token`（または `password`）を明示的に指定してください。明示的な認証情報がない場合はエラーです。
- GatewayがTLSの背後にある場合（Tailscale Serve、HTTPS proxyなど）は `wss://` を使ってください。
- `gatewayUrl` はclickjacking防止のため、トップレベルwindowでのみ受け付けられます（埋め込みでは不可）。
- 非loopbackのControl UI deploymentsでは、`gateway.controlUi.allowedOrigins`
  を明示的に設定する必要があります（完全なorigins）。これにはリモートdev setupsも含まれます。
- 厳密に制御されたローカルテストを除いて、`gateway.controlUi.allowedOrigins: ["*"]` を使わないでください。これは「今使っているhostに一致する」という意味ではなく、「あらゆるブラウザーoriginを許可する」という意味です。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は
  Host-header origin fallback modeを有効にしますが、これは危険なセキュリティモードです。

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

リモートアクセス設定の詳細: [Remote access](/ja-JP/gateway/remote)。

## 関連

- [Dashboard](/ja-JP/web/dashboard) — gatewayダッシュボード
- [WebChat](/ja-JP/web/webchat) — ブラウザーベースのチャットインターフェース
- [TUI](/ja-JP/web/tui) — ターミナルユーザーインターフェース
- [Health Checks](/ja-JP/gateway/health) — gateway健全性監視
