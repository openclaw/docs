---
read_when:
    - 你想從 Hermes 或其他代理系統遷移到 OpenClaw
    - 你正在新增一個由外掛擁有的遷移提供者
summary: '`openclaw migrate` 的命令列介面參考（從另一個代理系統匯入狀態）'
title: 遷移
x-i18n:
    generated_at: "2026-06-27T19:06:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90798fd24af0984e485753e251c87a5dd8fd0246e7c135a50e3532de93ba075e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

透過外掛擁有的遷移提供者，從另一個代理系統匯入狀態。內建提供者涵蓋 Codex 命令列介面狀態、[Claude](/zh-TW/install/migrating-claude) 和 [Hermes](/zh-TW/install/migrating-hermes)；第三方外掛可以註冊其他提供者。

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
  匯入支援的憑證而不提示。互動式套用會在匯入偵測到的驗證憑證前詢問，並預設選取是；非互動式 `--yes` 需要 `--include-secrets` 才會匯入這些憑證。
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  略過驗證憑證匯入，包括互動式提示。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  當計畫回報衝突時，允許套用取代現有目標。
</ParamField>
<ParamField path="--yes" type="boolean">
  略過確認提示。非互動模式中必須使用。
</ParamField>
<ParamField path="--skill <name>" type="string">
  依技能名稱或項目 ID 選取一個技能複製項目。重複此旗標可遷移多個技能。省略時，互動式 Codex 遷移會顯示核取方塊選取器，非互動式遷移則保留所有已規劃技能。
</ParamField>
<ParamField path="--plugin <name>" type="string">
  依外掛名稱或項目 ID 選取一個 Codex 外掛安裝項目。重複此旗標可遷移多個 Codex 外掛。省略時，互動式 Codex 遷移會顯示原生 Codex 外掛核取方塊選取器，非互動式遷移則保留所有已規劃外掛。這只適用於 Codex 應用程式伺服器清查探索到、來源已安裝的 `openai-curated` Codex 外掛。
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  僅限 Codex。在規劃原生外掛啟用前，強制重新周遊來源 Codex 應用程式伺服器 `app/list`。預設關閉，以維持遷移規劃快速。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  略過套用前備份。本機 OpenClaw 狀態存在時需要 `--force`。
</ParamField>
<ParamField path="--force" type="boolean">
  當套用原本會拒絕略過備份時，必須與 `--no-backup` 一起使用。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 印出計畫或套用結果。搭配 `--json` 且沒有 `--yes` 時，套用會印出計畫且不修改狀態。
</ParamField>

## 安全模型

`openclaw migrate` 採用先預覽模式。

<AccordionGroup>
  <Accordion title="套用前預覽">
    提供者會在任何變更發生前回傳逐項計畫，包括衝突、略過項目和敏感項目。JSON 計畫、套用輸出和遷移報告會遮蔽巢狀且看起來像祕密的鍵，例如 API 金鑰、權杖、授權標頭、Cookie 和密碼。

    `openclaw migrate apply <provider>` 會預覽計畫，並在變更狀態前提示，除非已設定 `--yes`。在非互動模式中，套用需要 `--yes`。

  </Accordion>
  <Accordion title="備份">
    套用會在執行遷移前建立並驗證 OpenClaw 備份。如果尚無本機 OpenClaw 狀態，會略過備份步驟，且遷移可繼續。若要在狀態存在時略過備份，請同時傳入 `--no-backup` 和 `--force`。
  </Accordion>
  <Accordion title="衝突">
    當計畫有衝突時，套用會拒絕繼續。檢閱計畫，若確定要取代現有目標，再使用 `--overwrite` 重新執行。提供者仍可能在遷移報告目錄中，為被覆寫的檔案寫入項目層級備份。
  </Accordion>
  <Accordion title="祕密">
    互動式套用會詢問是否匯入偵測到的驗證憑證，並預設選取是。使用 `--no-auth-credentials` 可略過它們，或使用 `--include-secrets` 搭配 `--yes` 進行無人值守的憑證匯入。
  </Accordion>
</AccordionGroup>

## Claude 提供者

內建 Claude 提供者預設會在 `~/.claude` 偵測 Claude Code 狀態。使用 `--from <path>` 可匯入特定 Claude Code 主目錄或專案根目錄。

<Tip>
如需面向使用者的逐步指南，請參閱[從 Claude 遷移](/zh-TW/install/migrating-claude)。
</Tip>

### Claude 會匯入的內容

- 將專案 `CLAUDE.md` 和 `.claude/CLAUDE.md` 匯入 OpenClaw 代理工作區。
- 使用者 `~/.claude/CLAUDE.md` 追加到工作區 `USER.md`。
- 來自專案 `.mcp.json`、Claude Code `~/.claude.json` 和 Claude Desktop `claude_desktop_config.json` 的 MCP 伺服器定義。
- 包含 `SKILL.md` 的 Claude 技能目錄。
- 轉換為 OpenClaw 技能且僅限手動叫用的 Claude 命令 Markdown 檔案。

### 封存與手動審查狀態

Claude 鉤子、權限、環境預設值、本機記憶、路徑範圍規則、子代理、快取、計畫和專案歷史都會保留在遷移報告中，或回報為手動審查項目。OpenClaw 不會自動執行鉤子、複製廣泛允許清單，或匯入 OAuth/Desktop 憑證狀態。

## Codex 提供者

內建 Codex 提供者預設會在 `~/.codex` 偵測 Codex 命令列介面狀態，或在設定 `CODEX_HOME` 環境變數時於該位置偵測。使用 `--from <path>` 可清查特定 Codex 主目錄。

當你要移至 OpenClaw Codex harness，並希望有意識地提升有用的個人 Codex 命令列介面資產時，請使用此提供者。本機 Codex 應用程式伺服器啟動會使用每個代理各自的 `CODEX_HOME`，因此預設不會讀取你的個人 `~/.codex`。一般程序的 `HOME` 仍會繼承，因此 Codex 可以看到共用的 `$HOME/.agents/*` 技能／外掛 marketplace 項目，且子程序可以找到使用者主目錄設定與權杖。

在互動式終端機中執行 `openclaw migrate codex` 會預覽完整計畫，然後在最終套用確認前開啟核取方塊選取器。會先提示技能複製項目。使用 `Toggle all on` 或 `Toggle all off` 進行批次選取。按 Space 可切換列，或按 Enter 啟用反白列並繼續。已規劃技能一開始會勾選，衝突技能一開始不勾選，而 `Skip for now` 會略過此次執行的技能複製，同時仍繼續進入外掛選取。當來源已安裝的 curated Codex 外掛可遷移且未提供 `--plugin` 時，遷移接著會依外掛名稱提示原生 Codex 外掛啟用。外掛項目一開始會勾選，除非目標 OpenClaw Codex 外掛設定已經有該外掛。現有目標外掛一開始不勾選，並顯示衝突提示，例如 `conflict: plugin exists`；選擇 `Toggle all off` 可在該次執行中不遷移任何原生 Codex 外掛，或選擇 `Skip for now` 在套用前停止。對於指令碼化或精確執行，請對每個技能傳入一次 `--skill <name>`，例如：

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

使用 `--plugin <name>` 可在非互動模式中，將原生 Codex 外掛遷移限制為一個或多個來源已安裝的 curated 外掛：

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex 會匯入的內容

- `$CODEX_HOME/skills` 下的 Codex 命令列介面技能目錄，不包括 Codex 的 `.system` 快取。
- `$HOME/.agents/skills` 下的個人 AgentSkills，當你需要每個代理自行擁有時，會複製到目前的 OpenClaw 代理工作區。
- 透過 Codex 應用程式伺服器 `plugin/list` 探索到、來源已安裝的 `openai-curated` Codex 外掛。規劃會對每個已啟用且已安裝的外掛讀取 `plugin/read`。以應用程式支援的外掛要求來源 Codex 應用程式伺服器帳戶回應是 ChatGPT 訂閱帳戶；非 ChatGPT 或缺少帳戶回應會以 `codex_subscription_required` 略過。預設情況下，遷移不會呼叫來源 `app/list`，因此通過帳戶門檻的應用程式支援外掛，會在未驗證來源應用程式可存取性的情況下納入規劃，而帳戶查詢傳輸失敗會以 `codex_account_unavailable` 略過。當你希望遷移強制取得新的來源 `app/list` 快照，並要求每個擁有的應用程式都存在、已啟用且可存取，才規劃原生啟用時，請傳入 `--verify-plugin-apps`。在該模式中，帳戶查詢傳輸失敗會落到來源應用程式清查驗證。來源應用程式清查快照會保留在目前程序的記憶體中；不會寫入遷移輸出或目標設定。已停用的外掛、無法讀取的外掛詳細資料、受訂閱限制的來源帳戶，以及在要求驗證時缺少的應用程式、已停用的應用程式、無法存取的應用程式或來源應用程式清查失敗，都會變成帶有型別化原因的手動略過項目，而不是目標設定項目。
  套用會對每個選取且符合資格的外掛呼叫應用程式伺服器 `plugin/install`，即使目標應用程式伺服器已回報該外掛已安裝且已啟用。已遷移的 Codex 外掛只能在選取原生 Codex harness 的工作階段中使用；不會公開給 OpenClaw 提供者執行、ACP 對話繫結或其他 harness。

### 手動審查 Codex 狀態

Codex `config.toml`、原生 `hooks/hooks.json`、非 curated marketplace、不是來源已安裝 curated 外掛的快取外掛 bundle，以及未通過來源訂閱門檻的來源已安裝外掛，都不會自動啟用。設定 `--verify-plugin-apps` 時，未通過來源應用程式清查門檻的外掛也會被略過。它們會被複製或回報到遷移報告中以供手動審查。

對於已遷移且來源已安裝的 curated 外掛，套用會寫入：

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- 每個選取的外掛都會有一個明確外掛項目，包含 `marketplaceName: "openai-curated"` 和 `pluginName`

遷移絕不會寫入 `plugins["*"]`，也絕不會儲存本機市集快取路徑。來源端訂閱失敗會回報在手動項目上，並附上型別化原因，例如 `codex_subscription_required`、`codex_account_unavailable`、`plugin_disabled` 或 `plugin_read_unavailable`。使用 `--verify-plugin-apps` 時，來源應用程式清單失敗也可能顯示為 `app_inaccessible`、`app_disabled`、`app_missing` 或 `app_inventory_unavailable`。略過的外掛不會寫入目標設定。
目標端需要驗證的安裝會回報在受影響的外掛項目上，並附上 `status: "skipped"`、`reason: "auth_required"`，以及經過清理的應用程式識別碼。
它們的明確設定項目會以停用狀態寫入，直到你重新授權並啟用它們。其他安裝失敗會是限定於項目的 `error` 結果。

如果 Codex 應用程式伺服器外掛清單在規劃期間無法使用，遷移會退回使用快取的套件建議項目，而不是讓整個遷移失敗。

## Hermes 提供者

內建 Hermes 提供者預設會偵測 `~/.hermes` 的狀態。當 Hermes 位於其他位置時，請使用 `--from <path>`。

### Hermes 會匯入的內容

- 來自 `config.yaml` 的預設模型設定。
- 來自 `providers` 和 `custom_providers` 的已設定模型提供者與自訂 OpenAI 相容端點。
- 來自 `mcp_servers` 或 `mcp.servers` 的 MCP 伺服器定義。
- 將 `SOUL.md` 和 `AGENTS.md` 匯入 OpenClaw 代理工作區。
- 將 `memories/MEMORY.md` 和 `memories/USER.md` 附加到工作區記憶檔案。
- OpenClaw 檔案記憶的記憶設定預設值，以及外部記憶提供者（例如 Honcho）的封存或手動審查項目。
- 位於 `skills/<name>/` 底下且包含 `SKILL.md` 檔案的 Skills。
- 來自 `skills.config` 的每個 Skills 設定值。
- 當互動式憑證遷移被接受，或設定 `--include-secrets` 時，匯入來自 OpenCode `auth.json` 的 OpenCode OpenAI OAuth 憑證。Hermes `auth.json` OAuth 項目是舊版狀態，會回報為需要手動 OpenAI 重新授權或 doctor 修復。
- 當互動式憑證遷移被接受，或設定 `--include-secrets` 時，匯入來自 Hermes `.env` 和 OpenCode `auth.json` 的受支援 API 金鑰與權杖。

### 支援的 `.env` 金鑰

- `AI_GATEWAY_API_KEY`
- `ALIBABA_API_KEY`
- `ANTHROPIC_API_KEY`
- `ARCEEAI_API_KEY`
- `CEREBRAS_API_KEY`
- `CHUTES_API_KEY`
- `CLOUDFLARE_AI_GATEWAY_API_KEY`
- `COPILOT_GITHUB_TOKEN`
- `DASHSCOPE_API_KEY`
- `DEEPINFRA_API_KEY`
- `DEEPSEEK_API_KEY`
- `FIREWORKS_API_KEY`
- `GEMINI_API_KEY`
- `GH_TOKEN`
- `GITHUB_TOKEN`
- `GLM_API_KEY`
- `GOOGLE_API_KEY`
- `GROQ_API_KEY`
- `HF_TOKEN`
- `HUGGINGFACE_HUB_TOKEN`
- `KILOCODE_API_KEY`
- `KIMICODE_API_KEY`
- `KIMI_API_KEY`
- `MINIMAX_API_KEY`
- `MINIMAX_CODING_API_KEY`
- `MISTRAL_API_KEY`
- `MODELSTUDIO_API_KEY`
- `MOONSHOT_API_KEY`
- `NVIDIA_API_KEY`
- `OPENAI_API_KEY`
- `OPENCODE_API_KEY`
- `OPENCODE_GO_API_KEY`
- `OPENCODE_ZEN_API_KEY`
- `OPENROUTER_API_KEY`
- `QIANFAN_API_KEY`
- `QWEN_API_KEY`
- `TOGETHER_API_KEY`
- `VENICE_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`
- `ZAI_API_KEY`
- `Z_AI_API_KEY`

### 僅封存狀態

OpenClaw 無法安全解讀的 Hermes 狀態會複製到遷移報告中以供手動審查，但不會載入即時 OpenClaw 設定或憑證。這會保留不透明或不安全的狀態，同時不假裝 OpenClaw 可以自動執行或信任它：

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

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

執行階段外掛會呼叫 `api.registerMigrationProvider(...)`。提供者實作 `detect`、`plan` 和 `apply`。核心負責命令列介面協調、備份政策、提示、JSON 輸出，以及衝突預檢。核心會將已審查的計畫傳入 `apply(ctx, plan)`，而提供者只有在該引數因相容性而缺席時，才可以重建計畫。

提供者外掛可以使用 `openclaw/plugin-sdk/migration` 來建構項目與摘要計數，並使用 `openclaw/plugin-sdk/migration-runtime` 進行具衝突感知的檔案複製、僅封存報告複製、快取設定執行階段包裝器，以及遷移報告。

## 入門設定整合

當提供者偵測到已知來源時，入門設定可以提供遷移。`openclaw onboard --flow import` 和 `openclaw setup --wizard --import-from hermes` 都使用相同的外掛遷移提供者，且仍會在套用前顯示預覽。

<Note>
入門設定匯入需要全新的 OpenClaw 設定。如果你已經有本機狀態，請先重設設定、憑證、工作階段和工作區。備份加覆寫或合併匯入針對現有設定受到功能旗標控管。
</Note>

## 相關

- [從 Hermes 遷移](/zh-TW/install/migrating-hermes)：面向使用者的逐步說明。
- [從 Claude 遷移](/zh-TW/install/migrating-claude)：面向使用者的逐步說明。
- [遷移](/zh-TW/install/migrating)：將 OpenClaw 移到新機器。
- [Doctor](/zh-TW/gateway/doctor)：套用遷移後的健康檢查。
- [外掛](/zh-TW/tools/plugin)：外掛安裝與註冊。
