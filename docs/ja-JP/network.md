---
read_when:
    - ネットワークアーキテクチャ + セキュリティ概要が必要です
    - ローカルアクセスとテールネットアクセス、またはペアリングをデバッグしている
    - ネットワーク関連ドキュメントの正規リストが必要です
summary: 'ネットワークハブ: Gateway サーフェス、ペアリング、検出、セキュリティ'
title: ネットワーク
x-i18n:
    generated_at: "2026-07-05T11:33:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9751bb0fe71009455b243b109ef7ef4eda08d58f940f7dcef305800a5ed89586
    source_path: network.md
    workflow: 16
---

このハブは、OpenClaw が localhost、LAN、tailnet にまたがってデバイスを接続、ペアリング、保護する方法についての主要ドキュメントにリンクします。

## コアモデル

ほとんどの操作は、チャネル接続と WebSocket コントロールプレーンを所有する単一の長時間実行プロセスである Gateway (`openclaw gateway`) を経由します。

- **まずループバック**: Gateway WS のデフォルトは `ws://127.0.0.1:18789` です。
  非ループバックのバインドは、有効な Gateway 認証パスがない場合は起動を拒否します:
  共有シークレットのトークン/パスワード認証、または正しく構成された非ループバックの
  `trusted-proxy` デプロイメントです。
- **ホストごとに 1 つの Gateway** を推奨します。分離が必要な場合は、分離されたプロファイルとポートで複数の Gateway を実行します ([複数の Gateway](/ja-JP/gateway/multiple-gateways))。
- **Canvas ホスト** は Gateway と同じポートで提供されます (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`)。ループバックを越えてバインドされる場合は Gateway 認証で保護されます。
- **リモートアクセス** は通常、SSH トンネルまたは Tailscale VPN です ([リモートアクセス](/ja-JP/gateway/remote))。

主な参考資料:

- [Gateway アーキテクチャ](/ja-JP/concepts/architecture)
- [Gateway プロトコル](/ja-JP/gateway/protocol)
- [Gateway ランブック](/ja-JP/gateway)
- [Web サーフェス + バインドモード](/ja-JP/web)

## ペアリング + ID

- [ペアリング概要 (DM + ノード)](/ja-JP/channels/pairing)
- [Gateway 所有のノードペアリング](/ja-JP/gateway/pairing)
- [デバイス CLI (ペアリング + トークンローテーション)](/ja-JP/cli/devices)
- [ペアリング CLI (DM 承認)](/ja-JP/cli/pairing)

ローカルの信頼:

- 直接の local loopback 接続 (転送/プロキシヘッダーなし) は、同一ホスト上の UX をスムーズに保つため、ペアリングで自動承認できます。
- OpenClaw には、信頼された共有シークレットのヘルパーフロー向けに、狭いバックエンド/コンテナローカルの自己接続パスもあります。
- 同一ホストの tailnet バインドを含む tailnet および LAN クライアントでは、引き続き明示的なペアリング承認が必要です。

## 検出 + トランスポート

- [検出とトランスポート](/ja-JP/gateway/discovery)
- [Bonjour / mDNS](/ja-JP/gateway/bonjour)
- [リモートアクセス (SSH)](/ja-JP/gateway/remote)
- [Tailscale](/ja-JP/gateway/tailscale)

## ノード + トランスポート

- [ノード概要](/ja-JP/nodes)
- [ブリッジプロトコル (レガシーノード、履歴)](/ja-JP/gateway/bridge-protocol)
- [ノードランブック: iOS](/ja-JP/platforms/ios)
- [ノードランブック: Android](/ja-JP/platforms/android)

## セキュリティ

- [セキュリティ概要](/ja-JP/gateway/security)
- [Gateway 設定リファレンス](/ja-JP/gateway/configuration)
- [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- [Doctor](/ja-JP/gateway/doctor)

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [リモートアクセス](/ja-JP/gateway/remote)
