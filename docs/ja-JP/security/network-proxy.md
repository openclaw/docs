---
read_when:
    - SSRF および DNS リバインディング攻撃に対する多層防御が必要な場合
    - OpenClaw ランタイムトラフィック用の外部フォワードプロキシの設定
summary: OpenClaw ランタイムの HTTP と WebSocket トラフィックをオペレーター管理のフィルタリングプロキシ経由でルーティングする方法
title: ネットワークプロキシ
x-i18n:
    generated_at: "2026-05-06T05:18:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: d733c690b5f86ef62fe7a35d38fbfcd07910970bca12ca6f74fdb26c8ec4557b
    source_path: security/network-proxy.md
    workflow: 16
---

# ネットワークプロキシ

OpenClaw は、ランタイムの HTTP および WebSocket トラフィックを、オペレーター管理のフォワードプロキシ経由でルーティングできます。これは、中央集約された外向き通信制御、より強い SSRF 保護、ネットワーク監査性の向上を求めるデプロイ向けの、任意の多層防御です。

OpenClaw はプロキシを同梱、ダウンロード、起動、設定、認定しません。環境に合うプロキシ技術を運用し、OpenClaw は通常のプロセスローカルな HTTP および WebSocket クライアントをそこへルーティングします。

## プロキシを使用する理由

プロキシは、送信 HTTP および WebSocket トラフィックに対する単一のネットワーク制御点をオペレーターに提供します。これは SSRF 強化以外でも有用です。

- 中央ポリシー: すべてのアプリケーション HTTP 呼び出し箇所がネットワークルールを正しく扱うことに依存せず、単一の外向き通信ポリシーを維持できます。
- 接続時チェック: DNS 解決後、プロキシが上流接続を開く直前に宛先を評価できます。
- DNS リバインディング防御: アプリケーションレベルの DNS チェックと実際の送信接続との間の隙間を減らします。
- より広い JavaScript カバレッジ: 通常の `fetch`、`node:http`、`node:https`、WebSocket、axios、got、node-fetch、および類似クライアントを同じ経路にルーティングします。
- 監査性: 外向き通信境界で、許可および拒否された宛先をログに記録できます。
- 運用制御: OpenClaw を再ビルドせずに、宛先ルール、ネットワーク分離、レート制限、または送信許可リストを適用できます。

プロキシルーティングは、通常の HTTP および WebSocket の外向き通信に対するプロセスレベルのガードレールです。サポート対象の JavaScript HTTP クライアントを独自のフィルタリングプロキシ経由でルーティングする fail-closed な経路をオペレーターに提供しますが、OS レベルのネットワークサンドボックスではなく、OpenClaw がプロキシの宛先ポリシーを認定するものでもありません。

## OpenClaw がトラフィックをルーティングする仕組み

`proxy.enabled=true` かつプロキシ URL が設定されている場合、`openclaw gateway run`、`openclaw node run`、`openclaw agent --local` などの保護対象ランタイムプロセスは、通常の HTTP および WebSocket の外向き通信を設定済みプロキシ経由でルーティングします。

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

公開コントラクトはルーティング動作であり、それを実装するために使われる内部の Node フックではありません。OpenClaw Gateway のコントロールプレーン WebSocket クライアントは、Gateway URL が `localhost` または `127.0.0.1` や `[::1]` のようなリテラルのループバック IP を使う場合、local loopback Gateway RPC トラフィックに対して狭い直接経路を使用します。このコントロールプレーン経路は、オペレーターのプロキシがループバック宛先をブロックしている場合でも、ループバック Gateway に到達できる必要があります。通常のランタイム HTTP および WebSocket リクエストは、引き続き設定済みプロキシを使用します。

内部的には、OpenClaw はこの機能に 2 つのプロセスレベルのルーティングフックを使用します。

- Undici ディスパッチャールーティングは、`fetch`、undici ベースのクライアント、および独自の undici ディスパッチャーを提供するトランスポートを対象にします。
- `global-agent` ルーティングは、多くの `http.request`、`https.request`、`http.get`、`https.get` の上に構築されたライブラリを含む、Node コアの `node:http` および `node:https` 呼び出し元を対象にします。管理プロキシモードでは、そのグローバルエージェントを強制するため、明示的な Node HTTP エージェントが誤ってオペレータープロキシをバイパスすることはありません。

一部の plugins は、プロセスレベルのルーティングが存在する場合でも明示的なプロキシ配線が必要なカスタムトランスポートを所有しています。たとえば、Telegram の Bot API トランスポートは独自の HTTP/1 undici ディスパッチャーを使用するため、そのオーナー固有のトランスポート経路では、プロセスプロキシ環境変数と管理対象の `OPENCLAW_PROXY_URL` フォールバックを尊重します。

プロキシ URL 自体は `http://` を使用する必要があります。HTTPS 宛先も HTTP `CONNECT` によってプロキシ経由で引き続きサポートされます。これは、OpenClaw が `http://127.0.0.1:3128` のようなプレーン HTTP フォワードプロキシリスナーを期待することだけを意味します。

プロキシが有効な間、OpenClaw は `no_proxy`、`NO_PROXY`、`GLOBAL_AGENT_NO_PROXY` をクリアします。これらのバイパスリストは宛先ベースであるため、そこに `localhost` や `127.0.0.1` を残すと、高リスクの SSRF ターゲットがフィルタリングプロキシをスキップできてしまいます。

シャットダウン時、OpenClaw は以前のプロキシ環境を復元し、キャッシュされたプロセスルーティング状態をリセットします。

## 関連するプロキシ用語

- `proxy.enabled` / `proxy.proxyUrl`: OpenClaw ランタイムの外向き通信向けの送信フォワードプロキシルーティング。このページではこの機能を説明します。
- `gateway.auth.mode: "trusted-proxy"`: Gateway アクセス向けの、受信側の ID 認識リバースプロキシ認証。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照してください。
- `openclaw proxy`: 開発およびサポート向けのローカルデバッグプロキシとキャプチャインスペクター。[openclaw proxy](/ja-JP/cli/proxy)を参照してください。
- `tools.web.fetch.useTrustedEnvProxy`: デフォルトの厳格な DNS ピン留めとホスト名ポリシーを維持しながら、`web_fetch` がオペレーター制御の HTTP(S) 環境プロキシに DNS を解決させるためのオプトイン。[Web fetch](/ja-JP/tools/web-fetch#trusted-env-proxy)を参照してください。
- チャンネルまたはプロバイダー固有のプロキシ設定: 特定トランスポート向けのオーナー固有の上書き。目的がランタイム全体の中央外向き通信制御である場合は、管理対象ネットワークプロキシを優先してください。

## 設定

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

設定で `proxy.enabled=true` を維持しつつ、環境経由で URL を指定することもできます。

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` は `OPENCLAW_PROXY_URL` より優先されます。

### Gateway ループバックモード

ローカル Gateway コントロールプレーンクライアントは通常、`ws://127.0.0.1:18789` のようなループバック WebSocket に接続します。管理プロキシが有効な間にそのトラフィックをどう扱うかを選ぶには、`proxy.loopbackMode` を使用します。

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only`（デフォルト）: OpenClaw は Gateway ループバックオーソリティをアクティブな `global-agent` `NO_PROXY` コントローラーに登録するため、ローカル Gateway WebSocket トラフィックは直接接続できます。アクティブな Gateway URL のホストとポートが登録されるため、カスタムのループバック Gateway ポートも機能します。
- `proxy`: OpenClaw は Gateway ループバック `NO_PROXY` オーソリティを登録しないため、ローカル Gateway トラフィックは管理プロキシ経由で送信されます。プロキシがリモートの場合、OpenClaw ホストのループバックサービスに対して、プロキシから到達可能なホスト名、IP、またはトンネルへマッピングするなどの特別なルーティングを提供する必要があります。標準的なリモートプロキシは、`127.0.0.1` と `localhost` を OpenClaw ホストからではなく、プロキシホストから解決します。
- `block`: OpenClaw はソケットを開く前に、ループバック Gateway コントロールプレーン接続を拒否します。

`enabled=true` だが有効なプロキシ URL が設定されていない場合、保護対象コマンドは直接ネットワークアクセスへフォールバックせず、起動に失敗します。

`openclaw gateway start` で開始される管理対象 Gateway サービスでは、URL を設定に保存することを推奨します。

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

環境フォールバックはフォアグラウンド実行に最適です。インストール済みサービスで使用する場合は、`OPENCLAW_PROXY_URL` を `$OPENCLAW_STATE_DIR/.env` や `~/.openclaw/.env` などのサービスの永続環境に入れてから、サービスを再インストールし、launchd、systemd、または Scheduled Tasks がその値で Gateway を開始するようにしてください。

`openclaw --container ...` コマンドでは、`OPENCLAW_PROXY_URL` が設定されている場合、OpenClaw はそれをコンテナー対象の子 CLI に転送します。URL はコンテナー内から到達可能である必要があります。`127.0.0.1` はホストではなくコンテナー自体を指します。OpenClaw は、その安全性チェックを明示的に上書きしない限り、コンテナー対象コマンドのループバックプロキシ URL を拒否します。

## プロキシ要件

プロキシポリシーがセキュリティ境界です。OpenClaw は、プロキシが正しいターゲットをブロックしているか検証できません。

プロキシを次のように設定してください。

- ループバックまたは信頼済みのプライベートインターフェイスのみにバインドする。
- OpenClaw プロセス、ホスト、コンテナー、またはサービスアカウントのみが使用できるようアクセスを制限する。
- 宛先を自身で解決し、DNS 解決後に宛先 IP をブロックする。
- プレーン HTTP リクエストと HTTPS `CONNECT` トンネルの両方について、接続時にポリシーを適用する。
- ループバック、プライベート、リンクローカル、メタデータ、マルチキャスト、予約済み、またはドキュメント用範囲に対する宛先ベースのバイパスを拒否する。
- DNS 解決経路を完全に信頼していない限り、ホスト名許可リストは避ける。
- リクエスト本文、認可ヘッダー、Cookie、その他のシークレットを記録せずに、宛先、判断、ステータス、理由をログに記録する。
- プロキシポリシーをバージョン管理下に置き、セキュリティ上重要な設定と同じように変更をレビューする。

## 推奨ブロック宛先

任意のフォワードプロキシ、ファイアウォール、または外向き通信ポリシーの出発点として、この拒否リストを使用してください。

OpenClaw のアプリケーションレベルの分類ロジックは `src/infra/net/ssrf.ts` と `src/shared/net/ip.ts` にあります。関連するパリティフックは `BLOCKED_HOSTNAMES`、`BLOCKED_IPV4_SPECIAL_USE_RANGES`、`BLOCKED_IPV6_SPECIAL_USE_RANGES`、`RFC2544_BENCHMARK_PREFIX`、および NAT64、6to4、Teredo、ISATAP、IPv4 マップ形式に対する埋め込み IPv4 センチネル処理です。これらのファイルは外部プロキシポリシーを保守する際の有用な参照ですが、OpenClaw がこれらのルールをプロキシへ自動的にエクスポートまたは適用することはありません。

| 範囲またはホスト                                                                     | ブロックする理由                                     |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 ループバック                                    |
| `::1/128`                                                                            | IPv6 ループバック                                    |
| `0.0.0.0/8`, `::/128`                                                                | 未指定およびこのネットワークのアドレス               |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918 プライベートネットワーク                     |
| `169.254.0.0/16`, `fe80::/10`                                                        | リンクローカルアドレスと一般的なクラウドメタデータ経路 |
| `169.254.169.254`, `metadata.google.internal`                                        | クラウドメタデータサービス                           |
| `100.64.0.0/10`                                                                      | キャリアグレード NAT 共有アドレス空間                |
| `198.18.0.0/15`, `2001:2::/48`                                                       | ベンチマーク範囲                                     |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | 特殊用途およびドキュメント用範囲                     |
| `224.0.0.0/4`, `ff00::/8`                                                            | マルチキャスト                                       |
| `240.0.0.0/4`                                                                        | 予約済み IPv4                                        |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 ローカル/プライベート範囲                       |
| `100::/64`, `2001:20::/28`                                                           | IPv6 破棄および ORCHIDv2 範囲                        |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | 埋め込み IPv4 を含む NAT64 プレフィックス            |
| `2002::/16`, `2001::/32`                                                             | 埋め込み IPv4 を含む 6to4 および Teredo              |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4 互換および IPv4 マップ IPv6                     |

クラウドプロバイダーまたはネットワークプラットフォームが追加のメタデータホストや予約済み範囲を文書化している場合は、それらも追加してください。

## 検証

OpenClaw を実行するのと同じホスト、コンテナー、またはサービスアカウントからプロキシを検証します。

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

デフォルトでは、カスタム宛先が指定されていない場合、このコマンドは `https://example.com/` が成功することを確認し、プロキシが到達してはならない一時的なループバックカナリアを起動します。デフォルトの拒否チェックは、プロキシが 2xx 以外の拒否レスポンスを返すか、トランスポート障害でカナリアをブロックした場合に合格します。成功レスポンスがカナリアに到達した場合は失敗します。プロキシが有効化および設定されていない場合、検証は設定の問題を報告します。設定を変更する前の一回限りのプリフライトには `--proxy-url` を使用してください。デプロイ固有の期待値をテストするには `--allowed-url` と `--denied-url` を使用してください。プロキシ経由で直接 APNs HTTP/2 配信が CONNECT トンネルを開き、サンドボックス APNs レスポンスを受信できることも検証するには、`--apns-reachable` を追加してください。このプローブは意図的に無効なプロバイダートークンを使用するため、`403 InvalidProviderToken` が期待され、到達可能として扱われます。カスタムの拒否宛先はフェイルクローズです。HTTP レスポンスがある場合は宛先にプロキシ経由で到達できたことを意味し、トランスポートエラーはすべて判定不能として報告されます。これは、OpenClaw がプロキシによって到達可能なオリジンがブロックされたことを証明できないためです。検証が失敗すると、このコマンドはコード 1 で終了します。

自動化には `--json` を使用してください。JSON 出力には、全体の結果、有効なプロキシ設定のソース、設定エラー、各宛先チェックが含まれます。プロキシ URL の認証情報は、テキスト出力と JSON 出力で秘匿されます。

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

`curl` を使用して手動で検証することもできます。

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

公開リクエストは成功するはずです。ループバックとメタデータのリクエストはプロキシによってブロックされるはずです。`openclaw proxy validate` では、組み込みのループバックカナリアが、プロキシによる拒否と到達可能なオリジンを区別できます。カスタムの `--denied-url` チェックにはそのカナリアがないため、プロキシがデプロイ固有の拒否シグナルを公開していて、それを別途検証できる場合を除き、HTTP レスポンスとあいまいなトランスポート障害の両方を検証失敗として扱ってください。

次に、OpenClaw のプロキシルーティングを有効化します。

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

または、次のように設定します。

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## 制限

- プロキシは、プロセスローカルな JavaScript HTTP および WebSocket クライアントのカバレッジを改善しますが、OS レベルのネットワークサンドボックスではありません。
- Gateway のループバック制御プレーントラフィックは、デフォルトで `proxy.loopbackMode: "gateway-only"` による直接ローカルバイパスになります。OpenClaw は、アクティブな Gateway ループバックオーソリティを管理対象 `global-agent` `NO_PROXY` コントローラーに登録することで、このバイパスを実装します。オペレーターは、`proxy.loopbackMode: "proxy"` を設定して Gateway ループバックトラフィックを管理対象プロキシ経由で送信するか、`proxy.loopbackMode: "block"` を設定してループバック Gateway 接続を拒否できます。リモートプロキシの注意点については、[Gateway ループバックモード](#gateway-loopback-mode) を参照してください。
- 生の `net`、`tls`、`http2` ソケット、ネイティブアドオン、OpenClaw 以外の子プロセスは、プロキシ環境変数を継承して尊重しない限り、Node レベルのプロキシルーティングをバイパスする場合があります。フォークされた OpenClaw 子 CLI は、管理対象プロキシ URL と `proxy.loopbackMode` の状態を継承します。
- IRC は、オペレーター管理のフォワードプロキシルーティングの外側にある生の TCP/TLS チャンネルです。そのフォワードプロキシ経由ですべての送信を要求するデプロイでは、直接 IRC 送信が明示的に承認されていない限り、`channels.irc.enabled=false` を設定してください。
- ローカルデバッグプロキシは診断用ツールであり、プロキシリクエストと CONNECT トンネルの直接アップストリーム転送は、管理対象プロキシモードがアクティブな間はデフォルトで無効化されています。承認済みのローカル診断の場合にのみ、直接転送を有効化してください。
- ユーザーのローカル WebUI とローカルモデルサーバーは、必要に応じてオペレータープロキシポリシーで許可リストに追加する必要があります。OpenClaw は、それらのための一般的なローカルネットワークバイパスを公開しません。
- Gateway 制御プレーンのプロキシバイパスは、意図的に `localhost` とリテラルのループバック IP URL に限定されています。ローカルの直接 Gateway 制御プレーン接続には、`ws://127.0.0.1:18789`、`ws://[::1]:18789`、または `ws://localhost:18789` を使用してください。他のホスト名は、通常のホスト名ベースのトラフィックと同じようにルーティングされます。
- OpenClaw はプロキシポリシーを検査、テスト、または認証しません。
- プロキシポリシーの変更は、セキュリティ上重要な運用変更として扱ってください。
