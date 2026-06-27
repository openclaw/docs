---
read_when:
    - Tailscale + CoreDNS 経由で広域検出（DNS-SD）を使いたい場合
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: '`openclaw dns` の CLI リファレンス（広域検出ヘルパー）'
title: DNS
x-i18n:
    generated_at: "2026-05-06T09:03:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 460bdcbaa2c0c0fc1a4f5bdd76b904d8ac35195a25324c66421abfdc2044bb07
    source_path: cli/dns.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw dns`

広域ディスカバリー用の DNS ヘルパー (Tailscale + CoreDNS)。現在は macOS + Homebrew CoreDNS に重点を置いています。

関連:

- Gateway ディスカバリー: [ディスカバリー](/ja-JP/gateway/discovery)
- 広域ディスカバリー設定: [設定](/ja-JP/gateway/configuration)

## セットアップ

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

ユニキャスト DNS-SD ディスカバリー用の CoreDNS セットアップを計画または適用します。

オプション:

- `--domain <domain>`: 広域ディスカバリードメイン (例: `openclaw.internal`)
- `--apply`: CoreDNS 設定をインストールまたは更新し、サービスを再起動します (sudo が必要、macOS のみ)

表示内容:

- 解決されたディスカバリードメイン
- ゾーンファイルパス
- 現在の tailnet IP
- 推奨される `openclaw.json` ディスカバリー設定
- 設定する Tailscale Split DNS のネームサーバー/ドメイン値

注記:

- `--apply` なしでは、このコマンドは計画用ヘルパーのみとして機能し、推奨セットアップを出力します。
- `--domain` を省略した場合、OpenClaw は設定の `discovery.wideArea.domain` を使用します。
- `--apply` は現在 macOS のみをサポートし、Homebrew CoreDNS を前提としています。
- `--apply` は必要に応じてゾーンファイルをブートストラップし、CoreDNS の import スタンザが存在することを確認し、`coredns` brew サービスを再起動します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ディスカバリー](/ja-JP/gateway/discovery)
