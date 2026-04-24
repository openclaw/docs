---
read_when:
    - agent制御のbrowser自動化を追加する
    - openclawが自分のChromeに干渉している理由をデバッグする
    - macOSアプリでbrowser設定とライフサイクルを実装する
summary: 統合browser制御サービスとアクションコマンド
title: Browser（OpenClaw管理）
x-i18n:
    generated_at: "2026-04-24T05:24:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fb0fc0b6235fa8a0324b754e247e015d5ca19d114d324d565ed4a19f9313f7e
    source_path: tools/browser.md
    workflow: 15
---

OpenClawは、agentが制御する**専用のChrome/Brave/Edge/Chromium profile**を実行できます。
これは個人用browserから分離されており、Gateway内の小さなローカル
制御サービス（loopbackのみ）を通じて管理されます。

初心者向けの見方:

- これは**agent専用の別browser**だと考えてください。
- `openclaw` profileは、あなたの個人browser profileには**触れません**。
- agentは安全なレーンで**タブを開き、ページを読み、クリックし、入力**できます。
- 組み込みの `user` profileは、Chrome MCP経由で実際のサインイン済みChromeセッションに接続します。

## できること

- **openclaw** という名前の別browser profile（デフォルトではオレンジ系アクセント）。
- 決定的なタブ制御（list/open/focus/close）。
- agentアクション（click/type/drag/select）、snapshot、screenshot、PDF。
- 任意のマルチprofile対応（`openclaw`、`work`、`remote`、...）。

このbrowserは**日常使いのbrowserではありません**。これは
agentの自動化と検証のための、安全で分離されたサーフェスです。

## クイックスタート

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

「Browser disabled」と表示されたら、configで有効化し（下記参照）、その後
Gatewayを再起動してください。

`openclaw browser` 自体が存在しない場合、またはagentがbrowser tool
を利用不可と言う場合は、[Missing browser command or tool](/ja-JP/tools/browser#missing-browser-command-or-tool) に進んでください。

## Plugin制御

デフォルトの `browser` toolはバンドル済みpluginです。同じ `browser` tool名を登録する別pluginに置き換えるには、これを無効化します:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

デフォルトには `plugins.entries.browser.enabled` **と** `browser.enabled=true` の両方が必要です。pluginだけを無効化すると、`openclaw browser` CLI、`browser.request` gateway method、agent tool、control service がまとめて取り除かれます。一方で `browser.*` config は置き換え用にそのまま残ります。

Browser configの変更は、pluginがserviceを再登録できるようにGateway再起動が必要です。

## browserコマンドまたはtoolが見つからない

アップグレード後に `openclaw browser` が不明な場合、`browser.request` が存在しない場合、またはagentがbrowser toolを利用不可と報告する場合、通常の原因は `browser` を含まない `plugins.allow` リストです。追加してください:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`、`plugins.entries.browser.enabled=true`、および `tools.alsoAllow: ["browser"]` はallowlist参加の代わりにはなりません — allowlistはplugin読み込みを制御し、tool policyは読み込み後にしか実行されません。`plugins.allow` 自体を完全に削除してもデフォルトに戻ります。

## Profile: `openclaw` と `user`

- `openclaw`: 管理された分離browser（拡張不要）。
- `user`: あなたの**実際のサインイン済みChrome**
  セッション用の組み込みChrome MCP接続profile。

agent browser tool callでは:

- デフォルト: 分離された `openclaw` browserを使う。
- 既存のログイン済みセッションが重要で、ユーザーが
  コンピュータの前にいて接続promptをクリック/承認できる場合は `profile="user"` を優先する。
- `profile` は、特定のbrowser modeを使いたいときの明示的overrideです。

デフォルトで管理モードにしたい場合は `browser.defaultProfile: "openclaw"` を設定してください。

## 設定

Browser設定は `~/.openclaw/openclaw.json` にあります。

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

<AccordionGroup>

<Accordion title="ポートと到達可能性">

- Control serviceは `gateway.port` から導出されたポートのloopbackにbindします（デフォルト `18791` = gateway + 2）。`gateway.port` または `OPENCLAW_GATEWAY_PORT` を上書きすると、導出ポートも同じ系列でずれます。
- ローカル `openclaw` profileは `cdpPort` / `cdpUrl` を自動割り当てします。これらを設定するのはremote CDPに対してのみです。`cdpUrl` は未設定時、管理されたローカルCDPポートがデフォルトになります。
- `remoteCdpTimeoutMs` はremote（non-loopback）CDP HTTP到達性チェックに適用され、`remoteCdpHandshakeTimeoutMs` はremote CDP WebSocket handshakeに適用されます。

</Accordion>

<Accordion title="SSRFポリシー">

- Browserのnavigationとopen-tabは、navigation前にSSRFガードされ、さらに最終 `http(s)` URLに対してベストエフォートで再チェックされます。
- strict SSRFモードでは、remote CDP endpoint discoveryと `/json/version` probe（`cdpUrl`）もチェックされます。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` はデフォルトでオフです。private-network browser accessを意図的に信頼する場合にのみ有効化してください。
- `browser.ssrfPolicy.allowPrivateNetwork` はlegacy aliasとして引き続きサポートされます。

</Accordion>

<Accordion title="Profileの動作">

- `attachOnly: true` は、ローカルbrowserを決して起動せず、すでに実行中の場合にのみ接続することを意味します。
- `color`（トップレベルおよびprofileごと）はbrowser UIを色付けし、どのprofileがアクティブか見分けられるようにします。
- デフォルトprofileは `openclaw`（管理された単独profile）です。サインイン済みuser browserを使いたい場合は `defaultProfile: "user"` を使ってください。
- 自動検出順: Chromium系ならシステムデフォルトbrowser、それ以外は Chrome → Brave → Edge → Chromium → Chrome Canary。
- `driver: "existing-session"` はraw CDPではなくChrome DevTools MCPを使います。そのdriverには `cdpUrl` を設定しないでください。
- existing-session profileを非デフォルトのChromium user profile（Brave、Edgeなど）に接続させる場合は `browser.profiles.<name>.userDataDir` を設定してください。

</Accordion>

</AccordionGroup>

## Brave（または他のChromium系browser）を使う

**システムデフォルト**browserがChromium系（Chrome/Brave/Edgeなど）の場合、
OpenClawは自動的にそれを使います。自動検出を上書きするには `browser.executablePath` を設定してください:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

または、platformごとにconfigで設定します:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

## ローカル制御とリモート制御

- **ローカル制御（デフォルト）:** Gatewayがloopback control serviceを起動し、ローカルbrowserを起動できます。
- **リモート制御（node host）:** browserを持つマシン上でnode hostを実行すると、Gatewayはbrowserアクションをそこへproxyします。
- **Remote CDP:** `browser.profiles.<name>.cdpUrl`（または `browser.cdpUrl`）を設定して、
  remoteのChromium系browserに接続します。この場合、OpenClawはローカルbrowserを起動しません。

停止動作はprofile modeによって異なります:

- ローカル管理profile: `openclaw browser stop` は
  OpenClawが起動したbrowser processを停止します
- attach-onlyおよびremote CDP profile: `openclaw browser stop` はアクティブな
  control sessionを閉じ、Playwright/CDPのemulation override（viewport、
  color scheme、locale、timezone、offline mode、および類似状態）を解放します。
  OpenClawがbrowser processを起動していない場合でも同様です

Remote CDP URLにはauthを含められます:

- Query token（例: `https://provider.example?token=<token>`）
- HTTP Basic auth（例: `https://user:pass@provider.example`）

OpenClawは `/json/*` endpoint呼び出し時と
CDP WebSocket接続時の両方でauthを保持します。
tokenはconfig fileにcommitする代わりに、環境変数またはsecrets managerを使うことを推奨します。

## Node browser proxy（デフォルトでゼロ設定）

browserを持つマシン上で **node host** を実行している場合、OpenClawは
追加のbrowser設定なしでbrowser tool callをそのnodeへ自動ルーティングできます。
これはremote gatewayのデフォルト経路です。

注記:

- node hostは、自身のローカルbrowser control serverを**proxy command**として公開します。
- Profileはnode自身の `browser.profiles` configから来ます（ローカルと同じ）。
- `nodeHost.browserProxy.allowProfiles` は任意です。legacy/default動作のままにするには空のままにしてください: 設定済みのすべてのprofileが、profile create/delete routeを含めてproxy経由で到達可能なままになります。
- `nodeHost.browserProxy.allowProfiles` を設定すると、OpenClawはそれを最小権限境界として扱います: allowlistにあるprofileだけを対象にでき、永続profileのcreate/delete routeはproxyサーフェスでブロックされます。
- 不要なら無効化できます:
  - node側: `nodeHost.browserProxy.enabled=false`
  - gateway側: `gateway.nodes.browser.mode="off"`

## Browserless（ホスト型remote CDP）

[Browserless](https://browserless.io) は、
HTTPSとWebSocketでCDP接続URLを公開するホスト型Chromiumサービスです。OpenClawはどちらの形式も使えますが、
remote browser profileでは、最も簡単な選択肢はBrowserlessの接続ドキュメントにある直接WebSocket URLです。

例:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

注記:

- `<BROWSERLESS_API_KEY>` は実際のBrowserless tokenに置き換えてください。
- Browserlessアカウントに対応するリージョンendpointを選んでください（詳細はそのドキュメントを参照）。
- BrowserlessがHTTPS base URLを提供する場合は、
  直接CDP接続用に `wss://` に変換するか、HTTPS URLのままにしてOpenClawに
  `/json/version` を検出させることができます。

## 直接WebSocket CDP provider

一部のホスト型browserサービスは、標準的なHTTPベースCDP discovery（`/json/version`）ではなく
**直接WebSocket** endpointを公開しています。OpenClawは3種類の
CDP URL形式を受け付け、適切な接続戦略を自動選択します:

- **HTTP(S) discovery** — `http://host[:port]` または `https://host[:port]`。
  OpenClawは `/json/version` を呼び出してWebSocket debugger URLを検出し、その後
  接続します。WebSocket fallbackはありません。
- **直接WebSocket endpoint** — `ws://host[:port]/devtools/<kind>/<id>` または
  `wss://...` で、`/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  pathを持つもの。OpenClawは直接WebSocket handshakeで接続し、
  `/json/version` は完全にスキップします。
- **素のWebSocket root** — `ws://host[:port]` または `wss://host[:port]` で、
  `/devtools/...` pathを持たないもの（例: [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)）。OpenClawはまずHTTP
  `/json/version` discoveryを試み（schemeを `http` / `https` に正規化）、
  discoveryが `webSocketDebuggerUrl` を返した場合はそれを使い、そうでない場合はOpenClawが
  素のrootに対する直接WebSocket handshakeへfallbackします。これにより、
  ローカルChromeを指す素の `ws://` でも接続できます。Chromeは
  `/json/version` から得られる特定のtargetごとのpathでのみWebSocket upgradeを
  受け付けるためです。

### Browserbase

[Browserbase](https://www.browserbase.com) は、組み込みのCAPTCHA解決、stealth mode、residential
proxyを備えた、headless browser実行用のクラウドプラットフォームです。

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

注記:

- [Sign up](https://www.browserbase.com/sign-up) して、[Overview dashboard](https://www.browserbase.com/overview) から **API Key**
  をコピーしてください。
- `<BROWSERBASE_API_KEY>` を実際のBrowserbase API keyに置き換えてください。
- BrowserbaseはWebSocket接続時にbrowser sessionを自動作成するため、
  手動のsession作成ステップは不要です。
- 無料tierでは、同時session 1つと月あたりbrowser 1時間まで利用できます。
  有料プランの制限は [pricing](https://www.browserbase.com/pricing) を参照してください。
- 完全なAPI
  リファレンス、SDKガイド、統合例については [Browserbase docs](https://docs.browserbase.com) を参照してください。

## セキュリティ

重要な考え方:

- Browser制御はloopback専用であり、アクセスはGatewayのauthまたはnode pairingを通ります。
- スタンドアロンのloopback browser HTTP APIは **shared-secret authのみ** を使います:
  gateway token bearer auth、`x-openclaw-password`、または
  設定済みgateway passwordによるHTTP Basic authです。
- Tailscale Serve identity headerと `gateway.auth.mode: "trusted-proxy"` は、
  このスタンドアロンloopback browser APIを認証しません。
- browser制御が有効で、shared-secret authが未設定の場合、OpenClawは
  起動時に `gateway.auth.token` を自動生成し、configに永続化します。
- `gateway.auth.mode` がすでに
  `password`、`none`、または `trusted-proxy` の場合、OpenClawはそのtokenを自動生成しません。
- Gatewayとすべてのnode hostはprivate network（Tailscale）上に保ち、public公開は避けてください。
- remote CDP URL/tokenはシークレットとして扱い、env varまたはsecrets managerを優先してください。

Remote CDPのヒント:

- 可能な限り暗号化されたendpoint（HTTPSまたはWSS）と短命tokenを使ってください。
- 長寿命tokenをconfig fileへ直接埋め込むのは避けてください。

## Profile（マルチbrowser）

OpenClawは複数の名前付きprofile（ルーティング設定）をサポートします。Profileには次の種類があります:

- **openclaw-managed**: 専用user data directory + CDP portを持つ、専用のChromium系browserインスタンス
- **remote**: 明示的なCDP URL（別の場所で実行中のChromium系browser）
- **existing session**: Chrome DevTools MCP auto-connect経由の既存Chrome profile

デフォルト:

- `openclaw` profileは、存在しない場合に自動作成されます。
- `user` profileは、Chrome MCP existing-session attach用の組み込みprofileです。
- existing-session profileは `user` 以外ではopt-inです。`--driver existing-session` で作成してください。
- ローカルCDP portはデフォルトで **18800–18899** から割り当てられます。
- profileを削除すると、そのローカルdata directoryはTrashへ移動されます。

すべてのcontrol endpointは `?profile=<name>` を受け付けます。CLIでは `--browser-profile` を使います。

## Chrome DevTools MCP経由のexisting-session

OpenClawは、公式Chrome DevTools MCPサーバーを通じて、実行中のChromium系browser profileにも接続できます。これにより、そのbrowser profileで
すでに開いているタブとログイン状態を再利用できます。

公式の背景説明とセットアップ参考資料:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

組み込みprofile:

- `user`

任意: 別の名前、色、browser data directoryを使いたい場合は、
独自のcustom existing-session profileを作成できます。

デフォルト動作:

- 組み込みの `user` profileはChrome MCP auto-connectを使い、
  デフォルトのローカルGoogle Chrome profileを対象にします。

Brave、Edge、Chromium、または非デフォルトのChrome profileには `userDataDir` を使ってください:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

その後、対応するbrowserで次を行います:

1. そのbrowserのremote debugging用inspect pageを開く。
2. remote debuggingを有効にする。
3. browserを実行したままにし、OpenClaw接続時のconnection promptを承認する。

一般的なinspect page:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

ライブattach smoke test:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

成功時の見え方:

- `status` に `driver: existing-session` が表示される
- `status` に `transport: chrome-mcp` が表示される
- `status` に `running: true` が表示される
- `tabs` に、すでに開いているbrowserタブが一覧表示される
- `snapshot` が、選択されたライブタブからrefを返す

attachが動作しない場合の確認事項:

- 対象のChromium系browserが version `144+` である
- そのbrowserのinspect pageでremote debuggingが有効になっている
- browserがattach consent promptを表示し、それを承認した
- `openclaw doctor` は古い拡張ベースbrowser configを移行し、
  デフォルトauto-connect profile向けにChromeがローカルにインストールされていることを確認しますが、
  browser側のremote debuggingを代わりに有効にはできません

agentでの使用:

- ユーザーのログイン済みbrowser状態が必要な場合は `profile="user"` を使います。
- custom existing-session profileを使う場合は、その明示的profile名を渡します。
- このmodeを選ぶのは、ユーザーがコンピュータの前にいてattach
  promptを承認できる場合だけにしてください。
- Gatewayまたはnode hostは `npx chrome-devtools-mcp@latest --autoConnect` を起動できます

注記:

- この経路は、サインイン済みbrowser session内で動作できるため、分離された `openclaw` profileより高リスクです。
- OpenClawはこのdriver用にbrowserを起動しません。接続するだけです。
- OpenClawはここで公式のChrome DevTools MCP `--autoConnect` フローを使います。`userDataDir` が設定されている場合、
  そのuser data directoryを対象にするために渡されます。
- Existing-sessionは、選択したhost上でも、接続された
  browser node経由でもattachできます。Chromeが別の場所にありbrowser nodeが未接続の場合は、
  代わりにremote CDPまたはnode hostを使ってください。

<Accordion title="Existing-sessionの機能制限">

管理された `openclaw` profileと比べると、existing-session driverには制約が多くあります:

- **スクリーンショット** — ページキャプチャと `--ref` 要素キャプチャは動作しますが、CSS `--element` selectorは使えません。`--full-page` は `--ref` または `--element` と組み合わせられません。ページまたはrefベース要素のスクリーンショットにPlaywrightは不要です。
- **アクション** — `click`、`type`、`hover`、`scrollIntoView`、`drag`、`select` にはsnapshot refが必要です（CSS selector不可）。`click` は左ボタンのみです。`type` は `slowly=true` をサポートしません。`fill` または `press` を使ってください。`press` は `delayMs` をサポートしません。`hover`、`scrollIntoView`、`drag`、`select`、`fill`、`evaluate` は呼び出しごとのtimeoutをサポートしません。`select` は単一値を受け付けます。
- **Wait / upload / dialog** — `wait --url` は完全一致、部分一致、glob patternをサポートします。`wait --load networkidle` はサポートされません。upload hookには `ref` または `inputRef` が必要で、1回に1ファイル、CSS `element` は不可です。dialog hookはtimeout overrideをサポートしません。
- **managed専用機能** — batch actions、PDF export、download interception、`responsebody` は引き続きmanaged browser経路が必要です。

</Accordion>

## 分離の保証

- **専用user data dir**: 個人browser profileには決して触れません。
- **専用port**: 開発ワークフローとの衝突を防ぐため `9222` を避けます。
- **決定的なタブ制御**: 「最後のタブ」ではなく `targetId` で対象指定します。

## Browser選択

ローカル起動時、OpenClawは利用可能なもののうち最初のものを選びます:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath` で上書きできます。

platformごとの挙動:

- macOS: `/Applications` と `~/Applications` を確認します。
- Linux: `google-chrome`、`brave`、`microsoft-edge`、`chromium` などを探します。
- Windows: 一般的なインストール場所を確認します。

## Control API（任意）

スクリプトとデバッグ用に、Gatewayは小さな **loopback専用HTTP
control API** と、それに対応する `openclaw browser` CLI（snapshot、ref、wait
強化機能、JSON出力、デバッグワークフロー）を公開します。完全なリファレンスは
[Browser control API](/ja-JP/tools/browser-control) を参照してください。

## トラブルシューティング

Linux固有の問題（特にsnap Chromium）については
[Browser troubleshooting](/ja-JP/tools/browser-linux-troubleshooting) を参照してください。

WSL2 Gateway + Windows Chrome の分離ホスト構成については
[WSL2 + Windows + remote Chrome CDP troubleshooting](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting) を参照してください。

### CDP起動失敗とnavigation SSRF blockの違い

これらは別種の失敗であり、異なるコード経路を示します。

- **CDP起動またはready状態確認の失敗** は、OpenClawがbrowser control planeが健全であることを確認できないことを意味します。
- **Navigation SSRF block** は、browser control plane自体は健全だが、ページnavigation先がポリシーにより拒否されたことを意味します。

一般的な例:

- CDP起動またはready状態確認の失敗:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Navigation SSRF block:
  - `start` と `tabs` は動作する一方で、`open`、`navigate`、snapshot、またはtab-openingフローがbrowser/network policy errorで失敗する

次の最小シーケンスで両者を切り分けられます:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

結果の読み方:

- `start` が `not reachable after start` で失敗する場合は、まずCDP ready状態を調査してください。
- `start` は成功するが `tabs` が失敗する場合、control planeはまだ不健全です。これはページnavigation問題ではなく、CDP到達性問題として扱ってください。
- `start` と `tabs` は成功するが `open` または `navigate` が失敗する場合、browser control planeは起動しており、失敗箇所はnavigation policyまたは対象ページにあります。
- `start`、`tabs`、`open` がすべて成功する場合、基本的なmanaged-browser control経路は健全です。

重要な動作詳細:

- Browser configは、`browser.ssrfPolicy` を設定していなくても、fail-closedなSSRF policy objectをデフォルトにします。
- ローカルのlocal loopback `openclaw` managed profileでは、CDP健全性チェックは、OpenClaw自身のローカルcontrol planeに対するbrowser SSRF到達性制限を意図的にスキップします。
- navigation保護は別です。`start` または `tabs` の成功は、その後の `open` または `navigate` 対象が許可されることを意味しません。

セキュリティガイダンス:

- デフォルトでbrowser SSRF policyを緩めないでください。
- 広いprivate-network accessより、`hostnameAllowlist` や `allowedHostnames` のような狭いhost例外を優先してください。
- `dangerouslyAllowPrivateNetwork: true` を使うのは、private-network browser accessが必要でレビュー済みの、意図的に信頼された環境だけにしてください。

## Agent tool とcontrolの仕組み

agentが使えるbrowser自動化toolは **1つ** です:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

対応関係:

- `browser snapshot` は安定したUI tree（AIまたはARIA）を返します。
- `browser act` はsnapshotの `ref` IDを使ってclick/type/drag/selectします。
- `browser screenshot` はピクセルをキャプチャします（ページ全体または要素）。
- `browser` は次を受け付けます:
  - `profile` で名前付きbrowser profile（openclaw、chrome、またはremote CDP）を選ぶ。
  - `target`（`sandbox` | `host` | `node`）でbrowserの存在場所を選ぶ。
  - sandbox化セッションでは、`target: "host"` に `agents.defaults.sandbox.browser.allowHostControl=true` が必要。
  - `target` を省略した場合: sandbox化セッションはデフォルトで `sandbox`、非sandboxセッションはデフォルトで `host`。
  - browser対応nodeが接続されている場合、`target="host"` または `target="node"` を固定しない限り、toolは自動的にそこへルーティングされる場合があります。

これにより、agentの動作を決定的に保ち、壊れやすいselectorを避けられます。

## 関連

- [Tools Overview](/ja-JP/tools) — 利用可能なすべてのagent tool
- [Sandboxing](/ja-JP/gateway/sandboxing) — sandbox化環境でのbrowser制御
- [Security](/ja-JP/gateway/security) — browser制御のリスクとhardening
