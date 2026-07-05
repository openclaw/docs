---
read_when:
    - Windows 上の Chrome を使いながら WSL2 で OpenClaw Gateway を実行する
    - WSL2 と Windows 全体で重複するブラウザー/control-ui エラーが表示される
    - 分割ホスト構成でホストローカルの Chrome MCP と生のリモート CDP のどちらにするかを決める
summary: WSL2 Gateway + Windows Chrome リモート CDP を段階的にトラブルシュートする
title: WSL2 + Windows + リモート Chrome CDP のトラブルシューティング
x-i18n:
    generated_at: "2026-07-05T11:52:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a2cd455663add52b53d2b880db884b3d798afac63e8a943d28550726cf0ea7
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

一般的な分割ホスト構成では、OpenClaw Gateway は WSL2 内で実行され、Chrome は
Windows 上で実行され、ブラウザー制御は WSL2/Windows の境界を越える必要があります。複数の
独立した問題が同時に表面化することがあります（
[issue #39369](https://github.com/openclaw/openclaw/issues/39369) を参照）：CDP
トランスポート、コントロール UI のオリジンセキュリティ、トークン/ペアリングは、それぞれ
単独で失敗しながら、似たエラーを生成することがあります。どれが壊れているかを推測するのではなく、
以下のレイヤーを順番に確認してください。

## まず正しいブラウザーモードを選ぶ

### オプション 1：WSL2 から Windows への生のリモート CDP

WSL2 から Windows Chrome の CDP エンドポイントを指すリモートブラウザープロファイルを
使用します。Gateway は WSL2 内に置いたまま、Chrome は Windows 上で実行し、
ブラウザー制御が WSL2/Windows の境界を越える必要がある場合に選びます。

### オプション 2：ホストローカルの Chrome MCP

`existing-session` ドライバー（`user` プロファイル）は、Gateway が
Chrome と同じホストで実行されていて、ローカルのサインイン済みブラウザー状態を使いたい場合、
クロスホストのブラウザートランスポートが不要な場合、かつ `responsebody`、
PDF エクスポート、ダウンロードのインターセプト、バッチアクションが不要な場合にのみ使用します
（Chrome MCP プロファイルはこれらをサポートしません）。

WSL2 Gateway + Windows Chrome では、生のリモート CDP を使用します。Chrome MCP は
ホストローカルであり、WSL2 から Windows へのブリッジではありません。

## 動作するアーキテクチャ

- WSL2 が `127.0.0.1:18789` で Gateway を実行する
- Windows が通常のブラウザーで `http://127.0.0.1:18789/` のコントロール UI を開く
- Windows Chrome がポート `9222` で CDP エンドポイントを公開する
- WSL2 からその Windows CDP エンドポイントへ到達できる
- OpenClaw が WSL2 から到達可能なアドレスをブラウザープロファイルに指定する

## コントロール UI の重要なルール

UI を Windows から開く場合、意図的な HTTPS 構成がない限り、Windows の localhost を使用します。

```text
http://127.0.0.1:18789/
```

LAN IP をデフォルトにしないでください。LAN または tailnet アドレス上の平文 HTTP は、
CDP 自体とは無関係な insecure-origin/device-auth の挙動を引き起こすことがあります。
[コントロール UI](/ja-JP/web/control-ui) を参照してください。

## レイヤーごとに検証する

上から下へ進めてください。先を飛ばさないでください。あるレイヤーを修正しても、
さらに下のレイヤーから別のエラーが見えるままになることがあります。

### レイヤー 1：Chrome が Windows 上で CDP を提供していることを確認する

```powershell
chrome.exe --remote-debugging-port=9222
```

Windows から、まず Chrome 自体を確認します。

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

これが Windows 上で失敗する場合、まだ OpenClaw の問題ではありません。

### レイヤー 2：WSL2 からその Windows エンドポイントへ到達できることを確認する

WSL2 から、`cdpUrl` で使用する予定の正確なアドレスをテストします。

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

正常な結果：

- `/json/version` が Browser / Protocol-Version メタデータを含む JSON を返す
- `/json/list` が JSON を返す（ページが開いていなければ空配列でも問題ありません）

これが失敗する場合、Windows がまだ WSL2 にポートを公開していない、WSL2 側から見たアドレスが
間違っている、またはファイアウォール/ポートフォワーディング/プロキシが不足しています。OpenClaw
設定に触れる前にそこを修正してください。

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

注記：

- Windows 上でしか動作しないアドレスではなく、WSL2 から到達可能なアドレスを使用する
- 外部管理のブラウザーでは `attachOnly: true` を維持する
- `cdpUrl` には `http://`、`https://`、`ws://`、または `wss://` を使用できる
- OpenClaw に `/json/version` を検出させたい場合は HTTP(S) を使用する
- ブラウザープロバイダーが直接の DevTools ソケット URL を提供する場合にのみ WS(S) を使用する
- OpenClaw の成功を期待する前に、同じ URL を `curl` でテストする

### レイヤー 4：コントロール UI レイヤーを別に確認する

Windows から `http://127.0.0.1:18789/` を開き、次を確認します。

- ページオリジンが `gateway.controlUi.allowedOrigins` の期待と一致している
- トークン認証またはペアリングが正しく設定されている
- コントロール UI の認証問題をブラウザー問題としてデバッグしていない

参考ページ：[コントロール UI](/ja-JP/web/control-ui)。

### レイヤー 5：エンドツーエンドのブラウザー制御を確認する

WSL2 から：

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

正常な結果：

- タブが Windows Chrome で開く
- `browser tabs` がターゲットを返す
- 後続のアクション（`snapshot`、`screenshot`、`navigate`）が同じプロファイルから動作する

## よくある紛らわしいエラー

| メッセージ                                                                              | 意味                                                                                                                                                                              |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | UI オリジン/セキュアコンテキストの問題であり、CDP トランスポートの問題ではない                                                                                                   |
| `token_missing`                                                                         | 認証設定の問題                                                                                                                                                                    |
| `pairing required`                                                                      | デバイス承認の問題                                                                                                                                                                |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2 から設定済みの `cdpUrl` に到達できない                                                                                                                                       |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | HTTP エンドポイントは応答したが、DevTools WebSocket を開けなかった                                                                                                                |
| リモートセッション後に残る古い viewport / ダークモード / ロケール / オフライン上書き    | Gateway や外部ブラウザーを再起動せずに、セッションを閉じてキャッシュ済みの Playwright/CDP 接続を解放するには `openclaw browser --browser-profile remote stop` を実行する |
| `remoteCdpTimeoutMs`（デフォルト 1500ms）付近のタイムアウト                             | 通常は依然として CDP 到達性の問題、または低速/到達不能なリモートエンドポイント                                                                                                   |
| `No Chrome tabs found for profile="user"`                                               | ホストローカルのタブが利用できない場所でローカル Chrome MCP プロファイルが選択されている                                                                                         |

## 高速トリアージチェックリスト

1. Windows：`curl http://127.0.0.1:9222/json/version` は動作しますか？
2. WSL2：`curl http://WINDOWS_HOST_OR_IP:9222/json/version` は動作しますか？
3. OpenClaw 設定：`browser.profiles.<name>.cdpUrl` は、その正確な
   WSL2 から到達可能なアドレスを使用していますか？
4. コントロール UI：LAN IP ではなく `http://127.0.0.1:18789/` を開いていますか？
5. 生のリモート CDP ではなく、WSL2 と Windows の間で `existing-session` を使おうとしていませんか？

まず Windows Chrome エンドポイントをローカルで確認し、次に同じエンドポイントを
WSL2 から確認し、その後にのみ OpenClaw 設定またはコントロール UI 認証をデバッグしてください。

## 関連

- [ブラウザー](/ja-JP/tools/browser)
- [ブラウザーログイン](/ja-JP/tools/browser-login)
- [ブラウザー Linux トラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting)
