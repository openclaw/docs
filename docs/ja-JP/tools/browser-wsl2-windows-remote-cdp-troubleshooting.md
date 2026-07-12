---
read_when:
    - Chrome が Windows 上にある環境で OpenClaw Gateway を WSL2 で実行する
    - WSL2 と Windows の両方で重複するブラウザー／コントロール UI エラーが発生する場合
    - 分離ホスト構成でのホストローカル Chrome MCP と生のリモート CDP の選択
summary: WSL2 Gateway + Windows Chrome リモート CDP を段階的にトラブルシューティングする
title: WSL2 + Windows + リモート Chrome CDP のトラブルシューティング
x-i18n:
    generated_at: "2026-07-11T22:45:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be6d9af2b3efb23be22a5ed6e6645348ddc53e6f997280410fa3e00bb44d8b6d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

一般的な分離ホスト構成では、OpenClaw Gateway は WSL2 内で動作し、Chrome は Windows 上で動作するため、ブラウザー制御は WSL2/Windows の境界を越える必要があります。複数の独立した問題が同時に表面化することがあります（[issue #39369](https://github.com/openclaw/openclaw/issues/39369) を参照）：CDP トランスポート、Control UI のオリジンセキュリティ、トークン/ペアリングは、それぞれ単独で失敗しても似たようなエラーを生成する可能性があります。どれが壊れているかを推測するのではなく、以下のレイヤーを順に確認してください。

## 最初に適切なブラウザーモードを選択する

### オプション 1：WSL2 から Windows への直接リモート CDP

WSL2 から Windows Chrome の CDP エンドポイントを指すリモートブラウザープロファイルを使用します。Gateway を WSL2 内で実行し、Chrome を Windows 上で実行していて、ブラウザー制御が WSL2/Windows の境界を越える必要がある場合に選択してください。

### オプション 2：ホストローカルの Chrome MCP

`existing-session` ドライバー（`user` プロファイル）は、Gateway が Chrome と同じホスト上で動作し、ローカルでサインイン済みのブラウザー状態を使用したく、ホスト間のブラウザートランスポートが不要で、`responsebody`、PDF エクスポート、ダウンロードのインターセプト、バッチアクションも不要な場合にのみ使用してください（Chrome MCP プロファイルはこれらをサポートしません）。

WSL2 Gateway + Windows Chrome の場合は、直接リモート CDP を使用してください。Chrome MCP はホストローカルであり、WSL2 と Windows 間のブリッジではありません。

## 動作するアーキテクチャ

- WSL2 は `127.0.0.1:18789` で Gateway を実行する
- Windows は通常のブラウザーで `http://127.0.0.1:18789/` の Control UI を開く
- Windows Chrome はポート `9222` で CDP エンドポイントを公開する
- WSL2 からその Windows CDP エンドポイントに到達できる
- OpenClaw は WSL2 から到達可能なアドレスをブラウザープロファイルに指定する

## Control UI の重要なルール

Windows から UI を開く場合、意図的に HTTPS を設定していない限り、Windows の localhost を使用してください。

```text
http://127.0.0.1:18789/
```

LAN IP をデフォルトで使用しないでください。LAN または tailnet アドレス上の平文 HTTP は、CDP 自体とは無関係な安全でないオリジン/デバイス認証の動作を引き起こす可能性があります。[Control UI](/ja-JP/web/control-ui) を参照してください。

## レイヤーごとに検証する

上から下へ順に進め、途中を飛ばさないでください。1 つのレイヤーを修正しても、さらに下の別のレイヤーのエラーが引き続き表示される場合があります。

### レイヤー 1：Chrome が Windows 上で CDP を提供していることを確認する

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome 136 以降では、デフォルトの Chrome データディレクトリに対するリモートデバッグのコマンドラインスイッチは無視されます。上記のように、デフォルトではない別のデータディレクトリを使用してください。Chrome の[リモートデバッグに関するセキュリティ変更](https://developer.chrome.com/blog/remote-debugging-port)を参照してください。これによって、通常のサインイン済み Chrome プロファイルをリモート制御できるようになるわけではありません。

まず Windows から Chrome 自体を確認します。

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

これが失敗する場合は、以下の Windows リスナーを診断してください。この時点では、まだ OpenClaw が問題ではありません。

#### portproxy を変更する前に IPv4 と IPv6 を診断する

Chromium は最初にリモートデバッグを `127.0.0.1` にバインドしようとし、IPv4 のバインドが失敗した場合にのみ `[::1]` へフォールバックします。`127.0.0.1:9222` で待ち受ける永続的な `v4tov4` ルールがあると、Chrome の起動前にそのエンドポイントを占有することがあります。その場合、Chrome は `[::1]:9222` へフォールバックする一方、古いルールは IPv4 トラフィックを自身のリスナーへ転送し、空の応答を返します。

Chrome のバージョンから推測せず、Windows から実際のリスナーとプロキシルールを確認してください。

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

`netstat` に表示された各 PID に対して `tasklist /fi "PID eq <PID>"` を使用してください。

- `chrome.exe` が `127.0.0.1` で応答する場合、同じく `127.0.0.1:9222` で待ち受ける portproxy ルールをすべて削除してください。WSL2 から到達可能な Windows アダプターのアドレスだけを `127.0.0.1` へ転送します。
- `chrome.exe` が `[::1]` でのみ応答する場合、未使用の IPv4 アドレスへ転送するのではなく、`v4tov6` を使用して WSL2 から到達可能なリスナーの転送先を `::1` にします。

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

リスナーは、WSL2 が必要とするアダプターアドレスにバインドしてください。CDP ポートを `0.0.0.0`、LAN アドレス、または tailnet アドレスで公開しないでください。CDP はブラウザーセッションの制御権を付与します。

### レイヤー 2：WSL2 からその Windows エンドポイントに到達できることを確認する

WSL2 から、`cdpUrl` で使用する予定の正確なアドレスをテストします。

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

正常な結果：

- `/json/version` が Browser / Protocol-Version メタデータを含む JSON を返す
- `/json/list` が JSON を返す（ページが開かれていない場合は空の配列でも問題ありません）

これが失敗する場合、Windows がまだ WSL2 にポートを公開していない、WSL2 側で使用するアドレスが間違っている、またはファイアウォール/ポート転送/プロキシが不足しています。OpenClaw の設定を変更する前に、その問題を修正してください。

### レイヤー 3：正しいブラウザープロファイルを設定する

OpenClaw に WSL2 から到達可能なアドレスを指定します。

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

注：

- Windows 上でしか動作しないアドレスではなく、WSL2 から到達可能なアドレスを使用する
- 外部管理のブラウザーでは `attachOnly: true` を維持する
- `cdpUrl` には `http://`、`https://`、`ws://`、または `wss://` を使用できる
- OpenClaw に `/json/version` を検出させる場合は HTTP(S) を使用する
- ブラウザープロバイダーから直接 DevTools ソケット URL が提供される場合にのみ WS(S) を使用する
- OpenClaw の成功を期待する前に、同じ URL を `curl` でテストする

### レイヤー 4：Control UI レイヤーを個別に確認する

Windows から `http://127.0.0.1:18789/` を開き、次を確認します。

- ページのオリジンが `gateway.controlUi.allowedOrigins` の想定と一致している
- トークン認証またはペアリングが正しく設定されている
- Control UI の認証問題をブラウザー問題としてデバッグしていない

参考ページ：[Control UI](/ja-JP/web/control-ui)。

### レイヤー 5：エンドツーエンドのブラウザー制御を確認する

WSL2 から実行します。

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

正常な結果：

- Windows Chrome でタブが開く
- `browser tabs` が対象を返す
- 後続のアクション（`snapshot`、`screenshot`、`navigate`）が同じプロファイルから動作する

## 誤解を招きやすい一般的なエラー

| メッセージ                                                                              | 意味                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | CDP トランスポートの問題ではなく、UI オリジン/セキュアコンテキストの問題                                                                                                                             |
| `token_missing`                                                                         | 認証設定の問題                                                                                                                                                                                       |
| `pairing required`                                                                      | デバイス承認の問題                                                                                                                                                                                   |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2 から設定済みの `cdpUrl` に到達できない                                                                                                                                                          |
| portproxy 経由での空の CDP 応答 / `other side closed`                                   | Windows リスナーの不一致または自己ループ。両方のループバックファミリーと `netsh interface portproxy show all` を確認する                                                                              |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | HTTP エンドポイントは応答したが、DevTools WebSocket を開けなかった                                                                                                                                   |
| リモートセッション後にビューポート / ダークモード / ロケール / オフラインの上書きが残る | `openclaw browser --browser-profile remote stop` を実行し、Gateway や外部ブラウザーを再起動せずにセッションを閉じて、キャッシュされた Playwright/CDP 接続を解放する                                    |
| `remoteCdpTimeoutMs` 付近のタイムアウト（デフォルト 1500ms）                            | 通常は引き続き CDP の到達性の問題、または低速/到達不能なリモートエンドポイント                                                                                                                        |
| `Playwright page enumeration timed out after 3000ms`                                    | リモート CDP には接続できたが、永続タブの読み取りが停止した。期限は `remoteCdpTimeoutMs` と `remoteCdpHandshakeTimeoutMs` の大きい方                                                                   |
| `No Chrome tabs found for profile="user"`                                               | ホストローカルのタブが存在しない場所で、ローカル Chrome MCP プロファイルが選択されている                                                                                                              |

## 迅速なトリアージのチェックリスト

1. Windows：`127.0.0.1` と `[::1]` のどちらが `/json/version` に応答し、そのリスナーは `chrome.exe` のものか？
2. WSL2：`curl http://WINDOWS_HOST_OR_IP:9222/json/version` は動作するか？
3. OpenClaw の設定：`browser.profiles.<name>.cdpUrl` は、その正確な WSL2 から到達可能なアドレスを使用しているか？
4. Control UI：LAN IP ではなく `http://127.0.0.1:18789/` を開いているか？
5. 直接リモート CDP ではなく、WSL2 と Windows をまたいで `existing-session` を使用しようとしていないか？

まず Windows Chrome のエンドポイントを Windows 上で確認し、次に同じエンドポイントを WSL2 から確認してから、OpenClaw の設定または Control UI の認証をデバッグしてください。

## 関連項目

- [ブラウザー](/ja-JP/tools/browser)
- [ブラウザーへのログイン](/ja-JP/tools/browser-login)
- [Linux でのブラウザーのトラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting)
