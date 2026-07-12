---
read_when:
    - Tailscale + CoreDNS 経由で広域検出（DNS-SD）を利用する場合
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: '`openclaw dns`（広域検出ヘルパー）の CLI リファレンス'
title: DNS
x-i18n:
    generated_at: "2026-07-11T22:05:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb07353df03f9d169e1aede2da0b711ffb68e8c9d21d51359e93e92cc0818ca2
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

広域探索（Tailscale + CoreDNS）用の DNS ヘルパーです。現在は macOS + Homebrew CoreDNS のみに対応しています。

関連項目:

- Gateway 探索: [探索](/ja-JP/gateway/discovery)
- 広域探索の設定: [設定](/ja-JP/gateway/configuration)

## `dns setup`

ユニキャスト DNS-SD 探索用の CoreDNS セットアップを計画または適用します。

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

| オプション          | 効果                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------- |
| `--domain <domain>` | 広域探索ドメイン（例: `openclaw.internal`）。                                                |
| `--apply`           | CoreDNS 設定をインストールまたは更新し、サービスを（再）起動します。sudo が必要で、macOS のみです。 |

`--domain` を指定しない場合、OpenClaw は設定の `discovery.wideArea.domain` を使用します。

`--apply` を指定しない場合、コマンドは次の内容のみを出力します:

- 解決された探索ドメインとゾーンファイルのパス
- 現在の tailnet IP
- 推奨される `openclaw.json` の探索設定
- Tailscale 管理コンソールで設定する Tailscale Split DNS のネームサーバーとドメインの値

`--apply` を指定した場合（macOS のみ、Homebrew CoreDNS が必要）:

- ゾーンファイルがない場合は初期化します
- CoreDNS の import スタンザがない場合は追加します
- `coredns` brew サービスを再起動します

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [探索](/ja-JP/gateway/discovery)
