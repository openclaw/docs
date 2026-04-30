---
read_when:
    - Bonjour の検出/アドバタイズの実装または変更
    - リモート接続モードの調整（direct と SSH）
    - リモートNode向けのNode検出 + ペアリングの設計
summary: Gateway を見つけるための Node 検出とトランスポート（Bonjour、Tailscale、SSH）
title: 検出とトランスポート
x-i18n:
    generated_at: "2026-04-30T05:12:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: c396e6e07808e2571c6d7f539922b94443adbf39339027e6e962596c6f13deaa
    source_path: gateway/discovery.md
    workflow: 16
---

# 検出とトランスポート

OpenClaw には、表面的には似て見える 2 つの異なる問題があります。

1. **オペレーターのリモート制御**: 別の場所で実行されている gateway を制御する macOS メニューバーアプリ。
2. **Node ペアリング**: iOS/Android（および将来の Node）が gateway を見つけ、安全にペアリングすること。

設計目標は、すべてのネットワーク検出/広告を **Node Gateway**（`openclaw gateway`）に集約し、クライアント（mac アプリ、iOS）はコンシューマーとして扱うことです。

## 用語

- **Gateway**: 状態（セッション、ペアリング、Node レジストリ）を所有し、チャネルを実行する単一の長時間実行 gateway プロセス。ほとんどのセットアップではホストごとに 1 つ使用します。分離された複数 gateway セットアップも可能です。
- **Gateway WS（コントロールプレーン）**: 既定では `127.0.0.1:18789` の WebSocket エンドポイント。`gateway.bind` によって LAN/tailnet にバインドできます。
- **直接 WS トランスポート**: LAN/tailnet 向けの Gateway WS エンドポイント（SSH なし）。
- **SSH トランスポート（フォールバック）**: SSH 経由で `127.0.0.1:18789` を転送するリモート制御。
- **レガシー TCP ブリッジ（削除済み）**: 古い Node トランスポート（[Bridge プロトコル](/ja-JP/gateway/bridge-protocol)を参照）。検出用には広告されなくなり、現在のビルドにも含まれなくなりました。

プロトコルの詳細:

- [Gateway プロトコル](/ja-JP/gateway/protocol)
- [Bridge プロトコル（レガシー）](/ja-JP/gateway/bridge-protocol)

## 「直接」と SSH の両方を維持する理由

- **直接 WS** は、同一ネットワーク上および tailnet 内で最良の UX です:
  - Bonjour による LAN 上の自動検出
  - gateway が所有するペアリングトークン + ACL
  - シェルアクセス不要。プロトコル面を小さく保ち、監査しやすくできます
- **SSH** は汎用的なフォールバックのままです:
  - SSH アクセスがある場所ならどこでも動作します（無関係なネットワークをまたぐ場合でも）
  - マルチキャスト/mDNS の問題に強い
  - SSH 以外の新しいインバウンドポートを必要としません

## 検出入力（クライアントが gateway の場所を知る方法）

### 1) Bonjour / DNS-SD 検出

マルチキャスト Bonjour はベストエフォートであり、ネットワークを越えません。OpenClaw は、設定された広域 DNS-SD ドメイン経由でも同じ gateway ビーコンを参照できるため、検出は次を対象にできます:

- 同じ LAN 上の `local.`
- ネットワークをまたぐ検出用に設定されたユニキャスト DNS-SD ドメイン

目標の方向性:

- **gateway** は Bonjour 経由で WS エンドポイントを広告します。
- クライアントは参照して「gateway を選択」リストを表示し、選択されたエンドポイントを保存します。

トラブルシューティングとビーコンの詳細: [Bonjour](/ja-JP/gateway/bonjour)。

#### サービスビーコンの詳細

- サービスタイプ:
  - `_openclaw-gw._tcp`（gateway トランスポートビーコン）
- TXT キー（非機密）:
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>`（オペレーターが設定した表示名）
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789`（Gateway WS + HTTP）
  - `gatewayTls=1`（TLS が有効な場合のみ）
  - `gatewayTlsSha256=<sha256>`（TLS が有効でフィンガープリントが利用可能な場合のみ）
  - `canvasPort=<port>`（canvas host ポート。現在は canvas host が有効な場合 `gatewayPort` と同じ）
  - `tailnetDns=<magicdns>`（任意のヒント。Tailscale が利用可能な場合に自動検出）
  - `sshPort=<port>`（mDNS フルモードのみ。広域 DNS-SD では省略される場合があり、その場合 SSH の既定値は `22` のままです）
  - `cliPath=<path>`（mDNS フルモードのみ。広域 DNS-SD でもリモートインストールのヒントとして書き込みます）

セキュリティメモ:

- Bonjour/mDNS TXT レコードは**認証されていません**。クライアントは TXT 値を UX ヒントとしてのみ扱う必要があります。
- ルーティング（ホスト/ポート）は、TXT で提供される `lanHost`、`tailnetDns`、`gatewayPort` よりも、**解決済みサービスエンドポイント**（SRV + A/AAAA）を優先するべきです。
- TLS ピンニングでは、広告された `gatewayTlsSha256` が以前に保存されたピンを上書きすることを絶対に許可してはいけません。
- iOS/Android Node は、選択されたルートがセキュア/TLS ベースである場合、初回ピンを保存する前に明示的な「このフィンガープリントを信頼」確認（帯域外検証）を要求するべきです。

無効化/上書き:

- `OPENCLAW_DISABLE_BONJOUR=1` は広告を無効化します。
- `OPENCLAW_DISABLE_BONJOUR` が未設定の場合、Bonjour は通常のホストで広告し、検出されたコンテナ内では自動的に無効化されます。`0` はホスト、macvlan、またはその他の mDNS 対応ネットワークでのみ使用してください。強制的に無効化するには `1` を使用してください。
- `~/.openclaw/openclaw.json` の `gateway.bind` が Gateway のバインドモードを制御します。
- `OPENCLAW_SSH_PORT` は、`sshPort` が出力される場合に広告される SSH ポートを上書きします。
- `OPENCLAW_TAILNET_DNS` は `tailnetDns` ヒント（MagicDNS）を公開します。
- `OPENCLAW_CLI_PATH` は広告される CLI パスを上書きします。

### 2) Tailnet（ネットワーク横断）

London/Vienna 型のセットアップでは、Bonjour は役に立ちません。推奨される「直接」ターゲットは次です:

- Tailscale MagicDNS 名（推奨）または安定した tailnet IP。

gateway が Tailscale 上で実行されていることを検出できる場合、クライアント向けの任意のヒントとして `tailnetDns` を公開します（広域ビーコンを含む）。

macOS アプリは、gateway 検出で生の Tailscale IP より MagicDNS 名を優先するようになりました。これにより、tailnet IP が変わる場合（たとえば Node の再起動後や CGNAT の再割り当て後）でも、MagicDNS 名が現在の IP に自動的に解決されるため信頼性が向上します。

モバイル Node ペアリングでは、検出ヒントによって tailnet/公開ルートのトランスポートセキュリティが緩和されることはありません:

- iOS/Android は、初回の tailnet/公開接続パスとして引き続きセキュアなもの（`wss://` または Tailscale Serve/Funnel）を要求します。
- 検出された生の tailnet IP はルーティングヒントであり、平文のリモート `ws://` を使用する許可ではありません。
- プライベート LAN の直接接続 `ws://` は引き続きサポートされます。
- モバイル Node 向けに最も単純な Tailscale パスが必要な場合は、Tailscale Serve を使用して、検出とセットアップコードの両方が同じセキュアな MagicDNS エンドポイントに解決されるようにしてください。

### 3) 手動 / SSH ターゲット

直接ルートがない（または直接が無効化されている）場合、クライアントは local loopback gateway ポートを転送することで、常に SSH 経由で接続できます。

[リモートアクセス](/ja-JP/gateway/remote)を参照してください。

## トランスポート選択（クライアントポリシー）

推奨されるクライアントの動作:

1. ペアリング済みの直接エンドポイントが設定されていて到達可能な場合は、それを使用します。
2. それ以外で、検出によって `local.` または設定された広域ドメイン上に gateway が見つかった場合は、ワンタップの「この gateway を使用」選択肢を提示し、直接エンドポイントとして保存します。
3. それ以外で、tailnet DNS/IP が設定されている場合は、直接接続を試します。
   tailnet/公開ルート上のモバイル Node では、直接とはセキュアなエンドポイントを意味し、平文のリモート `ws://` ではありません。
4. それ以外の場合は、SSH にフォールバックします。

## ペアリング + 認証（直接トランスポート）

gateway は Node/クライアントの参加許可に関する信頼できる情報源です。

- ペアリング要求は gateway で作成/承認/拒否されます（[Gateway ペアリング](/ja-JP/gateway/pairing)を参照）。
- gateway は次を強制します:
  - 認証（トークン / キーペア）
  - スコープ/ACL（gateway はすべてのメソッドへの生のプロキシではありません）
  - レート制限

## コンポーネント別の責務

- **Gateway**: 検出ビーコンを広告し、ペアリング判断を所有し、WS エンドポイントをホストします。
- **macOS アプリ**: gateway の選択を支援し、ペアリングプロンプトを表示し、SSH はフォールバックとしてのみ使用します。
- **iOS/Android Node**: 利便性のために Bonjour を参照し、ペアリング済みの Gateway WS に接続します。

## 関連

- [リモートアクセス](/ja-JP/gateway/remote)
- [Tailscale](/ja-JP/gateway/tailscale)
- [Bonjour 検出](/ja-JP/gateway/bonjour)
