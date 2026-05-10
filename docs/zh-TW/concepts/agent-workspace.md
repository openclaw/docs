---
read_when:
    - 你需要說明代理程式工作區或其檔案配置
    - 您想要備份或遷移代理工作區
sidebarTitle: Agent workspace
summary: 代理工作區：位置、結構與備份策略
title: 代理工作區
x-i18n:
    generated_at: "2026-05-10T19:30:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: adb2ae19c702589010cc67907940ae21feb669cca262e36790a3059aa7d7744c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

工作區是代理的家。它是檔案工具與工作區情境唯一使用的工作目錄。請保持私密，並將它視為記憶。

這與 `~/.openclaw/` 分開，後者儲存設定、憑證與工作階段。

<Warning>
工作區是**預設 cwd**，不是硬性沙盒。工具會相對於工作區解析相對路徑，但除非已啟用沙盒，否則絕對路徑仍可到達主機上的其他位置。如果你需要隔離，請使用 [`agents.defaults.sandbox`](/zh-TW/gateway/sandboxing)（和/或個別代理的沙盒設定）。

當啟用沙盒且 `workspaceAccess` 不是 `"rw"` 時，工具會在 `~/.openclaw/sandboxes` 下的沙盒工作區內運作，而不是你的主機工作區。
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

如果缺少工作區與啟動檔案，`openclaw onboard`、`openclaw configure` 或 `openclaw setup` 會建立它們並植入啟動檔案。

<Note>
沙盒種子複製只接受工作區內的一般檔案；解析到來源工作區外部的 symlink/hardlink 別名會被忽略。
</Note>

如果你已自行管理工作區檔案，可以停用啟動檔案建立：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 額外工作區資料夾

較舊的安裝可能建立了 `~/openclaw`。保留多個工作區目錄可能造成令人困惑的驗證或狀態漂移，因為同一時間只有一個工作區是作用中的。

<Note>
**建議：**保留單一作用中工作區。如果你不再使用額外資料夾，請將它們封存或移到垃圾桶（例如 `trash ~/openclaw`）。如果你刻意保留多個工作區，請確認 `agents.defaults.workspace` 指向作用中的那一個。

`openclaw doctor` 偵測到額外工作區目錄時會提出警告。
</Note>

## 工作區檔案對照表

以下是 OpenClaw 預期在工作區內找到的標準檔案：

<AccordionGroup>
  <Accordion title="AGENTS.md - 操作指示">
    給代理的操作指示，以及它應如何使用記憶。每個工作階段開始時載入。適合放置規則、優先順序與「如何表現」等細節。
  </Accordion>
  <Accordion title="SOUL.md - 人格與語氣">
    人格、語氣與邊界。每個工作階段都會載入。指南：[SOUL.md 人格指南](/zh-TW/concepts/soul)。
  </Accordion>
  <Accordion title="USER.md - 使用者是誰">
    使用者是誰，以及如何稱呼他們。每個工作階段都會載入。
  </Accordion>
  <Accordion title="IDENTITY.md - 名稱、氣質、emoji">
    代理的名稱、氣質與 emoji。在啟動儀式期間建立/更新。
  </Accordion>
  <Accordion title="TOOLS.md - 本機工具慣例">
    關於你的本機工具與慣例的備註。不控制工具可用性；僅作為指引。
  </Accordion>
  <Accordion title="HEARTBEAT.md - Heartbeat 檢查清單">
    Heartbeat 執行用的選用小型檢查清單。保持簡短以避免消耗 token。
  </Accordion>
  <Accordion title="BOOT.md - 啟動檢查清單">
    在 Gateway 重新啟動時自動執行的選用啟動檢查清單（當[內部 hooks](/zh-TW/automation/hooks) 已啟用時）。保持簡短；使用訊息工具傳送對外訊息。
  </Accordion>
  <Accordion title="BOOTSTRAP.md - 首次執行儀式">
    一次性的首次執行儀式。只會為全新工作區建立。儀式完成後請刪除它。
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - 每日記憶紀錄">
    每日記憶紀錄（每天一個檔案）。建議在工作階段開始時讀取今天 + 昨天。
  </Accordion>
  <Accordion title="MEMORY.md - 精選長期記憶（選用）">
    精選長期記憶：持久事實、偏好、決策與短摘要。將詳細紀錄保存在 `memory/YYYY-MM-DD.md`，讓記憶工具可按需擷取，而不需注入每個 prompt。只在主要的私密工作階段載入 `MEMORY.md`（不要在共享/群組情境載入）。請參閱 [Memory](/zh-TW/concepts/memory) 了解工作流程與自動記憶 flush。
  </Accordion>
  <Accordion title="skills/ - 工作區 Skills（選用）">
    工作區專屬 Skills。該工作區最高優先權的 skill 位置。當名稱衝突時，會覆寫專案代理 skills、個人代理 skills、受管理 skills、內建 skills，以及 `skills.load.extraDirs`。
  </Accordion>
  <Accordion title="canvas/ - Canvas UI 檔案（選用）">
    用於節點顯示的 Canvas UI 檔案（例如 `canvas/index.html`）。
  </Accordion>
</AccordionGroup>

<Note>
如果缺少任何啟動檔案，OpenClaw 會將「missing file」標記注入工作階段並繼續。大型啟動檔案在注入時會被截斷；可透過 `agents.defaults.bootstrapMaxChars`（預設：12000）與 `agents.defaults.bootstrapTotalMaxChars`（預設：60000）調整限制。`openclaw setup` 可以重新建立缺少的預設檔案，而不覆寫現有檔案。
</Note>

## 哪些內容不在工作區中

這些位於 `~/.openclaw/` 下，不應提交到工作區 repo：

- `~/.openclaw/openclaw.json`（設定）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（模型驗證設定檔：OAuth + API keys）
- `~/.openclaw/agents/<agentId>/agent/codex-home/`（每個代理的 Codex runtime 帳號、設定、skills、plugins 與原生 thread 狀態）
- `~/.openclaw/credentials/`（頻道/提供者狀態，以及舊版 OAuth 匯入資料）
- `~/.openclaw/agents/<agentId>/sessions/`（工作階段逐字稿 + metadata）
- `~/.openclaw/skills/`（受管理 skills）

如果你需要遷移工作階段或設定，請分開複製，並讓它們保持在版本控制之外。

## Git 備份（建議，私密）

將工作區視為私密記憶。把它放在**私密** git repo 中，讓它可備份且可復原。

在 Gateway 執行所在的機器上執行以下步驟（也就是工作區所在的位置）。

<Steps>
  <Step title="初始化 repo">
    如果已安裝 git，全新工作區會自動初始化。如果此工作區尚不是 repo，請執行：

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="新增私密 remote">
    <Tabs>
      <Tab title="GitHub web UI">
        1. 在 GitHub 上建立新的**私密**儲存庫。
        2. 不要使用 README 初始化（避免 merge conflicts）。
        3. 複製 HTTPS remote URL。
        4. 新增 remote 並推送：

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
        1. 在 GitLab 上建立新的**私密**儲存庫。
        2. 不要使用 README 初始化（避免 merge conflicts）。
        3. 複製 HTTPS remote URL。
        4. 新增 remote 並推送：

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
即使是在私密 repo 中，也應避免在工作區儲存秘密：

- API keys、OAuth tokens、密碼或私密憑證。
- `~/.openclaw/` 下的任何內容。
- 聊天或敏感附件的原始 dump。

如果你必須儲存敏感參照，請使用 placeholders，並將真正的秘密保存在其他地方（密碼管理器、環境變數或 `~/.openclaw/`）。
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
    將 repo clone 到想要的路徑（預設 `~/.openclaw/workspace`）。
  </Step>
  <Step title="更新設定">
    在 `~/.openclaw/openclaw.json` 中將 `agents.defaults.workspace` 設為該路徑。
  </Step>
  <Step title="植入缺少的檔案">
    執行 `openclaw setup --workspace <path>` 以植入任何缺少的檔案。
  </Step>
  <Step title="複製工作階段（選用）">
    如果你需要工作階段，請從舊機器分開複製 `~/.openclaw/agents/<agentId>/sessions/`。
  </Step>
</Steps>

## 進階備註

- 多代理路由可為每個代理使用不同工作區。請參閱 [Channel routing](/zh-TW/channels/channel-routing) 了解路由設定。
- 如果已啟用 `agents.defaults.sandbox`，非主要工作階段可使用 `agents.defaults.sandbox.workspaceRoot` 下的個別工作階段沙盒工作區。

## 相關

- [Heartbeat](/zh-TW/gateway/heartbeat) - HEARTBEAT.md 工作區檔案
- [Sandboxing](/zh-TW/gateway/sandboxing) - 沙盒環境中的工作區存取
- [Session](/zh-TW/concepts/session) - 工作階段儲存路徑
- [Standing orders](/zh-TW/automation/standing-orders) - 工作區檔案中的持久指示
