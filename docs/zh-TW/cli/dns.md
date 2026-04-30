---
read_when:
    - 你想要透過 Tailscale + CoreDNS 進行廣域探索（DNS-SD）
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: '`openclaw dns` 的 CLI 參考（廣域探索輔助工具）'
title: DNS
x-i18n:
    generated_at: "2026-04-30T02:53:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99dcf7c8c76833784a2b712b02f9e40c6c0548c37c9743a89b9d650fe503d385
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

用於廣域探索的 DNS 輔助工具（Tailscale + CoreDNS）。目前專注於 macOS + Homebrew CoreDNS。

相關：

- Gateway 探索：[探索](/zh-TW/gateway/discovery)
- 廣域探索設定：[設定](/zh-TW/gateway/configuration)

## 設定

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

規劃或套用 CoreDNS 設定，以進行單播 DNS-SD 探索。

選項：

- `--domain <domain>`：廣域探索網域（例如 `openclaw.internal`）
- `--apply`：安裝或更新 CoreDNS 設定並重新啟動服務（需要 sudo；僅限 macOS）

顯示內容：

- 已解析的探索網域
- 區域檔案路徑
- 目前的 tailnet IP
- 建議的 `openclaw.json` 探索設定
- 要設定的 Tailscale 分割 DNS 名稱伺服器/網域值

注意事項：

- 若不使用 `--apply`，此命令只作為規劃輔助工具，並會列印建議設定。
- 如果省略 `--domain`，OpenClaw 會使用設定中的 `discovery.wideArea.domain`。
- `--apply` 目前僅支援 macOS，並且需要 Homebrew CoreDNS。
- `--apply` 會在需要時啟動區域檔案，確保 CoreDNS 匯入段落存在，並重新啟動 `coredns` brew 服務。

## 相關

- [CLI 參考](/zh-TW/cli)
- [探索](/zh-TW/gateway/discovery)
