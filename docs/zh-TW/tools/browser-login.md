---
read_when:
    - 你需要登入網站以進行瀏覽器自動化
    - 你想在 X/Twitter 發布更新
summary: 用於瀏覽器自動化 + X/Twitter 發文的手動登入
title: 瀏覽器登入
x-i18n:
    generated_at: "2026-05-06T02:57:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 235194fd3a49724247f98e6d7c848c4cc3317f749ff4a8918c2172b73baf21e3
    source_path: tools/browser-login.md
    workflow: 16
---

## 手動登入（建議）

當網站需要登入時，請在**主機**瀏覽器設定檔（OpenClaw 瀏覽器）中**手動登入**。

**不要**將你的憑證提供給模型。自動登入通常會觸發反機器人防護，並可能導致帳號遭到鎖定。

返回主要瀏覽器文件：[瀏覽器](/zh-TW/tools/browser)。

## 使用哪個 Chrome 設定檔？

OpenClaw 會控制一個**專用 Chrome 設定檔**（名為 `openclaw`，橘色調 UI）。這與你日常使用的瀏覽器設定檔分開。

對於代理程式瀏覽器工具呼叫：

- 預設選擇：代理程式應使用其隔離的 `openclaw` 瀏覽器。
- 只有在既有已登入工作階段很重要，且使用者在電腦前可點擊／核准任何附加提示時，才使用 `profile="user"`。
- 如果你有多個使用者瀏覽器設定檔，請明確指定設定檔，而不是猜測。

有兩種簡單方式可存取它：

1. **請代理程式開啟瀏覽器**，然後自行登入。
2. **透過 CLI 開啟**：

```bash
openclaw browser start
openclaw browser open https://x.com
```

如果你有多個設定檔，請傳入 `--browser-profile <name>`（預設為 `openclaw`）。

## X/Twitter：建議流程

- **閱讀／搜尋／討論串：**使用**主機**瀏覽器（手動登入）。
- **發布更新：**使用**主機**瀏覽器（手動登入）。

## 沙箱 + 主機瀏覽器存取

沙箱化的瀏覽器工作階段**更可能**觸發機器人偵測。對於 X/Twitter（以及其他嚴格的網站），請優先使用**主機**瀏覽器。

如果代理程式已沙箱化，瀏覽器工具會預設使用沙箱。若要允許主機控制：

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

然後以主機瀏覽器為目標：

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

或停用負責發布更新的代理程式沙箱。

## 相關

- [瀏覽器](/zh-TW/tools/browser)
- [瀏覽器 Linux 疑難排解](/zh-TW/tools/browser-linux-troubleshooting)
- [瀏覽器 WSL2 疑難排解](/zh-TW/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
