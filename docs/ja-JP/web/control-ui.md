---
read_when:
    - ブラウザーから Gateway を操作したい場合
    - SSH トンネルなしで Tailnet アクセスを使いたい場合
sidebarTitle: Control UI
summary: Gateway 向けのブラウザーベース Control UI（チャット、node、config）
title: Control UI
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:43:22Z"
  model: gpt-5.4
  provider: openai
  source_hash: a419e627c2b4e18687e946494d170b005102ba242b5f72c03ba0e55de2b8d4b3
  source_path: web/control-ui.md
  workflow: 15
---

Control UI は、Gateway によって配信される小さな **Vite + Lit** シングルページアプリです。

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定（例: `/openclaw`）

これは同じポート上の **Gateway WebSocket に直接**接続します。

## クイックオープン（ローカル）

Gateway が同じコンピューター上で実行されている場合は、次を開いてください。

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）

ページが読み込めない場合は、まず Gateway を起動してください: `openclaw gateway`

認証は WebSocket ハンドシェイク中に次のいずれかで提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` のときの Tailscale Serve identity header
- `gateway.auth.mode: "trusted-proxy"` のときの trusted-proxy identity header

ダッシュボードの設定パネルは、現在のブラウザータブセッションと選択された gateway URL に対して token を保持しますが、password は永続化しません。オンボーディングでは通常、最初の接続時に shared-secret 認証用の gateway token が生成されますが、`gateway.auth.mode` が `"password"` の場合は password 認証も使えます。

## デバイスペアリング（初回接続）

新しいブラウザーまたはデバイスから Control UI に接続すると、Gateway は通常 **1 回限りのペアリング承認** を要求します。これは、不正アクセスを防ぐためのセキュリティ対策です。

**表示される内容:** 「disconnected (1008): pairing required」

<Steps>
  <Step title="保留中のリクエストを一覧表示する">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="リクエスト ID で承認する">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

ブラウザーが変更された認証詳細（role/scopes/public key）でペアリングを再試行すると、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認前に `openclaw devices list` を再実行してください。

ブラウザーがすでにペアリング済みで、アクセスを read から write/admin に変更する場合、これはサイレントな再接続ではなく承認のアップグレードとして扱われます。OpenClaw は古い承認を有効のまま保持し、より広い権限での再接続をブロックして、新しい scope セットを明示的に承認するよう求めます。

一度承認されると、そのデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り再承認は不要です。token のローテーションと取り消しについては [Devices CLI](/ja-JP/cli/devices) を参照してください。

<Note>
- 直接のローカル loopback ブラウザー接続（`127.0.0.1` / `localhost`）は自動承認されます。
- `gateway.auth.allowTailscale: true` で Tailscale identity が検証され、ブラウザーがそのデバイス identity を提示する場合、Tailscale Serve は Control UI のオペレーターセッションでペアリング往復を省略できます。
- 直接 Tailnet bind、LAN ブラウザー接続、およびデバイス identity を持たないブラウザープロファイルでは、引き続き明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイス ID を生成するため、ブラウザーを切り替えたりブラウザーデータを消去したりすると再ペアリングが必要になります。

</Note>

## 個人 identity（ブラウザーローカル）

Control UI は、共有セッションでの attribution のために、送信メッセージに付加されるブラウザーごとの個人 identity（表示名とアバター）をサポートします。これはブラウザーのストレージに保存され、現在のブラウザープロファイルに限定され、他のデバイスには同期されず、実際に送信したメッセージに対する通常の transcript authorship メタデータを除きサーバー側にも永続化されません。サイトデータを消去するかブラウザーを切り替えると空にリセットされます。

同じブラウザーローカルのパターンは assistant avatar override にも適用されます。アップロードされた assistant avatar は、ローカルブラウザー上でのみ gateway 解決済み identity に重ねて表示され、`config.patch` を通じて往復されることはありません。共有の `ui.assistant.avatar` config フィールドは、依然としてそのフィールドを直接書き込む非 UI クライアント（scripted gateway や custom dashboard など）で利用できます。

## ランタイム config endpoint

Control UI は、ランタイム設定を `/__openclaw/control-ui-config.json` から取得します。この endpoint は、他の HTTP 画面と同じ gateway 認証で保護されています。未認証のブラウザーはこれを取得できず、取得に成功するには、すでに有効な gateway token/password、Tailscale Serve identity、または trusted-proxy identity のいずれかが必要です。

## 言語サポート

Control UI は、初回ロード時にブラウザーの locale に基づいてローカライズできます。後で override するには、**Overview -> Gateway Access -> Language** を開いてください。locale picker は Appearance ではなく Gateway Access カードにあります。

- サポートされる locale: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- 英語以外の翻訳はブラウザーで遅延ロードされます。
- 選択した locale はブラウザーのストレージに保存され、今後のアクセスでも再利用されます。
- 翻訳キーが欠けている場合は英語にフォールバックします。

## 現在できること

<AccordionGroup>
  <Accordion title="チャットと Talk">
    - Gateway WS 経由でモデルとチャット（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）。
    - ブラウザーから WebRTC 経由で OpenAI Realtime と直接会話。Gateway は `talk.realtime.session` で短命な Realtime client secret を発行し、ブラウザーはマイク音声を OpenAI に直接送信し、`openclaw_agent_consult` tool 呼び出しを `chat.send` 経由で、設定されたより大きな OpenClaw モデルへ中継します。
    - チャット内で tool 呼び出し + ライブ tool 出力カードをストリーミング（agent event）。

  </Accordion>
  <Accordion title="Channels、instance、session、Dreaming">
    - Channels: 組み込みおよびバンドル/外部 plugin channel の status、QR ログイン、channel ごとの config（`channels.status`, `web.login.*`, `config.patch`）。
    - Instances: presence 一覧 + refresh（`system-presence`）。
    - Sessions: 一覧 + session ごとの model/thinking/fast/verbose/trace/reasoning override（`sessions.list`, `sessions.patch`）。
    - Dreams: Dreaming status、有効/無効トグル、Dream Diary reader（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）。

  </Accordion>
  <Accordion title="Cron、Skills、node、exec 承認">
    - Cron jobs: 一覧/追加/編集/実行/有効化/無効化 + 実行履歴（`cron.*`）。
    - Skills: status、有効/無効、インストール、API key 更新（`skills.*`）。
    - Nodes: 一覧 + caps（`node.list`）。
    - Exec approvals: `exec host=gateway/node` 向けの gateway または node allowlist と ask policy の編集（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="Config">
    - `~/.openclaw/openclaw.json` の表示/編集（`config.get`, `config.set`）。
    - 検証付きの適用 + 再起動（`config.apply`）と最後にアクティブだった session の wake。
    - 書き込みには、同時編集の上書きを防ぐ base-hash guard が含まれます。
    - 書き込み（`config.set`/`config.apply`/`config.patch`）では、送信された config payload 内の ref に対して、アクティブな SecretRef 解決を事前チェックします。未解決のアクティブな送信済み ref は、書き込み前に拒否されます。
    - Schema + form レンダリング（`config.schema` / `config.schema.lookup`。フィールドの `title` / `description`、一致した UI hint、直下の子 summary、ネストした object/wildcard/array/composition node の docs メタデータ、利用可能な場合は plugin + channel schema を含む）。snapshot が安全に raw round-trip できる場合にのみ Raw JSON エディターが利用できます。
    - snapshot が安全に raw round-trip できない場合、Control UI は Form モードを強制し、その snapshot では Raw モードを無効化します。
    - Raw JSON エディターの「Reset to saved」は、平坦化された snapshot を再レンダリングするのではなく、raw で記述した形状（フォーマット、コメント、`$include` レイアウト）を保持するため、snapshot が安全に raw round-trip できる場合は外部編集が reset 後も保たれます。
    - 構造化された SecretRef object 値は、誤って object から string へ壊れるのを防ぐため、form の text input では読み取り専用として表示されます。

  </Accordion>
  <Accordion title="デバッグ、ログ、更新">
    - Debug: status/health/models snapshot + event log + 手動 RPC 呼び出し（`status`, `health`, `models.list`）。
    - Logs: filter/export 付きの gateway file log ライブ tail（`logs.tail`）。
    - Update: package/git update + 再起動（`update.run`）を restart report 付きで実行。

  </Accordion>
  <Accordion title="Cron jobs パネルの注意">
    - 分離 job では、delivery のデフォルトは summary の告知です。内部実行のみにしたい場合は none に切り替えられます。
    - announce が選択されている場合は channel/target フィールドが表示されます。
    - Webhook モードは `delivery.mode = "webhook"` を使い、`delivery.to` には有効な HTTP(S) webhook URL を設定します。
    - main-session job では、webhook と none の delivery mode が利用できます。
    - 高度な編集コントロールには、delete-after-run、agent override のクリア、Cron の exact/stagger オプション、agent model/thinking override、best-effort delivery トグルが含まれます。
    - Form の検証はフィールド単位のエラー付きでインライン表示されます。無効な値がある間は save ボタンが無効になります。
    - 専用の bearer token を送るには `cron.webhookToken` を設定してください。省略した場合、webhook は認証ヘッダーなしで送信されます。
    - 非推奨のフォールバック: `notify: true` を持つ保存済みの legacy job は、移行されるまで `cron.webhook` を引き続き使えます。

  </Accordion>
</AccordionGroup>

## チャットの動作

<AccordionGroup>
  <Accordion title="送信と履歴のセマンティクス">
    - `chat.send` は **non-blocking** です。すぐに `{ runId, status: "started" }` で ack し、応答は `chat` event 経由でストリームされます。
    - 同じ `idempotencyKey` で再送すると、実行中は `{ status: "in_flight" }` が返り、完了後は `{ status: "ok" }` が返ります。
    - `chat.history` のレスポンスは、UI の安全性のためサイズ制限があります。transcript エントリーが大きすぎる場合、Gateway は長い text フィールドを切り詰めたり、重い metadata ブロックを省略したり、サイズ超過のメッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えたりします。
    - assistant/generated 画像は管理された media reference として永続化され、認証付き Gateway media URL 経由で返されるため、再読み込み時に raw base64 の画像 payload が chat history レスポンスに残っている必要はありません。
    - `chat.history` は、表示専用のインライン directive tag（たとえば `[[reply_to_*]]` と `[[audio_as_voice]]`）、プレーンテキストの tool-call XML payload（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められた tool-call ブロックを含む）、漏れ出た ASCII/全角 model control token も可視 assistant text から取り除き、可視 text 全体が正確な silent token `NO_REPLY` / `no_reply` のみである assistant エントリーは省略します。
    - アクティブな send 中および最終履歴 refresh 中、`chat.history` が一時的に古い snapshot を返しても、chat view はローカルの楽観的 user/assistant メッセージを表示し続けます。Gateway history が追いつくと、正式な transcript がそれらのローカルメッセージを置き換えます。
    - `chat.inject` は session transcript に assistant note を追加し、UI 専用更新のために `chat` event をブロードキャストします（agent 実行なし、channel 配信なし）。
    - chat header の model と thinking picker は、`sessions.patch` を通じてアクティブな session を即座に patch します。これらは 1 ターン限定の送信オプションではなく、永続的な session override です。
    - 新しい Gateway session usage レポートが高いコンテキスト圧を示すと、chat composer エリアに context notice が表示され、推奨される Compaction レベルでは通常の session Compaction 経路を実行する compact ボタンが表示されます。古い token snapshot は、Gateway が再び新しい usage を報告するまで非表示になります。

  </Accordion>
  <Accordion title="Talk モード（ブラウザー WebRTC）">
    Talk モードは、ブラウザー WebRTC session をサポートする登録済み realtime voice プロバイダーを使います。`talk.provider: "openai"` と `talk.providers.openai.apiKey` を設定するか、Voice Call の realtime プロバイダー設定を再利用してください。ブラウザーは通常の OpenAI API key を受け取らず、短命な Realtime client secret だけを受け取ります。Google Live realtime voice は backend の Voice Call と Google Meet bridge ではサポートされますが、このブラウザー WebRTC 経路ではまだサポートされません。Realtime session prompt は Gateway によって組み立てられます。`talk.realtime.session` は呼び出し元提供の instruction override を受け付けません。

    Chat composer では、Talk コントロールはマイク音声入力ボタンの横にある waves ボタンです。Talk が開始すると、composer の status 行には `Connecting Talk...` が表示され、その後オーディオ接続中は `Talk live`、Realtime tool 呼び出しが `chat.send` を通じて設定済みのより大きな OpenClaw モデルに問い合わせている間は `Asking OpenClaw...` が表示されます。

  </Accordion>
  <Accordion title="停止と中断">
    - **Stop** をクリックします（`chat.abort` を呼び出します）。
    - 実行中の run がある間、通常の follow-up はキューに入ります。キュー済みメッセージの **Steer** をクリックすると、その follow-up を実行中ターンに注入できます。
    - `/stop` を入力します（または `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` のような単独の abort フレーズ）。
    - `chat.abort` は `{ sessionKey }`（`runId` なし）をサポートし、その session のすべてのアクティブな run を中断できます。

  </Accordion>
  <Accordion title="中断時の partial 保持">
    - run が中断されても、partial な assistant text は引き続き UI に表示されることがあります。
    - Gateway は、バッファされた出力がある場合、中断された partial assistant text を transcript history に永続化します。
    - 永続化されたエントリーには abort metadata が含まれるため、transcript の利用側は abort partial と通常の完了出力を区別できます。

  </Accordion>
</AccordionGroup>

## PWA インストールと Web Push

Control UI には `manifest.webmanifest` と service worker が含まれているため、最新のブラウザーでは独立した PWA としてインストールできます。Web Push により、タブやブラウザーウィンドウが開いていないときでも、Gateway は通知でインストール済み PWA を起動できます。

| 画面                                                  | 意味                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest。到達可能になると、ブラウザーは「アプリをインストール」を提示します。 |
| `ui/public/sw.js`                                     | `push` event と通知クリックを処理する service worker。             |
| `push/vapid-keys.json`（OpenClaw state dir 配下）     | Web Push payload の署名に使う自動生成された VAPID keypair。         |
| `push/web-push-subscriptions.json`                    | 永続化されたブラウザー subscription endpoint。                     |

キーを固定したい場合（マルチホスト構成、secret ローテーション、テストなど）は、Gateway process の環境変数で VAPID keypair を override します。

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（デフォルトは `mailto:openclaw@localhost`）

Control UI は、ブラウザー subscription の登録とテストのために、scope 制限された次の Gateway method を使います。

- `push.web.vapidPublicKey` — 現在の VAPID public key を取得します。
- `push.web.subscribe` — `endpoint` と `keys.p256dh`/`keys.auth` を登録します。
- `push.web.unsubscribe` — 登録済み endpoint を削除します。
- `push.web.test` — 呼び出し元の subscription にテスト通知を送信します。

<Note>
Web Push は iOS APNS relay 経路（relay ベース push については [Configuration](/ja-JP/gateway/configuration) を参照）や、ネイティブモバイルのペアリングを対象にする既存の `push.test` method とは独立しています。
</Note>

## Hosted embed

assistant メッセージでは、`[embed ...]` shortcode を使ってホストされた web コンテンツをインライン表示できます。iframe sandbox ポリシーは `gateway.controlUi.embedSandbox` で制御されます。

<Tabs>
  <Tab title="strict">
    hosted embed 内での script 実行を無効にします。
  </Tab>
  <Tab title="scripts (default)">
    origin 分離を保ちながらインタラクティブな embed を許可します。これがデフォルトであり、通常は自己完結したブラウザーゲームや widget にはこれで十分です。
  </Tab>
  <Tab title="trusted">
    意図的により強い権限を必要とする同一サイト document に対して、`allow-scripts` に加えて `allow-same-origin` を追加します。
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
埋め込み document が本当に same-origin 動作を必要とする場合にのみ `trusted` を使ってください。ほとんどの agent 生成ゲームやインタラクティブ canvas では、`scripts` の方が安全です。
</Warning>

絶対外部 `http(s)` embed URL はデフォルトで引き続きブロックされます。意図的に `[embed url="https://..."]` でサードパーティページを読み込みたい場合は、`gateway.controlUi.allowExternalEmbedUrls: true` を設定してください。

## Tailnet アクセス（推奨）

<Tabs>
  <Tab title="統合 Tailscale Serve（推奨）">
    Gateway は loopback のままにし、Tailscale Serve に HTTPS でプロキシさせます。

    ```bash
    openclaw gateway --tailscale serve
    ```

    次を開きます。

    - `https://<magicdns>/`（または設定した `gateway.controlUi.basePath`）

    デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket Serve リクエストは Tailscale identity header（`tailscale-user-login`）で認証できます。OpenClaw は、`x-forwarded-for` アドレスを `tailscale whois` で解決して header と照合することで identity を検証し、リクエストが Tailscale の `x-forwarded-*` header を伴って loopback に到達した場合にのみこれを受け入れます。ブラウザーデバイス identity を持つ Control UI オペレーターセッションでは、この検証済み Serve 経路によりデバイスペアリング往復も省略されます。デバイス identity を持たないブラウザーと node-role 接続では、通常どおりのデバイスチェックが適用されます。Serve トラフィックに対しても明示的な shared-secret 資格情報を必須にしたい場合は、`gateway.auth.allowTailscale: false` を設定してください。その場合は `gateway.auth.mode: "token"` または `"password"` を使います。

    この非同期 Serve identity 経路では、同じクライアント IP と auth scope に対する失敗した認証試行は、rate-limit 書き込み前に直列化されます。そのため、同じブラウザーから同時に誤った再試行があると、単なる 2 件の不一致が並列で競合する代わりに、2 件目のリクエストで `retry later` が表示されることがあります。

    <Warning>
    token なしの Serve 認証は gateway host が信頼できる前提です。その host 上で信頼できないローカルコードが実行される可能性がある場合は、token/password 認証を必須にしてください。
    </Warning>

  </Tab>
  <Tab title="tailnet に bind + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    その後、次を開きます。

    - `http://<tailscale-ip>:18789/`（または設定した `gateway.controlUi.basePath`）

    一致する shared secret を UI 設定に貼り付けます（`connect.params.auth.token` または `connect.params.auth.password` として送信されます）。

  </Tab>
</Tabs>

## 安全でない HTTP

ダッシュボードを平文 HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）で開くと、ブラウザーは **非セキュアコンテキスト** で動作し、WebCrypto をブロックします。デフォルトでは、OpenClaw はデバイス identity のない Control UI 接続を**ブロック**します。

文書化された例外:

- `gateway.controlUi.allowInsecureAuth=true` を使った localhost 限定の安全でない HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` を通じた Control UI オペレーター認証の成功
- 緊急用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS（Tailscale Serve）を使うか、UI をローカルで開いてください。

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（gateway host 上）

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

    `allowInsecureAuth` はローカル互換性用のトグルにすぎません。

    - これにより、非セキュア HTTP コンテキストでも localhost の Control UI セッションはデバイス identity なしで進行できます。
    - ただし、ペアリングチェックは回避しません。
    - リモート（非 localhost）のデバイス identity 要件は緩和しません。

  </Accordion>
  <Accordion title="緊急用のみ">
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
    `dangerouslyDisableDeviceAuth` は Control UI のデバイス identity チェックを無効化するため、重大なセキュリティ低下です。緊急利用後はすぐに元に戻してください。
    </Warning>

  </Accordion>
  <Accordion title="trusted-proxy に関する注意">
    - trusted-proxy 認証に成功すると、デバイス identity がなくても **operator** の Control UI セッションは許可されることがあります。
    - これは node-role の Control UI セッションには**適用されません**。
    - 同一 host 上の loopback reverse proxy でも trusted-proxy 認証の条件は満たしません。詳細は [Trusted proxy auth](/ja-JP/gateway/trusted-proxy-auth) を参照してください。

  </Accordion>
</AccordionGroup>

HTTPS セットアップガイダンスについては [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## Content Security Policy

Control UI には厳格な `img-src` ポリシーがあります。許可されるのは **同一 origin** のアセット、`data:` URL、ローカル生成の `blob:` URL だけです。リモートの `http(s)` および protocol-relative 画像 URL はブラウザーによって拒否され、ネットワーク fetch も発生しません。

実際には次の意味になります。

- 相対パス配下で配信される avatar と画像（たとえば `/avatars/<id>`）は引き続き表示されます。これには、UI が取得してローカル `blob:` URL に変換する認証付き avatar route も含まれます。
- インラインの `data:image/...` URL は引き続き表示されます（プロトコル内 payload に便利です）。
- Control UI が作成したローカル `blob:` URL は引き続き表示されます。
- channel metadata が出力したリモート avatar URL は、Control UI の avatar helper によって取り除かれ、組み込みの logo/badge に置き換えられます。これにより、侵害されたまたは悪意ある channel が operator のブラウザーから任意のリモート画像 fetch を強制することはできません。

この動作を得るために変更する必要はありません。常に有効で、設定不可です。

## Avatar route 認証

gateway auth が設定されている場合、Control UI の avatar endpoint は他の API と同じ gateway token を必要とします。

- `GET /avatar/<agentId>` は、認証された呼び出し元にのみ avatar 画像を返します。`GET /avatar/<agentId>?meta=1` は、同じルールで avatar metadata を返します。
- どちらの route に対する未認証リクエストも拒否されます（隣接する assistant-media route と同じ動作）。これにより、他が保護されている host で avatar route から agent identity が漏れるのを防ぎます。
- Control UI 自体は、avatar 取得時に gateway token を bearer header として転送し、認証済み blob URL を使うため、画像はダッシュボードでも正しく表示されます。

gateway auth を無効化した場合（共有 host では非推奨）、avatar route も gateway の他の部分と同様に未認証になります。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを配信します。次でビルドします。

```bash
pnpm ui:build
```

任意の絶対 base（固定アセット URL を使いたい場合）:

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

ローカル開発用（別の dev server）:

```bash
pnpm ui:dev
```

その後、UI を Gateway WS URL（例: `ws://127.0.0.1:18789`）に向けてください。

## デバッグ/テスト: dev server + リモート Gateway

Control UI は静的ファイルであり、WebSocket target は設定可能で、HTTP origin と異なっていても構いません。これは、Vite dev server はローカルで動かしつつ、Gateway は別の場所で動いている場合に便利です。

<Steps>
  <Step title="UI dev server を起動する">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="gatewayUrl 付きで開く">
    ```text
    http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
    ```

    任意の 1 回限り認証（必要な場合）:

    ```text
    http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="注意">
    - `gatewayUrl` はロード後に localStorage に保存され、URL から削除されます。
    - `token` は可能な限り URL fragment（`#token=...`）で渡してください。fragment はサーバーに送信されないため、リクエストログや Referer への漏えいを避けられます。従来の `?token=` クエリパラメーターも互換性のために 1 回だけ取り込まれますが、フォールバックとしてのみ使われ、bootstrap 後すぐに削除されます。
    - `password` はメモリー内にのみ保持されます。
    - `gatewayUrl` が設定されている場合、UI は config や環境の資格情報へフォールバックしません。`token`（または `password`）を明示的に指定してください。明示的な資格情報がない場合はエラーです。
    - Gateway が TLS（Tailscale Serve、HTTPS proxy など）の背後にある場合は `wss://` を使ってください。
    - `gatewayUrl` はクリックジャッキングを防ぐため、トップレベルウィンドウでのみ受け付けられます（embed 内では不可）。
    - loopback 以外の Control UI 配置では、`gateway.controlUi.allowedOrigins` を明示的に設定する必要があります（完全な origin）。これにはリモート dev 構成も含まれます。
    - Gateway 起動時には、有効なランタイム bind と port から `http://localhost:<port>` や `http://127.0.0.1:<port>` のようなローカル origin が自動投入されることがありますが、リモートブラウザー origin には引き続き明示的なエントリーが必要です。
    - `gateway.controlUi.allowedOrigins: ["*"]` は、厳しく制御されたローカルテスト以外では使わないでください。これは「現在使っている host に一致する」ではなく、「あらゆるブラウザー origin を許可する」を意味します。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は Host-header origin フォールバックモードを有効にしますが、危険なセキュリティモードです。

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

リモートアクセスのセットアップ詳細: [Remote access](/ja-JP/gateway/remote)

## 関連

- [Dashboard](/ja-JP/web/dashboard) — Gateway ダッシュボード
- [Health Checks](/ja-JP/gateway/health) — Gateway のヘルス監視
- [TUI](/ja-JP/web/tui) — ターミナルユーザーインターフェース
- [WebChat](/ja-JP/web/webchat) — ブラウザーベースのチャットインターフェース
