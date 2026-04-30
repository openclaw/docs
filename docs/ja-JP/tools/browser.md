---
read_when:
    - エージェント制御のブラウザー自動化の追加
    - OpenClawが自分のChromeに干渉している理由をデバッグする
    - macOS アプリでブラウザー設定 + ライフサイクルを実装する
summary: 統合ブラウザー制御サービス + アクションコマンド
title: ブラウザー（OpenClaw管理）
x-i18n:
    generated_at: "2026-04-30T05:36:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8f0456505f4e1711626a539a0a0c48d67ca10d4788838eb53855bc83c766d2f
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw は、エージェントが制御する **専用の Chrome/Brave/Edge/Chromium プロファイル**を実行できます。
これは個人用ブラウザーから分離され、Gateway 内の小さなローカル
制御サービス（ループバックのみ）を通じて管理されます。

初心者向けの見方:

- **エージェント専用の別ブラウザー**と考えてください。
- `openclaw` プロファイルは、個人用ブラウザープロファイルには**触れません**。
- エージェントは安全なレーンで**タブを開く、ページを読む、クリックする、入力する**ことができます。
- 組み込みの `user` プロファイルは、Chrome MCP 経由で実際にサインイン済みの Chrome セッションに接続します。

## 利用できるもの

- **openclaw** という名前の別ブラウザープロファイル（デフォルトではオレンジのアクセント）。
- 決定的なタブ制御（一覧表示/開く/フォーカス/閉じる）。
- エージェント操作（クリック/入力/ドラッグ/選択）、スナップショット、スクリーンショット、PDF。
- ブラウザー Plugin が有効なときに、スナップショット、
  安定タブ、古い参照、手動ブロッカー復旧ループをエージェントに教える、同梱の `browser-automation` skill。
- 任意の複数プロファイル対応（`openclaw`、`work`、`remote`、...）。

このブラウザーは**日常使用のブラウザーではありません**。エージェントによる自動化と検証のための、
安全で分離されたサーフェスです。

## クイックスタート

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

「Browser disabled」と表示される場合は、設定で有効化して（下記参照）、
Gateway を再起動してください。

`openclaw browser` が完全に存在しない場合、またはエージェントがブラウザーツールを
利用できないと言う場合は、[ブラウザーコマンドまたはツールが見つからない](/ja-JP/tools/browser#missing-browser-command-or-tool)に進んでください。

## Plugin 制御

デフォルトの `browser` ツールは同梱 Plugin です。同じ `browser` ツール名を登録する別の Plugin に置き換えるには無効化します。

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

デフォルトでは、`plugins.entries.browser.enabled` **と** `browser.enabled=true` の両方が必要です。Plugin だけを無効化すると、`openclaw browser` CLI、`browser.request` Gateway メソッド、エージェントツール、制御サービスが 1 つの単位として削除されます。置き換え用に `browser.*` 設定はそのまま残ります。

ブラウザー設定の変更では、Plugin がサービスを再登録できるように Gateway の再起動が必要です。

## エージェントガイダンス

ツールプロファイルの注記: `tools.profile: "coding"` には `web_search` と
`web_fetch` が含まれますが、完全な `browser` ツールは含まれません。エージェントまたは
起動されたサブエージェントがブラウザー自動化を使う必要がある場合は、プロファイル
段階で browser を追加します。

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

単一エージェントでは、`agents.list[].tools.alsoAllow: ["browser"]` を使います。
`tools.subagents.tools.allow: ["browser"]` だけでは不十分です。サブエージェント
ポリシーはプロファイルフィルタリングの後に適用されるためです。

ブラウザー Plugin には、2 段階のエージェントガイダンスが同梱されています。

- `browser` ツール説明には、常時有効のコンパクトな契約が含まれます: 適切な
  プロファイルを選び、参照を同じタブ上に保ち、タブ
  ターゲティングに `tabId`/ラベルを使い、複数ステップの作業ではブラウザー skill を読み込む。
- 同梱の `browser-automation` skill には、より長い運用ループが含まれます:
  最初にステータス/タブを確認し、タスクタブにラベルを付け、操作前にスナップショットを取り、UI 変更後に再スナップショットを取り、
  古い参照を一度復旧し、ログイン/2FA/captcha または
  カメラ/マイクのブロッカーは推測せず手動操作として報告する。

Plugin 同梱の Skills は、Plugin が有効なときにエージェントの利用可能な Skills に一覧表示されます。
完全な skill 手順は必要に応じて読み込まれるため、通常のターンで完全なトークンコストは発生しません。

## ブラウザーコマンドまたはツールが見つからない

アップグレード後に `openclaw browser` が不明、`browser.request` が見つからない、またはエージェントがブラウザーツールを利用不可と報告する場合、通常の原因は `browser` を省略した `plugins.allow` リストがあり、ルートの `browser` 設定ブロックが存在しないことです。次を追加してください。

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

明示的なルート `browser` ブロック、たとえば `browser.enabled=true` または `browser.profiles.<name>` は、制限的な `plugins.allow` の下でも同梱ブラウザー Plugin を有効化し、チャネル設定の動作と一致します。`plugins.entries.browser.enabled=true` と `tools.alsoAllow: ["browser"]` は、それだけでは allowlist メンバーシップの代替にはなりません。`plugins.allow` を完全に削除しても、デフォルトが復元されます。

## プロファイル: `openclaw` と `user`

- `openclaw`: 管理対象の分離ブラウザー（拡張機能は不要）。
- `user`: **実際にサインイン済みの Chrome** セッション向けの組み込み Chrome MCP 接続プロファイル。

エージェントのブラウザーツール呼び出しでは:

- デフォルト: 分離された `openclaw` ブラウザーを使います。
- 既存のログイン済みセッションが重要で、ユーザーがコンピューターの前で接続プロンプトをクリック/承認できる場合は、`profile="user"` を優先します。
- 特定のブラウザーモードを使いたい場合、`profile` が明示的なオーバーライドです。

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

<Accordion title="ポートと到達性">

- 制御サービスは、`gateway.port` から派生したポートでループバックにバインドします（デフォルト `18791` = gateway + 2）。`gateway.port` または `OPENCLAW_GATEWAY_PORT` をオーバーライドすると、派生ポートも同じ系列でずれます。
- ローカル `openclaw` プロファイルは `cdpPort`/`cdpUrl` を自動割り当てします。これらはリモート CDP の場合だけ設定してください。`cdpUrl` は未設定の場合、管理対象ローカル CDP ポートにデフォルト設定されます。
- `remoteCdpTimeoutMs` は、リモートおよび `attachOnly` CDP HTTP 到達性
  チェックとタブを開く HTTP リクエストに適用されます。`remoteCdpHandshakeTimeoutMs` は、
  それらの CDP WebSocket ハンドシェイクに適用されます。
- `localLaunchTimeoutMs` は、ローカルで起動された管理対象 Chrome
  プロセスが CDP HTTP エンドポイントを公開するまでの予算です。`localCdpReadyTimeoutMs` は、
  プロセス検出後の CDP websocket 準備完了に対する追加予算です。
  Chromium の起動が遅い Raspberry Pi、低スペック VPS、古いハードウェアではこれらを増やしてください。
  値は `120000` ms までの正の整数である必要があります。無効な
  設定値は拒否されます。
- 管理対象 Chrome の起動/準備完了の失敗が繰り返されると、プロファイルごとに
  サーキットブレークされます。連続して数回失敗した後、OpenClaw はブラウザーツール呼び出しのたびに Chromium を生成するのではなく、新しい起動試行を一時的に停止します。
  起動問題を修正するか、不要な場合はブラウザーを無効化するか、修復後に
  Gateway を再起動してください。
- `actionTimeoutMs` は、呼び出し元が `timeoutMs` を渡さない場合のブラウザー `act` リクエストのデフォルト予算です。クライアントトランスポートは小さな余裕ウィンドウを追加するため、長い待機は HTTP 境界でタイムアウトせずに完了できます。
- `tabCleanup` は、プライマリエージェントのブラウザーセッションによって開かれたタブに対するベストエフォートのクリーンアップです。サブエージェント、cron、ACP のライフサイクルクリーンアップは、セッション終了時に明示的に追跡されたタブを引き続き閉じます。プライマリセッションはアクティブなタブを再利用可能な状態に保ち、その後、アイドル状態または過剰な追跡タブをバックグラウンドで閉じます。

</Accordion>

<Accordion title="SSRF ポリシー">

- ブラウザーのナビゲーションとタブを開く操作は、ナビゲーション前に SSRF ガードされ、後で最終的な `http(s)` URL に対してベストエフォートで再チェックされます。
- 厳格な SSRF モードでは、リモート CDP エンドポイント検出と `/json/version` プローブ（`cdpUrl`）もチェックされます。
- Gateway/プロバイダーの `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、`NO_PROXY` 環境変数は、OpenClaw 管理ブラウザーを自動的にはプロキシしません。管理対象 Chrome はデフォルトで直接起動するため、プロバイダーのプロキシ設定がブラウザー SSRF チェックを弱めることはありません。
- 管理対象ブラウザー自体をプロキシするには、`--proxy-server=...` や `--proxy-pac-url=...` など、`browser.extraArgs` 経由で明示的な Chrome プロキシフラグを渡してください。厳格な SSRF モードでは、private-network ブラウザーアクセスが意図的に有効化されていない限り、明示的なブラウザープロキシルーティングはブロックされます。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` はデフォルトでオフです。private-network ブラウザーアクセスを意図的に信頼する場合にのみ有効化してください。
- `browser.ssrfPolicy.allowPrivateNetwork` は従来のエイリアスとして引き続きサポートされます。

</Accordion>

<Accordion title="プロファイルの動作">

- `attachOnly: true` はローカルブラウザーを起動せず、すでに実行中の場合にのみアタッチすることを意味します。
- `headless` はグローバルまたはローカル管理プロファイルごとに設定できます。プロファイルごとの値は `browser.headless` を上書きするため、あるローカル起動プロファイルをヘッドレスのままにし、別のプロファイルを表示状態のままにできます。
- `POST /start?headless=true` と `openclaw browser start --headless` は、
  `browser.headless` やプロファイル設定を書き換えずに、ローカル管理プロファイルの
  一度限りのヘッドレス起動を要求します。既存セッション、アタッチ専用、リモート CDP
  プロファイルは、OpenClaw がそれらのブラウザープロセスを起動しないため、この上書きを拒否します。
- `DISPLAY` または `WAYLAND_DISPLAY` がない Linux ホストでは、環境またはプロファイル/グローバル
  設定がヘッドありモードを明示的に選択していない場合、ローカル管理プロファイルは
  自動的にヘッドレスになります。`openclaw browser status --json` は
  `headlessSource` を `env`、`profile`、`config`、
  `request`、`linux-display-fallback`、または `default` として報告します。
- `OPENCLAW_BROWSER_HEADLESS=1` は、現在のプロセスでローカル管理起動をヘッドレスに強制します。
  `OPENCLAW_BROWSER_HEADLESS=0` は通常の起動をヘッドありモードに強制し、
  ディスプレイサーバーがない Linux ホストでは実行可能なエラーを返します。
  明示的な `start --headless` 要求は、その 1 回の起動では引き続き優先されます。
- `executablePath` はグローバルまたはローカル管理プロファイルごとに設定できます。プロファイルごとの値は `browser.executablePath` を上書きするため、管理プロファイルごとに異なる Chromium ベースのブラウザーを起動できます。どちらの形式も、OS のホームディレクトリとして `~` を受け付けます。
- `color` (トップレベルおよびプロファイルごと) はブラウザー UI に色を付け、どのプロファイルがアクティブかを確認できるようにします。
- デフォルトプロファイルは `openclaw` (管理対象のスタンドアロン) です。サインイン済みユーザーブラウザーを使うには `defaultProfile: "user"` を使用します。
- 自動検出順: システムのデフォルトブラウザーが Chromium ベースの場合はそれを使用。それ以外は Chrome → Brave → Edge → Chromium → Chrome Canary。
- `driver: "existing-session"` は生の CDP ではなく Chrome DevTools MCP を使用します。そのドライバーには `cdpUrl` を設定しないでください。
- 既存セッションプロファイルがデフォルト以外の Chromium ユーザープロファイル (Brave、Edge など) にアタッチする必要がある場合は、`browser.profiles.<name>.userDataDir` を設定します。このパスも、OS のホームディレクトリとして `~` を受け付けます。

</Accordion>

</AccordionGroup>

## Brave または別の Chromium ベースブラウザーを使用する

**システムのデフォルト** ブラウザーが Chromium ベース (Chrome/Brave/Edge など) の場合、
OpenClaw はそれを自動的に使用します。自動検出を上書きするには
`browser.executablePath` を設定します。トップレベルおよびプロファイルごとの
`executablePath` 値は、OS のホームディレクトリとして `~` を受け付けます。

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

または、プラットフォームごとに設定で指定します。

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
`existing-session` プロファイルは代わりにすでに実行中のブラウザーにアタッチし、
リモート CDP プロファイルは `cdpUrl` の背後にあるブラウザーを使用します。

## ローカル制御とリモート制御

- **ローカル制御 (デフォルト):** Gateway がループバック制御サービスを開始し、ローカルブラウザーを起動できます。
- **リモート制御 (ノードホスト):** ブラウザーがあるマシンでノードホストを実行します。Gateway はブラウザー操作をそこへプロキシします。
- **リモート CDP:** リモートの Chromium ベースブラウザーにアタッチするには、
  `browser.profiles.<name>.cdpUrl` (または `browser.cdpUrl`) を設定します。
  この場合、OpenClaw はローカルブラウザーを起動しません。
- ループバック上の外部管理 CDP サービス (たとえば Docker で
  `127.0.0.1` に公開された Browserless) では、`attachOnly: true` も設定します。
  `attachOnly` のないループバック CDP は、ローカルの OpenClaw 管理ブラウザープロファイルとして扱われます。
- `headless` は、OpenClaw が起動するローカル管理プロファイルにのみ影響します。既存セッションまたはリモート CDP ブラウザーを再起動したり変更したりしません。
- `executablePath` も同じローカル管理プロファイルの規則に従います。実行中のローカル管理プロファイルでこれを変更すると、
  そのプロファイルは再起動/調整の対象としてマークされ、次回の起動で新しいバイナリが使用されます。

停止動作はプロファイルモードによって異なります。

- ローカル管理プロファイル: `openclaw browser stop` は
  OpenClaw が起動したブラウザープロセスを停止します
- アタッチ専用およびリモート CDP プロファイル: `openclaw browser stop` は、OpenClaw によって
  ブラウザープロセスが起動されていなくても、アクティブな制御セッションを閉じ、
  Playwright/CDP エミュレーションの上書き (ビューポート、
  カラースキーム、ロケール、タイムゾーン、オフラインモード、および同様の状態) を解放します

リモート CDP URL には認証を含めることができます。

- クエリトークン (例: `https://provider.example?token=<token>`)
- HTTP Basic 認証 (例: `https://user:pass@provider.example`)

OpenClaw は `/json/*` エンドポイントの呼び出し時および CDP WebSocket への接続時に
認証を保持します。トークンを設定ファイルにコミットする代わりに、
環境変数またはシークレットマネージャーを優先してください。

## Node ブラウザープロキシ (ゼロ設定のデフォルト)

ブラウザーがあるマシンで **ノードホスト** を実行している場合、OpenClaw は
追加のブラウザー設定なしで、そのノードへブラウザーツール呼び出しを自動ルーティングできます。
これはリモート Gateway のデフォルトパスです。

注意:

- ノードホストは、ローカルブラウザー制御サーバーを **プロキシコマンド** 経由で公開します。
- プロファイルは、ノード自身の `browser.profiles` 設定 (ローカルと同じ) から取得されます。
- `nodeHost.browserProxy.allowProfiles` は任意です。従来/デフォルトの動作では空のままにしてください。プロファイル作成/削除ルートを含め、設定済みのすべてのプロファイルがプロキシ経由で到達可能なままになります。
- `nodeHost.browserProxy.allowProfiles` を設定すると、OpenClaw はそれを最小権限の境界として扱います。許可リストにあるプロファイルのみを対象にでき、永続プロファイルの作成/削除ルートはプロキシ面でブロックされます。
- 不要な場合は無効にします。
  - ノード上: `nodeHost.browserProxy.enabled=false`
  - Gateway 上: `gateway.nodes.browser.mode="off"`

## Browserless (ホスト型リモート CDP)

[Browserless](https://browserless.io) は、HTTPS と WebSocket 経由で
CDP 接続 URL を公開するホスト型 Chromium サービスです。OpenClaw はどちらの形式も使用できますが、
リモートブラウザープロファイルでは、Browserless の接続ドキュメントにある直接 WebSocket URL が
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

注意:

- `<BROWSERLESS_API_KEY>` を実際の Browserless トークンに置き換えます。
- Browserless アカウントに一致するリージョンエンドポイントを選択します (ドキュメントを参照)。
- Browserless が HTTPS ベース URL を提供する場合は、直接 CDP 接続用に
  `wss://` に変換するか、HTTPS URL のままにして OpenClaw に
  `/json/version` を検出させることができます。

### 同じホスト上の Browserless Docker

Browserless を Docker でセルフホストし、OpenClaw がホスト上で実行される場合は、
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
OpenClaw プロセスから到達可能である必要があります。Browserless も一致する到達可能なエンドポイントを公開する必要があります。
Browserless の `EXTERNAL` を、OpenClaw から見た同じ WebSocket ベースに設定します。
たとえば `ws://127.0.0.1:3000`、`ws://browserless:3000`、または安定したプライベート Docker
ネットワークアドレスです。`/json/version` が OpenClaw から到達できないアドレスを指す
`webSocketDebuggerUrl` を返す場合、CDP HTTP は正常に見えても WebSocket
アタッチは失敗することがあります。

ループバック Browserless プロファイルで `attachOnly` を未設定のままにしないでください。
`attachOnly` がない場合、OpenClaw はループバックポートをローカル管理ブラウザー
プロファイルとして扱い、そのポートは使用中だが OpenClaw に所有されていないと報告することがあります。

## 直接 WebSocket CDP プロバイダー

一部のホスト型ブラウザーサービスは、標準の HTTP ベース CDP 検出 (`/json/version`) ではなく
**直接 WebSocket** エンドポイントを公開します。OpenClaw は 3 種類の
CDP URL 形式を受け付け、適切な接続戦略を自動的に選択します。

- **HTTP(S) 検出** — `http://host[:port]` または `https://host[:port]`。
  OpenClaw は `/json/version` を呼び出して WebSocket デバッガー URL を検出し、
  その後接続します。WebSocket フォールバックはありません。
- **直接 WebSocket エンドポイント** — `ws://host[:port]/devtools/<kind>/<id>` または
  `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  パスを持つ `wss://...`。OpenClaw は WebSocket ハンドシェイク経由で直接接続し、
  `/json/version` を完全にスキップします。
- **ベア WebSocket ルート** — `/devtools/...` パスのない
  `ws://host[:port]` または `wss://host[:port]` (例: [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com))。OpenClaw はまず HTTP
  `/json/version` 検出を試行します (スキームを `http`/`https` に正規化)。
  検出で `webSocketDebuggerUrl` が返された場合はそれを使用し、それ以外の場合は OpenClaw
  がベア ルートで直接 WebSocket ハンドシェイクへフォールバックします。公開された
  WebSocket エンドポイントが CDP ハンドシェイクを拒否しても、設定済みのベア ルートが
  それを受け付ける場合、OpenClaw はそのルートにもフォールバックします。これにより、ローカル Chrome を指す
  ベア `ws://` でも接続できます。Chrome は `/json/version` から取得した特定のターゲットごとのパスでのみ
  WebSocket アップグレードを受け付ける一方で、ホスト型プロバイダーは、検出エンドポイントが
  Playwright CDP に適さない短命 URL を公開する場合でも、ルート WebSocket エンドポイントを引き続き使用できます。

### Browserbase

[Browserbase](https://www.browserbase.com) は、組み込みの CAPTCHA 解決、ステルスモード、住宅用
プロキシを備えたヘッドレスブラウザー実行用のクラウドプラットフォームです。

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

- [サインアップ](https://www.browserbase.com/sign-up) し、[Overview ダッシュボード](https://www.browserbase.com/overview) から
  **API Key** をコピーします。
- `<BROWSERBASE_API_KEY>` を実際の Browserbase API キーに置き換えます。
- Browserbase は WebSocket 接続時にブラウザーセッションを自動作成するため、
  手動のセッション作成手順は不要です。
- 無料枠では、同時セッション 1 つと月 1 ブラウザー時間が許可されます。
  有料プランの制限については [pricing](https://www.browserbase.com/pricing) を参照してください。
- 完全な API リファレンス、SDK ガイド、統合例については
  [Browserbase docs](https://docs.browserbase.com) を参照してください。

## セキュリティ

重要な考え方:

- ブラウザー制御はループバック専用です。アクセスは Gateway の認証またはノードペアリングを通じて流れます。
- スタンドアロンのループバックブラウザー HTTP API は **共有シークレット認証のみ**を使用します:
  Gateway トークンの Bearer 認証、`x-openclaw-password`、または
  設定済みの Gateway パスワードを使う HTTP Basic 認証。
- Tailscale Serve の ID ヘッダーと `gateway.auth.mode: "trusted-proxy"` は、
  このスタンドアロンのループバックブラウザー API を認証**しません**。
- ブラウザー制御が有効で、共有シークレット認証が設定されていない場合、OpenClaw は
  起動時に `gateway.auth.token` を自動生成し、設定へ永続化します。
- `gateway.auth.mode` がすでに `password`、`none`、または `trusted-proxy` の場合、
  OpenClaw はそのトークンを自動生成**しません**。
- Gateway とすべてのノードホストはプライベートネットワーク (Tailscale) 上に保ち、公開露出は避けてください。
- リモート CDP URL/トークンはシークレットとして扱い、環境変数またはシークレットマネージャーを優先してください。

リモート CDP のヒント:

- 可能な場合は、暗号化されたエンドポイント (HTTPS または WSS) と短命のトークンを優先してください。
- 長命のトークンを設定ファイルへ直接埋め込むことは避けてください。

## プロファイル (複数ブラウザー)

OpenClaw は複数の名前付きプロファイル (ルーティング設定) をサポートします。プロファイルには次の種類があります:

- **openclaw-managed**: 独自のユーザーデータディレクトリと CDP ポートを持つ、専用の Chromium ベースブラウザーインスタンス
- **remote**: 明示的な CDP URL (別の場所で実行されている Chromium ベースブラウザー)
- **既存セッション**: Chrome DevTools MCP 自動接続による既存の Chrome プロファイル

デフォルト:

- `openclaw` プロファイルがない場合は自動作成されます。
- `user` プロファイルは、Chrome MCP の既存セッション接続用として組み込みです。
- 既存セッションプロファイルは `user` 以外はオプトインです。`--driver existing-session` で作成してください。
- ローカル CDP ポートはデフォルトで **18800–18899** から割り当てられます。
- プロファイルを削除すると、そのローカルデータディレクトリはゴミ箱へ移動されます。

すべての制御エンドポイントは `?profile=<name>` を受け付けます。CLI は `--browser-profile` を使用します。

## Chrome DevTools MCP 経由の既存セッション

OpenClaw は、公式 Chrome DevTools MCP サーバーを通じて、実行中の Chromium ベースブラウザープロファイルにも接続できます。これにより、そのブラウザープロファイルですでに開いているタブとログイン状態を再利用します。

公式の背景情報とセットアップ参考資料:

- [Chrome for Developers: ブラウザーセッションで Chrome DevTools MCP を使用する](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

組み込みプロファイル:

- `user`

任意: 別の名前、色、またはブラウザーデータディレクトリが必要な場合は、独自のカスタム既存セッションプロファイルを作成してください。

デフォルトの動作:

- 組み込みの `user` プロファイルは Chrome MCP 自動接続を使用し、デフォルトのローカル Google Chrome プロファイルを対象にします。

Brave、Edge、Chromium、またはデフォルト以外の Chrome プロファイルには `userDataDir` を使用してください。
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

次に、対応するブラウザーで次を実行します:

1. そのブラウザーのリモートデバッグ用 inspect ページを開きます。
2. リモートデバッグを有効にします。
3. ブラウザーを実行したままにし、OpenClaw が接続するときに接続プロンプトを承認します。

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

成功時の見え方:

- `status` に `driver: existing-session` が表示される
- `status` に `transport: chrome-mcp` が表示される
- `status` に `running: true` が表示される
- `tabs` にすでに開いているブラウザータブが一覧表示される
- `snapshot` が選択中のライブタブから refs を返す

接続が機能しない場合に確認すること:

- 対象の Chromium ベースブラウザーがバージョン `144+` である
- そのブラウザーの inspect ページでリモートデバッグが有効になっている
- ブラウザーに接続同意プロンプトが表示され、承認済みである
- `openclaw doctor` は古い拡張ベースのブラウザー設定を移行し、
  デフォルトの自動接続プロファイル用に Chrome がローカルにインストールされているか確認しますが、
  ブラウザー側のリモートデバッグを有効にすることはできません

エージェントでの使用:

- ユーザーのログイン済みブラウザー状態が必要な場合は `profile="user"` を使用してください。
- カスタム既存セッションプロファイルを使用する場合は、その明示的なプロファイル名を渡してください。
- ユーザーがコンピューターの前にいて、接続プロンプトを承認できる場合のみ、このモードを選択してください。
- Gateway またはノードホストは `npx chrome-devtools-mcp@latest --autoConnect` を起動できます

注記:

- このパスは、ログイン済みブラウザーセッション内で動作できるため、隔離された `openclaw` プロファイルより高リスクです。
- OpenClaw はこのドライバー用にブラウザーを起動しません。接続するだけです。
- ここでは OpenClaw は公式 Chrome DevTools MCP の `--autoConnect` フローを使用します。
  `userDataDir` が設定されている場合、そのユーザーデータディレクトリを対象にするためそのまま渡されます。
- 既存セッションは、選択されたホスト上、または接続済みブラウザーノードを通じて接続できます。Chrome が別の場所にあり、ブラウザーノードが接続されていない場合は、
  代わりにリモート CDP またはノードホストを使用してください。

### カスタム Chrome MCP 起動

デフォルトの `npx chrome-devtools-mcp@latest` フローが望むものではない場合 (オフラインホスト、
固定バージョン、ベンダー提供バイナリ)、プロファイルごとに起動される Chrome DevTools MCP サーバーを上書きします:

| フィールド        | 動作                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | `npx` の代わりに起動する実行ファイル。そのまま解決されます。絶対パスも尊重されます。                                          |
| `mcpArgs`    | `mcpCommand` にそのまま渡される引数配列。デフォルトの `chrome-devtools-mcp@latest --autoConnect` 引数を置き換えます。 |

既存セッションプロファイルに `cdpUrl` が設定されている場合、OpenClaw は
`--autoConnect` をスキップし、エンドポイントを Chrome MCP へ自動的に転送します:

- `http(s)://...` → `--browserUrl <url>` (DevTools HTTP 検出エンドポイント)。
- `ws(s)://...` → `--wsEndpoint <url>` (直接 CDP WebSocket)。

エンドポイントフラグと `userDataDir` は組み合わせられません。`cdpUrl` が設定されている場合、
Chrome MCP 起動では `userDataDir` は無視されます。これは Chrome MCP がプロファイルディレクトリを開くのではなく、エンドポイントの背後で実行中のブラウザーへ接続するためです。

<Accordion title="既存セッション機能の制限">

管理対象の `openclaw` プロファイルと比べて、既存セッションドライバーにはより多くの制約があります:

- **スクリーンショット** — ページキャプチャと `--ref` 要素キャプチャは動作します。CSS `--element` セレクターは動作しません。`--full-page` は `--ref` または `--element` と組み合わせられません。ページまたは ref ベースの要素スクリーンショットに Playwright は不要です。
- **アクション** — `click`、`type`、`hover`、`scrollIntoView`、`drag`、`select` にはスナップショット refs が必要です (CSS セレクターは不可)。`click-coords` は表示中ビューポート座標をクリックし、スナップショット ref は不要です。`click` は左ボタンのみです。`type` は `slowly=true` をサポートしません。`fill` または `press` を使用してください。`press` は `delayMs` をサポートしません。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill`、`evaluate` は呼び出しごとのタイムアウトをサポートしません。`select` は単一の値を受け付けます。
- **待機 / アップロード / ダイアログ** — `wait --url` は完全一致、部分文字列、glob パターンをサポートします。`wait --load networkidle` はサポートされません。アップロードフックには `ref` または `inputRef` が必要で、一度に 1 ファイルのみ、CSS `element` は不可です。ダイアログフックはタイムアウト上書きをサポートしません。
- **管理対象のみの機能** — バッチアクション、PDF エクスポート、ダウンロードインターセプト、`responsebody` には引き続き管理対象ブラウザーパスが必要です。

</Accordion>

## 隔離の保証

- **専用ユーザーデータディレクトリ**: 個人用ブラウザープロファイルには一切触れません。
- **専用ポート**: 開発ワークフローとの衝突を防ぐため、`9222` を避けます。
- **決定的なタブ制御**: `tabs` は最初に `suggestedTargetId` を返し、次に
  `t1` などの安定した `tabId` ハンドル、省略可能なラベル、生の `targetId` を返します。
  エージェントは `suggestedTargetId` を再利用するべきです。生 ID は
  デバッグと互換性のために引き続き利用できます。

## ブラウザー選択

ローカル起動時、OpenClaw は最初に利用可能なものを選択します:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath` で上書きできます。

プラットフォーム:

- macOS: `/Applications` と `~/Applications` を確認します。
- Linux: `/usr/bin`、`/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium`、
  `/usr/lib/chromium-browser` 以下の一般的な Chrome/Brave/Edge/Chromium の場所を確認します。
- Windows: 一般的なインストール場所を確認します。

## 制御 API (任意)

スクリプト作成とデバッグのため、Gateway は小さな **ループバック専用 HTTP
制御 API** と、それに対応する `openclaw browser` CLI (スナップショット、refs、待機の強化、JSON 出力、デバッグワークフロー) を公開します。完全なリファレンスは
[ブラウザー制御 API](/ja-JP/tools/browser-control) を参照してください。

## トラブルシューティング

Linux 固有の問題 (特に snap Chromium) については、
[ブラウザーのトラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting) を参照してください。

WSL2 Gateway + Windows Chrome の分割ホスト構成については、
[WSL2 + Windows + リモート Chrome CDP のトラブルシューティング](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting) を参照してください。

### CDP 起動失敗とナビゲーション SSRF ブロックの違い

これらは異なる障害クラスであり、異なるコードパスを指します。

- **CDP 起動または準備完了の失敗**は、OpenClaw がブラウザー制御プレーンが正常であることを確認できないことを意味します。
- **ナビゲーション SSRF ブロック**は、ブラウザー制御プレーンは正常だが、ページナビゲーション先がポリシーによって拒否されたことを意味します。

一般的な例:

- CDP 起動または準備完了の失敗:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - ループバックの外部 CDP サービスが `attachOnly: true` なしで設定されている場合の
    `Port <port> is in use for profile "<name>" but not by openclaw`
- ナビゲーション SSRF ブロック:
  - `start` と `tabs` は引き続き動作する一方で、`open`、`navigate`、スナップショット、またはタブを開くフローがブラウザー/ネットワークポリシーエラーで失敗する

この 2 つを切り分けるには、次の最小シーケンスを使用してください:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

結果の読み方:

- `start` が `not reachable after start` で失敗する場合、まず CDP の準備完了状態をトラブルシュートしてください。
- `start` は成功するが `tabs` が失敗する場合、制御プレーンはまだ正常ではありません。これはページナビゲーションの問題ではなく、CDP 到達性の問題として扱ってください。
- `start` と `tabs` は成功するが `open` または `navigate` が失敗する場合、ブラウザー制御プレーンは起動しており、失敗はナビゲーションポリシーまたは対象ページにあります。
- `start`、`tabs`、`open` がすべて成功する場合、基本的な管理対象ブラウザー制御パスは正常です。

重要な動作の詳細:

- `browser.ssrfPolicy` を設定していない場合でも、ブラウザー設定はデフォルトで fail-closed の SSRF ポリシーオブジェクトになります。
- ローカルループバックの `openclaw` 管理対象プロファイルでは、CDP ヘルスチェックは OpenClaw 自身のローカル制御プレーンについて、ブラウザー SSRF 到達性の適用を意図的にスキップします。
- ナビゲーション保護は別です。`start` または `tabs` が成功しても、後続の `open` または `navigate` の対象が許可されるとは限りません。

セキュリティガイダンス:

- デフォルトでブラウザー SSRF ポリシーを緩和**しない**でください。
- 広範なプライベートネットワークアクセスより、`hostnameAllowlist` や `allowedHostnames` などの狭いホスト例外を優先してください。
- `dangerouslyAllowPrivateNetwork: true` は、プライベートネットワークのブラウザーアクセスが必要でレビュー済みの、意図的に信頼された環境でのみ使用してください。

## エージェントツール + 制御の仕組み

エージェントはブラウザー自動化用に **1 つのツール** を取得します:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

対応関係:

- `browser snapshot` は安定した UI ツリー（AI または ARIA）を返します。
- `browser act` はスナップショットの `ref` ID を使用して、クリック、入力、ドラッグ、選択を行います。
- `browser screenshot` はピクセル（ページ全体、要素、またはラベル付き ref）をキャプチャします。
- `browser doctor` は Gateway、Plugin、プロファイル、ブラウザー、タブの準備状態を確認します。
- `browser` は次を受け付けます:
  - 名前付きブラウザープロファイル（openclaw、chrome、またはリモート CDP）を選択するための `profile`。
  - ブラウザーが存在する場所を選択するための `target`（`sandbox` | `host` | `node`）。
  - サンドボックス化されたセッションでは、`target: "host"` に `agents.defaults.sandbox.browser.allowHostControl=true` が必要です。
  - `target` が省略された場合: サンドボックス化されたセッションのデフォルトは `sandbox`、非サンドボックスセッションのデフォルトは `host` です。
  - ブラウザー対応ノードが接続されている場合、`target="host"` または `target="node"` を固定しない限り、ツールが自動的にそこへルーティングすることがあります。

これにより、エージェントは決定論的に保たれ、壊れやすいセレクターを避けられます。

## 関連

- [ツール概要](/ja-JP/tools) — 利用可能なすべてのエージェントツール
- [サンドボックス化](/ja-JP/gateway/sandboxing) — サンドボックス化された環境でのブラウザー制御
- [セキュリティ](/ja-JP/gateway/security) — ブラウザー制御のリスクと強化
