---
read_when:
    - Tailscale + CoreDNS 経由で広域検出 (DNS-SD) を使用したい
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: '`openclaw dns` の CLI リファレンス（広域検出ヘルパー）'
title: DNS
x-i18n:
    generated_at: "2026-07-05T11:11:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb07353df03f9d169e1aede2da0b711ffb68e8c9d21d51359e93e92cc0818ca2
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

広域検出（Tailscale + CoreDNS）のための DNS ヘルパーです。現在は macOS + Homebrew CoreDNS のみ対応しています。

関連:

- Gateway 検出: [Discovery](/ja-JP/gateway/discovery)
- 広域検出設定: [Configuration](/ja-JP/gateway/configuration)

## `dns setup`

ユニキャスト DNS-SD 検出向けの CoreDNS セットアップを計画または適用します。

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

| オプション              | 効果                                                                              |
| ------------------- | ----------------------------------------------------------------------------------- |
| `--domain <domain>` | 広域検出ドメイン（例: `openclaw.internal`）。                       |
| `--apply`           | CoreDNS 設定をインストール/更新し、サービスを（再）起動します。sudo が必要で、macOS のみ対応です。 |

`--domain` がない場合、OpenClaw は設定の `discovery.wideArea.domain` を使用します。

`--apply` がない場合、コマンドは次のみを出力します。

- 解決済みの検出ドメインとゾーンファイルパス
- 現在の tailnet IP
- 推奨される `openclaw.json` 検出設定
- Tailscale 管理コンソールで設定する Tailscale Split DNS ネームサーバー/ドメイン値

`--apply` を指定した場合（macOS のみ、Homebrew CoreDNS が必要）:

- ゾーンファイルがない場合はブートストラップします
- CoreDNS の import スタンザがない場合は追加します
- `coredns` brew サービスを再起動します

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Discovery](/ja-JP/gateway/discovery)
