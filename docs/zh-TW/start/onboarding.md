---
read_when:
    - 設計 macOS 入門助理
    - 實作驗證或身分設定
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw（macOS 應用程式）的首次執行設定流程
title: 入門設定（macOS 應用程式）
x-i18n:
    generated_at: "2026-07-06T21:54:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1cdd8600b0d86ec598266671715cebbbe1c86e951b6a95b3e166f2309d2a9130
    source_path: start/onboarding.md
    workflow: 16
---

macOS app 的首次執行流程：選擇閘道執行的位置、連接已驗證的 AI 後端、授予權限，並交接給 agent 自己的啟動儀式。
如需命令列介面 onboarding，以及兩種路徑的比較，請參閱 [Onboarding 概觀](/zh-TW/start/onboarding-overview)。

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

安全信任模型：

- 根據預設，OpenClaw 是個人 agent：單一受信任操作者邊界。
- 共享/多使用者設定需要鎖定：拆分信任邊界、將工具存取維持在最低限度，並遵循 [安全性](/zh-TW/gateway/security)。
- 本機 onboarding 會將新設定預設為 `tools.profile: "coding"`，讓新設定保留檔案系統/執行階段工具，而不使用不受限制的 `full` profile。
- 如果啟用 hooks/網路鉤子或其他不受信任的內容來源，請使用強大的現代模型層級，並維持嚴格的工具政策/沙箱隔離。

</Step>
<Step title="本機與遠端">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**閘道**在哪裡執行？

- **這台 Mac（僅本機）：** onboarding 會設定 auth，並在本機寫入憑證。
- **遠端（透過 SSH/Tailnet）：** onboarding **不會**設定本機 auth；
  憑證必須已存在於閘道主機上。遠端閘道 token
  欄位會儲存 macOS app 用來連線到該閘道的 token；
  現有的 `gateway.remote.token` SecretRef 值會保留，直到你
  取代它們。
- **稍後設定：**略過設定，讓 app 保持未設定狀態。

<Tip>
**閘道 auth 提示：**

- 閘道 auth 模式預設為 `token`，即使是 loopback bind 也是如此，因此本機 WS clients 必須驗證。
- 設定 `gateway.auth.mode: "none"` 會允許任何本機程序連線；只應在完全受信任的機器上使用。
- 多機器存取或非 loopback bind 請使用 token。

</Tip>
</Step>
<Step title="命令列介面">
  本機設定會透過 npm、pnpm 或 bun 安裝全域 `openclaw` 命令列介面，
  並優先使用 npm。節點 仍是閘道本身建議使用的執行階段。
  現有相容安裝會被重複使用。
</Step>
<Step title="連接你的 AI">
  閘道準備就緒後，onboarding 會尋找你已擁有的 AI 存取權：
  Claude Code、Codex 或 Gemini CLI 登入，或 `OPENAI_API_KEY` /
  `ANTHROPIC_API_KEY`。最佳選項會透過真實 completion 測試，且
  只有在它回應後才會儲存；當測試失敗時，app 會自動嘗試
  下一個選項，並顯示上一個選項失敗的原因。如果找到多個選項，
  你可以在繼續前切換它們。

如果沒有找到任何項目（或都無法運作），手動 key/token 選擇器會載入
閘道的作用中文字推論 provider 外掛，而不是使用固定的 app
清單。選取的 provider 會提供其 starter model 和 config；OpenClaw
會先用相同的即時測試驗證憑證，再儲存其 auth profile。下一步
會維持鎖定，直到有一個後端通過為止，因此第一個 agent chat 無法在
沒有可用推論的情況下開始。Crestodian chat 會從這個頁面保持可用
（之後也可在 Settings → Crestodian 下使用），用來以淺白語言取得協助。

稍後設定會略過此步驟。
</Step>
<Step title="權限">

<Frame caption="選擇你想授予 OpenClaw 哪些權限">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Onboarding 會請求下列 TCC 權限：Automation (AppleScript)、Notifications、Accessibility、Screen Recording、Microphone、Speech Recognition、Camera 和 Location。

</Step>
<Step title="Onboarding Chat（專用 session）">
  設定完成後，app 會開啟獨立的 agent onboarding chat，讓 agent 可以
  介紹自己並引導後續步驟，而不會將該交換混入一般對話歷史。
  這會接續 Crestodian 設定對話；它不會取代該對話。請參閱
  [Bootstrapping](/zh-TW/start/bootstrapping)，了解 agent 的第一個真實 turn
  在閘道主機上會發生什麼事。
</Step>
</Steps>

## 相關

- [Onboarding 概觀](/zh-TW/start/onboarding-overview)
- [開始使用](/zh-TW/start/getting-started)
