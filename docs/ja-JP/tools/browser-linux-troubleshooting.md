---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Linux上のOpenClawブラウザー制御で、Chrome/Brave/Edge/ChromiumのCDP起動問題を修正する
title: ブラウザートラブルシューティング
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:40:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e5b42532af002af3d6a3ab21df7f82d2d62ce9f23b57a94cdb97e8ac65df3b
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## 問題: 「Failed to start Chrome CDP on port 18800」

OpenClawのブラウザー制御サーバーが、次のエラーでChrome/Brave/Edge/Chromiumを起動できません。

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### 根本原因

Ubuntu（および多くのLinuxディストリビューション）では、デフォルトのChromiumインストールは**snapパッケージ**です。snapのAppArmorによる制約が、OpenClawによるブラウザープロセスの起動と監視の方法に干渉します。

`apt install chromium`コマンドは、snapにリダイレクトするスタブパッケージをインストールします。

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

これは実際のブラウザーでは**ありません**。単なるラッパーです。

Linuxでよくあるその他の起動失敗:

- `The profile appears to be in use by another Chromium process` は、Chromeが管理対象プロファイルディレクトリー内に古い`Singleton*`ロックファイルを見つけたことを意味します。OpenClawは、そのロックが終了済みプロセスまたは別ホストのプロセスを指している場合、それらのロックを削除して1回だけ再試行します。
- `Missing X server or $DISPLAY` は、デスクトップセッションのないホストで表示ありブラウザーが明示的に要求されたことを意味します。デフォルトでは、ローカル管理対象プロファイルは、Linuxで`DISPLAY`と`WAYLAND_DISPLAY`の両方が未設定の場合、headlessモードにフォールバックします。`OPENCLAW_BROWSER_HEADLESS=0`、`browser.headless: false`、または`browser.profiles.<name>.headless: false`を設定している場合は、その表示あり上書きを削除するか、`OPENCLAW_BROWSER_HEADLESS=1`を設定するか、`Xvfb`を起動するか、1回限りの管理対象起動として`openclaw browser start --headless`を実行するか、OpenClawを実際のデスクトップセッションで実行してください。

### 解決策1: Google Chromeをインストールする（推奨）

snapでサンドボックス化されていない、公式のGoogle Chrome `.deb`パッケージをインストールします。

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # 依存関係エラーがある場合
```

次に、OpenClawのconfig（`~/.openclaw/openclaw.json`）を更新します。

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

### 解決策2: snap版Chromiumをattach-onlyモードで使う

snap版Chromiumを使う必要がある場合は、手動起動したブラウザーにOpenClawが接続するよう設定します。

1. configを更新します。

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

2. Chromiumを手動で起動します。

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. 必要に応じて、Chromeを自動起動するsystemdユーザーサービスを作成します。

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

有効化するには: `systemctl --user enable --now openclaw-browser.service`

### ブラウザーが動作することを確認する

ステータスを確認します。

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

ブラウジングをテストします。

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### configリファレンス

| オプション | 説明 | デフォルト |
| -------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled` | ブラウザー制御を有効化 | `true` |
| `browser.executablePath` | Chromium系ブラウザーバイナリーへのパス（Chrome/Brave/Edge/Chromium） | 自動検出（Chromium系であればデフォルトブラウザーを優先） |
| `browser.headless` | GUIなしで実行 | `false` |
| `OPENCLAW_BROWSER_HEADLESS` | ローカル管理対象ブラウザーのheadlessモードに対するプロセス単位の上書き | 未設定 |
| `browser.noSandbox` | `--no-sandbox`フラグを追加（一部のLinux構成で必要） | `false` |
| `browser.attachOnly` | ブラウザーを起動せず、既存のものに接続するだけ | `false` |
| `browser.cdpPort` | Chrome DevTools Protocolポート | `18800` |
| `browser.localLaunchTimeoutMs` | ローカル管理対象Chromeの検出タイムアウト | `15000` |
| `browser.localCdpReadyTimeoutMs` | ローカル管理対象の起動後CDP準備完了タイムアウト | `8000` |

Raspberry Pi、古いVPSホスト、または低速ストレージでは、ChromeがCDP HTTPエンドポイントを公開するまでにより長い時間が必要な場合、`browser.localLaunchTimeoutMs`を増やしてください。起動は成功しているのに`openclaw browser start`が依然として`not reachable after start`を報告する場合は、`browser.localCdpReadyTimeoutMs`を増やしてください。値は`120000` ms以下の正の整数である必要があります。無効なconfig値は拒否されます。

### 問題: 「No Chrome tabs found for profile="user"」

`existing-session` / Chrome MCPプロファイルを使用しています。OpenClawはローカルChromeを認識できますが、接続可能な開いているタブがありません。

対処方法:

1. **管理対象ブラウザーを使う:** `openclaw browser start --browser-profile openclaw`（または`browser.defaultProfile: "openclaw"`を設定）。
2. **Chrome MCPを使う:** ローカルChromeが少なくとも1つの開いているタブを持った状態で実行中であることを確認し、その後`--browser-profile user`で再試行します。

注意:

- `user`はホスト専用です。Linuxサーバー、コンテナー、またはリモートホストでは、CDPプロファイルを優先してください。
- `user`やその他の`existing-session`プロファイルは、現在のChrome MCP制限を維持します: ref駆動アクション、単一ファイルアップロードフック、ダイアログタイムアウト上書きなし、`wait --load networkidle`なし、さらに`responsebody`、PDFエクスポート、ダウンロードインターセプト、バッチアクションなし。
- ローカルの`openclaw`プロファイルは`cdpPort`/`cdpUrl`を自動割り当てします。これらを設定するのはリモートCDPの場合だけにしてください。
- リモートCDPプロファイルは`http://`、`https://`、`ws://`、`wss://`を受け付けます。
  `/json/version`検出にはHTTP(S)を、ブラウザーサービスが直接のDevToolsソケットURLを提供する場合はWS(S)を使ってください。

## 関連

- [Browser](/ja-JP/tools/browser)
- [Browser login](/ja-JP/tools/browser-login)
- [Browser WSL2 troubleshooting](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
