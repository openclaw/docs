---
read_when:
    - SSRF および DNS リバインディング攻撃に対する多層防御が必要な場合
    - OpenClaw ランタイムトラフィック用の外部フォワードプロキシの設定
summary: OpenClaw ランタイムの HTTP および WebSocket トラフィックを、オペレーターが管理するフィルタリングプロキシ経由でルーティングする方法
title: ネットワークプロキシ
x-i18n:
    generated_at: "2026-05-06T18:00:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: aed1cd94ce6a32cd8a3f6c7e579011992af87c1ccc40eb53efaa83b020a6792b
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw は、ランタイムの HTTP および WebSocket トラフィックを、オペレーター管理のフォワードプロキシ経由でルーティングできます。これは、中央集約されたエグレス制御、より強力な SSRF 保護、より優れたネットワーク監査可能性を求めるデプロイ向けの、任意の多層防御です。

OpenClaw は、プロキシを同梱、ダウンロード、起動、設定、認証しません。環境に合うプロキシ技術を実行し、OpenClaw は通常のプロセスローカル HTTP および WebSocket クライアントをそこにルーティングします。

## プロキシを使う理由

プロキシは、オペレーターにアウトバウンド HTTP および WebSocket トラフィック用の単一のネットワーク制御点を提供します。これは SSRF 強化以外でも有用です。

- 中央ポリシー: すべてのアプリケーション HTTP 呼び出し箇所でネットワークルールを正しく扱うことに依存せず、単一のエグレスポリシーを維持できます。
- 接続時チェック: DNS 解決後、プロキシがアップストリーム接続を開く直前に宛先を評価できます。
- DNS リバインディング防御: アプリケーションレベルの DNS チェックと実際のアウトバウンド接続の間の隙間を減らせます。
- より広い JavaScript カバレッジ: 通常の `fetch`、`node:http`、`node:https`、WebSocket、axios、got、node-fetch、および同様のクライアントを同じ経路にルーティングできます。
- 監査可能性: エグレス境界で許可および拒否された宛先をログに記録できます。
- 運用制御: OpenClaw を再ビルドせずに、宛先ルール、ネットワークセグメンテーション、レート制限、アウトバウンド許可リストを適用できます。

プロキシルーティングは、通常の HTTP および WebSocket エグレスに対するプロセスレベルのガードレールです。サポートされている JavaScript HTTP クライアントを独自のフィルタリングプロキシにルーティングするためのフェイルクローズ経路をオペレーターに提供しますが、OS レベルのネットワークサンドボックスではなく、OpenClaw がプロキシの宛先ポリシーを認証するものでもありません。

## OpenClaw がトラフィックをルーティングする仕組み

`proxy.enabled=true` でプロキシ URL が設定されている場合、`openclaw gateway run`、`openclaw node run`、`openclaw agent --local` などの保護されたランタイムプロセスは、通常の HTTP および WebSocket エグレスを設定済みプロキシ経由でルーティングします。

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

公開コントラクトはルーティング動作であり、それを実装するために使われる内部 Node フックではありません。OpenClaw Gateway のコントロールプレーン WebSocket クライアントは、Gateway URL が `localhost`、または `127.0.0.1` や `[::1]` のようなリテラルのループバック IP を使う場合、local loopback Gateway RPC トラフィック用の狭い直接経路を使います。そのコントロールプレーン経路は、オペレータープロキシがループバック宛先をブロックしている場合でも、ループバック Gateway に到達できる必要があります。通常のランタイム HTTP および WebSocket リクエストは引き続き設定済みプロキシを使います。

内部的に、OpenClaw はこの機能に 2 つのプロセスレベルのルーティングフックを使います。

- Undici ディスパッチャールーティングは、`fetch`、undici ベースのクライアント、および独自の undici ディスパッチャーを提供するトランスポートを対象にします。
- `global-agent` ルーティングは、多くの `http.request`、`https.request`、`http.get`、`https.get` 上に重ねられたライブラリを含む、Node コアの `node:http` および `node:https` 呼び出し元を対象にします。管理プロキシモードはそのグローバルエージェントを強制するため、明示的な Node HTTP エージェントが誤ってオペレータープロキシを迂回することはありません。

一部の plugins は、プロセスレベルのルーティングが存在する場合でも明示的なプロキシ配線を必要とするカスタムトランスポートを所有しています。たとえば、Telegram の Bot API トランスポートは独自の HTTP/1 undici ディスパッチャーを使うため、そのオーナー固有のトランスポート経路では、プロセスプロキシ環境変数に加えて、管理対象の `OPENCLAW_PROXY_URL` フォールバックを尊重します。

プロキシ URL 自体は `http://` を使う必要があります。HTTPS 宛先は、HTTP `CONNECT` によりプロキシ経由で引き続きサポートされます。これは、OpenClaw が `http://127.0.0.1:3128` のようなプレーン HTTP フォワードプロキシリスナーを想定していることだけを意味します。

プロキシが有効な間、OpenClaw は `no_proxy`、`NO_PROXY`、`GLOBAL_AGENT_NO_PROXY` をクリアします。これらのバイパスリストは宛先ベースであるため、`localhost` や `127.0.0.1` をそこに残すと、高リスクの SSRF ターゲットがフィルタリングプロキシをスキップできてしまいます。

シャットダウン時に、OpenClaw は以前のプロキシ環境を復元し、キャッシュされたプロセスルーティング状態をリセットします。

## 関連するプロキシ用語

- `proxy.enabled` / `proxy.proxyUrl`: OpenClaw ランタイムエグレス用のアウトバウンドフォワードプロキシルーティング。このページではその機能を説明します。
- `gateway.auth.mode: "trusted-proxy"`: Gateway アクセス用のインバウンド identity-aware リバースプロキシ認証。[信頼されたプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照してください。
- `openclaw proxy`: 開発およびサポート用のローカルデバッグプロキシとキャプチャインスペクター。[openclaw proxy](/ja-JP/cli/proxy)を参照してください。
- `tools.web.fetch.useTrustedEnvProxy`: デフォルトの厳格な DNS ピニングとホスト名ポリシーを維持しながら、`web_fetch` がオペレーター制御の HTTP(S) 環境プロキシに DNS を解決させるためのオプトイン。[Web fetch](/ja-JP/tools/web-fetch#trusted-env-proxy)を参照してください。
- チャンネルまたはプロバイダー固有のプロキシ設定: 特定のトランスポート用のオーナー固有オーバーライド。目的がランタイム全体の中央エグレス制御である場合は、管理対象ネットワークプロキシを優先してください。

## 設定

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

設定で `proxy.enabled=true` を維持したまま、環境変数から URL を指定することもできます。

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` は `OPENCLAW_PROXY_URL` より優先されます。

### Gateway ループバックモード

ローカル Gateway コントロールプレーンクライアントは通常、`ws://127.0.0.1:18789` のようなループバック WebSocket に接続します。管理プロキシが有効な間にそのトラフィックをどう扱うかは、`proxy.loopbackMode` で選択します。

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only`（デフォルト）: OpenClaw は、local Gateway WebSocket トラフィックが直接接続できるように、Gateway ループバックオーソリティを有効な `global-agent` `NO_PROXY` コントローラーに登録します。有効な Gateway URL のホストとポートが登録されるため、カスタムループバック Gateway ポートも機能します。
- `proxy`: OpenClaw は Gateway ループバック `NO_PROXY` オーソリティを登録しないため、local Gateway トラフィックは管理プロキシに送信されます。プロキシがリモートの場合、OpenClaw ホストのループバックサービスに対する特別なルーティング、たとえばプロキシから到達可能なホスト名、IP、またはトンネルへのマッピングを提供する必要があります。標準的なリモートプロキシは、`127.0.0.1` と `localhost` を OpenClaw ホストからではなくプロキシホストから解決します。
- `block`: OpenClaw はソケットを開く前に、ループバック Gateway コントロールプレーン接続を拒否します。

`enabled=true` だが有効なプロキシ URL が設定されていない場合、保護されたコマンドは直接ネットワークアクセスにフォールバックせず、起動に失敗します。

`openclaw gateway start` で開始される管理対象 Gateway サービスでは、URL を設定に保存することを優先してください。

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

環境変数フォールバックはフォアグラウンド実行に最適です。インストール済みサービスで使う場合は、`OPENCLAW_PROXY_URL` を `$OPENCLAW_STATE_DIR/.env` や `~/.openclaw/.env` などのサービスの永続環境に入れ、その値で launchd、systemd、または Scheduled Tasks が gateway を起動するようにサービスを再インストールしてください。

`openclaw --container ...` コマンドでは、OpenClaw は `OPENCLAW_PROXY_URL` が設定されている場合、コンテナー対象の子 CLI にそれを転送します。URL はコンテナー内から到達可能である必要があります。`127.0.0.1` はホストではなくコンテナー自体を指します。OpenClaw は、その安全性チェックを明示的にオーバーライドしない限り、コンテナー対象コマンドでループバックプロキシ URL を拒否します。

## プロキシ要件

プロキシポリシーがセキュリティ境界です。OpenClaw は、プロキシが適切なターゲットをブロックしていることを検証できません。

プロキシを次のように設定してください。

- ループバックまたはプライベートな信頼済みインターフェイスのみにバインドする。
- OpenClaw プロセス、ホスト、コンテナー、またはサービスアカウントのみが使えるようにアクセスを制限する。
- 宛先をプロキシ自身で解決し、DNS 解決後に宛先 IP をブロックする。
- プレーン HTTP リクエストと HTTPS `CONNECT` トンネルの両方について、接続時にポリシーを適用する。
- ループバック、プライベート、リンクローカル、メタデータ、マルチキャスト、予約済み、またはドキュメント用範囲に対する宛先ベースのバイパスを拒否する。
- DNS 解決経路を完全に信頼していない限り、ホスト名の許可リストは避ける。
- リクエスト本文、認可ヘッダー、Cookie、その他のシークレットをログに記録せずに、宛先、判定、ステータス、理由をログに記録する。
- プロキシポリシーをバージョン管理下に置き、セキュリティ上重要な設定と同様に変更をレビューする。

## 推奨されるブロック対象宛先

この拒否リストを、あらゆるフォワードプロキシ、ファイアウォール、またはエグレスポリシーの出発点として使ってください。

OpenClaw のアプリケーションレベル分類ロジックは `src/infra/net/ssrf.ts` と `src/shared/net/ip.ts` にあります。関連するパリティフックは、`BLOCKED_HOSTNAMES`、`BLOCKED_IPV4_SPECIAL_USE_RANGES`、`BLOCKED_IPV6_SPECIAL_USE_RANGES`、`RFC2544_BENCHMARK_PREFIX`、および NAT64、6to4、Teredo、ISATAP、IPv4 マップ形式の埋め込み IPv4 センチネル処理です。これらのファイルは外部プロキシポリシーを保守する際の有用な参照ですが、OpenClaw はそれらのルールをプロキシに自動でエクスポートまたは適用しません。

| 範囲またはホスト                                                                    | ブロックする理由                                     |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 ループバック                                    |
| `::1/128`                                                                            | IPv6 ループバック                                    |
| `0.0.0.0/8`, `::/128`                                                                | 未指定アドレスおよびこのネットワークのアドレス       |
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
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | 埋め込み IPv4 を持つ NAT64 プレフィックス            |
| `2002::/16`, `2001::/32`                                                             | 埋め込み IPv4 を持つ 6to4 および Teredo              |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4 互換および IPv4 マップ IPv6                     |

クラウドプロバイダーまたはネットワークプラットフォームが追加のメタデータホストや予約済み範囲を文書化している場合は、それらも追加してください。

## 検証

OpenClaw を実行する同じホスト、コンテナー、またはサービスアカウントからプロキシを検証します。

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

デフォルトでは、カスタムの宛先が指定されていない場合、このコマンドは `https://example.com/` が成功することを確認し、プロキシが到達してはならない一時的なループバックカナリアを開始します。デフォルトの拒否チェックは、プロキシが非 2xx の拒否レスポンスを返すか、トランスポート失敗でカナリアをブロックした場合に合格します。成功レスポンスがカナリアに到達した場合は失敗します。プロキシが有効化および構成されていない場合、検証は構成の問題を報告します。構成を変更する前の一度限りのプリフライトには `--proxy-url` を使用してください。デプロイ固有の期待値をテストするには `--allowed-url` と `--denied-url` を使用してください。`--apns-reachable` を追加すると、直接 APNs HTTP/2 配信がプロキシ経由で CONNECT トンネルを開き、サンドボックス APNs レスポンスを受信できることも検証します。このプローブは意図的に無効なプロバイダートークンを使用するため、`403 InvalidProviderToken` が期待され、到達可能として扱われます。カスタムの拒否宛先はフェイルクローズです。HTTP レスポンスがある場合は宛先がプロキシ経由で到達可能だったことを意味し、トランスポートエラーは OpenClaw がプロキシによって到達可能なオリジンがブロックされたことを証明できないため、不確定として報告されます。検証に失敗した場合、このコマンドはコード 1 で終了します。

自動化には `--json` を使用してください。JSON 出力には、全体の結果、有効なプロキシ構成ソース、構成エラー、各宛先チェックが含まれます。プロキシ URL の認証情報は、テキスト出力と JSON 出力で伏せられます。

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

公開リクエストは成功するはずです。ループバックおよびメタデータリクエストはプロキシによってブロックされるはずです。`openclaw proxy validate` では、組み込みのループバックカナリアがプロキシ拒否と到達可能なオリジンを区別できます。カスタムの `--denied-url` チェックにはそのカナリアがないため、プロキシがデプロイ固有の拒否シグナルを公開し、それを別途検証できる場合を除き、HTTP レスポンスと曖昧なトランスポート失敗の両方を検証失敗として扱ってください。

次に、OpenClaw のプロキシルーティングを有効にします。

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

- プロキシは、プロセスローカルの JavaScript HTTP および WebSocket クライアントのカバレッジを改善しますが、OS レベルのネットワークサンドボックスではありません。
- Gateway ループバック制御プレーントラフィックは、デフォルトで `proxy.loopbackMode: "gateway-only"` による直接ローカルバイパスになります。OpenClaw は、管理対象の `global-agent` `NO_PROXY` コントローラーにアクティブな Gateway ループバックオーソリティを登録することで、このバイパスを実装します。オペレーターは、Gateway ループバックトラフィックを管理対象プロキシ経由で送信するために `proxy.loopbackMode: "proxy"` を設定するか、ループバック Gateway 接続を拒否するために `proxy.loopbackMode: "block"` を設定できます。リモートプロキシの注意点については、[Gateway ループバックモード](#gateway-loopback-mode)を参照してください。
- 生の `net`、`tls`、`http2` ソケット、ネイティブアドオン、OpenClaw 以外の子プロセスは、プロキシ環境変数を継承して尊重しない限り、Node レベルのプロキシルーティングをバイパスする可能性があります。フォークされた OpenClaw 子 CLI は、管理対象プロキシ URL と `proxy.loopbackMode` の状態を継承します。
- IRC は、オペレーター管理のフォワードプロキシルーティングの外側にある生の TCP/TLS チャネルです。すべての外向き通信をそのフォワードプロキシ経由にする必要があるデプロイでは、直接 IRC 外向き通信が明示的に承認されていない限り、`channels.irc.enabled=false` を設定してください。
- ローカルデバッグプロキシは診断ツールであり、プロキシリクエストと CONNECT トンネルに対する直接アップストリーム転送は、管理対象プロキシモードがアクティブな間、デフォルトで無効化されます。承認済みのローカル診断の場合にのみ、直接転送を有効にしてください。
- ユーザーのローカル WebUI とローカルモデルサーバーは、必要に応じてオペレーターのプロキシポリシーで許可リストに追加してください。OpenClaw は、それらに対する一般的なローカルネットワークバイパスを公開しません。
- Gateway 制御プレーンのプロキシバイパスは、意図的に `localhost` とリテラルのループバック IP URL に限定されています。ローカルの直接 Gateway 制御プレーン接続には、`ws://127.0.0.1:18789`、`ws://[::1]:18789`、または `ws://localhost:18789` を使用してください。その他のホスト名は、通常のホスト名ベースのトラフィックと同様にルーティングされます。
- OpenClaw は、プロキシポリシーを検査、テスト、認定しません。
- プロキシポリシーの変更は、セキュリティ上重要な運用変更として扱ってください。
