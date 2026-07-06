---
read_when:
    - Windows 上の Chrome を使用しながら WSL2 で OpenClaw Gateway を実行する
    - WSL2 と Windows 全体で重複するブラウザー/control-ui エラーが表示される
    - 分割ホスト構成で host-local Chrome MCP と raw remote CDP のどちらを選ぶか
summary: WSL2 Gateway + Windows Chrome リモート CDP を階層的にトラブルシュートする
title: WSL2 + Windows + リモート Chrome CDP のトラブルシューティング
x-i18n:
    generated_at: "2026-07-06T10:55:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be6d9af2b3efb23be22a5ed6e6645348ddc53e6f997280410fa3e00bb44d8b6d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

一般的な分割ホスト構成では、OpenClaw Gateway は WSL2 内で実行され、Chrome は
Windows 上で実行され、ブラウザー制御は WSL2/Windows の境界をまたぐ必要があります。複数の
独立した問題が同時に表面化することがあります（
[issue #39369](https://github.com/openclaw/openclaw/issues/39369) を参照）: CDP
トランスポート、Control UI のオリジンセキュリティ、トークン/ペアリングは、それぞれ単独で失敗しながら
似たようなエラーを生成することがあります。どれが壊れているかを推測するのではなく、
以下のレイヤーを順番に確認してください。

## まず適切なブラウザーモードを選ぶ

### オプション 1: WSL2 から Windows への生のリモート CDP

WSL2 から Windows Chrome の CDP
エンドポイントを指すリモートブラウザープロファイルを使用します。Gateway が WSL2 内にとどまり、Chrome が
Windows 上で実行され、ブラウザー制御が WSL2/Windows の境界をまたぐ必要がある場合は、これを選びます。

### オプション 2: ホストローカル Chrome MCP

Gateway が Chrome と同じホスト上で実行され、ローカルのサインイン済みブラウザー状態を使いたい場合で、クロスホストのブラウザートランスポートが不要であり、`responsebody`、
PDF エクスポート、ダウンロードのインターセプト、またはバッチアクションが不要な場合にのみ、`existing-session` ドライバー（`user` プロファイル）を使用します（Chrome MCP プロファイルは
これらをサポートしていません）。

WSL2 Gateway + Windows Chrome では、生のリモート CDP を使用します。Chrome MCP は
ホストローカルであり、WSL2 から Windows へのブリッジではありません。

## 動作するアーキテクチャ

- WSL2 が `127.0.0.1:18789` で Gateway を実行する
- Windows が通常のブラウザーで `http://127.0.0.1:18789/` の Control UI を開く
- Windows Chrome がポート `9222` で CDP エンドポイントを公開する
- WSL2 がその Windows CDP エンドポイントに到達できる
- OpenClaw が WSL2 から到達可能なアドレスをブラウザープロファイルに指定する

## Control UI の重要なルール

UI を Windows から開く場合は、意図的な HTTPS 構成がない限り Windows localhost を使用します。

```text
http://127.0.0.1:18789/
```

LAN IP をデフォルトにしないでください。LAN または tailnet アドレス上のプレーン HTTP は、
CDP 自体とは無関係な insecure-origin/device-auth 動作を
引き起こすことがあります。[Control UI](/ja-JP/web/control-ui) を参照してください。

## レイヤーごとに検証する

上から下へ進め、飛ばさないでください。1 つのレイヤーを修正しても、さらに下のレイヤーから
別のエラーが見えることがあります。

### レイヤー 1: Chrome が Windows で CDP を提供していることを確認する

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome 136 以降は、デフォルトの Chrome データディレクトリに対する remote-debugging コマンドラインスイッチを無視します。
上記のように、デフォルトではない別のデータディレクトリを使用してください。Chrome の
[remote-debugging security change](https://developer.chrome.com/blog/remote-debugging-port) を参照してください。
これにより、通常のサインイン済み Chrome プロファイルがリモート制御可能になるわけではありません。

Windows から、まず Chrome 自体を確認します。

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

これが失敗する場合は、以下の Windows リスナーを診断してください。この時点では、OpenClaw はまだ
問題ではありません。

#### portproxy を変更する前に IPv4 と IPv6 を診断する

Chromium は remote debugging をまず `127.0.0.1` にバインドしようとし、IPv4 バインドが失敗した場合にのみ
`[::1]` へフォールバックします。`127.0.0.1:9222` で待ち受ける永続的な `v4tov4` ルールがあると、
Chrome の起動前にそのエンドポイントを占有できます。その場合 Chrome は
`[::1]:9222` にフォールバックし、一方で古いルールは IPv4 トラフィックを
自身のリスナーへ転送し、空の応答を返します。

Chrome のバージョンから推測するのではなく、Windows から実際のリスナーとプロキシルールを確認します。

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

`netstat` の各 PID について `tasklist /fi "PID eq <PID>"` を使用します。

- `chrome.exe` が `127.0.0.1` で応答する場合は、同じく
  `127.0.0.1:9222` で待ち受ける portproxy ルールをすべて削除します。WSL2 から到達可能な Windows アダプター
  アドレスだけを `127.0.0.1` に転送します。
- `chrome.exe` が `[::1]` でのみ応答する場合は、未使用の IPv4 アドレスへ転送するのではなく、
  `v4tov6` を使って WSL2 から到達可能なリスナーを
  `::1` に向けます。

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

リスナーは WSL2 が必要とするアダプターアドレスにバインドしてください。CDP
ポートを `0.0.0.0`、LAN アドレス、または tailnet アドレスで公開しないでください。CDP は
ブラウザーセッションの制御権を与えます。

### レイヤー 2: WSL2 がその Windows エンドポイントに到達できることを確認する

WSL2 から、`cdpUrl` で使う予定の正確なアドレスをテストします。

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

良好な結果:

- `/json/version` が Browser / Protocol-Version メタデータを含む JSON を返す
- `/json/list` が JSON を返す（ページが開いていなければ空配列でも問題ありません）

これが失敗する場合、Windows はまだ WSL2 にポートを公開していない、WSL2 側のアドレスが
間違っている、またはファイアウォール/ポート転送/プロキシが不足しています。OpenClaw 設定に触れる前に
それを修正してください。

### レイヤー 3: 正しいブラウザープロファイルを設定する

WSL2 から到達可能なアドレスを OpenClaw に指定します。

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

- Windows 上でだけ動作するものではなく、WSL2 から到達可能なアドレスを使用する
- 外部管理ブラウザーでは `attachOnly: true` を維持する
- `cdpUrl` は `http://`、`https://`、`ws://`、または `wss://` にできる
- OpenClaw に `/json/version` を検出させたい場合は HTTP(S) を使用する
- ブラウザープロバイダーが直接の DevTools
  ソケット URL を提供する場合にのみ WS(S) を使用する
- OpenClaw の成功を期待する前に、同じ URL を `curl` でテストする

### レイヤー 4: Control UI レイヤーを別に確認する

Windows から `http://127.0.0.1:18789/` を開き、次を確認します。

- ページのオリジンが `gateway.controlUi.allowedOrigins` の期待と一致している
- トークン認証またはペアリングが正しく設定されている
- ブラウザーの問題のように見せかけて Control UI 認証問題をデバッグしていない

参考ページ: [Control UI](/ja-JP/web/control-ui)。

### レイヤー 5: エンドツーエンドのブラウザー制御を確認する

WSL2 から:

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

良好な結果:

- タブが Windows Chrome で開く
- `browser tabs` がターゲットを返す
- 後続のアクション（`snapshot`、`screenshot`、`navigate`）が同じ
  プロファイルから動作する

## よくある紛らわしいエラー

| メッセージ                                                                              | 意味                                                                                                                                                                              |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | CDP トランスポートの問題ではなく、UI オリジン/セキュアコンテキストの問題                                                                                                         |
| `token_missing`                                                                         | 認証設定の問題                                                                                                                                                                    |
| `pairing required`                                                                      | デバイス承認の問題                                                                                                                                                                |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2 が設定済みの `cdpUrl` に到達できない                                                                                                                                         |
| 空の CDP 応答 / portproxy 経由の `other side closed`                                    | Windows リスナーの不一致または自己ループ。両方のループバックファミリーと `netsh interface portproxy show all` を確認する                                                         |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | HTTP エンドポイントは応答したが、DevTools WebSocket を開けなかった                                                                                                                |
| リモートセッション後に viewport / dark-mode / locale / offline overrides が古い         | Gateway や外部ブラウザーを再起動せずに、セッションを閉じてキャッシュ済み Playwright/CDP 接続を解放するには `openclaw browser --browser-profile remote stop` を実行する            |
| `remoteCdpTimeoutMs`（デフォルト 1500ms）周辺のタイムアウト                             | 通常は依然として CDP 到達性、または低速/到達不能なリモートエンドポイント                                                                                                         |
| `Playwright page enumeration timed out after 3000ms`                                    | リモート CDP は接続されたが、永続タブの読み取りが停止した。期限は `remoteCdpTimeoutMs` と `remoteCdpHandshakeTimeoutMs` の大きい方                                                |
| `No Chrome tabs found for profile="user"`                                               | ホストローカルのタブが利用できない場所でローカル Chrome MCP プロファイルが選択されている                                                                                         |

## 高速トリアージチェックリスト

1. Windows: `127.0.0.1` と `[::1]` のどちらが `/json/version` に応答し、
   そのリスナーは `chrome.exe` に属しているか？
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` は動作するか？
3. OpenClaw 設定: `browser.profiles.<name>.cdpUrl` は、その正確な
   WSL2 から到達可能なアドレスを使用しているか？
4. Control UI: LAN IP ではなく `http://127.0.0.1:18789/` を開いているか？
5. 生のリモート CDP ではなく、WSL2 と Windows をまたいで `existing-session` を使おうとしていないか？

まず Windows Chrome エンドポイントをローカルで確認し、次に同じエンドポイントを
WSL2 から確認し、その後でのみ OpenClaw 設定または Control UI 認証をデバッグしてください。

## 関連

- [ブラウザー](/ja-JP/tools/browser)
- [ブラウザーログイン](/ja-JP/tools/browser-login)
- [ブラウザー Linux トラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting)
