---
read_when:
    - 你正從 Claude Code 或 Claude Desktop 轉用，並想保留指示、MCP 伺服器和 Skills
    - 你需要了解 OpenClaw 會自動匯入哪些內容，以及哪些內容僅保留在封存中
summary: 使用預覽匯入將 Claude Code 和 Claude Desktop 的本機狀態移入 OpenClaw
title: 從 Claude 遷移
x-i18n:
    generated_at: "2026-04-30T03:15:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b44eda85f3a3714d7d360d04fdd2c99a692fa6491f12e73847c5f08d702a62c
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw 透過內建的 Claude 遷移提供者匯入本機 Claude 狀態。提供者會在變更狀態前預覽每個項目，在計畫與報告中遮蔽密鑰，並在套用前建立經驗證的備份。

<Note>
入門匯入需要全新的 OpenClaw 設定。如果你已有本機 OpenClaw 狀態，請先重設設定、憑證、工作階段與工作區，或在檢閱計畫後，直接搭配 `--overwrite` 使用 `openclaw migrate`。
</Note>

## 兩種匯入方式

<Tabs>
  <Tab title="入門精靈">
    精靈在偵測到本機 Claude 狀態時會提供 Claude 選項。

    ```bash
    openclaw onboard --flow import
    ```

    或指向特定來源：

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    使用 `openclaw migrate` 進行腳本化或可重複執行的作業。完整參考請見 [`openclaw migrate`](/zh-TW/cli/migrate)。

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    加上 `--from <path>` 可匯入特定 Claude Code 主目錄或專案根目錄。

  </Tab>
</Tabs>

## 會匯入哪些內容

<AccordionGroup>
  <Accordion title="指示與記憶">
    - 專案 `CLAUDE.md` 與 `.claude/CLAUDE.md` 內容會複製或附加到 OpenClaw 代理工作區的 `AGENTS.md`。
    - 使用者 `~/.claude/CLAUDE.md` 內容會附加到工作區 `USER.md`。

  </Accordion>
  <Accordion title="MCP 伺服器">
    若存在，MCP 伺服器定義會從專案 `.mcp.json`、Claude Code `~/.claude.json` 與 Claude Desktop `claude_desktop_config.json` 匯入。
  </Accordion>
  <Accordion title="Skills 與命令">
    - 帶有 `SKILL.md` 檔案的 Claude Skills 會複製到 OpenClaw 工作區 Skills 目錄。
    - `.claude/commands/` 或 `~/.claude/commands/` 底下的 Claude 命令 Markdown 檔案會轉換為 OpenClaw Skills，並設為 `disable-model-invocation: true`。

  </Accordion>
</AccordionGroup>

## 哪些內容僅保留在封存中

提供者會將這些內容複製到遷移報告中供手動檢閱，但**不會**載入到即時 OpenClaw 設定中：

- Claude hooks
- Claude 權限與廣泛工具允許清單
- Claude 環境預設值
- `CLAUDE.local.md`
- `.claude/rules/`
- `.claude/agents/` 或 `~/.claude/agents/` 底下的 Claude 子代理
- Claude Code 快取、計畫與專案歷史目錄
- Claude Desktop 擴充功能與作業系統儲存的憑證

OpenClaw 拒絕自動執行 hooks、信任權限允許清單，或解碼不透明的 OAuth 與 Desktop 憑證狀態。請在檢閱封存後手動移動你需要的內容。

## 來源選擇

未使用 `--from` 時，OpenClaw 會檢查預設的 Claude Code 主目錄 `~/.claude`、抽樣的 Claude Code `~/.claude.json` 狀態檔，以及 macOS 上的 Claude Desktop MCP 設定。

當 `--from` 指向專案根目錄時，OpenClaw 只會匯入該專案的 Claude 檔案，例如 `CLAUDE.md`、`.claude/settings.json`、`.claude/commands/`、`.claude/skills/` 與 `.mcp.json`。在專案根目錄匯入期間，它不會讀取你的全域 Claude 主目錄。

## 建議流程

<Steps>
  <Step title="預覽計畫">
    ```bash
    openclaw migrate claude --dry-run
    ```

    計畫會列出所有將變更的項目，包括衝突、略過的項目，以及從巢狀 MCP `env` 或 `headers` 欄位中遮蔽的敏感值。

  </Step>
  <Step title="使用備份套用">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw 會在套用前建立並驗證備份。

  </Step>
  <Step title="執行 doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/zh-TW/gateway/doctor) 會在匯入後檢查設定或狀態問題。

  </Step>
  <Step title="重新啟動並驗證">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    確認 Gateway 健康，且你匯入的指示、MCP 伺服器與 Skills 已載入。

  </Step>
</Steps>

## 衝突處理

當計畫回報衝突時，套用會拒絕繼續（目標位置已存在檔案或設定值）。

<Warning>
只有在刻意取代現有目標時，才使用 `--overwrite` 重新執行。提供者仍可能在遷移報告目錄中為被覆寫的檔案寫入項目層級備份。
</Warning>

對全新的 OpenClaw 安裝而言，衝突並不常見。通常會在你對已有使用者編輯的設定重新執行匯入時出現。

## 自動化的 JSON 輸出

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

搭配 `--json` 且未使用 `--yes` 時，apply 會列印計畫且不會變更狀態。這是 CI 與共用腳本最安全的模式。

## 疑難排解

<AccordionGroup>
  <Accordion title="Claude 狀態位於 ~/.claude 之外">
    傳入 `--from /actual/path`（CLI）或 `--import-source /actual/path`（入門）。
  </Accordion>
  <Accordion title="入門在既有設定上拒絕匯入">
    入門匯入需要全新設定。請重設狀態後重新入門，或直接使用 `openclaw migrate apply claude`，它支援 `--overwrite` 與明確的備份控制。
  </Accordion>
  <Accordion title="Claude Desktop 的 MCP 伺服器未匯入">
    Claude Desktop 會從平台特定路徑讀取 `claude_desktop_config.json`。如果 OpenClaw 未自動偵測到它，請將 `--from` 指向該檔案所在目錄。
  </Accordion>
  <Accordion title="Claude 命令變成停用模型叫用的 Skills">
    這是刻意設計。Claude 命令由使用者觸發，因此 OpenClaw 會將它們匯入為帶有 `disable-model-invocation: true` 的 Skills。如果你希望代理自動叫用它們，請編輯各 Skill 的 frontmatter。
  </Accordion>
</AccordionGroup>

## 相關

- [`openclaw migrate`](/zh-TW/cli/migrate)：完整 CLI 參考、Plugin 合約與 JSON 形狀。
- [遷移指南](/zh-TW/install/migrating)：所有遷移路徑。
- [從 Hermes 遷移](/zh-TW/install/migrating-hermes)：另一個跨系統匯入路徑。
- [入門](/zh-TW/cli/onboard)：精靈流程與非互動式旗標。
- [Doctor](/zh-TW/gateway/doctor)：遷移後健康檢查。
- [代理工作區](/zh-TW/concepts/agent-workspace)：`AGENTS.md`、`USER.md` 與 Skills 所在的位置。
