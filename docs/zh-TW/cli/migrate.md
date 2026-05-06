---
read_when:
    - 您想要從 Hermes 或其他代理系統遷移到 OpenClaw
    - 你正在新增一個由 Plugin 擁有的遷移提供者
summary: '`openclaw migrate` 的 CLI 參考（從另一個代理系統匯入狀態）'
title: 遷移
x-i18n:
    generated_at: "2026-05-06T02:44:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021d673f6e51f5c2320278f0a37830c9aa34cdb4628932be1c09714c375066e3
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

透過由 Plugin 擁有的遷移提供者，從另一個代理系統匯入狀態。內建提供者涵蓋 Codex CLI 狀態、[Claude](/zh-TW/install/migrating-claude) 和 [Hermes](/zh-TW/install/migrating-hermes)；第三方 Plugin 可以註冊額外提供者。

<Tip>
如需面向使用者的逐步指南，請參閱[從 Claude 遷移](/zh-TW/install/migrating-claude)和[從 Hermes 遷移](/zh-TW/install/migrating-hermes)。[遷移中心](/zh-TW/install/migrating)列出所有路徑。
</Tip>

## 指令

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  已註冊遷移提供者的名稱，例如 `hermes`。執行 `openclaw migrate list` 可查看已安裝的提供者。
</ParamField>
<ParamField path="--dry-run" type="boolean">
  建立計畫後結束，不變更狀態。
</ParamField>
<ParamField path="--from <path>" type="string">
  覆寫來源狀態目錄。Hermes 預設為 `~/.hermes`。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  匯入支援的認證資料。預設關閉。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  當計畫回報衝突時，允許套用作業取代既有目標。
</ParamField>
<ParamField path="--yes" type="boolean">
  略過確認提示。在非互動模式中為必要項。
</ParamField>
<ParamField path="--skill <name>" type="string">
  依 Skills 名稱或項目 ID 選取一個 Skills 複製項目。重複此旗標可遷移多個 Skills。省略時，互動式 Codex 遷移會顯示核取方塊選擇器，而非互動式遷移會保留所有已規劃的 Skills。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  略過套用前備份。當本機 OpenClaw 狀態存在時，需搭配 `--force`。
</ParamField>
<ParamField path="--force" type="boolean">
  當套用作業原本會拒絕略過備份時，需與 `--no-backup` 一併使用。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 列印計畫或套用結果。搭配 `--json` 且未使用 `--yes` 時，套用作業會列印計畫且不變更狀態。
</ParamField>

## 安全模型

`openclaw migrate` 採用預覽優先。

<AccordionGroup>
  <Accordion title="Preview before apply">
    提供者會在任何變更發生前傳回逐項列出的計畫，包括衝突、略過項目和敏感項目。JSON 計畫、套用輸出和遷移報告會遮蔽巢狀且看似秘密的金鑰，例如 API 金鑰、權杖、授權標頭、Cookie 和密碼。

    除非已設定 `--yes`，否則 `openclaw migrate apply <provider>` 會先預覽計畫並提示確認，才變更狀態。在非互動模式中，套用作業需要 `--yes`。

  </Accordion>
  <Accordion title="Backups">
    套用作業會在套用遷移前建立並驗證 OpenClaw 備份。如果尚無本機 OpenClaw 狀態，備份步驟會略過，且遷移可繼續。若狀態存在時要略過備份，請同時傳入 `--no-backup` 和 `--force`。
  </Accordion>
  <Accordion title="Conflicts">
    當計畫有衝突時，套用作業會拒絕繼續。檢閱計畫後，如果確定要取代既有目標，請使用 `--overwrite` 重新執行。提供者仍可在遷移報告目錄中，為被覆寫的檔案寫入項目層級備份。
  </Accordion>
  <Accordion title="Secrets">
    預設絕不匯入秘密。使用 `--include-secrets` 可匯入支援的認證資料。
  </Accordion>
</AccordionGroup>

## Claude 提供者

內建 Claude 提供者預設會在 `~/.claude` 偵測 Claude Code 狀態。使用 `--from <path>` 可匯入特定 Claude Code 主目錄或專案根目錄。

<Tip>
如需面向使用者的逐步指南，請參閱[從 Claude 遷移](/zh-TW/install/migrating-claude)。
</Tip>

### Claude 匯入的內容

- 專案 `CLAUDE.md` 和 `.claude/CLAUDE.md` 匯入 OpenClaw 代理工作區。
- 使用者 `~/.claude/CLAUDE.md` 附加到工作區 `USER.md`。
- 來自專案 `.mcp.json`、Claude Code `~/.claude.json` 和 Claude Desktop `claude_desktop_config.json` 的 MCP 伺服器定義。
- 包含 `SKILL.md` 的 Claude Skills 目錄。
- Claude 指令 Markdown 檔案會轉換為僅供手動叫用的 OpenClaw Skills。

### 封存與手動檢閱狀態

Claude hook、權限、環境預設值、本機記憶、路徑範圍規則、子代理、快取、計畫和專案歷史會保留在遷移報告中，或回報為手動檢閱項目。OpenClaw 不會自動執行 hook、複製廣泛允許清單，或匯入 OAuth/Desktop 認證狀態。

## Codex 提供者

內建 Codex 提供者預設會在 `~/.codex` 偵測 Codex CLI 狀態，或在設定環境變數 `CODEX_HOME` 時於該位置偵測。使用 `--from <path>` 可盤點特定 Codex 主目錄。

當你要移至 OpenClaw Codex harness，並想有意識地提升有用的個人 Codex CLI 資產時，請使用此提供者。本機 Codex app-server 啟動會使用每個代理各自的 `CODEX_HOME` 和 `HOME` 目錄，因此預設不會讀取你的個人 Codex CLI 狀態。

在互動式終端機中執行 `openclaw migrate codex` 會預覽完整計畫，接著在最後套用確認前，為 Skills 複製項目開啟核取方塊選擇器。使用 `Toggle all on` 或 `Toggle all off` 可批次選取；已規劃的 Skills 起始為勾選，有衝突的 Skills 起始為未勾選，而 `Skip for now` 會讓 Skills 保持不變且不套用。若要進行腳本化或精確執行，請針對每個 Skills 傳入一次 `--skill <name>`，例如：

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Codex 匯入的內容

- `$CODEX_HOME/skills` 下的 Codex CLI Skills 目錄，不包含 Codex 的 `.system` 快取。
- `$HOME/.agents/skills` 下的個人 AgentSkills；當你想要每個代理各自擁有時，會複製到目前的 OpenClaw 代理工作區。

### 手動檢閱 Codex 狀態

Codex 原生 Plugin、`config.toml` 和原生 `hooks/hooks.json` 不會自動啟用。Plugin 可能公開 MCP 伺服器、應用程式、hook 或其他可執行行為，因此提供者會回報它們以供檢閱，而不是載入 OpenClaw。設定與 hook 檔案會複製到遷移報告中以供手動檢閱。

## Hermes 提供者

內建 Hermes 提供者預設會在 `~/.hermes` 偵測狀態。當 Hermes 位於其他位置時，請使用 `--from <path>`。

### Hermes 匯入的內容

- 來自 `config.yaml` 的預設模型設定。
- 來自 `providers` 和 `custom_providers` 的已設定模型提供者與自訂 OpenAI 相容端點。
- 來自 `mcp_servers` 或 `mcp.servers` 的 MCP 伺服器定義。
- `SOUL.md` 和 `AGENTS.md` 匯入 OpenClaw 代理工作區。
- `memories/MEMORY.md` 和 `memories/USER.md` 附加到工作區記憶檔案。
- OpenClaw 檔案記憶的記憶設定預設值，以及 Honcho 等外部記憶提供者的封存或手動檢閱項目。
- `skills/<name>/` 下包含 `SKILL.md` 檔案的 Skills。
- 來自 `skills.config` 的每個 Skills 設定值。
- 來自 `.env` 的支援 API 金鑰，僅在使用 `--include-secrets` 時匯入。

### 支援的 `.env` 金鑰

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### 僅封存狀態

OpenClaw 無法安全解讀的 Hermes 狀態會複製到遷移報告中以供手動檢閱，但不會載入即時 OpenClaw 設定或認證資料。這會保留不透明或不安全的狀態，而不假裝 OpenClaw 能自動執行或信任它：

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### 套用後

```bash
openclaw doctor
```

## Plugin 合約

遷移來源是 Plugin。Plugin 會在 `openclaw.plugin.json` 中宣告其提供者 ID：

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

執行階段中，Plugin 會呼叫 `api.registerMigrationProvider(...)`。提供者會實作 `detect`、`plan` 和 `apply`。核心擁有 CLI 編排、備份政策、提示、JSON 輸出和衝突預檢。核心會將已檢閱的計畫傳入 `apply(ctx, plan)`，而提供者僅可在該引數因相容性而缺席時重建計畫。

提供者 Plugin 可以使用 `openclaw/plugin-sdk/migration` 建構項目和摘要計數，並使用 `openclaw/plugin-sdk/migration-runtime` 進行具衝突感知的檔案複製、僅封存的報告複製、快取的 config-runtime 包裝器，以及遷移報告。

## Onboarding 整合

當提供者偵測到已知來源時，Onboarding 可以提供遷移。`openclaw onboard --flow import` 和 `openclaw setup --wizard --import-from hermes` 都使用相同的 Plugin 遷移提供者，且仍會在套用前顯示預覽。

<Note>
Onboarding 匯入需要全新的 OpenClaw 設定。如果你已經有本機狀態，請先重設設定、認證資料、工作階段和工作區。既有設定的備份加覆寫或合併匯入目前受功能旗標控管。
</Note>

## 相關

- [從 Hermes 遷移](/zh-TW/install/migrating-hermes)：面向使用者的逐步指南。
- [從 Claude 遷移](/zh-TW/install/migrating-claude)：面向使用者的逐步指南。
- [遷移](/zh-TW/install/migrating)：將 OpenClaw 移至新機器。
- [Doctor](/zh-TW/gateway/doctor)：套用遷移後的健康檢查。
- [Plugin](/zh-TW/tools/plugin)：Plugin 安裝與註冊。
