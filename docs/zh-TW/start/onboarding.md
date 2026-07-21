---
read_when:
    - 設計 macOS 新手引導助理
    - 實作驗證或身分設定
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw 首次執行設定流程（macOS App）
title: 入門設定（macOS App）
x-i18n:
    generated_at: "2026-07-21T09:11:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 55154774886c530de92b2110d367af24e2142fac48b901f288582d8552a6ca10
    source_path: start/onboarding.md
    workflow: 16
---

macOS App 的首次執行流程：選擇閘道的執行位置、連接已驗證的 AI 後端、授予權限，然後交由代理程式進行其自身的啟動程序。
如需命令列介面引導設定，以及兩種路徑的比較，請參閱[引導設定概覽](/zh-TW/start/onboarding-overview)。

<Steps>
<Step title="核准 macOS 警告">
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
<Frame caption="閱讀顯示的安全性通知，並據此決定">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

安全信任模型：

- 依預設，OpenClaw 是個人代理程式：只有一個受信任的操作員邊界。
- 共用／多使用者設定需要加強限制：分隔信任邊界、將工具存取權限維持在最低限度，並遵循[安全性](/zh-TW/gateway/security)指南。
- 本機引導設定會將新設定預設為 `tools.profile: "coding"`，讓全新設定保有檔案系統／執行階段工具，同時不使用不受限制的 `full` 設定檔。
- 如果已啟用掛鉤／網路鉤子或其他不受信任的內容來源，請使用強大的現代模型層級，並維持嚴格的工具政策／沙箱隔離。

</Step>
<Step title="本機與遠端">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**閘道**要在哪裡執行？

- **這部 Mac（僅限本機）：**引導設定會設定驗證，並將認證資訊寫入本機。
- **遠端（透過 SSH／Tailnet）：**引導設定**不會**設定本機驗證；
  認證資訊必須已存在於閘道主機上。遠端閘道權杖
  欄位會儲存 macOS App 用來連線至該閘道的權杖；
  現有的 `gateway.remote.token` SecretRef 值會保留，直到你
  將其取代。
- **稍後設定：**略過設定，讓 App 維持未設定狀態。

<Tip>
**閘道驗證提示：**

- 即使繫結至迴環位址，閘道驗證模式也預設為 `token`，因此本機 WS 用戶端必須進行驗證。
- 設定 `gateway.auth.mode: "none"` 會允許任何本機程序連線；請僅在完全受信任的電腦上使用此設定。
- 若要從多部電腦存取或繫結至非迴環位址，請使用權杖。

</Tip>
</Step>
<Step title="命令列介面">
  本機設定會透過 npm、pnpm 或 bun 安裝全域 `openclaw` 命令列介面，
  並優先使用 npm。Node 仍是閘道本身的建議執行階段。
  現有的相容安裝會直接重複使用。
</Step>
<Step title="連接你的 AI">
  如果已連線的閘道已設定代理程式模型，系統會完全略過此
  頁面並開啟一般代理程式使用者介面。只有全新或未完整設定的閘道
  才會執行 OpenClaw 與供應商設定。

閘道準備就緒後，引導設定會尋找你已擁有的 AI 存取方式：
Claude Code 或 Codex 登入、`OPENAI_API_KEY`／`ANTHROPIC_API_KEY`，或已安裝於可連線的 Ollama 或 LM Studio 伺服器上、具備工具能力且測得有效內容長度至少為 16K 的模型。偵測會在
閘道主機上執行，包括 macOS App 連線至 Linux 閘道的情況。系統會使用真實補全測試最佳
選項，並只在選項成功回應後才儲存；
測試失敗時，App 會自動嘗試下一個選項，
並顯示上一個選項失敗的原因。如果找到多個選項，你可以
在繼續之前切換選項。自動本機探索絕不會提取
或下載模型。

如果要在閘道主機未登入 Claude CLI 時使用 Claude 訂閱，請在任何已安裝 Claude Code 的電腦上執行
`claude setup-token`，然後將輸出的權杖貼到 **Connect with an API key or
token** 下的 **Anthropic setup-token**。

如果已安裝的 Gemini CLI、Antigravity、Pi 與 OpenCode 命令列介面無法選為可重複使用的引導設定推論路徑，仍會顯示它們以供參考。
Gemini 與 Antigravity 無法強制執行不使用工具的推論探測。Pi 與
OpenCode 是完整的代理程式框架，而非設定推論路徑；其
工作階段整合需要另外設定執行階段與外掛。

你也可以透過供應商自身的 OAuth 或裝置配對流程登入。
內建選項包括 OpenAI／ChatGPT、OpenRouter、GitHub Copilot、Google
Gemini CLI、xAI、MiniMax Global 與 CN，以及 Chutes。此清單來自
閘道目前啟用的文字推論供應商外掛，而不是固定的 App 清單，
因此其他供應商無須新增供應商專用的 macOS 程式碼即可選擇加入。

手動金鑰／權杖選擇器使用相同的供應商登錄檔。在每種路徑中，
供應商會提供其起始模型與設定；OpenClaw 會使用相同的即時測試驗證
認證資訊，之後才儲存其驗證設定檔。在有一個後端通過測試之前，
Next 會維持鎖定，因此第一次代理程式聊天無法在推論未正常運作時
啟動。即時檢查通過後，OpenClaw 即可協助
設定其餘的工作區、閘道、頻道與
其他選用功能。當 OpenClaw 提供一份簡短的選項清單時，App
會顯示原生選項卡片；選擇其中一項會傳送該選項，而 **Skip for
now** 一律會將該選擇保留為選用。之後也可以在
Settings → OpenClaw 中使用 OpenClaw。
</Step>
<Step title="匯入記憶（偵測到時顯示）">
對於本機閘道，引導設定會檢查 Mac 上受支援 AI
工具的記憶：Claude Code 自動記憶、Codex 整合記憶，以及 Hermes 記憶
檔案。找到任何記憶時，此頁面會列出每個來源及其記憶數量，
並讓你將所選來源匯入代理程式工作區的
`memory/imports/`，以供建立索引後回想。已匯入的檔案會略過，
沒有可匯入的內容時，絕不會顯示此頁面。略過並無風險；
儀表板的記憶匯入頁面之後會提供相同的匯入功能，並可逐一控制
檔案。
</Step>
<Step title="權限">

<Frame caption="選擇你要授予 OpenClaw 哪些權限">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

引導設定會要求下列項目的 TCC 權限：自動化（AppleScript）、通知、輔助使用、螢幕錄製、麥克風、語音辨識、相機與定位服務。

</Step>
<Step title="完成">
  推論通過後，OpenClaw 會接管其餘選用設定，
  並可將你帶往一般代理程式聊天。完成權限逐步設定後
  會開啟同一個聊天；App 不會在 OpenClaw 之前建立工作區或啟動獨立的
  代理程式設定對話。如需瞭解代理程式第一次實際執行時
  閘道主機上會發生什麼事，請參閱
  [啟動程序](/zh-TW/start/bootstrapping)。
</Step>
</Steps>

## 相關內容

- [引導設定概覽](/zh-TW/start/onboarding-overview)
- [開始使用](/zh-TW/start/getting-started)
