---
read_when:
    - エージェント制御のブラウザー自動化を追加する
    - openclaw が自分の Chrome に干渉する理由をデバッグする
    - macOSアプリでブラウザー設定とライフサイクルを実装する
summary: 統合ブラウザー制御サービス + アクションコマンド
title: ブラウザー（OpenClaw管理）
x-i18n:
    generated_at: "2026-05-06T18:00:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c9f79b4f8b9921724130b4793584facf1bfbe2de5fb21faa54274a4294dedd0
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw は、エージェントが制御する **専用の Chrome/Brave/Edge/Chromium プロファイル**を実行できます。
これは個人用ブラウザーから分離され、Gateway 内の小さなローカル
制御サービスを通じて管理されます (loopback のみ)。

初心者向けの見方:

- **エージェント専用の別ブラウザー**だと考えてください。
- `openclaw` プロファイルは、個人用ブラウザープロファイルに**触れません**。
- エージェントは安全なレーンで、**タブを開く、ページを読む、クリックする、入力する**ことができます。
- 組み込みの `user` プロファイルは、Chrome MCP を介して実際のサインイン済み Chrome セッションに接続します。

## 得られるもの

- **openclaw** という名前の別ブラウザープロファイル (デフォルトではオレンジのアクセント)。
- 決定的なタブ制御 (list/open/focus/close)。
- エージェントアクション (click/type/drag/select)、スナップショット、スクリーンショット、PDF。
- ブラウザー
  Plugin が有効なときに、スナップショット、安定タブ、古い参照、手動ブロッカーの復旧ループをエージェントに教える、同梱の `browser-automation` skill。
- 任意のマルチプロファイル対応 (`openclaw`、`work`、`remote`、...)。

このブラウザーは**日常利用のブラウザーではありません**。エージェントの自動化と検証のための、
安全で分離された領域です。

## クイックスタート

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

「Browser disabled」と表示された場合は、設定で有効にし (下記参照)、Gateway を再起動してください。

`openclaw browser` が完全に存在しない場合、またはエージェントがブラウザーツールを
利用できないと表示する場合は、[ブラウザーコマンドまたはツールが見つからない](/ja-JP/tools/browser#missing-browser-command-or-tool)に進んでください。

## Plugin 制御

デフォルトの `browser` ツールは同梱 Plugin です。同じ `browser` ツール名を登録する別の Plugin に置き換えるには、これを無効にします。

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

デフォルトには `plugins.entries.browser.enabled` **と** `browser.enabled=true` の両方が必要です。Plugin だけを無効にすると、`openclaw browser` CLI、`browser.request` Gateway メソッド、エージェントツール、制御サービスが 1 つの単位として削除されます。`browser.*` 設定は置き換え用にそのまま残ります。

ブラウザー設定の変更後は、Plugin がサービスを再登録できるように Gateway の再起動が必要です。

## エージェントガイダンス

ツールプロファイルに関する注記: `tools.profile: "coding"` には `web_search` と
`web_fetch` が含まれますが、完全な `browser` ツールは含まれません。エージェントまたは
生成されたサブエージェントでブラウザー自動化を使う必要がある場合は、プロファイル段階で
browser を追加します。

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

単一エージェントでは、`agents.list[].tools.alsoAllow: ["browser"]` を使用してください。
`tools.subagents.tools.allow: ["browser"]` だけでは不十分です。サブエージェント
ポリシーはプロファイルのフィルタリング後に適用されるためです。

ブラウザー Plugin には、2 段階のエージェントガイダンスが同梱されています。

- `browser` ツールの説明には、常時有効なコンパクトな契約が含まれます:
  適切なプロファイルを選ぶ、同じタブ上で参照を維持する、タブのターゲティングには `tabId`/ラベルを使う、
  複数ステップの作業ではブラウザー skill を読み込む。
- 同梱の `browser-automation` skill には、より長い運用ループが含まれます:
  まず status/tabs を確認する、作業タブにラベルを付ける、操作前にスナップショットを取る、
  UI 変更後に再スナップショットする、古い参照を一度だけ復旧する、login/2FA/captcha または
  camera/microphone ブロッカーは推測せず手動アクションとして報告する。

Plugin 同梱の Skills は、Plugin が有効なときにエージェントの利用可能 Skills に表示されます。
完全な skill 手順はオンデマンドで読み込まれるため、通常のターンではトークンコスト全体を負担しません。

## ブラウザーコマンドまたはツールが見つからない

アップグレード後に `openclaw browser` が不明、`browser.request` が見つからない、またはエージェントがブラウザーツールを利用できないと報告する場合、通常の原因は `browser` を省略した `plugins.allow` リストがあり、ルートの `browser` 設定ブロックが存在しないことです。追加してください。

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

明示的なルート `browser` ブロック、たとえば `browser.enabled=true` または `browser.profiles.<name>` は、制限的な `plugins.allow` の下でも同梱ブラウザー Plugin を有効にします。これはチャンネル設定の動作と一致します。`plugins.entries.browser.enabled=true` と `tools.alsoAllow: ["browser"]` は、それだけでは allowlist メンバーシップの代わりにはなりません。`plugins.allow` を完全に削除してもデフォルトが復元されます。

## プロファイル: `openclaw` と `user`

- `openclaw`: 管理された分離ブラウザー (拡張機能は不要)。
- `user`: **実際のサインイン済み Chrome**
  セッション向けの組み込み Chrome MCP 接続プロファイル。

エージェントのブラウザーツール呼び出しでは:

- デフォルト: 分離された `openclaw` ブラウザーを使います。
- 既存のログイン済みセッションが重要で、接続プロンプトをクリック/承認するためにユーザーが
  コンピューターの前にいる場合は、`profile="user"` を優先します。
- 特定のブラウザーモードを使いたい場合、`profile` が明示的な上書きになります。

管理モードをデフォルトにしたい場合は、`browser.defaultProfile: "openclaw"` を設定します。

## 設定

ブラウザー設定は `~/.openclaw/openclaw.json` にあります。

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
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
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

- 制御サービスは、`gateway.port` から導出されたポートで loopback にバインドします (デフォルト `18791` = gateway + 2)。`gateway.port` または `OPENCLAW_GATEWAY_PORT` を上書きすると、導出されるポートも同じ系列でずれます。
- ローカルの `openclaw` プロファイルは `cdpPort`/`cdpUrl` を自動割り当てします。これらはリモート CDP の場合にのみ設定してください。`cdpUrl` は未設定時、管理対象ローカル CDP ポートをデフォルトにします。
- `remoteCdpTimeoutMs` は、リモートおよび `attachOnly` の CDP HTTP 到達性
  チェックとタブを開く HTTP リクエストに適用されます。`remoteCdpHandshakeTimeoutMs` は、
  それらの CDP WebSocket ハンドシェイクに適用されます。
- `localLaunchTimeoutMs` は、ローカルで起動された管理対象 Chrome
  プロセスが CDP HTTP エンドポイントを公開するまでの予算です。`localCdpReadyTimeoutMs` は、
  プロセス検出後の CDP websocket 準備完了までの追加予算です。
  Raspberry Pi、低性能 VPS、または Chromium
  の起動が遅い古いハードウェアでは、これらを増やしてください。値は `120000` ms までの正の整数である必要があり、無効な
  設定値は拒否されます。
- 管理対象 Chrome の起動/準備失敗が繰り返されると、プロファイルごとにサーキットブレークされます。
  連続して数回失敗した後、OpenClaw はブラウザーツール呼び出しのたびに Chromium を生成する代わりに、新しい起動
  試行を短時間停止します。起動問題を修正するか、不要ならブラウザーを無効にするか、修復後に
  Gateway を再起動してください。
- `actionTimeoutMs` は、呼び出し元が `timeoutMs` を渡さない場合のブラウザー `act` リクエストのデフォルト予算です。クライアント転送は小さな余裕ウィンドウを追加するため、長い待機が HTTP 境界でタイムアウトせず完了できます。
- `tabCleanup` は、プライマリエージェントのブラウザーセッションによって開かれたタブに対するベストエフォートのクリーンアップです。サブエージェント、Cron、ACP のライフサイクルクリーンアップは、セッション終了時に明示的に追跡されたタブを引き続き閉じます。プライマリセッションはアクティブなタブを再利用可能な状態に保ち、その後、アイドル状態または上限超過の追跡タブをバックグラウンドで閉じます。

</Accordion>

<Accordion title="SSRF ポリシー">

- ブラウザーのナビゲーションとタブを開く操作は、ナビゲーション前に SSRF ガードされ、その後の最終 `http(s)` URL でもベストエフォートで再チェックされます。
- 厳格な SSRF モードでは、リモート CDP エンドポイント検出と `/json/version` プローブ (`cdpUrl`) もチェックされます。
- Gateway/プロバイダーの `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、`NO_PROXY` 環境変数は、OpenClaw 管理ブラウザーを自動的にプロキシしません。管理対象 Chrome はデフォルトで直接起動するため、プロバイダーのプロキシ設定によってブラウザーの SSRF チェックが弱まることはありません。
- 管理対象ブラウザー自体をプロキシするには、`--proxy-server=...` や `--proxy-pac-url=...` など、明示的な Chrome プロキシフラグを `browser.extraArgs` 経由で渡します。厳格な SSRF モードでは、プライベートネットワークのブラウザーアクセスが意図的に有効化されていない限り、明示的なブラウザープロキシルーティングをブロックします。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` はデフォルトでオフです。プライベートネットワークのブラウザーアクセスが意図的に信頼されている場合にのみ有効にしてください。
- `browser.ssrfPolicy.allowPrivateNetwork` はレガシー別名として引き続きサポートされます。

</Accordion>

<Accordion title="プロファイルの動作">

- `attachOnly: true` は、ローカルブラウザーを起動せず、すでに実行中の場合にのみ接続することを意味します。
- `headless` はグローバルまたはローカル管理プロファイルごとに設定できます。プロファイルごとの値は `browser.headless` を上書きするため、ローカルで起動されたあるプロファイルはヘッドレスのままにし、別のプロファイルは表示されたままにできます。
- `POST /start?headless=true` と `openclaw browser start --headless` は、
  `browser.headless` やプロファイル設定を書き換えずに、ローカル管理プロファイルに対して
  一回限りのヘッドレス起動を要求します。既存セッション、attach-only、
  remote CDP プロファイルでは、OpenClaw がそれらのブラウザープロセスを起動しないため、
  この上書きは拒否されます。
- `DISPLAY` または `WAYLAND_DISPLAY` がない Linux ホストでは、環境またはプロファイル/グローバル
  設定が明示的に表示ありモードを選択していない場合、ローカル管理プロファイルは
  自動的にヘッドレスがデフォルトになります。`openclaw browser status --json` は
  `headlessSource` を `env`、`profile`、`config`、
  `request`、`linux-display-fallback`、または `default` として報告します。
- `OPENCLAW_BROWSER_HEADLESS=1` は、現在のプロセスでローカル管理起動をヘッドレスに強制します。
  `OPENCLAW_BROWSER_HEADLESS=0` は、通常の起動で表示ありモードを強制し、
  ディスプレイサーバーがない Linux ホストでは対応可能なエラーを返します。
  明示的な `start --headless` 要求は、その 1 回の起動については引き続き優先されます。
- `executablePath` はグローバルまたはローカル管理プロファイルごとに設定できます。プロファイルごとの値は `browser.executablePath` を上書きするため、管理プロファイルごとに異なる Chromium ベースのブラウザーを起動できます。どちらの形式でも、OS のホームディレクトリとして `~` を使用できます。
- `color` (トップレベルおよびプロファイルごと) は、どのプロファイルがアクティブかを確認できるようにブラウザー UI に色を付けます。
- デフォルトプロファイルは `openclaw` (管理スタンドアロン) です。サインイン済みユーザーブラウザーを使うには `defaultProfile: "user"` を使用します。
- 自動検出順序: Chromium ベースの場合はシステムのデフォルトブラウザー。それ以外の場合は Chrome → Brave → Edge → Chromium → Chrome Canary。
- `driver: "existing-session"` は、生の CDP ではなく Chrome DevTools MCP を使用します。その driver には `cdpUrl` を設定しないでください。
- existing-session プロファイルがデフォルト以外の Chromium ユーザープロファイル (Brave、Edge など) に接続する必要がある場合は、`browser.profiles.<name>.userDataDir` を設定します。このパスでも、OS のホームディレクトリとして `~` を使用できます。

</Accordion>

</AccordionGroup>

## Brave または別の Chromium ベースのブラウザーを使用する

**システムのデフォルト**ブラウザーが Chromium ベース (Chrome/Brave/Edge など) の場合、
OpenClaw はそれを自動的に使用します。自動検出を上書きするには
`browser.executablePath` を設定します。トップレベルおよびプロファイルごとの
`executablePath` 値では、OS のホームディレクトリとして `~` を使用できます。

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

または、プラットフォームごとに config で設定します。

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

プロファイルごとの `executablePath` は、OpenClaw が起動するローカル管理プロファイルにのみ影響します。
`existing-session` プロファイルは、代わりにすでに実行中のブラウザーに接続し、
remote CDP プロファイルは `cdpUrl` の背後にあるブラウザーを使用します。

## ローカル制御とリモート制御

- **ローカル制御 (デフォルト):** Gateway が loopback 制御サービスを開始し、ローカルブラウザーを起動できます。
- **リモート制御 (node host):** ブラウザーがあるマシンで node host を実行します。Gateway はブラウザー操作をそこへプロキシします。
- **Remote CDP:** リモートの Chromium ベースブラウザーに接続するには、`browser.profiles.<name>.cdpUrl` (または `browser.cdpUrl`) を設定します。この場合、OpenClaw はローカルブラウザーを起動しません。
- loopback 上の外部管理 CDP サービス (たとえば Docker で `127.0.0.1` に公開された Browserless) では、
  `attachOnly: true` も設定します。`attachOnly` のない loopback CDP は、
  ローカルの OpenClaw 管理ブラウザープロファイルとして扱われます。
- `headless` は、OpenClaw が起動するローカル管理プロファイルにのみ影響します。existing-session または remote CDP ブラウザーを再起動したり変更したりすることはありません。
- `executablePath` も同じローカル管理プロファイルルールに従います。実行中のローカル管理プロファイルでこれを変更すると、そのプロファイルは再起動/調整の対象としてマークされ、次回起動時に新しいバイナリが使われます。

停止時の動作はプロファイルモードによって異なります。

- ローカル管理プロファイル: `openclaw browser stop` は、
  OpenClaw が起動したブラウザープロセスを停止します
- attach-only および remote CDP プロファイル: `openclaw browser stop` は、
  OpenClaw がブラウザープロセスを起動していなくても、
  アクティブな制御セッションを閉じ、Playwright/CDP エミュレーションの上書き (viewport、
  color scheme、locale、timezone、offline mode、および類似の状態) を解放します

Remote CDP URL には auth を含めることができます。

- クエリトークン (例: `https://provider.example?token=<token>`)
- HTTP Basic auth (例: `https://user:pass@provider.example`)

OpenClaw は `/json/*` endpoints を呼び出すとき、および CDP WebSocket に接続するときに
auth を保持します。tokens を config ファイルにコミットする代わりに、
環境変数またはシークレットマネージャーを使用することを推奨します。

## Node ブラウザープロキシ (設定不要のデフォルト)

ブラウザーがあるマシンで **node host** を実行している場合、OpenClaw は
追加のブラウザー設定なしで、その node にブラウザーツール呼び出しを自動ルーティングできます。
これは remote gateways のデフォルト経路です。

注:

- node host は、**プロキシコマンド**を介して自身のローカルブラウザー制御サーバーを公開します。
- プロファイルは node 自身の `browser.profiles` config (ローカルと同じ) から取得されます。
- `nodeHost.browserProxy.allowProfiles` は任意です。従来/デフォルトの動作にするには空のままにします。設定済みのすべてのプロファイルが、プロファイル作成/削除 routes を含めてプロキシ経由で到達可能なままになります。
- `nodeHost.browserProxy.allowProfiles` を設定した場合、OpenClaw はそれを最小権限の境界として扱います。allowlist に含まれるプロファイルのみを対象にでき、永続プロファイルの作成/削除 routes はプロキシ面でブロックされます。
- 不要な場合は無効にします。
  - node 側: `nodeHost.browserProxy.enabled=false`
  - gateway 側: `gateway.nodes.browser.mode="off"`

## Browserless (ホスト型 remote CDP)

[Browserless](https://browserless.io) は、HTTPS と WebSocket 経由で
CDP 接続 URL を公開するホスト型 Chromium サービスです。OpenClaw はどちらの形式も使用できますが、
remote ブラウザープロファイルでは、Browserless の接続ドキュメントにある直接 WebSocket URL が
最も簡単な選択肢です。

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

注:

- `<BROWSERLESS_API_KEY>` を実際の Browserless token に置き換えます。
- Browserless アカウントに合う region endpoint を選択します (ドキュメントを参照)。
- Browserless が HTTPS base URL を提供する場合は、直接 CDP 接続用に
  `wss://` に変換するか、HTTPS URL のままにして OpenClaw に
  `/json/version` を検出させることができます。

### 同一ホスト上の Browserless Docker

Browserless が Docker でセルフホストされ、OpenClaw がホスト上で実行される場合、
Browserless を外部管理 CDP サービスとして扱います。

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

`browser.profiles.browserless.cdpUrl` のアドレスは、
OpenClaw プロセスから到達可能である必要があります。Browserless も、一致する到達可能な endpoint を通知する必要があります。
Browserless `EXTERNAL` を、OpenClaw から見た同じ public-to-OpenClaw WebSocket base に設定してください。
例: `ws://127.0.0.1:3000`、`ws://browserless:3000`、または安定した private Docker
network address。`/json/version` が OpenClaw から到達できないアドレスを指す
`webSocketDebuggerUrl` を返す場合、CDP HTTP は正常に見えても
WebSocket 接続は失敗することがあります。

loopback Browserless プロファイルでは `attachOnly` を未設定のままにしないでください。
`attachOnly` がない場合、OpenClaw は loopback ポートをローカル管理ブラウザー
プロファイルとして扱い、そのポートが使用中だが OpenClaw に所有されていないと報告することがあります。

## 直接 WebSocket CDP プロバイダー

一部のホスト型ブラウザーサービスは、標準の HTTP ベース CDP 検出 (`/json/version`) ではなく
**直接 WebSocket** endpoint を公開します。OpenClaw は 3 つの
CDP URL 形式を受け入れ、適切な接続戦略を自動的に選択します。

- **HTTP(S) 検出** - `http://host[:port]` または `https://host[:port]`。
  OpenClaw は `/json/version` を呼び出して WebSocket debugger URL を検出し、その後
  接続します。WebSocket fallback はありません。
- **直接 WebSocket endpoints** - `ws://host[:port]/devtools/<kind>/<id>` または
  `/devtools/browser|page|worker|shared_worker|service_worker/<id>` パスを持つ `wss://...`。
  OpenClaw は WebSocket handshake 経由で直接接続し、
  `/json/version` を完全にスキップします。
- **Bare WebSocket roots** - `/devtools/...` パスのない
  `ws://host[:port]` または `wss://host[:port]` (例: [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com))。OpenClaw はまず HTTP
  `/json/version` 検出を試みます (scheme を `http`/`https` に正規化します)。
  検出が `webSocketDebuggerUrl` を返した場合はそれを使用し、そうでない場合は OpenClaw
  が bare root での直接 WebSocket handshake に fallback します。通知された
  WebSocket endpoint が CDP handshake を拒否しても、設定された bare root が
  受け入れる場合、OpenClaw はその root にも fallback します。これにより、ローカル Chrome を指す bare `ws://`
  でも接続できます。Chrome は `/json/version` から得られるターゲットごとの特定パスでのみ
  WebSocket upgrades を受け入れる一方、ホスト型プロバイダーは、検出
  endpoint が Playwright CDP に適さない短命 URL を通知する場合でも、
  root WebSocket endpoint を使い続けられます。

### Browserbase

[Browserbase](https://www.browserbase.com) は、組み込みの CAPTCHA 解決、stealth mode、
および residential proxies を備えたヘッドレスブラウザーを実行するためのクラウドプラットフォームです。

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

注:

- [サインアップ](https://www.browserbase.com/sign-up) して、[概要ダッシュボード](https://www.browserbase.com/overview) から **API Key** をコピーします。
- `<BROWSERBASE_API_KEY>` を実際の Browserbase API key に置き換えます。
- Browserbase は WebSocket 接続時にブラウザーセッションを自動作成するため、
  手動でセッションを作成する手順は不要です。
- 無料枠では同時セッション 1 つと、月 1 ブラウザー時間が許可されます。
  有料プランの制限については [pricing](https://www.browserbase.com/pricing) を参照してください。
- 完全な API reference、SDK guides、integration examples については
  [Browserbase docs](https://docs.browserbase.com) を参照してください。

## セキュリティ

主要な考え方:

- ブラウザー制御はループバック専用です。アクセスは Gateway の認証またはノードペアリングを通じて流れます。
- スタンドアロンのループバックブラウザー HTTP API は **共有シークレット認証のみ**を使用します:
  Gateway トークンのベアラー認証、`x-openclaw-password`、または
  設定済み Gateway パスワードによる HTTP Basic 認証。
- Tailscale Serve の ID ヘッダーと `gateway.auth.mode: "trusted-proxy"` は、
  このスタンドアロンのループバックブラウザー API を**認証しません**。
- ブラウザー制御が有効で、共有シークレット認証が設定されていない場合、OpenClaw は
  その起動用にランタイム専用の Gateway トークンを生成します。再起動をまたいで
  クライアントに安定したシークレットが必要な場合は、`gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN`、または
  `OPENCLAW_GATEWAY_PASSWORD` を明示的に設定してください。
- `gateway.auth.mode` がすでに `password`、`none`、または `trusted-proxy` の場合、
  OpenClaw はそのトークンを自動生成**しません**。
- Gateway とすべてのノードホストはプライベートネットワーク（Tailscale）上に置き、公開は避けてください。
- リモート CDP の URL/トークンはシークレットとして扱い、env vars またはシークレットマネージャーを優先してください。

リモート CDP のヒント:

- 可能な場合は、暗号化されたエンドポイント（HTTPS または WSS）と短命トークンを優先してください。
- 長命トークンを設定ファイルに直接埋め込むことは避けてください。

## プロファイル（マルチブラウザー）

OpenClaw は複数の名前付きプロファイル（ルーティング設定）をサポートします。プロファイルには次の種類があります:

- **openclaw-managed**: 専用の Chromium ベースのブラウザーインスタンス。独自のユーザーデータディレクトリ + CDP ポートを持ちます
- **remote**: 明示的な CDP URL（別の場所で実行されている Chromium ベースのブラウザー）
- **existing session**: Chrome DevTools MCP の自動接続を介した既存の Chrome プロファイル

デフォルト:

- `openclaw` プロファイルは存在しない場合に自動作成されます。
- `user` プロファイルは Chrome MCP の既存セッションアタッチ用に組み込まれています。
- 既存セッションプロファイルは `user` 以外ではオプトインです。`--driver existing-session` で作成します。
- ローカル CDP ポートはデフォルトで **18800-18899** から割り当てられます。
- プロファイルを削除すると、そのローカルデータディレクトリはゴミ箱に移動されます。

すべての制御エンドポイントは `?profile=<name>` を受け付けます。CLI は `--browser-profile` を使用します。

## Chrome DevTools MCP による既存セッション

OpenClaw は、公式 Chrome DevTools MCP サーバーを通じて、実行中の Chromium ベースのブラウザープロファイルにもアタッチできます。これにより、そのブラウザープロファイルですでに開いているタブとログイン状態を再利用します。

公式の背景情報と設定リファレンス:

- [Chrome for Developers: ブラウザーセッションで Chrome DevTools MCP を使用する](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

組み込みプロファイル:

- `user`

任意: 別の名前、色、またはブラウザーデータディレクトリが必要な場合は、独自のカスタム既存セッションプロファイルを作成します。

デフォルトの動作:

- 組み込みの `user` プロファイルは Chrome MCP 自動接続を使用し、デフォルトのローカル Google Chrome プロファイルを対象にします。

Brave、Edge、Chromium、またはデフォルト以外の Chrome プロファイルには `userDataDir` を使用します。
`~` は OS のホームディレクトリに展開されます:

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

次に、対応するブラウザーで:

1. リモートデバッグ用のそのブラウザーの inspect ページを開きます。
2. リモートデバッグを有効にします。
3. ブラウザーを実行したままにし、OpenClaw がアタッチするときの接続プロンプトを承認します。

一般的な inspect ページ:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

ライブアタッチのスモークテスト:

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
- `tabs` にすでに開いているブラウザータブが一覧表示される
- `snapshot` が選択中のライブタブから refs を返す

アタッチが機能しない場合に確認すること:

- 対象の Chromium ベースのブラウザーがバージョン `144+` である
- そのブラウザーの inspect ページでリモートデバッグが有効である
- ブラウザーがアタッチ同意プロンプトを表示し、それを承認した
- `openclaw doctor` は古い拡張機能ベースのブラウザー設定を移行し、
  デフォルトの自動接続プロファイル向けに Chrome がローカルにインストールされていることを確認しますが、
  ブラウザー側のリモートデバッグを有効にすることはできません

エージェントでの使用:

- ユーザーのログイン済みブラウザー状態が必要な場合は `profile="user"` を使用します。
- カスタム既存セッションプロファイルを使用する場合は、その明示的なプロファイル名を渡します。
- このモードは、ユーザーがコンピューターの前にいてアタッチプロンプトを承認できる場合にのみ選択してください。
- Gateway またはノードホストは `npx chrome-devtools-mcp@latest --autoConnect` を起動できます

注記:

- この経路は、サインイン済みブラウザーセッション内で動作できるため、分離された `openclaw` プロファイルよりもリスクが高くなります。
- OpenClaw はこのドライバーではブラウザーを起動しません。アタッチのみを行います。
- ここでは OpenClaw は公式 Chrome DevTools MCP の `--autoConnect` フローを使用します。`userDataDir` が設定されている場合は、そのユーザーデータディレクトリを対象にするためにそのまま渡されます。
- 既存セッションは、選択されたホスト上、または接続済みのブラウザーノード経由でアタッチできます。Chrome が別の場所にあり、ブラウザーノードが接続されていない場合は、代わりにリモート CDP またはノードホストを使用してください。

### カスタム Chrome MCP 起動

デフォルトの `npx chrome-devtools-mcp@latest` フローが目的に合わない場合（オフラインホスト、
固定バージョン、ベンダー提供バイナリ）、プロファイルごとに起動される Chrome DevTools MCP サーバーを上書きします:

| フィールド        | 動作                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | `npx` の代わりに起動する実行ファイル。指定どおりに解決されます。絶対パスも尊重されます。                                          |
| `mcpArgs`    | `mcpCommand` にそのまま渡される引数配列。デフォルトの `chrome-devtools-mcp@latest --autoConnect` 引数を置き換えます。 |

既存セッションプロファイルに `cdpUrl` が設定されている場合、OpenClaw は
`--autoConnect` をスキップし、エンドポイントを Chrome MCP に自動的に転送します:

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP 検出エンドポイント）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接 CDP WebSocket）。

エンドポイントフラグと `userDataDir` は併用できません。`cdpUrl` が設定されている場合、
Chrome MCP はプロファイルディレクトリを開くのではなくエンドポイント背後の
実行中ブラウザーにアタッチするため、Chrome MCP 起動では `userDataDir` は無視されます。

<Accordion title="既存セッション機能の制限">

管理対象の `openclaw` プロファイルと比べて、既存セッションドライバーにはより多くの制約があります:

- **スクリーンショット** - ページキャプチャと `--ref` 要素キャプチャは機能します。CSS `--element` セレクターは機能しません。`--full-page` は `--ref` または `--element` と組み合わせられません。ページまたは ref ベースの要素スクリーンショットに Playwright は不要です。
- **アクション** - `click`、`type`、`hover`、`scrollIntoView`、`drag`、`select` にはスナップショット refs が必要です（CSS セレクターは不可）。`click-coords` は表示中ビューポート座標をクリックし、スナップショット ref は不要です。`click` は左ボタンのみです。`type` は `slowly=true` をサポートしません。`fill` または `press` を使用してください。`press` は `delayMs` をサポートしません。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill`、`evaluate` は呼び出しごとのタイムアウトをサポートしません。`select` は単一の値を受け付けます。
- **待機 / アップロード / ダイアログ** - `wait --url` は完全一致、部分文字列、glob パターンをサポートします。`wait --load networkidle` はサポートされません。アップロードフックには `ref` または `inputRef` が必要で、一度に 1 ファイルのみ、CSS `element` は不可です。ダイアログフックはタイムアウト上書きをサポートしません。
- **管理対象のみの機能** - バッチアクション、PDF エクスポート、ダウンロードインターセプト、`responsebody` には引き続き管理対象ブラウザー経路が必要です。

</Accordion>

## 分離保証

- **専用ユーザーデータディレクトリ**: 個人のブラウザープロファイルには一切触れません。
- **専用ポート**: 開発ワークフローとの衝突を防ぐため、`9222` を避けます。
- **決定的なタブ制御**: `tabs` は最初に `suggestedTargetId` を返し、その後に
  `t1` のような安定した `tabId` ハンドル、任意のラベル、生の `targetId` を返します。
  エージェントは `suggestedTargetId` を再利用するべきです。生の ID は
  デバッグと互換性のために引き続き利用できます。

## ブラウザー選択

ローカルで起動する場合、OpenClaw は最初に利用可能なものを選択します:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath` で上書きできます。

プラットフォーム:

- macOS: `/Applications` と `~/Applications` を確認します。
- Linux: `/usr/bin`、`/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium`、および
  `/usr/lib/chromium-browser` 配下の一般的な Chrome/Brave/Edge/Chromium の場所を確認します。
- Windows: 一般的なインストール場所を確認します。

## 制御 API（任意）

スクリプト作成とデバッグ向けに、Gateway は小さな**ループバック専用 HTTP
制御 API** と、それに対応する `openclaw browser` CLI（スナップショット、refs、待機
パワーアップ、JSON 出力、デバッグワークフロー）を公開します。完全なリファレンスは
[ブラウザー制御 API](/ja-JP/tools/browser-control) を参照してください。

## トラブルシューティング

Linux 固有の問題（特に snap Chromium）については、
[ブラウザーのトラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting) を参照してください。

WSL2 Gateway + Windows Chrome の分割ホスト構成については、
[WSL2 + Windows + リモート Chrome CDP のトラブルシューティング](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting) を参照してください。

### CDP 起動失敗とナビゲーション SSRF ブロック

これらは異なる失敗クラスであり、異なるコードパスを指します。

- **CDP 起動または準備完了の失敗**は、OpenClaw がブラウザー制御プレーンの健全性を確認できないことを意味します。
- **ナビゲーション SSRF ブロック**は、ブラウザー制御プレーンは健全だが、ページナビゲーション対象がポリシーによって拒否されたことを意味します。

一般的な例:

- CDP 起動または準備完了の失敗:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` は、
    ループバック外部 CDP サービスが `attachOnly: true` なしで設定されている場合に発生します
- ナビゲーション SSRF ブロック:
  - `start` と `tabs` は引き続き機能している一方で、`open`、`navigate`、スナップショット、またはタブを開くフローがブラウザー/ネットワークポリシーエラーで失敗する

この 2 つを切り分けるには、次の最小シーケンスを使用します:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

結果の読み方:

- `start` が `not reachable after start` で失敗する場合は、まず CDP の準備完了をトラブルシューティングします。
- `start` は成功するが `tabs` が失敗する場合、制御プレーンはまだ不健全です。これはページナビゲーションの問題ではなく、CDP 到達性の問題として扱います。
- `start` と `tabs` は成功するが `open` または `navigate` が失敗する場合、ブラウザー制御プレーンは起動済みで、失敗はナビゲーションポリシーまたは対象ページにあります。
- `start`、`tabs`、`open` がすべて成功する場合、基本的な管理対象ブラウザー制御経路は健全です。

重要な動作の詳細:

- ブラウザー設定は、`browser.ssrfPolicy` を設定していない場合でも、デフォルトで fail-closed SSRF ポリシーオブジェクトになります。
- ローカルループバックの `openclaw` 管理対象プロファイルでは、CDP ヘルスチェックは OpenClaw 自身のローカル制御プレーンに対するブラウザー SSRF 到達性の適用を意図的にスキップします。
- ナビゲーション保護は別です。`start` または `tabs` の成功結果は、後続の `open` または `navigate` 対象が許可されることを意味しません。

セキュリティガイダンス:

- デフォルトでブラウザー SSRF ポリシーを緩和**しない**でください。
- 広範なプライベートネットワークアクセスよりも、`hostnameAllowlist` や `allowedHostnames` のような狭いホスト例外を優先してください。
- `dangerouslyAllowPrivateNetwork: true` は、プライベートネットワークのブラウザーアクセスが必要でレビュー済みの、意図的に信頼された環境でのみ使用してください。

## エージェントツール + 制御の仕組み

エージェントにはブラウザー自動化用に**1つのツール**が与えられます:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

対応関係:

- `browser snapshot` は安定した UI ツリー (AI または ARIA) を返します。
- `browser act` はスナップショットの `ref` ID を使ってクリック/入力/ドラッグ/選択します。
- `browser screenshot` はピクセルをキャプチャします (ページ全体、要素、またはラベル付き ref)。
- `browser doctor` は Gateway、Plugin、プロファイル、ブラウザー、タブの準備状態を確認します。
- `browser` は以下を受け付けます:
  - 名前付きブラウザープロファイル (openclaw、chrome、またはリモート CDP) を選ぶための `profile`。
  - ブラウザーが存在する場所を選択するための `target` (`sandbox` | `host` | `node`)。
  - サンドボックス化されたセッションでは、`target: "host"` に `agents.defaults.sandbox.browser.allowHostControl=true` が必要です。
  - `target` が省略された場合: サンドボックス化されたセッションはデフォルトで `sandbox`、非サンドボックスセッションはデフォルトで `host` になります。
  - ブラウザー対応ノードが接続されている場合、`target="host"` または `target="node"` を固定しない限り、ツールはそこへ自動ルーティングすることがあります。

これにより、エージェントの動作は決定的になり、壊れやすいセレクターを避けられます。

## 関連

- [ツール概要](/ja-JP/tools) - 利用可能なすべてのエージェントツール
- [サンドボックス化](/ja-JP/gateway/sandboxing) - サンドボックス化された環境でのブラウザー制御
- [セキュリティ](/ja-JP/gateway/security) - ブラウザー制御のリスクと堅牢化
