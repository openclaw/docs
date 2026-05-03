---
read_when:
    - Bonjour の検出/アドバタイズを実装または変更する
    - リモート接続モード（直接接続と SSH）の調整
    - リモートノード向けのノード検出 + ペアリングの設計
summary: Node の検出と Gateway を見つけるためのトランスポート (Bonjour, Tailscale, SSH)
title: 検出とトランスポート
x-i18n:
    generated_at: "2026-05-03T21:32:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41a5ed7a910ae4bbdfa21a81882c3b1af0c16622fa20a5e616b666390dccdc9c
    source_path: gateway/discovery.md
    workflow: 16
---

# 検出とトランスポート

OpenClaw には、表面的には似て見える 2 つの異なる問題があります。

1. **オペレーターのリモート制御**: macOS メニューバーアプリが別の場所で動作している Gateway を制御すること。
2. **Node ペアリング**: iOS/Android（および将来の Node）が Gateway を見つけ、安全にペアリングすること。

設計目標は、すべてのネットワーク検出/広告を **Node Gateway**（`openclaw gateway`）に集約し、クライアント（mac アプリ、iOS）をその利用側に保つことです。

## 用語

- **Gateway**: 状態（セッション、ペアリング、Node レジストリ）を所有し、チャネルを実行する単一の長時間実行 Gateway プロセス。ほとんどのセットアップではホストごとに 1 つ使用しますが、分離された複数 Gateway セットアップも可能です。
- **Gateway WS（制御プレーン）**: 既定では `127.0.0.1:18789` 上の WebSocket エンドポイント。`gateway.bind` によって LAN/tailnet にバインドできます。
- **Direct WS トランスポート**: LAN/tailnet 向けの Gateway WS エンドポイント（SSH なし）。
- **SSH トランスポート（フォールバック）**: SSH 経由で `127.0.0.1:18789` を転送するリモート制御。
- **レガシー TCP ブリッジ（削除済み）**: 古い Node トランスポート（[Bridge プロトコル](/ja-JP/gateway/bridge-protocol)を参照）。検出用には広告されなくなり、現在のビルドにも含まれていません。

プロトコルの詳細:

- [Gateway プロトコル](/ja-JP/gateway/protocol)
- [Bridge プロトコル（レガシー）](/ja-JP/gateway/bridge-protocol)

## 「直接」と SSH の両方を維持する理由

- **Direct WS** は同一ネットワーク上および tailnet 内で最良の UX です:
  - Bonjour による LAN 上の自動検出
  - Gateway が所有するペアリングトークン + ACL
  - シェルアクセス不要。プロトコル表面を限定的で監査しやすい状態に保てる
- **SSH** は汎用フォールバックとして残ります:
  - SSH アクセスがある場所ならどこでも動作する（無関係なネットワーク間でも）
  - マルチキャスト/mDNS の問題に耐えられる
  - SSH 以外の新しい受信ポートを必要としない

## 検出入力（クライアントが Gateway の場所を知る方法）

### 1) Bonjour / DNS-SD 検出

マルチキャスト Bonjour はベストエフォートであり、ネットワークをまたぎません。OpenClaw は、設定された広域 DNS-SD ドメイン経由で同じ Gateway ビーコンを参照することもできるため、検出は次をカバーできます:

- 同一 LAN 上の `local.`
- クロスネットワーク検出用に設定されたユニキャスト DNS-SD ドメイン

目標方向:

- バンドルされた `bonjour` Plugin が有効な場合、**Gateway** は Bonjour 経由で WS エンドポイントを広告します。この Plugin は macOS ホストでは自動起動し、それ以外ではオプトインです。
- クライアントは参照して「Gateway を選択」リストを表示し、選択されたエンドポイントを保存します。

トラブルシューティングとビーコンの詳細: [Bonjour](/ja-JP/gateway/bonjour)。

#### サービスビーコンの詳細

- サービスタイプ:
  - `_openclaw-gw._tcp`（Gateway トランスポートビーコン）
- TXT キー（非シークレット）:
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>`（オペレーター設定の表示名）
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789`（Gateway WS + HTTP）
  - `gatewayTls=1`（TLS が有効な場合のみ）
  - `gatewayTlsSha256=<sha256>`（TLS が有効でフィンガープリントが利用可能な場合のみ）
  - `canvasPort=<port>`（canvas ホストポート。現在は canvas ホストが有効な場合 `gatewayPort` と同じ）
  - `tailnetDns=<magicdns>`（任意のヒント。Tailscale が利用可能な場合に自動検出）
  - `sshPort=<port>`（mDNS フルモードのみ。広域 DNS-SD では省略される場合があり、その場合 SSH の既定値は `22` のまま）
  - `cliPath=<path>`（mDNS フルモードのみ。広域 DNS-SD でもリモートインストールのヒントとして書き込まれます）

セキュリティメモ:

- Bonjour/mDNS TXT レコードは**認証されていません**。クライアントは TXT 値を UX ヒントとしてのみ扱う必要があります。
- ルーティング（ホスト/ポート）は、TXT で提供される `lanHost`、`tailnetDns`、または `gatewayPort` よりも、**解決済みサービスエンドポイント**（SRV + A/AAAA）を優先するべきです。
- TLS ピン留めでは、広告された `gatewayTlsSha256` が以前に保存されたピンを上書きすることを決して許可してはなりません。
- iOS/Android Node は、選択された経路がセキュア/TLS ベースの場合、初回ピンを保存する前に明示的な「このフィンガープリントを信頼する」確認（帯域外検証）を要求するべきです。

有効化/無効化/上書き:

- `openclaw plugins enable bonjour` は LAN マルチキャスト広告を有効化します。
- `OPENCLAW_DISABLE_BONJOUR=1` は広告を無効化します。
- Bonjour Plugin が有効で `OPENCLAW_DISABLE_BONJOUR` が未設定の場合、Bonjour は通常のホスト上で広告し、検出されたコンテナ内では自動的に無効化されます。空設定の macOS Gateway 起動では Plugin が自動的に有効化されます。Linux、Windows、コンテナ化されたデプロイでは明示的な有効化が必要です。ホスト、macvlan、またはその他の mDNS 対応ネットワーク上でのみ `0` を使用し、強制無効化には `1` を使用します。
- `~/.openclaw/openclaw.json` 内の `gateway.bind` が Gateway のバインドモードを制御します。
- `OPENCLAW_SSH_PORT` は、`sshPort` が出力される場合に広告される SSH ポートを上書きします。
- `OPENCLAW_TAILNET_DNS` は `tailnetDns` ヒント（MagicDNS）を公開します。
- `OPENCLAW_CLI_PATH` は広告される CLI パスを上書きします。

### 2) Tailnet（クロスネットワーク）

London/Vienna のようなセットアップでは、Bonjour は役に立ちません。推奨される「直接」ターゲットは次のとおりです:

- Tailscale MagicDNS 名（推奨）または安定した tailnet IP。

Gateway が Tailscale 配下で動作していることを検出できる場合、クライアント向けの任意ヒント（広域ビーコンを含む）として `tailnetDns` を公開します。

macOS アプリは、Gateway 検出で生の Tailscale IP よりも MagicDNS 名を優先するようになりました。tailnet IP が変わる場合（たとえば Node 再起動後や CGNAT 再割り当て後）でも、MagicDNS 名は現在の IP に自動解決されるため、信頼性が向上します。

モバイル Node ペアリングでは、検出ヒントが tailnet/公開経路上のトランスポートセキュリティを緩和することはありません:

- iOS/Android は、tailnet/公開の初回接続経路に引き続きセキュアな経路（`wss://` または Tailscale Serve/Funnel）を要求します。
- 検出された生の tailnet IP はルーティングヒントであり、プレーンテキストのリモート `ws://` を使用する許可ではありません。
- プライベート LAN の直接接続 `ws://` は引き続きサポートされます。
- モバイル Node 向けに最も単純な Tailscale 経路を使いたい場合は、検出とセットアップコードの両方が同じセキュアな MagicDNS エンドポイントに解決されるように Tailscale Serve を使用してください。

### 3) 手動 / SSH ターゲット

直接経路がない場合（または直接が無効な場合）、クライアントはループバック Gateway ポートを転送することで常に SSH 経由で接続できます。

[リモートアクセス](/ja-JP/gateway/remote)を参照してください。

## トランスポート選択（クライアントポリシー）

推奨されるクライアント動作:

1. ペアリング済みの直接エンドポイントが設定され、到達可能な場合は、それを使用します。
2. それ以外で、検出により `local.` または設定された広域ドメイン上で Gateway が見つかった場合は、ワンタップの「この Gateway を使用」選択肢を提示し、直接エンドポイントとして保存します。
3. それ以外で、tailnet DNS/IP が設定されている場合は、直接接続を試します。
   tailnet/公開経路上のモバイル Node では、直接とはセキュアなエンドポイントを意味し、プレーンテキストのリモート `ws://` ではありません。
4. それ以外の場合は SSH にフォールバックします。

## ペアリング + 認証（直接トランスポート）

Gateway は Node/クライアントの受け入れに関する信頼できる情報源です。

- ペアリング要求は Gateway 内で作成/承認/拒否されます（[Gateway ペアリング](/ja-JP/gateway/pairing)を参照）。
- Gateway は次を強制します:
  - 認証（トークン / キーペア）
  - スコープ/ACL（Gateway はすべてのメソッドへの生プロキシではありません）
  - レート制限

## コンポーネント別の責任

- **Gateway**: 検出ビーコンを広告し、ペアリング判断を所有し、WS エンドポイントをホストします。
- **macOS アプリ**: Gateway の選択を支援し、ペアリングプロンプトを表示し、SSH はフォールバックとしてのみ使用します。
- **iOS/Android Node**: 利便性のために Bonjour を参照し、ペアリング済み Gateway WS に接続します。

## 関連

- [リモートアクセス](/ja-JP/gateway/remote)
- [Tailscale](/ja-JP/gateway/tailscale)
- [Bonjour 検出](/ja-JP/gateway/bonjour)
