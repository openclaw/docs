---
read_when:
    - 設計 macOS 新手設定助理
    - 實作驗證或身分設定
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw（macOS 應用程式）的首次執行設定流程
title: 新手設定（macOS 應用程式）
x-i18n:
    generated_at: "2026-07-12T14:49:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cced671a375bd80cbdf920383add8cf01f75a85259963a4286e9ce49913d8b47
    source_path: start/onboarding.md
    workflow: 16
---

macOS App 的首次執行流程：選擇閘道的執行位置、連線至已驗證的 AI 後端、授予權限，然後交由代理程式執行自己的啟動儀式。
如需命令列介面新手設定的資訊及兩種路徑的比較，請參閱[新手設定概觀](/zh-TW/start/onboarding-overview)。

<Steps>
<Step title="允許 macOS 警告">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="允許尋找區域網路">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="歡迎與安全性通知">
<Frame caption="閱讀顯示的安全性通知，並據此做出決定">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

安全信任模型：

- OpenClaw 預設為個人代理程式：具有單一受信任操作者邊界。
- 共用／多使用者設定需要嚴格限制：分隔信任邊界、將工具存取權限降至最低，並遵循[安全性](/zh-TW/gateway/security)指引。
- 本機新手設定會將新設定預設為 `tools.profile: "coding"`，使全新設定可保留檔案系統／執行階段工具，而不使用不受限制的 `full` 設定檔。
- 如果已啟用掛鉤／網路鉤子或其他不受信任的內容來源，請使用強大的現代模型層級，並維持嚴格的工具政策／沙箱隔離。

</Step>
<Step title="本機與遠端">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**閘道**要在哪裡執行？

- **這台 Mac（僅限本機）：**新手設定會在本機設定驗證並寫入認證資訊。
- **遠端（透過 SSH/Tailnet）：**新手設定**不會**設定本機驗證；
  認證資訊必須已存在於閘道主機上。遠端閘道權杖
  欄位會儲存 macOS App 用來連線至該閘道的權杖；
  現有的 `gateway.remote.token` SecretRef 值會保留，直到你
  將其取代。
- **稍後設定：**略過設定，讓 App 保持未設定狀態。

<Tip>
**閘道驗證提示：**

- 即使繫結至回送介面，閘道驗證模式仍預設為 `token`，因此本機 WS 用戶端必須進行驗證。
- 設定 `gateway.auth.mode: "none"` 會允許任何本機程序連線；請僅在完全受信任的機器上使用。
- 若要進行多機器存取或非回送介面繫結，請使用權杖。

</Tip>
</Step>
<Step title="命令列介面">
  本機設定會透過 npm、pnpm 或 bun 安裝全域 `openclaw` 命令列介面，
  並優先使用 npm。Node 仍是閘道本身建議使用的執行階段。
  現有的相容安裝會直接沿用。
</Step>
<Step title="連接你的 AI">
  若連線的閘道已設定代理程式模型，則會完全略過此
  頁面，並開啟一般代理程式 UI。Crestodian 與供應商設定
  僅會針對全新或設定不完整的閘道執行。

閘道就緒後，新手設定會尋找你已有的 AI 存取方式：
Claude Code 或 Codex 登入，或 `OPENAI_API_KEY` /
`ANTHROPIC_API_KEY`。系統會使用真實補全測試最佳選項，
並僅在取得回應後儲存；測試失敗時，App 會自動嘗試
下一個選項，並顯示上一個選項失敗的原因。如果找到多個選項，
你可以在繼續之前切換選擇。

設定完成後，Gemini CLI 仍可供一般代理程式使用，但此處不會
提供該選項，因為它無法強制執行無工具推論探測。

你也可以透過供應商自己的 OAuth 或裝置配對流程登入。
內建選項包括 OpenAI/ChatGPT、OpenRouter、GitHub Copilot、Google
Gemini CLI、xAI、MiniMax Global 和 CN，以及 Chutes。此清單來自
閘道目前啟用的文字推論供應商外掛，而非 App 內的固定清單，
因此其他供應商無須新增供應商專用的 macOS 程式碼即可選擇加入。

手動金鑰／權杖選擇器使用相同的供應商登錄。在所有路徑中，
供應商會提供其初始模型與設定；OpenClaw 會使用相同的即時測試
驗證認證資訊，然後才儲存其驗證設定檔。在一個後端通過測試前，
「下一步」會維持鎖定，因此第一次代理程式聊天無法在推論功能
未正常運作時開始。即時檢查通過後，即可使用 Crestodian 協助設定
其餘的工作區、閘道、頻道與其他選用功能；之後也可從 Settings → Crestodian
使用該功能。
</Step>
<Step title="權限">

<Frame caption="選擇你要授予 OpenClaw 哪些權限">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

新手設定會要求下列 TCC 權限：自動化（AppleScript）、通知、輔助使用、螢幕錄製、麥克風、語音辨識、相機和定位服務。

</Step>
<Step title="完成">
  推論通過後，Crestodian 會接手其餘的選用設定，並可
  將你移交至一般代理程式聊天。完成權限引導流程
  會開啟同一個聊天；在 Crestodian 之前，App 不會建立工作區或啟動獨立的
  代理程式設定對話。請參閱
  [啟動程序](/zh-TW/start/bootstrapping)，以瞭解代理程式第一次真正執行時，
  閘道主機上會發生什麼事。
</Step>
</Steps>

## 相關內容

- [新手設定概觀](/zh-TW/start/onboarding-overview)
- [開始使用](/zh-TW/start/getting-started)
