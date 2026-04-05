---
read_when:
    - 你想通过 Tailscale + CoreDNS 使用广域发现（DNS-SD）
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: '`openclaw dns` 的 CLI 参考（广域发现辅助工具）'
title: dns
x-i18n:
    generated_at: "2026-04-05T08:19:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4831fbb7791adfed5195bc4ba36bb248d2bc8830958334211d3c96f824617927
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

用于广域发现的 DNS 辅助工具（Tailscale + CoreDNS）。当前主要聚焦于 macOS + Homebrew CoreDNS。

相关内容：

- Gateway 网关发现：[设备发现](/gateway/discovery)
- 广域发现配置：[配置](/gateway/configuration)

## 设置

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

规划或应用用于单播 DNS-SD 发现的 CoreDNS 设置。

选项：

- `--domain <domain>`：广域发现域（例如 `openclaw.internal`）
- `--apply`：安装或更新 CoreDNS 配置并重启服务（需要 sudo；仅限 macOS）

显示内容：

- 已解析的发现域
- 区域文件路径
- 当前 tailnet IP
- 推荐的 `openclaw.json` 发现配置
- 需要设置的 Tailscale 拆分 DNS nameserver / domain 值

说明：

- 不带 `--apply` 时，该命令仅作为规划辅助工具使用，并打印推荐的设置。
- 如果省略 `--domain`，OpenClaw 会使用配置中的 `discovery.wideArea.domain`。
- `--apply` 当前仅支持 macOS，并要求使用 Homebrew CoreDNS。
- `--apply` 会在需要时引导创建区域文件，确保存在 CoreDNS import stanza，并重启 `coredns` brew 服务。
