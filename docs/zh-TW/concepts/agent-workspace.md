---
read_when:
    - 你需要說明代理程式工作區或其檔案配置
    - 你想要備份或移轉代理工作區
sidebarTitle: Agent workspace
summary: 代理程式工作區：位置、配置與備份策略
title: 代理程式工作區
x-i18n:
    generated_at: "2026-07-22T10:29:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b58ead9079c3dda4bcaec3253f8d55e67e7e554d5c5b87ccfec6b08ec4ba038f
    source_path: concepts/agent-workspace.md
    workflow: 16
---

工作區是代理程式的家：檔案工具使用的工作目錄
與工作區情境。請將其保持私密，並視為記憶。

這與儲存設定、認證資訊和工作階段的 `~/.openclaw/` 分開。

<Warning>
工作區是**預設 cwd**，不是嚴格的沙箱。工具會以工作區為基準解析相對路徑，但除非啟用沙箱，否則絕對路徑仍可存取主機上的其他位置。如果需要隔離，請使用 [`agents.defaults.sandbox`](/zh-TW/gateway/sandboxing)（以及／或各代理程式的沙箱設定）。

啟用沙箱且 `workspaceAccess` 不是 `"rw"` 時，工具會在 `~/.openclaw/sandboxes` 下的沙箱工作區內運作，而不是你的主機工作區。
</Warning>

## 預設位置

- 預設值：`~/.openclaw/workspace`
- 如果已設定 `OPENCLAW_PROFILE` 且不是 `"default"`，預設值會變成 `~/.openclaw/workspace-<profile>`。
- 設定 `OPENCLAW_WORKSPACE_DIR` 後，會覆寫上述兩者。
- 未明確指定工作區的非預設代理程式（`agents.entries.*`）會解析為 `<state-dir>/workspace-<agentId>`，而不是共用的預設工作區。

在 `~/.openclaw/openclaw.json` 中覆寫：

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

各代理程式覆寫：`agents.entries.*.workspace`。

如果工作區不存在，`openclaw onboard`、`openclaw configure` 或 `openclaw setup` 會建立工作區並植入啟動檔案。

<Note>
沙箱種子複本只接受工作區內的一般檔案；解析至來源工作區外部的符號連結／硬連結別名會被忽略。
</Note>

如果你已自行管理工作區檔案，請停用啟動檔案建立功能：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 額外的工作區資料夾

較舊的安裝可能曾建立 `~/openclaw`。保留多個工作區目錄可能造成令人困惑的驗證或狀態分歧，因為一次只能有一個工作區處於作用中。

<Note>
**建議：**只保留一個作用中的工作區。如果不再使用額外資料夾，請將其封存或移至垃圾桶（例如 `trash ~/openclaw`）。如果刻意保留多個工作區，請確認 `agents.defaults.workspace`（或各代理程式的 `workspace` 鍵）指向作用中的工作區。
</Note>

## 工作區檔案對照表

OpenClaw 預期工作區內包含的標準檔案：

<AccordionGroup>
  <Accordion title="AGENTS.md - 操作指示">
    代理程式的操作指示，以及應如何使用記憶。每個工作階段開始時載入。適合放置規則、優先順序和「行為方式」等詳細資訊。
  </Accordion>
  <Accordion title="SOUL.md - 角色設定與語氣">
    角色設定、語氣和界線。每個工作階段都會載入。指南：[SOUL.md 個性指南](/zh-TW/concepts/soul)。
  </Accordion>
  <Accordion title="USER.md - 使用者是誰">
    使用者是誰，以及應如何稱呼。每個工作階段都會載入。
  </Accordion>
  <Accordion title="IDENTITY.md - 名稱、風格、表情符號">
    代理程式的名稱、風格和表情符號。在啟動儀式期間建立／更新。
  </Accordion>
  <Accordion title="TOOLS.md - 本機工具慣例">
    關於本機工具和慣例的備註。它不會控制工具是否可用；僅供指引。
  </Accordion>
  <Accordion title="HEARTBEAT.md - 心跳偵測檢查清單">
    心跳偵測執行時使用的選用精簡檢查清單。請保持簡短，以免耗用權杖。
  </Accordion>
  <Accordion title="BOOT.md - 啟動檢查清單">
    閘道重新啟動時自動執行的選用啟動檢查清單（需啟用[內部鉤子](/zh-TW/automation/hooks)）。請保持簡短；對外傳送請使用訊息工具。
  </Accordion>
  <Accordion title="BOOTSTRAP.md - 首次執行儀式">
    一次性的首次執行儀式。只會為全新的工作區建立。儀式完成後請將其刪除。
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - 每日記憶日誌">
    每日記憶日誌（每天一個檔案）。建議在工作階段開始時讀取今天與昨天的日誌。
  </Accordion>
  <Accordion title="MEMORY.md - 整理過的長期記憶（選用）">
    整理過的長期記憶：持久的事實、偏好、決策和簡短摘要。請將詳細日誌保留在 `memory/YYYY-MM-DD.md`，讓記憶工具能依需求擷取，而不必將其注入每個提示中。僅在主要的私密工作階段載入 `MEMORY.md`（不要在共用／群組情境中載入）。工作流程與自動記憶清除機制請參閱[記憶](/zh-TW/concepts/memory)。
  </Accordion>
  <Accordion title="skills/ - 工作區 Skills（選用）">
    工作區專用 Skills。當名稱衝突時，這是該工作區內優先順序最高的 Skills 位置，優先於專案代理程式 Skills、個人代理程式 Skills、受管理的 Skills、內建 Skills，以及 `skills.load.extraDirs`。
  </Accordion>
  <Accordion title="canvas/ - Canvas UI 檔案（選用）">
    用於節點顯示的 Canvas UI 檔案（例如 `canvas/index.html`）。
  </Accordion>
</AccordionGroup>

<Note>
如果缺少啟動檔案，OpenClaw 會在工作階段中注入「缺少檔案」標記並繼續執行。注入大型啟動檔案時會截斷內容；可使用 `agents.defaults.bootstrapMaxChars`（預設值：`20000`）和 `agents.defaults.bootstrapTotalMaxChars`（預設值：`60000`）調整限制。`openclaw setup` 可以重新建立缺少的預設檔案，而不會覆寫現有檔案。
</Note>

## 工作區中不包含的內容

這些項目位於 `~/.openclaw/` 下，不應提交至工作區儲存庫：

- `~/.openclaw/openclaw.json`（設定）
- `~/.openclaw/state/openclaw.sqlite`（共用工作區設定狀態和證明）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（模型驗證設定檔：OAuth + API 金鑰）
- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`（工作階段資料列、逐字稿和各代理程式的執行階段狀態）
- `~/.openclaw/agents/<agentId>/agent/codex-home/`（各代理程式的 Codex 執行階段帳號、設定、Skills、外掛和原生執行緒狀態）
- `~/.openclaw/credentials/`（頻道／提供者狀態，以及舊版 OAuth 匯入資料）
- `~/.openclaw/agents/<agentId>/sessions/`（舊版遷移來源和封存／支援成品）
- `~/.openclaw/skills/`（受管理的 Skills）

如果需要遷移工作階段或設定，請分開複製，並確保它們不受版本控制。

較舊的 OpenClaw 版本會寫入 `openclaw-workspace-state.json`、
`.openclaw/workspace-state.json` 和 `.attested` 工作區附屬檔案。目前的
執行階段僅使用共用 SQLite 資料庫儲存該狀態。如果 Doctor 回報
其中一個檔案，請執行 `openclaw doctor --fix`；Doctor 會匯入有效的舊版
狀態，且只有在驗證資料庫資料列後才會刪除來源。

## Git 備份（建議使用私密儲存庫）

將工作區視為私密記憶。請將其放入**私密** Git 儲存庫，以便備份和復原。

請在執行閘道的機器上執行以下步驟（工作區就位於該處）。

<Steps>
  <Step title="初始化儲存庫">
    如果已安裝 Git，全新的工作區會自動初始化。如果此工作區尚未成為儲存庫，請執行：

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="新增私密遠端儲存庫">
    <Tabs>
      <Tab title="GitHub 網頁介面">
        1. 在 GitHub 上建立新的**私密**儲存庫。
        2. 不要使用 README 初始化（避免合併衝突）。
        3. 複製 HTTPS 遠端 URL。
        4. 新增遠端儲存庫並推送：

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub 命令列介面 (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="GitLab 網頁介面">
        1. 在 GitLab 上建立新的**私密**儲存庫。
        2. 不要使用 README 初始化（避免合併衝突）。
        3. 複製 HTTPS 遠端 URL。
        4. 新增遠端儲存庫並推送：

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="持續更新">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## 不要提交機密資料

<Warning>
即使使用私密儲存庫，也請避免在工作區儲存機密資料：

- API 金鑰、OAuth 權杖、密碼或私密認證資訊。
- `~/.openclaw/` 下的任何內容。
- 聊天內容的原始傾印或敏感附件。

如果必須儲存敏感參照，請使用預留位置，並將真正的機密資料保存在其他地方（密碼管理器、環境變數或 `~/.openclaw/`）。
</Warning>

建議使用的 `.gitignore` 初始內容：

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## 將工作區移至新機器

<Steps>
  <Step title="複製儲存庫">
    將儲存庫複製至所需路徑（預設為 `~/.openclaw/workspace`）。
  </Step>
  <Step title="更新設定">
    在 `~/.openclaw/openclaw.json` 中，將 `agents.defaults.workspace` 設為該路徑。
  </Step>
  <Step title="植入缺少的檔案">
    執行 `openclaw setup --workspace <path>`，以植入任何缺少的檔案。
  </Step>
  <Step title="複製工作階段（選用）">
    如果需要工作階段，請另外從舊機器複製 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`。
    只有在也需要舊版遷移輸入或封存／支援成品時，才複製 `~/.openclaw/agents/<agentId>/sessions/`。
  </Step>
</Steps>

## 進階備註

- 多代理程式路由可透過 `agents.entries.*.workspace`，讓每個代理程式使用不同的工作區。路由設定請參閱[頻道路由](/zh-TW/channels/channel-routing)。
- 如果已啟用 `agents.defaults.sandbox`，非主要工作階段可使用 `agents.defaults.sandbox.workspaceRoot` 下的各工作階段沙箱工作區。

## 相關內容

- [心跳偵測](/zh-TW/gateway/heartbeat) - HEARTBEAT.md 工作區檔案
- [沙箱](/zh-TW/gateway/sandboxing) - 沙箱環境中的工作區存取
- [工作階段](/zh-TW/concepts/session) - 工作階段儲存路徑
- [常設指示](/zh-TW/automation/standing-orders) - 工作區檔案中的持久指示
