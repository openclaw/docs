---
read_when:
    - ブラウザからGatewayを操作したい
    - SSHトンネルなしでTailnetアクセスを使いたい
summary: Gateway用のブラウザベースControl UI（チャット、Node、設定）
title: Control UI
x-i18n:
    generated_at: "2026-04-24T05:27:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ad0d0cef7d842eddf665ba50f37403df258b17d4c072d22a30d1bc3830dc467
    source_path: web/control-ui.md
    workflow: 15
---

Control UIは、Gatewayによって配信される小さな **Vite + Lit** のsingle-page appです:

- デフォルト: `http://<host>:18789/`
- 任意のprefix: `gateway.controlUi.basePath` を設定（例: `/openclaw`）

これは同じポート上の **Gateway WebSocket** と**直接通信**します。

## クイックオープン（ローカル）

Gatewayが同じコンピュータ上で動作している場合は、次を開きます:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）

ページが読み込めない場合は、まずGatewayを起動してください: `openclaw gateway`

authは、WebSocket handshake中に次のいずれかで供給されます:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` のときのTailscale Serve identity header
- `gateway.auth.mode: "trusted-proxy"` のときのtrusted-proxy identity header

dashboard settings panelは、現在のブラウザタブセッション
および選択中のgateway URL用のtokenを保持します。passwordは永続化されません。オンボーディングでは通常、
初回接続時にshared-secret auth用のgateway tokenを生成しますが、`gateway.auth.mode` が `"password"` の場合は
password authでも動作します。

## デバイスペアリング（初回接続）

新しいブラウザまたはデバイスからControl UIに接続すると、Gatewayは
**一度限りのペアリング承認**を要求します — 同じTailnet上にいて
`gateway.auth.allowTailscale: true` であっても同様です。これは、不正アクセスを防ぐための
セキュリティ対策です。

**表示される内容:** `disconnected (1008): pairing required`

**デバイスを承認するには:**

```bash
# 保留中リクエストを一覧表示
openclaw devices list

# request IDで承認
openclaw devices approve <requestId>
```

ブラウザが変更されたauth detail（role/scopes/public
key）でペアリングを再試行した場合、前の保留リクエストは置き換えられ、新しい `requestId` が
作られます。承認前に `openclaw devices list` を再実行してください。

ブラウザがすでにペアリング済みで、read accessから
write/admin accessへ変更する場合、これはサイレントな再接続ではなく承認upgradeとして扱われます。OpenClawは古い承認を有効なまま保持し、より広い権限での再接続をブロックし、
新しいscope setを明示的に承認するよう求めます。

いったん承認されると、そのデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で
取り消さない限り、再承認は不要です。token rotationと取り消しについては
[Devices CLI](/ja-JP/cli/devices) を参照してください。

**注記:**

- 直接のローカルloopbackブラウザ接続（`127.0.0.1` / `localhost`）は
  自動承認されます。
- TailnetおよびLANのブラウザ接続は、それが同じマシン由来であっても
  明示的な承認が必要です。
- 各ブラウザprofileは一意のdevice IDを生成するため、ブラウザを切り替えたり
  browser dataを消去したりすると再ペアリングが必要になります。

## 個人identity（ブラウザローカル）

Control UIは、共有セッションでの送信メッセージに帰属情報として付与される、
ブラウザごとの個人identity（表示名とavatar）をサポートしています。これはブラウザストレージに保存され、
現在のブラウザprofileに限定され、他デバイスには同期されません。また、実際に送信したメッセージ上の通常のtranscript authorship metadataを超えて、サーバー側へ永続化されることもありません。site dataを消去するか、ブラウザを切り替えると空に戻ります。

## ランタイムconfig endpoint

Control UIは、そのランタイム設定を
`/__openclaw/control-ui-config.json` から取得します。このendpointは、HTTPサーフェスの他部分と同じ
gateway authで保護されています: 未認証ブラウザは取得できず、
取得成功には、すでに有効なgateway
token/password、Tailscale Serve identity、またはtrusted-proxy identityのいずれかが必要です。

## 言語サポート

Control UIは、初回読み込み時にブラウザlocaleに基づいて自身をローカライズできます。
後で上書きするには、**Overview -> Gateway Access -> Language** を開いてください。locale pickerは
AppearanceではなくGateway Accessカード内にあります。

- サポートlocale: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- 英語以外の翻訳はブラウザでlazy-loadされます。
- 選択したlocaleはブラウザストレージに保存され、次回以降の訪問でも再利用されます。
- 翻訳keyが欠けている場合は英語にfallbackします。

## 今できること

- Gateway WS経由でモデルとチャットする（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）
- ブラウザからWebRTC経由でOpenAI Realtimeと直接通信する。Gatewayは
  `talk.realtime.session` で短命なRealtime client secretを発行し、ブラウザは
  microphone audioを直接OpenAIに送り、
  `openclaw_agent_consult` tool callを `chat.send` 経由で、設定済みのより大きなOpenClaw modelへ中継する。
- Chat内でtool call + live tool output cardをstreamする（agent event）
- Channels: 組み込みおよびバンドル済み/外部plugin channelのstatus、QR login、チャネルごとのconfig（`channels.status`, `web.login.*`, `config.patch`）
- Instances: presence list + refresh（`system-presence`）
- Sessions: list + セッションごとのmodel/thinking/fast/verbose/trace/reasoning override（`sessions.list`, `sessions.patch`）
- Dreams: dreaming status、有効/無効toggle、Dream Diary reader（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）
- Cron jobs: list/add/edit/run/enable/disable + run history（`cron.*`）
- Skills: status、有効/無効、インストール、API key更新（`skills.*`）
- Nodes: list + caps（`node.list`）
- Exec approvals: gatewayまたはnode allowlistの編集 + `exec host=gateway/node` 用のask policy（`exec.approvals.*`）
- Config: `~/.openclaw/openclaw.json` を表示/編集（`config.get`, `config.set`）
- Config: 検証付きでapply + restart（`config.apply`）し、最後にアクティブだったsessionを起こす
- Config書き込みには、同時編集の上書きを防ぐためbase-hash guardが含まれる
- Config書き込み（`config.set`/`config.apply`/`config.patch`）では、書き込み前に、送信されたconfig payload中のrefについてactive SecretRef resolutionのpreflightも行う。未解決のactive submitted refは書き込み前に拒否される
- Config schema + form rendering（`config.schema` / `config.schema.lookup`、
  fieldの `title` / `description`、一致したUI hint、直接の子要約、
  nested object/wildcard/array/composition node上のdocs metadata、
  さらに利用可能ならplugin + channel schemaも含む）。Raw JSON editorは、
  snapshotが安全にraw round-tripできる場合にのみ利用可能
- snapshotが安全にraw round-tripできない場合、Control UIはForm modeを強制し、そのsnapshotではRaw modeを無効化する
- Raw JSON editorの「Reset to saved」は、flattenされたsnapshotを再レンダリングする代わりに、raw作成時のshape（書式、コメント、`$include` レイアウト）を保持する。そのため、snapshotが安全にraw round-tripできる場合、外部編集もreset後に残る
- 構造化SecretRef object値は、誤ってobject-to-string破損を起こさないよう、form text inputではread-only表示される
- Debug: status/health/models snapshot + event log + 手動RPC call（`status`, `health`, `models.list`）
- Logs: gateway file logのlive tail、filter/export付き（`logs.tail`）
- Update: package/git update + restart（`update.run`）を実行し、restart reportを表示

Cron jobs panelの注記:

- isolated jobでは、配信のデフォルトはannounce summaryです。内部実行専用にしたい場合はnoneへ切り替えられます。
- announceが選ばれている場合、channel/target fieldが表示されます。
- Webhook modeでは `delivery.mode = "webhook"` を使い、`delivery.to` には有効なHTTP(S) Webhook URLを設定します。
- main-session jobでは、webhookとnoneのdelivery modeが利用可能です。
- 高度な編集controlには、delete-after-run、agent overrideのクリア、cron exact/stagger option、
  agent model/thinking override、best-effort delivery toggleが含まれます。
- Form validationはfield-level error付きのインラインです。不正な値がある間はsave buttonが無効になります。
- 専用bearer tokenを送るには `cron.webhookToken` を設定します。省略するとauth headerなしでwebhookが送られます。
- 非推奨fallback: `notify: true` を持つ保存済みlegacy jobは、移行されるまで引き続き `cron.webhook` を使えます。

## Chatの動作

- `chat.send` は**non-blocking**です: ただちに `{ runId, status: "started" }` でackし、その後レスポンスは `chat` event経由でstreamされます。
- 同じ `idempotencyKey` で再送すると、実行中は `{ status: "in_flight" }` を返し、完了後は `{ status: "ok" }` を返します。
- `chat.history` レスポンスはUI安全性のためサイズ制限されています。transcript entryが大きすぎる場合、Gatewayは長いtext fieldをtruncateし、重いmetadata blockを省略し、巨大なmessageをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えることがあります。
- assistant/generated imageは管理されたmedia referenceとして永続化され、認証付きGateway media URL経由で返されるため、再読み込み時に生のbase64 image payloadがchat historyレスポンス内に残っている必要はありません。
- `chat.history` はまた、表示専用のインラインdirective tagを可視assistant textから除去します（例: `[[reply_to_*]]` と `[[audio_as_voice]]`）、plain-text tool-call XML payload（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、およびtruncateされたtool-call blockを含む）、さらに漏れ出たASCII/full-width model control tokenも除去し、可視text全体が厳密にサイレントtoken `NO_REPLY` / `no_reply` のみであるassistant entryは省略します。
- `chat.inject` はassistant noteをsession transcriptに追記し、UI専用更新用に `chat` eventをbroadcastします（agent runなし、channel deliveryなし）。
- Chat headerのmodelとthinking pickerは、アクティブsessionに対して即座に `sessions.patch` を適用します。これらは永続的なsession overrideであり、1ターンだけのsend optionではありません。
- Talk modeは登録済みrealtime voice providerを使います。OpenAIを設定するには
  `talk.provider: "openai"` と `talk.providers.openai.apiKey` を使うか、
  Voice Call realtime provider configを再利用してください。ブラウザが通常の
  OpenAI API keyを受け取ることはなく、受け取るのは一時的なRealtime client secretのみです。
  Realtime session promptはGatewayによって組み立てられます。`talk.realtime.session`
  は呼び出し元提供のinstruction overrideを受け付けません。
- Chat composerでは、Talk controlは
  microphone dictation buttonの隣にある波形ボタンです。Talkが始まると、composer status rowには
  `Connecting Talk...` が表示され、その後audio接続中は `Talk live`、
  realtime tool callが `chat.send` 経由で設定済みの
  より大きなmodelへ問い合わせている間は `Asking OpenClaw...` が表示されます。
- Stop:
  - **Stop** をクリック（`chat.abort` を呼ぶ）
  - 実行中は通常のfollow-upがqueueされます。queueされたメッセージの **Steer** をクリックすると、そのfollow-upを実行中ターンへinjectします。
  - `/stop` を入力する（または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` のようなstandalone abort phrase）とout-of-bandで中断
  - `chat.abort` は `{ sessionKey }`（`runId` なし）をサポートし、そのsessionのすべてのactive runを中断する
- Abort partial retention:
  - runが中断されたとき、partial assistant textがUI上に表示され続けることがあります
  - Gatewayは、buffered outputが存在する場合、中断されたpartial assistant textをtranscript historyへ永続化します
  - 永続化されたentryにはabort metadataが含まれるため、transcript consumerはabort partialと通常完了出力を区別できます

## ホスト型embed

assistant messageは、`[embed ...]`
shortcodeを使ってホストされたweb contentをインライン表示できます。iframe sandbox policyは
`gateway.controlUi.embedSandbox` で制御されます:

- `strict`: ホストされたembed内のscript実行を無効化
- `scripts`: interactive embedを許可しつつorigin isolationを維持。これが
  デフォルトで、通常は自己完結型browser game/widgetにはこれで十分です
- `trusted`: `allow-scripts` に加えて `allow-same-origin` も付ける。同一サイト文書で意図的に強い権限が必要な場合向け

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

embedされた文書が本当にsame-origin
behaviorを必要とする場合にのみ `trusted` を使ってください。ほとんどのagent生成gameやinteractive canvasでは、`scripts` のほうが
より安全な選択です。

絶対外部 `http(s)` embed URLはデフォルトで引き続きブロックされます。意図的に
`[embed url="https://..."]` でサードパーティページを読み込みたい場合は、
`gateway.controlUi.allowExternalEmbedUrls: true` を設定してください。

## Tailnetアクセス（推奨）

### 統合Tailscale Serve（推奨）

Gatewayをloopbackのままにして、Tailscale ServeでHTTPSプロキシしてください:

```bash
openclaw gateway --tailscale serve
```

開くURL:

- `https://<magicdns>/`（または設定した `gateway.controlUi.basePath`）

デフォルトでは、`gateway.auth.allowTailscale` が `true` のとき、Control UI/WebSocket ServeリクエストはTailscale identity header
（`tailscale-user-login`）で認証できます。OpenClawは、
`x-forwarded-for` アドレスを `tailscale whois` で解決して
headerと照合することでidentityを検証し、そのリクエストが
Tailscaleの `x-forwarded-*` header付きでloopbackに到達した場合にのみ受け付けます。Serveトラフィックであっても明示的なshared-secret
credentialを必須にしたい場合は、`gateway.auth.allowTailscale: false` を設定してください。その場合は `gateway.auth.mode: "token"` または
`"password"` を使ってください。
この非同期Serve identity経路では、同じclient IP
およびauth scopeに対する認証失敗は、rate-limit書き込み前に直列化されます。
そのため、同じブラウザからの並行した不正リトライでは、単純な不一致が並行して競合する代わりに、
2回目のリクエストで `retry later` が表示されることがあります。
token不要のServe authは、gateway hostが信頼できることを前提にしています。そのhost上で信頼できないローカルコードが動作しうるなら、
token/password authを必須にしてください。

### tailnetにbind + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

その後、次を開きます:

- `http://<tailscale-ip>:18789/`（または設定した `gateway.controlUi.basePath`）

一致するshared secretをUI settingsに貼り付けてください（
`connect.params.auth.token` または `connect.params.auth.password` として送信されます）。

## 安全でないHTTP

dashboardを平文HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）で開くと、
ブラウザは **non-secure context** で動作し、WebCryptoをブロックします。デフォルトでは、
OpenClawはdevice identityなしのControl UI接続を**ブロック**します。

文書化された例外:

- `gateway.controlUi.allowInsecureAuth=true` によるlocalhost専用の安全でないHTTP互換
- `gateway.auth.mode: "trusted-proxy"` を通じた正常なoperator Control UI auth
- 緊急用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS（Tailscale Serve）を使うか、UIをローカルで開いてください:

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（gateway host上）

**安全でないauth toggleの動作:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` はローカル互換性用のtoggleにすぎません:

- これにより、non-secure HTTP contextでlocalhostのControl UI sessionが
  device identityなしでも進行できるようになります。
- pairingチェックはバイパスしません。
- remote（non-localhost）のdevice identity要件は緩和しません。

**緊急時専用:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` はControl UIのdevice identityチェックを無効化し、
深刻なセキュリティ低下を引き起こします。緊急利用後は速やかに元に戻してください。

trusted-proxyに関する注記:

- trusted-proxy authに成功すると、device identityなしで
  **operator** Control UI sessionを許可できます
- これはnode-role Control UI sessionには**拡張されません**
- 同一host上のloopback reverse proxyでもtrusted-proxy authは満たしません。参照:
  [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth)

HTTPSセットアップのガイダンスは [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## Content Security Policy

Control UIは厳格な `img-src` ポリシーを備えています: 許可されるのは **same-origin** のassetと `data:` URLのみです。remoteの `http(s)` およびprotocol-relative image URLはブラウザによって拒否され、network fetchは発行されません。

実際の意味:

- 相対path配下で配信されるavatarやimage（たとえば `/avatars/<id>`）は引き続きレンダリングされます。
- インライン `data:image/...` URLは引き続きレンダリングされます（in-protocol payloadで便利です）。
- channel metadataが出力するremote avatar URLは、Control UIのavatar helperで除去され、組み込みlogo/badgeに置き換えられます。そのため、侵害された、または悪意あるchannelがoperator browserに任意のremote image fetchを強制することはできません。

この動作を得るために何か変更する必要はありません — 常に有効で、設定もできません。

## Avatar route auth

gateway authが設定されている場合、Control UIのavatar endpointはAPIの他の部分と同じgateway tokenを必要とします:

- `GET /avatar/<agentId>` は認証済み呼び出し元にのみavatar imageを返します。`GET /avatar/<agentId>?meta=1` は同じルールでavatar metadataを返します。
- どちらのrouteへの未認証リクエストも拒否されます（隣接するassistant-media routeと同じ）。これにより、他の部分が保護されているhost上でavatar routeからagent identityが漏れるのを防ぎます。
- Control UI自身は、avatar取得時にgateway tokenをbearer headerとして転送し、認証済みblob URLを使うため、dashboardでもimageは正しくレンダリングされます。

gateway authを無効にした場合（共有hostでは非推奨）、avatar routeもgatewayの他部分に合わせて未認証になります。

## UIをビルドする

Gatewayは `dist/control-ui` から静的ファイルを配信します。次でビルドします:

```bash
pnpm ui:build
```

任意の絶対base（固定asset URLを使いたい場合）:

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

ローカル開発用（別dev server）:

```bash
pnpm ui:dev
```

その後、UIをGateway WS URL（例: `ws://127.0.0.1:18789`）に向けてください。

## デバッグ/テスト: dev server + remote Gateway

Control UIは静的ファイルであり、WebSocket targetは設定可能で、
HTTP originと異なっていても構いません。これは、Vite dev serverをローカルで動かしつつ、
Gatewayは別マシンで動かしたい場合に便利です。

1. UI dev serverを起動: `pnpm ui:dev`
2. 次のようなURLを開く:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

任意の一回限りauth（必要な場合）:

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

注記:

- `gatewayUrl` は読み込み後にlocalStorageへ保存され、URLから削除されます。
- `token` は可能な限りURL fragment（`#token=...`）で渡してください。fragmentはサーバーへ送信されないため、request logやRefererへの漏洩を避けられます。互換性のため、legacyな `?token=` query paramも一度だけ取り込みますが、これはfallbackにすぎず、bootstrap直後に削除されます。
- `password` はメモリ内にのみ保持されます。
- `gatewayUrl` が設定されている場合、UIはconfigや環境credentialにfallbackしません。
  `token`（または `password`）を明示的に指定してください。
  明示的credentialが欠けているとエラーです。
- GatewayがTLSの背後にある場合（Tailscale Serve、HTTPS proxyなど）は `wss://` を使ってください。
- `gatewayUrl` はトップレベルwindowでのみ受け付けられます（埋め込みでは不可）。これはclickjacking防止のためです。
- non-loopbackのControl UIデプロイでは、`gateway.controlUi.allowedOrigins`
  を明示的に設定する必要があります（完全なorigin）。これにはremote dev構成も含まれます。
- 厳しく制御されたローカルテストを除き、`gateway.controlUi.allowedOrigins: ["*"]` は使わないでください。
  これは任意のbrowser originを許可するのであって、「今使っているhostに合わせる」ことではありません。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は
  Host-header origin fallback modeを有効にしますが、危険なセキュリティモードです。

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

remote accessセットアップの詳細: [Remote access](/ja-JP/gateway/remote)。

## 関連

- [Dashboard](/ja-JP/web/dashboard) — gateway dashboard
- [WebChat](/ja-JP/web/webchat) — ブラウザベースのチャットインターフェース
- [TUI](/ja-JP/web/tui) — TUI
- [Health Checks](/ja-JP/gateway/health) — gatewayのヘルスモニタリング
