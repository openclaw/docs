---
read_when:
- Running OpenClaw Gateway in WSL2 while Chrome lives on Windows
- Seeing overlapping browser/control-ui errors across WSL2 and Windows
- 分離ホスト構成で host-local Chrome MCP と生のリモート CDP のどちらを使うかを判断する
summary: WSL2 Gateway + Windows Chrome のリモート CDP をレイヤーごとにトラブルシュートする
title: WSL2 + Windows + リモート Chrome CDP のトラブルシューティング
x-i18n:
  generated_at: '2026-04-24T05:24:01Z'
  refreshed_at: '2026-04-28T04:45:00Z'
  model: gpt-5.4
  provider: openai
  source_hash: 30c8b94332e74704f85cbce5891b677b264fd155bc180c44044ab600e84018fd
  source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
  workflow: 15
---

このガイドでは、次のような一般的な分離ホスト構成を扱います。

- OpenClaw Gateway は WSL2 内で動作する
- Chrome は Windows 上で動作する
- browser 制御は WSL2/Windows 境界をまたぐ必要がある

また、[issue #39369](https://github.com/openclaw/openclaw/issues/39369) にあったレイヤー化された障害パターンも扱います。独立した複数の問題が同時に現れることがあり、その結果、本当に壊れているレイヤーとは別のレイヤーが最初に壊れているように見えることがあります。

## まず正しい browser モードを選ぶ

有効なパターンは 2 つあります。

### Option 1: WSL2 から Windows への生のリモート CDP

WSL2 から Windows Chrome の CDP endpoint を指すリモート browser profile を使います。

これを選ぶのは次の場合:

- Gateway は WSL2 内に置く
- Chrome は Windows 上で動作する
- browser 制御が WSL2/Windows 境界をまたぐ必要がある

### Option 2: host-local Chrome MCP

`existing-session` / `user` を使うのは、Gateway 自体が Chrome と同じホスト上で動作している場合だけです。

これを選ぶのは次の場合:

- OpenClaw と Chrome が同じマシン上にある
- ローカルでサインイン済みの browser 状態を使いたい
- クロスホスト browser transport は不要
- `responsebody`、PDF
  export、download interception、batch actions のような高度な managed/raw-CDP 専用ルートは不要

WSL2 Gateway + Windows Chrome では、生のリモート CDP を推奨します。Chrome MCP は host-local であり、WSL2 から Windows への bridge ではありません。

## 動作するアーキテクチャ

参照構成:

- WSL2 が `127.0.0.1:18789` で Gateway を実行する
- Windows が通常の browser で `http://127.0.0.1:18789/` の Control UI を開く
- Windows Chrome がポート `9222` で CDP endpoint を公開する
- WSL2 からその Windows CDP endpoint に到達できる
- OpenClaw が、WSL2 から到達可能なアドレスを browser profile に設定する

## なぜこのセットアップが混乱しやすいのか

複数の障害が重なることがあります。

- WSL2 から Windows CDP endpoint に到達できない
- Control UI が secure でない origin から開かれている
- `gateway.controlUi.allowedOrigins` がページ origin と一致しない
- token または pairing が欠けている
- browser profile が誤ったアドレスを指している

そのため、1 つのレイヤーを修正しても、別のエラーが残って見えることがあります。

## Control UI の重要ルール

UI を Windows から開く場合、意図的な HTTPS 構成がない限り Windows localhost を使ってください。

使用するのは:

`http://127.0.0.1:18789/`

Control UI でデフォルトを LAN IP にしないでください。LAN または tailnet アドレス上の plain HTTP は、
CDP 自体とは無関係な insecure-origin/device-auth 挙動を引き起こすことがあります。 [Control UI](/ja-JP/web/control-ui) を参照してください。

## レイヤーごとに検証する

上から下へ順に作業してください。飛ばしてはいけません。

### Layer 1: Chrome が Windows 上で CDP を提供しているか確認する

remote debugging を有効にして Windows 上で Chrome を起動します:

```powershell
chrome.exe --remote-debugging-port=9222
```

Windows から、まず Chrome 自体を確認します:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

これが Windows 上で失敗するなら、まだ OpenClaw の問題ではありません。

### Layer 2: WSL2 からその Windows endpoint に到達できるか確認する

WSL2 から、`cdpUrl` に使う予定の正確なアドレスをテストします:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

良い結果:

- `/json/version` が Browser / Protocol-Version メタデータ付き JSON を返す
- `/json/list` が JSON を返す（ページが開いていなければ空配列でもよい）

これが失敗する場合:

- Windows がまだそのポートを WSL2 に公開していない
- そのアドレスが WSL2 側から見て間違っている
- firewall / port forwarding / local proxying がまだ不足している

OpenClaw config に触る前に、これを修正してください。

### Layer 3: 正しい browser profile を設定する

生のリモート CDP では、OpenClaw を WSL2 から到達可能なアドレスに向けます:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

注:

- Windows 上でしか動かないアドレスではなく、WSL2 から到達可能なアドレスを使う
- 外部管理 browser では `attachOnly: true` を維持する
- `cdpUrl` には `http://`, `https://`, `ws://`, `wss://` を使える
- OpenClaw に `/json/version` を検出させたい場合は HTTP(S) を使う
- browser provider が直接の DevTools socket URL を提供する場合にのみ WS(S) を使う
- OpenClaw に成功を期待する前に、同じ URL を `curl` でテストする

### Layer 4: Control UI レイヤーを別に検証する

Windows から UI を開きます:

`http://127.0.0.1:18789/`

そのうえで確認します:

- ページ origin が `gateway.controlUi.allowedOrigins` の期待と一致しているか
- token 認証または pairing が正しく設定されているか
- Control UI 認証問題を browser 問題として誤ってデバッグしていないか

参考ページ:

- [Control UI](/ja-JP/web/control-ui)

### Layer 5: end-to-end browser 制御を検証する

WSL2 から:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

良い結果:

- tab が Windows Chrome で開く
- `openclaw browser tabs` がその target を返す
- 以後のアクション（`snapshot`, `screenshot`, `navigate`）も同じ profile から動作する

## よくある誤解を招くエラー

各メッセージはレイヤー固有の手掛かりとして扱ってください。

- `control-ui-insecure-auth`
  - UI origin / secure-context の問題であり、CDP transport の問題ではない
- `token_missing`
  - 認証設定の問題
- `pairing required`
  - デバイス承認の問題
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 から設定された `cdpUrl` に到達できない
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - HTTP endpoint は応答したが、DevTools WebSocket はまだ開けなかった
- リモートセッション後に viewport / dark-mode / locale / offline 上書きが古いまま残る
  - `openclaw browser stop --browser-profile remote` を実行する
  - これにより Gateway や外部 browser を再起動せずに、アクティブな制御セッションを閉じて Playwright/CDP emulation 状態を解放する
- `gateway timeout after 1500ms`
  - 多くの場合、依然として CDP 到達性の問題、または遅い/到達不能なリモート endpoint
- `No Chrome tabs found for profile="user"`
  - host-local tab がないのに local Chrome MCP profile を選んでいる

## 高速トリアージチェックリスト

1. Windows: `curl http://127.0.0.1:9222/json/version` は動作するか？
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` は動作するか？
3. OpenClaw config: `browser.profiles.<name>.cdpUrl` は、その正確な WSL2 到達可能アドレスを使っているか？
4. Control UI: LAN IP ではなく `http://127.0.0.1:18789/` を開いているか？
5. 生のリモート CDP の代わりに、WSL2 と Windows をまたいで `existing-session` を使おうとしていないか？

## 実践的な要点

このセットアップは通常、成立します。難しいのは、browser transport、Control UI origin security、token/pairing がそれぞれ独立して失敗し得るのに、ユーザー側からは似て見えることです。

迷ったときは:

- まず Windows Chrome endpoint をローカルで確認する
- 次に WSL2 から同じ endpoint を確認する
- その後で初めて OpenClaw config や Control UI auth をデバッグする

## 関連

- [Browser](/ja-JP/tools/browser)
- [Browser login](/ja-JP/tools/browser-login)
- [Browser Linux troubleshooting](/ja-JP/tools/browser-linux-troubleshooting)
