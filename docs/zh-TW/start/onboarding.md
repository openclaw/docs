---
read_when:
    - 設計 macOS 入門設定助理
    - 實作驗證或身分設定
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw（macOS 應用程式）的首次執行設定流程
title: 入門設定（macOS 應用程式）
x-i18n:
    generated_at: "2026-06-27T20:03:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 73f902bcbb7ef782d4a5fbe442a8855a8fcb426d45167c4d2fc1fc050263b5f1
    source_path: start/onboarding.md
    workflow: 16
---

本文件說明**目前**的首次執行設定流程。目標是提供順暢的「第 0 天」體驗：選擇閘道執行的位置、連接驗證、執行精靈，並讓代理程式自行啟動。
如需上線路徑的一般概覽，請參閱[上線概覽](/zh-TW/start/onboarding-overview)。

<Steps>
<Step title="核准 macOS 警告">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="核准尋找本機網路">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="歡迎與安全性通知">
<Frame caption="閱讀顯示的安全性通知，並據此決定">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

安全性信任模型：

- 預設情況下，OpenClaw 是個人代理程式：單一受信任的操作者邊界。
- 共用/多使用者設定需要鎖定（分割信任邊界、將工具存取權限維持在最低限度，並遵循[安全性](/zh-TW/gateway/security)）。
- 本機上線現在會將新設定預設為 `tools.profile: "coding"`，因此新的本機設定會保留檔案系統/執行階段工具，而不必強制使用不受限制的 `full` 設定檔。
- 如果啟用 hooks/網路鉤子或其他不受信任的內容來源，請使用強大的現代模型層級，並維持嚴格的工具政策/沙箱隔離。

</Step>
<Step title="本機與遠端">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**閘道**在哪裡執行？

- **這台 Mac（僅限本機）：** 上線流程可以在本機設定驗證並寫入憑證。
- **遠端（透過 SSH/Tailnet）：** 上線流程**不會**設定本機驗證；憑證必須已存在於閘道主機上。遠端閘道權杖欄位會儲存 macOS 應用程式用來連線到該閘道的權杖；現有非明文的 `gateway.remote.token` 值會被保留，直到你替換它們。
- **稍後設定：** 略過設定，讓應用程式保持未設定狀態。

<Tip>
**閘道驗證提示：**

- 精靈現在即使對 loopback 也會產生**權杖**，因此本機 WS 用戶端必須驗證。
- 如果停用驗證，任何本機程序都可以連線；只應在完全受信任的機器上這樣做。
- 對多機器存取或非 loopback 綁定使用**權杖**。

</Tip>
</Step>
<Step title="權限">
<Frame caption="選擇你要授予 OpenClaw 哪些權限">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

上線流程會要求以下用途所需的 TCC 權限：

- 自動化（AppleScript）
- 通知
- 輔助使用
- 螢幕錄製
- 麥克風
- 語音辨識
- 相機
- 位置

</Step>
<Step title="命令列介面">
  <Info>此步驟為選用</Info>
  應用程式可以透過 npm、pnpm 或 bun 安裝全域 `openclaw` 命令列介面。
  它會優先使用 npm，其次是 pnpm；如果 bun 是唯一偵測到的
  套件管理器，才會使用 bun。對於閘道執行階段，節點仍是建議路徑。
</Step>
<Step title="上線聊天（專用工作階段）">
  設定完成後，應用程式會開啟專用的上線聊天工作階段，讓代理程式可以
  自我介紹並引導後續步驟。這會將首次執行指引與你的正常對話分開。
  請參閱[啟動](/zh-TW/start/bootstrapping)，了解首次代理程式執行期間閘道主機上會發生什麼事。
</Step>
</Steps>

## 相關

- [上線概覽](/zh-TW/start/onboarding-overview)
- [開始使用](/zh-TW/start/getting-started)
