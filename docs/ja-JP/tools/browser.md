---
read_when:
    - エージェント制御のブラウザー自動化を追加する
    - OpenClaw が自分の Chrome に干渉している理由のデバッグ
    - macOS アプリでブラウザー設定とライフサイクルを実装する
summary: 統合ブラウザー制御サービス + アクションコマンド
title: ブラウザ（OpenClaw 管理）
x-i18n:
    generated_at: "2026-07-06T10:52:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24095eddbad905a96b3aa15e4ee94aba8dffa05bafce01bfc7fda914d41266ef
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw は、エージェントが制御する **専用の Chrome/Brave/Edge/Chromium プロファイル**を実行できます。これは Gateway 内の小さなローカル制御サービス（ループバックのみ）を通じて実行され、個人用ブラウザから分離されます。

- **エージェント専用の別ブラウザ**と考えてください。`openclaw` プロファイルが個人用ブラウザプロファイルに触れることはありません。
- エージェントは、この分離されたレーンでタブを開き、ページを読み取り、クリックし、入力します。
- 組み込みの `user` プロファイルは、代わりに Chrome DevTools MCP 経由で、実際にサインイン済みの Chrome セッションに接続します。

## 得られるもの

- **openclaw** という名前の別ブラウザプロファイル（デフォルトではオレンジのアクセント）。
- 決定論的なタブ制御（一覧表示/開く/フォーカス/閉じる）。
- エージェント操作（クリック/入力/ドラッグ/選択）、スナップショット、スクリーンショット、PDF。
- Playwright ベースのプロファイルは、直接添付ナビゲーションを管理対象ダウンロードディレクトリに保存し、最終 URL ポリシー検証後に `{ url, suggestedFilename, path }` メタデータを返します。
- Playwright ベースのエージェント操作は、その操作がすぐに 1 つ以上のダウンロードを開始した場合、同じ管理対象メタデータを含む `downloads` 配列を返します。
- ブラウザ Plugin が有効な場合に、スナップショット、安定タブ、古い参照、手動ブロッカー復旧ループをエージェントに教える、同梱の `browser-automation` Skill。
- 任意の複数プロファイル対応（`openclaw`、`work`、`remote`、...）。

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

「Browser disabled」は、Plugin または `browser.enabled` がオフであることを意味します。[設定](#configuration) と [Plugin 制御](#plugin-control) を参照してください。

`openclaw browser` が完全に存在しない場合、またはエージェントがブラウザツールを利用できないと言う場合は、[ブラウザコマンドまたはツールが見つからない](#missing-browser-command-or-tool) に進んでください。

## Plugin 制御

デフォルトの `browser` ツールは同梱 Plugin です。同じ `browser` ツール名を登録する別の Plugin に置き換えるには、無効にします。

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

デフォルトでは、`plugins.entries.browser.enabled` **と** `browser.enabled=true` の両方が必要です。Plugin だけを無効にすると、`openclaw browser` CLI、`browser.request` gateway メソッド、エージェントツール、制御サービスが 1 つの単位として削除されます。置き換え用に `browser.*` 設定はそのまま残ります。

ブラウザ設定の変更では、Plugin がサービスを再登録できるように Gateway の再起動が必要です。

## エージェントガイダンス

ツールプロファイルの注意: `tools.profile: "coding"` には `web_search` と `web_fetch` が含まれますが、完全な `browser` ツールは含まれません。エージェントまたは生成されたサブエージェントがブラウザ自動化を使えるようにするには、プロファイル段階で browser を追加します。

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

単一のエージェントでは、`agents.list[].tools.alsoAllow: ["browser"]` を使用します。サブエージェントポリシーはプロファイルフィルタリング後に適用されるため、`tools.subagents.tools.allow: ["browser"]` だけでは不十分です。

ブラウザ Plugin は、2 段階のエージェントガイダンスを同梱しています。

- `browser` ツールの説明には、常時有効なコンパクトな契約が含まれます。適切なプロファイルを選ぶこと、参照を同じタブ上に維持すること、タブ対象指定に `tabId`/ラベルを使うこと、複数ステップの作業ではブラウザ Skill を読み込むことです。
- 同梱の `browser-automation` Skill には、より長い運用ループが含まれます。先にステータス/タブを確認し、タスクタブにラベルを付け、操作前にスナップショットを取り、UI 変更後に再度スナップショットを取り、古い参照を一度復旧し、ログイン/2FA/captcha またはカメラ/マイクのブロッカーは推測せず手動操作として報告します。

Plugin 同梱 Skills は、Plugin が有効な場合にエージェントの利用可能な Skills に一覧表示されます。完全な Skill 指示はオンデマンドで読み込まれるため、通常のターンで全トークンコストを支払うことはありません。

## ブラウザコマンドまたはツールが見つからない

アップグレード後に `openclaw browser` が不明、`browser.request` が見つからない、またはエージェントがブラウザツールを利用できないと報告する場合、通常の原因は `browser` を省略した `plugins.allow` リストがあり、ルートの `browser` 設定ブロックも存在しないことです。追加してください。

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

明示的なルート `browser` ブロック（`browser.enabled=true` や `browser.profiles.<name>` など、`browser` 配下の任意のキー）は、制限的な `plugins.allow` の下でも同梱ブラウザ Plugin を有効化し、同梱チャネル設定の動作と一致します。`plugins.entries.browser.enabled=true` と `tools.alsoAllow: ["browser"]` は、それだけでは許可リストのメンバーシップの代わりにはなりません。`plugins.allow` を完全に削除してもデフォルトが復元されます。

## プロファイル: `openclaw`、`user`、`chrome`

- `openclaw`: 管理対象の分離ブラウザ（拡張機能不要）。
- `user`: **実際にサインイン済みの Chrome** セッション向けの組み込み Chrome DevTools MCP 接続プロファイル。OpenClaw が初めて接続するとき、Chrome はブロッキングの「リモート デバッグを許可しますか?」プロンプトを表示するため、誰かがコンピュータの前にいる必要があります。
- `chrome`: **実際にサインイン済みの Chrome** セッション向けの組み込み [Chrome 拡張機能](/tools/chrome-extension) プロファイル。リモートデバッグポートではなく OpenClaw ブラウザ拡張機能を通じてタブを操作するため、「リモート デバッグを許可しますか?」プロンプトはなく、机に誰もいなくてもスマートフォンから動作します。

エージェントのブラウザツール呼び出しでは:

- デフォルト: 分離された `openclaw` ブラウザを使用します。
- 既存のログイン済みセッションが重要で、ユーザーが**コンピュータから離れている**場合（Telegram、WhatsApp など）は、`profile="chrome"`（拡張機能）を優先します。
- 既存のログイン済みセッションが重要で、ユーザーが接続プロンプトを承認するために**コンピュータの前にいる**場合は、`profile="user"`（Chrome MCP）を優先します。
- 特定のブラウザモードを使いたい場合、`profile` が明示的な上書きです。

管理対象モードをデフォルトにしたい場合は、`browser.defaultProfile: "openclaw"` を設定します。

## 設定

ブラウザ設定は `~/.openclaw/openclaw.json` にあります。

```json5
{
  browser: {
    enabled: true, // default: true
    evaluateEnabled: true, // default: true; false disables act:evaluate (arbitrary JS)
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
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
    // snapshotDefaults: { mode: "efficient" }, // default snapshot mode when the caller omits one
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

`browser.snapshotDefaults.mode: "efficient"` は、呼び出し元が明示的な `snapshotFormat` または `mode` を渡さない場合のデフォルトの `snapshot` 抽出モードを変更します。呼び出しごとのスナップショットオプションについては、[ブラウザ制御 API](/ja-JP/tools/browser-control) を参照してください。

### スクリーンショットビジョン（テキストのみモデル対応）

メインモデルがテキストのみ（ビジョン/マルチモーダル非対応）の場合、ブラウザスクリーンショットはモデルが読めない画像ブロックを返します。ブラウザスクリーンショットは既存の画像理解設定を再利用するため、メディア理解用に設定された画像モデルが、ブラウザ固有のモデル設定なしでスクリーンショットをテキストとして説明できます。

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

1. エージェントが `browser screenshot` を呼び出し、通常どおり画像がディスクにキャプチャされます。
2. ブラウザツールは、設定済みのメディア画像モデル、共有メディアモデル、画像モデルのデフォルト、または認証済み画像プロバイダーを使ってスクリーンショットを説明できるかどうかを、既存の画像理解ランタイムに問い合わせます。
3. ビジョンモデルはテキスト説明を返し、それが `wrapExternalContent`（プロンプトインジェクションガード）でラップされ、画像ブロックではなくテキストブロックとしてエージェントに返されます。
4. 画像理解を利用できない、スキップされた、または失敗した場合、ブラウザは元の画像ブロックを返す動作にフォールバックします。

モデルのフォールバック、タイムアウト、バイト制限、プロファイル、プロバイダーリクエスト設定には、既存の `tools.media.image` / `tools.media.models` フィールドを使用します。

アクティブなメインモデルがすでにビジョンをサポートし、明示的な画像理解モデルが設定されていない場合、OpenClaw は通常の画像結果を保持するため、メインモデルがスクリーンショットを直接読めます。

<AccordionGroup>

<Accordion title="ポートと到達可能性">

- 制御サービスは `gateway.port` から派生したポートでループバックにバインドします（デフォルト `18791` = Gateway + 2）。`OPENCLAW_GATEWAY_PORT` は `gateway.port` より優先されます。どちらも同じファミリー内の派生ポートをずらします。
- ローカルの `openclaw` プロファイルは、制御ポートの9ポート上から始まる範囲（デフォルト `18800`-`18899`）から `cdpPort`/`cdpUrl` を自動割り当てします。これらを設定するのは、
  リモートCDPプロファイルまたは既存セッションのエンドポイントアタッチの場合だけにしてください。`cdpUrl` は未設定の場合、
  管理対象のローカルCDPポートをデフォルトにします。
- `remoteCdpTimeoutMs` は、リモートおよび `attachOnly` のCDP HTTP到達性
  チェックとタブを開くHTTPリクエストに適用されます。`remoteCdpHandshakeTimeoutMs` は、
  それらのCDP WebSocketハンドシェイクに適用されます。永続リモートPlaywrightタブ列挙は、
  2つのうち大きい方を操作期限として使用します。
- `localLaunchTimeoutMs` は、ローカルで起動された管理対象Chrome
  プロセスがCDP HTTPエンドポイントを公開するための予算です。`localCdpReadyTimeoutMs` は、
  プロセス検出後のCDP WebSocket準備完了のための後続予算です。
  Raspberry Pi、低スペックVPS、またはChromiumの起動が遅い古いハードウェアではこれらを引き上げてください。値は `120000` ms までの正の整数である必要があります。無効な
  config値は拒否されます。
- 管理対象Chromeの起動/準備完了に繰り返し失敗すると、プロファイルごとに
  サーキットブレーカーが作動します。連続して何度か失敗した後、OpenClaw はすべてのブラウザツール呼び出しでChromiumを生成する代わりに、新しい起動
  試行を短時間一時停止します。起動問題を修正するか、ブラウザが不要なら無効にするか、修復後に
  Gateway を再起動してください。
- `actionTimeoutMs` は、呼び出し元が `timeoutMs` を渡さない場合のブラウザ `act` リクエストのデフォルト予算です。クライアントトランスポートは小さな猶予ウィンドウを追加するため、長い待機がHTTP境界でタイムアウトせずに完了できます。
- `tabCleanup` は、プライマリエージェントのブラウザセッションが開いたタブに対するベストエフォートのクリーンアップです。サブエージェント、Cron、ACPのライフサイクルクリーンアップは、セッション終了時に明示的に追跡されたタブを引き続き閉じます。プライマリセッションではアクティブなタブを再利用可能な状態に保ち、その後、バックグラウンドでアイドル状態または過剰な追跡対象タブを閉じます。

</Accordion>

<Accordion title="SSRFポリシー">

- ブラウザナビゲーションとタブを開く操作は、ナビゲーション前にSSRFガードされ、その後、最終的な `http(s)` URLでベストエフォートにより再チェックされます。
- 厳格SSRFモードでは、リモートCDPエンドポイント検出と `/json/version` プローブ（`cdpUrl`）もチェックされます。
- Gateway/プロバイダーの `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、`NO_PROXY` 環境変数は、OpenClaw管理のブラウザを自動的にプロキシしません。管理対象Chromeはデフォルトで直接起動されるため、プロバイダーのプロキシ設定によってブラウザのSSRFチェックが弱まることはありません。
- OpenClaw管理のローカルCDP準備完了プローブとDevTools WebSocket接続は、正確に起動されたループバックエンドポイントに対して管理対象ネットワークプロキシをバイパスするため、オペレータープロキシがループバック送信をブロックしている場合でも `openclaw browser start` は動作します。
- 管理対象ブラウザ自体をプロキシするには、`browser.extraArgs` 経由で `--proxy-server=...` や `--proxy-pac-url=...` などの明示的なChromeプロキシフラグを渡します。厳格SSRFモードでは、プライベートネットワークのブラウザアクセスが意図的に有効化されていない限り、明示的なブラウザプロキシルーティングをブロックします。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` はデフォルトでオフです。プライベートネットワークのブラウザアクセスを意図的に信頼する場合にのみ有効にしてください。
- `browser.ssrfPolicy.allowPrivateNetwork` はレガシーエイリアスとして引き続きサポートされています。

</Accordion>

<Accordion title="プロファイルの動作">

- `attachOnly: true` は、ローカルブラウザを決して起動せず、すでに実行中の場合にのみアタッチすることを意味します。
- `headless` はグローバルまたはローカル管理対象プロファイルごとに設定できます。プロファイルごとの値は `browser.headless` を上書きするため、ローカルで起動されるあるプロファイルをヘッドレスのままにし、別のプロファイルを表示状態のままにできます。
- `POST /start?headless=true` と `openclaw browser start --headless` は、
  `browser.headless` またはプロファイルconfigを書き換えずに、ローカル管理対象プロファイルの
  1回限りのヘッドレス起動をリクエストします。既存セッション、アタッチ専用、
  リモートCDPプロファイルは、OpenClaw がそれらのブラウザプロセスを起動しないため、
  この上書きを拒否します。
- `DISPLAY` または `WAYLAND_DISPLAY` がないLinuxホストでは、環境またはプロファイル/グローバル
  configのどちらも明示的に表示モードを選択していない場合、ローカル管理対象プロファイルは
  自動的にヘッドレスをデフォルトにします。`openclaw browser status --json` は
  `headlessSource` を `env`、`profile`、`config`、
  `request`、`linux-display-fallback`、または `default` として報告します。
- `OPENCLAW_BROWSER_HEADLESS=1` は、現在のプロセスのローカル管理対象起動を
  ヘッドレスに強制します。`OPENCLAW_BROWSER_HEADLESS=0` は通常の起動で表示モードを強制し、
  ディスプレイサーバーがないLinuxホストでは実行可能なエラーを返します。
  明示的な `start --headless` リクエストは、その1回の起動については引き続き優先されます。
- `executablePath` はグローバルまたはローカル管理対象プロファイルごとに設定できます。プロファイルごとの値は `browser.executablePath` を上書きするため、異なる管理対象プロファイルで異なるChromiumベースのブラウザを起動できます。どちらの形式もOSのホームディレクトリとして `~` を受け付けます。
- `color`（トップレベルおよびプロファイルごと）はブラウザUIに色を付け、どのプロファイルがアクティブか分かるようにします。
- デフォルトプロファイルは `openclaw`（管理対象スタンドアロン）です。サインイン済みユーザーブラウザを使うには `defaultProfile: "user"` を使用します。
- 自動検出順序: Chromiumベースの場合はシステムデフォルトブラウザ。それ以外はChrome、Brave、Edge、Chromium、Chrome Canary。
- `driver: "existing-session"` は、生のCDPではなくChrome DevTools MCPを使用します。Chrome MCPの自動接続、または実行中ブラウザのDevToolsエンドポイントがすでにある場合は `cdpUrl` 経由でアタッチできます。
- `driver: "extension"` は、[OpenClaw Chrome拡張機能](/tools/chrome-extension)を通じてサインイン済みChromeを操作します。リレーが独自のループバックエンドポイントを所有するため、これらのプロファイルは `cdpUrl` を受け付けません。これは、コンピューターの前に誰もいなくても動作する唯一のサインイン済みブラウザモードです。
- 既存セッションプロファイルがデフォルト以外のChromiumユーザープロファイル（Brave、Edgeなど）にアタッチする必要がある場合は、`browser.profiles.<name>.userDataDir` を設定します。このパスもOSのホームディレクトリとして `~` を受け付けます。

</Accordion>

</AccordionGroup>

## Braveまたは別のChromiumベースのブラウザを使用する

**システムデフォルト** ブラウザがChromiumベース（Chrome/Brave/Edgeなど）の場合、
OpenClaw は自動的にそれを使用します。自動検出を上書きするには `browser.executablePath` を設定します。
トップレベルおよびプロファイルごとの `executablePath` 値は、OSのホームディレクトリとして `~`
を受け付けます。

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

または、プラットフォームごとにconfigで設定します。

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

プロファイルごとの `executablePath` は、OpenClaw が起動するローカル管理対象プロファイルにのみ影響します。
`existing-session` プロファイルは、代わりにすでに実行中のブラウザに
アタッチし、リモートCDPプロファイルは `cdpUrl` の背後にあるブラウザを使用します。

## ローカル制御とリモート制御

- **ローカル制御（デフォルト）:** Gateway はループバック制御サービスを開始し、ローカルブラウザを起動できます。
- **リモート制御（ノードホスト）:** ブラウザがあるマシンでノードホストを実行します。Gateway はブラウザ操作をそこへプロキシします。
- **リモートCDP:** リモートChromiumベースのブラウザに
  アタッチするには `browser.profiles.<name>.cdpUrl`（または `browser.cdpUrl`）を設定します。この場合、OpenClaw はローカルブラウザを起動しません。
- ループバック上の外部管理CDPサービス（たとえばDockerで
  `127.0.0.1` に公開されたBrowserless）の場合は、`attachOnly: true` も設定します。`attachOnly` のないループバックCDPは、ローカルのOpenClaw管理ブラウザプロファイルとして扱われます。
- `headless` は、OpenClaw が起動するローカル管理対象プロファイルにのみ影響します。既存セッションやリモートCDPブラウザを再起動したり変更したりすることはありません。
- `executablePath` も同じローカル管理対象プロファイルのルールに従います。実行中の
  ローカル管理対象プロファイルで変更すると、そのプロファイルは再起動/調整対象としてマークされ、
  次回の起動で新しいバイナリが使用されます。

停止動作はプロファイルモードによって異なります。

- ローカル管理対象プロファイル: `openclaw browser stop` は、
  OpenClaw が起動したブラウザプロセスを停止します
- アタッチ専用およびリモートCDPプロファイル: `openclaw browser stop` は、アクティブな
  制御セッションを閉じ、Playwright/CDPエミュレーション上書き（ビューポート、
  カラースキーム、ロケール、タイムゾーン、オフラインモード、および類似の状態）を解放します。ただし、
  OpenClaw によってブラウザプロセスが起動されたわけではありません

リモートCDP URLには認証を含められます。

- クエリトークン（例: `https://provider.example?token=<token>`）
- HTTP Basic認証（例: `https://user:pass@provider.example`）

OpenClaw は `/json/*` エンドポイントの呼び出し時とCDP WebSocketへの接続時に
認証を保持します。トークンをconfigファイルにコミットする代わりに、
環境変数またはシークレットマネージャーを使用することを推奨します。

## Nodeブラウザプロキシ（ゼロconfigのデフォルト）

ブラウザがあるマシンで **ノードホスト** を実行している場合、OpenClaw は
追加のブラウザconfigなしで、ブラウザツール呼び出しをそのノードへ
自動ルーティングできます。これはリモートゲートウェイのデフォルトパスです。

メモ:

- ノードホストは、**プロキシコマンド** 経由でローカルブラウザ制御サーバーを公開します。
- プロファイルはノード自身の `browser.profiles` config（ローカルと同じ）から取得されます。
- プロキシコマンドは、`allowProfiles` に関係なく、永続的なプロファイル変更（`create-profile`、`delete-profile`、`reset-profile`）を一切許可しません。これらの変更はノード上で直接行ってください。
- `nodeHost.browserProxy.allowProfiles` は任意です。レガシー/デフォルト動作、つまり設定済みのすべてのプロファイルをプロキシ経由で到達可能にするには、空のままにします。
- `nodeHost.browserProxy.allowProfiles` を設定した場合、OpenClaw はそれを、プロキシが対象にできるプロファイル名を制限する最小権限境界として扱います。
- 不要な場合は無効にします。
  - ノード側: `nodeHost.browserProxy.enabled=false`
  - Gateway側: `gateway.nodes.browser.mode="off"`（単一の接続済みブラウザノードを選ぶ `"auto"`、または明示的なノードパラメーターを必須にする `"manual"` も受け付けます）

## Browserless（ホスト型リモートCDP）

[Browserless](https://browserless.io) は、HTTPSおよびWebSocketで
CDP接続URLを公開するホスト型Chromiumサービスです。OpenClaw はどちらの形式も使用できますが、
リモートブラウザプロファイルでは、Browserlessの接続ドキュメントにある直接WebSocket URLが
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

メモ:

- `<BROWSERLESS_API_KEY>` を実際のBrowserlessトークンに置き換えてください。
- Browserlessアカウントに合うリージョンエンドポイントを選択してください（ドキュメントを参照）。
- BrowserlessがHTTPSベースURLを提供する場合は、それを直接CDP接続用に
  `wss://` へ変換するか、HTTPS URLのままにしてOpenClaw に
  `/json/version` を検出させることができます。

### 同じホスト上のBrowserless Docker

BrowserlessがDockerでセルフホストされ、OpenClaw がホスト上で実行される場合は、
Browserlessを外部管理CDPサービスとして扱います。

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

`browser.profiles.browserless.cdpUrl` のアドレスは、OpenClaw プロセスから到達可能である必要があります。Browserless も、到達可能な一致するエンドポイントを広告する必要があります。Browserless の `EXTERNAL` を、`ws://127.0.0.1:3000`、`ws://browserless:3000`、または安定したプライベート Docker ネットワークアドレスなど、同じ public-to-OpenClaw WebSocket ベースに設定してください。`/json/version` が、OpenClaw から到達できないアドレスを指す `webSocketDebuggerUrl` を返す場合、CDP HTTP は正常に見えても WebSocket アタッチは失敗することがあります。

loopback Browserless プロファイルでは、`attachOnly` を未設定のままにしないでください。`attachOnly` がない場合、OpenClaw は loopback ポートをローカル管理ブラウザプロファイルとして扱い、そのポートは使用中だが OpenClaw の所有ではないと報告することがあります。

## 直接 WebSocket CDP プロバイダー

一部のホスト型ブラウザサービスは、標準の HTTP ベースの CDP 検出（`/json/version`）ではなく、**直接 WebSocket** エンドポイントを公開します。OpenClaw は 3 つの CDP URL 形式を受け入れ、適切な接続戦略を自動的に選択します。

- **HTTP(S) 検出** - `http://host[:port]` または `https://host[:port]`。
  OpenClaw は `/json/version` を呼び出して WebSocket デバッガー URL を検出し、その後接続します。WebSocket フォールバックはありません。
- **直接 WebSocket エンドポイント** - `ws://host[:port]/devtools/<kind>/<id>`、または `/devtools/browser|page|worker|shared_worker|service_worker/<id>` パスを持つ `wss://...`。
  OpenClaw は WebSocket ハンドシェイクで直接接続し、`/json/version` を完全にスキップします。
- **裸の WebSocket ルート** - `/devtools/...` パスを持たない `ws://host[:port]` または `wss://host[:port]`（例: [Browserless](https://browserless.io)、[Browserbase](https://www.browserbase.com)）。OpenClaw は最初に HTTP `/json/version` 検出を試行します（スキームを `http`/`https` に正規化）。検出で `webSocketDebuggerUrl` が返された場合はそれを使用し、そうでなければ裸のルートで直接 WebSocket ハンドシェイクにフォールバックします。広告された WebSocket エンドポイントが CDP ハンドシェイクを拒否しても、設定された裸のルートがそれを受け入れる場合、OpenClaw はそのルートにもフォールバックします。これにより、ローカル Chrome を指す裸の `ws://` でも接続できます。Chrome は `/json/version` から得られるターゲットごとの特定パスでのみ WebSocket アップグレードを受け入れますが、ホスト型プロバイダーは、検出エンドポイントが Playwright CDP に適さない短命の URL を広告する場合でも、ルート WebSocket エンドポイントを使用できます。

`openclaw browser doctor` は、ランタイムのアタッチと同じ検出優先、WebSocket フォールバックのロジックを使用するため、正常に接続できる裸のルート URL が診断で到達不能として報告されることはありません。

### Browserbase

[Browserbase](https://www.browserbase.com) は、組み込みの CAPTCHA 解決、ステルスモード、住宅プロキシを備えたヘッドレスブラウザ実行用のクラウドプラットフォームです。

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

- [サインアップ](https://www.browserbase.com/sign-up)し、[概要ダッシュボード](https://www.browserbase.com/overview)から**API キー**をコピーします。
- `<BROWSERBASE_API_KEY>` を実際の Browserbase API キーに置き換えます。
- Browserbase は WebSocket 接続時にブラウザセッションを自動作成するため、手動のセッション作成手順は不要です。
- 現在の無料枠の制限と有料プランについては、[料金](https://www.browserbase.com/pricing)を参照してください。
- 完全な API リファレンス、SDK ガイド、統合例については、[Browserbase ドキュメント](https://docs.browserbase.com)を参照してください。

### Notte

[Notte](https://www.notte.cc) は、組み込みのステルス、住宅プロキシ、CDP ネイティブの WebSocket Gateway を備えたヘッドレスブラウザ実行用のクラウドプラットフォームです。

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

- [サインアップ](https://console.notte.cc)し、コンソール設定ページから**API キー**をコピーします。
- `<NOTTE_API_KEY>` を実際の Notte API キーに置き換えます。
- Notte は WebSocket 接続時にブラウザセッションを自動作成するため、手動のセッション作成手順は不要です。WebSocket が切断されると、セッションは破棄されます。
- 現在の無料枠の制限と有料プランについては、[料金](https://www.notte.cc/#pricing)を参照してください。
- 完全な API リファレンス、SDK ガイド、統合例については、[Notte ドキュメント](https://docs.notte.cc)を参照してください。

## セキュリティ

重要な考え方:

- ブラウザ制御は loopback 専用です。アクセスは Gateway の認証またはノードペアリングを通じて流れます。
- スタンドアロンの loopback ブラウザ HTTP API は、**共有シークレット認証のみ**を使用します。
  Gateway トークンの bearer 認証、`x-openclaw-password`、または設定済み Gateway パスワードによる HTTP Basic 認証です。
- Tailscale Serve の ID ヘッダーと `gateway.auth.mode: "trusted-proxy"` は、このスタンドアロンの loopback ブラウザ API を認証**しません**。
- ブラウザ制御が有効で、共有シークレット認証が設定されていない場合、OpenClaw は起動時にブラウザ制御用の認証情報を自動生成して永続化します。
  `gateway.auth.mode` が `none` の場合はトークン、`trusted-proxy` の場合はパスワードです（プロセス外の loopback クライアントが解決できるように `gateway.auth.password` 経由で永続化されます）。そのモードに明示的な文字列認証情報がすでに設定されている場合、または `gateway.auth.mode` が `password` の場合、自動生成はスキップされます。
- 生成されたものではなく、自分で管理する安定したシークレットを使いたい場合は、`gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN`、または `OPENCLAW_GATEWAY_PASSWORD` を明示的に設定してください。

リモート CDP のヒント:

- 可能な場合は、暗号化されたエンドポイント（HTTPS または WSS）と短命のトークンを優先してください。
- 長命のトークンを設定ファイルに直接埋め込むことは避けてください。
- Gateway とすべてのノードホストはプライベートネットワーク（Tailscale）上に保ち、公開露出を避けてください。
- リモート CDP URL/トークンはシークレットとして扱い、env vars またはシークレットマネージャーを優先してください。

## プロファイル（複数ブラウザ）

OpenClaw は複数の名前付きプロファイル（ルーティング設定）をサポートします。プロファイルには次の種類があります。

- **openclaw-managed**: 独自のユーザーデータディレクトリ + CDP ポートを持つ専用の Chromium ベースのブラウザインスタンス
- **remote**: 明示的な CDP URL（別の場所で実行されている Chromium ベースのブラウザ）
- **existing session**: Chrome DevTools MCP 自動接続を介した既存の Chrome プロファイル

デフォルト:

- `openclaw` プロファイルは、存在しない場合に自動作成されます。
- `user` プロファイルは、Chrome MCP 既存セッションアタッチ用に組み込まれています。
- 既存セッションプロファイルは、`user` 以外では opt-in です。`--driver existing-session` で作成してください。
- ローカル CDP ポートは、デフォルトで **18800-18899** から割り当てられます。
- プロファイルを削除すると、そのローカルデータディレクトリは Trash に移動されます。

すべての制御エンドポイントは `?profile=<name>` を受け入れます。CLI は `--browser-profile` を使用します。

## Chrome DevTools MCP 経由の既存セッション

OpenClaw は、公式 Chrome DevTools MCP サーバーを通じて、実行中の Chromium ベースのブラウザプロファイルにもアタッチできます。これにより、そのブラウザプロファイルですでに開いているタブとログイン状態を再利用できます。

公式の背景情報とセットアップ参照:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

組み込みプロファイル: `user`。別の名前、色、またはブラウザデータディレクトリが必要な場合は、独自のカスタム既存セッションプロファイルを作成してください。

デフォルトでは、組み込みの `user` プロファイルは Chrome MCP 自動接続を使用し、デフォルトのローカル Google Chrome プロファイルを対象にします。Brave、Edge、Chromium、またはデフォルト以外の Chrome プロファイルには `userDataDir` を使用してください。`~` は OS のホームディレクトリに展開されます。

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

次に、対応するブラウザで次を行います。

1. リモートデバッグ用のそのブラウザの inspect ページを開きます。
2. リモートデバッグを有効にします。
3. ブラウザを起動したままにし、OpenClaw がアタッチするときに接続プロンプトを承認します。

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
- `tabs` にすでに開いているブラウザタブが一覧表示される
- `snapshot` が選択されたライブタブから refs を返す

アタッチが機能しない場合に確認すること:

- 対象の Chromium ベースのブラウザがバージョン `144+` である
- そのブラウザの inspect ページでリモートデバッグが有効になっている
- ブラウザがアタッチ同意プロンプトを表示し、それを承認した
- Chrome が明示的な `--remote-debugging-port` で起動されている場合は、Chrome MCP 自動接続に依存するのではなく、`browser.profiles.<name>.cdpUrl` をその DevTools エンドポイントに設定する
- `openclaw doctor` は古い拡張ベースのブラウザ設定を移行し、デフォルトの自動接続プロファイル用に Chrome がローカルにインストールされていることを確認しますが、ブラウザ側のリモートデバッグを有効にすることはできません

エージェントでの使用:

- ユーザーのログイン済みブラウザ状態が必要な場合は、`profile="user"` を使用します。
- カスタム既存セッションプロファイルを使用する場合は、その明示的なプロファイル名を渡します。
- このモードは、ユーザーがコンピューターの前にいてアタッチプロンプトを承認できる場合にのみ選択してください。
- Gateway またはノードホストは `npx chrome-devtools-mcp@latest --autoConnect` を起動できます。

注記:

- このパスは、サインイン済みブラウザセッション内で動作できるため、分離された `openclaw` プロファイルよりリスクが高くなります。
- OpenClaw はこのドライバー用にブラウザを起動しません。アタッチのみを行います。
- OpenClaw はここで公式 Chrome DevTools MCP `--autoConnect` フローを使用します。`userDataDir` が設定されている場合は、そのユーザーデータディレクトリを対象にするために渡されます。
- 既存セッションは、選択されたホスト上、または接続済みブラウザノード経由でアタッチできます。Chrome が別の場所にあり、ブラウザノードが接続されていない場合は、代わりにリモート CDP またはノードホストを使用してください。

### カスタム Chrome MCP 起動

デフォルトの `npx chrome-devtools-mcp@latest` フローが目的に合わない場合（オフラインホスト、固定バージョン、ベンダー提供バイナリ）、プロファイルごとに起動される Chrome DevTools MCP サーバーを上書きします。

| フィールド        | 内容                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | `npx` の代わりに起動する実行ファイルです。そのまま解決され、絶対パスも尊重されます。                                          |
| `mcpArgs`    | `mcpCommand` にそのまま渡される引数配列です。デフォルトの `chrome-devtools-mcp@latest --autoConnect` 引数を置き換えます。 |

既存セッションプロファイルに `cdpUrl` が設定されている場合、OpenClaw は `--autoConnect` をスキップし、エンドポイントを Chrome MCP に自動的に転送します。

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP 検出エンドポイント）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接 CDP WebSocket）。

エンドポイントフラグと `userDataDir` は組み合わせられません。`cdpUrl` が設定されている場合、Chrome MCP 起動では `userDataDir` は無視されます。これは Chrome MCP がプロファイルディレクトリを開くのではなく、エンドポイントの背後で実行中のブラウザにアタッチするためです。

<Accordion title="既存セッション機能の制限">

管理対象の `openclaw` プロファイルと比べて、既存セッションドライバーにはより多くの制約があります:

- **スクリーンショット** - ページキャプチャと `--ref` 要素キャプチャは動作します。CSS `--element` セレクターは動作しません。ページまたは ref ベースの要素スクリーンショットに Playwright は不要です。(`--full-page` は、既存セッションだけでなくどのプロファイルでも `--ref` または `--element` と組み合わせることはできません。)
- **アクション** - `click`、`type`、`hover`、`scrollIntoView`、`drag`、`select` にはスナップショット ref が必要です (CSS セレクターは使用できません)。`click-coords` は表示中のビューポート座標をクリックし、スナップショット ref は不要です。`click` は左ボタンのみです (ボタンのオーバーライドや修飾キーはありません)。`type` は `slowly=true` をサポートしていません。`fill` または `press` を使用してください。`press` は `delayMs` をサポートしていません。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill`、`evaluate` は呼び出しごとの `timeoutMs` オーバーライドをサポートしていません。`select` は単一の値を受け付けます。`batch` はサポートされていません。アクションは個別に送信してください。
- **待機 / アップロード / ダイアログ** - `wait --url` は完全一致、部分文字列、glob パターンをサポートします (managed と同じです)。`wait --load networkidle` は既存セッションプロファイルではサポートされていません (managed および raw/remote CDP プロファイルでは動作します)。アップロードフックには `ref` または `inputRef` が必要で、一度に 1 ファイルのみ、CSS `element` は使用できません。ダイアログフックはタイムアウトのオーバーライドや `dialogId` をサポートしていません。
- **ダイアログの可視性** - Managed ブラウザーのアクションレスポンスには、アクションがモーダルダイアログを開いたときに `blockedByDialog` と `browserState.dialogs.pending` が含まれます。スナップショットにも保留中のダイアログ状態が含まれます。ダイアログが保留中の間に `browser dialog --accept/--dismiss --dialog-id <id>` で応答してください。OpenClaw の外部で処理されたダイアログは `browserState.dialogs.recent` の下に表示されます。
- **Managed 専用機能** - PDF エクスポート、ダウンロードインターセプト、`responsebody` には引き続き managed ブラウザーパスが必要です。

</Accordion>

## 分離保証

- **専用ユーザーデータディレクトリ**: 個人用ブラウザープロファイルには一切触れません。
- **専用ポート**: 開発ワークフローとの衝突を防ぐため `9222` を避けます。
- **決定的なタブ制御**: `tabs` はまず `suggestedTargetId` を返し、その後に
  `t1` などの安定した `tabId` ハンドル、任意のラベル、生の `targetId` を返します。
  エージェントは `suggestedTargetId` を再利用するべきです。生の ID は
  デバッグと互換性のために引き続き利用できます。

## ブラウザーの選択

ローカルで起動する場合、OpenClaw は最初に利用可能なものを選択します。

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath` で上書きできます。

プラットフォーム:

- macOS: `/Applications` と `~/Applications` を確認します。
- Linux: `/usr/bin`、`/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium`、
  `/usr/lib/chromium-browser` 配下の一般的な Chrome/Brave/Edge/Chromium の場所に加え、
  `PLAYWRIGHT_BROWSERS_PATH` または `~/.cache/ms-playwright` 配下の Playwright 管理 Chromium を確認します。
- Windows: 一般的なインストール場所を確認します。

## Control API (任意)

スクリプト作成とデバッグのために、Gateway は小さな **ループバック専用 HTTP
コントロール API** と、対応する `openclaw browser` CLI (スナップショット、refs、wait
パワーアップ、JSON 出力、デバッグワークフロー) を公開します。完全なリファレンスは
[ブラウザーコントロール API](/ja-JP/tools/browser-control) を参照してください。

## トラブルシューティング

Linux 固有の問題 (特に snap Chromium) については、
[ブラウザーのトラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting) を参照してください。

WSL2 Gateway + Windows Chrome の split-host セットアップについては、
[WSL2 + Windows + remote Chrome CDP のトラブルシューティング](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting) を参照してください。

### CDP 起動失敗とナビゲーション SSRF ブロックの違い

これらは異なる失敗クラスであり、異なるコードパスを示します。

- **CDP 起動または準備完了の失敗** は、OpenClaw がブラウザーのコントロールプレーンが正常であることを確認できないことを意味します。
- **ナビゲーション SSRF ブロック** は、ブラウザーのコントロールプレーンは正常ですが、ページナビゲーションのターゲットがポリシーによって拒否されたことを意味します。

一般的な例:

- CDP 起動または準備完了の失敗:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - loopback 外部 CDP サービスが `attachOnly: true` なしで設定されている場合の
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

- `start` が `not reachable after start` で失敗する場合は、まず CDP の準備完了をトラブルシュートしてください。
- `start` は成功するが `tabs` が失敗する場合、コントロールプレーンはまだ正常ではありません。これはページナビゲーションの問題ではなく、CDP 到達性の問題として扱ってください。
- `start` と `tabs` は成功するが `open` または `navigate` が失敗する場合、ブラウザーのコントロールプレーンは稼働しており、失敗はナビゲーションポリシーまたはターゲットページにあります。
- `start`、`tabs`、`open` がすべて成功する場合、基本的な managed ブラウザーコントロールパスは正常です。

重要な動作の詳細:

- ブラウザー設定は、`browser.ssrfPolicy` を設定していない場合でも、デフォルトで fail-closed の SSRF ポリシーオブジェクトになります。
- local loopback の `openclaw` managed プロファイルでは、CDP ヘルスチェックは OpenClaw 自身のローカルコントロールプレーンに対するブラウザー SSRF 到達性の強制を意図的にスキップします。
- ナビゲーション保護は別です。`start` または `tabs` が成功しても、後続の `open` または `navigate` ターゲットが許可されるとは限りません。

セキュリティガイダンス:

- デフォルトでブラウザー SSRF ポリシーを緩和しないでください。
- 広範なプライベートネットワークアクセスよりも、`hostnameAllowlist` や `allowedHostnames` などの狭いホスト例外を優先してください。
- `dangerouslyAllowPrivateNetwork: true` は、プライベートネットワークのブラウザーアクセスが必要でレビュー済みの、意図的に信頼された環境でのみ使用してください。

## エージェントツール + コントロールの仕組み

エージェントはブラウザー自動化用に **1 つのツール** を取得します。

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

対応関係:

- `browser snapshot` は安定した UI ツリー (AI または ARIA) を返します。
- `browser act` はスナップショットの `ref` ID を使用して click/type/drag/select を行います。
- `browser screenshot` はピクセルをキャプチャします (フルページ、要素、またはラベル付き refs)。
- `browser doctor` は Gateway、Plugin、プロファイル、ブラウザー、タブの準備状況を確認します。
- `browser` は次を受け付けます:
  - `profile`: 名前付きブラウザープロファイル (openclaw、chrome、または remote CDP) を選択します。
  - `target` (`sandbox` | `host` | `node`): ブラウザーが存在する場所を選択します。
  - サンドボックス化されたセッションでは、`target: "host"` に `agents.defaults.sandbox.browser.allowHostControl=true` が必要です。
  - `target` が省略された場合: サンドボックス化されたセッションはデフォルトで `sandbox`、非サンドボックスセッションはデフォルトで `host` になります。
  - ブラウザー対応ノードが接続されている場合、`target="host"` または `target="node"` で固定しない限り、ツールは自動ルーティングすることがあります。

これにより、エージェントの動作が決定的になり、壊れやすいセレクターを避けられます。

## 関連

- [ツール概要](/ja-JP/tools) - 利用可能なすべてのエージェントツール
- [サンドボックス化](/ja-JP/gateway/sandboxing) - サンドボックス環境でのブラウザー制御
- [セキュリティ](/ja-JP/gateway/security) - ブラウザー制御のリスクと堅牢化
