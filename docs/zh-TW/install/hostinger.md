---
read_when:
    - 在 Hostinger 上設定 OpenClaw
    - 尋找適合 OpenClaw 的受管 VPS
    - 使用 Hostinger 一鍵式 OpenClaw
summary: 在 Hostinger 上託管 OpenClaw
title: Hostinger
x-i18n:
    generated_at: "2026-07-05T11:23:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dc49e741f8581928553e2426ed91f92df6e7b0c31dd8780c0d6e891a07be263
    source_path: install/hostinger.md
    workflow: 16
---

在 [Hostinger](https://www.hostinger.com/openclaw) 上執行持久性的 OpenClaw 閘道，可以選擇 **一鍵式** 受管部署，或由你自行管理的 **VPS** 安裝。

## 先決條件

- Hostinger 帳戶（[註冊](https://www.hostinger.com/openclaw)）
- 約 5-10 分鐘

## 選項 A：一鍵式 OpenClaw

Hostinger 會處理基礎架構、Docker 和自動更新。這是最快取得可執行實例的方式。

<Steps>
  <Step title="購買並啟動">
    1. 從 [Hostinger OpenClaw 頁面](https://www.hostinger.com/openclaw)，選擇受管 OpenClaw 方案並完成結帳。

    <Note>
    結帳期間，你可以選擇已預先購買並立即整合到 OpenClaw 內的**即用型 AI** 點數 -- 不需要其他提供者的外部帳戶或 API 金鑰。你可以立即開始聊天。或者，也可以在設定期間提供你自己的 Anthropic、OpenAI、Google Gemini 或 xAI 金鑰。
    </Note>

  </Step>

  <Step title="選擇訊息通道">
    選擇一個或多個要連接的通道：

    - **WhatsApp** -- 掃描設定精靈中顯示的 QR 碼。
    - **Telegram** -- 貼上來自 [BotFather](https://t.me/BotFather) 的 Bot 權杖。

  </Step>

  <Step title="完成安裝">
    按一下**完成**以部署實例。準備就緒後，從 hPanel 的 **OpenClaw 概覽**存取 OpenClaw 儀表板。
  </Step>

</Steps>

## 選項 B：VPS 上的 OpenClaw

可對伺服器進行更多控制。Hostinger 會透過 Docker 在你的 VPS 上部署 OpenClaw；你可透過 hPanel 中的 **Docker Manager** 管理它。

<Steps>
  <Step title="購買 VPS">
    1. 從 [Hostinger OpenClaw 頁面](https://www.hostinger.com/openclaw)，選擇 VPS 上的 OpenClaw 方案並完成結帳。

    <Note>
    你可以在結帳期間選擇**即用型 AI** 點數 -- 這些點數已預先購買並立即整合到 OpenClaw 內，因此你可以在沒有其他提供者的任何外部帳戶或 API 金鑰的情況下開始聊天。
    </Note>

  </Step>

  <Step title="設定 OpenClaw">
    VPS 佈建完成後，填寫設定欄位：

    - **閘道權杖** -- 自動產生；請儲存供日後使用。
    - **WhatsApp 號碼** -- 你的號碼，包含國碼（選填）。
    - **Telegram Bot 權杖** -- 來自 [BotFather](https://t.me/BotFather)（選填）。
    - **API 金鑰** -- 只有在結帳期間未選擇即用型 AI 點數時才需要。

  </Step>

  <Step title="啟動 OpenClaw">
    按一下**部署**。執行後，按一下**開啟**，從 hPanel 開啟 OpenClaw 儀表板。
  </Step>

</Steps>

日誌、重新啟動和更新都從 hPanel 的 Docker Manager 介面執行。若要更新，請在 Docker Manager 中按下**更新**以拉取最新映像。

## 驗證你的設定

在你已連接的通道上傳送「嗨」給你的助理。OpenClaw 會回覆並引導你完成初始偏好設定。

## 疑難排解

**儀表板無法載入** -- 等候幾分鐘讓容器完成佈建，然後檢查 hPanel 中的 Docker Manager 日誌。

**Docker 容器持續重新啟動** -- 開啟 Docker Manager 日誌，並尋找設定錯誤（缺少權杖、無效的 API 金鑰）。

**Telegram Bot 沒有回應** -- 如果需要私訊配對，未知傳送者會收到簡短的配對碼，而不是回覆。請從 OpenClaw 儀表板聊天中核准它，或者如果你有容器的 shell 存取權，使用 `openclaw pairing approve telegram <CODE>` 核准。請參閱[配對](/zh-TW/channels/pairing)。

## 後續步驟

- [通道](/zh-TW/channels) -- 連接 Telegram、WhatsApp、Discord 等
- [閘道設定](/zh-TW/gateway/configuration) -- 所有設定選項

## 相關

- [安裝概覽](/zh-TW/install)
- [VPS 託管](/zh-TW/vps)
- [DigitalOcean](/zh-TW/install/digitalocean)
