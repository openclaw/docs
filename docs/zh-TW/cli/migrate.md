---
read_when:
    - 你想從 Hermes 或其他代理系統遷移到 OpenClaw
    - 你正在新增一個由 Plugin 擁有的遷移提供者
summary: '`openclaw migrate` 的 CLI 參考（從另一個代理系統匯入狀態）'
title: 遷移
x-i18n:
    generated_at: "2026-04-30T20:05:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffcd9e874bdaa0a5195e712d4fccd7b3d53034cb362c7f7462e9c7df72477b1a
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

透過 Plugin 擁有的遷移提供者，從另一個代理系統匯入狀態。內建提供者涵蓋 Codex CLI 狀態、[Claude](/zh-TW/install/migrating-claude) 和 [Hermes](/zh-TW/install/migrating-hermes)；第三方 Plugin 可以註冊其他提供者。

<Tip>
如需面向使用者的逐步指南，請參閱[從 Claude 遷移](/zh-TW/install/migrating-claude)和[從 Hermes 遷移](/zh-TW/install/migrating-hermes)。[遷移中心](/zh-TW/install/migrating)會列出所有路徑。
</Tip>

## 命令

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
  已註冊遷移提供者的名稱，例如 `hermes`。執行 `openclaw migrate list` 以查看已安裝的提供者。
</ParamField>
<ParamField path="--dry-run" type="boolean">
  建立計畫並離開，不變更狀態。
</ParamField>
<ParamField path="--from <path>" type="string">
  覆寫來源狀態目錄。Hermes 預設為 `~/.hermes`。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  匯入支援的憑證。預設關閉。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  當計畫回報衝突時，允許套用作業取代既有目標。
</ParamField>
<ParamField path="--yes" type="boolean">
  略過確認提示。非互動模式中必填。
</ParamField>
<ParamField path="--skill <name>" type="string">
  依 Skills 名稱或項目 id 選取一個 Skills 複製項目。重複此旗標可遷移多個 Skills。省略時，互動式 Codex 遷移會顯示核取方塊選擇器，非互動式遷移會保留所有規劃中的 Skills。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  略過套用前備份。當本機 OpenClaw 狀態存在時，需要搭配 `--force`。
</ParamField>
<ParamField path="--force" type="boolean">
  當套用作業原本會拒絕略過備份時，必須與 `--no-backup` 一起使用。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 列印計畫或套用結果。使用 `--json` 且未使用 `--yes` 時，套用作業會列印計畫且不變更狀態。
</ParamField>

## 安全模型

`openclaw migrate` 以預覽優先。

<AccordionGroup>
  <Accordion title="套用前預覽">
    提供者會在任何變更發生前回傳逐項計畫，包含衝突、略過項目和敏感項目。JSON 計畫、套用輸出和遷移報告會遮蔽巢狀且看似祕密的金鑰，例如 API keys、tokens、authorization headers、cookies 和 passwords。

    `openclaw migrate apply <provider>` 會預覽計畫，並在變更狀態前提示確認，除非已設定 `--yes`。在非互動模式中，套用作業需要 `--yes`。

  </Accordion>
  <Accordion title="備份">
    套用作業會在套用遷移前建立並驗證 OpenClaw 備份。如果尚無本機 OpenClaw 狀態，備份步驟會略過，且遷移可繼續。若要在狀態存在時略過備份，請同時傳入 `--no-backup` 和 `--force`。
  </Accordion>
  <Accordion title="衝突">
    當計畫有衝突時，套用作業會拒絕繼續。請檢閱計畫，若確定要取代既有目標，再以 `--overwrite` 重新執行。提供者仍可在遷移報告目錄中，為被覆寫的檔案寫入項目層級備份。
  </Accordion>
  <Accordion title="祕密">
    預設永遠不會匯入祕密。使用 `--include-secrets` 以匯入支援的憑證。
  </Accordion>
</AccordionGroup>

## Claude 提供者

內建 Claude 提供者預設會在 `~/.claude` 偵測 Claude Code 狀態。使用 `--from <path>` 可匯入特定 Claude Code 主目錄或專案根目錄。

<Tip>
如需面向使用者的逐步指南，請參閱[從 Claude 遷移](/zh-TW/install/migrating-claude)。
</Tip>

### Claude 會匯入的內容

- 將專案 `CLAUDE.md` 和 `.claude/CLAUDE.md` 匯入 OpenClaw 代理工作區。
- 將使用者 `~/.claude/CLAUDE.md` 附加到工作區 `USER.md`。
- 從專案 `.mcp.json`、Claude Code `~/.claude.json` 和 Claude Desktop `claude_desktop_config.json` 匯入 MCP 伺服器定義。
- 包含 `SKILL.md` 的 Claude Skills 目錄。
- 將 Claude 命令 Markdown 檔案轉換為僅可手動叫用的 OpenClaw Skills。

### 封存與需手動檢閱的狀態

Claude hooks、permissions、environment defaults、local memory、path-scoped rules、subagents、caches、plans 和 project history 會保留在遷移報告中，或回報為需手動檢閱的項目。OpenClaw 不會自動執行 hooks、複製廣泛 allowlists，或匯入 OAuth/Desktop 憑證狀態。

## Codex 提供者

內建 Codex 提供者預設會在 `~/.codex` 偵測 Codex CLI 狀態，或在設定該環境變數時，於 `CODEX_HOME` 偵測。使用 `--from <path>` 可盤點特定 Codex 主目錄。

當你要移至 OpenClaw Codex harness，並想有意識地提升有用的個人 Codex CLI 資產時，請使用此提供者。本機 Codex app-server 啟動會使用每個代理各自的 `CODEX_HOME` 和 `HOME` 目錄，因此預設不會讀取你的個人 Codex CLI 狀態。

在互動式終端機中執行 `openclaw migrate codex` 會預覽完整計畫，接著在最終套用確認前，為 Skills 複製項目開啟核取方塊選擇器。所有 Skills 一開始都會被選取；取消勾選你不想複製到此代理的任何 Skills。若要用於腳本或精確執行，請針對每個 Skills 傳入一次 `--skill <name>`，例如：

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Codex 會匯入的內容

- `$CODEX_HOME/skills` 底下的 Codex CLI Skills 目錄，不包含 Codex 的 `.system` 快取。
- `$HOME/.agents/skills` 底下的個人 AgentSkills，當你希望由每個代理擁有時，會複製到目前的 OpenClaw 代理工作區。

### 需手動檢閱的 Codex 狀態

Codex 原生 Plugin、`config.toml` 和原生 `hooks/hooks.json` 不會自動啟用。Plugin 可能會公開 MCP 伺服器、apps、hooks 或其他可執行行為，因此提供者會將它們回報以供檢閱，而不是載入 OpenClaw。Config 和 hook 檔案會複製到遷移報告中以供手動檢閱。

## Hermes 提供者

內建 Hermes 提供者預設會在 `~/.hermes` 偵測狀態。當 Hermes 位於其他位置時，請使用 `--from <path>`。

### Hermes 會匯入的內容

- 來自 `config.yaml` 的預設模型設定。
- 來自 `providers` 和 `custom_providers` 的已設定模型提供者與自訂 OpenAI 相容端點。
- 來自 `mcp_servers` 或 `mcp.servers` 的 MCP 伺服器定義。
- 將 `SOUL.md` 和 `AGENTS.md` 匯入 OpenClaw 代理工作區。
- 將 `memories/MEMORY.md` 和 `memories/USER.md` 附加到工作區記憶檔案。
- OpenClaw 檔案記憶體的記憶體設定預設值，以及 Honcho 等外部記憶體提供者的封存或需手動檢閱項目。
- `skills/<name>/` 底下包含 `SKILL.md` 檔案的 Skills。
- 來自 `skills.config` 的每個 Skills 設定值。
- 來自 `.env` 的受支援 API keys，僅在使用 `--include-secrets` 時匯入。

### 支援的 `.env` 金鑰

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### 僅封存的狀態

OpenClaw 無法安全解譯的 Hermes 狀態會複製到遷移報告中以供手動檢閱，但不會載入即時 OpenClaw 設定或憑證。這會保留不透明或不安全的狀態，而不假裝 OpenClaw 能自動執行或信任它：

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

遷移來源是 Plugin。Plugin 會在 `openclaw.plugin.json` 中宣告其提供者 id：

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

執行時，Plugin 會呼叫 `api.registerMigrationProvider(...)`。提供者會實作 `detect`、`plan` 和 `apply`。Core 擁有 CLI 編排、備份政策、提示、JSON 輸出和衝突預檢。Core 會將已檢閱的計畫傳入 `apply(ctx, plan)`，而提供者只能在為了相容性且該引數不存在時重建計畫。

Provider Plugin 可以使用 `openclaw/plugin-sdk/migration` 進行項目建構與摘要計數，並使用 `openclaw/plugin-sdk/migration-runtime` 進行可感知衝突的檔案複製、僅封存報告複製、快取的 config-runtime wrappers，以及遷移報告。

## Onboarding 整合

當提供者偵測到已知來源時，Onboarding 可以提供遷移。`openclaw onboard --flow import` 和 `openclaw setup --wizard --import-from hermes` 都會使用相同的 Plugin 遷移提供者，並且仍會在套用前顯示預覽。

<Note>
Onboarding 匯入需要全新的 OpenClaw 設定。如果你已經有本機狀態，請先重設設定、憑證、工作階段和工作區。備份加覆寫或合併匯入，對既有設定仍受功能旗標控管。
</Note>

## 相關

- [從 Hermes 遷移](/zh-TW/install/migrating-hermes)：面向使用者的逐步指南。
- [從 Claude 遷移](/zh-TW/install/migrating-claude)：面向使用者的逐步指南。
- [遷移](/zh-TW/install/migrating)：將 OpenClaw 移至新機器。
- [Doctor](/zh-TW/gateway/doctor)：套用遷移後的健康檢查。
- [Plugin](/zh-TW/tools/plugin)：Plugin 安裝與註冊。
