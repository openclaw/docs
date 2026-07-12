---
read_when:
    - エージェント制御のブラウザ自動化を追加する
    - OpenClaw が自分の Chrome に干渉する原因をデバッグする
    - macOS アプリでのブラウザ設定とライフサイクルの実装
summary: 統合ブラウザ制御サービス + アクションコマンド
title: ブラウザ（OpenClaw 管理）
x-i18n:
    generated_at: "2026-07-12T14:51:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cf43bd54994d29d48cfc1e16889ec34af83e885c1dd1b63c287f0df116c7f0bf
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw は、エージェントが制御する**専用の Chrome/Brave/Edge/Chromium プロファイル**を実行できます。これは Gateway 内部の小さなローカル制御サービス（loopback のみ）を通じて動作し、個人用ブラウザから分離されています。

- **エージェント専用の独立したブラウザ**と考えてください。`openclaw` プロファイルが個人用ブラウザプロファイルに触れることはありません。
- エージェントは、この分離された環境でタブを開き、ページを読み、クリックし、文字を入力します。
- 一方、組み込みの `user` プロファイルは、Chrome DevTools MCP を介して、実際にログイン済みの Chrome セッションへ接続します。

## 利用できる機能

- **openclaw** という名前の独立したブラウザプロファイル（デフォルトではオレンジ色のアクセント）。
- 決定論的なタブ制御（一覧表示／開く／フォーカス／閉じる）。
- エージェント操作（クリック／入力／ドラッグ／選択）、スナップショット、スクリーンショット、PDF。
- Playwright ベースのプロファイルでは、添付ファイルへの直接ナビゲーションが管理対象のダウンロードディレクトリに保存され、最終 URL のポリシー検証後に `{ url, suggestedFilename, path }` メタデータが返されます。
- Playwright ベースのエージェント操作で直ちに 1 件以上のダウンロードが開始された場合、同じ管理対象メタデータを含む `downloads` 配列が返されます。
- ブラウザ Plugin が有効な場合に、スナップショット、安定したタブ、古くなった参照、手動対応が必要な障害からの復旧ループをエージェントに教える、同梱の `browser-automation` skill。
- オプションのマルチプロファイル対応（`openclaw`、`work`、`remote` など）。

このブラウザは、日常的に使用するためのブラウザでは**ありません**。エージェントによる自動化と検証のための、安全で分離された環境です。

macOS では、Chrome 系のシステムプロファイルから、独立した管理対象プロファイルへ Cookie を明示的にコピーできます。管理対象ブラウザでは引き続き専用のユーザーデータディレクトリが使用されます。コピーされるのは選択した Cookie のみであり、ローカルストレージと IndexedDB はコピーされません。インポートコマンドと制限については、[プロファイル](#profiles-multi-browser)または [`openclaw browser` CLI リファレンス](/ja-JP/cli/browser)を参照してください。

## クイックスタート

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

「Browser disabled」は、Plugin または `browser.enabled` が無効であることを意味します。[設定](#configuration)および [Plugin の制御](#plugin-control)を参照してください。

`openclaw browser` 自体が存在しない場合、またはエージェントからブラウザツールを利用できないと報告された場合は、[ブラウザコマンドまたはツールが見つからない場合](#missing-browser-command-or-tool)に進んでください。

## Plugin の制御

デフォルトの `browser` ツールは、同梱の Plugin です。同じ `browser` ツール名を登録する別の Plugin に置き換えるには、これを無効にします。

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

デフォルトを使用するには、`plugins.entries.browser.enabled` と `browser.enabled=true` の両方が必要です。Plugin のみを無効にすると、`openclaw browser` CLI、`browser.request` Gateway メソッド、エージェントツール、制御サービスが一体として削除されます。置き換え先のために、`browser.*` 設定はそのまま保持されます。

Plugin がサービスを再登録できるようにするため、ブラウザ設定を変更した後は Gateway の再起動が必要です。

## エージェント向けガイダンス

ツールプロファイルに関する注意: `tools.profile: "coding"` には `web_search` と `web_fetch` が含まれますが、完全な `browser` ツールは含まれません。エージェントまたは生成されたサブエージェントがブラウザ自動化を使用できるようにするには、プロファイル段階で browser を追加します。

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

単一のエージェントでは、`agents.list[].tools.alsoAllow: ["browser"]` を使用します。サブエージェントポリシーはプロファイルのフィルタリング後に適用されるため、`tools.subagents.tools.allow: ["browser"]` だけでは不十分です。

ブラウザ Plugin には、2 段階のエージェント向けガイダンスが含まれています。

- `browser` ツールの説明には、常に有効な簡潔な契約が含まれます。適切なプロファイルを選択し、参照を同じタブ内に維持し、タブの指定には `tabId`／ラベルを使用し、複数手順の作業ではブラウザ skill を読み込みます。
- 同梱の `browser-automation` skill には、より詳細な操作ループが含まれます。最初にステータスとタブを確認し、作業用タブにラベルを付け、操作前にスナップショットを取得し、UI の変更後に再度スナップショットを取得し、古くなった参照から一度だけ復旧します。また、ログイン／2FA／CAPTCHA、カメラ／マイクによる障害については推測せず、手動操作が必要であると報告します。

Plugin が有効な場合、Plugin に同梱された Skills はエージェントが利用できる Skills の一覧に表示されます。完全な skill の指示は必要に応じて読み込まれるため、通常のターンで完全なトークンコストが発生することはありません。

## ブラウザコマンドまたはツールが見つからない場合

アップグレード後に `openclaw browser` が不明なコマンドとなる場合、`browser.request` が見つからない場合、またはエージェントからブラウザツールを利用できないと報告された場合、一般的な原因は、`plugins.allow` リストに `browser` が含まれておらず、ルートに `browser` 設定ブロックも存在しないことです。次のように追加します。

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

ルートに明示的な `browser` ブロック（`browser.enabled=true` や `browser.profiles.<name>` など、`browser` 配下の任意のキー）がある場合、制限付きの `plugins.allow` が設定されていても、同梱のブラウザ Plugin が有効になります。これは同梱チャンネルの設定動作と同じです。`plugins.entries.browser.enabled=true` と `tools.alsoAllow: ["browser"]` は、それだけでは許可リストへの登録の代わりになりません。`plugins.allow` を完全に削除しても、デフォルトの動作に戻ります。

## プロファイル: `openclaw`、`user`、`chrome`

- `openclaw`: 管理対象の分離されたブラウザ（拡張機能は不要）。
- `user`: **実際にログイン済みの Chrome** セッションに接続する、組み込みの Chrome DevTools MCP 接続プロファイル。OpenClaw が初めて接続するとき、Chrome に操作をブロックする「Allow remote debugging?」プロンプトが表示されるため、誰かがコンピューターの前にいる必要があります。
- `chrome`: **実際にログイン済みの Chrome** セッション用の組み込み [Chrome 拡張機能](/ja-JP/tools/chrome-extension)プロファイル。リモートデバッグポートではなく OpenClaw ブラウザ拡張機能を通じてタブを操作するため、コンピューターの前に誰もいなくてもスマートフォンから使用でき、「Allow remote debugging?」プロンプトは表示されません。

エージェントによるブラウザツール呼び出しでは、次のように選択します。

- デフォルト: 分離された `openclaw` ブラウザを使用します。
- 既存のログイン済みセッションが必要で、ユーザーが**コンピューターから離れている**場合（Telegram、WhatsApp など）は、`profile="chrome"`（拡張機能）を優先します。
- 既存のログイン済みセッションが必要で、ユーザーが接続プロンプトを承認するために**コンピューターの前にいる**場合は、`profile="user"`（Chrome MCP）を優先します。
- 特定のブラウザモードを使用する場合、`profile` で明示的に上書きします。

管理対象モードをデフォルトにする場合は、`browser.defaultProfile: "openclaw"` を設定します。

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

呼び出し元が明示的な `snapshotFormat` または `mode` を渡さない場合、`browser.snapshotDefaults.mode: "efficient"` によってデフォルトの `snapshot` 抽出モードが変更されます。呼び出しごとのスナップショットオプションについては、[ブラウザ制御 API](/ja-JP/tools/browser-control)を参照してください。

### スクリーンショットのビジョン処理（テキスト専用モデルのサポート）

メインモデルがテキスト専用（ビジョン／マルチモーダル非対応）の場合、ブラウザのスクリーンショットはモデルが読み取れない画像ブロックとして返されます。ブラウザのスクリーンショットでは既存の画像理解設定が再利用されるため、メディア理解用に設定された画像モデルを使用して、ブラウザ固有のモデル設定なしでスクリーンショットをテキストとして説明できます。

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

1. エージェントが `browser screenshot` を呼び出すと、通常どおり画像がディスクに保存されます。
2. ブラウザツールは、設定済みのメディア画像モデル、共有メディアモデル、画像モデルのデフォルト、または認証済みの画像プロバイダーを使用してスクリーンショットを説明できるか、既存の画像理解ランタイムに問い合わせます。
3. ビジョンモデルはテキストによる説明を返します。これは `wrapExternalContent`（プロンプトインジェクション対策）でラップされ、画像ブロックではなくテキストブロックとしてエージェントに返されます。
4. 画像理解が利用できない場合、スキップされた場合、または失敗した場合、ブラウザは元の画像ブロックを返す動作にフォールバックします。

スクリーンショットの画像ブロックは非公開のツール結果です。エージェントは内容を確認できますが、OpenClaw がチャンネルへの返信に自動で添付することはありません。スクリーンショットを共有するには、メッセージツールを使用して明示的に送信するようエージェントに依頼してください。

モデルのフォールバック、タイムアウト、バイト制限、プロファイル、プロバイダーのリクエスト設定には、既存の `tools.media.image`／`tools.media.models` フィールドを使用します。

アクティブなメインモデルがすでにビジョンに対応しており、明示的な画像理解モデルが設定されていない場合、OpenClaw は通常の画像結果を維持し、メインモデルがスクリーンショットを直接読み取れるようにします。

<AccordionGroup>

<Accordion title="ポートと到達可能性">

- 制御サービスは、`gateway.port` から導出されたポートで local loopback にバインドします（デフォルトの `18791` = Gateway + 2）。`OPENCLAW_GATEWAY_PORT` は `gateway.port` より優先され、どちらを変更しても同じポート群の導出ポートが移動します。
- ローカルの `openclaw` プロファイルでは、制御ポートの 9 ポート上から始まる範囲（デフォルトは `18800`～`18899`）から `cdpPort`/`cdpUrl` が自動的に割り当てられます。これらを設定するのは、
  リモート CDP プロファイルまたは既存セッションのエンドポイントへの接続に限ってください。未設定の場合、`cdpUrl` は
  管理対象のローカル CDP ポートにデフォルト設定されます。
- `remoteCdpTimeoutMs` は、リモートおよび `attachOnly` の CDP HTTP 到達性
  チェックと、タブを開く HTTP リクエストに適用されます。`remoteCdpHandshakeTimeoutMs` は、
  それらの CDP WebSocket ハンドシェイクに適用されます。永続的なリモート Playwright タブ列挙では、
  この 2 つのうち大きい方を処理期限として使用します。
- `localLaunchTimeoutMs` は、ローカルで起動された管理対象 Chrome
  プロセスが CDP HTTP エンドポイントを公開するまでの時間枠です。`localCdpReadyTimeoutMs` は、
  プロセス検出後に CDP WebSocket が使用可能になるまでの追加の時間枠です。
  Chromium の起動が遅い Raspberry Pi、低スペックの VPS、または古いハードウェアでは、
  これらの値を増やしてください。値は `120000` ms 以下の正の整数である必要があり、無効な
  設定値は拒否されます。
- 管理対象 Chrome の起動または準備に繰り返し失敗すると、プロファイルごとに
  サーキットブレーカーが作動します。数回連続して失敗すると、OpenClaw はブラウザツールが呼び出されるたびに
  Chromium を生成する代わりに、新しい起動試行を短時間停止します。起動時の問題を修正するか、
  ブラウザが不要な場合は無効にするか、修復後に
  Gateway を再起動してください。
- `actionTimeoutMs` は、呼び出し元が `timeoutMs` を渡さない場合に、ブラウザの `act` リクエストへ適用されるデフォルトの時間枠です。長時間の待機が HTTP 境界でタイムアウトせず完了できるように、クライアントトランスポートは小さな猶予時間を追加します。
- `tabCleanup` は、プライマリエージェントのブラウザセッションで開かれたタブに対するベストエフォートのクリーンアップです。サブエージェント、cron、ACP のライフサイクルクリーンアップでは、セッション終了時に明示的に追跡されているタブを引き続き閉じます。プライマリセッションではアクティブなタブを再利用可能な状態に保ち、アイドル状態または過剰な追跡対象タブをバックグラウンドで閉じます。

</Accordion>

<Accordion title="SSRF ポリシー">

- ブラウザのナビゲーションとタブを開くリクエストは、事前チェックされます。アクションの実行中およびアクション後の制限付き猶予期間中、保護対象の Playwright 操作（クリック、座標クリック、ホバー、ドラッグ、スクロール、選択、キー押下、入力、フォーム入力、evaluate）は、ポリシーで拒否されたトップレベルおよびサブフレームのドキュメント読み込みを HTTP リクエストのバイト送信前に遮断し、その後、最終的な `http(s)` URL をベストエフォートで再チェックします。
- OpenClaw が管理する Chrome を新たに起動するたびに、OpenClaw はベストエフォートでネットワーク予測を無効化し、拒否対象の読み込みに対して Chromium で確認されている投機的な事前接続を抑制します。これは多層防御であり、ポリシー境界ではありません。制御サービスの再起動をまたいで再利用されるブラウザや、その他のブラウザバックエンドには、この強化策が適用されない場合があります。Playwright のルーティングは依然としてネットワークファイアウォールではなく、リダイレクトの各ホップ、ポップアップの最初のリクエスト、Service Worker のトラフィック、制限付き保護期間の終了後に実行されるページコード、またはすべてのバックグラウンド／サブリソース経路を遮断するものではありません。完全な外向き通信の分離には、所有者側での分離またはポリシーを適用するプロキシが必要です。
- 厳格 SSRF モードでは、リモート CDP エンドポイントの検出と `/json/version` プローブ（`cdpUrl`）もチェックされます。
- Gateway／プロバイダーの `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、`NO_PROXY` 環境変数によって、OpenClaw が管理するブラウザが自動的にプロキシ経由になることはありません。プロバイダーのプロキシ設定によってブラウザの SSRF チェックが弱められないように、管理対象 Chrome はデフォルトで直接接続を使用して起動します。
- OpenClaw が管理するローカル CDP の準備状況プローブと DevTools WebSocket 接続では、起動された正確な local loopback エンドポイントに対して管理対象ネットワークプロキシをバイパスするため、オペレーターのプロキシが local loopback への外向き通信をブロックしている場合でも、`openclaw browser start` は引き続き機能します。
- 管理対象ブラウザ自体をプロキシ経由にするには、`browser.extraArgs` を介して `--proxy-server=...` や `--proxy-pac-url=...` などの Chrome プロキシフラグを明示的に渡します。厳格 SSRF モードでは、プライベートネットワークへのブラウザアクセスが意図的に有効化されていない限り、明示的なブラウザのプロキシルーティングはブロックされます。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` はデフォルトでオフです。プライベートネットワークへのブラウザアクセスを意図的に信頼する場合にのみ有効にしてください。
- `browser.ssrfPolicy.allowPrivateNetwork` は従来のエイリアスとして引き続きサポートされます。

</Accordion>

<Accordion title="プロファイルの動作">

- `attachOnly: true` は、ローカルブラウザを決して起動せず、すでに実行中のブラウザがある場合にのみ接続することを意味します。
- `headless` はグローバルまたはローカルの管理対象プロファイルごとに設定できます。プロファイルごとの値は `browser.headless` より優先されるため、ローカルで起動する一方のプロファイルをヘッドレスにし、もう一方を表示状態にできます。
- `POST /start?headless=true` と `openclaw browser start --headless` は、
  `browser.headless` やプロファイル設定を書き換えることなく、ローカルの管理対象プロファイルを
  1 回だけヘッドレスで起動するよう要求します。既存セッション、接続専用、および
  リモート CDP プロファイルでは、OpenClaw がそれらのブラウザプロセスを起動しないため、
  このオーバーライドは拒否されます。
- `DISPLAY` または `WAYLAND_DISPLAY` がない Linux ホストでは、環境またはプロファイル／グローバル
  設定のいずれでも表示モードが明示的に選択されていない場合、ローカルの管理対象プロファイルは
  自動的にヘッドレスをデフォルトとします。曖昧さのないブラウザレベルの形式
  `openclaw browser --json status` を使用してください。末尾に指定する `openclaw browser status --json`
  も、`status` 自体には `--json` が定義されていないため機能します。このコマンドは、
  `headlessSource` を `env`、`profile`、`config`、
  `request`、`linux-display-fallback`、または `default` として報告します。
- `OPENCLAW_BROWSER_HEADLESS=1` は、現在のプロセスにおけるローカル管理対象の起動を
  強制的にヘッドレスにします。`OPENCLAW_BROWSER_HEADLESS=0` は通常の起動を強制的に
  表示モードにし、ディスプレイサーバーがない Linux ホストでは対処方法を示すエラーを返します。
  明示的な `start --headless` リクエストは、その 1 回の起動について引き続き優先されます。
- ブラウザ制御ルートとプログラムから使用するクライアントは、ディスプレイがない場合のエラーについて
  人が読める `error` を維持し、安定した理由
  `no_display_for_headed_profile` を公開します。その `details` には `profile`、
  `requestedHeadless`、`headlessSource`、`displayPresent` のみが含まれるため、API クライアントは
  メッセージテキストと照合することなく、適切な修正方法を選択できます。
- 実行中のローカル管理対象プロファイルに対して、status と doctor は Chrome の
  ブラウザレベル CDP エンドポイントに問い合わせ、レンダラー、バックエンド、デバイス／ドライバー、機能の
  状態、ドライバーの回避策、アクセラレーション動画機能を取得します。結果は
  そのブラウザプロセスについてキャッシュされ、
  `openclaw browser --json status` で完全に公開されます。受動的な status 呼び出しでは Chrome は起動されません。
  既存セッション、拡張機能、リモート CDP、サンドボックスブラウザは別扱いのままであり、
  この管理対象ホスト経路からは検査されません。
- ヘッドレスの管理対象 Chrome では、引き続き保守的な `--disable-gpu` がデフォルトとして使用されます。
  診断機能がアクセラレーションを有効にしたり、グローバルなアクセラレーション設定を追加したり、
  サンドボックスブラウザにデバイスアクセスを付与したりすることはありません。
- `executablePath` はグローバルまたはローカルの管理対象プロファイルごとに設定できます。プロファイルごとの値は `browser.executablePath` より優先されるため、管理対象プロファイルごとに異なる Chromium ベースのブラウザを起動できます。どちらの形式でも、OS のホームディレクトリを表す `~` を使用できます。
- `color`（トップレベルおよびプロファイルごと）はブラウザ UI に色を付けるため、どのプロファイルがアクティブかを確認できます。
- デフォルトのプロファイルは `openclaw`（管理対象のスタンドアロン）です。ログイン済みユーザーブラウザを使用するには、`defaultProfile: "user"` を指定します。
- 自動検出の順序：Chromium ベースの場合はシステムのデフォルトブラウザ、それ以外は Chrome、Brave、Edge、Chromium、Chrome Canary。
- `driver: "existing-session"` は、生の CDP の代わりに Chrome DevTools MCP を使用します。Chrome MCP の自動接続を介して接続することも、実行中のブラウザ用 DevTools エンドポイントがすでにある場合は `cdpUrl` を介して接続することもできます。
- `driver: "extension"` は、[OpenClaw Chrome 拡張機能](/ja-JP/tools/chrome-extension)を介して、ログイン済みの Chrome を操作します。リレーが自身の local loopback エンドポイントを所有するため、これらのプロファイルでは `cdpUrl` を指定できません。これは、コンピューターの前に誰もいない状態でも機能する唯一のログイン済みブラウザモードです。
- 既存セッションプロファイルをデフォルト以外の Chromium ユーザープロファイル（Brave、Edge など）に接続する場合は、`browser.profiles.<name>.userDataDir` を設定します。このパスでも、OS のホームディレクトリを表す `~` を使用できます。

</Accordion>

</AccordionGroup>

## Brave または別の Chromium ベースのブラウザを使用する

**システムのデフォルト**ブラウザが Chromium ベース（Chrome／Brave／Edge など）の場合、
OpenClaw はそれを自動的に使用します。自動検出をオーバーライドするには、
`browser.executablePath` を設定します。トップレベルおよびプロファイルごとの `executablePath` 値では、
OS のホームディレクトリを表す `~` を使用できます。

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

または、プラットフォームごとに設定ファイルで指定します。

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

プロファイルごとの `executablePath` は、OpenClaw が起動するローカルの管理対象プロファイルにのみ影響します。
`existing-session` プロファイルは、代わりにすでに実行中のブラウザへ接続し、
リモート CDP プロファイルは `cdpUrl` の接続先ブラウザを使用します。

## ローカル制御とリモート制御

- **ローカル制御（デフォルト）：** Gateway が local loopback 制御サービスを起動し、ローカルブラウザを起動できます。
- **リモート制御（Node ホスト）：** ブラウザがあるマシン上で Node ホストを実行します。Gateway はブラウザ操作をそのホストにプロキシします。
- **リモート CDP：** リモートの Chromium ベースブラウザに接続するには、
  `browser.profiles.<name>.cdpUrl`（または `browser.cdpUrl`）を設定します。この場合、OpenClaw はローカルブラウザを起動しません。
- local loopback 上で外部管理されている CDP サービス（たとえば、
  Docker で `127.0.0.1` に公開された Browserless）についても、`attachOnly: true` を設定します。`attachOnly` のない local loopback CDP は、
  OpenClaw が管理するローカルブラウザプロファイルとして扱われます。
- `headless` は、OpenClaw が起動するローカルの管理対象プロファイルにのみ影響します。既存セッションやリモート CDP ブラウザを再起動または変更することはありません。
- `executablePath` にも同じローカル管理対象プロファイルのルールが適用されます。実行中の
  ローカル管理対象プロファイルで変更すると、そのプロファイルには再起動／再調整が必要であることが記録され、
  次回の起動で新しいバイナリが使用されます。

停止時の動作はプロファイルモードによって異なります。

- ローカル管理対象プロファイル：`openclaw browser stop` は、
  OpenClaw が起動したブラウザプロセスを停止します
- 接続専用およびリモート CDP プロファイル：`openclaw browser stop` は、OpenClaw が
  ブラウザプロセスを起動していなくても、アクティブな制御セッションを閉じ、
  Playwright／CDP のエミュレーションオーバーライド（ビューポート、
  カラースキーム、ロケール、タイムゾーン、オフラインモード、および同様の状態）を解除します

リモート CDP URL には認証情報を含めることができます。

- クエリトークン（例：`https://provider.example?token=<token>`）
- HTTP Basic 認証（例：`https://user:pass@provider.example`）

OpenClaw は、`/json/*` エンドポイントの呼び出し時および
CDP WebSocket への接続時に認証情報を維持します。トークンは設定ファイルにコミットせず、
環境変数またはシークレットマネージャーを使用することを推奨します。

## Node ブラウザプロキシ（設定不要のデフォルト）

ブラウザがあるマシン上で **Node ホスト**を実行すると、OpenClaw は
追加のブラウザ設定なしで、ブラウザツールの呼び出しをその Node へ
自動的にルーティングできます。これはリモート Gateway のデフォルト経路です。

注：

- Node ホストは、ローカルのブラウザ制御サーバーを**プロキシコマンド**経由で公開します。
- プロファイルは Node 自体の `browser.profiles` 設定（ローカルと同じ）から取得されます。
- プロキシコマンドは、`allowProfiles` の設定にかかわらず、永続的なプロファイル変更（`create-profile`、`delete-profile`、`reset-profile`）を許可しません。これらの変更は Node 上で直接行ってください。
- `nodeHost.browserProxy.allowProfiles` は省略可能です。空のままにすると、従来のデフォルト動作となり、設定済みのすべてのプロファイルへプロキシ経由で引き続きアクセスできます。
- `nodeHost.browserProxy.allowProfiles` を設定すると、OpenClaw はこれを最小権限の境界として扱い、プロキシが対象にできるプロファイル名を制限します。
- 不要な場合は無効にします。
  - Node 側: `nodeHost.browserProxy.enabled=false`
  - Gateway 側: `gateway.nodes.browser.mode="off"`（接続済みのブラウザ Node を 1 つ選択する `"auto"`、または明示的な Node パラメーターを必須にする `"manual"` も指定できます）

## Browserless（ホスト型リモート CDP）

[Browserless](https://browserless.io) は、HTTPS と WebSocket 経由で CDP 接続 URL を公開するホスト型 Chromium サービスです。OpenClaw はどちらの形式も使用できますが、リモートブラウザプロファイルでは、Browserless の接続ドキュメントに記載されている直接 WebSocket URL を使用するのが最も簡単です。

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

- `<BROWSERLESS_API_KEY>` を実際の Browserless トークンに置き換えてください。
- Browserless アカウントに一致するリージョンエンドポイントを選択してください（ドキュメントを参照）。
- Browserless から HTTPS ベース URL が提供された場合は、直接 CDP 接続用に `wss://` に変換するか、HTTPS URL のままにして OpenClaw に `/json/version` を検出させることができます。

### 同じホスト上の Browserless Docker

Browserless を Docker でセルフホストし、OpenClaw をホスト上で実行する場合は、Browserless を外部管理の CDP サービスとして扱います。

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

`browser.profiles.browserless.cdpUrl` のアドレスは、OpenClaw プロセスから到達可能でなければなりません。Browserless も、それに対応する到達可能なエンドポイントを公開する必要があります。Browserless の `EXTERNAL` を、`ws://127.0.0.1:3000`、`ws://browserless:3000`、または安定したプライベート Docker ネットワークアドレスなど、OpenClaw から到達可能な同じ WebSocket ベース URL に設定してください。`/json/version` が、OpenClaw から到達できないアドレスを指す `webSocketDebuggerUrl` を返す場合、CDP HTTP は正常に見えても WebSocket のアタッチは失敗します。

ループバックの Browserless プロファイルでは、`attachOnly` を未設定のままにしないでください。`attachOnly` がない場合、OpenClaw はループバックポートをローカル管理ブラウザプロファイルとして扱い、そのポートは使用中だが OpenClaw が所有していないと報告することがあります。

## 直接 WebSocket CDP プロバイダー

一部のホスト型ブラウザサービスは、標準の HTTP ベースの CDP 検出（`/json/version`）ではなく、**直接 WebSocket** エンドポイントを公開します。OpenClaw は 3 種類の CDP URL 形式を受け入れ、適切な接続方法を自動的に選択します。

- **HTTP(S) 検出** - `http://host[:port]` または `https://host[:port]`。
  OpenClaw は `/json/version` を呼び出して WebSocket デバッガー URL を検出し、接続します。WebSocket へのフォールバックはありません。
- **直接 WebSocket エンドポイント** - `ws://host[:port]/devtools/<kind>/<id>`、または `/devtools/browser|page|worker|shared_worker|service_worker/<id>` パスを持つ `wss://...`。
  OpenClaw は WebSocket ハンドシェイクで直接接続し、`/json/version` を完全にスキップします。
- **ベアルート WebSocket** - `/devtools/...` パスのない `ws://host[:port]` または `wss://host[:port]`（例: [Browserless](https://browserless.io)、[Browserbase](https://www.browserbase.com)）。OpenClaw は最初に HTTP `/json/version` 検出を試行します（スキームを `http`/`https` に正規化）。検出結果に `webSocketDebuggerUrl` が含まれていればそれを使用し、含まれていなければベアルートでの直接 WebSocket ハンドシェイクにフォールバックします。公開された WebSocket エンドポイントが CDP ハンドシェイクを拒否しても、設定されたベアルートが受け入れる場合、OpenClaw はそのルートにもフォールバックします。これにより、ローカル Chrome を指すベアな `ws://` でも接続できます。Chrome は `/json/version` から得られるターゲット固有のパスでのみ WebSocket アップグレードを受け入れる一方、ホスト型プロバイダーは、検出エンドポイントが Playwright CDP に適さない短命な URL を公開する場合でも、ルート WebSocket エンドポイントを使用できます。

`openclaw browser doctor` は、ランタイムのアタッチと同じく、検出を先に試し、WebSocket にフォールバックするロジックを使用します。そのため、正常に接続できるベアルート URL が診断で到達不能と報告されることはありません。

### Browserbase

[Browserbase](https://www.browserbase.com) は、組み込みの CAPTCHA 解決、ステルスモード、住宅用プロキシを備えたヘッドレスブラウザ実行用クラウドプラットフォームです。

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

- [サインアップ](https://www.browserbase.com/sign-up)し、[Overview dashboard](https://www.browserbase.com/overview)から **API Key** をコピーします。
- `<BROWSERBASE_API_KEY>` を実際の Browserbase API キーに置き換えてください。
- Browserbase は WebSocket 接続時にブラウザセッションを自動作成するため、手動でセッションを作成する必要はありません。
- 現在の無料枠の制限と有料プランについては、[料金](https://www.browserbase.com/pricing)を参照してください。
- API リファレンス全体、SDK ガイド、統合例については、[Browserbase ドキュメント](https://docs.browserbase.com)を参照してください。

### Notte

[Notte](https://www.notte.cc) は、組み込みのステルス機能、住宅用プロキシ、CDP ネイティブ WebSocket Gateway を備えたヘッドレスブラウザ実行用クラウドプラットフォームです。

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

注:

- [サインアップ](https://console.notte.cc)し、コンソールの設定ページから **API Key** をコピーします。
- `<NOTTE_API_KEY>` を実際の Notte API キーに置き換えてください。
- Notte は WebSocket 接続時にブラウザセッションを自動作成するため、手動でセッションを作成する必要はありません。WebSocket が切断されるとセッションは破棄されます。
- 現在の無料枠の制限と有料プランについては、[料金](https://www.notte.cc/#pricing)を参照してください。
- API リファレンス全体、SDK ガイド、統合例については、[Notte ドキュメント](https://docs.notte.cc)を参照してください。

## セキュリティ

要点:

- ブラウザ制御はループバック専用です。アクセスは Gateway の認証または Node のペアリングを経由します。
- スタンドアロンのループバックブラウザ HTTP API は、**共有シークレット認証のみ**を使用します。Gateway トークンによる Bearer 認証、`x-openclaw-password`、または設定済みの Gateway パスワードによる HTTP Basic 認証です。
- Tailscale Serve の ID ヘッダーと `gateway.auth.mode: "trusted-proxy"` は、このスタンドアロンのループバックブラウザ API を認証**しません**。
- ブラウザ制御が有効で、共有シークレット認証が設定されていない場合、OpenClaw は起動時にブラウザ制御用の認証情報を自動生成して永続化します。`gateway.auth.mode` が `none` の場合はトークン、`trusted-proxy` の場合はパスワードです（プロセス外のループバッククライアントが解決できるように、`gateway.auth.password` 経由で永続化されます）。そのモードに対して明示的な文字列の認証情報がすでに設定されている場合、または `gateway.auth.mode` が `password` の場合、自動生成はスキップされます。
- 生成されたものではなく、自分で管理する安定したシークレットを使用する場合は、`gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN`、または `OPENCLAW_GATEWAY_PASSWORD` を明示的に設定してください。

リモート CDP のヒント:

- 可能な場合は、暗号化されたエンドポイント（HTTPS または WSS）と短命なトークンを使用してください。
- 長期間有効なトークンを設定ファイルに直接埋め込まないでください。
- Gateway とすべての Node ホストをプライベートネットワーク（Tailscale）上に置き、公開しないでください。
- リモート CDP の URL／トークンをシークレットとして扱い、環境変数またはシークレットマネージャーを使用してください。

## プロファイル（複数ブラウザ）

OpenClaw は、名前付きの複数プロファイル（ルーティング設定）をサポートします。プロファイルには次の種類があります。

- **OpenClaw 管理**: 独自のユーザーデータディレクトリと CDP ポートを持つ専用の Chromium ベースのブラウザインスタンス
- **リモート**: 明示的な CDP URL（別の場所で実行される Chromium ベースのブラウザ）
- **既存セッション**: Chrome DevTools MCP の自動接続を使用する既存の Chrome プロファイル

デフォルト:

- `openclaw` プロファイルが存在しない場合は自動作成されます。
- `user` プロファイルは、Chrome MCP による既存セッションへのアタッチ用として組み込まれています。
- `user` 以外の既存セッションプロファイルはオプトインです。`--driver existing-session` を使用して作成します。
- ローカル CDP ポートは、デフォルトで **18800-18899** から割り当てられます。
- プロファイルを削除すると、そのローカルデータディレクトリはゴミ箱に移動されます。

すべての制御エンドポイントは `?profile=<name>` を受け付けます。CLI では `--browser-profile` を使用します。

## Chrome DevTools MCP を使用した既存セッション

OpenClaw は、公式の Chrome DevTools MCP サーバーを介して、実行中の Chromium ベースのブラウザプロファイルにアタッチすることもできます。これにより、そのブラウザプロファイルですでに開かれているタブとログイン状態を再利用できます。

公式の背景情報とセットアップ資料:

- [Chrome for Developers: ブラウザセッションで Chrome DevTools MCP を使用する](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

組み込みプロファイル: `user`。別の名前、色、またはブラウザデータディレクトリを使用する場合は、独自の既存セッションプロファイルを作成してください。

デフォルトでは、組み込みの `user` プロファイルは Chrome MCP の自動接続を使用し、ローカルのデフォルト Google Chrome プロファイルを対象とします。Brave、Edge、Chromium、またはデフォルト以外の Chrome プロファイルには `userDataDir` を使用してください。`~` は OS のホームディレクトリに展開されます。

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

次に、対応するブラウザで以下を行います。

1. リモートデバッグ用のブラウザ検査ページを開きます。
2. リモートデバッグを有効にします。
3. ブラウザを実行したままにし、OpenClaw がアタッチするときに接続確認プロンプトを承認します。

一般的な検査ページ:

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

成功時の状態:

- `status` に `driver: existing-session` と表示される
- `status` に `transport: chrome-mcp` と表示される
- `status` に `running: true` と表示される
- `tabs` にすでに開かれているブラウザタブが一覧表示される
- `snapshot` が選択されたライブタブの参照を返す

アタッチが機能しない場合の確認事項:

- 対象の Chromium ベースのブラウザがバージョン `144+` である
- そのブラウザの検査ページでリモートデバッグが有効になっている
- ブラウザにアタッチ同意プロンプトが表示され、それを承認した
- Chrome が明示的な `--remote-debugging-port` を指定して起動されている場合は、Chrome MCP の自動接続に依存せず、`browser.profiles.<name>.cdpUrl` をその DevTools エンドポイントに設定する
- `openclaw doctor` は、古い拡張機能ベースのブラウザ設定を移行し、デフォルトの自動接続プロファイルについて Chrome がローカルにインストールされているか確認しますが、ブラウザ側のリモートデバッグを有効にすることはできません

エージェントでの使用:

- ユーザーがログイン済みのブラウザー状態を使用する必要がある場合は、`profile="user"` を使用します。
- カスタムの既存セッションプロファイルを使用する場合は、その明示的なプロファイル名を渡します。
- このモードは、ユーザーがコンピューターの前にいて、接続プロンプトを承認できる場合にのみ選択してください。
- Gateway または Node ホストは、`npx chrome-devtools-mcp@latest --autoConnect` を起動できます。

注:

- このパスは、ログイン済みのブラウザーセッション内で操作できるため、分離された `openclaw` プロファイルよりもリスクが高くなります。
- OpenClaw はこのドライバー用にブラウザーを起動せず、接続のみを行います。
- OpenClaw は、ここでは公式の Chrome DevTools MCP `--autoConnect` フローを使用します。`userDataDir` が設定されている場合、そのユーザーデータディレクトリを対象にするため、そのまま渡されます。
- 既存セッションには、選択したホストまたは接続済みのブラウザー Node 経由で接続できます。Chrome が別の場所にあり、ブラウザー Node が接続されていない場合は、代わりにリモート CDP または Node ホストを使用してください。
- Chrome MCP のターゲットとスナップショット参照は、1 つの MCP サブプロセスのスコープに限定されます。そのプロセスが再起動した後は、`browser tabs` を再度実行し、ターゲット固有の作業を行う前に新しいターゲットを明示的に選択し、参照を使用する前に新しいスナップショットを取得してください。各参照は、そのターゲットと最新のスナップショットに対してのみ有効です。URL が一致している場合でも、古いエイリアスは置き換え後のタブには引き継がれません。
- Chrome DevTools MCP は現在、プロセスローカルな数値ページ ID によってページツールをルーティングします。プロセススコープのハンドルにより、サブプロセス置換をまたいだ再利用は防止されますが、隣接するツール呼び出し間でプロセス内のブラウザーコンテキストが置き換えられると、操作の対象が変わる可能性があります。完全にアトミックなルーティングには、安定したターゲット ID に対するアップストリームのページツールサポートが必要です。

### カスタム Chrome MCP の起動

デフォルトの `npx chrome-devtools-mcp@latest` フローが要件に合わない場合（オフラインホスト、固定バージョン、ベンダー提供バイナリ）は、プロファイルごとに起動される Chrome DevTools MCP サーバーを上書きします。

| フィールド     | 動作                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | `npx` の代わりに起動する実行可能ファイル。そのまま解決され、絶対パスも使用できます。                                          |
| `mcpArgs`    | `mcpCommand` にそのまま渡される引数配列。デフォルトの `chrome-devtools-mcp@latest --autoConnect` 引数を置き換えます。 |

既存セッションプロファイルに `cdpUrl` が設定されている場合、OpenClaw は `--autoConnect` を省略し、エンドポイントを Chrome MCP に自動的に転送します。

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP 検出エンドポイント）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接 CDP WebSocket）。

エンドポイントフラグと `userDataDir` は併用できません。`cdpUrl` が設定されている場合、Chrome MCP の起動時には `userDataDir` が無視されます。これは、Chrome MCP がプロファイルディレクトリを開くのではなく、エンドポイントの背後で実行中のブラウザーに接続するためです。

<Accordion title="既存セッション機能の制限">

管理対象の `openclaw` プロファイルと比べて、既存セッションドライバーにはより多くの制限があります。

- **スクリーンショット** - ページキャプチャと `--ref` 要素キャプチャは使用できますが、CSS `--element` セレクターは使用できません。ページまたは参照ベースの要素スクリーンショットに Playwright は必要ありません。（`--full-page` は、既存セッションだけでなく、どのプロファイルでも `--ref` または `--element` と併用できません。）
- **操作** - `click`、`type`、`hover`、`scrollIntoView`、`drag`、`select` にはスナップショット参照が必要です（CSS セレクターは使用できません）。`click-coords` は表示中のビューポート座標をクリックし、スナップショット参照を必要としません。`click` は左ボタンのみをサポートします（ボタンの上書きや修飾キーは使用できません）。`type` は `slowly=true` をサポートしません。`fill` または `press` を使用してください。`press` は `delayMs` をサポートしません。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill` は、呼び出しごとの `timeoutMs` 上書きをサポートしませんが、`evaluate` はサポートします。`select` は単一の値を受け付けます。`batch` はサポートされていないため、操作を個別に送信してください。
- **待機 / アップロード / ダイアログ** - `wait --url` は、完全一致、部分文字列、glob パターンをサポートします（管理対象と同じ）。`wait --load networkidle` は既存セッションプロファイルではサポートされません（管理対象プロファイルおよび生の/リモート CDP プロファイルでは動作します）。アップロードフックには `ref` または `inputRef` が必要で、1 回につき 1 ファイルのみ対応し、CSS `element` は使用できません。ダイアログフックは、タイムアウトの上書きや `dialogId` をサポートしません。
- **ダイアログの可視性** - 管理対象ブラウザーの操作レスポンスには、操作によってモーダルダイアログが開いた場合に `blockedByDialog` と `browserState.dialogs.pending` が含まれます。スナップショットにも保留中のダイアログ状態が含まれます。ダイアログが保留中の場合は、`browser dialog --accept/--dismiss --dialog-id <id>` で応答してください。OpenClaw の外部で処理されたダイアログは、`browserState.dialogs.recent` に表示されます。
- **管理対象専用機能** - PDF エクスポート、ダウンロードのインターセプト、`responsebody` には、引き続き管理対象ブラウザーパスが必要です。

</Accordion>

## 分離保証

- **専用ユーザーデータディレクトリ**: 個人用ブラウザープロファイルには一切触れません。
- **専用ポート**: 開発ワークフローとの競合を防ぐため、`9222` を使用しません。
- **決定論的なタブ制御**: `tabs` は最初に `suggestedTargetId` を返し、その後に `t1` などの安定した `tabId` ハンドル、任意のラベル、生の `targetId` を返します。エージェントは `suggestedTargetId` を再利用する必要があります。生の ID はデバッグと互換性のために引き続き使用できます。

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
- Linux: `/usr/bin`、`/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium`、`/usr/lib/chromium-browser` 配下の一般的な Chrome/Brave/Edge/Chromium の場所に加え、`PLAYWRIGHT_BROWSERS_PATH` または `~/.cache/ms-playwright` 配下の Playwright 管理対象 Chromium を確認します。
- Windows: 一般的なインストール場所を確認します。

## Control API（任意）

スクリプト作成とデバッグのために、Gateway は小規模な **loopback 専用 HTTP Control API** と、それに対応する `openclaw browser` CLI（スナップショット、参照、待機機能の強化、JSON 出力、デバッグワークフロー）を公開します。完全なリファレンスについては、[ブラウザー Control API](/ja-JP/tools/browser-control) を参照してください。

## トラブルシューティング

Linux 固有の問題（特に snap Chromium）については、[ブラウザーのトラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting) を参照してください。

WSL2 Gateway と Windows Chrome の分割ホスト構成については、[WSL2 + Windows + リモート Chrome CDP のトラブルシューティング](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting) を参照してください。

### CDP 起動失敗とナビゲーション SSRF ブロックの違い

これらは異なる障害クラスであり、それぞれ異なるコードパスを示します。

- **CDP の起動または準備完了の失敗**は、OpenClaw がブラウザーのコントロールプレーンが正常であることを確認できないことを意味します。
- **ナビゲーション SSRF ブロック**は、ブラウザーのコントロールプレーンは正常ですが、ページナビゲーションのターゲットがポリシーによって拒否されたことを意味します。

一般的な例:

- CDP の起動または準備完了の失敗:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - loopback 外部 CDP サービスが `attachOnly: true` なしで構成されている場合の `Port <port> is in use for profile "<name>" but not by openclaw`
- ナビゲーション SSRF ブロック:
  - `start` と `tabs` は引き続き動作する一方で、`open`、`navigate`、スナップショット、またはタブを開くフローがブラウザー/ネットワークポリシーエラーで失敗する

この 2 つを切り分けるには、次の最小シーケンスを使用します。

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

結果の読み方:

- `start` が `not reachable after start` で失敗する場合は、まず CDP の準備完了状態をトラブルシューティングしてください。
- `start` は成功するものの `tabs` が失敗する場合、コントロールプレーンはまだ正常ではありません。これはページナビゲーションの問題ではなく、CDP の到達性の問題として扱ってください。
- `start` と `tabs` は成功するものの `open` または `navigate` が失敗する場合、ブラウザーのコントロールプレーンは起動済みであり、障害はナビゲーションポリシーまたは対象ページにあります。
- `start`、`tabs`、`open` がすべて成功する場合、基本的な管理対象ブラウザーの制御パスは正常です。

重要な動作の詳細:

- `browser.ssrfPolicy` を構成していない場合でも、ブラウザー構成はデフォルトでフェイルクローズの SSRF ポリシーオブジェクトになります。
- local loopback の `openclaw` 管理対象プロファイルでは、OpenClaw 自身のローカルコントロールプレーンに対して、CDP ヘルスチェックがブラウザー SSRF 到達性の強制を意図的に省略します。
- ナビゲーション保護は別個のものです。`start` または `tabs` が成功しても、その後の `open` または `navigate` のターゲットが許可されるとは限りません。

セキュリティガイダンス:

- デフォルトではブラウザー SSRF ポリシーを緩和**しないでください**。
- 広範なプライベートネットワークアクセスよりも、`hostnameAllowlist` や `allowedHostnames` などの限定的なホスト例外を優先してください。
- `dangerouslyAllowPrivateNetwork: true` は、プライベートネットワークへのブラウザーアクセスが必要で、レビュー済みの意図的に信頼された環境でのみ使用してください。

## エージェントツールと制御の仕組み

エージェントは、ブラウザー自動化用に **1 つのツール**を使用できます。

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

対応関係:

- `browser snapshot` は、安定した UI ツリー（AI または ARIA）を返します。
- `browser act` は、スナップショットの `ref` ID を使用してクリック/入力/ドラッグ/選択を行います。
- `browser screenshot` は、ピクセルをキャプチャします（ページ全体、要素、またはラベル付き参照）。
- `browser doctor` は、Gateway、Plugin、プロファイル、ブラウザー、タブの準備完了状態を確認します。
- `browser` は次を受け付けます。
  - 名前付きブラウザープロファイル（openclaw、chrome、またはリモート CDP）を選択する `profile`。
  - ブラウザーの場所を選択する `target`（`sandbox` | `host` | `node`）。
  - サンドボックス化されたセッションでは、`target: "host"` に `agents.defaults.sandbox.browser.allowHostControl=true` が必要です。
  - `target` が省略された場合、サンドボックス化されたセッションではデフォルトが `sandbox`、非サンドボックスセッションではデフォルトが `host` になります。
  - ブラウザー対応 Node が接続されている場合、`target="host"` または `target="node"` で固定しない限り、ツールは自動的にそこへルーティングすることがあります。

これにより、エージェントの動作が決定論的になり、壊れやすいセレクターを回避できます。

## 関連情報

- [ツールの概要](/ja-JP/tools) - 利用可能なすべてのエージェントツール
- [サンドボックス化](/ja-JP/gateway/sandboxing) - サンドボックス環境でのブラウザー制御
- [セキュリティ](/ja-JP/gateway/security) - ブラウザー制御のリスクと堅牢化
