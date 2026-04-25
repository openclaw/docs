---
read_when:
    - agent 制御の browser 自動化を追加すること
    - openclaw が自分の Chrome に干渉している理由をデバッグすること
    - macOS アプリで browser 設定 + ライフサイクルを実装すること
summary: 統合 browser 制御 service + アクションコマンド
title: Browser（OpenClaw 管理）
x-i18n:
    generated_at: "2026-04-25T18:21:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6379873662b21972493f62951c0fb87c4a9ec6350cec750acaf6a50235bd69c3
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw は、agent が制御する **専用の Chrome/Brave/Edge/Chromium プロファイル** を実行できます。  
これは個人用 browser から分離されており、Gateway 内の小さなローカル制御 service（loopback のみ）を通じて管理されます。

初心者向けの見方:

- これは **agent 専用の別 browser** だと考えてください。
- `openclaw` プロファイルは個人用 browser プロファイルには触れません。
- agent は安全なレーン内で **タブを開き、ページを読み、クリックし、入力** できます。
- 組み込みの `user` プロファイルは、Chrome MCP 経由で実際のサインイン済み Chrome セッションに接続します。

## 得られるもの

- **openclaw** という名前の別 browser プロファイル（デフォルトではオレンジのアクセント）。
- 決定的なタブ制御（一覧/開く/フォーカス/閉じる）。
- agent アクション（クリック/入力/ドラッグ/選択）、snapshot、スクリーンショット、PDF。
- browser plugin が有効なときに、snapshot、stable-tab、stale-ref、および manual-blocker の回復ループを agent に教える、bundled の `browser-automation` Skill。
- 任意のマルチプロファイルサポート（`openclaw`、`work`、`remote`、...）。

この browser は日常利用向けでは**ありません**。これは agent の自動化と検証のための、安全で分離されたサーフェスです。

## クイックスタート

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

「Browser disabled」と表示された場合は、設定で有効化し（下記参照）、Gateway を再起動してください。

`openclaw browser` 自体が存在しない場合、または agent が browser ツールを利用不可と言う場合は、[Missing browser command or tool](/ja-JP/tools/browser#missing-browser-command-or-tool) に進んでください。

## Plugin 制御

デフォルトの `browser` ツールは bundled Plugin です。同じ `browser` ツール名を登録する別の Plugin に置き換えるには、これを無効にします:

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

デフォルト設定には、`plugins.entries.browser.enabled` **と** `browser.enabled=true` の両方が必要です。Plugin だけを無効にすると、`openclaw browser` CLI、`browser.request` Gateway メソッド、agent ツール、および制御 service が 1 つの単位として削除されます。`browser.*` の設定は、置き換え先のためにそのまま残ります。

browser 設定の変更には、Plugin が service を再登録できるよう Gateway の再起動が必要です。

## agent ガイダンス

ツールプロファイルに関する注意: `tools.profile: "coding"` には `web_search` と `web_fetch` は含まれますが、完全な `browser` ツールは含まれません。agent または生成された sub-agent に browser 自動化を使わせたい場合は、プロファイル段階で browser を追加してください:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

単一の agent に対しては、`agents.list[].tools.alsoAllow: ["browser"]` を使います。`tools.subagents.tools.allow: ["browser"]` だけでは不十分です。sub-agent ポリシーはプロファイルフィルタリングの後に適用されるためです。

browser Plugin には 2 段階の agent ガイダンスがあります:

- `browser` ツールの説明には、常時有効のコンパクトな契約が含まれます: 適切なプロファイルを選ぶこと、同じタブ上で ref を維持すること、タブ対象指定には `tabId`/ラベルを使うこと、複数ステップの作業では browser Skill を読み込むこと。
- bundled の `browser-automation` Skill には、より長い運用ループが含まれます: 最初に status/tabs を確認する、作業タブにラベルを付ける、操作前に snapshot を取る、UI 変更後に再 snapshot する、stale ref は 1 回だけ回復する、ログイン/2FA/captcha やカメラ/マイクのブロッカーは推測せず手動アクションとして報告する。

Plugin に bundled された Skills は、Plugin が有効なとき agent の利用可能 Skills に一覧表示されます。完全な Skill 指示は必要時にのみ読み込まれるため、通常のターンではトークンコスト全体を負担しません。

## browser コマンドまたはツールが見つからない

アップグレード後に `openclaw browser` が不明、`browser.request` が存在しない、または agent が browser ツールを利用不可と報告する場合、通常の原因は `browser` を含まない `plugins.allow` リストです。追加してください:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`、`plugins.entries.browser.enabled=true`、および `tools.alsoAllow: ["browser"]` は allowlist メンバーシップの代わりにはなりません。allowlist は Plugin のロードを制御し、ツールポリシーはロード後にしか実行されないためです。`plugins.allow` 自体を完全に削除してもデフォルトに戻ります。

## プロファイル: `openclaw` と `user`

- `openclaw`: 管理された分離 browser（拡張は不要）。
- `user`: 実際の **サインイン済み Chrome** セッション用の組み込み Chrome MCP 接続プロファイル。

agent の browser ツール呼び出しでは:

- デフォルト: 分離された `openclaw` browser を使います。
- 既存のログイン済みセッションが重要で、ユーザーが attach プロンプトをクリック/承認できる状態にある場合は `profile="user"` を優先します。
- `profile` は、特定の browser モードを使いたいときの明示的な override です。

管理モードをデフォルトにしたい場合は、`browser.defaultProfile: "openclaw"` を設定してください。

## 設定

browser 設定は `~/.openclaw/openclaw.json` にあります。

```json5
{
  browser: {
    enabled: true, // デフォルト: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 信頼できるプライベートネットワークアクセスでのみ opt in
      // allowPrivateNetwork: true, // レガシー alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // レガシーな単一プロファイル override
    remoteCdpTimeoutMs: 1500, // リモート CDP HTTP タイムアウト（ms）
    remoteCdpHandshakeTimeoutMs: 3000, // リモート CDP WebSocket ハンドシェイクタイムアウト（ms）
    localLaunchTimeoutMs: 15000, // ローカル管理 Chrome 検出タイムアウト（ms）
    localCdpReadyTimeoutMs: 8000, // ローカル管理 post-launch CDP readiness タイムアウト（ms）
    actionTimeoutMs: 60000, // デフォルト browser act タイムアウト（ms）
    tabCleanup: {
      enabled: true, // デフォルト: true
      idleMinutes: 120, // idle クリーンアップを無効にするには 0 を設定
      maxTabsPerSession: 8, // セッションごとの上限を無効にするには 0 を設定
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

<Accordion title="ポートと到達可能性">

- 制御 service は、`gateway.port` から導出されたポートの loopback に bind します（デフォルト `18791` = gateway + 2）。`gateway.port` または `OPENCLAW_GATEWAY_PORT` を override すると、導出ポートも同じファミリー内で移動します。
- ローカルの `openclaw` プロファイルは `cdpPort`/`cdpUrl` を自動割り当てします。これらはリモート CDP に対してのみ設定してください。`cdpUrl` は未設定時、管理されたローカル CDP ポートがデフォルトになります。
- `remoteCdpTimeoutMs` は、リモートおよび `attachOnly` の CDP HTTP 到達可能性チェックと、タブを開く HTTP リクエストに適用されます。`remoteCdpHandshakeTimeoutMs` は、それらの CDP WebSocket ハンドシェイクに適用されます。
- `localLaunchTimeoutMs` は、ローカル起動された管理 Chrome プロセスが CDP HTTP エンドポイントを公開するまでの予算です。`localCdpReadyTimeoutMs` は、プロセス検出後の CDP websocket readiness のための追跡予算です。Chromium の起動が遅い Raspberry Pi、低性能 VPS、古いハードウェアではこれらを増やしてください。値の上限は 120000 ms です。
- `actionTimeoutMs` は、呼び出し元が `timeoutMs` を渡さない場合の browser `act` リクエストのデフォルト予算です。クライアント転送は小さな余裕時間を加えるため、長時間待機でも HTTP 境界でタイムアウトせず完了できます。
- `tabCleanup` は、primary-agent browser セッションによって開かれたタブに対するベストエフォートのクリーンアップです。subagent、Cron、および ACP のライフサイクルクリーンアップでは、セッション終了時に明示的に追跡されたタブを引き続き閉じます。primary セッションではアクティブタブを再利用可能なまま保ち、その後 idle または過剰な追跡タブをバックグラウンドで閉じます。

</Accordion>

<Accordion title="SSRF ポリシー">

- browser のナビゲーションと open-tab は、ナビゲーション前に SSRF ガードされ、最終的な `http(s)` URL に対してその後ベストエフォートで再チェックされます。
- strict SSRF モードでは、リモート CDP エンドポイント検出と `/json/version` プローブ（`cdpUrl`）もチェックされます。
- Gateway/provider の `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、および `NO_PROXY` 環境変数は、OpenClaw 管理 browser を自動ではプロキシしません。管理 Chrome はデフォルトで直接起動されるため、provider のプロキシ設定が browser の SSRF チェックを弱めることはありません。
- 管理 browser 自体をプロキシするには、`browser.extraArgs` を通じて `--proxy-server=...` や `--proxy-pac-url=...` などの明示的な Chrome プロキシフラグを渡してください。strict SSRF モードでは、プライベートネットワーク browser アクセスが意図的に有効化されていない限り、明示的な browser プロキシルーティングはブロックされます。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` はデフォルトで無効です。プライベートネットワーク browser アクセスを意図的に信頼する場合にのみ有効にしてください。
- `browser.ssrfPolicy.allowPrivateNetwork` はレガシー alias として引き続きサポートされます。

</Accordion>

<Accordion title="プロファイル動作">

- `attachOnly: true` は、ローカル browser を決して起動せず、すでに実行中であれば接続のみ行うことを意味します。
- `headless` はグローバルにも、ローカル管理プロファイルごとにも設定できます。プロファイルごとの値は `browser.headless` を上書きするため、あるローカル起動プロファイルは headless のままにし、別のものは表示状態のままにできます。
- `POST /start?headless=true` と `openclaw browser start --headless` は、`browser.headless` やプロファイル設定を書き換えずに、ローカル管理プロファイルに対する一度限りの headless 起動を要求します。existing-session、attach-only、およびリモート CDP プロファイルは、この override を拒否します。OpenClaw はそれらの browser プロセスを起動しないためです。
- `DISPLAY` や `WAYLAND_DISPLAY` がない Linux ホストでは、環境またはプロファイル/グローバル設定のどちらも headed モードを明示的に選んでいない場合、ローカル管理プロファイルは自動的に headless になります。`openclaw browser status --json` は、`headlessSource` を `env`、`profile`、`config`、`request`、`linux-display-fallback`、または `default` として報告します。
- `OPENCLAW_BROWSER_HEADLESS=1` は、現在のプロセスのローカル管理起動を強制的に headless にします。`OPENCLAW_BROWSER_HEADLESS=0` は通常起動に対して headed モードを強制し、display server のない Linux ホストでは実行可能なエラーを返します。明示的な `start --headless` 要求は、その 1 回の起動については引き続き優先されます。
- `executablePath` はグローバルにも、ローカル管理プロファイルごとにも設定できます。プロファイルごとの値は `browser.executablePath` を上書きするため、異なる管理プロファイルで異なる Chromium 系 browser を起動できます。
- `color`（トップレベルおよびプロファイルごと）は browser UI に色を付け、どのプロファイルがアクティブか分かるようにします。
- デフォルトプロファイルは `openclaw`（管理された単独 browser）です。サインイン済みユーザー browser を opt in するには `defaultProfile: "user"` を使用します。
- 自動検出順: システムデフォルト browser が Chromium 系ならそれを使用し、そうでなければ Chrome → Brave → Edge → Chromium → Chrome Canary。
- `driver: "existing-session"` は raw CDP の代わりに Chrome DevTools MCP を使用します。その driver に `cdpUrl` を設定しないでください。
- existing-session プロファイルを非デフォルトの Chromium ユーザープロファイル（Brave、Edge など）に接続させたい場合は、`browser.profiles.<name>.userDataDir` を設定してください。

</Accordion>

</AccordionGroup>

## Brave（または別の Chromium 系 browser）を使う

**システムデフォルト** browser が Chromium 系（Chrome/Brave/Edge など）であれば、OpenClaw は自動的にそれを使います。自動検出を上書きするには `browser.executablePath` を設定してください。`~` は OS のホームディレクトリに展開されます:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

または、プラットフォームごとに config に設定してください:

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

プロファイルごとの `executablePath` は、OpenClaw が起動するローカル管理プロファイルにのみ影響します。`existing-session` プロファイルは代わりに、すでに実行中の browser に接続し、リモート CDP プロファイルは `cdpUrl` の背後にある browser を使用します。

## ローカル制御とリモート制御

- **ローカル制御（デフォルト）:** Gateway が loopback 制御 service を起動し、ローカル browser を起動できます。
- **リモート制御（node host）:** browser があるマシン上で node host を実行すると、Gateway が browser アクションをその node にプロキシします。
- **リモート CDP:** `browser.profiles.<name>.cdpUrl`（または `browser.cdpUrl`）を設定して、リモートの Chromium 系 browser に接続します。この場合、OpenClaw はローカル browser を起動しません。
- loopback 上の外部管理 CDP service（たとえば Docker で公開された Browserless）では、`attachOnly: true` も設定してください。`attachOnly` なしの loopback CDP は、ローカルの OpenClaw 管理 browser プロファイルとして扱われます。
- `headless` は、OpenClaw が起動するローカル管理プロファイルにのみ影響します。existing-session やリモート CDP の browser を再起動したり変更したりはしません。
- `executablePath` も同じローカル管理プロファイルのルールに従います。実行中のローカル管理プロファイルでこれを変更すると、そのプロファイルは再起動/再調整対象としてマークされ、次回起動時に新しいバイナリが使われます。

停止動作はプロファイルモードによって異なります:

- ローカル管理プロファイル: `openclaw browser stop` は、OpenClaw が起動した browser プロセスを停止します
- attach-only およびリモート CDP プロファイル: `openclaw browser stop` は、アクティブな制御セッションを閉じ、Playwright/CDP のエミュレーション override（viewport、color scheme、locale、timezone、offline mode、および類似の状態）を解放します。OpenClaw により browser プロセスが起動されていなくても同様です

リモート CDP URL には認証を含めることができます:

- クエリトークン（例: `https://provider.example?token=<token>`）
- HTTP Basic 認証（例: `https://user:pass@provider.example`）

OpenClaw は `/json/*` エンドポイント呼び出し時と CDP WebSocket 接続時の両方で認証を保持します。トークンは config ファイルにコミットする代わりに、環境変数または secrets manager を使うことを推奨します。

## Node browser プロキシ（デフォルトでゼロ設定）

browser があるマシン上で **node host** を実行している場合、OpenClaw は追加の browser 設定なしで browser ツール呼び出しをその node に自動ルーティングできます。これはリモート Gateway のデフォルトパスです。

注意点:

- node host は、自身のローカル browser 制御サーバーを **proxy command** として公開します。
- プロファイルは node 自身の `browser.profiles` 設定から取得されます（ローカルと同じ）。
- `nodeHost.browserProxy.allowProfiles` は任意です。従来の/デフォルト動作にするには空のままにしてください: 設定済みのすべてのプロファイルが、プロファイルの作成/削除ルートを含めてプロキシ経由で到達可能なままになります。
- `nodeHost.browserProxy.allowProfiles` を設定すると、OpenClaw はそれを最小権限境界として扱います: allowlist に含まれるプロファイルだけが対象にでき、永続的なプロファイル作成/削除ルートはプロキシサーフェス上でブロックされます。
- 不要なら無効にできます:
  - node 側: `nodeHost.browserProxy.enabled=false`
  - gateway 側: `gateway.nodes.browser.mode="off"`

## Browserless（ホスト型リモート CDP）

[Browserless](https://browserless.io) は、HTTPS および WebSocket 経由で CDP 接続 URL を公開するホスト型 Chromium service です。OpenClaw はどちらの形式も使えますが、リモート browser プロファイルでは、もっとも簡単な選択肢は Browserless の接続ドキュメントにある直接 WebSocket URL です。

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

注意点:

- `<BROWSERLESS_API_KEY>` は実際の Browserless トークンに置き換えてください。
- Browserless アカウントに対応するリージョンエンドポイントを選んでください（詳細は Browserless のドキュメントを参照）。
- Browserless から HTTPS ベース URL が提供される場合、直接 CDP 接続用に `wss://` に変換することも、そのまま HTTPS URL を保持して OpenClaw に `/json/version` を検出させることもできます。

### 同一ホスト上の Browserless Docker

Browserless を Docker でセルフホストし、OpenClaw がホスト上で実行される場合、Browserless は外部管理 CDP service として扱ってください:

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

`browser.profiles.browserless.cdpUrl` のアドレスは、OpenClaw プロセスから到達可能でなければなりません。Browserless も同様に、到達可能な一致するエンドポイントを公開する必要があります。Browserless の `EXTERNAL` を、同じ OpenClaw 到達可能な WebSocket ベース、たとえば `ws://127.0.0.1:3000`、`ws://browserless:3000`、または安定したプライベート Docker ネットワークアドレスに設定してください。`/json/version` が、OpenClaw から到達できないアドレスを指す `webSocketDebuggerUrl` を返すと、CDP HTTP は正常に見えても、WebSocket 接続は失敗します。

loopback の Browserless プロファイルで `attachOnly` を未設定のままにしないでください。`attachOnly` がないと、OpenClaw はその loopback ポートをローカル管理 browser プロファイルとして扱い、そのポートは使用中だが OpenClaw の所有ではないと報告することがあります。

## 直接 WebSocket CDP プロバイダー

一部のホスト型 browser service は、標準的な HTTP ベースの CDP 検出（`/json/version`）ではなく、**直接 WebSocket** エンドポイントを公開します。OpenClaw は 3 種類の CDP URL 形式を受け付け、適切な接続戦略を自動的に選択します:

- **HTTP(S) 検出** — `http://host[:port]` または `https://host[:port]`。  
  OpenClaw は `/json/version` を呼び出して WebSocket debugger URL を検出し、その後接続します。WebSocket fallback はありません。
- **直接 WebSocket エンドポイント** — `ws://host[:port]/devtools/<kind>/<id>` または `wss://...` で `/devtools/browser|page|worker|shared_worker|service_worker/<id>` パスを持つもの。OpenClaw は WebSocket ハンドシェイクで直接接続し、`/json/version` は完全にスキップします。
- **ベア WebSocket ルート** — `ws://host[:port]` または `wss://host[:port]` で `/devtools/...` パスを持たないもの（例: [Browserless](https://browserless.io)、[Browserbase](https://www.browserbase.com)）。OpenClaw はまず HTTP `/json/version` 検出を試みます（スキームを `http`/`https` に正規化）。検出で `webSocketDebuggerUrl` が返ればそれを使用し、そうでなければベアルートで直接 WebSocket ハンドシェイクに fallback します。公開された WebSocket エンドポイントが CDP ハンドシェイクを拒否する一方で、設定されたベアルートがそれを受け入れる場合も、OpenClaw はそのルートへ fallback します。これにより、ローカル Chrome を指すベア `ws://` でも接続できます。Chrome は `/json/version` から得た特定の per-target パスでのみ WebSocket upgrade を受け入れる一方、ホスト型プロバイダーは、検出エンドポイントが Playwright CDP に不向きな短命 URL を通知する場合でも、ルート WebSocket エンドポイントを使い続けられます。

### Browserbase

[Browserbase](https://www.browserbase.com) は、CAPTCHA 解決、stealth mode、および residential proxy を内蔵した headless browser 実行用クラウドプラットフォームです。

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

注意点:

- [登録](https://www.browserbase.com/sign-up) して、[Overview dashboard](https://www.browserbase.com/overview) から **API Key** をコピーしてください。
- `<BROWSERBASE_API_KEY>` は実際の Browserbase API キーに置き換えてください。
- Browserbase は WebSocket 接続時に browser セッションを自動作成するため、手動のセッション作成手順は不要です。
- 無料枠では、同時 1 セッション、月 1 browser-hour まで利用できます。有料プランの上限は [pricing](https://www.browserbase.com/pricing) を参照してください。
- 完全な API リファレンス、SDK ガイド、および統合例については [Browserbase docs](https://docs.browserbase.com) を参照してください。

## セキュリティ

重要な考え方:

- browser 制御は loopback のみです。アクセスは Gateway 認証または node ペアリングを通ります。
- スタンドアロンの loopback browser HTTP API は **共有シークレット認証のみ** を使用します: Gateway トークン bearer 認証、`x-openclaw-password`、または設定済み Gateway パスワードを使う HTTP Basic 認証です。
- Tailscale Serve の identity ヘッダーと `gateway.auth.mode: "trusted-proxy"` は、このスタンドアロン loopback browser API を認証**しません**。
- browser 制御が有効で、共有シークレット認証が設定されていない場合、OpenClaw は起動時に `gateway.auth.token` を自動生成し、それを config に永続化します。
- `gateway.auth.mode` がすでに `password`、`none`、または `trusted-proxy` の場合、OpenClaw はそのトークンを自動生成**しません**。
- Gateway とすべての node host はプライベートネットワーク（Tailscale）上に保持し、公開 exposure は避けてください。
- リモート CDP URL/トークンはシークレットとして扱い、環境変数または secrets manager を推奨します。

リモート CDP のヒント:

- 可能な限り、暗号化されたエンドポイント（HTTPS または WSS）と短命トークンを優先してください。
- 長期トークンを config ファイルに直接埋め込むのは避けてください。

## プロファイル（マルチ browser）

OpenClaw は複数の名前付きプロファイル（ルーティング設定）をサポートします。プロファイルには次の種類があります:

- **OpenClaw 管理**: 独自の user data directory + CDP port を持つ専用の Chromium 系 browser インスタンス
- **remote**: 明示的な CDP URL（別の場所で実行されている Chromium 系 browser）
- **existing session**: Chrome DevTools MCP auto-connect 経由の既存 Chrome プロファイル

デフォルト:

- `openclaw` プロファイルは、存在しない場合に自動作成されます。
- `user` プロファイルは、Chrome MCP existing-session 接続用に組み込みです。
- existing-session プロファイルは `user` 以外では opt-in です。`--driver existing-session` で作成してください。
- ローカル CDP ポートはデフォルトで **18800–18899** から割り当てられます。
- プロファイルを削除すると、そのローカルデータディレクトリは Trash に移動されます。

すべての制御エンドポイントは `?profile=<name>` を受け入れます。CLI では `--browser-profile` を使用します。

## Chrome DevTools MCP 経由の existing session

OpenClaw は、公式の Chrome DevTools MCP サーバー経由で、実行中の Chromium 系 browser プロファイルに接続することもできます。これにより、その browser プロファイルですでに開いているタブやログイン状態を再利用できます。

公式の背景説明とセットアップ参照:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

組み込みプロファイル:

- `user`

任意: 別の名前、色、または browser データディレクトリが必要な場合は、独自の custom existing-session プロファイルを作成できます。

デフォルト動作:

- 組み込みの `user` プロファイルは Chrome MCP auto-connect を使用し、デフォルトのローカル Google Chrome プロファイルを対象にします。

Brave、Edge、Chromium、またはデフォルト以外の Chrome プロファイルには `userDataDir` を使用してください:

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

その後、対応する browser で次を行ってください:

1. その browser のリモートデバッグ用 inspect ページを開きます。
2. リモートデバッグを有効にします。
3. browser を実行したままにし、OpenClaw が接続したときに接続プロンプトを承認します。

一般的な inspect ページ:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

ライブ接続スモークテスト:

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
- `tabs` に、すでに開いている browser タブが一覧表示される
- `snapshot` が、選択されたライブタブから ref を返す

接続が機能しない場合に確認すること:

- 対象の Chromium 系 browser がバージョン `144+` である
- その browser の inspect ページでリモートデバッグが有効になっている
- browser に attach 同意プロンプトが表示され、それを承認した
- `openclaw doctor` は古い extension ベースの browser 設定を移行し、デフォルト auto-connect プロファイル向けに Chrome がローカルにインストールされていることを確認しますが、browser 側のリモートデバッグを自動で有効化することはできません

agent での使用:

- ユーザーのログイン済み browser 状態が必要な場合は `profile="user"` を使います。
- custom existing-session プロファイルを使う場合は、その明示的なプロファイル名を渡してください。
- このモードは、attach プロンプトを承認できるようユーザーがコンピューターの前にいるときだけ選んでください。
- Gateway または node host は `npx chrome-devtools-mcp@latest --autoConnect` を起動できます

注意点:

- このパスは、分離された `openclaw` プロファイルより高リスクです。サインイン済み browser セッション内で動作できるためです。
- OpenClaw はこの driver で browser を起動しません。接続のみ行います。
- OpenClaw はここで公式の Chrome DevTools MCP `--autoConnect` フローを使用します。`userDataDir` が設定されている場合は、その user data directory を対象にするためにそれがそのまま渡されます。
- existing-session は、選択されたホスト上、または接続された browser Node 経由で接続できます。Chrome が別の場所にあり、browser Node が接続されていない場合は、代わりにリモート CDP または node host を使ってください。

### custom Chrome MCP 起動

デフォルトの `npx chrome-devtools-mcp@latest` フローでは都合が悪い場合（オフラインホスト、固定バージョン、vendor 管理バイナリ）、プロファイルごとに起動される Chrome DevTools MCP サーバーを上書きできます:

| フィールド | 役割 |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | `npx` の代わりに起動する実行ファイル。そのまま解決され、絶対パスも尊重されます。 |
| `mcpArgs`    | `mcpCommand` にそのまま渡される引数配列。デフォルトの `chrome-devtools-mcp@latest --autoConnect` 引数を置き換えます。 |

existing-session プロファイルで `cdpUrl` が設定されている場合、OpenClaw は `--autoConnect` をスキップし、そのエンドポイントを自動的に Chrome MCP に渡します:

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP 検出エンドポイント）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接 CDP WebSocket）。

エンドポイントフラグと `userDataDir` は併用できません。`cdpUrl` が設定されている場合、Chrome MCP 起動では `userDataDir` は無視されます。Chrome MCP はプロファイルディレクトリを開くのではなく、そのエンドポイントの背後にある実行中 browser に接続するためです。

<Accordion title="existing-session の機能制限">

管理された `openclaw` プロファイルと比べると、existing-session driver にはより多くの制約があります:

- **スクリーンショット** — ページキャプチャと `--ref` 要素キャプチャは機能しますが、CSS `--element` セレクタは使えません。`--full-page` は `--ref` や `--element` と組み合わせられません。ページまたは ref ベース要素のスクリーンショットには Playwright は不要です。
- **アクション** — `click`、`type`、`hover`、`scrollIntoView`、`drag`、`select` には snapshot ref が必要です（CSS セレクタは不可）。`click-coords` は可視 viewport 座標をクリックし、snapshot ref を必要としません。`click` は左ボタンのみです。`type` は `slowly=true` をサポートしません。`fill` または `press` を使ってください。`press` は `delayMs` をサポートしません。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill`、および `evaluate` は呼び出しごとのタイムアウトをサポートしません。`select` は単一値のみ受け付けます。
- **待機 / アップロード / ダイアログ** — `wait --url` は完全一致、部分一致、および glob パターンをサポートしますが、`wait --load networkidle` はサポートしません。アップロードフックには `ref` または `inputRef` が必要で、1 回に 1 ファイルのみ、CSS `element` は使えません。ダイアログフックはタイムアウト override をサポートしません。
- **管理専用機能** — バッチアクション、PDF エクスポート、ダウンロードインターセプト、および `responsebody` は引き続き管理 browser パスが必要です。

</Accordion>

## 分離保証

- **専用 user data dir**: 個人用 browser プロファイルには決して触れません。
- **専用ポート**: 開発ワークフローとの競合を避けるため `9222` を使いません。
- **決定的なタブ制御**: `tabs` は最初に `suggestedTargetId` を返し、その後に `t1` のような安定した `tabId` ハンドル、任意のラベル、および生の `targetId` を返します。agent は `suggestedTargetId` を再利用すべきです。生の ID はデバッグと互換性のために引き続き利用できます。

## browser 選択

ローカル起動時、OpenClaw は利用可能な最初のものを選びます:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath` で override できます。

プラットフォーム:

- macOS: `/Applications` と `~/Applications` を確認します。
- Linux: `/usr/bin`、`/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium`、`/usr/lib/chromium-browser` 配下の一般的な Chrome/Brave/Edge/Chromium の場所を確認します。
- Windows: 一般的なインストール場所を確認します。

## 制御 API（任意）

スクリプト作成とデバッグのために、Gateway は小さな **loopback 専用 HTTP 制御 API** と、それに対応する `openclaw browser` CLI（snapshot、ref、wait 強化、JSON 出力、デバッグワークフロー）を公開します。完全なリファレンスは [Browser control API](/ja-JP/tools/browser-control) を参照してください。

## トラブルシューティング

Linux 固有の問題（特に snap Chromium）については、[Browser troubleshooting](/ja-JP/tools/browser-linux-troubleshooting) を参照してください。

WSL2 Gateway + Windows Chrome の分離ホスト構成については、[WSL2 + Windows + remote Chrome CDP troubleshooting](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting) を参照してください。

### CDP 起動失敗とナビゲーション SSRF ブロックの違い

これらは異なる障害クラスであり、異なるコードパスを指します。

- **CDP 起動または readiness の失敗** は、OpenClaw が browser 制御プレーンが正常であることを確認できないことを意味します。
- **ナビゲーション SSRF ブロック** は、browser 制御プレーンは正常だが、ページナビゲーション先がポリシーにより拒否されることを意味します。

一般的な例:

- CDP 起動または readiness の失敗:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - loopback 外部 CDP service が `attachOnly: true` なしで設定されているときの `Port <port> is in use for profile "<name>" but not by openclaw`
- ナビゲーション SSRF ブロック:
  - `start` や `tabs` は動作するのに、`open`、`navigate`、snapshot、またはタブを開くフローが browser/network ポリシーエラーで失敗する

この最小手順で両者を切り分けてください:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

結果の読み方:

- `start` が `not reachable after start` で失敗する場合、まず CDP readiness をトラブルシュートしてください。
- `start` が成功しても `tabs` が失敗する場合、制御プレーンは依然として不健全です。ページナビゲーションの問題ではなく、CDP 到達可能性の問題として扱ってください。
- `start` と `tabs` が成功し、`open` または `navigate` が失敗する場合、browser 制御プレーンは起動しており、失敗はナビゲーションポリシーまたは対象ページ側にあります。
- `start`、`tabs`、および `open` がすべて成功する場合、基本的な管理 browser 制御パスは正常です。

重要な動作詳細:

- browser 設定は、`browser.ssrfPolicy` を設定していなくても、デフォルトで fail-closed の SSRF ポリシーオブジェクトになります。
- ローカル loopback の `openclaw` 管理プロファイルでは、CDP ヘルスチェックは OpenClaw 自身のローカル制御プレーンに対する browser SSRF 到達可能性の強制を意図的にスキップします。
- ナビゲーション保護は別です。`start` や `tabs` が成功しても、その後の `open` や `navigate` の対象が許可されるとは限りません。

セキュリティガイダンス:

- デフォルトで browser SSRF ポリシーを緩和**しないでください**。
- 広いプライベートネットワークアクセスよりも、`hostnameAllowlist` や `allowedHostnames` のような狭いホスト例外を優先してください。
- `dangerouslyAllowPrivateNetwork: true` は、プライベートネットワーク browser アクセスが必要で、意図的に信頼され、レビュー済みの環境でのみ使用してください。

## agent ツールと制御の仕組み

agent には browser 自動化用の **1 つのツール** があります:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

対応関係:

- `browser snapshot` は安定した UI ツリー（AI または ARIA）を返します。
- `browser act` は snapshot の `ref` ID を使って click/type/drag/select を行います。
- `browser screenshot` はピクセルをキャプチャします（full page、element、またはラベル付き ref）。
- `browser doctor` は Gateway、Plugin、プロファイル、browser、およびタブの準備状況をチェックします。
- `browser` は以下を受け付けます:
  - 名前付き browser プロファイル（openclaw、chrome、または remote CDP）を選ぶ `profile`
  - browser の存在場所を選ぶ `target`（`sandbox` | `host` | `node`）
  - sandbox セッションでは、`target: "host"` に `agents.defaults.sandbox.browser.allowHostControl=true` が必要です。
  - `target` が省略された場合: sandbox セッションではデフォルトで `sandbox`、非 sandbox セッションではデフォルトで `host`
  - browser capability を持つ Node が接続されている場合、`target="host"` または `target="node"` で固定しない限り、ツールは自動的にそこへルーティングされる場合があります

これにより agent の動作が決定的になり、壊れやすいセレクタを避けられます。

## 関連

- [Tools Overview](/ja-JP/tools) — 利用可能なすべての agent ツール
- [Sandboxing](/ja-JP/gateway/sandboxing) — sandbox 環境での browser 制御
- [Security](/ja-JP/gateway/security) — browser 制御のリスクとハードニング
