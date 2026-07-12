---
read_when:
    - 您想從 Hermes 或其他代理系統遷移至 OpenClaw
    - 你正在新增由外掛擁有的遷移提供者
summary: '`openclaw migrate` 的命令列介面參考（從另一個代理系統匯入狀態）'
title: 遷移
x-i18n:
    generated_at: "2026-07-11T21:15:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1160373bfec09de8ec1bac6fbe8a218e8af7ec6a5896bc1fdfe6a0db158d50a1
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

透過由外掛擁有的遷移提供者，從另一個代理系統匯入狀態。內建提供者涵蓋 Claude、Codex CLI 與 [Hermes](/zh-TW/install/migrating-hermes)；外掛可註冊其他提供者。

<Tip>
如需面向使用者的操作指南，請參閱[從 Claude 遷移](/zh-TW/install/migrating-claude)與[從 Hermes 遷移](/zh-TW/install/migrating-hermes)。[遷移中心](/zh-TW/install/migrating)列出所有路徑。
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

執行不含其他旗標的 `openclaw migrate <provider>` 時，會建立計畫、顯示預覽，並在終端介面中於套用前提示確認。`openclaw migrate plan <provider>` 與 `openclaw migrate apply <provider>` 會使用相同旗標，將預覽與套用拆分成個別子命令。

<ParamField path="<provider>" type="string">
  已註冊遷移提供者的名稱，例如 `hermes`。執行 `openclaw migrate list` 可查看已安裝的提供者。
</ParamField>
<ParamField path="--dry-run" type="boolean">
  建立計畫後結束，不變更任何狀態。
</ParamField>
<ParamField path="--from <path>" type="string">
  覆寫來源狀態目錄。Hermes 預設為 `~/.hermes`，Codex 預設為 `~/.codex`（或 `$CODEX_HOME`），Claude 預設為 `~/.claude`。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  不經提示即匯入支援的憑證。互動式套用會在匯入偵測到的驗證憑證前詢問，且預設選取「是」；非互動式 `--yes` 必須搭配 `--include-secrets` 才能匯入憑證。
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  跳過驗證憑證匯入，包括互動式提示。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  當計畫回報衝突時，允許套用作業取代現有目標。
</ParamField>
<ParamField path="--yes" type="boolean">
  跳過確認提示。非互動模式下為必填。
</ParamField>
<ParamField path="--skill <name>" type="string">
  依技能名稱或項目 ID 選取一個技能複製項目。重複使用此旗標可遷移多個技能。省略時，互動式 Codex 遷移會顯示核取方塊選擇器，而非互動式遷移會保留所有已規劃的技能。
</ParamField>
<ParamField path="--plugin <name>" type="string">
  依外掛名稱或項目 ID 選取一個 Codex 外掛安裝項目。重複使用此旗標可遷移多個 Codex 外掛。省略時，互動式 Codex 遷移會顯示原生 Codex 外掛核取方塊選擇器，而非互動式遷移會保留所有已規劃的外掛。僅適用於由 Codex 應用程式伺服器清單發現、從原始碼安裝的 `openai-curated` Codex 外掛。
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  僅限 Codex。在規劃原生外掛啟用前，強制重新遍歷來源 Codex 應用程式伺服器的 `app/list`。預設關閉，以維持快速的遷移規劃。
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  遷移前備份封存檔的路徑或目錄。會原樣傳遞給 `openclaw backup create`。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  跳過套用前備份。存在本機 OpenClaw 狀態時，必須搭配 `--force`。
</ParamField>
<ParamField path="--force" type="boolean">
  當套用作業原本會拒絕跳過備份時，必須與 `--no-backup` 一同使用。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 輸出計畫或套用結果。使用 `--json` 但未指定 `--yes` 時，套用作業只會輸出計畫，不會變更狀態。
</ParamField>

## 安全模型

`openclaw migrate` 採取預覽優先模式。

<AccordionGroup>
  <Accordion title="套用前預覽">
    在任何變更發生前，提供者會傳回逐項計畫，其中包括衝突、跳過的項目與敏感項目。JSON 計畫、套用輸出與遷移報告會遮蔽巢狀且看似機密的鍵，例如 API 金鑰、權杖、授權標頭、Cookie 與密碼。

    除非設定 `--yes`，否則 `openclaw migrate apply <provider>` 會預覽計畫，並在變更狀態前提示確認。在非互動模式下，套用作業必須指定 `--yes`。

  </Accordion>
  <Accordion title="備份">
    套用作業會在套用遷移前建立並驗證 OpenClaw 備份。如果尚不存在本機 OpenClaw 狀態，則會跳過備份步驟並繼續遷移。若要在狀態已存在時跳過備份，請同時傳入 `--no-backup` 與 `--force`。
  </Accordion>
  <Accordion title="衝突">
    當計畫中存在衝突時，套用作業會拒絕繼續。請檢閱計畫；若確實要取代現有目標，再加上 `--overwrite` 重新執行。提供者仍可能在遷移報告目錄中，為被覆寫的檔案建立項目層級的備份。
  </Accordion>
  <Accordion title="機密資料">
    互動式套用會詢問是否匯入偵測到的驗證憑證，且預設選取「是」。使用 `--no-auth-credentials` 可跳過這些憑證；若要搭配 `--yes` 進行無人值守的憑證匯入，請使用 `--include-secrets`。
  </Accordion>
</AccordionGroup>

## Claude 提供者

內建 Claude 提供者預設會在 `~/.claude` 偵測 Claude Code 狀態。使用 `--from <path>` 可匯入指定的 Claude Code 主目錄或專案根目錄。

<Tip>
如需面向使用者的操作指南，請參閱[從 Claude 遷移](/zh-TW/install/migrating-claude)。
</Tip>

### Claude 匯入的內容

- 將專案的 `CLAUDE.md` 與 `.claude/CLAUDE.md` 匯入 OpenClaw 代理工作區（`AGENTS.md`）。
- 將使用者的 `~/.claude/CLAUDE.md` 附加至工作區的 `USER.md`。
- 匯入專案 `.mcp.json`、Claude Code `~/.claude.json`（包括其各專案項目），以及 Claude Desktop `claude_desktop_config.json` 中的 MCP 伺服器定義。
- 匯入含有 `SKILL.md` 的 Claude 技能目錄（使用者的 `~/.claude/skills` 與專案的 `.claude/skills`）。
- 將 Claude 命令 Markdown 檔案（使用者的 `~/.claude/commands` 與專案的 `.claude/commands`）轉換成僅能手動叫用的 OpenClaw 技能。

### 封存與需手動檢閱的狀態

Claude 鉤子、權限、環境預設值、專案 `CLAUDE.local.md`、`.claude/rules`、使用者與專案的 `agents/` 目錄，以及專案歷程記錄（`~/.claude` 下的 `projects`、`cache`、`plans`）會保留於遷移報告中，或回報為需手動檢閱的項目。OpenClaw 不會自動執行鉤子、複製廣泛的允許清單，或匯入 OAuth／Desktop 憑證狀態。

## Codex 提供者

內建 Codex 提供者預設會在 `~/.codex` 偵測 Codex CLI 狀態；若已設定 `CODEX_HOME` 環境變數，則會改用該位置。使用 `--from <path>` 可清查指定的 Codex 主目錄。

當您要移轉至 OpenClaw Codex 執行環境，並希望審慎提升實用的個人 Codex CLI 資產時，請使用此提供者。本機 Codex 應用程式伺服器啟動時會使用每個代理各自的 `CODEX_HOME`，因此預設不會讀取您的個人 `~/.codex`。一般程序仍會繼承 `HOME`，所以 Codex 可以看到共用的 `$HOME/.agents/*` 技能／外掛市集項目，且子程序可以找到使用者主目錄中的設定與權杖。

在互動式終端機中執行 `openclaw migrate codex`，會先預覽完整計畫，接著在最終套用確認前開啟核取方塊選擇器。系統會先提示選擇技能複製項目。使用 `Toggle all on` 或 `Toggle all off` 可進行批次選取。按下空白鍵可切換資料列，或按 Enter 啟用反白顯示的資料列並繼續。已規劃的技能一開始為勾選狀態，有衝突的技能一開始為未勾選狀態，而 `Skip for now` 會在本次執行中跳過技能複製，但仍繼續進入外掛選擇。若存在可遷移、從原始碼安裝的精選 Codex 外掛，且未提供 `--plugin`，遷移接著會提示依外掛名稱啟用原生 Codex 外掛。除非目標 OpenClaw Codex 外掛設定已經包含該外掛，否則外掛項目一開始會呈勾選狀態。現有目標外掛一開始為未勾選狀態，並顯示類似 `conflict: plugin exists` 的衝突提示；選擇 `Toggle all off` 可在該次執行中不遷移任何原生 Codex 外掛，選擇 `Skip for now` 則會在套用前停止。

若要進行指令碼化或精確的執行，請明確選取一個或多個技能或外掛：

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex 匯入的內容

- `$CODEX_HOME/skills` 下的 Codex CLI 技能目錄，但不包括 Codex 的 `.system` 快取。
- `$HOME/.agents/skills` 下的個人 AgentSkills，複製到目前的 OpenClaw 代理工作區，以便由各代理分別擁有。
- 透過 Codex 應用程式伺服器 `plugin/list` 發現、從原始碼安裝的 `openai-curated` Codex 外掛。規劃時會為每個已啟用且已安裝的外掛讀取 `plugin/read`。

由應用程式支援的外掛遷移設有額外關卡：

- 由應用程式支援的外掛要求來源 Codex 應用程式伺服器帳戶必須是 ChatGPT 訂閱帳戶。非 ChatGPT 帳戶或缺少帳戶的回應會以 `codex_subscription_required` 為由跳過。
- 遷移預設不會呼叫來源 `app/list`，因此通過帳戶關卡、由應用程式支援的外掛會在未驗證來源應用程式可存取性的情況下納入規劃，而帳戶查詢的傳輸失敗會以 `codex_account_unavailable` 為由跳過。
- 傳入 `--verify-plugin-apps` 可強制取得全新的來源 `app/list` 快照，並要求每個擁有的應用程式皆存在、已啟用且可存取，才會規劃原生啟用。在此模式下，帳戶查詢的傳輸失敗會改由來源應用程式清單驗證處理。快照只會保留在目前程序的記憶體中；絕不會寫入遷移輸出或目標設定。

停用的外掛、無法讀取的外掛詳細資料、受訂閱限制的來源帳戶，以及（設定 `--verify-plugin-apps` 時）缺少、停用或無法存取的應用程式，都會成為具有型別化原因、需手動處理的跳過項目，而不會成為目標設定項目。即使目標應用程式伺服器已回報該外掛已安裝且啟用，套用作業仍會針對每個已選取且符合資格的外掛呼叫應用程式伺服器的 `plugin/install`。已遷移的 Codex 外掛僅能用於選取原生 Codex 執行環境的工作階段；它們不會提供給 OpenClaw 提供者執行、ACP 對話繫結或其他執行環境。

### 需手動檢閱的 Codex 狀態

Codex `config.toml`、原生 `hooks/hooks.json`、非精選市集、並非從原始碼安裝之精選外掛的快取外掛套件，以及未通過來源訂閱關卡、從原始碼安裝的外掛，都不會自動啟用。設定 `--verify-plugin-apps` 時，未通過來源應用程式清單關卡的外掛也會被跳過。所有這些內容都會複製到遷移報告中，或在報告中列出，以供手動檢閱。

對於已遷移且從原始碼安裝的精選外掛，套用作業會寫入：

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- 每個已選取外掛各一個明確的外掛項目，其中包含 `marketplaceName: "openai-curated"` 與 `pluginName`

遷移絕不會寫入 `plugins["*"]`，也絕不會儲存本機市集快取路徑。

略過的外掛不會寫入目標設定。來源端的訂閱失敗會在手動處理項目中回報，並附上具型別的原因：`codex_subscription_required`、`codex_account_unavailable`、`plugin_disabled` 或 `plugin_read_unavailable`。使用 `--verify-plugin-apps` 時，來源應用程式清單失敗也可能顯示為 `app_inaccessible`、`app_disabled`、`app_missing` 或 `app_inventory_unavailable`。目標端需要驗證的安裝，會在受影響的外掛項目上回報 `status: "skipped"`、`reason: "auth_required"` 與經過清理的應用程式識別碼；其明確設定項目會以停用狀態寫入，直到你重新授權並啟用它們。其他安裝失敗會產生限定於個別項目的 `error` 結果。

如果規劃期間無法取得 Codex app-server 外掛清單，遷移會改用快取的套件組合建議項目，而不會使整個遷移失敗。

## Hermes 提供者

隨附的 Hermes 提供者預設會偵測 `~/.hermes` 中的狀態。如果 Hermes 位於其他位置，請使用 `--from <path>`。

### Hermes 匯入的內容

- 從 `config.yaml` 匯入預設模型設定。
- 從 `providers` 和 `custom_providers` 匯入已設定的模型提供者及自訂 OpenAI 相容端點。
- 從 `mcp_servers` 或 `mcp.servers` 匯入 MCP 伺服器定義。
- 將 `SOUL.md` 和 `AGENTS.md` 匯入 OpenClaw 代理工作區。
- 將 `memories/MEMORY.md` 和 `memories/USER.md` 附加至工作區記憶檔案。
- 匯入 OpenClaw 檔案記憶的記憶設定預設值，並針對 Honcho 等外部記憶提供者建立封存或手動審查項目。
- 匯入 `skills/<name>/` 下包含 `SKILL.md` 檔案的 Skills。
- 從 `skills.config` 匯入各 Skills 的設定值。
- 在接受互動式憑證遷移，或設定 `--include-secrets` 時，從 OpenCode 的 `auth.json` 匯入 OpenCode OpenAI OAuth 憑證。Hermes `auth.json` 中的 OAuth 項目屬於舊版狀態，會回報為需要手動重新驗證 OpenAI 或由 doctor 修復。
- 在接受互動式憑證遷移，或設定 `--include-secrets` 時，從 Hermes `.env` 和 OpenCode `auth.json` 匯入支援的 API 金鑰與權杖。

### 支援的 `.env` 金鑰

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`.

### 僅封存狀態

OpenClaw 無法安全解讀的 Hermes 狀態會複製到遷移報告中以供手動審查，但不會載入目前使用中的 OpenClaw 設定或憑證。這能保留不透明或不安全的狀態，而不會假裝 OpenClaw 可以自動執行或信任它：`plugins/`、`sessions/`、`logs/`、`cron/`、`mcp-tokens/`、`state.db`。

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

執行階段中，外掛會呼叫 `api.registerMigrationProvider(...)`。提供者會實作 `detect`、`plan` 和 `apply`。核心負責命令列介面協調、備份原則、提示、JSON 輸出與衝突預先檢查。核心會將已審查的計畫傳入 `apply(ctx, plan)`；僅在為了相容性而未提供該引數時，提供者才可以重建計畫。

提供者外掛可以使用 `openclaw/plugin-sdk/migration` 建構項目及統計摘要，並使用 `openclaw/plugin-sdk/migration-runtime` 處理可感知衝突的檔案複製、僅封存的報告複製、快取的設定執行階段包裝器及遷移報告。

## 初始設定整合

當提供者偵測到已知來源時，初始設定可以提供遷移選項。`openclaw onboard --flow import` 和 `openclaw setup --wizard --import-from hermes` 都會使用相同的外掛遷移提供者，並且仍會在套用前顯示預覽。

<Note>
初始設定匯入需要全新的 OpenClaw 設定。如果你已有本機狀態，請先重設設定、憑證、工作階段及工作區。對於現有設定，先備份再覆寫或合併匯入的功能受功能閘控限制。
</Note>

## 相關內容

- [從 Hermes 遷移](/zh-TW/install/migrating-hermes)：面向使用者的操作說明。
- [從 Claude 遷移](/zh-TW/install/migrating-claude)：面向使用者的操作說明。
- [遷移](/zh-TW/install/migrating)：將 OpenClaw 移至新機器。
- [Doctor](/zh-TW/gateway/doctor)：套用遷移後的健康狀態檢查。
- [外掛](/zh-TW/tools/plugin)：外掛安裝與註冊。
