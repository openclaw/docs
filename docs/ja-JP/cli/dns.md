---
read_when:
    - Tailscale + CoreDNS を介した広域ディスカバリー（DNS-SD）が必要な場合
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: '`openclaw dns` の CLI リファレンス（広域ディスカバリーヘルパー）'
title: DNS
x-i18n:
    generated_at: "2026-04-24T04:50:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99dcf7c8c76833784a2b712b02f9e40c6c0548c37c9743a89b9d650fe503d385
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

広域ディスカバリー（Tailscale + CoreDNS）用の DNS ヘルパーです。現在は macOS + Homebrew CoreDNS に主に対応しています。

関連:

- Gateway ディスカバリー: [Discovery](/ja-JP/gateway/discovery)
- 広域ディスカバリー設定: [Configuration](/ja-JP/gateway/configuration)

## セットアップ

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

ユニキャスト DNS-SD ディスカバリーのための CoreDNS セットアップを計画または適用します。

オプション:

- `--domain <domain>`: 広域ディスカバリードメイン（例: `openclaw.internal`）
- `--apply`: CoreDNS 設定をインストールまたは更新し、サービスを再起動します（sudo が必要。macOS のみ）

表示内容:

- 解決済みディスカバリードメイン
- ゾーンファイルパス
- 現在の tailnet IP
- 推奨される `openclaw.json` ディスカバリー設定
- 設定すべき Tailscale Split DNS のネームサーバー/ドメイン値

注:

- `--apply` を指定しない場合、このコマンドは計画ヘルパーとしてのみ動作し、推奨セットアップを表示します。
- `--domain` を省略した場合、OpenClaw は設定の `discovery.wideArea.domain` を使用します。
- `--apply` は現在 macOS のみをサポートしており、Homebrew CoreDNS を前提としています。
- `--apply` は必要に応じてゾーンファイルをブートストラップし、CoreDNS の import stanza が存在することを確認し、`coredns` の brew service を再起動します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Discovery](/ja-JP/gateway/discovery)
