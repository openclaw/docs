---
read_when:
    - 你需要說明代理工作區或其檔案配置
    - 您想要備份或遷移代理程式工作區
sidebarTitle: Agent workspace
summary: 代理工作區：位置、版面配置與備份策略
title: 代理工作區
x-i18n:
    generated_at: "2026-04-30T20:05:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ccf74cbec3ff20f4c1c1ce52f099a7ca3365b2536b0aad6ff1d3a5fafcca0a
    source_path: concepts/agent-workspace.md
    workflow: 16
---

工作區是代理程式的家。它是檔案工具與工作區內容使用的唯一工作目錄。請保持其私密，並將它視為記憶。

這與 `~/.openclaw/` 分開，後者儲存設定、憑證與工作階段。

<Warning>
工作區是**預設 cwd**，不是硬性沙箱。工具會依工作區解析相對路徑，但除非已啟用沙箱，否則絕對路徑仍可存取主機上的其他位置。如果你需要隔離，請使用 [`agents.defaults.sandbox`](/zh-TW/gateway/sandboxing)（及/或個別代理程式的沙箱設定）。

啟用沙箱且 `workspaceAccess` 不是 `"rw"` 時，工具會在 `~/.openclaw/sandboxes` 底下的沙箱工作區內運作，而不是在你的主機工作區內。
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

如果缺少工作區與啟動檔案，`openclaw onboard`、`openclaw configure` 或 `openclaw setup` 會建立工作區並植入這些檔案。

<Note>
沙箱種子複本只接受工作區內的一般檔案；解析到來源工作區外部的符號連結/硬連結別名會被忽略。
</Note>

如果你已經自行管理工作區檔案，可以停用啟動檔案建立：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 額外工作區資料夾

較舊的安裝可能建立了 `~/openclaw`。保留多個工作區目錄可能造成令人困惑的驗證或狀態偏移，因為一次只有一個工作區是作用中的。

<Note>
**建議：**保留單一作用中工作區。如果你不再使用額外資料夾，請封存或移到垃圾桶（例如 `trash ~/openclaw`）。如果你刻意保留多個工作區，請確保 `agents.defaults.workspace` 指向作用中的那一個。

`openclaw doctor` 偵測到額外工作區目錄時會提出警告。
</Note>

## 工作區檔案對照

以下是 OpenClaw 預期在工作區內存在的標準檔案：

<AccordionGroup>
  <Accordion title="AGENTS.md — 操作指示">
    代理程式的操作指示，以及它應如何使用記憶。每個工作階段開始時載入。適合放置規則、優先順序，以及「如何表現」的細節。
  </Accordion>
  <Accordion title="SOUL.md — 人格與語氣">
    人格、語氣與界線。每個工作階段都會載入。指南：[SOUL.md personality guide](/zh-TW/concepts/soul)。
  </Accordion>
  <Accordion title="USER.md — 使用者是誰">
    使用者是誰，以及如何稱呼他們。每個工作階段都會載入。
  </Accordion>
  <Accordion title="IDENTITY.md — 名稱、氛圍、表情符號">
    代理程式的名稱、氛圍與表情符號。於啟動儀式期間建立/更新。
  </Accordion>
  <Accordion title="TOOLS.md — 本機工具慣例">
    關於你的本機工具與慣例的備註。不控制工具可用性；僅作為指引。
  </Accordion>
  <Accordion title="HEARTBEAT.md — Heartbeat 檢查清單">
    Heartbeat 執行用的選用極簡檢查清單。請保持簡短以避免消耗 token。
  </Accordion>
  <Accordion title="BOOT.md — 啟動檢查清單">
    Gateway 重新啟動時自動執行的選用啟動檢查清單（啟用[內部 hook](/zh-TW/automation/hooks) 時）。請保持簡短；對外傳送請使用訊息工具。
  </Accordion>
  <Accordion title="BOOTSTRAP.md — 首次執行儀式">
    一次性的首次執行儀式。僅為全新工作區建立。儀式完成後請刪除它。
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — 每日記憶日誌">
    每日記憶日誌（每天一個檔案）。建議在工作階段開始時閱讀今天與昨天。
  </Accordion>
  <Accordion title="MEMORY.md — 精選長期記憶（選用）">
    精選長期記憶。僅在主要、私密工作階段中載入（不要在共享/群組情境中載入）。工作流程與自動記憶清除請參閱 [Memory](/zh-TW/concepts/memory)。
  </Accordion>
  <Accordion title="skills/ — 工作區 Skills（選用）">
    工作區專屬 Skills。該工作區中優先序最高的 skill 位置。名稱衝突時會覆寫專案代理程式 skills、個人代理程式 skills、受管理 skills、內建 skills，以及 `skills.load.extraDirs`。
  </Accordion>
  <Accordion title="canvas/ — Canvas UI 檔案（選用）">
    節點顯示用的 Canvas UI 檔案（例如 `canvas/index.html`）。
  </Accordion>
</AccordionGroup>

<Note>
如果任何啟動檔案缺失，OpenClaw 會將「缺少檔案」標記注入工作階段並繼續。大型啟動檔案在注入時會被截斷；可使用 `agents.defaults.bootstrapMaxChars`（預設：12000）與 `agents.defaults.bootstrapTotalMaxChars`（預設：60000）調整限制。`openclaw setup` 可以重新建立缺失的預設檔案，而不覆寫現有檔案。
</Note>

## 工作區中不包含什麼

這些位於 `~/.openclaw/` 底下，不應提交到工作區 repo：

- `~/.openclaw/openclaw.json`（設定）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（模型驗證設定檔：OAuth + API 金鑰）
- `~/.openclaw/agents/<agentId>/agent/codex-home/`（個別代理程式的 Codex 執行階段帳戶、設定、skills、plugins 與原生 thread 狀態）
- `~/.openclaw/credentials/`（頻道/提供者狀態，加上舊版 OAuth 匯入資料）
- `~/.openclaw/agents/<agentId>/sessions/`（工作階段 transcript + metadata）
- `~/.openclaw/skills/`（受管理 skills）

如果你需要移轉工作階段或設定，請分開複製它們，並讓它們保持在版本控制之外。

## Git 備份（建議，私密）

將工作區視為私密記憶。請把它放進**私密** git repo，以便備份與復原。

在 Gateway 執行的機器上執行這些步驟（也就是工作區所在的位置）。

<Steps>
  <Step title="初始化 repo">
    如果已安裝 git，全新工作區會自動初始化。如果這個工作區還不是 repo，請執行：

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="新增私密遠端">
    <Tabs>
      <Tab title="GitHub 網頁 UI">
        1. 在 GitHub 上建立新的**私密** repository。
        2. 不要用 README 初始化（避免 merge conflicts）。
        3. 複製 HTTPS 遠端 URL。
        4. 新增遠端並推送：

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
      <Tab title="GitLab 網頁 UI">
        1. 在 GitLab 上建立新的**私密** repository。
        2. 不要用 README 初始化（避免 merge conflicts）。
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

## 不要提交秘密

<Warning>
即使在私密 repo 中，也請避免在工作區儲存秘密：

- API 金鑰、OAuth token、密碼或私密憑證。
- `~/.openclaw/` 底下的任何內容。
- 聊天或敏感附件的原始傾印。

如果必須儲存敏感參照，請使用 placeholders，並將真正的秘密保存在其他地方（密碼管理器、環境變數，或 `~/.openclaw/`）。
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
  <Step title="Clone repo">
    將 repo clone 到所需路徑（預設為 `~/.openclaw/workspace`）。
  </Step>
  <Step title="更新設定">
    在 `~/.openclaw/openclaw.json` 中將 `agents.defaults.workspace` 設為該路徑。
  </Step>
  <Step title="植入缺失檔案">
    執行 `openclaw setup --workspace <path>` 以植入任何缺失檔案。
  </Step>
  <Step title="複製工作階段（選用）">
    如果你需要工作階段，請從舊機器分開複製 `~/.openclaw/agents/<agentId>/sessions/`。
  </Step>
</Steps>

## 進階備註

- 多代理程式路由可以為每個代理程式使用不同工作區。路由設定請參閱[頻道路由](/zh-TW/channels/channel-routing)。
- 如果已啟用 `agents.defaults.sandbox`，非主要工作階段可以使用 `agents.defaults.sandbox.workspaceRoot` 底下的個別工作階段沙箱工作區。

## 相關

- [Heartbeat](/zh-TW/gateway/heartbeat) — HEARTBEAT.md 工作區檔案
- [沙箱](/zh-TW/gateway/sandboxing) — 沙箱環境中的工作區存取
- [工作階段](/zh-TW/concepts/session) — 工作階段儲存路徑
- [常駐指令](/zh-TW/automation/standing-orders) — 工作區檔案中的持久指示
