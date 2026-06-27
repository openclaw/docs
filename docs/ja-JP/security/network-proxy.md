---
read_when:
    - SSRF と DNS リバインディング攻撃に対する多層防御が必要な場合
    - OpenClaw ランタイムトラフィック用の外部フォワードプロキシの設定
summary: オペレーター管理のフィルタリングプロキシ経由で OpenClaw ランタイムの HTTP および WebSocket トラフィックをルーティングする方法
title: ネットワークプロキシ
x-i18n:
    generated_at: "2026-06-27T13:04:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3fc68d950037922ba3dc983c94a71bac3374750a02ef25f2c046cf782410be68
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw は、ランタイムの HTTP および WebSocket トラフィックを、オペレーター管理のフォワードプロキシ経由でルーティングできます。これは、中央集約されたエグレス制御、より強い SSRF 保護、より優れたネットワーク監査性を必要とするデプロイ向けの、任意の多層防御です。

OpenClaw はプロキシを同梱、ダウンロード、起動、設定、認証しません。環境に合うプロキシ技術を自分で運用し、OpenClaw は通常のプロセスローカル HTTP および WebSocket クライアントをそのプロキシ経由でルーティングします。

## プロキシを使う理由

プロキシは、送信 HTTP および WebSocket トラフィックに対する単一のネットワーク制御点をオペレーターに提供します。これは SSRF 強化以外でも有用です。

- 中央ポリシー: すべてのアプリケーション HTTP 呼び出し箇所がネットワークルールを正しく扱うことに頼る代わりに、単一のエグレスポリシーを維持します。
- 接続時チェック: DNS 解決後、プロキシがアップストリーム接続を開く直前に宛先を評価します。
- DNS リバインディング防御: アプリケーションレベルの DNS チェックと実際の送信接続の間のギャップを減らします。
- より広い JavaScript カバレッジ: 通常の `fetch`、`node:http`、`node:https`、WebSocket、axios、got、node-fetch、および類似クライアントを同じ経路でルーティングします。
- 監査性: エグレス境界で許可および拒否された宛先をログに記録します。
- 運用制御: OpenClaw を再ビルドせずに、宛先ルール、ネットワーク分離、レート制限、または送信許可リストを適用します。

プロキシルーティングは、通常の HTTP および WebSocket エグレスに対するプロセスレベルのガードレールです。サポート対象の JavaScript HTTP クライアントを自分たちのフィルタリングプロキシ経由でルーティングするフェイルクローズの経路をオペレーターに提供しますが、OS レベルのネットワークサンドボックスではなく、OpenClaw がプロキシの宛先ポリシーを認証するものでもありません。

## OpenClaw がトラフィックをルーティングする仕組み

`proxy.enabled=true` かつプロキシ URL が設定されている場合、`openclaw gateway run`、`openclaw node run`、`openclaw agent --local` などの保護されたランタイムプロセスは、通常の HTTP および WebSocket エグレスを設定済みプロキシ経由でルーティングします。

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

公開契約はルーティング動作であり、それを実装するために使われる内部 Node フックではありません。OpenClaw Gateway コントロールプレーン WebSocket クライアントは、Gateway URL が `localhost` または `127.0.0.1` や `[::1]` のようなリテラルのループバック IP を使う場合、local loopback Gateway RPC トラフィック用に狭い直接経路を使います。そのコントロールプレーン経路は、オペレータープロキシがループバック宛先をブロックしている場合でも、ループバック Gateway に到達できる必要があります。通常のランタイム HTTP および WebSocket リクエストは、引き続き設定済みプロキシを使います。

内部的には、OpenClaw はこの機能のプロセスレベルルーティングランタイムとして Proxyline をインストールします。Proxyline は、`fetch`、undici ベースのクライアント、Node コアの `node:http` / `node:https` 呼び出し元、一般的な WebSocket クライアント、およびヘルパー作成の CONNECT トンネルをカバーします。管理プロキシモードは、呼び出し元が指定した Node HTTP エージェントを置き換えるため、明示的なエージェントが誤ってオペレータープロキシを迂回することはありません。

一部の Plugin は、プロセスレベルルーティングが存在する場合でも明示的なプロキシ配線を必要とするカスタムトランスポートを所有します。たとえば、Telegram の Bot API トランスポートは独自の HTTP/1 undici ディスパッチャーを使うため、その所有者固有のトランスポート経路で、プロセスのプロキシ環境変数に加えて管理された `OPENCLAW_PROXY_URL` フォールバックを尊重します。

プロキシ URL 自体は `http://` または `https://` のどちらも使用できます。これらのスキームは、OpenClaw からプロキシエンドポイントへの接続を表します。

- `http://proxy.example:3128`: OpenClaw はフォワードプロキシにプレーン TCP 接続を開き、HTTPS 宛先用の `CONNECT` を含む HTTP プロキシリクエストを送信します。
- `https://proxy.example:8443`: OpenClaw はプロキシエンドポイントに TLS を開き、プロキシ証明書を検証してから、その TLS セッション内で HTTP プロキシリクエストを送信します。

宛先 HTTPS は、プロキシエンドポイント TLS とは別です。HTTPS 宛先の場合でも、OpenClaw はプロキシに HTTP `CONNECT` トンネルを要求し、そのトンネル経由で宛先 TLS を開始します。

プロキシが有効な間、OpenClaw は `no_proxy` と `NO_PROXY` をクリアします。これらの迂回リストは宛先ベースであるため、`localhost` や `127.0.0.1` を残しておくと、高リスクの SSRF ターゲットがフィルタリングプロキシをスキップできてしまいます。

シャットダウン時、OpenClaw は以前のプロキシ環境を復元し、キャッシュされたプロセスルーティング状態をリセットします。

## 関連するプロキシ用語

- `proxy.enabled` / `proxy.proxyUrl`: OpenClaw ランタイムエグレス向けの送信フォワードプロキシルーティング。このページではこの機能を説明します。
- `gateway.auth.mode: "trusted-proxy"`: Gateway アクセス向けの受信アイデンティティ対応リバースプロキシ認証。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照してください。
- `openclaw proxy`: 開発およびサポート向けのローカルデバッグプロキシとキャプチャインスペクター。[openclaw proxy](/ja-JP/cli/proxy)を参照してください。
- `tools.web.fetch.useTrustedEnvProxy`: `web_fetch` が、デフォルトの厳密な DNS ピンニングとホスト名ポリシーを維持しながら、オペレーター制御の HTTP(S) 環境プロキシに DNS 解決を任せるためのオプトイン。[Web fetch](/ja-JP/tools/web-fetch#trusted-env-proxy)を参照してください。
- チャンネルまたはプロバイダー固有のプロキシ設定: 特定のトランスポート向けの所有者固有オーバーライド。目的がランタイム全体の中央集約されたエグレス制御である場合は、管理ネットワークプロキシを優先してください。

## 設定

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

プライベートプロキシ CA を持つ HTTPS プロキシエンドポイントの場合:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

config で `proxy.enabled=true` を維持しながら、環境経由で URL を指定することもできます。

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` は `OPENCLAW_PROXY_URL` より優先されます。

### Gateway ループバックモード

ローカル Gateway コントロールプレーンクライアントは通常、`ws://127.0.0.1:18789` のようなループバック WebSocket に接続します。管理プロキシが有効な間に、ループバックの管理プロキシ例外がどのように動作するかを選ぶには、`proxy.loopbackMode` を使います。

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (デフォルト): OpenClaw は Gateway ループバック権限を Proxyline の管理バイパスポリシーに登録し、ローカル Gateway WebSocket トラフィックが直接接続できるようにします。アクティブな Gateway URL のホストとポートが登録されるため、カスタムループバック Gateway ポートも機能します。同梱ブラウザー Plugin は、OpenClaw が起動した管理ブラウザーについて、正確なローカル CDP 準備完了エンドポイントと DevTools WebSocket エンドポイントも登録できます。また、同梱の Ollama メモリー埋め込みプロバイダーは、正確に設定されたホストローカルのループバック埋め込みオリジンに対して、より狭い保護付き直接経路を使えます。
- `proxy`: OpenClaw は Gateway または Ollama ループバックバイパスを登録しないため、そのループバックトラフィックは管理プロキシ経由で送信されます。プロキシがリモートの場合、OpenClaw ホストのループバックサービスに対する特別なルーティング、たとえばプロキシから到達可能なホスト名、IP、またはトンネルへのマッピングを提供する必要があります。標準的なリモートプロキシは、`127.0.0.1` と `localhost` を OpenClaw ホストからではなく、プロキシホストから解決します。
- `block`: OpenClaw は、ソケットを開く前に Gateway ループバックコントロールプレーン接続と、保護された Ollama ホストローカル埋め込みループバック接続を拒否します。

`enabled=true` だが有効なプロキシ URL が設定されていない場合、保護されたコマンドは直接ネットワークアクセスにフォールバックせず、起動に失敗します。

`openclaw gateway start` で開始される管理 Gateway サービスでは、URL を config に保存することを推奨します。

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

環境フォールバックはフォアグラウンド実行に最適です。インストール済みサービスで使う場合は、`OPENCLAW_PROXY_URL` を `$OPENCLAW_STATE_DIR/.env` や `~/.openclaw/.env` などのサービスの永続環境に置き、その値で launchd、systemd、または Scheduled Tasks が Gateway を開始するようにサービスを再インストールしてください。

`openclaw --container ...` コマンドでは、`OPENCLAW_PROXY_URL` が設定されている場合、OpenClaw はそれをコンテナ対象の子 CLI に転送します。URL はコンテナ内から到達可能でなければなりません。`127.0.0.1` はホストではなくコンテナ自身を指します。明示的に安全チェックをオーバーライドしない限り、OpenClaw はコンテナ対象コマンドでループバックプロキシ URL を拒否します。

## プロキシ要件

プロキシポリシーがセキュリティ境界です。OpenClaw は、プロキシが正しいターゲットをブロックしていることを検証できません。

プロキシは次のように設定してください。

- ループバックまたは信頼されたプライベートインターフェイスのみにバインドします。
- OpenClaw プロセス、ホスト、コンテナ、またはサービスアカウントのみが使用できるようにアクセスを制限します。
- 宛先を自身で解決し、DNS 解決後に宛先 IP をブロックします。
- プレーン HTTP リクエストと HTTPS `CONNECT` トンネルの両方について、接続時にポリシーを適用します。
- ループバック、プライベート、リンクローカル、メタデータ、マルチキャスト、予約済み、またはドキュメント用範囲に対する宛先ベースの迂回を拒否します。
- DNS 解決経路を完全に信頼している場合を除き、ホスト名許可リストは避けます。
- リクエスト本文、認可ヘッダー、Cookie、その他のシークレットをログに記録せずに、宛先、判断、ステータス、理由をログに記録します。
- プロキシポリシーをバージョン管理下に置き、セキュリティ上重要な設定と同様に変更をレビューします。

## 推奨ブロック宛先

任意のフォワードプロキシ、ファイアウォール、またはエグレスポリシーの開始点として、この拒否リストを使ってください。

OpenClaw のアプリケーションレベル分類ロジックは `src/infra/net/ssrf.ts` と `packages/net-policy/src/ip.ts` にあります。関連するパリティフックは `BLOCKED_HOSTNAMES`、`BLOCKED_IPV4_SPECIAL_USE_RANGES`、`BLOCKED_IPV6_SPECIAL_USE_RANGES`、`RFC2544_BENCHMARK_PREFIX`、および NAT64、6to4、Teredo、ISATAP、IPv4 マップ形式向けの埋め込み IPv4 センチネル処理です。これらのファイルは外部プロキシポリシーを保守する際の有用な参照ですが、OpenClaw がそれらのルールをプロキシに自動的にエクスポートしたり適用したりすることはありません。

| 範囲またはホスト                                                                     | ブロックする理由                                     |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 ループバック                                    |
| `::1/128`                                                                            | IPv6 ループバック                                    |
| `0.0.0.0/8`, `::/128`                                                                | 未指定アドレスおよびこのネットワークのアドレス       |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918 プライベートネットワーク                     |
| `169.254.0.0/16`, `fe80::/10`                                                        | リンクローカルアドレスと一般的なクラウドメタデータパス |
| `169.254.169.254`, `metadata.google.internal`                                        | クラウドメタデータサービス                           |
| `100.64.0.0/10`                                                                      | キャリアグレード NAT の共有アドレス空間              |
| `198.18.0.0/15`, `2001:2::/48`                                                       | ベンチマーク用範囲                                   |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | 特殊用途およびドキュメント用範囲                     |
| `224.0.0.0/4`, `ff00::/8`                                                            | マルチキャスト                                       |
| `240.0.0.0/4`                                                                        | 予約済み IPv4                                        |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 ローカル/プライベート範囲                       |
| `100::/64`, `2001:20::/28`                                                           | IPv6 破棄および ORCHIDv2 範囲                        |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | 埋め込み IPv4 を含む NAT64 プレフィックス            |
| `2002::/16`, `2001::/32`                                                             | 埋め込み IPv4 を含む 6to4 と Teredo                  |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4 互換および IPv4 マップ IPv6                     |

クラウドプロバイダーまたはネットワークプラットフォームが追加のメタデータホストや予約済み範囲を文書化している場合は、それらも追加してください。

## 検証

OpenClaw を実行する同じホスト、コンテナ、またはサービスアカウントからプロキシを検証します。

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

プライベート CA によって署名された HTTPS プロキシエンドポイントの場合:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

デフォルトでは、カスタム宛先が指定されていない場合、コマンドは `https://example.com/` が成功することを確認し、プロキシが到達してはならない一時的なループバックカナリアを開始します。デフォルトの拒否チェックは、プロキシが 2xx 以外の拒否レスポンスを返すか、トランスポート障害でカナリアをブロックした場合に成功します。成功レスポンスがカナリアに到達した場合は失敗します。プロキシが有効化および構成されていない場合、検証は構成の問題を報告します。構成を変更する前の一度限りの事前確認には `--proxy-url` を使用してください。デプロイ固有の期待値をテストするには `--allowed-url` と `--denied-url` を使用してください。直接 APNs HTTP/2 配信がプロキシ経由で CONNECT トンネルを開き、サンドボックス APNs レスポンスを受信できることも検証するには `--apns-reachable` を追加してください。このプローブは意図的に無効なプロバイダートークンを使用するため、`403 InvalidProviderToken` が期待され、到達可能とみなされます。カスタム拒否宛先はフェイルクローズです。HTTP レスポンスがある場合は宛先がプロキシ経由で到達可能だったことを意味し、トランスポートエラーは OpenClaw が到達可能なオリジンをプロキシがブロックしたことを証明できないため、不確定として報告されます。検証に失敗すると、コマンドはコード 1 で終了します。

自動化には `--json` を使用します。JSON 出力には、全体の結果、有効なプロキシ構成ソース、構成エラー、各宛先チェックが含まれます。プロキシ URL の認証情報は、テキスト出力と JSON 出力で秘匿されます。

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
    {
      "kind": "allowed",
      "url": "https://example.com/",
      "ok": true,
      "status": 200
    },
    {
      "kind": "apns",
      "url": "https://api.sandbox.push.apple.com",
      "ok": true,
      "status": 403
    }
  ]
}
```

`curl` で手動検証することもできます。

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

公開リクエストは成功するはずです。ループバックおよびメタデータリクエストはプロキシによってブロックされるはずです。`openclaw proxy validate` では、組み込みのループバックカナリアによって、プロキシ拒否と到達可能なオリジンを区別できます。カスタム `--denied-url` チェックにはそのカナリアがないため、プロキシがデプロイ固有の拒否シグナルを公開し、それを別途検証できる場合を除き、HTTP レスポンスと曖昧なトランスポート障害の両方を検証失敗として扱ってください。

## プロキシ CA 信頼

プロキシエンドポイント自体がプライベート CA によって署名された証明書を使用する場合は、管理対象の `proxy.tls.caFile` を使用します。

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

その CA は、プロキシエンドポイントの TLS 検証に使用されます。これは宛先 MITM の信頼設定、クライアント証明書、またはプロキシの宛先ポリシーの代替ではありません。

プロセス内のすべての HTTPS クライアントについて宛先証明書を再署名するエンタープライズ TLS 検査システムなど、Node プロセス全体がプロセス起動時から追加 CA を信頼する必要がある場合にのみ、`NODE_EXTRA_CA_CERTS` を使用してください。`NODE_EXTRA_CA_CERTS` はプロセス全体に適用され、Node が起動する前に存在している必要があります。HTTPS プロキシエンドポイントの信頼には、管理対象プロキシルーティングにスコープが限定されるため、`proxy.tls.caFile` を優先してください。

次に OpenClaw プロキシルーティングを有効にします。

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

または次を設定します。

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

## 制限

- プロキシはプロセスローカルの JavaScript HTTP および WebSocket クライアントのカバレッジを改善しますが、OS レベルのネットワークサンドボックスではありません。
- Gateway ループバック制御プレーントラフィックは、デフォルトで `proxy.loopbackMode: "gateway-only"` による直接ローカルバイパスになります。OpenClaw は、アクティブな Gateway ループバック権限を Proxyline の管理対象バイパスポリシーに登録することで、そのバイパスを実装します。オペレーターは `proxy.loopbackMode: "proxy"` を設定して Gateway ループバックトラフィックを管理対象プロキシ経由で送信するか、`proxy.loopbackMode: "block"` を設定してループバック Gateway 接続を拒否できます。リモートプロキシに関する注意事項については、[Gateway ループバックモード](#gateway-loopback-mode)を参照してください。
- 生の `net`、`tls`、`http2` ソケット、ネイティブアドオン、OpenClaw 以外の子プロセスは、プロキシ環境変数を継承して尊重しない限り、Node レベルのプロキシルーティングをバイパスする可能性があります。フォークされた OpenClaw 子 CLI は、管理対象プロキシ URL と `proxy.loopbackMode` の状態を継承します。
- IRC は、オペレーター管理のフォワードプロキシルーティングの外側にある生の TCP/TLS チャネルです。そのフォワードプロキシ経由ですべての送信トラフィックを通す必要があるデプロイでは、直接 IRC 送信が明示的に承認されていない限り、`channels.irc.enabled=false` を設定してください。
- ローカルデバッグプロキシは診断用ツールであり、プロキシリクエストおよび CONNECT トンネルの直接アップストリーム転送は、管理対象プロキシモードが有効な間、デフォルトで無効です。承認済みのローカル診断に限り、直接転送を有効にしてください。
- ユーザーのローカル WebUI とローカルモデルサーバーは、必要に応じてオペレーターのプロキシポリシーで許可リストに追加する必要があります。OpenClaw は、それら向けの一般的なローカルネットワークバイパスを公開しません。バンドルされた Ollama メモリ埋め込みプロバイダーはより限定的です。構成済みの `baseUrl` から導出された正確なホストローカルループバック埋め込みオリジンに限り、ガード付きの直接パスを使用できます。これにより、管理対象プロキシがホストループバックに到達できない場合でもホストローカル埋め込みが動作し続けます。LAN、tailnet、プライベートネットワーク、および公開 Ollama 埋め込みホストは引き続き管理対象プロキシパスを使用します。`proxy.loopbackMode: "proxy"` はこの Ollama ループバックトラフィックを管理対象プロキシ経由で送信し、`proxy.loopbackMode: "block"` は接続を開く前に拒否します。
- Gateway 制御プレーンのプロキシバイパスは、意図的に `localhost` とリテラルのループバック IP URL に限定されています。ローカルの直接 Gateway 制御プレーン接続には `ws://127.0.0.1:18789`、`ws://[::1]:18789`、または `ws://localhost:18789` を使用してください。他のホスト名は通常のホスト名ベースのトラフィックと同様にルーティングされます。
- OpenClaw はプロキシポリシーを検査、テスト、または認証しません。
- プロキシポリシーの変更は、セキュリティに影響する運用変更として扱ってください。

| サーフェス                                                   | 管理対象プロキシの状態                                                                           |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, common WebSocket clients | 構成されている場合、管理対象プロキシフック経由でルーティングされます。                            |
| APNs direct HTTP/2                                           | APNs 管理対象 CONNECT ヘルパー経由でルーティングされます。                                        |
| Gateway control-plane loopback                               | 構成済みのローカルループバック Gateway URL に対してのみ直接接続します。                           |
| Debug proxy upstream forwarding                              | ローカル診断向けに明示的に有効化されていない限り、管理対象プロキシモードが有効な間は無効です。   |
| IRC                                                          | 生の TCP/TLS です。管理対象 HTTP プロキシモードではプロキシされません。直接 IRC 送信が承認されていない限り無効にしてください。 |
| Other raw `net`, `tls`, or `http2` client calls              | land する前に、生ソケットガードによって分類する必要があります。                                   |
