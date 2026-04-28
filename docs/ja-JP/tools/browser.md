---
read_when:
    - agent 制御のブラウザー自動化を追加する場合
    - openclaw が自分の Chrome に干渉している理由をデバッグする場合
    - macOS app でブラウザー設定とライフサイクルを実装する場合
summary: 統合ブラウザー制御サービス + アクションコマンド
title: Browser（OpenClaw 管理）
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:41:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: aba4c06f351296145b7a282bb692c2d10dba0668f90aabf1d981fb18199c3d74
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw は、agent が制御する**専用の Chrome/Brave/Edge/Chromium プロファイル**を実行できます。
これは個人用ブラウザーから分離されており、Gateway 内の小さなローカル
制御サービス（loopback のみ）を通じて管理されます。

初心者向けの見方:

- これは**agent 専用の別ブラウザー**だと考えてください。
- `openclaw` プロファイルは**個人用ブラウザープロファイルには触れません**。
- agent は安全なレーンで**タブを開き、ページを読み、クリックし、入力**できます。
- 組み込みの `user` プロファイルは、Chrome MCP を通じて実際にサインイン済みの Chrome セッションに接続します。

## 利用できるもの

- **openclaw** という名前の独立したブラウザープロファイル（デフォルトではオレンジのアクセント）。
- 決定的なタブ制御（一覧表示/開く/フォーカス/閉じる）。
- agent アクション（クリック/入力/ドラッグ/選択）、snapshot、スクリーンショット、PDF。
- browser plugin が有効なとき、snapshot、
  stable-tab、stale-ref、manual-blocker 回復ループを agent に教える、バンドル済みの `browser-automation` Skills。
- 任意のマルチプロファイルサポート（`openclaw`、`work`、`remote`、...）。

このブラウザーは**日常用ブラウザーではありません**。これは
agent の自動化と検証のための、安全で分離された画面です。

## クイックスタート

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

「Browser disabled」と表示される場合は、config で有効化し（下記参照）、Gateway を再起動してください。

`openclaw browser` 自体が存在しない場合、または agent が browser tool は利用できないと言う場合は、[Missing browser command or tool](/ja-JP/tools/browser#missing-browser-command-or-tool) に進んでください。

## Plugin 制御

デフォルトの `browser` tool はバンドルされた plugin です。同じ `browser` tool 名を登録する別の plugin に置き換えるには、これを無効化してください。

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

デフォルト設定では、`plugins.entries.browser.enabled` **と** `browser.enabled=true` の両方が必要です。plugin だけを無効化すると、`openclaw browser` CLI、`browser.request` Gateway method、agent tool、制御サービスが 1 単位で削除されます。`browser.*` config は置き換え先のためにそのまま保持されます。

Browser config の変更では、plugin がサービスを再登録できるように Gateway の再起動が必要です。

## Agent ガイダンス

tool-profile に関する注意: `tools.profile: "coding"` には `web_search` と
`web_fetch` は含まれますが、完全な `browser` tool は含まれません。agent または
起動された sub-agent がブラウザー自動化を使う必要がある場合は、profile 段階で browser を追加してください。

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

単一の agent には `agents.list[].tools.alsoAllow: ["browser"]` を使ってください。
`tools.subagents.tools.allow: ["browser"]` だけでは不十分です。sub-agent の
ポリシーは profile フィルタリング後に適用されるためです。

browser plugin には 2 段階の agent ガイダンスがあります。

- `browser` tool の説明には、常時適用されるコンパクトな契約が含まれます。適切な
  profile を選ぶこと、同じタブ内で ref を維持すること、タブ対象指定には `tabId`/label を使うこと、複数ステップの作業では browser skill を読み込むことです。
- バンドルされた `browser-automation` skill には、より長い運用ループが含まれます。最初に status/tabs を確認すること、作業タブに label を付けること、操作前に snapshot を取ること、UI 変更後に再 snapshot すること、stale ref は 1 回回復すること、login/2FA/captcha または
  camera/microphone blocker は推測せず手動アクションとして報告することです。

plugin にバンドルされた Skills は、plugin が有効なとき agent の利用可能な Skills 一覧に表示されます。完全な skill 指示は必要時にのみ読み込まれるため、通常ターンでは完全なトークンコストはかかりません。

## Browser コマンドまたは tool が見つからない

アップグレード後に `openclaw browser` が不明、`browser.request` が存在しない、または agent が browser tool は利用できないと報告する場合、通常の原因は `browser` を含まない `plugins.allow` リストです。これを追加してください。

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`、`plugins.entries.browser.enabled=true`、`tools.alsoAllow: ["browser"]` は allowlist への登録の代わりにはなりません。allowlist は plugin のロードを制御し、tool ポリシーはロード後にしか実行されないためです。`plugins.allow` を完全に削除してもデフォルトに戻せます。

## Profiles: `openclaw` vs `user`

- `openclaw`: 管理された分離ブラウザー（拡張不要）。
- `user`: 実際に**サインイン済みの Chrome**
  セッション向けの組み込み Chrome MCP 接続 profile。

agent の browser tool 呼び出しでは:

- デフォルト: 分離された `openclaw` browser を使います。
- 既存のログイン済みセッションが重要で、ユーザーが
  コンピューターの前にいて接続プロンプトをクリック/承認できる場合は、`profile="user"` を優先します。
- 特定のブラウザーモードを使いたい場合、`profile` が明示的な override です。

デフォルトで managed モードにしたい場合は、`browser.defaultProfile: "openclaw"` を設定してください。

## 設定

Browser 設定は `~/.openclaw/openclaw.json` にあります。

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 信頼されたプライベートネットワークアクセスにのみ opt in
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // 無効化するには 0 を設定
      maxTabsPerSession: 8, // セッションごとの上限を無効化するには 0 を設定
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
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

<Accordion title="ポートと到達性">

- 制御サービスは、`gateway.port` から導出されるポートの loopback にバインドします（デフォルト `18791` = gateway + 2）。`gateway.port` または `OPENCLAW_GATEWAY_PORT` を override すると、同じ系統の導出ポートも一緒に変わります。
- ローカルの `openclaw` profile では `cdpPort`/`cdpUrl` が自動割り当てされます。これらは remote CDP に対してのみ設定してください。`cdpUrl` は未設定時、管理されたローカル CDP ポートにデフォルト設定されます。
- `remoteCdpTimeoutMs` は、remote および `attachOnly` の CDP HTTP 到達性確認とタブオープン HTTP リクエストに適用されます。`remoteCdpHandshakeTimeoutMs` は、それらの CDP WebSocket handshake に適用されます。
- `localLaunchTimeoutMs` は、ローカル起動された managed Chrome
  process が CDP HTTP endpoint を公開するまでの予算です。`localCdpReadyTimeoutMs` は、
  process 検出後の CDP websocket 準備完了までの追加予算です。
  Chromium の起動が遅い Raspberry Pi、低性能 VPS、古いハードウェアではこれらを引き上げてください。値は `120000` ms 以下の正の整数である必要があります。無効な
  config 値は拒否されます。
- `actionTimeoutMs` は、呼び出し元が `timeoutMs` を渡さない場合の browser `act` リクエストのデフォルト予算です。クライアント transport は少し余裕を追加するため、長時間待機が HTTP 境界でタイムアウトするのではなく完了できます。
- `tabCleanup` は、primary-agent browser セッションが開いたタブに対するベストエフォートのクリーンアップです。Subagent、Cron、ACP のライフサイクルクリーンアップは、セッション終了時に明示的に追跡しているタブを引き続き閉じます。primary セッションではアクティブなタブを再利用可能なままにし、その後アイドルまたは過剰な追跡タブをバックグラウンドで閉じます。

</Accordion>

<Accordion title="SSRF ポリシー">

- Browser navigation と open-tab は、ナビゲーション前に SSRF ガードされ、終了後の最終 `http(s)` URL に対してもベストエフォートで再確認されます。
- strict SSRF モードでは、remote CDP endpoint の検出と `/json/version` probe (`cdpUrl`) もチェックされます。
- Gateway/provider の `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、`NO_PROXY` 環境変数は、OpenClaw 管理 browser を自動ではプロキシしません。managed Chrome はデフォルトで直接起動されるため、provider proxy 設定によって browser SSRF チェックが弱まることはありません。
- managed browser 自体をプロキシするには、`browser.extraArgs` を通じて `--proxy-server=...` や `--proxy-pac-url=...` のような明示的な Chrome proxy flag を渡してください。strict SSRF モードでは、プライベートネットワーク browser アクセスが意図的に有効化されていない限り、明示的な browser proxy ルーティングはブロックされます。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` はデフォルトでオフです。プライベートネットワーク browser アクセスを意図的に信頼する場合にのみ有効にしてください。
- `browser.ssrfPolicy.allowPrivateNetwork` は legacy alias として引き続きサポートされます。

</Accordion>

<Accordion title="Profile の動作">

- `attachOnly: true` は、ローカル browser を決して起動せず、すでに起動している場合のみ接続することを意味します。
- `headless` はグローバルにもローカル managed profile ごとにも設定できます。profile ごとの値が `browser.headless` を override するため、ローカル起動されるある profile は headless のままにしつつ、別の profile は可視のままにできます。
- `POST /start?headless=true` と `openclaw browser start --headless` は、
  `browser.headless` や profile config を書き換えずに、ローカル managed profile に対して 1 回限りの headless 起動を要求します。existing-session、attach-only、remote CDP profile は、この override を拒否します。OpenClaw はそれらの
  browser process を起動しないためです。
- Linux ホストで `DISPLAY` または `WAYLAND_DISPLAY` がない場合、環境または profile/global
  config のどちらでも headed モードが明示的に選ばれていなければ、ローカル managed profile は自動的に headless がデフォルトになります。`openclaw browser status --json`
  は `headlessSource` を `env`、`profile`、`config`、
  `request`、`linux-display-fallback`、または `default` として報告します。
- `OPENCLAW_BROWSER_HEADLESS=1` は、現在の process に対するローカル managed 起動を
  headless に強制します。`OPENCLAW_BROWSER_HEADLESS=0` は通常の
  start に対して headed モードを強制し、display server のない Linux ホストでは実行可能なエラーを返します。明示的な `start --headless` 要求は、その 1 回の起動については引き続き優先されます。
- `executablePath` はグローバルにもローカル managed profile ごとにも設定できます。profile ごとの値が `browser.executablePath` を override するため、異なる managed profile で異なる Chromium ベース browser を起動できます。どちらの形式でも OS のホームディレクトリーに対して `~` を使えます。
- `color`（トップレベルおよび profile ごと）は browser UI を色付けし、どの profile がアクティブかを見分けられるようにします。
- デフォルト profile は `openclaw`（管理された standalone）です。サインイン済み user browser を使うには `defaultProfile: "user"` を使って opt in してください。
- 自動検出順序: system default browser が Chromium ベースならそれを使用。それ以外は Chrome → Brave → Edge → Chromium → Chrome Canary。
- `driver: "existing-session"` は raw CDP ではなく Chrome DevTools MCP を使います。この driver には `cdpUrl` を設定しないでください。
- existing-session profile がデフォルトでない Chromium user profile（Brave、Edge など）に接続する必要がある場合は、`browser.profiles.<name>.userDataDir` を設定してください。このパスでも OS のホームディレクトリーに対して `~` を使えます。

</Accordion>

</AccordionGroup>

## Brave（または別の Chromium ベース browser）を使う

**system default** browser が Chromium ベース（Chrome/Brave/Edge など）の場合、
OpenClaw は自動的にそれを使います。自動検出を override するには `browser.executablePath` を設定してください。トップレベルおよび profile ごとの `executablePath` 値では、OS のホームディレクトリーに対して `~` を使えます:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

または、platform ごとに config で設定します。

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

profile ごとの `executablePath` は、OpenClaw が起動するローカル管理 profile にのみ影響します。`existing-session` profile は代わりにすでに実行中の browser に接続し、remote CDP profile は `cdpUrl` の背後にある browser を使います。

## ローカル制御とリモート制御

- **ローカル制御（デフォルト）:** Gateway が loopback 制御サービスを起動し、ローカル browser を起動できます。
- **リモート制御（node host）:** browser があるマシンで node host を実行すると、Gateway が browser アクションをそこへプロキシします。
- **Remote CDP:** `browser.profiles.<name>.cdpUrl`（または `browser.cdpUrl`）を設定して、リモートの Chromium ベース browser に接続します。この場合、OpenClaw はローカル browser を起動しません。
- loopback 上で外部管理された CDP サービス（たとえば
  Docker で公開された Browserless）に対しては、`attachOnly: true` も設定してください。`attachOnly` なしの loopback CDP は、ローカルの OpenClaw 管理 browser profile として扱われます。
- `headless` は、OpenClaw が起動するローカル管理 profile にのみ影響します。existing-session や remote CDP browser を再起動したり変更したりはしません。
- `executablePath` も同じローカル管理 profile ルールに従います。実行中のローカル管理 profile でこれを変更すると、その profile は restart/reconcile 対象としてマークされ、次回起動時に新しいバイナリーが使われます。

停止動作は profile モードによって異なります。

- ローカル管理 profile: `openclaw browser stop` は
  OpenClaw が起動した browser process を停止します
- attach-only および remote CDP profile: `openclaw browser stop` はアクティブな
  制御セッションを閉じ、Playwright/CDP のエミュレーション override（viewport、
  color scheme、locale、timezone、offline mode などの状態）を解放します。
  OpenClaw が browser process を起動していなくても同様です

Remote CDP URL には認証情報を含められます。

- クエリトークン（例: `https://provider.example?token=<token>`）
- HTTP Basic 認証（例: `https://user:pass@provider.example`）

OpenClaw は `/json/*` エンドポイント呼び出し時と
CDP WebSocket 接続時の両方で認証情報を保持します。トークンは config ファイルにコミットするのではなく、環境変数または secrets manager を使うことを推奨します。

## Node browser proxy（デフォルトのゼロ設定）

browser があるマシンで **node host** を実行している場合、OpenClaw は
追加の browser 設定なしで browser tool 呼び出しをその node に自動ルーティングできます。
これはリモート Gateway のデフォルト経路です。

注意:

- node host は、ローカル browser 制御サーバーを **proxy command** として公開します。
- profile は node 自身の `browser.profiles` config から取得されます（ローカルと同じ）。
- `nodeHost.browserProxy.allowProfiles` は任意です。空のままにすると従来/デフォルト動作になり、profile の作成/削除ルートを含め、設定済みのすべての profile が proxy 経由で到達可能なままになります。
- `nodeHost.browserProxy.allowProfiles` を設定すると、OpenClaw はそれを最小権限境界として扱います。allowlist にある profile だけを対象にでき、永続 profile の作成/削除ルートは proxy 画面でブロックされます。
- 不要なら無効にしてください。
  - node 側: `nodeHost.browserProxy.enabled=false`
  - gateway 側: `gateway.nodes.browser.mode="off"`

## Browserless（ホスト型 remote CDP）

[Browserless](https://browserless.io) は、HTTPS と WebSocket で
CDP 接続 URL を公開するホスト型 Chromium サービスです。OpenClaw はどちらの形式も使えますが、
リモート browser profile では、最も簡単なのは Browserless の接続ドキュメントにある直接 WebSocket URL です。

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

注意:

- `<BROWSERLESS_API_KEY>` は実際の Browserless token に置き換えてください。
- Browserless アカウントに合うリージョン endpoint を選んでください（詳細はそのドキュメントを参照）。
- Browserless から HTTPS の base URL が提供される場合は、それを
  直接 CDP 接続用の `wss://` に変換するか、HTTPS URL のままにして OpenClaw に
  `/json/version` を検出させることもできます。

### 同一ホスト上の Browserless Docker

Browserless を Docker でセルフホストし、OpenClaw をホスト上で実行する場合は、
Browserless を外部管理 CDP サービスとして扱ってください。

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

`browser.profiles.browserless.cdpUrl` のアドレスは
OpenClaw process から到達可能でなければなりません。Browserless も対応する到達可能な endpoint を公開している必要があります。Browserless の `EXTERNAL` を、`ws://127.0.0.1:3000`、`ws://browserless:3000`、または安定したプライベート Docker
network アドレスのような、OpenClaw から見える同じ WebSocket base に設定してください。`/json/version` が OpenClaw から到達できないアドレスを指す `webSocketDebuggerUrl` を返すと、CDP HTTP は正常に見えても WebSocket 接続は失敗します。

loopback の Browserless profile では `attachOnly` を未設定のままにしないでください。`attachOnly` がないと、OpenClaw はその loopback ポートをローカル管理 browser
profile として扱い、そのポートは使用中だが OpenClaw 所有ではないと報告することがあります。

## 直接 WebSocket CDP プロバイダー

一部のホスト型 browser サービスは、標準の HTTP ベース CDP 検出（`/json/version`）ではなく、**直接 WebSocket** endpoint を公開します。OpenClaw は 3 種類の
CDP URL 形式を受け付け、適切な接続戦略を自動で選択します。

- **HTTP(S) 検出** — `http://host[:port]` または `https://host[:port]`。
  OpenClaw は `/json/version` を呼び出して WebSocket debugger URL を検出し、
  その後接続します。WebSocket フォールバックはありません。
- **直接 WebSocket endpoint** — `ws://host[:port]/devtools/<kind>/<id>` または
  `wss://...` で `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  パスを持つもの。OpenClaw は WebSocket handshake で直接接続し、
  `/json/version` は完全にスキップします。
- **ベア WebSocket ルート** — `ws://host[:port]` または `wss://host[:port]` で
  `/devtools/...` パスを持たないもの（例: [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)）。OpenClaw はまず HTTP
  `/json/version` 検出を試み（scheme を `http`/`https` に正規化）、
  検出が `webSocketDebuggerUrl` を返した場合はそれを使います。返さない場合は OpenClaw
  はベアルートへの直接 WebSocket handshake にフォールバックします。公開された
  WebSocket endpoint が CDP handshake を拒否しても、設定されたベアルートが
  それを受け入れる場合、OpenClaw はそのルートにもフォールバックします。これにより、ローカル Chrome を指すベア `ws://` でも接続できます。Chrome は `/json/version` から得られる特定のターゲットごとのパスでしか WebSocket
  upgrade を受け付けませんが、ホスト型プロバイダーは、検出 endpoint が
  Playwright CDP には適さない短命 URL を公開する場合でも、ルート WebSocket
  endpoint を使えるためです。

### Browserbase

[Browserbase](https://www.browserbase.com) は、
CAPTCHA 解決、stealth mode、residential proxy を内蔵した
headless browser 実行のためのクラウドプラットフォームです。

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

注意:

- [登録](https://www.browserbase.com/sign-up) して、[Overview dashboard](https://www.browserbase.com/overview) から **API Key**
  をコピーしてください。
- `<BROWSERBASE_API_KEY>` は実際の Browserbase API key に置き換えてください。
- Browserbase は WebSocket 接続時に browser session を自動作成するため、
  手動で session を作成する手順は不要です。
- 無料プランでは、同時セッション 1 つ、月 1 browser hour まで利用できます。
  有料プランの上限は [pricing](https://www.browserbase.com/pricing) を参照してください。
- 完全な API
  リファレンス、SDK ガイド、統合例については [Browserbase docs](https://docs.browserbase.com) を参照してください。

## セキュリティ

重要な考え方:

- Browser 制御は loopback のみです。アクセスは Gateway の認証または node pairing を通じて行われます。
- 独立した loopback browser HTTP API は **共有シークレット認証のみ** を使います:
  gateway token bearer 認証、`x-openclaw-password`、または
  設定済み gateway password を使う HTTP Basic 認証です。
- Tailscale Serve の identity header と `gateway.auth.mode: "trusted-proxy"` は、
  この独立した loopback browser API の認証には**使われません**。
- browser 制御が有効で、共有シークレット認証が設定されていない場合、OpenClaw
  は起動時に `gateway.auth.token` を自動生成し、それを config に永続化します。
- `gateway.auth.mode` がすでに
  `password`、`none`、または `trusted-proxy` の場合、OpenClaw はその token を自動生成しません。
- Gateway とすべての node host はプライベートネットワーク（Tailscale）上に置き、公開露出は避けてください。
- Remote CDP の URL/token は secret として扱い、環境変数または secrets manager を推奨します。

Remote CDP のヒント:

- 可能なら暗号化 endpoint（HTTPS または WSS）と短命 token を使ってください。
- 長期 token を config ファイルに直接埋め込むのは避けてください。

## Profiles（マルチブラウザー）

OpenClaw は複数の名前付き profile（ルーティング config）をサポートします。profile は次のいずれかです。

- **openclaw-managed**: 独自の user data directory と CDP port を持つ、専用の Chromium ベース browser インスタンス
- **remote**: 明示的な CDP URL（別の場所で実行される Chromium ベース browser）
- **existing session**: Chrome DevTools MCP 自動接続を使った既存の Chrome profile

デフォルト:

- `openclaw` profile は存在しない場合に自動作成されます。
- `user` profile は、Chrome MCP existing-session attach 用に組み込まれています。
- existing-session profile は `user` を除いて opt-in です。`--driver existing-session` で作成してください。
- ローカル CDP port はデフォルトで **18800–18899** から割り当てられます。
- profile を削除すると、そのローカルデータディレクトリーはゴミ箱に移動されます。

すべての制御 endpoint は `?profile=<name>` を受け付けます。CLI では `--browser-profile` を使います。

## Chrome DevTools MCP 経由の existing session

OpenClaw は、公式の Chrome DevTools MCP サーバーを通じて、実行中の Chromium ベース browser profile に接続することもできます。これにより、その browser profile ですでに開いているタブやログイン状態を再利用できます。

公式の背景情報とセットアップ参照:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

組み込み profile:

- `user`

任意: 別の名前、色、または browser データディレクトリーにしたい場合は、独自の custom existing-session profile を作成できます。

デフォルト動作:

- 組み込みの `user` profile は Chrome MCP 自動接続を使い、
  デフォルトのローカル Google Chrome profile を対象にします。

Brave、Edge、Chromium、またはデフォルト以外の Chrome profile には `userDataDir` を使ってください。
`~` は OS のホームディレクトリーに展開されます。

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

その後、対応する browser で次を行います。

1. その browser の remote debugging 用 inspect ページを開きます。
2. remote debugging を有効にします。
3. browser を実行したままにし、OpenClaw が接続するときの接続プロンプトを承認します。

一般的な inspect ページ:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

ライブ接続のスモークテスト:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

成功時の状態:

- `status` に `driver: existing-session` が表示される
- `status` に `transport: chrome-mcp` が表示される
- `status` に `running: true` が表示される
- `tabs` に、すでに開いている browser タブが一覧表示される
- `snapshot` が、選択されたライブタブから ref を返す

接続できない場合に確認すること:

- 対象の Chromium ベース browser のバージョンが `144+` である
- その browser の inspect ページで remote debugging が有効になっている
- browser が接続同意プロンプトを表示し、それを承認した
- `openclaw doctor` は古い拡張ベース browser config を移行し、
  デフォルト自動接続 profile 向けに Chrome がローカルにインストールされていることを確認しますが、
  browser 側の remote debugging を代わりに有効化することはできません

agent での利用:

- ユーザーのログイン済み browser 状態が必要な場合は `profile="user"` を使ってください。
- custom existing-session profile を使う場合は、その明示的な profile 名を渡してください。
- このモードは、ユーザーがコンピューターの前にいて接続
  プロンプトを承認できる場合にのみ選んでください。
- Gateway または node host は `npx chrome-devtools-mcp@latest --autoConnect` を起動できます

注意:

- この経路は、サインイン済み browser セッション内で操作できるため、分離された `openclaw` profile より高リスクです。
- OpenClaw はこの driver では browser を起動しません。接続するだけです。
- OpenClaw はここで公式の Chrome DevTools MCP `--autoConnect` フローを使います。
  `userDataDir` が設定されている場合は、その user data directory を対象にするために渡されます。
- existing-session は、選択されたホスト上、または接続済み
  browser node 経由で接続できます。Chrome が別の場所にあり、browser node が接続されていない場合は、
  代わりに remote CDP または node host を使ってください。

### カスタム Chrome MCP 起動

デフォルトの
`npx chrome-devtools-mcp@latest` フローが望ましくない場合（オフラインホスト、
固定バージョン、vendor 提供バイナリーなど）は、profile ごとに起動される Chrome DevTools MCP サーバーを override できます。

| フィールド   | 意味                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| `mcpCommand` | `npx` の代わりに起動する実行ファイル。そのまま解決され、絶対パスも使用されます。                                    |
| `mcpArgs`    | `mcpCommand` にそのまま渡される引数配列。デフォルトの `chrome-devtools-mcp@latest --autoConnect` 引数を置き換えます。 |

existing-session profile に `cdpUrl` が設定されている場合、OpenClaw は
`--autoConnect` をスキップし、その endpoint を自動的に Chrome MCP へ渡します。

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP 検出 endpoint）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接 CDP WebSocket）。

endpoint flag と `userDataDir` は組み合わせられません。`cdpUrl` が設定されている場合、
Chrome MCP 起動では `userDataDir` は無視されます。Chrome MCP は profile
directory を開くのではなく、その endpoint の背後にある実行中 browser に接続するためです。

<Accordion title="Existing-session の機能制限">

管理された `openclaw` profile と比べると、existing-session driver には制約が多くあります。

- **スクリーンショット** — ページキャプチャと `--ref` 要素キャプチャは動作しますが、CSS `--element` セレクターは動作しません。`--full-page` は `--ref` または `--element` と組み合わせられません。ページまたは ref ベース要素のスクリーンショットに Playwright は不要です。
- **アクション** — `click`、`type`、`hover`、`scrollIntoView`、`drag`、`select` には snapshot ref が必要です（CSS セレクターは不可）。`click-coords` は可視 viewport 座標をクリックし、snapshot ref は不要です。`click` は左ボタンのみです。`type` は `slowly=true` をサポートしません。`fill` または `press` を使ってください。`press` は `delayMs` をサポートしません。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill`、`evaluate` は呼び出しごとの timeout をサポートしません。`select` は単一の値を受け取ります。
- **待機 / upload / dialog** — `wait --url` は完全一致、部分一致、glob パターンをサポートします。`wait --load networkidle` はサポートされません。upload hook には `ref` または `inputRef` が必要で、1 回に 1 ファイルのみ、CSS `element` は使えません。dialog hook は timeout override をサポートしません。
- **管理 profile 専用機能** — batch action、PDF export、download interception、`responsebody` は引き続き管理 browser 経路が必要です。

</Accordion>

## 分離保証

- **専用 user data dir**: 個人用 browser profile には決して触れません。
- **専用ポート**: 開発ワークフローとの衝突を避けるため `9222` を使いません。
- **決定的なタブ制御**: `tabs` は最初に `suggestedTargetId` を返し、次に
  `t1` のような安定した `tabId` ハンドル、任意の label、そして生の `targetId` を返します。
  agent は `suggestedTargetId` を再利用するべきです。生の id も
  デバッグと互換性のために引き続き利用できます。

## Browser の選択

ローカル起動時、OpenClaw は利用可能な最初のものを選びます。

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath` で override できます。

platform:

- macOS: `/Applications` と `~/Applications` を確認します。
- Linux: `/usr/bin`、
  `/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium`、
  `/usr/lib/chromium-browser` 配下の一般的な Chrome/Brave/Edge/Chromium の場所を確認します。
- Windows: 一般的なインストール場所を確認します。

## 制御 API（任意）

スクリプト作成とデバッグのために、Gateway は小さな **loopback のみの HTTP
制御 API** と、それに対応する `openclaw browser` CLI（snapshot、ref、wait
拡張、JSON 出力、デバッグワークフロー）を公開します。完全なリファレンスは
[Browser control API](/ja-JP/tools/browser-control) を参照してください。

## トラブルシューティング

Linux 固有の問題（特に snap Chromium）については、
[Browser troubleshooting](/ja-JP/tools/browser-linux-troubleshooting) を参照してください。

WSL2 Gateway + Windows Chrome の分離ホスト構成については、
[WSL2 + Windows + remote Chrome CDP troubleshooting](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting) を参照してください。

### CDP 起動失敗とナビゲーション SSRF ブロックの違い

これらは異なる種類の失敗であり、異なるコードパスを示します。

- **CDP 起動または準備完了失敗** は、OpenClaw が browser 制御プレーンが健全であることを確認できないことを意味します。
- **Navigation SSRF block** は、browser 制御プレーン自体は健全だが、ページのナビゲーション先がポリシーにより拒否されていることを意味します。

一般的な例:

- CDP 起動または準備完了失敗:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - loopback の外部 CDP サービスが `attachOnly: true` なしで設定されているときの
    `Port <port> is in use for profile "<name>" but not by openclaw`
- Navigation SSRF block:
  - `start` と `tabs` は動作するが、`open`、`navigate`、snapshot、またはタブを開くフローが browser/network policy エラーで失敗する

この最小手順を使うと 2 つを切り分けられます。

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

結果の読み方:

- `start` が `not reachable after start` で失敗するなら、まず CDP 準備完了を調査してください。
- `start` は成功するが `tabs` が失敗するなら、制御プレーンは依然として不健全です。これはページナビゲーションの問題ではなく、CDP 到達性の問題として扱ってください。
- `start` と `tabs` は成功するが `open` または `navigate` が失敗するなら、browser 制御プレーンは動いており、失敗はナビゲーションポリシーまたは対象ページ側にあります。
- `start`、`tabs`、`open` がすべて成功するなら、基本的な管理 browser 制御経路は健全です。

重要な動作の詳細:

- `browser.ssrfPolicy` を設定していなくても、browser config はデフォルトでクローズドに失敗する SSRF policy object になります。
- ローカル loopback の `openclaw` 管理 profile では、CDP 健全性チェックは OpenClaw 自身のローカル制御プレーンに対する browser SSRF 到達性の適用を意図的にスキップします。
- ナビゲーション保護は別です。`start` または `tabs` が成功しても、後続の `open` または `navigate` の対象が許可されることを意味しません。

セキュリティガイダンス:

- デフォルトで browser SSRF policy を緩和しないでください。
- 広いプライベートネットワークアクセスより、`hostnameAllowlist` や `allowedHostnames` のような狭い host 例外を優先してください。
- `dangerouslyAllowPrivateNetwork: true` は、プライベートネットワーク browser アクセスが必要で、レビュー済みの、意図的に信頼された環境でのみ使ってください。

## Agent tools と制御の仕組み

agent は browser 自動化のために**1 つの tool**を取得します。

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

対応関係:

- `browser snapshot` は安定した UI ツリー（AI または ARIA）を返します。
- `browser act` は snapshot の `ref` ID を使って click/type/drag/select を行います。
- `browser screenshot` はピクセルをキャプチャします（フルページ、要素、または label 付き ref）。
- `browser doctor` は Gateway、plugin、profile、browser、tab の準備状態を確認します。
- `browser` は次を受け付けます。
  - `profile` は名前付き browser profile（openclaw、chrome、または remote CDP）を選択します。
  - `target`（`sandbox` | `host` | `node`）は browser が存在する場所を選択します。
  - sandboxed session では、`target: "host"` に `agents.defaults.sandbox.browser.allowHostControl=true` が必要です。
  - `target` を省略した場合: sandboxed session ではデフォルトが `sandbox`、非 sandbox session ではデフォルトが `host` です。
  - browser 対応 node が接続されている場合、`target="host"` または `target="node"` を固定しない限り、tool は自動的にそこへルーティングされることがあります。

これにより、agent の動作を決定的に保ち、壊れやすいセレクターを避けられます。

## 関連

- [Tools Overview](/ja-JP/tools) — 利用可能なすべての agent tool
- [Sandboxing](/ja-JP/gateway/sandboxing) — sandbox 環境での browser 制御
- [Security](/ja-JP/gateway/security) — browser 制御のリスクとハードニング
