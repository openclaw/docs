---
read_when:
    - Bonjour検出/advertisingを実装または変更する】【。analysis to=final code  omitted
    - リモート接続モード（direct vs SSH）を調整する
    - リモートNode向けのNode検出 + ペアリングを設計する
summary: Gatewayを見つけるためのNode検出とtransport（Bonjour、Tailscale、SSH）
title: 検出とtransport
x-i18n:
    generated_at: "2026-04-24T04:57:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 684e5aeb1f74a90bf8689f8b25830be2c9e497fcdeda390d98f204d7cb4134b8
    source_path: gateway/discovery.md
    workflow: 15
---

# 検出とtransport

OpenClawには、表面的には似て見えても、実際には異なる2つの問題があります。

1. **オペレーターのリモート制御**: 別の場所で動作しているGatewayを、macOSメニューバーアプリが制御すること。
2. **Nodeペアリング**: iOS/Android（および将来のNode）がGatewayを見つけて、安全にペアリングすること。

設計目標は、すべてのネットワーク検出/advertisingを**Node Gateway**（`openclaw gateway`）に集約し、クライアント（macアプリ、iOS）はその利用者にとどめることです。

## 用語

- **Gateway**: 状態（セッション、ペアリング、node registry）を所有し、チャンネルを実行する単一の長時間動作するgateway process。ほとんどの構成ではホストごとに1つです。分離されたマルチgateway構成も可能です。
- **Gateway WS（control plane）**: デフォルトでは `127.0.0.1:18789` 上のWebSocketエンドポイント。`gateway.bind` によってLAN/tailnetへバインドできます。
- **Direct WS transport**: LAN/tailnet向けのGateway WSエンドポイント（SSHなし）。
- **SSH transport（フォールバック）**: `127.0.0.1:18789` をSSH経由でforwardして行うリモート制御。
- **Legacy TCP bridge（削除済み）**: 以前のnode transport（
  [Bridge protocol](/ja-JP/gateway/bridge-protocol) を参照）。現在のビルドでは
  discovery向けにadvertiseされず、含まれていません。

プロトコル詳細:

- [Gateway protocol](/ja-JP/gateway/protocol)
- [Bridge protocol (legacy)](/ja-JP/gateway/bridge-protocol)

## なぜ「direct」とSSHの両方を維持するのか

- **Direct WS** は、同じネットワーク内やtailnet内で最良のUXです:
  - BonjourによるLAN上の自動検出
  - pairing token + ACLはgatewayが所有
  - shellアクセス不要。プロトコルサーフェスを狭く保ち、監査しやすい
- **SSH** は依然として汎用的なフォールバックです:
  - SSHアクセスがある場所ならどこでも使える（無関係なネットワーク間でも）
  - multicast/mDNSの問題を回避できる
  - SSH以外の新たな受信ポートを必要としない

## Discovery入力（クライアントがGatewayの場所を知る方法）

### 1) Bonjour / DNS-SD discovery

Multicast Bonjourはベストエフォートであり、ネットワークを越えません。OpenClawは、
設定された広域DNS-SDドメイン経由でも同じgateway beaconを参照できるため、discoveryは次をカバーできます:

- 同一LAN上の `local.`
- クロスネットワークdiscovery用に設定されたunicast DNS-SDドメイン

対象方向:

- **gateway** はBonjour経由で自身のWSエンドポイントをadvertiseします。
- クライアントは参照して「gatewayを選ぶ」一覧を表示し、選択されたエンドポイントを保存します。

トラブルシューティングとbeacon詳細: [Bonjour](/ja-JP/gateway/bonjour)。

#### Service beacon詳細

- Service type:
  - `_openclaw-gw._tcp`（gateway transport beacon）
- TXTキー（秘密情報ではない）:
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>`（オペレーター設定の表示名）
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789`（Gateway WS + HTTP）
  - `gatewayTls=1`（TLS有効時のみ）
  - `gatewayTlsSha256=<sha256>`（TLS有効かつfingerprintが利用可能な場合のみ）
  - `canvasPort=<port>`（canvas hostポート。現在、canvas host有効時は `gatewayPort` と同じ）
  - `tailnetDns=<magicdns>`（任意のヒント。Tailscale利用時に自動検出）
  - `sshPort=<port>`（mDNS full modeのみ。wide-area DNS-SDでは省略されることがあり、その場合SSHデフォルトは `22` のまま）
  - `cliPath=<path>`（mDNS full modeのみ。wide-area DNS-SDでもリモートインストールヒントとして書き込まれます）

セキュリティに関する注記:

- Bonjour/mDNS TXTレコードは**認証されていません**。クライアントはTXT値をUXヒントとしてのみ扱う必要があります。
- ルーティング（host/port）は、TXTの `lanHost`、`tailnetDns`、`gatewayPort` よりも、**解決済みservice endpoint**（SRV + A/AAAA）を優先すべきです。
- TLS pinningでは、advertiseされた `gatewayTlsSha256` が、以前保存済みのpinを上書きできてはなりません。
- iOS/Android Nodeでは、選ばれたルートがsecure/TLSベースの場合、初回のpin保存前に必ず明示的な「このfingerprintを信頼する」確認（帯域外検証）を要求すべきです。

無効化/override:

- `OPENCLAW_DISABLE_BONJOUR=1` でadvertisingを無効化します。
- `~/.openclaw/openclaw.json` の `gateway.bind` がGatewayのbind modeを制御します。
- `OPENCLAW_SSH_PORT` は、`sshPort` を出力する際のadvertiseされるSSHポートを上書きします。
- `OPENCLAW_TAILNET_DNS` は `tailnetDns` ヒント（MagicDNS）を公開します。
- `OPENCLAW_CLI_PATH` はadvertiseされるCLIパスを上書きします。

### 2) Tailnet（クロスネットワーク）

London/Viennaスタイルの構成では、Bonjourは役に立ちません。推奨される「direct」ターゲットは次です:

- Tailscale MagicDNS名（推奨）または安定したtailnet IP。

gatewayがTailscale上で動作していることを検出できる場合、クライアント向けの任意ヒントとして `tailnetDns` を公開します（wide-area beaconを含む）。

macOSアプリは現在、gateway discoveryで生のTailscale IPよりもMagicDNS名を優先します。これにより、tailnet IPが変わった場合（たとえばnode再起動後やCGNAT再割り当て後）でも、MagicDNS名が現在のIPへ自動解決されるため、信頼性が向上します。

モバイルNodeペアリングでは、discoveryヒントによってtailnet/publicルートのtransportセキュリティが緩和されることはありません:

- iOS/Androidでは、初回のtailnet/public接続は引き続きsecureな接続経路（`wss://` またはTailscale Serve/Funnel）が必要です。
- 発見された生のtailnet IPはルーティングヒントであって、平文のリモート `ws://` を使ってよいという許可ではありません。
- プライベートLANでのdirect-connect `ws://` は引き続きサポートされます。
- モバイルNode向けに最も簡単なTailscale経路を使いたい場合は、Tailscale Serveを使って、discoveryとセットアップコードの両方が同じsecureなMagicDNSエンドポイントへ解決されるようにしてください。

### 3) 手動 / SSHターゲット

directルートがない場合（またはdirectが無効な場合）、クライアントはいつでもloopback gatewayポートをforwardするSSH経由で接続できます。

[Remote access](/ja-JP/gateway/remote) を参照してください。

## Transport選択（クライアントポリシー）

推奨されるクライアント動作:

1. ペア済みのdirectエンドポイントが設定され、到達可能なら、それを使う。
2. そうでなければ、discoveryが `local.` または設定済みwide-area domain上でgatewayを見つけた場合、ワンタップの「このgatewayを使う」選択を提示し、それをdirectエンドポイントとして保存する。
3. そうでなければ、tailnet DNS/IPが設定されていればdirectを試す。
   モバイルNodeのtailnet/publicルートでは、directとはsecureなエンドポイントを意味し、平文のリモート `ws://` ではありません。
4. それでもだめなら、SSHへフォールバックする。

## ペアリング + auth（direct transport）

gatewayはnode/client受け入れの信頼できる情報源です。

- ペアリング要求はgateway内で作成/承認/拒否されます（[Gateway pairing](/ja-JP/gateway/pairing) を参照）。
- gatewayは次を強制します:
  - auth（token / keypair）
  - scope/ACL（gatewayはすべてのメソッドへの生proxyではありません）
  - レート制限

## コンポーネントごとの責務

- **Gateway**: discovery beaconをadvertiseし、ペアリング判定を所有し、WSエンドポイントをホストする。
- **macOSアプリ**: gateway選択を補助し、ペアリングプロンプトを表示し、SSHはフォールバックとしてのみ使う。
- **iOS/Android Node**: 利便性のためにBonjourを参照し、ペア済みGateway WSに接続する。

## 関連

- [Remote access](/ja-JP/gateway/remote)
- [Tailscale](/ja-JP/gateway/tailscale)
- [Bonjour discovery](/ja-JP/gateway/bonjour)
