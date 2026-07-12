---
read_when:
    - Bonjour 検出/アドバタイズの実装または変更
    - リモート接続モード（直接接続と SSH 接続）の調整
    - リモート Node の検出とペアリングの設計
summary: Gateway を検出するための Node ディスカバリーとトランスポート（Bonjour、Tailscale、SSH）
title: 検出とトランスポート
x-i18n:
    generated_at: "2026-07-11T22:14:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a3f1a6a1212ab0bc7021e77c88de059edcb8e09eff90d3e1e59451b9b20876b
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw には、関連しているものの異なる 2 つの検出上の課題があります。

1. **オペレーターによるリモート制御**: macOS メニューバーアプリから、別の場所で実行されている Gateway を制御します。
2. **Node のペアリング**: iOS/Android（および将来の Node）が Gateway を検出し、安全にペアリングします。

ネットワークの検出とアドバタイズはすべて **Node Gateway**
（`openclaw gateway`）が担い、クライアント（Mac アプリ、iOS）は利用するだけです。

## 用語

- **Gateway**: 状態（セッション、ペアリング、Node レジストリ）を所有し、チャンネルを実行する単一の長期稼働プロセスです。ほとんどの構成ではホストごとに 1 つ使用しますが、分離された複数 Gateway 構成も可能です。
- **Gateway WS（コントロールプレーン）**: デフォルトでは `127.0.0.1:18789` の WebSocket エンドポイントです。`gateway.bind` を使用して LAN/tailnet にバインドします。
- **直接 WS トランスポート**: LAN/tailnet からアクセス可能な Gateway WS エンドポイントです（SSH は使用しません）。
- **SSH トランスポート（フォールバック）**: SSH 経由で `127.0.0.1:18789` を転送してリモート制御します。
- **旧式の TCP ブリッジ（削除済み）**: 以前の Node トランスポートです（[ブリッジプロトコル](/ja-JP/gateway/bridge-protocol)を参照）。検出用にはアドバタイズされなくなり、現在のビルドにも含まれていません。

プロトコルの詳細: [Gateway プロトコル](/ja-JP/gateway/protocol)、
[ブリッジプロトコル（旧式）](/ja-JP/gateway/bridge-protocol)。

## 直接接続と SSH の両方が存在する理由

- **直接 WS** は、同じネットワーク上および tailnet 内で最適なユーザー体験を提供します。Bonjour による LAN 自動検出、Gateway が管理するペアリングトークンと ACL を利用でき、シェルアクセスも不要です。
- **SSH** は汎用的なフォールバックです。SSH アクセスがあれば、無関係なネットワーク間でもどこからでも機能し、マルチキャスト/mDNS の問題にも影響されず、SSH 以外の新しい受信ポートも必要ありません。

## 検出の入力元

### 1) Bonjour / DNS-SD

マルチキャスト Bonjour はベストエフォートであり、ネットワークを越えて動作しません。OpenClaw は、設定された広域 DNS-SD ドメインを介した同じ Gateway ビーコンの参照にも対応しているため、同じ LAN 上の `local.` と、ネットワークをまたぐ検出用に設定されたユニキャスト DNS-SD ドメインの両方を検出範囲に含められます。

バンドルされた `bonjour` Plugin が有効な場合、**Gateway** は Bonjour 経由で WS エンドポイントをアドバタイズします。クライアントはこれを参照して「Gateway を選択」リストを表示し、選択されたエンドポイントを保存します。

トラブルシューティングとビーコンの詳細: [Bonjour](/ja-JP/gateway/bonjour)。

#### サービスビーコンの詳細

- サービスタイプ: `_openclaw-gw._tcp`（Gateway トランスポートビーコン）。
- TXT キー（シークレットではありません）:

  | キー                        | 注記                                                                                                                                                          |
  | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `role=gateway`              | 常に存在します。                                                                                                                                              |
  | `transport=gateway`         | 常に存在します。                                                                                                                                              |
  | `displayName=<name>`        | オペレーターが設定した表示名です。                                                                                                                            |
  | `lanHost=<hostname>.local`  | LAN mDNS アドバタイザーのみが書き込みます。広域 DNS-SD では書き込まれません。                                                                                   |
  | `gatewayPort=18789`         | Gateway WS + HTTP ポートです。                                                                                                                                |
  | `gatewayTls=1`              | TLS が有効な場合にのみ存在します。                                                                                                                             |
  | `gatewayTlsSha256=<sha256>` | TLS が有効でフィンガープリントを取得できる場合にのみ存在します。                                                                                               |
  | `tailnetDns=<magicdns>`     | オプションのヒントです。Tailscale が利用可能な場合は自動検出されます。                                                                                          |
  | `sshPort=<port>`            | `discovery.mdns.mode="full"` の場合にのみ存在します。デフォルトの `"minimal"` モードでは、LAN アドバタイザーと広域 DNS-SD の両方で省略されます（SSH のデフォルトは `22`）。 |
  | `cliPath=<path>`            | `sshPort` と同じく `discovery.mdns.mode="full"` の場合にのみ存在します。リモートインストール環境向けの CLI パスのヒントです。                                    |

  将来のキャンバスホストポート用として、Plugin の検出コントラクトには `canvasPort` TXT キーが定義されていますが、現在この値を設定するコードパスはないため、現時点では出力されません。

セキュリティに関する注記:

- Bonjour/mDNS の TXT レコードは**認証されていません**。クライアントは TXT 値をユーザー体験向けのヒントとしてのみ扱う必要があります。
- ルーティング（ホスト/ポート）では、TXT で提供される `lanHost`、`tailnetDns`、`gatewayPort` よりも、**解決済みのサービスエンドポイント**（SRV + A/AAAA）を優先する必要があります。
- TLS ピンニングでは、アドバタイズされた `gatewayTlsSha256` によって、以前に保存されたピンを上書きしてはなりません。
- 選択されたルートがセキュア/TLS ベースの場合、iOS/Android Node は初回のピンを保存する前に、明示的な「このフィンガープリントを信頼する」確認（帯域外検証）を要求する必要があります。

有効化、無効化、上書き:

- `openclaw plugins enable bonjour` は LAN マルチキャストアドバタイズを有効にします。
- `openclaw.json` の `discovery.mdns.mode` は mDNS ブロードキャストを制御します。`"minimal"`（デフォルト）、`"full"`（LAN ビーコンと広域 DNS-SD ゾーンの両方に `cliPath`/`sshPort` を追加）、または `"off"`（mDNS を無効化）を指定できます。
- `OPENCLAW_DISABLE_BONJOUR=1` はアドバタイズを強制的に無効化し、`discovery.mdns.mode="off"` はこれとは独立して無効化します。`OPENCLAW_DISABLE_BONJOUR=0` は明示的なオプトインであり、検出されたコンテナ（Docker、containerd、Kubernetes、LXC）内での Plugin の自動無効化を上書きしますが、`discovery.mdns.mode="off"` は上書きしません。バンドルされた `bonjour` Plugin は macOS ホストで自動起動し（`enabledByDefaultOnPlatforms: ["darwin"]`）、検出されたコンテナ内では自動的に無効化されます。Linux、Windows、およびその他のコンテナ化されたデプロイでは、明示的に `plugins enable bonjour` を実行する必要があります。
- `~/.openclaw/openclaw.json` の `gateway.bind` は Gateway のバインドモードを制御します。
- `OPENCLAW_SSH_PORT` は、アドバタイズされる SSH ポートを上書きします（`discovery.mdns.mode="full"` の場合にのみ有効です）。
- `OPENCLAW_TAILNET_DNS` は `tailnetDns` ヒント（MagicDNS）を公開します。
- `OPENCLAW_CLI_PATH` は、アドバタイズされる CLI パスを上書きします。

### 2) Tailnet（ネットワーク間）

異なる物理ネットワーク上にある Gateway の場合、Bonjour は役に立ちません。推奨される直接接続先は、Tailscale の MagicDNS 名（推奨）または固定の tailnet IP です。

Gateway が Tailscale 環境で実行されていることを検出すると、クライアント向けのオプションのヒントとして `tailnetDns` を公開します（広域ビーコンを含む）。macOS アプリは Gateway の検出時に、生の Tailscale IP より MagicDNS 名を優先します。Node の再起動や CGNAT の再割り当てによって tailnet IP が変化しても、MagicDNS は現在の IP を自動的に解決するため、信頼性が保たれます。

モバイル Node のペアリングでは、検出ヒントによって tailnet/公開ルート上のトランスポートセキュリティ要件が緩和されることはありません。

- iOS/Android では、初回の tailnet/公開接続に引き続きセキュアな経路（`wss://` または Tailscale Serve/Funnel）が必要です。
- 検出された生の tailnet IP はルーティングのヒントであり、平文のリモート `ws://` を使用する許可ではありません。
- プライベート LAN への直接接続では、引き続き `ws://` を使用できます。
- モバイル Node で最も簡単に Tailscale を使用するには、Tailscale Serve を使用してください。これにより、検出とセットアップの両方で同じセキュアな MagicDNS エンドポイントが解決されます。

### 3) 手動 / SSH 接続先

直接接続経路がない場合（または直接接続が無効な場合）、クライアントは local loopback の Gateway ポートを転送することで、いつでも SSH 経由で接続できます。[リモートアクセス](/ja-JP/gateway/remote)を参照してください。

## トランスポートの選択（クライアントポリシー）

1. ペアリング済みの直接接続エンドポイントが設定され、到達可能な場合は、それを使用します。
2. それ以外で、検出によって `local.` または設定済みの広域ドメイン上に Gateway が見つかった場合は、ワンタップの「この Gateway を使用」選択肢を提示し、直接接続エンドポイントとして保存します。
3. それ以外で、tailnet DNS/IP が設定されている場合は、直接接続を試行します。tailnet/公開ルート上のモバイル Node では、直接接続とはセキュアなエンドポイントを意味し、平文のリモート `ws://` は意味しません。
4. それ以外の場合は、SSH にフォールバックします。

## ペアリングと認証（直接トランスポート）

Node/クライアントの受け入れについては、Gateway が信頼できる唯一の情報源です。

- ペアリング要求は Gateway で作成、承認、拒否されます（[Gateway のペアリング](/ja-JP/gateway/pairing)を参照）。
- Gateway は認証（トークン/キーペア）、スコープ/ACL（すべてのメソッドへの単なる生のプロキシではありません）、およびレート制限を適用します。

## コンポーネントごとの責務

- **Gateway**: 検出ビーコンをアドバタイズし、ペアリングの決定を管理し、WS エンドポイントをホストします。
- **macOS アプリ**: Gateway の選択を支援し、ペアリングプロンプトを表示し、フォールバックとしてのみ SSH を使用します。
- **iOS/Android Node**: 利便性のために Bonjour を参照し、ペアリング済みの Gateway WS に接続します。

## 関連項目

- [リモートアクセス](/ja-JP/gateway/remote)
- [Tailscale](/ja-JP/gateway/tailscale)
- [Bonjour による検出](/ja-JP/gateway/bonjour)
