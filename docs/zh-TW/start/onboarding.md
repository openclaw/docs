---
read_when:
    - 設計 macOS 入門助理
    - 實作驗證或身分設定
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw（macOS 應用程式）的首次執行設定流程
title: 入門設定（macOS 應用程式）
x-i18n:
    generated_at: "2026-07-05T11:43:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc363e013ae9921e9fde489ca856739037dd8b19bdcef55cf0466171968159af
    source_path: start/onboarding.md
    workflow: 16
---

macOS 應用程式的首次執行流程：選擇閘道執行的位置、透過與 Crestodian 對話完成本機
設定、授予權限，並交接給
代理程式自己的啟動儀式。
如需命令列介面入門設定及兩種路徑的比較，請參閱[入門設定概覽](/zh-TW/start/onboarding-overview)。

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
<Step title="歡迎與安全性注意事項">
<Frame caption="閱讀顯示的安全性注意事項，並據此決定">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

安全信任模型：

- 根據預設，OpenClaw 是個人代理程式：單一受信任操作員邊界。
- 共用/多使用者設定需要鎖定：拆分信任邊界、將工具存取維持在最低限度，並遵循[安全性](/zh-TW/gateway/security)。
- 本機入門設定會將新設定預設為 `tools.profile: "coding"`，讓全新設定保留檔案系統/執行階段工具，而不使用不受限制的 `full` 設定檔。
- 如果已啟用 hooks/網路鉤子或其他不受信任的內容來源，請使用強大的現代模型級別，並維持嚴格的工具政策/沙箱化。

</Step>
<Step title="本機與遠端">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**閘道**在哪裡執行？

- **這台 Mac（僅限本機）：** 入門設定會在本機設定驗證並寫入憑證。
- **遠端（透過 SSH/Tailnet）：** 入門設定**不會**設定本機驗證；
  憑證必須已存在於閘道主機上。遠端閘道權杖
  欄位會儲存 macOS 應用程式用來連線到該閘道的權杖；
  現有的 `gateway.remote.token` SecretRef 值會保留，直到你
  取代它們。
- **稍後設定：** 略過設定，並讓應用程式保持未設定狀態。

<Tip>
**閘道驗證提示：**

- 即使是 loopback 繫結，閘道驗證模式也預設為 `token`，因此本機 WS 用戶端必須驗證。
- 設定 `gateway.auth.mode: "none"` 會讓任何本機程序都能連線；只有在完全受信任的機器上才使用這個設定。
- 對於多機器存取或非 loopback 繫結，請使用權杖。

</Tip>
</Step>
<Step title="命令列介面">
  本機設定會透過 npm、pnpm 或 bun 安裝全域 `openclaw` 命令列介面，
  並優先使用 npm。節點仍是閘道
  本身建議使用的執行階段。現有相容安裝會被重複使用。
</Step>
<Step title="與 Crestodian 對話">
  本機設定會在閘道就緒後，開啟與 Crestodian 的專用對話。
  Crestodian 會偵測既有的 Claude Code 或 Codex 登入，以及
  支援的 API 金鑰，提出工作區與設定建議，然後在
  寫入任何內容前等待核准。在對話
  已產生設定狀態前，下一步會保持鎖定。憑證提示會使用遮罩輸入；在發生
  模糊的傳輸失敗後，請重新啟動設定對話，而不是
  重播上一輪。

遠端與稍後設定流程會略過這個本機設定對話。
</Step>
<Step title="權限">

<Frame caption="選擇你要授予 OpenClaw 哪些權限">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

入門設定會要求下列 TCC 權限：自動化（AppleScript）、通知、輔助使用、螢幕錄製、麥克風、語音辨識、相機和位置。

</Step>
<Step title="入門設定聊天（專用工作階段）">
  設定完成後，應用程式會開啟個別的代理程式入門設定聊天，讓代理程式可以
  介紹自己並引導後續步驟，而不會把該交流混入
  一般對話歷史記錄。這會接續 Crestodian 設定對話；
  並不會取代它。如需了解代理程式首次真實回合期間
  在閘道主機上發生的事項，請參閱[啟動](/zh-TW/start/bootstrapping)。
</Step>
</Steps>

## 相關

- [入門設定概覽](/zh-TW/start/onboarding-overview)
- [開始使用](/zh-TW/start/getting-started)
