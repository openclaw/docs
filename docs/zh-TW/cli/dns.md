---
read_when:
    - 你想透過 Tailscale + CoreDNS 使用廣域探索 (DNS-SD)
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: '`openclaw dns` 的命令列介面參考（廣域探索輔助工具）'
title: DNS
x-i18n:
    generated_at: "2026-07-05T11:09:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb07353df03f9d169e1aede2da0b711ffb68e8c9d21d51359e93e92cc0818ca2
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

用於廣域探索的 DNS 輔助工具（Tailscale + CoreDNS）。目前僅支援 macOS + Homebrew CoreDNS。

相關：

- 閘道探索：[探索](/zh-TW/gateway/discovery)
- 廣域探索設定：[設定](/zh-TW/gateway/configuration)

## `dns setup`

規劃或套用用於單播 DNS-SD 探索的 CoreDNS 設定。

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

| 選項                | 效果                                                                                |
| ------------------- | ----------------------------------------------------------------------------------- |
| `--domain <domain>` | 廣域探索網域（例如 `openclaw.internal`）。                                          |
| `--apply`           | 安裝/更新 CoreDNS 設定並（重新）啟動服務。需要 sudo，僅限 macOS。                  |

未指定 `--domain` 時，OpenClaw 會使用設定中的 `discovery.wideArea.domain`。

未指定 `--apply` 時，此命令只會印出：

- 解析後的探索網域與區域檔案路徑
- 目前的 tailnet IP
- 建議的 `openclaw.json` 探索設定
- 要在 Tailscale 管理控制台中設定的 Tailscale Split DNS 名稱伺服器/網域值

使用 `--apply` 時（僅限 macOS，需要 Homebrew CoreDNS）：

- 若區域檔案不存在，則初始化它
- 若 CoreDNS import stanza 不存在，則新增它
- 重新啟動 `coredns` brew 服務

## 相關

- [命令列介面參考](/zh-TW/cli)
- [探索](/zh-TW/gateway/discovery)
