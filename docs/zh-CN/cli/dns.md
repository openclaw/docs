---
read_when:
    - 你想通过 Tailscale + CoreDNS 使用广域设备发现（DNS-SD）
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: '`openclaw dns` 的 CLI 参考（广域设备发现辅助工具）'
title: DNS
x-i18n:
    generated_at: "2026-07-05T11:09:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb07353df03f9d169e1aede2da0b711ffb68e8c9d21d51359e93e92cc0818ca2
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

用于广域设备发现的 DNS 辅助工具（Tailscale + CoreDNS）。目前仅支持 macOS + Homebrew CoreDNS。

相关：

- Gateway 网关设备发现：[设备发现](/zh-CN/gateway/discovery)
- 广域设备发现配置：[配置](/zh-CN/gateway/configuration)

## `dns setup`

规划或应用用于单播 DNS-SD 设备发现的 CoreDNS 设置。

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

| 选项                | 效果                                                                                |
| ------------------- | ----------------------------------------------------------------------------------- |
| `--domain <domain>` | 广域设备发现域名（例如 `openclaw.internal`）。                                      |
| `--apply`           | 安装/更新 CoreDNS 配置并（重新）启动服务。需要 sudo，仅限 macOS。                  |

如果没有 `--domain`，OpenClaw 会使用配置中的 `discovery.wideArea.domain`。

如果没有 `--apply`，该命令只会打印：

- 解析后的设备发现域名和区域文件路径
- 当前 tailnet IP
- 推荐的 `openclaw.json` 设备发现配置
- 需要在 Tailscale 管理控制台中设置的 Tailscale Split DNS 名称服务器/域名值

使用 `--apply` 时（仅限 macOS，需要 Homebrew CoreDNS）：

- 如果缺少区域文件，则引导创建
- 如果缺少 CoreDNS import 段，则添加
- 重启 `coredns` brew 服务

## 相关

- [CLI 参考](/zh-CN/cli)
- [设备发现](/zh-CN/gateway/discovery)
