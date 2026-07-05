---
read_when:
    - 你需要說明代理工作區或其檔案配置
    - 你想要備份或遷移代理工作區
sidebarTitle: Agent workspace
summary: 代理工作區：位置、版面配置與備份策略
title: 代理程式工作區
x-i18n:
    generated_at: "2026-07-05T11:12:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a66c441267e306176e4e52c639892dae4a4363729ac647fedf7f946d189ce1b3
    source_path: concepts/agent-workspace.md
    workflow: 16
---

工作區是代理程式的家：檔案工具與工作區上下文使用的工作目錄。
請將其保持私密，並把它當作記憶處理。

這與 `~/.openclaw/` 分開，後者儲存設定、憑證和工作階段。

<Warning>
工作區是**預設 cwd**，不是強制沙盒。工具會以工作區為基準解析相對路徑，但除非啟用沙盒，否則絕對路徑仍可存取主機上的其他位置。如果你需要隔離，請使用 [`agents.defaults.sandbox`](/zh-TW/gateway/sandboxing)（以及/或每個代理程式的沙盒設定）。

啟用沙盒且 `workspaceAccess` 不是 `"rw"` 時，工具會在 `~/.openclaw/sandboxes` 下的沙盒工作區內運作，而不是你的主機工作區。
</Warning>

## 預設位置

- 預設：`~/.openclaw/workspace`
- 如果已設定 `OPENCLAW_PROFILE` 且不是 `"default"`，預設會變成 `~/.openclaw/workspace-<profile>`。
- 設定 `OPENCLAW_WORKSPACE_DIR` 時，會覆寫上述兩者。
- 沒有明確工作區的非預設代理程式（`agents.list[]`）會解析到 `<state-dir>/workspace-<agentId>`，而不是共用的預設工作區。

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

每個代理程式覆寫：`agents.list[].workspace`。

`openclaw onboard`、`openclaw configure` 或 `openclaw setup` 會在工作區不存在時建立它，並植入啟動初始化檔案。

<Note>
沙盒種子複製只接受工作區內的一般檔案；解析到來源工作區外部的符號連結/硬連結別名會被忽略。
</Note>

如果你已自行管理工作區檔案，請停用啟動初始化檔案建立：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 額外工作區資料夾

較舊的安裝可能已建立 `~/openclaw`。保留多個工作區目錄可能會造成令人困惑的驗證或狀態漂移，因為一次只有一個工作區是作用中的。

<Note>
**建議：**只保留單一作用中工作區。如果你不再使用額外資料夾，請封存或移到垃圾桶（例如 `trash ~/openclaw`）。如果你有意保留多個工作區，請確認 `agents.defaults.workspace`（或每個代理程式的 `workspace` 鍵）指向作用中的工作區。
</Note>

## 工作區檔案對照

OpenClaw 預期工作區內的標準檔案：

<AccordionGroup>
  <Accordion title="AGENTS.md - operating instructions">
    代理程式的操作指示，以及它應如何使用記憶。每個工作階段開始時載入。適合放置規則、優先順序和「如何表現」的細節。
  </Accordion>
  <Accordion title="SOUL.md - persona and tone">
    人格、語氣與界線。每個工作階段都會載入。指南：[SOUL.md 人格指南](/zh-TW/concepts/soul)。
  </Accordion>
  <Accordion title="USER.md - who the user is">
    使用者是誰，以及如何稱呼他們。每個工作階段都會載入。
  </Accordion>
  <Accordion title="IDENTITY.md - name, vibe, emoji">
    代理程式的名稱、氛圍與表情符號。會在啟動初始化儀式期間建立/更新。
  </Accordion>
  <Accordion title="TOOLS.md - local tool conventions">
    關於你本機工具和慣例的筆記。不控制工具可用性；它只是指引。
  </Accordion>
  <Accordion title="HEARTBEAT.md - heartbeat checklist">
    心跳偵測執行的可選小型檢查清單。保持簡短以避免消耗 token。
  </Accordion>
  <Accordion title="BOOT.md - startup checklist">
    閘道重新啟動時自動執行的可選啟動檢查清單（啟用[內部鉤子](/zh-TW/automation/hooks)時）。保持簡短；使用訊息工具傳送對外訊息。
  </Accordion>
  <Accordion title="BOOTSTRAP.md - first-run ritual">
    一次性的首次執行儀式。只會為全新的工作區建立。儀式完成後請刪除。
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - daily memory log">
    每日記憶記錄（每天一個檔案）。建議在工作階段開始時讀取今天與昨天。
  </Accordion>
  <Accordion title="MEMORY.md - curated long-term memory (optional)">
    整理過的長期記憶：持久事實、偏好、決策和短摘要。將詳細記錄保存在 `memory/YYYY-MM-DD.md`，讓記憶工具可視需要擷取它們，而不必注入每個提示。只在主要的私人工作階段載入 `MEMORY.md`（不要在共用/群組上下文中載入）。工作流程與自動記憶清空請參閱[記憶](/zh-TW/concepts/memory)。
  </Accordion>
  <Accordion title="skills/ - workspace skills (optional)">
    工作區專屬 Skills。當名稱衝突時，這是該工作區中優先級最高的 skill 位置，高於專案代理程式 skills、個人代理程式 skills、受管理 skills、內建 skills，以及 `skills.load.extraDirs`。
  </Accordion>
  <Accordion title="canvas/ - Canvas UI files (optional)">
    節點顯示用的 Canvas UI 檔案（例如 `canvas/index.html`）。
  </Accordion>
</AccordionGroup>

<Note>
如果缺少啟動初始化檔案，OpenClaw 會將「缺少檔案」標記注入工作階段並繼續。大型啟動初始化檔案在注入時會被截斷；可用 `agents.defaults.bootstrapMaxChars`（預設：`20000`）和 `agents.defaults.bootstrapTotalMaxChars`（預設：`60000`）調整限制。`openclaw setup` 可以重新建立缺少的預設檔案，而不覆寫現有檔案。
</Note>

## 工作區中不包含的內容

以下內容位於 `~/.openclaw/` 下，不應提交到工作區 repo：

- `~/.openclaw/openclaw.json`（設定）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（模型驗證設定檔：OAuth + API 金鑰）
- `~/.openclaw/agents/<agentId>/agent/codex-home/`（每個代理程式的 Codex 執行階段帳號、設定、skills、外掛和原生 thread 狀態）
- `~/.openclaw/credentials/`（頻道/提供者狀態，以及舊版 OAuth 匯入資料）
- `~/.openclaw/agents/<agentId>/sessions/`（工作階段逐字稿 + 中繼資料）
- `~/.openclaw/skills/`（受管理 skills）

如果你需要遷移工作階段或設定，請分開複製它們，並將它們排除在版本控制之外。

## Git 備份（建議、私人）

將工作區視為私人記憶。把它放進**私人** git repo，讓它可備份且可復原。

請在閘道執行所在的機器上執行這些步驟（也就是工作區所在的位置）。

<Steps>
  <Step title="Initialize the repo">
    如果已安裝 git，全新的工作區會自動初始化。如果此工作區還不是 repo，請執行：

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Add a private remote">
    <Tabs>
      <Tab title="GitHub web UI">
        1. 在 GitHub 上建立新的**私人**儲存庫。
        2. 不要用 README 初始化（避免合併衝突）。
        3. 複製 HTTPS 遠端 URL。
        4. 加入遠端並推送：

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="GitLab web UI">
        1. 在 GitLab 上建立新的**私人**儲存庫。
        2. 不要用 README 初始化（避免合併衝突）。
        3. 複製 HTTPS 遠端 URL。
        4. 加入遠端並推送：

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Ongoing updates">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## 不要提交秘密

<Warning>
即使在私人 repo 中，也請避免在工作區儲存秘密：

- API 金鑰、OAuth token、密碼或私人憑證。
- `~/.openclaw/` 下的任何內容。
- 聊天或敏感附件的原始傾印。

如果必須儲存敏感參照，請使用佔位符，並將真正的秘密保存在其他地方（密碼管理器、環境變數，或 `~/.openclaw/`）。
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
  <Step title="Clone the repo">
    將 repo 複製到想要的路徑（預設 `~/.openclaw/workspace`）。
  </Step>
  <Step title="Update config">
    在 `~/.openclaw/openclaw.json` 中將 `agents.defaults.workspace` 設為該路徑。
  </Step>
  <Step title="Seed missing files">
    執行 `openclaw setup --workspace <path>` 以植入任何缺少的檔案。
  </Step>
  <Step title="Copy sessions (optional)">
    如果需要工作階段，請從舊機器分開複製 `~/.openclaw/agents/<agentId>/sessions/`。
  </Step>
</Steps>

## 進階備註

- 多代理程式路由可以透過 `agents.list[].workspace` 為每個代理程式使用不同工作區。路由設定請參閱[頻道路由](/zh-TW/channels/channel-routing)。
- 如果啟用 `agents.defaults.sandbox`，非主要工作階段可以使用 `agents.defaults.sandbox.workspaceRoot` 下的每工作階段沙盒工作區。

## 相關

- [心跳偵測](/zh-TW/gateway/heartbeat) - HEARTBEAT.md 工作區檔案
- [沙盒](/zh-TW/gateway/sandboxing) - 沙盒環境中的工作區存取
- [工作階段](/zh-TW/concepts/session) - 工作階段儲存路徑
- [常駐指令](/zh-TW/automation/standing-orders) - 工作區檔案中的持久指示
