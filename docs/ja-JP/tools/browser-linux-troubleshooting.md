---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Linux での OpenClaw ブラウザー制御における Chrome/Brave/Edge/Chromium の CDP 起動問題を修正する
title: ブラウザのトラブルシューティング
x-i18n:
    generated_at: "2026-07-11T22:43:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0256e8ee441802086cd486923060be54f8966b423e5dcb71fc8961bbab5d729
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## 問題: ポート18800でChrome CDPを起動できない

```json
{ "error": "Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"." }
```

### 根本原因

UbuntuおよびほとんどのLinuxディストリビューションでは、`apt install chromium`を実行すると、実際のブラウザではなくsnapラッパーがインストールされます。

```text
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

snapのAppArmorによる制限が、OpenClawによるブラウザプロセスの起動と監視に干渉します。

Linuxでよくあるその他の起動失敗:

- `The profile appears to be in use by another Chromium process`: 管理対象プロファイルディレクトリに古い`Singleton*`ロックファイルがあります。ロックが終了済みまたは別ホストのプロセスを指している場合、OpenClawはこれらのロックを削除し、1回再試行します。
- `Missing X server or $DISPLAY`: デスクトップセッションがないホストで、表示ありのブラウザが明示的に要求されています。Linuxでは、`DISPLAY`と`WAYLAND_DISPLAY`がどちらも未設定の場合、ローカル管理対象プロファイルはヘッドレスモードにフォールバックします。`OPENCLAW_BROWSER_HEADLESS=0`、`browser.headless: false`、または`browser.profiles.<name>.headless: false`を設定している場合は、その表示ありのオーバーライドを削除するか、`OPENCLAW_BROWSER_HEADLESS=1`を設定するか、`Xvfb`を起動するか、1回限りの管理対象起動として`openclaw browser start --headless`を実行するか、実際のデスクトップセッションでOpenClawを実行してください。

### 解決策1: Google Chromeをインストールする（推奨）

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # 依存関係エラーがある場合
```

`~/.openclaw/openclaw.json`を更新します。

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### 解決策2: snap版Chromiumをアタッチ専用モードで使用する

snap版Chromiumを使い続ける必要がある場合は、OpenClawがブラウザを起動するのではなく、手動で起動したブラウザにアタッチするよう設定します。

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

Chromiumを手動で起動します。

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

必要に応じて、systemdユーザーサービスで自動起動します。

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

```bash
systemctl --user enable --now openclaw-browser.service
```

### ブラウザが動作することを確認する

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### 設定リファレンス

| オプション                       | 説明                                                                 | デフォルト                                                         |
| -------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `browser.enabled`                | ブラウザ制御を有効にする                                             | `true`                                                             |
| `browser.executablePath`         | Chromiumベースのブラウザバイナリ（Chrome/Brave/Edge/Chromium）へのパス | 自動検出（OSのデフォルトブラウザがChromiumベースの場合はそれを優先） |
| `browser.headless`               | GUIなしで実行する                                                     | `false`                                                            |
| `OPENCLAW_BROWSER_HEADLESS`      | ローカル管理対象ブラウザのヘッドレスモードに対するプロセス単位のオーバーライド | 未設定                                                             |
| `browser.noSandbox`              | `--no-sandbox`フラグを追加する（一部のLinux環境で必要）               | `false`                                                            |
| `browser.attachOnly`             | ブラウザを起動せず、既存のブラウザへのアタッチのみを行う              | `false`                                                            |
| `browser.cdpPortRangeStart`      | 自動割り当てプロファイルで使用するローカルCDPポートの開始番号          | `18800`（Gatewayポートから導出）                                   |
| `browser.localLaunchTimeoutMs`   | ローカル管理対象Chromeの検出タイムアウト（最大`120000`）              | `15000`                                                            |
| `browser.localCdpReadyTimeoutMs` | ローカル管理対象Chrome起動後のCDP準備完了タイムアウト（最大`120000`）  | `8000`                                                             |

両方のタイムアウト値には、`120000`ミリ秒以下の正の整数を指定する必要があります。それ以外の値は設定読み込み時に拒否されます。Raspberry Pi、古いVPSホスト、または低速なストレージで、ChromeがCDP HTTPエンドポイントを公開するまでに時間がかかる場合は、`browser.localLaunchTimeoutMs`を増やしてください。起動には成功しているものの、`openclaw browser start`で引き続き`not reachable after start`と報告される場合は、`browser.localCdpReadyTimeoutMs`を増やしてください。

### 問題: profile="user"のChromeタブが見つからない

`user`（`existing-session` / Chrome MCP）プロファイルを使用していますが、アタッチ可能なタブが開かれていません。

修正方法:

1. 代わりに管理対象ブラウザを使用します。
   `openclaw browser --browser-profile openclaw start`（または
   `browser.defaultProfile: "openclaw"`を設定）。
2. ローカルのChromeを少なくとも1つのタブを開いた状態で実行し続けてから、
   `--browser-profile user`を指定して再試行します。

注:

- `user`はホスト専用です。Linuxサーバー、コンテナ、またはリモートホストでは、代わりにCDPプロファイルを使用してください。
- `user`およびその他の`existing-session`プロファイルには、現在のChrome MCPの制限が共通して適用されます。参照駆動型アクションのみ、アップロードごとに1ファイル、ダイアログの`timeoutMs`オーバーライド不可、`wait --load networkidle`不可、さらに`responsebody`、PDFエクスポート、ダウンロードのインターセプト、バッチアクションは使用できません。
- ローカルの`openclaw`ドライバープロファイルでは、`cdpPort`/`cdpUrl`が自動的に割り当てられます。これらを手動で設定するのはリモートCDPの場合だけです。
- リモートCDPプロファイルでは、`http://`、`https://`、`ws://`、`wss://`を使用できます。`/json/version`による検出にはHTTP(S)を使用し、ブラウザサービスからDevToolsソケットの直接URLが提供される場合はWS(S)を使用します。

## 関連項目

- [ブラウザ](/ja-JP/tools/browser)
- [ブラウザへのログイン](/ja-JP/tools/browser-login)
- [ブラウザのWSL2トラブルシューティング](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
