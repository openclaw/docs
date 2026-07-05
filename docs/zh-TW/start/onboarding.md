---
read_when:
    - 設計 macOS 入門助理
    - 實作驗證或身分設定
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw（macOS 應用程式）的首次執行設定流程
title: 入門設定（macOS 應用程式）
x-i18n:
    generated_at: "2026-07-05T17:41:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2784a013164bd07780378915643c1409bfe2217eb15ec5da3992d6d60c69bf59
    source_path: start/onboarding.md
    workflow: 16
---

macOS App 的首次執行流程：選擇閘道執行位置、連接已驗證的 AI 後端、授予權限，並交接給代理程式自己的啟動儀式。
如需命令列介面入門設定，以及兩種路徑的比較，請參閱[入門設定概覽](/zh-TW/start/onboarding-overview)。

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

- 根據預設，OpenClaw 是個人代理程式：單一受信任操作者邊界。
- 共用/多使用者設定需要鎖定：拆分信任邊界、將工具存取維持在最低限度，並遵循[安全性](/zh-TW/gateway/security)。
- 本機入門設定會將新設定預設為 `tools.profile: "coding"`，讓全新設定保留檔案系統/執行階段工具，而不使用不受限制的 `full` 設定檔。
- 如果啟用 hooks/webhooks 或其他不受信任的內容來源，請使用強大的現代模型層級，並維持嚴格的工具政策/沙盒化。

</Step>
<Step title="本機與遠端">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**閘道** 在哪裡執行？

- **這台 Mac（僅本機）：** 入門設定會在本機設定驗證並寫入憑證。
- **遠端（透過 SSH/Tailnet）：** 入門設定**不會**設定本機驗證；
  憑證必須已存在於閘道主機上。遠端閘道權杖
  欄位會儲存 macOS App 用來連接該閘道的權杖；
  現有的 `gateway.remote.token` SecretRef 值會保留，直到你
  取代它們。
- **稍後設定：** 跳過設定並讓 App 保持未設定狀態。

<Tip>
**閘道驗證提示：**

- 即使是 loopback 繫結，閘道驗證模式也預設為 `token`，因此本機 WS 用戶端必須驗證。
- 設定 `gateway.auth.mode: "none"` 會讓任何本機程序都能連線；僅在完全受信任的機器上使用。
- 多機器存取或非 loopback 繫結請使用權杖。

</Tip>
</Step>
<Step title="命令列介面">
  本機設定會透過 npm、pnpm 或 bun 安裝全域 `openclaw` 命令列介面，
  並優先使用 npm。節點 仍是閘道本身的建議執行階段。
  現有的相容安裝會被重複使用。
</Step>
<Step title="連接你的 AI">
  閘道就緒後，入門設定會尋找你已有的 AI 存取權：
  Claude Code、Codex 或 Gemini 命令列介面登入，或 `OPENAI_API_KEY` /
  `ANTHROPIC_API_KEY`。最佳選項會以真實 completion 測試，
  且只有在它回應後才會儲存；當測試失敗時，App 會自動嘗試
  下一個選項，並顯示上一個選項失敗的原因。如果找到多個選項，
  你可以在繼續前於它們之間切換。

如果找不到任何項目（或都無法運作），手動步驟會接受 Anthropic、OpenAI 或 Google 的 API key，
以相同方式驗證，並將其儲存為
驗證設定檔。在其中一個後端通過即時測試前，「下一步」會保持鎖定，
因此第一個代理程式聊天永遠不會在推論無法運作時開始。
Crestodian 聊天會從此頁面（以及稍後在
設定 → Crestodian 下）保持可用，以用白話協助你。

「稍後設定」會跳過此步驟。
</Step>
<Step title="權限">

<Frame caption="選擇你想授予 OpenClaw 哪些權限">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

入門設定會要求以下 TCC 權限：自動化 (AppleScript)、通知、輔助使用、螢幕錄製、麥克風、語音辨識、相機和定位。

</Step>
<Step title="入門聊天（專用工作階段）">
  設定完成後，App 會開啟一個獨立的代理程式入門聊天，讓代理程式可以
  自我介紹並引導後續步驟，而不會把該交流混入
  一般對話記錄。這會接續 Crestodian 設定對話；
  它不會取代該對話。請參閱[啟動](/zh-TW/start/bootstrapping)，了解
  代理程式第一次真實回合期間，閘道主機上會發生什麼事。
</Step>
</Steps>

## 相關

- [入門設定概覽](/zh-TW/start/onboarding-overview)
- [開始使用](/zh-TW/start/getting-started)
