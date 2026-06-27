---
read_when:
    - 你需要說明代理工作區或其檔案配置
    - 你想備份或遷移代理程式工作區
sidebarTitle: Agent workspace
summary: Agent 工作區：位置、配置與備份策略
title: 代理程式工作區
x-i18n:
    generated_at: "2026-06-27T19:09:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6020aa96b2aa829a9684164994d1fb1fb1b31157c47b60e947ad82f9f5508e1c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

工作區是代理的家。它是檔案工具和工作區上下文使用的唯一工作目錄。請將其保持私密，並把它視為記憶。

這與 `~/.openclaw/` 分開，後者儲存設定、憑證和會話。

<Warning>
工作區是**預設 cwd**，不是嚴格的沙盒。工具會以工作區解析相對路徑，但除非啟用沙盒，否則絕對路徑仍可到達主機上的其他位置。如果需要隔離，請使用 [`agents.defaults.sandbox`](/zh-TW/gateway/sandboxing)（和/或每個代理的沙盒設定）。

啟用沙盒且 `workspaceAccess` 不是 `"rw"` 時，工具會在 `~/.openclaw/sandboxes` 底下的沙盒工作區內運作，而不是在你的主機工作區。
</Warning>

## 預設位置

- 預設：`~/.openclaw/workspace`
- 如果已設定 `OPENCLAW_PROFILE` 且不是 `"default"`，預設會變成 `~/.openclaw/workspace-<profile>`。
- 在 `~/.openclaw/openclaw.json` 中覆寫：

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

如果工作區和初始檔案遺失，`openclaw onboard`、`openclaw configure` 或 `openclaw setup` 會建立工作區並植入初始檔案。

<Note>
沙盒種子複製只接受位於工作區內的一般檔案；解析到來源工作區外部的符號連結/硬連結別名會被忽略。
</Note>

如果你已自行管理工作區檔案，可以停用初始檔案建立：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 額外工作區資料夾

較舊的安裝可能建立過 `~/openclaw`。保留多個工作區目錄可能造成令人困惑的驗證或狀態漂移，因為一次只會啟用一個工作區。

<Note>
**建議：** 保留單一作用中的工作區。如果你不再使用額外資料夾，請封存或移到垃圾桶（例如 `trash ~/openclaw`）。如果你有意保留多個工作區，請確認 `agents.defaults.workspace` 指向作用中的那一個。

`openclaw doctor` 偵測到額外工作區目錄時會發出警告。
</Note>

## 工作區檔案地圖

以下是 OpenClaw 預期在工作區內看到的標準檔案：

<AccordionGroup>
  <Accordion title="AGENTS.md - 操作指示">
    給代理的操作指示，以及它應該如何使用記憶。會在每個會話開始時載入。適合放置規則、優先順序和「如何行事」細節。
  </Accordion>
  <Accordion title="SOUL.md - 人格與語氣">
    人格、語氣和界線。每個會話都會載入。指南：[SOUL.md 人格指南](/zh-TW/concepts/soul)。
  </Accordion>
  <Accordion title="USER.md - 使用者是誰">
    使用者是誰，以及如何稱呼他們。每個會話都會載入。
  </Accordion>
  <Accordion title="IDENTITY.md - 名稱、氛圍、表情符號">
    代理的名稱、氛圍和表情符號。會在初始儀式期間建立/更新。
  </Accordion>
  <Accordion title="TOOLS.md - 本機工具慣例">
    關於你的本機工具和慣例的備註。它不控制工具可用性；僅作為指引。
  </Accordion>
  <Accordion title="HEARTBEAT.md - 心跳偵測檢查清單">
    心跳偵測執行用的可選小型檢查清單。保持簡短以避免消耗權杖。
  </Accordion>
  <Accordion title="BOOT.md - 啟動檢查清單">
    在閘道重新啟動時自動執行的可選啟動檢查清單（啟用[內部鉤子](/zh-TW/automation/hooks)時）。保持簡短；對外傳送請使用訊息工具。
  </Accordion>
  <Accordion title="BOOTSTRAP.md - 首次執行儀式">
    一次性的首次執行儀式。只會為全新的工作區建立。儀式完成後請刪除。
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - 每日記憶記錄">
    每日記憶記錄（每天一個檔案）。建議在會話開始時讀取今天 + 昨天。
  </Accordion>
  <Accordion title="MEMORY.md - 經整理的長期記憶（可選）">
    經整理的長期記憶：持久事實、偏好、決策和簡短摘要。將詳細記錄保存在 `memory/YYYY-MM-DD.md`，讓記憶工具可依需求擷取，而不必把它們注入每個提示。只在主要的私密會話中載入 `MEMORY.md`（不要在共用/群組上下文中載入）。工作流程和自動記憶清理請參閱[記憶](/zh-TW/concepts/memory)。
  </Accordion>
  <Accordion title="skills/ - 工作區 Skills（可選）">
    工作區專屬 Skills。該工作區中優先順序最高的 Skill 位置。名稱衝突時，會覆寫專案代理 Skills、個人代理 Skills、受管理 Skills、內建 Skills 和 `skills.load.extraDirs`。
  </Accordion>
  <Accordion title="canvas/ - Canvas UI 檔案（可選）">
    節點顯示用的 Canvas UI 檔案（例如 `canvas/index.html`）。
  </Accordion>
</AccordionGroup>

<Note>
如果缺少任何初始檔案，OpenClaw 會將「缺少檔案」標記注入會話並繼續。大型初始檔案在注入時會被截斷；可用 `agents.defaults.bootstrapMaxChars`（預設：20000）和 `agents.defaults.bootstrapTotalMaxChars`（預設：60000）調整限制。`openclaw setup` 可以在不覆寫現有檔案的情況下重新建立缺少的預設檔案。
</Note>

## 工作區中不包含的內容

以下內容位於 `~/.openclaw/` 底下，且不應提交到工作區儲存庫：

- `~/.openclaw/openclaw.json`（設定）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（模型驗證設定檔：OAuth + API 金鑰）
- `~/.openclaw/agents/<agentId>/agent/codex-home/`（每個代理的 Codex 執行階段帳號、設定、Skills、外掛和原生執行緒狀態）
- `~/.openclaw/credentials/`（頻道/供應商狀態加上舊版 OAuth 匯入資料）
- `~/.openclaw/agents/<agentId>/sessions/`（會話逐字稿 + 中繼資料）
- `~/.openclaw/skills/`（受管理 Skills）

如果需要遷移會話或設定，請分開複製它們，並將它們排除在版本控制之外。

## Git 備份（建議，私密）

將工作區視為私密記憶。把它放進**私有** git 儲存庫，讓它可備份且可復原。

在執行閘道的機器上執行這些步驟（也就是工作區所在的位置）。

<Steps>
  <Step title="初始化儲存庫">
    如果已安裝 git，全新的工作區會自動初始化。如果這個工作區尚未是儲存庫，請執行：

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="新增私有遠端">
    <Tabs>
      <Tab title="GitHub 網頁 UI">
        1. 在 GitHub 上建立新的**私有**儲存庫。
        2. 不要使用 README 初始化（避免合併衝突）。
        3. 複製 HTTPS 遠端 URL。
        4. 新增遠端並推送：

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub 命令列介面（gh）">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="GitLab 網頁 UI">
        1. 在 GitLab 上建立新的**私有**儲存庫。
        2. 不要使用 README 初始化（避免合併衝突）。
        3. 複製 HTTPS 遠端 URL。
        4. 新增遠端並推送：

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

## 不要提交祕密

<Warning>
即使是在私有儲存庫中，也請避免在工作區儲存祕密：

- API 金鑰、OAuth 權杖、密碼或私密憑證。
- `~/.openclaw/` 底下的任何內容。
- 聊天或敏感附件的原始匯出。

如果必須儲存敏感參照，請使用佔位符，並將真正的祕密保存在其他地方（密碼管理器、環境變數或 `~/.openclaw/`）。
</Warning>

建議的 `.gitignore` 起始內容：

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## 將工作區移到新機器

<Steps>
  <Step title="複製儲存庫">
    將儲存庫複製到想要的路徑（預設 `~/.openclaw/workspace`）。
  </Step>
  <Step title="更新設定">
    在 `~/.openclaw/openclaw.json` 中將 `agents.defaults.workspace` 設為該路徑。
  </Step>
  <Step title="植入缺少的檔案">
    執行 `openclaw setup --workspace <path>` 以植入任何缺少的檔案。
  </Step>
  <Step title="複製會話（可選）">
    如果需要會話，請從舊機器分開複製 `~/.openclaw/agents/<agentId>/sessions/`。
  </Step>
</Steps>

## 進階備註

- 多代理路由可以為每個代理使用不同的工作區。路由設定請參閱[頻道路由](/zh-TW/channels/channel-routing)。
- 如果已啟用 `agents.defaults.sandbox`，非主要會話可以使用 `agents.defaults.sandbox.workspaceRoot` 底下的每個會話沙盒工作區。

## 相關

- [心跳偵測](/zh-TW/gateway/heartbeat) - HEARTBEAT.md 工作區檔案
- [沙盒化](/zh-TW/gateway/sandboxing) - 沙盒環境中的工作區存取
- [會話](/zh-TW/concepts/session) - 會話儲存路徑
- [常設指令](/zh-TW/automation/standing-orders) - 工作區檔案中的持久指示
