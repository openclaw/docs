---
read_when:
    - 設計 macOS 入門導覽助理
    - 實作驗證或身分設定
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw 的首次執行設定流程（macOS 應用程式）
title: 新手引導（macOS 應用程式）
x-i18n:
    generated_at: "2026-04-30T03:40:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: aa516f8f5b4c7318f27a5af4e7ac12f5685aef6f84579a68496c2497d6f9041d
    source_path: start/onboarding.md
    workflow: 16
---

本文件描述**目前**的首次執行設定流程。目標是提供順暢的「第 0 天」體驗：選擇 Gateway 的執行位置、連接驗證、執行精靈，並讓代理自行啟動。
如需 onboarding 路徑的一般概觀，請參閱 [Onboarding 概觀](/zh-TW/start/onboarding-overview)。

<Steps>
<Step title="核准 macOS 警告">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="允許尋找本機網路">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="歡迎與安全性通知">
<Frame caption="閱讀顯示的安全性通知，並據此決定">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

安全信任模型：

- 預設情況下，OpenClaw 是個人代理：單一受信任的操作者邊界。
- 共用/多使用者設定需要鎖定（分割信任邊界、將工具存取維持在最低限度，並遵循 [安全性](/zh-TW/gateway/security)）。
- 本機 onboarding 現在會將新設定預設為 `tools.profile: "coding"`，因此全新的本機設定會保留檔案系統/執行階段工具，而不會強制使用不受限制的 `full` 設定檔。
- 如果啟用 hooks/webhooks 或其他不受信任的內容來源，請使用強大的現代模型等級，並維持嚴格的工具政策/沙箱化。

</Step>
<Step title="本機與遠端">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** 在哪裡執行？

- **這台 Mac（僅限本機）：** onboarding 可以設定驗證並在本機寫入憑證。
- **遠端（透過 SSH/Tailnet）：** onboarding **不會**設定本機驗證；憑證必須存在於 Gateway 主機上。
- **稍後設定：** 跳過設定，讓應用程式保持未設定狀態。

<Tip>
**Gateway 驗證提示：**

- 精靈現在即使對 loopback 也會產生**權杖**，因此本機 WS 用戶端必須驗證。
- 如果停用驗證，任何本機程序都可以連線；只應在完全受信任的機器上這樣做。
- 多機器存取或非 loopback 綁定請使用**權杖**。

</Tip>
</Step>
<Step title="權限">
<Frame caption="選擇你要授予 OpenClaw 哪些權限">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Onboarding 會要求下列所需的 TCC 權限：

- 自動化（AppleScript）
- 通知
- 輔助使用
- 螢幕錄製
- 麥克風
- 語音辨識
- 相機
- 位置

</Step>
<Step title="CLI">
  <Info>此步驟為選用</Info>
  應用程式可以透過 npm、pnpm 或 bun 安裝全域 `openclaw` CLI。
  它會優先使用 npm，其次是 pnpm，若 bun 是唯一偵測到的套件管理器才會使用 bun。
  對於 Gateway 執行階段，Node 仍然是建議的路徑。
</Step>
<Step title="Onboarding 聊天（專用工作階段）">
  設定完成後，應用程式會開啟專用的 onboarding 聊天工作階段，讓代理能夠
  介紹自己並引導後續步驟。這會將首次執行指引與你的正常對話分開。
  請參閱 [啟動](/zh-TW/start/bootstrapping)，了解首次代理執行期間 Gateway 主機上會發生什麼事。
</Step>
</Steps>

## 相關

- [Onboarding 概觀](/zh-TW/start/onboarding-overview)
- [開始使用](/zh-TW/start/getting-started)
