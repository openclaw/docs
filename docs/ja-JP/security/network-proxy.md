---
read_when:
    - SSRFやDNSリバインディング攻撃に対する多層防御が必要な場合
    - OpenClaw ランタイムトラフィック用の外部フォワードプロキシの設定
summary: OpenClaw ランタイムの HTTP および WebSocket トラフィックを、オペレーター管理のフィルタリングプロキシ経由でルーティングする方法
title: ネットワークプロキシ
x-i18n:
    generated_at: "2026-07-05T11:50:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd82684a17a79242891eca69c549c0bfcdd5bde40fa4e791dda7f2b62c473c89
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw は、ランタイムの HTTP および WebSocket トラフィックを、オペレーターが管理するフォワードプロキシ経由でルーティングできます。これは任意の多層防御です。中央集約された送信制御、より強力な SSRF 保護、ネットワーク境界での宛先監査可能性を提供します。プロキシは DNS 解決後、上流接続を開く直前の接続時点で宛先を評価するため、DNS リバインディング攻撃が依存する、以前のアプリケーションレベル DNS チェックと実際の外向き接続の間の差も狭めます。単一のプロキシポリシーにより、オペレーターは OpenClaw を再構築せずに、宛先ルール、ネットワーク分離、レート制限、送信許可リストを一か所で適用できます。

OpenClaw はプロキシを同梱、ダウンロード、起動、設定、認証しません。環境に合うプロキシ技術を実行し、OpenClaw は自身の HTTP および WebSocket クライアントをその経由でルーティングします。

## 設定

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

`proxy.enabled: true` を設定に残したまま、環境変数で URL を設定することもできます。

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` は `OPENCLAW_PROXY_URL` より優先されます。`proxy.enabled` が `true` でも有効な URL が解決されない場合、保護対象のコマンドは直接ネットワークアクセスにフォールバックせず、起動に失敗します。

| キー                 | 型                                   | デフォルト     | 注記                                                                                                                                 |
| -------------------- | ------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.enabled`      | boolean                              | 未設定         | ルーティングを有効化するには `true` にする必要があります。                                                                           |
| `proxy.proxyUrl`     | string                               | 未設定         | `http://` または `https://` のフォワードプロキシ URL。URL に埋め込まれた認証情報は機密として扱われ、スナップショット/ログから伏せられます。 |
| `proxy.tls.caFile`   | string                               | 未設定         | プライベート CA によって署名された `https://` プロキシエンドポイントを検証するための CA バンドル。                                  |
| `proxy.loopbackMode` | `gateway-only` \| `proxy` \| `block` | `gateway-only` | ループバックのバイパス動作を制御します。以下を参照してください。                                                                     |

管理対象の Gateway サービスでは、フォアグラウンド環境変数に依存するのではなく、再インストール後も残るように URL を設定に保存します。

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

`OPENCLAW_PROXY_URL` 環境変数のフォールバックは、フォアグラウンド実行に最適です。インストール済みサービスで使用するには、サービスの永続環境（`$OPENCLAW_STATE_DIR/.env`、デフォルトは `~/.openclaw/.env`）に入れてから再インストールし、launchd/systemd/Scheduled Tasks が読み取れるようにします。

### プライベート CA を使用する HTTPS プロキシエンドポイント

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

`proxy.tls.caFile` は、プロキシエンドポイント自体の TLS 証明書を検証します。これは宛先 MITM の信頼設定、クライアント証明書、またはプロキシの宛先ポリシーの代替ではありません。代わりに `NODE_EXTRA_CA_CERTS` を使用するのは、Node プロセス全体が起動時から追加 CA を信頼する必要がある場合（たとえば、すべての HTTPS 宛先証明書を再署名するエンタープライズ TLS インスペクションシステム）だけにしてください。この変数はプロセス全体に作用し、Node の起動前に設定する必要があるため、OpenClaw は `proxy.tls.caFile` のように実行中に適用できません。HTTPS プロキシエンドポイントの信頼には `proxy.tls.caFile` を優先してください。これはプロセス全体ではなく、管理対象のプロキシルーティングに範囲が限定されています。

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

## ルーティングの仕組み

`proxy.enabled: true` と有効な URL がある場合、保護対象のランタイムプロセス（`openclaw gateway run`、`openclaw node run`、`openclaw agent --local`）は通常の HTTP および WebSocket の送信をプロキシ経由でルーティングします。

```text
OpenClaw process
  fetch, node:http, node:https, WebSocket clients  -> operator proxy -> destination
```

内部的には、OpenClaw はプロセスレベルのルーティングランタイムとして [Proxyline](https://github.com/openclaw/proxyline) をインストールします。これは `fetch`、undici ベースのクライアント、`node:http`/`node:https`、一般的な WebSocket クライアント、ヘルパーが作成する `CONNECT` トンネルを対象にし、呼び出し元が提供した Node HTTP エージェントを置き換えるため、明示的なエージェント（`axios`、`got`、`node-fetch`、および同様の Node エージェントベースのクライアントを含む）がプロキシを黙ってバイパスすることはできません。

プロキシ URL スキームは、OpenClaw からプロキシまでのホップを表し、最終宛先までを表すものではありません。

- `http://proxy.example:3128` — プロキシへのプレーン TCP。OpenClaw は HTTPS 宛先向けの `CONNECT` を含む HTTP プロキシリクエストを送信します。
- `https://proxy.example:8443` — OpenClaw はプロキシ自体に TLS を開き（プロキシの証明書を検証し）、そのセッション内で HTTP プロキシリクエストを送信します。

宛先 TLS は、プロキシエンドポイント TLS とは独立しています。HTTPS 宛先の場合、OpenClaw は常にプロキシに `CONNECT` トンネルを要求し、そのトンネル経由で宛先 TLS を開始します。

プロキシが有効な間、OpenClaw は `no_proxy`/`NO_PROXY` をクリアします。これらのバイパスリストは宛先ベースです。`localhost` や `127.0.0.1` をそこに残すと、SSRF ターゲットがプロキシを完全に回避できてしまいます。シャットダウン時に、OpenClaw は以前のプロキシ環境を復元し、キャッシュされたルーティング状態をリセットします。

一部の Plugin は、プロセスレベルのルーティングが有効でも独自のプロキシ配線を必要とするカスタムトランスポートを所有します。Telegram の Bot API クライアントは独自の HTTP/1 undici ディスパッチャーを使用し、プロセスプロキシ環境と `OPENCLAW_PROXY_URL` フォールバックを個別に尊重します。

### Gateway ループバックモード

ローカル Gateway 制御プレーンクライアントは通常、`ws://127.0.0.1:18789` などのループバック WebSocket に接続します。`proxy.loopbackMode` は、そのトラフィックが管理対象プロキシをバイパスするかどうかを制御します。

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

| モード                   | 動作                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway-only`（デフォルト） | OpenClaw はアクティブな Gateway ループバック権限を直接接続の例外として登録するため、ローカル Gateway WebSocket トラフィックはプロキシなしで接続します。例外は正確に設定されたホスト/ポートを対象にするため、カスタムループバックポートも機能します。同梱のブラウザー Plugin は、OpenClaw が起動した管理対象ブラウザーの正確なローカル CDP 準備完了 URL と DevTools WebSocket URL に対して、同じ種類の例外を登録します。同梱の Ollama メモリエンベディングプロバイダーには、正確に設定されたホストローカルループバックエンベディング origin 向けの、より狭い保護付き直接パスがあります。 |
| `proxy`                  | ループバック例外は登録されません。Gateway と Ollama のループバックトラフィックはプロキシ経由になります。リモートプロキシは、OpenClaw ホストのループバックサービスへ戻る経路（たとえば到達可能なホスト名、IP、またはトンネル経由）を持つ必要があります。標準的なリモートプロキシは、`127.0.0.1`/`localhost` を OpenClaw ホストではなく自身に対して解決します。                                                                                                                                                                                                                |
| `block`                  | OpenClaw は、ソケットを開く前に Gateway ループバック制御プレーン接続と保護付き Ollama ループバックエンベディング接続を拒否します。                                                                                                                                                                                                                                                                                                                                                                                                                               |

Gateway 制御プレーンのバイパスは、`localhost` とリテラルなループバック IP URL に限定されます。`ws://127.0.0.1:18789`、`ws://[::1]:18789`、または `ws://localhost:18789` を使用してください。他のホスト名は通常のトラフィックと同様にルーティングされます。

### コンテナー

`openclaw --container ...` コマンドでは、OpenClaw は `OPENCLAW_PROXY_URL` が設定されている場合、コンテナー対象の子 CLI に転送します。その URL はコンテナー内から到達可能である必要があります。そこでの `127.0.0.1` はホストではなくコンテナー自体を指します。`OPENCLAW_CONTAINER_ALLOW_LOOPBACK_PROXY_URL=1` を設定して明示的にそのチェックを上書きしない限り、OpenClaw はコンテナー対象コマンドでループバックプロキシ URL を拒否します。

## 関連するプロキシ用語

- `proxy.enabled` / `proxy.proxyUrl` — ランタイム送信用の外向きフォワードプロキシルーティング。このページです。
- `gateway.auth.mode: "trusted-proxy"` — Gateway アクセス向けの内向き ID 対応リバースプロキシ認証。[Trusted proxy auth](/ja-JP/gateway/trusted-proxy-auth) を参照してください。
- `openclaw proxy` — 開発とサポート向けのローカルデバッグプロキシおよびキャプチャインスペクター。[openclaw proxy](/ja-JP/cli/proxy) を参照してください。
- `tools.web.fetch.useTrustedEnvProxy` — 厳格な DNS ピンニングとホスト名ポリシーをデフォルトで維持しながら、`web_fetch` がオペレーター制御の HTTP(S) 環境プロキシに DNS 解決を任せるためのオプトイン。[Web fetch](/ja-JP/tools/web-fetch#trusted-env-proxy) を参照してください。
- チャンネルまたはプロバイダー固有のプロキシ設定 — 1 つのトランスポート向けの所有者固有の上書き。ランタイム全体の中央送信制御には、管理対象ネットワークプロキシを優先してください。

## プロキシの検証

プロキシの宛先ポリシーが実際のセキュリティ境界です。OpenClaw は、プロキシが正しいターゲットをブロックすることを検証できません。次のように設定してください。

- OpenClaw プロセス/ホスト/コンテナー/サービスアカウントだけが到達できるように、ループバックまたは信頼済みのプライベートインターフェイスにのみバインドします。
- 宛先を自身で解決し、プレーン HTTP と HTTPS `CONNECT` トンネルの両方について、接続時点で DNS 解決後の IP に基づいてブロックします。
- ループバック、プライベート、リンクローカル、メタデータ、マルチキャスト、予約済み、ドキュメント用範囲に対する宛先ベースのバイパスを拒否します。
- DNS 解決パスを完全に信頼している場合を除き、ホスト名許可リストは避けます。
- 宛先、判断、ステータス、理由をログに記録します。リクエスト本文、認可ヘッダー、Cookie、その他のシークレットは絶対に記録しないでください。
- ポリシーをバージョン管理下に置き、変更をセキュリティ上重要なものとしてレビューします。

OpenClaw を実行する同じホスト/コンテナー/サービスアカウントから検証します。

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

プライベート CA の HTTPS プロキシエンドポイントを使用する場合:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

| フラグ                   | 目的                                                                 |
| ------------------------ | -------------------------------------------------------------------- |
| `--proxy-url <url>`      | config/env を解決する代わりに、この URL を検証する。                 |
| `--proxy-ca-file <path>` | HTTPS プロキシエンドポイント用の CA バンドル。                       |
| `--allowed-url <url>`    | 成功が期待される宛先（繰り返し指定可能）。                           |
| `--denied-url <url>`     | ブロックが期待される宛先（繰り返し指定可能）。                       |
| `--apns-reachable`       | プロキシが直接 sandbox APNs HTTP/2 プローブをトンネルできることも検証する。 |
| `--apns-authority <url>` | `--apns-reachable` でプローブする APNs authority を上書きする。       |
| `--timeout-ms <ms>`      | リクエストごとのタイムアウト。                                       |
| `--json`                 | 機械可読出力。                                                       |

`proxy.enabled` が `true` ではなく、`--proxy-url` も指定されていない場合、このコマンドは検証ではなく config の問題を報告する。config を変更する前の一回限りの事前確認には `--proxy-url` を渡す。

`--allowed-url`/`--denied-url` がない場合、デフォルトのチェックは次のとおり。`https://example.com/` は成功する必要があり、プロキシが到達してはならない一時的な loopback カナリアサーバーはブロックされる必要がある。loopback チェックは、トランスポート失敗の場合、またはカナリアの実行ごとのトークンを含まない非 2xx レスポンスの場合に成功する。トークンを欠いた 2xx レスポンス（カナリア以外からの予期しない成功）では失敗し、特に一致するトークンを含むレスポンスでは、プロキシが拒否すべき loopback 宛先を実際に転送したことを証明するため失敗する。カスタム `--denied-url` ターゲットにはそのようなカナリアトークンがないため、fail-closed になる。つまり、どの HTTP レスポンスも到達可能（失敗）として扱われ、トランスポートエラーはブロックが証明されたとは扱わず、判定不能として報告される。これは OpenClaw が、到達可能な origin をプロキシが拒否したのか、別の問題が発生したのかを確認できないためである。`--apns-reachable` は意図的に無効な provider token を送信するため、`403 InvalidProviderToken` レスポンスはトンネルが Apple に到達した証明として扱われる。このコマンドは検証失敗が 1 つでもあると `1` で終了する。プロキシ URL の認証情報は、テキスト出力と JSON 出力の両方で redact される。

```json
{
  "ok": true,
  "config": {
    "enabled": true,
    "proxyUrl": "http://127.0.0.1:3128/",
    "source": "override",
    "errors": []
  },
  "checks": [
    { "kind": "allowed", "url": "https://example.com/", "ok": true, "status": 200 },
    { "kind": "apns", "url": "https://api.sandbox.push.apple.com", "ok": true, "status": 403 }
  ]
}
```

手動の `curl` チェック（公開リクエストは成功する必要があり、loopback とメタデータのリクエストはプロキシ自体によってブロックされる必要がある。ただし `curl` だけでは、`openclaw proxy validate` の組み込みカナリアのように、プロキシによる拒否と到達不能な origin を区別できない）。

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

## 推奨されるブロック対象宛先

任意のフォワードプロキシ、ファイアウォール、または egress ポリシー向けの開始用 denylist。OpenClaw 自身の SSRF 分類器は `src/infra/net/ssrf.ts` と `packages/net-policy/src/ip.ts` にあり（`BLOCKED_HOSTNAMES`、`BLOCKED_IPV4_SPECIAL_USE_RANGES`、`BLOCKED_IPV6_SPECIAL_USE_RANGES`、RFC 2544 ベンチマークプレフィックス、NAT64/6to4/Teredo/ISATAP/IPv4-mapped 形式の embedded-IPv4 処理）、有用な参照になる。ただし OpenClaw は、これらのルールを外部プロキシに export したり強制したりしない。

| 範囲またはホスト                                                                     | ブロックする理由                                  |
| ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 ループバック                                 |
| `::1/128`                                                                            | IPv6 ループバック                                 |
| `0.0.0.0/8`, `::/128`                                                                | 未指定 / this-network アドレス                    |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC 1918 プライベートネットワーク                 |
| `169.254.0.0/16`, `fe80::/10`                                                        | 一般的なクラウドメタデータパスを含むリンクローカル |
| `169.254.169.254`, `metadata.google.internal`                                        | クラウドメタデータサービス                       |
| `100.64.0.0/10`                                                                      | キャリアグレード NAT 共有アドレス空間            |
| `198.18.0.0/15`, `2001:2::/48`                                                       | ベンチマーク範囲                                  |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | special-use およびドキュメント用範囲              |
| `224.0.0.0/4`, `ff00::/8`                                                            | マルチキャスト                                    |
| `240.0.0.0/4`                                                                        | 予約済み IPv4                                     |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 ローカル/プライベート範囲                    |
| `100::/64`, `2001:20::/28`                                                           | IPv6 discard および ORCHIDv2 範囲                 |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | embedded IPv4 を持つ NAT64 プレフィックス         |
| `2002::/16`, `2001::/32`                                                             | embedded IPv4 を持つ 6to4 および Teredo           |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-compatible および IPv4-mapped IPv6           |

クラウドプロバイダーまたはネットワークプラットフォームが文書化している追加のメタデータホストや予約済み範囲があれば追加する。

## 制限

| サーフェス                                                   | 管理プロキシの状態                                                                                                                                       |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, 一般的な WebSocket クライアント | 構成されている場合、管理プロキシフック経由でルーティングされる。                                                                                         |
| APNs 直接 HTTP/2                                             | APNs 管理 `CONNECT` ヘルパー経由でルーティングされる。                                                                                                   |
| Gateway control-plane loopback                               | 正確に構成された local loopback Gateway URL に対してのみ直接接続する。                                                                                    |
| デバッグプロキシの upstream 転送                             | ローカル診断向けに明示的に有効化されていない限り、管理プロキシモードがアクティブな間は無効化される。                                                     |
| IRC                                                          | Raw TCP/TLS。管理 HTTP プロキシモードではプロキシされない。デプロイで全 egress をフォワードプロキシ経由にする必要がある場合は、`channels.irc.enabled: false` を設定する。 |
| その他の raw `net`、`tls`、または `http2` クライアント呼び出し | landing 前に raw socket guard によって分類される必要がある。                                                                                              |

- これは JavaScript HTTP/WebSocket クライアントに対するプロセスレベルのカバレッジであり、OS レベルのネットワークサンドボックスではない。
- Raw `net`、`tls`、`http2` ソケット、ネイティブアドオン、および OpenClaw 以外の child process は、プロキシ環境変数を継承し尊重しない限り、Node レベルのルーティングをバイパスする可能性がある。fork された OpenClaw child CLI は、管理プロキシ URL と `proxy.loopbackMode` 状態を継承する。
- ユーザーのローカル WebUI とローカルモデルサーバーは、一般的なローカルネットワークバイパスの対象ではない。必要に応じて operator プロキシポリシーで allowlist に追加する。例外は、バンドルされた Ollama メモリ embedding provider の guarded direct path であり、構成された `baseUrl` からの正確な host-local loopback origin にスコープされる。LAN、tailnet、プライベートネットワーク、および公開 Ollama ホストは引き続き管理プロキシを使用する。
- ローカルデバッグプロキシの直接 upstream 転送（プロキシリクエストと `CONNECT` トンネル用）は、管理プロキシモードがアクティブな間はデフォルトで無効化される。承認済みのローカル診断にのみ有効化する。
- OpenClaw はプロキシポリシーを検査、テスト、または認証しない。プロキシポリシーの変更は、セキュリティ上重要な運用変更として扱う。
