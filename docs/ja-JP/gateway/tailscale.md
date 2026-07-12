---
read_when:
    - localhost 外部への Gateway Control UI の公開
    - tailnet または公開ダッシュボードへのアクセスの自動化
summary: Gateway ダッシュボード向けに統合された Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-07-11T22:18:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw は、Gateway ダッシュボードと WebSocket ポート向けに Tailscale **Serve**（tailnet）または **Funnel**（公開）を自動構成できます。これにより、Gateway をループバックにバインドしたまま、Tailscale が HTTPS、ルーティング、および（Serve の場合は）アイデンティティヘッダーを提供します。

## モード

`gateway.tailscale.mode`:

| モード          | 動作                                                                          |
| --------------- | ----------------------------------------------------------------------------- |
| `serve`         | `tailscale serve` による tailnet 限定の Serve。Gateway は `127.0.0.1` のままです。 |
| `funnel`        | `tailscale funnel` による公開 HTTPS。共有パスワードが必要です。                |
| `off`（既定）   | Tailscale の自動化を行いません。                                               |

ステータスと監査出力では、この OpenClaw の Serve/Funnel モードを **Tailscale 公開状態** と表記します。`off` は、OpenClaw が Serve または Funnel を管理していないことを意味します。ローカルの Tailscale デーモンが停止している、またはログアウトしているという意味ではありません。

## 構成例

### tailnet 限定（Serve）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

開く: `https://<magicdns>/`（または構成済みの `gateway.controlUi.basePath`）

デバイスのホスト名ではなく、名前付きの Tailscale Service を介して Control UI を公開するには、`gateway.tailscale.serviceName` を Service 名に設定します。

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

起動時には、デバイスのホスト名ではなく Service URL `https://openclaw.<tailnet-name>.ts.net/` が報告されます。Tailscale Services では、ホストが tailnet 内で承認済みのタグ付き Node である必要があります。これを有効にする前に Tailscale でタグを構成し、Service を承認してください。そうしないと、Gateway の起動中に `tailscale serve --service=...` が失敗します。

### tailnet 限定（tailnet IP にバインド）

Serve/Funnel を使用せず、Gateway が tailnet IP を直接リッスンするようにするには、次を使用します。

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

別の tailnet デバイスから接続します。

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
バインド可能な tailnet IPv4 が存在する場合、Gateway は認証済みの同一ホストクライアント用に `http://127.0.0.1:18789` も必要とします。起動時に tailnet アドレスを利用できない場合は、ループバックのみにフォールバックします。Tailscale が利用可能になった後で再起動し、tailnet からの直接アクセスを追加してください。どちらの経路でも LAN または公開アクセスは追加されません。
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

パスワードをディスクにコミットするより、`OPENCLAW_GATEWAY_PASSWORD` の使用を推奨します。

## CLI の例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 認証

`gateway.auth.mode` はハンドシェイクを制御します。

| モード                                                 | 用途                                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `none`                                                 | プライベートな受信接続のみ                                                            |
| `token`（`OPENCLAW_GATEWAY_TOKEN` の設定時は既定）     | 共有トークン                                                                          |
| `password`                                             | `OPENCLAW_GATEWAY_PASSWORD` または構成による共有シークレット                          |
| `trusted-proxy`                                        | アイデンティティ対応リバースプロキシ。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照 |

### Tailscale アイデンティティヘッダー（Serve のみ）

`tailscale.mode: "serve"` かつ `gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket 認証では、トークンやパスワードの代わりに Tailscale アイデンティティヘッダー（`tailscale-user-login`）を使用できます。OpenClaw は、ローカルの Tailscale デーモン（`tailscale whois`）を介してリクエストの `x-forwarded-for` アドレスを解決し、ヘッダーのログイン情報と照合してから、そのヘッダーを受け入れます。この経路の対象となるのは、Tailscale の `x-forwarded-for`、`x-forwarded-proto`、`x-forwarded-host` ヘッダーを伴い、ループバックから到着したリクエストのみです。

このトークン不要のフローでは、Gateway ホストが信頼済みであることを前提とします。同じホスト上で信頼されていないローカルコードが実行される可能性がある場合は、`gateway.auth.allowTailscale: false` を設定し、代わりにトークンまたはパスワード認証を必須にしてください。

バイパスの適用範囲:

- Control UI の WebSocket 認証サーフェスにのみ適用されます。HTTP API エンドポイント（`/v1/*`、`/tools/invoke`、`/api/channels/*` など）では Tailscale アイデンティティヘッダー認証を使用せず、常に Gateway の通常の HTTP 認証モードに従います。
- ブラウザーのデバイスアイデンティティをすでに保持している Control UI のオペレーターセッションでは、検証済みの Tailscale アイデンティティにより、ブートストラップトークンまたは QR ペアリングの往復処理を省略できます。
- デバイスアイデンティティ自体はバイパスされません。デバイス情報のないクライアントは引き続き拒否され、Node ロールの接続では通常のペアリングと認証チェックが引き続き行われます。

## 注記

- Tailscale Serve/Funnel には、`tailscale` CLI がインストール済みで、ログイン済みであることが必要です。
- `tailscale.mode: "funnel"` は、公開を避けるため、認証モードが `password` でない限り起動を拒否します。
- `gateway.tailscale.serviceName` は Serve モードにのみ適用され、`tailscale serve --service=<name>` に渡されます。値には、たとえば `svc:openclaw` のような Tailscale の `svc:<dns-label>` 形式を使用する必要があります。Tailscale では Service ホストがタグ付き Node である必要があり、Serve で公開する前に管理コンソールで Service の承認が必要になる場合があります。
- `gateway.tailscale.resetOnExit` は、シャットダウン時に `tailscale serve`/`tailscale funnel` の構成を元に戻します。
- `gateway.tailscale.preserveFunnel: true` は、外部で構成された `tailscale funnel` ルートを Gateway の再起動後も維持します。`mode: "serve"` の場合、OpenClaw は Serve を再適用する前に `tailscale funnel status` を確認し、Funnel ルートがすでに Gateway ポートを対象としている場合は再適用をスキップします。OpenClaw が管理する Funnel のパスワード専用ポリシーは変更されません。
- `gateway.bind: "tailnet"` は、tailnet IPv4 が利用可能な場合、直接の tailnet バインド（HTTPS なし、Serve/Funnel なし）と必須のローカル `127.0.0.1` を使用します。利用できない場合は、ループバックのみにフォールバックします。
- `gateway.bind: "auto"` はループバックを優先します。同一ホストからのループバックアクセスを維持しながら、ネットワーク公開範囲を tailnet に限定するには `tailnet` を使用します。
- Serve/Funnel が公開するのは **Gateway の Control UI + WS** のみです。Node は同じ Gateway WS エンドポイントを介して接続するため、Serve は Node アクセスにも使用できます。

### Tailscale の前提条件と制限

- Serve では、tailnet の HTTPS が有効になっている必要があります。有効でない場合、CLI にプロンプトが表示されます。
- Serve は Tailscale アイデンティティヘッダーを挿入しますが、Funnel は挿入しません。
- Funnel には Tailscale v1.38.3 以降、MagicDNS、HTTPS の有効化、および Funnel Node 属性が必要です。
- Funnel が TLS 経由でサポートするポートは `443`、`8443`、`10000` のみです。
- macOS 上の Funnel には、オープンソース版の Tailscale アプリが必要です。

## ブラウザー制御（リモート Gateway + ローカルブラウザー）

Gateway をあるマシンで実行し、別のマシン上のブラウザーを操作するには、ブラウザー側のマシンで **Node ホスト** を実行し、両方を同じ tailnet に接続します。Gateway はブラウザー操作を Node にプロキシするため、個別の制御サーバーや Serve URL は必要ありません。

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
