---
read_when:
    - 你想從 Hermes 或其他代理系統遷移到 OpenClaw
    - 你正在新增由 Plugin 擁有的遷移提供者
summary: '`openclaw migrate` 的 CLI 參考（從另一個代理系統匯入狀態）'
title: 遷移
x-i18n:
    generated_at: "2026-04-30T02:54:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3db14c16b8f9dcbf86a4f12558cf4e8555aa9a255637034fb804148996a225e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

透過 Plugin 所擁有的遷移提供者，從另一個代理系統匯入狀態。內建提供者涵蓋 [Claude](/zh-TW/install/migrating-claude) 和 [Hermes](/zh-TW/install/migrating-hermes)；第三方插件可以註冊其他提供者。

<Tip>
如需面向使用者的逐步說明，請參閱[從 Claude 遷移](/zh-TW/install/migrating-claude)和[從 Hermes 遷移](/zh-TW/install/migrating-hermes)。[遷移中心](/zh-TW/install/migrating)列出所有路徑。
</Tip>

## 命令

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
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
  建立計畫後結束，不變更狀態。
</ParamField>
<ParamField path="--from <path>" type="string">
  覆寫來源狀態目錄。Hermes 預設為 `~/.hermes`。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  匯入支援的憑證。預設為關閉。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  當計畫回報衝突時，允許套用取代現有目標。
</ParamField>
<ParamField path="--yes" type="boolean">
  略過確認提示。在非互動模式中必填。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  略過套用前備份。當本機 OpenClaw 狀態存在時，需要搭配 `--force`。
</ParamField>
<ParamField path="--force" type="boolean">
  當套用原本會拒絕略過備份時，必須與 `--no-backup` 一起使用。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 列印計畫或套用結果。使用 `--json` 且未使用 `--yes` 時，套用會列印計畫且不變更狀態。
</ParamField>

## 安全模型

`openclaw migrate` 以預覽優先。

<AccordionGroup>
  <Accordion title="Preview before apply">
    在任何變更發生前，提供者會傳回逐項列出的計畫，其中包含衝突、略過的項目和敏感項目。JSON 計畫、套用輸出和遷移報告會遮蔽巢狀且看似祕密的鍵，例如 API 金鑰、權杖、授權標頭、Cookie 和密碼。

    `openclaw migrate apply <provider>` 會先預覽計畫，並在變更狀態前提示，除非已設定 `--yes`。在非互動模式中，套用需要 `--yes`。

  </Accordion>
  <Accordion title="Backups">
    套用會在套用遷移前建立並驗證 OpenClaw 備份。如果尚未存在本機 OpenClaw 狀態，則會略過備份步驟，遷移可以繼續。若要在狀態存在時略過備份，請同時傳入 `--no-backup` 和 `--force`。
  </Accordion>
  <Accordion title="Conflicts">
    當計畫有衝突時，套用會拒絕繼續。請檢閱計畫，若有意取代現有目標，再使用 `--overwrite` 重新執行。提供者仍可在遷移報告目錄中，為被覆寫的檔案寫入項目層級備份。
  </Accordion>
  <Accordion title="Secrets">
    預設永遠不會匯入祕密。使用 `--include-secrets` 匯入支援的憑證。
  </Accordion>
</AccordionGroup>

## Claude 提供者

內建 Claude 提供者預設會偵測 `~/.claude` 的 Claude Code 狀態。使用 `--from <path>` 匯入特定 Claude Code 主目錄或專案根目錄。

<Tip>
如需面向使用者的逐步說明，請參閱[從 Claude 遷移](/zh-TW/install/migrating-claude)。
</Tip>

### Claude 會匯入什麼

- 將專案 `CLAUDE.md` 和 `.claude/CLAUDE.md` 匯入 OpenClaw 代理工作區。
- 將使用者的 `~/.claude/CLAUDE.md` 附加到工作區 `USER.md`。
- 從專案 `.mcp.json`、Claude Code `~/.claude.json` 和 Claude Desktop `claude_desktop_config.json` 匯入 MCP 伺服器定義。
- 包含 `SKILL.md` 的 Claude skill 目錄。
- 將 Claude 命令 Markdown 檔案轉換為僅能手動叫用的 OpenClaw skills。

### 封存和手動檢閱狀態

Claude 掛鉤、權限、環境預設值、本機記憶、路徑範圍規則、子代理、快取、計畫和專案歷史會保留在遷移報告中，或回報為手動檢閱項目。OpenClaw 不會自動執行掛鉤、複製廣泛允許清單，或匯入 OAuth/Desktop 憑證狀態。

## Hermes 提供者

內建 Hermes 提供者預設會偵測 `~/.hermes` 的狀態。當 Hermes 位於其他位置時，請使用 `--from <path>`。

### Hermes 會匯入什麼

- 從 `config.yaml` 匯入預設模型設定。
- 從 `providers` 和 `custom_providers` 匯入已設定的模型提供者和自訂 OpenAI 相容端點。
- 從 `mcp_servers` 或 `mcp.servers` 匯入 MCP 伺服器定義。
- 將 `SOUL.md` 和 `AGENTS.md` 匯入 OpenClaw 代理工作區。
- 將 `memories/MEMORY.md` 和 `memories/USER.md` 附加到工作區記憶檔案。
- OpenClaw 檔案記憶的記憶設定預設值，以及外部記憶提供者（例如 Honcho）的封存或手動檢閱項目。
- `skills/<name>/` 底下包含 `SKILL.md` 檔案的 Skills。
- 從 `skills.config` 匯入每個 skill 的設定值。
- 從 `.env` 匯入支援的 API 金鑰，僅在使用 `--include-secrets` 時。

### 支援的 `.env` 鍵

`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、`OPENROUTER_API_KEY`、`GOOGLE_API_KEY`、`GEMINI_API_KEY`、`GROQ_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY`、`DEEPSEEK_API_KEY`。

### 僅封存狀態

OpenClaw 無法安全解讀的 Hermes 狀態會複製到遷移報告以供手動檢閱，但不會載入即時 OpenClaw 設定或憑證。這會保留不透明或不安全的狀態，而不假裝 OpenClaw 可以自動執行或信任它：

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### 套用之後

```bash
openclaw doctor
```

## Plugin 合約

遷移來源是插件。插件會在 `openclaw.plugin.json` 中宣告其提供者 ID：

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

執行階段中，Plugin 會呼叫 `api.registerMigrationProvider(...)`。提供者會實作 `detect`、`plan` 和 `apply`。核心負責 CLI 編排、備份政策、提示、JSON 輸出和衝突預檢。核心會將已檢閱的計畫傳入 `apply(ctx, plan)`，而提供者只有在為了相容性且該引數不存在時，才可以重建計畫。

提供者插件可以使用 `openclaw/plugin-sdk/migration` 來建構項目和彙總計數，並使用 `openclaw/plugin-sdk/migration-runtime` 來進行可感知衝突的檔案複製、僅封存的報告複製、快取設定執行階段包裝器，以及遷移報告。

## Onboarding 整合

當提供者偵測到已知來源時，Onboarding 可以提供遷移。`openclaw onboard --flow import` 和 `openclaw setup --wizard --import-from hermes` 都使用相同的插件遷移提供者，並且仍會在套用前顯示預覽。

<Note>
Onboarding 匯入需要全新的 OpenClaw 設定。如果你已經有本機狀態，請先重設設定、憑證、工作階段和工作區。對於現有設定，備份加覆寫或合併匯入功能受功能旗標控管。
</Note>

## 相關

- [從 Hermes 遷移](/zh-TW/install/migrating-hermes)：面向使用者的逐步說明。
- [從 Claude 遷移](/zh-TW/install/migrating-claude)：面向使用者的逐步說明。
- [遷移](/zh-TW/install/migrating)：將 OpenClaw 移至新機器。
- [Doctor](/zh-TW/gateway/doctor)：套用遷移後的健康檢查。
- [插件](/zh-TW/tools/plugin)：插件安裝和註冊。
