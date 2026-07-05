---
read_when:
    - エージェント制御のブラウザー自動化の追加
    - OpenClaw が自分の Chrome に干渉している理由をデバッグする
    - macOS アプリでブラウザー設定とライフサイクルを実装する
summary: 統合ブラウザー制御サービス + アクションコマンド
title: ブラウザ（OpenClaw管理）
x-i18n:
    generated_at: "2026-07-05T11:49:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee559960dc0a07855c46d339b25786d7e58cfbd91a3e150853642d9cc9c99137
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw は、エージェントが制御する **専用の Chrome/Brave/Edge/Chromium プロファイル**を実行できます。Gateway 内の小さなローカル制御サービス（ループバックのみ）を通じて動作し、個人用ブラウザーから分離されます。

- **エージェント専用の別ブラウザー**と考えてください。`openclaw` プロファイルが個人用ブラウザープロファイルに触れることはありません。
- エージェントは、この分離されたレーンでタブを開き、ページを読み取り、クリックし、入力します。
- 組み込みの `user` プロファイルは、代わりに Chrome DevTools MCP 経由で、実際にサインイン済みの Chrome セッションに接続します。

## 得られるもの

- **openclaw** という名前の別ブラウザープロファイル（デフォルトではオレンジのアクセント）。
- 決定的なタブ制御（一覧表示/開く/フォーカス/閉じる）。
- エージェント操作（クリック/入力/ドラッグ/選択）、スナップショット、スクリーンショット、PDF。
- ブラウザーPluginが有効な場合に、スナップショット、安定したタブ、古い参照、手動ブロッカー復旧ループをエージェントに教える、同梱の `browser-automation` skill。
- オプションのマルチプロファイル対応（`openclaw`、`work`、`remote`、...）。

このブラウザーは**日常用ブラウザーではありません**。エージェントによる自動化と検証のための、安全で分離されたサーフェスです。

## クイックスタート

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

「ブラウザーが無効」とは、Plugin または `browser.enabled` がオフであることを意味します。[設定](#configuration) と [Plugin制御](#plugin-control) を参照してください。

`openclaw browser` が完全にない場合、またはエージェントがブラウザーツールを利用できないと言う場合は、[ブラウザーコマンドまたはツールがない場合](#missing-browser-command-or-tool) に進んでください。

## Plugin制御

デフォルトの `browser` ツールは同梱Pluginです。同じ `browser` ツール名を登録する別のPluginに置き換えるには、これを無効にします。

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

デフォルトには `plugins.entries.browser.enabled` **と** `browser.enabled=true` の両方が必要です。Pluginだけを無効にすると、`openclaw browser` CLI、`browser.request` Gateway メソッド、エージェントツール、制御サービスが 1 つの単位として削除されます。`browser.*` 設定は置き換え用にそのまま残ります。

ブラウザー設定の変更では、Pluginがサービスを再登録できるように Gateway の再起動が必要です。

## エージェントガイダンス

ツールプロファイルに関する注記: `tools.profile: "coding"` には `web_search` と `web_fetch` が含まれますが、完全な `browser` ツールは含まれません。エージェントまたは生成されたサブエージェントにブラウザー自動化を使わせるには、プロファイル段階で browser を追加します。

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

単一のエージェントでは、`agents.list[].tools.alsoAllow: ["browser"]` を使用します。サブエージェントポリシーはプロファイルのフィルタリング後に適用されるため、`tools.subagents.tools.allow: ["browser"]` だけでは不十分です。

ブラウザーPluginには、2 段階のエージェントガイダンスが同梱されています。

- `browser` ツールの説明には、常時有効なコンパクトな契約が含まれます。適切なプロファイルを選び、同じタブ上で参照を維持し、タブのターゲット指定には `tabId`/ラベルを使い、複数ステップの作業ではブラウザーskillを読み込みます。
- 同梱の `browser-automation` skill には、より長い操作ループが含まれます。まず状態/タブを確認し、タスクタブにラベルを付け、操作前にスナップショットを取り、UI 変更後に再スナップショットし、古い参照を一度復旧し、ログイン/2FA/captcha またはカメラ/マイクのブロッカーは推測せず手動操作として報告します。

Plugin同梱のSkillsは、Pluginが有効な場合にエージェントの利用可能なSkillsに一覧表示されます。完全な skill 手順はオンデマンドで読み込まれるため、通常のターンでは完全なトークンコストは発生しません。

## ブラウザーコマンドまたはツールがない場合

アップグレード後に `openclaw browser` が不明、`browser.request` がない、またはエージェントがブラウザーツールを利用できないと報告する場合、通常の原因は `browser` を省略した `plugins.allow` リストがあり、ルートの `browser` 設定ブロックが存在しないことです。追加してください。

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

明示的なルート `browser` ブロック（`browser.enabled=true` や `browser.profiles.<name>` など、`browser` 配下の任意のキー）は、制限的な `plugins.allow` の下でも同梱ブラウザーPluginを有効にします。これは同梱チャネル設定の動作と一致します。`plugins.entries.browser.enabled=true` と `tools.alsoAllow: ["browser"]` は、それ自体では許可リストのメンバーシップの代わりにはなりません。`plugins.allow` を完全に削除しても、デフォルトが復元されます。

## プロファイル: `openclaw` と `user`

- `openclaw`: 管理された分離ブラウザー（拡張機能不要）。
- `user`: **実際にサインイン済みの Chrome** セッション用の、組み込み Chrome DevTools MCP 接続プロファイル。

エージェントのブラウザーツール呼び出しでは:

- デフォルト: 分離された `openclaw` ブラウザーを使用します。
- 既存のログイン済みセッションが重要で、ユーザーがコンピューターの前で接続プロンプトをクリック/承認できる場合は、`profile="user"` を優先します。
- 特定のブラウザーモードを使いたい場合、`profile` が明示的な上書きです。

管理モードをデフォルトにしたい場合は、`browser.defaultProfile: "openclaw"` を設定します。

## 設定

ブラウザー設定は `~/.openclaw/openclaw.json` にあります。

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

`browser.snapshotDefaults.mode: "efficient"` は、呼び出し元が明示的な `snapshotFormat` または `mode` を渡さない場合のデフォルトの `snapshot` 抽出モードを変更します。呼び出しごとのスナップショットオプションについては、[ブラウザー制御 API](/ja-JP/tools/browser-control) を参照してください。

### スクリーンショットビジョン（テキスト専用モデル対応）

メインモデルがテキスト専用（ビジョン/マルチモーダル非対応）の場合、ブラウザーのスクリーンショットはモデルが読み取れない画像ブロックを返します。ブラウザーのスクリーンショットは既存の画像理解設定を再利用するため、メディア理解用に設定された画像モデルは、ブラウザー固有のモデル設定なしでスクリーンショットをテキストとして説明できます。

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
2. ブラウザーツールは、既存の画像理解ランタイムに、設定済みのメディア画像モデル、共有メディアモデル、画像モデルのデフォルト、または認証済み画像プロバイダーを使ってスクリーンショットを説明できるかを問い合わせます。
3. ビジョンモデルはテキスト説明を返し、それが `wrapExternalContent`（プロンプトインジェクションガード）でラップされ、画像ブロックではなくテキストブロックとしてエージェントに返されます。
4. 画像理解が利用できない、スキップされた、または失敗した場合、ブラウザーは元の画像ブロックを返す動作にフォールバックします。

モデルのフォールバック、タイムアウト、バイト制限、プロファイル、プロバイダーリクエスト設定には、既存の `tools.media.image` / `tools.media.models` フィールドを使用してください。

アクティブなメインモデルがすでにビジョンをサポートしていて、明示的な画像理解モデルが設定されていない場合、OpenClaw は通常の画像結果を維持し、メインモデルがスクリーンショットを直接読み取れるようにします。

<AccordionGroup>

<Accordion title="Ports and reachability">

- 制御サービスは、`gateway.port` から派生したポート（デフォルト `18791` = gateway + 2）でループバックにバインドします。`OPENCLAW_GATEWAY_PORT` は `gateway.port` より優先されます。どちらも同じファミリー内の派生ポートをずらします。
- ローカルの `openclaw` プロファイルは、制御ポートの 9 ポート上から始まる範囲（デフォルト `18800`-`18899`）から `cdpPort`/`cdpUrl` を自動割り当てします。これらは、リモート CDP プロファイルまたは既存セッションのエンドポイント接続にのみ設定してください。未設定の場合、`cdpUrl` は管理されたローカル CDP ポートにデフォルト設定されます。
- `remoteCdpTimeoutMs` は、リモートおよび `attachOnly` CDP HTTP 到達性チェックとタブを開く HTTP リクエストに適用されます。`remoteCdpHandshakeTimeoutMs` は、それらの CDP WebSocket ハンドシェイクに適用されます。
- `localLaunchTimeoutMs` は、ローカルで起動された管理対象 Chrome プロセスが CDP HTTP エンドポイントを公開するための予算です。`localCdpReadyTimeoutMs` は、プロセス検出後の CDP WebSocket 準備完了に対する後続の予算です。Chromium の起動が遅い Raspberry Pi、低スペック VPS、または古いハードウェアでは、これらを増やしてください。値は `120000` ms 以下の正の整数である必要があり、無効な設定値は拒否されます。
- 管理対象 Chrome の起動/準備完了の失敗が繰り返されると、プロファイルごとにサーキットブレーカーが働きます。連続して数回失敗した後、OpenClaw はブラウザーツール呼び出しのたびに Chromium を生成するのではなく、新しい起動試行を短時間停止します。起動問題を修正するか、不要であればブラウザーを無効にするか、修復後に Gateway を再起動してください。
- `actionTimeoutMs` は、呼び出し元が `timeoutMs` を渡さない場合のブラウザー `act` リクエストのデフォルト予算です。クライアントトランスポートは小さな余裕時間を追加するため、長い待機が HTTP 境界でタイムアウトせずに完了できます。
- `tabCleanup` は、プライマリエージェントのブラウザーセッションによって開かれたタブに対するベストエフォートのクリーンアップです。サブエージェント、Cron、ACP のライフサイクルクリーンアップは、セッション終了時に明示的に追跡されたタブを引き続き閉じます。プライマリセッションはアクティブなタブを再利用可能に保ち、その後、アイドル状態または過剰な追跡タブをバックグラウンドで閉じます。

</Accordion>

<Accordion title="SSRF policy">

- ブラウザのナビゲーションと開いているタブは、ナビゲーション前に SSRF ガードで保護され、その後、最終的な `http(s)` URL でもベストエフォートで再チェックされます。
- 厳格な SSRF モードでは、リモート CDP エンドポイント検出と `/json/version` プローブ（`cdpUrl`）もチェックされます。
- Gateway/プロバイダーの `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、`NO_PROXY` 環境変数は、OpenClaw 管理ブラウザを自動的にはプロキシしません。管理対象の Chrome はデフォルトで直接起動されるため、プロバイダーのプロキシ設定によってブラウザの SSRF チェックが弱まることはありません。
- OpenClaw 管理のローカル CDP 準備状況プローブと DevTools WebSocket 接続は、起動された正確なループバックエンドポイントについて管理対象ネットワークプロキシをバイパスするため、オペレータープロキシがループバックの送信をブロックしている場合でも `openclaw browser start` は動作します。
- 管理対象ブラウザ自体をプロキシするには、`--proxy-server=...` や `--proxy-pac-url=...` など、明示的な Chrome プロキシフラグを `browser.extraArgs` 経由で渡します。厳格な SSRF モードでは、プライベートネットワークのブラウザアクセスが意図的に有効化されていない限り、明示的なブラウザプロキシルーティングはブロックされます。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` はデフォルトでオフです。プライベートネットワークのブラウザアクセスが意図的に信頼されている場合にのみ有効化してください。
- `browser.ssrfPolicy.allowPrivateNetwork` はレガシーエイリアスとして引き続きサポートされます。

</Accordion>

<Accordion title="プロファイルの動作">

- `attachOnly: true` は、ローカルブラウザを起動せず、すでに実行中のものがある場合にのみアタッチすることを意味します。
- `headless` はグローバルまたはローカル管理プロファイルごとに設定できます。プロファイルごとの値は `browser.headless` を上書きするため、あるローカル起動プロファイルはヘッドレスのままにし、別のプロファイルは表示状態のままにできます。
- `POST /start?headless=true` と `openclaw browser start --headless` は、`browser.headless` やプロファイル設定を書き換えずに、ローカル管理プロファイルの
  1 回限りのヘッドレス起動を要求します。既存セッション、アタッチ専用、
  リモート CDP プロファイルでは、OpenClaw がそれらのブラウザプロセスを
  起動しないため、この上書きは拒否されます。
- `DISPLAY` または `WAYLAND_DISPLAY` がない Linux ホストでは、環境またはプロファイル/グローバル
  設定のどちらも明示的にヘッドありモードを選択していない場合、ローカル管理プロファイルは
  自動的にヘッドレスをデフォルトにします。`openclaw browser status --json` は
  `headlessSource` を `env`、`profile`、`config`、
  `request`、`linux-display-fallback`、または `default` として報告します。
- `OPENCLAW_BROWSER_HEADLESS=1` は、現在のプロセスのローカル管理起動をヘッドレスに強制します。
  `OPENCLAW_BROWSER_HEADLESS=0` は通常の起動でヘッドありモードを強制し、
  ディスプレイサーバーのない Linux ホストでは実行可能なエラーを返します。
  明示的な `start --headless` 要求は、その 1 回の起動では引き続き優先されます。
- `executablePath` はグローバルまたはローカル管理プロファイルごとに設定できます。プロファイルごとの値は `browser.executablePath` を上書きするため、異なる管理プロファイルで異なる Chromium ベースのブラウザを起動できます。どちらの形式も OS のホームディレクトリに対して `~` を受け付けます。
- `color`（トップレベルおよびプロファイルごと）は、どのプロファイルがアクティブかを見分けられるようにブラウザ UI に色を付けます。
- デフォルトプロファイルは `openclaw`（管理対象スタンドアロン）です。サインイン済みユーザーブラウザを使うには `defaultProfile: "user"` を使用します。
- 自動検出の順序: Chromium ベースの場合はシステムのデフォルトブラウザ。それ以外の場合は Chrome、Brave、Edge、Chromium、Chrome Canary。
- `driver: "existing-session"` は raw CDP の代わりに Chrome DevTools MCP を使用します。Chrome MCP 自動接続を介してアタッチすることも、実行中ブラウザの DevTools エンドポイントがすでにある場合は `cdpUrl` を介してアタッチすることもできます。
- 既存セッションプロファイルをデフォルト以外の Chromium ユーザープロファイル（Brave、Edge など）にアタッチする必要がある場合は、`browser.profiles.<name>.userDataDir` を設定します。このパスも OS のホームディレクトリに対して `~` を受け付けます。

</Accordion>

</AccordionGroup>

## Brave または別の Chromium ベースのブラウザを使用する

**システムのデフォルト** ブラウザが Chromium ベース（Chrome/Brave/Edge など）の場合、
OpenClaw はそれを自動的に使用します。自動検出を上書きするには `browser.executablePath` を設定します。
トップレベルおよびプロファイルごとの `executablePath` 値は、OS のホームディレクトリに対して `~` を受け付けます:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

または、プラットフォームごとに設定で指定します:

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
`existing-session` プロファイルは代わりにすでに実行中のブラウザにアタッチし、
リモート CDP プロファイルは `cdpUrl` の背後にあるブラウザを使用します。

## ローカル制御とリモート制御

- **ローカル制御（デフォルト）:** Gateway がループバック制御サービスを開始し、ローカルブラウザを起動できます。
- **リモート制御（ノードホスト）:** ブラウザがあるマシンでノードホストを実行します。Gateway はブラウザ操作をそこへプロキシします。
- **リモート CDP:** リモートの Chromium ベースブラウザにアタッチするには、
  `browser.profiles.<name>.cdpUrl`（または `browser.cdpUrl`）を設定します。この場合、OpenClaw はローカルブラウザを起動しません。
- ループバック上の外部管理 CDP サービス（たとえば Docker で `127.0.0.1` に公開された Browserless）の場合は、
  `attachOnly: true` も設定します。`attachOnly` のないループバック CDP は、
  ローカルの OpenClaw 管理ブラウザプロファイルとして扱われます。
- `headless` は、OpenClaw が起動するローカル管理プロファイルにのみ影響します。既存セッションまたはリモート CDP ブラウザを再起動したり変更したりすることはありません。
- `executablePath` も同じローカル管理プロファイルのルールに従います。
  実行中のローカル管理プロファイルでこれを変更すると、そのプロファイルは再起動/調整の対象としてマークされ、
  次回の起動で新しいバイナリが使用されます。

停止時の動作はプロファイルモードによって異なります:

- ローカル管理プロファイル: `openclaw browser stop` は
  OpenClaw が起動したブラウザプロセスを停止します
- アタッチ専用およびリモート CDP プロファイル: `openclaw browser stop` は、OpenClaw がブラウザプロセスを
  起動していなくても、アクティブな制御セッションを閉じ、
  Playwright/CDP エミュレーションの上書き（ビューポート、
  カラースキーム、ロケール、タイムゾーン、オフラインモード、および類似の状態）を解放します

リモート CDP URL には認証を含めることができます:

- クエリトークン（例: `https://provider.example?token=<token>`）
- HTTP Basic 認証（例: `https://user:pass@provider.example`）

OpenClaw は `/json/*` エンドポイントを呼び出すとき、および
CDP WebSocket に接続するときに認証を保持します。トークンは設定ファイルにコミットする代わりに、
環境変数またはシークレットマネージャーを使用することを推奨します。

## Node ブラウザプロキシ（ゼロ設定のデフォルト）

ブラウザがあるマシンで **ノードホスト** を実行している場合、OpenClaw は
追加のブラウザ設定なしでブラウザツール呼び出しをそのノードに自動ルーティングできます。
これはリモート Gateway のデフォルトパスです。

注記:

- ノードホストは、**プロキシコマンド** 経由でローカルブラウザ制御サーバーを公開します。
- プロファイルはノード自身の `browser.profiles` 設定（ローカルと同じ）から取得されます。
- プロキシコマンドは、`allowProfiles` に関係なく、永続的なプロファイル変更（`create-profile`、`delete-profile`、`reset-profile`）を許可しません。それらの変更はノード上で直接行ってください。
- `nodeHost.browserProxy.allowProfiles` は任意です。レガシー/デフォルトの動作では空のままにします。設定済みのすべてのプロファイルがプロキシ経由で到達可能なままになります。
- `nodeHost.browserProxy.allowProfiles` を設定すると、OpenClaw はそれを、プロキシが対象にできるプロファイル名を制限する最小権限の境界として扱います。
- 不要な場合は無効化します:
  - ノード側: `nodeHost.browserProxy.enabled=false`
  - ゲートウェイ側: `gateway.nodes.browser.mode="off"`（単一の接続済みブラウザノードを選ぶ `"auto"`、または明示的な node パラメーターを要求する `"manual"` も受け付けます）

## Browserless（ホスト型リモート CDP）

[Browserless](https://browserless.io) は、HTTPS と WebSocket 経由で
CDP 接続 URL を公開するホスト型 Chromium サービスです。OpenClaw はどちらの形式も使用できますが、
リモートブラウザプロファイルでは、Browserless の接続ドキュメントにある直接 WebSocket URL が最も簡単です。

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

- `<BROWSERLESS_API_KEY>` を実際の Browserless トークンに置き換えます。
- Browserless アカウントに一致するリージョンエンドポイントを選択します（Browserless のドキュメントを参照）。
- Browserless から HTTPS ベース URL が提供された場合は、直接 CDP 接続のために
  `wss://` に変換するか、HTTPS URL のままにして OpenClaw に
  `/json/version` を検出させることができます。

### 同じホスト上の Browserless Docker

Browserless を Docker でセルフホストし、OpenClaw がホスト上で実行されている場合は、
Browserless を外部管理 CDP サービスとして扱います:

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
OpenClaw プロセスから到達可能である必要があります。Browserless も一致する到達可能エンドポイントを通知する必要があります。
Browserless の `EXTERNAL` を、`ws://127.0.0.1:3000`、
`ws://browserless:3000`、または安定したプライベート Docker
ネットワークアドレスなど、同じ OpenClaw から到達可能な WebSocket ベースに設定してください。
`/json/version` が OpenClaw から到達できないアドレスを指す `webSocketDebuggerUrl` を返す場合、
CDP HTTP は正常に見えても WebSocket のアタッチは失敗することがあります。

ループバックの Browserless プロファイルで `attachOnly` を未設定のままにしないでください。
`attachOnly` がない場合、OpenClaw はループバックポートをローカル管理ブラウザ
プロファイルとして扱い、そのポートが使用中だが OpenClaw の所有ではないと報告することがあります。

## 直接 WebSocket CDP プロバイダー

一部のホスト型ブラウザサービスは、標準の HTTP ベースの CDP 検出（`/json/version`）ではなく
**直接 WebSocket** エンドポイントを公開します。OpenClaw は 3 つの
CDP URL 形状を受け付け、適切な接続戦略を自動的に選択します:

- **HTTP(S) 検出** - `http://host[:port]` または `https://host[:port]`。
  OpenClaw は `/json/version` を呼び出して WebSocket デバッガー URL を検出し、その後
  接続します。WebSocket フォールバックはありません。
- **直接 WebSocket エンドポイント** - `ws://host[:port]/devtools/<kind>/<id>` または
  `/devtools/browser|page|worker|shared_worker|service_worker/<id>` パスを持つ
  `wss://...`。OpenClaw は WebSocket ハンドシェイク経由で直接接続し、
  `/json/version` を完全にスキップします。
- **ベア WebSocket ルート** - `/devtools/...` パスのない
  `ws://host[:port]` または `wss://host[:port]`（例: [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)）。OpenClaw はまず HTTP
  `/json/version` 検出を試行し（スキームを `http`/`https` に正規化）、
  検出で `webSocketDebuggerUrl` が返された場合はそれを使用します。そうでない場合、OpenClaw は
  ベア root での直接 WebSocket ハンドシェイクにフォールバックします。通知された
  WebSocket エンドポイントが CDP ハンドシェイクを拒否しても、設定されたベア root が
  それを受け付ける場合、OpenClaw はその root にもフォールバックします。これにより、ローカル Chrome を指すベア `ws://` でも接続できます。Chrome は `/json/version` から得られる特定のターゲットごとのパスでのみ WebSocket
  アップグレードを受け付ける一方、ホスト型プロバイダーは、検出
  エンドポイントが Playwright CDP に適さない短命の URL を通知する場合でも、
  root WebSocket エンドポイントを引き続き使用できます。

`openclaw browser doctor` はランタイムのアタッチと同じ検出優先、WebSocket フォールバック
ロジックを使用するため、正常に接続できるベア root URL が
診断で到達不能として報告されることはありません。

### Browserbase

[Browserbase](https://www.browserbase.com) は、組み込みの CAPTCHA 解決、ステルスモード、住宅用
プロキシを備えたヘッドレスブラウザ実行用のクラウドプラットフォームです。

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

- [登録](https://www.browserbase.com/sign-up)して、[概要ダッシュボード](https://www.browserbase.com/overview)から **API Key** をコピーします。
- `<BROWSERBASE_API_KEY>` を実際の Browserbase API キーに置き換えます。
- Browserbase は WebSocket 接続時にブラウザーセッションを自動作成するため、手動でセッションを作成する手順は不要です。
- 現在の無料枠の上限と有料プランについては、[料金](https://www.browserbase.com/pricing)を参照してください。
- 完全な API リファレンス、SDK ガイド、連携例については、[Browserbase ドキュメント](https://docs.browserbase.com)を参照してください。

### Notte

[Notte](https://www.notte.cc) は、組み込みのステルス、住宅プロキシ、CDP ネイティブの WebSocket Gateway を備えた、ヘッドレスブラウザー実行用のクラウドプラットフォームです。

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

- [登録](https://console.notte.cc)して、コンソール設定ページから **API Key** をコピーします。
- `<NOTTE_API_KEY>` を実際の Notte API キーに置き換えます。
- Notte は WebSocket 接続時にブラウザーセッションを自動作成するため、手動でセッションを作成する手順は不要です。WebSocket が切断されると、セッションは破棄されます。
- 現在の無料枠の上限と有料プランについては、[料金](https://www.notte.cc/#pricing)を参照してください。
- 完全な API リファレンス、SDK ガイド、連携例については、[Notte ドキュメント](https://docs.notte.cc)を参照してください。

## セキュリティ

重要な考え方:

- ブラウザー制御はループバック専用です。アクセスは Gateway の認証またはノードペアリングを通じて流れます。
- スタンドアロンのループバックブラウザー HTTP API は **共有シークレット認証のみ** を使用します:
  Gateway トークンのベアラー認証、`x-openclaw-password`、または設定済み Gateway パスワードによる HTTP Basic 認証です。
- Tailscale Serve の ID ヘッダーと `gateway.auth.mode: "trusted-proxy"` は、このスタンドアロンのループバックブラウザー API を認証しません。
- ブラウザー制御が有効で、共有シークレット認証が設定されていない場合、OpenClaw は起動時にブラウザー制御用の認証情報を自動生成して永続化します:
  `gateway.auth.mode` が `none` の場合はトークン、`trusted-proxy` の場合はパスワードです（プロセス外のループバッククライアントが解決できるように、`gateway.auth.password` を通じて永続化されます）。そのモード用の明示的な文字列認証情報がすでに設定されている場合、または `gateway.auth.mode` が `password` の場合、自動生成はスキップされます。
- 生成されたものではなく、自分で管理する安定したシークレットを使いたい場合は、`gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN`、または `OPENCLAW_GATEWAY_PASSWORD` を明示的に設定します。

リモート CDP のヒント:

- 可能な場合は、暗号化されたエンドポイント（HTTPS または WSS）と短命トークンを優先します。
- 長命トークンを設定ファイルに直接埋め込むことは避けます。
- Gateway とすべてのノードホストをプライベートネットワーク（Tailscale）上に置き、公開露出を避けます。
- リモート CDP URL/トークンはシークレットとして扱います。環境変数またはシークレットマネージャーを優先します。

## プロファイル（複数ブラウザー）

OpenClaw は複数の名前付きプロファイル（ルーティング設定）をサポートします。プロファイルには次の種類があります:

- **openclaw 管理**: 独自のユーザーデータディレクトリと CDP ポートを持つ専用の Chromium ベースブラウザーインスタンス
- **リモート**: 明示的な CDP URL（別の場所で実行されている Chromium ベースブラウザー）
- **既存セッション**: Chrome DevTools MCP 自動接続による既存の Chrome プロファイル

デフォルト:

- `openclaw` プロファイルが存在しない場合、自動作成されます。
- `user` プロファイルは Chrome MCP 既存セッション接続用に組み込まれています。
- 既存セッションプロファイルは `user` 以外ではオプトインです。`--driver existing-session` で作成します。
- ローカル CDP ポートはデフォルトで **18800-18899** から割り当てられます。
- プロファイルを削除すると、そのローカルデータディレクトリはゴミ箱へ移動されます。

すべての制御エンドポイントは `?profile=<name>` を受け付けます。CLI は `--browser-profile` を使用します。

## Chrome DevTools MCP 経由の既存セッション

OpenClaw は、公式 Chrome DevTools MCP サーバーを通じて、実行中の Chromium ベースブラウザープロファイルに接続することもできます。これにより、そのブラウザープロファイルで既に開いているタブとログイン状態を再利用します。

公式の背景情報とセットアップ参照:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

組み込みプロファイル: `user`。別の名前、色、またはブラウザーデータディレクトリが必要な場合は、独自のカスタム既存セッションプロファイルを作成します。

デフォルトでは、組み込みの `user` プロファイルは Chrome MCP 自動接続を使用し、デフォルトのローカル Google Chrome プロファイルを対象にします。Brave、Edge、Chromium、またはデフォルト以外の Chrome プロファイルには `userDataDir` を使用します。`~` は OS のホームディレクトリに展開されます:

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

1. リモートデバッグ用のそのブラウザーの検査ページを開きます。
2. リモートデバッグを有効にします。
3. ブラウザーを実行したままにし、OpenClaw が接続するときに接続プロンプトを承認します。

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

成功時の見え方:

- `status` に `driver: existing-session` が表示される
- `status` に `transport: chrome-mcp` が表示される
- `status` に `running: true` が表示される
- `tabs` に、すでに開いているブラウザータブが一覧表示される
- `snapshot` が選択中のライブタブから refs を返す

接続が機能しない場合に確認すること:

- 対象の Chromium ベースブラウザーがバージョン `144+` である
- そのブラウザーの検査ページでリモートデバッグが有効になっている
- ブラウザーに接続同意プロンプトが表示され、それを承認した
- Chrome が明示的な `--remote-debugging-port` で起動されている場合は、Chrome MCP 自動接続に依存する代わりに、`browser.profiles.<name>.cdpUrl` をその DevTools エンドポイントに設定する
- `openclaw doctor` は古い拡張機能ベースのブラウザー設定を移行し、デフォルトの自動接続プロファイル向けに Chrome がローカルにインストールされていることを確認しますが、ブラウザー側のリモートデバッグを有効にすることはできません

エージェントでの使用:

- ユーザーのログイン済みブラウザー状態が必要な場合は、`profile="user"` を使用します。
- カスタム既存セッションプロファイルを使用する場合は、その明示的なプロファイル名を渡します。
- ユーザーがコンピューターの前にいて接続プロンプトを承認できる場合にのみ、このモードを選択します。
- Gateway またはノードホストは `npx chrome-devtools-mcp@latest --autoConnect` を起動できます。

注記:

- この経路は、ログイン済みのブラウザーセッション内で動作できるため、分離された `openclaw` プロファイルよりもリスクが高くなります。
- OpenClaw はこのドライバー用にブラウザーを起動しません。接続するだけです。
- OpenClaw はここで、公式 Chrome DevTools MCP の `--autoConnect` フローを使用します。`userDataDir` が設定されている場合、そのユーザーデータディレクトリを対象にするためにそのまま渡されます。
- 既存セッションは、選択されたホスト上、または接続済みのブラウザーノード経由で接続できます。Chrome が別の場所にあり、ブラウザーノードが接続されていない場合は、代わりにリモート CDP またはノードホストを使用します。

### カスタム Chrome MCP 起動

デフォルトの `npx chrome-devtools-mcp@latest` フローが望ましくない場合（オフラインホスト、固定バージョン、同梱バイナリ）、プロファイルごとに起動される Chrome DevTools MCP サーバーを上書きします:

| フィールド   | 役割                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | `npx` の代わりに起動する実行ファイルです。そのまま解決され、絶対パスも尊重されます。                                      |
| `mcpArgs`    | `mcpCommand` にそのまま渡される引数配列です。デフォルトの `chrome-devtools-mcp@latest --autoConnect` 引数を置き換えます。 |

既存セッションプロファイルに `cdpUrl` が設定されている場合、OpenClaw は `--autoConnect` をスキップし、そのエンドポイントを Chrome MCP に自動的に転送します:

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP 検出エンドポイント）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接 CDP WebSocket）。

エンドポイントフラグと `userDataDir` は併用できません。`cdpUrl` が設定されている場合、Chrome MCP はプロファイルディレクトリを開くのではなく、エンドポイントの背後で実行中のブラウザーに接続するため、Chrome MCP 起動では `userDataDir` が無視されます。

<Accordion title="Existing-session feature limitations">

管理対象の `openclaw` プロファイルと比べると、既存セッションドライバーにはより多くの制約があります:

- **スクリーンショット** - ページキャプチャと `--ref` 要素キャプチャは機能します。CSS `--element` セレクターは機能しません。ページまたは ref ベースの要素スクリーンショットには Playwright は不要です。（`--full-page` は、既存セッションだけでなくどのプロファイルでも `--ref` または `--element` と併用できません。）
- **アクション** - `click`、`type`、`hover`、`scrollIntoView`、`drag`、`select` にはスナップショット refs が必要です（CSS セレクターは不可）。`click-coords` は可視ビューポート座標をクリックし、スナップショット ref は不要です。`click` は左ボタンのみです（ボタン上書きや修飾キーは不可）。`type` は `slowly=true` をサポートしません。`fill` または `press` を使用します。`press` は `delayMs` をサポートしません。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill`、`evaluate` は呼び出しごとの `timeoutMs` 上書きをサポートしません。`select` は単一の値を受け付けます。`batch` はサポートされません。アクションは個別に送信してください。
- **待機 / アップロード / ダイアログ** - `wait --url` は完全一致、部分文字列、glob パターンをサポートします（管理対象と同じ）。`wait --load networkidle` は既存セッションプロファイルではサポートされません（管理対象および raw/リモート CDP プロファイルでは機能します）。アップロードフックには `ref` または `inputRef` が必要で、一度に 1 ファイルのみ、CSS `element` は不可です。ダイアログフックはタイムアウト上書きや `dialogId` をサポートしません。
- **ダイアログの可視性** - 管理対象ブラウザーのアクションレスポンスには、アクションがモーダルダイアログを開いた場合に `blockedByDialog` と `browserState.dialogs.pending` が含まれます。スナップショットにも保留中のダイアログ状態が含まれます。ダイアログが保留中の間に `browser dialog --accept/--dismiss --dialog-id <id>` で応答します。OpenClaw 外で処理されたダイアログは `browserState.dialogs.recent` に表示されます。
- **管理対象のみの機能** - PDF エクスポート、ダウンロードインターセプト、`responsebody` には引き続き管理対象ブラウザー経路が必要です。

</Accordion>

## 分離の保証

- **専用ユーザーデータディレクトリ**: 個人のブラウザープロファイルには決して触れません。
- **専用ポート**: 開発ワークフローとの衝突を防ぐため、`9222` を避けます。
- **決定的なタブ制御**: `tabs` は最初に `suggestedTargetId` を返し、その後に `t1` のような安定した `tabId` ハンドル、任意のラベル、生の `targetId` を返します。エージェントは `suggestedTargetId` を再利用するべきです。生の ID はデバッグと互換性のために引き続き利用できます。

## ブラウザー選択

ローカルで起動するとき、OpenClaw は最初に利用可能なものを選択します:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath` で上書きできます。

プラットフォーム:

- macOS: `/Applications` と `~/Applications` を確認します。
- Linux: `/usr/bin`、`/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium`、`/usr/lib/chromium-browser` 配下の一般的な Chrome/Brave/Edge/Chromium の場所に加え、`PLAYWRIGHT_BROWSERS_PATH` または `~/.cache/ms-playwright` 配下の Playwright 管理 Chromium を確認します。
- Windows: 一般的なインストール場所を確認します。

## 制御 API（任意）

スクリプト作成とデバッグ向けに、Gateway は小さな **loopback 専用 HTTP
制御 API** と、対応する `openclaw browser` CLI（スナップショット、refs、wait
power-ups、JSON 出力、デバッグワークフロー）を公開します。完全なリファレンスは
[ブラウザー制御 API](/ja-JP/tools/browser-control) を参照してください。

## トラブルシューティング

Linux 固有の問題（特に snap Chromium）については、
[ブラウザーのトラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting) を参照してください。

WSL2 Gateway + Windows Chrome の split-host セットアップについては、
[WSL2 + Windows + リモート Chrome CDP のトラブルシューティング](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting) を参照してください。

### CDP 起動失敗とナビゲーション SSRF ブロックの違い

これらは異なる失敗クラスであり、示しているコードパスも異なります。

- **CDP 起動または準備完了の失敗** は、OpenClaw がブラウザー制御プレーンの健全性を確認できないことを意味します。
- **ナビゲーション SSRF ブロック** は、ブラウザー制御プレーンは健全だが、ページナビゲーションの対象がポリシーによって拒否されたことを意味します。

一般的な例:

- CDP 起動または準備完了の失敗:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - loopback 外部 CDP サービスが `attachOnly: true` なしで設定されている場合の
    `Port <port> is in use for profile "<name>" but not by openclaw`
- ナビゲーション SSRF ブロック:
  - `start` と `tabs` は動作する一方で、`open`、`navigate`、スナップショット、またはタブを開くフローがブラウザー/ネットワークポリシーエラーで失敗する

この最小シーケンスを使って、2 つを切り分けます。

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

結果の読み方:

- `start` が `not reachable after start` で失敗する場合は、まず CDP の準備完了をトラブルシュートします。
- `start` は成功するが `tabs` が失敗する場合、制御プレーンはまだ健全ではありません。これはページナビゲーションの問題ではなく、CDP 到達性の問題として扱います。
- `start` と `tabs` は成功するが `open` または `navigate` が失敗する場合、ブラウザー制御プレーンは起動しており、失敗はナビゲーションポリシーまたは対象ページにあります。
- `start`、`tabs`、`open` がすべて成功する場合、基本的な管理ブラウザー制御パスは健全です。

重要な動作の詳細:

- ブラウザー設定は、`browser.ssrfPolicy` を設定していない場合でも、デフォルトで fail-closed SSRF ポリシーオブジェクトになります。
- local loopback の `openclaw` 管理プロファイルでは、CDP ヘルスチェックは OpenClaw 自身のローカル制御プレーンに対するブラウザー SSRF 到達性の強制を意図的にスキップします。
- ナビゲーション保護は別です。`start` または `tabs` の成功結果は、後続の `open` または `navigate` の対象が許可されることを意味しません。

セキュリティガイダンス:

- デフォルトでブラウザー SSRF ポリシーを緩和しないでください。
- 広範なプライベートネットワークアクセスよりも、`hostnameAllowlist` や `allowedHostnames` のような狭いホスト例外を優先してください。
- `dangerouslyAllowPrivateNetwork: true` は、プライベートネットワークへのブラウザーアクセスが必要でレビュー済みの、意図的に信頼された環境でのみ使用してください。

## エージェントツール + 制御の仕組み

エージェントはブラウザー自動化用に **1 つのツール** を取得します。

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

対応関係:

- `browser snapshot` は安定した UI ツリー（AI または ARIA）を返します。
- `browser act` はスナップショットの `ref` ID を使ってクリック/入力/ドラッグ/選択します。
- `browser screenshot` はピクセルをキャプチャします（ページ全体、要素、またはラベル付き refs）。
- `browser doctor` は Gateway、Plugin、プロファイル、ブラウザー、タブの準備完了をチェックします。
- `browser` は以下を受け付けます:
  - 名前付きブラウザープロファイル（openclaw、chrome、またはリモート CDP）を選択する `profile`。
  - ブラウザーが存在する場所を選択する `target`（`sandbox` | `host` | `node`）。
  - サンドボックス化されたセッションでは、`target: "host"` に `agents.defaults.sandbox.browser.allowHostControl=true` が必要です。
  - `target` が省略された場合: サンドボックス化されたセッションはデフォルトで `sandbox`、非サンドボックスセッションはデフォルトで `host` になります。
  - ブラウザー対応 Node が接続されている場合、`target="host"` または `target="node"` で固定しない限り、ツールはそこへ自動ルーティングすることがあります。

これにより、エージェントの決定性が保たれ、壊れやすいセレクターを避けられます。

## 関連

- [ツール概要](/ja-JP/tools) - 利用可能なすべてのエージェントツール
- [サンドボックス化](/ja-JP/gateway/sandboxing) - サンドボックス化された環境でのブラウザー制御
- [セキュリティ](/ja-JP/gateway/security) - ブラウザー制御のリスクとハードニング
