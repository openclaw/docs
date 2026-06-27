---
read_when:
    - Bonjour 検出/アドバタイズの実装または変更
    - リモート接続モードの調整（直接接続と SSH）
    - リモート Node 向けの Node 検出 + ペアリング設計
summary: Gateway を見つけるための Node 検出とトランスポート (Bonjour, Tailscale, SSH)
title: 検出とトランスポート
x-i18n:
    generated_at: "2026-05-06T05:05:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f53e1292d9e5b402186c48c777e7e665c790981a64679c783ae8d8a1f170ee1
    source_path: gateway/discovery.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw には、表面上は似て見える 2 つの別個の問題があります。

1. **オペレーターのリモート制御**: macOS メニューバーアプリが別の場所で動作している Gateway を制御すること。
2. **Node ペアリング**: iOS/Android (および将来の Node) が Gateway を見つけて安全にペアリングすること。

設計目標は、すべてのネットワーク検出/広告を **Node Gateway** (`openclaw gateway`) に集約し、クライアント (Mac アプリ、iOS) は利用側に徹することです。

## 用語

- **Gateway**: 状態 (セッション、ペアリング、Node レジストリ) を所有し、チャンネルを実行する単一の長時間稼働 Gateway プロセス。ほとんどのセットアップではホストごとに 1 つを使用しますが、分離されたマルチ Gateway セットアップも可能です。
- **Gateway WS (コントロールプレーン)**: デフォルトでは `127.0.0.1:18789` の WebSocket エンドポイント。`gateway.bind` により LAN/tailnet にバインドできます。
- **Direct WS トランスポート**: LAN/tailnet 向けの Gateway WS エンドポイント (SSH なし)。
- **SSH トランスポート (フォールバック)**: SSH 経由で `127.0.0.1:18789` を転送するリモート制御。
- **レガシー TCP ブリッジ (削除済み)**: 古い Node トランスポート (詳しくは
  [ブリッジプロトコル](/ja-JP/gateway/bridge-protocol))。検出では広告されなくなり、
  現在のビルドにも含まれていません。

プロトコルの詳細:

- [Gateway プロトコル](/ja-JP/gateway/protocol)
- [ブリッジプロトコル (レガシー)](/ja-JP/gateway/bridge-protocol)

## direct と SSH の両方を維持する理由

- **Direct WS** は同一ネットワーク上および tailnet 内で最良の UX です:
  - Bonjour による LAN 上の自動検出
  - Gateway が所有するペアリングトークン + ACL
  - シェルアクセスは不要。プロトコル面を小さく監査しやすい状態に保てる
- **SSH** は引き続き汎用フォールバックです:
  - SSH アクセスがある場所ならどこでも動作する (無関係なネットワーク間でも)
  - multicast/mDNS の問題を回避できる
  - SSH 以外の新しいインバウンドポートを必要としない

## 検出入力 (クライアントが Gateway の場所を知る方法)

### 1) Bonjour / DNS-SD 検出

Multicast Bonjour はベストエフォートであり、ネットワークをまたぎません。OpenClaw は、設定された広域 DNS-SD ドメイン経由で同じ Gateway ビーコンを参照することもできるため、検出は次をカバーできます:

- 同一 LAN 上の `local.`
- ネットワーク横断検出用に設定された unicast DNS-SD ドメイン

目標とする方向:

- **Gateway** は同梱の
  `bonjour` Plugin が有効な場合、Bonjour 経由で WS エンドポイントを広告します。この Plugin は macOS ホストでは自動開始し、
  それ以外では opt-in です。
- クライアントは参照して「Gateway を選択」リストを表示し、その後、選択したエンドポイントを保存します。

トラブルシューティングとビーコンの詳細: [Bonjour](/ja-JP/gateway/bonjour)。

#### サービスビーコンの詳細

- サービスタイプ:
  - `_openclaw-gw._tcp` (Gateway トランスポートビーコン)
- TXT キー (非シークレット):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (オペレーターが設定する表示名)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (TLS が有効な場合のみ)
  - `gatewayTlsSha256=<sha256>` (TLS が有効でフィンガープリントが利用可能な場合のみ)
  - `canvasPort=<port>` (キャンバスホストポート。現在は、キャンバスホストが有効な場合 `gatewayPort` と同じ)
  - `tailnetDns=<magicdns>` (任意のヒント。Tailscale が利用可能な場合に自動検出)
  - `sshPort=<port>` (mDNS フルモードのみ。広域 DNS-SD では省略される場合があり、その場合 SSH のデフォルトは `22` のまま)
  - `cliPath=<path>` (mDNS フルモードのみ。広域 DNS-SD でもリモートインストールのヒントとして書き込まれる)

セキュリティ上の注意:

- Bonjour/mDNS TXT レコードは**認証されません**。クライアントは TXT 値を UX ヒントとしてのみ扱う必要があります。
- ルーティング (ホスト/ポート) では、TXT で提供される `lanHost`、`tailnetDns`、`gatewayPort` よりも、**解決されたサービスエンドポイント** (SRV + A/AAAA) を優先するべきです。
- TLS pinning では、広告された `gatewayTlsSha256` が以前に保存された pin を上書きすることを絶対に許可してはいけません。
- iOS/Android Node は、選択された経路がセキュア/TLS ベースの場合、初回 pin を保存する前に明示的な「このフィンガープリントを信頼する」確認 (帯域外検証) を要求するべきです。

有効化/無効化/上書き:

- `openclaw plugins enable bonjour` は LAN multicast 広告を有効にします。
- `OPENCLAW_DISABLE_BONJOUR=1` は広告を無効にします。
- Bonjour Plugin が有効で `OPENCLAW_DISABLE_BONJOUR` が未設定の場合、
  Bonjour は通常のホストで広告し、検出されたコンテナ内では自動的に無効化されます。
  空設定の macOS Gateway 起動では Plugin が自動的に有効化されます。Linux、
  Windows、コンテナ化されたデプロイでは明示的な有効化が必要です。
  ホスト、macvlan、またはその他の mDNS 対応ネットワークでのみ `0` を使用し、
  強制的に無効化するには `1` を使用します。
- `~/.openclaw/openclaw.json` の `gateway.bind` は Gateway のバインドモードを制御します。
- `OPENCLAW_SSH_PORT` は、`sshPort` が出力される場合に広告される SSH ポートを上書きします。
- `OPENCLAW_TAILNET_DNS` は `tailnetDns` ヒント (MagicDNS) を公開します。
- `OPENCLAW_CLI_PATH` は広告される CLI パスを上書きします。

### 2) Tailnet (ネットワーク横断)

London/Vienna スタイルのセットアップでは、Bonjour は役に立ちません。推奨される「direct」ターゲットは次のとおりです:

- Tailscale MagicDNS 名 (推奨) または安定した tailnet IP。

Gateway が Tailscale 上で動作していることを検出できる場合、クライアント向けの任意ヒントとして `tailnetDns` を公開します (広域ビーコンを含む)。

macOS アプリは現在、Gateway 検出で生の Tailscale IP よりも MagicDNS 名を優先します。これにより、tailnet IP が変わる場合 (たとえば Node 再起動後や CGNAT 再割り当て後) の信頼性が向上します。MagicDNS 名は現在の IP に自動的に解決されるためです。

モバイル Node ペアリングでは、検出ヒントによって tailnet/public ルート上のトランスポートセキュリティは緩和されません:

- iOS/Android は引き続き、初回の tailnet/public 接続経路としてセキュアなもの (`wss://` または Tailscale Serve/Funnel) を必要とします。
- 検出された生の tailnet IP はルーティングヒントであり、プレーンテキストのリモート `ws://` を使用する許可ではありません。
- プライベート LAN の直接接続 `ws://` は引き続きサポートされます。
- モバイル Node 向けに最も簡単な Tailscale 経路が必要な場合は、Tailscale Serve を使用し、検出とセットアップコードの両方が同じセキュアな MagicDNS エンドポイントに解決されるようにします。

### 3) 手動 / SSH ターゲット

direct ルートがない (または direct が無効な) 場合、クライアントは loopback Gateway ポートを転送することで常に SSH 経由で接続できます。

詳しくは [リモートアクセス](/ja-JP/gateway/remote) を参照してください。

## トランスポート選択 (クライアントポリシー)

推奨されるクライアントの動作:

1. ペアリング済みの direct エンドポイントが設定され、到達可能であれば、それを使用します。
2. それ以外の場合、検出で `local.` または設定された広域ドメイン上に Gateway が見つかったら、ワンタップの「この Gateway を使用」選択肢を提示し、それを direct エンドポイントとして保存します。
3. それ以外の場合、tailnet DNS/IP が設定されていれば direct を試します。
   tailnet/public ルート上のモバイル Node では、direct はセキュアなエンドポイントを意味し、プレーンテキストのリモート `ws://` ではありません。
4. それ以外の場合、SSH にフォールバックします。

## ペアリング + 認証 (direct トランスポート)

Gateway は Node/クライアントの許可に関する信頼できる情報源です。

- ペアリング要求は Gateway で作成/承認/拒否されます (詳しくは [Gateway ペアリング](/ja-JP/gateway/pairing) を参照)。
- Gateway は次を強制します:
  - 認証 (トークン / キーペア)
  - スコープ/ACL (Gateway はすべてのメソッドへの生のプロキシではない)
  - レート制限

## コンポーネント別の責任

- **Gateway**: 検出ビーコンを広告し、ペアリング判断を所有し、WS エンドポイントをホストします。
- **macOS アプリ**: Gateway の選択を支援し、ペアリングプロンプトを表示し、SSH はフォールバックとしてのみ使用します。
- **iOS/Android Node**: 利便性のために Bonjour を参照し、ペアリング済みの Gateway WS に接続します。

## 関連

- [リモートアクセス](/ja-JP/gateway/remote)
- [Tailscale](/ja-JP/gateway/tailscale)
- [Bonjour 検出](/ja-JP/gateway/bonjour)
