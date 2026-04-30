---
read_when:
    - SSRF と DNS リバインディング攻撃に対する多層防御が必要な場合
    - OpenClaw のランタイムトラフィック用に外部フォワードプロキシを設定する
summary: OpenClaw ランタイムの HTTP および WebSocket トラフィックをオペレーター管理のフィルタリングプロキシ経由でルーティングする方法
title: ネットワークプロキシ
x-i18n:
    generated_at: "2026-04-30T05:35:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4e879f787571410acdda55dcdbb5fd77aef1d24045af5c9208cba51330a70ca
    source_path: security/network-proxy.md
    workflow: 16
---

# ネットワークプロキシ

OpenClaw は、実行時の HTTP および WebSocket トラフィックを、運用者が管理するフォワードプロキシ経由でルーティングできます。これは、集中 egress 制御、より強力な SSRF 保護、より優れたネットワーク監査性を必要とするデプロイ向けの任意の多層防御です。

OpenClaw は、プロキシを同梱、ダウンロード、起動、構成、または認定しません。環境に合うプロキシ技術を利用者が実行し、OpenClaw は通常のプロセスローカルな HTTP および WebSocket クライアントをそのプロキシ経由でルーティングします。

## プロキシを使う理由

プロキシにより、運用者はアウトバウンド HTTP および WebSocket トラフィックに対する単一のネットワーク制御点を持てます。これは SSRF 強化以外でも有用です。

- 集中ポリシー: すべてのアプリケーション HTTP 呼び出し箇所がネットワークルールを正しく扱うことに依存せず、1 つの egress ポリシーを維持できます。
- 接続時チェック: DNS 解決後、プロキシが上流接続を開く直前に宛先を評価できます。
- DNS リバインディング防御: アプリケーションレベルの DNS チェックと実際のアウトバウンド接続の間の隙間を減らします。
- より広い JavaScript カバレッジ: 通常の `fetch`、`node:http`、`node:https`、WebSocket、axios、got、node-fetch、および類似のクライアントを同じ経路にルーティングします。
- 監査性: egress 境界で許可および拒否された宛先をログに記録できます。
- 運用制御: OpenClaw を再ビルドせずに、宛先ルール、ネットワーク分離、レート制限、またはアウトバウンド許可リストを適用できます。

プロキシルーティングは、通常の HTTP および WebSocket egress に対するプロセスレベルのガードレールです。対応する JavaScript HTTP クライアントを独自のフィルタリングプロキシ経由でルーティングする fail-closed な経路を運用者に提供しますが、OS レベルのネットワークサンドボックスではなく、OpenClaw がプロキシの宛先ポリシーを認定するものでもありません。

## OpenClaw がトラフィックをルーティングする方法

`proxy.enabled=true` でプロキシ URL が構成されている場合、`openclaw gateway run`、`openclaw node run`、`openclaw agent --local` などの保護された実行時プロセスは、通常の HTTP および WebSocket egress を構成済みプロキシ経由でルーティングします。

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

公開契約はルーティング動作であり、それを実装するために使われる内部の Node フックではありません。OpenClaw Gateway のコントロールプレーン WebSocket クライアントは、Gateway URL が `localhost`、または `127.0.0.1` や `[::1]` などのリテラルのループバック IP を使う場合、local loopback Gateway RPC トラフィック用に限定された直接経路を使います。このコントロールプレーン経路は、運用者プロキシがループバック宛先をブロックしていても、ループバック Gateway に到達できる必要があります。通常の実行時 HTTP および WebSocket リクエストは引き続き構成済みプロキシを使います。

内部的に、OpenClaw はこの機能のために 2 つのプロセスレベルのルーティングフックを使います。

- Undici dispatcher ルーティングは、`fetch`、undici ベースのクライアント、および独自の undici dispatcher を提供するトランスポートを対象にします。
- `global-agent` ルーティングは、`http.request`、`https.request`、`http.get`、`https.get` の上に構築された多くのライブラリを含む、Node コアの `node:http` および `node:https` 呼び出し元を対象にします。管理プロキシモードでは、そのグローバルエージェントを強制するため、明示的な Node HTTP エージェントが誤って運用者プロキシをバイパスすることはありません。

一部のプラグインは、プロセスレベルのルーティングが存在していても、明示的なプロキシ配線を必要とするカスタムトランスポートを所有します。たとえば、Telegram の Bot API トランスポートは独自の HTTP/1 undici dispatcher を使うため、その所有者固有のトランスポート経路で、プロセスプロキシ環境に加えて管理対象の `OPENCLAW_PROXY_URL` フォールバックを尊重します。

プロキシ URL 自体は `http://` を使う必要があります。HTTPS 宛先は、HTTP `CONNECT` によってプロキシ経由で引き続きサポートされます。これは、OpenClaw が `http://127.0.0.1:3128` のようなプレーン HTTP フォワードプロキシリスナーを期待する、という意味にすぎません。

プロキシが有効な間、OpenClaw は `no_proxy`、`NO_PROXY`、`GLOBAL_AGENT_NO_PROXY` をクリアします。これらのバイパスリストは宛先ベースであるため、そこに `localhost` や `127.0.0.1` を残すと、高リスクの SSRF ターゲットがフィルタリングプロキシをスキップできてしまいます。

シャットダウン時、OpenClaw は以前のプロキシ環境を復元し、キャッシュされたプロセスルーティング状態をリセットします。

## 関連するプロキシ用語

- `proxy.enabled` / `proxy.proxyUrl`: OpenClaw 実行時 egress 用のアウトバウンドフォワードプロキシルーティング。このページではこの機能を説明します。
- `gateway.auth.mode: "trusted-proxy"`: Gateway アクセス用のインバウンド ID 対応リバースプロキシ認証。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照してください。
- `openclaw proxy`: 開発とサポート用のローカルデバッグプロキシおよびキャプチャインスペクター。[openclaw proxy](/ja-JP/cli/proxy)を参照してください。
- チャネルまたはプロバイダー固有のプロキシ設定: 特定のトランスポート向けの所有者固有のオーバーライド。目的が実行時全体にわたる集中 egress 制御である場合は、管理対象ネットワークプロキシを優先してください。

## 構成

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

構成で `proxy.enabled=true` を維持したまま、環境経由で URL を指定することもできます。

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` は `OPENCLAW_PROXY_URL` より優先されます。

`enabled=true` でも有効なプロキシ URL が構成されていない場合、保護されたコマンドは直接ネットワークアクセスへフォールバックせず、起動に失敗します。

`openclaw gateway start` で開始される管理対象 Gateway サービスでは、URL を構成に保存することを推奨します。

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

環境フォールバックはフォアグラウンド実行に最適です。インストール済みサービスで使う場合は、`OPENCLAW_PROXY_URL` を `$OPENCLAW_STATE_DIR/.env` や `~/.openclaw/.env` などのサービスの永続環境に配置し、その値で launchd、systemd、または Scheduled Tasks が Gateway を開始するようサービスを再インストールしてください。

`openclaw --container ...` コマンドでは、`OPENCLAW_PROXY_URL` が設定されている場合、OpenClaw はそれをコンテナ対象の子 CLI に転送します。URL はコンテナ内から到達可能である必要があります。`127.0.0.1` はホストではなくコンテナ自身を指します。OpenClaw は、その安全性チェックを明示的にオーバーライドしない限り、コンテナ対象コマンドに対してループバックプロキシ URL を拒否します。

## プロキシ要件

プロキシポリシーがセキュリティ境界です。OpenClaw は、プロキシが適切なターゲットをブロックしていることを検証できません。

プロキシは次のように構成してください。

- ループバック、または信頼されたプライベートインターフェイスにのみバインドする。
- OpenClaw プロセス、ホスト、コンテナ、またはサービスアカウントだけが使用できるようアクセスを制限する。
- 宛先を自身で解決し、DNS 解決後に宛先 IP をブロックする。
- プレーン HTTP リクエストと HTTPS `CONNECT` トンネルの両方について、接続時にポリシーを適用する。
- ループバック、プライベート、リンクローカル、メタデータ、マルチキャスト、予約済み、またはドキュメント用範囲に対する宛先ベースのバイパスを拒否する。
- DNS 解決経路を完全に信頼している場合を除き、ホスト名許可リストは避ける。
- リクエスト本文、認可ヘッダー、Cookie、その他のシークレットをログに記録せず、宛先、判定、ステータス、理由をログに記録する。
- プロキシポリシーをバージョン管理下に置き、セキュリティ上重要な構成と同様に変更をレビューする。

## 推奨ブロック宛先

この拒否リストを、任意のフォワードプロキシ、ファイアウォール、または egress ポリシーの出発点として使ってください。

OpenClaw のアプリケーションレベルの分類ロジックは、`src/infra/net/ssrf.ts` と `src/shared/net/ip.ts` にあります。関連するパリティフックは、`BLOCKED_HOSTNAMES`、`BLOCKED_IPV4_SPECIAL_USE_RANGES`、`BLOCKED_IPV6_SPECIAL_USE_RANGES`、`RFC2544_BENCHMARK_PREFIX`、および NAT64、6to4、Teredo、ISATAP、IPv4-mapped 形式向けの埋め込み IPv4 センチネル処理です。これらのファイルは外部プロキシポリシーを維持する際の有用な参照ですが、OpenClaw はそれらのルールを利用者のプロキシへ自動的にエクスポートしたり適用したりしません。

| 範囲またはホスト                                                                     | ブロックする理由                                     |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 ループバック                                    |
| `::1/128`                                                                            | IPv6 ループバック                                    |
| `0.0.0.0/8`, `::/128`                                                                | 未指定アドレスおよびこのネットワークのアドレス       |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918 プライベートネットワーク                     |
| `169.254.0.0/16`, `fe80::/10`                                                        | リンクローカルアドレスと一般的なクラウドメタデータ経路 |
| `169.254.169.254`, `metadata.google.internal`                                        | クラウドメタデータサービス                           |
| `100.64.0.0/10`                                                                      | Carrier-grade NAT 共有アドレス空間                   |
| `198.18.0.0/15`, `2001:2::/48`                                                       | ベンチマーク範囲                                     |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | 特殊用途およびドキュメント用範囲                     |
| `224.0.0.0/4`, `ff00::/8`                                                            | マルチキャスト                                       |
| `240.0.0.0/4`                                                                        | 予約済み IPv4                                        |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 ローカル/プライベート範囲                       |
| `100::/64`, `2001:20::/28`                                                           | IPv6 discard および ORCHIDv2 範囲                    |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | 埋め込み IPv4 を持つ NAT64 プレフィックス            |
| `2002::/16`, `2001::/32`                                                             | 埋め込み IPv4 を持つ 6to4 および Teredo              |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-compatible および IPv4-mapped IPv6              |

クラウドプロバイダーまたはネットワークプラットフォームが追加のメタデータホストや予約済み範囲を文書化している場合は、それらも追加してください。

## 検証

OpenClaw を実行する同じホスト、コンテナ、またはサービスアカウントからプロキシを検証します。

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

公開リクエストは成功するはずです。ループバックおよびメタデータリクエストはプロキシで失敗するはずです。

次に OpenClaw プロキシルーティングを有効にします。

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

または次を設定します。

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## 制限

- プロキシは、プロセスローカルな JavaScript HTTP および WebSocket クライアントのカバレッジを改善しますが、OS レベルのネットワークサンドボックスではありません。
- raw `net`、`tls`、`http2` ソケット、ネイティブアドオン、子プロセスは、プロキシ環境変数を継承して尊重しない限り、Node レベルのプロキシルーティングをバイパスする可能性があります。
- 必要に応じて、ユーザーのローカル WebUI とローカルモデルサーバーは運用者プロキシポリシーで許可リストに入れる必要があります。OpenClaw はそれらのための一般的なローカルネットワークバイパスを公開しません。
- Gateway コントロールプレーンのプロキシバイパスは、意図的に `localhost` とリテラルのループバック IP URL に限定されています。ローカルの直接 Gateway コントロールプレーン接続には、`ws://127.0.0.1:18789`、`ws://[::1]:18789`、または `ws://localhost:18789` を使ってください。その他のホスト名は通常のホスト名ベースのトラフィックと同様にルーティングされます。
- OpenClaw は、利用者のプロキシポリシーを検査、テスト、または認定しません。
- プロキシポリシーの変更は、セキュリティ上重要な運用変更として扱ってください。
