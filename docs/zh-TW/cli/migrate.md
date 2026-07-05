---
read_when:
    - 你想從 Hermes 或其他代理系統遷移到 OpenClaw
    - 你正在新增一個由外掛擁有的遷移提供者
summary: '`openclaw migrate` 的命令列介面參考（從另一個代理系統匯入狀態）'
title: 遷移
x-i18n:
    generated_at: "2026-07-05T11:08:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1160373bfec09de8ec1bac6fbe8a218e8af7ec6a5896bc1fdfe6a0db158d50a1
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

透過外掛擁有的遷移供應器，從另一個代理系統匯入狀態。內建供應器涵蓋 Claude、Codex 命令列介面，以及 [Hermes](/zh-TW/install/migrating-hermes)；外掛可以註冊其他供應器。

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
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
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

執行不帶其他旗標的 `openclaw migrate <provider>` 會先規劃、預覽，並且（在終端介面中）提示確認後再套用。`openclaw migrate plan <provider>` 和 `openclaw migrate apply <provider>` 會以相同旗標將預覽和套用拆成不同子命令。

<ParamField path="<provider>" type="string">
  已註冊遷移供應器的名稱，例如 `hermes`。執行 `openclaw migrate list` 查看已安裝的供應器。
</ParamField>
<ParamField path="--dry-run" type="boolean">
  建立計畫並結束，不變更狀態。
</ParamField>
<ParamField path="--from <path>" type="string">
  覆寫來源狀態目錄。Hermes 預設為 `~/.hermes`，Codex 預設為 `~/.codex`（或 `$CODEX_HOME`），Claude 預設為 `~/.claude`。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  匯入支援的認證而不提示。互動式套用會在匯入偵測到的驗證認證前詢問，且預設選取是；非互動式 `--yes` 需要 `--include-secrets` 才會匯入它們。
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  略過驗證認證匯入，包括互動式提示。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  當計畫回報衝突時，允許套用取代既有目標。
</ParamField>
<ParamField path="--yes" type="boolean">
  略過確認提示。非互動模式需要此旗標。
</ParamField>
<ParamField path="--skill <name>" type="string">
  依 Skills 名稱或項目 ID 選取一個 Skills 複製項目。重複此旗標可遷移多個 Skills。省略時，互動式 Codex 遷移會顯示核取方塊選擇器，非互動式遷移會保留所有已規劃的 Skills。
</ParamField>
<ParamField path="--plugin <name>" type="string">
  依外掛名稱或項目 ID 選取一個 Codex 外掛安裝項目。重複此旗標可遷移多個 Codex 外掛。省略時，互動式 Codex 遷移會顯示原生 Codex 外掛核取方塊選擇器，非互動式遷移會保留所有已規劃的外掛。僅適用於由 Codex 應用伺服器清冊發現、來源已安裝的 `openai-curated` Codex 外掛。
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  僅限 Codex。規劃原生外掛啟用前，強制重新走訪來源 Codex 應用伺服器 `app/list`。預設關閉，以保持遷移規劃快速。
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  遷移前備份封存檔路徑或目錄。會傳遞給 `openclaw backup create`。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  略過套用前備份。當本機 OpenClaw 狀態存在時需要 `--force`。
</ParamField>
<ParamField path="--force" type="boolean">
  當套用原本會拒絕略過備份時，必須與 `--no-backup` 一起使用。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 列印計畫或套用結果。使用 `--json` 且沒有 `--yes` 時，套用會列印計畫且不變更狀態。
</ParamField>

## 安全模型

`openclaw migrate` 採預覽優先。

<AccordionGroup>
  <Accordion title="套用前預覽">
    在任何變更發生前，供應器會回傳逐項列出的計畫，包括衝突、略過項目和敏感項目。JSON 計畫、套用輸出和遷移報告會遮蔽巢狀、看似祕密的鍵，例如 API 金鑰、權杖、授權標頭、Cookie 和密碼。

    `openclaw migrate apply <provider>` 會預覽計畫，並在變更狀態前提示確認，除非已設定 `--yes`。在非互動模式中，套用需要 `--yes`。

  </Accordion>
  <Accordion title="備份">
    套用會在套用遷移前建立並驗證 OpenClaw 備份。如果尚無本機 OpenClaw 狀態，會略過備份步驟並繼續遷移。若要在狀態存在時略過備份，請同時傳入 `--no-backup` 和 `--force`。
  </Accordion>
  <Accordion title="衝突">
    當計畫有衝突時，套用會拒絕繼續。檢視計畫後，如果確定要取代既有目標，請使用 `--overwrite` 重新執行。供應器仍可能在遷移報告目錄中，為被覆寫的檔案寫入項目層級備份。
  </Accordion>
  <Accordion title="祕密">
    互動式套用會詢問是否匯入偵測到的驗證認證，且預設選取是。使用 `--no-auth-credentials` 可略過它們，或使用 `--include-secrets` 搭配 `--yes` 進行無人值守的認證匯入。
  </Accordion>
</AccordionGroup>

## Claude 供應器

內建 Claude 供應器預設會偵測 `~/.claude` 中的 Claude Code 狀態。使用 `--from <path>` 可匯入特定 Claude Code home 或專案根目錄。

<Tip>
如需面向使用者的逐步指南，請參閱[從 Claude 遷移](/zh-TW/install/migrating-claude)。
</Tip>

### Claude 會匯入什麼

- 將專案 `CLAUDE.md` 和 `.claude/CLAUDE.md` 匯入 OpenClaw 代理工作區（`AGENTS.md`）。
- 將使用者 `~/.claude/CLAUDE.md` 附加到工作區 `USER.md`。
- 來自專案 `.mcp.json`、Claude Code `~/.claude.json`（包括其各專案項目）和 Claude Desktop `claude_desktop_config.json` 的 MCP 伺服器定義。
- 包含 `SKILL.md` 的 Claude Skills 目錄（使用者 `~/.claude/skills` 和專案 `.claude/skills`）。
- Claude 命令 Markdown 檔案（使用者 `~/.claude/commands` 和專案 `.claude/commands`），會轉換成只能手動叫用的 OpenClaw Skills。

### 封存與手動審查狀態

Claude hooks、權限、環境預設值、專案 `CLAUDE.local.md`、`.claude/rules`、使用者與專案 `agents/` 目錄，以及專案歷史（`~/.claude` 底下的 `projects`、`cache`、`plans`）會保留在遷移報告中，或回報為手動審查項目。OpenClaw 不會自動執行 hooks、複製廣泛允許清單，或匯入 OAuth/Desktop 認證狀態。

## Codex 供應器

內建 Codex 供應器預設會偵測 `~/.codex` 中的 Codex 命令列介面狀態，或在設定該環境變數時使用 `CODEX_HOME`。使用 `--from <path>` 可盤點特定 Codex home。

當你要移至 OpenClaw Codex harness，並且想有意識地提升有用的個人 Codex 命令列介面資產時，請使用此供應器。本機 Codex 應用伺服器啟動會使用每個代理各自的 `CODEX_HOME`，因此預設不會讀取你的個人 `~/.codex`。一般程序的 `HOME` 仍會繼承，因此 Codex 可以看到共用的 `$HOME/.agents/*` Skills/外掛 marketplace 項目，而子程序也可以找到使用者 home 設定和權杖。

在互動式終端機中執行 `openclaw migrate codex` 會預覽完整計畫，然後在最終套用確認前開啟核取方塊選擇器。Skills 複製項目會先提示。使用 `Toggle all on` 或 `Toggle all off` 進行批次選取。按 Space 切換列，或按 Enter 啟用醒目提示的列並繼續。已規劃的 Skills 起始為已勾選，衝突的 Skills 起始為未勾選，而 `Skip for now` 會略過本次執行的 Skills 複製，同時仍繼續進入外掛選擇。當來源已安裝的策展 Codex 外掛可遷移且未提供 `--plugin` 時，遷移接著會依外掛名稱提示原生 Codex 外掛啟用。除非目標 OpenClaw Codex 外掛設定已經有該外掛，否則外掛項目起始為已勾選。既有目標外掛起始為未勾選，並顯示衝突提示，例如 `conflict: plugin exists`；選擇 `Toggle all off` 可在該次執行中不遷移任何原生 Codex 外掛，或選擇 `Skip for now` 在套用前停止。

對於腳本化或精確執行，請明確選取一個或多個 Skills 或外掛：

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex 會匯入什麼

- `$CODEX_HOME/skills` 底下的 Codex 命令列介面 Skills 目錄，不包括 Codex 的 `.system` 快取。
- `$HOME/.agents/skills` 底下的個人 AgentSkills，會複製到目前的 OpenClaw 代理工作區，以供每個代理擁有。
- 透過 Codex 應用伺服器 `plugin/list` 發現、來源已安裝的 `openai-curated` Codex 外掛。規劃會針對每個已啟用且已安裝的外掛讀取 `plugin/read`。

應用程式支援的外掛遷移有額外門檻：

- 應用程式支援的外掛需要來源 Codex 應用伺服器帳戶是 ChatGPT 訂閱帳戶。非 ChatGPT 或缺少帳戶回應會以 `codex_subscription_required` 略過。
- 預設情況下，遷移不會呼叫來源 `app/list`，因此通過帳戶門檻的應用程式支援外掛，會在沒有來源應用程式可存取性驗證的情況下規劃，而帳戶查詢傳輸失敗會以 `codex_account_unavailable` 略過。
- 傳入 `--verify-plugin-apps` 會強制取得新的來源 `app/list` 快照，並要求每個擁有的應用程式在規劃原生啟用前都存在、已啟用且可存取。在該模式中，帳戶查詢傳輸失敗會落到來源應用程式清冊驗證。快照只保留在目前程序的記憶體中；絕不會寫入遷移輸出或目標設定。

停用的外掛、無法讀取的外掛詳細資料、受訂閱限制的來源帳戶，以及（設定 `--verify-plugin-apps` 時）缺少、停用或無法存取的應用程式，會成為帶有型別化原因的手動略過項目，而不是目標設定項目。套用會針對每個選取且符合資格的外掛呼叫應用伺服器 `plugin/install`，即使目標應用伺服器已回報該外掛已安裝且已啟用也是如此。已遷移的 Codex 外掛只能在選取原生 Codex harness 的工作階段中使用；它們不會暴露給 OpenClaw 供應器執行、ACP 對話繫結或其他 harness。

### 手動審查 Codex 狀態

Codex `config.toml`、原生 `hooks/hooks.json`、非策展 marketplace、不是來源已安裝策展外掛的快取外掛套件，以及未通過來源訂閱門檻的來源已安裝外掛，不會自動啟用。設定 `--verify-plugin-apps` 時，未通過來源應用程式清冊門檻的外掛也會被略過。所有這些都會複製或回報在遷移報告中，以供手動審查。

對於已遷移、來源已安裝的策展外掛，套用會寫入：

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- 每個選取外掛各一個明確外掛項目，包含 `marketplaceName: "openai-curated"` 和 `pluginName`

遷移絕不會寫入 `plugins["*"]`，也絕不會儲存本機 marketplace 快取路徑。

略過的外掛不會寫入目標設定。來源端訂閱失敗會以型別化原因回報在手動項目上：`codex_subscription_required`、`codex_account_unavailable`、`plugin_disabled` 或 `plugin_read_unavailable`。使用 `--verify-plugin-apps` 時，來源應用程式清單失敗也可能顯示為 `app_inaccessible`、`app_disabled`、`app_missing` 或 `app_inventory_unavailable`。目標端需要驗證的安裝會回報在受影響的外掛項目上，並帶有 `status: "skipped"`、`reason: "auth_required"` 與已淨化的應用程式識別碼；其明確設定項目會先以停用狀態寫入，直到你重新授權並啟用它們。其他安裝失敗則是限定於項目的 `error` 結果。

如果 Codex 應用程式伺服器外掛清單在規劃期間無法使用，遷移會改為退回使用快取的套件組合建議項目，而不是讓整個遷移失敗。

## Hermes 提供者

內建的 Hermes 提供者預設會偵測 `~/.hermes` 的狀態。Hermes 位於其他位置時，請使用 `--from <path>`。

### Hermes 匯入內容

- 從 `config.yaml` 匯入預設模型設定。
- 從 `providers` 和 `custom_providers` 匯入已設定的模型提供者與自訂 OpenAI 相容端點。
- 從 `mcp_servers` 或 `mcp.servers` 匯入 MCP 伺服器定義。
- 將 `SOUL.md` 和 `AGENTS.md` 匯入 OpenClaw agent 工作區。
- 將 `memories/MEMORY.md` 和 `memories/USER.md` 附加到工作區記憶檔案。
- 匯入 OpenClaw 檔案記憶的記憶設定預設值，以及外部記憶提供者（例如 Honcho）的封存或手動審查項目。
- 匯入在 `skills/<name>/` 下包含 `SKILL.md` 檔案的 Skills。
- 從 `skills.config` 匯入每項 Skill 的設定值。
- 當接受互動式憑證遷移，或設定 `--include-secrets` 時，從 OpenCode `auth.json` 匯入 OpenCode OpenAI OAuth 憑證。Hermes `auth.json` OAuth 項目是舊版狀態，會回報為需手動重新驗證 OpenAI 或由 doctor 修復。
- 當接受互動式憑證遷移，或設定 `--include-secrets` 時，從 Hermes `.env` 和 OpenCode `auth.json` 匯入支援的 API 金鑰與權杖。

### 支援的 `.env` 金鑰

`AI_GATEWAY_API_KEY`、`ALIBABA_API_KEY`、`ANTHROPIC_API_KEY`、`ARCEEAI_API_KEY`、`CEREBRAS_API_KEY`、`CHUTES_API_KEY`、`CLOUDFLARE_AI_GATEWAY_API_KEY`、`COPILOT_GITHUB_TOKEN`、`DASHSCOPE_API_KEY`、`DEEPINFRA_API_KEY`、`DEEPSEEK_API_KEY`、`FIREWORKS_API_KEY`、`GEMINI_API_KEY`、`GH_TOKEN`、`GITHUB_TOKEN`、`GLM_API_KEY`、`GOOGLE_API_KEY`、`GROQ_API_KEY`、`HF_TOKEN`、`HUGGINGFACE_HUB_TOKEN`、`KILOCODE_API_KEY`、`KIMICODE_API_KEY`、`KIMI_API_KEY`、`MINIMAX_API_KEY`、`MINIMAX_CODING_API_KEY`、`MISTRAL_API_KEY`、`MODELSTUDIO_API_KEY`、`MOONSHOT_API_KEY`、`NVIDIA_API_KEY`、`OPENAI_API_KEY`、`OPENCODE_API_KEY`、`OPENCODE_GO_API_KEY`、`OPENCODE_ZEN_API_KEY`、`OPENROUTER_API_KEY`、`QIANFAN_API_KEY`、`QWEN_API_KEY`、`TOGETHER_API_KEY`、`VENICE_API_KEY`、`XAI_API_KEY`、`XIAOMI_API_KEY`、`ZAI_API_KEY`、`Z_AI_API_KEY`。

### 僅封存狀態

OpenClaw 無法安全解讀的 Hermes 狀態會複製到遷移報告中供手動審查，但不會載入即時 OpenClaw 設定或憑證。這會保留不透明或不安全的狀態，同時不假裝 OpenClaw 可以自動執行或信任它：`plugins/`、`sessions/`、`logs/`、`cron/`、`mcp-tokens/`、`state.db`。

### 套用後

```bash
openclaw doctor
```

## 外掛合約

遷移來源是外掛。外掛會在 `openclaw.plugin.json` 中宣告其提供者 ID：

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

執行階段，外掛會呼叫 `api.registerMigrationProvider(...)`。提供者會實作 `detect`、`plan` 和 `apply`。核心負責命令列介面協調、備份政策、提示、JSON 輸出與衝突預檢。核心會將已審查的計畫傳入 `apply(ctx, plan)`；提供者只有在該引數因相容性而缺席時，才可以重建計畫。

提供者外掛可以使用 `openclaw/plugin-sdk/migration` 來建構項目與摘要計數，並使用 `openclaw/plugin-sdk/migration-runtime` 進行衝突感知的檔案複製、僅封存報告複製、快取的設定執行階段包裝器，以及遷移報告。

## 入門整合

當提供者偵測到已知來源時，入門流程可以提供遷移。`openclaw onboard --flow import` 和 `openclaw setup --wizard --import-from hermes` 都使用相同的外掛遷移提供者，並且在套用前仍會顯示預覽。

<Note>
入門匯入需要全新的 OpenClaw 設定。如果你已經有本機狀態，請先重設設定、憑證、工作階段與工作區。備份加覆寫或合併匯入是針對現有設定以功能旗標控管的功能。
</Note>

## 相關內容

- [從 Hermes 遷移](/zh-TW/install/migrating-hermes)：面向使用者的逐步指南。
- [從 Claude 遷移](/zh-TW/install/migrating-claude)：面向使用者的逐步指南。
- [遷移](/zh-TW/install/migrating)：將 OpenClaw 移至新機器。
- [Doctor](/zh-TW/gateway/doctor)：套用遷移後的健康檢查。
- [外掛](/zh-TW/tools/plugin)：外掛安裝與註冊。
