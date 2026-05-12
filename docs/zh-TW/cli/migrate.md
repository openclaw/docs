---
read_when:
    - 你想要從 Hermes 或其他代理系統遷移到 OpenClaw
    - 你正在新增一個由 Plugin 擁有的遷移提供者
summary: '`openclaw migrate` 的 CLI 參考（從另一個代理系統匯入狀態）'
title: 遷移
x-i18n:
    generated_at: "2026-05-12T00:58:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95d31d2995d426c7886700c9e0e6c6fa0c013a27c0bfe7cf91380c8029d6df89
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

透過由 Plugin 擁有的遷移提供者，從另一個代理系統匯入狀態。內建提供者涵蓋 Codex CLI 狀態、[Claude](/zh-TW/install/migrating-claude) 和 [Hermes](/zh-TW/install/migrating-hermes)；第三方 Plugin 可以註冊其他提供者。

<Tip>
如需面向使用者的逐步指南，請參閱[從 Claude 遷移](/zh-TW/install/migrating-claude)和[從 Hermes 遷移](/zh-TW/install/migrating-hermes)。[遷移中心](/zh-TW/install/migrating)列出所有路徑。
</Tip>

## 命令

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
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
  建立計畫並結束，不變更狀態。
</ParamField>
<ParamField path="--from <path>" type="string">
  覆寫來源狀態目錄。Hermes 預設為 `~/.hermes`。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  匯入支援的憑證。預設關閉。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  當計畫回報衝突時，允許套用操作取代現有目標。
</ParamField>
<ParamField path="--yes" type="boolean">
  略過確認提示。非互動模式中必須使用。
</ParamField>
<ParamField path="--skill <name>" type="string">
  依 Skills 名稱或項目 ID 選取一個 Skills 複製項目。重複此旗標可遷移多個 Skills。省略時，互動式 Codex 遷移會顯示核取方塊選擇器，非互動式遷移會保留所有已規劃的 Skills。
</ParamField>
<ParamField path="--plugin <name>" type="string">
  依 Plugin 名稱或項目 ID 選取一個 Codex Plugin 安裝項目。重複此旗標可遷移多個 Codex Plugin。省略時，互動式 Codex 遷移會顯示原生 Codex Plugin 核取方塊選擇器，非互動式遷移會保留所有已規劃的 Plugin。這只適用於 Codex 應用程式伺服器清單發現的來源已安裝 `openai-curated` Codex Plugin。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  略過套用前備份。當本機 OpenClaw 狀態存在時，需要 `--force`。
</ParamField>
<ParamField path="--force" type="boolean">
  當套用操作原本會拒絕略過備份時，必須與 `--no-backup` 一起使用。
</ParamField>
<ParamField path="--json" type="boolean">
  將計畫或套用結果列印為 JSON。搭配 `--json` 但未使用 `--yes` 時，套用操作會列印計畫且不變更狀態。
</ParamField>

## 安全模型

`openclaw migrate` 採用先預覽的流程。

<AccordionGroup>
  <Accordion title="套用前預覽">
    提供者會在任何變更發生前傳回逐項列出的計畫，包含衝突、略過項目和敏感項目。JSON 計畫、套用輸出和遷移報告會遮蔽巢狀且看似機密的鍵，例如 API 金鑰、權杖、授權標頭、Cookie 和密碼。

    `openclaw migrate apply <provider>` 會先預覽計畫，並在變更狀態前提示確認，除非已設定 `--yes`。在非互動模式中，套用操作需要 `--yes`。

  </Accordion>
  <Accordion title="備份">
    套用操作會在套用遷移前建立並驗證 OpenClaw 備份。如果尚未存在本機 OpenClaw 狀態，則會略過備份步驟，並可繼續遷移。若要在狀態存在時略過備份，請同時傳入 `--no-backup` 和 `--force`。
  </Accordion>
  <Accordion title="衝突">
    當計畫有衝突時，套用操作會拒絕繼續。請檢閱計畫，若確定要取代現有目標，請使用 `--overwrite` 重新執行。提供者仍可在遷移報告目錄中，為被覆寫的檔案寫入項目層級備份。
  </Accordion>
  <Accordion title="機密">
    預設永不匯入機密。使用 `--include-secrets` 匯入支援的憑證。
  </Accordion>
</AccordionGroup>

## Claude 提供者

內建 Claude 提供者預設會偵測 `~/.claude` 的 Claude Code 狀態。使用 `--from <path>` 匯入特定 Claude Code 主目錄或專案根目錄。

<Tip>
如需面向使用者的逐步指南，請參閱[從 Claude 遷移](/zh-TW/install/migrating-claude)。
</Tip>

### Claude 會匯入的內容

- 專案 `CLAUDE.md` 和 `.claude/CLAUDE.md` 到 OpenClaw 代理工作區。
- 使用者 `~/.claude/CLAUDE.md` 會附加到工作區 `USER.md`。
- 來自專案 `.mcp.json`、Claude Code `~/.claude.json` 和 Claude Desktop `claude_desktop_config.json` 的 MCP 伺服器定義。
- 包含 `SKILL.md` 的 Claude Skills 目錄。
- Claude 命令 Markdown 檔案會轉換為僅可手動呼叫的 OpenClaw Skills。

### 封存與手動檢閱狀態

Claude hooks、權限、環境預設值、本機記憶體、路徑範圍規則、subagents、快取、計畫和專案歷史會保留在遷移報告中，或回報為手動檢閱項目。OpenClaw 不會自動執行 hooks、複製廣泛允許清單，或匯入 OAuth/Desktop 憑證狀態。

## Codex 提供者

內建 Codex 提供者預設會偵測 `~/.codex` 的 Codex CLI 狀態，或在設定該環境變數時偵測
`CODEX_HOME`。使用 `--from <path>` 盤點特定 Codex 主目錄。

當你移轉到 OpenClaw Codex harness，並想有意識地提升實用的個人 Codex CLI 資產時，請使用此提供者。本機 Codex 應用程式伺服器
啟動會使用每個代理各自的 `CODEX_HOME` 和 `HOME` 目錄，因此預設不會讀取
你的個人 Codex CLI 狀態。

在互動式終端機中執行 `openclaw migrate codex` 會預覽完整
計畫，然後在最終套用確認前開啟核取方塊選擇器。Skills
複製項目會先提示。使用 `Toggle all on` 或 `Toggle all off` 進行批次
選取；已規劃的 Skills 初始為勾選，有衝突的 Skills 初始為未勾選，而
`Skip for now` 會略過此次執行的 Skills 複製，同時仍繼續進入 Plugin
選取。當來源已安裝的精選 Codex Plugin 可遷移且未提供
`--plugin` 時，遷移接著會依 Plugin 名稱提示原生 Codex Plugin
啟用。Plugin 項目初始為勾選，除非目標 OpenClaw Codex Plugin 設定中已經有該
Plugin。現有目標 Plugin 初始為未勾選，並顯示類似
`conflict: plugin exists` 的衝突提示；選擇 `Toggle all off` 可在該次執行中不遷移任何原生 Codex
Plugin，或選擇 `Skip for now` 在套用前停止。若要進行指令碼化或
精確執行，請為每個 Skills 傳入一次 `--skill <name>`，例如：

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

使用 `--plugin <name>` 可在非互動模式中，將原生 Codex Plugin 遷移限制為
一個或多個來源已安裝的精選 Plugin：

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex 會匯入的內容

- `$CODEX_HOME/skills` 下的 Codex CLI Skills 目錄，不含 Codex 的
  `.system` 快取。
- `$HOME/.agents/skills` 下的個人 AgentSkills，當你想要每個代理各自擁有時，會複製到目前的
  OpenClaw 代理工作區。
- 透過 Codex
  應用程式伺服器 `plugin/list` 發現的來源已安裝 `openai-curated` Codex Plugin。套用操作會對每個
  已選 Plugin 呼叫應用程式伺服器 `plugin/install`，即使目標應用程式伺服器已回報該 Plugin 為
  已安裝並啟用。遷移的 Codex Plugin 只能在選取原生 Codex harness 的工作階段中使用；
  它們不會暴露給 Pi、一般 OpenAI
  提供者執行、ACP 對話繫結或其他 harness。

### 手動檢閱 Codex 狀態

Codex `config.toml`、原生 `hooks/hooks.json`、非精選 marketplace，以及
不是來源已安裝精選 Plugin 的快取 Plugin bundle，不會自動
啟用。它們會被複製或回報到遷移報告中供手動檢閱。

對於已遷移的來源已安裝精選 Plugin，套用操作會寫入：

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- 每個已選 Plugin 都有一個明確的 Plugin 項目，包含 `marketplaceName: "openai-curated"` 和
  `pluginName`

遷移絕不會寫入 `plugins["*"]`，也絕不會儲存本機 marketplace 快取
路徑。需要驗證的安裝會在受影響的 Plugin 項目上回報
`status: "skipped"`、`reason: "auth_required"` 和已清理的應用程式識別碼。
其明確設定項目會以停用狀態寫入，直到你重新授權並
啟用它們。其他安裝失敗是項目範圍的 `error` 結果。

如果 Codex 應用程式伺服器 Plugin 清單在規劃期間無法使用，遷移
會退回使用快取 bundle 建議項目，而不是讓整個
遷移失敗。

## Hermes 提供者

內建 Hermes 提供者預設會偵測 `~/.hermes` 的狀態。當 Hermes 位於其他位置時，請使用 `--from <path>`。

### Hermes 會匯入的內容

- 來自 `config.yaml` 的預設模型設定。
- 來自 `providers` 和 `custom_providers` 的已設定模型提供者與自訂 OpenAI 相容端點。
- 來自 `mcp_servers` 或 `mcp.servers` 的 MCP 伺服器定義。
- `SOUL.md` 和 `AGENTS.md` 到 OpenClaw 代理工作區。
- `memories/MEMORY.md` 和 `memories/USER.md` 附加到工作區記憶體檔案。
- OpenClaw 檔案記憶體的記憶體設定預設值，以及外部記憶體提供者（例如 Honcho）的封存或手動檢閱項目。
- `skills/<name>/` 下包含 `SKILL.md` 檔案的 Skills。
- 來自 `skills.config` 的每個 Skills 設定值。
- 來自 `.env` 的支援 API 金鑰，僅在使用 `--include-secrets` 時匯入。

### 支援的 `.env` 鍵

`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、`OPENROUTER_API_KEY`、`GOOGLE_API_KEY`、`GEMINI_API_KEY`、`GROQ_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY`、`DEEPSEEK_API_KEY`。

### 僅封存狀態

OpenClaw 無法安全解讀的 Hermes 狀態會複製到遷移報告中供手動檢閱，但不會載入到即時 OpenClaw 設定或憑證。這會保留不透明或不安全的狀態，而不假裝 OpenClaw 可以自動執行或信任它：

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

執行階段中，Plugin 會呼叫 `api.registerMigrationProvider(...)`。提供者會實作 `detect`、`plan` 和 `apply`。Core 擁有 CLI 協調、備份政策、提示、JSON 輸出和衝突預檢。Core 會將已檢閱的計畫傳入 `apply(ctx, plan)`，而提供者只有在為了相容性且該引數不存在時，才可以重建計畫。

提供者 Plugin 可以使用 `openclaw/plugin-sdk/migration` 進行項目建構與摘要計數，並使用 `openclaw/plugin-sdk/migration-runtime` 進行衝突感知檔案複製、僅封存報告複製、快取設定執行階段包裝器和遷移報告。

## Onboarding 整合

當提供者偵測到已知來源時，Onboarding 可以提供遷移。`openclaw onboard --flow import` 和 `openclaw setup --wizard --import-from hermes` 都使用相同的 Plugin 遷移提供者，並且仍會在套用前顯示預覽。

<Note>
入門匯入需要全新的 OpenClaw 設定。如果你已經有本機狀態，請先重設設定、認證資料、工作階段和工作區。備份後覆寫或合併匯入功能，對既有設定仍受功能開關控管。
</Note>

## 相關

- [從 Hermes 遷移](/zh-TW/install/migrating-hermes)：面向使用者的逐步指南。
- [從 Claude 遷移](/zh-TW/install/migrating-claude)：面向使用者的逐步指南。
- [遷移](/zh-TW/install/migrating)：將 OpenClaw 移至新機器。
- [Doctor](/zh-TW/gateway/doctor)：套用遷移後的健康檢查。
- [Plugins](/zh-TW/tools/plugin)：Plugin 安裝與註冊。
