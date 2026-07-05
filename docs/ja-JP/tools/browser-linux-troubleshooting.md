---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Linux における OpenClaw ブラウザー制御の Chrome/Brave/Edge/Chromium CDP 起動問題を修正
title: ブラウザーのトラブルシューティング
x-i18n:
    generated_at: "2026-07-05T11:48:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0256e8ee441802086cd486923060be54f8966b423e5dcb71fc8961bbab5d729
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## 問題: ポート 18800 で Chrome CDP の起動に失敗する

```json
{ "error": "Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"." }
```

### 根本原因

Ubuntu とほとんどの Linux ディストリビューションでは、`apt install chromium` は実際のブラウザではなく snap
ラッパーをインストールします。

```text
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Snap の AppArmor confinement は、OpenClaw がブラウザプロセスを起動して監視する方法と干渉します。

その他の一般的な Linux 起動失敗:

- `The profile appears to be in use by another Chromium process`: 管理対象プロファイルディレクトリ内の古い
  `Singleton*` ロックファイル。OpenClaw は、ロックが停止済みまたは
  別ホストのプロセスを指している場合、これらのロックを削除して一度だけ再試行します。
- `Missing X server or $DISPLAY`: デスクトップセッションのないホストで、表示可能なブラウザが明示的に要求されています。ローカル管理対象プロファイルは、
  `DISPLAY` と `WAYLAND_DISPLAY` の両方が未設定の場合、Linux ではヘッドレスモードにフォールバックします。
  `OPENCLAW_BROWSER_HEADLESS=0`、`browser.headless: false`、または
  `browser.profiles.<name>.headless: false` を設定している場合は、その headed override を削除するか、
  `OPENCLAW_BROWSER_HEADLESS=1` を設定するか、`Xvfb` を起動するか、
  1 回限りの管理対象起動として `openclaw browser start --headless` を実行するか、実際のデスクトップセッションで
  OpenClaw を実行してください。

### 解決策 1: Google Chrome をインストールする（推奨）

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
```

`~/.openclaw/openclaw.json` を更新します。

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

### 解決策 2: snap Chromium を attach-only モードで使用する

snap Chromium を維持する必要がある場合は、OpenClaw がブラウザを起動する代わりに、
手動で起動したブラウザへアタッチするように設定します。

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

Chromium を手動で起動します。

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

必要に応じて、systemd ユーザーサービスで自動起動します。

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

| オプション                       | 説明                                                               | デフォルト                                                         |
| -------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `browser.enabled`                | ブラウザ制御を有効化                                               | `true`                                                             |
| `browser.executablePath`         | Chromium ベースのブラウザバイナリ（Chrome/Brave/Edge/Chromium）へのパス | 自動検出（Chromium ベースの場合は OS のデフォルトブラウザを優先） |
| `browser.headless`               | GUI なしで実行                                                     | `false`                                                            |
| `OPENCLAW_BROWSER_HEADLESS`      | ローカル管理対象ブラウザのヘッドレスモードに対するプロセス単位の上書き | 未設定                                                             |
| `browser.noSandbox`              | `--no-sandbox` フラグを追加（一部の Linux セットアップで必要）     | `false`                                                            |
| `browser.attachOnly`             | ブラウザを起動せず、既存のブラウザにのみアタッチ                   | `false`                                                            |
| `browser.cdpPortRangeStart`      | 自動割り当てプロファイル用の開始ローカル CDP ポート                | `18800`（gateway ポートから派生）                                  |
| `browser.localLaunchTimeoutMs`   | ローカル管理対象 Chrome の検出タイムアウト、最大 `120000`          | `15000`                                                            |
| `browser.localCdpReadyTimeoutMs` | ローカル管理対象の起動後 CDP 準備完了タイムアウト、最大 `120000`   | `8000`                                                             |

どちらのタイムアウト値も `120000` ms 以下の正の整数である必要があります。それ以外の値は
設定読み込み時に拒否されます。Raspberry Pi、古い VPS ホスト、または低速な
ストレージでは、Chrome が CDP HTTP エンドポイントを公開するまでにさらに時間が必要な場合、
`browser.localLaunchTimeoutMs` を増やしてください。起動は成功するものの
`openclaw browser start` が引き続き `not reachable
after start` を報告する場合は、`browser.localCdpReadyTimeoutMs` を増やしてください。

### 問題: profile="user" の Chrome タブが見つからない

`user`（`existing-session` / Chrome MCP）プロファイルを使用していますが、
アタッチ先のタブが開かれていません。

修正オプション:

1. 代わりに管理対象ブラウザを使用します:
   `openclaw browser --browser-profile openclaw start`（または
   `browser.defaultProfile: "openclaw"` を設定します）。
2. 少なくとも 1 つのタブを開いた状態でローカル Chrome を実行し続け、その後
   `--browser-profile user` で再試行します。

注記:

- `user` はホスト専用です。Linux サーバー、コンテナ、またはリモートホストでは、代わりに
  CDP プロファイルを推奨します。
- `user` とその他の `existing-session` プロファイルは、現在の Chrome MCP
  の制限を共有します: ref 駆動のアクションのみ、アップロードは 1 ファイルずつ、ダイアログの `timeoutMs`
  上書きなし、`wait --load networkidle` なし、そして `responsebody`、PDF エクスポート、
  ダウンロードインターセプト、バッチアクションなし。
- ローカルの `openclaw` ドライバープロファイルは `cdpPort`/`cdpUrl` を自動割り当てします。これらは
  リモート CDP の場合にのみ手動設定してください。
- リモート CDP プロファイルは `http://`、`https://`、`ws://`、`wss://` を受け入れます。
  `/json/version` 検出には HTTP(S) を使用し、ブラウザサービスが直接の DevTools ソケット URL を提供する場合は
  WS(S) を使用してください。

## 関連

- [ブラウザ](/ja-JP/tools/browser)
- [ブラウザログイン](/ja-JP/tools/browser-login)
- [ブラウザ WSL2 トラブルシューティング](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
