---
read_when:
    - 你需要登入網站以進行瀏覽器自動化
    - 你想要將更新發布到 X/Twitter
summary: 瀏覽器自動化與 X/Twitter 發文的手動登入
title: 瀏覽器登入
x-i18n:
    generated_at: "2026-07-05T11:48:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bccd363cf7c9611f4687d50a92f7fb3e2fd1c1d67bb27a80c892f7ac58ae1f8f
    source_path: tools/browser-login.md
    workflow: 16
---

## 手動登入（建議）

當網站要求登入時，請在主機瀏覽器的 `openclaw`
設定檔中手動登入。不要把你的憑證交給模型：自動化登入通常會
觸發反機器人防護，並可能鎖定帳號。

在 X/Twitter 和其他對機器人敏感的網站上，無論是讀取（搜尋/討論串）或
發布，都請使用主機瀏覽器（手動登入）。沙盒化的瀏覽器工作階段
更容易觸發機器人偵測。

返回主要瀏覽器文件：[瀏覽器](/zh-TW/tools/browser)。

## 使用哪個 Chrome 設定檔？

OpenClaw 控制一個名為 `openclaw`（橘色調
介面）的專用 Chrome 設定檔，與你的日常瀏覽器設定檔分開。

對於代理瀏覽器工具呼叫：

- 預設選擇：代理使用其隔離的 `openclaw` 瀏覽器。
- 只有在既有登入工作階段很重要，且你在電腦前可以點擊/核准任何附加提示時，才使用 `profile="user"`。
- 如果你有多個使用者瀏覽器設定檔，請明確指定設定檔，
  而不是猜測。

存取 `openclaw` 設定檔的兩種方式：

1. 要求代理開啟瀏覽器，然後自行登入。
2. 透過命令列介面開啟：

```bash
openclaw browser start
openclaw browser open https://x.com
```

若要使用非預設設定檔，請將 `--browser-profile <name>` 放在
子命令之前（預設為 `openclaw`）：

```bash
openclaw browser --browser-profile <name> open https://x.com
```

## 沙盒化：允許主機瀏覽器存取

如果代理被沙盒化，其 `browser` 工具呼叫預設會使用沙盒
瀏覽器，而不是主機瀏覽器。若要讓代理改為鎖定主機瀏覽器：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

命令列介面呼叫一律鎖定主機瀏覽器，絕不會鎖定沙盒，因此不論此設定為何，你都可以
自行開啟主機瀏覽器：

```bash
openclaw browser --browser-profile openclaw open https://x.com
```

設定 `sandbox.browser.allowHostControl: true` 後，代理的 `browser`
工具呼叫也可以鎖定主機。或者，停用發布更新的
代理的沙盒化。

## 相關

- [瀏覽器](/zh-TW/tools/browser)
- [瀏覽器 Linux 疑難排解](/zh-TW/tools/browser-linux-troubleshooting)
- [瀏覽器 WSL2 疑難排解](/zh-TW/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
