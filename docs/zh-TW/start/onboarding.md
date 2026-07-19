---
read_when:
    - 設計 macOS 初始設定助理
    - 實作驗證或身分設定
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw 首次執行設定流程（macOS App）
title: 新手設定（macOS App）
x-i18n:
    generated_at: "2026-07-19T14:05:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 19527a001bf4e06a214a03872d1a60f66cc90067dbebf87a7798eb46ff0260d5
    source_path: start/onboarding.md
    workflow: 16
---

macOS App 的首次執行流程：選擇閘道的執行位置、連線至已驗證的 AI 後端、授予權限，然後交由代理程式執行自己的啟動儀式。
如需命令列介面引導設定，以及兩種路徑的比較，請參閱[引導設定概覽](/zh-TW/start/onboarding-overview)。

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
<Step title="歡迎與安全性注意事項">
<Frame caption="閱讀顯示的安全性注意事項，並據此做出決定">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

安全性信任模型：

- OpenClaw 預設是個人代理程式：採用單一受信任操作者邊界。
- 共用／多使用者設定需要嚴格限制：劃分信任邊界、將工具存取權限降至最低，並遵循[安全性](/zh-TW/gateway/security)指南。
- 本機引導設定預設會將新設定設為 `tools.profile: "coding"`，讓全新設定保有檔案系統／執行階段工具，同時不採用不受限制的 `full` 設定檔。
- 若已啟用掛鉤／網路鉤子或其他不受信任的內容來源，請使用強大的現代模型等級，並維持嚴格的工具政策／沙箱隔離。

</Step>
<Step title="本機與遠端">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**閘道**要在哪裡執行？

- **此 Mac（僅限本機）：**引導設定會設定驗證，並將認證資訊寫入本機。
- **遠端（透過 SSH/Tailnet）：**引導設定**不會**設定本機驗證；
  認證資訊必須已存在於閘道主機上。遠端閘道權杖
  欄位會儲存 macOS App 用來連線至該閘道的權杖；
  現有的 `gateway.remote.token` SecretRef 值會保留，直到你
  將其取代。
- **稍後設定：**略過設定，並讓 App 維持未設定狀態。

<Tip>
**閘道驗證提示：**

- 即使綁定至迴路介面，閘道驗證模式也預設為 `token`，因此本機 WS 用戶端必須進行驗證。
- 設定 `gateway.auth.mode: "none"` 會允許任何本機處理程序連線；請只在完全受信任的機器上使用此設定。
- 若要從多部機器存取或綁定至非迴路介面，請使用權杖。

</Tip>
</Step>
<Step title="命令列介面">
  本機設定會透過 npm、pnpm 或 bun 安裝全域 `openclaw` 命令列介面，
  並優先使用 npm。節點仍是閘道本身建議使用的執行階段。
  現有的相容安裝會直接重複使用。
</Step>
<Step title="連線你的 AI">
  如果已連線的閘道已設定代理程式模型，就會完全略過此
  頁面並開啟一般的代理程式 UI。只有全新或設定不完整的閘道
  才會執行 OpenClaw 與供應商設定。

閘道就緒後，引導設定會尋找你現有的 AI 存取方式：
Claude Code 或 Codex 登入、`OPENAI_API_KEY` / `ANTHROPIC_API_KEY`，或已安裝在可連線的 Ollama 或 LM Studio 伺服器中、
具備工具功能的模型。偵測會在閘道主機上執行，包括 macOS App 連線至
Linux 閘道的情況。系統會使用實際的補全測試最佳選項，且只會在
成功回應後儲存；測試失敗時，App 會自動嘗試下一個選項，
並顯示上一個選項失敗的原因。若找到多個選項，你可以在繼續之前
切換選擇。自動本機探索絕不會提取或下載模型。

若要在閘道主機沒有 Claude 命令列介面登入的情況下使用 Claude 訂閱，請在
任何已安裝 Claude Code 的機器上執行 `claude setup-token`，然後將
輸出的權杖貼到 **Connect with an API key or
token** 下的 **Anthropic setup-token**。

如果已安裝 Gemini CLI、Antigravity、Pi 和 OpenCode 命令列介面，但無法選為可重複使用的引導設定推論路徑，
仍會顯示它們以供參考。
Gemini 和 Antigravity 無法強制執行不使用工具的推論探測。Pi 和
OpenCode 是完整的代理程式框架，而非設定推論路徑；它們的
工作階段整合需要另外設定執行階段與外掛。

你也可以透過供應商自己的 OAuth 或裝置配對流程登入。
內建選項包括 OpenAI/ChatGPT、OpenRouter、GitHub Copilot、Google
Gemini CLI、xAI、MiniMax Global 和 CN，以及 Chutes。此清單來自
閘道目前啟用的文字推論供應商外掛，而非 App 的固定清單，
因此其他供應商可以選擇加入，而不必新增供應商專用的 macOS 程式碼。

手動金鑰／權杖選擇器使用相同的供應商登錄檔。在每種路徑中，
供應商都會提供其初始模型與設定；OpenClaw 會先使用相同的即時測試
驗證認證資訊，之後才儲存其驗證設定檔。在有一個後端通過測試前，
下一步會維持鎖定狀態，因此無法在推論功能無法運作的情況下開始第一次代理程式對話。
通過該即時檢查後，即可使用 OpenClaw
協助設定其餘的工作區、閘道、頻道及
其他選用功能。當 OpenClaw 提供精簡的選項清單時，App
會顯示原生選項卡片；選擇其中一項便會傳送該選擇，而 **Skip for
now** 一律會讓該選擇維持選用。之後也可以在
Settings → OpenClaw 下使用 OpenClaw。
</Step>
<Step title="匯入記憶（偵測到時顯示）">
對於本機閘道，引導設定會檢查 Mac 上來自支援之 AI
工具的記憶：Claude Code 自動記憶、Codex 整合記憶，以及 Hermes 記憶
檔案。找到任何記憶時，此頁面會列出每個來源及其記憶數量，
並讓你將所選來源匯入代理程式工作區的
`memory/imports/` 下，以供建立索引後回想。系統會略過已匯入的檔案，而且
沒有可匯入的內容時絕不會顯示此頁面。略過此步驟不會造成問題；
之後可在儀表板的 Memory import 頁面中進行相同的匯入，並可逐一控制檔案。
</Step>
<Step title="權限">

<Frame caption="選擇你要授予 OpenClaw 的權限">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

引導設定會要求下列項目的 TCC 權限：自動化（AppleScript）、通知、輔助使用、螢幕錄製、麥克風、語音辨識、相機及位置。

</Step>
<Step title="完成">
  推論通過後，OpenClaw 會接手其餘的選用設定，
  並可將你帶到一般的代理程式對話。完成權限逐步設定後，
  會開啟相同的對話；App 不會在 OpenClaw 之前建立工作區或啟動另一段
  代理程式設定對話。如需瞭解代理程式第一次實際執行期間，
  閘道主機上會發生什麼情況，請參閱
  [啟動程序](/zh-TW/start/bootstrapping)。
</Step>
</Steps>

## 相關內容

- [引導設定概覽](/zh-TW/start/onboarding-overview)
- [開始使用](/zh-TW/start/getting-started)
