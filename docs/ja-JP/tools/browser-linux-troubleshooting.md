---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Linux 上の OpenClaw ブラウザー制御における Chrome/Brave/Edge/Chromium CDP 起動時の問題を修正
title: ブラウザーのトラブルシューティング
x-i18n:
    generated_at: "2026-04-30T05:36:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9a91ea42a8a600163bcf66ad398677175bd0c5186d3e1dddb629a55c2ea66ed
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## 問題: 「Failed to start Chrome CDP on port 18800」

OpenClaw のブラウザ制御サーバーが Chrome/Brave/Edge/Chromium の起動に失敗し、次のエラーが出ます。

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### 根本原因

Ubuntu (および多くの Linux ディストリビューション) では、デフォルトの Chromium インストールは **snap パッケージ**です。Snap の AppArmor confinement が、OpenClaw によるブラウザプロセスの生成と監視に干渉します。

`apt install chromium` コマンドは、snap にリダイレクトするスタブパッケージをインストールします。

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

これは実際のブラウザではありません。ただのラッパーです。

その他の一般的な Linux 起動失敗:

- `The profile appears to be in use by another Chromium process` は、Chrome が
  管理対象プロファイルディレクトリ内で古い `Singleton*` ロックファイルを見つけたことを意味します。OpenClaw は、
  そのロックが停止済みまたは別ホストのプロセスを指している場合、それらのロックを削除して一度だけ再試行します。
- `Missing X server or $DISPLAY` は、デスクトップセッションのないホストで表示ありのブラウザが明示的に
  要求されたことを意味します。デフォルトでは、ローカル管理対象
  プロファイルは Linux で `DISPLAY` と
  `WAYLAND_DISPLAY` の両方が未設定の場合、ヘッドレスモードにフォールバックします。`OPENCLAW_BROWSER_HEADLESS=0`、
  `browser.headless: false`、または `browser.profiles.<name>.headless: false` を設定している場合は、
  その headed override を削除するか、`OPENCLAW_BROWSER_HEADLESS=1` を設定するか、`Xvfb` を起動するか、
  一回限りの管理対象起動として `openclaw browser start --headless` を実行するか、実際のデスクトップセッションで
  OpenClaw を実行してください。

### 解決策 1: Google Chrome をインストールする (推奨)

snap でサンドボックス化されていない、公式の Google Chrome `.deb` パッケージをインストールします。

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
```

次に OpenClaw 設定 (`~/.openclaw/openclaw.json`) を更新します。

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

### 解決策 2: Attach-Only モードで Snap Chromium を使う

snap Chromium を使う必要がある場合は、手動で起動したブラウザにアタッチするよう OpenClaw を設定します。

1. 設定を更新します。

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

2. Chromium を手動で起動します。

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. 任意で、Chrome を自動起動する systemd ユーザーサービスを作成します。

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

次で有効化します: `systemctl --user enable --now openclaw-browser.service`

### ブラウザが動作することを確認する

ステータスを確認します。

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

ブラウジングをテストします。

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### 設定リファレンス

| オプション                       | 説明                                                                 | デフォルト                                                  |
| -------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`                | ブラウザ制御を有効化                                                 | `true`                                                      |
| `browser.executablePath`         | Chromium ベースのブラウザバイナリ (Chrome/Brave/Edge/Chromium) へのパス | 自動検出 (Chromium ベースの場合はデフォルトブラウザを優先) |
| `browser.headless`               | GUI なしで実行                                                       | `false`                                                     |
| `OPENCLAW_BROWSER_HEADLESS`      | ローカル管理対象ブラウザのヘッドレスモードに対するプロセス単位の override | 未設定                                                      |
| `browser.noSandbox`              | `--no-sandbox` フラグを追加 (一部の Linux 環境で必要)                | `false`                                                     |
| `browser.attachOnly`             | ブラウザを起動せず、既存のものにのみアタッチ                         | `false`                                                     |
| `browser.cdpPort`                | Chrome DevTools Protocol ポート                                      | `18800`                                                     |
| `browser.localLaunchTimeoutMs`   | ローカル管理対象 Chrome の検出タイムアウト                           | `15000`                                                     |
| `browser.localCdpReadyTimeoutMs` | ローカル管理対象の起動後 CDP 準備完了タイムアウト                    | `8000`                                                      |

Raspberry Pi、古い VPS ホスト、または低速なストレージでは、Chrome が CDP HTTP
エンドポイントを公開するまでにさらに時間が必要な場合、`browser.localLaunchTimeoutMs` を増やしてください。
起動は成功するものの `openclaw browser start` がまだ `not reachable after start` を報告する場合は、
`browser.localCdpReadyTimeoutMs` を増やしてください。値は `120000` ms 以下の正の整数である必要があります。
無効な設定値は拒否されます。

### 問題: 「No Chrome tabs found for profile=\"user\"」

`existing-session` / Chrome MCP プロファイルを使っています。OpenClaw はローカル Chrome を認識できますが、
アタッチ可能な開いているタブがありません。

修正オプション:

1. **管理対象ブラウザを使う:** `openclaw browser start --browser-profile openclaw`
   (または `browser.defaultProfile: "openclaw"` を設定します)。
2. **Chrome MCP を使う:** ローカル Chrome が少なくとも 1 つのタブを開いた状態で実行中であることを確認し、その後 `--browser-profile user` で再試行します。

注記:

- `user` はホスト専用です。Linux サーバー、コンテナ、またはリモートホストでは、CDP プロファイルを優先してください。
- `user` / その他の `existing-session` プロファイルでは、現在の Chrome MCP の制限が維持されます:
  ref 駆動アクション、単一ファイルアップロードフック、ダイアログタイムアウト override なし、
  `wait --load networkidle` なし、さらに `responsebody`、PDF エクスポート、ダウンロード
  インターセプト、またはバッチアクションなし。
- ローカル `openclaw` プロファイルは `cdpPort`/`cdpUrl` を自動割り当てします。リモート CDP の場合のみ、それらを設定してください。
- リモート CDP プロファイルは `http://`、`https://`、`ws://`、`wss://` を受け付けます。
  `/json/version` 検出には HTTP(S) を使用し、ブラウザ
  サービスが直接 DevTools ソケット URL を提供する場合は WS(S) を使用してください。

## 関連

- [ブラウザ](/ja-JP/tools/browser)
- [ブラウザログイン](/ja-JP/tools/browser-login)
- [ブラウザ WSL2 トラブルシューティング](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
