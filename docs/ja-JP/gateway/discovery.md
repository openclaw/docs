---
read_when:
    - Bonjour 検出/アドバタイズの実装または変更
    - リモート接続モードの調整（直接 vs SSH）
    - リモートノード向けのノード検出 + ペアリングの設計
summary: ゲートウェイを検出するための Node 検出とトランスポート（Bonjour、Tailscale、SSH）
title: 検出とトランスポート
x-i18n:
    generated_at: "2026-07-05T11:23:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a3f1a6a1212ab0bc7021e77c88de059edcb8e09eff90d3e1e59451b9b20876b
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClawには、関連しているが異なる2つの探索問題があります。

1. **オペレーターのリモート制御**: 別の場所で動作しているGatewayを制御するmacOSメニューバーアプリ。
2. **Nodeペアリング**: iOS/Android（および将来のNode）がGatewayを見つけ、安全にペアリングすること。

すべてのネットワーク探索/広告は **Node Gateway**
（`openclaw gateway`）にあります。クライアント（Macアプリ、iOS）はコンシューマーにすぎません。

## 用語

- **Gateway**: 状態（セッション、ペアリング、Nodeレジストリ）を所有し、チャネルを実行する単一の長時間実行プロセス。ほとんどのセットアップではホストごとに1つ使用しますが、分離された複数Gateway構成も可能です。
- **Gateway WS（コントロールプレーン）**: 既定では `127.0.0.1:18789` のWebSocketエンドポイント。`gateway.bind` でLAN/tailnetにバインドします。
- **Direct WS transport**: LAN/tailnet向けのGateway WSエンドポイント（SSHなし）。
- **SSH transport（フォールバック）**: `127.0.0.1:18789` をSSH経由で転送するリモート制御。
- **Legacy TCP bridge（削除済み）**: 以前のNodeトランスポート（[Bridge protocol](/ja-JP/gateway/bridge-protocol)を参照）。探索では広告されなくなり、現在のビルドにも含まれません。

プロトコルの詳細: [Gateway protocol](/ja-JP/gateway/protocol)、
[Bridge protocol（レガシー）](/ja-JP/gateway/bridge-protocol)。

## directとSSHの両方が存在する理由

- **Direct WS** は、同じネットワーク上およびtailnet内で最良のUXです。BonjourによるLAN自動探索、Gatewayが所有するペアリングトークンとACL、シェルアクセス不要の利用が可能です。
- **SSH** は汎用フォールバックです。SSHアクセスがある場所ならどこでも動作し、無関係なネットワーク間でも使え、マルチキャスト/mDNSの問題にも強く、SSH以外の新しい受信ポートを必要としません。

## 探索入力

### 1) Bonjour / DNS-SD

マルチキャストBonjourはベストエフォートであり、ネットワークをまたぎません。OpenClawは、設定済みのワイドエリアDNS-SDドメイン経由でも同じGatewayビーコンをブラウズできます。そのため、同じLAN上の `local.` と、クロスネットワーク探索用に設定されたユニキャストDNS-SDドメインの両方を探索対象にできます。

**Gateway** は、バンドルされた `bonjour` Pluginが有効な場合にBonjour経由でWSエンドポイントを広告します。クライアントはブラウズして「Gatewayを選択」リストを表示し、選択されたエンドポイントを保存します。

トラブルシューティングとビーコンの詳細: [Bonjour](/ja-JP/gateway/bonjour)。

#### サービスビーコンの詳細

- サービスタイプ: `_openclaw-gw._tcp`（Gatewayトランスポートビーコン）。
- TXTキー（シークレットではない）:

  | キー                        | 注記                                                                                                                                                              |
  | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `role=gateway`              | 常に存在します。                                                                                                                                                  |
  | `transport=gateway`         | 常に存在します。                                                                                                                                                  |
  | `displayName=<name>`        | オペレーターが設定する表示名。                                                                                                                                    |
  | `lanHost=<hostname>.local`  | LAN mDNS広告元のみ。ワイドエリアDNS-SDでは書き込まれません。                                                                                                     |
  | `gatewayPort=18789`         | Gateway WS + HTTPポート。                                                                                                                                         |
  | `gatewayTls=1`              | TLSが有効な場合のみ。                                                                                                                                             |
  | `gatewayTlsSha256=<sha256>` | TLSが有効でフィンガープリントが利用できる場合のみ。                                                                                                               |
  | `tailnetDns=<magicdns>`     | 任意のヒント。Tailscaleが利用可能な場合に自動検出されます。                                                                                                       |
  | `sshPort=<port>`            | `discovery.mdns.mode="full"` の場合のみ存在します。既定の `"minimal"` モードでは、LAN広告元とワイドエリアDNS-SDの両方で省略されます（SSHの既定値は `22`）。       |
  | `cliPath=<path>`            | `sshPort` と同じ `discovery.mdns.mode="full"` ゲート。CLIパスのリモートインストールヒントです。                                                                  |

  `canvasPort` TXTキーは、将来のcanvasホストポート用としてPlugin探索コントラクトで定義されていますが、現在のコードパスでは値を設定しないため、現時点では送出されません。

セキュリティ上の注意:

- Bonjour/mDNS TXTレコードは**認証されません**。クライアントはTXT値をUXヒントとしてのみ扱う必要があります。
- ルーティング（ホスト/ポート）は、TXTで提供される `lanHost`、`tailnetDns`、`gatewayPort` よりも、**解決済みサービスエンドポイント**（SRV + A/AAAA）を優先するべきです。
- TLSピンニングでは、広告された `gatewayTlsSha256` に以前保存したピンを上書きさせてはいけません。
- iOS/Android Nodeは、選択された経路がセキュア/TLSベースである場合、初回ピンを保存する前に、明示的な「このフィンガープリントを信頼」確認（帯域外検証）を要求するべきです。

有効化、無効化、上書き:

- `openclaw plugins enable bonjour` はLANマルチキャスト広告を有効にします。
- `openclaw.json` の `discovery.mdns.mode` はmDNSブロードキャストを制御します:
  `"minimal"`（既定）、`"full"`（LANビーコンと任意のワイドエリアDNS-SDゾーンの両方に `cliPath`/`sshPort` を追加）、または `"off"`（mDNSを無効化）。
- `OPENCLAW_DISABLE_BONJOUR=1` は広告を強制的に無効化します。`discovery.mdns.mode="off"` は独立して無効化します。`OPENCLAW_DISABLE_BONJOUR=0` は、検出されたコンテナ（Docker、containerd、Kubernetes、LXC）内でPluginの自動無効化を上書きする明示的なオプトインです。`discovery.mdns.mode="off"` は上書きしません。バンドルされた `bonjour` PluginはmacOSホスト（`enabledByDefaultOnPlatforms: ["darwin"]`）で自動起動し、検出されたコンテナ内では自動無効化されます。Linux、Windows、およびその他のコンテナ化デプロイでは、明示的な `plugins enable bonjour` が必要です。
- `~/.openclaw/openclaw.json` の `gateway.bind` はGatewayのバインドモードを制御します。
- `OPENCLAW_SSH_PORT` は広告されるSSHポートを上書きします（`discovery.mdns.mode="full"` の場合のみ有効）。
- `OPENCLAW_TAILNET_DNS` は `tailnetDns` ヒント（MagicDNS）を公開します。
- `OPENCLAW_CLI_PATH` は広告されるCLIパスを上書きします。

### 2) Tailnet（クロスネットワーク）

異なる物理ネットワーク上のGatewayには、Bonjourは役に立ちません。推奨されるdirectターゲットは、Tailscale MagicDNS名（推奨）または安定したtailnet IPです。

GatewayがTailscale配下で動作していることを検出した場合、クライアント向けの任意ヒントとして `tailnetDns` を公開します（ワイドエリアビーコンを含む）。macOSアプリはGateway探索で、生のTailscale IPよりもMagicDNS名を優先します。MagicDNSは現在のIPに自動的に解決されるため、tailnet IPが変わった場合（Node再起動、CGNAT再割り当て）でも信頼性が保たれます。

モバイルNodeペアリングでは、探索ヒントがtailnet/公開経路のトランスポートセキュリティを緩和することはありません:

- iOS/Androidは、初回のtailnet/公開接続パスとして引き続きセキュアな経路（`wss://` またはTailscale Serve/Funnel）を要求します。
- 探索された生のtailnet IPはルーティングヒントであり、平文のリモート `ws://` を使用する許可ではありません。
- プライベートLANのdirect-connect `ws://` は引き続きサポートされます。
- モバイルNodeで最も単純なTailscale経路を使うには、Tailscale Serveを使用し、探索とセットアップの両方が同じセキュアなMagicDNSエンドポイントに解決されるようにします。

### 3) 手動 / SSHターゲット

direct経路がない場合（またはdirectが無効な場合）、クライアントはlocal loopbackのGatewayポートを転送することで、いつでもSSH経由で接続できます。[Remote access](/ja-JP/gateway/remote)を参照してください。

## トランスポート選択（クライアントポリシー）

1. ペアリング済みdirectエンドポイントが設定され、到達可能な場合は、それを使用します。
2. それ以外で、探索によって `local.` または設定済みのワイドエリアドメイン上にGatewayが見つかった場合は、ワンタップの「このGatewayを使用」選択肢を提示し、directエンドポイントとして保存します。
3. それ以外で、tailnet DNS/IPが設定されている場合は、directを試します。tailnet/公開経路上のモバイルNodeでは、directはセキュアなエンドポイントを意味し、平文のリモート `ws://` ではありません。
4. それ以外の場合は、SSHにフォールバックします。

## ペアリングと認証（directトランスポート）

GatewayはNode/クライアント許可の信頼できる情報源です:

- ペアリング要求はGateway内で作成/承認/拒否されます（[Gateway pairing](/ja-JP/gateway/pairing)を参照）。
- Gatewayは認証（トークン/キーペア）、スコープ/ACL（すべてのメソッドへの生プロキシではありません）、およびレート制限を適用します。

## コンポーネント別の責任

- **Gateway**: 探索ビーコンを広告し、ペアリング判断を所有し、WSエンドポイントをホストします。
- **macOSアプリ**: Gatewayの選択を支援し、ペアリングプロンプトを表示し、SSHはフォールバックとしてのみ使用します。
- **iOS/Android Node**: 便利機能としてBonjourをブラウズし、ペアリング済みGateway WSに接続します。

## 関連

- [Remote access](/ja-JP/gateway/remote)
- [Tailscale](/ja-JP/gateway/tailscale)
- [Bonjour discovery](/ja-JP/gateway/bonjour)
