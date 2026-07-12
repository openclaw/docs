---
read_when:
    - 你想要一個使用 QR 碼登入的個人 Zalo 助理機器人
    - 您正在安裝或疑難排解 openclaw-zaloclawbot 頻道外掛
summary: 透過外部 openclaw-zaloclawbot 外掛設定 Zalo ClawBot 頻道
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-07-11T21:08:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c9f79d114856b86026a5e4b98a43f451b0d3f16dd41a67e9226da4f8b37b33
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw 透過目錄中列出的外部 `@zalo-platforms/openclaw-zaloclawbot` 外掛連線至 Zalo ClawBot。登入使用 Zalo Mini App QR 碼；設定中的外掛 ID 為 `openclaw-zaloclawbot`。

## 相容性

| 外掛版本 | OpenClaw 版本 | npm dist-tag | 狀態          |
| -------- | ------------- | ------------ | ------------- |
| 0.1.4    | >=2026.4.10   | `latest`     | 使用中／測試版 |

## 先決條件

- Node.js >= 22
- 已安裝 [OpenClaw](https://docs.openclaw.ai/install)（可使用 `openclaw` 命令列介面）
- 行動裝置上的 Zalo 帳號，用於掃描登入 QR 碼

## 使用引導流程安裝（建議）

```bash
openclaw onboard
```

從頻道選單中選擇 **Zalo ClawBot**。精靈會從官方目錄安裝外掛（並驗證完整性）、在終端機中顯示登入 QR 碼，待您使用 Zalo 應用程式掃描後完成頻道設定。

## 手動安裝

若要將頻道新增至已完成引導設定的閘道：

### 1. 安裝外掛

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

請使用精確固定的版本，讓 OpenClaw 在安裝期間依據目錄中的完整性雜湊驗證套件。

### 2. 在設定中啟用外掛

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. 產生 QR 碼並登入

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

使用 Zalo 行動應用程式掃描終端機顯示的 QR 碼，在 Zalo Mini App 中接受使用條款，並授權工作階段。

### 4. 重新啟動閘道

```bash
openclaw gateway restart
```

## 運作方式

標準 Zalo 頻道需要註冊您自己的 Zalo 官方帳號（OA）並設定靜態開發者憑證；與其不同，Zalo ClawBot 是在共用官方基礎設施上執行的**與擁有者綁定之個人助理**：

1. **引導設定：**QR 碼會導向 Zalo Mini App，將新佈建的私人機器人置於共用官方 OA 之下，並直接綁定至您的 Zalo 使用者 ID。
2. **擁有者綁定的隱私保護：**機器人只會與其擁有者通訊。其他使用者的訊息會在平台層級遭到捨棄。
3. **官方 API 路徑：**此外掛使用 Zalo Bot Platform API，而非瀏覽器或網頁工作階段自動化。

## 內部運作

此外掛透過持續的長輪詢迴圈（`getUpdates`）與 Zalo 通訊。對於本機桌面／終端機閘道執行環境，網路鉤子預設為停用。訊息會在用戶端處理，並對應至您的本機代理程式執行階段。

此外掛會在 OpenClaw 狀態目錄下管理機器人憑證。請將該目錄視為敏感資料，並套用與其他 OpenClaw 狀態相同的存取控制及備份政策。

此外掛的執行階段完全位於外部 `@zalo-platforms/openclaw-zaloclawbot` 套件中；下方安裝／設定以外的行為細節由外掛維護者提供，尚未依據 OpenClaw 核心原始碼驗證。

## 疑難排解

- **QR 碼登入逾時：**基於安全考量，登入權杖（`zbsk`）會在 5 分鐘後失效。如果 QR 碼在您掃描前失效，請重新執行登入命令以產生新的 QR 碼。
- **閘道無法載入：**確認您的 OpenClaw 主機版本為 `2026.4.10` 或更高版本。較舊版本不支援此 ID 所需的外部 npm 外掛安裝記錄機制。

## 相關內容

- [頻道概覽](/zh-TW/channels) - 所有支援的頻道
- [Zalo](/zh-TW/channels/zalo) - 內建的 Zalo Bot Creator／Marketplace 頻道
- [配對](/zh-TW/channels/pairing) - 私訊驗證與配對流程
- [外掛](/zh-TW/tools/plugin) - 安裝與管理外掛
