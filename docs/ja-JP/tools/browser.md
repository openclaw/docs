---
read_when:
    - エージェント制御のブラウザ自動化を追加しています
    - openclaw があなた自身の Chrome に干渉している理由をデバッグする
    - macOSアプリでブラウザ設定 + ライフサイクルを実装する
summary: 統合ブラウザ制御サービス + アクションコマンド
title: ブラウザ（OpenClaw管理）
x-i18n:
    generated_at: "2026-04-10T04:43:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd3424f62178bbf25923b8bc8e4d9f70e330f35428d01fe153574e5fa45d7604
    source_path: tools/browser.md
    workflow: 15
---

# ブラウザ（openclaw 管理）

OpenClaw は、エージェントが制御する**専用の Chrome/Brave/Edge/Chromium プロファイル**を実行できます。
これはあなたの個人用ブラウザから分離されており、Gateway 内の小さなローカル
制御サービス（loopback のみ）を通じて管理されます。

初心者向けの見方:

- これは**エージェント専用の別ブラウザ**だと考えてください。
- `openclaw` プロファイルは、あなたの個人用ブラウザプロファイルに**触れません**。
- エージェントは安全なレーン内で**タブを開き、ページを読み取り、クリックし、入力**できます。
- 組み込みの `user` プロファイルは、Chrome MCP を通じてあなたの実際のサインイン済み Chrome セッションに接続します。

## 利用できる機能

- **openclaw** という名前の個別ブラウザプロファイル（デフォルトではオレンジのアクセント）。
- 決定論的なタブ制御（一覧表示/開く/フォーカス/閉じる）。
- エージェントアクション（クリック/入力/ドラッグ/選択）、スナップショット、スクリーンショット、PDF。
- オプションのマルチプロファイル対応（`openclaw`、`work`、`remote`、...）。

このブラウザは**日常使い用ではありません**。これはエージェントの自動化と検証のための、安全で分離された操作面です。

## クイックスタート

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

「Browser disabled」と表示された場合は、設定で有効にし（下記参照）、Gateway を再起動してください。

`openclaw browser` 自体がまったく存在しない場合、またはエージェントがブラウザツールを
利用できないと言う場合は、[ブラウザコマンドまたはツールが見つからない](/ja-JP/tools/browser#missing-browser-command-or-tool) に進んでください。

## プラグイン制御

デフォルトの `browser` ツールは、現在はデフォルトで有効な状態で同梱されるバンドル済みプラグインです。
つまり、OpenClaw の残りのプラグインシステムを削除しなくても、これを無効化または置き換えできます。

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

同じ `browser` ツール名を提供する別のプラグインをインストールする前に、バンドル済みプラグインを無効化してください。デフォルトのブラウザ体験には、以下の両方が必要です。

- `plugins.entries.browser.enabled` が無効化されていないこと
- `browser.enabled=true`

プラグインだけをオフにすると、バンドル済みブラウザ CLI（`openclaw browser`）、
Gateway メソッド（`browser.request`）、エージェントツール、デフォルトのブラウザ制御サービスはすべてまとめて消えます。
`browser.*` 設定は、置き換え用プラグインが再利用できるようそのまま残ります。

バンドル済みブラウザプラグインは、現在ではブラウザランタイム実装も所有しています。
コアには、共有の Plugin SDK ヘルパーと、古い内部 import パス向けの互換性 re-export のみが残されています。
実際には、ブラウザプラグインパッケージを削除または置き換えると、2 つ目のコア所有ランタイムが残るのではなく、ブラウザ機能セット全体が取り除かれます。

ブラウザ設定の変更では、新しい設定でバンドル済みプラグインがブラウザサービスを再登録できるようにするため、引き続き Gateway の再起動が必要です。

## ブラウザコマンドまたはツールが見つからない

アップグレード後に `openclaw browser` が突然未知のコマンドになった場合、または
エージェントがブラウザツールがないと報告する場合、最も一般的な原因は、`browser` を含まない制限的な `plugins.allow` リストです。

壊れた設定の例:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

`browser` をプラグイン許可リストに追加して修正してください。

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

重要な注意点:

- `plugins.allow` が設定されている場合、`browser.enabled=true` だけでは不十分です。
- `plugins.allow` が設定されている場合、`plugins.entries.browser.enabled=true` だけでも不十分です。
- `tools.alsoAllow: ["browser"]` は、バンドル済みブラウザプラグインを読み込み**ません**。これは、プラグインがすでに読み込まれた後にツールポリシーを調整するだけです。
- 制限的なプラグイン許可リストが不要な場合、`plugins.allow` を削除してもデフォルトのバンドル済みブラウザ動作が復元されます。

典型的な症状:

- `openclaw browser` が未知のコマンドになる。
- `browser.request` がない。
- エージェントがブラウザツールを利用不可または欠落と報告する。

## プロファイル: `openclaw` と `user`

- `openclaw`: 管理された分離ブラウザ（拡張機能不要）。
- `user`: あなたの**実際のサインイン済み Chrome** セッション用の組み込み Chrome MCP 接続プロファイル。

エージェントのブラウザツール呼び出しでは:

- デフォルト: 分離された `openclaw` ブラウザを使用します。
- 既存のログイン済みセッションが重要で、ユーザーがコンピューターの前にいて接続プロンプトのクリック/承認ができる場合は、`profile="user"` を優先します。
- `profile` は、特定のブラウザモードを使いたいときの明示的な上書きです。

デフォルトで管理モードを使いたい場合は、`browser.defaultProfile: "openclaw"` を設定してください。

## 設定

ブラウザ設定は `~/.openclaw/openclaw.json` にあります。

```json5
{
  browser: {
    enabled: true, // デフォルト: true
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // デフォルトは trusted-network モード
      // allowPrivateNetwork: true, // 従来のエイリアス
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // 従来の単一プロファイル上書き
    remoteCdpTimeoutMs: 1500, // リモート CDP HTTP タイムアウト（ms）
    remoteCdpHandshakeTimeoutMs: 3000, // リモート CDP WebSocket ハンドシェイクタイムアウト（ms）
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

注意点:

- ブラウザ制御サービスは、`gateway.port` から導出されたポートの loopback にバインドされます
  （デフォルト: `18791`、つまり gateway + 2）。
- Gateway ポート（`gateway.port` または `OPENCLAW_GATEWAY_PORT`）を上書きすると、
  導出されるブラウザポートも同じ「ファミリー」に収まるようにずれます。
- `cdpUrl` は、未設定時には管理対象のローカル CDP ポートがデフォルトになります。
- `remoteCdpTimeoutMs` は、リモート（非 loopback）CDP 到達性チェックに適用されます。
- `remoteCdpHandshakeTimeoutMs` は、リモート CDP WebSocket 到達性チェックに適用されます。
- ブラウザのナビゲーション/タブを開く操作には、ナビゲーション前に SSRF ガードが適用され、ナビゲーション後の最終 `http(s)` URL に対してベストエフォートで再チェックされます。
- strict SSRF モードでは、リモート CDP エンドポイントの検出/プローブ（`cdpUrl`。`/json/version` 参照を含む）もチェックされます。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` のデフォルトは `true` です（trusted-network モデル）。strict な public-only ブラウジングにするには `false` に設定してください。
- `browser.ssrfPolicy.allowPrivateNetwork` は、互換性のため従来のエイリアスとして引き続きサポートされています。
- `attachOnly: true` は、「ローカルブラウザを絶対に起動せず、すでに実行中の場合のみ接続する」ことを意味します。
- `color` とプロファイルごとの `color` はブラウザ UI に色味を付け、どのプロファイルがアクティブかを視覚的に確認できるようにします。
- デフォルトプロファイルは `openclaw` です（OpenClaw 管理のスタンドアロンブラウザ）。サインイン済みのユーザーブラウザを使うには `defaultProfile: "user"` を使用してください。
- 自動検出順序: Chromium ベースであればシステムのデフォルトブラウザ、それ以外の場合は Chrome → Brave → Edge → Chromium → Chrome Canary。
- ローカルの `openclaw` プロファイルには `cdpPort`/`cdpUrl` が自動割り当てされます。これらを設定するのはリモート CDP の場合だけにしてください。
- `driver: "existing-session"` は、生の CDP の代わりに Chrome DevTools MCP を使用します。
  この driver では `cdpUrl` を設定しないでください。
- 既存セッションプロファイルを Brave や Edge などのデフォルト以外の Chromium ユーザープロファイルに接続する場合は、
  `browser.profiles.<name>.userDataDir` を設定してください。

## Brave（または別の Chromium ベースブラウザ）を使う

**システムのデフォルト**ブラウザが Chromium ベース（Chrome/Brave/Edge など）の場合、
OpenClaw は自動的にそれを使用します。自動検出を上書きするには `browser.executablePath` を設定してください。

CLI の例:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## ローカル制御とリモート制御

- **ローカル制御（デフォルト）:** Gateway が loopback 制御サービスを起動し、ローカルブラウザを起動できます。
- **リモート制御（ノードホスト）:** ブラウザがあるマシン上でノードホストを実行すると、Gateway はブラウザアクションをそこにプロキシできます。
- **リモート CDP:** `browser.profiles.<name>.cdpUrl`（または `browser.cdpUrl`）を設定して、
  リモートの Chromium ベースブラウザに接続します。この場合、OpenClaw はローカルブラウザを起動しません。

停止時の動作はプロファイルモードによって異なります:

- ローカル管理プロファイル: `openclaw browser stop` は
  OpenClaw が起動したブラウザプロセスを停止します
- attach-only および remote CDP プロファイル: `openclaw browser stop` はアクティブな
  制御セッションを閉じ、Playwright/CDP のエミュレーション上書き（ビューポート、
  カラースキーム、ロケール、タイムゾーン、オフラインモード、および類似の状態）を解放します。
  この場合でも、OpenClaw が起動したブラウザプロセスは存在しません

リモート CDP URL には認証情報を含めることができます:

- クエリトークン（例: `https://provider.example?token=<token>`）
- HTTP Basic 認証（例: `https://user:pass@provider.example`）

OpenClaw は `/json/*` エンドポイント呼び出し時と
CDP WebSocket 接続時の両方で認証情報を保持します。
トークンを設定ファイルにコミットする代わりに、環境変数またはシークレットマネージャーを使うことを推奨します。

## ノードブラウザプロキシ（デフォルトでゼロ設定）

ブラウザがあるマシン上で**ノードホスト**を実行している場合、OpenClaw は
追加のブラウザ設定なしでブラウザツール呼び出しをそのノードへ自動ルーティングできます。
これはリモート Gateway のデフォルトパスです。

注意点:

- ノードホストは、ローカルのブラウザ制御サーバーを**プロキシコマンド**経由で公開します。
- プロファイルはノード自身の `browser.profiles` 設定から取得されます（ローカルと同じ）。
- `nodeHost.browserProxy.allowProfiles` はオプションです。従来/デフォルトの動作にするには空のままにしてください。設定済みのすべてのプロファイルが、プロファイル作成/削除ルートを含めて、プロキシ経由で引き続き到達可能です。
- `nodeHost.browserProxy.allowProfiles` を設定すると、OpenClaw はそれを最小権限の境界として扱います。許可リストにあるプロファイルのみを対象にでき、永続プロファイルの作成/削除ルートはプロキシ面でブロックされます。
- 不要であれば無効化できます:
  - ノード側: `nodeHost.browserProxy.enabled=false`
  - Gateway 側: `gateway.nodes.browser.mode="off"`

## Browserless（ホスト型リモート CDP）

[Browserless](https://browserless.io) は、HTTPS と WebSocket 経由で
CDP 接続 URL を公開するホスト型 Chromium サービスです。OpenClaw はどちらの形式も使用できますが、
リモートブラウザプロファイルでは、もっとも簡単なのは Browserless の接続ドキュメントにある
直接の WebSocket URL です。

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

- `<BROWSERLESS_API_KEY>` を実際の Browserless トークンに置き換えてください。
- Browserless アカウントに対応するリージョンエンドポイントを選択してください（詳細はそのドキュメントを参照）。
- Browserless から HTTPS ベース URL が提供される場合は、それを
  直接 CDP 接続用の `wss://` に変換するか、HTTPS URL のままにして OpenClaw に
  `/json/version` を検出させることができます。

## 直接 WebSocket CDP プロバイダー

一部のホスト型ブラウザサービスは、標準の HTTP ベース CDP 検出（`/json/version`）ではなく
**直接 WebSocket** エンドポイントを公開しています。OpenClaw はその両方をサポートします:

- **HTTP(S) エンドポイント** — OpenClaw は `/json/version` を呼び出して
  WebSocket デバッガー URL を検出し、その後接続します。
- **WebSocket エンドポイント**（`ws://` / `wss://`）— OpenClaw は `/json/version` をスキップして
  直接接続します。これは、
  [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)、または
  WebSocket URL を提供する任意のプロバイダーのようなサービスで使用してください。

### Browserbase

[Browserbase](https://www.browserbase.com) は、組み込みの CAPTCHA 解決、ステルスモード、
住宅用プロキシを備えたヘッドレスブラウザ実行用のクラウドプラットフォームです。

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

- [サインアップ](https://www.browserbase.com/sign-up) して、
  [Overview ダッシュボード](https://www.browserbase.com/overview) から **API Key**
  をコピーしてください。
- `<BROWSERBASE_API_KEY>` を実際の Browserbase API キーに置き換えてください。
- Browserbase は WebSocket 接続時にブラウザセッションを自動作成するため、
  手動のセッション作成手順は不要です。
- 無料プランでは、同時セッション 1 つと月あたり 1 ブラウザ時間が利用できます。
  有料プランの上限については [pricing](https://www.browserbase.com/pricing) を参照してください。
- 完全な API リファレンス、SDK ガイド、統合例については
  [Browserbase docs](https://docs.browserbase.com) を参照してください。

## セキュリティ

主な考え方:

- ブラウザ制御は loopback のみです。アクセスは Gateway の認証またはノードペアリングを経由します。
- スタンドアロンの loopback ブラウザ HTTP API は、**shared-secret 認証のみ**を使用します:
  Gateway トークンの Bearer 認証、`x-openclaw-password`、または
  設定された Gateway パスワードを使う HTTP Basic 認証です。
- Tailscale Serve の identity ヘッダーと `gateway.auth.mode: "trusted-proxy"` は、
  このスタンドアロン loopback ブラウザ API を**認証しません**。
- ブラウザ制御が有効で、shared-secret 認証が設定されていない場合、OpenClaw は
  起動時に `gateway.auth.token` を自動生成し、それを設定に永続化します。
- `gateway.auth.mode` がすでに
  `password`、`none`、または `trusted-proxy` の場合、OpenClaw はそのトークンを自動生成しません。
- Gateway とすべてのノードホストはプライベートネットワーク（Tailscale）上に置いてください。公開露出は避けてください。
- リモート CDP URL/トークンはシークレットとして扱ってください。環境変数またはシークレットマネージャーの使用を推奨します。

リモート CDP のヒント:

- 可能な場合は、暗号化されたエンドポイント（HTTPS または WSS）と短命トークンを優先してください。
- 長寿命トークンを設定ファイルに直接埋め込むのは避けてください。

## プロファイル（マルチブラウザ）

OpenClaw は複数の名前付きプロファイル（ルーティング設定）をサポートします。プロファイルには次の種類があります:

- **openclaw 管理**: 専用の Chromium ベースブラウザインスタンス。独自のユーザーデータディレクトリ + CDP ポートを持ちます
- **リモート**: 明示的な CDP URL（別の場所で動作している Chromium ベースブラウザ）
- **既存セッション**: Chrome DevTools MCP 自動接続経由の既存 Chrome プロファイル

デフォルト:

- `openclaw` プロファイルは、存在しない場合に自動作成されます。
- `user` プロファイルは、Chrome MCP の既存セッション接続用に組み込まれています。
- `user` 以外の既存セッションプロファイルはオプトインです。`--driver existing-session` で作成してください。
- ローカル CDP ポートは、デフォルトで **18800–18899** から割り当てられます。
- プロファイルを削除すると、そのローカルデータディレクトリはゴミ箱に移動されます。

すべての制御エンドポイントは `?profile=<name>` を受け付けます。CLI では `--browser-profile` を使用します。

## Chrome DevTools MCP 経由の既存セッション

OpenClaw は、公式の Chrome DevTools MCP サーバーを通じて、実行中の Chromium ベースブラウザプロファイルにも接続できます。
これにより、そのブラウザプロファイルですでに開かれているタブとログイン状態を再利用できます。

公式の背景説明とセットアップ参考資料:

- [Chrome for Developers: ブラウザセッションで Chrome DevTools MCP を使う](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

組み込みプロファイル:

- `user`

オプション: 別の名前、色、またはブラウザデータディレクトリを使いたい場合は、
独自のカスタム既存セッションプロファイルを作成できます。

デフォルト動作:

- 組み込みの `user` プロファイルは Chrome MCP 自動接続を使用し、
  デフォルトのローカル Google Chrome プロファイルを対象にします。

Brave、Edge、Chromium、またはデフォルト以外の Chrome プロファイルには `userDataDir` を使ってください:

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

次に、対応するブラウザで以下を行います:

1. そのブラウザのリモートデバッグ用 inspect ページを開きます。
2. リモートデバッグを有効にします。
3. ブラウザを起動したままにし、OpenClaw が接続するときに接続プロンプトを承認します。

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

- `status` に `driver: existing-session` と表示される
- `status` に `transport: chrome-mcp` と表示される
- `status` に `running: true` と表示される
- `tabs` に、すでに開いているブラウザタブが一覧表示される
- `snapshot` が、選択されたライブタブから refs を返す

接続が機能しない場合の確認事項:

- 対象の Chromium ベースブラウザがバージョン `144+` であること
- そのブラウザの inspect ページでリモートデバッグが有効になっていること
- ブラウザが接続同意プロンプトを表示し、あなたがそれを承認したこと
- `openclaw doctor` は古い拡張機能ベースのブラウザ設定を移行し、
  デフォルトの自動接続プロファイル用に Chrome がローカルにインストールされていることを確認しますが、
  ブラウザ側のリモートデバッグをあなたの代わりに有効化することはできません

エージェントでの利用:

- ユーザーのログイン済みブラウザ状態が必要な場合は `profile="user"` を使ってください。
- カスタム既存セッションプロファイルを使う場合は、その明示的なプロファイル名を渡してください。
- このモードを選ぶのは、ユーザーが接続プロンプトを承認できるようコンピューターの前にいる場合だけにしてください。
- Gateway またはノードホストは `npx chrome-devtools-mcp@latest --autoConnect` を起動できます

注意点:

- この経路は、サインイン済みブラウザセッション内で操作できるため、分離された `openclaw` プロファイルより高リスクです。
- OpenClaw はこの driver でブラウザを起動しません。既存セッションにのみ接続します。
- OpenClaw はここで公式の Chrome DevTools MCP `--autoConnect` フローを使用します。
  `userDataDir` が設定されている場合、OpenClaw はそれを渡して、その明示的な
  Chromium ユーザーデータディレクトリを対象にします。
- 既存セッションのスクリーンショットは、ページキャプチャとスナップショットからの `--ref` 要素キャプチャをサポートしますが、
  CSS `--element` セレクターはサポートしません。
- 既存セッションのページスクリーンショットは、Playwright なしで Chrome MCP を通じて動作します。
  ref ベースの要素スクリーンショット（`--ref`）もそこで動作しますが、`--full-page` は `--ref` や `--element` と組み合わせられません。
- 既存セッションのアクションは、管理ブラウザ経路より依然として制限があります:
  - `click`、`type`、`hover`、`scrollIntoView`、`drag`、`select` では、
    CSS セレクターではなくスナップショット refs が必要です
  - `click` は左ボタンのみです（ボタン上書きや修飾キーは不可）
  - `type` は `slowly=true` をサポートしません。`fill` または `press` を使ってください
  - `press` は `delayMs` をサポートしません
  - `hover`、`scrollIntoView`、`drag`、`select`、`fill`、`evaluate` は
    呼び出しごとのタイムアウト上書きをサポートしません
  - `select` は現在単一値のみサポートします
- 既存セッションの `wait --url` は、他のブラウザ driver と同様に完全一致、部分一致、glob パターンをサポートします。
  `wait --load networkidle` はまだサポートされていません。
- 既存セッションのアップロードフックは `ref` または `inputRef` を必要とし、一度に 1 ファイルのみをサポートし、
  CSS `element` ターゲティングはサポートしません。
- 既存セッションのダイアログフックはタイムアウト上書きをサポートしません。
- 一部の機能は引き続き管理ブラウザ経路が必要で、バッチアクション、PDF エクスポート、ダウンロードのインターセプト、`responsebody` などが該当します。
- 既存セッションはホストローカルです。Chrome が別のマシンまたは別のネットワーク名前空間にある場合は、
  代わりにリモート CDP またはノードホストを使用してください。

## 分離の保証

- **専用のユーザーデータディレクトリ**: あなたの個人用ブラウザプロファイルには決して触れません。
- **専用ポート**: 開発ワークフローとの衝突を防ぐため `9222` を避けます。
- **決定論的なタブ制御**: 「最後のタブ」ではなく `targetId` でタブを対象にします。

## ブラウザの選択

ローカル起動時、OpenClaw は利用可能な最初のものを選びます:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath` で上書きできます。

プラットフォーム:

- macOS: `/Applications` と `~/Applications` を確認します。
- Linux: `google-chrome`、`brave`、`microsoft-edge`、`chromium` などを探します。
- Windows: 一般的なインストール場所を確認します。

## 制御 API（オプション）

ローカル統合専用として、Gateway は小さな loopback HTTP API を公開します:

- ステータス/開始/停止: `GET /`、`POST /start`、`POST /stop`
- タブ: `GET /tabs`、`POST /tabs/open`、`POST /tabs/focus`、`DELETE /tabs/:targetId`
- スナップショット/スクリーンショット: `GET /snapshot`、`POST /screenshot`
- アクション: `POST /navigate`、`POST /act`
- フック: `POST /hooks/file-chooser`、`POST /hooks/dialog`
- ダウンロード: `POST /download`、`POST /wait/download`
- デバッグ: `GET /console`、`POST /pdf`
- デバッグ: `GET /errors`、`GET /requests`、`POST /trace/start`、`POST /trace/stop`、`POST /highlight`
- ネットワーク: `POST /response/body`
- 状態: `GET /cookies`、`POST /cookies/set`、`POST /cookies/clear`
- 状態: `GET /storage/:kind`、`POST /storage/:kind/set`、`POST /storage/:kind/clear`
- 設定: `POST /set/offline`、`POST /set/headers`、`POST /set/credentials`、`POST /set/geolocation`、`POST /set/media`、`POST /set/timezone`、`POST /set/locale`、`POST /set/device`

すべてのエンドポイントは `?profile=<name>` を受け付けます。

shared-secret Gateway 認証が設定されている場合、ブラウザ HTTP ルートでも認証が必要です:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` またはそのパスワードを使う HTTP Basic 認証

注意点:

- このスタンドアロン loopback ブラウザ API は `trusted-proxy` や
  Tailscale Serve の identity ヘッダーを利用**しません**。
- `gateway.auth.mode` が `none` または `trusted-proxy` の場合、これらの loopback ブラウザ
  ルートはそうした identity 付きモードを継承しません。loopback のみに保ってください。

### `/act` エラー契約

`POST /act` は、ルートレベルのバリデーションと
ポリシー失敗に対して構造化されたエラーレスポンスを使用します:

```json
{ "error": "<message>", "code": "ACT_*" }
```

現在の `code` 値:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` が欠落しているか、認識されません。
- `ACT_INVALID_REQUEST` (HTTP 400): アクションペイロードの正規化またはバリデーションに失敗しました。
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): サポートされていないアクション種別で `selector` が使用されました。
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate`（または `wait --fn`）が設定で無効になっています。
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): トップレベルまたはバッチ化された `targetId` がリクエスト対象と競合しています。
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): このアクションは既存セッションプロファイルではサポートされていません。

その他のランタイム失敗では、`code` フィールドなしの
`{ "error": "<message>" }` が返ることもあります。

### Playwright 要件

一部の機能（navigate/act/AI snapshot/role snapshot、要素スクリーンショット、
PDF）には Playwright が必要です。Playwright がインストールされていない場合、
これらのエンドポイントは明確な 501 エラーを返します。

Playwright なしでも動作するもの:

- ARIA スナップショット
- タブごとの CDP WebSocket が利用可能な場合の、管理 `openclaw` ブラウザのページスクリーンショット
- `existing-session` / Chrome MCP プロファイルのページスクリーンショット
- スナップショット出力からの `existing-session` の ref ベーススクリーンショット（`--ref`）

引き続き Playwright が必要なもの:

- `navigate`
- `act`
- AI スナップショット / role スナップショット
- CSS セレクター要素スクリーンショット（`--element`）
- ブラウザ全体の PDF エクスポート

要素スクリーンショットでは `--full-page` も拒否されます。このルートは `fullPage is
not supported for element screenshots` を返します。

`Playwright is not available in this gateway build` と表示された場合は、完全な
Playwright パッケージ（`playwright-core` ではなく）をインストールして Gateway を再起動するか、
ブラウザサポート付きで OpenClaw を再インストールしてください。

#### Docker での Playwright インストール

Gateway が Docker 上で動作している場合は、`npx playwright` を避けてください（npm override の競合があります）。
代わりに、同梱の CLI を使ってください:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

ブラウザダウンロードを永続化するには、`PLAYWRIGHT_BROWSERS_PATH`（たとえば
`/home/node/.cache/ms-playwright`）を設定し、`/home/node` が
`OPENCLAW_HOME_VOLUME` または bind mount で永続化されていることを確認してください。[Docker](/ja-JP/install/docker) を参照してください。

## 仕組み（内部）

高レベルのフロー:

- 小さな**制御サーバー**が HTTP リクエストを受け付けます。
- **CDP** を介して Chromium ベースのブラウザ（Chrome/Brave/Edge/Chromium）に接続します。
- 高度な操作（クリック/入力/スナップショット/PDF）には、CDP の上で **Playwright** を使用します。
- Playwright がない場合は、Playwright 非依存の操作のみ利用できます。

この設計により、ローカル/リモートのブラウザやプロファイルを切り替えられる一方で、
エージェントは安定した決定論的インターフェース上で動作できます。

## CLI クイックリファレンス

すべてのコマンドは、特定のプロファイルを対象にするために `--browser-profile <name>` を受け付けます。
すべてのコマンドは、機械可読な出力（安定したペイロード）のために `--json` も受け付けます。

基本:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

調査:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

ライフサイクルに関する注意:

- attach-only および remote CDP プロファイルでは、テスト後の適切なクリーンアップコマンドは
  依然として `openclaw browser stop` です。これは、基盤となるブラウザを終了する代わりに、
  アクティブな制御セッションを閉じ、一時的なエミュレーション上書きを解除します。
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

アクション:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

状態:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

注意点:

- `upload` と `dialog` は**事前待機**呼び出しです。ファイル選択ダイアログやダイアログを
  発生させる click/press の前に実行してください。
- ダウンロードとトレースの出力パスは OpenClaw の一時ルートに制限されます:
  - traces: `/tmp/openclaw`（フォールバック: `${os.tmpdir()}/openclaw`）
  - downloads: `/tmp/openclaw/downloads`（フォールバック: `${os.tmpdir()}/openclaw/downloads`）
- アップロードパスは OpenClaw の一時アップロードルートに制限されます:
  - uploads: `/tmp/openclaw/uploads`（フォールバック: `${os.tmpdir()}/openclaw/uploads`）
- `upload` は、`--input-ref` または `--element` によってファイル input を直接設定することもできます。
- `snapshot`:
  - `--format ai`（Playwright がインストールされている場合のデフォルト）: 数値 refs を含む AI スナップショットを返します（`aria-ref="<n>"`）。
  - `--format aria`: アクセシビリティツリーを返します（refs なし。調査専用）。
  - `--efficient`（または `--mode efficient`）: コンパクトな role スナップショットのプリセットです（interactive + compact + depth + lower maxChars）。
  - 設定のデフォルト（ツール/CLI のみ）: 呼び出し側が mode を渡さないときに efficient スナップショットを使うには、`browser.snapshotDefaults.mode: "efficient"` を設定してください（[Gateway configuration](/ja-JP/gateway/configuration-reference#browser) を参照）。
  - role スナップショットオプション（`--interactive`、`--compact`、`--depth`、`--selector`）は、`ref=e12` のような refs を持つ role ベーススナップショットを強制します。
  - `--frame "<iframe selector>"` は role スナップショットを iframe に限定します（`e12` のような role refs と組み合わせます）。
  - `--interactive` は、対話可能要素のフラットで選びやすい一覧を出力します（アクション操作に最適）。
  - `--labels` は、ref ラベルが重ねられたビューポート限定のスクリーンショットを追加します（`MEDIA:<path>` を出力します）。
- `click`/`type`/その他は、`snapshot` からの `ref`（数値の `12` または role ref の `e12`）を必要とします。
  アクションで CSS セレクターは意図的にサポートしていません。

## スナップショットと refs

OpenClaw は 2 種類の「スナップショット」スタイルをサポートします:

- **AI スナップショット（数値 refs）**: `openclaw browser snapshot`（デフォルト。`--format ai`）
  - 出力: 数値 refs を含むテキストスナップショット。
  - アクション: `openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 内部的には、ref は Playwright の `aria-ref` で解決されます。

- **Role スナップショット（`e12` のような role refs）**: `openclaw browser snapshot --interactive`（または `--compact`、`--depth`、`--selector`、`--frame`）
  - 出力: `[ref=e12]`（およびオプションの `[nth=1]`）を含む role ベースの一覧/ツリー。
  - アクション: `openclaw browser click e12`、`openclaw browser highlight e12`。
  - 内部的には、ref は `getByRole(...)`（重複時は `nth()` を追加）で解決されます。
  - `--labels` を追加すると、`e12` ラベルを重ねたビューポートスクリーンショットを含められます。

ref の挙動:

- refs は**ナビゲーションをまたいで安定しません**。何か失敗した場合は、`snapshot` を再実行して新しい ref を使用してください。
- role スナップショットを `--frame` 付きで取得した場合、role refs は次の role スナップショットまでその iframe に限定されます。

## Wait の強化機能

時間やテキストだけでなく、さらに多くの条件で待機できます:

- URL を待機（Playwright の glob をサポート）:
  - `openclaw browser wait --url "**/dash"`
- 読み込み状態を待機:
  - `openclaw browser wait --load networkidle`
- JS 述語を待機:
  - `openclaw browser wait --fn "window.ready===true"`
- セレクターが可視になるのを待機:
  - `openclaw browser wait "#main"`

これらは組み合わせられます:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## デバッグワークフロー

アクションが失敗したとき（たとえば「not visible」「strict mode violation」「covered」）:

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` を使う（interactive モードでは role refs を優先）
3. それでも失敗する場合: `openclaw browser highlight <ref>` を使って Playwright が何を対象にしているか確認する
4. ページの挙動がおかしい場合:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 深いデバッグには、トレースを記録する:
   - `openclaw browser trace start`
   - 問題を再現する
   - `openclaw browser trace stop`（`TRACE:<path>` を出力）

## JSON 出力

`--json` は、スクリプトや構造化ツール向けです。

例:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON 内の role スナップショットには `refs` と小さな `stats` ブロック（lines/chars/refs/interactive）が含まれるため、
ツールはペイロードサイズと密度を判断できます。

## 状態および環境ノブ

これらは「サイトを X のように振る舞わせる」ワークフローで役立ちます:

- Cookie: `cookies`、`cookies set`、`cookies clear`
- Storage: `storage local|session get|set|clear`
- オフライン: `set offline on|off`
- ヘッダー: `set headers --headers-json '{"X-Debug":"1"}'`（従来の `set headers --json '{"X-Debug":"1"}'` も引き続きサポート）
- HTTP Basic 認証: `set credentials user pass`（または `--clear`）
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"`（または `--clear`）
- Media: `set media dark|light|no-preference|none`
- タイムゾーン / ロケール: `set timezone ...`、`set locale ...`
- デバイス / ビューポート:
  - `set device "iPhone 14"`（Playwright のデバイスプリセット）
  - `set viewport 1280 720`

## セキュリティとプライバシー

- openclaw ブラウザプロファイルにはログイン済みセッションが含まれる可能性があります。機密として扱ってください。
- `browser act kind=evaluate` / `openclaw browser evaluate` と `wait --fn` は
  ページコンテキストで任意の JavaScript を実行します。プロンプトインジェクションによって
  これが誘導される可能性があります。不要な場合は `browser.evaluateEnabled=false` で無効にしてください。
- ログインおよびアンチボットに関する注意（X/Twitter など）については、[Browser login + X/Twitter posting](/ja-JP/tools/browser-login) を参照してください。
- Gateway/ノードホストはプライベート（loopback または tailnet-only）に保ってください。
- リモート CDP エンドポイントは強力です。トンネル化し、保護してください。

strict モードの例（デフォルトで private/internal 宛先をブロック）:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // オプションの完全一致許可
    },
  },
}
```

## トラブルシューティング

Linux 固有の問題（特に snap Chromium）については、
[Browser troubleshooting](/ja-JP/tools/browser-linux-troubleshooting) を参照してください。

WSL2 Gateway + Windows Chrome の分離ホスト構成については、
[WSL2 + Windows + remote Chrome CDP troubleshooting](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting) を参照してください。

## エージェントツール + 制御の仕組み

エージェントは、ブラウザ自動化用に**1 つのツール**を取得します:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

対応関係:

- `browser snapshot` は安定した UI ツリー（AI または ARIA）を返します。
- `browser act` はスナップショットの `ref` ID を使って click/type/drag/select を行います。
- `browser screenshot` はピクセルをキャプチャします（ページ全体または要素）。
- `browser` は以下を受け付けます:
  - `profile` は名前付きブラウザプロファイル（openclaw、chrome、または remote CDP）を選択します。
  - `target`（`sandbox` | `host` | `node`）はブラウザの存在場所を選択します。
  - サンドボックス化セッションでは、`target: "host"` には `agents.defaults.sandbox.browser.allowHostControl=true` が必要です。
  - `target` が省略された場合: サンドボックス化セッションはデフォルトで `sandbox`、非サンドボックスセッションはデフォルトで `host` になります。
  - ブラウザ対応ノードが接続されている場合、`target="host"` または `target="node"` に固定しない限り、ツールは自動的にそこへルーティングされることがあります。

これにより、エージェントの動作が決定論的に保たれ、壊れやすいセレクターを避けられます。

## 関連

- [Tools Overview](/ja-JP/tools) — 利用可能なすべてのエージェントツール
- [Sandboxing](/ja-JP/gateway/sandboxing) — サンドボックス環境でのブラウザ制御
- [Security](/ja-JP/gateway/security) — ブラウザ制御のリスクとハードニング
