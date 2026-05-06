---
read_when:
    - ネットワークアーキテクチャとセキュリティ概要が必要です
    - ローカルアクセスと tailnet アクセス、またはペアリングをデバッグしている場合
    - ネットワーク関連ドキュメントの正式な一覧が必要な場合
summary: 'ネットワークハブ: Gateway のサーフェス、ペアリング、検出、セキュリティ'
title: ネットワーク
x-i18n:
    generated_at: "2026-05-06T05:11:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b0ff6c4ee46005aeac1612ea40f1ce3d5824aa507d0842788dbf4bffbaccfcc
    source_path: network.md
    workflow: 16
---

このハブは、OpenClaw が localhost、LAN、tailnet 全体でデバイスを接続、ペアリング、保護する方法についての中核ドキュメントへのリンク集です。

## 中核モデル

ほとんどの操作は Gateway (`openclaw gateway`) を通じて流れます。これはチャネル接続と WebSocket 制御プレーンを所有する、単一の長時間実行プロセスです。

- **まずループバック**: Gateway WS のデフォルトは `ws://127.0.0.1:18789` です。
  非ループバックのバインドには、有効な gateway 認証パスが必要です。共有シークレットの
  トークン/パスワード認証、または正しく構成された非ループバックの
  `trusted-proxy` デプロイです。
- **ホストごとに 1 つの Gateway** を推奨します。分離する場合は、分離されたプロファイルとポートで複数の gateway を実行してください（[複数の Gateway](/ja-JP/gateway/multiple-gateways)）。
- **Canvas ホスト** は Gateway と同じポートで提供されます（`/__openclaw__/canvas/`、`/__openclaw__/a2ui/`）。ループバックを超えてバインドされる場合は Gateway 認証で保護されます。
- **リモートアクセス** は通常、SSH トンネルまたは Tailscale VPN です（[リモートアクセス](/ja-JP/gateway/remote)）。

主な参照先:

- [Gateway アーキテクチャ](/ja-JP/concepts/architecture)
- [Gateway プロトコル](/ja-JP/gateway/protocol)
- [Gateway ランブック](/ja-JP/gateway)
- [Web サーフェス + バインドモード](/ja-JP/web)

## ペアリング + アイデンティティ

- [ペアリング概要（DM + ノード）](/ja-JP/channels/pairing)
- [Gateway 所有のノードペアリング](/ja-JP/gateway/pairing)
- [デバイス CLI（ペアリング + トークンローテーション）](/ja-JP/cli/devices)
- [ペアリング CLI（DM 承認）](/ja-JP/cli/pairing)

ローカル信頼:

- 直接の local loopback 接続は、同一ホストでの UX を滑らかに保つため、
  ペアリングを自動承認できます。
- OpenClaw には、信頼された共有シークレットのヘルパーフロー向けに、狭い backend/container-local の自己接続パスもあります。
- 同一ホストの tailnet バインドを含む tailnet および LAN クライアントには、
  それでも明示的なペアリング承認が必要です。

## 検出 + トランスポート

- [検出とトランスポート](/ja-JP/gateway/discovery)
- [Bonjour / mDNS](/ja-JP/gateway/bonjour)
- [リモートアクセス（SSH）](/ja-JP/gateway/remote)
- [Tailscale](/ja-JP/gateway/tailscale)

## ノード + トランスポート

- [ノード概要](/ja-JP/nodes)
- [Bridge プロトコル（レガシーノード、履歴）](/ja-JP/gateway/bridge-protocol)
- [ノードランブック: iOS](/ja-JP/platforms/ios)
- [ノードランブック: Android](/ja-JP/platforms/android)

## セキュリティ

- [セキュリティ概要](/ja-JP/gateway/security)
- [Gateway 構成リファレンス](/ja-JP/gateway/configuration)
- [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- [Doctor](/ja-JP/gateway/doctor)

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [リモートアクセス](/ja-JP/gateway/remote)
