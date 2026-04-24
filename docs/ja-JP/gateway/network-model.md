---
read_when:
    - Gatewayのネットワークモデルを簡潔に把握したい
summary: Gateway、Nodes、canvas hostがどのように接続するか。
title: ネットワークモデル
x-i18n:
    generated_at: "2026-04-24T04:58:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68637b72c4b3a6110556909da9a454e4be480fe2f3b42b09d054949c1104a62c
    source_path: gateway/network-model.md
    workflow: 15
---

> この内容は [Network](/ja-JP/network#core-model) に統合されました。現在のガイドはそのページを参照してください。

ほとんどの操作は、チャネル接続とWebSocketコントロールプレーンを所有する、単一の長時間実行プロセスであるGateway（`openclaw gateway`）を通じて流れます。

## 中核ルール

- ホストごとに1つのGatewayを推奨します。WhatsApp Webセッションを所有できるのはこのプロセスだけです。救援用ボットや厳格な分離のためには、分離されたprofileとポートで複数のgatewayを実行してください。[複数Gateway](/ja-JP/gateway/multiple-gateways)を参照してください。
- まずloopback: Gateway WSのデフォルトは `ws://127.0.0.1:18789` です。ウィザードはデフォルトでshared-secret認証を作成し、loopbackであっても通常はトークンを生成します。loopback以外のアクセスでは、有効なgateway auth経路を使ってください: shared-secretのtoken/password認証、または正しく設定されたloopback外の `trusted-proxy` デプロイです。tailnet/mobile構成では、生のtailnet `ws://` よりも、Tailscale Serveや他の `wss://` endpoint経由のほうが通常うまく動作します。
- Nodesは必要に応じてLAN、tailnet、またはSSH経由でGateway WSに接続します。従来のTCP bridgeは削除されました。
- canvas hostは、Gateway HTTPサーバー上でGatewayと**同じポート**（デフォルト `18789`）から提供されます:
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    `gateway.auth` が設定されており、Gatewayがloopback外へbindしている場合、これらのルートはGateway authで保護されます。Nodeクライアントは、アクティブなWSセッションに結び付いたnodeスコープのcapability URLを使います。[Gateway設定](/ja-JP/gateway/configuration)（`canvasHost`、`gateway`）を参照してください。
- リモート利用では、通常はSSHトンネルまたはtailnet VPNを使います。[Remote access](/ja-JP/gateway/remote) と [Discovery](/ja-JP/gateway/discovery) を参照してください。

## 関連

- [Remote access](/ja-JP/gateway/remote)
- [Trusted proxy auth](/ja-JP/gateway/trusted-proxy-auth)
- [Gateway protocol](/ja-JP/gateway/protocol)
