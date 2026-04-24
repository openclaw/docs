---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Linux上のOpenClaw browser制御向けに、Chrome/Brave/Edge/ChromiumのCDP起動問題を修正する
title: Browserトラブルシューティング
x-i18n:
    generated_at: "2026-04-24T05:22:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6f59048d6a5b587b8d6c9ac0d32b3215f68a7e39192256b28f22936cab752e1
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## 問題: 「Failed to start Chrome CDP on port 18800」

OpenClawのbrowser制御サーバーが、Chrome/Brave/Edge/Chromiumの起動時に次のエラーで失敗します:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### 原因

Ubuntu（および多くのLinuxディストリビューション）では、デフォルトのChromiumインストールは **snap package** です。snapのAppArmor confinementが、OpenClawによるbrowser processの起動と監視方法に干渉します。

`apt install chromium` コマンドは、snapへリダイレクトするスタブパッケージをインストールします:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

これは本物のbrowserではありません — 単なるラッパーです。

### 解決策1: Google Chromeをインストールする（推奨）

snapでサンドボックス化されていない公式Google Chrome `.deb` パッケージをインストールします:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
```

その後、OpenClaw設定（`~/.openclaw/openclaw.json`）を更新します:

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

### 解決策2: snap ChromiumをAttach-Onlyモードで使う

どうしてもsnap Chromiumを使う必要がある場合は、手動起動したbrowserへOpenClawがアタッチするよう設定します:

1. 設定を更新します:

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

2. Chromiumを手動起動します:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. 必要に応じて、Chromeを自動起動するsystemd user serviceを作成します:

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

### Browserが動作していることを確認する

状態確認:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

ブラウズテスト:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### 設定リファレンス

| オプション | 説明 | デフォルト |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled` | browser制御を有効にする | `true` |
| `browser.executablePath` | Chromium系browserバイナリへのパス（Chrome/Brave/Edge/Chromium） | 自動検出（Chromium系ならデフォルトbrowserを優先） |
| `browser.headless` | GUIなしで実行する | `false` |
| `browser.noSandbox` | `--no-sandbox` フラグを追加する（一部Linux構成で必要） | `false` |
| `browser.attachOnly` | browserを起動せず、既存のものにのみアタッチする | `false` |
| `browser.cdpPort` | Chrome DevTools Protocolポート | `18800` |

### 問題: `No Chrome tabs found for profile="user"`

`existing-session` / Chrome MCP profileを使っています。OpenClawはローカルChromeを確認できていますが、アタッチ可能な開いているタブがありません。

修正方法:

1. **管理browserを使う:** `openclaw browser start --browser-profile openclaw`
   （または `browser.defaultProfile: "openclaw"` を設定）。
2. **Chrome MCPを使う:** 少なくとも1つの開いたタブを持つローカルChromeが実行中であることを確認し、その後 `--browser-profile user` で再試行する。

注記:

- `user` はホスト専用です。Linuxサーバー、コンテナ、またはリモートホストでは、CDP profileを推奨します。
- `user` / その他の `existing-session` profileには、現在のChrome MCP制限が引き続きあります:
  ref駆動アクション、1ファイルずつのupload hook、dialog timeout上書きなし、
  `wait --load networkidle` なし、さらに `responsebody`、PDFエクスポート、download interception、batch actions なし。
- ローカルの `openclaw` profileは `cdpPort` / `cdpUrl` を自動割り当てします。これらを設定するのはremote CDP用だけにしてください。
- remote CDP profileは `http://`、`https://`、`ws://`、`wss://` を受け付けます。
  `/json/version` 検出にはHTTP(S)を使い、browser
  serviceが直接DevTools socket URLを提供する場合はWS(S)を使ってください。

## 関連

- [Browser](/ja-JP/tools/browser)
- [Browser login](/ja-JP/tools/browser-login)
- [Browser WSL2 troubleshooting](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
