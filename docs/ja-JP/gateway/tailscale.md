---
read_when:
    - Gateway コントロール UI を localhost の外部に公開する
    - tailnet または公開ダッシュボードへのアクセスの自動化
summary: Gateway ダッシュボード向けの Tailscale Serve/Funnel 統合
title: Tailscale
x-i18n:
    generated_at: "2026-07-12T14:31:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw は、Gateway ダッシュボードと WebSocket ポート向けに Tailscale **Serve**（tailnet）または **Funnel**（公開）を自動設定できます。これにより、Gateway はループバックにバインドされたまま、Tailscale が HTTPS、ルーティング、および（Serve の場合）アイデンティティヘッダーを提供します。

## モード

`gateway.tailscale.mode`:

| モード          | 動作                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------ |
| `serve`         | `tailscale serve` による tailnet 限定の Serve。Gateway は `127.0.0.1` のままです。         |
| `funnel`        | `tailscale funnel` による公開 HTTPS。共有パスワードが必要です。                            |
| `off`（デフォルト） | Tailscale の自動化を行いません。                                                       |

ステータスと監査出力では、この OpenClaw の Serve/Funnel モードを **Tailscale 公開状態** と表記します。`off` は、OpenClaw が Serve または Funnel を管理していないことを意味します。ローカルの Tailscale デーモンが停止している、またはログアウトしているという意味ではありません。

## 設定例

### Tailnet 限定（Serve）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

開く: `https://<magicdns>/`（または設定済みの `gateway.controlUi.basePath`）

デバイスのホスト名ではなく、名前付き Tailscale Service を介して Control UI を公開するには、`gateway.tailscale.serviceName` を Service 名に設定します。

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

起動時には、デバイスのホスト名ではなく、Service URL が `https://openclaw.<tailnet-name>.ts.net/` として報告されます。Tailscale Services では、ホストが tailnet 内で承認済みのタグ付き Node である必要があります。これを有効にする前に Tailscale でタグを設定し、Service を承認してください。そうしないと、Gateway の起動時に `tailscale serve --service=...` が失敗します。

### Tailnet 限定（Tailnet IP にバインド）

Serve/Funnel を使用せず、Gateway が Tailnet IP で直接待ち受けるようにするには、次の設定を使用します。

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

別の Tailnet デバイスから接続します。

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
バインド可能な Tailnet IPv4 が存在する場合、Gateway は認証済みの同一ホスト上のクライアント向けに `http://127.0.0.1:18789` も必要とします。起動時に Tailnet アドレスを利用できない場合は、ループバックのみにフォールバックします。Tailscale が利用可能になった後、直接 Tailnet アクセスを追加するには再起動してください。どちらの経路も LAN または公開アクセスを追加しません。
</Note>

### 公開インターネット（Funnel + 共有パスワード）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

パスワードをディスクにコミットするよりも、`OPENCLAW_GATEWAY_PASSWORD` の使用を推奨します。

## CLI の例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 認証

`gateway.auth.mode` はハンドシェイクを制御します。

| モード                                                 | ユースケース                                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `none`                                                 | プライベートな受信接続のみ                                                            |
| `token`（`OPENCLAW_GATEWAY_TOKEN` 設定時のデフォルト） | 共有トークン                                                                          |
| `password`                                             | `OPENCLAW_GATEWAY_PASSWORD` または設定による共有シークレット                          |
| `trusted-proxy`                                        | アイデンティティ対応リバースプロキシ。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照 |

### Tailscale アイデンティティヘッダー（Serve のみ）

`tailscale.mode: "serve"` かつ `gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket 認証では、トークンやパスワードの代わりに Tailscale アイデンティティヘッダー（`tailscale-user-login`）を使用できます。OpenClaw は、ローカルの Tailscale デーモン（`tailscale whois`）を介してリクエストの `x-forwarded-for` アドレスを解決し、ヘッダーのログイン情報と照合してから、そのヘッダーを検証してリクエストを受け入れます。この経路の対象となるのは、Tailscale の `x-forwarded-for`、`x-forwarded-proto`、`x-forwarded-host` ヘッダーを伴ってループバックから届いたリクエストのみです。

このトークンレスフローは、Gateway ホストが信頼されていることを前提とします。信頼されていないローカルコードが同じホスト上で実行される可能性がある場合は、`gateway.auth.allowTailscale: false` を設定し、代わりにトークンまたはパスワード認証を必須にしてください。

バイパスの適用範囲:

- Control UI の WebSocket 認証サーフェスにのみ適用されます。HTTP API エンドポイント（`/v1/*`、`/tools/invoke`、`/api/channels/*` など）では、Tailscale アイデンティティヘッダー認証を使用しません。常に Gateway の通常の HTTP 認証モードに従います。
- ブラウザーのデバイスアイデンティティをすでに保持している Control UI のオペレーターセッションでは、検証済みの Tailscale アイデンティティにより、ブートストラップトークン/QR ペアリングの往復処理が省略されます。
- デバイスアイデンティティ自体はバイパスされません。デバイス情報のないクライアントは引き続き拒否され、Node ロールの接続でも通常のペアリングおよび認証チェックが行われます。

## 注意事項

- Tailscale Serve/Funnel を使用するには、`tailscale` CLI がインストールされ、ログイン済みである必要があります。
- 公開アクセスを避けるため、`tailscale.mode: "funnel"` は認証モードが `password` でない限り起動を拒否します。
- `gateway.tailscale.serviceName` は Serve モードにのみ適用され、`tailscale serve --service=<name>` に渡されます。値には Tailscale の `svc:<dns-label>` 形式（例: `svc:openclaw`）を使用する必要があります。Tailscale では Service ホストがタグ付き Node である必要があり、Serve で公開する前に管理コンソールで Service の承認が必要になる場合があります。
- `gateway.tailscale.resetOnExit` は、シャットダウン時に `tailscale serve`/`tailscale funnel` の設定を取り消します。
- `gateway.tailscale.preserveFunnel: true` は、外部で設定された `tailscale funnel` ルートを Gateway の再起動後も維持します。`mode: "serve"` の場合、OpenClaw は Serve を再適用する前に `tailscale funnel status` を確認し、Funnel ルートがすでに Gateway ポートを対象としている場合は再適用を省略します。OpenClaw が管理する Funnel のパスワード必須ポリシーに変更はありません。
- `gateway.bind: "tailnet"` は、Tailnet IPv4 が利用可能な場合、Tailnet への直接バインド（HTTPS なし、Serve/Funnel なし）と必須のローカル `127.0.0.1` を使用します。利用できない場合は、ループバックのみにフォールバックします。
- `gateway.bind: "auto"` はループバックを優先します。同一ホストからのループバックアクセスを維持しつつネットワーク公開範囲を Tailnet に限定するには、`tailnet` を使用します。
- Serve/Funnel が公開するのは **Gateway Control UI + WS** のみです。Node は同じ Gateway WS エンドポイント経由で接続するため、Serve は Node アクセスにも使用できます。

### Tailscale の前提条件と制限

- Serve では tailnet の HTTPS が有効になっている必要があります。有効でない場合、CLI が設定を促します。
- Serve は Tailscale アイデンティティヘッダーを挿入しますが、Funnel は挿入しません。
- Funnel には Tailscale v1.38.3+、MagicDNS、HTTPS の有効化、および Funnel Node 属性が必要です。
- Funnel が TLS 経由でサポートするポートは `443`、`8443`、`10000` のみです。
- macOS で Funnel を使用するには、オープンソース版の Tailscale アプリが必要です。

## ブラウザー制御（リモート Gateway + ローカルブラウザー）

あるマシンで Gateway を実行し、別のマシンのブラウザーを操作するには、ブラウザー側のマシンで **Node ホスト** を実行し、両方を同じ tailnet に配置します。Gateway はブラウザー操作を Node にプロキシします。個別の制御サーバーや Serve URL は必要ありません。

ブラウザー制御には Funnel を使用しないでください。Node のペアリングはオペレーターアクセスと同様に扱ってください。

## 詳細情報

- Tailscale Serve の概要: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` コマンド: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel の概要: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` コマンド: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 関連項目

- [リモートアクセス](/ja-JP/gateway/remote)
- [検出](/ja-JP/gateway/discovery)
- [認証](/ja-JP/gateway/authentication)
