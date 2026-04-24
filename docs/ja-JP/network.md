---
read_when:
    - ネットワークアーキテクチャ + セキュリティ概要が必要です
    - local と tailnet アクセス、またはペアリングをデバッグしています
    - ネットワーキング関連ドキュメントの正規一覧が必要です
summary: 'ネットワークハブ: Gateway サーフェス、ペアリング、検出、セキュリティ'
title: ネットワーク
x-i18n:
    generated_at: "2026-04-24T05:06:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 663f372555f044146a5d381566371e9a38185e7f295243bfd61314f12e3a4f06
    source_path: network.md
    workflow: 15
---

# ネットワークハブ

このハブは、OpenClaw が localhost、LAN、tailnet をまたいで
デバイスをどのように接続し、ペアリングし、保護するかに関する中核ドキュメントへリンクします。

## コアモデル

ほとんどの操作は Gateway（`openclaw gateway`）を経由します。これは、チャンネル接続と WebSocket control plane を所有する単一の長時間稼働プロセスです。

- **Loopback first**: Gateway WS のデフォルトは `ws://127.0.0.1:18789` です。
  non-loopback bind には有効な Gateway 認証経路が必要です。共有シークレットの
  token/password 認証、または正しく設定された non-loopback
  `trusted-proxy` デプロイのいずれかです。
- **ホストごとに 1 Gateway** を推奨します。分離が必要な場合は、分離されたプロファイルとポートで複数の Gateway を実行してください（[Multiple Gateways](/ja-JP/gateway/multiple-gateways)）。
- **Canvas host** は Gateway と同じポート（`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`）で提供され、loopback を超えて bind される場合は Gateway 認証で保護されます。
- **リモートアクセス** は通常 SSH トンネルまたは Tailscale VPN です（[Remote Access](/ja-JP/gateway/remote)）。

主要な参照先:

- [Gateway アーキテクチャ](/ja-JP/concepts/architecture)
- [Gateway プロトコル](/ja-JP/gateway/protocol)
- [Gateway runbook](/ja-JP/gateway)
- [Web サーフェス + bind モード](/ja-JP/web)

## ペアリング + ID

- [ペアリング概要（DM + nodes）](/ja-JP/channels/pairing)
- [Gateway 所有の node ペアリング](/ja-JP/gateway/pairing)
- [Devices CLI（ペアリング + token ローテーション）](/ja-JP/cli/devices)
- [Pairing CLI（DM 承認）](/ja-JP/cli/pairing)

ローカル信頼:

- 直接のローカル loopback 接続は、同一ホスト UX を滑らかに保つため、
  ペアリングを自動承認できます。
- OpenClaw には、信頼済み共有シークレット helper フロー向けの狭い backend/container-local self-connect パスもあります。
- same-host tailnet bind を含む tailnet と LAN クライアントには、引き続き
  明示的なペアリング承認が必要です。

## 検出 + トランスポート

- [検出とトランスポート](/ja-JP/gateway/discovery)
- [Bonjour / mDNS](/ja-JP/gateway/bonjour)
- [リモートアクセス（SSH）](/ja-JP/gateway/remote)
- [Tailscale](/ja-JP/gateway/tailscale)

## Nodes + トランスポート

- [Nodes 概要](/ja-JP/nodes)
- [Bridge protocol（レガシー nodes、歴史的）](/ja-JP/gateway/bridge-protocol)
- [Node runbook: iOS](/ja-JP/platforms/ios)
- [Node runbook: Android](/ja-JP/platforms/android)

## セキュリティ

- [セキュリティ概要](/ja-JP/gateway/security)
- [Gateway config リファレンス](/ja-JP/gateway/configuration)
- [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- [Doctor](/ja-JP/gateway/doctor)

## 関連

- [Gateway ネットワークモデル](/ja-JP/gateway/network-model)
- [リモートアクセス](/ja-JP/gateway/remote)
