---
read_when:
    - 你希望通过 Tailscale + CoreDNS 实现广域设备发现（DNS-SD）
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: '`openclaw dns` 的 CLI 参考（广域设备发现辅助工具）'
title: DNS
x-i18n:
    generated_at: "2026-07-11T20:23:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb07353df03f9d169e1aede2da0b711ffb68e8c9d21d51359e93e92cc0818ca2
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

用于广域设备发现（Tailscale + CoreDNS）的 DNS 辅助工具。目前仅支持 macOS + Homebrew CoreDNS。

相关内容：

- Gateway 网关设备发现：[设备发现](/zh-CN/gateway/discovery)
- 广域设备发现配置：[配置](/zh-CN/gateway/configuration)

## `dns setup`

规划或应用 CoreDNS 设置，以进行单播 DNS-SD 设备发现。

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

| 选项                | 效果                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------- |
| `--domain <domain>` | 广域设备发现域（例如 `openclaw.internal`）。                                            |
| `--apply`           | 安装/更新 CoreDNS 配置并（重新）启动服务。需要 sudo，仅支持 macOS。                     |

如果未指定 `--domain`，OpenClaw 将使用配置中的 `discovery.wideArea.domain`。

如果未指定 `--apply`，该命令仅输出：

- 解析后的设备发现域和区域文件路径
- 当前 tailnet IP
- 推荐的 `openclaw.json` 设备发现配置
- 需要在 Tailscale 管理控制台中设置的 Tailscale Split DNS 名称服务器/域值

使用 `--apply` 时（仅支持 macOS，需要 Homebrew CoreDNS）：

- 如果区域文件不存在，则初始化该文件
- 如果 CoreDNS 导入节不存在，则添加该节
- 重新启动 `coredns` brew 服务

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [设备发现](/zh-CN/gateway/discovery)
