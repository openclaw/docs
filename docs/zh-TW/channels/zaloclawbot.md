---
read_when:
    - 你想要一個可用 QR 碼登入的個人 Zalo 助理機器人
    - 您正在安裝或疑難排解 openclaw-zaloclawbot 頻道外掛
summary: 透過外部 openclaw-zaloclawbot 外掛設定 Zalo ClawBot 頻道
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-07-05T11:05:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c9f79d114856b86026a5e4b98a43f451b0d3f16dd41a67e9226da4f8b37b33
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw 透過目錄列出的外部 `@zalo-platforms/openclaw-zaloclawbot` 外掛連接到 Zalo ClawBot。登入使用 Zalo Mini App QR code；設定中的外掛 ID 是 `openclaw-zaloclawbot`。

## 相容性

| 外掛版本 | OpenClaw 版本 | npm dist-tag | 狀態        |
| -------------- | ---------------- | ------------ | ------------- |
| 0.1.4          | >=2026.4.10      | `latest`     | 啟用中 / Beta |

## 先決條件

- Node.js >= 22
- 已安裝 [OpenClaw](https://docs.openclaw.ai/install)（可使用 `openclaw` 命令列介面）
- 行動裝置上的 Zalo 帳號，用於掃描登入 QR code

## 使用 onboard 安裝（建議）

```bash
openclaw onboard
```

從頻道選單選擇 **Zalo ClawBot**。精靈會從官方目錄安裝外掛（已驗證完整性），在終端機中顯示登入 QR，並在你用 Zalo app 掃描後完成頻道設定。

## 手動安裝

若要將頻道新增到已完成 onboard 的閘道：

### 1. 安裝外掛

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

請使用精確釘選的版本，讓 OpenClaw 在安裝期間依據目錄完整性雜湊驗證套件。

### 2. 在設定中啟用外掛

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. 產生 QR code 並登入

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

使用 Zalo 行動 app 掃描終端機顯示的 QR code，在 Zalo Mini App 內接受使用條款，並授權工作階段。

### 4. 重新啟動閘道

```bash
openclaw gateway restart
```

## 運作方式

不同於標準 Zalo 頻道需要註冊自己的 Zalo Official Account（OA）並設定靜態開發者憑證，Zalo ClawBot 是在共享官方基礎設施上的**綁定擁有者個人助理**：

1. **Onboarding：** QR code 會解析到 Zalo Mini App，將新佈建的私人 bot 在共享官方 OA 下直接綁定到你的 Zalo 使用者 ID。
2. **綁定擁有者的隱私：** bot 只會與其擁有者通訊。其他使用者的訊息會在平台層級被丟棄。
3. **官方 API 路徑：** 外掛使用 Zalo Bot Platform API，而不是瀏覽器或網頁工作階段自動化。

## 底層機制

外掛透過持久的長輪詢迴圈（`getUpdates`）與 Zalo 通訊。對於本機桌面/終端機閘道執行，網路鉤子預設為停用。訊息會在用戶端處理，並對應到你的本機代理執行階段。

外掛會在 OpenClaw 狀態目錄下管理 bot 憑證。請將該目錄視為敏感資料，並納入與其餘 OpenClaw 狀態相同的存取控制與備份政策。

此外掛的執行階段完全位於外部 `@zalo-platforms/openclaw-zaloclawbot` 套件中；下方超出安裝/設定範圍的行為細節，是由外掛維護者回報，尚未依據 OpenClaw 核心原始碼驗證。

## 疑難排解

- **QR 登入逾時：** 為了安全性，登入權杖（`zbsk`）會在 5 分鐘後過期。如果 QR code 在你掃描前過期，請重新執行登入命令以產生新的 QR code。
- **閘道載入失敗：** 確認你的 OpenClaw 主機版本為 `2026.4.10` 或更高版本。較舊版本不支援此 ID 所需的外部 npm 外掛安裝帳本。

## 相關

- [頻道總覽](/zh-TW/channels) - 所有支援的頻道
- [Zalo](/zh-TW/channels/zalo) - 內建的 Zalo Bot Creator / Marketplace 頻道
- [配對](/zh-TW/channels/pairing) - DM 驗證與配對流程
- [外掛](/zh-TW/tools/plugin) - 安裝與管理外掛
