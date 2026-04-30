---
read_when:
    - Chrome が Windows 側にある状態で WSL2 内の OpenClaw Gateway を実行する
    - WSL2 と Windows の両方でブラウザー/control-ui の重複エラーが見られる
    - 分割ホスト構成でホストローカルの Chrome MCP と生のリモート CDP のどちらを使うかを決める
summary: WSL2 Gateway + Windows Chrome リモート CDP をレイヤーごとにトラブルシューティングする
title: WSL2 + Windows + リモート Chrome CDP のトラブルシューティング
x-i18n:
    generated_at: "2026-04-30T05:36:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7532c672f7e829b851d175d93354fc586baecea4af5f2555f57908780cedfd02
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

一般的な分割ホスト構成では、OpenClaw Gateway は WSL2 内で実行され、Chrome は Windows 上で実行され、ブラウザー制御は WSL2 と Windows の境界を越える必要があります。[issue #39369](https://github.com/openclaw/openclaw/issues/39369) の階層的な失敗パターンでは、複数の独立した問題が同時に現れることがあり、最初に間違った階層が壊れているように見えます。

## まず適切なブラウザーモードを選ぶ

有効なパターンは 2 つあります。

### オプション 1: WSL2 から Windows への raw remote CDP

WSL2 から Windows Chrome の CDP エンドポイントを指すリモートブラウザープロファイルを使用します。

次の場合に選択します。

- Gateway が WSL2 内にある
- Chrome が Windows 上で実行されている
- ブラウザー制御が WSL2/Windows 境界を越える必要がある

### オプション 2: ホストローカル Chrome MCP

`existing-session` / `user` は、Gateway 自体が Chrome と同じホストで実行されている場合にのみ使用します。

次の場合に選択します。

- OpenClaw と Chrome が同じマシン上にある
- ローカルのサインイン済みブラウザー状態を使いたい
- クロスホストのブラウザー転送が不要
- `responsebody`、PDF
  エクスポート、ダウンロードのインターセプト、バッチアクションのような高度な managed/raw-CDP 専用ルートが不要

WSL2 Gateway + Windows Chrome の場合は、raw remote CDP を推奨します。Chrome MCP はホストローカルであり、WSL2 から Windows へのブリッジではありません。

## 動作するアーキテクチャ

参照形:

- WSL2 が `127.0.0.1:18789` で Gateway を実行する
- Windows が通常のブラウザーで `http://127.0.0.1:18789/` の Control UI を開く
- Windows Chrome がポート `9222` で CDP エンドポイントを公開する
- WSL2 からその Windows CDP エンドポイントに到達できる
- OpenClaw が WSL2 から到達可能なアドレスをブラウザープロファイルに指定する

## この構成が分かりにくい理由

複数の失敗が重なることがあります。

- WSL2 から Windows CDP エンドポイントに到達できない
- Control UI が非セキュアなオリジンから開かれている
- `gateway.controlUi.allowedOrigins` がページオリジンと一致しない
- トークンまたはペアリングが欠けている
- ブラウザープロファイルが間違ったアドレスを指している

そのため、1 つの階層を直しても別のエラーが表示されたままになることがあります。

## Control UI の重要なルール

UI を Windows から開く場合は、意図的な HTTPS 構成がない限り Windows localhost を使用します。

使用するもの:

`http://127.0.0.1:18789/`

Control UI に LAN IP を既定で使わないでください。LAN または tailnet アドレス上のプレーン HTTP は、CDP 自体とは無関係な insecure-origin/device-auth 動作を引き起こすことがあります。[Control UI](/ja-JP/web/control-ui) を参照してください。

## 階層ごとに検証する

上から順に作業します。先に飛ばさないでください。

### レイヤー 1: Chrome が Windows 上で CDP を提供していることを確認する

Windows 上でリモートデバッグを有効にして Chrome を起動します。

```powershell
chrome.exe --remote-debugging-port=9222
```

Windows から、まず Chrome 自体を確認します。

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

これが Windows 上で失敗する場合、まだ OpenClaw の問題ではありません。

### レイヤー 2: WSL2 からその Windows エンドポイントに到達できることを確認する

WSL2 から、`cdpUrl` で使う予定の正確なアドレスをテストします。

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

良好な結果:

- `/json/version` が Browser / Protocol-Version メタデータを含む JSON を返す
- `/json/list` が JSON を返す（ページが開いていない場合は空配列で問題ありません）

これが失敗する場合:

- Windows がまだ WSL2 にポートを公開していない
- WSL2 側にとってアドレスが間違っている
- ファイアウォール / ポート転送 / ローカルプロキシがまだ不足している

OpenClaw 設定に触れる前にこれを修正してください。

### レイヤー 3: 正しいブラウザープロファイルを設定する

raw remote CDP では、WSL2 から到達可能なアドレスを OpenClaw に指定します。

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

メモ:

- Windows 上でしか動かないアドレスではなく、WSL2 から到達可能なアドレスを使う
- 外部管理ブラウザーでは `attachOnly: true` を維持する
- `cdpUrl` は `http://`、`https://`、`ws://`、または `wss://` にできる
- OpenClaw に `/json/version` を検出させたい場合は HTTP(S) を使う
- ブラウザープロバイダーが直接 DevTools ソケット URL を提供する場合のみ WS(S) を使う
- OpenClaw の成功を期待する前に、同じ URL を `curl` でテストする

### レイヤー 4: Control UI レイヤーを別に確認する

Windows から UI を開きます。

`http://127.0.0.1:18789/`

次に確認します。

- ページオリジンが `gateway.controlUi.allowedOrigins` の期待と一致している
- トークン認証またはペアリングが正しく設定されている
- Control UI 認証問題をブラウザー問題としてデバッグしていない

役立つページ:

- [Control UI](/ja-JP/web/control-ui)

### レイヤー 5: エンドツーエンドのブラウザー制御を確認する

WSL2 から:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

良好な結果:

- タブが Windows Chrome で開く
- `openclaw browser tabs` がターゲットを返す
- 後続のアクション（`snapshot`、`screenshot`、`navigate`）が同じプロファイルから動作する

## 誤解を招きやすい一般的なエラー

各メッセージを階層固有の手がかりとして扱います。

- `control-ui-insecure-auth`
  - UI オリジン / セキュアコンテキストの問題であり、CDP 転送の問題ではない
- `token_missing`
  - 認証設定の問題
- `pairing required`
  - デバイス承認の問題
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 から設定済みの `cdpUrl` に到達できない
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - HTTP エンドポイントは応答したが、DevTools WebSocket をまだ開けなかった
- リモートセッション後の古い viewport / dark-mode / locale / offline オーバーライド
  - `openclaw browser stop --browser-profile remote` を実行する
  - これは Gateway や外部ブラウザーを再起動せずに、アクティブな制御セッションを閉じ、Playwright/CDP エミュレーション状態を解放する
- `gateway timeout after 1500ms`
  - 多くの場合、まだ CDP 到達性または低速/到達不能なリモートエンドポイントの問題
- `No Chrome tabs found for profile="user"`
  - ホストローカルのタブが利用できない場所でローカル Chrome MCP プロファイルが選択されている

## 高速トリアージチェックリスト

1. Windows: `curl http://127.0.0.1:9222/json/version` は動作しますか?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` は動作しますか?
3. OpenClaw 設定: `browser.profiles.<name>.cdpUrl` はその正確な WSL2 到達可能アドレスを使っていますか?
4. Control UI: LAN IP ではなく `http://127.0.0.1:18789/` を開いていますか?
5. raw remote CDP ではなく、WSL2 と Windows をまたいで `existing-session` を使おうとしていますか?

## 実践的な要点

この構成は通常は実現可能です。難しいのは、ブラウザー転送、Control UI オリジンセキュリティ、トークン/ペアリングが、それぞれ独立して失敗しながら、ユーザー側からは似て見えることです。

迷った場合:

- まず Windows Chrome エンドポイントをローカルで確認する
- 次に同じエンドポイントを WSL2 から確認する
- その後でのみ OpenClaw 設定または Control UI 認証をデバッグする

## 関連

- [ブラウザー](/ja-JP/tools/browser)
- [ブラウザーログイン](/ja-JP/tools/browser-login)
- [Browser Linux トラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting)
