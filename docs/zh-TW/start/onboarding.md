---
read_when:
    - 設計 macOS 初始設定助理
    - 實作驗證或身分設定
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw 首次執行設定流程（macOS 應用程式）
title: 入門設定（macOS 應用程式）
x-i18n:
    generated_at: "2026-07-11T21:48:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cced671a375bd80cbdf920383add8cf01f75a85259963a4286e9ce49913d8b47
    source_path: start/onboarding.md
    workflow: 16
---

macOS 應用程式的首次執行流程：選擇閘道的執行位置、連接經過驗證的 AI 後端、授予權限，並交由代理程式執行其自身的初始啟動流程。
如需命令列介面新手引導及兩種路徑的比較，請參閱[新手引導概覽](/zh-TW/start/onboarding-overview)。

<Steps>
<Step title="核准 macOS 警告">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="核准尋找區域網路">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="歡迎與安全性通知">
<Frame caption="閱讀顯示的安全性通知，並據此決定">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

安全性信任模型：

- OpenClaw 預設為個人代理程式：採用單一受信任操作者邊界。
- 共用／多使用者設定需要嚴格限制：分隔信任邊界、將工具存取權限降至最低，並遵循[安全性](/zh-TW/gateway/security)指引。
- 本機新手引導會將新設定預設為 `tools.profile: "coding"`，讓全新設定保留檔案系統／執行階段工具，而不使用不受限制的 `full` 設定檔。
- 如果啟用了掛鉤／網路鉤子或其他不受信任的內容來源，請使用功能強大的現代模型層級，並維持嚴格的工具政策／沙箱隔離。

</Step>
<Step title="本機與遠端">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**閘道**要在哪裡執行？

- **這台 Mac（僅限本機）：**新手引導會設定驗證，並將憑證寫入本機。
- **遠端（透過 SSH/Tailnet）：**新手引導**不會**設定本機驗證；憑證必須已存在於閘道主機上。遠端閘道權杖欄位會儲存 macOS 應用程式用來連線至該閘道的權杖；現有的 `gateway.remote.token` SecretRef 值會保留，直到你將其取代。
- **稍後設定：**略過設定，讓應用程式維持未設定狀態。

<Tip>
**閘道驗證提示：**

- 即使繫結至 loopback，閘道驗證模式仍預設為 `token`，因此本機 WS 用戶端必須進行驗證。
- 設定 `gateway.auth.mode: "none"` 會允許任何本機程序連線；僅可在完全受信任的機器上使用此設定。
- 多機器存取或非 loopback 繫結應使用權杖。

</Tip>
</Step>
<Step title="命令列介面">
  本機設定會透過 npm、pnpm 或 bun 安裝全域 `openclaw` 命令列介面，並優先使用 npm。節點仍是閘道本身建議使用的執行階段。現有的相容安裝會被重複使用。
</Step>
<Step title="連接你的 AI">
  如果已連線的閘道已設定代理程式模型，便會完全略過此頁面並開啟一般代理程式介面。Crestodian 和供應商設定只會針對全新或尚未完整設定的閘道執行。

閘道準備就緒後，新手引導會尋找你現有的 AI 存取方式：Claude Code 或 Codex 登入，或 `OPENAI_API_KEY`／`ANTHROPIC_API_KEY`。系統會以實際補全測試最佳選項，並只在收到回應後儲存；測試失敗時，應用程式會自動嘗試下一個選項，並顯示上一個選項失敗的原因。如果找到多個選項，你可以在繼續之前切換選擇。

設定完成後，Gemini CLI 仍可供一般代理程式使用，但此處不會提供，因為它無法強制執行無工具的推論探測。

你也可以透過供應商本身的 OAuth 或裝置配對流程登入。內建選項包括 OpenAI/ChatGPT、OpenRouter、GitHub Copilot、Google Gemini CLI、xAI、MiniMax Global and CN，以及 Chutes。此清單來自閘道目前啟用的文字推論供應商外掛，而非應用程式中的固定清單，因此其他供應商無須新增供應商專用的 macOS 程式碼即可選擇加入。

手動金鑰／權杖選擇器使用相同的供應商登錄檔。在所有路徑中，供應商會提供其初始模型與設定；OpenClaw 會使用相同的即時測試驗證憑證，然後才儲存其驗證設定檔。在任一後端通過測試前，「下一步」會維持鎖定，因此首次代理程式對話無法在推論功能未正常運作時開始。通過即時檢查後，即可使用 Crestodian 協助設定其餘工作區、閘道、頻道及其他選用功能；之後也可以在 Settings → Crestodian 中使用。
</Step>
<Step title="權限">

<Frame caption="選擇要授予 OpenClaw 哪些權限">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

新手引導會要求下列 TCC 權限：自動化（AppleScript）、通知、輔助使用、螢幕錄製、麥克風、語音辨識、相機及位置資訊。

</Step>
<Step title="完成">
  推論測試通過後，Crestodian 會接手其餘選用設定，並可將你轉入一般代理程式對話。完成權限引導後會開啟同一個對話；應用程式不會在 Crestodian 之前建立工作區或啟動另一個代理程式設定對話。請參閱[初始啟動](/zh-TW/start/bootstrapping)，瞭解代理程式首次實際執行時，閘道主機上會發生什麼事。
</Step>
</Steps>

## 相關內容

- [新手引導概覽](/zh-TW/start/onboarding-overview)
- [開始使用](/zh-TW/start/getting-started)
