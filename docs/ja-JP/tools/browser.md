---
read_when:
    - エージェント制御のブラウザ自動化を追加する
    - OpenClaw が自分の Chrome に干渉している理由をデバッグする
    - macOS アプリでブラウザー設定とライフサイクルを実装する
summary: 統合ブラウザー制御サービス + アクションコマンド
title: ブラウザー（OpenClaw 管理）
x-i18n:
    generated_at: "2026-06-27T13:08:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d24586c4ac1e271c24511be98e30725f4f589e9f5e703294190058bc3e6a123
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw は、エージェントが制御する **専用の Chrome/Brave/Edge/Chromium プロファイル**を実行できます。
これは個人用ブラウザから分離され、Gateway 内の小さなローカル制御サービス（ループバックのみ）を通じて管理されます。

初心者向けの見方:

- **エージェント専用の別ブラウザ**だと考えてください。
- `openclaw` プロファイルは個人用ブラウザプロファイルに**触れません**。
- エージェントは安全なレーンで、**タブを開く、ページを読む、クリックする、入力する**ことができます。
- 組み込みの `user` プロファイルは、Chrome MCP 経由で実際にサインイン済みの Chrome セッションにアタッチします。

## 得られるもの

- **openclaw** という名前の別ブラウザプロファイル（デフォルトではオレンジのアクセント）。
- 決定的なタブ制御（list/open/focus/close）。
- エージェントアクション（click/type/drag/select）、スナップショット、スクリーンショット、PDF。
- ブラウザ Plugin が有効なときに、スナップショット、安定したタブ、古い参照、手動ブロッカー回復ループをエージェントに教える、同梱の `browser-automation` skill。
- 任意のマルチプロファイル対応（`openclaw`、`work`、`remote`、...）。

このブラウザは**日常用ブラウザではありません**。エージェントの自動化と検証のための、安全で分離されたサーフェスです。

## クイックスタート

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

「Browser disabled」と表示された場合は、設定で有効化（下記参照）して Gateway を再起動してください。

`openclaw browser` がまったく存在しない場合、またはエージェントがブラウザツールを利用できないと言う場合は、[ブラウザコマンドまたはツールが見つからない](/ja-JP/tools/browser#missing-browser-command-or-tool)に進んでください。

## Plugin の制御

デフォルトの `browser` ツールは同梱 Plugin です。同じ `browser` ツール名を登録する別の Plugin に置き換えるには、これを無効化します。

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

デフォルトには `plugins.entries.browser.enabled` **と** `browser.enabled=true` の両方が必要です。Plugin だけを無効化すると、`openclaw browser` CLI、`browser.request` Gateway メソッド、エージェントツール、制御サービスが1つの単位として削除されます。置き換え用に `browser.*` 設定はそのまま残ります。

ブラウザ設定の変更には Gateway の再起動が必要です。これにより Plugin がサービスを再登録できます。

## エージェント向けガイダンス

ツールプロファイルの注意: `tools.profile: "coding"` には `web_search` と `web_fetch` が含まれますが、完全な `browser` ツールは含まれません。エージェントまたは生成されたサブエージェントがブラウザ自動化を使う必要がある場合は、プロファイル段階で browser を追加してください。

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

単一のエージェントでは、`agents.list[].tools.alsoAllow: ["browser"]` を使用します。
`tools.subagents.tools.allow: ["browser"]` だけでは不十分です。サブエージェントポリシーはプロファイルフィルタリング後に適用されるためです。

ブラウザ Plugin は、2段階のエージェント向けガイダンスを同梱しています。

- `browser` ツール説明には、常時有効のコンパクトな契約が含まれます。適切なプロファイルを選ぶ、同じタブ上で参照を維持する、タブ対象指定に `tabId`/ラベルを使う、複数ステップ作業ではブラウザ skill を読み込む、という内容です。
- 同梱の `browser-automation` skill には、より長い運用ループが含まれます。まず status/tabs を確認し、タスク用タブにラベルを付け、操作前にスナップショットを取り、UI 変更後に再スナップショットを取り、古い参照を一度だけ回復し、ログイン/2FA/captcha またはカメラ/マイクのブロッカーは推測せず手動対応として報告します。

Plugin 同梱の skills は、Plugin が有効なときにエージェントの利用可能な skills に表示されます。完全な skill 手順は必要時に読み込まれるため、通常のターンでは全トークンコストを支払いません。

## ブラウザコマンドまたはツールが見つからない

アップグレード後に `openclaw browser` が不明、`browser.request` が見つからない、またはエージェントがブラウザツールを利用できないと報告する場合、通常の原因は `browser` を省いた `plugins.allow` リストがあり、かつルートの `browser` 設定ブロックが存在しないことです。追加してください。

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

明示的なルート `browser` ブロック、たとえば `browser.enabled=true` や `browser.profiles.<name>` は、制限的な `plugins.allow` の下でも同梱ブラウザ Plugin を有効化します。これはチャネル設定の動作と一致します。`plugins.entries.browser.enabled=true` と `tools.alsoAllow: ["browser"]` は、それだけでは allowlist メンバーシップの代替にはなりません。`plugins.allow` を完全に削除してもデフォルトが復元されます。

## プロファイル: `openclaw` と `user`

- `openclaw`: 管理された分離ブラウザ（拡張機能は不要）。
- `user`: **実際にサインイン済みの Chrome** セッション用の組み込み Chrome MCP アタッチプロファイル。

エージェントのブラウザツール呼び出しでは:

- デフォルト: 分離された `openclaw` ブラウザを使います。
- 既存のログイン済みセッションが重要で、ユーザーがコンピューターの前でアタッチプロンプトをクリック/承認できる場合は、`profile="user"` を優先します。
- 特定のブラウザモードを使いたい場合、`profile` が明示的なオーバーライドです。

管理モードをデフォルトにしたい場合は、`browser.defaultProfile: "openclaw"` を設定します。

## 設定

ブラウザ設定は `~/.openclaw/openclaw.json` にあります。

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

### スクリーンショット vision（テキスト専用モデル対応）

メインモデルがテキスト専用（vision/マルチモーダル非対応）の場合、ブラウザスクリーンショットはモデルが読めない画像ブロックを返します。ブラウザスクリーンショットは既存の画像理解設定を再利用するため、メディア理解用に設定された画像モデルが、ブラウザ固有のモデル設定なしでスクリーンショットをテキストとして説明できます。

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Add fallback candidates; first success wins
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Shared media models also work when tagged for image support.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Existing image-model defaults are also honored.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**仕組み:**

1. エージェントが `browser screenshot` を呼び出す → 通常どおり画像がディスクにキャプチャされます。
2. ブラウザツールは、設定済みのメディア画像モデル、共有メディアモデル、画像モデルのデフォルト、または認証済み画像プロバイダーを使ってスクリーンショットを説明できるかどうか、既存の画像理解ランタイムに問い合わせます。
3. vision モデルはテキスト説明を返します。これは `wrapExternalContent`（プロンプトインジェクションガード）でラップされ、画像ブロックではなくテキストブロックとしてエージェントに返されます。
4. 画像理解が利用できない、スキップされる、または失敗した場合、ブラウザは元の画像ブロックを返す動作にフォールバックします。

モデルフォールバック、タイムアウト、バイト制限、プロファイル、プロバイダーリクエスト設定には、既存の `tools.media.image` / `tools.media.models` フィールドを使います。

アクティブなメインモデルがすでに vision をサポートしており、明示的な画像理解モデルが設定されていない場合、OpenClaw は通常の画像結果を維持し、メインモデルがスクリーンショットを直接読めるようにします。

<AccordionGroup>

<Accordion title="Ports and reachability">

- 制御サービスは、`gateway.port` から派生したポート（デフォルト `18791` = gateway + 2）でループバックにバインドします。`gateway.port` または `OPENCLAW_GATEWAY_PORT` をオーバーライドすると、派生ポートも同じ系列で移動します。
- ローカル `openclaw` プロファイルは `cdpPort`/`cdpUrl` を自動割り当てします。これらはリモート CDP プロファイルまたは existing-session エンドポイントアタッチの場合にのみ設定してください。未設定の場合、`cdpUrl` は管理されたローカル CDP ポートにデフォルト設定されます。
- `remoteCdpTimeoutMs` は、リモートおよび `attachOnly` CDP HTTP 到達性チェックとタブを開く HTTP リクエストに適用されます。`remoteCdpHandshakeTimeoutMs` は、それらの CDP WebSocket ハンドシェイクに適用されます。
- `localLaunchTimeoutMs` は、ローカルで起動された管理対象 Chrome プロセスが CDP HTTP エンドポイントを公開するまでの予算です。`localCdpReadyTimeoutMs` は、プロセス検出後の CDP websocket 準備完了までの後続予算です。Chromium の起動が遅い Raspberry Pi、低性能 VPS、または古いハードウェアでは、これらを引き上げてください。値は `120000` ms までの正の整数である必要があります。不正な設定値は拒否されます。
- 管理対象 Chrome の起動/準備完了失敗が繰り返されると、プロファイルごとにサーキットブレークされます。連続して数回失敗した後、OpenClaw はブラウザツール呼び出しごとに Chromium を生成するのではなく、新しい起動試行を短時間停止します。起動問題を修正するか、ブラウザが不要なら無効化するか、修復後に Gateway を再起動してください。
- `actionTimeoutMs` は、呼び出し元が `timeoutMs` を渡さない場合のブラウザ `act` リクエストのデフォルト予算です。クライアントトランスポートは小さな余裕ウィンドウを追加するため、長い待機が HTTP 境界でタイムアウトせずに完了できます。
- `tabCleanup` は、プライマリエージェントのブラウザセッションが開いたタブに対するベストエフォートのクリーンアップです。サブエージェント、cron、ACP のライフサイクルクリーンアップは、セッション終了時に明示的に追跡されたタブを引き続き閉じます。プライマリセッションはアクティブなタブを再利用可能なままにし、その後、バックグラウンドでアイドル状態または過剰な追跡タブを閉じます。

</Accordion>

<Accordion title="SSRF policy">

- ブラウザのナビゲーションとタブを開く操作は、ナビゲーション前に SSRF ガードされ、その後に最終的な `http(s)` URL でもベストエフォートで再チェックされます。
- 厳格 SSRF モードでは、リモート CDP エンドポイント検出と `/json/version` プローブ（`cdpUrl`）もチェックされます。
- Gateway/provider の `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、`NO_PROXY` 環境変数は、OpenClaw 管理のブラウザに自動ではプロキシを適用しません。管理対象 Chrome はデフォルトで直接起動するため、provider のプロキシ設定によってブラウザ SSRF チェックが弱まることはありません。
- OpenClaw 管理のローカル CDP readiness プローブと DevTools WebSocket 接続は、正確に起動されたループバックエンドポイントについて管理対象ネットワークプロキシをバイパスするため、operator プロキシがループバック送信をブロックする場合でも `openclaw browser start` は動作します。
- 管理対象ブラウザ自体にプロキシを適用するには、`browser.extraArgs` を通じて `--proxy-server=...` や `--proxy-pac-url=...` などの明示的な Chrome プロキシフラグを渡します。厳格 SSRF モードでは、プライベートネットワークのブラウザアクセスが意図的に有効化されていない限り、明示的なブラウザプロキシルーティングをブロックします。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` はデフォルトでオフです。プライベートネットワークのブラウザアクセスを意図的に信頼する場合にのみ有効化してください。
- `browser.ssrfPolicy.allowPrivateNetwork` はレガシーエイリアスとして引き続きサポートされます。

</Accordion>

<Accordion title="プロファイルの動作">

- `attachOnly: true` は、ローカルブラウザを起動せず、すでに実行中の場合にのみアタッチすることを意味します。
- `headless` はグローバルまたはローカル管理プロファイルごとに設定できます。プロファイルごとの値は `browser.headless` を上書きするため、ローカルで起動されたあるプロファイルは headless のままにし、別のプロファイルは表示状態のままにできます。
- `POST /start?headless=true` と `openclaw browser start --headless` は、
  `browser.headless` やプロファイル設定を書き換えずに、ローカル管理プロファイルの
  1回限りの headless 起動を要求します。既存セッション、attach-only、
  リモート CDP プロファイルはこの上書きを拒否します。OpenClaw はそれらの
  ブラウザプロセスを起動しないためです。
- `DISPLAY` または `WAYLAND_DISPLAY` がない Linux ホストでは、環境またはプロファイル/グローバル
  設定が headed モードを明示的に選んでいない場合、ローカル管理プロファイルは
  自動的に headless をデフォルトにします。`openclaw browser status --json` は
  `headlessSource` を `env`、`profile`、`config`、
  `request`、`linux-display-fallback`、または `default` として報告します。
- `OPENCLAW_BROWSER_HEADLESS=1` は、現在のプロセスのローカル管理起動を headless に強制します。
  `OPENCLAW_BROWSER_HEADLESS=0` は通常の起動で headed モードを強制し、
  ディスプレイサーバーがない Linux ホストでは実行可能なエラーを返します。
  明示的な `start --headless` 要求は、その1回の起動については引き続き優先されます。
- `executablePath` はグローバルまたはローカル管理プロファイルごとに設定できます。プロファイルごとの値は `browser.executablePath` を上書きするため、異なる管理プロファイルで異なる Chromium ベースのブラウザを起動できます。どちらの形式も OS のホームディレクトリに `~` を使えます。
- `color`（トップレベルおよびプロファイルごと）はブラウザ UI に色を付けるため、どのプロファイルがアクティブかを確認できます。
- デフォルトプロファイルは `openclaw`（管理対象のスタンドアロン）です。サインイン済みユーザーブラウザを使うには `defaultProfile: "user"` を使用します。
- 自動検出順序: Chromium ベースの場合はシステムのデフォルトブラウザ。それ以外は Chrome → Brave → Edge → Chromium → Chrome Canary。
- `driver: "existing-session"` は raw CDP の代わりに Chrome DevTools MCP を使用します。Chrome MCP の自動接続を通じてアタッチすることも、実行中ブラウザの DevTools エンドポイントをすでに持っている場合は `cdpUrl` を通じてアタッチすることもできます。
- existing-session プロファイルを非デフォルトの Chromium ユーザープロファイル（Brave、Edge など）にアタッチする必要がある場合は、`browser.profiles.<name>.userDataDir` を設定します。このパスでも OS のホームディレクトリに `~` を使えます。

</Accordion>

</AccordionGroup>

## Brave または別の Chromium ベースのブラウザを使用する

**システムのデフォルト**ブラウザが Chromium ベース（Chrome/Brave/Edge など）の場合、
OpenClaw はそれを自動的に使用します。自動検出を上書きするには
`browser.executablePath` を設定します。トップレベルおよびプロファイルごとの
`executablePath` 値では、OS のホームディレクトリに `~` を使えます。

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
`existing-session` プロファイルは代わりに、すでに実行中のブラウザにアタッチし、
リモート CDP プロファイルは `cdpUrl` の背後にあるブラウザを使用します。

## ローカル制御とリモート制御

- **ローカル制御（デフォルト）:** Gateway はループバック制御サービスを起動し、ローカルブラウザを起動できます。
- **リモート制御（Node ホスト）:** ブラウザがあるマシンで Node ホストを実行します。Gateway はブラウザアクションをそこへプロキシします。
- **リモート CDP:** リモートの Chromium ベースのブラウザにアタッチするには、
  `browser.profiles.<name>.cdpUrl`（または `browser.cdpUrl`）を設定します。この場合、OpenClaw はローカルブラウザを起動しません。
- ループバック上の外部管理 CDP サービス（たとえば Docker で `127.0.0.1` に公開された Browserless）では、
  `attachOnly: true` も設定します。`attachOnly` なしのループバック CDP は、
  ローカルの OpenClaw 管理ブラウザプロファイルとして扱われます。
- `headless` は、OpenClaw が起動するローカル管理プロファイルにのみ影響します。existing-session またはリモート CDP ブラウザを再起動したり変更したりしません。
- `executablePath` も同じローカル管理プロファイルの規則に従います。実行中のローカル管理プロファイルでこれを変更すると、
  次回起動時に新しいバイナリを使うよう、そのプロファイルは再起動/調整対象としてマークされます。

停止動作はプロファイルモードによって異なります。

- ローカル管理プロファイル: `openclaw browser stop` は OpenClaw が起動したブラウザプロセスを停止します
- attach-only およびリモート CDP プロファイル: `openclaw browser stop` はアクティブな
  制御セッションを閉じ、Playwright/CDP エミュレーション上書き（viewport、
  color scheme、locale、timezone、offline mode、および類似の状態）を解放します。
  OpenClaw がブラウザプロセスを起動していない場合でも同様です

リモート CDP URL には認証を含めることができます。

- クエリトークン（例: `https://provider.example?token=<token>`）
- HTTP Basic 認証（例: `https://user:pass@provider.example`）

OpenClaw は `/json/*` エンドポイントを呼び出すとき、および
CDP WebSocket に接続するときに認証を保持します。トークンは config ファイルにコミットする代わりに、
環境変数またはシークレットマネージャーを優先してください。

## Node ブラウザプロキシ（設定不要のデフォルト）

ブラウザがあるマシンで **Node ホスト**を実行している場合、OpenClaw は
追加のブラウザ設定なしで、その Node にブラウザツール呼び出しを自動ルーティングできます。
これはリモート Gateway のデフォルトパスです。

注:

- Node ホストは、**プロキシコマンド**を介してローカルブラウザ制御サーバーを公開します。
- プロファイルは Node 自身の `browser.profiles` config（ローカルと同じ）から取得されます。
- `nodeHost.browserProxy.allowProfiles` は任意です。レガシー/デフォルト動作では空のままにします。設定済みのすべてのプロファイルが、プロファイル作成/削除ルートを含めてプロキシ経由で到達可能なままになります。
- `nodeHost.browserProxy.allowProfiles` を設定すると、OpenClaw はそれを最小権限の境界として扱います。許可リストにあるプロファイルのみを対象にでき、永続プロファイルの作成/削除ルートはプロキシサーフェスでブロックされます。
- 不要な場合は無効化します。
  - Node 側: `nodeHost.browserProxy.enabled=false`
  - Gateway 側: `gateway.nodes.browser.mode="off"`

## Browserless（ホスト型リモート CDP）

[Browserless](https://browserless.io) は、HTTPS と WebSocket 経由で
CDP 接続 URL を公開するホスト型 Chromium サービスです。OpenClaw はどちらの形式も使用できますが、
リモートブラウザプロファイルでは、Browserless の接続ドキュメントにある直接 WebSocket URL が最も単純な選択肢です。

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

- `<BROWSERLESS_API_KEY>` は実際の Browserless トークンに置き換えてください。
- Browserless アカウントに一致するリージョンエンドポイントを選びます（ドキュメントを参照）。
- Browserless が HTTPS ベース URL を提供する場合、直接 CDP 接続用に
  `wss://` に変換することも、HTTPS URL のままにして OpenClaw に
  `/json/version` を検出させることもできます。

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

`browser.profiles.browserless.cdpUrl` のアドレスは
OpenClaw プロセスから到達可能である必要があります。Browserless も一致する到達可能なエンドポイントを広告する必要があります。
Browserless の `EXTERNAL` を、OpenClaw から見える同じ WebSocket ベースに設定してください。
たとえば `ws://127.0.0.1:3000`、`ws://browserless:3000`、または安定したプライベート Docker
ネットワークアドレスです。`/json/version` が
OpenClaw から到達できないアドレスを指す `webSocketDebuggerUrl` を返す場合、
CDP HTTP は正常に見えても WebSocket アタッチは失敗します。

ループバック Browserless プロファイルでは `attachOnly` を未設定のままにしないでください。
`attachOnly` がない場合、OpenClaw はループバックポートをローカル管理ブラウザ
プロファイルとして扱い、そのポートは使用中だが OpenClaw の所有ではないと報告することがあります。

## 直接 WebSocket CDP provider

一部のホスト型ブラウザサービスは、標準の HTTP ベース CDP 検出（`/json/version`）ではなく、
**直接 WebSocket** エンドポイントを公開します。OpenClaw は3つの
CDP URL 形式を受け入れ、適切な接続戦略を自動的に選択します。

- **HTTP(S) 検出** - `http://host[:port]` または `https://host[:port]`。
  OpenClaw は `/json/version` を呼び出して WebSocket デバッガー URL を検出し、その後
  接続します。WebSocket フォールバックはありません。
- **直接 WebSocket エンドポイント** - `ws://host[:port]/devtools/<kind>/<id>` または
  `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  パスを持つ `wss://...`。OpenClaw は WebSocket handshake 経由で直接接続し、
  `/json/version` を完全にスキップします。
- **裸の WebSocket ルート** - `/devtools/...` パスを持たない
  `ws://host[:port]` または `wss://host[:port]`（例: [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)）。OpenClaw はまず HTTP
  `/json/version` 検出を試みます（スキームを `http`/`https` に正規化します）。
  検出が `webSocketDebuggerUrl` を返した場合はそれを使用し、そうでなければ OpenClaw は
  裸のルートで直接 WebSocket handshake にフォールバックします。広告された
  WebSocket エンドポイントが CDP handshake を拒否しても、設定された裸のルートが
  それを受け入れる場合、OpenClaw はそのルートにもフォールバックします。これにより、ローカル Chrome を指す裸の `ws://`
  でも接続できます。Chrome は `/json/version` から得られるターゲットごとの特定パスでのみ WebSocket
  upgrade を受け入れる一方で、ホスト型
  provider は、検出エンドポイントが Playwright CDP に適さない短命 URL を広告する場合でも、
  ルート WebSocket エンドポイントを引き続き使用できるためです。

`openclaw browser doctor` は runtime attach と同じ検出優先、WebSocket フォールバック
ロジックを使用するため、正常に接続できる裸ルート URL が
診断で到達不能として報告されることはありません。

### Browserbase

[Browserbase](https://www.browserbase.com) は、組み込みの CAPTCHA 解決、stealth mode、residential
proxies を備えた headless ブラウザを実行するためのクラウドプラットフォームです。

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

- [登録](https://www.browserbase.com/sign-up)し、[概要ダッシュボード](https://www.browserbase.com/overview)から **API Key** をコピーします。
- `<BROWSERBASE_API_KEY>` を実際の Browserbase API キーに置き換えます。
- Browserbase は WebSocket 接続時にブラウザーセッションを自動作成するため、手動のセッション作成手順は不要です。
- 無料プランでは、同時セッション 1 つと月 1 ブラウザー時間が利用できます。有料プランの制限については[料金](https://www.browserbase.com/pricing)を参照してください。
- 完全な API リファレンス、SDK ガイド、統合例については [Browserbase docs](https://docs.browserbase.com) を参照してください。

### Notte

[Notte](https://www.notte.cc) は、組み込みのステルス、住宅プロキシ、CDP ネイティブの WebSocket Gateway を備えたヘッドレスブラウザー実行用のクラウドプラットフォームです。

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      notte: {
        cdpUrl: "wss://us-prod.notte.cc/sessions/connect?token=<NOTTE_API_KEY>",
        color: "#7C3AED",
      },
    },
  },
}
```

注記:

- [登録](https://console.notte.cc)し、コンソール設定ページから **API Key** をコピーします。
- `<NOTTE_API_KEY>` を実際の Notte API キーに置き換えます。
- Notte は WebSocket 接続時にブラウザーセッションを自動作成するため、手動のセッション作成手順は不要です。WebSocket が切断されると、セッションは破棄されます。
- 無料プランでは、同時セッション 5 つと通算 100 ブラウザー時間が利用できます。有料プランの制限については[料金](https://www.notte.cc/#pricing)を参照してください。
- 完全な API リファレンス、SDK ガイド、統合例については [Notte docs](https://docs.notte.cc) を参照してください。

## セキュリティ

重要な考え方:

- ブラウザー制御はループバック専用です。アクセスは Gateway の認証またはノードペアリングを通じて行われます。
- スタンドアロンのループバックブラウザー HTTP API は **共有シークレット認証のみ** を使用します:
  Gateway トークンのベアラー認証、`x-openclaw-password`、または設定済み Gateway パスワードによる HTTP Basic 認証です。
- Tailscale Serve の ID ヘッダーと `gateway.auth.mode: "trusted-proxy"` は、このスタンドアロンのループバックブラウザー API を認証**しません**。
- ブラウザー制御が有効で、共有シークレット認証が設定されていない場合、OpenClaw はその起動用に実行時限定の Gateway トークンを生成します。再起動をまたいでクライアントに安定したシークレットが必要な場合は、`gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN`、または `OPENCLAW_GATEWAY_PASSWORD` を明示的に設定してください。
- `gateway.auth.mode` がすでに `password`、`none`、または `trusted-proxy` の場合、OpenClaw はそのトークンを自動生成**しません**。
- Gateway とすべてのノードホストはプライベートネットワーク（Tailscale）上に置きます。公開露出は避けてください。
- リモート CDP URL/トークンはシークレットとして扱い、env vars またはシークレットマネージャーの使用を推奨します。

リモート CDP のヒント:

- 可能な場合は、暗号化されたエンドポイント（HTTPS または WSS）と短命トークンを優先してください。
- 長命トークンを設定ファイルに直接埋め込むことは避けてください。

## プロファイル（複数ブラウザー）

OpenClaw は、複数の名前付きプロファイル（ルーティング設定）をサポートします。プロファイルには次の種類があります:

- **openclaw-managed**: 専用の Chromium ベースのブラウザーインスタンス。独自のユーザーデータディレクトリ + CDP ポートを持ちます
- **remote**: 明示的な CDP URL（別の場所で実行されている Chromium ベースのブラウザー）
- **existing session**: Chrome DevTools MCP の自動接続を介した既存の Chrome プロファイル

デフォルト:

- `openclaw` プロファイルは、存在しない場合に自動作成されます。
- `user` プロファイルは、Chrome MCP の既存セッション接続用に組み込まれています。
- 既存セッションプロファイルは `user` 以外ではオプトインです。`--driver existing-session` で作成します。
- ローカル CDP ポートはデフォルトで **18800-18899** から割り当てられます。
- プロファイルを削除すると、そのローカルデータディレクトリはゴミ箱に移動されます。

すべての制御エンドポイントは `?profile=<name>` を受け付けます。CLI では `--browser-profile` を使用します。

## Chrome DevTools MCP 経由の既存セッション

OpenClaw は、公式 Chrome DevTools MCP サーバーを通じて、実行中の Chromium ベースのブラウザープロファイルにも接続できます。これにより、そのブラウザープロファイルですでに開いているタブとログイン状態を再利用します。

公式の背景情報とセットアップ参照:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

組み込みプロファイル:

- `user`

任意: 別の名前、色、またはブラウザーデータディレクトリが必要な場合は、独自のカスタム既存セッションプロファイルを作成できます。

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

次に、対応するブラウザーで次を行います:

1. リモートデバッグ用の、そのブラウザーの検査ページを開きます。
2. リモートデバッグを有効にします。
3. ブラウザーを起動したままにし、OpenClaw が接続するときに接続プロンプトを承認します。

一般的な検査ページ:

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

成功時の表示:

- `status` に `driver: existing-session` と表示される
- `status` に `transport: chrome-mcp` と表示される
- `status` に `running: true` と表示される
- `tabs` にすでに開いているブラウザータブが一覧表示される
- `snapshot` が選択中のライブタブから refs を返す

接続が機能しない場合に確認すること:

- 対象の Chromium ベースのブラウザーがバージョン `144+` である
- そのブラウザーの検査ページでリモートデバッグが有効になっている
- ブラウザーが接続同意プロンプトを表示し、それを承認した
- Chrome が明示的な `--remote-debugging-port` 付きで起動されている場合は、Chrome MCP 自動接続に依存せず、`browser.profiles.<name>.cdpUrl` をその DevTools エンドポイントに設定する
- `openclaw doctor` は古い拡張機能ベースのブラウザー設定を移行し、デフォルトの自動接続プロファイル用に Chrome がローカルにインストールされていることを確認しますが、ブラウザー側のリモートデバッグを有効にすることはできません

エージェントでの使用:

- ユーザーのログイン済みブラウザー状態が必要な場合は `profile="user"` を使用します。
- カスタム既存セッションプロファイルを使用する場合は、その明示的なプロファイル名を渡します。
- ユーザーがコンピューターの前にいて接続プロンプトを承認できる場合にのみ、このモードを選択してください。
- Gateway またはノードホストは `npx chrome-devtools-mcp@latest --autoConnect` を起動できます

注記:

- この経路は、サインイン済みブラウザーセッション内で動作できるため、分離された `openclaw` プロファイルよりもリスクが高くなります。
- OpenClaw はこのドライバー用にブラウザーを起動しません。接続のみを行います。
- OpenClaw はここで公式 Chrome DevTools MCP の `--autoConnect` フローを使用します。`userDataDir` が設定されている場合、そのユーザーデータディレクトリを対象にするためにそのまま渡されます。
- 既存セッションは、選択したホスト上または接続済みブラウザーノード経由で接続できます。Chrome が別の場所にあり、ブラウザーノードが接続されていない場合は、代わりにリモート CDP またはノードホストを使用してください。

### カスタム Chrome MCP 起動

デフォルトの `npx chrome-devtools-mcp@latest` フローが要件に合わない場合（オフラインホスト、固定バージョン、同梱バイナリなど）、プロファイルごとに起動される Chrome DevTools MCP サーバーを上書きします:

| フィールド   | 動作                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | `npx` の代わりに起動する実行ファイルです。そのまま解決され、絶対パスも尊重されます。                                      |
| `mcpArgs`    | `mcpCommand` にそのまま渡される引数配列です。デフォルトの `chrome-devtools-mcp@latest --autoConnect` 引数を置き換えます。 |

既存セッションプロファイルに `cdpUrl` が設定されている場合、OpenClaw は `--autoConnect` をスキップし、エンドポイントを Chrome MCP に自動転送します:

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP 探索エンドポイント）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接 CDP WebSocket）。

エンドポイントフラグと `userDataDir` は併用できません。`cdpUrl` が設定されている場合、Chrome MCP はプロファイルディレクトリを開くのではなく、エンドポイントの背後で実行中のブラウザーに接続するため、Chrome MCP 起動では `userDataDir` は無視されます。

<Accordion title="既存セッション機能の制限">

管理対象の `openclaw` プロファイルと比べて、既存セッションドライバーにはより多くの制約があります:

- **スクリーンショット** - ページキャプチャと `--ref` 要素キャプチャは機能します。CSS `--element` セレクターは機能しません。`--full-page` は `--ref` または `--element` と併用できません。ページまたは ref ベースの要素スクリーンショットに Playwright は不要です。
- **アクション** - `click`、`type`、`hover`、`scrollIntoView`、`drag`、`select` にはスナップショット refs が必要です（CSS セレクターは不可）。`click-coords` は表示中ビューポート座標をクリックし、スナップショット ref は不要です。`click` は左ボタンのみです。`type` は `slowly=true` をサポートしません。`fill` または `press` を使用してください。`press` は `delayMs` をサポートしません。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill`、`evaluate` は呼び出しごとのタイムアウトをサポートしません。`select` は単一の値を受け付けます。
- **待機 / アップロード / ダイアログ** - `wait --url` は完全一致、部分文字列、glob パターンをサポートします。`wait --load networkidle` は既存セッションプロファイルではサポートされません（管理対象および raw/remote CDP プロファイルでは機能します）。アップロードフックには `ref` または `inputRef` が必要で、1 回に 1 ファイルのみ、CSS `element` は不可です。ダイアログフックはタイムアウト上書きまたは `dialogId` をサポートしません。
- **ダイアログの可視性** - 管理対象ブラウザーのアクション応答には、アクションがモーダルダイアログを開いた場合に `blockedByDialog` と `browserState.dialogs.pending` が含まれます。スナップショットにも保留中ダイアログ状態が含まれます。ダイアログが保留中の間に `browser dialog --accept/--dismiss --dialog-id <id>` で応答してください。OpenClaw の外部で処理されたダイアログは `browserState.dialogs.recent` に表示されます。
- **管理対象のみの機能** - バッチアクション、PDF エクスポート、ダウンロード傍受、`responsebody` には、引き続き管理対象ブラウザー経路が必要です。

</Accordion>

## 分離の保証

- **専用ユーザーデータディレクトリ**: 個人用ブラウザープロファイルには一切触れません。
- **専用ポート**: 開発ワークフローとの衝突を防ぐため、`9222` を避けます。
- **決定的なタブ制御**: `tabs` は最初に `suggestedTargetId` を返し、その後に `t1` などの安定した `tabId` ハンドル、任意のラベル、生の `targetId` を返します。エージェントは `suggestedTargetId` を再利用するべきです。生の ID はデバッグと互換性のために引き続き利用できます。

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
- Linux: `/usr/bin`、`/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium`、`/usr/lib/chromium-browser` の一般的な Chrome/Brave/Edge/Chromium の場所に加え、`PLAYWRIGHT_BROWSERS_PATH` または `~/.cache/ms-playwright` 配下の Playwright 管理 Chromium を確認します。
- Windows: 一般的なインストール場所を確認します。

## 制御 API（任意）

スクリプト作成とデバッグのために、Gateway は小さな **ループバック専用 HTTP 制御 API** と、対応する `openclaw browser` CLI（スナップショット、refs、待機パワーアップ、JSON 出力、デバッグワークフロー）を公開します。完全なリファレンスについては [ブラウザー制御 API](/ja-JP/tools/browser-control) を参照してください。

## トラブルシューティング

Linux 固有の問題（特に snap Chromium）については、
[ブラウザーのトラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting)を参照してください。

WSL2 Gateway + Windows Chrome の分割ホスト構成については、
[WSL2 + Windows + リモート Chrome CDP のトラブルシューティング](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting)を参照してください。

### CDP 起動失敗とナビゲーション SSRF ブロックの違い

これらは異なる失敗クラスであり、異なるコードパスを示します。

- **CDP 起動または準備完了の失敗** は、OpenClaw がブラウザー制御プレーンの正常性を確認できないことを意味します。
- **ナビゲーション SSRF ブロック** は、ブラウザー制御プレーンは正常だが、ページナビゲーションのターゲットがポリシーによって拒否されたことを意味します。

一般的な例:

- CDP 起動または準備完了の失敗:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `attachOnly: true` なしでループバック外部 CDP サービスが構成されている場合の
    `Port <port> is in use for profile "<name>" but not by openclaw`
- ナビゲーション SSRF ブロック:
  - `start` と `tabs` は引き続き動作する一方で、`open`、`navigate`、スナップショット、またはタブを開くフローがブラウザー/ネットワークポリシーエラーで失敗する

この 2 つを切り分けるには、次の最小シーケンスを使用します。

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

結果の読み方:

- `start` が `not reachable after start` で失敗する場合は、まず CDP の準備完了をトラブルシュートします。
- `start` は成功するが `tabs` が失敗する場合、制御プレーンはまだ不健全です。これはページナビゲーションの問題ではなく、CDP 到達性の問題として扱ってください。
- `start` と `tabs` は成功するが `open` または `navigate` が失敗する場合、ブラウザー制御プレーンは起動しており、失敗はナビゲーションポリシーまたはターゲットページにあります。
- `start`、`tabs`、`open` がすべて成功する場合、基本的な管理ブラウザー制御パスは正常です。

重要な動作の詳細:

- ブラウザー設定は、`browser.ssrfPolicy` を構成していない場合でも、デフォルトでフェイルクローズの SSRF ポリシーオブジェクトになります。
- local loopback の `openclaw` 管理プロファイルでは、CDP ヘルスチェックは OpenClaw 自身のローカル制御プレーンに対するブラウザー SSRF 到達性の強制を意図的にスキップします。
- ナビゲーション保護は別です。`start` または `tabs` が成功しても、後続の `open` または `navigate` のターゲットが許可されるとは限りません。

セキュリティガイダンス:

- デフォルトでブラウザー SSRF ポリシーを緩和しないでください。
- 広範なプライベートネットワークアクセスよりも、`hostnameAllowlist` や `allowedHostnames` のような狭いホスト例外を優先してください。
- `dangerouslyAllowPrivateNetwork: true` は、プライベートネットワークのブラウザーアクセスが必要でレビュー済みの、意図的に信頼された環境でのみ使用してください。

## エージェントツール + 制御の仕組み

エージェントはブラウザー自動化用に **1 つのツール** を受け取ります。

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

対応関係:

- `browser snapshot` は安定した UI ツリー（AI または ARIA）を返します。
- `browser act` はスナップショットの `ref` ID を使ってクリック/入力/ドラッグ/選択します。
- `browser screenshot` はピクセルをキャプチャします（ページ全体、要素、またはラベル付き ref）。
- `browser doctor` は Gateway、Plugin、プロファイル、ブラウザー、タブの準備完了を確認します。
- `browser` は次を受け付けます:
  - `profile` は名前付きブラウザープロファイル（openclaw、chrome、またはリモート CDP）を選択します。
  - `target`（`sandbox` | `host` | `node`）はブラウザーが存在する場所を選択します。
  - サンドボックス化されたセッションでは、`target: "host"` に `agents.defaults.sandbox.browser.allowHostControl=true` が必要です。
  - `target` が省略された場合: サンドボックス化されたセッションはデフォルトで `sandbox`、非サンドボックスセッションはデフォルトで `host` になります。
  - ブラウザー対応ノードが接続されている場合、`target="host"` または `target="node"` で固定しない限り、ツールは自動的にそこへルーティングすることがあります。

これにより、エージェントは決定的に動作し、壊れやすいセレクターを避けられます。

## 関連

- [ツール概要](/ja-JP/tools) - 利用可能なすべてのエージェントツール
- [サンドボックス化](/ja-JP/gateway/sandboxing) - サンドボックス化された環境でのブラウザー制御
- [セキュリティ](/ja-JP/gateway/security) - ブラウザー制御のリスクと強化
