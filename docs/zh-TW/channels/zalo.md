---
read_when:
    - 開發 Zalo 功能或 Webhook
summary: Zalo 機器人支援狀態、功能與設定
title: Zalo
x-i18n:
    generated_at: "2026-05-02T22:16:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6226af1217e1e8b03b485df99f6375872b487f7040c091f2bb2d85e18dec75d0
    source_path: channels/zalo.md
    workflow: 16
---

狀態：實驗性。支援私訊。下方的 [功能](#capabilities) 區段反映目前 Marketplace 機器人的行為。

## 內建 Plugin

Zalo 在目前的 OpenClaw 發行版中以內建 Plugin 提供，因此一般封裝建置不需要另行安裝。

如果你使用較舊的建置，或使用排除 Zalo 的自訂安裝，請直接安裝 npm 套件：

- 透過 CLI 安裝：`openclaw plugins install @openclaw/zalo`
- 釘選版本：`openclaw plugins install @openclaw/zalo@2026.5.2`
- 或從來源 checkout 安裝：`openclaw plugins install ./path/to/local/zalo-plugin`
- 詳細資料：[Plugins](/zh-TW/tools/plugin)

## 快速設定（初學者）

1. 確認 Zalo Plugin 可用。
   - 目前封裝的 OpenClaw 發行版已經內建它。
   - 較舊/自訂安裝可以使用上方命令手動加入。
2. 設定權杖：
   - Env：`ZALO_BOT_TOKEN=...`
   - 或設定：`channels.zalo.accounts.default.botToken: "..."`。
3. 重新啟動 Gateway（或完成設定）。
4. 私訊存取預設使用配對；首次聯絡時核准配對碼。

最小設定：

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## 這是什麼

Zalo 是一款以越南為重點的訊息應用程式；它的 Bot API 讓 Gateway 可以為 1:1 對話執行機器人。
如果你想要確定性地將路由導回 Zalo，它很適合用於支援或通知。

本頁反映目前 OpenClaw 對 **Zalo Bot Creator / Marketplace 機器人**的行為。
**Zalo Official Account (OA) 機器人**是不同的 Zalo 產品介面，行為可能不同。

- 由 Gateway 擁有的 Zalo Bot API 頻道。
- 確定性路由：回覆會回到 Zalo；模型永遠不會選擇頻道。
- 私訊共用代理的主要工作階段。
- 下方的 [功能](#capabilities) 區段顯示目前 Marketplace 機器人的支援情況。

## 設定（快速路徑）

### 1) 建立機器人權杖（Zalo Bot Platform）

1. 前往 [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) 並登入。
2. 建立新的機器人並設定其設定。
3. 複製完整的機器人權杖（通常為 `numeric_id:secret`）。對於 Marketplace 機器人，可用的執行階段權杖可能會在建立後出現在機器人的歡迎訊息中。

### 2) 設定權杖（env 或設定）

範例：

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

如果你之後改用可用群組的 Zalo 機器人介面，可以明確加入群組專用設定，例如 `groupPolicy` 和 `groupAllowFrom`。目前 Marketplace 機器人的行為請參閱 [功能](#capabilities)。

Env 選項：`ZALO_BOT_TOKEN=...`（僅適用於預設帳號）。

多帳號支援：使用 `channels.zalo.accounts` 搭配各帳號權杖和選用的 `name`。

3. 重新啟動 Gateway。Zalo 會在解析到權杖（env 或設定）時啟動。
4. 私訊存取預設為配對。機器人首次被聯絡時核准代碼。

## 運作方式（行為）

- 傳入訊息會被正規化為含媒體預留位置的共用頻道信封。
- 回覆一律路由回相同的 Zalo 聊天。
- 預設使用長輪詢；可透過 `channels.zalo.webhookUrl` 使用 Webhook 模式。

## 限制

- 傳出文字會分塊為 2000 個字元（Zalo API 限制）。
- 媒體下載/上傳受 `channels.zalo.mediaMaxMb` 限制（預設 5）。
- 由於 2000 字元限制使串流較不實用，預設會封鎖串流。

## 存取控制（私訊）

### 私訊存取

- 預設：`channels.zalo.dmPolicy = "pairing"`。未知寄件者會收到配對碼；訊息會被忽略直到核准為止（代碼 1 小時後過期）。
- 透過以下方式核准：
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- 配對是預設的權杖交換。詳細資料：[配對](/zh-TW/channels/pairing)
- `channels.zalo.allowFrom` 接受數字使用者 ID（沒有可用的使用者名稱查詢）。

## 存取控制（群組）

對於 **Zalo Bot Creator / Marketplace 機器人**，實務上無法使用群組支援，因為機器人完全無法被加入群組。

這表示下方的群組相關設定鍵存在於 schema 中，但 Marketplace 機器人無法使用：

- `channels.zalo.groupPolicy` 控制群組傳入處理：`open | allowlist | disabled`。
- `channels.zalo.groupAllowFrom` 限制哪些寄件者 ID 可以在群組中觸發機器人。
- 如果未設定 `groupAllowFrom`，Zalo 會回退到 `allowFrom` 進行寄件者檢查。
- 執行階段注意事項：如果完全缺少 `channels.zalo`，執行階段仍會為安全起見回退到 `groupPolicy="allowlist"`。

群組政策值（當你的機器人介面可使用群組存取時）如下：

- `groupPolicy: "disabled"` — 封鎖所有群組訊息。
- `groupPolicy: "open"` — 允許任何群組成員（需提及）。
- `groupPolicy: "allowlist"` — 預設失敗關閉；僅接受已允許的寄件者。

如果你使用不同的 Zalo 機器人產品介面，並已驗證群組行為可運作，請另外記錄該行為，而不是假設它符合 Marketplace 機器人流程。

## 長輪詢與 Webhook

- 預設：長輪詢（不需要公開 URL）。
- Webhook 模式：設定 `channels.zalo.webhookUrl` 和 `channels.zalo.webhookSecret`。
  - Webhook 密鑰必須為 8-256 個字元。
  - Webhook URL 必須使用 HTTPS。
  - Zalo 會使用 `X-Bot-Api-Secret-Token` 標頭傳送事件以供驗證。
  - Gateway HTTP 會在 `channels.zalo.webhookPath` 處理 Webhook 請求（預設為 Webhook URL 路徑）。
  - 請求必須使用 `Content-Type: application/json`（或 `+json` 媒體類型）。
  - 重複事件（`event_name + message_id`）會在短暫重播視窗內被忽略。
  - 突發流量會依路徑/來源限速，並可能傳回 HTTP 429。

**注意：**根據 Zalo API 文件，getUpdates（輪詢）與 Webhook 彼此互斥。

## 支援的訊息類型

如需快速支援快照，請參閱 [功能](#capabilities)。下方備註會在行為需要額外脈絡處補充細節。

- **文字訊息**：完整支援，並以 2000 個字元分塊。
- **文字中的純 URL**：行為如一般文字輸入。
- **連結預覽 / 豐富連結卡片**：請參閱 [功能](#capabilities) 中的 Marketplace 機器人狀態；它們無法可靠觸發回覆。
- **圖片訊息**：請參閱 [功能](#capabilities) 中的 Marketplace 機器人狀態；傳入圖片處理不可靠（顯示輸入中指示器，但沒有最終回覆）。
- **貼圖**：請參閱 [功能](#capabilities) 中的 Marketplace 機器人狀態。
- **語音筆記 / 音訊檔案 / 影片 / 一般檔案附件**：請參閱 [功能](#capabilities) 中的 Marketplace 機器人狀態。
- **不支援的類型**：會記錄（例如，來自受保護使用者的訊息）。

## 功能

此表摘要目前 OpenClaw 中 **Zalo Bot Creator / Marketplace 機器人**的行為。

| 功能                        | 狀態                                      |
| --------------------------- | ----------------------------------------- |
| 直接訊息                    | ✅ 支援                                   |
| 群組                        | ❌ Marketplace 機器人不可用              |
| 媒體（傳入圖片）            | ⚠️ 有限 / 請在你的環境中驗證             |
| 媒體（傳出圖片）            | ⚠️ 尚未針對 Marketplace 機器人重新測試   |
| 文字中的純 URL              | ✅ 支援                                   |
| 連結預覽                    | ⚠️ 對 Marketplace 機器人不可靠           |
| 反應                        | ❌ 不支援                                 |
| 貼圖                        | ⚠️ Marketplace 機器人沒有代理回覆        |
| 語音筆記 / 音訊 / 影片      | ⚠️ Marketplace 機器人沒有代理回覆        |
| 檔案附件                    | ⚠️ Marketplace 機器人沒有代理回覆        |
| 執行緒                      | ❌ 不支援                                 |
| 投票                        | ❌ 不支援                                 |
| 原生命令                    | ❌ 不支援                                 |
| 串流                        | ⚠️ 已封鎖（2000 字元限制）               |

## 傳送目標（CLI/cron）

- 使用聊天 ID 作為目標。
- 範例：`openclaw message send --channel zalo --target 123456789 --message "hi"`。

## 疑難排解

**機器人沒有回應：**

- 檢查權杖是否有效：`openclaw channels status --probe`
- 驗證寄件者已核准（配對或 allowFrom）
- 檢查 Gateway 記錄：`openclaw logs --follow`

**Webhook 未接收事件：**

- 確認 Webhook URL 使用 HTTPS
- 驗證密鑰權杖為 8-256 個字元
- 確認 Gateway HTTP 端點可在設定的路徑上存取
- 檢查 getUpdates 輪詢未在執行（它們彼此互斥）

## 設定參考（Zalo）

完整設定：[設定](/zh-TW/gateway/configuration)

扁平的頂層鍵（`channels.zalo.botToken`、`channels.zalo.dmPolicy` 等）是舊版單帳號速記。新設定建議使用 `channels.zalo.accounts.<id>.*`。這兩種形式仍在此記錄，因為它們存在於 schema 中。

Provider 選項：

- `channels.zalo.enabled`：啟用/停用頻道啟動。
- `channels.zalo.botToken`：來自 Zalo Bot Platform 的機器人權杖。
- `channels.zalo.tokenFile`：從一般檔案路徑讀取權杖。符號連結會被拒絕。
- `channels.zalo.dmPolicy`：`pairing | allowlist | open | disabled`（預設：pairing）。
- `channels.zalo.allowFrom`：私訊允許清單（使用者 ID）。`open` 需要 `"*"`。精靈會要求輸入數字 ID。
- `channels.zalo.groupPolicy`：`open | allowlist | disabled`（預設：allowlist）。存在於設定中；目前 Marketplace 機器人的行為請參閱 [功能](#capabilities) 和 [存取控制（群組）](#access-control-groups)。
- `channels.zalo.groupAllowFrom`：群組寄件者允許清單（使用者 ID）。未設定時回退到 `allowFrom`。
- `channels.zalo.mediaMaxMb`：傳入/傳出媒體上限（MB，預設 5）。
- `channels.zalo.webhookUrl`：啟用 Webhook 模式（需要 HTTPS）。
- `channels.zalo.webhookSecret`：Webhook 密鑰（8-256 個字元）。
- `channels.zalo.webhookPath`：Gateway HTTP 伺服器上的 Webhook 路徑。
- `channels.zalo.proxy`：API 請求的代理 URL。

多帳號選項：

- `channels.zalo.accounts.<id>.botToken`：各帳號權杖。
- `channels.zalo.accounts.<id>.tokenFile`：各帳號的一般權杖檔案。符號連結會被拒絕。
- `channels.zalo.accounts.<id>.name`：顯示名稱。
- `channels.zalo.accounts.<id>.enabled`：啟用/停用帳號。
- `channels.zalo.accounts.<id>.dmPolicy`：各帳號私訊政策。
- `channels.zalo.accounts.<id>.allowFrom`：各帳號允許清單。
- `channels.zalo.accounts.<id>.groupPolicy`：各帳號群組政策。存在於設定中；目前 Marketplace 機器人的行為請參閱 [功能](#capabilities) 和 [存取控制（群組）](#access-control-groups)。
- `channels.zalo.accounts.<id>.groupAllowFrom`：各帳號群組寄件者允許清單。
- `channels.zalo.accounts.<id>.webhookUrl`：各帳號 Webhook URL。
- `channels.zalo.accounts.<id>.webhookSecret`：各帳號 Webhook 密鑰。
- `channels.zalo.accounts.<id>.webhookPath`：各帳號 Webhook 路徑。
- `channels.zalo.accounts.<id>.proxy`：各帳號代理 URL。

## 相關

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及門控
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
